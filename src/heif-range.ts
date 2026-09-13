import { wantsGroup, type ResolvedSelection } from "./selection.js";
import type { BlobReader, MetadataMaterialization } from "./input.js";
import type { MetadataWarning, SecurityLimits } from "./types.js";

interface BoxHeader {
  readonly start: number;
  readonly end: number;
  readonly header: number;
  readonly type: string;
}

interface ItemInfo { readonly id: number; readonly type: string; readonly contentType?: string; }
interface ItemLocation {
  readonly id: number;
  readonly method: number;
  readonly dataReferenceIndex: number;
  readonly baseOffset: number;
  readonly extents: readonly { readonly index: number | null; readonly offset: number; readonly length: number }[];
}
interface ItemReference { readonly type: string; readonly from: number; readonly targets: readonly number[]; }
interface DataReference { readonly index: number; readonly resolvable: boolean; }
interface ItemPayload {
  readonly info: ItemInfo;
  readonly bytes: Uint8Array;
  readonly locationPatch: number;
}
interface MetaBuild {
  readonly bytes: Uint8Array;
  readonly patches: readonly { readonly offset: number; readonly payloadIndex: number }[];
}

function uint16(bytes: Uint8Array, offset: number): number { return ((bytes[offset] ?? 0) << 8) | (bytes[offset + 1] ?? 0); }
function uint32(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) * 0x1000000 + ((bytes[offset + 1] ?? 0) << 16) + ((bytes[offset + 2] ?? 0) << 8) + (bytes[offset + 3] ?? 0);
}
function uint64(bytes: Uint8Array, offset: number): number | null {
  const high = uint32(bytes, offset);
  const low = uint32(bytes, offset + 4);
  if (high > 0x1fffff) return null;
  const value = high * 0x100000000 + low;
  return Number.isSafeInteger(value) ? value : null;
}
function ascii(bytes: Uint8Array, offset: number): string { return String.fromCharCode(bytes[offset] ?? 0, bytes[offset + 1] ?? 0, bytes[offset + 2] ?? 0, bytes[offset + 3] ?? 0); }
function putUint32(bytes: Uint8Array, offset: number, value: number): void {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  view.setUint32(offset, value, false);
}
function putUint64(bytes: Uint8Array, offset: number, value: number): void {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  view.setUint32(offset, Math.floor(value / 0x100000000), false);
  view.setUint32(offset + 4, value >>> 0, false);
}
function concat(parts: readonly Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
}
function box(type: string, payload: Uint8Array): Uint8Array {
  if (payload.length > 0xffffffff - 8) throw new Error("box too large");
  const out = new Uint8Array(payload.length + 8);
  putUint32(out, 0, out.length);
  out.set(Array.from(type, (character) => character.charCodeAt(0)), 4);
  out.set(payload, 8);
  return out;
}
function warning(warnings: MetadataWarning[], limits: SecurityLimits, value: Omit<MetadataWarning, "severity"> & { severity?: MetadataWarning["severity"] }): void {
  if (warnings.length < limits.maxWarnings) warnings.push({ severity: "warning", ...value });
}

async function readHeader(reader: BlobReader, start: number, end: number): Promise<BoxHeader | null> {
  if (start < 0 || start > end - 8) return null;
  const first = await reader.read(start, start + 8);
  const size32 = uint32(first, 0);
  const type = ascii(first, 4);
  let header = 8;
  let size = size32;
  if (size32 === 1) {
    if (start > end - 16) return null;
    const extended = uint64(await reader.read(start + 8, start + 16), 0);
    if (extended === null) return null;
    size = extended;
    header = 16;
  } else if (size32 === 0) size = end - start;
  const boxEnd = start + size;
  return Number.isSafeInteger(boxEnd) && size >= header && boxEnd <= end ? { start, end: boxEnd, header, type } : null;
}

