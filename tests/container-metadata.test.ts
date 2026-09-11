import { describe, expect, it } from "vitest";
import { inspectIccProfile, parseIccChunk, summarizeIcc } from "../src/metadata/icc.js";
import { parseIptc } from "../src/metadata/iptc.js";
import { parseJfif } from "../src/metadata/jfif.js";
import { parseExtendedXmpChunk, parseXmpPacket, reassembleExtendedXmp } from "../src/metadata/xmp.js";
import { parseStructuredXmp, parseStructuredXmpBytes, parseStructuredXmpBytesWithDecoder, parseStructuredXmpWithDecoder } from "../src/xmp.js";
import { parseStructuredXmpBytesWithRgrove, parseStructuredXmpWithRgrove } from "../src/xmp-rgrove.js";
import { extractExifThumbnail } from "../src/metadata/thumbnail.js";
import { parseHeifDimensions } from "../src/parsers/heif.js";
import { parsePngDimensions } from "../src/parsers/png.js";
import { parseWebpDimensions } from "../src/parsers/webp.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";

const ascii = (text: string): number[] => Array.from(text, (character) => character.charCodeAt(0));

function writeUint32(bytes: Uint8Array, offset: number, value: number, littleEndian = false): void {
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).setUint32(offset, value, littleEndian);
}

