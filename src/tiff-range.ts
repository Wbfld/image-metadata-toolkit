import { formatUnknownTag, getTagDefinition } from "./normalize/descriptions.js";
import type { MetadataMaterialization, BlobReader } from "./input.js";
import type { ResolvedSelection } from "./selection.js";
import type { MetadataWarning, SecurityLimits } from "./types.js";

interface TiffType {
  readonly size: number;
}

const TIFF_TYPES: Readonly<Record<number, TiffType>> = {
  1: { size: 1 },
  2: { size: 1 },
  3: { size: 2 },
  4: { size: 4 },
  5: { size: 8 },
  6: { size: 1 },
  7: { size: 1 },
  8: { size: 2 },
  9: { size: 4 },
  10: { size: 8 },
  11: { size: 4 },
  12: { size: 8 },
  13: { size: 4 },
};

interface TiffEntry {
  readonly entryOffset: number;
  readonly tag: number;
  readonly type: number;
  readonly count: number;
  readonly byteCount: number | null;
  readonly selected: boolean;
  readonly pointer: boolean;
  readonly valueOffset: number | null;
  readonly valueRangeKey: string | null;
  readonly inlineRemapKey: string | null;
}

interface TiffDirectory {
  readonly offset: number;
  readonly name: string;
  readonly table: Uint8Array;
  readonly declaredCount: number;
  readonly entries: readonly TiffEntry[];
  readonly nextOffset: number;
  readonly complete: boolean;
}

interface TiffRange {
  readonly offset: number;
  readonly length: number;
  readonly data: Uint8Array;
}

interface TiffRangePlan {
  readonly header: Uint8Array;
  readonly directories: readonly TiffDirectory[];
  readonly ranges: ReadonlyMap<string, TiffRange>;
  readonly warnings: readonly MetadataWarning[];
  readonly bigTiff?: boolean;
}

interface RangeMarker {
  readonly offset: number;
  readonly length: number;
  readonly category: "directory" | "value";
}

function overlappingMarker(markers: readonly RangeMarker[], offset: number, length: number, ignoreValues = false): RangeMarker | undefined {
  if (length <= 0) return undefined;
  return markers.find((marker) => {
    if (ignoreValues && marker.category === "value") return false;
    return offset < marker.offset + marker.length && marker.offset < offset + length;
  });
}

function u16(bytes: Uint8Array, offset: number, littleEndian: boolean): number {
  return littleEndian
    ? (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8)
    : ((bytes[offset] ?? 0) << 8) | (bytes[offset + 1] ?? 0);
}

function u32(bytes: Uint8Array, offset: number, littleEndian: boolean): number {
  return littleEndian
    ? (bytes[offset] ?? 0) + (bytes[offset + 1] ?? 0) * 0x100 + (bytes[offset + 2] ?? 0) * 0x10000 + (bytes[offset + 3] ?? 0) * 0x1000000
    : (bytes[offset] ?? 0) * 0x1000000 + (bytes[offset + 1] ?? 0) * 0x10000 + (bytes[offset + 2] ?? 0) * 0x100 + (bytes[offset + 3] ?? 0);
}

