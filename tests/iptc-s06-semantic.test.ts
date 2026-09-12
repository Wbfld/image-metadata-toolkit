import { describe, expect, it } from "vitest";
import { IPTC_TECHREFERENCE_PROPERTIES, IPTC_TECHREFERENCE_SOURCE, IPTC_TECHREFERENCE_STRUCTURES, IPTC_TECHREFERENCE_VERSION_DELTA } from "../src/generated/iptc-pmd.js";
import { IPTC_IIM_DATASETS, parseIptcMetadata } from "../src/metadata/iptc.js";
import { deriveIptcSemantic } from "../src/normalize/iptc.js";
import { auditPrivacy } from "../src/privacy/audit.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";
import type { XmpData } from "../src/types.js";

function iim(record: number, dataset: number, value: Uint8Array): Uint8Array {
  return Uint8Array.from([0x1c, record, dataset, value.length >>> 8, value.length & 0xff, ...value]);
}

const utf8 = (value: string): Uint8Array => new TextEncoder().encode(value);

function photoshopResource(value: Uint8Array): Uint8Array {
  return Uint8Array.from([...utf8("8BIM"), 0x04, 0x04, 0, 0, value.length >>> 24, (value.length >>> 16) & 0xff, (value.length >>> 8) & 0xff, value.length & 0xff, ...value, ...(value.length % 2 === 0 ? [] : [0])]);
}

function jpegSegment(marker: number, value: Uint8Array): Uint8Array {
  const length = value.length + 2;
  return Uint8Array.from([0xff, marker, length >>> 8, length & 0xff, ...value]);
}

function xmpJpeg(packet: string): Uint8Array {
  const xmp = jpegSegment(0xe1, Uint8Array.from([...utf8("http://ns.adobe.com/xap/1.0/\0"), ...utf8(packet)]));
  const sof = jpegSegment(0xc0, Uint8Array.of(8, 0, 1, 0, 1, 1, 1, 0x11, 0));
  const sos = jpegSegment(0xda, Uint8Array.of(1, 1, 0, 0, 63, 0));
  return Uint8Array.from([0xff, 0xd8, ...xmp, ...sof, ...sos, 0, 0xff, 0xd9]);
}

