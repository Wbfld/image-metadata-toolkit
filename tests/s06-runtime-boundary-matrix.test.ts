import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { createThumbnailObjectUrl } from "../src/browser-thumbnail.js";
import { fetchMetadata } from "../src/fetch.js";
import { materializeInput, materializeJpegHeader, materializeMetadata } from "../src/input.js";
import { parseJfif } from "../src/metadata/jfif.js";
import { describeEnum, describeFlash } from "../src/normalize/descriptions.js";
import { parseMetadata } from "../src/index.js";
import { parseMetadata as parseBrowserNodeEntry } from "../src/node-browser.js";
import { jpegHeaderEnd } from "../src/jpeg-header.js";
import type { MetadataRegistryField } from "../src/registry.js";
import type { FlashValue, MetadataValue } from "../src/types.js";
import { sha256Hex, sha256HexSync } from "../src/security/sha256.js";
import { resolveLimits } from "../src/security/limits.js";
import { resolveSelection } from "../src/selection.js";
import type { MetadataResult } from "../src/types.js";

const encoder = new TextEncoder();

function arrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer;
}

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.byteLength, 0));
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.byteLength; }
  return output;
}

function segment(marker: number, payload: Uint8Array): Uint8Array {
  return concat(Uint8Array.of(0xff, marker, (payload.length + 2) >>> 8, (payload.length + 2) & 0xff), payload);
}

function pngChunk(type: string, payload: Uint8Array): Uint8Array {
  const output = new Uint8Array(12 + payload.length);
  new DataView(output.buffer).setUint32(0, payload.length);
  output.set(encoder.encode(type), 4);
  output.set(payload, 8);
  return output;
}

function validJpeg(): Uint8Array {
  const frame = segment(0xc0, Uint8Array.of(8, 0, 2, 0, 3, 1, 1, 0x11, 0));
  const scanHeader = segment(0xda, Uint8Array.of(1, 1, 0, 0, 63, 0));
  return concat(Uint8Array.of(0xff, 0xd8), frame, scanHeader, Uint8Array.of(1, 2, 3, 0xff, 0xd9));
}

function validPng(): Uint8Array {
  const ihdr = new Uint8Array(13);
  new DataView(ihdr.buffer).setUint32(0, 2);
  new DataView(ihdr.buffer).setUint32(4, 2);
  ihdr.set([8, 6, 0, 0, 0], 8);
  return concat(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), pngChunk("IHDR", ihdr), pngChunk("IEND", new Uint8Array()));
}

function validWebp(): Uint8Array {
  const image = Uint8Array.from([0x56, 0x50, 0x38, 0x4c, 5, 0, 0, 0, 0x2f, 1, 0x40, 0, 0]);
  return concat(encoder.encode("RIFF"), Uint8Array.of(18, 0, 0, 0), encoder.encode("WEBP"), image, Uint8Array.of(0));
}

function jfif(units: number, xThumbnail = 0, yThumbnail = 0): Uint8Array {
  const output = new Uint8Array(14 + xThumbnail * yThumbnail * 3);
  output.set([0x4a, 0x46, 0x49, 0x46, 0, 1, 2, units, 0, 72, 0, 72, xThumbnail, yThumbnail]);
  return output;
}

