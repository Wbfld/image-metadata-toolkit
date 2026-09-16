import { parseStructuredXmpDetailed, type XmpProperty, type XmpQualifier, type XmpValue } from "./xmp.js";
import type {
  GContainerItem,
  MpfData,
  MpfDiagnostic,
  MpfEmbeddedMetadataInventory,
  MpfIfd,
  MpfIfdEntry,
  MpfImageEntry,
  MpfImageType,
  MpfRelationship,
  MpfSegment,
  SecurityLimits,
  UltraHdrData,
  UltraHdrGainMapProperty,
} from "../types.js";

export const MPF_IDENTIFIER = "MPF\0";
export const MPF_STANDARD = "CIPA DC-X007:2025";
export const ULTRA_HDR_STANDARD = "Android Ultra HDR v1.1";
export const ULTRA_HDR_NAMESPACE = "http://ns.adobe.com/hdr-gain-map/1.0/";
export const GCONTAINER_NAMESPACE = "http://ns.google.com/photos/1.0/container/";
export const GCONTAINER_ITEM_NAMESPACE = "http://ns.google.com/photos/1.0/container/item/";

export interface MpfSegmentInput {
  readonly id: string;
  readonly sourceOffset: number;
  readonly byteLength: number;
  readonly payload: Uint8Array;
}

export interface MpfSourceView {
  readonly length: number;
  readonly subarray: (start: number, end: number) => Uint8Array;
  readonly isMaterialized: (start: number, end: number) => boolean;
}

export interface MpfImageInspector {
  readonly inspect: (bytes: Uint8Array, imageIndex: number, sourceOffset: number) => MpfEmbeddedMetadataInventory;
}

export interface MpfInspectionOptions {
  readonly imageInspector?: MpfImageInspector;
}

interface DiagnosticState {
  readonly values: MpfDiagnostic[];
}

interface ParsedIfd {
  readonly ifd: MpfIfd;
  readonly nextIfdOffset: number;
}

interface ParsedSegment {
  readonly segment: MpfSegment;
  readonly indexCandidate: boolean;
}

interface NumericValue {
  readonly value: number;
  readonly entry: MpfIfdEntry;
}

interface LiteralValue {
  readonly lexicalValue: string;
  readonly numericValue: number | null;
}

function diagnostic(
  state: DiagnosticState,
  code: MpfDiagnostic["code"],
  message: string,
  severity: MpfDiagnostic["severity"],
  offset?: number,
  length?: number,
): void {
  state.values.push({ code, message, severity, ...(offset === undefined ? {} : { offset }), ...(length === undefined ? {} : { length }) });
}

function safeAdd(left: number, right: number): number | null {
  if (!Number.isSafeInteger(left) || !Number.isSafeInteger(right) || left < 0 || right < 0 || left > Number.MAX_SAFE_INTEGER - right) return null;
  return left + right;
}

function safeMultiply(left: number, right: number): number | null {
  if (!Number.isSafeInteger(left) || !Number.isSafeInteger(right) || left < 0 || right < 0 || left !== 0 && right > Math.floor(Number.MAX_SAFE_INTEGER / left)) return null;
  return left * right;
}

function isRange(length: number, offset: number, byteLength: number): boolean {
  return Number.isSafeInteger(length) && Number.isSafeInteger(offset) && Number.isSafeInteger(byteLength) && length >= 0 && offset >= 0 && byteLength >= 0 && offset <= length && byteLength <= length - offset;
}

function hasIdentifier(payload: Uint8Array): boolean {
  return payload.length >= 4 && payload[0] === 0x4d && payload[1] === 0x50 && payload[2] === 0x46 && payload[3] === 0;
}

function typeSize(type: number): number | null {
  if (type === 1 || type === 2 || type === 6 || type === 7) return 1;
  if (type === 3 || type === 8) return 2;
  if (type === 4 || type === 9 || type === 13) return 4;
  if (type === 5 || type === 10 || type === 11) return 8;
  if (type === 12) return 8;
  return null;
}

function dataView(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function readU16(view: DataView, offset: number, littleEndian: boolean): number | null {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > view.byteLength - 2) return null;
  return view.getUint16(offset, littleEndian);
}

function readU32(view: DataView, offset: number, littleEndian: boolean): number | null {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > view.byteLength - 4) return null;
  return view.getUint32(offset, littleEndian);
}

function readBytes(bytes: Uint8Array, offset: number, length: number): Uint8Array | null {
  return isRange(bytes.byteLength, offset, length) ? bytes.subarray(offset, offset + length) : null;
}