function putU32(bytes: Uint8Array, offset: number, value: number, littleEndian: boolean): void {
  if (littleEndian) {
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

function u64(bytes: Uint8Array, offset: number, littleEndian: boolean): number | null {
  let value = 0n;
  for (let index = 0; index < 8; index += 1) {
    const shift = BigInt(littleEndian ? index : 7 - index);
    value |= BigInt(bytes[offset + index] ?? 0) << (shift * 8n);
  }
  return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : null;
}

function putU64(bytes: Uint8Array, offset: number, value: number, littleEndian: boolean): void {
  let remaining = BigInt(value);
  for (let index = 0; index < 8; index += 1) {
    const position = littleEndian ? index : 7 - index;
    bytes[offset + position] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }
}

const BIG_TIFF_TYPES: Readonly<Record<number, TiffType>> = {
  ...TIFF_TYPES,
  16: { size: 8 },
  17: { size: 8 },
  18: { size: 8 },
};

function checkedMultiply(left: number, right: number): number | null {
  const result = left * right;
  return Number.isSafeInteger(result) && result >= 0 ? result : null;
}

function selectedTags(selection: ResolvedSelection): ReadonlySet<string> | null {
  if (selection.groups === null) return selection.tags;
  if (selection.groups.has("EXIF") && selection.tags === null) return null;
  const tags = new Set(selection.tags ?? []);
  if (selection.groups.has("Dimensions")) {
    tags.add("ImageWidth");
    tags.add("ImageLength");
  }
  if (selection.groups.has("XMP")) tags.add("IFD0:0x02bc");
  if (selection.groups.has("IPTC")) tags.add("IFD0:0x83bb");
  if (selection.groups.has("ICC")) tags.add("IFD0:0x8773");
  return tags;
}

function selectedEntry(name: string, tag: number, ifd: TiffDirectory["name"], selection: ReadonlySet<string> | null): boolean {
  if (selection === null) return true;
  const definition = getTagDefinition(ifd, tag) ?? (/^(?:IFD\d+|SubIFD\[\d+\])$/u.test(ifd) ? getTagDefinition("IFD0", tag) : undefined);
  return selection.has(definition?.name ?? (tag === 0x014a ? "SubIFDs" : formatUnknownTag(tag))) || selection.has(`${ifd}:0x${tag.toString(16).padStart(4, "0")}`);
}

function isPointer(ifd: TiffDirectory["name"], tag: number): boolean {
  return tag === 0x014a || tag === 0x8769 || tag === 0x8825 || (tag === 0xa005 && ifd.startsWith("ExifIFD"));
}

function pointerName(ifd: TiffDirectory["name"], tag: number): TiffDirectory["name"] | null {
  if (tag === 0x8769 && !ifd.startsWith("ExifIFD")) return "ExifIFD";
  if (tag === 0x8825 && !ifd.startsWith("GPSIFD")) return "GPSIFD";
  if (tag === 0xa005 && ifd.startsWith("ExifIFD")) return "InteropIFD";
  return null;
}

function pointerValues(table: Uint8Array, entry: TiffEntry, ranges: ReadonlyMap<string, TiffRange>, littleEndian: boolean): readonly number[] {
  if (!entry.pointer || (entry.type !== 4 && entry.type !== 13) || entry.byteCount === null || entry.byteCount % 4 !== 0) return [];
  const source = entry.byteCount <= 4
    ? table.subarray(entry.entryOffset + 8, entry.entryOffset + 12)
    : entry.valueRangeKey === null ? new Uint8Array() : ranges.get(entry.valueRangeKey)?.data ?? new Uint8Array();
  const values: number[] = [];
  for (let offset = 0; offset + 4 <= source.length && values.length < entry.count; offset += 4) values.push(u32(source, offset, littleEndian));
  return values;
}

function rangeKey(offset: number, length: number): string {
  return `${offset}:${length}`;
}

function addWarning(warnings: MetadataWarning[], limits: SecurityLimits, warning: Omit<MetadataWarning, "severity"> & { readonly severity?: MetadataWarning["severity"] }): void {
  if (warnings.length < limits.maxWarnings) warnings.push({ severity: "warning", ...warning });
}

async function buildTiffPlan(reader: BlobReader, limits: SecurityLimits, selection: ResolvedSelection): Promise<TiffRangePlan | null> {
  if (reader.size < 8) return null;
  const header = await reader.read(0, Math.min(reader.size, 16));
  const littleEndian = header[0] === 0x49 && header[1] === 0x49;
  const bigEndian = header[0] === 0x4d && header[1] === 0x4d;
  if (!littleEndian && !bigEndian) return null;
  if (u16(header, 2, littleEndian) === 43) return buildBigTiffPlan(reader, limits, selection, header);
  if (u16(header, 2, littleEndian) !== 42) return null;
  const classicHeader = header.subarray(0, 8);
  const firstIfd = u32(header, 4, littleEndian);
  if (firstIfd < 8 || firstIfd >= reader.size) return null;

  const warnings: MetadataWarning[] = [];
  const ranges = new Map<string, TiffRange>();
  const directories: TiffDirectory[] = [];
  const markers: RangeMarker[] = [{ offset: 0, length: 8, category: "directory" }];
  const visited = new Set<number>();
  const queue: Array<{ readonly offset: number; readonly name: TiffDirectory["name"]; readonly depth: number }> = [{ offset: firstIfd, name: "IFD0", depth: 0 }];
  let subIfdNumber = 0;
  let nextIfdNumber = 1;
  const wanted = selectedTags(selection);
  let metadataBytes = 0;

  const readRange = async (offset: number, length: number): Promise<TiffRange | null> => {
    if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset > reader.size || length > reader.size - offset) return null;
    const key = rangeKey(offset, length);
    const existing = ranges.get(key);
    if (existing !== undefined) return existing;
    if (metadataBytes + length > limits.maxMetadataBytes) {
      addWarning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "TIFF metadata ranges exceed the configured metadata budget; later values were not read.", offset, length });
      return null;
    }
    const data = await reader.read(offset, offset + length);
    const range = { offset, length, data } satisfies TiffRange;
    ranges.set(key, range);
    metadataBytes += length;
    return range;
  };

  while (queue.length > 0) {
    const work = queue.shift();
    if (work === undefined) break;
    if (work.depth > limits.maxIfdDepth) {
      addWarning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "TIFF IFD nesting exceeds the configured maximum depth.", offset: work.offset });
      continue;
    }
    if (visited.has(work.offset)) continue;
    if (visited.size >= limits.maxSegments) {
      addWarning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "TIFF directory count exceeds the configured limit.", offset: work.offset });
      break;
    }
    visited.add(work.offset);
    const countBytes = await readRange(work.offset, 2);
    if (countBytes === null) return null;
    const declaredCount = u16(countBytes.data, 0, littleEndian);
    const countToRead = Math.min(declaredCount, limits.maxIfdEntries);
    const tableLength = 2 + countToRead * 12 + 4;
    const tableRange = await readRange(work.offset, tableLength);
    if (tableRange === null) return null;
    const tableConflict = overlappingMarker(markers, work.offset, tableLength);
    if (tableConflict !== undefined) {
      addWarning(warnings, limits, { code: "UNSAFE_OFFSET", message: `${work.name} directory overlaps an existing metadata range; it was not decoded.`, offset: work.offset, length: tableLength });
      continue;
    }
    markers.push({ offset: work.offset, length: tableLength, category: "directory" });
    const complete = countToRead === declaredCount && work.offset + 2 + declaredCount * 12 + 4 <= reader.size;
    const entries: TiffEntry[] = [];
    for (let index = 0; index < countToRead; index += 1) {
      const entryOffset = 2 + index * 12;
      const tag = u16(tableRange.data, entryOffset, littleEndian);
      const type = u16(tableRange.data, entryOffset + 2, littleEndian);
      const count = u32(tableRange.data, entryOffset + 4, littleEndian);
      const definition = TIFF_TYPES[type];
      const byteCount = definition === undefined ? null : checkedMultiply(count, definition.size);
      const pointer = isPointer(work.name, tag);
      const selected = selectedEntry(work.name, tag, work.name, wanted);
      let valueOffset: number | null = null;
      let valueRangeKey: string | null = null;
      if (byteCount !== null && byteCount > 4) {
        valueOffset = u32(tableRange.data, entryOffset + 8, littleEndian);
        if (selected || pointer) {
          if (byteCount <= limits.maxValueBytes) {
            const valueRange = await readRange(valueOffset, byteCount);
            if (valueRange !== null) {
              const valueConflict = overlappingMarker(markers, valueOffset, byteCount, true);
              if (valueConflict === undefined) {
                valueRangeKey = rangeKey(valueOffset, byteCount);
                markers.push({ offset: valueOffset, length: byteCount, category: "value" });
              } else addWarning(warnings, limits, { code: "UNSAFE_OFFSET", message: `${work.name} value overlaps a directory table; it was not decoded.`, offset: valueOffset, length: byteCount });
            }
          } else {
            addWarning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "A selected TIFF value exceeds the configured value limit and was not read.", offset: valueOffset, length: byteCount });
          }
        }
      }
      const entry: TiffEntry = { entryOffset, tag, type, count, byteCount, selected, pointer, valueOffset, valueRangeKey, inlineRemapKey: null };
      entries.push(entry);
      const pointerTarget = pointerName(work.name, tag);
      if (pointerTarget !== null && (type === 4 || type === 13) && count === 1) {
        const target = pointerValues(tableRange.data, entry, ranges, littleEndian)[0] ?? 0;
        if (target !== 0) queue.push({ offset: target, name: pointerTarget, depth: work.depth + 1 });
      } else if (tag === 0x014a && (type === 4 || type === 13)) {
        for (const target of pointerValues(tableRange.data, entry, ranges, littleEndian)) {
          if (target !== 0) queue.push({ offset: target, name: `SubIFD[${subIfdNumber++}]`, depth: work.depth + 1 });
        }
      }
    }
    const nextLocation = 2 + declaredCount * 12;
    const nextOffset = complete && nextLocation + 4 <= tableRange.data.length ? u32(tableRange.data, nextLocation, littleEndian) : 0;
    directories.push({ offset: work.offset, name: work.name, table: tableRange.data, declaredCount, entries, nextOffset, complete });
    if (nextOffset !== 0) queue.push({ offset: nextOffset, name: `IFD${nextIfdNumber++}`, depth: work.depth + 1 });
  }

  if (directories.length === 0) return null;

  // IFD1 thumbnails are metadata too. Include their bounded JPEG range when
  // EXIF was requested, then remap the inline offset in the compact view.
  if (selection.groups === null || selection.groups.has("EXIF")) {
    const thumbnailDirectory = directories.find(({ name }) => name === "IFD1");
    const thumbnailOffsetEntry = thumbnailDirectory?.entries.find(({ tag, type, count }) => tag === 0x0201 && type === 4 && count === 1);
    const thumbnailLengthEntry = thumbnailDirectory?.entries.find(({ tag, type, count }) => tag === 0x0202 && type === 4 && count === 1);
    if (thumbnailDirectory !== undefined && thumbnailOffsetEntry !== undefined && thumbnailLengthEntry !== undefined) {
      const thumbnailOffset = u32(thumbnailDirectory.table, thumbnailOffsetEntry.entryOffset + 8, littleEndian);
      const thumbnailLength = u32(thumbnailDirectory.table, thumbnailLengthEntry.entryOffset + 8, littleEndian);
      if (thumbnailLength > 0 && thumbnailLength <= limits.maxValueBytes) {
        const thumbnail = await readRange(thumbnailOffset, thumbnailLength);
        if (thumbnail !== null) {
          const thumbnailKey = rangeKey(thumbnailOffset, thumbnailLength);
          const updatedDirectories = directories.map((directory) => directory.name !== "IFD1" ? directory : {
            ...directory,
            entries: directory.entries.map((entry) => entry === thumbnailOffsetEntry ? { ...entry, inlineRemapKey: thumbnailKey } : entry),
          });
          return { header: classicHeader, directories: updatedDirectories, ranges, warnings, bigTiff: false };
        }
      } else if (thumbnailLength > limits.maxValueBytes) {
        addWarning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "The EXIF thumbnail exceeds the configured value limit and was not read.", offset: thumbnailOffset, length: thumbnailLength });
      }
    }
  }
  return { header: classicHeader, directories, ranges, warnings, bigTiff: false };
}

