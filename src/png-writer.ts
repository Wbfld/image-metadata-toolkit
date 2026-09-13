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
  PngTextChunkType,
  SecurityLimits,
} from "./types.js";
import { c2paMutationFailure, type C2paMutationPolicy } from "./trust/jumbf.js";

const PNG_SIGNATURE = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const XMP_KEYWORD = "XML:com.adobe.xmp";
const MAX_PNG_CHUNK_BYTES = 0xffffffff;
const EXIF_FIELDS = new Set(["Make", "Model", "Orientation", "DateTime", "Artist", "Software", "Copyright"]);
const PNG_CRITICAL_TYPES = new Set(["IHDR", "PLTE", "IDAT", "IEND"]);

export type PngBlockKind = "exif" | "xmp" | "text" | "icc";
export type PngCrcPolicy = "reject" | "preserve-unknown";

export interface PngBlockEdit {
  readonly op: "add" | "replace" | "remove";
  readonly kind: PngBlockKind;
  /** Physical chunk ID from a previous index/result. */
  readonly blockId?: string;
  /** Required for ordinary PNG text; defaults to XMP for `xmp`. */
  readonly keyword?: string;
  readonly chunkType?: PngTextChunkType;
  readonly language?: string;
  readonly translatedKeyword?: string;
  readonly compressed?: boolean;
  /** TIFF bytes, complete ICC profile bytes, UTF-8 XMP, or text value. */
  readonly data?: string | Uint8Array;
}

export interface PngRewriteOptions {
  readonly blocks: readonly PngBlockEdit[];
  readonly limits?: Partial<SecurityLimits>;
  readonly verify?: boolean;
  readonly duplicatePolicy?: "preserve" | "replace-target" | "deduplicate-equivalent" | "reject";
  readonly crcPolicy?: PngCrcPolicy;
  /** Independent encoded-payload verification policy. Enabled with the normal `verify` default. */
  readonly preservation?: PreservationVerifierOptions;
  /** C2PA/JUMBF is refused by default; `preserve` is an explicit caller policy. */
  readonly c2pa?: C2paMutationPolicy;
}

export interface PngChunk {
  readonly id: string;
  readonly type: string;
  readonly start: number;
  readonly end: number;
  readonly dataStart: number;
  readonly dataEnd: number;
  readonly length: number;
  readonly crcValid: boolean;
  readonly kind: PngBlockKind | "other";
}

export interface PngIndex {
  readonly chunks: readonly PngChunk[];
  readonly dimensions: { readonly width: number; readonly height: number };
  readonly imagePayloadIds: readonly string[];
}

export interface PngPlacedChange {
  readonly blockId: string;
  readonly offset: number;
  readonly length: number;
  readonly kind: "removed" | "rewritten" | "inserted";
}

export interface PngRewriteResult {
  readonly data: Uint8Array;
  readonly byteChanges: readonly PngPlacedChange[];
  readonly preservedPayloads: readonly { readonly id: string; readonly before: Uint8Array; readonly after: Uint8Array }[];
  readonly inputBytes: number;
  readonly outputBytes: number;
  /** Checked, JSON-safe preservation evidence; null only when `verify: false` was requested. */
  readonly preservation: PreservationReport | null;
}

export type PngWriterErrorCode = "INVALID_VALUE" | "UNSAFE_STRUCTURE" | "LIMIT_EXCEEDED" | "UNSUPPORTED_STRUCTURE" | "VERIFICATION_FAILURE";

export class PngWriterError extends Error {
  public readonly code: PngWriterErrorCode;
  public readonly offset: number | undefined;

  public constructor(code: PngWriterErrorCode, message: string, offset?: number) {
    super(message);
    this.name = "PngWriterError";
    this.code = code;
    this.offset = offset;
  }
}

export interface PngTransactionOperation {
  readonly operationId: string;
  readonly operation: EditOperationKind | null;
  readonly status: EditOperationStatus;
  readonly failure: EditFailure | null;
  readonly appliedCount: number;
  readonly matchedFieldIds: readonly string[];
  readonly matchedBlockIds: readonly string[];
  readonly preservedUnknownCandidates: number | null;
}

export interface PngEditTransaction {
  readonly output: Uint8Array | null;
  readonly operations: readonly PngTransactionOperation[];
  readonly before: PngIndex;
  readonly after: PngIndex | null;
  readonly byteChanges: readonly PngPlacedChange[];
  readonly preservedPayloads: readonly { readonly id: string; readonly before: Uint8Array; readonly after: Uint8Array }[];
  readonly verified: boolean;
  readonly preservation?: PreservationReport;
}

interface ChunkWork {
  readonly original: PngChunk;
  readonly originalBytes: Uint8Array;
  bytes: Uint8Array;
  removed: boolean;
}

interface PendingInsert {
  readonly anchor: number;
  readonly id: string;
  readonly bytes: Uint8Array;
}

function uint32(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) * 0x1000000 + (bytes[offset + 1] ?? 0) * 0x10000 + (bytes[offset + 2] ?? 0) * 0x100 + (bytes[offset + 3] ?? 0);
}

