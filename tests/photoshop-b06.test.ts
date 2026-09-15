import { describe, expect, it } from "vitest";
import {
  auditPrivacy,
  parseMetadata,
  parsePhotoshopResources,
  redactMetadata,
  rewriteJpegMetadata,
  rewriteTiff,
  toJsonSafeResult,
  editMetadata,
} from "../src/index.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";

const encoder = new TextEncoder();

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function segment(marker: number, payload: Uint8Array): Uint8Array {
  const length = payload.length + 2;
  return concat(Uint8Array.of(0xff, marker, (length >>> 8) & 0xff, length & 0xff), payload);
}

function resource(id: number, name: string, payload: Uint8Array): Uint8Array {
  const nameBytes = encoder.encode(name);
  const nameFieldLength = 1 + nameBytes.length + ((1 + nameBytes.length) & 1);
  const total = 4 + 2 + nameFieldLength + 4 + payload.length + (payload.length & 1);
  const output = new Uint8Array(total);
  let offset = 0;
  output.set(encoder.encode("8BIM"), offset); offset += 4;
  output[offset++] = (id >>> 8) & 0xff; output[offset++] = id & 0xff;
  output[offset++] = nameBytes.length; output.set(nameBytes, offset); offset += nameBytes.length;
  if ((1 + nameBytes.length) & 1) output[offset++] = 0;
  new DataView(output.buffer).setUint32(offset, payload.length); offset += 4;
  output.set(payload, offset); offset += payload.length;
  if (payload.length & 1) output[offset] = 0;
  return output;
}

function resolution(): Uint8Array {
  const output = new Uint8Array(16);
  const view = new DataView(output.buffer);
  view.setUint32(0, 300 * 65536);
  view.setUint16(4, 1);
  view.setUint16(6, 1);
  view.setUint32(8, 300 * 65536);
  view.setUint16(12, 1);
  view.setUint16(14, 1);
  return output;
}

function thumbnail(): Uint8Array {
  const output = new Uint8Array(34);
  const view = new DataView(output.buffer);
  view.setUint32(0, 0);
  view.setUint32(4, 2);
  view.setUint32(8, 1);
  view.setUint32(12, 6);
  view.setUint32(16, 6);
  view.setUint32(20, 6);
  view.setUint16(24, 24);
  view.setUint16(26, 1);
  output.set([1, 2, 3, 4, 5, 6], 28);
  return output;
}

function pathRecord(): Uint8Array {
  const output = new Uint8Array(26);
  output[1] = 0;
  return output;
}

function resources(includeIdentifier: boolean): Uint8Array {
  const body = concat(
    resource(0x03ed, "resolution", resolution()),
    resource(0x0409, "thumb", thumbnail()),
    resource(0x040c, "thumb-rgb", thumbnail()),
    resource(0x0404, "iptc", Uint8Array.of(0x1c, 2, 5, 0, 3, 0x41, 0x42, 0x43)),
    resource(0x0424, "xmp", encoder.encode("<x:xmpmeta/>")),
    resource(0x0425, "digest", Uint8Array.from({ length: 16 }, (_, index) => index)),
    resource(0x07d0, "path", pathRecord()),
    resource(0x0bb7, "clip", concat(Uint8Array.of(4), encoder.encode("clip"))),
    resource(0x1234, "odd", Uint8Array.of(9)),
    resource(0x1234, "", new Uint8Array()),
  );
  return includeIdentifier ? concat(encoder.encode("Photoshop 3.0\0"), body) : body;
}

function jpegWithPhotoshop(): Uint8Array {
  const sof = segment(0xc0, Uint8Array.of(8, 0, 1, 0, 2, 1, 1, 0x11, 0));
  const sos = segment(0xda, Uint8Array.of(1, 1, 0, 0, 63, 0));
  return concat(Uint8Array.of(0xff, 0xd8), segment(0xed, resources(true)), sof, sos, Uint8Array.of(1, 2, 3, 0xff, 0xd9));
}

function tiffWithPhotoshop(): Uint8Array {
  const body = resources(false);
  const output = new Uint8Array(26 + body.length);
  output.set([0x49, 0x49, 0x2a, 0x00, 8, 0, 0, 0], 0);
  const view = new DataView(output.buffer);
  view.setUint16(8, 1, true);
  view.setUint16(10, 0x8649, true);
  view.setUint16(12, 7, true);
  view.setUint32(14, body.length, true);
  view.setUint32(18, 26, true);
  view.setUint32(22, 0, true);
  output.set(body, 26);
  return output;
}

