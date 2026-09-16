import { describe, expect, it } from "vitest";

import { parseHeif, parseHeifDimensions } from "../src/parsers/heif.js";
import { materializeHeifMetadata } from "../src/heif-range.js";
import { resolveSelection } from "../src/selection.js";
import { resolveLimits } from "../src/security/limits.js";
import type { BlobReader } from "../src/input.js";

const encoder = new TextEncoder();

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

function fullBox(type: string, payload: Uint8Array, version = 0, flags = 0): Uint8Array {
  return box(type, Uint8Array.of(version, (flags >>> 16) & 0xff, (flags >>> 8) & 0xff, flags & 0xff), payload);
}

function infe(id: number, type: string, contentType?: string, hidden = false): Uint8Array {
  const name = encoder.encode(`${type}-${id}\0`);
  const content = contentType === undefined ? new Uint8Array() : encoder.encode(`${contentType}\0`);
  const payload = concat(
    Uint8Array.of(2, 0, 0, hidden ? 1 : 0),
    u16(id),
    u16(0),
    encoder.encode(type),
    name,
    content,
  );
  return box("infe", payload);
}

function infeV3(id: number, type: string, name: string, contentType?: string, contentEncoding?: string, hidden = false): Uint8Array {
  const nameBytes = encoder.encode(`${name}\0`);
  const contentTypeBytes = contentType === undefined ? new Uint8Array() : encoder.encode(`${contentType}\0`);
  const contentEncodingBytes = contentEncoding === undefined ? new Uint8Array() : encoder.encode(`${contentEncoding}\0`);
  const payload = concat(
    Uint8Array.of(3, 0, 0, hidden ? 1 : 0),
    u32(id),
    u16(0),
    encoder.encode(type),
    nameBytes,
    contentTypeBytes,
    contentEncodingBytes,
  );
  return box("infe", payload);
}

function iinf(infos: readonly Uint8Array[], version: 0 | 1 = 0): Uint8Array {
  return version === 0
    ? fullBox("iinf", concat(u16(infos.length), ...infos))
    : fullBox("iinf", concat(u32(infos.length), ...infos), 1);
}

interface Location {
  readonly id: number;
  readonly method: 0 | 1 | 2;
  readonly dataReferenceIndex?: number;
  readonly index?: number;
  readonly offset: number;
  readonly length: number;
}

function iloc(locations: readonly Location[], version: 0 | 1 | 2 = 1, sizes: { readonly offset: 4 | 8; readonly length: 4 | 8; readonly base?: 0 | 4 | 8; readonly index?: 0 | 4 | 8 } = { offset: 4, length: 4, base: 0, index: version === 0 ? 0 : 4 }): Uint8Array {
  const offsetSize = sizes.offset;
  const lengthSize = sizes.length;
  const baseSize = sizes.base ?? 0;
  const indexSize = version === 0 ? 0 : sizes.index ?? 4;
  const payload: number[] = [version, 0, 0, 0, (offsetSize << 4) | lengthSize, (indexSize << 4) | baseSize];
  if (version === 1) payload.push((locations.length >>> 8) & 0xff, locations.length & 0xff);
  else payload.push(...u32(locations.length));
  const sizedValue = (value: number, size: 0 | 4 | 8): number[] => size === 0 ? [] : size === 4 ? [...u32(value)] : [...u64(value)];
  for (const location of locations) {
    payload.push(...(version === 1 ? u16(location.id) : u32(location.id)));
    if (version >= 1) payload.push(...u16(location.method));
    payload.push(...u16(location.dataReferenceIndex ?? 0));
    payload.push(...sizedValue(0, baseSize));
    payload.push(...u16(1));
    if (indexSize > 0) payload.push(...sizedValue(location.index ?? 1, indexSize));
    payload.push(...sizedValue(location.offset, offsetSize));
    payload.push(...sizedValue(location.length, lengthSize));
  }
  return box("iloc", Uint8Array.from(payload));
}

function ipma(itemId: number, propertyIndexes: readonly number[], version = 0, wide = false): Uint8Array {
  const flags = wide ? 1 : 0;
  const payload = version === 0
    ? concat(Uint8Array.of(version, 0, 0, flags), u32(1), u16(itemId), Uint8Array.of(propertyIndexes.length), ...(wide ? propertyIndexes.map((index) => u16(index | 0x8000)) : [Uint8Array.from(propertyIndexes.map((index) => index | 0x80))]))
    : concat(Uint8Array.of(version, 0, 0, flags), u32(1), u32(itemId), Uint8Array.of(propertyIndexes.length), ...propertyIndexes.map((index) => u16(index | 0x8000)));
  return box("ipma", payload);
}

function ispe(width: number, height: number): Uint8Array {
  return box("ispe", concat(Uint8Array.of(0, 0, 0, 0), u32(width), u32(height)));
}

