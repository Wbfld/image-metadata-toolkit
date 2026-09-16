import { describe, expect, it, vi } from "vitest";

import type { MetadataField } from "../src/types.js";

const state = vi.hoisted<{
  parsed: Record<string, unknown>;
  icc: Record<string, unknown>;
  iptc: Record<string, unknown>;
  photoshop: Record<string, unknown> | null;
  makerNotes: Record<string, unknown>;
  thumbnail: Record<string, unknown> | null;
}>(() => ({
  parsed: { exif: null, fields: [], warnings: [] },
  icc: { data: null, fields: [], warnings: [] },
  iptc: { data: null, fields: [], warnings: [] },
  photoshop: null,
  makerNotes: { notes: [], complete: true, diagnostics: [] },
  thumbnail: null,
}));

vi.mock("../src/metadata/exif.js", () => ({ parseExif: () => state.parsed }));
vi.mock("../src/metadata/icc.js", () => ({
  parseIccChunk: (payload: Uint8Array) => payload[0] === 0x49 ? { sequence: 1, total: 1, byteLength: payload.length, data: payload.slice() } : null,
  inspectIccProfile: () => state.icc,
}));
vi.mock("../src/metadata/iptc.js", () => ({ parseIptcMetadata: () => state.iptc }));
vi.mock("../src/metadata/photoshop.js", () => ({ parsePhotoshopResources: () => state.photoshop }));
vi.mock("../src/metadata/makernote.js", () => ({
  inspectMakerNotes: () => state.makerNotes,
  makerNoteFieldsAsMetadataFields: () => [],
}));
vi.mock("../src/metadata/thumbnail.js", () => ({ extractExifThumbnail: () => state.thumbnail }));

import { parseJpeg } from "../src/parsers/jpeg.js";
import { resolveLimits } from "../src/security/limits.js";

const limits = resolveLimits({ maxIfdEntries: 32, maxWarnings: 32, maxSegments: 64, maxValueBytes: 4096, maxSegmentBytes: 4096, maxStringBytes: 1024, maxAdapterItems: 32 });
const encoder = new TextEncoder();

function concat(...values: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(values.reduce((sum, value) => sum + value.length, 0));
  let offset = 0;
  for (const value of values) { output.set(value, offset); offset += value.length; }
  return output;
}

function segment(marker: number, payload: Uint8Array): Uint8Array {
  const length = payload.length + 2;
  return concat(Uint8Array.of(0xff, marker, length >>> 8, length & 0xff), payload);
}

function jpeg(segments: readonly Uint8Array[]): Uint8Array {
  const frame = segment(0xc0, Uint8Array.of(8, 0, 3, 0, 4, 1, 1, 0x11, 0));
  const scan = segment(0xda, Uint8Array.of(1, 1, 0, 0, 63, 0));
  return concat(Uint8Array.of(0xff, 0xd8), ...segments, frame, scan, Uint8Array.of(1, 0xff, 0xd9));
}

function field(tag: number, raw: unknown, overrides: Partial<MetadataField> = {}): MetadataField {
  return {
    id: `ExifIFD:0x${tag.toString(16)}`,
    ifd: "ExifIFD",
    tag,
    name: `Tag${tag}`,
    raw: raw as never,
    value: raw as never,
    display: String(raw),
    description: "Projection field",
    type: raw instanceof Uint8Array ? "UNDEFINED" : "LONG",
    sensitivity: "moderate",
    count: raw instanceof Uint8Array ? raw.length : 1,
    known: true,
    source: { blockId: "source", entryOffset: 10, entryLength: 12, valueOffset: 30, valueLength: raw instanceof Uint8Array ? raw.length : 4 },
    ...overrides,
  };
}

