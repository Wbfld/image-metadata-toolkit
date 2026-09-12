import { describe, expect, it } from "vitest";

import { deriveExifComposites } from "../src/normalize/composites.js";
import { parseExif } from "../src/metadata/exif.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";
import type { ExifDataType, MetadataField, MetadataValue, RationalValue } from "../src/types.js";

function rational(numerator: number, denominator: number): RationalValue {
  return { numerator, denominator };
}

let nextOffset = 100;
function field(ifd: string, tag: number, name: string, raw: MetadataValue, type: ExifDataType, count = 1): MetadataField {
  const entryOffset = nextOffset;
  nextOffset += 20;
  return {
    id: `${ifd}:0x${tag.toString(16).padStart(4, "0")}`,
    ifd,
    tag,
    name,
    raw,
    value: raw,
    display: raw instanceof Uint8Array ? `bytes:${raw.length}` : typeof raw === "object" && raw !== null ? JSON.stringify(raw) : String(raw),
    description: name,
    type,
    sensitivity: "none",
    count,
    known: true,
    source: { blockId: "test", entryOffset, entryLength: 12, valueOffset: entryOffset + 12, valueLength: 4 },
  };
}

function tiff(endian: "little" | "big", orientation: number): Uint8Array {
  const little = endian === "little";
  const bytes = new Uint8Array(32);
  const view = new DataView(bytes.buffer);
  bytes.set(little ? [0x49, 0x49] : [0x4d, 0x4d]);
  view.setUint16(2, 42, little);
  view.setUint32(4, 8, little);
  view.setUint16(8, 1, little);
  view.setUint16(10, 0x0112, little);
  view.setUint16(12, 3, little);
  view.setUint32(14, 1, little);
  view.setUint16(18, orientation, little);
  view.setUint32(20, 0, little);
  return bytes;
}