async function buildBigTiffPlan(reader: BlobReader, limits: SecurityLimits, selection: ResolvedSelection, prefix: Uint8Array): Promise<TiffRangePlan | null> {
  if (prefix.length < 16) return null;
  const littleEndian = prefix[0] === 0x49 && prefix[1] === 0x49;
  const bigEndian = prefix[0] === 0x4d && prefix[1] === 0x4d;
  if ((!littleEndian && !bigEndian) || u16(prefix, 4, littleEndian) !== 8 || u16(prefix, 6, littleEndian) !== 0) return null;
  const firstIfd = u64(prefix, 8, littleEndian);
  if (firstIfd === null || firstIfd < 16 || firstIfd >= reader.size) return null;
  const warnings: MetadataWarning[] = [];
  const ranges = new Map<string, TiffRange>();
  const directories: TiffDirectory[] = [];
  const markers: RangeMarker[] = [{ offset: 0, length: 16, category: "directory" }];
  const visited = new Set<number>();
  const queue: Array<{ readonly offset: number; readonly name: string; readonly depth: number }> = [{ offset: firstIfd, name: "IFD0", depth: 0 }];
  const wanted = selectedTags(selection);
  let metadataBytes = 0;
  let subIfdNumber = 0;
  let nextIfdNumber = 1;
  const readRange = async (offset: number, length: number): Promise<TiffRange | null> => {
    if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset > reader.size || length > reader.size - offset) return null;
    const key = rangeKey(offset, length);
    const existing = ranges.get(key);
    if (existing !== undefined) return existing;
    if (metadataBytes + length > limits.maxMetadataBytes) {
      addWarning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "BigTIFF metadata ranges exceed the configured metadata budget; later values were not read.", offset, length });
      return null;
    }
    const data = await reader.read(offset, offset + length);
    const range = { offset, length, data } satisfies TiffRange;
    ranges.set(key, range);
    metadataBytes += length;
    return range;
  };
  const pointerValuesBig = (table: Uint8Array, entry: TiffEntry): readonly number[] => {
    if (!entry.pointer || entry.byteCount === null || (entry.type !== 4 && entry.type !== 13 && entry.type !== 16 && entry.type !== 18)) return [];
    const width = entry.type === 16 || entry.type === 18 ? 8 : 4;
    if (entry.byteCount % width !== 0) return [];
    const source = entry.byteCount <= 8 ? table.subarray(entry.entryOffset + 12, entry.entryOffset + 20) : entry.valueRangeKey === null ? new Uint8Array() : ranges.get(entry.valueRangeKey)?.data ?? new Uint8Array();
    const values: number[] = [];
    for (let offset = 0; offset + width <= source.length && values.length < entry.count; offset += width) {
      const value = width === 8 ? u64(source, offset, littleEndian) : u32(source, offset, littleEndian);
      if (value !== null && value !== 0) values.push(value);
    }
    return values;
  };
  while (queue.length > 0) {
    const work = queue.shift();
    if (work === undefined) break;
    if (work.depth > limits.maxIfdDepth) {
      addWarning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "BigTIFF IFD nesting exceeds the configured maximum depth.", offset: work.offset });
      continue;
    }
    if (visited.has(work.offset)) {
      addWarning(warnings, limits, { code: "MALFORMED_EXIF", message: "BigTIFF directory offset was already visited; shared or cyclic reference was not re-decoded.", offset: work.offset });
      continue;
    }
    if (visited.size >= limits.maxSegments) {
      addWarning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "BigTIFF directory count exceeds the configured limit.", offset: work.offset });
      break;
    }
    visited.add(work.offset);
    const countRange = await readRange(work.offset, 8);
    if (countRange === null) return null;
    const declaredCount = u64(countRange.data, 0, littleEndian);
    if (declaredCount === null) {
      addWarning(warnings, limits, { code: "UNSAFE_OFFSET", message: "BigTIFF directory entry count exceeds safe arithmetic.", offset: work.offset, length: 8 });
      continue;
    }
    const countToRead = Math.min(declaredCount, limits.maxIfdEntries);
    const tableLength = 8 + countToRead * 20 + 8;
    if (!Number.isSafeInteger(tableLength)) {
      addWarning(warnings, limits, { code: "UNSAFE_OFFSET", message: "BigTIFF directory table size overflows safe arithmetic.", offset: work.offset, length: 8 });
      continue;
    }
    const tableRange = await readRange(work.offset, tableLength);
    if (tableRange === null) return null;
    const tableConflict = overlappingMarker(markers, work.offset, tableLength);
    if (tableConflict !== undefined) {
      addWarning(warnings, limits, { code: "UNSAFE_OFFSET", message: `${work.name} directory overlaps an existing metadata range; it was not decoded.`, offset: work.offset, length: tableLength });
      continue;
    }
    markers.push({ offset: work.offset, length: tableLength, category: "directory" });
    const complete = countToRead === declaredCount && work.offset <= reader.size - (8 + declaredCount * 20 + 8);
    const entries: TiffEntry[] = [];
    for (let index = 0; index < countToRead; index += 1) {
      const entryOffset = 8 + index * 20;
      const tag = u16(tableRange.data, entryOffset, littleEndian);
      const type = u16(tableRange.data, entryOffset + 2, littleEndian);
      const count = u64(tableRange.data, entryOffset + 4, littleEndian);
      const definition = BIG_TIFF_TYPES[type];
      const byteCount = count === null || definition === undefined ? null : checkedMultiply(count, definition.size);
      const pointer = isPointer(work.name, tag);
      const selected = selectedEntry(work.name, tag, work.name, wanted);
      let valueOffset: number | null = null;
      let valueRangeKey: string | null = null;
      if (byteCount !== null && byteCount > 8) {
        valueOffset = u64(tableRange.data, entryOffset + 12, littleEndian);
        if (valueOffset !== null && (selected || pointer)) {
          if (byteCount <= limits.maxValueBytes) {
            const valueRange = await readRange(valueOffset, byteCount);
            if (valueRange !== null) {
              const valueConflict = overlappingMarker(markers, valueOffset, byteCount, true);
              if (valueConflict === undefined) {
                valueRangeKey = rangeKey(valueOffset, byteCount);
                markers.push({ offset: valueOffset, length: byteCount, category: "value" });
              } else addWarning(warnings, limits, { code: "UNSAFE_OFFSET", message: `${work.name} value overlaps a directory table; it was not decoded.`, offset: valueOffset, length: byteCount });
            }
          } else addWarning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "A selected BigTIFF value exceeds the configured value limit and was not read.", offset: valueOffset, length: byteCount });
        }
      }
      const entry: TiffEntry = { entryOffset, tag, type, count: count ?? 0, byteCount, selected, pointer, valueOffset, valueRangeKey, inlineRemapKey: null };
      entries.push(entry);
      const pointerTarget = pointerName(work.name, tag);
      const values = pointerTarget !== null || tag === 0x014a ? pointerValuesBig(tableRange.data, entry) : [];
      if (pointerTarget !== null && values.length === 1) queue.push({ offset: values[0] ?? 0, name: pointerTarget, depth: work.depth + 1 });
      if (tag === 0x014a) for (const target of values) queue.push({ offset: target, name: `SubIFD[${subIfdNumber++}]`, depth: work.depth + 1 });
    }
    const nextOffset = complete ? u64(tableRange.data, 8 + declaredCount * 20, littleEndian) ?? 0 : 0;
    directories.push({ offset: work.offset, name: work.name, table: tableRange.data, declaredCount, entries, nextOffset, complete });
    if (!complete) addWarning(warnings, limits, { code: "TRUNCATED_DATA", message: `${work.name} declares ${declaredCount} entries but its table is truncated.`, offset: work.offset, length: tableRange.length });
    if (nextOffset !== 0) queue.push({ offset: nextOffset, name: `IFD${nextIfdNumber++}`, depth: work.depth + 1 });
  }
  return directories.length === 0 ? null : { header: prefix.subarray(0, 16), directories, ranges, warnings, bigTiff: true };
}

