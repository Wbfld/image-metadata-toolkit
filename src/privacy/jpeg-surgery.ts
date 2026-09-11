import type {
  MetadataWarning,
  RedactionRecord,
  SurgeryResult,
  RedactionTarget,
  RedactOptions,
  SecurityLimits,
  WarningCode,
} from "../types.js";
import { parseIptc } from "../metadata/iptc.js";

const MARKER_PREFIX = 0xff;
const SOI = 0xd8;
const EOI = 0xd9;
const SOS = 0xda;
const DNL = 0xdc;
const TEM = 0x01;
const COM = 0xfe;
const APP0 = 0xe0;
const APP15 = 0xef;

const EXIF_IDENTIFIER = asciiBytes("Exif\0\0");
const XMP_IDENTIFIER = asciiBytes("http://ns.adobe.com/xap/1.0/\0");
const EXTENDED_XMP_IDENTIFIER = asciiBytes("http://ns.adobe.com/xmp/extension/\0");
const ICC_IDENTIFIER = asciiBytes("ICC_PROFILE\0");
const MPF_IDENTIFIER = asciiBytes("MPF\0");
const JFIF_IDENTIFIER = asciiBytes("JFIF\0");
const JFXX_IDENTIFIER = asciiBytes("JFXX\0");

const EXIF_POINTER = 0x8769;
const GPS_POINTER = 0x8825;
const INTEROP_POINTER = 0xa005;

const GPS_FIELD_TARGETS = new Set<RedactionTarget>([
  "GPSLatitude",
  "GPSLongitude",
  "GPSAltitude",
]);

const EXIF_CHILD_TARGETS = new Set<RedactionTarget>([
  "GPS",
  "SerialNumber",
  "Make",
  "Model",
  "Orientation",
  "DateTime",
  "DateTimeOriginal",
  "ExposureTime",
  "FNumber",
  "ISOSpeedRatings",
  "Flash",
  "FocalLength",
  "GPSLatitude",
  "GPSLongitude",
  "GPSAltitude",
  "Copyright",
  "Artist",
  "Software",
]);

const EXIF_IFD_TARGETS = new Set<RedactionTarget>([
  "SerialNumber",
  "DateTimeOriginal",
  "ExposureTime",
  "FNumber",
  "ISOSpeedRatings",
  "Flash",
  "FocalLength",
]);

type ByteOrder = "little" | "big";
type IfdKind = "IFD0" | "IFD1" | "ExifIFD" | "GPSIFD" | "InteropIFD";
type SegmentCategory = "EXIF" | "XMP" | "IPTC" | "ICC" | "JFIF" | "OTHER";

interface JpegSegment {
  readonly marker: number;
  readonly start: number;
  readonly end: number;
  readonly payloadStart: number;
  readonly payloadEnd: number;
}

interface ParsedJpeg {
  readonly segments: readonly JpegSegment[];
}

interface ByteRange {
  readonly start: number;
  readonly end: number;
}

interface IfdEntry {
  readonly tag: number;
  readonly type: number;
  readonly count: number;
  readonly entryOffset: number;
  readonly valueRange: ByteRange | null;
}

interface IfdDirectory {
  readonly kind: IfdKind;
  readonly relativeOffset: number;
  readonly countOffset: number;
  readonly entriesStart: number;
  readonly structureEnd: number;
  readonly entries: readonly IfdEntry[];
  readonly nextOffset: number;
  readonly depth: number;
}

interface ParsedExif {
  readonly order: ByteOrder;
  readonly directories: readonly IfdDirectory[];
}

interface SelectiveContext {
  readonly remove: ReadonlySet<RedactionTarget>;
  readonly preserve: ReadonlySet<RedactionTarget>;
  readonly broadTarget: "AllMetadata" | "EXIF" | null;
}

interface SelectiveResult {
  readonly bytes: Uint8Array;
  readonly counts: ReadonlyMap<RedactionTarget, number>;
}

/** Result of lossless selective surgery on a TIFF payload carried by EXIF. */
export interface ExifTiffRedactionResult {
  readonly bytes: Uint8Array;
  readonly counts: ReadonlyMap<RedactionTarget, number>;
}

class SurgeryFailure extends Error {
  public readonly code: WarningCode;
  public readonly offset: number | undefined;

  public constructor(code: WarningCode, message: string, offset?: number) {
    super(message);
    this.name = "SurgeryFailure";
    this.code = code;
    this.offset = offset;
  }
}

/**
 * Redact JPEG metadata without decoding or rewriting an entropy-coded scan.
 *
 * The operation is atomic: every relevant structure is checked before output is
 * assembled. A malformed JPEG or EXIF payload returns a copy of the input.
 */
