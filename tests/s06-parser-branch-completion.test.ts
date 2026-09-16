import { deflateSync } from "node:zlib";
import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { parseJpeg } from "../src/parsers/jpeg.js";
import { parsePng, parsePngDimensions } from "../src/parsers/png.js";
import { parseWebp, parseWebpDimensions } from "../src/parsers/webp.js";
import { isTiffHeader, parseTiffMetadata } from "../src/parsers/tiff.js";
import { inspectIccProfile } from "../src/metadata/icc.js";
import { parseJfif } from "../src/metadata/jfif.js";
import { resolveLimits } from "../src/security/limits.js";
import { resolveSelection } from "../src/selection.js";

const encoder = new TextEncoder();
const allGroups = resolveSelection({ groups: ["Dimensions", "EXIF", "XMP", "ICC", "JFIF", "PNGText"] });
const limits = resolveLimits({
  maxInputBytes: 256 * 1024,
  maxMetadataBytes: 64 * 1024,
  maxSegmentBytes: 64 * 1024,
  maxValueBytes: 64 * 1024,
  maxStringBytes: 16 * 1024,
  maxDecompressedBytes: 16 * 1024,
  maxDecompressedMetadataBytes: 16 * 1024,
  maxWarnings: 128,
  maxSegments: 128,
  maxPngChunks: 128,
  maxIfdEntries: 128,
});

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function u32(value: number, littleEndian = false): Uint8Array {
  const output = new Uint8Array(4);
  new DataView(output.buffer).setUint32(0, value >>> 0, littleEndian);
  return output;
}