function compactTiff(plan: TiffRangePlan, limits: SecurityLimits, reader: BlobReader): MetadataMaterialization {
  if (plan.bigTiff === true) return compactBigTiff(plan, limits, reader);
  const littleEndian = plan.header[0] === 0x49 && plan.header[1] === 0x49;
  const directoryOffsets = new Map<number, number>();
  const offsetRanges: Array<{ readonly compact: number; readonly source: number; readonly length: number }> = [{ compact: 0, source: 0, length: plan.header.length }];
  let outputLength = 8;
  for (const directory of plan.directories) {
    directoryOffsets.set(directory.offset, outputLength);
    offsetRanges.push({ compact: outputLength, source: directory.offset, length: directory.table.length });
    outputLength += directory.table.length;
  }
  const valueOffsets = new Map<string, number>();
  for (const [key, range] of plan.ranges) {
    if (plan.directories.some((directory) => directory.offset === range.offset)) continue;
    valueOffsets.set(key, outputLength);
    offsetRanges.push({ compact: outputLength, source: range.offset, length: range.length });
    outputLength += range.length;
  }
  if (!Number.isSafeInteger(outputLength) || outputLength > limits.maxInputBytes) {
    return { bytes: plan.header.slice(), partial: true, bytesRead: reader.bytesRead(), inputBytes: reader.size, warnings: [...plan.warnings, { code: "LIMIT_EXCEEDED", message: "Compacted TIFF metadata exceeds the configured input limit.", severity: "warning" }], telemetry: reader.telemetry() };
  }
  const output = new Uint8Array(outputLength);
  output.set(plan.header, 0);
  putU32(output, 4, directoryOffsets.get(plan.directories[0]?.offset ?? 0) ?? 8, littleEndian);
  for (const directory of plan.directories) {
    const destination = directoryOffsets.get(directory.offset);
    if (destination === undefined) continue;
    output.set(directory.table, destination);
    for (const entry of directory.entries) {
      const destinationEntry = destination + entry.entryOffset;
      if (entry.pointer && (entry.type === 4 || entry.type === 13)) {
        const targets = pointerValues(directory.table, entry, plan.ranges, littleEndian);
        if (entry.byteCount !== null && entry.byteCount <= 4 && targets.length === 1) {
          const mapped = directoryOffsets.get(targets[0] ?? 0);
          if (mapped !== undefined) putU32(output, destinationEntry + 8, mapped, littleEndian);
        } else if (entry.valueRangeKey !== null) {
          const valueDestination = valueOffsets.get(entry.valueRangeKey);
          if (valueDestination !== undefined) {
            for (let index = 0; index < targets.length; index += 1) {
              const mapped = directoryOffsets.get(targets[index] ?? 0);
              if (mapped !== undefined) putU32(output, valueDestination + index * 4, mapped, littleEndian);
            }
            putU32(output, destinationEntry + 8, valueDestination, littleEndian);
          }
        }
      } else if (entry.valueRangeKey !== null || entry.inlineRemapKey !== null) {
        const rangeKeyValue = entry.valueRangeKey ?? entry.inlineRemapKey;
        const mapped = rangeKeyValue === null ? undefined : valueOffsets.get(rangeKeyValue);
        if (mapped !== undefined) putU32(output, destinationEntry + 8, mapped, littleEndian);
      }
    }
    if (directory.complete && directory.nextOffset !== 0) {
      const mapped = directoryOffsets.get(directory.nextOffset);
      if (mapped !== undefined) putU32(output, destination + 2 + directory.declaredCount * 12, mapped, littleEndian);
    }
  }
  for (const [key, destination] of valueOffsets) {
    const range = plan.ranges.get(key);
    if (range !== undefined) output.set(range.data, destination);
  }
  // Pointer value ranges are copied above from the source. Rewrite them once
  // more after that copy so compacted directory offsets cannot be overwritten
  // by the original (uncompacted) pointer array.
  for (const directory of plan.directories) {
    const destination = directoryOffsets.get(directory.offset);
    if (destination === undefined) continue;
    for (const entry of directory.entries) {
      if (!entry.pointer || entry.valueRangeKey === null || (entry.type !== 4 && entry.type !== 13)) continue;
      const valueDestination = valueOffsets.get(entry.valueRangeKey);
      if (valueDestination === undefined) continue;
      const targets = pointerValues(directory.table, entry, plan.ranges, littleEndian);
      for (let index = 0; index < targets.length; index += 1) {
        const mapped = directoryOffsets.get(targets[index] ?? 0);
        if (mapped !== undefined) putU32(output, valueDestination + index * 4, mapped, littleEndian);
      }
      putU32(output, destination + entry.entryOffset + 8, valueDestination, littleEndian);
    }
  }
  const mapOffset = (offset: number): number => {
    const range = offsetRanges.find(({ compact, length }) => offset >= compact && offset <= compact + length);
    return range === undefined ? offset : range.source + (offset - range.compact);
  };
  return {
    bytes: output,
    partial: true,
    bytesRead: reader.bytesRead(),
    inputBytes: reader.size,
    warnings: plan.warnings,
    telemetry: reader.telemetry(),
    mapOffset,
  };
}

