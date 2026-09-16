import crypto from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { exiftool } from "exiftool-vendored";

const root = resolve(new URL("..", import.meta.url).pathname);
const corpusValue = process.env.RAW_B04_CORPUS_DIR;
const outputDirectory = resolve(root, process.env.RAW_B04_OUTPUT_DIR ?? "reports");
const sourceManifestPath = join(root, "data", "raw", "raw-b04-sources.json");
const packageManifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const sourceManifestBytes = await readFile(sourceManifestPath);
const sourceManifest = JSON.parse(sourceManifestBytes.toString("utf8"));
const minimumFixtures = 7;
const minimumComparableValues = 20;
const maximumMismatches = 0;
const maximumMissing = 0;
const expectedExifToolVersion = "13.59";
const expectedExifToolPackageVersion = "38.1.0";

if (typeof corpusValue !== "string" || corpusValue.trim().length === 0) {
  throw new Error("B04 RAW corpus was not examined: set RAW_B04_CORPUS_DIR to the temporary hash-pinned corpus directory.");
}
const corpusDirectory = resolve(corpusValue);
const sourceHash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const stable = (value) => JSON.stringify(value);
const finiteInteger = (value) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
const normalizeText = (value) => typeof value === "string" ? value.replace(/\0/gu, "").trim().replace(/\s+/gu, " ") : null;

function assert(condition, detail) {
  if (!condition) throw new Error(detail);
}

function countStatuses(comparisons) {
  const counts = { found: 0, matched: 0, mismatched: 0, "normalized-match": 0, "missing-local": 0, "missing-reference": 0, "non-comparable": 0 };
  for (const comparison of comparisons) {
    if (comparison.localPresent || comparison.referencePresent) counts.found += 1;
    counts[comparison.status] += 1;
  }
  return counts;
}

function compare(key, local, reference, normalize = (value) => value, nonComparableReason = "unsupported-representation") {
  const localPresent = local !== null && local !== undefined;
  const referencePresent = reference !== null && reference !== undefined;
  if (!localPresent && !referencePresent) return { key, status: "non-comparable", reason: "missing-from-both", localPresent: false, referencePresent: false, local: null, reference: null };
  if (!localPresent) return { key, status: "missing-local", reason: "missing-from-parser", localPresent: false, referencePresent: true, local: null, reference: reference };
  if (!referencePresent) return { key, status: "missing-reference", reason: "missing-from-independent-oracle", localPresent: true, referencePresent: false, local, reference: null };
  let normalizedLocal = null;
  let normalizedReference = null;
  try { normalizedLocal = normalize(local); normalizedReference = normalize(reference); } catch { /* deliberately non-comparable below */ }
  if (normalizedLocal === null || normalizedReference === null || normalizedLocal === undefined || normalizedReference === undefined) return { key, status: "non-comparable", reason: nonComparableReason, localPresent: true, referencePresent: true, local: normalizedLocal ?? null, reference: normalizedReference ?? null };
  const matched = stable(normalizedLocal) === stable(normalizedReference);
  return { key, status: matched ? "matched" : "mismatched", reason: matched ? null : "normalized-values-differ", localPresent: true, referencePresent: true, local: normalizedLocal, reference: normalizedReference };
}

function nonComparable(key, local, reference, reason) {
  return {
    key,
    status: "non-comparable",
    reason,
    localPresent: local !== null && local !== undefined,
    referencePresent: reference !== null && reference !== undefined,
    local: null,
    reference: null,
  };
}

function localField(result, name) {
  return result.fields.find((field) => field.name === name)?.value ?? null;
}

function numeric(value) {
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return value;
  if (typeof value === "string" && /^\d+$/u.test(value)) return Number(value);
  return null;
}

function fileType(value) {
  const normalized = normalizeText(value)?.toLowerCase() ?? null;
  return normalized === null ? null : ({ dng: "dng", cr2: "cr2", nef: "nef", arw: "arw", orf: "orf", rw2: "rw2", iiq: "iiq" }[normalized] ?? null);
}

