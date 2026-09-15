import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");

describe("G02 reproducible comparison artifact", () => {
  it("retains correctness, transport, speed, memory, malformed, and closure evidence", async () => {
    const report = JSON.parse(await readFile(join(root, "reports/g02-comparison.json"), "utf8")) as {
      status: string;
      reportVersion: string;
      fixtures: readonly { file: string; sha256: string }[];
      benchmarkReport: { sha256: string };
      rows: { semantic: readonly { passed: boolean }[]; speed: readonly { comparable: boolean; winner: readonly string[] | null }[]; transport: readonly { comparable: boolean }[] };
      memory: { readers: Record<string, unknown> };
      malformed: { cases: readonly unknown[] };
      bundleClosure: { ordinaryBundleC2paImportCount: number };
    };
    expect(report.status).toBe("passed");
    expect(report.reportVersion).toBe("g02-comparison/1");
    expect(report.fixtures.length).toBeGreaterThan(0);
    expect(report.fixtures.every((fixture) => /^[a-f0-9]{64}$/u.test(fixture.sha256))).toBe(true);
    expect(/^[a-f0-9]{64}$/u.test(report.benchmarkReport.sha256)).toBe(true);
    expect(report.rows.semantic.length).toBeGreaterThanOrEqual(7);
    expect(report.rows.semantic.every((row) => row.passed)).toBe(true);
    expect(report.rows.speed.some((row) => row.comparable && row.winner?.includes("exifr"))).toBe(true);
    expect(report.rows.transport.some((row) => row.comparable)).toBe(true);
    expect(Object.keys(report.memory.readers)).toEqual(expect.arrayContaining(["toolkit", "exifreader", "exifr"]));
    expect(report.malformed.cases.length).toBeGreaterThanOrEqual(4);
    expect(report.bundleClosure.ordinaryBundleC2paImportCount).toBe(0);
  });

  it("does not retain fixture bytes or raw creator text", async () => {
    const json = await readFile(join(root, "reports/g02-comparison.json"), "utf8");
    const markdown = await readFile(join(root, "reports/g02-comparison.md"), "utf8");
    expect(json).not.toContain("report prompt");
    expect(markdown).not.toContain("report prompt");
    expect(markdown).toContain("repository-hosted evidence");
  });
});