function writeUint32(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = (value >>> 24) & 0xff;
  bytes[offset + 1] = (value >>> 16) & 0xff;
  bytes[offset + 2] = (value >>> 8) & 0xff;
  bytes[offset + 3] = value & 0xff;
}

function crc32(bytes: Uint8Array, start: number, end: number): number {
  let crc = 0xffffffff;
  for (let offset = start; offset < end; offset += 1) {
    crc ^= bytes[offset] ?? 0;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function checkedAdd(left: number, right: number, label: string): number {
  const value = left + right;
  if (!Number.isSafeInteger(value) || left < 0 || right < 0) throw new PngWriterError("LIMIT_EXCEEDED", `${label} arithmetic exceeded the safe integer range.`);
  return value;
}

function ascii(value: string): Uint8Array {
  const result = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code > 0x7f) throw new PngWriterError("INVALID_VALUE", "PNG chunk type and keywords must be ASCII.");
    result[index] = code;
  }
  return result;
}

function utf8(value: string | Uint8Array, label: string): Uint8Array {
  const result = typeof value === "string" ? new TextEncoder().encode(value) : value.slice();
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(result);
  } catch {
    throw new PngWriterError("INVALID_VALUE", `${label} must be valid UTF-8.`);
  }
  return result;
}

function latin1(value: string, label: string): Uint8Array {
  const result = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code > 0xff || code === 0) throw new PngWriterError("INVALID_VALUE", `${label} must contain only non-NUL Latin-1 characters.`);
    result[index] = code;
  }
  return result;
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) if (left[index] !== right[index]) return false;
  return true;
}

function isChunkType(type: string): boolean {
  return /^[A-Za-z]{4}$/u.test(type);
}

function isCritical(type: string): boolean {
  const code = type.charCodeAt(0);
  return code >= 0x41 && code <= 0x5a;
}

function chunkKind(type: string, data: Uint8Array): PngBlockKind | "other" {
  if (type === "eXIf") return "exif";
  if (type === "iCCP") return "icc";
  if (type !== "tEXt" && type !== "zTXt" && type !== "iTXt") return "other";
  let end = 0;
  while (end < data.length && data[end] !== 0) end += 1;
  if (end === data.length) return "other";
  const name = new TextDecoder("latin1").decode(data.subarray(0, end));
  return name === XMP_KEYWORD ? "xmp" : "text";
}

function dimensions(data: Uint8Array): { readonly width: number; readonly height: number } {
  if (data.length !== 13) throw new PngWriterError("UNSAFE_STRUCTURE", "PNG IHDR must contain exactly 13 bytes.");
  const width = uint32(data, 0);
  const height = uint32(data, 4);
  if (width === 0 || height === 0) throw new PngWriterError("UNSAFE_STRUCTURE", "PNG dimensions must be non-zero.");
  return { width, height };
}

