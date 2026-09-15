import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as api from "../src/index.js";
import * as sidecar from "../src/xmp-sidecar.js";

describe("R01 stable public API contract", () => {
  it("keeps the documented root and sidecar runtime surface available", () => {
    for (const name of ["parseMetadata", "editMetadata", "redactMetadata", "sanitizeMetadata", "toJsonSafeResult", "parseXmpSidecar", "mergeXmpSources", "serializeXmpSidecar"] as const) expect(typeof api[name]).toBe("function");
    for (const name of ["parseXmpSidecar", "mergeXmpSources", "serializeXmpSidecar"] as const) expect(typeof sidecar[name]).toBe("function");
  });

  it("ships a versioned schema with the required discriminants and result families", () => {
    const schema = JSON.parse(readFileSync(join(process.cwd(), "schemas/r01-api-v1.schema.json"), "utf8")) as { version?: string; oneOf?: unknown[]; $defs?: Record<string, unknown> };
    expect(schema.version).toBe("1.0.0");
    expect(schema.oneOf).toHaveLength(5);
    expect(Object.keys(schema.$defs ?? {})).toEqual(expect.arrayContaining(["metadataResult", "editResult", "redactionResult", "sanitizationResult", "sidecarResult"]));
  });

  it("retains discriminated runtime outcomes and JSON-safe serialization", async () => {
    const fixture = new Uint8Array(readFileSync(join(process.cwd(), "tests/fixtures/jpeg-exif-little-endian.jpg")));
    const result = await api.parseMetadata(fixture);
    const serialized = api.toJsonSafeResult(result);
    expect(serialized).toMatchObject({ format: "jpeg", fileKind: "jpeg", completeness: { scope: "full" } });
    const edit = await api.editMetadata(fixture, { operations: [{ op: "set", operationId: "r01-invalid", target: { kind: "field", fieldId: "unsupported" }, value: "x" }] });
    if (edit.successful) expect(edit.data).toBeInstanceOf(Uint8Array);
    else expect(edit.data).toBeNull();
    expect(() => JSON.stringify(api.toJsonSafe(edit))).not.toThrow();
  });
});
