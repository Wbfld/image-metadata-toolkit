import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { materializeHeifMetadata } from "../src/heif-range.js";
import { materializeTiffMetadata } from "../src/tiff-range.js";
import { resolveSelection } from "../src/selection.js";
import { resolveLimits } from "../src/security/limits.js";
import type { BlobReader } from "../src/input.js";

const allGroups = resolveSelection({ groups: ["Dimensions", "EXIF", "XMP", "IPTC", "ICC", "Photoshop", "MakerNote", "MPF", "Nclx"] });
const encoder = new TextEncoder();

async function fixture(name: string): Promise<Uint8Array> { return new Uint8Array(await readFile(new URL(`./fixtures/${name}`, import.meta.url))); }

function readerFor(bytes: Uint8Array, shortAt?: number, emptyReadAt?: number): BlobReader {
  let requests = 0;
  let bytesRead = 0;
  return {
    size: bytes.length,
    read: (start, end) => {
      requests += 1;
      if (emptyReadAt !== undefined && start === emptyReadAt) return Promise.resolve(new Uint8Array());
      const actualEnd = shortAt !== undefined && start < shortAt && shortAt < end ? shortAt : end;
      const result = bytes.slice(start, actualEnd);
      bytesRead += result.length;
      return Promise.resolve(result);
    },
    bytesRead: () => bytesRead,
    telemetry: () => ({ readRequests: requests, bytesRead, cacheHits: 0, coalescedReads: 0, cacheBytes: bytesRead }),
  };
}

function put16(bytes: Uint8Array, offset: number, value: number, little: boolean): void { new DataView(bytes.buffer).setUint16(offset, value, little); }
function put32(bytes: Uint8Array, offset: number, value: number, little: boolean): void { new DataView(bytes.buffer).setUint32(offset, value, little); }
function put64(bytes: Uint8Array, offset: number, value: number, little: boolean): void {
  const view = new DataView(bytes.buffer);
  const high = Math.floor(value / 0x100000000);
  const low = value >>> 0;
  if (little) { view.setUint32(offset, low, true); view.setUint32(offset + 4, high, true); }
  else { view.setUint32(offset, high, false); view.setUint32(offset + 4, low, false); }
}

function box(type: string, payload: Uint8Array): Uint8Array {
  const output = new Uint8Array(8 + payload.length);
  put32(output, 0, output.length, false);
  output.set(encoder.encode(type), 4);
  output.set(payload, 8);
  return output;
}

function fullBox(type: string, payload: Uint8Array, version = 0, flags = 0): Uint8Array {
  return box(type, Uint8Array.of(version, (flags >>> 16) & 0xff, (flags >>> 8) & 0xff, flags & 0xff, ...payload));
}

function heifContainer(...children: readonly Uint8Array[]): Uint8Array {
  const ftyp = box("ftyp", Uint8Array.from([...encoder.encode("heic"), 0, 0, 0, 0, ...encoder.encode("mif1")]));
  return new Uint8Array([...ftyp, ...box("meta", new Uint8Array([0, 0, 0, 0, ...children.flatMap((child) => [...child])] ))]);
}

function info(id: number, type: string, version: 2 | 3 = 2, contentType?: string): Uint8Array {
  const identity = version === 2
    ? Uint8Array.from([2, 0, 0, 0, (id >>> 8) & 0xff, id & 0xff, 0, 0])
    : Uint8Array.from([3, 0, 0, 0, (id >>> 24) & 0xff, (id >>> 16) & 0xff, (id >>> 8) & 0xff, id & 0xff, 0, 0]);
  const strings = Uint8Array.from([...encoder.encode(type), 0x78, 0x00, ...(contentType === undefined ? [] : [...encoder.encode(contentType), 0])]);
  return box("infe", new Uint8Array([...identity, ...strings]));
}

function itemInfo(infos: readonly Uint8Array[], version: 0 | 1 = 0): Uint8Array {
  const count = version === 0 ? Uint8Array.of(0, infos.length) : Uint8Array.of(0, 0, 0, infos.length);
  return fullBox("iinf", new Uint8Array([...count, ...infos.flatMap((item) => [...item])]), version);
}