export function redactJpeg(
  bytes: Uint8Array,
  options: RedactOptions,
  limits: SecurityLimits,
): SurgeryResult {
  const original = new Uint8Array(bytes);

  try {
    const parsed = parseJpeg(bytes, limits);
    const remove = new Set(options.remove);
    const preserve = new Set(options.preserve ?? []);

    if (preserve.has("AllMetadata") || remove.size === 0) {
      return result(original, new Map(), options, []);
    }

    const unsupported = findUnsupportedStructure(bytes, parsed.segments);
    if (unsupported !== null) {
      throw new SurgeryFailure("UNSUPPORTED_STRUCTURE", unsupported.message, unsupported.offset);
    }

    const removedSegments = new Set<number>();
    const replacements = new Map<number, Uint8Array>();
    const counts = new Map<RedactionTarget, number>();

    for (const segment of parsed.segments) {
      const category = classifySegment(bytes, segment);
      const segmentTarget = removalTargetForSegment(segment, category, remove, preserve);

      if (segmentTarget !== null) {
        removedSegments.add(segment.start);
        increment(counts, segmentTarget);
        continue;
      }

      if (category !== "EXIF" || preserve.has("EXIF")) {
        continue;
      }

      const broadTarget = broadExifTarget(remove, preserve);
      if (!hasSelectiveExifRequest(remove, preserve, broadTarget)) {
        continue;
      }

      const segmentBytes = bytes.slice(segment.start, segment.end);
      const payloadStart = segment.payloadStart - segment.start;
      let transformed: SelectiveResult;
      try {
        transformed = redactExifSegment(segmentBytes, payloadStart, limits, {
          remove,
          preserve,
          broadTarget,
        });
      } catch (error) {
        throw failureAtSegmentOffset(error, segment.start);
      }
      replacements.set(segment.start, transformed.bytes);
      mergeCounts(counts, transformed.counts);
    }

    const data = rebuildJpeg(bytes, parsed.segments, removedSegments, replacements);
    return result(data, counts, options, []);
  } catch (error) {
    const failure = toFailure(error);
    const warning = makeWarning(failure, limits);
    return result(original, new Map(), options, warning === null ? [] : [warning]);
  }
}

function parseJpeg(bytes: Uint8Array, limits: SecurityLimits): ParsedJpeg {
  if (bytes.length > limits.maxInputBytes) {
    throw new SurgeryFailure(
      "LIMIT_EXCEEDED",
      `JPEG input is ${bytes.length} bytes; the configured maximum is ${limits.maxInputBytes}.`,
    );
  }
  if (bytes.length < 2 || bytes[0] !== MARKER_PREFIX || bytes[1] !== SOI) {
    throw new SurgeryFailure("MALFORMED_JPEG", "JPEG does not begin with an SOI marker.", 0);
  }

  const segments: JpegSegment[] = [];
  let cursor = 2;
  let segmentCount = 0;
  let metadataBytes = 0;
  let inEntropyData = false;
  let sawFrame = false;
  let sawScan = false;

  while (cursor < bytes.length) {
    let markerCameFromEntropyData = false;
    if (inEntropyData) {
      cursor = findMarkerInEntropyData(bytes, cursor);
      inEntropyData = false;
      markerCameFromEntropyData = true;
    }

    const markerStart = cursor;
    if (bytes[cursor] !== MARKER_PREFIX) {
      throw new SurgeryFailure(
        "MALFORMED_JPEG",
        "Expected a JPEG marker outside entropy-coded data.",
        cursor,
      );
    }

    while (cursor < bytes.length && bytes[cursor] === MARKER_PREFIX) {
      cursor += 1;
    }
    if (cursor >= bytes.length) {
      throw new SurgeryFailure("TRUNCATED_DATA", "JPEG ends inside a marker prefix.", markerStart);
    }

    const marker = requiredByte(bytes, cursor);
    cursor += 1;
    if (marker === 0x00) {
      throw new SurgeryFailure(
        "MALFORMED_JPEG",
        "Found a stuffed zero byte outside entropy-coded data.",
        cursor - 1,
      );
    }
    if (marker === EOI) {
      if (!sawFrame || !sawScan) {
        throw new SurgeryFailure(
          "MALFORMED_JPEG",
          "JPEG must contain a valid frame and scan before its EOI marker.",
          markerStart,
        );
      }
      return { segments };
    }
    if (marker === SOI) {
      throw new SurgeryFailure("MALFORMED_JPEG", "Found a second SOI marker.", markerStart);
    }
    if (marker === TEM) {
      segmentCount = checkedSegmentCount(segmentCount, limits, markerStart);
      inEntropyData = markerCameFromEntropyData;
      continue;
    }
    if (isRestartMarker(marker)) {
      throw new SurgeryFailure(
        "MALFORMED_JPEG",
        "Found a restart marker outside entropy-coded data.",
        markerStart,
      );
    }

    segmentCount = checkedSegmentCount(segmentCount, limits, markerStart);
    if (cursor + 2 > bytes.length) {
      throw new SurgeryFailure("TRUNCATED_DATA", "JPEG segment length is truncated.", cursor);
    }
    const declaredLength = readUint16Big(bytes, cursor);
    if (declaredLength < 2) {
      throw new SurgeryFailure("MALFORMED_JPEG", "JPEG segment length is smaller than two.", cursor);
    }
    const payloadLength = declaredLength - 2;
    if (payloadLength > limits.maxSegmentBytes) {
      throw new SurgeryFailure(
        "LIMIT_EXCEEDED",
        `JPEG segment payload is ${payloadLength} bytes; the configured maximum is ${limits.maxSegmentBytes}.`,
        cursor,
      );
    }

    const payloadStart = cursor + 2;
    const segmentEnd = checkedEnd(payloadStart, payloadLength, bytes.length, "JPEG segment", cursor);
    const segment: JpegSegment = {
      marker,
      start: markerStart,
      end: segmentEnd,
      payloadStart,
      payloadEnd: segmentEnd,
    };
    segments.push(segment);

    if (isStartOfFrame(marker)) {
      if (payloadLength < 6) {
        throw new SurgeryFailure("MALFORMED_JPEG", "JPEG start-of-frame header is truncated.", payloadStart);
      }
      const precision = requiredByte(bytes, payloadStart);
      const height = readUint16Big(bytes, payloadStart + 1);
      const width = readUint16Big(bytes, payloadStart + 3);
      const componentCount = requiredByte(bytes, payloadStart + 5);
      if (
        precision === 0 ||
        width === 0 ||
        height === 0 ||
        componentCount === 0 ||
        payloadLength !== 6 + componentCount * 3
      ) {
        throw new SurgeryFailure(
          "MALFORMED_JPEG",
          "JPEG start-of-frame header or dimensions are invalid.",
          payloadStart,
        );
      }
      sawFrame = true;
    }

    if (marker === SOS) {
      const componentCount = payloadLength > 0 ? requiredByte(bytes, payloadStart) : 0;
      if (
        !sawFrame ||
        componentCount < 1 ||
        componentCount > 4 ||
        payloadLength !== 4 + componentCount * 2
      ) {
        throw new SurgeryFailure(
          "MALFORMED_JPEG",
          "JPEG start-of-scan header has an invalid component count, length, or frame order.",
          payloadStart,
        );
      }
      sawScan = true;
    }

    if (marker === DNL) {
      if (!markerCameFromEntropyData || payloadLength !== 2 || readUint16Big(bytes, payloadStart) === 0) {
        throw new SurgeryFailure(
          "MALFORMED_JPEG",
          "JPEG define-number-of-lines marker is invalid or outside scan data.",
          payloadStart,
        );
      }
    }

    if (isMetadataMarker(marker)) {
      metadataBytes = checkedSum(metadataBytes, payloadLength, "JPEG metadata size", markerStart);
      if (metadataBytes > limits.maxMetadataBytes) {
        throw new SurgeryFailure(
          "LIMIT_EXCEEDED",
          `JPEG metadata is larger than the configured maximum of ${limits.maxMetadataBytes} bytes.`,
          markerStart,
        );
      }
    }

    cursor = segmentEnd;
    if (marker === SOS || (markerCameFromEntropyData && marker === DNL)) {
      inEntropyData = true;
    }
  }

  throw new SurgeryFailure("TRUNCATED_DATA", "JPEG has no EOI marker.", bytes.length);
}

