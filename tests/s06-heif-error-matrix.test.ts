import { describe, expect, it } from "vitest";

import { materializeHeifMetadata } from "../src/heif-range.js";
import { parseHeif, parseHeifDimensions } from "../src/parsers/heif.js";
import { resolveSelection } from "../src/selection.js";
import { resolveLimits } from "../src/security/limits.js";
import type { BlobReader, MetadataMaterialization } from "../src/input.js";

const encoder = new TextEncoder();
const allGroups = resolveSelection({ groups: ["Dimensions", "EXIF", "XMP", "ICC"] });
const metadataGroups = resolveSelection({ groups: ["EXIF", "XMP"] });
const limits = resolveLimits({
  maxInputBytes: 128 * 1024,
  maxMetadataBytes: 32 * 1024,
  maxSegmentBytes: 16 * 1024,
  maxValueBytes: 16 * 1024,
  maxStringBytes: 4 * 1024,
  maxIfdEntries: 32,
  maxIfdDepth: 4,
  maxSegments: 64,
  maxWarnings: 32,
});

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function u16(value: number): Uint8Array {
  const output = new Uint8Array(2);
  new DataView(output.buffer).setUint16(0, value, false);
  return output;
}

function u32(value: number): Uint8Array {
  const output = new Uint8Array(4);
  new DataView(output.buffer).setUint32(0, value >>> 0, false);
  return output;
}

function u64(value: number): Uint8Array {
  const output = new Uint8Array(8);
  const view = new DataView(output.buffer);
  view.setUint32(0, Math.floor(value / 0x100000000), false);
  view.setUint32(4, value >>> 0, false);
  return output;
}

function box(type: string, ...payloads: readonly Uint8Array[]): Uint8Array {
  const payload = concat(...payloads);
  return concat(u32(payload.length + 8), encoder.encode(type), payload);
}

function extendedBox(type: string, payload: Uint8Array): Uint8Array {
  return concat(u32(1), encoder.encode(type), u64(payload.length + 16), payload);
}

function zeroFullBox(type: string, payload: Uint8Array, version = 0, flags = 0): Uint8Array {
  return box(type, concat(Uint8Array.of(version, (flags >>> 16) & 0xff, (flags >>> 8) & 0xff, flags & 0xff), payload));
}

function infeV2(id: number, type: string, name = "item", contentType?: string, encoding?: string, hidden = false): Uint8Array {
  return box("infe", concat(
    Uint8Array.of(2, 0, 0, hidden ? 1 : 0),
    u16(id),
    u16(0),
    encoder.encode(type),
    encoder.encode(`${name}\0`),
    ...(contentType === undefined ? [] : [encoder.encode(`${contentType}\0`)]),
    ...(encoding === undefined ? [] : [encoder.encode(`${encoding}\0`)]),
  ));
}

function infeV3(id: number, type: string, name = "item", contentType?: string, encoding?: string, hidden = false): Uint8Array {
  return box("infe", concat(
    Uint8Array.of(3, 0, 0, hidden ? 1 : 0),
    u32(id),
    u16(0),
    encoder.encode(type),
    encoder.encode(`${name}\0`),
    ...(contentType === undefined ? [] : [encoder.encode(`${contentType}\0`)]),
    ...(encoding === undefined ? [] : [encoder.encode(`${encoding}\0`)]),
  ));
}

function iinf(infos: readonly Uint8Array[], version: 0 | 1 = 0): Uint8Array {
  return zeroFullBox("iinf", concat(version === 0 ? u16(infos.length) : u32(infos.length), ...infos), version);
}

function ilocRaw(payload: Uint8Array): Uint8Array {
  return box("iloc", payload);
}

function ilocOne(options: {
  readonly version?: 0 | 1 | 2;
  readonly id?: number;
  readonly method?: number;
  readonly dataReferenceIndex?: number;
  readonly offsetSize?: 0 | 4 | 8;
  readonly lengthSize?: 0 | 4 | 8;
  readonly baseSize?: 0 | 4 | 8;
  readonly indexSize?: 0 | 4 | 8;
  readonly offset?: number;
  readonly length?: number;
  readonly extentCount?: number;
  readonly index?: number;
} = {}): Uint8Array {
  const version = options.version ?? 1;
  const offsetSize = options.offsetSize ?? 4;
  const lengthSize = options.lengthSize ?? 4;
  const baseSize = options.baseSize ?? 0;
  const indexSize = version === 0 ? 0 : options.indexSize ?? 0;
  const value = (number: number, size: 0 | 4 | 8): Uint8Array => size === 0 ? new Uint8Array() : size === 4 ? u32(number) : u64(number);
  const extentCount = options.extentCount ?? 1;
  const payload: Uint8Array[] = [
    Uint8Array.of(version, 0, 0, 0, (offsetSize << 4) | lengthSize, (indexSize << 4) | baseSize),
    version < 2 ? u16(1) : u32(1),
    version < 2 ? u16(options.id ?? 1) : u32(options.id ?? 1),
  ];
  if (version >= 1) payload.push(u16(options.method ?? 0));
  payload.push(u16(options.dataReferenceIndex ?? 0), value(0, baseSize), u16(extentCount));
  for (let index = 0; index < extentCount; index += 1) {
    if (indexSize > 0) payload.push(value(options.index ?? 1, indexSize));
    payload.push(value(options.offset ?? 0, offsetSize), value(options.length ?? 1, lengthSize));
  }
  return ilocRaw(concat(...payload));
}

