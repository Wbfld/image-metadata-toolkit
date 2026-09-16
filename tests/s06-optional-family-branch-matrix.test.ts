import { describe, expect, it } from "vitest";

import { parseGif } from "../src/parsers/gif.js";
import { parseTiffMetadata } from "../src/parsers/tiff.js";
import { parseWebp, parseWebpDimensions } from "../src/parsers/webp.js";
import { parsePhotoshopResources } from "../src/metadata/photoshop.js";
import { parseJfif } from "../src/metadata/jfif.js";
import { resolveLimits } from "../src/security/limits.js";
import { resolveSelection } from "../src/selection.js";

const encoder = new TextEncoder();
const allSelection = resolveSelection({ groups: ["Dimensions", "EXIF", "XMP", "IPTC", "ICC", "Photoshop", "MakerNote", "JFIF"] });
const limits = resolveLimits({
  maxInputBytes: 128 * 1024,
  maxMetadataBytes: 64 * 1024,
  maxSegmentBytes: 32 * 1024,
  maxValueBytes: 32 * 1024,
  maxStringBytes: 16 * 1024,
  maxWarnings: 128,
  maxSegments: 128,
  maxIfdEntries: 128,
  maxIfdDepth: 8,
});

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function webpChunk(type: string, payload: Uint8Array): Uint8Array {
  const output = new Uint8Array(8 + payload.length + (payload.length & 1));
  output.set(encoder.encode(type), 0);
  new DataView(output.buffer).setUint32(4, payload.length, true);
  output.set(payload, 8);
  return output;
}

function webpFile(chunks: readonly Uint8Array[], declaredLength?: number): Uint8Array {
  const body = concat(encoder.encode("WEBP"), ...chunks);
  const output = new Uint8Array(8 + body.length);
  output.set(encoder.encode("RIFF"), 0);
  new DataView(output.buffer).setUint32(4, declaredLength ?? body.length, true);
  output.set(body, 8);
  return output;
}

function minimalIcc(): Uint8Array {
  const output = new Uint8Array(132);
  const view = new DataView(output.buffer);
  view.setUint32(0, output.length, false);
  output.set(encoder.encode("scnr"), 12);
  output.set(encoder.encode("RGB "), 16);
  output.set(encoder.encode("XYZ "), 20);
  output.set(encoder.encode("acsp"), 36);
  return output;
}

function photoshopResource(id: number, payload: Uint8Array): Uint8Array {
  const output = new Uint8Array(12 + payload.length + (payload.length & 1));
  output.set(encoder.encode("8BIM"), 0);
  const view = new DataView(output.buffer);
  view.setUint16(4, id, false);
  output[6] = 0;
  view.setUint32(8, payload.length, false);
  output.set(payload, 12);
  return output;
}

function tiffWithOptionalMetadata(
  invalidXmp = false,
  iptc = Uint8Array.of(0x1c, 2, 5, 0, 1, 65),
  photoshop = photoshopResource(0x0404, iptc),
): Uint8Array {
    const xmp = invalidXmp ? Uint8Array.of(0xff, 0xfe, 0xff, 0xfe, 0xff) : encoder.encode("<x:xmpmeta/>");
  const icc = minimalIcc();
  const xmpOffset = 256;
  const iptcOffset = xmpOffset + xmp.length;
  const iccOffset = iptcOffset + iptc.length;
  const photoshopOffset = iccOffset + icc.length;
  const output = new Uint8Array(photoshopOffset + photoshop.length + 32);
  output.set([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0], 0);
  const view = new DataView(output.buffer);
  const entries: readonly (readonly [number, number, number, number, number])[] = [
    [256, 4, 1, 640, 0],
    [257, 4, 1, 480, 0],
    [700, 7, xmp.length, xmpOffset, 0],
    [33723, 7, iptc.length, iptcOffset, 0],
    [34675, 7, icc.length, iccOffset, 0],
    [34377, 7, photoshop.length, photoshopOffset, 0],
  ];
  view.setUint16(8, entries.length, true);
  for (const [index, [tag, type, count, value]] of entries.entries()) {
    const offset = 10 + index * 12;
    view.setUint16(offset, tag, true);
    view.setUint16(offset + 2, type, true);
    view.setUint32(offset + 4, count, true);
    view.setUint32(offset + 8, value, true);
  }
  view.setUint32(10 + entries.length * 12, 0, true);
  output.set(xmp, xmpOffset);
  output.set(iptc, iptcOffset);
  output.set(icc, iccOffset);
  output.set(photoshop, photoshopOffset);
  return output;
}