function readNull(bytes: Uint8Array, start: number, end: number): { readonly value: Uint8Array; readonly next: number } | null {
  for (let cursor = start; cursor < end; cursor += 1) if (bytes[cursor] === 0) return { value: bytes.subarray(start, cursor), next: cursor + 1 };
  return null;
}

function parseInfos(payload: Uint8Array, maxItems: number): ItemInfo[] | null {
  if (payload.length < 6) return null;
  const version = payload[0] ?? 0;
  if (version > 1) return null;
  const count = version === 0 ? uint16(payload, 4) : payload.length >= 8 ? uint32(payload, 4) : 0;
  if (count > maxItems) return null;
  let cursor = version === 0 ? 6 : 8;
  const infos: ItemInfo[] = [];
  for (let index = 0; index < count; index += 1) {
    if (cursor > payload.length - 8) return null;
    const size = uint32(payload, cursor);
    if (size < 8 || cursor + size > payload.length) return null;
    const data = cursor + 8;
    const infeVersion = payload[data] ?? 0;
    let id: number;
    let typeOffset: number;
    if (infeVersion === 2) { if (data + 12 > cursor + size) return null; id = uint16(payload, data + 4); typeOffset = data + 8; }
    else if (infeVersion === 3) { if (data + 14 > cursor + size) return null; id = uint32(payload, data + 4); typeOffset = data + 10; }
    else return null;
    const name = readNull(payload, typeOffset + 4, cursor + size);
    if (name === null) return null;
    const type = ascii(payload, typeOffset);
    if (type === "mime") {
      const content = readNull(payload, name.next, cursor + size);
      if (content === null) return null;
      const contentType = new TextDecoder("ascii").decode(content.value);
      infos.push({ id, type, contentType });
    } else infos.push({ id, type });
    cursor += size;
  }
  return cursor === payload.length ? infos : null;
}

function sized(bytes: Uint8Array, offset: number, size: number): { readonly value: number; readonly next: number } | null {
  if (size === 0) return { value: 0, next: offset };
  if (size === 4) return offset + 4 <= bytes.length ? { value: uint32(bytes, offset), next: offset + 4 } : null;
  if (size === 8) { const value = uint64(bytes, offset); return value === null ? null : { value, next: offset + 8 }; }
  return null;
}

function parseLocations(payload: Uint8Array, maxItems: number, maxExtents: number): ItemLocation[] | null {
  if (payload.length < 8) return null;
  const version = payload[0] ?? 0;
  if (version > 2) return null;
  const offsetSize = (payload[4] ?? 0) >> 4;
  const lengthSize = (payload[4] ?? 0) & 0x0f;
  const baseOffsetSize = (payload[5] ?? 0) & 0x0f;
  const indexSize = version >= 1 ? (payload[5] ?? 0) >> 4 : 0;
  if (![0, 4, 8].includes(offsetSize) || ![0, 4, 8].includes(lengthSize) || ![0, 4, 8].includes(baseOffsetSize) || ![0, 4, 8].includes(indexSize)) return null;
  const itemCountSize = version < 2 ? 2 : 4;
  let cursor = 6;
  if (cursor + itemCountSize > payload.length) return null;
  const count = itemCountSize === 2 ? uint16(payload, cursor) : uint32(payload, cursor);
  if (count > maxItems) return null;
  cursor += itemCountSize;
  const locations: ItemLocation[] = [];
  for (let index = 0; index < count; index += 1) {
    const idSize = version < 2 ? 2 : 4;
    if (cursor + idSize > payload.length) return null;
    const id = idSize === 2 ? uint16(payload, cursor) : uint32(payload, cursor); cursor += idSize;
    if (id === 0) return null;
    let method = 0;
    if (version >= 1) {
      if (cursor + 2 > payload.length) return null;
      const constructionMethod = uint16(payload, cursor);
      if ((constructionMethod & 0xfff0) !== 0) return null;
      method = constructionMethod & 0x0f;
      cursor += 2;
    }
    if (cursor + 2 > payload.length) return null;
    const dataReferenceIndex = uint16(payload, cursor); cursor += 2;
    const base = sized(payload, cursor, baseOffsetSize); if (base === null) return null; cursor = base.next;
    if (cursor + 2 > payload.length) return null;
    const extentCount = uint16(payload, cursor); cursor += 2;
    if (extentCount > maxExtents) return null;
    const extents: Array<{ index: number | null; offset: number; length: number }> = [];
    for (let extentIndex = 0; extentIndex < extentCount; extentIndex += 1) {
      let indexValue: number | null = null;
      if (indexSize > 0) { const parsedIndex = sized(payload, cursor, indexSize); if (parsedIndex === null || parsedIndex.value === 0) return null; cursor = parsedIndex.next; indexValue = parsedIndex.value; }
      const offset = sized(payload, cursor, offsetSize); if (offset === null) return null; cursor = offset.next;
      const length = sized(payload, cursor, lengthSize); if (length === null) return null; cursor = length.next;
      extents.push({ index: indexValue, offset: offset.value, length: length.value });
    }
    locations.push({ id, method, dataReferenceIndex, baseOffset: base.value, extents });
  }
  return cursor === payload.length ? locations : null;
}

