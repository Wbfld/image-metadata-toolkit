import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { exiftool } from "exiftool-vendored";

import { editMetadata, inspectMpfSegments, inspectUltraHdrXmp, parseMetadata, rewriteJpegMetadata } from "../src/index.js";
import { parseJpeg } from "../src/parsers/jpeg.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";

const encoder = new TextEncoder();
const concat = (...parts: readonly Uint8Array[]): Uint8Array => {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
};

function segment(marker: number, payload: Uint8Array): Uint8Array {
  const output = new Uint8Array(payload.length + 4);
  output.set([0xff, marker, (payload.length + 2) >>> 8, (payload.length + 2) & 0xff], 0);
  output.set(payload, 4);
  return output;
}

function image(width = 4, height = 3, metadata: readonly Uint8Array[] = []): Uint8Array {
  const sof = segment(0xc0, Uint8Array.of(8, height >>> 8, height & 0xff, width >>> 8, width & 0xff, 1, 1, 0x11, 0));
  const sos = segment(0xda, Uint8Array.of(1, 1, 0, 0, 0x3f, 0));
  return concat(Uint8Array.of(0xff, 0xd8), ...metadata, sof, sos, Uint8Array.of(1, 2, 3, 0xff, 0, 4, 0xff, 0xd9));
}

function mpfPayload(primarySize: number, gainMapSize: number, secondOffset = primarySize, withAttribute = false, littleEndian = true): Uint8Array {
  const tiff = new Uint8Array(8 + 2 + 3 * 12 + 4 + 32 + (withAttribute ? 18 : 0));
  tiff.set(littleEndian ? [0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00] : [0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08], 0);
  const view = new DataView(tiff.buffer);
  const set16 = (offset: number, value: number): void => view.setUint16(offset, value, littleEndian);
  const set32 = (offset: number, value: number): void => view.setUint32(offset, value, littleEndian);
  set16(8, 3);
  const entry = (index: number, tag: number, type: number, count: number): number => {
    const offset = 10 + index * 12;
    set16(offset, tag);
    set16(offset + 2, type);
    set32(offset + 4, count);
    return offset + 8;
  };
  const versionOffset = entry(0, 0xb000, 7, 4);
  tiff.set(encoder.encode("0100"), versionOffset);
  const countOffset = entry(1, 0xb001, 4, 1);
  set32(countOffset, 2);
  const entriesOffset = entry(2, 0xb002, 7, 32);
  set32(entriesOffset, 50);
  set32(50, 0xa0030000);
  set32(54, primarySize);
  set32(58, 0);
  set16(62, 2);
  set16(64, 0);
  set32(66, 0x40050000);
  set32(70, gainMapSize);
  set32(74, secondOffset);
  set16(78, 0);
  set16(80, 0);
  set32(46, withAttribute ? 82 : 0);
  if (withAttribute) {
    set16(82, 1);
    set16(84, 0xb101);
    set16(86, 4);
    set32(88, 1);
    set32(92, 1);
    set32(96, 0);
  }
  return concat(encoder.encode("MPF\0"), tiff);
}

function ultraHdrXmp(): Uint8Array {
  const packet = `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:hdrgm="http://ns.adobe.com/hdr-gain-map/1.0/" xmlns:Container="http://ns.google.com/photos/1.0/container/" xmlns:Item="http://ns.google.com/photos/1.0/container/item/" hdrgm:Version="1.0" hdrgm:GainMapMin="0" hdrgm:GainMapMax="4" hdrgm:Gamma="1" hdrgm:OffsetSDR="0.015625" hdrgm:OffsetHDR="0.015625" hdrgm:HDRCapacityMin="0" hdrgm:HDRCapacityMax="4" hdrgm:BaseRenditionIsHDR="False"><Container:Directory><rdf:Seq><rdf:li rdf:parseType="Resource"><Container:Item Item:Semantic="Primary" Item:Mime="image/jpeg"/></rdf:li><rdf:li rdf:parseType="Resource"><Container:Item Item:Semantic="GainMap" Item:Mime="image/jpeg" Item:Length="${image().byteLength}"/></rdf:li></rdf:Seq></Container:Directory></rdf:Description></rdf:RDF></x:xmpmeta>`;
  return concat(encoder.encode("http://ns.adobe.com/xap/1.0/\0"), encoder.encode(packet));
}

function makeMpfFile(withXmp = true, withAttribute = false, mutate?: (payload: Uint8Array) => void, littleEndian = true): Uint8Array {
  const secondaryXmp = segment(0xe1, concat(encoder.encode("http://ns.adobe.com/xap/1.0/\0"), encoder.encode("<x:xmpmeta xmlns:x=\"adobe:ns:meta/\"><rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\"><rdf:Description xmlns:example=\"urn:example\" example:value=\"secondary\"/></rdf:RDF></x:xmpmeta>")));
  const gainMap = image(2, 2, withXmp ? [] : [secondaryXmp]);
  const xmp = withXmp ? segment(0xe1, ultraHdrXmp()) : new Uint8Array();
  const markerSize = segment(0xe2, mpfPayload(0, gainMap.length, 0, withAttribute, littleEndian)).length;
  const primarySize = image(4, 3, [new Uint8Array(markerSize), xmp]).length;
  // The second individual-image offset is relative to the MP Endian field,
  // which is ten bytes into this synthetic file (JPEG marker plus APP2
  // length and MPF identifier). The image itself starts at primarySize.
  const payload = mpfPayload(primarySize, gainMap.length, primarySize - 10, withAttribute, littleEndian);
  mutate?.(payload);
  const mpf = segment(0xe2, payload);
  const primary = image(4, 3, [mpf, xmp]);
  expect(primary.length).toBe(primarySize);
  return concat(primary, gainMap);
}

