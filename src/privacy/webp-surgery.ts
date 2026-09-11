import type { RedactionRecord, SurgeryResult, RedactOptions, SecurityLimits } from "../types.js";
import { WarningCollector } from "../security/warnings.js";

interface Chunk {
  readonly type: string;
  readonly start: number;
  readonly end: number;
  readonly dataStart: number;
  readonly dataEnd: number;
}

const SUPPORTED_TARGETS = new Set(["AllMetadata", "EXIF", "XMP", "ICC"]);
const CHILD_TARGETS = new Set(["GPS", "SerialNumber", "Make", "Model", "Orientation", "DateTime", "DateTimeOriginal", "ExposureTime", "FNumber", "ISOSpeedRatings", "Flash", "FocalLength", "GPSLatitude", "GPSLongitude", "GPSAltitude", "Copyright", "Artist", "Software"]);

function readUint32(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8) | ((bytes[offset + 2] ?? 0) << 16) | ((bytes[offset + 3] ?? 0) << 24 >>> 0);
}

function writeUint32(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}

function category(type: string): "EXIF" | "XMP" | "ICC" | null {
  if (type === "EXIF") return "EXIF";
  if (type === "XMP ") return "XMP";
  if (type === "ICCP") return "ICC";
  return null;
}

function shouldRemove(target: string, remove: readonly string[], preserve: readonly string[]): boolean {
  if (preserve.includes("AllMetadata") || preserve.includes(target)) return false;
  if (target === "EXIF" && preserve.some((item) => CHILD_TARGETS.has(item))) return false;
  return remove.includes(target) || remove.includes("AllMetadata");
}

function addRecord(records: RedactionRecord[], target: RedactionRecord["target"]): void {
  const existing = records.find((item) => item.target === target);
  if (existing === undefined) records.push({ target, occurrences: 1 });
  else records[records.indexOf(existing)] = { ...existing, occurrences: existing.occurrences + 1 };
}

function result(data: Uint8Array, records: RedactionRecord[], options: RedactOptions, warnings: WarningCollector): SurgeryResult {
  const removed = options.remove.includes("AllMetadata")
    ? records
    : options.remove.flatMap((target) => {
    const item = records.find((candidate) => candidate.target === target);
    return item === undefined ? [] : [item];
  });
  return { data, format: "webp", removed, warnings: warnings.toArray() };
}

/** Remove WebP EXIF, XMP, and ICCP chunks while copying image payloads verbatim. */
export function redactWebp(bytes: Uint8Array, options: RedactOptions, limits: SecurityLimits): SurgeryResult {
  const original = new Uint8Array(bytes);
  const warnings = new WarningCollector(limits);
  const records: RedactionRecord[] = [];
  const remove = options.remove as readonly string[];
  const preserve = options.preserve ?? [];
  if (bytes.length < 12 || String.fromCharCode(...bytes.subarray(0, 4)) !== "RIFF" || String.fromCharCode(...bytes.subarray(8, 12)) !== "WEBP") {
    warnings.add({ code: "MALFORMED_WEBP", message: "The input does not begin with a valid RIFF/WEBP header.", severity: "error" });
    return result(original, records, options, warnings);
  }
  const riffEnd = readUint32(bytes, 4) + 8;
  if (!Number.isSafeInteger(riffEnd) || riffEnd !== bytes.length) {
    warnings.add({ code: "MALFORMED_WEBP", message: "RIFF size does not match the supplied WebP bytes.", severity: "error", offset: 4, length: 4 });
    return result(original, records, options, warnings);
  }
  const chunks: Chunk[] = [];
  let cursor = 12;
  let metadataBytes = 0;
  while (cursor < riffEnd) {
    if (chunks.length >= limits.maxSegments || cursor > riffEnd - 8) {
      warnings.add({ code: "LIMIT_EXCEEDED", message: "WebP chunk count exceeds the configured limit or its header is truncated.", severity: "error", offset: cursor });
      return result(original, [], options, warnings);
    }
    const length = readUint32(bytes, cursor + 4);
    const dataStart = cursor + 8;
    const dataEnd = dataStart + length;
    const end = dataEnd + (length & 1);
    if (!Number.isSafeInteger(end) || dataEnd > riffEnd || end > riffEnd) {
      warnings.add({ code: "TRUNCATED_DATA", message: "WebP chunk extends beyond the RIFF boundary.", severity: "error", offset: cursor, length });
      return result(original, [], options, warnings);
    }
    const type = String.fromCharCode(...bytes.subarray(cursor, cursor + 4));
    const target = category(type);
    if (target !== null) {
      metadataBytes += length;
      if (!Number.isSafeInteger(metadataBytes) || length > limits.maxSegmentBytes || metadataBytes > limits.maxMetadataBytes) {
        warnings.add({ code: "LIMIT_EXCEEDED", message: "WebP metadata exceeds the configured limit; no bytes were changed.", severity: "error", offset: dataStart, length });
        return result(original, [], options, warnings);
      }
    }
    chunks.push({ type, start: cursor, end, dataStart, dataEnd });
    cursor = end;
  }

  if (preserve.includes("AllMetadata") || remove.length === 0) return result(original, [], options, warnings);
  if ((remove.includes("AllMetadata") || remove.includes("EXIF")) && preserve.some((target) => CHILD_TARGETS.has(target))) {
    warnings.add({
      code: "REDACTION_SKIPPED",
      message: "WebP EXIF was retained because selective EXIF preservation is not available.",
      severity: "warning",
    });
  }
  for (const target of remove) {
    if (!SUPPORTED_TARGETS.has(target) && !CHILD_TARGETS.has(target)) {
      warnings.add({ code: "REDACTION_SKIPPED", message: `WebP redaction does not support target ${target}; no matching chunk was removed.`, severity: "warning" });
    } else if (CHILD_TARGETS.has(target)) {
      warnings.add({ code: "REDACTION_SKIPPED", message: `WebP redaction does not expose selective EXIF target ${target}; no matching chunk was removed.`, severity: "warning" });
    }
  }

  const removedStarts = new Set<number>();
  for (const chunk of chunks) {
    const target = category(chunk.type);
    if (target !== null && shouldRemove(target, remove, preserve)) {
      removedStarts.add(chunk.start);
      addRecord(records, target);
    }
  }
  const keptMetadata = new Set(chunks.filter((chunk) => !removedStarts.has(chunk.start)).map((chunk) => category(chunk.type)).filter((value): value is "EXIF" | "XMP" | "ICC" => value !== null));
  const parts: Uint8Array[] = [bytes.subarray(0, 12)];
  for (const chunk of chunks) {
    if (removedStarts.has(chunk.start)) continue;
    if (chunk.type === "VP8X" && chunk.dataEnd - chunk.dataStart >= 1) {
      const vp8x = bytes.slice(chunk.start, chunk.end);
      const flags = vp8x[8] ?? 0;
      const nextFlags = (flags & ~0x2c) | (keptMetadata.has("ICC") ? 0x20 : 0) | (keptMetadata.has("EXIF") ? 0x08 : 0) | (keptMetadata.has("XMP") ? 0x04 : 0);
      vp8x[8] = nextFlags;
      parts.push(vp8x);
    } else {
      parts.push(bytes.subarray(chunk.start, chunk.end));
    }
  }
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let outputOffset = 0;
  for (const part of parts) { output.set(part, outputOffset); outputOffset += part.length; }
  writeUint32(output, 4, output.length - 8);
  return result(output, records, options, warnings);
}
