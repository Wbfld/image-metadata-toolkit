import { describe, expect, it } from "vitest";

import { parseBigTiff, parseExif } from "../src/metadata/exif.js";
import { resolveLimits } from "../src/security/limits.js";

const limits = resolveLimits({ maxInputBytes: 1024 * 1024, maxMetadataBytes: 1024 * 1024, maxValueBytes: 1024 * 1024, maxStringBytes: 1024 * 1024, maxIfdEntries: 128, maxSegments: 128, maxWarnings: 128 });

function classicEntry(type: number, count: number, payload: Uint8Array, tag = 0xc100, littleEndian = true): Uint8Array {
  const inline = payload.length <= 4;
  const dataOffset = 26;
  const result = new Uint8Array(inline ? 26 : dataOffset + payload.length);
  const view = new DataView(result.buffer);
  result.set(littleEndian ? [0x49, 0x49] : [0x4d, 0x4d], 0);
  view.setUint16(2, 42, littleEndian);
  view.setUint32(4, 8, littleEndian);
  view.setUint16(8, 1, littleEndian);
  view.setUint16(10, tag, littleEndian);
  view.setUint16(12, type, littleEndian);
  view.setUint32(14, count, littleEndian);
  if (inline) result.set(payload, 18);
  else { view.setUint32(18, dataOffset, littleEndian); result.set(payload, dataOffset); }
  return result;
}

function bigEntry(type: number, count: bigint, payload: Uint8Array, tag = 0xc100, littleEndian = true): Uint8Array {
  const inline = payload.length <= 8;
  const dataOffset = 52;
  const result = new Uint8Array(inline ? 52 : dataOffset + payload.length);
  const view = new DataView(result.buffer);
  result.set(littleEndian ? [0x49, 0x49] : [0x4d, 0x4d], 0);
  view.setUint16(2, 43, littleEndian);
  view.setUint16(4, 8, littleEndian);
  view.setUint16(6, 0, littleEndian);
  view.setBigUint64(8, 16n, littleEndian);
  view.setBigUint64(16, 1n, littleEndian);
  view.setUint16(24, tag, littleEndian);
  view.setUint16(26, type, littleEndian);
  view.setBigUint64(28, count, littleEndian);
  if (inline) result.set(payload, 36);
  else { view.setBigUint64(36, BigInt(dataOffset), littleEndian); result.set(payload, dataOffset); }
  return result;
}

function exifEntry(type: number, count: number, payload: Uint8Array, tag: number, littleEndian = true): Uint8Array {
  const inline = payload.length <= 4;
  const dataOffset = 44;
  const result = new Uint8Array(inline ? dataOffset : dataOffset + payload.length);
  const view = new DataView(result.buffer);
  result.set(littleEndian ? [0x49, 0x49] : [0x4d, 0x4d], 0);
  view.setUint16(2, 42, littleEndian);
  view.setUint32(4, 8, littleEndian);
  view.setUint16(8, 1, littleEndian);
  view.setUint16(10, 0x8769, littleEndian);
  view.setUint16(12, 4, littleEndian);
  view.setUint32(14, 1, littleEndian);
  view.setUint32(18, 26, littleEndian);
  view.setUint32(22, 0, littleEndian);
  view.setUint16(26, 1, littleEndian);
  view.setUint16(28, tag, littleEndian);
  view.setUint16(30, type, littleEndian);
  view.setUint32(32, count, littleEndian);
  if (inline) result.set(payload, 36);
  else { view.setUint32(36, dataOffset, littleEndian); result.set(payload, dataOffset); }
  return result;
}

