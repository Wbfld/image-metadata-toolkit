import { describe, expect, it } from "vitest";

import { parseExif } from "../src/metadata/exif.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";
import { DEFAULT_METADATA_REGISTRY } from "../src/registry.js";

type Endian = "little" | "big";

interface Entry {
  readonly tag: number;
  readonly type: number;
  readonly count: number;
  readonly bytes: Uint8Array;
}

function tiff(endian: Endian, entries: readonly Entry[], options: { readonly truncateAt?: number } = {}): Uint8Array {
  const little = endian === "little";
  const bytes = new Uint8Array(512);
  const view = new DataView(bytes.buffer);
  bytes.set(little ? [0x49, 0x49] : [0x4d, 0x4d], 0);
  view.setUint16(2, 42, little);
  view.setUint32(4, 8, little);
  // S02 fields live in ExifIFD; expose that directory through the standard
  // IFD0 ExifIFDPointer so the cases exercise the real traversal path.
  const exifOffset = 64;
  view.setUint16(8, 1, little);
  view.setUint16(10, 0x8769, little);
  view.setUint16(12, 4, little);
  view.setUint32(14, 1, little);
  view.setUint32(18, exifOffset, little);
  view.setUint32(22, 0, little);
  view.setUint16(exifOffset, entries.length, little);
  let cursor = exifOffset + 2 + entries.length * 12 + 4;
  let end = cursor;
  const size = (type: number): number => ({ 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 129: 1 }[type] ?? 1);
  for (const [index, entry] of entries.entries()) {
    const entryOffset = exifOffset + 2 + index * 12;
    view.setUint16(entryOffset, entry.tag, little);
    view.setUint16(entryOffset + 2, entry.type, little);
    view.setUint32(entryOffset + 4, entry.count, little);
    if (entry.bytes.length <= 4) {
      bytes.set(entry.bytes, entryOffset + 8);
    } else {
      view.setUint32(entryOffset + 8, cursor, little);
      bytes.set(entry.bytes, cursor);
      cursor += entry.bytes.length;
      end = Math.max(end, cursor);
    }
    if (entry.count * size(entry.type) <= 4) end = Math.max(end, entryOffset + 12);
  }
  view.setUint32(exifOffset + 2 + entries.length * 12, 0, little);
  const requestedEnd = options.truncateAt ?? end;
  return bytes.slice(0, Math.max(0, Math.min(requestedEnd, bytes.length)));
}

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(`${value}\0`);
}

function field(result: ReturnType<typeof parseExif>, name: string) {
  return result.exif?.fields.find((candidate) => candidate.name === name)
    ?? result.fields.find((candidate) => candidate.name === name);
}