describe("S06 runtime and small-parser boundary matrix", () => {
  it("covers every JPEG header marker outcome and JFIF density branch", () => {
    const valid = validJpeg();
    expect(jpegHeaderEnd(valid)).toBe(25);
    expect(jpegHeaderEnd(Uint8Array.of(0x00, 0xd8))).toBeNull();
    expect(jpegHeaderEnd(Uint8Array.of(0xff))).toBeNull();
    expect(jpegHeaderEnd(Uint8Array.of(0xff, 0xd8, 0xff))).toBeNull();
    expect(jpegHeaderEnd(concat(Uint8Array.of(0xff, 0xd8, 0xff, 0xff, 0x01)))).toBeNull();
    expect(jpegHeaderEnd(concat(Uint8Array.of(0xff, 0xd8, 0xff, 0xd0)))).toBeNull();
    expect(jpegHeaderEnd(concat(Uint8Array.of(0xff, 0xd8, 0xff, 0xd9)))).toBeNull();
    expect(jpegHeaderEnd(Uint8Array.of(0xff, 0xd8, 0x00))).toBeNull();
    expect(jpegHeaderEnd(concat(Uint8Array.of(0xff, 0xd8), segment(0xe1, new Uint8Array()), Uint8Array.of(0xff, 0xda, 0)))).toBeNull();
    expect(jpegHeaderEnd(concat(Uint8Array.of(0xff, 0xd8), segment(0xe1, new Uint8Array()), Uint8Array.of(0xff, 0xe1, 0)))).toBeNull();
    expect(jpegHeaderEnd(concat(Uint8Array.of(0xff, 0xd8), segment(0xe1, new Uint8Array()), Uint8Array.of(0xff, 0xda, 0, 1)))).toBeNull();
    expect(jpegHeaderEnd(concat(Uint8Array.of(0xff, 0xd8), segment(0xe1, new Uint8Array()), Uint8Array.of(0xff, 0xda, 0, 4, 0)))).toBeNull();
    expect(jpegHeaderEnd(concat(Uint8Array.of(0xff, 0xd8), segment(0xe1, Uint8Array.of(1))))).toBeNull();
    expect(jpegHeaderEnd(concat(Uint8Array.of(0xff, 0xd8, 0xff, 0xe1, 0, 1)))).toBeNull();
    expect(parseJfif(jfif(0))).toMatchObject({ version: "1.02", densityUnits: "none", xDensity: 72, yDensity: 72 });
    expect(parseJfif(jfif(1))).toMatchObject({ densityUnits: "dpi" });
    expect(parseJfif(jfif(2))).toMatchObject({ densityUnits: "dpcm" });
    expect(parseJfif(jfif(9))).toMatchObject({ densityUnits: "unknown" });
    expect(parseJfif(jfif(0, 1, 0))).toBeNull();
    expect(parseJfif(jfif(0, 0, 1))).toBeNull();
    expect(parseJfif(jfif(0).subarray(0, 13))).toBeNull();
    const badIdentifier = jfif(0); badIdentifier[0] = 0; expect(parseJfif(badIdentifier)).toBeNull();
  });

  it("materializes every supported input shape and bounded Blob metadata path", async () => {
    const jpeg = validJpeg();
    const png = validPng();
    const webp = validWebp();
    const limits = resolveLimits({ maxInputBytes: 1024, maxMetadataBytes: 1024, maxSegmentBytes: 1024 });
    expect(resolveLimits({ maxInputBytes: undefined as never }).maxInputBytes).toBeGreaterThan(limits.maxInputBytes);
    const buffer = arrayBuffer(jpeg);
    expect(await materializeInput(buffer, limits)).toEqual(jpeg);
    expect(await materializeInput(new DataView(buffer), limits)).toEqual(jpeg);
    expect(await materializeInput(new Blob([arrayBuffer(jpeg)]), limits)).toEqual(jpeg);
    await expect(materializeInput({} as never, limits)).rejects.toMatchObject({ code: "INVALID_VALUE" });
    expect(await materializeJpegHeader(new Blob([arrayBuffer(jpeg)]), limits)).toEqual(jpeg.subarray(0, 25));
    expect((await materializeMetadata(new Blob([arrayBuffer(png)]), limits, { groups: new Set(["Dimensions"]), tags: null })).partial).toBe(true);
    expect((await materializeMetadata(new Blob([arrayBuffer(webp)]), limits, { groups: new Set(["Dimensions"]), tags: null })).partial).toBe(true);
    expect((await materializeMetadata(new Blob([arrayBuffer(jpeg)]), limits, { groups: new Set(["EXIF"]), tags: null })).partial).toBe(true);
    await expect(materializeInput(new Uint8Array(5), resolveLimits({ maxInputBytes: 4 }))).rejects.toMatchObject({ code: "LIMIT_EXCEEDED" });
    const malformedBlob = { size: 1, arrayBuffer: () => Promise.resolve(new Uint8Array([1])) } as unknown as Blob;
    await expect(materializeInput(malformedBlob, limits)).rejects.toMatchObject({ code: "INVALID_VALUE" });
    const aborted = new AbortController(); aborted.abort();
    await expect(materializeMetadata(new Blob([arrayBuffer(png)]), limits, { groups: null, tags: null }, aborted.signal)).rejects.toMatchObject({ code: "ABORTED" });
    expect(() => resolveSelection({ tags: [1 as never] })).toThrow(/non-empty strings/i);
  });

  it("covers fetch adapter response, streaming, status, and limit behavior without network access", async () => {
    const jpeg = validJpeg();
    const response = (init: ResponseInit = {}, body: BodyInit | null = arrayBuffer(jpeg)): Response => new Response(body, init);
    const parsed = await fetchMetadata("https://example.invalid/image.jpg", { fetch: () => Promise.resolve(response()), limits: { maxInputBytes: 4096 } });
    expect(parsed.format).toBe("jpeg");
    const streamed = await fetchMetadata("https://example.invalid/image.jpg", {
      fetch: () => Promise.resolve(response({ headers: { "content-type": "image/jpeg" } }, new ReadableStream({ start(controller) { controller.enqueue(jpeg.subarray(0, 3)); controller.enqueue(new Uint8Array()); controller.enqueue(jpeg.subarray(3)); controller.close(); } }) as unknown as BodyInit)),
      limits: { maxInputBytes: 4096 },
    });
    expect(streamed.format).toBe("jpeg");
    const noBody = await fetchMetadata("https://example.invalid/empty.jpg", { fetch: () => Promise.resolve(response({}, null)), limits: { maxInputBytes: 4096 } });
    expect(noBody.format).toBe("unknown");
    await expect(fetchMetadata("https://example.invalid/image.jpg", { fetch: () => Promise.resolve(response({ status: 404 }, arrayBuffer(jpeg))) })).rejects.toMatchObject({ code: "INVALID_VALUE" });
    await expect(fetchMetadata("https://example.invalid/image.jpg", { fetch: () => Promise.resolve(response({ headers: { "content-length": "9999" } }, arrayBuffer(jpeg))), limits: { maxInputBytes: 8 } })).rejects.toMatchObject({ code: "LIMIT_EXCEEDED" });
    const originalFetch = globalThis.fetch;
    try {
      Object.defineProperty(globalThis, "fetch", { configurable: true, value: undefined });
      await expect(fetchMetadata("https://example.invalid/image.jpg")).rejects.toMatchObject({ code: "UNSUPPORTED_FORMAT" });
    } finally {
      Object.defineProperty(globalThis, "fetch", { configurable: true, value: originalFetch });
    }
    const aborted = new AbortController(); aborted.abort();
    await expect(fetchMetadata("https://example.invalid/image.jpg", { fetch: () => Promise.resolve(response()), signal: aborted.signal })).rejects.toMatchObject({ code: "ABORTED" });
  });

  it("keeps optional Node and browser thumbnail boundaries fail-closed", async () => {
    await expect(parseBrowserNodeEntry(undefined as never)).rejects.toMatchObject({ code: "UNSUPPORTED_FORMAT" });
    const result = await parseMetadata(new Uint8Array(await readFile(new URL("./fixtures/jpeg-exif-little-endian.jpg", import.meta.url))));
    expect(createThumbnailObjectUrl(result)).toBeNull();
    const thumbnailResult = {
      ...result,
      exif: { ...(result.exif ?? {}), thumbnail: { data: Uint8Array.of(1, 2, 3), mimeType: "image/jpeg" } },
    } as MetadataResult;
    const originalUrl = globalThis.URL;
    const originalBlob = globalThis.Blob;
    const revoked: string[] = [];
    const fakeUrl = {
      createObjectURL: () => "blob:s06",
      revokeObjectURL: (value: string) => { revoked.push(value); },
    } as unknown as typeof URL;
    try {
      Object.defineProperty(globalThis, "URL", { configurable: true, value: fakeUrl });
      const object = createThumbnailObjectUrl(thumbnailResult);
      expect(object?.url).toBe("blob:s06");
      expect(object?.mimeType).toBe("image/jpeg");
      object?.revoke(); object?.revoke();
      expect(revoked).toEqual(["blob:s06"]);
      Object.defineProperty(globalThis, "URL", { configurable: true, value: { createObjectURL: () => { throw new Error("unsupported"); } } });
      expect(createThumbnailObjectUrl(thumbnailResult)).toBeNull();
      Object.defineProperty(globalThis, "Blob", { configurable: true, value: undefined });
      expect(createThumbnailObjectUrl(thumbnailResult)).toBeNull();
    } finally {
      Object.defineProperty(globalThis, "URL", { configurable: true, value: originalUrl });
      Object.defineProperty(globalThis, "Blob", { configurable: true, value: originalBlob });
    }
  });

  it("exercises SHA-256 padding and both synchronous and asynchronous contracts", async () => {
    for (const length of [0, 1, 55, 56, 63, 64, 65, 127, 128]) {
      const bytes = Uint8Array.from({ length }, (_, index) => index & 0xff);
      const asyncDigest = await sha256Hex(bytes);
      expect(asyncDigest).toBe(sha256HexSync(bytes));
      expect(asyncDigest).toMatch(/^[0-9a-f]{64}$/u);
    }
    const originalCrypto = globalThis.crypto;
    try {
      Object.defineProperty(globalThis, "crypto", {
        configurable: true,
        value: { subtle: { digest: () => Promise.reject(new Error("forced fallback")) } },
      });
      expect(await sha256Hex(Uint8Array.of(1, 2, 3))).toBe(sha256HexSync(Uint8Array.of(1, 2, 3)));
    } finally {
      Object.defineProperty(globalThis, "crypto", { configurable: true, value: originalCrypto });
    }
  });

  it("renders generated enum meanings without losing raw values or bounded input", () => {
    const definition = { enumValues: { "1": "one", abc: "letters" } } as unknown as MetadataRegistryField;
    expect(describeEnum(1, definition)).toBe("1 (one)");
    expect(describeEnum("abc\0", definition)).toBe("abc (letters)");
    expect(describeEnum(Uint8Array.of(65, 66), definition)).toBe("AB (reserved)");
    expect(describeEnum(Uint8Array.of(0xff), definition)).toBe("255 (reserved)");
    expect(describeEnum(new Uint8Array(65), definition)).toBe("0 (reserved)");
    expect(describeEnum([1, "abc"] as unknown as MetadataValue, definition)).toBe("1,abc (reserved)");
    expect(describeEnum([1, {}] as unknown as MetadataValue, definition)).toBeNull();
    expect(describeEnum(new Array(65).fill(1), definition)).toBe("1 (one)");
    expect(describeEnum({} as unknown as MetadataValue, definition)).toBeNull();
    expect(describeEnum(1, undefined)).toBeNull();
  });

  it("renders every generated flash status and presence combination", () => {
    const statuses: FlashValue["returnStatus"][] = ["detected", "not-detected", "reserved", "not-supported"];
    const modes: FlashValue["mode"][] = ["unknown", "compulsory-firing", "compulsory-suppression", "auto"];
    for (const fired of [false, true]) {
      for (const functionPresent of [false, true]) {
        for (const redEyeReduction of [false, true]) {
          for (const mode of modes) {
            for (const returnStatus of statuses) {
              const description = describeFlash({ code: 0, fired, mode, returnStatus, functionPresent, redEyeReduction });
              expect(description).toMatch(/Flash/);
            }
          }
        }
      }
    }
  });
});
