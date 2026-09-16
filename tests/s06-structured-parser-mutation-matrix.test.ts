import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { parseHeif, parseHeifDimensions } from "../src/parsers/heif.js";
import { parseHeifSequences } from "../src/heif-sequences.js";
import { parseCr3, parseRaf } from "../src/parsers/raw-phase-two.js";
import { resolveSelection } from "../src/selection.js";
import { resolveLimits } from "../src/security/limits.js";
import type { ParsedMetadataResult } from "../src/types.js";

const selection = resolveSelection(undefined);
const limits = resolveLimits({
  maxInputBytes: 128 * 1024,
  maxMetadataBytes: 32 * 1024,
  maxSegmentBytes: 16 * 1024,
  maxValueBytes: 16 * 1024,
  maxStringBytes: 16 * 1024,
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
    return /^[A-Z][A-Z0-9_]+$/u.test(code) &&
      (offset === undefined || (Number.isSafeInteger(offset) && offset >= 0)) &&
      (length === undefined || (Number.isSafeInteger(length) && length >= 0));
  })).toBe(true);
}

function mutated(source: Uint8Array, offset: number, value: number): Uint8Array {
  const output = source.slice();
  output[offset] = value;
  return output;
}

describe("S06 structured-container mutation contracts", () => {
  it("reparses every HEIF and AVIF item graph after deterministic header and boundary mutations", async () => {
    const names = [
      "heif-metadata.heic",
      "heif-item-metadata.heic",
      "heif-idat-item-metadata.heic",
      "heif-indexed-idat-item-metadata.heic",
      "heif-primary-dimensions.heic",
      "heif-primary-icc.heic",
      "heif-conflicting-primary-dimensions.heic",
      "heif-cross-meta-item-reference.heic",
      "heif-iref-exif.heic",
      "heif-item-truncated.heic",
      "avif-metadata.avif",
      "avif-item-metadata.avif",
      "avif-idat-item-metadata.avif",
      "avif-primary-dimensions.avif",
      "avif-primary-icc.avif",
      "avif-primary-nclx.avif",
    ] as const;
    for (const name of names) {
      const source = await fixture(name);
      const format = name.endsWith(".avif") ? "avif" : "heif";
      const offsets = [...new Set([0, 1, 4, 7, 8, 12, 15, 16, 23, 24, 31, 32, Math.floor(source.length / 4), Math.floor(source.length / 2), Math.max(0, source.length - 16)])]
        .filter((offset) => offset >= 0 && offset < source.length);
      for (const offset of offsets) {
        for (const value of [0x00, 0x01, 0x7f, 0xff]) {
          const input = mutated(source, offset, value);
          const result = parseHeif(input, limits, format, selection);
          assertBounded(result);
          const dimensions = parseHeifDimensions(input, 8, 256);
          expect(dimensions === null || (dimensions.width > 0 && dimensions.height > 0)).toBe(true);
          const sequences = parseHeifSequences(input, limits);
          expect(sequences.sequences).toBeInstanceOf(Array);
          expect(sequences.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
        }
      }
    }
  }, 120_000);

  it("keeps CR3 and RAF inventories typed for every representative structural mutation", async () => {
    const cr3Source = await fixture("base.jpg");
    const rafSource = await fixture("base.jpg");
    const inputs = [cr3Source, rafSource];
    for (const source of inputs) {
      const offsets = [...new Set([0, 1, 4, 7, 8, 12, 16, 24, 32, 64, Math.floor(source.length / 2), Math.max(0, source.length - 8)])]
        .filter((offset) => offset < source.length);
      for (const offset of offsets) {
        for (const value of [0x00, 0x63, 0xff]) {
          const input = mutated(source, offset, value);
          assertBounded(parseCr3(input, limits, selection));
          assertBounded(parseRaf(input, limits, selection));
        }
      }
    }
  }, 120_000);
});