function readIfd(bytes: Uint8Array, tiffBase: number, relativeOffset: number, littleEndian: boolean, sourceOffset: number, kind: MpfIfd["kind"], limits: SecurityLimits, state: DiagnosticState): ParsedIfd | null {
  const view = dataView(bytes);
  const countOffset = safeAdd(tiffBase, relativeOffset);
  if (countOffset === null || !isRange(bytes.byteLength, countOffset, 2)) {
    diagnostic(state, "UNSAFE_OFFSET", "MPF IFD offset does not identify a complete entry-count field.", "error", sourceOffset + tiffBase + Math.max(0, relativeOffset));
    return null;
  }
  const count = readU16(view, countOffset, littleEndian);
  if (count === null) {
    diagnostic(state, "TRUNCATED_DATA", "MPF IFD entry count is truncated.", "error", sourceOffset + tiffBase + relativeOffset, 2);
    return null;
  }
  if (count > limits.maxIfdEntries) {
    diagnostic(state, "LIMIT_EXCEEDED", `MPF IFD entry count exceeds ${limits.maxIfdEntries}.`, "error", sourceOffset + tiffBase + relativeOffset, 2);
    return null;
  }
  const tableBytes = safeMultiply(count, 12);
  const entryTableLength = tableBytes === null ? null : safeAdd(2, tableBytes);
  const ifdLength = entryTableLength === null ? null : safeAdd(entryTableLength, 4);
  const entryTableStart = safeAdd(countOffset, 2);
  const tableEnd = tableBytes === null || entryTableStart === null ? null : safeAdd(entryTableStart, tableBytes);
  if (ifdLength === null || tableEnd === null || !isRange(bytes.byteLength, countOffset, ifdLength)) {
    diagnostic(state, "TRUNCATED_DATA", "MPF IFD entry table or next-IFD pointer is truncated.", "error", sourceOffset + relativeOffset);
    return null;
  }
  const entries: MpfIfdEntry[] = [];
  for (let index = 0; index < count; index += 1) {
    const entryOffset = countOffset + 2 + index * 12;
    const tag = readU16(view, entryOffset, littleEndian);
    const type = readU16(view, entryOffset + 2, littleEndian);
    const itemCount = readU32(view, entryOffset + 4, littleEndian);
    if (tag === null || type === null || itemCount === null) {
      diagnostic(state, "TRUNCATED_DATA", "MPF IFD entry header is truncated.", "error", sourceOffset + tiffBase + relativeOffset + 2 + index * 12, 12);
      continue;
    }
    const size = typeSize(type);
    const valueLength = size === null ? null : safeMultiply(size, itemCount);
    if (valueLength === null) {
      diagnostic(state, "UNSAFE_OFFSET", `MPF IFD tag 0x${tag.toString(16)} has an unsafe value length.`, "error", sourceOffset + tiffBase + relativeOffset + 2 + index * 12, 12);
      continue;
    }
    const valueOffsetRelative = valueLength <= 4
      ? entryOffset + 8 - tiffBase
      : readU32(view, entryOffset + 8, littleEndian);
    const valueOffsetAbsolute = valueOffsetRelative === null ? null : safeAdd(tiffBase, valueOffsetRelative);
    if (valueOffsetRelative === null || valueOffsetAbsolute === null || !isRange(bytes.byteLength, valueOffsetAbsolute, valueLength)) {
      diagnostic(state, "UNSAFE_OFFSET", `MPF IFD tag 0x${tag.toString(16)} points outside the MPF payload.`, "error", sourceOffset + tiffBase + relativeOffset + 2 + index * 12, 12);
      continue;
    }
    entries.push({ tag, type, count: itemCount, valueOffset: valueOffsetRelative, valueLength, sourceOffset: sourceOffset + valueOffsetAbsolute });
  }
  const nextOffset = readU32(view, tableEnd, littleEndian);
  if (nextOffset === null) {
    diagnostic(state, "TRUNCATED_DATA", "MPF IFD next pointer is truncated.", "error", sourceOffset + tiffBase + relativeOffset + ifdLength - 4, 4);
    return null;
  }
  return {
    ifd: { kind, sourceOffset: sourceOffset + tiffBase + relativeOffset, relativeOffset, byteLength: ifdLength, entries, nextIfdOffset: nextOffset },
    nextIfdOffset: nextOffset,
  };
}

function entryBytes(payload: Uint8Array, tiffBase: number, entry: MpfIfdEntry): Uint8Array | null {
  const absolute = safeAdd(tiffBase, entry.valueOffset);
  return absolute === null ? null : readBytes(payload, absolute, entry.valueLength);
}

function readNumeric(payload: Uint8Array, tiffBase: number, entry: MpfIfdEntry, littleEndian: boolean): NumericValue | null {
  if (entry.count !== 1 || (entry.type !== 3 && entry.type !== 4 && entry.type !== 8 && entry.type !== 9 && entry.type !== 13)) return null;
  const bytes = entryBytes(payload, tiffBase, entry);
  if (bytes === null) return null;
  const view = dataView(bytes);
  if (entry.type === 3) return { value: view.getUint16(0, littleEndian), entry };
  if (entry.type === 4 || entry.type === 13) return { value: view.getUint32(0, littleEndian), entry };
  if (entry.type === 8) return { value: view.getInt16(0, littleEndian), entry };
  return { value: view.getInt32(0, littleEndian), entry };
}

function textValue(payload: Uint8Array, tiffBase: number, entry: MpfIfdEntry): string | null {
  const bytes = entryBytes(payload, tiffBase, entry);
  if (bytes === null || bytes.byteLength > 64) return null;
  try {
    return new TextDecoder("ascii", { fatal: true }).decode(bytes).replace(/\0+$/u, "");
  } catch {
    return null;
  }
}

