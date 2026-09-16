import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { parseGif } from "../src/parsers/gif.js";
import { parseJxl } from "../src/parsers/jxl.js";
import { parseSvg } from "../src/parsers/svg.js";
import { parseTiffMetadata } from "../src/parsers/tiff.js";
import { resolveSelection } from "../src/selection.js";
import { resolveLimits } from "../src/security/limits.js";

const encoder = new TextEncoder();
const limits = resolveLimits({ maxInputBytes: 4 * 1024 * 1024, maxMetadataBytes: 256 * 1024, maxSegmentBytes: 256 * 1024, maxValueBytes: 256 * 1024, maxStringBytes: 64 * 1024, maxXmpTextBytes: 64 * 1024, maxDecompressedBytes: 64 * 1024, maxDecompressedMetadataBytes: 64 * 1024, maxWarnings: 64, maxSegments: 128, maxXmpPackets: 8, maxXmpNodes: 128 });

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}

function gifSubBlocks(data: Uint8Array, blockSize = 255): Uint8Array {
  const parts: Uint8Array[] = [];
  for (let offset = 0; offset < data.length; offset += blockSize) {
    const part = data.subarray(offset, Math.min(data.length, offset + blockSize));
    parts.push(Uint8Array.of(part.length), part);
  }
  parts.push(Uint8Array.of(0));
  return concat(...parts);
}

function gifFixture(): Uint8Array {
  const header = Uint8Array.from([...encoder.encode("GIF89a"), 3, 0, 2, 0, 0x80, 0, 0]);
  const globalTable = Uint8Array.from([0, 0, 0, 255, 255, 255]);
  const comment = concat(Uint8Array.of(0x21, 0xfe), gifSubBlocks(encoder.encode("comment")));
  const loop = concat(Uint8Array.of(0x21, 0xff, 11), encoder.encode("NETSCAPE2.0"), gifSubBlocks(Uint8Array.of(1, 3, 0)));
  const xmpPayload = encoder.encode(`<x:xmpmeta xmlns:x="adobe:ns:meta/"/>\u0001`);
  const xmp = concat(Uint8Array.of(0x21, 0xff, 11), encoder.encode("XMP DataXMP"), gifSubBlocks(xmpPayload));
  const unknown = concat(Uint8Array.of(0x21, 0xf0, 2, 1, 2), gifSubBlocks(Uint8Array.of(9, 8)));
  const localTable = Uint8Array.from([10, 20, 30, 40, 50, 60]);
  const image = concat(Uint8Array.of(0x2c, 0, 0, 0, 0, 3, 0, 2, 0x80), localTable, Uint8Array.of(2), gifSubBlocks(Uint8Array.of(4, 1, 0)), Uint8Array.of(0x3b));
  return concat(header, globalTable, comment, loop, xmp, unknown, image);
}

function jxlBox(type: string, payload: Uint8Array, sizeMode: "normal" | "zero" | "extended" = "normal"): Uint8Array {
  const typeBytes = encoder.encode(type);
  if (sizeMode === "zero") return concat(Uint8Array.of(0, 0, 0, 0), typeBytes, payload);
  if (sizeMode === "extended") {
    const size = 16 + payload.length;
    const result = new Uint8Array(size);
    const view = new DataView(result.buffer);
    view.setUint32(0, 1, false); result.set(typeBytes, 4); view.setUint32(8, 0, false); view.setUint32(12, size, false); result.set(payload, 16);
    return result;
  }
  const size = 8 + payload.length;
  const result = new Uint8Array(size);
  new DataView(result.buffer).setUint32(0, size, false); result.set(typeBytes, 4); result.set(payload, 8);
  return result;
}

function jxlContainer(boxes: readonly Uint8Array[]): Uint8Array {
  return concat(Uint8Array.of(0, 0, 0, 0x0c, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a), ...boxes);
}

function svg(value: string): Uint8Array { return encoder.encode(value); }

