import { describe, expect, it } from "vitest";

import { materializeTiffMetadata } from "../src/tiff-range.js";
import { resolveLimits } from "../src/security/limits.js";
import { resolveSelection } from "../src/selection.js";
import type { BlobReader } from "../src/input.js";
import type { SecurityLimits } from "../src/types.js";

const allSelection = resolveSelection(undefined);
const xmpSelection = resolveSelection({ groups: ["XMP"] });
const limits: SecurityLimits = resolveLimits({
  maxInputBytes: 16 * 1024,
  maxMetadataBytes: 8 * 1024,
  maxValueBytes: 1024,
  maxWarnings: 64,
  maxSegments: 64,
  maxIfdEntries: 32,
  maxIfdDepth: 8,
});

function readerFor(bytes: Uint8Array): BlobReader {
  let bytesRead = 0;
  let requests = 0;
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

function classicTopology(littleEndian: boolean): Uint8Array {
  const bytes = new Uint8Array(512);
  const view = new DataView(bytes.buffer);
  bytes.set(littleEndian ? [0x49, 0x49] : [0x4d, 0x4d], 0);
  view.setUint16(2, 42, littleEndian);
  view.setUint32(4, 8, littleEndian);
  const entries = [
    [256, 4, 1, 640],
    [257, 4, 1, 480],
    [34665, 4, 1, 300],
    [34853, 4, 1, 360],
    [330, 4, 2, 128],
    [701, 99, 1, 1],
    [0x02bc, 7, 12, 140],
  ] as const;
  view.setUint16(8, entries.length, littleEndian);
  for (const [index, [tag, type, count, value]] of entries.entries()) {
    const offset = 10 + index * 12;
    view.setUint16(offset, tag, littleEndian);
    view.setUint16(offset + 2, type, littleEndian);
    view.setUint32(offset + 4, count, littleEndian);
    view.setUint32(offset + 8, value, littleEndian);
  }
  view.setUint32(10 + entries.length * 12, 200, littleEndian);
  view.setUint32(128, 400, littleEndian);
  view.setUint32(132, 420, littleEndian);
  bytes.set(new TextEncoder().encode("xmp-value-01"), 140);
  writeClassicDirectory(bytes, 200, littleEndian, [
    [0x0201, 4, 1, 480],
    [0x0202, 4, 1, 4],
  ], 0);
  writeClassicDirectory(bytes, 300, littleEndian, [[41729, 3, 1, 1]], 0);
  writeClassicDirectory(bytes, 360, littleEndian, [[0x0001, 2, 4, 450]], 0);
  writeClassicDirectory(bytes, 400, littleEndian, [], 0);
  writeClassicDirectory(bytes, 420, littleEndian, [], 0);
  bytes.set(Uint8Array.of(0x41, 0x42, 0x43, 0x44), 450);
  bytes.set(Uint8Array.of(0xff, 0xd8, 0xff, 0xd9), 480);
  return bytes;
}

function writeClassicDirectory(bytes: Uint8Array, offset: number, littleEndian: boolean, entries: readonly (readonly [number, number, number, number])[], nextOffset: number): void {
  const view = new DataView(bytes.buffer);
  view.setUint16(offset, entries.length, littleEndian);
  for (const [index, [tag, type, count, value]] of entries.entries()) {
    const entryOffset = offset + 2 + index * 12;
    view.setUint16(entryOffset, tag, littleEndian);
    view.setUint16(entryOffset + 2, type, littleEndian);
    view.setUint32(entryOffset + 4, count, littleEndian);
    view.setUint32(entryOffset + 8, value, littleEndian);
  }
  view.setUint32(offset + 2 + entries.length * 12, nextOffset, littleEndian);
}

function bigTopology(littleEndian: boolean): Uint8Array {
  const bytes = new Uint8Array(640);
  const view = new DataView(bytes.buffer);
  bytes.set(littleEndian ? [0x49, 0x49] : [0x4d, 0x4d], 0);
  view.setUint16(2, 43, littleEndian);
  view.setUint16(4, 8, littleEndian);
  view.setUint16(6, 0, littleEndian);
  view.setBigUint64(8, 16n, littleEndian);
  writeBigDirectory(bytes, 16, littleEndian, [
    [256, 16, 1, 640],
    [34665, 18, 1, 300],
    [330, 16, 2, 160],
    [0x02bc, 7, 12, 200],
    [701, 99, 1, 1],
  ], 360);
  writeBigDirectory(bytes, 300, littleEndian, [[41729, 3, 1, 1]], 0);
  writeBigDirectory(bytes, 360, littleEndian, [], 400);
  writeBigDirectory(bytes, 400, littleEndian, [], 0);
  view.setBigUint64(160, 360n, littleEndian);
  view.setBigUint64(168, 400n, littleEndian);
  bytes.set(new TextEncoder().encode("big-xmp-value"), 200);
  return bytes;
}

function writeBigDirectory(bytes: Uint8Array, offset: number, littleEndian: boolean, entries: readonly (readonly [number, number, number, number])[], nextOffset: number): void {
  const view = new DataView(bytes.buffer);
  view.setBigUint64(offset, BigInt(entries.length), littleEndian);
  for (const [index, [tag, type, count, value]] of entries.entries()) {
    const entryOffset = offset + 8 + index * 20;
    view.setUint16(entryOffset, tag, littleEndian);
    view.setUint16(entryOffset + 2, type, littleEndian);
    view.setBigUint64(entryOffset + 4, BigInt(count), littleEndian);
    view.setBigUint64(entryOffset + 12, BigInt(value), littleEndian);
  }
  view.setBigUint64(offset + 8 + entries.length * 20, BigInt(nextOffset), littleEndian);
}

describe("S06 TIFF range planner completion matrix", () => {
  it("compacts complete classic TIFF topologies with pointers, SubIFDs, next IFDs, values, and thumbnails", async () => {
    for (const littleEndian of [true, false]) {
      const source = classicTopology(littleEndian);
      const result = await materializeTiffMetadata(readerFor(source), limits, allSelection);
      expect(result).not.toBeNull();
      expect(result?.bytes.length ?? 0).toBeGreaterThan(8);
      expect(result?.mapOffset?.(0)).toBe(0);
      expect(result?.mapOffset?.(9999)).toBe(9999);
      expect(result?.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
    }
  });

  it("compacts classic values without the thumbnail fast path and exercises pointer remapping", async () => {
    const source = classicTopology(true);
    const result = await materializeTiffMetadata(readerFor(source), limits, xmpSelection);
    expect(result).not.toBeNull();
    expect(result?.bytes.length ?? 0).toBeGreaterThan(8);
    expect(result?.partial).toBe(true);
    expect(result?.mapOffset?.(16)).toBeGreaterThanOrEqual(0);
    const restricted = await materializeTiffMetadata(readerFor(source), resolveLimits({ ...limits, maxValueBytes: 4 }), allSelection);
    expect(restricted).not.toBeNull();
    expect(restricted?.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
  });

  it("compacts BigTIFF pointer types, out-of-line arrays, next directories, both byte orders, and limits", async () => {
    for (const littleEndian of [true, false]) {
      const source = bigTopology(littleEndian);
      const result = await materializeTiffMetadata(readerFor(source), limits, allSelection);
      expect(result).not.toBeNull();
      expect(result?.bytes.length ?? 0).toBeGreaterThan(16);
      expect(result?.mapOffset?.(16)).toBeGreaterThanOrEqual(0);
    }
    const limited = await materializeTiffMetadata(readerFor(bigTopology(true)), resolveLimits({ ...limits, maxInputBytes: 64, maxMetadataBytes: 1024 }), allSelection);
    expect(limited).not.toBeNull();
    expect(limited?.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
  });

  it("rejects unsafe classic and BigTIFF ranges while retaining typed bounded results", async () => {
    const classic = classicTopology(true);
    const classicView = new DataView(classic.buffer);
    classicView.setUint32(4, 0xfffffff0, true);
    expect(await materializeTiffMetadata(readerFor(classic), limits, allSelection)).toBeNull();
    const big = bigTopology(true);
    const bigView = new DataView(big.buffer);
    bigView.setBigUint64(8, 0xffffffffffffffffn, true);
    expect(await materializeTiffMetadata(readerFor(big), limits, allSelection)).toBeNull();
  });

  it("retains raw TIFF magic variants and reuses identical selected value ranges", async () => {
    const shared = classicTopology(true);
    const view = new DataView(shared.buffer);
    view.setUint16(2, 0x4f52, true);
    const xmpEntry = 10 + 6 * 12;
    const iptcEntry = 10 + 5 * 12;
    view.setUint32(iptcEntry + 4, view.getUint32(xmpEntry + 4, true), true);
    view.setUint32(iptcEntry + 8, view.getUint32(xmpEntry + 8, true), true);
    const result = await materializeTiffMetadata(readerFor(shared), limits, allSelection);
    expect(result).not.toBeNull();
    expect(result?.warnings.some(({ code }) => code === "UNSAFE_OFFSET")).toBe(false);
    expect(result?.bytes.length ?? 0).toBeGreaterThan(8);

    const alternateMagic = classicTopology(true);
    new DataView(alternateMagic.buffer).setUint16(2, 0x0055, true);
    const alternate = await materializeTiffMetadata(readerFor(alternateMagic), limits, resolveSelection({ groups: ["EXIF"] }));
    expect(alternate).not.toBeNull();

    for (const selection of [
      resolveSelection({ groups: ["EXIF"], tags: [] }),
      resolveSelection({ groups: ["EXIF", "XMP", "IPTC", "ICC", "Photoshop"] }),
      resolveSelection({ tags: ["ImageWidth", "ImageLength"] }),
    ]) {
      const selected = await materializeTiffMetadata(readerFor(classicTopology(false)), limits, selection);
      expect(selected).not.toBeNull();
      expect(selected?.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
    }
  });
});
