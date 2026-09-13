import { resolveLimits } from "./security/limits.js";
import { sha256Hex } from "./security/sha256.js";
import type {
  EditFailure,
  EditOperation,
  EditOperationKind,
  EditOperationStatus,
  EditPolicyEvidence,
  EditTarget,
  ExifDataType,
  RationalValue,
  SecurityLimits,
  TiffByteOrder,
  TiffEntryEdit,
  TiffEntryValue,
  TiffGraph,
  TiffGraphDirectory,
  TiffGraphEntry,
  TiffInteger,
  TiffPreservedData,
  TiffRewriteOptions,
  TiffSerializeOptions,
  TiffVariant,
} from "./types.js";
import type { MetadataField } from "./types.js";
import { parseExif, parseBigTiff } from "./metadata/exif.js";

/** Typed failure from graph parsing, planning, layout, or verification. */
export class TiffSerializationError extends Error {
  public readonly code: "INVALID_VALUE" | "UNSAFE_STRUCTURE" | "LIMIT_EXCEEDED" | "VERIFICATION_FAILURE";

  public constructor(code: TiffSerializationError["code"], message: string) {
    super(message);
    this.name = "TiffSerializationError";
    this.code = code;
  }
}

const TYPE_CODES: Readonly<Record<ExifDataType, number>> = {
  BYTE: 1,
  ASCII: 2,
  SHORT: 3,
  LONG: 4,
  RATIONAL: 5,
  SBYTE: 6,
  UNDEFINED: 7,
  SSHORT: 8,
  SLONG: 9,
  SRATIONAL: 10,
  FLOAT: 11,
  DOUBLE: 12,
  IFD: 13,
  "UTF-8": 129,
  LONG8: 16,
  SLONG8: 17,
  IFD8: 18,
  COMPOSITE: 0,
  UNKNOWN: 0,
};

const TYPE_SIZES: Readonly<Record<number, number>> = {
  1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8,
  11: 4, 12: 8, 13: 4, 16: 8, 17: 8, 18: 8, 129: 1,
};

const KNOWN_TYPES: Readonly<Record<number, ExifDataType>> = {
  1: "BYTE", 2: "ASCII", 3: "SHORT", 4: "LONG", 5: "RATIONAL", 6: "SBYTE", 7: "UNDEFINED",
  8: "SSHORT", 9: "SLONG", 10: "SRATIONAL", 11: "FLOAT", 12: "DOUBLE", 13: "IFD",
  16: "LONG8", 17: "SLONG8", 18: "IFD8", 129: "UTF-8",
};

interface ParsedHeader {
  readonly byteOrder: TiffByteOrder;
  readonly variant: TiffVariant;
  readonly littleEndian: boolean;
  readonly firstIfdOffset: number;
  readonly entryCountBytes: number;
  readonly entryBytes: number;
  readonly nextOffsetBytes: number;
  readonly inlineBytes: number;
}

interface ParsedEntry extends TiffGraphEntry {
  readonly id: string;
  readonly rawTypeCode: number;
  readonly rawBytes: Uint8Array;
  readonly sourceOffset: number;
}

interface ParsedDirectory extends TiffGraphDirectory {
  readonly offset: number;
  readonly depth: number;
  readonly parsedEntries: readonly ParsedEntry[];
  readonly nextOffset: number;
}

interface LayoutEntry {
  readonly entry: TiffGraphEntry;
  readonly typeCode: number;
  readonly count: number;
  readonly bytes: Uint8Array;
  readonly outOfLineOffset: number | null;
}

interface LayoutDirectory {
  readonly directory: TiffGraphDirectory;
  readonly offset: number;
  readonly entries: readonly LayoutEntry[];
}

interface TiffLayout {
  readonly graph: TiffGraph;
  readonly directories: readonly LayoutDirectory[];
  readonly directoryOffsets: ReadonlyMap<string, number>;
  readonly dataOffsets: ReadonlyMap<string, number>;
  readonly outputLength: number;
}

function invalid(message: string): never {
  throw new TiffSerializationError("INVALID_VALUE", message);
}

function unsafe(message: string): never {
  throw new TiffSerializationError("UNSAFE_STRUCTURE", message);
}

function limited(message: string): never {
  throw new TiffSerializationError("LIMIT_EXCEEDED", message);
}

function required<T>(value: T | undefined | null, message: string): T {
  if (value === undefined || value === null) unsafe(message);
  return value;
}

function verified(message: string): never {
  throw new TiffSerializationError("VERIFICATION_FAILURE", message);
}

function checkedAdd(left: number, right: number, label: string): number {
  const result = left + right;
  if (!Number.isSafeInteger(result) || result < 0) unsafe(`${label} overflows the safe integer range.`);
  return result;
}

function checkedMultiply(left: number, right: number, label: string): number {
  const result = left * right;
  if (!Number.isSafeInteger(result) || result < 0) unsafe(`${label} overflows the safe integer range.`);
  return result;
}

function aligned(value: number, alignment: number): number {
  const remainder = value % alignment;
  return remainder === 0 ? value : checkedAdd(value, alignment - remainder, "alignment");
}

function inRange(total: number, offset: number, length: number): boolean {
  return Number.isSafeInteger(offset) && Number.isSafeInteger(length) && offset >= 0 && length >= 0 && offset <= total && length <= total - offset;
}

function cloneBytes(bytes: Uint8Array): Uint8Array {
  return bytes.slice();
}

function cloneValue(value: TiffEntryValue): TiffEntryValue {
  switch (value.kind) {
    case "raw": return { kind: "raw", bytes: cloneBytes(value.bytes), ...(value.count === undefined ? {} : { count: value.count }) };
    case "text": return { ...value };
    case "numbers": return { kind: "numbers", values: value.values.map((item) => typeof item === "number" ? item : { ...item }) };
    case "rationals": return { kind: "rationals", values: value.values.map((item) => ({ ...item })) };
    case "floats": return { kind: "floats", values: [...value.values] };
    case "directory-references": return { kind: "directory-references", directoryIds: [...value.directoryIds] };
    case "data-references": return { kind: "data-references", dataIds: [...value.dataIds] };
  }
}

function valueKey(value: TiffEntryValue): string {
  switch (value.kind) {
    case "raw": return `raw:${value.count ?? ""}:${Array.from(value.bytes).join(",")}`;
    case "text": return `text:${value.nulTerminated ?? true}:${value.value}`;
    case "numbers": return `numbers:${value.values.map((item) => typeof item === "number" ? String(item) : `${item.signed}:${item.decimal}`).join(",")}`;
    case "rationals": return `rationals:${value.values.map((item) => `${item.numerator}/${item.denominator}`).join(",")}`;
    case "floats": return `floats:${value.values.join(",")}`;
    case "directory-references": return `directories:${value.directoryIds.join(",")}`;
    case "data-references": return `data:${value.dataIds.join(",")}`;
  }
}

function entriesEquivalent(left: TiffGraphEntry, right: TiffGraphEntry): boolean {
  return left.tag === right.tag && left.type === right.type && left.typeCode === right.typeCode && left.count === right.count && valueKey(left.value) === valueKey(right.value);
}

function readOffset(view: DataView, offset: number, bytes: number, littleEndian: boolean): number {
  if (bytes === 4) return view.getUint32(offset, littleEndian);
  const value = view.getBigUint64(offset, littleEndian);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) unsafe("TIFF offset exceeds the safe JavaScript integer range.");
  return Number(value);
}

function writeOffset(view: DataView, offset: number, value: number, bytes: number, littleEndian: boolean): void {
  if (!Number.isSafeInteger(value) || value < 0) unsafe("TIFF offset is not a non-negative safe integer.");
  if (bytes === 4) {
    if (value > 0xffffffff) unsafe("Classic TIFF offset exceeds the uint32 range.");
    view.setUint32(offset, value, littleEndian);
  } else {
    view.setBigUint64(offset, BigInt(value), littleEndian);
  }
}

function readCount(view: DataView, offset: number, bytes: number, littleEndian: boolean): number {
  if (bytes === 2) return view.getUint16(offset, littleEndian);
  if (bytes === 4) return view.getUint32(offset, littleEndian);
  const value = view.getBigUint64(offset, littleEndian);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) limited("TIFF entry count exceeds the safe JavaScript integer range.");
  return Number(value);
}