function colrNclx(fullRange: boolean): Uint8Array {
  return box("colr", concat(encoder.encode("nclx"), u16(1), u16(13), u16(6), Uint8Array.of(fullRange ? 0x80 : 0)));
}

function auxiliary(): Uint8Array {
  return box("auxC", concat(encoder.encode("urn:example:alpha\0"), u32(7), u32(9)));
}

function gridDescriptor(): Uint8Array {
  return Uint8Array.of(0, 0, 0, 1, 0, 2, 0, 2);
}

function overlayDescriptor(): Uint8Array {
  return Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 4, 0, 3, 0xff, 0xfe);
}

function reference(type: string, from: number, targets: readonly number[]): Uint8Array {
  return box(type, concat(u16(from), u16(targets.length), ...targets.map(u16)));
}

function referenceV1(type: string, from: number, targets: readonly number[]): Uint8Array {
  return box(type, concat(u32(from), u16(targets.length), ...targets.map(u32)));
}

function iref(references: readonly Uint8Array[], version: 0 | 1 = 0): Uint8Array {
  return box("iref", concat(Uint8Array.of(version, 0, 0, 0), ...references));
}

function dref(): Uint8Array {
  const selfContained = fullBox("url ", new Uint8Array(), 0, 1);
  const external = fullBox("urn ", encoder.encode("https://example.invalid/resource\0"));
  return box("dinf", box("dref", concat(Uint8Array.of(0, 0, 0, 0), u32(2), selfContained, external)));
}

function makeFixture(options: { readonly itemOffset?: boolean; readonly extended?: boolean; readonly malformedColour?: boolean; readonly gridReferences?: boolean; readonly infoVersion?: 0 | 1; readonly infoV3?: boolean; readonly referenceVersion?: 0 | 1; readonly locationVersion?: 0 | 1 | 2; readonly wideLocations?: boolean } = {}): Uint8Array {
  const xmp = encoder.encode("<x:xmpmeta xmlns:x=\"adobe:ns:meta/\"><rdf:RDF/></x:xmpmeta>");
  const exif = Uint8Array.from([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 0, 0, 0, 0]);
  const grid = gridDescriptor();
  const overlay = overlayDescriptor();
  const payload = concat(xmp, exif, grid, overlay, Uint8Array.of(1, 2, 3, 4));
  const properties = box("iprp", box("ipco", ispe(640, 480), options.malformedColour ? box("colr", encoder.encode("nclx\0")) : colrNclx(true), auxiliary()), ipma(1, [1, 2, 3], 0, true));
  const infos = iinf([
    options.infoV3 ? infeV3(1, "grid", "grid-item") : infe(1, "grid"),
    options.infoV3 ? infeV3(2, "av01", "image-item", undefined, undefined, true) : infe(2, "av01", undefined, true),
    options.infoV3 ? infeV3(3, "mime", "xmp-item", "application/rdf+xml") : infe(3, "mime", "application/rdf+xml"),
    options.infoV3 ? infeV3(4, "Exif", "exif-item") : infe(4, "Exif"),
    options.infoV3 ? infeV3(5, "iovl", "overlay-item") : infe(5, "iovl"),
  ], options.infoVersion ?? 1);
  const referenceVersion = options.referenceVersion ?? 0;
  const references = referenceVersion === 1
    ? [referenceV1("dimg", 1, options.gridReferences ? [2, 3] : [2]), referenceV1("cdsc", 3, [1]), referenceV1("iloc", 5, [1])]
    : [reference("dimg", 1, options.gridReferences ? [2, 3] : [2]), reference("cdsc", 3, [1]), reference("iloc", 5, [1])];
  const children = [
    new Uint8Array(4),
    fullBox("pitm", u16(1)),
    infos,
    iref(references, referenceVersion),
    dref(),
    box("idat", grid),
    properties,
    iloc([
      { id: 1, method: 1, offset: 0, length: grid.length },
      { id: 3, method: 0, offset: 0, length: xmp.length },
      { id: 4, method: 0, dataReferenceIndex: 1, offset: 0, length: exif.length },
      { id: 5, method: 2, index: 1, offset: 0, length: overlay.length },
    ]),
  ];
  const ftyp = box("ftyp", concat(encoder.encode("heic"), u32(0), encoder.encode("mif1")));
  const provisionalMeta = box("meta", ...children);
  const dataOffset = ftyp.length + provisionalMeta.length + 8;
  const correctedChildren = children.slice();
  correctedChildren[correctedChildren.length - 1] = iloc([
    { id: 1, method: 1, offset: 0, length: grid.length },
    { id: 3, method: 0, offset: dataOffset, length: xmp.length },
    { id: 4, method: 0, dataReferenceIndex: 1, offset: dataOffset + xmp.length, length: exif.length },
    { id: 5, method: 2, index: 1, offset: 0, length: overlay.length },
    ], options.locationVersion ?? 1, options.wideLocations ? { offset: 8, length: 8, base: 8, index: 8 } : undefined);
  const meta = options.extended ? extendedBox("meta", concat(...correctedChildren)) : box("meta", ...correctedChildren);
  return concat(ftyp, meta, box("mdat", payload));
}