function dimensionsFor(kind, oracle) {
  if (kind === "rw2") return { width: numeric(oracle.SensorWidth), height: numeric(oracle.SensorHeight) };
  if (kind === "iiq") return null;
  return { width: numeric(oracle.ImageWidth), height: numeric(oracle.ImageHeight) };
}

function localDimensions(result) {
  return result.dimensions === null ? null : { width: result.dimensions.width, height: result.dimensions.height };
}

function ranges(result, role) {
  const candidates = role === "preview" ? result.raw?.previews ?? [] : result.raw?.thumbnails ?? [];
  return candidates.filter(({ offset, length }) => offset !== null && length !== null).map(({ offset, length }) => ({ offset, length }));
}

function rangeValue(oracle, role) {
  const start = numeric(role === "preview" ? oracle.PreviewImageStart : oracle.ThumbnailOffset);
  const length = numeric(role === "preview" ? oracle.PreviewImageLength : oracle.ThumbnailLength);
  return start === null || length === null ? null : { offset: start, length };
}

function vendorRangeComparison(kind, role, result, oracle) {
  const local = ranges(result, role);
  const reference = rangeValue(oracle, role);
  const reason = role === "preview"
    ? `${kind.toUpperCase()} independent preview range is vendor-specific or stored in an opaque structure not represented by the standards-based TIFF directory graph`
    : `${kind.toUpperCase()} independent oracle does not expose the generic TIFF ${role} range; parser-discovered directory ranges remain retained as provenance`;
  return nonComparable(`${role}-range`, local[0] ?? null, reference, reason);
}

const oracleArgs = [
  "-FileType", "-ImageWidth", "-ImageHeight", "-SensorWidth", "-SensorHeight", "-Make", "-Model",
  "-PreviewImageStart#", "-PreviewImageLength#", "-ThumbnailOffset#", "-ThumbnailLength#",
  "-RawDataOffset#", "-RawDataLength#", "-JpgFromRawStart#", "-JpgFromRawLength#",
];

const actualExifToolVersion = await exiftool.version();
assert(actualExifToolVersion === expectedExifToolVersion, `The pinned ExifTool oracle is ${actualExifToolVersion}; expected ${expectedExifToolVersion}`);

