import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, relative, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { promisify } from "node:util";

import { benchmarkFixtures } from "./benchmark-fixtures.mjs";

const root = resolve(import.meta.dirname, "..");
const execFileAsync = promisify(execFile);
export const BASELINE_SCHEMA_VERSION = 2;
export const DEFAULT_BASELINE_PATH = "baselines/2.0.0-alpha.3.json";
const TEST_RESULTS_PATH = join(root, "coverage", "test-results.json");
const COVERAGE_PATH = join(root, "coverage", "coverage-summary.json");
const BENCHMARK_READERS = Object.freeze(["toolkit", "exifreader", "exifr"]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertRecord(value, label) {
  if (!isRecord(value)) throw new Error(`${label} must be an object.`);
  return value;
}

function assertString(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be a non-empty string.`);
  return value;
}

function assertBoolean(value, label) {
  if (typeof value !== "boolean") throw new Error(`${label} must be a boolean.`);
  return value;
}

function assertNonNegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} must be a non-negative safe integer.`);
  return value;
}

function assertSha256(value, label) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) throw new Error(`${label} must be a lowercase SHA-256 digest.`);
  return value;
}

function assertGitCommit(value, label) {
  if (typeof value !== "string" || !/^[a-f0-9]{40,64}$/.test(value)) throw new Error(`${label} must be a git commit id.`);
  return value;
}

function assertHashRecord(value, label, { gzip = false } = {}) {
  const record = assertRecord(value, label);
  assertString(record.file ?? record.target ?? record.path, `${label}.file`);
  assertNonNegativeInteger(record.bytes, `${label}.bytes`);
  if (gzip) assertNonNegativeInteger(record.gzipBytes, `${label}.gzipBytes`);
  return record;
}

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
  if (path !== root && !path.startsWith(`${root}/`)) throw new Error(`${argv[modeIndex]} must be inside the package directory.`);
  return { mode: outputIndex === -1 ? "verify" : "output", path };
}

async function fixtureManifest() {
  const names = [...new Set(benchmarkFixtures.map(([, filename]) => filename))].sort();
  return Promise.all(names.map(async (file) => {
    const bytes = await readFile(join(root, "tests/fixtures", file));
    return { path: `tests/fixtures/${file}`, bytes: bytes.byteLength, sha256: sha256(bytes) };
  }));
}

async function allFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const file = join(directory, entry.name);
    const relativeName = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await allFiles(file, relativeName));
    else if (entry.isFile()) files.push({ file, relativeName });
    else throw new Error(`Unsupported non-file distribution entry: ${relativeName}`);
  }
  return files.sort((left, right) => left.relativeName < right.relativeName ? -1 : left.relativeName > right.relativeName ? 1 : 0);
}

async function distFiles() {
  const files = await allFiles(join(root, "dist"));
  return Promise.all(files.map(async ({ file, relativeName }) => {
    const source = await readFile(file);
    return { file: `dist/${relativeName}`, bytes: source.byteLength };
  }));
}

/** Preserve the old helper's target-only behavior for callers that use it. */
function collectExportTargets(value, targets = new Set()) {
  if (typeof value === "string") targets.add(value);
  else if (value !== null && typeof value === "object") Object.values(value).forEach((entry) => collectExportTargets(entry, targets));
  return targets;
}

function collectExportEntries(value, exportName, conditions = [], entries = []) {
  if (typeof value === "string") entries.push({ export: exportName, conditions, target: value });
  else if (value !== null && typeof value === "object") {
    for (const [condition, entry] of Object.entries(value)) collectExportEntries(entry, exportName, [...conditions, condition], entries);
  } else throw new Error(`Unsupported package export target for ${exportName}.`);
  return entries;
}

function targetPath(target) {
  if (!target.startsWith("./")) throw new Error(`Package export target must be relative: ${target}`);
  return join(root, target.slice(2));
}

async function exportEntries(packageJson) {
  const entries = Object.entries(packageJson.exports).flatMap(([exportName, value]) => collectExportEntries(value, exportName));
  entries.sort((left, right) => {
    const a = `${left.export}\u0000${left.conditions.join("\u0000")}\u0000${left.target}`;
    const b = `${right.export}\u0000${right.conditions.join("\u0000")}\u0000${right.target}`;
    return a < b ? -1 : a > b ? 1 : 0;
  });
  return Promise.all(entries.map(async (entry) => {
    const source = await readFile(targetPath(entry.target));
    return { ...entry, bytes: source.byteLength, gzipBytes: gzipSync(source).byteLength };
  }));
}

