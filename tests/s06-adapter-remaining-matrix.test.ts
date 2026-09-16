import { describe, expect, it } from "vitest";

import {
  fromJsonSafe,
  parseMetadata,
  queryIccTags,
  queryImageDetails,
  queryIptcSemantic,
  queryMetadata,
  queryStructuredXmp,
  toExifReaderCompatible,
  toExifrCompatible,
  toFamilyGroups,
  toFlatObject,
  toJsonSafe,
  toLosslessFamilyGroups,
} from "../src/index.js";
import type { MetadataField, MetadataResult } from "../src/types.js";

const fieldSource = { blockId: "exif:0", directoryId: "IFD0", entryOffset: 10, entryLength: 12, valueOffset: 20, valueLength: 4 };
const fields: readonly MetadataField[] = [
  { id: "IFD0:0x010f", ifd: "IFD0", tag: 0x010f, name: "Make", raw: "A", value: "A", display: "A", description: "camera", type: "ASCII", sensitivity: "low", known: true, source: fieldSource },
  { id: "IFD0:0x010f#1", ifd: "IFD0", tag: 0x010f, name: "Make", raw: "B", value: "B", display: "B", description: "camera", type: "ASCII", sensitivity: "low", known: false, source: { ...fieldSource, blockId: "exif:1", entryOffset: 30 } },
  { id: "XMP:dc:title", ifd: "XMP", tag: 0, name: "dc:title", raw: "Title", value: "Title", display: "Title", description: "title", type: "ASCII", sensitivity: "none", source: { ...fieldSource, blockId: "xmp:0", directoryId: "rdf", entryOffset: 40, valueOffset: 45 } },
  { id: "RAW:opaque", ifd: "RAW", tag: 999, name: "opaque", raw: new Uint8Array([1]), value: new Uint8Array([1]), display: "opaque", description: "opaque", type: "UNKNOWN", sensitivity: "high", known: false },
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

describe("S06 adapter decision and serialization matrix", () => {
  it("exercises every canonical query predicate, missing family, and bounded occurrence", () => {
    expect(queryMetadata(result, { name: "Make" })).toHaveLength(2);
    expect(queryMetadata(result, { id: fields[2]?.id ?? "missing-field" })).toHaveLength(1);
    expect(queryMetadata(result, { family: "XMP" })).toHaveLength(1);
    expect(queryMetadata(result, { blockId: "xmp:0", directoryId: "rdf", sourceOffset: 45 })).toHaveLength(1);
    expect(queryMetadata(result, { known: false })).toHaveLength(2);
    expect(queryMetadata(result, { tag: 0 })).toHaveLength(1);
    expect(queryMetadata(result, { occurrence: 0, maxItems: 1 })).toHaveLength(1);
    expect(queryMetadata(result, { occurrence: 99 })).toEqual([]);
    expect(queryMetadata(result, { occurrence: 1.5 })).toEqual([]);
    expect(queryMetadata(result, { sourceOffset: Number.POSITIVE_INFINITY })).toEqual([]);
    expect(() => queryMetadata(result, { maxItems: 0 })).toThrow(RangeError);

    const property = { name: { namespaceUri: "urn:test", localName: "title", prefix: "a", qualifiedName: "a:title" }, value: { kind: "literal", lexicalValue: "x", value: "x", datatypeUri: null, language: null, qualifiers: [] }, qualifiers: [], order: 0, sourceStart: 0, sourceEnd: 1, aliasOf: null };
    const fallbackPacket = { model: { properties: [property] } } as never;
    expect(queryStructuredXmp(fallbackPacket, { namespaceUri: "urn:test", localName: "title", prefix: "a" })).toHaveLength(1);
    expect(queryStructuredXmp(fallbackPacket, { namespaceUri: "urn:other" })).toEqual([]);
    expect(queryStructuredXmp(fallbackPacket, { occurrence: 4 })).toEqual([]);
    expect(queryImageDetails(result, { property: "displayDimensions", source: "exif", blockId: "exif:0", validation: "conflicting" })).toHaveLength(1);
    expect(queryImageDetails(result, { property: "storedDimensions", source: "png" })).toEqual([]);
    expect(queryImageDetails(result, { property: "formatSpecific" as never })).toEqual([]);
    expect(queryImageDetails(result, { occurrence: 99 })).toEqual([]);
    expect(queryIptcSemantic(result, { id: "missing" })).toEqual([]);
    const withoutIptcSemantic = { ...result } as { iptcSemantic?: unknown };
    delete withoutIptcSemantic.iptcSemantic;
    expect(queryIptcSemantic(withoutIptcSemantic as MetadataResult, {})).toEqual([]);
    expect(queryIccTags(result, { signature: "desc", status: "decoded" })).toHaveLength(1);
    expect(queryIccTags(result, { status: "unknown", occurrence: 0 })).toHaveLength(1);
    expect(queryIccTags({ ...result, icc: null }, {})).toEqual([]);
    expect(queryIccTags(result, { occurrence: -1 })).toEqual([]);
  });

  it("exercises all adapter projections, collisions, diagnostics, and limits", async () => {
    expect(toFlatObject(result).Make).toEqual(["A", "B"]);
    expect(toFlatObject(result, { collision: "first" }).Make).toBe("A");
    expect(toFlatObject(result, { collision: "last" }).Make).toBe("B");
    expect(toFlatObject(result, { maxItems: 2, includeStructured: true, includeDiagnostics: true })).toMatchObject({ $adapter: { truncated: true }, $warnings: [], $canonical: { details } });
    expect(toFlatObject(result, { maxItems: 100 }).opaque).toEqual(new Uint8Array([1]));
    expect(toFamilyGroups(result, { maxItems: 2 })).toEqual({ IFD0: [fields[0], fields[1]] });
    expect(toFamilyGroups(result, { includeStructured: true })).toBeDefined();
    expect(toLosslessFamilyGroups(result).fields).toHaveProperty("RAW");
    expect(toExifReaderCompatible(result, { duplicate: "array" }).IFD0?.Make).toHaveLength(2);
    expect(toExifReaderCompatible(result, { duplicate: "first" }).IFD0?.Make).toMatchObject({ value: "A" });
    expect(toExifReaderCompatible(result, { duplicate: "last" }).IFD0?.Make).toMatchObject({ value: "B" });
    expect(toExifReaderCompatible(result, { maxItems: 1, includeDiagnostics: true })).toHaveProperty("$adapter");
    expect(toExifrCompatible(result, { collision: "first", includeDiagnostics: true })).toHaveProperty("$warnings");
    expect(() => toFlatObject(result, { maxItems: 0 })).toThrow(RangeError);

    const parsed = await parseMetadata(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]));
    expect(toJsonSafe(parsed, { maxItems: 3 })).toBeDefined();
  });

  it("round-trips tagged values and exercises malformed, unsupported, cyclic, and bounded JSON paths", () => {
    const cycle: Record<string, unknown> = { number: Number.NaN, infinity: Number.POSITIVE_INFINITY, bigint: BigInt(7), bytes: Uint8Array.of(1, 2), arrayBuffer: Uint8Array.of(3).buffer, view: new DataView(Uint8Array.of(4).buffer), rational: { numerator: 1, denominator: 0 }, integer: { decimal: "7", signed: true }, undef: undefined, symbol: Symbol("opaque"), function: () => undefined };
    cycle.cycle = cycle;
    expect(toJsonSafe(cycle, { maxItems: 100 })).toMatchObject({ number: { $number: "NaN" }, infinity: { $number: "Infinity" }, bigint: { $bigint: "7" }, bytes: { encoding: "base64" }, arrayBuffer: { encoding: "base64" }, view: { encoding: "base64" }, rational: { $rational: { denominator: 0 } }, cycle: { $circular: true }, symbol: { $unsupported: "symbol" }, function: { $unsupported: "function" } });
    expect(toJsonSafe([1, 2, 3], { maxItems: 2 })).toEqual([1, 2, { $truncated: "items" }]);
    expect(toJsonSafe({ a: "12345" }, { limits: { maxAdapterOutputBytes: 4 } })).toMatchObject({ a: { $truncated: "bytes" } });
    expect(fromJsonSafe({ $bigint: "7" })).toBe(7n);
    expect(fromJsonSafe({ $bigint: "not-integer" })).toEqual({ $bigint: "not-integer" });
    expect(fromJsonSafe({ $number: "NaN" })).toBe(Number.NaN);
    expect(fromJsonSafe({ $number: "Infinity" })).toBe(Number.POSITIVE_INFINITY);
    expect(fromJsonSafe({ $number: "-Infinity" })).toBe(Number.NEGATIVE_INFINITY);
    expect(fromJsonSafe({ $number: "other" })).toEqual({ $number: "other" });
    expect(fromJsonSafe({ $binary: "AQI=", encoding: "base64" })).toEqual(Uint8Array.of(1, 2));
    expect(fromJsonSafe({ $binary: "bad", encoding: "base64" })).toBeNull();
    expect(fromJsonSafe({ $binary: "AQI=", encoding: "hex" })).toEqual({ $binary: "AQI=", encoding: "hex" });
    expect(fromJsonSafe({ $rational: { numerator: { $number: "NaN" }, denominator: { $number: "Infinity" } } })).toEqual({ numerator: Number.NaN, denominator: Number.POSITIVE_INFINITY });
    expect(fromJsonSafe({ $rational: { numerator: "bad", denominator: 2 } })).toEqual({ $rational: { numerator: "bad", denominator: 2 } });
    expect(fromJsonSafe({ $integer64: { decimal: "9", signed: false } })).toEqual({ decimal: "9", signed: false });
    expect(fromJsonSafe({ $integer64: { decimal: 9, signed: false } })).toEqual({ $integer64: { decimal: 9, signed: false } });
    expect(fromJsonSafe({ nested: [{ $undefined: true }, { value: 1 }] })).toEqual({ nested: [undefined, { value: 1 }] });
    expect(() => toJsonSafe({}, { maxDepth: 0 })).toThrow(RangeError);
    expect(() => toJsonSafe({}, { maxDepth: Number.POSITIVE_INFINITY })).toThrow(RangeError);
  });
});
