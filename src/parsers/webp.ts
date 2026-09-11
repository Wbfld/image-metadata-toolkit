import { parseExif } from "../metadata/exif.js";
import { inspectIccProfile, type IccChunk } from "../metadata/icc.js";
import { parseXmpPacket } from "../metadata/xmp.js";
import { wantsGroup, type ResolvedSelection } from "../selection.js";
import { throwIfAborted } from "../security/abort.js";
import type { ExifData, ImageDimensions, MetadataBlock, MetadataField, ParsedMetadataResult, MetadataWarning, SecurityLimits } from "../types.js";
import type { MetadataRegistry } from "../registry.js";

function isAscii(bytes: Uint8Array, offset: number, text: string): boolean {
  if (offset + text.length > bytes.length) return false;
  for (let index = 0; index < text.length; index += 1) {
    if (bytes[offset + index] !== text.charCodeAt(index)) return false;
  }
  return true;
}

function uint16LittleEndian(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8);
}

function uint24LittleEndian(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8) | ((bytes[offset + 2] ?? 0) << 16);
}

function uint32LittleEndian(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] ?? 0) +
    (bytes[offset + 1] ?? 0) * 0x100 +
    (bytes[offset + 2] ?? 0) * 0x10000 +
    (bytes[offset + 3] ?? 0) * 0x1000000
  );
}

function warning(warnings: MetadataWarning[], limits: SecurityLimits, value: Omit<MetadataWarning, "severity"> & { severity?: MetadataWarning["severity"] }): void {
  if (warnings.length < limits.maxWarnings) warnings.push({ severity: "warning", ...value });
}

function warningError(warnings: MetadataWarning[], limits: SecurityLimits, value: Omit<MetadataWarning, "severity"> & { severity?: MetadataWarning["severity"] }): void {
  if (warnings.length < limits.maxWarnings) warnings.push({ severity: "error", ...value });
}

function decodeUtf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

/** Extracts dimensions from a bounded first VP8, VP8L, or VP8X image chunk. */
export function parseWebpDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 20 || !isAscii(bytes, 0, "RIFF") || !isAscii(bytes, 8, "WEBP")) return null;
  const riffEnd = uint32LittleEndian(bytes, 4) + 8;
  if (!Number.isSafeInteger(riffEnd) || riffEnd !== bytes.length || riffEnd < 20) return null;
  const chunkLength = uint32LittleEndian(bytes, 16);
  const paddedChunkEnd = 20 + chunkLength + (chunkLength & 1);
  if (!Number.isSafeInteger(paddedChunkEnd) || paddedChunkEnd > riffEnd) return null;

  if (isAscii(bytes, 12, "VP8X") && chunkLength === 10) {
    return { width: uint24LittleEndian(bytes, 24) + 1, height: uint24LittleEndian(bytes, 27) + 1 };
  }
  if (isAscii(bytes, 12, "VP8L") && chunkLength >= 5 && bytes[20] === 0x2f) {
    const b1 = bytes[21] ?? 0;
    const b2 = bytes[22] ?? 0;
    const b3 = bytes[23] ?? 0;
    const b4 = bytes[24] ?? 0;
    if ((b4 & 0xe0) !== 0) return null;
    return {
      width: 1 + b1 + ((b2 & 0x3f) << 8),
      height: 1 + (b2 >> 6) + (b3 << 2) + ((b4 & 0x0f) << 10),
    };
  }
  if (
    isAscii(bytes, 12, "VP8 ") &&
    chunkLength >= 10 &&
    ((bytes[20] ?? 1) & 0x01) === 0 &&
    ((bytes[20] ?? 0) & 0x10) !== 0 &&
    bytes[23] === 0x9d &&
    bytes[24] === 0x01 &&
    bytes[25] === 0x2a
  ) {
    const width = uint16LittleEndian(bytes, 26) & 0x3fff;
    const height = uint16LittleEndian(bytes, 28) & 0x3fff;
    return width > 0 && height > 0 ? { width, height } : null;
  }
  return null;
}

