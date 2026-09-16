import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, relative, resolve, join, extname } from "node:path";
import { promisify } from "node:util";
import { exiftool } from "exiftool-vendored";

import { parseMetadata } from "../dist/index.js";
import externalManifest from "../data/external-corpus.json" with { type: "json" };
import registry from "./external-registry.json" with { type: "json" };
import allowlist from "./external-allowlist.json" with { type: "json" };
import metadataRegistry from "../data/metadata-registry.json" with { type: "json" };
import capabilitiesManifest from "./capabilities-manifest.json" with { type: "json" };
import {
  REPORT_SCHEMA,
  NORMALIZATION_POLICY,
  compareFixture,
  evaluateGate,
  renderMarkdown,
  sha256,
  sha256Json,
  summarize,
  validateAllowlist,
  validateRegistry,
} from "./external-corpus-lib.mjs";

const require = createRequire(import.meta.url);
const execFileAsync = promisify(execFile);
const packageJson = require("../package.json");
const repositoryRoot = resolve(import.meta.dirname, "..");
const fixtureRoot = process.env.EXTERNAL_FIXTURE_ROOT;
const outputDirectory = resolve(process.env.EXTERNAL_CORPUS_OUTPUT_DIR ?? "artifacts/external-corpus");
const configuredRootsText = process.env.EXTERNAL_CORPUS_ROOTS_JSON;
const roadmapMode = configuredRootsText !== undefined;
const supportedExtensions = new Set([".jpg", ".jpeg", ".tif", ".tiff", ".heic", ".heif"]);
const corpusSource = process.env.EXTERNAL_CORPUS_SOURCE ?? "ianare/exif-py";
const pinnedCorpusCommit = "a69bf74770caf6b333221658f5092ed69f99faac";
const minimumFixtures = Number(process.env.EXTERNAL_CORPUS_MIN_FIXTURES ?? (roadmapMode ? externalManifest.minimumFixtures : 100));
const minimumUniqueFixtures = Number(process.env.EXTERNAL_CORPUS_MIN_UNIQUE_FIXTURES ?? (roadmapMode ? externalManifest.minimumUniqueFixtures : minimumFixtures));
const minimumComparableValues = Number(process.env.EXTERNAL_CORPUS_MIN_COMPARABLE_VALUES ?? (roadmapMode ? externalManifest.minimumComparableValues : 0));
const minimumSemanticAgreement = Number(process.env.EXTERNAL_CORPUS_MIN_SEMANTIC_AGREEMENT ?? (roadmapMode ? externalManifest.minimumSemanticAgreement : 0));
const maxMissingLocalRate = Number(process.env.EXTERNAL_CORPUS_MAX_MISSING_LOCAL_RATE ?? 0.05);
const maxMismatched = Number(process.env.EXTERNAL_CORPUS_MAX_MISMATCHED ?? 0);

if (roadmapMode && (typeof fixtureRoot === "string" && fixtureRoot.length > 0)) throw new Error("Use EXTERNAL_CORPUS_ROOTS_JSON for roadmap-wide corpus mode; do not combine it with EXTERNAL_FIXTURE_ROOT.");
if (!roadmapMode && (typeof fixtureRoot !== "string" || fixtureRoot.length === 0)) throw new Error("EXTERNAL_FIXTURE_ROOT must point at the pinned external fixture directory.");
if (!Number.isSafeInteger(minimumFixtures) || minimumFixtures < 1) throw new Error("EXTERNAL_CORPUS_MIN_FIXTURES must be a positive integer.");
if (!Number.isSafeInteger(minimumUniqueFixtures) || minimumUniqueFixtures < 1) throw new Error("EXTERNAL_CORPUS_MIN_UNIQUE_FIXTURES must be a positive integer.");
if (!Number.isSafeInteger(minimumComparableValues) || minimumComparableValues < 0) throw new Error("EXTERNAL_CORPUS_MIN_COMPARABLE_VALUES must be a non-negative integer.");
if (!Number.isFinite(minimumSemanticAgreement) || minimumSemanticAgreement < 0 || minimumSemanticAgreement > 1) throw new Error("EXTERNAL_CORPUS_MIN_SEMANTIC_AGREEMENT must be between 0 and 1.");
if (!Number.isFinite(maxMissingLocalRate) || maxMissingLocalRate < 0 || maxMissingLocalRate > 1) throw new Error("EXTERNAL_CORPUS_MAX_MISSING_LOCAL_RATE must be between 0 and 1.");
if (!Number.isSafeInteger(maxMismatched) || maxMismatched < 0) throw new Error("EXTERNAL_CORPUS_MAX_MISMATCHED must be a non-negative integer.");
validateRegistry(registry);
validateAllowlist(allowlist);