const rows = [];
for (const fixture of sourceManifest.fixtures) {
  const path = join(corpusDirectory, fixture.fileName);
  const file = await stat(path).catch(() => null);
  assert(file !== null && file.isFile(), `B04 RAW fixture is missing: ${fixture.fileName}`);
  const bytes = new Uint8Array(await readFile(path));
  const actualHash = sourceHash(bytes);
  assert(actualHash === fixture.sha256, `${fixture.fileName} SHA-256 mismatch: expected ${fixture.sha256}, received ${actualHash}`);
  const result = await import(join(root, "dist", "index.js")).then(({ parseMetadata }) => parseMetadata(bytes, { scope: "metadata" }));
  assert(result.format === "tiff", `${fixture.fileName} was not parsed through the TIFF container path`);
  assert(result.container === "tiff" || result.container === "bigtiff", `${fixture.fileName} has no truthful TIFF container identity`);
  assert(result.fileKind === fixture.fileKind, `${fixture.fileName} fileKind is ${result.fileKind}, expected ${fixture.fileKind}`);
  assert(result.raw !== null, `${fixture.fileName} has no RAW inventory`);
  const oracle = await exiftool.read(path, oracleArgs);
  const comparisons = [
    compare("fileKind", result.fileKind, fileType(oracle.FileType)),
    fixture.fileKind === "iiq" ? nonComparable("dimensions", localDimensions(result), { width: oracle.ImageWidth ?? null, height: oracle.ImageHeight ?? null }, "independent oracle reports IIQ sensor dimensions from opaque vendor data while the generic TIFF graph reports the addressable IFD dimensions") : compare("dimensions", localDimensions(result), dimensionsFor(fixture.fileKind, oracle), (value) => value === null || finiteInteger(value.width) === null || finiteInteger(value.height) === null ? null : value),
    compare("make", localField(result, "Make"), oracle.Make, normalizeText),
    compare("model", localField(result, "Model"), oracle.Model, normalizeText),
    ["orf", "nef"].includes(fixture.fileKind) ? vendorRangeComparison(fixture.fileKind, "preview", result, oracle) : compare("preview-range", ranges(result, "preview").find(({ offset }) => offset === numeric(oracle.PreviewImageStart)) ?? null, rangeValue(oracle, "preview"), (value) => value === null || finiteInteger(value.offset) === null || finiteInteger(value.length) === null ? null : value),
    ["dng", "nef", "orf", "rw2", "iiq"].includes(fixture.fileKind) ? vendorRangeComparison(fixture.fileKind, "thumbnail", result, oracle) : compare("thumbnail-range", ranges(result, "thumbnail").find(({ offset }) => offset === numeric(oracle.ThumbnailOffset)) ?? null, rangeValue(oracle, "thumbnail"), (value) => value === null || finiteInteger(value.offset) === null || finiteInteger(value.length) === null ? null : value),
  ];
  const statuses = countStatuses(comparisons);
  rows.push({
    fileKind: fixture.fileKind,
    fixture: `temporary/${fixture.fileName}`,
    sourceId: fixture.sourceId,
    sourceUrl: fixture.url,
    bytes: bytes.length,
    sha256: actualHash,
    sourceIndexSha256: fixture.sourceIndexSha256,
    parser: {
      format: result.format,
      container: result.container,
      fileKind: result.fileKind,
      dimensions: result.dimensions,
      rawComplete: result.raw.complete,
      rawPayloads: result.raw.rawPayloads,
      previews: result.raw.previews,
      thumbnails: result.raw.thumbnails,
      opaquePayloads: result.raw.opaquePayloads,
      diagnostics: result.raw.diagnostics,
      warningCodes: result.warnings.map(({ code }) => code),
    },
    oracle: {
      fileType: oracle.FileType ?? null,
      imageDimensions: { width: oracle.ImageWidth ?? null, height: oracle.ImageHeight ?? null },
      sensorDimensions: { width: oracle.SensorWidth ?? null, height: oracle.SensorHeight ?? null },
      previewRange: rangeValue(oracle, "preview"),
      thumbnailRange: rangeValue(oracle, "thumbnail"),
      errors: oracle.errors ?? [],
    },
    comparisons,
    counts: statuses,
    status: statuses.mismatched === 0 && statuses["missing-local"] === 0 && statuses["missing-reference"] === 0 ? "passed" : "failed",
  });
}
await exiftool.end();

assert(rows.length >= minimumFixtures, `B04 examined ${rows.length} fixtures; at least ${minimumFixtures} are required`);
const aggregate = countStatuses(rows.flatMap(({ comparisons }) => comparisons));
assert(aggregate.matched + aggregate["normalized-match"] >= minimumComparableValues, `B04 produced only ${aggregate.matched + aggregate["normalized-match"]} comparable values; at least ${minimumComparableValues} are required`);
assert(aggregate.mismatched <= maximumMismatches, `B04 independent-oracle mismatches exceeded threshold: ${aggregate.mismatched}`);
assert(aggregate["missing-local"] <= maximumMissing && aggregate["missing-reference"] <= maximumMissing, "B04 independent-oracle missing values exceeded threshold");
assert(rows.every(({ status }) => status === "passed"), "B04 one or more fixture comparisons failed");

