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
  readonly name: "IFD0" | "ExifIFD" | "GPSIFD" | "InteropIFD" | "IFD1";
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
  const definition = getTagDefinition(ifd, tag);
  return selection.has(definition?.name ?? formatUnknownTag(tag)) || selection.has(`${ifd}:0x${tag.toString(16).padStart(4, "0")}`);
}

function isPointer(ifd: TiffDirectory["name"], tag: number): boolean {
  return (ifd === "IFD0" && (tag === 0x8769 || tag === 0x8825)) || (ifd === "ExifIFD" && tag === 0xa005);
}

function pointerName(ifd: TiffDirectory["name"], tag: number): TiffDirectory["name"] | null {
  if (ifd === "IFD0" && tag === 0x8769) return "ExifIFD";
  if (ifd === "IFD0" && tag === 0x8825) return "GPSIFD";
  if (ifd === "ExifIFD" && tag === 0xa005) return "InteropIFD";
  return null;
}

function rangeKey(offset: number, length: number): string {
  return `${offset}:${length}`;
}

function addWarning(warnings: MetadataWarning[], limits: SecurityLimits, warning: Omit<MetadataWarning, "severity"> & { readonly severity?: MetadataWarning["severity"] }): void {
  if (warnings.length < limits.maxWarnings) warnings.push({ severity: "warning", ...warning });
}

async function buildTiffPlan(reader: BlobReader, limits: SecurityLimits, selection: ResolvedSelection): Promise<TiffRangePlan | null> {
  if (reader.size < 8) return null;
  const header = await reader.read(0, 8);
  const littleEndian = header[0] === 0x49 && header[1] === 0x49;
  const bigEndian = header[0] === 0x4d && header[1] === 0x4d;
  if (!littleEndian && !bigEndian) return null;
  if (u16(header, 2, littleEndian) !== 42) return null;
  const firstIfd = u32(header, 4, littleEndian);
  if (firstIfd < 8 || firstIfd >= reader.size) return null;

  const warnings: MetadataWarning[] = [];
  const ranges = new Map<string, TiffRange>();
  const directories: TiffDirectory[] = [];
  const visited = new Set<number>();
  const queue: Array<{ readonly offset: number; readonly name: TiffDirectory["name"]; readonly depth: number }> = [{ offset: firstIfd, name: "IFD0", depth: 0 }];
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
            if (valueRange !== null) valueRangeKey = rangeKey(valueOffset, byteCount);
          } else {
            addWarning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "A selected TIFF value exceeds the configured value limit and was not read.", offset: valueOffset, length: byteCount });
          }
        }
      }
      const entry: TiffEntry = { entryOffset, tag, type, count, byteCount, selected, pointer, valueOffset, valueRangeKey, inlineRemapKey: null };
      entries.push(entry);
      const pointerTarget = pointerName(work.name, tag);
      if (pointerTarget !== null && (type === 4 || type === 13) && count === 1) {
        const target = byteCount !== null && byteCount <= 4 ? u32(tableRange.data, entryOffset + 8, littleEndian) : null;
        if (target !== null && target !== 0) queue.push({ offset: target, name: pointerTarget, depth: work.depth + 1 });
      }
    }
    const nextLocation = 2 + declaredCount * 12;
    const nextOffset = complete && nextLocation + 4 <= tableRange.data.length ? u32(tableRange.data, nextLocation, littleEndian) : 0;
    directories.push({ offset: work.offset, name: work.name, table: tableRange.data, declaredCount, entries, nextOffset, complete });
    if (work.name === "IFD0" && nextOffset !== 0) queue.push({ offset: nextOffset, name: "IFD1", depth: work.depth + 1 });
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
          return { header, directories: updatedDirectories, ranges, warnings };
        }
      } else if (thumbnailLength > limits.maxValueBytes) {
        addWarning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "The EXIF thumbnail exceeds the configured value limit and was not read.", offset: thumbnailOffset, length: thumbnailLength });
      }
    }
  }
  return { header, directories, ranges, warnings };
}

function compactTiff(plan: TiffRangePlan, limits: SecurityLimits, reader: BlobReader): MetadataMaterialization {
  const littleEndian = plan.header[0] === 0x49 && plan.header[1] === 0x49;
  const directoryOffsets = new Map<number, number>();
  let outputLength = 8;
  for (const directory of plan.directories) {
    directoryOffsets.set(directory.offset, outputLength);
    outputLength += directory.table.length;
  }
  const valueOffsets = new Map<string, number>();
  for (const [key, range] of plan.ranges) {
    if (plan.directories.some((directory) => directory.offset === range.offset)) continue;
    valueOffsets.set(key, outputLength);
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
      if (entry.pointer && (entry.type === 4 || entry.type === 13) && entry.count === 1) {
        const target = entry.byteCount !== null && entry.byteCount <= 4 ? u32(directory.table, entry.entryOffset + 8, littleEndian) : 0;
        const mapped = directoryOffsets.get(target);
        if (mapped !== undefined) putU32(output, destinationEntry + 8, mapped, littleEndian);
      } else if (entry.valueRangeKey !== null || entry.inlineRemapKey !== null) {
        const rangeKeyValue = entry.valueRangeKey ?? entry.inlineRemapKey;
        const mapped = rangeKeyValue === null ? undefined : valueOffsets.get(rangeKeyValue);
        if (mapped !== undefined) putU32(output, destinationEntry + 8, mapped, littleEndian);
      }
    }
    if (directory.name === "IFD0" && directory.complete && directory.nextOffset !== 0) {
      const mapped = directoryOffsets.get(directory.nextOffset);
      if (mapped !== undefined) putU32(output, destination + 2 + directory.declaredCount * 12, mapped, littleEndian);
    }
  }
  for (const [key, destination] of valueOffsets) {
    const range = plan.ranges.get(key);
    if (range !== undefined) output.set(range.data, destination);
  }
  return {
    bytes: output,
    partial: true,
    bytesRead: reader.bytesRead(),
    inputBytes: reader.size,
    warnings: plan.warnings,
    telemetry: reader.telemetry(),
  };
}

/** Read classic TIFF directories and selected values without materialising pixel ranges. */
export async function materializeTiffMetadata(reader: BlobReader, limits: SecurityLimits, selection: ResolvedSelection): Promise<MetadataMaterialization | null> {
  const plan = await buildTiffPlan(reader, limits, selection);
  return plan === null ? null : compactTiff(plan, limits, reader);
}
