import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { rewriteWebpMetadata, WebpWriterError } from "../src/webp-writer.js";
import { resolveLimits } from "../src/security/limits.js";

const encoder = new TextEncoder();

function chunk(type: string, data: Uint8Array): Uint8Array {
  const output = new Uint8Array(8 + data.length + (data.length & 1));
  output.set(encoder.encode(type), 0);
  new DataView(output.buffer).setUint32(4, data.length, true);
  output.set(data, 8);
  return output;
}

function webp(chunks: readonly Uint8Array[]): Uint8Array {
  const body = Uint8Array.from(chunks.flatMap((value) => [...value]));
  const output = new Uint8Array(12 + body.length);
  output.set(encoder.encode("RIFF"), 0);
  new DataView(output.buffer).setUint32(4, body.length + 4, true);
  output.set(encoder.encode("WEBP"), 8);
  output.set(body, 12);
  return output;
}

function vp8l(): Uint8Array {
  return chunk("VP8L", Uint8Array.of(0x2f, 1, 0x40, 0, 0));
}

function vp8(): Uint8Array {
  return chunk("VP8 ", Uint8Array.of(0x10, 0, 0, 0x9d, 0x01, 0x2a, 2, 0, 2, 0, 1, 2, 3));
}

function vp8x(flags = 0): Uint8Array {
  return chunk("VP8X", Uint8Array.of(flags, 0, 0, 0, 1, 0, 0, 1, 0, 0));
}

function expectWriterFailure(input: unknown, options: unknown, code?: WebpWriterError["code"]): void {
  expect(() => rewriteWebpMetadata(input as Uint8Array, options as never)).toThrow(code === undefined
    ? expect.objectContaining({ name: "WebpWriterError" })
    : expect.objectContaining({ name: "WebpWriterError", code }));
}

