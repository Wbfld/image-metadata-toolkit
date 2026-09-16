import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseMetadata, toJsonSafeResult } from "../src/index.js";
import { parseHeifDimensions } from "../src/parsers/heif.js";
import { materializeHeifMetadata } from "../src/heif-range.js";
import { resolveSelection } from "../src/selection.js";
import { resolveLimits } from "../src/security/limits.js";
import type { BlobReader } from "../src/input.js";

function box(type: string, payload: Uint8Array): Uint8Array {
  const result = new Uint8Array(8 + payload.length);
  new DataView(result.buffer).setUint32(0, result.length, false);
  result.set(new TextEncoder().encode(type), 4);
  result.set(payload, 8);
  return result;
}

function concatenate(parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}

function extendedBox(type: string, payload: Uint8Array): Uint8Array {
  const output = new Uint8Array(16 + payload.length);
  new DataView(output.buffer).setUint32(0, 1, false);
  output.set(new TextEncoder().encode(type), 4);
  new DataView(output.buffer).setUint32(12, output.length, false);
  output.set(payload, 16);
  return output;
}

function zeroSizedBox(type: string, payload: Uint8Array): Uint8Array {
  const output = new Uint8Array(8 + payload.length);
  output.set(new TextEncoder().encode(type), 4);
  output.set(payload, 8);
  return output;
}

function readerFor(bytes: Uint8Array): BlobReader {
  let bytesRead = 0;
  return {
    size: bytes.length,
    read: (start, end) => { bytesRead += end - start; return Promise.resolve(bytes.slice(start, end)); },
    bytesRead: () => bytesRead,
    telemetry: () => ({ readRequests: 0, bytesRead, cacheHits: 0, coalescedReads: 0, cacheBytes: 0 }),
  };
}

function fullBox(type: string, payload: Uint8Array, version = 0, flags = 0): Uint8Array {
  const full = new Uint8Array(4 + payload.length);
  full[0] = version;
  full[1] = (flags >>> 16) & 0xff;
  full[2] = (flags >>> 8) & 0xff;
  full[3] = flags & 0xff;
  full.set(payload, 4);
  return box(type, full);
}

function infe(id: number, type: string, contentType?: string, flags = 0): Uint8Array {
  const name = new TextEncoder().encode(`${type}-${id}\0`);
  const itemType = new TextEncoder().encode(type);
  const content = contentType === undefined ? new Uint8Array() : new TextEncoder().encode(`${contentType}\0`);
  const payload = new Uint8Array(4 + 2 + 2 + 4 + name.length + content.length);
  payload[0] = 2;
  payload[1] = (flags >>> 16) & 0xff;
  payload[2] = (flags >>> 8) & 0xff;
  payload[3] = flags & 0xff;
  new DataView(payload.buffer).setUint16(4, id, false);
  payload.set(itemType, 8);
  payload.set(name, 12);
  payload.set(content, 12 + name.length);
  return box("infe", payload);
}

function iinf(infos: readonly Uint8Array[]): Uint8Array {
  const payload = new Uint8Array(6 + infos.reduce((total, item) => total + item.length, 0));
  new DataView(payload.buffer).setUint16(4, infos.length, false);
  let cursor = 6;
  for (const info of infos) { payload.set(info, cursor); cursor += info.length; }
  return box("iinf", payload);
}

function iinfVersionOne(info: Uint8Array): Uint8Array {
  const payload = new Uint8Array(8 + info.length);
  payload[0] = 1;
  new DataView(payload.buffer).setUint32(4, 1, false);
  payload.set(info, 8);
  return box("iinf", payload);
}

function infeVersionThree(id: number, name: string, contentType: string, contentEncoding: string): Uint8Array {
  const nameBytes = new TextEncoder().encode(`${name}\0`);
  const contentTypeBytes = new TextEncoder().encode(`${contentType}\0`);
  const encodingBytes = new TextEncoder().encode(`${contentEncoding}\0`);
  const payload = new Uint8Array(4 + 4 + 2 + 4 + nameBytes.length + contentTypeBytes.length + encodingBytes.length);
  payload[0] = 3;
  new DataView(payload.buffer).setUint32(4, id, false);
  payload.set(new TextEncoder().encode("mime"), 10);
  payload.set(nameBytes, 14);
  payload.set(contentTypeBytes, 14 + nameBytes.length);
  payload.set(encodingBytes, 14 + nameBytes.length + contentTypeBytes.length);
  return box("infe", payload);
}

function ilocVersionTwo(id: number, offset: number, length: number): Uint8Array {
  const payload = new Uint8Array(10 + 4 + 2 + 2 + 2 + 4 + 4);
  payload[0] = 2;
  payload[4] = 0x44;
  new DataView(payload.buffer).setUint32(6, 1, false);
  let cursor = 10;
  new DataView(payload.buffer).setUint32(cursor, id, false); cursor += 4;
  new DataView(payload.buffer).setUint16(cursor, 0, false); cursor += 2;
  new DataView(payload.buffer).setUint16(cursor, 0, false); cursor += 2;
  new DataView(payload.buffer).setUint16(cursor, 1, false); cursor += 2;
  new DataView(payload.buffer).setUint32(cursor, offset, false); cursor += 4;
  new DataView(payload.buffer).setUint32(cursor, length, false);
  return box("iloc", payload);
}

