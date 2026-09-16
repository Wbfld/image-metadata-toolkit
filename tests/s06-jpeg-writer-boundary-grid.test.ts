import { describe, expect, it } from "vitest";

import { applyJpegEditTransaction, rewriteJpegMetadata, JpegWriterError } from "../src/jpeg-writer.js";
import { parseJpeg } from "../src/parsers/jpeg.js";
import { resolveLimits } from "../src/security/limits.js";
import type { EditPolicyEvidence } from "../src/types.js";

const edit = { op: "add" as const, kind: "standard-xmp" as const, data: "x" };

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

function frame(marker = 0xc0, width = 4, height = 3, components = 1, precision = 8): Uint8Array {
  const payload = new Uint8Array(6 + components * 3);
  payload[0] = precision;
  payload[1] = (height >>> 8) & 0xff;
  payload[2] = height & 0xff;
  payload[3] = (width >>> 8) & 0xff;
  payload[4] = width & 0xff;
  payload[5] = components;
  for (let index = 0; index < components; index += 1) {
    payload[6 + index * 3] = index + 1;
    payload[7 + index * 3] = 0x11;
    payload[8 + index * 3] = 0;
  }
  return segment(marker, payload);
}

function scan(components = 1, extra = new Uint8Array()): Uint8Array {
  const payload = new Uint8Array(4 + components * 2);
  payload[0] = components;
  for (let index = 0; index < components; index += 1) {
    payload[1 + index * 2] = index + 1;
    payload[2 + index * 2] = 0;
  }
  payload[1 + components * 2] = 0;
  payload[2 + components * 2] = 0x3f;
  payload[3 + components * 2] = 0;
  return concat(segment(0xda, payload), extra);
}

function valid(extra: readonly Uint8Array[] = [], entropy = Uint8Array.of(1, 2, 3, 0xff, 0, 4)): Uint8Array {
  return concat(Uint8Array.of(0xff, 0xd8), frame(), ...extra, scan(1, entropy), Uint8Array.of(0xff, 0xd9));
}

function profile(length = 132): Uint8Array {
  const output = new Uint8Array(length);
  output[0] = (length >>> 24) & 0xff; output[1] = (length >>> 16) & 0xff; output[2] = (length >>> 8) & 0xff; output[3] = length & 0xff;
  output.set([0x61, 0x63, 0x73, 0x70], 36);
  return output;
}

function exif(make = "Boundary"): Uint8Array {
  const text = new TextEncoder().encode(`${make}\0`);
  const tiff = new Uint8Array(8 + 2 + 12 + 4 + text.length);
  tiff.set([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0], 0);
  tiff[8] = 1;
  tiff[10] = 0x0f;
  tiff[11] = 0x01;
  tiff[12] = 0x02;
  tiff[14] = text.length;
  tiff[18] = 8 + 2 + 12 + 4;
  tiff.set(text, 26);
  return concat(new TextEncoder().encode("Exif\0\0"), tiff);
}

function photoshopResource(id: number, payload: Uint8Array): Uint8Array {
  const output = new Uint8Array(12 + payload.length + (payload.length & 1));
  output.set([0x38, 0x42, 0x49, 0x4d, id >>> 8, id & 0xff, 0, 0], 0);
  new DataView(output.buffer).setUint32(8, payload.length, false);
  output.set(payload, 12);
  return output;
}

function policy(): EditPolicyEvidence {
  return {
    preserve: [], remove: [], preserveRemovePrecedence: "preserve-wins", unknown: "preserve", ordering: { mode: "preserve-source" },
    duplicates: "preserve", conflicts: "reject", verification: "none", orientation: "preserve", overlappingTargets: [],
  };
}

function writerError(input: Uint8Array, options: unknown = { blocks: [edit] }): JpegWriterError {
  try {
    rewriteJpegMetadata(input, options as never);
  } catch (error) {
    expect(error).toBeInstanceOf(JpegWriterError);
    return error as JpegWriterError;
  }
  throw new Error("expected rewriteJpegMetadata to reject the fixture");
}

