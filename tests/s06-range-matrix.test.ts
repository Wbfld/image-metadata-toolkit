import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { materializeHeifMetadata } from "../src/heif-range.js";
import { materializeTiffMetadata } from "../src/tiff-range.js";
import { resolveSelection } from "../src/selection.js";
import { resolveLimits } from "../src/security/limits.js";
import type { BlobReader } from "../src/input.js";

async function fixture(name: string): Promise<Uint8Array> {
  return new Uint8Array(await readFile(new URL(`./fixtures/${name}`, import.meta.url)));
}

function readerFor(bytes: Uint8Array, shortReadAt?: number): BlobReader {
  let bytesRead = 0;
  let readRequests = 0;
  return {
    size: bytes.length,
    read: (start, end) => {
      readRequests += 1;
      const actualEnd = shortReadAt !== undefined && start < shortReadAt && shortReadAt < end ? shortReadAt : end;
      const result = bytes.slice(start, actualEnd);
      bytesRead += result.length;
      return Promise.resolve(result);
    },
    bytesRead: () => bytesRead,
    telemetry: () => ({ readRequests, bytesRead, cacheHits: 0, coalescedReads: 0, cacheBytes: 0 }),
  };
}

describe("S06 range-I/O boundary matrix", () => {
  it("materializes classic TIFF ranges for full, selected, and bounded metadata scopes", async () => {
    const source = await fixture("tiff-metadata.tif");
    const limits = resolveLimits({ maxMetadataBytes: source.length, maxValueBytes: source.length, maxSegments: 128 });
    const selections = [
      resolveSelection(undefined),
      resolveSelection({ groups: ["EXIF", "XMP", "IPTC", "ICC", "Photoshop", "Dimensions"] }),
      resolveSelection({ groups: ["Dimensions"] }),
      resolveSelection({ groups: ["EXIF"], tags: ["Make"] }),
    ];
    for (const selection of selections) {
      const reader = readerFor(source);
      const result = await materializeTiffMetadata(reader, limits, selection);
      expect(result).not.toBeNull();
      expect(result?.partial).toBe(true);
      expect(result?.bytes.length).toBeGreaterThanOrEqual(8);
      expect(result?.bytesRead).toBeGreaterThan(0);
      expect(result?.bytesRead).toBeLessThanOrEqual(source.length * 8);
      expect(result?.telemetry?.readRequests).toBeGreaterThan(0);
      expect(result?.mapOffset?.(0)).toBe(0);
    }
  });

  it("covers TIFF byte-order, truncated-range, cumulative-budget, and invalid-header paths", async () => {
    const little = await fixture("tiff-exif-little-endian.tif");
    const big = Uint8Array.from(little);
    big[0] = 0x4d;
    big[1] = 0x4d;
    const limits = resolveLimits({ maxMetadataBytes: 128, maxValueBytes: 16, maxSegments: 2 });
    const bounded = await materializeTiffMetadata(readerFor(little), limits, resolveSelection(undefined));
    expect(bounded).toBeNull();
    const short = await materializeTiffMetadata(readerFor(little, 10), resolveLimits(), resolveSelection(undefined));
    expect(short).toMatchObject({ partial: true, inputBytes: little.length });
    expect(short?.bytes.length).toBe(10);
    expect(await materializeTiffMetadata(readerFor(big), resolveLimits(), resolveSelection(undefined))).toBeNull();
    expect(await materializeTiffMetadata(readerFor(Uint8Array.of(0x49, 0x49, 42, 0, 0, 0, 0, 8)), resolveLimits(), resolveSelection(undefined))).toBeNull();
  });

  it("materializes direct HEIF and AVIF metadata item ranges and fails closed at structural boundaries", async () => {
    const goodNames = ["heif-metadata.heic", "heif-item-metadata.heic", "avif-metadata.avif", "avif-item-metadata.avif"];
    for (const name of goodNames) {
      const source = await fixture(name);
      const reader = readerFor(source);
      const result = await materializeHeifMetadata(reader, resolveLimits({ maxMetadataBytes: source.length * 2 }), resolveSelection(undefined));
      expect(result).not.toBeNull();
      expect(result?.partial).toBe(true);
      expect(result?.bytes.length).toBeGreaterThan(0);
      expect(result?.bytesRead).toBeGreaterThan(0);
      expect(result?.bytesRead).toBeLessThanOrEqual(source.length * 8);
    }
    for (const name of ["heif-truncated.heic", "heif-item-truncated.heic"]) {
      const source = await fixture(name);
      expect(await materializeHeifMetadata(readerFor(source), resolveLimits(), resolveSelection(undefined))).toBeNull();
    }
    const source = await fixture("heif-metadata.heic");
    expect(await materializeHeifMetadata(readerFor(source), resolveLimits({ maxSegments: 1 }), resolveSelection(undefined))).toBeNull();
    expect(await materializeHeifMetadata(readerFor(source, 1), resolveLimits(), resolveSelection(undefined))).toBeNull();
  });
});
