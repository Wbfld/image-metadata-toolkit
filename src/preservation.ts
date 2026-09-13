import { detectFormat } from "./detect-format.js";
import { resolveLimits } from "./security/limits.js";
import { sha256HexSync } from "./security/sha256.js";
import type { ImageDimensions, ImageFormat, MetadataInput, SecurityLimits } from "./types.js";

/** A policy applied to a property that may intentionally change during a metadata edit. */
export type PreservationPolicy = "preserve" | "report-only" | "allow-change";

export type PreservationPayloadKind = "jpeg-scan" | "png-IDAT" | "png-fdAT" | "webp-VP8" | "webp-VP8L" | "webp-ALPH" | "webp-ANMF";

export interface PreservationVerifierOptions {
  readonly limits?: Partial<SecurityLimits>;
  /** The verifier default is `preserve`; writers explicitly use `report-only` because profile edits are supported metadata operations. */
  readonly colorPolicy?: PreservationPolicy;
  /** The default is `preserve`; orientation changes are image-semantic changes. */
  readonly orientationPolicy?: PreservationPolicy;
  /** Require a complete encoded-payload inventory. Defaults to true. */
  readonly requireCompletePayloadExtraction?: boolean;
}

export interface PreservationRangeEvidence {
  readonly offset: number;
  readonly length: number;
  readonly sha256: string;
}

export type PreservationPayloadStatus = "matched" | "mismatched" | "missing-before" | "missing-after" | "not-comparable";

export interface PreservationPayloadEvidence {
  readonly id: string;
  readonly kind: PreservationPayloadKind;
  readonly before: PreservationRangeEvidence | null;
  readonly after: PreservationRangeEvidence | null;
  readonly status: PreservationPayloadStatus;
}

export interface PreservationPayloadSummary {
  readonly beforeCount: number;
  readonly afterCount: number;
  readonly protectedCount: number;
  readonly comparableCount: number;
  readonly matchedCount: number;
  readonly mismatchedCount: number;
  readonly missingBeforeCount: number;
  readonly missingAfterCount: number;
  readonly nonComparableCount: number;
}

export type PreservationComparisonStatus = "matched" | "mismatched" | "not-checked" | "not-comparable" | "reported-change" | "allowed-change";

export interface PreservationComparison<T = unknown> {
  readonly policy?: PreservationPolicy;
  readonly before: T | null;
  readonly after: T | null;
  readonly status: PreservationComparisonStatus;
}

export interface PreservationImageSummary {
  readonly byteLength: number;
  /** Null when the configured input limit prevented hashing the source. */
  readonly sha256: string | null;
}

export interface PreservationExtractionEvidence {
  readonly supported: boolean;
  readonly complete: boolean;
  readonly protectedPayloadCount: number;
  readonly reason: string | null;
}

export interface PreservationDecodabilityEvidence {
  readonly before: "passed" | "failed" | "not-comparable";
  readonly after: "passed" | "failed" | "not-comparable";
  readonly diagnostics: readonly string[];
}

/**
 * Machine-readable preservation evidence. `pixelEquivalence` is deliberately
 * always `not-claimed`: this package does not decode or compare pixels.
 */
export interface PreservationReport {
  readonly schema: "browser-image-metadata.preservation.v1";
  readonly successful: boolean;
  readonly status: "passed" | "failed" | "incomplete";
  readonly format: ImageFormat | null;
  readonly input: PreservationImageSummary | null;
  readonly output: PreservationImageSummary | null;
  readonly extraction: PreservationExtractionEvidence;
  readonly payloads: readonly PreservationPayloadEvidence[];
  readonly payloadSummary: PreservationPayloadSummary;
  readonly dimensions: PreservationComparison<ImageDimensions>;
  readonly relationships: PreservationComparison<Readonly<Record<string, unknown>>>;
  readonly color: PreservationComparison<Readonly<Record<string, unknown>>>;
  readonly orientation: PreservationComparison<readonly number[]>;
  readonly decodability: PreservationDecodabilityEvidence;
  readonly pixelEquivalence: "not-claimed";
  readonly normalizationPolicy: Readonly<Record<string, string>>;
  readonly diagnostics: readonly string[];
}

interface PayloadRange {
  readonly id: string;
  readonly kind: PreservationPayloadKind;
  readonly start: number;
  readonly end: number;
}

interface Inventory {
  readonly format: ImageFormat;
  readonly complete: boolean;
  readonly supported: boolean;
  readonly reason: string | null;
  readonly payloads: readonly PayloadRange[];
  readonly dimensions: ImageDimensions | null;
  readonly relationships: Readonly<Record<string, unknown>> | null;
  readonly color: Readonly<Record<string, unknown>> | null;
  readonly orientation: readonly number[] | null;
  readonly diagnostics: readonly string[];
}