describe("S06 JPEG writer structural boundary coverage", () => {
  it("rejects every marker, entropy, frame, scan, and arithmetic boundary with typed errors", () => {
    const cases: Array<[string, Uint8Array, string?]> = [
      ["empty input", Uint8Array.of(), "UNSAFE_STRUCTURE"],
      ["partial SOI", Uint8Array.of(0xff), "UNSAFE_STRUCTURE"],
      ["bytes outside marker", concat(Uint8Array.of(0xff, 0xd8), Uint8Array.of(1)), "UNSAFE_STRUCTURE"],
      ["marker prefix at end", concat(Uint8Array.of(0xff, 0xd8), Uint8Array.of(0xff)), "UNSAFE_STRUCTURE"],
      ["EOI before frame", Uint8Array.of(0xff, 0xd8, 0xff, 0xd9), "UNSAFE_STRUCTURE"],
      ["frame payload truncated", concat(Uint8Array.of(0xff, 0xd8), segment(0xc0, Uint8Array.of(8, 0, 3, 0, 4, 1))), "UNSAFE_STRUCTURE"],
      ["frame dimensions zero", concat(Uint8Array.of(0xff, 0xd8), frame(0xc0, 0, 3), scan(), Uint8Array.of(0xff, 0xd9)), "UNSAFE_STRUCTURE"],
      ["frame component table mismatch", concat(Uint8Array.of(0xff, 0xd8), segment(0xc0, Uint8Array.of(8, 0, 3, 0, 4, 1, 1, 0x11)), scan(), Uint8Array.of(0xff, 0xd9)), "UNSAFE_STRUCTURE"],
      ["scan before frame", concat(Uint8Array.of(0xff, 0xd8), scan(), Uint8Array.of(0xff, 0xd9)), "UNSAFE_STRUCTURE"],
      ["scan component count zero", concat(Uint8Array.of(0xff, 0xd8), frame(), scan(0), Uint8Array.of(0xff, 0xd9)), "UNSAFE_STRUCTURE"],
      ["scan component count excessive", concat(Uint8Array.of(0xff, 0xd8), frame(), scan(5), Uint8Array.of(0xff, 0xd9)), "UNSAFE_STRUCTURE"],
      ["scan payload mismatch", concat(Uint8Array.of(0xff, 0xd8), frame(), segment(0xda, Uint8Array.of(1, 1, 0)), Uint8Array.of(0xff, 0xd9)), "UNSAFE_STRUCTURE"],
      ["standalone zero marker", concat(Uint8Array.of(0xff, 0xd8), Uint8Array.of(0xff, 0)), "UNSAFE_STRUCTURE"],
      ["standalone restart marker", concat(Uint8Array.of(0xff, 0xd8), Uint8Array.of(0xff, 0xd0)), "UNSAFE_STRUCTURE"],
      ["segment length truncated", concat(Uint8Array.of(0xff, 0xd8), frame(), Uint8Array.of(0xff, 0xee, 0)), "UNSAFE_STRUCTURE"],
      ["segment length too small", concat(Uint8Array.of(0xff, 0xd8), frame(), Uint8Array.of(0xff, 0xee, 0, 1)), "UNSAFE_STRUCTURE"],
      ["segment extends past input", concat(Uint8Array.of(0xff, 0xd8), frame(), Uint8Array.of(0xff, 0xee, 0, 8, 1)), "UNSAFE_STRUCTURE"],
      ["second SOI", concat(Uint8Array.of(0xff, 0xd8), frame(), Uint8Array.of(0xff, 0xd8)), "UNSAFE_STRUCTURE"],
      ["DNL outside entropy", concat(Uint8Array.of(0xff, 0xd8), frame(), segment(0xdc, Uint8Array.of(0, 3))), "UNSAFE_STRUCTURE"],
      ["DNL in entropy", valid([], Uint8Array.of(1, 0xff, 0, 2, 0xff, 0xdc, 0, 4, 0, 3)), "UNSUPPORTED_STRUCTURE"],
    ];
    for (const [name, input, expectedCode] of cases) expect(writerError(input).code, name).toBe(expectedCode);

    const markerLimit = writerError(valid([Uint8Array.of(0xff, 0x01)]), { blocks: [edit], limits: { maxSegments: 1 } });
    expect(markerLimit.code).toBe("LIMIT_EXCEEDED");
    const metadataLimit = writerError(valid([segment(0xee, new Uint8Array(32))]), { blocks: [edit], limits: { maxMetadataBytes: 4 } });
    expect(metadataLimit.code).toBe("LIMIT_EXCEEDED");
    const segmentLimit = writerError(valid(), { blocks: [edit], limits: { maxSegmentBytes: 1 } });
    expect(segmentLimit.code).toBe("LIMIT_EXCEEDED");
  });

  it("covers option validation and entropy marker traversal without weakening output verification", () => {
    const entropyMarkers = valid([], Uint8Array.of(1, 0xff, 0xff, 0xd0, 2, 0xff, 0, 3));
    expect(rewriteJpegMetadata(entropyMarkers, { blocks: [edit], verify: false }).data.length).toBeGreaterThan(entropyMarkers.length);
    expect(writerError(valid(), null).code).toBe("INVALID_VALUE");
    expect(writerError(valid(), { blocks: [edit], preservation: null }).code).toBe("INVALID_VALUE");
    expect(writerError(valid(), { blocks: [edit], preservation: { colorPolicy: "invalid" } }).code).toBe("INVALID_VALUE");
    expect(writerError(valid(), { blocks: [edit], preservation: { orientationPolicy: "invalid" } }).code).toBe("INVALID_VALUE");
    expect(writerError(valid(), { blocks: [edit], preservation: { requireCompletePayloadExtraction: "yes" } }).code).toBe("INVALID_VALUE");
    expect(writerError(valid(), { blocks: [edit], duplicatePolicy: "invalid" }).code).toBe("INVALID_VALUE");
    expect(writerError(valid(), { blocks: [edit], mpf: { mode: "invalid" } }).code).toBe("INVALID_VALUE");
    expect(writerError(valid(), { blocks: [edit], limits: { maxInputBytes: 1 } }).code).toBe("LIMIT_EXCEEDED");
    expect(writerError(valid(), { blocks: [{ op: "add", kind: "standard-xmp" }] }).code).toBe("INVALID_VALUE");
    expect(writerError(valid(), { blocks: [{ op: "add", kind: "standard-xmp", data: 17 }] }).code).toBe("INVALID_VALUE");
  });

  it("checks every prefix of a structurally valid JPEG before allowing a write", () => {
    const source = valid([segment(0xfe, Uint8Array.of(0, 1, 2)), segment(0xee, Uint8Array.of(3, 4, 5))]);
    for (let length = 0; length <= source.length; length += 1) {
      const prefix = source.subarray(0, length);
      try {
        const result = rewriteJpegMetadata(prefix, { blocks: [edit], verify: false });
        expect(result.data).toBeInstanceOf(Uint8Array);
      } catch (error) {
        expect(error).toBeInstanceOf(JpegWriterError);
        expect((error as JpegWriterError).code).toMatch(/^(?:UNSAFE_STRUCTURE|LIMIT_EXCEEDED|UNSUPPORTED_STRUCTURE|INVALID_VALUE)$/u);
      }
    }
  });

  it("executes each metadata block path, exact Photoshop selection, and transaction routing", () => {
    const guid = "0123456789ABCDEF0123456789ABCDEF";
    const standard = `<x:xmpmeta xmlns:x="adobe" xmpNote:HasExtendedXMP="${guid}"/>`;
    const source = valid();
    const added = rewriteJpegMetadata(source, {
      blocks: [
        { op: "add", kind: "standard-xmp", data: standard },
        { op: "add", kind: "extended-xmp", guid, data: "<rdf:RDF/>" },
        { op: "add", kind: "icc", data: profile() },
        { op: "add", kind: "iptc", data: Uint8Array.of(0x1c, 2, 5, 0, 1, 90) },
      ],
      verify: false,
    });
    expect(parseJpeg(added.data, resolveLimits()).xmp?.packets).toEqual([standard, "<rdf:RDF/>"]);
    expect(parseJpeg(added.data, resolveLimits()).icc?.complete).toBe(true);
    expect(parseJpeg(added.data, resolveLimits()).iptc?.byteLength).toBe(6);

    const replaced = rewriteJpegMetadata(added.data, {
      blocks: [
        { op: "replace", kind: "standard-xmp", data: `<x:xmpmeta xmlns:x="adobe" xmpNote:HasExtendedXMP="${guid}">replacement</x:xmpmeta>` },
        { op: "replace", kind: "extended-xmp", guid, data: "extended replacement" },
        { op: "replace", kind: "icc", data: profile(140) },
        { op: "replace", kind: "iptc", data: Uint8Array.of(0x1c, 2, 5, 0, 1, 88) },
      ],
      verify: false,
    });
    expect(parseJpeg(replaced.data, resolveLimits()).icc?.byteLength).toBe(140);
    const removed = rewriteJpegMetadata(replaced.data, {
      blocks: [
        { op: "remove", kind: "standard-xmp" },
        { op: "remove", kind: "extended-xmp", guid },
        { op: "remove", kind: "icc" },
        { op: "remove", kind: "iptc" },
      ],
      verify: false,
    });
    expect(parseJpeg(removed.data, resolveLimits()).xmp).toBeNull();
    expect(parseJpeg(removed.data, resolveLimits()).icc).toBeNull();
    expect(parseJpeg(removed.data, resolveLimits()).iptc).toBeNull();

    const photoshop = valid([segment(0xed, concat(new TextEncoder().encode("Photoshop 3.0\0"), photoshopResource(0x0404, Uint8Array.of(0x1c, 2, 5, 0, 1, 65)), photoshopResource(0x0406, Uint8Array.of(9, 8))))]);
    const parsedPhotoshop = parseJpeg(photoshop, resolveLimits()).photoshop;
    const resourceId = parsedPhotoshop?.resources[0]?.id;
    expect(resourceId).toBeTypeOf("string");
    if (resourceId === undefined) throw new Error("expected a Photoshop resource identity");
    const exact = rewriteJpegMetadata(photoshop, { blocks: [{ op: "remove", kind: "photoshop-resource", resourceId }], verify: false });
    expect(parseJpeg(exact.data, resolveLimits()).photoshop?.resources).toHaveLength(1);

    const limits = resolveLimits({ maxInputBytes: source.length + 4096, maxAdapterOutputBytes: source.length + 4096 });
    const xmpSet = applyJpegEditTransaction(source, [{ op: "set", operationId: "xmp", target: { kind: "selector", selector: { kind: "family", family: "XMP" } }, value: "packet" }], policy(), limits);
    expect(xmpSet.operations[0]?.status).toBe("applied");
    const xmpDelete = applyJpegEditTransaction(xmpSet.output ?? source, [{ op: "remove-group", operationId: "xmp-remove", target: { kind: "selector", selector: { kind: "family", family: "XMP" } } }], policy(), limits);
    expect(xmpDelete.operations[0]?.status).toBe("applied");
    const merge = applyJpegEditTransaction(source, [{ op: "merge-sidecar", operationId: "sidecar", target: { kind: "selector", selector: { kind: "family", family: "XMP" } }, sidecar: { id: "test-sidecar", format: "xmp", data: "sidecar" } }], policy(), limits);
    expect(merge.operations[0]?.status).toBe("applied");
    const unsupported = applyJpegEditTransaction(source, [{ op: "copy", operationId: "copy", source: { kind: "field", fieldId: "XMP:standard" }, destination: { kind: "field", fieldId: "XMP:standard" } }], policy(), limits);
    expect(unsupported.output).toBeNull();
  });

  it("covers transaction policy, ordering, exact targets, sidecars, and typed failures", () => {
    const source = valid([
      segment(0xe1, exif()),
      segment(0xe1, concat(new TextEncoder().encode("http://ns.adobe.com/xap/1.0/\0"), new TextEncoder().encode("one"))),
    ]);
    const limits = resolveLimits({ maxInputBytes: source.length + 4096, maxAdapterOutputBytes: source.length + 4096 });

    const noExifDelete = applyJpegEditTransaction(valid(), [{ op: "delete", operationId: "missing-exif", target: { kind: "field", fieldId: "normalized:Make" }, }], policy(), limits);
    expect(noExifDelete.output).not.toBeNull();
    expect(noExifDelete.operations[0]?.status).toBe("applied");
    expect(noExifDelete.operations[0]?.appliedCount).toBe(0);

    const exifSet = applyJpegEditTransaction(source, [{ op: "set", operationId: "make", target: { kind: "field", fieldId: "normalized:Make" }, value: "changed" }], policy(), limits);
    expect(exifSet.operations[0]?.status).toBe("applied");
    expect(exifSet.operations[0]?.matchedFieldIds).toContain("EXIF:IFD0:0x010f");

    const parsed = parseJpeg(source, limits);
    const xmpBlock = parsed.blocks?.find((block) => block.family === "XMP");
    if (xmpBlock === undefined) throw new Error("expected an XMP block for exact-target coverage");
    const exactReplace = applyJpegEditTransaction(source, [{ op: "set", operationId: "exact-xmp", target: { kind: "selector", selector: { kind: "block", blockId: xmpBlock.id } }, value: "exact" }], policy(), limits);
    expect(exactReplace.operations[0]?.status).toBe("applied");
    expect(exactReplace.operations[0]?.matchedBlockIds).toContain(xmpBlock.id);

    const blockFamilyOperations = [
      { op: "set" as const, operationId: "icc-add", target: { kind: "selector" as const, selector: { kind: "family" as const, family: "ICC" as const } }, value: profile() },
      { op: "set" as const, operationId: "iptc-add", target: { kind: "selector" as const, selector: { kind: "family" as const, family: "IPTC" as const } }, value: Uint8Array.of(0x1c, 2, 5, 0, 1, 65) },
    ];
    const families = applyJpegEditTransaction(source, blockFamilyOperations, policy(), limits);
    expect(families.output).toBeInstanceOf(Uint8Array);
    expect(families.operations.every((operation) => operation.status === "applied")).toBe(true);

    const removedExif = applyJpegEditTransaction(source, [{ op: "remove-group", operationId: "remove-exif", target: { kind: "selector", selector: { kind: "family", family: "EXIF" } } }], policy(), limits);
    expect(removedExif.output).toBeInstanceOf(Uint8Array);
    expect(removedExif.operations[0]?.appliedCount).toBe(1);

    const ordered = applyJpegEditTransaction(source, [
      { op: "set", operationId: "second", target: { kind: "selector", selector: { kind: "family", family: "ICC" } }, value: profile() },
      { op: "set", operationId: "first", target: { kind: "selector", selector: { kind: "family", family: "XMP" } }, value: "ordered" },
    ], { ...policy(), ordering: { mode: "operation-order", operationIds: ["first", "second"] } }, limits);
    expect(ordered.output).toBeInstanceOf(Uint8Array);
    expect(ordered.operations.map((operation) => operation.operationId)).toEqual(["second", "first"]);

    const preserved = applyJpegEditTransaction(source, [{ op: "remove-group", operationId: "preserved", target: { kind: "selector", selector: { kind: "family", family: "XMP" } } }], { ...policy(), preserve: [{ kind: "selector", selector: { kind: "family", family: "XMP" } }] }, limits);
    expect(preserved.output).toBeNull();
    expect(preserved.operations[0]?.status).toBe("policy-failure");

    const conflicting = applyJpegEditTransaction(source, [
      { op: "set", operationId: "one", target: { kind: "selector", selector: { kind: "family", family: "XMP" } }, value: "one" },
      { op: "set", operationId: "two", target: { kind: "selector", selector: { kind: "family", family: "XMP" } }, value: "two" },
    ], policy(), limits);
    expect(conflicting.output).toBeNull();
    expect(conflicting.operations.map((operation) => operation.status)).toEqual(["invalid-value"]);

    const invalidValue = applyJpegEditTransaction(source, [{ op: "set", operationId: "bad-value", target: { kind: "selector", selector: { kind: "family", family: "XMP" } }, value: { nested: true } }], policy(), limits);
    expect(invalidValue.output).toBeNull();
    expect(invalidValue.operations[0]?.status).toBe("invalid-value");

    const orphanExtended = applyJpegEditTransaction(source, [{ op: "set", operationId: "orphan", target: { kind: "field", fieldId: "XMP:extended" }, value: "extended" }], policy(), limits);
    expect(orphanExtended.output).toBeNull();
    expect(orphanExtended.operations[0]?.status).toBe("unsupported");

    const wrongSidecar = applyJpegEditTransaction(source, [{ op: "merge-sidecar", operationId: "wrong-sidecar", target: { kind: "selector", selector: { kind: "family", family: "XMP" } }, sidecar: { id: "iptc", format: "iptc-iim", data: Uint8Array.of(1) } }], policy(), limits);
    expect(wrongSidecar.output).toBeNull();
    expect(wrongSidecar.operations[0]?.status).toBe("invalid-value");

    const unsupportedPolicy = applyJpegEditTransaction(source, [{ op: "remove-policy", operationId: "policy", target: { kind: "selector", selector: { kind: "policy", policyId: "share-safe" } } }], policy(), limits);
    expect(unsupportedPolicy.output).toBeNull();
    expect(unsupportedPolicy.operations[0]?.status).toBe("unsupported");

    const missingPhysicalBlock = applyJpegEditTransaction(source, [{ op: "set", operationId: "missing-block", target: { kind: "selector", selector: { kind: "block", blockId: "jpeg:APP1:missing" } }, value: "not-added" }], policy(), limits);
    expect(missingPhysicalBlock.output).toBeNull();
    expect(missingPhysicalBlock.operations[0]?.status).toBe("unsupported");
  });

  it("enumerates every selector identity and EXIF creation fallback without broadening removal", () => {
    const limits = resolveLimits({ maxInputBytes: 64 * 1024, maxAdapterOutputBytes: 64 * 1024 });
    const selectors = [
      { kind: "family" as const, family: "XMP" as const },
      { kind: "block" as const, blockId: "jpeg:APP1:missing" },
      { kind: "namespace-property" as const, namespaceUri: "urn:example", localName: "value" },
      { kind: "field-id" as const, fieldId: "XMP:standard" },
      { kind: "associated-image" as const, imageId: "thumbnail" },
      { kind: "sensitivity" as const, sensitivity: "high" as const },
      { kind: "photoshop-resource" as const, resourceId: "app13:resource:1" },
      { kind: "policy" as const, policyId: "share-safe" },
    ];
    for (const selector of selectors) {
      const target = { kind: "selector" as const, selector };
      const transaction = applyJpegEditTransaction(valid(), [{ op: "delete", operationId: `preserve-${selector.kind}`, target }], { ...policy(), preserve: [target] }, limits);
      expect(transaction.output).toBeNull();
      expect(transaction.operations[0]?.status).toBe("policy-failure");
    }

    for (const [operationId, value] of [["ascii", "value"], ["number", 7]] as const) {
      const transaction = applyJpegEditTransaction(valid(), [{ op: "set", operationId, target: { kind: "field", fieldId: "EXIF:IFD0:0x9999" }, value }], policy(), limits);
      expect(transaction.output).toBeInstanceOf(Uint8Array);
      expect(transaction.operations[0]?.status).toBe("applied");
    }
    const unsupportedValue = applyJpegEditTransaction(valid(), [{ op: "set", operationId: "object", target: { kind: "field", fieldId: "EXIF:IFD0:0x9999" }, value: { unsupported: true } }], policy(), limits);
    expect(unsupportedValue.output).toBeNull();
    expect(unsupportedValue.operations[0]?.status).toBe("unsafe-structure");

    expect(() => rewriteJpegMetadata(valid(), { blocks: [{ op: "add", kind: "icc", data: profile(70_000) }], limits: { maxSegmentBytes: 256 } })).toThrow(/255 JPEG ICC chunks/);
    expect(() => applyJpegEditTransaction(valid(), [], policy(), limits)).toThrow(JpegWriterError);
    expect(() => applyJpegEditTransaction(valid(), "not-an-array" as never, policy(), limits)).toThrow(JpegWriterError);
  });

  it("covers malformed Photoshop resources, ICC sequences, and XMP relationship boundaries", () => {
    const photoshop = new TextEncoder().encode("Photoshop 3.0\0");
    const malformedPhotoshop: readonly Uint8Array[] = [
      photoshop,
      concat(photoshop, Uint8Array.of(0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00)),
      concat(photoshop, Uint8Array.of(0x38, 0x42, 0x49, 0x4d, 0x04, 0x04, 0x00, 0x00, 0x00)),
      concat(photoshop, Uint8Array.of(0x38, 0x42, 0x49, 0x4d, 0x04, 0x04, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff)),
      concat(photoshop, Uint8Array.of(0x38, 0x42, 0x49, 0x4d, 0x04, 0x04, 0x01, 0x41, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff)),
      concat(photoshop, photoshopResource(0x0404, Uint8Array.of(1, 2, 3)), Uint8Array.of(0xff)),
    ];
    const firstMalformedPhotoshop = malformedPhotoshop[0];
    if (!firstMalformedPhotoshop) throw new Error("missing Photoshop boundary fixture");
    expect(rewriteJpegMetadata(valid([segment(0xed, firstMalformedPhotoshop)]), { blocks: [edit], verify: false }).data).toBeInstanceOf(Uint8Array);
    for (const payload of malformedPhotoshop.slice(1)) expect(writerError(valid([segment(0xed, payload)])).code).toMatch(/^(?:UNSAFE_STRUCTURE|LIMIT_EXCEEDED)$/u);

    const guid = "0123456789ABCDEF0123456789ABCDEF";
    const extendedIdentifier = new TextEncoder().encode("http://ns.adobe.com/xmp/extension/\0");
    const extendedChunk = (total: number, offset: number, data: string): Uint8Array => concat(extendedIdentifier, new TextEncoder().encode(guid), Uint8Array.of((total >>> 24) & 0xff, (total >>> 16) & 0xff, (total >>> 8) & 0xff, total & 0xff, (offset >>> 24) & 0xff, (offset >>> 16) & 0xff, (offset >>> 8) & 0xff, offset & 0xff), new TextEncoder().encode(data));
    const extendedCases = [
      [extendedChunk(5, 0, "abc"), "incomplete"],
      [extendedChunk(3, 2, "XYZ"), "overlap"],
      [extendedChunk(3, 0, "abc"), "complete"],
    ] as const;
    const standardRef = concat(new TextEncoder().encode("http://ns.adobe.com/xap/1.0/\0"), new TextEncoder().encode(`<x:xmpmeta xmlns:x="adobe" xmpNote:HasExtendedXMP="${guid}"/>`));
    expect(() => rewriteJpegMetadata(valid([segment(0xe1, extendedCases[0][0])]), { blocks: [edit] })).toThrow(JpegWriterError);
    expect(() => rewriteJpegMetadata(valid([segment(0xe1, standardRef), segment(0xe1, extendedChunk(3, 4, "a"))]), { blocks: [edit] })).toThrow(JpegWriterError);
    const completeExtended = rewriteJpegMetadata(valid([segment(0xe1, standardRef), segment(0xe1, extendedCases[2][0])]), { blocks: [edit], verify: false });
    expect(completeExtended.data).toBeInstanceOf(Uint8Array);

    const iccIdentifier = new TextEncoder().encode("ICC_PROFILE\0");
    const iccChunk = (sequence: number, total: number, bytes: Uint8Array): Uint8Array => concat(iccIdentifier, Uint8Array.of(sequence, total), bytes);
    const validProfile = profile();
    const iccCases: readonly Uint8Array[][] = [
      [iccChunk(1, 2, validProfile)],
      [iccChunk(1, 1, validProfile), iccChunk(1, 1, validProfile)],
      [iccChunk(1, 2, validProfile), iccChunk(2, 3, validProfile)],
      [iccChunk(1, 1, validProfile.slice(0, 131))],
      [iccChunk(1, 1, Uint8Array.of(1, 2, 3))],
    ];
    for (const chunks of iccCases) {
      const input = valid(chunks.map((payload) => segment(0xe2, payload)));
      expect(writerError(input).code).toMatch(/^(?:UNSAFE_STRUCTURE|LIMIT_EXCEEDED)$/u);
    }
    const prefixedXmp = concat(new TextEncoder().encode("http://ns.adobe.com/xap/1.0/\0"), new TextEncoder().encode("<rdf:RDF/>"));
    const normalized = rewriteJpegMetadata(valid(), { blocks: [{ op: "add", kind: "standard-xmp", data: prefixedXmp }], verify: false });
    expect(parseJpeg(normalized.data, resolveLimits()).xmp?.packets).toEqual(["<rdf:RDF/>"]);
  });
});