function findMarkerInEntropyData(bytes: Uint8Array, from: number): number {
  let cursor = from;
  while (cursor < bytes.length) {
    if (bytes[cursor] !== MARKER_PREFIX) {
      cursor += 1;
      continue;
    }

    const markerStart = cursor;
    while (cursor < bytes.length && bytes[cursor] === MARKER_PREFIX) {
      cursor += 1;
    }
    if (cursor >= bytes.length) {
      throw new SurgeryFailure(
        "TRUNCATED_DATA",
        "JPEG ends after an entropy-coded marker prefix.",
        markerStart,
      );
    }

    const marker = requiredByte(bytes, cursor);
    if (marker === 0x00 || isRestartMarker(marker)) {
      cursor += 1;
      continue;
    }
    return markerStart;
  }

  throw new SurgeryFailure("TRUNCATED_DATA", "JPEG entropy-coded data has no EOI marker.", bytes.length);
}

function checkedSegmentCount(current: number, limits: SecurityLimits, offset: number): number {
  const next = current + 1;
  if (next > limits.maxSegments) {
    throw new SurgeryFailure(
      "LIMIT_EXCEEDED",
      `JPEG contains more than ${limits.maxSegments} segments.`,
      offset,
    );
  }
  return next;
}

function classifySegment(bytes: Uint8Array, segment: JpegSegment): SegmentCategory {
  const payload = bytes.subarray(segment.payloadStart, segment.payloadEnd);
  if (segment.marker === 0xe1 && startsWith(payload, EXIF_IDENTIFIER)) {
    return "EXIF";
  }
  if (
    segment.marker === 0xe1 &&
    (startsWith(payload, XMP_IDENTIFIER) || startsWith(payload, EXTENDED_XMP_IDENTIFIER))
  ) {
    return "XMP";
  }
  if (segment.marker === 0xe2 && startsWith(payload, ICC_IDENTIFIER)) {
    return "ICC";
  }
  if (
    segment.marker === APP0 &&
    (startsWith(payload, JFIF_IDENTIFIER) || startsWith(payload, JFXX_IDENTIFIER))
  ) {
    return "JFIF";
  }
  if (segment.marker === 0xed && parseIptc(payload) !== null) {
    return "IPTC";
  }
  return "OTHER";
}

function findUnsupportedStructure(
  bytes: Uint8Array,
  segments: readonly JpegSegment[],
): { readonly message: string; readonly offset: number } | null {
  for (const segment of segments) {
    const payload = bytes.subarray(segment.payloadStart, segment.payloadEnd);
    if (segment.marker === 0xe2 && startsWith(payload, MPF_IDENTIFIER)) {
      return {
        message: "JPEG contains an MPF multi-picture structure; metadata surgery is refused until secondary-image offsets are supported.",
        offset: segment.start,
      };
    }
    if (segment.marker === 0xe1 && (startsWith(payload, XMP_IDENTIFIER) || startsWith(payload, EXTENDED_XMP_IDENTIFIER))) {
      const text = new TextDecoder("latin1").decode(payload);
      if (text.includes("http://ns.adobe.com/hdr-gain-map/1.0/") || text.includes("hdrgm:Version")) {
        return {
          message: "JPEG contains an Ultra HDR gain-map XMP structure; metadata surgery is refused until secondary-image offsets are supported.",
          offset: segment.start,
        };
      }
    }
  }
  return null;
}

