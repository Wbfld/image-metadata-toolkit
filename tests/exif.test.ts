import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { parseMetadata } from "../src/index.js";
import { parseExif } from "../src/metadata/exif.js";
import { isTiffHeader, parseTiff } from "../src/parsers/tiff.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";
import type { MetadataField } from "../src/types.js";

type Endian = "little" | "big";

interface FixtureEntry {
  readonly tag: number;
  readonly type: number;
  readonly count: number;
  readonly data: Uint8Array;
}

class TiffFixture {
  public readonly bytes = new Uint8Array(8_192);
  private readonly view = new DataView(this.bytes.buffer);
  private readonly littleEndian: boolean;
  private dataCursor = 2_048;
  private maximumUsed = 8;

  public constructor(endian: Endian, firstIfdOffset = 8) {
    this.littleEndian = endian === "little";
    this.bytes.set(endian === "little" ? [0x49, 0x49] : [0x4d, 0x4d], 0);
    this.view.setUint16(2, 42, this.littleEndian);
    this.view.setUint32(4, firstIfdOffset, this.littleEndian);
  }

  public writeIfd(offset: number, entries: readonly FixtureEntry[], nextIfdOffset = 0): void {
    this.view.setUint16(offset, entries.length, this.littleEndian);
    entries.forEach((entry, index) => {
      const entryOffset = offset + 2 + index * 12;
      this.view.setUint16(entryOffset, entry.tag, this.littleEndian);
      this.view.setUint16(entryOffset + 2, entry.type, this.littleEndian);
      this.view.setUint32(entryOffset + 4, entry.count, this.littleEndian);
      if (entry.data.byteLength <= 4) {
        this.bytes.fill(0, entryOffset + 8, entryOffset + 12);
        this.bytes.set(entry.data, entryOffset + 8);
      } else {
        const valueOffset = this.allocate(entry.data);
        this.view.setUint32(entryOffset + 8, valueOffset, this.littleEndian);
      }
    });
    const tableEnd = offset + 2 + entries.length * 12;
    this.view.setUint32(tableEnd, nextIfdOffset, this.littleEndian);
    this.maximumUsed = Math.max(this.maximumUsed, tableEnd + 4);
  }

  public setUint16(offset: number, value: number): void {
    this.view.setUint16(offset, value, this.littleEndian);
    this.maximumUsed = Math.max(this.maximumUsed, offset + 2);
  }

  public setUint32(offset: number, value: number): void {
    this.view.setUint32(offset, value, this.littleEndian);
    this.maximumUsed = Math.max(this.maximumUsed, offset + 4);
  }

  public finish(): Uint8Array {
    return this.bytes.slice(0, this.maximumUsed);
  }

  private allocate(data: Uint8Array): number {
    const offset = this.dataCursor;
    this.bytes.set(data, offset);
    this.dataCursor += data.byteLength;
    if ((this.dataCursor & 1) !== 0) this.dataCursor += 1;
    this.maximumUsed = Math.max(this.maximumUsed, this.dataCursor);
    return offset;
  }
}

function entry(tag: number, type: number, data: Uint8Array, count?: number): FixtureEntry {
  const sizes: Readonly<Record<number, number>> = {
    1: 1,
    2: 1,
    3: 2,
    4: 4,
    5: 8,
    6: 1,
    7: 1,
    8: 2,
    9: 4,
    10: 8,
    11: 4,
    12: 8,
    13: 4,
  };
  const size = sizes[type] ?? data.byteLength;
  return { tag, type, count: count ?? data.byteLength / size, data };
}

function ascii(value: string): Uint8Array {
  return Uint8Array.from([...Array.from(value), "\0"], (character) => character.charCodeAt(0));
}

