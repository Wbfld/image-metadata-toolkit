import { describe, expect, it } from "vitest";

import {
  compareFixture,
  evaluateGate,
  renderMarkdown,
  summarize,
  validateAllowlist,
  validateRegistry,
} from "../scripts/external-corpus-lib.mjs";

const registry = {
  schema: "browser-image-metadata.external-registry.v1",
  version: 1,
  fields: [
    { name: "Make", family: "EXIF", references: ["Make"] },
    { name: "ExposureTime", family: "EXIF", references: ["ExposureTime"] },
  ],
  blocks: [{ family: "EXIF", references: ["Make"] }],
};

function result(fields: readonly { name: string; value: unknown }[]) {
  return {
    format: "jpeg",
    dimensions: null,
    fields,
    blocks: [{ family: "EXIF" }],
    xmp: null,
    warnings: [],
  };
}

describe("external corpus differential report", () => {
  it("validates the registry and reviewed allowlist schemas", () => {
    expect(validateRegistry(registry)).toBe(registry);
    expect(validateAllowlist({ schema: "browser-image-metadata.external-allowlist.v1", version: 1, entries: [] })).toBeTruthy();
    expect(() => validateAllowlist({ schema: "browser-image-metadata.external-allowlist.v1", version: 1, entries: [{ key: "Make" }] })).toThrow();
  });

  it("distinguishes exact, normalized, and missing comparisons per producer", () => {
    const fixture = compareFixture({
      relativePath: "camera/a.jpg",
      hash: "abc123",
      bytes: new Uint8Array(),
      result: result([{ name: "Make", value: "Acme" }, { name: "ExposureTime", value: "1.5" }]),
      external: { Make: "Acme", ExposureTime: 1.5 },
      registry,
    });
    const summary = summarize([fixture]);
    expect(summary.totals).toMatchObject({ found: 3, matched: 2, normalizedMatch: 1, mismatched: 0, missingLocal: 0 });
    expect(summary.byProducer).toContainEqual(expect.objectContaining({ producer: "Acme", key: "Make", matched: 1 }));
    const markdown = renderMarkdown({ schema: "test", corpus: { fixtureCount: 1 }, gate: { passed: true, minimumFixtures: 1, missingLocalRate: 0, maxMissingLocalRate: 0.05, failures: [] }, summary, fixtures: [fixture] });
    expect(markdown).toContain("abc123");
    expect(markdown).toContain("## Per-producer results");
  });

  it("fails the gate when a decoder field is deliberately removed", () => {
    const fixture = compareFixture({
      relativePath: "removed-decoder.jpg",
      hash: "deadbeef",
      bytes: new Uint8Array(),
      result: result([]),
      external: { Make: "Acme" },
      registry,
    });
    const summary = summarize([fixture]);
    const gate = evaluateGate({ fixtures: [fixture], summary, minimumFixtures: 1, maxMissingLocalRate: 0 });
    expect(fixture.rows.find((row: { key: string; status: string }) => row.key === "Make")?.status).toBe("missing-local");
    expect(gate.passed).toBe(false);
    expect(gate.failures.some((failure: string) => failure.includes("Missing-local rate"))).toBe(true);
  });
});
