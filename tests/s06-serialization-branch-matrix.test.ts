import { describe, expect, it } from "vitest";

import { DEFAULT_LIMITS, resolveLimits } from "../src/security/limits.js";
import { parseStructuredXmp, type XmpLiteralValue, type XmpProperty, type XmpQualifiedName, type XmpRdfDocument, type XmpValue } from "../src/metadata/xmp.js";
import {
  IptcSerializationError,
  IptcSynchronizationError,
  XmpSerializationError,
  chunkExtendedXmp,
  serializeIptcIim,
  serializePhotoshopIptcResources,
  serializeStructuredXmp,
  synchronizeIptcXmp,
} from "../src/metadata/serialization.js";
import { parseIptcMetadata } from "../src/metadata/iptc.js";

const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const XML = "http://www.w3.org/XML/1998/namespace";
const EXAMPLE = "https://example.invalid/serialization/";
const PHOTOSHOP = "http://ns.adobe.com/photoshop/1.0/";

function name(namespaceUri: string, localName: string, prefix: string): XmpQualifiedName {
  return { namespaceUri, localName, prefix, qualifiedName: `${prefix}:${localName}` };
}

function literal(lexicalValue: string, language: string | null = null, qualifiers: XmpValue["qualifiers"] = []): XmpLiteralValue {
  return { kind: "literal", lexicalValue, value: lexicalValue, datatypeUri: null, language, qualifiers };
}

function property(propertyName: XmpQualifiedName, value: XmpValue, order: number): XmpProperty {
  return { name: propertyName, value, qualifiers: value.qualifiers, order, sourceStart: 0, sourceEnd: 0, aliasOf: null };
}

function dataset(record: number, datasetNumber: number, value: Uint8Array): Uint8Array {
  return Uint8Array.from([0x1c, record, datasetNumber, (value.length >>> 8) & 0xff, value.length & 0xff, ...value]);
}