function buildVersionTwoRangeFixture(): Uint8Array {
  const itemId = 70000;
  const xmp = new TextEncoder().encode("<x:xmpmeta/>\n");
  const ftyp = box("ftyp", new TextEncoder().encode("heic\0\0\0\0"));
  const info = iinfVersionOne(infeVersionThree(itemId, "encoded-xmp", "application/rdf+xml", "identity"));
  const provisionalMeta = box("meta", concatenate([new Uint8Array(4), info, ilocVersionTwo(itemId, 0, xmp.length)]));
  const payloadOffset = ftyp.length + provisionalMeta.length + 8;
  const meta = box("meta", concatenate([new Uint8Array(4), info, ilocVersionTwo(itemId, payloadOffset, xmp.length)]));
  return concatenate([ftyp, meta, box("mdat", xmp)]);
}

function pitm(id: number): Uint8Array {
  const payload = new Uint8Array(6);
  new DataView(payload.buffer).setUint16(4, id, false);
  return box("pitm", payload);
}

function reference(type: string, from: number, targets: readonly number[]): Uint8Array {
  const payload = new Uint8Array(4 + 2 + 2 + targets.length * 2);
  new DataView(payload.buffer).setUint16(4, from, false);
  new DataView(payload.buffer).setUint16(6, targets.length, false);
  targets.forEach((target, index) => new DataView(payload.buffer).setUint16(8 + index * 2, target, false));
  return box(type, payload.subarray(4));
}

function iref(references: readonly Uint8Array[]): Uint8Array {
  return box("iref", new Uint8Array([0, 0, 0, 0, ...references.flatMap((value) => [...value])]));
}

function ispe(width: number, height: number): Uint8Array {
  const payload = new Uint8Array(12);
  new DataView(payload.buffer).setUint32(4, width, false);
  new DataView(payload.buffer).setUint32(8, height, false);
  return box("ispe", payload);
}

function auxc(type: string): Uint8Array {
  return fullBox("auxC", new TextEncoder().encode(`${type}\0`));
}

function ipma(entries: readonly [number, readonly number[]][]): Uint8Array {
  const payload = new Uint8Array(8 + entries.reduce((total, [, indices]) => total + 3 + indices.length, 0));
  new DataView(payload.buffer).setUint32(4, entries.length, false);
  let cursor = 8;
  for (const [itemId, indices] of entries) {
    new DataView(payload.buffer).setUint16(cursor, itemId, false);
    payload[cursor + 2] = indices.length;
    indices.forEach((index, offset) => { payload[cursor + 3 + offset] = index; });
    cursor += 3 + indices.length;
  }
  return box("ipma", payload);
}

function iprp(): Uint8Array {
  return box("iprp", new Uint8Array([
    ...box("ipco", new Uint8Array([...ispe(4, 2), ...auxc("urn:mpeg:mpegB:cicp:systems:auxiliary:alpha")])),
    ...ipma([[1, [0x81]], [6, [1]], [7, [2]]]),
  ]));
}

interface LocationInput { readonly id: number; readonly method: number; readonly dataReferenceIndex: number; readonly extents: readonly { readonly index: number; readonly offset: number; readonly length: number }[]; }

function iloc(locations: readonly LocationInput[]): Uint8Array {
  const payload = new Uint8Array(8 + locations.reduce((total, location) => total + 2 + 2 + 2 + 2 + location.extents.length * (4 + 4 + 4), 0));
  payload[0] = 1;
  payload[4] = 0x44;
  payload[5] = 0x40;
  new DataView(payload.buffer).setUint16(6, locations.length, false);
  let cursor = 8;
  for (const location of locations) {
    new DataView(payload.buffer).setUint16(cursor, location.id, false); cursor += 2;
    new DataView(payload.buffer).setUint16(cursor, location.method, false); cursor += 2;
    new DataView(payload.buffer).setUint16(cursor, location.dataReferenceIndex, false); cursor += 2;
    new DataView(payload.buffer).setUint16(cursor, location.extents.length, false); cursor += 2;
    for (const extent of location.extents) {
      new DataView(payload.buffer).setUint32(cursor, extent.index, false); cursor += 4;
      new DataView(payload.buffer).setUint32(cursor, extent.offset, false); cursor += 4;
      new DataView(payload.buffer).setUint32(cursor, extent.length, false); cursor += 4;
    }
  }
  return box("iloc", payload);
}

function dref(): Uint8Array {
  const selfContained = fullBox("url ", new Uint8Array(), 0, 1);
  const external = fullBox("url ", new TextEncoder().encode("https://example.invalid/image"));
  const payload = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 2, ...selfContained, ...external]);
  return box("dinf", box("dref", payload));
}

