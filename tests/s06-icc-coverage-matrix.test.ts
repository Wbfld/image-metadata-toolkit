import { describe, expect, it } from "vitest";

import { inspectIccProfile, parseIccChunk, summarizeIcc, type IccChunk } from "../src/metadata/icc.js";
import { resolveLimits } from "../src/security/limits.js";

interface IccTagFixture {
  readonly signature: string;
  readonly payload: Uint8Array;
}

const encoder = new TextEncoder();

function ascii(value: string): Uint8Array {
  return Uint8Array.from(value, (character) => character.charCodeAt(0));
}

function signature(value: string): Uint8Array {
  const output = new Uint8Array(4);
  output.set(ascii(value.slice(0, 4)));
  return output;
}

function bytesForType(type: string, payload: Uint8Array): Uint8Array {
  const output = new Uint8Array(8 + payload.length);
  output.set(signature(type), 0);
  output.set(payload, 8);
  return output;
}

function u16(value: number): Uint8Array {
  return Uint8Array.of((value >>> 8) & 0xff, value & 0xff);
}

function u32(value: number): Uint8Array {
  return Uint8Array.of((value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);
}

function s15(value: number): Uint8Array {
  const encoded = Math.round(value * 65536);
  return u32(encoded >>> 0);
}

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function profile(tags: readonly IccTagFixture[], options: { readonly declaredSize?: number; readonly signature?: string; readonly reserved?: boolean; readonly renderingIntent?: number; readonly date?: readonly number[] } = {}): IccChunk {
  const tagTableEnd = 132 + tags.length * 12;
  let cursor = (tagTableEnd + 3) & ~3;
  const placements: Array<{ readonly tag: IccTagFixture; readonly offset: number }> = [];
  for (const tag of tags) {
    cursor = (cursor + 3) & ~3;
    placements.push({ tag, offset: cursor });
    cursor += tag.payload.length;
  }
  const bytes = new Uint8Array(cursor);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, options.declaredSize ?? bytes.length, false);
  view.setUint32(8, 0x04300000, false);
  bytes.set(signature("scnr"), 12);
  bytes.set(signature("RGB "), 16);
  bytes.set(signature("XYZ "), 20);
  const date = options.date ?? [2024, 2, 29, 12, 34, 56];
  date.forEach((value, index) => view.setUint16(24 + index * 2, value, false));
  bytes.set(signature(options.signature ?? "acsp"), 36);
  view.setUint32(64, options.renderingIntent ?? 1, false);
  if (options.reserved) bytes.fill(0x7f, 100, 128);
  view.setUint32(128, tags.length, false);
  placements.forEach(({ tag, offset }, index) => {
    const entry = 132 + index * 12;
    bytes.set(signature(tag.signature), entry);
    view.setUint32(entry + 4, offset, false);
    view.setUint32(entry + 8, tag.payload.length, false);
    bytes.set(tag.payload, offset);
  });
  return { sequence: 1, total: 1, byteLength: bytes.length, data: bytes };
}

