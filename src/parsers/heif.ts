import { parseExif } from "../metadata/exif.js";
import { inspectIccProfile, type IccChunk } from "../metadata/icc.js";
import { parseXmpPacket } from "../metadata/xmp.js";
import { extractExifThumbnail } from "../metadata/thumbnail.js";
import { wantsGroup, type ResolvedSelection } from "../selection.js";
import { throwIfAborted } from "../security/abort.js";
import { parseHeifSequences } from "../heif-sequences.js";
import type { ExifData, HeifDataReference, HeifItemConstructionMode, HeifItemExtent, HeifItemGraph, HeifItemLocation as PublicHeifItemLocation, HeifItemProperty, HeifItemPropertyReference, HeifItemRelationship, ImageDimensions, ImageTransform, MetadataBlock, MetadataField, NclxColorData, ParsedMetadataResult, MetadataWarning, SecurityLimits } from "../types.js";
import type { MetadataRegistry } from "../registry.js";

const CONTAINER_BOXES = new Set(["meta", "iprp", "ipco", "dinf", "moov", "trak", "mdia", "minf", "stbl"]);

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
  signal?: AbortSignal,
): boolean {
  throwIfAborted(signal);
  if (depth > maxDepth) return false;
  let cursor = start;
  while (cursor < end) {
    throwIfAborted(signal);
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
      if (childStart > boxEnd || !scanBoxes(bytes, childStart, boxEnd, depth + 1, maxDepth, budget, found, signal)) return false;
    }
    cursor = boxEnd;
  }
  return cursor === end;
}

/** Returns dimensions only when every discovered image-spatial property agrees. */
export function parseHeifDimensions(bytes: Uint8Array, maxDepth = 8, maxBoxes = 4096, signal?: AbortSignal): ImageDimensions | null {
  throwIfAborted(signal);
  if (!Number.isSafeInteger(maxDepth) || maxDepth < 0 || !Number.isSafeInteger(maxBoxes) || maxBoxes < 1) {
    return null;
  }
  const found: ImageDimensions[] = [];
  const budget: ScanBudget = { remainingBoxes: maxBoxes };
  if (!scanBoxes(bytes, 0, bytes.length, 0, maxDepth, budget, found, signal) || found.length === 0) return null;
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

interface ItemInfo {
  readonly id: number;
  readonly type: string;
  readonly name: string;
  readonly contentType?: string;
  readonly contentEncoding?: string;
  readonly hidden: boolean;
}
interface ItemLocation {
  readonly method: number;
  readonly dataReferenceIndex: number;
  readonly baseOffset: number;
  readonly extents: readonly { index: number | null; offset: number; length: number }[];
}
interface ParsedItemInfos {
  readonly infos: readonly ItemInfo[];
  readonly malformed: boolean;
  readonly limited: boolean;
}
interface ParsedDataReference {
  readonly index: number;
  readonly type: "url" | "urn" | "unknown";
  readonly selfContained: boolean;
  readonly resolvable: boolean;
  readonly sourceOffset: number;
  readonly byteLength: number;
}
interface ItemReference {
  readonly type: string;
  readonly from: number;
  readonly targets: readonly number[];
  readonly sourceOffset: number;
  readonly byteLength: number;
}
interface ItemProperty {
  readonly type?: string;
  readonly sourceOffset?: number;
  readonly byteLength?: number;
  readonly dimensions?: ImageDimensions;
  readonly icc?: Uint8Array;
  readonly nclx?: NclxColorData;
  readonly rotation?: ImageTransform["rotation"];
  readonly mirrorAxis?: "vertical" | "horizontal";
  readonly auxiliaryType?: string;
  readonly auxiliarySubtypes?: readonly number[];
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
      const itemFlags = ((payload[data + 1] ?? 0) << 16) | ((payload[data + 2] ?? 0) << 8) | (payload[data + 3] ?? 0);
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
      let contentEncoding: string | undefined;
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
          const parsedEncoding = asciiValue(encoding.value);
          if (parsedEncoding === null) return { infos, malformed: true, limited: count > maxItems };
          contentEncoding = parsedEncoding;
        }
      }
      const decodedName = decodeUtf8(itemName.value);
      if (decodedName === null) return { infos, malformed: true, limited: count > maxItems };
      infos.push({
        id: itemId,
        type: itemType,
        name: decodedName,
        hidden: (itemFlags & 1) !== 0,
        ...(contentType === undefined ? {} : { contentType }),
        ...(contentEncoding === undefined ? {} : { contentEncoding }),
      });
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
    const extents: Array<{ index: number | null; offset: number; length: number }> = [];
    for (let extentIndex = 0; extentIndex < extentCount; extentIndex += 1) {
      let indexValue: number | null = null;
      if (indexSize > 0) {
        const index = sizedInteger(payload, cursor, indexSize);
        if (index === null) return { locations, malformed: true, limited: itemCount > maxItems };
        cursor = index.next;
        if (index.value === 0) return { locations, malformed: true, limited: itemCount > maxItems };
        indexValue = index.value;
      }
      const offset = sizedInteger(payload, cursor, offsetSize);
      if (offset === null) return { locations, malformed: true, limited: itemCount > maxItems };
      cursor = offset.next;
      const length = sizedInteger(payload, cursor, lengthSize);
      if (length === null) return { locations, malformed: true, limited: itemCount > maxItems };
      cursor = length.next;
      extents.push({ index: indexValue, offset: offset.value, length: length.value });
    }
    if (locations.has(itemId)) malformed = true;
    else locations.set(itemId, { method, dataReferenceIndex, baseOffset: base.value, extents });
  }
  return { locations, malformed: malformed || (itemCount <= maxItems && cursor !== payload.length), limited: itemCount > maxItems };
}