function parsePngIndex(input: Uint8Array, limits: SecurityLimits, crcPolicy: PngCrcPolicy = "reject"): PngIndex {
  if (!(input instanceof Uint8Array)) throw new PngWriterError("INVALID_VALUE", "PNG writer input must be a Uint8Array.");
  if (input.length > limits.maxInputBytes) throw new PngWriterError("LIMIT_EXCEEDED", `PNG input exceeds the configured ${limits.maxInputBytes}-byte limit.`);
  if (input.length < PNG_SIGNATURE.length || !equalBytes(input.subarray(0, 8), PNG_SIGNATURE)) throw new PngWriterError("UNSAFE_STRUCTURE", "PNG does not begin with its complete signature.");
  const chunks: PngChunk[] = [];
  const imagePayloadIds: string[] = [];
  let cursor = 8;
  let metadataBytes = 0;
  let widthHeight: { readonly width: number; readonly height: number } | null = null;
  let sawIhdr = false;
  let sawIend = false;
  let sawIdat = false;
  let leftIdat = false;
  let idatCount = 0;
  let plteSeen = false;
  while (cursor < input.length) {
    if (chunks.length >= limits.maxPngChunks) throw new PngWriterError("LIMIT_EXCEEDED", `PNG contains more than ${limits.maxPngChunks} chunks.`, cursor);
    if (cursor > input.length - 12) throw new PngWriterError("UNSAFE_STRUCTURE", "PNG chunk header is truncated.", cursor);
    const length = uint32(input, cursor);
    if (length > limits.maxSegmentBytes && cursor + 4 < input.length) throw new PngWriterError("LIMIT_EXCEEDED", "PNG chunk exceeds the configured segment limit.", cursor);
    const type = String.fromCharCode(input[cursor + 4] ?? 0, input[cursor + 5] ?? 0, input[cursor + 6] ?? 0, input[cursor + 7] ?? 0);
    if (!isChunkType(type)) throw new PngWriterError("UNSAFE_STRUCTURE", "PNG contains an invalid chunk type.", cursor + 4);
    const dataStart = checkedAdd(cursor, 8, "PNG data offset");
    const dataEnd = checkedAdd(dataStart, length, "PNG data end");
    const end = checkedAdd(dataEnd, 4, "PNG chunk end");
    if (end > input.length) throw new PngWriterError("UNSAFE_STRUCTURE", "PNG chunk extends beyond the input.", cursor);
    const expectedCrc = uint32(input, dataEnd);
    const actualCrc = crc32(input, cursor + 4, dataEnd);
    const crcValid = actualCrc === expectedCrc;
    if (!crcValid && (crcPolicy === "reject" || isCritical(type))) throw new PngWriterError("UNSAFE_STRUCTURE", `PNG ${type} chunk has an invalid CRC.`, dataEnd);
    const data = input.subarray(dataStart, dataEnd);
    const kind = chunkKind(type, data);
    if (kind !== "other") {
      metadataBytes = checkedAdd(metadataBytes, length, "PNG metadata byte count");
      if (metadataBytes > limits.maxMetadataBytes) throw new PngWriterError("LIMIT_EXCEEDED", "PNG metadata exceeds the configured limit.", dataStart);
    }
    if (chunks.length === 0 && (type !== "IHDR" || length !== 13)) throw new PngWriterError("UNSAFE_STRUCTURE", "PNG must begin with a 13-byte IHDR chunk.", cursor);
    if (type === "IHDR") {
      if (sawIhdr) throw new PngWriterError("UNSAFE_STRUCTURE", "PNG contains more than one IHDR chunk.", cursor);
      sawIhdr = true;
      widthHeight = dimensions(data);
    }
    if (type === "PLTE") {
      if (plteSeen) throw new PngWriterError("UNSAFE_STRUCTURE", "PNG contains more than one PLTE chunk.", cursor);
      plteSeen = true;
      if (sawIdat) throw new PngWriterError("UNSAFE_STRUCTURE", "PNG PLTE occurs after image data.", cursor);
    }
    if (type === "IDAT") {
      if (leftIdat) throw new PngWriterError("UNSAFE_STRUCTURE", "PNG IDAT chunks are not contiguous.", cursor);
      sawIdat = true;
      idatCount += 1;
      imagePayloadIds.push(`png:IDAT:${idatCount - 1}`);
    } else if (sawIdat && type !== "fdAT" && type !== "fcTL") {
      leftIdat = true;
    }
    if (type === "IEND") {
      if (length !== 0) throw new PngWriterError("UNSAFE_STRUCTURE", "PNG IEND is malformed.", cursor);
      sawIend = true;
    }
    if (type === "acTL" || type === "fcTL" || type === "fdAT") imagePayloadIds.push(`png:${type}:${cursor}`);
    if (isCritical(type) && !PNG_CRITICAL_TYPES.has(type)) {
      throw new PngWriterError("UNSUPPORTED_STRUCTURE", `PNG critical chunk ${type} is not safely understood.`, cursor);
    }
    chunks.push({ id: `png:${type}:${cursor}`, type, start: cursor, end, dataStart, dataEnd, length, crcValid, kind });
    cursor = end;
    if (sawIend) break;
  }
  if (!sawIhdr || !sawIdat || !sawIend || widthHeight === null) throw new PngWriterError("UNSAFE_STRUCTURE", "PNG must contain IHDR, at least one IDAT, and IEND.");
  if (cursor !== input.length) throw new PngWriterError("UNSAFE_STRUCTURE", "PNG contains bytes after IEND.", cursor);
  if (idatCount === 0) throw new PngWriterError("UNSAFE_STRUCTURE", "PNG has no image data.");
  return { chunks, dimensions: widthHeight, imagePayloadIds };
}

function makeChunk(type: string, data: Uint8Array): Uint8Array {
  if (!isChunkType(type)) throw new PngWriterError("INVALID_VALUE", "PNG chunk type is invalid.");
  if (data.length > MAX_PNG_CHUNK_BYTES) throw new PngWriterError("LIMIT_EXCEEDED", "PNG chunk data exceeds the uint32 range.");
  const result = new Uint8Array(12 + data.length);
  writeUint32(result, 0, data.length);
  result.set(ascii(type), 4);
  result.set(data, 8);
  writeUint32(result, 8 + data.length, crc32(result, 4, 8 + data.length));
  return result;
}

async function compressZlib(input: Uint8Array, limits: SecurityLimits, label: string): Promise<Uint8Array> {
  if (typeof CompressionStream === "undefined") throw new PngWriterError("UNSUPPORTED_STRUCTURE", `${label} compression is unavailable in this runtime.`);
  if (input.length > limits.maxDecompressedBytes) throw new PngWriterError("LIMIT_EXCEEDED", `${label} exceeds the configured compression input limit.`);
  const stream = new CompressionStream("deflate");
  const writer = stream.writable.getWriter();
  await writer.write(input as unknown as BufferSource);
  await writer.close();
  const result = new Uint8Array(await new Response(stream.readable).arrayBuffer());
  if (result.length > limits.maxValueBytes) throw new PngWriterError("LIMIT_EXCEEDED", `${label} compressed value exceeds the configured value limit.`);
  return result;
}

function validateKeyword(keyword: string): Uint8Array {
  const bytes = latin1(keyword, "PNG text keyword");
  if (bytes.length === 0 || bytes.length > 79 || [...bytes].some((byte) => byte < 0x20 || byte > 0x7e)) throw new PngWriterError("INVALID_VALUE", "PNG text keywords must be printable 1–79 byte values.");
  return bytes;
}

