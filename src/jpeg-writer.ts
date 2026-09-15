import { parseIccChunk } from "./metadata/icc.js";
import { extendedXmpGuid, parseExtendedXmpChunk, reassembleExtendedXmp, type ExtendedXmpChunk } from "./metadata/xmp.js";
import { applyTiffEditTransaction, serializeTiff, type TiffEditTransaction } from "./tiff.js";
import { parseJpeg } from "./parsers/jpeg.js";
import { inspectPhotoshopResourceSpans } from "./metadata/photoshop.js";
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
import { c2paMutationFailure, type C2paMutationPolicy } from "./trust/jumbf.js";

const SOI = 0xd8;
const EOI = 0xd9;
const SOS = 0xda;
const DNL = 0xdc;
const TEM = 0x01;
const COM = 0xfe;
const APP0 = 0xe0;
const APP1 = 0xe1;
const APP2 = 0xe2;
const APP11 = 0xeb;
const APP13 = 0xed;
const APP15 = 0xef;
const MAX_JPEG_PAYLOAD = 0xffff - 2;

const EXIF_IDENTIFIER = asciiBytes("Exif\0\0");
const XMP_IDENTIFIER = asciiBytes("http://ns.adobe.com/xap/1.0/\0");
const EXTENDED_XMP_IDENTIFIER = asciiBytes("http://ns.adobe.com/xmp/extension/\0");
const ICC_IDENTIFIER = asciiBytes("ICC_PROFILE\0");
const MPF_IDENTIFIER = asciiBytes("MPF\0");
const PHOTOSHOP_IDENTIFIER = asciiBytes("Photoshop 3.0\0");
const RESOURCE_SIGNATURE = asciiBytes("8BIM");
const IPTC_RESOURCE_ID = 0x0404;

type JpegSegmentKind = "exif" | "standard-xmp" | "extended-xmp" | "icc" | "iptc" | "other";

interface JpegSegment {
  readonly id: string;
  readonly marker: number;
  readonly start: number;
  readonly end: number;
  readonly payloadStart: number;
  readonly payloadEnd: number;
  readonly kind: JpegSegmentKind;
  readonly guid: string | null;
}

interface JpegScanPayload {
  readonly id: string;
  readonly start: number;
  readonly end: number;
}

interface JpegIndex {
  readonly segments: readonly JpegSegment[];
  readonly scans: readonly JpegScanPayload[];
  readonly frameDimensions: readonly { readonly width: number; readonly height: number }[];
  readonly eoiOffset: number;
  readonly eoiEnd: number;
}

interface PhotoshopResource {
  readonly id: number;
  readonly start: number;
  readonly end: number;
  readonly dataStart: number;
  readonly dataEnd: number;
}

interface ParsedPhotoshop {
  readonly resources: readonly PhotoshopResource[];
  readonly rawIim: boolean;
}

interface SegmentWork {
  readonly original: JpegSegment;
  readonly originalBytes: Uint8Array;
  bytes: Uint8Array;
  removed: boolean;
  /** Source-order Photoshop resources already removed from this segment. */
  removedPhotoshopResourceIndices?: Set<number>;
}

interface InsertedSegment {
  readonly anchor: number;
  readonly id: string;
  readonly bytes: Uint8Array;
}

interface PlacedChange {
  readonly blockId: string;
  readonly offset: number;
  readonly length: number;
  readonly kind: "removed" | "rewritten" | "inserted";
}

interface PlannedOutput {
  readonly data: Uint8Array;
  readonly changes: readonly PlacedChange[];
  readonly inserted: readonly InsertedSegment[];
  readonly placedSegments: readonly { readonly id: string; readonly outputStart: number; readonly outputEnd: number }[];
}

export type JpegBlockKind = "standard-xmp" | "extended-xmp" | "icc" | "iptc" | "photoshop-resource";

/** A raw, format-aware JPEG metadata block edit. XMP data is the logical
 * packet bytes (with the Adobe identifier also accepted); ICC data is the
 * complete profile; IPTC data is the complete IIM resource payload. */
export interface JpegBlockEdit {
  readonly op: "add" | "replace" | "remove";
  readonly kind: JpegBlockKind;
  /** Physical block ID from a previous edit result, when one occurrence is
   * intended. Omit it to address all logical candidates under the duplicate
   * policy. */
  readonly blockId?: string;
  /** Required for extended XMP. It is the 32-hex-character XMP GUID. */
  readonly guid?: string;
  /** Exact source-order Photoshop 8BIM resource identity. Only removal is supported. */
  readonly resourceId?: string;
  readonly data?: string | Uint8Array;
}

export interface JpegRewriteOptions {
  readonly blocks: readonly JpegBlockEdit[];
  readonly limits?: Partial<SecurityLimits>;
  readonly verify?: boolean;
  readonly duplicatePolicy?: "preserve" | "replace-target" | "deduplicate-equivalent" | "reject";
  /** Independent encoded-payload verification policy. Enabled with the normal `verify` default. */
  readonly preservation?: PreservationVerifierOptions;
  /** C2PA/JUMBF is refused by default; `preserve` is an explicit caller policy. */
  readonly c2pa?: C2paMutationPolicy;
}

export interface JpegRewriteResult {
  readonly data: Uint8Array;
  readonly byteChanges: readonly PlacedChange[];
  readonly preservedPayloads: readonly { readonly id: string; readonly before: Uint8Array; readonly after: Uint8Array }[];
  readonly inputBytes: number;
  readonly outputBytes: number;
  /** Checked, JSON-safe preservation evidence; null only when `verify: false` was requested. */
  readonly preservation: PreservationReport | null;
}

export type JpegWriterErrorCode = "INVALID_VALUE" | "UNSAFE_STRUCTURE" | "LIMIT_EXCEEDED" | "UNSUPPORTED_STRUCTURE" | "VERIFICATION_FAILURE";

export class JpegWriterError extends Error {
  public readonly code: JpegWriterErrorCode;
  public readonly offset: number | undefined;

  public constructor(code: JpegWriterErrorCode, message: string, offset?: number) {
    super(message);
    this.name = "JpegWriterError";
    this.code = code;
    this.offset = offset;
  }
}

export interface JpegTransactionOperation {
  readonly operationId: string;
  readonly operation: EditOperationKind | null;
  readonly status: EditOperationStatus;
  readonly failure: EditFailure | null;
  readonly appliedCount: number;
  readonly matchedFieldIds: readonly string[];
  readonly matchedBlockIds: readonly string[];
  readonly preservedUnknownCandidates: number | null;
}

export interface JpegEditTransaction {
  readonly output: Uint8Array | null;
  readonly operations: readonly JpegTransactionOperation[];
  readonly before: JpegIndex;
  readonly after: JpegIndex | null;
  readonly byteChanges: readonly PlacedChange[];
  readonly preservedPayloads: readonly { readonly id: string; readonly before: Uint8Array; readonly after: Uint8Array }[];
  readonly verified: boolean;
  readonly preservation?: PreservationReport;
}

function asciiBytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) bytes[index] = value.charCodeAt(index);
  return bytes;
}

function startsWith(bytes: Uint8Array, prefix: Uint8Array): boolean {
  if (bytes.length < prefix.length) return false;
  for (let index = 0; index < prefix.length; index += 1) if (bytes[index] !== prefix[index]) return false;
  return true;
}

function readUint16(bytes: Uint8Array, offset: number): number {
  const first = bytes[offset];
  const second = bytes[offset + 1];
  if (first === undefined || second === undefined) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG length field is truncated.", offset);
  return first * 0x100 + second;
}

function readUint32(bytes: Uint8Array, offset: number): number {
  const a = bytes[offset];
  const b = bytes[offset + 1];
  const c = bytes[offset + 2];
  const d = bytes[offset + 3];
  if (a === undefined || b === undefined || c === undefined || d === undefined) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG 32-bit value is truncated.", offset);
  return a * 0x1000000 + b * 0x10000 + c * 0x100 + d;
}

function writeUint16(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = (value >>> 8) & 0xff;
  bytes[offset + 1] = value & 0xff;
}

function writeUint32(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = (value >>> 24) & 0xff;
  bytes[offset + 1] = (value >>> 16) & 0xff;
  bytes[offset + 2] = (value >>> 8) & 0xff;
  bytes[offset + 3] = value & 0xff;
}

function checkedSum(left: number, right: number, label: string, offset?: number): number {
  const value = left + right;
  if (!Number.isSafeInteger(value) || left < 0 || right < 0) throw new JpegWriterError("LIMIT_EXCEEDED", `${label} arithmetic exceeded the safe integer range.`, offset);
  return value;
}

function checkedSegmentLength(payloadLength: number, limits: SecurityLimits): void {
  if (!Number.isSafeInteger(payloadLength) || payloadLength < 0 || payloadLength > MAX_JPEG_PAYLOAD) throw new JpegWriterError("LIMIT_EXCEEDED", `JPEG metadata payload cannot exceed ${MAX_JPEG_PAYLOAD} bytes.`);
  if (payloadLength > limits.maxSegmentBytes) throw new JpegWriterError("LIMIT_EXCEEDED", `JPEG metadata payload is ${payloadLength} bytes; the configured maximum is ${limits.maxSegmentBytes}.`);
}

function makeSegment(marker: number, payload: Uint8Array, limits: SecurityLimits): Uint8Array {
  checkedSegmentLength(payload.length, limits);
  const result = new Uint8Array(payload.length + 4);
  result[0] = 0xff;
  result[1] = marker;
  writeUint16(result, 2, payload.length + 2);
  result.set(payload, 4);
  return result;
}

function isRestartMarker(marker: number): boolean { return marker >= 0xd0 && marker <= 0xd7; }

