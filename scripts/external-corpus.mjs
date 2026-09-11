import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { relative, resolve, join, extname } from "node:path";
import { exiftool } from "exiftool-vendored";

import { parseMetadata } from "../dist/index.js";
import registry from "./external-registry.json" with { type: "json" };
import allowlist from "./external-allowlist.json" with { type: "json" };
import {
  REPORT_SCHEMA,
  compareFixture,
  evaluateGate,
  renderMarkdown,
  sha256,
  summarize,
  validateAllowlist,
  validateRegistry,
} from "./external-corpus-lib.mjs";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json");
const fixtureRoot = process.env.EXTERNAL_FIXTURE_ROOT;
const outputDirectory = resolve(process.env.EXTERNAL_CORPUS_OUTPUT_DIR ?? "artifacts/external-corpus");
const supportedExtensions = new Set([".jpg", ".jpeg", ".tif", ".tiff", ".heic", ".heif"]);
const minimumFixtures = Number(process.env.EXTERNAL_CORPUS_MIN_FIXTURES ?? 100);
const maxMissingLocalRate = Number(process.env.EXTERNAL_CORPUS_MAX_MISSING_LOCAL_RATE ?? 0.05);

if (typeof fixtureRoot !== "string" || fixtureRoot.length === 0) throw new Error("EXTERNAL_FIXTURE_ROOT must point at the pinned external fixture directory.");
if (!Number.isSafeInteger(minimumFixtures) || minimumFixtures < 1) throw new Error("EXTERNAL_CORPUS_MIN_FIXTURES must be a positive integer.");
if (!Number.isFinite(maxMissingLocalRate) || maxMissingLocalRate < 0 || maxMissingLocalRate > 1) throw new Error("EXTERNAL_CORPUS_MAX_MISSING_LOCAL_RATE must be between 0 and 1.");
validateRegistry(registry);
validateAllowlist(allowlist);

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
const fixtures = [];
try {
  for (const path of paths) {
    const relativePath = relative(resolve(fixtureRoot), path).split("\\").join("/");
    let bytes;
    try {
      bytes = await readFile(path);
      const hash = sha256(bytes);
      const [external, result] = await Promise.all([exiftool.read(path), parseMetadata(bytes)]);
      const reference = Array.isArray(external) ? external[0] ?? {} : external;
      fixtures.push(compareFixture({ relativePath, hash, bytes, result, external: reference, registry }));
    } catch (error) {
      fixtures.push({ fixture: relativePath, sha256: bytes === undefined ? null : sha256(bytes), format: null, producer: "unknown", rows: [], error: error instanceof Error ? error.message : String(error) });
    }
  }
} finally {
  await exiftool.end();
}

const summary = summarize(fixtures);
const gate = evaluateGate({ fixtures, summary, minimumFixtures, maxMissingLocalRate, allowlist });
const report = {
  schema: REPORT_SCHEMA,
  generatedAt: new Date().toISOString(),
  package: { name: packageJson.name, version: packageJson.version },
  reference: { tool: "ExifTool via exiftool-vendored", package: packageJson.devDependencies?.["exiftool-vendored"] ?? "unknown" },
  corpus: { fixtureCount: paths.length, supportedExtensions: [...supportedExtensions].sort(), fixtureRoot: "external-fixture-root-not-published", hashes: "sha256" },
  registry: { schema: registry.schema, version: registry.version, fieldCount: registry.fields.length, blockCount: registry.blocks.length },
  allowlist: { schema: allowlist.schema, version: allowlist.version, entries: allowlist.entries.length },
  fixtures,
  summary,
  gate,
};

await mkdir(outputDirectory, { recursive: true });
await writeFile(join(outputDirectory, "external-corpus-report.json"), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(join(outputDirectory, "external-corpus-report.md"), renderMarkdown(report));
if (!gate.passed) {
  console.error(`External corpus gate failed. Artifacts written to ${outputDirectory}.`);
  for (const failure of gate.failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`External corpus passed: ${fixtures.length} fixtures. Artifacts written to ${outputDirectory}.`);
}
