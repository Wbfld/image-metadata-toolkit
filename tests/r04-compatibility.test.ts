import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

import { assertEvidenceEquals, assertFixtureBytes, extractSnippets, validateDocumentation, validatePublicApi, validateSources } from "../scripts/r04-compatibility-lib.mjs";

const execFile = promisify(execFileCallback);
const root = resolve(import.meta.dirname, "..");
const fixture = join(root, "tests/fixtures/jpeg-exif-little-endian.jpg");
const childProcessEnvironment = Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== "npm_config_dry_run" && key !== "npm_config_dry-run"));

interface CompatibilitySources {
  readonly competitors: Array<{ id: string; version: string }>;
  readonly fixtures: Array<{ path: string; bytes: number; sha256: string }>;
}

interface CompatibilityReport {
  readonly fixtures: Array<{ readonly sha256: string; readonly outputs: Record<string, unknown> }>;
  readonly sources: { readonly competitors: Array<{ readonly id: string; readonly version: string }> };
  readonly semanticDifferences: Array<{ readonly id: string }>;
  readonly codemod: { readonly published: boolean; readonly decision: string };
}

function parseJson(value: string): unknown { return JSON.parse(value) as unknown; }

async function run(command: string, args: readonly string[], cwd: string) {
  return execFile(command, args, { cwd, encoding: "utf8", maxBuffer: 8 * 1024 * 1024, env: childProcessEnvironment });
}

describe("R04 migration and compatibility assets", () => {
  it("rejects stale source versions and incomplete documentation anchors or snippets", async () => {
    const [sourceText, lockText, migration, codemod] = await Promise.all([
      readFile(join(root, "data/r04-compatibility-sources.json"), "utf8"),
      readFile(join(root, "package-lock.json"), "utf8"),
      readFile(join(root, "R04_MIGRATION_COMPATIBILITY.md"), "utf8"),
      readFile(join(root, "R04_CODEMOD_DECISION.md"), "utf8"),
    ]);
    const sources = parseJson(sourceText) as CompatibilitySources;
    expect(() => validateSources(sources, parseJson(lockText))).not.toThrow();
    const stale = structuredClone(sources);
    const firstCompetitor = stale.competitors.at(0);
    if (firstCompetitor === undefined) throw new Error("R04 source manifest has no competitors.");
    firstCompetitor.version = "0.0.0";
    expect(() => validateSources(stale, parseJson(lockText))).toThrow("stale metadata");
    const fixtureEntry = sources.fixtures.at(0);
    if (fixtureEntry === undefined) throw new Error("R04 source manifest has no fixtures.");
    const fixtureBytes = new Uint8Array(await readFile(join(root, fixtureEntry.path)));
    expect(() => assertFixtureBytes(fixtureEntry, fixtureBytes)).not.toThrow();
    expect(() => assertFixtureBytes({ ...fixtureEntry, sha256: "0".repeat(64) }, fixtureBytes)).toThrow("SHA-256 is stale");
    expect(() => validatePublicApi({})).toThrow("public API parseMetadata");
    expect(() => assertEvidenceEquals("evidence", "stale", "current")).toThrow("evidence is stale");
    const snippets = validateDocumentation(migration, codemod);
    expect([...snippets.keys()]).toEqual(["exifr-common", "exifreader-grouped", "exif-js-callback", "piexifjs-write", "metadata-families", "privacy"]);
    expect(() => validateDocumentation(migration.replace("<!-- r04-snippet: privacy -->", ""), codemod)).toThrow("missing privacy snippet");
  });

  it("generates checked compatibility evidence from all pinned competitors and fixtures", async () => {
    await run(process.execPath, ["scripts/r04-compatibility.mjs"], root);
    const checked = await run(process.execPath, ["scripts/r04-compatibility.mjs", "--check"], root);
    expect(checked.stdout).toContain("verified");
    const report = parseJson(await readFile(join(root, "reports/r04-compatibility.json"), "utf8")) as CompatibilityReport;
    expect(report.fixtures).toHaveLength(3);
    expect(report.sources.competitors.map((entry) => `${entry.id}@${entry.version}`)).toEqual([
      "exifr@7.1.3", "exifreader@4.45.0", "exif-js@2.3.0", "piexifjs@1.0.6",
    ]);
    for (const fixtureReport of report.fixtures) {
      expect(fixtureReport.sha256).toMatch(/^[a-f0-9]{64}$/u);
      expect(Object.keys(fixtureReport.outputs)).toEqual(["exif-js", "exifr", "exifreader", "piexifjs", "toolkit"]);
    }
    expect(report.semanticDifferences.map((entry) => entry.id)).toContain("duplicates-ordering");
    expect(report.codemod).toEqual({ published: false, decision: "R04_CODEMOD_DECISION.md" });
  }, 30_000);

  it("runs every published replacement snippet against an installed packed package", async () => {
    const stage = await mkdtemp(join(tmpdir(), "browser-image-metadata-r04-"));
    try {
      const packed = parseJson((await run("npm", ["pack", "--json", "--cache", join(stage, "npm-cache"), "--pack-destination", stage], root)).stdout) as Array<{ filename: string }>;
      expect(packed).toHaveLength(1);
      const archive = packed.at(0);
      if (archive === undefined) throw new Error("npm pack produced no archive.");
      const consumer = join(stage, "consumer");
      await mkdir(consumer);
      await writeFile(join(consumer, "package.json"), JSON.stringify({ private: true, type: "module" }));
      await run("npm", ["install", "--cache", join(stage, "npm-cache"), "--omit=peer", "--ignore-scripts", "--offline", "--no-audit", "--no-fund", join(stage, archive.filename)], consumer);
      const migration = await readFile(join(root, "R04_MIGRATION_COMPATIBILITY.md"), "utf8");
      const snippets = extractSnippets(migration);
      for (const [id, source] of snippets) {
        const path = join(consumer, `${id}.mjs`);
        await writeFile(path, source);
        await expect(run(process.execPath, [path, fixture], consumer)).resolves.toMatchObject({ stderr: "" });
      }
    } finally {
      await rm(stage, { recursive: true, force: true });
    }
  }, 180_000);
});
