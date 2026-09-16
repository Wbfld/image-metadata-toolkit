import { describe, expect, it } from "vitest";

import { parseJpeg } from "../src/parsers/jpeg.js";
import { resolveLimits } from "../src/security/limits.js";
import { resolveSelection } from "../src/selection.js";

const encoder = new TextEncoder();
const allGroups = resolveSelection({ groups: ["Dimensions", "EXIF", "XMP", "ICC", "IPTC", "Photoshop", "JFIF", "MPF", "MakerNote"] });
const limits = resolveLimits({
  maxInputBytes: 512 * 1024,
  maxMetadataBytes: 256 * 1024,
  maxSegmentBytes: 128 * 1024,
  maxValueBytes: 128 * 1024,
  maxStringBytes: 64 * 1024,
  maxWarnings: 128,
  maxSegments: 256,
  maxIfdEntries: 128,
});

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function segment(marker: number, payload: Uint8Array): Uint8Array {
  return concat(Uint8Array.of(0xff, marker, (payload.length + 2) >>> 8, (payload.length + 2) & 0xff), payload);
}

function frame(marker = 0xc0, width = 4, height = 3, components = 1): Uint8Array {
  const payload = new Uint8Array(6 + components * 3);
  payload.set([8, (height >>> 8) & 0xff, height & 0xff, (width >>> 8) & 0xff, width & 0xff, components]);
  for (let index = 0; index < components; index += 1) payload.set([index + 1, 0x11, 0], 6 + index * 3);
  return segment(marker, payload);
}

function scan(components = 1, entropy = Uint8Array.of(1, 2, 3, 0xff, 0)): Uint8Array {
  const payload = new Uint8Array(4 + components * 2);
  payload[0] = components;
  for (let index = 0; index < components; index += 1) payload.set([index + 1, 0], 1 + index * 2);
  payload.set([0, 0x3f, 0], 1 + components * 2);
  return concat(segment(0xda, payload), entropy);
}

function jpeg(parts: readonly Uint8Array[], marker = 0xc0): Uint8Array {
  return concat(Uint8Array.of(0xff, 0xd8), ...parts, frame(marker), scan(), Uint8Array.of(0xff, 0xd9));
}

function exifClassic(options: { readonly make?: string; readonly thumbnail?: boolean } = {}): Uint8Array {
  const text = encoder.encode(`${options.make ?? "Matrix"}\0`);
  const thumbnail = options.thumbnail === true ? Uint8Array.of(0xff, 0xd8, 0xff, 0xd9) : new Uint8Array();
  const entryCount = options.thumbnail === true ? 2 : 1;
  const ifd0Offset = 8;
  const ifd0Length = 2 + entryCount * 12 + 4;
  const exifOffset = ifd0Offset + ifd0Length;
  const thumbnailOffset = exifOffset + text.length;
  const tiff = new Uint8Array(thumbnailOffset + thumbnail.length);
  tiff.set([0x49, 0x49, 0x2a, 0, ifd0Offset, 0, 0, 0]);
  const view = new DataView(tiff.buffer);
  view.setUint16(ifd0Offset, entryCount, true);
  view.setUint16(ifd0Offset + 2, 0x010f, true);
  view.setUint16(ifd0Offset + 4, 2, true);
  view.setUint32(ifd0Offset + 6, text.length, true);
  view.setUint32(ifd0Offset + 10, exifOffset, true);
  if (options.thumbnail === true) {
    const entry = ifd0Offset + 14;
    view.setUint16(entry, 0x0111, true);
    view.setUint16(entry + 2, 4, true);
    view.setUint32(entry + 4, 1, true);
    view.setUint32(entry + 8, thumbnailOffset, true);
  }
  view.setUint32(ifd0Offset + 2 + entryCount * 12, 0, true);
  tiff.set(text, exifOffset);
  if (thumbnail.length > 0) tiff.set(thumbnail, thumbnailOffset);
  return concat(encoder.encode("Exif\0\0"), tiff);
}

function exifBigTiff(): Uint8Array {
  const tiff = new Uint8Array(64);
  tiff.set([0x49, 0x49, 0x2b, 0, 8, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0]);
  const view = new DataView(tiff.buffer);
  view.setBigUint64(8, 16n, true);
  view.setBigUint64(16, 1n, true);
  view.setUint16(24, 0x0100, true);
  view.setUint16(26, 16, true);
  view.setBigUint64(28, 1n, true);
  view.setBigUint64(36, 320n, true);
  view.setBigUint64(44, 0n, true);
  return concat(encoder.encode("Exif\0\0"), tiff);
}