function standardPayloads(): readonly IccTagFixture[] {
  const unicode = new Uint8Array([0, 0x44, 0, 0x65, 0, 0x73, 0, 0x63]);
  const desc = concat(u32(5), ascii("Desc\0"), u32(0), u32(1), unicode, new Uint8Array(70));
  const mlucText = new Uint8Array([0, 0x4f, 0, 0x4b]);
  const mluc = concat(u32(1), u32(12), ascii("enUS"), u32(4), u32(28), mlucText);
  const xyz = concat(s15(0.9642), s15(1), s15(0.8249));
  const sampledCurve = concat(u32(3), u16(0), u16(32768), u16(65535));
  const para = concat(u16(0), u16(0), s15(1));
  const matrix = concat(s15(1), s15(0), s15(0));
  const measurement = concat(u32(1), s15(0.9642), s15(1), s15(0.8249), u32(0), u32(0x00010000), u32(1));
  const viewing = concat(s15(0.9642), s15(1), s15(0.8249), s15(0.5), s15(0.5), s15(0.5), u32(1));
  const colorantTable = concat(u32(1), ascii("white\0"), new Uint8Array(26), s15(1), s15(1), s15(1));
  const mft1Table = new Uint8Array(48 + 514);
  mft1Table[0] = 1;
  mft1Table[1] = 1;
  mft1Table[2] = 2;
  const mft2Table = new Uint8Array(60);
  mft2Table[0] = 1;
  mft2Table[1] = 1;
  mft2Table[2] = 2;
  new DataView(mft2Table.buffer).setUint16(48, 1, false);
  new DataView(mft2Table.buffer).setUint16(50, 1, false);
  const lut = new Uint8Array(32);
  lut[0] = 1;
  lut[1] = 1;
  lut[10] = 0;
  lut[11] = 0;
  return [
    { signature: "desc", payload: bytesForType("desc", desc) },
    { signature: "cprt", payload: bytesForType("text", ascii("Copyright\0")) },
    { signature: "wtpt", payload: bytesForType("XYZ ", xyz) },
    { signature: "rXYZ", payload: bytesForType("XYZ ", xyz) },
    { signature: "gXYZ", payload: bytesForType("XYZ ", xyz) },
    { signature: "bXYZ", payload: bytesForType("XYZ ", xyz) },
    { signature: "rTRC", payload: bytesForType("curv", u32(0)) },
    { signature: "gTRC", payload: bytesForType("curv", concat(u32(1), u16(512))) },
    { signature: "bTRC", payload: bytesForType("curv", sampledCurve) },
    { signature: "kTRC", payload: bytesForType("para", para) },
    { signature: "tech", payload: bytesForType("sig ", signature("CRT ")) },
    { signature: "chad", payload: bytesForType("sf32", matrix) },
    { signature: "ncl2", payload: bytesForType("mluc", mluc) },
    { signature: "meas", payload: bytesForType("meas", measurement) },
    { signature: "view", payload: bytesForType("view", viewing) },
    { signature: "clro", payload: bytesForType("clro", concat(u32(1), Uint8Array.of(2))) },
    { signature: "clrt", payload: bytesForType("clrt", colorantTable) },
    { signature: "mft1", payload: bytesForType("mft1", mft1Table.subarray(0)) },
    { signature: "mft2", payload: bytesForType("mft2", mft2Table.subarray(0)) },
    { signature: "A2B0", payload: bytesForType("mAB ", lut) },
    { signature: "B2A0", payload: bytesForType("mBA ", lut) },
    { signature: "zzzz", payload: bytesForType("zzzz", Uint8Array.of(1, 2, 3)) },
  ];
}

function inspected(chunk: IccChunk, overrides: Parameters<typeof resolveLimits>[0] = {}): ReturnType<typeof inspectIccProfile> {
  return inspectIccProfile([chunk], resolveLimits({ maxMetadataBytes: 2 * 1024 * 1024, maxValueBytes: 2 * 1024 * 1024, maxStringBytes: 16 * 1024, maxIccElements: 256, maxIccDecodedTags: 128, maxIccOutputBytes: 2 * 1024 * 1024, maxWarnings: 128, ...overrides }));
}

