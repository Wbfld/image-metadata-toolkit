import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { rewriteJpegMetadata } from "../src/jpeg-writer.js";
import { rewritePngMetadata } from "../src/png-writer.js";
import { rewriteWebpMetadata } from "../src/webp-writer.js";

async function fixture(name: string): Promise<Uint8Array> {
  return new Uint8Array(await readFile(new URL("./fixtures/" + name, import.meta.url)));
}

async function expectTypedFailure(operation: Promise<unknown> | (() => unknown), codes: readonly string[]): Promise<void> {
  try {
    await (typeof operation === "function" ? operation() : operation);
    throw new Error("expected the writer operation to fail");
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || typeof error.code !== "string") throw error;
    expect(codes).toContain(error.code);
  }
}

describe("S06 writer validation and atomic failure matrices", () => {
  it("rejects each truncated WebP boundary with a typed failure and never returns partial output", async () => {
    const input = await fixture("webp-metadata.webp");
    const edit = { blocks: [{ op: "add" as const, kind: "xmp" as const, data: "<x:xmpmeta/>" }] };
    for (let length = 0; length < input.length; length += 1) {
      await expectTypedFailure(() => rewriteWebpMetadata(input.subarray(0, length), edit), ["INVALID_VALUE", "UNSAFE_STRUCTURE", "LIMIT_EXCEEDED", "UNSUPPORTED_STRUCTURE", "VERIFICATION_FAILURE"]);
    }
    await expectTypedFailure(() => rewriteWebpMetadata(input, { ...edit, blocks: [] }), ["INVALID_VALUE"]);
    await expectTypedFailure(() => rewriteWebpMetadata(input, { ...edit, verify: "true" as never }), ["INVALID_VALUE"]);
    await expectTypedFailure(() => rewriteWebpMetadata(input, { ...edit, duplicatePolicy: "first" as never }), ["INVALID_VALUE"]);
    await expectTypedFailure(() => rewriteWebpMetadata(input, { ...edit, preservation: null as never }), ["INVALID_VALUE"]);
    await expectTypedFailure(() => rewriteWebpMetadata(input, { ...edit, preservation: { colorPolicy: "invalid" as never } }), ["INVALID_VALUE"]);
    await expectTypedFailure(() => rewriteWebpMetadata(input, { blocks: [{ op: "add", kind: "xmp", data: Uint8Array.of(0xff) }] }), ["INVALID_VALUE"]);
    await expectTypedFailure(() => rewriteWebpMetadata(input, { blocks: [{ op: "add", kind: "exif", data: Uint8Array.of(1, 2, 3) }] }), ["INVALID_VALUE"]);
    await expectTypedFailure(() => rewriteWebpMetadata(input, { blocks: [{ op: "add", kind: "icc", data: Uint8Array.of(1, 2, 3) }] }), ["INVALID_VALUE"]);
  }, 30_000);

  it("rejects each truncated PNG boundary and malformed option/value combination atomically", async () => {
    const input = await fixture("png-metadata.png");
    const edit = { blocks: [{ op: "add" as const, kind: "xmp" as const, data: "<x:xmpmeta/>" }] };
    for (let length = 0; length < input.length; length += 1) {
      await expectTypedFailure(rewritePngMetadata(input.subarray(0, length), edit), ["INVALID_VALUE", "UNSAFE_STRUCTURE", "LIMIT_EXCEEDED", "UNSUPPORTED_STRUCTURE", "VERIFICATION_FAILURE"]);
    }
    await expectTypedFailure(rewritePngMetadata(input, { ...edit, blocks: [] }), ["INVALID_VALUE"]);
    await expectTypedFailure(rewritePngMetadata(input, { ...edit, verify: "true" as never }), ["INVALID_VALUE"]);
    await expectTypedFailure(rewritePngMetadata(input, { ...edit, duplicatePolicy: "first" as never }), ["INVALID_VALUE"]);
    await expectTypedFailure(rewritePngMetadata(input, { ...edit, crcPolicy: "ignore" as never }), ["INVALID_VALUE"]);
    await expectTypedFailure(rewritePngMetadata(input, { ...edit, preservation: null as never }), ["INVALID_VALUE"]);
    await expectTypedFailure(rewritePngMetadata(input, { blocks: [{ op: "add", kind: "text", keyword: "", data: "x" }] }), ["INVALID_VALUE"]);
    await expectTypedFailure(rewritePngMetadata(input, { blocks: [{ op: "add", kind: "text", keyword: "x", data: 1 as never }] }), ["INVALID_VALUE"]);
    await expectTypedFailure(rewritePngMetadata(input, { blocks: [{ op: "add", kind: "xmp", data: Uint8Array.of(0xff) }] }), ["INVALID_VALUE"]);
  }, 30_000);

  it("rejects each truncated JPEG boundary and invalid block contracts with typed failures", async () => {
    const input = await fixture("jpeg-exif-little-endian.jpg");
    const edit = { blocks: [{ op: "add" as const, kind: "standard-xmp" as const, data: "<x:xmpmeta/>" }] };
    for (let length = 0; length < input.length; length += 1) {
      await expectTypedFailure(() => rewriteJpegMetadata(input.subarray(0, length), edit), ["INVALID_VALUE", "UNSAFE_STRUCTURE", "LIMIT_EXCEEDED", "UNSUPPORTED_STRUCTURE", "VERIFICATION_FAILURE"]);
    }
    await expectTypedFailure(() => rewriteJpegMetadata(input, { ...edit, blocks: [] }), ["INVALID_VALUE"]);
    await expectTypedFailure(() => rewriteJpegMetadata(input, { ...edit, verify: "true" as never }), ["INVALID_VALUE"]);
    await expectTypedFailure(() => rewriteJpegMetadata(input, { ...edit, duplicatePolicy: "first" as never }), ["INVALID_VALUE"]);
    await expectTypedFailure(() => rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "standard-xmp", blockId: "add" }] }), ["INVALID_VALUE"]);
    await expectTypedFailure(() => rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "standard-xmp", data: Uint8Array.of(0xff) }] }), ["INVALID_VALUE"]);
    await expectTypedFailure(() => rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "icc", data: Uint8Array.of(1, 2, 3) }] }), ["INVALID_VALUE"]);
    await expectTypedFailure(() => rewriteJpegMetadata(input, { blocks: [{ op: "remove", kind: "extended-xmp", data: "not-allowed" }] }), ["INVALID_VALUE"]);
  }, 30_000);
});