function crc32(bytes: Uint8Array, start: number, end: number): number {
  let crc = 0xffffffff;
  for (let offset = start; offset < end; offset += 1) {
    crc ^= bytes[offset] ?? 0;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function box(type: string, ...payloads: readonly Uint8Array[]): Uint8Array {
  const payloadLength = payloads.reduce((sum, payload) => sum + payload.length, 0);
  const result = new Uint8Array(8 + payloadLength);
  writeUint32(result, 0, result.length);
  result.set(ascii(type), 4);
  let cursor = 8;
  for (const payload of payloads) {
    result.set(payload, cursor);
    cursor += payload.length;
  }
  return result;
}

describe("bounded container dimensions", () => {
  it("reads PNG IHDR dimensions", () => {
    const png = new Uint8Array(33);
    png.set([0x89, ...ascii("PNG"), 0x0d, 0x0a, 0x1a, 0x0a]);
    writeUint32(png, 8, 13);
    png.set(ascii("IHDR"), 12);
    writeUint32(png, 16, 640);
    writeUint32(png, 20, 480);
    png.set([8, 2, 0, 0, 0], 24);
    writeUint32(png, 29, crc32(png, 12, 29));
    expect(parsePngDimensions(png)).toEqual({ width: 640, height: 480 });
    png[12] = 0;
    expect(parsePngDimensions(png)).toBeNull();
  });

  it("reads WebP VP8X dimensions and respects the RIFF bound", () => {
    const webp = new Uint8Array(30);
    webp.set(ascii("RIFF"));
    writeUint32(webp, 4, 22, true);
    webp.set(ascii("WEBPVP8X"), 8);
    writeUint32(webp, 16, 10, true);
    webp.set([0x7f, 0x02, 0x00], 24); // 640 - 1
    webp.set([0xdf, 0x01, 0x00], 27); // 480 - 1
    expect(parseWebpDimensions(webp)).toEqual({ width: 640, height: 480 });
    writeUint32(webp, 4, 10, true);
    expect(parseWebpDimensions(webp)).toBeNull();
  });

  it("reads WebP VP8L and VP8 frame dimensions", () => {
    const lossless = new Uint8Array(26);
    lossless.set(ascii("RIFF"));
    writeUint32(lossless, 4, 18, true);
    lossless.set(ascii("WEBPVP8L"), 8);
    writeUint32(lossless, 16, 5, true);
    lossless.set([0x2f, 0xff, 0x7f, 0x00, 0x00], 20);
    expect(parseWebpDimensions(lossless)).toEqual({ width: 16384, height: 2 });

    const lossy = new Uint8Array(30);
    lossy.set(ascii("RIFF"));
    writeUint32(lossy, 4, 22, true);
    lossy.set(ascii("WEBPVP8 "), 8);
    writeUint32(lossy, 16, 10, true);
    lossy.set([0x10, 0, 0, 0x9d, 0x01, 0x2a, 0x80, 0x02, 0xe0, 0x01], 20);
    expect(parseWebpDimensions(lossy)).toEqual({ width: 640, height: 480 });
  });

  it("returns HEIF dimensions only when all validated ispe properties agree", () => {
    const ispePayload = new Uint8Array(12);
    writeUint32(ispePayload, 4, 4032);
    writeUint32(ispePayload, 8, 3024);
    const structure = box("meta", new Uint8Array(4), box("iprp", box("ipco", box("ispe", ispePayload))));
    expect(parseHeifDimensions(structure)).toEqual({ width: 4032, height: 3024 });

    const differentPayload = ispePayload.slice();
    writeUint32(differentPayload, 4, 320);
    const ambiguous = box(
      "meta",
      new Uint8Array(4),
      box("iprp", box("ipco", box("ispe", ispePayload), box("ispe", differentPayload))),
    );
    expect(parseHeifDimensions(ambiguous)).toBeNull();
    expect(parseHeifDimensions(structure.subarray(0, structure.length - 1))).toBeNull();
    expect(parseHeifDimensions(structure, 8, 2)).toBeNull();
    expect(parseHeifDimensions(structure, -1)).toBeNull();
  });
});

describe("bounded JPEG metadata helpers", () => {
  it("reads JFIF density", () => {
    expect(parseJfif(Uint8Array.from([...ascii("JFIF\0"), 1, 2, 1, 0, 72, 0, 72, 0, 0]))).toEqual({
      version: "1.02",
      densityUnits: "dpi",
      xDensity: 72,
      yDensity: 72,
    });
    expect(parseJfif(Uint8Array.of(0))).toBeNull();
  });

  it("validates and summarizes ICC chunk numbering", () => {
    const prefix = ascii("ICC_PROFILE\0");
    const first = parseIccChunk(Uint8Array.from([...prefix, 1, 2, 1, 2, 3]));
    const second = parseIccChunk(Uint8Array.from([...prefix, 2, 2, 4, 5]));
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    if (first === null || second === null) throw new Error("expected valid ICC fixture chunks");
    expect(summarizeIcc([first, second])).toEqual({ byteLength: 5, chunks: 2, complete: true });
    expect(parseIccChunk(Uint8Array.from([...prefix, 0, 2]))).toBeNull();
  });

  it("reads ICC rendering intent from the profile header", () => {
    const prefix = ascii("ICC_PROFILE\0");
    const labels = ["perceptual", "media-relative colorimetric", "saturation", "ICC-absolute colorimetric"];
    for (let intent = 0; intent < labels.length; intent += 1) {
      const profile = new Uint8Array(132);
      new DataView(profile.buffer).setUint32(0, 132);
      profile.set(ascii("acsp"), 36);
      new DataView(profile.buffer).setUint32(64, intent);
      const parsed = parseIccChunk(Uint8Array.from([...prefix, 1, 1, ...profile]));
      expect(parsed).not.toBeNull();
      if (parsed === null) throw new Error("expected valid ICC fixture");
      const inspected = inspectIccProfile([parsed], DEFAULT_LIMITS);
      expect(inspected.data?.fields?.find(({ name }) => name === "RenderingIntent")?.value).toBe(intent);
      expect(inspected.data?.fields?.find(({ name }) => name === "RenderingIntent")?.display).toContain(labels[intent]);
      expect(inspected.warnings).toEqual([]);
    }

    const invalid = new Uint8Array(132);
    new DataView(invalid.buffer).setUint32(0, 132);
    invalid.set(ascii("acsp"), 36);
    new DataView(invalid.buffer).setUint32(64, 4);
    const invalidChunk = parseIccChunk(Uint8Array.from([...prefix, 1, 1, ...invalid]));
    expect(invalidChunk).not.toBeNull();
    if (invalidChunk === null) throw new Error("expected invalid-intent fixture");
    expect(inspectIccProfile([invalidChunk], DEFAULT_LIMITS).warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
  });

  it("decodes valid XMP UTF-8 and rejects invalid or oversized packets", () => {
    const prefix = ascii("http://ns.adobe.com/xap/1.0/\0");
    const packet = new TextEncoder().encode("<x:xmpmeta>✓</x:xmpmeta>");
    expect(parseXmpPacket(Uint8Array.from([...prefix, ...packet]), 100).packet).toContain("✓");
    expect(parseXmpPacket(Uint8Array.from([...prefix, 0xc3, 0x28]), 100)).toEqual({ matched: true, packet: null });
    expect(parseXmpPacket(Uint8Array.from([...prefix, ...packet]), 1)).toEqual({ matched: true, packet: null });
    expect(parseXmpPacket(Uint8Array.of(1, 2, 3), 100)).toEqual({ matched: false, packet: null });
  });

  it("decodes bounded RDF XMP properties without processing entities or DTDs", () => {
    const packet = [
      '<x:xmpmeta xmlns:x="adobe:ns:meta/">',
      '<rdf:RDF xmlns:rdf="rdf" xmlns:dc="dc" xmlns:xmp="xmp">',
      '<rdf:Description xmp:Rating="5"><dc:title><rdf:Alt><rdf:li xml:lang="x-default">A title</rdf:li><rdf:li xml:lang="fr">Un titre</rdf:li></rdf:Alt></dc:title><dc:subject><rdf:Bag><rdf:li>one</rdf:li><rdf:li>two</rdf:li></rdf:Bag></dc:subject></rdf:Description>',
      "</rdf:RDF></x:xmpmeta>",
    ].join("");
    expect(parseStructuredXmp(packet)).toEqual({
      namespaces: { x: "adobe:ns:meta/", rdf: "rdf", dc: "dc", xmp: "xmp" },
      properties: { "xmp:Rating": "5", "dc:title": { "x-default": "A title", fr: "Un titre" }, "dc:subject": ["one", "two"] },
    });
    expect(parseStructuredXmp("<!DOCTYPE x [<!ENTITY x SYSTEM 'https://example.test'>]><x/> ")).toBeNull();
    expect(parseStructuredXmpBytes(new TextEncoder().encode(packet))?.properties["xmp:Rating"]).toBe("5");

    const decoder = {
      parse: (source: string) => source === packet
        ? { namespaces: { app: "urn:app" }, properties: { "app:decoded": "yes" } }
        : null,
    };
    expect(parseStructuredXmpWithDecoder(packet, decoder)).toEqual({ namespaces: { app: "urn:app" }, properties: { "app:decoded": "yes" } });
    expect(parseStructuredXmpBytesWithDecoder(new TextEncoder().encode(packet), decoder)?.properties["app:decoded"]).toBe("yes");
    expect(parseStructuredXmpWithDecoder("<!DOCTYPE x><x/>", decoder)).toBeNull();
    expect(parseStructuredXmpWithDecoder(packet, { parse: () => ({ namespaces: {}, properties: { a: 1 } } as never) })).toBeNull();
    expect(parseStructuredXmpWithRgrove(packet)?.properties["xmp:Rating"]).toBe("5");
    expect(parseStructuredXmpBytesWithRgrove(new TextEncoder().encode(packet))?.properties["dc:subject"]).toEqual(["one", "two"]);
  });

  it("extracts only bounded EXIF thumbnails and identifies JPEG bytes", () => {
    const tiff = Uint8Array.from([0, 0, 0, 0, 0xff, 0xd8, 0xff, 0xd9]);
    const exif = {
      byteOrder: "little-endian",
      fields: [
        { name: "JPEGInterchangeFormat", value: 4 },
        { name: "JPEGInterchangeFormatLength", value: 4 },
      ],
      ifds: [],
    } as never;
    expect(extractExifThumbnail(tiff, exif, DEFAULT_LIMITS)).toMatchObject({ mimeType: "image/jpeg", data: Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]) });
    expect(extractExifThumbnail(tiff, exif, { ...DEFAULT_LIMITS, maxValueBytes: 2 })).toBeNull();
  });

  it("reassembles complete Adobe extended XMP packets", () => {
    const identifier = ascii("http://ns.adobe.com/xmp/extension/\0");
    const guid = ascii("0123456789ABCDEF0123456789ABCDEF");
    const body = ascii("<extended/>");
    const chunk = (offset: number, data: readonly number[]): Uint8Array => {
      const bytes = new Uint8Array(identifier.length + 40 + data.length);
      bytes.set(identifier);
      bytes.set(guid, identifier.length);
      writeUint32(bytes, identifier.length + 32, body.length);
      writeUint32(bytes, identifier.length + 36, offset);
      bytes.set(data, identifier.length + 40);
      return bytes;
    };
    const first = parseExtendedXmpChunk(chunk(0, body.slice(0, 4)));
    const second = parseExtendedXmpChunk(chunk(4, body.slice(4)));
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    if (first === null || second === null) throw new Error("expected extended XMP chunks");
    expect(reassembleExtendedXmp([second, first], 100)).toBe("<extended/>");
  });

  it("finds bounded IPTC resources inside Photoshop APP13 data", () => {
    const name = [0, 0];
    const resource = Uint8Array.from([
      ...ascii("Photoshop 3.0\0"),
      ...ascii("8BIM"), 0x04, 0x04,
      ...name,
      0, 0, 0, 3,
      1, 2, 3, 0,
    ]);
    expect(parseIptc(resource)).toEqual({ byteLength: 3 });
    expect(parseIptc(resource.subarray(0, resource.length - 1))).toBeNull();
    expect(parseIptc(resource.subarray(0, resource.length - 2))).toBeNull();
  });
});