function safeAdd(left: number, right: number): number | null {
  const value = left + right;
  return Number.isSafeInteger(value) && value >= left ? value : null;
}

function parseReferences(payload: Uint8Array, maxReferences: number): ItemReference[] | null {
  if (payload.length < 4) return null;
  const version = payload[0] ?? 0;
  if (version > 1) return null;
  const idSize = version === 0 ? 2 : 4;
  const references: ItemReference[] = [];
  let cursor = 4;
  while (cursor < payload.length) {
    if (references.length >= maxReferences || cursor > payload.length - 8) return null;
    const size = uint32(payload, cursor);
    const type = ascii(payload, cursor + 4);
    const header = 8;
    const end = cursor + (size === 0 ? payload.length - cursor : size);
    if (size !== 0 && size < header || !Number.isSafeInteger(end) || end > payload.length) return null;
    let at = cursor + header;
    if (at + idSize + 2 > end) return null;
    const from = idSize === 2 ? uint16(payload, at) : uint32(payload, at); at += idSize;
    if (from === 0) return null;
    const count = uint16(payload, at); at += 2;
    if (count > maxReferences || at + count * idSize !== end) return null;
    const targets: number[] = [];
    for (let index = 0; index < count; index += 1) {
      const target = idSize === 2 ? uint16(payload, at) : uint32(payload, at);
      if (target === 0) return null;
      targets.push(target);
      at += idSize;
    }
    references.push({ type, from, targets });
    cursor = end;
  }
  return references;
}

function parseDataReferences(payload: Uint8Array, maxReferences: number): Map<number, DataReference> | null {
  if (payload.length < 8 || (payload[0] ?? 0) !== 0) return null;
  const count = uint32(payload, 4);
  if (count > maxReferences) return null;
  const references = new Map<number, DataReference>();
  let cursor = 8;
  for (let index = 1; index <= count; index += 1) {
    if (cursor > payload.length - 8) return null;
    const size32 = uint32(payload, cursor);
    const type = ascii(payload, cursor + 4);
    const size = size32 === 0 ? payload.length - cursor : size32;
    const end = cursor + size;
    if (size < 12 || !Number.isSafeInteger(end) || end > payload.length) return null;
    const flags = ((payload[cursor + 9] ?? 0) << 16) | ((payload[cursor + 10] ?? 0) << 8) | (payload[cursor + 11] ?? 0);
    references.set(index, { index, resolvable: (type === "url " || type === "urn ") && (flags & 1) !== 0 });
    cursor = end;
  }
  return cursor === payload.length ? references : null;
}