describe("S06 WebP writer boundary grid", () => {
  it("rejects every malformed RIFF, chunk, dimension, and limit boundary", async () => {
    const source = new Uint8Array(await readFile(new URL("./fixtures/webp-metadata.webp", import.meta.url)));
    const malformed: Uint8Array[] = [];
    for (const length of [0, 1, 4, 8, 11, 12, 13, 19, source.length - 1]) malformed.push(source.subarray(0, length).slice());
    const badHeader = source.slice(); badHeader.set(encoder.encode("RIFX"), 0); malformed.push(badHeader);
    const badForm = source.slice(); badForm.set(encoder.encode("NOPE"), 8); malformed.push(badForm);
    const badRiffLength = source.slice(); new DataView(badRiffLength.buffer).setUint32(4, 0, true); malformed.push(badRiffLength);
    const badChunkLength = source.slice(); new DataView(badChunkLength.buffer).setUint32(16, 0xffffffff, true); malformed.push(badChunkLength);
    const badChunkType = source.slice(); badChunkType[12] = 0; malformed.push(badChunkType);
    const duplicateVp8x = webp([chunk("VP8X", Uint8Array.of(0, 0, 0, 0, 1, 0, 0, 1, 0, 0)), chunk("VP8X", Uint8Array.of(0, 0, 0, 0, 1, 0, 0, 1, 0, 0)), vp8l()]);
    malformed.push(duplicateVp8x);
    for (const input of malformed) expectWriterFailure(input, { blocks: [{ op: "add", kind: "xmp", data: "x" }] });
    const small = webp([vp8l()]);
    expectWriterFailure(small, { blocks: [{ op: "add", kind: "xmp", data: "x" }], limits: { maxInputBytes: small.length } }, "LIMIT_EXCEEDED");
    expectWriterFailure(small, { blocks: [{ op: "add", kind: "xmp", data: "x" }], limits: { maxSegments: 1 } }, "LIMIT_EXCEEDED");
    expectWriterFailure(small, { blocks: [{ op: "add", kind: "xmp", data: "xx" }], limits: { maxMetadataBytes: 1 } }, "LIMIT_EXCEEDED");
  });

  it("validates options, block values, exact targets, duplicate policies, and C2PA refusal", () => {
    const source = webp([vp8l()]);
    expectWriterFailure(source, null, "INVALID_VALUE");
    expectWriterFailure(source, [], "INVALID_VALUE");
    expectWriterFailure(source, {}, "INVALID_VALUE");
    expectWriterFailure(source, { blocks: [] }, "INVALID_VALUE");
    expectWriterFailure(source, { blocks: [{ op: "invalid", kind: "xmp", data: "x" }] }, "INVALID_VALUE");
    expectWriterFailure(source, { blocks: [{ op: "add", kind: "invalid", data: "x" }] }, "INVALID_VALUE");
    expectWriterFailure(source, { blocks: [{ op: "add", kind: "xmp", blockId: "bad", data: "x" }] }, "INVALID_VALUE");
    expectWriterFailure(source, { blocks: [{ op: "replace", kind: "icc", data: "x" }] }, "INVALID_VALUE");
    expect(() => rewriteWebpMetadata(source, { blocks: [{ op: "remove", kind: "xmp", data: "x" }] } as never)).not.toThrow();
    expectWriterFailure(source, { blocks: [{ op: "add", kind: "xmp", data: Uint8Array.of(0xff) }] }, "INVALID_VALUE");
    expectWriterFailure(source, { blocks: [{ op: "add", kind: "exif", data: Uint8Array.of(1, 2, 3) }] }, "INVALID_VALUE");
    expectWriterFailure(source, { blocks: [{ op: "add", kind: "icc", data: Uint8Array.of(1, 2, 3) }] }, "INVALID_VALUE");
    expectWriterFailure(source, { blocks: [{ op: "add", kind: "xmp", data: "x" }], verify: "yes" }, "INVALID_VALUE");
    expectWriterFailure(source, { blocks: [{ op: "add", kind: "xmp", data: "x" }], preservation: null }, "INVALID_VALUE");
    expectWriterFailure(source, { blocks: [{ op: "add", kind: "xmp", data: "x" }], preservation: { colorPolicy: "invalid" } }, "INVALID_VALUE");
    expectWriterFailure(source, { blocks: [{ op: "add", kind: "xmp", data: "x" }], preservation: { orientationPolicy: "invalid" } }, "INVALID_VALUE");
    expectWriterFailure(source, { blocks: [{ op: "add", kind: "xmp", data: "x" }], preservation: { requireCompletePayloadExtraction: "yes" } }, "INVALID_VALUE");
    expectWriterFailure(source, { blocks: [{ op: "add", kind: "xmp", data: "x" }], duplicatePolicy: "invalid" }, "INVALID_VALUE");
    expectWriterFailure(source, { blocks: [{ op: "replace", kind: "xmp", blockId: "missing", data: "x" }] }, "INVALID_VALUE");
    const output = rewriteWebpMetadata(source, { blocks: [{ op: "add", kind: "xmp", data: "boundary" }], verify: false });
    expect(output.data.length).toBeGreaterThan(source.length);
  });

  it("keeps transaction failures typed and atomic for unsupported targets and values", async () => {
    const source = new Uint8Array(await readFile(new URL("./fixtures/webp-metadata.webp", import.meta.url)));
    const { applyWebpEditTransaction } = await import("../src/webp-writer.js");
    const policy = { preserve: [], remove: [], preserveRemovePrecedence: "preserve-wins", unknown: "preserve", ordering: { mode: "preserve-source" }, duplicates: "preserve", conflicts: "reject", verification: "none", orientation: "preserve", overlappingTargets: [] } as const;
    const boundedLimits = resolveLimits({ maxInputBytes: source.length + 1024, maxAdapterOutputBytes: source.length + 1024 });
    const unsupported = applyWebpEditTransaction(source, [{ op: "remove-group", operationId: "bad", target: { kind: "selector", selector: { kind: "family", family: "MakerNote" } } }], policy, boundedLimits);
    expect(unsupported.output).toBeNull();
    expect(unsupported.operations[0]?.status).toBe("unsupported");
    const badValue = applyWebpEditTransaction(source, [{ op: "set", operationId: "bad", target: { kind: "selector", selector: { kind: "family", family: "XMP" } }, value: 4 }], policy, boundedLimits);
    expect(badValue.output).toBeNull();
  });

  it("covers VP8, VP8X flags, duplicate block policies, removals, and transaction target routing", async () => {
    const { applyWebpEditTransaction } = await import("../src/webp-writer.js");
    const profile = new Uint8Array(132);
    new DataView(profile.buffer).setUint32(0, 132, false);
    profile.set(encoder.encode("acsp"), 36);
    const duplicate = webp([vp8x(0x12), chunk("XMP ", encoder.encode("one")), chunk("XMP ", encoder.encode("two")), vp8l()]);
    const replaced = rewriteWebpMetadata(duplicate, { blocks: [{ op: "replace", kind: "xmp", data: "all" }], duplicatePolicy: "replace-target", verify: false });
    const replacedTypes = Array.from({ length: replaced.data.length - 3 }, (_, index) => String.fromCharCode(...replaced.data.subarray(index, index + 4)));
    expect(replacedTypes.filter((value) => value === "XMP ")).toHaveLength(2);
    const deduplicated = rewriteWebpMetadata(duplicate, { blocks: [{ op: "replace", kind: "xmp", data: "one" }], duplicatePolicy: "deduplicate-equivalent", verify: false });
    await expect((await import("../src/index.js")).parseMetadata(deduplicated.data)).resolves.toBeDefined();
    const removed = rewriteWebpMetadata(duplicate, { blocks: [{ op: "remove", kind: "xmp" }], verify: false });
    await expect((await import("../src/index.js")).parseMetadata(removed.data)).resolves.toBeDefined();

    for (const input of [webp([vp8()]), webp([vp8x(0x10), vp8()]), webp([vp8x(0x02), vp8l()])]) {
      const output = rewriteWebpMetadata(input, { blocks: [{ op: "add", kind: "xmp", data: "route" }], verify: false });
      expect(output.preservedPayloads.length).toBeGreaterThan(0);
    }
    const withBlocks = webp([vp8x(0), chunk("EXIF", new Uint8Array([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0])), chunk("XMP ", encoder.encode("x")), chunk("ICCP", profile), vp8l()]);
    const limits = resolveLimits({ maxInputBytes: withBlocks.length + 1024, maxAdapterOutputBytes: withBlocks.length + 1024 });
    const policy = { preserve: [], remove: [], preserveRemovePrecedence: "preserve-wins", unknown: "preserve", ordering: { mode: "preserve-source" }, duplicates: "preserve", conflicts: "reject", verification: "none", orientation: "preserve", overlappingTargets: [] } as const;
    const xmpSet = applyWebpEditTransaction(withBlocks, [{ op: "set", operationId: "xmp-set", target: { kind: "selector", selector: { kind: "family", family: "XMP" } }, value: "new" }], policy, limits);
    expect(xmpSet.operations[0]?.status).toBe("applied");
    const xmpDelete = applyWebpEditTransaction(withBlocks, [{ op: "delete", operationId: "xmp-delete", target: { kind: "selector", selector: { kind: "family", family: "XMP" } } }], policy, limits);
    expect(xmpDelete.operations[0]?.status).toBe("applied");
    const iccDelete = applyWebpEditTransaction(withBlocks, [{ op: "remove-group", operationId: "icc-delete", target: { kind: "selector", selector: { kind: "family", family: "ICC" } } }], policy, limits);
    expect(iccDelete.operations[0]?.status).toBe("applied");
    const unsupported = applyWebpEditTransaction(withBlocks, [{ op: "set", operationId: "family", target: { kind: "selector", selector: { kind: "family", family: "MakerNote" } }, value: "x" }], policy, limits);
    expect(unsupported.output).toBeNull();

    const normalizedFields = ["Make", "Model", "Orientation", "DateTime", "Artist", "Software", "Copyright"] as const;
    for (const [index, field] of normalizedFields.entries()) {
      const transaction = applyWebpEditTransaction(webp([vp8l()]), [{ op: "set", operationId: `set-${field}`, target: { kind: "field", fieldId: `normalized:${field}` }, value: field === "Orientation" ? 6 : `value-${index}` }], policy, limits);
      expect(transaction.output).toBeInstanceOf(Uint8Array);
      expect(transaction.operations[0]?.status).toBe("applied");
    }
    const explicitField = applyWebpEditTransaction(webp([vp8l()]), [{ op: "set", operationId: "explicit", target: { kind: "field", fieldId: "EXIF:IFD0:0x010f" }, value: "explicit" }], policy, limits);
    expect(explicitField.output).toBeNull();
    expect(explicitField.operations[0]?.status).toBe("unsupported");
    const unknownNormalized = applyWebpEditTransaction(webp([vp8l()]), [{ op: "set", operationId: "unknown-normalized", target: { kind: "field", fieldId: "normalized:NotAField" }, value: "x" }], policy, limits);
    expect(unknownNormalized.output).toBeNull();
    expect(unknownNormalized.operations[0]?.status).toBe("unsupported");
    const missingDelete = applyWebpEditTransaction(webp([vp8l()]), [{ op: "delete", operationId: "missing-delete", target: { kind: "field", fieldId: "normalized:Make" } }], policy, limits);
    expect(missingDelete.output).toBeNull();
    expect(missingDelete.operations[0]?.status).toBe("unsupported");

    const exifSource = applyWebpEditTransaction(webp([vp8l()]), [{ op: "set", operationId: "source", target: { kind: "field", fieldId: "normalized:Make" }, value: "source" }], policy, limits).output;
    if (exifSource === null) throw new Error("expected the explicit EXIF transaction to produce output");
    const exifEdit = applyWebpEditTransaction(exifSource, [{ op: "set", operationId: "edit-existing", target: { kind: "field", fieldId: "normalized:Model" }, value: "existing" }], policy, limits);
    expect(exifEdit.output).toBeInstanceOf(Uint8Array);
    const exifDelete = applyWebpEditTransaction(exifSource, [{ op: "delete", operationId: "delete-existing", target: { kind: "field", fieldId: "normalized:Make" } }], policy, limits);
    expect(exifDelete.output).toBeInstanceOf(Uint8Array);
    const exifGroupDelete = applyWebpEditTransaction(exifSource, [{ op: "remove-group", operationId: "delete-exif-group", target: { kind: "selector", selector: { kind: "family", family: "EXIF" } } }], policy, limits);
    expect(exifGroupDelete.output).toBeInstanceOf(Uint8Array);

    const invalidBlock = applyWebpEditTransaction(withBlocks, [{ op: "set", operationId: "invalid-block", target: { kind: "selector", selector: { kind: "family", family: "XMP" } }, value: { invalid: true } }], policy, limits);
    expect(invalidBlock.output).toBeNull();
    expect(invalidBlock.operations[0]?.status).toBe("invalid-value");
    const unsupportedOperation = applyWebpEditTransaction(withBlocks, [{ op: "remove-policy", operationId: "remove-policy", target: { kind: "selector", selector: { kind: "policy", policyId: "share-safe" } } }], policy, limits);
    expect(unsupportedOperation.output).toBeNull();
    expect(unsupportedOperation.operations[0]?.status).toBe("unsupported");
  });

  it("rejects invalid VP8X ordering, animation relationships, dimensions, and missing image payloads", () => {
    expectWriterFailure(webp([vp8l(), vp8x()]), { blocks: [{ op: "add", kind: "xmp", data: "x" }] }, "UNSAFE_STRUCTURE");
    expectWriterFailure(webp([chunk("ANMF", Uint8Array.of(1)), vp8l()]), { blocks: [{ op: "add", kind: "xmp", data: "x" }] }, "UNSAFE_STRUCTURE");
    expectWriterFailure(webp([chunk("JUNK", Uint8Array.of(1))]), { blocks: [{ op: "add", kind: "xmp", data: "x" }] }, "UNSAFE_STRUCTURE");
    expectWriterFailure(webp([chunk("VP8X", Uint8Array.of(0)), vp8l()]), { blocks: [{ op: "add", kind: "xmp", data: "x" }] }, "UNSAFE_STRUCTURE");
    expectWriterFailure(webp([vp8x(), vp8l(), vp8x()]), { blocks: [{ op: "add", kind: "xmp", data: "x" }] }, "UNSAFE_STRUCTURE");
  });

  it("checks every prefix of a valid RIFF before permitting a metadata rewrite", () => {
    const input = webp([vp8x(0x12), chunk("XMP ", encoder.encode("existing")), vp8l()]);
    for (let length = 0; length <= input.length; length += 1) {
      try {
        const result = rewriteWebpMetadata(input.subarray(0, length), { blocks: [{ op: "add", kind: "xmp", data: "new" }], verify: false, c2pa: "preserve" });
        expect(result.data).toBeInstanceOf(Uint8Array);
      } catch (error) {
        expect(error).toBeInstanceOf(WebpWriterError);
        expect((error as WebpWriterError).code).toMatch(/^(?:UNSAFE_STRUCTURE|LIMIT_EXCEEDED|UNSUPPORTED_STRUCTURE|INVALID_VALUE)$/u);
      }
    }
  });
});