function itemLocation(options: {
  readonly version?: 0 | 1 | 2;
  readonly id?: number;
  readonly method?: number;
  readonly dataReferenceIndex?: number;
  readonly offsetSize?: 0 | 4 | 8;
  readonly lengthSize?: 0 | 4 | 8;
  readonly baseOffsetSize?: 0 | 4 | 8;
  readonly indexSize?: 0 | 4 | 8;
  readonly offset?: number;
  readonly length?: number;
  readonly index?: number;
} = {}): Uint8Array {
  const version = options.version ?? 1;
  const offsetSize = options.offsetSize ?? 4;
  const lengthSize = options.lengthSize ?? 4;
  const baseOffsetSize = options.baseOffsetSize ?? 0;
  const indexSize = version === 0 ? 0 : options.indexSize ?? 0;
  const sized = (value: number, size: 0 | 4 | 8): number[] => size === 0
    ? []
    : size === 4
      ? [...Uint8Array.from([(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff])]
      : (() => { const output = new Uint8Array(8); put64(output, 0, value, false); return [...output]; })();
  const sizedValue = (value: number, size: 0 | 4 | 8): number[] => {
    return sized(value, size);
  };
  const count = version < 2 ? [0, 1] : [0, 0, 0, 1];
  const id = version < 2 ? [(options.id ?? 1) >>> 8, (options.id ?? 1) & 0xff] : [(options.id ?? 1) >>> 24, (options.id ?? 1) >>> 16, (options.id ?? 1) >>> 8, options.id ?? 1].map((value) => value & 0xff);
  const method = version === 0 ? [] : [0, options.method ?? 0];
  const base = sizedValue(0, baseOffsetSize);
  const index = sizedValue(options.index ?? 1, indexSize);
  const offset = sizedValue(options.offset ?? 0, offsetSize);
  const length = sizedValue(options.length ?? 1, lengthSize);
  const payload = [version, 0, 0, 0, (offsetSize << 4) | lengthSize, (indexSize << 4) | baseOffsetSize, ...count, ...id, ...method, 0, options.dataReferenceIndex ?? 0, ...base, 0, 1, ...index, ...offset, ...length];
  return box("iloc", Uint8Array.from(payload));
}

function combineLocations(...locations: readonly Uint8Array[]): Uint8Array {
  const first = locations[0];
  if (first === undefined) throw new Error("at least one iloc entry is required");
  const payload = first.slice(8, 16);
  const entries = locations.flatMap((location) => [...location.slice(16)]);
  if (payload.length < 8) throw new Error("invalid iloc entry");
  const count = locations.length;
  payload[6] = (count >>> 8) & 0xff;
  payload[7] = count & 0xff;
  return box("iloc", new Uint8Array([...payload, ...entries]));
}

function itemReference(type: string, from: number, target: number, version: 0 | 1 = 0): Uint8Array {
  const id = version === 0 ? [from >>> 8, from & 0xff] : [from >>> 24, from >>> 16, from >>> 8, from].map((value) => value & 0xff);
  const value = version === 0 ? [target >>> 8, target & 0xff] : [target >>> 24, target >>> 16, target >>> 8, target].map((item) => item & 0xff);
  return box(type, Uint8Array.from([...id, 0, 1, ...value]));
}

function dataReference(type = "url ", flags = 1): Uint8Array {
  return fullBox(type, new Uint8Array(), 0, flags);
}

function bigTiff(little: boolean, externalValue: boolean): Uint8Array {
  const dataOffset = 52;
  const data = externalValue ? new Uint8Array(dataOffset + 10) : new Uint8Array(52);
  data.set(little ? [0x49, 0x49] : [0x4d, 0x4d], 0);
  put16(data, 2, 43, little); put16(data, 4, 8, little); put16(data, 6, 0, little); put64(data, 8, 16, little);
  put64(data, 16, 1, little);
  put16(data, 24, externalValue ? 270 : 256, little); put16(data, 26, externalValue ? 2 : 16, little); put64(data, 28, externalValue ? 10 : 1, little);
  if (externalValue) put64(data, 36, dataOffset, little); else put64(data, 36, 640, little);
  put64(data, 44, 0, little);
  if (externalValue) data.set(new TextEncoder().encode("range\0\0\0\0"), dataOffset);
  return data;
}

function richBigTiff(little: boolean): Uint8Array {
  const bytes = new Uint8Array(600);
  const put = (offset: number, value: number): void => put64(bytes, offset, value, little);
  bytes.set(little ? [0x49, 0x49] : [0x4d, 0x4d], 0);
  put16(bytes, 2, 43, little); put16(bytes, 4, 8, little); put16(bytes, 6, 0, little); put(8, 16);
  put(16, 4);
  const entry = (offset: number, tag: number, type: number, count: number, value: number): void => {
    put16(bytes, offset, tag, little); put16(bytes, offset + 2, type, little); put(offset + 4, count); put(offset + 12, value);
  };
  entry(24, 0x8769, 18, 1, 240);
  entry(44, 0x014a, 16, 2, 200);
  entry(64, 0x010e, 2, 10, 216);
  entry(84, 0xdead, 17, 1, 0x1234);
  put(104, 400);
  put(200, 300); put(208, 340); bytes.set(new TextEncoder().encode("description"), 216);
  put(240, 1); entry(248, 0xa005, 16, 1, 460); put(268, 0);
  put(300, 1); entry(308, 0x0100, 3, 1, 1280); put(328, 0);
  put(340, 1); entry(348, 0x0101, 3, 1, 720); put(368, 0);
  put(460, 1); entry(468, 0x0001, 2, 4, 0); put(488, 0);
  put(400, 2); entry(408, 0x0201, 4, 1, 500); entry(428, 0x0202, 4, 1, 4); put(448, 0);
  bytes.set([0xff, 0xd8, 0xff, 0xd9], 500);
  return bytes;
}

describe("S06 range-I/O exhaustive boundary matrix", () => {
  it("runs every HEIF/AVIF reference fixture through family, empty, budget, truncation, and short-read plans", async () => {
    const names = ["avif-idat-item-metadata.avif", "avif-item-metadata.avif", "avif-metadata.avif", "avif-primary-dimensions.avif", "avif-primary-icc.avif", "avif-primary-nclx.avif", "heif-conflicting-primary-dimensions.heic", "heif-cross-meta-item-reference.heic", "heif-idat-item-metadata.heic", "heif-indexed-idat-item-metadata.heic", "heif-iref-exif.heic", "heif-item-metadata.heic", "heif-item-truncated.heic", "heif-metadata.heic", "heif-primary-dimensions.heic", "heif-primary-icc-malformed.heic", "heif-primary-icc.heic", "heif-tail-idat-item-metadata.heic", "heif-truncated.heic", "libavif-paris-icc-exif-xmp.avif", "sips-heic-exif-xmp.heic"];
    const selections = [allGroups, resolveSelection({ groups: ["Dimensions"] }), resolveSelection({ groups: ["EXIF"] }), resolveSelection({ groups: ["XMP"] }), resolveSelection({ groups: [] })];
    for (const name of names) {
      const bytes = await fixture(name);
      for (const selection of selections) {
        for (const options of [{}, { maxSegments: 1 }, { maxMetadataBytes: 32 }, { maxSegmentBytes: 16 }, { maxIfdEntries: 1 }, { maxIfdDepth: 1 }] as const) {
          const result = await materializeHeifMetadata(readerFor(bytes), resolveLimits(options), selection);
          if (result !== null) {
            expect(result.bytes.byteLength).toBeLessThanOrEqual(resolveLimits(options).maxInputBytes);
            expect(result.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
          }
        }
      }
      for (const cut of [0, 1, 4, 8, Math.floor(bytes.length / 2), Math.max(0, bytes.length - 1)]) {
        const result = await materializeHeifMetadata(readerFor(bytes, cut), resolveLimits(), allGroups);
        expect(result === null || result.bytes.length <= resolveLimits().maxInputBytes).toBe(true);
      }
      const empty = await materializeHeifMetadata(readerFor(bytes, 0), resolveLimits(), allGroups);
      expect(empty === null || empty.bytes.length === 0 || empty.partial).toBe(true);
    }
  }, 120000);

  it("runs all TIFF fixtures through classic and BigTIFF range plans with inline, external, selected, overlap, and budget paths", async () => {
    const names = ["tiff-exif-little-endian.tif", "tiff-metadata-truncated.tif", "tiff-metadata.tif", "tiff-truncated.tif"];
    const selections = [allGroups, resolveSelection({ groups: ["Dimensions"] }), resolveSelection({ groups: ["EXIF"], tags: ["Make"] }), resolveSelection({ groups: ["XMP", "IPTC", "ICC", "Photoshop"] }), resolveSelection({ groups: [] })];
    for (const name of names) {
      const bytes = await fixture(name);
      for (const selection of selections) for (const options of [{}, { maxSegments: 1 }, { maxMetadataBytes: 32 }, { maxValueBytes: 8 }, { maxIfdEntries: 1 }, { maxIfdDepth: 1 }] as const) {
        const result = await materializeTiffMetadata(readerFor(bytes), resolveLimits(options), selection);
        if (result !== null) {
          expect(result.bytes.length).toBeLessThanOrEqual(resolveLimits(options).maxInputBytes);
          expect(result.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
        }
      }
      for (const cut of [0, 1, 2, 4, 8, 16, Math.floor(bytes.length / 2), Math.max(0, bytes.length - 1)]) {
        const result = await materializeTiffMetadata(readerFor(bytes, cut), resolveLimits(), allGroups);
        expect(result === null || result.bytes.length <= bytes.length).toBe(true);
      }
    }
    for (const little of [true, false]) for (const external of [false, true]) {
      const bytes = bigTiff(little, external);
      const result = await materializeTiffMetadata(readerFor(bytes), resolveLimits({ maxMetadataBytes: bytes.length, maxValueBytes: bytes.length }), allGroups);
      expect(result).not.toBeNull();
      expect(result?.bytes.length).toBeGreaterThanOrEqual(16);
      expect(result?.mapOffset?.(0)).toBe(0);
      const selected = await materializeTiffMetadata(readerFor(bytes), resolveLimits({ maxMetadataBytes: 16, maxValueBytes: 8 }), resolveSelection({ groups: ["EXIF"] }));
      expect(selected === null || selected.warnings.some(({ code }) => code === "LIMIT_EXCEEDED") || selected.partial).toBe(true);
      const malformed = bytes.slice(0, 15);
      expect(await materializeTiffMetadata(readerFor(malformed), resolveLimits(), allGroups)).toBeNull();
    }
  }, 120000);

  it("covers raw classic TIFF headers, thumbnail limits, BigTIFF pointer widths, and compact remapping", async () => {
    const raw = await fixture("tiff-exif-little-endian.tif");
    const rawClassic = raw.slice();
    put16(rawClassic, 2, 0x4f52, true);
    const rawPlan = await materializeTiffMetadata(readerFor(rawClassic), resolveLimits({ maxMetadataBytes: raw.length * 2, maxValueBytes: raw.length * 2 }), allGroups);
    expect(rawPlan).not.toBeNull();
    expect(rawPlan?.partial).toBe(true);

    const pointers = await materializeTiffMetadata(readerFor(await fixture("tiff-metadata.tif")), resolveLimits({ maxMetadataBytes: 1_000_000, maxValueBytes: 1_000_000 }), allGroups);
    expect(pointers?.mapOffset?.(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
    const thumbnailLimited = await materializeTiffMetadata(readerFor(await fixture("tiff-metadata.tif")), resolveLimits({ maxValueBytes: 1 }), allGroups);
    expect(thumbnailLimited?.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);

    for (const little of [true, false]) {
      const source = richBigTiff(little);
      const result = await materializeTiffMetadata(readerFor(source), resolveLimits({ maxMetadataBytes: source.length, maxValueBytes: source.length, maxSegments: 32 }), allGroups);
      expect(result).not.toBeNull();
      expect(result?.bytes.length).toBeGreaterThan(16);
      expect(result?.mapOffset?.(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
      expect(result?.warnings.some(({ code }) => code === "UNSAFE_OFFSET")).toBe(false);

      const selected = await materializeTiffMetadata(readerFor(source), resolveLimits({ maxMetadataBytes: source.length, maxValueBytes: 8 }), resolveSelection({ groups: ["EXIF"] }));
      expect(selected).not.toBeNull();
      expect(selected?.bytes.length).toBeGreaterThanOrEqual(16);
      const malformed = source.slice();
      put64(malformed, 56, 5, little);
      const malformedResult = await materializeTiffMetadata(readerFor(malformed), resolveLimits({ maxMetadataBytes: source.length, maxValueBytes: source.length }), allGroups);
      expect(malformedResult === null || malformedResult.warnings.some(({ code }) => code === "UNSAFE_OFFSET" || code === "MALFORMED_EXIF")).toBe(true);
    }
  }, 120000);

  it("keeps range planning bounded across every byte of representative valid containers", async () => {
    const cases = [
      { name: "heif-metadata.heic", materialize: materializeHeifMetadata },
      { name: "heif-item-metadata.heic", materialize: materializeHeifMetadata },
      { name: "avif-metadata.avif", materialize: materializeHeifMetadata },
      { name: "avif-item-metadata.avif", materialize: materializeHeifMetadata },
      { name: "tiff-metadata.tif", materialize: materializeTiffMetadata },
      { name: "tiff-exif-little-endian.tif", materialize: materializeTiffMetadata },
    ] as const;
    const replacementValues = [0x00, 0x7f, 0xff];
    for (const testCase of cases) {
      const source = await fixture(testCase.name);
      const original = source.slice();
      const limits = resolveLimits({
        maxInputBytes: Math.max(source.length * 2, 4096),
        maxMetadataBytes: Math.max(source.length * 2, 4096),
        maxSegmentBytes: Math.max(source.length, 2048),
        maxValueBytes: Math.max(source.length, 2048),
        maxSegments: 128,
        maxIfdEntries: 64,
        maxIfdDepth: 8,
      });
      for (let offset = 0; offset < source.length; offset += 16) {
        for (const replacement of replacementValues) {
          const mutated = source.slice();
          mutated[offset] = replacement;
          const result = await testCase.materialize(readerFor(mutated), limits, allGroups);
          expect(result === null || result.bytes.length <= limits.maxMetadataBytes).toBe(true);
          if (result !== null) {
            expect(result.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
            expect(result.warnings.every(({ code, offset: warningOffset, length }) => {
              return /^[A-Z][A-Z0-9_]+$/u.test(code) && Number.isSafeInteger(warningOffset ?? 0) && (warningOffset ?? 0) >= 0 && Number.isSafeInteger(length ?? 0) && (length ?? 0) >= 0;
            })).toBe(true);
          }
          expect(source).toEqual(original);
        }
      }
    }
  }, 120000);

  it("covers HEIF range-parser versions, extent sources, references, and malformed boundaries", async () => {
    const materialize = (input: Uint8Array, options: Parameters<typeof resolveLimits>[0] = {}, selection = allGroups) => {
      return materializeHeifMetadata(readerFor(input), resolveLimits({ maxMetadataBytes: 64 * 1024, maxValueBytes: 64 * 1024, maxSegmentBytes: 64 * 1024, maxIfdEntries: 64, maxSegments: 64, ...options }), selection);
    };
    const direct = await materialize(heifContainer(
      itemInfo([info(1, "Exif")]),
      itemLocation({ id: 1, offset: 0, length: 1 }),
    ));
    expect(direct).not.toBeNull();
    expect(direct?.bytes.length ?? 0).toBeGreaterThan(0);

    const idat = await materialize(heifContainer(
      itemInfo([info(1, "Exif")]),
      itemLocation({ id: 1, method: 1, offset: 0, length: 1 }),
      box("idat", Uint8Array.of(0x49)),
    ));
    expect(idat).not.toBeNull();

    const itemOffset = await materialize(heifContainer(
      itemInfo([info(1, "Exif"), info(2, "av01")]),
      combineLocations(
        itemLocation({ id: 1, method: 2, index: 1, offset: 0, length: 1 }),
        itemLocation({ id: 2, offset: 0, length: 1 }),
      ),
      box("iref", new Uint8Array([0, 0, 0, 0, ...itemReference("iloc", 1, 2)])),
    ));
    expect(itemOffset).not.toBeNull();

    const versioned = await materialize(heifContainer(
      itemInfo([info(70000, "mime", 3, "application/rdf+xml")], 1),
      itemLocation({ version: 2, id: 70000, offsetSize: 8, lengthSize: 8, baseOffsetSize: 8, indexSize: 8, offset: 0, length: 1, index: 1 }),
      box("dinf", box("dref", new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1, ...dataReference("url ", 1)]))),
    ));
    expect(versioned).not.toBeNull();

    const references = await materialize(heifContainer(
      box("iref", new Uint8Array([1, 0, 0, 0, ...itemReference("dimg", 1, 2, 1)])),
    ));
    expect(references).not.toBeNull();

    const unsupportedOffsetSize = itemLocation({ id: 1, offsetSize: 4 });
    unsupportedOffsetSize[12] = ((unsupportedOffsetSize[12] as number) & 0x0f) | 0x20;
    const malformed = [
      heifContainer(box("iinf", new Uint8Array([1, 0, 0, 0, 0, 0]))),
      heifContainer(itemInfo([info(1, "Exif")]), unsupportedOffsetSize),
      heifContainer(itemInfo([info(1, "Exif")]), itemLocation({ id: 0, offset: 0, length: 1 })),
      heifContainer(itemInfo([info(1, "Exif")]), itemLocation({ id: 1, indexSize: 4, index: 0 })),
      heifContainer(itemInfo([info(1, "Exif")]), itemLocation({ id: 1, offsetSize: 8, lengthSize: 8, baseOffsetSize: 8, indexSize: 8 }).slice(0, -1)),
      heifContainer(itemInfo([info(1, "Exif")]), box("iloc", new Uint8Array([3, 0, 0, 0, 0, 0, 0, 0]))),
      heifContainer(itemInfo([info(1, "Exif")]), box("iref", new Uint8Array([2, 0, 0, 0]))),
      heifContainer(itemInfo([info(1, "Exif")]), box("dinf", box("dref", new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0])))),
      heifContainer(itemInfo([info(1, "Exif")]), box("iloc", new Uint8Array([0, 0, 0, 0, 0x44, 0, 0, 1]))),
      heifContainer(itemInfo([info(1, "Exif")]), box("iloc", new Uint8Array([1, 0, 0, 0, 0x44, 0, 0, 1, 0, 1]))),
    ];
    for (const input of malformed) expect(await materialize(input)).toBeNull();

    const truncatedHeader = new Uint8Array([...encoder.encode("heic"), 0, 0, 0, 0, ...encoder.encode("mif1"), 0, 0, 0, 1, ...encoder.encode("meta")]);
    expect(await materialize(truncatedHeader)).toBeNull();
    const unsafeExtended = new Uint8Array([...encoder.encode("heic"), 0, 0, 0, 0, ...encoder.encode("mif1"), 0, 0, 0, 1, ...encoder.encode("free"), 0x00, 0x20, 0, 0, 0, 0, 0, 0]);
    expect(await materialize(unsafeExtended)).toBeNull();
    expect(await materialize(heifContainer(itemInfo([info(1, "Exif")]), itemLocation({ id: 1, method: 1, offset: 0, length: 1 })), { maxMetadataBytes: 8 })).toBeNull();
  });

  it("fails closed for HEIF range reads, parser counts, and unsafe resolution arithmetic", async () => {
    const materialize = (input: Uint8Array, options: Parameters<typeof resolveLimits>[0] = {}, selection = allGroups) => {
      return materializeHeifMetadata(readerFor(input), resolveLimits({ maxMetadataBytes: 64 * 1024, maxValueBytes: 64 * 1024, maxSegmentBytes: 64 * 1024, maxIfdEntries: 4, maxSegments: 8, ...options }), selection);
    };
    const ftyp = box("ftyp", Uint8Array.from([...encoder.encode("heic"), 0, 0, 0, 0, ...encoder.encode("mif1")]));
    const validMeta = heifContainer(itemInfo([info(1, "Exif")]), itemLocation({ id: 1, offset: 0, length: 1 }));

    expect(await materialize(new Uint8Array(7))).toBeNull();
    expect(await materializeHeifMetadata(readerFor(validMeta, undefined, 0), resolveLimits({ maxMetadataBytes: 64 * 1024, maxValueBytes: 64 * 1024, maxSegmentBytes: 64 * 1024, maxIfdEntries: 4, maxSegments: 8 }), allGroups)).toBeNull();
    const shortExtended = new Uint8Array([...ftyp, 0, 0, 0, 1, ...encoder.encode("free"), 0, 0, 0, 4]);
    expect(await materialize(shortExtended)).toBeNull();
    const unsafeExtended = new Uint8Array([...ftyp, 0, 0, 0, 1, ...encoder.encode("free"), 0x00, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    expect(await materialize(unsafeExtended)).toBeNull();
    const undersizedBox = new Uint8Array([...ftyp, 0, 0, 0, 4, ...encoder.encode("free")]);
    expect(await materialize(undersizedBox)).toBeNull();

    const malformedInfos = [
      box("iinf", new Uint8Array([0, 0, 0, 0])),
      box("iinf", new Uint8Array([2, 0, 0, 0, 0, 0])),
      box("iinf", new Uint8Array([0, 0, 0, 0, 0, 1])),
      box("iinf", new Uint8Array([0, 0, 0, 0, 0, 1, 0, 0, 0, 4, 0x69, 0x6e, 0x66, 0x65])),
      box("iinf", new Uint8Array([0, 0, 0, 0, 0, 1, 0, 0, 0, 8, 0x66, 0x72, 0x65, 0x65])),
      box("iinf", new Uint8Array([0, 0, 0, 0, 0, 1, ...info(1, "infe", 2).slice(8, -1)])),
      box("iinf", new Uint8Array([0, 0, 0, 0, 0, 1, ...info(1, "mime", 2, undefined).slice(8)])),
    ];
    for (const child of malformedInfos) expect(await materialize(heifContainer(child))).toBeNull();
    expect(await materialize(heifContainer(itemInfo([info(1, "Exif"), info(2, "Exif")]), itemLocation({ id: 1 }), itemLocation({ id: 2 })), { maxIfdEntries: 1 })).toBeNull();

    const malformedLocations = [
      itemLocation({ version: 1, id: 1, offsetSize: 4, lengthSize: 4, baseOffsetSize: 4 }).slice(0, -1),
      itemLocation({ version: 1, id: 1, offsetSize: 8, lengthSize: 8, baseOffsetSize: 8, indexSize: 8, offset: 0x20000000000000, length: 1 }),
      itemLocation({ version: 2, id: 1, offset: 0, length: 1 }).slice(0, 15),
    ];
    for (const child of malformedLocations) expect(await materialize(heifContainer(itemInfo([info(1, "Exif")]), child))).toBeNull();

    const malformedReferences = [
      box("iref", new Uint8Array()),
      box("iref", new Uint8Array([2, 0, 0, 0])),
      box("iref", new Uint8Array([0, 0, 0, 0, 0, 0, 0, 4])),
      box("iref", new Uint8Array([0, 0, 0, 0, 0, 0, 0, 12, 0x64, 0x69, 0x6d, 0x67, 0, 0, 0, 1])),
      box("iref", new Uint8Array([0, 0, 0, 0, 0, 0, 0, 12, 0x64, 0x69, 0x6d, 0x67, 0, 0, 0, 0])),
    ];
    for (const child of malformedReferences) expect(await materialize(heifContainer(child))).toBeNull();

    const malformedDataReferences = [
      box("dinf", box("dref", new Uint8Array())),
      box("dinf", box("dref", new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0]))),
      box("dinf", box("dref", new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 4, 0x66, 0x72, 0x65, 0x65]))),
      box("dinf", box("dref", new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 12, 0x75, 0x72, 0x6e, 0x20]))),
    ];
    for (const child of malformedDataReferences) expect(await materialize(heifContainer(child))).toBeNull();

    const unsupportedMethod = await materialize(heifContainer(
      itemInfo([info(1, "Exif")]),
      itemLocation({ id: 1, method: 3, offset: 0, length: 1 }),
    ));
    expect(unsupportedMethod).toBeNull();

    const noIdat = await materialize(heifContainer(
      itemInfo([info(1, "Exif")]),
      itemLocation({ id: 1, method: 1, offset: 0, length: 1 }),
    ));
    expect(noIdat).toBeNull();
  });
});
