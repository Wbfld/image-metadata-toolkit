import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { promisify } from "node:util";

import { benchmarkFixtures } from "./benchmark-fixtures.mjs";

const root = resolve(import.meta.dirname, "..");
const execFileAsync = promisify(execFile);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function git(args) {
  try {
    return (await execFileAsync("git", args, { cwd: root })).stdout.trim();
  } catch {
    return null;
  }
}

function parseArgs(argv) {
  const outputIndex = argv.indexOf("--output");
  const verifyIndex = argv.indexOf("--verify");
  if (outputIndex !== -1 && verifyIndex !== -1) throw new Error("Use either --output or --verify, not both.");
  const modeIndex = outputIndex === -1 ? verifyIndex : outputIndex;
  if (modeIndex === -1) return { mode: "stdout", path: null };
  const value = argv[modeIndex + 1];
  if (!value || value.startsWith("--")) throw new Error(`${argv[modeIndex]} requires a path.`);
  const path = resolve(root, value);
  if (!path.startsWith(`${root}/`)) throw new Error(`${argv[modeIndex]} must be inside the package directory.`);
  return { mode: outputIndex === -1 ? "verify" : "output", path };
}

async function fixtureManifest() {
  const names = [...new Set(benchmarkFixtures.map(([, filename]) => filename))].sort();
  return Promise.all(names.map(async (file) => {
    const bytes = await readFile(join(root, "tests/fixtures", file));
    return { file, bytes: bytes.byteLength, sha256: sha256(bytes) };
  }));
}

async function distFiles() {
  const directory = join(root, "dist");
  const names = (await readdir(directory)).filter((name) => name.endsWith(".js")).sort();
  return Promise.all(names.map(async (file) => {
    const source = await readFile(join(directory, file));
    return { file, bytes: source.byteLength, gzipBytes: gzipSync(source).byteLength };
  }));
}

function collectExportTargets(value, targets = new Set()) {
  if (typeof value === "string" && value.endsWith(".js")) targets.add(value);
  else if (value !== null && typeof value === "object") Object.values(value).forEach((entry) => collectExportTargets(entry, targets));
  return targets;
}

async function exportEntries(packageJson) {
  const targets = [...collectExportTargets(packageJson.exports)].sort();
  return Promise.all(targets.map(async (target) => {
    const source = await readFile(join(root, target.replace(/^\.\//, "")));
    return { target, bytes: source.byteLength, gzipBytes: gzipSync(source).byteLength };
  }));
}

async function coverageSummary() {
  return JSON.parse(await readFile(join(root, "coverage/coverage-summary.json"), "utf8")).total;
}

async function testSummary() {
  const { stdout } = await execFileAsync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "--reporter=json", "--silent"], {
    cwd: root,
    maxBuffer: 16 * 1024 * 1024,
  });
  const suites = JSON.parse(stdout).testResults ?? [];
  const tests = suites.flatMap((suite) => suite.assertionResults ?? []);
  return {
    files: suites.length,
    total: tests.length,
    passed: tests.filter((test) => test.status === "passed").length,
    failed: tests.filter((test) => test.status === "failed").length,
    skipped: tests.filter((test) => test.status === "pending" || test.status === "todo").length,
  };
}

async function packArtifact() {
  const directory = await mkdtemp(join(tmpdir(), "browser-image-metadata-pack-"));
  try {
    const { stdout } = await execFileAsync("npm", ["pack", "--json", "--pack-destination", directory], {
      cwd: root,
      env: { ...process.env, npm_config_cache: join(directory, "npm-cache") },
    });
    const [packed] = JSON.parse(stdout);
    const path = join(directory, packed.filename);
    const bytes = await readFile(path);
    return { file: packed.filename, bytes: (await stat(path)).size, sha256: sha256(bytes) };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function collectBaseline() {
  const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  const lockfile = JSON.parse(await readFile(join(root, "package-lock.json"), "utf8"));
  const packages = lockfile.packages ?? {};
  const competitorVersion = (name) => packages[`node_modules/${name}`]?.version ?? null;
  return {
    schemaVersion: 1,
    package: { name: packageJson.name, version: packageJson.version },
    git: { commit: await git(["rev-parse", "HEAD"]), dirty: (await git(["status", "--porcelain"])) !== "" },
    runtime: { node: process.version, platform: `${process.platform}-${process.arch}` },
    competitors: { exifreader: competitorVersion("exifreader"), exifr: competitorVersion("exifr") },
    fixtures: await fixtureManifest(),
    tests: await testSummary(),
    coverage: await coverageSummary(),
    tarball: await packArtifact(),
    exportEntries: await exportEntries(packageJson),
    distFiles: await distFiles(),
  };
}

function stableFields(report) {
  return { schemaVersion: report.schemaVersion, package: report.package, competitors: report.competitors, fixtures: report.fixtures };
}

const args = parseArgs(process.argv.slice(2));
const report = await collectBaseline();
if (args.mode === "verify") {
  const expected = JSON.parse(await readFile(args.path, "utf8"));
  if (JSON.stringify(stableFields(expected)) !== JSON.stringify(stableFields(report))) {
    throw new Error(`Baseline contract changed. Review and replace ${basename(args.path)} after validating fixture and competitor changes.`);
  }
  process.stdout.write(`Baseline contract matches ${basename(args.path)}.\n`);
} else {
  const json = `${JSON.stringify(report, null, 2)}\n`;
  if (args.mode === "output") await writeFile(args.path, json);
  else process.stdout.write(json);
}

export { collectExportTargets, parseArgs, stableFields };
