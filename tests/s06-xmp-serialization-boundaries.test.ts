import { describe, expect, it } from "vitest";

import {
  IptcSerializationError,
  XmpSerializationError,
  chunkExtendedXmp,
  serializeIptcIim,
  serializePhotoshopIptcResources,
  serializeStructuredXmp,
  serializeXmp,
} from "../src/metadata/serialization.js";
import {
  extendedXmpGuid,
  mergeStructuredXmp,
  parseExtendedXmpChunk,
  parseStructuredXmp,
  parseStructuredXmpBytes,
  parseStructuredXmpBytesDetailed,
  parseStructuredXmpBytesWithDecoder,
  parseStructuredXmpDetailed,
  parseStructuredXmpDocuments,
  parseStructuredXmpWithDecoderDetailed,
  parseXmpPacket,
  reassembleExtendedXmp,
  validateStructuredXmpPacket,
} from "../src/metadata/xmp.js";
import { deriveXmpPacketProvenance } from "../src/metadata/xmp.js";
import type { XmpLiteralValue, XmpProperty, XmpQualifiedName, XmpRdfDocument, XmpValue } from "../src/metadata/xmp.js";

const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const DC = "http://purl.org/dc/elements/1.1/";
const EX = "https://example.invalid/metadata/";
const XMP_IDENTIFIER = new TextEncoder().encode("http://ns.adobe.com/xap/1.0/\0");
const EXTENDED_IDENTIFIER = new TextEncoder().encode("http://ns.adobe.com/xmp/extension/\0");

function name(namespaceUri: string, localName: string, prefix: string): XmpQualifiedName {
  return { namespaceUri, localName, prefix, qualifiedName: `${prefix}:${localName}` };
}

function literal(lexicalValue: string, language: string | null = null, qualifiers: XmpValue["qualifiers"] = []): XmpLiteralValue {
  return { kind: "literal", lexicalValue, value: lexicalValue, datatypeUri: null, language, qualifiers };
}

function property(propertyName: XmpQualifiedName, value: XmpValue, order: number): XmpProperty {
  return { name: propertyName, value, qualifiers: value.qualifiers, order, sourceStart: 0, sourceEnd: 0, aliasOf: null };
}

function document(properties: readonly XmpProperty[], namespaces: readonly { prefix: string; namespaceUri: string; order: number }[] = [{ prefix: "ex", namespaceUri: EX, order: 0 }]): XmpRdfDocument {
  return { namespaces, descriptions: [{ subject: "", typeName: null, properties, sourceStart: 0, sourceEnd: 0 }], properties: [...properties], sourceLength: 0 };
}

function chunk(payload: Uint8Array, guid = "0123456789ABCDEF0123456789ABCDEF", fullLength = payload.length, offset = 0): Uint8Array {
  const result = new Uint8Array(EXTENDED_IDENTIFIER.length + 40 + payload.length);
  result.set(EXTENDED_IDENTIFIER);
  result.set(new TextEncoder().encode(guid), EXTENDED_IDENTIFIER.length);
  const view = new DataView(result.buffer);
  view.setUint32(EXTENDED_IDENTIFIER.length + 32, fullLength, false);
  view.setUint32(EXTENDED_IDENTIFIER.length + 36, offset, false);
  result.set(payload, EXTENDED_IDENTIFIER.length + 40);
  return result;
}