function buildFixture(format: "heic" | "avif" = "heic"): Uint8Array {
  const xmp = new TextEncoder().encode("<x:xmpmeta><rdf:RDF/></x:xmpmeta>");
  const exif = new TextEncoder().encode("EXIF-ITEM");
  const tileA = Uint8Array.of(0x41, 0x42, 0x43, 0x44);
  const tileB = Uint8Array.of(0x51, 0x52, 0x53);
  const thumb = Uint8Array.of(0x61, 0x62);
  const alpha = Uint8Array.of(0x71, 0x72);
  const gridDescriptor = Uint8Array.of(0, 0, 0, 1, 0, 4, 0, 2);
  const overlayDescriptor = Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 4, 0xff, 0xff, 0, 2, 0, 3, 0xff, 0xfc);
  const mdatPayload = new Uint8Array([...tileA.subarray(0, 2), ...xmp.subarray(0, 12), ...tileB, ...exif, ...xmp.subarray(12), ...tileA.subarray(2), ...thumb, ...alpha, ...overlayDescriptor]);
  const ftyp = box("ftyp", new TextEncoder().encode(`${format}\0\0\0\0`));
  const infos = iinf([
    infe(1, "grid"), infe(2, "av01"), infe(3, "av01"), infe(4, "mime", "application/rdf+xml"),
    infe(5, "Exif"), infe(6, "av01"), infe(7, "av01"), infe(8, "mime", "application/octet-stream", 1), infe(9, "iovl"),
  ]);
  const relationships = iref([
    reference("dimg", 1, [2, 3]), reference("thmb", 6, [1]), reference("auxl", 7, [1]),
    reference("cdsc", 4, [1]), reference("iloc", 8, [4]), reference("dimg", 9, [2, 3]),
  ]);
  const idat = box("idat", gridDescriptor);
  const metaWithoutIloc = [new Uint8Array(4), pitm(1), infos, relationships, dref(), idat, iprp()];
  const provisionalMeta = box("meta", new Uint8Array([...metaWithoutIloc.flatMap((item) => [...item]), ...iloc([
    { id: 1, method: 1, dataReferenceIndex: 0, extents: [{ index: 1, offset: 0, length: gridDescriptor.length }] },
    { id: 2, method: 0, dataReferenceIndex: 0, extents: [{ index: 1, offset: 0, length: 2 }, { index: 1, offset: 0, length: 2 }] },
    { id: 3, method: 0, dataReferenceIndex: 0, extents: [{ index: 1, offset: 0, length: tileB.length }] },
    { id: 4, method: 0, dataReferenceIndex: 0, extents: [{ index: 1, offset: 0, length: 12 }, { index: 1, offset: 0, length: xmp.length - 12 }] },
    { id: 5, method: 0, dataReferenceIndex: 1, extents: [{ index: 1, offset: 0, length: exif.length }] },
    { id: 6, method: 0, dataReferenceIndex: 0, extents: [{ index: 1, offset: 0, length: thumb.length }] },
    { id: 7, method: 0, dataReferenceIndex: 0, extents: [{ index: 1, offset: 0, length: alpha.length }] },
    { id: 8, method: 2, dataReferenceIndex: 0, extents: [{ index: 1, offset: 0, length: xmp.length }] },
    { id: 9, method: 0, dataReferenceIndex: 0, extents: [{ index: 1, offset: 0, length: overlayDescriptor.length }] },
  ])]));
  const mdatStart = ftyp.length + provisionalMeta.length + 8;
  const xmpFirstOffset = mdatStart + tileA.length - 2;
  const xmpSecondOffset = mdatStart + 2 + 12 + tileB.length + exif.length;
  const locations: LocationInput[] = [
    { id: 1, method: 1, dataReferenceIndex: 0, extents: [{ index: 1, offset: 0, length: gridDescriptor.length }] },
    { id: 2, method: 0, dataReferenceIndex: 0, extents: [{ index: 1, offset: mdatStart, length: 2 }, { index: 1, offset: mdatStart + 2 + 12 + tileB.length + exif.length + xmp.length - 12, length: 2 }] },
    { id: 3, method: 0, dataReferenceIndex: 0, extents: [{ index: 1, offset: mdatStart + 2 + 12, length: tileB.length }] },
    { id: 4, method: 0, dataReferenceIndex: 0, extents: [{ index: 1, offset: xmpFirstOffset, length: 12 }, { index: 1, offset: xmpSecondOffset, length: xmp.length - 12 }] },
    { id: 5, method: 0, dataReferenceIndex: 1, extents: [{ index: 1, offset: mdatStart + 2 + 12 + tileB.length, length: exif.length }] },
    { id: 6, method: 0, dataReferenceIndex: 0, extents: [{ index: 1, offset: xmpSecondOffset + xmp.length - 12 + tileA.length - 2, length: thumb.length }] },
    { id: 7, method: 0, dataReferenceIndex: 0, extents: [{ index: 1, offset: xmpSecondOffset + xmp.length - 12 + tileA.length, length: alpha.length }] },
    { id: 8, method: 2, dataReferenceIndex: 0, extents: [{ index: 1, offset: 0, length: xmp.length }] },
    { id: 9, method: 0, dataReferenceIndex: 0, extents: [{ index: 1, offset: mdatStart + mdatPayload.length - overlayDescriptor.length, length: overlayDescriptor.length }] },
  ];
  const actualMetaSize = box("meta", new Uint8Array([...metaWithoutIloc.flatMap((item) => [...item]), ...iloc(locations)])).length;
  const offsetCorrection = actualMetaSize - provisionalMeta.length;
  const correctedLocations = locations.map((location) => location.method !== 0 ? location : {
    ...location,
    extents: location.extents.map((extent) => ({ ...extent, offset: extent.offset + offsetCorrection })),
  });
  const meta = box("meta", new Uint8Array([...metaWithoutIloc.flatMap((item) => [...item]), ...iloc(correctedLocations)]));
  const output = new Uint8Array(ftyp.length + meta.length + 8 + mdatPayload.length);
  output.set(ftyp, 0); output.set(meta, ftyp.length);
  const mdatOffset = ftyp.length + meta.length;
  new DataView(output.buffer).setUint32(mdatOffset, mdatPayload.length + 8, false);
  output.set(new TextEncoder().encode("mdat"), mdatOffset + 4);
  output.set(mdatPayload, mdatOffset + 8);
  return output;
}

function findBox(bytes: Uint8Array, value: string): number {
  const needle = new TextEncoder().encode(value);
  let found = -1;
  for (let index = 0; index + 8 <= bytes.length; index += 1) {
    if (needle.every((byte, offset) => bytes[index + 4 + offset] === byte)) found = index;
  }
  return found;
}