describe("S06 JPEG nested-decoder projection contract", () => {
  it("projects EXIF topology, MakerNote outcomes, resource states, warnings, and remapped provenance", () => {
    const makerField = field(0x927c, Uint8Array.of(1, 2), { directoryId: "child" });
    const noSource = field(1, 1, { source: undefined as never });
    state.parsed = {
      exif: {
        byteOrder: "little-endian",
        fields: [makerField, noSource],
        ifds: [
          { name: "IFD0", offset: 8, entryCount: 1 },
          { id: "child", name: "ExifIFD", kind: "preview", associatedImage: null, offset: 32, entryCount: 1 },
          { id: "thumb", name: "IFD1", kind: "thumbnail", associatedImage: "thumbnail", offset: 60, entryCount: 1 },
        ],
        topology: { relations: [{ type: "exif-ifd", fromDirectoryId: "root", toDirectoryId: "child", tag: 34665 }, { type: "next-ifd", fromDirectoryId: "child", toDirectoryId: "thumb" }] },
        associatedImages: [{ id: "a", kind: "preview", offset: 40, length: 2 }, { id: "b", kind: "other", offset: null, length: null }],
      },
      fields: [makerField, noSource],
      warnings: [{ code: "INVALID_VALUE", message: "exif", severity: "warning", offset: 10 }],
    };
    state.thumbnail = { offset: 1, length: 1, data: Uint8Array.of(1) };
    state.icc = { data: { complete: false }, fields: [field(99, 1)], warnings: [{ code: "INVALID_VALUE", message: "icc", severity: "warning" }] };
    state.iptc = { data: { byteLength: 3, characterSet: "utf-8" }, fields: [field(120, "caption", { ifd: "IPTC", source: undefined as never })], warnings: [{ code: "MALFORMED_IPTC", message: "iptc", severity: "error" }] };
    state.photoshop = {
      complete: false,
      identifier: "Photoshop 3.0",
      source: { container: "app13", blockId: "ps", offset: 0, length: 8 },
      resources: [
        { id: "ps:r1", parentBlockId: "ps", resourceId: 0x0404, kind: "iptc", status: "decoded", offset: 4, length: 1, payloadOffset: 4, payloadLength: 1 },
        { id: "ps:r2", parentBlockId: "ps", resourceId: 0x1234, kind: "unknown", status: "unknown", offset: 5, length: 1, payloadOffset: 5, payloadLength: 1 },
        { id: "ps:r3", parentBlockId: "ps", resourceId: 0x040c, kind: "thumbnail", status: "limited", offset: 6, length: 1, payloadOffset: 6, payloadLength: 1 },
        { id: "ps:r4", parentBlockId: "ps", resourceId: 0x0424, kind: "xmp", status: "malformed", offset: 7, length: 1, payloadOffset: 7, payloadLength: 1, decoded: { kind: "xmp", packet: "<x:xmpmeta/>" } },
      ],
      diagnostics: [{ code: "INVALID_VALUE", message: "resource", offset: 4, length: 1, resourceId: 0x0404 }, { code: "MALFORMED_PHOTOSHOP", message: "bad", offset: 7 }],
    };
    const provenance = (blockId: string, noteOffset: number) => ({ blockId, noteOffset, noteLength: 2, sourceLength: 1000, fieldId: "ExifIFD:0x927c", noteRelativeOffset: 0, rangeLength: 2, originalFileOffset: noteOffset, originalFileLength: 1000, offsetBase: "note-start" });
    state.makerNotes = {
      complete: false,
      notes: [
        { id: "decoded", status: "detected-decoded", plugin: { vendor: "A" }, provenance: provenance("jpeg:APP1:2:makernote:0", 40), byteLength: 2, fields: [], opaqueRanges: [], diagnostics: [] },
        { id: "malformed", status: "rejected", plugin: null, provenance: provenance("jpeg:APP1:2:makernote:1", 42), byteLength: 2, fields: [], opaqueRanges: [], diagnostics: [] },
        { id: "opaque", status: "encrypted", plugin: null, provenance: provenance("jpeg:APP1:2:makernote:2", 44), byteLength: 2, fields: [], opaqueRanges: [], diagnostics: [] },
        { id: "partial", status: "limit-exceeded", plugin: null, provenance: provenance("jpeg:APP1:2:makernote:3", 46), byteLength: 2, fields: [], opaqueRanges: [], diagnostics: [] },
      ],
      diagnostics: [
        { code: "LIMIT_EXCEEDED", message: "limit", originalFileOffset: 46, length: 2 },
        { code: "PLUGIN_THROWN", message: "bad", originalFileOffset: null },
        { code: "LOW_CONFIDENCE", message: "low" },
      ],
    };
    const exif = concat(encoder.encode("Exif\0\0"), Uint8Array.of(1));
    const input = jpeg([
      segment(0xe0, concat(encoder.encode("JFIF\0"), Uint8Array.of(1, 2, 0, 0, 72, 0, 72, 0, 0))),
      segment(0xe1, exif), segment(0xe1, exif),
      segment(0xe2, Uint8Array.of(0x49, 1, 2)),
      segment(0xed, encoder.encode("Photoshop 3.0\0")), segment(0xed, encoder.encode("Photoshop 3.0\0")),
    ]);
    const result = parseJpeg(input, limits, { offsetMap: (offset) => offset + 100, makerNotePlugins: [] });
    expect(result.dimensions).toEqual({ width: 4, height: 3 });
    expect(result.exif?.thumbnail).toEqual(state.thumbnail);
    expect(result.icc).toEqual({ complete: false });
    expect(result.iptc?.characterSet).toBe("utf-8");
    expect(result.photoshop?.resources.length).toBeGreaterThanOrEqual(4);
    expect(result.makerNotes?.notes).toHaveLength(4);
    expect(result.blocks?.map(({ status }) => status)).toEqual(expect.arrayContaining(["decoded", "partial", "malformed", "opaque"]));
    expect(result.warnings.some(({ code }) => code === "DUPLICATE_EXIF")).toBe(true);
    expect(result.warnings.some(({ offset }) => offset !== undefined && offset >= 100)).toBe(true);
  });

  it("retains skipped family identities when selection excludes every metadata decoder", () => {
    state.parsed = { exif: null, fields: [], warnings: [] };
    state.icc = { data: null, fields: [], warnings: [] };
    state.iptc = { data: null, fields: [], warnings: [] };
    state.photoshop = null;
    state.makerNotes = { notes: [], complete: true, diagnostics: [] };
    const input = jpeg([
      segment(0xe0, concat(encoder.encode("JFIF\0"), Uint8Array.of(1, 2, 0, 0, 1, 0, 1, 0, 0))),
      segment(0xe1, concat(encoder.encode("Exif\0\0"), Uint8Array.of(1))),
      segment(0xe1, concat(encoder.encode("http://ns.adobe.com/xap/1.0/\0"), encoder.encode("<x/>"))),
      segment(0xe2, Uint8Array.of(0x49, 1)),
      segment(0xed, encoder.encode("Photoshop 3.0\0")),
    ]);
    const result = parseJpeg(input, limits, { selection: { groups: new Set(["Dimensions"]), tags: null } as never });
    expect(result.blocks?.filter(({ status }) => status === "skipped").map(({ family }) => family)).toEqual(expect.arrayContaining(["JFIF", "EXIF", "XMP", "ICC", "Photoshop"]));
  });
});
