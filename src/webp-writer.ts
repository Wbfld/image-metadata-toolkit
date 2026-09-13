import { applyTiffEditTransaction, serializeTiff } from "./tiff.js";
import { resolveLimits } from "./security/limits.js";
import { verifyPreservationSync, type PreservationReport, type PreservationVerifierOptions } from "./preservation.js";
import type {
  EditFailure,
  EditOperation,
  EditOperationKind,
  EditOperationStatus,
  EditPolicyEvidence,
  EditTarget,
  SecurityLimits,
} from "./types.js";

const RIFF_HEADER = "RIFF";
const WEBP_FORM = "WEBP";
const METADATA_BITS = 0x2c;
const IMAGE_PAYLOAD_TYPES = new Set(["VP8 ", "VP8L", "ALPH", "ANMF"]);

export type WebpBlockKind = "exif" | "xmp" | "icc";

export interface WebpBlockEdit {
  readonly op: "add" | "replace" | "remove";
  readonly kind: WebpBlockKind;
  readonly blockId?: string;
  /** TIFF bytes, UTF-8 XMP, or complete ICC profile bytes. */
  readonly data?: string | Uint8Array;
}

export interface WebpRewriteOptions {
  readonly blocks: readonly WebpBlockEdit[];
  readonly limits?: Partial<SecurityLimits>;
  readonly verify?: boolean;
  readonly duplicatePolicy?: "preserve" | "replace-target" | "deduplicate-equivalent" | "reject";
  /** Independent encoded-payload verification policy. Enabled with the normal `verify` default. */
  readonly preservation?: PreservationVerifierOptions;
}

export interface WebpChunk {
  readonly id: string;
  readonly type: string;
  readonly start: number;
  readonly end: number;
  readonly dataStart: number;
  readonly dataEnd: number;
  readonly length: number;
  readonly kind: WebpBlockKind | "other";
}

export interface WebpIndex {
  readonly chunks: readonly WebpChunk[];
  readonly dimensions: { readonly width: number; readonly height: number };
  readonly hasVp8x: boolean;
  readonly alpha: boolean;
  readonly animation: boolean;
}

export interface WebpPlacedChange {
  readonly blockId: string;
  readonly offset: number;
  readonly length: number;
  readonly kind: "removed" | "rewritten" | "inserted";
}

export interface WebpRewriteResult {
  readonly data: Uint8Array;
  readonly byteChanges: readonly WebpPlacedChange[];
  readonly preservedPayloads: readonly { readonly id: string; readonly before: Uint8Array; readonly after: Uint8Array }[];
  readonly inputBytes: number;
  readonly outputBytes: number;
  /** Checked, JSON-safe preservation evidence; null only when `verify: false` was requested. */
  readonly preservation: PreservationReport | null;
}

export type WebpWriterErrorCode = "INVALID_VALUE" | "UNSAFE_STRUCTURE" | "LIMIT_EXCEEDED" | "UNSUPPORTED_STRUCTURE" | "VERIFICATION_FAILURE";

export class WebpWriterError extends Error {
  public readonly code: WebpWriterErrorCode;
  public readonly offset: number | undefined;

  public constructor(code: WebpWriterErrorCode, message: string, offset?: number) {
    super(message);
    this.name = "WebpWriterError";
    this.code = code;
    this.offset = offset;
  }
}

export interface WebpTransactionOperation {
  readonly operationId: string;
  readonly operation: EditOperationKind | null;
  readonly status: EditOperationStatus;
  readonly failure: EditFailure | null;
  readonly appliedCount: number;
  readonly matchedFieldIds: readonly string[];
  readonly matchedBlockIds: readonly string[];
  readonly preservedUnknownCandidates: number | null;
}

export interface WebpEditTransaction {
  readonly output: Uint8Array | null;
  readonly operations: readonly WebpTransactionOperation[];
  readonly before: WebpIndex;
  readonly after: WebpIndex | null;
  readonly byteChanges: readonly WebpPlacedChange[];
  readonly preservedPayloads: readonly { readonly id: string; readonly before: Uint8Array; readonly after: Uint8Array }[];
  readonly verified: boolean;
  readonly preservation?: PreservationReport;
}

interface ChunkWork {
  readonly original: WebpChunk;
  readonly originalBytes: Uint8Array;
  bytes: Uint8Array;
  removed: boolean;
}

interface PendingInsert {
  readonly anchor: number;
  readonly id: string;
  readonly bytes: Uint8Array;
}

