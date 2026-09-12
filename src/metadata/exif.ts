import type {
  ExifData,
  ExifDataType,
  ExifAssociatedImage,
  ExifDirectory,
  ExifIfd,
  ExifDirectoryKind,
  ExifDirectoryRelation,
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
  readonly name: string;
  readonly id: string;
  readonly offset: number;
  readonly depth: number;
  readonly kind: ExifDirectoryKind;
  readonly parentId?: string | null;
  readonly parentTag?: number;
  readonly associatedImage?: string | null;
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
  // Exif 3.0 defines this type independently of TIFF 6.0.
  129: { type: "UTF-8", size: 1 },
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
  const ifds: ExifDirectory[] = [];
  const relations: ExifDirectoryRelation[] = [];
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
  const root: IfdWorkItem = { name: "IFD0", id: `IFD0@${firstIfdOffset}`, offset: firstIfdOffset, depth: 0, kind: "primary", parentId: null, associatedImage: "primary" };
  const queue: IfdWorkItem[] = [root];
  const visited = new Map<number, ExifDirectory>();
  const queued = new Map<number, IfdWorkItem>([[firstIfdOffset, root]]);
  const structuralRanges: StructuralRange[] = [
    { offset: 0, length: 8, category: "header", label: "TIFF header" },
  ];
  const maxEntries = finiteLimit(limits.maxIfdEntries);
  const maxDepth = finiteLimit(limits.maxIfdDepth);
  const maxValueBytes = finiteLimit(limits.maxValueBytes);
  const maxStringBytes = Math.min(maxValueBytes, finiteLimit(limits.maxStringBytes));
  const decodeBudget: DecodeBudget = { remainingBytes: finiteLimit(limits.maxMetadataBytes) };
  let entriesVisited = 0;

  let subIfdNumber = 0;
  let nextIfdNumber = 1;
  const enqueueDirectory = (parent: IfdWorkItem, offset: number, name: string, kind: ExifDirectoryKind, relationType: ExifDirectoryRelation["type"], tag?: number, associatedImage: string | null = null): void => {
    if (offset === 0) return;
    const existingDirectory = visited.get(offset);
    const existing = existingDirectory ?? queued.get(offset);
    const targetId = existing?.id ?? `${name}@${offset}`;
    relations.push({ type: relationType, fromDirectoryId: parent.id, toDirectoryId: targetId, ...(tag === undefined ? {} : { tag }), ...(existing === undefined ? {} : { sharedOffset: true }) });
    if (existing !== undefined) {
      let ancestor: string | null | undefined = parent.id;
      let cycle = false;
      for (let guard = 0; ancestor !== null && ancestor !== undefined && guard <= maxDepth + 1; guard += 1) {
        if (ancestor === existing.id) { cycle = true; break; }
        const ancestorDirectory = ifds.find((item) => item.id === ancestor);
        ancestor = ancestorDirectory?.parentId;
      }
      if (existingDirectory?.sharedOffset === false) {
        const index = ifds.indexOf(existingDirectory);
        if (index >= 0) ifds[index] = { ...existingDirectory, sharedOffset: true };
      }
      relations.push({ type: cycle ? "cycle" : "shared-offset", fromDirectoryId: parent.id, toDirectoryId: existing.id, ...(tag === undefined ? {} : { tag }), sharedOffset: true });
      addWarning("MALFORMED_EXIF", `IFD offset ${offset} was already visited/referenced as ${existing.name}; shared or cyclic directory reference retained without re-decoding.`, "warning", offset, undefined, parent.name, tag);
      return;
    }
    if (queue.length + ifds.length >= finiteLimit(limits.maxSegments)) {
      addWarning("LIMIT_EXCEEDED", `TIFF directory count exceeds the configured limit of ${limits.maxSegments}.`, "error", offset, undefined, parent.name, tag);
      return;
    }
    const work: IfdWorkItem = { name, id: targetId, offset, depth: parent.depth + 1, kind, parentId: parent.id, ...(tag === undefined ? {} : { parentTag: tag }), sourceIfd: parent.name, ...(tag === undefined ? {} : { sourceTag: tag }), associatedImage };
    queued.set(offset, work);
    queue.push(work);
  };
  const pointerValues = (field: MetadataField, allowMany: boolean): number[] | null => {
    if ((field.type !== "LONG" && field.type !== "IFD") || (!allowMany && field.count !== 1)) return null;
    const rawValues = Array.isArray(field.raw) ? field.raw : [field.raw];
    if (rawValues.length === 0 || (!allowMany && rawValues.length !== 1)) return null;
    const values: number[] = [];
    for (const raw of rawValues) {
      if (typeof raw !== "number" || !Number.isSafeInteger(raw) || raw < 0) return null;
      values.push(raw);
    }
    return values;
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
      const previous = visited.get(work.offset);
      if (previous !== undefined) continue;
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

      queued.delete(work.offset);
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
      const directory: ExifDirectory = {
        name: work.name,
        offset: work.offset,
        entryCount: declaredCount,
        id: work.id,
        kind: work.kind,
        parentId: work.parentId ?? null,
        ...(work.parentTag === undefined ? {} : { parentTag: work.parentTag }),
        depth: work.depth,
        nextId: null,
        sharedOffset: false,
        associatedImage: work.associatedImage ?? null,
      };
      visited.set(work.offset, directory);
      ifds.push(directory);
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
        const isPointer = isDirectoryPointer(work.name, tag);
        const definition = getDirectoryTagDefinition(work.name, tag, registry);
        const stableId = `${work.name}:0x${hexTag(tag)}`;
        const selected = selectedTags === undefined || selectedTags === null ||
          selectedTags.has(definition?.name ?? (tag === 0x014a ? "SubIFDs" : formatUnknownTag(tag))) || selectedTags.has(stableId);
        if (!selected && !isPointer) continue;
        const decoded = decodeEntry(
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
        if (decoded === null) continue;
        const field: MetadataField = decoded.source === undefined
          ? { ...decoded, directoryId: work.id }
          : { ...decoded, directoryId: work.id, source: { ...decoded.source, directoryId: work.id } };
        if (selected) rawFields.push(field);
        if (field.tag === 0x8769 && work.name !== "ExifIFD") {
          const values = pointerValues(field, false);
          if (values === null) addWarning("MALFORMED_EXIF", "ExifIFDPointer must contain one LONG or IFD offset.", "warning", undefined, undefined, work.name, field.tag);
          else for (const value of values) enqueueDirectory(work, value, "ExifIFD", "exif", "pointer", field.tag, "primary");
        } else if (field.tag === 0x8825 && work.name !== "GPSIFD") {
          const values = pointerValues(field, false);
          if (values === null) addWarning("MALFORMED_EXIF", "GPSInfoIFDPointer must contain one LONG or IFD offset.", "warning", undefined, undefined, work.name, field.tag);
          else for (const value of values) enqueueDirectory(work, value, "GPSIFD", "gps", "pointer", field.tag, "primary");
        } else if (field.tag === 0xa005 && (work.name === "ExifIFD" || work.kind === "exif")) {
          const values = pointerValues(field, false);
          if (values === null) addWarning("MALFORMED_EXIF", "InteropIFDPointer must contain one LONG or IFD offset.", "warning", undefined, undefined, work.name, field.tag);
          else for (const value of values) enqueueDirectory(work, value, "InteropIFD", "interop", "pointer", field.tag, "primary");
        } else if (field.tag === 0x014a) {
          if (field.type !== "LONG" && field.type !== "IFD") addWarning("MALFORMED_EXIF", "SubIFDs must use LONG or IFD offsets.", "warning", undefined, undefined, work.name, field.tag);
          else {
            const values = pointerValues(field, true);
            if (values === null) addWarning("MALFORMED_EXIF", "SubIFDs contains an invalid offset array.", "warning", undefined, undefined, work.name, field.tag);
            else values.forEach((value) => {
              const number = subIfdNumber++;
              enqueueDirectory(work, value, `SubIFD[${number}]`, "subifd", "subifd", field.tag, "preview");
            });
          }
        }
      }
      if (completeTable) {
        const nextOffsetLocation = entriesOffset + declaredEntriesBytes;
        const nextIfdOffset = view.getUint32(nextOffsetLocation, littleEndian);
        if (nextIfdOffset !== 0) {
          const name = `IFD${nextIfdNumber}`;
          const kind: ExifDirectoryKind = work.name === "IFD0" && nextIfdNumber === 1 ? "thumbnail" : "preview";
          const associatedImage = kind === "thumbnail" ? "thumbnail" : "preview";
          enqueueDirectory(work, nextIfdOffset, name, kind, "next", undefined, associatedImage);
          const target = queued.get(nextIfdOffset) ?? visited.get(nextIfdOffset);
          if (target !== undefined) {
            const index = ifds.indexOf(directory);
            if (index >= 0) ifds[index] = { ...directory, nextId: target.id };
          }
          nextIfdNumber += 1;
        }
      }
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown decoder failure";
    addWarning("MALFORMED_EXIF", `EXIF decoding stopped safely: ${detail}.`, "error");
  }

  const referenceCounts = new Map<string, number>();
  for (const relation of relations) referenceCounts.set(relation.toDirectoryId, (referenceCounts.get(relation.toDirectoryId) ?? 0) + 1);
  for (let index = 0; index < ifds.length; index += 1) {
    const directory = ifds[index];
    if (directory === undefined) continue;
    if ((referenceCounts.get(directory.id) ?? 0) > 1 && !directory.sharedOffset) ifds[index] = { ...directory, sharedOffset: true };
  }

  const normalized = normalizeExifFields(rawFields, registry);
  for (const warning of normalized.warnings) {
    if (warnings.length >= maxWarnings) break;
    warnings.push(warning);
  }

  const exif: ExifData = { byteOrder, fields: rawFields, ifds, topology: { directories: ifds, relations }, associatedImages: associatedImages(ifds, rawFields) };
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
  const ifds: ExifDirectory[] = [];
  const relations: ExifDirectoryRelation[] = [];
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
  const root: IfdWorkItem = { name: "IFD0", id: `IFD0@${firstIfdOffset}`, offset: firstIfdOffset, depth: 0, kind: "primary", parentId: null, associatedImage: "primary" };
  const queue: IfdWorkItem[] = [root];
  const visited = new Map<number, ExifDirectory>();
  const queued = new Map<number, IfdWorkItem>([[firstIfdOffset, root]]);
  const ranges: StructuralRange[] = [{ offset: 0, length: 16, category: "header", label: "BigTIFF header" }];
  const decodeBudget: DecodeBudget = { remainingBytes: finiteLimit(limits.maxMetadataBytes) };
  const maxEntries = finiteLimit(limits.maxIfdEntries);
  const maxDepth = finiteLimit(limits.maxIfdDepth);
  const maxValueBytes = finiteLimit(limits.maxValueBytes);
  const maxStringBytes = Math.min(maxValueBytes, finiteLimit(limits.maxStringBytes));
  let entriesVisited = 0;
  let subIfdNumber = 0;
  let nextIfdNumber = 1;
  const enqueueDirectory = (parent: IfdWorkItem, offset: number, name: string, kind: ExifDirectoryKind, relationType: ExifDirectoryRelation["type"], tag?: number, associatedImage: string | null = null): void => {
    if (offset === 0) return;
    const existingDirectory = visited.get(offset);
    const existing = existingDirectory ?? queued.get(offset);
    const targetId = existing?.id ?? `${name}@${offset}`;
    relations.push({ type: relationType, fromDirectoryId: parent.id, toDirectoryId: targetId, ...(tag === undefined ? {} : { tag }), ...(existing === undefined ? {} : { sharedOffset: true }) });
    if (existing !== undefined) {
      let ancestor: string | null | undefined = parent.id;
      let cycle = false;
      for (let guard = 0; ancestor !== null && ancestor !== undefined && guard <= maxDepth + 1; guard += 1) {
        if (ancestor === existing.id) { cycle = true; break; }
        const ancestorDirectory = ifds.find((item) => item.id === ancestor);
        ancestor = ancestorDirectory?.parentId;
      }
      if (existingDirectory?.sharedOffset === false) {
        const index = ifds.indexOf(existingDirectory);
        if (index >= 0) ifds[index] = { ...existingDirectory, sharedOffset: true };
      }
      relations.push({ type: cycle ? "cycle" : "shared-offset", fromDirectoryId: parent.id, toDirectoryId: existing.id, ...(tag === undefined ? {} : { tag }), sharedOffset: true });
      warn("MALFORMED_EXIF", `BigTIFF IFD offset ${offset} was already visited/referenced as ${existing.name}; shared or cyclic directory reference retained without re-decoding.`, "warning", offset, undefined, parent.name, tag);
      return;
    }
    if (queue.length + ifds.length >= finiteLimit(limits.maxSegments)) {
      warn("LIMIT_EXCEEDED", `BigTIFF directory count exceeds the configured limit of ${limits.maxSegments}.`, "error", offset, undefined, parent.name, tag);
      return;
    }
    const work: IfdWorkItem = { name, id: targetId, offset, depth: parent.depth + 1, kind, parentId: parent.id, ...(tag === undefined ? {} : { parentTag: tag }), sourceIfd: parent.name, ...(tag === undefined ? {} : { sourceTag: tag }), associatedImage };
    queued.set(offset, work);
    queue.push(work);
  };
  const pointerValues = (field: MetadataField, allowMany: boolean): number[] | null => {
    if ((field.type !== "LONG" && field.type !== "IFD" && field.type !== "LONG8" && field.type !== "IFD8") || (!allowMany && field.count !== 1)) return null;
    const rawValues = Array.isArray(field.raw) ? field.raw : [field.raw];
    if (rawValues.length === 0 || (!allowMany && rawValues.length !== 1)) return null;
    const values: number[] = [];
    for (const raw of rawValues) {
      if (typeof raw === "number") {
        if (!Number.isSafeInteger(raw) || raw < 0) return null;
        values.push(raw);
      } else if (typeof raw === "object" && raw !== null && !Array.isArray(raw) && !(raw instanceof Uint8Array) && "decimal" in raw) {
        const value = Number((raw as Integer64Value).decimal);
        if (!Number.isSafeInteger(value) || value < 0 || String(value) !== (raw as Integer64Value).decimal) return null;
        values.push(value);
      } else return null;
    }
    return values;
  };
  try {
    while (queue.length > 0) {
      const work = queue.shift();
      if (work === undefined) break;
      if (work.depth > maxDepth) {
        warn("LIMIT_EXCEEDED", `BigTIFF IFD nesting exceeds the configured maximum depth of ${maxDepth}.`, "error", work.offset, undefined, work.sourceIfd ?? work.name, work.sourceTag);
        continue;
      }
      if (visited.has(work.offset)) continue;
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
      queued.delete(work.offset);
      const directory: ExifDirectory = {
        name: work.name,
        offset: work.offset,
        entryCount: declaredCount,
        id: work.id,
        kind: work.kind,
        parentId: work.parentId ?? null,
        ...(work.parentTag === undefined ? {} : { parentTag: work.parentTag }),
        depth: work.depth,
        nextId: null,
        sharedOffset: false,
        associatedImage: work.associatedImage ?? null,
      };
      visited.set(work.offset, directory);
      ifds.push(directory);
      const availableCount = completeTable ? declaredCount : Math.floor(Math.max(0, tiffBytes.byteLength - entriesOffset) / 20);
      if (!completeTable) warn("TRUNCATED_DATA", `${work.name} declares ${declaredCount} entries but its table is truncated.`, "error", work.offset, tableLength, work.name);
      const countToParse = Math.min(availableCount, Math.max(0, maxEntries - entriesVisited));
      if (availableCount > countToParse) warn("LIMIT_EXCEEDED", `BigTIFF entries exceed the configured maximum of ${maxEntries}.`, "error", entriesOffset + countToParse * 20, undefined, work.name);
      for (let index = 0; index < countToParse; index += 1) {
        const entryOffset = entriesOffset + index * 20;
        entriesVisited += 1;
        const tag = view.getUint16(entryOffset, littleEndian);
        const pointer = isDirectoryPointer(work.name, tag);
        const definition = getDirectoryTagDefinition(work.name, tag, registry);
        const stableId = `${work.name}:0x${hexTag(tag)}`;
        const selected = selectedTags === undefined || selectedTags === null || selectedTags.has(definition?.name ?? (tag === 0x014a ? "SubIFDs" : formatUnknownTag(tag))) || selectedTags.has(stableId);
        if (!selected && !pointer) continue;
        const decoded = decodeBigTiffEntry(tiffBytes, view, littleEndian, work.name, entryOffset, maxValueBytes, maxStringBytes, decodeBudget, ranges, warn, registry);
        if (decoded === null) continue;
        const field: MetadataField = decoded.source === undefined
          ? { ...decoded, directoryId: work.id }
          : { ...decoded, directoryId: work.id, source: { ...decoded.source, directoryId: work.id } };
        if (selected) rawFields.push(field);
        if (field.tag === 0x8769 && work.name !== "ExifIFD") {
          const values = pointerValues(field, false);
          if (values === null) warn("MALFORMED_EXIF", "ExifIFDPointer must contain one safe IFD offset.", "warning", undefined, undefined, work.name, field.tag);
          else for (const value of values) enqueueDirectory(work, value, "ExifIFD", "exif", "pointer", field.tag, "primary");
        } else if (field.tag === 0x8825 && work.name !== "GPSIFD") {
          const values = pointerValues(field, false);
          if (values === null) warn("MALFORMED_EXIF", "GPSInfoIFDPointer must contain one safe IFD offset.", "warning", undefined, undefined, work.name, field.tag);
          else for (const value of values) enqueueDirectory(work, value, "GPSIFD", "gps", "pointer", field.tag, "primary");
        } else if (field.tag === 0xa005 && (work.name === "ExifIFD" || work.kind === "exif")) {
          const values = pointerValues(field, false);
          if (values === null) warn("MALFORMED_EXIF", "InteropIFDPointer must contain one safe IFD offset.", "warning", undefined, undefined, work.name, field.tag);
          else for (const value of values) enqueueDirectory(work, value, "InteropIFD", "interop", "pointer", field.tag, "primary");
        } else if (field.tag === 0x014a) {
          if (field.type !== "LONG8" && field.type !== "IFD8" && field.type !== "LONG" && field.type !== "IFD") warn("MALFORMED_EXIF", "SubIFDs must use LONG/LONG8 or IFD/IFD8 offsets.", "warning", undefined, undefined, work.name, field.tag);
          else {
            const values = pointerValues(field, true);
            if (values === null) warn("MALFORMED_EXIF", "SubIFDs contains an invalid offset array.", "warning", undefined, undefined, work.name, field.tag);
            else values.forEach((value) => enqueueDirectory(work, value, `SubIFD[${subIfdNumber++}]`, "subifd", "subifd", field.tag, "preview"));
          }
        }
      }
      if (completeTable) {
        const next = safeBigTiffNumber(view.getBigUint64(entriesOffset + declaredBytes, littleEndian));
        if (next === null) warn("UNSAFE_OFFSET", "BigTIFF next-IFD pointer exceeds the safe integer range.", "error", entriesOffset + declaredBytes, 8, work.name);
        else if (next !== 0) {
          const name = `IFD${nextIfdNumber}`;
          const kind: ExifDirectoryKind = work.name === "IFD0" && nextIfdNumber === 1 ? "thumbnail" : "preview";
          enqueueDirectory(work, next, name, kind, "next", undefined, kind === "thumbnail" ? "thumbnail" : "preview");
          const target = queued.get(next) ?? visited.get(next);
          if (target !== undefined) {
            const index = ifds.indexOf(directory);
            if (index >= 0) ifds[index] = { ...directory, nextId: target.id };
          }
          nextIfdNumber += 1;
        }
      }
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown decoder failure";
    warn("MALFORMED_EXIF", `BigTIFF decoding stopped safely: ${detail}.`, "error");
  }
  const referenceCounts = new Map<string, number>();
  for (const relation of relations) referenceCounts.set(relation.toDirectoryId, (referenceCounts.get(relation.toDirectoryId) ?? 0) + 1);
  for (let index = 0; index < ifds.length; index += 1) {
    const directory = ifds[index];
    if (directory === undefined) continue;
    if ((referenceCounts.get(directory.id) ?? 0) > 1 && !directory.sharedOffset) ifds[index] = { ...directory, sharedOffset: true };
  }
  const normalized = normalizeExifFields(rawFields, registry);
  for (const warning of normalized.warnings) {
    if (warnings.length >= maxWarnings) break;
    warnings.push(warning);
  }
  return { exif: { byteOrder, fields: rawFields, ifds, topology: { directories: ifds, relations }, associatedImages: associatedImages(ifds, rawFields) }, fields: normalized.fields, warnings };
}

function safeBigTiffNumber(value: bigint): number | null {
  return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : null;
}

/** Directory-bearing pointer tags only. Strip/tile offsets are deliberately
 * excluded: they identify encoded pixel payloads, never metadata directories. */
function isDirectoryPointer(ifd: string, tag: number): boolean {
  return tag === 0x014a || tag === 0x8769 || tag === 0x8825 || (tag === 0xa005 && (ifd === "ExifIFD" || ifd.startsWith("ExifIFD")));
}

function associatedImages(ifds: readonly ExifIfd[], fields: readonly MetadataField[]): readonly ExifAssociatedImage[] {
  const images: ExifAssociatedImage[] = [];
  for (const ifd of ifds) {
    if (ifd.kind !== "thumbnail" && ifd.kind !== "preview") continue;
    const directoryId = ifd.id ?? `${ifd.name}@${ifd.offset}`;
    const offsetField = fields.find((field) => field.directoryId === directoryId && field.tag === 0x0201);
    const lengthField = fields.find((field) => field.directoryId === directoryId && field.tag === 0x0202);
    const offset = typeof offsetField?.raw === "number" && Number.isSafeInteger(offsetField.raw) && offsetField.raw >= 0 ? offsetField.raw : null;
    const length = typeof lengthField?.raw === "number" && Number.isSafeInteger(lengthField.raw) && lengthField.raw >= 0 ? lengthField.raw : null;
    images.push({ directoryId, role: ifd.kind === "thumbnail" ? "thumbnail" : "preview", offset, length, mimeType: "image/jpeg" });
  }
  return images;
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
  if (byteCount === null || byteCount > maxValueBytes || ((definition.type === "ASCII" || definition.type === "UTF-8") && byteCount > maxStringBytes)) {
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
  validateSpecialEncoding(ifd, tag, definition.type, count, raw, value, valueOffset, byteCount, littleEndian, warn);
  validateRegistryDefinition(ifd, tag, definition.type, count, raw, valueOffset, byteCount, registry, warn);
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
  if ((typeDefinition.type === "ASCII" || typeDefinition.type === "UTF-8") && byteCount > maxStringBytes) {
    warn(
      "LIMIT_EXCEEDED",
      `${typeDefinition.type} tag 0x${hexTag(tag)} exceeds the configured string limit of ${maxStringBytes} bytes.`,
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
  validateSpecialEncoding(ifd, tag, typeDefinition.type, count, decoded.raw, value, valueOffset, byteCount, littleEndian, warn);
  validateRegistryDefinition(ifd, tag, typeDefinition.type, count, decoded.raw, valueOffset, byteCount, registry, warn);
  return createField(ifd, tag, typeDefinition.type, count, decoded.raw, value, { entryOffset, entryLength: 12, valueOffset, valueLength: byteCount }, registry);
}

function validateRegistryDefinition(
  ifd: string,
  tag: number,
  type: ExifDataType,
  count: number,
  raw: MetadataValue,
  offset: number,
  byteCount: number,
  registry: MetadataRegistry,
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
  const definition = getDirectoryTagDefinition(ifd, tag, registry);
  if (definition === undefined) return;
  // LONG8/SLONG8/IFD8 are BigTIFF storage extensions. They are accepted for
  // otherwise legal numeric fields without weakening the classic Exif 3.1
  // vocabulary recorded in the registry.
  const bigTiffExtension = type === "LONG8" || type === "SLONG8" || type === "IFD8";
  if (!definition.legalTypes.includes(type) && !bigTiffExtension) {
    warn("INVALID_VALUE", `${definition.name} uses TIFF type ${type}; legal types are ${definition.legalTypes.join(", ")}.`, "warning", offset, byteCount, ifd, tag);
  }
  const { min, max } = definition.count;
  if (count < min || (max !== null && count > max)) {
    const range = max === null ? `${min} or more` : min === max ? `${min}` : `${min}–${max}`;
    warn("INVALID_VALUE", `${definition.name} count ${count} is outside the legal range (${range}).`, "warning", offset, byteCount, ifd, tag);
  }
  if (definition.enumValues !== undefined) {
    const values = enumCandidates(raw);
    for (const value of values) {
      if (!Object.prototype.hasOwnProperty.call(definition.enumValues, String(value))) {
        warn("INVALID_VALUE", `${definition.name} contains reserved value ${value}.`, "warning", offset, byteCount, ifd, tag);
        break;
      }
    }
  }
}

function enumCandidates(raw: MetadataValue): readonly (number | string)[] {
  if (typeof raw === "number" || typeof raw === "string") return [typeof raw === "string" ? raw.replace(/\0+$/u, "") : raw];
  if (raw instanceof Uint8Array && raw.length > 0) {
    const shown = raw.length <= 64 ? raw : raw.subarray(0, 64);
    const ascii = Array.from(shown, (byte) => String.fromCharCode(byte)).join("").replace(/\0+$/u, "");
    return raw.length <= 64 && /^[\x20-\x7e]+$/u.test(ascii) ? [ascii] : [raw[0] ?? 0];
  }
  if (Array.isArray(raw) && raw.every((item) => typeof item === "number" || typeof item === "string")) {
    return raw.length <= 64 ? [raw.join(",")] : [typeof raw[0] === "number" || typeof raw[0] === "string" ? raw[0] : 0];
  }
  return [];
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
  littleEndian: boolean,
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
  if (tag === 0x9287) {
    validateLearningOptOutIn(raw, littleEndian, offset, byteCount, warn, ifd, tag);
    return;
  }
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

function validateLearningOptOutIn(
  raw: MetadataValue,
  littleEndian: boolean,
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
  ifd: string,
  tag: number,
): void {
  if (!(raw instanceof Uint8Array)) {
    warn("INVALID_VALUE", "LearningOptOutIn must use its UNDEFINED structured byte representation.", "warning", offset, byteCount, ifd, tag);
    return;
  }
  if (raw.byteLength < 6 || (raw.byteLength - 2) % 4 !== 0) {
    warn("INVALID_VALUE", "LearningOptOutIn must contain a SHORT set count followed by usage/intention SHORT pairs.", "warning", offset, byteCount, ifd, tag);
    return;
  }
  const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
  const setCount = view.getUint16(0, littleEndian);
  if (setCount < 1 || raw.byteLength !== 2 + setCount * 4) {
    warn("INVALID_VALUE", "LearningOptOutIn set count does not match its byte length or is less than one.", "warning", offset, byteCount, ifd, tag);
    return;
  }
  const usages = new Set<number>();
  for (let index = 0; index < setCount; index += 1) {
    const usageOffset = 2 + index * 4;
    const usage = view.getUint16(usageOffset, littleEndian);
    const intention = view.getUint16(usageOffset + 2, littleEndian);
    if (usage > 4 || intention > 2) {
      warn("INVALID_VALUE", "LearningOptOutIn contains a reserved Usage or Indication of Intention value.", "warning", offset + usageOffset, 4, ifd, tag);
      return;
    }
    if (index === 0 && usage !== 0) {
      warn("INVALID_VALUE", "LearningOptOutIn must begin with Usage 0 (all/individual usage not specified).", "warning", offset + usageOffset, 2, ifd, tag);
      return;
    }
    if (usages.has(usage)) {
      warn("INVALID_VALUE", "LearningOptOutIn must not repeat a Usage value.", "warning", offset + usageOffset, 2, ifd, tag);
      return;
    }
    usages.add(usage);
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
  if (type === "UTF-8") return decodeUtf8(bytes, offset, count, ifd, tag, warn);
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

function decodeUtf8(
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
  const rawBytes = bytes.slice(offset, offset + count);
  if (count === 0) {
    warn("INVALID_VALUE", `UTF-8 tag 0x${hexTag(tag)} has an empty byte sequence.`, "warning", offset, 0, ifd, tag);
    return { raw: rawBytes, interpretable: false };
  }
  if (rawBytes[rawBytes.length - 1] !== 0) {
    warn("INVALID_VALUE", `UTF-8 tag 0x${hexTag(tag)} is not NUL-terminated.`, "warning", offset, count, ifd, tag);
    return { raw: rawBytes, interpretable: false };
  }
  let end = rawBytes.length;
  while (end > 0 && rawBytes[end - 1] === 0) end -= 1;
  const payload = rawBytes.subarray(0, end);
  if (payload.length >= 3 && payload[0] === 0xef && payload[1] === 0xbb && payload[2] === 0xbf) {
    warn("INVALID_VALUE", `UTF-8 tag 0x${hexTag(tag)} must not contain a UTF-8 BOM.`, "warning", offset, count, ifd, tag);
    return { raw: rawBytes, interpretable: false };
  }
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(payload);
    return { raw: text, interpretable: true };
  } catch {
    warn("INVALID_VALUE", `UTF-8 tag 0x${hexTag(tag)} contains an invalid UTF-8 sequence.`, "warning", offset, count, ifd, tag);
    return { raw: rawBytes, interpretable: false };
  }
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
  const definition = getDirectoryTagDefinition(ifd, tag, registry);
  const name = definition?.name ?? (tag === 0x014a ? "SubIFDs" : formatUnknownTag(tag));
  return {
    id: `${ifd}:0x${hexTag(tag)}`,
    ifd,
    tag,
    name,
    raw,
    value,
    display: displayExifValue(ifd, tag, raw, value, definition),
    description: definition?.description ?? "Unrecognized TIFF/EXIF tag; retained without assigning semantics.",
    type,
    sensitivity: definition?.sensitivity ?? "none",
    count,
    known: definition !== undefined,
    ...(source === undefined ? {} : { source: { blockId: "", ...source } }),
  };
}

function getDirectoryTagDefinition(ifd: string, tag: number, registry: MetadataRegistry): ReturnType<MetadataRegistry["get"]> {
  const direct = getTagDefinition(ifd, tag, registry);
  if (direct !== undefined) return direct;
  // TIFF image directories (IFD1, IFD2, SubIFD[n], and preview chains) use
  // the baseline IFD0 vocabulary for image tags while retaining their own
  // directory identity in field.id/source provenance.
  if (/^(?:IFD\d+|SubIFD\[\d+\])$/u.test(ifd)) return getTagDefinition("IFD0", tag, registry);
  return undefined;
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
  } else if (type === "ASCII" || type === "UTF-8") {
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