function writeCount(view: DataView, offset: number, value: number, bytes: number, littleEndian: boolean): void {
  if (!Number.isSafeInteger(value) || value < 0) invalid("TIFF entry count must be a non-negative safe integer.");
  if (bytes === 2) {
    if (value > 0xffff) limited("Classic TIFF directory entry count exceeds 65535.");
    view.setUint16(offset, value, littleEndian);
  } else if (bytes === 4) {
    if (value > 0xffffffff) limited("Classic TIFF value count exceeds uint32.");
    view.setUint32(offset, value, littleEndian);
  } else view.setBigUint64(offset, BigInt(value), littleEndian);
}

function parseHeader(bytes: Uint8Array): ParsedHeader {
  if (bytes.byteLength < 8) unsafe("TIFF header is shorter than eight bytes.");
  const first = bytes[0];
  const second = bytes[1];
  const littleEndian = first === 0x49 && second === 0x49;
  if (!littleEndian && !(first === 0x4d && second === 0x4d)) invalid("TIFF byte-order marker must be II or MM.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const magic = view.getUint16(2, littleEndian);
  if (magic === 42) {
    const firstIfdOffset = view.getUint32(4, littleEndian);
    if (firstIfdOffset < 8) unsafe("Classic TIFF root IFD overlaps the header.");
    return { byteOrder: littleEndian ? "little-endian" : "big-endian", variant: "classic", littleEndian, firstIfdOffset, entryCountBytes: 2, entryBytes: 12, nextOffsetBytes: 4, inlineBytes: 4 };
  }
  if (magic !== 43 || bytes.byteLength < 16) invalid("TIFF magic must be 42 or a complete BigTIFF header.");
  const offsetSize = view.getUint16(4, littleEndian);
  const reserved = view.getUint16(6, littleEndian);
  if (offsetSize !== 8 || reserved !== 0) invalid("BigTIFF requires an eight-byte offset size and zero reserved word.");
  const firstIfdOffsetBig = view.getBigUint64(8, littleEndian);
  if (firstIfdOffsetBig > BigInt(Number.MAX_SAFE_INTEGER)) unsafe("BigTIFF root IFD exceeds the safe JavaScript integer range.");
  const firstIfdOffset = Number(firstIfdOffsetBig);
  if (firstIfdOffset < 16) unsafe("BigTIFF root IFD overlaps the header.");
  return { byteOrder: littleEndian ? "little-endian" : "big-endian", variant: "big-tiff", littleEndian, firstIfdOffset, entryCountBytes: 8, entryBytes: 20, nextOffsetBytes: 8, inlineBytes: 8 };
}

function typeInfo(type: ExifDataType, typeCode: number | undefined, variant: TiffVariant): { readonly code: number; readonly size: number } {
  const code = typeCode ?? TYPE_CODES[type];
  if (!Number.isSafeInteger(code) || code <= 0 || code > 0xffff) invalid(`TIFF type code for ${type} is invalid.`);
  const size = TYPE_SIZES[code];
  if (size === undefined) invalid(`TIFF type code ${code} has no bounded element size.`);
  if (variant === "classic" && (code === 16 || code === 17 || code === 18)) invalid("LONG8, SLONG8, and IFD8 require BigTIFF.");
  if (type !== "UNKNOWN" && TYPE_CODES[type] !== code && !(variant === "big-tiff" && (type === "LONG" || type === "IFD") && (code === 16 || code === 18))) invalid(`TIFF type ${type} contradicts numeric type code ${code}.`);
  return { code, size };
}

function isDirectoryPointer(tag: number): boolean {
  return tag === 0x014a || tag === 0x8769 || tag === 0x8825 || tag === 0xa005;
}

function isPayloadOffsetTag(tag: number): boolean {
  return tag === 0x0111 || tag === 0x0120 || tag === 0x0144 || tag === 0x0201;
}

function decodeUnsignedNumbers(entry: ParsedEntry, littleEndian: boolean): number[] | null {
  if (!["BYTE", "SHORT", "LONG", "IFD", "LONG8", "IFD8"].includes(entry.type)) return null;
  const info = typeInfo(entry.type, entry.rawTypeCode, entry.type === "LONG8" || entry.type === "IFD8" ? "big-tiff" : "classic");
  const view = new DataView(entry.rawBytes.buffer, entry.rawBytes.byteOffset, entry.rawBytes.byteLength);
  const values: number[] = [];
  const count = required(entry.count, "Parsed TIFF entry is missing its count.");
  for (let index = 0; index < count; index += 1) {
    const offset = index * info.size;
    const value = info.size === 1 ? entry.rawBytes[offset] ?? 0
      : info.size === 2 ? view.getUint16(offset, littleEndian)
        : info.size === 4 ? view.getUint32(offset, littleEndian)
          : (() => { const big = view.getBigUint64(offset, littleEndian); return big > BigInt(Number.MAX_SAFE_INTEGER) ? -1 : Number(big); })();
    if (value < 0) return null;
    values.push(value);
  }
  return values;
}

function parseGraph(bytes: Uint8Array, limits: SecurityLimits): TiffGraph {
  if (bytes.byteLength > limits.maxInputBytes) limited(`TIFF input is ${bytes.byteLength} bytes; the configured limit is ${limits.maxInputBytes}.`);
  const header = parseHeader(bytes);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const queue: Array<{ offset: number; depth: number }> = [{ offset: header.firstIfdOffset, depth: 0 }];
  const visited = new Map<number, ParsedDirectory>();
  const maxDirectories = limits.maxSegments;
  let totalEntries = 0;
  while (queue.length > 0) {
    const item = queue.shift();
    if (item === undefined) break;
    if (visited.has(item.offset)) continue;
    if (item.depth > limits.maxIfdDepth) limited(`TIFF IFD depth exceeds ${limits.maxIfdDepth}.`);
    if (visited.size >= maxDirectories) limited(`TIFF directory count exceeds ${maxDirectories}.`);
    const countStart = item.offset;
    if (!inRange(bytes.byteLength, countStart, header.entryCountBytes)) unsafe(`TIFF directory count at offset ${countStart} is outside the input.`);
    const count = readCount(view, countStart, header.entryCountBytes, header.littleEndian);
    if (count > limits.maxIfdEntries - totalEntries) limited(`TIFF entries exceed ${limits.maxIfdEntries}.`);
    const tableBytes = checkedMultiply(count, header.entryBytes, "TIFF directory table");
    const tableLength = checkedAdd(header.entryCountBytes, checkedAdd(tableBytes, header.nextOffsetBytes, "TIFF directory trailer"), "TIFF directory table");
    if (!inRange(bytes.byteLength, countStart, tableLength)) unsafe("TIFF directory table is truncated.");
    const directoryId = visited.size === 0 ? `IFD0@${item.offset}` : `IFD${visited.size}@${item.offset}`;
    const entries: ParsedEntry[] = [];
    const entryStart = item.offset + header.entryCountBytes;
    for (let index = 0; index < count; index += 1) {
      const entryOffset = entryStart + index * header.entryBytes;
      const tag = view.getUint16(entryOffset, header.littleEndian);
      const rawTypeCode = view.getUint16(entryOffset + 2, header.littleEndian);
      if (header.variant === "classic" && (rawTypeCode === 16 || rawTypeCode === 17 || rawTypeCode === 18)) invalid("Classic TIFF cannot contain BigTIFF-only field types.");
      const entryType = KNOWN_TYPES[rawTypeCode] ?? "UNKNOWN";
      const size = TYPE_SIZES[rawTypeCode] ?? 1;
      const entryCount = readCount(view, entryOffset + 4, header.variant === "classic" ? 4 : 8, header.littleEndian);
      const valueLength = checkedMultiply(entryCount, size, `TIFF tag 0x${tag.toString(16)} value length`);
      if (valueLength > limits.maxValueBytes) limited(`TIFF tag 0x${tag.toString(16)} exceeds maxValueBytes.`);
      const valueSlot = entryOffset + (header.variant === "classic" ? 8 : 12);
      let valueOffset = valueSlot;
      if (valueLength > header.inlineBytes) {
        valueOffset = readOffset(view, valueSlot, header.variant === "classic" ? 4 : 8, header.littleEndian);
        if (!inRange(bytes.byteLength, valueOffset, valueLength)) unsafe(`TIFF tag 0x${tag.toString(16)} value is outside the input.`);
      }
      if (!inRange(bytes.byteLength, valueOffset, valueLength)) unsafe(`TIFF tag 0x${tag.toString(16)} value is truncated.`);
      const rawBytes = bytes.slice(valueOffset, valueOffset + valueLength);
      const id = `${directoryId}:0x${tag.toString(16).padStart(4, "0")}:${index}`;
      entries.push({ id, tag, type: entryType, ...(entryType === "UNKNOWN" ? { typeCode: rawTypeCode } : {}), value: { kind: "raw", bytes: rawBytes, count: entryCount }, count: entryCount, source: { entryOffset, valueOffset, valueLength }, rawTypeCode, rawBytes, sourceOffset: entryOffset });
      totalEntries += 1;
      if (isDirectoryPointer(tag) && entryType !== "UNKNOWN") {
        if (!["LONG", "IFD", "LONG8", "IFD8"].includes(entryType)) unsafe(`TIFF directory pointer tag 0x${tag.toString(16)} uses a non-offset type.`);
        const parsedEntry = required(entries[entries.length - 1], "TIFF entry was not retained after decoding.");
        const values = decodeUnsignedNumbers(parsedEntry, header.littleEndian);
        if (values === null) unsafe(`TIFF directory pointer tag 0x${tag.toString(16)} is not an unsigned offset array.`);
        for (const offset of values) if (offset !== 0) queue.push({ offset, depth: item.depth + 1 });
      }
    }
    const nextOffset = readOffset(view, entryStart + tableBytes, header.variant === "classic" ? 4 : 8, header.littleEndian);
    if (nextOffset !== 0) queue.push({ offset: nextOffset, depth: item.depth });
    visited.set(item.offset, { id: directoryId, entries: [], nextDirectoryId: null, offset: item.offset, depth: item.depth, parsedEntries: entries, nextOffset });
  }
  const directories: ParsedDirectory[] = [...visited.values()];
  const idByOffset = new Map(directories.map((directory) => [directory.offset, directory.id]));
  const relationTargets = (entry: ParsedEntry): readonly string[] | null => {
    if (!isDirectoryPointer(entry.tag)) return null;
    const values = decodeUnsignedNumbers(entry, header.littleEndian);
    if (values === null) unsafe(`TIFF pointer tag 0x${entry.tag.toString(16)} cannot be decoded.`);
    const ids = values.filter((value) => value !== 0).map((value) => idByOffset.get(value));
    if (ids.some((id) => id === undefined)) unsafe(`TIFF pointer tag 0x${entry.tag.toString(16)} references a missing directory.`);
    return ids.filter((id): id is string => id !== undefined);
  };
  const updatedDirectories: TiffGraphDirectory[] = directories.map((directory) => {
    const entries: TiffGraphEntry[] = directory.parsedEntries.map((entry) => {
      const refs = relationTargets(entry);
      return refs === null || refs.length === 0 ? entry : { ...entry, value: { kind: "directory-references", directoryIds: refs } };
    });
    const nextDirectoryId = directory.nextOffset === 0 ? null : idByOffset.get(directory.nextOffset);
    if (directory.nextOffset !== 0 && nextDirectoryId === undefined) unsafe("TIFF next-IFD pointer references a missing directory.");
    return { id: directory.id, entries, nextDirectoryId: nextDirectoryId ?? null };
  });

  const ranges = directories.flatMap((directory) => {
    const tableLength = header.entryCountBytes + directory.parsedEntries.length * header.entryBytes + header.nextOffsetBytes;
    const valueRanges = directory.parsedEntries.flatMap((entry) => {
      const source = entry.source;
      return source !== undefined && source.valueLength > header.inlineBytes ? [{ offset: source.valueOffset, length: source.valueLength }] : [];
    });
    return [{ offset: directory.offset, length: tableLength }, ...valueRanges];
  });
  const preservedData: TiffPreservedData[] = [];
  const dataByRange = new Map<string, string>();
  const valuesFor = (directory: ParsedDirectory, tag: number): readonly ParsedEntry[] => directory.parsedEntries.filter((entry) => entry.tag === tag);
  const payloadKind = (tag: number): TiffPreservedData["kind"] => tag === 0x0201 ? "thumbnail" : "image-data";
  for (const directory of directories) {
    for (const offsetTag of [0x0111, 0x0120, 0x0144, 0x0201]) {
      const offsetEntries = valuesFor(directory, offsetTag);
      if (offsetEntries.length === 0) continue;
      const lengthTag = offsetTag === 0x0111 ? 0x0117 : offsetTag === 0x0120 ? 0x0121 : offsetTag === 0x0144 ? 0x0145 : 0x0202;
      const lengthEntry = valuesFor(directory, lengthTag)[0];
      if (lengthEntry === undefined) unsafe(`TIFF offset tag 0x${offsetTag.toString(16)} has no matching length tag.`);
      for (const offsetEntry of offsetEntries) {
        const offsets = decodeUnsignedNumbers(offsetEntry, header.littleEndian);
        const lengths = decodeUnsignedNumbers(required(lengthEntry, "TIFF payload length entry disappeared."), header.littleEndian);
        if (offsets === null || lengths === null || (lengths.length !== offsets.length && lengths.length !== 1)) unsafe(`TIFF payload offset/count arrays for 0x${offsetTag.toString(16)} are inconsistent.`);
        const dataIds: string[] = [];
        const payloadOffsets = required(offsets, "TIFF payload offset entry cannot be decoded.");
        const payloadLengths = required(lengths, "TIFF payload length entry cannot be decoded.");
        for (let index = 0; index < payloadOffsets.length; index += 1) {
          const offset = required(payloadOffsets[index], "TIFF payload offset array contains a missing value.");
          const length = required(payloadLengths[payloadLengths.length === 1 ? 0 : index], "TIFF payload length array contains a missing value.");
          if (!inRange(bytes.byteLength, offset, length)) unsafe(`TIFF payload range ${offset}+${length} is outside the input.`);
          const conflict = ranges.find((range) => offset < range.offset + range.length && range.offset < offset + length && !(range.offset === offset && range.length === length));
          if (conflict !== undefined) unsafe(`TIFF payload range ${offset}+${length} overlaps a structural range.`);
          const key = `${offset}:${length}`;
          let id = dataByRange.get(key);
          if (id === undefined) {
            id = `payload:${preservedData.length}`;
            dataByRange.set(key, id);
            preservedData.push({ id, sourceOffset: offset, data: bytes.slice(offset, offset + length), kind: payloadKind(offsetTag) });
          }
          dataIds.push(id);
        }
        const replacement: TiffGraphEntry = { ...offsetEntry, value: { kind: "data-references", dataIds } };
        const directoryIndex = updatedDirectories.findIndex((candidate) => candidate.id === directory.id);
        if (directoryIndex >= 0) {
          const updatedDirectory = required(updatedDirectories[directoryIndex], "TIFF directory disappeared during payload planning.");
          const entries = [...updatedDirectory.entries];
          const entryIndex = entries.findIndex((entry) => entry.id === offsetEntry.id);
          if (entryIndex >= 0) entries[entryIndex] = replacement;
          updatedDirectories[directoryIndex] = { ...updatedDirectory, entries };
        }
      }
    }
  }
  const root = required(directories[0], "TIFF graph has no root directory.");
  return { byteOrder: header.byteOrder, variant: header.variant, rootDirectoryId: root.id, directories: updatedDirectories, preservedData };
}

/** Parse a complete bounded TIFF/BigTIFF graph while retaining raw values. */
export function parseTiffGraph(input: Uint8Array, options: TiffSerializeOptions = {}): TiffGraph {
  const limits = resolveLimits(options.limits);
  return parseGraph(input, limits);
}

function utf8ByteLength(value: string): number {
  let length = 0;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    const width = code < 0x80 ? 1 : code < 0x800 ? 2 : code >= 0xd800 && code <= 0xdbff && index + 1 < value.length && value.charCodeAt(index + 1) >= 0xdc00 && value.charCodeAt(index + 1) <= 0xdfff ? 4 : 3;
    if (width === 4) index += 1;
    length = checkedAdd(length, width, "TIFF UTF-8 text length");
  }
  return length;
}

