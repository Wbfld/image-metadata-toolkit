import type {
  ExifData,
  ExifDataType,
  ExifIfd,
  Integer64Value,
  MetadataField,
  MetadataValue,
  MetadataWarning,
  RationalValue,
  SecurityLimits,
  WarningCode,
  WarningSeverity,
} from "../types.js";
import { getTagDefinition, formatUnknownTag } from "../normalize/descriptions.js";
import { DEFAULT_METADATA_REGISTRY, type MetadataRegistry } from "../registry.js";
import {
  displayExifValue,
  interpretExifValue,
  normalizeExifFields,
} from "../normalize/values.js";

export interface ParsedExif {
  readonly exif: ExifData | null;
  readonly fields: readonly MetadataField[];
  readonly warnings: readonly MetadataWarning[];
}

type ByteOrder = "little-endian" | "big-endian";

interface IfdWorkItem {
  readonly name: "IFD0" | "ExifIFD" | "GPSIFD" | "InteropIFD" | "IFD1";
  readonly offset: number;
  readonly depth: number;
  readonly sourceIfd?: string;
  readonly sourceTag?: number;
}

interface TiffTypeDefinition {
  readonly type: ExifDataType;
  readonly size: number;
}

interface DecodeBudget {
  remainingBytes: number;
}

interface StructuralRange {
  readonly offset: number;
  readonly length: number;
  readonly category: "header" | "ifd" | "value";
  readonly label: string;
}

interface DecodedValue {
  readonly raw: MetadataValue;
  readonly interpretable: boolean;
}

const ASCII_DECODE_CHUNK_BYTES = 8_192;

const TIFF_TYPES: Readonly<Record<number, TiffTypeDefinition>> = {
  1: { type: "BYTE", size: 1 },
  2: { type: "ASCII", size: 1 },
  3: { type: "SHORT", size: 2 },
  4: { type: "LONG", size: 4 },
  5: { type: "RATIONAL", size: 8 },
  6: { type: "SBYTE", size: 1 },
  7: { type: "UNDEFINED", size: 1 },
  8: { type: "SSHORT", size: 2 },
  9: { type: "SLONG", size: 4 },
  10: { type: "SRATIONAL", size: 8 },
  11: { type: "FLOAT", size: 4 },
  12: { type: "DOUBLE", size: 8 },
  13: { type: "IFD", size: 4 },
};

const BIG_TIFF_TYPES: Readonly<Record<number, TiffTypeDefinition>> = {
  ...TIFF_TYPES,
  16: { type: "LONG8", size: 8 },
  17: { type: "SLONG8", size: 8 },
  18: { type: "IFD8", size: 8 },
};

/**
 * Parse a classic TIFF byte stream used by an EXIF APP1 payload.
 *
 * Offsets in TIFF are relative to the first byte passed here. The optional base
 * offset changes warning locations only, allowing a JPEG parser to report file-
 * relative positions while keeping TIFF offset arithmetic isolated.
 */
