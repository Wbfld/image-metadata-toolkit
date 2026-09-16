import { readFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";

import { parseJpeg } from "../src/parsers/jpeg.js";
import { parsePng, parsePngDimensions, inflateZlib } from "../src/parsers/png.js";
import { parseWebp, parseWebpDimensions } from "../src/parsers/webp.js";
import { resolveSelection } from "../src/selection.js";
import { resolveLimits } from "../src/security/limits.js";

const encoder = new TextEncoder();
const limits = resolveLimits({ maxInputBytes: 2 * 1024 * 1024, maxMetadataBytes: 512 * 1024, maxSegmentBytes: 512 * 1024, maxStringBytes: 128 * 1024, maxDecompressedBytes: 128 * 1024, maxDecompressedMetadataBytes: 128 * 1024, maxWarnings: 64 });

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
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

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const output = new Uint8Array(12 + data.length);
  new DataView(output.buffer).setUint32(0, data.length, false);
  output.set(encoder.encode(type), 4); output.set(data, 8);
  new DataView(output.buffer).setUint32(8 + data.length, crc32(output, 4, 8 + data.length), false);
  return output;
}

function pngIhdr(width = 3, height = 2, bitDepth = 8, colorType = 6, interlace = 0): Uint8Array {
  const data = new Uint8Array(13);
  const view = new DataView(data.buffer);
  view.setUint32(0, width, false); view.setUint32(4, height, false);
  data.set([bitDepth, colorType, 0, 0, interlace], 8);
  return data;
}

function pngFile(chunks: readonly Uint8Array[]): Uint8Array { return concat(Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), ...chunks); }

function webpChunk(type: string, data: Uint8Array): Uint8Array {
  const output = new Uint8Array(8 + data.length + (data.length & 1));
  output.set(encoder.encode(type), 0); new DataView(output.buffer).setUint32(4, data.length, true); output.set(data, 8);
  return output;
}

function webpFile(chunks: readonly Uint8Array[]): Uint8Array {
  const body = concat(encoder.encode("WEBP"), ...chunks);
  return concat(encoder.encode("RIFF"), Uint8Array.of(body.length & 0xff, body.length >>> 8 & 0xff, body.length >>> 16 & 0xff, body.length >>> 24 & 0xff), body);
}

function jpegSegment(marker: number, data: Uint8Array): Uint8Array { return concat(Uint8Array.of(0xff, marker, (data.length + 2) >>> 8, (data.length + 2) & 0xff), data); }

function jpegFile(): Uint8Array {
  const sof = jpegSegment(0xc0, Uint8Array.of(8, 0, 2, 0, 3, 1, 1, 0x11, 0));
  const dqt = jpegSegment(0xdb, Uint8Array.of(0, ...new Uint8Array(64).fill(1)));
  const dht = jpegSegment(0xc4, Uint8Array.of(0, 0));
  const sos = jpegSegment(0xda, Uint8Array.of(1, 1, 0, 0, 0x3f, 0));
  return concat(Uint8Array.of(0xff, 0xd8), jpegSegment(0xfe, encoder.encode("comment")), dqt, dht, sof, sos, Uint8Array.of(1, 2, 0xff, 0, 3, 0xff, 0xd9), Uint8Array.of(9, 8));
}

