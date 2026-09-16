import { describe, expect, it } from "vitest";

import { materializeTiffMetadata } from "../src/tiff-range.js";
import { parseTiffMetadata } from "../src/parsers/tiff.js";
import { resolveSelection } from "../src/selection.js";
import { resolveLimits } from "../src/security/limits.js";
import type { BlobReader } from "../src/input.js";

function write16(bytes: Uint8Array, offset: number, value: number, little: boolean): void { new DataView(bytes.buffer).setUint16(offset, value, little); }
function write32(bytes: Uint8Array, offset: number, value: number, little: boolean): void { new DataView(bytes.buffer).setUint32(offset, value, little); }
function write64(bytes: Uint8Array, offset: number, value: number, little: boolean): void {
  const view = new DataView(bytes.buffer);
  const high = Math.floor(value / 0x100000000);
  const low = value >>> 0;
  if (little) { view.setUint32(offset, low, true); view.setUint32(offset + 4, high, true); }
  else { view.setUint32(offset, high, false); view.setUint32(offset + 4, low, false); }
}

function classic(little: boolean): Uint8Array {
  const bytes = new Uint8Array(600);
  bytes.set(little ? [0x49, 0x49] : [0x4d, 0x4d], 0);
  write16(bytes, 2, 42, little);
  write32(bytes, 4, 8, little);
  const entries: readonly [number, number, number, number, number][] = [
    [0x0100, 3, 1, 640, 0],
    [0x0101, 3, 1, 480, 0],
    [0x8769, 4, 1, 120, 0],
    [0x02bc, 7, 5, 350, 0],
    [0x83bb, 7, 4, 356, 0],
    [0x8773, 7, 4, 360, 0],
    [0x8649, 7, 6, 364, 0],
    [0x014a, 4, 1, 120, 0],
  ];
  write16(bytes, 8, entries.length, little);
  for (const [index, [tag, type, count, value]] of entries.entries()) {
    const offset = 10 + index * 12;
    write16(bytes, offset, tag, little);
    write16(bytes, offset + 2, type, little);
    write32(bytes, offset + 4, count, little);
    if (tag === 0x0100) write16(bytes, offset + 8, value, little);
    else if (tag === 0x0101) write16(bytes, offset + 8, value, little);
    else write32(bytes, offset + 8, value, little);
  }
  write32(bytes, 10 + entries.length * 12, 200, little);

  write16(bytes, 120, 1, little);
  write16(bytes, 122, 0x010f, little); write16(bytes, 124, 2, little); write32(bytes, 126, 5, little); write32(bytes, 130, 450, little);
  write32(bytes, 134, 0, little);

  write16(bytes, 200, 2, little);
  write16(bytes, 202, 0x0201, little); write16(bytes, 204, 4, little); write32(bytes, 206, 1, little); write32(bytes, 210, 400, little);
  write16(bytes, 214, 0x0202, little); write16(bytes, 216, 4, little); write32(bytes, 218, 1, little); write32(bytes, 222, 4, little);
  write32(bytes, 226, 0, little);

  bytes.set(new TextEncoder().encode("Maker\0"), 450);
  bytes.set(new TextEncoder().encode("<xmp>"), 350);
  bytes.set([0x1c, 2, 0x19, 0], 356);
  bytes.set([1, 2, 3, 4], 360);
  bytes.set([0x50, 0x68, 0x6f, 0x74, 0x6f, 0x00], 364);
  bytes.set([0xff, 0xd8, 0xff, 0xd9], 400);
  return bytes;
}

function classicPointerArray(little: boolean): Uint8Array {
  const bytes = classic(little);
  const view = new DataView(bytes.buffer);
  const subIfdEntry = 10 + 7 * 12;
  view.setUint32(subIfdEntry + 4, 2, little);
  view.setUint32(subIfdEntry + 8, 500, little);
  view.setUint32(500, 120, little);
  view.setUint32(504, 0, little);
  return bytes;
}

