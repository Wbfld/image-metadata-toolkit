import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { materializeInput, materializeJpegHeader, materializeMetadata } from "../src/input.js";
import { parseJfif } from "../src/metadata/jfif.js";
import { resolveSelection } from "../src/selection.js";
import { resolveLimits } from "../src/security/limits.js";
import type { SecurityLimits } from "../src/types.js";

const encoder = new TextEncoder();
const limits: SecurityLimits = resolveLimits({ maxInputBytes: 64 * 1024, maxMetadataBytes: 16 * 1024, maxSegmentBytes: 8 * 1024, maxWarnings: 16 });

function blobLike(value: { readonly size: unknown; readonly arrayBuffer: () => Promise<unknown>; readonly slice?: (start?: number, end?: number) => unknown }): Blob {
  return value as unknown as Blob;
}

function blobOf(bytes: Uint8Array): Blob {
  return new Blob([new Uint8Array(bytes).buffer]);
}

function pngChunk(type: string, payload: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(12 + payload.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, payload.length, false);
  bytes.set(encoder.encode(type), 4);
  bytes.set(payload, 8);
  return bytes;
}

function webpChunk(type: string, payload: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(8 + payload.length + (payload.length & 1));
  bytes.set(encoder.encode(type), 0);
  new DataView(bytes.buffer).setUint32(4, payload.length, true);
  bytes.set(payload, 8);
  return bytes;
}

describe("S06 input and JFIF boundary contracts", () => {
  it("accepts supported input representations and rejects malformed or over-limit Blob contracts", async () => {
    const bytes = Uint8Array.from([1, 2, 3, 4]);
    expect(await materializeInput(bytes.buffer, limits)).toEqual(bytes);
    expect(await materializeInput(new DataView(bytes.buffer, 1, 2), limits)).toEqual(Uint8Array.of(2, 3));
    expect(await materializeInput(new Blob([bytes]), limits)).toEqual(bytes);
    await expect(materializeInput(null as never, limits)).rejects.toMatchObject({ code: "INVALID_VALUE" });
    await expect(materializeInput(blobLike({ size: -1, arrayBuffer: () => Promise.resolve(bytes.buffer) }), limits)).rejects.toMatchObject({ code: "INVALID_VALUE" });
    await expect(materializeInput(blobLike({ size: limits.maxInputBytes + 1, arrayBuffer: () => Promise.resolve(bytes.buffer) }), limits)).rejects.toMatchObject({ code: "LIMIT_EXCEEDED" });
    await expect(materializeInput(blobLike({ size: 4, arrayBuffer: () => Promise.resolve("not-an-array-buffer") }), limits)).rejects.toMatchObject({ code: "INVALID_VALUE" });
    await expect(materializeInput(Uint8Array.from({ length: limits.maxInputBytes + 1 }), limits)).rejects.toMatchObject({ code: "LIMIT_EXCEEDED" });
    const aborted = new AbortController();
    aborted.abort();
    await expect(materializeInput(bytes, limits, aborted.signal)).rejects.toThrow(/abort/i);
  });

  it("materializes metadata-scoped Blob inputs across PNG, WebP, JPEG, TIFF, and fallback paths", async () => {
    const png = concat(Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), pngChunk("IEND", new Uint8Array()));
    const webpPayload = concat(Uint8Array.from([0x52, 0x49, 0x46, 0x46]), Uint8Array.of(4, 0, 0, 0), encoder.encode("WEBP"), webpChunk("VP8X", new Uint8Array(10)));
    const jpeg = new Uint8Array(await readFile(new URL("./fixtures/jpeg-exif-little-endian.jpg", import.meta.url)));
    const tiff = new Uint8Array(await readFile(new URL("./fixtures/tiff-metadata.tif", import.meta.url)));
    for (const value of [png, webpPayload, jpeg, tiff, Uint8Array.of(0x01, 0x02, 0x03)]) {
      const result = await materializeMetadata(blobOf(value), limits, resolveSelection(undefined));
      expect(result.bytes).toBeInstanceOf(Uint8Array);
      expect(result.bytes.length).toBeGreaterThanOrEqual(0);
      expect(result.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
    }
    const aborted = new AbortController();
    aborted.abort();
    await expect(materializeMetadata(blobOf(png), limits, resolveSelection(undefined), aborted.signal)).rejects.toThrow(/abort/i);
  });

  it("keeps JPEG header reads bounded and typed for malformed slice implementations", async () => {
    const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]);
    expect(await materializeJpegHeader(jpeg, limits)).toEqual(jpeg);
    const actualBlob = new Blob([jpeg]);
    expect(await materializeJpegHeader(actualBlob, limits)).toEqual(jpeg);
    await expect(materializeJpegHeader(blobLike({ size: 4, arrayBuffer: () => Promise.resolve(jpeg.buffer) }), limits)).rejects.toMatchObject({ code: "INVALID_VALUE" });
    await expect(materializeJpegHeader(blobLike({ size: -1, arrayBuffer: () => Promise.resolve(jpeg.buffer), slice: () => actualBlob }), limits)).rejects.toMatchObject({ code: "INVALID_VALUE" });
    await expect(materializeJpegHeader(blobLike({ size: limits.maxInputBytes + 1, arrayBuffer: () => Promise.resolve(jpeg.buffer), slice: () => actualBlob }), limits)).rejects.toMatchObject({ code: "LIMIT_EXCEEDED" });
    await expect(materializeJpegHeader(blobLike({ size: 4, arrayBuffer: () => Promise.resolve(jpeg.buffer), slice: () => ({ arrayBuffer: () => Promise.resolve("bad") }) }), limits)).rejects.toMatchObject({ code: "INVALID_VALUE" });
    const abort = new AbortController();
    abort.abort();
    await expect(materializeJpegHeader(actualBlob, limits, abort.signal)).rejects.toThrow(/abort/i);
  });

  it("validates JFIF identifiers, thumbnail cardinality, dimensions, density units, and payload lengths", () => {
    const base = Uint8Array.from([0x4a, 0x46, 0x49, 0x46, 0, 1, 2, 0, 0, 72, 0, 72, 0, 0]);
    expect(parseJfif(base)).toMatchObject({ version: "1.02", densityUnits: "none", xDensity: 72, yDensity: 72 });
    for (const units of [0, 1, 2, 3]) {
      const value = base.slice();
      value[7] = units;
      expect(parseJfif(value)?.densityUnits).toBe(units === 0 ? "none" : units === 1 ? "dpi" : units === 2 ? "dpcm" : "unknown");
    }
    const badIdentifier = base.slice();
    badIdentifier[0] = 0;
    expect(parseJfif(badIdentifier)).toBeNull();
    expect(parseJfif(base.slice(0, 13))).toBeNull();
    const oneSidedThumbnail = base.slice();
    oneSidedThumbnail[12] = 1;
    expect(parseJfif(oneSidedThumbnail)).toBeNull();
    const thumbnail = base.slice();
    thumbnail[12] = 1;
    thumbnail[13] = 1;
    expect(parseJfif(thumbnail)).toBeNull();
    expect(parseJfif(concat(base, Uint8Array.of(0)))).toBeNull();
  });
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
