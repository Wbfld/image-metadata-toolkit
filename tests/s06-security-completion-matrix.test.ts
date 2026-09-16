import { deflateSync } from "node:zlib";
import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { parseGif } from "../src/parsers/gif.js";
import { parseHeif } from "../src/parsers/heif.js";
import { parseJfif } from "../src/metadata/jfif.js";
import { parsePng } from "../src/parsers/png.js";
import { parseWebp } from "../src/parsers/webp.js";
import { parseMetadata } from "../src/index.js";
import { materializeInput, materializeJpegHeader, materializeMetadata } from "../src/input.js";
import {
  mergeStructuredXmp,
  parseStructuredXmpBytes,
  parseStructuredXmpBytesDetailed,
  parseStructuredXmpBytesWithDecoderDetailed,
  parseStructuredXmpDetailed,
  parseStructuredXmpDocuments,
  parseStructuredXmpWithDecoderDetailed,
  parseXmpPacket,
  validateStructuredXmpPacket,
} from "../src/metadata/xmp.js";
import { resolveSelection } from "../src/selection.js";
import { resolveLimits } from "../src/security/limits.js";

const encoder = new TextEncoder();
const selection = resolveSelection(undefined);
const limits = resolveLimits({
  maxInputBytes: 256 * 1024,
  maxMetadataBytes: 128 * 1024,
  maxSegmentBytes: 128 * 1024,
  maxValueBytes: 128 * 1024,
  maxStringBytes: 32 * 1024,
  maxXmpTextBytes: 32 * 1024,
  maxDecompressedBytes: 32 * 1024,
  maxDecompressedMetadataBytes: 32 * 1024,
  maxXmpNodes: 256,
  maxXmpProperties: 256,
  maxXmpArrayItems: 128,
  maxXmpQualifiers: 128,
  maxXmpPackets: 16,
  maxWarnings: 128,
  maxSegments: 256,
  maxIfdEntries: 256,
  maxIfdDepth: 16,
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

function be16(value: number): Uint8Array {
  return Uint8Array.of((value >>> 8) & 0xff, value & 0xff);
}

function be32(value: number): Uint8Array {
  return Uint8Array.of((value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);
}

function le32(value: number): Uint8Array {
  return Uint8Array.of(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function pngCrc(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array, corruptCrc = false): Uint8Array {
  const typed = encoder.encode(type);
  const body = concat(typed, data);
  const crc = be32(pngCrc(body));
  if (corruptCrc) crc[3] = (crc[3] ?? 0) ^ 0xff;
  return concat(be32(data.length), body, crc);
}

function pngFile(chunks: readonly Uint8Array[]): Uint8Array {
  return concat(Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), ...chunks);
}

function pngIhdr(): Uint8Array {
  return Uint8Array.of(...be32(2), ...be32(1), 8, 6, 0, 0, 0);
}

function webpChunk(type: string, data: Uint8Array): Uint8Array {
  return concat(encoder.encode(type), le32(data.length), data, data.length % 2 === 1 ? Uint8Array.of(0) : new Uint8Array());
}

function webpFile(chunks: readonly Uint8Array[]): Uint8Array {
  const body = concat(encoder.encode("WEBP"), ...chunks);
  return concat(encoder.encode("RIFF"), le32(body.length), body);
}

function webpDimensionsChunk(type: "VP8 " | "VP8L" | "VP8X"): Uint8Array {
  if (type === "VP8X") {
    const data = new Uint8Array(10);
    data[4] = 1;
    data[7] = 1;
    return webpChunk(type, data);
  }
  if (type === "VP8L") return webpChunk(type, Uint8Array.of(0x2f, 1, 0, 0, 0));
  const data = new Uint8Array(10);
  data[0] = 0x10;
  data[3] = 0x9d;
  data[4] = 0x01;
  data[5] = 0x2a;
  data[6] = 2;
  data[8] = 1;
  return webpChunk(type, data);
}

function box(type: string, payload: Uint8Array): Uint8Array {
  return concat(be32(payload.length + 8), encoder.encode(type), payload);
}

function fullBox(type: string, payload: Uint8Array, version = 0, flags = 0): Uint8Array {
  return box(type, concat(Uint8Array.of(version, (flags >>> 16) & 0xff, (flags >>> 8) & 0xff, flags & 0xff), payload));
}

function jpegMinimal(): Uint8Array {
  const sof = concat(Uint8Array.of(0xff, 0xc0), be16(11), Uint8Array.of(8, 0, 1, 0, 1, 1, 1, 0x11, 0));
  const sos = concat(Uint8Array.of(0xff, 0xda), be16(8), Uint8Array.of(1, 1, 0, 0, 0x3f, 0));
  return concat(Uint8Array.of(0xff, 0xd8), sof, sos, Uint8Array.of(0, 0, 0xff, 0xd9));
}

function minimalTiff(): Uint8Array {
  return Uint8Array.of(
    0x49, 0x49, 0x2a, 0, 8, 0, 0, 0,
    1, 0,
    0, 1, 4, 0, 1, 0, 0, 0, 2, 0, 0, 0,
    0, 0, 0, 0,
  );
}

function gifFile(blocks: readonly Uint8Array[], packed = 0): Uint8Array {
  return concat(encoder.encode("GIF89a"), Uint8Array.of(2, 0, 1, 0, packed, 0, 0), ...(packed & 0x80 ? [Uint8Array.of(0, 0, 0, 255, 255, 255)] : []), ...blocks, Uint8Array.of(0x3b));
}

function gifSubBlocks(data: Uint8Array): Uint8Array {
  return concat(Uint8Array.of(data.length), data, Uint8Array.of(0));
}

function infe(id: number, type: string, contentType = ""): Uint8Array {
  const name = encoder.encode(`item-${id}\0`);
  const content = contentType.length === 0 ? new Uint8Array() : encoder.encode(`${contentType}\0`);
  const payload = concat(Uint8Array.of(2, 0, 0, 0), be16(id), Uint8Array.of(0, 0), encoder.encode(type), name, content);
  return box("infe", payload);
}

function iinf(items: readonly Uint8Array[], version = 0): Uint8Array {
  const count = version === 0 ? be16(items.length) : be32(items.length);
  return box("iinf", concat(Uint8Array.of(version, 0, 0, 0), count, ...items));
}

function ispe(width: number, height: number): Uint8Array {
  return fullBox("ispe", concat(be32(width), be32(height)));
}

function nclx(fullRange = true): Uint8Array {
  return box("colr", concat(encoder.encode("nclx"), be16(1), be16(13), be16(6), Uint8Array.of(fullRange ? 0x80 : 0)));
}

function ipco(): Uint8Array {
  return box("ipco", concat(ispe(2, 1), nclx(), box("irot", Uint8Array.of(1)), box("imir", Uint8Array.of(0)), fullBox("auxC", concat(encoder.encode("urn:mpeg:mpegB:cicp:systems:auxiliary:alpha\0")))));
}

function ipma(): Uint8Array {
  const payload = concat(be32(1), be16(1), Uint8Array.of(5), Uint8Array.of(0x81, 0x82, 0x03, 0x04, 0x05));
  return fullBox("ipma", payload);
}

function iref(type: string, from: number, target: number): Uint8Array {
  return box("iref", concat(Uint8Array.of(0, 0, 0, 0), box(type, concat(be16(from), be16(1), be16(target)))));
}

function iloc(items: readonly { readonly id: number; readonly offset: number; readonly length: number }[]): Uint8Array {
  const entries = items.map(({ id, offset, length }) => concat(be16(id), be16(0), be16(0), be16(1), be32(1), be32(offset), be32(length)));
  return box("iloc", concat(Uint8Array.of(1, 0, 0, 0, 0x44, 0x40), be16(items.length), ...entries));
}

function heifItemFixture(): Uint8Array {
  const xmp = encoder.encode("<x:xmpmeta xmlns:x=\"adobe:ns:meta/\"/>");
  const exif = concat(be32(0), minimalTiff());
  const media = concat(xmp, exif);
  const childrenWithoutLocations = concat(
    fullBox("pitm", be16(1)),
    iinf([infe(1, "av01"), infe(2, "mime", "application/rdf+xml"), infe(3, "Exif")]),
    box("iprp", concat(ipco(), ipma())),
    iref("cdsc", 2, 1),
    iref("cdsc", 3, 1),
    iref("thmb", 1, 2),
    box("idat", Uint8Array.of(1, 2, 3)),
  );
  const provisionalMeta = box("meta", concat(Uint8Array.of(0, 0, 0, 0), childrenWithoutLocations, iloc([
    { id: 2, offset: 0, length: xmp.length },
    { id: 3, offset: xmp.length, length: exif.length },
  ])));
  const ftyp = box("ftyp", concat(encoder.encode("heic"), new Uint8Array(8)));
  const mdatOffset = ftyp.length + provisionalMeta.length + 8;
  const meta = box("meta", concat(Uint8Array.of(0, 0, 0, 0), childrenWithoutLocations, iloc([
    { id: 2, offset: mdatOffset, length: xmp.length },
    { id: 3, offset: mdatOffset + xmp.length, length: exif.length },
  ])));
  return concat(ftyp, meta, box("mdat", media));
}

describe("S06 security-scope completion matrix", () => {
  it("validates structured XMP XML, RDF values, namespaces, limits, adapters, and merge policy", () => {
    const packet = `<x:xmpmeta xmlns:x="adobe:ns:meta/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:ex="https://example.invalid/ns/"><rdf:RDF><rdf:Description rdf:about="https://example.invalid/image" xml:lang="en"><dc:title xml:lang="en">A &amp; B</dc:title><dc:creator><rdf:Seq><rdf:li>Ada</rdf:li><rdf:li>Grace</rdf:li></rdf:Seq></dc:creator><ex:resource rdf:parseType="Resource"><rdf:type rdf:resource="https://example.invalid/ns/Person"/><ex:name>Ada</ex:name><ex:id rdf:nodeID="person-1"/></ex:resource><ex:literal rdf:parseType="Literal"><b>literal</b></ex:literal><ex:uri rdf:resource="https://example.invalid/person/1"/></rdf:Description></rdf:RDF></x:xmpmeta>`;
    const parsed = parseStructuredXmpDetailed(packet);
    expect(parsed.value?.rdf?.descriptions[0]?.properties).toHaveLength(5);
    expect(parsed.value?.rdf?.properties.find(({ name }) => name.localName === "creator")?.value).toMatchObject({ kind: "array", container: "Seq", items: [{ kind: "literal", lexicalValue: "Ada" }, { kind: "literal", lexicalValue: "Grace" }] });
    expect(parsed.value?.rdf?.properties.find(({ name }) => name.localName === "resource")?.value).toMatchObject({ kind: "typed-resource", resourceUri: null });
    expect(parsed.value?.rdf?.properties.find(({ name }) => name.localName === "literal")?.value).toMatchObject({ kind: "literal", parseType: "Literal" });
    expect(parsed.value?.rdf?.properties.find(({ name }) => name.localName === "uri")?.value).toMatchObject({ kind: "resource", resourceUri: "https://example.invalid/person/1" });
    expect(parsed.value?.rdf?.properties.every(({ name }) => name.namespaceUri.length > 0 && name.localName.length > 0)).toBe(true);

    const alternate = `<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/"><rdf:Description rdf:ID="description-1" dc:title="attribute title"><dc:description><rdf:Alt><rdf:li xml:lang="x-default">Default</rdf:li><rdf:li xml:lang="fr">Titre</rdf:li></rdf:Alt></dc:description></rdf:Description></rdf:RDF>`;
    const alternateResult = parseStructuredXmpDetailed(alternate);
    expect(alternateResult.value?.rdf?.descriptions[0]?.subject).toBe("description-1");
    expect(alternateResult.value?.rdf?.properties.find(({ name }) => name.localName === "description")?.value).toMatchObject({ kind: "array", container: "Alt", items: [{ language: "x-default" }, { language: "fr" }] });
    const invalidPackets = [
      ["<rdf:RDF><rdf:Description/></rdf:RDF>trailing", "INVALID_NAMESPACE"],
      ["<rdf:RDF><rdf:Description></rdf:RDF>", "INVALID_NAMESPACE"],
      ["<rdf:RDF xmlns:rdf=bad><rdf:Description/></rdf:RDF>", "MALFORMED_XML"],
      ['<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description><bad:p/></rdf:Description></rdf:RDF>', "INVALID_NAMESPACE"],
      ['<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description p:bad="1"/></rdf:RDF>', "INVALID_NAMESPACE"],
      ["<rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\"><rdf:Description></rdf:RDF>trailing", "MALFORMED_XML"],
      ['<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description><p>&bogus;</p></rdf:Description></rdf:RDF>', "UNSAFE_ENTITY"],
      ["<!DOCTYPE x><rdf:RDF/>", "UNSAFE_ENTITY"],
    ] as const;
    for (const [value, code] of invalidPackets) expect(parseStructuredXmpDetailed(value).diagnostics[0]?.code, value).toBe(code);

    expect(parseStructuredXmpDetailed(packet, { maxInputBytes: 1 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed(packet, { maxElements: 1 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed(packet, { maxAttributes: 1 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed(packet, { maxNamespaces: 1 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed(packet, { maxTextBytes: 1 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed(packet, { maxArrayItems: 1 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    const qualifierPacket = '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:ex="https://example.invalid/ns/"><rdf:Description><ex:value ex:first="one" ex:second="two">value</ex:value></rdf:Description></rdf:RDF>';
    expect(parseStructuredXmpDetailed(qualifierPacket, { maxQualifiers: 1 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed(packet, { maxProperties: 1 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed(packet, { maxOutputBytes: 1 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed(packet, { maxDepth: 1 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed(packet, { maxInputBytes: 0 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");

    const bytes = encoder.encode(packet);
    expect(parseStructuredXmpBytes(bytes)?.rdf?.properties.length).toBeGreaterThan(0);
    expect(parseStructuredXmpBytes(Uint8Array.of(0xff), { maxInputBytes: 1 })).toBeNull();
    expect(parseStructuredXmpBytesDetailed(Uint8Array.of(0xff)).diagnostics[0]?.code).toBe("MALFORMED_XML");
    expect(parseXmpPacket(concat(encoder.encode("http://ns.adobe.com/xap/1.0/\0"), encoder.encode(packet)), 1024)).toMatchObject({ matched: true, packet });
    expect(parseXmpPacket(Uint8Array.of(1, 2), 1024)).toEqual({ matched: false, packet: null });

    const canonical = parsed.value;
    if (canonical === null) throw new Error("structured XMP fixture did not parse");
    const adapter = parseStructuredXmpWithDecoderDetailed(packet, { parse: () => ({ namespaces: { ex: "https://example.invalid/ns/" }, properties: { "ex:value": "ok" } }) });
    expect(adapter.value?.properties).toEqual({ "ex:value": "ok" });
    expect(parseStructuredXmpWithDecoderDetailed(packet, { parse: () => null }).diagnostics[0]?.code).toBe("INVALID_ADAPTER_OUTPUT");
    expect(parseStructuredXmpWithDecoderDetailed(packet, { parse: () => ({ namespaces: {}, properties: { bad: 1 as never } }) }).diagnostics[0]?.code).toBe("INVALID_ADAPTER_OUTPUT");
    expect(parseStructuredXmpWithDecoderDetailed(packet, { parse: () => { throw new Error("adapter"); } }).diagnostics[0]?.code).toBe("INVALID_ADAPTER_OUTPUT");
    expect(parseStructuredXmpBytesWithDecoderDetailed(bytes, { parse: () => ({ namespaces: {}, properties: {} }) }).value).toBeDefined();
    expect(validateStructuredXmpPacket(canonical)).toBe(true);
    expect(validateStructuredXmpPacket({ namespaces: null, properties: {} })).toBe(false);
    expect(validateStructuredXmpPacket({ namespaces: { ex: "uri" }, properties: { "ex:value": ["a", 1 as never] } })).toBe(false);

    const first = parseStructuredXmpDetailed(`<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:ex="https://example.invalid/ns/"><rdf:Description><ex:value>one</ex:value></rdf:Description></rdf:RDF>`);
    const second = parseStructuredXmpDetailed(`<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:ex="https://example.invalid/ns/"><rdf:Description><ex:value>two</ex:value></rdf:Description></rdf:RDF>`);
    expect(first.value).not.toBeNull();
    expect(second.value).not.toBeNull();
    expect(mergeStructuredXmp([{ value: first.value }, { value: second.value, packetIndex: 1 }]).conflicts).toHaveLength(1);
    expect(mergeStructuredXmp([{ value: first.value }, { value: second.value }], "first").properties).toHaveLength(1);
    expect(mergeStructuredXmp([{ value: first.value }, { value: second.value }], "last").properties).toHaveLength(1);
    expect(parseStructuredXmpDocuments([packet, packet], { maxPackets: 1 }).documents).toHaveLength(2);
    expect(parseStructuredXmpDocuments([packet], { mergePolicy: "last" }).merged.policy).toBe("last");
  });

  it("covers PNG text forms, compression failures, CRC/selection behavior, and bounded outputs", async () => {
    const text = concat(encoder.encode("Title\0"), encoder.encode("plain"));
    const ztxt = concat(encoder.encode("ZTitle\0"), Uint8Array.of(0), new Uint8Array(deflateSync(Buffer.from("compressed"))));
    const itxt = concat(encoder.encode("ITitle\0"), Uint8Array.of(0, 0), encoder.encode("en\0English\0"), encoder.encode("international"));
    const compressedItxt = concat(encoder.encode("CTitle\0"), Uint8Array.of(1, 0), encoder.encode("en\0English\0"), new Uint8Array(deflateSync(Buffer.from("compressed international"))));
    const xmpItxt = concat(encoder.encode("XML:com.adobe.xmp\0"), Uint8Array.of(0, 0), encoder.encode("en\0English\0"), encoder.encode("<rdf:RDF/>"));
    const file = pngFile([
      pngChunk("IHDR", pngIhdr()),
      pngChunk("tEXt", text),
      pngChunk("zTXt", ztxt),
      pngChunk("iTXt", itxt),
      pngChunk("iTXt", compressedItxt),
      pngChunk("iTXt", xmpItxt),
      pngChunk("IDAT", Uint8Array.of(1)),
      pngChunk("IEND", new Uint8Array()),
    ]);
    const parsed = await parsePng(file, limits, selection);
    expect(parsed.dimensions).toEqual({ width: 2, height: 1 });
    expect(parsed.pngText.map(({ keyword }) => keyword)).toEqual(["Title", "ZTitle", "ITitle", "CTitle", "XML:com.adobe.xmp"]);
    expect(parsed.pngText.filter(({ compressed }) => compressed)).toHaveLength(2);
    expect(parsed.xmp?.packets).toEqual(["<rdf:RDF/>"]);

    const malformed = [
      concat(encoder.encode("missing")),
      concat(encoder.encode("z\0"), Uint8Array.of(1)),
      concat(encoder.encode("z\0"), Uint8Array.of(0)),
      concat(encoder.encode("i\0"), Uint8Array.of(2, 0), encoder.encode("en\0t\0x")),
      concat(encoder.encode("i\0"), Uint8Array.of(0, 0), encoder.encode("en")),
      concat(encoder.encode("i\0"), Uint8Array.of(0, 0), encoder.encode("en\0t")),
      concat(encoder.encode("i\0"), Uint8Array.of(0, 0), Uint8Array.of(0xff), encoder.encode("\0x\0")),
      concat(Uint8Array.of(0, 1, 0), encoder.encode("en\0t\0x")),
      concat(encoder.encode("\0"), encoder.encode("x")),
    ];
    for (const data of malformed) {
      const result = await parsePng(pngFile([pngChunk("IHDR", pngIhdr()), pngChunk("iTXt", data), pngChunk("IDAT", new Uint8Array()), pngChunk("IEND", new Uint8Array())]), limits, selection);
      expect(result.warnings.length).toBeGreaterThan(0);
    }
    const badCrc = pngFile([pngChunk("IHDR", pngIhdr()), pngChunk("tEXt", text, true), pngChunk("IDAT", new Uint8Array()), pngChunk("IEND", new Uint8Array())]);
    expect((await parsePng(badCrc, limits, selection)).warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
    const selected = await parsePng(file, limits, resolveSelection({ groups: ["Dimensions"] }));
    expect(selected.pngText).toHaveLength(0);
    expect(selected.blocks?.some(({ status }) => status === "skipped")).toBe(true);
    expect((await parsePng(file, resolveLimits({ maxStringBytes: 2, maxWarnings: 8 }), selection)).warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    expect((await parsePng(file, resolveLimits({ maxDecompressedBytes: 1, maxWarnings: 8 }), selection)).warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    const invalidType = pngFile([pngChunk("IHDR", pngIhdr()), pngChunk("ID!T", new Uint8Array()), pngChunk("IDAT", new Uint8Array()), pngChunk("IEND", new Uint8Array())]);
    expect((await parsePng(invalidType, limits)).warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_PNG" }));
    const trailing = concat(file, Uint8Array.of(1));
    expect((await parsePng(trailing, limits)).warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_PNG" }));
  });

  it("exercises WebP metadata alternatives, JFIF validation, and GIF extension boundaries", () => {
    const xmp = encoder.encode("<x:xmpmeta/>");
    const exif = minimalTiff();
    const vp8x = new Uint8Array(10);
    vp8x[4] = 1;
    vp8x[7] = 1;
    const profile = new Uint8Array(132);
    profile.set(encoder.encode("acsp"), 36);
    const webp = webpFile([webpChunk("VP8X", vp8x), webpChunk("EXIF", concat(encoder.encode("Exif\0\0"), exif)), webpChunk("XMP ", xmp), webpChunk("ICCP", profile), webpChunk("JUNK", Uint8Array.of(1))]);
    const parsed = parseWebp(webp, limits, selection);
    expect(parsed.dimensions).toEqual({ width: 2, height: 2 });
    expect(parsed.exif).not.toBeNull();
    expect(parsed.xmp?.packets).toEqual(["<x:xmpmeta/>"]);
    expect(parsed.blocks?.some(({ family }) => family === "ICC")).toBe(true);
    expect(parseWebp(webp, limits, resolveSelection({ groups: ["Dimensions"] })).blocks?.every(({ status }) => status === "skipped" || status === "decoded")).toBe(true);
    expect(parseWebp(webpFile([webpChunk("EXIF", exif), webpChunk("EXIF", exif)]), limits, selection).warnings).toContainEqual(expect.objectContaining({ code: "DUPLICATE_EXIF" }));
    expect(parseWebp(webpFile([webpChunk("XMP ", Uint8Array.of(0xff))]), limits, selection).warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
    expect(parseWebp(webpFile([webpChunk("ICCP", profile), webpChunk("ICCP", profile)]), limits, selection).warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
    expect(parseWebp(webpFile([webpChunk("EXIF", new Uint8Array(100))]), resolveLimits({ maxMetadataBytes: 1, maxWarnings: 8 }), selection).warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    expect(parseWebp(webp.slice(0, -1), limits, selection).warnings.length).toBeGreaterThan(0);

    const jfifBase = concat(encoder.encode("JFIF\0"), Uint8Array.of(1, 2, 0, 0, 72, 0, 72, 0, 0));
    expect(parseJfif(jfifBase)).toMatchObject({ version: "1.02", densityUnits: "none", xDensity: 72, yDensity: 72 });
    for (const unit of [0, 1, 2, 3]) expect(parseJfif(concat(encoder.encode("JFIF\0"), Uint8Array.of(1, 2, unit, 0, 1, 0, 2, 0, 0)))).not.toBeNull();
    expect(parseJfif(concat(encoder.encode("JFIF\0"), Uint8Array.of(1, 2, 0, 0, 1, 0, 2, 0, 2, 1, 0)))).toBeNull();
    expect(parseJfif(Uint8Array.of(1, 2, 3))).toBeNull();

    const comment = concat(Uint8Array.of(0x21, 0xfe), gifSubBlocks(encoder.encode("comment")));
    const application = concat(Uint8Array.of(0x21, 0xff, 11), encoder.encode("NETSCAPE2.0"), gifSubBlocks(Uint8Array.of(1, 2, 0)));
    const generic = concat(Uint8Array.of(0x21, 0xf0, 1, 7), gifSubBlocks(Uint8Array.of(8)));
    const image = concat(Uint8Array.of(0x2c, 0, 0, 0, 0, 2, 0, 1, 0, 0), Uint8Array.of(2), gifSubBlocks(Uint8Array.of(4, 1)),);
    const gif = gifFile([comment, application, generic, image]);
    const gifResult = parseGif(gif, limits, selection);
    expect(gifResult.fields).toEqual(expect.arrayContaining([expect.objectContaining({ name: "Comment", value: "comment" }), expect.objectContaining({ name: "LoopCount", value: 2 }), expect.objectContaining({ name: "FrameCount", value: 1 })]));
    expect(parseGif(gif, limits, resolveSelection({ groups: ["Dimensions"] })).fields.some(({ name }) => name === "Comment")).toBe(false);
    expect(parseGif(gif.slice(0, -2), limits).warnings.length).toBeGreaterThan(0);

    const xmpPacket = encoder.encode("<x:xmpmeta/>");
    const xmpExtension = concat(Uint8Array.of(0x21, 0xff, 11), encoder.encode("XMP DataXMP"), gifSubBlocks(concat(xmpPacket, Uint8Array.of(1))));
    const localImage = concat(Uint8Array.of(0x2c, 0, 0, 0, 0, 2, 0, 1, 0, 0x80), Uint8Array.of(0, 0, 0, 255, 255, 255), Uint8Array.of(2), gifSubBlocks(Uint8Array.of(4, 1)));
    const richGif = gifFile([xmpExtension, localImage], 0x80);
    const richResult = parseGif(richGif, limits, selection);
    expect(richResult.xmp?.packets).toEqual(["<x:xmpmeta/>"]);
    expect(richResult.fields).toContainEqual(expect.objectContaining({ name: "FrameCount", value: 1 }));
    expect(richResult.blocks).toContainEqual(expect.objectContaining({ family: "XMP", status: "decoded" }));
    expect(parseGif(richGif, limits, resolveSelection({ groups: ["Dimensions"] })).blocks).toContainEqual(expect.objectContaining({ family: "XMP", status: "skipped" }));
    const invalidXmp = gifFile([concat(Uint8Array.of(0x21, 0xff, 11), encoder.encode("XMP DataXMP"), gifSubBlocks(Uint8Array.of(0xff, 0xfe))) ]);
    expect(parseGif(invalidXmp, limits, selection).warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
    const limitedBlocks = gifFile([concat(Uint8Array.of(0x21, 0xfe), Uint8Array.of(2, 1, 2, 0))]);
    expect(parseGif(limitedBlocks, resolveLimits({ maxMetadataBytes: 1, maxWarnings: 8 }), selection).warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_GIF" }));
    const badGlobalTable = gifFile([], 0x87).slice(0, 13);
    expect(parseGif(badGlobalTable, limits, selection).warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_GIF" }));

    for (const type of ["VP8X", "VP8L", "VP8 "] as const) {
      const dimensions = parseWebp(webpFile([webpDimensionsChunk(type)]), limits, selection).dimensions;
      expect(dimensions, type).toEqual(type === "VP8X" ? { width: 2, height: 2 } : { width: 2, height: 1 });
    }
    const badVp8l = webpFile([webpChunk("VP8L", Uint8Array.of(0x2f, 1, 0, 0, 0xe0))]);
    expect(parseWebp(badVp8l, limits, selection).dimensions).toBeNull();
    const badVp8 = webpFile([webpChunk("VP8 ", Uint8Array.of(0x11, 0, 0, 0x9d, 1, 0x2a, 0, 0, 0, 0))]);
    expect(parseWebp(badVp8, limits, selection).dimensions).toBeNull();
  });

  it("uses bounded Blob materialization paths for each container and malformed adapters", async () => {
    const png = pngFile([pngChunk("IHDR", pngIhdr()), pngChunk("IDAT", Uint8Array.of(1)), pngChunk("IEND", new Uint8Array())]);
    const webp = webpFile([webpDimensionsChunk("VP8X")]);
    const jpeg = jpegMinimal();
    const tiff = minimalTiff();
    const asBlob = (bytes: Uint8Array): Blob => new Blob([bytes.slice().buffer]);
    const bounded = resolveLimits({ maxInputBytes: 64 * 1024, maxMetadataBytes: 32 * 1024, maxSegmentBytes: 32 * 1024 });
    expect((await materializeMetadata(asBlob(png), bounded, selection)).partial).toBe(true);
    expect((await materializeMetadata(asBlob(webp), bounded, selection)).partial).toBe(true);
    expect((await materializeMetadata(asBlob(tiff), bounded, selection)).bytes.length).toBeGreaterThan(0);
    expect((await materializeMetadata(asBlob(jpeg), bounded, selection)).partial).toBe(true);
    expect(await materializeInput(asBlob(png), bounded)).toEqual(png);
    expect(await materializeJpegHeader(asBlob(jpeg), bounded)).toEqual(jpeg.subarray(0, 25));
    expect((await materializeMetadata(Uint8Array.of(1, 2, 3), bounded, selection)).partial).toBe(false);
    const badSlice = { size: 4, arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)), slice: () => ({ arrayBuffer: () => Promise.resolve(Uint8Array.of(1)) }) } as unknown as Blob;
    await expect(materializeJpegHeader(badSlice, bounded)).rejects.toMatchObject({ code: "INVALID_VALUE" });
    const badWhole = { size: 1, arrayBuffer: () => Promise.resolve(Uint8Array.of(1)), slice: () => new Blob() } as unknown as Blob;
    await expect(materializeInput(badWhole, bounded)).rejects.toMatchObject({ code: "INVALID_VALUE" });
  });

  it("indexes a complete HEIF item graph and fails closed on malformed variants", () => {
    const fixture = heifItemFixture();
    const parsed = parseHeif(fixture, limits, "heif", selection);
    expect(parsed.dimensions).toEqual({ width: 2, height: 1 });
    expect(parsed.xmp?.packets).toEqual(["<x:xmpmeta xmlns:x=\"adobe:ns:meta/\"/>"]);
    expect(parsed.exif).not.toBeNull();
    expect(parsed.heif?.[0]?.items.some(({ roles }) => roles.includes("primary"))).toBe(true);
    expect(parsed.heif?.[0]?.properties.map(({ type }) => type)).toEqual(["ispe", "colr", "irot", "imir", "auxC"]);
    expect(parsed.heif?.[0]?.relationships.map(({ referenceType }) => referenceType)).toEqual(["cdsc", "cdsc", "thmb"]);
    expect(parsed.nclx).toMatchObject({ colourPrimaries: 1, transferCharacteristics: 13, matrixCoefficients: 6, fullRange: true });
    expect(parsed.transform).toMatchObject({ rotation: 90, mirrored: true, mirrorAxis: "vertical" });

    const variants = [
      fixture.slice(0, fixture.length - 1),
      concat(fixture, box("meta", Uint8Array.of(0, 0, 0))),
      fixture.slice(),
    ];
    variants[2]?.set(Uint8Array.of(0, 0, 0, 1), 0);
    for (const variant of variants) {
      const result = parseHeif(variant, limits, "heif", selection);
      expect(result.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
      expect(result.fields.length).toBeLessThanOrEqual(limits.maxAdapterItems);
    }
    expect(parseHeif(fixture, resolveLimits({ maxIfdDepth: 1, maxWarnings: 4 }), "heif", selection).warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    expect(parseHeif(fixture, resolveLimits({ maxSegments: 1, maxWarnings: 4 }), "heif", selection).warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    expect(parseHeif(fixture, resolveLimits({ maxMetadataBytes: 1, maxWarnings: 8 }), "heif", selection).warnings).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));
    expect(parseHeif(fixture, limits, "avif", resolveSelection({ groups: ["Dimensions"] })).xmp).toBeNull();
  });

  it("keeps every repository container prefix bounded and diagnostically typed", async () => {
    const names = [
      "jpeg-exif-little-endian.jpg",
      "jpeg-icc.jpg",
      "jpeg-iptc.jpg",
      "jpeg-icc-malformed.jpg",
      "jpeg-iptc-malformed.jpg",
      "png-metadata.png",
      "png-bad-text.png",
      "png-icc-malformed.png",
      "webp-metadata.webp",
      "webp-truncated.webp",
      "tiff-metadata.tif",
      "tiff-exif-little-endian.tif",
      "tiff-metadata-truncated.tif",
      "heif-metadata.heic",
      "heif-conflicting-primary-dimensions.heic",
      "heif-cross-meta-item-reference.heic",
      "heif-idat-item-metadata.heic",
      "heif-indexed-idat-item-metadata.heic",
      "heif-iref-exif.heic",
      "heif-item-metadata.heic",
      "heif-primary-dimensions.heic",
      "heif-primary-icc-malformed.heic",
      "heif-primary-icc.heic",
      "heif-tail-idat-item-metadata.heic",
      "avif-idat-item-metadata.avif",
      "avif-item-metadata.avif",
      "avif-metadata.avif",
      "avif-primary-dimensions.avif",
      "avif-primary-icc.avif",
      "avif-primary-nclx.avif",
      "libavif-paris-icc-exif-xmp.avif",
      "sips-heic-exif-xmp.heic",
    ] as const;
    for (const name of names) {
      const source = new Uint8Array(await readFile(new URL("./fixtures/" + name, import.meta.url)));
      const cuts = [...new Set([0, 1, 2, 4, 8, 12, 16, 32, Math.floor(source.length / 4), Math.floor(source.length / 2), Math.max(0, source.length - 1), source.length])].filter((cut) => cut <= source.length);
      for (const cut of cuts) {
        const result = await parseMetadata(source.subarray(0, cut), {
          limits: {
            maxInputBytes: 256 * 1024,
            maxMetadataBytes: 32 * 1024,
            maxSegmentBytes: 16 * 1024,
            maxValueBytes: 16 * 1024,
            maxStringBytes: 16 * 1024,
            maxWarnings: 64,
            maxSegments: 256,
            maxIfdEntries: 128,
            maxIfdDepth: 8,
          },
        });
        expect(result.fields.length, `${name} prefix ${cut}`).toBeLessThanOrEqual(4096);
        expect(result.blocks.length, `${name} blocks ${cut}`).toBeLessThanOrEqual(4096);
        expect(result.warnings.length, `${name} warnings ${cut}`).toBeLessThanOrEqual(64);
        expect(result.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
      }
    }
  }, 120_000);
});
