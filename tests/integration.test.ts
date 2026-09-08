import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import {
  MetadataError,
  parseMetadata,
  redactMetadata,
  type MetadataField,
} from "../src/index.js";

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

function crc32(bytes: Uint8Array, start: number, end: number): number {
  let crc = 0xffffffff;
  for (let offset = start; offset < end; offset += 1) {
    crc ^= bytes[offset] ?? 0;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
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

  it("enforces PNG chunk and decompressed-text limits", async () => {
    const png = await readFile(pngFixtureUrl);
    const chunks = await parseMetadata(png, { limits: { maxPngChunks: 2 } });
    expect(chunks.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    const decompression = await parseMetadata(png, { limits: { maxDecompressedBytes: 4 } });
    expect(decompression.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    const metadata = await parseMetadata(png, { limits: { maxMetadataBytes: 1 } });
    expect(metadata.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
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

  it("reports truncated TIFF metadata values without throwing", async () => {
    const result = await parseMetadata(await readFile(tiffMetadataTruncatedUrl));
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));
  });

  it("does not claim BigTIFF support", async () => {
    const bigTiff = Uint8Array.from([0x49, 0x49, 0x2b, 0x00, 0x08, 0x00, 0x00, 0x00]);
    const result = await parseMetadata(bigTiff);
    expect(result.format).toBe("tiff");
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "UNSUPPORTED_FORMAT" }));
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

  it("reports unsafe or truncated HEIF item extents without throwing", async () => {
    const result = await parseMetadata(await readFile(heifItemTruncatedUrl));
    expect(result.format).toBe("heif");
    expect(result.warnings.some(({ code }) => code === "TRUNCATED_DATA" || code === "UNSAFE_OFFSET")).toBe(true);
  });

  it("validates direct HEIF Exif offsets and rejects unsupported item construction", async () => {
    const tiff = new Uint8Array(await readFile(tiffFixtureUrl));
    const exifPayload = new Uint8Array(4 + tiff.length);
    new DataView(exifPayload.buffer).setUint32(0, 4);
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

    const item = new Uint8Array(await readFile(heifItemFixtureUrl));
    let iloc = -1;
    for (let offset = 0; offset + 4 <= item.length; offset += 1) {
      if (String.fromCharCode(...item.subarray(offset, offset + 4)) === "iloc") { iloc = offset; break; }
    }
    expect(iloc).toBeGreaterThan(0);
    new DataView(item.buffer).setUint16(iloc + 18, 2);
    const unsupported = await parseMetadata(item);
    expect(unsupported.warnings).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));
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