async function makeTextChunk(edit: PngBlockEdit, limits: SecurityLimits): Promise<Uint8Array> {
  const keyword = edit.kind === "xmp" ? XMP_KEYWORD : edit.keyword;
  if (keyword === undefined) throw new PngWriterError("INVALID_VALUE", "PNG ordinary text edits require a keyword.");
  const keywordBytes = validateKeyword(keyword);
  const value = edit.data;
  if (value === undefined) throw new PngWriterError("INVALID_VALUE", "PNG text edits require data.");
  const type = edit.kind === "xmp" ? "iTXt" : edit.chunkType ?? "tEXt";
  if (type === "tEXt") {
    if (typeof value !== "string") throw new PngWriterError("INVALID_VALUE", "tEXt edits require a string value.");
    const text = latin1(value, "PNG tEXt value");
    return makeChunk(type, Uint8Array.from([...keywordBytes, 0, ...text]));
  }
  const compressed = edit.compressed === true || type === "zTXt";
  if (type === "zTXt") {
    if (typeof value !== "string") throw new PngWriterError("INVALID_VALUE", "zTXt edits require a string value.");
    const text = latin1(value, "PNG zTXt value");
    const payload = compressed ? await compressZlib(text, limits, "PNG zTXt") : text;
    return makeChunk("zTXt", Uint8Array.from([...keywordBytes, 0, 0, ...payload]));
  }
  const language = edit.language ?? "";
  const translated = edit.translatedKeyword ?? "";
  const languageBytes = utf8(language, "PNG iTXt language");
  const translatedBytes = utf8(translated, "PNG iTXt translated keyword");
  const text = utf8(value, "PNG iTXt value");
  const payload = compressed ? await compressZlib(text, limits, "PNG iTXt") : text;
  return makeChunk("iTXt", Uint8Array.from([...keywordBytes, 0, compressed ? 1 : 0, 0, ...languageBytes, 0, ...translatedBytes, 0, ...payload]));
}

async function makeBlock(edit: PngBlockEdit, limits: SecurityLimits): Promise<Uint8Array> {
  if (edit.kind === "text" || edit.kind === "xmp") return makeTextChunk(edit, limits);
  if (edit.data === undefined) throw new PngWriterError("INVALID_VALUE", `${edit.kind} edits require data.`);
  const data = typeof edit.data === "string" ? utf8(edit.data, `${edit.kind} data`) : edit.data.slice();
  if (data.length > limits.maxValueBytes) throw new PngWriterError("LIMIT_EXCEEDED", `${edit.kind} data exceeds the configured value limit.`);
  if (edit.kind === "exif") {
    if (data.length < 8 || !((data[0] === 0x49 && data[1] === 0x49) || (data[0] === 0x4d && data[1] === 0x4d))) throw new PngWriterError("INVALID_VALUE", "PNG eXIf data must be a complete TIFF payload.");
    return makeChunk("eXIf", data);
  }
  if (data.length < 132 || uint32(data, 0) !== data.length || data[36] !== 0x61 || data[37] !== 0x63 || data[38] !== 0x73 || data[39] !== 0x70) throw new PngWriterError("INVALID_VALUE", "PNG ICC data must be a complete ICC profile.");
  const name = latin1("ICC profile", "PNG ICC profile name");
  const compressed = await compressZlib(data, limits, "PNG ICC profile");
  return makeChunk("iCCP", Uint8Array.from([...name, 0, 0, ...compressed]));
}

function matches(chunk: PngChunk, edit: PngBlockEdit): boolean {
  if (chunk.kind !== edit.kind) return false;
  if (edit.blockId !== undefined) return chunk.id === edit.blockId;
  return true;
}

function textKeyword(input: Uint8Array, chunk: PngChunk): string | null {
  const data = input.subarray(chunk.dataStart, chunk.dataEnd);
  let end = 0;
  while (end < data.length && data[end] !== 0) end += 1;
  return end < data.length ? new TextDecoder("latin1").decode(data.subarray(0, end)) : null;
}

function editMatches(input: Uint8Array, chunk: PngChunk, edit: PngBlockEdit): boolean {
  if (!matches(chunk, edit)) return false;
  if (edit.kind === "text" && edit.keyword !== undefined) return textKeyword(input, chunk) === edit.keyword;
  return true;
}

function insertionAnchor(index: PngIndex, kind: PngBlockKind): number {
  const firstIdat = index.chunks.findIndex((chunk) => chunk.type === "IDAT");
  const plte = index.chunks.findIndex((chunk) => chunk.type === "PLTE");
  if (kind === "icc" && plte >= 0) return plte;
  if (firstIdat >= 0) return firstIdat;
  return index.chunks.length - 1;
}

