import type {
  ExifData,
  ExifDataType,
  ExifIfd,
  MetadataField,
  MetadataValue,
  MetadataWarning,
  RationalValue,
  SecurityLimits,
  WarningCode,
  WarningSeverity,
} from "../types.js";
import { getTagDefinition, formatUnknownTag } from "../normalize/descriptions.js";
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
        const definition = getTagDefinition(work.name, tag);
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

  const normalized = normalizeExifFields(rawFields);
  for (const warning of normalized.warnings) {
    if (warnings.length >= maxWarnings) break;
    warnings.push(warning);
  }

  const exif: ExifData = { byteOrder, fields: rawFields, ifds };
  return { exif, fields: normalized.fields, warnings };
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
    return createField(ifd, tag, "UNKNOWN", count, raw, raw);
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
  return createField(ifd, tag, typeDefinition.type, count, decoded.raw, value);
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
): MetadataField {
  const definition = getTagDefinition(ifd, tag);
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
    editable: definition?.editable ?? false,
    sensitivity: definition?.sensitivity ?? "none",
    count,
    known: definition !== undefined,
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