function readerFor(bytes: Uint8Array): BlobReader {
  let bytesRead = 0;
  return {
    size: bytes.length,
    read: (start, end) => {
      bytesRead += end - start;
      return Promise.resolve(bytes.slice(start, end));
    },
    bytesRead: () => bytesRead,
    telemetry: () => ({ readRequests: 0, bytesRead, cacheHits: 0, coalescedReads: 0, cacheBytes: 0 }),
  };
}

const limits = resolveLimits({
  maxInputBytes: 64 * 1024,
  maxMetadataBytes: 32 * 1024,
  maxSegmentBytes: 16 * 1024,
  maxValueBytes: 16 * 1024,
  maxStringBytes: 16 * 1024,
  maxIfdEntries: 64,
  maxSegments: 128,
  maxWarnings: 64,
});

describe("S06 valid HEIF item-graph structure matrix", () => {
  it("keeps every metadata-family projection bounded across HEIF and AVIF labels", () => {
    const input = makeFixture({ infoV3: true, referenceVersion: 1, locationVersion: 2, wideLocations: true, extended: true });
    const selections = [
      resolveSelection(undefined),
      resolveSelection({ groups: ["Dimensions"] }),
      resolveSelection({ groups: ["EXIF"] }),
      resolveSelection({ groups: ["XMP"] }),
      resolveSelection({ groups: ["ICC"] }),
      resolveSelection({ groups: [] }),
    ];
    for (const format of ["heif", "avif", "cr3"] as const) {
      for (const selection of selections) {
        const result = parseHeif(input, limits, format, selection);
        expect(result.format).toBe(format);
        expect(result.fields.length).toBeLessThanOrEqual(limits.maxAdapterItems);
        expect(result.blocks?.length ?? 0).toBeLessThanOrEqual(limits.maxAdapterItems);
        expect(result.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
        expect(result.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
      }
    }
  });

  it("decodes file, idat, item-offset, versioned, derived, property, and reference paths", async () => {
    for (const options of [{}, { itemOffset: true }, { extended: true }, { malformedColour: true }] as const) {
      const input = makeFixture(options);
      const result = parseHeif(input, limits, "heif", resolveSelection(undefined));
      expect(result.fields).toBeInstanceOf(Array);
      expect(result.heif).toBeInstanceOf(Array);
      expect(result.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
      expect(result.heif?.[0]?.items.length).toBeGreaterThan(0);
      expect(parseHeifDimensions(input)).toEqual({ width: 640, height: 480 });
      const materialized = await materializeHeifMetadata(readerFor(input), limits, resolveSelection(undefined));
      expect(materialized === null || materialized.bytes.length <= limits.maxMetadataBytes).toBe(true);
    }
    for (const options of [
      { infoVersion: 0 as const },
      { infoVersion: 1 as const, infoV3: true },
      { referenceVersion: 1 as const },
      { locationVersion: 2 as const },
      { locationVersion: 1 as const, wideLocations: true },
    ]) {
      const input = makeFixture(options);
      const result = parseHeif(input, limits, "heif", resolveSelection(undefined));
      expect(result.heif?.[0]?.items.length, JSON.stringify(options)).toBeGreaterThan(0);
      expect(result.warnings.filter(({ severity }) => severity === "error"), JSON.stringify(options)).toEqual([]);
      const materialized = await materializeHeifMetadata(readerFor(input), limits, resolveSelection(undefined));
      expect(materialized?.bytes.length ?? 0, JSON.stringify(options)).toBeGreaterThan(0);
    }
  });

  it("materializes every metadata item-location representation through each selection", async () => {
    const variants = [
      makeFixture({ infoVersion: 0, locationVersion: 0 }),
      makeFixture({ infoVersion: 1, infoV3: true, referenceVersion: 1, locationVersion: 1, wideLocations: true }),
      makeFixture({ infoVersion: 1, infoV3: true, referenceVersion: 1, locationVersion: 2, wideLocations: true, extended: true, gridReferences: true }),
    ];
    const selections = [
      resolveSelection(undefined),
      resolveSelection({ groups: ["EXIF"] }),
      resolveSelection({ groups: ["XMP"] }),
      resolveSelection({ groups: [] }),
    ];
    for (const [variantIndex, input] of variants.entries()) {
      for (const selection of selections) {
        const materialized = await materializeHeifMetadata(readerFor(input), limits, selection);
        if (materialized === null) {
          expect(variantIndex).toBe(0);
          continue;
        }
        expect(materialized.partial).toBe(true);
        expect(materialized.bytes.length).toBeGreaterThan(0);
        expect(materialized.bytes.length).toBeLessThanOrEqual(limits.maxMetadataBytes);
        expect(materialized.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
      }
    }
  });

  it("retains stable diagnostics for malformed and over-limit graph variants", () => {
    const input = makeFixture();
    const mutations = [
      input.slice(0, 12),
      input.slice(0, -1),
      Uint8Array.from([...input.slice(0, 24), 0xff, ...input.slice(25)]),
      makeFixture({ malformedColour: true }),
      makeFixture({ itemOffset: true }).slice(0, 64),
    ];
    for (const value of mutations) {
      const result = parseHeif(value, resolveLimits({ ...limits, maxSegments: 2, maxIfdDepth: 1, maxWarnings: 8 }), "avif", resolveSelection(undefined));
      expect(result.warnings.length).toBeLessThanOrEqual(8);
      expect(result.warnings.every(({ code, offset, length }) => /^[A-Z][A-Z0-9_]+$/u.test(code) && (offset === undefined || (Number.isSafeInteger(offset) && offset >= 0)) && (length === undefined || (Number.isSafeInteger(length) && length >= 0)))).toBe(true);
    }
  });

  it("covers standalone dimension scanner limits, box widths, and disagreement failures", () => {
    expect(parseHeifDimensions(new Uint8Array(), 0, 0)).toBeNull();
    expect(parseHeifDimensions(box("ispe", new Uint8Array(4)))).toBeNull();
    expect(parseHeifDimensions(box("ispe", concat(Uint8Array.of(0, 0, 0, 0), u32(0), u32(2))))).toBeNull();
    expect(parseHeifDimensions(concat(ispe(10, 20), ispe(10, 21)))).toBeNull();
    expect(parseHeifDimensions(Uint8Array.from([0, 0, 0, 4, 0x66, 0x72, 0x65, 0x65]))).toBeNull();
    expect(parseHeifDimensions(Uint8Array.from([0, 0, 0, 1, 0x66, 0x72, 0x65, 0x65]))).toBeNull();
    expect(parseHeifDimensions(extendedBox("ispe", concat(Uint8Array.of(0, 0, 0, 0), u32(10), u32(20))))).toEqual({ width: 10, height: 20 });
    expect(parseHeifDimensions(Uint8Array.from([0, 0, 0, 1, 0x69, 0x73, 0x70, 0x65, 0, 0, 0, 0, 0, 0, 0, 32]))).toBeNull();
    expect(parseHeifDimensions(box("meta", new Uint8Array()))).toBeNull();
    expect(parseHeifDimensions(box("meta", new Uint8Array(4)), 0)).toBeNull();
    expect(parseHeifDimensions(concat(ispe(10, 20), ispe(10, 20)), 8, 1)).toBeNull();
  });

  it("covers metadata range headers, item-info variants, location encodings, and selection paths", async () => {
    const ftyp = box("ftyp", concat(encoder.encode("heic"), u32(0), encoder.encode("mif1")));
    const container = (...children: readonly Uint8Array[]): Uint8Array => concat(ftyp, box("meta", concat(new Uint8Array(4), ...children)));
    const materialize = (input: Uint8Array, selection = resolveSelection(undefined), overrides: Partial<typeof limits> = {}) => materializeHeifMetadata(readerFor(input), resolveLimits({ ...limits, ...overrides }), selection);

    for (const child of [
      box("iinf", new Uint8Array()),
      box("iinf", Uint8Array.of(0, 0, 0, 0, 0, 1)),
      box("iinf", Uint8Array.of(2, 0, 0, 0, 0, 0)),
      iinf([box("infe", Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 0))]),
    ]) {
      expect(await materialize(container(child))).toBeNull();
    }
    expect(await materialize(container(iinf([infe(1, "mime", "application/rdf+xml")])))).not.toBeNull();

    const missingLocation = await materialize(container(iinf([infe(1, "Exif")])), resolveSelection({ groups: ["EXIF"] }));
    expect(missingLocation).not.toBeNull();
    expect(missingLocation?.bytes).toBeInstanceOf(Uint8Array);
    const noGroups = await materialize(container(iinf([infe(1, "Exif")])), resolveSelection({ groups: [] }));
    expect(noGroups).not.toBeNull();
    expect(noGroups?.bytes.some((value) => value === 0x6d)).toBe(true);

    const invalidIloc = [
      box("iloc", Uint8Array.of(3, 0, 0, 0, 0, 0, 0, 0)),
      box("iloc", Uint8Array.of(1, 0, 0, 0, 0x30, 0x00, 0, 1)),
      box("iloc", Uint8Array.of(1, 0, 0, 0, 0x44, 0x40, 0, 1, 0, 0, 0x10, 0, 0, 0, 0, 1)),
      box("iloc", Uint8Array.of(1, 0, 0, 0, 0x44, 0x40, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1)),
    ];
    for (const child of invalidIloc) expect(await materialize(container(iinf([infe(1, "Exif")]), child), resolveSelection({ groups: ["EXIF"] }))).toBeNull();

    const malformedReferences = [
      box("iref", new Uint8Array()),
      box("iref", Uint8Array.of(2, 0, 0, 0)),
      box("iref", Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 8)),
      box("dinf", Uint8Array.of(1)),
      box("dinf", box("dref", Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 1))),
    ];
    for (const child of malformedReferences) expect(await materialize(container(iinf([infe(1, "Exif")]), child), resolveSelection({ groups: ["EXIF"] }))).toBeNull();

    const selectedTopLevel = concat(
      ftyp,
      box("Exif", Uint8Array.of(0x49, 0x49, 0x2a, 0, 8, 0, 0, 0)),
      box("xml ", encoder.encode("<x:xmpmeta/>")),
    );
    expect(await materializeHeifMetadata(readerFor(selectedTopLevel), resolveLimits(), resolveSelection({ groups: ["EXIF"] }))).not.toBeNull();
    expect(await materializeHeifMetadata(readerFor(selectedTopLevel), resolveLimits(), resolveSelection({ groups: ["XMP"] }))).not.toBeNull();
    expect(await materializeHeifMetadata(readerFor(selectedTopLevel), resolveLimits(), resolveSelection({ groups: [] }))).not.toBeNull();
    expect(await materializeHeifMetadata(readerFor(concat(ftyp, box("moov", new Uint8Array()))), resolveLimits(), resolveSelection(undefined))).toBeNull();
    expect(await materializeHeifMetadata(readerFor(concat(ftyp, box("free", new Uint8Array()))), resolveLimits(), resolveSelection(undefined))).not.toBeNull();
    expect(await materializeHeifMetadata(readerFor(concat(ftyp, box("free", new Uint8Array()), box("free", new Uint8Array()))), resolveLimits({ maxSegments: 2 }), resolveSelection(undefined))).toBeNull();
  });

  it("exercises versioned item graphs, property alternatives, references, and fail-closed resolution", () => {
    const ftyp = box("ftyp", concat(encoder.encode("heic"), u32(0), encoder.encode("mif1")));
    const container = (...children: readonly Uint8Array[]): Uint8Array => concat(ftyp, box("meta", concat(new Uint8Array(4), ...children)));
    const infos = iinf([
      infeV3(70000, "mime", "metadata", "application/rdf+xml", "identity"),
      infeV3(70001, "iden", "identity", undefined, undefined, true),
      infe(2, "auxl"),
      infe(3, "unknown"),
    ], 1);
    const properties = box("iprp",
      box("ipco",
        ispe(320, 240),
        box("colr", concat(encoder.encode("prof"), Uint8Array.of(1, 2, 3))),
        box("colr", concat(encoder.encode("rICC"), Uint8Array.of(4, 5))),
        auxiliary(),
        box("irot", Uint8Array.of(3)),
        box("imir", Uint8Array.of(1)),
        box("zzzz", Uint8Array.of(9)),
      ),
      ipma(70000, [1, 2, 3, 4, 5, 6], 1, true),
    );
    const references = iref([
      referenceV1("dimg", 70000, [70001]),
      referenceV1("thmb", 70000, [2]),
      referenceV1("auxl", 70000, [2]),
      referenceV1("cdsc", 70000, [3]),
      referenceV1("xxxx", 70000, [99999]),
    ], 1);
    const dataReferences = box("dinf", box("dref", concat(
      Uint8Array.of(0, 0, 0, 0),
      u32(2),
      fullBox("url ", new Uint8Array(), 0, 1),
      box("zzzz", concat(Uint8Array.of(0, 0, 0, 0), encoder.encode("opaque"))),
    )));
    const invalidLocations = iloc([
      { id: 70000, method: 0, dataReferenceIndex: 2, offset: 0, length: 3 },
      { id: 70001, method: 1, offset: 0, length: 0 },
      { id: 2, method: 2, index: 2, offset: 0, length: 1 },
    ], 2);
    const input = container(fullBox("pitm", u32(70000), 1), infos, references, dataReferences, properties, invalidLocations, box("idat", Uint8Array.of(1, 2, 3)));
    const parsed = parseHeif(input, limits, "avif", resolveSelection(undefined));
    expect(parsed.heif?.[0]?.items.map(({ id }) => id)).toEqual(expect.arrayContaining([70000, 70001, 2, 3, 99999]));
    expect(parsed.heif?.[0]?.items.find(({ id }) => id === 70000)?.contentEncoding).toBe("identity");
    expect(parsed.heif?.[0]?.items.find(({ id }) => id === 70001)?.hidden).toBe(true);
    expect(parsed.heif?.[0]?.properties.map(({ type }) => type)).toEqual(expect.arrayContaining(["ispe", "colr", "auxC", "irot", "imir", "zzzz"]));
    expect(parsed.heif?.[0]?.dataReferences).toEqual(expect.arrayContaining([
      expect.objectContaining({ index: 1, type: "url", selfContained: true, resolvable: true }),
      expect.objectContaining({ index: 2, type: "unknown", selfContained: false, resolvable: false }),
    ]));
    expect(parsed.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "UNSAFE_OFFSET" }), expect.objectContaining({ code: "MALFORMED_HEIF" })]));

    const missingAssociation = parseHeif(container(fullBox("pitm", u16(1)), iinf([infe(1, "av01")]), ipma(1, [1])), limits, "heif", resolveSelection({ groups: ["Dimensions"] }));
    expect(missingAssociation.heif?.[0]?.items.find(({ id }) => id === 1)?.roles).toContain("primary");
    expect(missingAssociation.dimensions).toBeNull();

    const malformedProperties = container(
      box("iprp", box("ipco", box("auxC", Uint8Array.of(0, 0, 0, 0, 0xff)), box("colr", concat(encoder.encode("nclx"), new Uint8Array(3))), box("irot", new Uint8Array())), ipma(1, [0, 0x80])),
      box("iprp", box("ipco", ispe(1, 1)), ipma(1, [1])),
      iinf([infe(1, "av01")]),
      fullBox("pitm", u16(1)),
    );
    const malformed = parseHeif(malformedProperties, resolveLimits({ ...limits, maxSegments: 16, maxWarnings: 16 }), "heif", resolveSelection(undefined));
    expect(malformed.warnings.some(({ code }) => code === "MALFORMED_HEIF")).toBe(true);
    expect(malformed.warnings.length).toBeLessThanOrEqual(16);
  });

  it("retains successful derived descriptors, complete optional property values, and explicit unsupported locations", () => {
    const derived = parseHeif(makeFixture({ gridReferences: true }), limits, "heif", resolveSelection(undefined));
    const grid = derived.heif?.[0]?.items.find(({ type }) => type === "grid")?.derived;
    expect(grid).toMatchObject({ type: "grid", outputWidth: 2, outputHeight: 2, rows: 1, columns: 2, referenceCount: 2 });

    const unsupportedLocation = parseHeif(
      makeFixture(),
      resolveLimits({ ...limits, maxWarnings: 16 }),
      "heif",
      resolveSelection({ groups: ["Dimensions"] }),
    );
    expect(unsupportedLocation.heif?.[0]?.items.every(({ location }) => location === null || location.constructionMethod !== "unsupported")).toBe(true);

    const noPrimary = parseHeif(
      makeFixture().subarray(0, 20),
      limits,
      "heif",
      resolveSelection({ groups: ["Dimensions"] }),
    );
    expect(noPrimary.dimensions).toBeNull();
    expect(noPrimary.heif?.[0]?.primaryItemId ?? null).toBeNull();
  });

  it("covers the remaining bounded HEIF item-information, location, property, and reference alternatives", () => {
    const ftyp = box("ftyp", concat(encoder.encode("heic"), u32(0), encoder.encode("mif1")));
    const container = (...children: readonly Uint8Array[]): Uint8Array => concat(ftyp, box("meta", concat(new Uint8Array(4), ...children)));
    const parse = (...children: readonly Uint8Array[]) => parseHeif(container(...children), resolveLimits({ ...limits, maxWarnings: 32 }), "heif", resolveSelection(undefined));
    const malformed = (...children: readonly Uint8Array[]) => expect(parse(...children).warnings.some(({ code }) => code === "MALFORMED_HEIF" || code === "TRUNCATED_DATA" || code === "LIMIT_EXCEEDED")).toBe(true);

    malformed(fullBox("iinf", Uint8Array.of(2, 0, 0, 0, 0, 0)));
    malformed(fullBox("iinf", Uint8Array.of(0, 0, 0)));
    malformed(iinf([box("free", new Uint8Array())]));
    malformed(iinf([box("infe", Uint8Array.of(1, 0, 0, 0, 0, 0, 0, 0))]));
    malformed(iinf([box("infe", Uint8Array.of(2, 0, 0, 0, 0, 1, 0, 0, 0, 0))]));
    malformed(iinf([infe(1, "mime", "application/rdf+xml")]).slice(0, -1));
    const nonAsciiMime = concat(Uint8Array.of(2, 0, 0, 0, 0, 1, 0, 0), encoder.encode("mime"), encoder.encode("name\0"), Uint8Array.of(0xff, 0));
    malformed(iinf([box("infe", nonAsciiMime)]));
    const unterminatedName = concat(Uint8Array.of(2, 0, 0, 0, 0, 1, 0, 0), encoder.encode("mime"), encoder.encode("unterminated"));
    malformed(iinf([box("infe", unterminatedName)]));

    malformed(box("iloc", Uint8Array.of(3, 0, 0, 0, 0, 0, 0, 0)));
    const reservedV0 = iloc([{ id: 1, method: 0, offset: 0, length: 1 }], 0);
    reservedV0[13] = 0x10;
    malformed(reservedV0);
    malformed(iloc([{ id: 0, method: 0, offset: 0, length: 1 }]));
    const reservedMethod = iloc([{ id: 1, method: 0, offset: 0, length: 1 }]);
    reservedMethod[18] = 0x10;
    malformed(reservedMethod);
    const zeroIndex = iloc([{ id: 1, method: 0, index: 0, offset: 0, length: 1 }]);
    malformed(zeroIndex);
    malformed(iloc([{ id: 1, method: 0, offset: 0, length: 1 }, { id: 1, method: 0, offset: 0, length: 1 }]));
    malformed(box("iloc", Uint8Array.of(1, 0, 0, 0, 0x11, 0x11, 0, 1)));
    malformed(iloc([{ id: 1, method: 0, offset: 0, length: 1 }]).slice(0, -1));

    malformed(box("dref", new Uint8Array(4)));
    malformed(box("dref", Uint8Array.of(1, 0, 0, 0, 0, 0, 0, 0)));
    malformed(box("dref", concat(Uint8Array.of(0, 0, 0, 0), u32(1), u32(4), encoder.encode("free"))));
    const extraDref = box("dinf", box("dref", concat(Uint8Array.of(0, 0, 0, 0), u32(1), fullBox("url ", new Uint8Array(), 0, 1), Uint8Array.of(1))));
    malformed(extraDref);

    const validProperties = box("iprp",
      box("ipco", ispe(16, 8), colrNclx(false), auxiliary(), box("irot", Uint8Array.of(1)), box("imir", Uint8Array.of(1)), box("prof", Uint8Array.of(1, 2, 3)), box("rICC", Uint8Array.of(4, 5))),
      ipma(1, [1, 2, 3, 4, 5, 6, 7], 1, true),
    );
    const validPropertiesResult = parse(validProperties, iinf([infe(1, "av01")]), fullBox("pitm", u16(1)));
    expect(validPropertiesResult.heif?.[0]?.properties.map(({ type }) => type)).toEqual(expect.arrayContaining(["ispe", "colr", "auxC", "irot", "imir", "prof", "rICC"]));
    expect(validPropertiesResult.transform).toMatchObject({ rotation: 90, mirrored: true, mirrorAxis: "horizontal" });
    expect(validPropertiesResult.nclx).toMatchObject({ fullRange: false });
    malformed(box("iprp", box("ipco", box("auxC", encoder.encode("aux\0\0\0")), box("colr", encoder.encode("nclx\0\0")), box("ispe", new Uint8Array(4))), ipma(1, [0])));
    malformed(box("iprp", box("ipco", ispe(1, 1)), ipma(1, [1]), ipma(1, [1])));
    const unknownProperty = parse(box("iprp", box("ipco", ispe(1, 1), box("zzzz", new Uint8Array())), ipma(1, [1])), iinf([infe(1, "av01")]), fullBox("pitm", u16(1)));
    expect(unknownProperty.heif?.[0]?.properties.map(({ type }) => type)).toContain("zzzz");

    malformed(iref([box("dimg", Uint8Array.of(0, 0, 0, 0))], 0));
    malformed(iref([box("dimg", Uint8Array.of(0, 0, 0, 0, 0, 1, 0))], 0));
    malformed(iref([extendedBox("dimg", Uint8Array.of(0, 0, 0, 0, 0, 1, 0))], 0));
    malformed(iref([box("dimg", concat(u16(1), u16(1), u16(0)))], 0));
    malformed(iref([box("dimg", concat(u16(1), u16(1), u16(2), u16(2), u16(3)))], 0));
    const validReferences = parse(iinf([infe(1, "av01"), infe(2, "av01")]), fullBox("pitm", u16(1)), iref([reference("thmb", 1, [2]), reference("auxl", 1, [2]), reference("cdsc", 1, [2]), reference("dimg", 1, [2]), reference("iloc", 1, [2])]), iloc([{ id: 1, method: 0, offset: 0, length: 1 }]));
    expect(validReferences.heif?.[0]?.relationships.map(({ type }) => type)).toEqual(expect.arrayContaining(["thumbnail", "auxiliary", "describes", "derived", "item-offset"]));

    const direct = parse(box("Exif", Uint8Array.from([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0])), box("Exif", Uint8Array.from([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0])), box("xml ", encoder.encode("<x:xmpmeta/>")), box("xml ", Uint8Array.of(0xff)));
    expect(direct.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "DUPLICATE_EXIF" }), expect.objectContaining({ code: "INVALID_VALUE" })]));
    expect(parseHeifDimensions(new Uint8Array(), -1, 1)).toBeNull();
    expect(parseHeifDimensions(new Uint8Array(), 1, 0)).toBeNull();
    const aborted = new AbortController(); aborted.abort();
    expect(() => parseHeif(makeFixture(), limits, "heif", resolveSelection(undefined), aborted.signal)).toThrow(/abort/i);
  });

  it("covers conflicting primary semantics, derived descriptors, duplicate containers, and bounded box-state failures", () => {
    const ftyp = box("ftyp", concat(encoder.encode("heic"), u32(0), encoder.encode("mif1")));
    const container = (...children: readonly Uint8Array[]): Uint8Array => concat(ftyp, box("meta", concat(new Uint8Array(4), ...children)));
    const manyProperties = box("iprp",
      box("ipco",
        ispe(10, 10), ispe(11, 10), colrNclx(true), colrNclx(false),
        box("prof", Uint8Array.of(1, 2)), box("rICC", Uint8Array.of(3, 4)),
        box("irot", Uint8Array.of(0)), box("irot", Uint8Array.of(1)),
        box("imir", Uint8Array.of(0)), box("imir", Uint8Array.of(1)),
        box("auxC", concat(encoder.encode("urn:example:aux\0"), u32(1))),
      ),
      ipma(1, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 1, true),
    );
    const conflict = parseHeif(container(fullBox("pitm", u32(1), 1), iinf([infe(1, "av01")], 1), manyProperties), limits, "heif", resolveSelection(undefined));
    expect(conflict.heif?.[0]?.properties.map(({ type }) => type)).toEqual(expect.arrayContaining(["ispe", "colr", "prof", "rICC", "irot", "imir", "auxC"]));
    expect(conflict.warnings.filter(({ code }) => code === "MALFORMED_HEIF").length).toBeGreaterThanOrEqual(3);
    expect(conflict.dimensions).toBeNull();
    expect(conflict.nclx ?? null).toBeNull();
    expect(conflict.icc ?? null).toBeNull();
    expect(conflict.transform ?? null).toBeNull();

    const duplicateContainers = parseHeif(container(
      iinf([infe(1, "iden")]),
      box("iprp", box("ipco", ispe(1, 1)), ipma(1, [1])),
      box("iprp", box("ipco", ispe(1, 1)), ipma(1, [1])),
      box("idat", Uint8Array.of(1)),
      box("idat", Uint8Array.of(2)),
      fullBox("pitm", u16(1)),
      box("iref", concat(Uint8Array.of(0, 0, 0, 0), extendedBox("dimg", concat(u16(1), u16(0))))),
    ), limits, "heif", resolveSelection(undefined));
    expect(duplicateContainers.warnings.filter(({ code }) => code === "MALFORMED_HEIF").length).toBeGreaterThan(0);

    const malformedReferences = parseHeif(container(
      iinf([infe(1, "iden")]),
      fullBox("pitm", u16(1)),
      box("iref", concat(Uint8Array.of(0, 0, 0, 0), extendedBox("dimg", concat(u16(1), u16(0))))),
      box("iref", concat(Uint8Array.of(0, 0, 0, 0), Uint8Array.of(0, 0, 0, 1, 0x64, 0x69, 0x6d, 0x67, 0, 0, 0, 0, 0, 1, 0))),
    ), resolveLimits({ ...limits, maxSegments: 4, maxWarnings: 16 }), "heif", resolveSelection(undefined));
    expect(malformedReferences.warnings.some(({ code }) => code === "MALFORMED_HEIF" || code === "TRUNCATED_DATA" || code === "LIMIT_EXCEEDED")).toBe(true);

    const deeplyNested = (depth: number): Uint8Array => depth === 0 ? box("ispe", concat(Uint8Array.of(0, 0, 0, 0), u32(1), u32(1))) : box("moov", deeplyNested(depth - 1));
    const deepResult = parseHeif(concat(ftyp, deeplyNested(10)), resolveLimits({ ...limits, maxIfdDepth: 2, maxWarnings: 8 }), "heif", resolveSelection(undefined));
    expect(deepResult.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
    const invalidPrimary = parseHeif(container(box("pitm", Uint8Array.of(1, 0, 0, 0, 0, 1))), limits, "heif", resolveSelection(undefined));
    expect(invalidPrimary.warnings.some(({ code }) => code === "MALFORMED_HEIF")).toBe(true);
  });
});