function imageType(code: number): MpfImageType {
  const types: Readonly<Record<number, MpfImageType>> = {
    0x000000: "undefined",
    0x010001: "large-thumbnail-vga",
    0x010002: "large-thumbnail-full-hd",
    0x010003: "large-thumbnail-4k",
    0x010004: "large-thumbnail-8k",
    0x010005: "large-thumbnail-16k",
    0x020001: "multi-frame-panorama",
    0x020002: "multi-frame-disparity",
    0x020003: "multi-angle",
    0x030000: "baseline-primary",
    0x040000: "original-preservation",
    0x050000: "gain-map",
  };
  return types[code] ?? "other";
}

function parseImages(payload: Uint8Array, tiffBase: number, entry: MpfIfdEntry, littleEndian: boolean, source: MpfSourceView, segment: MpfSegmentInput, limits: SecurityLimits, state: DiagnosticState, inspector: MpfImageInspector | undefined): readonly MpfImageEntry[] {
  if (entry.type !== 7 || entry.count % 16 !== 0) {
    diagnostic(state, "MALFORMED_MPF", "MPF MPEntry must be an UNDEFINED value whose count is a multiple of 16.", "error", entry.sourceOffset, entry.valueLength);
    return [];
  }
  const count = entry.count / 16;
  if (count < 1 || count > limits.maxSegments) {
    diagnostic(state, "LIMIT_EXCEEDED", `MPF image count must be between 1 and ${limits.maxSegments}.`, "error", entry.sourceOffset, entry.valueLength);
    return [];
  }
  const bytes = entryBytes(payload, tiffBase, entry);
  if (bytes === null) return [];
  const view = dataView(bytes);
  const images: MpfImageEntry[] = [];
  for (let index = 0; index < count; index += 1) {
    const entryOffset = index * 16;
    const attributes = view.getUint32(entryOffset, littleEndian);
    const size = view.getUint32(entryOffset + 4, littleEndian);
    const offset = view.getUint32(entryOffset + 8, littleEndian);
    const dependent1 = view.getUint16(entryOffset + 12, littleEndian);
    const dependent2 = view.getUint16(entryOffset + 14, littleEndian);
    const formatCode = (attributes >>> 24) & 0x07;
    const typeCode = attributes & 0x00ffffff;
    // CIPA DC-X007 defines the first image offset as zero and every later
    // image offset relative to the MP Endian field in the MP Header. The
    // source offset of this field is eight bytes after the JPEG APP2 marker:
    // two marker bytes, two length bytes, and the four-byte MPF identifier.
    // Keeping the stored offset separate from the resolved absolute offset is
    // important because the two coordinate systems are intentionally
    // different for the first and subsequent individual images.
    const mpEndianOffset = safeAdd(segment.sourceOffset, 8);
    const imageOffset = index === 0 ? 0 : mpEndianOffset === null ? null : safeAdd(mpEndianOffset, offset);
    const rangeLength = imageOffset !== null && isRange(source.length, imageOffset, size) ? size : null;
    let status: MpfImageEntry["status"] = rangeLength === null ? "malformed" : formatCode === 0 ? "decoded" : "opaque";
    if (size === 0) {
      status = "malformed";
      diagnostic(state, "INVALID_VALUE", `MPF image ${index + 1} has a zero image-data size.`, "error", segment.sourceOffset, segment.byteLength);
    }
    if (rangeLength === null) diagnostic(state, "UNSAFE_OFFSET", `MPF image ${index + 1} range is outside the containing JPEG.`, "error", segment.sourceOffset, segment.byteLength);
    if (formatCode !== 0) diagnostic(state, "INVALID_VALUE", `MPF image ${index + 1} uses unsupported image-data format code ${formatCode}.`, "warning", segment.sourceOffset, segment.byteLength);
    const dependentImage1 = dependent1 === 0 ? null : dependent1 - 1;
    const dependentImage2 = dependent2 === 0 ? null : dependent2 - 1;
    for (const dependency of [dependentImage1, dependentImage2]) {
      if (dependency !== null && (dependency < 0 || dependency >= count || dependency === index)) {
        status = "malformed";
        diagnostic(state, "INVALID_VALUE", `MPF image ${index + 1} has an invalid dependency entry number.`, "error", segment.sourceOffset, segment.byteLength);
      }
    }
    let metadata: MpfEmbeddedMetadataInventory | null = null;
    if (status === "decoded" && rangeLength !== null) {
      if (imageOffset !== null && source.isMaterialized(imageOffset, imageOffset + rangeLength)) {
        const imageBytes = source.subarray(imageOffset, imageOffset + rangeLength);
        if (imageBytes.byteLength !== rangeLength) {
          status = "partial";
          diagnostic(state, "TRUNCATED_DATA", `MPF image ${index + 1} bytes were not fully available for metadata inventory.`, "warning", imageOffset, rangeLength);
        } else if (imageBytes.byteLength < 2 || imageBytes[0] !== 0xff || imageBytes[1] !== 0xd8) {
          status = "malformed";
          diagnostic(state, "MALFORMED_MPF", `MPF image ${index + 1} does not begin with a JPEG SOI marker.`, "error", imageOffset, Math.min(2, imageBytes.byteLength));
        } else if (inspector !== undefined) metadata = inspector.inspect(imageBytes, index, imageOffset);
      } else {
        status = "partial";
        diagnostic(state, "UNSUPPORTED_STRUCTURE", `MPF image ${index + 1} is outside the materialized metadata scope.`, "warning", imageOffset ?? offset, rangeLength);
      }
    }
    images.push({
      id: `${segment.id}:image:${index}`,
      index,
      attributes,
      imageFormat: formatCode === 0 ? "jpeg" : "unsupported",
      imageFormatCode: formatCode,
      imageType: imageType(typeCode),
      imageTypeCode: typeCode,
      representative: (attributes & 0x20000000) !== 0,
      dependentChild: (attributes & 0x40000000) !== 0,
      dependentParent: (attributes & 0x80000000) !== 0,
      size,
      offset,
      absoluteOffset: rangeLength === null ? null : imageOffset,
      rangeLength,
      dependentImage1,
      dependentImage2,
      status,
      metadata,
    });
  }
  if (images[0]?.offset !== 0) diagnostic(state, "INVALID_VALUE", "The first MPF image entry must use a zero data offset.", "error", segment.sourceOffset, segment.byteLength);
  const ranges = images.filter((image) => image.absoluteOffset !== null && image.rangeLength !== null).map((image) => ({ start: image.absoluteOffset as number, end: (image.absoluteOffset as number) + (image.rangeLength ?? 0), image }));
  for (let left = 0; left < ranges.length; left += 1) {
    for (let right = left + 1; right < ranges.length; right += 1) {
      const first = ranges[left];
      const second = ranges[right];
      if (first !== undefined && second !== undefined && first.start < second.end && second.start < first.end) {
        diagnostic(state, "MALFORMED_MPF", `MPF image ranges ${first.image.index + 1} and ${second.image.index + 1} overlap.`, "error", Math.min(first.start, second.start), Math.max(first.end, second.end) - Math.min(first.start, second.start));
      }
    }
  }
  const parentIndices = new Set(images.filter((image) => image.dependentImage1 !== null || image.dependentImage2 !== null).map((image) => image.index));
  const childIndices = new Set<number>();
  for (const image of images) for (const dependency of [image.dependentImage1, image.dependentImage2]) if (dependency !== null) childIndices.add(dependency);
  for (const image of images) {
    if (image.dependentParent !== parentIndices.has(image.index) || image.dependentChild !== childIndices.has(image.index)) {
      diagnostic(state, "INVALID_VALUE", `MPF image ${image.index + 1} dependency flags do not agree with the entry references.`, "error", segment.sourceOffset, segment.byteLength);
    }
  }
  return images;
}

