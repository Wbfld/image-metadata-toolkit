import { readFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";

import {
  createByteSource,
  editMetadata,
  inventoryJumbfC2pa,
  parseMetadata,
  redactMetadata,
  rewriteJpegMetadata,
  rewritePngMetadata,
  rewriteWebpMetadata,
} from "../src/index.js";
import { parseJpeg } from "../src/parsers/jpeg.js";
import { parsePng, parsePngDimensions, inflateZlib } from "../src/parsers/png.js";
import { parseTiff, parseTiffMetadata } from "../src/parsers/tiff.js";
import { parseWebp, parseWebpDimensions } from "../src/parsers/webp.js";
import { inspectIccProfile, parseIccChunk } from "../src/metadata/icc.js";
import { inspectIptc, parseIptcMetadata } from "../src/metadata/iptc.js";
import { inspectPhotoshopResourceSpans, parsePhotoshopResources, PHOTOSHOP_IDENTIFIER } from "../src/metadata/photoshop.js";
import {
  chunkExtendedXmp,
  serializeIptcIim,
  serializePhotoshopIptcResources,
  serializeStructuredXmp,
  synchronizeIptcXmp,
} from "../src/metadata/serialization.js";
import {
  deriveXmpPacketProvenance,
  extendedXmpGuid,
  mergeStructuredXmp,
  parseExtendedXmpChunk,
  parseStructuredXmpBytesDetailed,
  parseStructuredXmpDetailed,
  parseStructuredXmpDocuments,
  parseStructuredXmpWithDecoderDetailed,
  reassembleExtendedXmp,
  validateStructuredXmpPacket,
} from "../src/metadata/xmp.js";
import { inspectMpfSegments, inspectUltraHdrXmp } from "../src/metadata/mpf-ultrahdr.js";
import { inspectSemanticPrivacyDetailed } from "../src/privacy/semantic.js";
import { resolveLimits } from "../src/security/limits.js";
import type { SecurityLimits } from "../src/types.js";
import { assertRange, checkedAdd, checkedMultiply, subarrayChecked } from "../src/security/bounds.js";
import { resolveSelection } from "../src/selection.js";

const encoder = new TextEncoder();

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let cursor = 0;
  for (const part of parts) {
    result.set(part, cursor);
    cursor += part.length;
  }
  return result;
}

function u32be(value: number): Uint8Array {
  const result = new Uint8Array(4);
  new DataView(result.buffer).setUint32(0, value, false);
  return result;
}

function u32le(value: number): Uint8Array {
  const result = new Uint8Array(4);
  new DataView(result.buffer).setUint32(0, value, true);
  return result;
}

function crc32(bytes: Uint8Array, start: number, end: number): number {
  let crc = 0xffffffff;
  for (let offset = start; offset < end; offset += 1) {
    crc ^= bytes[offset] ?? 0;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length + 12);
  result.set(u32be(data.length), 0);
  result.set(encoder.encode(type), 4);
  result.set(data, 8);
  result.set(u32be(crc32(result, 4, data.length + 8)), data.length + 8);
  return result;
}

function minimalPng(extra: readonly Uint8Array[] = []): Uint8Array {
  const ihdr = new Uint8Array(13);
  new DataView(ihdr.buffer).setUint32(0, 2);
  new DataView(ihdr.buffer).setUint32(4, 2);
  ihdr.set([8, 6, 0, 0, 0], 8);
  return concat(
    Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    ...extra,
    pngChunk("IDAT", Uint8Array.of(0x78, 0x9c, 0x63, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01)),
    pngChunk("IEND", new Uint8Array()),
  );
}

function webpChunk(type: string, data: Uint8Array): Uint8Array {
  const result = new Uint8Array(8 + data.length + (data.length & 1));
  result.set(encoder.encode(type), 0);
  result.set(u32le(data.length), 4);
  result.set(data, 8);
  return result;
}

function minimalWebp(chunk: Uint8Array): Uint8Array {
  const body = chunk;
  return concat(encoder.encode("RIFF"), u32le(body.length + 4), encoder.encode("WEBP"), body);
}

