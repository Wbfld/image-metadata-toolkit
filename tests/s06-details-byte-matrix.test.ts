import { describe, expect, it } from "vitest";

import { deriveImageDetails } from "../src/details.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";
import type { ParsedMetadataResult } from "../src/types.js";

function base(format: ParsedMetadataResult["format"]): ParsedMetadataResult {
  return {
    format,
    mimeType: "application/octet-stream",
    dimensions: null,
    fields: [],
    exif: null,
    xmp: null,
    iptc: null,
    icc: null,
    jfif: null,
    pngText: [],
    warnings: [],
  };
}

function diagnostics(details: ReturnType<typeof deriveImageDetails>) {
  return details.diagnostics ?? [];
}

function bytes(...values: number[]): Uint8Array {
  return Uint8Array.from(values);
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function be16(value: number): Uint8Array {
  return bytes((value >>> 8) & 0xff, value & 0xff);
}

function be32(value: number): Uint8Array {
  return bytes((value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);
}

function le16(value: number): Uint8Array {
  return bytes(value & 0xff, (value >>> 8) & 0xff);
}

function le24(value: number): Uint8Array {
  return bytes(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff);
}

function ascii(text: string): Uint8Array {
  return Uint8Array.from(Array.from(text, (character) => character.charCodeAt(0)));
}

function jpegFrame(marker: number, width: number, height: number, precision: number, componentCount: number, declaredLength?: number): Uint8Array {
  const length = declaredLength ?? 8 + componentCount * 3;
  const payload = new Uint8Array(Math.max(0, length - 2));
  payload[0] = precision;
  payload[1] = (height >>> 8) & 0xff;
  payload[2] = height & 0xff;
  payload[3] = (width >>> 8) & 0xff;
  payload[4] = width & 0xff;
  payload[5] = componentCount;
  for (let index = 0; index < componentCount; index += 1) {
    const at = 6 + index * 3;
    if (at + 2 >= payload.length) break;
    payload[at] = index + 1;
    payload[at + 1] = 0x11;
    payload[at + 2] = 0;
  }
  return concat(bytes(0xff, marker), be16(length), payload);
}

function jpegWithSegments(...segments: Uint8Array[]): Uint8Array {
  return concat(bytes(0xff, 0xd8), ...segments, bytes(0xff, 0xd9));
}

function pngChunk(type: string, data: Uint8Array = new Uint8Array()): Uint8Array {
  return concat(be32(data.length), ascii(type), data, bytes(0, 0, 0, 0));
}

function pngIhdr(width: number, height: number, bitDepth: number, colorType: number, interlace = 0): Uint8Array {
  return bytes(
    ...be32(width),
    ...be32(height),
    bitDepth,
    colorType,
    0,
    0,
    interlace,
  );
}

function pngWithChunks(...chunks: Uint8Array[]): Uint8Array {
  return concat(bytes(137, 80, 78, 71, 13, 10, 26, 10), ...chunks);
}

function webpChunk(type: string, data: Uint8Array): Uint8Array {
  return concat(ascii(type), le32(data.length), data, data.length % 2 === 0 ? new Uint8Array() : bytes(0));
}

function le32(value: number): Uint8Array {
  return bytes(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function webpWithChunks(chunks: Uint8Array[], declaredSize?: number): Uint8Array {
  const payload = concat(...chunks);
  return concat(ascii("RIFF"), le32(declaredSize ?? payload.length + 4), ascii("WEBP"), payload);
}

function webpVp8x(flags: number, width: number, height: number): Uint8Array {
  return webpChunk("VP8X", concat(bytes(flags, 0, 0, 0), le24(width - 1), le24(height - 1)));
}

function webpVp8l(width: number, height: number, alpha: boolean): Uint8Array {
  const b1 = (width - 1) & 0xff;
  const b2 = ((width - 1) >>> 8) & 0x3f | (((height - 1) & 0x03) << 6);
  const b3 = ((height - 1) >>> 2) & 0xff;
  const b4 = (((height - 1) >>> 10) & 0x0f) | (alpha ? 0x10 : 0);
  return webpChunk("VP8L", bytes(0x2f, b1, b2, b3, b4));
}

function webpVp8(width: number, height: number): Uint8Array {
  const data = new Uint8Array(10);
  data.set(bytes(0, 0, 0, 0x9d, 0x01, 0x2a), 0);
  data.set(le16(width), 6);
  data.set(le16(height), 8);
  return webpChunk("VP8 ", data);
}

function gifHeader(version: "GIF87a" | "GIF89a", width: number, height: number, packed: number): Uint8Array {
  return concat(ascii(version), le16(width), le16(height), bytes(packed, 0, 0));
}

function gifSubBlocks(...blocks: Uint8Array[]): Uint8Array {
  return concat(...blocks.map((block) => concat(bytes(block.length), block)), bytes(0));
}

function gifFrame(localTable: boolean, interlaced: boolean): Uint8Array {
  const packed = (localTable ? 0x80 : 0) | (interlaced ? 0x40 : 0) | (localTable ? 1 : 0);
  return concat(bytes(0x2c), bytes(0, 0, 0, 0, 2, 0, 2, 0, packed), localTable ? bytes(0, 0, 0, 255, 255, 255) : new Uint8Array(), bytes(2), gifSubBlocks(bytes(0x4c, 0x01)));
}

function gifGraphicControl(transparent: boolean): Uint8Array {
  return bytes(0x21, 0xf9, 4, transparent ? 1 : 0, 0, 0, 0, 0);
}

function gifNetscape(loopCount: number): Uint8Array {
  return concat(bytes(0x21, 0xff, 11), ascii("NETSCAPE2.0"), bytes(3, 1, loopCount & 0xff, (loopCount >>> 8) & 0xff, 0));
}

describe("S06 byte-level image-details matrix", () => {
  it("projects baseline, progressive, grayscale, four-component, restart, standalone, and malformed JPEG headers", () => {
    const input = jpegWithSegments(
      bytes(0xff, 0xe0, 0, 2),
      bytes(0xff, 0x01),
      bytes(0xff, 0xd0),
      bytes(0xff, 0xff, 0xff),
      jpegFrame(0xc0, 640, 480, 8, 3),
      jpegFrame(0xc2, 320, 240, 12, 1),
      jpegFrame(0xca, 160, 120, 10, 4),
      jpegFrame(0xc4, 1, 1, 0, 0, 2),
      jpegFrame(0xc0, 1, 1, 8, 1, 8),
    );
    const details = deriveImageDetails(base("jpeg"), input, DEFAULT_LIMITS);
    expect(details.storedDimensions.map((item) => item.value)).toEqual(expect.arrayContaining([{ width: 640, height: 480 }, { width: 320, height: 240 }, { width: 160, height: 120 }]));
    expect(details.progressive.map((item) => item.value)).toEqual(expect.arrayContaining([false, true]));
    expect(details.components.map((item) => item.value)).toEqual(expect.arrayContaining([["1"], ["1", "2", "3"], ["1", "2", "3", "4"]]));
    expect(details.colorModel.map((item) => item.value)).toEqual(expect.arrayContaining(["grayscale", "YCbCr/RGB-unspecified", "CMYK/YCCK-unspecified"]));
    expect(diagnostics(details).some((warning) => warning.code === "MALFORMED_JPEG")).toBe(true);
    expect(details.alpha.every((item) => item.value === "absent")).toBe(true);
  });

  it("bounds JPEG marker scans and rejects truncated or malformed SOF headers", () => {
    const repeated = jpegWithSegments(...Array.from({ length: 4 }, () => bytes(0xff, 0xe1, 0, 2)));
    const limited = deriveImageDetails(base("jpeg"), repeated, { ...DEFAULT_LIMITS, maxSegments: 2 });
    expect(diagnostics(limited).some((warning) => warning.code === "LIMIT_EXCEEDED")).toBe(true);
    const truncatedLength = concat(bytes(0xff, 0xd8, 0xff, 0xe1, 0), bytes(0xff, 0xd9));
    expect(diagnostics(deriveImageDetails(base("jpeg"), truncatedLength, DEFAULT_LIMITS)).some((warning) => warning.code === "TRUNCATED_DATA")).toBe(true);
    const truncatedSegment = concat(bytes(0xff, 0xd8, 0xff, 0xe1, 0, 20, 1, 2), bytes(0xff, 0xd9));
    expect(diagnostics(deriveImageDetails(base("jpeg"), truncatedSegment, DEFAULT_LIMITS)).some((warning) => warning.code === "TRUNCATED_DATA")).toBe(true);
    expect(diagnostics(deriveImageDetails(base("jpeg"), bytes(0, 0, 0), DEFAULT_LIMITS))[0]?.code).toBe("MALFORMED_JPEG");
  });

  it("projects PNG color models, transparency, APNG counts, interlace, duplicate headers, and limits", () => {
    const apng = pngWithChunks(
      pngChunk("IHDR", pngIhdr(11, 7, 8, 6, 1)),
      pngChunk("IHDR", pngIhdr(99, 99, 8, 2)),
      pngChunk("tRNS", bytes(0, 1)),
      pngChunk("acTL", concat(be32(2), be32(7))),
      pngChunk("fcTL", new Uint8Array(26)),
      pngChunk("fcTL", new Uint8Array(26)),
      pngChunk("IEND"),
    );
    const details = deriveImageDetails(base("png"), apng, DEFAULT_LIMITS);
    expect(details.storedDimensions[0]?.value).toEqual({ width: 11, height: 7 });
    expect(details.interlaced[0]?.value).toBe(true);
    expect(details.alpha.some((item) => item.value === "present")).toBe(true);
    expect(details.animation).toEqual(expect.arrayContaining([expect.objectContaining({ value: { frames: 2, loopCount: 7 }, validation: "valid" })]));
    expect(details.animation.some((item) => item.validation === "conflicting")).toBe(false);
    const mismatch = pngWithChunks(pngChunk("IHDR", pngIhdr(2, 2, 8, 3)), pngChunk("acTL", concat(be32(3), be32(0))), pngChunk("fcTL", new Uint8Array(26)), pngChunk("IEND"));
    expect(deriveImageDetails(base("png"), mismatch, DEFAULT_LIMITS).animation.some((item) => item.validation === "conflicting")).toBe(true);
    const limited = deriveImageDetails(base("png"), apng, { ...DEFAULT_LIMITS, maxPngChunks: 1 });
    expect(diagnostics(limited).some((warning) => warning.code === "LIMIT_EXCEEDED")).toBe(true);
  });

  it("retains PNG malformed and incomplete diagnostics for signature, IHDR, chunk, and IEND failures", () => {
    expect(diagnostics(deriveImageDetails(base("png"), bytes(137, 80), DEFAULT_LIMITS))[0]?.code).toBe("MALFORMED_PNG");
    const invalidColor = pngWithChunks(pngChunk("IHDR", pngIhdr(1, 1, 0, 1)), pngChunk("IEND"));
    expect(diagnostics(deriveImageDetails(base("png"), invalidColor, DEFAULT_LIMITS)).some((warning) => warning.code === "MALFORMED_PNG")).toBe(true);
    const invalidDimensions = pngWithChunks(pngChunk("IHDR", pngIhdr(0, 1, 8, 2)), pngChunk("IEND"));
    expect(diagnostics(deriveImageDetails(base("png"), invalidDimensions, DEFAULT_LIMITS)).some((warning) => warning.code === "MALFORMED_PNG")).toBe(true);
    const missingIend = pngWithChunks(pngChunk("IHDR", pngIhdr(1, 1, 8, 0)));
    expect(diagnostics(deriveImageDetails(base("png"), missingIend, DEFAULT_LIMITS)).some((warning) => warning.code === "TRUNCATED_DATA")).toBe(true);
    const truncatedChunk = concat(bytes(137, 80, 78, 71, 13, 10, 26, 10), be32(20), ascii("tEXt"), new Uint8Array(17));
    expect(diagnostics(deriveImageDetails(base("png"), truncatedChunk, DEFAULT_LIMITS)).some((warning) => warning.code === "TRUNCATED_DATA")).toBe(true);
  });

  it("projects WebP VP8X, VP8L, VP8, animation, odd padding, unknown chunks, and bounded RIFF failures", () => {
    const webp = webpWithChunks([
      webpVp8x(0x12, 320, 240),
      webpVp8l(64, 32, true),
      webpVp8(20, 10),
      webpChunk("ANIM", concat(bytes(0, 0, 0, 0), le16(4))),
      webpChunk("ANMF", new Uint8Array(16)),
      webpChunk("ZZZZ", bytes(1)),
    ]);
    const details = deriveImageDetails(base("webp"), webp, DEFAULT_LIMITS);
    expect(details.storedDimensions).toEqual(expect.arrayContaining([expect.objectContaining({ value: { width: 320, height: 240 } }), expect.objectContaining({ value: { width: 64, height: 32 } }), expect.objectContaining({ value: { width: 20, height: 10 } })]));
    expect(details.alpha.map((item) => item.value)).toEqual(expect.arrayContaining(["present", "absent"]));
    expect(details.animation[0]?.value).toEqual({ frames: 1, loopCount: 4 });
    expect(details.formatSpecific.animated).toBe(true);
    expect(details.formatSpecific.frameCount).toBe(1);
    expect(details.formatSpecific.frameKinds).toEqual(expect.arrayContaining(["VP8L", "VP8", "ANMF"]));
    expect(details.progressive[0]?.value).toBe(false);
    expect(details.interlaced[0]?.value).toBe(false);
    const wrongSize = webpWithChunks([webpChunk("VP8 ", new Uint8Array(2))], 0x7fffffff);
    expect(diagnostics(deriveImageDetails(base("webp"), wrongSize, DEFAULT_LIMITS)).some((warning) => warning.code === "TRUNCATED_DATA")).toBe(true);
    const malformedChunk = concat(ascii("RIFF"), le32(12 + 8 + 100), ascii("WEBP"), ascii("VP8 "), le32(100), bytes(1));
    expect(diagnostics(deriveImageDetails(base("webp"), malformedChunk, DEFAULT_LIMITS)).some((warning) => warning.code === "TRUNCATED_DATA")).toBe(true);
    expect(diagnostics(deriveImageDetails(base("webp"), bytes(0, 0, 0), DEFAULT_LIMITS))[0]?.code).toBe("MALFORMED_WEBP");
  });

  it("projects complete and incomplete GIF streams, tables, transparency, looping, frames, and limits", () => {
    const complete = concat(
      gifHeader("GIF89a", 12, 8, 0x80 | 1),
      bytes(0, 0, 0, 255, 255, 255, 0, 0, 0, 255, 255, 255),
      gifGraphicControl(true),
      gifNetscape(3),
      gifFrame(false, true),
      bytes(0x3b),
    );
    const details = deriveImageDetails(base("gif"), complete, DEFAULT_LIMITS);
    expect(details.storedDimensions[0]?.value).toEqual({ width: 12, height: 8 });
    expect(details.alpha[0]?.value).toBe("present");
    expect(details.interlaced[0]?.value).toBe(true);
    expect(details.animation[0]?.value).toEqual({ frames: 1, loopCount: 3 });
    expect(details.formatSpecific).toMatchObject({ complete: true, frames: [expect.objectContaining({ interlaced: true, bitDepth: 2 })] });
    const localTable = concat(gifHeader("GIF89a", 2, 2, 0), gifFrame(true, false));
    expect(deriveImageDetails(base("gif"), localTable, DEFAULT_LIMITS).bitDepth.some((item) => item.source === "GIF local color table")).toBe(true);
    const plain = concat(gifHeader("GIF87a", 2, 3, 0), gifFrame(false, false), bytes(0x3b));
    const plainDetails = deriveImageDetails(base("gif"), plain, DEFAULT_LIMITS);
    expect(plainDetails.alpha[0]?.value).toBe("absent");
    expect(plainDetails.interlaced[0]?.value).toBe(false);
    const limited = deriveImageDetails(base("gif"), complete, { ...DEFAULT_LIMITS, maxSegments: 1 });
    expect(diagnostics(limited).some((warning) => warning.code === "LIMIT_EXCEEDED")).toBe(true);
  });

  it("retains GIF malformed extension, sub-block, image, signature, and unknown-marker diagnostics", () => {
    const truncatedGce = concat(gifHeader("GIF89a", 1, 1, 0), bytes(0x21, 0xf9, 3, 0, 0, 0));
    expect(deriveImageDetails(base("gif"), truncatedGce, DEFAULT_LIMITS).formatSpecific).toMatchObject({ complete: false, frames: [] });
    const truncatedApp = concat(gifHeader("GIF89a", 1, 1, 0), bytes(0x21, 0xff, 11), ascii("NET"));
    expect(deriveImageDetails(base("gif"), truncatedApp, DEFAULT_LIMITS).formatSpecific).toMatchObject({ complete: false });
    const truncatedFrame = concat(gifHeader("GIF89a", 1, 1, 0), bytes(0x2c, 0, 0));
    expect(deriveImageDetails(base("gif"), truncatedFrame, DEFAULT_LIMITS).formatSpecific).toMatchObject({ complete: false, frames: [] });
    const unknownMarker = concat(gifHeader("GIF89a", 1, 1, 0), bytes(0x42));
    expect(deriveImageDetails(base("gif"), unknownMarker, DEFAULT_LIMITS).formatSpecific).toMatchObject({ complete: false });
    expect(diagnostics(deriveImageDetails(base("gif"), bytes(0, 0, 0), DEFAULT_LIMITS))[0]?.code).toBe("MALFORMED_GIF");
  });
});
