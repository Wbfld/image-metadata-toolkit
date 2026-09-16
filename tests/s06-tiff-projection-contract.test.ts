import { describe, expect, it, vi } from "vitest";

import type { MetadataField } from "../src/types.js";

const state = vi.hoisted<{
  parsed: Record<string, unknown>;
  raw: Record<string, unknown> | null;
  icc: Record<string, unknown>;
  iptc: Record<string, unknown>;
  photoshop: Record<string, unknown> | null;
  makerNotes: Record<string, unknown>;
  thumbnail: Record<string, unknown> | null;
}>(() => ({
  parsed: { exif: null, fields: [], warnings: [] },
  raw: null,
  icc: { data: null, fields: [], warnings: [] },
  iptc: { data: null, fields: [], warnings: [] },
  photoshop: null,
  makerNotes: { notes: [], complete: true, diagnostics: [] },
  thumbnail: null,
}));

vi.mock("../src/metadata/exif.js", () => ({
  parseExif: () => state.parsed,
  parseBigTiff: () => state.parsed,
}));
vi.mock("../src/raw.js", () => ({
  normalizeRawTiffHeader: (bytes: Uint8Array) => bytes,
  inspectRawTiff: () => state.raw,
}));
vi.mock("../src/metadata/icc.js", () => ({
  inspectIccProfile: () => state.icc,
}));
vi.mock("../src/metadata/iptc.js", () => ({
  parseIptcMetadata: () => state.iptc,
}));
vi.mock("../src/metadata/photoshop.js", () => ({
  parsePhotoshopResources: () => state.photoshop,
}));
vi.mock("../src/metadata/makernote.js", () => ({
  inspectMakerNotes: () => state.makerNotes,
  makerNoteFieldsAsMetadataFields: () => [],
}));
vi.mock("../src/metadata/thumbnail.js", () => ({
  extractExifThumbnail: () => state.thumbnail,
}));

import { parseTiffMetadata } from "../src/parsers/tiff.js";
import { resolveLimits } from "../src/security/limits.js";
import { resolveSelection } from "../src/selection.js";

const limits = resolveLimits({ maxIfdEntries: 16, maxWarnings: 16, maxValueBytes: 1024, maxStringBytes: 128, maxAdapterItems: 16, maxSegments: 16 });

function field(tag: number, name: string, raw: unknown, overrides: Partial<MetadataField> = {}): MetadataField {
  return {
    id: `IFD0:0x${tag.toString(16)}`,
    ifd: "IFD0",
    tag,
    name,
    raw: raw as never,
    value: raw as never,
    display: String(raw),
    description: name,
    type: raw instanceof Uint8Array ? "UNDEFINED" : "LONG",
    sensitivity: "moderate",
    count: raw instanceof Uint8Array ? raw.length : 1,
    known: true,
    source: { blockId: "source", entryOffset: 10, entryLength: 12, valueOffset: 40, valueLength: raw instanceof Uint8Array ? raw.length : 4 },
    ...overrides,
  };
}

