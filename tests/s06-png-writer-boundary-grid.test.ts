import { describe, expect, it } from "vitest";

import { rewritePngMetadata, PngWriterError } from "../src/png-writer.js";

const encoder = new TextEncoder();
const signature = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function crc32(bytes: Uint8Array, start: number, end: number): number {
  let crc = 0xffffffff;
  for (let offset = start; offset < end; offset += 1) {
    crc ^= bytes[offset] ?? 0;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array, validCrc = true): Uint8Array {
  const output = new Uint8Array(12 + data.length);
  const view = new DataView(output.buffer);
  view.setUint32(0, data.length, false);
  output.set(encoder.encode(type), 4);
  output.set(data, 8);
  view.setUint32(8 + data.length, validCrc ? crc32(output, 4, 8 + data.length) : 0, false);
  return output;
}

function png(chunks: readonly Uint8Array[]): Uint8Array {
  return Uint8Array.from([...signature, ...chunks.flatMap((value) => [...value])]);
}

function ihdr(width = 2, height = 2): Uint8Array {
  const data = new Uint8Array(13);
  const view = new DataView(data.buffer);
  view.setUint32(0, width, false); view.setUint32(4, height, false);
  data.set([8, 6, 0, 0, 0], 8);
  return chunk("IHDR", data);
}

function base(extra: readonly Uint8Array[] = []): Uint8Array {
  return png([ihdr(), ...extra, chunk("IDAT", Uint8Array.of(1, 2, 3)), chunk("IEND", new Uint8Array())]);
}

async function expectFailure(input: unknown, options: unknown, code: PngWriterError["code"]): Promise<void> {
  await expect(rewritePngMetadata(input as Uint8Array, options as never)).rejects.toThrow(expect.objectContaining({ name: "PngWriterError", code }));
}

describe("S06 PNG writer boundary grid", () => {
  it("rejects malformed chunk order, lengths, CRCs, critical types, and limits", async () => {
    const options = { blocks: [{ op: "add", kind: "text", keyword: "x", data: "y" }] } as const;
    await expectFailure(new Uint8Array(), options, "UNSAFE_STRUCTURE");
    await expectFailure(base().subarray(0, 8), options, "UNSAFE_STRUCTURE");
    await expectFailure(png([chunk("IDAT", Uint8Array.of(1)), chunk("IEND", new Uint8Array())]), options, "UNSAFE_STRUCTURE");
    await expectFailure(base([chunk("IHDR", new Uint8Array(13))]), options, "UNSAFE_STRUCTURE");
    await expectFailure(png([ihdr(0, 2), chunk("IDAT", Uint8Array.of(1)), chunk("IEND", new Uint8Array())]), options, "UNSAFE_STRUCTURE");
    await expectFailure(png([ihdr(), chunk("IEND", Uint8Array.of(1))]), options, "UNSAFE_STRUCTURE");
    await expectFailure(png([ihdr(), chunk("PLTE", Uint8Array.of(1)), chunk("IDAT", Uint8Array.of(1)), chunk("PLTE", Uint8Array.of(2)), chunk("IEND", new Uint8Array())]), options, "UNSAFE_STRUCTURE");
    await expectFailure(png([ihdr(), chunk("IDAT", Uint8Array.of(1)), chunk("PLTE", Uint8Array.of(2)), chunk("IEND", new Uint8Array())]), options, "UNSAFE_STRUCTURE");
    await expectFailure(png([ihdr(), chunk("IDAT", Uint8Array.of(1)), chunk("zzzz", Uint8Array.of(2)), chunk("IDAT", Uint8Array.of(3)), chunk("IEND", new Uint8Array())]), options, "UNSAFE_STRUCTURE");
    await expectFailure(png([ihdr(), chunk("Zzzz", Uint8Array.of(1)), chunk("IDAT", Uint8Array.of(2)), chunk("IEND", new Uint8Array())]), options, "UNSUPPORTED_STRUCTURE");
    await expectFailure(png([ihdr(), chunk("IDAT", Uint8Array.of(1), false), chunk("IEND", new Uint8Array())]), options, "UNSAFE_STRUCTURE");
    await expectFailure(base(), { ...options, c2pa: "preserve", limits: { maxAdapterOutputBytes: base().length } }, "LIMIT_EXCEEDED");
    await expectFailure(base(), { ...options, c2pa: "preserve", limits: { maxInputBytes: 20 } }, "LIMIT_EXCEEDED");
    await expectFailure(base(), { ...options, c2pa: "preserve", limits: { maxPngChunks: 2 } }, "LIMIT_EXCEEDED");
    await expectFailure(base(), { ...options, limits: { maxSegmentBytes: 1 } }, "LIMIT_EXCEEDED");
    await expectFailure(base(), { ...options, limits: { maxAdapterOutputBytes: 20 } }, "LIMIT_EXCEEDED");
  });

  it("validates all text, XMP, EXIF, ICC, compression, and policy inputs", async () => {
    const input = base();
    const failure = (blocks: unknown, code: PngWriterError["code"] = "INVALID_VALUE", extra: Record<string, unknown> = {}) => expectFailure(input, { blocks, ...extra }, code);
    await failure([{ op: "add", kind: "text", data: "value" }]);
    await failure([{ op: "add", kind: "text", keyword: "", data: "value" }]);
    await failure([{ op: "add", kind: "text", keyword: "bad\0", data: "value" }]);
    await failure([{ op: "add", kind: "text", keyword: "é", data: "value" }]);
    await failure([{ op: "add", kind: "text", keyword: "x", data: "Ā" }]);
    await failure([{ op: "add", kind: "text", keyword: "x", chunkType: "bad", data: "value" }]);
    await failure([{ op: "add", kind: "text", keyword: "x", chunkType: "tEXt", data: new Uint8Array([0xff]) }]);
    await failure([{ op: "add", kind: "text", keyword: "x", chunkType: "zTXt", data: new Uint8Array([1]) }]);
    await failure([{ op: "add", kind: "text", keyword: "x", chunkType: "iTXt", language: new Uint8Array([0xff]), data: "value" }]);
    await failure([{ op: "add", kind: "text", keyword: "x", chunkType: "iTXt", translatedKeyword: new Uint8Array([0xff]), data: "value" }]);
    await failure([{ op: "add", kind: "text", keyword: "x", chunkType: "iTXt", data: new Uint8Array([0xff]) }]);
    await failure([{ op: "add", kind: "xmp", data: new Uint8Array([0xff]) }]);
    await failure([{ op: "add", kind: "exif", data: new Uint8Array([1, 2, 3]) }]);
    await failure([{ op: "add", kind: "icc", data: new Uint8Array([1, 2, 3]) }]);
    await failure([{ op: "add", kind: "exif", data: new Uint8Array([1, 2, 3]) }], "LIMIT_EXCEEDED", { limits: { maxValueBytes: 1 } });
    await failure([{ op: "add", kind: "text", keyword: "x", chunkType: "zTXt", compressed: true, data: "value" }], "LIMIT_EXCEEDED", { limits: { maxValueBytes: 1 } });
    await failure([{ op: "add", kind: "text", keyword: "x", data: "value" }], "INVALID_VALUE", { verify: "yes" });
    await failure([{ op: "add", kind: "text", keyword: "x", data: "value" }], "INVALID_VALUE", { preservation: null });
    await failure([{ op: "add", kind: "text", keyword: "x", data: "value" }], "INVALID_VALUE", { preservation: { colorPolicy: "bad" } });
    await failure([{ op: "add", kind: "text", keyword: "x", data: "value" }], "INVALID_VALUE", { preservation: { orientationPolicy: "bad" } });
    await failure([{ op: "add", kind: "text", keyword: "x", data: "value" }], "INVALID_VALUE", { preservation: { requireCompletePayloadExtraction: "yes" } });
    await failure([{ op: "add", kind: "text", keyword: "x", data: "value" }], "INVALID_VALUE", { crcPolicy: "bad" });
    await expectFailure(input, { blocks: [{ op: "replace", kind: "xmp", data: "missing" }] }, "INVALID_VALUE");
    await expectFailure(input, { blocks: [{ op: "add", kind: "text", blockId: "forbidden", keyword: "x", data: "value" }] }, "INVALID_VALUE");
    await expectFailure(input, { blocks: [{ op: "bad", kind: "text", keyword: "x", data: "value" }] }, "INVALID_VALUE");
    await expectFailure(input, { blocks: [{ op: "add", kind: "bad", keyword: "x", data: "value" }] }, "INVALID_VALUE");
    await expectFailure(input, { blocks: [{ op: "add", kind: "text", keyword: "x", data: "value" }], duplicatePolicy: "bad" }, "INVALID_VALUE");
    await expectFailure(input, { blocks: [{ op: "add", kind: "text", keyword: "x", data: "value" }], preservation: [] }, "INVALID_VALUE");
  });

  it("retains image payloads while exercising duplicate selection and transaction routing", async () => {
    const duplicate = base([chunk("tEXt", Uint8Array.from([...encoder.encode("Same\0one")])), chunk("tEXt", Uint8Array.from([...encoder.encode("Same\0two")])), chunk("tEXt", Uint8Array.from([...encoder.encode("XML:com.adobe.xmp\0old")]))]);
    const replaced = await rewritePngMetadata(duplicate, { blocks: [{ op: "replace", kind: "text", keyword: "Same", data: "new" }], duplicatePolicy: "replace-target", verify: false });
    expect(replaced.preservedPayloads.length).toBeGreaterThan(0);
    await expectFailure(duplicate, { blocks: [{ op: "replace", kind: "text", keyword: "Same", data: "new" }], duplicatePolicy: "reject" }, "INVALID_VALUE");
    const { applyPngEditTransaction } = await import("../src/png-writer.js");
    const limits = (await import("../src/security/limits.js")).resolveLimits({ maxInputBytes: duplicate.length + 1024, maxAdapterOutputBytes: duplicate.length + 1024 });
    const policy = { preserve: [], remove: [], preserveRemovePrecedence: "preserve-wins", unknown: "preserve", ordering: { mode: "preserve-source" }, duplicates: "preserve", conflicts: "reject", verification: "none", orientation: "preserve", overlappingTargets: [] } as const;
    const xmpSet = await applyPngEditTransaction(duplicate, [{ op: "set", operationId: "xmp", target: { kind: "selector", selector: { kind: "family", family: "XMP" } }, value: "new" }], policy, limits);
    expect(xmpSet.operations[0]?.status).toBe("applied");
    const textDelete = await applyPngEditTransaction(duplicate, [{ op: "delete", operationId: "text", target: { kind: "selector", selector: { kind: "family", family: "PNGText" } } }], policy, limits);
    expect(textDelete.operations[0]?.status).toBe("applied");
    const unsupported = await applyPngEditTransaction(duplicate, [{ op: "remove-group", operationId: "unknown", target: { kind: "selector", selector: { kind: "family", family: "MakerNote" } } }], policy, limits);
    expect(unsupported.output).toBeNull();
  });

  it("checks every prefix of a valid PNG before permitting a metadata rewrite", async () => {
    const input = base([chunk("tEXt", Uint8Array.from([...encoder.encode("Author\0example")]))]);
    for (let length = 0; length <= input.length; length += 1) {
      try {
        const result = await rewritePngMetadata(input.subarray(0, length), { blocks: [{ op: "add", kind: "text", keyword: "x", data: "y" }], verify: false, c2pa: "preserve" });
        expect(result.data).toBeInstanceOf(Uint8Array);
      } catch (error) {
        expect(error).toBeInstanceOf(PngWriterError);
        expect((error as PngWriterError).code).toMatch(/^(?:UNSAFE_STRUCTURE|LIMIT_EXCEEDED|UNSUPPORTED_STRUCTURE|INVALID_VALUE)$/u);
      }
    }
  });
});