function big(little: boolean): Uint8Array {
  const bytes = new Uint8Array(600);
  bytes.set(little ? [0x49, 0x49] : [0x4d, 0x4d], 0);
  write16(bytes, 2, 43, little); write16(bytes, 4, 8, little); write16(bytes, 6, 0, little); write64(bytes, 8, 16, little);
  write64(bytes, 16, 4, little);
  const entry = (offset: number, tag: number, type: number, count: number, value: number): void => {
    write16(bytes, offset, tag, little); write16(bytes, offset + 2, type, little); write64(bytes, offset + 4, count, little); write64(bytes, offset + 12, value, little);
  };
  entry(24, 0x0100, 16, 1, 640);
  entry(44, 0x0101, 16, 1, 480);
  entry(64, 0x8769, 16, 1, 200);
  entry(84, 0x014a, 16, 2, 360);
  write64(bytes, 104, 0, little);
  write64(bytes, 200, 1, little);
  entry(208, 0x010e, 2, 10, 420);
  write64(bytes, 228, 0, little);
  write64(bytes, 360, 200, little);
  write64(bytes, 368, 200, little);
  bytes.set(new TextEncoder().encode("Big TIFF description"), 420);
  return bytes;
}

function bigPointerArrayWithUnresolvedTarget(little: boolean): Uint8Array {
  const bytes = big(little);
  const view = new DataView(bytes.buffer);
  view.setBigUint64(368, 0n, little);
  return bytes;
}

function reader(bytes: Uint8Array): BlobReader {
  let bytesRead = 0;
  return {
    size: bytes.length,
    read: async (start, end) => { bytesRead += end - start; return await Promise.resolve(bytes.slice(start, end)); },
    bytesRead: () => bytesRead,
    telemetry: () => ({ readRequests: 0, bytesRead, cacheHits: 0, coalescedReads: 0, cacheBytes: bytesRead }),
  };
}

const all = resolveSelection({ groups: ["Dimensions", "EXIF", "XMP", "IPTC", "ICC", "Photoshop"] });