function u16(value: number, littleEndian = true): Uint8Array {
  const bytes = new Uint8Array(2); new DataView(bytes.buffer).setUint16(0, value, littleEndian); return bytes;
}
function i16(value: number, littleEndian = true): Uint8Array {
  const bytes = new Uint8Array(2); new DataView(bytes.buffer).setInt16(0, value, littleEndian); return bytes;
}
function u32(value: number, littleEndian = true): Uint8Array {
  const bytes = new Uint8Array(4); new DataView(bytes.buffer).setUint32(0, value, littleEndian); return bytes;
}
function i32(value: number, littleEndian = true): Uint8Array {
  const bytes = new Uint8Array(4); new DataView(bytes.buffer).setInt32(0, value, littleEndian); return bytes;
}
function f32(value: number, littleEndian = true): Uint8Array {
  const bytes = new Uint8Array(4); new DataView(bytes.buffer).setFloat32(0, value, littleEndian); return bytes;
}
function f64(value: number, littleEndian = true): Uint8Array {
  const bytes = new Uint8Array(8); new DataView(bytes.buffer).setFloat64(0, value, littleEndian); return bytes;
}
function rational(numerator: number, denominator: number, signed = false, littleEndian = true): Uint8Array {
  const bytes = new Uint8Array(8); const view = new DataView(bytes.buffer);
  if (signed) { view.setInt32(0, numerator, littleEndian); view.setInt32(4, denominator, littleEndian); }
  else { view.setUint32(0, numerator, littleEndian); view.setUint32(4, denominator, littleEndian); }
  return bytes;
}

function classicTopology(littleEndian = true): Uint8Array {
  const bytes = new Uint8Array(384);
  const view = new DataView(bytes.buffer);
  bytes.set(littleEndian ? [0x49, 0x49] : [0x4d, 0x4d]);
  view.setUint16(2, 42, littleEndian);
  view.setUint32(4, 8, littleEndian);
  const putEntry = (offset: number, tag: number, type: number, count: number, value: number): void => {
    view.setUint16(offset, tag, littleEndian);
    view.setUint16(offset + 2, type, littleEndian);
    view.setUint32(offset + 4, count, littleEndian);
    if (type === 3 && count === 1) view.setUint16(offset + 8, value, littleEndian);
    else if (type === 4 && count === 1) view.setUint32(offset + 8, value, littleEndian);
    else view.setUint32(offset + 8, value, littleEndian);
  };
  const putDirectory = (offset: number, entries: readonly [number, number, number, number][], next = 0): void => {
    view.setUint16(offset, entries.length, littleEndian);
    entries.forEach(([tag, type, count, value], index) => putEntry(offset + 2 + index * 12, tag, type, count, value));
    view.setUint32(offset + 2 + entries.length * 12, next, littleEndian);
  };
  putDirectory(8, [
    [0x0100, 3, 1, 640],
    [0x0101, 3, 1, 480],
    [0x8769, 4, 1, 100],
    [0x8825, 4, 1, 140],
    [0x014a, 4, 2, 180],
  ], 280);
  putDirectory(100, [[0xa005, 4, 1, 260], [0x9201, 10, 1, 320]]);
  putDirectory(140, [[0x0001, 2, 4, 0], [0x0002, 5, 1, 328]]);
  view.setUint32(180, 200, littleEndian); view.setUint32(184, 240, littleEndian);
  putDirectory(200, [[0x010f, 2, 5, 332]]);
  putDirectory(240, [[0x0110, 2, 5, 337]]);
  putDirectory(260, [[0x0001, 2, 4, 0]]);
  putDirectory(280, [[0x0201, 4, 1, 360], [0x0202, 4, 1, 4]]);
  view.setInt32(320, 1, littleEndian); view.setInt32(324, 2, littleEndian);
  view.setUint32(328, 1, littleEndian); view.setUint32(332, 1, littleEndian); bytes.set(new TextEncoder().encode("Canon\0"), 332);
  bytes.set(new TextEncoder().encode("Nikon\0"), 337);
  bytes.set([0xff, 0xd8, 0xff, 0xd9], 360);
  return bytes;
}

