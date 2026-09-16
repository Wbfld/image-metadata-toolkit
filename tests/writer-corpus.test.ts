import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const manifest = JSON.parse(readFileSync(new URL("../data/writer-corpus.json", import.meta.url), "utf8")) as {
  schema: string;
  minimumFixturesPerFamily: number;
  sources: readonly { id: string; commit: string; license: string }[];
  derivedPolicy: { allowed: boolean; description: string; encoderPackage: string };
};

describe("roadmap-wide writer corpus contract", () => {
  it("requires three independent 500-fixture family gates and records lawful provenance", () => {
    expect(manifest.schema).toBe("browser-image-metadata.writer-corpus-manifest.v1");
    expect(manifest.minimumFixturesPerFamily).toBeGreaterThanOrEqual(500);
    expect(manifest.sources.map(({ id }) => id)).toEqual(["web-platform-tests", "imazen-codec-corpus", "ianare-exif-py"]);
    expect(manifest.sources.every(({ commit, license }) => /^[0-9a-f]{40}$/u.test(commit) && license.length > 0)).toBe(true);
    expect(manifest.derivedPolicy.allowed).toBe(true);
    expect(manifest.derivedPolicy.description).toContain("real");
    expect(manifest.derivedPolicy.encoderPackage).toContain("@playwright/test");
  });

  it("fails closed instead of silently passing without a corpus", () => {
    const result = spawnSync(process.execPath, ["scripts/writer-corpus.mjs"], { cwd: new URL("..", import.meta.url), encoding: "utf8", env: { ...process.env, WRITER_CORPUS_ROOTS_JSON: "", WRITER_PROTECTED_CORPUS_DIR: "" } });
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toContain("WRITER_CORPUS_ROOTS_JSON is required");
  });
});