describe("S06 serializer and boundary branch matrix", () => {
  it("serializes empty-description documents, generated namespace bindings, and every structured value path", () => {
    const qualifierName = name(EXAMPLE, "confidence", "occupied");
    const qualifiedResource: XmpValue = {
      kind: "typed-resource",
      resourceUri: "https://example.invalid/resource/1",
      nodeId: null,
      typeName: name(EXAMPLE, "Person", "occupied"),
      properties: [property(name(EXAMPLE, "name", "occupied"), literal("Ada & Grace"), 0)],
      qualifiers: [{ name: qualifierName, value: { kind: "array", container: "Seq", items: [literal("high")], qualifiers: [] }, order: 0 }],
    };
    const array: XmpValue = { kind: "array", container: "Seq", items: [literal("first"), literal("second")], qualifiers: [] };
    const qualifiedPlainResource: XmpValue = {
      kind: "resource",
      resourceUri: null,
      nodeId: null,
      typeName: null,
      properties: [],
      qualifiers: [{ name: qualifierName, value: { kind: "array", container: "Bag", items: [literal("reviewed")], qualifiers: [] }, order: 0 }],
    };
    const datatypeLiteral: XmpValue = {
      ...literal("2026-09-16", "en", [{ name: name(EXAMPLE, "source", "occupied"), value: literal("test"), order: 0 }]),
      datatypeUri: "http://www.w3.org/2001/XMLSchema#date",
      parseType: "Literal",
    };
    const properties = [
      property(name(EXAMPLE, "resource", "occupied"), qualifiedResource, 2),
      property(name(EXAMPLE, "array", "occupied"), array, 1),
      property(name(EXAMPLE, "literal", "occupied"), datatypeLiteral, 0),
      property(name(EXAMPLE, "node", "occupied"), { kind: "blank-node", resourceUri: null, nodeId: "blank-1", typeName: null, properties: [], qualifiers: [] }, 3),
      property(name(EXAMPLE, "qualifiedPlain", "occupied"), qualifiedPlainResource, 4),
      property(name(EXAMPLE, "qualifiedNode", "occupied"), { kind: "blank-node", resourceUri: null, nodeId: "blank-2", typeName: null, properties: [], qualifiers: [{ name: qualifierName, value: literal("yes"), order: 0 }] }, 5),
    ];
    const document: XmpRdfDocument = {
      namespaces: [
        { prefix: "occupied", namespaceUri: "https://example.invalid/other/", order: 0 },
        { prefix: "occupied", namespaceUri: EXAMPLE, order: 1 },
        { prefix: "rdf", namespaceUri: EXAMPLE, order: 2 },
        { prefix: "bad prefix", namespaceUri: EXAMPLE, order: 3 },
        { prefix: "xml", namespaceUri: XML, order: 4 },
      ],
      descriptions: [],
      properties,
      sourceLength: 0,
    };
    const output = serializeStructuredXmp(document);
    expect(output).toContain("rdf:RDF");
    expect(output).toContain("ns0:");
    expect(output).toContain("rdf:datatype=\"http://www.w3.org/2001/XMLSchema#date\"");
    expect(output).toContain("xml:lang=\"en\"");
    expect(output).toContain("rdf:parseType=\"Resource\"");
    expect(output).toContain("rdf:nodeID=\"blank-1\"");
    expect(output).toContain("&amp;");
    const parsed = parseStructuredXmp(output);
    expect(parsed?.rdf?.properties).toHaveLength(6);
    expect(parsed?.rdf?.properties.map(({ name: propertyName }) => propertyName.localName)).toEqual(["literal", "array", "resource", "node", "qualifiedPlain", "qualifiedNode"]);

    const normalSubject = serializeStructuredXmp({
      namespaces: [{ prefix: "ex", namespaceUri: EXAMPLE, order: 0 }],
      descriptions: [{ subject: "https://example.invalid/item", typeName: name(EXAMPLE, "Item", "ex"), properties: [], sourceStart: 0, sourceEnd: 0 }],
      properties: [],
      sourceLength: 0,
    });
    expect(normalSubject).toContain("rdf:about=\"https://example.invalid/item\"");
    const blankSubject = serializeStructuredXmp({
      namespaces: [{ prefix: "ex", namespaceUri: EXAMPLE, order: 0 }],
      descriptions: [{ subject: "_:subject", typeName: null, properties: [], sourceStart: 0, sourceEnd: 0 }],
      properties: [],
      sourceLength: 0,
    });
    expect(blankSubject).toContain("rdf:nodeID=\"subject\"");
  });

  it("enforces serializer limits, XML names, XML code points, extended XMP GUIDs, and resource padding", async () => {
    const document: XmpRdfDocument = { namespaces: [{ prefix: "ex", namespaceUri: EXAMPLE, order: 0 }], descriptions: [], properties: [], sourceLength: 0 };
    expect(() => serializeStructuredXmp(document, { maxOutputBytes: 1 })).toThrow(XmpSerializationError);
    expect(() => serializeStructuredXmp({ ...document, properties: [property(name(EXAMPLE, "bad name", "ex"), literal("x"), 0)] })).toThrow(/local name/iu);
    expect(() => serializeStructuredXmp({ ...document, properties: [property(name(EXAMPLE, "bad", "ex"), literal("bad\u0001"), 0)] })).toThrow(/XML/iu);
    const generatedBinding = serializeStructuredXmp({ namespaces: [], descriptions: [], properties: [property(name(EXAMPLE, "unbound", "ex"), literal("x"), 0)], sourceLength: 0 });
    expect(generatedBinding).toContain("ns0:unbound");

    await expect(chunkExtendedXmp("", { guid: "0123456789ABCDEF0123456789ABCDEF" })).rejects.toThrow(XmpSerializationError);
    await expect(chunkExtendedXmp("payload", { guid: "not-a-guid" })).rejects.toThrow(XmpSerializationError);
    await expect(chunkExtendedXmp("payload", { maxChunkBytes: 0 })).rejects.toThrow(XmpSerializationError);
    const explicit = await chunkExtendedXmp("payload", { guid: "abcdefabcdefabcdefabcdefabcdefab", maxChunkBytes: 3 });
    expect(explicit.guid).toBe("ABCDEFABCDEFABCDEFABCDEFABCDEFAB");
    expect(explicit.chunks).toHaveLength(3);

    const resourceName = new Uint8Array(255).fill(0x6e);
    const wrapped = serializePhotoshopIptcResources([new Uint8Array([1]), new Uint8Array([1, 2])], { resourceName });
    expect(wrapped.length % 2).toBe(0);
    expect(() => serializePhotoshopIptcResources(new Uint8Array(), { resourceName: new Uint8Array(256) })).toThrow(IptcSerializationError);
    expect(() => serializePhotoshopIptcResources(new Uint8Array(1), { maxOutputBytes: 1 })).toThrow(IptcSerializationError);
  });

  it("enforces every IIM serializer policy branch while retaining declared raw values", () => {
    const charset = serializeIptcIim([{ record: 1, dataset: 90, value: Uint8Array.of(0x1b, 0x25, 0x47), encoding: "binary" }], { characterSet: "utf-8" });
    expect(parseIptcMetadata(charset, DEFAULT_LIMITS).fields).toHaveLength(1);
    expect(serializeIptcIim([{ record: 9, dataset: 9, value: Uint8Array.of(0xff), encoding: "binary" }], { characterSet: "none", invalidValuePolicy: "preserve-raw" })).toEqual(dataset(9, 9, Uint8Array.of(0xff)));
    expect(parseIptcMetadata(serializeIptcIim([{ record: 2, dataset: 5, value: "" }]), DEFAULT_LIMITS).fields[0]?.value).toBe("");
    expect(() => serializeIptcIim([{ record: 2, dataset: 5, value: "k".repeat(65) }])).toThrow(IptcSerializationError);
    expect(() => serializeIptcIim([{ record: 9, dataset: 9, value: "large".repeat(7000) }], { allowExtendedLengths: false })).toThrow(IptcSerializationError);
    expect(() => serializeIptcIim([{ record: -1, dataset: 1, value: "x" }])).toThrow(IptcSerializationError);
    expect(() => serializeIptcIim([{ record: 2, dataset: 5, value: "x" }], { maxDatasets: 0 })).toThrow(IptcSerializationError);
    expect(() => serializeIptcIim([{ record: 2, dataset: 5, value: "x" }, { record: 2, dataset: 5, value: "y" }])).toThrow(IptcSerializationError);
    expect(serializeIptcIim([{ record: 2, dataset: 5, value: "é", encoding: "latin1" }])).toContain(0xe9);
    expect(() => serializeIptcIim([{ record: 2, dataset: 5, value: "😀", encoding: "latin1" }])).toThrow(IptcSerializationError);
    expect(() => serializeIptcIim([{ record: 2, dataset: 5, value: "x" }], { maxOutputBytes: 1 })).toThrow(IptcSerializationError);
    expect(serializeIptcIim([{ record: 2, dataset: 0, value: Uint8Array.of(0xff) }], { invalidValuePolicy: "preserve-raw" })).toEqual(dataset(2, 0, Uint8Array.of(0xff)));
  });

  it("executes synchronization replacement, append, equality, and explicit conflict branches", () => {
    const xmp = parseStructuredXmp(`<rdf:RDF xmlns:rdf="${RDF}" xmlns:photoshop="${PHOTOSHOP}" xmlns:dc="http://purl.org/dc/elements/1.1/"><rdf:Description><photoshop:City>London</photoshop:City><photoshop:Country>GBR</photoshop:Country><dc:creator><rdf:Seq><rdf:li>Ada</rdf:li><rdf:li>Grace</rdf:li></rdf:Seq></dc:creator></rdf:Description></rdf:RDF>`);
    if (xmp === null) throw new Error("expected XMP synchronization document");
    const equal = synchronizeIptcXmp({ iim: [{ record: 2, dataset: 90, value: "London" }], xmp }, { policy: "reject-conflict" });
    expect(equal.conflicts).toEqual([]);
    expect(equal.iim).not.toBeNull();

    const appended = synchronizeIptcXmp({ iim: [{ record: 2, dataset: 90, value: "Paris" }], xmp }, { policy: "prefer-iim" });
    expect(appended.conflicts).toHaveLength(1);
    expect(parseStructuredXmp(appended.xmp ?? "")?.rdf?.properties.some(({ name: propertyName }) => propertyName.localName === "City")).toBe(true);

    const preferXmp = synchronizeIptcXmp({ iim: [{ record: 2, dataset: 90, value: "Paris" }, { record: 2, dataset: 80, value: "Old Ada" }, { record: 2, dataset: 80, value: "Old Grace" }, { record: 2, dataset: 0x19, value: "old" }], xmp }, { policy: "prefer-xmp" });
    const fields = preferXmp.iim === null ? [] : parseIptcMetadata(preferXmp.iim, DEFAULT_LIMITS).fields;
    expect(fields.find(({ tag }) => tag === 0x025a)?.value).toBe("London");
    expect(fields.filter(({ tag }) => tag === 0x0250).map(({ value }) => value)).toEqual(["Ada", "Grace"]);
    expect(preferXmp.conflicts).toHaveLength(2);
    expect(() => synchronizeIptcXmp({ iim: [{ record: 2, dataset: 90, value: "Paris" }], xmp }, { policy: "reject-conflict" })).toThrow(IptcSynchronizationError);
    expect(synchronizeIptcXmp({ iim: [{ record: 9, dataset: 9, value: "raw" }], xmp: null }, { policy: "prefer-xmp" }).xmp).toBeNull();
    expect(synchronizeIptcXmp({ xmp: null }, { policy: "prefer-iim" }).iim).toBeNull();
  });

  it("keeps low serializer limits typed and bounded", () => {
    expect(() => serializeIptcIim([], { maxOutputBytes: 0 })).toThrow(IptcSerializationError);
    expect(() => serializePhotoshopIptcResources(new Uint8Array([1]), { maxOutputBytes: 1 })).toThrow(IptcSerializationError);
    expect(resolveLimits({ maxMetadataBytes: 1 }).maxMetadataBytes).toBe(1);
  });

  it("covers namespace, attribute, packet, coordinate, and synchronization edge contracts", async () => {
    const xmlProperty = property(name(XML, "lang", "xml"), literal("en", null, [{ name: name(EXAMPLE, "quote", "ex"), value: literal("'\""), order: 0 }]), 0);
    const namespaced = serializeStructuredXmp({
      namespaces: [
        { prefix: "z", namespaceUri: EXAMPLE, order: 1 },
        { prefix: "a", namespaceUri: EXAMPLE, order: 1 },
        { prefix: "a", namespaceUri: "https://example.invalid/second/", order: 1 },
      ],
      descriptions: [{ subject: "", typeName: null, properties: [xmlProperty], sourceStart: 0, sourceEnd: 0 }],
      properties: [xmlProperty],
      sourceLength: 0,
    });
    expect(namespaced).toContain("xml:lang");
    expect(namespaced).toContain("&apos;&quot;");
    expect(() => serializeStructuredXmp({ namespaces: [], descriptions: [], properties: [], sourceLength: 0 }, { maxOutputBytes: Number.NaN })).toThrow(XmpSerializationError);
    expect(() => serializeStructuredXmp({ namespaces: [], descriptions: [], properties: [], sourceLength: 0 }, { maxOutputBytes: -1 })).toThrow(XmpSerializationError);
    await expect(chunkExtendedXmp("payload", { maxOutputBytes: 1 })).rejects.toThrow(XmpSerializationError);
    await expect(chunkExtendedXmp("payload", { maxChunkBytes: Number.NaN })).rejects.toThrow(XmpSerializationError);

    for (const coordinates of [{ record: 256, dataset: 1 }, { record: 1, dataset: 256 }, { record: Number.NaN, dataset: 1 }]) {
      expect(() => serializeIptcIim([{ ...coordinates, value: "x" }])).toThrow(IptcSerializationError);
    }
    expect(serializeIptcIim([{ record: 2, dataset: 25, value: "keyword" }], { characterSet: "utf-8" }).subarray(0, 8)).toEqual(Uint8Array.of(0x1c, 1, 90, 0, 3, 0x1b, 0x25, 0x47));
    expect(() => serializeIptcIim([], { maxOutputBytes: Number.NaN })).toThrow(IptcSerializationError);
    expect(() => serializePhotoshopIptcResources([], { maxOutputBytes: Number.NaN })).toThrow(IptcSerializationError);

    const cityName = name(PHOTOSHOP, "City", "photoshop");
    const creatorName = name("http://purl.org/dc/elements/1.1/", "creator", "dc");
    const cityResource: XmpValue = { kind: "resource", resourceUri: "https://example.invalid/city", nodeId: null, typeName: null, properties: [], qualifiers: [] };
    const creatorArray: XmpValue = { kind: "array", container: "Seq", items: [cityResource, literal("Old")], qualifiers: [] };
    const replacementDocument: XmpRdfDocument = {
      namespaces: [{ prefix: "photoshop", namespaceUri: PHOTOSHOP, order: 0 }, { prefix: "dc", namespaceUri: "http://purl.org/dc/elements/1.1/", order: 1 }],
      descriptions: [{ subject: "", typeName: null, properties: [property(cityName, cityResource, 0), property(creatorName, creatorArray, 1)], sourceStart: 0, sourceEnd: 0 }],
      properties: [property(cityName, cityResource, 0), property(creatorName, creatorArray, 1)],
      sourceLength: 0,
    };
    const preferIim = synchronizeIptcXmp({ iim: [{ record: 2, dataset: 90, value: "Paris" }, { record: 2, dataset: 80, value: "Ada" }, { record: 2, dataset: 80, value: "Grace" }], xmp: replacementDocument }, { policy: "prefer-iim" });
    const replaced = parseStructuredXmp(preferIim.xmp ?? "");
    expect(replaced?.rdf?.properties.find(({ name: propertyName }) => propertyName.localName === "City")?.value).toMatchObject({ kind: "literal", lexicalValue: "Paris" });
    expect(replaced?.rdf?.properties.find(({ name: propertyName }) => propertyName.localName === "creator")?.value).toMatchObject({ kind: "array", items: [{ lexicalValue: "Ada" }, { lexicalValue: "Grace" }] });

    const emptyDocument: XmpRdfDocument = { namespaces: [], descriptions: [], properties: [], sourceLength: 0 };
    const appended = synchronizeIptcXmp({ iim: [{ record: 2, dataset: 120, value: "Caption" }, { record: 2, dataset: 25, value: "one" }, { record: 2, dataset: 25, value: "two" }], xmp: emptyDocument }, { policy: "prefer-iim" });
    const appendedModel = parseStructuredXmp(appended.xmp ?? "");
    expect(appendedModel?.rdf?.properties.some(({ value }) => value.kind === "array" && value.container === "Alt")).toBe(true);
    expect(appendedModel?.rdf?.properties.some(({ value }) => value.kind === "array" && value.container === "Seq")).toBe(true);

    const fromXmp = parseStructuredXmp(`<rdf:RDF xmlns:rdf="${RDF}" xmlns:photoshop="${PHOTOSHOP}" xmlns:dc="http://purl.org/dc/elements/1.1/"><rdf:Description><photoshop:City>London</photoshop:City><dc:creator><rdf:Seq><rdf:li>Ada</rdf:li><rdf:li>Grace</rdf:li></rdf:Seq></dc:creator></rdf:Description></rdf:RDF>`);
    if (fromXmp === null) throw new Error("expected mapped synchronization model");
    const generatedIim = synchronizeIptcXmp({ iim: [{ record: 9, dataset: 9, value: "unmapped" }], xmp: fromXmp }, { policy: "prefer-xmp", invalidValuePolicy: "preserve-raw" });
    expect(generatedIim.iim).not.toBeNull();
    expect(() => synchronizeIptcXmp({ iim: [{ record: 2, dataset: 90, value: "Paris" }, { record: 2, dataset: 80, value: "Old" }], xmp: fromXmp }, { policy: "reject-conflict" })).toThrow(/2 conflicting mapped values/u);
  });
});