function parseDataReferences(payload: Uint8Array, sourceOffset: number, limits: SecurityLimits): { references: ParsedDataReference[]; malformed: boolean; limited: boolean } {
  const references: ParsedDataReference[] = [];
  if (payload.length < 8) return { references, malformed: true, limited: false };
  const version = payload[0] ?? 0;
  if (version !== 0) return { references, malformed: true, limited: false };
  const count = uint32(payload, 4);
  if (count > limits.maxIfdEntries) return { references, malformed: false, limited: true };
  let cursor = 8;
  for (let index = 1; index <= count; index += 1) {
    if (cursor > payload.length - 8) return { references, malformed: true, limited: false };
    const size32 = uint32(payload, cursor);
    const type = boxType(payload, cursor + 4);
    const size = size32 === 0 ? payload.length - cursor : size32;
    const end = cursor + size;
    if (size < 12 || !Number.isSafeInteger(end) || end > payload.length) return { references, malformed: true, limited: false };
    const flags = ((payload[cursor + 9] ?? 0) << 16) | ((payload[cursor + 10] ?? 0) << 8) | (payload[cursor + 11] ?? 0);
    const knownType = type === "url " || type === "urn ";
    const selfContained = knownType && (flags & 1) !== 0;
    references.push({
      index,
      type: type === "url " ? "url" : type === "urn " ? "urn" : "unknown",
      selfContained,
      resolvable: selfContained,
      sourceOffset: sourceOffset + cursor,
      byteLength: size,
    });
    cursor = end;
  }
  return { references, malformed: cursor !== payload.length, limited: false };
}

interface ItemScanState {
  metaStart: number;
  infos: ItemInfo[];
  locations: Map<number, ItemLocation>;
  warnings: MetadataWarning[];
  idat: Uint8Array | null;
  idatOffset: number | null;
  boxBudget: ScanBudget;
  primaryItemId: number | null;
  properties: Map<number, ItemProperty>;
  associations: Map<number, readonly number[]>;
  associationDetails: Map<number, readonly HeifItemPropertyReference[]>;
  /** `cdsc` references from a metadata item to the item it describes. */
  descriptions: Map<number, ReadonlySet<number>>;
  references: ItemReference[];
  dataReferences: Map<number, ParsedDataReference>;
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

function signed16(bytes: Uint8Array, offset: number): number {
  const value = uint16(bytes, offset);
  return value >= 0x8000 ? value - 0x10000 : value;
}

function signed32(bytes: Uint8Array, offset: number): number {
  const value = uint32(bytes, offset);
  return value >= 0x80000000 ? value - 0x100000000 : value;
}

function parseAuxiliaryProperty(payload: Uint8Array, maxStringBytes: number): { readonly type: string; readonly subtypes: readonly number[] } | null {
  if (payload.length < 5) return null;
  const value = readNullTerminated(payload, 4, payload.length, maxStringBytes);
  if (value === null) return null;
  const type = decodeUtf8(value.value);
  if (type === null || type.length === 0) return null;
  const remaining = payload.length - value.next;
  if (remaining % 4 !== 0 || remaining / 4 > 1024) return null;
  const subtypes: number[] = [];
  for (let cursor = value.next; cursor < payload.length; cursor += 4) subtypes.push(uint32(payload, cursor));
  return { type, subtypes };
}

interface DerivedDescriptor {
  readonly type: "grid" | "overlay" | "identity" | "unknown";
  readonly outputWidth: number | null;
  readonly outputHeight: number | null;
  readonly rows?: number;
  readonly columns?: number;
  readonly referenceCount: number;
  readonly offsets?: readonly { readonly horizontal: number; readonly vertical: number }[];
}

function parseDerivedDescriptor(itemType: string, payload: Uint8Array, referenceCount: number): DerivedDescriptor | null {
  if (itemType === "iden") return { type: "identity", outputWidth: null, outputHeight: null, referenceCount };
  if (itemType === "grid") {
    if (payload.length < 8) return null;
    const version = payload[0] ?? 0;
    const flags = payload[1] ?? 0;
    if (version !== 0 || (flags & 0xfe) !== 0) return null;
    const rows = (payload[2] ?? 0) + 1;
    const columns = (payload[3] ?? 0) + 1;
    const wide = (flags & 1) !== 0;
    const fieldBytes = wide ? 4 : 2;
    if (payload.length !== 4 + fieldBytes * 2) return null;
    const outputWidth = wide ? uint32(payload, 4) : uint16(payload, 4);
    const outputHeight = wide ? uint32(payload, 4 + fieldBytes) : uint16(payload, 4 + fieldBytes);
    const expectedCount = rows * columns;
    if (outputWidth === 0 || outputHeight === 0 || expectedCount !== referenceCount) return null;
    return { type: "grid", outputWidth, outputHeight, rows, columns, referenceCount };
  }
  if (itemType === "iovl") {
    if (payload.length < 10 || referenceCount > 4096) return null;
    const version = payload[0] ?? 0;
    const flags = payload[1] ?? 0;
    if (version !== 0 || (flags & 0xfe) !== 0) return null;
    const fieldBytes = (flags & 1) !== 0 ? 4 : 2;
    const expectedLength = 10 + fieldBytes * 2 + referenceCount * fieldBytes * 2;
    if (payload.length !== expectedLength) return null;
    const outputWidth = fieldBytes === 4 ? uint32(payload, 10) : uint16(payload, 10);
    const outputHeight = fieldBytes === 4 ? uint32(payload, 10 + fieldBytes) : uint16(payload, 10 + fieldBytes);
    if (outputWidth === 0 || outputHeight === 0) return null;
    const offsets: Array<{ horizontal: number; vertical: number }> = [];
    let cursor = 10 + fieldBytes * 2;
    for (let index = 0; index < referenceCount; index += 1) {
      offsets.push({
        horizontal: fieldBytes === 4 ? signed32(payload, cursor) : signed16(payload, cursor),
        vertical: fieldBytes === 4 ? signed32(payload, cursor + fieldBytes) : signed16(payload, cursor + fieldBytes),
      });
      cursor += fieldBytes * 2;
    }
    return { type: "overlay", outputWidth, outputHeight, referenceCount, offsets };
  }
  return { type: "unknown", outputWidth: null, outputHeight: null, referenceCount };
}

function parsePropertyContainer(payload: Uint8Array, sourceOffset: number, limits: SecurityLimits, state: ItemScanState): void {
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
    const auxiliary = type === "auxC" ? parseAuxiliaryProperty(propertyPayload, limits.maxStringBytes) : null;
    if (type === "auxC" && auxiliary === null) warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF auxiliary-type property is malformed.", offset: cursor + 8 });
    if (colour?.malformed === true) {
      warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF nclx colour property is truncated or has reserved range bits.", offset: cursor + 8 });
    }
    const rotation = type === "irot" && propertyPayload.length >= 1 ? (((propertyPayload[0] ?? 0) & 0x03) * 90) as ImageTransform["rotation"] : undefined;
    const mirrorAxis = type === "imir" && propertyPayload.length >= 1 ? ((propertyPayload[0] ?? 0) & 0x01) === 0 ? "vertical" as const : "horizontal" as const : undefined;
    state.properties.set(index, {
      type,
      sourceOffset: sourceOffset + cursor,
      byteLength: size,
      ...(dimensions === null ? {} : { dimensions }),
      ...(colour?.icc === undefined ? {} : { icc: colour.icc }),
      ...(colour?.nclx === undefined ? {} : { nclx: colour.nclx }),
      ...(rotation === undefined ? {} : { rotation }),
      ...(mirrorAxis === undefined ? {} : { mirrorAxis }),
      ...(auxiliary === null ? {} : { auxiliaryType: auxiliary.type, auxiliarySubtypes: auxiliary.subtypes }),
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
    const details: HeifItemPropertyReference[] = [];
    for (let associationIndex = 0; associationIndex < associationCount; associationIndex += 1) {
      const encoded = wide ? uint16(payload, cursor) : (payload[cursor] ?? 0);
      cursor += wide ? 2 : 1;
      const propertyIndex = wide ? encoded & 0x7fff : encoded & 0x7f;
      if (propertyIndex === 0) {
        warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF item-property association uses reserved property index zero.", offset: cursor - (wide ? 2 : 1) });
        continue;
      }
      indices.push(propertyIndex);
      details.push({ propertyIndex, essential: wide ? (encoded & 0x8000) !== 0 : (encoded & 0x80) !== 0 });
    }
    if (state.associations.has(itemId)) warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: `HEIF item ${itemId} has duplicate property-association entries.`, offset: cursor });
    else {
      state.associations.set(itemId, indices);
      state.associationDetails.set(itemId, details);
    }
  }
}