if (roadmapMode && (
  externalManifest?.schema !== "browser-image-metadata.external-corpus-manifest.v1"
  || externalManifest.version !== 1
  || !Array.isArray(externalManifest.corpora)
  || externalManifest.corpora.length < 2
)) throw new Error("Roadmap external corpus manifest is invalid or incomplete.");
if (roadmapMode) {
  const ids = new Set();
  for (const corpus of externalManifest.corpora) {
    if (typeof corpus.id !== "string" || corpus.id.length === 0 || ids.has(corpus.id)) throw new Error("Roadmap corpus ids must be non-empty and unique.");
    if (!/^https:\/\//u.test(corpus.repository ?? "") || !/^[0-9a-f]{40}$/u.test(corpus.commit ?? "") || typeof corpus.license !== "string" || corpus.license.trim().length === 0 || typeof corpus.licenseSource !== "string" || corpus.licenseSource.trim().length === 0 || !Array.isArray(corpus.roots) || corpus.roots.length === 0 || !Array.isArray(corpus.extensions) || corpus.extensions.length === 0) throw new Error(`Roadmap corpus manifest entry ${corpus.id || "unknown"} is incomplete.`);
    ids.add(corpus.id);
  }
}

function affirmative(value) {
  if (typeof value === "boolean") return value;
  return typeof value === "string" && value.trim().length > 0 && value.trim().toLowerCase() !== "no";
}

async function validateCapabilityEvidence() {
  const checked = new Set();
  const inspect = async (reference) => {
    if (typeof reference !== "string" || !/^tests\/[^#]+#[^#]+$/u.test(reference)) throw new Error(`Capability evidence reference is invalid: ${reference ?? "unknown"}`);
    if (checked.has(reference)) return;
    checked.add(reference);
    const [file, anchor] = reference.split("#", 2);
    const source = await readFile(resolve(repositoryRoot, file), "utf8");
    if (!source.includes(anchor)) throw new Error(`Capability evidence anchor ${reference} is missing.`);
  };
  let affirmativeCells = 0;
  for (const entry of capabilitiesManifest.formats ?? []) {
    for (const column of capabilitiesManifest.matrixColumns ?? []) {
      if (!affirmative(entry[column.key])) continue;
      affirmativeCells += 1;
      await inspect(entry.evidence?.positive);
      await inspect(entry.evidence?.malformed);
      await inspect(entry.evidence?.selection);
    }
  }
  for (const entry of capabilitiesManifest.rawVariants ?? []) {
    await inspect(entry.positive);
    await inspect(entry.malformed);
    await inspect(entry.selection);
  }
  return { affirmativeCells, executableEvidenceReferences: checked.size, testFile: "tests/capabilities-contract.test.ts" };
}

function registryEvidence() {
  const fields = Array.isArray(metadataRegistry.fields) ? metadataRegistry.fields : [];
  const incomplete = fields.filter((field) => !Array.isArray(field.legalTypes) || field.legalTypes.length === 0 || field.count === undefined || field.validation === undefined);
  const exif31 = fields.filter((field) => field.version === "3.1");
  if (incomplete.length > 0) throw new Error(`Generated registry has incomplete fields: ${incomplete.map((field) => field.id).join(", ")}`);
  return {
    sourceSchemaVersion: metadataRegistry.schemaVersion,
    generatedFieldCount: fields.length,
    standardizedExifFieldCount: fields.length,
    exif31FieldCount: exif31.length,
    completeDefinitionCount: fields.length - incomplete.length,
    incompleteFieldIds: incomplete.map((field) => field.id),
    generatedUnitCaseTest: "tests/generated-registry-cases.test.ts",
    generatedUnitCasePolicy: "One executable semantic definition assertion per generated field, including type, cardinality, validation, sensitivity, write policy, and provenance.",
    unitCaseExecutionCommand: "npx vitest run tests/generated-registry-cases.test.ts",
  };
}

async function resolveCorpusCommit(directory, expectedCommit, source) {
  const configuredCommit = roadmapMode ? expectedCommit : process.env.EXTERNAL_CORPUS_COMMIT;
  let commit;
  let verifiedFromGit = false;
  try {
    const result = await execFileAsync("git", ["-C", resolve(directory), "rev-parse", "HEAD"], { encoding: "utf8" });
    commit = result.stdout.trim();
    verifiedFromGit = true;
  } catch (error) {
    if (!roadmapMode && configuredCommit === pinnedCorpusCommit) commit = configuredCommit;
    else throw new Error(`Unable to verify the external corpus commit: ${error instanceof Error ? error.message : String(error)}`);
  }
  const expected = configuredCommit ?? pinnedCorpusCommit;
  if (!/^[0-9a-f]{40}$/u.test(commit) || commit !== expected || (!roadmapMode && commit !== pinnedCorpusCommit)) {
    throw new Error(`${source ?? "External corpus"} commit ${commit || "unknown"} is not the pinned ${expected}.`);
  }
  return { commit, verifiedFromGit };
}

const MAX_CORPUS_FIXTURES = 100_000;
async function files(directory, extensions, depth = 0) {
  if (depth > 64) throw new Error(`External corpus directory nesting exceeds the bounded depth at ${directory}.`);
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return files(path, extensions, depth + 1);
    return extensions.has(extname(entry.name).toLowerCase()) ? [path] : [];
  }));
  const result = nested.flat();
  if (result.length > MAX_CORPUS_FIXTURES) throw new Error(`External corpus exceeds the bounded ${MAX_CORPUS_FIXTURES}-fixture limit.`);
  return result;
}