function ascii(value: string): Uint8Array {
  const result = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) result[index] = value.charCodeAt(index);
  return result;
}

function isAscii(bytes: Uint8Array, offset: number, value: string): boolean {
  if (offset < 0 || offset + value.length > bytes.length) return false;
  for (let index = 0; index < value.length; index += 1) if (bytes[offset + index] !== value.charCodeAt(index)) return false;
  return true;
}

function readUint24(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8) | ((bytes[offset + 2] ?? 0) << 16);
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) + (bytes[offset + 1] ?? 0) * 0x100 + (bytes[offset + 2] ?? 0) * 0x10000 + (bytes[offset + 3] ?? 0) * 0x1000000;
}

function readUint32BigEndian(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) * 0x1000000 + (bytes[offset + 1] ?? 0) * 0x10000 + (bytes[offset + 2] ?? 0) * 0x100 + (bytes[offset + 3] ?? 0);
}

function writeUint32(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}

function checkedAdd(left: number, right: number, label: string): number {
  const value = left + right;
  if (!Number.isSafeInteger(value) || left < 0 || right < 0) throw new WebpWriterError("LIMIT_EXCEEDED", `${label} arithmetic exceeded the safe integer range.`);
  return value;
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) if (left[index] !== right[index]) return false;
  return true;
}

function kindFor(type: string): WebpBlockKind | "other" {
  if (type === "EXIF") return "exif";
  if (type === "XMP ") return "xmp";
  if (type === "ICCP") return "icc";
  return "other";
}

function dimensionsFromVp8(bytes: Uint8Array, chunk: WebpChunk): { readonly width: number; readonly height: number } | null {
  const payload = bytes.subarray(chunk.dataStart, chunk.dataEnd);
  if (chunk.type === "VP8X" && payload.length === 10) return { width: readUint24(payload, 4) + 1, height: readUint24(payload, 7) + 1 };
  if (chunk.type === "VP8L" && payload.length >= 5 && payload[0] === 0x2f) {
    const b1 = payload[1] ?? 0;
    const b2 = payload[2] ?? 0;
    const b3 = payload[3] ?? 0;
    const b4 = payload[4] ?? 0;
    if ((b4 & 0xe0) !== 0) return null;
    return { width: 1 + b1 + ((b2 & 0x3f) << 8), height: 1 + (b2 >> 6) + (b3 << 2) + ((b4 & 0x0f) << 10) };
  }
  if (chunk.type === "VP8 " && payload.length >= 10 && ((payload[0] ?? 1) & 1) === 0 && ((payload[0] ?? 0) & 0x10) !== 0 && payload[3] === 0x9d && payload[4] === 0x01 && payload[5] === 0x2a) {
    const width = ((payload[6] ?? 0) | ((payload[7] ?? 0) << 8)) & 0x3fff;
    const height = ((payload[8] ?? 0) | ((payload[9] ?? 0) << 8)) & 0x3fff;
    return width > 0 && height > 0 ? { width, height } : null;
  }
  return null;
}

