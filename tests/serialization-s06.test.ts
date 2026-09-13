import { describe, expect, it } from "vitest";
import { IPTC_TECHREFERENCE_PROPERTIES } from "../src/generated/iptc-pmd.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";
import { parseIptcMetadata } from "../src/metadata/iptc.js";
import { chunkExtendedXmp, IptcSerializationError, IptcSynchronizationError, serializeIptcIim, serializePhotoshopIptcResources, serializeStructuredXmp, synchronizeIptcXmp } from "../src/metadata/serialization.js";
import { parseExtendedXmpChunk, parseStructuredXmp, reassembleExtendedXmp } from "../src/metadata/xmp.js";
import type { XmpLiteralValue, XmpProperty, XmpQualifiedName, XmpRdfDocument, XmpValue } from "../src/metadata/xmp.js";

const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const DC = "http://purl.org/dc/elements/1.1/";
const EXAMPLE = "https://example.invalid/metadata/";
const text = (lexicalValue: string, language: string | null = null): XmpLiteralValue => ({ kind: "literal", lexicalValue, value: lexicalValue, datatypeUri: null, language, qualifiers: [] });
const name = (namespaceUri: string, localName: string, prefix: string): XmpQualifiedName => ({ namespaceUri, localName, prefix, qualifiedName: `${prefix}:${localName}` });
const property = (propertyName: XmpQualifiedName, value: XmpValue, order: number): XmpProperty => ({ name: propertyName, value, qualifiers: value.qualifiers, order, sourceStart: 0, sourceEnd: 0, aliasOf: null });

function iim(record: number, dataset: number, value: Uint8Array): Uint8Array {
  return Uint8Array.from([0x1c, record, dataset, value.length >>> 8, value.length & 0xff, ...value]);
}

