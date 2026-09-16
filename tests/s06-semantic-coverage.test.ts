import { describe, expect, it } from "vitest";

import {
  fromJsonSafe,
  getCaptureTime,
  getGps,
  getMetadataSummary,
  getOrientation,
  getRotation,
  getThumbnail,
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
  toJsonSafeResult,
  toLosslessFamilyGroups,
} from "../src/index.js";
import type { MetadataField, MetadataResult } from "../src/types.js";
import {
  deriveXmpPacketProvenance,
  extendedXmpGuid,
  mergeStructuredXmp,
  parseExtendedXmpChunk,
  parseStructuredXmp,
  parseStructuredXmpBytes,
  parseStructuredXmpBytesDetailed,
  parseStructuredXmpBytesWithDecoder,
  parseStructuredXmpBytesWithDecoderDetailed,
  parseStructuredXmpDetailed,
  parseStructuredXmpDocuments,
  parseStructuredXmpWithDecoder,
  parseStructuredXmpWithDecoderDetailed,
  reassembleExtendedXmp,
  validateStructuredXmpPacket,
  type XmpProperty,
} from "../src/metadata/xmp.js";

const field = (name: string, value: unknown, ifd = "EXIF", tag = 1, extra: Record<string, unknown> = {}): MetadataField => ({
  id: `${ifd}:${name}:${tag}`,
  name,
  description: `${name} description`,
  value: value as MetadataField["value"],
  ifd,
  tag,
  known: true,
  ...extra,
} as MetadataField);

function resultWith(fields: readonly MetadataField[], overrides: Record<string, unknown> = {}): MetadataResult {
  return {
    format: "jpeg",
    mimeType: "image/jpeg",
    container: "jpeg",
    fileKind: "image",
    raw: null,
    dimensions: { width: 640, height: 480 },
    displayDimensions: { width: 640, height: 480 },
    transform: null,
    fields,
    exif: null,
    xmp: null,
    iptc: null,
    iptcSemantic: null,
    icc: null,
    jfif: null,
    pngText: [],
    blocks: [],
    coverage: { requested: "complete", wholeFile: "complete", reasons: [], unclassifiedBlockIds: [] },
    completeness: { complete: true, scope: "full", reasons: [] },
    warnings: [],
    ...overrides,
  } as unknown as MetadataResult;
}