function compactBigTiff(plan: TiffRangePlan, limits: SecurityLimits, reader: BlobReader): MetadataMaterialization {
  const littleEndian = plan.header[0] === 0x49 && plan.header[1] === 0x49;
  const directoryOffsets = new Map<number, number>();
  const offsetRanges: Array<{ readonly compact: number; readonly source: number; readonly length: number }> = [{ compact: 0, source: 0, length: plan.header.length }];
  let outputLength = 16;
  for (const directory of plan.directories) {
    directoryOffsets.set(directory.offset, outputLength);
    offsetRanges.push({ compact: outputLength, source: directory.offset, length: directory.table.length });
    outputLength += directory.table.length;
  }
  const valueOffsets = new Map<string, number>();
  for (const [key, range] of plan.ranges) {
    if (plan.directories.some((directory) => directory.offset === range.offset)) continue;
    valueOffsets.set(key, outputLength);
    offsetRanges.push({ compact: outputLength, source: range.offset, length: range.length });
    outputLength += range.length;
  }
  if (!Number.isSafeInteger(outputLength) || outputLength > limits.maxInputBytes) {
    return { bytes: plan.header.slice(), partial: true, bytesRead: reader.bytesRead(), inputBytes: reader.size, warnings: [...plan.warnings, { code: "LIMIT_EXCEEDED", message: "Compacted BigTIFF metadata exceeds the configured input limit.", severity: "warning" }], telemetry: reader.telemetry() };
  }
  const output = new Uint8Array(outputLength);
  output.set(plan.header, 0);
  putU64(output, 8, directoryOffsets.get(plan.directories[0]?.offset ?? 0) ?? 16, littleEndian);
  const putPointer = (bytes: Uint8Array, offset: number, type: number, value: number): void => {
    if (type === 16 || type === 18) putU64(bytes, offset, value, littleEndian);
    else putU32(bytes, offset, value, littleEndian);
  };
  for (const directory of plan.directories) {
    const destination = directoryOffsets.get(directory.offset);
    if (destination === undefined) continue;
    output.set(directory.table, destination);
    for (const entry of directory.entries) {
      const destinationEntry = destination + entry.entryOffset;
      if (entry.pointer && (entry.type === 4 || entry.type === 13 || entry.type === 16 || entry.type === 18)) {
        const width = entry.type === 16 || entry.type === 18 ? 8 : 4;
        const source = entry.byteCount !== null && entry.byteCount <= 8 ? directory.table.subarray(entry.entryOffset + 12, entry.entryOffset + 20) : entry.valueRangeKey === null ? new Uint8Array() : plan.ranges.get(entry.valueRangeKey)?.data ?? new Uint8Array();
        const targets: number[] = [];
        for (let index = 0; index < entry.count; index += 1) {
          const target = width === 8 ? u64(source, index * width, littleEndian) : u32(source, index * width, littleEndian);
          if (target !== null) targets.push(target);
        }
        if (entry.byteCount !== null && entry.byteCount <= 8 && targets.length === 1) {
          const mapped = directoryOffsets.get(targets[0] ?? 0);
          if (mapped !== undefined) putPointer(output, destinationEntry + 12, entry.type, mapped);
        } else if (entry.valueRangeKey !== null) {
          const valueDestination = valueOffsets.get(entry.valueRangeKey);
          if (valueDestination !== undefined) {
            for (let index = 0; index < targets.length; index += 1) {
              const mapped = directoryOffsets.get(targets[index] ?? 0);
              if (mapped !== undefined) putPointer(output, valueDestination + index * width, entry.type, mapped);
            }
            putU64(output, destinationEntry + 12, valueDestination, littleEndian);
          }
        }
      } else if (entry.valueRangeKey !== null) {
        const mapped = valueOffsets.get(entry.valueRangeKey);
        if (mapped !== undefined) putU64(output, destinationEntry + 12, mapped, littleEndian);
      }
    }
    if (directory.complete && directory.nextOffset !== 0) {
      const mapped = directoryOffsets.get(directory.nextOffset);
      if (mapped !== undefined) putU64(output, destination + 8 + directory.declaredCount * 20, mapped, littleEndian);
    }
  }
  for (const [key, destination] of valueOffsets) {
    const range = plan.ranges.get(key);
    if (range !== undefined) output.set(range.data, destination);
  }
  for (const directory of plan.directories) {
    const destination = directoryOffsets.get(directory.offset);
    if (destination === undefined) continue;
    for (const entry of directory.entries) {
      if (!entry.pointer || entry.valueRangeKey === null || ![4, 13, 16, 18].includes(entry.type)) continue;
      const valueDestination = valueOffsets.get(entry.valueRangeKey);
      if (valueDestination === undefined) continue;
      const width = entry.type === 16 || entry.type === 18 ? 8 : 4;
      const source = plan.ranges.get(entry.valueRangeKey)?.data ?? new Uint8Array();
      for (let index = 0; index < entry.count; index += 1) {
        const target = width === 8 ? u64(source, index * width, littleEndian) : u32(source, index * width, littleEndian);
        if (target === null) continue;
        const mapped = directoryOffsets.get(target);
        if (mapped !== undefined) (width === 8 ? putU64 : putU32)(output, valueDestination + index * width, mapped, littleEndian);
      }
      putU64(output, destination + entry.entryOffset + 12, valueDestination, littleEndian);
    }
  }
  const mapOffset = (offset: number): number => {
    const range = offsetRanges.find(({ compact, length }) => offset >= compact && offset <= compact + length);
    return range === undefined ? offset : range.source + (offset - range.compact);
  };
  return { bytes: output, partial: true, bytesRead: reader.bytesRead(), inputBytes: reader.size, warnings: plan.warnings, telemetry: reader.telemetry(), mapOffset };
}

/** Read classic TIFF directories and selected values without materialising pixel ranges. */
export async function materializeTiffMetadata(reader: BlobReader, limits: SecurityLimits, selection: ResolvedSelection): Promise<MetadataMaterialization | null> {
  const plan = await buildTiffPlan(reader, limits, selection);
  return plan === null ? null : compactTiff(plan, limits, reader);
}