function rebuild(input: Uint8Array, index: PngIndex, works: readonly ChunkWork[], inserts: readonly PendingInsert[], limits: SecurityLimits): { readonly data: Uint8Array; readonly changes: readonly PngPlacedChange[]; readonly placed: readonly { readonly id: string; readonly start: number; readonly end: number }[] } {
  const ordered = [...inserts].sort((left, right) => left.anchor - right.anchor || left.id.localeCompare(right.id));
  let size = PNG_SIGNATURE.length;
  for (let indexNumber = 0; indexNumber < works.length; indexNumber += 1) {
    for (const insert of ordered) if (insert.anchor === indexNumber) size = checkedAdd(size, insert.bytes.length, "PNG output size");
    const work = works[indexNumber];
    if (work !== undefined && !work.removed) size = checkedAdd(size, work.bytes.length, "PNG output size");
  }
  for (const insert of ordered) if (insert.anchor >= works.length) size = checkedAdd(size, insert.bytes.length, "PNG output size");
  if (size > limits.maxInputBytes || size > limits.maxAdapterOutputBytes) throw new PngWriterError("LIMIT_EXCEEDED", `Generated PNG is ${size} bytes, above the configured output limit.`);
  const output = new Uint8Array(size);
  output.set(PNG_SIGNATURE, 0);
  let cursor = PNG_SIGNATURE.length;
  const changes: PngPlacedChange[] = [];
  const placed: { id: string; start: number; end: number }[] = [];
  for (let indexNumber = 0; indexNumber < works.length; indexNumber += 1) {
    for (const insert of ordered) if (insert.anchor === indexNumber) {
      const start = cursor;
      output.set(insert.bytes, cursor); cursor += insert.bytes.length;
      changes.push({ blockId: insert.id, offset: start, length: insert.bytes.length, kind: "inserted" });
      placed.push({ id: insert.id, start, end: cursor });
    }
    const work = works[indexNumber];
    if (work === undefined) throw new PngWriterError("UNSAFE_STRUCTURE", "PNG chunk plan lost an entry.");
    if (work.removed) {
      changes.push({ blockId: work.original.id, offset: cursor, length: 0, kind: "removed" });
      continue;
    }
    const start = cursor;
    output.set(work.bytes, cursor); cursor += work.bytes.length;
    placed.push({ id: work.original.id, start, end: cursor });
    if (!equalBytes(work.originalBytes, work.bytes)) changes.push({ blockId: work.original.id, offset: start, length: work.bytes.length, kind: "rewritten" });
  }
  for (const insert of ordered) if (insert.anchor >= works.length) {
    const start = cursor;
    output.set(insert.bytes, cursor); cursor += insert.bytes.length;
    changes.push({ blockId: insert.id, offset: start, length: insert.bytes.length, kind: "inserted" });
    placed.push({ id: insert.id, start, end: cursor });
  }
  if (cursor !== output.length) throw new PngWriterError("VERIFICATION_FAILURE", "PNG output assembly did not consume its planned length.");
  return { data: output, changes, placed };
}

function verifyPayloads(input: Uint8Array, output: Uint8Array, before: PngIndex, after: PngIndex): readonly { readonly id: string; readonly before: Uint8Array; readonly after: Uint8Array }[] {
  if (before.dimensions.width !== after.dimensions.width || before.dimensions.height !== after.dimensions.height) throw new PngWriterError("VERIFICATION_FAILURE", "PNG dimensions changed during metadata rewriting.");
  const beforePayloads = before.chunks.filter((chunk) => chunk.type === "IDAT" || chunk.type === "fdAT");
  const afterPayloads = after.chunks.filter((chunk) => chunk.type === "IDAT" || chunk.type === "fdAT");
  if (beforePayloads.length !== afterPayloads.length) throw new PngWriterError("VERIFICATION_FAILURE", "PNG image payload chunk count changed during metadata rewriting.");
  return beforePayloads.map((chunk, index) => {
    const other = afterPayloads[index];
    if (other === undefined) throw new PngWriterError("VERIFICATION_FAILURE", `PNG image payload ${chunk.id} disappeared.`);
    const left = input.subarray(chunk.dataStart, chunk.dataEnd).slice();
    const right = output.subarray(other.dataStart, other.dataEnd).slice();
    if (!equalBytes(left, right)) throw new PngWriterError("VERIFICATION_FAILURE", `PNG image payload ${chunk.id} changed during metadata rewriting.`);
    return { id: chunk.id, before: left, after: right };
  });
}

function blockMatchesForEdit(input: Uint8Array, chunk: PngChunk, edit: PngBlockEdit): boolean {
  return editMatches(input, chunk, edit);
}

