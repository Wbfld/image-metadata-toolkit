import { describe, expect, it } from "vitest";

import { detectFormat } from "../src/detect-format.js";

function ascii(value: string): number[] {
  return Array.from(value, (character) => character.charCodeAt(0));
}

function uint32BigEndian(value: number): number[] {
  return [
    Math.floor(value / 0x1000000) & 0xff,
    Math.floor(value / 0x10000) & 0xff,
    Math.floor(value / 0x100) & 0xff,
    value & 0xff,
  ];
}

function ftyp(majorBrand: string, compatibleBrands: readonly string[] = [], boxSize?: number): Uint8Array {
  const actualSize = 16 + (compatibleBrands.length * 4);
  return Uint8Array.from([
    ...uint32BigEndian(boxSize ?? actualSize),
    ...ascii("ftyp"),
    ...ascii(majorBrand),
    0,
    0,
    0,
    0,
    ...compatibleBrands.flatMap(ascii),
  ]);
}

describe("detectFormat", () => {
  it.each([
    ["JPEG", [0xff, 0xd8, 0xff, 0xe1], "jpeg", "image/jpeg"],
    ["PNG", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "png", "image/png"],
    ["little-endian TIFF", [0x49, 0x49, 0x2a, 0x00], "tiff", "image/tiff"],
    ["big-endian TIFF", [0x4d, 0x4d, 0x00, 0x2a], "tiff", "image/tiff"],
    ["little-endian BigTIFF", [0x49, 0x49, 0x2b, 0x00, 0x08, 0x00, 0x00, 0x00], "tiff", "image/tiff"],
    ["big-endian BigTIFF", [0x4d, 0x4d, 0x00, 0x2b, 0x00, 0x08, 0x00, 0x00], "tiff", "image/tiff"],
    ["WebP", [...ascii("RIFF"), 4, 0, 0, 0, ...ascii("WEBP")], "webp", "image/webp"],
    ["GIF89a", [...ascii("GIF89a")], "gif", "image/gif"],
    ["JPEG XL codestream", [0xff, 0x0a], "jxl", "image/jxl"],
    ["JPEG XL container", [0, 0, 0, 12, ...ascii("JXL "), 0x0d, 0x0a, 0x87, 0x0a], "jxl", "image/jxl"],
  ])("detects %s", (_name, signature, format, mimeType) => {
    expect(detectFormat(Uint8Array.from(signature))).toEqual({ format, mimeType });
  });

  it.each([
    ["heic", [], "heif", "image/heif"],
    ["mif1", ["heic"], "heif", "image/heif"],
    ["avif", [], "avif", "image/avif"],
    ["avio", [], "avif", "image/avif"],
    ["mif2", [], "heif", "image/heif"],
    ["mif1", ["avif"], "avif", "image/avif"],
    ["heic", ["avif"], "avif", "image/avif"],
  ])("detects BMFF brand %s with compatibility %j", (major, compatible, format, mimeType) => {
    expect(detectFormat(ftyp(major, compatible))).toEqual({ format, mimeType });
  });

  it("supports a valid extended-size ftyp box", () => {
    const bytes = Uint8Array.from([
      0,
      0,
      0,
      1,
      ...ascii("ftyp"),
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      24,
      ...ascii("avif"),
      0,
      0,
      0,
      0,
    ]);

    expect(detectFormat(bytes)).toEqual({ format: "avif", mimeType: "image/avif" });
  });

  it("supports a zero-sized ftyp box that extends to EOF", () => {
    expect(detectFormat(ftyp("heic", [], 0))).toEqual({ format: "heif", mimeType: "image/heif" });
  });

  it.each([
    ["empty", []],
    ["truncated JPEG", [0xff, 0xd8]],
    ["truncated PNG", [0x89, 0x50, 0x4e, 0x47]],
    ["near-miss TIFF", [0x49, 0x4d, 0x2a, 0x00]],
    ["invalid BigTIFF offset width", [0x49, 0x49, 0x2b, 0x00, 0x04, 0x00, 0x00, 0x00]],
    ["near-miss WebP", [...ascii("RIFF"), 4, 0, 0, 0, ...ascii("WEPB")]],
    ["truncated WebP", [...ascii("RIFF"), 4, 0, 0, 0, 0x57, 0x45, 0x42]],
    ["unrelated BMFF brand", Array.from(ftyp("isom", ["mp42"]))],
  ])("leaves %s unknown", (_name, bytes) => {
    expect(detectFormat(Uint8Array.from(bytes))).toEqual({
      format: "unknown",
      mimeType: "application/octet-stream",
    });
  });

  it.each([
    ["smaller than the mandatory fields", ftyp("avif", [], 12)],
    ["not aligned to a brand boundary", ftyp("avif", ["mif1"], 18)],
    ["larger than the supplied data", ftyp("avif", [], 32)],
    [
      "extended size smaller than its mandatory fields",
      Uint8Array.from([
        0,
        0,
        0,
        1,
        ...ascii("ftyp"),
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        20,
        ...ascii("avif"),
        0,
        0,
        0,
        0,
      ]),
    ],
    [
      "extended size larger than the supplied data",
      Uint8Array.from([
        0,
        0,
        0,
        1,
        ...ascii("ftyp"),
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        40,
        ...ascii("avif"),
        0,
        0,
        0,
        0,
      ]),
    ],
  ])("rejects an ftyp box whose size is %s", (_name, bytes) => {
    expect(detectFormat(bytes)).toEqual({
      format: "unknown",
      mimeType: "application/octet-stream",
    });
  });
});
