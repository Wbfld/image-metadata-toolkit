import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { DEFAULT_METADATA_REGISTRY, parseMetadata, redactMetadata, rewriteJpegMetadata, rewritePngMetadata } from "../src/index.js";
import { serializeIptcIim } from "../src/metadata/serialization.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";
import type { RedactionSelector, RedactionTarget } from "../src/types.js";

const jpegFixture = new URL("./fixtures/jpeg-exif-little-endian.jpg", import.meta.url);
const pngFixture = new URL("./fixtures/png-metadata.png", import.meta.url);
const xmpPacket = `<x:xmpmeta xmlns:x="adobe:ns:meta/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"><rdf:RDF><rdf:Description><dc:title>private title</dc:title><dc:description>public description</dc:description><photoshop:City>Paris XMP</photoshop:City></rdf:Description></rdf:RDF></x:xmpmeta>`;

function field(fieldId: string): RedactionTarget {
  return { kind: "field", fieldId };
}

function selector(selectorValue: RedactionSelector): RedactionTarget {
  return { kind: "selector", selector: selectorValue };
}

describe("W07 typed redaction selectors", () => {
  it("targets an EXIF field by registry identity and returns the typed operation record", async () => {
    const input = new Uint8Array(await readFile(jpegFixture));
    const target = field("IFD0:0x010f");
    const result = await redactMetadata(input, { remove: [target] });

    expect(result.warnings).toEqual([]);
    expect(result.outcome).toEqual({ successful: true, complete: true, unapplied: [], reasons: [] });
    expect(result.removed).toEqual([{ target, occurrences: 1 }]);
    expect(result.operations).toEqual([expect.objectContaining({ operationId: "redaction-remove-0", target, status: "applied", candidateCount: 1, appliedCount: 1, matchedFieldIds: ["normalized:Make"], matchedBlockIds: ["jpeg:APP1:2"], failureCode: null })]);
    expect((await parseMetadata(result.data)).fields.some(({ name }) => name === "Make")).toBe(false);
    expect(input).not.toEqual(result.data);
  });

  it("supports family, sensitivity, and associated-image selectors through one preflight model", async () => {
    const input = new Uint8Array(await readFile(jpegFixture));
    const family = selector({ kind: "family", family: "EXIF" });
    const removedFamily = await redactMetadata(input, { remove: [family] });
    expect(removedFamily.removed).toEqual([{ target: family, occurrences: 1 }]);
    expect((await parseMetadata(removedFamily.data)).exif).toBeNull();

    const sensitive = selector({ kind: "sensitivity", sensitivity: "high" });
    const removedSensitive = await redactMetadata(input, { remove: [sensitive] });
    expect(removedSensitive.removed).toHaveLength(1);
    expect(removedSensitive.removed[0]).toMatchObject({ target: sensitive });
    expect(removedSensitive.removed[0]?.occurrences).toBeGreaterThan(0);
    expect((await parseMetadata(removedSensitive.data)).exif).toBeNull();

    const associated = selector({ kind: "associated-image", imageId: "primary" });
    const removedAssociated = await redactMetadata(input, { remove: [associated] });
    expect(removedAssociated.removed).toEqual([{ target: associated, occurrences: 1 }]);
    expect((await parseMetadata(removedAssociated.data)).exif).toBeNull();
  });

  it("matches XMP by namespace URI and local name and keeps the operation atomic", async () => {
    const source = new Uint8Array(await readFile(pngFixture));
    const parsed = await parseMetadata(source);
    const block = parsed.blocks.find((candidate) => candidate.family === "XMP");
    if (block === undefined) throw new Error("PNG fixture must contain an XMP block");
    const withXmp = (await rewritePngMetadata(source, { blocks: [{ op: "replace", kind: "xmp", blockId: block.id, data: xmpPacket }] })).data;
    const target = selector({ kind: "namespace-property", namespaceUri: "http://purl.org/dc/elements/1.1/", localName: "title" });
    const result = await redactMetadata(withXmp, { remove: [target] });

    expect(result.warnings).toEqual([]);
    expect(result.removed).toEqual([{ target, occurrences: 1 }]);
    const reparsed = await parseMetadata(result.data);
    expect(reparsed.xmp?.packets[0]).toContain("public description");
    expect(reparsed.xmp?.packets[0]).not.toContain("private title");

    const unsupported = selector({ kind: "namespace-property", namespaceUri: "https://example.invalid/private/", localName: "absent" });
    const rejected = await redactMetadata(withXmp, { remove: [unsupported] });
    expect(rejected.data).toEqual(withXmp);
    expect(rejected.removed).toEqual([]);
    expect(rejected.outcome.successful).toBe(false);
    expect(rejected.outcome.unapplied).toEqual([unsupported]);
    expect(rejected.warnings).toContainEqual(expect.objectContaining({ code: "REDACTION_SKIPPED", severity: "error" }));
    expect(rejected.operations).toEqual([expect.objectContaining({ operationId: "redaction-remove-0", target: unsupported, status: "rejected", candidateCount: 0, appliedCount: 0, failureCode: "REDACTION_SKIPPED" })]);
  });

  it("removes exactly the selected physical XMP block when duplicate blocks exist", async () => {
    const source = new Uint8Array(await readFile(jpegFixture));
    const withXmp = rewriteJpegMetadata(source, { blocks: [{ op: "add", kind: "standard-xmp", data: "<x:xmpmeta>one</x:xmpmeta>" }, { op: "add", kind: "standard-xmp", data: "<x:xmpmeta>two</x:xmpmeta>" }] }).data;
    const parsed = await parseMetadata(withXmp);
    const blocks = parsed.blocks.filter((block) => block.family === "XMP" && block.container === "APP1 XMP");
    expect(blocks).toHaveLength(2);
    const target = selector({ kind: "block", blockId: blocks[1]?.id ?? "" });
    const result = await redactMetadata(withXmp, { remove: [target] });

    expect(result.warnings).toEqual([]);
    expect(result.removed).toEqual([{ target, occurrences: 1 }]);
    expect((await parseMetadata(result.data)).xmp?.packets).toEqual(["<x:xmpmeta>one</x:xmpmeta>"]);
  });

  it("preserves a typed field over a typed family removal", async () => {
    const input = new Uint8Array(await readFile(jpegFixture));
    const remove = selector({ kind: "family", family: "EXIF" });
    const preserve = field("normalized:Orientation");
    const result = await redactMetadata(input, { remove: [remove], preserve: [preserve] });
    const reparsed = await parseMetadata(result.data);

    expect(result.warnings).toEqual([]);
    expect(result.removed).toHaveLength(1);
    expect(result.removed[0]).toMatchObject({ target: remove });
    expect(result.removed[0]?.occurrences).toBeGreaterThan(0);
    expect(reparsed.fields.find(({ name }) => name === "Orientation")?.value).toBe(6);
    expect(reparsed.fields.some(({ name }) => name === "Make")).toBe(false);
    expect(result.outcome).toEqual({ successful: true, complete: true, unapplied: [], reasons: [] });
  });

  it("composes an exact removal with a broad removal without widening the exact request", async () => {
    const input = new Uint8Array(await readFile(jpegFixture));
    const exact = field("normalized:Make");
    const broad = selector({ kind: "family", family: "EXIF" });
    const result = await redactMetadata(input, { remove: [exact, broad] });
    expect(result.warnings).toEqual([]);
    expect(result.removed).toEqual([
      { target: exact, occurrences: 1 },
      { target: broad, occurrences: 1 },
    ]);
    expect((await parseMetadata(result.data)).exif).toBeNull();
  });

  it("rejects an unknown family before mutation and does not infer from warning text", async () => {
    const input = new Uint8Array(await readFile(jpegFixture));
    const target = selector({ kind: "family", family: "MakerNote" });
    const result = await redactMetadata(input, { remove: [target], limits: { ...DEFAULT_LIMITS, maxWarnings: 4 } });

    expect(result.data).toEqual(input);
    expect(result.removed).toEqual([]);
    expect(result.outcome.successful).toBe(false);
    expect(result.outcome.unapplied).toEqual([target]);
    expect(result.outcome.reasons.join(" ")).toContain("MakerNote");
  });

  it("precisely removes a generated sensitive EXIF field while retaining sibling fields", async () => {
    const input = new Uint8Array(await readFile(jpegFixture));
    const parsed = await parseMetadata(input);
    const readableSensitive = parsed.fields.filter((candidate) => candidate.sensitivity !== "none" && candidate.source?.blockId !== undefined);
    expect(readableSensitive.length).toBeGreaterThan(5);
    const registryNames = new Set(DEFAULT_METADATA_REGISTRY.fields.map((definition) => definition.name));
    for (const candidate of readableSensitive) {
      expect(registryNames.has(candidate.name)).toBe(true);
      const registryField = DEFAULT_METADATA_REGISTRY.get(candidate.ifd, candidate.tag);
      expect(registryField?.name, candidate.name).toBe(candidate.name);
      expect(registryField?.sensitivity, candidate.name).toBe(candidate.sensitivity);
      const target = field(`${candidate.ifd}:0x${candidate.tag.toString(16).padStart(4, "0")}`);
      const result = await redactMetadata(input, { remove: [target] });
      expect(result.warnings, candidate.name).toEqual([]);
      expect(result.outcome, candidate.name).toEqual({ successful: true, complete: true, unapplied: [], reasons: [] });
      expect(result.removed, candidate.name).toEqual([{ target, occurrences: 1 }]);
      const reparsed = await parseMetadata(result.data);
      expect(reparsed.fields.some((fieldValue) => fieldValue.id === candidate.id), candidate.name).toBe(false);
      const sibling = candidate.name === "Model" ? "Make" : "Model";
      expect(reparsed.fields.some((fieldValue) => fieldValue.name === sibling), `${candidate.name} must not widen to family removal`).toBe(true);
    }
  });

  it("removes exact IPTC and XMP properties sharing physical metadata blocks", async () => {
    const source = new Uint8Array(await readFile(jpegFixture));
    const iim = serializeIptcIim([
      { record: 2, dataset: 90, value: "Paris" },
      { record: 2, dataset: 110, value: "Credit line" },
    ]);
    const withMetadata = rewriteJpegMetadata(source, {
      blocks: [
        { op: "add", kind: "standard-xmp", data: xmpPacket },
        { op: "add", kind: "iptc", data: iim },
      ],
    }).data;
    const targetIptc = field("IPTC:2:90");
    const removedIptc = await redactMetadata(withMetadata, { remove: [targetIptc] });
    expect(removedIptc.warnings).toEqual([]);
    expect(removedIptc.removed).toEqual([{ target: targetIptc, occurrences: 1 }]);
    const iptcAfter = await parseMetadata(removedIptc.data);
    expect(iptcAfter.iptc?.fields?.some((candidate) => candidate.tag === 0x025a)).toBe(false);
    expect(iptcAfter.iptc?.fields?.some((candidate) => candidate.tag === 0x026e && candidate.value === "Credit line")).toBe(true);
    expect(iptcAfter.fields.some((candidate) => candidate.name === "Model")).toBe(true);

    const targetXmp = selector({ kind: "namespace-property", namespaceUri: "http://purl.org/dc/elements/1.1/", localName: "title" });
    const removedXmp = await redactMetadata(withMetadata, { remove: [targetXmp] });
    expect(removedXmp.warnings).toEqual([]);
    expect(removedXmp.removed).toEqual([{ target: targetXmp, occurrences: 1 }]);
    const xmpAfter = await parseMetadata(removedXmp.data);
    expect(xmpAfter.xmp?.packets[0]).not.toContain("private title");
    expect(xmpAfter.xmp?.packets[0]).toContain("public description");
    expect(xmpAfter.iptc?.fields?.some((candidate) => candidate.tag === 0x025a)).toBe(true);
  });

  it("resolves a generated IPTC semantic identity to every mapped physical candidate", async () => {
    const source = new Uint8Array(await readFile(jpegFixture));
    const iim = serializeIptcIim([{ record: 2, dataset: 90, value: "Paris IIM" }]);
    const withMetadata = rewriteJpegMetadata(source, {
      blocks: [
        { op: "add", kind: "standard-xmp", data: xmpPacket },
        { op: "add", kind: "iptc", data: iim },
      ],
    }).data;
    const target = field("iptc:cityName");
    const result = await redactMetadata(withMetadata, { remove: [target] });
    expect(result.warnings).toEqual([]);
    expect(result.removed).toEqual([{ target, occurrences: 2 }]);
    const reparsed = await parseMetadata(result.data);
    expect(reparsed.iptc?.fields?.some((candidate) => candidate.tag === 0x025a) ?? false).toBe(false);
    expect(reparsed.xmp?.packets[0]).not.toContain("Paris XMP");
    expect(reparsed.fields.some((candidate) => candidate.name === "Model")).toBe(true);
  });

  it("uses occurrence-qualified IPTC identities to remove one duplicate and retain the other", async () => {
    const source = new Uint8Array(await readFile(jpegFixture));
    const iim = serializeIptcIim([
      { record: 2, dataset: 25, value: "first keyword" },
      { record: 2, dataset: 25, value: "second keyword" },
    ]);
    const withIptc = rewriteJpegMetadata(source, { blocks: [{ op: "add", kind: "iptc", data: iim }] }).data;
    const target = field("IPTC:2:25:1");
    const result = await redactMetadata(withIptc, { remove: [target] });
    expect(result.warnings).toEqual([]);
    expect(result.removed).toEqual([{ target, occurrences: 1 }]);
    const fields = (await parseMetadata(result.data)).iptc?.fields ?? [];
    expect(fields.filter((candidate) => candidate.tag === 0x0219).map((candidate) => candidate.value)).toEqual(["first keyword"]);
  });

  it("rejects an unsafe exact-preserve and broad-remove combination before mutation", async () => {
    const input = new Uint8Array(await readFile(jpegFixture));
    const removeExact = field("normalized:Make");
    const preserveExact = field("normalized:BodySerialNumber");
    const broad = selector({ kind: "family", family: "EXIF" });
    const result = await redactMetadata(input, { remove: [removeExact, broad], preserve: [preserveExact] });
    expect(result.data).toEqual(input);
    expect(result.removed).toEqual([]);
    expect(result.outcome.successful).toBe(false);
    expect(result.outcome.unapplied).toContain(removeExact);
    expect(result.outcome.unapplied).toContain(broad);

    const preserveOnly = await redactMetadata(input, { remove: [broad], preserve: [preserveExact] });
    expect(preserveOnly.data).toEqual(input);
    expect(preserveOnly.removed).toEqual([]);
    expect(preserveOnly.outcome.successful).toBe(false);
    expect(preserveOnly.outcome.unapplied).toEqual([broad]);
  });

  it("rejects an unresolvable exact field without broadening it to its metadata family", async () => {
    const input = new Uint8Array(await readFile(jpegFixture));
    const target = field("ExifIFD:0x927c");
    const result = await redactMetadata(input, { remove: [target] });
    expect(result.data).toEqual(input);
    expect(result.removed).toEqual([]);
    expect(result.outcome.successful).toBe(false);
    expect(result.outcome.unapplied).toEqual([target]);
    expect((await parseMetadata(result.data)).fields.some((candidate) => candidate.name === "Make")).toBe(true);
  });

  it("keeps unknown XMP privacy fail-closed and removes only its URI/local-name property", async () => {
    const source = new Uint8Array(await readFile(pngFixture));
    const parsed = await parseMetadata(source);
    const block = parsed.blocks.find((candidate) => candidate.family === "XMP");
    if (block === undefined) throw new Error("PNG fixture must contain an XMP block");
    const unknownPacket = `<x:xmpmeta xmlns:x="adobe:ns:meta/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:private="https://example.invalid/private/"><rdf:RDF><rdf:Description><private:secret>do not retain</private:secret><private:public>retain</private:public></rdf:Description></rdf:RDF></x:xmpmeta>`;
    const withXmp = (await rewritePngMetadata(source, { blocks: [{ op: "replace", kind: "xmp", blockId: block.id, data: unknownPacket }] })).data;
    const target = selector({ kind: "namespace-property", namespaceUri: "https://example.invalid/private/", localName: "secret" });
    const result = await redactMetadata(withXmp, { remove: [target] });
    expect(result.warnings).toEqual([]);
    expect(result.removed).toEqual([{ target, occurrences: 1 }]);
    const reparsed = await parseMetadata(result.data);
    expect(reparsed.xmp?.packets[0]).not.toContain("do not retain");
    expect(reparsed.xmp?.packets[0]).toContain("retain");
  });
});