const report = {
  schema: "browser-image-metadata.raw-b04-evidence.v1",
  status: "pass",
  generatedAt: new Date().toISOString(),
  package: { name: packageManifest.name, version: packageManifest.version },
  corpus: { directoryPolicy: "temporary-untracked-only", fixtureCount: rows.length, minimumFixtures, noImagesCopied: true },
  sourceManifest: { path: "data/raw/raw-b04-sources.json", sha256: sourceHash(sourceManifestBytes), schema: sourceManifest.schema, retrievedAt: sourceManifest.retrievedAt, license: sourceManifest.source.license, repository: sourceManifest.source.repository },
  independentOracle: { package: "exiftool-vendored", packageVersion: expectedExifToolPackageVersion, version: actualExifToolVersion, license: "Artistic License 1.0 / GPL-1.0-or-later", provenance: "https://exiftool.org/ and the pinned exiftool-vendored development dependency; secondary output oracle only" },
  implementation: {
    containerModel: "TIFF/BigTIFF physical container plus a distinct RAW fileKind; ordinary TIFF remains fileKind=tiff",
    recognizedKinds: ["dng", "cr2", "nef", "arw", "orf", "rw2", "iiq"],
    payloadPolicy: "Directory-referenced ranges are indexed with source offsets and lengths; bytes are never retained in RawContainerData and sensor pixels are never decoded.",
    normalizationPolicy: "File type is lower-cased; text is NUL-trimmed and whitespace-normalized; dimensions use the common ImageWidth/ImageHeight pair except RW2 sensor dimensions; unavailable vendor ranges are non-comparable, never matches.",
    ambiguityPolicy: "A structurally recognized variant with no safe standard RAW range retains an AMBIGUOUS_VARIANT diagnostic and exposes no invented offset."
  },
  thresholds: { minimumFixtures, minimumComparableValues, maximumMismatches, maximumMissing },
  counts: aggregate,
  fixtures: rows,
  complete: rows.length === sourceManifest.fixtures.length && rows.every(({ status }) => status === "passed"),
};
assert(report.complete, "B04 evidence was incomplete");
await mkdir(outputDirectory, { recursive: true });
await writeFile(join(outputDirectory, "raw-b04-evidence.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
const markdown = [
  "# B04 RAW phase-one evidence",
  "",
  `- Status: **${report.status}**`,
  `- Package: \`${report.package.name}@${report.package.version}\``,
  `- Fixtures: ${report.corpus.fixtureCount} (minimum ${report.thresholds.minimumFixtures})`,
  `- Independent oracle: \`${report.independentOracle.package}@${report.independentOracle.packageVersion}\`, ExifTool ${report.independentOracle.version}`, 
  `- Comparable values: ${report.counts.matched + report.counts["normalized-match"]}; non-comparable: ${report.counts["non-comparable"]}; mismatched: ${report.counts.mismatched}`,
  "- Redistribution policy: only hashes, source metadata, parser facts, and comparison results are retained; no RAW image bytes are copied into the repository.",
  "",
  "| Kind | Fixture bytes | SHA-256 | Container | Parsed dimensions | Raw ranges | Preview ranges | Thumbnail ranges | Diagnostics | Status |",
  "| --- | ---: | --- | --- | --- | ---: | ---: | ---: | --- | --- |",
  ...report.fixtures.map((item) => `| ${item.fileKind} | ${item.bytes} | \`${item.sha256}\` | ${item.parser.container} | ${item.parser.dimensions === null ? "none" : `${item.parser.dimensions.width}×${item.parser.dimensions.height}`} | ${item.parser.rawPayloads.length} | ${item.parser.previews.length} | ${item.parser.thumbnails.length} | ${item.parser.diagnostics.map(({ code }) => code).join(", ") || "none"} | ${item.status} |`),
  "",
  "## Verification policy",
  "",
  `- ${report.implementation.containerModel}.`,
  `- ${report.implementation.payloadPolicy}`,
  `- ${report.implementation.normalizationPolicy}`,
  `- ${report.implementation.ambiguityPolicy}`,
  `- Thresholds: at least ${report.thresholds.minimumFixtures} fixtures and ${report.thresholds.minimumComparableValues} comparable values; zero mismatches and zero missing values permitted.`,
  "",
  "The JSON report retains per-fixture source URLs, byte lengths, SHA-256 values, parser/oracle facts, every comparison, status counts, warning/diagnostic codes, and the source-manifest hash. It contains no third-party image bytes.",
].join("\n");
await writeFile(join(outputDirectory, "raw-b04-evidence.md"), `${markdown}\n`, "utf8");
console.log(`B04 RAW evidence passed for ${rows.length} fixtures; reports written to ${relative(root, outputDirectory)}/raw-b04-evidence.{json,md}`);