function ftyp(): Uint8Array {
  return box("ftyp", concat(encoder.encode("heic"), u32(0), encoder.encode("mif1")));
}

function meta(...children: readonly Uint8Array[]): Uint8Array {
  return box("meta", concat(new Uint8Array(4), ...children));
}

function container(...children: readonly Uint8Array[]): Uint8Array {
  return concat(ftyp(), meta(...children), box("mdat", Uint8Array.of(1, 2, 3, 4, 5, 6, 7, 8)));
}

function readerFor(bytes: Uint8Array): BlobReader {
  let bytesRead = 0;
  return {
    size: bytes.length,
    read: (start, end) => {
      if (start < 0 || end < start || end > bytes.length) throw new Error("HEIF range escaped source bounds");
      bytesRead += end - start;
      return Promise.resolve(bytes.slice(start, end));
    },
    bytesRead: () => bytesRead,
    telemetry: () => ({ readRequests: 0, bytesRead, cacheHits: 0, coalescedReads: 0, cacheBytes: 0 }),
  };
}

function assertBounded(result: ReturnType<typeof parseHeif>): void {
  expect(result.fields.length).toBeLessThanOrEqual(limits.maxIfdEntries * 128);
  expect(result.blocks?.length ?? 0).toBeLessThanOrEqual(limits.maxIfdEntries * 128);
  expect(result.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
  expect(result.warnings.every(({ code, offset, length }) => /^[A-Z][A-Z0-9_]+$/u.test(code) && (offset === undefined || (Number.isSafeInteger(offset) && offset >= 0)) && (length === undefined || (Number.isSafeInteger(length) && length >= 0)))).toBe(true);
}

function assertMaterialized(value: MetadataMaterialization | null): void {
  expect(value === null || value.bytes.length <= limits.maxMetadataBytes).toBe(true);
  if (value !== null) {
    expect(value.partial).toBe(true);
    expect(value.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
  }
}

describe("S06 HEIF parser and range malformed-path matrix", () => {
  it("retains bounded diagnostics for every item-info and item-location rejection branch", async () => {
    const malformedInfos = [
      zeroFullBox("iinf", new Uint8Array()),
      zeroFullBox("iinf", Uint8Array.of(0, 0, 0)),
      zeroFullBox("iinf", Uint8Array.of(2, 0, 0, 0, 0, 0)),
      iinf([box("free", new Uint8Array())]),
      iinf([infeV2(1, "mime", "name") .slice(0, -1)]),
      iinf([box("infe", Uint8Array.of(2, 0, 0, 0, 0, 1, 0, 0, 0, 0))]),
      iinf([box("infe", Uint8Array.of(3, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0))]),
      iinf([box("infe", concat(Uint8Array.of(2, 0, 0, 0, 0, 1, 0, 0), encoder.encode("mime"), encoder.encode("unterminated")))]),
      iinf([infeV2(1, "mime", "name") .subarray(0, infeV2(1, "mime", "name").length - 2)]),
      iinf([infeV2(1, "mime", "name", "application/\xff")]),
      iinf([infeV2(1, "mime", "name", "application/rdf+xml", "unterminated") .slice(0, -1)]),
      iinf([box("infe", concat(Uint8Array.of(2, 0, 0, 0, 0, 1, 0, 0), encoder.encode("mime"), Uint8Array.of(0xff, 0)))]),
    ];
    for (const child of malformedInfos) {
      const parsed = parseHeif(container(child), limits, "heif", allGroups);
      assertBounded(parsed);
      expect(parsed.warnings.length).toBeGreaterThan(0);
      assertMaterialized(await materializeHeifMetadata(readerFor(container(child)), limits, metadataGroups));
    }

    const malformedLocations = [
      ilocRaw(new Uint8Array()),
      ilocRaw(Uint8Array.of(3, 0, 0, 0, 0, 0, 0, 0)),
      ilocRaw(Uint8Array.of(1, 0, 0, 0, 0x11, 0x11, 0, 1)),
      ilocOne({ id: 0 }),
      ilocOne({ method: 0x10 }),
      ilocOne({ index: 0, indexSize: 4 }),
      ilocOne({ offsetSize: 8 }).slice(0, -1),
      ilocOne({ lengthSize: 8 }).slice(0, -2),
      ilocOne({ baseSize: 8 }).slice(0, -3),
      ilocOne({ extentCount: 33 }),
      ilocRaw(Uint8Array.of(2, 0, 0, 0, 0x44, 0x40, 0, 0, 0, 0, 0, 1)),
      ilocRaw(Uint8Array.of(2, 0, 0, 0, 0x44, 0x40, 0, 0, 0, 0, 0, 1, 0, 0, 0)),
    ];
    for (const child of malformedLocations) {
      const parsed = parseHeif(container(iinf([infeV2(1, "Exif")]), child), limits, "heif", allGroups);
      assertBounded(parsed);
      expect(parsed.warnings.length).toBeGreaterThan(0);
      assertMaterialized(await materializeHeifMetadata(readerFor(container(iinf([infeV2(1, "Exif")]), child)), limits, metadataGroups));
    }
  });

  it("covers alternate item-property and reference structures without unsafe output", async () => {
    const spatial = box("ispe", concat(Uint8Array.of(0, 0, 0, 0), u32(12), u32(8)));
    const validNclx = box("colr", concat(encoder.encode("nclx"), u16(1), u16(13), u16(6), Uint8Array.of(0x80)));
    const wideAssociation = box("ipma", concat(Uint8Array.of(0, 0, 0, 1), u32(1), u16(1), Uint8Array.of(6), u16(0x8001), u16(0x8002), u16(0x8003), u16(0x8004), u16(0x8005), u16(0x8006)));
    const properties = box("iprp", box("ipco", spatial, validNclx, box("auxC", concat(encoder.encode("urn:example:alpha\0"), u32(3))), box("irot", Uint8Array.of(3)), box("imir", Uint8Array.of(0)), box("zzzz", Uint8Array.of(1))), wideAssociation);
    const infos = iinf([infeV2(1, "av01", "image"), infeV3(2, "iden", "identity", undefined, undefined, true), infeV3(3, "mime", "xmp", "application/rdf+xml", "gzip")], 1);
    const references = box("iref", concat(Uint8Array.of(1, 0, 0, 0), extendedBox("dimg", concat(u32(1), u16(1), u32(2))), extendedBox("cdsc", concat(u32(3), u16(1), u32(1)))));
    const valid = container(zeroFullBox("pitm", u16(1)), infos, properties, references, ilocOne({ id: 1, offset: 0, length: 1 }));
    const parsed = parseHeif(valid, limits, "heif", allGroups);
    assertBounded(parsed);
    expect(parsed.heif?.[0]?.properties.map(({ type }) => type)).toEqual(expect.arrayContaining(["ispe", "colr", "auxC", "irot", "imir", "zzzz"]));
    expect(parsed.heif?.[0]?.relationships.map(({ type }) => type)).toEqual(expect.any(Array));
    expect(parsed.transform).toMatchObject({ rotation: 270, mirrored: true });
    expect(parsed.nclx).toMatchObject({ fullRange: true });

    const propertyCases = [
      box("ipco", box("ispe", new Uint8Array(4))),
      box("ipco", box("colr", encoder.encode("nclx\0"))),
      box("ipco", box("colr", concat(encoder.encode("nclx"), new Uint8Array(7), Uint8Array.of(1)))),
      box("ipco", box("auxC", Uint8Array.of(0, 0, 0, 0))),
      box("ipco", box("auxC", concat(encoder.encode("urn:x"), Uint8Array.of(1)))),
      box("ipco", box("auxC", concat(encoder.encode("urn:x\0"), new Uint8Array(4097)))),
      box("ipco", box("irot", new Uint8Array())),
      box("ipco", box("imir", new Uint8Array())),
    ];
    for (const propertyContainer of propertyCases) {
      const result = parseHeif(container(propertyContainer, zeroFullBox("pitm", u16(1)), iinf([infeV2(1, "av01")]), box("ipma", concat(Uint8Array.of(0, 0, 0, 0), u32(1), u16(1), Uint8Array.of(1), Uint8Array.of(1)))), limits, "heif", allGroups);
      assertBounded(result);
      expect(result.heif?.[0]?.properties).toBeInstanceOf(Array);
    }

    const referenceCases = [
      box("iref", new Uint8Array()),
      box("iref", Uint8Array.of(2, 0, 0, 0)),
      box("iref", Uint8Array.of(0, 1, 0, 0)),
      box("iref", concat(Uint8Array.of(0, 0, 0, 0), box("dimg", Uint8Array.of(0, 0, 0, 0)))),
      box("iref", concat(Uint8Array.of(0, 0, 0, 0), extendedBox("dimg", new Uint8Array(2)))),
      box("iref", concat(Uint8Array.of(0, 0, 0, 0), box("dimg", concat(u16(0), u16(1), u16(1))))),
      box("iref", concat(Uint8Array.of(0, 0, 0, 0), box("dimg", concat(u16(1), u16(1), u16(0))))),
    ];
    for (const referenceBox of referenceCases) {
      const result = parseHeif(container(referenceBox, zeroFullBox("pitm", u16(1)), iinf([infeV2(1, "iden")])), limits, "heif", allGroups);
      assertBounded(result);
      expect(result.warnings.length).toBeGreaterThan(0);
      assertMaterialized(await materializeHeifMetadata(readerFor(container(referenceBox, zeroFullBox("pitm", u16(1)), iinf([infeV2(1, "iden")]))), limits, metadataGroups));
    }
  });

  it("covers extended, zero-sized, duplicate, budget, and top-level range outcomes", async () => {
    const xmp = encoder.encode("<x:xmpmeta xmlns:x=\"adobe:ns:meta/\"/>");
    const exif = Uint8Array.from([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0]);
    const topLevel = concat(ftyp(), box("Exif", exif), box("xml ", xmp));
    assertMaterialized(await materializeHeifMetadata(readerFor(topLevel), limits, allGroups));
    assertMaterialized(await materializeHeifMetadata(readerFor(topLevel), limits, resolveSelection({ groups: ["EXIF"] })));
    assertMaterialized(await materializeHeifMetadata(readerFor(topLevel), limits, resolveSelection({ groups: ["XMP"] })));
    expect(await materializeHeifMetadata(readerFor(concat(ftyp(), box("moov", new Uint8Array()))), limits, allGroups)).toBeNull();
    expect(await materializeHeifMetadata(readerFor(concat(ftyp(), box("meta", new Uint8Array(4)), box("free", new Uint8Array()))), limits, allGroups)).not.toBeNull();
    expect(await materializeHeifMetadata(readerFor(concat(ftyp(), box("meta", new Uint8Array(4)), box("free", new Uint8Array()), box("free", new Uint8Array()))), resolveLimits({ ...limits, maxSegments: 1 }), allGroups)).toBeNull();
    expect(await materializeHeifMetadata(readerFor(concat(ftyp(), extendedBox("meta", new Uint8Array(4)))), limits, allGroups)).not.toBeNull();
    expect(await materializeHeifMetadata(readerFor(concat(ftyp(), concat(u32(0), encoder.encode("free")))), limits, allGroups)).not.toBeNull();
    expect(await materializeHeifMetadata(readerFor(concat(ftyp(), u32(1), encoder.encode("free"))), limits, allGroups)).toBeNull();
    expect(await materializeHeifMetadata(readerFor(concat(box("meta", new Uint8Array(4)))), limits, allGroups)).toBeNull();

    const duplicateIloc = container(iinf([infeV2(1, "Exif")]), ilocOne({ id: 1 }), ilocOne({ id: 1 }));
    expect(await materializeHeifMetadata(readerFor(duplicateIloc), limits, metadataGroups)).toBeNull();
    expect(await materializeHeifMetadata(readerFor(concat(ftyp(), box("meta", new Uint8Array(4)))), limits, allGroups)).not.toBeNull();
    expect(await materializeHeifMetadata(readerFor(container(iinf([infeV2(1, "Exif")]), ilocOne({ id: 1, length: 100000 }))), resolveLimits({ ...limits, maxSegmentBytes: 16 }), metadataGroups)).toBeNull();

    const dimensions = [
      new Uint8Array(),
      box("ispe", new Uint8Array(4)),
      box("ispe", concat(Uint8Array.of(0, 0, 0, 0), u32(0), u32(1))),
      concat(u32(1), encoder.encode("ispe"), u64(16), Uint8Array.of(0, 0, 0, 0)),
      concat(u32(0), encoder.encode("free")),
      concat(u32(8), encoder.encode("free")),
    ];
    for (const input of dimensions) expect(parseHeifDimensions(input, 0, 1)).toBeNull();
    const aborted = new AbortController();
    aborted.abort();
    expect(() => parseHeifDimensions(ftyp(), 2, 16, aborted.signal)).toThrow(/abort/i);
  });
});