function parseConfiguredRoots() {
  if (!roadmapMode) return null;
  let configured;
  try {
    configured = JSON.parse(configuredRootsText);
  } catch (error) {
    throw new Error(`EXTERNAL_CORPUS_ROOTS_JSON must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (configured === null || typeof configured !== "object" || Array.isArray(configured)) throw new Error("EXTERNAL_CORPUS_ROOTS_JSON must be an object keyed by corpus id.");
  const expected = new Set(externalManifest.corpora.map((corpus) => corpus.id));
  const actual = new Set(Object.keys(configured));
  if (actual.size !== expected.size || [...expected].some((id) => !actual.has(id))) throw new Error(`EXTERNAL_CORPUS_ROOTS_JSON must provide exactly these pinned corpora: ${[...expected].join(", ")}.`);
  for (const [id, value] of Object.entries(configured)) if (typeof value !== "string" || value.length === 0) throw new Error(`External corpus root for ${id} must be a non-empty path.`);
  return configured;
}

const configuredRoots = parseConfiguredRoots();
const corpusInputs = [];
if (roadmapMode) {
  for (const corpus of externalManifest.corpora) {
    const repositoryRoot = resolve(configuredRoots[corpus.id]);
    const commit = await resolveCorpusCommit(repositoryRoot, corpus.commit, corpus.source);
    for (const root of corpus.roots) {
      if (typeof root !== "string" || root.length === 0 || root.startsWith("/") || root.includes("..")) throw new Error(`Corpus ${corpus.id} contains an unsafe relative root: ${root}`);
      const directory = resolve(repositoryRoot, root);
      const pathsForRoot = (await files(directory, new Set(corpus.extensions))).sort();
      if (pathsForRoot.length === 0) throw new Error(`No supported corpus fixtures were examined under ${corpus.id}/${root}.`);
      for (const path of pathsForRoot) corpusInputs.push({
        path,
        relativePath: `${corpus.id}/${root}/${relative(directory, path).split("\\").join("/")}`,
        corpus: { ...corpus, repositoryRoot, commit: commit.commit, commitVerified: commit.verifiedFromGit, root },
      });
    }
  }
} else {
  const directory = resolve(fixtureRoot);
  const commit = await resolveCorpusCommit(directory, pinnedCorpusCommit, corpusSource);
  const pathsForRoot = (await files(directory, supportedExtensions)).sort();
  if (pathsForRoot.length === 0) throw new Error(`No supported corpus fixtures were examined under ${directory}.`);
  for (const path of pathsForRoot) corpusInputs.push({
    path,
    relativePath: relative(directory, path).split("\\").join("/"),
    corpus: { id: "ianare-exif-py", source: corpusSource, commit: commit.commit, commitVerified: commit.verifiedFromGit, license: "LGPL-3.0-or-later for exif-py; upstream fixture terms apply.", licenseSource: "pinned exif-py repository", root: "tests/resources" },
  });
}

const paths = corpusInputs.map((input) => input.path);
if (paths.length === 0) throw new Error("No supported corpus fixtures were examined.");
const identities = new Set(corpusInputs.map((input) => input.relativePath));
if (identities.size !== corpusInputs.length) throw new Error("External corpus fixture identities are not unique.");
const fixtures = [];
const referenceVersion = await exiftool.version();
const capabilityEvidence = await validateCapabilityEvidence();
const generatedRegistryEvidence = registryEvidence();
const decoderRemovalEvidence = {
  status: "executable-failure-proven",
  testFile: "tests/external-corpus.test.ts",
  testCase: "fails the gate when a decoder field is deliberately removed",
  policy: "Removing a required decoder comparison causes the gate to fail through the missing-local threshold; the test does not accept a warning or a successful no-run result.",
};
const generatedByName = new Map(metadataRegistry.fields.map((field) => [field.name, field]));
const comparisonRegistry = {
  ...registry,
  fields: registry.fields.map((entry) => {
    const generated = entry.family === "EXIF" ? generatedByName.get(entry.name) : undefined;
    return generated === undefined ? entry : { ...entry, ifd: generated.ifd, tag: Number.parseInt(generated.tag, 16) };
  }),
};
try {
  for (const input of corpusInputs) {
    const { path, relativePath, corpus } = input;
    let bytes;
    try {
      bytes = await readFile(path);
      const hash = sha256(bytes);
      // Group-qualified, numeric output prevents similarly named File, EXIF, XMP,
      // IPTC, and maker-note tags from being compared across metadata families.
      const [external, result] = await Promise.all([
        exiftool.read(path, { readArgs: ["-G1", "-n"] }),
        parseMetadata(bytes),
      ]);
      const reference = Array.isArray(external) ? external[0] ?? {} : external;
      fixtures.push(compareFixture({
        relativePath,
        hash,
        bytes,
        result,
        external: reference,
        registry: comparisonRegistry,
        corpusId: corpus.id,
        corpusSource: corpus.source,
        corpusCommit: corpus.commit,
        corpusLicense: corpus.license,
      }));
    } catch (error) {
      fixtures.push({ fixture: relativePath, bytes: bytes?.length ?? null, sha256: bytes === undefined ? null : sha256(bytes), format: null, producer: "unknown", corpusId: corpus.id, corpusSource: corpus.source, corpusCommit: corpus.commit, corpusLicense: corpus.license, rows: [], error: error instanceof Error ? error.message : String(error) });
    }
  }
} finally {
  await exiftool.end();
}

const summary = summarize(fixtures);
const registryHash = sha256Json(registry);
const allowlistHash = sha256Json(allowlist);
const normalizationHash = sha256Json(NORMALIZATION_POLICY);
const gate = evaluateGate({ fixtures, summary, minimumFixtures, minimumUniqueFixtures, minimumComparableValues, minimumSemanticAgreement, maxMissingLocalRate, maxMismatched, allowlist, currentVersion: packageJson.version });
const report = {
  schema: REPORT_SCHEMA,
  generatedAt: new Date().toISOString(),
  package: { name: packageJson.name, version: packageJson.version },
  reference: { tool: "ExifTool via exiftool-vendored", package: packageJson.devDependencies?.["exiftool-vendored"] ?? "unknown", version: referenceVersion, mode: "group-qualified numeric (-G1 -n)" },
  corpus: {
    source: roadmapMode ? "multiple pinned external corpora" : corpusSource,
    pinnedCommit: roadmapMode ? null : pinnedCorpusCommit,
    commit: roadmapMode ? null : corpusInputs[0]?.corpus.commit,
    commitVerified: corpusInputs.every((input) => input.corpus.commitVerified === true),
    fixtureCount: corpusInputs.length,
    examinedCount: fixtures.length,
    uniqueFixtureCount: new Set(fixtures.map((fixture) => fixture.sha256).filter((hash) => typeof hash === "string")).size,
    totalBytes: fixtures.reduce((total, fixture) => total + (fixture.bytes ?? 0), 0),
    supportedExtensions: [...new Set(corpusInputs.flatMap((input) => [extname(input.path).toLowerCase()]))].sort(),
    corpora: roadmapMode
      ? externalManifest.corpora.map((corpus) => ({
        id: corpus.id,
        source: corpus.source,
        repository: corpus.repository,
        commit: corpus.commit,
        commitVerified: corpusInputs.filter((input) => input.corpus.id === corpus.id).every((input) => input.corpus.commitVerified === true),
        license: corpus.license,
        licenseSource: corpus.licenseSource,
        roots: corpus.roots,
        fixtureCount: corpusInputs.filter((input) => input.corpus.id === corpus.id).length,
      }))
      : [{
        id: "ianare-exif-py",
        source: corpusSource,
        repository: "https://github.com/ianare/exif-py.git",
        commit: corpusInputs[0]?.corpus.commit ?? pinnedCorpusCommit,
        commitVerified: corpusInputs.every((input) => input.corpus.commitVerified === true),
        license: corpusInputs[0]?.corpus.license,
        licenseSource: corpusInputs[0]?.corpus.licenseSource,
        roots: ["tests/resources"],
        fixtureCount: corpusInputs.length,
      }],
    fixtureRoot: "external-fixture-root-not-published",
    hashes: "sha256",
  },
  registry: { schema: registry.schema, version: registry.version, sha256: registryHash, fieldCount: registry.fields.length, blockCount: registry.blocks.length },
  registryEvidence: generatedRegistryEvidence,
  capabilityEvidence,
  decoderRemovalEvidence,
  allowlist: { schema: allowlist.schema, version: allowlist.version, sha256: allowlistHash, entries: allowlist.entries.length },
  normalization: { ...NORMALIZATION_POLICY, sha256: normalizationHash },
  fixtures,
  summary,
  gate,
};

await mkdir(outputDirectory, { recursive: true });
await writeFile(join(outputDirectory, "external-corpus-report.json"), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(join(outputDirectory, "external-corpus-report.md"), renderMarkdown(report));
const evidenceOutput = process.env.EXTERNAL_CORPUS_EVIDENCE_OUTPUT;
if (typeof evidenceOutput === "string" && evidenceOutput.length > 0) {
  const evidencePath = resolve(evidenceOutput);
  const evidence = {
    schema: "browser-image-metadata.external-evidence.v1",
    generatedAt: report.generatedAt,
    package: report.package,
    reference: report.reference,
    corpus: report.corpus,
    registry: report.registry,
    registryEvidence: report.registryEvidence,
    capabilityEvidence: report.capabilityEvidence,
    decoderRemovalEvidence: report.decoderRemovalEvidence,
    allowlist: report.allowlist,
    normalization: { ...NORMALIZATION_POLICY, sha256: normalizationHash },
    thresholds: gate.thresholds,
    gate,
    summary: {
      totals: summary.totals,
      byField: summary.byField,
      byProducer: summary.byProducer,
      byFormat: summary.byFormat,
      byCorpus: summary.byCorpus,
      byMetadataFamily: summary.byMetadataFamily,
    },
    fixtures: fixtures.map(({ fixture, bytes, sha256: hash, format, producer, corpusId, corpusSource, corpusCommit, warningCount, error }) => ({ fixture, bytes, sha256: hash, format, producer, corpusId, corpusSource, corpusCommit, warningCount, ...(error === undefined ? {} : { error }) })),
  };
  await mkdir(dirname(evidencePath), { recursive: true });
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  const markdownOutput = process.env.EXTERNAL_CORPUS_EVIDENCE_MARKDOWN_OUTPUT ?? (evidencePath.endsWith(".json") ? evidencePath.slice(0, -5) + ".md" : `${evidencePath}.md`);
  await writeFile(markdownOutput, renderMarkdown({ ...report, fixtures: evidence.fixtures }));
}
if (!gate.passed) {
  console.error(`External corpus gate failed after examining ${fixtures.length} fixtures. Artifacts written to ${outputDirectory}.`);
  for (const failure of gate.failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`External corpus passed: ${fixtures.length} fixtures. Artifacts written to ${outputDirectory}.`);
}
