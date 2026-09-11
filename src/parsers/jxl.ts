import { parseExif } from "../metadata/exif.js";
import { wantsGroup, type ResolvedSelection } from "../selection.js";
import { throwIfAborted } from "../security/abort.js";
import type { ExifData, MetadataBlock, MetadataField, MetadataWarning, ParsedMetadataResult, SecurityLimits } from "../types.js";
import type { MetadataRegistry } from "../registry.js";

interface Box {
  readonly type: string;
  readonly payloadOffset: number;
  readonly payloadLength: number;
}

function uint32(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] ?? 0) * 0x1000000) + ((bytes[offset + 1] ?? 0) << 16) + ((bytes[offset + 2] ?? 0) << 8) + (bytes[offset + 3] ?? 0);
}

function uint64(bytes: Uint8Array, offset: number): number | null {
  const high = uint32(bytes, offset);
  const low = uint32(bytes, offset + 4);
  const value = BigInt(high) * 0x100000000n + BigInt(low);
  return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : null;
}

function boxType(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(bytes[offset] ?? 0, bytes[offset + 1] ?? 0, bytes[offset + 2] ?? 0, bytes[offset + 3] ?? 0);
}

function jxlExif(payload: Uint8Array): Uint8Array | null {
  if (payload.length >= 8 && ((payload[0] === 0x49 && payload[1] === 0x49) || (payload[0] === 0x4d && payload[1] === 0x4d))) return payload;
  if (payload.length < 4) return null;
  const offset = uint32(payload, 0);
  return offset <= payload.length - 4 ? payload.subarray(4 + offset) : null;
}

function decodeUtf8(bytes: Uint8Array): string | null {
  try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { return null; }
}

export function parseJxl(bytes: Uint8Array, limits: SecurityLimits, selection?: ResolvedSelection, signal?: AbortSignal, registry?: MetadataRegistry): ParsedMetadataResult {
  const warnings: MetadataWarning[] = [];
  const includeExif = wantsGroup(selection, "EXIF");
  const includeXmp = wantsGroup(selection, "XMP");
  const rawCodestream = bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0x0a;
  if (rawCodestream) {
    return {
      format: "jxl", mimeType: "image/jxl", dimensions: null, fields: [], exif: null, xmp: null, iptc: null, icc: null, jfif: null, pngText: [],
      warnings: [{ code: "UNSUPPORTED_STRUCTURE", message: "Raw JPEG XL codestream metadata is not externally box-addressable and was not decoded.", severity: "warning" }],
    };
  }
  const signature = [0x00, 0x00, 0x00, 0x0c, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a];
  if (bytes.length < signature.length || signature.some((byte, index) => bytes[index] !== byte)) {
    return {
      format: "jxl", mimeType: "image/jxl", dimensions: null, fields: [], exif: null, xmp: null, iptc: null, icc: null, jfif: null, pngText: [],
      warnings: [{ code: "MALFORMED_JXL", message: "JPEG XL container signature is truncated or invalid.", severity: "error", offset: 0, length: bytes.length }],
    };
  }
  const boxes: Box[] = [];
  let cursor = 0;
  while (cursor < bytes.length) {
    throwIfAborted(signal);
    if (boxes.length >= limits.maxSegments || cursor > bytes.length - 8) {
      warnings.push({ code: "MALFORMED_JXL", message: "JPEG XL box sequence is truncated or exceeds the configured box limit.", severity: "error", offset: cursor });
      break;
    }
    const shortSize = uint32(bytes, cursor);
    const type = boxType(bytes, cursor + 4);
    let headerLength = 8;
    let size = shortSize;
    if (shortSize === 1) {
      if (cursor > bytes.length - 16) { warnings.push({ code: "MALFORMED_JXL", message: "JPEG XL extended-size box is truncated.", severity: "error", offset: cursor }); break; }
      const large = uint64(bytes, cursor + 8);
      if (large === null) { warnings.push({ code: "UNSAFE_OFFSET", message: "JPEG XL extended-size box exceeds the safe integer range.", severity: "error", offset: cursor }); break; }
      size = large;
      headerLength = 16;
    } else if (shortSize === 0) {
      size = bytes.length - cursor;
    }
    if (size < headerLength || size > bytes.length - cursor) { warnings.push({ code: "MALFORMED_JXL", message: "JPEG XL box length is invalid.", severity: "error", offset: cursor, length: size }); break; }
    boxes.push({ type, payloadOffset: cursor + headerLength, payloadLength: size - headerLength });
    cursor += size;
  }
  let exif: ExifData | null = null;
  const fields: MetadataField[] = [];
  const provenance: MetadataBlock[] = [];
  const packets: string[] = [];
  for (const box of boxes) {
    const family = box.type === "Exif" ? "EXIF" : box.type === "xml " ? "XMP" : null;
    if (family === null) continue;
    if ((family === "EXIF" && !includeExif) || (family === "XMP" && !includeXmp)) {
      provenance.push({ id: `jxl:${box.type}:${box.payloadOffset - 8}`, family, container: `${box.type} box`, status: "skipped", offset: box.payloadOffset - 8, length: box.payloadLength + 8, associatedImage: null, sensitivity: "moderate", warningCodes: [] });
      continue;
    }
    if (box.payloadLength > limits.maxMetadataBytes) {
      warnings.push({ code: "LIMIT_EXCEEDED", message: `JPEG XL ${box.type} box exceeds the configured metadata limit.`, severity: "warning", offset: box.payloadOffset, length: box.payloadLength });
      continue;
    }
    const payload = bytes.subarray(box.payloadOffset, box.payloadOffset + box.payloadLength);
    provenance.push({ id: `jxl:${box.type}:${box.payloadOffset - 8}`, family: box.type === "Exif" ? "EXIF" : "XMP", container: `${box.type} box`, status: "decoded", offset: box.payloadOffset - 8, length: box.payloadLength + 8, associatedImage: null, sensitivity: "moderate", warningCodes: [] });
    if (box.type === "Exif") {
      const tiff = jxlExif(payload);
      if (tiff === null) { warnings.push({ code: "MALFORMED_EXIF", message: "JPEG XL Exif box does not contain a valid TIFF payload offset.", severity: "warning", offset: box.payloadOffset, length: box.payloadLength }); continue; }
      const parsed = parseExif(tiff, limits, box.payloadOffset + (tiff.byteOffset - payload.byteOffset), selection?.tags, registry);
      if (exif === null) exif = parsed.exif;
      fields.push(...parsed.fields);
      warnings.push(...parsed.warnings.slice(0, Math.max(0, limits.maxWarnings - warnings.length)));
    } else {
      const packet = decodeUtf8(payload);
      if (packet === null) warnings.push({ code: "INVALID_VALUE", message: "JPEG XL XML box is not valid UTF-8.", severity: "warning", offset: box.payloadOffset, length: box.payloadLength });
      else packets.push(packet);
    }
  }
  return { format: "jxl", mimeType: "image/jxl", dimensions: null, fields, exif, xmp: packets.length > 0 ? { packets } : null, iptc: null, icc: null, jfif: null, pngText: [], blocks: provenance, warnings };
}
