import { describe, expect, it, vi } from "vitest";
import { inspectIccProfile } from "../src/metadata/icc.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";
import { fromJsonSafe, queryIccTags, queryImageDetails, queryIptcSemantic, queryMetadata, queryStructuredXmp, toExifReaderCompatible, toExifrCompatible, toFamilyGroups, toFlatObject, toJsonSafe, toJsonSafeResult, toLosslessFamilyGroups } from "../src/adapters.js";
import { parseMetadata, parseStructuredXmp } from "../src/index.js";
import { createThumbnailObjectUrl } from "../src/browser-thumbnail.js";
import type { MetadataResult } from "../src/types.js";

function profile(entries: readonly { signature: string; offset: number; data: Uint8Array }[]): Uint8Array {
  const size = Math.max(132 + entries.length * 12, ...entries.map((entry) => entry.offset + entry.data.length));
  const bytes = new Uint8Array(size);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, size); bytes.set([0x61, 0x63, 0x73, 0x70], 36); view.setUint32(128, entries.length);
  entries.forEach((entry, index) => { const base = 132 + index * 12; bytes.set(Array.from(entry.signature, (item) => item.charCodeAt(0)), base); view.setUint32(base + 4, entry.offset); view.setUint32(base + 8, entry.data.length); bytes.set(entry.data, entry.offset); });
  return bytes;
}
function typed(type: string, payload: readonly number[]): Uint8Array { return Uint8Array.from(Array.from(type, (item) => item.charCodeAt(0)).concat([0, 0, 0, 0], payload)); }
function be32(value: number): number[] { return [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255]; }
function be16(value: number): number[] { return [(value >>> 8) & 255, value & 255]; }
function fixed(value: number): number[] { return be32(Math.round(value * 65536)); }

