import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { editMetadata } from "../src/edit.js";
import { parseMetadata } from "../src/index.js";
import type { EditOperation, EditTarget } from "../src/types.js";

async function fixture(name: string): Promise<Uint8Array> {
  return new Uint8Array(await readFile(new URL(`./fixtures/${name}`, import.meta.url)));
}

function family(value: "EXIF" | "XMP" | "IPTC" | "ICC"): EditTarget {
  return { kind: "selector", selector: { kind: "family", family: value } };
}

function field(fieldId: string): EditTarget {
  return { kind: "field", fieldId };
}

async function apply(input: Uint8Array, operation: EditOperation, options: Record<string, unknown> = {}) {
  return editMetadata(input, { operations: [operation], ...options });
}

describe("S06 edit dispatcher and public evidence matrix", () => {
  it("emits complete successful evidence for TIFF, JPEG, PNG, and WebP writer paths", async () => {
    const cases: Array<{ name: string; operation: EditOperation; format: "tiff" | "jpeg" | "png" | "webp" }> = [
      { name: "tiff-metadata.tif", operation: { op: "set", operationId: "tiff-make", target: field("IFD0:0x010f"), value: "Edited TIFF" }, format: "tiff" },
      { name: "jpeg-exif-little-endian.jpg", operation: { op: "set", operationId: "jpeg-xmp", target: family("XMP"), value: "edited JPEG packet" }, format: "jpeg" },
      { name: "png-metadata.png", operation: { op: "set", operationId: "png-xmp", target: family("XMP"), value: "edited PNG packet" }, format: "png" },
      { name: "webp-metadata.webp", operation: { op: "set", operationId: "webp-xmp", target: family("XMP"), value: "edited WebP packet" }, format: "webp" },
    ];
    for (const item of cases) {
      const input = await fixture(item.name);
      const result = await apply(input, item.operation, { verifyImagePayload: false });
      expect(result.successful, item.name).toBe(true);
      expect(result.status, item.name).toBe("applied");
      expect(result.format, item.name).toBe(item.format);
      expect(result.data, item.name).toBeInstanceOf(Uint8Array);
      expect(result.input.examined, item.name).toBe(true);
      expect(result.input.sourceMutated, item.name).toBe(false);
      expect(result.output?.generated, item.name).toBe(true);
      expect(result.output?.byteLength, item.name).toBeGreaterThan(0);
      expect(result.operations[0], item.name).toMatchObject({ operationId: item.operation.operationId, status: "applied", failure: null });
      expect(result.verification, item.name).toMatchObject({ status: "passed", failure: null });
      expect(result.diagnostics, item.name).toEqual([]);
      if (!result.data) throw new Error(`missing generated ${item.name} output`);
      const reparsed = await parseMetadata(result.data);
      expect(reparsed.format, item.name).toBe(item.format);
    }
  });

  it("keeps successful operation evidence and marks it as uncommitted when a later writer operation fails", async () => {
    const input = await fixture("jpeg-exif-little-endian.jpg");
    const result = await editMetadata(input, {
      operations: [
        { op: "set", operationId: "first", target: family("XMP"), value: "first" },
        { op: "set", operationId: "bad", target: family("ICC"), value: { unsupported: true } },
      ],
      verifyImagePayload: false,
    } as never);
    expect(result.successful).toBe(false);
    expect(result.data).toBeNull();
    expect(result.operations.map(({ operationId }) => operationId)).toEqual(["first", "bad"]);
    expect(result.operations.every(({ status }) => status !== "applied")).toBe(true);
    expect(result.unapplied.map(({ operationId }) => operationId)).toEqual(["first", "bad"]);
  });

  it("maps typed writer failures to format-specific public results without allocating output", async () => {
    const cases: Array<{ name: string; operation: EditOperation; limit: Record<string, number>; format: string }> = [
      { name: "jpeg-exif-little-endian.jpg", operation: { op: "set", operationId: "jpeg", target: family("XMP"), value: "x" }, limit: { maxInputBytes: 1 }, format: "jpeg" },
      { name: "png-metadata.png", operation: { op: "set", operationId: "png", target: family("XMP"), value: "x" }, limit: { maxInputBytes: 1 }, format: "png" },
      { name: "webp-metadata.webp", operation: { op: "set", operationId: "webp", target: family("XMP"), value: "x" }, limit: { maxInputBytes: 1 }, format: "webp" },
      { name: "tiff-metadata.tif", operation: { op: "set", operationId: "tiff", target: field("IFD0:0x010f"), value: "x" }, limit: { maxInputBytes: 1 }, format: "tiff" },
    ];
    for (const item of cases) {
      const result = await apply(await fixture(item.name), item.operation, { limits: item.limit, verifyImagePayload: false });
      expect(result.successful, item.name).toBe(false);
      expect(result.status, item.name).toBe("unsafe-structure");
      expect(result.format, item.name).toBe(item.format);
      expect(result.data, item.name).toBeNull();
      expect(result.output, item.name).toBeNull();
      expect(result.input.examined, item.name).toBe(true);
      expect(result.operations[0]?.failure?.code, item.name).toBe("UNSAFE_STRUCTURE");
    }
  });

  it("exercises policy, sidecar, ordering, and preservation validation as typed preflight failures", async () => {
    const input = await fixture("png-metadata.png");
    const baseOperation: EditOperation = { op: "set", operationId: "value", target: family("XMP"), value: "x" };
    const cases: Array<{ options: Record<string, unknown>; detail: string }> = [
      { options: { policy: "invalid" }, detail: "policy must be an object" },
      { options: { policy: { preserve: "invalid" } }, detail: "policy.preserve" },
      { options: { policy: { remove: [{ kind: "field", fieldId: "bad" }] } }, detail: "policy.remove" },
      { options: { policy: { preserveRemovePrecedence: "remove-wins" } }, detail: "preserveRemovePrecedence" },
      { options: { policy: { unknown: "invalid" } }, detail: "policy.unknown" },
      { options: { policy: { ordering: { mode: "invalid" } } }, detail: "policy.ordering" },
      { options: { policy: { ordering: { mode: "operation-order", operationIds: ["other"] } } }, detail: "operation-order" },
      { options: { policy: { duplicates: "invalid" } }, detail: "policy.duplicates" },
      { options: { policy: { conflicts: "invalid" } }, detail: "policy.conflicts" },
      { options: { policy: { verification: "invalid" } }, detail: "policy.verification" },
      { options: { policy: { orientation: "invalid" } }, detail: "policy.orientation" },
      { options: { policy: { mpf: { mode: "invalid" } } }, detail: "policy.mpf" },
      { options: { verifyImagePayload: "yes" }, detail: "verifyImagePayload" },
      { options: { policy: { verification: "none" }, verifyImagePayload: true }, detail: "conflicts" },
      { options: { policy: { unknown: "preserve" }, preserveUnknown: false }, detail: "conflicts" },
    ];
    for (const item of cases) {
      const result = await apply(input, baseOperation, item.options);
      expect(result.successful, item.detail).toBe(false);
      expect(result.output, item.detail).toBeNull();
      expect(result.diagnostics.some(({ detail }) => detail.includes(item.detail)), item.detail).toBe(true);
    }
  });
});