function canonicalIloc(items: readonly ItemPayload[], offsets: readonly number[], idsVersion: 1 | 2): { readonly bytes: Uint8Array; readonly patchOffsets: readonly number[] } {
  const idSize = idsVersion === 1 ? 2 : 4;
  const payloadLength = 6 + (idsVersion === 1 ? 2 : 4) + items.length * (idSize + 2 + 2 + 2 + 8 + 8);
  const payload = new Uint8Array(payloadLength);
  payload[0] = idsVersion;
  payload[4] = 0x88;
  payload[5] = 0;
  let cursor = 6;
  if (idsVersion === 1) { payload[cursor] = (items.length >>> 8) & 0xff; payload[cursor + 1] = items.length & 0xff; cursor += 2; }
  else { putUint32(payload, cursor, items.length); cursor += 4; }
  const patchOffsets: number[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (item === undefined) continue;
    if (idsVersion === 1) { payload[cursor] = (item.info.id >>> 8) & 0xff; payload[cursor + 1] = item.info.id & 0xff; cursor += 2; }
    else { putUint32(payload, cursor, item.info.id); cursor += 4; }
    cursor += 2; // construction method zero
    cursor += 2; // data reference index zero
    payload[cursor] = 0; payload[cursor + 1] = 1; cursor += 2;
    patchOffsets.push(cursor);
    putUint64(payload, cursor, offsets[index] ?? 0); cursor += 8;
    putUint64(payload, cursor, item.bytes.length); cursor += 8;
  }
  return { bytes: box("iloc", payload), patchOffsets: patchOffsets.map((offset) => offset + 8) };
}

async function resolveItem(reader: BlobReader, locations: ReadonlyMap<number, ItemLocation>, references: readonly ItemReference[], dataReferences: ReadonlyMap<number, DataReference>, itemId: number, location: ItemLocation, idatStart: number | null, idatEnd: number | null, limits: SecurityLimits, stack: ReadonlySet<number> = new Set<number>()): Promise<Uint8Array | null> {
  if (stack.has(itemId) || location.extents.length === 0 || location.method < 0 || location.method > 2) return null;
  if (location.method === 1 && location.dataReferenceIndex !== 0) return null;
  if (location.method === 0 && location.dataReferenceIndex !== 0 && dataReferences.get(location.dataReferenceIndex)?.resolvable !== true) return null;
  if (location.method === 2 && location.dataReferenceIndex !== 0) return null;
  const nextStack = new Set(stack); nextStack.add(itemId);
  const parts: Uint8Array[] = [];
  let total = 0;
  for (const extent of location.extents) {
    if (location.extents.length > 1 && extent.length === 0) return null;
    let source: Uint8Array | null = null;
    let start = 0;
    let sourceEnd = 0;
    if (location.method === 2) {
      const referenceTargets = references.filter((candidate) => candidate.type === "iloc" && candidate.from === itemId).flatMap(({ targets }) => targets);
      const targetId = referenceTargets[(extent.index ?? 1) - 1];
      const targetLocation = targetId === undefined ? undefined : locations.get(targetId);
      if (targetId === undefined || targetLocation === undefined) return null;
      source = await resolveItem(reader, locations, references, dataReferences, targetId, targetLocation, idatStart, idatEnd, limits, nextStack);
      if (source === null) return null;
      start = safeAdd(location.baseOffset, extent.offset) ?? -1;
      sourceEnd = source.length;
    } else {
      const sourceStart = location.method === 1 ? idatStart : 0;
      const directEnd = location.method === 1 ? idatEnd : reader.size;
      if (sourceStart === null || directEnd === null) return null;
      const relative = safeAdd(location.baseOffset, extent.offset);
      start = relative === null ? -1 : safeAdd(sourceStart, relative) ?? -1;
      sourceEnd = directEnd;
      if (start < sourceStart) return null;
    }
    if (source === null) {
      const sourceStart = location.method === 1 ? idatStart : 0;
      if (sourceStart === null || start > sourceEnd) return null;
    } else if (start < 0 || start > sourceEnd) return null;
    const length = extent.length === 0 ? sourceEnd - start : extent.length;
    const end = safeAdd(start, length);
    const nextTotal = safeAdd(total, length);
    if (end === null || end < start || end > sourceEnd || length > limits.maxSegmentBytes || nextTotal === null || nextTotal > limits.maxMetadataBytes) return null;
    parts.push(source === null ? await reader.read(start, end) : source.subarray(start, end));
    total = nextTotal;
  }
  return concat(parts);
}

