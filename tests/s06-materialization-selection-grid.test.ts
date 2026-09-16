import { describe, expect, it } from "vitest";

import { materializeJpegHeader, materializeMetadata } from "../src/input.js";
import { resolveSelection } from "../src/selection.js";
import { resolveLimits } from "../src/security/limits.js";

const encoder = new TextEncoder();

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}

function blobOf(bytes: Uint8Array): Blob {
  return new Blob([new Uint8Array(bytes).buffer]);
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length + 12);
  new DataView(result.buffer).setUint32(0, data.length, false);
  result.set(encoder.encode(type), 4);
  result.set(data, 8);
  return result;
}

function webpChunk(type: string, data: Uint8Array): Uint8Array {
  const result = new Uint8Array(8 + data.length + (data.length & 1));
  result.set(encoder.encode(type), 0);
  new DataView(result.buffer).setUint32(4, data.length, true);
  result.set(data, 8);
  return result;
}

function webpFile(chunks: readonly Uint8Array[], declaredSize?: number): Uint8Array {
  const body = concat(encoder.encode("WEBP"), ...chunks);
  const result = new Uint8Array(8 + body.length);
  result.set(encoder.encode("RIFF"), 0);
  new DataView(result.buffer).setUint32(4, declaredSize ?? body.length, true);
  result.set(body, 8);
  return result;
}

const pngSignature = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const pngHeader = Uint8Array.from([0, 0, 0, 1, 8, 6, 0, 0, 0, 0, 0, 0, 0]);
const allGroups = resolveSelection({ groups: ["Dimensions", "EXIF", "XMP", "ICC", "PNGText"] });

