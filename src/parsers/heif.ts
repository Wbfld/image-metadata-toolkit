import { parseExif } from "../metadata/exif.js";
import { inspectIccProfile, type IccChunk } from "../metadata/icc.js";
import { parseXmpPacket } from "../metadata/xmp.js";
import { extractExifThumbnail } from "../metadata/thumbnail.js";
import type { ExifData, ImageDimensions, ImageTransform, MetadataField, NclxColorData, ParsedMetadataResult, MetadataWarning, SecurityLimits } from "../types.js";

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

function hasTiffHeader(bytes: Uint8Array, offset: number): boolean {
  return offset >= 0 && offset <= bytes.length - 4 && (
    (bytes[offset] === 0x49 && bytes[offset + 1] === 0x49 && bytes[offset + 2] === 0x2a && bytes[offset + 3] === 0x00) ||
    (bytes[offset] === 0x4d && bytes[offset + 1] === 0x4d && bytes[offset + 2] === 0x00 && bytes[offset + 3] === 0x2a)
  );
}

/**
 * HEIF Exif items carry a four-byte offset before the TIFF data. The offset
 * is relative to the byte immediately after that field. A few non-standard
 * direct Exif boxes carry a TIFF header directly, which is accepted only when
 * the TIFF marker is present at byte zero.
 */
function extractHeifExifTiff(payload: Uint8Array): { readonly tiff: Uint8Array; readonly offset: number } | null {
  if (hasTiffHeader(payload, 0)) return { tiff: payload, offset: 0 };
  if (payload.length < 4) return null;
  const relativeOffset = uint32(payload, 0);
  const offset = 4 + relativeOffset;
  if (!Number.isSafeInteger(offset) || !hasTiffHeader(payload, offset)) return null;
  return { tiff: payload.subarray(offset), offset };
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}

interface ItemInfo { readonly id: number; readonly type: string; readonly contentType?: string; }
interface ItemLocation {
  readonly method: number;
  readonly dataReferenceIndex: number;
  readonly baseOffset: number;
  readonly extents: readonly { offset: number; length: number }[];
}
interface ParsedItemInfos {
  readonly infos: readonly ItemInfo[];
  readonly malformed: boolean;
  readonly limited: boolean;
}
interface ItemProperty {
  readonly dimensions?: ImageDimensions;
  readonly icc?: Uint8Array;
  readonly nclx?: NclxColorData;
  readonly rotation?: ImageTransform["rotation"];
  readonly mirrorAxis?: "vertical" | "horizontal";
}

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

function readNullTerminated(bytes: Uint8Array, start: number, end: number, maxBytes: number): { readonly value: Uint8Array; readonly next: number } | null {
  const limit = Math.min(end, start + maxBytes + 1);
  for (let cursor = start; cursor < limit; cursor += 1) {
    if (bytes[cursor] === 0) return { value: bytes.subarray(start, cursor), next: cursor + 1 };
  }
  return null;
}

