import { describe, expect, it } from "vitest";
import {
  mergeStructuredXmp,
  parseStructuredXmp,
  parseStructuredXmpBytesDetailed,
  parseStructuredXmpDetailed,
  parseStructuredXmpWithDecoder,
  parseStructuredXmpWithDecoderDetailed,
} from "../src/xmp.js";
import { deriveXmpPacketProvenance } from "../src/xmp.js";
import { getStructuredXmp } from "../src/index.js";
import type { MetadataResult } from "../src/types.js";

const packet = [
  '<x:xmpmeta xmlns:x="adobe:ns:meta/">',
  '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:ex="urn:example:" xmlns:xmp="http://ns.adobe.com/xap/1.0/">',
  '<rdf:Description rdf:about="urn:image:1" xmp:Rating="5" ex:duplicate="first">',
  '<dc:title><rdf:Alt><rdf:li xml:lang="x-default">Title</rdf:li><rdf:li xml:lang="fr">Titre</rdf:li></rdf:Alt></dc:title>',
  '<dc:subject><rdf:Bag><rdf:li>one</rdf:li><rdf:li>two</rdf:li></rdf:Bag></dc:subject>',
  '<ex:ordered><rdf:Seq><rdf:li>one</rdf:li><rdf:li>two</rdf:li></rdf:Seq></ex:ordered>',
  '<ex:typed rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">42</ex:typed>',
  '<ex:resource rdf:resource="https://example.test/resource" ex:role="primary"/>',
  '<ex:nested rdf:parseType="Resource" ex:kind="camera"><ex:name xml:lang="en">Camera</ex:name></ex:nested>',
  '</rdf:Description>',
  '</rdf:RDF></x:xmpmeta>',
].join("");