/** Rewrite PNG metadata chunks transactionally while preserving encoded image data. */
export async function rewritePngMetadata(input: Uint8Array, options: PngRewriteOptions): Promise<PngRewriteResult> {
  const rawOptions: unknown = options;
  if (rawOptions === null || typeof rawOptions !== "object" || Array.isArray(rawOptions)) throw new PngWriterError("INVALID_VALUE", "PNG writer options must be an object.");
  let limits: SecurityLimits;
  try { limits = resolveLimits(options.limits); } catch (error) { throw new PngWriterError("INVALID_VALUE", error instanceof Error ? error.message : "PNG writer limits are invalid."); }
  const c2paFailure = c2paMutationFailure(input, options.c2pa, limits);
  if (c2paFailure !== null) throw new PngWriterError("UNSUPPORTED_STRUCTURE", c2paFailure);
  if (!Array.isArray(options.blocks) || options.blocks.length === 0) throw new PngWriterError("INVALID_VALUE", "PNG writer requires at least one block edit.");
  if (options.verify !== undefined && typeof options.verify !== "boolean") throw new PngWriterError("INVALID_VALUE", "PNG writer verify must be boolean when supplied.");
  const duplicatePolicy = options.duplicatePolicy ?? "preserve";
  if (!["preserve", "replace-target", "deduplicate-equivalent", "reject"].includes(duplicatePolicy)) throw new PngWriterError("INVALID_VALUE", "PNG writer duplicatePolicy is not supported.");
  const rawPreservation: unknown = options.preservation;
  if (rawPreservation !== undefined && (rawPreservation === null || typeof rawPreservation !== "object" || Array.isArray(rawPreservation))) throw new PngWriterError("INVALID_VALUE", "PNG preservation options must be an object.");
  const preservationOptions = rawPreservation as Record<string, unknown> | undefined;
  for (const key of ["colorPolicy", "orientationPolicy"] as const) {
    const value = preservationOptions?.[key];
    if (value !== undefined && value !== "preserve" && value !== "report-only" && value !== "allow-change") throw new PngWriterError("INVALID_VALUE", `PNG preservation ${key} is not supported.`);
  }
  if (preservationOptions?.requireCompletePayloadExtraction !== undefined && typeof preservationOptions.requireCompletePayloadExtraction !== "boolean") throw new PngWriterError("INVALID_VALUE", "PNG preservation requireCompletePayloadExtraction must be boolean.");
  const rawCrcPolicy: unknown = options.crcPolicy;
  if (rawCrcPolicy !== undefined && rawCrcPolicy !== "reject" && rawCrcPolicy !== "preserve-unknown") throw new PngWriterError("INVALID_VALUE", "PNG writer crcPolicy is not supported.");
  const crcPolicy: PngCrcPolicy = rawCrcPolicy === "preserve-unknown" ? "preserve-unknown" : "reject";
  const index = parsePngIndex(input, limits, crcPolicy);
  const works: ChunkWork[] = index.chunks.map((chunk) => ({ original: chunk, originalBytes: input.subarray(chunk.start, chunk.end).slice(), bytes: input.subarray(chunk.start, chunk.end).slice(), removed: false }));
  const inserts: PendingInsert[] = [];
  let insertNumber = 0;
  for (const rawEdit of options.blocks) {
    if (rawEdit === null || typeof rawEdit !== "object" || Array.isArray(rawEdit)) throw new PngWriterError("INVALID_VALUE", "PNG block edits must be objects.");
    const candidate = rawEdit as Record<string, unknown>;
    if (candidate.op !== "add" && candidate.op !== "replace" && candidate.op !== "remove") throw new PngWriterError("INVALID_VALUE", "PNG block edit operation is not supported.");
    if (candidate.kind !== "exif" && candidate.kind !== "xmp" && candidate.kind !== "text" && candidate.kind !== "icc") throw new PngWriterError("INVALID_VALUE", "PNG block edit kind is not supported.");
    const edit = candidate as unknown as PngBlockEdit;
    const candidates = works.filter((work) => !work.removed && blockMatchesForEdit(input, work.original, edit));
    if (edit.op === "add") {
      if (edit.blockId !== undefined) throw new PngWriterError("INVALID_VALUE", "PNG add operations cannot specify blockId.");
      const bytes = await makeBlock(edit, limits);
      inserts.push({ anchor: insertionAnchor(index, edit.kind), id: `png:${edit.kind}:inserted:${insertNumber++}`, bytes });
      continue;
    }
    if (candidates.length === 0) {
      if (edit.op === "replace") throw new PngWriterError("INVALID_VALUE", `PNG ${edit.kind} replacement target was not found.`);
      continue;
    }
    if (duplicatePolicy === "reject" && candidates.length > 1 && edit.blockId === undefined) throw new PngWriterError("INVALID_VALUE", `PNG ${edit.kind} has duplicate blocks under reject policy.`);
    const selected = edit.blockId === undefined && duplicatePolicy === "replace-target" ? candidates.slice(0, 1) : candidates;
    if (edit.op === "remove") {
      for (const work of selected) work.removed = true;
      continue;
    }
    const bytes = await makeBlock(edit, limits);
    const first = selected[0];
    if (first === undefined) throw new PngWriterError("UNSAFE_STRUCTURE", "PNG replacement selected no chunk.");
    first.bytes = bytes;
    for (const extra of selected.slice(1)) {
      if (duplicatePolicy === "deduplicate-equivalent" || edit.kind === "icc" || edit.kind === "exif") extra.removed = true;
      else extra.bytes = bytes.slice();
    }
  }
  const planned = rebuild(input, index, works, inserts, limits);
  const after = parsePngIndex(planned.data, limits, crcPolicy);
  const preservedPayloads = verifyPayloads(input, planned.data, index, after);
  if (options.verify !== false) {
    if (crcPolicy === "reject" && after.chunks.some((chunk) => !chunk.crcValid)) throw new PngWriterError("VERIFICATION_FAILURE", "The rewritten PNG contains an invalid CRC.");
    if (after.chunks[0]?.type !== "IHDR" || after.chunks.at(-1)?.type !== "IEND") throw new PngWriterError("VERIFICATION_FAILURE", "The rewritten PNG has invalid chunk boundaries.");
  }
  const preservation = options.verify === false
    ? null
    : verifyPreservationSync(input, planned.data, { colorPolicy: "report-only", orientationPolicy: "preserve", ...options.preservation, limits });
  if (preservation !== null && !preservation.successful) throw new PngWriterError("VERIFICATION_FAILURE", `Independent PNG preservation verification failed: ${preservation.diagnostics.join(" ")}`);
  return { data: planned.data, byteChanges: planned.changes, preservedPayloads, inputBytes: input.length, outputBytes: planned.data.length, preservation };
}

