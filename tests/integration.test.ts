import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import {
  auditPrivacy,
  getCapabilities,
  getCaptureTime,
  getGps,
  getMetadataSummary,
  getOrientation,
  getRotation,
  getStructuredXmp,
  getThumbnail,
  indexMetadataFields,
  MetadataError,
  parseMetadata,
  parseMetadataMany,
  readCaptureTime,
  readGps,
  readMetadataSummary,
  readOrientation,
  readPreset,
  readRotation,
  readStructuredXmp,
  readTags,
  readThumbnail,
  redactMetadata,
  sanitizeMetadata,
  type MetadataField,
  type MetadataResult,
} from "../src/index.js";
import { parseJpegMetadata } from "../src/jpeg.js";
import { redactMetadata as redactFocusedMetadata } from "../src/redact.js";
import { fetchMetadata } from "../src/fetch.js";
import { parseStructuredXmpBytesWithRgrove, parseStructuredXmpWithRgrove } from "../src/xmp-rgrove.js";
import { inspectIccProfile } from "../src/metadata/icc.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";

const fixtureUrl = new URL("./fixtures/jpeg-exif-little-endian.jpg", import.meta.url);
const pngFixtureUrl = new URL("./fixtures/png-metadata.png", import.meta.url);
const pngTruncatedUrl = new URL("./fixtures/png-truncated.png", import.meta.url);
const pngBadTextUrl = new URL("./fixtures/png-bad-text.png", import.meta.url);
const pngBadIccUrl = new URL("./fixtures/png-icc-malformed.png", import.meta.url);
const tiffFixtureUrl = new URL("./fixtures/tiff-exif-little-endian.tif", import.meta.url);
const tiffTruncatedUrl = new URL("./fixtures/tiff-truncated.tif", import.meta.url);
const tiffMetadataFixtureUrl = new URL("./fixtures/tiff-metadata.tif", import.meta.url);
const tiffMetadataTruncatedUrl = new URL("./fixtures/tiff-metadata-truncated.tif", import.meta.url);
const webpFixtureUrl = new URL("./fixtures/webp-metadata.webp", import.meta.url);
const webpTruncatedUrl = new URL("./fixtures/webp-truncated.webp", import.meta.url);
const iptcFixtureUrl = new URL("./fixtures/jpeg-iptc.jpg", import.meta.url);
const iptcMalformedUrl = new URL("./fixtures/jpeg-iptc-malformed.jpg", import.meta.url);
const iccFixtureUrl = new URL("./fixtures/jpeg-icc.jpg", import.meta.url);
const iccMalformedUrl = new URL("./fixtures/jpeg-icc-malformed.jpg", import.meta.url);
const heifFixtureUrl = new URL("./fixtures/heif-metadata.heic", import.meta.url);
const heifTruncatedUrl = new URL("./fixtures/heif-truncated.heic", import.meta.url);
const avifFixtureUrl = new URL("./fixtures/avif-metadata.avif", import.meta.url);
const heifItemFixtureUrl = new URL("./fixtures/heif-item-metadata.heic", import.meta.url);
const heifItemTruncatedUrl = new URL("./fixtures/heif-item-truncated.heic", import.meta.url);
const avifItemFixtureUrl = new URL("./fixtures/avif-item-metadata.avif", import.meta.url);
const heifIdatItemFixtureUrl = new URL("./fixtures/heif-idat-item-metadata.heic", import.meta.url);
const avifIdatItemFixtureUrl = new URL("./fixtures/avif-idat-item-metadata.avif", import.meta.url);
const heifPrimaryDimensionsUrl = new URL("./fixtures/heif-primary-dimensions.heic", import.meta.url);
const avifPrimaryDimensionsUrl = new URL("./fixtures/avif-primary-dimensions.avif", import.meta.url);
const heifConflictingPrimaryDimensionsUrl = new URL("./fixtures/heif-conflicting-primary-dimensions.heic", import.meta.url);
const heifIndexedIdatItemFixtureUrl = new URL("./fixtures/heif-indexed-idat-item-metadata.heic", import.meta.url);
const heifTailIdatItemFixtureUrl = new URL("./fixtures/heif-tail-idat-item-metadata.heic", import.meta.url);
const heifPrimaryIccFixtureUrl = new URL("./fixtures/heif-primary-icc.heic", import.meta.url);
const avifPrimaryIccFixtureUrl = new URL("./fixtures/avif-primary-icc.avif", import.meta.url);
const heifMalformedPrimaryIccFixtureUrl = new URL("./fixtures/heif-primary-icc-malformed.heic", import.meta.url);
const heifCrossMetaItemFixtureUrl = new URL("./fixtures/heif-cross-meta-item-reference.heic", import.meta.url);
const heifReferencedExifFixtureUrl = new URL("./fixtures/heif-iref-exif.heic", import.meta.url);
const avifNclxFixtureUrl = new URL("./fixtures/avif-primary-nclx.avif", import.meta.url);
const libavifMetadataFixtureUrl = new URL("./fixtures/libavif-paris-icc-exif-xmp.avif", import.meta.url);
const sipsHeifMetadataFixtureUrl = new URL("./fixtures/sips-heic-exif-xmp.heic", import.meta.url);

function pngIdatData(bytes: Uint8Array): Uint8Array {
  const parts: Uint8Array[] = [];
  let cursor = 8;
  while (cursor + 12 <= bytes.length) {
    const length = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(cursor);
    const type = String.fromCharCode(...bytes.subarray(cursor + 4, cursor + 8));
    if (type === "IDAT") parts.push(bytes.slice(cursor + 8, cursor + 8 + length));
    cursor += 12 + length;
  }
  const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}

function fieldsByName(fields: readonly MetadataField[]): Map<string, MetadataField> {
  return new Map(fields.map((field) => [field.name, field]));
}

function findFourCC(bytes: Uint8Array, type: string): number {
  for (let offset = 0; offset + 4 <= bytes.length; offset += 1) {
    if (String.fromCharCode(...bytes.subarray(offset, offset + 4)) === type) return offset;
  }
  return -1;
}

function firstJpegScanMarker(bytes: Uint8Array): number {
  for (let offset = 2; offset + 1 < bytes.length; offset += 1) {
    if (bytes[offset] === 0xff && bytes[offset + 1] === 0xda) return offset;
  }
  return -1;
}

function insertBytes(bytes: Uint8Array, offset: number, inserted: Uint8Array): Uint8Array {
  const output = new Uint8Array(bytes.length + inserted.length);
  output.set(bytes.subarray(0, offset), 0);
  output.set(inserted, offset);
  output.set(bytes.subarray(offset), offset + inserted.length);
  return output;
}

function jpegXmpSegment(packet: string): Uint8Array {
  const payload = new Uint8Array([
    ...new TextEncoder().encode("http://ns.adobe.com/xap/1.0/\0"),
    ...new TextEncoder().encode(packet),
  ]);
  const segment = new Uint8Array(payload.length + 4);
  segment.set([0xff, 0xe1, (payload.length + 2) >>> 8, (payload.length + 2) & 0xff]);
  segment.set(payload, 4);
  return segment;
}

function jpegIccSegment(profile: Uint8Array, sequence = 1, total = 1): Uint8Array {
  const payload = new Uint8Array(14 + profile.length);
  payload.set(new TextEncoder().encode("ICC_PROFILE\0"), 0);
  payload.set([sequence, total], 12);
  payload.set(profile, 14);
  const segment = new Uint8Array(payload.length + 4);
  segment.set([0xff, 0xe2, (payload.length + 2) >>> 8, (payload.length + 2) & 0xff]);
  segment.set(payload, 4);
  return segment;
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
  const chunk = new Uint8Array(data.length + 12);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  chunk.set(Array.from(type, (character) => character.charCodeAt(0)), 4);
  chunk.set(data, 8);
  view.setUint32(data.length + 8, crc32(chunk, 4, data.length + 8));
  return chunk;
}

function insertBeforeIdat(png: Uint8Array, inserted: Uint8Array): Uint8Array {
  let cursor = 8;
  while (cursor + 12 <= png.length) {
    const length = new DataView(png.buffer, png.byteOffset, png.byteLength).getUint32(cursor);
    const type = String.fromCharCode(...png.subarray(cursor + 4, cursor + 8));
    if (type === "IDAT") {
      const output = new Uint8Array(png.length + inserted.length);
      output.set(png.subarray(0, cursor), 0);
      output.set(inserted, cursor);
      output.set(png.subarray(cursor), cursor + inserted.length);
      return output;
    }
    cursor += 12 + length;
  }
  throw new Error("PNG fixture has no IDAT chunk");
}