function jpegSegment(marker: number, payload: Uint8Array): Uint8Array {
  return concat(Uint8Array.of(0xff, marker, (payload.length + 2) >>> 8, (payload.length + 2) & 0xff), payload);
}

function minimalJpeg(extra: readonly Uint8Array[] = [], scan = Uint8Array.of(1, 2, 3)): Uint8Array {
  const frame = jpegSegment(0xc0, Uint8Array.of(8, 0, 2, 0, 3, 1, 1, 0x11, 0));
  const scanHeader = jpegSegment(0xda, Uint8Array.of(1, 1, 0, 0, 63, 0));
  return concat(Uint8Array.of(0xff, 0xd8), ...extra, frame, scanHeader, scan, Uint8Array.of(0xff, 0xd9));
}

function photoshopResource(resourceId: number, payload: Uint8Array, name = ""): Uint8Array {
  const nameBytes = encoder.encode(name);
  const paddedNameLength = (1 + nameBytes.length + 1) & ~1;
  const result = new Uint8Array(4 + 2 + paddedNameLength + 4 + payload.length + (payload.length & 1));
  result.set(encoder.encode("8BIM"), 0);
  new DataView(result.buffer).setUint16(4, resourceId, false);
  result[6] = nameBytes.length;
  result.set(nameBytes, 7);
  new DataView(result.buffer).setUint32(6 + paddedNameLength, payload.length, false);
  result.set(payload, 10 + paddedNameLength);
  return result;
}

function boundedLimits(overrides: Partial<SecurityLimits> = {}) {
  return resolveLimits({
    maxInputBytes: 128 * 1024,
    maxMetadataBytes: 8 * 1024,
    maxSegmentBytes: 8 * 1024,
    maxValueBytes: 8 * 1024,
    maxStringBytes: 8 * 1024,
    maxDecompressedBytes: 8 * 1024,
    maxDecompressedMetadataBytes: 8 * 1024,
    maxXmpNodes: 128,
    maxXmpProperties: 128,
    maxXmpArrayItems: 128,
    maxXmpQualifiers: 128,
    maxXmpOutputBytes: 32 * 1024,
    maxIptcDatasets: 128,
    maxIptcCandidates: 128,
    maxIptcOutputBytes: 32 * 1024,
    maxWarnings: 32,
    ...overrides,
  });
}

const fixtureNames = [
  "jpeg-exif-little-endian.jpg",
  "jpeg-icc.jpg",
  "jpeg-iptc.jpg",
  "png-metadata.png",
  "png-bad-text.png",
  "webp-metadata.webp",
  "tiff-metadata.tif",
  "tiff-exif-little-endian.tif",
  "heif-metadata.heic",
  "avif-metadata.avif",
  "libavif-paris-icc-exif-xmp.avif",
] as const;

async function fixture(name: string): Promise<Uint8Array> {
  return new Uint8Array(await readFile(new URL(`./fixtures/${name}`, import.meta.url)));
}