describe("S06 metadata materialization selection and limit matrix", () => {
  it("retains selected PNG chunk families and fails closed at malformed and budget boundaries", async () => {
    const chunks = [
      pngChunk("IHDR", pngHeader),
      pngChunk("acTL", Uint8Array.of(0, 0, 0, 2, 0, 0, 0, 1)),
      pngChunk("fcTL", new Uint8Array(26)),
      pngChunk("eXIf", Uint8Array.of(0x49, 0x49, 0x2a, 0, 8, 0, 0, 0)),
      pngChunk("iCCP", new Uint8Array(12)),
      pngChunk("tEXt", concat(encoder.encode("Title\0"), encoder.encode("hello"))),
      pngChunk("uNkN", Uint8Array.of(1, 2, 3)),
      pngChunk("IDAT", Uint8Array.of(1, 2, 3)),
      pngChunk("IEND", new Uint8Array()),
    ];
    const source = concat(pngSignature, ...chunks, Uint8Array.of(9, 8));
    const selected = await materializeMetadata(blobOf(source), resolveLimits({ maxMetadataBytes: 4096, maxSegmentBytes: 4096 }), allGroups);
    expect(selected.partial).toBe(true);
    expect(selected.warnings.some(({ code }) => code === "MALFORMED_PNG")).toBe(true);
    expect(selected.bytes.length).toBeLessThan(source.length);

    const dimensionsOnly = await materializeMetadata(blobOf(source), resolveLimits({ maxMetadataBytes: 4096, maxSegmentBytes: 4096 }), resolveSelection({ groups: ["Dimensions"] }));
    expect(dimensionsOnly.partial).toBe(true);
    expect(dimensionsOnly.bytes.length).toBeLessThan(selected.bytes.length);

    const segmentLimited = await materializeMetadata(blobOf(source), resolveLimits({ maxSegmentBytes: 1, maxMetadataBytes: 4096 }), allGroups);
    expect(segmentLimited.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
    const metadataLimited = await materializeMetadata(blobOf(source), resolveLimits({ maxSegmentBytes: 4096, maxMetadataBytes: 10 }), allGroups);
    expect(metadataLimited.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
    const noMetadata = await materializeMetadata(blobOf(source), resolveLimits({ maxMetadataBytes: 4096, maxSegmentBytes: 4096 }), resolveSelection({ groups: [] }));
    expect(noMetadata.partial).toBe(true);
    expect(noMetadata.bytes.length).toBeLessThan(dimensionsOnly.bytes.length);
    expect((await materializeMetadata(blobOf(concat(pngSignature, pngChunk("IHDR", pngHeader))), resolveLimits(), allGroups)).warnings.some(({ code }) => code === "TRUNCATED_DATA")).toBe(true);
    expect((await materializeMetadata(blobOf(concat(pngSignature, pngChunk("IEND", new Uint8Array()), Uint8Array.of(1))), resolveLimits(), allGroups)).warnings.some(({ code }) => code === "MALFORMED_PNG")).toBe(true);

    const malformedLength = concat(pngSignature, Uint8Array.of(0xff, 0xff, 0xff, 0xff), encoder.encode("tEXt"), new Uint8Array(4));
    const fallback = await materializeMetadata(blobOf(malformedLength), resolveLimits(), allGroups);
    expect(fallback.partial).toBe(false);
    expect(fallback.bytes).toEqual(malformedLength);
    const nonPng = Uint8Array.from([1, 2, 3, 4]);
    expect((await materializeMetadata(blobOf(nonPng), resolveLimits(), allGroups)).partial).toBe(false);
  });

  it("retains selected WebP image and metadata chunks across image, padding, RIFF, and limit paths", async () => {
    const chunks = [
      webpChunk("VP8X", new Uint8Array(10)),
      webpChunk("VP8L", Uint8Array.of(0x2f, 0, 0, 0, 0)),
      webpChunk("VP8 ", new Uint8Array(10)),
      webpChunk("ANIM", Uint8Array.of(1, 2)),
      webpChunk("ANMF", Uint8Array.of(3, 4)),
      webpChunk("EXIF", Uint8Array.of(0x49, 0x49, 0x2a, 0, 8, 0, 0, 0)),
      webpChunk("XMP ", encoder.encode("<rdf:RDF/>")),
      webpChunk("ICCP", new Uint8Array(12)),
      webpChunk("ZZZZ", Uint8Array.of(1, 2, 3)),
    ];
    const source = webpFile(chunks);
    const selected = await materializeMetadata(blobOf(source), resolveLimits({ maxMetadataBytes: 4096, maxSegmentBytes: 4096 }), allGroups);
    expect(selected.partial).toBe(true);
    expect(selected.bytes.length).toBeGreaterThan(12);
    const emptySelection = await materializeMetadata(blobOf(source), resolveLimits({ maxMetadataBytes: 4096, maxSegmentBytes: 4096 }), resolveSelection({ groups: [] }));
    expect(emptySelection.partial).toBe(true);
    expect(emptySelection.bytes.length).toBeGreaterThanOrEqual(12);
    const noImage = webpFile([webpChunk("XMP ", encoder.encode("x"))]);
    expect((await materializeMetadata(blobOf(noImage), resolveLimits(), resolveSelection({ groups: ["XMP"] }))).partial).toBe(true);
    const segmentLimited = await materializeMetadata(blobOf(source), resolveLimits({ maxSegmentBytes: 1, maxMetadataBytes: 4096 }), allGroups);
    expect(segmentLimited.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
    const metadataLimited = await materializeMetadata(blobOf(source), resolveLimits({ maxSegmentBytes: 4096, maxMetadataBytes: 10 }), allGroups);
    expect(metadataLimited.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
    const trailing = await materializeMetadata(blobOf(concat(source, Uint8Array.of(7, 8))), resolveLimits(), allGroups);
    expect(trailing.warnings.some(({ code }) => code === "MALFORMED_WEBP")).toBe(true);
    const tooLargeRiff = await materializeMetadata(blobOf(webpFile(chunks, source.length + 100)), resolveLimits(), allGroups);
    expect(tooLargeRiff.partial).toBe(false);
    const malformedChunk = concat(encoder.encode("RIFF"), Uint8Array.of(12, 0, 0, 0), encoder.encode("WEBP"), Uint8Array.of(0xff, 0xff, 0xff, 0x7f), encoder.encode("XMP "));
    expect((await materializeMetadata(blobOf(malformedChunk), resolveLimits(), allGroups)).partial).toBe(false);
    expect((await materializeMetadata(blobOf(Uint8Array.from([1, 2, 3])), resolveLimits(), allGroups)).partial).toBe(false);
  });

  it("rejects malformed JPEG-header Blob contracts before allocating an output", async () => {
    const jpeg = new Blob([Uint8Array.from([0xff, 0xd8, 0xff, 0xd9])]);
    const badSlice = { size: 4, arrayBuffer: async () => jpeg.arrayBuffer() } as unknown as Blob;
    await expect(materializeJpegHeader(badSlice, resolveLimits())).rejects.toMatchObject({ code: "INVALID_VALUE" });
    const badSize = { size: Number.NaN, arrayBuffer: async () => jpeg.arrayBuffer(), slice: () => jpeg } as unknown as Blob;
    await expect(materializeJpegHeader(badSize, resolveLimits())).rejects.toMatchObject({ code: "INVALID_VALUE" });
  });
});
