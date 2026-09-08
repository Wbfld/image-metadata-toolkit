import { parseExif } from "../metadata/exif.js";
import { parseXmpPacket } from "../metadata/xmp.js";
import type { ExifData, ImageDimensions, MetadataField, MetadataResult, MetadataWarning, SecurityLimits } from "../types.js";

const CONTAINER_BOXES = new Set(["meta", "iprp", "ipco", "moov", "trak", "mdia", "minf", "stbl"]);

interface ScanBudget {
  remainingBoxes: number;
}

function uint32(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] ?? 0) * 0x1000000 +
    ((bytes[offset + 1] ?? 0) << 16) +
    ((bytes[offset + 2] ?? 0) << 8) +
    (bytes[offset + 3] ?? 0)
  );
}

function boxType(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(bytes[offset] ?? 0, bytes[offset + 1] ?? 0, bytes[offset + 2] ?? 0, bytes[offset + 3] ?? 0);
}

function uint64(bytes: Uint8Array, offset: number): number | null {
  const high = uint32(bytes, offset);
  const low = uint32(bytes, offset + 4);
  if (high > 0x1fffff) return null;
  const value = high * 0x100000000 + low;
  return Number.isSafeInteger(value) ? value : null;
}

function scanBoxes(
  bytes: Uint8Array,
  start: number,
  end: number,
  depth: number,
  maxDepth: number,
  budget: ScanBudget,
  found: ImageDimensions[],
): boolean {
  if (depth > maxDepth) return false;
  let cursor = start;
  while (cursor < end) {
    if (budget.remainingBoxes <= 0) return false;
    budget.remainingBoxes -= 1;
    if (cursor + 8 > end) return false;
    const size32 = uint32(bytes, cursor);
    const type = boxType(bytes, cursor + 4);
    let headerSize = 8;
    let size: number;
    if (size32 === 1) {
      if (cursor + 16 > end) return false;
      const extended = uint64(bytes, cursor + 8);
      if (extended === null) return false;
      size = extended;
      headerSize = 16;
    } else if (size32 === 0) {
      size = end - cursor;
    } else {
      size = size32;
    }
    if (size < headerSize || cursor + size > end || !Number.isSafeInteger(cursor + size)) return false;

    const payloadStart = cursor + headerSize;
    const boxEnd = cursor + size;
    if (type === "ispe") {
      if (boxEnd - payloadStart < 12) return false;
      const width = uint32(bytes, payloadStart + 4);
      const height = uint32(bytes, payloadStart + 8);
      if (width === 0 || height === 0) return false;
      found.push({ width, height });
    } else if (CONTAINER_BOXES.has(type)) {
      const childStart = type === "meta" ? payloadStart + 4 : payloadStart;
      if (childStart > boxEnd || !scanBoxes(bytes, childStart, boxEnd, depth + 1, maxDepth, budget, found)) return false;
    }
    cursor = boxEnd;
  }
  return cursor === end;
}

/** Returns dimensions only when every discovered image-spatial property agrees. */
export function parseHeifDimensions(bytes: Uint8Array, maxDepth = 8, maxBoxes = 4096): ImageDimensions | null {
  if (!Number.isSafeInteger(maxDepth) || maxDepth < 0 || !Number.isSafeInteger(maxBoxes) || maxBoxes < 1) {
    return null;
  }
  const found: ImageDimensions[] = [];
  const budget: ScanBudget = { remainingBoxes: maxBoxes };
  if (!scanBoxes(bytes, 0, bytes.length, 0, maxDepth, budget, found) || found.length === 0) return null;
  const first = found[0];
  if (first === undefined) return null;
  return found.every(({ width, height }) => width === first.width && height === first.height) ? first : null;
}

function warning(warnings: MetadataWarning[], limits: SecurityLimits, value: Omit<MetadataWarning, "severity"> & { severity?: MetadataWarning["severity"] }): void {
  if (warnings.length < limits.maxWarnings) warnings.push({ severity: "warning", ...value });
}