function makeThreeImageMpfFile(): Uint8Array {
  const secondaryOne = image(2, 2);
  const secondaryTwo = image(3, 1);
  const buildPayload = (primarySize: number): Uint8Array => {
    const tiff = new Uint8Array(98);
    tiff.set([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0], 0);
    const view = new DataView(tiff.buffer);
    view.setUint16(8, 3, true);
    const entry = (index: number, tag: number, type: number, count: number): number => {
      const offset = 10 + index * 12;
      view.setUint16(offset, tag, true); view.setUint16(offset + 2, type, true); view.setUint32(offset + 4, count, true);
      return offset + 8;
    };
    tiff.set(encoder.encode("0100"), entry(0, 0xb000, 7, 4));
    view.setUint32(entry(1, 0xb001, 4, 1), 3, true);
    view.setUint32(entry(2, 0xb002, 7, 48), 50, true);
  const values = [
      [0, primarySize, 0],
      [0, secondaryOne.length, primarySize - 10],
      [0, secondaryTwo.length, primarySize + secondaryOne.length + between.length - 10],
    ];
    values.forEach(([attributes, size, offset], index) => {
      const entryOffset = 50 + index * 16;
      view.setUint32(entryOffset, attributes ?? 0, true); view.setUint32(entryOffset + 4, size ?? 0, true); view.setUint32(entryOffset + 8, offset ?? 0, true);
      view.setUint16(entryOffset + 12, 0, true); view.setUint16(entryOffset + 14, 0, true);
    });
    return concat(encoder.encode("MPF\0"), tiff);
  };
  const between = segment(0xfe, encoder.encode("metadata between secondary images"));
  const after = segment(0xfe, encoder.encode("metadata after secondary images"));
  const markerLength = segment(0xe2, buildPayload(0)).length;
  const primarySize = image(4, 3, [new Uint8Array(markerLength)]).length;
  const primary = image(4, 3, [segment(0xe2, buildPayload(primarySize))]);
  expect(primary.length).toBe(primarySize);
  return concat(primary, secondaryOne, between, secondaryTwo, after, Uint8Array.of(7, 6, 5));
}

function mpfPayloadOffset(entryIndex: number, fieldOffset: number): number {
  return 4 + 50 + (entryIndex * 16) + fieldOffset;
}

function ultraHdrPacket(): string {
  const encoded = new TextDecoder().decode(ultraHdrXmp());
  return encoded.slice("http://ns.adobe.com/xap/1.0/\0".length);
}

function customUltraHdrPacket(options: {
  readonly properties?: string;
  readonly directory?: string;
  readonly directoryContainer?: "Seq" | "Bag" | "literal";
} = {}): string {
  const properties = options.properties ?? 'hdrgm:Version="1.0" hdrgm:GainMapMin="0" hdrgm:GainMapMax="4" hdrgm:Gamma="1" hdrgm:OffsetSDR="0" hdrgm:OffsetHDR="0" hdrgm:HDRCapacityMin="0" hdrgm:HDRCapacityMax="4"';
  const directory = options.directory ?? '<rdf:Seq><rdf:li rdf:parseType="Resource"><Container:Item Item:Semantic="Primary" Item:Mime="image/jpeg"/></rdf:li><rdf:li rdf:parseType="Resource"><Container:Item Item:Semantic="GainMap" Item:Mime="image/jpeg" Item:Length="68"/></rdf:li></rdf:Seq>';
  const directoryValue = options.directoryContainer === "literal" ? "not-a-sequence" : `<rdf:${options.directoryContainer ?? "Seq"}>${directory.replace(/^<rdf:(?:Seq|Bag)>|<\/rdf:(?:Seq|Bag)>$/gu, "")}</rdf:${options.directoryContainer ?? "Seq"}>`;
  return `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:hdrgm="http://ns.adobe.com/hdr-gain-map/1.0/" xmlns:Container="http://ns.google.com/photos/1.0/container/" xmlns:Item="http://ns.google.com/photos/1.0/container/item/" ${properties}><Container:Directory>${directoryValue}</Container:Directory></rdf:Description></rdf:RDF></x:xmpmeta>`;
}

afterAll(async () => { await exiftool.end(); });