function iccProfile(): Uint8Array {
  const profile = new Uint8Array(132);
  const view = new DataView(profile.buffer);
  view.setUint32(0, profile.length, false);
  profile.set(encoder.encode("acsp"), 36);
  profile.set(encoder.encode("scnr"), 12);
  profile.set(encoder.encode("RGB "), 16);
  profile.set(encoder.encode("XYZ "), 20);
  return profile;
}

function iccChunk(profile: Uint8Array, sequence = 1, total = 1): Uint8Array {
  return concat(encoder.encode("ICC_PROFILE\0"), Uint8Array.of(sequence, total), profile);
}

function xmp(packet: string): Uint8Array {
  return concat(encoder.encode("http://ns.adobe.com/xap/1.0/\0"), encoder.encode(packet));
}

function extendedXmp(guid: string, data: string, fullLength = data.length, offset = 0): Uint8Array {
  const output = new Uint8Array(75 + data.length);
  output.set(encoder.encode("http://ns.adobe.com/xmp/extension/\0"), 0);
  output.set(encoder.encode(guid), 35);
  const view = new DataView(output.buffer);
  view.setUint32(67, fullLength, false);
  view.setUint32(71, offset, false);
  output.set(encoder.encode(data), 75);
  return output;
}

function photoshopResource(id: number, data: Uint8Array, name = ""): Uint8Array {
  const nameBytes = encoder.encode(name);
  const nameLength = 1 + nameBytes.length;
  const paddedNameLength = nameLength + (nameLength & 1);
  const paddedDataLength = data.length + (data.length & 1);
  const output = new Uint8Array(6 + paddedNameLength + 4 + paddedDataLength);
  output.set(encoder.encode("8BIM"), 0);
  const view = new DataView(output.buffer);
  view.setUint16(4, id, false);
  output[6] = nameBytes.length;
  output.set(nameBytes, 7);
  const dataLengthOffset = 6 + paddedNameLength;
  view.setUint32(dataLengthOffset, data.length, false);
  output.set(data, dataLengthOffset + 4);
  return output;
}

function photoshop(): Uint8Array {
  const iim = Uint8Array.of(0x1c, 2, 25, 0, 4, 0x6f, 0x6e, 0x65, 0x00);
  const xmpPacket = encoder.encode("<x:xmpmeta/>");
  return concat(encoder.encode("Photoshop 3.0\0"), photoshopResource(0x0404, iim, "iptc"), photoshopResource(0x0424, xmpPacket, "xmp"), photoshopResource(0x1234, Uint8Array.of(7), "opaque"));
}