function findFirstBox(bytes: Uint8Array, value: string): number {
  const needle = new TextEncoder().encode(value);
  for (let index = 0; index + 8 <= bytes.length; index += 1) {
    if (needle.every((byte, offset) => bytes[index + 4 + offset] === byte)) return index;
  }
  return -1;
}

function setDataReference(bytes: Uint8Array, itemId: number, value: number): void {
  const offset = findBox(bytes, "iloc");
  if (offset < 0) return;
  let cursor = offset + 8 + 8;
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < 9 && cursor + 8 <= bytes.length; index += 1) {
    const id = view.getUint16(cursor, false);
    const dataReferenceOffset = cursor + 4;
    const extentCount = view.getUint16(cursor + 6, false);
    if (id === itemId) { view.setUint16(dataReferenceOffset, value, false); return; }
    cursor += 8 + extentCount * 12;
  }
}

function appendTopLevel(bytes: Uint8Array, ...children: readonly Uint8Array[]): Uint8Array {
  return concatenate([bytes, ...children]);
}

function appendMetaChild(bytes: Uint8Array, child: Uint8Array): Uint8Array {
  const metaOffset = findFirstBox(bytes, "meta");
  if (metaOffset < 0) throw new Error("fixture has no MetaBox");
  const oldSize = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(metaOffset, false);
  const oldEnd = metaOffset + oldSize;
  if (oldEnd > bytes.length) throw new Error("fixture MetaBox is truncated");
  const payload = concatenate([bytes.subarray(metaOffset + 8, oldEnd), child]);
  const meta = box("meta", payload);
  return concatenate([bytes.subarray(0, metaOffset), meta, bytes.subarray(oldEnd)]);
}

function propertiesFixture(properties: readonly Uint8Array[], associations: Uint8Array = ipma([[1, properties.map((_, index) => index + 1)]])): Uint8Array {
  const ftyp = box("ftyp", new TextEncoder().encode("heic\0\0\0\0"));
  const itemProperties = box("iprp", concatenate([box("ipco", concatenate(properties)), associations]));
  const meta = box("meta", concatenate([new Uint8Array(4), pitm(1), iinf([infe(1, "av01")]), itemProperties]));
  return concatenate([ftyp, meta]);
}

function wideIpma(encodedProperty: number, version = 1): Uint8Array {
  const payload = new Uint8Array(version === 1 ? 4 + 4 + 4 + 1 + 2 : 4 + 4 + 2 + 1 + 2);
  payload[0] = version;
  payload[3] = version === 1 ? 1 : 0;
  new DataView(payload.buffer).setUint32(4, 1, false);
  let cursor = 8;
  if (version === 1) { new DataView(payload.buffer).setUint32(cursor, 1, false); cursor += 4; }
  else { new DataView(payload.buffer).setUint16(cursor, 1, false); cursor += 2; }
  payload[cursor] = 1;
  new DataView(payload.buffer).setUint16(cursor + 1, encodedProperty, false);
  return box("ipma", payload);
}

function simpleNclx(primaries: number, transfer: number, matrix: number, fullRange = false): Uint8Array {
  const payload = new Uint8Array(11);
  payload.set(new TextEncoder().encode("nclx"), 0);
  const view = new DataView(payload.buffer);
  view.setUint16(4, primaries, false);
  view.setUint16(6, transfer, false);
  view.setUint16(8, matrix, false);
  payload[10] = fullRange ? 0x80 : 0;
  return box("colr", payload);
}

function simpleProfile(type: "prof" | "rICC", bytes = Uint8Array.of(1, 2, 3)): Uint8Array {
  return box("colr", concatenate([new TextEncoder().encode(type), bytes]));
}

function rangeFixture(children: readonly Uint8Array[]): Uint8Array {
  return concatenate([box("ftyp", new TextEncoder().encode("heic\0\0\0\0")), box("meta", concatenate([new Uint8Array(4), ...children]))]);
}

function putUint64(bytes: Uint8Array, offset: number, value: number): void {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  view.setUint32(offset, Math.floor(value / 0x100000000), false);
  view.setUint32(offset + 4, value >>> 0, false);
}

function versionZeroIloc(): Uint8Array {
  const payload = new Uint8Array(38);
  payload[4] = 0x88;
  payload[5] = 0x08;
  new DataView(payload.buffer).setUint16(6, 1, false);
  new DataView(payload.buffer).setUint16(8, 1, false);
  new DataView(payload.buffer).setUint16(20, 1, false);
  putUint64(payload, 22, 0);
  putUint64(payload, 30, 1);
  return box("iloc", payload);
}

function wideVersionOneIloc(): Uint8Array {
  const payload = new Uint8Array(48);
  payload[0] = 1;
  payload[4] = 0x88;
  payload[5] = 0x88;
  new DataView(payload.buffer).setUint16(6, 1, false);
  new DataView(payload.buffer).setUint16(8, 1, false);
  new DataView(payload.buffer).setUint16(22, 1, false);
  putUint64(payload, 24, 1);
  putUint64(payload, 32, 0);
  putUint64(payload, 40, 1);
  return box("iloc", payload);
}

function versionedLocationFixture(location: Uint8Array): Uint8Array {
  const meta = box("meta", concatenate([new Uint8Array(4), pitm(1), iinf([infe(1, "av01")]), location]));
  return concatenate([box("ftyp", new TextEncoder().encode("heic\0\0\0\0")), meta]);
}