function configure(fields: readonly MetadataField[], warnings: readonly Record<string, unknown>[] = []): void {
  state.parsed = {
    exif: {
      byteOrder: "little-endian",
      fields,
      ifds: [
        { name: "IFD0", offset: 8, entryCount: 2 },
        { id: "thumb", name: "IFD1", kind: "thumbnail", parentId: null, depth: 1, nextId: null, sharedOffset: false, associatedImage: null, offset: 900, entryCount: 1 },
        { id: "child", name: "SubIFD", kind: "preview", parentId: "root", depth: 1, nextId: null, sharedOffset: false, associatedImage: "preview", offset: 64, entryCount: 1 },
      ],
      topology: {
        directories: [
          { id: "root", name: "IFD0", kind: "primary", parentId: null, depth: 0, nextId: null, sharedOffset: false, associatedImage: "primary", offset: 8, entryCount: 2 },
          { id: "child", name: "SubIFD", kind: "preview", parentId: "root", depth: 1, nextId: null, sharedOffset: false, associatedImage: "preview", offset: 64, entryCount: 1 },
          { id: "orphan", name: "Orphan", kind: "unknown", parentId: null, depth: 1, nextId: null, sharedOffset: false, associatedImage: null, offset: 128, entryCount: 0 },
        ],
        relations: [
          { type: "sub-ifd", fromDirectoryId: "root", toDirectoryId: "child", tag: 330 },
          { type: "next-ifd", fromDirectoryId: "root", toDirectoryId: "child" },
          { type: "sub-ifd", fromDirectoryId: "missing", toDirectoryId: "child" },
          { type: "sub-ifd", fromDirectoryId: "root", toDirectoryId: "missing" },
          { type: "sub-ifd", fromDirectoryId: "orphan", toDirectoryId: "child" },
        ],
      },
      associatedImages: [{ id: "preview", kind: "preview", offset: 70, length: 10, format: "jpeg", directoryId: "child" }, { id: "unknown", kind: "other", offset: null, length: null, format: null, directoryId: null }],
    },
    fields,
    warnings,
  };
}

function resetNested(): void {
  state.raw = null;
  state.icc = { data: null, fields: [], warnings: [] };
  state.iptc = { data: null, fields: [], warnings: [] };
  state.photoshop = null;
  state.makerNotes = { notes: [], complete: true, diagnostics: [] };
  state.thumbnail = null;
}