function asciiValue(bytes: Uint8Array): string | null {
  for (const byte of bytes) if (byte > 0x7f) return null;
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function parseItemInfos(payload: Uint8Array, maxItems: number, maxStringBytes: number): ParsedItemInfos {
  if (payload.length < 4) return { infos: [], malformed: true, limited: false };
  const version = payload[0] ?? 0;
  let cursor = 4;
  if (version !== 0 && version !== 1) return { infos: [], malformed: true, limited: false };
  if (cursor + (version === 0 ? 2 : 4) > payload.length) return { infos: [], malformed: true, limited: false };
  const count = version === 0 ? uint16(payload, cursor) : uint32(payload, cursor);
  cursor += version === 0 ? 2 : 4;
  const infos: ItemInfo[] = [];
  const entriesToRead = Math.min(count, maxItems);
  for (let entryIndex = 0; entryIndex < entriesToRead; entryIndex += 1) {
    if (cursor + 8 > payload.length) return { infos, malformed: true, limited: count > maxItems };
    const size = uint32(payload, cursor);
    const type = boxType(payload, cursor + 4);
    if (size < 8 || cursor + size > payload.length) return { infos, malformed: true, limited: count > maxItems };
    if (type !== "infe") return { infos, malformed: true, limited: count > maxItems };
    {
      const data = cursor + 8;
      const infeVersion = payload[data] ?? 0;
      let itemId: number;
      let typeOffset: number;
      if (infeVersion === 3) {
        if (data + 14 > cursor + size) return { infos, malformed: true, limited: count > maxItems };
        itemId = uint32(payload, data + 4);
        typeOffset = data + 10;
      } else if (infeVersion === 2) {
        if (data + 12 > cursor + size) return { infos, malformed: true, limited: count > maxItems };
        itemId = uint16(payload, data + 4);
        typeOffset = data + 8;
      } else {
        return { infos, malformed: true, limited: count > maxItems };
      }
      const itemType = boxType(payload, typeOffset);
      const itemName = readNullTerminated(payload, typeOffset + 4, cursor + size, maxStringBytes);
      if (itemName === null) return { infos, malformed: true, limited: count > maxItems };
      let contentType: string | undefined;
      if (itemType === "mime") {
        const content = readNullTerminated(payload, itemName.next, cursor + size, maxStringBytes);
        if (content === null) return { infos, malformed: true, limited: count > maxItems };
        const parsedContentType = asciiValue(content.value);
        if (parsedContentType === null) return { infos, malformed: true, limited: count > maxItems };
        contentType = parsedContentType;
        // ISO BMFF defines content_encoding as optional. libavif emits its
        // MIME item entry without it when the payload is unencoded, so only
        // require a terminator when the optional string is actually present.
        if (content.next < cursor + size) {
          const encoding = readNullTerminated(payload, content.next, cursor + size, maxStringBytes);
          if (encoding === null || encoding.next !== cursor + size) {
            return { infos, malformed: true, limited: count > maxItems };
          }
        }
      }
      infos.push(contentType === undefined ? { id: itemId, type: itemType } : { id: itemId, type: itemType, contentType });
    }
    cursor += size;
  }
  return { infos, malformed: count <= maxItems && cursor !== payload.length, limited: count > maxItems };
}

function parseItemLocations(payload: Uint8Array, maxItems: number, maxExtents: number): { locations: Map<number, ItemLocation>; malformed: boolean; limited: boolean } {
  const locations = new Map<number, ItemLocation>();
  if (payload.length < 8) return { locations, malformed: true, limited: false };
  const version = payload[0] ?? 0;
  if (version > 2) return { locations, malformed: true, limited: false };
  const offsetSize = (payload[4] ?? 0) >> 4;
  const lengthSize = (payload[4] ?? 0) & 0x0f;
  const baseOffsetSize = (payload[5] ?? 0) & 0x0f;
  const indexSize = version >= 1 ? (payload[5] ?? 0) >> 4 : 0;
  const reserved = version === 0 ? (payload[5] ?? 0) >> 4 : 0;
  if (
    ![0, 4, 8].includes(offsetSize) ||
    ![0, 4, 8].includes(lengthSize) ||
    ![0, 4, 8].includes(baseOffsetSize) ||
    ![0, 4, 8].includes(indexSize) ||
    reserved !== 0
  ) return { locations, malformed: true, limited: false };
  let cursor = 6;
  const itemCountSize = version < 2 ? 2 : 4;
  if (cursor + itemCountSize > payload.length) return { locations, malformed: true, limited: false };
  const itemCount = itemCountSize === 2 ? uint16(payload, cursor) : uint32(payload, cursor);
  cursor += itemCountSize;
  let malformed = false;
  for (let itemIndex = 0; itemIndex < itemCount && itemIndex < maxItems; itemIndex += 1) {
    const itemIdSize = version < 2 ? 2 : 4;
    if (cursor + itemIdSize > payload.length) return { locations, malformed: true, limited: itemCount > maxItems };
    const itemId = itemIdSize === 2 ? uint16(payload, cursor) : uint32(payload, cursor);
    cursor += itemIdSize;
    if (itemId === 0) return { locations, malformed: true, limited: itemCount > maxItems };
    let method = 0;
    if (version >= 1) {
      if (cursor + 2 > payload.length) return { locations, malformed: true, limited: itemCount > maxItems };
      const constructionMethod = uint16(payload, cursor);
      if ((constructionMethod & 0xfff0) !== 0) return { locations, malformed: true, limited: itemCount > maxItems };
      method = constructionMethod & 0x0f;
      cursor += 2;
    }
    if (cursor + 2 > payload.length) return { locations, malformed: true, limited: itemCount > maxItems };
    const dataReferenceIndex = uint16(payload, cursor);
    cursor += 2;
    const base = sizedInteger(payload, cursor, baseOffsetSize);
    if (base === null) return { locations, malformed: true, limited: itemCount > maxItems };
    cursor = base.next;
    if (cursor + 2 > payload.length) return { locations, malformed: true, limited: itemCount > maxItems };
    const extentCount = uint16(payload, cursor); cursor += 2;
    if (extentCount > maxExtents) return { locations, malformed: true, limited: itemCount > maxItems };
    const extents: Array<{ offset: number; length: number }> = [];
    for (let extentIndex = 0; extentIndex < extentCount; extentIndex += 1) {
      if (indexSize > 0) {
        const index = sizedInteger(payload, cursor, indexSize);
        if (index === null) return { locations, malformed: true, limited: itemCount > maxItems };
        cursor = index.next;
      }
      const offset = sizedInteger(payload, cursor, offsetSize);
      if (offset === null) return { locations, malformed: true, limited: itemCount > maxItems };
      cursor = offset.next;
      const length = sizedInteger(payload, cursor, lengthSize);
      if (length === null) return { locations, malformed: true, limited: itemCount > maxItems };
      cursor = length.next;
      extents.push({ offset: offset.value, length: length.value });
    }
    if (locations.has(itemId)) malformed = true;
    else locations.set(itemId, { method, dataReferenceIndex, baseOffset: base.value, extents });
  }
  return { locations, malformed: malformed || (itemCount <= maxItems && cursor !== payload.length), limited: itemCount > maxItems };
}

interface ItemScanState {
  infos: ItemInfo[];
  locations: Map<number, ItemLocation>;
  warnings: MetadataWarning[];
  idat: Uint8Array | null;
  boxBudget: ScanBudget;
  primaryItemId: number | null;
  properties: Map<number, ItemProperty>;
  associations: Map<number, readonly number[]>;
  /** `cdsc` references from a metadata item to the item it describes. */
  descriptions: Map<number, ReadonlySet<number>>;
  itemPropertiesSeen: boolean;
  propertyContainerSeen: boolean;
}

function parsePrimaryItem(payload: Uint8Array): number | null {
  if (payload.length < 6) return null;
  const version = payload[0] ?? 0;
  if (version === 0) return uint16(payload, 4);
  return version === 1 && payload.length >= 8 ? uint32(payload, 4) : null;
}

function parseSpatialExtent(payload: Uint8Array): ImageDimensions | null {
  if (payload.length < 12) return null;
  const width = uint32(payload, 4);
  const height = uint32(payload, 8);
  return width > 0 && height > 0 ? { width, height } : null;
}

interface ColourProperty {
  readonly icc?: Uint8Array;
  readonly nclx?: NclxColorData;
  readonly malformed?: boolean;
}

function parseColourProperty(payload: Uint8Array): ColourProperty | null {
  if (payload.length < 4) return null;
  const colourType = boxType(payload, 0);
  if (colourType === "prof" || colourType === "rICC") return { icc: payload.subarray(4) };
  if (colourType !== "nclx") return null;
  if (payload.length !== 11 || ((payload[10] ?? 0) & 0x7f) !== 0) return { malformed: true };
  return {
    nclx: {
      colourPrimaries: uint16(payload, 4),
      transferCharacteristics: uint16(payload, 6),
      matrixCoefficients: uint16(payload, 8),
      fullRange: ((payload[10] ?? 0) & 0x80) !== 0,
    },
  };
}

function parsePropertyContainer(payload: Uint8Array, limits: SecurityLimits, state: ItemScanState): void {
  if (state.propertyContainerSeen) {
    warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF metadata contains multiple item-property containers.", offset: 0 });
    return;
  }
  state.propertyContainerSeen = true;
  let cursor = 0;
  let index = 1;
  while (cursor < payload.length) {
    if (state.boxBudget.remainingBoxes <= 0) { warning(state.warnings, limits, { code: "LIMIT_EXCEEDED", message: "HEIF item-property box count exceeds the configured limit.", offset: cursor }); return; }
    state.boxBudget.remainingBoxes -= 1;
    if (cursor > payload.length - 8) { warning(state.warnings, limits, { code: "TRUNCATED_DATA", message: "HEIF item-property box header is truncated.", offset: cursor }); return; }
    const size = uint32(payload, cursor);
    const type = boxType(payload, cursor + 4);
    if (size < 8 || cursor + size > payload.length || !Number.isSafeInteger(cursor + size)) {
      warning(state.warnings, limits, { code: "TRUNCATED_DATA", message: "HEIF item-property box extends beyond its container.", offset: cursor, length: size });
      return;
    }
    const propertyPayload = payload.subarray(cursor + 8, cursor + size);
    const dimensions = type === "ispe" ? parseSpatialExtent(propertyPayload) : null;
    const colour = type === "colr" ? parseColourProperty(propertyPayload) : null;
    if (colour?.malformed === true) {
      warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF nclx colour property is truncated or has reserved range bits.", offset: cursor + 8 });
    }
    const rotation = type === "irot" && propertyPayload.length >= 1 ? (((propertyPayload[0] ?? 0) & 0x03) * 90) as ImageTransform["rotation"] : undefined;
    const mirrorAxis = type === "imir" && propertyPayload.length >= 1 ? ((propertyPayload[0] ?? 0) & 0x01) === 0 ? "vertical" as const : "horizontal" as const : undefined;
    state.properties.set(index, {
      ...(dimensions === null ? {} : { dimensions }),
      ...(colour?.icc === undefined ? {} : { icc: colour.icc }),
      ...(colour?.nclx === undefined ? {} : { nclx: colour.nclx }),
      ...(rotation === undefined ? {} : { rotation }),
      ...(mirrorAxis === undefined ? {} : { mirrorAxis }),
    });
    index += 1;
    cursor += size;
  }
}

function parsePropertyAssociations(payload: Uint8Array, limits: SecurityLimits, state: ItemScanState): void {
  if (payload.length < 8) { warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF item-property association box is truncated.", offset: 0 }); return; }
  const version = payload[0] ?? 0;
  const flags = ((payload[1] ?? 0) << 16) | ((payload[2] ?? 0) << 8) | (payload[3] ?? 0);
  if (version > 1 || (flags & ~1) !== 0) { warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF item-property association version or flags are unsupported.", offset: 0 }); return; }
  const wide = (flags & 1) !== 0;
  const entryCount = uint32(payload, 4);
  if (entryCount > limits.maxIfdEntries) { warning(state.warnings, limits, { code: "LIMIT_EXCEEDED", message: "HEIF item-property association count exceeds the configured limit.", offset: 4 }); return; }
  let cursor = 8;
  for (let entryIndex = 0; entryIndex < entryCount; entryIndex += 1) {
    const idSize = version === 0 ? 2 : 4;
    if (cursor + idSize + 1 > payload.length) { warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF item-property association entry is truncated.", offset: cursor }); return; }
    const itemId = idSize === 2 ? uint16(payload, cursor) : uint32(payload, cursor);
    cursor += idSize;
    const associationCount = payload[cursor] ?? 0;
    cursor += 1;
    if (associationCount > limits.maxIfdEntries || cursor + associationCount * (wide ? 2 : 1) > payload.length) {
      warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF item-property association list is truncated or unsafe.", offset: cursor });
      return;
    }
    const indices: number[] = [];
    for (let associationIndex = 0; associationIndex < associationCount; associationIndex += 1) {
      const encoded = wide ? uint16(payload, cursor) : (payload[cursor] ?? 0);
      cursor += wide ? 2 : 1;
      const propertyIndex = wide ? encoded & 0x7fff : encoded & 0x7f;
      if (propertyIndex === 0) {
        warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF item-property association uses reserved property index zero.", offset: cursor - (wide ? 2 : 1) });
        continue;
      }
      indices.push(propertyIndex);
    }
    if (state.associations.has(itemId)) warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: `HEIF item ${itemId} has duplicate property-association entries.`, offset: cursor });
    else state.associations.set(itemId, indices);
  }
}

/** Read bounded `cdsc` ItemReferenceBox entries. A descriptive item points to
 * the image item it describes, so metadata selection uses the reverse lookup
 * from the primary image. */
function parseItemReferences(payload: Uint8Array, limits: SecurityLimits, state: ItemScanState): void {
  if (payload.length < 4) {
    warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF item-reference box is truncated.", offset: 0 });
    return;
  }
  const version = payload[0] ?? 0;
  const flags = ((payload[1] ?? 0) << 16) | ((payload[2] ?? 0) << 8) | (payload[3] ?? 0);
  if ((version !== 0 && version !== 1) || flags !== 0) {
    warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF item-reference version is unsupported.", offset: 0 });
    return;
  }
  const itemIdSize = version === 0 ? 2 : 4;
  let cursor = 4;
  while (cursor < payload.length) {
    if (state.boxBudget.remainingBoxes <= 0) {
      warning(state.warnings, limits, { code: "LIMIT_EXCEEDED", message: "HEIF item-reference box count exceeds the configured limit.", offset: cursor });
      return;
    }
    state.boxBudget.remainingBoxes -= 1;
    if (cursor > payload.length - 8) {
      warning(state.warnings, limits, { code: "TRUNCATED_DATA", message: "HEIF item-reference child box header is truncated.", offset: cursor });
      return;
    }
    const size32 = uint32(payload, cursor);
    const type = boxType(payload, cursor + 4);
    let header = 8;
    let size = size32;
    if (size32 === 1) {
      if (cursor > payload.length - 16) {
        warning(state.warnings, limits, { code: "TRUNCATED_DATA", message: "HEIF extended item-reference child box header is truncated.", offset: cursor });
        return;
      }
      const extended = uint64(payload, cursor + 8);
      if (extended === null) {
        warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF extended item-reference child box size is unsafe.", offset: cursor });
        return;
      }
      header = 16;
      size = extended;
    } else if (size32 === 0) {
      size = payload.length - cursor;
    }
    const end = cursor + size;
    if (!Number.isSafeInteger(end) || size < header || end > payload.length) {
      warning(state.warnings, limits, { code: "TRUNCATED_DATA", message: "HEIF item-reference child box extends beyond its parent.", offset: cursor, length: size });
      return;
    }
    if (type === "cdsc") {
      let referenceCursor = cursor + header;
      if (referenceCursor + itemIdSize + 2 > end) {
        warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF content-description reference is truncated.", offset: referenceCursor });
        return;
      }
      const fromItemId = itemIdSize === 2 ? uint16(payload, referenceCursor) : uint32(payload, referenceCursor);
      referenceCursor += itemIdSize;
      const count = uint16(payload, referenceCursor);
      referenceCursor += 2;
      if (count > limits.maxIfdEntries || referenceCursor + count * itemIdSize !== end) {
        warning(state.warnings, limits, { code: count > limits.maxIfdEntries ? "LIMIT_EXCEEDED" : "MALFORMED_HEIF", message: "HEIF content-description reference list is truncated or exceeds the configured limit.", offset: referenceCursor });
        return;
      }
      if (fromItemId === 0) {
        warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF content-description reference uses reserved item ID zero.", offset: cursor + header });
        return;
      }
      const targets = new Set<number>(state.descriptions.get(fromItemId) ?? []);
      for (let index = 0; index < count; index += 1) {
        const target = itemIdSize === 2 ? uint16(payload, referenceCursor) : uint32(payload, referenceCursor);
        referenceCursor += itemIdSize;
        if (target === 0) {
          warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF content-description reference uses reserved item ID zero.", offset: referenceCursor - itemIdSize });
          continue;
        }
        targets.add(target);
      }
      state.descriptions.set(fromItemId, targets);
    }
    cursor = end;
  }
}

function primaryDimensions(state: ItemScanState, limits: SecurityLimits): ImageDimensions | null {
  if (state.primaryItemId === null) return null;
  const associated = state.associations.get(state.primaryItemId);
  if (associated === undefined) return null;
  const dimensions = associated
    .map((index) => state.properties.get(index)?.dimensions)
    .filter((value): value is ImageDimensions => value !== undefined);
  if (dimensions.length === 0) return null;
  const first = dimensions[0];
  if (first === undefined) return null;
  if (dimensions.some(({ width, height }) => width !== first.width || height !== first.height)) {
    warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF primary item has conflicting spatial-extents.", offset: 0 });
    return null;
  }
  return first;
}

function primaryIccProfile(state: ItemScanState, limits: SecurityLimits): Uint8Array | null {
  if (state.primaryItemId === null) return null;
  const associated = state.associations.get(state.primaryItemId);
  if (associated === undefined) return null;
  const profiles = associated
    .map((index) => state.properties.get(index)?.icc)
    .filter((value): value is Uint8Array => value !== undefined);
  if (profiles.length <= 1) return profiles[0] ?? null;
  warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF primary item has multiple ICC colour profiles.", offset: 0 });
  return null;
}

function sameNclx(left: NclxColorData, right: NclxColorData): boolean {
  return left.colourPrimaries === right.colourPrimaries &&
    left.transferCharacteristics === right.transferCharacteristics &&
    left.matrixCoefficients === right.matrixCoefficients &&
    left.fullRange === right.fullRange;
}

function primaryNclx(state: ItemScanState, limits: SecurityLimits): NclxColorData | null {
  if (state.primaryItemId === null) return null;
  const associated = state.associations.get(state.primaryItemId);
  if (associated === undefined) return null;
  const values = associated
    .map((index) => state.properties.get(index)?.nclx)
    .filter((value): value is NclxColorData => value !== undefined);
  if (values.length === 0) return null;
  const first = values[0];
  if (first === undefined) return null;
  if (values.some((value) => !sameNclx(value, first))) {
    warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF primary item has conflicting nclx colour properties.", offset: 0 });
    return null;
  }
  return first;
}

function primaryTransform(state: ItemScanState, limits: SecurityLimits): ImageTransform | null {
  if (state.primaryItemId === null) return null;
  const associated = state.associations.get(state.primaryItemId);
  if (associated === undefined) return null;
  const transforms = associated.map((index) => state.properties.get(index)).filter((value): value is ItemProperty => value !== undefined);
  const rotations = transforms.map(({ rotation }) => rotation).filter((value): value is ImageTransform["rotation"] => value !== undefined);
  const mirrors = transforms.map(({ mirrorAxis }) => mirrorAxis).filter((value): value is "vertical" | "horizontal" => value !== undefined);
  if (rotations.length === 0 && mirrors.length === 0) return null;
  const rotation = rotations[0] ?? 0;
  const mirrorAxis = mirrors[0];
  if (rotations.some((value) => value !== rotation) || mirrors.some((value) => value !== mirrorAxis)) {
    warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF primary item has conflicting rotation or mirror properties.", offset: 0 });
    return null;
  }
  return { rotation, mirrored: mirrorAxis !== undefined, ...(mirrorAxis === undefined ? {} : { mirrorAxis }) };
}

function validatePropertyAssociations(state: ItemScanState, limits: SecurityLimits): void {
  for (const [itemId, indices] of state.associations) {
    for (const index of indices) {
      if (!state.properties.has(index)) {
        warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: `HEIF item ${itemId} references a missing item property ${index}.`, offset: 0 });
      }
    }
  }
}