/** Parse bounded WebP EXIF and XMP chunks without decoding image payloads. */
export function parseWebp(bytes: Uint8Array, limits: SecurityLimits, selection?: ResolvedSelection, signal?: AbortSignal, registry?: MetadataRegistry): ParsedMetadataResult {
  throwIfAborted(signal);
  const warnings: MetadataWarning[] = [];
  const fields: MetadataField[] = [];
  const blocks: MetadataBlock[] = [];
  const xmpPackets: string[] = [];
  let exif: ExifData | null = null;
  let icc: ParsedMetadataResult["icc"] = null;
  let iccMalformed = false;
  let dimensions: ImageDimensions | null = null;
  let cursor = 12;
  let chunks = 0;
  let metadataBytes = 0;

  if (bytes.length < 12 || !isAscii(bytes, 0, "RIFF") || !isAscii(bytes, 8, "WEBP")) {
    warningError(warnings, limits, { code: "MALFORMED_WEBP", message: "The input does not begin with a valid RIFF/WEBP header.", offset: 0 });
  } else {
    const riffEnd = uint32LittleEndian(bytes, 4) + 8;
    if (!Number.isSafeInteger(riffEnd) || riffEnd !== bytes.length || riffEnd < 20) {
      warningError(warnings, limits, { code: "MALFORMED_WEBP", message: "RIFF size does not match the supplied WebP bytes.", offset: 4, length: 4 });
    } else {
      while (cursor < riffEnd) {
        throwIfAborted(signal);
        if (chunks >= limits.maxSegments) {
          warningError(warnings, limits, { code: "LIMIT_EXCEEDED", message: `WebP chunk count exceeds the configured limit of ${limits.maxSegments}.`, offset: cursor });
          break;
        }
        if (cursor > riffEnd - 8) {
          warningError(warnings, limits, { code: "TRUNCATED_DATA", message: "WebP chunk header is truncated.", offset: cursor });
          break;
        }
        const type = String.fromCharCode(bytes[cursor] ?? 0, bytes[cursor + 1] ?? 0, bytes[cursor + 2] ?? 0, bytes[cursor + 3] ?? 0);
        const length = uint32LittleEndian(bytes, cursor + 4);
        const dataStart = cursor + 8;
        const dataEnd = dataStart + length;
        const next = dataEnd + (length & 1);
        chunks += 1;
        if (!Number.isSafeInteger(dataEnd) || !Number.isSafeInteger(next) || dataEnd > riffEnd || next > riffEnd) {
          warningError(warnings, limits, { code: "TRUNCATED_DATA", message: "WebP chunk extends beyond the RIFF boundary.", offset: cursor, length });
          break;
        }
        const isMetadata = type === "EXIF" || type === "XMP " || type === "ICCP";
        if (isMetadata) {
          if ((type === "EXIF" && !wantsGroup(selection, "EXIF")) || (type === "XMP " && !wantsGroup(selection, "XMP")) || (type === "ICCP" && !wantsGroup(selection, "ICC"))) {
            const family = type === "EXIF" ? "EXIF" : type === "XMP " ? "XMP" : "ICC";
            blocks.push({ id: `webp:${type.trim()}:${cursor}`, family, container: `${type.trim() || "XMP"} chunk`, status: "skipped", offset: cursor, length: next - cursor, associatedImage: null, sensitivity: family === "ICC" ? "low" : "moderate", warningCodes: [] });
          }
          metadataBytes += length;
          if (length > limits.maxSegmentBytes || metadataBytes > limits.maxMetadataBytes) {
            warning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "WebP metadata exceeds the configured limit; this chunk was skipped.", offset: dataStart, length });
          } else if (type === "EXIF") {
            const blockId = `webp:EXIF:${cursor}`;
            blocks.push({ id: blockId, family: "EXIF", container: "EXIF chunk", status: "decoded", offset: cursor, length: next - cursor, associatedImage: null, sensitivity: "moderate", warningCodes: [] });
            if (wantsGroup(selection, "EXIF") && exif !== null) warning(warnings, limits, { code: "DUPLICATE_EXIF", message: "A later WebP EXIF chunk was ignored.", offset: dataStart });
            else if (wantsGroup(selection, "EXIF")) {
              const payload = bytes.subarray(dataStart, dataEnd);
              const tiff = payload.length >= 6 && payload[0] === 0x45 && payload[1] === 0x78 && payload[2] === 0x69 && payload[3] === 0x66 && payload[4] === 0 && payload[5] === 0 ? payload.subarray(6) : payload;
              const parsed = parseExif(tiff, limits, dataStart + (tiff === payload ? 0 : 6), selection?.tags, registry);
              for (const item of parsed.warnings) {
                if (warnings.length >= limits.maxWarnings) break;
                warnings.push(item);
              }
              if (parsed.exif !== null) {
                exif = parsed.exif;
                const tiffOffset = dataStart + (tiff === payload ? 0 : 6);
                fields.push(...parsed.fields.map((field) => field.source === undefined ? field : ({
                  ...field,
                  source: {
                    ...field.source,
                    blockId,
                    entryOffset: field.source.entryOffset === null ? null : tiffOffset + field.source.entryOffset,
                    valueOffset: field.source.valueOffset === null ? null : tiffOffset + field.source.valueOffset,
                  },
                })));
              }
            }
          } else if (type === "XMP ") {
            blocks.push({ id: `webp:XMP:${cursor}`, family: "XMP", container: "XMP chunk", status: "decoded", offset: cursor, length: next - cursor, associatedImage: null, sensitivity: "moderate", warningCodes: [] });
            if (wantsGroup(selection, "XMP")) {
              const payload = bytes.subarray(dataStart, dataEnd);
              const wrapped = parseXmpPacket(payload, limits.maxStringBytes);
              const packet = wrapped.matched ? wrapped.packet : payload.length <= limits.maxStringBytes ? decodeUtf8(payload) : null;
              if (packet === null) warning(warnings, limits, { code: "INVALID_VALUE", message: "WebP XMP payload is invalid UTF-8 or exceeds the configured string limit.", offset: dataStart, length });
              else xmpPackets.push(packet);
            }
          } else if (wantsGroup(selection, "ICC")) {
            blocks.push({ id: `webp:ICCP:${cursor}`, family: "ICC", container: "ICCP chunk", status: "decoded", offset: cursor, length: next - cursor, associatedImage: null, sensitivity: "low", warningCodes: [] });
            if (icc !== null) {
              iccMalformed = true;
              warning(warnings, limits, { code: "INVALID_VALUE", message: "A later WebP ICCP chunk was ignored.", offset: dataStart });
            } else {
              const profile = bytes.subarray(dataStart, dataEnd);
              const chunk: IccChunk = { sequence: 1, total: 1, byteLength: profile.length, data: profile.slice() };
              const inspected = inspectIccProfile([chunk], limits);
              icc = inspected.data;
              for (const item of inspected.fields) {
                if (fields.length >= limits.maxIfdEntries) break;
                fields.push(item);
              }
              for (const item of inspected.warnings) warning(warnings, limits, item);
              if (inspected.warnings.length > 0) iccMalformed = true;
            }
          }
        }
        if (chunks === 1 && type === "VP8X" && wantsGroup(selection, "Dimensions")) dimensions = parseWebpDimensions(bytes);
        cursor = next;
      }
    }
  }

  if (dimensions === null && wantsGroup(selection, "Dimensions")) dimensions = parseWebpDimensions(bytes);
  const resolvedBlocks = blocks.map((block) => {
    if (block.offset === null || block.length === null) return block;
    const offset = block.offset;
    const length = block.length;
    const local = warnings.filter((item) => item.offset !== undefined && item.offset >= offset && item.offset < offset + length);
    return { ...block, status: block.family === "ICC" && iccMalformed ? "malformed" : local.some((item) => item.severity === "error") ? "partial" : block.status, warningCodes: [...new Set(local.map((item) => item.code))] };
  });
  return {
    format: "webp",
    mimeType: "image/webp",
    dimensions,
    fields,
    exif,
    xmp: xmpPackets.length > 0 ? { packets: xmpPackets } : null,
    iptc: null,
    icc,
    jfif: null,
    pngText: [],
    blocks: resolvedBlocks,
    warnings,
  };
}
