import { describe, expect, it } from "vitest";

import { deriveImageDetails, getImageDetails } from "../src/details.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";
import type { MetadataField, MetadataResult, ParsedMetadataResult } from "../src/types.js";

function field(name: string, value: unknown, ifd = "IFD0", id = `${ifd}:${name}`): MetadataField {
  return {
    id,
    ifd,
    tag: 1,
    name,
    raw: value as never,
    value: value as never,
    display: String(value),
    description: "fixture field",
    type: "LONG",
    sensitivity: "none",
    source: { blockId: `block:${ifd}`, entryOffset: 10, entryLength: 12, valueOffset: 18, valueLength: 4 },
  };
}

function base(format: ParsedMetadataResult["format"]): ParsedMetadataResult {
  return {
    format,
    mimeType: "application/octet-stream",
    dimensions: null,
    fields: [],
    exif: null,
    xmp: null,
    iptc: null,
    icc: null,
    jfif: null,
    pngText: [],
    warnings: [],
  };
}

describe("S06 image-details projection boundaries", () => {
  it("projects bounded RAW, CR3, RAF, sequence, Photoshop, MakerNote, and block relationships", () => {
    const result = {
      ...base("cr3"),
      dimensions: { width: 640, height: 480 },
      displayDimensions: { width: 480, height: 640 },
      transform: { rotation: 90, mirrored: false },
      fields: [field("FrameCount", 10000), field("LoopCount", 3)],
      blocks: [
        { id: "primary", family: "EXIF", status: "decoded", associatedImage: "primary", offset: 11 },
        { id: "thumb", family: "JPEG", status: "decoded", associatedImage: "thumb-1", role: "thumbnail", offset: 22 },
        { id: "preview", family: "JPEG", status: "decoded", associatedImage: "preview-1", role: "preview", offset: 33 },
        { id: "item-meta", family: "EXIF", status: "decoded", associatedImage: "item:1", offset: 44 },
        { id: "unknown", family: "Unknown", status: "opaque", associatedImage: "secondary", offset: 55 },
      ],
      raw: {
        kind: "raw",
        container: "cr3",
        detection: "signature",
        signature: "ftypcrx ",
        complete: true,
        rawPayloads: [{ id: "raw-1" }],
        previews: [{ id: "preview-1" }],
        thumbnails: [{ id: "thumb-1" }],
        opaquePayloads: [{ id: "opaque-1" }],
      },
      cr3: {
        container: "cr3",
        majorBrand: "crx ",
        compatibleBrands: ["crx ", "isom"],
        boxes: [{ id: "box-1" }],
        itemGraphs: [{ id: "graph-1" }],
        sequences: [{ id: "sequence-1" }],
        primarySelection: "single-item",
        ranges: [{ id: "range-1" }],
        previewRanges: [{ id: "preview-range" }],
        metadataRanges: [{ id: "metadata-range" }],
        rawRanges: [{ id: "raw-range" }],
        opaqueStructures: [{ id: "opaque-structure" }],
        complete: true,
      },
      raf: {
        container: "raf",
        version: "0100",
        camera: "Camera",
        directory: { entries: [] },
        ranges: [{ id: "range-1" }],
        previewRanges: [{ id: "preview-range" }],
        metadataRanges: [{ id: "metadata-range" }],
        rawRanges: [{ id: "raw-range" }],
        opaqueStructures: [{ id: "opaque-structure" }],
        complete: true,
      },
      heifSequences: [{ sourceOffset: 77, primaryTrackId: "track-1", primarySelection: "sole-picture-track", complete: true, tracks: [{ id: "track-1", kind: "picture", sourceOffset: 88, samples: [{}, {}, {}] }] }],
      photoshop: { resources: [{ status: "decoded" }, { status: "unknown" }], complete: true },
      makerNotes: { notes: [{ status: "detected-decoded", fields: [{}, {}], opaqueRanges: [{}] }], complete: true },
    } as unknown as ParsedMetadataResult;
    const details = deriveImageDetails(result, undefined, { ...DEFAULT_LIMITS, maxImageDetailFrames: 2 }, (offset) => offset + 1000);
    expect(details.storedDimensions[0]?.value).toEqual({ width: 640, height: 480 });
    expect(details.displayDimensions[0]?.value).toEqual({ width: 480, height: 640 });
    expect(details.primaryImageCandidates ?? []).toEqual(expect.arrayContaining([expect.objectContaining({ value: "primary" })]));
    expect(details.thumbnails).toContain("thumb");
    expect(details.previews).toContain("preview");
    expect(details.auxiliaryImages.map((item) => item.id)).toContain("secondary");
    expect(details.animation.some((item) => item.value?.frames === 2)).toBe(true);
    expect(details.formatSpecific).toMatchObject({ cr3: { boxCount: 1 }, raf: { camera: "Camera" }, sequenceCount: 1, photoshop: { unknownResourceCount: 1 }, makerNotes: { fieldCount: 2 } });
    expect((details.relationshipCandidates ?? []).every((item) => item.offset === null || item.offset >= 1000)).toBe(true);
    expect(getImageDetails(result as unknown as MetadataResult).formatSpecific).toMatchObject({ cr3: { boxCount: 1 }, raf: { camera: "Camera" } });
  });

  it("keeps parser and field candidates distinct, marks conflicts, and bounds relationships", () => {
    const result = {
      ...base("png"),
      dimensions: { width: 10, height: 20 },
      fields: [
        field("ImageWidth", 10, "IFD0", "width-1"),
        field("ImageLength", 20, "IFD0", "height-1"),
        field("ImageWidth", 30, "SubIFD:1", "width-2"),
        field("ImageLength", 40, "SubIFD:1", "height-2"),
        field("FrameCount", 4),
        field("LoopCount", 1),
      ],
      blocks: Array.from({ length: 4 }, (_, index) => ({ id: `associated-${index}`, family: "Unknown", status: "opaque", associatedImage: `secondary-${index}`, offset: index })),
    } as unknown as ParsedMetadataResult;
    const details = deriveImageDetails(result, undefined, { ...DEFAULT_LIMITS, maxImageDetailCandidates: 1, maxImageDetailRelationships: 2 });
    expect(details.storedDimensions).toHaveLength(1);
    expect(details.storedDimensions[0]?.validation).toBe("valid");
    expect(details.relationshipCandidates).toHaveLength(2);
    expect(details.animation[0]?.value).toEqual({ frames: 4, loopCount: 1 });
    expect(details.support.animation).toBe("conditional");
  });

  it.each(["jpeg", "png", "webp", "gif", "tiff", "heif", "avif", "cr3", "raf", "jxl"] as const)("reports an explicit support model for %s", (format) => {
    const result = { ...base(format), dimensions: { width: 1, height: 1 } } as ParsedMetadataResult;
    const details = deriveImageDetails(result, undefined, DEFAULT_LIMITS);
    expect(typeof details.support.storedDimensions).toBe("string");
    expect(typeof details.support.relationships).toBe("string");
    expect(details.storedDimensions[0]?.value).toEqual({ width: 1, height: 1 });
  });
});