function encoded(
  endian: Endian,
  size: number,
  values: readonly number[],
  setter: (view: DataView, offset: number, value: number, littleEndian: boolean) => void,
): Uint8Array {
  const bytes = new Uint8Array(size * values.length);
  const view = new DataView(bytes.buffer);
  values.forEach((value, index) => setter(view, index * size, value, endian === "little"));
  return bytes;
}

function uint16(endian: Endian, ...values: number[]): Uint8Array {
  return encoded(endian, 2, values, (view, offset, value, little) => view.setUint16(offset, value, little));
}

function int16(endian: Endian, ...values: number[]): Uint8Array {
  return encoded(endian, 2, values, (view, offset, value, little) => view.setInt16(offset, value, little));
}

function uint32(endian: Endian, ...values: number[]): Uint8Array {
  return encoded(endian, 4, values, (view, offset, value, little) => view.setUint32(offset, value, little));
}

function int32(endian: Endian, ...values: number[]): Uint8Array {
  return encoded(endian, 4, values, (view, offset, value, little) => view.setInt32(offset, value, little));
}

function float32(endian: Endian, ...values: number[]): Uint8Array {
  return encoded(endian, 4, values, (view, offset, value, little) => view.setFloat32(offset, value, little));
}

function float64(endian: Endian, ...values: number[]): Uint8Array {
  return encoded(endian, 8, values, (view, offset, value, little) => view.setFloat64(offset, value, little));
}

function rationals(endian: Endian, ...values: readonly [number, number][]): Uint8Array {
  return uint32(endian, ...values.flatMap(([numerator, denominator]) => [numerator, denominator]));
}

function signedRationals(endian: Endian, ...values: readonly [number, number][]): Uint8Array {
  return int32(endian, ...values.flatMap(([numerator, denominator]) => [numerator, denominator]));
}

function field(fields: readonly MetadataField[], name: string): MetadataField {
  const found = fields.find((candidate) => candidate.name === name);
  if (found === undefined) throw new Error(`Missing test field ${name}`);
  return found;
}

function comprehensiveLittleEndianFixture(): Uint8Array {
  const endian = "little";
  const fixture = new TiffFixture(endian);
  fixture.writeIfd(
    8,
    [
      entry(0x010f, 2, ascii("Canon")),
      entry(0x0110, 2, ascii("EOS R5")),
      entry(0x0112, 3, uint16(endian, 6)),
      entry(0x0132, 2, ascii("2024:02:29 12:34:56")),
      entry(0x013b, 2, ascii("Alice")),
      entry(0x8298, 2, ascii("Alice\0Studio")),
      entry(0x0131, 2, ascii("Fixture Writer")),
      entry(0x8769, 4, uint32(endian, 200)),
      entry(0x8825, 4, uint32(endian, 400)),
      entry(0xc7a1, 3, uint16(endian, 99)),
    ],
    540,
  );
  fixture.writeIfd(200, [
    entry(0x829a, 5, rationals(endian, [1, 125])),
    entry(0x829d, 5, rationals(endian, [28, 10])),
    entry(0x8827, 3, uint16(endian, 640)),
    entry(0x9003, 2, ascii("2024:02:29 12:34:55")),
    entry(0x9201, 10, signedRationals(endian, [7, 1])),
    entry(0x9202, 5, rationals(endian, [3, 1])),
    entry(0x9209, 3, uint16(endian, 0x5f)),
    entry(0x920a, 5, rationals(endian, [50, 1])),
    entry(0xa005, 4, uint32(endian, 500)),
    entry(0xa431, 2, ascii("BODY-1234")),
  ]);
  fixture.writeIfd(400, [
    entry(0x0001, 2, ascii("N")),
    entry(0x0002, 5, rationals(endian, [51, 1], [30, 1], [0, 1])),
    entry(0x0003, 2, ascii("W")),
    entry(0x0004, 5, rationals(endian, [0, 1], [7, 1], [30, 1])),
    entry(0x0005, 1, Uint8Array.of(1)),
    entry(0x0006, 5, rationals(endian, [25, 2])),
  ]);
  fixture.writeIfd(500, [entry(0x0001, 2, ascii("R98"))]);
  fixture.writeIfd(540, [entry(0x0100, 4, uint32(endian, 160))]);
  return fixture.finish();
}