const PNG_SIGNATURE = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
const WEBP_IMAGE = new Set(["VP8 ", "VP8L", "ALPH", "ANMF"]);

function bytesForInput(input: MetadataInput): Uint8Array | null {
  if (input instanceof Uint8Array) return input.slice();
  if (input instanceof ArrayBuffer) return new Uint8Array(input).slice();
  if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength).slice();
  return null;
}

function ascii(bytes: Uint8Array, offset: number, value: string): boolean {
  if (offset < 0 || offset > bytes.length - value.length) return false;
  for (let index = 0; index < value.length; index += 1) if (bytes[offset + index] !== value.charCodeAt(index)) return false;
  return true;
}

function be16(bytes: Uint8Array, offset: number): number | null {
  if (offset < 0 || offset > bytes.length - 2) return null;
  return (bytes[offset] ?? 0) * 0x100 + (bytes[offset + 1] ?? 0);
}

function be32(bytes: Uint8Array, offset: number): number | null {
  if (offset < 0 || offset > bytes.length - 4) return null;
  return (bytes[offset] ?? 0) * 0x1000000 + (bytes[offset + 1] ?? 0) * 0x10000 + (bytes[offset + 2] ?? 0) * 0x100 + (bytes[offset + 3] ?? 0);
}

function le16(bytes: Uint8Array, offset: number): number | null {
  if (offset < 0 || offset > bytes.length - 2) return null;
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8);
}

function le24(bytes: Uint8Array, offset: number): number | null {
  if (offset < 0 || offset > bytes.length - 3) return null;
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8) | ((bytes[offset + 2] ?? 0) << 16);
}

function le32(bytes: Uint8Array, offset: number): number | null {
  if (offset < 0 || offset > bytes.length - 4) return null;
  return (bytes[offset] ?? 0) + (bytes[offset + 1] ?? 0) * 0x100 + (bytes[offset + 2] ?? 0) * 0x10000 + (bytes[offset + 3] ?? 0) * 0x1000000;
}

function safeEnd(start: number, length: number, limit: number): number | null {
  const end = start + length;
  return Number.isSafeInteger(end) && start >= 0 && length >= 0 && end <= limit ? end : null;
}

function bad(format: ImageFormat, reason: string, diagnostics: readonly string[] = []): Inventory {
  return { format, complete: false, supported: true, reason, payloads: [], dimensions: null, relationships: null, color: null, orientation: null, diagnostics: [...diagnostics, reason] };
}

function unsupported(format: ImageFormat, reason: string): Inventory {
  return { format, complete: false, supported: false, reason, payloads: [], dimensions: null, relationships: null, color: null, orientation: null, diagnostics: [reason] };
}

function jpegOrientation(payload: Uint8Array): number | null {
  if (!ascii(payload, 0, "Exif\0\0")) return null;
  const tiff = payload.subarray(6);
  const little = ascii(tiff, 0, "II");
  const big = ascii(tiff, 0, "MM");
  if (!little && !big) return null;
  const u16 = (offset: number): number | null => little ? le16(tiff, offset) : be16(tiff, offset);
  const u32 = (offset: number): number | null => little ? le32(tiff, offset) : be32(tiff, offset);
  if (u16(2) !== 42) return null;
  const directory = u32(4);
  if (directory === null || directory > tiff.length - 2) return null;
  const count = u16(directory);
  if (count === null || count > 4096 || directory + 2 + count * 12 > tiff.length) return null;
  for (let index = 0; index < count; index += 1) {
    const entry = directory + 2 + index * 12;
    if (u16(entry) !== 0x0112 || u16(entry + 2) !== 3) continue;
    const value = u16(entry + 8);
    return value !== null && value >= 1 && value <= 8 ? value : null;
  }
  return null;
}

function compareBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) if (left[index] !== right[index]) return false;
  return true;
}

