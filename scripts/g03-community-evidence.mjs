import { createHash } from "node:crypto";
import { readFile, stat, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const reportPath = join(root, "reports/g03-community-evidence.json");
const markdownPath = join(root, "reports/g03-community-evidence.md");
const checkOnly = process.argv.includes("--check");

function assert(condition, message) {
  if (!condition) throw new Error(`G03 evidence: ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function fileEvidence(relativePath) {
  const path = join(root, relativePath);
  const bytes = await readFile(path);
  return { path: relativePath, byteLength: bytes.byteLength, sha256: sha256(bytes) };
}

async function runScrubberEvidence() {
  const { inspectAndScrub } = await import("./fixture-scrubber.mjs");
  const fixturePath = join(root, "tests/fixtures/base.png");
  const temporary = await mkdtemp(join(tmpdir(), "image-metadata-g03-"));
  const outputPath = join(temporary, "scrubbed.png");
  try {
    const result = await inspectAndScrub({ input: fixturePath, report: join(temporary, "fixture-report.json"), output: outputPath, policy: "share-safe", maxInputBytes: 4 * 1024 * 1024 });
    assert(result.report.status === "passed", "the lawful fixture was not scrubbed successfully");
    assert(result.report.scrub.outputGenerated && result.report.scrub.reauditComplete, "scrubber did not produce and re-audit output");
    assert(result.report.source.file === basename(fixturePath), "scrubber report did not use a redistribution-safe source identity");
    assert(!JSON.stringify(result.report).includes("SECRET-123"), "scrubber report leaked a sensitive fixture value");
    assert((await stat(outputPath)).size > 0, "scrubber output is empty");
    let refused = false;
    try {
      await inspectAndScrub({ input: fixturePath, report: join(temporary, "limit-report.json"), output: null, policy: "share-safe", maxInputBytes: 1 });
    } catch (error) {
      refused = /exceeds/u.test(String(error?.message));
    }
    assert(refused, "the scrubber accepted an input beyond the configured byte limit");
    return {
      status: "passed",
      source: result.report.source,
      inspection: result.report.inspection,
      scrub: result.report.scrub,
      limitRefusal: true,
      reportPrivacy: "Raw metadata values, absolute paths, and fixture bytes are excluded.",
    };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

function validateSchema(schema) {
  assert(schema.$schema === "https://json-schema.org/draft/2020-12/schema", "community tag schema does not pin JSON Schema 2020-12");
  assert(schema.additionalProperties === false, "community tag schema allows undeclared top-level properties");
  assert(schema.required.includes("schemaVersion") && schema.required.includes("plugin") && schema.required.includes("tags"), "community tag schema omits required sections");
  assert(schema.properties.plugin.required.includes("license") && schema.properties.plugin.required.includes("sourceUrl"), "community tag schema omits plugin provenance requirements");
  assert(schema.properties.tags.maxItems === 4096, "community tag schema does not bound tag count");
  const tag = schema.properties.tags.items;
  for (const required of ["id", "name", "label", "description", "family", "type", "sensitivity", "rawValueBehavior", "validationRules"]) assert(tag.required.includes(required), `community tag schema omits ${required}`);
  assert(tag.properties.validationRules.maxItems === 64 && tag.properties.validationRules.items.maxLength === 128, "community validation rules are not bounded");
  assert(tag.properties.physicalIdentity.properties.namespaceUri.pattern === "^https://" || tag.properties.physicalIdentity.properties.namespaceUri.format === "uri", "physical namespace identity is not constrained");
  return { schemaVersion: schema.schemaVersion, requiredTagFields: tag.required, boundedTags: schema.properties.tags.maxItems };
}

function markdownReport(report) {
  const files = report.artifacts.map((artifact) => `| ${artifact.path} | ${artifact.byteLength} | ${artifact.sha256} |`).join("\n");
  return `# G03 community-program evidence\n\n- Status: **${report.status}**\n- Package: ${report.package.name} ${report.package.version}\n- Evidence version: ${report.reportVersion}\n\n## Executed fixture scrubber\n\n- Source: ${report.scrubber.source.file}\n- Source SHA-256: ${report.scrubber.source.sha256}\n- Inspection complete: ${report.scrubber.inspection.complete ? "yes" : "no"}\n- Policy-safe output generated: ${report.scrubber.scrub.outputGenerated ? "yes" : "no"}\n- Output re-audited: ${report.scrubber.scrub.reauditComplete ? "yes" : "no"}\n- Configured-limit refusal: ${report.scrubber.limitRefusal ? "yes" : "no"}\n\nThe scrubber report and this evidence exclude raw metadata values, absolute paths, and image bytes.\n\n## Schema validation\n\n- JSON Schema: ${report.schema.path}\n- Schema SHA-256: ${report.schema.sha256}\n- Required tag fields: ${report.schema.requiredTagFields.join(", ")}\n- Maximum tag definitions: ${report.schema.boundedTags}\n\n## Program artifacts\n\n| Path | Bytes | SHA-256 |\n| --- | ---: | --- |\n${files}\n\nThe contributor workflow is intentionally isolated: provenance, scrubber review, bounded tag data, plugin contracts, security handling, and response targets are documented independently. No third-party fixture bytes are retained by this report.\n`;
}

const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const schema = JSON.parse(await readFile(join(root, "schemas/community-tag-data.schema.json"), "utf8"));
const schemaSummary = validateSchema(schema);
const scrubber = await runScrubberEvidence();
const artifactPaths = [
  "COMMUNITY_PROVENANCE_TEMPLATE.md",
  "COMMUNITY_REVIEW_CHECKLIST.md",
  "COMMUNITY_CONTRIBUTOR_TICKETS.md",
  "COMMUNITY_SUPPORT_POLICY.md",
  "community/plugin-template.ts",
  "schemas/community-tag-data.schema.json",
  "scripts/fixture-scrubber.mjs",
];
const artifacts = await Promise.all(artifactPaths.map(fileEvidence));
const report = {
  schemaVersion: 1,
  reportVersion: "g03-community-program/1",
  status: "passed",
  generatedAt: new Date().toISOString(),
  package: { name: packageJson.name, version: packageJson.version },
  scrubber,
  schema: { path: "schemas/community-tag-data.schema.json", sha256: (await fileEvidence("schemas/community-tag-data.schema.json")).sha256, ...schemaSummary },
  artifacts,
  acceptance: {
    fixtureScrubber: ["bounded input", "safe report", "strict-policy output only after complete audit", "configured-limit refusal"],
    provenanceTemplate: ["source identity", "license and redistribution permission", "retrieval date", "hashes", "privacy review"],
    pluginTemplate: ["versioned HTTPS hashed source", "immutable identity", "explicit per-operation plugin", "no global registration"],
    tagSchema: ["bounded tag count", "physical identity", "sensitivity", "raw-value behavior", "validation rules"],
    contributorProcess: ["isolated ticket labels", "review checklist", "support response targets"],
  },
  reportPrivacy: "This evidence retains hashes, counts, statuses, and file identities only; it does not retain third-party bytes or raw metadata values.",
};

if (checkOnly) {
  const existing = JSON.parse(await readFile(reportPath, "utf8"));
  assert(existing.status === "passed", "checked-in report is not passed");
  assert(existing.reportVersion === report.reportVersion, "checked-in report version differs");
  assert(existing.schema.sha256 === report.schema.sha256, "checked-in schema hash is stale");
  assert(existing.scrubber.source.sha256 === report.scrubber.source.sha256, "checked-in fixture hash is stale");
  assert(existing.scrubber.limitRefusal === true && existing.scrubber.scrub.reauditComplete === true, "checked-in scrubber evidence is incomplete");
  for (const artifact of artifacts) {
    const previous = existing.artifacts.find((candidate) => candidate.path === artifact.path);
    assert(previous?.sha256 === artifact.sha256 && previous.byteLength === artifact.byteLength, `checked-in artifact evidence is stale for ${artifact.path}`);
  }
  const markdown = await readFile(markdownPath, "utf8");
  assert(markdown.includes("Status: **passed**") && markdown.includes("Configured-limit refusal: yes"), "checked-in Markdown evidence is incomplete");
  console.log(JSON.stringify({ status: "passed", checked: "reports/g03-community-evidence.json" }, null, 2));
} else {
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdownPath, markdownReport(report));
  console.log(JSON.stringify({ status: report.status, report: "reports/g03-community-evidence.json", artifacts: artifacts.length }, null, 2));
}