function textBytes(value: string, ascii: boolean, nulTerminated: boolean, maxValueBytes: number): Uint8Array {
  if (ascii && Array.from(value).some((character) => (character.codePointAt(0) ?? 0) > 0x7f)) invalid("TIFF ASCII values may contain only 7-bit characters; use raw bytes or UTF-8 explicitly.");
  if (value.includes("\0")) invalid("TIFF text values may not contain embedded NUL characters.");
  const expectedLength = checkedAdd(utf8ByteLength(value), nulTerminated ? 1 : 0, "TIFF text value length");
  if (expectedLength > maxValueBytes) limited(`TIFF text value exceeds maxValueBytes (${maxValueBytes}).`);
  const encoded = new TextEncoder().encode(value);
  if (checkedAdd(encoded.byteLength, nulTerminated ? 1 : 0, "TIFF encoded text value length") > maxValueBytes) limited(`TIFF text value exceeds maxValueBytes (${maxValueBytes}).`);
  if (!nulTerminated) return encoded;
  const result = new Uint8Array(encoded.length + 1);
  result.set(encoded);
  return result;
}

function integerValue(value: TiffInteger, signed: boolean, bits: number): bigint {
  let result: bigint;
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) invalid("TIFF integer values must be safe integers.");
    result = BigInt(value);
  } else {
    if (value.signed !== signed || !/^-?(?:0|[1-9][0-9]*)$/u.test(value.decimal)) invalid("TIFF 64-bit integer lexical form is invalid.");
    try { result = BigInt(value.decimal); } catch { invalid("TIFF 64-bit integer lexical form is invalid."); }
  }
  const min = signed ? -(1n << BigInt(bits - 1)) : 0n;
  const max = signed ? (1n << BigInt(bits - 1)) - 1n : (1n << BigInt(bits)) - 1n;
  if (result < min || result > max) invalid(`TIFF integer ${result.toString(10)} is outside the ${bits}-bit ${signed ? "signed" : "unsigned"} range.`);
  return result;
}