function validateItemReferences(state: ItemScanState, limits: SecurityLimits): void {
  const known = new Set(state.infos.map(({ id }) => id));
  if (state.primaryItemId !== null) known.add(state.primaryItemId);
  for (const [source, targets] of state.descriptions) {
    if (!known.has(source)) {
      warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: `HEIF content-description reference has an unknown source item ${source}.`, offset: 0 });
    }
    for (const target of targets) {
      if (!known.has(target)) warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: `HEIF content-description reference has an unknown target item ${target}.`, offset: 0 });
    }
  }
}

function metadataItemIds(state: ItemScanState): ReadonlySet<number> | null {
  if (state.primaryItemId === null || state.descriptions.size === 0) return null;
  const associated = new Set<number>();
  for (const [itemId, targets] of state.descriptions) {
    if (targets.has(state.primaryItemId)) associated.add(itemId);
  }
  return associated.size > 0 ? associated : null;
}

function scanItemBoxes(bytes: Uint8Array, start: number, end: number, depth: number, limits: SecurityLimits, state: ItemScanState): void {
  if (depth > limits.maxIfdDepth) { warning(state.warnings, limits, { code: "LIMIT_EXCEEDED", message: "HEIF item box nesting exceeds the configured depth limit.", offset: start }); return; }
  let cursor = start;
  while (cursor < end) {
    if (state.boxBudget.remainingBoxes <= 0) { warning(state.warnings, limits, { code: "LIMIT_EXCEEDED", message: "HEIF item box count exceeds the configured limit.", offset: cursor }); return; }
    state.boxBudget.remainingBoxes -= 1;
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
    if (type === "pitm") {
      const primary = parsePrimaryItem(payload);
      if (primary === null) warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF primary-item box is malformed.", offset: payloadStart });
      else if (state.primaryItemId !== null) warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF metadata contains multiple primary-item boxes.", offset: payloadStart });
      else state.primaryItemId = primary;
    } else if (type === "iinf") {
      const parsed = parseItemInfos(payload, Math.max(0, limits.maxIfdEntries - state.infos.length), limits.maxStringBytes);
      if (parsed.malformed) warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF item-information box is malformed.", offset: payloadStart });
      if (parsed.limited) warning(state.warnings, limits, { code: "LIMIT_EXCEEDED", message: "HEIF item-information count exceeds the configured limit.", offset: payloadStart });
      for (const info of parsed.infos) {
        if (info.id === 0 || state.infos.some((existing) => existing.id === info.id)) {
          warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: `HEIF item information repeats or reserves item ID ${info.id}.`, offset: payloadStart });
        } else {
          state.infos.push(info);
        }
      }
    } else if (type === "iloc") {
      const parsed = parseItemLocations(payload, limits.maxIfdEntries, limits.maxSegments);
      if (parsed.malformed) warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF item-location box is malformed or uses unsupported field sizes.", offset: payloadStart });
      if (parsed.limited) warning(state.warnings, limits, { code: "LIMIT_EXCEEDED", message: "HEIF item-location count exceeds the configured limit.", offset: payloadStart });
      for (const [id, location] of parsed.locations) {
        if (state.locations.has(id)) warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: `HEIF item ${id} has duplicate item-location entries.`, offset: payloadStart });
        else state.locations.set(id, location);
      }
    } else if (type === "idat") {
      if (state.idat !== null) warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF metadata contains multiple idat boxes.", offset: payloadStart });
      else state.idat = payload;
    } else if (type === "ipco") {
      parsePropertyContainer(payload, limits, state);
    } else if (type === "ipma") {
      parsePropertyAssociations(payload, limits, state);
    } else if (type === "iref") {
      parseItemReferences(payload, limits, state);
    }
    if (type === "iprp") {
      if (state.itemPropertiesSeen) {
        warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF metadata contains multiple item-properties boxes.", offset: payloadStart });
      } else {
        state.itemPropertiesSeen = true;
        scanItemBoxes(bytes, payloadStart, boxEnd, depth + 1, limits, state);
      }
    } else if (CONTAINER_BOXES.has(type) && type !== "meta") {
      const childStart = type === "meta" ? payloadStart + 4 : payloadStart;
      if (childStart <= boxEnd && type !== "ipco") scanItemBoxes(bytes, childStart, boxEnd, depth + 1, limits, state);
    }
    cursor = boxEnd;
  }
}