function removalTargetForSegment(
  segment: JpegSegment,
  category: SegmentCategory,
  remove: ReadonlySet<RedactionTarget>,
  preserve: ReadonlySet<RedactionTarget>,
): RedactionTarget | null {
  const categoryTarget = category === "OTHER" ? null : category;
  if (
    categoryTarget !== null &&
    remove.has(categoryTarget) &&
    !categoryIsPreserved(categoryTarget, preserve)
  ) {
    return categoryTarget;
  }

  if (!remove.has("AllMetadata") || preserve.has("AllMetadata")) {
    return null;
  }
  // Unrecognized APP markers can be required for correct decoding (for example
  // Adobe APP14 in CMYK/YCCK JPEGs), so broad removal is intentionally limited
  // to recognized metadata classes and free-form COM segments.
  if (categoryTarget === null && segment.marker !== COM) {
    return null;
  }
  if (categoryTarget !== null && categoryIsPreserved(categoryTarget, preserve)) {
    return null;
  }
  return "AllMetadata";
}

function categoryIsPreserved(
  target: Exclude<SegmentCategory, "OTHER">,
  preserve: ReadonlySet<RedactionTarget>,
): boolean {
  if (preserve.has(target) || preserve.has("AllMetadata")) {
    return true;
  }
  if (target !== "EXIF") {
    return false;
  }
  for (const child of EXIF_CHILD_TARGETS) {
    if (preserve.has(child)) {
      return true;
    }
  }
  return false;
}

function broadExifTarget(
  remove: ReadonlySet<RedactionTarget>,
  preserve: ReadonlySet<RedactionTarget>,
): "AllMetadata" | "EXIF" | null {
  if (preserve.has("AllMetadata") || preserve.has("EXIF")) {
    return null;
  }
  if (remove.has("EXIF")) {
    return "EXIF";
  }
  return remove.has("AllMetadata") ? "AllMetadata" : null;
}

function hasSelectiveExifRequest(
  remove: ReadonlySet<RedactionTarget>,
  preserve: ReadonlySet<RedactionTarget>,
  broadTarget: "AllMetadata" | "EXIF" | null,
): boolean {
  if (preserve.has("AllMetadata") || preserve.has("EXIF")) {
    return false;
  }
  if (broadTarget !== null) {
    return true;
  }
  for (const target of EXIF_CHILD_TARGETS) {
    if (remove.has(target) && !isTargetPreserved(target, preserve)) {
      return true;
    }
  }
  return false;
}

function redactExifSegment(
  segment: Uint8Array,
  payloadStart: number,
  limits: SecurityLimits,
  context: SelectiveContext,
): SelectiveResult {
  if (!startsWith(segment.subarray(payloadStart), EXIF_IDENTIFIER)) {
    throw new SurgeryFailure("MALFORMED_EXIF", "APP1 segment lacks the EXIF identifier.", payloadStart);
  }
  const tiffStart = payloadStart + EXIF_IDENTIFIER.length;
  const transformed = redactExifTiffWithContext(segment.subarray(tiffStart), limits, context);
  segment.set(transformed.bytes, tiffStart);
  return { bytes: segment, counts: transformed.counts };
}

/**
 * Selectively remove EXIF fields from a standalone TIFF payload, such as a
 * PNG `eXIf` chunk. The caller owns atomicity: malformed input throws before
 * any output bytes are returned.
 */
export function redactExifTiff(
  tiff: Uint8Array,
  options: RedactOptions,
  limits: SecurityLimits,
): ExifTiffRedactionResult {
  const remove = new Set(options.remove);
  const preserve = new Set(options.preserve ?? []);
  return redactExifTiffWithContext(tiff, limits, {
    remove,
    preserve,
    broadTarget: broadExifTarget(remove, preserve),
  });
}

function redactExifTiffWithContext(
  tiff: Uint8Array,
  limits: SecurityLimits,
  context: SelectiveContext,
): ExifTiffRedactionResult {
  const parsed = parseExifTiff(tiff, limits);
  const selections = new Map<IfdEntry, RedactionTarget>();
  const counts = new Map<RedactionTarget, number>();

  for (const directory of parsed.directories) {
    for (const entry of directory.entries) {
      const target = targetForEntry(directory.kind, entry, context);
      if (target !== null) {
        selections.set(entry, target);
        increment(counts, target);
      }
    }
  }

  if (selections.size === 0 && context.broadTarget === null) {
    return { bytes: new Uint8Array(tiff), counts };
  }

  validateWipeRanges(parsed.directories, selections, 0);
  const output = new Uint8Array(tiff);
  const original = new Uint8Array(tiff);

  for (const directory of parsed.directories) {
    compactDirectory(output, original, directory, parsed.order, selections);
  }
  for (const [entry] of selections) {
    if (entry.valueRange !== null) {
      output.fill(0, entry.valueRange.start, entry.valueRange.end);
    }
  }
  if (context.broadTarget !== null) {
    scrubUnretainedExifBytes(output, parsed.directories, selections, 0);
  }

  return { bytes: output, counts };
}

