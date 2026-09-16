import { describe, expect, it } from "vitest";

import { inspectIccProfile, parseIccChunk } from "../src/metadata/icc.js";
import { inspectPhotoshopResourceSpans, parsePhotoshopResources, PHOTOSHOP_IDENTIFIER, PHOTOSHOP_RESOURCE_IDS } from "../src/metadata/photoshop.js";
import { parseGif } from "../src/parsers/gif.js";
import { parseJxl } from "../src/parsers/jxl.js";
import { parsePngDimensions } from "../src/parsers/png.js";
import { parseWebpDimensions } from "../src/parsers/webp.js";
import { resolveLimits } from "../src/security/limits.js";
import type { JxlBrotliDecompressor } from "../src/types.js";

const encoder = new TextEncoder();
const limits = resolveLimits({
  maxMetadataBytes: 2 * 1024 * 1024,
  maxValueBytes: 2 * 1024 * 1024,
  maxStringBytes: 64 * 1024,
  maxIccElements: 1024,
  maxIccDecodedTags: 128,
  maxIccOutputBytes: 2 * 1024 * 1024,
  maxIfdEntries: 1024,
  maxAdapterItems: 1024,
  maxSegments: 1024,
  maxWarnings: 128,
});

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function u16(value: number): Uint8Array {
  const output = new Uint8Array(2);
  new DataView(output.buffer).setUint16(0, value, false);
  return output;
}

function u32(value: number): Uint8Array {
  const output = new Uint8Array(4);
  new DataView(output.buffer).setUint32(0, value >>> 0, false);
  return output;
}

function fixed(value: number): Uint8Array {
  return u32(value < 0 ? 0x100000000 + Math.round(value * 65536) : Math.round(value * 65536));
}

function iccTag(type: string, body: Uint8Array): Uint8Array {
  return concat(encoder.encode(type), new Uint8Array(4), body);
}

function iccProfile(entries: readonly { readonly signature: string; readonly payload: Uint8Array }[]): Uint8Array {
  let offset = 132 + entries.length * 12;
  const locations: Array<{ readonly signature: string; readonly offset: number; readonly payload: Uint8Array }> = [];
  for (const entry of entries) {
    offset = (offset + 3) & ~3;
    locations.push({ signature: entry.signature, offset, payload: entry.payload });
    offset += entry.payload.length;
  }
  const profile = new Uint8Array(offset);
  profile.set(u32(offset), 0);
  profile.set(encoder.encode("acsp"), 36);
  profile.set(u16(2024), 24);
  profile.set(u16(2), 26);
  profile.set(u16(29), 28);
  profile.set(u16(23), 30);
  profile.set(u16(59), 32);
  profile.set(u16(59), 34);
  profile.set(u32(0), 64);
  profile.set(u32(entries.length), 128);
  for (const [index, entry] of locations.entries()) {
    const table = 132 + index * 12;
    profile.set(encoder.encode(entry.signature), table);
    profile.set(u32(entry.offset), table + 4);
    profile.set(u32(entry.payload.length), table + 8);
    profile.set(entry.payload, entry.offset);
  }
  return profile;
}

function inspect(entries: readonly { readonly signature: string; readonly type?: string; readonly body: Uint8Array }[]) {
  const profile = iccProfile(entries.map(({ signature, type, body }) => ({ signature, payload: iccTag(type ?? signature, body) })));
  const chunk = parseIccChunk(concat(encoder.encode("ICC_PROFILE\0"), Uint8Array.of(1, 1), profile));
  if (chunk === null) throw new Error("ICC depth fixture did not produce a complete chunk");
  return inspectIccProfile([chunk], limits);
}

function photoshopResource(id: number, payload: Uint8Array, name = ""): Uint8Array {
  const nameBytes = encoder.encode(name);
  const paddedNameLength = (1 + nameBytes.length + 1) & ~1;
  const output = new Uint8Array(4 + 2 + paddedNameLength + 4 + payload.length + (payload.length & 1));
  output.set(encoder.encode("8BIM"), 0);
  output.set(u16(id), 4);
  output[6] = nameBytes.length;
  output.set(nameBytes, 7);
  output.set(u32(payload.length), 6 + paddedNameLength);
  output.set(payload, 10 + paddedNameLength);
  return output;
}