async function buildMeta(reader: BlobReader, header: BoxHeader, selection: ResolvedSelection, limits: SecurityLimits, payloads: ItemPayload[], warnings: MetadataWarning[]): Promise<MetaBuild | null> {
  if (header.end - header.start > limits.maxMetadataBytes) return null;
  const full = await reader.read(header.start, header.end);
  if (header.header + 4 > full.length) return null;
  const children: Uint8Array[] = [];
  let ilocPayload: Uint8Array | null = null;
  let ilocSeen = false;
  let idatStart: number | null = null;
  let idatEnd: number | null = null;
  let cursor = header.header + 4;
  let childCount = 0;
  while (cursor < full.length) {
    childCount += 1;
    if (childCount > limits.maxSegments) return null;
    if (cursor > full.length - 8) return null;
    const size = uint32(full, cursor);
    const type = ascii(full, cursor + 4);
    if (size < 8 || cursor + size > full.length) return null;
    if (type === "idat") {
      idatStart = header.start + cursor + 8;
      idatEnd = header.start + cursor + size;
    } else if (type === "iloc") {
      if (ilocSeen) return null;
      ilocSeen = true;
      ilocPayload = full.subarray(cursor + 8, cursor + size);
    } else children.push(full.subarray(cursor, cursor + size).slice());
    cursor += size;
  }
  if (cursor !== full.length) return null;
  let infos: ItemInfo[] = [];
  for (const child of children) {
    if (ascii(child, 4) !== "iinf") continue;
    const parsed = parseInfos(child.subarray(8), limits.maxIfdEntries);
    if (parsed === null) return null;
    infos = parsed;
    break;
  }
  const locations = ilocPayload === null ? [] : parseLocations(ilocPayload, limits.maxIfdEntries, limits.maxSegments);
  if (locations === null) return null;
  const byId = new Map(locations.map((location) => [location.id, location]));
  const references: ItemReference[] = [];
  const dataReferences = new Map<number, DataReference>();
  for (const child of children) {
    const type = ascii(child, 4);
    if (type === "iref") {
      const parsed = parseReferences(child.subarray(8), limits.maxSegments);
      if (parsed === null) return null;
      references.push(...parsed);
    } else if (type === "dinf") {
      let at = 8;
      while (at < child.length) {
        if (at > child.length - 8) return null;
        const size = uint32(child, at);
        const end = at + (size === 0 ? child.length - at : size);
        if (size < 8 || !Number.isSafeInteger(end) || end > child.length) return null;
        if (ascii(child, at + 4) === "dref") {
          const parsed = parseDataReferences(child.subarray(at + 8, end), limits.maxSegments);
          if (parsed === null) return null;
          for (const [index, reference] of parsed) dataReferences.set(index, reference);
        }
        at = end;
      }
    }
  }
  const includeExif = wantsGroup(selection, "EXIF");
  const includeXmp = wantsGroup(selection, "XMP");
  const selectedInfos = infos.filter((info) => {
    const xmp = info.type === "mime" && info.contentType?.toLowerCase().includes("rdf+xml") === true;
    return (info.type === "Exif" && includeExif) || (xmp && includeXmp);
  });
  const selectedPayloads: ItemPayload[] = [];
  for (const info of selectedInfos) {
    const location = byId.get(info.id);
    if (location === undefined) { warning(warnings, limits, { code: "UNSAFE_OFFSET", message: `HEIF metadata item ${info.id} has no item-location entry.`, offset: header.start }); continue; }
    const data = await resolveItem(reader, byId, references, dataReferences, info.id, location, idatStart, idatEnd, limits);
    if (data === null) { warning(warnings, limits, { code: "UNSAFE_OFFSET", message: `HEIF metadata item ${info.id} has an unsafe or unsupported extent.`, offset: header.start }); return null; }
    selectedPayloads.push({ info, bytes: data, locationPatch: 0 });
  }
  const version = infos.some((info) => info.id > 0xffff) ? 2 as const : 1 as const;
  const iloc = canonicalIloc(selectedPayloads, selectedPayloads.map(() => 0), version);
  const metaPayload = concat([full.subarray(header.header, header.header + 4), ...children, iloc.bytes]);
  const metaBytes = box("meta", metaPayload);
  const basePatch = metaBytes.length - iloc.bytes.length;
  const patches = iloc.patchOffsets.map((offset, index) => ({ offset: basePatch + offset, payloadIndex: payloads.length + index }));
  for (const item of selectedPayloads) payloads.push({ ...item, locationPatch: 0 });
  return { bytes: metaBytes, patches };
}

