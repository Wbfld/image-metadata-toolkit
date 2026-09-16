import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { parseMetadata } from "../src/index.js";
import { resolveLimits } from "../src/security/limits.js";
import { parseHeif, parseHeifDimensions } from "../src/parsers/heif.js";
import { parseJpeg } from "../src/parsers/jpeg.js";
import { parseGif } from "../src/parsers/gif.js";
import { parsePng, parsePngDimensions } from "../src/parsers/png.js";
import { parseTiffMetadata } from "../src/parsers/tiff.js";
import { parseWebp, parseWebpDimensions } from "../src/parsers/webp.js";
import { parseHeifSequences } from "../src/heif-sequences.js";
import { materializeHeifMetadata } from "../src/heif-range.js";
import { materializeTiffMetadata } from "../src/tiff-range.js";
import { materializeJpegMetadata } from "../src/jpeg-range.js";
import { materializeMetadata } from "../src/input.js";
import { inspectMpfSegments } from "../src/metadata/mpf-ultrahdr.js";
import { inspectIccProfile, parseIccChunk } from "../src/metadata/icc.js";
import { parseIptcMetadata } from "../src/metadata/iptc.js";
import { parsePhotoshopResources, PHOTOSHOP_IDENTIFIER } from "../src/metadata/photoshop.js";
import { parseStructuredXmpBytesDetailed, parseStructuredXmpDocuments, parseXmpPacket } from "../src/metadata/xmp.js";
import { inspectSemanticPrivacyDetailed } from "../src/privacy/semantic.js";
import { inventoryJumbfC2pa } from "../src/trust/jumbf.js";
import { resolveSelection } from "../src/selection.js";
import type { BlobReader } from "../src/input.js";
import type { ParsedMetadataResult, SecurityLimits } from "../src/types.js";

const encoder = new TextEncoder();

function limits(overrides: Partial<SecurityLimits> = {}): SecurityLimits {
  return resolveLimits({
    maxInputBytes: 128 * 1024,
    maxMetadataBytes: 16 * 1024,
    maxSegmentBytes: 16 * 1024,
    maxValueBytes: 16 * 1024,
    maxStringBytes: 16 * 1024,
    maxDecompressedBytes: 16 * 1024,
    maxDecompressedMetadataBytes: 16 * 1024,
    maxXmpNodes: 256,
    maxXmpProperties: 256,
    maxXmpArrayItems: 256,
    maxXmpQualifiers: 256,
    maxXmpOutputBytes: 64 * 1024,
    maxIptcDatasets: 256,
    maxIptcCandidates: 256,
    maxIptcOutputBytes: 64 * 1024,
    maxWarnings: 64,
    ...overrides,
  });
}

async function bounded(result: ParsedMetadataResult | Promise<ParsedMetadataResult>): Promise<void> {
  result = await result;
  expect(result.fields).toBeInstanceOf(Array);
  expect(result.warnings).toBeInstanceOf(Array);
  expect(result.fields.length).toBeLessThanOrEqual(4_096);
  expect(result.blocks?.length ?? 0).toBeLessThanOrEqual(4_096);
  expect(result.warnings.length).toBeLessThanOrEqual(64);
  expect(result.warnings.every((warning) => /^[A-Z][A-Z0-9_]+$/u.test(warning.code))).toBe(true);
}

function mutate(source: Uint8Array, index: number, value: number): Uint8Array {
  const output = source.slice();
  if (output.length > 0) output[index % output.length] = value;
  return output;
}

function prefixCases(source: Uint8Array): Uint8Array[] {
  const cases: Uint8Array[] = [];
  for (const length of [0, 1, 2, 3, 4, 7, 8, 12, Math.min(16, source.length), Math.min(32, source.length)]) cases.push(source.subarray(0, length).slice());
  const width = Math.min(source.length, 256);
  for (let index = 0; index < width; index += 1) {
    for (const value of [0, 1, 0x7f, 0xff]) cases.push(mutate(source, index, value));
  }
  return cases;
}

