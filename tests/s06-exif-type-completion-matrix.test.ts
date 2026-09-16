import { describe, expect, it } from "vitest";

import { parseBigTiff, parseExif } from "../src/metadata/exif.js";
import { resolveLimits } from "../src/security/limits.js";
import type { SecurityLimits } from "../src/types.js";

const limits: SecurityLimits = resolveLimits({
  maxInputBytes: 16 * 1024,
  maxMetadataBytes: 16 * 1024,
  maxValueBytes: 4096,
  maxStringBytes: 4096,
  maxWarnings: 64,
  maxSegments: 64,
  maxIfdEntries: 64,
  maxIfdDepth: 8,
});

function writeInteger(bytes: Uint8Array, offset: number, value: number, size: 1 | 2 | 4, littleEndian: boolean): void {
  const view = new DataView(bytes.buffer);
  if (size === 1) view.setUint8(offset, value);
  else if (size === 2) view.setUint16(offset, value, littleEndian);
  else view.setUint32(offset, value, littleEndian);
}

function writeEntry(bytes: Uint8Array, offset: number, tag: number, type: number, count: number, value: Uint8Array, littleEndian: boolean, valueCursor: { value: number }): void {
  const view = new DataView(bytes.buffer);
  const sizes: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8, 13: 4, 129: 1 };
  const byteCount = (sizes[type] ?? 1) * count;
  view.setUint16(offset, tag, littleEndian);
  view.setUint16(offset + 2, type, littleEndian);
  view.setUint32(offset + 4, count, littleEndian);
  if (byteCount <= 4) {
    bytes.set(value.subarray(0, 4), offset + 8);
    return;
  }
  const dataOffset = valueCursor.value;
  valueCursor.value += value.length;
  bytes.set(value, dataOffset);
  view.setUint32(offset + 8, dataOffset, littleEndian);
}

function typeMatrix(littleEndian: boolean): Uint8Array {
  const bytes = new Uint8Array(2048);
  const view = new DataView(bytes.buffer);
  bytes.set(littleEndian ? [0x49, 0x49] : [0x4d, 0x4d], 0);
  view.setUint16(2, 42, littleEndian);
  view.setUint32(4, 8, littleEndian);
  const entries: readonly [number, number, number, number, Uint8Array][] = [
    [0x0100, 4, 1, 4, Uint8Array.of(0x80, 0x02, 0, 0)],
    [0x0101, 3, 2, 4, Uint8Array.of(0x80, 0x02, 0xe0, 0x01)],
    [0x9000, 1, 1, 1, Uint8Array.of(1)],
    [0x9001, 2, 4, 4, Uint8Array.of(0x61, 0x62, 0x63, 0)],
    [0x9002, 129, 3, 3, Uint8Array.of(0xc3, 0xa9, 0)],
    [0x9003, 6, 2, 2, Uint8Array.of(0xff, 0x7f)],
    [0x9004, 7, 4, 4, Uint8Array.of(1, 2, 3, 4)],
    [0x9005, 8, 1, 2, Uint8Array.of(0xfe, 0xff)],
    [0x9006, 9, 1, 4, Uint8Array.of(0xff, 0xff, 0xff, 0xff)],
    [0x9007, 5, 1, 8, Uint8Array.of(1, 0, 0, 0, 2, 0, 0, 0)],
    [0x9008, 10, 1, 8, Uint8Array.of(0xff, 0xff, 0xff, 0xff, 1, 0, 0, 0)],
    [0x9009, 11, 1, 4, new Uint8Array(4)],
    [0x900a, 12, 1, 8, new Uint8Array(8)],
    [0x900b, 13, 1, 4, Uint8Array.of(8, 0, 0, 0)],
  ];
  view.setUint16(8, entries.length, littleEndian);
  const cursor = { value: 256 };
  for (const [index, [tag, type, count, byteCount, value]] of entries.entries()) {
    const prepared = value.slice();
    if (type === 4 || type === 9 || type === 13) writeInteger(prepared, 0, type === 9 ? 0xffffffff : type === 13 ? 8 : 640, 4, littleEndian);
    if (type === 3 || type === 8) {
      for (let position = 0; position < count; position += 1) writeInteger(prepared, position * 2, position === 0 ? 640 : 480, 2, littleEndian);
    }
    if (type === 5 || type === 10) {
      writeInteger(prepared, 0, 1, 4, littleEndian);
      writeInteger(prepared, 4, type === 10 ? 0xffffffff : 2, 4, littleEndian);
    }
    if (type === 11) new DataView(prepared.buffer).setFloat32(0, Number.NaN, littleEndian);
    if (type === 12) new DataView(prepared.buffer).setFloat64(0, Number.POSITIVE_INFINITY, littleEndian);
    writeEntry(bytes, 10 + index * 12, tag, type, count, prepared, littleEndian, cursor);
    expect(byteCount).toBeGreaterThan(0);
  }
  view.setUint32(10 + entries.length * 12, 0, littleEndian);
  return bytes.slice(0, cursor.value);
}