function versionOneIref(): Uint8Array {
  const childPayload = new Uint8Array(10);
  new DataView(childPayload.buffer).setUint32(0, 1, false);
  new DataView(childPayload.buffer).setUint16(4, 1, false);
  new DataView(childPayload.buffer).setUint32(6, 2, false);
  return box("iref", concatenate([Uint8Array.of(1, 0, 0, 0), box("dimg", childPayload)]));
}

describe("B02 HEIF/AVIF item semantics", () => {
  it("exposes multi-extent items, item-offset construction, relationships, properties, and data references", async () => {
    const result = await parseMetadata(buildFixture());
    const graph = result.heif?.[0];
    expect(graph).toBeDefined();
    expect(graph?.primaryItemId).toBe(1);
    expect(graph?.items.find(({ id }) => id === 4)?.location).toMatchObject({ constructionMethod: "file", resolution: "resolved", resolvedByteLength: 33 });
    expect(graph?.items.find(({ id }) => id === 4)?.location?.extents).toHaveLength(2);
    expect(graph?.items.find(({ id }) => id === 8)?.location).toMatchObject({ constructionMethod: "item-offset", resolution: "resolved", resolvedByteLength: 33 });
    expect(graph?.items.find(({ id }) => id === 8)?.location?.extents[0]?.sourceItemId).toBe(4);
    expect(graph?.items.find(({ id }) => id === 4)).toMatchObject({ name: "mime-4", contentType: "application/rdf+xml", hidden: false });
    expect(graph?.items.find(({ id }) => id === 8)).toMatchObject({ name: "mime-8", contentType: "application/octet-stream", hidden: true });
    expect(graph?.relationships.map(({ referenceType }) => referenceType)).toEqual(["dimg", "dimg", "thmb", "auxl", "cdsc", "iloc", "dimg", "dimg"]);
    expect(graph?.items.find(({ id }) => id === 6)?.roles).toContain("thumbnail");
    expect(graph?.items.find(({ id }) => id === 7)?.roles).toContain("auxiliary");
    expect(graph?.items.find(({ id }) => id === 1)?.derived).toEqual(expect.objectContaining({ type: "grid", rows: 1, columns: 2, outputWidth: 4, outputHeight: 2, referenceCount: 2 }));
    expect(graph?.items.find(({ id }) => id === 9)?.location).toMatchObject({ constructionMethod: "file", resolution: "resolved", resolvedByteLength: 22 });
    expect(graph?.items.find(({ id }) => id === 9)?.derived).toEqual(expect.objectContaining({ type: "overlay", outputWidth: 8, outputHeight: 4, referenceCount: 2, offsets: [{ horizontal: -1, vertical: 2 }, { horizontal: 3, vertical: -4 }] }));
    expect(graph?.relationships.filter(({ sourceItemId }) => sourceItemId === 9).map(({ type, targetItemId }) => [type, targetItemId])).toEqual([["overlay-input", 2], ["overlay-input", 3]]);
    expect(graph?.properties.find(({ type }) => type === "auxC")?.auxiliaryType).toContain("auxiliary:alpha");
    expect(graph?.properties.find(({ type }) => type === "ispe")?.essential).toBe(true);
    expect(graph?.items.find(({ id }) => id === 1)?.properties).toContainEqual({ propertyIndex: 1, essential: true });
    expect(graph?.dataReferences).toEqual(expect.arrayContaining([expect.objectContaining({ index: 1, selfContained: true, resolvable: true }), expect.objectContaining({ index: 2, selfContained: false, resolvable: false })]));
    expect(result.xmp?.packets).toHaveLength(1);
    expect(result.warnings).toEqual([]);
    expect((toJsonSafeResult(result) as { readonly heif?: unknown }).heif).toBeDefined();
  });

  it("retains AVIF item semantics without decoding item pixels", async () => {
    const result = await parseMetadata(buildFixture("avif"));
    expect(result.format).toBe("avif");
    expect(result.heif?.[0]?.items).toHaveLength(9);
    expect(result.heif?.[0]?.items.find(({ id }) => id === 1)?.dimensions).toEqual({ width: 4, height: 2 });
  });

  it("fails closed for external references, cycles, malformed grid descriptors, and security limits", async () => {
    const external = buildFixture();
    expect(findBox(external, "iloc")).toBeGreaterThan(0);
    setDataReference(external, 5, 2);
    const externalResult = await parseMetadata(external);
    expect(externalResult.heif?.[0]?.items.find(({ id }) => id === 5)?.location?.resolution).toBe("external");
    expect(externalResult.warnings).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));

    const limited = await parseMetadata(buildFixture(), { limits: { maxSegments: 3 } });
    expect(limited.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));

    const malformed = buildFixture();
    const idat = findBox(malformed, "idat");
    expect(idat).toBeGreaterThan(0);
    malformed[idat + 8 + 3] = 0;
    const malformedResult = await parseMetadata(malformed);
    expect(malformedResult.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));

    const cycle = buildFixture();
    const ilocReference = findFirstBox(cycle, "iloc");
    expect(ilocReference).toBeGreaterThan(0);
    new DataView(cycle.buffer).setUint16(ilocReference + 12, 8, false);
    const cycleResult = await parseMetadata(cycle);
    expect(cycleResult.heif?.[0]?.items.find(({ id }) => id === 8)?.location?.resolution).toBe("malformed");
    expect(cycleResult.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));
  });

  it("uses the bounded HEIF metadata range planner without materializing trailing payload", async () => {
    const fixture = buildFixture();
    const trailing = box("free", new Uint8Array(96 * 1024));
    const input = new Blob([fixture.buffer as ArrayBuffer, trailing.buffer as ArrayBuffer]);
    const result = await parseMetadata(input, { scope: "metadata" });
    expect(result.completeness.scope).toBe("partial");
    expect(result.completeness.inputBytes).toBe(input.size);
    expect(result.completeness.bytesRead).toBeDefined();
    expect(result.completeness.bytesRead ?? input.size).toBeLessThan(input.size);
    expect(result.telemetry?.bytesRead).toBe(result.completeness.bytesRead);
    expect(result.xmp?.packets).toHaveLength(1);
    expect(result.heif?.[0]?.relationships).toEqual(expect.arrayContaining([expect.objectContaining({ referenceType: "cdsc", sourceItemId: 4, targetItemId: 1 })]));
  });

  it("covers versioned range layouts and fail-closed malformed container boundaries", async () => {
    const versioned = buildVersionTwoRangeFixture();
    const versionedResult = await parseMetadata(new Blob([versioned.buffer as ArrayBuffer]), { scope: "metadata" });
    expect(versionedResult.xmp?.packets).toEqual(["<x:xmpmeta/>\n"]);
    expect(versionedResult.completeness.scope).toBe("partial");

    const ftypPayload = new TextEncoder().encode("heic\0\0\0\0");
    const extended = await materializeHeifMetadata(
      readerFor(extendedBox("ftyp", ftypPayload)),
      resolveLimits(),
      resolveSelection(undefined),
    );
    expect(extended?.partial).toBe(true);
    const zeroSized = await materializeHeifMetadata(
      readerFor(zeroSizedBox("ftyp", ftypPayload)),
      resolveLimits(),
      resolveSelection(undefined),
    );
    expect(zeroSized?.partial).toBe(true);
    const unsafeExtended = new Uint8Array(16);
    new DataView(unsafeExtended.buffer).setUint32(0, 1, false);
    unsafeExtended.set(new TextEncoder().encode("ftyp"), 4);
    new DataView(unsafeExtended.buffer).setUint32(8, 0x00200000, false);
    expect(await materializeHeifMetadata(readerFor(unsafeExtended), resolveLimits(), resolveSelection(undefined))).toBeNull();
    expect(await materializeHeifMetadata(readerFor(Uint8Array.of(0, 0, 0, 4, 0x66, 0x74, 0x79, 0x70)), resolveLimits(), resolveSelection(undefined))).toBeNull();

    const malformedName = buildFixture();
    const firstInfe = findFirstBox(malformedName, "infe");
    expect(firstInfe).toBeGreaterThan(0);
    malformedName[firstInfe + 20] = 0xff;
    const malformedNameResult = await parseMetadata(malformedName);
    expect(malformedNameResult.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));

    const malformedAssociation = buildFixture();
    const ipma = findFirstBox(malformedAssociation, "ipma");
    expect(ipma).toBeGreaterThan(0);
    malformedAssociation[ipma + 27] = 0;
    const malformedAssociationResult = await parseMetadata(malformedAssociation);
    expect(malformedAssociationResult.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));

    const malformedExif = concatenate([buildFixture(), box("Exif", new Uint8Array(8))]);
    const malformedExifResult = await parseMetadata(malformedExif);
    expect(malformedExifResult.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));
  });

  it("exercises every item-graph truncation boundary with bounded typed results", async () => {
    const fixture = buildFixture();
    for (let length = 0; length <= fixture.length; length += 1) {
      const result = await parseMetadata(fixture.subarray(0, length), { limits: { maxSegments: 128, maxAdapterItems: 32, maxImageDetailFrames: 32, maxImageDetailRelationships: 64 } });
      expect(result.heif ?? []).toBeInstanceOf(Array);
      expect(result.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
      expect((result.heif?.[0]?.items.length ?? 0)).toBeLessThanOrEqual(32);
      expect((result.heif?.[0]?.properties.length ?? 0)).toBeLessThanOrEqual(32);
      expect((result.heif?.[0]?.relationships.length ?? 0)).toBeLessThanOrEqual(64);
    }
  });
});

