import { describe, expect, it } from "vitest";
import { parseExif, parseBigTiff } from "../src/metadata/exif.js";
import { parseMetadata } from "../src/index.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";

function classicFixture(littleEndian: boolean): Uint8Array {
  const bytes = new Uint8Array(512);
  const view = new DataView(bytes.buffer);
  const u16 = (offset: number, value: number): void => view.setUint16(offset, value, littleEndian);
  const u32 = (offset: number, value: number): void => view.setUint32(offset, value, littleEndian);
  bytes.set(littleEndian ? [0x49, 0x49] : [0x4d, 0x4d]);
  u16(2, 42); u32(4, 8);
  const entry = (offset: number, tag: number, type: number, count: number, value: number): void => {
    u16(offset, tag); u16(offset + 2, type); u32(offset + 4, count); u32(offset + 8, value);
  };
  const ifd = (offset: number, entries: readonly ((offset: number) => void)[], next: number): void => {
    u16(offset, entries.length);
    entries.forEach((write, index) => write(offset + 2 + index * 12));
    u32(offset + 2 + entries.length * 12, next);
  };
  ifd(8, [
    (o) => entry(o, 330, 4, 2, 40),
  ], 160);
  u32(40, 80); u32(44, 120);
  ifd(80, [(o) => entry(o, 256, 3, 1, 11)], 0);
  ifd(120, [
    (o) => entry(o, 256, 3, 1, 22),
    (o) => entry(o, 330, 4, 1, 8),
  ], 0);
  ifd(160, [
    (o) => entry(o, 256, 3, 1, 33),
    (o) => entry(o, 513, 4, 1, 300),
    (o) => entry(o, 514, 4, 1, 40),
  ], 0);
  return bytes;
}

function bigTiffFixture(littleEndian: boolean): Uint8Array {
  const bytes = new Uint8Array(768);
  const view = new DataView(bytes.buffer);
  const u16 = (offset: number, value: number): void => view.setUint16(offset, value, littleEndian);
  const u64 = (offset: number, value: number): void => view.setBigUint64(offset, BigInt(value), littleEndian);
  bytes.set(littleEndian ? [0x49, 0x49] : [0x4d, 0x4d]);
  u16(2, 43); u16(4, 8); u16(6, 0); u64(8, 16);
  const entry = (offset: number, tag: number, type: number, count: number, value: number): void => {
    u16(offset, tag); u16(offset + 2, type); u64(offset + 4, count); u64(offset + 12, value);
  };
  const ifd = (offset: number, entries: readonly ((offset: number) => void)[], next: number): void => {
    u64(offset, entries.length);
    entries.forEach((write, index) => write(offset + 8 + index * 20));
    u64(offset + 8 + entries.length * 20, next);
  };
  ifd(16, [(o) => entry(o, 330, 18, 2, 80)], 180);
  u64(80, 100); u64(88, 140);
  ifd(100, [(o) => entry(o, 256, 3, 1, 44)], 0);
  ifd(140, [(o) => entry(o, 256, 3, 1, 55)], 0);
  ifd(180, [(o) => entry(o, 256, 3, 1, 66)], 0);
  return bytes;
}