function isStartOfFrame(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

function markerName(marker: number): string {
  return marker >= APP0 && marker <= APP15 ? `APP${marker - APP0}` : `0x${marker.toString(16).padStart(2, "0")}`;
}

function findMarkerAfterScan(bytes: Uint8Array, from: number): number {
  let cursor = from;
  while (cursor < bytes.length) {
    if (bytes[cursor] !== 0xff) {
      cursor += 1;
      continue;
    }
    const markerStart = cursor;
    while (cursor < bytes.length && bytes[cursor] === 0xff) cursor += 1;
    if (cursor >= bytes.length) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG entropy-coded data ends after a marker prefix.", markerStart);
    const marker = bytes[cursor];
    if (marker === undefined) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG entropy-coded marker is truncated.", cursor);
    if (marker === 0x00 || isRestartMarker(marker)) {
      cursor += 1;
      continue;
    }
    return markerStart;
  }
  throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG entropy-coded data has no terminating marker.", bytes.length);
}

function classifySegment(payload: Uint8Array, marker: number): { readonly kind: JpegSegmentKind; readonly guid: string | null } {
  if (marker === APP1 && startsWith(payload, EXIF_IDENTIFIER)) return { kind: "exif", guid: null };
  if (marker === APP1 && startsWith(payload, XMP_IDENTIFIER)) return { kind: "standard-xmp", guid: null };
  if (marker === APP1) {
    const extended = parseExtendedXmpChunk(payload);
    if (extended !== null) return { kind: "extended-xmp", guid: extended.guid };
  }
  if (marker === APP2 && startsWith(payload, ICC_IDENTIFIER)) return { kind: "icc", guid: null };
  if (marker === APP13 && isIptcPayload(payload)) return { kind: "iptc", guid: null };
  return { kind: "other", guid: null };
}

function parseJpegIndex(bytes: Uint8Array, limits: SecurityLimits): JpegIndex {
  if (bytes.length > limits.maxInputBytes) throw new JpegWriterError("LIMIT_EXCEEDED", `JPEG input is ${bytes.length} bytes; the configured maximum is ${limits.maxInputBytes}.`);
  if (bytes.length < 2 || bytes[0] !== 0xff || bytes[1] !== SOI) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG does not begin with a complete SOI marker.", 0);

  const segments: JpegSegment[] = [];
  const scans: JpegScanPayload[] = [];
  const frameDimensions: { width: number; height: number }[] = [];
  let cursor = 2;
  let inEntropy = false;
  let scanStart = 0;
  let sawFrame = false;
  let sawScan = false;
  let metadataBytes = 0;
  let segmentCount = 0;

  while (cursor < bytes.length) {
    let fromEntropy = false;
    if (inEntropy) {
      const markerStart = findMarkerAfterScan(bytes, cursor);
      scans.push({ id: `jpeg:scan:${scans.length}`, start: scanStart, end: markerStart });
      cursor = markerStart;
      inEntropy = false;
      fromEntropy = true;
    }

    const start = cursor;
    if (bytes[cursor] !== 0xff) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG contains bytes outside a marker or entropy-coded scan.", cursor);
    while (cursor < bytes.length && bytes[cursor] === 0xff) cursor += 1;
    if (cursor >= bytes.length) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG ends inside a marker prefix.", start);
    const marker = bytes[cursor];
    if (marker === undefined) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG marker is truncated.", cursor);
    cursor += 1;

    if (marker === EOI) {
      if (!sawFrame || !sawScan) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG must contain a frame and scan before EOI.", start);
      return { segments, scans, frameDimensions, eoiOffset: start, eoiEnd: cursor };
    }
    if (marker === SOI) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG contains a second SOI marker.", start);
    if (marker === 0x00 || (isRestartMarker(marker) && !fromEntropy)) throw new JpegWriterError("UNSAFE_STRUCTURE", `JPEG contains an invalid standalone ${markerName(marker)} marker.`, start);
    if (marker === TEM) {
      segmentCount = checkedSum(segmentCount, 1, "JPEG marker count", start);
      if (segmentCount > limits.maxSegments) throw new JpegWriterError("LIMIT_EXCEEDED", `JPEG contains more than ${limits.maxSegments} markers.`, start);
      continue;
    }

    segmentCount = checkedSum(segmentCount, 1, "JPEG marker count", start);
    if (segmentCount > limits.maxSegments) throw new JpegWriterError("LIMIT_EXCEEDED", `JPEG contains more than ${limits.maxSegments} markers.`, start);
    if (cursor > bytes.length - 2) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG segment length is truncated.", cursor);
    const declaredLength = readUint16(bytes, cursor);
    if (declaredLength < 2) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG segment length is smaller than two.", cursor);
    const payloadLength = declaredLength - 2;
    if (payloadLength > limits.maxSegmentBytes) throw new JpegWriterError("LIMIT_EXCEEDED", `JPEG ${markerName(marker)} payload exceeds ${limits.maxSegmentBytes} bytes.`, cursor);
    const payloadStart = checkedSum(cursor, 2, "JPEG payload offset", cursor);
    const end = checkedSum(payloadStart, payloadLength, "JPEG segment end", cursor);
    if (end > bytes.length) throw new JpegWriterError("UNSAFE_STRUCTURE", `JPEG ${markerName(marker)} segment extends past the input.`, start);
    const payload = bytes.subarray(payloadStart, end);

    if (isStartOfFrame(marker)) {
      if (payload.length < 6) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG start-of-frame header is truncated.", payloadStart);
      const components = payload[5] ?? 0;
      const width = readUint16(payload, 3);
      const height = readUint16(payload, 1);
      if (payload[0] === 0 || components === 0 || width === 0 || height === 0 || payload.length !== 6 + components * 3) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG start-of-frame dimensions or component table is invalid.", payloadStart);
      sawFrame = true;
      frameDimensions.push({ width, height });
    }
    if (marker === SOS) {
      const components = payload[0] ?? 0;
      if (!sawFrame || components < 1 || components > 4 || payload.length !== 4 + components * 2) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG start-of-scan header is invalid or out of order.", payloadStart);
      sawScan = true;
    }
    if (marker === DNL) {
      if (!fromEntropy || payload.length !== 2 || readUint16(payload, 0) === 0) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG DNL marker is invalid or outside entropy data.", payloadStart);
      throw new JpegWriterError("UNSUPPORTED_STRUCTURE", "JPEG DNL height-deferred codestreams are not rewritten by W03.", start);
    }

    if ((marker >= APP0 && marker <= APP15) || marker === COM) {
      metadataBytes = checkedSum(metadataBytes, payloadLength, "JPEG metadata byte count", start);
      if (metadataBytes > limits.maxMetadataBytes) throw new JpegWriterError("LIMIT_EXCEEDED", `JPEG metadata exceeds the configured maximum of ${limits.maxMetadataBytes} bytes.`, start);
    }
    const classified = classifySegment(payload, marker);
    segments.push({ id: marker === COM ? `jpeg:COM:${start}` : `jpeg:${markerName(marker)}:${start}`, marker, start, end, payloadStart, payloadEnd: end, kind: classified.kind, guid: classified.guid });
    cursor = end;
    if (marker === SOS) {
      inEntropy = true;
      scanStart = end;
    }
  }
  throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG has no EOI marker.", bytes.length);
}

function isIptcPayload(payload: Uint8Array): boolean {
  if (payload.length >= 1 && payload[0] === 0x1c) return true;
  return startsWith(payload, PHOTOSHOP_IDENTIFIER);
}

function parsePhotoshop(payload: Uint8Array): ParsedPhotoshop | null {
  if (payload.length > 0 && payload[0] === 0x1c) return { resources: [], rawIim: true };
  if (!startsWith(payload, PHOTOSHOP_IDENTIFIER)) return null;
  const resources: PhotoshopResource[] = [];
  let cursor = PHOTOSHOP_IDENTIFIER.length;
  while (cursor < payload.length) {
    if (cursor > payload.length - 8 || !startsWith(payload.subarray(cursor), RESOURCE_SIGNATURE)) return null;
    const id = readUint16(payload, cursor + 4);
    const nameLength = payload[cursor + 6];
    if (nameLength === undefined) return null;
    const paddedNameBytes = (1 + nameLength + 1) & ~1;
    const sizeOffset = checkedSum(cursor, 6 + paddedNameBytes, "Photoshop resource header", cursor);
    if (sizeOffset > payload.length - 4) return null;
    const size = readUint32(payload, sizeOffset);
    const dataStart = checkedSum(sizeOffset, 4, "Photoshop resource data", sizeOffset);
    const dataEnd = checkedSum(dataStart, size, "Photoshop resource end", sizeOffset);
    const end = checkedSum(dataEnd, size & 1, "Photoshop resource padding", dataEnd);
    if (end > payload.length) return null;
    const namePaddingStart = cursor + 7 + nameLength;
    const namePaddingEnd = cursor + 6 + paddedNameBytes;
    if (payload.subarray(namePaddingStart, namePaddingEnd).some((value) => value !== 0) || payload.subarray(dataEnd, end).some((value) => value !== 0)) return null;
    resources.push({ id, start: cursor, end, dataStart, dataEnd });
    cursor = end;
  }
  return { resources, rawIim: false };
}

function findUnsupportedStructure(bytes: Uint8Array, index: JpegIndex, limits: SecurityLimits, c2paPolicy?: C2paMutationPolicy): void {
  const extended = new Map<string, { readonly guid: string; readonly fullLength: number; readonly offset: number; readonly data: Uint8Array }[]>();
  const iccChunks: { readonly sequence: number; readonly total: number; readonly data: Uint8Array }[] = [];
  for (const segment of index.segments) {
    const payload = bytes.subarray(segment.payloadStart, segment.payloadEnd);
    if (segment.marker === APP2 && startsWith(payload, MPF_IDENTIFIER)) throw new JpegWriterError("UNSUPPORTED_STRUCTURE", "JPEG MPF secondary-image offsets are not rewritten by W03.", segment.start);
    if (segment.marker === APP11 || containsAscii(payload, "jumb") || containsAscii(payload, "c2pa")) {
      if (c2paMutationFailure(bytes, c2paPolicy, limits) !== null) throw new JpegWriterError("UNSUPPORTED_STRUCTURE", c2paMutationFailure(bytes, c2paPolicy, limits) ?? "JPEG C2PA/JUMBF mutation was refused.", segment.start);
    }
    if (segment.kind === "extended-xmp") {
      const parsed = parseExtendedXmpChunk(payload);
      if (parsed === null) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG Extended XMP has an invalid chunk header.", segment.start);
      const chunks = extended.get(parsed.guid) ?? [];
      chunks.push(parsed);
      extended.set(parsed.guid, chunks);
    }
    if (segment.kind === "standard-xmp") {
      const packet = payload.subarray(XMP_IDENTIFIER.length);
      if (packet.length > limits.maxStringBytes) throw new JpegWriterError("LIMIT_EXCEEDED", "JPEG standard XMP exceeds the configured string limit.", segment.start);
      try { new TextDecoder("utf-8", { fatal: true }).decode(packet); } catch { throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG standard XMP is not valid UTF-8.", segment.start); }
    }
    if (segment.marker === APP1 && (segment.kind === "standard-xmp" || segment.kind === "extended-xmp") && containsUltraHdr(payload)) throw new JpegWriterError("UNSUPPORTED_STRUCTURE", "JPEG Ultra HDR gain-map metadata is not rewritten by W03.", segment.start);
    if (segment.marker === APP13 && startsWith(payload, PHOTOSHOP_IDENTIFIER) && parsePhotoshop(payload) === null) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG Photoshop image-resource data is malformed; metadata editing is refused.", segment.start);
    if (segment.marker === APP2 && startsWith(payload, ICC_IDENTIFIER)) {
      const chunk = parseIccChunk(payload);
      if (chunk === null || chunk.data === undefined) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG ICC_PROFILE chunk has an invalid sequence header.", segment.start);
      iccChunks.push({ sequence: chunk.sequence, total: chunk.total, data: chunk.data });
    }
  }
  for (const [guid, chunks] of extended) {
    if (reassembleExtendedXmp(chunks, limits.maxStringBytes) === null) throw new JpegWriterError("UNSAFE_STRUCTURE", `JPEG Extended XMP chunks for ${guid} are incomplete or overlapping.`);
  }
  if (iccChunks.length > 0) {
    const total = iccChunks[0]?.total ?? 0;
    const sequences = new Set<number>();
    let profileLength = 0;
    for (const chunk of iccChunks) {
      if (chunk.total !== total || sequences.has(chunk.sequence)) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG ICC_PROFILE chunks have duplicate or inconsistent sequence metadata.");
      sequences.add(chunk.sequence);
      profileLength = checkedSum(profileLength, chunk.data.length, "ICC profile length");
    }
    if (total === 0 || total > 255 || iccChunks.length !== total || sequences.size !== total || Array.from({ length: total }, (_, index) => index + 1).some((sequence) => !sequences.has(sequence))) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG ICC_PROFILE chunks are incomplete or out of sequence.");
    const profile = new Uint8Array(profileLength);
    let offset = 0;
    for (const chunk of [...iccChunks].sort((left, right) => left.sequence - right.sequence)) { profile.set(chunk.data, offset); offset += chunk.data.length; }
    if (profile.length < 132 || readUint32(profile, 0) !== profile.length || profile[36] !== 0x61 || profile[37] !== 0x63 || profile[38] !== 0x73 || profile[39] !== 0x70) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG ICC_PROFILE chunks do not contain a complete profile.");
  }
}

function containsAscii(bytes: Uint8Array, text: string): boolean {
  const needle = asciiBytes(text);
  outer: for (let offset = 0; offset <= bytes.length - needle.length; offset += 1) {
    for (let index = 0; index < needle.length; index += 1) if (bytes[offset + index] !== needle[index]) continue outer;
    return true;
  }
  return false;
}

function containsUltraHdr(payload: Uint8Array): boolean {
  return containsAscii(payload, "http://ns.adobe.com/hdr-gain-map/1.0/") || containsAscii(payload, "hdrgm:Version");
}

function encodeData(data: string | Uint8Array | undefined, limits: SecurityLimits, label: string): Uint8Array {
  if (data === undefined) throw new JpegWriterError("INVALID_VALUE", `${label} requires data.`);
  const result = typeof data === "string" ? new TextEncoder().encode(data) : data.slice();
  if (result.length > limits.maxValueBytes) throw new JpegWriterError("LIMIT_EXCEEDED", `${label} exceeds the configured value limit.`);
  return result;
}

function normalizedXmpPacket(data: string | Uint8Array | undefined, limits: SecurityLimits): Uint8Array {
  const encoded = encodeData(data, limits, "XMP packet");
  const packet = startsWith(encoded, XMP_IDENTIFIER) ? encoded.subarray(XMP_IDENTIFIER.length).slice() : encoded;
  if (packet.length > limits.maxStringBytes) throw new JpegWriterError("LIMIT_EXCEEDED", "XMP packet exceeds the configured string limit.");
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(packet);
  } catch {
    throw new JpegWriterError("INVALID_VALUE", "XMP packet data must be valid UTF-8.");
  }
  return packet;
}

function normalizedGuid(guid: string | undefined): string {
  if (guid === undefined || !/^[A-Fa-f0-9]{32}$/u.test(guid)) throw new JpegWriterError("INVALID_VALUE", "Extended XMP requires a 32-hex-character GUID.");
  return guid.toUpperCase();
}

function extendedXmpSegments(data: string | Uint8Array | undefined, guidValue: string | undefined, limits: SecurityLimits): Uint8Array[] {
  const guid = normalizedGuid(guidValue);
  const logical = normalizedXmpPacket(data, limits);
  if (logical.length === 0 || logical.length > 0xffffffff) throw new JpegWriterError("LIMIT_EXCEEDED", "Extended XMP logical data must fit in a 32-bit length field.");
  const maxChunk = Math.min(MAX_JPEG_PAYLOAD, limits.maxSegmentBytes) - EXTENDED_XMP_IDENTIFIER.length - 40;
  if (maxChunk < 1) throw new JpegWriterError("LIMIT_EXCEEDED", "Configured JPEG segment limits leave no room for Extended XMP data.");
  const chunks: Uint8Array[] = [];
  for (let offset = 0; offset < logical.length; offset += maxChunk) {
    const dataChunk = logical.subarray(offset, Math.min(logical.length, offset + maxChunk));
    const payload = new Uint8Array(EXTENDED_XMP_IDENTIFIER.length + 40 + dataChunk.length);
    payload.set(EXTENDED_XMP_IDENTIFIER, 0);
    payload.set(asciiBytes(guid), EXTENDED_XMP_IDENTIFIER.length);
    writeUint32(payload, EXTENDED_XMP_IDENTIFIER.length + 32, logical.length);
    writeUint32(payload, EXTENDED_XMP_IDENTIFIER.length + 36, offset);
    payload.set(dataChunk, EXTENDED_XMP_IDENTIFIER.length + 40);
    chunks.push(makeSegment(APP1, payload, limits));
  }
  return chunks;
}

function standardXmpSegment(data: string | Uint8Array | undefined, limits: SecurityLimits): Uint8Array {
  const packet = normalizedXmpPacket(data, limits);
  const payloadLength = XMP_IDENTIFIER.length + packet.length;
  checkedSegmentLength(payloadLength, limits);
  return makeSegment(APP1, new Uint8Array([...XMP_IDENTIFIER, ...packet]), limits);
}

function buildIccSegments(data: string | Uint8Array | undefined, limits: SecurityLimits): Uint8Array[] {
  const profile = encodeData(data, limits, "ICC profile");
  if (profile.length < 132 || readUint32(profile, 0) !== profile.length || profile[36] !== 0x61 || profile[37] !== 0x63 || profile[38] !== 0x73 || profile[39] !== 0x70) throw new JpegWriterError("INVALID_VALUE", "ICC profile data must contain a complete header with a matching profile size and acsp signature.");
  const maxChunk = Math.min(MAX_JPEG_PAYLOAD, limits.maxSegmentBytes) - 14;
  if (maxChunk < 1) throw new JpegWriterError("LIMIT_EXCEEDED", "Configured JPEG segment limits leave no room for ICC data.");
  const count = Math.ceil(profile.length / maxChunk);
  if (count < 1 || count > 255) throw new JpegWriterError("LIMIT_EXCEEDED", "ICC profile requires more than the 255 JPEG ICC chunks allowed by the format.");
  const chunks: Uint8Array[] = [];
  for (let index = 0; index < count; index += 1) {
    const profileChunk = profile.subarray(index * maxChunk, Math.min(profile.length, (index + 1) * maxChunk));
    const payload = new Uint8Array(14 + profileChunk.length);
    payload.set(ICC_IDENTIFIER, 0);
    payload[12] = index + 1;
    payload[13] = count;
    payload.set(profileChunk, 14);
    chunks.push(makeSegment(APP2, payload, limits));
  }
  return chunks;
}

function buildPhotoshopIptc(data: Uint8Array): Uint8Array {
  const padded = data.length & 1;
  const total = [PHOTOSHOP_IDENTIFIER.length, 4, 2, 2, 4, data.length, padded].reduce((sum, value) => checkedSum(sum, value, "Photoshop resource size"), 0);
  const payload = new Uint8Array(total);
  let cursor = 0;
  payload.set(PHOTOSHOP_IDENTIFIER, cursor); cursor += PHOTOSHOP_IDENTIFIER.length;
  payload.set(RESOURCE_SIGNATURE, cursor); cursor += RESOURCE_SIGNATURE.length;
  writeUint16(payload, cursor, IPTC_RESOURCE_ID); cursor += 2;
  payload[cursor] = 0; payload[cursor + 1] = 0; cursor += 2;
  writeUint32(payload, cursor, data.length); cursor += 4;
  payload.set(data, cursor);
  return payload;
}

function buildIptcSegment(data: string | Uint8Array | undefined, limits: SecurityLimits): Uint8Array {
  const iim = encodeData(data, limits, "IPTC-IIM data");
  return makeSegment(APP13, buildPhotoshopIptc(iim), limits);
}

function rawSegmentPayload(segmentBytes: Uint8Array): Uint8Array {
  return segmentBytes.subarray(4).slice();
}

function blockKey(kind: JpegBlockKind, guid?: string, blockId?: string, resourceId?: string): string {
  return `${kind}:${guid ?? ""}:${blockId ?? resourceId ?? "all"}`;
}

function targetKey(target: EditTarget): string {
  if (target.kind === "field") return `field:${target.fieldId}`;
  const selector = target.selector;
  switch (selector.kind) {
    case "family": return `family:${selector.family}`;
    case "block": return `block:${selector.blockId}`;
    case "namespace-property": return `property:${selector.namespaceUri}#${selector.localName}`;
    case "field-id": return `field:${selector.fieldId}`;
    case "associated-image": return `associated:${selector.imageId}`;
    case "sensitivity": return `sensitivity:${selector.sensitivity}`;
    case "photoshop-resource": return `photoshop-resource:${selector.resourceId}`;
    case "policy": return `policy:${selector.policyId}`;
  }
}

function isPreserved(target: EditTarget, policy: EditPolicyEvidence): boolean {
  const key = targetKey(target);
  return policy.preserve.some((candidate) => targetKey(candidate) === key);
}

function targetFamily(target: EditTarget): string | null {
  if (target.kind === "field") {
    const [family] = target.fieldId.split(":", 1);
    return family ?? null;
  }
  return target.selector.kind === "family" ? target.selector.family : null;
}

function targetBlockId(target: EditTarget): string | null {
  if (target.kind === "selector" && target.selector.kind === "block") return target.selector.blockId;
  return null;
}

function targetField(target: EditTarget): string | null {
  if (target.kind === "field") return target.fieldId;
  if (target.selector.kind === "field-id") return target.selector.fieldId;
  return null;
}

function blockTarget(target: EditTarget, index?: JpegIndex): { readonly kind: JpegBlockKind; readonly guid?: string; readonly blockId?: string; readonly resourceId?: string } | null {
  if (target.kind === "selector" && target.selector.kind === "photoshop-resource") return { kind: "photoshop-resource", resourceId: target.selector.resourceId };
  const field = targetField(target);
  const blockId = targetBlockId(target) ?? undefined;
  const family = targetFamily(target);
  if (blockId !== undefined && field === null && family === null && index !== undefined) {
    const segment = index.segments.find((candidate) => candidate.id === blockId);
    if (segment?.kind === "standard-xmp" || segment?.kind === "extended-xmp" || segment?.kind === "icc" || segment?.kind === "iptc") return { kind: segment.kind, ...(segment.guid === null ? {} : { guid: segment.guid }), blockId };
  }
  if (field === "XMP:standard") return { kind: "standard-xmp", ...(blockId === undefined ? {} : { blockId }) };
  if (field === "XMP:extended") return { kind: "extended-xmp", ...(blockId === undefined ? {} : { blockId }) };
  if (field?.startsWith("XMP:extended:") === true) {
    return { kind: "extended-xmp", guid: normalizedGuid(field.slice("XMP:extended:".length)), ...(blockId === undefined ? {} : { blockId }) };
  }
  if (field === "ICC:profile") return { kind: "icc", ...(blockId === undefined ? {} : { blockId }) };
  if (field === "IPTC:IIM") return { kind: "iptc", ...(blockId === undefined ? {} : { blockId }) };
  if (family === "XMP") return { kind: "standard-xmp", ...(blockId === undefined ? {} : { blockId }) };
  if (family === "ICC") return { kind: "icc", ...(blockId === undefined ? {} : { blockId }) };
  if (family === "IPTC") return { kind: "iptc", ...(blockId === undefined ? {} : { blockId }) };
  return null;
}

function isExifTarget(target: EditTarget): boolean {
  const field = targetField(target);
  return field !== null && (field.startsWith("EXIF:") || field.startsWith("normalized:"));
}

function isExifOperation(operation: EditOperation): boolean {
  if (operation.op === "set" || operation.op === "delete") return isExifTarget(operation.target);
  if (operation.op === "copy" || operation.op === "rename" || operation.op === "alias") return isExifTarget(operation.source) && isExifTarget(operation.destination);
  return false;
}

const NEW_EXIF_FIELDS: Readonly<Record<string, string>> = {
  "normalized:Make": "EXIF:IFD0:0x010f",
  "normalized:Model": "EXIF:IFD0:0x0110",
  "normalized:Orientation": "EXIF:IFD0:0x0112",
  "normalized:DateTime": "EXIF:IFD0:0x0132",
  "normalized:Artist": "EXIF:IFD0:0x013b",
  "normalized:Software": "EXIF:IFD0:0x0131",
  "normalized:Copyright": "EXIF:IFD0:0x8298",
};

const NEW_EXIF_TYPES: Readonly<Record<string, "ASCII" | "SHORT">> = {
  "EXIF:IFD0:0x010f": "ASCII",
  "EXIF:IFD0:0x0110": "ASCII",
  "EXIF:IFD0:0x0112": "SHORT",
  "EXIF:IFD0:0x0132": "ASCII",
  "EXIF:IFD0:0x013b": "ASCII",
  "EXIF:IFD0:0x0131": "ASCII",
  "EXIF:IFD0:0x8298": "ASCII",
};

function newExifOperation(operation: EditOperation): EditOperation | null {
  if (operation.op !== "set") return null;
  const field = targetField(operation.target);
  if (field === null) return null;
  const explicit = NEW_EXIF_FIELDS[field] ?? (/^(?:EXIF:)?IFD0:0x[0-9a-fA-F]{1,4}$/u.test(field) ? field : null);
  if (explicit === null) return null;
  return field === explicit ? operation : { ...operation, target: { kind: "field", fieldId: explicit } };
}

function newExifGraph(operation: EditOperation): Parameters<typeof serializeTiff>[0] {
  const synthetic = newExifOperation(operation);
  if (synthetic === null || synthetic.op !== "set") throw new JpegWriterError("UNSUPPORTED_STRUCTURE", "The requested EXIF field cannot be created in a new IFD0 directory.");
  const field = targetField(synthetic.target);
  const match = field === null ? null : /^(?:EXIF:)?IFD0:0x([0-9a-fA-F]{1,4})$/u.exec(field);
  const tag = match?.[1] === undefined ? null : Number.parseInt(match[1], 16);
  if (tag === null) throw new JpegWriterError("UNSUPPORTED_STRUCTURE", "Only IFD0 EXIF fields can be created when a JPEG has no EXIF block.");
  const type = NEW_EXIF_TYPES[field ?? ""] ?? (typeof synthetic.value === "string" ? "ASCII" : typeof synthetic.value === "number" ? "LONG" : "UNDEFINED");
  const value = type === "ASCII" ? { kind: "text" as const, value: "" } : type === "SHORT" ? { kind: "numbers" as const, values: [1] } : { kind: "numbers" as const, values: [0] };
  return { byteOrder: "little-endian", variant: "classic", rootDirectoryId: "IFD0@8", directories: [{ id: "IFD0@8", entries: [{ tag, type, value }], nextDirectoryId: null }], preservedData: [] };
}

function makeFailure(code: EditFailure["code"], detail: string): EditFailure {
  return { code, detail };
}

function statusForFailure(code: EditFailure["code"]): EditOperationStatus {
  if (code === "INVALID_VALUE") return "invalid-value";
  if (code === "UNSAFE_STRUCTURE") return "unsafe-structure";
  if (code === "POLICY_FAILURE") return "policy-failure";
  if (code === "VERIFICATION_FAILURE") return "verification-failure";
  return "unsupported";
}

function operationResult(operation: EditOperation, failure: EditFailure | null, appliedCount: number, matchedFieldIds: readonly string[], matchedBlockIds: readonly string[], preservedUnknownCandidates: number | null): JpegTransactionOperation {
  return {
    operationId: operation.operationId,
    operation: operation.op,
    status: failure === null ? "applied" : statusForFailure(failure.code),
    failure,
    appliedCount: failure === null ? appliedCount : 0,
    matchedFieldIds: failure === null ? matchedFieldIds : [],
    matchedBlockIds: failure === null ? matchedBlockIds : [],
    preservedUnknownCandidates,
  };
}

function buildBlockSegments(edit: JpegBlockEdit, limits: SecurityLimits): Uint8Array[] {
  switch (edit.kind) {
    case "standard-xmp": return [standardXmpSegment(edit.data, limits)];
    case "extended-xmp": return extendedXmpSegments(edit.data, edit.guid, limits);
    case "icc": return buildIccSegments(edit.data, limits);
    case "iptc": return [buildIptcSegment(edit.data, limits)];
    case "photoshop-resource": throw new JpegWriterError("INVALID_VALUE", "Photoshop resource edits only support exact removal and do not create serialized segments.");
  }
}

function segmentMatches(segment: JpegSegment, target: { readonly kind: JpegBlockKind; readonly guid?: string; readonly blockId?: string }): boolean {
  if (segment.kind !== target.kind) return false;
  if (target.guid !== undefined && segment.guid !== target.guid) return false;
  return target.blockId === undefined || target.blockId === segment.id;
}

function validateBlockEdit(edit: unknown): asserts edit is JpegBlockEdit {
  if (edit === null || typeof edit !== "object" || Array.isArray(edit)) throw new JpegWriterError("INVALID_VALUE", "JPEG block edits must be objects.");
  const candidate = edit as Record<string, unknown>;
  const op = candidate.op;
  const kind = candidate.kind;
  if (op !== "add" && op !== "replace" && op !== "remove") throw new JpegWriterError("INVALID_VALUE", "JPEG block edit operation is not supported.");
  if (kind !== "standard-xmp" && kind !== "extended-xmp" && kind !== "icc" && kind !== "iptc" && kind !== "photoshop-resource") throw new JpegWriterError("INVALID_VALUE", "JPEG block edit kind is not supported.");
  if (kind === "photoshop-resource") {
    if (op !== "remove" || typeof candidate.resourceId !== "string" || candidate.resourceId.length === 0 || candidate.resourceId.length > 512) throw new JpegWriterError("INVALID_VALUE", "Photoshop resource edits require a bounded exact resourceId and only support remove.");
    if (candidate.blockId !== undefined || candidate.guid !== undefined || candidate.data !== undefined) throw new JpegWriterError("INVALID_VALUE", "Photoshop resource removal cannot include a blockId, GUID, or replacement data.");
    return;
  }
  if (kind !== "extended-xmp" && candidate.guid !== undefined) throw new JpegWriterError("INVALID_VALUE", "Only Extended XMP block edits may include a GUID.");
  if (candidate.guid !== undefined && typeof candidate.guid !== "string") throw new JpegWriterError("INVALID_VALUE", "JPEG block GUID must be a string.");
  if (candidate.blockId !== undefined && (typeof candidate.blockId !== "string" || candidate.blockId.length === 0 || candidate.blockId.length > 512)) throw new JpegWriterError("INVALID_VALUE", "JPEG blockId is empty or exceeds the bounded identity limit.");
  if (op === "add" && candidate.blockId !== undefined) throw new JpegWriterError("INVALID_VALUE", "JPEG add operations cannot name a pre-existing physical blockId.");
  if (kind === "extended-xmp" && candidate.blockId !== undefined) throw new JpegWriterError("INVALID_VALUE", "Extended XMP blockId selection is not supported; its interdependent chunks must be addressed by GUID as one logical sequence.");
  if (kind === "extended-xmp" && op !== "remove") normalizedGuid(candidate.guid);
  if (op !== "remove" && candidate.data === undefined) throw new JpegWriterError("INVALID_VALUE", `JPEG ${op} operation requires data.`);
  if (op === "remove" && candidate.data !== undefined) throw new JpegWriterError("INVALID_VALUE", "JPEG remove operation cannot include data.");
  if (candidate.data !== undefined && typeof candidate.data !== "string" && !(candidate.data instanceof Uint8Array)) throw new JpegWriterError("INVALID_VALUE", "JPEG block data must be a string or Uint8Array.");
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) if (left[index] !== right[index]) return false;
  return true;
}

