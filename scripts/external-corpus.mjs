import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, relative, resolve, join, extname } from "node:path";
import { promisify } from "node:util";
import { exiftool } from "exiftool-vendored";

import { parseMetadata } from "../dist/index.js";
import registry from "./external-registry.json" with { type: "json" };
import allowlist from "./external-allowlist.json" with { type: "json" };
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
const fixtureRoot = process.env.EXTERNAL_FIXTURE_ROOT;
const outputDirectory = resolve(process.env.EXTERNAL_CORPUS_OUTPUT_DIR ?? "artifacts/external-corpus");
const supportedExtensions = new Set([".jpg", ".jpeg", ".tif", ".tiff", ".heic", ".heif"]);
const corpusSource = process.env.EXTERNAL_CORPUS_SOURCE ?? "ianare/exif-py";
const pinnedCorpusCommit = "a69bf74770caf6b333221658f5092ed69f99faac";
const minimumFixtures = Number(process.env.EXTERNAL_CORPUS_MIN_FIXTURES ?? 100);
const maxMissingLocalRate = Number(process.env.EXTERNAL_CORPUS_MAX_MISSING_LOCAL_RATE ?? 0.05);
const maxMismatched = Number(process.env.EXTERNAL_CORPUS_MAX_MISMATCHED ?? 0);

if (typeof fixtureRoot !== "string" || fixtureRoot.length === 0) throw new Error("EXTERNAL_FIXTURE_ROOT must point at the pinned external fixture directory.");
if (!Number.isSafeInteger(minimumFixtures) || minimumFixtures < 1) throw new Error("EXTERNAL_CORPUS_MIN_FIXTURES must be a positive integer.");
if (!Number.isFinite(maxMissingLocalRate) || maxMissingLocalRate < 0 || maxMissingLocalRate > 1) throw new Error("EXTERNAL_CORPUS_MAX_MISSING_LOCAL_RATE must be between 0 and 1.");
if (!Number.isSafeInteger(maxMismatched) || maxMismatched < 0) throw new Error("EXTERNAL_CORPUS_MAX_MISMATCHED must be a non-negative integer.");
validateRegistry(registry);
validateAllowlist(allowlist);

async function resolveCorpusCommit(directory) {
  const configuredCommit = process.env.EXTERNAL_CORPUS_COMMIT;
  let commit;
  let verifiedFromGit = false;
  try {
    const result = await execFileAsync("git", ["-C", resolve(directory), "rev-parse", "HEAD"], { encoding: "utf8" });
    commit = result.stdout.trim();
    verifiedFromGit = true;
  } catch (error) {
    if (configuredCommit === pinnedCorpusCommit) commit = configuredCommit;
    else throw new Error(`Unable to verify the external corpus commit: ${error instanceof Error ? error.message : String(error)}`);
  }
  const expected = configuredCommit ?? pinnedCorpusCommit;
  if (!/^[0-9a-f]{40}$/u.test(commit) || commit !== expected || commit !== pinnedCorpusCommit) {
    throw new Error(`External corpus commit ${commit || "unknown"} is not the pinned ${pinnedCorpusCommit}.`);
  }
  return { commit, verifiedFromGit };
}

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return files(path);
    return supportedExtensions.has(extname(entry.name).toLowerCase()) ? [path] : [];
  }));
  return nested.flat();
}

const paths = (await files(resolve(fixtureRoot))).sort();
if (paths.length === 0) throw new Error(`No supported corpus fixtures were examined under ${resolve(fixtureRoot)}.`);
const fixtures = [];
const corpusCommit = await resolveCorpusCommit(fixtureRoot);
const referenceVersion = await exiftool.version();
try {
  for (const path of paths) {
    const relativePath = relative(resolve(fixtureRoot), path).split("\\").join("/");
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
      fixtures.push(compareFixture({ relativePath, hash, bytes, result, external: reference, registry }));
    } catch (error) {
      fixtures.push({ fixture: relativePath, bytes: bytes?.length ?? null, sha256: bytes === undefined ? null : sha256(bytes), format: null, producer: "unknown", rows: [], error: error instanceof Error ? error.message : String(error) });
    }
  }
} finally {
  await exiftool.end();
}

const summary = summarize(fixtures);
const registryHash = sha256Json(registry);
const allowlistHash = sha256Json(allowlist);
const normalizationHash = sha256Json(NORMALIZATION_POLICY);
const gate = evaluateGate({ fixtures, summary, minimumFixtures, maxMissingLocalRate, maxMismatched, allowlist, currentVersion: packageJson.version });
const report = {
  schema: REPORT_SCHEMA,
  generatedAt: new Date().toISOString(),
  package: { name: packageJson.name, version: packageJson.version },
  reference: { tool: "ExifTool via exiftool-vendored", package: packageJson.devDependencies?.["exiftool-vendored"] ?? "unknown", version: referenceVersion, mode: "group-qualified numeric (-G1 -n)" },
  corpus: {
    source: corpusSource,
    pinnedCommit: pinnedCorpusCommit,
    commit: corpusCommit.commit,
    commitVerified: corpusCommit.verifiedFromGit,
    fixtureCount: paths.length,
    examinedCount: fixtures.length,
    totalBytes: fixtures.reduce((total, fixture) => total + (fixture.bytes ?? 0), 0),
    supportedExtensions: [...supportedExtensions].sort(),
    fixtureRoot: "external-fixture-root-not-published",
    hashes: "sha256",
  },
  registry: { schema: registry.schema, version: registry.version, sha256: registryHash, fieldCount: registry.fields.length, blockCount: registry.blocks.length },
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
    allowlist: report.allowlist,
    normalization: { ...NORMALIZATION_POLICY, sha256: normalizationHash },
    thresholds: gate.thresholds,
    gate,
    summary: { totals: summary.totals, byField: summary.byField, byProducer: summary.byProducer, byFormat: summary.byFormat },
    fixtures: fixtures.map(({ fixture, bytes, sha256: hash, format, producer, warningCount, error }) => ({ fixture, bytes, sha256: hash, format, producer, warningCount, ...(error === undefined ? {} : { error }) })),
  };
  await mkdir(dirname(evidencePath), { recursive: true });
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
}
if (!gate.passed) {
  console.error(`External corpus gate failed after examining ${fixtures.length} fixtures. Artifacts written to ${outputDirectory}.`);
  for (const failure of gate.failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`External corpus passed: ${fixtures.length} fixtures. Artifacts written to ${outputDirectory}.`);
}