function warningError(warnings: MetadataWarning[], limits: SecurityLimits, value: Omit<MetadataWarning, "severity"> & { severity?: MetadataWarning["severity"] }): void {
  if (warnings.length < limits.maxWarnings) warnings.push({ severity: "error", ...value });
}

function ascii(bytes: Uint8Array, offset: number, length = 4): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function decodeUtf8(bytes: Uint8Array): string | null {
  try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { return null; }
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}

interface ItemInfo { readonly id: number; readonly type: string; readonly contentType?: string; }
interface ItemLocation { readonly method: number; readonly baseOffset: number; readonly extents: readonly { offset: number; length: number }[]; }

function uint16(bytes: Uint8Array, offset: number): number { return ((bytes[offset] ?? 0) << 8) | (bytes[offset + 1] ?? 0); }

function sizedInteger(bytes: Uint8Array, offset: number, size: number): { value: number; next: number } | null {
  if (size === 0) return { value: 0, next: offset };
  if (size === 4) return offset + 4 <= bytes.length ? { value: uint32(bytes, offset), next: offset + 4 } : null;
  if (size === 8) {
    const value = uint64(bytes, offset);
    return value === null ? null : { value, next: offset + 8 };
  }
  return null;
}

function parseItemInfos(payload: Uint8Array, maxItems: number): ItemInfo[] {
  if (payload.length < 6) return [];
  const version = payload[0] ?? 0;
  let cursor = 4;
  const count = version === 0 ? uint16(payload, cursor) : uint32(payload, cursor);
  cursor += version === 0 ? 2 : 4;
  const infos: ItemInfo[] = [];
  while (cursor + 8 <= payload.length && infos.length < maxItems && infos.length < count) {
    const size = uint32(payload, cursor);
    const type = boxType(payload, cursor + 4);
    if (size < 8 || cursor + size > payload.length) break;
    if (type === "infe") {
      const data = cursor + 8;
      const infeVersion = payload[data] ?? 0;
      let itemId: number;
      let typeOffset: number;
      if (infeVersion >= 3) { if (data + 12 > cursor + size) break; itemId = uint32(payload, data + 4); typeOffset = data + 10; }
      else { if (data + 10 > cursor + size) break; itemId = uint16(payload, data + 4); typeOffset = data + 8; }
      const itemType = boxType(payload, typeOffset);
      let contentType: string | undefined;
      if (itemType === "mime") {
        let start = typeOffset + 4;
        while (start < cursor + size && payload[start] !== 0) start += 1;
        start += 1;
        let end = start;
        while (end < cursor + size && payload[end] !== 0) end += 1;
        contentType = String.fromCharCode(...payload.subarray(start, end));
      }
      infos.push(contentType === undefined ? { id: itemId, type: itemType } : { id: itemId, type: itemType, contentType });
    }
    cursor += size;
  }
  return infos;
}