describe("S05 bounded RDF/XMP model", () => {
  it("retains namespaces, arrays, language alternatives, typed values, resources, qualifiers, and nested properties", () => {
    const result = parseStructuredXmp(packet);
    expect(result).not.toBeNull();
    if (result === null || result.rdf === undefined) throw new Error("expected RDF model");
    expect(result.rdf.descriptions).toHaveLength(1);
    expect(result.rdf.properties.map((property) => property.name.localName)).toEqual(["Rating", "duplicate", "title", "subject", "ordered", "typed", "resource", "nested"]);
    const title = result.rdf.properties.find((property) => property.name.localName === "title");
    expect(title?.value).toMatchObject({ kind: "array", container: "Alt" });
    expect((title?.value.kind === "array" ? title.value.items[1] : null)).toMatchObject({ kind: "literal", language: "fr", lexicalValue: "Titre" });
    const typed = result.rdf.properties.find((property) => property.name.localName === "typed");
    expect(typed?.value).toMatchObject({ kind: "literal", lexicalValue: "42", value: 42, datatypeUri: "http://www.w3.org/2001/XMLSchema#integer" });
    const resource = result.rdf.properties.find((property) => property.name.localName === "resource");
    expect(resource?.value).toMatchObject({ kind: "resource", resourceUri: "https://example.test/resource" });
    expect(resource?.qualifiers[0]?.name.localName).toBe("role");
    const nested = result.rdf.properties.find((property) => property.name.localName === "nested");
    expect(nested?.value).toMatchObject({ kind: "typed-resource" });
    expect(nested?.value.kind === "typed-resource" ? nested.value.properties[0]?.name.localName : null).toBe("name");
    expect(result.properties["dc:title"]).toEqual({ "x-default": "Title", fr: "Titre" });
  });

  it("keeps duplicate occurrences and reports deterministic cross-packet conflicts", () => {
    const second = packet.replace("ex:duplicate=\"first\"", "ex:duplicate=\"second\"");
    const firstValue = parseStructuredXmp(packet);
    const secondValue = parseStructuredXmp(second);
    if (firstValue === null || secondValue === null) throw new Error("expected packets");
    const merged = mergeStructuredXmp([{ value: firstValue, packetIndex: 0, sourceId: "embedded:0" }, { value: secondValue, packetIndex: 1, sourceId: "embedded:1" }]);
    expect(merged.properties.length).toBeGreaterThan(merged.candidates["urn:example:\u0000duplicate"]?.length ?? 0);
    expect(merged.candidates["urn:example:\u0000duplicate"]).toHaveLength(2);
    expect(merged.conflicts).toHaveLength(1);
    expect(mergeStructuredXmp([{ value: firstValue }, { value: secondValue }], "first").properties).toHaveLength(8);
  });

  it("retains namespace rebinding and standard alias metadata without flattening the RDF graph", () => {
    const rebinding = '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:a="urn:a:" xmlns:b="urn:b:"><rdf:Description><a:value>one</a:value><rdf:Description xmlns:a="urn:b:"><a:value>two</a:value></rdf:Description></rdf:Description></rdf:RDF></x:xmpmeta>';
    const result = parseStructuredXmp(rebinding);
    expect(result?.rdf?.namespaces.map(({ prefix, namespaceUri }) => `${prefix}=${namespaceUri}`)).toContain("a=urn:b:");
    expect(result?.rdf?.properties.filter((property) => property.name.localName === "value").map((property) => property.name.namespaceUri)).toContain("urn:a:");
    const reboundRdf = parseStructuredXmp('<rdf:RDF xmlns:rdf="urn:not-rdf" xmlns:ex="urn:example:"><rdf:Description><ex:value>not RDF</ex:value></rdf:Description></rdf:RDF>');
    expect(reboundRdf?.rdf?.descriptions).toEqual([]);
    const aliasPacket = '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:ps="http://ns.adobe.com/photoshop/1.0/"><rdf:Description><ps:Caption>Caption</ps:Caption></rdf:Description></rdf:RDF></x:xmpmeta>';
    expect(parseStructuredXmp(aliasPacket)?.rdf?.properties[0]?.aliasOf).toMatchObject({ localName: "description" });
  });

  it("rejects unsafe XML and reports stable diagnostics for malformed or bounded input", () => {
    expect(parseStructuredXmp('<x:xmpmeta xmlns:x="adobe:ns:meta/"><value>A &amp; B</value></x:xmpmeta>')?.rdf?.properties).toEqual([]);
    expect(parseStructuredXmpDetailed("<!DOCTYPE x [<!ENTITY boom 'x'>]><x/>").diagnostics[0]).toMatchObject({ code: "UNSAFE_ENTITY", severity: "error" });
    expect(parseStructuredXmpDetailed("<x><y></x>").diagnostics[0]).toMatchObject({ code: "MALFORMED_XML" });
    expect(parseStructuredXmpDetailed(packet, { maxDepth: 1 }).diagnostics[0]).toMatchObject({ code: "LIMIT_EXCEEDED" });
    expect(parseStructuredXmpDetailed(packet, { maxArrayItems: 1 }).diagnostics[0]).toMatchObject({ code: "LIMIT_EXCEEDED" });
    expect(parseStructuredXmpBytesDetailed(Uint8Array.of(0xff, 0xfe)).diagnostics[0]).toMatchObject({ code: "MALFORMED_XML" });
    expect(parseStructuredXmpDetailed(packet, { maxOutputBytes: 4 }).value).toBeNull();
    expect(parseStructuredXmpDetailed("<x/>trailing").diagnostics[0]).toMatchObject({ code: "MALFORMED_XML" });
    expect(parseStructuredXmpDetailed("leading<x/>").diagnostics[0]).toMatchObject({ code: "MALFORMED_XML" });
  });

  it("inherits XML language, retains blank resources and parseType literal values", () => {
    const value = parseStructuredXmp('<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:ex="urn:example:"><rdf:Description xml:lang="en"><ex:literal rdf:parseType="Literal"><ex:b>markup</ex:b></ex:literal><ex:blank><rdf:Description rdf:nodeID="shared"><ex:value>one</ex:value></rdf:Description></ex:blank></rdf:Description></rdf:RDF>');
    expect(value?.rdf?.properties.find((property) => property.name.localName === "literal")?.value).toMatchObject({ kind: "literal", parseType: "Literal", lexicalValue: "markup", language: "en" });
    const blank = value?.rdf?.properties.find((property) => property.name.localName === "blank")?.value;
    expect(blank).toMatchObject({ kind: "blank-node", nodeId: "shared" });
    expect(blank?.kind === "blank-node" ? blank.properties[0]?.value : null).toMatchObject({ kind: "literal", language: "en" });
  });

  it("validates injected parser output against the same canonical model and bounds", () => {
    const decoder = { parse: () => ({ namespaces: { app: "urn:app" }, properties: { "app:value": "yes" } }) };
    const result = parseStructuredXmpWithDecoder(packet, decoder);
    expect(result?.properties["app:value"]).toBe("yes");
    expect(result?.rdf?.properties.length).toBeGreaterThan(0);
    expect(parseStructuredXmpWithDecoder(packet, { parse: () => ({ namespaces: {}, properties: { bad: 1 } } as never) })).toBeNull();
    expect(parseStructuredXmpWithDecoderDetailed(packet, { parse: () => ({ namespaces: {}, properties: { bad: 1 } } as never) }).diagnostics[0]).toMatchObject({ code: "INVALID_ADAPTER_OUTPUT" });
    expect(parseStructuredXmpWithDecoder("<!DOCTYPE x><x/>", decoder)).toBeNull();
    expect(parseStructuredXmpWithDecoder(packet, { parse: () => ({ namespaces: {}, properties: { huge: "123456789" } }) }, { maxOutputBytes: 4 })).toBeNull();
  });

  it("retains caller-supplied sidecar provenance without performing sidecar I/O", () => {
    const value = parseStructuredXmp(packet);
    if (value === null) throw new Error("expected packet");
    const source = { id: "sidecar:photo.xmp", source: "sidecar" as const, blockIds: [], packetIndex: 0, offset: null, length: null, sidecarId: "photo.xmp" };
    const merged = mergeStructuredXmp([{ value, source }]);
    expect(merged.properties[0]?.source).toEqual(source);
    expect(merged.properties.every((candidate) => candidate.source?.source === "sidecar")).toBe(true);
  });

  it("exposes packet provenance through the root structured-XMP helper", () => {
    const provenance = { id: "embedded:app1:10", source: "embedded" as const, blockIds: ["embedded:app1:10"], packetIndex: 0, offset: 10, length: packet.length };
    const result = { xmp: { packets: [packet], packetProvenance: [provenance] } } as unknown as MetadataResult;
    const structured = getStructuredXmp(result);
    expect(structured.documents[0]?.provenance).toEqual(provenance);
    expect(structured.documents[0]?.diagnostics).toEqual([]);
    expect(structured.merged?.properties[0]?.source).toEqual(provenance);
  });

  it("aligns PNG text-backed XMP and assembled packets with their source blocks", () => {
    const png = deriveXmpPacketProvenance([packet], [{ id: "png:iTXt:42", family: "XMP", container: "iTXt XMP chunk", status: "decoded", offset: 42, length: packet.length, associatedImage: null, sensitivity: "moderate", warningCodes: [] }]);
    expect(png[0]).toMatchObject({ id: "png:iTXt:42", source: "embedded", blockIds: ["png:iTXt:42"], offset: 42 });
  });
});
