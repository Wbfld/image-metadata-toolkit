import { describe, expect, it } from "vitest";

import { parseHeif, parseHeifDimensions } from "../src/parsers/heif.js";
import { resolveLimits } from "../src/security/limits.js";
import { resolveSelection } from "../src/selection.js";
import type { ParsedMetadataResult, SecurityLimits } from "../src/types.js";

const encoder = new TextEncoder();
const allGroups = resolveSelection({ groups: ["Dimensions", "EXIF", "XMP", "ICC"] });
const limits: SecurityLimits = resolveLimits({
  maxInputBytes: 256 * 1024,
  maxMetadataBytes: 32 * 1024,
  maxSegmentBytes: 16 * 1024,
  maxValueBytes: 16 * 1024,
  maxStringBytes: 256,
  maxWarnings: 64,
  maxSegments: 512,
  maxIfdEntries: 128,
  maxIfdDepth: 8,
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

function be16(value: number): Uint8Array {
  return Uint8Array.of((value >>> 8) & 0xff, value & 0xff);
}

function be32(value: number): Uint8Array {
  return Uint8Array.of((value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);
}

function be64(value: bigint): Uint8Array {
  const output = new Uint8Array(8);
  new DataView(output.buffer).setBigUint64(0, value, false);
  return output;
}

function box(type: string, payload: Uint8Array): Uint8Array {
  return concat(be32(payload.length + 8), encoder.encode(type), payload);
}

function fullBox(type: string, payload: Uint8Array, version = 0, flags = 0): Uint8Array {
  return box(type, concat(Uint8Array.of(version, (flags >>> 16) & 0xff, (flags >>> 8) & 0xff, flags & 0xff), payload));
}

function extendedBox(type: string, payload: Uint8Array): Uint8Array {
  return concat(be32(1), encoder.encode(type), be64(BigInt(payload.length + 16)), payload);
}

function toZeroSizedBox(type: string, payload: Uint8Array): Uint8Array {
  return concat(be32(0), encoder.encode(type), payload);
}

function infe(id: number, type: string, name: Uint8Array, version: 2 | 3 = 2, contentType?: Uint8Array, encoding?: Uint8Array, flags = 0): Uint8Array {
  const identity = version === 2
    ? concat(Uint8Array.of(2, (flags >>> 16) & 0xff, (flags >>> 8) & 0xff, flags & 0xff), be16(id), new Uint8Array(2))
    : concat(Uint8Array.of(3, (flags >>> 16) & 0xff, (flags >>> 8) & 0xff, flags & 0xff), be32(id), new Uint8Array(2));
  return box("infe", concat(identity, encoder.encode(type), name, contentType === undefined ? new Uint8Array() : concat(contentType, Uint8Array.of(0)), encoding === undefined ? new Uint8Array() : concat(encoding, Uint8Array.of(0))));
}

function iinf(infos: readonly Uint8Array[], version: 0 | 1 = 0): Uint8Array {
  return fullBox("iinf", concat(version === 0 ? be16(infos.length) : be32(infos.length), ...infos), version);
}

function iloc(options: {
  readonly version: 0 | 1 | 2;
  readonly id: number;
  readonly method?: number;
  readonly dataReferenceIndex?: number;
  readonly baseOffset?: number;
  readonly extentOffset?: number;
  readonly extentLength?: number;
  readonly extentIndex?: number;
  readonly offsetSize?: 0 | 4 | 8;
  readonly lengthSize?: 0 | 4 | 8;
  readonly baseOffsetSize?: 0 | 4 | 8;
  readonly indexSize?: 0 | 4 | 8;
  readonly extentCount?: number;
}): Uint8Array {
  const offsetSize = options.offsetSize ?? 4;
  const lengthSize = options.lengthSize ?? 4;
  const baseOffsetSize = options.baseOffsetSize ?? 0;
  const indexSize = options.version === 0 ? 0 : (options.indexSize ?? 0);
  const fieldSizes = Uint8Array.of((offsetSize << 4) | lengthSize, (indexSize << 4) | baseOffsetSize);
  const count = options.extentCount ?? 1;
  const itemId = options.version < 2 ? be16(options.id) : be32(options.id);
  const method = options.version === 0 ? new Uint8Array() : be16(options.method ?? 0);
  const base = options.baseOffsetSize === 8 ? be64(BigInt(options.baseOffset ?? 0)) : options.baseOffsetSize === 4 ? be32(options.baseOffset ?? 0) : new Uint8Array();
  const index = indexSize === 8 ? be64(BigInt(options.extentIndex ?? 1)) : indexSize === 4 ? be32(options.extentIndex ?? 1) : new Uint8Array();
  const offset = offsetSize === 8 ? be64(BigInt(options.extentOffset ?? 0)) : offsetSize === 4 ? be32(options.extentOffset ?? 0) : new Uint8Array();
  const length = lengthSize === 8 ? be64(BigInt(options.extentLength ?? 0)) : lengthSize === 4 ? be32(options.extentLength ?? 0) : new Uint8Array();
  const entry = concat(itemId, method, be16(options.dataReferenceIndex ?? 0), base, be16(count), ...Array.from({ length: count }, () => concat(index, offset, length)));
  return box("iloc", concat(Uint8Array.of(options.version, 0, 0, 0), fieldSizes, options.version < 2 ? be16(1) : be32(1), entry));
}

function dref(version = 0, references: readonly Uint8Array[] = []): Uint8Array {
  return box("dref", concat(Uint8Array.of(version, 0, 0, 0), be32(references.length), ...references));
}

function dataReference(type: string, flags = 1, payload = new Uint8Array()): Uint8Array {
  return box(type, concat(Uint8Array.of(0, (flags >>> 16) & 0xff, (flags >>> 8) & 0xff, flags & 0xff), payload));
}

function propertyAssociations(itemId: number, values: readonly number[], version = 0, wide = false): Uint8Array {
  const encoded = values.map((value) => wide ? be16(value) : Uint8Array.of(value & 0xff));
  const id = version === 0 ? be16(itemId) : be32(itemId);
  return fullBox("ipma", concat(be32(1), id, Uint8Array.of(values.length), ...encoded), version, wide ? 1 : 0);
}

function itemReference(type: string, from: number, targets: readonly number[], version = 0): Uint8Array {
  const id = version === 0 ? be16(from) : be32(from);
  const targetBytes = targets.map((target) => version === 0 ? be16(target) : be32(target));
  return box(type, concat(id, be16(targets.length), ...targetBytes));
}

function metaContainer(children: readonly Uint8Array[], trailing = new Uint8Array()): Uint8Array {
  const ftyp = box("ftyp", concat(encoder.encode("heic"), new Uint8Array(4), encoder.encode("mif1")));
  return concat(ftyp, box("meta", concat(new Uint8Array(4), ...children)), trailing);
}

function bounded(result: ParsedMetadataResult): void {
  expect(result.fields).toBeInstanceOf(Array);
  expect(result.blocks ?? []).toBeInstanceOf(Array);
  expect(result.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
  expect(result.fields.length).toBeLessThanOrEqual(limits.maxAdapterItems);
}

function completeGraph(): Uint8Array {
  const xmp = encoder.encode("<x:xmpmeta xmlns:x=\"adobe:ns:meta/\"><rdf:RDF/></x:xmpmeta>");
  const gridDescriptor = concat(Uint8Array.of(0, 0, 0, 0), be16(640), be16(480));
  const overlayDescriptor = concat(Uint8Array.of(0, 0, 0, 0), be16(640), be16(480), be16(1), be16(2));
  const properties = box("iprp", concat(
    box("ipco", concat(
      box("ispe", concat(new Uint8Array(4), be32(640), be32(480))),
      box("colr", concat(encoder.encode("nclx"), Uint8Array.of(0, 1, 0, 13, 0, 6, 0x80))),
      box("colr", concat(encoder.encode("prof"), Uint8Array.of(1, 2, 3))),
      box("colr", concat(encoder.encode("rICC"), Uint8Array.of(4, 5, 6))),
      box("auxC", concat(encoder.encode("urn:example:alpha\0"), be32(7), be32(8))),
      box("irot", Uint8Array.of(1)),
      box("imir", Uint8Array.of(0)),
      box("unknown", Uint8Array.of(1, 2, 3)),
    )),
    propertyAssociations(1, [1, 2, 3, 4, 5, 6, 7], 0),
    propertyAssociations(70000, [0x8001, 0x8002], 1, true),
  ));
  const idat = concat(xmp, gridDescriptor, overlayDescriptor, Uint8Array.of(1, 2, 3));
  return metaContainer([
    fullBox("pitm", be32(1), 1),
    iinf([
      infe(1, "av01", encoder.encode("primary\0"), 2, undefined, undefined, 1),
      infe(2, "mime", encoder.encode("xmp\0"), 3, encoder.encode("application/rdf+xml"), encoder.encode("gzip")),
      infe(3, "grid", encoder.encode("grid\0")),
      infe(4, "iovl", encoder.encode("overlay\0")),
      infe(5, "iden", encoder.encode("identity\0")),
    ], 1),
    properties,
    iloc({ version: 2, id: 2, method: 1, extentOffset: 0, extentLength: xmp.length, extentIndex: 1, indexSize: 4 }),
    iloc({ version: 1, id: 3, method: 1, extentOffset: xmp.length, extentLength: gridDescriptor.length }),
    iloc({ version: 1, id: 4, method: 1, extentOffset: xmp.length + gridDescriptor.length, extentLength: overlayDescriptor.length }),
    iloc({ version: 1, id: 5, method: 1, extentOffset: xmp.length + gridDescriptor.length + overlayDescriptor.length, extentLength: 0 }),
    box("iref", concat(new Uint8Array(4), itemReference("dimg", 3, [1]), itemReference("dimg", 4, [1]), itemReference("cdsc", 2, [1]), itemReference("thmb", 1, [5]), itemReference("auxl", 1, [4]))),
    box("idat", idat),
    box("dinf", dref(0, [dataReference("url ", 1), dataReference("urn ", 0), dataReference("zzzz", 1)])),
  ]);
}

describe("S06 HEIF standards and security completion matrix", () => {
  it("covers HEIF dimensions, full-box versions, derived items, properties, relationships, and conflicts", () => {
    const graph = completeGraph();
    const parsed = parseHeif(graph, limits, "heif", allGroups);
    bounded(parsed);
    expect(parsed.heif?.[0]?.items.map(({ type }) => type)).toEqual(expect.arrayContaining(["grid", "iovl", "iden"]));
    expect(parsed.heif?.[0]?.relationships).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "thumbnail" }),
      expect.objectContaining({ type: "auxiliary" }),
      expect.objectContaining({ type: "describes" }),
    ]));
    expect(parsed.heif?.[0]?.properties.length).toBeGreaterThan(0);

    const conflicting = concat(
      graph,
      box("meta", concat(new Uint8Array(4), fullBox("pitm", be16(1)), box("iprp", concat(box("ipco", box("ispe", concat(new Uint8Array(4), be32(1), be32(2)))), propertyAssociations(1, [1]))))),
    );
    const conflictResult = parseHeif(conflicting, limits, "heif", allGroups);
    bounded(conflictResult);
    expect(conflictResult.warnings.length).toBeGreaterThan(0);

    const dimensions = box("ispe", concat(new Uint8Array(4), be32(320), be32(200)));
    expect(parseHeifDimensions(metaContainer([dimensions]))).toEqual({ width: 320, height: 200 });
    expect(parseHeifDimensions(metaContainer([box("ispe", concat(new Uint8Array(4), be32(320), be32(200))), box("ispe", concat(new Uint8Array(4), be32(321), be32(200)))]))).toBeNull();
    expect(parseHeifDimensions(extendedBox("ispe", concat(new Uint8Array(4), be32(640), be32(480))))).toEqual({ width: 640, height: 480 });
    expect(parseHeifDimensions(toZeroSizedBox("ispe", concat(new Uint8Array(4), be32(640), be32(480))))).toEqual({ width: 640, height: 480 });
    expect(parseHeifDimensions(metaContainer([dimensions]), 0, 1)).toBeNull();
  });

  it("covers every iloc field width and bounded resolution outcome", () => {
    const payload = encoder.encode("<rdf:RDF/>");
    const variants = [
      iloc({ version: 0, id: 1, method: 0, extentOffset: 0, extentLength: 0 }),
      iloc({ version: 1, id: 1, method: 0, extentOffset: 0, extentLength: payload.length, offsetSize: 0, lengthSize: 0, baseOffsetSize: 0 }),
      iloc({ version: 1, id: 1, method: 0, extentOffset: 0, extentLength: payload.length, offsetSize: 4, lengthSize: 4, baseOffsetSize: 4, indexSize: 4, baseOffset: 0, extentIndex: 1 }),
      iloc({ version: 2, id: 70000, method: 1, extentOffset: 0, extentLength: payload.length, offsetSize: 8, lengthSize: 8, baseOffsetSize: 8, indexSize: 8, baseOffset: 0, extentIndex: 1 }),
      iloc({ version: 1, id: 1, method: 2, extentOffset: 0, extentLength: 1, indexSize: 4, extentIndex: 1 }),
      iloc({ version: 1, id: 1, method: 0, extentOffset: 0, extentLength: 1, extentCount: 2 }),
    ];
    for (const location of variants) bounded(parseHeif(metaContainer([iinf([infe(1, "mime", encoder.encode("x\0"), 2, encoder.encode("application/rdf+xml"))]), location, box("idat", payload)]), limits, "heif", allGroups));

    const malformed = [
      (() => { const value = iloc({ version: 1, id: 1 }); value[12] = 3; return value; })(),
      (() => { const value = iloc({ version: 1, id: 1 }); value[13] = 0xf0; return value; })(),
      (() => { const value = iloc({ version: 1, id: 1 }); value[14] = 0; value[15] = 0; return value; })(),
      iloc({ version: 1, id: 0, extentLength: 1 }),
      iloc({ version: 2, id: 70000, extentIndex: 0, extentLength: 1, indexSize: 4 }),
      box("iloc", Uint8Array.of(1, 0, 0, 0, 0x44)),
    ];
    for (const value of malformed) {
      const result = parseHeif(metaContainer([iinf([infe(1, "Exif", encoder.encode("x\0"))]), value, box("idat", payload)]), limits, "heif", allGroups);
      bounded(result);
      expect(result.warnings.length).toBeGreaterThan(0);
    }
  });

  it("covers item-information, data-reference, association, and reference diagnostics", () => {
    const goodMime = iinf([infe(1, "mime", encoder.encode("x\0"), 2, encoder.encode("application/rdf+xml"), encoder.encode("gzip"))]);
    const versionedMime = iinf([infe(70000, "mime", encoder.encode("x\0"), 3, encoder.encode("application/rdf+xml"))], 1);
    const malformedInfos = [
      box("iinf", Uint8Array.of(2, 0, 0, 0, 0, 0)),
      box("iinf", Uint8Array.of(0, 0, 0, 0, 0, 1)),
      box("iinf", concat(Uint8Array.of(0, 0, 0, 0, 0, 1), be32(8), encoder.encode("xxxx"))),
      box("iinf", concat(Uint8Array.of(0, 0, 0, 0, 0, 1), infe(1, "mime", encoder.encode("x\0"), 2, Uint8Array.of(0xff)))),
      box("iinf", concat(Uint8Array.of(0, 0, 0, 0, 0, 1), infe(1, "Exif", Uint8Array.of(0xff, 0)))),
    ];
    for (const info of [goodMime, versionedMime, ...malformedInfos]) bounded(parseHeif(metaContainer([info]), limits, "heif", allGroups));

    const references = [
      dref(1),
      dref(0, [box("url ", Uint8Array.of(0, 0, 0)), box("url ", Uint8Array.of(0, 0, 0, 1)), box("urn ", Uint8Array.of(0, 0, 0, 0)), box("zzzz", Uint8Array.of(0, 0, 0, 1))]),
      box("dref", concat(Uint8Array.of(0, 0, 0, 0), be32(1), be32(4), encoder.encode("url "))),
    ];
    for (const reference of references) bounded(parseHeif(metaContainer([box("dinf", reference)]), limits, "heif", allGroups));

    const associationVariants = [
      box("iprp", propertyAssociations(1, [1])),
      box("iprp", propertyAssociations(1, [0, 1])),
      box("iprp", propertyAssociations(1, [1], 1)),
      box("iprp", propertyAssociations(1, [0x8001], 1, true)),
      box("iprp", concat(propertyAssociations(1, [1]), propertyAssociations(1, [2]))),
      box("iprp", fullBox("ipma", concat(be32(0x1000), be32(1)), 0)),
    ];
    for (const association of associationVariants) bounded(parseHeif(metaContainer([association]), limits, "heif", allGroups));

    const referenceVariants = [
      box("iref", Uint8Array.of(2, 0, 0, 0)),
      box("iref", Uint8Array.of(0, 0, 1, 0)),
      box("iref", concat(new Uint8Array(4), itemReference("dimg", 0, [1]))),
      box("iref", concat(new Uint8Array(4), itemReference("dimg", 1, [0]))),
      box("iref", concat(new Uint8Array(4), box("dimg", concat(be16(1), be16(2), be16(1))))),
      box("iref", concat(new Uint8Array(4), extendedBox("dimg", concat(be16(1), be16(1), be16(2))))),
      box("iref", concat(new Uint8Array(4), toZeroSizedBox("dimg", concat(be16(1), be16(0))))),
    ];
    for (const reference of referenceVariants) bounded(parseHeif(metaContainer([reference]), limits, "heif", allGroups));
  });

  it("covers malformed HEIF containers, limits, opaque values, and direct metadata boxes", () => {
    const payload = encoder.encode("<x:xmpmeta xmlns:x=\"adobe:ns:meta/\"/>");
    const directExif = concat(Uint8Array.of(0, 0, 0, 0), Uint8Array.of(0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 0, 0, 0, 0));
    const cases = [
      metaContainer([box("xml ", payload), box("XMP ", Uint8Array.of(0xff)), box("Exif", directExif), box("exif", directExif)]),
      concat(encoder.encode("heic"), extendedBox("meta", new Uint8Array(3))),
      concat(encoder.encode("heic"), box("meta", new Uint8Array(3))),
      metaContainer([box("iprp", new Uint8Array(3)), box("iprp", new Uint8Array(3)), box("idat", payload), box("idat", payload)]),
      metaContainer([box("iref", new Uint8Array(4)), box("unknown", new Uint8Array(1))]),
      metaContainer([fullBox("pitm", new Uint8Array(1)), box("iinf", new Uint8Array(3)), box("iloc", new Uint8Array(3))]),
    ];
    for (const value of cases) {
      bounded(parseHeif(value, limits, "heif", allGroups));
      expect(parseHeifDimensions(value)).not.toEqual(expect.any(Error));
    }

    const deep = box("moov", box("trak", box("mdia", box("minf", box("stbl", box("meta", new Uint8Array(4)))))));
    const limited = parseHeif(metaContainer([deep]), resolveLimits({ ...limits, maxIfdDepth: 1 }), "heif", allGroups);
    bounded(limited);
    expect(limited.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);

    const many = metaContainer(Array.from({ length: 24 }, (_, index) => box("free", Uint8Array.of(index))));
    const boxLimited = parseHeif(many, resolveLimits({ ...limits, maxSegments: 4 }), "heif", allGroups);
    bounded(boxLimited);
    expect(boxLimited.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);

    const invalidColour = metaContainer([box("iprp", box("ipco", concat(
      box("colr", Uint8Array.of(0, 1, 2)),
      box("colr", concat(encoder.encode("nclx"), new Uint8Array(7).fill(0x7f))),
      box("auxC", Uint8Array.of(0, 1, 2, 3)),
    )))]);
    const invalidColourResult = parseHeif(invalidColour, limits, "heif", allGroups);
    bounded(invalidColourResult);
    expect(invalidColourResult.warnings.length).toBeGreaterThan(0);
  });

  it("exercises every bounded item-information, association, reference, and resolution rejection", () => {
    const payload = encoder.encode("<rdf:RDF/>");
    const malformedInfos = [
      box("iinf", Uint8Array.of(2, 0, 0, 0)),
      box("iinf", concat(Uint8Array.of(0, 0, 0, 0, 0, 1), be32(7), encoder.encode("infe"))),
      box("iinf", concat(Uint8Array.of(0, 0, 0, 0, 0, 1), be32(8), encoder.encode("xxxx"))),
      box("iinf", concat(Uint8Array.of(0, 0, 0, 0, 0, 1), box("infe", Uint8Array.of(2, 0, 0, 0)))),
      box("iinf", concat(Uint8Array.of(0, 0, 0, 0, 0, 1), box("infe", concat(Uint8Array.of(3, 0, 0, 0), be32(1), new Uint8Array(2))))),
      box("iinf", concat(Uint8Array.of(0, 0, 0, 0, 0, 1), box("infe", concat(Uint8Array.of(4, 0, 0, 0), be16(1), new Uint8Array(2), encoder.encode("av01"), Uint8Array.of(0))))),
      box("iinf", concat(Uint8Array.of(0, 0, 0, 0, 0, 1), infe(1, "mime", encoder.encode("x\0"), 2, Uint8Array.of(0xff)))),
      box("iinf", concat(Uint8Array.of(0, 0, 0, 0, 0, 1), infe(1, "mime", encoder.encode("x\0"), 2, encoder.encode("application/rdf+xml"), Uint8Array.of(0xff)))),
      box("iinf", concat(Uint8Array.of(0, 0, 0, 0, 0, 1), infe(1, "Exif", Uint8Array.of(0xff, 0)))),
      box("iinf", concat(Uint8Array.of(0, 0, 0, 0, 0, 1), infe(1, "av01", encoder.encode("unterminated")))),
    ];
    for (const value of malformedInfos) {
      const result = parseHeif(metaContainer([value]), limits, "heif", allGroups);
      bounded(result);
      expect(result.warnings.length).toBeGreaterThan(0);
    }

    const malformedLocations = [
      (() => { const value = iloc({ version: 1, id: 1 }); value[12] = 3; return value; })(),
      (() => { const value = iloc({ version: 1, id: 1 }); value[13] = 0xf0; return value; })(),
      (() => { const value = iloc({ version: 1, id: 1 }); value[14] = 0; value[15] = 0; return value; })(),
      iloc({ version: 1, id: 0, extentLength: 1 }),
      iloc({ version: 2, id: 70000, extentIndex: 0, extentLength: 1, indexSize: 4 }),
      iloc({ version: 1, id: 1, method: 3, extentLength: 1 }),
      iloc({ version: 1, id: 1, extentCount: 2, extentLength: 0 }),
      box("iloc", Uint8Array.of(1, 0, 0, 0, 0x44)),
    ];
    for (const value of malformedLocations) {
      const result = parseHeif(metaContainer([iinf([infe(1, "Exif", encoder.encode("x\0"))]), value, box("idat", payload)]), limits, "heif", allGroups);
      bounded(result);
      expect(result.warnings.length).toBeGreaterThan(0);
    }

    const referenceVariants = [
      box("iref", concat(Uint8Array.of(1, 0, 0, 0), itemReference("dimg", 70000, [1], 1))),
      box("iref", concat(Uint8Array.of(0, 0, 0, 0), extendedBox("dimg", concat(be16(1), be16(1), be16(2))))),
      box("iref", concat(Uint8Array.of(0, 0, 0, 0), toZeroSizedBox("dimg", concat(be16(1), be16(1), be16(2))))),
      box("iref", concat(Uint8Array.of(0, 0, 0, 0), box("dimg", concat(be16(1), be16(0), be16(2))))),
      box("iref", concat(Uint8Array.of(0, 0, 0, 0), box("dimg", concat(be16(1), be16(1), be16(2), be16(3))))),
    ];
    for (const value of referenceVariants) {
      const result = parseHeif(metaContainer([value, iinf([infe(1, "av01", encoder.encode("x\0"))])]), limits, "heif", allGroups);
      bounded(result);
      expect(result.warnings.length).toBeGreaterThan(0);
    }

    const conflictingTransforms = metaContainer([
      fullBox("pitm", be16(1)),
      iinf([infe(1, "av01", encoder.encode("x\0"))]),
      box("iprp", concat(box("ipco", concat(box("irot", Uint8Array.of(1)), box("irot", Uint8Array.of(2)))), propertyAssociations(1, [1, 2]))),
    ]);
    const transformResult = parseHeif(conflictingTransforms, limits, "heif", allGroups);
    bounded(transformResult);
    expect(transformResult.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));

    const external = parseHeif(metaContainer([
      iinf([infe(1, "mime", encoder.encode("x\0"), 2, encoder.encode("application/rdf+xml"))]),
      iloc({ version: 1, id: 1, dataReferenceIndex: 1, extentLength: payload.length }),
      box("dinf", dref(0, [dataReference("urn ", 0)])),
      box("idat", payload),
    ]), limits, "heif", allGroups);
    bounded(external);
    expect(external.heif?.[0]?.items.some(({ location }) => location?.resolution === "external")).toBe(true);
  });
});