function parseItemLocations(payload: Uint8Array, maxItems: number, maxExtents: number): { locations: Map<number, ItemLocation>; malformed: boolean } {
  const locations = new Map<number, ItemLocation>();
  if (payload.length < 8) return { locations, malformed: true };
  const version = payload[0] ?? 0;
  const offsetSize = (payload[4] ?? 0) >> 4;
  const lengthSize = (payload[4] ?? 0) & 0x0f;
  const baseOffsetSize = (payload[5] ?? 0) & 0x0f;
  if (![0, 4, 8].includes(offsetSize) || ![0, 4, 8].includes(lengthSize) || ![0, 4, 8].includes(baseOffsetSize)) return { locations, malformed: true };
  let cursor = 6;
  const itemCountSize = version < 2 ? 2 : 4;
  if (cursor + itemCountSize > payload.length) return { locations, malformed: true };
  const itemCount = itemCountSize === 2 ? uint16(payload, cursor) : uint32(payload, cursor);
  cursor += itemCountSize;
  for (let itemIndex = 0; itemIndex < itemCount && itemIndex < maxItems; itemIndex += 1) {
    const itemIdSize = version < 2 ? 2 : 4;
    if (cursor + itemIdSize + (version >= 1 ? 4 : 2) > payload.length) return { locations, malformed: true };
    const itemId = itemIdSize === 2 ? uint16(payload, cursor) : uint32(payload, cursor);
    cursor += itemIdSize;
    let method = 0;
    if (version >= 1) { method = uint16(payload, cursor) & 0x0f; cursor += 2; }
    cursor += 2;
    const base = sizedInteger(payload, cursor, baseOffsetSize);
    if (base === null) return { locations, malformed: true };
    cursor = base.next;
    if (cursor + 2 > payload.length) return { locations, malformed: true };
    const extentCount = uint16(payload, cursor); cursor += 2;
    if (extentCount > maxExtents) return { locations, malformed: true };
    const extents: Array<{ offset: number; length: number }> = [];
    for (let extentIndex = 0; extentIndex < extentCount; extentIndex += 1) {
      const offset = sizedInteger(payload, cursor, offsetSize);
      if (offset === null) return { locations, malformed: true };
      cursor = offset.next;
      const length = sizedInteger(payload, cursor, lengthSize);
      if (length === null) return { locations, malformed: true };
      cursor = length.next;
      extents.push({ offset: offset.value, length: length.value });
    }
    locations.set(itemId, { method, baseOffset: base.value, extents });
  }
  return { locations, malformed: false };
}

function scanItemBoxes(bytes: Uint8Array, start: number, end: number, depth: number, limits: SecurityLimits, state: { infos: ItemInfo[]; locations: Map<number, ItemLocation>; warnings: MetadataWarning[]; idat: Uint8Array | null }): void {
  if (depth > limits.maxIfdDepth) { warning(state.warnings, limits, { code: "LIMIT_EXCEEDED", message: "HEIF item box nesting exceeds the configured depth limit.", offset: start }); return; }
  let cursor = start;
  while (cursor < end) {
    if (cursor > end - 8) { warning(state.warnings, limits, { code: "TRUNCATED_DATA", message: "HEIF item box header is truncated.", offset: cursor }); return; }
    const size32 = uint32(bytes, cursor);
    const type = boxType(bytes, cursor + 4);
    let header = 8;
    let size = size32;
    if (size32 === 1) { if (cursor > end - 16) return; const extended = uint64(bytes, cursor + 8); if (extended === null) return; size = extended; header = 16; }
    else if (size32 === 0) size = end - cursor;
    const boxEnd = cursor + size;
    if (!Number.isSafeInteger(boxEnd) || size < header || boxEnd > end) { warning(state.warnings, limits, { code: "TRUNCATED_DATA", message: "HEIF item box extends beyond its parent.", offset: cursor, length: size }); return; }
    const payloadStart = cursor + header;
    const payload = bytes.subarray(payloadStart, boxEnd);
    if (type === "iinf") {
      state.infos.push(...parseItemInfos(payload, limits.maxIfdEntries - state.infos.length));
    } else if (type === "iloc") {
      const parsed = parseItemLocations(payload, limits.maxIfdEntries, limits.maxSegments);
      if (parsed.malformed) warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF item-location box is malformed or uses unsupported field sizes.", offset: payloadStart });
      for (const [id, location] of parsed.locations) state.locations.set(id, location);
    } else if (type === "idat") {
      state.idat = payload;
    }
    if (CONTAINER_BOXES.has(type)) {
      const childStart = type === "meta" ? payloadStart + 4 : payloadStart;
      if (childStart <= boxEnd) scanItemBoxes(bytes, childStart, boxEnd, depth + 1, limits, state);
    }
    cursor = boxEnd;
  }
}

function resolveItem(bytes: Uint8Array, location: ItemLocation, idat: Uint8Array | null, limits: SecurityLimits): Uint8Array | null {
  if (location.method !== 0 && location.method !== 1) return null;
  const parts: Uint8Array[] = [];
  let total = 0;
  for (const extent of location.extents) {
    const start = location.baseOffset + extent.offset;
    const end = start + extent.length;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || extent.length > limits.maxSegmentBytes || total + extent.length > limits.maxMetadataBytes) return null;
    const source = location.method === 1 ? idat : bytes;
    if (source === null || end > source.length) return null;
    const actualStart = location.method === 1 ? start : start;
    parts.push(source.subarray(actualStart, end));
    total += extent.length;
  }
  const result = new Uint8Array(total);
  let cursor = 0;
  for (const part of parts) { result.set(part, cursor); cursor += part.length; }
  return result;
}

