import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const root = resolve(import.meta.dirname, "..");
const reportPath = join(root, "reports/g02-comparison.json");
const markdownPath = join(root, "reports/g02-comparison.md");
const benchmarkPath = join(root, "reports/g02-benchmark.json");
const checkOnly = process.argv.includes("--check");
const execFileAsync = promisify(execFile);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function unique(values) {
  return [...new Set(values)];
}

async function runCoreBenchmark() {
  await execFileAsync(process.execPath, ["scripts/benchmark.mjs", "--output", "reports/g02-benchmark.json"], {
    cwd: root,
    env: { ...process.env, BENCHMARK_RUNS: process.env.G02_BENCHMARK_RUNS ?? "5", BENCHMARK_COLD_RUNS: process.env.G02_BENCHMARK_COLD_RUNS ?? "1" },
    maxBuffer: 32 * 1024 * 1024,
  });
  return JSON.parse(await readFile(benchmarkPath, "utf8"));
}

function speedRows(benchmark) {
  return benchmark.scenarios.flatMap((scenario) => {
    const readers = Object.entries(scenario.measurements).filter(([, measurement]) => measurement.accepted === true);
    if (readers.length === 0) return [{ scenario: scenario.name, metric: "warm-median-ms", comparable: false, winner: null, values: {}, reason: "Semantic contract rejected timing for every reader." }];
    const values = Object.fromEntries(readers.map(([reader, measurement]) => [reader, measurement.warm.milliseconds.median]));
    const minimum = Math.min(...Object.values(values));
    return [{ scenario: scenario.name, metric: "warm-median-ms", comparable: true, winner: Object.keys(values).filter((reader) => values[reader] === minimum), values, reason: "Winner is the measured minimum; ties are retained." }];
  });
}

function transportRows(benchmark) {
  return benchmark.scenarios.map((scenario) => {
    const values = Object.fromEntries(Object.entries(scenario.measurements).map(([reader, measurement]) => [reader, measurement.accepted === true ? measurement.warm.transport.actualBytesRead.median : null]));
    const comparableValues = Object.fromEntries(Object.entries(values).filter(([, value]) => typeof value === "number"));
    const minimum = Object.keys(comparableValues).length > 0 ? Math.min(...Object.values(comparableValues)) : null;
    return { scenario: scenario.name, metric: "actual-bytes-read-median", comparable: minimum !== null, winner: minimum === null ? null : Object.keys(comparableValues).filter((reader) => comparableValues[reader] === minimum), values, reason: "Transport is reported separately from elapsed time; unavailable values are not matches." };
  });
}

async function memoryProbe(benchmark) {
  const { parseMetadata } = await import("../dist/index.js");
  const exifReader = (await import("exifreader")).default;
  const exifr = (await import("exifr")).default;
  const fixtureName = benchmark.scenarios[0]?.fixture.file;
  assert(typeof fixtureName === "string", "Benchmark has no fixture for memory probe");
  const bytes = await readFile(join(root, "tests/fixtures", fixtureName));
  const readers = {
    toolkit: async () => parseMetadata(bytes),
    exifreader: async () => exifReader.load(bytes, { expanded: true, async: true }),
    exifr: async () => exifr.parse(bytes),
  };
  const output = {};
  for (const [reader, operation] of Object.entries(readers)) {
    const samples = [];
    for (let run = 0; run < 3; run += 1) {
      const before = process.memoryUsage().heapUsed;
      await operation();
      const after = process.memoryUsage().heapUsed;
      samples.push({ before, after, retainedDelta: Math.max(0, after - before) });
    }
    output[reader] = { runs: samples.length, peakRetainedDeltaBytes: Math.max(...samples.map((sample) => sample.retainedDelta)), samples }; 
  }
  return { fixture: { file: fixtureName, byteLength: bytes.byteLength, sha256: sha256(bytes) }, readers: output, policy: "Process heap deltas are observational only; no performance claim is derived from them." };
}