function bigTypeMatrix(littleEndian: boolean): Uint8Array {
  const bytes = new Uint8Array(1024);
  const view = new DataView(bytes.buffer);
  bytes.set(littleEndian ? [0x49, 0x49] : [0x4d, 0x4d], 0);
  view.setUint16(2, 43, littleEndian);
  view.setUint16(4, 8, littleEndian);
  view.setUint16(6, 0, littleEndian);
  view.setBigUint64(8, 16n, littleEndian);
  const entries: readonly [number, number, number, bigint][] = [
    [0x0100, 16, 1, 640n],
    [0x0101, 17, 1, 480n],
    [0x8769, 18, 1, 300n],
    [0x9000, 12, 1, 0n],
    [0x9001, 99, 1, 0n],
  ];
  view.setBigUint64(16, BigInt(entries.length), littleEndian);
  for (const [index, [tag, type, count, value]] of entries.entries()) {
    const offset = 24 + index * 20;
    view.setUint16(offset, tag, littleEndian);
    view.setUint16(offset + 2, type, littleEndian);
    view.setBigUint64(offset + 4, BigInt(count), littleEndian);
    view.setBigUint64(offset + 12, value, littleEndian);
  }
  view.setBigUint64(24 + entries.length * 20, 0n, littleEndian);
  view.setBigUint64(300, 0n, littleEndian);
  return bytes.slice(0, 512);
}

function specialExif(littleEndian: boolean, learningBytes: Uint8Array, apexNumerator: number, apexDenominator: number): Uint8Array {
  const bytes = new Uint8Array(1024);
  const view = new DataView(bytes.buffer);
  bytes.set(littleEndian ? [0x49, 0x49] : [0x4d, 0x4d], 0);
  view.setUint16(2, 42, littleEndian);
  view.setUint32(4, 8, littleEndian);
  view.setUint16(8, 1, littleEndian);
  view.setUint16(10, 0x8769, littleEndian);
  view.setUint16(12, 4, littleEndian);
  view.setUint32(14, 1, littleEndian);
  view.setUint32(18, 200, littleEndian);
  view.setUint32(22, 0, littleEndian);

  view.setUint16(200, 4, littleEndian);
  const cursor = { value: 300 };
  const entries: readonly [number, number, number, Uint8Array][] = [
    [0x9201, 10, 1, new Uint8Array(8)],
    [0x9202, 5, 1, new Uint8Array(8)],
    [0x9209, 3, 1, Uint8Array.of(0, 0)],
    [0x9287, 7, learningBytes.length, learningBytes],
  ];
  for (const [index, [tag, type, count, value]] of entries.entries()) {
    const prepared = value.slice();
    if (type === 10) {
      writeInteger(prepared, 0, apexNumerator >>> 0, 4, littleEndian);
      writeInteger(prepared, 4, apexDenominator >>> 0, 4, littleEndian);
    }
    if (type === 5) {
      writeInteger(prepared, 0, 1, 4, littleEndian);
      writeInteger(prepared, 4, 2, 4, littleEndian);
    }
    writeEntry(bytes, 202 + index * 12, tag, type, count, prepared, littleEndian, cursor);
  }
  view.setUint32(202 + entries.length * 12, 0, littleEndian);
  return bytes.slice(0, cursor.value);
}