describe("S03 EXIF interpretations and composites", () => {
  it("derives typed capture/GPS time, field of view, exposure, equivalence, orientation, and display dimensions", () => {
    nextOffset = 100;
    const fields = [
      field("ExifIFD", 0x9003, "DateTimeOriginal", "2024:02:29 12:34:56", "ASCII", 20),
      field("ExifIFD", 0x9291, "SubSecTimeOriginal", "125", "ASCII", 4),
      field("ExifIFD", 0x9011, "OffsetTimeOriginal", "+01:30", "ASCII", 7),
      field("GPSIFD", 0x0007, "GPSTimeStamp", [rational(12, 1), rational(34, 1), rational(56, 2)], "RATIONAL", 3),
      field("GPSIFD", 0x001d, "GPSDateStamp", "2024:02:29", "ASCII", 11),
      field("ExifIFD", 0x920a, "FocalLength", rational(50, 1), "RATIONAL"),
      field("ExifIFD", 0xa20e, "FocalPlaneXResolution", rational(4000, 1), "RATIONAL"),
      field("ExifIFD", 0xa20f, "FocalPlaneYResolution", rational(3000, 1), "RATIONAL"),
      field("ExifIFD", 0xa210, "FocalPlaneResolutionUnit", 2, "SHORT"),
      field("ExifIFD", 0xa002, "PixelXDimension", 4000, "LONG"),
      field("ExifIFD", 0xa003, "PixelYDimension", 3000, "LONG"),
      field("IFD0", 0x0112, "Orientation", 6, "SHORT"),
      field("ExifIFD", 0x829a, "ExposureTime", rational(1, 125), "RATIONAL"),
      field("ExifIFD", 0x829d, "FNumber", rational(4, 1), "RATIONAL"),
      field("ExifIFD", 0xa405, "FocalLengthIn35mmFilm", 80, "SHORT"),
    ];
    const result = deriveExifComposites(fields, { width: 4000, height: 3000 });
    expect(result.warnings).toEqual([]);
    expect(result.composites.captureTime.value).toMatchObject({ iso8601: "2024-02-29T12:34:56.125+01:30", timezoneKnown: true });
    expect(result.composites.gpsTime.value).toMatchObject({ iso8601: "2024-02-29T12:34:28Z", utc: true });
    expect(result.composites.fieldOfView.value).toMatchObject({ resolutionUnit: "inch", focalLengthMillimetres: 50 });
    expect(result.composites.exposureValue.value).toMatchObject({ source: "ExposureTime+FNumber" });
    expect(result.composites.equivalence35mm.value).toMatchObject({ equivalentFocalLengthMillimetres: 80, source: "FocalLengthIn35mmFilm" });
    expect(result.composites.orientation.value).toMatchObject({ code: 6, rotationDegrees: 90 });
    expect(result.composites.primaryDisplayDimensions.value).toMatchObject({ width: 3000, height: 4000, orientation: 6 });
    expect(result.composites.captureTime.sourceFieldIds).toEqual(expect.arrayContaining([expect.stringContaining("0x9003"), expect.stringContaining("0x9011")]));
  });

  it("retains duplicate candidates and makes strict ambiguity explicit", () => {
    nextOffset = 1000;
    const duplicateA = field("ExifIFD", 0x9003, "DateTimeOriginal", "2024:01:01 00:00:00", "ASCII", 20);
    const duplicateB = field("ExifIFD", 0x9003, "DateTimeOriginal", "2024:01:02 00:00:00", "ASCII", 20);
    const orientationA = field("IFD0", 0x0112, "Orientation", 1, "SHORT");
    const orientationB = field("IFD0", 0x0112, "Orientation", 6, "SHORT");
    const lenient = deriveExifComposites([duplicateA, duplicateB, orientationA, orientationB], null, "lenient");
    const strict = deriveExifComposites([duplicateA, duplicateB, orientationA, orientationB], null, "strict");
    expect(lenient.composites.captureTime.candidates).toHaveLength(2);
    expect(lenient.composites.captureTime.conflicts).toHaveLength(1);
    expect(lenient.composites.captureTime.uncertainty).toBe("ambiguous");
    expect(lenient.composites.captureTime.value).not.toBeNull();
    expect(strict.composites.captureTime.value).toBeNull();
    expect(strict.composites.orientation.value).toBeNull();
    expect(strict.warnings.some((warning) => warning.severity === "error")).toBe(true);
  });

  it("retains duplicate companion values, invalid duplicates, and alternate EV sources", () => {
    nextOffset = 1500;
    const duplicateCompanions = deriveExifComposites([
      field("ExifIFD", 0x9003, "DateTimeOriginal", "2024:01:01 00:00:00", "ASCII", 20),
      field("ExifIFD", 0x9291, "SubSecTimeOriginal", "1", "ASCII", 2),
      field("ExifIFD", 0x9291, "SubSecTimeOriginal", "2", "ASCII", 2),
      field("ExifIFD", 0x9011, "OffsetTimeOriginal", "+00:00", "ASCII", 7),
      field("ExifIFD", 0x9011, "OffsetTimeOriginal", "+01:00", "ASCII", 7),
      field("ExifIFD", 0x9203, "BrightnessValue", rational(2, 1), "SRATIONAL"),
      field("ExifIFD", 0x9204, "ExposureBiasValue", rational(-1, 1), "SRATIONAL"),
    ], null, "lenient");
    expect(duplicateCompanions.composites.captureTime.candidates).toHaveLength(4);
    expect(duplicateCompanions.composites.captureTime.conflicts).toHaveLength(1);
    expect(duplicateCompanions.composites.exposureValue.value).toMatchObject({ ev: 1, source: "BrightnessValue+ExposureBiasValue" });

    const strictInvalid = deriveExifComposites([
      field("ExifIFD", 0x9003, "DateTimeOriginal", "2024:01:01 00:00:00", "ASCII", 20),
      field("ExifIFD", 0x9003, "DateTimeOriginal", "not-a-date", "ASCII", 20),
    ], null, "strict");
    expect(strictInvalid.composites.captureTime.value).toBeNull();
    expect(strictInvalid.composites.captureTime.uncertainty).toBe("partial");
  });

  it("marks missing derivation dependencies partial without losing source provenance", () => {
    nextOffset = 1800;
    const result = deriveExifComposites([
      field("ExifIFD", 0x920a, "FocalLength", rational(50, 1), "RATIONAL"),
    ], null, "lenient");
    expect(result.composites.fieldOfView.value).toBeNull();
    expect(result.composites.fieldOfView.uncertainty).toBe("partial");
    expect(result.composites.fieldOfView.sourceFieldIds).toEqual(expect.arrayContaining([expect.stringContaining("0x920a")]));
    expect(result.composites.fieldOfView.diagnostics.join(" ")).toContain("required");
    expect(result.warnings).toEqual([]);
  });

  it("retains raw-invalid inputs and emits stable diagnostics for malformed dates, offsets, and zero denominators", () => {
    nextOffset = 2000;
    const malformed = deriveExifComposites([
      field("ExifIFD", 0x9003, "DateTimeOriginal", "2023:02:29 25:61:61", "ASCII", 20),
      field("ExifIFD", 0x9011, "OffsetTimeOriginal", "+99:99", "ASCII", 7),
      field("ExifIFD", 0x829a, "ExposureTime", rational(1, 0), "RATIONAL"),
      field("ExifIFD", 0x829d, "FNumber", rational(4, 1), "RATIONAL"),
      field("IFD0", 0x0112, "Orientation", 9, "SHORT"),
    ], null, "lenient");
    expect(malformed.composites.captureTime.value).toBeNull();
    expect(malformed.composites.captureTime.uncertainty).toBe("invalid");
    expect(malformed.composites.exposureValue.value).toBeNull();
    expect(malformed.composites.orientation.value).toBeNull();
    expect(malformed.warnings.map(({ code }) => code)).toEqual(expect.arrayContaining(["INVALID_VALUE"]));
  });

  for (const endian of ["little", "big"] as const) {
    it(`interprets generated standard enum descriptions in ${endian}-endian TIFF`, () => {
      const result = parseExif(tiff(endian, 6), DEFAULT_LIMITS);
      const orientation = result.exif?.fields.find((item) => item.name === "Orientation");
      expect(orientation?.value).toBe(6);
      expect(orientation?.display).toContain("Right-top");
      expect(result.warnings).toEqual([]);
    });
  }
});