/** Materialize only HEIF/AVIF boxes and metadata item extents for metadata scope. */
export async function materializeHeifMetadata(reader: BlobReader, limits: SecurityLimits, selection: ResolvedSelection): Promise<MetadataMaterialization | null> {
  const warnings: MetadataWarning[] = [];
  const topBoxes: Uint8Array[] = [];
  const metas: MetaBuild[] = [];
  const payloads: ItemPayload[] = [];
  let cursor = 0;
  let boxCount = 0;
  while (cursor < reader.size) {
    boxCount += 1;
    if (boxCount > limits.maxSegments) {
      warning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "HEIF box count exceeds the configured limit.", offset: cursor });
      return null;
    }
    const header = await readHeader(reader, cursor, reader.size);
    if (header === null) return null;
    if (header.type === "ftyp" || ((header.type === "Exif" || header.type === "exif") && wantsGroup(selection, "EXIF")) || ((header.type === "xml " || header.type === "XMP ") && wantsGroup(selection, "XMP"))) {
      if (header.end - header.start > limits.maxSegmentBytes) return null;
      topBoxes.push(await reader.read(header.start, header.end));
    } else if (header.type === "moov" || header.type === "moof") {
      // Sequence tables contain source-relative sample offsets.  Compacting only
      // metadata boxes would invalidate those offsets, so let the input layer
      // perform its bounded full-read fallback for sequence-aware results.
      return null;
    } else if (header.type === "meta") {
      const built = await buildMeta(reader, header, selection, limits, payloads, warnings);
      if (built === null) return null;
      metas.push(built);
    }
    cursor = header.end;
  }
  if (topBoxes.length === 0 || !topBoxes.some((bytes) => ascii(bytes, 4) === "ftyp")) return null;
  const metadataBoxes = [...topBoxes, ...metas.map(({ bytes }) => bytes)];
  const payloadTotal = payloads.reduce((sum, item) => sum + item.bytes.length, 0);
  const mdat = payloadTotal > 0 ? box("mdat", concat(payloads.map(({ bytes }) => bytes))) : null;
  const output = concat(mdat === null ? metadataBoxes : [...metadataBoxes, mdat]);
  if (output.length > limits.maxMetadataBytes) return null;
  const mdatPayloadStart = mdat === null ? 0 : output.length - payloadTotal;
  let metaOffset = topBoxes.reduce((sum, bytes) => sum + bytes.length, 0);
  let payloadOffset = 0;
  for (const meta of metas) {
    for (const patch of meta.patches) {
      const absolute = mdatPayloadStart + payloadOffset;
      putUint64(output, metaOffset + patch.offset, absolute);
      payloadOffset += payloads[patch.payloadIndex]?.bytes.length ?? 0;
    }
    metaOffset += meta.bytes.length;
  }
  return { bytes: output, partial: true, bytesRead: reader.bytesRead(), inputBytes: reader.size, warnings, telemetry: reader.telemetry() };
}