function everyTruncation(source: Uint8Array): Uint8Array[] {
  return Array.from({ length: source.length + 1 }, (_, length) => source.subarray(0, length).slice());
}

async function fixture(name: string): Promise<Uint8Array> {
  return new Uint8Array(await readFile(new URL("./fixtures/" + name, import.meta.url)));
}

function photoshopResource(id: number, payload: Uint8Array): Uint8Array {
  const nameLength = 2;
  const output = new Uint8Array(4 + 2 + nameLength + 4 + payload.length + (payload.length & 1));
  output.set(encoder.encode("8BIM"), 0);
  new DataView(output.buffer).setUint16(4, id, false);
  new DataView(output.buffer).setUint32(8, payload.length, false);
  output.set(payload, 12);
  return output;
}

function rawMpfSource(bytes: Uint8Array) {
  return {
    length: bytes.length,
    subarray: (start: number, end: number) => bytes.slice(start, end),
    isMaterialized: (start: number, end: number) => start >= 0 && end >= start && end <= bytes.length,
  };
}

function readerFor(bytes: Uint8Array): BlobReader {
  let bytesRead = 0;
  return {
    size: bytes.length,
    read: (start: number, end: number) => {
      if (start < 0 || end < start || end > bytes.length) throw new Error("reader range escaped fixture");
      bytesRead += end - start;
      return Promise.resolve(bytes.slice(start, end));
    },
    bytesRead: () => bytesRead,
    telemetry: () => ({ readRequests: 0, bytesRead, cacheHits: 0, coalescedReads: 0, cacheBytes: 0 }),
  };
}

function boundedMaterialization(value: Awaited<ReturnType<typeof materializeMetadata>>): void {
  expect(value.bytes.byteLength).toBeLessThanOrEqual(16 * 1024);
  expect(value.warnings.length).toBeLessThanOrEqual(64);
  expect(value.warnings.every((warning) => /^[A-Z][A-Z0-9_]+$/u.test(warning.code))).toBe(true);
}

function boundedOptionalMaterialization(value: Awaited<ReturnType<typeof materializeMetadata>> | null): void {
  if (value !== null) boundedMaterialization(value);
}

