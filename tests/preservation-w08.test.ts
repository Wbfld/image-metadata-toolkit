import { describe, expect, it } from "vitest";

import { verifyPreservation, verifyPreservationSync } from "../src/preservation.js";
import { rewriteJpegMetadata } from "../src/jpeg-writer.js";
import { rewritePngMetadata } from "../src/png-writer.js";
import { rewriteWebpMetadata } from "../src/webp-writer.js";
import { parseMetadata } from "../src/index.js";
import { getImageDetails } from "../src/details.js";
import { getRotation } from "../src/convenience.js";
import type { MetadataInput } from "../src/types.js";

const encoder = new TextEncoder();

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}

function crc32(bytes: Uint8Array, start: number, end: number): number {
  let crc = 0xffffffff;
  for (let offset = start; offset < end; offset += 1) {
    crc ^= bytes[offset] ?? 0;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length + 12);
  const view = new DataView(result.buffer);
  view.setUint32(0, data.length);
  result.set(encoder.encode(type), 4);
  result.set(data, 8);
  view.setUint32(data.length + 8, crc32(result, 4, data.length + 8));
  return result;
}

function png(width = 2, height = 2, chunks: readonly Uint8Array[] = []): Uint8Array {
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width); view.setUint32(4, height); ihdr.set([8, 6, 0, 0, 0], 8);
  return concat(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), pngChunk("IHDR", ihdr), ...chunks, pngChunk("IDAT", Uint8Array.of(1, 2, 3, 4)), pngChunk("IEND", new Uint8Array()));
}

function webpChunk(type: string, data: Uint8Array): Uint8Array {
  const result = new Uint8Array(8 + data.length + (data.length & 1));
  result.set(encoder.encode(type), 0); new DataView(result.buffer).setUint32(4, data.length, true); result.set(data, 8); return result;
}

function webp(chunks: readonly Uint8Array[]): Uint8Array {
  const body = concat(...chunks); const result = new Uint8Array(body.length + 12);
  result.set(encoder.encode("RIFF"), 0); new DataView(result.buffer).setUint32(4, body.length + 4, true); result.set(encoder.encode("WEBP"), 8); result.set(body, 12); return result;
}

function vp8x(flags = 0x12): Uint8Array { return webpChunk("VP8X", Uint8Array.of(flags, 0, 0, 0, 1, 0, 0, 1, 0, 0)); }
function vp8(): Uint8Array { return webpChunk("VP8 ", Uint8Array.of(0, 0, 0, 0x9d, 1, 0x2a, 2, 0, 2, 0)); }
function jpeg(): Uint8Array {
  const sof = Uint8Array.from([0xff, 0xc0, 0, 11, 8, 0, 2, 0, 2, 1, 1, 0x11, 0]);
  const sos = Uint8Array.from([0xff, 0xda, 0, 8, 1, 1, 0, 0, 0x3f, 0]);
  return concat(Uint8Array.of(0xff, 0xd8), sof, sos, Uint8Array.of(1, 2, 3, 4, 5), Uint8Array.of(0xff, 0xd9));
}

function jpegWithOrientation(): Uint8Array {
  const tiff = Uint8Array.from([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 1, 0, 0x12, 0x01, 0x03, 0, 1, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0]);
  const exif = concat(encoder.encode("Exif\0\0"), tiff);
  const app1 = concat(Uint8Array.of(0xff, 0xe1, (exif.length + 2) >>> 8, (exif.length + 2) & 0xff), exif);
  const base = jpeg();
  return concat(base.subarray(0, 2), app1, base.subarray(2));
}

function jpegWithApp1(payload: Uint8Array): Uint8Array {
  const base = jpeg();
  const app1 = concat(Uint8Array.of(0xff, 0xe1, (payload.length + 2) >>> 8, (payload.length + 2) & 0xff), payload);
  return concat(base.subarray(0, 2), app1, base.subarray(2));
}

function mutateRange(source: Uint8Array, offset: number): Uint8Array { const result = source.slice(); result[offset] = (result[offset] ?? 0) ^ 0x01; return result; }