function scrubUnretainedExifBytes(
  output: Uint8Array,
  directories: readonly IfdDirectory[],
  selections: ReadonlyMap<IfdEntry, RedactionTarget>,
  tiffStart: number,
): void {
  const compacted = new Uint8Array(output);
  output.fill(0, tiffStart + 8);

  for (const directory of directories) {
    const retained = directory.entries.filter((entry) => !selections.has(entry));
    const compactedStructureEnd = directory.entriesStart + retained.length * 12 + 4;
    output.set(
      compacted.subarray(directory.countOffset, compactedStructureEnd),
      directory.countOffset,
    );
    for (const entry of retained) {
      if (entry.valueRange !== null) {
        output.set(
          compacted.subarray(entry.valueRange.start, entry.valueRange.end),
          entry.valueRange.start,
        );
      }
    }
  }
}

function parseExifTiff(segment: Uint8Array, limits: SecurityLimits): ParsedExif {
  const tiffStart = 0;
  if (segment.length < 8) {
    throw new SurgeryFailure("TRUNCATED_DATA", "EXIF TIFF header is truncated.", 0);
  }

  const first = requiredByte(segment, tiffStart);
  const second = requiredByte(segment, tiffStart + 1);
  let order: ByteOrder;
  if (first === 0x49 && second === 0x49) {
    order = "little";
  } else if (first === 0x4d && second === 0x4d) {
    order = "big";
  } else {
    throw new SurgeryFailure("MALFORMED_EXIF", "EXIF TIFF byte order is invalid.", tiffStart);
  }
  if (readUint16(segment, tiffStart + 2, order) !== 42) {
    throw new SurgeryFailure("MALFORMED_EXIF", "EXIF TIFF magic value is invalid.", tiffStart + 2);
  }

  const firstIfd = readUint32(segment, tiffStart + 4, order);
  if (firstIfd === 0) {
    throw new SurgeryFailure("MALFORMED_EXIF", "EXIF has no IFD0 directory.", tiffStart + 4);
  }

  const directories: IfdDirectory[] = [];
  const byOffset = new Map<number, IfdKind>();
  let totalEntries = 0;

  const visit = (relativeOffset: number, kind: IfdKind, depth: number): void => {
    if (relativeOffset === 0) {
      return;
    }
    if (depth > limits.maxIfdDepth) {
      throw new SurgeryFailure(
        "LIMIT_EXCEEDED",
        `EXIF IFD nesting exceeds the configured maximum of ${limits.maxIfdDepth}.`,
        tiffStart + relativeOffset,
      );
    }

    const previousKind = byOffset.get(relativeOffset);
    if (previousKind !== undefined) {
      throw new SurgeryFailure(
        "MALFORMED_EXIF",
        previousKind === kind
          ? "EXIF directory pointers contain a cycle or a reused directory."
          : "Two EXIF directory pointers alias the same offset with different meanings.",
        tiffStart + relativeOffset,
      );
    }
    byOffset.set(relativeOffset, kind);

    const countOffset = relativeToAbsolute(tiffStart, relativeOffset, segment.length, 2);
    const count = readUint16(segment, countOffset, order);
    totalEntries = checkedSum(totalEntries, count, "EXIF IFD entry count", countOffset);
    if (totalEntries > limits.maxIfdEntries) {
      throw new SurgeryFailure(
        "LIMIT_EXCEEDED",
        `EXIF contains more than ${limits.maxIfdEntries} IFD entries.`,
        countOffset,
      );
    }

    const tableBytes = checkedProduct(count, 12, "EXIF IFD table size", countOffset);
    const entriesStart = countOffset + 2;
    const structureEnd = checkedEnd(entriesStart, tableBytes + 4, segment.length, "EXIF IFD", countOffset);
    const entries: IfdEntry[] = [];

    for (let index = 0; index < count; index += 1) {
      const entryOffset = entriesStart + index * 12;
      const tag = readUint16(segment, entryOffset, order);
      const type = readUint16(segment, entryOffset + 2, order);
      const componentCount = readUint32(segment, entryOffset + 4, order);
      const typeBytes = tiffTypeBytes(type);
      if (typeBytes === null) {
        throw new SurgeryFailure(
          "MALFORMED_EXIF",
          `EXIF tag 0x${tag.toString(16)} uses unknown TIFF type ${type}.`,
          entryOffset + 2,
        );
      }
      const valueBytes = checkedProduct(
        componentCount,
        typeBytes,
        "EXIF value size",
        entryOffset + 4,
      );
      if (valueBytes > limits.maxValueBytes) {
        throw new SurgeryFailure(
          "LIMIT_EXCEEDED",
          `EXIF value is ${valueBytes} bytes; the configured maximum is ${limits.maxValueBytes}.`,
          entryOffset + 4,
        );
      }

      let valueRange: ByteRange | null = null;
      if (valueBytes > 4) {
        const valueRelativeOffset = readUint32(segment, entryOffset + 8, order);
        const valueStart = relativeToAbsolute(
          tiffStart,
          valueRelativeOffset,
          segment.length,
          valueBytes,
        );
        valueRange = { start: valueStart, end: valueStart + valueBytes };
      }
      entries.push({
        tag,
        type,
        count: componentCount,
        entryOffset,
        valueRange,
      });
    }

    const nextOffset = readUint32(segment, structureEnd - 4, order);
    const directory: IfdDirectory = {
      kind,
      relativeOffset,
      countOffset,
      entriesStart,
      structureEnd,
      entries,
      nextOffset,
      depth,
    };
    directories.push(directory);

    for (const entry of entries) {
      const pointedKind = pointerKind(entry.tag);
      if (pointedKind === null) {
        continue;
      }
      if ((entry.type !== 4 && entry.type !== 13) || entry.count !== 1) {
        throw new SurgeryFailure(
          "MALFORMED_EXIF",
          `EXIF directory pointer 0x${entry.tag.toString(16)} has an invalid type or count.`,
          entry.entryOffset,
        );
      }
      const pointedOffset = readUint32(segment, entry.entryOffset + 8, order);
      visit(pointedOffset, pointedKind, depth + 1);
    }

    if (nextOffset !== 0) {
      visit(nextOffset, kind === "IFD0" ? "IFD1" : kind, depth + 1);
    }
  };

  visit(firstIfd, "IFD0", 1);
  validateExifRanges(directories, tiffStart);
  return { order, directories };
}

