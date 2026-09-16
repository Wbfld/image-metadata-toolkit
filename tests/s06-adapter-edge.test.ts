import { describe, expect, it } from "vitest";

import {
  fromJsonSafe,
  queryIccTags,
  queryImageDetails,
  queryIptcSemantic,
  queryMetadata,
  queryStructuredXmp,
  toExifReaderCompatible,
  toFamilyGroups,
  toFlatObject,
  toJsonSafe,
  toJsonSafeResult,
  toLosslessFamilyGroups,
} from "../src/adapters.js";
import type { MetadataField, MetadataResult } from "../src/types.js";

const source = { blockId: "exif:0", directoryId: "IFD0", entryOffset: 10, entryLength: 12, valueOffset: 20, valueLength: 4 };
const fields: readonly MetadataField[] = [
  { id: "IFD0:0x010f", ifd: "IFD0", tag: 0x010f, name: "Make", raw: "A", value: "A", display: "A", description: "camera", type: "ASCII", sensitivity: "low", known: true, source },
  { id: "IFD0:0x010f#1", ifd: "IFD0", tag: 0x010f, name: "Make", raw: "B", value: "B", display: "B", description: "camera", type: "ASCII", sensitivity: "low", known: false, source: { ...source, blockId: "exif:1", entryOffset: 30 } },
  { id: "XMP:dc:title", ifd: "XMP", tag: 0, name: "dc:title", raw: "Title", value: "Title", display: "Title", description: "title", type: "ASCII", sensitivity: "none", source: { ...source, blockId: "xmp:0", directoryId: "rdf", entryOffset: 40, valueOffset: 45 } },
];

const details = {
  storedDimensions: [{ value: { width: 10, height: 20 }, source: "jpeg", offset: 1, blockId: "sof", validation: "valid" }],
  displayDimensions: [{ value: { width: 20, height: 10 }, source: "exif", offset: 2, blockId: "exif:0", validation: "conflicting" }],
  bitDepth: [{ value: 8, source: "jpeg", offset: 3, blockId: "sof", validation: "valid" }],
  components: [{ value: ["red", "green", "blue"], source: "jpeg", offset: 4, blockId: "sof", validation: "valid" }],
  colorModel: [{ value: "RGB", source: "jpeg", offset: 5, blockId: "sof", validation: "valid" }],
  alpha: [{ value: "absent", source: "jpeg", offset: 6, blockId: "sof", validation: "valid" }],
  progressive: [{ value: true, source: "jpeg", offset: 7, blockId: "sof", validation: "valid" }],
  interlaced: [{ value: false, source: "png", offset: 8, blockId: "ihdr", validation: "valid" }],
  animation: [{ value: { frames: 1, loopCount: 0 }, source: "webp", offset: 9, blockId: "anim", validation: "unknown" }],
  primaryImageId: "primary",
  primaryImageCandidates: [{ value: "primary", source: "ispe", offset: 10, blockId: "ispe", validation: "valid" }],
  thumbnails: [],
  previews: [],
  auxiliaryImages: [],
  relationshipCandidates: [],
  orientation: [],
  conflicts: [],
  support: { storedDimensions: "supported", displayDimensions: "supported", bitDepth: "supported", components: "supported", colorModel: "supported", alpha: "supported", progressive: "supported", interlaced: "supported", animation: "conditional", relationships: "conditional" },
  formatSpecific: {},
};

const result = {
  format: "jpeg", mimeType: "image/jpeg", container: "jpeg", fileKind: "jpeg", raw: null,
  dimensions: { width: 10, height: 20 }, fields, details,
  exif: { fields }, xmp: null, iptc: null, iptcSemantic: { fields: [{ id: "iptc:title", name: "Title", label: "Title", schema: null, datatype: "string", dataformat: "text", occurrence: "single", sensitivity: "none", value: "Title", candidates: [], conflicts: [], description: "", sourceStandard: "", sourceEdition: "" }], conflicts: [], unknown: [], diagnostics: [], standard: "", edition: "", source: { url: "", sha256: "", license: "", previousEdition: "", previousSha256: "", addedInCurrentEdition: [], removedSincePreviousEdition: [] }, selectionPolicy: "preserve-all", complete: true },
  icc: { chunks: [], decodedTags: [{ signature: "desc", typeSignature: "desc", offset: 1, byteLength: 4, status: "decoded", value: "description", sharedWith: [] }, { signature: "XXXX", typeSignature: "myst", offset: 5, byteLength: 4, status: "unknown", value: null, sharedWith: [] }] }, jfif: null, photoshop: null, makerNotes: null, pngText: [], blocks: [], coverage: { requested: "complete", wholeFile: "complete", reasons: [], unclassifiedBlockIds: [] }, completeness: { complete: true, scope: "full", reasons: [] }, warnings: [],
} as unknown as MetadataResult;