describe("S06 JPEG metadata parser branch matrix", () => {
  it("parses complete APP0/APP1/APP2/APP13 metadata and preserves physical provenance", () => {
    const guid = "0123456789abcdef0123456789abcdef";
    const standard = `<x:xmpmeta xmpNote:HasExtendedXMP="${guid}"/>`;
    const input = jpeg([
      segment(0xe0, concat(encoder.encode("JFIF\0"), Uint8Array.of(1, 2, 0, 0, 72, 0, 72, 0, 0, 1, 1), Uint8Array.of(1, 2, 3))),
      segment(0xe1, exifClassic({ make: "First", thumbnail: true })),
      segment(0xe1, exifClassic({ make: "Second" })),
      segment(0xe1, xmp(standard)),
      segment(0xe1, extendedXmp(guid, "<rdf:RDF/>", 10, 0)),
      segment(0xe2, iccChunk(iccProfile())),
      segment(0xed, photoshop()),
    ]);
    const parsed = parseJpeg(input, limits, { selection: allGroups });
    expect(parsed.dimensions).toEqual({ width: 4, height: 3 });
    expect(parsed.exif?.fields.find((field) => field.name === "Make")?.value).toBe("First");
    expect(parsed.exif?.thumbnail).not.toBeNull();
    expect(parsed.xmp?.packets).toEqual([standard, "<x:xmpmeta/>", "<rdf:RDF/>"]);
    expect(parsed.icc?.complete).toBe(true);
    expect(parsed.iptc?.byteLength).toBe(9);
    expect(parsed.photoshop?.resources.map((resource) => resource.resourceId)).toEqual([0x0404, 0x0424, 0x1234]);
    expect(parsed.blocks?.some((block) => block.family === "EXIF" && block.status === "decoded")).toBe(true);
    expect(parsed.blocks?.some((block) => block.family === "XMP" && block.container.includes("Assembled"))).toBe(true);
    expect(parsed.warnings.some(({ code }) => code === "DUPLICATE_EXIF")).toBe(true);
    expect(parsed.exif?.fields.every((field) => field.source?.blockId !== undefined)).toBe(true);
  });

  it("exercises selection skips, malformed metadata branches, BigTIFF directories, and bounded metadata totals", () => {
    const standard = xmp("<x:xmpmeta/>");
    const noXmp = parseJpeg(jpeg([segment(0xe1, standard), segment(0xe2, iccChunk(iccProfile())), segment(0xe2, concat(encoder.encode("MPF\0"), Uint8Array.of(0))), segment(0xed, photoshop())]), limits, { selection: resolveSelection({ groups: ["Dimensions"] }) });
    expect(noXmp.blocks?.filter((block) => block.status === "skipped").map((block) => block.family)).toEqual(expect.arrayContaining(["XMP", "ICC", "MPF", "Photoshop"]));

    const malformed = jpeg([
      segment(0xe0, encoder.encode("JFIF\0")),
      segment(0xe1, exifBigTiff()),
      segment(0xe1, concat(encoder.encode("http://ns.adobe.com/xap/1.0/\0"), Uint8Array.of(0xff))),
      segment(0xe1, extendedXmp("bad-guid", "bad")),
      segment(0xe2, concat(encoder.encode("ICC_PROFILE\0"), Uint8Array.of(1, 2), new Uint8Array(132))),
      segment(0xed, concat(encoder.encode("Photoshop 3.0\0"), Uint8Array.of(0x38, 0x42, 0x49, 0x4d, 0x04))),
    ]);
    const result = parseJpeg(malformed, limits, { selection: allGroups });
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some(({ code }) => code === "INVALID_VALUE" || code === "TRUNCATED_DATA" || code === "MALFORMED_EXIF")).toBe(true);

    const constrained = parseJpeg(jpeg([segment(0xe1, xmp("x")), segment(0xe1, xmp("y")), segment(0xe2, iccChunk(iccProfile()))]), resolveLimits({ ...limits, maxMetadataBytes: 1 }), { selection: allGroups });
    expect(constrained.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
  });

  it("retains malformed and duplicate Extended XMP as explicit diagnostics", () => {
    const guid = "0123456789abcdef0123456789abcdef";
    const input = jpeg([
      segment(0xe1, xmp(`<x:xmpmeta xmpNote:HasExtendedXMP="${guid}"/>`)),
      segment(0xe1, extendedXmp(guid, "abc", 6, 3)),
      segment(0xe1, extendedXmp(guid, "abc", 6, 0)),
      segment(0xe1, extendedXmp(guid, "ov", 6, 2)),
    ]);
    const parsed = parseJpeg(input, limits, { selection: resolveSelection({ groups: ["XMP", "Dimensions"] }) });
    expect(parsed.xmp?.packets[0]).toContain("HasExtendedXMP");
    expect(parsed.warnings.some(({ code }) => code === "INVALID_VALUE")).toBe(true);
    expect(parsed.blocks?.filter((block) => block.family === "XMP").length ?? 0).toBeGreaterThanOrEqual(3);
  });

  it("checks every byte boundary of a complete multi-family JPEG", () => {
    const guid = "0123456789abcdef0123456789abcdef";
    const source = jpeg([
      segment(0xe0, concat(encoder.encode("JFIF\0"), Uint8Array.of(1, 2, 1, 0, 72, 0, 72, 0, 0, 1, 1))),
      segment(0xe1, exifClassic({ make: "Boundary", thumbnail: true })),
      segment(0xe1, xmp(`<x:xmpmeta xmpNote:HasExtendedXMP="${guid}"/>`)),
      segment(0xe1, extendedXmp(guid, "<rdf:RDF/>", 11, 0)),
      segment(0xe2, iccChunk(iccProfile())),
      segment(0xed, photoshop()),
      segment(0xfe, encoder.encode("comment")),
    ]);
    for (let offset = 0; offset < source.length; offset += 1) {
      for (const replacement of [0x00, 0x7f, 0xff]) {
        const mutated = source.slice();
        mutated[offset] = replacement;
        const result = parseJpeg(mutated, limits, { selection: allGroups });
        expect(result.fields).toBeInstanceOf(Array);
        expect(result.blocks).toBeInstanceOf(Array);
        expect(result.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
      }
    }
  });
});