describe("safe TIFF/EXIF parsing", () => {
  it("walks IFD0, EXIF, GPS, interoperability, and thumbnail IFDs", () => {
    const bytes = comprehensiveLittleEndianFixture();
    const result = parseExif(bytes, DEFAULT_LIMITS);

    expect(isTiffHeader(bytes)).toBe(true);
    expect(isTiffHeader(Uint8Array.of(0x49, 0x49, 0x2a))).toBe(false);
    expect(result.exif?.byteOrder).toBe("little-endian");
    expect(result.exif?.ifds.map(({ name }) => name)).toEqual([
      "IFD0",
      "ExifIFD",
      "GPSIFD",
      "IFD1",
      "InteropIFD",
    ]);
    expect(result.warnings).toEqual([]);
    expect(field(result.exif?.fields ?? [], "BodySerialNumber").sensitivity).toBe("high");
    expect(field(result.exif?.fields ?? [], "InteroperabilityIndex").value).toBe("R98");
    expect(field(result.exif?.fields ?? [], "Tag 0xC7A1").known).toBe(false);
  });

  it("preserves raw values while exposing normalized common values", () => {
    const result = parseTiff(comprehensiveLittleEndianFixture(), DEFAULT_LIMITS);

    expect(field(result.fields, "Make")).toMatchObject({
      id: "normalized:Make",
      raw: "Canon",
      value: "Canon",
    });
    expect(field(result.fields, "Orientation")).toMatchObject({ value: 6, display: "Right-top (rotated 90° clockwise)" });
    expect(field(result.fields, "DateTime")).toMatchObject({
      raw: "2024:02:29 12:34:56",
      value: "2024-02-29 12:34:56",
    });
    expect(field(result.fields, "ExposureTime")).toMatchObject({
      raw: { numerator: 1, denominator: 125 },
      value: 0.008,
      display: "1/125 s",
    });
    expect(field(result.fields, "FNumber")).toMatchObject({ raw: { numerator: 28, denominator: 10 }, value: 2.8 });
    expect(field(result.fields, "ISOSpeedRatings")).toMatchObject({ value: 640, display: "ISO 640" });
    expect(field(result.fields, "FocalLength")).toMatchObject({ value: 50, display: "50 mm" });
    expect(field(result.fields, "Copyright")).toMatchObject({ raw: "Alice\0Studio", value: "Alice; Studio" });
  });

  it("applies GPS references, preserves DMS rationals, and applies altitude reference", () => {
    const result = parseExif(comprehensiveLittleEndianFixture(), DEFAULT_LIMITS);
    const latitude = field(result.fields, "GPSLatitude");
    const longitude = field(result.fields, "GPSLongitude");

    expect(latitude.value).toBe(51.5);
    expect(latitude.raw).toEqual({
      reference: "N",
      components: [
        { numerator: 51, denominator: 1 },
        { numerator: 30, denominator: 1 },
        { numerator: 0, denominator: 1 },
      ],
    });
    expect(longitude.value).toBe(-0.125);
    expect(longitude.display).toBe("0.125° W");
    expect(field(result.fields, "GPSAltitude")).toMatchObject({
      raw: { numerator: 25, denominator: 2 },
      value: -12.5,
      display: "-12.5 m",
    });
  });

  it("decodes Flash as a bitmask and interprets APEX values", () => {
    const result = parseExif(comprehensiveLittleEndianFixture(), DEFAULT_LIMITS);
    const flash = field(result.fields, "Flash");
    expect(flash.value).toEqual({
      code: 0x5f,
      fired: true,
      returnStatus: "detected",
      mode: "auto",
      functionPresent: true,
      redEyeReduction: true,
    });
    expect(flash.display).toContain("return light detected");
    expect(flash.display).toContain("red-eye reduction enabled");

    const shutter = field(result.exif?.fields ?? [], "ShutterSpeedValue");
    expect(shutter.raw).toEqual({ numerator: 7, denominator: 1 });
    expect(shutter.value).toMatchObject({ unit: "seconds", computed: 1 / 128 });
    const aperture = field(result.exif?.fields ?? [], "ApertureValue");
    expect(aperture.value).toMatchObject({ unit: "f-number" });
    if (typeof aperture.value === "object" && aperture.value !== null && "computed" in aperture.value) {
      expect(aperture.value.computed).toBeCloseTo(Math.sqrt(8), 12);
    }
  });

  it("decodes every classic TIFF scalar type in big-endian data", () => {
    const endian = "big";
    const fixture = new TiffFixture(endian);
    fixture.writeIfd(8, [
      entry(0xc001, 1, Uint8Array.of(255)),
      entry(0xc002, 2, ascii("A")),
      entry(0xc003, 3, uint16(endian, 0xabcd)),
      entry(0xc004, 4, uint32(endian, 0xfedcba98)),
      entry(0xc005, 5, rationals(endian, [4_000_000_001, 3_000_000_001])),
      entry(0xc006, 6, Uint8Array.of(0xfe)),
      entry(0xc007, 7, Uint8Array.of(1, 2, 3, 4, 5)),
      entry(0xc008, 8, int16(endian, -1_234)),
      entry(0xc009, 9, int32(endian, -123_456_789)),
      entry(0xc00a, 10, signedRationals(endian, [-3, 2])),
      entry(0xc00b, 11, float32(endian, 1.5)),
      entry(0xc00c, 12, float64(endian, Math.PI)),
      entry(0xc00d, 13, uint32(endian, 1_234)),
    ]);
    const result = parseExif(fixture.finish(), DEFAULT_LIMITS);
    const raw = result.exif?.fields.map((item) => item.raw);

    expect(result.exif?.byteOrder).toBe("big-endian");
    expect(raw).toEqual([
      255,
      "A",
      0xabcd,
      0xfedcba98,
      { numerator: 4_000_000_001, denominator: 3_000_000_001 },
      -2,
      Uint8Array.of(1, 2, 3, 4, 5),
      -1_234,
      -123_456_789,
      { numerator: -3, denominator: 2 },
      1.5,
      Math.PI,
      1_234,
    ]);
    expect(result.warnings).toEqual([]);
  });

  it("returns bounded warnings for malformed headers, offsets, cycles, and tables", () => {
    expect(parseExif(Uint8Array.of(0x49, 0x49), DEFAULT_LIMITS).warnings[0]?.code).toBe("TRUNCATED_DATA");
    expect(parseExif(Uint8Array.of(0x5a, 0x5a, 0, 42, 0, 0, 0, 0), DEFAULT_LIMITS).warnings[0]?.code).toBe("MALFORMED_EXIF");

    const missingRoot = parseExif(new TiffFixture("little", 0).finish(), DEFAULT_LIMITS);
    expect(missingRoot.exif).toBeNull();
    expect(missingRoot.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_EXIF", offset: 4 }));

    const unsafe = new TiffFixture("little", 0xfffffff0).finish();
    const unsafeResult = parseExif(unsafe, DEFAULT_LIMITS, 100);
    expect(unsafeResult.exif).not.toBeNull();
    expect(unsafeResult.warnings[0]).toMatchObject({ code: "UNSAFE_OFFSET", offset: 0x100000054 });

    const cyclic = new TiffFixture("little");
    cyclic.writeIfd(8, [], 8);
    expect(
      parseExif(cyclic.finish(), DEFAULT_LIMITS).warnings.some(
        (warning) => warning.code === "MALFORMED_EXIF" && warning.message.includes("already visited"),
      ),
    ).toBe(true);

    const truncated = new TiffFixture("little");
    truncated.setUint16(8, 10);
    const truncatedResult = parseExif(truncated.finish(), DEFAULT_LIMITS);
    expect(truncatedResult.warnings).toContainEqual(expect.objectContaining({ code: "TRUNCATED_DATA", ifd: "IFD0" }));

    const invalidValueOffset = new TiffFixture("little");
    invalidValueOffset.writeIfd(8, [entry(0x010f, 2, ascii("Camera"))]);
    invalidValueOffset.setUint32(18, 0xfffffff0);
    const invalidValueResult = parseExif(invalidValueOffset.finish(), DEFAULT_LIMITS);
    expect(invalidValueResult.exif?.fields).toEqual([]);
    expect(invalidValueResult.warnings).toContainEqual(
      expect.objectContaining({ code: "UNSAFE_OFFSET", ifd: "IFD0", tag: 0x010f }),
    );
  });

  it("rejects out-of-line values that overlap structural TIFF regions", () => {
    const fixture = new TiffFixture("little");
    fixture.writeIfd(8, [entry(0x010f, 2, ascii("Camera"))]);
    fixture.setUint32(18, 8);
    const result = parseExif(fixture.finish(), DEFAULT_LIMITS);

    expect(result.exif?.fields).toEqual([]);
    expect(
      result.warnings.some(
        ({ code, tag, message }) => code === "UNSAFE_OFFSET" && tag === 0x010f && message.includes("IFD0 table"),
      ),
    ).toBe(true);
  });

  it("retains unknown tags and unknown type slots without following unsafe values", () => {
    const fixture = new TiffFixture("little");
    fixture.writeIfd(8, [entry(0xc100, 99, Uint8Array.of(1, 2, 3, 4), 27)]);
    const result = parseExif(fixture.finish(), DEFAULT_LIMITS);
    const unknown = result.exif?.fields[0];

    expect(unknown).toMatchObject({ name: "Tag 0xC100", type: "UNKNOWN", count: 27, known: false });
    expect(unknown?.raw).toEqual(Uint8Array.of(1, 2, 3, 4));
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_EXIF", tag: 0xc100 }));
  });

  it("does not follow directory pointers with the wrong TIFF type or count", () => {
    const wrongType = new TiffFixture("little");
    wrongType.writeIfd(8, [entry(0x8769, 3, uint16("little", 200))]);
    wrongType.writeIfd(200, [entry(0x9003, 2, ascii("2024:01:01 00:00:00"))]);
    const wrongTypeResult = parseExif(wrongType.finish(), DEFAULT_LIMITS);
    expect(wrongTypeResult.exif?.ifds.map(({ name }) => name)).toEqual(["IFD0"]);
    expect(wrongTypeResult.warnings).toContainEqual(
      expect.objectContaining({ code: "MALFORMED_EXIF", tag: 0x8769 }),
    );

    const wrongCount = new TiffFixture("little");
    wrongCount.writeIfd(8, [entry(0x8769, 4, uint32("little", 200, 200))]);
    wrongCount.writeIfd(200, []);
    const wrongCountResult = parseExif(wrongCount.finish(), DEFAULT_LIMITS);
    expect(wrongCountResult.exif?.ifds.map(({ name }) => name)).toEqual(["IFD0"]);
    expect(wrongCountResult.warnings).toContainEqual(
      expect.objectContaining({ code: "MALFORMED_EXIF", tag: 0x8769 }),
    );
  });

  it("validates ASCII, dates, numeric ranges, rationals, and incomplete GPS", () => {
    const fixture = new TiffFixture("little");
    fixture.writeIfd(8, [
      entry(0x010f, 2, Uint8Array.of(0x43, 0xff, 0)),
      entry(0x0112, 3, uint16("little", 9)),
      entry(0x0132, 2, ascii("2023:02:30 25:61:61")),
      entry(0x8769, 4, uint32("little", 200)),
      entry(0x8825, 4, uint32("little", 400)),
    ]);
    fixture.writeIfd(200, [entry(0x829a, 5, rationals("little", [1, 0]))]);
    fixture.writeIfd(400, [entry(0x0002, 5, rationals("little", [51, 1], [30, 1], [0, 1]))]);
    const result = parseExif(fixture.finish(), DEFAULT_LIMITS);
    const codes = result.warnings.map(({ code }) => code);

    expect(codes).toContain("INVALID_ASCII");
    expect(codes).toContain("INVALID_DATE");
    expect(codes).toContain("INVALID_VALUE");
    expect(codes).toContain("ZERO_DENOMINATOR");
    expect(codes).toContain("INCOMPLETE_GPS");
    expect(result.fields.some(({ name }) => name === "ExposureTime")).toBe(false);
    expect(result.fields.some(({ name }) => name === "Make")).toBe(false);
    expect(field(result.exif?.fields ?? [], "Make")).toMatchObject({ raw: "Cÿ", value: null });
  });

  it("retains unterminated ASCII losslessly but does not normalize it", () => {
    const fixture = new TiffFixture("little");
    fixture.writeIfd(8, [entry(0x0131, 2, Uint8Array.of(0x41, 0x80, 0x42))]);
    const result = parseExif(fixture.finish(), DEFAULT_LIMITS);
    const software = field(result.exif?.fields ?? [], "Software");

    expect(typeof software.raw).toBe("string");
    if (typeof software.raw === "string") {
      expect(Array.from(software.raw, (character) => character.charCodeAt(0))).toEqual([0x41, 0x80, 0x42]);
    }
    expect(software.value).toBeNull();
    expect(result.fields.some(({ name }) => name === "Software")).toBe(false);
    expect(result.warnings.filter(({ code }) => code === "INVALID_ASCII")).toHaveLength(2);
  });

  it("decodes a long valid ASCII value with bounded chunked work", () => {
    const count = 128 * 1024;
    const bytes = new Uint8Array(26 + count);
    const view = new DataView(bytes.buffer);
    bytes.set([0x49, 0x49, 0x2a, 0x00, 8, 0, 0, 0]);
    view.setUint16(8, 1, true);
    view.setUint16(10, 0x0131, true);
    view.setUint16(12, 2, true);
    view.setUint32(14, count, true);
    view.setUint32(18, 26, true);
    view.setUint32(22, 0, true);
    bytes.fill(0x41, 26, bytes.length - 1);

    const result = parseExif(bytes, {
      ...DEFAULT_LIMITS,
      maxMetadataBytes: count * 2,
      maxStringBytes: count,
      maxValueBytes: count,
    });
    const software = field(result.exif?.fields ?? [], "Software");

    expect(software.raw).toBe("A".repeat(count - 1));
    expect(field(result.fields, "Software").value).toBe("A".repeat(count - 1));
    expect(result.warnings).toEqual([]);
  });

  it("warns for reserved Flash bits and overflowing or underflowing APEX calculations", () => {
    const fixture = new TiffFixture("little");
    fixture.writeIfd(8, [entry(0x8769, 4, uint32("little", 200))]);
    fixture.writeIfd(200, [
      entry(0x9209, 3, uint16("little", 0x80)),
      entry(0x9201, 10, signedRationals("little", [2_000_000_000, 1])),
      entry(0x9202, 5, rationals("little", [4_000_000_000, 1])),
    ]);
    const result = parseExif(fixture.finish(), DEFAULT_LIMITS);

    expect(result.warnings.some(({ code, tag }) => code === "INVALID_VALUE" && tag === 0x9209)).toBe(true);
    expect(result.warnings.some(({ code, tag }) => code === "INVALID_VALUE" && tag === 0x9201)).toBe(true);
    expect(result.warnings.some(({ code, tag }) => code === "INVALID_VALUE" && tag === 0x9202)).toBe(true);
    expect(field(result.exif?.fields ?? [], "ShutterSpeedValue").value).toEqual({
      numerator: 2_000_000_000,
      denominator: 1,
    });
    expect(field(result.exif?.fields ?? [], "ApertureValue").value).toEqual({
      numerator: 4_000_000_000,
      denominator: 1,
    });
  });

  it("does not silently choose between duplicate common tags", () => {
    const fixture = new TiffFixture("little");
    fixture.writeIfd(8, [
      entry(0x010f, 2, ascii("First")),
      entry(0x010f, 2, ascii("Second")),
    ]);
    const result = parseExif(fixture.finish(), DEFAULT_LIMITS);

    expect(result.exif?.fields.filter(({ name }) => name === "Make")).toHaveLength(2);
    expect(result.fields.some(({ name }) => name === "Make")).toBe(false);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ code: "MALFORMED_EXIF", tag: 0x010f }),
    );
  });

  it("enforces entry, value, depth, and warning limits", () => {
    const fixture = new TiffFixture("little");
    fixture.writeIfd(8, [
      entry(0x010f, 2, ascii("Long Make")),
      entry(0x8769, 4, uint32("little", 200)),
    ]);
    fixture.writeIfd(200, [entry(0x9003, 2, ascii("2024:01:01 00:00:00"))]);

    const entryLimited = parseExif(fixture.finish(), { ...DEFAULT_LIMITS, maxIfdEntries: 1 });
    expect(entryLimited.exif?.fields).toHaveLength(1);
    expect(entryLimited.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));

    const valueLimited = parseExif(fixture.finish(), { ...DEFAULT_LIMITS, maxValueBytes: 4 });
    expect(valueLimited.exif?.fields.some(({ name }) => name === "Make")).toBe(false);
    expect(valueLimited.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));

    const depthLimited = parseExif(fixture.finish(), { ...DEFAULT_LIMITS, maxIfdDepth: 0 });
    expect(depthLimited.exif?.ifds.map(({ name }) => name)).toEqual(["IFD0"]);
    expect(depthLimited.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));

    const warningLimited = parseExif(fixture.finish(), {
      ...DEFAULT_LIMITS,
      maxIfdEntries: 1,
      maxWarnings: 1,
    });
    expect(warningLimited.warnings).toHaveLength(1);
  });

  it("charges aliased values against a cumulative decode-work budget", () => {
    const fixture = new TiffFixture("little");
    fixture.writeIfd(8, [
      entry(0x010f, 2, ascii("Camera")),
      entry(0x0110, 2, ascii("Camera")),
    ]);
    // Both entries deliberately point at the same seven value bytes.
    fixture.setUint32(30, 2_048);
    const result = parseExif(fixture.finish(), {
      ...DEFAULT_LIMITS,
      maxMetadataBytes: 16,
      maxStringBytes: 100,
      maxValueBytes: 100,
    });

    expect(result.exif?.fields).toHaveLength(1);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ code: "LIMIT_EXCEEDED", tag: 0x0110 }),
    );
  });

  it("parses the checked-in binary JPEG fixture through the public API", async () => {
    const fixtureUrl = new URL("fixtures/jpeg-exif-little-endian.jpg", import.meta.url);
    const bytes = await readFile(fixtureUrl);
    const result = await parseMetadata(bytes);

    expect(result.format).toBe("jpeg");
    expect(result.exif?.byteOrder).toBe("little-endian");
    expect(field(result.fields, "Make").value).toBe("OpenAI Camera");
    expect(field(result.fields, "ExposureTime").raw).toEqual({ numerator: 1, denominator: 125 });
    expect(field(result.fields, "GPSLatitude").value).toBe(51.5);
    expect(result.warnings).toEqual([]);
  });
});