function parseSegment(input: MpfSegmentInput, isFirst: boolean, source: MpfSourceView, limits: SecurityLimits, options: MpfInspectionOptions): ParsedSegment {
  const state: DiagnosticState = { values: [] };
  const payload = input.payload;
  if (!hasIdentifier(payload)) {
    diagnostic(state, "MALFORMED_MPF", "MPF segment does not begin with the MPF identifier.", "error", input.sourceOffset, input.byteLength);
    return { indexCandidate: false, segment: { id: input.id, sourceOffset: input.sourceOffset, byteLength: input.byteLength, indexIfd: null, attributeIfds: [], mpfVersion: null, numberOfImages: null, images: [], complete: false, diagnostics: state.values } };
  }
  const tiffBase = 4;
  if (payload.length < tiffBase + 8) {
    diagnostic(state, "TRUNCATED_DATA", "MPF TIFF header is shorter than eight bytes.", "error", input.sourceOffset, input.byteLength);
    return { indexCandidate: false, segment: { id: input.id, sourceOffset: input.sourceOffset, byteLength: input.byteLength, indexIfd: null, attributeIfds: [], mpfVersion: null, numberOfImages: null, images: [], complete: false, diagnostics: state.values } };
  }
  const littleEndian = payload[tiffBase] === 0x49 && payload[tiffBase + 1] === 0x49;
  const bigEndian = payload[tiffBase] === 0x4d && payload[tiffBase + 1] === 0x4d;
  if (!littleEndian && !bigEndian) {
    diagnostic(state, "MALFORMED_MPF", "MPF TIFF byte order must be II or MM.", "error", input.sourceOffset + tiffBase, 2);
    return { indexCandidate: false, segment: { id: input.id, sourceOffset: input.sourceOffset, byteLength: input.byteLength, indexIfd: null, attributeIfds: [], mpfVersion: null, numberOfImages: null, images: [], complete: false, diagnostics: state.values } };
  }
  const little = littleEndian;
  const view = dataView(payload);
  if (readU16(view, tiffBase + 2, little) !== 42) {
    diagnostic(state, "MALFORMED_MPF", "MPF TIFF magic must be 42.", "error", input.sourceOffset + tiffBase + 2, 2);
    return { indexCandidate: false, segment: { id: input.id, sourceOffset: input.sourceOffset, byteLength: input.byteLength, indexIfd: null, attributeIfds: [], mpfVersion: null, numberOfImages: null, images: [], complete: false, diagnostics: state.values } };
  }
  const firstIfdOffset = readU32(view, tiffBase + 4, little);
  if (firstIfdOffset === null || firstIfdOffset < 8) {
    diagnostic(state, "UNSAFE_OFFSET", "MPF first IFD offset must be at or after the TIFF header.", "error", input.sourceOffset + tiffBase + 4, 4);
    return { indexCandidate: false, segment: { id: input.id, sourceOffset: input.sourceOffset, byteLength: input.byteLength, indexIfd: null, attributeIfds: [], mpfVersion: null, numberOfImages: null, images: [], complete: false, diagnostics: state.values } };
  }
  const first = readIfd(payload, tiffBase, firstIfdOffset, little, input.sourceOffset, "index", limits, state);
  if (first === null) return { indexCandidate: false, segment: { id: input.id, sourceOffset: input.sourceOffset, byteLength: input.byteLength, indexIfd: null, attributeIfds: [], mpfVersion: null, numberOfImages: null, images: [], complete: false, diagnostics: state.values } };
  const hasIndexTags = first.ifd.entries.some((entry) => entry.tag === 0xb001 || entry.tag === 0xb002);
  const indexCandidate = hasIndexTags;
  if (isFirst && !hasIndexTags) diagnostic(state, "MALFORMED_MPF", "The first MPF segment does not contain an MP Index IFD.", "error", input.sourceOffset, input.byteLength);
  if (!isFirst && hasIndexTags) diagnostic(state, "DUPLICATE_MPF", "A second MP Index IFD was found in another MPF segment.", "error", input.sourceOffset, input.byteLength);
  const indexIfd = indexCandidate ? first.ifd : null;
  const attributeIfds: MpfIfd[] = indexCandidate ? [] : [{ ...first.ifd, kind: "attribute" }];
  let next = first.nextIfdOffset;
  let ifdCount = 1;
  while (next !== 0 && ifdCount < 2) {
    const nextIfd = readIfd(payload, tiffBase, next, little, input.sourceOffset, "attribute", limits, state);
    if (nextIfd === null) break;
    attributeIfds.push(nextIfd.ifd);
    next = nextIfd.nextIfdOffset;
    ifdCount += 1;
  }
  if (next !== 0) diagnostic(state, "LIMIT_EXCEEDED", "MPF contains more than the two IFDs permitted by the standard.", "error", input.sourceOffset, input.byteLength);
  const mpfVersion = indexIfd?.entries.find((entry) => entry.tag === 0xb000) === undefined ? null : textValue(payload, tiffBase, indexIfd.entries.find((entry) => entry.tag === 0xb000) as MpfIfdEntry);
  const numberEntry = indexIfd?.entries.find((entry) => entry.tag === 0xb001);
  const number = numberEntry === undefined ? null : readNumeric(payload, tiffBase, numberEntry, little)?.value ?? null;
  const imageEntry = indexIfd?.entries.find((entry) => entry.tag === 0xb002);
  const images = imageEntry === undefined ? [] : parseImages(payload, tiffBase, imageEntry, little, source, input, limits, state, options.imageInspector);
  if (indexCandidate && (number === null || imageEntry === undefined)) diagnostic(state, "MALFORMED_MPF", "MP Index IFD must contain NumberOfImages and MPEntry.", "error", input.sourceOffset, input.byteLength);
  if (number !== null && images.length > 0 && number !== images.length) diagnostic(state, "INVALID_VALUE", `MPF NumberOfImages (${number}) disagrees with MPEntry count (${images.length}).`, "error", input.sourceOffset, input.byteLength);
  const complete = state.values.every((item) => item.severity !== "error") && (!indexCandidate || images.length > 0) && images.every((image) => image.status === "decoded");
  return { indexCandidate, segment: { id: input.id, sourceOffset: input.sourceOffset, byteLength: input.byteLength, indexIfd, attributeIfds, mpfVersion, numberOfImages: number, images, complete, diagnostics: state.values } };
}