describe("S06 IPTC semantic vocabulary", () => {
  it("contains the complete generated 2025.1 property set and pinned previous release", () => {
    expect(IPTC_TECHREFERENCE_PROPERTIES).toHaveLength(66);
    expect(IPTC_TECHREFERENCE_SOURCE.edition).toBe("2025.1");
    expect(IPTC_TECHREFERENCE_SOURCE.sha256).toBe("592c37b01fe02c7333cd7059a212bdceee13c1147ad7bcc6dbe996ba433128a8");
    expect(IPTC_TECHREFERENCE_SOURCE.previousEdition).toBe("2023.1");
    expect(IPTC_TECHREFERENCE_SOURCE.previousSha256).toBe("6ce036311ac30a8b0755029870b3b508061e17bc69206ac0949315b4b8ebe49f");
    expect(IPTC_TECHREFERENCE_VERSION_DELTA.addedIn2025_1).toEqual(["aIPromptInformation", "aIPromptWriterNam", "aISystemUsed", "aISystemVersionUsed"]);
    for (const property of IPTC_TECHREFERENCE_PROPERTIES) {
      expect(property.stableIdentity).toBe(`iptc-pmd:${property.id}`);
      expect(property.validationRules).toContain("preserve-raw-lexical-value");
      expect(property.applicableVersions.length).toBeGreaterThan(0);
      if ((property as unknown as { readonly xmpId: string | null }).xmpId !== null) expect(property.mappings.xmp).toMatchObject({ namespaceUri: property.namespaceUri, localName: property.localName });
      if (property.iimId !== null) expect(property.mappings.iim.length).toBeGreaterThan(0);
    }
    for (const structure of Object.values(IPTC_TECHREFERENCE_STRUCTURES)) {
      expect(structure.stableIdentity).toBe(`iptc-pmd-structure:${structure.id}`);
      for (const member of structure.members) expect(member.stableIdentity).toBe(`iptc-pmd:${member.id}`);
    }
  });

  it("publishes bounded definitions for every recognised IIM transport/application dataset", () => {
    expect(IPTC_IIM_DATASETS.length).toBeGreaterThan(50);
    expect(IPTC_IIM_DATASETS.find((item) => item.id === "IIM:1:90")).toMatchObject({ name: "CodedCharacterSet", format: "coded-character-set", cardinality: "0..1" });
    expect(IPTC_IIM_DATASETS.find((item) => item.id === "IIM:2:25")).toMatchObject({ name: "Keywords", repeatable: true, cardinality: "0..n", maxLength: 64 });
    expect(IPTC_IIM_DATASETS.find((item) => item.id === "IIM:8:10")?.format).toBe("binary");
    for (const dataset of IPTC_IIM_DATASETS) {
      expect(dataset.stableIdentity).toBe(`iptc-iim:${dataset.record}:${dataset.dataset}`);
      expect(dataset.mappings.iim.id).toBe(`${dataset.record}:${dataset.dataset}`);
      expect(dataset.validationRules).toContain("preserve-raw-on-invalid");
      expect(dataset.rawValueBehavior).toContain("raw bytes");
    }
  });

  it("retains repeated IIM candidates and validates official lengths", () => {
    const payload = Uint8Array.from([...iim(2, 25, utf8("one")), ...iim(2, 25, utf8("two")), ...iim(2, 80, utf8("Creator"))]);
    const parsed = parseIptcMetadata(payload, DEFAULT_LIMITS);
    expect(parsed.fields.filter((field) => field.name === "Keywords").map((field) => field.id)).toEqual(["IPTC:2:25", "IPTC:2:25:1"]);
    const semantic = deriveIptcSemantic(parsed.data, null, [], DEFAULT_LIMITS);
    const keywords = semantic.fields.find((field) => field.id === "iptc:keywords");
    expect(keywords?.candidates).toHaveLength(2);
    expect(keywords?.conflicts[0]?.reason).toBe("different-values");
    expect(keywords?.sensitivity).toBe("moderate");
  });

  it("maps URI-aware XMP arrays without using the legacy flattened map", () => {
    const packet = `<x:xmpmeta xmlns:x="adobe:ns:meta/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/"><rdf:RDF><rdf:Description rdf:about=""><dc:creator><rdf:Seq><rdf:li>Ada</rdf:li><rdf:li>Grace</rdf:li></rdf:Seq></dc:creator></rdf:Description></rdf:RDF></x:xmpmeta>`;
    const xmp: XmpData = { packets: [packet], packetProvenance: [{ id: "xmp:0", source: "embedded", blockIds: ["jpeg:xmp:0"], packetIndex: 0, offset: 10, length: packet.length }] };
    const semantic = deriveIptcSemantic(null, xmp, [], DEFAULT_LIMITS);
    const creators = semantic.fields.find((field) => field.id === "iptc:creatorNames");
    expect(creators?.candidates).toHaveLength(1);
    expect(creators?.candidates[0]?.source.namespaceUri).toBe("http://purl.org/dc/elements/1.1/");
    expect(creators?.candidates[0]?.value).toMatchObject({ kind: "array", container: "Seq" });
    expect(creators?.candidates[0]?.source.blockId).toBe("jpeg:xmp:0");
  });

  it("maps every generated 2025.1 XMP property by namespace URI and local name", () => {
    const mappings = IPTC_TECHREFERENCE_PROPERTIES.map((property) => (property as unknown as { readonly mappings: { readonly xmp: typeof property.mappings.xmp | null } }).mappings.xmp).filter((mapping): mapping is NonNullable<typeof mapping> => mapping !== null);
    const namespaces = [...new Map(mappings.map((mapping) => [mapping.prefix, mapping.namespaceUri])).entries()].map(([prefix, uri]) => `xmlns:${prefix}="${uri}"`).join(" ");
    const properties = mappings.map((mapping) => `<${mapping.prefix}:${mapping.localName}>value</${mapping.prefix}:${mapping.localName}>`).join("");
    const packet = `<x:xmpmeta xmlns:x="adobe:ns:meta/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" ${namespaces}><rdf:RDF><rdf:Description rdf:about="">${properties}</rdf:Description></rdf:RDF></x:xmpmeta>`;
    const xmp: XmpData = { packets: [packet] };
    const semantic = deriveIptcSemantic(null, xmp, [], DEFAULT_LIMITS);
    expect(semantic.fields.filter((field) => field.candidates.some((candidate) => candidate.source.kind === "xmp")).map((field) => field.id.replace("iptc:", "")).sort()).toEqual(IPTC_TECHREFERENCE_PROPERTIES.filter((property) => (property as unknown as { readonly mappings: { readonly xmp: typeof property.mappings.xmp | null } }).mappings.xmp !== null).map((property) => property.id).sort());
  });

  it("keeps invalid UTF-8 raw and emits bounded diagnostics", () => {
    const payload = Uint8Array.from([...iim(1, 90, Uint8Array.from([0x1b, 0x25, 0x47])), ...iim(2, 120, Uint8Array.from([0xc3, 0x28]))]);
    const parsed = parseIptcMetadata(payload, { ...DEFAULT_LIMITS, maxWarnings: 8 });
    expect(parsed.fields.find((field) => field.name === "Caption")?.raw).toEqual(Uint8Array.from([0xc3, 0x28]));
    expect(parsed.warnings.some((warning) => warning.code === "INVALID_VALUE")).toBe(true);
  });

  it("performs calendar, time-zone, code, length, repeatability, and count validation without losing bytes", () => {
    const tooLongKeyword = utf8("k".repeat(65));
    const payload = Uint8Array.from([
      ...iim(2, 55, utf8("20230229")), ...iim(2, 60, utf8("246000+1460")),
      ...iim(2, 100, utf8("@@@")), ...iim(2, 135, utf8("en--GB")), ...iim(2, 10, utf8("0")),
      ...iim(2, 25, tooLongKeyword), ...iim(2, 90, utf8("one")), ...iim(2, 90, utf8("two")), ...iim(9, 9, utf8("opaque")),
    ]);
    const parsed = parseIptcMetadata(payload, { ...DEFAULT_LIMITS, maxWarnings: 32, maxIptcDatasets: 32 });
    for (const field of parsed.fields.filter((field) => [0x0237, 0x023c, 0x0264, 0x0287, 0x020a, 0x0219].includes(field.tag))) {
      expect(field.value).toEqual(field.raw);
      expect(field.type).toBe("UNDEFINED");
    }
    expect(parsed.fields.find((field) => field.tag === 0x0909)?.known).toBe(false);
    expect(parsed.warnings.some((warning) => warning.message.includes("Non-repeatable"))).toBe(true);
    expect(parsed.warnings.filter((warning) => warning.code === "INVALID_DATE")).toHaveLength(1);
    expect(parseIptcMetadata(Uint8Array.from([...iim(2, 55, utf8("20240229")), ...iim(2, 60, utf8("235959+1400"))]), DEFAULT_LIMITS).warnings).toEqual([]);
  });

  it("decodes every Photoshop IPTC resource and safe extended IIM length", () => {
    const first = iim(2, 25, utf8("first"));
    const second = iim(2, 25, utf8("second"));
    const extended = Uint8Array.from([0x1c, 9, 9, 0x80, 0x02, 0x01, 0x00, ...new Uint8Array(256).fill(0x61)]);
    const payload = Uint8Array.from([...utf8("Photoshop 3.0\0"), ...photoshopResource(first), ...photoshopResource(second), ...photoshopResource(extended)]);
    const parsed = parseIptcMetadata(payload, DEFAULT_LIMITS);
    expect(parsed.fields.filter((field) => field.tag === 0x0219).map((field) => field.value)).toEqual(["first", "second"]);
    expect(parsed.fields.find((field) => field.tag === 0x0909)?.raw).toHaveLength(256);
    expect(parsed.malformed).toBe(false);
  });

  it("validates structured XMP, preserves unknown values, and bounds semantic output", () => {
    const packet = `<x:xmpmeta xmlns:x="adobe:ns:meta/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:example="https://example.invalid/ns/"><rdf:RDF><rdf:Description rdf:about=""><dc:description>not-an-alt-language-array</dc:description><example:Prompt>retain me</example:Prompt></rdf:Description></rdf:RDF></x:xmpmeta>`;
    const xmp: XmpData = { packets: [packet], packetProvenance: [{ id: "xmp:0", source: "embedded", blockIds: ["jpeg:xmp:0"], packetIndex: 0, offset: 10, length: packet.length }] };
    const semantic = deriveIptcSemantic(null, xmp, [], DEFAULT_LIMITS);
    expect(semantic.fields.find((field) => field.id === "iptc:description")?.candidates[0]).toMatchObject({ validation: "invalid" });
    expect(semantic.unknown).toHaveLength(1);
    expect(semantic.unknown[0]?.source).toMatchObject({ namespaceUri: "https://example.invalid/ns/", localName: "Prompt" });
    const bounded = deriveIptcSemantic(null, xmp, [], { ...DEFAULT_LIMITS, maxIptcOutputBytes: 1 });
    expect(bounded.complete).toBe(false);
    expect(bounded.diagnostics).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
  });

  it("treats unknown XMP as high-sensitivity data in privacy audit output", async () => {
    const packet = `<x:xmpmeta xmlns:x="adobe:ns:meta/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:example="https://example.invalid/ns/"><rdf:RDF><rdf:Description rdf:about=""><example:Prompt>retain me</example:Prompt></rdf:Description></rdf:RDF></x:xmpmeta>`;
    const audit = await auditPrivacy(xmpJpeg(packet));
    expect(audit.findings).toContainEqual(expect.objectContaining({ target: "unknown-xmp:https://example.invalid/ns/:Prompt", sensitivity: "high" }));
  });
});