describe("S04 TIFF directory topology", () => {
  it.each([true, false])("keeps multiple SubIFDs, chains, nested links, and duplicate tags distinct (%s endian)", (littleEndian) => {
    const parsed = parseExif(classicFixture(littleEndian), DEFAULT_LIMITS);
    const topology = parsed.exif?.topology;
    expect(topology?.directories.map(({ name }) => name)).toEqual(["IFD0", "SubIFD[0]", "SubIFD[1]", "IFD1"]);
    expect(topology?.directories.every(({ id, offset }) => typeof id === "string" && id.includes(String(offset)))).toBe(true);
    expect(topology?.relations.some(({ type }) => type === "subifd")).toBe(true);
    expect(topology?.relations.some(({ type }) => type === "next")).toBe(true);
    expect(topology?.relations.some(({ type }) => type === "cycle" || type === "shared-offset")).toBe(true);
    const dimensions = parsed.exif?.fields.filter(({ tag }) => tag === 256) ?? [];
    expect(dimensions).toHaveLength(3);
    expect(new Set(dimensions.map(({ directoryId }) => directoryId)).size).toBe(3);
    expect(parsed.exif?.associatedImages).toEqual([expect.objectContaining({ role: "thumbnail", offset: 300, length: 40, mimeType: "image/jpeg" })]);
  });

  it.each([true, false])("applies the same bounded topology to BigTIFF (%s endian)", (littleEndian) => {
    const parsed = parseBigTiff(bigTiffFixture(littleEndian), DEFAULT_LIMITS);
    expect(parsed.exif?.ifds.map(({ name }) => name)).toEqual(["IFD0", "SubIFD[0]", "SubIFD[1]", "IFD1"]);
    expect(parsed.exif?.topology?.relations.filter(({ type }) => type === "subifd")).toHaveLength(2);
    expect(parsed.exif?.fields.filter(({ tag }) => tag === 256)).toHaveLength(3);
    expect(parsed.warnings).toEqual([]);
  });

  it("bounds cycles, truncation, and hostile directory counts", () => {
    const cycle = classicFixture(true);
    new DataView(cycle.buffer).setUint16(8, 0xffff, true);
    const result = parseExif(cycle, DEFAULT_LIMITS);
    expect(result.warnings.some(({ code }) => code === "TRUNCATED_DATA" || code === "LIMIT_EXCEEDED")).toBe(true);
    const truncated = parseExif(classicFixture(true).subarray(0, 45), DEFAULT_LIMITS);
    expect(truncated.warnings.some(({ code }) => code === "TRUNCATED_DATA" || code === "UNSAFE_OFFSET")).toBe(true);
  });

  it("range-backed metadata reads fetch directories and values but not pixel payload", async () => {
    const source = classicFixture(true);
    const padded = new Uint8Array(source.length + 2_000_000);
    padded.set(source);
    const result = await parseMetadata(new Blob([padded]), { scope: "metadata" });
    expect(result.telemetry?.bytesRead ?? padded.length).toBeLessThan(padded.length);
    expect(result.exif?.topology?.directories.some(({ kind }) => kind === "subifd")).toBe(true);
    expect(result.telemetry?.bytesRead ?? 0).toBeLessThan(20_000);
  });

  it("range-plans BigTIFF directories without fetching trailing payload", async () => {
    const source = bigTiffFixture(false);
    const padded = new Uint8Array(source.length + 1_000_000);
    padded.set(source);
    const result = await parseMetadata(new Blob([padded]), { scope: "metadata" });
    expect(result.exif?.topology?.directories.filter(({ kind }) => kind === "subifd")).toHaveLength(2);
    expect(result.telemetry?.bytesRead ?? padded.length).toBeLessThan(20_000);
  });

  it("keeps topology relationships when EXIF is embedded in JPEG", async () => {
    const tiff = classicFixture(true);
    const jpeg = new Uint8Array(2 + 2 + 2 + 6 + tiff.length + 2);
    jpeg.set([0xff, 0xd8, 0xff, 0xe1], 0);
    new DataView(jpeg.buffer).setUint16(4, 6 + tiff.length, false);
    jpeg.set([0x45, 0x78, 0x69, 0x66, 0x00, 0x00], 6);
    jpeg.set(tiff, 12);
    jpeg.set([0xff, 0xd9], 12 + tiff.length);
    const result = await parseMetadata(jpeg);
    const exifBlock = result.blocks.find(({ family }) => family === "EXIF");
    expect(exifBlock?.relationships?.some(({ type }) => type === "subifd")).toBe(true);
    expect(result.exif?.fields.some(({ directoryId }) => directoryId?.startsWith("SubIFD"))).toBe(true);
  });

  it("retains the directory graph under selective EXIF decoding", async () => {
    const result = await parseMetadata(classicFixture(true), { select: { groups: ["EXIF"], tags: ["IFD0:0x0100"] } });
    expect(result.exif?.topology?.directories.length).toBeGreaterThan(1);
    expect(result.fields.every(({ tag }) => tag === 256)).toBe(true);
  });

  it("diagnoses invalid SubIFD types and unsafe BigTIFF pointers without following them", () => {
    const invalid = classicFixture(true);
    const invalidView = new DataView(invalid.buffer);
    invalidView.setUint16(12, 3, true);
    const classic = parseExif(invalid, DEFAULT_LIMITS);
    expect(classic.warnings.some(({ code, message }) => code === "MALFORMED_EXIF" && message.includes("SubIFDs"))).toBe(true);
    const unsafe = bigTiffFixture(true);
    const unsafeView = new DataView(unsafe.buffer);
    unsafeView.setBigUint64(16 + 8 + 20, 0xffffffffffffffffn, true);
    const big = parseBigTiff(unsafe, DEFAULT_LIMITS);
    expect(big.warnings.some(({ code }) => code === "UNSAFE_OFFSET" || code === "MALFORMED_EXIF")).toBe(true);
  });

  it("diagnoses overlapping directory/value ranges and represents shared offsets once", () => {
    const overlapping = classicFixture(true);
    new DataView(overlapping.buffer).setUint32(18, 80, true);
    const overlapResult = parseExif(overlapping, DEFAULT_LIMITS);
    expect(overlapResult.warnings.some(({ code }) => code === "UNSAFE_OFFSET")).toBe(true);
    const shared = classicFixture(true);
    new DataView(shared.buffer).setUint32(44, 80, true);
    const sharedResult = parseExif(shared, DEFAULT_LIMITS);
    expect(sharedResult.exif?.ifds.filter(({ offset }) => offset === 80)).toHaveLength(1);
    expect(sharedResult.exif?.topology?.relations.some(({ type }) => type === "shared-offset")).toBe(true);
  });
});
