import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { createByteSource } from "../src/io/byte-source.js";
import { materializeHeifMetadata } from "../src/heif-range.js";
import { materializeJpegMetadata } from "../src/jpeg-range.js";
import { materializeMetadata } from "../src/input.js";
import { materializeTiffMetadata } from "../src/tiff-range.js";
import { parseHeif, parseHeifDimensions } from "../src/parsers/heif.js";
import { parseTiffMetadata } from "../src/parsers/tiff.js";
import { parseJxl } from "../src/parsers/jxl.js";
import { hasC2paInventoryCandidate, inventoryJumbfC2pa } from "../src/trust/jumbf.js";
import { resolveLimits } from "../src/security/limits.js";
import { resolveSelection } from "../src/selection.js";
import { MetadataError } from "../src/types.js";
import { parseMetadata } from "../src/index.js";
import type { BlobReader } from "../src/input.js";

const encoder = new TextEncoder();
const allGroups = resolveSelection({ groups: ["Dimensions", "EXIF", "XMP", "ICC", "IPTC", "JFIF", "MPF", "PNGText"] });
const limits = resolveLimits({
  maxInputBytes: 128 * 1024,
  maxMetadataBytes: 32 * 1024,
  maxSegmentBytes: 16 * 1024,
  maxValueBytes: 16 * 1024,
  maxStringBytes: 16 * 1024,
  maxWarnings: 64,
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

function blobOf(bytes: Uint8Array): Blob {
  return new Blob([new Uint8Array(bytes).buffer]);
}

function segment(marker: number, payload: Uint8Array): Uint8Array {
  const length = payload.length + 2;
  return concat(Uint8Array.of(0xff, marker, length >>> 8, length & 0xff), payload);
}

function scanJpeg(parts: readonly Uint8Array[] = [], scan = Uint8Array.of(1, 2, 3)): Uint8Array {
  const sof = segment(0xc0, Uint8Array.of(8, 0, 3, 0, 4, 1, 1, 0x11, 0));
  const sos = segment(0xda, Uint8Array.of(1, 1, 0, 0, 63, 0));
  return concat(Uint8Array.of(0xff, 0xd8), ...parts, sof, sos, scan, Uint8Array.of(0xff, 0xd9));
}

function readerFor(bytes: Uint8Array, shortAt?: number): BlobReader {
  let bytesRead = 0;
  let readRequests = 0;
  return {
    size: bytes.length,
    read: async (start, end) => {
      readRequests += 1;
      const actualEnd = shortAt !== undefined && start < shortAt && shortAt < end ? shortAt : end;
      const result = bytes.slice(start, actualEnd);
      bytesRead += result.length;
      return await Promise.resolve(result);
    },
    bytesRead: () => bytesRead,
    telemetry: () => ({ readRequests, bytesRead, cacheHits: 0, coalescedReads: 0, cacheBytes: bytesRead }),
  };
}

function readerWithShortCall(bytes: Uint8Array, shortCall: number): BlobReader {
  let call = 0;
  let bytesRead = 0;
  return {
    size: bytes.length,
    read: async (start, end) => {
      const current = call;
      call += 1;
      const actualEnd = current === shortCall && end > start ? end - 1 : end;
      const result = bytes.slice(start, actualEnd);
      bytesRead += result.length;
      return await Promise.resolve(result);
    },
    bytesRead: () => bytesRead,
    telemetry: () => ({ readRequests: call, bytesRead, cacheHits: 0, coalescedReads: 0, cacheBytes: bytesRead }),
  };
}

function be32(value: number): Uint8Array {
  return Uint8Array.of((value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);
}

function le32(value: number): Uint8Array {
  return Uint8Array.of(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function tiff(): Uint8Array {
  const output = new Uint8Array(64);
  output.set([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0]);
  const view = new DataView(output.buffer);
  view.setUint16(8, 2, true);
  view.setUint16(10, 256, true); view.setUint16(12, 4, true); view.setUint32(14, 1, true); view.setUint32(18, 12, true);
  view.setUint16(22, 257, true); view.setUint16(24, 4, true); view.setUint32(26, 1, true); view.setUint32(30, 8, true);
  return output;
}

function bigTiff(littleEndian: boolean): Uint8Array {
  const output = new Uint8Array(72);
  const view = new DataView(output.buffer);
  output.set(littleEndian ? [0x49, 0x49] : [0x4d, 0x4d], 0);
  view.setUint16(2, 43, littleEndian);
  view.setUint16(4, 8, littleEndian);
  view.setUint16(6, 0, littleEndian);
  view.setBigUint64(8, 16n, littleEndian);
  view.setBigUint64(16, 2n, littleEndian);
  view.setUint16(24, 0x0100, littleEndian);
  view.setUint16(26, 16, littleEndian);
  view.setBigUint64(28, 1n, littleEndian);
  view.setBigUint64(36, 640n, littleEndian);
  view.setUint16(44, 0x0101, littleEndian);
  view.setUint16(46, 18, littleEndian);
  view.setBigUint64(48, 1n, littleEndian);
  view.setBigUint64(56, 480n, littleEndian);
  view.setBigUint64(64, 0n, littleEndian);
  return output;
}

function jxlBox(type: string, payload: Uint8Array, extended = false): Uint8Array {
  const typeBytes = encoder.encode(type);
  return extended
    ? concat(be32(1), typeBytes, new Uint8Array(8), be32(16 + payload.length), payload)
    : concat(be32(8 + payload.length), typeBytes, payload);
}

function jxlContainer(boxes: readonly Uint8Array[]): Uint8Array {
  return concat(Uint8Array.of(0, 0, 0, 0x0c, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a), ...boxes);
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length + 12);
  result.set(be32(data.length), 0);
  result.set(encoder.encode(type), 4);
  result.set(data, 8);
  return result;
}

function webpChunk(type: string, data: Uint8Array): Uint8Array {
  return concat(encoder.encode(type), le32(data.length), data, data.length % 2 === 0 ? new Uint8Array() : Uint8Array.of(0));
}

function heifBox(type: string, payload: Uint8Array): Uint8Array {
  return concat(be32(payload.length + 8), encoder.encode(type), payload);
}

function heifFullBox(type: string, payload: Uint8Array, version = 0): Uint8Array {
  return heifBox(type, concat(Uint8Array.of(version, 0, 0, 0), payload));
}

function heifInfe(id: number, type: string, name: string, contentType?: string, version: 2 | 3 = 2): Uint8Array {
  const identity = version === 2
    ? concat(Uint8Array.of(2, 0, 0, 0), Uint8Array.of((id >>> 8) & 0xff, id & 0xff, 0, 0))
    : concat(Uint8Array.of(3, 0, 0, 0), be32(id), Uint8Array.of(0, 0));
  return heifBox("infe", concat(identity, encoder.encode(type), encoder.encode(`${name}\0`), contentType === undefined ? new Uint8Array() : encoder.encode(`${contentType}\0`)));
}

function heifIinf(infos: readonly Uint8Array[], version: 0 | 1): Uint8Array {
  return heifFullBox("iinf", concat(version === 0 ? Uint8Array.of(0, infos.length) : be32(infos.length), ...infos), version);
}

function heifIloc(options: {
  readonly version: 1 | 2;
  readonly id: number;
  readonly method: number;
  readonly dataReferenceIndex?: number;
  readonly offset?: number;
  readonly length?: number;
  readonly index?: number;
}): Uint8Array {
  if (options.version === 1) {
    return heifBox("iloc", concat(
      Uint8Array.of(1, 0, 0, 0, 0x44, 0),
      Uint8Array.of(0, 1),
      Uint8Array.of((options.id >>> 8) & 0xff, options.id & 0xff),
      Uint8Array.of((options.method >>> 8) & 0xff, options.method & 0xff),
      Uint8Array.of(0, options.dataReferenceIndex ?? 0),
      Uint8Array.of(0, 1),
      be32(options.offset ?? 0),
      be32(options.length ?? 1),
    ));
  }
  return heifBox("iloc", concat(
    Uint8Array.of(2, 0, 0, 0, 0x88, 0x48),
    be32(1),
    be32(options.id),
    Uint8Array.of((options.method >>> 8) & 0xff, options.method & 0xff),
    Uint8Array.of(0, options.dataReferenceIndex ?? 0),
    new Uint8Array(8),
    Uint8Array.of(0, 1),
    be32(options.index ?? 1),
    new Uint8Array(8 - 4).fill(0),
    be32(options.offset ?? 0),
    new Uint8Array(8 - 4).fill(0),
    be32(options.length ?? 1),
  ));
}

function heifIlocV0(id: number, offset: number, length: number): Uint8Array {
  return heifBox("iloc", concat(
    Uint8Array.of(0, 0, 0, 0, 0x44, 0),
    Uint8Array.of(0, 1),
    Uint8Array.of((id >>> 8) & 0xff, id & 0xff),
    Uint8Array.of(0, 0),
    Uint8Array.of(0, 1),
    be32(offset),
    be32(length),
  ));
}

function heifIlocMany(entries: readonly { readonly id: number; readonly method: number; readonly offset: number; readonly length: number }[]): Uint8Array {
  return heifBox("iloc", concat(
    Uint8Array.of(1, 0, 0, 0, 0x44, 0),
    Uint8Array.of((entries.length >>> 8) & 0xff, entries.length & 0xff),
    ...entries.map(({ id, method, offset, length }) => concat(
      Uint8Array.of((id >>> 8) & 0xff, id & 0xff),
      Uint8Array.of((method >>> 8) & 0xff, method & 0xff),
      Uint8Array.of(0, 0),
      Uint8Array.of(0, 1),
      be32(offset),
      be32(length),
    )),
  ));
}

function heifContainer(children: readonly Uint8Array[], trailing: Uint8Array = new Uint8Array()): Uint8Array {
  const ftyp = heifBox("ftyp", concat(encoder.encode("heic"), new Uint8Array(4), encoder.encode("mif1")));
  return concat(ftyp, heifBox("meta", concat(new Uint8Array(4), ...children)), trailing);
}

describe("S06 reachable security boundary matrix", () => {
  it("covers invalid source contracts, cache merge failures, and adapter postconditions", async () => {
    expect(() => createByteSource({ size: -1, arrayBuffer: () => Promise.resolve(new ArrayBuffer()) } as unknown as Blob, limits)).toThrow(MetadataError);
    expect(() => createByteSource(42 as never, limits)).toThrow(MetadataError);

    const source = createByteSource(Uint8Array.of(1, 2, 3), limits);
    await expect(source.read(0, 4)).rejects.toMatchObject({ code: "UNSAFE_OFFSET" });
    await expect(source.read(2, 1)).rejects.toMatchObject({ code: "UNSAFE_OFFSET" });

    const badBlob = {
      size: 3,
      slice: () => ({ arrayBuffer: async () => await Promise.resolve(new ArrayBuffer(1)) }),
      arrayBuffer: async () => await Promise.resolve(new ArrayBuffer(3)),
    } as unknown as Blob;
    await expect(createByteSource(badBlob, limits).read(0, 3)).rejects.toMatchObject({ code: "INVALID_VALUE" });

    const abort = new AbortController();
    const pending = createByteSource(Uint8Array.of(1, 2), limits, abort.signal).read(0, 2);
    abort.abort();
    await expect(pending).rejects.toMatchObject({ code: "ABORTED" });
  });

  it("exercises sparse JPEG classification, fill bytes, scans, fallback, and limits", async () => {
    const xmpIdentifier = encoder.encode("http://ns.adobe.com/xap/1.0/\0");
    const iccIdentifier = encoder.encode("ICC_PROFILE\0");
    const forms = [
      new Uint8Array(),
      Uint8Array.of(0xff),
      Uint8Array.of(0xff, 0xd8, 0xff, 0x00),
      Uint8Array.of(0xff, 0xd8, 0xff, 0xd0),
      Uint8Array.of(0xff, 0xd8, 0xff, 0xd9),
      Uint8Array.of(0xff, 0xd8, 0xff, 0xc0, 0, 1),
      concat(Uint8Array.of(0xff, 0xd8), segment(0xe1, xmpIdentifier), scanJpeg().subarray(2)),
      concat(Uint8Array.of(0xff, 0xd8), segment(0xe2, concat(iccIdentifier, Uint8Array.of(1, 1))), scanJpeg().subarray(2)),
      concat(Uint8Array.of(0xff, 0xd8), segment(0xed, Uint8Array.of(1, 2, 3)), scanJpeg().subarray(2)),
      concat(Uint8Array.of(0xff, 0xd8), Uint8Array.of(0xff, 0xff, 0xff, 0x01), scanJpeg().subarray(2)),
    ];
    for (const input of forms) {
      const result = await materializeJpegMetadata(readerFor(input), limits, allGroups);
      expect(result.bytes.length).toBeLessThanOrEqual(input.length);
      expect(result.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
    }
    const large = scanJpeg([segment(0xe1, concat(encoder.encode("Exif\0\0"), new Uint8Array(100))) ]);
    const limited = await materializeJpegMetadata(readerFor(large), resolveLimits({ maxSegmentBytes: 4, maxMetadataBytes: 4 }), resolveSelection({ groups: ["EXIF"] }));
    expect(limited.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
    const short = await materializeJpegMetadata(readerFor(scanJpeg(), 3), limits, allGroups);
    expect(short.partial).toBe(true);
  });

  it("covers PNG/WebP materialization length and metadata-selection fallbacks", async () => {
    const pngSignature = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    const ihdr = Uint8Array.of(0, 0, 0, 1, 8, 6, 0, 0, 0, 0, 0, 0, 0);
    const png = concat(pngSignature, pngChunk("IHDR", ihdr), pngChunk("tEXt", encoder.encode("Title\0hello")), pngChunk("IDAT", Uint8Array.of(1)), pngChunk("IEND", new Uint8Array()));
    const pngNoIend = concat(pngSignature, pngChunk("IHDR", ihdr));
    const pngBadChunk = concat(pngSignature, be32(0xfffffff0), encoder.encode("tEXt"), new Uint8Array(4));
    for (const value of [png, pngNoIend, pngBadChunk]) {
      const result = await materializeMetadata(blobOf(value), limits, allGroups);
      expect(result.bytes.length).toBeLessThanOrEqual(value.length);
    }

    const chunks = [webpChunk("VP8X", new Uint8Array(10)), webpChunk("EXIF", Uint8Array.of(1, 2, 3)), webpChunk("XMP ", encoder.encode("x")), webpChunk("ICCP", Uint8Array.of(4, 5))];
    const webpBody = concat(encoder.encode("WEBP"), ...chunks);
    const webp = concat(encoder.encode("RIFF"), le32(webpBody.length), webpBody);
    const webpTrailing = concat(webp, Uint8Array.of(9));
    const webpBadChunk = concat(encoder.encode("RIFF"), le32(12), encoder.encode("WEBP"), encoder.encode("EXIF"), le32(0xfffffff0));
    for (const value of [webp, webpTrailing, webpBadChunk]) {
      const result = await materializeMetadata(blobOf(value), limits, allGroups);
      expect(result.bytes.length).toBeLessThanOrEqual(value.length);
    }
  });

  it("covers JPEG XL raw/container dimensions, fragment sequencing, and metadata boundaries", async () => {
    const rawVariants = [
      Uint8Array.of(0xff, 0x0a),
      Uint8Array.of(0xff, 0x0a, 0xff),
      Uint8Array.of(0xff, 0x0a, 0x00, 0x00),
      Uint8Array.of(0xff, 0x0a, 0x01, 0x00, 0x00),
    ];
    for (const value of rawVariants) {
      const result = await parseJxl(value, limits, allGroups);
      expect(result.fields).toEqual([]);
      expect(result.warnings.length).toBeGreaterThan(0);
    }
    const complete = jxlContainer([jxlBox("jxlc", Uint8Array.of(0xff, 0x0a, 0, 0, 0, 0))]);
    const partial = jxlContainer([jxlBox("jxlp", concat(Uint8Array.of(0x80, 0, 0, 0), Uint8Array.of(0xff, 0x0a))) ]);
    const gap = jxlContainer([jxlBox("jxlp", concat(Uint8Array.of(0x80, 0, 0, 1), Uint8Array.of(0xff, 0x0a))) ]);
    const extended = jxlContainer([jxlBox("jxlc", Uint8Array.of(0xff, 0x0a), true)]);
    const malformed = jxlContainer([jxlBox("brob", Uint8Array.of(1, 2, 3)), jxlBox("jxlp", Uint8Array.of(0, 0, 0, 0))]);
    for (const value of [complete, partial, gap, extended, malformed]) {
      const result = await parseJxl(value, limits, allGroups, undefined, undefined, async () => await Promise.resolve(new Uint8Array()));
      expect(result.fields).toBeInstanceOf(Array);
      expect(result.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
    }
  });

  it("keeps C2PA inventory bounded for malformed carrier lengths and empty formats", () => {
    const png = concat(Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), pngChunk("caBX", encoder.encode("c2pa")), pngChunk("IEND", new Uint8Array()));
    const webpBody = concat(encoder.encode("WEBP"), webpChunk("C2PA", encoder.encode("jumbf")));
    const webp = concat(encoder.encode("RIFF"), le32(webpBody.length), webpBody);
    const malformedWebp = concat(encoder.encode("RIFF"), le32(20), encoder.encode("WEBP"), encoder.encode("C2PA"), le32(100));
    for (const value of [new Uint8Array(), Uint8Array.of(1), png, webp, malformedWebp]) {
      const result = inventoryJumbfC2pa(value, { limits });
      expect(result.remoteReferencesFetched).toBe(false);
      expect(result.diagnostics.length).toBeLessThanOrEqual(limits.maxWarnings);
    }
  });

  it("exercises versioned HEIF item locations, references, data references, and bounded short reads", async () => {
    const exif = heifContainer([
      heifIinf([heifInfe(1, "Exif", "exif")], 0),
      heifIloc({ version: 1, id: 1, method: 1, offset: 0, length: 4 }),
      heifBox("idat", Uint8Array.of(0x49, 0x49, 0x2a, 0)),
    ]);
    const xmp = heifContainer([
      heifIinf([heifInfe(70000, "mime", "xmp", "application/rdf+xml", 3)], 1),
      heifIloc({ version: 2, id: 70000, method: 1, offset: 0, length: 4, index: 1 }),
      heifBox("idat", encoder.encode("<x/>")),
    ]);
    const baseLocation = heifIloc({ version: 1, id: 1, method: 1, offset: 0, length: 4 });
    const derivedLocation = heifIloc({ version: 1, id: 2, method: 2, offset: 0, length: 2, index: 1 });
    const pairPayload = concat(baseLocation.subarray(8, 14), Uint8Array.of(0, 2), baseLocation.subarray(16), derivedLocation.subarray(16));
    const referenced = heifContainer([
      heifIinf([heifInfe(1, "Exif", "base"), heifInfe(2, "Exif", "derived")], 0),
      heifBox("iloc", pairPayload),
      heifBox("iref", concat(Uint8Array.of(0, 0, 0, 0), heifBox("iloc", concat(Uint8Array.of(0, 2), Uint8Array.of(0, 1), Uint8Array.of(0, 1))))),
      heifBox("idat", Uint8Array.of(1, 2, 3, 4)),
    ]);
    const dataReferenced = heifContainer([
      heifIinf([heifInfe(1, "Exif", "external")], 0),
      heifIloc({ version: 1, id: 1, method: 0, dataReferenceIndex: 1, offset: 0, length: 4 }),
      heifBox("dinf", heifBox("dref", concat(Uint8Array.of(0, 0, 0, 0), be32(1), heifBox("url ", Uint8Array.of(0, 0, 0, 1))))),
    ]);
    for (const [label, value] of [["exif", exif], ["xmp", xmp], ["dataReferenced", dataReferenced]] as const) {
      const result = await materializeHeifMetadata(readerFor(value), limits, resolveSelection({ groups: ["EXIF", "XMP"] }));
      expect(result, label).not.toBeNull();
      expect(result?.bytes.length).toBeLessThanOrEqual(limits.maxMetadataBytes);
      expect(result?.partial).toBe(true);
      expect(result?.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
    }
    const referencedResult = await materializeHeifMetadata(readerFor(referenced), limits, resolveSelection({ groups: ["EXIF"] }));
    expect(referencedResult).not.toBeNull();
    const malformed = [
      heifContainer([heifIinf([heifInfe(1, "Exif", "x")], 0), heifIloc({ version: 1, id: 1, method: 3, offset: 0, length: 1 })]),
      heifContainer([heifIinf([heifInfe(1, "Exif", "x")], 0), heifIloc({ version: 1, id: 1, method: 1, dataReferenceIndex: 1, offset: 0, length: 1 }), heifBox("idat", Uint8Array.of(1))]),
      heifContainer([heifIinf([heifInfe(1, "Exif", "x")], 0), heifIloc({ version: 1, id: 1, method: 1, offset: 0, length: 100 }), heifBox("idat", Uint8Array.of(1))]),
    ];
    for (const value of malformed) expect(await materializeHeifMetadata(readerFor(value), limits, resolveSelection({ groups: ["EXIF"] }))).toBeNull();
    const short = await materializeHeifMetadata(readerFor(exif, 12), limits, resolveSelection({ groups: ["EXIF"] }));
    expect(short === null || short.bytes.length <= limits.maxMetadataBytes).toBe(true);
  });

  it("covers C2PA inventory carrier semantics, relationships, and candidate guards", () => {
    const payload = encoder.encode("jumbf urn:c2pa:manifest/1 https://example.test/manifest");
    const jpeg = scanJpeg([segment(0xeb, payload), segment(0xeb, payload)]);
    const jpegResult = inventoryJumbfC2pa(jpeg, { limits });
    expect(jpegResult.detected).toBe(true);
    expect(jpegResult.stores).toHaveLength(2);
    expect(jpegResult.relationships.some(({ kind }) => kind === "remote")).toBe(true);
    expect(jpegResult.relationships.some(({ kind }) => kind === "duplicate")).toBe(true);

    const pngSignature = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    const iTxt = concat(encoder.encode("c2pa\0"), Uint8Array.of(0, 0), encoder.encode("en\0"), encoder.encode("https://example.test/remote"));
    const png = concat(pngSignature, pngChunk("caBX", payload), pngChunk("iTXt", iTxt), pngChunk("IEND", new Uint8Array()));
    const pngResult = inventoryJumbfC2pa(png, { limits });
    expect(pngResult.detected).toBe(true);
    expect(pngResult.stores.map(({ container }) => container)).toEqual(expect.arrayContaining(["png-cabx", "png-itxt"]));
    expect(pngResult.diagnostics.some(({ code }) => code === "MALFORMED_STRUCTURE")).toBe(true);

    const webpBody = concat(encoder.encode("WEBP"), webpChunk("C2PA", payload), webpChunk("JUMF", payload), webpChunk("C2PA", payload));
    const webp = concat(encoder.encode("RIFF"), le32(webpBody.length), webpBody);
    const webpResult = inventoryJumbfC2pa(webp, { limits });
    expect(webpResult.detected).toBe(true);
    expect(webpResult.stores).toHaveLength(3);
    expect(webpResult.relationships.some(({ kind }) => kind === "duplicate")).toBe(true);

    const nested = heifBox("jumb", concat(heifBox("c2pa", payload), heifBox("uuid", payload)));
    const bmff = concat(heifBox("ftyp", concat(encoder.encode("avif"), new Uint8Array(4), encoder.encode("mif1"))), nested);
    const bmffResult = inventoryJumbfC2pa(bmff, { limits });
    expect(bmffResult.detected).toBe(true);
    expect(bmffResult.stores.some(({ parentId }) => parentId !== null)).toBe(true);
    expect(bmffResult.stores.every(({ offset, length, payloadOffset, payloadLength }) => offset >= 0 && length >= 8 && payloadOffset >= offset && payloadLength <= length)).toBe(true);

    const limited = inventoryJumbfC2pa(jpeg, { limits: resolveLimits({ ...limits, maxSegments: 1 }) });
    expect(limited.status).toBe("limited");
    expect(limited.diagnostics.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
    expect(inventoryJumbfC2pa(Uint8Array.of(0x49, 0x49), { limits }).status).toBe("unsupported");
    expect(hasC2paInventoryCandidate(jpeg, limits)).toBe(true);
    expect(hasC2paInventoryCandidate(png, limits)).toBe(true);
    expect(hasC2paInventoryCandidate(webp, limits)).toBe(true);
    expect(hasC2paInventoryCandidate(bmff, limits)).toBe(true);
    expect(hasC2paInventoryCandidate(new Uint8Array(129 * 1024), limits)).toBe(true);
  });

  it("retains HEIF item-property, derived-item, and relationship semantics through the public parser", () => {
    const properties = heifBox("iprp", concat(
      heifBox("ipco",
        concat(
          heifBox("ispe", concat(new Uint8Array(4), be32(320), be32(240))),
          heifBox("colr", concat(encoder.encode("nclx"), Uint8Array.of(0, 1, 0, 13, 0, 6, 0x80))),
          heifBox("auxC", concat(encoder.encode("urn:example:alpha\0"), be32(1))),
          heifBox("irot", Uint8Array.of(1)),
          heifBox("imir", Uint8Array.of(1)),
          heifBox("zzzz", Uint8Array.of(1)),
        ),
      ),
      heifBox("ipma", concat(Uint8Array.of(0, 0, 0, 0), be32(1), Uint8Array.of(0, 1), Uint8Array.of(6), Uint8Array.of(0x81, 0x82, 0x83, 0x84, 0x85, 0x86))),
    ));
    const info = heifIinf([heifInfe(1, "av01", "primary"), heifInfe(2, "iden", "identity", undefined, 3), heifInfe(3, "mime", "xmp", "application/rdf+xml", 3)], 1);
    const first = heifIloc({ version: 1, id: 1, method: 1, offset: 0, length: 4 });
    const second = heifIloc({ version: 1, id: 3, method: 1, offset: 4, length: 4 });
    const iloc = heifBox("iloc", concat(first.subarray(8, 14), Uint8Array.of(0, 2), first.subarray(16), second.subarray(16)));
    const references = heifBox("iref", concat(
      Uint8Array.of(0, 0, 0, 0),
      heifBox("dimg", concat(Uint8Array.of(0, 1), Uint8Array.of(0, 1), Uint8Array.of(0, 2))),
      heifBox("cdsc", concat(Uint8Array.of(0, 3), Uint8Array.of(0, 1), Uint8Array.of(0, 1))),
    ));
    const input = heifContainer([
      heifFullBox("pitm", Uint8Array.of(0, 1)),
      info,
      references,
      properties,
      iloc,
      heifBox("idat", concat(Uint8Array.of(1, 2, 3, 4), encoder.encode("<x/>").subarray(0, 4))),
    ]);
    const result = parseHeif(input, limits, "heif", resolveSelection({ groups: ["Dimensions", "EXIF", "XMP"] }));
    expect(result.heif?.[0]?.properties.map(({ type }) => type)).toEqual(expect.arrayContaining(["ispe", "colr", "auxC", "irot", "imir", "zzzz"]));
    expect(result.heif?.[0]?.relationships.length).toBeGreaterThan(0);
    expect(result.heif?.[0]?.properties.some(({ type }) => type === "irot")).toBe(true);
    expect(result.heif?.[0]?.properties.some(({ type }) => type === "imir")).toBe(true);
    expect(result.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
  });

  it("fails closed for short range-reader responses without escaping source bounds", async () => {
    const tiff = new Uint8Array(readFileSync(new URL("./fixtures/tiff-metadata.tif", import.meta.url)));
    const heif = new Uint8Array(readFileSync(new URL("./fixtures/heif-item-metadata.heic", import.meta.url)));
    const jpeg = new Uint8Array(readFileSync(new URL("./fixtures/jpeg-exif-little-endian.jpg", import.meta.url)));
    const cases: readonly [string, Uint8Array, (reader: BlobReader) => Promise<unknown>][] = [
      ["tiff", tiff, (reader) => materializeTiffMetadata(reader, limits, allGroups)],
      ["heif", heif, (reader) => materializeHeifMetadata(reader, limits, resolveSelection({ groups: ["EXIF", "XMP"] }))],
      ["jpeg", jpeg, (reader) => materializeJpegMetadata(reader, limits, allGroups)],
    ];
    for (const [label, bytes, materialize] of cases) {
      for (let shortCall = 0; shortCall < 18; shortCall += 1) {
        try {
          const result = await materialize(readerWithShortCall(bytes, shortCall));
          if (result !== null && typeof result === "object" && "bytes" in result) {
            const value = result as { readonly bytes: Uint8Array; readonly warnings: readonly { readonly code: string }[] };
            expect(value.bytes.length, `${label}:${shortCall}`).toBeLessThanOrEqual(limits.maxMetadataBytes);
            expect(value.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code)), `${label}:${shortCall}`).toBe(true);
          }
        } catch (error) {
          expect(error, `${label}:${shortCall}`).toBeInstanceOf(MetadataError);
        }
      }
    }
  });

  it("proves low security budgets remain bounded across the representative container families", async () => {
    const names = [
      "jpeg-exif-little-endian.jpg", "jpeg-iptc.jpg", "jpeg-icc.jpg", "png-metadata.png", "png-bad-text.png",
      "webp-metadata.webp", "tiff-metadata.tif", "heif-metadata.heic", "heif-item-metadata.heic", "avif-item-metadata.avif",
    ] as const;
    const variants = [
      { maxSegments: 1 },
      { maxIfdEntries: 1 },
      { maxIfdDepth: 1 },
      { maxMetadataBytes: 16, maxValueBytes: 4, maxSegmentBytes: 8 },
      { maxXmpNodes: 1, maxXmpProperties: 1, maxXmpArrayItems: 1, maxXmpQualifiers: 1 },
      { maxWarnings: 1, maxAdapterItems: 1, maxAdapterOutputBytes: 128 },
    ] as const;
    for (const name of names) {
      const bytes = new Uint8Array(readFileSync(new URL(`./fixtures/${name}`, import.meta.url)));
      for (const variant of variants) {
        const result = await parseMetadata(bytes, { limits: resolveLimits({ ...limits, ...variant }) });
        const warningLimit = "maxWarnings" in variant ? variant.maxWarnings : limits.maxWarnings;
        expect(result.fields.length, `${name}:${JSON.stringify(variant)}`).toBeLessThanOrEqual(4096);
        expect(result.blocks.length, `${name}:${JSON.stringify(variant)}`).toBeLessThanOrEqual(4096);
        expect(result.warnings.length, `${name}:${JSON.stringify(variant)}`).toBeLessThanOrEqual(warningLimit);
        expect(result.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
      }
    }
  });

  it("covers versioned HEIF graph descriptors, property conflicts, and parser selection branches", () => {
    const tiff = Uint8Array.of(0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    const directXmp = heifContainer([heifBox("xml ", encoder.encode("<x:xmpmeta xmlns:x=\"adobe:ns:meta/\"/>"))]);
    const directExif = heifContainer([heifBox("Exif", tiff)]);
    const invalidDirect = heifContainer([heifBox("Exif", Uint8Array.of(0, 1, 2)), heifBox("XMP ", Uint8Array.of(0xff)), heifBox("Exif", tiff)]);
    for (const [value, selection] of [
      [directXmp, resolveSelection({ groups: ["XMP"] })],
      [directExif, resolveSelection({ groups: ["EXIF"] })],
      [invalidDirect, allGroups],
      [directXmp, resolveSelection({ groups: [] })],
    ] as const) {
      const result = parseHeif(value, limits, "avif", selection);
      expect(result.fields.length).toBeLessThanOrEqual(limits.maxIfdEntries * 128);
      expect(result.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
    }

    const ispe = heifBox("ispe", concat(new Uint8Array(4), be32(640), be32(480)));
    const secondIspe = heifBox("ispe", concat(new Uint8Array(4), be32(800), be32(600)));
    const nclx = heifBox("colr", concat(encoder.encode("nclx"), Uint8Array.of(0, 1, 0, 13, 0, 6, 0x80)));
    const secondNclx = heifBox("colr", concat(encoder.encode("nclx"), Uint8Array.of(0, 1, 0, 14, 0, 6, 0x80)));
    const properties = heifBox("iprp", concat(
      heifBox("ipco", concat(
        ispe,
        secondIspe,
        nclx,
        secondNclx,
        heifBox("irot", Uint8Array.of(1)),
        heifBox("irot", Uint8Array.of(2)),
        heifBox("imir", Uint8Array.of(0)),
        heifBox("imir", Uint8Array.of(1)),
      )),
      heifBox("ipma", concat(
        Uint8Array.of(0, 0, 0, 0),
        be32(1),
        Uint8Array.of(0, 1),
        Uint8Array.of(4),
        Uint8Array.of(1, 2, 3, 4),
      )),
    ));
    const graph = heifContainer([
      heifFullBox("pitm", Uint8Array.of(0, 1)),
      heifIinf([heifInfe(1, "av01", "primary"), heifInfe(2, "grid", "grid"), heifInfe(3, "iovl", "overlay"), heifInfe(4, "iden", "identity")], 0),
      properties,
      heifIlocMany([
        { id: 2, method: 1, offset: 0, length: 8 },
        { id: 3, method: 1, offset: 8, length: 18 },
        { id: 4, method: 1, offset: 26, length: 0 },
      ]),
      heifBox("iref", concat(
        new Uint8Array(4),
        heifBox("dimg", concat(Uint8Array.of(0, 2), Uint8Array.of(0, 1), Uint8Array.of(0, 1))),
        heifBox("dimg", concat(Uint8Array.of(0, 3), Uint8Array.of(0, 1), Uint8Array.of(0, 1))),
        heifBox("xxxx", concat(Uint8Array.of(0, 4), Uint8Array.of(0, 1), Uint8Array.of(0, 1))),
      )),
      heifBox("idat", concat(
        Uint8Array.of(0, 0, 0, 0, 0, 2, 0, 2),
        Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 4, 0, 0, 0, 0),
        new Uint8Array(8),
      )),
    ]);
    const graphResult = parseHeif(graph, limits, "heif", allGroups);
    expect(graphResult.heif?.[0]?.items.map(({ type }) => type)).toEqual(expect.arrayContaining(["grid", "iovl", "iden"]));
    expect(graphResult.heif?.[0]?.items.find(({ type }) => type === "grid")?.derived?.type).toBe("grid");
    expect(graphResult.heif?.[0]?.items.find(({ type }) => type === "iovl")?.derived?.type).toBe("overlay");
    expect(graphResult.heif?.[0]?.items.find(({ type }) => type === "iden")?.derived?.type).toBe("identity");
    expect(graphResult.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);

    // Exercise every byte neighborhood of the complete graph. These are
    // deterministic malformed-input cases, not random coverage: each edit
    // must remain bounded and retain typed diagnostics when structure breaks.
    for (const original of [graph, directExif, directXmp]) {
      for (let offset = 0; offset < original.length; offset += 1) {
        for (const replacement of [0, 0xff]) {
          const mutated = original.slice();
          mutated[offset] = replacement;
          const result = parseHeif(mutated, limits, "heif", allGroups);
          expect(result.fields.length).toBeLessThanOrEqual(limits.maxIfdEntries * 128);
          expect(result.blocks?.length ?? 0).toBeLessThanOrEqual(limits.maxIfdEntries * 128);
          expect(result.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
        }
      }
    }

    const malformedDescriptors = [
      heifContainer([heifIinf([heifInfe(1, "grid", "grid")], 0), heifIlocV0(1, 0, 1), heifBox("idat", new Uint8Array(7))]),
      heifContainer([heifIinf([heifInfe(1, "iovl", "overlay")], 0), heifIlocV0(1, 0, 1), heifBox("idat", new Uint8Array(10))]),
      heifContainer([heifIinf([heifInfe(1, "grid", "grid")], 0), heifIlocV0(1, 0, 8), heifBox("idat", Uint8Array.of(0, 2, 0, 0, 0, 0, 0, 1))]),
    ];
    for (const value of malformedDescriptors) {
      const result = parseHeif(value, limits, "heif", allGroups);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
    }

    const versioned = heifContainer([
      heifIinf([heifInfe(70000, "mime", "xmp", "application/rdf+xml", 3)], 1),
      heifIloc({ version: 2, id: 70000, method: 1, offset: 0, length: 4, index: 1 }),
      heifBox("idat", encoder.encode("<x/>")),
    ]);
    expect(parseHeif(versioned, limits, "avif", resolveSelection({ groups: ["XMP"] })).xmp?.packets).toEqual(["<x/>"]);

    const invalidDimensions = [
      Uint8Array.of(0, 0, 0, 0),
      heifBox("ispe", concat(new Uint8Array(4), be32(0), be32(1))),
      heifBox("ispe", concat(new Uint8Array(4), be32(1), be32(0))),
      concat(be32(1), encoder.encode("ispe"), new Uint8Array(8)),
      concat(be32(1), encoder.encode("free"), new Uint8Array(8)),
    ];
    for (const value of invalidDimensions) expect(parseHeifDimensions(value, 0, 1)).toBeNull();
    expect(parseHeifDimensions(heifBox("ispe", concat(new Uint8Array(4), be32(640), be32(480))), 8, 0)).toBeNull();
  });

  it("covers independent C2PA inventory boundary outcomes for each supported carrier", () => {
    const jpegCases = [
      new Uint8Array(),
      Uint8Array.of(0xff, 0xd8, 0x01),
      Uint8Array.of(0xff, 0xd8, 0xff, 0xeb, 0, 1),
      Uint8Array.of(0xff, 0xd8, 0xff, 0xeb, 0, 12, 1, 2),
      Uint8Array.of(0xff, 0xd8, 0xff, 0xda, 0, 2),
      Uint8Array.of(0xff, 0xd8, 0xff, 0x01, 0xff, 0xd9),
      Uint8Array.of(0xff, 0xd8, 0x01, 0x02, 0xff, 0xd9),
      scanJpeg([segment(0xeb, encoder.encode("opaque"))]).subarray(0, -2),
    ];
    for (const value of jpegCases) {
      const result = inventoryJumbfC2pa(value, { limits });
      expect(result.diagnostics.length).toBeLessThanOrEqual(limits.maxWarnings);
      expect(result.remoteReferencesFetched).toBe(false);
    }
    expect(inventoryJumbfC2pa(scanJpeg([segment(0xeb, encoder.encode("c2pa:manifest"))]), { limits }).detected).toBe(true);

    const pngSignature = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    const pngCases = [
      new Uint8Array(),
      pngSignature,
      concat(pngSignature, pngChunk("caBX", encoder.encode("c2pa:manifest")), Uint8Array.of(1)),
      concat(pngSignature, pngChunk("iTXt", concat(encoder.encode("c2pa\0"), Uint8Array.of(0, 1), encoder.encode("en\0"), encoder.encode("https://example.test/a"))), pngChunk("IEND", new Uint8Array()), Uint8Array.of(9)),
      concat(pngSignature, pngChunk("zzzz", encoder.encode("c2pa opaque")), pngChunk("IEND", new Uint8Array())),
      concat(pngSignature, be32(0), encoder.encode("IEND"), new Uint8Array(4)),
      concat(pngSignature, be32(0xfffffff0), encoder.encode("caBX"), new Uint8Array(4)),
    ];
    for (const value of pngCases) {
      const result = inventoryJumbfC2pa(value, { limits: resolveLimits({ ...limits, maxPngChunks: 2 }) });
      expect(result.diagnostics.length).toBeLessThanOrEqual(limits.maxWarnings);
      expect(result.remoteReferencesFetched).toBe(false);
    }
    const manyPngChunks = concat(pngSignature, pngChunk("free", new Uint8Array()), pngChunk("free", new Uint8Array()), pngChunk("IEND", new Uint8Array()));
    expect(inventoryJumbfC2pa(manyPngChunks, { limits: resolveLimits({ ...limits, maxPngChunks: 1 }) }).diagnostics).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));

    const webpCases = [
      new Uint8Array(),
      encoder.encode("RIFF"),
      concat(encoder.encode("RIFF"), le32(100), encoder.encode("WEBP")),
      concat(encoder.encode("RIFF"), le32(12), encoder.encode("WEBP")),
      concat(encoder.encode("RIFF"), le32(14), encoder.encode("WEBP"), webpChunk("C2PA", Uint8Array.of(1))),
      concat(encoder.encode("RIFF"), le32(20), encoder.encode("WEBP"), encoder.encode("zzzz"), le32(0), encoder.encode("C2PA"), le32(0)),
    ];
    for (const value of webpCases) {
      const result = inventoryJumbfC2pa(value, { limits: resolveLimits({ ...limits, maxPngChunks: 2 }) });
      expect(result.diagnostics.length).toBeLessThanOrEqual(limits.maxWarnings);
      expect(result.remoteReferencesFetched).toBe(false);
    }
    const manyWebpChunks = concat(encoder.encode("RIFF"), le32(20), encoder.encode("WEBP"), webpChunk("free", new Uint8Array()), webpChunk("free", new Uint8Array()));
    expect(inventoryJumbfC2pa(manyWebpChunks, { limits: resolveLimits({ ...limits, maxPngChunks: 1 }) }).diagnostics).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));

    const ftyp = heifBox("ftyp", concat(encoder.encode("avif"), new Uint8Array(4), encoder.encode("mif1")));
    const bmffCases = [
      ftyp,
      concat(ftyp, heifBox("c2xx", encoder.encode("opaque"))),
      concat(ftyp, heifBox("c2pa", encoder.encode("c2pa:manifest https://example.test/a"))),
      concat(ftyp, concat(be32(1), encoder.encode("jumb"), new Uint8Array(8))),
      concat(ftyp, concat(be32(1), encoder.encode("jumb"), Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 16))),
      concat(ftyp, concat(be32(4), encoder.encode("jumb"))),
      concat(ftyp, concat(be32(0), encoder.encode("free"))),
    ];
    for (const value of bmffCases) {
      const result = inventoryJumbfC2pa(value, { limits: resolveLimits({ ...limits, maxIfdDepth: 2 }) });
      expect(result.diagnostics.length).toBeLessThanOrEqual(limits.maxWarnings);
      expect(result.remoteReferencesFetched).toBe(false);
    }
    const deep = heifBox("jumb", heifBox("jumb", heifBox("jumb", encoder.encode("c2pa"))));
    const deepResult = inventoryJumbfC2pa(concat(ftyp, deep), { limits: resolveLimits({ ...limits, maxIfdDepth: 1 }) });
    expect(deepResult.diagnostics.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);

    for (const value of [
      Uint8Array.of(0x49, 0x49, 0x2a, 0, 8, 0, 0, 0),
      concat(encoder.encode("RIFF"), le32(12), encoder.encode("WEBP")),
      concat(pngSignature, pngChunk("IEND", new Uint8Array())),
    ]) {
      expect(hasC2paInventoryCandidate(value, resolveLimits({ ...limits, maxSegments: 1, maxPngChunks: 1 }))).toBe(false);
    }

    const jpegCarrier = scanJpeg([
      segment(0xeb, encoder.encode("c2pa:manifest https://example.test/manifest")),
      segment(0xeb, encoder.encode("c2pa:manifest https://example.test/manifest")),
    ]);
    const pngCarrier = concat(
      pngSignature,
      pngChunk("caBX", encoder.encode("c2pa:manifest https://example.test/manifest")),
      pngChunk("IEND", new Uint8Array()),
      Uint8Array.of(1, 2),
    );
    const webpPayload = encoder.encode("c2pa:manifest https://example.test/manifest");
    const webpCarrier = concat(
      encoder.encode("RIFF"),
      le32(4 + webpChunk("C2PA", webpPayload).length),
      encoder.encode("WEBP"),
      webpChunk("C2PA", webpPayload),
    );
    const bmffCarrier = concat(
      ftyp,
      heifBox("jumb", concat(heifBox("jumb", encoder.encode("c2pa:manifest https://example.test/manifest")), heifBox("c2pa", encoder.encode("c2pa:manifest")))),
    );
    expect(inventoryJumbfC2pa(jpegCarrier, { limits }).relationships).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "remote" }), expect.objectContaining({ kind: "duplicate" })]));
    expect(inventoryJumbfC2pa(pngCarrier, { limits }).complete).toBe(false);
    expect(inventoryJumbfC2pa(webpCarrier, { limits }).stores).toHaveLength(1);
    expect(inventoryJumbfC2pa(bmffCarrier, { limits }).stores.length).toBeGreaterThan(0);
    for (const source of [jpegCarrier, pngCarrier, webpCarrier, bmffCarrier]) {
      for (let offset = 0; offset < source.length; offset += 1) {
        const mutated = source.slice();
        mutated[offset] = offset % 2 === 0 ? 0 : 0xff;
        const result = inventoryJumbfC2pa(mutated, { limits });
        expect(result.stores.length).toBeLessThanOrEqual(limits.maxSegments);
        expect(result.relationships.length).toBeLessThanOrEqual(limits.maxAdapterItems);
        expect(result.diagnostics.length).toBeLessThanOrEqual(limits.maxWarnings);
        expect(result.remoteReferencesFetched).toBe(false);
      }
    }
  });

  it("covers valid HEIF item graphs, versioned locations, external references, and range rematerialization", async () => {
    const xmp = encoder.encode("<x:xmpmeta xmlns:x=\"adobe:ns:meta/\"><rdf:RDF/></x:xmpmeta>");
    const exif = concat(new Uint8Array(4), tiff());
    const itemData = concat(xmp, exif);
    const properties = heifBox("iprp", concat(
      heifBox("ipco", concat(
        heifBox("ispe", concat(new Uint8Array(4), be32(640), be32(480))),
        heifBox("colr", concat(encoder.encode("nclx"), Uint8Array.of(0, 1, 0, 13, 0, 6, 0x80))),
        heifBox("colr", concat(encoder.encode("prof"), Uint8Array.of(1, 2, 3))),
        heifBox("auxC", concat(encoder.encode("urn:example:alpha\0"), be32(7))),
        heifBox("irot", Uint8Array.of(1)),
        heifBox("imir", Uint8Array.of(1)),
      )),
      heifFullBox("ipma", concat(be32(1), Uint8Array.of(0, 1), Uint8Array.of(6), Uint8Array.of(0x81, 0x82, 0x83, 0x84, 0x85, 0x86))),
    ));
    const graph = heifContainer([
      heifFullBox("pitm", Uint8Array.of(0, 1)),
      heifIinf([
        heifInfe(1, "av01", "primary"),
        heifInfe(2, "mime", "xmp", "application/rdf+xml", 3),
        heifInfe(3, "Exif", "exif"),
      ], 0),
      properties,
      heifIlocMany([
        { id: 2, method: 1, offset: 0, length: xmp.length },
        { id: 3, method: 1, offset: xmp.length, length: exif.length },
      ]),
      heifBox("idat", itemData),
    ]);
    const parsed = parseHeif(graph, limits, "heif", allGroups);
    expect(parsed.xmp?.packets).toEqual([new TextDecoder().decode(xmp)]);
    expect(parsed.exif?.ifds.length ?? 0).toBeGreaterThan(0);
    expect(parsed.dimensions).toEqual({ width: 640, height: 480 });
    expect(parsed.nclx).toMatchObject({ colourPrimaries: 1, fullRange: true });
    expect(parsed.transform).toMatchObject({ rotation: 90, mirrored: true, mirrorAxis: "horizontal" });
    expect(parsed.heif?.[0]?.properties.map(({ type }) => type)).toEqual(expect.arrayContaining(["ispe", "colr", "auxC", "irot", "imir"]));
    const materialized = await materializeHeifMetadata(readerFor(graph), limits, allGroups);
    expect(materialized).not.toBeNull();
    expect(materialized?.bytes.length ?? 0).toBeLessThanOrEqual(limits.maxMetadataBytes);

    const versioned = heifContainer([
      heifIinf([heifInfe(70000, "mime", "xmp", "application/rdf+xml", 3)], 1),
      heifIloc({ version: 2, id: 70000, method: 1, offset: 0, length: xmp.length, index: 1 }),
      heifBox("idat", xmp),
    ]);
    const versionedResult = parseHeif(versioned, limits, "avif", resolveSelection({ groups: ["XMP"] }));
    expect(versionedResult.xmp?.packets).toEqual([new TextDecoder().decode(xmp)]);
    expect(versionedResult.heif?.[0]?.items.find(({ id }) => id === 70000)?.contentEncoding).toBeNull();
    expect(await materializeHeifMetadata(readerFor(versioned), limits, resolveSelection({ groups: ["XMP"] }))).not.toBeNull();

    const selfContainedDref = heifBox("dinf", heifBox("dref", concat(
      new Uint8Array(4),
      be32(2),
      heifBox("url ", Uint8Array.of(0, 0, 0, 1)),
      heifFullBox("zzzz", encoder.encode("opaque"), 0),
    )));
    for (const dataReferenceIndex of [1, 2]) {
      const referenceInput = heifContainer([
        heifIinf([heifInfe(1, "Exif", "exif")], 0),
        selfContainedDref,
        heifIloc({ version: 1, id: 1, method: 0, dataReferenceIndex, offset: 0, length: 8 }),
      ]);
      const result = parseHeif(referenceInput, limits, "heif", resolveSelection({ groups: ["EXIF"] }));
      expect(result.heif?.[0]?.dataReferences).toEqual(expect.arrayContaining([
        expect.objectContaining({ index: 1, resolvable: true }),
        expect.objectContaining({ index: 2, resolvable: false }),
      ]));
      expect(result.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
    }

    const itemOffset = heifContainer([
      heifIinf([heifInfe(1, "mime", "xmp", "application/rdf+xml"), heifInfe(2, "iden", "identity")], 0),
      heifBox("iref", concat(new Uint8Array(4), heifBox("iloc", concat(Uint8Array.of(0, 2), Uint8Array.of(0, 1), Uint8Array.of(0, 1))))),
      heifIlocMany([
        { id: 1, method: 1, offset: 0, length: xmp.length },
        { id: 2, method: 2, offset: 0, length: 1 },
      ]),
      heifBox("idat", xmp),
    ]);
    const itemOffsetResult = parseHeif(itemOffset, limits, "heif", resolveSelection({ groups: ["XMP"] }));
    expect(itemOffsetResult.heif?.[0]?.relationships).toContainEqual(expect.objectContaining({ type: "item-offset", sourceItemId: 2, targetItemId: 1 }));
    expect(itemOffsetResult.heif?.[0]?.items.find(({ id }) => id === 2)?.location?.constructionMethod).toBe("item-offset");

    const malformed = [
      graph.slice(0, -1),
      graph.slice(0, 16),
      heifContainer([heifIinf([heifInfe(1, "mime", "xmp", "application/rdf+xml")], 0), heifIloc({ version: 1, id: 1, method: 1, dataReferenceIndex: 1, offset: 0, length: 0 }), heifBox("idat", xmp)]),
      heifContainer([heifIinf([heifInfe(1, "mime", "xmp", "application/rdf+xml")], 0), heifIloc({ version: 1, id: 1, method: 1, offset: 0, length: 0x10000 }), heifBox("idat", xmp)]),
    ];
    for (const input of malformed) {
      const result = parseHeif(input, resolveLimits({ ...limits, maxSegmentBytes: 64, maxMetadataBytes: 128 }), "heif", allGroups);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.fields.length).toBeLessThanOrEqual(limits.maxAdapterItems);
      const range = await materializeHeifMetadata(readerFor(input), resolveLimits({ ...limits, maxSegmentBytes: 64, maxMetadataBytes: 128 }), allGroups);
      expect(range === null || range.bytes.length <= 128).toBe(true);
    }

    for (let offset = 0; offset < graph.length; offset += 1) {
      const mutated = graph.slice();
      mutated[offset] = offset % 2 === 0 ? 0 : 0xff;
      const range = await materializeHeifMetadata(readerFor(mutated), limits, allGroups);
      expect(range === null || range.bytes.length <= limits.maxMetadataBytes).toBe(true);
    }
  }, 30_000);

  it("drives TIFF range planning through byte-order, pointer, truncation, and selection boundaries", async () => {
    const source = tiff();
    const selections = [
      allGroups,
      resolveSelection({ groups: ["EXIF"] }),
      resolveSelection({ groups: ["XMP", "IPTC", "ICC", "Photoshop"] }),
      resolveSelection({ groups: [] }),
    ];
    for (const selection of selections) {
      const result = await materializeTiffMetadata(readerFor(source), limits, selection);
      expect(result === null || result.bytes.length <= limits.maxMetadataBytes).toBe(true);
    }
    for (let offset = 0; offset < source.length; offset += 1) {
      for (const replacement of [0, 0xff]) {
        const mutated = source.slice();
        mutated[offset] = replacement;
        const result = await materializeTiffMetadata(readerFor(mutated), limits, allGroups);
        expect(result === null || result.bytes.length <= limits.maxMetadataBytes).toBe(true);
        const parsed = parseTiffMetadata(mutated, limits, allGroups);
        expect(parsed.fields.length).toBeLessThanOrEqual(limits.maxAdapterItems);
        expect(parsed.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
      }
    }
    const shortReader = await materializeTiffMetadata(readerWithShortCall(source, 1), limits, allGroups);
    expect(shortReader === null || shortReader.warnings.length > 0 || shortReader.bytes.length <= limits.maxMetadataBytes).toBe(true);
    expect(await materializeTiffMetadata(readerFor(source), resolveLimits({ ...limits, maxMetadataBytes: 8 }), allGroups)).toBeNull();
    for (const littleEndian of [true, false]) {
      const big = bigTiff(littleEndian);
      const result = await materializeTiffMetadata(readerFor(big), limits, allGroups);
      expect(result).not.toBeNull();
      expect(result?.bytes.length ?? 0).toBeGreaterThan(16);
      const parsedBig = parseTiffMetadata(big, limits, allGroups);
      expect(parsedBig.fields).toBeInstanceOf(Array);
      for (let offset = 0; offset < big.length; offset += 1) {
        const mutated = big.slice();
        mutated[offset] = offset % 2 === 0 ? 0 : 0xff;
        const mutatedResult = await materializeTiffMetadata(readerFor(mutated), limits, allGroups);
        expect(mutatedResult === null || mutatedResult.bytes.length <= limits.maxMetadataBytes).toBe(true);
        const parsed = parseTiffMetadata(mutated, limits, allGroups);
        expect(parsed.fields.length).toBeLessThanOrEqual(limits.maxAdapterItems);
        expect(parsed.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
      }
    }
    const malformedBigHeaders = [
      bigTiff(true).slice(0, 15),
      (() => { const value = bigTiff(true); value[4] = 4; return value; })(),
      (() => { const value = bigTiff(true); new DataView(value.buffer).setBigUint64(8, 0n, true); return value; })(),
      (() => { const value = bigTiff(true); new DataView(value.buffer).setBigUint64(8, 0xffffffffffffffffn, true); return value; })(),
    ];
    for (const input of malformedBigHeaders) expect(await materializeTiffMetadata(readerFor(input), limits, allGroups)).toBeNull();
  }, 30_000);
});
