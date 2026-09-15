import { describe, expect, it } from "vitest";
import { mergeMetadataWithXmpSidecar, mergeXmpSources, parseXmpSidecar, serializeXmpSidecar } from "../src/sidecar.js";
import { parseStructuredXmp } from "../src/xmp.js";
import { toJsonSafe } from "../src/adapters.js";
import type { MetadataResult } from "../src/types.js";

const packet = [
  '<x:xmpmeta xmlns:x="adobe:ns:meta/">',
  '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:ex="urn:example:sidecar:" xmlns:xml="http://www.w3.org/XML/1998/namespace">',
  '<rdf:Description rdf:about="urn:image:1" ex:unknown="opaque">',
  '<dc:title><rdf:Alt><rdf:li xml:lang="x-default">Default</rdf:li><rdf:li xml:lang="fr">Titre</rdf:li></rdf:Alt></dc:title>',
  '<dc:subject><rdf:Seq><rdf:li>one</rdf:li><rdf:li>two</rdf:li></rdf:Seq></dc:subject>',
  '<ex:qualified rdf:resource="urn:qualified" ex:role="editor"/>',
  '<ex:nested rdf:parseType="Resource"><ex:name>Nested</ex:name></ex:nested>',
  '</rdf:Description></rdf:RDF></x:xmpmeta>',
].join("");

const secondPacket = packet.replace("opaque", "changed").replace("Default", "Changed");

function embeddedResult(value: string): MetadataResult & { readonly data: Uint8Array } {
  return {
    format: "jpeg", mimeType: "image/jpeg", container: "jpeg", fileKind: "jpeg", raw: null, dimensions: null, fields: [], exif: null,
    xmp: { packets: [value], packetProvenance: [{ id: "jpeg:app1:0", source: "embedded", blockIds: ["jpeg:app1:0"], packetIndex: 0, offset: 20, length: value.length }] },
    iptc: null, icc: null, jfif: null, pngText: [], blocks: [], data: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
    completeness: { complete: true, scope: "full", warnings: [], coverage: "complete" },
  } as unknown as MetadataResult & { readonly data: Uint8Array };
}