describe("S06 EXIF decoder type and bounded-value completion matrix", () => {
  it("decodes every classic TIFF scalar family in both byte orders and retains diagnostics", () => {
    for (const littleEndian of [true, false]) {
      const result = parseExif(typeMatrix(littleEndian), limits);
      expect(result.exif).not.toBeNull();
      expect(result.exif?.fields.map(({ type }) => type)).toEqual(expect.arrayContaining(["BYTE", "ASCII", "UTF-8", "SBYTE", "UNDEFINED", "SSHORT", "SLONG", "RATIONAL", "SRATIONAL", "FLOAT", "DOUBLE", "IFD"]));
      expect(result.warnings.some(({ code }) => code === "ZERO_DENOMINATOR" || code === "INVALID_VALUE")).toBe(true);
    }
  });

  it("rejects invalid text, unsafe values, unknown types, overlaps, and cumulative decode exhaustion", () => {
    const source = typeMatrix(true);
    const view = new DataView(source.buffer);
    const firstValue = 10 + 3 * 12 + 8;
    source[firstValue] = 0x61;
    source[firstValue + 1] = 0x62;
    source[firstValue + 2] = 0x63;
    source[firstValue + 3] = 0x64;
    const invalidAscii = parseExif(source, limits);
    expect(invalidAscii.warnings.some(({ code }) => code === "INVALID_ASCII")).toBe(true);

    const invalidUtf8 = typeMatrix(true);
    const utf8Entry = 10 + 4 * 12;
    invalidUtf8[utf8Entry + 8] = 0xff;
    invalidUtf8[utf8Entry + 9] = 0;
    invalidUtf8[utf8Entry + 10] = 0;
    expect(parseExif(invalidUtf8, limits).warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE", tag: 0x9002 }));

    const overlapping = typeMatrix(true);
    new DataView(overlapping.buffer).setUint32(10 + 9 * 12 + 8, 8, true);
    expect(parseExif(overlapping, limits).warnings.some(({ code }) => code === "UNSAFE_OFFSET")).toBe(true);

    const limited = parseExif(typeMatrix(true), resolveLimits({ ...limits, maxValueBytes: 2, maxMetadataBytes: 8 }));
    expect(limited.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
    const unknownLimited = parseExif(typeMatrix(true), resolveLimits({ ...limits, maxValueBytes: 3 }));
    expect(unknownLimited.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
    expect(view.getUint16(2, true)).toBe(42);
  });

  it("covers BigTIFF LONG8, SLONG8, IFD8, unknown types, and malformed count/value boundaries", () => {
    for (const littleEndian of [true, false]) {
      const result = parseBigTiff(bigTypeMatrix(littleEndian), limits);
      expect(result.exif).not.toBeNull();
      expect(result.exif?.fields.map(({ type }) => type)).toEqual(expect.arrayContaining(["LONG8", "SLONG8", "IFD8", "DOUBLE", "UNKNOWN"]));
    }
    const countUnsafe = bigTypeMatrix(true);
    new DataView(countUnsafe.buffer).setBigUint64(24 + 4 * 20 + 4, 0xffffffffffffffffn, true);
    expect(parseBigTiff(countUnsafe, limits).warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);

    const offsetUnsafe = bigTypeMatrix(true);
    new DataView(offsetUnsafe.buffer).setBigUint64(24 + 3 * 20 + 4, 2n, true);
    new DataView(offsetUnsafe.buffer).setBigUint64(24 + 3 * 20 + 12, 0xffffffffffffffffn, true);
    expect(parseBigTiff(offsetUnsafe, limits).warnings.some(({ code }) => code === "UNSAFE_OFFSET" || code === "TRUNCATED_DATA")).toBe(true);
    expect(parseBigTiff(bigTypeMatrix(true).slice(0, 15), limits).warnings).toHaveLength(1);
  });

  it("validates nested ExifIFD APEX and LearningOptOutIn structures without losing raw bytes", () => {
    for (const littleEndian of [true, false]) {
      const validLearning = littleEndian ? Uint8Array.of(1, 0, 0, 0, 1, 0) : Uint8Array.of(0, 1, 0, 0, 0, 1);
      const valid = parseExif(specialExif(littleEndian, validLearning, -1, 1), limits);
      expect(valid.exif?.ifds.map(({ name }) => name)).toContain("ExifIFD");
      expect(valid.exif?.fields.some(({ tag }) => tag === 0x9287)).toBe(true);
      expect(valid.warnings).toEqual([]);

      const invalid = parseExif(specialExif(littleEndian, Uint8Array.of(0, 0, 0, 0, 0, 1), 0, 1), limits);
      expect(invalid.warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE", tag: 0x9287 }));
      expect(invalid.exif?.fields.find(({ tag }) => tag === 0x9287)?.raw).toBeInstanceOf(Uint8Array);
    }

    const malformedLearning = [
      Uint8Array.of(0, 0),
      Uint8Array.of(0, 1, 0, 1, 0, 1),
      Uint8Array.of(0, 1, 0, 5, 0, 1),
      Uint8Array.of(0, 2, 0, 1, 0, 1, 0, 1, 0, 1),
    ];
    for (const value of malformedLearning) {
      const result = parseExif(specialExif(true, value, 0, 1), limits);
      expect(result.warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE", tag: 0x9287 }));
    }
    const invalidApex = parseExif(specialExif(true, Uint8Array.of(1, 0, 0, 0, 1, 0), 0, 0), limits);
    expect(invalidApex.warnings).toContainEqual(expect.objectContaining({ code: "ZERO_DENOMINATOR", tag: 0x9201 }));
  });
});