function jpegInventory(bytes: Uint8Array, limits: SecurityLimits): Inventory {
  if (!ascii(bytes, 0, "\xff\xd8")) return bad("jpeg", "JPEG SOI marker is missing.");
  const payloads: PayloadRange[] = [];
  const dimensions: ImageDimensions[] = [];
  const orientations: number[] = [];
  const componentCounts: number[] = [];
  const frameMarkers: number[] = [];
  const diagnostics: string[] = [];
  let cursor = 2;
  let inScan = false;
  let scanStart = 0;
  let sawScan = false;
  let eoi = false;
  let segments = 0;
  let iccCount = 0;
  while (cursor < bytes.length) {
    if (segments >= limits.maxSegments) return bad("jpeg", "JPEG marker count exceeded the configured limit.", diagnostics);
    let fromScan = false;
    if (inScan) {
      let markerStart = -1;
      let scanCursor = cursor;
      while (scanCursor < bytes.length - 1) {
        if (bytes[scanCursor] !== 0xff) { scanCursor += 1; continue; }
        let markerCursor = scanCursor + 1;
        while (markerCursor < bytes.length && bytes[markerCursor] === 0xff) markerCursor += 1;
        if (markerCursor >= bytes.length) break;
        const marker = bytes[markerCursor] ?? 0;
        if (marker === 0x00 || (marker >= 0xd0 && marker <= 0xd7)) { scanCursor = markerCursor + 1; continue; }
        markerStart = scanCursor;
        break;
      }
      if (markerStart < 0) return bad("jpeg", "JPEG entropy-coded scan has no terminating marker.", diagnostics);
      payloads.push({ id: `jpeg:scan:${payloads.length}`, kind: "jpeg-scan", start: scanStart, end: markerStart });
      sawScan = true;
      cursor = markerStart;
      inScan = false;
      fromScan = true;
    }
    if (bytes[cursor] !== 0xff) return bad("jpeg", "JPEG contains bytes outside a marker or entropy-coded scan.", [...diagnostics, `Offset ${cursor} is not a marker.`]);
    while (cursor < bytes.length && bytes[cursor] === 0xff) cursor += 1;
    if (cursor >= bytes.length) return bad("jpeg", "JPEG ends inside a marker prefix.", diagnostics);
    const marker = bytes[cursor] ?? 0;
    cursor += 1;
    segments += 1;
    if (marker === 0xd9) { eoi = true; break; }
    if (marker === 0x00 || (marker >= 0xd0 && marker <= 0xd7 && !fromScan) || marker === 0xd8) return bad("jpeg", "JPEG contains an invalid standalone marker.", diagnostics);
    if (marker === 0x01) continue;
    const declared = be16(bytes, cursor);
    if (declared === null || declared < 2) return bad("jpeg", "JPEG segment length is missing or smaller than two.", diagnostics);
    if (declared - 2 > limits.maxSegmentBytes) return bad("jpeg", "JPEG segment exceeds the configured segment limit.", diagnostics);
    const payloadStart = cursor + 2;
    const end = safeEnd(payloadStart, declared - 2, bytes.length);
    if (end === null) return bad("jpeg", "JPEG segment extends beyond the input.", diagnostics);
    const payload = bytes.subarray(payloadStart, end);
    if (JPEG_SOF.has(marker)) {
      if (payload.length < 6) return bad("jpeg", "JPEG start-of-frame payload is truncated.", diagnostics);
      const height = be16(payload, 1); const width = be16(payload, 3); const components = payload[5] ?? 0;
      if (height === null || width === null || width < 1 || height < 1 || components < 1 || payload.length !== 6 + components * 3) return bad("jpeg", "JPEG start-of-frame dimensions or component table is malformed.", diagnostics);
      dimensions.push({ width, height }); componentCounts.push(components); frameMarkers.push(marker);
    }
    if (marker === 0xda) {
      const components = payload[0] ?? 0;
      if (components < 1 || components > 4 || payload.length !== 4 + components * 2 || dimensions.length === 0) return bad("jpeg", "JPEG start-of-scan payload is malformed.", diagnostics);
      inScan = true; scanStart = end;
    }
    if (marker === 0xe1 && orientations.length < limits.maxImageDetailCandidates) {
      const orientation = jpegOrientation(payload); if (orientation !== null) orientations.push(orientation);
    }
    if (marker === 0xe2 && ascii(payload, 0, "ICC_PROFILE\0")) iccCount += 1;
    cursor = end;
  }
  if (inScan || !eoi || !sawScan || dimensions.length === 0) return bad("jpeg", "JPEG is missing a complete frame, scan, or EOI marker.", diagnostics);
  const first = dimensions[0] as ImageDimensions;
  const relationships = { frameCount: dimensions.length, scanCount: payloads.length, frameDimensions: dimensions, frameMarkers, trailingBytes: bytes.length - (cursor) };
  const color = { componentCounts, iccCount };
  return { format: "jpeg", complete: true, supported: true, reason: null, payloads, dimensions: first, relationships, color, orientation: orientations, diagnostics };
}