function gifSubBlocks(payload: Uint8Array, terminate = true): Uint8Array {
  return concat(Uint8Array.of(payload.length), payload, terminate ? Uint8Array.of(0) : new Uint8Array());
}

function gifFile(options: { readonly globalTable?: boolean; readonly localTable?: boolean; readonly xmp?: Uint8Array; readonly comment?: Uint8Array; readonly unknownExtension?: boolean; readonly malformed?: boolean } = {}): Uint8Array {
  const header = concat(encoder.encode("GIF89a"), Uint8Array.of(2, 0, 2, 0, options.globalTable === true ? 0x80 : 0, 0, 0));
  const globalTable = options.globalTable === true ? new Uint8Array(6) : new Uint8Array();
  const graphicControl = Uint8Array.of(0x21, 0xf9, 4, 0, 0, 0, 0, 0);
  const imageDescriptor = Uint8Array.of(0x2c, 0, 0, 0, 0, 2, 0, 2, 0, options.localTable === true ? 0x80 : 0);
  const localTable = options.localTable === true ? new Uint8Array(6) : new Uint8Array();
  const imageData = options.malformed === true ? Uint8Array.of(2, 0xff, 0) : Uint8Array.of(2, 1, 0, 0);
  const comment = options.comment === undefined ? new Uint8Array() : concat(Uint8Array.of(0x21, 0xfe), gifSubBlocks(options.comment));
  const xmp = options.xmp === undefined ? new Uint8Array() : concat(Uint8Array.of(0x21, 0xff, 11), encoder.encode("XMP DataXMP"), gifSubBlocks(options.xmp));
  const loop = concat(Uint8Array.of(0x21, 0xff, 11), encoder.encode("NETSCAPE2.0"), Uint8Array.of(3, 1, 2, 0, 0));
  const unknown = options.unknownExtension === true ? Uint8Array.of(0x21, 0x01, 1, 0, 0) : new Uint8Array();
  return concat(header, globalTable, graphicControl, imageDescriptor, localTable, imageData, comment, xmp, loop, unknown, Uint8Array.of(0x3b));
}