function parseWebpIndex(input: Uint8Array, limits: SecurityLimits): WebpIndex {
  if (!(input instanceof Uint8Array)) throw new WebpWriterError("INVALID_VALUE", "WebP writer input must be a Uint8Array.");
  if (input.length > limits.maxInputBytes) throw new WebpWriterError("LIMIT_EXCEEDED", `WebP input exceeds the configured ${limits.maxInputBytes}-byte limit.`);
  if (input.length < 20 || !isAscii(input, 0, RIFF_HEADER) || !isAscii(input, 8, WEBP_FORM)) throw new WebpWriterError("UNSAFE_STRUCTURE", "WebP does not begin with a complete RIFF/WEBP header.");
  const riffEnd = checkedAdd(readUint32(input, 4), 8, "RIFF end");
  if (riffEnd !== input.length) throw new WebpWriterError("UNSAFE_STRUCTURE", "RIFF size does not match the supplied WebP bytes.", 4);
  const chunks: WebpChunk[] = [];
  let cursor = 12;
  let metadataBytes = 0;
  let dimensions: { readonly width: number; readonly height: number } | null = null;
  let hasVp8x = false;
  let alpha = false;
  let animation = false;
  let sawImage = false;
  while (cursor < riffEnd) {
    if (chunks.length >= limits.maxSegments) throw new WebpWriterError("LIMIT_EXCEEDED", `WebP contains more than ${limits.maxSegments} chunks.`, cursor);
    if (cursor > riffEnd - 8) throw new WebpWriterError("UNSAFE_STRUCTURE", "WebP chunk header is truncated.", cursor);
    const type = String.fromCharCode(input[cursor] ?? 0, input[cursor + 1] ?? 0, input[cursor + 2] ?? 0, input[cursor + 3] ?? 0);
    if (!/^[ -~]{4}$/u.test(type)) throw new WebpWriterError("UNSAFE_STRUCTURE", "WebP chunk type is invalid.", cursor);
    const length = readUint32(input, cursor + 4);
    if (length > limits.maxSegmentBytes) throw new WebpWriterError("LIMIT_EXCEEDED", "WebP chunk exceeds the configured segment limit.", cursor + 4);
    const dataStart = checkedAdd(cursor, 8, "WebP data offset");
    const dataEnd = checkedAdd(dataStart, length, "WebP data end");
    const end = checkedAdd(dataEnd, length & 1, "WebP chunk end");
    if (end > riffEnd) throw new WebpWriterError("UNSAFE_STRUCTURE", "WebP chunk extends beyond the RIFF boundary.", cursor);
    const kind = kindFor(type);
    if (kind !== "other") {
      metadataBytes = checkedAdd(metadataBytes, length, "WebP metadata byte count");
      if (metadataBytes > limits.maxMetadataBytes) throw new WebpWriterError("LIMIT_EXCEEDED", "WebP metadata exceeds the configured limit.", dataStart);
    }
    if (type === "VP8X") {
      if (length !== 10 || hasVp8x) throw new WebpWriterError("UNSAFE_STRUCTURE", "WebP VP8X must be one complete ten-byte chunk.", cursor);
      hasVp8x = true;
      const flags = input[dataStart] ?? 0;
      alpha = (flags & 0x10) !== 0;
      animation = (flags & 0x02) !== 0;
      dimensions = dimensionsFromVp8(input, { id: "", type, start: cursor, end, dataStart, dataEnd, length, kind });
      if (dimensions === null) throw new WebpWriterError("UNSAFE_STRUCTURE", "WebP VP8X dimensions are invalid.", dataStart);
    }
    if (type === "ALPH") alpha = true;
    if (type === "ANIM" || type === "ANMF") animation = true;
    if (IMAGE_PAYLOAD_TYPES.has(type)) sawImage = true;
    chunks.push({ id: `webp:${type.trim() || "chunk"}:${cursor}`, type, start: cursor, end, dataStart, dataEnd, length, kind });
    if (dimensions === null && (type === "VP8 " || type === "VP8L")) {
      const parsed = dimensionsFromVp8(input, chunks.at(-1) as WebpChunk);
      if (parsed !== null) dimensions = parsed;
    }
    cursor = end;
  }
  if (dimensions === null || !sawImage) throw new WebpWriterError("UNSAFE_STRUCTURE", "WebP must contain a valid image payload and dimensions.");
  if (hasVp8x && chunks[0]?.type !== "VP8X") throw new WebpWriterError("UNSAFE_STRUCTURE", "WebP VP8X must precede all other chunks.");
  if (animation && !hasVp8x) throw new WebpWriterError("UNSAFE_STRUCTURE", "Animated WebP requires VP8X.");
  return { chunks, dimensions, hasVp8x, alpha, animation };
}

function makeChunk(type: string, data: Uint8Array): Uint8Array {
  if (data.length > 0xffffffff) throw new WebpWriterError("LIMIT_EXCEEDED", "WebP chunk data exceeds the uint32 range.");
  const result = new Uint8Array(8 + data.length + (data.length & 1));
  result.set(ascii(type), 0);
  writeUint32(result, 4, data.length);
  result.set(data, 8);
  return result;
}

function valueBytes(data: string | Uint8Array | undefined, label: string, limits: SecurityLimits): Uint8Array {
  if (data === undefined) throw new WebpWriterError("INVALID_VALUE", `${label} requires data.`);
  const result = typeof data === "string" ? new TextEncoder().encode(data) : data.slice();
  if (result.length > limits.maxValueBytes) throw new WebpWriterError("LIMIT_EXCEEDED", `${label} exceeds the configured value limit.`);
  return result;
}