function crc32(bytes: Uint8Array, start: number, end: number): number {
  let crc = 0xffffffff;
  for (let offset = start; offset < end; offset += 1) {
    crc ^= bytes[offset] ?? 0;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngInventory(bytes: Uint8Array, limits: SecurityLimits): Inventory {
  if (!compareBytes(bytes.subarray(0, 8), PNG_SIGNATURE)) return bad("png", "PNG signature is missing or truncated.");
  const payloads: PayloadRange[] = [];
  const orientations: number[] = [];
  const diagnostics: string[] = [];
  let cursor = 8; let chunks = 0; let width: number | null = null; let height: number | null = null; let colorType: number | null = null; let bitDepth: number | null = null; let crcInvalid = false;
  let sawIhdr = false; let sawIend = false; let idatCount = 0; let fdAtCount = 0; let fcTlCount = 0; let actl: { frames: number; loops: number } | null = null; let trns = false; let iccpCount = 0; let hasImageData = false;
  while (cursor < bytes.length) {
    if (chunks >= limits.maxPngChunks || cursor > bytes.length - 12) return bad("png", "PNG chunk inventory exceeded bounds or has a truncated header.", diagnostics);
    const length = be32(bytes, cursor); if (length === null) return bad("png", "PNG chunk length is truncated.", diagnostics);
    const dataStart = cursor + 8; const dataEnd = safeEnd(dataStart, length, bytes.length); const end = dataEnd === null ? null : safeEnd(dataEnd, 4, bytes.length);
    if (dataEnd === null || end === null) return bad("png", "PNG chunk extends beyond the input.", diagnostics);
    if (length > limits.maxSegmentBytes) return bad("png", "PNG chunk exceeds the configured segment limit.", diagnostics);
    const type = String.fromCharCode(bytes[cursor + 4] ?? 0, bytes[cursor + 5] ?? 0, bytes[cursor + 6] ?? 0, bytes[cursor + 7] ?? 0);
    if (!/^[A-Za-z]{4}$/u.test(type)) return bad("png", "PNG chunk type is invalid.", diagnostics);
    const expected = be32(bytes, dataEnd); const actual = crc32(bytes, cursor + 4, dataEnd);
    if (expected === null || expected !== actual) {
      // Ancillary CRC corruption is preserved by the existing W04
      // `preserve-unknown` policy. Critical stream chunks remain fail-closed.
      if ((type.charCodeAt(0) & 0x20) === 0) { crcInvalid = true; diagnostics.push(`PNG ${type} has an invalid critical CRC.`); }
      else diagnostics.push(`PNG ${type} has an invalid ancillary CRC.`);
    }
    const data = bytes.subarray(dataStart, dataEnd);
    if (chunks === 0 && (type !== "IHDR" || length !== 13)) return bad("png", "PNG must begin with a 13-byte IHDR chunk.", diagnostics);
    if (type === "IHDR") {
      if (sawIhdr || length !== 13) return bad("png", "PNG IHDR is duplicated or malformed.", diagnostics);
      sawIhdr = true; width = be32(data, 0); height = be32(data, 4); bitDepth = data[8] ?? null; colorType = data[9] ?? null;
      if (width === null || height === null || width < 1 || height < 1 || bitDepth === null || ![0, 2, 3, 4, 6].includes(colorType ?? -1)) return bad("png", "PNG IHDR dimensions or color type are invalid.", diagnostics);
    }
    if (type === "IDAT") { idatCount += 1; hasImageData = true; payloads.push({ id: `png:IDAT:${idatCount - 1}`, kind: "png-IDAT", start: dataStart, end: dataEnd }); }
    if (type === "fdAT") { fdAtCount += 1; hasImageData = true; if (length < 4) return bad("png", "PNG fdAT sequence number is truncated.", diagnostics); payloads.push({ id: `png:fdAT:${cursor}`, kind: "png-fdAT", start: dataStart, end: dataEnd }); }
    if (type === "fcTL") { if (length < 4) return bad("png", "PNG fcTL frame control is malformed.", diagnostics); fcTlCount += 1; }
    if (type === "acTL") { if (length !== 8) return bad("png", "PNG acTL animation control is malformed.", diagnostics); const frames = be32(data, 0); const loops = be32(data, 4); if (frames === null || loops === null || frames < 1) return bad("png", "PNG acTL declares an invalid frame count.", diagnostics); actl = { frames, loops }; }
    if (type === "tRNS") trns = true;
    if (type === "iCCP") iccpCount += 1;
    if (type === "eXIf") { const orientation = jpegOrientation(Uint8Array.from([0x45, 0x78, 0x69, 0x66, 0, 0, ...data])); if (orientation !== null) orientations.push(orientation); }
    if (type === "IEND") { if (length !== 0) return bad("png", "PNG IEND is malformed.", diagnostics); sawIend = true; cursor = end; break; }
    if ((type.charCodeAt(0) & 0x20) === 0 && !["IHDR", "PLTE", "IDAT", "IEND"].includes(type)) return bad("png", `PNG critical chunk ${type} is not supported by the bounded verifier.`, diagnostics);
    cursor = end; chunks += 1;
  }
  if (!sawIhdr || !sawIend || !hasImageData || width === null || height === null || colorType === null || bitDepth === null) return bad("png", "PNG is missing a complete header, image stream, or IEND marker.", diagnostics);
  const relationships = { idatCount, fdAtCount, fcTlCount, animation: actl };
  const color = { colorType, bitDepth, transparency: trns, iccpCount };
  return { format: "png", complete: !crcInvalid, supported: true, reason: crcInvalid ? "PNG contains an invalid critical CRC." : null, payloads, dimensions: { width, height }, relationships, color, orientation: orientations, diagnostics };
}

function webpDimensions(bytes: Uint8Array, type: string, dataStart: number, dataEnd: number): ImageDimensions | null {
  if (type === "VP8X" && dataEnd - dataStart === 10) {
    const width = le24(bytes, dataStart + 4); const height = le24(bytes, dataStart + 7);
    return width === null || height === null ? null : { width: width + 1, height: height + 1 };
  }
  if (type === "VP8L" && dataEnd - dataStart >= 5 && bytes[dataStart] === 0x2f) {
    const b1 = bytes[dataStart + 1] ?? 0; const b2 = bytes[dataStart + 2] ?? 0; const b3 = bytes[dataStart + 3] ?? 0; const b4 = bytes[dataStart + 4] ?? 0;
    if ((b4 & 0xe0) !== 0) return null;
    return { width: 1 + b1 + ((b2 & 0x3f) << 8), height: 1 + (b2 >> 6) + (b3 << 2) + ((b4 & 0x0f) << 10) };
  }
  if (type === "VP8 " && dataEnd - dataStart >= 10 && ((bytes[dataStart] ?? 1) & 1) === 0 && ((bytes[dataStart] ?? 0) & 0x10) !== 0 && bytes[dataStart + 3] === 0x9d && bytes[dataStart + 4] === 1 && bytes[dataStart + 5] === 0x2a) {
    const width = ((bytes[dataStart + 6] ?? 0) | ((bytes[dataStart + 7] ?? 0) << 8)) & 0x3fff; const height = ((bytes[dataStart + 8] ?? 0) | ((bytes[dataStart + 9] ?? 0) << 8)) & 0x3fff;
    return width > 0 && height > 0 ? { width, height } : null;
  }
  return null;
}

function webpInventory(bytes: Uint8Array, limits: SecurityLimits): Inventory {
  if (!ascii(bytes, 0, "RIFF") || !ascii(bytes, 8, "WEBP") || bytes.length < 20) return bad("webp", "WebP RIFF/WEBP header is missing or truncated.");
  const riffSize = le32(bytes, 4); if (riffSize === null || riffSize + 8 !== bytes.length) return bad("webp", "WebP RIFF size does not match the input.");
  const payloads: PayloadRange[] = []; const orientations: number[] = []; const diagnostics: string[] = [];
  let cursor = 12; let count = 0; let dimensions: ImageDimensions | null = null; let hasVp8x = false; let alpha = false; let animation = false; let vp8xFlags = 0; let anmfCount = 0; let animCount = 0; let iccCount = 0;
  while (cursor < bytes.length) {
    if (count >= limits.maxSegments || cursor > bytes.length - 8) return bad("webp", "WebP chunk inventory exceeded bounds or has a truncated header.", diagnostics);
    const type = String.fromCharCode(bytes[cursor] ?? 0, bytes[cursor + 1] ?? 0, bytes[cursor + 2] ?? 0, bytes[cursor + 3] ?? 0); const length = le32(bytes, cursor + 4);
    if (length === null || !/^[ -~]{4}$/u.test(type)) return bad("webp", "WebP chunk type or length is invalid.", diagnostics);
    if (length > limits.maxSegmentBytes) return bad("webp", "WebP chunk exceeds the configured segment limit.", diagnostics);
    const dataStart = cursor + 8; const dataEnd = safeEnd(dataStart, length, bytes.length); const end = dataEnd === null ? null : safeEnd(dataEnd, length & 1, bytes.length);
    if (dataEnd === null || end === null) return bad("webp", "WebP chunk extends beyond the RIFF boundary.", diagnostics);
    if (type === "VP8X") { if (hasVp8x || length !== 10 || count !== 0) return bad("webp", "WebP VP8X placement or length is invalid.", diagnostics); hasVp8x = true; vp8xFlags = bytes[dataStart] ?? 0; alpha = (vp8xFlags & 0x10) !== 0; animation = (vp8xFlags & 0x02) !== 0; dimensions = webpDimensions(bytes, type, dataStart, dataEnd); if (dimensions === null) return bad("webp", "WebP VP8X dimensions are invalid.", diagnostics); }
    if (type === "ALPH") alpha = true;
    if (type === "ANIM") { animation = true; animCount += 1; }
    if (type === "ANMF") { animation = true; anmfCount += 1; }
    if (type === "ICCP") iccCount += 1;
    if (type === "EXIF") { const orientation = jpegOrientation(Uint8Array.from([0x45, 0x78, 0x69, 0x66, 0, 0, ...bytes.subarray(dataStart, dataEnd)])); if (orientation !== null) orientations.push(orientation); }
    if (WEBP_IMAGE.has(type)) { const kind = type === "VP8 " ? "webp-VP8" : type === "VP8L" ? "webp-VP8L" : type === "ALPH" ? "webp-ALPH" : "webp-ANMF"; payloads.push({ id: `webp:${type.trim()}:${cursor}`, kind, start: dataStart, end: dataEnd }); if (dimensions === null && (type === "VP8 " || type === "VP8L")) dimensions = webpDimensions(bytes, type, dataStart, dataEnd); }
    cursor = end; count += 1;
  }
  if (dimensions === null || payloads.length === 0) return bad("webp", "WebP has no valid image payload and dimensions.", diagnostics);
  const relationships = { imageTypes: payloads.map(({ kind }) => kind), imagePayloadCount: payloads.length, alpha, animation, animCount, anmfCount };
  const color = { alpha, imageTypes: payloads.map(({ kind }) => kind), iccCount };
  return { format: "webp", complete: true, supported: true, reason: null, payloads, dimensions, relationships, color, orientation: orientations, diagnostics };
}

function inventory(bytes: Uint8Array, limits: SecurityLimits): Inventory {
  const format = detectFormat(bytes).format;
  if (format === "jpeg") return jpegInventory(bytes, limits);
  if (format === "png") return pngInventory(bytes, limits);
  if (format === "webp") return webpInventory(bytes, limits);
  return unsupported(format, `Independent encoded-payload extraction is not complete for ${format}.`);
}

function comparison<T>(before: T | null, after: T | null, policy?: PreservationPolicy): PreservationComparison<T> {
  if (before === null || after === null) return { ...(policy === undefined ? {} : { policy }), before, after, status: "not-comparable" };
  const equal = JSON.stringify(before) === JSON.stringify(after);
  if (policy === undefined) return { before, after, status: equal ? "matched" : "mismatched" };
  if (equal) return { policy, before, after, status: "matched" };
  return { policy, before, after, status: policy === "preserve" ? "mismatched" : policy === "report-only" ? "reported-change" : "allowed-change" };
}

function imageSummary(bytes: Uint8Array): PreservationImageSummary { return { byteLength: bytes.length, sha256: sha256HexSync(bytes) }; }

function emptySummary(): PreservationPayloadSummary { return { beforeCount: 0, afterCount: 0, protectedCount: 0, comparableCount: 0, matchedCount: 0, mismatchedCount: 0, missingBeforeCount: 0, missingAfterCount: 0, nonComparableCount: 0 }; }

function payloadEvidence(before: Uint8Array, after: Uint8Array, left: Inventory, right: Inventory): { readonly entries: readonly PreservationPayloadEvidence[]; readonly summary: PreservationPayloadSummary } {
  const entries: PreservationPayloadEvidence[] = [];
  const beforeCount = left.payloads.length; const afterCount = right.payloads.length; const total = Math.max(beforeCount, afterCount);
  let comparableCount = 0; let matchedCount = 0; let mismatchedCount = 0; let missingBeforeCount = 0; let missingAfterCount = 0; let nonComparableCount = 0;
  for (let index = 0; index < total; index += 1) {
    const beforePayload = left.payloads[index]; const afterPayload = right.payloads[index];
    if (beforePayload === undefined) { missingBeforeCount += 1; entries.push({ id: afterPayload?.id ?? `payload:${index}`, kind: afterPayload?.kind ?? "jpeg-scan", before: null, after: afterPayload === undefined ? null : { offset: afterPayload.start, length: afterPayload.end - afterPayload.start, sha256: sha256HexSync(after.subarray(afterPayload.start, afterPayload.end)) }, status: "missing-before" }); continue; }
    if (afterPayload === undefined) { missingAfterCount += 1; entries.push({ id: beforePayload.id, kind: beforePayload.kind, before: { offset: beforePayload.start, length: beforePayload.end - beforePayload.start, sha256: sha256HexSync(before.subarray(beforePayload.start, beforePayload.end)) }, after: null, status: "missing-after" }); continue; }
    if (beforePayload.kind !== afterPayload.kind) { nonComparableCount += 1; entries.push({ id: beforePayload.id, kind: beforePayload.kind, before: { offset: beforePayload.start, length: beforePayload.end - beforePayload.start, sha256: sha256HexSync(before.subarray(beforePayload.start, beforePayload.end)) }, after: { offset: afterPayload.start, length: afterPayload.end - afterPayload.start, sha256: sha256HexSync(after.subarray(afterPayload.start, afterPayload.end)) }, status: "not-comparable" }); continue; }
    comparableCount += 1;
    const leftBytes = before.subarray(beforePayload.start, beforePayload.end); const rightBytes = after.subarray(afterPayload.start, afterPayload.end); const equal = compareBytes(leftBytes, rightBytes);
    if (equal) matchedCount += 1; else mismatchedCount += 1;
    entries.push({ id: beforePayload.id, kind: beforePayload.kind, before: { offset: beforePayload.start, length: leftBytes.length, sha256: sha256HexSync(leftBytes) }, after: { offset: afterPayload.start, length: rightBytes.length, sha256: sha256HexSync(rightBytes) }, status: equal ? "matched" : "mismatched" });
  }
  return { entries, summary: { beforeCount, afterCount, protectedCount: total, comparableCount, matchedCount, mismatchedCount, missingBeforeCount, missingAfterCount, nonComparableCount } };
}

function policyValid(value: PreservationPolicy | undefined): PreservationPolicy { return value ?? "preserve"; }

/** Verify two in-memory encoded images without decoding or retaining pixel data. */
export function verifyPreservationSync(input: Uint8Array, output: Uint8Array, options: PreservationVerifierOptions = {}): PreservationReport {
  let limits: SecurityLimits;
  try { limits = resolveLimits(options.limits); } catch (error) {
    const reason = error instanceof Error ? error.message : "Preservation verifier limits are invalid.";
    return { schema: "browser-image-metadata.preservation.v1", successful: false, status: "failed", format: null, input: null, output: null, extraction: { supported: false, complete: false, protectedPayloadCount: 0, reason }, payloads: [], payloadSummary: emptySummary(), dimensions: { before: null, after: null, status: "not-comparable" }, relationships: { before: null, after: null, status: "not-comparable" }, color: { policy: policyValid(options.colorPolicy), before: null, after: null, status: "not-comparable" }, orientation: { policy: policyValid(options.orientationPolicy), before: null, after: null, status: "not-comparable" }, decodability: { before: "not-comparable", after: "not-comparable", diagnostics: [reason] }, pixelEquivalence: "not-claimed", normalizationPolicy: { ranges: "absolute byte offsets within each source image", hashes: "SHA-256 lowercase hexadecimal", arrays: "source order", strings: "not used by structural comparisons", pixels: "never decoded or compared" }, diagnostics: [reason] };
  }
  if (!(input instanceof Uint8Array) || !(output instanceof Uint8Array)) return verifyPreservationSync(new Uint8Array(), new Uint8Array(), { ...options, limits });
  if (input.length > limits.maxInputBytes || output.length > limits.maxInputBytes) {
    const reason = "Preservation verifier input or output exceeds maxInputBytes.";
    return { schema: "browser-image-metadata.preservation.v1", successful: false, status: "failed", format: null, input: { byteLength: input.length, sha256: null }, output: { byteLength: output.length, sha256: null }, extraction: { supported: false, complete: false, protectedPayloadCount: 0, reason }, payloads: [], payloadSummary: emptySummary(), dimensions: { before: null, after: null, status: "not-comparable" }, relationships: { before: null, after: null, status: "not-comparable" }, color: { policy: policyValid(options.colorPolicy), before: null, after: null, status: "not-comparable" }, orientation: { policy: policyValid(options.orientationPolicy), before: null, after: null, status: "not-comparable" }, decodability: { before: "not-comparable", after: "not-comparable", diagnostics: [reason] }, pixelEquivalence: "not-claimed", normalizationPolicy: { ranges: "absolute byte offsets within each source image", hashes: "SHA-256 lowercase hexadecimal", arrays: "source order", strings: "not used by structural comparisons", pixels: "never decoded or compared" }, diagnostics: [reason] };
  }
  const left = inventory(input, limits); const right = inventory(output, limits); const diagnostics = [...left.diagnostics, ...right.diagnostics];
  const sameFormat = left.format === right.format && left.format !== "unknown";
  const payload = sameFormat ? payloadEvidence(input, output, left, right) : { entries: [], summary: emptySummary() };
  const dimensions = sameFormat ? comparison(left.dimensions, right.dimensions) : { before: left.dimensions, after: right.dimensions, status: "mismatched" as const };
  const relationships = sameFormat ? comparison(left.relationships, right.relationships) : { before: left.relationships, after: right.relationships, status: "mismatched" as const };
  const color = sameFormat ? comparison(left.color, right.color, policyValid(options.colorPolicy)) : { policy: policyValid(options.colorPolicy), before: left.color, after: right.color, status: "mismatched" as const };
  const orientation = sameFormat ? comparison(left.orientation, right.orientation, policyValid(options.orientationPolicy)) : { policy: policyValid(options.orientationPolicy), before: left.orientation, after: right.orientation, status: "mismatched" as const };
  const decodability: PreservationDecodabilityEvidence = { before: left.complete ? "passed" : left.supported ? "failed" : "not-comparable", after: right.complete ? "passed" : right.supported ? "failed" : "not-comparable", diagnostics };
  const extractionComplete = sameFormat && left.supported && right.supported && left.complete && right.complete;
  const requireComplete = options.requireCompletePayloadExtraction !== false;
  const hardFailures: string[] = [];
  if (!sameFormat) hardFailures.push("Input and output formats differ or are unknown.");
  if (decodability.before === "failed" || decodability.after === "failed") hardFailures.push("Input or output failed independent bounded container decoding.");
  if (dimensions.status === "mismatched") hardFailures.push("Stored image dimensions changed.");
  if (relationships.status === "mismatched") hardFailures.push("Animation or image relationships changed.");
  if (color.status === "mismatched") hardFailures.push("Color preservation policy was violated.");
  if (orientation.status === "mismatched") hardFailures.push("Orientation preservation policy was violated.");
  if (payload.summary.mismatchedCount > 0) hardFailures.push("Protected encoded image payload bytes changed.");
  if (payload.summary.missingBeforeCount > 0 || payload.summary.missingAfterCount > 0) hardFailures.push("Protected encoded image payload categories were added or removed.");
  if (payload.summary.nonComparableCount > 0) hardFailures.push("Protected payload pairs could not be compared.");
  if (!extractionComplete && requireComplete) hardFailures.push(left.reason ?? right.reason ?? "Protected encoded-payload extraction was incomplete.");
  if (extractionComplete && payload.summary.comparableCount === 0) hardFailures.push("No meaningful protected encoded-payload comparison occurred.");
  const successful = hardFailures.length === 0;
  const incomplete = !extractionComplete || payload.summary.nonComparableCount > 0;
  return { schema: "browser-image-metadata.preservation.v1", successful, status: successful ? incomplete ? "incomplete" : "passed" : incomplete ? "incomplete" : "failed", format: sameFormat ? left.format : left.format === "unknown" ? right.format : left.format, input: imageSummary(input), output: imageSummary(output), extraction: { supported: left.supported && right.supported, complete: extractionComplete, protectedPayloadCount: payload.summary.protectedCount, reason: extractionComplete ? null : left.reason ?? right.reason }, payloads: payload.entries, payloadSummary: payload.summary, dimensions, relationships, color, orientation, decodability, pixelEquivalence: "not-claimed", normalizationPolicy: { ranges: "absolute byte offsets within each source image", hashes: "SHA-256 lowercase hexadecimal", arrays: "source order; no first/last selection", strings: "structural values compare exact JSON representations", curves: "not applicable; encoded payloads are opaque", pixels: "never decoded or compared" }, diagnostics: [...diagnostics, ...hardFailures] };
}

/** Async convenience wrapper accepting all normal package input kinds, including Blob/File. */
export async function verifyPreservation(input: MetadataInput, output: MetadataInput, options: PreservationVerifierOptions = {}): Promise<PreservationReport> {
  const [before, after] = await Promise.all([materializePreservationInput(input), materializePreservationInput(output)]);
  if (before === null || after === null) return verifyPreservationSync(new Uint8Array(), new Uint8Array(), { ...options, requireCompletePayloadExtraction: true });
  return verifyPreservationSync(before, after, options);
}

async function materializePreservationInput(input: MetadataInput): Promise<Uint8Array | null> {
  const direct = bytesForInput(input); if (direct !== null) return direct;
  if (input instanceof Blob) return new Uint8Array(await input.arrayBuffer());
  return null;
}