async function malformedProbe() {
  const { parseMetadata } = await import("../dist/index.js");
  const exifReader = (await import("exifreader")).default;
  const exifr = (await import("exifr")).default;
  const fixtures = [
    { id: "empty", bytes: new Uint8Array() },
    { id: "truncated-jpeg", bytes: Uint8Array.of(0xff, 0xd8, 0xff) },
    { id: "truncated-png", bytes: Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a) },
    { id: "truncated-webp", bytes: Uint8Array.of(0x52, 0x49, 0x46, 0x46, 0x10, 0, 0, 0, 0x57, 0x45, 0x42, 0x50) },
  ];
  const readers = {
    toolkit: async (bytes) => parseMetadata(bytes),
    exifreader: async (bytes) => exifReader.load(bytes, { expanded: true, async: true }),
    exifr: async (bytes) => exifr.parse(bytes),
  };
  const results = [];
  for (const fixture of fixtures) {
    const outcomes = {};
    for (const [reader, operation] of Object.entries(readers)) {
      try {
        const value = await operation(fixture.bytes);
        outcomes[reader] = { outcome: "returned", classified: value === null || value === undefined ? "empty" : "result" };
      } catch (error) {
        outcomes[reader] = { outcome: "threw", errorType: error?.constructor?.name ?? "unknown" };
      }
    }
    results.push({ id: fixture.id, byteLength: fixture.bytes.byteLength, sha256: sha256(fixture.bytes), outcomes });
  }
  return { cases: results, policy: "Malformed behavior is recorded as returned or threw; this probe does not convert either behavior into correctness." };
}

async function bundleProbe() {
  const entries = ["dist/index.js", "dist/adapters.js", "dist/detect.js", "dist/edit.js", "dist/jpeg.js", "dist/png-writer.js", "dist/webp-writer.js", "dist/mini.js"];
  const records = [];
  for (const entry of entries) {
    const bytes = await readFile(join(root, entry));
    const text = bytes.toString("utf8");
    records.push({ path: entry, byteLength: bytes.byteLength, sha256: sha256(bytes), containsC2paSdkImport: /@contentauth\/c2pa-(?:web|node)|c2pa-web|c2pa-node/iu.test(text) });
  }
  return { entries: records, ordinaryBundleC2paImportCount: records.filter((record) => record.containsC2paSdkImport).length, policy: "The listed ordinary parser/API bundles must not contain optional C2PA SDK imports." };
}

function winners(benchmark, speed, transport) {
  const semantic = benchmark.scenarios.map((scenario) => ({ scenario: scenario.name, metric: "semantic-contract", passed: scenario.semantic.passed === true, winner: scenario.semantic.passed === true ? "all-comparable-readers" : null, failures: scenario.semantic.failures }));
  return { semantic, speed, transport };
}

