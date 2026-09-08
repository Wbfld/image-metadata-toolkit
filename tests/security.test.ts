import { describe, expect, it } from "vitest";

import {
  assertRange,
  checkedAdd,
  checkedMultiply,
  isNonNegativeSafeInteger,
  isValidRange,
  readFloat32,
  readFloat64,
  readInt16,
  readInt32,
  readInt8,
  readUint16,
  readUint32,
  readUint64,
  readUint8,
  subarrayChecked,
} from "../src/security/bounds.js";
import { DEFAULT_LIMITS, resolveLimits } from "../src/security/limits.js";

describe("security limits", () => {
  it("exposes positive, immutable defaults", () => {
    expect(Object.isFrozen(DEFAULT_LIMITS)).toBe(true);
    for (const value of Object.values(DEFAULT_LIMITS)) {
      expect(Number.isSafeInteger(value)).toBe(true);
      expect(value).toBeGreaterThan(0);
    }
  });

  it("merges a partial override without mutating the defaults", () => {
    const resolved = resolveLimits({ maxInputBytes: 1024, maxIfdDepth: 3 });

    expect(resolved.maxInputBytes).toBe(1024);
    expect(resolved.maxIfdDepth).toBe(3);
    expect(resolved.maxSegments).toBe(DEFAULT_LIMITS.maxSegments);
    expect(DEFAULT_LIMITS.maxInputBytes).not.toBe(1024);
    expect(Object.isFrozen(resolved)).toBe(true);
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid numeric limit %s",
    (value) => {
      expect(() => resolveLimits({ maxSegments: value })).toThrow(RangeError);
    },
  );

  it("rejects non-numeric and unknown limits supplied from JavaScript", () => {
    expect(() => resolveLimits({ maxSegments: "many" } as never)).toThrow(TypeError);
    expect(() => resolveLimits({ maxRecursion: 10 } as never)).toThrow(/Unknown security limit/);
  });

  it("does not accept inherited values as caller overrides", () => {
    const inherited = Object.create({ maxInputBytes: 1 }) as Partial<typeof DEFAULT_LIMITS>;
    expect(resolveLimits(inherited).maxInputBytes).toBe(DEFAULT_LIMITS.maxInputBytes);
  });
});

describe("bounds and arithmetic", () => {
  it.each([
    [0, true],
    [Number.MAX_SAFE_INTEGER, true],
    [-1, false],
    [0.5, false],
    [Number.NaN, false],
    [Number.POSITIVE_INFINITY, false],
  ])("classifies %s as a non-negative safe integer: %s", (value, expected) => {
    expect(isNonNegativeSafeInteger(value)).toBe(expected);
  });

  it("accepts empty boundary ranges and rejects unsafe ranges", () => {
    expect(isValidRange(8, 0, 8)).toBe(true);
    expect(isValidRange(8, 8, 0)).toBe(true);
    expect(isValidRange(8, 9, 0)).toBe(false);
    expect(isValidRange(8, 4, 5)).toBe(false);
    expect(isValidRange(8, -1, 1)).toBe(false);
    expect(isValidRange(8, 0, 1.5)).toBe(false);
    expect(isValidRange(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 1)).toBe(false);
    expect(() => assertRange(8, 7, 2, "test range")).toThrow(/test range is out of bounds/);
  });

  it("checks integer addition and multiplication for overflow", () => {
    expect(checkedAdd(20, 22)).toBe(42);
    expect(checkedMultiply(6, 7)).toBe(42);
    expect(() => checkedAdd(Number.MAX_SAFE_INTEGER, 1)).toThrow(RangeError);
    expect(() => checkedMultiply(Number.MAX_SAFE_INTEGER, 2)).toThrow(RangeError);
    expect(() => checkedAdd(-1, 1)).toThrow(RangeError);
    expect(() => checkedMultiply(1.5, 2)).toThrow(RangeError);
  });

  it("returns only checked, zero-copy subarrays", () => {
    const bytes = Uint8Array.from([1, 2, 3, 4]);
    const slice = subarrayChecked(bytes, 1, 2);

    expect([...slice]).toEqual([2, 3]);
    bytes[1] = 9;
    expect(slice[0]).toBe(9);
    expect(() => subarrayChecked(bytes, 3, 2)).toThrow(RangeError);
  });
});

describe("bounded numeric readers", () => {
  const bytes = Uint8Array.from([
    0x01,
    0x02,
    0x03,
    0x04,
    0x05,
    0x06,
    0x07,
    0x08,
    0xff,
    0xfe,
  ]);

  it("reads unsigned integers in both byte orders", () => {
    expect(readUint8(bytes, 0)).toBe(1);
    expect(readUint16(bytes, 0, "big-endian")).toBe(0x0102);
    expect(readUint16(bytes, 0, "little-endian")).toBe(0x0201);
    expect(readUint32(bytes, 0, "big-endian")).toBe(0x01020304);
    expect(readUint32(bytes, 0, "little-endian")).toBe(0x04030201);
    expect(readUint64(bytes, 0, "big-endian")).toBe(0x0102030405060708n);
    expect(readUint64(bytes, 0, "little-endian")).toBe(0x0807060504030201n);
  });

  it("reads signed integers in both byte orders", () => {
    expect(readInt8(bytes, 8)).toBe(-1);
    expect(readInt16(bytes, 8, "big-endian")).toBe(-2);
    expect(readInt16(bytes, 8, "little-endian")).toBe(-257);

    const signed = Uint8Array.from([0xff, 0xff, 0xff, 0xfe]);
    expect(readInt32(signed, 0, "big-endian")).toBe(-2);
    expect(readInt32(signed, 0, "little-endian")).toBe(-16_777_217);
  });

  it("reads IEEE floating-point values in both byte orders", () => {
    const buffer = new ArrayBuffer(16);
    const view = new DataView(buffer);
    view.setFloat32(0, 1.5, false);
    view.setFloat32(4, 1.5, true);
    view.setFloat64(8, Math.PI, false);
    const floats = new Uint8Array(buffer);

    expect(readFloat32(floats, 0, "big-endian")).toBe(1.5);
    expect(readFloat32(floats, 4, "little-endian")).toBe(1.5);
    expect(readFloat64(floats, 8, "big-endian")).toBe(Math.PI);
  });

  it("honors the byteOffset of Uint8Array views", () => {
    const underlying = Uint8Array.from([99, 0x12, 0x34, 99]);
    const window = underlying.subarray(1, 3);

    expect(readUint16(window, 0, "big-endian")).toBe(0x1234);
  });

  it("rejects truncated, fractional, negative, and overflowing reads", () => {
    expect(() => readUint32(bytes, 7, "big-endian")).toThrow(RangeError);
    expect(() => readUint16(bytes, -1, "big-endian")).toThrow(RangeError);
    expect(() => readUint16(bytes, 0.5, "big-endian")).toThrow(RangeError);
    expect(() => readUint8(bytes, Number.MAX_SAFE_INTEGER)).toThrow(RangeError);
    expect(() => readUint16(bytes, 0, "sideways" as never)).toThrow(TypeError);
  });
});