function inspectItemMetadata(bytes: Uint8Array, limits: SecurityLimits): { exif: Uint8Array | null; xmp: Uint8Array[]; warnings: readonly MetadataWarning[] } {
  const state = { infos: [] as ItemInfo[], locations: new Map<number, ItemLocation>(), warnings: [] as MetadataWarning[], idat: null as Uint8Array | null };
  scanItemBoxes(bytes, 0, bytes.length, 0, limits, state);
  let itemData: Uint8Array | null = null;
  const foundXmp: Uint8Array[] = [];
  for (const info of state.infos) {
    const location = state.locations.get(info.id);
    if (location === undefined) {
      if (info.type === "Exif" || info.type === "mime") warning(state.warnings, limits, { code: "UNSAFE_OFFSET", message: `HEIF metadata item ${info.id} has no item-location entry.`, offset: 0 });
      continue;
    }
    const resolved = resolveItem(bytes, location, state.idat, limits);
    if (resolved === null) {
      if (info.type === "Exif" || info.type === "mime") warning(state.warnings, limits, { code: "UNSAFE_OFFSET", message: `HEIF metadata item ${info.id} has an unsafe or unsupported extent.`, offset: 0 });
      continue;
    }
    if (info.type === "Exif") itemData = itemData ?? resolved;
    else if (info.type === "mime" && info.contentType?.toLowerCase().includes("rdf+xml")) foundXmp.push(resolved);
  }
  return { exif: itemData, xmp: foundXmp, warnings: state.warnings };
}