function crc32(bytes: Uint8Array, start: number, end: number): number {
  let crc = 0xffffffff;
  for (let offset = start; offset < end; offset += 1) {
    crc ^= bytes[offset] ?? 0;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function jpegSegment(marker: number, payload: Uint8Array): Uint8Array {
  return concat(Uint8Array.of(0xff, marker, (payload.length + 2) >>> 8, (payload.length + 2) & 0xff), payload);
}

function jpegFile(parts: readonly Uint8Array[], entropy = Uint8Array.of(1, 2, 3)): Uint8Array {
  return concat(Uint8Array.of(0xff, 0xd8), ...parts, jpegSegment(0xda, Uint8Array.of(1, 1, 0, 0, 0x3f, 0)), entropy, Uint8Array.of(0xff, 0xd9));
}

function sof(width: number, height: number, componentCount = 1): Uint8Array {
  return jpegSegment(0xc0, Uint8Array.of(8, (height >>> 8) & 0xff, height & 0xff, (width >>> 8) & 0xff, width & 0xff, componentCount, ...Array.from({ length: componentCount }, (_, index) => [index + 1, 0x11, 0] as const).flat()));
}

function jfif(xThumbnail = 0, yThumbnail = 0, trailing = new Uint8Array()): Uint8Array {
  return concat(encoder.encode("JFIF\0"), Uint8Array.of(1, 2, 0, 0, 72, 0, 72, 0, 0, xThumbnail, yThumbnail), trailing);
}

function pngChunk(type: string, payload: Uint8Array, validCrc = true): Uint8Array {
  const output = new Uint8Array(12 + payload.length);
  new DataView(output.buffer).setUint32(0, payload.length, false);
  output.set(encoder.encode(type), 4);
  output.set(payload, 8);
  const checksum = crc32(output, 4, 8 + payload.length);
  new DataView(output.buffer).setUint32(8 + payload.length, validCrc ? checksum : checksum ^ 1, false);
  return output;
}

function pngIhdr(width = 3, height = 2, bitDepth = 8, colorType = 6, interlace = 0): Uint8Array {
  return Uint8Array.of(...u32(width), ...u32(height), bitDepth, colorType, 0, 0, interlace);
}

function pngFile(chunks: readonly Uint8Array[]): Uint8Array {
  return concat(Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), ...chunks);
}

function webpChunk(type: string, payload: Uint8Array): Uint8Array {
  return concat(encoder.encode(type), u32(payload.length, true), payload, payload.length % 2 === 0 ? new Uint8Array() : Uint8Array.of(0));
}

function webpFile(chunks: readonly Uint8Array[], declaredLength?: number): Uint8Array {
  const body = concat(encoder.encode("WEBP"), ...chunks);
  return concat(encoder.encode("RIFF"), u32(declaredLength ?? body.length, true), body);
}

function minimalIcc(): Uint8Array {
  const output = new Uint8Array(132);
  const view = new DataView(output.buffer);
  view.setUint32(0, output.length, false);
  output.set(encoder.encode("acsp"), 36);
  output.set(encoder.encode("scnr"), 12);
  output.set(encoder.encode("RGB "), 16);
  output.set(encoder.encode("XYZ "), 20);
  return output;
}

function minimalExif(): Uint8Array {
  const output = new Uint8Array(14);
  output.set([0x49, 0x49, 0x2a, 0x00, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  return output;
}

function exifWithJpegThumbnail(): Uint8Array {
  const output = new Uint8Array(65);
  output.set([0x49, 0x49, 0x2a, 0x00, 8, 0, 0, 0], 0);
  output.set([0, 0, 26, 0, 0, 0], 8);
  output.set([2, 0], 26);
  output.set([0x01, 0x02, 4, 0, 1, 0, 0, 0, 62, 0, 0, 0], 28);
  output.set([0x02, 0x02, 4, 0, 1, 0, 0, 0, 3, 0, 0, 0], 40);
  output.set([0, 0, 0, 0], 52);
  output.set([0xff, 0xd8, 0xff], 62);
  return output;
}

describe("S06 reachable parser and semantic branch completion", () => {
  it("covers JPEG SOF, entropy marker, DNL, JFIF, header-only, and bounded metadata branches", () => {
    const validJpeg = jpegFile([sof(3, 2)]);
    expect(parseJpeg(validJpeg, limits, { selection: allGroups }).dimensions).toEqual({ width: 3, height: 2 });
    expect(parseJpeg(validJpeg, limits, { selection: allGroups, headerOnly: true }).dimensions).toEqual({ width: 3, height: 2 });

    const entropyMarkers = jpegFile([sof(3, 2)], Uint8Array.of(1, 0xff, 0, 2, 0xff, 0xd3, 3));
    expect(parseJpeg(entropyMarkers, limits, { selection: allGroups }).warnings.filter(({ severity }) => severity === "error")).toEqual([]);

    const dnl = concat(
      Uint8Array.of(0xff, 0xd8),
      sof(3, 2),
      jpegSegment(0xda, Uint8Array.of(1, 1, 0, 0, 0x3f, 0)),
      Uint8Array.of(1, 2, 0xff, 0),
      jpegSegment(0xdc, Uint8Array.of(0, 2)),
      Uint8Array.of(3, 4, 0xff, 0xd9),
    );
    expect(parseJpeg(dnl, limits, { selection: allGroups }).warnings.filter(({ severity }) => severity === "error")).toEqual([]);

    for (const invalidSof of [
      jpegFile([jpegSegment(0xc0, Uint8Array.of(0, 0, 2, 0, 3, 1, 1, 0x11, 0))]),
      jpegFile([jpegSegment(0xc0, Uint8Array.of(8, 0, 0, 0, 3, 1, 1, 0x11, 0))]),
      jpegFile([jpegSegment(0xc0, Uint8Array.of(8, 0, 2, 0, 0, 1, 1, 0x11, 0))]),
      jpegFile([jpegSegment(0xc0, Uint8Array.of(8, 0, 2, 0, 3, 0))]),
    ]) {
      expect(parseJpeg(invalidSof, limits, { selection: allGroups }).warnings.some(({ code }) => code === "MALFORMED_JPEG")).toBe(true);
    }

    const malformedDnl = concat(Uint8Array.of(0xff, 0xd8), sof(3, 2), jpegSegment(0xdc, Uint8Array.of(0, 2)), Uint8Array.of(0xff, 0xd9));
    expect(parseJpeg(malformedDnl, limits, { selection: allGroups }).warnings.some(({ code }) => code === "MALFORMED_JPEG")).toBe(true);

    for (const payload of [jfif(1, 1), jfif(1, 1, Uint8Array.of(0)), jfif(1, 0)]) {
      const parsed = parseJpeg(jpegFile([sof(3, 2), jpegSegment(0xe0, payload)]), limits, { selection: allGroups });
      expect(parsed.blocks?.some(({ family }) => family === "JFIF")).toBe(true);
      expect(parsed.warnings.some(({ code }) => code === "TRUNCATED_DATA" || code === "INVALID_VALUE")).toBe(true);
    }

    const noEoi = validJpeg.slice(0, -2);
    expect(parseJpeg(noEoi, limits, { selection: allGroups }).warnings.some(({ code }) => code === "TRUNCATED_DATA")).toBe(true);
    const noScan = concat(Uint8Array.of(0xff, 0xd8), sof(3, 2), Uint8Array.of(0xff, 0xd9));
    expect(parseJpeg(noScan, limits, { selection: allGroups }).warnings.some(({ code }) => code === "MALFORMED_JPEG")).toBe(true);
    const bounded = parseJpeg(jpegFile([sof(3, 2), jpegSegment(0xe1, new Uint8Array(32))]), resolveLimits({ ...limits, maxMetadataBytes: 1 }), { selection: allGroups });
    expect(bounded.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
  });

  it("covers PNG chunk ordering, text encodings, compression errors, CRC, and image-parameter validation", async () => {
    const ihdr = pngChunk("IHDR", pngIhdr());
    const idat = pngChunk("IDAT", Uint8Array.of(0));
    const iend = pngChunk("IEND", new Uint8Array());
    const text = (keyword: string, value: Uint8Array): Uint8Array => pngChunk("tEXt", concat(encoder.encode(keyword), Uint8Array.of(0), value));
    const ztext = (keyword: string, value: Uint8Array, method = 0): Uint8Array => pngChunk("zTXt", concat(encoder.encode(keyword), Uint8Array.of(0, method), value));
    const itext = (keyword: string, value: Uint8Array, flag = 0, method = 0, language = "en", translated = "English"): Uint8Array => pngChunk("iTXt", concat(encoder.encode(keyword), Uint8Array.of(0, flag, method), encoder.encode(`${language}\0${translated}\0`), value));

    const valid = await parsePng(pngFile([ihdr, text("Title", encoder.encode("hello")), ztext("Compressed", new Uint8Array(deflateSync(Buffer.from("zlib")))), itext("Unicode", encoder.encode("héllo")), idat, iend]), limits, allGroups);
    expect(valid.dimensions).toEqual({ width: 3, height: 2 });
    expect(valid.pngText.length).toBe(3);

    const compressedItxt = await parsePng(pngFile([ihdr, itext("Compressed", new Uint8Array(deflateSync(Buffer.from("compressed"))), 1), idat, iend]), limits, allGroups);
    expect(compressedItxt.pngText.some(({ compressed }) => compressed)).toBe(true);

    const malformedText = [
      pngChunk("tEXt", encoder.encode("unterminated")),
      text("", encoder.encode("empty-keyword")),
      ztext("Unsupported", Uint8Array.of(1, 2, 3), 1),
      ztext("Truncated", new Uint8Array()),
      itext("BadFlag", encoder.encode("x"), 2),
      itext("BadMethod", encoder.encode("x"), 1, 1),
      pngChunk("iTXt", concat(encoder.encode("NoLanguage\0"), Uint8Array.of(0, 0), encoder.encode("not-terminated"))),
      pngChunk("iTXt", concat(encoder.encode("BadLanguage\0"), Uint8Array.of(0, 0), Uint8Array.of(0xff, 0), encoder.encode("x"))),
      pngChunk("iTXt", concat(encoder.encode("BadText\0"), Uint8Array.of(0, 0), encoder.encode("en\0English\0"), Uint8Array.of(0xff))),
      ztext("BadDeflate", Uint8Array.of(1, 2, 3)),
      itext("BadDeflateItxt", Uint8Array.of(1, 2, 3), 1),
    ];
    for (const chunk of malformedText) {
      const parsed = await parsePng(pngFile([ihdr, chunk, idat, iend]), limits, allGroups);
      expect(parsed.warnings.length).toBeGreaterThan(0);
      expect(parsed.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
    }

    const malformedFiles = [
      pngFile([idat, ihdr, iend]),
      pngFile([ihdr, iend]),
      pngFile([ihdr, idat]),
      pngFile([ihdr, idat, pngChunk("IEND", Uint8Array.of(1))]),
      pngFile([ihdr, pngChunk("tEXt", encoder.encode("x\0y"), false), idat, iend]),
      concat(pngFile([ihdr, idat, iend]), pngChunk("tEXt", encoder.encode("after\0iend"))),
      concat(pngFile([ihdr]), u32(0x7fffffff), encoder.encode("tEXt")),
      pngFile([pngChunk("IHDR", pngIhdr(0, 2)), idat, iend]),
      pngFile([pngChunk("IHDR", pngIhdr(1, 1, 8, 1)), idat, iend]),
    ];
    for (const input of malformedFiles) expect((await parsePng(input, limits, allGroups)).warnings.length).toBeGreaterThan(0);
    for (const colorType of [0, 2, 3, 4, 6]) {
      const depths = colorType === 2 || colorType === 4 || colorType === 6 ? [8, 16] : colorType === 3 ? [1, 2, 4, 8] : [1, 2, 4, 8, 16];
      for (const bitDepth of depths) expect(parsePngDimensions(pngFile([pngChunk("IHDR", pngIhdr(1, 1, bitDepth, colorType))]))).toEqual({ width: 1, height: 1 });
    }
  });

  it("covers WebP image variants, metadata selection, duplicate handling, and bounded failures", () => {
    const vp8x = Uint8Array.of(0, 0, 0, 0, 2, 0, 0, 1, 0, 0);
    const vp8l = Uint8Array.of(0x2f, 1, 0x40, 0, 0);
    const vp8 = Uint8Array.of(0x10, 0, 0, 0x9d, 1, 0x2a, 3, 0, 2, 0);
    expect(parseWebpDimensions(webpFile([webpChunk("VP8X", vp8x)]))).toEqual({ width: 3, height: 2 });
    expect(parseWebpDimensions(webpFile([webpChunk("VP8L", vp8l)]))).toEqual({ width: 2, height: 2 });
    expect(parseWebpDimensions(webpFile([webpChunk("VP8 ", vp8)]))).toEqual({ width: 3, height: 2 });

    const icc = minimalIcc();
    const chunks = [
      webpChunk("VP8X", vp8x),
      webpChunk("EXIF", minimalExif()),
      webpChunk("EXIF", minimalExif()),
      webpChunk("XMP ", encoder.encode("<rdf:RDF/>")),
      webpChunk("XMP ", Uint8Array.of(0xff)),
      webpChunk("ICCP", icc),
      webpChunk("ICCP", icc),
      webpChunk("JUNK", Uint8Array.of(1)),
    ];
    const parsed = parseWebp(webpFile(chunks), limits, allGroups);
    expect(parsed.dimensions).toEqual({ width: 3, height: 2 });
    expect(parsed.exif).not.toBeNull();
    expect(parsed.xmp?.packets).toEqual(["<rdf:RDF/>"]);
    expect(parsed.warnings.some(({ code }) => code === "DUPLICATE_EXIF")).toBe(true);
    expect(parsed.warnings.some(({ code }) => code === "INVALID_VALUE")).toBe(true);

    const selections = [
      resolveSelection({ groups: ["Dimensions"] }),
      resolveSelection({ groups: ["EXIF"] }),
      resolveSelection({ groups: ["XMP"] }),
      resolveSelection({ groups: ["ICC"] }),
      resolveSelection({ groups: [] }),
    ];
    for (const selection of selections) {
      const result = parseWebp(webpFile(chunks), limits, selection);
      expect(result.blocks?.every(({ offset, length }) => offset === null || length === null || offset >= 0 && length >= 8)).toBe(true);
    }

    const malformed = [
      new Uint8Array(),
      encoder.encode("RIFF"),
      webpFile([webpChunk("VP8L", vp8l)], 0),
      webpFile([webpChunk("VP8 ", vp8).slice(0, -1)]),
      concat(encoder.encode("RIFF"), u32(100, true), encoder.encode("WEBP"), encoder.encode("VP8 "), u32(100, true), Uint8Array.of(1)),
    ];
    for (const input of malformed) {
      const result = parseWebp(input, limits, allGroups);
      expect(result.warnings.length).toBeGreaterThan(0);
    }
    const limited = parseWebp(webpFile(chunks), resolveLimits({ ...limits, maxSegments: 1 }), allGroups);
    expect(limited.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
    const noDimensions = parseWebp(webpFile([webpChunk("JUNK", Uint8Array.of(1))]), limits, resolveSelection({ groups: ["Dimensions"] }));
    expect(noDimensions.dimensions).toBeNull();
  });

  it("validates JFIF units and thumbnail geometry independently of JPEG marker parsing", () => {
    for (const [units, expected] of [[0, "none"], [1, "dpi"], [2, "dpcm"], [3, "unknown"]] as const) {
      const payload = Uint8Array.from([...encoder.encode("JFIF\0"), 1, 2, units, 0, 72, 0, 72, 0, 0]);
      payload[7] = units;
      expect(parseJfif(payload)).toMatchObject({ densityUnits: expected, version: "1.02", xDensity: 72, yDensity: 72 });
    }
    const validThumbnail = Uint8Array.from([...encoder.encode("JFIF\0"), 1, 2, 0, 0, 72, 0, 72, 1, 1, 0, 0, 0]);
    expect(parseJfif(validThumbnail)).toMatchObject({ densityUnits: "none" });
    const mismatchedThumbnail = validThumbnail.slice(); mismatchedThumbnail[13] = 0;
    expect(parseJfif(mismatchedThumbnail)).toBeNull();
    expect(parseJfif(validThumbnail.slice(0, -1))).toBeNull();
    expect(parseJfif(concat(Uint8Array.from([...encoder.encode("JFIF\0"), 1, 2, 0, 0, 72, 0, 72, 0, 0]), Uint8Array.of(0)))).toBeNull();
    expect(parseJfif(encoder.encode("not-jfif"))).toBeNull();
  });

  it("exercises ICC header/date and bounded semantic payload alternatives without accepting malformed values", () => {
    const base = minimalIcc();
    const valid = inspectIccProfile([{ sequence: 1, total: 1, byteLength: base.length, data: base }], limits);
    expect(valid.data?.complete).toBe(true);
    expect(valid.fields.some(({ name }) => name === "ProfileVersion")).toBe(true);
    expect(valid.fields.some(({ name }) => name === "ProfileDate")).toBe(false);

    const invalidHeader = base.slice();
    invalidHeader[36] = 0;
    invalidHeader[100] = 1;
    new DataView(invalidHeader.buffer).setUint32(64, 4, false);
    const invalid = inspectIccProfile([{ sequence: 1, total: 1, byteLength: invalidHeader.length, data: invalidHeader }], limits);
    expect(invalid.warnings.length).toBeGreaterThan(0);

    const invalidDates = [[2023, 2, 29, 24, 60, 60], [2024, 2, 29, 23, 59, 59], [2024, 13, 1, 0, 0, 0]] as const;
    for (const date of invalidDates) {
      const value = base.slice();
      const view = new DataView(value.buffer);
      date.forEach((part, index) => view.setUint16(24 + index * 2, part, false));
      const result = inspectIccProfile([{ sequence: 1, total: 1, byteLength: value.length, data: value }], limits);
      const hasValidCalendarDate = new Date(Date.UTC(date[0], date[1] - 1, date[2])).getUTCFullYear() === date[0]
        && new Date(Date.UTC(date[0], date[1] - 1, date[2])).getUTCMonth() === date[1] - 1
        && new Date(Date.UTC(date[0], date[1] - 1, date[2])).getUTCDate() === date[2]
        && date[3] <= 23 && date[4] <= 59 && date[5] <= 59;
      expect(result.fields.some(({ name }) => name === "ProfileDate")).toBe(hasValidCalendarDate);
      if (!hasValidCalendarDate) expect(result.warnings.some(({ code }) => code === "INVALID_VALUE")).toBe(true);
    }
  });

  it("projects a complete repository TIFF through every metadata-family boundary", async () => {
    expect(isTiffHeader(Uint8Array.of(0x4d, 0x4d, 0, 42))).toBe(true);
    expect(isTiffHeader(Uint8Array.of(0x49, 0x49, 0x52, 0x4f))).toBe(true);
    expect(isTiffHeader(Uint8Array.of(0x49, 0x49, 0x55, 0))).toBe(true);
    const bytes = new Uint8Array(await readFile(new URL("./fixtures/tiff-metadata.tif", import.meta.url)));
    const selections = [
      allGroups,
      resolveSelection({ groups: ["EXIF"] }),
      resolveSelection({ groups: ["XMP"] }),
      resolveSelection({ groups: ["IPTC"] }),
      resolveSelection({ groups: ["ICC"] }),
      resolveSelection({ groups: ["Photoshop"] }),
      resolveSelection({ groups: ["MakerNote"] }),
      resolveSelection({ groups: [] }),
    ];
    for (const selection of selections) {
      for (const extractThumbnail of [true, false]) {
        const parsed = parseTiffMetadata(bytes, resolveLimits({ ...limits, maxMetadataBytes: bytes.length, maxValueBytes: bytes.length, maxStringBytes: bytes.length }), selection, extractThumbnail, undefined, undefined, (offset) => offset + 1, bytes.length + 1);
        expect(parsed.format).toBe("tiff");
        expect(parsed.fields).toBeInstanceOf(Array);
        expect(parsed.blocks).toBeInstanceOf(Array);
        expect(parsed.warnings.every(({ code, offset, length }) => /^[A-Z][A-Z0-9_]*$/u.test(code) && (offset === undefined || Number.isSafeInteger(offset)) && (length === undefined || Number.isSafeInteger(length)))).toBe(true);
      }
    }
  });

  it("covers PNG ancillary decompression, ICC validation, EXIF thumbnail projection, and runtime fallback", async () => {
    const ihdr = pngChunk("IHDR", pngIhdr());
    const idat = pngChunk("IDAT", Uint8Array.of(0));
    const iend = pngChunk("IEND", new Uint8Array());
    const ztext = (payload: Uint8Array): Uint8Array => pngChunk("zTXt", concat(encoder.encode("Compressed"), Uint8Array.of(0, 0), payload));
    const itext = (payload: Uint8Array): Uint8Array => pngChunk("iTXt", concat(encoder.encode("Compressed"), Uint8Array.of(0, 1, 0), encoder.encode("en\0English\0"), payload));
    const invalidZlib = ztext(Uint8Array.of(1, 2, 3));
    const invalidItxtZlib = itext(Uint8Array.of(1, 2, 3));
    const truncatedZtext = pngChunk("zTXt", concat(encoder.encode("Truncated"), Uint8Array.of(0)));
    const malformedIcc = pngChunk("iCCP", encoder.encode("Profile"));
    const invalidIcc = pngChunk("iCCP", concat(encoder.encode("Profile"), Uint8Array.of(0, 0), new Uint8Array(deflateSync(Buffer.from("not-an-icc-profile")))));
    const thumbnail = pngChunk("eXIf", exifWithJpegThumbnail());

    const parsed = await parsePng(pngFile([ihdr, invalidZlib, invalidItxtZlib, truncatedZtext, malformedIcc, invalidIcc, thumbnail, idat, iend]), limits, allGroups);
    expect(parsed.warnings.some(({ code }) => code === "INVALID_VALUE")).toBe(true);
    expect(parsed.warnings.some(({ code }) => code === "MALFORMED_PNG")).toBe(true);
    expect(parsed.exif?.thumbnail).toMatchObject({ mimeType: "image/jpeg", data: Uint8Array.of(0xff, 0xd8, 0xff) });
    expect(parsed.blocks?.some(({ family, status }) => family === "ICC" && status === "malformed")).toBe(true);

    const previous = Object.getOwnPropertyDescriptor(globalThis, "DecompressionStream");
    Object.defineProperty(globalThis, "DecompressionStream", { configurable: true, value: undefined });
    try {
      const unsupported = await parsePng(pngFile([ihdr, ztext(new Uint8Array(deflateSync(Buffer.from("fallback")))), idat, iend]), limits, allGroups);
      expect(unsupported.warnings.some(({ code }) => code === "UNSUPPORTED_COMPRESSION")).toBe(true);
    } finally {
      if (previous === undefined) delete (globalThis as { DecompressionStream?: unknown }).DecompressionStream;
      else Object.defineProperty(globalThis, "DecompressionStream", previous);
    }
  });
});