describe("S06 format and decompression boundary matrix", () => {
  it("exercises GIF tables, frames, comments, applications, XMP selection, loops, and malformed sub-blocks", () => {
    const fixture = gifFixture();
    const selected = parseGif(fixture, limits, resolveSelection({ groups: ["Dimensions", "EXIF", "XMP"] }));
    expect(selected.dimensions).toEqual({ width: 3, height: 2 });
    expect(selected.fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "Comment", value: "comment" }),
      expect.objectContaining({ name: "LoopCount", value: 3 }),
    ]));
    const frameOnly = parseGif(concat(fixture.subarray(0, 19), Uint8Array.of(0x2c, 0, 0, 0, 0, 3, 0, 2, 0, 0, 2, 3, 4, 1, 0, 0, 0x3b)), limits, resolveSelection({ groups: ["Dimensions"] }));
    expect(frameOnly.fields).toContainEqual(expect.objectContaining({ name: "FrameCount", value: 1 }));
    expect(selected.xmp?.packets).toEqual(["<x:xmpmeta xmlns:x=\"adobe:ns:meta/\"/>"]);
    expect(selected.blocks?.some((block) => block.status === "decoded" && block.family === "XMP")).toBe(true);
    const skipped = parseGif(fixture, limits, resolveSelection({ groups: ["Dimensions"] }));
    expect(skipped.fields.some((field) => field.name === "Comment")).toBe(false);
    expect(skipped.blocks?.some((block) => block.status === "skipped")).toBe(true);
    expect(parseGif(Uint8Array.of(1, 2), limits).warnings[0]?.code).toBe("MALFORMED_GIF");
    const noGlobalTable = fixture.slice(); noGlobalTable[10] = 0;
    expect(parseGif(noGlobalTable, limits).dimensions).toEqual({ width: 3, height: 2 });
    expect(parseGif(fixture.slice(0, 16), limits).warnings.length).toBeGreaterThan(0);
    const badIdentifier = fixture.slice(); const xmpIndex = fixture.indexOf(0xff, 0); expect(xmpIndex).toBeGreaterThanOrEqual(0);
    if (xmpIndex >= 0) badIdentifier[xmpIndex + 2] = 10;
    expect(parseGif(badIdentifier, limits).warnings.some((warning) => warning.code === "MALFORMED_GIF")).toBe(true);
    const badSubBlock = fixture.slice(0, -2);
    expect(parseGif(badSubBlock, limits).warnings.some((warning) => warning.code === "MALFORMED_GIF")).toBe(true);
    const limited = parseGif(fixture, resolveLimits({ maxSegments: 1, maxWarnings: 4 }), resolveSelection({ groups: ["EXIF", "XMP"] }));
    expect(limited.warnings.some((warning) => warning.code === "MALFORMED_GIF")).toBe(true);
    const controller = new AbortController(); controller.abort();
    expect(() => parseGif(fixture, limits, undefined, controller.signal)).toThrow(/abort/i);
  });

  it("covers JPEG XL raw/container codestream, complete/partial boxes, metadata, and Brotli decoder outcomes", async () => {
    const tiff = new Uint8Array(await readFile(new URL("./fixtures/tiff-metadata.tif", import.meta.url)));
    const xmp = encoder.encode(`<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"/>`);
    const complete = jxlContainer([
      jxlBox("jxlc", Uint8Array.of(0xff, 0x0a, 0)),
      jxlBox("Exif", tiff),
      jxlBox("xml ", xmp),
      jxlBox("free", Uint8Array.of(1, 2), "extended"),
    ]);
    const parsed = await parseJxl(complete, limits, resolveSelection({ groups: ["Dimensions", "EXIF", "XMP"] }));
    expect(parsed.format).toBe("jxl");
    expect(parsed.xmp?.packets).toEqual([new TextDecoder().decode(xmp)]);
    expect(parsed.blocks?.some((block) => block.family === "EXIF" && block.status === "decoded")).toBe(true);
    expect(parsed.blocks?.every((block) => block.offset !== null)).toBe(true);
    const skipped = await parseJxl(complete, limits, resolveSelection({ groups: ["Dimensions"] }));
    expect(skipped.blocks?.some((block) => block.status === "skipped")).toBe(true);
    const customGood = await parseJxl(jxlContainer([jxlBox("brob", concat(encoder.encode("xml "), Uint8Array.of(1, 2, 3)))]), limits, resolveSelection({ groups: ["XMP"] }), undefined, undefined, () => Promise.resolve(xmp));
    expect(customGood.xmp?.packets).toEqual([new TextDecoder().decode(xmp)]);
    const customTyped = await parseJxl(jxlContainer([jxlBox("brob", concat(encoder.encode("xml "), Uint8Array.of(1)))]), limits, resolveSelection({ groups: ["XMP"] }), undefined, undefined, () => Promise.resolve(new Uint8Array([0xff])));
    expect(customTyped.warnings.some((warning) => warning.code === "INVALID_VALUE")).toBe(true);
    const customDataView = await parseJxl(jxlContainer([jxlBox("brob", concat(encoder.encode("xml "), Uint8Array.of(1)))]), limits, resolveSelection({ groups: ["XMP"] }), undefined, undefined, () => Promise.resolve(new DataView(new ArrayBuffer(2)) as never));
    expect(customDataView.warnings.some((warning) => warning.code === "INVALID_VALUE")).toBe(true);
    const customTooLarge = await parseJxl(jxlContainer([jxlBox("brob", concat(encoder.encode("xml "), Uint8Array.of(1)))]), resolveLimits({ maxDecompressedBytes: 2, maxDecompressedMetadataBytes: 2, maxWarnings: 8 }), resolveSelection({ groups: ["XMP"] }), undefined, undefined, () => Promise.resolve(new Uint8Array(100)));
    expect(customTooLarge.warnings.some((warning) => warning.code === "LIMIT_EXCEEDED")).toBe(true);
    const customThrow = await parseJxl(jxlContainer([jxlBox("brob", concat(encoder.encode("xml "), Uint8Array.of(1)))]), limits, resolveSelection({ groups: ["XMP"] }), undefined, undefined, () => Promise.reject(new Error("decoder")));
    expect(customThrow.warnings.some((warning) => warning.code === "INVALID_VALUE")).toBe(true);
    const raw = await parseJxl(Uint8Array.of(0xff, 0x0a), limits, resolveSelection({ groups: ["EXIF"] }));
    expect(raw.warnings.some((warning) => warning.code === "UNSUPPORTED_STRUCTURE")).toBe(true);
    const malformed = await parseJxl(Uint8Array.of(1, 2, 3), limits);
    expect(malformed.warnings[0]?.code).toBe("MALFORMED_JXL");
    const badExtended = jxlContainer([Uint8Array.of(0, 0, 0, 1, 0x66, 0x72, 0x65, 0x65, 0)]);
    expect((await parseJxl(badExtended, limits)).warnings.length).toBeGreaterThan(0);
    const badComplete = jxlContainer([jxlBox("jxlc", Uint8Array.of(0xff, 0x0a)), jxlBox("jxlc", Uint8Array.of(0xff, 0x0a))]);
    expect((await parseJxl(badComplete, limits, resolveSelection({ groups: ["Dimensions"] }))).warnings.some((warning) => warning.code === "MALFORMED_JXL")).toBe(true);
    const abort = new AbortController(); abort.abort();
    await expect(parseJxl(complete, limits, undefined, abort.signal)).rejects.toThrow(/abort/i);
  });

  it("covers SVG namespace validation, RDF extraction, opaque metadata, limits, UTF-8, and aborts", () => {
    const valid = svg(`<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><metadata><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description/></rdf:RDF></metadata><g><!-- comment --><![CDATA[text]]><?pi ok?></g></svg>`);
    const parsed = parseSvg(valid, limits, resolveSelection({ groups: ["XMP"] }));
    expect(parsed.xmp?.packets).toHaveLength(1);
    expect(parsed.blocks?.some((block) => block.status === "decoded")).toBe(true);
    const skipped = parseSvg(valid, limits, resolveSelection({ groups: ["Dimensions"] }));
    expect(skipped.xmp).toBeNull();
    expect(skipped.blocks?.some((block) => block.status === "skipped")).toBe(true);
    const opaque = parseSvg(svg(`<svg xmlns="http://www.w3.org/2000/svg"><metadata><custom>opaque</custom></metadata></svg>`), limits, resolveSelection({ groups: ["XMP"] }));
    expect(opaque.blocks?.some((block) => block.status === "opaque")).toBe(true);
    const cases = [
      Uint8Array.of(0xff),
      svg("<svg>"),
      svg("<html xmlns=\"http://www.w3.org/2000/svg\"/>") ,
      svg("<svg xmlns=\"http://www.w3.org/2000/svg\"><metadata><!--</svg>"),
      svg("<svg xmlns=\"http://www.w3.org/2000/svg\"><metadata><![CDATA[</svg>"),
      svg("<!DOCTYPE svg><svg xmlns=\"http://www.w3.org/2000/svg\"/>") ,
      svg("<svg xmlns=\"http://www.w3.org/2000/svg\"><a></svg>"),
      svg("<svg xmlns=\"http://www.w3.org/2000/svg\"/><svg xmlns=\"http://www.w3.org/2000/svg\"/>") ,
    ];
    for (const value of cases) expect(parseSvg(value, limits).warnings[0]?.code).toBe("INVALID_VALUE");
    const bounded = parseSvg(svg(`<svg xmlns="http://www.w3.org/2000/svg"><metadata><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description/></rdf:RDF></metadata></svg>`), resolveLimits({ maxXmpNodes: 1, maxWarnings: 2 }), resolveSelection({ groups: ["XMP"] }));
    expect(bounded.warnings[0]?.code).toBe("INVALID_VALUE");
    const twoPackets = svg(`<svg xmlns="http://www.w3.org/2000/svg"><metadata><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description/></rdf:RDF><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description/></rdf:RDF></metadata></svg>`);
    const packetLimited = parseSvg(twoPackets, resolveLimits({ maxXmpPackets: 1, maxWarnings: 4 }), resolveSelection({ groups: ["XMP"] }));
    expect(packetLimited.blocks?.some((block) => block.status === "partial")).toBe(true);
    const metadataLimited = parseSvg(valid, resolveLimits({ maxMetadataBytes: 4, maxWarnings: 4 }), resolveSelection({ groups: ["XMP"] }));
    expect(metadataLimited.warnings.some((warning) => warning.code === "LIMIT_EXCEEDED")).toBe(true);
    const abort = new AbortController(); abort.abort();
    expect(() => parseSvg(valid, limits, undefined, abort.signal)).toThrow(/abort/i);
  });

  it("exercises TIFF parser selection, offset mapping, and malformed/limit outcomes", async () => {
    const fixture = new Uint8Array(await readFile(new URL("./fixtures/tiff-metadata.tif", import.meta.url)));
    const all = parseTiffMetadata(fixture, limits, resolveSelection({ groups: ["EXIF", "XMP", "IPTC", "ICC", "Photoshop", "MakerNote", "Dimensions"] }), true, undefined, undefined, (offset) => offset + 10, fixture.length + 10);
    expect(all.format).toBe("tiff");
    expect(all.blocks?.length).toBeGreaterThan(0);
    expect(parseTiffMetadata(fixture, limits, resolveSelection({ groups: ["Dimensions"] }), false).dimensions).not.toBeNull();
    expect(parseTiffMetadata(fixture.slice(0, 8), limits).warnings.length).toBeGreaterThan(0);
    expect(() => parseTiffMetadata(fixture, resolveLimits({ maxInputBytes: 1 }))).not.toThrow();
    const abort = new AbortController(); abort.abort();
    expect(() => parseTiffMetadata(fixture, limits, undefined, true, abort.signal)).toThrow(/abort/i);
  });
});
