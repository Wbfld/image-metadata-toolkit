import { describe, expect, it } from "vitest";
import { deriveImageDetails } from "../src/details.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";
import { parseMetadata } from "../src/index.js";
import type { MetadataField, ParsedMetadataResult } from "../src/types.js";

function base(format: ParsedMetadataResult["format"], fields: readonly MetadataField[] = []): ParsedMetadataResult {
  const mimeType = format === "jpeg" ? "image/jpeg" : format === "png" ? "image/png" : format === "tiff" ? "image/tiff" : format === "webp" ? "image/webp" : format === "gif" ? "image/gif" : format === "jxl" ? "image/jxl" : format === "heif" ? "image/heif" : format === "avif" ? "image/avif" : "application/octet-stream";
  return { format, mimeType, dimensions: null, fields, exif: null, xmp: null, iptc: null, icc: null, jfif: null, pngText: [], warnings: [] };
}

function jpegWithSofs(): Uint8Array {
  return Uint8Array.from([0xff, 0xd8, 0xff, 0xc0, 0, 11, 8, 0, 2, 0, 3, 1, 1, 0x11, 0, 0xff, 0xc2, 0, 11, 8, 0, 4, 0, 5, 1, 1, 0x11, 0, 0xff, 0xd9]);
}

function pngChunk(type: string, data: readonly number[]): number[] {
  return [0, 0, 0, data.length, ...Array.from(type, (value) => value.charCodeAt(0)), ...data, 0, 0, 0, 0];
}

function webpVp8x(): Uint8Array {
  const payload = [0x10, 0, 0, 0, 1, 0, 0, 1, 0, 0];
  return Uint8Array.from([...
    Array.from("RIFF", (value) => value.charCodeAt(0)), 60, 0, 0, 0,
    ...Array.from("WEBP", (value) => value.charCodeAt(0)),
    ...Array.from("VP8X", (value) => value.charCodeAt(0)), 10, 0, 0, 0, ...payload,
    ...Array.from("ANIM", (value) => value.charCodeAt(0)), 6, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ...Array.from("ANMF", (value) => value.charCodeAt(0)), 16, 0, 0, 0, ...Array.from({ length: 16 }, () => 0),
  ]);
}

