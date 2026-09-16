import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { parseHeif } from "../src/parsers/heif.js";
import { parseJpeg } from "../src/parsers/jpeg.js";
import { parsePng } from "../src/parsers/png.js";
import { parseTiffMetadata } from "../src/parsers/tiff.js";
import { parseWebp } from "../src/parsers/webp.js";
import { resolveSelection } from "../src/selection.js";
import { resolveLimits } from "../src/security/limits.js";
import type { ParsedMetadataResult, SecurityLimits } from "../src/types.js";

const selection = resolveSelection(undefined);
const limits: SecurityLimits = resolveLimits({
  maxInputBytes: 128 * 1024,
  maxMetadataBytes: 32 * 1024,
  maxSegmentBytes: 16 * 1024,
  maxValueBytes: 16 * 1024,
  maxWarnings: 64,
  maxSegments: 256,
  maxIfdEntries: 128,
  maxIfdDepth: 8,
});

async function fixture(name: string): Promise<Uint8Array> {
  return new Uint8Array(await readFile(new URL(`./fixtures/${name}`, import.meta.url)));
}

function assertBounded(result: ParsedMetadataResult): void {
  expect(result.fields).toBeInstanceOf(Array);
  expect(result.blocks ?? []).toBeInstanceOf(Array);
  expect(result.warnings).toBeInstanceOf(Array);
  expect(result.fields.length).toBeLessThanOrEqual(limits.maxAdapterItems);
  expect(result.blocks?.length ?? 0).toBeLessThanOrEqual(limits.maxAdapterItems);
  expect(result.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
  expect(result.warnings.every(({ code, offset, length }) => {
    return /^[A-Z][A-Z0-9_]+$/u.test(code) && Number.isSafeInteger(offset ?? 0) && (offset ?? 0) >= 0 && Number.isSafeInteger(length ?? 0) && (length ?? 0) >= 0;
  })).toBe(true);
}

function mutateRepresentativeBytes(source: Uint8Array, parser: (input: Uint8Array) => ParsedMetadataResult): void {
  const original = source.slice();
  for (let offset = 0; offset < source.length; offset += 16) {
    for (const replacement of [0x00, 0xff]) {
      const mutated = source.slice();
      mutated[offset] = replacement;
      assertBounded(parser(mutated));
      expect(source).toEqual(original);
    }
  }
}

describe("S06 valid-fixture byte mutation coverage", () => {
  it("drives JPEG, PNG, WebP, and TIFF decoders through representative byte mutations", async () => {
    const jpeg = await fixture("jpeg-exif-little-endian.jpg");
    mutateRepresentativeBytes(jpeg, (input) => parseJpeg(input, limits));

    const png = await fixture("png-metadata.png");
    const originalPng = png.slice();
    for (let offset = 0; offset < png.length; offset += 16) {
      for (const replacement of [0x00, 0xff]) {
        const mutated = png.slice();
        mutated[offset] = replacement;
        assertBounded(await parsePng(mutated, limits, selection));
        expect(png).toEqual(originalPng);
      }
    }

    const webp = await fixture("webp-metadata.webp");
    mutateRepresentativeBytes(webp, (input) => parseWebp(input, limits, selection));

    for (const name of ["tiff-metadata.tif", "tiff-exif-little-endian.tif", "tiff-metadata-truncated.tif"] as const) {
      const tiff = await fixture(name);
      mutateRepresentativeBytes(tiff, (input) => parseTiffMetadata(input, limits, selection));
    }
  }, 120_000);

  it("drives every HEIF and AVIF metadata fixture through representative byte mutations", async () => {
    const names = [
      "heif-metadata.heic",
      "heif-item-metadata.heic",
      "heif-idat-item-metadata.heic",
      "heif-indexed-idat-item-metadata.heic",
      "heif-primary-dimensions.heic",
      "heif-primary-icc.heic",
      "heif-conflicting-primary-dimensions.heic",
      "avif-metadata.avif",
      "avif-item-metadata.avif",
      "avif-primary-dimensions.avif",
      "avif-primary-icc.avif",
      "avif-primary-nclx.avif",
    ] as const;
    for (const name of names) {
      const source = await fixture(name);
      mutateRepresentativeBytes(source, (input) => parseHeif(input, limits, name.endsWith(".avif") ? "avif" : "heif", selection));
    }
  }, 120_000);
});