function expectSafeWarningCodes(value: { readonly warnings: readonly { readonly code: string }[] }): void {
  expect(value.warnings.length).toBeLessThanOrEqual(32);
  expect(value.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
}

describe("S06 robustness: arithmetic, ranges, and cancellation", () => {
  it("rejects unsafe arithmetic and never creates an unchecked range", () => {
    expect(checkedAdd(0, 0)).toBe(0);
    expect(checkedAdd(Number.MAX_SAFE_INTEGER, 0)).toBe(Number.MAX_SAFE_INTEGER);
    expect(() => checkedAdd(Number.MAX_SAFE_INTEGER, 1, "offset")).toThrow(RangeError);
    expect(() => checkedAdd(-1, 1)).toThrow(RangeError);
    expect(() => checkedAdd(1, Number.NaN)).toThrow(RangeError);
    expect(checkedMultiply(0, Number.MAX_SAFE_INTEGER)).toBe(0);
    expect(() => checkedMultiply(Number.MAX_SAFE_INTEGER, 2, "size")).toThrow(RangeError);
    expect(() => checkedMultiply(1.25, 2)).toThrow(RangeError);
    expect(() => assertRange(10, 10, 0)).not.toThrow();
    expect(() => assertRange(10, 11, 0)).toThrow(RangeError);
    expect(() => assertRange(10, 9, 2)).toThrow(RangeError);
    expect(() => subarrayChecked(Uint8Array.of(1, 2), 0, 2)).not.toThrow();
    expect(() => subarrayChecked(Uint8Array.of(1, 2), -1, 1)).toThrow(RangeError);
  });

  it("bounds byte-source cache, coalescing, empty reads, adapters, and aborts", async () => {
    const source = createByteSource(Uint8Array.from([1, 2, 3, 4]), boundedLimits({ maxReadCacheBytes: 2, maxReadRequests: 3, maxReadBytes: 4 }));
    expect(await source.read(1, 1)).toEqual(new Uint8Array());
    expect(await source.read(0, 1)).toEqual(Uint8Array.of(1));
    expect(await source.read(1, 2)).toEqual(Uint8Array.of(2));
    expect(await source.read(2, 4)).toEqual(Uint8Array.of(3, 4));
    await expect(source.read(0, 4)).rejects.toMatchObject({ code: "LIMIT_EXCEEDED" });

    const controller = new AbortController();
    controller.abort();
    await expect(createByteSource(new ArrayBuffer(2), boundedLimits(), controller.signal).read(0, 1)).rejects.toMatchObject({ name: "MetadataError" });
    expect(() => createByteSource(null as never, boundedLimits())).toThrow();
    const malformedBlob = new Blob([Uint8Array.of(1)]);
    Object.defineProperty(malformedBlob, "slice", { value: () => ({ arrayBuffer: () => Promise.resolve(new Uint8Array([1])) }) });
    const badBlob = createByteSource(malformedBlob, boundedLimits());
    await expect(badBlob.read(0, 1)).rejects.toMatchObject({ code: "INVALID_VALUE" });
  });
});

describe("S06 robustness: independent parser truncation and limits", () => {
  it("parses every truncation boundary of the representative JPEG, PNG, WebP, and TIFF fixtures", async () => {
    const cases = [
      ["jpeg-exif-little-endian.jpg", "jpeg"],
      ["jpeg-iptc.jpg", "jpeg"],
      ["png-metadata.png", "png"],
      ["png-bad-text.png", "png"],
      ["webp-metadata.webp", "webp"],
      ["tiff-metadata.tif", "tiff"],
      ["tiff-exif-little-endian.tif", "tiff"],
    ] as const;
    for (const [name, format] of cases) {
      const bytes = await fixture(name);
      for (let length = 0; length <= bytes.length; length += 1) {
        const input = bytes.subarray(0, length);
        const parsed = await parseMetadata(input, { limits: boundedLimits() });
        if (length === bytes.length) expect(parsed.format, `${name} complete`).toBe(format);
        expectSafeWarningCodes(parsed);
        expect(parsed.fields.length).toBeLessThanOrEqual(4096);
      }
    }
  }, 30_000);

  it("keeps all recognized fixture families bounded under truncation and limit pressure", async () => {
    for (const name of fixtureNames) {
      const bytes = await fixture(name);
      const lengths = new Set([0, 1, 2, 4, 8, 12, 16, bytes.length >>> 2, bytes.length >>> 1, bytes.length - 1, bytes.length]);
      for (const length of lengths) {
        const input = bytes.subarray(0, Math.max(0, length));
        const parsed = await parseMetadata(input, { limits: boundedLimits({ maxSegments: 4, maxIfdEntries: 4, maxPngChunks: 4, maxWarnings: 4 }) });
        expectSafeWarningCodes(parsed);
        expect(parsed.fields.length).toBeLessThanOrEqual(4096);
      }
      await expect(parseMetadata(bytes, { limits: boundedLimits({ maxInputBytes: Math.max(1, bytes.length - 1) }) })).rejects.toMatchObject({ code: "LIMIT_EXCEEDED" });
    }
  }, 30_000);

  it("exercises PNG dimensions, chunk truncation, text, decompression, and cancellation", async () => {
    const valid = minimalPng([pngChunk("tEXt", concat(encoder.encode("Comment\0ok"))) ]);
    expect(parsePngDimensions(valid)).toEqual({ width: 2, height: 2 });
    for (let length = 0; length <= valid.length; length += 1) {
      const dimensions = parsePngDimensions(valid.subarray(0, length));
      expect(dimensions === null || dimensions.width > 0).toBe(true);
    }
    const parsed = await parsePng(valid, boundedLimits());
    expect(parsed.format).toBe("png");
    expect(parsed.pngText).toContainEqual(expect.objectContaining({ keyword: "Comment", text: "ok" }));
    expectSafeWarningCodes(parsed);
    const corruptCrc = valid.slice();
    corruptCrc[corruptCrc.length - 5] = (corruptCrc[corruptCrc.length - 5] ?? 0) ^ 0xff;
    expectSafeWarningCodes(await parsePng(corruptCrc, boundedLimits()));
    expect((await parsePng(valid, boundedLimits({ maxPngChunks: 1 }))).warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    await expect(inflateZlib(Uint8Array.of(1, 2, 3), 64)).resolves.toMatchObject({ bytes: null, error: "INVALID_VALUE" });
    const compressed = new Uint8Array(deflateSync(Uint8Array.of(1, 2, 3, 4)));
    expect((await inflateZlib(compressed, 1)).error).toBe("LIMIT_EXCEEDED");
    const controller = new AbortController();
    controller.abort();
    await expect(inflateZlib(compressed, 100, controller.signal)).rejects.toThrow();
  });

  it("exercises all WebP dimension forms and structural failure branches", () => {
    const vp8l = minimalWebp(webpChunk("VP8L", Uint8Array.of(0x2f, 0xff, 0x7f, 0x00, 0x00)));
    const vp8x = minimalWebp(webpChunk("VP8X", Uint8Array.of(0, 0, 0, 0, 1, 0, 0, 1, 0, 0)));
    const vp8 = minimalWebp(webpChunk("VP8 ", Uint8Array.of(0x10, 0, 0, 0x9d, 0x01, 0x2a, 0x80, 0x02, 0xe0, 0x01)));
    expect(parseWebpDimensions(vp8l)).toEqual({ width: 16384, height: 2 });
    expect(parseWebpDimensions(vp8x)).toEqual({ width: 2, height: 2 });
    expect(parseWebpDimensions(vp8)).toEqual({ width: 640, height: 480 });
    for (const bytes of [vp8l, vp8x, vp8]) {
      expect((parseWebp(bytes, boundedLimits())).format).toBe("webp");
      for (let length = 0; length <= bytes.length; length += 1) {
        const dimensions = parseWebpDimensions(bytes.subarray(0, length));
        expect(dimensions === null || dimensions.width > 0).toBe(true);
      }
    }
    const wrongRiff = vp8x.slice();
    wrongRiff[4] = 0;
    expect((parseWebp(wrongRiff, boundedLimits())).warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_WEBP" }));
    const unknown = minimalWebp(webpChunk("ABCD", Uint8Array.of(1, 2, 3)));
    expectSafeWarningCodes(parseWebp(unknown, boundedLimits()));
    expect((parseWebp(vp8x, boundedLimits({ maxSegments: 0 + 1 }))).warnings.length).toBeLessThanOrEqual(32);
  });

  it("exercises JPEG marker, scan, header-only, selection, and abort boundaries", () => {
    const app0 = jpegSegment(0xe0, concat(encoder.encode("JFIF\0"), Uint8Array.of(1, 2, 1, 0, 72, 0, 72, 0, 0)));
    const bytes = minimalJpeg([app0, jpegSegment(0xfe, encoder.encode("comment"))], Uint8Array.of(1, 0xff, 0x00, 2, 0xff, 0xd0, 3));
    const parsed = parseJpeg(bytes, boundedLimits());
    expect(parsed.jfif?.xDensity).toBe(72);
    expect(parsed.dimensions).toEqual({ width: 3, height: 2 });
    expect(parseJpeg(bytes, boundedLimits(), { headerOnly: true }).dimensions).toEqual({ width: 3, height: 2 });
    expect(parseJpeg(bytes, boundedLimits(), { selection: resolveSelection({ groups: ["EXIF"] }) }).jfif).toBeNull();
    for (let length = 0; length <= bytes.length; length += 1) expectSafeWarningCodes(parseJpeg(bytes.subarray(0, length), boundedLimits()));
    const malformed = [
      Uint8Array.of(0xff, 0xd8, 0xff),
      Uint8Array.of(0xff, 0xd8, 0xff, 0x00),
      Uint8Array.of(0xff, 0xd8, 0xff, 0xd0),
      concat(Uint8Array.of(0xff, 0xd8), jpegSegment(0xe1, Uint8Array.of(0, 1))),
      concat(Uint8Array.of(0xff, 0xd8), jpegSegment(0xda, Uint8Array.of(1)), Uint8Array.of(1, 2)),
    ];
    for (const input of malformed) expectSafeWarningCodes(parseJpeg(input, boundedLimits()));
    const controller = new AbortController();
    controller.abort();
    expect(() => parseJpeg(bytes, boundedLimits(), { signal: controller.signal })).toThrow();
  });

  it("exercises TIFF classic/BigTIFF, parser truncation, selection, and abort limits", async () => {
    const bytes = await fixture("tiff-metadata.tif");
    expect(parseTiff(bytes, boundedLimits()).exif).not.toBeNull();
    expect(parseTiffMetadata(bytes, boundedLimits(), resolveSelection({ groups: ["EXIF"] })).format).toBe("tiff");
    for (let length = 0; length <= bytes.length; length += 1) {
      const parsed = parseTiff(bytes.subarray(0, length), boundedLimits());
      expectSafeWarningCodes(parsed);
    }
    const invalidOrders = [Uint8Array.of(0x4d, 0x4d, 0x00, 0x2a), Uint8Array.of(0x49, 0x49, 0x00, 0x2a), Uint8Array.of(0x49, 0x49, 0x2a, 0, 0xff, 0xff, 0xff, 0xff)];
    for (const input of invalidOrders) expectSafeWarningCodes(parseTiff(input, boundedLimits()));
    const controller = new AbortController();
    controller.abort();
    expect(() => parseTiffMetadata(bytes, boundedLimits(), undefined, true, controller.signal)).toThrow();
    expectSafeWarningCodes(parseTiff(bytes, boundedLimits({ maxIfdEntries: 1, maxIfdDepth: 1 })));
  });
});

describe("S06 robustness: bounded metadata decoders and structured values", () => {
  it("retains IPTC raw values and diagnoses invalid lengths, encoding, dates, and times", () => {
    const dataset = (record: number, number: number, payload: Uint8Array): Uint8Array => concat(Uint8Array.of(0x1c, record, number), Uint8Array.of(payload.length >>> 8, payload.length & 0xff), payload);
    const valid = concat(
      dataset(2, 0x37, encoder.encode("20240229")),
      dataset(2, 0x3c, encoder.encode("235959+1400")),
      dataset(2, 0x64, encoder.encode("GBR")),
      dataset(2, 0x87, encoder.encode("eng")),
      dataset(2, 0x0a, encoder.encode("8")),
      dataset(2, 0x19, encoder.encode("one")),
    );
    const parsed = parseIptcMetadata(valid, boundedLimits());
    expect(parsed.malformed).toBe(false);
    expect(parsed.fields.length).toBeGreaterThanOrEqual(5);
    expect(parsed.warnings).toEqual([]);
    const invalid = concat(
      dataset(2, 0x37, encoder.encode("20230229")),
      dataset(2, 0x3c, encoder.encode("246000+1460")),
      dataset(2, 0x64, encoder.encode("NO")),
      dataset(2, 0x87, encoder.encode("e")),
      dataset(2, 0x0a, encoder.encode("9")),
      Uint8Array.of(0x1c, 2, 0x37, 0xff),
    );
    const invalidResult = parseIptcMetadata(invalid, boundedLimits());
    expect(invalidResult.warnings.some(({ code }) => code === "INVALID_VALUE")).toBe(true);
    expect(invalidResult.fields.some((field) => field.type === "UNDEFINED")).toBe(true);
    expect(inspectIptc(Uint8Array.of(1, 2, 3)).data).toBeNull();
    expect(parseIptcMetadata(valid, boundedLimits({ maxIptcDatasets: 1 })).warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    expect(parseIptcMetadata(new Uint8Array(4).fill(0x1c), boundedLimits()).malformed).toBe(true);
  });

  it("exercises ICC profile/tag limits and malformed profile values", () => {
    const prefix = encoder.encode("ICC_PROFILE\0");
    const profile = new Uint8Array(132);
    new DataView(profile.buffer).setUint32(0, profile.length);
    profile.set(encoder.encode("acsp"), 36);
    const chunk = parseIccChunk(concat(prefix, Uint8Array.of(1, 1), profile));
    expect(chunk).not.toBeNull();
    if (chunk === null) throw new Error("ICC chunk was not recognized");
    expect(inspectIccProfile([chunk], boundedLimits()).data).not.toBeNull();
    expect(inspectIccProfile([chunk], boundedLimits({ maxMetadataBytes: 1 })).warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    expect(parseIccChunk(Uint8Array.of(...prefix, 0, 1))).toBeNull();
    expect(inspectIccProfile([{ ...chunk, data: Uint8Array.of(1, 2, 3), byteLength: 3 }], boundedLimits()).warnings.length).toBeGreaterThan(0);
  });

  it("retains Photoshop resource provenance and fails closed for malformed resources", () => {
    const payload = concat(PHOTOSHOP_IDENTIFIER, photoshopResource(0x0404, Uint8Array.of(0x1c, 2, 0x05, 0, 1, 0x41)));
    const spans = inspectPhotoshopResourceSpans(payload, "app13", boundedLimits());
    expect(spans?.complete).toBe(true);
    expect(spans?.spans).toHaveLength(1);
    const resources = parsePhotoshopResources(payload, boundedLimits(), { container: "app13", blockId: "app13:0", sourceOffset: 50, sourceLength: payload.length });
    const firstResource = resources?.resources[0];
    expect(firstResource?.resourceId).toBe(0x0404);
    expect(typeof firstResource?.payloadOffset).toBe("number");
    expect(firstResource?.parentBlockId).toBe("app13:0");
    for (let length = 0; length <= payload.length; length += 1) {
      const value = inspectPhotoshopResourceSpans(payload.subarray(0, length), "app13", boundedLimits());
      if (value !== null) expect(value.diagnostics.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
    }
    const badPadding = payload.slice();
    badPadding[PHOTOSHOP_IDENTIFIER.length + 7] = 1;
    expect(inspectPhotoshopResourceSpans(badPadding, "app13", boundedLimits())?.complete).toBe(false);
    const tooMany = concat(PHOTOSHOP_IDENTIFIER, ...Array.from({ length: 4 }, () => photoshopResource(0x0404, Uint8Array.of(1))));
    expect(inspectPhotoshopResourceSpans(tooMany, "app13", boundedLimits({ maxSegments: 2 }))?.complete).toBe(false);
  });

  it("bounds XML/RDF values, preserves lexical values, and rejects unsafe decoder output", async () => {
    const packet = '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:ex="urn:example:"><rdf:Description><ex:value rdf:resource="https://example.test/x"/><ex:items><rdf:Seq><rdf:li xml:lang="en">one</rdf:li><rdf:li>two</rdf:li></rdf:Seq></ex:items></rdf:Description></rdf:RDF>';
    const parsed = parseStructuredXmpDetailed(packet);
    expect(parsed.value?.rdf?.properties.map(({ name }) => name.localName)).toEqual(["value", "items"]);
    expect(parsed.value?.rdf?.properties[0]?.value).toMatchObject({ kind: "resource", resourceUri: "https://example.test/x" });
    expect(parseStructuredXmpDetailed(packet, { maxDepth: 1 }).diagnostics).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    expect(parseStructuredXmpDetailed(packet, { maxArrayItems: 1 }).diagnostics).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    expect(parseStructuredXmpDetailed(`<!DOCTYPE x [<!ENTITY boom "boom">]><x>&boom;</x>`).diagnostics).toContainEqual(expect.objectContaining({ code: "UNSAFE_ENTITY" }));
    expect(parseStructuredXmpBytesDetailed(Uint8Array.of(0xff), { maxInputBytes: 1 }).diagnostics).toContainEqual(expect.objectContaining({ code: "MALFORMED_XML" }));
    expect(parseStructuredXmpDetailed(packet, { maxOutputBytes: 1 }).value).toBeNull();
    expect(validateStructuredXmpPacket(null)).toBe(false);
    expect(parseStructuredXmpWithDecoderDetailed(packet, { parse: () => { throw new Error("decoder failure"); } }).diagnostics).toContainEqual(expect.objectContaining({ code: "INVALID_ADAPTER_OUTPUT" }));
    expect(parseStructuredXmpWithDecoderDetailed(packet, { parse: () => ({ namespaces: {}, properties: { broken: 1 } } as never) }).value).toBeNull();
    expect(parseStructuredXmpDocuments([packet, packet], { maxPackets: 1 }).documents).toHaveLength(2);
    const merged = mergeStructuredXmp([{ value: parsed.value, packetIndex: 0 }, { value: parsed.value, packetIndex: 1 }], "last");
    expect(merged.properties).toHaveLength(2);
    expect(deriveXmpPacketProvenance([packet], [{ id: "xmp:0", family: "XMP", container: "XMP", status: "decoded", offset: 10, length: packet.length, associatedImage: null, sensitivity: "moderate", warningCodes: [] }])).toHaveLength(1);
    expect(serializeStructuredXmp(parsed.value as never)).toContain("rdf:RDF");
    const chunks = await chunkExtendedXmp(packet, { maxChunkBytes: 64 });
    expect(chunks.chunks.length).toBeGreaterThan(1);
    const parsedChunks = chunks.chunks.map(parseExtendedXmpChunk);
    expect(parsedChunks.every((item) => item !== null)).toBe(true);
    expect(reassembleExtendedXmp(parsedChunks.filter((item): item is NonNullable<typeof item> => item !== null), new TextEncoder().encode(packet).byteLength + 1)).toBe(packet);
    expect(extendedXmpGuid('<x:xmpmeta HasExtendedXMP="0123456789abcdef0123456789ABCDEF"/>')).toBe("0123456789ABCDEF0123456789ABCDEF");
    expect(parseExtendedXmpChunk(Uint8Array.of(1, 2, 3))).toBeNull();
    expect(synchronizeIptcXmp({ iim: [], xmp: parsed.value }, { policy: "preserve-all" })).toMatchObject({ conflicts: [] });
  });
});

describe("S06 robustness: privacy, inventory, and atomic writers", () => {
  it("keeps semantic privacy fail-closed and serializes only bounded public data", async () => {
    const xmp = '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:unknown="urn:unknown:"><rdf:Description><unknown:secret>private value</unknown:secret><unknown:nested rdf:parseType="Resource"><unknown:token>hidden</unknown:token></unknown:nested></rdf:Description></rdf:RDF>';
    const result = await parseMetadata(minimalJpeg([jpegSegment(0xe1, concat(encoder.encode("http://ns.adobe.com/xap/1.0/\0"), encoder.encode(xmp)))]), { limits: boundedLimits() });
    const inspection = inspectSemanticPrivacyDetailed(result, boundedLimits());
    expect(inspection.findings.some(({ category, state }) => category === "unknown-xmp" && state === "decoded-finding")).toBe(true);
    expect(JSON.stringify(inspection)).not.toContain("private value");
    const raw = inspectSemanticPrivacyDetailed(result, boundedLimits(), true);
    expect(raw.findings.some(({ rawValue }) => rawValue === "private value")).toBe(true);
    const redacted = await redactMetadata(minimalPng(), { remove: ["AllMetadata"], limits: boundedLimits() });
    expect(redacted.data).toBeInstanceOf(Uint8Array);
    expect(redacted.data).not.toBeNull();
  });

  it("inventories malformed and unknown C2PA carriers without claiming verification", () => {
    for (const input of [new Uint8Array(), Uint8Array.from([0xff, 0xd8]), minimalPng(), minimalWebp(webpChunk("ABCD", Uint8Array.of(1))), minimalJpeg([jpegSegment(0xeb, encoder.encode("c2pa"))])]) {
      const report = inventoryJumbfC2pa(input, { limits: boundedLimits({ maxSegments: 2, maxIfdDepth: 2 }) });
      expect(["not-present", "unsupported", "malformed", "limited", "detected"]).toContain(report.status);
      expect(report.remoteReferencesFetched).toBe(false);
      expect(JSON.stringify(report).toLowerCase()).not.toContain("verified");
    }
  });

  it("refuses failed writer plans before output and preserves source bytes", async () => {
    const jpeg = minimalJpeg();
    const png = minimalPng();
    const webp = minimalWebp(webpChunk("VP8L", Uint8Array.of(0x2f, 1, 0, 0, 0)));
    for (const [input, run] of [
      [jpeg, () => rewriteJpegMetadata(jpeg, { blocks: [{ op: "add", kind: "standard-xmp", data: "x" }], limits: { maxAdapterOutputBytes: 4 } })],
      [png, () => rewritePngMetadata(png, { blocks: [{ op: "add", kind: "xmp", data: "x" }], limits: { maxAdapterOutputBytes: 4 } })],
      [webp, () => rewriteWebpMetadata(webp, { blocks: [{ op: "add", kind: "xmp", data: "x" }], limits: { maxAdapterOutputBytes: 4 } })],
    ] as const) {
      const before = input.slice();
      await expect((async () => run())()).rejects.toThrow();
      expect(input).toEqual(before);
    }
    const source = new Uint8Array(await fixture("jpeg-exif-little-endian.jpg"));
    const before = source.slice();
    const failure = await editMetadata(source, { limits: { maxAdapterOutputBytes: 4 }, operations: [{ op: "set", operationId: "bad", target: { kind: "field", fieldId: "normalized:Make" }, value: "changed" }] });
    expect(failure.successful).toBe(false);
    expect(failure.output).toBeNull();
    expect(source).toEqual(before);
  });

  it("serializes IPTC resources with escaping and rejects cumulative output overflow", () => {
    const bytes = serializeIptcIim([{ record: 2, dataset: 5, value: "safe" }, { record: 2, dataset: 0x19, value: "one" }, { record: 2, dataset: 0x19, value: "two" }]);
    expect(bytes[0]).toBe(0x1c);
    expect(serializePhotoshopIptcResources(bytes).subarray(0, PHOTOSHOP_IDENTIFIER.length)).toEqual(PHOTOSHOP_IDENTIFIER);
    expect(() => serializeIptcIim([{ record: 2, dataset: 5, value: "oversized" }], { maxOutputBytes: 2 })).toThrow();
    expect(() => serializePhotoshopIptcResources([bytes, bytes], { maxOutputBytes: 1 })).toThrow();
  });
});

describe("S06 robustness: MPF and Ultra HDR bounded paths", () => {
  it("rejects malformed MPF/Ultra HDR structures with stable bounded output", () => {
    const source = { length: 8, subarray: (start: number, end: number) => Uint8Array.of(start, end), isMaterialized: () => true };
    const mpf = inspectMpfSegments([], source, boundedLimits());
    expect(mpf).toBeNull();
    const invalid = inspectUltraHdrXmp(["<x:xmpmeta><rdf:RDF/></x:xmpmeta>"], [null], [], boundedLimits());
    expect(invalid).toBeNull();
    expect(() => inspectMpfSegments([{ id: "mpf:0", payload: Uint8Array.of(1, 2, 3), sourceOffset: 0, byteLength: 3 }], source, boundedLimits({ maxValueBytes: 1 }))).not.toThrow();
  });
});