describe("public parsing API", () => {
  it("parses the real JPEG fixture and all first-pass normalized fields", async () => {
    const result = await parseMetadata(await readFile(fixtureUrl));
    const fields = fieldsByName(result.fields);

    expect(result.format).toBe("jpeg");
    expect(result.mimeType).toBe("image/jpeg");
    expect(result.dimensions).toEqual({ width: 2, height: 2 });
    expect(result.exif?.byteOrder).toBe("little-endian");
    expect(result.jfif).not.toBeNull();
    expect(result.warnings).toEqual([]);
    expect([...fields.keys()]).toEqual([
      "Make",
      "Model",
      "Orientation",
      "DateTime",
      "DateTimeOriginal",
      "ExposureTime",
      "FNumber",
      "ISOSpeedRatings",
      "Flash",
      "FocalLength",
      "GPSLatitude",
      "GPSLongitude",
      "GPSAltitude",
      "Copyright",
      "Artist",
      "Software",
      "BodySerialNumber",
    ]);

    expect(fields.get("Make")?.value).toBe("OpenAI Camera");
    expect(fields.get("Model")?.value).toBe("Fixture One");
    expect(fields.get("Orientation")?.value).toBe(6);
    expect(fields.get("Orientation")?.display).toContain("90° clockwise");
    expect(fields.get("DateTime")?.value).toBe("2026-09-07 12:34:56");
    expect(fields.get("DateTimeOriginal")?.value).toBe("2026-09-07 12:34:56");
    expect(fields.get("ExposureTime")?.raw).toEqual({ numerator: 1, denominator: 125 });
    expect(fields.get("ExposureTime")?.value).toBeCloseTo(1 / 125);
    expect(fields.get("FNumber")?.raw).toEqual({ numerator: 28, denominator: 10 });
    expect(fields.get("FNumber")?.value).toBe(2.8);
    expect(fields.get("ISOSpeedRatings")?.value).toBe(400);
    expect(fields.get("Flash")?.value).toMatchObject({ fired: true, mode: "auto", redEyeReduction: true });
    expect(fields.get("FocalLength")?.value).toBe(50);
    expect(fields.get("GPSLatitude")?.value).toBe(51.5);
    expect(fields.get("GPSLongitude")?.value).toBeCloseTo(-7 / 60);
    expect(fields.get("GPSAltitude")?.value).toBe(35);
    expect(fields.get("Copyright")?.value).toBe("Public Domain");
    expect(fields.get("Artist")?.value).toBe("Fixture Artist");
    expect(fields.get("Software")?.value).toBe("browser-image-metadata fixture");

    const shutter = result.exif?.fields.find(({ name }) => name === "ShutterSpeedValue");
    expect(shutter?.raw).toEqual({ numerator: 6965784, denominator: 1000000 });
    expect(shutter?.value).toMatchObject({ unit: "seconds" });
    expect(shutter?.display).toContain("APEX 6965784/1000000");

    expect(getMetadataSummary(result)).toMatchObject({
      camera: { make: "OpenAI Camera", model: "Fixture One" },
      exposure: { time: 1 / 125, fNumber: 2.8, iso: 400 },
      location: { latitude: 51.5, altitude: 35 },
      orientation: 6,
    });
    expect(getCapabilities("jpeg").losslessRedaction).toBe(true);
    expect(getCapabilities("jpeg").readScopes).toEqual(["full", "jpeg-header", "metadata"]);
    expect(getCapabilities("png").readScopes).toEqual(["full", "metadata"]);
    expect(getCapabilities("unknown").readScopes).toEqual([]);
  });

  it("provides task-oriented GPS, orientation, rotation, and capture helpers", async () => {
    const result = await parseMetadata(await readFile(fixtureUrl));
    expect(getGps(result)).toEqual({
      latitude: 51.5,
      longitude: -7 / 60,
      altitude: 35,
      complete: true,
      conflicts: [],
    });
    expect(getOrientation(result)).toEqual({
      value: 6,
      transform: null,
      source: "exif",
      conflicts: [],
    });
    expect(getRotation(result)).toMatchObject({
      degrees: 90,
      scaleX: 1,
      scaleY: 1,
      dimensionSwapped: true,
      css: "rotate(90deg) scale(1, 1)",
    });
    expect(getCaptureTime(result)).toMatchObject({
      value: "2026-09-07 12:34:56",
      source: "DateTimeOriginal",
    });
    expect(getThumbnail(result)).toBeNull();
  });

  it("keeps container transforms and incomplete GPS explicit", () => {
    const result = {
      format: "heif",
      mimeType: "image/heif",
      dimensions: { width: 10, height: 20 },
      fields: [],
      exif: null,
      xmp: null,
      iptc: null,
      icc: null,
      jfif: null,
      pngText: [],
      blocks: [],
      coverage: { requested: "complete", wholeFile: "complete", reasons: [], unclassifiedBlockIds: [] },
      completeness: { complete: true, scope: "full", reasons: [] },
      warnings: [],
      transform: { rotation: 270, mirrored: true, mirrorAxis: "vertical" },
    } as MetadataResult;
    expect(getGps(result)).toMatchObject({ complete: false, latitude: null, longitude: null });
    expect(getOrientation(result)).toMatchObject({ value: null, source: "container", transform: { rotation: 270, mirrored: true } });
    expect(getRotation(result)).toMatchObject({ degrees: 270, scaleX: 1, scaleY: -1, dimensionSwapped: true });
  });

  it("returns a defensive thumbnail copy", () => {
    const thumbnail = Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]);
    const result = {
      format: "jpeg",
      mimeType: "image/jpeg",
      dimensions: null,
      fields: [],
      exif: { byteOrder: "little-endian", fields: [], ifds: [], thumbnail: { data: thumbnail.slice(), mimeType: "image/jpeg" } },
      xmp: null,
      iptc: null,
      icc: null,
      jfif: null,
      pngText: [],
      blocks: [],
      coverage: { requested: "complete", wholeFile: "complete", reasons: [], unclassifiedBlockIds: [] },
      completeness: { complete: true, scope: "full", reasons: [] },
      warnings: [],
    } as MetadataResult;
    const copy = getThumbnail(result);
    expect(copy).toMatchObject({ mimeType: "image/jpeg", data: thumbnail });
    if (copy === null) throw new Error("expected thumbnail");
    copy.data[0] = 0;
    expect(result.exif?.thumbnail?.data[0]).toBe(0xff);
  });

  it("reads common browser tasks directly from image input", async () => {
    const fixture = await readFile(fixtureUrl);
    const [gps, orientation, rotation, captureTime, thumbnail, summary, essential, tags] = await Promise.all([
      readGps(fixture),
      readOrientation(fixture),
      readRotation(fixture),
      readCaptureTime(fixture),
      readThumbnail(fixture),
      readMetadataSummary(fixture),
      readPreset(fixture, "essential", { scope: "jpeg-header" }),
      readTags(fixture, ["Make", "IFD0:0x0110"]),
    ]);

    expect(gps).toMatchObject({ latitude: 51.5, longitude: -0.11666666666666667, altitude: 35, complete: true });
    expect(orientation).toMatchObject({ value: 6, source: "exif" });
    expect(rotation).toMatchObject({ degrees: 90, css: "rotate(90deg) scale(1, 1)" });
    expect(captureTime).toMatchObject({ value: "2026-09-07 12:34:56", source: "DateTimeOriginal" });
    expect(thumbnail).toBeNull();
    expect(summary.camera).toMatchObject({ make: "OpenAI Camera", model: "Fixture One" });
    expect(essential.completeness.scope).toBe("partial");
    expect(tags.map(({ name }) => name)).toEqual(expect.arrayContaining(["Make", "Model"]));

    const index = indexMetadataFields(await parseMetadata(fixture));
    expect(index.byId.get("IFD0:0x010f")?.value).toBe("OpenAI Camera");
    expect(index.byName.get("Model")?.value).toBe("Fixture One");
    expect(index.allByName.get("Make")).toHaveLength(2);
    expect((await parseMetadata(fixture)).blocks).toEqual(expect.arrayContaining([
      expect.objectContaining({ family: "EXIF", status: "decoded", container: "APP1 Exif" }),
    ]));
    const exifBlock = (await parseMetadata(fixture)).blocks.find((block) => block.family === "EXIF");
    expect(exifBlock).toBeDefined();
    if (exifBlock === undefined || exifBlock.offset === null || exifBlock.length === null) return;
    expect(exifBlock.id).toMatch(/^jpeg:APP1:\d+$/);
    expect(typeof exifBlock.offset).toBe("number");
    expect(typeof exifBlock.length).toBe("number");
    expect([...fixture.subarray(exifBlock.offset, exifBlock.offset + 10)]).toEqual([0xff, 0xe1, 0x02, 0x2e, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00]);
    const make = (await parseMetadata(fixture)).fields.find((field) => field.name === "Make");
    expect(make?.source?.blockId).toBe(exifBlock.id);
    expect(make?.source?.entryLength).toBe(12);
    expect(make?.source?.valueLength).toBe(14);
    expect(make?.source?.entryOffset ?? -1).toBeGreaterThan(exifBlock.offset);
    expect(make?.source?.valueOffset ?? -1).toBeGreaterThan(exifBlock.offset);
  });

  it("decodes retained XMP packets through root helpers without dropping failed packets", async () => {
    const packet = '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="rdf" xmlns:dc="dc"><rdf:Description dc:format="image/jpeg"/></rdf:RDF></x:xmpmeta>';
    const result = {
      format: "jpeg",
      mimeType: "image/jpeg",
      dimensions: null,
      fields: [],
      exif: null,
      xmp: { packets: [packet, "<!DOCTYPE x><x/>"] },
      iptc: null,
      icc: null,
      jfif: null,
      pngText: [],
      blocks: [],
      coverage: { requested: "complete", wholeFile: "complete", reasons: [], unclassifiedBlockIds: [] },
      completeness: { complete: true, scope: "full", reasons: [] },
      warnings: [],
    } satisfies MetadataResult;
    const structured = getStructuredXmp(result);
    expect(structured.complete).toBe(false);
    expect(structured.documents[0]?.value?.properties["dc:format"]).toBe("image/jpeg");
    expect(structured.documents[1]?.value).toBeNull();

    const fixture = await readFile(sipsHeifMetadataFixtureUrl);
    const direct = await readStructuredXmp(fixture);
    expect(direct.documents).not.toHaveLength(0);
  });

  it("keeps duplicate JPEG XMP APP1 packets as distinct physical provenance blocks", async () => {
    const fixture = await readFile(fixtureUrl);
    const scan = firstJpegScanMarker(fixture);
    const first = jpegXmpSegment("<x:xmpmeta xmlns:x=\"adobe:ns:meta/\"><first/></x:xmpmeta>");
    const second = jpegXmpSegment("<x:xmpmeta xmlns:x=\"adobe:ns:meta/\"><second/></x:xmpmeta>");
    const result = await parseMetadata(insertBytes(insertBytes(fixture, scan, first), scan + first.length, second));
    const blocks = result.blocks.filter((block) => block.container === "APP1 XMP");
    expect(blocks).toHaveLength(2);
    expect(new Set(blocks.map((block) => block.id)).size).toBe(2);
    expect(blocks.map((block) => block.offset)).toEqual([scan, scan + first.length]);
    const selected = await parseMetadata(insertBytes(fixture, scan, first), { select: { groups: ["EXIF"] } });
    expect(selected.blocks).toContainEqual(expect.objectContaining({ family: "XMP", status: "skipped", offset: scan }));
    expect(selected.coverage).toMatchObject({ requested: "complete", wholeFile: "skipped-by-selection" });
    expect(selected.coverage.reasons).toContainEqual(expect.objectContaining({ code: "BLOCK_SKIPPED_BY_SELECTION" }));
  });

  it("keeps malformed ICC coverage local to its ICC block", async () => {
    const fixture = await readFile(fixtureUrl);
    const scan = firstJpegScanMarker(fixture);
    const malformedIcc = jpegIccSegment(Uint8Array.of(0, 1, 2, 3), 1, 2);
    const result = await parseMetadata(insertBytes(fixture, scan, malformedIcc));
    expect(result.blocks.find(({ family }) => family === "ICC")).toMatchObject({ status: "malformed", coverage: "malformed" });
    expect(result.blocks.find(({ family }) => family === "EXIF")).toMatchObject({ status: "decoded", coverage: "complete" });
    expect(result.coverage.wholeFile).toBe("malformed");
    expect(result.coverage.unclassifiedBlockIds.some((id) => id.startsWith("jpeg:APP2:"))).toBe(true);
  });

  it("validates optional structured XMP parser input before parsing", () => {
    expect(parseStructuredXmpWithRgrove('<x:xmpmeta xmlns:x="adobe:ns:meta/"/>')).not.toBeNull();
    expect(parseStructuredXmpWithRgrove("<!DOCTYPE x [<!ENTITY a 'b'>]><x/>")).toBeNull();
    expect(parseStructuredXmpWithRgrove("<x>")).toBeNull();
    expect(parseStructuredXmpBytesWithRgrove(Uint8Array.of(0xff))).toBeNull();
    expect(parseStructuredXmpBytesWithRgrove(new TextEncoder().encode("<x/>"), { maxInputBytes: 0 })).toBeNull();
    expect(parseStructuredXmpBytesWithRgrove(new TextEncoder().encode("<x/>"), { maxInputBytes: 3 })).toBeNull();
    expect(parseStructuredXmpBytesWithRgrove(new TextEncoder().encode("<x/>"))?.properties).toEqual({});
  });

  it("parses ordered batches with bounded concurrency", async () => {
    const [jpeg, png] = await Promise.all([readFile(fixtureUrl), readFile(pngFixtureUrl)]);
    const results = await parseMetadataMany([jpeg, png], { concurrency: 1, select: { groups: ["Dimensions"] } });
    expect(results.map(({ format }) => format)).toEqual(["jpeg", "png"]);
    expect(results.every((result) => result.fields.length === 0)).toBe(true);
    await expect(parseMetadataMany([jpeg], { concurrency: 0 })).rejects.toMatchObject({ code: "INVALID_VALUE" });
    const controller = new AbortController();
    controller.abort();
    await expect(parseMetadataMany([jpeg], { signal: controller.signal })).rejects.toMatchObject({ code: "ABORTED" });
  });

  it("fetches through an explicit, input-bounded adapter", async () => {
    const fixture = await readFile(fixtureUrl);
    const fetch: typeof globalThis.fetch = (...args) => {
      return Promise.resolve(new Response(fixture, { status: 200, headers: { "content-length": String(fixture.byteLength), "x-arguments": String(args.length) } }));
    };
    const result = await fetchMetadata("https://example.invalid/photo.jpg", { fetch, select: { groups: ["Dimensions"] } });
    expect(result).toMatchObject({ format: "jpeg", dimensions: { width: 2, height: 2 }, fields: [] });
    await expect(fetchMetadata("https://example.invalid/photo.jpg", { fetch, limits: { maxInputBytes: 1 } })).rejects.toMatchObject({ code: "LIMIT_EXCEEDED" });
    const notFound: typeof globalThis.fetch = (...args) => {
      return Promise.resolve(new Response(null, { status: 404, headers: { "x-arguments": String(args.length) } }));
    };
    await expect(fetchMetadata("https://example.invalid/photo.jpg", { fetch: notFound })).rejects.toMatchObject({ code: "INVALID_VALUE" });
  });

  it("audits recognized privacy metadata and reports concrete inspection evidence", async () => {
    const result = await auditPrivacy(await readFile(fixtureUrl));
    expect(result.format).toBe("jpeg");
    expect(result.safe).toBe(false);
    expect(result.complete).toBe(true);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ target: "EXIF" }),
      expect.objectContaining({ target: "GPSLatitude", sensitivity: "high" }),
    ]));
    expect(result.opaqueBlocks).toEqual([]);
    expect(result.trailingBytes).toBe(0);
    expect(result.coverage).toMatchObject({ requested: "complete", wholeFile: "complete", unclassifiedBlockIds: [] });
    expect(result.reasonCodes).toContain("SENSITIVE_METADATA_PRESENT");

    const tailed = new Uint8Array((await readFile(fixtureUrl)).length + 3);
    tailed.set(await readFile(fixtureUrl));
    tailed.set([1, 2, 3], tailed.length - 3);
    const trailing = await auditPrivacy(tailed);
    expect(trailing.trailingBytes).toBe(3);
    expect(trailing.gaps.some((gap) => gap.includes("end marker"))).toBe(true);

    const opaque = new Uint8Array((await readFile(fixtureUrl)).length + 6);
    opaque.set([0xff, 0xd8, 0xff, 0xef, 0x00, 0x04, 1, 2]);
    opaque.set((await readFile(fixtureUrl)).subarray(2), 8);
    const opaqueAudit = await auditPrivacy(opaque);
    expect(opaqueAudit.opaqueBlocks).toContainEqual(expect.objectContaining({ label: "APP15" }));
    expect(opaqueAudit.coverage.wholeFile).toBe("opaque");
    expect(opaqueAudit.reasonCodes).toContain("OPAQUE_JPEG_MARKER");

    const mpf = Uint8Array.from([0xff, 0xe2, 0x00, 0x06, 0x4d, 0x50, 0x46, 0x00]);
    const mpfInput = new Uint8Array((await readFile(fixtureUrl)).length + mpf.length);
    mpfInput.set((await readFile(fixtureUrl)).subarray(0, 2));
    mpfInput.set(mpf, 2);
    mpfInput.set((await readFile(fixtureUrl)).subarray(2), 2 + mpf.length);
    const mpfAudit = await auditPrivacy(mpfInput);
    expect(mpfAudit.opaqueBlocks).toContainEqual(expect.objectContaining({ label: "MPF multi-picture" }));
    expect(mpfAudit.gaps).toContain("JPEG MPF secondary images are not rewritten by lossless redaction.");

    const unknown = await auditPrivacy(Uint8Array.of(1, 2, 3));
    expect(unknown.complete).toBe(false);
    expect(unknown.coverage.wholeFile).toBe("unsupported");
    expect(unknown.reasonCodes).toContain("UNKNOWN_FORMAT");
    expect(unknown.gaps).toContain("The image format was not recognized, so metadata safety could not be established.");

    const abort = new AbortController();
    abort.abort();
    await expect(auditPrivacy(await readFile(fixtureUrl), { signal: abort.signal })).rejects.toMatchObject({ code: "ABORTED" });
    await expect(auditPrivacy(await readFile(fixtureUrl), { limits: { maxInputBytes: 1 } })).rejects.toMatchObject({ code: "LIMIT_EXCEEDED" });
  });

  it("accepts Blob and offset ArrayBufferView inputs without reading unrelated bytes", async () => {
    const fixture = new Uint8Array(await readFile(fixtureUrl));
    const blobResult = await parseMetadata(new Blob([fixture], { type: "image/jpeg" }));
    expect(blobResult.format).toBe("jpeg");

    const framed = new Uint8Array(fixture.length + 9);
    framed.fill(0xaa);
    framed.set(fixture, 4);
    const view = new DataView(framed.buffer, 4, fixture.length);
    const viewResult = await parseMetadata(view);
    expect(viewResult.format).toBe("jpeg");
    expect(viewResult.dimensions).toEqual({ width: 2, height: 2 });
  });

  it("supports selective JPEG metadata and Blob-backed header-only reads", async () => {
    const fixture = new Uint8Array(await readFile(fixtureUrl));
    const selected = await parseMetadata(fixture, { select: { groups: ["Dimensions", "EXIF"], tags: ["Make"] } });
    expect(selected.dimensions).toEqual({ width: 2, height: 2 });
    expect(selected.exif?.fields.map(({ name }) => name)).toEqual(["Make"]);
    expect(selected.fields.map(({ name }) => name)).toEqual(["Make"]);
    expect(selected.jfif).toBeNull();

    const padded = new Uint8Array(fixture.length + 128 * 1024);
    padded.set(fixture);
    const reads: number[] = [];
    const slicedBlob = {
      size: padded.length,
      arrayBuffer: () => Promise.resolve(padded.buffer.slice(0)),
      slice: (start = 0, end = padded.length) => {
        reads.push(end - start);
        return new Blob([padded.subarray(start, end)]);
      },
    } as unknown as Blob;
    const header = await parseMetadata(slicedBlob, { scope: "jpeg-header", select: { groups: ["Dimensions", "EXIF"] } });
    expect(header.completeness).toEqual({ complete: true, scope: "partial", reasons: ["JPEG scan data was intentionally not read."] });
    expect(header.dimensions).toEqual({ width: 2, height: 2 });
    expect(header.exif?.fields.some(({ name }) => name === "Make")).toBe(true);
    expect(Math.max(...reads)).toBeLessThanOrEqual(64 * 1024);

    const metadataReads: Array<readonly [number, number]> = [];
    const metadataBlob = {
      size: padded.length,
      arrayBuffer: () => Promise.resolve(padded.buffer.slice(0)),
      slice: (start = 0, end = padded.length) => {
        metadataReads.push([start, end]);
        return new Blob([padded.subarray(start, end)]);
      },
    } as unknown as Blob;
    const metadata = await parseMetadata(metadataBlob, { scope: "metadata", select: { groups: ["Dimensions", "EXIF"], tags: ["Make"] } });
    expect(metadata.exif?.fields.map(({ name }) => name)).toEqual(["Make"]);
    expect(metadata.dimensions).toEqual({ width: 2, height: 2 });
    expect(metadata.completeness).toMatchObject({ scope: "partial", inputBytes: padded.length });
    expect(metadata.completeness.bytesRead).toBeLessThan(padded.length);
    expect(metadataReads.some(([start, end]) => end - start < padded.length && start > 0)).toBe(true);
    const metadataExifBlock = metadata.blocks.find(({ family }) => family === "EXIF");
    expect(metadataExifBlock?.offset).toBeGreaterThan(0);
    expect(metadata.fields.find(({ name }) => name === "Make")?.source?.blockId).toBe(metadataExifBlock?.id);
    expect(metadata.telemetry?.readRequests).toBeGreaterThan(0);

    const scanMarker = firstJpegScanMarker(fixture);
    expect(scanMarker).toBeGreaterThan(0);
    const opaquePayload = new Uint8Array(60_000);
    const opaqueSegment = new Uint8Array(opaquePayload.length + 4);
    opaqueSegment.set([0xff, 0xe4, (opaquePayload.length + 2) >>> 8, (opaquePayload.length + 2) & 0xff]);
    opaqueSegment.set(opaquePayload, 4);
    const opaqueJpeg = insertBytes(fixture, scanMarker, opaqueSegment);
    const opaqueReads: Array<readonly [number, number]> = [];
    const opaqueBlob = {
      size: opaqueJpeg.length,
      arrayBuffer: () => Promise.resolve(opaqueJpeg.buffer.slice(0)),
      slice: (start = 0, end = opaqueJpeg.length) => {
        opaqueReads.push([start, end]);
        return new Blob([Uint8Array.from(opaqueJpeg.subarray(start, end)).buffer]);
      },
    } as unknown as Blob;
    const opaqueResult = await parseMetadata(opaqueBlob, { scope: "metadata", select: { groups: ["EXIF"], tags: ["Make"] } });
    expect(opaqueResult.exif?.fields.map(({ name }) => name)).toEqual(["Make"]);
    expect(opaqueResult.completeness.bytesRead).toBeLessThan(opaqueJpeg.length);
    expect(opaqueReads.some(([start, end]) => start <= scanMarker && end >= scanMarker + opaqueSegment.length)).toBe(false);

    const limited = await parseMetadata(new Blob([fixture]), { scope: "metadata", select: { groups: ["EXIF"] }, limits: { maxSegmentBytes: 1 } });
    expect(limited.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    const malformed = await parseMetadata(new Blob([Uint8Array.of(0xff, 0xd8, 0xff)]), { scope: "metadata" });
    expect(malformed.completeness.scope).toBe("full");
    expect(malformed.warnings.length).toBeGreaterThan(0);

    await expect(parseMetadata(fixture, { select: { groups: ["not-a-group"] as never } })).rejects.toThrow("Unknown metadata group");
  });

  it("reads PNG and WebP metadata scopes without materializing image payload chunks", async () => {
    const makeTrackingBlob = (source: Uint8Array) => {
      const reads: Array<readonly [number, number]> = [];
      const blob = {
        size: source.byteLength,
        arrayBuffer: () => Promise.resolve(source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength) as ArrayBuffer),
        slice: (start = 0, end = source.byteLength) => {
          reads.push([start, end]);
          return new Blob([Uint8Array.from(source.subarray(start, end)).buffer]);
        },
      } as unknown as Blob;
      return { blob, reads };
    };
    const pngSource = await readFile(pngFixtureUrl);
    const pngTracked = makeTrackingBlob(pngSource);
    const png = await parseMetadata(pngTracked.blob, { scope: "metadata", select: { groups: ["Dimensions", "EXIF"] } });
    expect(png.format).toBe("png");
    expect(png.exif?.fields.some(({ name }) => name === "Make")).toBe(true);
    expect(png.completeness).toMatchObject({ scope: "partial", inputBytes: pngSource.byteLength });
    expect(png.completeness.bytesRead).toBeLessThan(pngSource.byteLength);

    const webpSource = await readFile(webpFixtureUrl);
    const webpTracked = makeTrackingBlob(webpSource);
    const webp = await parseMetadata(webpTracked.blob, { scope: "metadata", select: { groups: ["Dimensions", "EXIF"] } });
    expect(webp.format).toBe("webp");
    expect(webp.exif?.fields.some(({ name }) => name === "Make")).toBe(true);
    expect(webp.completeness).toMatchObject({ scope: "partial", inputBytes: webpSource.byteLength });
    expect(webp.completeness.bytesRead).toBeLessThan(webpSource.byteLength);

    const tiffBase = await readFile(tiffMetadataFixtureUrl);
    const tiffSource = new Uint8Array(tiffBase.byteLength + 128 * 1024);
    tiffSource.set(tiffBase);
    const tiffTracked = makeTrackingBlob(tiffSource);
    const tiff = await parseMetadata(tiffTracked.blob, { scope: "metadata", select: { groups: ["Dimensions", "EXIF", "XMP", "ICC", "IPTC"] } });
    expect(tiff.format).toBe("tiff");
    expect(tiff.dimensions).toEqual({ width: 2, height: 2 });
    expect(tiff.exif).not.toBeNull();
    expect(tiff.xmp?.packets[0]).toContain("xmpmeta");
    expect(tiff.icc?.complete).toBe(true);
    expect(tiff.completeness).toMatchObject({ scope: "partial", inputBytes: tiffSource.byteLength });
    expect(tiff.completeness.bytesRead).toBeLessThan(tiffSource.byteLength);

    const tiffExifBase = await readFile(tiffFixtureUrl);
    const tiffExifSource = new Uint8Array(tiffExifBase.byteLength + 128 * 1024);
    tiffExifSource.set(tiffExifBase);
    const tiffExifTracked = makeTrackingBlob(tiffExifSource);
    const tiffExif = await parseMetadata(tiffExifTracked.blob, { scope: "metadata", select: { groups: ["Dimensions", "EXIF"], tags: ["Make"] } });
    expect(tiffExif.exif?.fields.map(({ name }) => name)).toEqual(["Make"]);
    expect(tiffExif.dimensions).toBeNull();
    expect(tiffExif.completeness.bytesRead).toBeLessThan(tiffExifSource.byteLength);

    const heifBase = await readFile(heifItemFixtureUrl);
    const heifSource = new Uint8Array(heifBase.byteLength + 128 * 1024);
    heifSource.set(heifBase);
    const heifTracked = makeTrackingBlob(heifSource);
    const heif = await parseMetadata(heifTracked.blob, { scope: "metadata" });
    expect(heif.format).toBe("heif");
    expect(heif.fields.find(({ name }) => name === "Make")?.value).toBe("OpenAI Camera");
    expect(heif.xmp?.packets[0]).toContain("xmpmeta");
    const heifMetadataBlock = heif.blocks.find((block) => (block.family === "EXIF" || block.family === "XMP") && block.status === "decoded");
    expect(heifMetadataBlock).toBeDefined();
    if (heifMetadataBlock === undefined) return;
    expect(typeof heifMetadataBlock.offset).toBe("number");
    expect(heif.completeness).toMatchObject({ scope: "partial", inputBytes: heifSource.byteLength });
    expect(heif.completeness.bytesRead).toBeLessThan(heifSource.byteLength);

    const avifBase = await readFile(avifIdatItemFixtureUrl);
    const avifSource = new Uint8Array(avifBase.byteLength + 128 * 1024);
    avifSource.set(avifBase);
    const avifTracked = makeTrackingBlob(avifSource);
    const avif = await parseMetadata(avifTracked.blob, { scope: "metadata", select: { groups: ["Dimensions", "EXIF", "XMP"] } });
    expect(avif.format).toBe("avif");
    expect(avif.fields.find(({ name }) => name === "GPSLatitude")?.value).toBe(51.5);
    expect(avif.xmp?.packets[0]).toContain("xmpmeta");
    expect(avif.completeness).toMatchObject({ scope: "partial", inputBytes: avifSource.byteLength });
    expect(avif.completeness.bytesRead).toBeLessThan(avifSource.byteLength);

    const directHeifBase = await readFile(heifFixtureUrl);
    const directHeifSource = new Uint8Array(directHeifBase.byteLength + 128 * 1024);
    directHeifSource.set(directHeifBase);
    const directHeif = await parseMetadata(makeTrackingBlob(directHeifSource).blob, { scope: "metadata" });
    expect(directHeif.fields.find(({ name }) => name === "Make")?.value).toBe("OpenAI Camera");
    expect(directHeif.completeness.scope).toBe("partial");

    const encodedAvifBase = await readFile(libavifMetadataFixtureUrl);
    const encodedAvifSource = new Uint8Array(encodedAvifBase.byteLength + 128 * 1024);
    encodedAvifSource.set(encodedAvifBase);
    const encodedAvif = await parseMetadata(makeTrackingBlob(encodedAvifSource).blob, { scope: "metadata" });
    expect(encodedAvif.icc?.byteLength).toBe(596);
    expect(encodedAvif.xmp?.packets[0]).toContain("x:xmpmeta");
    expect(encodedAvif.completeness.scope).toBe("partial");

    const dimensionsOnly = await parseMetadata(makeTrackingBlob(heifSource).blob, { scope: "metadata", select: { groups: ["Dimensions"] } });
    expect(dimensionsOnly.dimensions).toEqual({ width: 2, height: 2 });
    expect(dimensionsOnly.exif).toBeNull();
    expect(dimensionsOnly.xmp).toBeNull();
  });

  it("provides focused JPEG and redaction entry points", async () => {
    const fixture = await readFile(fixtureUrl);
    const parsed = await parseJpegMetadata(fixture, { scope: "jpeg-header", select: { tags: ["Make"] } });
    expect(parsed.completeness.scope).toBe("partial");
    expect(parsed.exif?.fields.map(({ name }) => name)).toEqual(["Make"]);
    const focusedMetadata = await parseJpegMetadata(new Blob([fixture, new Uint8Array(128 * 1024)]), { scope: "metadata", select: { groups: ["EXIF"], tags: ["Make"] } });
    expect(focusedMetadata.completeness.scope).toBe("partial");
    expect(focusedMetadata.completeness.bytesRead).toBeLessThan(focusedMetadata.completeness.inputBytes ?? Number.POSITIVE_INFINITY);
    expect(focusedMetadata.exif?.fields.map(({ name }) => name)).toEqual(["Make"]);
    const redacted = await redactFocusedMetadata(fixture, { remove: ["EXIF"] });
    expect(redacted.removed).toContainEqual({ target: "EXIF", occurrences: 1 });
  });

  it("does not decode unrequested PNG or WebP metadata families", async () => {
    const [png, webp] = await Promise.all([
      parseMetadata(await readFile(pngFixtureUrl), { select: { groups: ["Dimensions"] } }),
      parseMetadata(await readFile(webpFixtureUrl), { select: { groups: ["Dimensions"] } }),
    ]);
    expect(png.dimensions).toEqual({ width: 2, height: 2 });
    expect(png.exif).toBeNull();
    expect(png.icc).toBeNull();
    expect(png.xmp).toBeNull();
    expect(png.pngText).toEqual([]);
    expect(webp.dimensions).toEqual({ width: 2, height: 2 });
    expect(webp.exif).toBeNull();
    expect(webp.icc).toBeNull();
    expect(webp.xmp).toBeNull();
  });

  it("rejects Blob-like inputs whose arrayBuffer result is not an ArrayBuffer", async () => {
    const invalidBlob = { size: 1, arrayBuffer: () => Promise.resolve(1) } as unknown as Blob;
    await expect(parseMetadata(invalidBlob)).rejects.toMatchObject({ code: "INVALID_VALUE" });
  });

  it("accepts a genuine ArrayBuffer received from another JavaScript realm", async () => {
    const crossRealmBuffer = runInNewContext("Uint8Array.from([0xff, 0xd8, 0xff]).buffer") as ArrayBuffer;
    expect(crossRealmBuffer instanceof ArrayBuffer).toBe(false);

    const result = await parseMetadata(crossRealmBuffer);
    expect(result.format).toBe("jpeg");
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "TRUNCATED_DATA" }));
  });

  it("parses PNG EXIF, text chunks, zTXt, and XMP from a real fixture", async () => {
    const result = await parseMetadata(await readFile(pngFixtureUrl));
    const fields = fieldsByName(result.fields);
    expect(result.format).toBe("png");
    expect(result.mimeType).toBe("image/png");
    expect(result.dimensions).toEqual({ width: 2, height: 2 });
    expect(result.exif?.byteOrder).toBe("little-endian");
    expect(result.icc?.complete).toBe(true);
    expect(result.fields.find(({ name }) => name === "ProfileSize")?.value).toBe(132);
    expect(fields.get("Make")?.value).toBe("OpenAI Camera");
    expect(fields.get("Orientation")?.value).toBe(6);
    expect(result.pngText.map(({ keyword }) => keyword)).toEqual(["Author", "Comment", "Description", "Compressed", "XML:com.adobe.xmp"]);
    expect(result.pngText.find(({ keyword }) => keyword === "Comment")?.text).toBe("compressed text");
    expect(result.pngText.find(({ keyword }) => keyword === "Compressed")?.text).toBe("compressed iTXt text");
    expect(result.xmp?.packets[0]).toContain("xmpmeta");
    expect(result.warnings).toEqual([]);
    expect(result.completeness).toEqual({ complete: true, scope: "full", reasons: [] });
  });

  it("reports incomplete inspection and supports pre-aborted requests", async () => {
    const truncated = await parseMetadata(await readFile(pngTruncatedUrl));
    expect(truncated.completeness.complete).toBe(false);
    expect(truncated.completeness.reasons).toContain("TRUNCATED_DATA");

    const controller = new AbortController();
    controller.abort();
    await expect(parseMetadata(await readFile(fixtureUrl), { signal: controller.signal }))
      .rejects.toMatchObject({ code: "ABORTED" });
  });

  it("accepts PNG Blob input and reports malformed PNG fixtures safely", async () => {
    const png = await readFile(pngFixtureUrl);
    expect((await parseMetadata(new Blob([png], { type: "image/png" }))).format).toBe("png");
    const truncated = await parseMetadata(await readFile(pngTruncatedUrl));
    expect(truncated.warnings).toContainEqual(expect.objectContaining({ code: "TRUNCATED_DATA", severity: "error" }));
    const badText = await parseMetadata(await readFile(pngBadTextUrl));
    expect(badText.warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
    const badIcc = await parseMetadata(await readFile(pngBadIccUrl));
    expect(badIcc.warnings).toContainEqual(expect.objectContaining({ code: "UNSUPPORTED_COMPRESSION" }));
  });

  it("honors cancellation between metadata range reads", async () => {
    const bytes = new Uint8Array(await readFile(pngFixtureUrl));
    const liveSignal = new AbortController();
    expect((await parseMetadata(bytes, { signal: liveSignal.signal })).format).toBe("png");
    const controller = new AbortController();
    let reads = 0;
    const blobLike = {
      size: bytes.byteLength,
      arrayBuffer: () => Promise.resolve(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)),
      slice: (start: number, end: number) => ({
        arrayBuffer: () => {
          reads += 1;
          if (reads === 1) controller.abort();
          return Promise.resolve(bytes.slice(start, end).buffer);
        },
      }),
    } as unknown as Blob;

    await expect(parseMetadata(blobLike, { scope: "metadata", signal: controller.signal }))
      .rejects.toMatchObject({ code: "ABORTED" });
    expect(reads).toBe(1);
  });

  it("enforces PNG chunk and decompressed-text limits", async () => {
    const png = await readFile(pngFixtureUrl);
    const chunks = await parseMetadata(png, { limits: { maxPngChunks: 2 } });
    expect(chunks.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    const decompression = await parseMetadata(png, { limits: { maxDecompressedBytes: 4 } });
    expect(decompression.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    const metadata = await parseMetadata(png, { limits: { maxMetadataBytes: 1 } });
    expect(metadata.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    const aggregate = await parseMetadata(png, { limits: { maxDecompressedMetadataBytes: 4 } });
    expect(aggregate.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
  });

  it("decodes PNG iTXt text as UTF-8 regardless of its keyword", async () => {
    const png = new Uint8Array(await readFile(pngFixtureUrl));
    const text = new TextEncoder().encode("café 東京 😀");
    const data = new Uint8Array([
      ...new TextEncoder().encode("Description"), 0, 0, 0,
      0, // empty language
      0, // empty translated keyword
      ...text,
    ]);
    const result = await parseMetadata(insertBeforeIdat(png, pngChunk("iTXt", data)));
    expect(result.pngText.filter(({ keyword }) => keyword === "Description").at(-1)?.text).toBe("café 東京 😀");
    expect(result.warnings).toEqual([]);
  });

  it("still reports dimensions for an incomplete PNG container", async () => {
    const png = new Uint8Array(33);
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    new DataView(png.buffer).setUint32(8, 13);
    png.set([0x49, 0x48, 0x44, 0x52], 12);
    new DataView(png.buffer).setUint32(16, 320);
    new DataView(png.buffer).setUint32(20, 200);
    png.set([8, 2, 0, 0, 0], 24);
    new DataView(png.buffer).setUint32(29, crc32(png, 12, 29));
    const result = await parseMetadata(png);
    expect(result).toMatchObject({
      format: "png",
      mimeType: "image/png",
      dimensions: { width: 320, height: 200 },
      exif: null,
    });
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_PNG" }));
  });

  it("parses a standalone TIFF EXIF fixture through the public API", async () => {
    const result = await parseMetadata(await readFile(tiffFixtureUrl));
    const fields = fieldsByName(result.fields);
    expect(result.format).toBe("tiff");
    expect(result.mimeType).toBe("image/tiff");
    expect(result.exif?.byteOrder).toBe("little-endian");
    expect(fields.get("Make")?.value).toBe("OpenAI Camera");
    expect(fields.get("DateTimeOriginal")?.value).toBe("2026-09-07 12:34:56");
    expect(fields.get("GPSLongitude")?.value).toBeCloseTo(-7 / 60);
    expect(result.pngText).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("reports truncated standalone TIFF data without throwing", async () => {
    const result = await parseMetadata(await readFile(tiffTruncatedUrl));
    expect(result.format).toBe("tiff");
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));
  });

  it("parses TIFF XMP and ICC tags with bounded values", async () => {
    const result = await parseMetadata(await readFile(tiffMetadataFixtureUrl));
    expect(result.dimensions).toEqual({ width: 2, height: 2 });
    expect(result.xmp?.packets[0]).toContain("xmpmeta");
    expect(result.icc?.complete).toBe(true);
    expect(result.iptc?.fields?.filter(({ name }) => name === "Keywords")).toHaveLength(2);
    expect(result.fields.find(({ name }) => name === "ProfileSize")?.value).toBe(132);
    expect(result.warnings).toEqual([]);
  });

  it("applies selection while decoding TIFF metadata families", async () => {
    const dimensions = await parseMetadata(await readFile(tiffMetadataFixtureUrl), { select: { groups: ["Dimensions"] } });
    expect(dimensions.dimensions).toEqual({ width: 2, height: 2 });
    expect(dimensions.exif).toBeNull();
    expect(dimensions.xmp).toBeNull();
    expect(dimensions.icc).toBeNull();
    expect(dimensions.iptc).toBeNull();
    expect(dimensions.fields).toEqual([]);

    const xmp = await parseMetadata(await readFile(tiffMetadataFixtureUrl), { select: { groups: ["XMP"] } });
    expect(xmp.dimensions).toBeNull();
    expect(xmp.exif).toBeNull();
    expect(xmp.xmp?.packets[0]).toContain("xmpmeta");
    expect(xmp.icc).toBeNull();

    const icc = await parseMetadata(await readFile(tiffMetadataFixtureUrl), { select: { groups: ["ICC"] } });
    expect(icc.exif).toBeNull();
    expect(icc.xmp).toBeNull();
    expect(icc.icc?.complete).toBe(true);
    expect(icc.fields.find(({ name }) => name === "ProfileSize")?.value).toBe(132);
  });

  it("reports truncated TIFF metadata values without throwing", async () => {
    const result = await parseMetadata(await readFile(tiffMetadataTruncatedUrl));
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));
  });

  it("parses bounded BigTIFF metadata and rejects unsafe offsets", async () => {
    const bigTiff = new Uint8Array(103);
    const view = new DataView(bigTiff.buffer);
    bigTiff.set([0x49, 0x49]);
    view.setUint16(2, 43, true);
    view.setUint16(4, 8, true);
    view.setUint16(6, 0, true);
    view.setBigUint64(8, 16n, true);
    view.setBigUint64(16, 3n, true);
    const entry = (offset: number, tag: number, type: number, count: bigint, value: bigint): void => {
      view.setUint16(offset, tag, true);
      view.setUint16(offset + 2, type, true);
      view.setBigUint64(offset + 4, count, true);
      view.setBigUint64(offset + 12, value, true);
    };
    entry(24, 0x0100, 16, 1n, 640n);
    entry(44, 0x0101, 16, 1n, 480n);
    entry(64, 0x010f, 2, 11n, 92n);
    view.setBigUint64(84, 0n, true);
    bigTiff.set(new TextEncoder().encode("OpenAI Cam\0"), 92);
    const result = await parseMetadata(bigTiff);
    expect(result.format).toBe("tiff");
    expect(result.dimensions).toEqual({ width: 640, height: 480 });
    expect(result.fields.find(({ name }) => name === "Make")?.value).toBe("OpenAI Cam");
    expect(result.warnings).toEqual([]);

    view.setBigUint64(76, BigInt(Number.MAX_SAFE_INTEGER) + 1n, true);
    const unsafe = await parseMetadata(bigTiff);
    expect(unsafe.warnings).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));
  });

  it("validates BigTIFF headers and decodes big-endian inline values", async () => {
    const invalidHeader = Uint8Array.from([0x49, 0x49, 0x2b, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const invalid = await parseMetadata(invalidHeader);
    expect(invalid.warnings).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));

    const bigEndian = new Uint8Array(52);
    const view = new DataView(bigEndian.buffer);
    bigEndian.set([0x4d, 0x4d]);
    view.setUint16(2, 43);
    view.setUint16(4, 8);
    view.setUint16(6, 0);
    view.setBigUint64(8, 16n);
    view.setBigUint64(16, 1n);
    view.setUint16(24, 0x0100);
    view.setUint16(26, 4);
    view.setBigUint64(28, 1n);
    view.setUint32(36, 1024);
    view.setBigUint64(44, 0n);
    const decoded = await parseMetadata(bigEndian);
    expect(decoded.exif?.byteOrder).toBe("big-endian");
    expect(decoded.dimensions).toBeNull();
    expect(decoded.warnings).toEqual([]);
  });

  it("parses WebP EXIF and XMP chunks from a real fixture", async () => {
    const result = await parseMetadata(await readFile(webpFixtureUrl));
    const fields = fieldsByName(result.fields);
    expect(result.format).toBe("webp");
    expect(result.mimeType).toBe("image/webp");
    expect(result.dimensions).toEqual({ width: 2, height: 2 });
    expect(result.exif?.byteOrder).toBe("little-endian");
    expect(fields.get("Make")?.value).toBe("OpenAI Camera");
    expect(result.xmp?.packets[0]).toContain("xmpmeta");
    expect(result.icc?.complete).toBe(true);
    expect(fields.get("ProfileSize")?.value).toBe(132);
    expect(result.warnings).toEqual([]);
  });

  it("parses bounded GIF dimensions, comments, animation, and XMP extensions", async () => {
    const encoder = new TextEncoder();
    const xmp = encoder.encode('<x:xmpmeta xmlns:x="adobe:ns:meta/"/>');
    const gif = Uint8Array.from([
      ...encoder.encode("GIF89a"), 2, 0, 1, 0, 0, 0, 0,
      0x21, 0xff, 11, ...encoder.encode("NETSCAPE2.0"), 3, 1, 0, 0, 0,
      0x21, 0xfe, 5, ...encoder.encode("hello"), 0,
      0x21, 0xff, 11, ...encoder.encode("XMP DataXMP"), xmp.length, ...xmp, 1, 1, 0,
      0x2c, 0, 0, 0, 0, 2, 0, 1, 0, 0, 2, 2, 0x4c, 1, 0,
      0x3b,
    ]);
    const result = await parseMetadata(gif);
    expect(result).toMatchObject({ format: "gif", mimeType: "image/gif", dimensions: { width: 2, height: 1 } });
    expect(result.fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "Comment", value: "hello" }),
      expect.objectContaining({ name: "FrameCount", value: 1 }),
      expect.objectContaining({ name: "LoopCount", value: 0 }),
    ]));
    expect(result.xmp?.packets[0]).toContain("xmpmeta");
    expect(result.warnings).toEqual([]);
  });

  it("parses JPEG XL container XML metadata without decoding pixels", async () => {
    const packet = new TextEncoder().encode('<x:xmpmeta xmlns:x="adobe:ns:meta/"/>');
    const bytes = new Uint8Array(12 + 8 + packet.length);
    bytes.set([0, 0, 0, 12, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a]);
    const view = new DataView(bytes.buffer);
    view.setUint32(12, 8 + packet.length);
    bytes.set([0x78, 0x6d, 0x6c, 0x20], 16);
    bytes.set(packet, 20);
    const result = await parseMetadata(bytes);
    expect(result).toMatchObject({ format: "jxl", mimeType: "image/jxl", dimensions: null });
    expect(result.xmp?.packets).toEqual([new TextDecoder().decode(packet)]);
    expect(result.warnings).toEqual([]);

    const raw = await parseMetadata(Uint8Array.of(0xff, 0x0a, 0x00));
    expect(raw.warnings).toContainEqual(expect.objectContaining({ code: "UNSUPPORTED_STRUCTURE" }));

    const malformed = await parseMetadata(Uint8Array.of(0, 0, 0, 12, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a, 0, 0));
    expect(malformed.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_JXL" }));

    const tiff = Uint8Array.from([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const exifBox = new Uint8Array(12 + 8 + 4 + tiff.length);
    exifBox.set([0, 0, 0, 12, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a]);
    const exifView = new DataView(exifBox.buffer);
    exifView.setUint32(12, 12 + tiff.length);
    exifBox.set([0x45, 0x78, 0x69, 0x66], 16);
    exifView.setUint32(20, 0);
    exifBox.set(tiff, 24);
    const exif = await parseMetadata(exifBox);
    expect(exif.exif?.ifds[0]?.entryCount).toBe(0);
  });

  it("reports malformed GIF extension and image sub-block chains safely", async () => {
    const encoder = new TextEncoder();
    const malformed = Uint8Array.from([...encoder.encode("GIF89a"), 1, 0, 1, 0, 0, 0, 0, 0x21, 0xfe, 5, 0x41]);
    const result = await parseMetadata(malformed);
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_GIF" }));

    const truncatedImage = Uint8Array.from([...encoder.encode("GIF89a"), 1, 0, 1, 0, 0, 0, 0, 0x2c, 0]);
    const image = await parseMetadata(truncatedImage);
    expect(image.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_GIF" }));

    const truncatedPalette = Uint8Array.from([...encoder.encode("GIF89a"), 1, 0, 1, 0, 0x80, 0, 0]);
    const palette = await parseMetadata(truncatedPalette);
    expect(palette.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_GIF" }));
  });

  it("selects GIF and JPEG XL metadata families before decoding payloads", async () => {
    const encoder = new TextEncoder();
    const gif = Uint8Array.from([
      ...encoder.encode("GIF89a"), 1, 0, 1, 0, 0, 0, 0,
      0x21, 0xfe, 2, 0x68, 0x69, 0,
      0x3b,
    ]);
    const gifResult = await parseMetadata(gif, { select: { groups: ["XMP"] } });
    expect(gifResult.dimensions).toBeNull();
    expect(gifResult.fields).toEqual([]);
    const genericGif = await parseMetadata(gif);
    expect(getRotation(genericGif)).toBeNull();
    expect(getCaptureTime(genericGif).source).toBe("none");
    expect(getCapabilities("not-a-format" as never).format).toBe("unknown");

    const packet = encoder.encode("<x:xmpmeta/>");
    const jxl = new Uint8Array(12 + 16 + packet.length);
    jxl.set([0, 0, 0, 12, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a]);
    const view = new DataView(jxl.buffer);
    view.setUint32(12, 1);
    jxl.set([0x78, 0x6d, 0x6c, 0x20], 16);
    view.setBigUint64(20, BigInt(16 + packet.length));
    jxl.set(packet, 28);
    const selected = await parseMetadata(jxl, { select: { groups: ["EXIF"] } });
    expect(selected.xmp).toBeNull();
    expect(selected.warnings).toEqual([]);

    const invalidUtf8 = jxl.slice();
    invalidUtf8[28] = 0xff;
    const decoded = await parseMetadata(invalidUtf8);
    expect(decoded.warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));

    const malformedExif = new Uint8Array(12 + 8 + 3);
    malformedExif.set([0, 0, 0, 12, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a, 0, 0, 0, 11, 0x45, 0x78, 0x69, 0x66, 0, 0, 0]);
    const invalidExif = await parseMetadata(malformedExif);
    expect(invalidExif.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_EXIF" }));

    const unsafeSize = new Uint8Array(28);
    unsafeSize.set([0, 0, 0, 12, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a, 0, 0, 0, 1, 0x78, 0x6d, 0x6c, 0x20]);
    new DataView(unsafeSize.buffer).setBigUint64(20, BigInt(Number.MAX_SAFE_INTEGER) + 1n);
    const unsafe = await parseMetadata(unsafeSize);
    expect(unsafe.warnings).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));
  });

  it("bounds malformed WebP chunks and metadata", async () => {
    const truncated = await parseMetadata(await readFile(webpTruncatedUrl));
    expect(truncated.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_WEBP" }));
    const limited = await parseMetadata(await readFile(webpFixtureUrl), { limits: { maxSegmentBytes: 10 } });
    expect(limited.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
  });

  it("parses IPTC-IIM datasets from a real Photoshop APP13 fixture", async () => {
    const result = await parseMetadata(await readFile(iptcFixtureUrl));
    const iptcFields = result.fields.filter(({ ifd }) => ifd === "IPTC");
    expect(result.iptc?.byteLength).toBeGreaterThan(0);
    expect(result.iptc?.characterSet).toBe("utf-8");
    expect(iptcFields.find(({ name }) => name === "ObjectName")?.value).toBe("IPTC fixture");
    expect(iptcFields.find(({ name }) => name === "Urgency")?.value).toBe(5);
    expect(iptcFields.filter(({ name }) => name === "Keywords")).toHaveLength(2);
    expect(iptcFields.find(({ name }) => name === "CountryCode")?.value).toBe("GBR");
    expect(iptcFields.find(({ name }) => name === "Headline")?.value).toBe("IPTC headline – café");
    expect(iptcFields.find(({ name }) => name === "Headline")?.raw).toEqual(new TextEncoder().encode("IPTC headline – café"));
    expect(result.warnings).toEqual([]);
  });

  it("reports malformed IPTC datasets without discarding the JPEG", async () => {
    const result = await parseMetadata(await readFile(iptcMalformedUrl));
    expect(result.format).toBe("jpeg");
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
  });

  it("preserves raw IPTC bytes when declared UTF-8 is invalid", async () => {
    const bytes = new Uint8Array(await readFile(iptcFixtureUrl));
    const utf8Pair = Uint8Array.of(0xc3, 0xa9);
    let pairOffset = -1;
    for (let index = 0; index + 1 < bytes.length; index += 1) {
      if (bytes[index] === utf8Pair[0] && bytes[index + 1] === utf8Pair[1]) {
        pairOffset = index;
        break;
      }
    }
    expect(pairOffset).toBeGreaterThan(0);
    bytes[pairOffset] = 0xc3;
    bytes[pairOffset + 1] = 0x28;
    const result = await parseMetadata(bytes);
    expect(result.warnings.some(({ code, message }) => code === "INVALID_VALUE" && message.includes("UTF-8"))).toBe(true);
    const headline = result.fields.find(({ name }) => name === "Headline");
    expect(headline?.value).toEqual(Uint8Array.of(...new TextEncoder().encode("IPTC headline – caf"), 0xc3, 0x28));
  });

  it("inspects a complete ICC profile header from a real APP2 fixture", async () => {
    const result = await parseMetadata(await readFile(iccFixtureUrl));
    expect(result.icc).toMatchObject({ byteLength: 132, chunks: 1, complete: true });
    expect(result.fields.find(({ name }) => name === "ProfileSize")?.value).toBe(132);
    expect(result.fields.find(({ name }) => name === "CMMType")?.value).toBe("Lino");
    expect(result.fields.find(({ name }) => name === "DeviceClass")?.value).toBe("mntr");
    expect(result.fields.find(({ name }) => name === "ColorSpace")?.value).toBe("RGB ");
    expect(result.warnings).toEqual([]);
  });

  it("reports validated ICC profile-tag directory entries", () => {
    const profile = new Uint8Array(160);
    const view = new DataView(profile.buffer);
    view.setUint32(0, 160);
    profile.set(new TextEncoder().encode("acsp"), 36);
    view.setUint32(128, 1);
    profile.set(new TextEncoder().encode("desc"), 132);
    view.setUint32(136, 144);
    view.setUint32(140, 16);
    const inspected = inspectIccProfile([{ sequence: 1, total: 1, byteLength: profile.length, data: profile }], DEFAULT_LIMITS);
    expect(inspected.data?.tags).toEqual([{ signature: "desc", offset: 144, byteLength: 16, valid: true }]);
    expect(inspected.warnings).toEqual([]);

    view.setUint32(136, 145);
    const invalid = inspectIccProfile([{ sequence: 1, total: 1, byteLength: profile.length, data: profile }], DEFAULT_LIMITS);
    expect(invalid.data?.tags?.[0]).toMatchObject({ signature: "desc", valid: false });
    expect(invalid.warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
  });

  it("warns when an ICC profile declares an unsafe size", async () => {
    const result = await parseMetadata(await readFile(iccMalformedUrl));
    expect(result.icc).not.toBeNull();
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
  });

  it("warns when an ICC tag table extends beyond the assembled profile", async () => {
    const bytes = new Uint8Array(await readFile(iccFixtureUrl));
    const identifier = new TextEncoder().encode("ICC_PROFILE\0");
    let profileStart = -1;
    for (let index = 0; index + identifier.length <= bytes.length; index += 1) {
      if (identifier.every((value, offset) => bytes[index + offset] === value)) {
        profileStart = index + identifier.length + 2;
        break;
      }
    }
    expect(profileStart).toBeGreaterThan(0);
    new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).setUint32(profileStart + 128, 1);
    const result = await parseMetadata(bytes);
    expect(result.warnings.some(({ message }) => message.includes("tag table"))).toBe(true);
  });

  it("inspects HEIF EXIF/XMP boxes and dimensions", async () => {
    const result = await parseMetadata(await readFile(heifFixtureUrl));
    expect(result.format).toBe("heif");
    expect(result.dimensions).toEqual({ width: 2, height: 2 });
    expect(result.exif?.byteOrder).toBe("little-endian");
    expect(result.fields.find(({ name }) => name === "Make")?.value).toBe("OpenAI Camera");
    expect(result.xmp?.packets[0]).toContain("xmpmeta");
    expect(result.warnings).toEqual([]);
  });

  it("inspects AVIF metadata with the same bounded BMFF reader", async () => {
    const result = await parseMetadata(await readFile(avifFixtureUrl));
    expect(result.format).toBe("avif");
    expect(result.mimeType).toBe("image/avif");
    expect(result.exif).not.toBeNull();
    expect(result.xmp).not.toBeNull();
  });

  it("applies selection while decoding HEIF and AVIF metadata families", async () => {
    const dimensions = await parseMetadata(await readFile(heifItemFixtureUrl), { select: { groups: ["Dimensions"] } });
    expect(dimensions.dimensions).toEqual({ width: 2, height: 2 });
    expect(dimensions.exif).toBeNull();
    expect(dimensions.xmp).toBeNull();
    expect(dimensions.fields).toEqual([]);

    const selected = await parseMetadata(await readFile(avifItemFixtureUrl), { select: { tags: ["Make"] } });
    expect(selected.exif?.fields.map(({ name }) => name)).toEqual(["Make"]);
    expect(selected.fields.map(({ name }) => name)).toEqual(["Make"]);
    expect(selected.xmp).toBeNull();
    expect(selected.dimensions).toBeNull();

    const icc = await parseMetadata(await readFile(avifPrimaryIccFixtureUrl), { select: { groups: ["ICC"] } });
    expect(icc.exif).toBeNull();
    expect(icc.xmp).toBeNull();
    expect(icc.icc?.complete).toBe(true);
  });

  it("reports truncated HEIF boxes without throwing", async () => {
    const result = await parseMetadata(await readFile(heifTruncatedUrl));
    expect(result.format).toBe("heif");
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "TRUNCATED_DATA" }));
  });

  it("resolves bounded HEIF Exif and MIME XMP items through iinf/iloc", async () => {
    const result = await parseMetadata(await readFile(heifItemFixtureUrl));
    expect(result.format).toBe("heif");
    expect(result.dimensions).toEqual({ width: 2, height: 2 });
    expect(result.fields.find(({ name }) => name === "Make")?.value).toBe("OpenAI Camera");
    expect(result.xmp?.packets).toHaveLength(1);
    expect(result.xmp?.packets[0]).toContain("xmpmeta");
    const heifExifBlock = result.blocks.find((block) => block.family === "EXIF" && block.container === "HEIF Exif item");
    const heifXmpBlock = result.blocks.find((block) => block.family === "XMP" && block.container === "HEIF MIME XMP item");
    expect(heifExifBlock?.associatedImage).toBe("item:3");
    expect(heifXmpBlock?.associatedImage).toBe("item:3");
    expect(typeof heifExifBlock?.offset).toBe("number");
    expect(result.warnings).toEqual([]);
  });

  it("resolves the same bounded item metadata path in AVIF", async () => {
    const result = await parseMetadata(await readFile(avifItemFixtureUrl));
    expect(result.format).toBe("avif");
    expect(result.mimeType).toBe("image/avif");
    expect(result.fields.find(({ name }) => name === "GPSLongitude")?.value).toBeCloseTo(-7 / 60);
    expect(result.xmp?.packets[0]).toContain("xmpmeta");
    expect(result.warnings).toEqual([]);
  });

  it("parses an encoder-produced AVIF with primary dimensions, Exif, XMP, and ICC", async () => {
    const result = await parseMetadata(await readFile(libavifMetadataFixtureUrl));
    expect(result.format).toBe("avif");
    expect(result.dimensions).toEqual({ width: 403, height: 302 });
    expect(result.fields.find(({ name }) => name === "Make")?.value).toBe("Google");
    expect(result.fields.find(({ name }) => name === "GPSLatitude")?.value).toBe(0);
    expect(result.xmp?.packets).toHaveLength(1);
    expect(result.xmp?.packets[0]).toContain("x:xmpmeta");
    expect(result.icc).toMatchObject({ byteLength: 596, chunks: 1, complete: true });
    expect(result.warnings).toEqual([]);
  });

  it("parses an encoder-produced HEIC with primary dimensions, Exif, and XMP", async () => {
    const result = await parseMetadata(await readFile(sipsHeifMetadataFixtureUrl));
    expect(result.format).toBe("heif");
    expect(result.dimensions).toEqual({ width: 2, height: 2 });
    expect(result.fields.find(({ name }) => name === "Make")?.value).toBe("OpenAI Camera");
    expect(result.fields.find(({ name }) => name === "GPSLongitude")?.value).toBeCloseTo(-7 / 60);
    expect(result.xmp?.packets).toHaveLength(1);
    expect(result.warnings).toEqual([]);
  });

  it("does not resolve item IDs, locations, or idat bytes across MetaBoxes", async () => {
    const result = await parseMetadata(await readFile(heifCrossMetaItemFixtureUrl));
    expect(result.format).toBe("heif");
    expect(result.exif).toBeNull();
    expect(result.fields).toEqual([]);
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));
  });

  it("uses cdsc item references to select metadata describing the primary HEIF item", async () => {
    const result = await parseMetadata(await readFile(heifReferencedExifFixtureUrl));
    expect(result.format).toBe("heif");
    expect(result.fields.find(({ name }) => name === "Make")?.value).toBe("OpenAI Camera");
    expect(result.xmp).toBeNull();
    expect(result.warnings).toEqual([]);
  });

  it("resolves HEIF and AVIF metadata items stored in a bounded idat box", async () => {
    const [heif, avif] = await Promise.all([
      parseMetadata(await readFile(heifIdatItemFixtureUrl)),
      parseMetadata(await readFile(avifIdatItemFixtureUrl)),
    ]);
    expect(heif.format).toBe("heif");
    expect(heif.fields.find(({ name }) => name === "Make")?.value).toBe("OpenAI Camera");
    expect(heif.xmp?.packets[0]).toContain("xmpmeta");
    expect(heif.warnings).toEqual([]);
    expect(avif.format).toBe("avif");
    expect(avif.fields.find(({ name }) => name === "GPSLatitude")?.value).toBe(51.5);
    expect(avif.xmp?.packets[0]).toContain("xmpmeta");
    expect(avif.warnings).toEqual([]);
  });

  it("uses primary-item property associations when thumbnails have another spatial extent", async () => {
    const [heif, avif] = await Promise.all([
      parseMetadata(await readFile(heifPrimaryDimensionsUrl)),
      parseMetadata(await readFile(avifPrimaryDimensionsUrl)),
    ]);
    expect(heif.dimensions).toEqual({ width: 2, height: 2 });
    expect(avif.dimensions).toEqual({ width: 2, height: 2 });
    expect(heif.warnings).toEqual([]);
    expect(avif.warnings).toEqual([]);
  });

  it("handles indexed and to-end HEIF idat item extents", async () => {
    const [indexed, tail] = await Promise.all([
      parseMetadata(await readFile(heifIndexedIdatItemFixtureUrl)),
      parseMetadata(await readFile(heifTailIdatItemFixtureUrl)),
    ]);
    expect(indexed.fields.find(({ name }) => name === "Make")?.value).toBe("OpenAI Camera");
    expect(indexed.xmp?.packets[0]).toContain("xmpmeta");
    expect(indexed.warnings).toEqual([]);
    expect(tail.xmp?.packets[0]).toContain("xmpmeta");
    expect(tail.warnings).toEqual([]);
  });

  it("inspects a primary HEIF or AVIF ICC colour property without reading image data", async () => {
    const [heif, avif] = await Promise.all([
      parseMetadata(await readFile(heifPrimaryIccFixtureUrl)),
      parseMetadata(await readFile(avifPrimaryIccFixtureUrl)),
    ]);
    expect(heif.icc).toMatchObject({ byteLength: 132, chunks: 1, complete: true });
    expect(heif.fields.find(({ ifd, name }) => ifd === "ICC" && name === "ColorSpace")?.value).toBe("RGB ");
    const heifIccBlock = heif.blocks.find((block) => block.family === "ICC" && block.container === "HEIF colr item property");
    expect(heifIccBlock?.associatedImage).toBe("item:3");
    expect(typeof heifIccBlock?.offset).toBe("number");
    expect(avif.icc).toMatchObject({ byteLength: 132, chunks: 1, complete: true });
    expect(avif.warnings).toEqual([]);

    const profileLimited = await parseMetadata(await readFile(heifPrimaryIccFixtureUrl), { limits: { maxMetadataBytes: 600 } });
    expect(profileLimited.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    expect(profileLimited.fields.some(({ ifd }) => ifd === "ICC")).toBe(false);

    const malformed = await parseMetadata(await readFile(heifMalformedPrimaryIccFixtureUrl));
    expect(malformed.icc).not.toBeNull();
    expect(malformed.warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
  });

  it("inspects bounded primary AVIF nclx colour parameters", async () => {
    const result = await parseMetadata(await readFile(avifNclxFixtureUrl));
    expect(result.format).toBe("avif");
    expect(result.nclx).toEqual({ colourPrimaries: 9, transferCharacteristics: 16, matrixCoefficients: 9, fullRange: true });
    expect(result.icc).toBeNull();
    expect(result.warnings).toEqual([]);
    expect(getCapabilities("avif").metadata).toEqual(expect.arrayContaining(["Nclx", "Transform"]));

    const malformed = new Uint8Array(await readFile(avifNclxFixtureUrl));
    const nclx = findFourCC(malformed, "nclx");
    expect(nclx).toBeGreaterThan(0);
    malformed[nclx + 10] = 1;
    const rejected = await parseMetadata(malformed);
    expect(rejected.nclx).toBeUndefined();
    expect(rejected.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));
  });

  it("warns rather than guessing conflicting or malformed HEIF property associations", async () => {
    const conflicting = await parseMetadata(await readFile(heifConflictingPrimaryDimensionsUrl));
    expect(conflicting.dimensions).toBeNull();
    expect(conflicting.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));

    const item = new Uint8Array(await readFile(heifIdatItemFixtureUrl));
    const pitm = findFourCC(item, "pitm");
    const ipma = findFourCC(item, "ipma");
    expect(pitm).toBeGreaterThan(0);
    expect(ipma).toBeGreaterThan(0);
    item[pitm + 4] = 2;
    item[ipma + 7] = 2;
    const malformed = await parseMetadata(item);
    expect(malformed.warnings.filter(({ code }) => code === "MALFORMED_HEIF")).toHaveLength(2);

    const zeroProperty = new Uint8Array(await readFile(heifIdatItemFixtureUrl));
    zeroProperty[findFourCC(zeroProperty, "ipma") + 15] = 0;
    const reservedIndex = await parseMetadata(zeroProperty);
    expect(reservedIndex.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));

    const missingProperty = new Uint8Array(await readFile(heifIdatItemFixtureUrl));
    missingProperty[findFourCC(missingProperty, "ipma") + 15] = 127;
    const unresolvedProperty = await parseMetadata(missingProperty);
    expect(unresolvedProperty.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));

    const truncatedAssociations = new Uint8Array(await readFile(heifIdatItemFixtureUrl));
    truncatedAssociations[findFourCC(truncatedAssociations, "ipma") + 14] = 4;
    const unsafeAssociations = await parseMetadata(truncatedAssociations);
    expect(unsafeAssociations.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));

    const unsupportedInfo = new Uint8Array(await readFile(heifIdatItemFixtureUrl));
    unsupportedInfo[findFourCC(unsupportedInfo, "infe") + 4] = 1;
    const unsupportedInfe = await parseMetadata(unsupportedInfo);
    expect(unsupportedInfe.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));

    const unterminatedMime = new Uint8Array(await readFile(heifIdatItemFixtureUrl));
    const firstInfe = findFourCC(unterminatedMime, "infe");
    const secondInfe = findFourCC(unterminatedMime.subarray(firstInfe + 4), "infe") + firstInfe + 4;
    const secondInfeSize = new DataView(unterminatedMime.buffer).getUint32(secondInfe - 4);
    unterminatedMime[secondInfe - 4 + secondInfeSize - 1] = 0x61;
    const malformedMime = await parseMetadata(unterminatedMime);
    expect(malformedMime.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));

    const duplicatePrimary = new Uint8Array(await readFile(heifIdatItemFixtureUrl));
    duplicatePrimary.set(new TextEncoder().encode("pitm"), findFourCC(duplicatePrimary, "iinf"));
    const duplicatePitm = await parseMetadata(duplicatePrimary);
    expect(duplicatePitm.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));

    const duplicatePropertyContainer = new Uint8Array(await readFile(heifIdatItemFixtureUrl));
    duplicatePropertyContainer.set(new TextEncoder().encode("ipco"), findFourCC(duplicatePropertyContainer, "ipma"));
    const duplicateIpco = await parseMetadata(duplicatePropertyContainer);
    expect(duplicateIpco.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));

    const malformedReference = new Uint8Array(await readFile(heifReferencedExifFixtureUrl));
    const cdsc = findFourCC(malformedReference, "cdsc");
    expect(cdsc).toBeGreaterThan(0);
    malformedReference[cdsc + 6] = 2;
    const rejectedReference = await parseMetadata(malformedReference);
    expect(rejectedReference.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));
  });

  it("applies HEIF item scan, item-info, and item-size limits before resolving data", async () => {
    const bytes = await readFile(heifIdatItemFixtureUrl);
    const limitedScan = await parseMetadata(bytes, { limits: { maxSegments: 1 } });
    expect(limitedScan.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));

    const limitedName = await parseMetadata(bytes, { limits: { maxStringBytes: 1 } });
    expect(limitedName.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));

    const limitedItem = await parseMetadata(bytes, { limits: { maxMetadataBytes: 64 } });
    expect(limitedItem.warnings).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));
  });

  it("reports unsafe or truncated HEIF item extents without throwing", async () => {
    const result = await parseMetadata(await readFile(heifItemTruncatedUrl));
    expect(result.format).toBe("heif");
    expect(result.warnings.some(({ code }) => code === "TRUNCATED_DATA" || code === "UNSAFE_OFFSET")).toBe(true);
  });

  it("validates direct HEIF Exif offsets", async () => {
    const tiff = new Uint8Array(await readFile(tiffFixtureUrl));
    const exifPayload = new Uint8Array(4 + tiff.length);
    new DataView(exifPayload.buffer).setUint32(0, 0);
    exifPayload.set(tiff, 4);
    const makeBox = (type: string, payload: Uint8Array): Uint8Array => {
      const result = new Uint8Array(8 + payload.length);
      new DataView(result.buffer).setUint32(0, result.length);
      result.set(new TextEncoder().encode(type), 4);
      result.set(payload, 8);
      return result;
    };
    const direct = makeBox("meta", new Uint8Array([
      0, 0, 0, 0,
      ...makeBox("Exif", exifPayload),
    ]));
    const ftyp = makeBox("ftyp", new TextEncoder().encode("heic\0\0\0\0"));
    const parsed = await parseMetadata(new Uint8Array([...ftyp, ...direct]));
    expect(parsed.fields.find(({ name }) => name === "Make")?.value).toBe("OpenAI Camera");
  });

  it("uses the standard HEIF Exif offset relative to its four-byte prefix", async () => {
    const fixture = new Uint8Array(await readFile(libavifMetadataFixtureUrl));
    fixture[0x407] = 1;
    const result = await parseMetadata(fixture);
    expect(result.exif).toBeNull();
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));
  });

  it("rejects unsafe HEIF item locations without resolving external or unsupported data", async () => {
    const item = new Uint8Array(await readFile(heifItemFixtureUrl));
    const iloc = findFourCC(item, "iloc");
    expect(iloc).toBeGreaterThan(0);
    new DataView(item.buffer).setUint16(iloc + 14, 1);
    const externalReference = await parseMetadata(item);
    expect(externalReference.warnings).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));

    const idatItem = new Uint8Array(await readFile(heifIdatItemFixtureUrl));
    const idatIloc = findFourCC(idatItem, "iloc");
    expect(idatIloc).toBeGreaterThan(0);
    new DataView(idatItem.buffer).setUint16(idatIloc + 14, 2);
    const unsupportedMethod = await parseMetadata(idatItem);
    expect(unsupportedMethod.warnings).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));

    const malformed = new Uint8Array(await readFile(heifIdatItemFixtureUrl));
    new DataView(malformed.buffer).setUint8(idatIloc + 9, 0x20);
    const malformedLocation = await parseMetadata(malformed);
    expect(malformedLocation.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));

    const reservedConstructionBits = new Uint8Array(await readFile(heifIdatItemFixtureUrl));
    new DataView(reservedConstructionBits.buffer).setUint16(idatIloc + 14, 0x10);
    const reservedConstruction = await parseMetadata(reservedConstructionBits);
    expect(reservedConstruction.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));

    const limitedLocations = await parseMetadata(await readFile(heifIdatItemFixtureUrl), { limits: { maxIfdEntries: 1 } });
    expect(limitedLocations.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
  });

  it("distinguishes unknown and truncated signatures", async () => {
    expect((await parseMetadata(Uint8Array.of(1, 2, 3))).warnings[0]?.code).toBe("UNKNOWN_FORMAT");
    expect((await parseMetadata(Uint8Array.of(0xff, 0xd8))).warnings[0]?.code).toBe("TRUNCATED_DATA");
  });

  it("rejects an oversized input before parsing", async () => {
    try {
      await parseMetadata(Uint8Array.of(1, 2, 3, 4), { limits: { maxInputBytes: 3 } });
      expect.unreachable("oversized input should reject");
    } catch (error) {
      expect(error).toBeInstanceOf(MetadataError);
      if (error instanceof MetadataError) expect(error.code).toBe("LIMIT_EXCEEDED");
    }
  });

  it("warns for truncated scan data, missing frames, invalid frames, and duplicate SOI", async () => {
    const validScanHeader = [0xff, 0xda, 0x00, 0x08, 1, 1, 0, 0, 63, 0];
    const truncated = await parseMetadata(Uint8Array.from([0xff, 0xd8, ...validScanHeader]));
    expect(truncated.warnings).toContainEqual(expect.objectContaining({ code: "TRUNCATED_DATA", severity: "error" }));

    const noFrame = await parseMetadata(Uint8Array.from([0xff, 0xd8, ...validScanHeader, 0xff, 0xd9]));
    expect(noFrame.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_JPEG" }));

    const badFrame = await parseMetadata(Uint8Array.from([
      0xff, 0xd8,
      0xff, 0xc0, 0x00, 0x08, 8, 0, 1, 0, 1, 1,
      ...validScanHeader,
      0xff, 0xd9,
    ]));
    expect(badFrame.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_JPEG" }));

    const duplicateSoi = await parseMetadata(Uint8Array.from([0xff, 0xd8, 0xff, 0xd8, 0xff, 0xd9]));
    expect(duplicateSoi.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_JPEG" }));
  });
});

describe("public redaction API", () => {
  it("accepts omitted preserve options and honors whole-metadata preservation", async () => {
    const fixture = await readFile(pngFixtureUrl);
    const removed = await redactMetadata(fixture, { remove: ["EXIF"] });
    expect(removed.warnings).toEqual([]);
    expect(removed.removed).toEqual([{ target: "EXIF", occurrences: 1 }]);
    expect(removed.outcome).toEqual({ successful: true, complete: true, unapplied: [], reasons: [] });

    const preservedAll = await redactMetadata(fixture, { remove: ["AllMetadata"], preserve: ["AllMetadata"] });
    expect(preservedAll.data).toEqual(Uint8Array.from(fixture));
    expect(preservedAll.removed).toEqual([]);

    const preservedField = await redactMetadata(fixture, { remove: ["AllMetadata"], preserve: ["Orientation"] });
    expect(preservedField.removed).not.toContainEqual(expect.objectContaining({ target: "EXIF" }));
    expect(preservedField.warnings).toEqual([]);
    const selectivelyPreserved = await parseMetadata(preservedField.data);
    expect(selectivelyPreserved.exif).not.toBeNull();
    expect(fieldsByName(selectivelyPreserved.fields).get("Orientation")?.value).toBe(6);
    expect(fieldsByName(selectivelyPreserved.fields).has("Make")).toBe(false);
  });

  it("reports unknown redaction targets without changing bytes", async () => {
    const fixture = await readFile(pngFixtureUrl);
    const result = await redactMetadata(fixture, { remove: ["FutureMetadata"] as never });
    expect(result.data).toEqual(Uint8Array.from(fixture));
    expect(result.removed).toEqual([]);
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "REDACTION_SKIPPED" }));
    expect(result.outcome.successful).toBe(false);
  });

  it("removes PNG EXIF/text/XMP chunks without changing IDAT bytes", async () => {
    const fixture = await readFile(pngFixtureUrl);
    const beforePixels = pngIdatData(fixture);
    const cleaned = await redactMetadata(fixture, { remove: ["AllMetadata"], preserve: ["ICC"] });
    const reparsed = await parseMetadata(cleaned.data);
    expect(cleaned.format).toBe("png");
    expect(cleaned.removed).toEqual(expect.arrayContaining([
      expect.objectContaining({ target: "EXIF", occurrences: 1 }),
      expect.objectContaining({ target: "XMP", occurrences: 1 }),
      expect.objectContaining({ target: "PNGText", occurrences: 4 }),
    ]));
    expect(reparsed.exif).toBeNull();
    expect(reparsed.xmp).toBeNull();
    expect(reparsed.dimensions).toEqual({ width: 2, height: 2 });
    expect(pngIdatData(cleaned.data)).toEqual(beforePixels);
  });

  it("removes WebP metadata chunks without changing image payload chunks", async () => {
    const fixture = new Uint8Array(await readFile(webpFixtureUrl));
    const cleaned = await redactMetadata(fixture, { remove: ["AllMetadata"] });
    expect(cleaned.format).toBe("webp");
    expect(cleaned.removed).toEqual(expect.arrayContaining([
      expect.objectContaining({ target: "EXIF" }),
      expect.objectContaining({ target: "XMP" }),
    ]));
    expect(new TextDecoder("latin1").decode(cleaned.data)).not.toContain("EXIF");
    expect(new TextDecoder("latin1").decode(cleaned.data)).not.toContain("XMP ");
    expect((await parseMetadata(cleaned.data)).dimensions).toEqual((await parseMetadata(fixture)).dimensions);
  });

  it("returns strict sanitized PNG bytes only when the policy is satisfied", async () => {
    const fixture = await readFile(pngFixtureUrl);
    const sanitized = await sanitizeMetadata(fixture);
    expect(sanitized.successful).toBe(true);
    expect(sanitized.data).not.toBeNull();
    if (sanitized.data === null) throw new Error("expected sanitized bytes");
    const result = await parseMetadata(sanitized.data);
    expect(result.xmp).toBeNull();
    expect(result.pngText).toEqual([]);
    expect(fieldsByName(result.fields).get("Orientation")?.value).toBe(6);
    expect(fieldsByName(result.fields).has("Make")).toBe(false);
  });

  it("refuses strict sanitization when an opaque JPEG metadata block remains", async () => {
    const fixture = await readFile(fixtureUrl);
    const opaque = new Uint8Array(fixture.length + 6);
    opaque.set([0xff, 0xd8, 0xff, 0xef, 0x00, 0x04, 1, 2]);
    opaque.set(fixture.subarray(2), 8);
    const sanitized = await sanitizeMetadata(opaque);
    expect(sanitized.successful).toBe(false);
    expect(sanitized.data).toBeNull();
    expect(sanitized.reasonCodes).toContain("OPAQUE_JPEG_MARKER");
  });

  it("refuses a WebP strict policy that cannot preserve EXIF orientation selectively", async () => {
    const sanitized = await sanitizeMetadata(await readFile(webpFixtureUrl));
    expect(sanitized.successful).toBe(false);
    expect(sanitized.data).toBeNull();
    expect(sanitized.reasons.some((reason) => reason.includes("selective EXIF"))).toBe(true);
  });

  it("keeps PNG XMP while removing ordinary text when targets are explicit", async () => {
    const fixture = await readFile(pngFixtureUrl);
    const cleaned = await redactMetadata(fixture, { remove: ["PNGText"], preserve: ["XMP"] });
    const reparsed = await parseMetadata(cleaned.data);
    expect(cleaned.removed).toEqual([{ target: "PNGText", occurrences: 4 }]);
    expect(reparsed.pngText.map(({ keyword }) => keyword)).toEqual(["XML:com.adobe.xmp"]);
    expect(reparsed.xmp?.packets).toHaveLength(1);
    expect(pngIdatData(cleaned.data)).toEqual(pngIdatData(fixture));
  });

  it("fails PNG redaction atomically when metadata exceeds the surgery limit", async () => {
    const fixture = new Uint8Array(await readFile(pngFixtureUrl));
    const cleaned = await redactMetadata(fixture, { remove: ["AllMetadata"], limits: { maxSegmentBytes: 1 } });
    expect(cleaned.data).toEqual(fixture);
    expect(cleaned.removed).toEqual([]);
    expect(cleaned.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED", severity: "error" }));
  });

  it("removes the example privacy fields from a real JPEG and preserves other EXIF", async () => {
    const fixture = new Uint8Array(await readFile(fixtureUrl));
    const cleaned = await redactMetadata(fixture, {
      remove: ["GPS", "SerialNumber", "DateTimeOriginal"],
      preserve: ["ICC"],
    });
    const reparsed = await parseMetadata(cleaned.data);
    const names = reparsed.fields.map(({ name }) => name);

    expect(cleaned.warnings).toEqual([]);
    expect(cleaned.removed.map(({ target }) => target)).toEqual(["GPS", "SerialNumber", "DateTimeOriginal"]);
    expect(names).not.toContain("GPSLatitude");
    expect(names).not.toContain("GPSLongitude");
    expect(names).not.toContain("GPSAltitude");
    expect(names).not.toContain("DateTimeOriginal");
    expect(names).toContain("Make");
    expect(new TextDecoder("latin1").decode(cleaned.data)).not.toContain("SECRET-123");
  });

  it("drops the entire EXIF segment without changing dimensions", async () => {
    const fixture = await readFile(fixtureUrl);
    const cleaned = await redactMetadata(fixture, { remove: ["EXIF"] });
    const reparsed = await parseMetadata(cleaned.data);
    expect(reparsed.exif).toBeNull();
    expect(reparsed.dimensions).toEqual({ width: 2, height: 2 });
    expect(cleaned.data.length).toBeLessThan(fixture.length);
  });
});