describe("S08 common image/container details", () => {
  it("retains JPEG frame candidates and surfaces conflicting dimensions", async () => {
    const details = (await parseMetadata(jpegWithSofs())).details;
    expect(details?.storedDimensions.map((item) => item.value)).toEqual([{ width: 3, height: 2 }, { width: 5, height: 4 }]);
    expect(details?.storedDimensions.every((item) => item.validation === "conflicting")).toBe(true);
    expect(details?.conflicts.some((item) => item.property === "storedDimensions")).toBe(true);
    expect(details?.progressive.map((item) => item.value)).toEqual([false, true]);
    expect(details?.alpha[0]?.value).toBe("absent");
  });

  it("distinguishes PNG alpha, APNG declaration, frame count, and truncation", async () => {
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    const ihdr = pngChunk("IHDR", [0, 0, 0, 2, 0, 0, 0, 2, 8, 3, 0, 0, 0]);
    const trns = pngChunk("tRNS", [0, 1]);
    const actl = pngChunk("acTL", [0, 0, 0, 2, 0, 0, 0, 1]);
    const fctl = pngChunk("fcTL", Array.from({ length: 26 }, () => 0));
    const complete = Uint8Array.from([...signature, ...ihdr, ...trns, ...actl, ...fctl, ...fctl, ...pngChunk("IEND", [])]);
    const details = (await parseMetadata(complete)).details;
    expect(details?.storedDimensions[0]?.value).toEqual({ width: 2, height: 2 });
    expect(details?.alpha[0]?.value).toBe("present");
    expect(details?.animation).toHaveLength(2);
    expect(details?.animation.every((item) => item.validation === "valid")).toBe(true);
    const truncated = (await parseMetadata(complete.subarray(0, complete.length - 4))).details;
    expect(truncated?.diagnostics?.some((item) => item.code === "TRUNCATED_DATA")).toBe(true);
  });

  it("reads WebP VP8X relationships and animation without touching payload data", async () => {
    const result = await parseMetadata(webpVp8x());
    expect(result.details?.storedDimensions[0]?.value).toEqual({ width: 2, height: 2 });
    expect(result.details?.animation[0]?.value).toEqual({ frames: 1, loopCount: 0 });
    expect(result.details?.support.animation).toBe("conditional");
    expect(result.details?.formatSpecific).toMatchObject({ frameCount: 1, animated: true });
  });

  it("keeps GIF transparency unknown until a complete stream proves absence", () => {
    const header = Uint8Array.from([...new TextEncoder().encode("GIF89a"), 1, 0, 1, 0, 0, 0, 0]);
    const partial = deriveImageDetails(base("gif"), header, DEFAULT_LIMITS);
    expect(partial.alpha).toEqual([]);
    const complete = Uint8Array.from([...header, 0x3b]);
    const proven = deriveImageDetails(base("gif"), complete, DEFAULT_LIMITS);
    expect(proven.alpha[0]?.value).toBe("absent");
  });

  it("retains TIFF directory candidates, orientation conflicts, and source provenance", () => {
    const field = (id: string, name: string, value: unknown, directoryId: string, offset: number): MetadataField => ({ id, ifd: directoryId, tag: 1, name, raw: value as never, value: value as never, display: String(value), description: "", type: "LONG", sensitivity: "none", directoryId, source: { blockId: `block:${directoryId}`, directoryId, entryOffset: offset, entryLength: 12, valueOffset: offset + 8, valueLength: 4 } });
    const result = base("tiff", [field("a", "ImageWidth", 100, "IFD0", 100), field("b", "ImageLength", 50, "IFD0", 112), field("c", "ImageWidth", 200, "SubIFD:1", 200), field("d", "ImageLength", 100, "SubIFD:1", 212), field("e", "Orientation", 1, "IFD0", 300), field("f", "Orientation", 6, "SubIFD:1", 400)]);
    const details = deriveImageDetails(result, undefined, DEFAULT_LIMITS);
    expect(details.storedDimensions.map((item) => item.value)).toEqual([{ width: 100, height: 50 }, { width: 200, height: 100 }]);
    expect(details.conflicts.some((item) => item.property === "storedDimensions")).toBe(true);
    expect(details.orientation.every((item) => item.blockId?.startsWith("block:") === true)).toBe(true);
    expect(details.orientation.every((item) => item.validation === "conflicting")).toBe(true);
  });

  it("bounds candidates, declares unsupported states honestly, and preserves JXL/HEIF model details", () => {
    const limits = { ...DEFAULT_LIMITS, maxImageDetailCandidates: 1, maxImageDetailRelationships: 1 };
    const fields: MetadataField[] = [1, 2, 3].map((value) => ({ id: `w${value}`, ifd: `IFD${value}`, tag: 1, name: "ImageWidth", raw: value, value, display: String(value), description: "", type: "LONG", sensitivity: "none" }));
    const tiff = deriveImageDetails(base("tiff", fields), undefined, limits);
    expect(tiff.storedDimensions.length).toBeLessThanOrEqual(1);
    expect(tiff.support.progressive).toBe("unsupported");
    const jxl = deriveImageDetails(base("jxl"), new Uint8Array([0xff, 0x0a]), DEFAULT_LIMITS);
    expect(jxl.storedDimensions).toEqual([]);
    expect(jxl.support.storedDimensions).toBe("conditional");
    const heif = deriveImageDetails({ ...base("heif"), nclx: { colourPrimaries: 1, transferCharacteristics: 13, matrixCoefficients: 1, fullRange: true } }, undefined, DEFAULT_LIMITS);
    expect(heif.formatSpecific).toMatchObject({ nclx: { colourPrimaries: 1 } });
    expect(heif.support.relationships).toBe("supported");
    const avif = deriveImageDetails({ ...base("avif"), dimensions: { width: 320, height: 240 } }, undefined, DEFAULT_LIMITS);
    expect(avif.storedDimensions[0]?.value).toEqual({ width: 320, height: 240 });
    expect(avif.support.progressive).toBe("unsupported");
  });
});