describe("T05 bounded MPF and Ultra HDR inventory", () => {
  it("decodes the MP Index IFD, dependencies, representative flags, secondary metadata, and GContainer gain-map relationship", () => {
    const result = parseJpeg(makeMpfFile(), DEFAULT_LIMITS);
    expect(result.mpf?.complete).toBe(true);
    expect(result.mpf?.segments[0]?.indexIfd?.kind).toBe("index");
    expect(result.mpf?.segments[0]?.attributeIfds).toHaveLength(0);
    expect(result.mpf?.images).toHaveLength(2);
    const images = result.mpf?.images ?? [];
    expect(images[0]).toMatchObject({ imageType: "baseline-primary", offset: 0, representative: true, dependentParent: true, dependentImage1: 1 });
    expect(typeof images[0]?.size).toBe("number");
    expect(images[1]).toMatchObject({ imageType: "gain-map", offset: (images[0]?.size ?? 0) - 10, representative: false, dependentChild: true, metadata: { format: "jpeg", dimensions: { width: 2, height: 2 } } });
    expect(result.mpf?.relationships).toEqual(expect.arrayContaining([expect.objectContaining({ type: "dependent-image" })]));
    expect(result.ultraHdr).toMatchObject({ status: "decoded", complete: true, version: "1.0", primaryImageId: result.mpf?.images[0]?.id, gainMapImageId: result.mpf?.images[1]?.id });
    expect(result.ultraHdr?.directory).toEqual(expect.arrayContaining([expect.objectContaining({ semantic: "Primary" }), expect.objectContaining({ semantic: "GainMap", mpfImageId: result.mpf?.images[1]?.id })]));
    expect((result.blocks ?? []).filter((block) => block.family === "MPF")).toHaveLength(3);
  });

  it("preserves exact source block and image range provenance and supports MPF selection", () => {
    const result = parseJpeg(makeMpfFile(false), DEFAULT_LIMITS);
    const mpfBlock = (result.blocks ?? []).find((block) => block.family === "MPF" && block.container === "APP2 MPF");
    expect(mpfBlock).toMatchObject({ offset: 2, status: "decoded", associatedImage: null });
    expect(typeof mpfBlock?.length).toBe("number");
    expect(result.mpf?.images.every((imageEntry) => imageEntry.absoluteOffset !== null && imageEntry.rangeLength !== null)).toBe(true);
    const secondaryXmpBlock = (result.blocks ?? []).find((block) => block.container === "MPF secondary JPEG XMP");
    expect(secondaryXmpBlock?.offset).toBe((result.mpf?.images[1]?.absoluteOffset ?? -1) + 2);
    const selected = parseJpeg(makeMpfFile(false), DEFAULT_LIMITS, { selection: { groups: new Set(["MPF"]), tags: null } });
    expect(selected.mpf?.images).toHaveLength(2);
    expect(selected.exif).toBeNull();
  });

  it("decodes the optional MP Attribute IFD without confusing it with a second MP Index IFD", () => {
    const result = parseJpeg(makeMpfFile(false, true), DEFAULT_LIMITS);
    expect(result.mpf?.complete).toBe(true);
    expect(result.mpf?.segments[0]?.indexIfd?.kind).toBe("index");
    expect(result.mpf?.segments[0]?.attributeIfds).toHaveLength(1);
    expect(result.mpf?.segments[0]?.attributeIfds[0]?.entries.map(({ tag }) => tag)).toEqual([0xb101]);
  });

  it("fails closed for truncated, overflowing, duplicate, and malformed MPF structures", () => {
    const valid = makeMpfFile(false);
    const mpfStart = 2;
    const mpfLength = ((valid[mpfStart + 2] ?? 0) << 8) | (valid[mpfStart + 3] ?? 0);
    const truncated = valid.slice(0, mpfStart + 4 + mpfLength - 5);
    const truncatedResult = parseJpeg(truncated, DEFAULT_LIMITS);
    expect(truncatedResult.mpf?.complete).not.toBe(true);
    expect(truncatedResult.warnings.some((warning) => warning.code === "MALFORMED_MPF" || warning.code === "TRUNCATED_DATA")).toBe(true);

    const malformedPayload = encoder.encode("MPF\0II*\0\xff\xff\xff\xff");
    const malformed = image(4, 3, [segment(0xe2, malformedPayload)]);
    const malformedResult = parseJpeg(malformed, DEFAULT_LIMITS);
    expect(malformedResult.mpf?.complete).not.toBe(true);
    expect(malformedResult.mpf?.diagnostics.length).toBeGreaterThan(0);

    const validMpfPayload = valid.slice(mpfStart + 4, mpfStart + 4 + mpfLength - 2);
    const duplicate = image(4, 3, [segment(0xe2, validMpfPayload), segment(0xe2, validMpfPayload)]);
    const duplicateResult = parseJpeg(duplicate, DEFAULT_LIMITS);
    expect(duplicateResult.mpf?.complete).not.toBe(true);
    expect(duplicateResult.mpf?.diagnostics.some((diagnostic) => diagnostic.code === "DUPLICATE_MPF" || diagnostic.code === "MALFORMED_MPF")).toBe(true);
  });

  it("rejects zero-sized, out-of-container, pre-container, overlapping, shared, and non-JPEG ranges", () => {
    const zeroSized = parseJpeg(makeMpfFile(false, false, (payload) => new DataView(payload.buffer, payload.byteOffset, payload.byteLength).setUint32(mpfPayloadOffset(1, 4), 0, true)), DEFAULT_LIMITS);
    expect(zeroSized.mpf?.complete).toBe(false);
    expect(zeroSized.mpf?.diagnostics.some(({ code }) => code === "INVALID_VALUE")).toBe(true);

    const beyondInput = parseJpeg(makeMpfFile(false, false, (payload) => new DataView(payload.buffer, payload.byteOffset, payload.byteLength).setUint32(mpfPayloadOffset(1, 8), 0xffffffff, true)), DEFAULT_LIMITS);
    expect(beyondInput.mpf?.complete).toBe(false);
    expect(beyondInput.mpf?.images[1]?.absoluteOffset).toBeNull();
    expect(beyondInput.mpf?.diagnostics.some(({ code }) => code === "UNSAFE_OFFSET")).toBe(true);

    const beforeContainer = parseJpeg(makeMpfFile(false, false, (payload) => new DataView(payload.buffer, payload.byteOffset, payload.byteLength).setUint32(mpfPayloadOffset(1, 8), 0, true)), DEFAULT_LIMITS);
    expect(beforeContainer.mpf?.complete).toBe(false);
    expect(beforeContainer.mpf?.diagnostics.some(({ code }) => code === "MALFORMED_MPF")).toBe(true);

    const overlapping = parseJpeg(makeMpfFile(false, false, (payload) => new DataView(payload.buffer, payload.byteOffset, payload.byteLength).setUint32(mpfPayloadOffset(1, 8), 0, true)), DEFAULT_LIMITS);
    expect(overlapping.mpf?.complete).toBe(false);
    expect(overlapping.mpf?.diagnostics.some(({ code }) => code === "MALFORMED_MPF")).toBe(true);
    const shared = parseJpeg(makeMpfFile(false, false, (payload) => {
      const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
      view.setUint32(mpfPayloadOffset(1, 8), 0, true);
      view.setUint32(mpfPayloadOffset(1, 4), 1, true);
    }), DEFAULT_LIMITS);
    expect(shared.mpf?.complete).toBe(false);
    expect(shared.mpf?.diagnostics.some(({ code }) => code === "MALFORMED_MPF")).toBe(true);

    const nonJpeg = parseJpeg(makeMpfFile(false, false, (payload) => {
      const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
      view.setUint32(mpfPayloadOffset(1, 8), 1, true);
      view.setUint32(mpfPayloadOffset(1, 4), 1, true);
    }), DEFAULT_LIMITS);
    expect(nonJpeg.mpf?.complete).toBe(false);
    expect(nonJpeg.mpf?.diagnostics.some(({ message }) => message.includes("JPEG SOI"))).toBe(true);
  });

  it("retains unknown MPF/HDR values and rejects MPF/GContainer relationship conflicts", () => {
    const unknownMpf = parseJpeg(makeMpfFile(false, false, (payload) => new DataView(payload.buffer, payload.byteOffset, payload.byteLength).setUint16(4 + 10, 0xdead, true)), DEFAULT_LIMITS);
    expect(unknownMpf.mpf?.segments[0]?.indexIfd?.entries.some(({ tag }) => tag === 0xdead)).toBe(true);

    const unknownHdr = ultraHdrPacket().replace("hdrgm:HDRCapacityMax=\"4\"", "hdrgm:HDRCapacityMax=\"4\" hdrgm:FutureProperty=\"opaque\"");
    const unknownHdrResult = inspectUltraHdrXmp([unknownHdr], ["unknown"], unknownMpf.mpf?.images ?? [], DEFAULT_LIMITS);
    expect(unknownHdr).toContain("FutureProperty");
    expect(unknownHdrResult?.gainMapProperties.some(({ localName, lexicalValues }) => localName === "FutureProperty" && lexicalValues[0] === "opaque")).toBe(true);

    const conflictingPacket = ultraHdrPacket().replace('Item:Semantic="Primary"', 'Item:Semantic="Other"');
    const conflictingXmp = segment(0xe1, concat(encoder.encode("http://ns.adobe.com/xap/1.0/\0"), encoder.encode(conflictingPacket)));
    const gainMap = image(2, 2);
    const markerSize = segment(0xe2, mpfPayload(0, gainMap.length, 0)).length;
    const primarySize = image(4, 3, [new Uint8Array(markerSize), conflictingXmp]).length;
    const conflicting = parseJpeg(concat(image(4, 3, [segment(0xe2, mpfPayload(primarySize, gainMap.length, primarySize - 10)), conflictingXmp]), gainMap), DEFAULT_LIMITS);
    expect(conflicting.ultraHdr?.complete).toBe(false);
    expect(conflicting.ultraHdr?.diagnostics.some(({ code }) => code === "MALFORMED_ULTRA_HDR")).toBe(true);
  });

  it("rejects malformed IFD byte order, counts, types, and pointers and never trusts unsafe source offsets", () => {
    const byteOrder = parseJpeg(image(4, 3, [segment(0xe2, encoder.encode("MPF\0ZZ\0\0\0\0\0\0\0"))]), DEFAULT_LIMITS);
    expect(byteOrder.mpf?.complete).toBe(false);
    const badCount = parseJpeg(makeMpfFile(false, false, (payload) => new DataView(payload.buffer, payload.byteOffset, payload.byteLength).setUint16(4 + 8, 0, true)), DEFAULT_LIMITS);
    expect(badCount.mpf?.complete).toBe(false);
    const badType = parseJpeg(makeMpfFile(false, false, (payload) => new DataView(payload.buffer, payload.byteOffset, payload.byteLength).setUint16(4 + 36, 3, true)), DEFAULT_LIMITS);
    expect(badType.mpf?.complete).toBe(false);
    expect(badType.mpf?.diagnostics.some(({ code }) => code === "MALFORMED_MPF")).toBe(true);
    const badPointer = parseJpeg(makeMpfFile(false, false, (payload) => new DataView(payload.buffer, payload.byteOffset, payload.byteLength).setUint32(4 + 4, 0xffffffff, true)), DEFAULT_LIMITS);
    expect(badPointer.mpf?.complete).toBe(false);
    expect(badPointer.mpf?.diagnostics.some(({ code }) => code === "UNSAFE_OFFSET")).toBe(true);
    const overflow = inspectMpfSegments([{ id: "overflow", sourceOffset: Number.MAX_SAFE_INTEGER, byteLength: 1, payload: mpfPayload(12, 2, 2) }], { length: 12, subarray: () => new Uint8Array(), isMaterialized: () => true }, DEFAULT_LIMITS);
    expect(overflow?.complete).toBe(false);
    expect(overflow?.diagnostics.some(({ code }) => code === "UNSAFE_OFFSET")).toBe(true);
  });

  it("diagnoses duplicate and over-limit GContainer structures", () => {
    const packet = ultraHdrPacket();
    const directory = packet.slice(packet.indexOf("<Container:Directory>"), packet.indexOf("</Container:Directory>") + "</Container:Directory>".length);
    const duplicatePacket = packet.replace("</rdf:Description>", `${directory}</rdf:Description>`);
    const result = parseJpeg(makeMpfFile(), DEFAULT_LIMITS);
    const duplicate = inspectUltraHdrXmp([packet, duplicatePacket], ["primary", "duplicate"], result.mpf?.images ?? [], DEFAULT_LIMITS);
    expect(duplicate?.complete).toBe(false);
    expect(duplicate?.diagnostics.some(({ code }) => code === "MALFORMED_ULTRA_HDR")).toBe(true);
    const limited = parseJpeg(makeMpfFile(), { ...DEFAULT_LIMITS, maxXmpArrayItems: 1 });
    expect(limited.ultraHdr?.complete).toBe(false);
    expect(limited.ultraHdr?.diagnostics.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
  });

  it("supports bounded Blob metadata reads and cancellation without decoding image payloads", async () => {
    const bytes = makeMpfFile();
    const blobPart = bytes.slice().buffer;
    const scoped = await parseMetadata(new Blob([blobPart], { type: "image/jpeg" }), { scope: "metadata", select: { groups: ["Dimensions", "MPF", "XMP"] } });
    expect(scoped.mpf).not.toBeNull();
    expect(scoped.mpf?.complete).not.toBe(true);
    expect(scoped.mpf?.images).toHaveLength(2);
    expect(scoped.mpf?.images[1]?.status).toBe("partial");
    const full = await parseMetadata(new Blob([blobPart], { type: "image/jpeg" }));
    expect(full.mpf?.complete).toBe(true);
    const controller = new AbortController();
    controller.abort();
    await expect(parseMetadata(new Blob([blobPart]), { scope: "metadata", signal: controller.signal })).rejects.toMatchObject({ code: "ABORTED" });
  });

  it("keeps every MPF boundary truncation incomplete and respects nested limits", () => {
    const valid = makeMpfFile();
    const mpfLength = ((valid[4] ?? 0) << 8) | (valid[5] ?? 0);
    const mpfEnd = 4 + mpfLength;
    for (let end = 2; end < mpfEnd; end += 1) {
      const result = parseJpeg(valid.slice(0, end), DEFAULT_LIMITS);
      expect(result.mpf?.complete).not.toBe(true);
    }
    const limited = parseJpeg(valid, { ...DEFAULT_LIMITS, maxSegments: 1, maxXmpNodes: 1 });
    expect(limited.mpf?.complete).toBe(false);
    expect(limited.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
  });

  it("keeps invalid Ultra HDR lexical values and conflicts diagnosable", () => {
    const gainMap = image(2, 2);
    const packet = `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:hdrgm="http://ns.adobe.com/hdr-gain-map/1.0/" hdrgm:Version="1.0" hdrgm:GainMapMax="not-a-number" hdrgm:HDRCapacityMax="0"/></rdf:RDF></x:xmpmeta>`;
    const xmp = segment(0xe1, concat(encoder.encode("http://ns.adobe.com/xap/1.0/\0"), encoder.encode(packet)));
    const markerSize = segment(0xe2, mpfPayload(0, gainMap.length)).length;
    const primarySize = image(4, 3, [new Uint8Array(markerSize), xmp]).length;
    const primary = image(4, 3, [segment(0xe2, mpfPayload(primarySize, gainMap.length, primarySize - 10)), xmp]);
    const result = parseJpeg(concat(primary, gainMap), DEFAULT_LIMITS);
    expect(result.ultraHdr?.complete).toBe(false);
    expect(result.ultraHdr?.gainMapProperties.find((property) => property.localName === "GainMapMax")?.lexicalValues).toEqual(["not-a-number"]);
    expect(result.warnings.some((warning) => warning.code === "MALFORMED_ULTRA_HDR" || warning.code === "INVALID_VALUE")).toBe(true);
  });

  it("exercises every bounded Ultra HDR property and directory validation path", () => {
    const parsed = parseJpeg(makeMpfFile(), DEFAULT_LIMITS);
    const images = parsed.mpf?.images ?? [];
    expect(inspectUltraHdrXmp([], [], images, DEFAULT_LIMITS)).toBeNull();
    expect(inspectUltraHdrXmp(["<x:xmpmeta><rdf:RDF/></x:xmpmeta>"], [null], images, DEFAULT_LIMITS)).toBeNull();
    expect(inspectUltraHdrXmp(["<x:xmpmeta xmlns:hdrgm=\"http://ns.adobe.com/hdr-gain-map/1.0/\"><"], [], images, DEFAULT_LIMITS)?.status).toBe("malformed");

    const missing = inspectUltraHdrXmp([customUltraHdrPacket({ properties: 'hdrgm:Version="2.0" hdrgm:BaseRenditionIsHDR="True"' , directory: "", directoryContainer: "literal" })], [undefined as unknown as null], images, DEFAULT_LIMITS);
    expect(missing?.complete).toBe(false);
    expect(missing?.diagnostics.some(({ code }) => code === "MALFORMED_ULTRA_HDR")).toBe(true);
    expect(missing?.diagnostics.some(({ code }) => code === "INVALID_VALUE")).toBe(true);

    const arrays = inspectUltraHdrXmp([customUltraHdrPacket({
      properties: 'hdrgm:Version="1.0" hdrgm:GainMapMin="0" hdrgm:GainMapMax="4" hdrgm:Gamma="-1" hdrgm:OffsetSDR="-1" hdrgm:OffsetHDR="-2" hdrgm:HDRCapacityMin="5" hdrgm:HDRCapacityMax="4"',
      directory: '<rdf:Seq><rdf:li rdf:parseType="Resource"><Container:Item Item:Semantic="Unknown" Item:Mime="image/png" Item:Length="not-a-number" Item:Padding="-1" Item:URI="remote" Item:Future="opaque"/></rdf:li><rdf:li>literal-item</rdf:li><rdf:li rdf:parseType="Resource"/></rdf:Seq>',
    })], ["matrix"], images, DEFAULT_LIMITS);
    expect(arrays?.directory).toHaveLength(3);
    expect(arrays?.directory.every((item) => item.status === "malformed")).toBe(true);
    expect(arrays?.diagnostics.some(({ message }) => message.includes("MIME"))).toBe(true);
    expect(arrays?.diagnostics.some(({ message }) => message.includes("URI"))).toBe(true);

    const numericArrays = customUltraHdrPacket({
      properties: 'hdrgm:Version="1.0" hdrgm:OffsetSDR="0" hdrgm:OffsetHDR="0" hdrgm:HDRCapacityMin="0" hdrgm:HDRCapacityMax="4"',
      directory: '<rdf:Seq><rdf:li rdf:parseType="Resource"><Container:Item Item:Semantic="Primary" Item:Mime="image/jpeg"/></rdf:li><rdf:li rdf:parseType="Resource"><Container:Item Item:Semantic="GainMap" Item:Mime="image/jpeg" Item:Length="68"/></rdf:li></rdf:Seq>',
    }).replace('<Container:Directory>', '<hdrgm:GainMapMin><rdf:Seq><rdf:li>3</rdf:li><rdf:li>2</rdf:li><rdf:li>1</rdf:li></rdf:Seq></hdrgm:GainMapMin><hdrgm:GainMapMax><rdf:Seq><rdf:li>1</rdf:li><rdf:li>3</rdf:li><rdf:li>2</rdf:li></rdf:Seq></hdrgm:GainMapMax><hdrgm:Gamma><rdf:Bag><rdf:li>1</rdf:li><rdf:li>2</rdf:li><rdf:li>3</rdf:li><rdf:li>4</rdf:li></rdf:Bag></hdrgm:Gamma><Container:Directory>');
    const numericArrayResult = inspectUltraHdrXmp([numericArrays], ["numeric"], images, DEFAULT_LIMITS);
    expect(numericArrayResult?.complete).toBe(false);
    expect(numericArrayResult?.gainMapProperties.find(({ localName }) => localName === "GainMapMin")?.lexicalValues).toEqual(["3", "2", "1"]);
    expect(numericArrayResult?.diagnostics.some(({ code }) => code === "INVALID_VALUE")).toBe(true);

    const noGainMap = inspectUltraHdrXmp([customUltraHdrPacket()], ["no-gain"], [], DEFAULT_LIMITS);
    expect(noGainMap?.gainMapImageId).toBeNull();
    expect(noGainMap?.complete).toBe(false);

    const mismatched = images.map((imageEntry) => ({ ...imageEntry, imageType: "other" as const }));
    const mismatchResult = inspectUltraHdrXmp([customUltraHdrPacket({ directory: '<rdf:Seq><rdf:li rdf:parseType="Resource"><Container:Item Item:Semantic="Primary" Item:Mime="image/jpeg"/></rdf:li><rdf:li rdf:parseType="Resource"><Container:Item Item:Semantic="GainMap" Item:Mime="image/jpeg" Item:Length="1"/></rdf:li></rdf:Seq>' })], ["mismatch"], mismatched, DEFAULT_LIMITS);
    expect(mismatchResult?.complete).toBe(false);
    expect(mismatchResult?.diagnostics.some(({ message }) => message.includes("baseline-primary"))).toBe(true);
    expect(mismatchResult?.diagnostics.some(({ message }) => message.includes("gain-map"))).toBe(true);
  });

  it("enforces MPF IFD limits without throwing", () => {
    const result = parseJpeg(makeMpfFile(false), { ...DEFAULT_LIMITS, maxIfdEntries: 2 });
    expect(result.mpf?.complete).toBe(false);
    expect(result.mpf?.diagnostics.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
    expect(result.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
  });

  it("covers MPF segment classification, materialization outcomes, and bounded relationship fallbacks", () => {
    const sourceBytes = new Uint8Array(16);
    sourceBytes.set([0xff, 0xd8], 0);
    sourceBytes.set([0xff, 0xd8], 12);
    const payload = mpfPayload(4, 4, 4);
    const input = { id: "matrix", sourceOffset: 0, byteLength: payload.length, payload };
    const source = (materialized: boolean, short = false) => ({
      length: sourceBytes.length,
      subarray: (start: number, end: number) => sourceBytes.subarray(start, short ? Math.max(start, end - 1) : end),
      isMaterialized: () => materialized,
    });
    expect(inspectMpfSegments([input], source(true), DEFAULT_LIMITS)?.images.every(({ status }) => status === "decoded")).toBe(true);
    expect(inspectMpfSegments([input], source(false), DEFAULT_LIMITS)?.images.some(({ status }) => status === "partial")).toBe(true);
    expect(inspectMpfSegments([input], source(true, true), DEFAULT_LIMITS)?.images.some(({ status }) => status === "partial")).toBe(true);
    const nonJpeg = new Uint8Array(sourceBytes);
    nonJpeg[0] = 0;
    expect(inspectMpfSegments([input], {
      length: sourceBytes.length,
      subarray: (start: number, end: number) => nonJpeg.subarray(start, end),
      isMaterialized: () => true,
    }, DEFAULT_LIMITS)?.images[0]?.status).toBe("malformed");

    const noIdentifier = inspectMpfSegments([{ ...input, payload: encoder.encode("not MPF") }], source(true), DEFAULT_LIMITS);
    expect(noIdentifier?.complete).toBe(false);
    const tooShort = inspectMpfSegments([{ ...input, payload: encoder.encode("MPF\0II") }], source(true), DEFAULT_LIMITS);
    expect(tooShort?.diagnostics.some(({ code }) => code === "TRUNCATED_DATA")).toBe(true);

    const noIndexPayload = mpfPayload(4, 4, 4).slice();
    const noIndexView = new DataView(noIndexPayload.buffer);
    noIndexView.setUint16(4 + 10, 0xb101, true);
    noIndexView.setUint16(4 + 22, 0xb102, true);
    noIndexView.setUint16(4 + 34, 0xb103, true);
    const noIndex = inspectMpfSegments([{ ...input, id: "attribute", payload: noIndexPayload }], source(true), DEFAULT_LIMITS);
    expect(noIndex?.segments[0]?.indexIfd).toBeNull();
    expect(noIndex?.segments[0]?.attributeIfds.length).toBeGreaterThan(0);

    const manyIfds = mpfPayload(4, 4, 4, true).slice();
    new DataView(manyIfds.buffer).setUint32(4 + 96, 82, true);
    const manyIfdResult = inspectMpfSegments([{ ...input, id: "many-ifds", payload: manyIfds }], source(true), DEFAULT_LIMITS);
    expect(manyIfdResult?.diagnostics.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);

    const conflictPacket = ultraHdrPacket().replace('hdrgm:Version="1.0"', 'hdrgm:Version="2.0"');
    const parsedImages = parseJpeg(makeMpfFile(), DEFAULT_LIMITS).mpf?.images ?? [];
    const packetLimit = inspectUltraHdrXmp([ultraHdrPacket(), conflictPacket], ["first", "second"], parsedImages, { ...DEFAULT_LIMITS, maxXmpPackets: 1 });
    expect(packetLimit?.status).toBe("partial");
    expect(packetLimit?.diagnostics.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
    const conflict = inspectUltraHdrXmp([ultraHdrPacket(), conflictPacket], ["first", "second"], parsedImages, DEFAULT_LIMITS);
    expect(conflict?.diagnostics.some(({ code }) => code === "MALFORMED_ULTRA_HDR")).toBe(true);
    const noDirectory = inspectUltraHdrXmp([customUltraHdrPacket({ directory: "", directoryContainer: "literal" })], [null], parsedImages, DEFAULT_LIMITS);
    expect(noDirectory?.complete).toBe(false);
    expect(noDirectory?.primaryImageId).not.toBeNull();
  });

  it("retains every supported MPF scalar type and fails closed for unsupported scalar encodings", () => {
    const versionTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 99];
    for (const type of versionTypes) {
      const result = parseJpeg(makeMpfFile(false, false, (payload) => {
        new DataView(payload.buffer, payload.byteOffset, payload.byteLength).setUint16(4 + 8 + 2 + 2, type, true);
      }), DEFAULT_LIMITS);
      expect(result.mpf).not.toBeNull();
    }
    for (const type of [3, 5, 8, 9, 13, 99]) {
      const result = parseJpeg(makeMpfFile(false, false, (payload) => {
        const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
        view.setUint16(4 + 8 + 2 + 12 + 2, type, true);
        if (type === 3 || type === 8) view.setUint16(4 + 8 + 2 + 12 + 8, 2, true);
        else view.setUint32(4 + 8 + 2 + 12 + 8, 2, true);
      }), DEFAULT_LIMITS);
      expect(result.mpf).not.toBeNull();
    }
    const flagsMismatch = parseJpeg(makeMpfFile(false, false, (payload) => {
      new DataView(payload.buffer, payload.byteOffset, payload.byteLength).setUint32(mpfPayloadOffset(0, 0), 0, true);
    }), DEFAULT_LIMITS);
    expect(flagsMismatch.mpf?.complete).toBe(false);
    expect(flagsMismatch.mpf?.diagnostics.some(({ code }) => code === "INVALID_VALUE")).toBe(true);
    const nonZeroPrimaryOffset = parseJpeg(makeMpfFile(false, false, (payload) => {
      new DataView(payload.buffer, payload.byteOffset, payload.byteLength).setUint32(mpfPayloadOffset(0, 8), 1, true);
    }), DEFAULT_LIMITS);
    expect(nonZeroPrimaryOffset.mpf?.complete).toBe(false);
    expect(nonZeroPrimaryOffset.mpf?.diagnostics.some(({ message }) => message.includes("first MPF image entry"))).toBe(true);
  });

  it("rewrites MPF offsets and the primary size only under the explicit policy, preserving every secondary JPEG payload", () => {
    const input = makeMpfFile(false);
    const before = parseJpeg(input, DEFAULT_LIMITS);
    const beforePrimary = before.mpf?.images[0];
    const beforeSecondary = before.mpf?.images[1];
    if (beforePrimary === undefined || beforeSecondary === undefined || beforeSecondary.absoluteOffset === null) throw new Error("MPF write fixture was not decoded");
    const source = input.slice();
    expect(() => rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "standard-xmp", data: "metadata-growth" }] })).toThrow(/explicit mpf preserve policy/);
    const rewritten = rewriteJpegMetadata(input, {
      blocks: [{ op: "add", kind: "standard-xmp", data: "metadata-growth" }],
      mpf: { mode: "preserve" },
    });
    expect(input).toEqual(source);
    const after = parseJpeg(rewritten.data, DEFAULT_LIMITS);
    expect(after.mpf?.complete).toBe(true);
    const afterPrimary = after.mpf?.images[0];
    const afterSecondary = after.mpf?.images[1];
    if (afterPrimary === undefined || afterSecondary === undefined || afterSecondary.absoluteOffset === null) throw new Error("rewritten MPF was not decoded");
    expect(afterPrimary.size).toBe(after.mpf?.segments[0]?.images[0]?.size);
    expect(afterPrimary.size).toBeGreaterThan(beforePrimary.size);
    expect(afterSecondary.size).toBe(beforeSecondary.size);
    expect(afterSecondary.absoluteOffset).toBe(beforeSecondary.absoluteOffset + (afterPrimary.size - beforePrimary.size));
    expect(rewritten.mpf).toMatchObject({ schema: "browser-image-metadata.jpeg-mpf-write.v1", relationshipsVerified: true, ultraHdr: "not-present" });
    expect(rewritten.mpf?.images).toHaveLength(2);
    expect(rewritten.mpf?.images.every((imageEntry) => imageEntry.encodedPayloads.every((payload) => payload.before.sha256 === payload.after.sha256))).toBe(true);
    expect(rewritten.byteChanges.some((change) => change.blockId === "jpeg:APP2:2" && change.kind === "rewritten")).toBe(true);
    expect(rewritten.data.slice(afterSecondary.absoluteOffset, afterSecondary.absoluteOffset + afterSecondary.size)).toEqual(input.slice(beforeSecondary.absoluteOffset, beforeSecondary.absoluteOffset + beforeSecondary.size));
    const restored = rewriteJpegMetadata(rewritten.data, {
      blocks: [{ op: "remove", kind: "standard-xmp" }],
      mpf: { mode: "preserve" },
    });
    const restoredParsed = parseJpeg(restored.data, DEFAULT_LIMITS);
    expect(restoredParsed.mpf?.complete).toBe(true);
    expect(restoredParsed.mpf?.images[0]?.size).toBe(beforePrimary.size);
    expect(restoredParsed.mpf?.images[1]?.absoluteOffset).toBe(beforeSecondary.absoluteOffset);
  });

  it("preserves a complete Ultra HDR GContainer relationship and gain-map payload under explicit policy", () => {
    const input = makeMpfFile();
    const before = parseJpeg(input, DEFAULT_LIMITS);
    expect(before.ultraHdr?.complete).toBe(true);
    expect(() => rewriteJpegMetadata(input, {
      blocks: [{ op: "add", kind: "standard-xmp", data: "unrelated metadata" }],
      mpf: { mode: "preserve" },
    })).toThrow(/ultraHdr preserve policy/);
    const rewritten = rewriteJpegMetadata(input, {
      blocks: [{ op: "add", kind: "standard-xmp", data: "unrelated metadata" }],
      mpf: { mode: "preserve", ultraHdr: "preserve" },
    });
    expect(rewritten.mpf?.ultraHdr).toBe("preserved");
    expect(rewritten.mpf?.relationshipsVerified).toBe(true);
    expect(parseJpeg(rewritten.data, DEFAULT_LIMITS).ultraHdr).toMatchObject({ complete: true, status: "decoded", version: "1.0" });
    const beforeGain = before.mpf?.images[1];
    const afterGain = parseJpeg(rewritten.data, DEFAULT_LIMITS).mpf?.images[1];
    if (beforeGain?.absoluteOffset === null || beforeGain === undefined || afterGain?.absoluteOffset === null || afterGain === undefined) throw new Error("gain-map image was not retained");
    expect(rewritten.data.slice(afterGain.absoluteOffset, afterGain.absoluteOffset + afterGain.size)).toEqual(input.slice(beforeGain.absoluteOffset, beforeGain.absoluteOffset + beforeGain.size));
  });

  it("uses the same MPF policy through the public transactional edit API", async () => {
    const input = makeMpfFile(false);
    const result = await editMetadata(input, {
      operations: [{ op: "set", operationId: "xmp", target: { kind: "field", fieldId: "XMP:standard" }, value: "transactional metadata" }],
      policy: { mpf: { mode: "preserve" } },
    });
    expect(result.successful).toBe(true);
    if (!result.successful) throw new Error("MPF transactional write did not complete");
    expect(result.policy.mpf).toEqual({ mode: "preserve" });
    expect(parseJpeg(result.data, DEFAULT_LIMITS).mpf?.complete).toBe(true);
    expect(result.output?.mpf).toMatchObject({ schema: "browser-image-metadata.jpeg-mpf-write.v1", relationshipsVerified: true });
    expect(result.output?.byteChanges.some((change) => change.blockId === "jpeg:APP2:2" && change.kind === "rewritten")).toBe(true);
  });

  it("rewrites big-endian MPF numeric fields with the correct TIFF byte order", () => {
    const input = makeMpfFile(false, true, undefined, false);
    const before = parseJpeg(input, DEFAULT_LIMITS);
    const rewritten = rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "standard-xmp", data: "big-endian metadata" }], mpf: { mode: "preserve" } });
    const after = parseJpeg(rewritten.data, DEFAULT_LIMITS);
    expect(before.mpf?.segments[0]?.indexIfd?.entries.some(({ tag }) => tag === 0xb002)).toBe(true);
    expect(after.mpf?.complete).toBe(true);
    expect(after.mpf?.segments[0]?.attributeIfds[0]?.entries.map(({ tag }) => tag)).toEqual([0xb101]);
    expect(after.mpf?.images[0]?.size).toBeGreaterThan(before.mpf?.images[0]?.size ?? 0);
    expect(after.mpf?.images[1]?.absoluteOffset).toBe((before.mpf?.images[1]?.absoluteOffset ?? 0) + ((after.mpf?.images[0]?.size ?? 0) - (before.mpf?.images[0]?.size ?? 0)));
    expect(rewritten.mpf?.relationshipsVerified).toBe(true);
  });

  it("updates every secondary offset in a multi-picture file while retaining trailing bytes", () => {
    const input = makeThreeImageMpfFile();
    const before = parseJpeg(input, DEFAULT_LIMITS);
    const rewritten = rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "standard-xmp", data: "multiple secondary metadata" }], mpf: { mode: "preserve" } });
    const after = parseJpeg(rewritten.data, DEFAULT_LIMITS);
    expect(before.mpf?.images).toHaveLength(3);
    expect(after.mpf?.complete).toBe(true);
    expect(after.mpf?.images).toHaveLength(3);
    const delta = (after.mpf?.images[0]?.size ?? 0) - (before.mpf?.images[0]?.size ?? 0);
    for (let index = 1; index < 3; index += 1) {
      expect(after.mpf?.images[index]?.absoluteOffset).toBe((before.mpf?.images[index]?.absoluteOffset ?? 0) + delta);
      expect(after.mpf?.images[index]?.size).toBe(before.mpf?.images[index]?.size);
    }
    expect(rewritten.data.slice(-3)).toEqual(Uint8Array.of(7, 6, 5));
    expect(rewritten.mpf?.images).toHaveLength(3);
    expect(rewritten.mpf?.images.every((imageEntry) => imageEntry.encodedPayloads.every((payload) => payload.before.sha256 === payload.after.sha256))).toBe(true);
    const afterFirst = after.mpf?.images[1];
    const afterSecond = after.mpf?.images[2];
    if (afterFirst?.absoluteOffset === null || afterFirst === undefined || afterSecond?.absoluteOffset === null || afterSecond === undefined) throw new Error("secondary image gaps were not decoded");
    expect(rewritten.data.slice(afterFirst.absoluteOffset + afterFirst.size, afterSecond.absoluteOffset)).toEqual(segment(0xfe, encoder.encode("metadata between secondary images")));
    expect(rewritten.data.slice(afterSecond.absoluteOffset + afterSecond.size, -3)).toEqual(segment(0xfe, encoder.encode("metadata after secondary images")));
  });

  it("preserves aligned gaps and duplicate metadata around secondary images", () => {
    const source = makeMpfFile(false);
    const sourceResult = parseJpeg(source, DEFAULT_LIMITS);
    const sourceMpf = sourceResult.mpf?.segments[0];
    const sourceSecondary = sourceResult.mpf?.images[1];
    if (sourceMpf === undefined || sourceSecondary?.absoluteOffset === null || sourceSecondary === undefined) throw new Error("MPF gap fixture was not decoded");
    const adjusted = source.slice();
    const storedOffset = sourceSecondary.offset + 1;
    new DataView(adjusted.buffer, adjusted.byteOffset, adjusted.byteLength).setUint32(sourceMpf.sourceOffset + 4 + mpfPayloadOffset(1, 8), storedOffset, true);
    const primaryEnd = sourceResult.mpf?.images[0]?.size ?? 0;
    const input = concat(adjusted.slice(0, primaryEnd), Uint8Array.of(0x00), adjusted.slice(primaryEnd));
    const before = parseJpeg(input, DEFAULT_LIMITS);
    expect(before.mpf?.images[1]?.absoluteOffset).toBe(sourceSecondary.absoluteOffset + 1);
    const rewritten = rewriteJpegMetadata(input, {
      blocks: [
        { op: "add", kind: "standard-xmp", data: "duplicate one" },
        { op: "add", kind: "standard-xmp", data: "duplicate two" },
      ],
      duplicatePolicy: "preserve",
      mpf: { mode: "preserve" },
    });
    const after = parseJpeg(rewritten.data, DEFAULT_LIMITS);
    expect(after.mpf?.complete).toBe(true);
    expect(after.xmp?.packets).toHaveLength(2);
    const afterSecondary = after.mpf?.images[1];
    if (afterSecondary?.absoluteOffset === null || afterSecondary === undefined) throw new Error("rewritten MPF gap was not decoded");
    expect(rewritten.data[afterSecondary.absoluteOffset - 1]).toBe(0x00);
    expect(rewritten.data.slice(afterSecondary.absoluteOffset, afterSecondary.absoluteOffset + afterSecondary.size)).toEqual(input.slice(before.mpf?.images[1]?.absoluteOffset ?? 0, (before.mpf?.images[1]?.absoluteOffset ?? 0) + (before.mpf?.images[1]?.size ?? 0)));
  });

  it("accepts an edited MPF output through the secondary metadata oracle", async () => {
    const input = makeMpfFile(false);
    const output = rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "standard-xmp", data: "oracle metadata" }], mpf: { mode: "preserve" } }).data;
    const directory = await mkdtemp(join(tmpdir(), "t05-mpf-oracle-"));
    const path = join(directory, "edited.mpo");
    try {
      await writeFile(path, output);
      const oracle = await exiftool.read(path, { readArgs: ["-ee", "-G1", "-n"] });
      expect((oracle as unknown as Record<string, unknown>)["MPF0:NumberOfImages"]).toBe(2);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("refuses incomplete, overlapping, and ambiguous MPF relationships atomically", () => {
    const malformed = makeMpfFile(false, false, (payload) => new DataView(payload.buffer, payload.byteOffset, payload.byteLength).setUint32(mpfPayloadOffset(1, 8), 0, true));
    const source = malformed.slice();
    expect(() => rewriteJpegMetadata(malformed, { blocks: [{ op: "add", kind: "standard-xmp", data: "x" }], mpf: { mode: "preserve" } })).toThrow(/MPF|primary|overlap|ambiguous/);
    expect(malformed).toEqual(source);
    const incomplete = makeMpfFile(false).slice(0, -3);
    expect(() => rewriteJpegMetadata(incomplete, { blocks: [{ op: "add", kind: "standard-xmp", data: "x" }], mpf: { mode: "preserve" } })).toThrow();
  });
});