describe("S06 standards-aware serializers", () => {
  it("round-trips deterministic RDF/XML lexical values, arrays, language alternatives, resources, and qualifiers", () => {
    const qualifier = name(EXAMPLE, "confidence", "ex");
    const resource = {
      kind: "typed-resource" as const,
      resourceUri: "https://example.invalid/person/1",
      nodeId: null,
      typeName: name(EXAMPLE, "Person", "ex"),
      properties: [property(name(EXAMPLE, "name", "ex"), text("Ada & <Grace>"), 0)],
      qualifiers: [{ name: qualifier, value: { kind: "array" as const, container: "Seq" as const, items: [text("0.8")], qualifiers: [] }, order: 0 }],
    };
    const document: XmpRdfDocument = {
      namespaces: [
        { prefix: "dc", namespaceUri: DC, order: 0 },
        { prefix: "ex", namespaceUri: EXAMPLE, order: 1 },
      ],
      descriptions: [{
        subject: "",
        typeName: null,
        properties: [
          property(name(DC, "title", "dc"), { kind: "array", container: "Alt", items: [text("Titre", "fr"), text("Title", "en"), text("Title", "x-default")], qualifiers: [] }, 0),
          property(name(EXAMPLE, "people", "ex"), resource, 1),
        ],
        sourceStart: 0,
        sourceEnd: 0,
      }],
      properties: [],
      sourceLength: 0,
    };
    const first = serializeStructuredXmp(document);
    const second = serializeStructuredXmp(document);
    expect(first).toBe(second);
    expect(first).toContain("&amp; &lt;Grace&gt;");
    expect(first).not.toContain("<script");
    const parsed = parseStructuredXmp(first);
    expect(parsed?.rdf?.properties).toHaveLength(2);
    expect(parsed?.rdf?.properties[0]?.value).toMatchObject({ kind: "array", container: "Alt", items: [{ language: "fr", lexicalValue: "Titre" }, { language: "en", lexicalValue: "Title" }, { language: "x-default", lexicalValue: "Title" }] });
    expect(parsed?.rdf?.properties[1]?.value).toMatchObject({ kind: "typed-resource", resourceUri: "https://example.invalid/person/1" });
    expect(parsed?.rdf?.properties[1]?.value.qualifiers[0]?.value).toMatchObject({ kind: "array", container: "Seq" });
  });

  it("serializes the legacy packet adapter without losing namespace identity", () => {
    const packet = serializeStructuredXmp({
      namespaces: { dc: DC, ex: EXAMPLE },
      properties: { "dc:title": { "x-default": "A & B", en: "A and B" }, "ex:opaque": ["one", "two"] },
    });
    const parsed = parseStructuredXmp(packet);
    expect(parsed?.rdf?.properties.map((item) => [item.name.namespaceUri, item.name.localName])).toEqual([[DC, "title"], [EXAMPLE, "opaque"]]);
    expect(parsed?.rdf?.properties[0]?.value).toMatchObject({ kind: "array", container: "Alt" });
    expect(parsed?.rdf?.properties[1]?.value).toMatchObject({ kind: "array", container: "Bag", items: [{ lexicalValue: "one" }, { lexicalValue: "two" }] });
  });

  it("covers every generated Photo Metadata XMP mapping by namespace URI and local name", () => {
    const mappings = IPTC_TECHREFERENCE_PROPERTIES.map((item) => item.mappings.xmp);
    const namespaces = [...new Map(mappings.map((item) => [item.prefix, item.namespaceUri])).entries()].map(([prefix, namespaceUri], order) => ({ prefix, namespaceUri, order }));
    const properties = mappings.map((item, order) => property(name(item.namespaceUri, item.localName, item.prefix), text(item.localName), order));
    const document: XmpRdfDocument = { namespaces, descriptions: [{ subject: "", typeName: null, properties, sourceStart: 0, sourceEnd: 0 }], properties, sourceLength: 0 };
    const parsed = parseStructuredXmp(serializeStructuredXmp(document));
    expect(parsed?.rdf?.properties).toHaveLength(mappings.length);
    expect(new Set(parsed?.rdf?.properties.map((item) => `${item.name.namespaceUri}\u0000${item.name.localName}`)).size).toBe(mappings.length);
  });

  it("writes ordinary and extended IIM lengths and preserves raw invalid bytes when requested", () => {
    const ordinary = serializeIptcIim([{ record: 2, dataset: 25, value: "keyword" }]);
    expect(parseIptcMetadata(ordinary, DEFAULT_LIMITS).fields[0]?.value).toBe("keyword");
    const large = new Uint8Array(32768).fill(0x61);
    const extended = serializeIptcIim([{ record: 9, dataset: 9, value: large }], { invalidValuePolicy: "preserve-raw" });
    expect(extended.slice(0, 7)).toEqual(Uint8Array.from([0x1c, 9, 9, 0x80, 0x02, 0x80, 0x00]));
    expect(parseIptcMetadata(extended, { ...DEFAULT_LIMITS, maxStringBytes: 65536 }).fields[0]?.raw).toHaveLength(32768);
    expect(() => serializeIptcIim([{ record: 2, dataset: 25, value: "k".repeat(65) }])).toThrow(IptcSerializationError);
    const invalid = Uint8Array.of(0xc3, 0x28);
    expect(serializeIptcIim([{ record: 2, dataset: 120, value: invalid }], { invalidValuePolicy: "preserve-raw" })).toContain(0xc3);
  });

  it("retains unknown reserved IIM coordinates only as explicitly preserved raw bytes", () => {
    const reserved = serializeIptcIim([{ record: 2, dataset: 0, value: Uint8Array.of(0, 4) }], { invalidValuePolicy: "preserve-raw", characterSet: "none" });
    const parsed = parseIptcMetadata(reserved, DEFAULT_LIMITS);
    expect(parsed.fields).toHaveLength(1);
    expect(parsed.fields[0]).toMatchObject({ tag: 0x0200, known: false, raw: Uint8Array.of(0, 4) });
    expect(parsed.fields[0]?.source).toMatchObject({ entryOffset: 0, entryLength: 7, valueOffset: 5, valueLength: 2 });
    expect(() => serializeIptcIim([{ record: 2, dataset: 0, value: Uint8Array.of(0, 4) }])).toThrow(/reserved|raw/iu);
    expect(() => serializeIptcIim([{ record: 2, dataset: 0, value: "opaque" }], { invalidValuePolicy: "preserve-raw" })).toThrow(/reserved|raw/iu);
  });

  it("adds UTF-8 charset declaration and wraps multiple IPTC resources with required padding", () => {
    const iimBytes = serializeIptcIim([{ record: 2, dataset: 120, value: "café", encoding: "utf-8" }], { characterSet: "utf-8" });
    const wrapped = serializePhotoshopIptcResources([iimBytes, iim(9, 9, Uint8Array.of(1, 2, 3))]);
    const parsed = parseIptcMetadata(wrapped, DEFAULT_LIMITS);
    expect(parsed.fields.find((field) => field.tag === 0x0278)?.value).toBe("café");
    expect(parsed.fields.find((field) => field.tag === 0x015a)?.value).toBe("UTF-8");
    expect(parsed.fields.find((field) => field.tag === 0x0909)?.raw).toEqual(Uint8Array.of(1, 2, 3));
  });

  it("detects and explicitly resolves IIM/XMP conflicts without silent overwrite", () => {
    const xmp = parseStructuredXmp(`<x:xmpmeta xmlns:x="adobe:ns:meta/" xmlns:rdf="${RDF}" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"><rdf:RDF><rdf:Description rdf:about=""><photoshop:City>London</photoshop:City></rdf:Description></rdf:RDF></x:xmpmeta>`);
    if (xmp === null) throw new Error("expected XMP test model");
    const input = { iim: [{ record: 2, dataset: 90, value: "Paris" }], xmp };
    const preserved = synchronizeIptcXmp(input);
    expect(preserved.policy).toBe("preserve-all");
    expect(preserved.conflicts).toMatchObject([{ propertyId: "cityName", iimValues: ["Paris"], xmpValues: ["London"] }]);
    expect(() => synchronizeIptcXmp(input, { policy: "reject-conflict" })).toThrow(IptcSynchronizationError);
    const chosen = synchronizeIptcXmp(input, { policy: "prefer-iim" });
    expect(parseStructuredXmp(chosen.xmp ?? "")?.rdf?.properties[0]?.value).toMatchObject({ lexicalValue: "Paris" });
  });

  it("creates deterministic, reassemblable Extended XMP payloads", async () => {
    const result = await chunkExtendedXmp("x".repeat(100), { maxChunkBytes: 17 });
    expect(result.chunks.length).toBe(6);
    expect(result.chunks.every((chunk) => parseExtendedXmpChunk(chunk)?.guid === result.guid)).toBe(true);
    const parsed = result.chunks.map((chunk) => parseExtendedXmpChunk(chunk)).filter((chunk): chunk is NonNullable<typeof chunk> => chunk !== null);
    expect(reassembleExtendedXmp(parsed.reverse(), 200)).toBe("x".repeat(100));
    const again = await chunkExtendedXmp("x".repeat(100), { maxChunkBytes: 17 });
    expect([...again.data]).toEqual([...result.data]);
  });

  it("rejects unsafe XML code points and bounded outputs", () => {
    const unsafe: XmpRdfDocument = { namespaces: [{ prefix: "ex", namespaceUri: EXAMPLE, order: 0 }], descriptions: [{ subject: "", typeName: null, properties: [property(name(EXAMPLE, "p", "ex"), text("bad\u0001"), 0)], sourceStart: 0, sourceEnd: 0 }], properties: [], sourceLength: 0 };
    expect(() => serializeStructuredXmp(unsafe)).toThrow(/XML/iu);
    const bounded: XmpRdfDocument = { ...unsafe, descriptions: [{ ...unsafe.descriptions[0] as XmpRdfDocument["descriptions"][number], properties: [property(name(EXAMPLE, "p", "ex"), text("safe"), 0)] }] };
    expect(() => serializeStructuredXmp(bounded, { maxOutputBytes: 1 })).toThrow(/maxOutputBytes|exceeds/iu);
  });
});
