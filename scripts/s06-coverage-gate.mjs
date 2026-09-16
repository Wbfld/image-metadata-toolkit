import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const summaryPath = resolve(repositoryRoot, "coverage/coverage-summary.json");
const reportJsonPath = resolve(repositoryRoot, "reports/s06-coverage-evidence.json");
const reportMarkdownPath = resolve(repositoryRoot, "reports/s06-coverage-evidence.md");
const packagePath = resolve(repositoryRoot, "package.json");

const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
let summary;
try {
  summary = JSON.parse(await readFile(summaryPath, "utf8"));
} catch (error) {
  throw new Error(`S06 coverage gate requires a fresh V8 summary at ${relative(repositoryRoot, summaryPath)}: ${error instanceof Error ? error.message : String(error)}`);
}

function count(record, key) {
  const value = record?.[key];
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`S06 coverage summary contains an invalid ${key} count.`);
  return value;
}

function percentage(covered, total) {
  return total === 0 ? 100 : (covered / total) * 100;
}

function normalizeFileName(fileName) {
  const absolute = resolve(fileName);
  const relativeName = relative(repositoryRoot, absolute).replaceAll("\\", "/");
  if (relativeName.startsWith("../") || relativeName === "..") throw new Error(`S06 coverage file escapes the repository: ${fileName}`);
  return relativeName;
}

const fileRecords = [];
for (const [fileName, record] of Object.entries(summary)) {
  if (fileName === "total") continue;
  if (record === null || typeof record !== "object") throw new Error(`S06 coverage summary has no record for ${fileName}.`);
  const normalizedName = normalizeFileName(fileName);
  const branchesTotal = count(record.branches, "total");
  const branchesCovered = count(record.branches, "covered");
  const branchesSkipped = count(record.branches, "skipped");
  const statementsTotal = count(record.statements, "total");
  const functionsTotal = count(record.functions, "total");
  const linesTotal = count(record.lines, "total");
  if (branchesCovered > branchesTotal || branchesSkipped > branchesTotal) throw new Error(`S06 coverage branch counts are contradictory for ${normalizedName}.`);
  if (branchesSkipped !== 0) throw new Error(`S06 coverage contains skipped branch records for ${normalizedName}.`);
  fileRecords.push({
    file: normalizedName,
    branches: { covered: branchesCovered, total: branchesTotal, skipped: branchesSkipped, percent: percentage(branchesCovered, branchesTotal) },
    statements: { covered: count(record.statements, "covered"), total: statementsTotal, percent: percentage(count(record.statements, "covered"), statementsTotal) },
    functions: { covered: count(record.functions, "covered"), total: functionsTotal, percent: percentage(count(record.functions, "covered"), functionsTotal) },
    lines: { covered: count(record.lines, "covered"), total: linesTotal, percent: percentage(count(record.lines, "covered"), linesTotal) },
  });
}
if (fileRecords.length === 0) throw new Error("S06 coverage summary contains no source files.");

const total = summary.total;
if (total === null || typeof total !== "object") throw new Error("S06 coverage summary has no total record.");
const totalBranches = { covered: count(total.branches, "covered"), total: count(total.branches, "total"), skipped: count(total.branches, "skipped") };
if (totalBranches.skipped !== 0) throw new Error("S06 coverage total contains skipped branch records.");
if (totalBranches.covered > totalBranches.total || totalBranches.skipped > totalBranches.total) throw new Error("S06 coverage total branch counts are contradictory.");

const securityScopeDescription = "All bounded parser/indexer, metadata-decoder, structured-input, range-I/O, decompression, JUMBF-inventory, and security-limit source files. Mutation policy, surgery, selector, HTTP, and writer code remains covered by the repository-wide threshold; optional T04 C2PA runtime adapters are outside this Stage 6 parser/indexer scope.";
const securityPatterns = [
  /^src\/(?:security|io)\//u,
  /^src\/input\.ts$/u,
  /^src\/(?:jpeg|tiff|heif)-range\.ts$/u,
  /^src\/parsers\//u,
  /^src\/metadata\//u,
  /^src\/trust\/jumbf\.ts$/u,
];
const securityFiles = fileRecords.filter((record) => securityPatterns.some((pattern) => pattern.test(record.file)));
if (securityFiles.length === 0) throw new Error("S06 coverage gate matched no security-scope files.");
const securityBranches = securityFiles.reduce((result, record) => ({
  covered: result.covered + record.branches.covered,
  total: result.total + record.branches.total,
  skipped: result.skipped + record.branches.skipped,
}), { covered: 0, total: 0, skipped: 0 });
if (securityBranches.total === 0 || securityBranches.skipped !== 0) throw new Error("S06 security-scope branch records are empty or skipped.");

