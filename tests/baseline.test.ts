import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { compareStableFields, stableProjection, validateBaseline } from "../scripts/baseline.mjs";

function metric(value: number) {
  return { min: value, median: value, p95: value };
}

function phase(mode: string, sourceInputBytes: number, actualBytesRead: number) {
  return {
    runs: 3,
    transport: {
      mode,
      readRequests: metric(2),
      sourceInputBytes: metric(sourceInputBytes),
      actualBytesRead: metric(actualBytesRead),
      cacheHits: metric(1),
      coalescedReads: metric(1),
    },
  };
}

function report() {
  const scenario = {
    name: "remote-range-simulation",
    contract: "common-exif",
    operation: "remote-range",
    fixture: { path: "tests/fixtures/base.jpg", bytes: 12, sha256: "a".repeat(64) },
    semantic: { passed: true, failures: [] },
    readers: ["toolkit", "exifreader", "exifr"].map((reader) => ({
      reader,
      accepted: true,
      timingRejected: false,
      cold: phase(reader === "toolkit" ? "instrumented-range" : "full-input", 12, reader === "toolkit" ? 8 : 12),
      warm: phase(reader === "toolkit" ? "instrumented-range" : "full-input", 12, reader === "toolkit" ? 8 : 12),
    })),
  };
  return {
    schemaVersion: 2,
    baseline: { kind: "release", packageVersion: "2.0.0-alpha.3" },
    stable: {
      package: { name: "browser-image-metadata", version: "2.0.0-alpha.3" },
      competitors: { exifreader: "4.45.0", exifr: "7.1.3" },
      fixtures: [{ path: "tests/fixtures/base.jpg", bytes: 12, sha256: "a".repeat(64) }],
      tests: { files: 1, total: 4, passed: 4, failed: 0, skipped: 0 },
      coverage: {
        lines: { total: 10, covered: 9, skipped: 0, pct: 90 },
        statements: { total: 10, covered: 9, skipped: 0, pct: 90 },
        functions: { total: 4, covered: 4, skipped: 0, pct: 100 },
        branches: { total: 6, covered: 4, skipped: 0, pct: 66.67 },
      },
      tarball: { file: "browser-image-metadata-2.0.0-alpha.3.tgz", bytes: 100, sha256: "b".repeat(64) },
      exportEntries: [
        { export: ".", conditions: ["import"], target: "./dist/index.js", bytes: 40, gzipBytes: 20 },
        { export: ".", conditions: ["require"], target: "./dist/index.cjs", bytes: 45, gzipBytes: 22 },
      ],
      distFiles: [
        { file: "dist/index.js", bytes: 40 },
        { file: "dist/index.cjs", bytes: 45 },
      ],
      benchmarks: {
        schemaVersion: 3,
        package: { name: "browser-image-metadata", version: "2.0.0-alpha.3" },
        competitors: { toolkit: "2.0.0-alpha.3", exifreader: "4.45.0", exifr: "7.1.3" },
        scenarios: [scenario],
      },
    },
    environment: {
      observedAt: "2026-09-12T00:00:00.000Z",
      git: { commit: "c".repeat(40), dirty: false },
      runtime: { node: "v23.7.0", platform: "darwin", architecture: "arm64", runtime: "darwin-arm64" },
      benchmarks: {
        generatedAt: "2026-09-12T00:00:00.000Z",
        environment: { node: "v23.7.0" },
        methodology: { sampleCount: { cold: 3, warm: 25 } },
        scenarios: [{
          name: scenario.name,
          measurements: Object.fromEntries(scenario.readers.map((reader) => [reader.reader, {
            accepted: true,
            cold: { ...reader.cold, milliseconds: metric(1) },
            warm: { ...reader.warm, milliseconds: metric(1) },
          }])),
        }],
      },
    },
  };
}

type BaselineReport = ReturnType<typeof report>;

function changed<T>(value: T, mutate: (copy: T) => void): T {
  const copy = structuredClone(value);
  mutate(copy);
  return copy;
}

describe("release baseline contract", () => {
  it("validates the complete baseline schema", () => {
    expect(() => validateBaseline(report())).not.toThrow();
    expect(() => validateBaseline(changed(report(), (value) => { Reflect.deleteProperty(value.stable, "coverage"); }))).toThrow("stable.coverage");
    expect(() => validateBaseline(changed(report(), (value) => { Reflect.deleteProperty(value.environment, "runtime"); }))).toThrow("runtime");
  });

  it("keeps the stable projection deterministic and excludes volatile observations", () => {
    const first = report();
    const second = changed(first, (value) => {
      value.environment.observedAt = "2099-01-01T00:00:00.000Z";
      value.environment.runtime.node = "v99.0.0";
      value.environment.git.dirty = !value.environment.git.dirty;
    });
    expect(JSON.stringify(stableProjection(first))).toBe(JSON.stringify(stableProjection(second)));
  });

  it("retains and validates branch coverage without treating V8 branch-map aggregation as stable identity", () => {
    const first = report();
    const second = changed(first, (value) => {
      value.stable.coverage.branches.total += 1;
      value.stable.coverage.branches.covered += 1;
    });
    expect(() => validateBaseline(second)).not.toThrow();
    expect(JSON.stringify(stableProjection(first))).toBe(JSON.stringify(stableProjection(second)));
  });

  const changes: ReadonlyArray<readonly [string, (value: BaselineReport) => void]> = [
    ["fixture hash", (value) => { const fixture = value.stable.fixtures.at(0); if (!fixture) throw new Error("fixture missing"); fixture.sha256 = "d".repeat(64); }],
    ["fixture length", (value) => { const fixture = value.stable.fixtures.at(0); if (!fixture) throw new Error("fixture missing"); fixture.bytes += 1; }],
    ["competitor version", (value) => { value.stable.competitors.exifr = "7.1.4"; }],
    ["missing export", (value) => { value.stable.exportEntries.pop(); }],
    ["added export", (value) => { value.stable.exportEntries.push({ export: "./new", conditions: ["import"], target: "./dist/new.js", bytes: 1, gzipBytes: 1 }); }],
    ["test totals", (value) => { value.stable.tests.total += 1; value.stable.tests.passed += 1; }],
    ["coverage", (value) => { value.stable.coverage.lines.covered -= 1; }],
    ["build inventory", (value) => { const file = value.stable.distFiles.at(0); if (!file) throw new Error("distribution file missing"); file.bytes += 1; }],
  ];
  it.each(changes)("detects %s changes", (_label, mutate) => {
    expect(() => compareStableFields(report(), changed(report(), mutate))).toThrow("Baseline stable contract changed");
  });

  it("retains explicit cold/warm and source/read byte evidence", () => {
    const benchmark = stableProjection(report()).stable.benchmarks.scenarios.at(0);
    if (!benchmark) throw new Error("benchmark scenario missing");
    const toolkit = benchmark.readers.find((reader: { reader: string }) => reader.reader === "toolkit");
    expect(toolkit?.cold).toBeDefined();
    expect(toolkit?.warm).toBeDefined();
    expect(toolkit?.cold.transport).toMatchObject({ sourceInputBytes: { median: 12 }, actualBytesRead: { median: 8 } });
    expect(toolkit?.warm.transport).toMatchObject({ sourceInputBytes: { median: 12 }, actualBytesRead: { median: 8 } });
  });

  it("validates the checked-in baseline", () => {
    const checkedIn: unknown = JSON.parse(readFileSync(new URL("../baselines/2.0.0-alpha.3.json", import.meta.url), "utf8"));
    expect(() => validateBaseline(checkedIn)).not.toThrow();
  });
});