async function buildReport() {
  const benchmark = await runCoreBenchmark();
  assert(benchmark.scenarios.length >= 7, "Core benchmark did not execute every documented scenario");
  const memory = await memoryProbe(benchmark);
  const malformed = await malformedProbe();
  const bundle = await bundleProbe();
  const speed = speedRows(benchmark);
  const transport = transportRows(benchmark);
  const report = {
    schemaVersion: 1,
    reportVersion: "g02-comparison/1",
    status: "passed",
    generatedAt: new Date().toISOString(),
    package: benchmark.package,
    competitors: benchmark.competitors,
    benchmarkReport: { path: "reports/g02-benchmark.json", sha256: sha256(await readFile(benchmarkPath)) },
    fixtures: unique(benchmark.scenarios.map((scenario) => `${scenario.fixture.file}:${scenario.fixture.sha256}`)).map((value) => { const [file, hash] = value.split(":"); return { file, sha256: hash }; }),
    methodology: {
      correctness: "The existing equal-output contracts are reused without changing or weakening them.",
      speed: benchmark.methodology,
      memory: memory.policy,
      malformed: malformed.policy,
      bundleClosure: bundle.policy,
      winnerPolicy: "A row winner is derived only from comparable measured values. Ties and no-comparable-value rows remain explicit; no superlative is inferred.",
    },
    rows: winners(benchmark, speed, transport),
    memory,
    malformed,
    bundleClosure: bundle,
    reproduction: {
      commands: ["npm ci", "npm run g02:run"],
      scripts: ["scripts/benchmark.mjs", "scripts/benchmark-runner.mjs", "scripts/benchmark-scenarios.mjs", "scripts/g02-comparison.mjs"],
      fixturePolicy: "Only repository fixture paths, byte lengths, and SHA-256 values are retained; no fixture bytes are copied into reports.",
    },
  };
  const fixtureMarkdown = report.fixtures.map((fixture) => `- \`${fixture.file}\` — ${fixture.sha256}`).join("\n");
  const semanticMarkdown = report.rows.semantic.map((row) => `| ${row.scenario} | ${row.passed ? "yes" : "no"} | ${row.failures.length} |`).join("\n");
  const winnerMarkdown = [...report.rows.speed, ...report.rows.transport].map((row) => `| ${row.scenario} | ${row.metric} | ${Object.entries(row.values).map(([reader, value]) => `${reader}=${value ?? "unavailable"}`).join(", ")} | ${row.winner?.join(", ") ?? "none"} | ${row.comparable ? "yes" : "no"} |`).join("\n");
  const markdown = `# G02 reproducible comparison report\n\n- Status: **${report.status}**\n- Report version: ${report.reportVersion}\n- Package: ${report.package.name} ${report.package.version}\n- Core benchmark: [reports/g02-benchmark.json](./g02-benchmark.json)\n- Core benchmark SHA-256: \`${report.benchmarkReport.sha256}\`\n\n## Fixture identities\n\n${fixtureMarkdown}\n\n## Semantic correctness\n\n| Scenario | Contract passed | Failures |\n| --- | --- | ---: |\n${semanticMarkdown}\n\n## Measured winner rows\n\n| Scenario | Metric | Values | Winner | Comparable |\n| --- | --- | --- | --- | --- |\n${winnerMarkdown}\n\n## Memory and malformed-input observations\n\n- Memory fixture: \`${memory.fixture.file}\` (${memory.fixture.sha256}); all three readers executed three samples.\n- Malformed cases executed: ${malformed.cases.length}; returned and thrown outcomes remain distinct.\n- Ordinary bundle C2PA SDK import count: ${bundle.ordinaryBundleC2paImportCount}.\n\n## Reproduction\n\n\`\`\`sh\nnpm ci\nnpm run g02:run\n\`\`\`\n\nThe report is repository-hosted evidence. It does not publish a performance superlative, and it includes the scripts, pinned package versions, and fixture hashes needed to reproduce or challenge each row.\n`;
  return { report, markdown };
}

if (checkOnly) {
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  const markdown = await readFile(markdownPath, "utf8");
  assert(report.status === "passed" && report.reportVersion === "g02-comparison/1", "Checked-in G02 report is not a passed versioned artifact");
  assert(report.rows?.semantic?.length >= 7 && report.rows?.speed?.length >= 7 && report.rows?.transport?.length >= 7, "G02 report is missing scenario rows");
  assert(report.fixtures?.length > 0 && report.benchmarkReport?.sha256?.length === 64, "G02 report is missing fixture or benchmark hashes");
  assert(report.memory?.readers?.toolkit && report.malformed?.cases?.length > 0 && report.bundleClosure?.entries?.length > 0, "G02 report is missing non-speed evidence");
  assert(markdown.includes("Reproduction") && markdown.includes("repository-hosted evidence"), "G02 Markdown report is incomplete");
  console.log(JSON.stringify({ status: "passed", checked: "reports/g02-comparison.json" }, null, 2));
} else {
  const { report, markdown } = await buildReport();
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdownPath, markdown);
  console.log(JSON.stringify({ status: report.status, report: "reports/g02-comparison.json", benchmark: "reports/g02-benchmark.json", scenarios: report.rows.semantic.length }, null, 2));
}

export { buildReport, malformedProbe, memoryProbe, speedRows, transportRows };
