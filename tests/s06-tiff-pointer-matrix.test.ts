import { describe, expect, it } from "vitest";

import { materializeTiffMetadata } from "../src/tiff-range.js";
import { resolveSelection } from "../src/selection.js";
import { resolveLimits } from "../src/security/limits.js";
import type { BlobReader } from "../src/input.js";

function put16(bytes: Uint8Array, offset: number, value: number): void {
  new DataView(bytes.buffer).setUint16(offset, value, true);
}

function put32(bytes: Uint8Array, offset: number, value: number): void {
  new DataView(bytes.buffer).setUint32(offset, value, true);
}

function entry(bytes: Uint8Array, offset: number, tag: number, type: number, count: number, value: number): void {
  put16(bytes, offset, tag);
  put16(bytes, offset + 2, type);
  put32(bytes, offset + 4, count);
  if (type === 3 && count === 1) put16(bytes, offset + 8, value);
  else if (type === 2 && count <= 4) bytes.set(new TextEncoder().encode("GPS\0").subarray(0, count), offset + 8);
  else put32(bytes, offset + 8, value);
}

function directory(bytes: Uint8Array, offset: number, entries: readonly (readonly [number, number, number, number])[], nextOffset = 0): void {
  put16(bytes, offset, entries.length);
  entries.forEach(([tag, type, count, value], index) => entry(bytes, offset + 2 + index * 12, tag, type, count, value));
  put32(bytes, offset + 2 + entries.length * 12, nextOffset);
}

function pointerFixture(): Uint8Array {
  const bytes = new Uint8Array(520);
  bytes.set([0x49, 0x49], 0);
  put16(bytes, 2, 42);
  put32(bytes, 4, 8);

  directory(bytes, 8, [
    [0x0100, 3, 1, 640],
    [0x0101, 3, 1, 480],
    [0x8769, 4, 1, 120],
    [0x8825, 4, 1, 160],
    [0x014a, 4, 1, 200],
    [0x02bc, 7, 8, 400],
    [0x8773, 7, 4, 420],
    [0x83bb, 7, 4, 430],
  ], 300);
  directory(bytes, 120, [[0xa005, 4, 1, 240]]);
  directory(bytes, 160, [[0x0001, 2, 4, 0]]);
  directory(bytes, 200, [[0x0100, 3, 1, 1280]]);
  directory(bytes, 240, [[0x0001, 2, 4, 0]]);
  directory(bytes, 300, [
    [0x0201, 4, 1, 460],
    [0x0202, 4, 1, 4],
  ]);
  bytes.set(new TextEncoder().encode("<rdf:xmp>"), 400);
  bytes.set([1, 2, 3, 4], 420);
  bytes.set([5, 6, 7, 8], 430);
  bytes.set([0xff, 0xd8, 0xff, 0xd9], 460);
  return bytes;
}

function reader(bytes: Uint8Array): BlobReader {
  let requests = 0;
  let bytesRead = 0;
  return {
    size: bytes.length,
    read: (start, end) => {
      requests += 1;
      const value = bytes.slice(start, end);
      bytesRead += value.length;
      return Promise.resolve(value);
    },
    bytesRead: () => bytesRead,
    telemetry: () => ({ readRequests: requests, bytesRead, cacheHits: 0, coalescedReads: 0, cacheBytes: bytesRead }),
  };
}

describe("S06 classic TIFF range planning pointer and selection matrix", () => {
  it("follows EXIF, GPS, interoperability, SubIFD, IFD1, and selected metadata ranges", async () => {
    const source = pointerFixture();
    const all = resolveSelection({ groups: ["Dimensions", "EXIF", "XMP", "IPTC", "ICC", "Photoshop"] });
    const result = await materializeTiffMetadata(reader(source), resolveLimits({ maxMetadataBytes: source.length, maxValueBytes: source.length, maxSegments: 32 }), all);
    expect(result).not.toBeNull();
    expect(result?.bytes.length).toBeGreaterThan(16);
    expect(result?.bytesRead).toBeGreaterThan(0);
    expect(result?.mapOffset?.(0)).toBe(0);
    expect(result?.warnings.some(({ code }) => code === "UNSAFE_OFFSET")).toBe(false);

    const xmpOnly = await materializeTiffMetadata(reader(source), resolveLimits({ maxMetadataBytes: source.length, maxValueBytes: source.length, maxSegments: 32 }), resolveSelection({ groups: ["XMP"] }));
    expect(xmpOnly).not.toBeNull();
    expect(xmpOnly?.bytes.length).toBeGreaterThan(8);

    const empty = await materializeTiffMetadata(reader(source), resolveLimits(), resolveSelection({ groups: [] }));
    expect(empty).not.toBeNull();
    expect(empty?.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
  });

  it("fails closed for overlapping pointers, malformed types, depth, value, segment, and metadata budgets", async () => {
    const source = pointerFixture();
    const overlap = source.slice();
    put32(overlap, 8 + 2 + 5 * 12 + 8, 20);
    const overlapResult = await materializeTiffMetadata(reader(overlap), resolveLimits({ maxMetadataBytes: source.length, maxValueBytes: source.length }), resolveSelection({ groups: ["XMP"] }));
    expect(overlapResult?.warnings).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));

    const unknownType = source.slice();
    put16(unknownType, 8 + 2 + 5 * 12 + 2, 0xffff);
    const unknownResult = await materializeTiffMetadata(reader(unknownType), resolveLimits({ maxMetadataBytes: source.length, maxValueBytes: source.length }), resolveSelection({ groups: ["XMP"] }));
    expect(unknownResult).not.toBeNull();
    expect(unknownResult?.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);

    const depth = await materializeTiffMetadata(reader(source), resolveLimits({ maxIfdDepth: 1, maxMetadataBytes: source.length }), resolveSelection({ groups: ["EXIF"] }));
    expect(depth?.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));

    const valueBudget = await materializeTiffMetadata(reader(source), resolveLimits({ maxValueBytes: 2, maxMetadataBytes: source.length }), resolveSelection({ groups: ["XMP"] }));
    expect(valueBudget?.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));

    const metadataBudget = await materializeTiffMetadata(reader(source), resolveLimits({ maxMetadataBytes: 16 }), resolveSelection({ groups: ["EXIF", "XMP"] }));
    expect(metadataBudget === null || metadataBudget.partial || metadataBudget.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);

    const segmentBudget = await materializeTiffMetadata(reader(source), resolveLimits({ maxSegments: 1, maxMetadataBytes: source.length }), resolveSelection({ groups: ["EXIF"] }));
    expect(segmentBudget === null || segmentBudget.partial || segmentBudget.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
  });
});
