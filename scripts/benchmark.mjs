import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { promisify } from "node:util";

import { assertScenarioContract, benchmarkScenarios, stableJson } from "./benchmark-scenarios.mjs";
import { runBenchmarkOperation } from "./benchmark-runner.mjs";

const root = resolve(import.meta.dirname, "..");
const execFileAsync = promisify(execFile);
const readers = Object.freeze(["toolkit", "exifreader", "exifr"]);
const runs = Number.parseInt(process.env.BENCHMARK_RUNS ?? "25", 10);
const coldRuns = Number.parseInt(process.env.BENCHMARK_COLD_RUNS ?? "3", 10);
if (!Number.isSafeInteger(runs) || runs < 1) throw new Error("BENCHMARK_RUNS must be a positive safe integer.");
if (!Number.isSafeInteger(coldRuns) || coldRuns < 1) throw new Error("BENCHMARK_COLD_RUNS must be a positive safe integer.");

function percentile(values, ratio) {
  const ordered = [...values].sort((left, right) => left - right);
  const index = Math.min(ordered.length - 1, Math.floor((ordered.length - 1) * ratio));
  return ordered[index] ?? 0;
}

function summary(values) {
  return {
    min: Number(percentile(values, 0).toFixed(3)),
    median: Number(percentile(values, 0.5).toFixed(3)),
    p95: Number(percentile(values, 0.95).toFixed(3)),
  };
}

function metricSummary(samples, key) {
  return summary(samples.map((sample) => Number(sample[key] ?? 0)));
}

function transportSummary(samples) {
  return {
    mode: samples[0]?.mode ?? "unknown",
    readRequests: metricSummary(samples, "readRequests"),
    bytesRead: metricSummary(samples, "bytesRead"),
    sourceBytes: metricSummary(samples, "sourceBytes"),
    actualBytesRead: metricSummary(samples, "bytesRead"),
    sourceInputBytes: metricSummary(samples, "sourceBytes"),
    cacheHits: metricSummary(samples, "cacheHits"),
    coalescedReads: metricSummary(samples, "coalescedReads"),
  };
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function outputPath(argv) {
  const index = argv.indexOf("--output");
  if (index === -1) return null;
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error("--output requires a path.");
  const target = resolve(root, value);
  if (!target.startsWith(`${root}/`)) throw new Error("--output must be inside the package directory.");
  return target;
}

function packageVersion(lockfile, name) {
  return lockfile.packages?.[`node_modules/${name}`]?.version ?? null;
}

async function packageMetadata() {
  const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  const lockfile = JSON.parse(await readFile(join(root, "package-lock.json"), "utf8"));
  return {
    package: { name: packageJson.name, version: packageJson.version },
    competitors: {
      toolkit: packageJson.version,
      exifreader: packageVersion(lockfile, "exifreader"),
      exifr: packageVersion(lockfile, "exifr"),
    },
  };
}

async function loadModules() {
  const exifreaderModule = await import("exifreader");
  const exifrModule = await import("exifr");
  return { ExifReader: exifreaderModule.default, exifr: exifrModule.default };
}

async function coldMeasure(reader, scenario) {
  const samples = [];
  const outputs = [];
  for (let index = 0; index < coldRuns; index += 1) {
    const { stdout } = await execFileAsync(process.execPath, ["scripts/benchmark-child.mjs", JSON.stringify({ reader, filename: scenario.fixture, scenario })], { cwd: root, maxBuffer: 4 * 1024 * 1024 });
    const sample = JSON.parse(stdout);
    samples.push({ milliseconds: sample.milliseconds, ...sample.transport });
    outputs.push(sample.output);
  }
  return {
    runs: coldRuns,
    milliseconds: summary(samples.map((sample) => sample.milliseconds)),
    transport: transportSummary(samples),
    output: outputs[0],
  };
}

async function warmMeasure(reader, scenario, bytes, modules) {
  const samples = [];
  let output;
  for (let index = 0; index < runs; index += 1) {
    const started = performance.now();
    const measured = await runBenchmarkOperation(reader, bytes, scenario, modules);
    const milliseconds = performance.now() - started;
    output ??= measured.output;
    if (stableJson(output) !== stableJson(measured.output)) throw new Error(`${reader} produced non-deterministic output for ${scenario.name}.`);
    samples.push({ milliseconds, ...measured.transport });
  }
  return {
    runs,
    milliseconds: summary(samples.map((sample) => sample.milliseconds)),
    transport: transportSummary(samples),
    output,
  };
}

async function fixtureRecord(filename) {
  const bytes = await readFile(join(root, "tests/fixtures", filename));
  return { bytes, record: { file: filename, bytes: bytes.byteLength, sha256: sha256(bytes) } };
}

async function benchmarkScenario(scenario, modules) {
  const { bytes, record } = await fixtureRecord(scenario.fixture);
  const outputs = {};
  const semanticErrors = [];
  for (const reader of readers) {
    try {
      outputs[reader] = (await runBenchmarkOperation(reader, bytes, scenario, modules)).output;
    } catch (error) {
      semanticErrors.push(`${reader} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  const contract = semanticErrors.length > 0
    ? { passed: false, failures: semanticErrors }
    : assertScenarioContract(outputs);
  const measurements = {};
  if (contract.passed) {
    for (const reader of readers) {
      const cold = await coldMeasure(reader, scenario);
      const warm = await warmMeasure(reader, scenario, bytes, modules);
      measurements[reader] = { accepted: true, cold, warm };
    }
  } else {
    for (const reader of readers) measurements[reader] = { accepted: false, timingRejected: true };
  }
  return {
    name: scenario.name,
    contract: scenario.contract,
    operation: scenario.operation,
    fixture: record,
    semantic: { ...contract, outputs },
    measurements,
  };
}

const metadata = await packageMetadata();
const modules = await loadModules();
const scenarios = [];
for (const scenario of benchmarkScenarios) scenarios.push(await benchmarkScenario(scenario, modules));
const report = {
  schemaVersion: 3,
  generatedAt: new Date().toISOString(),
  environment: {
    node: process.version,
    platform: process.platform,
    architecture: process.arch,
    runtime: `${process.platform}-${process.arch}`,
  },
  ...metadata,
  methodology: {
    percentile: "nearest-rank via floor((n - 1) * ratio) on sorted samples",
    sampleCount: { warm: runs, cold: coldRuns },
    cold: "Fresh child process; process launch and fixture I/O excluded; dynamic reader imports included.",
    warm: "Already imported reader modules; fixture I/O excluded; input construction and parsing included.",
    semanticGate: "Timing is recorded only when every reader matches the scenario's canonical output contract.",
    transport: "Toolkit remote-range uses an instrumented Blob adapter; competitors are measured with a full-input baseline.",
  },
  scenarios,
};
const target = outputPath(process.argv.slice(2));
const json = `${JSON.stringify(report, null, 2)}\n`;
if (target === null) process.stdout.write(json);
else await writeFile(target, json);

export { benchmarkScenario, metricSummary, percentile, summary, transportSummary };