function rationalValue(value: RationalValue, signed: boolean): [bigint, bigint] {
  if (!Number.isSafeInteger(value.numerator) || !Number.isSafeInteger(value.denominator)) invalid("TIFF rational components must be safe integers.");
  return [integerValue(value.numerator, signed, 32), integerValue(value.denominator, signed, 32)];
}

function valueItems(value: TiffEntryValue, type: ExifDataType, typeCode: number, count: number | undefined, variant: TiffVariant, littleEndian: boolean, maxValueBytes: number): { readonly bytes: Uint8Array; readonly count: number } {
  const info = typeInfo(type, typeCode, variant);
  if (value.kind === "raw") {
    const inferred = count ?? value.count ?? (value.bytes.byteLength % info.size === 0 ? value.bytes.byteLength / info.size : -1);
    if (!Number.isSafeInteger(inferred) || inferred < 0 || checkedMultiply(inferred, info.size, "TIFF raw value length") !== value.bytes.byteLength) invalid(`Raw TIFF ${type} value length does not match its element size.`);
    if (value.bytes.byteLength > maxValueBytes) limited(`TIFF raw value exceeds maxValueBytes (${maxValueBytes}).`);
    return { bytes: cloneBytes(value.bytes), count: inferred };
  }
  if (value.kind === "text") {
    if (type !== "ASCII" && type !== "UTF-8") invalid(`${value.kind} values require ASCII or UTF-8 TIFF type.`);
    const bytes = textBytes(value.value, type === "ASCII", value.nulTerminated ?? true, maxValueBytes);
    return { bytes, count: bytes.byteLength };
  }
  if (value.kind === "numbers") {
    if (!["BYTE", "SHORT", "LONG", "IFD", "SBYTE", "SSHORT", "SLONG", "LONG8", "SLONG8", "IFD8"].includes(type)) invalid("Numeric TIFF values require an integer TIFF type.");
    const signed = type === "SBYTE" || type === "SSHORT" || type === "SLONG" || type === "SLONG8";
    const outputLength = checkedMultiply(value.values.length, info.size, "TIFF numeric value");
    if (outputLength > maxValueBytes) limited(`TIFF numeric value exceeds maxValueBytes (${maxValueBytes}).`);
    const output = new Uint8Array(outputLength);
    const view = new DataView(output.buffer);
    value.values.forEach((item, index) => {
      const numeric = integerValue(item, signed, info.size * 8);
      const offset = index * info.size;
      if (info.size === 1) {
        if (signed) view.setInt8(offset, Number(numeric)); else view.setUint8(offset, Number(numeric));
      } else if (info.size === 2) {
        if (signed) view.setInt16(offset, Number(numeric), littleEndian); else view.setUint16(offset, Number(numeric), littleEndian);
      } else if (info.size === 4) {
        if (signed) view.setInt32(offset, Number(numeric), littleEndian); else view.setUint32(offset, Number(numeric), littleEndian);
      } else if (signed) view.setBigInt64(offset, numeric, littleEndian); else view.setBigUint64(offset, numeric, littleEndian);
    });
    return { bytes: output, count: value.values.length };
  }
  if (value.kind === "rationals") {
    if (type !== "RATIONAL" && type !== "SRATIONAL") invalid("Rational values require RATIONAL or SRATIONAL TIFF type.");
    const outputLength = checkedMultiply(value.values.length, 8, "TIFF rational value");
    if (outputLength > maxValueBytes) limited(`TIFF rational value exceeds maxValueBytes (${maxValueBytes}).`);
    const output = new Uint8Array(outputLength);
    const view = new DataView(output.buffer);
    const signed = type === "SRATIONAL";
    value.values.forEach((item, index) => {
      const [numerator, denominator] = rationalValue(item, signed);
      if (signed) { view.setInt32(index * 8, Number(numerator), littleEndian); view.setInt32(index * 8 + 4, Number(denominator), littleEndian); }
      else { view.setUint32(index * 8, Number(numerator), littleEndian); view.setUint32(index * 8 + 4, Number(denominator), littleEndian); }
    });
    return { bytes: output, count: value.values.length };
  }
  if (value.kind === "floats") {
    if (type !== "FLOAT" && type !== "DOUBLE") invalid("Float values require FLOAT or DOUBLE TIFF type.");
    const outputLength = checkedMultiply(value.values.length, info.size, "TIFF floating value");
    if (outputLength > maxValueBytes) limited(`TIFF floating value exceeds maxValueBytes (${maxValueBytes}).`);
    const output = new Uint8Array(outputLength);
    const view = new DataView(output.buffer);
    value.values.forEach((item, index) => {
      if (!Number.isFinite(item)) invalid("TIFF floating values must be finite.");
      if (type === "FLOAT") view.setFloat32(index * 4, item, littleEndian); else view.setFloat64(index * 8, item, littleEndian);
    });
    return { bytes: output, count: value.values.length };
  }
  if (value.kind === "directory-references") return { bytes: new Uint8Array(0), count: value.directoryIds.length };
  return invalid("Unsupported TIFF entry value.");
}

