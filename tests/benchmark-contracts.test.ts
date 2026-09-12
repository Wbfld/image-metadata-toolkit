import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import ExifReader from "exifreader";
import exifr from "exifr";
import * as toolkitModule from "../src/index.js";

import { runBenchmarkOperation } from "../scripts/benchmark-runner.mjs";
import { assertScenarioContract, benchmarkScenarios } from "../scripts/benchmark-scenarios.mjs";

const fixture = new URL("./fixtures/jpeg-exif-little-endian.jpg", import.meta.url);

describe("competitor benchmark contracts", () => {
  it("defines every required equal-output scenario", () => {
    expect(benchmarkScenarios.map((scenario: { name: string }) => scenario.name)).toEqual([
      "detection",
      "orientation",
      "gps",
      "camera-date",
      "all-common-exif",
      "all-documented-metadata",
      "remote-range-simulation",
    ]);
  });

  it("rejects timing when a reader violates the semantic contract", () => {
    const gate = assertScenarioContract({ toolkit: { value: 6 }, competitor: { value: 8 } });
    expect(gate.passed).toBe(false);
    expect(gate.failures[0]).toContain("competitor differs");
  });

  it("records actual remote range requests and preserves output parity", async () => {
    const bytes = await readFile(fixture);
    const scenario = benchmarkScenarios.find((entry: { name: string }) => entry.name === "remote-range-simulation");
    expect(scenario).toBeDefined();
    if (scenario === undefined) return;
    const modules = { ExifReader, exifr, toolkit: toolkitModule };
    const [toolkit, reader, exifrResult] = await Promise.all([
      runBenchmarkOperation("toolkit", bytes, scenario, modules),
      runBenchmarkOperation("exifreader", bytes, scenario, modules),
      runBenchmarkOperation("exifr", bytes, scenario, modules),
    ]);
    expect(toolkit.transport.mode).toBe("instrumented-range");
    expect(toolkit.transport.readRequests).toBeGreaterThan(0);
    expect(toolkit.transport.bytesRead).toBeLessThan(bytes.byteLength);
    expect(assertScenarioContract({ toolkit: toolkit.output, exifreader: reader.output, exifr: exifrResult.output }).passed).toBe(true);
  });
});