function relationshipData(images: readonly MpfImageEntry[]): readonly MpfRelationship[] {
  const relationships: MpfRelationship[] = [];
  for (const image of images) {
    if (image.index === 0) relationships.push({ type: "primary-image", sourceImageId: image.id, targetImageId: null });
    if (image.imageType === "gain-map") relationships.push({ type: "gain-map-image", sourceImageId: image.id, targetImageId: null });
    if (image.representative) relationships.push({ type: "representative-image", sourceImageId: image.id, targetImageId: null });
    for (const dependency of [image.dependentImage1, image.dependentImage2]) if (dependency !== null) relationships.push({ type: "dependent-image", sourceImageId: image.id, targetImageId: images[dependency]?.id ?? null });
  }
  return relationships;
}

/** Parse all MPF APP2 segments without retaining secondary image bytes. */
export function inspectMpfSegments(inputs: readonly MpfSegmentInput[], source: MpfSourceView, limits: SecurityLimits, options: MpfInspectionOptions = {}): MpfData | null {
  if (inputs.length === 0) return null;
  const selected = inputs.slice(0, limits.maxSegments);
  const parsed = selected.map((input, index) => parseSegment(input, index === 0, source, limits, options));
  const diagnostics: MpfDiagnostic[] = parsed.flatMap(({ segment }) => segment.diagnostics);
  if (inputs.length > limits.maxSegments) diagnostics.push({ code: "LIMIT_EXCEEDED", message: `MPF segment count exceeds ${limits.maxSegments}.`, severity: "error" });
  const indexSegments = parsed.filter(({ indexCandidate }) => indexCandidate);
  if (indexSegments.length > 1) diagnostics.push({ code: "DUPLICATE_MPF", message: "Multiple MP Index IFDs were found; the MPF inventory is ambiguous.", severity: "error" });
  const first = indexSegments[0]?.segment;
  const images = first?.images ?? [];
  const relationships = relationshipData(images);
  const complete = first !== undefined && parsed.every(({ segment }) => segment.complete) && indexSegments.length === 1 && images.length > 0;
  return { standard: MPF_STANDARD, segments: parsed.map(({ segment }) => segment), images, relationships, complete, diagnostics };
}