function encodeValue(entry: TiffGraphEntry, graph: TiffGraph, directoryOffsets: ReadonlyMap<string, number>, dataOffsets: ReadonlyMap<string, number>, variant: TiffVariant, maxValueBytes: number): { readonly typeCode: number; readonly count: number; readonly bytes: Uint8Array } {
  const { code, size } = typeInfo(entry.type, entry.typeCode, variant);
  if (entry.value.kind === "directory-references") {
    if (!isDirectoryPointer(entry.tag)) invalid(`TIFF tag 0x${entry.tag.toString(16)} is not a directory pointer.`);
    const pointerType = code === 13 || code === 18 ? code : variant === "big-tiff" && code === 16 ? 16 : variant === "big-tiff" && code === 4 ? 4 : code;
    if ((variant === "classic" && pointerType !== 4 && pointerType !== 13) || (variant === "big-tiff" && ![4, 13, 16, 18].includes(pointerType))) invalid("TIFF directory pointer type is incompatible with the selected variant.");
    const directoryIds = entry.value.directoryIds;
    if (entry.count !== undefined && entry.count !== directoryIds.length) invalid(`TIFF tag 0x${entry.tag.toString(16)} declares count ${entry.count} but has ${directoryIds.length} directory references.`);
    const pointerBytes = pointerType === 4 || pointerType === 13 ? 4 : 8;
    const outputLength = checkedMultiply(directoryIds.length, pointerBytes, "TIFF directory pointer value");
    if (outputLength > maxValueBytes) limited(`TIFF directory pointer value exceeds maxValueBytes (${maxValueBytes}).`);
    const output = new Uint8Array(outputLength);
    const view = new DataView(output.buffer);
    directoryIds.forEach((id, index) => {
      const offset = directoryOffsets.get(id);
      if (offset === undefined) unsafe(`TIFF directory pointer references unknown directory ${id}.`);
      writeOffset(view, index * pointerBytes, offset, pointerBytes, graph.byteOrder === "little-endian");
    });
    return { typeCode: pointerType, count: directoryIds.length, bytes: output };
  }
  if (entry.value.kind === "data-references") {
    if (!isPayloadOffsetTag(entry.tag) || !["LONG", "IFD", "LONG8", "IFD8"].includes(entry.type)) invalid(`TIFF tag 0x${entry.tag.toString(16)} is not an unsigned payload-offset field.`);
    if (entry.count !== undefined && entry.count !== entry.value.dataIds.length) invalid(`TIFF tag 0x${entry.tag.toString(16)} declares count ${entry.count} but has ${entry.value.dataIds.length} payload references.`);
    const outputLength = checkedMultiply(entry.value.dataIds.length, size, "TIFF data pointer value");
    if (outputLength > maxValueBytes) limited(`TIFF data pointer value exceeds maxValueBytes (${maxValueBytes}).`);
    const output = new Uint8Array(outputLength);
    const view = new DataView(output.buffer);
    entry.value.dataIds.forEach((id, index) => {
      const offset = dataOffsets.get(id);
      if (offset === undefined) unsafe(`TIFF data pointer references unknown payload ${id}.`);
      writeOffset(view, index * size, offset, size, graph.byteOrder === "little-endian");
    });
    return { typeCode: code, count: entry.value.dataIds.length, bytes: output };
  }
  const encoded = valueItems(entry.value, entry.type, code, entry.count, variant, graph.byteOrder === "little-endian", maxValueBytes);
  if (entry.count !== undefined && entry.count !== encoded.count) invalid(`TIFF tag 0x${entry.tag.toString(16)} declares count ${entry.count} but encodes ${encoded.count} values.`);
  if (encoded.bytes.byteLength !== encoded.count * size) invalid(`TIFF tag 0x${entry.tag.toString(16)} has inconsistent encoded count.`);
  return { typeCode: code, count: encoded.count, bytes: encoded.bytes };
}

function validIdentifier(value: string, maximum: number): boolean {
  if (value.length === 0 || value.length > maximum) return false;
  for (const character of value) {
    if (!("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_.:@[]-".includes(character))) return false;
  }
  return true;
}

function validateGraph(graph: TiffGraph, limits: SecurityLimits): void {
  const rawGraph: unknown = graph;
  if (typeof rawGraph !== "object" || rawGraph === null) invalid("TIFF graph must be an object.");
  const candidate = rawGraph as { readonly byteOrder?: unknown; readonly variant?: unknown; readonly rootDirectoryId?: unknown; readonly directories?: unknown; readonly preservedData?: unknown };
  if (candidate.byteOrder !== "little-endian" && candidate.byteOrder !== "big-endian") invalid("TIFF graph byteOrder must be little-endian or big-endian.");
  if (candidate.variant !== "classic" && candidate.variant !== "big-tiff") invalid("TIFF graph variant must be classic or big-tiff.");
  if (typeof candidate.rootDirectoryId !== "string") invalid("TIFF graph rootDirectoryId must be text.");
  if (!Array.isArray(candidate.directories) || !Array.isArray(candidate.preservedData)) invalid("TIFF graph must contain directory and preserved-data arrays.");
  const rawDirectories: readonly unknown[] = candidate.directories;
  const rawPreservedData: readonly unknown[] = candidate.preservedData;
  if (rawDirectories.some((directory) => {
    if (typeof directory !== "object" || directory === null) return true;
    const candidateDirectory = directory as { readonly id?: unknown; readonly entries?: unknown };
    return typeof candidateDirectory.id !== "string" || !Array.isArray(candidateDirectory.entries);
  })) invalid("TIFF graph directories must have bounded IDs and entry arrays.");
  if (rawPreservedData.some((data) => {
    if (typeof data !== "object" || data === null) return true;
    const candidateData = data as { readonly id?: unknown; readonly data?: unknown; readonly kind?: unknown };
    return typeof candidateData.id !== "string" || !(candidateData.data instanceof Uint8Array) || !["thumbnail", "image-data", "opaque"].includes(candidateData.kind as string);
  })) invalid("TIFF preserved data must have an ID, byte payload, and kind.");
  const directories = rawDirectories as readonly TiffGraphDirectory[];
  const preservedData = rawPreservedData as readonly TiffPreservedData[];
  if (directories.length === 0 || directories.length > limits.maxSegments) limited("TIFF graph directory count is outside the configured limit.");
  const ids = new Set<string>();
  const directoryIds = new Set(directories.map((directory) => directory.id));
  if (!directoryIds.has(candidate.rootDirectoryId)) invalid("TIFF graph rootDirectoryId is not present.");
  let entries = 0;
  for (const directory of directories) {
    if (!validIdentifier(directory.id, 256) || ids.has(directory.id)) invalid("TIFF directory IDs must be unique bounded text.");
    ids.add(directory.id);
    if (directory.entries.length > limits.maxIfdEntries - entries) limited("TIFF graph entry count exceeds the configured limit.");
    entries += directory.entries.length;
    const nextDirectoryId: unknown = directory.nextDirectoryId;
    if (nextDirectoryId !== null && (typeof nextDirectoryId !== "string" || !directoryIds.has(nextDirectoryId))) unsafe(`TIFF directory ${directory.id} has an unknown nextDirectoryId.`);
    const tags = new Set<number>();
    for (const rawEntry of directory.entries as readonly unknown[]) {
      if (typeof rawEntry !== "object" || rawEntry === null) invalid("TIFF graph entries must have a known type and explicit value form.");
      const rawEntryRecord = rawEntry as { readonly type?: unknown; readonly value?: unknown };
      const rawValue = rawEntryRecord.value;
      if (typeof rawEntryRecord.type !== "string" || !Object.hasOwn(TYPE_CODES, rawEntryRecord.type) || typeof rawValue !== "object" || rawValue === null || typeof (rawValue as { readonly kind?: unknown }).kind !== "string") invalid("TIFF graph entries must have a known type and explicit value form.");
      const entry = rawEntry as TiffGraphEntry;
      if (!Number.isSafeInteger(entry.tag) || entry.tag < 0 || entry.tag > 0xffff) invalid("TIFF tags must be uint16 values.");
      if (!Number.isSafeInteger(entry.count ?? 0) || (entry.count ?? 0) < 0) invalid("TIFF counts must be non-negative safe integers.");
      if (tags.has(entry.tag) && entry.id === undefined) invalid("Duplicate TIFF tags require explicit entry IDs.");
      tags.add(entry.tag);
      if (entry.id !== undefined && (!validIdentifier(entry.id, 512) || ids.has(entry.id))) invalid("TIFF entry IDs must be unique bounded text.");
      if (entry.id !== undefined) ids.add(entry.id);
      if (entry.value.kind === "directory-references" && entry.value.directoryIds.some((id) => !directoryIds.has(id))) unsafe("TIFF graph contains an unknown directory reference.");
      if (entry.value.kind === "data-references" && entry.value.dataIds.some((id) => !preservedData.some((data) => data.id === id))) unsafe("TIFF graph contains an unknown payload reference.");
    }
  }
  const dataIds = new Set<string>();
  let dataBytes = 0;
  for (const data of preservedData) {
    if (!validIdentifier(data.id, 256) || dataIds.has(data.id)) invalid("TIFF payload IDs must be unique bounded text.");
    dataIds.add(data.id);
    if (!Number.isSafeInteger(data.sourceOffset) || data.sourceOffset < 0) invalid("TIFF payload sourceOffset must be a non-negative safe integer.");
    dataBytes = checkedAdd(dataBytes, data.data.byteLength, "TIFF preserved payload budget");
    if (dataBytes > limits.maxMetadataBytes) limited("TIFF preserved payloads exceed maxMetadataBytes.");
  }
}

