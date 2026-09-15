import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";

const DEFAULT_MAX_INPUT_BYTES = 256 * 1024 * 1024;

function fail(message) {
  throw new Error(`Fixture scrubber: ${message}`);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function countBy(values) {
  const counts = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}

function stableReport(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function markdownReport(report) {
  const findings = Object.entries(report.inspection.findingsByCategory).map(([category, count]) => `| ${category} | ${count} |`).join("\n");
  const outputHash = report.scrub.outputSha256 === null ? "not generated" : "`" + report.scrub.outputSha256 + "`";
  return `# Fixture scrubber report\n\n- Status: **${report.status}**\n- Policy: ${report.policy.id} ${report.policy.version}\n- Source: ${report.source.file}\n- Source SHA-256: ${report.source.sha256}\n\n## Inspection\n\n- Format: ${report.inspection.format}\n- Complete: ${report.inspection.complete ? "yes" : "no"}\n- Safe under selected policy: ${report.inspection.safe ? "yes" : "no"}\n\n| Finding category | Count |\n| --- | ---: |\n${findings || "| none | 0 |"}\n\n## Scrub result\n\n- Successful: ${report.scrub.successful ? "yes" : "no"}\n- Output generated: ${report.scrub.outputGenerated ? "yes" : "no"}\n- Output SHA-256: ${outputHash}\n- Re-audit complete: ${report.scrub.reauditComplete ? "yes" : "no"}\n\nThe report contains no raw metadata values or image bytes. A failed or incomplete inspection never produces a scrubbed output.\n`;
}

function parseArguments(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("--")) fail(`unexpected argument ${argument}`);
    const key = argument.slice(2);
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) fail(`--${key} requires a value`);
    values[key] = value;
    index += 1;
  }
  if (typeof values.input !== "string" || typeof values.report !== "string") fail("--input and --report are required");
  if (values.policy !== undefined && !["share-safe", "location-safe", "anonymous", "retain-rights", "publisher", "accessibility", "forensic-preserve"].includes(values.policy)) fail(`unsupported policy ${values.policy}`);
  const maxInputBytes = values["max-input-bytes"] === undefined ? DEFAULT_MAX_INPUT_BYTES : Number(values["max-input-bytes"]);
  if (!Number.isSafeInteger(maxInputBytes) || maxInputBytes < 1) fail("--max-input-bytes must be a positive safe integer");
  return { input: resolve(values.input), report: resolve(values.report), output: values.output === undefined ? null : resolve(values.output), policy: values.policy ?? "share-safe", maxInputBytes };
}

function assertOutputDoesNotOverwriteSource(input, output) {
  if (output !== null && output === input) fail("--output must not overwrite the source fixture");
}

async function inspectAndScrub(options) {
  assertOutputDoesNotOverwriteSource(options.input, options.output);
  const info = await stat(options.input);
  if (!info.isFile()) fail("--input must identify a regular file");
  if (info.size > options.maxInputBytes) fail(`source exceeds ${options.maxInputBytes} bytes`);
  const bytes = new Uint8Array(await readFile(options.input));
  if (bytes.byteLength !== info.size) fail("source changed while it was being read");
  const { auditPrivacy, getPrivacyPolicy, sanitizeMetadata } = await import("../dist/index.js");
  const policy = getPrivacyPolicy(options.policy);
  const inspection = await auditPrivacy(bytes);
  const findings = inspection.findings.map((finding) => finding.category);
  const scrubbed = await sanitizeMetadata(bytes, { policy: options.policy });
  let outputBytes = null;
  let reauditComplete = false;
  let outputSha256 = null;
  if (scrubbed.successful && scrubbed.data !== null) {
    outputBytes = scrubbed.data;
    outputSha256 = sha256(outputBytes);
    const reaudit = await auditPrivacy(outputBytes);
    reauditComplete = reaudit.complete;
    if (!reauditComplete) fail("scrubbed output could not be completely re-audited");
    if (options.output !== null) {
      const outputInfo = await stat(dirname(options.output)).catch(() => null);
      if (outputInfo === null || !outputInfo.isDirectory()) fail("output directory does not exist");
      await writeFile(options.output, outputBytes, { flag: "wx" });
    }
  }
  const report = {
    schemaVersion: 1,
    reportVersion: "fixture-scrub/1",
    status: scrubbed.successful && scrubbed.data !== null && reauditComplete ? "passed" : "refused",
    generatedAt: new Date().toISOString(),
    policy: { id: policy.id, version: policy.version },
    source: { file: basename(options.input), byteLength: bytes.byteLength, sha256: sha256(bytes) },
    inspection: { format: inspection.format, complete: inspection.complete, safe: inspection.safe, findingsByCategory: countBy(findings), findingCount: findings.length, warningCount: inspection.warnings.length, gapCount: inspection.gaps.length },
    scrub: { successful: scrubbed.successful, outputGenerated: outputBytes !== null, outputPathProvided: options.output !== null, outputSha256, reauditComplete, retained: scrubbed.retained, warningCount: scrubbed.warnings.length, reasonCount: scrubbed.reasons.length },
    privacy: "Raw findings, lexical values, absolute paths, and image bytes are intentionally excluded from this redistribution-safe report.",
  };
  return { report, markdown: markdownReport(report), outputBytes };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const result = await inspectAndScrub(options);
  await writeFile(options.report, stableReport(result.report));
  await writeFile(options.report.replace(/\.json$/iu, ".md"), result.markdown);
  process.stdout.write(`${JSON.stringify({ status: result.report.status, report: options.report, outputGenerated: result.report.scrub.outputGenerated }, null, 2)}\n`);
  if (result.report.status !== "passed") process.exitCode = 1;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(import.meta.filename)) await main();

export { countBy, inspectAndScrub, markdownReport, parseArguments, sha256, stableReport };