/** Read bounded SingleItemTypeReferenceBox entries while retaining every
 * reference type and its declaration order. */
function parseItemReferences(payload: Uint8Array, sourceOffset: number, limits: SecurityLimits, state: ItemScanState): void {
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
    let referenceCursor = cursor + header;
    if (referenceCursor + itemIdSize + 2 > end) {
      warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: `HEIF ${type} item reference is truncated.`, offset: referenceCursor });
      return;
    }
    const fromItemId = itemIdSize === 2 ? uint16(payload, referenceCursor) : uint32(payload, referenceCursor);
    referenceCursor += itemIdSize;
    const count = uint16(payload, referenceCursor);
    referenceCursor += 2;
    if (count > limits.maxIfdEntries || referenceCursor + count * itemIdSize !== end) {
      warning(state.warnings, limits, { code: count > limits.maxIfdEntries ? "LIMIT_EXCEEDED" : "MALFORMED_HEIF", message: `HEIF ${type} item reference list is truncated or exceeds the configured limit.`, offset: referenceCursor });
      return;
    }
    if (fromItemId === 0) {
      warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: `HEIF ${type} reference uses reserved item ID zero.`, offset: cursor + header });
      return;
    }
    const targets: number[] = [];
    for (let index = 0; index < count; index += 1) {
      const target = itemIdSize === 2 ? uint16(payload, referenceCursor) : uint32(payload, referenceCursor);
      referenceCursor += itemIdSize;
      if (target === 0) {
        warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: `HEIF ${type} reference uses reserved item ID zero.`, offset: referenceCursor - itemIdSize });
      } else if (targets.length < limits.maxIfdEntries) targets.push(target);
    }
    const reference: ItemReference = { type, from: fromItemId, targets, sourceOffset: sourceOffset + cursor, byteLength: end - cursor };
    state.references.push(reference);
    if (type === "cdsc") {
      const described = new Set<number>(state.descriptions.get(fromItemId) ?? []);
      for (const target of targets) described.add(target);
      state.descriptions.set(fromItemId, described);
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
  for (const reference of state.references) {
    if (!known.has(reference.from)) warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: `HEIF ${reference.type} reference has an unknown source item ${reference.from}.`, offset: reference.sourceOffset });
    for (const target of reference.targets) {
      if (!known.has(target)) warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: `HEIF ${reference.type} reference has an unknown target item ${target}.`, offset: reference.sourceOffset });
    }
  }
  for (const [itemId, location] of state.locations) {
    if (location.method === 2 && !state.references.some((reference) => reference.type === "iloc" && reference.from === itemId)) {
      warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: `HEIF item ${itemId} uses item-offset construction without an iloc reference.`, offset: state.metaStart });
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
      else { state.idat = payload; state.idatOffset = payloadStart; }
    } else if (type === "dref") {
      const parsed = parseDataReferences(payload, payloadStart, limits);
      if (parsed.malformed) warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF data-reference box is malformed.", offset: payloadStart });
      if (parsed.limited) warning(state.warnings, limits, { code: "LIMIT_EXCEEDED", message: "HEIF data-reference count exceeds the configured limit.", offset: payloadStart });
      for (const reference of parsed.references) {
        if (state.dataReferences.has(reference.index)) warning(state.warnings, limits, { code: "MALFORMED_HEIF", message: `HEIF data-reference index ${reference.index} is duplicated.`, offset: reference.sourceOffset });
        else state.dataReferences.set(reference.index, reference);
      }
    } else if (type === "ipco") {
      parsePropertyContainer(payload, payloadStart, limits, state);
    } else if (type === "ipma") {
      parsePropertyAssociations(payload, limits, state);
    } else if (type === "iref") {
      parseItemReferences(payload, payloadStart, limits, state);
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

interface MetadataItemProvenance {
  readonly id: number;
  readonly family: "EXIF" | "XMP";
  readonly sourceOffset?: number;
  readonly byteLength: number;
  readonly associatedImage: string | null;
}

interface MetadataPropertyProvenance {
  readonly index: number;
  readonly type: string;
  readonly sourceOffset: number;
  readonly byteLength: number;
  readonly associatedImage: string;
}

function resolveItem(
  bytes: Uint8Array,
  state: ItemScanState,
  itemId: number,
  location: ItemLocation,
  limits: SecurityLimits,
  maxBytes: number,
  stack: ReadonlySet<number> = new Set<number>(),
): ResolvedItem | null {
  if (stack.has(itemId) || location.extents.length === 0) return null;
  const nextStack = new Set(stack);
  nextStack.add(itemId);
  const parts: Uint8Array[] = [];
  let total = 0;
  let firstSourceOffset: number | undefined;
  for (const extent of location.extents) {
    if (location.extents.length > 1 && extent.length === 0) return null;
    let source: Uint8Array;
    if (location.method === 2) {
      if (location.dataReferenceIndex !== 0) return null;
      const targetIndex = extent.index ?? 1;
      const targetId = itemOffsetTarget(state, itemId, targetIndex);
      if (targetId === null) return null;
      const targetLocation = state.locations.get(targetId);
      if (targetLocation === undefined) return null;
      const resolvedTarget = resolveItem(bytes, state, targetId, targetLocation, limits, maxBytes - total, nextStack);
      if (resolvedTarget === null) return null;
      source = resolvedTarget.data;
      const start = location.baseOffset + extent.offset;
      if (!Number.isSafeInteger(start) || start > source.length) return null;
      const length = extent.length === 0 ? source.length - start : extent.length;
      const end = start + length;
      const nextTotal = total + length;
      if (!Number.isSafeInteger(end) || end > source.length || length > limits.maxSegmentBytes || !Number.isSafeInteger(nextTotal) || nextTotal > limits.maxMetadataBytes || nextTotal > maxBytes) return null;
      parts.push(source.subarray(start, end));
      total = nextTotal;
      continue;
    }
    if (location.method !== 0 && location.method !== 1) return null;
    if (location.method === 1 && location.dataReferenceIndex !== 0) return null;
    if (location.method === 0 && location.dataReferenceIndex !== 0 && state.dataReferences.get(location.dataReferenceIndex)?.resolvable !== true) return null;
    source = location.method === 1 ? state.idat ?? new Uint8Array() : bytes;
    const sourceBase = location.method === 1 ? state.idatOffset ?? 0 : 0;
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
    const sourceOffset = sourceBase + start;
    if (firstSourceOffset === undefined) firstSourceOffset = sourceOffset;
    total = nextTotal;
  }
  const result = new Uint8Array(total);
  let cursor = 0;
  for (const part of parts) { result.set(part, cursor); cursor += part.length; }
  return { data: result, ...(firstSourceOffset === undefined ? {} : { sourceOffset: firstSourceOffset }) };
}

function constructionMode(method: number): HeifItemConstructionMode {
  if (method === 0) return "file";
  if (method === 1) return "idat";
  if (method === 2) return "item-offset";
  return "unsupported";
}

function safeAdd(left: number, right: number): number | null {
  const value = left + right;
  return Number.isSafeInteger(value) && value >= left ? value : null;
}

function itemOffsetTarget(state: ItemScanState, itemId: number, index: number | null): number | null {
  const targets = state.references.filter((candidate) => candidate.type === "iloc" && candidate.from === itemId).flatMap(({ targets: values }) => values);
  const target = targets[(index ?? 1) - 1];
  return target === undefined ? null : target;
}

function measureItem(
  bytes: Uint8Array,
  state: ItemScanState,
  itemId: number,
  stack: ReadonlySet<number> = new Set<number>(),
): number | null {
  if (stack.has(itemId)) return null;
  const location = state.locations.get(itemId);
  if (location === undefined || location.extents.length === 0) return location?.extents.length === 0 ? 0 : null;
  if (location.method === 2) {
    if (location.dataReferenceIndex !== 0) return null;
    const nextStack = new Set(stack); nextStack.add(itemId);
    let total = 0;
    for (const extent of location.extents) {
      const targetId = itemOffsetTarget(state, itemId, extent.index);
      if (targetId === null) return null;
      const targetLength = measureItem(bytes, state, targetId, nextStack);
      if (targetLength === null) return null;
      const start = safeAdd(location.baseOffset, extent.offset);
      if (start === null || start > targetLength) return null;
      const length = extent.length === 0 ? targetLength - start : extent.length;
      const end = safeAdd(start, length);
      const nextTotal = safeAdd(total, length);
      if (end === null || end > targetLength || nextTotal === null) return null;
      total = nextTotal;
    }
    return total;
  }
  if (location.method !== 0 && location.method !== 1) return null;
  if (location.method === 1 && location.dataReferenceIndex !== 0) return null;
  if (location.method === 0 && location.dataReferenceIndex !== 0 && state.dataReferences.get(location.dataReferenceIndex)?.resolvable !== true) return null;
  const sourceLength = location.method === 1 ? state.idat?.length : bytes.length;
  if (sourceLength === undefined) return null;
  let total = 0;
  for (const extent of location.extents) {
    const start = safeAdd(location.baseOffset, extent.offset);
    if (start === null || start > sourceLength) return null;
    if (location.extents.length > 1 && extent.length === 0) return null;
    const length = extent.length === 0 ? sourceLength - start : extent.length;
    const end = safeAdd(start, length);
    const nextTotal = safeAdd(total, length);
    if (end === null || end > sourceLength || nextTotal === null) return null;
    total = nextTotal;
  }
  return total;
}

function publicDataReference(reference: ParsedDataReference | undefined): HeifDataReference | null {
  if (reference === undefined) return null;
  return reference;
}

function publicLocation(bytes: Uint8Array, state: ItemScanState, itemId: number, location: ItemLocation): PublicHeifItemLocation {
  const mode = constructionMode(location.method);
  const dataReference = publicDataReference(state.dataReferences.get(location.dataReferenceIndex));
  const external = location.dataReferenceIndex !== 0 && dataReference?.resolvable !== true;
  const resolvedByteLength = external || mode === "unsupported" ? null : measureItem(bytes, state, itemId);
  const resolution: PublicHeifItemLocation["resolution"] = location.extents.length === 0
    ? "empty"
    : external
      ? "external"
      : mode === "unsupported"
        ? "unsupported"
        : resolvedByteLength === null
          ? "malformed"
          : "resolved";
  const extents: HeifItemExtent[] = location.extents.map((extent) => {
    const sourceItemId = mode === "item-offset" ? itemOffsetTarget(state, itemId, extent.index) : null;
    const relativeOffset = safeAdd(location.baseOffset, extent.offset);
    const absoluteOffset = mode === "file"
      ? relativeOffset
      : mode === "idat" && state.idatOffset !== null && relativeOffset !== null
        ? safeAdd(state.idatOffset, relativeOffset)
        : null;
    return {
      index: extent.index,
      offset: extent.offset,
      length: extent.length,
      source: mode,
      absoluteOffset,
      sourceItemId,
      resolved: resolution === "resolved",
    };
  });
  return {
    constructionMethod: mode,
    dataReferenceIndex: location.dataReferenceIndex,
    dataReference,
    baseOffset: location.baseOffset,
    extents,
    resolvedByteLength,
    resolution,
  };
}

function relationshipType(type: string, sourceInfo: ItemInfo | undefined): HeifItemRelationship["type"] {
  if (type === "thmb") return "thumbnail";
  if (type === "auxl") return "auxiliary";
  if (type === "cdsc") return "describes";
  if (type === "iloc") return "item-offset";
  if (type === "dimg") return sourceInfo?.type === "iovl" ? "overlay-input" : "derived";
  return "unknown";
}

function buildItemGraph(bytes: Uint8Array, state: ItemScanState, limits: SecurityLimits): HeifItemGraph {
  const infoById = new Map(state.infos.map((info) => [info.id, info]));
  const essentialPropertyIndices = new Set(
    [...state.associationDetails.values()]
      .flatMap((references) => references)
      .filter(({ essential }) => essential)
      .map(({ propertyIndex }) => propertyIndex),
  );
  const itemIds = [...new Set([
    ...state.infos.map(({ id }) => id),
    ...state.locations.keys(),
    ...state.associations.keys(),
    ...state.references.flatMap(({ from, targets }) => [from, ...targets]),
    ...(state.primaryItemId === null ? [] : [state.primaryItemId]),
  ])].slice(0, limits.maxIfdEntries);
  const relationships: HeifItemRelationship[] = [];
  for (const reference of state.references) {
    for (let index = 0; index < reference.targets.length && relationships.length < limits.maxImageDetailRelationships; index += 1) {
      const targetItemId = reference.targets[index];
      if (targetItemId === undefined) continue;
      relationships.push({
        type: relationshipType(reference.type, infoById.get(reference.from)),
        referenceType: reference.type,
        sourceItemId: reference.from,
        targetItemId,
        order: index,
        sourceOffset: reference.sourceOffset,
        byteLength: reference.byteLength,
      });
    }
  }
  const properties = [...state.properties.entries()].slice(0, limits.maxIfdEntries).map(([index, property]): HeifItemProperty => ({
    index,
    type: property.type ?? "unknown",
    essential: essentialPropertyIndices.has(index),
    sourceOffset: property.sourceOffset ?? state.metaStart,
    byteLength: property.byteLength ?? 0,
    ...(property.dimensions === undefined ? {} : { dimensions: property.dimensions }),
    ...(property.auxiliaryType === undefined ? {} : { auxiliaryType: property.auxiliaryType }),
    ...(property.auxiliarySubtypes === undefined ? {} : { auxiliarySubtypes: property.auxiliarySubtypes }),
  }));
  const items = itemIds.map((id) => {
    const info = infoById.get(id) ?? { id, type: "unknown", name: "", hidden: false };
    const referencesForItem = state.associationDetails.get(info.id) ?? [];
    const dimensions = referencesForItem.map(({ propertyIndex }) => state.properties.get(propertyIndex)?.dimensions).find((value): value is ImageDimensions => value !== undefined) ?? null;
    const locationValue = state.locations.get(info.id);
    const location = locationValue === undefined ? null : publicLocation(bytes, state, info.id, locationValue);
    if (location !== null && location.resolution !== "resolved" && location.resolution !== "empty") {
      warning(state.warnings, limits, { code: location.resolution === "malformed" ? "MALFORMED_HEIF" : "UNSAFE_OFFSET", message: `HEIF item ${info.id} location is ${location.resolution} and was not resolved.`, offset: state.metaStart });
    }
    const outgoing = relationships.filter(({ sourceItemId }) => sourceItemId === info.id);
    const roles: Array<"primary" | "thumbnail" | "auxiliary" | "derived" | "metadata" | "unknown"> = [];
    if (info.id === state.primaryItemId) roles.push("primary");
    if (outgoing.some(({ type }) => type === "thumbnail")) roles.push("thumbnail");
    if (outgoing.some(({ type }) => type === "auxiliary")) roles.push("auxiliary");
    if (info.type === "grid" || info.type === "iovl" || info.type === "iden") roles.push("derived");
    if (info.type === "Exif" || info.type === "mime") roles.push("metadata");
    if (roles.length === 0) roles.push("unknown");
    const referenceCount = relationships.filter(({ sourceItemId, referenceType }) => sourceItemId === info.id && (referenceType === "dimg" || referenceType === "iovl")).length;
    let derived: HeifItemGraph["items"][number]["derived"];
    if (info.type === "grid" || info.type === "iovl" || info.type === "iden") {
      const descriptor = info.type === "iden"
        ? { data: new Uint8Array(0) }
        : locationValue === undefined ? null : resolveItem(bytes, state, info.id, locationValue, limits, Math.min(limits.maxValueBytes, limits.maxMetadataBytes));
      const parsed = descriptor === null ? null : parseDerivedDescriptor(info.type, descriptor.data, referenceCount);
      if (parsed !== null) derived = parsed;
      else warning(state.warnings, limits, { code: descriptor === null ? "UNSAFE_OFFSET" : "MALFORMED_HEIF", message: `HEIF ${info.type} derived-item descriptor is missing or malformed.`, offset: state.metaStart });
    }
    return {
      id: info.id,
      type: info.type,
      name: info.name,
      contentType: info.contentType ?? null,
      contentEncoding: info.contentEncoding ?? null,
      hidden: info.hidden,
      location,
      properties: referencesForItem,
      dimensions,
      ...(derived === undefined ? {} : { derived }),
      roles,
    };
  });
  const complete = !state.warnings.some((item) => item.severity === "error" || item.code === "MALFORMED_HEIF" || item.code === "UNSAFE_OFFSET" || item.code === "LIMIT_EXCEEDED" || item.code === "TRUNCATED_DATA");
  return {
    metaOffset: state.metaStart,
    primaryItemId: state.primaryItemId,
    items,
    properties,
    dataReferences: [...state.dataReferences.values()].slice(0, limits.maxIfdEntries),
    relationships,
    complete,
  };
}

function inspectItemMetadata(
  bytes: Uint8Array,
  limits: SecurityLimits,
  maxMetadataBytes = limits.maxMetadataBytes,
  selection: { readonly exif?: boolean; readonly xmp?: boolean; readonly icc?: boolean } = {},
): { exif: Uint8Array | null; exifOffset?: number; xmp: Uint8Array[]; items: readonly MetadataItemProvenance[]; properties: readonly MetadataPropertyProvenance[]; graphs: readonly HeifItemGraph[]; dimensions: ImageDimensions | null; displayDimensions?: ImageDimensions; transform?: ImageTransform; icc: Uint8Array | null; nclx: NclxColorData | null; metadataBytes: number; warnings: readonly MetadataWarning[] } {
  const includeExif = selection.exif !== false;
  const includeXmp = selection.xmp !== false;
  const includeIcc = selection.icc !== false;
  const warnings: MetadataWarning[] = [];
  const boxBudget: ScanBudget = { remainingBoxes: limits.maxSegments };
  const ranges: MetaRange[] = [];
  findMetaRanges(bytes, 0, bytes.length, 0, limits, boxBudget, warnings, ranges);
  const states: ItemScanState[] = ranges.map((range) => {
    const stateWarnings: MetadataWarning[] = [];
    const state: ItemScanState = {
      metaStart: range.start,
      infos: [],
      locations: new Map<number, ItemLocation>(),
      warnings: stateWarnings,
      idat: null,
      idatOffset: null,
      boxBudget,
      primaryItemId: null,
      properties: new Map<number, ItemProperty>(),
      associations: new Map<number, readonly number[]>(),
      associationDetails: new Map<number, readonly HeifItemPropertyReference[]>(),
      descriptions: new Map<number, ReadonlySet<number>>(),
      references: [],
      dataReferences: new Map<number, ParsedDataReference>(),
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
  const items: MetadataItemProvenance[] = [];
  const properties: MetadataPropertyProvenance[] = [];
  let metadataBytes = 0;
  for (const state of states) {
    const associatedMetadataIds = metadataItemIds(state);
    for (const info of state.infos) {
      const isExif = info.type === "Exif";
      const isXmp = info.type === "mime" && info.contentType?.toLowerCase().includes("rdf+xml");
      if (!isExif && !isXmp) continue;
      if ((isExif && !includeExif) || (isXmp && !includeXmp)) continue;
      if (associatedMetadataIds !== null && !associatedMetadataIds.has(info.id)) continue;
      const location = state.locations.get(info.id);
      if (location === undefined) {
        warning(state.warnings, limits, { code: "UNSAFE_OFFSET", message: `HEIF metadata item ${info.id} has no item-location entry.`, offset: 0 });
        continue;
      }
      const resolved = resolveItem(bytes, state, info.id, location, limits, maxMetadataBytes - metadataBytes);
      if (resolved === null) {
        warning(state.warnings, limits, { code: "UNSAFE_OFFSET", message: `HEIF metadata item ${info.id} has an unsafe or unsupported extent.`, offset: 0 });
        continue;
      }
      metadataBytes += resolved.data.length;
      items.push({
        id: info.id,
        family: isExif ? "EXIF" : "XMP",
        ...(resolved.sourceOffset === undefined ? {} : { sourceOffset: resolved.sourceOffset }),
        byteLength: resolved.data.length,
        associatedImage: state.primaryItemId === null ? null : `item:${state.primaryItemId}`,
      });
      if (isExif) {
        if (itemData === null) { itemData = resolved.data; itemDataOffset = resolved.sourceOffset; }
        else warning(warnings, limits, { code: "DUPLICATE_EXIF", message: "A later HEIF Exif item was ignored.", offset: 0 });
      } else foundXmp.push(resolved.data);
    }
  }
  const dimensions = states.map((state) => primaryDimensions(state, limits)).filter((value): value is ImageDimensions => value !== null);
  for (const state of states) {
    if (state.primaryItemId === null) continue;
    for (const index of state.associations.get(state.primaryItemId) ?? []) {
      const property = state.properties.get(index);
      if (property?.type === undefined || property.sourceOffset === undefined || property.byteLength === undefined) continue;
      properties.push({ index, type: property.type, sourceOffset: property.sourceOffset, byteLength: property.byteLength, associatedImage: `item:${state.primaryItemId}` });
    }
  }
  const dimension = dimensions[0] ?? null;
  if (dimension !== null && dimensions.some(({ width, height }) => width !== dimension.width || height !== dimension.height)) {
    warning(warnings, limits, { code: "MALFORMED_HEIF", message: "Multiple HEIF MetaBoxes identify conflicting primary-item dimensions.", offset: 0 });
  }
  const profiles = includeIcc ? states.map((state) => primaryIccProfile(state, limits)).filter((value): value is Uint8Array => value !== null) : [];
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
  const graphs = states.map((state) => buildItemGraph(bytes, state, limits));
  for (const state of states) for (const item of state.warnings) warning(warnings, limits, item);
  return {
    exif: itemData,
    ...(itemDataOffset === undefined ? {} : { exifOffset: itemDataOffset }),
    xmp: foundXmp,
    items,
    properties,
    graphs,
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
export function parseHeif(bytes: Uint8Array, limits: SecurityLimits, format: "heif" | "avif", selection?: ResolvedSelection, signal?: AbortSignal, registry?: MetadataRegistry): ParsedMetadataResult {
  throwIfAborted(signal);
  const warnings: MetadataWarning[] = [];
  const fields: MetadataField[] = [];
  const blocks: MetadataBlock[] = [];
  const xmpPackets: string[] = [];
  let exif: ExifData | null = null;
  let icc: ParsedMetadataResult["icc"] = null;
  let iccMalformed = false;
  let metadataBytes = 0;
  let boxCount = 0;
  const includeExif = wantsGroup(selection, "EXIF");
  const includeXmp = wantsGroup(selection, "XMP");
  const includeIcc = wantsGroup(selection, "ICC");
  const fallbackDimensions = wantsGroup(selection, "Dimensions")
    ? parseHeifDimensions(bytes, limits.maxIfdDepth, limits.maxSegments, signal)
    : null;

  const visit = (start: number, end: number, depth: number): void => {
    if (depth > limits.maxIfdDepth) {
      warning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "HEIF box nesting exceeds the configured depth limit.", offset: start });
      return;
    }
    let cursor = start;
    while (cursor < end) {
      throwIfAborted(signal);
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
      if ((type === "Exif" || type === "exif") && includeExif) {
        const blockId = `${format}:Exif:${cursor}`;
        blocks.push({ id: blockId, family: "EXIF", container: "HEIF Exif box", status: "decoded", offset: cursor, length: boxEnd - cursor, associatedImage: null, sensitivity: "moderate", warningCodes: [] });
        metadataBytes += payload.length;
        if (payload.length > limits.maxSegmentBytes || metadataBytes > limits.maxMetadataBytes) warning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "HEIF EXIF payload exceeds the configured metadata limit.", offset: payloadStart, length: payload.length });
        else if (exif === null) {
          const tiff = extractHeifExifTiff(payload);
          if (tiff === null) {
            warning(warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF Exif payload has no valid TIFF header at its declared offset.", offset: payloadStart, length: payload.length });
          } else {
            const parsed = parseExif(tiff.tiff, limits, payloadStart + tiff.offset, selection?.tags, registry);
            for (const item of parsed.warnings) warning(warnings, limits, item);
            if (parsed.exif !== null) {
              const thumbnail = extractExifThumbnail(tiff.tiff, parsed.exif, limits);
              exif = thumbnail === null ? parsed.exif : { ...parsed.exif, thumbnail };
              fields.push(...parsed.fields.map((field) => field.source === undefined ? field : ({
                ...field,
                source: {
                  ...field.source,
                  blockId,
                  entryOffset: field.source.entryOffset === null ? null : payloadStart + tiff.offset + field.source.entryOffset,
                  valueOffset: field.source.valueOffset === null ? null : payloadStart + tiff.offset + field.source.valueOffset,
                },
              })));
            }
          }
        } else warning(warnings, limits, { code: "DUPLICATE_EXIF", message: "A later HEIF EXIF box was ignored.", offset: payloadStart });
      } else if ((type === "xml " || type === "XMP ") && includeXmp) {
        blocks.push({ id: `${format}:XMP:${cursor}`, family: "XMP", container: "HEIF XMP box", status: "decoded", offset: cursor, length: boxEnd - cursor, associatedImage: null, sensitivity: "moderate", warningCodes: [] });
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
  throwIfAborted(signal);
  const itemMetadata = inspectItemMetadata(bytes, limits, Math.max(0, limits.maxMetadataBytes - metadataBytes), {
    exif: includeExif,
    xmp: includeXmp,
    icc: includeIcc,
  });
  const sequenceMetadata = parseHeifSequences(bytes, limits, itemMetadata.graphs);
  for (const item of sequenceMetadata.warnings) warning(warnings, limits, item);
  for (const item of itemMetadata.warnings) warning(warnings, limits, item);
  for (const item of itemMetadata.items) {
    const offset = item.sourceOffset ?? null;
    blocks.push({
      id: `${format}:${item.family}-item:${item.id}`,
      family: item.family,
      container: `HEIF ${item.family === "EXIF" ? "Exif" : "MIME XMP"} item`,
      status: offset === null ? "partial" : "decoded",
      offset,
      length: item.byteLength,
      associatedImage: item.associatedImage,
      sensitivity: "moderate",
      warningCodes: offset === null ? ["UNSUPPORTED_STRUCTURE"] : [],
    });
  }
  for (const property of itemMetadata.properties) {
    const family = property.type === "colr" ? "ICC" : "Unknown";
    blocks.push({
      id: `${format}:property:${property.index}:${property.sourceOffset}`,
      family,
      container: `HEIF ${property.type} item property`,
      status: "decoded",
      offset: property.sourceOffset,
      length: property.byteLength,
      associatedImage: property.associatedImage,
      sensitivity: family === "ICC" ? "low" : "none",
      warningCodes: [],
    });
  }
  if (includeExif && itemMetadata.exif !== null && !isPresent(exif)) {
    const payload = itemMetadata.exif;
    const tiff = extractHeifExifTiff(payload);
    if (tiff === null) {
      warning(warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF Exif item has no valid TIFF header at its declared offset.", offset: 0, length: payload.length });
    } else {
      const parsed = parseExif(tiff.tiff, limits, (itemMetadata.exifOffset ?? 0) + tiff.offset, selection?.tags, registry);
      for (const item of parsed.warnings) warning(warnings, limits, item);
      if (parsed.exif !== null) {
        const thumbnail = extractExifThumbnail(tiff.tiff, parsed.exif, limits);
        exif = thumbnail === null ? parsed.exif : { ...parsed.exif, thumbnail };
        const item = itemMetadata.items.find((candidate) => candidate.family === "EXIF" && candidate.sourceOffset === itemMetadata.exifOffset);
        const blockId = item === undefined ? null : `${format}:EXIF-item:${item.id}`;
        fields.push(...parsed.fields.map((field) => field.source === undefined || blockId === null ? field : ({
          ...field,
          source: {
            ...field.source,
            blockId,
            entryOffset: field.source.entryOffset === null ? null : (itemMetadata.exifOffset ?? 0) + tiff.offset + field.source.entryOffset,
            valueOffset: field.source.valueOffset === null ? null : (itemMetadata.exifOffset ?? 0) + tiff.offset + field.source.valueOffset,
          },
        })));
      }
    }
  }
  for (const packetBytes of includeXmp ? itemMetadata.xmp : []) {
    const packet = packetBytes.length <= limits.maxStringBytes ? decodeUtf8(packetBytes) : null;
    if (packet === null) warning(warnings, limits, { code: "INVALID_VALUE", message: "HEIF item XMP payload is invalid UTF-8 or exceeds the configured string limit.", length: packetBytes.length });
    else xmpPackets.push(packet);
  }
  if (includeIcc && itemMetadata.icc !== null) {
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
      iccMalformed = inspected.warnings.length > 0;
    }
  }
  if (bytes.length < 16 || ascii(bytes, 4) !== "ftyp") warningError(warnings, limits, { code: "MALFORMED_HEIF", message: "HEIF/AVIF input has no valid ftyp box.", offset: 0 });
  const primarySequences = sequenceMetadata.sequences.filter(({ primaryTrackId }) => primaryTrackId !== null);
  const primarySequence = primarySequences.length === 1 ? primarySequences[0] : undefined;
  const primarySequenceTrack = primarySequence?.tracks.find(({ id }) => id === primarySequence.primaryTrackId);
  const storedDimensions = itemMetadata.dimensions ?? fallbackDimensions ?? primarySequenceTrack?.dimensions ?? null;
  const resolvedBlocks = blocks.map((block) => {
    const offset = block.offset;
    const length = block.length;
    const local = offset === null || length === null
      ? []
      : warnings.filter((item) => item.offset !== undefined && item.offset >= offset && item.offset < offset + length);
    return {
      ...block,
      status: block.family === "ICC" && iccMalformed ? "malformed" : local.some((item) => item.severity === "error") ? "partial" : block.status,
      warningCodes: [...new Set([...block.warningCodes, ...local.map((item) => item.code)])],
    };
  });
  return {
    format,
    mimeType: format === "avif" ? "image/avif" : "image/heif",
    dimensions: storedDimensions,
    heif: itemMetadata.graphs,
    ...(sequenceMetadata.sequences.length === 0 ? {} : { heifSequences: sequenceMetadata.sequences }),
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
    blocks: resolvedBlocks,
    warnings,
  };
}