function layoutGraph(graph: TiffGraph, options: TiffSerializeOptions): TiffLayout {
  const limits = resolveLimits(options.limits);
  const maxOutputBytes = options.maxOutputBytes ?? limits.maxAdapterOutputBytes;
  if (!Number.isSafeInteger(maxOutputBytes) || maxOutputBytes <= 0) invalid("maxOutputBytes must be a positive safe integer.");
  const maxValueBytes = Math.min(limits.maxValueBytes, maxOutputBytes);
  validateGraph(graph, limits);
  const headerLength = graph.variant === "classic" ? 8 : 16;
  const entryCountBytes = graph.variant === "classic" ? 2 : 8;
  const entryBytes = graph.variant === "classic" ? 12 : 20;
  const nextBytes = graph.variant === "classic" ? 4 : 8;
  const inlineBytes = graph.variant === "classic" ? 4 : 8;
  const dirAlignment = graph.variant === "classic" ? 2 : 8;
  const valueAlignment = graph.variant === "classic" ? 2 : 8;
  const rootDirectory = required(graph.directories.find((directory) => directory.id === graph.rootDirectoryId), "TIFF graph root directory is missing.");
  const ordered = [rootDirectory, ...graph.directories.filter((directory) => directory.id !== graph.rootDirectoryId)];
  const directoryOffsets = new Map<string, number>();
  let cursor = aligned(headerLength, dirAlignment);
  for (const directory of ordered) {
    cursor = aligned(cursor, dirAlignment);
    directoryOffsets.set(directory.id, cursor);
    const table = checkedAdd(entryCountBytes, checkedAdd(checkedMultiply(directory.entries.length, entryBytes, "TIFF directory entries"), nextBytes, "TIFF directory table"), "TIFF directory size");
    cursor = checkedAdd(cursor, table, "TIFF directory layout");
  }
  const valueOffsets = new Map<string, number>();
  const provisional: Array<{ directory: TiffGraphDirectory; entry: TiffGraphEntry; typeCode: number; count: number; bytes: Uint8Array }> = [];
  for (const directory of ordered) for (const entry of directory.entries) {
    const encoded = entry.value.kind === "data-references"
      ? (() => {
        if (!isPayloadOffsetTag(entry.tag) || !["LONG", "IFD", "LONG8", "IFD8"].includes(entry.type)) invalid(`TIFF tag 0x${entry.tag.toString(16)} is not an unsigned payload-offset field.`);
        if (entry.count !== undefined && entry.count !== entry.value.dataIds.length) invalid(`TIFF tag 0x${entry.tag.toString(16)} declares count ${entry.count} but has ${entry.value.dataIds.length} payload references.`);
        const info = typeInfo(entry.type, entry.typeCode, graph.variant);
        const length = checkedMultiply(info.size, entry.value.dataIds.length, "TIFF data pointer value");
        if (length > maxValueBytes) limited(`TIFF data pointer value exceeds maxValueBytes (${maxValueBytes}).`);
        return { typeCode: info.code, count: entry.value.dataIds.length, bytes: new Uint8Array(length) };
      })()
      : encodeValue(entry, graph, directoryOffsets, new Map(), graph.variant, maxValueBytes);
    provisional.push({ directory, entry, ...encoded });
  }
  for (const item of provisional) {
    if (item.bytes.byteLength > inlineBytes) {
      cursor = aligned(cursor, valueAlignment);
      const key = item.entry.id ?? `${item.directory.id}:${item.entry.tag}:${item.directory.entries.indexOf(item.entry)}`;
      valueOffsets.set(key, cursor);
      cursor = checkedAdd(cursor, item.bytes.byteLength, "TIFF out-of-line value layout");
    }
  }
  const dataOffsets = new Map<string, number>();
  for (const data of graph.preservedData) {
    cursor = aligned(cursor, valueAlignment);
    dataOffsets.set(data.id, cursor);
    cursor = checkedAdd(cursor, data.data.byteLength, "TIFF preserved payload layout");
  }
  const layouts: LayoutDirectory[] = [];
  for (const directory of ordered) {
    const entries: LayoutEntry[] = [];
    for (const entry of directory.entries) {
      const encoded = encodeValue(entry, graph, directoryOffsets, dataOffsets, graph.variant, maxValueBytes);
      const key = entry.id ?? `${directory.id}:${entry.tag}:${directory.entries.indexOf(entry)}`;
      entries.push({ entry, typeCode: encoded.typeCode, count: encoded.count, bytes: encoded.bytes, outOfLineOffset: encoded.bytes.byteLength > inlineBytes ? valueOffsets.get(key) ?? null : null });
    }
    layouts.push({ directory, offset: required(directoryOffsets.get(directory.id), `TIFF directory ${directory.id} has no assigned offset.`), entries });
  }
  if (cursor > maxOutputBytes) limited(`Serialized TIFF is ${cursor} bytes; maxOutputBytes is ${maxOutputBytes}.`);
  return { graph, directories: layouts, directoryOffsets, dataOffsets, outputLength: cursor };
}

/** Serialize a validated graph into a new classic TIFF or BigTIFF byte stream. */
export function serializeTiff(graph: TiffGraph, options: TiffSerializeOptions = {}): Uint8Array {
  const layout = layoutGraph(graph, options);
  const output = new Uint8Array(layout.outputLength);
  const view = new DataView(output.buffer);
  const little = graph.byteOrder === "little-endian";
  if (little) { output[0] = 0x49; output[1] = 0x49; } else { output[0] = 0x4d; output[1] = 0x4d; }
  view.setUint16(2, graph.variant === "classic" ? 42 : 43, little);
  if (graph.variant === "classic") writeOffset(view, 4, required(layout.directoryOffsets.get(graph.rootDirectoryId), "TIFF root directory offset was not assigned."), 4, little);
  else { view.setUint16(4, 8, little); view.setUint16(6, 0, little); writeOffset(view, 8, required(layout.directoryOffsets.get(graph.rootDirectoryId), "TIFF root directory offset was not assigned."), 8, little); }
  const entryCountBytes = graph.variant === "classic" ? 2 : 8;
  const entryBytes = graph.variant === "classic" ? 12 : 20;
  const nextBytes = graph.variant === "classic" ? 4 : 8;
  const inlineBytes = graph.variant === "classic" ? 4 : 8;
  const directoryOffsets = layout.directoryOffsets;
  for (const directory of layout.directories) {
    const directoryOffset = directory.offset;
    writeCount(view, directoryOffset, directory.entries.length, entryCountBytes, little);
    const entryStart = directoryOffset + entryCountBytes;
    directory.entries.forEach((entry, index) => {
      const offset = entryStart + index * entryBytes;
      view.setUint16(offset, entry.entry.tag, little);
      view.setUint16(offset + 2, entry.typeCode, little);
      writeCount(view, offset + 4, entry.count, graph.variant === "classic" ? 4 : 8, little);
      if (entry.bytes.byteLength <= inlineBytes) {
        output.fill(0, offset + (graph.variant === "classic" ? 8 : 12), offset + entryBytes - nextBytes);
        output.set(entry.bytes, offset + (graph.variant === "classic" ? 8 : 12));
      } else writeOffset(view, offset + (graph.variant === "classic" ? 8 : 12), required(entry.outOfLineOffset, "TIFF out-of-line value offset was not assigned."), graph.variant === "classic" ? 4 : 8, little);
    });
    const next = directory.directory.nextDirectoryId === null ? 0 : directoryOffsets.get(directory.directory.nextDirectoryId);
    if (next === undefined) unsafe(`TIFF directory ${directory.directory.id} has an unresolved next pointer.`);
    writeOffset(view, entryStart + directory.entries.length * entryBytes, next, nextBytes, little);
  }
  for (const directory of layout.directories) for (const entry of directory.entries) if (entry.outOfLineOffset !== null) output.set(entry.bytes, entry.outOfLineOffset);
  for (const data of graph.preservedData) output.set(data.data, required(layout.dataOffsets.get(data.id), "TIFF preserved payload offset was not assigned."));
  return output;
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false;
  for (let index = 0; index < left.byteLength; index += 1) if (left[index] !== right[index]) return false;
  return true;
}