export function parseExif(
  tiffBytes: Uint8Array,
  limits: SecurityLimits,
  warningBaseOffset = 0,
  selectedTags?: ReadonlySet<string> | null,
  registry: MetadataRegistry = DEFAULT_METADATA_REGISTRY,
): ParsedExif {
  const maxWarnings = finiteLimit(limits.maxWarnings);
  const warnings: MetadataWarning[] = [];
  const rawFields: MetadataField[] = [];
  const ifds: ExifIfd[] = [];
  const baseOffset = Number.isSafeInteger(warningBaseOffset) && warningBaseOffset >= 0 ? warningBaseOffset : 0;

  const addWarning = (
    code: WarningCode,
    message: string,
    severity: WarningSeverity,
    relativeOffset?: number,
    length?: number,
    ifd?: string,
    tag?: number,
  ): void => {
    if (warnings.length >= maxWarnings) return;
    const warning: {
      code: WarningCode;
      message: string;
      severity: WarningSeverity;
      offset?: number;
      length?: number;
      ifd?: string;
      tag?: number;
    } = { code, message, severity };
    if (relativeOffset !== undefined) {
      const absolute = baseOffset + relativeOffset;
      if (Number.isSafeInteger(absolute) && absolute >= 0) warning.offset = absolute;
    }
    if (length !== undefined && Number.isSafeInteger(length) && length >= 0) warning.length = length;
    if (ifd !== undefined) warning.ifd = ifd;
    if (tag !== undefined) warning.tag = tag;
    warnings.push(warning);
  };

  if (tiffBytes.byteLength < 8) {
    addWarning(
      "TRUNCATED_DATA",
      "The TIFF/EXIF header is shorter than 8 bytes.",
      "error",
      0,
      tiffBytes.byteLength,
    );
    return { exif: null, fields: [], warnings };
  }

  const first = tiffBytes[0];
  const second = tiffBytes[1];
  let byteOrder: ByteOrder;
  if (first === 0x49 && second === 0x49) byteOrder = "little-endian";
  else if (first === 0x4d && second === 0x4d) byteOrder = "big-endian";
  else {
    addWarning("MALFORMED_EXIF", "Invalid TIFF byte-order marker; expected II or MM.", "error", 0, 2);
    return { exif: null, fields: [], warnings };
  }

  const view = new DataView(tiffBytes.buffer, tiffBytes.byteOffset, tiffBytes.byteLength);
  const littleEndian = byteOrder === "little-endian";
  const magic = view.getUint16(2, littleEndian);
  if (magic !== 42) {
    addWarning("MALFORMED_EXIF", `Invalid TIFF magic value ${magic}; expected 42.`, "error", 2, 2);
    return { exif: null, fields: [], warnings };
  }

  const firstIfdOffset = view.getUint32(4, littleEndian);
  if (firstIfdOffset === 0) {
    addWarning("MALFORMED_EXIF", "TIFF/EXIF has no root IFD.", "error", 4, 4);
    return { exif: null, fields: [], warnings };
  }
  const queue: IfdWorkItem[] = [];
  queue.push({ name: "IFD0", offset: firstIfdOffset, depth: 0 });
  const visited = new Map<number, string>();
  const structuralRanges: StructuralRange[] = [
    { offset: 0, length: 8, category: "header", label: "TIFF header" },
  ];
  const maxEntries = finiteLimit(limits.maxIfdEntries);
  const maxDepth = finiteLimit(limits.maxIfdDepth);
  const maxValueBytes = finiteLimit(limits.maxValueBytes);
  const maxStringBytes = Math.min(maxValueBytes, finiteLimit(limits.maxStringBytes));
  const decodeBudget: DecodeBudget = { remainingBytes: finiteLimit(limits.maxMetadataBytes) };
  let entriesVisited = 0;

  const enqueuePointer = (
    field: MetadataField,
    targetName: IfdWorkItem["name"],
    depth: number,
  ): void => {
    if (
      (field.type !== "LONG" && field.type !== "IFD") ||
      field.count !== 1 ||
      typeof field.raw !== "number" ||
      !Number.isInteger(field.raw)
    ) {
      addWarning(
        "MALFORMED_EXIF",
        `${field.name} must contain one LONG or IFD offset.`,
        "warning",
        undefined,
        undefined,
        field.ifd,
        field.tag,
      );
      return;
    }
    if (field.raw === 0) return;
    queue.push({
      name: targetName,
      offset: field.raw,
      depth,
      sourceIfd: field.ifd,
      sourceTag: field.tag,
    });
  };

  try {
    while (queue.length > 0) {
      const work = queue.shift();
      if (work === undefined) break;
      if (work.depth > maxDepth) {
        addWarning(
          "LIMIT_EXCEEDED",
          `TIFF IFD nesting exceeds the configured maximum depth of ${maxDepth}.`,
          "error",
          work.offset,
          undefined,
          work.sourceIfd ?? work.name,
          work.sourceTag,
        );
        continue;
      }
      const previousName = visited.get(work.offset);
      if (previousName !== undefined) {
        addWarning(
          "MALFORMED_EXIF",
          `IFD offset ${work.offset} was already visited as ${previousName}; cyclic or duplicate pointer ignored.`,
          "warning",
          work.offset,
          undefined,
          work.sourceIfd ?? work.name,
          work.sourceTag,
        );
        continue;
      }
      if (!validRange(tiffBytes.byteLength, work.offset, 2)) {
        addWarning(
          "UNSAFE_OFFSET",
          `${work.name} offset ${work.offset} is outside the TIFF data.`,
          "error",
          work.offset,
          undefined,
          work.sourceIfd ?? work.name,
          work.sourceTag,
        );
        continue;
      }
      if (work.offset < 8) {
        addWarning(
          "UNSAFE_OFFSET",
          `${work.name} offset ${work.offset} overlaps the TIFF header.`,
          "error",
          work.offset,
          2,
          work.sourceIfd ?? work.name,
          work.sourceTag,
        );
        continue;
      }

      visited.set(work.offset, work.name);
      const declaredCount = view.getUint16(work.offset, littleEndian);
      const entriesOffset = work.offset + 2;
      const declaredEntriesBytes = declaredCount * 12;
      const completeTable = validRange(tiffBytes.byteLength, entriesOffset, declaredEntriesBytes + 4);
      const tableLength = completeTable
        ? 2 + declaredEntriesBytes + 4
        : tiffBytes.byteLength - work.offset;
      const tableConflict = overlappingRange(structuralRanges, work.offset, tableLength);
      if (tableConflict !== undefined) {
        addWarning(
          "UNSAFE_OFFSET",
          `${work.name} overlaps ${tableConflict.label}; the ambiguous directory was not decoded.`,
          "error",
          work.offset,
          tableLength,
          work.sourceIfd ?? work.name,
          work.sourceTag,
        );
        continue;
      }
      structuralRanges.push({
        offset: work.offset,
        length: tableLength,
        category: "ifd",
        label: `${work.name} table`,
      });
      ifds.push({ name: work.name, offset: work.offset, entryCount: declaredCount });
      let availableCount = declaredCount;
      if (!completeTable) {
        const availableBytes = Math.max(0, tiffBytes.byteLength - entriesOffset);
        availableCount = Math.min(declaredCount, Math.floor(availableBytes / 12));
        addWarning(
          "TRUNCATED_DATA",
          `${work.name} declares ${declaredCount} entries but its table is truncated.`,
          "error",
          work.offset,
          Math.max(0, tiffBytes.byteLength - work.offset),
          work.name,
        );
      }

      const remainingEntryBudget = Math.max(0, maxEntries - entriesVisited);
      const countToParse = Math.min(availableCount, remainingEntryBudget);
      if (availableCount > remainingEntryBudget) {
        addWarning(
          "LIMIT_EXCEEDED",
          `TIFF entries exceed the configured maximum of ${maxEntries}; remaining entries were not decoded.`,
          "error",
          entriesOffset + countToParse * 12,
          undefined,
          work.name,
        );
      }

      for (let index = 0; index < countToParse; index += 1) {
        const entryOffset = entriesOffset + index * 12;
        entriesVisited += 1;
        const tag = view.getUint16(entryOffset, littleEndian);
        const isPointer = (work.name === "IFD0" && (tag === 0x8769 || tag === 0x8825)) || (work.name === "ExifIFD" && tag === 0xa005);
        const definition = getTagDefinition(work.name, tag, registry);
        const stableId = `${work.name}:0x${hexTag(tag)}`;
        const selected = selectedTags === undefined || selectedTags === null ||
          selectedTags.has(definition?.name ?? formatUnknownTag(tag)) || selectedTags.has(stableId);
        if (!selected && !isPointer) continue;
        const field = decodeEntry(
          tiffBytes,
          view,
          littleEndian,
          work.name,
          entryOffset,
          maxValueBytes,
          maxStringBytes,
          decodeBudget,
          structuralRanges,
          addWarning,
          registry,
        );
        if (field === null) continue;
        if (selected) rawFields.push(field);

        if (work.name === "IFD0" && field.tag === 0x8769) {
          enqueuePointer(field, "ExifIFD", work.depth + 1);
        } else if (work.name === "IFD0" && field.tag === 0x8825) {
          enqueuePointer(field, "GPSIFD", work.depth + 1);
        } else if (work.name === "ExifIFD" && field.tag === 0xa005) {
          enqueuePointer(field, "InteropIFD", work.depth + 1);
        }
      }

      if (completeTable && work.name === "IFD0") {
        const nextOffsetLocation = entriesOffset + declaredEntriesBytes;
        const nextIfdOffset = view.getUint32(nextOffsetLocation, littleEndian);
        if (nextIfdOffset !== 0) {
          queue.push({ name: "IFD1", offset: nextIfdOffset, depth: work.depth + 1, sourceIfd: work.name });
        }
      }
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown decoder failure";
    addWarning("MALFORMED_EXIF", `EXIF decoding stopped safely: ${detail}.`, "error");
  }

  const normalized = normalizeExifFields(rawFields, registry);
  for (const warning of normalized.warnings) {
    if (warnings.length >= maxWarnings) break;
    warnings.push(warning);
  }

  const exif: ExifData = { byteOrder, fields: rawFields, ifds };
  return { exif, fields: normalized.fields, warnings };
}

/** Parse a bounded BigTIFF directory tree without materialising pixel data. */
export function parseBigTiff(
  tiffBytes: Uint8Array,
  limits: SecurityLimits,
  warningBaseOffset = 0,
  selectedTags?: ReadonlySet<string> | null,
  registry: MetadataRegistry = DEFAULT_METADATA_REGISTRY,
): ParsedExif {
  const warnings: MetadataWarning[] = [];
  const rawFields: MetadataField[] = [];
  const ifds: ExifIfd[] = [];
  const maxWarnings = finiteLimit(limits.maxWarnings);
  const baseOffset = Number.isSafeInteger(warningBaseOffset) && warningBaseOffset >= 0 ? warningBaseOffset : 0;
  const warn = (code: WarningCode, message: string, severity: WarningSeverity, offset?: number, length?: number, ifd?: string, tag?: number): void => {
    if (warnings.length >= maxWarnings) return;
    const warning: {
      code: WarningCode;
      message: string;
      severity: WarningSeverity;
      offset?: number;
      length?: number;
      ifd?: string;
      tag?: number;
    } = { code, message, severity };
    if (offset !== undefined && Number.isSafeInteger(offset) && offset >= 0 && Number.isSafeInteger(baseOffset + offset)) warning.offset = baseOffset + offset;
    if (length !== undefined && Number.isSafeInteger(length) && length >= 0) warning.length = length;
    if (ifd !== undefined) warning.ifd = ifd;
    if (tag !== undefined) warning.tag = tag;
    warnings.push(warning);
  };
  if (tiffBytes.byteLength < 16) {
    warn("TRUNCATED_DATA", "The BigTIFF header is shorter than 16 bytes.", "error", 0, tiffBytes.byteLength);
    return { exif: null, fields: [], warnings };
  }
  const first = tiffBytes[0];
  const second = tiffBytes[1];
  const byteOrder: ByteOrder | null = first === 0x49 && second === 0x49 ? "little-endian" : first === 0x4d && second === 0x4d ? "big-endian" : null;
  if (byteOrder === null) {
    warn("MALFORMED_EXIF", "Invalid BigTIFF byte-order marker; expected II or MM.", "error", 0, 2);
    return { exif: null, fields: [], warnings };
  }
  const littleEndian = byteOrder === "little-endian";
  const view = new DataView(tiffBytes.buffer, tiffBytes.byteOffset, tiffBytes.byteLength);
  if (view.getUint16(2, littleEndian) !== 43 || view.getUint16(4, littleEndian) !== 8 || view.getUint16(6, littleEndian) !== 0) {
    warn("MALFORMED_EXIF", "Invalid BigTIFF version, offset size, or reserved header field.", "error", 2, 6);
    return { exif: null, fields: [], warnings };
  }
  const firstIfdOffset = safeBigTiffNumber(view.getBigUint64(8, littleEndian));
  if (firstIfdOffset === null || firstIfdOffset < 16) {
    warn("UNSAFE_OFFSET", "BigTIFF root IFD offset is absent, unsafe, or overlaps the header.", "error", 8, 8);
    return { exif: null, fields: [], warnings };
  }
  const queue: IfdWorkItem[] = [{ name: "IFD0", offset: firstIfdOffset, depth: 0 }];
  const visited = new Map<number, string>();
  const ranges: StructuralRange[] = [{ offset: 0, length: 16, category: "header", label: "BigTIFF header" }];
  const decodeBudget: DecodeBudget = { remainingBytes: finiteLimit(limits.maxMetadataBytes) };
  const maxEntries = finiteLimit(limits.maxIfdEntries);
  const maxDepth = finiteLimit(limits.maxIfdDepth);
  const maxValueBytes = finiteLimit(limits.maxValueBytes);
  const maxStringBytes = Math.min(maxValueBytes, finiteLimit(limits.maxStringBytes));
  let entriesVisited = 0;
  const enqueue = (field: MetadataField, name: IfdWorkItem["name"], depth: number): void => {
    if ((field.type !== "LONG" && field.type !== "IFD" && field.type !== "LONG8" && field.type !== "IFD8") || field.count !== 1 || typeof field.raw !== "number" || !Number.isSafeInteger(field.raw)) {
      warn("MALFORMED_EXIF", `${field.name} must contain one safe IFD offset.`, "warning", undefined, undefined, field.ifd, field.tag);
      return;
    }
    if (field.raw !== 0) queue.push({ name, offset: field.raw, depth, sourceIfd: field.ifd, sourceTag: field.tag });
  };
  try {
    while (queue.length > 0) {
      const work = queue.shift();
      if (work === undefined) break;
      if (work.depth > maxDepth) {
        warn("LIMIT_EXCEEDED", `BigTIFF IFD nesting exceeds the configured maximum depth of ${maxDepth}.`, "error", work.offset, undefined, work.sourceIfd ?? work.name, work.sourceTag);
        continue;
      }
      if (visited.has(work.offset)) {
        warn("MALFORMED_EXIF", `BigTIFF IFD offset ${work.offset} was already visited.`, "warning", work.offset, undefined, work.sourceIfd ?? work.name, work.sourceTag);
        continue;
      }
      if (!validRange(tiffBytes.byteLength, work.offset, 8)) {
        warn("UNSAFE_OFFSET", `${work.name} offset ${work.offset} is outside the BigTIFF data.`, "error", work.offset, undefined, work.sourceIfd ?? work.name, work.sourceTag);
        continue;
      }
      const declaredCount = safeBigTiffNumber(view.getBigUint64(work.offset, littleEndian));
      if (declaredCount === null) {
        warn("LIMIT_EXCEEDED", `${work.name} declares an entry count outside the safe integer range.`, "error", work.offset, 8, work.name);
        continue;
      }
      const entriesOffset = work.offset + 8;
      const declaredBytes = checkedMultiply(declaredCount, 20);
      if (declaredBytes === null) {
        warn("UNSAFE_OFFSET", `${work.name} entry table size overflows safe arithmetic.`, "error", work.offset, 8, work.name);
        continue;
      }
      const completeTable = validRange(tiffBytes.byteLength, entriesOffset, declaredBytes + 8);
      const tableLength = completeTable ? 8 + declaredBytes + 8 : tiffBytes.byteLength - work.offset;
      const conflict = overlappingRange(ranges, work.offset, tableLength);
      if (conflict !== undefined) {
        warn("UNSAFE_OFFSET", `${work.name} overlaps ${conflict.label}; the ambiguous directory was not decoded.`, "error", work.offset, tableLength, work.sourceIfd ?? work.name, work.sourceTag);
        continue;
      }
      ranges.push({ offset: work.offset, length: tableLength, category: "ifd", label: `${work.name} table` });
      visited.set(work.offset, work.name);
      ifds.push({ name: work.name, offset: work.offset, entryCount: declaredCount });
      const availableCount = completeTable ? declaredCount : Math.floor(Math.max(0, tiffBytes.byteLength - entriesOffset) / 20);
      if (!completeTable) warn("TRUNCATED_DATA", `${work.name} declares ${declaredCount} entries but its table is truncated.`, "error", work.offset, tableLength, work.name);
      const countToParse = Math.min(availableCount, Math.max(0, maxEntries - entriesVisited));
      if (availableCount > countToParse) warn("LIMIT_EXCEEDED", `BigTIFF entries exceed the configured maximum of ${maxEntries}.`, "error", entriesOffset + countToParse * 20, undefined, work.name);
      for (let index = 0; index < countToParse; index += 1) {
        const entryOffset = entriesOffset + index * 20;
        entriesVisited += 1;
        const tag = view.getUint16(entryOffset, littleEndian);
        const pointer = (work.name === "IFD0" && (tag === 0x8769 || tag === 0x8825)) || (work.name === "ExifIFD" && tag === 0xa005);
        const definition = getTagDefinition(work.name, tag, registry);
        const stableId = `${work.name}:0x${hexTag(tag)}`;
        const selected = selectedTags === undefined || selectedTags === null || selectedTags.has(definition?.name ?? formatUnknownTag(tag)) || selectedTags.has(stableId);
        if (!selected && !pointer) continue;
        const field = decodeBigTiffEntry(tiffBytes, view, littleEndian, work.name, entryOffset, maxValueBytes, maxStringBytes, decodeBudget, ranges, warn, registry);
        if (field === null) continue;
        if (selected) rawFields.push(field);
        if (work.name === "IFD0" && field.tag === 0x8769) enqueue(field, "ExifIFD", work.depth + 1);
        else if (work.name === "IFD0" && field.tag === 0x8825) enqueue(field, "GPSIFD", work.depth + 1);
        else if (work.name === "ExifIFD" && field.tag === 0xa005) enqueue(field, "InteropIFD", work.depth + 1);
      }
      if (completeTable && work.name === "IFD0") {
        const next = safeBigTiffNumber(view.getBigUint64(entriesOffset + declaredBytes, littleEndian));
        if (next === null) warn("UNSAFE_OFFSET", "BigTIFF next-IFD pointer exceeds the safe integer range.", "error", entriesOffset + declaredBytes, 8, work.name);
        else if (next !== 0) queue.push({ name: "IFD1", offset: next, depth: work.depth + 1, sourceIfd: work.name });
      }
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown decoder failure";
    warn("MALFORMED_EXIF", `BigTIFF decoding stopped safely: ${detail}.`, "error");
  }
  const normalized = normalizeExifFields(rawFields, registry);
  for (const warning of normalized.warnings) {
    if (warnings.length >= maxWarnings) break;
    warnings.push(warning);
  }
  return { exif: { byteOrder, fields: rawFields, ifds }, fields: normalized.fields, warnings };
}

function safeBigTiffNumber(value: bigint): number | null {
  return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : null;
}

function bigTiffInteger(value: bigint, signed: boolean): number | Integer64Value {
  if (value >= BigInt(Number.MIN_SAFE_INTEGER) && value <= BigInt(Number.MAX_SAFE_INTEGER)) return Number(value);
  return { decimal: value.toString(10), signed };
}

function decodeBigTiffEntry(
  bytes: Uint8Array,
  view: DataView,
  littleEndian: boolean,
  ifd: string,
  entryOffset: number,
  maxValueBytes: number,
  maxStringBytes: number,
  decodeBudget: DecodeBudget,
  ranges: StructuralRange[],
  warn: (code: WarningCode, message: string, severity: WarningSeverity, offset?: number, length?: number, ifd?: string, tag?: number) => void,
  registry: MetadataRegistry,
): MetadataField | null {
  const tag = view.getUint16(entryOffset, littleEndian);
  const typeNumber = view.getUint16(entryOffset + 2, littleEndian);
  const count = safeBigTiffNumber(view.getBigUint64(entryOffset + 4, littleEndian));
  if (count === null) {
    warn("LIMIT_EXCEEDED", `Tag 0x${hexTag(tag)} has a count outside the safe integer range.`, "warning", entryOffset + 4, 8, ifd, tag);
    return null;
  }
  const definition = BIG_TIFF_TYPES[typeNumber];
  if (definition === undefined) {
    if (maxValueBytes < 8 || decodeBudget.remainingBytes < 8) {
      warn("LIMIT_EXCEEDED", `Unknown BigTIFF type ${typeNumber} cannot be retained within the configured budget.`, "warning", entryOffset + 2, 2, ifd, tag);
      return null;
    }
    decodeBudget.remainingBytes -= 8;
    const raw = bytes.slice(entryOffset + 12, entryOffset + 20);
    warn("MALFORMED_EXIF", `Tag 0x${hexTag(tag)} uses unknown BigTIFF type ${typeNumber}; its inline slot was preserved.`, "warning", entryOffset + 2, 2, ifd, tag);
    return createField(ifd, tag, "UNKNOWN", count, raw, raw, undefined, registry);
  }
  const byteCount = checkedMultiply(count, definition.size);
  if (byteCount === null || byteCount > maxValueBytes || (definition.type === "ASCII" && byteCount > maxStringBytes)) {
    warn("LIMIT_EXCEEDED", `Tag 0x${hexTag(tag)} exceeds a configured BigTIFF value limit.`, "warning", entryOffset + 4, 8, ifd, tag);
    return null;
  }
  let valueOffset = entryOffset + 12;
  if (byteCount > 8) {
    const offset = safeBigTiffNumber(view.getBigUint64(entryOffset + 12, littleEndian));
    if (offset === null || !validRange(bytes.byteLength, offset, byteCount)) {
      warn("UNSAFE_OFFSET", `Tag 0x${hexTag(tag)} points outside the BigTIFF data.`, "error", entryOffset + 12, 8, ifd, tag);
      return null;
    }
    valueOffset = offset;
    const conflict = overlappingRange(ranges, valueOffset, byteCount, "value");
    if (conflict !== undefined) {
      warn("UNSAFE_OFFSET", `Tag 0x${hexTag(tag)} value overlaps ${conflict.label}.`, "error", valueOffset, byteCount, ifd, tag);
      return null;
    }
    if (byteCount > 0) ranges.push({ offset: valueOffset, length: byteCount, category: "value", label: `${ifd} tag 0x${hexTag(tag)} value` });
  }
  if (!validRange(bytes.byteLength, valueOffset, byteCount)) {
    warn("TRUNCATED_DATA", `Inline value for tag 0x${hexTag(tag)} is truncated.`, "error", valueOffset, byteCount, ifd, tag);
    return null;
  }
  const decodedCost = estimatedDecodedBytes(definition.type, count, byteCount);
  if (decodedCost === null || decodedCost > decodeBudget.remainingBytes) {
    warn("LIMIT_EXCEEDED", `Tag 0x${hexTag(tag)} exceeds the remaining BigTIFF decode-work budget.`, "warning", entryOffset + 4, 8, ifd, tag);
    return null;
  }
  decodeBudget.remainingBytes -= decodedCost;
  let raw: MetadataValue;
  if (definition.type === "LONG8" || definition.type === "IFD8" || definition.type === "SLONG8") {
    const signed = definition.type === "SLONG8";
    const values = Array.from({ length: count }, (_, index) => bigTiffInteger(signed ? view.getBigInt64(valueOffset + index * 8, littleEndian) : view.getBigUint64(valueOffset + index * 8, littleEndian), signed));
    raw = count === 1 ? values[0] ?? null : values;
  } else {
    raw = decodeValue(bytes, view, littleEndian, definition.type, count, valueOffset, ifd, tag, warn).raw;
  }
  const value = interpretExifValue(ifd, tag, raw, definition.type);
  return createField(ifd, tag, definition.type, count, raw, value, { entryOffset, entryLength: 20, valueOffset, valueLength: byteCount }, registry);
}

function decodeEntry(
  bytes: Uint8Array,
  view: DataView,
  littleEndian: boolean,
  ifd: string,
  entryOffset: number,
  maxValueBytes: number,
  maxStringBytes: number,
  decodeBudget: DecodeBudget,
  structuralRanges: StructuralRange[],
  warn: (
    code: WarningCode,
    message: string,
    severity: WarningSeverity,
    offset?: number,
    length?: number,
    ifd?: string,
    tag?: number,
  ) => void,
  registry: MetadataRegistry,
): MetadataField | null {
  const tag = view.getUint16(entryOffset, littleEndian);
  const typeNumber = view.getUint16(entryOffset + 2, littleEndian);
  const count = view.getUint32(entryOffset + 4, littleEndian);
  const typeDefinition = TIFF_TYPES[typeNumber];
  if (typeDefinition === undefined) {
    if (maxValueBytes < 4) {
      warn(
        "LIMIT_EXCEEDED",
        `Unknown TIFF type ${typeNumber} cannot be retained within the configured value limit.`,
        "warning",
        entryOffset + 2,
        2,
        ifd,
        tag,
      );
      return null;
    }
    if (decodeBudget.remainingBytes < 4) {
      warn(
        "LIMIT_EXCEEDED",
        "The cumulative EXIF decode-work budget has been exhausted.",
        "warning",
        entryOffset + 8,
        4,
        ifd,
        tag,
      );
      return null;
    }
    decodeBudget.remainingBytes -= 4;
    const raw = bytes.slice(entryOffset + 8, entryOffset + 12);
    warn(
      "MALFORMED_EXIF",
      `Tag 0x${hexTag(tag)} uses unknown TIFF type ${typeNumber}; its 4-byte value slot was preserved.`,
      "warning",
      entryOffset + 2,
      2,
      ifd,
      tag,
    );
    return createField(ifd, tag, "UNKNOWN", count, raw, raw, undefined, registry);
  }

  const byteCount = checkedMultiply(count, typeDefinition.size);
  if (byteCount === null) {
    warn(
      "UNSAFE_OFFSET",
      `Tag 0x${hexTag(tag)} has an overflowing value length.`,
      "error",
      entryOffset + 4,
      4,
      ifd,
      tag,
    );
    return null;
  }
  if (byteCount > maxValueBytes) {
    warn(
      "LIMIT_EXCEEDED",
      `Tag 0x${hexTag(tag)} requires ${byteCount} value bytes, exceeding the configured limit of ${maxValueBytes}.`,
      "warning",
      entryOffset + 4,
      4,
      ifd,
      tag,
    );
    return null;
  }
  if (typeDefinition.type === "ASCII" && byteCount > maxStringBytes) {
    warn(
      "LIMIT_EXCEEDED",
      `ASCII tag 0x${hexTag(tag)} exceeds the configured string limit of ${maxStringBytes} bytes.`,
      "warning",
      entryOffset + 4,
      4,
      ifd,
      tag,
    );
    return null;
  }
  let valueOffset: number;
  if (byteCount <= 4) {
    valueOffset = entryOffset + 8;
  } else {
    valueOffset = view.getUint32(entryOffset + 8, littleEndian);
    if (!validRange(bytes.byteLength, valueOffset, byteCount)) {
      warn(
        "UNSAFE_OFFSET",
        `Tag 0x${hexTag(tag)} points outside the TIFF data.`,
        "error",
        entryOffset + 8,
        4,
        ifd,
        tag,
      );
      return null;
    }
  }
  if (!validRange(bytes.byteLength, valueOffset, byteCount)) {
    warn(
      "TRUNCATED_DATA",
      `Inline value for tag 0x${hexTag(tag)} is truncated.`,
      "error",
      valueOffset,
      byteCount,
      ifd,
      tag,
    );
    return null;
  }
  if (byteCount > 4 && byteCount > 0) {
    const conflict = overlappingRange(
      structuralRanges,
      valueOffset,
      byteCount,
      "value",
    );
    if (conflict !== undefined) {
      warn(
        "UNSAFE_OFFSET",
        `Tag 0x${hexTag(tag)} value overlaps ${conflict.label}.`,
        "error",
        valueOffset,
        byteCount,
        ifd,
        tag,
      );
      return null;
    }
    structuralRanges.push({
      offset: valueOffset,
      length: byteCount,
      category: "value",
      label: `${ifd} tag 0x${hexTag(tag)} value`,
    });
  }
  const decodedCost = estimatedDecodedBytes(typeDefinition.type, count, byteCount);
  if (decodedCost === null || decodedCost > decodeBudget.remainingBytes) {
    warn(
      "LIMIT_EXCEEDED",
      `Tag 0x${hexTag(tag)} exceeds the remaining cumulative EXIF decode-work budget of ${decodeBudget.remainingBytes} estimated bytes.`,
      "warning",
      entryOffset + 4,
      4,
      ifd,
      tag,
    );
    return null;
  }
  decodeBudget.remainingBytes -= decodedCost;

  const decoded = decodeValue(
    bytes,
    view,
    littleEndian,
    typeDefinition.type,
    count,
    valueOffset,
    ifd,
    tag,
    warn,
  );
  const value = decoded.interpretable
    ? interpretExifValue(ifd, tag, decoded.raw, typeDefinition.type)
    : null;
  validateSpecialEncoding(ifd, tag, typeDefinition.type, count, decoded.raw, value, valueOffset, byteCount, warn);
  return createField(ifd, tag, typeDefinition.type, count, decoded.raw, value, { entryOffset, entryLength: 12, valueOffset, valueLength: byteCount }, registry);
}

function validateSpecialEncoding(
  ifd: string,
  tag: number,
  type: ExifDataType,
  count: number,
  raw: MetadataValue,
  value: MetadataValue,
  offset: number,
  byteCount: number,
  warn: (
    code: WarningCode,
    message: string,
    severity: WarningSeverity,
    offset?: number,
    length?: number,
    ifd?: string,
    tag?: number,
  ) => void,
): void {
  if (ifd !== "ExifIFD") return;
  if (tag === 0x9209 && (type !== "SHORT" || count !== 1)) {
    warn("INVALID_VALUE", "Flash must contain one TIFF SHORT value.", "warning", offset, byteCount, ifd, tag);
    return;
  }
  const signedApex = tag === 0x9201 || tag === 0x9203 || tag === 0x9204;
  const unsignedApex = tag === 0x9202 || tag === 0x9205;
  if (!signedApex && !unsignedApex) return;
  const expectedType: ExifDataType = signedApex ? "SRATIONAL" : "RATIONAL";
  if (type !== expectedType || count !== 1 || !isDecodedRational(raw)) {
    warn(
      "INVALID_VALUE",
      `APEX tag 0x${hexTag(tag)} must contain one ${expectedType} value.`,
      "warning",
      offset,
      byteCount,
      ifd,
      tag,
    );
    return;
  }
  if (raw.denominator !== 0 && value === raw && (tag === 0x9201 || unsignedApex)) {
    warn(
      "INVALID_VALUE",
      `APEX tag 0x${hexTag(tag)} produces a non-finite or non-positive physical value.`,
      "warning",
      offset,
      byteCount,
      ifd,
      tag,
    );
  }
}

function isDecodedRational(value: MetadataValue): value is RationalValue {
  if (typeof value !== "object" || value === null || Array.isArray(value) || value instanceof Uint8Array) {
    return false;
  }
  return "numerator" in value && "denominator" in value;
}

function decodeValue(
  bytes: Uint8Array,
  view: DataView,
  littleEndian: boolean,
  type: ExifDataType,
  count: number,
  offset: number,
  ifd: string,
  tag: number,
  warn: (
    code: WarningCode,
    message: string,
    severity: WarningSeverity,
    offset?: number,
    length?: number,
    ifd?: string,
    tag?: number,
  ) => void,
): DecodedValue {
  if (type === "ASCII") return decodeAscii(bytes, offset, count, ifd, tag, warn);
  if (type === "UNDEFINED") return { raw: bytes.slice(offset, offset + count), interpretable: true };
  if (type === "BYTE") {
    if (count === 1) return { raw: view.getUint8(offset), interpretable: true };
    return { raw: bytes.slice(offset, offset + count), interpretable: true };
  }

  const values: Array<number | RationalValue> = [];
  for (let index = 0; index < count; index += 1) {
    let value: number | RationalValue;
    switch (type) {
      case "SHORT":
        value = view.getUint16(offset + index * 2, littleEndian);
        break;
      case "LONG":
      case "IFD":
        value = view.getUint32(offset + index * 4, littleEndian);
        break;
      case "RATIONAL": {
        const componentOffset = offset + index * 8;
        value = {
          numerator: view.getUint32(componentOffset, littleEndian),
          denominator: view.getUint32(componentOffset + 4, littleEndian),
        };
        if (value.denominator === 0) {
          warn("ZERO_DENOMINATOR", `Rational tag 0x${hexTag(tag)} contains a zero denominator.`, "warning", componentOffset + 4, 4, ifd, tag);
        }
        break;
      }
      case "SBYTE":
        value = view.getInt8(offset + index);
        break;
      case "SSHORT":
        value = view.getInt16(offset + index * 2, littleEndian);
        break;
      case "SLONG":
        value = view.getInt32(offset + index * 4, littleEndian);
        break;
      case "SRATIONAL": {
        const componentOffset = offset + index * 8;
        value = {
          numerator: view.getInt32(componentOffset, littleEndian),
          denominator: view.getInt32(componentOffset + 4, littleEndian),
        };
        if (value.denominator === 0) {
          warn("ZERO_DENOMINATOR", `Signed rational tag 0x${hexTag(tag)} contains a zero denominator.`, "warning", componentOffset + 4, 4, ifd, tag);
        }
        break;
      }
      case "FLOAT":
        value = view.getFloat32(offset + index * 4, littleEndian);
        if (!Number.isFinite(value)) {
          warn("INVALID_VALUE", `FLOAT tag 0x${hexTag(tag)} contains a non-finite value.`, "warning", offset + index * 4, 4, ifd, tag);
        }
        break;
      case "DOUBLE":
        value = view.getFloat64(offset + index * 8, littleEndian);
        if (!Number.isFinite(value)) {
          warn("INVALID_VALUE", `DOUBLE tag 0x${hexTag(tag)} contains a non-finite value.`, "warning", offset + index * 8, 8, ifd, tag);
        }
        break;
      default:
        // BYTE, ASCII, and UNDEFINED return before this loop; UNKNOWN is never passed in.
        value = 0;
        break;
    }
    values.push(value);
  }
  if (values.length === 1) return { raw: values[0] ?? null, interpretable: true };
  if (type === "RATIONAL" || type === "SRATIONAL") {
    return { raw: values as RationalValue[], interpretable: true };
  }
  return { raw: values as number[], interpretable: true };
}

function decodeAscii(
  bytes: Uint8Array,
  offset: number,
  count: number,
  ifd: string,
  tag: number,
  warn: (
    code: WarningCode,
    message: string,
    severity: WarningSeverity,
    offset?: number,
    length?: number,
    ifd?: string,
    tag?: number,
  ) => void,
): DecodedValue {
  if (count === 0) {
    warn("INVALID_ASCII", `ASCII tag 0x${hexTag(tag)} has an empty byte sequence.`, "warning", offset, 0, ifd, tag);
    return { raw: "", interpretable: false };
  }
  const finalByte = bytes[offset + count - 1];
  let valid = true;
  if (finalByte !== 0) {
    valid = false;
    warn(
      "INVALID_ASCII",
      `ASCII tag 0x${hexTag(tag)} is not NUL-terminated.`,
      "warning",
      offset,
      count,
      ifd,
      tag,
    );
  }
  let end = offset + count;
  while (end > offset && bytes[end - 1] === 0) end -= 1;
  let invalid = false;
  for (let position = offset; position < end; position += 1) {
    const byte = bytes[position];
    if (byte === undefined) break;
    if (byte !== 0 && (byte < 0x20 || byte > 0x7e)) invalid = true;
  }
  const chunks: string[] = [];
  for (let position = offset; position < end; position += ASCII_DECODE_CHUNK_BYTES) {
    const chunkEnd = Math.min(position + ASCII_DECODE_CHUNK_BYTES, end);
    // Chunking avoids one temporary string node per byte while retaining the
    // original byte values as Latin-1 code units, including embedded NULs.
    chunks.push(String.fromCharCode(...bytes.subarray(position, chunkEnd)));
  }
  const text = chunks.join("");
  if (invalid) {
    valid = false;
    warn(
      "INVALID_ASCII",
      `ASCII tag 0x${hexTag(tag)} contains non-printable or non-ASCII bytes.`,
      "warning",
      offset,
      count,
      ifd,
      tag,
    );
  }
  return { raw: text, interpretable: valid };
}

function createField(
  ifd: string,
  tag: number,
  type: ExifDataType,
  count: number,
  raw: MetadataValue,
  value: MetadataValue,
  source?: Omit<NonNullable<MetadataField["source"]>, "blockId">,
  registry: MetadataRegistry = DEFAULT_METADATA_REGISTRY,
): MetadataField {
  const definition = getTagDefinition(ifd, tag, registry);
  const name = definition?.name ?? formatUnknownTag(tag);
  return {
    id: `${ifd}:0x${hexTag(tag)}`,
    ifd,
    tag,
    name,
    raw,
    value,
    display: displayExifValue(ifd, tag, raw, value),
    description: definition?.description ?? "Unrecognized TIFF/EXIF tag; retained without assigning semantics.",
    type,
    sensitivity: definition?.sensitivity ?? "none",
    count,
    known: definition !== undefined,
    ...(source === undefined ? {} : { source: { blockId: "", ...source } }),
  };
}

function finiteLimit(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(Number.MAX_SAFE_INTEGER, Math.floor(value));
}

function validRange(total: number, offset: number, length: number): boolean {
  return (
    Number.isSafeInteger(offset) &&
    Number.isSafeInteger(length) &&
    offset >= 0 &&
    length >= 0 &&
    offset <= total &&
    length <= total - offset
  );
}

function overlappingRange(
  ranges: readonly StructuralRange[],
  offset: number,
  length: number,
  ignoredCategory?: StructuralRange["category"],
): StructuralRange | undefined {
  if (length === 0) return undefined;
  const end = offset + length;
  return ranges.find((range) => {
    if (range.category === ignoredCategory || range.length === 0) return false;
    return offset < range.offset + range.length && range.offset < end;
  });
}

function estimatedDecodedBytes(
  type: ExifDataType,
  count: number,
  encodedBytes: number,
): number | null {
  let estimate: number | null;
  if (type === "BYTE" || type === "UNDEFINED") {
    estimate = encodedBytes;
  } else if (type === "ASCII") {
    estimate = checkedMultiply(count, 2);
  } else if (type === "RATIONAL" || type === "SRATIONAL") {
    // Includes an array slot plus the two-number object retained for each rational.
    estimate = checkedMultiply(count, 32);
  } else {
    // Numeric TIFF values are retained as JavaScript numbers (or number arrays).
    estimate = checkedMultiply(count, 8);
  }
  return estimate === null ? null : Math.max(encodedBytes, estimate);
}

function checkedMultiply(left: number, right: number): number | null {
  const result = left * right;
  return Number.isSafeInteger(result) && result >= 0 ? result : null;
}

function hexTag(tag: number): string {
  return tag.toString(16).padStart(4, "0");
}