function makeBlock(edit: WebpBlockEdit, limits: SecurityLimits): Uint8Array {
  const data = valueBytes(edit.data, `WebP ${edit.kind}`, limits);
  if (edit.kind === "xmp") {
    try { new TextDecoder("utf-8", { fatal: true }).decode(data); } catch { throw new WebpWriterError("INVALID_VALUE", "WebP XMP data must be valid UTF-8."); }
    return makeChunk("XMP ", data);
  }
  if (edit.kind === "exif") {
    if (data.length < 8 || !((data[0] === 0x49 && data[1] === 0x49) || (data[0] === 0x4d && data[1] === 0x4d))) throw new WebpWriterError("INVALID_VALUE", "WebP EXIF data must be a complete TIFF payload.");
    return makeChunk("EXIF", data);
  }
  if (data.length < 132 || readUint32BigEndian(data, 0) !== data.length || data[36] !== 0x61 || data[37] !== 0x63 || data[38] !== 0x73 || data[39] !== 0x70) throw new WebpWriterError("INVALID_VALUE", "WebP ICC data must be a complete ICC profile.");
  return makeChunk("ICCP", data);
}

function matches(chunk: WebpChunk, edit: WebpBlockEdit): boolean {
  return chunk.kind === edit.kind && (edit.blockId === undefined || edit.blockId === chunk.id);
}

function makeVp8x(index: WebpIndex, metadata: ReadonlySet<WebpBlockKind>): Uint8Array {
  const data = new Uint8Array(10);
  data[0] = (index.alpha ? 0x10 : 0) | (index.animation ? 0x02 : 0) | (metadata.has("icc") ? 0x20 : 0) | (metadata.has("exif") ? 0x08 : 0) | (metadata.has("xmp") ? 0x04 : 0);
  const width = index.dimensions.width - 1;
  const height = index.dimensions.height - 1;
  data[4] = width & 0xff; data[5] = (width >>> 8) & 0xff; data[6] = (width >>> 16) & 0xff;
  data[7] = height & 0xff; data[8] = (height >>> 8) & 0xff; data[9] = (height >>> 16) & 0xff;
  return makeChunk("VP8X", data);
}

