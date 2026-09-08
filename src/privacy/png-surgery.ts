import type { MetadataWarning, RedactionRecord, RedactionResult, RedactOptions, SecurityLimits } from "../types.js";

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;
const XMP_KEYWORD = "XML:com.adobe.xmp";

function chunkType(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(bytes[offset] ?? 0, bytes[offset + 1] ?? 0, bytes[offset + 2] ?? 0, bytes[offset + 3] ?? 0);
}

function uint32(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) * 0x1000000 + (bytes[offset + 1] ?? 0) * 0x10000 + (bytes[offset + 2] ?? 0) * 0x100 + (bytes[offset + 3] ?? 0);
}

function crc32(bytes: Uint8Array, start: number, end: number): number {
  let crc = 0xffffffff;
  for (let offset = start; offset < end; offset += 1) {
    crc ^= bytes[offset] ?? 0;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function keyword(bytes: Uint8Array, start: number, end: number): string | null {
  let cursor = start;
  while (cursor < end && bytes[cursor] !== 0) cursor += 1;
  if (cursor === end) return null;
  try { return new TextDecoder("latin1").decode(bytes.subarray(start, cursor)); } catch { return null; }
}

function selected(remove: readonly string[], preserve: readonly string[], target: string): boolean {
  return remove.includes(target) && !preserve.includes(target) && !preserve.includes("AllMetadata");
}

function addRecord(records: RedactionRecord[], target: RedactionRecord["target"]): void {
  const existing = records.find((record) => record.target === target);
  if (existing) { records[records.indexOf(existing)] = { ...existing, occurrences: existing.occurrences + 1 }; return; }
  records.push({ target, occurrences: 1 });
}

function pushWarning(warnings: MetadataWarning[], limits: SecurityLimits, warning: MetadataWarning): void {
  if (warnings.length < limits.maxWarnings) warnings.push(warning);
}

/** Remove selected PNG ancillary chunks without touching image data chunks. */
export function redactPng(bytes: Uint8Array, options: RedactOptions, limits: SecurityLimits): RedactionResult {
  const warnings: MetadataWarning[] = [];
  const records: RedactionRecord[] = [];
  const remove = options.remove as readonly string[];
  const preserve = options.preserve as readonly string[];
  const parts: Uint8Array[] = [bytes.subarray(0, 8)];
  let cursor = 8;
  let chunks = 0;
  let metadataBytes = 0;
  let sawIhdr = false;
  let sawIdat = false;
  let leftIdat = false;
  let sawIend = false;
  let malformed = bytes.length < 8 || !SIGNATURE.every((byte, index) => bytes[index] === byte);

  while (!malformed && cursor < bytes.length) {
    if (chunks >= limits.maxPngChunks || cursor > bytes.length - 12) { malformed = true; break; }
    const length = uint32(bytes, cursor);
    const end = cursor + 12 + length;
    if (!Number.isSafeInteger(end) || end > bytes.length) { malformed = true; break; }
    const type = chunkType(bytes, cursor + 4);
    if (!/^[A-Za-z]{4}$/.test(type)) { malformed = true; break; }
    const dataStart = cursor + 8;
    const dataEnd = dataStart + length;
    chunks += 1;
    if (crc32(bytes, cursor + 4, dataEnd) !== uint32(bytes, dataEnd)) { malformed = true; break; }
    if (chunks === 1 && (type !== "IHDR" || length !== 13)) malformed = true;
    if (type === "IHDR") {
      if (sawIhdr) malformed = true;
      sawIhdr = true;
    }
    if (type === "IDAT") {
      if (leftIdat) malformed = true;
      sawIdat = true;
    } else if (sawIdat) {
      leftIdat = true;
    }
    if (type === "IEND" && length !== 0) malformed = true;
    if (malformed) break;
    let target: RedactionRecord["target"] | null = null;
    if (type === "eXIf") target = "EXIF";
    else if (type === "iCCP") target = "ICC";
    else if (type === "tEXt" || type === "zTXt" || type === "iTXt") {
      const name = keyword(bytes, dataStart, dataEnd);
      if (name === XMP_KEYWORD) target = "XMP";
      else target = "PNGText";
    }
    if (target !== null) {
      metadataBytes += length;
      if (!Number.isSafeInteger(metadataBytes) || length > limits.maxSegmentBytes || metadataBytes > limits.maxMetadataBytes) {
        pushWarning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "PNG metadata exceeds the configured limit; no bytes were changed.", severity: "error", offset: dataStart, length });
        malformed = true;
        break;
      }
    }
    const removeChunk = target !== null && (selected(remove, preserve, target) || (remove.includes("AllMetadata") && !preserve.includes(target)));
    if (target !== null && removeChunk) addRecord(records, target);
    else parts.push(bytes.subarray(cursor, end));
    cursor = end;
    if (type === "IEND") { sawIend = true; break; }
  }
  if (sawIend && cursor !== bytes.length) malformed = true;
  if (!sawIhdr || !sawIdat || !sawIend) malformed = true;
  if (malformed) {
    pushWarning(warnings, limits, { code: "REDACTION_SKIPPED", message: "PNG structure is malformed or truncated; no bytes were changed.", severity: "error" });
    return { data: new Uint8Array(bytes), format: "png", removed: [], warnings };
  }
  for (const target of remove) {
    if (!["EXIF", "XMP", "PNGText", "ICC", "AllMetadata"].includes(target) && !warnings.some(({ message }) => message.includes(target))) {
      pushWarning(warnings, limits, { code: "REDACTION_SKIPPED", message: `PNG redaction does not support target ${target}; no matching chunk was removed.`, severity: "warning" });
    }
  }
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return { data: output, format: "png", removed: records, warnings };
}