/** Inspect bounded HEIF/AVIF metadata boxes and common Exif/XMP item locations. */
export function parseHeif(bytes: Uint8Array, limits: SecurityLimits, format: "heif" | "avif"): MetadataResult {
  const warnings: MetadataWarning[] = [];
  const fields: MetadataField[] = [];
  const xmpPackets: string[] = [];
  let exif: ExifData | null = null;
  let metadataBytes = 0;
  let boxCount = 0;
  const dimensions = parseHeifDimensions(bytes, limits.maxIfdDepth, limits.maxSegments);

  const visit = (start: number, end: number, depth: number): void => {
    if (depth > limits.maxIfdDepth) {
      warning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "HEIF box nesting exceeds the configured depth limit.", offset: start });
      return;
    }
    let cursor = start;
    while (cursor < end) {
      if (boxCount >= limits.maxSegments) { warningError(warnings, limits, { code: "LIMIT_EXCEEDED", message: "HEIF box count exceeds the configured limit.", offset: cursor }); return; }
      if (cursor > end - 8) { warningError(warnings, limits, { code: "TRUNCATED_DATA", message: "HEIF box header is truncated.", offset: cursor }); return; }
      const size32 = uint32(bytes, cursor);
      const type = boxType(bytes, cursor + 4);
      let header = 8;
      let size = size32;
      if (size32 === 1) { if (cursor > end - 16) { warningError(warnings, limits, { code: "TRUNCATED_DATA", message: "HEIF extended box header is truncated.", offset: cursor }); return; } const extended = uint64(bytes, cursor + 8); if (extended === null) { warningError(warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF extended box size is unsafe.", offset: cursor }); return; } size = extended; header = 16; }
      else if (size32 === 0) size = end - cursor;
      const boxEnd = cursor + size;
      if (!Number.isSafeInteger(boxEnd) || size < header || boxEnd > end) { warningError(warnings, limits, { code: "TRUNCATED_DATA", message: "HEIF box extends beyond its parent.", offset: cursor, length: size }); return; }
      boxCount += 1;
      const payloadStart = cursor + header;
      const payload = bytes.subarray(payloadStart, boxEnd);
      if (type === "Exif" || type === "exif") {
        metadataBytes += payload.length;
        if (payload.length > limits.maxSegmentBytes || metadataBytes > limits.maxMetadataBytes) warning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "HEIF EXIF payload exceeds the configured metadata limit.", offset: payloadStart, length: payload.length });
        else if (exif === null) {
          // HEIF Exif item payloads use a four-byte big-endian offset to the
          // TIFF header. Direct `Exif` boxes seen in some encoders may carry
          // the TIFF header without that prefix, so retain the validated
          // fallback below when the prefix is not present.
          const exifOffset = payload.length >= 4 ? uint32(payload, 0) : 0;
          const tiff = payload.length >= 4 && payload[0] === 0 && payload[1] === 0 && payload[2] === 0 && exifOffset < payload.length ? payload.subarray(exifOffset) : payload;
          const parsed = parseExif(tiff, limits, payloadStart + (tiff === payload ? 0 : exifOffset));
          for (const item of parsed.warnings) warning(warnings, limits, item);
          if (parsed.exif !== null) { exif = parsed.exif; fields.push(...parsed.fields); }
        } else warning(warnings, limits, { code: "DUPLICATE_EXIF", message: "A later HEIF EXIF box was ignored.", offset: payloadStart });
      } else if (type === "xml " || type === "XMP ") {
        metadataBytes += payload.length;
        if (payload.length > limits.maxSegmentBytes || metadataBytes > limits.maxMetadataBytes) warning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "HEIF XMP payload exceeds the configured metadata limit.", offset: payloadStart, length: payload.length });
        else { const wrapped = parseXmpPacket(payload, limits.maxStringBytes); const packet = wrapped.matched ? wrapped.packet : payload.length <= limits.maxStringBytes ? decodeUtf8(payload) : null; if (packet === null) warning(warnings, limits, { code: "INVALID_VALUE", message: "HEIF XMP payload is invalid UTF-8 or exceeds the configured string limit.", offset: payloadStart, length: payload.length }); else xmpPackets.push(packet); }
      }
      if (CONTAINER_BOXES.has(type)) {
        const childStart = type === "meta" ? payloadStart + 4 : payloadStart;
        if (childStart > boxEnd) { warningError(warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF container payload is truncated.", offset: payloadStart }); return; }
        visit(childStart, boxEnd, depth + 1);
      }
      cursor = boxEnd;
    }
  };

  visit(0, bytes.length, 0);
  const itemMetadata = inspectItemMetadata(bytes, limits);
  for (const item of itemMetadata.warnings) warning(warnings, limits, item);
  if (itemMetadata.exif !== null && !isPresent(exif)) {
    const payload = itemMetadata.exif;
    const exifOffset = payload.length >= 4 ? uint32(payload, 0) : 0;
    const tiff = payload.length >= 4 && exifOffset < payload.length ? payload.subarray(exifOffset) : payload;
    const parsed = parseExif(tiff, limits, exifOffset < payload.length ? exifOffset : 0);
    for (const item of parsed.warnings) warning(warnings, limits, item);
    if (parsed.exif !== null) { exif = parsed.exif; fields.push(...parsed.fields); }
  }
  for (const packetBytes of itemMetadata.xmp) {
    const packet = packetBytes.length <= limits.maxStringBytes ? decodeUtf8(packetBytes) : null;
    if (packet === null) warning(warnings, limits, { code: "INVALID_VALUE", message: "HEIF item XMP payload is invalid UTF-8 or exceeds the configured string limit.", length: packetBytes.length });
    else xmpPackets.push(packet);
  }
  if (bytes.length < 16 || ascii(bytes, 4) !== "ftyp") warningError(warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF/AVIF input has no valid ftyp box.", offset: 0 });
  return { format, mimeType: format === "avif" ? "image/avif" : "image/heif", dimensions, fields, exif, xmp: xmpPackets.length > 0 ? { packets: xmpPackets } : null, iptc: null, icc: null, jfif: null, pngText: [], warnings };
}