describe("W08 public preservation verifier", () => {
  it("returns complete JSON-safe JPEG evidence and detects a one-byte scan mutation", () => {
    const input = jpeg();
    const unchanged = verifyPreservationSync(input, input);
    expect(unchanged.successful).toBe(true);
    expect(unchanged.status).toBe("passed");
    expect(unchanged.payloads).toHaveLength(1);
    expect(unchanged.payloads[0]?.kind).toBe("jpeg-scan");
    expect(unchanged.payloads[0]?.before?.sha256).toMatch(/^[a-f0-9]{64}$/u);
    expect(unchanged.pixelEquivalence).toBe("not-claimed");
    expect(() => JSON.stringify(unchanged)).not.toThrow();

    const changed = verifyPreservationSync(input, mutateRange(input, 25));
    expect(changed.successful).toBe(false);
    expect(changed.payloadSummary.mismatchedCount).toBe(1);
    expect(changed.payloads[0]?.status).toBe("mismatched");
    expect(verifyPreservationSync(input.slice(0, -1), input).successful).toBe(false);
  });

  it("detects one-byte changes in PNG IDAT and fdAT protected categories", () => {
    const input = png(2, 2, [pngChunk("acTL", Uint8Array.of(0, 0, 0, 2, 0, 0, 0, 0)), pngChunk("fcTL", Uint8Array.from({ length: 26 }, (_, index) => index)), pngChunk("fdAT", Uint8Array.of(0, 0, 0, 1, 7, 8))]);
    const idatOffset = input.findIndex((value, index) => value === 0x49 && input[index + 1] === 0x44 && input[index + 2] === 0x41 && input[index + 3] === 0x54) + 4;
    const fdatOffset = input.findIndex((value, index) => value === 0x66 && input[index + 1] === 0x64 && input[index + 2] === 0x41 && input[index + 3] === 0x54) + 8;
    const idatChanged = verifyPreservationSync(input, mutateRange(input, idatOffset));
    expect(idatChanged.successful).toBe(false);
    expect(idatChanged.payloads.find(({ kind }) => kind === "png-IDAT")?.status).toBe("mismatched");
    expect(idatChanged.payloadSummary.mismatchedCount).toBe(1);
    const fdatChanged = verifyPreservationSync(input, mutateRange(input, fdatOffset));
    expect(fdatChanged.successful).toBe(false);
    expect(fdatChanged.payloads.find(({ kind }) => kind === "png-fdAT")?.status).toBe("mismatched");
    expect(fdatChanged.payloadSummary.mismatchedCount).toBe(1);
  });

  it("compares WebP VP8, VP8L, ALPH, and ANMF payload categories independently", () => {
    const input = webp([vp8x(), webpChunk("ALPH", Uint8Array.of(1, 2, 3)), webpChunk("ANIM", Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 0)), webpChunk("ANMF", Uint8Array.of(4, 5, 6)), webpChunk("VP8L", Uint8Array.of(0x2f, 1, 0x40, 0, 0))]);
    const kinds = ["webp-ALPH", "webp-ANMF", "webp-VP8L"] as const;
    for (const kind of kinds) {
      const range = verifyPreservationSync(input, input).payloads.find((candidate) => candidate.kind === kind)?.before;
      if (range === undefined || range === null) throw new Error(`Missing ${kind} evidence.`);
      const changed = verifyPreservationSync(input, mutateRange(input, range.offset));
      expect(changed.successful).toBe(false);
      expect(changed.payloads.find((candidate) => candidate.kind === kind)?.status).toBe("mismatched");
    }
  });

  it("enforces dimensions, relationships, policies, limits, and incomplete extraction explicitly", () => {
    const input = png();
    const changedDimensions = input.slice();
    const widthOffset = 16;
    changedDimensions[widthOffset + 3] = 3;
    const widthChunkEnd = 8 + 8 + 13;
    new DataView(changedDimensions.buffer).setUint32(widthChunkEnd, crc32(changedDimensions, 12, widthChunkEnd));
    const dimensions = verifyPreservationSync(input, changedDimensions);
    expect(dimensions.successful).toBe(false);
    expect(dimensions.dimensions.status).toBe("mismatched");

    const withIcc = png(2, 2, [pngChunk("iCCP", encoder.encode("profile\0\0"))]);
    const reportOnly = verifyPreservationSync(input, withIcc, { colorPolicy: "report-only" });
    expect(reportOnly.color.status).toBe("reported-change");
    expect(reportOnly.successful).toBe(true);
    const allowed = verifyPreservationSync(input, withIcc, { colorPolicy: "allow-change" });
    expect(allowed.color.status).toBe("allowed-change");

    const tiff = Uint8Array.from([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 0, 0, 0, 0]);
    const incomplete = verifyPreservationSync(tiff, tiff);
    expect(incomplete.successful).toBe(false);
    expect(incomplete.extraction.complete).toBe(false);
    expect(incomplete.pixelEquivalence).toBe("not-claimed");
    const limited = verifyPreservationSync(input, input, { limits: { maxInputBytes: 4 } });
    expect(limited.successful).toBe(false);
    expect(limited.diagnostics.join(" ")).toContain("maxInputBytes");
  });

  it("is used by the existing writers and accepts Blob inputs through the async API", async () => {
    const input = jpeg();
    const writer = rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "standard-xmp", data: "writer" }] });
    expect(writer.preservation?.successful).toBe(true);
    const pngWriter = await rewritePngMetadata(png(), { blocks: [{ op: "add", kind: "xmp", data: "writer" }] });
    expect(pngWriter.preservation?.successful).toBe(true);
    const webpWriter = rewriteWebpMetadata(webp([vp8x(0), webpChunk("VP8L", Uint8Array.of(0x2f, 1, 0x40, 0, 0))]), { blocks: [{ op: "add", kind: "xmp", data: "writer" }] });
    expect(webpWriter.preservation?.successful).toBe(true);
    expect(rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "standard-xmp", data: "skip verification" }], verify: false }).preservation).toBeNull();
    expect((await rewritePngMetadata(png(), { blocks: [{ op: "add", kind: "xmp", data: "skip verification" }], verify: false })).preservation).toBeNull();
    expect(rewriteWebpMetadata(webp([vp8x(0), webpChunk("VP8L", Uint8Array.of(0x2f, 1, 0x40, 0, 0))]), { blocks: [{ op: "add", kind: "xmp", data: "skip verification" }], verify: false }).preservation).toBeNull();
    expect(() => rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "standard-xmp", data: "invalid options" }], preservation: { colorPolicy: "invalid" as "preserve" } })).toThrow();
    await expect(rewritePngMetadata(png(), { blocks: [{ op: "add", kind: "xmp", data: "invalid options" }], preservation: { requireCompletePayloadExtraction: "invalid" as unknown as boolean } })).rejects.toThrow();
    expect(() => rewriteWebpMetadata(webp([vp8x(0), webpChunk("VP8L", Uint8Array.of(0x2f, 1, 0x40, 0, 0))]), { blocks: [{ op: "add", kind: "xmp", data: "invalid options" }], preservation: { orientationPolicy: "invalid" as "preserve" } })).toThrow();
    const report = await verifyPreservation(new Blob([input.buffer as ArrayBuffer]), new Blob([writer.data.buffer as ArrayBuffer]));
    expect(report.successful).toBe(true);
    expect(report.payloadSummary.comparableCount).toBeGreaterThan(0);
  });

  it("keeps the existing detail and orientation APIs aligned with verifier facts", async () => {
    const parsed = await parseMetadata(jpegWithOrientation());
    expect(getImageDetails(parsed).storedDimensions[0]?.value).toEqual({ width: 2, height: 2 });
    const rotation = getRotation({ ...parsed, transform: { rotation: 90, mirrored: false } });
    expect(rotation?.degrees).toBe(90);
    expect(rotation?.conflicts).toEqual([]);
  });

  it("fails closed for malformed bounded JPEG, PNG, and WebP structures", () => {
    const validJpeg = jpeg();
    expect(verifyPreservationSync(validJpeg.slice(0, -1), validJpeg).successful).toBe(false);
    const nonMarker = validJpeg.slice(); nonMarker[2] = 0;
    expect(verifyPreservationSync(nonMarker, validJpeg).successful).toBe(false);
    const secondSoi = validJpeg.slice(); secondSoi[2] = 0xff; secondSoi[3] = 0xd8;
    expect(verifyPreservationSync(secondSoi, validJpeg).successful).toBe(false);
    expect(verifyPreservationSync(validJpeg, validJpeg, { limits: { maxSegmentBytes: 1 } }).successful).toBe(false);
    const badLength = validJpeg.slice(); badLength[4] = 0xff; badLength[5] = 0xff;
    expect(verifyPreservationSync(badLength, validJpeg).successful).toBe(false);

    const validPng = png();
    const badPngType = validPng.slice(); badPngType[12] = 0;
    expect(verifyPreservationSync(badPngType, validPng).successful).toBe(false);
    const oversizedPng = validPng.slice(); oversizedPng[11] = 0xff;
    expect(verifyPreservationSync(oversizedPng, validPng).successful).toBe(false);
    expect(verifyPreservationSync(validPng, validPng, { limits: { maxSegmentBytes: 1 } }).successful).toBe(false);
    expect(verifyPreservationSync(validPng.slice(0, -12), validPng).successful).toBe(false);
    const shortFrameControl = png(2, 2, [pngChunk("fcTL", Uint8Array.of(1, 2, 3))]);
    expect(verifyPreservationSync(shortFrameControl, validPng).successful).toBe(false);
    const shortFrameData = png(2, 2, [pngChunk("fdAT", Uint8Array.of(1, 2, 3))]);
    expect(verifyPreservationSync(shortFrameData, validPng).successful).toBe(false);
    const badAnimation = png(2, 2, [pngChunk("acTL", Uint8Array.of(0, 0, 0, 1, 0, 0, 0))]);
    expect(verifyPreservationSync(badAnimation, validPng).successful).toBe(false);
    const unsupportedCritical = png(2, 2, [pngChunk("ABCD", Uint8Array.of(1))]);
    expect(verifyPreservationSync(unsupportedCritical, validPng).successful).toBe(false);

    const validWebp = webp([vp8x(0), vp8()]);
    const badRiff = validWebp.slice(); badRiff[4] = 0;
    expect(verifyPreservationSync(badRiff, validWebp).successful).toBe(false);
    const badChunkLength = validWebp.slice(); badChunkLength[16] = 0xff;
    expect(verifyPreservationSync(badChunkLength, validWebp).successful).toBe(false);
    const badChunkType = validWebp.slice(); badChunkType[12] = 0;
    expect(verifyPreservationSync(badChunkType, validWebp).successful).toBe(false);
    expect(verifyPreservationSync(validWebp, validWebp, { limits: { maxSegmentBytes: 1 } }).successful).toBe(false);
    expect(verifyPreservationSync(webp([webpChunk("JUNK", Uint8Array.of(1, 2))]), validWebp).successful).toBe(false);
    expect(verifyPreservationSync(webp([webpChunk("VP8X", Uint8Array.of(0))]), validWebp).successful).toBe(false);
    expect(verifyPreservationSync(webp([webpChunk("VP8L", Uint8Array.of(0))]), validWebp).successful).toBe(false);
  });

  it("reports comparison states rather than converting missing or unsupported values into matches", async () => {
    const input = png();
    const withSecondIdat = png(2, 2, [pngChunk("IDAT", Uint8Array.of(9, 8))]);
    const missing = verifyPreservationSync(input, withSecondIdat);
    expect(missing.successful).toBe(false);
    expect(missing.payloadSummary.missingBeforeCount).toBe(1);
    const changedCategory = verifyPreservationSync(input, png(2, 2, [pngChunk("fdAT", Uint8Array.of(0, 0, 0, 1, 9))]));
    expect(changedCategory.payloadSummary.nonComparableCount).toBeGreaterThan(0);
    expect(changedCategory.payloads.some(({ status }) => status === "not-comparable")).toBe(true);
    const formatChange = verifyPreservationSync(jpeg(), input);
    expect(formatChange.successful).toBe(false);
    expect(formatChange.dimensions.status).toBe("mismatched");
    const incompleteAllowed = verifyPreservationSync(Uint8Array.from([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 0, 0, 0, 0]), Uint8Array.from([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 0, 0, 0, 0]), { requireCompletePayloadExtraction: false });
    expect(incompleteAllowed.extraction.complete).toBe(false);
    expect(incompleteAllowed.successful).toBe(true);
    const arrayBuffer = await verifyPreservation(input.buffer as ArrayBuffer, input.buffer as ArrayBuffer);
    expect(arrayBuffer.successful).toBe(true);
    const dataView = await verifyPreservation(new DataView(input.buffer), new DataView(input.buffer));
    expect(dataView.successful).toBe(true);
    const invalidLimits = verifyPreservationSync(input, input, { limits: { maxInputBytes: 0 } });
    expect(invalidLimits.successful).toBe(false);
    expect(invalidLimits.input).toBeNull();
    const oversized = verifyPreservationSync(input, input, { limits: { maxInputBytes: 4 } });
    expect(oversized.input?.sha256).toBeNull();
  });

  it("retains bounded handling for alternate byte orders, orientation records, marker forms, and image headers", () => {
    const malformedExifPayloads = [
      new Uint8Array(),
      encoder.encode("Exif\0\0II"),
      encoder.encode("Exif\0\0MM\0\0"),
      encoder.encode("Exif\0\0II*\0\xff\xff\xff\xff"),
      encoder.encode("Exif\0\0II*\0\x08\0\0\0\xff\xff"),
      Uint8Array.from([0x45, 0x78, 0x69, 0x66, 0, 0, 0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      jpegWithOrientation().subarray(4, 4 + 32),
    ];
    for (const payload of malformedExifPayloads) {
      const report = verifyPreservationSync(jpegWithApp1(payload), jpegWithApp1(payload));
      expect(report.successful).toBe(true);
      expect(report.orientation.status).toBe("matched");
    }
    const bigEndianExif = Uint8Array.from([0x45, 0x78, 0x69, 0x66, 0, 0, 0x4d, 0x4d, 0, 0x2a, 0, 0, 0, 8, 0, 1, 0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(verifyPreservationSync(jpegWithApp1(bigEndianExif), jpegWithApp1(bigEndianExif)).orientation.before).toEqual([6]);

    const restartScan = concat(Uint8Array.of(0xff, 0xd8), Uint8Array.from([0xff, 0xc0, 0, 11, 8, 0, 2, 0, 2, 1, 1, 0x11, 0]), Uint8Array.from([0xff, 0xda, 0, 8, 1, 1, 0, 0, 0x3f, 0]), Uint8Array.of(1, 0xff, 0, 2, 0xff, 0xd0, 3), Uint8Array.from([0xff, 0xd9]));
    expect(verifyPreservationSync(restartScan, restartScan).payloadSummary.comparableCount).toBe(1);
    const temMarker = concat(Uint8Array.of(0xff, 0xd8, 0xff, 0x01), jpeg().subarray(2));
    expect(verifyPreservationSync(temMarker, temMarker).successful).toBe(true);
    const invalidVp8l = webp([webpChunk("VP8L", Uint8Array.of(0x2f, 1, 0x40, 0, 0xe0))]);
    expect(verifyPreservationSync(invalidVp8l, invalidVp8l).successful).toBe(false);
    const nonKeyVp8 = webp([webpChunk("VP8 ", Uint8Array.of(1, 0, 0, 0x9d, 1, 0x2a, 2, 0, 2, 0))]);
    expect(verifyPreservationSync(nonKeyVp8, nonKeyVp8).successful).toBe(false);
  });

  it("exercises fail-closed boundary branches for malformed offsets, markers, chunks, and policies", async () => {
    const validJpeg = jpeg();
    const invalidOrientation = jpegWithOrientation();
    const orientationOffset = invalidOrientation.findIndex((value, index) => value === 6 && invalidOrientation[index - 1] === 0);
    if (orientationOffset < 0) throw new Error("Could not locate the test orientation value.");
    invalidOrientation[orientationOffset] = 9;
    expect(verifyPreservationSync(invalidOrientation, invalidOrientation).orientation.before).toEqual([]);

    const unknownExif = jpegWithApp1(encoder.encode("Exif\0\0XX"));
    expect(verifyPreservationSync(unknownExif, unknownExif).successful).toBe(true);
    const invalidTiffOffset = jpegWithApp1(Uint8Array.from([0x45, 0x78, 0x69, 0x66, 0, 0, 0x49, 0x49, 0x2a, 0, 0xff, 0xff, 0xff, 0xff]));
    expect(verifyPreservationSync(invalidTiffOffset, invalidTiffOffset).successful).toBe(true);
    const noLength = validJpeg.slice(); noLength[4] = 0; noLength[5] = 1;
    expect(verifyPreservationSync(noLength, validJpeg).successful).toBe(false);
    const standaloneRestart = concat(Uint8Array.of(0xff, 0xd8, 0xff, 0xd0), validJpeg.subarray(2));
    expect(verifyPreservationSync(standaloneRestart, validJpeg).successful).toBe(false);
    const outsideScan = concat(Uint8Array.of(0xff, 0xd8, 0x01), validJpeg.subarray(2));
    expect(verifyPreservationSync(outsideScan, validJpeg).successful).toBe(false);
    const noMarkerTerminator = concat(Uint8Array.of(0xff, 0xd8), validJpeg.subarray(2, -2), Uint8Array.of(1));
    expect(verifyPreservationSync(noMarkerTerminator, validJpeg).successful).toBe(false);
    const shortSof = concat(Uint8Array.of(0xff, 0xd8, 0xff, 0xc0, 0, 5, 8, 0, 2), Uint8Array.of(0xff, 0xd9));
    expect(verifyPreservationSync(shortSof, shortSof).successful).toBe(false);
    const malformedSof = concat(Uint8Array.of(0xff, 0xd8, 0xff, 0xc0, 0, 9, 8, 0, 2, 0, 2, 1), Uint8Array.of(0xff, 0xd9));
    expect(verifyPreservationSync(malformedSof, malformedSof).successful).toBe(false);
    const malformedSos = concat(Uint8Array.of(0xff, 0xd8), Uint8Array.from([0xff, 0xc0, 0, 11, 8, 0, 2, 0, 2, 1, 1, 0x11, 0]), Uint8Array.from([0xff, 0xda, 0, 5, 0, 0, 0]), Uint8Array.of(0xff, 0xd9));
    expect(verifyPreservationSync(malformedSos, malformedSos).successful).toBe(false);
    const missingEoi = validJpeg.slice(0, -2);
    expect(verifyPreservationSync(missingEoi, missingEoi).successful).toBe(false);
    expect(verifyPreservationSync(validJpeg, validJpeg, { limits: { maxSegments: 1 } }).successful).toBe(false);
    const repeatedFill = concat(Uint8Array.of(0xff, 0xd8), Uint8Array.from([0xff, 0xc0, 0, 11, 8, 0, 2, 0, 2, 1, 1, 0x11, 0]), Uint8Array.from([0xff, 0xda, 0, 8, 1, 1, 0, 0, 0x3f, 0]), Uint8Array.of(1, 0xff, 0xff, 0xd0, 3), Uint8Array.of(0xff, 0xd9));
    expect(verifyPreservationSync(repeatedFill, repeatedFill).successful).toBe(true);
    const scanTrailingFill = concat(Uint8Array.of(0xff, 0xd8), Uint8Array.from([0xff, 0xc0, 0, 11, 8, 0, 2, 0, 2, 1, 1, 0x11, 0]), Uint8Array.from([0xff, 0xda, 0, 8, 1, 1, 0, 0, 0x3f, 0]), Uint8Array.of(1, 0xff, 0xff));
    expect(verifyPreservationSync(scanTrailingFill, scanTrailingFill).successful).toBe(false);
    const rawBetweenMarkers = concat(Uint8Array.of(0xff, 0xd8, 0xff, 0x01, 1), validJpeg.subarray(2));
    expect(verifyPreservationSync(rawBetweenMarkers, rawBetweenMarkers).successful).toBe(false);
    expect(verifyPreservationSync(Uint8Array.of(0xff, 0xd8, 0xff), Uint8Array.of(0xff, 0xd8, 0xff)).successful).toBe(false);
    const shortTiffHeader = jpegWithApp1(encoder.encode("Exif\0\0II*\0"));
    expect(verifyPreservationSync(shortTiffHeader, shortTiffHeader).successful).toBe(true);
    const truncatedIfd = jpegWithApp1(Uint8Array.from([0x45, 0x78, 0x69, 0x66, 0, 0, 0x49, 0x49, 0x2a, 0, 8, 0, 0, 0]));
    expect(verifyPreservationSync(truncatedIfd, truncatedIfd).successful).toBe(true);
    const excessiveIfd = jpegWithApp1(Uint8Array.from([0x45, 0x78, 0x69, 0x66, 0, 0, 0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 0xff, 0xff]));
    expect(verifyPreservationSync(excessiveIfd, excessiveIfd).successful).toBe(true);
    const invalidStandaloneMarkers = [0xd8, 0xd0, 0x00].map((marker) => concat(Uint8Array.of(0xff, 0xd8, 0xff, marker), validJpeg.subarray(2)));
    for (const malformed of invalidStandaloneMarkers) expect(verifyPreservationSync(malformed, malformed).successful).toBe(false);

    const validPng = png();
    const noImageData = concat(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), pngChunk("IHDR", Uint8Array.from([0, 0, 0, 2, 0, 0, 0, 2, 8, 6, 0, 0, 0])), pngChunk("IEND", new Uint8Array()));
    expect(verifyPreservationSync(noImageData, noImageData).successful).toBe(false);
    const duplicateIhdr = concat(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), pngChunk("IHDR", Uint8Array.from([0, 0, 0, 2, 0, 0, 0, 2, 8, 6, 0, 0, 0])), pngChunk("IHDR", Uint8Array.from([0, 0, 0, 2, 0, 0, 0, 2, 8, 6, 0, 0, 0])), pngChunk("IDAT", Uint8Array.of(1)), pngChunk("IEND", new Uint8Array()));
    expect(verifyPreservationSync(duplicateIhdr, duplicateIhdr).successful).toBe(false);
    const invalidHeader = concat(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), pngChunk("IHDR", Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 2, 8, 6, 0, 0, 0])), pngChunk("IDAT", Uint8Array.of(1)), pngChunk("IEND", new Uint8Array()));
    expect(verifyPreservationSync(invalidHeader, invalidHeader).successful).toBe(false);
    const invalidColor = concat(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), pngChunk("IHDR", Uint8Array.from([0, 0, 0, 2, 0, 0, 0, 2, 8, 7, 0, 0, 0])), pngChunk("IDAT", Uint8Array.of(1)), pngChunk("IEND", new Uint8Array()));
    expect(verifyPreservationSync(invalidColor, invalidColor).successful).toBe(false);
    const nonIhdrFirst = concat(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), pngChunk("IDAT", Uint8Array.of(1)), pngChunk("IEND", new Uint8Array()));
    expect(verifyPreservationSync(nonIhdrFirst, nonIhdrFirst).successful).toBe(false);
    const nonzeroIend = validPng.slice();
    const iendDataOffset = nonzeroIend.lastIndexOf(0x49);
    nonzeroIend[iendDataOffset - 4] = 1;
    expect(verifyPreservationSync(nonzeroIend, nonzeroIend).successful).toBe(false);
    const ancillaryCrc = validPng.slice();
    const idatTypeOffset = ancillaryCrc.findIndex((value, index) => value === 0x49 && ancillaryCrc[index + 1] === 0x44 && ancillaryCrc[index + 2] === 0x41 && ancillaryCrc[index + 3] === 0x54);
    ancillaryCrc[idatTypeOffset + 4] = (ancillaryCrc[idatTypeOffset + 4] ?? 0) ^ 1;
    expect(verifyPreservationSync(ancillaryCrc, ancillaryCrc).successful).toBe(false);
    const withTransparency = png(2, 2, [pngChunk("tRNS", Uint8Array.of(0))]);
    expect(verifyPreservationSync(withTransparency, withTransparency).successful).toBe(true);
    expect(verifyPreservationSync(validPng, validPng, { limits: { maxPngChunks: 1 } }).successful).toBe(false);
    expect(verifyPreservationSync(validPng, validPng, { colorPolicy: "preserve" }).successful).toBe(true);
    expect(verifyPreservationSync(validPng, png(3, 2), { colorPolicy: "preserve" }).successful).toBe(false);
    const orientationChanged = verifyPreservationSync(jpegWithOrientation(), jpeg(), { orientationPolicy: "preserve" });
    expect(orientationChanged.orientation.status).toBe("mismatched");
    expect(orientationChanged.successful).toBe(false);
    expect(verifyPreservationSync(jpegWithOrientation(), jpeg(), { orientationPolicy: "report-only" }).orientation.status).toBe("reported-change");
    expect(verifyPreservationSync(jpegWithOrientation(), jpeg(), { orientationPolicy: "allow-change" }).orientation.status).toBe("allowed-change");

    const noVp8x = webp([webpChunk("VP8 ", Uint8Array.of(0x10, 0, 0, 0x9d, 1, 0x2a, 2, 0, 2, 0))]);
    expect(verifyPreservationSync(noVp8x, noVp8x).successful).toBe(true);
    const twoChunkWebp = webp([webpChunk("JUNK", Uint8Array.of(1)), webpChunk("VP8 ", Uint8Array.of(0x10, 0, 0, 0x9d, 1, 0x2a, 2, 0, 2, 0))]);
    expect(verifyPreservationSync(twoChunkWebp, twoChunkWebp, { limits: { maxSegments: 1 } }).successful).toBe(false);
    expect(verifyPreservationSync(Uint8Array.from([0x52, 0x49, 0x46, 0x46, 4, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]), Uint8Array.from([0x52, 0x49, 0x46, 0x46, 4, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])).successful).toBe(false);
    const duplicateVp8x = webp([vp8x(), vp8x(), vp8()]);
    expect(verifyPreservationSync(duplicateVp8x, duplicateVp8x).successful).toBe(false);
    const misplacedVp8x = webp([webpChunk("JUNK", Uint8Array.of(1)), vp8x(), vp8()]);
    expect(verifyPreservationSync(misplacedVp8x, misplacedVp8x).successful).toBe(false);
    const invalidWebpDimensions = webp([webpChunk("VP8 ", Uint8Array.of(0, 0, 0, 0x9d, 1, 0x2a, 0, 0, 0, 0))]);
    expect(verifyPreservationSync(invalidWebpDimensions, invalidWebpDimensions).successful).toBe(false);
    const invalidWebpChunk = webp([webpChunk("VP8 ", Uint8Array.of(0, 0, 0, 0x9d, 1, 0x2a, 2, 0, 2, 0)).subarray(0, 9)]);
    expect(verifyPreservationSync(invalidWebpChunk, invalidWebpChunk).successful).toBe(false);
    const fewerPayloads = verifyPreservationSync(webp([vp8x(), vp8()]), webp([vp8x()]));
    expect(fewerPayloads.payloadSummary.missingAfterCount).toBeGreaterThan(0);
    const twoIdat = png(2, 2, [pngChunk("IDAT", Uint8Array.of(9))]);
    const oneIdat = png();
    expect(verifyPreservationSync(twoIdat, oneIdat).payloadSummary.missingAfterCount).toBe(1);
    const changedColor = verifyPreservationSync(png(), png(2, 2, [pngChunk("iCCP", encoder.encode("p\0\0"))]), { colorPolicy: "preserve" });
    expect(changedColor.successful).toBe(false);

    const invalidSyncInput = verifyPreservationSync(null as unknown as Uint8Array, validPng);
    expect(invalidSyncInput.successful).toBe(false);
    const invalidAsyncInput = await verifyPreservation({} as MetadataInput, validPng);
    expect(invalidAsyncInput.successful).toBe(false);
  });
});