function replaceIptcPayload(payload: Uint8Array, data: Uint8Array, limits: SecurityLimits): Uint8Array {
  const parsed = parsePhotoshop(payload);
  if (parsed === null) throw new JpegWriterError("UNSAFE_STRUCTURE", "IPTC replacement encountered malformed Photoshop resources.");
  if (parsed.rawIim) return buildPhotoshopIptc(data);
  const iptc = parsed.resources.filter((resource) => resource.id === IPTC_RESOURCE_ID);
  const replacement = buildPhotoshopIptc(data).subarray(PHOTOSHOP_IDENTIFIER.length);
  if (iptc.length === 0) {
    const appended = new Uint8Array(payload.length + replacement.length);
    appended.set(payload, 0); appended.set(replacement, payload.length);
    checkedSegmentLength(appended.length, limits);
    return appended;
  }
  const parts: Uint8Array[] = [PHOTOSHOP_IDENTIFIER];
  let cursor = PHOTOSHOP_IDENTIFIER.length;
  for (const resource of parsed.resources) {
    if (resource.id === IPTC_RESOURCE_ID) {
      parts.push(replacement);
    } else {
      parts.push(payload.subarray(resource.start, resource.end));
    }
    cursor = resource.end;
  }
  if (cursor !== payload.length) throw new JpegWriterError("UNSAFE_STRUCTURE", "Photoshop resource payload has an unaccounted tail.");
  const total = parts.reduce((sum, part) => checkedSum(sum, part.length, "Photoshop replacement size"), 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  checkedSegmentLength(result.length, limits);
  return result;
}

function removeIptcPayload(payload: Uint8Array, limits: SecurityLimits): Uint8Array | null {
  const parsed = parsePhotoshop(payload);
  if (parsed === null) throw new JpegWriterError("UNSAFE_STRUCTURE", "IPTC removal encountered malformed Photoshop resources.");
  if (parsed.rawIim) return null;
  const parts: Uint8Array[] = [PHOTOSHOP_IDENTIFIER];
  let retained = 0;
  let removed = 0;
  for (const resource of parsed.resources) {
    if (resource.id === IPTC_RESOURCE_ID) {
      removed += 1;
      continue;
    }
    parts.push(payload.subarray(resource.start, resource.end));
    retained += 1;
  }
  if (removed === 0) return payload.slice();
  if (retained === 0) return null;
  const total = parts.reduce((sum, part) => checkedSum(sum, part.length, "Photoshop removal size"), 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  checkedSegmentLength(result.length, limits);
  return result;
}

function removeExactPhotoshopResources(work: SegmentWork, resourceIndices: ReadonlySet<number>, limits: SecurityLimits): void {
  const originalPayload = rawSegmentPayload(work.originalBytes);
  const originalSpans = inspectPhotoshopResourceSpans(originalPayload, "app13", limits);
  const payload = rawSegmentPayload(work.bytes);
  const spans = inspectPhotoshopResourceSpans(payload, "app13", limits);
  if (originalSpans === null || !originalSpans.complete || spans === null || !spans.complete) throw new JpegWriterError("UNSAFE_STRUCTURE", "Exact Photoshop resource removal encountered malformed image-resource data.", work.original.start);
  const removedIndices = work.removedPhotoshopResourceIndices ?? new Set<number>();
  if (spans.spans.length !== originalSpans.spans.length - removedIndices.size) throw new JpegWriterError("UNSAFE_STRUCTURE", "The current Photoshop resource sequence no longer has a safe source-order mapping.", work.original.start);
  if (resourceIndices.size === 0 || [...resourceIndices].some((index) => !Number.isSafeInteger(index) || index < 0 || index >= originalSpans.spans.length || removedIndices.has(index))) throw new JpegWriterError("INVALID_VALUE", "Exact Photoshop resource selection did not resolve to an available source resource.");
  const selectedCurrentIndices = new Set<number>();
  for (const originalIndex of resourceIndices) {
    const removedBefore = [...removedIndices].filter((index) => index < originalIndex).length;
    const currentIndex = originalIndex - removedBefore;
    if (currentIndex < 0 || currentIndex >= spans.spans.length || selectedCurrentIndices.has(currentIndex)) throw new JpegWriterError("INVALID_VALUE", "Exact Photoshop resource selection did not resolve uniquely to the current resource sequence.");
    selectedCurrentIndices.add(currentIndex);
  }
  const selected = spans.spans.filter((span) => selectedCurrentIndices.has(span.index));
  if (selected.length !== resourceIndices.size) throw new JpegWriterError("INVALID_VALUE", "Exact Photoshop resource selection did not resolve uniquely to the current resource sequence.");
  const nextLength = payload.length - selected.reduce((sum, span) => checkedSum(sum, span.end - span.start, "Photoshop resource size"), 0);
  if (!Number.isSafeInteger(nextLength) || nextLength < PHOTOSHOP_IDENTIFIER.length) throw new JpegWriterError("UNSAFE_STRUCTURE", "Exact Photoshop resource removal produced an invalid payload length.", work.original.start);
  for (const index of resourceIndices) removedIndices.add(index);
  work.removedPhotoshopResourceIndices = removedIndices;
  if (nextLength === PHOTOSHOP_IDENTIFIER.length) {
    work.removed = true;
    return;
  }
  const output = new Uint8Array(nextLength);
  let sourceOffset = 0;
  let outputOffset = 0;
  for (const span of spans.spans) {
    if (selectedCurrentIndices.has(span.index)) {
      output.set(payload.subarray(sourceOffset, span.start), outputOffset);
      outputOffset += span.start - sourceOffset;
      sourceOffset = span.end;
    }
  }
  output.set(payload.subarray(sourceOffset), outputOffset);
  checkedSegmentLength(output.length, limits);
  work.bytes = makeSegment(APP13, output, limits);
}

function markRemovedPhotoshopResourceIndices(work: SegmentWork, currentIndices: ReadonlySet<number>, limits: SecurityLimits): void {
  const originalSpans = inspectPhotoshopResourceSpans(rawSegmentPayload(work.originalBytes), "app13", limits);
  const currentSpans = inspectPhotoshopResourceSpans(rawSegmentPayload(work.bytes), "app13", limits);
  if (originalSpans === null || !originalSpans.complete || currentSpans === null || !currentSpans.complete) throw new JpegWriterError("UNSAFE_STRUCTURE", "Photoshop resource removal encountered malformed image-resource data.", work.original.start);
  const removedIndices = work.removedPhotoshopResourceIndices ?? new Set<number>();
  const activeIndices = originalSpans.spans.map((span) => span.index).filter((index) => !removedIndices.has(index));
  if (currentSpans.spans.length !== activeIndices.length) throw new JpegWriterError("UNSAFE_STRUCTURE", "The current Photoshop resource sequence no longer has a safe source-order mapping.", work.original.start);
  for (const currentIndex of currentIndices) {
    const originalIndex = activeIndices[currentIndex];
    if (originalIndex === undefined || removedIndices.has(originalIndex)) throw new JpegWriterError("UNSAFE_STRUCTURE", "Photoshop resource removal did not map to a source-order resource.", work.original.start);
    removedIndices.add(originalIndex);
  }
  work.removedPhotoshopResourceIndices = removedIndices;
}

function exactPhotoshopSegmentIds(input: Uint8Array, index: JpegIndex, resourceId: string, limits: SecurityLimits): readonly string[] {
  return index.segments.filter((segment) => {
    if (segment.marker !== APP13) return false;
    const spans = inspectPhotoshopResourceSpans(input.subarray(segment.payloadStart, segment.payloadEnd), "app13", limits);
    const photoshopId = segment.id.replace(/^jpeg:APP13:/u, "jpeg:APP13:photoshop:");
    return spans?.complete === true && spans.spans.some((span) => `${segment.id}:resource:${span.index}` === resourceId || `${photoshopId}:resource:${span.index}` === resourceId);
  }).map((segment) => segment.id);
}

function outputForBlocks(input: Uint8Array, index: JpegIndex, blocks: readonly JpegBlockEdit[], limits: SecurityLimits, options: Pick<JpegRewriteOptions, "duplicatePolicy" | "verify" | "preservation" | "c2pa"> = {}): JpegRewriteResult {
  findUnsupportedStructure(input, index, limits, options.c2pa);
  const works: SegmentWork[] = index.segments.map((segment) => ({ original: segment, originalBytes: input.subarray(segment.start, segment.end).slice(), bytes: input.subarray(segment.start, segment.end).slice(), removed: false }));
  const inserted: InsertedSegment[] = [];
  applyBlockEditsToWorks(index, blocks, limits, works, inserted, options.duplicatePolicy ?? "preserve");

  const planned = rebuildJpeg(input, works, inserted, limits);
  const after = parseJpegIndex(planned.data, limits);
  verifyExtendedXmpRelationships(planned.data, after, limits);
  if (options.verify !== false) verifyJpegRewrite(input, planned.data, index, limits, planned.placedSegments);
  const preservedPayloads = index.scans.map((scan, scanIndex) => {
    const afterScan = after.scans[scanIndex];
    if (afterScan === undefined) throw new JpegWriterError("VERIFICATION_FAILURE", `JPEG scan ${scan.id} disappeared during rewriting.`);
    return { id: scan.id, before: input.subarray(scan.start, scan.end).slice(), after: planned.data.subarray(afterScan.start, afterScan.end).slice() };
  });
  const preservation = options.verify === false
    ? null
    : verifyPreservationSync(input, planned.data, { colorPolicy: "report-only", orientationPolicy: "preserve", ...options.preservation, limits });
  if (preservation !== null && !preservation.successful) throw new JpegWriterError("VERIFICATION_FAILURE", `Independent JPEG preservation verification failed: ${preservation.diagnostics.join(" ")}`);
  return { data: planned.data, byteChanges: planned.changes, preservedPayloads, inputBytes: input.length, outputBytes: planned.data.length, preservation };
}

function verifyExtendedXmpRelationships(bytes: Uint8Array, index: JpegIndex, limits: SecurityLimits): void {
  const referenced = new Set<string>();
  const chunks = new Map<string, ExtendedXmpChunk[]>();
  for (const segment of index.segments) {
    const payload = bytes.subarray(segment.payloadStart, segment.payloadEnd);
    if (segment.kind === "standard-xmp") {
      let packet: string;
      try { packet = new TextDecoder("utf-8", { fatal: true }).decode(payload.subarray(XMP_IDENTIFIER.length)); } catch { continue; }
      const guid = extendedXmpGuid(packet);
      if (guid !== null) referenced.add(guid);
    } else if (segment.kind === "extended-xmp") {
      const chunk = parseExtendedXmpChunk(payload);
      if (chunk !== null) {
        const values = chunks.get(chunk.guid) ?? [];
        values.push(chunk);
        chunks.set(chunk.guid, values);
      }
    }
  }
  for (const guid of referenced) if (!chunks.has(guid) || reassembleExtendedXmp(chunks.get(guid) ?? [], limits.maxStringBytes) === null) throw new JpegWriterError("UNSAFE_STRUCTURE", `Standard XMP references missing or invalid Extended XMP GUID ${guid}.`);
  for (const [guid, values] of chunks) if (!referenced.has(guid) || reassembleExtendedXmp(values, limits.maxStringBytes) === null) throw new JpegWriterError("UNSAFE_STRUCTURE", `Extended XMP GUID ${guid} is not referenced by a valid standard XMP packet.`);
}

function applyBlockEditsToWorks(
  index: JpegIndex,
  blocks: readonly JpegBlockEdit[],
  limits: SecurityLimits,
  works: readonly SegmentWork[],
  inserted: InsertedSegment[],
  duplicatePolicy: NonNullable<JpegRewriteOptions["duplicatePolicy"]>,
): void {
  let insertedCount = inserted.length;
  const anchor = index.segments.findIndex((segment) => isStartOfFrame(segment.marker));
  const insertionAnchor = anchor < 0 ? 0 : anchor;
  const exactSelections = new Map<SegmentWork, Set<number>>();
  for (const edit of blocks) {
    validateBlockEdit(edit);
    if (edit.kind !== "photoshop-resource") continue;
    const matches = works.filter((work) => {
      if (work.removed || work.original.marker !== APP13 || !startsWith(rawSegmentPayload(work.originalBytes), PHOTOSHOP_IDENTIFIER)) return false;
      const spans = inspectPhotoshopResourceSpans(rawSegmentPayload(work.originalBytes), "app13", limits);
      if (spans?.complete !== true) throw new JpegWriterError("UNSAFE_STRUCTURE", "Exact Photoshop resource removal encountered malformed image-resource data.", work.original.start);
      const photoshopId = work.original.id.replace(/^jpeg:APP13:/u, "jpeg:APP13:photoshop:");
      return spans.spans.some((span) => `${work.original.id}:resource:${span.index}` === edit.resourceId || `${photoshopId}:resource:${span.index}` === edit.resourceId);
    });
    if (matches.length !== 1) throw new JpegWriterError("INVALID_VALUE", `Exact Photoshop resource ${edit.resourceId ?? ""} was not found uniquely in the JPEG.`);
    const work = matches[0] as SegmentWork;
    const spans = inspectPhotoshopResourceSpans(rawSegmentPayload(work.originalBytes), "app13", limits);
    if (spans === null || !spans.complete) throw new JpegWriterError("UNSAFE_STRUCTURE", "Exact Photoshop resource removal encountered malformed image-resource data.", work.original.start);
    const photoshopId = work.original.id.replace(/^jpeg:APP13:/u, "jpeg:APP13:photoshop:");
    const span = spans.spans.find((candidate) => `${work.original.id}:resource:${candidate.index}` === edit.resourceId || `${photoshopId}:resource:${candidate.index}` === edit.resourceId);
    if (span === undefined) throw new JpegWriterError("INVALID_VALUE", `Exact Photoshop resource ${edit.resourceId ?? ""} was not found in its source APP13 block.`);
    const selected = exactSelections.get(work) ?? new Set<number>();
    if (selected.has(span.index)) throw new JpegWriterError("INVALID_VALUE", `Exact Photoshop resource ${edit.resourceId ?? ""} was selected more than once.`);
    selected.add(span.index);
    exactSelections.set(work, selected);
  }
  for (const [work, resourceIndices] of exactSelections) removeExactPhotoshopResources(work, resourceIndices, limits);
  for (const edit of blocks) {
    validateBlockEdit(edit);
    if (edit.kind === "photoshop-resource") {
      continue;
    }
    const target = { kind: edit.kind, ...(edit.guid === undefined ? {} : { guid: normalizedGuid(edit.guid) }), ...(edit.blockId === undefined ? {} : { blockId: edit.blockId }) };
    const matches = works.filter((work) => !work.removed && segmentMatches(work.original, target));
    const logicalSequence = edit.kind === "icc" || edit.kind === "extended-xmp";
    if (edit.op === "remove") {
      if (matches.length === 0) continue;
      if (duplicatePolicy === "reject" && !logicalSequence && matches.length > 1 && edit.blockId === undefined) throw new JpegWriterError("INVALID_VALUE", `JPEG ${edit.kind} has duplicate blocks under reject policy.`);
      const selected = logicalSequence ? works.filter((work) => !work.removed && segmentMatches(work.original, target)) : edit.blockId === undefined && duplicatePolicy === "replace-target" ? matches.slice(0, 1) : matches;
      for (const work of selected) {
        if (edit.kind === "iptc") {
          const parsedPhotoshop = parsePhotoshop(rawSegmentPayload(work.bytes));
          const removedPhotoshopIndices = parsedPhotoshop === null || parsedPhotoshop.rawIim
            ? new Set<number>()
            : new Set(parsedPhotoshop.resources.flatMap((resource, index) => resource.id === IPTC_RESOURCE_ID ? [index] : []));
          if (removedPhotoshopIndices.size > 0) markRemovedPhotoshopResourceIndices(work, removedPhotoshopIndices, limits);
          const remaining = removeIptcPayload(rawSegmentPayload(work.bytes), limits);
          if (remaining === null) work.removed = true;
          else work.bytes = makeSegment(APP13, remaining, limits);
        } else work.removed = true;
      }
      continue;
    }
    const newSegments = buildBlockSegments(edit, limits);
    if (edit.op === "add") {
      if (edit.kind === "icc" && matches.length > 0) throw new JpegWriterError("INVALID_VALUE", "JPEG ICC profiles are a single logical APP2 sequence; replace the existing profile instead of adding a second sequence.");
      for (const bytes of newSegments) inserted.push({ anchor: insertionAnchor, id: `jpeg:${edit.kind}:inserted:${insertedCount++}`, bytes });
      continue;
    }
    if (matches.length === 0) throw new JpegWriterError("INVALID_VALUE", `JPEG ${edit.kind} replace target was not found.`);
    if (duplicatePolicy === "reject" && !logicalSequence && matches.length > 1 && edit.blockId === undefined) throw new JpegWriterError("INVALID_VALUE", `JPEG ${edit.kind} has duplicate blocks under reject policy.`);
    const selected = logicalSequence ? works.filter((work) => !work.removed && segmentMatches(work.original, target)) : edit.blockId === undefined && duplicatePolicy === "replace-target" ? matches.slice(0, 1) : matches;
    if (edit.kind === "iptc") {
      const data = encodeData(edit.data, limits, "IPTC-IIM data");
      for (const work of selected) work.bytes = makeSegment(APP13, replaceIptcPayload(rawSegmentPayload(work.bytes), data, limits), limits);
      if (duplicatePolicy === "deduplicate-equivalent") {
        const first = selected[0];
        if (first !== undefined) for (const work of selected.slice(1)) if (equalBytes(work.bytes, first.bytes)) work.removed = true;
      }
    } else if (edit.kind === "extended-xmp" || edit.kind === "icc") {
      const first = selected[0];
      if (first === undefined) throw new JpegWriterError("UNSAFE_STRUCTURE", `${edit.kind} replacement has no selected chunk.`);
      first.bytes = newSegments[0] ?? first.bytes;
      for (const extra of selected.slice(1)) extra.removed = true;
      for (const extra of newSegments.slice(1)) inserted.push({ anchor: works.indexOf(first) + 1, id: `jpeg:extended-xmp:inserted:${insertedCount++}`, bytes: extra });
    } else {
      for (const work of selected) work.bytes = newSegments[0] ?? work.bytes;
      if (duplicatePolicy === "deduplicate-equivalent") {
        const first = selected[0];
        if (first !== undefined) for (const work of selected.slice(1)) if (equalBytes(work.bytes, first.bytes)) work.removed = true;
      }
    }
  }
}

function rebuildJpeg(input: Uint8Array, works: readonly SegmentWork[], inserted: readonly InsertedSegment[], limits: SecurityLimits): PlannedOutput {
  let outputSize = 2;
  let sourceCursor = 2;
  const orderedInsertions = [...inserted].sort((left, right) => left.anchor - right.anchor || left.id.localeCompare(right.id));
  for (let index = 0; index < works.length; index += 1) {
    const work = works[index];
    if (work === undefined) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG segment plan lost an entry.");
    outputSize = checkedSum(outputSize, work.original.start - sourceCursor, "JPEG output size");
    for (const addition of orderedInsertions.filter((candidate) => candidate.anchor === index)) outputSize = checkedSum(outputSize, addition.bytes.length, "JPEG output size");
    if (!work.removed) outputSize = checkedSum(outputSize, work.bytes.length, "JPEG output size");
    sourceCursor = work.original.end;
  }
  outputSize = checkedSum(outputSize, input.length - sourceCursor, "JPEG output size");
  if (outputSize > limits.maxAdapterOutputBytes || outputSize > limits.maxInputBytes) throw new JpegWriterError("LIMIT_EXCEEDED", `Generated JPEG is ${outputSize} bytes, above the configured output limit.`);

  const output = new Uint8Array(outputSize);
  output.set(input.subarray(0, 2), 0);
  let outputCursor = 2;
  sourceCursor = 2;
  const changes: PlacedChange[] = [];
  const placedSegments: { id: string; outputStart: number; outputEnd: number }[] = [];
  for (let index = 0; index < works.length; index += 1) {
    const work = works[index];
    if (work === undefined) throw new JpegWriterError("UNSAFE_STRUCTURE", "JPEG segment plan lost an entry.");
    const gap = input.subarray(sourceCursor, work.original.start);
    output.set(gap, outputCursor); outputCursor += gap.length;
    for (const addition of orderedInsertions.filter((candidate) => candidate.anchor === index)) {
      const start = outputCursor;
      output.set(addition.bytes, outputCursor); outputCursor += addition.bytes.length;
      changes.push({ blockId: addition.id, offset: start, length: addition.bytes.length, kind: "inserted" });
    }
    const outputStart = outputCursor;
    if (work.removed) {
      changes.push({ blockId: work.original.id, offset: outputCursor, length: work.original.end - work.original.start, kind: "removed" });
    } else {
      output.set(work.bytes, outputCursor); outputCursor += work.bytes.length;
      if (!equalBytes(work.bytes, work.originalBytes)) changes.push({ blockId: work.original.id, offset: outputStart, length: work.bytes.length, kind: "rewritten" });
      placedSegments.push({ id: work.original.id, outputStart, outputEnd: outputCursor });
    }
    sourceCursor = work.original.end;
  }
  for (const addition of orderedInsertions.filter((candidate) => candidate.anchor === works.length)) {
    const start = outputCursor;
    output.set(addition.bytes, outputCursor); outputCursor += addition.bytes.length;
    changes.push({ blockId: addition.id, offset: start, length: addition.bytes.length, kind: "inserted" });
  }
  const tail = input.subarray(sourceCursor);
  output.set(tail, outputCursor); outputCursor += tail.length;
  if (outputCursor !== output.length) throw new JpegWriterError("VERIFICATION_FAILURE", "JPEG output assembly length accounting was inconsistent.");
  return { data: output, changes, inserted, placedSegments };
}

function verifyJpegRewrite(input: Uint8Array, output: Uint8Array, before: JpegIndex, limits: SecurityLimits, placedSegments: readonly { readonly id: string; readonly outputStart: number; readonly outputEnd: number }[]): void {
  const after = parseJpegIndex(output, limits);
  if (after.frameDimensions.length !== before.frameDimensions.length) throw new JpegWriterError("VERIFICATION_FAILURE", "JPEG frame count changed during metadata rewriting.");
  for (let index = 0; index < before.frameDimensions.length; index += 1) {
    const expected = before.frameDimensions[index];
    const actual = after.frameDimensions[index];
    if (expected === undefined || actual === undefined || expected.width !== actual.width || expected.height !== actual.height) throw new JpegWriterError("VERIFICATION_FAILURE", "JPEG frame dimensions changed during metadata rewriting.");
  }
  if (after.scans.length !== before.scans.length) throw new JpegWriterError("VERIFICATION_FAILURE", "JPEG scan count changed during metadata rewriting.");
  for (let index = 0; index < before.scans.length; index += 1) {
    const left = before.scans[index];
    const right = after.scans[index];
    if (left === undefined || right === undefined || !equalBytes(input.subarray(left.start, left.end), output.subarray(right.start, right.end))) throw new JpegWriterError("VERIFICATION_FAILURE", `JPEG entropy-coded scan ${left?.id ?? index} changed during metadata rewriting.`);
  }
  const parsed = parseJpeg(output, limits);
  if (parsed.warnings.some((warning) => warning.severity === "error")) throw new JpegWriterError("VERIFICATION_FAILURE", "The rewritten JPEG did not pass the package parser verification.");
  for (const placed of placedSegments) {
    const original = before.segments.find((segment) => segment.id === placed.id);
    if (original === undefined) continue;
    const isMetadata = original.kind !== "other" || (original.marker >= APP0 && original.marker <= APP15) || original.marker === COM;
    if (!isMetadata && !equalBytes(input.subarray(original.start, original.end), output.subarray(placed.outputStart, placed.outputEnd))) throw new JpegWriterError("VERIFICATION_FAILURE", `JPEG decoding-critical marker ${original.id} changed during metadata rewriting.`);
  }
}

/** Rewrite standard/Extended XMP, ICC, and IPTC JPEG metadata blocks. */
export function rewriteJpegMetadata(input: Uint8Array, options: JpegRewriteOptions): JpegRewriteResult {
  const rawOptions: unknown = options;
  if (rawOptions === null || typeof rawOptions !== "object" || Array.isArray(rawOptions)) throw new JpegWriterError("INVALID_VALUE", "JPEG writer options must be an object.");
  const validatedOptions = rawOptions as JpegRewriteOptions;
  const candidateOptions = rawOptions as Record<string, unknown>;
  let limits: SecurityLimits;
  try {
    limits = resolveLimits(validatedOptions.limits);
  } catch (error) {
    throw new JpegWriterError("INVALID_VALUE", error instanceof Error ? error.message : "JPEG writer limits are invalid.");
  }
  if (!(input instanceof Uint8Array)) throw new JpegWriterError("INVALID_VALUE", "JPEG writer input must be a Uint8Array.");
  if (!Array.isArray(validatedOptions.blocks) || validatedOptions.blocks.length === 0) throw new JpegWriterError("INVALID_VALUE", "JPEG writer requires at least one block edit.");
  if (candidateOptions.verify !== undefined && typeof candidateOptions.verify !== "boolean") throw new JpegWriterError("INVALID_VALUE", "JPEG writer verify must be boolean when supplied.");
  if (candidateOptions.preservation !== undefined && (candidateOptions.preservation === null || typeof candidateOptions.preservation !== "object" || Array.isArray(candidateOptions.preservation))) throw new JpegWriterError("INVALID_VALUE", "JPEG preservation options must be an object.");
  const preservationOptions = candidateOptions.preservation as Record<string, unknown> | undefined;
  for (const key of ["colorPolicy", "orientationPolicy"] as const) {
    const value = preservationOptions?.[key];
    if (value !== undefined && value !== "preserve" && value !== "report-only" && value !== "allow-change") throw new JpegWriterError("INVALID_VALUE", `JPEG preservation ${key} is not supported.`);
  }
  if (preservationOptions?.requireCompletePayloadExtraction !== undefined && typeof preservationOptions.requireCompletePayloadExtraction !== "boolean") throw new JpegWriterError("INVALID_VALUE", "JPEG preservation requireCompletePayloadExtraction must be boolean.");
  if (candidateOptions.duplicatePolicy !== undefined && candidateOptions.duplicatePolicy !== "preserve" && candidateOptions.duplicatePolicy !== "replace-target" && candidateOptions.duplicatePolicy !== "deduplicate-equivalent" && candidateOptions.duplicatePolicy !== "reject") throw new JpegWriterError("INVALID_VALUE", "JPEG writer duplicatePolicy is not supported.");
  const index = parseJpegIndex(input, limits);
  return outputForBlocks(input, index, validatedOptions.blocks, limits, validatedOptions);
}

function familyTarget(target: EditTarget): string | null {
  if (target.kind === "selector" && target.selector.kind === "family") return target.selector.family;
  const field = targetField(target);
  return field?.split(":", 1)[0] ?? null;
}

function blockEditForOperation(operation: EditOperation, limits: SecurityLimits, index: JpegIndex): JpegBlockEdit | null {
  if (operation.op === "set") {
    const target = blockTarget(operation.target, index);
    if (target === null || target.kind === "extended-xmp" && target.guid === undefined && target.blockId === undefined) {
      if (isExifTarget(operation.target)) return null;
      throw new JpegWriterError("UNSUPPORTED_STRUCTURE", "JPEG set supports EXIF fields or explicit standard/Extended XMP, ICC, and IPTC block identities.");
    }
    if (target.kind === "extended-xmp" && target.guid === undefined) throw new JpegWriterError("INVALID_VALUE", "Extended XMP set requires XMP:extended:<GUID> or a block selector carrying an existing GUID.");
    const exists = index.segments.some((segment) => segmentMatches(segment, { kind: target.kind, ...(target.guid === undefined ? {} : { guid: target.guid }), ...(target.blockId === undefined ? {} : { blockId: target.blockId }) }));
    return { op: exists ? "replace" : "add", kind: target.kind, ...(target.guid === undefined ? {} : { guid: target.guid }), ...(target.blockId === undefined ? {} : { blockId: target.blockId }), data: operation.value instanceof Uint8Array || typeof operation.value === "string" ? operation.value : (() => { throw new JpegWriterError("INVALID_VALUE", "JPEG block values must be strings or Uint8Array bytes."); })() };
  }
  if (operation.op === "delete") {
    const target = blockTarget(operation.target, index);
    if (target === null) return null;
    return { op: "remove", kind: target.kind, ...(target.guid === undefined ? {} : { guid: target.guid }), ...(target.blockId === undefined ? {} : { blockId: target.blockId }), ...(target.resourceId === undefined ? {} : { resourceId: target.resourceId }) };
  }
  if (operation.op === "remove-group") {
    const family = familyTarget(operation.target);
    if (family === "XMP") return { op: "remove", kind: "standard-xmp" };
    if (family === "ICC") return { op: "remove", kind: "icc" };
    if (family === "IPTC") return { op: "remove", kind: "iptc" };
    return null;
  }
  if (operation.op === "merge-sidecar") {
    const target = blockTarget(operation.target, index);
    if (target === null) throw new JpegWriterError("UNSUPPORTED_STRUCTURE", "JPEG sidecar merge requires an XMP or IPTC block target.");
    if (operation.sidecar.format === "xmp" && target.kind !== "standard-xmp") throw new JpegWriterError("INVALID_VALUE", "XMP sidecars can only merge into standard XMP.");
    if (operation.sidecar.format === "iptc-iim" && target.kind !== "iptc") throw new JpegWriterError("INVALID_VALUE", "IPTC-IIM sidecars can only merge into IPTC resources.");
    return { op: "add", kind: target.kind, data: operation.sidecar.data, ...(target.guid === undefined ? {} : { guid: target.guid }), ...(target.blockId === undefined ? {} : { blockId: target.blockId }) };
  }
  return null;
}

function removalTargetPreserved(operation: EditOperation, policy: EditPolicyEvidence): boolean {
  if (operation.op === "delete" || operation.op === "remove-group") {
    if (isPreserved(operation.target, policy)) return true;
    const family = targetFamily(operation.target);
    return operation.op === "remove-group" && family !== null && policy.preserve.some((target) => targetFamily(target) === family);
  }
  if (operation.op === "rename") return isPreserved(operation.source, policy);
  return false;
}

function unsupportedOperation(operation: EditOperation, detail: string): JpegTransactionOperation {
  return operationResult(operation, makeFailure("UNSUPPORTED_OPERATION", detail), 0, [], [], null);
}

function operationFailure(operation: EditOperation, error: unknown): JpegTransactionOperation {
  const failure = error instanceof JpegWriterError
    ? makeFailure(error.code === "LIMIT_EXCEEDED" ? "UNSAFE_STRUCTURE" : error.code === "UNSUPPORTED_STRUCTURE" ? "UNSUPPORTED_OPERATION" : error.code === "VERIFICATION_FAILURE" ? "VERIFICATION_FAILURE" : error.code, error.message)
    : makeFailure("UNSAFE_STRUCTURE", error instanceof Error ? error.message : "JPEG transaction failed before output was committed.");
  return operationResult(operation, failure, 0, [], [], null);
}

function transactionVerificationFailure(operation: EditOperation, detail: string): JpegTransactionOperation {
  return operationResult(operation, makeFailure("VERIFICATION_FAILURE", detail), 0, [], [], null);
}

function applyExifOperation(works: readonly SegmentWork[], index: JpegIndex, inserted: InsertedSegment[], operation: EditOperation, policy: EditPolicyEvidence, limits: SecurityLimits): JpegTransactionOperation {
  const exifWorks = works.filter((work) => !work.removed && work.original.kind === "exif");
  if (exifWorks.length === 0) {
    const syntheticOperation = newExifOperation(operation);
    if (syntheticOperation === null) return operation.op === "delete"
      ? operationResult(operation, null, 0, [], [], null)
      : unsupportedOperation(operation, "The JPEG has no EXIF APP1 block containing the requested field.");
    const emptyTiff = serializeTiff(newExifGraph(operation), { limits });
    const transaction = applyTiffEditTransaction(emptyTiff, [syntheticOperation], policy, limits);
    const item = transaction.operations[0];
    if (item?.status !== "applied" || transaction.output === null) return unsupportedOperation(operation, "The requested EXIF field could not be represented in a new IFD0 directory.");
    const payload = new Uint8Array(EXIF_IDENTIFIER.length + transaction.output.length);
    payload.set(EXIF_IDENTIFIER, 0); payload.set(transaction.output, EXIF_IDENTIFIER.length);
    const segmentBytes = makeSegment(APP1, payload, limits);
    const anchor = index.segments.findIndex((segment) => isStartOfFrame(segment.marker));
    const blockId = `jpeg:APP1:inserted:${inserted.length}`;
    inserted.push({ anchor: anchor < 0 ? 0 : anchor, id: blockId, bytes: segmentBytes });
    const requestedField = syntheticOperation.op === "set" ? targetField(syntheticOperation.target) : null;
    return operationResult(operation, null, item.appliedCount, [requestedField ?? item.matchedFieldIds[0] ?? "EXIF:IFD0"], [blockId], null);
  }
  for (const work of exifWorks) {
    const tiff = rawSegmentPayload(work.bytes).subarray(EXIF_IDENTIFIER.length);
    try {
      const syntheticOperation = operation;
      const transaction: TiffEditTransaction = applyTiffEditTransaction(tiff, [syntheticOperation], policy, limits);
      const item = transaction.operations[0];
      if (item?.status === "applied" && transaction.output !== null) {
        const payload = new Uint8Array(EXIF_IDENTIFIER.length + transaction.output.length);
        payload.set(EXIF_IDENTIFIER, 0); payload.set(transaction.output, EXIF_IDENTIFIER.length);
        const segmentBytes = makeSegment(APP1, payload, limits);
        work.bytes = segmentBytes;
        const requestedField = syntheticOperation.op === "set" || syntheticOperation.op === "delete" ? targetField(syntheticOperation.target) : null;
        return operationResult(operation, null, item.appliedCount, [requestedField ?? item.matchedFieldIds[0] ?? "EXIF"], [`${work.original.id}:directory`], null);
      }
    } catch (error) {
      return operationFailure(operation, error);
    }
  }
  return unsupportedOperation(operation, "The requested EXIF field identity was not resolved in the JPEG EXIF graph.");
}

function orderedOperations(operations: readonly EditOperation[], policy: EditPolicyEvidence): readonly EditOperation[] {
  if (policy.ordering.mode !== "operation-order") return operations;
  const byId = new Map(operations.map((operation) => [operation.operationId, operation]));
  return policy.ordering.operationIds.map((id) => byId.get(id)).filter((operation): operation is EditOperation => operation !== undefined);
}

/** Execute the JPEG-safe subset of W01 atomically. All planning and output
 * verification complete before the returned transaction exposes bytes. */
export function applyJpegEditTransaction(input: Uint8Array, operations: readonly EditOperation[], policy: EditPolicyEvidence, limits: SecurityLimits): JpegEditTransaction {
  if (!(input instanceof Uint8Array)) throw new JpegWriterError("INVALID_VALUE", "JPEG transaction input must be a Uint8Array.");
  if (!Array.isArray(operations) || operations.length === 0) throw new JpegWriterError("INVALID_VALUE", "JPEG transaction requires at least one operation.");
  const before = parseJpegIndex(input, limits);
  findUnsupportedStructure(input, before, limits);
  const results: JpegTransactionOperation[] = [];
  const works: SegmentWork[] = before.segments.map((segment) => ({ original: segment, originalBytes: input.subarray(segment.start, segment.end).slice(), bytes: input.subarray(segment.start, segment.end).slice(), removed: false }));
  const inserted: InsertedSegment[] = [];
  const blockEdits: { readonly operation: EditOperation; readonly edit: JpegBlockEdit }[] = [];
  const ordered = orderedOperations(operations, policy);
  const seenBlockKeys = new Set<string>();

  for (const operation of ordered) {
    if (removalTargetPreserved(operation, policy)) {
      results.push(operationResult(operation, makeFailure("POLICY_FAILURE", "The preserve rule wins over this JPEG removal operation."), 0, [], [], null));
      continue;
    }
    if (isExifOperation(operation)) {
      try {
        results.push(applyExifOperation(works, before, inserted, operation, policy, limits));
      } catch (error) {
        results.push(operationFailure(operation, error));
      }
      continue;
    }
    if (operation.op === "remove-group" && familyTarget(operation.target) === "EXIF") {
      const matching = works.filter((work) => !work.removed && work.original.kind === "exif");
      for (const work of matching) work.removed = true;
      results.push(operationResult(operation, null, matching.length, [], matching.map((work) => work.original.id), null));
      continue;
    }
    if (operation.op === "remove-group" && familyTarget(operation.target) === "XMP") {
      blockEdits.push({ operation, edit: { op: "remove", kind: "standard-xmp" } }, { operation, edit: { op: "remove", kind: "extended-xmp" } });
      continue;
    }
    try {
      const blockEdit = blockEditForOperation(operation, limits, before);
      if (blockEdit === null) {
        if (operation.op === "copy" || operation.op === "rename" || operation.op === "alias") results.push(unsupportedOperation(operation, "JPEG W03 supports set/delete EXIF fields and explicit metadata block edits; semantic field copy/rename/alias remains unsupported."));
        else results.push(unsupportedOperation(operation, "This operation is not supported by the JPEG W03 writer."));
        continue;
      }
      const key = blockKey(blockEdit.kind, blockEdit.guid, blockEdit.blockId, blockEdit.resourceId);
      if (blockEdit.op !== "remove" && seenBlockKeys.has(key) && policy.conflicts === "reject") throw new JpegWriterError("INVALID_VALUE", `Conflicting JPEG writes target ${key} under reject conflict policy.`);
      seenBlockKeys.add(key);
      blockEdits.push({ operation, edit: blockEdit });
    } catch (error) {
      results.push(operationFailure(operation, error));
    }
  }

  if (results.some((result) => result.status !== "applied")) {
    const committed = results.map((result) => result.status === "applied" ? { ...result, status: "verification-failure" as const, appliedCount: 0, matchedFieldIds: [], matchedBlockIds: [], failure: makeFailure("VERIFICATION_FAILURE", "The JPEG transaction was not committed because another operation failed planning.") } : result);
    return { output: null, operations: committed, before, after: null, byteChanges: [], preservedPayloads: [], verified: false };
  }

  try {
    for (const blockEdit of blockEdits) {
      try {
        applyBlockEditsToWorks(before, [blockEdit.edit], limits, works, inserted, policy.duplicates);
      } catch (error) {
        const notCommitted = "The JPEG transaction was not committed because a later metadata block operation failed.";
        const failed = operationFailure(blockEdit.operation, error);
        const operationResults = operations.map((operation: EditOperation) => {
          if (operation.operationId === blockEdit.operation.operationId) return failed;
          const prior = results.find((result) => result.operationId === operation.operationId);
          return prior?.failure !== null && prior?.failure !== undefined
            ? prior
            : transactionVerificationFailure(operation, notCommitted);
        });
        return { output: null, operations: operationResults, before, after: null, byteChanges: [], preservedPayloads: [], verified: false };
      }
    }
    const planned = rebuildJpeg(input, works, inserted, limits);
    const after = parseJpegIndex(planned.data, limits);
    verifyExtendedXmpRelationships(planned.data, after, limits);
    if (policy.verification !== "none") verifyJpegRewrite(input, planned.data, before, limits, planned.placedSegments);
    const preservedPayloads = before.scans.map((scan, scanIndex) => {
      const afterScan = after.scans[scanIndex];
      if (afterScan === undefined) throw new JpegWriterError("VERIFICATION_FAILURE", `JPEG scan ${scan.id} disappeared during rewriting.`);
      return { id: scan.id, before: input.subarray(scan.start, scan.end).slice(), after: planned.data.subarray(afterScan.start, afterScan.end).slice() };
    });
    const preservation = policy.verification === "none" ? undefined : verifyPreservationSync(input, planned.data, { colorPolicy: "report-only", orientationPolicy: "preserve", limits });
    if (preservation !== undefined && !preservation.successful) throw new JpegWriterError("VERIFICATION_FAILURE", `Independent JPEG preservation verification failed: ${preservation.diagnostics.join(" ")}`);
    const byOperationId = new Map(results.map((result) => [result.operationId, result]));
    for (const { operation, edit } of blockEdits) {
      const matches = edit.kind === "photoshop-resource"
        ? exactPhotoshopSegmentIds(input, before, edit.resourceId ?? "", limits)
        : before.segments.filter((segment) => segmentMatches(segment, { kind: edit.kind, ...(edit.guid === undefined ? {} : { guid: edit.guid }), ...(edit.blockId === undefined ? {} : { blockId: edit.blockId }) })).map((segment) => segment.id);
      const prior = byOperationId.get(operation.operationId);
      const operationCount = edit.op === "add" ? 1 : matches.length;
      const next = operationResult(operation, null, prior?.appliedCount === undefined ? operationCount : prior.appliedCount + operationCount, [], [...new Set([...(prior?.matchedBlockIds ?? []), ...matches])], null);
      byOperationId.set(operation.operationId, next);
    }
    const finalResults = operations.map((operation: EditOperation) => byOperationId.get(operation.operationId) ?? unsupportedOperation(operation, "The JPEG operation was not included in the transaction plan."));
    return { output: planned.data, operations: finalResults, before, after, byteChanges: planned.changes, preservedPayloads, verified: policy.verification !== "none", ...(preservation === undefined ? {} : { preservation }) };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "JPEG output verification failed before the transaction could be committed.";
    return { output: null, operations: operations.map((operation: EditOperation) => transactionVerificationFailure(operation, `The JPEG transaction was not committed after output verification failed: ${detail}`)), before, after: null, byteChanges: [], preservedPayloads: [], verified: false };
  }
}

export type { JpegIndex, JpegSegment, JpegScanPayload, PlacedChange };
