import { describe, expect, it } from "vitest";

import { editMetadata } from "../src/edit.js";

const input = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const field = (fieldId: string) => ({ kind: "field" as const, fieldId });
const family = (name: string) => ({ kind: "selector" as const, selector: { kind: "family" as const, family: name } });

async function invalid(options: Record<string, unknown>): Promise<void> {
  const result = await editMetadata(input, options as never);
  expect(result.output).toBeNull();
  expect(["invalid-value", "mixed-failure"]).toContain(result.status);
  expect(result.operations.length).toBeGreaterThan(0);
  expect(result.diagnostics.some((diagnostic) => diagnostic.code === "INVALID_VALUE")).toBe(true);
}

describe("S06 edit validation and preflight matrix", () => {
  it("rejects every malformed selector, operation shape, value, sidecar, and target policy before allocation", async () => {
    const inheritedValue: object = {};
    Object.setPrototypeOf(inheritedValue, { inherited: true });
    const operations = [
      null,
      {},
      { op: "unknown", operationId: "unknown", target: field("XMP:title"), value: "x" },
      { op: "set", operationId: "", target: field("XMP:title"), value: "x" },
      { op: "set", operationId: "control\u0000", target: field("XMP:title"), value: "x" },
      { op: "set", operationId: "bad-field", target: field(":bad"), value: "x" },
      { op: "set", operationId: "bad-selector", target: { kind: "selector", selector: { kind: "family", family: "NotAFamily" } }, value: "x" },
      { op: "set", operationId: "bad-uri", target: { kind: "selector", selector: { kind: "namespace-property", namespaceUri: "relative", localName: "title" } }, value: "x" },
      { op: "set", operationId: "bad-local", target: { kind: "selector", selector: { kind: "namespace-property", namespaceUri: "https://example.test/ns/", localName: "" } }, value: "x" },
      { op: "set", operationId: "bad-value", target: field("XMP:title"), value: undefined },
      { op: "set", operationId: "bad-prototype", target: field("XMP:title"), value: inheritedValue },
      { op: "delete", operationId: "bad-delete", target: { kind: "selector", selector: { kind: "family", family: "bad" } } },
      { op: "copy", operationId: "missing-source", source: field("XMP:title") },
      { op: "rename", operationId: "same-target", source: field("XMP:title"), destination: field("XMP:title") },
      { op: "alias", operationId: "bad-destination", source: field("XMP:title"), destination: field(":bad") },
      { op: "remove-group", operationId: "wrong-group", target: field("XMP:title") },
      { op: "remove-policy", operationId: "wrong-policy", target: family("XMP") },
      { op: "merge-sidecar", operationId: "bad-sidecar", target: field("XMP:title"), sidecar: { id: "", format: "xmp", data: "x" } },
      { op: "merge-sidecar", operationId: "bad-media", target: field("XMP:title"), sidecar: { id: "sidecar", format: "xmp", mediaType: "text/plain", data: "x" } },
      { op: "merge-sidecar", operationId: "bad-data", target: field("XMP:title"), sidecar: { id: "sidecar", format: "xmp", data: new Uint8Array() } },
      { op: "merge-sidecar", operationId: "bad-merge-policy", target: field("XMP:title"), sidecar: { id: "sidecar", format: "xmp", data: "x" }, mergePolicy: "overwrite" },
    ];
    await invalid({ operations });
  });

  it("validates every explicit policy branch and reports conflicting shorthand deterministically", async () => {
    const target = field("XMP:title");
    const validOperations = [{ op: "set", operationId: "set-title", target, value: "title" }];
    const validPolicies = [
      { preserve: [target], remove: [target], preserveRemovePrecedence: "preserve-wins", unknown: "preserve", ordering: { mode: "preserve-source" }, duplicates: "preserve", conflicts: "preserve-all", verification: "none", orientation: "preserve", mpf: { mode: "preserve", ultraHdr: "preserve" } },
      { unknown: "remove-unselected", ordering: { mode: "canonical" }, duplicates: "replace-target", conflicts: "prefer-existing", verification: "reparse", orientation: "report-only" },
      { unknown: "reject", ordering: { mode: "operation-order", operationIds: ["set-title"] }, duplicates: "deduplicate-equivalent", conflicts: "prefer-requested", verification: "reparse-and-preserve-payload", orientation: "allow-change" },
    ];
    for (const policy of validPolicies) {
      const result = await editMetadata(input, { operations: validOperations as never, policy: policy as never });
      expect(result.policy).toMatchObject(policy);
    }
    await invalid({ operations: validOperations, policy: { preserve: "not-array" } });
    await invalid({ operations: validOperations, policy: { preserve: [null] } });
    await invalid({ operations: validOperations, policy: { preserveRemovePrecedence: "remove-wins" } });
    await invalid({ operations: validOperations, policy: { unknown: "maybe" } });
    await invalid({ operations: validOperations, policy: { ordering: { mode: "operation-order", operationIds: ["other"] } } });
    await invalid({ operations: validOperations, policy: { ordering: { mode: "operation-order", operationIds: ["set-title", "set-title"] } } });
    await invalid({ operations: validOperations, policy: { duplicates: "maybe" } });
    await invalid({ operations: validOperations, policy: { conflicts: "maybe" } });
    await invalid({ operations: validOperations, policy: { verification: "maybe" } });
    await invalid({ operations: validOperations, policy: { orientation: "maybe" } });
    await invalid({ operations: validOperations, policy: { mpf: { mode: "invalidate" } } });
    await invalid({ operations: validOperations, policy: { unknown: "preserve" }, preserveUnknown: false });
    await invalid({ operations: validOperations, policy: { verification: "none" }, verifyImagePayload: true });
    await invalid({ operations: validOperations, preserveUnknown: "yes" });
    await invalid({ operations: validOperations, verifyImagePayload: "yes" });
    await invalid({ operations: validOperations, policy: null });
  });

  it("bounds recursive edit values and sidecar bytes without accepting unsupported object kinds", async () => {
    const deep: Record<string, unknown> = {};
    let cursor = deep;
    for (let index = 0; index < 40; index += 1) { cursor.next = {}; cursor = cursor.next as Record<string, unknown>; }
    await invalid({ operations: [{ op: "set", operationId: "deep", target: field("XMP:title"), value: deep }] });
    await invalid({ operations: [{ op: "set", operationId: "nan", target: field("XMP:title"), value: Number.NaN }] });
    await invalid({ operations: [{ op: "set", operationId: "symbol", target: field("XMP:title"), value: Symbol("not-serializable") }] });
    await invalid({ operations: [{ op: "merge-sidecar", operationId: "too-large", target: field("XMP:title"), sidecar: { id: "sidecar", format: "iptc-iim", data: new Uint8Array([1, 2, 3, 4]) } }], limits: { maxValueBytes: 2 } });
  });
});