describe("Exif 3.1 vocabulary and UTF-8 conformance", () => {
  it("exposes the reviewed legal types/counts and privacy policy categories", () => {
    expect(DEFAULT_METADATA_REGISTRY.sources[0]).toMatchObject({ edition: "3.1", standard: "CIPA Exif" });
    expect(DEFAULT_METADATA_REGISTRY.get("ExifIFD", 0xa40e)).toMatchObject({
      name: "DevelopmentTypeDescription",
      legalTypes: ["UTF-8"],
      count: { min: 1, max: null },
      version: "3.1",
      validation: { kind: "utf8" },
    });
    expect(DEFAULT_METADATA_REGISTRY.get("ExifIFD", 0x9287)).toMatchObject({
      name: "LearningOptOutIn",
      legalTypes: ["UNDEFINED"],
      sensitivity: "moderate",
      writePolicy: "safe",
    });
    expect(DEFAULT_METADATA_REGISTRY.get("ExifIFD", 0x9208)?.enumValues?.["30"]).toContain("LED");
    expect(DEFAULT_METADATA_REGISTRY.get("GPSIFD", 0x0002)).toMatchObject({ legalTypes: ["RATIONAL"], count: { min: 3, max: 3 } });
  });

  for (const endian of ["little", "big"] as const) {
    it(`decodes valid UTF-8 in inline and out-of-line values (${endian}-endian)`, () => {
      const result = parseExif(tiff(endian, [
        { tag: 0xa430, type: 129, count: 3, bytes: utf8("é").slice(0, 3) },
        { tag: 0xa40e, type: 129, count: utf8("Δ 📷").length, bytes: utf8("Δ 📷") },
      ]), DEFAULT_LIMITS);
      expect(field(result, "CameraOwnerName")).toMatchObject({ type: "UTF-8", value: "é", raw: "é" });
      expect(field(result, "DevelopmentTypeDescription")).toMatchObject({ type: "UTF-8", value: "Δ 📷", raw: "Δ 📷" });
      expect(result.warnings.filter((warning) => warning.tag === 0xa430 || warning.tag === 0xa40e)).toEqual([]);
    });

    it(`retains invalid UTF-8 bytes and emits a warning (${endian}-endian)`, () => {
      const invalid = Uint8Array.of(0xc3, 0x28, 0x00);
      const result = parseExif(tiff(endian, [{ tag: 0xa40e, type: 129, count: invalid.length, bytes: invalid }]), DEFAULT_LIMITS);
      const parsed = field(result, "DevelopmentTypeDescription");
      expect(parsed?.type).toBe("UTF-8");
      expect(parsed?.value).toBeNull();
      expect(parsed?.raw).toEqual(invalid);
      expect(result.warnings.some((warning) => warning.tag === 0xa40e && /invalid UTF-8/i.test(warning.message))).toBe(true);
    });

    it(`validates LearningOptOutIn SHORT pairs (${endian}-endian)`, () => {
      const pairs = new Uint8Array(10);
      const view = new DataView(pairs.buffer);
      const little = endian === "little";
      view.setUint16(0, 2, little);
      view.setUint16(2, 0, little);
      view.setUint16(4, 2, little);
      view.setUint16(6, 1, little);
      view.setUint16(8, 0, little);
      const result = parseExif(tiff(endian, [{ tag: 0x9287, type: 7, count: pairs.length, bytes: pairs }]), DEFAULT_LIMITS);
      expect(field(result, "LearningOptOutIn")?.raw).toEqual(pairs);
      expect(result.warnings.filter((warning) => warning.tag === 0x9287)).toEqual([]);
    });
  }

  it("reports wrong type/count without dropping the field", () => {
    const result = parseExif(tiff("little", [
      { tag: 0xa40e, type: 2, count: 2, bytes: Uint8Array.of(0x41, 0) },
      { tag: 0xa40d, type: 3, count: 2, bytes: Uint8Array.of(1, 0, 0, 0) },
    ]), DEFAULT_LIMITS);
    expect(field(result, "DevelopmentTypeDescription")?.known).toBe(true);
    expect(field(result, "DevelopmentType")?.known).toBe(true);
    expect(result.warnings.filter((warning) => warning.code === "INVALID_VALUE").length).toBeGreaterThanOrEqual(2);
  });

  it("retains a truncated out-of-line value safely", () => {
    const complete = tiff("big", [{ tag: 0xa40e, type: 129, count: 12, bytes: utf8("truncated") }]);
    const truncated = complete.slice(0, complete.length - 3);
    const result = parseExif(truncated, DEFAULT_LIMITS);
    expect(field(result, "DevelopmentTypeDescription")).toBeUndefined();
    expect(result.warnings.some((warning) => warning.code === "UNSAFE_OFFSET" || warning.code === "TRUNCATED_DATA")).toBe(true);
  });

  it("accepts Exif 3.1 LED LightSource values and rejects reserved values", () => {
    const valid = tiff("little", [{ tag: 0x9208, type: 3, count: 1, bytes: Uint8Array.of(30, 0) }]);
    expect(parseExif(valid, DEFAULT_LIMITS).warnings.filter((warning) => warning.tag === 0x9208)).toEqual([]);
    const invalid = tiff("little", [{ tag: 0x9208, type: 3, count: 1, bytes: Uint8Array.of(99, 0) }]);
    expect(parseExif(invalid, DEFAULT_LIMITS).warnings.some((warning) => warning.tag === 0x9208 && /reserved value/.test(warning.message))).toBe(true);
  });
});