/** Apply bounded entry edits transactionally and verify the rewritten graph. */
export function rewriteTiff(input: Uint8Array, options: TiffRewriteOptions): Uint8Array {
  const limits = resolveLimits(options.limits);
  const original = parseGraph(input, limits);
  if (!Array.isArray(options.edits) || options.edits.length > limits.maxAdapterItems) limited("TIFF edits exceed the configured operation limit.");
  const duplicatePolicy = options.duplicatePolicy ?? "replace-target";
  const directories = original.directories.map((directory) => ({ ...directory, entries: directory.entries.map((entry) => ({ ...entry, value: cloneValue(entry.value) })) })) as Array<TiffGraphDirectory & { entries: TiffGraphEntry[] }>;
  const directoryMap = new Map(directories.map((directory) => [directory.id, directory]));
  let inserted = 0;
  const edits: readonly TiffEntryEdit[] = options.edits;
  for (const edit of edits) {
    const directory = directoryMap.get(edit.directoryId);
    if (directory === undefined) unsafe(`TIFF edit references unknown directory ${edit.directoryId}.`);
    if (!Number.isSafeInteger(edit.tag) || edit.tag < 0 || edit.tag > 0xffff) invalid("TIFF edit tag must be a uint16.");
    const indexes = directory.entries.map((entry, index) => entry.tag === edit.tag ? index : -1).filter((index) => index >= 0);
    const chosen = edit.occurrence === undefined ? indexes[0] : indexes[edit.occurrence];
    if (edit.occurrence !== undefined && (!Number.isSafeInteger(edit.occurrence) || edit.occurrence < 0 || chosen === undefined)) invalid(`TIFF edit occurrence for tag 0x${edit.tag.toString(16)} is not present.`);
    if (edit.op === "delete") {
      const remove = new Set(indexes);
      if (edit.occurrence !== undefined) {
        remove.clear();
        remove.add(required(chosen, `TIFF edit occurrence for tag 0x${edit.tag.toString(16)} is not present.`));
      }
      directory.entries = directory.entries.filter((_entry, index) => !remove.has(index));
      continue;
    }
    const existingEntry = chosen === undefined ? undefined : required(directory.entries[chosen], "TIFF edit selected a missing entry.");
    const existingId = existingEntry?.id;
    const replacement: TiffGraphEntry = { ...(existingId === undefined ? { id: `${directory.id}:inserted:${inserted++}` } : { id: existingId }), tag: edit.tag, type: edit.type, ...(edit.typeCode === undefined ? {} : { typeCode: edit.typeCode }), value: cloneValue(edit.value), ...(edit.count === undefined ? {} : { count: edit.count }) };
    if (indexes.length > 1 && duplicatePolicy === "reject") invalid(`TIFF tag 0x${edit.tag.toString(16)} has duplicates under reject policy.`);
    if (chosen === undefined) directory.entries = [...directory.entries, replacement];
    else if (duplicatePolicy === "preserve") directory.entries = directory.entries.map((entry, index) => entry.tag === edit.tag ? { ...replacement, id: entry.id ?? `${directory.id}:entry:${index}` } : entry);
    else if (duplicatePolicy === "deduplicate-equivalent") {
      const replaced = directory.entries.map((entry, index) => index === chosen ? replacement : entry);
      directory.entries = replaced.filter((entry, index) => index === chosen || entry.tag !== edit.tag || !entriesEquivalent(entry, replacement));
    }
    else directory.entries = directory.entries.map((entry, index) => index === chosen ? replacement : entry);
  }
  if (options.ordering === "canonical") for (const directory of directories) directory.entries = [...directory.entries].sort((left, right) => left.tag - right.tag || (left.id ?? "").localeCompare(right.id ?? ""));
  const graph: TiffGraph = { ...original, directories, preservedData: original.preservedData.map((data) => ({ ...data, data: cloneBytes(data.data) })) };
  const output = serializeTiff(graph, options);
  if (options.verify !== false) {
    const reparsed = parseGraph(output, limits);
    const canonical = serializeTiff(reparsed, { limits, ...(options.maxOutputBytes === undefined ? {} : { maxOutputBytes: options.maxOutputBytes }) });
    if (!sameBytes(output, canonical)) verified("Rewritten TIFF was not stable after a complete bounded reparse and canonical serialization.");
  }
  return output;
}

export interface TiffEditEvidence {
  readonly inputSha256: string;
  readonly outputSha256: string;
  readonly inputBytes: number;
  readonly outputBytes: number;
}

/** Hash evidence for a completed TIFF transaction. */
export async function tiffEvidence(input: Uint8Array, output: Uint8Array): Promise<TiffEditEvidence> {
  return { inputSha256: await sha256Hex(input), outputSha256: await sha256Hex(output), inputBytes: input.byteLength, outputBytes: output.byteLength };
}

export interface TiffTransactionOperation {
  readonly operationId: string;
  readonly operation: EditOperationKind | null;
  readonly status: EditOperationStatus;
  readonly failure: EditFailure | null;
  readonly appliedCount: number;
  readonly matchedFieldIds: readonly string[];
  readonly matchedDirectoryIds: readonly string[];
}

export interface TiffEditTransaction {
  readonly output: Uint8Array | null;
  readonly operations: readonly TiffTransactionOperation[];
  readonly before: TiffGraph;
  readonly after: TiffGraph | null;
  readonly verified: boolean;
}

interface ResolvedTiffTarget {
  readonly directoryId: string;
  readonly tag: number;
  readonly fieldId: string;
  readonly entry: TiffGraphEntry | null;
}

function failureForTiff(code: EditFailure["code"], detail: string): EditFailure {
  return { code, detail };
}

function statusForTiffFailure(code: EditFailure["code"]): EditOperationStatus {
  if (code === "INVALID_VALUE") return "invalid-value";
  if (code === "UNSAFE_STRUCTURE") return "unsafe-structure";
  if (code === "POLICY_FAILURE") return "policy-failure";
  if (code === "VERIFICATION_FAILURE") return "verification-failure";
  return "unsupported";
}

function directoryByName(graph: TiffGraph, input: Uint8Array, limits: SecurityLimits): Map<string, string> {
  const parsed = graph.variant === "classic" ? parseExif(input, limits) : parseBigTiff(input, limits);
  const result = new Map<string, string>();
  for (const directory of parsed.exif?.ifds ?? []) {
    const graphDirectory = graph.directories.find((candidate) => candidate.id.endsWith(`@${directory.offset}`));
    if (graphDirectory !== undefined) {
      result.set(directory.name, graphDirectory.id);
      if (directory.id !== undefined) result.set(directory.id, graphDirectory.id);
    }
  }
  return result;
}

function fieldCandidates(graph: TiffGraph, input: Uint8Array, limits: SecurityLimits): readonly MetadataField[] {
  const parsed = graph.variant === "classic" ? parseExif(input, limits) : parseBigTiff(input, limits);
  return [...(parsed.exif?.fields ?? []), ...parsed.fields];
}

function entryFor(graph: TiffGraph, directoryId: string, tag: number): TiffGraphEntry | null {
  return graph.directories.find((directory) => directory.id === directoryId)?.entries.find((entry) => entry.tag === tag) ?? null;
}

function graphDirectoryId(graph: TiffGraph, candidate: string): string | undefined {
  const direct = graph.directories.find((directory) => directory.id === candidate);
  if (direct !== undefined) return direct.id;
  const separator = candidate.lastIndexOf("@");
  if (separator < 0) return undefined;
  const offset = candidate.slice(separator + 1);
  return graph.directories.find((directory) => directory.id.endsWith(`@${offset}`))?.id;
}

function resolveTiffTarget(target: EditTarget, graph: TiffGraph, input: Uint8Array, limits: SecurityLimits): ResolvedTiffTarget | null {
  const fieldId = target.kind === "field" ? target.fieldId : target.selector.kind === "field-id" ? target.selector.fieldId : null;
  if (fieldId === null) return null;
  const fields = fieldCandidates(graph, input, limits);
  const exact = fields.filter((field) => field.id === fieldId);
  if (exact.length > 1) {
    const directories = new Set(exact.map((field) => field.directoryId ?? field.source?.directoryId ?? ""));
    if (directories.size > 1) return null;
  }
  const normalized = fieldId.startsWith("normalized:") ? fields.filter((field) => field.id === fieldId || `normalized:${field.name}` === fieldId) : [];
  const candidate = exact[0] ?? normalized[0];
  if (candidate !== undefined) {
    const candidateDirectoryId = candidate.directoryId ?? candidate.source?.directoryId;
    const directoryId = candidateDirectoryId === undefined ? undefined : graphDirectoryId(graph, candidateDirectoryId);
    if (directoryId !== undefined) return { directoryId, tag: candidate.tag, fieldId: candidate.id, entry: entryFor(graph, directoryId, candidate.tag) };
  }
  const withoutPrefix = fieldId.startsWith("EXIF:") ? fieldId.slice(5) : fieldId;
  const match = /^(.*):0x([0-9a-fA-F]{1,4})(?::[0-9]+)?$/u.exec(withoutPrefix);
  if (match === null) return null;
  const directoryToken = match[1];
  const tagText = match[2];
  if (directoryToken === undefined || tagText === undefined) return null;
  const tag = Number.parseInt(tagText, 16);
  const names = directoryByName(graph, input, limits);
  const directoryId = names.get(directoryToken) ?? graph.directories.find((directory) => directory.id === directoryToken || directory.id.startsWith(`${directoryToken}@`))?.id;
  if (directoryId === undefined) return null;
  const existing = entryFor(graph, directoryId, tag);
  const matchingField = fields.find((field) => (field.directoryId ?? field.source?.directoryId) === directoryId && field.tag === tag);
  return { directoryId, tag, fieldId: matchingField?.id ?? `EXIF:${directoryToken}:0x${tag.toString(16).padStart(4, "0")}`, entry: existing };
}

