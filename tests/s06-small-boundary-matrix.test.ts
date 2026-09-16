import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { parseJpegMetadata } from "../src/jpeg.js";
import { redactMetadata } from "../src/redact.js";
import { parsePngDimensions } from "../src/parsers/png.js";
import { parseWebpDimensions } from "../src/parsers/webp.js";
import { parseMetadata } from "../src/index.js";
import { resolveLimits } from "../src/security/limits.js";
import { parseMetadata as parseBrowserNodeEntry } from "../src/node-browser.js";
import type { RedactionTarget } from "../src/types.js";

const encoder = new TextEncoder();

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

function pngIhdr(width = 3, height = 2, bitDepth = 8, colorType = 6, compression = 0, filter = 0, interlace = 0): Uint8Array {
  const data = new Uint8Array(13);
  const view = new DataView(data.buffer);
  view.setUint32(0, width, false); view.setUint32(4, height, false);
  data.set([bitDepth, colorType, compression, filter, interlace], 8);
  const chunk = new Uint8Array(33);
  chunk.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  chunk.set(data, 16);
  new DataView(chunk.buffer).setUint32(8, 13, false);
  chunk.set(encoder.encode("IHDR"), 12);
  new DataView(chunk.buffer).setUint32(29, crc32(chunk, 12, 29), false);
  return chunk;
}

function pngIhdrOnly(...args: Parameters<typeof pngIhdr>): Uint8Array { return pngIhdr(...args); }

function webpChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(8 + data.length + (data.length & 1));
  chunk.set(encoder.encode(type), 0);
  new DataView(chunk.buffer).setUint32(4, data.length, true);
  chunk.set(data, 8);
  return chunk;
}

function webpFile(chunk: Uint8Array, declaredLength = chunk.length + 4): Uint8Array {
  const output = new Uint8Array(12 + chunk.length);
  output.set(encoder.encode("RIFF"), 0);
  output.set(encoder.encode("WEBP"), 8);
  new DataView(output.buffer).setUint32(4, declaredLength, true);
  output.set(chunk, 12);
  return output;
}

function vp8x(): Uint8Array { return Uint8Array.of(0, 0, 0, 0, 2, 0, 0, 1, 0, 0); }
function vp8l(): Uint8Array { return Uint8Array.of(0x2f, 1, 0, 0, 0); }
function vp8(): Uint8Array { return Uint8Array.of(0x10, 0, 0, 0x9d, 1, 0x2a, 3, 0, 2, 0); }

