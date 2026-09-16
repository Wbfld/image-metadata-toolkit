import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import {
  auditPrivacy,
  getCaptureTime,
  getGps,
  getImageDetails,
  getOrientation,
  getRotation,
  getThumbnail,
  parseMetadata,
  parseMetadataMany,
  queryIccTags,
  queryImageDetails,
  queryMetadata,
  queryStructuredXmp,
  toExifReaderCompatible,
  toExifrCompatible,
  toFamilyGroups,
  toFlatObject,
  toJsonSafeResult,
  toLosslessFamilyGroups,
} from "../src/index.js";

const names = [
  "avif-idat-item-metadata.avif", "avif-item-metadata.avif", "avif-metadata.avif", "avif-primary-dimensions.avif", "avif-primary-icc.avif", "avif-primary-nclx.avif",
  "base.jpg", "base.png", "base.webp", "heif-conflicting-primary-dimensions.heic", "heif-cross-meta-item-reference.heic", "heif-idat-item-metadata.heic", "heif-indexed-idat-item-metadata.heic", "heif-iref-exif.heic", "heif-item-metadata.heic", "heif-item-truncated.heic", "heif-metadata.heic", "heif-primary-dimensions.heic", "heif-primary-icc-malformed.heic", "heif-primary-icc.heic", "heif-tail-idat-item-metadata.heic", "heif-truncated.heic",
  "jpeg-exif-little-endian.jpg", "jpeg-icc-malformed.jpg", "jpeg-icc.jpg", "jpeg-iptc-malformed.jpg", "jpeg-iptc.jpg", "libavif-paris-icc-exif-xmp.avif", "png-bad-text.png", "png-icc-malformed.png", "png-metadata.png", "png-truncated.png", "tiff-exif-little-endian.tif", "tiff-metadata-truncated.tif", "tiff-metadata.tif", "tiff-truncated.tif", "webp-metadata.webp", "webp-truncated.webp", "source.ppm",
] as const;

const groups = ["Dimensions", "EXIF", "XMP", "IPTC", "ICC", "JFIF", "PNGText", "Photoshop", "MakerNote", "MPF", "Transform", "Nclx"] as const;

function blob(bytes: Uint8Array): Blob {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return new Blob([copy]);
}

describe("S06 complete fixture public API matrix", () => {
  it("runs every lawful repository fixture through default, family, tag, and empty selections", async () => {
    for (const name of names) {
      const bytes = new Uint8Array(await readFile(new URL(`./fixtures/${name}`, import.meta.url)));
      const defaults = await parseMetadata(bytes);
      const selected = await parseMetadata(bytes, { select: { groups: [...groups] } });
      const empty = await parseMetadata(bytes, { select: { groups: [] } });
      const tags = await parseMetadata(bytes, { select: { tags: ["Make", "Model", "Orientation", "DateTime", "GPSLatitude", "XPTitle"] } });
      for (const result of [defaults, selected, empty, tags]) {
        expect(result.format).toBeTypeOf("string");
        expect(result.fields).toBeInstanceOf(Array);
        expect(result.warnings).toBeInstanceOf(Array);
        expect(result.blocks).toBeInstanceOf(Array);
        expect(result.completeness).toBeDefined();
        expect(result.coverage).toBeDefined();
        expect(JSON.stringify(toJsonSafeResult(result))).not.toContain("[object Object]");
      }
      expect(empty.fields.length).toBeLessThanOrEqual(defaults.fields.length);
      expect(tags.fields.every(({ name: fieldName }) => typeof fieldName === "string")).toBe(true);
    }
  }, 120000);

  it("exercises range scopes, Blob materialization, concurrency, cancellation, and all projections on real fixtures", async () => {
    const jpeg = new Uint8Array(await readFile(new URL("./fixtures/jpeg-exif-little-endian.jpg", import.meta.url)));
    const png = new Uint8Array(await readFile(new URL("./fixtures/png-metadata.png", import.meta.url)));
    const webp = new Uint8Array(await readFile(new URL("./fixtures/webp-metadata.webp", import.meta.url)));
    const tiff = new Uint8Array(await readFile(new URL("./fixtures/tiff-metadata.tif", import.meta.url)));
    const heif = new Uint8Array(await readFile(new URL("./fixtures/heif-metadata.heic", import.meta.url)));
    for (const [bytes, scopes] of [[jpeg, ["jpeg-header", "metadata", "full"]], [png, ["metadata", "full"]], [webp, ["metadata", "full"]], [tiff, ["metadata", "full"]], [heif, ["metadata", "full"]] ] as const) {
      for (const scope of scopes) {
        const result = await parseMetadata(blob(bytes), { scope });
        expect(result.format).toBeTypeOf("string");
        if (scope === "metadata") expect(result.telemetry?.readRequests).toBeGreaterThan(0);
        if (scope === "metadata") expect(result.completeness.inputBytes).toBe(bytes.length);
      }
    }
    const many = await parseMetadataMany([jpeg, blob(png), webp, tiff], { concurrency: 2 });
    expect(many).toHaveLength(4);
    expect(many.map(({ format }) => format)).toEqual(["jpeg", "png", "webp", "tiff"]);
    const controller = new AbortController(); controller.abort();
    await expect(parseMetadataMany([jpeg, png], { signal: controller.signal })).rejects.toMatchObject({ code: "ABORTED" });

    const result = await parseMetadata(jpeg);
    expect(getCaptureTime(result)).toBeDefined();
    expect(getGps(result)).toBeDefined();
    expect(getImageDetails(result)).toBeDefined();
    expect(getOrientation(result)).toBeDefined();
    expect(getRotation(result)).toBeDefined();
    expect(getThumbnail(result)).toBeDefined();
    expect(queryMetadata(result, { family: "EXIF" })).toBeDefined();
    expect(queryStructuredXmp({ namespaces: {}, properties: {} }, { localName: "missing" })).toBeDefined();
    expect(queryImageDetails(result, { property: "storedDimensions" })).toBeDefined();
    expect(queryIccTags(result)).toBeDefined();
    expect(toFlatObject(result)).toBeDefined();
    expect(toFamilyGroups(result)).toBeDefined();
    expect(toLosslessFamilyGroups(result)).toBeDefined();
    expect(toExifReaderCompatible(result)).toBeDefined();
    expect(toExifrCompatible(result)).toBeDefined();
    const audit = await auditPrivacy(jpeg);
    expect(audit.findings).toBeInstanceOf(Array);
    expect(audit.coverage).toBeDefined();
  }, 120000);
});