describe("S07-S09 public contracts", () => {
  it("decodes shared ICC text payloads and rejects partial overlaps", () => {
    const text = typed("text", [72, 105, 0]);
    const valid = inspectIccProfile([{ sequence: 1, total: 1, byteLength: profile([{ signature: "desc", offset: 160, data: text }]).length, data: profile([{ signature: "desc", offset: 160, data: text }]) }], DEFAULT_LIMITS);
    expect(valid.data?.decodedTags?.[0]).toMatchObject({ status: "decoded", value: { kind: "text", text: "Hi" } });
    const overlap = profile([{ signature: "desc", offset: 160, data: text }, { signature: "cprt", offset: 164, data: text }]);
    const invalid = inspectIccProfile([{ sequence: 1, total: 1, byteLength: overlap.length, data: overlap }], DEFAULT_LIMITS);
    expect(invalid.data?.tags?.some((tag) => tag.rangeStatus === "overlap")).toBe(true);
  });

  it("decodes the common ICC payload families with bounded typed output", () => {
    const mluc = typed("mluc", [...be32(1), ...be32(12), 0x65, 0x6e, 0x55, 0x53, ...be32(4), ...be32(28), 0, 72, 0, 105]);
    const xyz = typed("XYZ ", [...fixed(1), ...fixed(0.5), ...fixed(0)]);
    const curve = typed("curv", [...be32(2), ...be16(0), ...be16(65535)]);
    const para = typed("para", [...be16(0), 0, 0, ...fixed(1)]);
    const matrix = typed("sf32", [...fixed(1), ...fixed(0), ...fixed(0)]);
    const meas = typed("meas", [...be32(1), ...fixed(1), ...fixed(1), ...fixed(1), ...be32(0), ...be32(0), ...be32(2)]);
    const view = typed("view", [...fixed(1), ...fixed(1), ...fixed(1), ...fixed(0), ...fixed(0), ...fixed(0), ...be32(0)]);
    const clro = typed("clro", [...be32(2), 1, 2]);
    const clrt = typed("clrt", [...be32(1), ...Array.from({ length: 44 }, () => 0)]);
    const mft1Payload = new Uint8Array(554); mft1Payload[0] = 1; mft1Payload[1] = 1; mft1Payload[2] = 2;
    const mft1 = typed("mft1", Array.from(mft1Payload));
    const mABPayload = new Uint8Array(24); mABPayload[0] = 1; mABPayload[1] = 1;
    const mAB = typed("mAB ", Array.from(mABPayload));
    const payloads = [mluc, xyz, curve, para, matrix, meas, view, clro, clrt, mft1, mAB];
    const entries = payloads.map((data, index) => ({ signature: `t${index.toString().padStart(3, "0")}`, offset: 512 + payloads.slice(0, index).reduce((sum, item) => sum + (item.length + 3 & ~3), 0), data }));
    const bytes = profile(entries);
    const inspected = inspectIccProfile([{ sequence: 1, total: 1, byteLength: bytes.length, data: bytes }], DEFAULT_LIMITS);
    const decoded = inspected.data?.decodedTags ?? [];
    expect(decoded).toHaveLength(payloads.length);
    expect(decoded.map((item) => item.status)).toEqual(payloads.map(() => "decoded"));
    expect(decoded.map((item) => item.value?.kind)).toEqual(["mluc", "xyz", "curve", "parametric-curve", "matrix", "measurement", "viewing-conditions", "colorant-order", "colorant-table", "lut", "lut"]);
    expect(decoded[0]?.value).toMatchObject({ kind: "mluc", values: [{ language: "en", country: "US", text: "Hi" }] });
    expect(decoded[1]?.value).toMatchObject({ kind: "xyz", values: [{ x: 1, y: 0.5, z: 0 }] });
    expect(decoded[5]?.value).toMatchObject({ kind: "measurement", value: { observer: 1, geometry: 0, flare: 0, illuminant: 2 } });
  });

  it("diagnoses truncated ICC payloads and enforces element/output limits", () => {
    const malformed = typed("curv", [...be32(100), 0, 0]);
    const bytes = profile([{ signature: "rTRC", offset: 160, data: malformed }]);
    const inspected = inspectIccProfile([{ sequence: 1, total: 1, byteLength: bytes.length, data: bytes }], DEFAULT_LIMITS);
    expect(inspected.data?.decodedTags?.[0]).toMatchObject({ status: "malformed", value: null });
    expect(inspected.warnings.some((warning) => warning.code === "TRUNCATED_DATA")).toBe(true);
    const limited = inspectIccProfile([{ sequence: 1, total: 1, byteLength: bytes.length, data: bytes }], { ...DEFAULT_LIMITS, maxIccElements: 1, maxIccOutputBytes: 1 });
    expect(limited.data?.decodedTags?.[0]?.status).toMatch(/malformed|limited/u);
    expect(limited.warnings.length).toBeGreaterThan(0);

    const invalidText = profile([{ signature: "cprt", offset: 160, data: typed("text", [0xff]) }]);
    const invalidTextResult = inspectIccProfile([{ sequence: 1, total: 1, byteLength: invalidText.length, data: invalidText }], DEFAULT_LIMITS);
    expect(invalidTextResult.data?.decodedTags?.[0]).toMatchObject({ status: "malformed", value: null });

    const partialDesc = typed("desc", [...be32(3), 0x48, 0x69, 0, ...be32(0)]);
    const partialDescProfile = profile([{ signature: "desc", offset: 160, data: partialDesc }]);
    const partialDescResult = inspectIccProfile([{ sequence: 1, total: 1, byteLength: partialDescProfile.length, data: partialDescProfile }], DEFAULT_LIMITS);
    expect(partialDescResult.data?.decodedTags?.[0]).toMatchObject({ status: "malformed", value: null });

    const malformedMabPayload = new Uint8Array(24);
    malformedMabPayload[0] = 2;
    malformedMabPayload[1] = 1;
    new DataView(malformedMabPayload.buffer).setUint32(12, 20);
    const malformedMab = profile([{ signature: "A2B0", offset: 160, data: typed("mAB ", Array.from(malformedMabPayload)) }]);
    const malformedMabResult = inspectIccProfile([{ sequence: 1, total: 1, byteLength: malformedMab.length, data: malformedMab }], DEFAULT_LIMITS);
    expect(malformedMabResult.data?.decodedTags?.[0]).toMatchObject({ status: "malformed", value: null });
  });

  it("retains legacy desc Unicode/script forms and decodes every parametric curve function", () => {
    const descPayload = [...be32(3), 0x48, 0x69, 0, ...be32(0), ...be32(2), 0, 72, 0, 105, ...be16(0), 0, ...Array.from({ length: 67 }, () => 0)];
    const desc = typed("desc", descPayload);
    const curves = [0, 1, 2, 3, 4].map((functionType) => typed("para", [...be16(functionType), 0, 0, ...Array.from({ length: ([1, 3, 4, 5, 7][functionType] ?? 0) * 4 }, () => 0)]));
    const entries = [{ signature: "desc", offset: 256, data: desc }, ...curves.map((data, index) => ({ signature: `p${index}00`, offset: 512 + curves.slice(0, index).reduce((sum, item) => sum + item.length, 0), data }))];
    const bytes = profile(entries);
    const inspected = inspectIccProfile([{ sequence: 1, total: 1, byteLength: bytes.length, data: bytes }], DEFAULT_LIMITS);
    expect(inspected.data?.decodedTags?.[0]?.value).toMatchObject({ kind: "text", text: "Hi", asciiText: "Hi", unicodeText: "Hi", scriptCode: 0 });
    const decodedCurves = inspected.data?.decodedTags?.slice(1) ?? [];
    expect(decodedCurves).toHaveLength(curves.length);
    decodedCurves.forEach((item, index) => expect(item.value).toMatchObject({ kind: "parametric-curve", functionType: index }));
  });

  it("decodes an exact shared ICC payload once while preserving both tag identities", () => {
    const text = typed("text", [65, 0]);
    const bytes = profile([{ signature: "desc", offset: 160, data: text }, { signature: "cprt", offset: 160, data: text }]);
    const inspected = inspectIccProfile([{ sequence: 1, total: 1, byteLength: bytes.length, data: bytes }], DEFAULT_LIMITS);
    expect(inspected.data?.tags?.map((tag) => tag.rangeStatus)).toEqual(["shared", "shared"]);
    expect(inspected.data?.decodedTags?.map((tag) => tag.sharedWith)).toEqual([["cprt"], ["desc"]]);
  });

  it("validates extended ICC structures and reports hostile header values", () => {
    const mlucInvalidCode = typed("mluc", [...be32(1), ...be32(12), 0xff, 0x6e, 0x55, 0x53, ...be32(4), ...be32(28), 0, 72, 0, 105]);
    const mlucInvalidOffset = typed("mluc", [...be32(1), ...be32(12), 0x65, 0x6e, 0x55, 0x53, ...be32(4), ...be32(8), 0, 72, 0, 105]);
    const mft2Payload = new Uint8Array(54); mft2Payload[0] = 1; mft2Payload[1] = 1; mft2Payload[2] = 2; mft2Payload[41] = 1; mft2Payload[43] = 1;
    const mft2 = typed("mft2", Array.from(mft2Payload));
    const mft2InvalidPayload = new Uint8Array(mft2Payload); mft2InvalidPayload[41] = 0; mft2InvalidPayload[43] = 0;
    const mft2Invalid = typed("mft2", Array.from(mft2InvalidPayload));
    const mABPayload = new Uint8Array(48); mABPayload[0] = 1; mABPayload[1] = 1; new DataView(mABPayload.buffer).setUint32(16, 32); mABPayload[24] = 2; mABPayload[40] = 1;
    const mAB = typed("mAB ", Array.from(mABPayload));
    const badColorantPayload = [...be32(1), 0xff, ...Array.from({ length: 43 }, () => 0)];
    const curves = [typed("curv", [...be32(0)]), typed("curv", [...be32(1), ...be16(512)])];
    const paraInvalid = typed("para", [...be16(0), 0, 1, ...fixed(1)]);
    const entries = [mlucInvalidCode, mlucInvalidOffset, mft2, mft2Invalid, mAB, typed("clrt", badColorantPayload), ...curves, paraInvalid].map((data, index) => ({ signature: `v${index}00`, offset: 512 + index * 256, data }));
    const bytes = profile(entries);
    bytes[100] = 1;
    bytes[24 + 2] = 0;
    bytes[24 + 3] = 13;
    const inspected = inspectIccProfile([{ sequence: 1, total: 1, byteLength: bytes.length, data: bytes }], DEFAULT_LIMITS);
    const decoded = inspected.data?.decodedTags ?? [];
    expect(decoded[0]?.status).toBe("malformed");
    expect(decoded[1]?.status).toBe("malformed");
    expect(decoded[2]?.value).toMatchObject({ kind: "lut", value: { type: "mft2", inputChannels: 1, outputChannels: 1, inputEntries: 1, outputEntries: 1 } });
    expect(decoded[3]?.status).toBe("malformed");
    expect(decoded[4]?.value).toMatchObject({ kind: "lut", value: { type: "mAB ", clut: { gridPoints: [2], precisionBytes: 1, tableBytes: 2 } } });
    expect(decoded[5]?.status).toBe("malformed");
    expect(decoded[6]?.value).toMatchObject({ kind: "curve", form: "identity" });
    expect(decoded[7]?.value).toMatchObject({ kind: "curve", form: "gamma", gamma: 2 });
    expect(decoded[8]?.status).toBe("malformed");
    expect(inspected.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ message: "ICC profile header reserved bytes are non-zero." }),
      expect.objectContaining({ message: "ICC profile creation date is invalid." }),
    ]));
  });

  it("preserves duplicate fields by default and makes binary JSON safe", () => {
    const result = { format: "jpeg", mimeType: "image/jpeg", dimensions: null, fields: [
      { id: "A", ifd: "IFD0", tag: 1, name: "Name", raw: 1, value: 1, display: "1", description: "", type: "LONG", sensitivity: "none" },
      { id: "B", ifd: "IFD0", tag: 2, name: "Name", raw: 2, value: new Uint8Array([1, 2]), display: "2", description: "", type: "BYTE", sensitivity: "none" },
    ], exif: null, xmp: null, iptc: null, icc: null, jfif: null, pngText: [], blocks: [], coverage: { requested: "complete", wholeFile: "complete", reasons: [], unclassifiedBlockIds: [] }, completeness: { complete: true, scope: "full", reasons: [] }, warnings: [] } as unknown as MetadataResult;
    expect(toFlatObject(result).Name).toHaveLength(2);
    expect(toFlatObject(result, { collision: "first" }).Name).toBe(1);
    expect(toFlatObject(result, { collision: "last" }).Name).toEqual(new Uint8Array([1, 2]));
    expect(toExifrCompatible(result).Name).toEqual(new Uint8Array([1, 2]));
    expect(toExifReaderCompatible(result).IFD0?.Name).toHaveLength(2);
    expect(queryMetadata(result, { name: "Name", occurrence: 1 })[0]?.id).toBe("B");
    expect(queryMetadata(result, { occurrence: -1 })).toEqual([]);
    expect(queryMetadata(result, { id: "missing" })).toEqual([]);
    expect(toFamilyGroups(result).IFD0).toHaveLength(2);
    const encoded = toJsonSafe({ bytes: new Uint8Array([1, 2]), large: 9_007_199_254_740_993n, invalid: Number.NaN });
    expect(JSON.stringify(encoded)).toContain("$binary");
    expect(fromJsonSafe(encoded)).toEqual({ bytes: new Uint8Array([1, 2]), invalid: Number.NaN, large: 9_007_199_254_740_993n });
    const exact = toJsonSafe({ rational: { numerator: 1, denominator: 0 }, integer: { decimal: "18446744073709551615", signed: false } });
    expect(fromJsonSafe(exact)).toEqual({ rational: { numerator: 1, denominator: 0 }, integer: { decimal: "18446744073709551615", signed: false } });
    const invalidRational = toJsonSafe({ rational: { numerator: Number.NaN, denominator: 0 } });
    expect(JSON.stringify(invalidRational)).toContain("$number");
    expect(fromJsonSafe(invalidRational)).toEqual({ rational: { numerator: Number.NaN, denominator: 0 } });
    expect(fromJsonSafe(toJsonSafe([undefined, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, "x", true, null]))).toEqual([undefined, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, "x", true, null]);
    expect(fromJsonSafe({ $binary: "not base64", encoding: "base64" })).toBeNull();
    const cyclic: { self?: unknown } = {}; cyclic.self = cyclic;
    expect(toJsonSafe(cyclic)).toEqual({ self: { $circular: true } });
    const xmp = parseStructuredXmp('<x:xmpmeta xmlns:x="adobe:ns:meta/" xmlns:dc="http://purl.org/dc/elements/1.1/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description><dc:title>one</dc:title><dc:title>two</dc:title></rdf:Description></rdf:RDF></x:xmpmeta>');
    expect(xmp?.rdf).toBeDefined();
    expect(queryStructuredXmp(xmp as NonNullable<typeof xmp>, { namespaceUri: "http://purl.org/dc/elements/1.1/", localName: "title" })).toHaveLength(2);
    expect(queryStructuredXmp(xmp as NonNullable<typeof xmp>, { localName: "title", occurrence: 1 })).toHaveLength(1);
    expect(queryStructuredXmp(xmp as NonNullable<typeof xmp>, { localName: "title", occurrence: -1 })).toEqual([]);
    expect(queryStructuredXmp(xmp as NonNullable<typeof xmp>, { prefix: "wrong" })).toEqual([]);
  });

  it("derives validated JPEG and PNG header details without pixel decoding", async () => {
    const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xc2, 0, 11, 8, 0, 2, 0, 3, 1, 1, 0x11, 0, 0xff, 0xd9]);
    const jpegResult = await parseMetadata(jpeg);
    expect(jpegResult.details).toMatchObject({ bitDepth: [{ value: 8 }], progressive: [{ value: true }], alpha: [{ value: "absent" }] });
    const png = new Uint8Array(45); png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52], 0); new DataView(png.buffer).setUint32(16, 1); new DataView(png.buffer).setUint32(20, 1); png.set([8, 6, 0, 0, 1], 24); png.set([0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44], 33);
    const pngResult = await parseMetadata(png);
    expect(pngResult.details).toMatchObject({ bitDepth: [{ value: [8, 8, 8, 8] }], colorModel: [{ value: "RGB" }], alpha: [{ value: "present" }], interlaced: [{ value: true }] });
    const gif = Uint8Array.from([
      ...new TextEncoder().encode("GIF89a"), 1, 0, 1, 0, 0x80, 0, 0, 0, 0, 0, 255, 255, 255,
      0x21, 0xf9, 4, 1, 0, 0, 0, 0,
      0x21, 0xff, 11, ...new TextEncoder().encode("NETSCAPE2.0"), 3, 1, 0, 0, 0,
      0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0x40, 2, 1, 0, 0, 0x3b,
    ]);
    const gifResult = await parseMetadata(gif);
    expect(gifResult.details).toMatchObject({ alpha: [{ value: "present" }], interlaced: [{ value: true }], animation: [{ value: { frames: 1, loopCount: 0 } }] });
  });

  it("owns an explicit idempotent browser thumbnail URL lifecycle", () => {
    const result = { exif: { fields: [], thumbnail: { data: Uint8Array.of(0xff, 0xd8, 0xff), mimeType: "image/jpeg" } } } as unknown as MetadataResult;
    const handle = createThumbnailObjectUrl(result);
    expect(handle?.url).toMatch(/^blob:/u);
    handle?.revoke();
    handle?.revoke();
    expect(createThumbnailObjectUrl({ exif: { fields: [], thumbnail: null } } as unknown as MetadataResult)).toBeNull();
  });

  it("queries every canonical family deterministically and applies adapter budgets", () => {
    const result = {
      format: "jpeg", mimeType: "image/jpeg", dimensions: { width: 4, height: 3 },
      fields: [
        { id: "one", ifd: "SubIFD:0", tag: 1, name: "Width", raw: 4, value: 4, display: "4", description: "", type: "LONG", sensitivity: "none", directoryId: "sub:0", source: { blockId: "tiff:0", directoryId: "sub:0", entryOffset: 40, entryLength: 12, valueOffset: null, valueLength: null } },
        { id: "two", ifd: "IFD0", tag: 2, name: "Height", raw: 3, value: 3, display: "3", description: "", type: "LONG", sensitivity: "none" },
      ],
      details: {
        storedDimensions: [{ value: { width: 4, height: 3 }, source: "jpeg:sof", offset: 2, blockId: "jpeg:0", validation: "valid" }],
        displayDimensions: [], bitDepth: [], components: [], colorModel: [], alpha: [], progressive: [], interlaced: [], animation: [], primaryImageId: null,
        primaryImageCandidates: [], thumbnails: [], previews: [], auxiliaryImages: [], relationshipCandidates: [], orientation: [], conflicts: [],
        support: { storedDimensions: "supported", displayDimensions: "supported", bitDepth: "supported", components: "supported", colorModel: "supported", alpha: "supported", progressive: "supported", interlaced: "supported", animation: "supported", relationships: "supported" }, formatSpecific: {},
      },
      icc: { decodedTags: [{ signature: "desc", typeSignature: "text", offset: 160, byteLength: 12, status: "decoded", value: { kind: "text", text: "camera", encoding: "ascii" }, sharedWith: [] }] },
      iptcSemantic: { fields: [{ id: "caption", name: "Caption", value: "hello", candidates: [], conflicts: [], description: "", sourceStandard: "IPTC", sourceEdition: "2025.1" }] },
      exif: null, xmp: null, iptc: null, jfif: null, pngText: [], blocks: [], coverage: { requested: "complete", wholeFile: "complete", reasons: [], unclassifiedBlockIds: [] }, completeness: { complete: true, scope: "full", reasons: [] }, warnings: [],
    } as unknown as MetadataResult;
    expect(queryMetadata(result, { directoryId: "sub:0", sourceOffset: 40 })[0]?.id).toBe("one");
    expect(queryImageDetails(result, { property: "storedDimensions", blockId: "jpeg:0" })).toHaveLength(1);
    expect(queryIccTags(result, { signature: "desc" })).toHaveLength(1);
    expect(queryIptcSemantic(result, { id: "caption" })).toHaveLength(1);
    expect(toLosslessFamilyGroups(result).fields["SubIFD:0"]).toHaveLength(1);
    expect(toFlatObject(result, { maxItems: 1 }).$adapter).toEqual({ truncated: true, omittedFields: 1 });
    expect(toFlatObject(result, { includeStructured: true, includeDiagnostics: true }).$canonical).toBeDefined();
    expect(toFlatObject(result, { includeStructured: true, includeDiagnostics: true }).$warnings).toEqual([]);
    expect(queryMetadata(result, { maxItems: 1, occurrence: 3 })).toEqual([]);
  });

  it("serializes a complete result without native JSON failures and keeps repeated calls stable", () => {
    const result = {
      format: "tiff", mimeType: "image/tiff", dimensions: null, fields: [], exif: null, xmp: null, iptc: null, icc: null, jfif: null, pngText: [], blocks: [], coverage: { requested: "complete", wholeFile: "complete", reasons: [], unclassifiedBlockIds: [] }, completeness: { complete: true, scope: "full", reasons: [] }, warnings: [],
      details: { storedDimensions: [], displayDimensions: [], bitDepth: [], components: [], colorModel: [], alpha: [], progressive: [], interlaced: [], animation: [], primaryImageId: null, thumbnails: [], previews: [], auxiliaryImages: [], orientation: [], conflicts: [], support: {}, formatSpecific: {} },
    } as unknown as MetadataResult;
    const first = toJsonSafeResult(result);
    const second = toJsonSafeResult(result);
    expect(first).toEqual(second);
    expect(() => JSON.stringify(first)).not.toThrow();
    expect(JSON.stringify(toJsonSafe({ exact: { numerator: 1, denominator: 0 }, bytes: new Uint8Array([1, 2]), unsafe: 9_007_199_254_740_993n, nonFinite: Number.POSITIVE_INFINITY }))).toContain("$rational");
    expect(toJsonSafe("long", { limits: { maxAdapterOutputBytes: 1 } })).toEqual({ $truncated: "bytes" });
    expect(toJsonSafe({ nested: { value: "x" } }, { maxDepth: 1 })).toMatchObject({ nested: { value: { $truncated: "depth" } } });
    expect(toJsonSafe(new ArrayBuffer(2))).toMatchObject({ $binary: "AAA=" });
    expect(toJsonSafe(new DataView(new Uint8Array([4, 5]).buffer))).toMatchObject({ $binary: "BAU=" });
  });

  it("honours explicit migration loss policies", () => {
    const result = { fields: [
      { id: "a", ifd: "IFD0", tag: 1, name: "Make", raw: "a", value: "a", display: "a", description: "", type: "ASCII", sensitivity: "none" },
      { id: "b", ifd: "IFD0", tag: 1, name: "Make", raw: "b", value: "b", display: "b", description: "", type: "ASCII", sensitivity: "none" },
    ] } as unknown as MetadataResult;
    expect(toExifrCompatible(result, { collision: "first" }).Make).toBe("a");
    expect(toExifReaderCompatible(result, { duplicate: "first" }).IFD0?.Make).toMatchObject({ value: "a" });
    expect(toExifReaderCompatible(result, { duplicate: "last" }).IFD0?.Make).toMatchObject({ value: "b" });
  });

  it("revokes browser object URLs exactly once and fails closed on host errors", () => {
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:s09");
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const result = { exif: { fields: [], thumbnail: { data: Uint8Array.of(1, 2), mimeType: "image/png" } } } as unknown as MetadataResult;
    const handle = createThumbnailObjectUrl(result);
    expect(handle?.url).toBe("blob:s09");
    expect(handle?.mimeType).toBe("image/png");
    handle?.revoke(); handle?.revoke();
    expect(revoke).toHaveBeenCalledTimes(1);
    create.mockImplementation(() => { throw new Error("host failure"); });
    expect(createThumbnailObjectUrl(result)).toBeNull();
    create.mockRestore(); revoke.mockRestore();
  });
});