function propertyName(property: XmpProperty, namespaceUri: string, localName: string): boolean {
  return property.name.namespaceUri === namespaceUri && property.name.localName === localName;
}

function valueLiterals(value: XmpValue, output: LiteralValue[], depth = 0): void {
  if (depth > 8) return;
  if (value.kind === "literal") {
    output.push({ lexicalValue: value.lexicalValue, numericValue: typeof value.value === "number" ? value.value : Number.isFinite(Number(value.lexicalValue)) && value.lexicalValue.trim() !== "" ? Number(value.lexicalValue) : null });
  } else if (value.kind === "array") {
    for (const item of value.items) valueLiterals(item, output, depth + 1);
  }
}

function propertyLiterals(property: XmpProperty): readonly LiteralValue[] {
  const values: LiteralValue[] = [];
  valueLiterals(property.value, values);
  return values;
}

function qualifierValue(qualifier: XmpQualifier): string | null {
  if (qualifier.value.kind !== "literal") return null;
  return qualifier.value.lexicalValue;
}

function itemQualifiers(property: XmpProperty): readonly XmpQualifier[] {
  return property.value.qualifiers;
}

function finiteNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/u.test(trimmed)) return null;
  const number = Number(trimmed);
  return Number.isFinite(number) ? number : null;
}

function gainMapProperty(property: XmpProperty, packetIndex: number): UltraHdrGainMapProperty {
  const values = propertyLiterals(property);
  return { namespaceUri: ULTRA_HDR_NAMESPACE, localName: property.name.localName, sourcePacketIndex: packetIndex, lexicalValues: values.map(({ lexicalValue }) => lexicalValue), numericValues: values.map(({ lexicalValue, numericValue }) => numericValue ?? finiteNumber(lexicalValue)) };
}

function diagnosticFromXmp(code: string): MpfDiagnostic["code"] {
  if (code === "LIMIT_EXCEEDED") return "LIMIT_EXCEEDED";
  if (code === "MALFORMED_XML" || code === "UNSAFE_ENTITY" || code === "INVALID_NAMESPACE" || code === "INVALID_RDF") return "MALFORMED_ULTRA_HDR";
  return "INVALID_VALUE";
}

function itemFromValue(value: XmpValue, index: number, packetIndex: number, images: readonly MpfImageEntry[], state: DiagnosticState): GContainerItem {
  let semantic: GContainerItem["semantic"] = "Other";
  let mime: string | null = null;
  let length: number | null = null;
  let padding = 0;
  let uri: string | null = null;
  let malformed = false;
  const itemProperties = value.kind === "resource" || value.kind === "blank-node" || value.kind === "typed-resource" ? value.properties : [];
  const itemProperty = itemProperties.find((property) => propertyName(property, GCONTAINER_NAMESPACE, "Item"));
  if (itemProperty === undefined) {
    malformed = true;
    diagnostic(state, "MALFORMED_ULTRA_HDR", `GContainer directory item ${index + 1} has no Container:Item structure.`, "error");
  } else {
    for (const qualifier of itemQualifiers(itemProperty)) {
      if (qualifier.name.namespaceUri !== GCONTAINER_ITEM_NAMESPACE) continue;
      const valueText = qualifierValue(qualifier);
      if (qualifier.name.localName === "Semantic") {
        if (valueText === "Primary" || valueText === "GainMap") semantic = valueText;
        else semantic = "Other";
      } else if (qualifier.name.localName === "Mime") mime = valueText;
      else if (qualifier.name.localName === "Length") {
        const numeric = valueText === null ? null : finiteNumber(valueText);
        if (numeric === null || !Number.isSafeInteger(numeric) || numeric <= 0) {
          malformed = true;
          diagnostic(state, "INVALID_VALUE", `GContainer item ${index + 1} has an invalid Item:Length.`, "error");
        } else length = numeric;
      } else if (qualifier.name.localName === "Padding") {
        const numeric = valueText === null ? null : finiteNumber(valueText);
        if (numeric === null || !Number.isSafeInteger(numeric) || numeric < 0) {
          malformed = true;
          diagnostic(state, "INVALID_VALUE", `GContainer item ${index + 1} has an invalid Item:Padding.`, "error");
        } else padding = numeric;
      } else if (qualifier.name.localName === "URI") uri = valueText;
    }
  }
  if (mime !== "image/jpeg") {
    malformed = true;
    diagnostic(state, "INVALID_VALUE", `GContainer item ${index + 1} must use the image/jpeg MIME type.`, "error");
  }
  if (uri !== null) {
    malformed = true;
    diagnostic(state, "INVALID_VALUE", `GContainer item ${index + 1} uses Item:URI, which is not permitted for a JPEG GContainer item.`, "error");
  }
  const mpfImageId = images[index]?.id ?? null;
  if (mpfImageId === null) diagnostic(state, "UNSAFE_OFFSET", `GContainer item ${index + 1} has no corresponding MPF image entry.`, "error");
  return { index, semantic, mime, length, padding, uri, sourcePacketIndex: packetIndex, mpfImageId, status: malformed ? "malformed" : "decoded" };
}

