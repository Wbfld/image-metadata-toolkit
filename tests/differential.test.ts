import { readFile } from "node:fs/promises";
import { afterAll, describe, expect, it } from "vitest";
import ExifReader from "exifreader";
import { exiftool } from "exiftool-vendored";

import { parseMetadata } from "../src/index.js";

const jpegUrl = new URL("./fixtures/jpeg-exif-little-endian.jpg", import.meta.url);
const tiffUrl = new URL("./fixtures/tiff-exif-little-endian.tif", import.meta.url);

function localField(result: Awaited<ReturnType<typeof parseMetadata>>, name: string): unknown {
  return result.fields.find((field) => field.name === name)?.value;
}

afterAll(async () => {
  await exiftool.end();
});

describe("independent-reader comparisons", () => {
  it.each([jpegUrl, tiffUrl])("agrees with ExifReader on stable EXIF values for %s", async (fixture) => {
    const bytes = await readFile(fixture);
    const [result, external] = await Promise.all([
      parseMetadata(bytes),
      ExifReader.load(bytes, { expanded: true, async: true }),
    ]);

    expect(localField(result, "Make")).toBe(external.exif?.Make?.value[0]);
    expect(localField(result, "Model")).toBe(external.exif?.Model?.value[0]);
    expect(localField(result, "Orientation")).toBe(external.exif?.Orientation?.value);
    expect(localField(result, "ISOSpeedRatings")).toBe(external.exif?.ISOSpeedRatings?.value);
  });

  it.each([jpegUrl, tiffUrl])("agrees with ExifTool on stable EXIF values for %s", async (fixture) => {
    const [result, external] = await Promise.all([
      parseMetadata(await readFile(fixture)),
      exiftool.read(fixture.pathname),
    ]);

    expect(localField(result, "Make")).toBe(external.Make);
    expect(localField(result, "Model")).toBe(external.Model);
    expect(localField(result, "Orientation")).toBe(external.Orientation);
    expect(localField(result, "ISOSpeedRatings")).toBe(external.ISO);
  });

  it.each([jpegUrl, tiffUrl])("keeps S03 composite interpretations equivalent to ExifTool after documented normalization for %s", async (fixture) => {
    // Differential normalization rules: EXIF's `YYYY:MM:DD HH:MM:SS` remains
    // a local wall-clock value unless OffsetTime* is present; rational values
    // are compared numerically; ExifTool's display labels are not treated as
    // source vocabulary. Composite provenance and conflicts are local to this
    // package and therefore are asserted independently of the oracle output.
    const [result, external] = await Promise.all([
      parseMetadata(await readFile(fixture)),
      exiftool.read(fixture.pathname),
    ]);
    const composites = result.composites;
    expect(composites).toBeDefined();
    const orientation = composites?.orientation.value;
    if (typeof external.Orientation === "number") expect(orientation?.code).toBe(external.Orientation);
    const capture = composites?.captureTime.value;
    if (typeof external.DateTimeOriginal === "string" && capture !== null && capture !== undefined) {
      expect(capture.local).toBe(external.DateTimeOriginal.replace(/^\d{4}:\d{2}:\d{2}/u, (date) => date.replaceAll(":", "-")).replace(" ", " "));
    }
    const exposure = composites?.exposureValue.value;
    if (exposure !== null && exposure !== undefined && typeof external.ExposureTime === "number" && typeof external.FNumber === "number") {
      expect(exposure.ev).toBeCloseTo(Math.log2(external.FNumber ** 2 / external.ExposureTime), 8);
    }
  });
});