describe("S06 small parser and public-boundary matrix", () => {
  it("validates every PNG dimension header branch, including signature, CRC, limits, and legal color depths", () => {
    const signature = pngIhdrOnly();
    expect(parsePngDimensions(signature)).toEqual({ width: 3, height: 2 });
    for (const colorType of [0, 2, 3, 4, 6]) {
      const depths = colorType === 0 ? [1, 2, 4, 8, 16] : colorType === 3 ? [1, 2, 4, 8] : [8, 16];
      for (const depth of depths) expect(parsePngDimensions(pngIhdr(1, 1, depth, colorType))).toEqual({ width: 1, height: 1 });
    }
    const malformed: Uint8Array[] = [
      new Uint8Array(), Uint8Array.of(0x89), signature.slice(0, 32),
      pngIhdr(0, 1), pngIhdr(1, 0), pngIhdr(0x80000000, 1), pngIhdr(1, 0x80000000),
      pngIhdr(1, 1, 3, 0), pngIhdr(1, 1, 4, 2), pngIhdr(1, 1, 8, 1), pngIhdr(1, 1, 8, 5),
      pngIhdr(1, 1, 8, 6, 1), pngIhdr(1, 1, 8, 6, 0, 1), pngIhdr(1, 1, 8, 6, 0, 0, 2),
    ];
    for (const input of malformed) expect(parsePngDimensions(input)).toBeNull();
    const badSignature = signature.slice(); badSignature[0] = 0;
    expect(parsePngDimensions(badSignature)).toBeNull();
    const badLength = signature.slice(); new DataView(badLength.buffer).setUint32(8, 12, false);
    expect(parsePngDimensions(badLength)).toBeNull();
    const badType = signature.slice(); badType[12] = 0;
    expect(parsePngDimensions(badType)).toBeNull();
    const badCrc = signature.slice(); badCrc[32] = (badCrc[32] ?? 0) ^ 1;
    expect(parsePngDimensions(badCrc)).toBeNull();
  });

  it("validates all WebP dimension codecs and every RIFF, chunk, reserved-bit, and zero-dimension rejection", () => {
    expect(parseWebpDimensions(webpFile(webpChunk("VP8X", vp8x())))).toEqual({ width: 3, height: 2 });
    expect(parseWebpDimensions(webpFile(webpChunk("VP8L", vp8l())))).toEqual({ width: 2, height: 1 });
    expect(parseWebpDimensions(webpFile(webpChunk("VP8 ", vp8())))).toEqual({ width: 3, height: 2 });
    const malformed: Uint8Array[] = [new Uint8Array(), Uint8Array.of(0x52, 0x49, 0x46, 0x46), webpFile(webpChunk("VP8X", vp8x()), 0), webpFile(webpChunk("VP8X", vp8x()).slice(0, -1)), webpFile(webpChunk("VP8X", vp8x()).slice(0, -1), 99)];
    for (const input of malformed) expect(parseWebpDimensions(input)).toBeNull();
    expect(parseWebpDimensions(concat(encoder.encode("RIFF"), Uint8Array.of(0, 0, 0, 0), encoder.encode("WEBP")))).toBeNull();
    expect(parseWebpDimensions(webpFile(webpChunk("VP8X", vp8x().slice(0, 9))))).toBeNull();
    const reserved = vp8l(); reserved[4] = 0xe0;
    expect(parseWebpDimensions(webpFile(webpChunk("VP8L", reserved)))).toBeNull();
    const badSignature = webpFile(webpChunk("VP8L", vp8l())); badSignature[8] = 0;
    expect(parseWebpDimensions(badSignature)).toBeNull();
    const badType = webpFile(webpChunk("JUNK", vp8l())); expect(parseWebpDimensions(badType)).toBeNull();
    const badVp8Frame = vp8(); badVp8Frame[0] = 1; expect(parseWebpDimensions(webpFile(webpChunk("VP8 ", badVp8Frame)))).toBeNull();
    const zeroVp8 = vp8(); zeroVp8[6] = 0; zeroVp8[7] = 0; zeroVp8[8] = 0; zeroVp8[9] = 0;
    expect(parseWebpDimensions(webpFile(webpChunk("VP8 ", zeroVp8)))).toBeNull();
    expect(parseWebpDimensions(webpFile(webpChunk("VP8 ", vp8().slice(0, 9))))).toBeNull();
  });

  it("keeps the JPEG-specific and redaction entry points typed at format, input, scope, and cancellation boundaries", async () => {
    const jpeg = new Uint8Array(await readFile(new URL("./fixtures/jpeg-exif-little-endian.jpg", import.meta.url)));
    for (const scope of [undefined, "jpeg-header", "metadata"] as const) {
      const result = await parseJpegMetadata(jpeg, scope === undefined ? {} : { scope });
      expect(result.format).toBe("jpeg");
    }
    await expect(parseJpegMetadata(new Uint8Array([1, 2, 3]))).rejects.toMatchObject({ code: "UNSUPPORTED_FORMAT" });
    const aborted = new AbortController(); aborted.abort();
    await expect(parseJpegMetadata(jpeg, { signal: aborted.signal })).rejects.toMatchObject({ code: "ABORTED" });
    const redacted = await redactMetadata(jpeg, { remove: ["Comment" as RedactionTarget] });
    expect(redacted.data).toBeInstanceOf(Uint8Array);
    await expect((parseBrowserNodeEntry as (...args: never[]) => Promise<unknown>)()).rejects.toMatchObject({ code: "UNSUPPORTED_FORMAT" });
    await expect(parseBrowserNodeEntry(jpeg)).rejects.toMatchObject({ code: "UNSUPPORTED_FORMAT" });
    await expect(parseMetadata(jpeg, { limits: { maxInputBytes: 1 } })).rejects.toMatchObject({ code: "LIMIT_EXCEEDED" });
    expect(resolveLimits({ maxWarnings: 1 }).maxWarnings).toBe(1);
  });
});
