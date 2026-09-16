import { describe, expect, it } from "vitest";

import { JpegWriterError, rewriteJpegMetadata } from "../src/jpeg-writer.js";
import { parseJpeg } from "../src/parsers/jpeg.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";

const encoder = new TextEncoder();
const xmpIdentifier = encoder.encode("http://ns.adobe.com/xap/1.0/\0");
const extendedIdentifier = encoder.encode("http://ns.adobe.com/xmp/extension/\0");
const iccIdentifier = encoder.encode("ICC_PROFILE\0");
const photoshopIdentifier = encoder.encode("Photoshop 3.0\0");

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((length, part) => length + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function segment(marker: number, payload: Uint8Array): Uint8Array {
  return concat(Uint8Array.of(0xff, marker, (payload.length + 2) >>> 8, (payload.length + 2) & 0xff), payload);
}

function frame(): Uint8Array {
  return segment(0xc0, Uint8Array.of(8, 0, 3, 0, 4, 1, 1, 0x11, 0));
}

function scan(): Uint8Array {
  return concat(segment(0xda, Uint8Array.of(1, 1, 0, 0, 0x3f, 0)), Uint8Array.of(1, 2, 0xff, 0, 3));
}

function jpeg(...extra: Uint8Array[]): Uint8Array {
  return concat(Uint8Array.of(0xff, 0xd8), frame(), ...extra, scan(), Uint8Array.of(0xff, 0xd9));
}

function photoshopResource(id: number, data: Uint8Array): Uint8Array {
  const output = new Uint8Array(12 + data.length + (data.length & 1));
  output.set(Uint8Array.of(0x38, 0x42, 0x49, 0x4d, id >>> 8, id & 0xff, 0, 0), 0);
  new DataView(output.buffer).setUint32(8, data.length, false);
  output.set(data, 12);
  return output;
}

function photoshop(...resources: Uint8Array[]): Uint8Array {
  return concat(photoshopIdentifier, ...resources);
}

function profile(length = 132): Uint8Array {
  const output = new Uint8Array(length);
  new DataView(output.buffer).setUint32(0, length, false);
  output.set(Uint8Array.of(0x61, 0x63, 0x73, 0x70), 36);
  return output;
}

function extended(guid: string, total: number, offset: number, data: Uint8Array): Uint8Array {
  const output = new Uint8Array(extendedIdentifier.length + 40 + data.length);
  output.set(extendedIdentifier, 0);
  output.set(encoder.encode(guid), extendedIdentifier.length);
  new DataView(output.buffer).setUint32(extendedIdentifier.length + 32, total, false);
  new DataView(output.buffer).setUint32(extendedIdentifier.length + 36, offset, false);
  output.set(data, extendedIdentifier.length + 40);
  return output;
}

function icc(sequence: number, total: number, data: Uint8Array): Uint8Array {
  return concat(iccIdentifier, Uint8Array.of(sequence, total), data);
}

function errorOf(input: Uint8Array, options: unknown): JpegWriterError {
  try {
    rewriteJpegMetadata(input, options as never);
  } catch (error) {
    expect(error).toBeInstanceOf(JpegWriterError);
    return error as JpegWriterError;
  }
  throw new Error("expected the JPEG writer to reject the fixture");
}

describe("S06 JPEG writer validation and metadata-decision matrix", () => {
  it("validates every block kind, UTF-8 path, extended chunking path, and ICC chunking path", () => {
    const input = jpeg();
    const guid = "0123456789abcdef0123456789abcdef";
    const longXmp = "x".repeat(400);
    const standardReference = `<x:xmpmeta xmlns:x="adobe:ns:meta/" xmlns:xmpNote="http://ns.adobe.com/xmp/note/"><rdf:RDF><rdf:Description xmpNote:HasExtendedXMP="${guid.toUpperCase()}"/></rdf:RDF></x:xmpmeta>`;
    const extendedOutput = rewriteJpegMetadata(input, {
      blocks: [{ op: "add", kind: "standard-xmp", data: standardReference }, { op: "add", kind: "extended-xmp", guid, data: longXmp }],
      verify: false,
      limits: { maxSegmentBytes: 240 },
    });
    const extendedParsed = parseJpeg(extendedOutput.data, DEFAULT_LIMITS);
    expect(extendedParsed.xmp?.packets).toEqual(expect.arrayContaining([longXmp]));
    expect(extendedParsed.blocks?.filter(({ family }) => family === "XMP").length).toBeGreaterThan(1);

    const iccOutput = rewriteJpegMetadata(input, {
      blocks: [{ op: "add", kind: "icc", data: profile() }],
      verify: false,
      limits: { maxSegmentBytes: 64 },
    });
    expect(parseJpeg(iccOutput.data, DEFAULT_LIMITS).icc?.complete).toBe(true);
    expect(parseJpeg(iccOutput.data, DEFAULT_LIMITS).icc?.chunks).toBeGreaterThan(1);

    const iptcOutput = rewriteJpegMetadata(input, {
      blocks: [{ op: "add", kind: "iptc", data: Uint8Array.of(0x1c, 2, 5, 0, 1, 65) }],
      verify: false,
    });
    expect(parseJpeg(iptcOutput.data, DEFAULT_LIMITS).iptc?.byteLength).toBe(6);
    expect(errorOf(iccOutput.data, { blocks: [{ op: "add", kind: "icc", data: profile() }], verify: false }).code).toBe("INVALID_VALUE");
  });

  it("rejects malformed XMP, Photoshop, ICC, and Extended XMP structures before output", () => {
    const guid = "0123456789ABCDEF0123456789ABCDEF";
    const addXmp = { blocks: [{ op: "add", kind: "standard-xmp", data: "new" }], verify: false };
    const malformedPhotoshop = jpeg(segment(0xed, photoshop(Uint8Array.of(0x38, 0x42, 0x49))));
    expect(errorOf(malformedPhotoshop, addXmp).code).toBe("UNSAFE_STRUCTURE");
    const malformedXmp = jpeg(segment(0xe1, concat(xmpIdentifier, Uint8Array.of(0xff))));
    expect(errorOf(malformedXmp, addXmp).code).toBe("UNSAFE_STRUCTURE");
    const missingExtended = jpeg(segment(0xe1, concat(xmpIdentifier, encoder.encode(`<x:xmpmeta xmpNote:HasExtendedXMP="${guid}"/>`))));
    expect(errorOf(missingExtended, addXmp).code).toBe("UNSAFE_STRUCTURE");
    const orphanExtended = jpeg(segment(0xe1, extended(guid, 3, 0, encoder.encode("abc"))));
    expect(errorOf(orphanExtended, addXmp).code).toBe("UNSAFE_STRUCTURE");
    const incompleteExtended = jpeg(segment(0xe1, concat(xmpIdentifier, encoder.encode(`<x:xmpmeta xmpNote:HasExtendedXMP="${guid}"/>`))), segment(0xe1, extended(guid, 5, 0, encoder.encode("abc"))));
    expect(errorOf(incompleteExtended, addXmp).code).toBe("UNSAFE_STRUCTURE");
    const invalidIccHeader = jpeg(segment(0xe2, icc(1, 1, new Uint8Array(10))));
    expect(errorOf(invalidIccHeader, addXmp).code).toBe("UNSAFE_STRUCTURE");
    const incompleteIcc = jpeg(segment(0xe2, icc(1, 2, profile())));
    expect(errorOf(incompleteIcc, addXmp).code).toBe("UNSAFE_STRUCTURE");
    const duplicateIcc = jpeg(segment(0xe2, icc(1, 2, profile(132))), segment(0xe2, icc(1, 2, profile(132))));
    expect(errorOf(duplicateIcc, addXmp).code).toBe("UNSAFE_STRUCTURE");
    const inconsistentIcc = jpeg(segment(0xe2, icc(1, 2, profile())), segment(0xe2, icc(2, 3, profile())));
    expect(errorOf(inconsistentIcc, addXmp).code).toBe("UNSAFE_STRUCTURE");
  });

  it("validates all public block-edit option combinations and bounded value paths", () => {
    const input = jpeg();
    const validGuid = "0123456789ABCDEF0123456789ABCDEF";
    const cases: Array<{ edit: unknown; code: string }> = [
      { edit: null, code: "INVALID_VALUE" },
      { edit: { op: "replace", kind: "not-a-kind", data: "x" }, code: "INVALID_VALUE" },
      { edit: { op: "add", kind: "standard-xmp", blockId: "existing", data: "x" }, code: "INVALID_VALUE" },
      { edit: { op: "add", kind: "standard-xmp", guid: validGuid, data: "x" }, code: "INVALID_VALUE" },
      { edit: { op: "remove", kind: "standard-xmp", data: "x" }, code: "INVALID_VALUE" },
      { edit: { op: "replace", kind: "standard-xmp" }, code: "INVALID_VALUE" },
      { edit: { op: "add", kind: "extended-xmp", data: "x" }, code: "INVALID_VALUE" },
      { edit: { op: "add", kind: "extended-xmp", guid: "bad", data: "x" }, code: "INVALID_VALUE" },
      { edit: { op: "add", kind: "extended-xmp", guid: validGuid, blockId: "physical", data: "x" }, code: "INVALID_VALUE" },
      { edit: { op: "remove", kind: "extended-xmp", guid: validGuid, data: new Uint8Array() }, code: "INVALID_VALUE" },
      { edit: { op: "add", kind: "icc", guid: validGuid, data: profile() }, code: "INVALID_VALUE" },
      { edit: { op: "add", kind: "iptc", data: 1 }, code: "INVALID_VALUE" },
      { edit: { op: "add", kind: "photoshop-resource", resourceId: "resource", data: "x" }, code: "INVALID_VALUE" },
      { edit: { op: "replace", kind: "photoshop-resource", resourceId: "resource" }, code: "INVALID_VALUE" },
      { edit: { op: "remove", kind: "photoshop-resource", resourceId: "resource", guid: validGuid }, code: "INVALID_VALUE" },
    ];
    for (const item of cases) expect(errorOf(input, { blocks: [item.edit], verify: false }).code).toBe(item.code);
    expect(errorOf(input, { blocks: [{ op: "add", kind: "standard-xmp", data: "x" }], verify: false, limits: { maxValueBytes: 0 } }).code).toBe("INVALID_VALUE");
    expect(errorOf(input, { blocks: [{ op: "add", kind: "standard-xmp", data: Uint8Array.of(0xff) }], verify: false }).code).toBe("INVALID_VALUE");
    expect(errorOf(input, { blocks: [{ op: "add", kind: "extended-xmp", guid: validGuid, data: "" }], verify: false }).code).toBe("LIMIT_EXCEEDED");
    expect(errorOf(input, { blocks: [{ op: "add", kind: "extended-xmp", guid: validGuid, data: "x" }], verify: false, limits: { maxSegmentBytes: 70 } }).code).toBe("LIMIT_EXCEEDED");
    expect(errorOf(input, { blocks: [{ op: "add", kind: "icc", data: new Uint8Array(3) }], verify: false }).code).toBe("INVALID_VALUE");
  });

  it("preserves unrelated Photoshop resources while replacing and removing IPTC resources", () => {
    const iptc = Uint8Array.of(0x1c, 2, 5, 0, 1, 65);
    const other = Uint8Array.of(9, 8, 7);
    const input = jpeg(segment(0xed, photoshop(photoshopResource(0x0406, other), photoshopResource(0x0404, iptc))));
    const replaced = rewriteJpegMetadata(input, { blocks: [{ op: "replace", kind: "iptc", data: Uint8Array.of(0x1c, 2, 5, 0, 1, 90) }], verify: false });
    const replacedParsed = parseJpeg(replaced.data, DEFAULT_LIMITS);
    expect(replacedParsed.iptc?.byteLength).toBe(6);
    expect(replacedParsed.photoshop?.resources.some((resource) => resource.resourceId === 0x0406)).toBe(true);
    const removed = rewriteJpegMetadata(replaced.data, { blocks: [{ op: "remove", kind: "iptc" }], verify: false });
    expect(parseJpeg(removed.data, DEFAULT_LIMITS).iptc).toBeNull();
    expect(parseJpeg(removed.data, DEFAULT_LIMITS).photoshop?.resources.some((resource) => resource.resourceId === 0x0406)).toBe(true);
    const rawIim = jpeg(segment(0xed, iptc));
    expect(parseJpeg(rewriteJpegMetadata(rawIim, { blocks: [{ op: "replace", kind: "iptc", data: iptc }], verify: false }).data, DEFAULT_LIMITS).iptc?.byteLength).toBe(6);
  });
});