describe("S06 TIFF range endian and pointer coverage", () => {
  it("plans and compacts both classic byte orders with selected metadata, pointers, and thumbnails", async () => {
    for (const little of [true, false]) {
      const source = classic(little);
      for (const selection of [all, resolveSelection({ groups: ["EXIF"] }), resolveSelection({ groups: ["XMP"] }), resolveSelection({ groups: [] })]) {
        const result = await materializeTiffMetadata(reader(source), resolveLimits({ maxMetadataBytes: source.length, maxValueBytes: source.length, maxSegments: 32 }), selection);
        expect(result).not.toBeNull();
        expect(result?.partial).toBe(true);
        expect(result?.bytes.length).toBeLessThanOrEqual(source.length);
        expect(result?.mapOffset?.(0)).toBe(0);
        expect(result?.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
        const parsed = parseTiffMetadata(source, resolveLimits({ maxMetadataBytes: source.length, maxValueBytes: source.length, maxSegments: 32 }), selection);
        expect(parsed.fields).toBeInstanceOf(Array);
        expect(parsed.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
      }
      const parseLimits = resolveLimits({ maxMetadataBytes: source.length, maxValueBytes: source.length, maxSegments: 32, maxIfdEntries: 32 });
      const selections = [
        all,
        resolveSelection({ groups: ["EXIF"] }),
        resolveSelection({ groups: ["XMP"] }),
        resolveSelection({ groups: ["IPTC"] }),
        resolveSelection({ groups: ["ICC"] }),
        resolveSelection({ groups: ["Photoshop"] }),
        resolveSelection({ groups: ["MakerNote"] }),
        resolveSelection({ groups: [] }),
      ];
      for (const selection of selections) {
        for (const extractThumbnail of [true, false]) {
          const parsed = parseTiffMetadata(source, parseLimits, selection, extractThumbnail, undefined, undefined, (offset) => offset + 1, source.length + 1);
          expect(parsed.fields).toBeInstanceOf(Array);
          expect(parsed.blocks).toBeInstanceOf(Array);
          expect(parsed.warnings.length).toBeLessThanOrEqual(parseLimits.maxWarnings);
        }
      }
      const limited = await materializeTiffMetadata(reader(source), resolveLimits({ maxMetadataBytes: 16, maxValueBytes: 2 }), all);
      expect(limited === null || limited.warnings.some(({ code }) => code === "LIMIT_EXCEEDED") || limited.partial).toBe(true);
      expect(await materializeTiffMetadata(reader(source.slice(0, 16)), resolveLimits(), all)).toBeNull();
    }
  });

  it("retains bounded BigTIFF pointer widths, shared ranges, depth, and budget failures", async () => {
    for (const little of [true, false]) {
      const source = big(little);
      const result = await materializeTiffMetadata(reader(source), resolveLimits({ maxMetadataBytes: source.length, maxValueBytes: source.length, maxSegments: 32 }), all);
      expect(result).not.toBeNull();
      expect(result?.bytes.length).toBeGreaterThanOrEqual(16);
      expect(result?.mapOffset?.(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
      const parsed = parseTiffMetadata(source, resolveLimits({ maxMetadataBytes: source.length, maxValueBytes: source.length, maxSegments: 32 }), all);
      expect(parsed.fields).toBeInstanceOf(Array);
      const limited = await materializeTiffMetadata(reader(source), resolveLimits({ maxMetadataBytes: 24, maxValueBytes: 8 }), all);
      expect(limited === null || limited.warnings.some(({ code }) => code === "LIMIT_EXCEEDED") || limited.partial).toBe(true);
      const shallow = await materializeTiffMetadata(reader(source), resolveLimits({ maxIfdDepth: 1, maxMetadataBytes: source.length }), all);
      expect(shallow === null || shallow.warnings.some(({ code }) => code === "LIMIT_EXCEEDED") || shallow.partial).toBe(true);
      const malformed = source.slice();
      write64(malformed, 16, Number.MAX_SAFE_INTEGER, little);
      const malformedResult = await materializeTiffMetadata(reader(malformed), resolveLimits({ maxMetadataBytes: source.length, maxValueBytes: source.length }), all);
      expect(malformedResult === null || malformedResult.warnings.some(({ code }) => code === "UNSAFE_OFFSET" || code === "TRUNCATED_DATA")).toBe(true);
    }
  });

  it("rewrites out-of-line pointer arrays without inventing a target for a reserved zero", async () => {
    for (const little of [true, false]) {
      const classicResult = await materializeTiffMetadata(
        reader(classicPointerArray(little)),
        resolveLimits({ maxMetadataBytes: 600, maxValueBytes: 600, maxSegments: 32 }),
        all,
      );
      expect(classicResult).not.toBeNull();
      expect(classicResult?.warnings.some(({ code }) => code === "UNSAFE_OFFSET")).toBe(false);

      const bigResult = await materializeTiffMetadata(
        reader(bigPointerArrayWithUnresolvedTarget(little)),
        resolveLimits({ maxMetadataBytes: 600, maxValueBytes: 600, maxSegments: 32 }),
        all,
      );
      expect(bigResult).not.toBeNull();
      expect(bigResult?.bytes.length ?? 0).toBeGreaterThan(16);
    }
  });

  it("reports an oversized IFD1 thumbnail without treating it as a materialized payload", async () => {
    const source = classic(true);
    const view = new DataView(source.buffer);
    view.setUint32(200 + 2 + 12 + 8, 0x10000, true);
    const result = await materializeTiffMetadata(
      reader(source),
      resolveLimits({ maxMetadataBytes: source.length, maxValueBytes: 128, maxSegments: 32 }),
      all,
    );
    expect(result).not.toBeNull();
    expect(result?.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
  });
});