describe("S06 independent ICC semantic decoder coverage", () => {
  it("decodes the supported ICC tag families and exposes the header semantics", () => {
    const result = inspected(profile(standardPayloads()));
    expect(result.data?.complete).toBe(true);
    expect(result.data?.decodedTags?.filter((tag) => tag.status === "decoded").length).toBeGreaterThanOrEqual(18);
    expect(result.fields.some((field) => field.name === "ProfileVersion")).toBe(true);
    expect(result.fields.some((field) => field.name === "ProfileDate")).toBe(true);
    expect(result.fields.some((field) => field.name === "ProfileDescription")).toBe(true);
    expect(result.warnings.filter(({ severity }) => severity === "error")).toEqual([]);
  });

  it("retains stable diagnostics for malformed, overlapping, shared, and limited profiles", () => {
    const good = standardPayloads();
    const malformed = good.map((tag, index) => index === 0 ? { ...tag, payload: tag.payload.subarray(0, 12) } : tag);
    const malformedResult = inspected(profile(malformed, { signature: "bad!", reserved: true, renderingIntent: 0x10000, date: [2023, 2, 29, 24, 60, 60] }));
    expect(malformedResult.warnings.length).toBeGreaterThan(0);
    expect(malformedResult.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);

    const shared = profile([
      { signature: "rTRC", payload: bytesForType("curv", u32(0)) },
      { signature: "gTRC", payload: bytesForType("curv", u32(0)) },
    ]);
    const sharedBytes = shared.data?.slice() ?? new Uint8Array();
    if (sharedBytes.length >= 156) {
      const view = new DataView(sharedBytes.buffer);
      view.setUint32(148, view.getUint32(136, false), false);
      view.setUint32(152, view.getUint32(140, false), false);
    }
    const sharedResult = inspected({ ...shared, data: sharedBytes, byteLength: sharedBytes.length });
    expect(sharedResult.data?.tags?.some((tag) => tag.rangeStatus === "shared")).toBe(true);

    const limited = inspected(profile(standardPayloads()), { maxIccDecodedTags: 2, maxIccElements: 1, maxIccOutputBytes: 32 });
    expect(limited.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
    expect(limited.data?.decodedTags).toBeInstanceOf(Array);
  });

  it("rejects incomplete chunks and preserves raw profile input on invalid boundaries", () => {
    const chunk = profile([{ signature: "desc", payload: bytesForType("text", encoder.encode("x")) }]);
    expect(inspectIccProfile([], resolveLimits()).data).toBeNull();
    expect(inspectIccProfile([{ ...chunk, total: 2 }], resolveLimits()).fields).toEqual([]);
    expect(inspectIccProfile([{ sequence: chunk.sequence, total: chunk.total, byteLength: chunk.byteLength }], resolveLimits()).fields).toEqual([]);
    expect(inspectIccProfile([{ ...chunk, byteLength: 1, data: new Uint8Array([1]) }], resolveLimits()).fields).toEqual([]);
    expect(inspected({ ...chunk, data: chunk.data === undefined ? new Uint8Array() : chunk.data.subarray(0, 131), byteLength: 131 }).warnings.some(({ code }) => code === "TRUNCATED_DATA")).toBe(true);
  });

  it("exercises every ICC payload rejection branch without converting malformed data into a match", () => {
    const malformedCases: readonly [string, Uint8Array][] = [
      ["text", bytesForType("text", Uint8Array.of(0x80))],
      ["desc", bytesForType("desc", u32(8))],
      ["desc", bytesForType("desc", concat(u32(1), ascii("X")))],
      ["desc", bytesForType("desc", concat(u32(2), ascii("X\0"), u32(0), u32(2), Uint8Array.of(0, 65, 0)))],
      ["mluc", bytesForType("mluc", concat(u32(1), u32(12), ascii("en\0\0"), u32(4), u32(28), Uint8Array.of(0, 65, 0)))],
      ["XYZ ", bytesForType("XYZ ", Uint8Array.of(1, 2, 3))],
      ["curv", bytesForType("curv", new Uint8Array([0, 0, 0, 1, 0]))],
      ["curv", bytesForType("curv", u32(2))],
      ["para", bytesForType("para", concat(u16(0), u16(1), s15(1)))],
      ["para", bytesForType("para", concat(u16(9), u16(0), s15(1)))],
      ["sf32", bytesForType("sf32", Uint8Array.of(1, 2, 3))],
      ["sig ", bytesForType("sig ", Uint8Array.of(1, 2, 3))],
      ["meas", bytesForType("meas", new Uint8Array(20))],
      ["view", bytesForType("view", new Uint8Array(20))],
      ["clro", bytesForType("clro", concat(u32(2), Uint8Array.of(1)))],
      ["clrt", bytesForType("clrt", concat(u32(1), new Uint8Array(10)))],
      ["mft1", bytesForType("mft1", new Uint8Array([0, 1, 2]))],
      ["mft1", bytesForType("mft1", new Uint8Array(48))],
      ["mft2", bytesForType("mft2", new Uint8Array(52))],
      ["mft2", bytesForType("mft2", new Uint8Array(60))],
      ["mAB ", bytesForType("mAB ", Uint8Array.from([0, 0, 1, ...new Uint8Array(29)]))],
      ["mBA ", bytesForType("mBA ", new Uint8Array(32))],
      ["mAB ", bytesForType("mAB ", concat(Uint8Array.of(1, 1, 2, 0, 0, 0, 1), new Uint8Array(25)))],
    ];
    for (const [signatureName, payload] of malformedCases) {
      const result = inspected(profile([{ signature: signatureName, payload }]));
      const tag = result.data?.decodedTags?.find(({ signature }) => signature === signatureName);
      expect(tag?.status, `${signatureName} malformed case`).not.toBe("decoded");
    }

    const limitedCases: readonly [string, Uint8Array][] = [
      ["curv", bytesForType("curv", concat(u32(3), u16(0), u16(1), u16(2)))],
      ["clro", bytesForType("clro", concat(u32(2), Uint8Array.of(1, 2)))],
      ["clrt", bytesForType("clrt", concat(u32(2), new Uint8Array(88)))],
      ["mft1", bytesForType("mft1", (() => { const value = new Uint8Array(562); value[0] = 1; value[1] = 1; value[2] = 2; return value; })())],
      ["mAB ", bytesForType("mAB ", (() => { const value = new Uint8Array(52); value[0] = 1; value[1] = 1; value[2] = 2; value[16] = 0; value[17] = 0; value[18] = 0; value[19] = 36; value[36] = 2; value[52] = 1; return value; })())],
    ];
    for (const [signatureName, payload] of limitedCases) {
      const result = inspected(profile([{ signature: signatureName, payload }]), { maxIccElements: 1, maxIccOutputBytes: signatureName === "mAB " ? 1 : 64 });
      const tag = result.data?.decodedTags?.find(({ signature }) => signature === signatureName);
      expect(tag?.status, `${signatureName} limited case`).toBe("limited");
      expect(result.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
    }
  });

  it("covers valid optional ICC payload forms and chunk-summary boundary semantics", () => {
    const identifier = encoder.encode("ICC_PROFILE\0");
    expect(parseIccChunk(concat(identifier, Uint8Array.of(0, 1)))).toBeNull();
    expect(parseIccChunk(concat(identifier, Uint8Array.of(1, 0)))).toBeNull();
    expect(parseIccChunk(concat(identifier, Uint8Array.of(2, 1)))).toBeNull();
    expect(parseIccChunk(concat(identifier, Uint8Array.of(1, 1)))).toMatchObject({ sequence: 1, total: 1, byteLength: 0 });
    expect(parseIccChunk(concat(encoder.encode("NOT_PROFILE\0"), Uint8Array.of(1, 1)))).toBeNull();
    expect(summarizeIcc([])).toBeNull();
    expect(summarizeIcc([{ sequence: 1, total: 1, byteLength: 2, data: new Uint8Array(2) }, { sequence: 2, total: 2, byteLength: 3, data: new Uint8Array(3) }])?.complete).toBe(false);

    const descAsciiOnly = bytesForType("desc", concat(u32(5), ascii("Desc\0")));
    const descUnicodeEmpty = bytesForType("desc", concat(u32(5), ascii("Desc\0"), u32(0), u32(0)));
    const mlucEmpty = bytesForType("mluc", concat(u32(0), u32(12)));
    const parameterTypes: readonly (readonly [number, number])[] = [
      [1, 3], [3, 4], [4, 5], [5, 7], [7, 7],
    ];
    const parameterPayloads = parameterTypes.map(([type, count]) => bytesForType("para", concat(u16(type), u16(0), new Uint8Array(count * 4))));
    const clut = new Uint8Array(45);
    clut[0] = 1;
    clut[1] = 1;
    new DataView(clut.buffer).setUint32(16, 32, false);
    clut[24] = 2;
    clut[40] = 1;
    const mABWithClut = bytesForType("mAB ", clut);
    const mABNoClut = bytesForType("mAB ", Uint8Array.from([1, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
    const payloads: IccTagFixture[] = [
      { signature: "desc", payload: descAsciiOnly },
      { signature: "desc", payload: descUnicodeEmpty },
      { signature: "mluc", payload: mlucEmpty },
      ...parameterPayloads.map((payload, index) => ({ signature: `p${index} `, payload })),
      { signature: "A2B1", payload: mABWithClut },
      { signature: "B2A1", payload: mABNoClut },
    ];
    const result = inspected(profile(payloads));
    expect(result.data?.decodedTags?.filter(({ status }) => status === "decoded").length).toBeGreaterThanOrEqual(4);

    const invalidClut = clut.slice();
    invalidClut[40] = 3;
    const invalidClutResult = inspected(profile([{ signature: "A2B2", payload: bytesForType("mAB ", invalidClut) }]));
    expect(invalidClutResult.data?.decodedTags?.[0]?.status).toBe("malformed");

    const noReserved = inspected(profile([{ signature: "text", payload: bytesForType("text", ascii("plain")) }]));
    expect(noReserved.data?.decodedTags?.[0]?.status).toBe("decoded");
  });

  it("covers ICC localized text, fixed-point, table, and LUT boundary alternatives", () => {
    const descWithScript = concat(
      u32(5), ascii("Desc\0"),
      u32(0), u32(1), Uint8Array.of(0, 0x44, 0, 0x65),
      Uint8Array.of(0, 7), new Uint8Array(68),
    );
    const invalidScript = descWithScript.slice();
    invalidScript[21] = 68;
    const unicodeSurrogate = concat(u32(5), ascii("Desc\0"), u32(0), u32(1), Uint8Array.of(0xd8, 0, 0, 0));
    const hugeDesc = concat(u32(100), new Uint8Array(100).fill(65));

    const invalidMlucCode = concat(u32(1), u32(12), Uint8Array.of(1, 0, 0x55, 0x53), u32(2), u32(28), Uint8Array.of(0, 65));
    const earlyMlucOffset = concat(u32(1), u32(12), ascii("enUS"), u32(2), u32(8), Uint8Array.of(0, 65));
    const validMluc = concat(u32(1), u32(12), ascii("enUS"), u32(2), u32(28), Uint8Array.of(0, 65));

    const reservedText = bytesForType("text", ascii("plain"));
    reservedText[12] = 1;
    const invalidParaReserved = bytesForType("para", concat(u16(0), u16(1), s15(1)));
    invalidParaReserved[10] = 1;
    const invalidClro = bytesForType("clro", concat(u32(1), Uint8Array.of(1)));
    const limitedClro = bytesForType("clro", concat(u32(2), Uint8Array.of(1, 2)));
    const invalidClrtName = bytesForType("clrt", concat(u32(1), Uint8Array.of(0x80), new Uint8Array(43)));

    const invalidMftChannels = new Uint8Array(48);
    invalidMftChannels[0] = 0;
    invalidMftChannels[1] = 1;
    invalidMftChannels[2] = 2;
    const invalidMftEntries = new Uint8Array(60);
    invalidMftEntries[0] = 1;
    invalidMftEntries[1] = 1;
    invalidMftEntries[2] = 2;
    new DataView(invalidMftEntries.buffer).setUint16(48, 0, false);
    new DataView(invalidMftEntries.buffer).setUint16(50, 1, false);

    const badMabOffsets = new Uint8Array(32);
    badMabOffsets[0] = 1;
    badMabOffsets[1] = 1;
    badMabOffsets[2] = 2;
    new DataView(badMabOffsets.buffer).setUint32(24, 31, false);
    const invalidMabClut = new Uint8Array(45);
    invalidMabClut[0] = 1;
    invalidMabClut[1] = 1;
    new DataView(invalidMabClut.buffer).setUint32(24, 32, false);
    invalidMabClut[32] = 2;
    invalidMabClut[40] = 3;
    const largeMabClut = new Uint8Array(45);
    largeMabClut[0] = 1;
    largeMabClut[1] = 1;
    new DataView(largeMabClut.buffer).setUint32(24, 32, false);
    largeMabClut[32] = 255;
    largeMabClut[40] = 1;

    const cases: IccTagFixture[] = [
      { signature: "dsc1", payload: bytesForType("desc", descWithScript) },
      { signature: "dsc2", payload: bytesForType("desc", invalidScript) },
      { signature: "dsc3", payload: bytesForType("desc", unicodeSurrogate) },
      { signature: "dsc4", payload: bytesForType("desc", hugeDesc) },
      { signature: "mlc1", payload: bytesForType("mluc", invalidMlucCode) },
      { signature: "mlc2", payload: bytesForType("mluc", earlyMlucOffset) },
      { signature: "mlc3", payload: bytesForType("mluc", validMluc) },
      { signature: "txt1", payload: reservedText },
      { signature: "par1", payload: invalidParaReserved },
      { signature: "clr1", payload: invalidClro },
      { signature: "clr2", payload: limitedClro },
      { signature: "clt1", payload: invalidClrtName },
      { signature: "mft1", payload: bytesForType("mft1", invalidMftChannels) },
      { signature: "mft2", payload: bytesForType("mft2", invalidMftEntries) },
      { signature: "mab1", payload: bytesForType("mAB ", badMabOffsets) },
      { signature: "mab2", payload: bytesForType("mAB ", invalidMabClut) },
      { signature: "mab3", payload: bytesForType("mAB ", largeMabClut) },
    ];
    const result = inspected(profile(cases));
    expect(result.data?.decodedTags?.find(({ signature }) => signature === "dsc1")?.status).toBe("decoded");
    expect(result.data?.decodedTags?.filter(({ status }) => status !== "decoded").length).toBeGreaterThanOrEqual(10);
    const limitedDescription = inspected(profile([{ signature: "dsc4", payload: bytesForType("desc", hugeDesc) }]), { maxStringBytes: 4 });
    expect(limitedDescription.data?.decodedTags?.[0]?.status).toBe("limited");
    expect(limitedDescription.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
  });

  it("decodes complete ICC table and profile-description payloads at their standards-defined boundaries", () => {
    const description = concat(
      u32(5), ascii("Desc\0"),
      u32(0), u32(2), Uint8Array.of(0, 0x44, 0, 0x65),
      Uint8Array.of(0, 7), new Uint8Array(68),
    );
    const mft1 = new Uint8Array(560);
    mft1[0] = 1; mft1[1] = 1; mft1[2] = 2;
    mft1.fill(0x55, 48);
    const mft2 = new Uint8Array(64);
    mft2[0] = 1; mft2[1] = 1; mft2[2] = 2;
    new DataView(mft2.buffer).setUint16(40, 1, false);
    new DataView(mft2.buffer).setUint16(42, 1, false);
    mft2.fill(0x1234 & 0xff, 52);

    const makeMab = (type: "mAB " | "mBA ", precision: 1 | 2): Uint8Array => {
      const payload = new Uint8Array(precision === 1 ? 46 : 48);
      payload[0] = 1;
      payload[1] = 1;
      new DataView(payload.buffer).setUint32(16, 32, false);
      payload[24] = 2;
      payload[40] = precision;
      if (precision === 1) payload.set([0x10, 0x20], 44);
      else new DataView(payload.buffer).setUint16(44, 0x1020, false);
      return bytesForType(type, payload);
    };

    const result = inspected(profile([
      { signature: "dscp", payload: bytesForType("desc", description) },
      { signature: "mft1", payload: bytesForType("mft1", mft1) },
      { signature: "mft2", payload: bytesForType("mft2", mft2) },
      { signature: "mab1", payload: makeMab("mAB ", 1) },
      { signature: "mab2", payload: makeMab("mBA ", 2) },
      { signature: "text", payload: bytesForType("text", ascii("")) },
    ]));

    expect(result.data?.decodedTags?.find(({ signature }) => signature === "dscp")).toMatchObject({ status: "decoded", value: { kind: "text", unicodeText: "De" } });
    expect(result.data?.decodedTags?.find(({ signature }) => signature === "mft1")).toMatchObject({ status: "decoded", value: { kind: "lut", value: { type: "mft1", tableBytes: 514 } } });
    expect(result.data?.decodedTags?.find(({ signature }) => signature === "mft2")).toMatchObject({ status: "decoded", value: { kind: "lut", value: { type: "mft2", tableBytes: 8 } } });
    expect(result.data?.decodedTags?.find(({ signature }) => signature === "mab1")).toMatchObject({ status: "decoded", value: { kind: "lut", value: { type: "mAB ", clut: { precisionBytes: 1, tableBytes: 2 } } } });
    expect(result.data?.decodedTags?.find(({ signature }) => signature === "mab2")).toMatchObject({ status: "decoded", value: { kind: "lut", value: { type: "mBA ", clut: { precisionBytes: 2, tableBytes: 4 } } } });
    expect(result.data?.decodedTags?.find(({ signature }) => signature === "text")).toMatchObject({ status: "decoded", value: { kind: "text", text: "" } });
    expect(result.warnings.filter(({ severity }) => severity === "error")).toEqual([]);
  });

  it("decodes each ICC parametric-curve function form and retains fixed-point values", () => {
    const parameterCounts = [1, 3, 4, 5, 7] as const;
    const tags = parameterCounts.map((count, functionType) => ({
      signature: `p${functionType} `,
      payload: bytesForType("para", concat(u16(functionType), u16(0), ...Array.from({ length: count }, (_, index) => s15(index / 2)))),
    }));
    const result = inspected(profile(tags));
    expect(result.data?.decodedTags?.map(({ status, value }) => [status, value?.kind])).toEqual(parameterCounts.map(() => ["decoded", "parametric-curve"]));
    expect(result.data?.decodedTags?.map(({ value }) => value?.kind === "parametric-curve" ? value.parameters.length : 0)).toEqual([...parameterCounts]);
    expect(result.warnings.filter(({ severity }) => severity === "error")).toEqual([]);
  });

  it("retains malformed ICC lexical boundaries and rejects unsafe table dimensions", () => {
    const malformedMluc = concat(u32(1), u32(12), ascii("enUS"), u32(4), u32(28), Uint8Array.of(0, 65, 0, 66));
    const malformedMab = new Uint8Array(46);
    malformedMab[0] = 1;
    malformedMab[1] = 1;
    malformedMab[2] = 2;
    new DataView(malformedMab.buffer).setUint32(16, 32, false);
    malformedMab[24] = 2;
    malformedMab[40] = 3;
    const oversizedClrt = concat(u32(0xffffffff), new Uint8Array(44));
    const result = inspected(profile([
      { signature: "mluc", payload: bytesForType("mluc", malformedMluc) },
      { signature: "mAB ", payload: bytesForType("mAB ", malformedMab) },
      { signature: "clrt", payload: bytesForType("clrt", oversizedClrt) },
    ]), { maxIccElements: 4, maxIccOutputBytes: 64 });
    expect(result.data?.decodedTags?.every(({ status }) => status !== "decoded")).toBe(true);
    expect(result.warnings.some(({ code }) => code === "TRUNCATED_DATA" || code === "LIMIT_EXCEEDED")).toBe(true);
  });

  it("exercises the remaining standards-defined ICC payload boundaries", () => {
    const oddUnicodeDescription = concat(
      u32(2), ascii("X\0"),
      u32(0), u32(1), Uint8Array.of(0x00),
    );
    const unterminatedDescription = concat(u32(2), ascii("XY"));
    const invalidAsciiDescription = concat(u32(2), Uint8Array.of(0xff, 0));
    const partialUnicodeDescription = concat(u32(2), ascii("X\0"), u32(0));
    const invalidScriptDescription = concat(
      u32(2), ascii("X\0"),
      u32(0), u32(0),
      new Uint8Array(70).fill(0),
    );
    invalidScriptDescription[18] = 0;
    invalidScriptDescription[19] = 68;

    const malformedMlucRecord = concat(
      u32(1), u32(11), ascii("enUS"), u32(2), u32(28), Uint8Array.of(0, 65),
    );
    const oversizedMlucCount = concat(u32(0xffffffff), u32(12));
    const unsupportedCurve = concat(u32(2), u16(0));
    const unsupportedParametricFunction = concat(u16(2), u16(0), s15(1));
    const invalidClroRange = concat(u32(1), Uint8Array.of(1));
    const invalidClrtRange = concat(u32(1), new Uint8Array(43));

    const invalidMftChannels = new Uint8Array(48);
    invalidMftChannels[0] = 16;
    invalidMftChannels[1] = 1;
    invalidMftChannels[2] = 2;
    const invalidMftGrid = new Uint8Array(48);
    invalidMftGrid[0] = 1;
    invalidMftGrid[1] = 1;
    invalidMftGrid[2] = 1;
    const invalidMft2Entries = new Uint8Array(60);
    invalidMft2Entries[0] = 1;
    invalidMft2Entries[1] = 1;
    invalidMft2Entries[2] = 2;
    new DataView(invalidMft2Entries.buffer).setUint16(48, 0, false);

    const invalidMabReserved = new Uint8Array(32);
    invalidMabReserved[0] = 1;
    invalidMabReserved[1] = 1;
    invalidMabReserved[2] = 2;
    invalidMabReserved[10] = 1;
    const invalidMabChannels = new Uint8Array(32);
    invalidMabChannels[0] = 0;
    invalidMabChannels[1] = 1;
    invalidMabChannels[2] = 2;
    const invalidMabOffsetAlignment = new Uint8Array(32);
    invalidMabOffsetAlignment[0] = 1;
    invalidMabOffsetAlignment[1] = 1;
    invalidMabOffsetAlignment[2] = 2;
    new DataView(invalidMabOffsetAlignment.buffer).setUint32(12, 31, false);
    const invalidMabClutGrid = new Uint8Array(45);
    invalidMabClutGrid[0] = 1;
    invalidMabClutGrid[1] = 1;
    new DataView(invalidMabClutGrid.buffer).setUint32(24, 32, false);
    invalidMabClutGrid[32] = 1;
    invalidMabClutGrid[40] = 1;

    const result = inspected(profile([
      { signature: "dsc1", payload: bytesForType("desc", oddUnicodeDescription) },
      { signature: "dsc2", payload: bytesForType("desc", unterminatedDescription) },
      { signature: "dsc3", payload: bytesForType("desc", invalidAsciiDescription) },
      { signature: "dsc4", payload: bytesForType("desc", partialUnicodeDescription) },
      { signature: "dsc5", payload: bytesForType("desc", invalidScriptDescription) },
      { signature: "mlc1", payload: bytesForType("mluc", malformedMlucRecord) },
      { signature: "mlc2", payload: bytesForType("mluc", oversizedMlucCount) },
      { signature: "curv", payload: bytesForType("curv", unsupportedCurve) },
      { signature: "para", payload: bytesForType("para", unsupportedParametricFunction) },
      { signature: "clro", payload: bytesForType("clro", invalidClroRange) },
      { signature: "clrt", payload: bytesForType("clrt", invalidClrtRange) },
      { signature: "mft1", payload: bytesForType("mft1", invalidMftChannels) },
      { signature: "mft1", payload: bytesForType("mft1", invalidMftGrid) },
      { signature: "mft2", payload: bytesForType("mft2", invalidMft2Entries) },
      { signature: "mAB ", payload: bytesForType("mAB ", invalidMabReserved) },
      { signature: "mAB ", payload: bytesForType("mAB ", invalidMabChannels) },
      { signature: "mAB ", payload: bytesForType("mAB ", invalidMabOffsetAlignment) },
      { signature: "mAB ", payload: bytesForType("mAB ", invalidMabClutGrid) },
    ]));

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.data?.decodedTags?.map(({ status }) => status)).toEqual([
      "malformed", "malformed", "malformed", "malformed", "decoded", "malformed", "limited",
      "malformed", "malformed", "decoded", "malformed", "malformed", "malformed", "malformed",
      "malformed", "malformed", "malformed", "decoded",
    ]);
    expect(result.warnings.every(({ code, offset, length }) => {
      return /^[A-Z][A-Z0-9_]*$/u.test(code) &&
        (offset === undefined || Number.isSafeInteger(offset)) &&
        (length === undefined || Number.isSafeInteger(length));
    })).toBe(true);
  });
});