describe("S06 semantic adapter and convenience boundaries", () => {
  it("queries every canonical filter and preserves deterministic duplicate semantics", () => {
    const fields = [
      field("Title", "first", "XMP", 0, { source: { blockId: "xmp-1", directoryId: "rdf", entryOffset: 10, valueOffset: 20 } }),
      field("Title", "second", "XMP", 0, { source: { blockId: "xmp-2", directoryId: "rdf-2", entryOffset: 30, valueOffset: 40 }, known: false }),
      field("Artist", "Ada", "IFD0", 315, { directoryId: "ifd0" }),
    ];
    const semantic = [{ id: "cityName", name: "City", value: "London" }, { id: "keyword", name: "Keyword", value: "test" }];
    const tags = [{ signature: "desc", status: "decoded", value: "one" }, { signature: "wtpt", status: "unknown", value: new Uint8Array([1]) }];
    const details = { storedDimensions: [{ source: "jpeg", blockId: "frame", validation: "valid", width: 640 }], displayDimensions: [], bitDepth: [], components: [], colorModel: [], alpha: [], progressive: [], interlaced: [], animation: [], orientation: [], primaryImageCandidates: [], relationshipCandidates: [] };
    const value = resultWith(fields, { iptcSemantic: { fields: semantic }, icc: { decodedTags: tags }, details });

    expect(queryMetadata(value)).toHaveLength(3);
    expect(queryMetadata(value, { id: fields[0]?.id ?? "missing-field", name: "Title", family: "XMP", blockId: "xmp-1", directoryId: "rdf", tag: 0, sourceOffset: 10, known: true })).toHaveLength(1);
    expect(queryMetadata(value, { sourceOffset: 40, occurrence: 0 })).toHaveLength(1);
    expect(queryMetadata(value, { occurrence: 1 })).toEqual([fields[1]]);
    expect(queryMetadata(value, { occurrence: -1 })).toEqual([]);
    expect(queryMetadata(value, { tag: 1.5 })).toEqual([]);
    expect(queryMetadata(value, { sourceOffset: -1 })).toEqual([]);
    expect(() => queryMetadata(value, { maxItems: 0 })).toThrow(RangeError);
    expect(queryMetadata(value, { maxItems: 1 })).toHaveLength(1);

    const xmp = { rdf: { properties: [{ name: { namespaceUri: "urn:one", localName: "title", prefix: "a" } }, { name: { namespaceUri: "urn:two", localName: "title", prefix: "a" } }] } } as unknown as Parameters<typeof queryStructuredXmp>[0];
    expect(queryStructuredXmp(xmp)).toHaveLength(2);
    expect(queryStructuredXmp(xmp, { namespaceUri: "urn:two", localName: "title", prefix: "a", occurrence: 0 })).toHaveLength(1);
    expect(queryStructuredXmp(xmp, { occurrence: -1 })).toEqual([]);
    expect(queryStructuredXmp({} as Parameters<typeof queryStructuredXmp>[0])).toEqual([]);

    expect(queryImageDetails(value)).toHaveLength(1);
    expect(queryImageDetails(value, { property: "storedDimensions", source: "jpeg", blockId: "frame", validation: "valid", occurrence: 0 })).toHaveLength(1);
    expect(queryImageDetails(value, { occurrence: -1 })).toEqual([]);
    expect(queryImageDetails(resultWith(fields), { property: "storedDimensions" })).toEqual([]);
    expect(queryIptcSemantic(value)).toHaveLength(2);
    expect(queryIptcSemantic(value, { id: "keyword", name: "Keyword", occurrence: 0 })).toHaveLength(1);
    expect(queryIptcSemantic(value, { occurrence: -1 })).toEqual([]);
    expect(queryIccTags(value)).toHaveLength(2);
    expect(queryIccTags(value, { signature: "wtpt", status: "unknown", occurrence: 0 })).toHaveLength(1);
    expect(queryIccTags(value, { occurrence: -1 })).toEqual([]);
  });

  it("covers flat, grouped, lossless, and bounded JSON representations", () => {
    const fields = [field("Duplicate", "a"), field("Duplicate", "b"), field("Unique", new Uint8Array([0, 255]))];
    const value = resultWith(fields, { telemetry: { source: "test" } });
    expect(toFlatObject(value).Duplicate).toEqual(["a", "b"]);
    expect(toFlatObject(value, { collision: "first", includeStructured: true, includeDiagnostics: true }).Duplicate).toBe("a");
    expect(toFlatObject(value, { collision: "last", maxItems: 1 })).toMatchObject({ Duplicate: "a", $adapter: { truncated: true, omittedFields: 2 } });
    expect(toFamilyGroups(value, { maxItems: 1 })).toEqual({ EXIF: [fields[0]] });
    expect(toLosslessFamilyGroups(value, { includeStructured: true }).fields.EXIF).toHaveLength(3);
    expect(toExifrCompatible(value).Duplicate).toBe("b");
    expect(toExifReaderCompatible(value).EXIF?.Duplicate).toHaveLength(2);
    expect(toExifReaderCompatible(value, { duplicate: "first", includeDiagnostics: true, maxItems: 1 }).EXIF?.Duplicate).toMatchObject({ value: "a" });
    expect(toExifReaderCompatible(value, { duplicate: "last" }).EXIF?.Duplicate).toMatchObject({ value: "b" });

    const circular: Record<string, unknown> = { b: undefined, a: Number.NaN, nested: [Infinity, -Infinity, 2n, new Uint8Array([1, 2]), new Uint8Array([3]).buffer, new DataView(Uint8Array.of(4).buffer), Symbol("opaque"), () => undefined] };
    circular.self = circular;
    circular.rational = { numerator: 1, denominator: Number.POSITIVE_INFINITY };
    circular.integer = { decimal: "18446744073709551615", signed: false };
    const safe = toJsonSafe(circular, { maxDepth: 3, maxItems: 100 });
    expect(safe).toMatchObject({ a: { $number: "NaN" }, b: { $undefined: true }, self: { $circular: true } });
    expect(toJsonSafe({ deep: { deeper: { value: "x" } } }, { maxDepth: 1 })).toEqual({ deep: { deeper: { $truncated: "depth" } } });
    expect(toJsonSafe(["long"], { limits: { maxAdapterOutputBytes: 1 } })).toEqual([{ $truncated: "bytes" }]);
    expect(() => toJsonSafe({}, { maxDepth: 0 })).toThrow(RangeError);
    expect(fromJsonSafe({ $bigint: "123" })).toBe(123n);
    expect(fromJsonSafe({ $bigint: "bad" })).toEqual({ $bigint: "bad" });
    expect(fromJsonSafe({ $rational: { numerator: { $number: "NaN" }, denominator: { $number: "Infinity" } } })).toEqual({ numerator: Number.NaN, denominator: Infinity });
    expect(fromJsonSafe({ $integer64: { decimal: "9", signed: true } })).toEqual({ decimal: "9", signed: true });
    expect(fromJsonSafe({ $binary: "AQI=", encoding: "base64" })).toEqual(new Uint8Array([1, 2]));
    expect(fromJsonSafe({ $binary: "!", encoding: "base64" })).toEqual(null);
    expect(fromJsonSafe({ $number: "-Infinity" })).toBe(-Infinity);
    expect(fromJsonSafe({ $undefined: true })).toBeUndefined();
    const safeResult = toJsonSafeResult(value) as { readonly format?: unknown; readonly fields?: readonly { readonly name?: unknown }[] };
    expect(safeResult.format).toBe("jpeg");
    expect(safeResult.fields?.some((item) => item.name === "Duplicate")).toBe(true);
  });

  it("returns all convenience outcomes without choosing invalid or conflicting values", () => {
    const allOrientations = Array.from({ length: 8 }, (_, index) => field("Orientation", index + 1));
    const base = resultWith([
      field("GPSLatitude", 51.5), field("GPSLongitude", -0.1), field("GPSAltitude", 10),
      field("Make", "Camera"), field("Model", "Model"), field("CameraOwnerName", "Owner"), field("BodySerialNumber", "body"),
      field("LensMake", "Lens"), field("LensModel", "Prime"), field("FocalLength", 50), field("FocalLengthIn35mmFilm", 75), field("LensSpecification", [24, 70, 2.8, 4]),
      field("ExposureTime", 0.01), field("FNumber", 2.8), field("ISOSpeedRatings", 100), field("StandardOutputSensitivity", 90), field("RecommendedExposureIndex", 100), field("ISOSpeed", 100),
      field("Flash", { fired: true, mode: "auto" }), field("DateTime", "2024:01:02 03:04:05"), field("SubSecTime", "123"), field("OffsetTime", "+01:00"),
      field("DateTimeOriginal", "2024:01:02 03:04:05"), field("SubSecTimeOriginal", "9"), field("OffsetTimeOriginal", "+01:00"),
      field("DateTimeDigitized", "2024:01:02 03:04:05"), field("SubSecTimeDigitized", "0"), field("OffsetTimeDigitized", "+01:00"),
      ...allOrientations,
    ]);
    expect(getGps(base)).toMatchObject({ latitude: 51.5, longitude: -0.1, complete: true });
    expect(getMetadataSummary(base).camera).toMatchObject({ make: "Camera", serialNumber: "body" });
    expect(getCaptureTime(base)).toMatchObject({ source: "DateTimeOriginal", value: "2024:01:02 03:04:05.9+01:00" });
    for (const orientation of allOrientations) {
      const value = resultWith([orientation]);
      expect(getOrientation(value).value).toBe(orientation.value);
      expect(getRotation(value)).not.toBeNull();
    }
    expect(getOrientation(resultWith([field("Orientation", 0)])).value).toBeNull();
    expect(getRotation(resultWith([]))).toBeNull();
    const combined = resultWith([field("Orientation", 6)], { transform: { rotation: 180, mirrored: true, mirrorAxis: "vertical" } });
    expect(getOrientation(combined).source).toBe("combined");
    expect(getRotation(combined)?.conflicts).toHaveLength(1);
    expect(getGps(resultWith([field("GPSLatitude", 1), field("GPSLatitude", 2), field("GPSLongitude", 3)])).complete).toBe(false);
    expect(getCaptureTime(resultWith([field("DateTime", "date")])).source).toBe("DateTime");
    expect(getCaptureTime(resultWith([field("DateTimeDigitized", "digitized")])).source).toBe("DateTimeDigitized");
    expect(getCaptureTime(resultWith([])).source).toBe("none");
    const thumbnail = { data: new Uint8Array([1, 2]), mimeType: "image/jpeg" };
    const withThumbnail = resultWith([], { exif: { thumbnail } });
    const copy = getThumbnail(withThumbnail);
    expect(copy).toEqual(thumbnail);
    expect(copy?.data).not.toBe(thumbnail.data);
    expect(getThumbnail(resultWith([]))).toBeNull();
  });

  it("keeps expanded-name XMP queries independent from presentation prefixes", () => {
    const properties = [
      { name: { namespaceUri: "urn:authoritative", localName: "name", prefix: "old" } },
      { name: { namespaceUri: "urn:other", localName: "name", prefix: "old" } },
    ] as unknown as XmpProperty[];
    const packet = { model: { properties } } as unknown as Parameters<typeof queryStructuredXmp>[0];
    expect(queryStructuredXmp(packet, { namespaceUri: "urn:authoritative", localName: "name" })).toHaveLength(1);
    expect(queryStructuredXmp(packet, { prefix: "old" })).toHaveLength(2);
  });

  it("exercises XML/RDF arrays, aliases, resources, qualifiers, lexical types, and limits", () => {
    const rdf = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
    const packet = `<x:xmpmeta xmlns:x="adobe:ns:meta/" xmlns:rdf="${rdf}" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/" xmlns:ex="urn:example:" xmlns:xml="http://www.w3.org/XML/1998/namespace"><rdf:RDF><rdf:Description rdf:about="subject" xml:lang="en" ex:flag="true" ex:count="7"><photoshop:Authors><rdf:Seq><rdf:li>Ada</rdf:li><rdf:li>Grace</rdf:li></rdf:Seq></photoshop:Authors><photoshop:Caption xml:lang="fr"><rdf:Alt><rdf:li xml:lang="fr">Bonjour</rdf:li><rdf:li xml:lang="x-default">Hello</rdf:li></rdf:Alt></photoshop:Caption><ex:number rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">42</ex:number><ex:decimal rdf:datatype="http://www.w3.org/2001/XMLSchema#decimal">1.50</ex:decimal><ex:boolean rdf:datatype="http://www.w3.org/2001/XMLSchema#boolean">true</ex:boolean><ex:double rdf:datatype="http://www.w3.org/2001/XMLSchema#double">2.5E1</ex:double><ex:uri rdf:resource="https://example.invalid/resource" ex:confidence="high"/><ex:blank rdf:nodeID="blank-1"/><ex:literal rdf:parseType="Literal"><b>raw &amp; XML</b></ex:literal><ex:typed rdf:parseType="Resource"><rdf:Description rdf:about="https://example.invalid/person"><rdf:type rdf:resource="urn:example:Person"/><ex:name ex:source="catalog">Ada</ex:name></rdf:Description></ex:typed></rdf:Description></rdf:RDF></x:xmpmeta>`;
    const parsed = parseStructuredXmpDetailed(packet);
    expect(parsed.value).not.toBeNull();
    expect(parsed.diagnostics).toEqual([]);
    const properties = parsed.value?.rdf?.properties ?? [];
    expect(properties.map((item) => item.name.localName)).toEqual(["flag", "count", "Authors", "Caption", "number", "decimal", "boolean", "double", "uri", "blank", "literal", "typed"]);
    expect(properties.find((item) => item.name.localName === "Authors")?.aliasOf?.localName).toBe("creator");
    expect(properties.find((item) => item.name.localName === "Authors")?.value).toMatchObject({ kind: "array", container: "Seq", items: [{ lexicalValue: "Ada" }, { lexicalValue: "Grace" }] });
    expect(properties.find((item) => item.name.localName === "Caption")?.value).toMatchObject({ kind: "array", container: "Alt", items: [{ language: "fr" }, { language: "x-default" }] });
    expect(properties.find((item) => item.name.localName === "number")?.value).toMatchObject({ value: 42, lexicalValue: "42" });
    expect(properties.find((item) => item.name.localName === "uri")?.value).toMatchObject({ kind: "resource", resourceUri: "https://example.invalid/resource", qualifiers: [{ name: { localName: "confidence" } }] });
    expect(properties.find((item) => item.name.localName === "blank")?.value).toMatchObject({ kind: "blank-node", nodeId: "blank-1" });
    expect(properties.find((item) => item.name.localName === "literal")?.value).toMatchObject({ kind: "literal", parseType: "Literal" });
    expect(properties.find((item) => item.name.localName === "typed")?.value).toMatchObject({ kind: "typed-resource", resourceUri: "https://example.invalid/person", typeName: { localName: "Person" }, properties: [{ name: { localName: "type" } }, { name: { localName: "name" }, qualifiers: [{ name: { localName: "source" } }] }] });
    expect(extendedXmpGuid(`<x:xmpmeta xmpNote:HasExtendedXMP="abcdefabcdefabcdefabcdefabcdefab"/>`)).toBe("ABCDEFABCDEFABCDEFABCDEFABCDEFAB");
    expect(extendedXmpGuid("<x:xmpmeta/>")) .toBeNull();
    expect(validateStructuredXmpPacket(parsed.value)).toBe(true);
    expect(validateStructuredXmpPacket(null)).toBe(false);
    expect(validateStructuredXmpPacket({ namespaces: { ex: "urn:example:" }, properties: { "ex:value": 1 } })).toBe(false);
    expect(parseStructuredXmp(packet)?.rdf?.descriptions).toHaveLength(1);
  });

  it("fails closed for XML hazards, malformed RDF, decoder adapters, byte limits, and merge policies", () => {
    const valid = `<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:ex="urn:example:"><rdf:Description rdf:about=""><ex:value>one</ex:value></rdf:Description></rdf:RDF>`;
    const validTwo = valid.replace("</rdf:Description>", "<ex:two>two</ex:two></rdf:Description>");
    const invalidPackets = [
      "text outside root",
      "<a><b></a>",
      "<a>",
      "<a a='1' a='2'/>",
      "<a><p:x/></a>",
      "<a xmlns:xml='urn:wrong'/>",
      "<a xmlns='http://www.w3.org/2000/xmlns/'/>",
      "<a>&unknown;</a>",
      "<!DOCTYPE a [<!ENTITY x 'bad'>]><a>&x;</a>",
      "<a><![CDATA[unterminated</a>",
      "<a><!-- unterminated</a>",
      "<a><?pi unterminated</a>",
    ];
    for (const packet of invalidPackets) {
      const outcome = parseStructuredXmpDetailed(packet);
      expect(outcome.value).toBeNull();
      expect(outcome.diagnostics.length).toBeGreaterThan(0);
      expect(outcome.diagnostics.every((item) => /^[A-Z_]+$/u.test(item.code))).toBe(true);
    }
    expect(parseStructuredXmpDetailed(valid, { maxInputBytes: 1 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed(valid, { maxElements: 1 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed(validTwo, { maxProperties: 1 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed(valid, { maxAttributes: 1 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed(valid, { maxNamespaces: 1 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed(valid, { maxOutputBytes: 1 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpDetailed(valid, { maxPackets: 0 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpBytes(Uint8Array.of(0xc3, 0x28))).toBeNull();
    expect(parseStructuredXmpBytesDetailed(Uint8Array.of(0xc3, 0x28)).diagnostics[0]?.code).toBe("MALFORMED_XML");
    expect(parseStructuredXmpBytesDetailed(new TextEncoder().encode(valid), { maxInputBytes: 1 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");

    const goodDecoder = { parse: () => ({ namespaces: { ex: "urn:example:" }, properties: { "ex:value": "adapter" } }) };
    expect(parseStructuredXmpWithDecoder(valid, goodDecoder)?.properties["ex:value"]).toBe("adapter");
    expect(parseStructuredXmpWithDecoderDetailed(valid, { parse: () => null }).diagnostics[0]?.code).toBe("INVALID_ADAPTER_OUTPUT");
    expect(parseStructuredXmpWithDecoderDetailed(valid, { parse: () => { throw new Error("decoder"); } }).diagnostics[0]?.code).toBe("INVALID_ADAPTER_OUTPUT");
    expect(parseStructuredXmpWithDecoderDetailed(valid, goodDecoder, { maxProperties: 0 }).diagnostics[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseStructuredXmpBytesWithDecoder(new TextEncoder().encode(valid), goodDecoder)?.properties["ex:value"]).toBe("adapter");
    expect(parseStructuredXmpBytesWithDecoderDetailed(Uint8Array.of(0xc3, 0x28), goodDecoder).diagnostics[0]?.code).toBe("MALFORMED_XML");

    const first = parseStructuredXmp(valid);
    const second = parseStructuredXmp(valid.replace(">one<", ">two<"));
    if (first === null || second === null) throw new Error("expected XMP fixtures");
    expect(mergeStructuredXmp([{ value: first, packetIndex: 0 }, { value: second, packetIndex: 1 }], "preserve-all").conflicts).toHaveLength(1);
    expect(mergeStructuredXmp([{ value: first }, { value: second }], "first").properties).toHaveLength(1);
    expect(mergeStructuredXmp([{ value: first }, { value: second }], "last").properties).toHaveLength(1);
    expect(parseStructuredXmpDocuments([valid, valid], { maxPackets: 1 }).documents).toHaveLength(2);
    expect(parseStructuredXmpDocuments([valid, valid], { mergePolicy: "first" }).merged.policy).toBe("first");

    const noBlocks = deriveXmpPacketProvenance([valid], []);
    expect(noBlocks[0]).toMatchObject({ id: "xmp:packet:0", source: "embedded", blockIds: [] });
    const blocks = [{ id: "xmp:direct", family: "XMP", status: "decoded", container: "XMP", offset: 10, length: 20 }, { id: "xmp:assembled:ABC", family: "XMP", status: "decoded", container: "Assembled Extended XMP", offset: 30, length: 5, relatedBlockIds: ["xmp:part"] }] as never;
    expect(deriveXmpPacketProvenance([valid, valid], blocks)).toMatchObject([{ source: "embedded", id: "xmp:direct" }, { source: "extended-embedded", extendedGuid: "ABC" }]);

    const chunk = Uint8Array.from([...new TextEncoder().encode("http://ns.adobe.com/xmp/extension/\0"), ...new TextEncoder().encode("0123456789ABCDEF0123456789ABCDEF"), 0, 0, 0, 3, 0, 0, 0, 0, 65, 66, 67]);
    const parsedChunk = parseExtendedXmpChunk(chunk);
    expect(parsedChunk).toMatchObject({ guid: "0123456789ABCDEF0123456789ABCDEF", fullLength: 3, offset: 0, data: Uint8Array.of(65, 66, 67) });
    expect(parseExtendedXmpChunk(Uint8Array.of(1, 2))).toBeNull();
    expect(parseExtendedXmpChunk(chunk.slice(0, -1))?.data).toEqual(Uint8Array.of(65, 66));
    const invalidChunk = chunk.slice();
    const identifierLength = new TextEncoder().encode("http://ns.adobe.com/xmp/extension/\0").length;
    new DataView(invalidChunk.buffer).setUint32(identifierLength + 36, 3, false);
    expect(parseExtendedXmpChunk(invalidChunk)).toBeNull();
    if (parsedChunk === null) throw new Error("extended XMP fixture unexpectedly failed to parse");
    expect(reassembleExtendedXmp([parsedChunk], 3)).toBe("ABC");
    expect(reassembleExtendedXmp([], 3)).toBeNull();
    expect(reassembleExtendedXmp([parsedChunk, { ...parsedChunk, offset: 2 }], 10)).toBeNull();
    expect(reassembleExtendedXmp([parsedChunk, { ...parsedChunk, fullLength: 4, offset: 3 }], 10)).toBeNull();
  });
});