function validateExifRanges(directories: readonly IfdDirectory[], tiffStart: number): void {
  const structures: ByteRange[] = [{ start: tiffStart, end: tiffStart + 8 }];
  for (const directory of directories) {
    const range = { start: directory.countOffset, end: directory.structureEnd };
    for (const previous of structures) {
      if (rangesOverlap(range, previous)) {
        throw new SurgeryFailure(
          "UNSAFE_OFFSET",
          "EXIF directory structures overlap.",
          directory.countOffset,
        );
      }
    }
    structures.push(range);
  }

  for (const directory of directories) {
    for (const entry of directory.entries) {
      if (entry.valueRange === null) {
        continue;
      }
      for (const structure of structures) {
        if (rangesOverlap(entry.valueRange, structure)) {
          throw new SurgeryFailure(
            "UNSAFE_OFFSET",
            "An EXIF value overlaps a TIFF header or IFD table.",
            entry.valueRange.start,
          );
        }
      }
    }
  }
}

function validateWipeRanges(
  directories: readonly IfdDirectory[],
  selections: ReadonlyMap<IfdEntry, RedactionTarget>,
  tiffStart: number,
): void {
  const retainedRanges: ByteRange[] = [{ start: tiffStart, end: tiffStart + 8 }];
  for (const directory of directories) {
    retainedRanges.push({ start: directory.countOffset, end: directory.structureEnd });
    for (const entry of directory.entries) {
      if (!selections.has(entry) && entry.valueRange !== null) {
        retainedRanges.push(entry.valueRange);
      }
    }
  }

  for (const [entry] of selections) {
    if (entry.valueRange === null) {
      continue;
    }
    for (const retained of retainedRanges) {
      if (rangesOverlap(entry.valueRange, retained)) {
        throw new SurgeryFailure(
          "UNSAFE_OFFSET",
          "A removed EXIF value overlaps metadata that must be retained.",
          entry.valueRange.start,
        );
      }
    }
  }
}

function compactDirectory(
  output: Uint8Array,
  original: Uint8Array,
  directory: IfdDirectory,
  order: ByteOrder,
  selections: ReadonlyMap<IfdEntry, RedactionTarget>,
): void {
  const retained = directory.entries.filter((entry) => !selections.has(entry));
  if (retained.length === directory.entries.length) {
    return;
  }

  output.fill(0, directory.entriesStart, directory.structureEnd);
  writeUint16(output, directory.countOffset, retained.length, order);
  for (let index = 0; index < retained.length; index += 1) {
    const entry = retained[index];
    if (entry === undefined) {
      throw new SurgeryFailure("MALFORMED_EXIF", "Missing retained EXIF entry.");
    }
    output.set(
      original.subarray(entry.entryOffset, entry.entryOffset + 12),
      directory.entriesStart + index * 12,
    );
  }

  const nextPosition = directory.entriesStart + retained.length * 12;
  writeUint32(output, nextPosition, directory.nextOffset, order);
}

function targetForEntry(
  kind: IfdKind,
  entry: IfdEntry,
  context: SelectiveContext,
): RedactionTarget | null {
  const mapped = mappedTarget(kind, entry.tag);

  if (mapped !== null && context.remove.has(mapped) && !isTargetPreserved(mapped, context.preserve)) {
    return mapped;
  }
  if (
    mapped === "SerialNumber" &&
    context.remove.has("SerialNumber") &&
    !isTargetPreserved("SerialNumber", context.preserve)
  ) {
    return "SerialNumber";
  }

  if (kind === "GPSIFD" && context.remove.has("GPS") && !context.preserve.has("GPS")) {
    if (mapped === null || !isTargetPreserved(mapped, context.preserve)) {
      return "GPS";
    }
  }
  if (entry.tag === GPS_POINTER && context.remove.has("GPS") && !gpsMustBePreserved(context.preserve)) {
    return "GPS";
  }

  if (context.broadTarget === null) {
    return null;
  }
  if (entryIsPreserved(kind, entry, mapped, context.preserve)) {
    return null;
  }
  return context.broadTarget;
}

