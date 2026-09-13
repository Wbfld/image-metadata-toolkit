import { describe, expect, it } from "vitest";

import { editMetadata } from "../src/edit.js";
import type { EditOperation } from "../src/types.js";

const input = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function field(fieldId: string) {
  return { kind: "field" as const, fieldId };
}

function family(familyName: "EXIF" | "XMP") {
  return { kind: "selector" as const, selector: { kind: "family" as const, family: familyName } };
}

function policy(policyId: string) {
  return { kind: "selector" as const, selector: { kind: "policy" as const, policyId } };
}

describe("W01 edit transaction contract", () => {
  it("validates every operation kind and returns explicit unsupported evidence without writing bytes", async () => {
    const operations = [
      { op: "set", operationId: "set-caption", target: field("XMP:dc:description"), value: { "x-default": "Caption" } },
      { op: "delete", operationId: "delete-gps", target: { kind: "selector" as const, selector: { kind: "sensitivity" as const, sensitivity: "high" as const } } },
      { op: "copy", operationId: "copy-title", source: field("XMP:dc:title"), destination: field("XMP:photoshop:Headline") },
      { op: "rename", operationId: "rename-author", source: field("XMP:dc:creator"), destination: field("XMP:iptc:Creator") },
      { op: "alias", operationId: "alias-rights", source: field("XMP:dc:rights"), destination: field("XMP:plus:LicensorURL") },
      { op: "remove-group", operationId: "remove-xmp", target: family("XMP") },
      { op: "remove-policy", operationId: "remove-policy", target: policy("share-safe") },
      { op: "merge-sidecar", operationId: "merge-sidecar", target: family("XMP"), sidecar: { id: "caption.xmp", format: "xmp" as const, data: "<x:xmpmeta>\n</x:xmpmeta>" } },
    ] satisfies readonly EditOperation[];

    const result = await editMetadata(input, {
      operations,
      policy: { ordering: { mode: "canonical" }, duplicates: "preserve", conflicts: "preserve-all" },
      verifyImagePayload: true,
    });

    expect(result.successful).toBe(false);
    expect(result.status).toBe("unsupported");
    expect(result.data).toBeNull();
    expect(result.format).toBeNull();
    expect(result.input).toEqual({ examined: false, format: null, byteLength: null, sha256: null, sourceMutated: false });
    expect(result.output).toBeNull();
    expect(result.operations.map(({ operationId, status }) => [operationId, status])).toEqual(operations.map(({ operationId }) => [operationId, "unsupported"]));
    expect(result.unapplied.map(({ operationId }) => operationId)).toEqual(operations.map(({ operationId }) => operationId));
    expect(result.operations.every(({ failure }) => failure?.code === "UNSUPPORTED_OPERATION")).toBe(true);
    expect(result.diagnostics.every(({ code }) => code === "UNSUPPORTED_OPERATION")).toBe(true);
    expect(result.warnings).toEqual([]);
    expect(result.policy.unknown).toBe("preserve");
    expect(result.policy.preserveRemovePrecedence).toBe("preserve-wins");
    expect(result.policy.verification).toBe("reparse-and-preserve-payload");
    expect(result.verification).toEqual({
      policy: "reparse-and-preserve-payload",
      status: "not-run",
      checked: [],
      failure: { code: "UNSUPPORTED_OPERATION", detail: "Verification is deferred because no output bytes were generated." },
    });
    expect(input).toEqual(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  });

  it("makes preserve-over-remove precedence machine-readable", async () => {
    const result = await editMetadata(input, {
      operations: [{ op: "delete", operationId: "delete-caption", target: field("XMP:dc:description") }],
      policy: {
        preserve: [field("XMP:dc:description")],
        remove: [field("XMP:dc:description")],
      },
    });

    expect(result.status).toBe("policy-failure");
    expect(result.operations[0]).toMatchObject({
      operationId: "delete-caption",
      status: "policy-failure",
      failure: { code: "POLICY_FAILURE" },
    });
    expect(result.unapplied[0]).toMatchObject({ operationId: "delete-caption", status: "policy-failure" });
    expect(result.policy.overlappingTargets).toEqual([field("XMP:dc:description")]);
  });

  it("rejects invalid values, non-canonical fields, unsafe selectors, and invalid sidecars before planning", async () => {
    const operations = [
      { op: "set", operationId: "bad-field", target: field("EXIF"), value: "value" },
      { op: "merge-sidecar", operationId: "bad-uri", target: { kind: "selector" as const, selector: { kind: "namespace-property" as const, namespaceUri: "not a URI", localName: "title" } }, sidecar: { id: "sidecar", format: "iptc-iim" as const, data: new Uint8Array([1]) } },
      { op: "set", operationId: "bad-value", target: field("XMP:dc:title"), value: undefined as never },
    ] satisfies readonly EditOperation[];

    const result = await editMetadata(input, { operations });

    expect(result.status).toBe("invalid-value");
    expect(result.operations.map(({ status }) => status)).toEqual(["invalid-value", "invalid-value", "invalid-value"]);
    expect(result.operations.map(({ failure }) => failure?.code)).toEqual(["INVALID_VALUE", "INVALID_VALUE", "INVALID_VALUE"]);
    expect(result.unapplied).toHaveLength(3);
    expect(result.output).toBeNull();
  });

  it("bounds recursive values and operation ordering without turning a no-op into success", async () => {
    const result = await editMetadata(input, {
      operations: [
        { op: "set", operationId: "one", target: field("XMP:dc:title"), value: { first: "a", second: "b" } },
        { op: "set", operationId: "two", target: field("XMP:dc:subject"), value: "subject" },
      ],
      limits: { maxAdapterItems: 1 },
      policy: { ordering: { mode: "operation-order", operationIds: ["two", "one"] } },
    });

    expect(result.status).toBe("invalid-value");
    expect(result.diagnostics.some(({ detail }) => detail.includes("operation limit"))).toBe(true);
    expect(result.diagnostics.some(({ detail }) => detail.includes("operation-order"))).toBe(true);
  });

  it("exposes explicit unknown, duplicate, conflict, sidecar, and verification policies", async () => {
    const result = await editMetadata(input, {
      operations: [{ op: "set", operationId: "set-title", target: field("XMP:dc:title"), value: ["first", "second"] }],
      policy: {
        unknown: "reject",
        ordering: { mode: "preserve-source" },
        duplicates: "reject",
        conflicts: "reject",
        verification: "none",
      },
    });

    expect(result.policy).toMatchObject({
      unknown: "reject",
      ordering: { mode: "preserve-source" },
      duplicates: "reject",
      conflicts: "reject",
      verification: "none",
    });
    expect(result.verification).toEqual({ policy: "none", status: "not-run", checked: [], failure: null });
  });

  it("accepts each explicit selector form and the unknown-preservation shorthand", async () => {
    const operations = [
      { op: "set", operationId: "namespace", target: { kind: "selector" as const, selector: { kind: "namespace-property" as const, namespaceUri: "https://example.test/ns/", localName: "title" } }, value: "title" },
      { op: "set", operationId: "block", target: { kind: "selector" as const, selector: { kind: "block" as const, blockId: "xmp:0" } }, value: "value" },
      { op: "set", operationId: "associated", target: { kind: "selector" as const, selector: { kind: "associated-image" as const, imageId: "primary" } }, value: "value" },
      { op: "set", operationId: "field-selector", target: { kind: "selector" as const, selector: { kind: "field-id" as const, fieldId: "XMP:dc:title" } }, value: "value" },
      { op: "set", operationId: "family", target: family("XMP"), value: "value" },
    ] satisfies readonly EditOperation[];

    const result = await editMetadata(input, { operations, preserveUnknown: false });

    expect(result.status).toBe("unsupported");
    expect(result.operations.every(({ status }) => status === "unsupported")).toBe(true);
    expect(result.policy.unknown).toBe("remove-unselected");
  });

  it("rejects cyclic, oversized, and contradictory input without throwing a partial result", async () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    const result = await editMetadata(input, {
      operations: [{ op: "set", operationId: "cyclic", target: field("XMP:dc:title"), value: cyclic as never }],
      limits: { maxValueBytes: 3 },
      policy: { unknown: "preserve", verification: "none" },
      preserveUnknown: false,
    });

    expect(result.status).toBe("invalid-value");
    expect(result.operations[0]).toMatchObject({ status: "invalid-value", failure: { code: "INVALID_VALUE" } });
    expect(result.output).toBeNull();
    expect(result.diagnostics.filter(({ code }) => code === "INVALID_VALUE").length).toBeGreaterThanOrEqual(2);
  });

  it("reports duplicate operation identities as invalid instead of guessing an order", async () => {
    const result = await editMetadata(input, {
      operations: [
        { op: "delete", operationId: "same", target: field("XMP:dc:title") },
        { op: "delete", operationId: "same", target: field("XMP:dc:subject") },
      ],
    });

    expect(result.status).toBe("mixed-failure");
    expect(result.diagnostics.some(({ detail }) => detail.includes("unique"))).toBe(true);
    expect(result.unapplied.map(({ operationId }) => operationId)).toEqual(["same", "same"]);
  });

  it("distinguishes an invalid input from a valid but unsupported operation", async () => {
    const result = await editMetadata("not image bytes" as never, {
      operations: [{ op: "set", operationId: "set-title", target: field("XMP:dc:title"), value: "title" }],
    });

    expect(result.status).toBe("mixed-failure");
    expect(result.operations[0]?.failure?.code).toBe("UNSUPPORTED_OPERATION");
    expect(result.diagnostics.some(({ code }) => code === "INVALID_VALUE")).toBe(true);
  });

  it("honors cancellation using the package cancellation error", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(editMetadata(input, {
      operations: [{ op: "delete", operationId: "delete-title", target: field("XMP:dc:title") }],
      signal: controller.signal,
    })).rejects.toMatchObject({ code: "ABORTED" });
  });
});