describe("S06 TIFF nested-decoder projection contract", () => {
  it("projects offsets, topology, family blocks, malformed nested data, and bounded warnings", () => {
    resetNested();
    const fields = [
      field(256, "ImageWidth", 640), field(257, "ImageLength", 480),
      field(700, "XMP", Uint8Array.of(0xff)),
      field(34675, "ICCProfile", new Uint8Array(132)),
      field(33723, "IPTC", Uint8Array.of(1, 2, 3), { source: { blockId: "source", entryOffset: 22, entryLength: 12, valueOffset: null, valueLength: null } }),
      field(34377, "Photoshop", Uint8Array.of(1, 2, 3, 4), { source: { blockId: "source", entryOffset: null, entryLength: 12, valueOffset: 80, valueLength: null } }),
      field(0x927c, "MakerNote", Uint8Array.of(1, 2), { directoryId: "child" }),
      field(1, "NoSource", 1, { source: undefined as never }),
    ];
    configure(fields, [{ code: "INVALID_VALUE", message: "nested", severity: "warning", offset: 4 }]);
    state.icc = { data: { complete: false }, fields: [field(99, "ICC detail", 1)], warnings: [{ code: "INVALID_VALUE", message: "icc", severity: "warning" }] };
    state.iptc = { data: { byteLength: 3 }, fields: [field(120, "Caption", "caption", { ifd: "IPTC", source: undefined as never })], warnings: [{ code: "MALFORMED_IPTC", message: "iptc", severity: "error" }] };
    state.photoshop = {
      complete: false,
      identifier: "Photoshop 3.0",
      source: { container: "tiff", blockId: "photoshop", offset: 80, length: 4 },
      resources: [
        { id: "r1", parentBlockId: "photoshop", resourceId: 1, name: "", kind: "thumbnail", status: "decoded", offset: 80, length: 1, payloadOffset: 80, payloadLength: 1 },
        { id: "r2", parentBlockId: "photoshop", resourceId: 2, name: "", kind: "unknown", status: "unknown", offset: 81, length: 1, payloadOffset: 81, payloadLength: 1 },
        { id: "r3", parentBlockId: "photoshop", resourceId: 3, name: "", kind: "iptc", status: "limited", offset: 82, length: 1, payloadOffset: 82, payloadLength: 1 },
        { id: "r4", parentBlockId: "photoshop", resourceId: 4, name: "", kind: "xmp", status: "malformed", offset: 83, length: 1, payloadOffset: 83, payloadLength: 1 },
      ],
      diagnostics: [
        { code: "INVALID_VALUE", message: "warning", offset: 80, length: 1, resourceId: 1 },
        { code: "MALFORMED_PHOTOSHOP", message: "error", offset: 83 },
      ],
    };
    state.makerNotes = {
      complete: false,
      notes: [
        { status: "detected-decoded", plugin: { vendor: "A" }, provenance: { blockId: "maker:decoded", noteOffset: 50 }, byteLength: 2 },
        { status: "malformed", plugin: null, provenance: { blockId: "maker:malformed", noteOffset: 52 }, byteLength: 2 },
        { status: "unknown", plugin: null, provenance: { blockId: "maker:opaque", noteOffset: 54 }, byteLength: 2 },
        { status: "limit-exceeded", plugin: null, provenance: { blockId: "maker:partial", noteOffset: 56 }, byteLength: 2 },
      ],
      diagnostics: [
        { code: "LIMIT_EXCEEDED", message: "limit", originalFileOffset: 56, length: 2 },
        { code: "MALFORMED_NOTE", message: "bad", originalFileOffset: null },
        { code: "UNKNOWN_NOTE", message: "unknown" },
      ],
    };
    state.thumbnail = { offset: 1, length: 1, data: Uint8Array.of(1) };
    const result = parseTiffMetadata(Uint8Array.of(0x49, 0x49, 0x2a, 0, ...new Uint8Array(124)), limits, undefined, true, undefined, undefined, (offset) => offset + 100, 1000, []);
    expect(result.dimensions).toEqual({ width: 640, height: 480 });
    expect(result.xmp).toBeNull();
    expect(result.icc).toEqual({ complete: false });
    expect(result.iptc?.fields).toHaveLength(1);
    expect(result.photoshop?.resources).toHaveLength(4);
    expect(result.makerNotes?.notes).toHaveLength(4);
    expect(result.blocks?.map(({ status }) => status)).toEqual(expect.arrayContaining(["decoded", "partial", "malformed", "opaque"]));
    expect(result.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
    expect(result.warnings.some(({ offset }) => offset === 104)).toBe(true);
  });

  it("covers BigTIFF, raw projection, valid XMP, selection skips, and invalid dimensions", () => {
    resetNested();
    const fields = [
      field(256, "ImageWidth", 0), field(257, "ImageLength", Number.NaN),
      field(700, "XMP", new TextEncoder().encode("<x:xmpmeta/>")),
      field(34675, "ICCProfile", new Uint8Array(132)), field(33723, "IPTC", Uint8Array.of(1)), field(34377, "Photoshop", Uint8Array.of(1)),
    ];
    configure(fields);
    state.raw = { container: "bigtiff", kind: "dng", rawPayloads: [{ dimensions: { width: 12, height: 13 } }] };
    const bytes = Uint8Array.of(0x49, 0x49, 0x2b, 0, ...new Uint8Array(120));
    const selection = resolveSelection({ groups: ["Dimensions"] });
    const result = parseTiffMetadata(bytes, limits, selection, false);
    expect(result.container).toBe("bigtiff");
    expect(result.fileKind).toBe("dng");
    expect(result.dimensions).toEqual({ width: 12, height: 13 });
    expect(result.exif).toBeNull();
    expect(result.xmp).toBeNull();
    expect(result.blocks?.filter(({ family }) => family !== "EXIF").every(({ status }) => status === "skipped")).toBe(true);

    state.raw = null;
    configure([field(700, "XMP", new TextEncoder().encode("<x:xmpmeta/>"))]);
    const xmp = parseTiffMetadata(Uint8Array.of(0x4d, 0x4d, 0, 0x2a, ...new Uint8Array(120)), limits, resolveSelection({ groups: ["XMP"] }));
    expect(xmp.xmp?.packets).toEqual(["<x:xmpmeta/>"]);
    expect(xmp.dimensions).toBeNull();
  });
});