describe("S06 HEIF standards and safety branch matrix", () => {
  it("validates dimension scanning, extended and zero-sized boxes, conflicts, limits, and cancellation", () => {
    const valid = ispe(12, 8);
    expect(parseHeifDimensions(valid)).toEqual({ width: 12, height: 8 });
    expect(parseHeifDimensions(extendedBox("ispe", valid.subarray(8)))).toEqual({ width: 12, height: 8 });
    expect(parseHeifDimensions(zeroSizedBox("ispe", valid.subarray(8)))).toEqual({ width: 12, height: 8 });
    expect(parseHeifDimensions(fullBox("meta", valid))).toEqual({ width: 12, height: 8 });
    expect(parseHeifDimensions(concatenate([ispe(12, 8), ispe(13, 8)]) )).toBeNull();
    expect(parseHeifDimensions(box("ispe", new Uint8Array(11)))).toBeNull();
    expect(parseHeifDimensions(ispe(0, 8))).toBeNull();
    expect(parseHeifDimensions(new Uint8Array())).toBeNull();
    expect(parseHeifDimensions(valid, -1)).toBeNull();
    expect(parseHeifDimensions(valid, 8, 0)).toBeNull();
    expect(parseHeifDimensions(fullBox("meta", valid.subarray(8)), 0)).toBeNull();
    expect(parseHeifDimensions(concatenate([valid, valid]), 8, 1)).toBeNull();
    const malformedExtended = new Uint8Array(16);
    new DataView(malformedExtended.buffer).setUint32(0, 1, false);
    malformedExtended.set(new TextEncoder().encode("ispe"), 4);
    new DataView(malformedExtended.buffer).setUint32(8, 0x00200000, false);
    expect(parseHeifDimensions(malformedExtended)).toBeNull();
    const controller = new AbortController();
    controller.abort();
    expect(() => parseHeifDimensions(valid, 8, 4096, controller.signal)).toThrow(expect.objectContaining({ code: "ABORTED" }));
  });

  it("retains valid primary properties and rejects contradictory dimensions, profiles, colour, and transforms", async () => {
    const valid = await parseMetadata(propertiesFixture([
      ispe(12, 8),
      simpleNclx(1, 13, 6, true),
      simpleProfile("prof", Uint8Array.of(1, 2, 3, 4)),
      box("irot", Uint8Array.of(1)),
      box("imir", Uint8Array.of(0)),
      auxc("urn:mpeg:mpegB:cicp:systems:auxiliary:alpha"),
    ]));
    expect(valid.dimensions).toEqual({ width: 12, height: 8 });
    expect(valid.nclx).toEqual({ colourPrimaries: 1, transferCharacteristics: 13, matrixCoefficients: 6, fullRange: true });
    expect(valid.transform).toEqual({ rotation: 90, mirrored: true, mirrorAxis: "vertical" });
    expect(valid.displayDimensions).toEqual({ width: 8, height: 12 });
    expect(valid.blocks).toEqual(expect.arrayContaining([
      expect.objectContaining({ family: "ICC", container: "HEIF colr item property" }),
      expect.objectContaining({ family: "Unknown", container: "HEIF auxC item property" }),
    ]));

    const contradictory = await parseMetadata(propertiesFixture([
      ispe(12, 8), ispe(13, 8),
      simpleProfile("prof", Uint8Array.of(1)), simpleProfile("rICC", Uint8Array.of(2)),
      simpleNclx(1, 13, 6), simpleNclx(9, 16, 1),
      box("irot", Uint8Array.of(1)), box("irot", Uint8Array.of(2)),
      box("imir", Uint8Array.of(0)), box("imir", Uint8Array.of(1)),
    ]));
    expect(contradictory.dimensions).toBeNull();
    expect(contradictory.icc).toBeNull();
    expect(contradictory.nclx).toBeUndefined();
    expect(contradictory.transform).toBeUndefined();
    expect(contradictory.warnings.filter(({ code }) => code === "MALFORMED_HEIF").length).toBeGreaterThanOrEqual(4);
  });

  it("exercises property, association, item-information, and reference rejection paths", async () => {
    const malformedAux = fullBox("auxC", Uint8Array.of(0, 0, 0, 0, 0x61));
    const malformedColour = box("colr", new TextEncoder().encode("nclx"));
    const malformedProperty = box("ispe", new Uint8Array(4));
    const malformedProperties = propertiesFixture([malformedAux, malformedColour, malformedProperty]);
    expect((await parseMetadata(malformedProperties)).warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "MALFORMED_HEIF" })]));

    const duplicatePropertyContainers = concatenate([
      box("iprp", concatenate([box("ipco", ispe(2, 2)), box("ipco", ispe(3, 3)), ipma([[1, [1]]])])),
    ]);
    expect((await parseMetadata(appendMetaChild(propertiesFixture([]), duplicatePropertyContainers))).warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));

    const wide = await parseMetadata(propertiesFixture([ispe(20, 10)], wideIpma(0x8001)));
    expect(wide.heif?.[0]?.items.find(({ id }) => id === 1)?.properties).toContainEqual({ propertyIndex: 1, essential: true });
    const reservedWide = await parseMetadata(propertiesFixture([ispe(20, 10)], wideIpma(0)));
    expect(reservedWide.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));
    const invalidFlags = await parseMetadata(propertiesFixture([ispe(20, 10)], box("ipma", Uint8Array.of(0, 0, 0, 2, 0, 0, 0, 0))));
    expect(invalidFlags.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));

    const malformedInfos = [
      box("iinf", new Uint8Array()),
      box("iinf", Uint8Array.of(2, 0, 0, 0, 0, 0)),
      box("iinf", Uint8Array.of(0, 0, 0, 0)),
      iinf([infe(0, "av01"), infe(1, "av01")]),
      iinf([infe(2, "mime", "application/\xff")]),
    ];
    const infoResult = await parseMetadata(appendMetaChild(buildFixture(), concatenate(malformedInfos)));
    expect(infoResult.warnings.filter(({ code }) => code === "MALFORMED_HEIF").length).toBeGreaterThan(0);

    const malformedReferences = [
      box("iref", Uint8Array.of(2, 0, 0, 0)),
      box("iref", Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 0)),
      box("iref", Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0)),
    ];
    const referenceResult = await parseMetadata(appendMetaChild(buildFixture(), concatenate(malformedReferences)));
    expect(referenceResult.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "MALFORMED_HEIF" })]));

    const versionOneReference = await parseMetadata(appendMetaChild(buildFixture(), versionOneIref()));
    expect(versionOneReference.heif?.[0]?.relationships).toEqual(expect.arrayContaining([expect.objectContaining({ referenceType: "dimg", sourceItemId: 1, targetItemId: 2 })]));

    const versionZeroLocation = await parseMetadata(versionedLocationFixture(versionZeroIloc()));
    expect(versionZeroLocation.heif?.[0]?.items.find(({ id }) => id === 1)?.location).toMatchObject({ constructionMethod: "file", resolution: "resolved", resolvedByteLength: 1 });
    const wideLocation = await parseMetadata(versionedLocationFixture(wideVersionOneIloc()));
    expect(wideLocation.heif?.[0]?.items.find(({ id }) => id === 1)?.location).toMatchObject({ constructionMethod: "file", resolution: "resolved", resolvedByteLength: 1 });
  });

  it("covers direct Exif and XMP boxes, duplicate metadata, encoding failures, and output limits", async () => {
    const tiff = new Uint8Array(await readFile(new URL("./fixtures/tiff-exif-little-endian.tif", import.meta.url)));
    const xmp = new TextEncoder().encode("<x:xmpmeta xmlns:x=\"adobe:ns:meta/\"><rdf:RDF/></x:xmpmeta>");
    const direct = await parseMetadata(appendTopLevel(buildFixture(), box("Exif", tiff), box("Exif", tiff), box("xml ", xmp), box("XMP ", Uint8Array.of(0xff, 0xfe))));
    expect(direct.exif).not.toBeNull();
    expect(direct.xmp?.packets.length).toBeGreaterThan(1);
    expect(direct.warnings).toContainEqual(expect.objectContaining({ code: "DUPLICATE_EXIF" }));
    expect(direct.blocks).toEqual(expect.arrayContaining([expect.objectContaining({ family: "EXIF", container: "HEIF Exif box" }), expect.objectContaining({ family: "XMP", container: "HEIF XMP box" })]));

    const bounded = await parseMetadata(appendTopLevel(buildFixture(), box("Exif", tiff), box("xml ", xmp)), { limits: { maxSegmentBytes: 4, maxMetadataBytes: 8 } });
    expect(bounded.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    const selection = await parseMetadata(appendTopLevel(buildFixture(), box("Exif", tiff), box("xml ", xmp)), { select: { groups: ["Dimensions"] } });
    expect(selection.exif).toBeNull();
    expect(selection.xmp).toBeNull();
  });

  it("keeps every prefix of a property-bearing MetaBox bounded and typed", async () => {
    const source = propertiesFixture([
      ispe(640, 480),
      simpleNclx(1, 13, 6),
      simpleProfile("prof", Uint8Array.of(1, 2, 3, 4)),
      box("irot", Uint8Array.of(3)),
      box("imir", Uint8Array.of(1)),
      auxc("urn:mpeg:mpegB:cicp:systems:auxiliary:alpha"),
    ]);
    for (let length = 0; length <= source.length; length += 1) {
      const result = await parseMetadata(source.subarray(0, length), { limits: { maxSegments: 64, maxWarnings: 32, maxIfdEntries: 32 } });
      expect(result.heif ?? []).toBeInstanceOf(Array);
      expect(result.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
      expect(result.warnings.length).toBeLessThanOrEqual(32);
    }
  });

  it("keeps the range materializer fail-closed across every bounded HEIF child parser", async () => {
    const selection = resolveSelection(undefined);
    const invalidChildren = [
      box("iinf", new Uint8Array()),
      box("iinf", Uint8Array.of(2, 0, 0, 0, 0, 0)),
      box("iinf", Uint8Array.of(0, 0, 0, 0)),
      box("iloc", Uint8Array.of(3, 0, 0, 0, 0, 0, 0, 0)),
      box("iloc", Uint8Array.of(0, 0, 0, 0, 0x14, 0, 0, 0)),
      box("iref", Uint8Array.of(2, 0, 0, 0)),
      box("iref", Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 0)),
      box("dinf", Uint8Array.of(0, 0, 0, 4, 0x64, 0x72, 0x65, 0x66)),
      box("dinf", box("dref", Uint8Array.of(1, 0, 0, 0, 0, 0, 0, 0))),
    ];
    for (const child of invalidChildren) {
      expect(await materializeHeifMetadata(readerFor(rangeFixture([child])), resolveLimits(), selection)).toBeNull();
    }
    expect(await materializeHeifMetadata(readerFor(rangeFixture([box("free", Uint8Array.of(1, 2, 3))])), resolveLimits(), selection)).toMatchObject({ partial: true, warnings: [] });
    const empty = await materializeHeifMetadata(readerFor(rangeFixture([])), resolveLimits(), selection);
    expect(empty?.partial).toBe(true);
    expect(typeof empty?.bytesRead).toBe("number");
    expect(await materializeHeifMetadata(readerFor(box("ftyp", new TextEncoder().encode("heic\0\0\0\0"))), resolveLimits(), selection)).toMatchObject({ partial: true });
    expect(await materializeHeifMetadata(readerFor(concatenate([box("ftyp", new TextEncoder().encode("heic\0\0\0\0")), box("moov", new Uint8Array())])), resolveLimits(), selection)).toBeNull();
    expect(await materializeHeifMetadata(readerFor(rangeFixture([Uint8Array.of(0, 0, 0, 4, 0x66, 0x72, 0x65)])), resolveLimits(), selection)).toBeNull();
    expect(await materializeHeifMetadata(readerFor(rangeFixture([box("iinf", Uint8Array.of(0, 0, 0, 0, 0, 2))])), resolveLimits({ maxIfdEntries: 1 }), selection)).toBeNull();
    expect(await materializeHeifMetadata(readerFor(rangeFixture([box("iloc", Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 2))])), resolveLimits({ maxIfdEntries: 1 }), selection)).toBeNull();
    const rebuilt = await materializeHeifMetadata(readerFor(buildFixture()), resolveLimits({ maxMetadataBytes: buildFixture().length * 2 }), selection);
    expect(rebuilt?.partial).toBe(true);
    expect(rebuilt?.bytes).toBeInstanceOf(Uint8Array);
    expect(rebuilt?.warnings).toBeInstanceOf(Array);
  });
});