function photoshopPayload(resources: readonly Uint8Array[]): Uint8Array {
  return concat(PHOTOSHOP_IDENTIFIER, ...resources);
}

function resolutionPayload(): Uint8Array {
  const output = new Uint8Array(16);
  output.set(u32(72 * 65536), 0);
  output.set(u16(1), 4);
  output.set(u16(1), 6);
  output.set(u32(72 * 65536), 8);
  output.set(u16(2), 12);
  output.set(u16(3), 14);
  return output;
}

function thumbnailPayload(format: 0 | 1, bytes = Uint8Array.of(1, 2, 3)): Uint8Array {
  const output = new Uint8Array(28 + bytes.length);
  output.set(u32(format), 0);
  output.set(u32(2), 4);
  output.set(u32(2), 8);
  output.set(u32(6), 12);
  output.set(u32(bytes.length), 16);
  output.set(u32(bytes.length), 20);
  output.set(u16(24), 24);
  output.set(u16(1), 26);
  output.set(bytes, 28);
  return output;
}

function gif(...blocks: readonly number[]): Uint8Array {
  return Uint8Array.from([...encoder.encode("GIF89a"), 2, 0, 2, 0, 0, 0, 0, ...blocks]);
}

function jxlContainer(...boxes: readonly Uint8Array[]): Uint8Array {
  const signature = Uint8Array.of(0, 0, 0, 12, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a);
  return concat(signature, ...boxes);
}

function jxlBox(type: string, payload: Uint8Array, size: "normal" | "extended" | "zero" = "normal"): Uint8Array {
  if (size === "extended") {
    const output = new Uint8Array(16 + payload.length);
    const view = new DataView(output.buffer);
    view.setUint32(0, 1, false);
    output.set(encoder.encode(type), 4);
    view.setBigUint64(8, BigInt(output.length), false);
    output.set(payload, 16);
    return output;
  }
  const output = new Uint8Array(8 + payload.length);
  const view = new DataView(output.buffer);
  view.setUint32(0, size === "zero" ? 0 : output.length, false);
  output.set(encoder.encode(type), 4);
  output.set(payload, 8);
  return output;
}

function pngIhdr(width: number, height: number, bitDepth: number, colorType: number, interlace = 0): Uint8Array {
  const output = new Uint8Array(33);
  output.set(Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), 0);
  output.set(u32(13), 8);
  output.set(encoder.encode("IHDR"), 12);
  output.set(u32(width), 16);
  output.set(u32(height), 20);
  output[24] = bitDepth;
  output[25] = colorType;
  output[26] = 0;
  output[27] = 0;
  output[28] = interlace;
  let crc = 0xffffffff;
  for (let index = 12; index < 29; index += 1) {
    crc ^= output[index] ?? 0;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  output.set(u32((crc ^ 0xffffffff) >>> 0), 29);
  return output;
}

function webpChunk(type: string, payload: Uint8Array): Uint8Array {
  const output = new Uint8Array(8 + payload.length + (payload.length & 1));
  output.set(encoder.encode(type), 0);
  new DataView(output.buffer).setUint32(4, payload.length, true);
  output.set(payload, 8);
  return output;
}

function webp(...chunks: readonly Uint8Array[]): Uint8Array {
  const body = concat(...chunks);
  const output = new Uint8Array(12 + body.length);
  output.set(encoder.encode("RIFF"), 0);
  new DataView(output.buffer).setUint32(4, body.length + 4, true);
  output.set(encoder.encode("WEBP"), 8);
  output.set(body, 12);
  return output;
}