describe("S06 adapter and serialization boundaries", () => {
  it("queries every canonical filter and occurrence without collapsing identities", () => {
    expect(queryMetadata(result, { id: fields[0]?.id ?? "missing-field" })).toHaveLength(1);
    expect(queryMetadata(result, { name: "Make", family: "IFD0", tag: 0x010f, blockId: "exif:0", directoryId: "IFD0", sourceOffset: 10, known: true })).toHaveLength(1);
    expect(queryMetadata(result, { occurrence: 1 })).toHaveLength(1);
    expect(queryMetadata(result, { occurrence: -1 })).toEqual([]);
    expect(queryMetadata(result, { sourceOffset: -1 })).toEqual([]);
    expect(queryMetadata(result, { tag: Number.NaN })).toEqual([]);
    expect(queryMetadata(result, { maxItems: 1 })).toHaveLength(1);

    const property = { name: { namespaceUri: "urn:test", localName: "title", prefix: "a", qualifiedName: "a:title" }, value: { kind: "literal", lexicalValue: "x", value: "x", datatypeUri: null, language: null, qualifiers: [] }, qualifiers: [], order: 0, sourceStart: 0, sourceEnd: 1, aliasOf: null };
    const packet = { rdf: { properties: [property] }, model: { properties: [property] } } as never;
    expect(queryStructuredXmp(packet, { namespaceUri: "urn:test", localName: "title", prefix: "a", occurrence: 0 })).toHaveLength(1);
    expect(queryStructuredXmp(packet, { namespaceUri: "urn:other" })).toEqual([]);
    expect(queryStructuredXmp(packet, { occurrence: -1 })).toEqual([]);
    expect(queryImageDetails(result, { property: "storedDimensions", source: "jpeg", blockId: "sof", validation: "valid", occurrence: 0 })).toHaveLength(1);
    const withoutDetails = { ...result } as { details?: unknown };
    delete withoutDetails.details;
    expect(queryImageDetails(withoutDetails as MetadataResult, {})).toEqual([]);
    expect(queryImageDetails(result, { property: "formatSpecific" as never })).toEqual([]);
    expect(queryIptcSemantic(result, { id: "iptc:title", name: "Title", occurrence: 0 })).toHaveLength(1);
    expect(queryIptcSemantic(result, { occurrence: -1 })).toEqual([]);
    expect(queryIccTags(result, { signature: "desc", status: "decoded", occurrence: 0 })).toHaveLength(1);
    expect(queryIccTags(result, { signature: "missing" })).toEqual([]);
  });

  it("preserves duplicates and exposes explicit lossy collision policies", () => {
    expect(toFlatObject(result).Make).toEqual(["A", "B"]);
    expect(toFlatObject(result, { collision: "first" }).Make).toBe("A");
    expect(toFlatObject(result, { collision: "last" }).Make).toBe("B");
    expect(toFlatObject(result, { maxItems: 1, includeDiagnostics: true, includeStructured: true })).toMatchObject({ $adapter: { truncated: true }, $warnings: [] });
    expect(toFamilyGroups(result, { maxItems: 2 })).toEqual({ IFD0: [fields[0], fields[1]] });
    expect(toLosslessFamilyGroups(result, { includeStructured: true }).fields).toHaveProperty("XMP");
    expect(toExifReaderCompatible(result, { duplicate: "array" }).IFD0?.Make).toHaveLength(2);
    expect(toExifReaderCompatible(result, { duplicate: "first" }).IFD0?.Make).toMatchObject({ value: "A" });
    expect(toExifReaderCompatible(result, { duplicate: "last" }).IFD0?.Make).toMatchObject({ value: "B" });
    expect(toExifReaderCompatible(result, { maxItems: 1, includeDiagnostics: true })).toHaveProperty("$adapter");
    expect(() => toFlatObject(result, { maxItems: 0 })).toThrow(RangeError);
  });

  it("round-trips bounded JSON-safe values, tagged numeric values, binary views, and cycles", () => {
    const cycle: Record<string, unknown> = { number: Number.NaN, infinity: Number.POSITIVE_INFINITY, bigint: BigInt(7), bytes: Uint8Array.of(1, 2), arrayBuffer: Uint8Array.of(3).buffer, view: new Uint8Array([4]).subarray(0, 1), rational: { numerator: 1, denominator: 0 }, integer: { decimal: "7", signed: true }, undef: undefined };
    cycle.cycle = cycle;
    const safe = toJsonSafe(cycle, { maxItems: 2 });
    if (!safe || typeof safe !== "object" || !("$truncated" in safe)) throw new Error("bounded JSON fixture was not truncated");
    expect(typeof safe.$truncated).toBe("string");
    const full = toJsonSafe(cycle, { maxItems: 100 });
    expect(full).toMatchObject({ number: { $number: "NaN" }, infinity: { $number: "Infinity" }, bigint: { $bigint: "7" }, bytes: { encoding: "base64" }, cycle: { $circular: true } });
    expect(fromJsonSafe({ $bigint: "7" })).toBe(7n);
    expect(fromJsonSafe({ $bigint: "not-integer" })).toEqual({ $bigint: "not-integer" });
    expect(fromJsonSafe({ $number: "-Infinity" })).toBe(Number.NEGATIVE_INFINITY);
    expect(fromJsonSafe({ $number: "other" })).toEqual({ $number: "other" });
    expect(fromJsonSafe({ $binary: "AQI=", encoding: "base64" })).toEqual(Uint8Array.of(1, 2));
    expect(fromJsonSafe({ $binary: "bad", encoding: "base64" })).toBeNull();
    expect(fromJsonSafe({ $rational: { numerator: { $number: "NaN" }, denominator: { $number: "Infinity" } } })).toEqual({ numerator: Number.NaN, denominator: Number.POSITIVE_INFINITY });
    expect(fromJsonSafe({ $integer64: { decimal: "9", signed: false } })).toEqual({ decimal: "9", signed: false });
    expect(toJsonSafeResult(result, { maxItems: 2 })).toBeDefined();
    expect(() => toJsonSafe({}, { maxDepth: 0 })).toThrow(RangeError);
  });
});