interface MetaRange {
  readonly start: number;
  readonly end: number;
  readonly depth: number;
}

/**
 * Locate each MetaBox before interpreting item identifiers. Item IDs, iloc
 * locations, idat payloads, and property indexes are scoped to one MetaBox;
 * merging them across boxes could resolve metadata from the wrong source.
 */
function findMetaRanges(
  bytes: Uint8Array,
  start: number,
  end: number,
  depth: number,
  limits: SecurityLimits,
  budget: ScanBudget,
  warnings: MetadataWarning[],
  ranges: MetaRange[],
): void {
  if (depth > limits.maxIfdDepth) {
    warning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "HEIF MetaBox nesting exceeds the configured depth limit.", offset: start });
    return;
  }
  let cursor = start;
  while (cursor < end) {
    if (budget.remainingBoxes <= 0) {
      warning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "HEIF box count exceeds the configured limit.", offset: cursor });
      return;
    }
    if (cursor > end - 8) {
      warning(warnings, limits, { code: "TRUNCATED_DATA", message: "HEIF box header is truncated.", offset: cursor });
      return;
    }
    budget.remainingBoxes -= 1;
    const size32 = uint32(bytes, cursor);
    const type = boxType(bytes, cursor + 4);
    let header = 8;
    let size = size32;
    if (size32 === 1) {
      if (cursor > end - 16) {
        warning(warnings, limits, { code: "TRUNCATED_DATA", message: "HEIF extended box header is truncated.", offset: cursor });
        return;
      }
      const extended = uint64(bytes, cursor + 8);
      if (extended === null) {
        warning(warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF extended box size is unsafe.", offset: cursor });
        return;
      }
      size = extended;
      header = 16;
    } else if (size32 === 0) {
      size = end - cursor;
    }
    const boxEnd = cursor + size;
    if (!Number.isSafeInteger(boxEnd) || size < header || boxEnd > end) {
      warning(warnings, limits, { code: "TRUNCATED_DATA", message: "HEIF box extends beyond its parent.", offset: cursor, length: size });
      return;
    }
    const payloadStart = cursor + header;
    if (type === "meta") {
      const metaStart = payloadStart + 4;
      if (metaStart > boxEnd) {
        warning(warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF MetaBox is missing its full-box header.", offset: payloadStart });
      } else {
        ranges.push({ start: metaStart, end: boxEnd, depth: depth + 1 });
      }
    } else if (CONTAINER_BOXES.has(type) && type !== "ipco") {
      findMetaRanges(bytes, payloadStart, boxEnd, depth + 1, limits, budget, warnings, ranges);
    }
    cursor = boxEnd;
  }
}

