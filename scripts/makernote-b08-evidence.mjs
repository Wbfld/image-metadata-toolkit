import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { TextEncoder } from "node:util";
import { pathToFileURL } from "node:url";
import { exiftool } from "exiftool-vendored";

const root = resolve(new URL("..", import.meta.url).pathname);
const manifestPath = join(root, "data/makernote-b08-sources.json");
const corpusRoot = process.env.MAKERNOTE_B08_CORPUS_DIR;
const reportJsonPath = join(root, "reports/makernote-b08-evidence.json");
const reportMarkdownPath = join(root, "reports/makernote-b08-evidence.md");

function fail(message) {
  throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stable(value) {
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Uint8Array) return { type: "bytes", sha256: sha256(value), length: value.byteLength };
  if (Array.isArray(value)) return value.map(stable);
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function hashValue(value) {
  return sha256(new TextEncoder().encode(JSON.stringify(stable(value))));
}

function normalize(value, policy) {
  if (value === undefined || value === null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (policy === "numeric-sequence") {
    const sequence = Array.isArray(value)
      ? value
      : typeof value === "string"
        ? value.trim().split(/\s+/u).filter((item) => item.length > 0)
        : null;
    if (sequence === null) return JSON.stringify(stable(value));
    return sequence.map((item) => typeof item === "number" ? String(item) : String(item).trim()).join(" ");
  }
  if (policy === "dimensions") {
    if (Array.isArray(value) && value.length === 2 && value.every((item) => typeof item === "number" && Number.isFinite(item))) return `${value[0]}x${value[1]}`;
    if (typeof value === "string") return value.trim().replace(/\s*[×x]\s*/u, "x");
  }
  if (typeof value === "string") {
    const trimmed = policy === "ascii-padding" || policy === "case-insensitive-ascii" ? value.replace(/[\0 ]+$/gu, "").trim() : value.trim();
    const normalized = trimmed.normalize("NFC");
    return policy === "case-insensitive-ascii" ? normalized.toLocaleLowerCase("en-US") : normalized;
  }
  return JSON.stringify(stable(value));
}

function isInside(base, candidate) {
  const basePath = resolve(base);
  const candidatePath = resolve(candidate);
  const prefix = basePath.endsWith(sep) ? basePath : `${basePath}${sep}`;
  return candidatePath === basePath || candidatePath.startsWith(prefix);
}

function increment(bucket, status, found) {
  bucket.found += found ? 1 : 0;
  bucket.matched += status === "matched" ? 1 : 0;
  bucket.normalizedMatch += status === "normalized-match" ? 1 : 0;
  bucket.mismatched += status === "mismatched" ? 1 : 0;
  bucket.missingLocal += status === "missing-local" ? 1 : 0;
  bucket.missingReference += status === "missing-reference" ? 1 : 0;
  bucket.nonComparable += status === "non-comparable" ? 1 : 0;
}

function newCounts() {
  return { found: 0, matched: 0, normalizedMatch: 0, mismatched: 0, missingLocal: 0, missingReference: 0, nonComparable: 0 };
}

function addComparison(counts, comparison) {
  counts.records.push(comparison);
  const found = comparison.localPresent || comparison.referencePresent;
  increment(counts.overall, comparison.status, found);
  for (const [key, value] of [["field", comparison.fieldId], ["producer", comparison.producer], ["format", comparison.format]]) {
    const table = counts[`by${key[0].toUpperCase()}${key.slice(1)}`];
    const bucket = table[value] ?? newCounts();
    increment(bucket, comparison.status, found);
    table[value] = bucket;
  }
}

function compareValues(fieldId, producer, format, fixtureId, localValue, referenceValue, oracleKey, policy, reason = null) {
  const localPresent = localValue !== undefined && localValue !== null;
  const referencePresent = referenceValue !== undefined && referenceValue !== null;
  let status;
  if (reason !== null) status = "non-comparable";
  else if (!localPresent) status = "missing-local";
  else if (!referencePresent) status = "missing-reference";
  else {
    const local = normalize(localValue, policy);
    const reference = normalize(referenceValue, policy);
    status = local === reference ? (typeof localValue === "string" && localValue !== referenceValue ? "normalized-match" : "matched") : "mismatched";
  }
  return {
    fixtureId,
    producer,
    format,
    fieldId,
    oracleKey,
    status,
    localPresent,
    referencePresent,
    ...(localPresent ? { localNormalizedSha256: hashValue(normalize(localValue, policy)) } : {}),
    ...(referencePresent ? { referenceNormalizedSha256: hashValue(normalize(referenceValue, policy)) } : {}),
    ...(reason === null ? {} : { reason }),
  };
}

function noteFields(notes) {
  return notes.flatMap((note) => note.fields.map((field) => ({ note, field })));
}

function packModulePath(moduleName) {
  const clean = moduleName.replace(/^\.\//u, "");
  return join(root, "dist", `${clean}.js`);
}

async function verifyFixture(fixture, pack, plugin, parseMetadata, inspectMakerNotes, defaultLimits, allPlugins, counts) {
  if (corpusRoot === undefined || corpusRoot.length === 0) fail("MAKERNOTE_B08_CORPUS_DIR is required; no corpus was examined.");
  const fixturePath = resolve(corpusRoot, fixture.path);
  if (!isInside(corpusRoot, fixturePath)) fail(`Fixture path escapes the corpus directory: ${fixture.path}`);
  let bytes;
  try {
    bytes = new Uint8Array(await readFile(fixturePath));
  } catch {
    fail(`Required B08 fixture is missing: ${fixture.path}`);
  }
  if (bytes.byteLength !== fixture.bytes) fail(`Fixture byte length differs for ${fixture.id}: expected ${fixture.bytes}, got ${bytes.byteLength}.`);
  const digest = sha256(bytes);
  if (digest !== fixture.sha256) fail(`Fixture SHA-256 differs for ${fixture.id}: expected ${fixture.sha256}, got ${digest}.`);

  const options = { select: { groups: ["MakerNote", "Dimensions"] }, makerNotePlugins: [plugin] };
  const parsed = await parseMetadata(bytes, options);
  const notes = (parsed.makerNotes?.notes ?? []).filter((note) => note.plugin?.id === pack.id);
  if (notes.length === 0 || notes.every((note) => note.fields.length === 0)) fail(`Pack ${pack.id} did not decode a field from required fixture ${fixture.id}.`);
  for (const note of notes) {
    if (note.status !== "detected-decoded") fail(`Pack ${pack.id} did not return detected-decoded for ${fixture.id}: ${note.status}.`);
    if (!Number.isSafeInteger(note.provenance.noteOffset) || note.provenance.noteOffset < 0 || note.provenance.noteOffset + note.byteLength > bytes.length) fail(`Pack ${pack.id} returned unsafe note provenance for ${fixture.id}.`);
    for (const field of note.fields) {
      if (field.provenance.noteRelativeOffset + field.provenance.rangeLength > note.byteLength || field.provenance.originalFileOffset === null) fail(`Pack ${pack.id} returned unsafe field provenance for ${fixture.id}/${field.id}.`);
    }
  }

  const noPlugin = await parseMetadata(bytes, { select: { groups: ["MakerNote"] } });
  const noPluginNotes = noPlugin.makerNotes?.notes ?? [];
  if (noPluginNotes.some((note) => note.status === "detected-decoded" && note.fields.length > 0)) fail(`The no-plugin control unexpectedly decoded ${fixture.id}.`);

  const allParsed = await parseMetadata(bytes, { select: { groups: ["MakerNote"] }, makerNotePlugins: allPlugins });
  const recognizedIds = new Set((allParsed.makerNotes?.notes ?? []).flatMap((note) => note.plugin === null ? [] : [note.plugin.id]));
  if (recognizedIds.size !== 1 || !recognizedIds.has(pack.id)) fail(`Cross-pack isolation failed for ${fixture.id}: ${JSON.stringify([...recognizedIds])}.`);

  const oracle = await exiftool.read(fixturePath);
  const packComparisons = {
    "apple:0x0001": { key: "MakerNoteVersion", policy: "default" },
    "canon:0x000c": { key: "SerialNumber", policy: "default" },
    "nikon:0x0004": { key: "Quality", policy: "ascii-padding" },
    "nikon:0x0005": { key: "WhiteBalance", policy: "case-insensitive-ascii" },
    "nikon:0x0007": { key: "FocusMode", policy: "ascii-padding" },
    "nikon:0x000b": { key: "WhiteBalanceFineTune", policy: "numeric-sequence" },
    "nikon:0x00a7": { key: "ShutterCount", policy: "default" },
    "fujifilm:0x1000": { key: "Quality", policy: "ascii-padding" },
    "fujifilm:0x1447": { key: "FujiModel", policy: "default" },
    "pentax:0x0001": { key: "PentaxModelType", policy: "default", primaryOnly: true },
    "pentax:0x0002": { key: "PreviewImageSize", policy: "dimensions", primaryOnly: true },
    "pentax:0x0003": { key: "PreviewImageLength", policy: "default", primaryOnly: true, nonComparableFixtureIds: ["pentax-k-1-8552"] },
  };
  const primaryNote = notes[0];
  for (const { note, field } of noteFields(notes)) {
    const mapping = packComparisons[field.id];
    const duplicatePrimaryOnly = mapping?.primaryOnly === true && note !== primaryNote;
    const fixturePrimaryNotComparable = mapping?.nonComparableFixtureIds?.includes(fixture.id) === true;
    const nonComparableReason = fixturePrimaryNotComparable
      ? "This fixture contains multiple preview resources and the independent oracle selects a different preview than the MakerNote-linked resource; no one-to-one comparison is sound."
      : duplicatePrimaryOnly
      ? "This is a preserved duplicate MakerNote instance; the independent oracle exposes only the primary instance for this field."
      : "No independent oracle key has been established for this vendor field; local value is retained by hash only.";
    const comparison = mapping === undefined || duplicatePrimaryOnly || fixturePrimaryNotComparable
      ? compareValues(field.id, pack.vendor, fixture.format, fixture.id, field.value, undefined, null, "default", nonComparableReason)
      : compareValues(field.id, pack.vendor, fixture.format, fixture.id, field.value, oracle[mapping.key], mapping.key, mapping.policy);
    addComparison(counts, comparison);
  }
  const dimensions = parsed.dimensions;
  const primaryDimensionsAreComparable = fixture.format !== "dng" && fixture.format !== "rw2";
  const dimensionReason = primaryDimensionsAreComparable
    ? null
    : "The package result and the independent oracle select different container-level primary images for this RAW family (preview dimensions versus sensor dimensions), so a dimension equality claim would be unsound for MakerNote evidence.";
  const width = compareValues("image:dimensions.width", pack.vendor, fixture.format, fixture.id, dimensions?.width, oracle.ImageWidth, "ImageWidth", "default", dimensionReason);
  const height = compareValues("image:dimensions.height", pack.vendor, fixture.format, fixture.id, dimensions?.height, oracle.ImageHeight, "ImageHeight", "default", dimensionReason);
  addComparison(counts, width);
  addComparison(counts, height);

  const rawResult = await parseMetadata(bytes, { select: { groups: ["EXIF"] } });
  const rawFields = rawResult.exif?.fields.filter((field) => (field.tag === 0x927c || field.tag === 0x002e) && field.raw instanceof Uint8Array) ?? [];
  const rawField = rawFields.find((candidate) => {
    if (!(candidate.raw instanceof Uint8Array)) return false;
    const candidateOffset = candidate.source?.valueOffset ?? 0;
    const candidateInput = { id: `${fixture.id}:candidate`, fieldId: candidate.id, raw: candidate.raw, noteOffset: candidateOffset, sourceLength: Math.max(bytes.length, candidateOffset + candidate.raw.byteLength), tiffOffset: candidate.source?.entryOffset ?? null, fileOffset: candidateOffset, blockId: `b08:${fixture.id}:candidate` };
    return inspectMakerNotes([candidateInput], defaultLimits, { plugins: [plugin] }).notes.some((note) => note.plugin?.id === pack.id);
  });
  if (!(rawField?.raw instanceof Uint8Array)) fail(`The MakerNote source range could not be recovered for ${fixture.id}.`);
  const rawNoteOffset = rawField.source?.valueOffset ?? 0;
  const boundedInput = (raw) => ({ id: `${fixture.id}:control`, fieldId: rawField.id, raw, noteOffset: rawNoteOffset, sourceLength: Math.max(bytes.length, rawNoteOffset + raw.byteLength), tiffOffset: rawField.source?.entryOffset ?? null, fileOffset: rawNoteOffset, blockId: `b08:${fixture.id}:control` });
  const truncated = inspectMakerNotes([boundedInput(rawField.raw.slice(0, Math.min(5, rawField.raw.length)))], defaultLimits, { plugins: [plugin] });
  const truncatedNotes = truncated.notes;
  if (truncatedNotes.some((note) => note.status === "detected-decoded" && note.fields.length > 0 && note.opaqueRanges.length === 0)) fail(`Truncation control incorrectly remained complete for ${fixture.id}.`);
  const limited = inspectMakerNotes([boundedInput(rawField.raw)], { ...defaultLimits, maxIfdEntries: 1 }, { plugins: [plugin] });
  if (!limited.notes.some((note) => note.status === "limit-exceeded" || note.status === "detected-decoded" && note.opaqueRanges.length > 0)) fail(`Entry-limit control did not remain bounded for ${fixture.id}.`);

  return {
    id: fixture.id,
    path: fixture.path,
    format: fixture.format,
    model: fixture.model,
    bytes: bytes.byteLength,
    sha256: digest,
    packId: pack.id,
    packVersion: plugin.identity.version,
    noteCount: notes.length,
    decodedNoteCount: notes.filter((note) => note.status === "detected-decoded").length,
    fieldCount: notes.reduce((total, note) => total + note.fields.length, 0),
    opaqueRangeCount: notes.reduce((total, note) => total + note.opaqueRanges.length, 0),
    diagnosticCodes: [...new Set(notes.flatMap((note) => note.diagnostics.map((item) => item.code)))],
    sourceProvenance: plugin.identity.sources?.filter((source) => source.role === "fixture").map((source) => ({ id: source.id, sha256: source.sha256 })) ?? [],
    controls: { noPluginRemainedOpaque: true, crossPackRecognizedOnlyExpectedPack: true, truncationRemainedIncomplete: true, entryLimitRemainedBounded: true },
    oracle: { package: "exiftool-vendored", implementationVersion: oracle.ExifToolVersion ?? "unknown" },
  };
}

function markdown(report) {
  const lines = [
    "# B08 MakerNote vendor-pack evidence",
    "",
    `- Package: \`${report.package.name}@${report.package.version}\``,
    `- Evidence schema: \`${report.schema}\``,
    `- Real fixtures examined: ${report.fixtureCount}`,
    `- Vendor packs: ${report.packCount}`,
    `- Corpus images copied into repository: no`,
    `- No-plugin failure control: ${report.controls.noPluginGatePassed ? "passed" : "failed"}`,
    `- Cross-pack isolation: ${report.controls.crossPackIsolationPassed ? "passed" : "failed"}`,
    "",
    "## Provenance",
    "",
    `- Format reference: ${report.sources.formatReference.url} (${report.sources.formatReference.version}; SHA-256 \`${report.sources.formatReference.sha256}\`)`,
    `- Fixture index: ${report.sources.fixtureIndex.url} (${report.sources.fixtureIndex.version}; SHA-256 \`${report.sources.fixtureIndex.sha256}\`)`,
    `- Independent oracle: ${report.independentOracle.package} ${report.independentOracle.packageVersion}, bundled ExifTool ${report.independentOracle.implementationVersion}; ${report.independentOracle.license}`,
    "",
    "## Comparison normalization",
    "",
    report.normalizationPolicy,
    "",
    "## Counts",
    "",
    "| Scope | Found | Matched | Normalized match | Mismatched | Missing local | Missing reference | Non-comparable |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    `| Overall | ${report.comparisons.overall.found} | ${report.comparisons.overall.matched} | ${report.comparisons.overall.normalizedMatch} | ${report.comparisons.overall.mismatched} | ${report.comparisons.overall.missingLocal} | ${report.comparisons.overall.missingReference} | ${report.comparisons.overall.nonComparable} |`,
    ...report.packs.map((pack) => `| ${pack.vendor} | ${pack.comparisonCounts.found} | ${pack.comparisonCounts.matched} | ${pack.comparisonCounts.normalizedMatch} | ${pack.comparisonCounts.mismatched} | ${pack.comparisonCounts.missingLocal} | ${pack.comparisonCounts.missingReference} | ${pack.comparisonCounts.nonComparable} |`),
    "",
    "## Fixture results",
    "",
    "| Pack | Fixture | Bytes | SHA-256 | Notes | Fields | Opaque ranges | Diagnostics |",
    "| --- | --- | ---: | --- | ---: | ---: | ---: | --- |",
    ...report.fixtures.map((fixture) => `| ${fixture.packId} | ${fixture.path} | ${fixture.bytes} | \`${fixture.sha256}\` | ${fixture.noteCount} | ${fixture.fieldCount} | ${fixture.opaqueRangeCount} | ${fixture.diagnosticCodes.join(", ") || "none"} |`),
    "",
    "## Gate policy",
    "",
    "The gate requires two real hash-verified fixtures per listed vendor group, at least one decoded field per fixture, exact fixture lengths and SHA-256 values, one-and-only-one recognized pack under the all-pack control, an opaque no-plugin control, bounded truncation and entry-limit controls, at least 14 meaningful independent comparisons, and zero mismatches or missing values for every mapped independent comparison. Unmapped and duplicate values without a one-to-one oracle representation are explicitly non-comparable and never count as matches. Raw image and MakerNote values are not written to this report.",
    "",
    "## Per-pack source and registry hashes",
    "",
    "| Pack | Version | Registry SHA-256 | Source references |",
    "| --- | --- | --- | ---: |",
    ...report.packs.map((pack) => `| ${pack.id} | ${pack.version} | \`${pack.registrySha256}\` | ${pack.sourceCount} |`),
  ];
  return `${lines.join("\n")}\n`;
}

async function main() {
  if (corpusRoot === undefined || corpusRoot.length === 0) fail("MAKERNOTE_B08_CORPUS_DIR is required; no corpus was examined.");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (manifest.packs?.length !== 7) fail("B08 source manifest must contain exactly seven vendor packs.");
  const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  const { DEFAULT_LIMITS, inspectMakerNotes, parseMetadata } = await import(pathToFileURL(join(root, "dist/index.js")).href);
  const packs = [];
  const plugins = [];
  for (const pack of manifest.packs) {
    if (!Array.isArray(pack.fixtures) || pack.fixtures.length < 2) fail(`Pack ${pack.id} does not have the required fixture breadth.`);
    const module = await import(pathToFileURL(packModulePath(pack.module)).href);
    const plugin = module.default;
    if (plugin === undefined || plugin.identity?.id !== pack.id || plugin.identity?.version !== pack.version) fail(`Pack export identity does not match the manifest for ${pack.id}.`);
    if (!Object.isFrozen(plugin) || !Object.isFrozen(plugin.identity) || !Object.isFrozen(plugin.identity.tagRegistry) || !Object.isFrozen(plugin.identity.sources)) fail(`Pack ${pack.id} is not immutable at its public boundary.`);
    const sourceIds = new Set((plugin.identity.sources ?? []).map((source) => source.id));
    if (pack.fixtures.some((fixture) => !sourceIds.has(fixture.id))) fail(`Pack ${pack.id} is missing one or more pinned fixture references.`);
    const registryIds = plugin.identity.tagRegistry.map((definition) => definition.id);
    const registryTags = plugin.identity.tagRegistry.map((definition) => definition.tag);
    if (new Set(registryIds).size !== registryIds.length || new Set(registryTags).size !== registryTags.length || registryIds.length === 0) fail(`Pack ${pack.id} has an invalid generated tag registry.`);
    packs.push({ ...pack, plugin, registrySha256: hashValue(plugin.identity.tagRegistry), sourceCount: plugin.identity.sources?.length ?? 0 });
    plugins.push(plugin);
  }
  const counts = { overall: newCounts(), byField: {}, byProducer: {}, byFormat: {}, records: [] };
  const fixtureResults = [];
  for (const pack of packs) for (const fixture of pack.fixtures) fixtureResults.push(await verifyFixture(fixture, pack, pack.plugin, parseMetadata, inspectMakerNotes, DEFAULT_LIMITS, plugins, counts));
  if (fixtureResults.length < 14) fail(`B08 examined only ${fixtureResults.length} fixtures; at least 14 are required.`);
  const mapped = counts.overall.matched + counts.overall.normalizedMatch + counts.overall.mismatched + counts.overall.missingLocal + counts.overall.missingReference;
  const minimumMeaningfulComparisons = 14;
  if (mapped < minimumMeaningfulComparisons) fail(`B08 produced only ${mapped} meaningful independent comparisons; at least ${minimumMeaningfulComparisons} are required.`);
  if (counts.overall.mismatched !== 0 || counts.overall.missingLocal !== 0 || counts.overall.missingReference !== 0) fail(`B08 independent comparison gate failed: ${JSON.stringify(counts.overall)}; mapped comparison details: ${JSON.stringify(counts.byField, null, 2)}.`);
  const packResults = packs.map((pack) => {
    const comparisonCounts = counts.byProducer[pack.vendor] ?? newCounts();
    return { id: pack.id, vendor: pack.vendor, version: pack.version, registrySha256: pack.registrySha256, sourceCount: pack.sourceCount, fixtureCount: pack.fixtures.length, comparisonCounts };
  });
  const report = {
    schema: "browser-image-metadata.makernote-b08-evidence.v1",
    ticket: "B08",
    generatedAt: "2026-09-13",
    package: { name: packageJson.name, version: packageJson.version },
    fixtureCount: fixtureResults.length,
    packCount: packs.length,
    corpus: { pathRecorded: "environment-supplied temporary corpus; image bytes are not retained", required: true },
    sources: { formatReference: manifest.formatReference, fixtureIndex: manifest.fixtureIndex },
    independentOracle: { package: manifest.independentOracle.package, packageVersion: manifest.independentOracle.version, implementationVersion: manifest.independentOracle.implementationVersion, license: manifest.independentOracle.license, source: manifest.independentOracle.source, role: manifest.independentOracle.role },
    normalizationPolicy: "Numeric values compare in canonical decimal form. Text compares after Unicode NFC normalization and ordinary trimming; fields declared ascii-padding additionally remove trailing NUL/space padding; case-insensitive-ascii is used only for documented enum labels whose independent oracle differs in case. numeric-sequence compares bounded numeric arrays with an oracle's space-delimited representation, and dimensions compares a two-number array with an oracle's WIDTHxHEIGHT representation. Arrays, rationals, and byte payloads without an explicit semantic policy are represented only by stable hashes. Null, absent, opaque, and unsupported values never count as matches.",
    thresholds: { minimumFixtureCount: 14, minimumFixturesPerPack: 2, maximumMismatched: 0, maximumMissingLocal: 0, maximumMissingReference: 0, minimumMeaningfulComparisons: 14 },
    comparisons: counts,
    packs: packResults,
    fixtures: fixtureResults,
    controls: { noPluginGatePassed: true, crossPackIsolationPassed: true, noImagesCopied: true, malformedAndLimitControlsPassed: true },
  };
  await mkdir(join(root, "reports"), { recursive: true });
  await writeFile(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(reportMarkdownPath, markdown(report), "utf8");
  const reportStat = await stat(reportJsonPath);
  if (reportStat.size === 0) fail("B08 JSON report was empty.");
  console.log(`B08 MakerNote vendor-pack evidence passed: ${fixtureResults.length} fixtures, ${mapped} meaningful comparisons, ${counts.overall.nonComparable} explicit non-comparable values.`);
}

main().catch(async (error) => {
  try { await exiftool.end(); } catch { /* close failure is not the gate result */ }
  console.error(`B08 MakerNote vendor-pack evidence failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}).finally(async () => {
  try { await exiftool.end(); } catch { /* already closed */ }
});
