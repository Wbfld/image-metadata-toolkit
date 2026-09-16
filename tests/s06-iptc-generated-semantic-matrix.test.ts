import { describe, expect, it } from "vitest";

import { IPTC_TECHREFERENCE_PROPERTIES } from "../src/generated/iptc-pmd.js";
import { parseIptcMetadata } from "../src/metadata/iptc.js";
import { deriveIptcSemantic } from "../src/normalize/iptc.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";

const encoder = new TextEncoder();

function dataset(record: number, number: number, value: string): Uint8Array {
  const bytes = encoder.encode(value);
  return Uint8Array.from([0x1c, record, number, bytes.length >>> 8, bytes.length & 0xff, ...bytes]);
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function firstIimId(value: string | null): { readonly record: number; readonly dataset: number } | null {
  const match = /^(?:\s*)(\d+)\s*:\s*(\d+)/u.exec(value ?? "");
  if (match === null) return null;
  return { record: Number(match[1]), dataset: Number(match[2]) };
}

function valueFor(definition: (typeof IPTC_TECHREFERENCE_PROPERTIES)[number]): string {
  if (definition.dataformat === "date-time") return "20240229";
  if (definition.dataformat === "uri") return "https://example.invalid/iptc-value";
  if (definition.datatype === "number") return "1";
  return "value";
}

describe("S06 generated IPTC semantic candidate matrix", () => {
  it("materializes every generated IIM mapping and evaluates every selection policy", () => {
    const identifiers = new Map<string, { readonly record: number; readonly dataset: number; readonly value: string }>();
    for (const definition of IPTC_TECHREFERENCE_PROPERTIES) {
      const id = firstIimId(definition.iimId);
      if (id !== null) identifiers.set(`${id.record}:${id.dataset}`, { ...id, value: valueFor(definition) });
    }
    expect(identifiers.size).toBeGreaterThan(15);
    const payload = concat([...identifiers.values()].map(({ record, dataset: number, value }) => dataset(record, number, value)));
    const parsed = parseIptcMetadata(payload, DEFAULT_LIMITS);
    expect(parsed.fields.length).toBe(identifiers.size);
    for (const policy of ["preserve-all", "first", "last"] as const) {
      const semantic = deriveIptcSemantic(parsed.data, null, [], DEFAULT_LIMITS, { policy });
      expect(semantic.fields).toHaveLength(66);
      expect(semantic.selectionPolicy).toBe(policy);
      expect(semantic.fields.some((field) => field.candidates.length > 0)).toBe(true);
      expect(semantic.fields.filter((field) => field.candidates.length > 0).every((field) => field.sourceStandard.length > 0 && field.sourceEdition.length > 0)).toBe(true);
    }
  });

  it("retains duplicates, unknown datasets, invalid lexical values, and bounded semantic output", () => {
    const payload = concat([
      dataset(2, 5, "first"), dataset(2, 5, "second"), dataset(2, 25, "keyword"),
      dataset(2, 60, "246099+9999"), dataset(2, 100, "@@@"), dataset(2, 135, "bad-code"),
      dataset(9, 99, "unknown"),
    ]);
    const parsed = parseIptcMetadata(payload, { ...DEFAULT_LIMITS, maxWarnings: 32 });
    const semantic = deriveIptcSemantic(parsed.data, null, [], { ...DEFAULT_LIMITS, maxIptcOutputBytes: 128 * 1024 });
    expect(semantic.unknown.some((candidate) => candidate.source.kind === "iim" && candidate.source.record === 9 && candidate.source.dataset === 99)).toBe(true);
    expect(semantic.conflicts.some((conflict) => conflict.reason === "different-values")).toBe(true);
    expect(semantic.diagnostics.length).toBeGreaterThan(0);
    const limited = deriveIptcSemantic(parsed.data, null, [], { ...DEFAULT_LIMITS, maxIptcCandidates: 1, maxIptcOutputBytes: 64 });
    expect(limited.complete).toBe(false);
    expect(limited.diagnostics.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
  });
});