function targetField(target: EditTarget): string | null {
  if (target.kind === "field") return target.fieldId;
  if (target.selector.kind === "field-id") return target.selector.fieldId;
  return null;
}

function targetFamily(target: EditTarget): string | null {
  if (target.kind === "selector" && target.selector.kind === "family") return target.selector.family;
  const field = targetField(target);
  return field?.split(":", 1)[0] ?? null;
}

function targetBlock(target: EditTarget): string | undefined {
  return target.kind === "selector" && target.selector.kind === "block" ? target.selector.blockId : undefined;
}

function failure(code: EditFailure["code"], detail: string): EditFailure { return { code, detail }; }

function editFailureCode(code: PngWriterErrorCode): EditFailure["code"] {
  if (code === "UNSUPPORTED_STRUCTURE") return "UNSUPPORTED_OPERATION";
  if (code === "LIMIT_EXCEEDED" || code === "UNSAFE_STRUCTURE") return "UNSAFE_STRUCTURE";
  return code;
}

function status(code: EditFailure["code"]): Exclude<EditOperationStatus, "applied"> {
  switch (code) {
    case "INVALID_VALUE": return "invalid-value";
    case "UNSAFE_STRUCTURE": return "unsafe-structure";
    case "POLICY_FAILURE": return "policy-failure";
    case "VERIFICATION_FAILURE": return "verification-failure";
    case "UNSUPPORTED_OPERATION": return "unsupported";
  }
}

function operationResult(operation: EditOperation, matchedBlockIds: readonly string[], appliedCount: number, matchedFieldIds: readonly string[] = []): PngTransactionOperation {
  return { operationId: operation.operationId, operation: operation.op, status: "applied", failure: null, appliedCount, matchedFieldIds, matchedBlockIds, preservedUnknownCandidates: null };
}

function operationFailure(operation: EditOperation, item: EditFailure): PngTransactionOperation {
  return { operationId: operation.operationId, operation: operation.op, status: status(item.code), failure: item, appliedCount: 0, matchedFieldIds: [], matchedBlockIds: [], preservedUnknownCandidates: null };
}

function isExifOperation(operation: EditOperation): boolean {
  const field = operation.op === "set" || operation.op === "delete" ? targetField(operation.target) : null;
  return field !== null && (field.startsWith("EXIF:") || field.startsWith("normalized:"));
}

function exifOperationField(operation: EditOperation): EditOperation {
  if (operation.op !== "set" && operation.op !== "delete") return operation;
  const field = targetField(operation.target);
  if (field === null) return operation;
  if (field.startsWith("normalized:")) {
    const name = field.slice("normalized:".length);
    if (!EXIF_FIELDS.has(name)) return operation;
    return { ...operation, target: { kind: "field", fieldId: `EXIF:IFD0:0x${({ Make: "010f", Model: "0110", Orientation: "0112", DateTime: "0132", Artist: "013b", Software: "0131", Copyright: "8298" } as Record<string, string>)[name]}` } };
  }
  return operation;
}

function newExifField(operation: EditOperation): { readonly operation: EditOperation; readonly tag: number; readonly type: "ASCII" | "SHORT" | "LONG" } | null {
  if (operation.op !== "set") return null;
  const normalized = targetField(operation.target);
  if (normalized === null) return null;
  const mapped: Readonly<Record<string, string>> = {
    "normalized:Make": "010f",
    "normalized:Model": "0110",
    "normalized:Orientation": "0112",
    "normalized:DateTime": "0132",
    "normalized:Artist": "013b",
    "normalized:Software": "0131",
    "normalized:Copyright": "8298",
  };
  const explicit = mapped[normalized] ?? /^(?:EXIF:)?IFD0:0x([0-9a-fA-F]{1,4})$/u.exec(normalized)?.[1];
  if (explicit === undefined) return null;
  const tag = Number.parseInt(explicit, 16);
  const operationTarget: EditTarget = { kind: "field", fieldId: `EXIF:IFD0:0x${explicit.toLowerCase().padStart(4, "0")}` };
  const type = [0x010f, 0x0110, 0x0132, 0x013b, 0x0131, 0x8298].includes(tag) ? "ASCII" : tag === 0x0112 ? "SHORT" : "LONG";
  return { operation: { ...operation, target: operationTarget }, tag, type };
}