function validateGainProperties(properties: readonly UltraHdrGainMapProperty[], state: DiagnosticState): void {
  const first = (name: string): UltraHdrGainMapProperty | undefined => properties.find((property) => property.localName === name);
  const required = ["Version", "GainMapMax", "HDRCapacityMax"];
  for (const name of required) if (first(name) === undefined) diagnostic(state, "MALFORMED_ULTRA_HDR", `Ultra HDR required property hdrgm:${name} is missing.`, "error");
  const version = first("Version")?.lexicalValues[0];
  if (version !== undefined && version !== "1.0") diagnostic(state, "INVALID_VALUE", `Ultra HDR hdrgm:Version must be 1.0, received ${version}.`, "error");
  const base = first("BaseRenditionIsHDR")?.lexicalValues[0];
  if (base !== undefined && base.trim().toLowerCase() !== "false") diagnostic(state, "INVALID_VALUE", "Ultra HDR hdrgm:BaseRenditionIsHDR must be False for the SDR-primary format.", "error");
  const numeric = (name: string): readonly number[] => (first(name)?.numericValues ?? []).filter((value): value is number => value !== null && Number.isFinite(value));
  for (const property of properties.filter((candidate) => ["GainMapMin", "GainMapMax", "Gamma", "OffsetSDR", "OffsetHDR", "HDRCapacityMin", "HDRCapacityMax"].includes(candidate.localName))) {
    if (property.numericValues.length === 0 || property.numericValues.some((value) => value === null || !Number.isFinite(value))) diagnostic(state, "INVALID_VALUE", `Ultra HDR hdrgm:${property.localName} contains a non-finite or non-numeric value.`, "error");
    const permittedLengths = property.localName === "HDRCapacityMin" || property.localName === "HDRCapacityMax" ? [1] : [1, 3];
    if (!permittedLengths.includes(property.numericValues.length)) diagnostic(state, "INVALID_VALUE", `Ultra HDR hdrgm:${property.localName} must contain ${permittedLengths.length === 1 ? "one" : "one or three"} real value${permittedLengths.length === 1 ? "" : "s"}.`, "error");
  }
  const min = numeric("GainMapMin");
  const max = numeric("GainMapMax");
  if (min.length > 0 && max.length > 0) {
    const width = Math.max(min.length, max.length);
    for (let index = 0; index < width; index += 1) if ((min[min.length === 1 ? 0 : index] ?? Number.NaN) > (max[max.length === 1 ? 0 : index] ?? Number.NaN)) diagnostic(state, "INVALID_VALUE", "Ultra HDR GainMapMin must not exceed GainMapMax.", "error");
  }
  for (const value of numeric("Gamma")) if (value <= 0) diagnostic(state, "INVALID_VALUE", "Ultra HDR Gamma must be greater than zero.", "error");
  for (const name of ["OffsetSDR", "OffsetHDR", "HDRCapacityMin"]) for (const value of numeric(name)) if (value < 0) diagnostic(state, "INVALID_VALUE", `Ultra HDR ${name} must be non-negative.`, "error");
  const capacityMin = numeric("HDRCapacityMin")[0] ?? 0;
  const capacityMax = numeric("HDRCapacityMax")[0];
  if (capacityMax !== undefined && capacityMax <= capacityMin) diagnostic(state, "INVALID_VALUE", "Ultra HDR HDRCapacityMax must exceed HDRCapacityMin.", "error");
}