describe("S06 deterministic structural boundary coverage", () => {
  it("exercises independent container parsers across truncation and byte-level mutations", async () => {
    const cases = [
      ["jpeg-exif-little-endian.jpg", (bytes: Uint8Array) => parseJpeg(bytes, limits())],
      ["png-metadata.png", (bytes: Uint8Array) => parsePng(bytes, limits())],
      ["webp-metadata.webp", (bytes: Uint8Array) => parseWebp(bytes, limits())],
      ["tiff-metadata.tif", (bytes: Uint8Array) => parseTiffMetadata(bytes, limits())],
      ["heif-metadata.heic", (bytes: Uint8Array) => parseHeif(bytes, limits(), "heif")],
    ] as const;
    for (const [name, parser] of cases) {
      const source = await fixture(name);
      for (const input of prefixCases(source)) await bounded(parser(input));
      for (const input of everyTruncation(source)) await bounded(parser(input));
    }
  }, 120_000);

  it("exercises dimensions and sequence boundary contracts for all supported image families", async () => {
    const jpeg = await fixture("jpeg-exif-little-endian.jpg");
    const png = await fixture("png-metadata.png");
    const webp = await fixture("webp-metadata.webp");
    const gif = Uint8Array.from([...encoder.encode("GIF89a"), 1, 0, 1, 0, 0xf0, 0, 0, 0, 0, 0, 0, 0x3b]);
    const heif = await fixture("heif-metadata.heic");
    for (const input of prefixCases(jpeg)) await expect(parseMetadata(input, { limits: limits() })).resolves.toBeDefined();
    for (const input of prefixCases(png)) {
      parsePngDimensions(input);
      await bounded(parsePng(input, limits()));
    }
    for (const input of prefixCases(webp)) {
      parseWebpDimensions(input);
      await bounded(parseWebp(input, limits()));
    }
    for (const input of prefixCases(gif)) await bounded(parseGif(input, limits()));
    for (const input of prefixCases(heif)) {
      parseHeifDimensions(input, 4, 128);
      parseHeifSequences(input, limits());
    }
    for (const input of everyTruncation(heif)) {
      parseHeifDimensions(input, 4, 128);
      parseHeifSequences(input, limits());
    }
  }, 30_000);

  it("exercises bounded structured decoders with valid, invalid, and over-limit values", () => {
    const xmpPackets = [
      "<x:xmpmeta xmlns:x=\"adobe:ns:meta/\"><rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\"><rdf:Description xmlns:dc=\"http://purl.org/dc/elements/1.1/\"><dc:title><rdf:Alt><rdf:li xml:lang=\"x-default\">title</rdf:li><rdf:li xml:lang=\"en\">title</rdf:li></rdf:Alt></dc:title></rdf:Description></rdf:RDF></x:xmpmeta>",
      "<x:xmpmeta xmlns:x=\"adobe:ns:meta/\"><rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\"><rdf:Description><broken></rdf:Description></rdf:RDF></x:xmpmeta>",
      "<!DOCTYPE x [<!ENTITY secret 'blocked'>]><x:xmpmeta xmlns:x=\"adobe:ns:meta/\"/>",
      "<x:xmpmeta xmlns:x=\"adobe:ns:meta/\"><rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\"><rdf:Description><x:p>\\uFFFD</x:p></rdf:Description></rdf:RDF></x:xmpmeta>",
    ];
    for (const packet of xmpPackets) {
      const bytes = encoder.encode(packet);
      const parsed = parseStructuredXmpBytesDetailed(bytes, { maxInputBytes: 64 * 1024, maxElements: 32, maxProperties: 32, maxArrayItems: 16, maxQualifiers: 16, maxTextBytes: 4 * 1024 });
      expect(parsed.diagnostics.every((diagnostic) => /^[A-Z][A-Z0-9_]+$/u.test(diagnostic.code))).toBe(true);
      parseStructuredXmpDocuments([packet, packet], { maxPackets: 1, maxInputBytes: 64 * 1024 });
      parseXmpPacket(bytes, 64 * 1024);
      parseXmpPacket(Uint8Array.from([...bytes, 0xff]), 64 * 1024);
    }
    const oversized = encoder.encode("<x:xmpmeta xmlns:x=\\\"adobe:ns:meta/\\\"><rdf:RDF>" + "<rdf:Description/>".repeat(128) + "</rdf:RDF></x:xmpmeta>");
    const limited = parseStructuredXmpBytesDetailed(oversized, { maxInputBytes: oversized.length, maxElements: 2, maxProperties: 2, maxArrayItems: 2, maxQualifiers: 2, maxTextBytes: 64 });
    expect(limited.diagnostics.length).toBeGreaterThan(0);
  });

  it("keeps ICC, IPTC, Photoshop, MPF, and inventory diagnostics bounded", async () => {
    const iccSource = await fixture("jpeg-icc.jpg");
    for (const length of [0, 1, 4, 12, 128, iccSource.length]) {
      const payload = iccSource.subarray(0, length).slice();
      parseIccChunk(payload);
      const inspected = inspectIccProfile([{ sequence: 1, total: 1, byteLength: payload.length, data: payload }], limits());
      expect(inspected.warnings.length).toBeLessThanOrEqual(64);
    }
    const iptcValues = [new Uint8Array(), Uint8Array.of(0x1c), Uint8Array.of(0x1c, 2, 5, 0), encoder.encode("\\x1c\\x02\\x19\\x00\\x03one")];
    for (const value of iptcValues) {
      const parsed = parseIptcMetadata(value, limits());
      expect(parsed.warnings.length).toBeLessThanOrEqual(64);
    }
    const photoshopValues = [new Uint8Array(), PHOTOSHOP_IDENTIFIER.slice(), photoshopResource(0x0404, encoder.encode("x")), photoshopResource(0x0404, new Uint8Array(257))];
    for (const value of photoshopValues) {
      const parsed = parsePhotoshopResources(value, limits(), { container: "app13", blockId: "test:photoshop", sourceOffset: 0, sourceLength: value.length });
      expect(parsed?.diagnostics.length ?? 0).toBeLessThanOrEqual(64);
    }
    const base = await fixture("base.png");
    for (const input of prefixCases(base)) {
      const inventory = inventoryJumbfC2pa(input, { limits: limits() });
      expect(inventory.diagnostics.length).toBeLessThanOrEqual(64);
      expect(inventory.remoteReferencesFetched).toBe(false);
    }
    const mpf = inspectMpfSegments([], rawMpfSource(base), limits());
    expect(mpf === null || mpf.diagnostics.length <= 64).toBe(true);
  });

  it("keeps privacy inspection bounded for duplicate, opaque, and malformed metadata results", async () => {
    const inputs = [
      await fixture("jpeg-iptc.jpg"),
      await fixture("jpeg-iptc-malformed.jpg"),
      await fixture("png-bad-text.png"),
      await fixture("webp-truncated.webp"),
      new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0, 8, 1, 2, 3, 4, 0xff, 0xd9]),
    ];
    for (const input of inputs) {
      const parsed = await parseMetadata(input, { limits: limits() });
      const inspection = inspectSemanticPrivacyDetailed(parsed, limits());
      expect(inspection.findings.length).toBeLessThanOrEqual(4_096);
      expect(inspection.diagnostics.length).toBeLessThanOrEqual(64);
      await bounded(parsed);
    }
  });

  it("exercises range materializers at every truncation boundary without exceeding source bounds", async () => {
    const selection = resolveSelection(undefined);
    const cases = [
      ["jpeg-exif-little-endian.jpg", materializeJpegMetadata],
      ["png-metadata.png", materializeMetadata],
      ["webp-metadata.webp", materializeMetadata],
      ["tiff-metadata.tif", materializeTiffMetadata],
      ["tiff-exif-little-endian.tif", materializeTiffMetadata],
      ["tiff-metadata-truncated.tif", materializeTiffMetadata],
      ["heif-metadata.heic", materializeHeifMetadata],
      ["heif-item-metadata.heic", materializeHeifMetadata],
      ["heif-idat-item-metadata.heic", materializeHeifMetadata],
      ["heif-tail-idat-item-metadata.heic", materializeHeifMetadata],
      ["heif-indexed-idat-item-metadata.heic", materializeHeifMetadata],
      ["heif-cross-meta-item-reference.heic", materializeHeifMetadata],
      ["avif-metadata.avif", materializeHeifMetadata],
      ["avif-idat-item-metadata.avif", materializeHeifMetadata],
    ] as const;
    for (const [name, materializer] of cases) {
      const source = await fixture(name);
      for (const input of everyTruncation(source)) {
        const reader = readerFor(input);
        const value = materializer === materializeMetadata
          ? await materializeMetadata(new Blob([(() => { const copy = new ArrayBuffer(input.byteLength); new Uint8Array(copy).set(input); return copy; })()]), limits(), selection)
          : await (materializer as (source: BlobReader, securityLimits: SecurityLimits, resolvedSelection: typeof selection) => ReturnType<typeof materializeJpegMetadata>)(reader, limits(), selection);
        boundedOptionalMaterialization(value);
        expect(reader.bytesRead()).toBeLessThanOrEqual(input.length * 128 + 128);
      }
    }
  }, 30_000);
});