describe("S06 optional metadata-family branch matrix", () => {
  it("materializes valid and malformed TIFF optional metadata through every selected family", () => {
    const valid = parseTiffMetadata(tiffWithOptionalMetadata(), limits, allSelection, false, undefined, undefined, (offset) => offset + 10);
    expect(valid.format).toBe("tiff");
    expect(valid.xmp?.packets).toEqual(["<x:xmpmeta/>"]);
    expect(valid.iptc?.fields?.length ?? 0).toBeGreaterThan(0);
    expect(valid.icc?.complete).toBe(true);
    expect(valid.photoshop?.resources).toHaveLength(1);
    expect(valid.blocks?.some(({ family, status }) => family === "ICC" && status === "decoded")).toBe(true);
    expect(valid.blocks?.some(({ family, status }) => family === "Photoshop" && status === "decoded")).toBe(true);

    const malformed = parseTiffMetadata(tiffWithOptionalMetadata(true), limits, resolveSelection({ groups: ["XMP", "IPTC", "ICC", "Photoshop"] }), false);
    expect(malformed.xmp).toBeNull();
    expect(malformed.warnings.some(({ code }) => code === "INVALID_VALUE")).toBe(true);

    for (const selection of [resolveSelection({ groups: ["XMP"] }), resolveSelection({ groups: ["IPTC"] }), resolveSelection({ groups: ["ICC"] }), resolveSelection({ groups: ["Photoshop"] }), resolveSelection({ groups: [] })]) {
      const result = parseTiffMetadata(tiffWithOptionalMetadata(), limits, selection, false);
      expect(result.fields).toBeInstanceOf(Array);
      expect(result.blocks).toBeInstanceOf(Array);
    }
    const iptcWithCharset = Uint8Array.of(0x1c, 1, 90, 0, 3, 0x1b, 0x25, 0x47, 0x1c, 2, 5, 0, 1, 65);
    const charset = parseTiffMetadata(tiffWithOptionalMetadata(false, iptcWithCharset), limits, resolveSelection({ groups: ["EXIF", "IPTC"] }), false);
    expect(charset.iptc?.characterSet).toBe("utf-8");
    expect(parseTiffMetadata(tiffWithOptionalMetadata(false, iptcWithCharset), resolveLimits({ ...limits, maxIfdEntries: 1 }), resolveSelection({ groups: ["IPTC"] }), false).warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
    for (const groups of [["EXIF"], ["EXIF", "XMP"], ["EXIF", "IPTC"], ["EXIF", "ICC"], ["EXIF", "Photoshop"], ["EXIF", "MakerNote"]] as const) {
      const result = parseTiffMetadata(tiffWithOptionalMetadata(), limits, resolveSelection({ groups }), false);
      expect(result.fields).toBeInstanceOf(Array);
      expect(result.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
    }
    expect(parsePhotoshopResources(photoshopResource(0x0404, Uint8Array.of(1)), limits, { container: "tiff", blockId: "test", sourceOffset: 0, sourceLength: 14 })?.complete).toBe(true);
  });

  it("covers WebP dimensions, chunk alignment, metadata selection, and bounded decoder outcomes", () => {
    const vp8x = Uint8Array.of(0, 0, 0, 0, 2, 0, 0, 1, 0, 0);
    const vp8l = Uint8Array.of(0x2f, 1, 0x40, 0, 0);
    const vp8 = Uint8Array.of(0x10, 0, 0, 0x9d, 1, 0x2a, 3, 0, 2, 0);
    const metadata = webpFile([
      webpChunk("VP8X", vp8x),
      webpChunk("EXIF", Uint8Array.of(0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 0, 0)),
      webpChunk("EXIF", Uint8Array.of(0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 0, 0)),
      webpChunk("XMP ", encoder.encode("<rdf:RDF/>")),
      webpChunk("XMP ", Uint8Array.of(0xff)),
      webpChunk("ICCP", minimalIcc()),
      webpChunk("ICCP", minimalIcc()),
      webpChunk("JUNK", Uint8Array.of(1)),
    ]);
    expect(parseWebpDimensions(webpFile([webpChunk("VP8X", vp8x)]))).toEqual({ width: 3, height: 2 });
    expect(parseWebpDimensions(webpFile([webpChunk("VP8L", vp8l)]))).toEqual({ width: 2, height: 2 });
    expect(parseWebpDimensions(webpFile([webpChunk("VP8 ", vp8)]))).toEqual({ width: 3, height: 2 });
    const reserved = vp8l.slice(); reserved[4] = 0xe0; expect(parseWebpDimensions(webpFile([webpChunk("VP8L", reserved)]))).toBeNull();
    const zeroVp8 = vp8.slice(); zeroVp8[6] = 0; zeroVp8[7] = 0; expect(parseWebpDimensions(webpFile([webpChunk("VP8 ", zeroVp8)]))).toBeNull();
    expect(parseWebp(metadata, limits, allSelection).warnings.some(({ code }) => code === "DUPLICATE_EXIF")).toBe(true);
    expect(parseWebp(metadata, limits, allSelection).warnings.some(({ code }) => code === "INVALID_VALUE")).toBe(true);
    expect(parseWebp(metadata, resolveLimits({ ...limits, maxSegments: 1 }), allSelection).warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
    expect(parseWebp(metadata, limits, resolveSelection({ groups: [] })).blocks?.some(({ status }) => status === "skipped")).toBe(true);
    expect(parseWebp(metadata.slice(0, -1), limits, allSelection).warnings.length).toBeGreaterThan(0);
    expect(parseWebp(webpFile([webpChunk("JUNK", Uint8Array.of(1))]), limits, resolveSelection({ groups: ["Dimensions"] })).dimensions).toBeNull();

    const trailingHeader = webpFile([webpChunk("JUNK", Uint8Array.of(1))]);
    const withTrailingHeader = new Uint8Array([...trailingHeader, 0, 0, 0, 0]);
    new DataView(withTrailingHeader.buffer).setUint32(4, new DataView(trailingHeader.buffer).getUint32(4, true) + 4, true);
    expect(parseWebp(withTrailingHeader, limits, allSelection).warnings.some(({ code }) => code === "TRUNCATED_DATA")).toBe(true);
    expect(parseWebp(webpFile([webpChunk("XMP ", encoder.encode("too-long"))]), resolveLimits({ ...limits, maxStringBytes: 1 }), allSelection).warnings.some(({ code }) => code === "INVALID_VALUE")).toBe(true);
  });

  it("covers GIF global/local tables, comments, XMP, loops, unknown extensions, and malformed sub-blocks", () => {
    const complete = parseGif(gifFile({ globalTable: true, localTable: true, xmp: encoder.encode("<rdf:RDF/>"), comment: encoder.encode("comment"), unknownExtension: true }), limits, resolveSelection({ groups: ["Dimensions", "EXIF", "XMP"] }));
    expect(complete.dimensions).toEqual({ width: 2, height: 2 });
    expect(complete.fields.some(({ name }) => name === "Comment")).toBe(true);
    expect(complete.fields.some(({ name }) => name === "LoopCount")).toBe(true);
    expect(complete.xmp?.packets).toEqual(["<rdf:RDF/>"]);
    expect(complete.fields.some(({ name }) => name === "FrameCount")).toBe(true);

    const invalidXmp = parseGif(gifFile({ xmp: Uint8Array.of(0xff) }), limits, resolveSelection({ groups: ["XMP"] }));
    expect(invalidXmp.warnings.some(({ code }) => code === "INVALID_VALUE")).toBe(true);
    expect(parseGif(gifFile({ comment: encoder.encode("not retained") }), limits, resolveSelection({ groups: [] })).blocks?.every(({ status }) => status === "skipped")).toBe(true);
    expect(parseGif(gifFile({ malformed: true }), limits, allSelection).warnings.some(({ code }) => code === "MALFORMED_GIF")).toBe(true);
    const noTerminator = gifFile({ comment: Uint8Array.of(1) }).slice(0, -2);
    expect(parseGif(noTerminator, limits, allSelection).warnings.some(({ code }) => code === "MALFORMED_GIF")).toBe(true);
    expect(parseGif(gifFile({ malformed: true }), resolveLimits({ ...limits, maxSegments: 1 }), allSelection).warnings.length).toBeGreaterThan(0);
    for (let length = 0; length < 20; length += 1) expect(parseGif(gifFile({}).slice(0, length), limits, allSelection).format).toBe("gif");
    const truncatedGlobal = gifFile({ globalTable: true }).slice(0, 13 + 5);
    expect(parseGif(truncatedGlobal, limits, resolveSelection({ groups: [] })).warnings[0]?.code).toBe("MALFORMED_GIF");
    const missingLzw = concat(encoder.encode("GIF89a"), Uint8Array.of(2, 0, 2, 0, 0, 0, 0), Uint8Array.of(0x2c, 0, 0, 0, 0, 2, 0, 2, 0));
    expect(parseGif(missingLzw, limits, allSelection).warnings.some(({ code }) => code === "MALFORMED_GIF")).toBe(true);
    const missingApplicationHeader = concat(encoder.encode("GIF89a"), Uint8Array.of(2, 0, 2, 0, 0, 0, 0), Uint8Array.of(0x21, 0xff));
    expect(parseGif(missingApplicationHeader, limits, allSelection).warnings.some(({ code }) => code === "MALFORMED_GIF")).toBe(true);
    const missingExtensionSize = concat(encoder.encode("GIF89a"), Uint8Array.of(2, 0, 2, 0, 0, 0, 0), Uint8Array.of(0x21, 0x01));
    expect(parseGif(missingExtensionSize, limits, allSelection).warnings.some(({ code }) => code === "MALFORMED_GIF")).toBe(true);
  });

  it("keeps standalone JFIF validation independent and bounded", () => {
    const base = Uint8Array.from([...encoder.encode("JFIF\0"), 1, 2, 0, 0, 72, 0, 72, 0, 0]);
    expect(parseJfif(base)).toMatchObject({ densityUnits: "none" });
    const invalidThumbnail = base.slice(); invalidThumbnail[12] = 1; invalidThumbnail[13] = 1;
    expect(parseJfif(invalidThumbnail)).toBeNull();
    const oneSidedThumbnail = base.slice(); oneSidedThumbnail[12] = 1;
    expect(parseJfif(oneSidedThumbnail)).toBeNull();
    expect(parseJfif(base.slice(0, 13))).toBeNull();
  });

  it("exercises every byte boundary of compact optional-family fixtures", () => {
    const cases = [
      { bytes: tiffWithOptionalMetadata(), parse: (bytes: Uint8Array) => parseTiffMetadata(bytes, limits, allSelection, false) },
      { bytes: webpFile([webpChunk("VP8X", Uint8Array.of(0, 0, 0, 0, 2, 0, 0, 1, 0, 0)), webpChunk("EXIF", Uint8Array.of(0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 0, 0))]), parse: (bytes: Uint8Array) => parseWebp(bytes, limits, allSelection) },
      { bytes: gifFile({ globalTable: true, localTable: true, xmp: encoder.encode("<rdf:RDF/>") }), parse: (bytes: Uint8Array) => parseGif(bytes, limits, allSelection) },
    ] as const;
    for (const { bytes, parse } of cases) {
      for (let offset = 0; offset < bytes.length; offset += 1) {
        for (const replacement of [0x00, 0x7f, 0xff]) {
          const mutated = bytes.slice();
          mutated[offset] = replacement;
          const result = parse(mutated);
          expect(result.fields).toBeInstanceOf(Array);
          expect(result.blocks ?? []).toBeInstanceOf(Array);
          expect(result.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
        }
      }
    }
  });
});