function emptyExifFor(operation: EditOperation, limits: SecurityLimits): Uint8Array {
  const field = newExifField(operation);
  if (field === null) throw new PngWriterError("UNSUPPORTED_STRUCTURE", "Only supported IFD0 EXIF fields can be created when a PNG has no eXIf chunk.");
  const value = field.type === "ASCII" ? { kind: "text" as const, value: "" } : field.type === "SHORT" ? { kind: "numbers" as const, values: [1] } : { kind: "numbers" as const, values: [0] };
  return serializeTiff({ byteOrder: "little-endian", variant: "classic", rootDirectoryId: "IFD0@8", directories: [{ id: "IFD0@8", entries: [{ tag: field.tag, type: field.type, value }], nextDirectoryId: null }], preservedData: [] }, { limits });
}

/** Execute the W01 subset supported by PNG: EXIF field transactions and explicit metadata-family/block edits. */
export async function applyPngEditTransaction(input: Uint8Array, operations: readonly EditOperation[], policy: EditPolicyEvidence, limits: SecurityLimits): Promise<PngEditTransaction> {
  const before = parsePngIndex(input, limits);
  const blockEdits: PngBlockEdit[] = [];
  const results: PngTransactionOperation[] = [];
  const exifChunks = before.chunks.filter((chunk) => chunk.kind === "exif");
  for (const operation of operations) {
    try {
      if (operation.op === "set" || operation.op === "delete") {
        if (isExifOperation(operation)) {
          const chunk = exifChunks[0];
          const transformed = chunk === undefined
            ? applyTiffEditTransaction(emptyExifFor(operation, limits), [exifOperationField(operation)], policy, limits)
            : applyTiffEditTransaction(input.subarray(chunk.dataStart, chunk.dataEnd), [exifOperationField(operation)], policy, limits);
          const item = transformed.operations[0];
          if (item === undefined || item.status !== "applied" || transformed.output === null) throw new PngWriterError("UNSUPPORTED_STRUCTURE", "PNG EXIF field transaction was not applied.");
          blockEdits.push({ op: chunk === undefined ? "add" : "replace", kind: "exif", ...(chunk === undefined ? {} : { blockId: chunk.id }), data: transformed.output });
          results.push(operationResult(operation, chunk === undefined ? [] : [chunk.id], item.appliedCount, item.matchedFieldIds));
          continue;
        }
        const family = targetFamily(operation.target);
        const blockId = targetBlock(operation.target);
        const kind: PngBlockKind | null = family === "XMP" ? "xmp" : family === "ICC" ? "icc" : family === "PNGText" ? "text" : null;
        if (kind === null) throw new PngWriterError("UNSUPPORTED_STRUCTURE", "PNG set/delete supports EXIF fields or explicit XMP, ICC, and PNG text block selectors.");
        if (operation.op === "delete") {
          blockEdits.push({ op: "remove", kind, ...(blockId === undefined ? {} : { blockId }) });
          results.push(operationResult(operation, [], 0));
        } else {
          if (!(typeof operation.value === "string" || operation.value instanceof Uint8Array)) throw new PngWriterError("INVALID_VALUE", "PNG block values must be strings or Uint8Array bytes.");
          blockEdits.push({ op: "replace", kind, ...(blockId === undefined ? {} : { blockId }), data: operation.value });
          results.push(operationResult(operation, blockId === undefined ? [] : [blockId], 1));
        }
        continue;
      }
      if (operation.op === "remove-group") {
        const family = targetFamily(operation.target);
        const kind: PngBlockKind | null = family === "EXIF" ? "exif" : family === "XMP" ? "xmp" : family === "ICC" ? "icc" : family === "PNGText" ? "text" : null;
        if (kind === null) throw new PngWriterError("UNSUPPORTED_STRUCTURE", "PNG group removal supports EXIF, XMP, ICC, and PNGText.");
        blockEdits.push({ op: "remove", kind });
        results.push(operationResult(operation, [], 0));
        continue;
      }
      throw new PngWriterError("UNSUPPORTED_STRUCTURE", "This operation is not supported by the PNG writer.");
    } catch (error) {
      const item = error instanceof PngWriterError ? failure(editFailureCode(error.code), error.message) : failure("UNSAFE_STRUCTURE", error instanceof Error ? error.message : "PNG transaction failed.");
      results.push(operationFailure(operation, item));
    }
  }
  if (results.some((item) => item.status !== "applied")) return { output: null, operations: results, before, after: null, byteChanges: [], preservedPayloads: [], verified: false };
  try {
    const output = await rewritePngMetadata(input, { blocks: blockEdits, limits, verify: policy.verification !== "none", duplicatePolicy: policy.duplicates });
    const after = parsePngIndex(output.data, limits);
    return { output: output.data, operations: results, before, after, byteChanges: output.byteChanges, preservedPayloads: output.preservedPayloads, verified: policy.verification !== "none", ...(output.preservation === null ? {} : { preservation: output.preservation }) };
  } catch (error) {
    const item = failure(error instanceof PngWriterError ? editFailureCode(error.code) : "UNSAFE_STRUCTURE", error instanceof Error ? error.message : "PNG output verification failed.");
    return { output: null, operations: operations.map((operation) => operationFailure(operation, item)), before, after: null, byteChanges: [], preservedPayloads: [], verified: false };
  }
}

export type { PngTextChunkType };