interface ResolvedItem {
  readonly data: Uint8Array;
  /** Offset in the original file when the item is stored directly in mdat. */
  readonly sourceOffset?: number;
}

function resolveItem(
  bytes: Uint8Array,
  location: ItemLocation,
  idat: Uint8Array | null,
  limits: SecurityLimits,
  maxBytes: number,
): ResolvedItem | null {
  if (location.method !== 0 && location.method !== 1) return null;
  if (location.dataReferenceIndex !== 0 || location.extents.length === 0) return null;
  const source = location.method === 1 ? idat : bytes;
  if (source === null) return null;
  const parts: Uint8Array[] = [];
  let total = 0;
  for (const extent of location.extents) {
    const start = location.baseOffset + extent.offset;
    if (!Number.isSafeInteger(start) || start > source.length) return null;
    const length = extent.length === 0 ? source.length - start : extent.length;
    const end = start + length;
    const nextTotal = total + length;
    if (
      !Number.isSafeInteger(end) ||
      end > source.length ||
      length > limits.maxSegmentBytes ||
      !Number.isSafeInteger(nextTotal) ||
      nextTotal > limits.maxMetadataBytes ||
      nextTotal > maxBytes
    ) return null;
    parts.push(source.subarray(start, end));
    total = nextTotal;
  }
  const result = new Uint8Array(total);
  let cursor = 0;
  for (const part of parts) { result.set(part, cursor); cursor += part.length; }
  const firstExtent = location.extents[0];
  return { data: result, ...(location.method === 0 && firstExtent !== undefined ? { sourceOffset: location.baseOffset + firstExtent.offset } : {}) };
}