describe("S06 EXIF value and validation matrix", () => {
  it("retains every classic TIFF value family and both byte orders", () => {
    const cases: readonly [number, number, Uint8Array][] = [
      [1, 1, Uint8Array.of(7)], [1, 3, Uint8Array.of(1, 2, 3)], [2, 6, Uint8Array.from([65, 66, 67, 0, 0, 0])],
      [3, 1, u16(513)], [3, 2, Uint8Array.from([...u16(1), ...u16(2)])], [4, 1, u32(123456)],
      [5, 1, rational(3, 2)], [6, 1, Uint8Array.of(251)], [7, 3, Uint8Array.of(9, 8, 7)], [8, 1, i16(-4)],
      [9, 1, i32(-123)], [10, 1, rational(-3, 2, true)], [11, 1, f32(1.25)], [12, 1, f64(Math.PI)], [13, 1, u32(26)],
      [129, 3, Uint8Array.from([0xce, 0x94, 0])],
    ];
    for (const littleEndian of [true, false]) for (const [type, count, payload] of cases) {
      const bytes = classicEntry(type, count, payload, 0xc100 + type, littleEndian);
      const parsed = parseExif(bytes, limits);
      const field = parsed.exif?.fields[0];
      expect(field).toBeDefined();
      expect(field?.type).toBe(type === 129 ? "UTF-8" : ({ 1: "BYTE", 2: "ASCII", 3: "SHORT", 4: "LONG", 5: "RATIONAL", 6: "SBYTE", 7: "UNDEFINED", 8: "SSHORT", 9: "SLONG", 10: "SRATIONAL", 11: "FLOAT", 12: "DOUBLE", 13: "IFD" } as Record<number, string>)[type]);
      expect(field?.source?.valueLength).toBe(payload.length);
    }
  });

  it("retains lexical values and emits stable diagnostics for invalid text, numbers, dates, and limits", () => {
    const invalidCases: readonly { readonly type: number; readonly count: number; readonly payload: Uint8Array; readonly code: string }[] = [
      { type: 2, count: 0, payload: new Uint8Array(), code: "INVALID_ASCII" },
      { type: 2, count: 2, payload: Uint8Array.of(0xff, 0x00), code: "INVALID_ASCII" },
      { type: 2, count: 2, payload: Uint8Array.of(65, 66), code: "INVALID_ASCII" },
      { type: 129, count: 0, payload: new Uint8Array(), code: "INVALID_VALUE" },
      { type: 129, count: 4, payload: Uint8Array.of(0xef, 0xbb, 0xbf, 0), code: "INVALID_VALUE" },
      { type: 129, count: 3, payload: Uint8Array.of(0xc3, 0x28, 0), code: "INVALID_VALUE" },
      { type: 5, count: 1, payload: rational(1, 0), code: "ZERO_DENOMINATOR" },
      { type: 11, count: 1, payload: f32(Number.POSITIVE_INFINITY), code: "INVALID_VALUE" },
      { type: 12, count: 1, payload: f64(Number.NaN), code: "INVALID_VALUE" },
    ];
    for (const item of invalidCases) {
      const parsed = parseExif(classicEntry(item.type, item.count, item.payload, 0xc200 + item.type), limits);
      expect(parsed.warnings.some(({ code }) => code === item.code), `${item.type}:${item.count}:${item.code}`).toBe(true);
      expect(parsed.exif?.fields[0]?.raw).toBeDefined();
    }
    const unknown = parseExif(classicEntry(99, 1, Uint8Array.of(1, 2, 3, 4), 0xc2ff), limits);
    const unknownField = unknown.exif?.fields[0];
    expect(unknownField?.type).toBe("UNKNOWN");
    expect(unknownField?.known).toBe(false);
    expect(unknownField?.raw).toBeInstanceOf(Uint8Array);
    const overflowing = parseExif(classicEntry(5, 0xffffffff, new Uint8Array(4), 0xc2fe), limits);
    expect(overflowing.warnings.some(({ code }) => code === "LIMIT_EXCEEDED" || code === "UNSAFE_OFFSET")).toBe(true);
    const limited = parseExif(classicEntry(2, 8, Uint8Array.from([65, 66, 67, 68, 69, 70, 71, 0]), 0xc2fd), resolveLimits({ maxValueBytes: 4, maxStringBytes: 4 }));
    expect(limited.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
  });

  it("validates special EXIF values and preserves topology diagnostics", () => {
    const flash = parseExif(exifEntry(3, 2, Uint8Array.from([0x5f, 0, 0, 0]), 0x9209), limits);
    expect(flash.warnings.some(({ code }) => code === "INVALID_VALUE")).toBe(true);
    const apex = parseExif(exifEntry(10, 1, rational(1, 2, true), 0x9201), limits);
    expect(apex.warnings).toEqual([]);
    const learning = parseExif(exifEntry(7, 6, Uint8Array.from([1, 0, 0, 0, 5, 0]), 0x9287), limits);
    expect(learning.warnings.some(({ code }) => code === "INVALID_VALUE")).toBe(true);
    const repeated = classicEntry(4, 1, u32(26), 0x014a);
    const withSecond = new Uint8Array(repeated.length + 18);
    withSecond.set(repeated);
    const view = new DataView(withSecond.buffer);
    view.setUint16(26, 1, true); view.setUint16(28, 0xc301, true); view.setUint16(30, 4, true); view.setUint32(32, 1, true); view.setUint32(36, 26, true); view.setUint32(40, 0, true);
    const shared = parseExif(withSecond, limits);
    expect(shared.exif).not.toBeNull();
    expect(shared.warnings.every(({ code }) => typeof code === "string")).toBe(true);
  });

  it("covers BigTIFF inline, offset, signed, unknown, and malformed value paths", () => {
    for (const littleEndian of [true, false]) {
      const values: readonly [number, bigint, Uint8Array][] = [
        [16, 1n, littleEndian ? Uint8Array.from([7, 0, 0, 0, 0, 0, 0, 0]) : Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 7])],
        [17, 1n, littleEndian ? Uint8Array.from([254, 255, 255, 255, 255, 255, 255, 255]) : Uint8Array.from([255, 255, 255, 255, 255, 255, 255, 254])],
        [18, 1n, littleEndian ? Uint8Array.from([52, 0, 0, 0, 0, 0, 0, 0]) : Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 52])],
        [12, 1n, littleEndian ? f64(2.5) : f64(2.5, false)],
      ];
      for (const [type, count, payload] of values) {
        const parsed = parseBigTiff(bigEntry(type, count, payload, 0xc400 + type, littleEndian), limits);
        expect(parsed.exif?.fields[0]).toBeDefined();
      }
      const unknown = parseBigTiff(bigEntry(99, 1n, Uint8Array.of(1, 2, 3, 4, 5, 6, 7, 8), 0xc4ff, littleEndian), limits);
      expect(unknown.warnings.some(({ code }) => code === "MALFORMED_EXIF")).toBe(true);
      const badHeader = bigEntry(16, 1n, Uint8Array.of(1), 0xc401, littleEndian).slice();
      badHeader[6] = 1;
      expect(parseBigTiff(badHeader, limits).exif).toBeNull();
      expect(parseBigTiff(bigEntry(16, 1n, Uint8Array.of(1), 0xc401, littleEndian).slice(0, 15), limits).warnings[0]?.code).toBe("TRUNCATED_DATA");
    }
    const huge = bigEntry(16, 0xffffffffffffffffn, new Uint8Array(8));
    expect(parseBigTiff(huge, limits).warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
  });

  it("covers classic TIFF header, selection, pointer, topology, and warning-limit boundaries", () => {
    const short = parseExif(new Uint8Array([0x49, 0x49]), limits);
    expect(short.exif).toBeNull();
    expect(short.warnings[0]?.code).toBe("TRUNCATED_DATA");

    const badOrder = parseExif(Uint8Array.from([0x58, 0x58, 0x2a, 0, 8, 0, 0, 0]), limits);
    expect(badOrder.exif).toBeNull();
    expect(badOrder.warnings[0]?.code).toBe("MALFORMED_EXIF");
    const badMagic = Uint8Array.from([0x49, 0x49, 0x2b, 0, 8, 0, 0, 0]);
    expect(parseExif(badMagic, limits).warnings[0]?.code).toBe("MALFORMED_EXIF");
    const noRoot = Uint8Array.from([0x49, 0x49, 0x2a, 0, 0, 0, 0, 0]);
    expect(parseExif(noRoot, limits).warnings[0]?.code).toBe("MALFORMED_EXIF");

    const outside = classicEntry(4, 1, u32(0xffff), 0x8769);
    const outsideResult = parseExif(outside, limits, Number.MAX_SAFE_INTEGER + 1);
    expect(outsideResult.warnings).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET", ifd: "IFD0", tag: 0x8769 }));
    expect(outsideResult.warnings.every(({ offset }) => offset === undefined || offset >= 0)).toBe(true);

    const cycle = classicEntry(4, 1, u32(8), 0x8769);
    const cycleResult = parseExif(cycle, limits);
    expect(cycleResult.exif?.topology?.relations ?? []).toEqual(expect.arrayContaining([expect.objectContaining({ type: "cycle" })]));

    const badGps = classicEntry(3, 1, u16(12), 0x8825);
    expect(parseExif(badGps, limits).warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_EXIF", tag: 0x8825 }));
    const badSubIfdType = classicEntry(3, 1, u16(12), 0x014a);
    expect(parseExif(badSubIfdType, limits).warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_EXIF", tag: 0x014a }));
    const badSubIfdCount = classicEntry(4, 0, new Uint8Array(), 0x014a);
    expect(parseExif(badSubIfdCount, limits).warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_EXIF", tag: 0x014a }));

    const selected = parseExif(classicEntry(2, 4, Uint8Array.of(65, 66, 67, 0), 0xc311), limits, 0, new Set(["Tag 0xC311"]));
    expect(selected.exif?.fields).toHaveLength(1);
    const excluded = parseExif(classicEntry(2, 4, Uint8Array.of(65, 66, 67, 0), 0xc312), limits, 0, new Set(["not-present"]));
    expect(excluded.exif?.fields).toHaveLength(0);
    const warningLimited = parseExif(classicEntry(2, 2, Uint8Array.of(0xff, 0)), resolveLimits({ maxWarnings: 1 }));
    expect(warningLimited.warnings).toHaveLength(1);
  });

  it("retains a complete classic TIFF topology with nested pointers, shared references, and an associated thumbnail", () => {
    for (const littleEndian of [true, false]) {
      const input = classicTopology(littleEndian);
      const parsed = parseExif(input, limits);
      expect(parsed.exif?.ifds.map(({ name }) => name)).toEqual(expect.arrayContaining(["IFD0", "ExifIFD", "GPSIFD", "InteropIFD", "SubIFD[0]", "SubIFD[1]", "IFD1"]));
      expect(parsed.exif?.topology?.relations.length ?? 0).toBeGreaterThanOrEqual(5);
      expect(parsed.exif?.associatedImages).toContainEqual(expect.objectContaining({ role: "thumbnail", offset: 360, length: 4 }));
      expect(parsed.exif?.fields.length ?? 0).toBeGreaterThan(4);

      const selected = parseExif(input, limits, 17, new Set(["ImageWidth", "SubIFDs"]));
      expect(selected.exif?.fields.some(({ name }) => name === "ImageWidth")).toBe(true);
      expect(selected.exif?.fields.some(({ tag }) => tag === 0x014a)).toBe(true);
      expect(selected.exif?.fields.some(({ tag }) => tag === 0x8769)).toBe(false);

      for (const mutation of [
        (value: Uint8Array) => { new DataView(value.buffer).setUint32(18, 0xfffffff0, littleEndian); },
        (value: Uint8Array) => { new DataView(value.buffer).setUint32(30, 3, littleEndian); },
        (value: Uint8Array) => { new DataView(value.buffer).setUint32(42, 0, littleEndian); },
        (value: Uint8Array) => { new DataView(value.buffer).setUint32(74, 8, littleEndian); },
      ]) {
        const mutated = input.slice();
        mutation(mutated);
        const result = parseExif(mutated, resolveLimits({ ...limits, maxWarnings: 16, maxIfdDepth: 2 }));
        expect(result.warnings.length).toBeLessThanOrEqual(16);
        expect(result.fields.length).toBeLessThanOrEqual(128);
      }
    }
  });

  it("exercises exact pointer, value-range, decode-budget, and registry-limit outcomes", () => {
    const unknown = classicEntry(99, 1, Uint8Array.of(1, 2, 3, 4), 0xc501);
    expect(parseExif(unknown, resolveLimits({ maxValueBytes: 3 })).fields).toHaveLength(0);
    expect(parseExif(unknown, resolveLimits({ maxMetadataBytes: 1, maxValueBytes: 16 })).fields).toHaveLength(0);

    const overlapping = classicEntry(2, 5, Uint8Array.from([65, 66, 67, 68, 0]), 0xc502);
    new DataView(overlapping.buffer).setUint32(18, 8, true);
    expect(parseExif(overlapping, limits).warnings).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));
    const outside = classicEntry(2, 5, Uint8Array.from([65, 66, 67, 68, 0]), 0xc503);
    new DataView(outside.buffer).setUint32(18, 0xfffffff0, true);
    expect(parseExif(outside, limits).warnings).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));

    const badPointer = classicEntry(3, 1, u16(26), 0x8769);
    expect(parseExif(badPointer, limits).warnings).toContainEqual(expect.objectContaining({ tag: 0x8769 }));
    const badInterop = exifEntry(3, 1, u16(26), 0xa005);
    expect(parseExif(badInterop, limits).warnings).toContainEqual(expect.objectContaining({ tag: 0xa005 }));
    const badSubIfd = classicEntry(4, 2, u32(26), 0x014a);
    expect(parseExif(badSubIfd, limits).warnings).toContainEqual(expect.objectContaining({ tag: 0x014a }));

    const invalidRootTable = new Uint8Array(22);
    invalidRootTable.set([0x49, 0x49, 42, 0, 8, 0, 0, 0], 0);
    new DataView(invalidRootTable.buffer).setUint16(8, 3, true);
    expect(parseExif(invalidRootTable, limits).warnings.some(({ code }) => code === "TRUNCATED_DATA")).toBe(true);

    for (const littleEndian of [true, false]) {
      const invalidUnknown = bigEntry(99, 1n, Uint8Array.of(1, 2, 3, 4, 5, 6, 7, 8), 0xc505, littleEndian);
      expect(parseBigTiff(invalidUnknown, resolveLimits({ maxValueBytes: 3 }))).toMatchObject({ fields: [] });
      expect(parseBigTiff(invalidUnknown, resolveLimits({ maxMetadataBytes: 1, maxValueBytes: 16 }))).toMatchObject({ fields: [] });

      const invalidPointer = bigEntry(3, 1n, littleEndian ? Uint8Array.of(26, 0) : Uint8Array.of(0, 26), 0x8769, littleEndian);
      expect(parseBigTiff(invalidPointer, limits).warnings).toContainEqual(expect.objectContaining({ tag: 0x8769 }));

      const outOfLine = bigEntry(2, 9n, new Uint8Array(9).fill(65), 0xc506, littleEndian);
      const outOfLineView = new DataView(outOfLine.buffer);
      outOfLineView.setBigUint64(36, 0xffffffffffffffffn, littleEndian);
      expect(parseBigTiff(outOfLine, limits).warnings).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));
    }
  });
});
