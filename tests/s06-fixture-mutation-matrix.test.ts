import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { parseHeifSequences } from "../src/heif-sequences.js";
import { parseMetadata, parseTiffGraph } from "../src/index.js";
import { resolveLimits } from "../src/security/limits.js";

const fixtureNames = [
  "avif-idat-item-metadata.avif", "avif-item-metadata.avif", "avif-metadata.avif", "avif-primary-dimensions.avif", "avif-primary-icc.avif", "avif-primary-nclx.avif",
  "base.jpg", "base.png", "base.webp", "heif-conflicting-primary-dimensions.heic", "heif-cross-meta-item-reference.heic", "heif-idat-item-metadata.heic", "heif-indexed-idat-item-metadata.heic", "heif-iref-exif.heic", "heif-item-metadata.heic", "heif-item-truncated.heic", "heif-metadata.heic", "heif-primary-dimensions.heic", "heif-primary-icc-malformed.heic", "heif-primary-icc.heic", "heif-tail-idat-item-metadata.heic", "heif-truncated.heic",
  "jpeg-exif-little-endian.jpg", "jpeg-icc-malformed.jpg", "jpeg-icc.jpg", "jpeg-iptc-malformed.jpg", "jpeg-iptc.jpg", "libavif-paris-icc-exif-xmp.avif", "png-bad-text.png", "png-icc-malformed.png", "png-metadata.png", "png-truncated.png", "tiff-exif-little-endian.tif", "tiff-metadata-truncated.tif", "tiff-metadata.tif", "tiff-truncated.tif", "webp-metadata.webp", "webp-truncated.webp", "source.ppm",
] as const;

const diagnosticCode = /^[A-Z][A-Z0-9_]+$/u;

describe("S06 checked fixture mutation matrix", () => {
  it("keeps every repository fixture bounded and typed across truncation and byte mutations", async () => {
    for (const name of fixtureNames) {
      const original = new Uint8Array(await readFile(new URL(`./fixtures/${name}`, import.meta.url)));
      const boundaryLimit = Math.min(original.length, 1024);
      const sampledBoundaries = Array.from({ length: Math.floor(boundaryLimit / 64) + 1 }, (_, index) => Math.min(boundaryLimit, index * 64));
      const lengths = [...new Set([
        ...sampledBoundaries,
        ...Array.from({ length: Math.min(boundaryLimit, 32) + 1 }, (_, length) => length),
        Math.floor(original.length / 4), Math.floor(original.length / 2), Math.max(0, original.length - 1), original.length,
      ])];
      for (const length of lengths) {
        const input = original.slice(0, length);
        if (input.length > 0) { const offset = (length * 17) % input.length; input.set(Uint8Array.of((input[offset] ?? 0) ^ 0x5a), offset); }
        const before = original.slice();
        const result = await parseMetadata(input, { limits: { maxInputBytes: Math.max(1, original.length + 1), maxWarnings: 64 } });
        expect(result.fields).toBeInstanceOf(Array);
        expect(result.warnings).toBeInstanceOf(Array);
        expect(result.warnings.every(({ code }) => diagnosticCode.test(code))).toBe(true);
        expect(result.fields.length).toBeLessThanOrEqual(4096);
        expect(original).toEqual(before);
      }
      for (let mutation = 0; mutation < 12; mutation += 1) {
        const input = original.slice();
        if (input.length > 0) {
          const first = (mutation * 7919) % input.length;
          input.set(Uint8Array.of((input[first] ?? 0) ^ ((mutation * 37 + 1) & 0xff)), first);
          if (input.length > 16 && mutation % 3 === 0) {
            const second = (first + 11 + mutation) % input.length;
            input.set(Uint8Array.of((input[second] ?? 0) ^ 0xa5), second);
          }
        }
        const result = await parseMetadata(input, { limits: { maxInputBytes: Math.max(1, original.length + 1), maxWarnings: 64 } });
        expect(result.fields.length).toBeLessThanOrEqual(4096);
        expect(result.warnings.every(({ code }) => diagnosticCode.test(code))).toBe(true);
      }
      if (/\.(?:heic|avif)$/u.test(name)) {
        for (let mutation = 0; mutation < 12; mutation += 1) {
          const input = original.slice();
          if (input.length > 0) { const offset = (mutation * 3571 + 13) % input.length; input.set(Uint8Array.of((input[offset] ?? 0) ^ ((mutation * 19 + 3) & 0xff)), offset); }
          const sequenceResult = parseHeifSequences(input, resolveLimits({ maxWarnings: 64 }));
          expect(sequenceResult.sequences).toBeInstanceOf(Array);
          expect(sequenceResult.warnings.every(({ code }) => diagnosticCode.test(code))).toBe(true);
        }
      }
      if (/\.tif$/u.test(name)) {
        for (const length of lengths) {
          const input = original.slice(0, length);
          try {
            const graph = parseTiffGraph(input);
            expect(graph.directories).toBeInstanceOf(Array);
          } catch (error) {
            expect(error).toMatchObject({ name: "TiffSerializationError" });
          }
        }
      }
    }
  }, 120000);

  it("exercises selection boundaries for each supported fixture family", async () => {
    for (const name of fixtureNames) {
      const bytes = new Uint8Array(await readFile(new URL(`./fixtures/${name}`, import.meta.url)));
      for (const groups of [
        ["Dimensions"], ["EXIF"], ["XMP"], ["IPTC"], ["ICC"], ["Photoshop"], ["MakerNote"], ["MPF"], ["PNGText"], ["Nclx"], ["Transform"],
      ] as const) {
        const result = await parseMetadata(bytes, { select: { groups: [...groups] } });
        expect(result.fields).toBeInstanceOf(Array);
        expect(result.warnings.every(({ code }) => diagnosticCode.test(code))).toBe(true);
        if (groups[0] !== "Dimensions") expect(result.dimensions).toBeNull();
      }
    }
  }, 30000);
});
