import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { parseHeif, parseHeifDimensions } from "../src/parsers/heif.js";
import { parseGif } from "../src/parsers/gif.js";
import { parseJpeg } from "../src/parsers/jpeg.js";
import { parseJxl } from "../src/parsers/jxl.js";
import { parsePng } from "../src/parsers/png.js";
import { parseCr3, parseRaf } from "../src/parsers/raw-phase-two.js";
import { parseSvg } from "../src/parsers/svg.js";
import { parseTiffMetadata } from "../src/parsers/tiff.js";
import { parseWebp } from "../src/parsers/webp.js";
import { parseHeifSequences } from "../src/heif-sequences.js";
import { resolveSelection } from "../src/selection.js";
import { resolveLimits } from "../src/security/limits.js";
import type { ParsedMetadataResult } from "../src/types.js";

const limits = resolveLimits({
  maxInputBytes: 128 * 1024,
  maxMetadataBytes: 32 * 1024,
  maxSegmentBytes: 32 * 1024,
  maxValueBytes: 32 * 1024,
  maxStringBytes: 16 * 1024,
  maxDecompressedBytes: 16 * 1024,
  maxDecompressedMetadataBytes: 16 * 1024,
  maxXmpNodes: 128,
  maxXmpProperties: 128,
  maxXmpArrayItems: 128,
  maxXmpQualifiers: 128,
  maxXmpOutputBytes: 32 * 1024,
  maxIptcDatasets: 128,
  maxIptcCandidates: 128,
  maxIptcOutputBytes: 32 * 1024,
  maxIccDecodedTags: 64,
  maxIccElements: 128,
  maxIccOutputBytes: 32 * 1024,
  maxWarnings: 64,
});

const allGroups = resolveSelection(undefined);

function bytes(seed: number, length: number): Uint8Array {
  let state = seed >>> 0;
  const output = new Uint8Array(length);
  for (let index = 0; index < output.length; index += 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    output[index] = state >>> 24;
  }
  return output;
}

function withPrefix(prefix: readonly number[], seed: number, length: number): Uint8Array {
  const output = bytes(seed, Math.max(length, prefix.length));
  output.set(prefix);
  return output;
}