async function coverageSummary() {
  const coverage = JSON.parse(await readFile(COVERAGE_PATH, "utf8"));
  return assertRecord(coverage.total, "coverage.total");
}

export function summarizeTestResults(value) {
  const report = assertRecord(value, "test results");
  const suites = Array.isArray(report.testResults) ? report.testResults : [];
  const tests = suites.flatMap((suite) => Array.isArray(suite.assertionResults) ? suite.assertionResults : []);
  return {
    files: suites.length,
    total: tests.length,
    passed: tests.filter((test) => test.status === "passed").length,
    failed: tests.filter((test) => test.status === "failed").length,
    skipped: tests.filter((test) => test.status === "pending" || test.status === "todo").length,
  };
}

async function testSummary() {
  return summarizeTestResults(JSON.parse(await readFile(TEST_RESULTS_PATH, "utf8")));
}

async function packArtifact() {
  const { mkdtemp } = await import("node:fs/promises");
  const directory = await mkdtemp(join(tmpdir(), "browser-image-metadata-pack-"));
  try {
    const { stdout } = await execFileAsync("npm", ["pack", "--json", "--pack-destination", directory], {
      cwd: root,
      env: { ...process.env, npm_config_cache: join(directory, "npm-cache") },
      maxBuffer: 16 * 1024 * 1024,
    });
    const [packed] = JSON.parse(stdout);
    if (!packed?.filename) throw new Error("npm pack did not return an artifact filename.");
    const path = join(directory, packed.filename);
    const bytes = await readFile(path);
    return { file: packed.filename, bytes: (await stat(path)).size, sha256: sha256(bytes) };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function reportFixture(record) {
  const fixture = assertRecord(record, "benchmark fixture");
  const file = assertString(fixture.file, "benchmark fixture.file");
  return { path: `tests/fixtures/${file}`, bytes: fixture.bytes, sha256: fixture.sha256 };
}

function stableTransport(transport) {
  if (transport === null || transport === undefined) return null;
  const value = assertRecord(transport, "benchmark transport");
  return {
    mode: assertString(value.mode, "benchmark transport.mode"),
    readRequests: value.readRequests,
    sourceInputBytes: value.sourceInputBytes ?? value.sourceBytes,
    actualBytesRead: value.actualBytesRead ?? value.bytesRead,
    cacheHits: value.cacheHits ?? 0,
    coalescedReads: value.coalescedReads ?? 0,
  };
}

function stablePhase(phase) {
  if (phase === null || phase === undefined) return null;
  const value = assertRecord(phase, "benchmark measurement phase");
  return { runs: value.runs, transport: stableTransport(value.transport) };
}

function stableBenchmarkReport(report) {
  const value = assertRecord(report, "benchmark report");
  const scenarios = Array.isArray(value.scenarios) ? value.scenarios : [];
  return {
    schemaVersion: value.schemaVersion,
    package: value.package,
    competitors: value.competitors,
    scenarios: scenarios.map((scenario) => {
      const item = assertRecord(scenario, "benchmark scenario");
      const measurements = assertRecord(item.measurements, `benchmark scenario ${item.name}.measurements`);
      return {
        name: item.name,
        contract: item.contract,
        operation: item.operation,
        fixture: reportFixture(item.fixture),
        semantic: { passed: item.semantic?.passed, failures: item.semantic?.failures ?? [] },
        readers: BENCHMARK_READERS.map((reader) => {
          const measurement = measurements[reader];
          if (!isRecord(measurement)) throw new Error(`Benchmark scenario ${item.name} is missing ${reader}.`);
          return {
            reader,
            accepted: measurement.accepted,
            timingRejected: measurement.timingRejected ?? false,
            cold: stablePhase(measurement.cold),
            warm: stablePhase(measurement.warm),
          };
        }),
      };
    }),
  };
}

function benchmarkEnvironment(report) {
  return {
    generatedAt: report.generatedAt,
    environment: report.environment,
    methodology: report.methodology,
    scenarios: report.scenarios.map((scenario) => ({
      name: scenario.name,
      measurements: Object.fromEntries(BENCHMARK_READERS.map((reader) => {
        const measurement = scenario.measurements[reader];
        if (!isRecord(measurement)) throw new Error(`Benchmark scenario ${scenario.name} is missing ${reader}.`);
        return [reader, measurement];
      })),
    })),
  };
}

async function readBenchmarkReport(path) {
  const report = JSON.parse(await readFile(path, "utf8"));
  if (!Array.isArray(report.scenarios) || report.scenarios.length === 0) throw new Error("Benchmark report must contain scenarios.");
  return report;
}

async function collectBaseline({ benchmarkReportPath } = {}) {
  const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  const lockfile = JSON.parse(await readFile(join(root, "package-lock.json"), "utf8"));
  const packages = lockfile.packages ?? {};
  const competitorVersion = (name) => packages[`node_modules/${name}`]?.version ?? null;
  const benchmarkReport = await readBenchmarkReport(benchmarkReportPath ?? join(root, "artifacts", "baseline-benchmark.json"));
  const report = {
    schemaVersion: BASELINE_SCHEMA_VERSION,
    baseline: { kind: "release", packageVersion: packageJson.version },
    stable: {
      package: { name: packageJson.name, version: packageJson.version },
      competitors: { exifreader: competitorVersion("exifreader"), exifr: competitorVersion("exifr") },
      fixtures: await fixtureManifest(),
      tests: await testSummary(),
      coverage: await coverageSummary(),
      tarball: await packArtifact(),
      exportEntries: await exportEntries(packageJson),
      distFiles: await distFiles(),
      benchmarks: stableBenchmarkReport(benchmarkReport),
    },
    environment: {
      observedAt: new Date().toISOString(),
      git: { commit: await git(["rev-parse", "HEAD"]), dirty: (await git(["status", "--porcelain", "--untracked-files=all"])) !== "" },
      runtime: { node: process.version, platform: process.platform, architecture: process.arch, runtime: `${process.platform}-${process.arch}` },
      benchmarks: benchmarkEnvironment(benchmarkReport),
    },
  };
  validateBaseline(report);
  return report;
}

function validateCoverage(value) {
  const coverage = assertRecord(value, "stable.coverage");
  for (const metric of ["lines", "statements", "functions", "branches"]) {
    const item = assertRecord(coverage[metric], `stable.coverage.${metric}`);
    assertNonNegativeInteger(item.total, `stable.coverage.${metric}.total`);
    assertNonNegativeInteger(item.covered, `stable.coverage.${metric}.covered`);
    assertNonNegativeInteger(item.skipped, `stable.coverage.${metric}.skipped`);
    if (typeof item.pct !== "number" || !Number.isFinite(item.pct)) throw new Error(`stable.coverage.${metric}.pct must be finite.`);
  }
}

function validateTestSummary(value) {
  const tests = assertRecord(value, "stable.tests");
  for (const key of ["files", "total", "passed", "failed", "skipped"]) assertNonNegativeInteger(tests[key], `stable.tests.${key}`);
  if (tests.passed + tests.failed + tests.skipped !== tests.total) throw new Error("stable.tests totals do not add up.");
}

function validateMetric(value, label) {
  const metric = assertRecord(value, label);
  for (const percentile of ["min", "median", "p95"]) {
    if (typeof metric[percentile] !== "number" || !Number.isFinite(metric[percentile]) || metric[percentile] < 0) throw new Error(`${label}.${percentile} must be a non-negative finite number.`);
  }
}

function validateBenchmarkTransport(value, label) {
  if (value === null) return;
  const transport = assertRecord(value, label);
  assertString(transport.mode, `${label}.mode`);
  for (const key of ["readRequests", "sourceInputBytes", "actualBytesRead", "cacheHits", "coalescedReads"]) {
    validateMetric(transport[key], `${label}.${key}`);
  }
}

function validateBenchmarkPhase(value, label) {
  if (value === null) return;
  const phase = assertRecord(value, label);
  assertNonNegativeInteger(phase.runs, `${label}.runs`);
  validateBenchmarkTransport(phase.transport, `${label}.transport`);
}

function validateStableBenchmarks(value) {
  const benchmarks = assertRecord(value, "stable.benchmarks");
  assertNonNegativeInteger(benchmarks.schemaVersion, "stable.benchmarks.schemaVersion");
  assertRecord(benchmarks.package, "stable.benchmarks.package");
  assertRecord(benchmarks.competitors, "stable.benchmarks.competitors");
  if (!Array.isArray(benchmarks.scenarios) || benchmarks.scenarios.length === 0) throw new Error("stable.benchmarks.scenarios must be non-empty.");
  for (const scenario of benchmarks.scenarios) {
    assertRecord(scenario, "stable.benchmarks.scenario");
    assertString(scenario.name, "stable.benchmarks.scenario.name");
    assertString(scenario.operation, `stable.benchmarks.${scenario.name}.operation`);
    const fixture = assertRecord(scenario.fixture, `stable.benchmarks.${scenario.name}.fixture`);
    assertString(fixture.path, `stable.benchmarks.${scenario.name}.fixture.path`);
    assertNonNegativeInteger(fixture.bytes, `stable.benchmarks.${scenario.name}.fixture.bytes`);
    assertSha256(fixture.sha256, `stable.benchmarks.${scenario.name}.fixture.sha256`);
    assertRecord(scenario.semantic, `stable.benchmarks.${scenario.name}.semantic`);
    if (typeof scenario.semantic.passed !== "boolean") throw new Error(`stable.benchmarks.${scenario.name}.semantic.passed must be boolean.`);
    if (!Array.isArray(scenario.readers) || scenario.readers.length !== BENCHMARK_READERS.length) throw new Error(`stable.benchmarks.${scenario.name}.readers is incomplete.`);
    for (const reader of scenario.readers) {
      assertRecord(reader, `stable.benchmarks.${scenario.name}.reader`);
      assertString(reader.reader, `stable.benchmarks.${scenario.name}.reader.reader`);
      assertBoolean(reader.accepted, `stable.benchmarks.${scenario.name}.${reader.reader}.accepted`);
      assertBoolean(reader.timingRejected, `stable.benchmarks.${scenario.name}.${reader.reader}.timingRejected`);
      validateBenchmarkPhase(reader.cold, `stable.benchmarks.${scenario.name}.${reader.reader}.cold`);
      validateBenchmarkPhase(reader.warm, `stable.benchmarks.${scenario.name}.${reader.reader}.warm`);
      if (reader.accepted && (reader.cold === null || reader.warm === null)) throw new Error(`stable.benchmarks.${scenario.name}.${reader.reader} must include cold and warm measurements.`);
    }
  }
}

export function validateBaseline(report) {
  const value = assertRecord(report, "baseline");
  if (value.schemaVersion !== BASELINE_SCHEMA_VERSION) throw new Error(`baseline.schemaVersion must be ${BASELINE_SCHEMA_VERSION}.`);
  const descriptor = assertRecord(value.baseline, "baseline.baseline");
  if (descriptor.kind !== "release") throw new Error("baseline.baseline.kind must be release.");
  assertString(descriptor.packageVersion, "baseline.baseline.packageVersion");
  const stable = assertRecord(value.stable, "baseline.stable");
  const packageInfo = assertRecord(stable.package, "stable.package");
  assertString(packageInfo.name, "stable.package.name");
  assertString(packageInfo.version, "stable.package.version");
  if (descriptor.packageVersion !== packageInfo.version) throw new Error("baseline.baseline.packageVersion must match stable.package.version.");
  const competitors = assertRecord(stable.competitors, "stable.competitors");
  assertString(competitors.exifreader, "stable.competitors.exifreader");
  assertString(competitors.exifr, "stable.competitors.exifr");
  if (!Array.isArray(stable.fixtures) || stable.fixtures.length === 0) throw new Error("stable.fixtures must be non-empty.");
  for (const fixture of stable.fixtures) {
    const item = assertHashRecord(fixture, "stable.fixture");
    assertSha256(item.sha256, "stable.fixture.sha256");
    assertString(item.path, "stable.fixture.path");
  }
  validateTestSummary(stable.tests);
  validateCoverage(stable.coverage);
  const tarball = assertRecord(stable.tarball, "stable.tarball");
  assertString(tarball.file, "stable.tarball.file");
  assertNonNegativeInteger(tarball.bytes, "stable.tarball.bytes");
  assertSha256(tarball.sha256, "stable.tarball.sha256");
  if (!Array.isArray(stable.exportEntries) || stable.exportEntries.length === 0) throw new Error("stable.exportEntries must be non-empty.");
  for (const entry of stable.exportEntries) {
    assertHashRecord(entry, "stable.export", { gzip: true });
    assertString(entry.export, "stable.export.export");
    if (!Array.isArray(entry.conditions)) throw new Error("stable.export.conditions must be an array.");
    assertString(entry.target, "stable.export.target");
  }
  if (!Array.isArray(stable.distFiles) || stable.distFiles.length === 0) throw new Error("stable.distFiles must be non-empty.");
  for (const file of stable.distFiles) assertHashRecord(file, "stable.distFile");
  validateStableBenchmarks(stable.benchmarks);

  const environment = assertRecord(value.environment, "baseline.environment");
  assertString(environment.observedAt, "baseline.environment.observedAt");
  const gitInfo = assertRecord(environment.git, "baseline.environment.git");
  if (gitInfo.commit !== null) assertGitCommit(gitInfo.commit, "baseline.environment.git.commit");
  assertBoolean(gitInfo.dirty, "baseline.environment.git.dirty");
  const runtime = assertRecord(environment.runtime, "baseline.environment.runtime");
  assertString(runtime.node, "baseline.environment.runtime.node");
  assertString(runtime.platform, "baseline.environment.runtime.platform");
  assertString(runtime.architecture, "baseline.environment.runtime.architecture");
  assertString(runtime.runtime, "baseline.environment.runtime.runtime");
  const benchmarkEnvironmentInfo = assertRecord(environment.benchmarks, "baseline.environment.benchmarks");
  assertString(benchmarkEnvironmentInfo.generatedAt, "baseline.environment.benchmarks.generatedAt");
  assertRecord(benchmarkEnvironmentInfo.environment, "baseline.environment.benchmarks.environment");
  assertRecord(benchmarkEnvironmentInfo.methodology, "baseline.environment.benchmarks.methodology");
  if (!Array.isArray(benchmarkEnvironmentInfo.scenarios) || benchmarkEnvironmentInfo.scenarios.length === 0) throw new Error("baseline.environment.benchmarks.scenarios must be non-empty.");
  for (const scenario of benchmarkEnvironmentInfo.scenarios) {
    assertRecord(scenario, "baseline.environment.benchmarks.scenario");
    assertString(scenario.name, "baseline.environment.benchmarks.scenario.name");
    const measurements = assertRecord(scenario.measurements, `baseline.environment.benchmarks.${scenario.name}.measurements`);
    for (const reader of BENCHMARK_READERS) {
      const measurement = assertRecord(measurements[reader], `baseline.environment.benchmarks.${scenario.name}.${reader}`);
      assertBoolean(measurement.accepted, `baseline.environment.benchmarks.${scenario.name}.${reader}.accepted`);
      if (measurement.accepted) {
        for (const phaseName of ["cold", "warm"]) {
          const phase = assertRecord(measurement[phaseName], `baseline.environment.benchmarks.${scenario.name}.${reader}.${phaseName}`);
          assertNonNegativeInteger(phase.runs, `baseline.environment.benchmarks.${scenario.name}.${reader}.${phaseName}.runs`);
          validateMetric(phase.milliseconds, `baseline.environment.benchmarks.${scenario.name}.${reader}.${phaseName}.milliseconds`);
          validateBenchmarkTransport(phase.transport, `baseline.environment.benchmarks.${scenario.name}.${reader}.${phaseName}.transport`);
        }
      } else assertBoolean(measurement.timingRejected, `baseline.environment.benchmarks.${scenario.name}.${reader}.timingRejected`);
    }
  }
  return value;
}

export function stableProjection(report) {
  validateBaseline(report);
  // Vitest/V8 can emit a different branch map for the same TypeScript source
  // when modules are merged from parallel workers. Keep the complete branch
  // summary in the checked-in report and validate it above, but compare the
  // reproducible line, statement, and function counters as the stable policy.
  const stable = {
    ...report.stable,
    coverage: {
      lines: report.stable.coverage.lines,
      statements: report.stable.coverage.statements,
      functions: report.stable.coverage.functions,
    },
  };
  return { schemaVersion: report.schemaVersion, baseline: report.baseline, stable };
}

export function stableFields(report) {
  return stableProjection(report);
}

export function stableJson(value) {
  return JSON.stringify(value, (_key, entry) => entry instanceof Uint8Array ? [...entry] : entry);
}

export function compareStableFields(expected, actual) {
  const expectedProjection = stableProjection(expected);
  const actualProjection = stableProjection(actual);
  if (stableJson(expectedProjection) !== stableJson(actualProjection)) {
    throw new Error("Baseline stable contract changed. Review package, tests, coverage, build, fixture, benchmark, and competitor changes before replacing the release baseline.");
  }
}

async function run(command, args, options = {}) {
  return execFileAsync(command, args, { cwd: root, maxBuffer: 32 * 1024 * 1024, ...options });
}

async function captureReleaseArtifacts() {
  let bootstrapped = false;
  try {
    await run("npm", ["run", "test:coverage"]);
  } catch (error) {
    const details = `${error?.stdout ?? ""}\n${error?.stderr ?? ""}`;
    if (!details.includes("tests/baseline.test.ts")) throw error;
    await run(process.execPath, [
      "node_modules/vitest/vitest.mjs",
      "run",
      "--coverage",
      "--exclude",
      "tests/baseline.test.ts",
      "--reporter=default",
      "--reporter=json",
      "--outputFile.json=coverage/test-results.json",
    ]);
    bootstrapped = true;
  }
  await run("npm", ["run", "build"]);
  await mkdir(join(root, "artifacts"), { recursive: true });
  const benchmarkPath = join(root, "artifacts", "baseline-benchmark.json");
  await run(process.execPath, ["scripts/benchmark.mjs", "--output", benchmarkPath]);
  return { benchmarkPath, bootstrapped };
}

async function captureVerificationArtifacts() {
  await mkdir(join(root, "artifacts"), { recursive: true });
  const benchmarkPath = join(root, "artifacts", ".baseline-verification-benchmark.json");
  await run(process.execPath, ["scripts/benchmark.mjs", "--output", benchmarkPath]);
  return benchmarkPath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.mode === "output") {
    const capture = await captureReleaseArtifacts();
    let report = await collectBaseline({ benchmarkReportPath: capture.benchmarkPath });
    await writeFile(args.path, `${JSON.stringify(report, null, 2)}\n`);
    if (capture.bootstrapped) {
      const canonicalPath = join(root, DEFAULT_BASELINE_PATH);
      if (canonicalPath !== args.path) await writeFile(canonicalPath, `${JSON.stringify(report, null, 2)}\n`);
      await run("npm", ["run", "test:coverage"]);
      await run("npm", ["run", "build"]);
      await run(process.execPath, ["scripts/benchmark.mjs", "--output", capture.benchmarkPath]);
      report = await collectBaseline({ benchmarkReportPath: capture.benchmarkPath });
      await writeFile(args.path, `${JSON.stringify(report, null, 2)}\n`);
      if (canonicalPath !== args.path) await writeFile(canonicalPath, `${JSON.stringify(report, null, 2)}\n`);
    }
    process.stdout.write(`Release baseline written to ${relative(root, args.path)}.\n`);
  } else if (args.mode === "verify") {
    const expected = JSON.parse(await readFile(args.path, "utf8"));
    validateBaseline(expected);
    const benchmarkPath = await captureVerificationArtifacts();
    try {
      const actual = await collectBaseline({ benchmarkReportPath: benchmarkPath });
      compareStableFields(expected, actual);
      process.stdout.write(`Baseline stable contract matches ${basename(args.path)}.\n`);
    } finally {
      await rm(benchmarkPath, { force: true });
    }
  } else {
    const benchmarkPath = await captureVerificationArtifacts();
    try {
      const report = await collectBaseline({ benchmarkReportPath: benchmarkPath });
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    } finally {
      await rm(benchmarkPath, { force: true });
    }
  }
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) await main();

export {
  collectBaseline,
  collectExportTargets,
  fixtureManifest,
  parseArgs,
};