function inspectItemMetadata(bytes: Uint8Array, limits: SecurityLimits, maxMetadataBytes = limits.maxMetadataBytes): { exif: Uint8Array | null; exifOffset?: number; xmp: Uint8Array[]; dimensions: ImageDimensions | null; displayDimensions?: ImageDimensions; transform?: ImageTransform; icc: Uint8Array | null; nclx: NclxColorData | null; metadataBytes: number; warnings: readonly MetadataWarning[] } {
  const warnings: MetadataWarning[] = [];
  const boxBudget: ScanBudget = { remainingBoxes: limits.maxSegments };
  const ranges: MetaRange[] = [];
  findMetaRanges(bytes, 0, bytes.length, 0, limits, boxBudget, warnings, ranges);
  const states: ItemScanState[] = ranges.map((range) => {
    const state: ItemScanState = {
      infos: [],
      locations: new Map<number, ItemLocation>(),
      warnings,
      idat: null,
      boxBudget,
      primaryItemId: null,
      properties: new Map<number, ItemProperty>(),
      associations: new Map<number, readonly number[]>(),
      descriptions: new Map<number, ReadonlySet<number>>(),
      itemPropertiesSeen: false,
      propertyContainerSeen: false,
    };
    scanItemBoxes(bytes, range.start, range.end, range.depth, limits, state);
    validatePropertyAssociations(state, limits);
    validateItemReferences(state, limits);
    return state;
  });
  let itemData: Uint8Array | null = null;
  let itemDataOffset: number | undefined;
  const foundXmp: Uint8Array[] = [];
  let metadataBytes = 0;
  for (const state of states) {
    const associatedMetadataIds = metadataItemIds(state);
    for (const info of state.infos) {
      const isExif = info.type === "Exif";
      const isXmp = info.type === "mime" && info.contentType?.toLowerCase().includes("rdf+xml");
      if (!isExif && !isXmp) continue;
      if (associatedMetadataIds !== null && !associatedMetadataIds.has(info.id)) continue;
      const location = state.locations.get(info.id);
      if (location === undefined) {
        warning(warnings, limits, { code: "UNSAFE_OFFSET", message: `HEIF metadata item ${info.id} has no item-location entry.`, offset: 0 });
        continue;
      }
      const resolved = resolveItem(bytes, location, state.idat, limits, maxMetadataBytes - metadataBytes);
      if (resolved === null) {
        warning(warnings, limits, { code: "UNSAFE_OFFSET", message: `HEIF metadata item ${info.id} has an unsafe or unsupported extent.`, offset: 0 });
        continue;
      }
      metadataBytes += resolved.data.length;
      if (isExif) {
        if (itemData === null) { itemData = resolved.data; itemDataOffset = resolved.sourceOffset; }
        else warning(warnings, limits, { code: "DUPLICATE_EXIF", message: "A later HEIF Exif item was ignored.", offset: 0 });
      } else foundXmp.push(resolved.data);
    }
  }
  const dimensions = states.map((state) => primaryDimensions(state, limits)).filter((value): value is ImageDimensions => value !== null);
  const dimension = dimensions[0] ?? null;
  if (dimension !== null && dimensions.some(({ width, height }) => width !== dimension.width || height !== dimension.height)) {
    warning(warnings, limits, { code: "MALFORMED_HEIF", message: "Multiple HEIF MetaBoxes identify conflicting primary-item dimensions.", offset: 0 });
  }
  const profiles = states.map((state) => primaryIccProfile(state, limits)).filter((value): value is Uint8Array => value !== null);
  const profile = profiles[0] ?? null;
  if (profile !== null && profiles.some((candidate) => candidate.length !== profile.length || candidate.some((value, index) => value !== profile[index]))) {
    warning(warnings, limits, { code: "MALFORMED_HEIF", message: "Multiple HEIF MetaBoxes identify conflicting primary ICC profiles.", offset: 0 });
  }
  const nclxValues = states.map((state) => primaryNclx(state, limits)).filter((value): value is NclxColorData => value !== null);
  const nclx = nclxValues[0] ?? null;
  if (nclx !== null && nclxValues.some((candidate) => !sameNclx(candidate, nclx))) {
    warning(warnings, limits, { code: "MALFORMED_HEIF", message: "Multiple HEIF MetaBoxes identify conflicting primary nclx colour properties.", offset: 0 });
  }
  const transforms = states.map((state) => primaryTransform(state, limits)).filter((value): value is ImageTransform => value !== null);
  const transform = transforms[0] ?? null;
  if (transform !== null && transforms.some((candidate) => candidate.rotation !== transform.rotation || candidate.mirrored !== transform.mirrored || candidate.mirrorAxis !== transform.mirrorAxis)) {
    warning(warnings, limits, { code: "MALFORMED_HEIF", message: "Multiple HEIF MetaBoxes identify conflicting primary-item transforms.", offset: 0 });
  }
  const displayDimensions = dimension === null || transform === null
    ? null
    : (transform.rotation === 90 || transform.rotation === 270 ? { width: dimension.height, height: dimension.width } : dimension);
  return {
    exif: itemData,
    ...(itemDataOffset === undefined ? {} : { exifOffset: itemDataOffset }),
    xmp: foundXmp,
    dimensions: dimension !== null && dimensions.every(({ width, height }) => width === dimension.width && height === dimension.height) ? dimension : null,
    ...(displayDimensions === null ? {} : { displayDimensions }),
    ...(transform === null ? {} : { transform }),
    icc: profile !== null && profiles.every((candidate) => candidate.length === profile.length && candidate.every((value, index) => value === profile[index])) ? profile : null,
    nclx: nclx !== null && nclxValues.every((candidate) => sameNclx(candidate, nclx)) ? nclx : null,
    metadataBytes,
    warnings,
  };
}