function rationalLike(value: unknown): value is RationalValue {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Uint8Array) && "numerator" in value && "denominator" in value && typeof value.numerator === "number" && typeof value.denominator === "number";
}

function tiffValueFromEdit(value: unknown, type: ExifDataType | undefined): TiffEntryValue | null {
  if (typeof value === "string") {
    if (type !== undefined && type !== "ASCII" && type !== "UTF-8") return null;
    return { kind: "text", value };
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value) || (type !== undefined && !["BYTE", "SHORT", "LONG", "IFD", "SBYTE", "SSHORT", "SLONG", "LONG8", "SLONG8", "IFD8"].includes(type))) return null;
    return { kind: "numbers", values: [value] };
  }
  if (value instanceof Uint8Array) return { kind: "raw", bytes: value };
  if (rationalLike(value)) {
    if (type !== undefined && type !== "RATIONAL" && type !== "SRATIONAL") return null;
    return { kind: "rationals", values: [value] };
  }
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "number" && Number.isFinite(item))) {
      if (type !== undefined && !["BYTE", "SHORT", "LONG", "IFD", "SBYTE", "SSHORT", "SLONG", "LONG8", "SLONG8", "IFD8"].includes(type)) return null;
      return { kind: "numbers", values: value };
    }
    if (value.every((item) => rationalLike(item))) {
      if (type !== undefined && type !== "RATIONAL" && type !== "SRATIONAL") return null;
      return { kind: "rationals", values: value };
    }
  }
  return null;
}

function sourceCopy(target: ResolvedTiffTarget): { readonly type: ExifDataType; readonly typeCode?: number; readonly value: TiffEntryValue; readonly count?: number } | null {
  const entry = target.entry;
  if (entry === null) return null;
  return { type: entry.type, ...(entry.typeCode === undefined ? {} : { typeCode: entry.typeCode }), value: cloneValue(entry.value), ...(entry.count === undefined ? {} : { count: entry.count }) };
}

/** Execute the TIFF-safe subset of W01 as one immutable transaction. JPEG
 * marker operations are handled by the dedicated W03 writer; XMP, IPTC, and
 * broad selector operations outside this graph remain unsupported here. */
export function applyTiffEditTransaction(input: Uint8Array, operations: readonly EditOperation[], policy: EditPolicyEvidence, limits: SecurityLimits): TiffEditTransaction {
  const before = parseGraph(input, limits);
  const operationResults: TiffTransactionOperation[] = [];
  const edits: TiffEntryEdit[] = [];
  for (const operation of operations) {
    const targets: ResolvedTiffTarget[] = [];
    const addTarget = (target: EditTarget): boolean => {
      const resolved = resolveTiffTarget(target, before, input, limits);
      if (resolved === null) return false;
      targets.push(resolved);
      return true;
    };
    let failure: EditFailure | null = null;
    let appliedCount = 0;
    let matchedFieldIds: string[] = [];
    let matchedDirectoryIds: string[] = [];
    const unsupported = (detail: string): void => { failure = failureForTiff("UNSUPPORTED_OPERATION", detail); };
    switch (operation.op) {
      case "set":
        if (!addTarget(operation.target)) unsupported("This TIFF writer accepts only an EXIF field identity or field-id selector.");
        else {
          const target = required(targets[0], "TIFF set target was not resolved.");
          const value = tiffValueFromEdit(operation.value, target.entry?.type);
          if (value === null) failure = failureForTiff("INVALID_VALUE", "The requested value cannot be represented by the target TIFF type.");
          else { edits.push({ op: "set", directoryId: target.directoryId, tag: target.tag, type: target.entry?.type ?? (typeof operation.value === "string" ? "ASCII" : typeof operation.value === "number" ? "LONG" : "UNDEFINED"), ...(target.entry?.typeCode === undefined ? {} : { typeCode: target.entry.typeCode }), value }); appliedCount = 1; matchedFieldIds = [target.fieldId]; matchedDirectoryIds = [target.directoryId]; }
        }
        break;
      case "delete":
        if (!addTarget(operation.target)) unsupported("This TIFF writer accepts only an EXIF field identity or field-id selector.");
        else { const target = required(targets[0], "TIFF delete target was not resolved."); edits.push({ op: "delete", directoryId: target.directoryId, tag: target.tag }); appliedCount = target.entry === null ? 0 : 1; matchedFieldIds = target.entry === null ? [] : [target.fieldId]; matchedDirectoryIds = [target.directoryId]; }
        break;
      case "copy":
      case "alias":
      case "rename": {
        if (!addTarget(operation.source) || !addTarget(operation.destination)) unsupported("Copy, alias, and rename require EXIF field identities or field-id selectors.");
        else {
          const source = required(targets[0], "TIFF copy source was not resolved.");
          const destination = required(targets[1], "TIFF copy destination was not resolved.");
          const copied = sourceCopy(source);
          if (copied === null) failure = failureForTiff("INVALID_VALUE", "The copy source field is not present in the input.");
          else { edits.push({ op: "set", directoryId: destination.directoryId, tag: destination.tag, type: copied.type, ...(copied.typeCode === undefined ? {} : { typeCode: copied.typeCode }), value: copied.value, ...(copied.count === undefined ? {} : { count: copied.count }) }); if (operation.op === "rename") edits.push({ op: "delete", directoryId: source.directoryId, tag: source.tag }); appliedCount = 1; matchedFieldIds = [source.fieldId, destination.fieldId]; matchedDirectoryIds = [...new Set([source.directoryId, destination.directoryId])]; }
        }
        break;
      }
      case "remove-group":
      case "remove-policy":
      case "merge-sidecar":
        unsupported(`${operation.op} is not a TIFF entry operation; its container writer is a later roadmap ticket.`);
        break;
    }
    if (failure === null && (operation.op === "delete" || operation.op === "rename")) {
      const preserveKeys = new Set(policy.preserve.map((target) => target.kind === "field" ? `field:${target.fieldId}` : target.selector.kind === "field-id" ? `field:${target.selector.fieldId}` : ""));
      const operationTargets = operation.op === "delete" ? [operation.target] : [operation.source];
      if (operationTargets.some((target) => preserveKeys.has(target.kind === "field" ? `field:${target.fieldId}` : target.selector.kind === "field-id" ? `field:${target.selector.fieldId}` : ""))) failure = failureForTiff("POLICY_FAILURE", "The preserve rule wins over this removal operation.");
    }
    const status = failure === null ? "applied" : statusForTiffFailure(failure.code);
    operationResults.push({ operationId: operation.operationId, operation: operation.op, status, failure, appliedCount: failure === null ? appliedCount : 0, matchedFieldIds: failure === null ? matchedFieldIds : [], matchedDirectoryIds: failure === null ? matchedDirectoryIds : [] });
  }
  if (operationResults.some((result) => result.status !== "applied")) {
    const committed = operationResults.map((result) => result.status === "applied"
      ? { ...result, status: "verification-failure" as const, appliedCount: 0, matchedFieldIds: [], matchedDirectoryIds: [], failure: failureForTiff("VERIFICATION_FAILURE", "The TIFF transaction was not committed because another operation failed planning.") }
      : result);
    return { output: null, operations: committed, before, after: null, verified: false };
  }
  const output = rewriteTiff(input, { edits, limits, duplicatePolicy: policy.duplicates, ordering: policy.ordering.mode === "canonical" ? "canonical" : "preserve-source", verify: policy.verification !== "none" });
  const after = parseGraph(output, limits);
  return { output, operations: operationResults, before, after, verified: true };
}

export type { TiffByteOrder, TiffEntryEdit, TiffEntryValue, TiffGraph, TiffGraphDirectory, TiffGraphEntry, TiffInteger, TiffPreservedData, TiffRewriteOptions, TiffSerializeOptions, TiffVariant } from "./types.js";