describe("S06 container parser boundary matrix", () => {
  it("covers PNG dimensions, text encodings, compression, selection, CRC, ordering, and limits", async () => {
    const text = concat(encoder.encode("Title\0"), encoder.encode("hello"));
    const ztext = concat(encoder.encode("Compressed\0"), Uint8Array.of(0), new Uint8Array(deflateSync(Buffer.from("zlib text"))));
    const itext = concat(encoder.encode("XML:com.adobe.xmp\0"), Uint8Array.of(0), encoder.encode("en\0"), encoder.encode("English\0"), encoder.encode("<rdf:RDF/>"));
    const compressedItext = concat(encoder.encode("Compressed XML\0"), Uint8Array.of(1, 0), encoder.encode("en\0"), encoder.encode("English\0"), new Uint8Array(deflateSync(Buffer.from("compressed"))));
    const chunks = [pngChunk("IHDR", pngIhdr()), pngChunk("tEXt", text), pngChunk("zTXt", ztext), pngChunk("iTXt", itext), pngChunk("iTXt", compressedItext), pngChunk("IDAT", Uint8Array.of(1, 2, 3)), pngChunk("IEND", new Uint8Array())];
    const parsed = await parsePng(pngFile(chunks), limits, resolveSelection(undefined));
    expect(parsed.dimensions).toEqual({ width: 3, height: 2 });
    expect(parsed.pngText.length).toBeGreaterThanOrEqual(3);
    expect(parsed.pngText.some((item) => item.compressed)).toBe(true);
    expect(parsePngDimensions(pngFile([pngChunk("IHDR", pngIhdr())]))).toEqual({ width: 3, height: 2 });
    for (const colorType of [0, 2, 3, 4, 6]) for (const bitDepth of colorType === 2 || colorType === 4 || colorType === 6 ? [8, 16] : colorType === 3 ? [1, 2, 4, 8] : [1, 2, 4, 8, 16]) {
      expect(parsePngDimensions(pngFile([pngChunk("IHDR", pngIhdr(1, 1, bitDepth, colorType))]))).toEqual({ width: 1, height: 1 });
    }
    expect(parsePngDimensions(pngFile([pngChunk("IHDR", pngIhdr(0, 1))]))).toBeNull();
    expect(parsePngDimensions(pngFile([pngChunk("IHDR", pngIhdr(1, 1, 8, 1))]))).toBeNull();
    const badCrc = pngFile(chunks.map((chunk, index) => index === 1 ? (() => { const copy = chunk.slice(); copy[copy.length - 1] = (copy[copy.length - 1] ?? 0) ^ 1; return copy; })() : chunk));
    expect((await parsePng(badCrc, limits)).warnings.some((warning) => warning.code === "INVALID_VALUE")).toBe(true);
    expect((await parsePng(concat(pngFile(chunks), pngChunk("tEXt", text)), limits)).warnings.some((warning) => warning.code === "MALFORMED_PNG")).toBe(true);
    expect((await parsePng(pngFile([pngChunk("IDAT", new Uint8Array()), pngChunk("IHDR", pngIhdr()), pngChunk("IEND", new Uint8Array())]), limits)).warnings.length).toBeGreaterThan(0);
    expect((await parsePng(pngFile(chunks), resolveLimits({ maxPngChunks: 2 }))).warnings.some((warning) => warning.code === "LIMIT_EXCEEDED")).toBe(true);
    expect((await parsePng(pngFile([pngChunk("IHDR", pngIhdr()), pngChunk("tEXt", concat(encoder.encode("x\0"), new Uint8Array(100))) , pngChunk("IDAT", new Uint8Array()), pngChunk("IEND", new Uint8Array())]), resolveLimits({ maxSegmentBytes: 8 }))).warnings.some((warning) => warning.code === "LIMIT_EXCEEDED")).toBe(true);
    expect((await parsePng(pngFile(chunks), resolveLimits({ maxStringBytes: 1 }))).warnings.some((warning) => warning.code === "LIMIT_EXCEEDED")).toBe(true);
    expect(await inflateZlib(new Uint8Array(deflateSync(Buffer.from("bounded"))), 100)).toMatchObject({ bytes: new TextEncoder().encode("bounded") });
    expect(await inflateZlib(Uint8Array.of(1, 2, 3), 100)).toMatchObject({ bytes: null, error: "INVALID_VALUE" });
    const controller = new AbortController(); controller.abort();
    await expect(inflateZlib(Uint8Array.of(1), 100, controller.signal)).rejects.toMatchObject({ code: "ABORTED" });
  });

  it("covers WebP VP8, VP8L, VP8X, metadata duplicates, selection, padding, and truncation", () => {
    const vp8x = new Uint8Array(10); vp8x[4] = 2; vp8x[7] = 1;
    const vp8l = Uint8Array.of(0x2f, 1, 0, 0, 0);
  const vp8 = Uint8Array.of(0x10, 0, 0, 0x9d, 0x01, 0x2a, 3, 0, 2, 0);
    const exif = Uint8Array.of(0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 0, 0, 0, 0);
    const chunks = [webpChunk("VP8X", vp8x), webpChunk("VP8 ", vp8), webpChunk("EXIF", exif), webpChunk("EXIF", exif), webpChunk("XMP ", encoder.encode("<rdf:RDF/>")), webpChunk("ICCP", new Uint8Array(132))];
    const parsed = parseWebp(webpFile(chunks), limits, resolveSelection(undefined));
    expect(parsed.dimensions).toEqual({ width: 3, height: 2 });
    expect(parsed.warnings.some((warning) => warning.code === "DUPLICATE_EXIF")).toBe(true);
    expect(parsed.xmp?.packets).toEqual(["<rdf:RDF/>"]);
    expect(parseWebpDimensions(webpFile([webpChunk("VP8X", vp8x)]))).toEqual({ width: 3, height: 2 });
    expect(parseWebpDimensions(webpFile([webpChunk("VP8L", vp8l)]))).toEqual({ width: 2, height: 1 });
    expect(parseWebpDimensions(webpFile([webpChunk("VP8 ", vp8)]))).toEqual({ width: 3, height: 2 });
    expect(parseWebpDimensions(webpFile([webpChunk("VP8L", Uint8Array.of(0, 0, 0, 0, 0))]))).toBeNull();
    expect(parseWebp(webpFile(chunks), resolveLimits({ maxSegments: 1 }), resolveSelection(undefined)).warnings.some((warning) => warning.code === "LIMIT_EXCEEDED")).toBe(true);
    expect(parseWebp(webpFile(chunks).slice(0, -1), limits).warnings.some((warning) => warning.code === "MALFORMED_WEBP" || warning.code === "TRUNCATED_DATA")).toBe(true);
    expect(parseWebp(concat(webpFile(chunks), Uint8Array.of(1)), limits).warnings.some((warning) => warning.code === "MALFORMED_WEBP")).toBe(true);
    expect(parseWebp(webpFile([webpChunk("VP8X", vp8x), webpChunk("XMP ", Uint8Array.of(0xff))]), limits, resolveSelection({ groups: ["Dimensions"] })).blocks?.some((block) => block.status === "skipped") ?? false).toBe(true);
  });

  it("retains JPEG marker, scan, restart, comment, and malformed-boundary semantics", () => {
    const bytes = jpegFile();
    const parsed = parseJpeg(bytes, limits);
    expect(parsed.dimensions).toEqual({ width: 3, height: 2 });
    expect(parsed.jfif).toBeNull();
    expect(parseJpeg(bytes.slice(0, 2), limits).dimensions).toBeNull();
    expect(parseJpeg(Uint8Array.of(0xff, 0xd8, 0xff, 0xe1, 0, 2), limits).warnings.length).toBeGreaterThan(0);
    expect(parseJpeg(concat(bytes, Uint8Array.of(0, 1)), limits).dimensions).toEqual({ width: 3, height: 2 });
    const controller = new AbortController(); controller.abort();
    expect(() => parseJpeg(bytes, limits, { selection: resolveSelection(undefined), signal: controller.signal })).toThrow(/abort/i);
  });

  it("exercises real JPEG and PNG metadata-bearing fixtures through every selection family", async () => {
    const jpeg = new Uint8Array(await readFile(new URL("./fixtures/jpeg-iptc.jpg", import.meta.url)));
    const png = new Uint8Array(await readFile(new URL("./fixtures/png-metadata.png", import.meta.url)));
    for (const groups of [["Dimensions"], ["EXIF"], ["XMP"], ["IPTC"], ["ICC"], ["Photoshop"], ["MakerNote"], ["PNGText"]] as const) {
      const selection = resolveSelection({ groups: [...groups] });
      const jpegResult = parseJpeg(jpeg, limits, { selection });
      expect(jpegResult.warnings.every((warning) => typeof warning.code === "string")).toBe(true);
      const pngResult = await parsePng(png, limits, selection);
      expect(pngResult.warnings.every((warning) => typeof warning.code === "string")).toBe(true);
    }
  });
});
