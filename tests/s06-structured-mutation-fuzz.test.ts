import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { parseMetadata } from "../src/index.js";
import { parseHeifSequences } from "../src/heif-sequences.js";
import { parseTiffGraph } from "../src/index.js";
import { resolveLimits } from "../src/security/limits.js";

const fixtures = [
  "jpeg-exif-little-endian.jpg", "jpeg-iptc.jpg", "jpeg-icc.jpg", "png-metadata.png", "png-bad-text.png",
  "webp-metadata.webp", "tiff-metadata.tif", "tiff-exif-little-endian.tif", "heif-metadata.heic", "avif-metadata.avif",
  "libavif-paris-icc-exif-xmp.avif", "source.ppm",
] as const;

const limits = resolveLimits({
  maxInputBytes: 2 * 1024 * 1024,
  maxMetadataBytes: 64 * 1024,
  maxSegmentBytes: 64 * 1024,
  maxValueBytes: 64 * 1024,
  maxStringBytes: 64 * 1024,
  maxWarnings: 64,
  maxSegments: 256,
  maxIfdEntries: 256,
  maxPngChunks: 256,
  maxImageDetailFrames: 128,
});

function nextRandom(state: number): number {
  let value = state | 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return value | 0;
}

describe("S06 deterministic structured mutation fuzz boundaries", () => {
  it("exercises bounded parser behavior across every byte neighborhood of representative containers", async () => {
    let seed = 0x6f0e1d2c;
    let cases = 0;
    for (const name of fixtures) {
      const original = new Uint8Array(await readFile(new URL(`./fixtures/${name}`, import.meta.url)));
      const positions = new Set<number>();
      for (let position = 0; position < original.length; position += Math.max(1, Math.floor(original.length / 160))) positions.add(position);
      for (const position of [0, 1, 2, 3, 4, 7, 8, 11, 12, original.length - 1, original.length - 2, original.length - 4]) if (position >= 0 && position < original.length) positions.add(position);
      for (const position of positions) {
        for (const mask of [0x01, 0x20, 0x5a, 0xff]) {
          const mutated = original.slice();
          mutated[position] = (mutated[position] ?? 0) ^ mask;
          const parsed = await parseMetadata(mutated, { limits });
          expect(parsed.fields.length, `${name}:${position}:${mask}`).toBeLessThanOrEqual(4096);
          expect(parsed.warnings.length, `${name}:${position}:${mask}`).toBeLessThanOrEqual(64);
          expect(parsed.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
          if (/\.(?:heic|avif)$/u.test(name)) {
            const sequence = parseHeifSequences(mutated, limits);
            expect(sequence.sequences.length).toBeLessThanOrEqual(256);
            expect(sequence.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
          }
          if (/\.tif$/u.test(name)) {
            try { expect(parseTiffGraph(mutated).directories.length).toBeLessThanOrEqual(256); }
            catch (error) { expect(error).toMatchObject({ name: "TiffSerializationError" }); }
          }
          cases += 1;
        }
      }
      seed = nextRandom(seed ^ original.length);
      const randomMutations = 24 + (Math.abs(seed) % 24);
      for (let iteration = 0; iteration < randomMutations; iteration += 1) {
        seed = nextRandom(seed);
        const mutated = original.slice();
        const position = Math.abs(seed) % Math.max(1, mutated.length);
        const span = Math.min(mutated.length - position, 1 + (Math.abs(nextRandom(seed)) % 8));
        for (let offset = 0; offset < span; offset += 1) {
          seed = nextRandom(seed);
          mutated[position + offset] = (mutated[position + offset] ?? 0) ^ (seed & 0xff);
        }
        const parsed = await parseMetadata(mutated, { limits });
        expect(parsed.fields.length).toBeLessThanOrEqual(4096);
        expect(parsed.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
        cases += 1;
      }
    }
    expect(cases).toBeGreaterThan(1800);
  }, 120_000);
});