const policy = {
  overallBranchMinimumPercent: 85,
  securityScopeBranchMinimumPercent: 90,
  sourceInclusion: "src/**/*.ts",
  sourceExclusion: ["src/types.ts"],
  testExclusion: ["tests/cli.test.ts", "tests/r04-compatibility.test.ts"],
  command: "vitest run --coverage --exclude tests/cli.test.ts --exclude tests/r04-compatibility.test.ts --reporter=default --reporter=json --outputFile.json=coverage/test-results.json",
  skippedBranchPolicy: "Any skipped branch record fails the gate; no c8 ignore or source exclusion is used for difficult code.",
  securityScope: securityScopeDescription,
};
const overallBranchPercent = percentage(totalBranches.covered, totalBranches.total);
const securityBranchPercent = percentage(securityBranches.covered, securityBranches.total);
if (overallBranchPercent < policy.overallBranchMinimumPercent) throw new Error(`S06 overall branch coverage is ${overallBranchPercent.toFixed(2)}%, below ${policy.overallBranchMinimumPercent}%.`);
if (securityBranchPercent < policy.securityScopeBranchMinimumPercent) throw new Error(`S06 security-scope branch coverage is ${securityBranchPercent.toFixed(2)}%, below ${policy.securityScopeBranchMinimumPercent}%.`);

const vitestPackage = JSON.parse(await readFile(resolve(repositoryRoot, "node_modules/vitest/package.json"), "utf8"));
const coveragePackage = JSON.parse(await readFile(resolve(repositoryRoot, "node_modules/@vitest/coverage-v8/package.json"), "utf8"));
const report = {
  schema: "browser-image-metadata.s06-coverage-evidence.v1",
  checked: true,
  status: "passed",
  package: { name: packageJson.name, version: packageJson.version },
  runtime: { node: process.versions.node, v8: process.versions.v8, platform: process.platform, architecture: process.arch },
  tools: { vitest: vitestPackage.version, coverageV8: coveragePackage.version, provider: "v8" },
  policy,
  overall: { branches: { ...totalBranches, percent: overallBranchPercent }, statements: summary.total.statements, functions: summary.total.functions, lines: summary.total.lines },
  securityScope: { branches: { ...securityBranches, percent: securityBranchPercent }, files: securityFiles.map((record) => record.file), fileCount: securityFiles.length },
  files: fileRecords,
  evidence: { summary: "coverage/coverage-summary.json", json: "reports/s06-coverage-evidence.json", markdown: "reports/s06-coverage-evidence.md", containsSourceOrFixtureBytes: false },
};

await mkdir(dirname(reportJsonPath), { recursive: true });
await writeFile(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
const markdown = [
  "# S06 coverage evidence",
  "",
  `Status: **${report.status}** (checked: ${report.checked})`,
  "",
  `Package: ${report.package.name}@${report.package.version}; Node ${report.runtime.node}; V8 ${report.runtime.v8}; Vitest ${report.tools.vitest}; @vitest/coverage-v8 ${report.tools.coverageV8}.`,
  "",
  "## Enforced result",
  "",
  `Overall branch coverage: **${overallBranchPercent.toFixed(2)}%** (${totalBranches.covered}/${totalBranches.total}); required minimum: ${policy.overallBranchMinimumPercent}%.`,
  `Security-scope branch coverage: **${securityBranchPercent.toFixed(2)}%** (${securityBranches.covered}/${securityBranches.total}); required minimum: ${policy.securityScopeBranchMinimumPercent}%; files: ${securityFiles.length}.`,
  `Skipped branches: ${totalBranches.skipped} overall, ${securityBranches.skipped} in scope.`,
  "",
  "## Scope and policy",
  "",
  securityScopeDescription,
  "",
  `Source inclusion: \`${policy.sourceInclusion}\`; source exclusion: \`${policy.sourceExclusion.join("\", \"")}\`. Test-only exclusions are \`${policy.testExclusion.join("\", \"")}\` and do not exclude source files from V8 coverage.`,
  policy.skippedBranchPolicy,
  "",
  "## Security-scope files",
  "",
  "| File | Branches | Percent |",
  "| --- | ---: | ---: |",
  ...securityFiles.map((record) => `| ${record.file} | ${record.branches.covered}/${record.branches.total} | ${record.branches.percent.toFixed(2)}% |`),
  "",
  "The JSON report retains the complete checked per-source V8 counters and contains no source or fixture bytes.",
  "",
].join("\n");
await writeFile(reportMarkdownPath, markdown, "utf8");
console.log(`S06 coverage gate passed: ${overallBranchPercent.toFixed(2)}% overall branches and ${securityBranchPercent.toFixed(2)}% security-scope branches.`);
