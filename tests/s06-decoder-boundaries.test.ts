import { describe, expect, it } from "vitest";

import { resolveLimits } from "../src/security/limits.js";
import { inspectIccProfile, parseIccChunk, summarizeIcc } from "../src/metadata/icc.js";
import { inspectIptc, parseIptcMetadata } from "../src/metadata/iptc.js";
import { inspectPhotoshopResourceSpans, parsePhotoshopResources } from "../src/metadata/photoshop.js";

const encoder = new TextEncoder();
const limits = resolveLimits({ maxMetadataBytes: 2 * 1024 * 1024, maxValueBytes: 2 * 1024 * 1024, maxStringBytes: 64 * 1024, maxIccElements: 1024, maxIccDecodedTags: 128, maxIccOutputBytes: 2 * 1024 * 1024, maxIfdEntries: 1024, maxIptcDatasets: 1024, maxWarnings: 128 });

function u16(value: number): Uint8Array {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, false);
  return bytes;
}

function u32(value: number): Uint8Array {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value >>> 0, false);
  return bytes;
}

function fixed(value: number): Uint8Array {
  return u32(value < 0 ? 0x100000000 + Math.round(value * 65536) : Math.round(value * 65536));
}

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}

function iccTag(type: string, body: Uint8Array): Uint8Array { return concat(encoder.encode(type), new Uint8Array(4), body); }

function iccProfile(entries: readonly { readonly signature: string; readonly payload: Uint8Array }[]): Uint8Array {
  let offset = 132 + entries.length * 12;
  const locations: Array<{ readonly signature: string; readonly offset: number; readonly length: number; readonly payload: Uint8Array }> = [];
  for (const entry of entries) {
    offset = (offset + 3) & ~3;
    locations.push({ signature: entry.signature, offset, length: entry.payload.length, payload: entry.payload });
    offset += entry.payload.length;
  }
  const profile = new Uint8Array(offset);
  profile.set(u32(offset), 0);
  profile.set(encoder.encode("acsp"), 36);
  profile.set(u16(2024), 24); profile.set(u16(2), 26); profile.set(u16(29), 28); profile.set(u16(23), 30); profile.set(u16(59), 32); profile.set(u16(59), 34);
  profile.set(u32(0), 64);
  profile.set(u32(entries.length), 128);
  for (const [index, entry] of locations.entries()) {
    const at = 132 + index * 12;
    profile.set(encoder.encode(entry.signature), at);
    profile.set(u32(entry.offset), at + 4);
    profile.set(u32(entry.length), at + 8);
    profile.set(entry.payload, entry.offset);
  }
  return profile;
}

function mlucBody(): Uint8Array {
  return concat(u32(1), u32(12), encoder.encode("enUS"), u32(4), u32(28), Uint8Array.of(0, 72, 0, 105));
}

function descBody(): Uint8Array {
  return concat(u32(3), Uint8Array.of(104, 105, 0), u32(0), u32(0));
}

function curvBody(count: number): Uint8Array {
  return count === 0 ? u32(0) : count === 1 ? concat(u32(1), u16(512)) : concat(u32(count), ...Array.from({ length: count }, (_, index) => u16(index * 100)));
}

function paraBody(functionType: number): Uint8Array {
  const count = [1, 3, 4, 5, 7][functionType] ?? 0;
  return concat(u16(functionType), u16(0), ...Array.from({ length: count }, (_, index) => fixed(index + 1)));
}

function makeLut(type: "mft1" | "mft2"): Uint8Array {
  if (type === "mft1") {
    const body = new Uint8Array(554);
    body.set([1, 1, 2], 0);
    return iccTag(type, body);
  }
  const body = new Uint8Array(56);
  body.set([1, 1, 2], 0);
  new DataView(body.buffer).setUint16(40, 2, false);
  new DataView(body.buffer).setUint16(42, 2, false);
  return iccTag(type, body);
}