describe("S06 decoder depth matrix", () => {
  it("exercises valid and bounded-invalid ICC semantic payloads", () => {
    const desc = concat(u32(3), Uint8Array.of(104, 105, 0));
    const mluc = concat(u32(1), u32(12), encoder.encode("enUS"), u32(4), u32(28), Uint8Array.of(0, 72, 0, 105));
    const curv = concat(u32(3), u16(0), u16(256), u16(512));
    const para = concat(u16(1), u16(0), fixed(1), fixed(2), fixed(3));
    const xyz = concat(fixed(0.9642), fixed(1), fixed(0.8249));
    const meas = new Uint8Array(28);
    meas.set(u32(1), 0); meas.set(fixed(0.9642), 4); meas.set(fixed(1), 8); meas.set(fixed(0.8249), 12); meas.set(u32(1), 16); meas.set(fixed(0), 20); meas.set(u32(1), 24);
    const clrt = concat(u32(1), new Uint8Array(44));
    const mft1 = new Uint8Array(554); mft1.set([1, 1, 2], 0);
    const mft2 = new Uint8Array(56); mft2.set([1, 1, 2], 0); mft2.set(u16(2), 40); mft2.set(u16(2), 42);
    const mAB = concat(Uint8Array.of(1, 1), new Uint8Array(22));
    const good = inspect([
      { signature: "desc", body: desc }, { signature: "cprt", type: "text", body: encoder.encode("Copyright\0") }, { signature: "mluc", body: mluc },
      { signature: "wtpt", type: "XYZ ", body: xyz }, { signature: "rTRC", type: "curv", body: u32(0) }, { signature: "gTRC", type: "curv", body: concat(u32(1), u16(512)) }, { signature: "bTRC", type: "curv", body: curv },
      { signature: "para", type: "para", body: para }, { signature: "sf32", type: "sf32", body: concat(fixed(1), fixed(-1)) }, { signature: "tech", type: "sig ", body: encoder.encode("abcd") },
      { signature: "meas", type: "meas", body: meas }, { signature: "view", type: "view", body: new Uint8Array(28) }, { signature: "clro", type: "clro", body: concat(u32(2), Uint8Array.of(0, 1)) },
      { signature: "clrt", type: "clrt", body: clrt }, { signature: "mft1", type: "mft1", body: mft1 }, { signature: "mft2", type: "mft2", body: mft2 }, { signature: "mAB ", type: "mAB ", body: mAB }, { signature: "mBA ", type: "mBA ", body: mAB }, { signature: "zzzz", body: Uint8Array.of(1, 2, 3) },
    ]);
    expect(good.data?.decodedTags?.filter(({ status }) => status === "decoded").length).toBeGreaterThanOrEqual(14);
    expect(good.fields.some(({ name }) => name === "ProfileDescription")).toBe(true);
    expect(good.fields.some(({ name }) => name === "MediaWhitePoint")).toBe(true);
    expect(good.data?.decodedTags?.some(({ value }) => value?.kind === "lut")).toBe(true);

    const malformedBodies: readonly [string, Uint8Array][] = [
      ["desc", u32(20)], ["mluc", concat(u32(1), u32(4))], ["XYZ ", Uint8Array.of(1)], ["curv", concat(u32(2), u16(1))],
      ["para", concat(u16(9), u16(0))], ["sf32", Uint8Array.of(1)], ["sig ", Uint8Array.of(1)], ["meas", new Uint8Array(4)], ["view", new Uint8Array(4)],
      ["clro", u32(9999)], ["clrt", concat(u32(1), new Uint8Array(2))], ["mft1", Uint8Array.of(1, 1, 1)], ["mft2", concat(Uint8Array.of(1, 1, 2), new Uint8Array(45))],
      ["mAB ", concat(Uint8Array.of(0, 0), new Uint8Array(22))], ["mBA ", concat(Uint8Array.of(1, 1), Uint8Array.of(0, 0, 0, 31), new Uint8Array(18))],
    ];
    for (const [signature, body] of malformedBodies) {
      const type = signature === "cprt" ? "text" : signature === "rTRC" || signature === "gTRC" || signature === "bTRC" ? "curv" : signature;
      const result = inspect([{ signature, type, body }]);
      expect(result.data?.decodedTags?.[0]?.status).not.toBe("decoded");
      expect(result.warnings.length).toBeGreaterThan(0);
    }
    const invalidDate = iccProfile([{ signature: "text", payload: iccTag("text", encoder.encode("x\0")) }]);
    invalidDate.set(u16(2023), 24); invalidDate.set(u16(2), 26); invalidDate.set(u16(29), 28);
    const invalidChunk = parseIccChunk(concat(encoder.encode("ICC_PROFILE\0"), Uint8Array.of(1, 1), invalidDate));
    expect(invalidChunk).not.toBeNull();
    if (invalidChunk === null) throw new Error("invalid-date ICC fixture unexpectedly failed to parse");
    expect(inspectIccProfile([invalidChunk], limits).warnings.some(({ code }) => code === "INVALID_VALUE")).toBe(true);
  });

  it("exercises Photoshop resource decoding and every malformed retention path", () => {
    const path = new Uint8Array(26); path[1] = 7;
    const clipping = Uint8Array.of(4, 65, 66, 67, 68);
    const payload = photoshopPayload([
      photoshopResource(PHOTOSHOP_RESOURCE_IDS.resolution, resolutionPayload(), "resolution"),
      photoshopResource(PHOTOSHOP_RESOURCE_IDS.thumbnailBgr, thumbnailPayload(0), "thumb"),
      photoshopResource(PHOTOSHOP_RESOURCE_IDS.thumbnailRgb, thumbnailPayload(1), "jpeg"),
      photoshopResource(PHOTOSHOP_RESOURCE_IDS.iptc, Uint8Array.of(0x1c, 2, 5, 0, 1, 65), "iptc"),
      photoshopResource(PHOTOSHOP_RESOURCE_IDS.xmp, encoder.encode("<x:xmpmeta/>") , "xmp"),
      photoshopResource(PHOTOSHOP_RESOURCE_IDS.captionDigest, new Uint8Array(16), "digest"),
      photoshopResource(PHOTOSHOP_RESOURCE_IDS.pathFirst, path, "path"),
      photoshopResource(PHOTOSHOP_RESOURCE_IDS.clippingPathName, clipping, "clip"),
      photoshopResource(0x1234, Uint8Array.of(9), "unknown"),
    ]);
    const inspected = parsePhotoshopResources(payload, limits, { container: "app13", blockId: "app13:depth", sourceOffset: 100, sourceLength: payload.length });
    expect(inspected?.complete).toBe(true);
    expect(inspected?.resources.map(({ kind }) => kind)).toEqual(expect.arrayContaining(["resolution", "thumbnail", "iptc", "xmp", "caption-digest", "path", "clipping-path-name", "unknown"]));
    expect(inspected?.resources.every(({ rawPayload }) => rawPayload !== null)).toBe(true);
    expect(inspectPhotoshopResourceSpans(payload, "app13", limits)?.spans).toHaveLength(9);
    expect(parsePhotoshopResources(payload, resolveLimits({ maxValueBytes: 1, maxMetadataBytes: 1 }), { container: "app13", blockId: "limited", sourceOffset: 0, sourceLength: payload.length })?.resources.some(({ status }) => status === "limited")).toBe(true);

    const malformed = [
      photoshopResource(PHOTOSHOP_RESOURCE_IDS.resolution, Uint8Array.of(1)),
      photoshopResource(PHOTOSHOP_RESOURCE_IDS.thumbnailBgr, thumbnailPayload(1, Uint8Array.of()).slice(0, 28)),
      photoshopResource(PHOTOSHOP_RESOURCE_IDS.captionDigest, Uint8Array.of(1)),
      photoshopResource(PHOTOSHOP_RESOURCE_IDS.pathFirst, Uint8Array.of(1)),
      photoshopResource(PHOTOSHOP_RESOURCE_IDS.clippingPathName, Uint8Array.of(9, 1)),
      photoshopResource(PHOTOSHOP_RESOURCE_IDS.xmp, Uint8Array.of(0xff)),
    ];
    for (const resource of malformed) {
      const result = parsePhotoshopResources(photoshopPayload([resource]), limits, { container: "app13", blockId: "malformed", sourceOffset: 0, sourceLength: resource.length });
      expect(result?.resources[0]?.status).toBe("malformed");
      expect(result?.diagnostics.length).toBeGreaterThan(0);
    }
    const badNamePadding = photoshopPayload([photoshopResource(0x1234, Uint8Array.of(1), "x")]);
    badNamePadding[PHOTOSHOP_IDENTIFIER.length + 8] = 1;
    expect(parsePhotoshopResources(badNamePadding, limits, { container: "app13", blockId: "padding", sourceOffset: 0, sourceLength: badNamePadding.length })?.complete).toBe(false);
    expect(inspectPhotoshopResourceSpans(concat(PHOTOSHOP_IDENTIFIER, Uint8Array.of(1, 2, 3)), "app13", limits)?.complete).toBe(false);
    expect(parsePhotoshopResources(encoder.encode("not Photoshop"), limits, { container: "app13", blockId: "none", sourceOffset: 0, sourceLength: 13 })).toBeNull();
  });

  it("covers PNG and WebP dimension validity matrices", () => {
    for (const [depth, type] of [[1, 0], [2, 0], [4, 0], [8, 0], [16, 0], [8, 2], [16, 2], [8, 3], [1, 3], [4, 3], [8, 4], [16, 4], [8, 6], [16, 6]] as const) {
      expect(parsePngDimensions(pngIhdr(10, 20, depth, type))).toEqual({ width: 10, height: 20 });
    }
    for (const mutate of [
      (bytes: Uint8Array) => { bytes.fill(0, 16, 20); },
      (bytes: Uint8Array) => { bytes[24] = 3; },
      (bytes: Uint8Array) => { bytes[25] = 1; },
      (bytes: Uint8Array) => { bytes[26] = 1; },
      (bytes: Uint8Array) => { bytes[27] = 1; },
      (bytes: Uint8Array) => { bytes[28] = 2; },
      (bytes: Uint8Array) => { bytes[29] = (bytes[29] ?? 0) ^ 1; },
    ]) {
      const candidate = pngIhdr(10, 20, 8, 2);
      mutate(candidate);
      expect(parsePngDimensions(candidate)).toBeNull();
    }

    const vp8x = Uint8Array.of(...encoder.encode("RIFF"), 0, 0, 0, 0, ...encoder.encode("WEBP"), ...webpChunk("VP8X", Uint8Array.of(0, 0, 0, 0, 1, 0, 0, 1, 0, 0)));
    new DataView(vp8x.buffer).setUint32(4, vp8x.length - 8, true);
    expect(parseWebpDimensions(vp8x)).toEqual({ width: 2, height: 2 });
    const vp8l = webp(webpChunk("VP8L", Uint8Array.of(0x2f, 1, 0, 0, 0)));
    expect(parseWebpDimensions(vp8l)).toEqual({ width: 2, height: 1 });
    const vp8 = webp(webpChunk("VP8 ", Uint8Array.of(0x10, 0, 0, 0x9d, 1, 0x2a, 4, 0, 3, 0)));
    expect(parseWebpDimensions(vp8)).toEqual({ width: 4, height: 3 });
    for (const mutate of [
      (bytes: Uint8Array) => { bytes[0] = 0; },
      (bytes: Uint8Array) => { new DataView(bytes.buffer).setUint32(4, bytes.length, true); },
      (bytes: Uint8Array) => { bytes[12] = 0; },
      (bytes: Uint8Array) => { bytes[20] = 0; },
      (bytes: Uint8Array) => { bytes[20] = 0x2f; bytes[24] = 0xe0; },
    ]) {
      const candidate = vp8l.slice();
      mutate(candidate);
      expect(parseWebpDimensions(candidate)).toBeNull();
    }
  });

  it("covers GIF block, selection, UTF-8, and limit boundaries", () => {
    const xmpPacket = encoder.encode("<x:xmpmeta/>");
    const xmp = [0xff, 11, ...encoder.encode("XMP DataXMP"), xmpPacket.length, ...xmpPacket, 0];
    const comment = [0xfe, 3, 65, 66, 67, 0];
    const app = [0xff, 11, ...encoder.encode("NETSCAPE2.0"), 3, 1, 2, 0, 0];
    const frame = [0x2c, 0, 0, 0, 0, 2, 0, 2, 0, 0, 2, 1, 0, 0];
    const result = parseGif(gif(0x21, ...app, 0x21, ...xmp, 0x21, ...comment, ...frame, 0x3b), limits, { groups: new Set(["Dimensions", "EXIF", "XMP"]), tags: null });
    expect(result.dimensions).toEqual({ width: 2, height: 2 });
    expect(result.fields.map(({ name }) => name)).toEqual(expect.arrayContaining(["Comment", "LoopCount"]));
    expect(result.xmp?.packets).toHaveLength(1);
    const frameOnly = parseGif(gif(...frame, 0x3b), limits, { groups: new Set(["Dimensions"]), tags: null });
    expect(frameOnly.fields).toContainEqual(expect.objectContaining({ name: "FrameCount", value: 1 }));
    expect(parseGif(gif(0x21, 0xfe, 3, 0xff, 0, 0), resolveLimits({ maxSegments: 1 }), undefined).warnings.length).toBeGreaterThan(0);
    expect(parseGif(gif(0x21, 0xff, 3, 1, 2, 3), limits).warnings.length).toBeGreaterThan(0);
    expect(parseGif(gif(0x21, 0xf9, 0, 1, 0, 0, 0), limits).warnings.length).toBeGreaterThan(0);
    expect(parseGif(Uint8Array.of(1, 2), limits).warnings[0]?.code).toBe("MALFORMED_GIF");
  });

  it("covers JPEG XL box sizing, partial streams, and custom decoder result boundaries", async () => {
    const packet = encoder.encode("<x:xmpmeta/>");
    const invalid = await parseJxl(jxlContainer(jxlBox("xml ", Uint8Array.of(0xff))), limits, { groups: new Set(["XMP", "Dimensions"]), tags: null });
    expect(invalid.warnings.some(({ code }) => code === "INVALID_VALUE")).toBe(true);
    const zeroSized = await parseJxl(jxlContainer(jxlBox("xml ", packet, "zero")), limits, { groups: new Set(["XMP"]), tags: null });
    expect(zeroSized.xmp?.packets).toEqual([new TextDecoder().decode(packet)]);
    const extended = await parseJxl(jxlContainer(jxlBox("xml ", packet, "extended")), limits, { groups: new Set(["XMP"]), tags: null });
    expect(extended.xmp?.packets).toEqual([new TextDecoder().decode(packet)]);
    const gaps = new Uint8Array(4 + packet.length);
    new DataView(gaps.buffer).setUint32(0, 0, false); gaps.set(packet, 4);
    const gapResult = await parseJxl(jxlContainer(jxlBox("jxlp", gaps), jxlBox("jxlp", gaps)), limits);
    expect(gapResult.warnings.some(({ code }) => code === "MALFORMED_JXL")).toBe(true);
    const customBad: JxlBrotliDecompressor = () => new DataView(new ArrayBuffer(1)) as unknown as Uint8Array;
    const customResult = await parseJxl(jxlContainer(jxlBox("brob", concat(encoder.encode("xml "), packet))), limits, { groups: new Set(["XMP"]), tags: null }, undefined, undefined, customBad);
    expect(customResult.warnings.some(({ code }) => code === "INVALID_VALUE" || code === "UNSUPPORTED_COMPRESSION")).toBe(true);
    const unsupported = await parseJxl(jxlContainer(jxlBox("brob", concat(encoder.encode("abcd"), packet))), limits);
    expect(unsupported.blocks).toContainEqual(expect.objectContaining({ status: "opaque" }));
    const tooMany = await parseJxl(jxlContainer(jxlBox("xml ", packet), jxlBox("xml ", packet)), resolveLimits({ maxXmpPackets: 1 }));
    expect(tooMany.warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
  });
});