function app13(bytes: Uint8Array): Uint8Array {
  const marker = bytes.findIndex((value, index) => value === 0xff && bytes[index + 1] === 0xed);
  if (marker < 0) throw new Error("APP13 fixture segment was not found");
  const length = ((bytes[marker + 2] ?? 0) << 8) | (bytes[marker + 3] ?? 0);
  return bytes.subarray(marker, marker + 4 + length - 2);
}

function resourceBytes(bytes: Uint8Array, resource: { readonly offset: number; readonly length: number }): Uint8Array {
  return bytes.subarray(resource.offset, resource.offset + resource.length);
}

describe("B06 bounded Photoshop image-resource inventory", () => {
  it("indexes every resource in source order and decodes all high-value resources", async () => {
    const input = jpegWithPhotoshop();
    const result = await parseMetadata(input);
    const inventory = result.photoshop;
    expect(inventory?.identifier).toBe("Photoshop 3.0");
    expect(inventory?.complete).toBe(true);
    expect(inventory?.resources).toHaveLength(10);
    expect(inventory?.resources.map((item) => item.kind)).toEqual(["resolution", "thumbnail", "thumbnail", "iptc", "xmp", "caption-digest", "path", "clipping-path-name", "unknown", "unknown"]);
    expect(inventory?.resources.filter((item) => item.resourceId === 0x1234)).toHaveLength(2);
    expect(inventory?.resources[0]).toMatchObject({ name: "resolution", resourceId: 0x03ed, status: "decoded", decoded: { kind: "resolution", horizontalResolution: 300, verticalResolution: 300 } });
    expect(inventory?.resources[1]?.decoded).toMatchObject({ kind: "thumbnail", width: 2, height: 1, channelOrder: "bgr", imageDataLength: 6 });
    expect(inventory?.resources[2]?.decoded).toMatchObject({ kind: "thumbnail", channelOrder: "rgb" });
    expect(inventory?.resources[4]?.decoded).toEqual({ kind: "xmp", packet: "<x:xmpmeta/>" });
    expect(inventory?.resources[5]?.decoded).toMatchObject({ kind: "caption-digest", algorithm: "MD5", hex: "000102030405060708090a0b0c0d0e0f" });
    expect(inventory?.resources[6]?.decoded).toEqual({ kind: "path", recordCount: 1, selectors: [0] });
    expect(inventory?.resources[7]?.decoded).toEqual({ kind: "clipping-path-name", name: "clip" });
    expect(inventory?.resources[8]?.rawPayload).toEqual(Uint8Array.of(9));
    expect(inventory?.resources[9]?.nameBytes).toEqual(new Uint8Array());
    expect(inventory?.resources[9]?.namePadding).toEqual(Uint8Array.of(0));
    expect(result.blocks.filter((block) => block.family === "Photoshop")).toHaveLength(11);
  });

  it("supports TIFF tag 33723-style image-resource containers through tag 34377", async () => {
    const result = await parseMetadata(tiffWithPhotoshop(), { select: { groups: ["Photoshop"] } });
    expect(result.photoshop?.identifier).toBeNull();
    expect(result.photoshop?.source.blockId).toContain("photoshop");
    expect(result.photoshop?.resources).toHaveLength(10);
    expect(result.iptc).toBeNull();
    expect(result.blocks.some((block) => block.family === "Photoshop" && block.container.includes("34377"))).toBe(true);
  });

  it("preserves TIFF Photoshop resources during an unrelated metadata rewrite", async () => {
    const input = tiffWithPhotoshop();
    const before = await parseMetadata(input);
    const originalResources = before.photoshop?.resources ?? [];
    const edited = rewriteTiff(input, { edits: [{ op: "set", directoryId: "IFD0@8", tag: 0x010f, type: "ASCII", value: { kind: "text", value: "B06" } }] });
    const after = await parseMetadata(edited);
    expect(after.photoshop?.resources).toHaveLength(originalResources.length);
    for (const [index, original] of originalResources.entries()) {
      const current = after.photoshop?.resources[index];
      if (current === undefined) throw new Error("TIFF Photoshop resource disappeared during unrelated rewrite");
      expect(resourceBytes(edited, current)).toEqual(resourceBytes(input, original));
    }
  });

  it("keeps exact names, payloads, padding, offsets, and bounded unknown risks", async () => {
    const input = jpegWithPhotoshop();
    const result = await parseMetadata(input, { select: { groups: ["Photoshop"] } });
    const resource = result.photoshop?.resources[8];
    if (resource === undefined) throw new Error("fixture resource is missing");
    expect(resource.offset).toBeGreaterThan(0);
    expect(resource.payloadOffset).toBeGreaterThan(resource.offset);
    expect(resource.length).toBeGreaterThan(resource.payloadLength);
    expect(resource.rawPayload).toEqual(Uint8Array.of(9));
    const safe = toJsonSafeResult(result) as { photoshop?: { resources?: readonly unknown[] } };
    expect(safe.photoshop?.resources).toBeDefined();
    const privacy = await auditPrivacy(input);
    expect(privacy.findings.some((finding) => finding.category === "opaque-block" && finding.state === "opaque-risk")).toBe(true);
    expect(JSON.stringify(privacy)).not.toContain("000102030405060708090a0b0c0d0e0f");
    const boundedPrivacy = await auditPrivacy(input, { limits: { maxImageDetailRelationships: 2 } });
    expect(boundedPrivacy.findings).toContainEqual(expect.objectContaining({ fieldId: "privacy:photoshop-resources", state: "opaque-risk", reasonCode: "BLOCK_OPAQUE" }));
    expect(boundedPrivacy.coverage.wholeFile).toBe("opaque");
  });

  it("fails closed on malformed padding, truncation, and resource limits", () => {
    const valid = resources(true);
    const badName = valid.slice();
    const namePadding = 14 + 4 + 2 + 1 + 10;
    badName[namePadding] = 7;
    const malformed = parsePhotoshopResources(badName, DEFAULT_LIMITS, { container: "app13", blockId: "fixture", sourceOffset: 0, sourceLength: badName.length });
    expect(malformed?.complete).toBe(false);
    expect(malformed?.resources[0]?.status).toBe("malformed");
    const truncated = parsePhotoshopResources(valid.subarray(0, valid.length - 1), DEFAULT_LIMITS, { container: "app13", blockId: "fixture", sourceOffset: 0, sourceLength: valid.length - 1 });
    expect(truncated?.complete).toBe(false);
    expect(truncated?.diagnostics.some(({ code }) => code === "TRUNCATED_DATA")).toBe(true);
    const limited = parsePhotoshopResources(valid, { ...DEFAULT_LIMITS, maxSegments: 2 }, { container: "app13", blockId: "fixture", sourceOffset: 0, sourceLength: valid.length });
    expect(limited?.complete).toBe(false);
    expect(limited?.resources).toHaveLength(2);
    expect(limited?.diagnostics.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);

    const overlappingLength = valid.slice();
    const firstSizeOffset = 14 + 4 + 2 + 1 + 10 + 1;
    new DataView(overlappingLength.buffer, overlappingLength.byteOffset, overlappingLength.byteLength).setUint32(firstSizeOffset, 0x7fffffff, false);
    const overlapping = parsePhotoshopResources(overlappingLength, DEFAULT_LIMITS, { container: "app13", blockId: "fixture", sourceOffset: 0, sourceLength: overlappingLength.length });
    expect(overlapping?.complete).toBe(false);
    expect(overlapping?.diagnostics[0]?.code).toBe("TRUNCATED_DATA");
    const pathLimited = parsePhotoshopResources(valid, { ...DEFAULT_LIMITS, maxValueBytes: 1 }, { container: "app13", blockId: "fixture", sourceOffset: 0, sourceLength: valid.length });
    expect(pathLimited?.complete).toBe(false);
    expect(pathLimited?.resources.find((resource) => resource.kind === "path")?.status).toBe("limited");
  });

  it("removes exactly one duplicate resource and preserves unrelated image and resource bytes", async () => {
    const input = jpegWithPhotoshop();
    const parsed = await parseMetadata(input);
    const target = parsed.photoshop?.resources[8];
    if (target === undefined) throw new Error("fixture target resource is missing");
    const edited = await redactMetadata(input, { remove: [{ kind: "selector", selector: { kind: "photoshop-resource", resourceId: target.id } }] });
    expect(edited.outcome).toEqual({ successful: true, complete: true, unapplied: [], reasons: [] });
    const reparsed = await parseMetadata(edited.data);
    expect(reparsed.photoshop?.resources.filter((resource) => resource.resourceId === 0x1234)).toHaveLength(2 - 1);
    expect(reparsed.photoshop?.resources.some((resource) => resource.name === "odd")).toBe(false);
    expect(reparsed.photoshop?.resources.some((resource) => resource.resourceId === 0x03ed)).toBe(true);
    const survivors = parsed.photoshop?.resources.filter((resource) => resource.id !== target.id) ?? [];
    expect(reparsed.photoshop?.resources).toHaveLength(survivors.length);
    for (const [index, survivor] of survivors.entries()) {
      const after = reparsed.photoshop?.resources[index];
      if (after === undefined) throw new Error("surviving resource disappeared");
      expect(resourceBytes(edited.data, after)).toEqual(resourceBytes(input, survivor));
    }
    expect(edited.data.slice(edited.data.length - 5)).toEqual(Uint8Array.of(1, 2, 3, 0xff, 0xd9));
    if (edited.operations === undefined) throw new Error("typed redaction evidence is missing");
    expect(edited.operations[0]).toMatchObject({ status: "applied", candidateCount: 1, appliedCount: 1, matchedBlockIds: [`${target.id}:block`] });
  });

  it("keeps exact resource identities stable across multiple removals and the public edit API", async () => {
    const input = jpegWithPhotoshop();
    const parsed = await parseMetadata(input);
    const first = parsed.photoshop?.resources[8];
    const second = parsed.photoshop?.resources[9];
    if (first === undefined || second === undefined) throw new Error("fixture duplicate resources are missing");
    const rewritten = rewriteJpegMetadata(input, { blocks: [
      { op: "remove", kind: "photoshop-resource", resourceId: first.id },
      { op: "remove", kind: "photoshop-resource", resourceId: second.id },
    ] });
    const reparsed = await parseMetadata(rewritten.data);
    expect(reparsed.photoshop?.resources.some((resource) => resource.resourceId === 0x1234)).toBe(false);
    expect(reparsed.photoshop?.resources).toHaveLength(8);
    expect(rewritten.data.slice(rewritten.data.length - 5)).toEqual(Uint8Array.of(1, 2, 3, 0xff, 0xd9));
    const transaction = await editMetadata(input, { operations: [{ op: "delete", operationId: "delete-photoshop-resource", target: { kind: "selector", selector: { kind: "photoshop-resource", resourceId: first.id } } }] });
    expect(transaction.status).toBe("applied");
    expect(transaction.data).not.toBeNull();
    const transactionResult = await parseMetadata(transaction.data as Uint8Array);
    expect(transactionResult.photoshop?.resources.some((resource) => resource.name === "odd")).toBe(false);

    const multiTransaction = await editMetadata(input, { operations: [
      { op: "delete", operationId: "delete-first-photoshop-resource", target: { kind: "selector", selector: { kind: "photoshop-resource", resourceId: first.id } } },
      { op: "delete", operationId: "delete-second-photoshop-resource", target: { kind: "selector", selector: { kind: "photoshop-resource", resourceId: second.id } } },
    ] });
    expect(multiTransaction.status).toBe("applied");
    expect(multiTransaction.data).not.toBeNull();
    const multiResult = await parseMetadata(multiTransaction.data as Uint8Array);
    expect(multiResult.photoshop?.resources.some((resource) => resource.resourceId === 0x1234)).toBe(false);

    const mixedTransaction = await editMetadata(input, { operations: [
      { op: "delete", operationId: "delete-iptc-resource", target: { kind: "selector", selector: { kind: "family", family: "IPTC" } } },
      { op: "delete", operationId: "delete-second-after-iptc", target: { kind: "selector", selector: { kind: "photoshop-resource", resourceId: second.id } } },
    ] });
    expect(mixedTransaction.status).toBe("applied");
    expect(mixedTransaction.data).not.toBeNull();
    const mixedResult = await parseMetadata(mixedTransaction.data as Uint8Array);
    expect(mixedResult.photoshop?.resources.some((resource) => resource.id === second.id)).toBe(false);
    expect(mixedResult.photoshop?.resources.some((resource) => resource.resourceId === 0x0404)).toBe(false);
    expect(mixedResult.photoshop?.resources).toHaveLength(8);
  });

  it("preserves the complete APP13 segment for unrelated metadata edits and refuses malformed writes atomically", () => {
    const input = jpegWithPhotoshop();
    const changed = rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "standard-xmp", data: "<x:xmpmeta/>" }] }).data;
    expect(app13(changed)).toEqual(app13(input));
    const bad = input.slice();
    const marker = bad.findIndex((value, index) => value === 0xff && bad[index + 1] === 0xed);
    if (marker < 0) throw new Error("APP13 marker missing");
    bad[marker + 4 + 14 + 4 + 2 + 1 + 10] = 7;
    let thrown: unknown = null;
    try {
      rewriteJpegMetadata(bad, { blocks: [{ op: "add", kind: "standard-xmp", data: "<x:xmpmeta/>" }] });
    } catch (error) {
      thrown = error;
    }
    if (!(thrown instanceof Error)) throw new Error("malformed Photoshop writer input was not rejected");
    expect((thrown as { readonly code?: unknown }).code).toBe("UNSAFE_STRUCTURE");
  });
});