/** Inspect bounded HEIF/AVIF metadata boxes and common Exif/XMP item locations. */
export function parseHeif(bytes: Uint8Array, limits: SecurityLimits, format: "heif" | "avif"): ParsedMetadataResult {
  const warnings: MetadataWarning[] = [];
  const fields: MetadataField[] = [];
  const xmpPackets: string[] = [];
  let exif: ExifData | null = null;
  let icc: ParsedMetadataResult["icc"] = null;
  let metadataBytes = 0;
  let boxCount = 0;
  const fallbackDimensions = parseHeifDimensions(bytes, limits.maxIfdDepth, limits.maxSegments);

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
          const tiff = extractHeifExifTiff(payload);
          if (tiff === null) {
            warning(warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF Exif payload has no valid TIFF header at its declared offset.", offset: payloadStart, length: payload.length });
          } else {
            const parsed = parseExif(tiff.tiff, limits, payloadStart + tiff.offset);
            for (const item of parsed.warnings) warning(warnings, limits, item);
            if (parsed.exif !== null) {
              const thumbnail = extractExifThumbnail(tiff.tiff, parsed.exif, limits);
              exif = thumbnail === null ? parsed.exif : { ...parsed.exif, thumbnail };
              fields.push(...parsed.fields);
            }
          }
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
  const itemMetadata = inspectItemMetadata(bytes, limits, Math.max(0, limits.maxMetadataBytes - metadataBytes));
  for (const item of itemMetadata.warnings) warning(warnings, limits, item);
  if (itemMetadata.exif !== null && !isPresent(exif)) {
    const payload = itemMetadata.exif;
    const tiff = extractHeifExifTiff(payload);
    if (tiff === null) {
      warning(warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF Exif item has no valid TIFF header at its declared offset.", offset: 0, length: payload.length });
    } else {
      const parsed = parseExif(tiff.tiff, limits, (itemMetadata.exifOffset ?? 0) + tiff.offset);
      for (const item of parsed.warnings) warning(warnings, limits, item);
      if (parsed.exif !== null) {
        const thumbnail = extractExifThumbnail(tiff.tiff, parsed.exif, limits);
        exif = thumbnail === null ? parsed.exif : { ...parsed.exif, thumbnail };
        fields.push(...parsed.fields);
      }
    }
  }
  for (const packetBytes of itemMetadata.xmp) {
    const packet = packetBytes.length <= limits.maxStringBytes ? decodeUtf8(packetBytes) : null;
    if (packet === null) warning(warnings, limits, { code: "INVALID_VALUE", message: "HEIF item XMP payload is invalid UTF-8 or exceeds the configured string limit.", length: packetBytes.length });
    else xmpPackets.push(packet);
  }
  if (itemMetadata.icc !== null) {
    if (itemMetadata.icc.length > limits.maxSegmentBytes) {
      warning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "HEIF ICC profile exceeds the configured segment limit.", length: itemMetadata.icc.length });
    } else {
      const remainingMetadataBytes = Math.max(0, limits.maxMetadataBytes - metadataBytes - itemMetadata.metadataBytes);
      const inspected = inspectIccProfile(
        [{ sequence: 1, total: 1, byteLength: itemMetadata.icc.length, data: itemMetadata.icc } satisfies IccChunk],
        { ...limits, maxMetadataBytes: remainingMetadataBytes },
      );
      icc = inspected.data;
      for (const field of inspected.fields) {
        if (fields.length >= limits.maxIfdEntries) break;
        fields.push(field);
      }
      for (const item of inspected.warnings) warning(warnings, limits, item);
    }
  }
  if (bytes.length < 16 || ascii(bytes, 4) !== "ftyp") warningError(warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF/AVIF input has no valid ftyp box.", offset: 0 });
  const storedDimensions = itemMetadata.dimensions ?? fallbackDimensions;
  return {
    format,
    mimeType: format === "avif" ? "image/avif" : "image/heif",
    dimensions: storedDimensions,
    ...(itemMetadata.displayDimensions === undefined ? {} : { displayDimensions: itemMetadata.displayDimensions }),
    ...(itemMetadata.transform === undefined ? {} : { transform: itemMetadata.transform }),
    ...(itemMetadata.nclx === null ? {} : { nclx: itemMetadata.nclx }),
    fields,
    exif,
    xmp: xmpPackets.length > 0 ? { packets: xmpPackets } : null,
    iptc: null,
    icc,
    jfif: null,
    pngText: [],
    warnings,
  };
}
