import { describe, expect, it } from "vitest";

import { parseJfif } from "../src/metadata/jfif.js";
import { inspectIccProfile, type IccChunk } from "../src/metadata/icc.js";
import { parseGif } from "../src/parsers/gif.js";
import { parseJxl } from "../src/parsers/jxl.js";
import { inflateZlib, parsePng, parsePngDimensions } from "../src/parsers/png.js";
import { parseWebp, parseWebpDimensions } from "../src/parsers/webp.js";
import { resolveSelection } from "../src/selection.js";
import { resolveLimits } from "../src/security/limits.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const allGroups = resolveSelection(undefined);
const limits = resolveLimits({
  maxInputBytes: 128 * 1024,
  maxMetadataBytes: 32 * 1024,
  maxSegmentBytes: 16 * 1024,
  maxStringBytes: 16 * 1024,
  maxDecompressedBytes: 16 * 1024,
  maxPngChunks: 64,
  maxSegments: 64,
  maxWarnings: 64,
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

function be32(value: number): Uint8Array {
  return Uint8Array.of((value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);
}

function le16(value: number): Uint8Array {
  return Uint8Array.of(value & 0xff, (value >>> 8) & 0xff);
}

function le24(value: number): Uint8Array {
  return Uint8Array.of(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff);
}

function le32(value: number): Uint8Array {
  return Uint8Array.of(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typed = encoder.encode(type);
  const body = concat(typed, data);
  return concat(be32(data.length), body, be32(crc32(body)));
}

function png(chunks: readonly Uint8Array[]): Uint8Array {
  return concat(Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), ...chunks);
}

function ihdr(width = 3, height = 2, bitDepth = 8, colorType = 2, interlace = 0): Uint8Array {
  return pngChunk("IHDR", concat(be32(width), be32(height), Uint8Array.of(bitDepth, colorType, 0, 0, interlace)));
}

function webpChunk(type: string, data: Uint8Array): Uint8Array {
  return concat(encoder.encode(type), le32(data.length), data, data.length % 2 === 1 ? Uint8Array.of(0) : new Uint8Array());
}

function webp(chunks: readonly Uint8Array[]): Uint8Array {
  const body = concat(encoder.encode("WEBP"), ...chunks);
  return concat(encoder.encode("RIFF"), le32(body.length), body);
}

function gifBase(width = 4, height = 3, packed = 0): Uint8Array {
  return concat(encoder.encode("GIF89a"), le16(width), le16(height), Uint8Array.of(packed, 0, 0));
}

function gifSubBlocks(data: Uint8Array): Uint8Array {
  return concat(Uint8Array.of(data.length), data, Uint8Array.of(0));
}

function application(identifier: string, data: Uint8Array): Uint8Array {
  return concat(Uint8Array.of(0x21, 0xff, 11), encoder.encode(identifier), gifSubBlocks(data));
}

function codestream(width: number, height: number, ratio = 0): Uint8Array {
  const bits: number[] = [];
  const append = (value: number, count: number): void => {
    for (let index = 0; index < count; index += 1) bits.push((value >>> index) & 1);
  };
  const small = width <= 256 && height <= 256 && width % 8 === 0 && height % 8 === 0 && ratio === 0;
  bits.push(small ? 1 : 0);
  if (small) append(height / 8 - 1, 5);
  else {
    const selector = height <= 512 ? 0 : height <= 8192 ? 1 : height <= 262144 ? 2 : 3;
    const count = [9, 13, 18, 30][selector] ?? 9;
    append(selector, 2);
    append(height - 1, count);
  }
  append(ratio, 3);
  if (ratio === 0) {
    if (small) append(width / 8 - 1, 5);
    else {
      const selector = width <= 512 ? 0 : width <= 8192 ? 1 : width <= 262144 ? 2 : 3;
      const count = [9, 13, 18, 30][selector] ?? 9;
      append(selector, 2);
      append(width - 1, count);
    }
  }
  const output = new Uint8Array(2 + Math.ceil(bits.length / 8));
  output.set([0xff, 0x0a]);
  bits.forEach((bit, index) => { output[2 + Math.floor(index / 8)] = (output[2 + Math.floor(index / 8)] ?? 0) | (bit << (index % 8)); });
  return output;
}

function jxlBox(type: string, payload: Uint8Array, extended = false): Uint8Array {
  const header = extended ? 16 : 8;
  const output = new Uint8Array(header + payload.length);
  const view = new DataView(output.buffer);
  if (extended) {
    view.setUint32(0, 1, false);
    view.setBigUint64(8, BigInt(output.length), false);
  } else view.setUint32(0, output.length, false);
  output.set(encoder.encode(type), 4);
  output.set(payload, header);
  return output;
}

function jxlContainer(...boxes: readonly Uint8Array[]): Uint8Array {
  return concat(Uint8Array.of(0, 0, 0, 12, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a), ...boxes);
}

function iccChunk(data: Uint8Array): IccChunk {
  return { sequence: 1, total: 1, byteLength: data.length, data };
}

function tiffWithMake(): Uint8Array {
  const output = new Uint8Array(31);
  const view = new DataView(output.buffer);
  output.set([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0], 0);
  view.setUint16(8, 1, true);
  view.setUint16(10, 0x010f, true);
  view.setUint16(12, 2, true);
  view.setUint32(14, 5, true);
  view.setUint32(18, 26, true);
  output.set(encoder.encode("Test\0"), 26);
  return output;
}

function minimalIcc(options: { readonly declaredSize?: number; readonly signature?: string; readonly renderingIntent?: number; readonly reserved?: boolean; readonly tagCount?: number } = {}): Uint8Array {
  const tagCount = options.tagCount ?? 0;
  const bytes = new Uint8Array(132 + tagCount * 12);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, options.declaredSize ?? bytes.length, false);
  view.setUint32(8, 0x04300000, false);
  bytes.set(encoder.encode("scnrRGB XYZ"), 12);
  bytes.set(encoder.encode(options.signature ?? "acsp"), 36);
  view.setUint32(64, options.renderingIntent ?? 0, false);
  if (options.reserved) bytes.fill(1, 100, 128);
  view.setUint32(128, tagCount, false);
  return bytes;
}

describe("S06 decoder completion boundary matrix", () => {
  it("validates every JFIF density and thumbnail boundary without guessing", () => {
    const valid = Uint8Array.of(...encoder.encode("JFIF\0"), 1, 2, 0, 0, 1, 0, 2, 0, 0);
    expect(parseJfif(valid)).toMatchObject({ version: "1.02", densityUnits: "none", xDensity: 1, yDensity: 2 });
    for (const units of [1, 2, 3]) expect(parseJfif(Uint8Array.of(...valid.slice(0, 7), units, ...valid.slice(8)))).toMatchObject({ densityUnits: units === 1 ? "dpi" : units === 2 ? "dpcm" : "unknown" });
    expect(parseJfif(valid.slice(0, 13))).toBeNull();
    expect(parseJfif(Uint8Array.of(...valid.slice(0, 12), 1, 0))).toBeNull();
    expect(parseJfif(Uint8Array.of(...valid, 1))).toBeNull();
    expect(parseJfif(Uint8Array.of(...encoder.encode("JFXX\0"), ...valid.slice(5)))).toBeNull();
    const thumbnail = Uint8Array.of(...valid.slice(0, 12), 1, 1, 1, 2, 3);
    expect(parseJfif(thumbnail)).toMatchObject({ densityUnits: "none" });
    expect(parseJfif(Uint8Array.of(...valid.slice(0, 12), 1, 0))).toBeNull();
  });

  it("covers PNG dimension validation, text syntax, selection, and decompression failures", async () => {
    const signature = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    const valid = png([ihdr(), pngChunk("IDAT", Uint8Array.of(1, 2)), pngChunk("IEND", new Uint8Array())]);
    expect(parsePngDimensions(valid)).toEqual({ width: 3, height: 2 });
    const invalidDimensions = [
      valid.slice(0, 8),
      png([pngChunk("IHDR", new Uint8Array(13)), pngChunk("IEND", new Uint8Array())]),
      png([ihdr(0), pngChunk("IEND", new Uint8Array())]),
      png([ihdr(3, 2, 3), pngChunk("IEND", new Uint8Array())]),
      png([ihdr(3, 2, 8, 9), pngChunk("IEND", new Uint8Array())]),
      png([ihdr(3, 2, 8, 2, 2), pngChunk("IEND", new Uint8Array())]),
    ];
    for (const value of invalidDimensions) expect(parsePngDimensions(value)).toBeNull();
    const badCrc = valid.slice(); badCrc[badCrc.length - 1] = (badCrc[badCrc.length - 1] ?? 0) ^ 0xff;
    expect((await parsePng(badCrc, limits, allGroups)).warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
    const textChunk = pngChunk("tEXt", concat(encoder.encode("Title\0hello")));
    const xmpChunk = pngChunk("iTXt", concat(encoder.encode("XML:com.adobe.xmp\0\0\0en\0English\0<x:xmpmeta/>")));
    const malformedText = pngChunk("tEXt", encoder.encode("without-terminator"));
    const unsupportedChunk = pngChunk("zTXt", concat(encoder.encode("Title\0"), Uint8Array.of(1, 1, 2)));
    const malformedItxt = pngChunk("iTXt", concat(encoder.encode("Title\0"), Uint8Array.of(0, 0), encoder.encode("en\0translated\0text")));
    const selected = await parsePng(png([ihdr(), textChunk, xmpChunk, malformedText, unsupportedChunk, malformedItxt, pngChunk("IEND", new Uint8Array())]), limits, allGroups);
    expect(selected.pngText.some(({ keyword, text }) => keyword === "Title" && text === "hello")).toBe(true);
    expect(selected.xmp?.packets).toEqual(["<x:xmpmeta/>"]);
    expect(selected.warnings.some(({ code }) => code === "MALFORMED_PNG" || code === "UNSUPPORTED_COMPRESSION")).toBe(true);
    const skipped = await parsePng(png([ihdr(), textChunk, pngChunk("IEND", new Uint8Array())]), limits, resolveSelection({ groups: ["Dimensions"] }));
    expect(skipped.blocks).toContainEqual(expect.objectContaining({ family: "PNGText", status: "skipped" }));
    expect((await inflateZlib(Uint8Array.of(0xff, 0xff), 32)).error).toBe("INVALID_VALUE");
    expect((await inflateZlib(new Uint8Array(), 0)).error).toBeDefined();
    expect((await parsePng(concat(signature, Uint8Array.of(0, 0, 0, 0)), limits, allGroups)).warnings.length).toBeGreaterThan(0);
    const invalidKeyword = pngChunk("tEXt", concat(Uint8Array.of(0), encoder.encode("value")));
    const oversizedKeyword = pngChunk("tEXt", concat(new Uint8Array(80).fill(0x41), Uint8Array.of(0), encoder.encode("value")));
    const malformedZtxt = pngChunk("zTXt", encoder.encode("Title"));
    const badFlagItxt = pngChunk("iTXt", concat(encoder.encode("Title\0"), Uint8Array.of(2, 0), encoder.encode("en\0translated\0text")));
    const badMethodItxt = pngChunk("iTXt", concat(encoder.encode("Title\0"), Uint8Array.of(1, 1), encoder.encode("en\0translated\0text")));
    const unterminatedLanguage = pngChunk("iTXt", concat(encoder.encode("Title\0"), Uint8Array.of(0, 0), encoder.encode("en")));
    const invalidLanguage = pngChunk("iTXt", concat(encoder.encode("Title\0"), Uint8Array.of(0, 0), Uint8Array.of(0xff), Uint8Array.of(0), encoder.encode("text")));
    const textFailures = await parsePng(png([ihdr(), invalidKeyword, oversizedKeyword, malformedZtxt, badFlagItxt, badMethodItxt, unterminatedLanguage, invalidLanguage, pngChunk("IEND", new Uint8Array())]), limits, allGroups);
    expect(textFailures.warnings.filter(({ code }) => code === "INVALID_VALUE" || code === "MALFORMED_PNG" || code === "UNSUPPORTED_COMPRESSION").length).toBeGreaterThanOrEqual(5);
    const noImage = await parsePng(png([ihdr(), pngChunk("IEND", new Uint8Array())]), limits, allGroups);
    expect(noImage.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_PNG" }));
    const duplicateHeader = await parsePng(png([ihdr(), ihdr(), pngChunk("IDAT", new Uint8Array()), pngChunk("IEND", new Uint8Array())]), limits, allGroups);
    expect(duplicateHeader.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_PNG" }));
    const afterEnd = await parsePng(concat(png([ihdr(), pngChunk("IDAT", new Uint8Array()), pngChunk("IEND", new Uint8Array())]), pngChunk("tEXt", encoder.encode("x\0y"))), limits, allGroups);
    expect(afterEnd.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_PNG" }));
  });

  it("covers WebP image signatures, dimensions, metadata selection, duplicates, and limits", () => {
    const vp8x = webp([webpChunk("VP8X", concat(Uint8Array.of(0, 0, 0, 0), le24(1), le24(1))) ]);
    expect(parseWebpDimensions(vp8x)).toEqual({ width: 2, height: 2 });
    const vp8l = webp([webpChunk("VP8L", Uint8Array.of(0x2f, 1, 0x40, 0, 0))]);
    expect(parseWebpDimensions(vp8l)).toEqual({ width: 2, height: 2 });
    const vp8 = webp([webpChunk("VP8 ", Uint8Array.of(0x10, 0, 0, 0x9d, 1, 0x2a, 2, 0, 2, 0))]);
    expect(parseWebpDimensions(vp8)).toEqual({ width: 2, height: 2 });
    const badVp8l = vp8l.slice(); badVp8l[24] = 0xe0;
    expect(parseWebpDimensions(badVp8l)).toBeNull();
    const badVp8 = vp8.slice(); badVp8[20] = 1;
    expect(parseWebpDimensions(badVp8)).toBeNull();
    expect(parseWebpDimensions(vp8.slice(0, -1))).toBeNull();
    const metadata = webp([
      webpChunk("VP8X", concat(Uint8Array.of(0, 0, 0, 0), le24(1), le24(1))),
      webpChunk("XMP ", encoder.encode("<x:xmpmeta/>")),
      webpChunk("XMP ", encoder.encode("<x:xmpmeta>second</x:xmpmeta>")),
      webpChunk("EXIF", tiffWithMake()),
      webpChunk("EXIF", tiffWithMake()),
    ]);
    const parsed = parseWebp(metadata, limits, allGroups);
    expect(parsed.xmp?.packets).toHaveLength(2);
    expect(parsed.warnings).toContainEqual(expect.objectContaining({ code: "DUPLICATE_EXIF" }));
    const limited = parseWebp(metadata, resolveLimits({ ...limits, maxSegments: 1 }), allGroups);
    expect(limited.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    const malformed = parseWebp(concat(encoder.encode("RIFF"), le32(100), encoder.encode("WEBP")), limits, allGroups);
    expect(malformed.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_WEBP" }));
  });

  it("covers GIF global/local tables, comments, animation, XMP, selection, and truncation", () => {
    const table = new Uint8Array(12);
    const image = concat(Uint8Array.of(0x2c), le16(0), le16(0), le16(2), le16(2), Uint8Array.of(0), Uint8Array.of(2), Uint8Array.of(1, 0), Uint8Array.of(0));
    const xmp = encoder.encode("<x:xmpmeta/>");
    const complete = concat(
      gifBase(4, 3, 0x80), table.slice(0, 6),
      Uint8Array.of(0x21, 0xfe), gifSubBlocks(encoder.encode("comment")),
      application("NETSCAPE2.0", Uint8Array.of(1, 2, 0)),
      application("XMP DataXMP", concat(xmp, Uint8Array.of(1))),
      image,
      Uint8Array.of(0x3b),
    );
    const parsed = parseGif(complete, limits, allGroups);
    expect(parsed.dimensions).toEqual({ width: 4, height: 3 });
    expect(parsed.fields).toEqual(expect.arrayContaining([expect.objectContaining({ name: "Comment" }), expect.objectContaining({ name: "FrameCount", value: 1 }), expect.objectContaining({ name: "LoopCount", value: 2 })]));
    expect(parsed.xmp?.packets).toEqual([decoder.decode(xmp)]);
    expect(parseGif(gifBase(4, 3, 0x80).slice(0, 13), limits, allGroups).warnings[0]?.code).toBe("MALFORMED_GIF");
    expect(parseGif(concat(gifBase(), Uint8Array.of(0x2c)), limits, allGroups).warnings[0]?.code).toBe("MALFORMED_GIF");
    expect(parseGif(concat(gifBase(), Uint8Array.of(0x21, 0xff, 3), encoder.encode("bad")), limits, allGroups).warnings[0]?.code).toBe("MALFORMED_GIF");
    expect(parseGif(concat(gifBase(), Uint8Array.of(0x21, 0xfe, 3, 1)), limits, allGroups).warnings[0]?.code).toBe("MALFORMED_GIF");
    const invalidXmp = parseGif(concat(gifBase(), application("XMP DataXMP", Uint8Array.of(0xff)), Uint8Array.of(0x3b)), limits, allGroups);
    expect(invalidXmp.warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
    const skipped = parseGif(complete, limits, resolveSelection({ groups: ["Dimensions"] }));
    expect(skipped.blocks).toEqual(expect.arrayContaining([expect.objectContaining({ status: "skipped" })]));
  });

  it("covers JPEG XL ratio dimensions and explicit malformed raw codestream outcomes", async () => {
    expect((await parseJxl(codestream(1200, 900, 2), limits, allGroups)).dimensions).toEqual({ width: 1080, height: 900 });
    for (const ratio of [1, 3, 4, 5, 6]) expect((await parseJxl(codestream(1200, 900, ratio), limits, allGroups)).dimensions).not.toBeNull();
    expect((await parseJxl(codestream(1200, 900, 7), limits, allGroups)).dimensions).toEqual({ width: 1800, height: 900 });
    const invalid = await parseJxl(Uint8Array.of(0xff, 0x0a, 0x01), limits, allGroups);
    expect(invalid.dimensions).toBeNull();
    expect(invalid.warnings).toContainEqual(expect.objectContaining({ code: "TRUNCATED_DATA" }));
    expect((await parseJxl(Uint8Array.of(1, 2, 3), limits, allGroups)).warnings[0]?.code).toBe("MALFORMED_JXL");
    expect((await parseJxl(Uint8Array.of(0xff, 0x0a), limits, allGroups)).warnings).toContainEqual(expect.objectContaining({ code: "TRUNCATED_DATA" }));
    const completeTwice = await parseJxl(jxlContainer(jxlBox("jxlc", codestream(64, 64)), jxlBox("jxlc", codestream(64, 64))), limits, allGroups);
    expect(completeTwice.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_JXL" }));
    const malformedCodestream = await parseJxl(jxlContainer(jxlBox("jxlc", Uint8Array.of(0xff, 0x0a, 0x00))), limits, allGroups);
    expect(malformedCodestream.warnings).toContainEqual(expect.objectContaining({ code: "TRUNCATED_DATA" }));
    const directExif = await parseJxl(jxlContainer(jxlBox("Exif", Uint8Array.of(0, 0, 0, 20))), limits, allGroups);
    expect(directExif.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_EXIF" }));
    const directXml = await parseJxl(jxlContainer(jxlBox("xml ", Uint8Array.of(0xff))), limits, allGroups);
    expect(directXml.warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
    const skippedXml = await parseJxl(jxlContainer(jxlBox("xml ", encoder.encode("<x:xmpmeta/>"))), limits, resolveSelection({ groups: ["EXIF"] }));
    expect(skippedXml.blocks).toContainEqual(expect.objectContaining({ family: "XMP", status: "skipped" }));
    const unknownBrob = await parseJxl(jxlContainer(jxlBox("brob", encoder.encode("freepayload"))), limits, allGroups);
    expect(unknownBrob.blocks).toContainEqual(expect.objectContaining({ status: "opaque" }));
  });

  it("covers ICC header limits and complete-profile diagnostics", () => {
    const empty = minimalIcc();
    expect(inspectIccProfile([iccChunk(empty)], resolveLimits({ maxMetadataBytes: 1 })).warnings[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(inspectIccProfile([iccChunk(minimalIcc({ declaredSize: 131 }))], limits).warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
    expect(inspectIccProfile([iccChunk(minimalIcc({ declaredSize: 500 }))], limits).warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
    expect(inspectIccProfile([iccChunk(minimalIcc({ signature: "bad!", reserved: true, renderingIntent: 4 }))], limits).warnings.length).toBeGreaterThanOrEqual(3);
    const tooMany = minimalIcc({ tagCount: 2 });
    const view = new DataView(tooMany.buffer);
    view.setUint32(132 + 4, 0x7fffffff, false);
    view.setUint32(132 + 8, 8, false);
    expect(inspectIccProfile([iccChunk(tooMany)], limits).warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
    expect(inspectIccProfile([iccChunk(tooMany)], resolveLimits({ maxIfdEntries: 1 })).warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    expect(inspectIccProfile([iccChunk(empty)], resolveLimits({ maxMetadataBytes: empty.length, maxValueBytes: empty.length })).fields.some(({ name }) => name === "ProfileDate")).toBe(false);
  });
});