/** Decode exact-namespace Ultra HDR and GContainer relationships from XMP. */
export function inspectUltraHdrXmp(
  packets: readonly string[],
  packetBlockIds: readonly (string | null)[],
  images: readonly MpfImageEntry[],
  limits: SecurityLimits,
): UltraHdrData | null {
  const state: DiagnosticState = { values: [] };
  const properties: UltraHdrGainMapProperty[] = [];
  const directory: GContainerItem[] = [];
  const sourcePacketIndices = new Set<number>();
  const sourceBlockIds = new Set<string>();
  let version: string | null = null;
  let sawGainMapNamespace = false;
  let directoryCount = 0;
  for (let packetIndex = 0; packetIndex < Math.min(packets.length, limits.maxXmpPackets); packetIndex += 1) {
    const packet = packets[packetIndex] as string;
    if (packet.includes(ULTRA_HDR_NAMESPACE)) sawGainMapNamespace = true;
    if (!packet.includes(ULTRA_HDR_NAMESPACE) && !packet.includes(GCONTAINER_NAMESPACE)) continue;
    sourcePacketIndices.add(packetIndex);
    const blockId = packetBlockIds[packetIndex];
    if (blockId !== null && blockId !== undefined) sourceBlockIds.add(blockId);
    const parsed = parseStructuredXmpDetailed(packet, { maxInputBytes: limits.maxStringBytes, maxElements: limits.maxXmpNodes, maxProperties: limits.maxXmpProperties, maxDepth: limits.maxXmpDepth, maxAttributes: limits.maxXmpAttributes, maxNamespaces: limits.maxXmpNamespaces, maxTextBytes: limits.maxXmpTextBytes, maxArrayItems: limits.maxXmpArrayItems, maxQualifiers: limits.maxXmpQualifiers, maxOutputBytes: limits.maxXmpOutputBytes, maxPackets: limits.maxXmpPackets });
    for (const item of parsed.diagnostics) if (item.severity === "error") diagnostic(state, diagnosticFromXmp(item.code), item.message, "error", item.offset, item.length);
    const document = parsed.value?.rdf;
    if (document === undefined) continue;
    for (const property of document.properties) {
      if (property.name.namespaceUri === ULTRA_HDR_NAMESPACE) {
        properties.push(gainMapProperty(property, packetIndex));
        if (property.name.localName === "Version") version = propertyLiterals(property)[0]?.lexicalValue ?? version;
      }
      if (propertyName(property, GCONTAINER_NAMESPACE, "Directory")) {
        directoryCount += 1;
        if (property.value.kind !== "array" || property.value.container !== "Seq") {
          diagnostic(state, "MALFORMED_ULTRA_HDR", "GContainer Container:Directory must be an ordered RDF sequence.", "error", property.sourceStart, property.sourceEnd - property.sourceStart);
        } else {
          for (const item of property.value.items.slice(0, limits.maxXmpArrayItems)) directory.push(itemFromValue(item, directory.length, packetIndex, images, state));
        }
      }
    }
  }
  if (packets.length > limits.maxXmpPackets) diagnostic(state, "LIMIT_EXCEEDED", `Ultra HDR XMP packet count exceeds ${limits.maxXmpPackets}.`, "error");
  if (!sawGainMapNamespace) return null;
  const uniqueProperties = new Map<string, UltraHdrGainMapProperty>();
  for (const property of properties) {
    const existing = uniqueProperties.get(property.localName);
    if (existing !== undefined && JSON.stringify(existing.lexicalValues) !== JSON.stringify(property.lexicalValues)) diagnostic(state, "MALFORMED_ULTRA_HDR", `Ultra HDR property hdrgm:${property.localName} has conflicting packet values.`, "error");
    else if (existing === undefined) uniqueProperties.set(property.localName, property);
  }
  const retainedProperties = [...uniqueProperties.values()];
  validateGainProperties(retainedProperties, state);
  const primaryItems = directory.filter((item) => item.semantic === "Primary");
  const gainMapItems = directory.filter((item) => item.semantic === "GainMap");
  if (directoryCount > 1) diagnostic(state, "MALFORMED_ULTRA_HDR", "Ultra HDR must contain at most one GContainer directory structure.", "error");
  if (directoryCount > 0) {
    if (primaryItems.length !== 1 || primaryItems[0]?.index !== 0) diagnostic(state, "MALFORMED_ULTRA_HDR", "GContainer must contain exactly one Primary item and it must be first.", "error");
    if (gainMapItems.length !== 1) diagnostic(state, "MALFORMED_ULTRA_HDR", "GContainer must contain exactly one GainMap item.", "error");
  } else {
    diagnostic(state, "MALFORMED_ULTRA_HDR", "Ultra HDR gain-map metadata must include a GContainer directory.", "error");
  }
  const primaryImage = primaryItems[0]?.mpfImageId ?? images.find((image) => image.imageType === "baseline-primary")?.id ?? images[0]?.id ?? null;
  const gainMapImage = gainMapItems[0]?.mpfImageId ?? images.find((image) => image.imageType === "gain-map")?.id ?? null;
  if (gainMapImage === null) diagnostic(state, "MALFORMED_ULTRA_HDR", "Ultra HDR gain-map metadata has no corresponding MPF gain-map image.", "error");
  const primaryEntry = primaryItems[0] === undefined ? undefined : images[primaryItems[0].index];
  if (primaryEntry !== undefined && primaryEntry.imageType !== "baseline-primary" && primaryEntry.imageType !== "undefined") diagnostic(state, "MALFORMED_ULTRA_HDR", "GContainer Primary does not identify the MPF baseline-primary image.", "error");
  const gainMapEntry = gainMapItems[0] === undefined ? undefined : images[gainMapItems[0].index];
  if (gainMapEntry !== undefined && gainMapEntry.imageType !== "gain-map" && gainMapEntry.imageType !== "undefined") diagnostic(state, "MALFORMED_ULTRA_HDR", "GContainer GainMap does not identify the MPF gain-map image.", "error");
  if (directory.length > 0 && images.length > 0) {
    for (const item of directory) {
      const image = images[item.index];
      if (item.length !== null && image !== undefined && item.length !== image.size) diagnostic(state, "INVALID_VALUE", `GContainer item ${item.index + 1} length does not match its MPF image size.`, "error");
    }
  }
  const status: UltraHdrData["status"] = state.values.some((item) => item.code === "LIMIT_EXCEEDED") ? "partial" : state.values.some((item) => item.code === "MALFORMED_ULTRA_HDR") ? "malformed" : state.values.some((item) => item.severity === "error") ? "ambiguous" : "decoded";
  return { standard: ULTRA_HDR_STANDARD, namespaceUri: ULTRA_HDR_NAMESPACE, gContainerNamespaceUri: GCONTAINER_NAMESPACE, sourcePacketIndices: [...sourcePacketIndices], sourceBlockIds: [...sourceBlockIds], version, gainMapProperties: retainedProperties, directory, primaryImageId: primaryImage, gainMapImageId: gainMapImage, status, complete: status === "decoded", diagnostics: state.values };
}