function mappedTarget(kind: IfdKind, tag: number): RedactionTarget | null {
  if (kind === "GPSIFD") {
    switch (tag) {
      case 0x0001:
      case 0x0002:
        return "GPSLatitude";
      case 0x0003:
      case 0x0004:
        return "GPSLongitude";
      case 0x0005:
      case 0x0006:
        return "GPSAltitude";
      default:
        return null;
    }
  }

  switch (tag) {
    case 0x010f:
      return "Make";
    case 0x0110:
      return "Model";
    case 0x0112:
      return "Orientation";
    case 0x0131:
      return "Software";
    case 0x0132:
      return "DateTime";
    case 0x013b:
      return "Artist";
    case 0x8298:
      return "Copyright";
    case 0x829a:
      return "ExposureTime";
    case 0x829d:
      return "FNumber";
    case 0x8827:
      return "ISOSpeedRatings";
    case 0x9003:
      return "DateTimeOriginal";
    case 0x9209:
      return "Flash";
    case 0x920a:
      return "FocalLength";
    case 0xa431:
    case 0xa435:
    case 0xc62f:
      return "SerialNumber";
    default:
      return null;
  }
}

function entryIsPreserved(
  kind: IfdKind,
  entry: IfdEntry,
  mapped: RedactionTarget | null,
  preserve: ReadonlySet<RedactionTarget>,
): boolean {
  if (preserve.has("AllMetadata") || preserve.has("EXIF")) {
    return true;
  }
  if (mapped !== null && isTargetPreserved(mapped, preserve)) {
    return true;
  }
  if (kind === "GPSIFD" && preserve.has("GPS")) {
    return true;
  }
  if (entry.tag === GPS_POINTER) {
    return gpsMustBePreserved(preserve);
  }
  if (entry.tag === EXIF_POINTER) {
    for (const target of EXIF_IFD_TARGETS) {
      if (preserve.has(target)) {
        return true;
      }
    }
  }
  return false;
}

function gpsMustBePreserved(preserve: ReadonlySet<RedactionTarget>): boolean {
  if (preserve.has("AllMetadata") || preserve.has("EXIF") || preserve.has("GPS")) {
    return true;
  }
  for (const target of GPS_FIELD_TARGETS) {
    if (preserve.has(target)) {
      return true;
    }
  }
  return false;
}

function isTargetPreserved(
  target: RedactionTarget,
  preserve: ReadonlySet<RedactionTarget>,
): boolean {
  if (preserve.has("AllMetadata") || preserve.has("EXIF") || preserve.has(target)) {
    return true;
  }
  return GPS_FIELD_TARGETS.has(target) && preserve.has("GPS");
}

function rebuildJpeg(
  input: Uint8Array,
  segments: readonly JpegSegment[],
  removed: ReadonlySet<number>,
  replacements: ReadonlyMap<number, Uint8Array>,
): Uint8Array {
  let removedBytes = 0;
  for (const segment of segments) {
    if (removed.has(segment.start)) {
      removedBytes += segment.end - segment.start;
    }
  }

  const output = new Uint8Array(input.length - removedBytes);
  let sourceCursor = 0;
  let outputCursor = 0;
  for (const segment of segments) {
    if (!removed.has(segment.start) && !replacements.has(segment.start)) {
      continue;
    }
    output.set(input.subarray(sourceCursor, segment.start), outputCursor);
    outputCursor += segment.start - sourceCursor;

    const replacement = replacements.get(segment.start);
    if (!removed.has(segment.start) && replacement !== undefined) {
      output.set(replacement, outputCursor);
      outputCursor += replacement.length;
    }
    sourceCursor = segment.end;
  }
  output.set(input.subarray(sourceCursor), outputCursor);
  return output;
}

function result(
  data: Uint8Array,
  counts: ReadonlyMap<RedactionTarget, number>,
  options: RedactOptions,
  warnings: readonly MetadataWarning[],
): SurgeryResult {
  const removed: RedactionRecord[] = [];
  const emitted = new Set<RedactionTarget>();
  for (const target of options.remove) {
    if (emitted.has(target)) {
      continue;
    }
    emitted.add(target);
    const occurrences = counts.get(target) ?? 0;
    if (occurrences > 0) {
      removed.push({ target, occurrences });
    }
  }
  return { data, format: "jpeg", removed, warnings };
}

function makeWarning(failure: SurgeryFailure, limits: SecurityLimits): MetadataWarning | null {
  if (limits.maxWarnings < 1) {
    return null;
  }
  if (failure.offset === undefined) {
    return { code: failure.code, message: failure.message, severity: "error" };
  }
  return {
    code: failure.code,
    message: failure.message,
    severity: "error",
    offset: failure.offset,
  };
}

function toFailure(error: unknown): SurgeryFailure {
  if (error instanceof SurgeryFailure) {
    return error;
  }
  return new SurgeryFailure(
    "REDACTION_SKIPPED",
    error instanceof Error ? `JPEG redaction failed safely: ${error.message}` : "JPEG redaction failed safely.",
  );
}

function failureAtSegmentOffset(error: unknown, segmentStart: number): SurgeryFailure {
  const failure = toFailure(error);
  return new SurgeryFailure(
    failure.code,
    failure.message,
    failure.offset === undefined ? undefined : segmentStart + failure.offset,
  );
}