function assertBounded(result: ParsedMetadataResult): void {
  expect(result.fields).toBeInstanceOf(Array);
  expect(result.blocks ?? []).toBeInstanceOf(Array);
  expect(result.warnings).toBeInstanceOf(Array);
  expect(result.fields.length).toBeLessThanOrEqual(limits.maxAdapterItems);
  expect(result.blocks?.length ?? 0).toBeLessThanOrEqual(limits.maxAdapterItems);
  expect(result.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
  expect(result.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
}

describe("S06 adversarial byte-grid parser coverage", () => {
  it("drives every independent decoder through short, partial-header, and structured random inputs", async () => {
    const inputs: Uint8Array[] = [];
    const prefixes = [
      [0xff, 0xd8],
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50],
      [0x49, 0x49, 0x2a, 0, 8, 0, 0, 0],
      [0x4d, 0x4d, 0, 0x2a, 0, 0, 0, 8],
      [0x66, 0x74, 0x79, 0x70],
      [0x00, 0x00, 0x00, 0x0c, 0x6d, 0x65, 0x74, 0x61],
      [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
      [0xff, 0x0a],
      [0x3c, 0x73, 0x76, 0x67],
    ];
    for (let seed = 1; seed <= 16; seed += 1) {
      for (let length = 0; length <= 768; length += 17) inputs.push(bytes(seed * 0x1021, length));
      for (const prefix of prefixes) {
        for (const length of [prefix.length, prefix.length + 1, prefix.length + 7, prefix.length + 31, prefix.length + 255]) {
          inputs.push(withPrefix(prefix, seed * 0x41, length));
        }
      }
    }

    for (const input of inputs) {
      assertBounded(parseJpeg(input, limits));
      assertBounded(await parsePng(input, limits, allGroups));
      assertBounded(parseWebp(input, limits, allGroups));
      assertBounded(parseTiffMetadata(input, limits, allGroups));
      assertBounded(parseGif(input, limits, allGroups));
      assertBounded(parseSvg(input, limits, allGroups));
      assertBounded(parseHeif(input, limits, "heif", allGroups));
      assertBounded(parseCr3(input, limits, allGroups));
      assertBounded(parseRaf(input, limits, allGroups));
      parseHeifDimensions(input, 4, 128);
      const sequenceResult = parseHeifSequences(input, limits);
      expect(sequenceResult.sequences).toBeInstanceOf(Array);
      expect(sequenceResult.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
      const jxlResult = await parseJxl(input, limits, allGroups);
      assertBounded(jxlResult);
    }
  }, 120_000);

  it("exercises every decoder with every repository fixture and its family selections", async () => {
    const fixtureNames = [
      "avif-idat-item-metadata.avif", "avif-item-metadata.avif", "avif-metadata.avif", "avif-primary-dimensions.avif", "avif-primary-icc.avif", "avif-primary-nclx.avif",
      "base.jpg", "base.png", "base.webp", "heif-conflicting-primary-dimensions.heic", "heif-cross-meta-item-reference.heic", "heif-idat-item-metadata.heic", "heif-indexed-idat-item-metadata.heic", "heif-iref-exif.heic", "heif-item-metadata.heic", "heif-item-truncated.heic", "heif-metadata.heic", "heif-primary-dimensions.heic", "heif-primary-icc-malformed.heic", "heif-primary-icc.heic", "heif-tail-idat-item-metadata.heic", "heif-truncated.heic",
      "jpeg-exif-little-endian.jpg", "jpeg-icc-malformed.jpg", "jpeg-icc.jpg", "jpeg-iptc-malformed.jpg", "jpeg-iptc.jpg", "libavif-paris-icc-exif-xmp.avif", "png-bad-text.png", "png-icc-malformed.png", "png-metadata.png", "png-truncated.png", "tiff-exif-little-endian.tif", "tiff-metadata-truncated.tif", "tiff-metadata.tif", "tiff-truncated.tif", "webp-metadata.webp", "webp-truncated.webp",
    ] as const;
    const selections = [
      resolveSelection(undefined),
      resolveSelection({ groups: ["EXIF", "XMP", "IPTC", "ICC", "Dimensions", "Transform", "Nclx"] }),
      resolveSelection({ groups: [] }),
      resolveSelection({ tags: ["Make", "Model", "Orientation", "DateTime", "GPSLatitude", "XPTitle"] }),
    ];
    for (const name of fixtureNames) {
      const input = new Uint8Array(await readFile(new URL(`./fixtures/${name}`, import.meta.url)));
      for (const selection of selections) {
        assertBounded(parseJpeg(input, limits));
        assertBounded(await parsePng(input, limits, selection));
        assertBounded(parseWebp(input, limits, selection));
        assertBounded(parseTiffMetadata(input, limits, selection));
        assertBounded(parseGif(input, limits, selection));
        assertBounded(parseSvg(input, limits, selection));
        assertBounded(parseHeif(input, limits, "heif", selection));
        assertBounded(parseCr3(input, limits, selection));
        assertBounded(parseRaf(input, limits, selection));
        parseHeifDimensions(input, 8, 256);
        parseHeifSequences(input, limits);
        const jxlResult = await parseJxl(input, limits, selection);
        assertBounded(jxlResult);
      }
    }
  }, 120_000);

  it("covers every byte-prefix boundary of each recognized fixture through its native parser", async () => {
    const fixtureNames = [
      "avif-idat-item-metadata.avif", "avif-item-metadata.avif", "avif-metadata.avif", "avif-primary-dimensions.avif", "avif-primary-icc.avif", "avif-primary-nclx.avif", "libavif-paris-icc-exif-xmp.avif",
      "base.jpg", "jpeg-exif-little-endian.jpg", "jpeg-icc-malformed.jpg", "jpeg-icc.jpg", "jpeg-iptc-malformed.jpg", "jpeg-iptc.jpg",
      "base.png", "png-bad-text.png", "png-icc-malformed.png", "png-metadata.png", "png-truncated.png",
      "base.webp", "webp-metadata.webp", "webp-truncated.webp",
      "heif-conflicting-primary-dimensions.heic", "heif-cross-meta-item-reference.heic", "heif-idat-item-metadata.heic", "heif-indexed-idat-item-metadata.heic", "heif-iref-exif.heic", "heif-item-metadata.heic", "heif-item-truncated.heic", "heif-metadata.heic", "heif-primary-dimensions.heic", "heif-primary-icc-malformed.heic", "heif-primary-icc.heic", "heif-tail-idat-item-metadata.heic", "heif-truncated.heic",
      "tiff-exif-little-endian.tif", "tiff-metadata-truncated.tif", "tiff-metadata.tif", "tiff-truncated.tif",
    ] as const;
    for (const name of fixtureNames) {
      const input = new Uint8Array(await readFile(new URL(`./fixtures/${name}`, import.meta.url)));
      for (let length = 0; length <= input.length; length += 1) {
        const prefix = input.subarray(0, length).slice();
        if (name.endsWith(".jpg")) assertBounded(parseJpeg(prefix, limits));
        else if (name.endsWith(".png")) assertBounded(await parsePng(prefix, limits, allGroups));
        else if (name.endsWith(".webp")) assertBounded(parseWebp(prefix, limits, allGroups));
        else if (name.endsWith(".tif")) assertBounded(parseTiffMetadata(prefix, limits, allGroups));
        else if (name.endsWith(".heic") || name.endsWith(".avif")) {
          assertBounded(parseHeif(prefix, limits, name.endsWith(".avif") ? "avif" : "heif", allGroups));
          parseHeifSequences(prefix, limits);
          parseHeifDimensions(prefix, 8, 256);
        }
      }
    }
  }, 300_000);
});