describe("S06 independent decoder boundaries", () => {
  it("decodes every supported ICC tag family and records shared, malformed, and limited results", () => {
    const entries = [
      { signature: "desc", payload: iccTag("desc", descBody()) },
      { signature: "cprt", payload: iccTag("text", encoder.encode("Copyright\0")) },
      { signature: "mluc", payload: iccTag("mluc", mlucBody()) },
      { signature: "rXYZ", payload: iccTag("XYZ ", concat(fixed(0.9642), fixed(1), fixed(0.8249))) },
      { signature: "rTRC", payload: iccTag("curv", curvBody(0)) },
      { signature: "gTRC", payload: iccTag("curv", curvBody(1)) },
      { signature: "bTRC", payload: iccTag("curv", curvBody(3)) },
      { signature: "para", payload: iccTag("para", paraBody(1)) },
      { signature: "sf32", payload: iccTag("sf32", concat(fixed(1), fixed(-1))) },
      { signature: "tech", payload: iccTag("sig ", encoder.encode("abcd")) },
      { signature: "meas", payload: iccTag("meas", new Uint8Array(28)) },
      { signature: "view", payload: iccTag("view", new Uint8Array(28)) },
      { signature: "clro", payload: iccTag("clro", concat(u32(2), Uint8Array.of(0, 1))) },
      { signature: "clrt", payload: iccTag("clrt", concat(u32(1), new Uint8Array(44))) },
      { signature: "mft1", payload: makeLut("mft1") },
      { signature: "mft2", payload: makeLut("mft2") },
      { signature: "mAB ", payload: iccTag("mAB ", concat(Uint8Array.of(1, 1), new Uint8Array(22))) },
      { signature: "mBA ", payload: iccTag("mBA ", concat(Uint8Array.of(1, 1), new Uint8Array(22))) },
      { signature: "zzzz", payload: iccTag("zzzz", Uint8Array.of(1, 2, 3)) },
    ];
    const profile = iccProfile(entries);
    const chunk = concat(encoder.encode("ICC_PROFILE\0"), Uint8Array.of(1, 1), profile);
    const parsedChunk = parseIccChunk(chunk);
    expect(parsedChunk).toMatchObject({ sequence: 1, total: 1, byteLength: profile.length });
    if (parsedChunk === null) throw new Error("ICC fixture unexpectedly failed to parse");
    expect(parseIccChunk(Uint8Array.of(1, 2))).toBeNull();
    expect(parseIccChunk(concat(encoder.encode("ICC_PROFILE\0"), Uint8Array.of(0, 1)))).toBeNull();
    expect(summarizeIcc([])).toBeNull();
    expect(summarizeIcc([parsedChunk])).toMatchObject({ complete: true, chunks: 1 });
    expect(summarizeIcc([{ ...parsedChunk, total: 2 }])).toMatchObject({ complete: false });
    const inspected = inspectIccProfile([parsedChunk], limits);
    expect(inspected.data?.complete).toBe(true);
    expect(inspected.fields.some((item) => item.name === "ProfileDate")).toBe(true);
    expect(inspected.data?.decodedTags?.some((item) => item.status === "decoded" && item.typeSignature === "desc")).toBe(true);
    expect(inspected.data?.decodedTags?.some((item) => item.typeSignature === "mluc")).toBe(true);
    expect(inspected.data?.decodedTags?.some((item) => item.typeSignature === "mft1" || item.typeSignature === "mft2")).toBe(true);
    expect(inspected.data?.decodedTags?.some((item) => item.typeSignature === "mAB " || item.typeSignature === "mBA ")).toBe(true);

    const shared = iccProfile([
      { signature: "rTRC", payload: iccTag("curv", curvBody(0)) },
      { signature: "gTRC", payload: iccTag("curv", curvBody(0)) },
    ]);
    const sharedChunk = parseIccChunk(concat(encoder.encode("ICC_PROFILE\0"), Uint8Array.of(1, 1), shared));
    if (sharedChunk === null) throw new Error("shared ICC fixture unexpectedly failed to parse");
    expect(inspectIccProfile([sharedChunk], limits).data?.tags).toHaveLength(2);
    const limited = inspectIccProfile([parsedChunk], resolveLimits({ maxMetadataBytes: 1 }));
    expect(limited.warnings[0]?.code).toBe("LIMIT_EXCEEDED");
    const malformed = profile.slice();
    malformed[36] = 0;
    const malformedChunk = parseIccChunk(concat(encoder.encode("ICC_PROFILE\0"), Uint8Array.of(1, 1), malformed));
    if (malformedChunk === null) throw new Error("malformed ICC fixture unexpectedly failed to parse");
    expect(inspectIccProfile([malformedChunk], limits).warnings.some((warning) => warning.code === "INVALID_VALUE")).toBe(true);
  });

  it("validates IPTC lengths, repetition, encodings, calendar dates, times, codes, and raw retention", () => {
    const iim = (...fields: readonly [number, number, Uint8Array][]): Uint8Array => concat(...fields.map(([record, dataset, value]) => concat(Uint8Array.of(0x1c, record, dataset, value.length >>> 8, value.length & 0xff), value)));
    const bytes = iim(
      [1, 0x5a, Uint8Array.of(0x1b, 0x25, 0x47)],
      [2, 0x0a, encoder.encode("4")],
      [2, 0x19, encoder.encode("one")],
      [2, 0x19, encoder.encode("two")],
      [2, 0x37, encoder.encode("20240229")],
      [2, 0x3c, encoder.encode("235959+1400")],
      [2, 0x5f, encoder.encode("GBR")],
      [2, 0x87, encoder.encode("en-GB")],
      [2, 0x78, encoder.encode("café")],
    );
    const parsed = parseIptcMetadata(bytes, limits);
    expect(parsed.malformed).toBe(false);
    expect(parsed.fields.find((item) => item.tag === 0x020a)?.value).toBe(4);
    expect(parsed.fields.find((item) => item.tag === 0x0237)?.value).toBe("20240229");
    expect(parsed.fields.filter((item) => item.tag === 0x0219)).toHaveLength(2);
    expect(parsed.fields.find((item) => item.tag === 0x0278)?.value).toBe("café");
    expect(parsed.fields.every((item) => {
      const source = item.source;
      return source !== undefined && Number.isInteger(source.entryOffset) && Number.isInteger(source.valueOffset);
    })).toBe(true);

    const invalid = iim(
      [2, 0x37, encoder.encode("20230229")],
      [2, 0x3c, encoder.encode("246100+1401")],
      [2, 0x5f, encoder.encode("GB")],
      [2, 0x87, encoder.encode("english_uk")],
      [2, 0x0a, encoder.encode("9")],
      [2, 0x78, Uint8Array.of(0xc3, 0x28)],
    );
    const invalidParsed = parseIptcMetadata(invalid, limits);
    expect(invalidParsed.warnings.some((warning) => warning.code === "INVALID_DATE")).toBe(true);
    expect(invalidParsed.warnings.filter((warning) => warning.code === "INVALID_VALUE").length).toBeGreaterThan(0);
    expect(invalidParsed.fields.filter((item) => item.type === "UNDEFINED").length).toBeGreaterThan(0);
    expect(invalidParsed.fields.find((item) => item.tag === 0x0237)?.raw).toEqual(encoder.encode("20230229"));

    const extended = concat(Uint8Array.of(0x1c, 2, 0x78, 0x80, 0x01, 0x03), Uint8Array.of(65, 66, 67));
    expect(parseIptcMetadata(extended, limits).fields[0]?.value).toBe("ABC");
    expect(parseIptcMetadata(Uint8Array.of(0x1c, 2, 0x78), limits).malformed).toBe(true);
    expect(parseIptcMetadata(Uint8Array.of(0x1c, 2, 0x78, 0x80, 0x05), limits).malformed).toBe(true);
    expect(parseIptcMetadata(iim([2, 0x78, new Uint8Array(100)]), resolveLimits({ maxMetadataBytes: 10 })).warnings[0]?.code).toBe("LIMIT_EXCEEDED");
    expect(parseIptcMetadata(Uint8Array.of(1, 2, 3), limits).data).toBeNull();
    expect(inspectIptc(Uint8Array.of(1, 2, 3))).toMatchObject({ data: null, malformed: false });
  });

  it("keeps Photoshop resource boundaries and padding fail-closed", () => {
    const resource = (id: number, data: Uint8Array, name = ""): Uint8Array => {
      const nameBytes = encoder.encode(name);
      const paddedName = (1 + nameBytes.length + 1) & ~1;
      const result = new Uint8Array(4 + 2 + paddedName + 4 + data.length + (data.length & 1));
      result.set(encoder.encode("8BIM"), 0); result.set(u16(id), 4); result[6] = nameBytes.length; result.set(nameBytes, 7);
      const sizeOffset = 6 + paddedName;
      result.set(u32(data.length), sizeOffset); result.set(data, sizeOffset + 4);
      return result;
    };
    const payload = concat(encoder.encode("Photoshop 3.0\0"), resource(0x0404, Uint8Array.of(0x1c, 2, 5, 0, 1, 65), "IPTC"), resource(0x0406, Uint8Array.of(1, 2, 3), "other"));
    expect(parsePhotoshopResources(payload, limits, { container: "app13", blockId: "app13:0", sourceOffset: 0, sourceLength: payload.length })?.resources).toHaveLength(2);
    expect(inspectPhotoshopResourceSpans(payload, "app13", limits)?.complete).toBe(true);
    expect(inspectIptc(payload)).toMatchObject({ data: { byteLength: 6 }, malformed: false });
    expect(parsePhotoshopResources(payload.slice(0, -1), limits, { container: "app13", blockId: "app13:0", sourceOffset: 0, sourceLength: payload.length - 1 })?.complete).toBe(false);
    expect(inspectPhotoshopResourceSpans(concat(encoder.encode("Photoshop 3.0\0"), Uint8Array.of(1, 2, 3)), "app13", limits)?.complete).toBe(false);
    expect(parsePhotoshopResources(Uint8Array.of(1, 2, 3), limits, { container: "app13", blockId: "app13:0", sourceOffset: 0, sourceLength: 3 })).toBeNull();
  });
});