function pointerKind(tag: number): IfdKind | null {
  switch (tag) {
    case EXIF_POINTER:
      return "ExifIFD";
    case GPS_POINTER:
      return "GPSIFD";
    case INTEROP_POINTER:
      return "InteropIFD";
    default:
      return null;
  }
}

function tiffTypeBytes(type: number): number | null {
  switch (type) {
    case 1:
    case 2:
    case 6:
    case 7:
      return 1;
    case 3:
    case 8:
      return 2;
    case 4:
    case 9:
    case 11:
    case 13:
      return 4;
    case 5:
    case 10:
    case 12:
      return 8;
    default:
      return null;
  }
}

function isMetadataMarker(marker: number): boolean {
  return (marker >= APP0 && marker <= APP15) || marker === COM;
}

function isRestartMarker(marker: number): boolean {
  return marker >= 0xd0 && marker <= 0xd7;
}

function isStartOfFrame(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

function startsWith(bytes: Uint8Array, prefix: Uint8Array): boolean {
  if (bytes.length < prefix.length) {
    return false;
  }
  for (let index = 0; index < prefix.length; index += 1) {
    if (bytes[index] !== prefix[index]) {
      return false;
    }
  }
  return true;
}

function asciiBytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index);
  }
  return bytes;
}

function requiredByte(bytes: Uint8Array, offset: number): number {
  const value = bytes[offset];
  if (value === undefined) {
    throw new SurgeryFailure("TRUNCATED_DATA", "Unexpected end of binary data.", offset);
  }
  return value;
}

function readUint16Big(bytes: Uint8Array, offset: number): number {
  return requiredByte(bytes, offset) * 0x100 + requiredByte(bytes, offset + 1);
}

function readUint16(bytes: Uint8Array, offset: number, order: ByteOrder): number {
  const first = requiredByte(bytes, offset);
  const second = requiredByte(bytes, offset + 1);
  return order === "little" ? first + second * 0x100 : first * 0x100 + second;
}

function readUint32(bytes: Uint8Array, offset: number, order: ByteOrder): number {
  const first = requiredByte(bytes, offset);
  const second = requiredByte(bytes, offset + 1);
  const third = requiredByte(bytes, offset + 2);
  const fourth = requiredByte(bytes, offset + 3);
  if (order === "little") {
    return first + second * 0x100 + third * 0x10000 + fourth * 0x1000000;
  }
  return first * 0x1000000 + second * 0x10000 + third * 0x100 + fourth;
}

function writeUint16(bytes: Uint8Array, offset: number, value: number, order: ByteOrder): void {
  if (order === "little") {
    bytes[offset] = value & 0xff;
    bytes[offset + 1] = (value >>> 8) & 0xff;
  } else {
    bytes[offset] = (value >>> 8) & 0xff;
    bytes[offset + 1] = value & 0xff;
  }
}

function writeUint32(bytes: Uint8Array, offset: number, value: number, order: ByteOrder): void {
  if (order === "little") {
    bytes[offset] = value & 0xff;
    bytes[offset + 1] = (value >>> 8) & 0xff;
    bytes[offset + 2] = (value >>> 16) & 0xff;
    bytes[offset + 3] = (value >>> 24) & 0xff;
  } else {
    bytes[offset] = (value >>> 24) & 0xff;
    bytes[offset + 1] = (value >>> 16) & 0xff;
    bytes[offset + 2] = (value >>> 8) & 0xff;
    bytes[offset + 3] = value & 0xff;
  }
}

function relativeToAbsolute(
  base: number,
  relative: number,
  totalLength: number,
  requiredLength: number,
): number {
  const absolute = checkedSum(base, relative, "EXIF offset", base);
  const end = checkedSum(absolute, requiredLength, "EXIF data range", absolute);
  if (end > totalLength) {
    throw new SurgeryFailure("UNSAFE_OFFSET", "EXIF offset points outside its APP1 segment.", absolute);
  }
  return absolute;
}

function checkedEnd(
  start: number,
  length: number,
  totalLength: number,
  label: string,
  offset: number,
): number {
  const end = checkedSum(start, length, `${label} range`, offset);
  if (start < 0 || length < 0 || end > totalLength) {
    throw new SurgeryFailure("TRUNCATED_DATA", `${label} extends beyond its containing data.`, offset);
  }
  return end;
}

function checkedSum(left: number, right: number, label: string, offset: number): number {
  const value = left + right;
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new SurgeryFailure("UNSAFE_OFFSET", `${label} is not a safe integer.`, offset);
  }
  return value;
}

function checkedProduct(left: number, right: number, label: string, offset: number): number {
  const value = left * right;
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new SurgeryFailure("UNSAFE_OFFSET", `${label} is not a safe integer.`, offset);
  }
  return value;
}

function rangesOverlap(left: ByteRange, right: ByteRange): boolean {
  return left.start < right.end && right.start < left.end;
}

function increment(counts: Map<RedactionTarget, number>, target: RedactionTarget): void {
  counts.set(target, (counts.get(target) ?? 0) + 1);
}

function mergeCounts(
  destination: Map<RedactionTarget, number>,
  source: ReadonlyMap<RedactionTarget, number>,
): void {
  for (const [target, count] of source) {
    destination.set(target, (destination.get(target) ?? 0) + count);
  }
}