describe("S06 XMP/XML and metadata serialization boundary matrix", () => {
  it("covers safe XML parsing branches, RDF structures, aliases, lexical types, and limits", () => {
    const packet = `<root xmlns="${EX}" xmlns:rdf="${RDF}" xmlns:dc="${DC}" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/" xml:lang="en"><rdf:RDF><rdf:Description rdf:ID="id-1" dc:title="attribute-title" photoshop:Authors="Ada"><dc:description><rdf:Alt><rdf:li xml:lang="fr">Bonjour &amp; salut</rdf:li><rdf:li xml:lang="x-default">Hello</rdf:li></rdf:Alt></dc:description><photoshop:Authors><rdf:Seq><rdf:li>Ada</rdf:li><rdf:li>Grace</rdf:li></rdf:Seq></photoshop:Authors><ex:literal xmlns:ex="${EX}" rdf:parseType="Literal"><strong>raw</strong></ex:literal><ex:resource xmlns:ex="${EX}" rdf:parseType="Resource"><rdf:Description rdf:nodeID="person"><rdf:type rdf:resource="${EX}Person"/><ex:name ex:confidence="high">Ada</ex:name></rdf:Description></ex:resource><ex:plain xmlns:ex="${EX}"><nested>text</nested></ex:plain><ex:number xmlns:ex="${EX}" rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">9007199254740993</ex:number><ex:boolean xmlns:ex="${EX}" rdf:datatype="http://www.w3.org/2001/XMLSchema#boolean">maybe</ex:boolean><ex:decimal xmlns:ex="${EX}" rdf:datatype="http://www.w3.org/2001/XMLSchema#decimal">1.25</ex:decimal><ex:double xmlns:ex="${EX}" rdf:datatype="http://www.w3.org/2001/XMLSchema#double">INF</ex:double></rdf:Description></rdf:RDF></root>`;
    const parsed = parseStructuredXmpDetailed(packet);
    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.value?.rdf?.descriptions[0]?.subject).toBe("id-1");
    expect(parsed.value?.rdf?.properties.map((item) => item.name.localName)).toEqual(["title", "Authors", "description", "Authors", "literal", "resource", "plain", "number", "boolean", "decimal", "double"]);
    expect(parsed.value?.rdf?.properties.find((item) => item.name.localName === "description")?.value).toMatchObject({ kind: "array", container: "Alt", items: [{ language: "fr" }, { language: "x-default" }] });
    expect(parsed.value?.rdf?.properties.filter((item) => item.name.localName === "Authors")[0]?.aliasOf?.localName).toBe("creator");
    const resourceValue = parsed.value?.rdf?.properties.find((item) => item.name.localName === "resource")?.value;
    expect(resourceValue).toMatchObject({ kind: "typed-resource", nodeId: "person", typeName: { localName: "Person" } });
    expect(resourceValue?.kind === "typed-resource" && resourceValue.properties.some((item) => item.name.localName === "name" && item.qualifiers.some((item) => item.name.localName === "confidence"))).toBe(true);
    expect(parsed.value?.rdf?.properties.find((item) => item.name.localName === "literal")?.value).toMatchObject({ kind: "literal", parseType: "Literal", lexicalValue: "raw" });
    expect(parsed.value?.rdf?.properties.find((item) => item.name.localName === "plain")?.value).toMatchObject({ kind: "resource", properties: [{ name: { localName: "nested" } }] });
    expect(parsed.value?.rdf?.properties.find((item) => item.name.localName === "number")?.value).toMatchObject({ lexicalValue: "9007199254740993", value: "9007199254740993" });
    expect(parsed.value?.rdf?.properties.find((item) => item.name.localName === "boolean")?.value).toMatchObject({ lexicalValue: "maybe", value: "maybe" });
    expect(parsed.value?.rdf?.properties.find((item) => item.name.localName === "decimal")?.value).toMatchObject({ value: 1.25 });
    expect(parsed.value?.rdf?.properties.find((item) => item.name.localName === "double")?.value).toMatchObject({ lexicalValue: "INF", value: "INF" });
    expect(validateStructuredXmpPacket(parsed.value)).toBe(true);
    expect(validateStructuredXmpPacket(parsed.value, { maxProperties: 1 })).toBe(false);

    const valid = `<rdf:RDF xmlns:rdf="${RDF}" xmlns:ex="${EX}"><rdf:Description><ex:value><![CDATA[A]]> &amp; B</ex:value><!-- retained --></rdf:Description></rdf:RDF>`;
    expect(parseStructuredXmp(valid)?.rdf?.properties.find((item) => item.name.localName === "value")?.value).toMatchObject({ lexicalValue: "A & B" });
    expect(parseStructuredXmp(`<?xml version="1.0"?>${valid}`)?.rdf?.sourceLength).toBeGreaterThan(valid.length);
    expect(parseStructuredXmpDetailed(`${valid} trailing`).value).toBeNull();
    const options = ["maxInputBytes", "maxElements", "maxDepth", "maxAttributes", "maxNamespaces", "maxTextBytes", "maxArrayItems", "maxQualifiers", "maxOutputBytes", "maxPackets"] as const;
    for (const option of options) expect(parseStructuredXmpDetailed(valid, { [option]: 0 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed(`<rdf:RDF xmlns:rdf="${RDF}" xmlns:ex="${EX}"><rdf:Description><ex:value>${"x".repeat(20)}</ex:value></rdf:Description></rdf:RDF>`, { maxTextBytes: 4 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed(`<rdf:RDF xmlns:rdf="${RDF}" xmlns:ex="${EX}"><rdf:Description ex:a="1" ex:b="2"><ex:value ex:q="1">x</ex:value></rdf:Description></rdf:RDF>`, { maxQualifiers: 0 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed(`<rdf:RDF xmlns:rdf="${RDF}" xmlns:ex="${EX}"><rdf:Description><ex:value><rdf:Bag><rdf:li>1</rdf:li><rdf:li>2</rdf:li></rdf:Bag></ex:value></rdf:Description></rdf:RDF>`, { maxArrayItems: 1 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
  });

  it("covers malformed XML, namespace refusal, entity hazards, and bounded decoder adapters", () => {
    const invalid = [
      "",
      "text",
      "<a>",
      "<a></b>",
      "<a a='1' a='2'/>",
      "<a x:value='1'/>",
      "<a xmlns:xml='urn:wrong'/>",
      "<a xmlns:x='http://www.w3.org/XML/1998/namespace' x:value='1'/>",
      "<a xmlns='http://www.w3.org/2000/xmlns/'/>",
      "<a x:bad='&unknown;' xmlns:x='urn:x'/>",
      "<a><![CDATA[unterminated</a>",
      "<a><!-- unterminated</a>",
      "<a><?pi unterminated</a>",
      "<a><b/></a><c/>",
      "<1bad/>",
    ];
    for (const value of invalid) {
      const result = parseStructuredXmpDetailed(value);
      expect(result.value).toBeNull();
      expect(result.diagnostics.length).toBeGreaterThan(0);
      expect(result.diagnostics.every((item) => /^[A-Z_]+$/u.test(item.code))).toBe(true);
    }
    expect(parseStructuredXmpDetailed("<!DOCTYPE a><a/>").diagnostics[0]?.code).toBe("UNSAFE_ENTITY");
    expect(parseStructuredXmpDetailed("<a>&#x110000;</a>").diagnostics[0]?.code).toBe("UNSAFE_ENTITY");
    expect(parseStructuredXmpBytesDetailed(Uint8Array.of(0xff)).diagnostics[0]?.code).toBe("MALFORMED_XML");
    expect(parseStructuredXmpBytesDetailed(new TextEncoder().encode("<a/>"), { maxInputBytes: 1 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");

    const valid = `<rdf:RDF xmlns:rdf="${RDF}" xmlns:ex="${EX}"><rdf:Description><ex:value>one</ex:value></rdf:Description></rdf:RDF>`;
    expect(parseStructuredXmpWithDecoderDetailed(valid, { parse: () => null }).diagnostics[0]?.code).toBe("INVALID_ADAPTER_OUTPUT");
    expect(parseStructuredXmpWithDecoderDetailed(valid, { parse: () => { throw new Error("adapter"); } }).diagnostics[0]?.code).toBe("INVALID_ADAPTER_OUTPUT");
    expect(parseStructuredXmpWithDecoderDetailed(valid, { parse: () => ({ namespaces: { ex: EX }, properties: { "ex:value": 1 } } as never) }).diagnostics[0]?.code).toBe("INVALID_ADAPTER_OUTPUT");
    expect(parseStructuredXmpDocuments([valid, valid], { maxPackets: 1 }).documents).toHaveLength(2);
    expect(parseStructuredXmpDocuments([], { maxPackets: 1 }).merged.properties).toEqual([]);
    expect(parseXmpPacket(new Uint8Array([1]), 10)).toMatchObject({ matched: false, packet: null });
    expect(parseXmpPacket(Uint8Array.from([...XMP_IDENTIFIER, 0xff]), 10)).toMatchObject({ matched: true, packet: null });
    expect(parseXmpPacket(Uint8Array.from([...XMP_IDENTIFIER, 1, 2]), 1)).toMatchObject({ matched: true, packet: null });
    expect(parseXmpPacket(Uint8Array.from([...XMP_IDENTIFIER, ...new TextEncoder().encode("<a/>")]), 10)).toMatchObject({ matched: true, packet: "<a/>" });
  });

  it("covers deterministic XMP model serialization for legacy values, resources, qualifiers, and limits", () => {
    const qualifier = name(EX, "confidence", "ex");
    const resource: XmpValue = {
      kind: "resource", resourceUri: null, nodeId: null, typeName: null,
      properties: [property(name(EX, "nested", "ex"), literal("nested"), 0)],
      qualifiers: [{ name: qualifier, value: literal("high"), order: 0 }],
    };
    const model = document([
      property(name(EX, "text", "ex"), literal("A & <B>", "en", [{ name: qualifier, value: literal("literal"), order: 0 }]), 0),
      property(name(EX, "bag", "ex"), { kind: "array", container: "Bag", items: [literal("one"), literal("two")], qualifiers: [] }, 1),
      property(name(EX, "seq", "ex"), { kind: "array", container: "Seq", items: [literal("first"), literal("second")], qualifiers: [] }, 2),
      property(name(EX, "alt", "ex"), { kind: "array", container: "Alt", items: [literal("English", "en"), literal("Default", "x-default")], qualifiers: [] }, 3),
      property(name(EX, "resource", "ex"), resource, 4),
      property(name(EX, "uri", "ex"), { kind: "resource", resourceUri: "https://example.invalid/r?x=\"&", nodeId: null, typeName: null, properties: [], qualifiers: [] }, 5),
      property(name(EX, "blank", "ex"), { kind: "blank-node", resourceUri: null, nodeId: "b1", typeName: null, properties: [], qualifiers: [] }, 6),
      property(name(EX, "typed", "ex"), { kind: "typed-resource", resourceUri: "https://example.invalid/t", nodeId: null, typeName: name(EX, "Thing", "ex"), properties: [], qualifiers: [] }, 7),
      property(name(EX, "literalXml", "ex"), { kind: "literal", lexicalValue: "<em>raw</em>", value: "<em>raw</em>", datatypeUri: null, language: null, qualifiers: [], parseType: "Literal" }, 8),
    ]);
    const wrapped = serializeStructuredXmp(model);
    const bare = serializeXmp(model, { includeWrapper: false });
    expect(wrapped).toContain("rdf:Bag");
    expect(wrapped).toContain("rdf:parseType=\"Resource\"");
    expect(wrapped).toContain("&amp;");
    expect(bare.startsWith("<rdf:RDF")).toBe(true);
    expect(parseStructuredXmp(wrapped)?.rdf?.properties).toHaveLength(9);
    expect(parseStructuredXmp(bare)?.rdf?.properties).toHaveLength(9);

    const legacy = serializeStructuredXmp({ namespaces: { ex: EX }, properties: { "ex:text": "text", "ex:items": ["one", "two"], "ex:labels": { "x-default": "Default", fr: "Bonjour" } } });
    expect(parseStructuredXmp(legacy)?.properties).toMatchObject({ "ex:text": "text", "ex:items": ["one", "two"], "ex:labels": { "x-default": "Default", fr: "Bonjour" } });
    expect(() => serializeStructuredXmp({ namespaces: { ex: EX }, properties: { text: "bad" } })).toThrow(XmpSerializationError);
    expect(() => serializeStructuredXmp({ namespaces: { ex: EX }, properties: { "bad:name": "bad" } })).toThrow(XmpSerializationError);
    expect(() => serializeStructuredXmp(document([property(name(EX, "value", "ex"), literal("x"), 0)]), { maxOutputBytes: 1 })).toThrow(XmpSerializationError);
    expect(() => serializeStructuredXmp(document([property(name(EX, "value", "ex"), literal("x"), 0)]), { maxOutputBytes: 0 })).toThrow(XmpSerializationError);
    const deep: XmpValue = { kind: "resource", resourceUri: null, nodeId: null, typeName: null, properties: [], qualifiers: [] };
    let nested = deep;
    for (let index = 0; index < 66; index += 1) nested = { kind: "resource", resourceUri: null, nodeId: null, typeName: null, properties: [property(name(EX, `n${index}`, "ex"), nested, 0)], qualifiers: [] };
    expect(() => serializeStructuredXmp(document([property(name(EX, "deep", "ex"), nested, 0)]))).toThrow(XmpSerializationError);
  });

  it("covers extended-XMP chunk validation and deterministic reassembly outcomes", async () => {
    expect(extendedXmpGuid("<x:xmpmeta HasExtendedXMP=\"abcdefabcdefabcdefabcdefabcdefab\"/>")) .toBe("ABCDEFABCDEFABCDEFABCDEFABCDEFAB");
    expect(extendedXmpGuid("<x:xmpmeta/>")).toBeNull();
    expect(parseExtendedXmpChunk(chunk(new TextEncoder().encode("abc")))).toMatchObject({ guid: "0123456789ABCDEF0123456789ABCDEF", fullLength: 3, offset: 0, data: new TextEncoder().encode("abc") });
    expect(parseExtendedXmpChunk(Uint8Array.of(1, 2))).toBeNull();
    expect(parseExtendedXmpChunk(chunk(new TextEncoder().encode("abc"), "not-a-guid"))).toBeNull();
    expect(parseExtendedXmpChunk(chunk(new TextEncoder().encode("abc"), undefined, 2))).toBeNull();
    expect(parseExtendedXmpChunk(chunk(new TextEncoder().encode("abc"), undefined, 3, 2))).toBeNull();
    const result = await chunkExtendedXmp("abcdefgh", { maxChunkBytes: 3, guid: "abcdefabcdefabcdefabcdefabcdefab" });
    const chunks = result.chunks.map((item) => parseExtendedXmpChunk(item)).filter((item): item is NonNullable<typeof item> => item !== null);
    expect(result.guid).toBe("ABCDEFABCDEFABCDEFABCDEFABCDEFAB");
    expect(reassembleExtendedXmp(chunks.reverse(), 20)).toBe("abcdefgh");
    expect(reassembleExtendedXmp(chunks, 2)).toBeNull();
    const firstChunk = chunks[0];
    const secondChunk = chunks[1];
    if (!firstChunk || !secondChunk) throw new Error("extended XMP chunk fixture did not split");
    expect(reassembleExtendedXmp([firstChunk, { ...firstChunk, fullLength: result.fullLength + 1 }], 20)).toBeNull();
    expect(reassembleExtendedXmp([firstChunk, { ...secondChunk, offset: 1 }], 20)).toBeNull();
    expect(reassembleExtendedXmp([{ ...firstChunk, data: Uint8Array.of(0xff), fullLength: 1 }], 20)).toBeNull();
    await expect(chunkExtendedXmp(new Uint8Array(), { maxChunkBytes: 1 })).rejects.toThrow(XmpSerializationError);
    await expect(chunkExtendedXmp("x", { maxChunkBytes: 0 })).rejects.toThrow(XmpSerializationError);
    await expect(chunkExtendedXmp("x", { guid: "bad" })).rejects.toThrow(XmpSerializationError);
  });

  it("covers IIM and Photoshop serialization limits, cardinality, raw bytes, and synchronization branches", () => {
    expect(() => serializeIptcIim([], { maxOutputBytes: 0 })).toThrow(IptcSerializationError);
    expect(() => serializeIptcIim([], { maxDatasets: 0 })).toThrow(IptcSerializationError);
    expect(() => serializeIptcIim(new Array(2).fill({ record: 2, dataset: 25, value: "x" }), { maxDatasets: 1 })).toThrow(IptcSerializationError);
    expect(() => serializeIptcIim([{ record: -1, dataset: 25, value: "x" }])).toThrow(IptcSerializationError);
    expect(() => serializeIptcIim([{ record: 2, dataset: 90, value: "x" }, { record: 2, dataset: 90, value: "y" }])).toThrow(IptcSerializationError);
    expect(() => serializeIptcIim([{ record: 1, dataset: 1, value: "x" }])).toThrow(IptcSerializationError);
    expect(() => serializeIptcIim([{ record: 2, dataset: 25, value: "bad\ud800" }])).toThrow(IptcSerializationError);
    expect(() => serializeIptcIim([{ record: 2, dataset: 25, value: "é", encoding: "latin1" }])).not.toThrow();
    expect(() => serializeIptcIim([{ record: 2, dataset: 25, value: "€", encoding: "latin1" }])).toThrow(IptcSerializationError);
    expect(() => serializeIptcIim([{ record: 9, dataset: 9, value: new Uint8Array(0x8000) }], { allowExtendedLengths: false, invalidValuePolicy: "preserve-raw" })).toThrow(IptcSerializationError);
    const raw = serializeIptcIim([{ record: 0, dataset: 2, value: Uint8Array.of(1, 2) }], { invalidValuePolicy: "preserve-raw" });
    expect(raw.length).toBeGreaterThan(0);
    expect(() => serializeIptcIim([{ record: 0, dataset: 2, value: "raw" }], { invalidValuePolicy: "preserve-raw" })).toThrow(IptcSerializationError);
    expect(() => serializePhotoshopIptcResources([], { resourceName: new Uint8Array(256) })).toThrow(IptcSerializationError);
    expect(() => serializePhotoshopIptcResources([new Uint8Array([1, 2, 3])], { maxOutputBytes: 1 })).toThrow(IptcSerializationError);
    expect(serializePhotoshopIptcResources(new Uint8Array([1, 2, 3]), { resourceName: new Uint8Array([65]) }).length % 2).toBe(0);

    const xmp = parseStructuredXmp(`<rdf:RDF xmlns:rdf="${RDF}" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"><rdf:Description><photoshop:City>London</photoshop:City><photoshop:Country>GBR</photoshop:Country></rdf:Description></rdf:RDF>`);
    if (xmp === null) throw new Error("expected synchronization XMP model");
    expect(mergeStructuredXmp([{ value: null }, { value: xmp, packetIndex: 3, sourceId: "source" }], "preserve-all").properties[0]?.sourceId).toBe("source");
    expect(parseStructuredXmpDocuments(["bad"], { mergePolicy: "last" }).merged.policy).toBe("last");
    expect(parseStructuredXmpDocuments(["bad"], { mergePolicy: "preserve-all" }).merged.properties).toEqual([]);
  });

  it("covers XMP packet provenance, byte adapters, XML lexical boundaries, and bounded adapter outcomes", () => {
    const direct = { id: "xmp:direct", family: "XMP", container: "JPEG APP1 XMP", status: "decoded", offset: 10, length: 20, associatedImage: null, sensitivity: "moderate", warningCodes: [] } as const;
    const assembled = { id: "xmp:assembled:0123456789ABCDEF0123456789ABCDEF", family: "XMP", container: "Assembled Extended XMP", status: "decoded", offset: 30, length: 40, relatedBlockIds: ["xmp:extension:0"], associatedImage: null, sensitivity: "moderate", warningCodes: [] } as const;
    expect(deriveXmpPacketProvenance(["a", "b", "c"], [direct, assembled])).toMatchObject([
      { id: "xmp:direct", source: "embedded", blockIds: ["xmp:direct"] },
      { id: "xmp:assembled:0123456789ABCDEF0123456789ABCDEF", source: "extended-embedded", blockIds: ["xmp:assembled:0123456789ABCDEF0123456789ABCDEF", "xmp:extension:0"], extendedGuid: "0123456789ABCDEF0123456789ABCDEF" },
      { id: "xmp:packet:2", source: "embedded", blockIds: [] },
    ]);

    const packet = `<rdf:RDF xmlns:rdf="${RDF}" xmlns:ex="${EX}"><rdf:Description><ex:value xml:lang="en">A &#65; &#x42;</ex:value></rdf:Description></rdf:RDF>`;
    const bytes = new TextEncoder().encode(packet);
    expect(parseStructuredXmpBytes(bytes)?.properties["ex:value"]).toBe("A A B");
    expect(parseStructuredXmpBytesWithDecoder(bytes, { parse: () => ({ namespaces: { ex: EX }, properties: { "ex:value": "adapter" } }) })?.properties["ex:value"]).toBe("adapter");
    expect(parseStructuredXmpBytes(new Uint8Array([0xff]), { maxInputBytes: 4 })).toBeNull();
    expect(parseStructuredXmpBytesWithDecoder(bytes, { parse: () => ({ namespaces: {}, properties: {} }) }, { maxInputBytes: 1 })).toBeNull();
    expect(validateStructuredXmpPacket(null)).toBe(false);
    expect(validateStructuredXmpPacket({ namespaces: null, properties: {} })).toBe(false);
    expect(validateStructuredXmpPacket({ namespaces: {}, properties: null })).toBe(false);
    expect(validateStructuredXmpPacket({ namespaces: { ex: 1 }, properties: {} })).toBe(false);
    expect(validateStructuredXmpPacket({ namespaces: {}, properties: { "ex:value": ["ok", 1] } })).toBe(false);
    expect(validateStructuredXmpPacket({ namespaces: {}, properties: { "ex:value": { en: 1 } } })).toBe(false);
    expect(validateStructuredXmpPacket({ namespaces: {}, properties: { "ex:value": "ok" } }, { maxOutputBytes: 1 })).toBe(false);

    const malformed = [
      "<a x=1/>", "<a x='1></a>", "<a x:bad='1' xmlns:x='urn:x' x:bad='2'/>",
      "<a xmlns='http://www.w3.org/2000/xmlns/'/>", "<a xmlns:xmlns='urn:x'/>", "<a xmlns:x='urn:x' xmlns:x='urn:y'/>",
      "<a xmlns:x='urn:x' x:y='1' x:y='2'/>", "<a xmlns:x='urn:x' x:y='1'/>tail", "head<a xmlns:x='urn:x'/>",
      "<a><![CDATA[unterminated</a>", "<a><!-- unterminated</a>", "<a><?pi unterminated</a>", "<a>&unknown;</a>", "<a>&#xD800;</a>",
      "<a>&#999999999999999999999999;</a>", "<a><b></a>", "<a><b/>", "<a/><b/>", "<a><b></b></a>tail",
      "<a xmlns:x='urn:x' y:z='1'/>", "<![bad]><a/>",
    ];
    for (const value of malformed) {
      const result = parseStructuredXmpDetailed(value);
      expect(result.value).toBeNull();
      expect(result.diagnostics.length).toBeGreaterThan(0);
    }
    expect(parseStructuredXmpDetailed("<a>text &amp; more</a>").diagnostics).toEqual([]);
    expect(parseStructuredXmpDetailed("<a><![CDATA[text]]></a>").diagnostics).toEqual([]);
    expect(parseStructuredXmpDetailed("<a><?pi ok?></a>").diagnostics).toEqual([]);
    expect(parseStructuredXmpDetailed("<a><!-- ok --></a>").diagnostics).toEqual([]);
    expect(parseStructuredXmpDetailed("<a>text &bogus;</a>").diagnostics[0]?.code).toBe("UNSAFE_ENTITY");
    expect(parseStructuredXmpDetailed("<a><b/></a>", { maxElements: 1 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed("<a xmlns:x='urn:x' x:a='1'/>", { maxAttributes: 1 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed("<a xmlns:x='urn:x' x:a='1'/>", { maxNamespaces: 0 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed("<a xmlns:x='urn:x' x:a='1'/>", { maxDepth: 0 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed(packet, { maxTextBytes: 1 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed(packet, { maxProperties: 0 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed(packet, { maxQualifiers: 0 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed(packet, { maxArrayItems: 0 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
  });

  it("covers XMP value forms, conflicts, extended chunk reassembly, and serialization-safe limits", () => {
    const valuePacket = `<rdf:RDF xmlns:rdf="${RDF}" xmlns:ex="${EX}"><rdf:Description rdf:about="urn:subject"><ex:uri rdf:resource="https://example.invalid/a"/><ex:blank rdf:nodeID="b1"/><ex:bag><rdf:Bag><rdf:li>one</rdf:li></rdf:Bag></ex:bag><ex:literal rdf:parseType="Literal">raw</ex:literal><ex:typed rdf:parseType="Resource"><rdf:value>v</rdf:value><ex:qualifier>q</ex:qualifier></ex:typed><ex:nested><ex:child>v</ex:child></ex:nested><rdf:type rdf:resource="${EX}Thing"/></rdf:Description></rdf:RDF>`;
    const parsed = parseStructuredXmp(valuePacket);
    expect(parsed?.rdf?.properties.map((property) => property.value.kind)).toEqual(["resource", "blank-node", "array", "literal", "literal", "resource", "resource"]);
    expect(parsed?.rdf?.descriptions[0]?.typeName?.localName).toBe("Thing");
    const second = parseStructuredXmp(valuePacket.replace("https://example.invalid/a", "https://example.invalid/b"));
    if (parsed === null || second === null) throw new Error("expected XMP values");
    expect(mergeStructuredXmp([{ value: parsed }, { value: second }], "last").properties[0]?.property.value).toMatchObject({ resourceUri: "https://example.invalid/b" });
    expect(mergeStructuredXmp([{ value: parsed }, { value: second }], "preserve-all").conflicts.length).toBeGreaterThan(0);
    expect(mergeStructuredXmp([{ value: null }, { value: null }], "first").properties).toEqual([]);

    const first = parseExtendedXmpChunk(chunk(new TextEncoder().encode("ab"), undefined, 4, 0));
    const secondChunk = parseExtendedXmpChunk(chunk(new TextEncoder().encode("cd"), undefined, 4, 2));
    if (first === null || secondChunk === null) throw new Error("expected extended chunks");
    expect(reassembleExtendedXmp([secondChunk, first], 10)).toBe("abcd");
    expect(reassembleExtendedXmp([{ ...first, offset: 1 }, secondChunk], 10)).toBeNull();
    expect(reassembleExtendedXmp([{ ...first, data: new Uint8Array([0xff, 0xfe]), fullLength: 2 }], 10)).toBeNull();
    expect(parseExtendedXmpChunk(new Uint8Array([...EXTENDED_IDENTIFIER, ...new TextEncoder().encode("0123456789ABCDEF0123456789ABCDEF"), 0, 0, 0, 0, 0, 0, 0, 0]))).toBeNull();
    expect(parseExtendedXmpChunk(new Uint8Array([...EXTENDED_IDENTIFIER, ...new TextEncoder().encode("0123456789ABCDEF0123456789ABCDEF"), 0, 0, 0, 4, 0, 0, 0, 5, 97]))).toBeNull();
  });
});