function rebuild(input: Uint8Array, index: WebpIndex, works: readonly ChunkWork[], inserts: readonly PendingInsert[], limits: SecurityLimits): { readonly data: Uint8Array; readonly changes: readonly WebpPlacedChange[] } {
  let size = 12;
  const ordered = [...inserts].sort((left, right) => left.anchor - right.anchor || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
  for (let number = 0; number < works.length; number += 1) {
    for (const insert of ordered) if (insert.anchor === number) size = checkedAdd(size, insert.bytes.length, "WebP output size");
    const work = works[number];
    if (work !== undefined && !work.removed) size = checkedAdd(size, work.bytes.length, "WebP output size");
  }
  if (size > limits.maxInputBytes || size > limits.maxAdapterOutputBytes) throw new WebpWriterError("LIMIT_EXCEEDED", `Generated WebP is ${size} bytes, above the configured output limit.`);
  const output = new Uint8Array(size);
  output.set(input.subarray(0, 12), 0);
  let cursor = 12;
  const changes: WebpPlacedChange[] = [];
  for (let number = 0; number < works.length; number += 1) {
    for (const insert of ordered) if (insert.anchor === number) {
      const start = cursor; output.set(insert.bytes, cursor); cursor += insert.bytes.length;
      changes.push({ blockId: insert.id, offset: start, length: insert.bytes.length, kind: "inserted" });
    }
    const work = works[number];
    if (work === undefined) throw new WebpWriterError("UNSAFE_STRUCTURE", "WebP chunk plan lost an entry.");
    if (work.removed) { changes.push({ blockId: work.original.id, offset: cursor, length: 0, kind: "removed" }); continue; }
    const start = cursor; output.set(work.bytes, cursor); cursor += work.bytes.length;
    if (!equalBytes(work.originalBytes, work.bytes)) changes.push({ blockId: work.original.id, offset: start, length: work.bytes.length, kind: "rewritten" });
  }
  if (cursor !== output.length) throw new WebpWriterError("VERIFICATION_FAILURE", "WebP output assembly did not consume its planned length.");
  writeUint32(output, 4, output.length - 8);
  return { data: output, changes };
}

function verify(input: Uint8Array, output: Uint8Array, before: WebpIndex, after: WebpIndex): readonly { readonly id: string; readonly before: Uint8Array; readonly after: Uint8Array }[] {
  if (before.dimensions.width !== after.dimensions.width || before.dimensions.height !== after.dimensions.height) throw new WebpWriterError("VERIFICATION_FAILURE", "WebP dimensions changed during metadata rewriting.");
  if (before.alpha !== after.alpha || before.animation !== after.animation) throw new WebpWriterError("VERIFICATION_FAILURE", "WebP alpha or animation relationship changed during metadata rewriting.");
  const beforePayloads = before.chunks.filter((chunk) => IMAGE_PAYLOAD_TYPES.has(chunk.type));
  const afterPayloads = after.chunks.filter((chunk) => IMAGE_PAYLOAD_TYPES.has(chunk.type));
  if (beforePayloads.length !== afterPayloads.length) throw new WebpWriterError("VERIFICATION_FAILURE", "WebP image payload chunk count changed during metadata rewriting.");
  return beforePayloads.map((chunk, number) => {
    const other = afterPayloads[number];
    if (other === undefined || other.type !== chunk.type) throw new WebpWriterError("VERIFICATION_FAILURE", `WebP image payload ${chunk.id} disappeared or changed type.`);
    const left = input.subarray(chunk.start, chunk.end).slice();
    const right = output.subarray(other.start, other.end).slice();
    if (!equalBytes(left, right)) throw new WebpWriterError("VERIFICATION_FAILURE", `WebP image payload ${chunk.id} changed during metadata rewriting.`);
    return { id: chunk.id, before: left, after: right };
  });
}

/** Rewrite WebP EXIF, XMP, and ICC chunks without touching encoded image payload chunks. */
export function rewriteWebpMetadata(input: Uint8Array, options: WebpRewriteOptions): WebpRewriteResult {
  const rawOptions: unknown = options;
  if (rawOptions === null || typeof rawOptions !== "object" || Array.isArray(rawOptions)) throw new WebpWriterError("INVALID_VALUE", "WebP writer options must be an object.");
  let limits: SecurityLimits;
  try { limits = resolveLimits(options.limits); } catch (error) { throw new WebpWriterError("INVALID_VALUE", error instanceof Error ? error.message : "WebP writer limits are invalid."); }
  if (!Array.isArray(options.blocks) || options.blocks.length === 0) throw new WebpWriterError("INVALID_VALUE", "WebP writer requires at least one block edit.");
  if (options.verify !== undefined && typeof options.verify !== "boolean") throw new WebpWriterError("INVALID_VALUE", "WebP writer verify must be boolean when supplied.");
  const rawPreservation: unknown = options.preservation;
  if (rawPreservation !== undefined && (rawPreservation === null || typeof rawPreservation !== "object" || Array.isArray(rawPreservation))) throw new WebpWriterError("INVALID_VALUE", "WebP preservation options must be an object.");
  const preservationOptions = rawPreservation as Record<string, unknown> | undefined;
  for (const key of ["colorPolicy", "orientationPolicy"] as const) {
    const value = preservationOptions?.[key];
    if (value !== undefined && value !== "preserve" && value !== "report-only" && value !== "allow-change") throw new WebpWriterError("INVALID_VALUE", `WebP preservation ${key} is not supported.`);
  }
  if (preservationOptions?.requireCompletePayloadExtraction !== undefined && typeof preservationOptions.requireCompletePayloadExtraction !== "boolean") throw new WebpWriterError("INVALID_VALUE", "WebP preservation requireCompletePayloadExtraction must be boolean.");
  const duplicatePolicy = options.duplicatePolicy ?? "preserve";
  if (!["preserve", "replace-target", "deduplicate-equivalent", "reject"].includes(duplicatePolicy)) throw new WebpWriterError("INVALID_VALUE", "WebP writer duplicatePolicy is not supported.");
  const index = parseWebpIndex(input, limits);
  const works: ChunkWork[] = index.chunks.map((chunk) => ({ original: chunk, originalBytes: input.subarray(chunk.start, chunk.end).slice(), bytes: input.subarray(chunk.start, chunk.end).slice(), removed: false }));
  const inserts: PendingInsert[] = [];
  let insertNumber = 0;
  for (const rawEdit of options.blocks) {
    if (rawEdit === null || typeof rawEdit !== "object" || Array.isArray(rawEdit)) throw new WebpWriterError("INVALID_VALUE", "WebP block edits must be objects.");
    const candidate = rawEdit as Record<string, unknown>;
    if (candidate.op !== "add" && candidate.op !== "replace" && candidate.op !== "remove") throw new WebpWriterError("INVALID_VALUE", "WebP block edit operation is not supported.");
    if (candidate.kind !== "exif" && candidate.kind !== "xmp" && candidate.kind !== "icc") throw new WebpWriterError("INVALID_VALUE", "WebP block edit kind is not supported.");
    const edit = candidate as unknown as WebpBlockEdit;
    const candidates = works.filter((work) => !work.removed && matches(work.original, edit));
    if (edit.op === "add") {
      if (edit.blockId !== undefined) throw new WebpWriterError("INVALID_VALUE", "WebP add operations cannot specify blockId.");
      inserts.push({ anchor: index.chunks.findIndex((chunk) => IMAGE_PAYLOAD_TYPES.has(chunk.type)), id: `webp:${edit.kind}:inserted:${insertNumber++}`, bytes: makeBlock(edit, limits) });
      continue;
    }
    if (candidates.length === 0) {
      if (edit.op === "replace") throw new WebpWriterError("INVALID_VALUE", `WebP ${edit.kind} replacement target was not found.`);
      continue;
    }
    if (duplicatePolicy === "reject" && candidates.length > 1 && edit.blockId === undefined) throw new WebpWriterError("INVALID_VALUE", `WebP ${edit.kind} has duplicate chunks under reject policy.`);
    const selected = edit.blockId === undefined && duplicatePolicy === "replace-target" ? candidates.slice(0, 1) : candidates;
    if (edit.op === "remove") {
      for (const work of selected) work.removed = true;
      continue;
    }
    const bytes = makeBlock(edit, limits);
    const first = selected[0];
    if (first === undefined) throw new WebpWriterError("UNSAFE_STRUCTURE", "WebP replacement selected no chunk.");
    first.bytes = bytes;
    for (const extra of selected.slice(1)) {
      if (duplicatePolicy === "deduplicate-equivalent" || edit.kind === "exif" || edit.kind === "icc") extra.removed = true;
      else extra.bytes = bytes.slice();
    }
  }
  let metadata = new Set(works.filter((work) => !work.removed).map((work) => work.original.kind).filter((kind): kind is WebpBlockKind => kind !== "other"));
  for (const insert of inserts) {
    const type = insert.bytes.subarray(0, 4);
    const kind = String.fromCharCode(...type) === "EXIF" ? "exif" : String.fromCharCode(...type) === "XMP " ? "xmp" : "icc";
    metadata = new Set([...metadata, kind]);
  }
  const vp8x = works.find((work) => !work.removed && work.original.type === "VP8X");
  if (vp8x !== undefined) {
    const data = vp8x.bytes.slice(8, 18);
    data[0] = ((data[0] ?? 0) & ~METADATA_BITS) | (metadata.has("icc") ? 0x20 : 0) | (metadata.has("exif") ? 0x08 : 0) | (metadata.has("xmp") ? 0x04 : 0);
    vp8x.bytes = makeChunk("VP8X", data);
  } else if (metadata.size > 0) {
    const imageAnchor = index.chunks.findIndex((chunk) => IMAGE_PAYLOAD_TYPES.has(chunk.type));
    if (imageAnchor < 0) throw new WebpWriterError("UNSUPPORTED_STRUCTURE", "WebP metadata promotion requires an image chunk.");
    inserts.push({ anchor: imageAnchor, id: `webp:VP8X:inserted:${insertNumber++}`, bytes: makeVp8x(index, metadata) });
  }
  const planned = rebuild(input, index, works, inserts, limits);
  const after = parseWebpIndex(planned.data, limits);
  const preservedPayloads = verify(input, planned.data, index, after);
  const preservation = options.verify === false
    ? null
    : verifyPreservationSync(input, planned.data, { colorPolicy: "report-only", orientationPolicy: "preserve", ...options.preservation, limits });
  if (preservation !== null && !preservation.successful) throw new WebpWriterError("VERIFICATION_FAILURE", `Independent WebP preservation verification failed: ${preservation.diagnostics.join(" ")}`);
  return { data: planned.data, byteChanges: planned.changes, preservedPayloads, inputBytes: input.length, outputBytes: planned.data.length, preservation };
}

function targetField(target: EditTarget): string | null {
  if (target.kind === "field") return target.fieldId;
  if (target.selector.kind === "field-id") return target.selector.fieldId;
  return null;
}

function targetFamily(target: EditTarget): string | null {
  if (target.kind === "selector" && target.selector.kind === "family") return target.selector.family;
  return targetField(target)?.split(":", 1)[0] ?? null;
}

function targetBlock(target: EditTarget): string | undefined {
  return target.kind === "selector" && target.selector.kind === "block" ? target.selector.blockId : undefined;
}

function editFailureCode(code: WebpWriterErrorCode): EditFailure["code"] {
  if (code === "UNSUPPORTED_STRUCTURE") return "UNSUPPORTED_OPERATION";
  if (code === "UNSAFE_STRUCTURE" || code === "LIMIT_EXCEEDED") return "UNSAFE_STRUCTURE";
  return code;
}

function statusForFailure(code: EditFailure["code"]): Exclude<EditOperationStatus, "applied"> {
  switch (code) {
    case "INVALID_VALUE": return "invalid-value";
    case "UNSAFE_STRUCTURE": return "unsafe-structure";
    case "POLICY_FAILURE": return "policy-failure";
    case "VERIFICATION_FAILURE": return "verification-failure";
    case "UNSUPPORTED_OPERATION": return "unsupported";
  }
}

function operationResult(operation: EditOperation, matchedBlockIds: readonly string[], appliedCount: number, matchedFieldIds: readonly string[] = []): WebpTransactionOperation {
  return { operationId: operation.operationId, operation: operation.op, status: "applied", failure: null, appliedCount, matchedFieldIds, matchedBlockIds, preservedUnknownCandidates: null };
}

function operationFailure(operation: EditOperation, item: EditFailure): WebpTransactionOperation {
  return { operationId: operation.operationId, operation: operation.op, status: statusForFailure(item.code), failure: item, appliedCount: 0, matchedFieldIds: [], matchedBlockIds: [], preservedUnknownCandidates: null };
}

function isExifOperation(operation: EditOperation): boolean {
  const field = operation.op === "set" || operation.op === "delete" ? targetField(operation.target) : null;
  return field !== null && (field.startsWith("EXIF:") || field.startsWith("normalized:"));
}

function mappedExifOperation(operation: EditOperation): EditOperation {
  if (operation.op !== "set" && operation.op !== "delete") return operation;
  const field = targetField(operation.target);
  if (field === null || !field.startsWith("normalized:")) return operation;
  const map: Readonly<Record<string, string>> = { Make: "010f", Model: "0110", Orientation: "0112", DateTime: "0132", Artist: "013b", Software: "0131", Copyright: "8298" };
  const tag = map[field.slice("normalized:".length)];
  return tag === undefined ? operation : { ...operation, target: { kind: "field", fieldId: `EXIF:IFD0:0x${tag}` } };
}

function emptyExif(operation: EditOperation, limits: SecurityLimits): Uint8Array {
  if (operation.op !== "set") throw new WebpWriterError("UNSUPPORTED_STRUCTURE", "A missing WebP EXIF block can only be created by a set operation.");
  const field = targetField(operation.target);
  const map: Readonly<Record<string, { readonly tag: number; readonly type: "ASCII" | "SHORT" | "LONG" }>> = {
    "normalized:Make": { tag: 0x010f, type: "ASCII" }, "normalized:Model": { tag: 0x0110, type: "ASCII" }, "normalized:Orientation": { tag: 0x0112, type: "SHORT" }, "normalized:DateTime": { tag: 0x0132, type: "ASCII" }, "normalized:Artist": { tag: 0x013b, type: "ASCII" }, "normalized:Software": { tag: 0x0131, type: "ASCII" }, "normalized:Copyright": { tag: 0x8298, type: "ASCII" },
  };
  const explicit = field === null ? undefined : /^(?:EXIF:)?IFD0:0x([0-9a-fA-F]{1,4})$/u.exec(field)?.[1];
  const definition = (field === null ? undefined : map[field]) ?? (explicit === undefined ? undefined : { tag: Number.parseInt(explicit, 16), type: "LONG" as const });
  if (definition === undefined) throw new WebpWriterError("UNSUPPORTED_STRUCTURE", "Only supported IFD0 EXIF fields can be created in a missing WebP EXIF block.");
  const value = definition.type === "ASCII" ? { kind: "text" as const, value: "" } : definition.type === "SHORT" ? { kind: "numbers" as const, values: [1] } : { kind: "numbers" as const, values: [0] };
  return serializeTiff({ byteOrder: "little-endian", variant: "classic", rootDirectoryId: "IFD0@8", directories: [{ id: "IFD0@8", entries: [{ tag: definition.tag, type: definition.type, value }], nextDirectoryId: null }], preservedData: [] }, { limits });
}

/** Execute the W05 subset of W01: WebP EXIF fields and explicit metadata blocks. */
export function applyWebpEditTransaction(input: Uint8Array, operations: readonly EditOperation[], policy: EditPolicyEvidence, limits: SecurityLimits): WebpEditTransaction {
  const before = parseWebpIndex(input, limits);
  const exifChunks = before.chunks.filter((chunk) => chunk.kind === "exif");
  const edits: WebpBlockEdit[] = [];
  const results: WebpTransactionOperation[] = [];
  for (const operation of operations) {
    try {
      if (operation.op === "set" || operation.op === "delete") {
        if (isExifOperation(operation)) {
          const chunk = exifChunks[0];
          const rewritten = chunk === undefined
            ? applyTiffEditTransaction(emptyExif(operation, limits), [mappedExifOperation(operation)], policy, limits)
            : applyTiffEditTransaction(input.subarray(chunk.dataStart, chunk.dataEnd), [mappedExifOperation(operation)], policy, limits);
          const item = rewritten.operations[0];
          if (item === undefined || item.status !== "applied" || rewritten.output === null) throw new WebpWriterError("UNSUPPORTED_STRUCTURE", "WebP EXIF field transaction was not applied.");
          edits.push({ op: chunk === undefined ? "add" : "replace", kind: "exif", ...(chunk === undefined ? {} : { blockId: chunk.id }), data: rewritten.output });
          results.push(operationResult(operation, chunk === undefined ? [] : [chunk.id], item.appliedCount, item.matchedFieldIds));
          continue;
        }
        const family = targetFamily(operation.target);
        const kind: WebpBlockKind | null = family === "XMP" ? "xmp" : family === "ICC" ? "icc" : null;
        if (kind === null) throw new WebpWriterError("UNSUPPORTED_STRUCTURE", "WebP set/delete supports EXIF fields or explicit XMP and ICC block selectors.");
        const blockId = targetBlock(operation.target);
        if (operation.op === "delete") edits.push({ op: "remove", kind, ...(blockId === undefined ? {} : { blockId }) });
        else {
          if (!(typeof operation.value === "string" || operation.value instanceof Uint8Array)) throw new WebpWriterError("INVALID_VALUE", "WebP block values must be strings or Uint8Array bytes.");
          const exists = before.chunks.some((chunk) => chunk.kind === kind && (blockId === undefined || blockId === chunk.id));
          edits.push({ op: exists ? "replace" : "add", kind, ...(blockId === undefined ? {} : { blockId }), data: operation.value });
        }
        results.push(operationResult(operation, blockId === undefined ? [] : [blockId], operation.op === "set" ? 1 : 0));
        continue;
      }
      if (operation.op === "remove-group") {
        const family = targetFamily(operation.target);
        const kind: WebpBlockKind | null = family === "EXIF" ? "exif" : family === "XMP" ? "xmp" : family === "ICC" ? "icc" : null;
        if (kind === null) throw new WebpWriterError("UNSUPPORTED_STRUCTURE", "WebP group removal supports EXIF, XMP, and ICC.");
        edits.push({ op: "remove", kind }); results.push(operationResult(operation, [], 0)); continue;
      }
      throw new WebpWriterError("UNSUPPORTED_STRUCTURE", "This operation is not supported by the WebP writer.");
    } catch (error) {
      const item = error instanceof WebpWriterError ? { code: editFailureCode(error.code), detail: error.message } : { code: "UNSAFE_STRUCTURE" as const, detail: error instanceof Error ? error.message : "WebP transaction failed." };
      results.push(operationFailure(operation, item));
    }
  }
  if (results.some((item) => item.status !== "applied")) return { output: null, operations: results, before, after: null, byteChanges: [], preservedPayloads: [], verified: false };
  try {
    const output = rewriteWebpMetadata(input, {
      blocks: edits,
      limits,
      verify: policy.verification !== "none",
      duplicatePolicy: policy.duplicates,
      preservation: { orientationPolicy: policy.orientation },
    });
    const after = parseWebpIndex(output.data, limits);
    return { output: output.data, operations: results, before, after, byteChanges: output.byteChanges, preservedPayloads: output.preservedPayloads, verified: policy.verification !== "none", ...(output.preservation === null ? {} : { preservation: output.preservation }) };
  } catch (error) {
    const item: EditFailure = error instanceof WebpWriterError ? { code: editFailureCode(error.code), detail: error.message } : { code: "UNSAFE_STRUCTURE", detail: error instanceof Error ? error.message : "WebP output verification failed." };
    return { output: null, operations: operations.map((operation) => operationFailure(operation, item)), before, after: null, byteChanges: [], preservedPayloads: [], verified: false };
  }
}