describe("B10 explicit XMP sidecars", () => {
  it("parses bytes with stable identity, bounded block provenance, URI/local names, arrays, qualifiers, nested resources, and unknown properties", async () => {
    const result = await parseXmpSidecar(new TextEncoder().encode(packet), { id: "photo.xmp" });
    expect(result.source).toMatchObject({ kind: "sidecar", id: "photo.xmp", byteLength: new TextEncoder().encode(packet).byteLength });
    expect(result.source.sha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(result.block).toMatchObject({ family: "XMP", container: "XMP sidecar", offset: 0, length: result.source.byteLength, status: "decoded" });
    expect(result.coverage).toMatchObject({ complete: true, packetCount: 1, propertyCount: 5, unknownPropertyCount: 3 });
    expect(result.packets[0]?.provenance).toMatchObject({ source: "sidecar", sidecarId: "photo.xmp", offset: 0, length: result.source.byteLength });
    expect(result.value?.rdf?.properties.map((property) => `${property.name.namespaceUri}\u0000${property.name.localName}`)).toEqual([
      "urn:example:sidecar:\u0000unknown", "http://purl.org/dc/elements/1.1/\u0000title", "http://purl.org/dc/elements/1.1/\u0000subject", "urn:example:sidecar:\u0000qualified", "urn:example:sidecar:\u0000nested",
    ]);
    expect(result.value?.rdf?.properties.find((property) => property.name.localName === "title")?.value).toMatchObject({ kind: "array", container: "Alt" });
    expect(result.value?.rdf?.properties.find((property) => property.name.localName === "subject")?.value).toMatchObject({ kind: "array", container: "Seq", items: [{ lexicalValue: "one" }, { lexicalValue: "two" }] });
    expect(result.value?.rdf?.properties.find((property) => property.name.localName === "nested")?.value).toMatchObject({ kind: "typed-resource" });
    expect(result.value?.rdf?.properties.find((property) => property.name.localName === "qualified")?.qualifiers[0]).toMatchObject({ name: { namespaceUri: "urn:example:sidecar:", localName: "role" } });
  });

  it("fails closed for invalid UTF-8, DTDs, malformed XML, and configured input limits", async () => {
    const invalid = await parseXmpSidecar(Uint8Array.of(0xff, 0xfe));
    expect(invalid.coverage.complete).toBe(false);
    expect(invalid.coverage.diagnostics[0]).toMatchObject({ code: "MALFORMED_XML", severity: "error" });
    const unsafe = await parseXmpSidecar(new TextEncoder().encode("<!DOCTYPE x [<!ENTITY e 'x'>]><x/>"));
    expect(unsafe.coverage.diagnostics[0]).toMatchObject({ code: "UNSAFE_ENTITY" });
    const malformed = await parseXmpSidecar(new TextEncoder().encode("<rdf:RDF><broken></rdf:RDF>"));
    expect(malformed.value).toBeNull();
    const limited = await parseXmpSidecar(new TextEncoder().encode(packet), { limits: { maxMetadataBytes: 8 } });
    expect(limited.block.status).toBe("skipped");
    expect(limited.coverage.diagnostics[0]).toMatchObject({ code: "LIMIT_EXCEEDED" });
    const controller = new AbortController();
    controller.abort();
    await expect(parseXmpSidecar(new TextEncoder().encode(packet), { signal: controller.signal })).rejects.toMatchObject({ code: "ABORTED" });
  });

  it("retains all candidates and exact source provenance by default, with explicit precedence and conflict refusal", async () => {
    const sidecar = await parseXmpSidecar(new TextEncoder().encode(secondPacket), { id: "sidecar:2" });
    const first = await parseXmpSidecar(new TextEncoder().encode(packet), { id: "sidecar:1" });
    const firstPacket = first.packets[0];
    const sidecarPacket = sidecar.packets[0];
    if (firstPacket === undefined || sidecarPacket === undefined) throw new Error("expected sidecar packets");
    const all = mergeXmpSources([{ kind: "embedded", sourceId: "embedded:1", packets: [{ value: first.value, provenance: { ...firstPacket.provenance, source: "embedded" } }] }, { kind: "sidecar", sourceId: sidecar.source.id, packets: [{ value: sidecar.value, provenance: sidecarPacket.provenance }] }]);
    expect(all.accepted).toBe(true);
    expect(all.policy).toBe("preserve-all");
    expect(all.conflicts.length).toBeGreaterThan(0);
    expect(all.merged.candidates["urn:example:sidecar:\u0000unknown"]).toHaveLength(2);
    expect(all.merged.candidates["urn:example:sidecar:\u0000unknown"]?.map((candidate) => candidate.source?.source)).toEqual(["embedded", "sidecar"]);
    expect(mergeXmpSources([{ kind: "embedded", sourceId: "e", packets: [{ value: first.value }] }, { kind: "sidecar", sourceId: "s", packets: [{ value: sidecar.value }] }], { policy: "embedded-first" }).merged.properties.find((property) => property.identity === "urn:example:sidecar:\u0000unknown")?.property.value).toMatchObject({ kind: "literal", lexicalValue: "opaque" });
    expect(mergeXmpSources([{ kind: "embedded", sourceId: "e", packets: [{ value: first.value }] }, { kind: "sidecar", sourceId: "s", packets: [{ value: sidecar.value }] }], { policy: "sidecar-first" }).merged.properties.find((property) => property.identity === "urn:example:sidecar:\u0000unknown")?.property.value).toMatchObject({ kind: "literal", lexicalValue: "changed" });
    const rejected = mergeXmpSources([{ kind: "embedded", sourceId: "e", packets: [{ value: first.value }] }, { kind: "sidecar", sourceId: "s", packets: [{ value: sidecar.value }] }], { policy: "reject-conflicts" });
    expect(rejected.accepted).toBe(false);
    expect(rejected.diagnostics.at(-1)).toMatchObject({ code: "CONFLICT" });
  });

  it("integrates parsed embedded metadata without touching image bytes", async () => {
    const image = embeddedResult(packet);
    const before = image.data.slice();
    const result = await mergeMetadataWithXmpSidecar(image, new TextEncoder().encode(secondPacket), { policy: "preserve-all" });
    expect(result.sources.map((source) => source.kind)).toEqual(["embedded", "sidecar"]);
    expect(result.documents.map((document) => document.provenance?.source)).toEqual(["embedded", "sidecar"]);
    expect(image.data).toEqual(before);
  });

  it("serializes and reparses the complete bounded RDF model with escaping and no source mutation", async () => {
    const value = parseStructuredXmp(packet);
    if (value === null) throw new Error("expected test packet");
    const result = await serializeXmpSidecar(value);
    expect(result.verified).toBe(true);
    expect(result.reparsedSemanticHash).toBe(result.semanticHash);
    expect(result.data).toBeInstanceOf(Uint8Array);
    const escaped = await serializeXmpSidecar({ ...value, properties: { "ex:title": "<script>&\"" }, namespaces: { ex: "urn:example:" } });
    expect(escaped.text).toContain("&lt;script&gt;&amp;");
    expect(escaped.text).not.toContain("<script>");
    await expect(serializeXmpSidecar(value, { maxOutputBytes: 8 })).rejects.toThrow(/exceeds|limit/i);
  });

  it("produces a bounded JSON-safe report without losing typed binary encodings", async () => {
    const result = await parseXmpSidecar(new TextEncoder().encode(packet), { id: "json-safe.xmp" });
    const json = toJsonSafe(result) as { readonly source?: { readonly id?: string }; readonly packets?: readonly unknown[] };
    expect(() => JSON.stringify(json)).not.toThrow();
    expect(json.source?.id).toBe("json-safe.xmp");
    expect(json.packets).toHaveLength(1);
  });
});
