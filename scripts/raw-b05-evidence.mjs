import crypto from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { exiftool } from "exiftool-vendored";

const root = resolve(new URL("..", import.meta.url).pathname);
const corpusValue = process.env.RAW_B05_CORPUS_DIR;
const outputDirectory = resolve(root, process.env.RAW_B05_OUTPUT_DIR ?? "reports");
const sourceManifestPath = join(root, "data", "raw", "raw-b05-sources.json");
const packageManifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const sourceManifestBytes = await readFile(sourceManifestPath);
const sourceManifest = JSON.parse(sourceManifestBytes.toString("utf8"));
const minimumFixtures = 2;
const minimumComparableValues = 12;
const maximumMismatches = 0;
const maximumMissing = 0;
const expectedExifToolVersion = "13.59";
const expectedExifToolPackageVersion = "38.1.0";

if (typeof corpusValue !== "string" || corpusValue.trim().length === 0) {
  throw new Error("B05 RAW corpus was not examined: set RAW_B05_CORPUS_DIR to the temporary hash-pinned CR3/RAF corpus directory.");
}

const corpusDirectory = resolve(corpusValue);
const sourceHash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const stable = (value) => JSON.stringify(value);
const finiteInteger = (value) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
const normalizeText = (value) => typeof value === "string" ? value.replace(/\0/gu, "").trim().replace(/\s+/gu, " ") : null;

function assert(condition, detail) {
  if (!condition) throw new Error(detail);
}

function numeric(value) {
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return value;
  if (typeof value === "string" && /^\d+$/u.test(value)) return Number(value);
  return null;
}

function orientationCode(value) {
  const number = numeric(value);
  if (number !== null && number >= 1 && number <= 8) return number;
  const text = normalizeText(value)?.toLowerCase() ?? "";
  return ({
    "horizontal (normal)": 1,
    "mirror horizontal": 2,
    "rotate 180": 3,
    "mirror vertical": 4,
    "mirror horizontal and rotate 270 cw": 5,
    "rotate 90 cw": 6,
    "mirror horizontal and rotate 90 cw": 7,
    "rotate 270 cw": 8,
  })[text] ?? null;
}

function fileType(value) {
  const normalized = normalizeText(value)?.toLowerCase() ?? null;
  return normalized === "cr3" || normalized === "raf" ? normalized : null;
}

function scalarOracleValue(value) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (value !== null && typeof value === "object" && "bytes" in value && typeof value.bytes === "number") return { present: value.bytes > 0, bytes: value.bytes };
  return null;
}

function selectedOracle(oracle) {
  const selected = [
    "FileType", "MIMEType", "ImageWidth", "ImageHeight", "Make", "Model", "Orientation",
    "PreviewImage", "ThumbnailOffset", "ThumbnailLength", "JpgFromRaw", "MediaDataSize",
    "MetaFormat", "StripOffsets", "StripByteCounts", "ExifToolVersion",
  ];
  return Object.fromEntries(selected.map((key) => [key, scalarOracleValue(oracle[key])]));
}

function statusCounts(comparisons) {
  const counts = { found: 0, matched: 0, "normalized-match": 0, mismatched: 0, "missing-local": 0, "missing-reference": 0, "non-comparable": 0 };
  for (const comparison of comparisons) {
    if (comparison.localPresent || comparison.referencePresent) counts.found += 1;
    counts[comparison.status] += 1;
  }
  return counts;
}

function aggregate(comparisons) {
  const result = statusCounts(comparisons);
  const group = (key) => {
    const grouped = new Map();
    for (const comparison of comparisons) {
      const value = comparison[key];
      if (typeof value !== "string") continue;
      const current = grouped.get(value) ?? [];
      current.push(comparison);
      grouped.set(value, current);
    }
    return Object.fromEntries([...grouped].sort(([left], [right]) => left.localeCompare(right)).map(([value, items]) => [value, statusCounts(items)]));
  };
  return { ...result, byField: group("field"), byProducer: group("producer"), byFormat: group("format") };
}

function comparison(field, producer, format, local, reference, normalize = (value) => value, matchStatus = "matched", reasonForNonComparable = "unsupported-independent-representation") {
  const localPresent = local !== null && local !== undefined;
  const referencePresent = reference !== null && reference !== undefined;
  const base = { field, producer, format, localPresent, referencePresent };
  if (!localPresent && !referencePresent) return { ...base, status: "non-comparable", reason: "missing-from-both", local: null, reference: null };
  if (!localPresent) return { ...base, status: "missing-local", reason: "missing-from-parser", local: null, reference };
  if (!referencePresent) return { ...base, status: "missing-reference", reason: "missing-from-independent-oracle", local, reference: null };
  let normalizedLocal = null;
  let normalizedReference = null;
  try {
    normalizedLocal = normalize(local);
    normalizedReference = normalize(reference);
  } catch {
    return { ...base, status: "non-comparable", reason: reasonForNonComparable, local: null, reference: null };
  }
  if (normalizedLocal === null || normalizedLocal === undefined || normalizedReference === null || normalizedReference === undefined) {
    return { ...base, status: "non-comparable", reason: reasonForNonComparable, local: null, reference: null };
  }
  const matched = stable(normalizedLocal) === stable(normalizedReference);
  return { ...base, status: matched ? matchStatus : "mismatched", reason: matched ? null : "normalized-values-differ", local: normalizedLocal, reference: normalizedReference };
}

function nonComparable(field, producer, format, local, reference, reason) {
  return {
    field, producer, format,
    status: "non-comparable",
    reason,
    localPresent: local !== null && local !== undefined,
    referencePresent: reference !== null && reference !== undefined,
    local: null,
    reference: null,
  };
}

function localField(result, name) {
  return [...result.fields, ...(result.exif?.fields ?? [])].find((field) => field.name === name)?.value ?? null;
}

function localRange(result, project, role) {
  const ranges = project === "cr3" ? result.cr3?.[role === "preview" ? "previewRanges" : "rawRanges"] : result.raf?.[role === "preview" ? "previewRanges" : "rawRanges"];
  return ranges?.find(({ status, offset, length }) => status === "valid" && offset !== null && length !== null) ?? null;
}

function rangeShape(range) {
  return range === null ? null : { offset: range.offset, length: range.length };
}

function oracleBinaryPresent(value) {
  return value !== null && typeof value === "object" && value.present === true && typeof value.bytes === "number" && value.bytes > 0;
}

const oracleArgs = [
  "-FileType", "-MIMEType", "-ImageWidth", "-ImageHeight", "-Make", "-Model", "-Orientation",
  "-PreviewImage", "-ThumbnailOffset#", "-ThumbnailLength#", "-JpgFromRaw", "-MediaDataSize#",
  "-MetaFormat", "-StripOffsets#", "-StripByteCounts#",
];

const actualExifToolVersion = await exiftool.version();
assert(actualExifToolVersion === expectedExifToolVersion, `The pinned ExifTool oracle is ${actualExifToolVersion}; expected ${expectedExifToolVersion}`);
assert(sourceManifest.projects?.cr3?.minimumFixtures === 1 && sourceManifest.projects?.raf?.minimumFixtures === 1, "B05 source manifest must declare separate CR3 and RAF acceptance projects.");

const parserModule = await import(join(root, "dist", "index.js"));
const rows = [];
for (const fixture of sourceManifest.fixtures) {
  assert(fixture.project === "cr3" || fixture.project === "raf", `Unsupported B05 project in source manifest: ${fixture.project}`);
  const path = join(corpusDirectory, fixture.fileName);
  const file = await stat(path).catch(() => null);
  assert(file !== null && file.isFile(), `B05 ${fixture.project.toUpperCase()} fixture is missing: ${fixture.fileName}`);
  const bytes = new Uint8Array(await readFile(path));
  assert(bytes.length === fixture.bytes, `${fixture.fileName} byte length mismatch: expected ${fixture.bytes}, received ${bytes.length}`);
  const actualHash = sourceHash(bytes);
  assert(actualHash === fixture.sha256, `${fixture.fileName} SHA-256 mismatch: expected ${fixture.sha256}, received ${actualHash}`);
  const result = await parserModule.parseMetadata(bytes, { scope: "metadata" });
  assert(result.format === fixture.project && result.fileKind === fixture.fileKind, `${fixture.fileName} did not retain its ${fixture.project.toUpperCase()} format and file-kind identity.`);
  assert(result.completeness.complete && result.completeness.scope === "full", `${fixture.fileName} did not receive complete parser coverage: ${JSON.stringify(result.completeness)}`);
  const oracle = await exiftool.read(path, oracleArgs);
  const selected = selectedOracle(oracle);
  const dimensions = result.dimensions === null ? null : { width: result.dimensions.width, height: result.dimensions.height };
  const oracleDimensions = { width: numeric(oracle.ImageWidth), height: numeric(oracle.ImageHeight) };
  const localPreview = localRange(result, fixture.project, "preview");
  const localRaw = localRange(result, fixture.project, "raw");
  const localMetadataRanges = fixture.project === "cr3" ? result.cr3?.metadataRanges ?? [] : result.raf?.metadataRanges ?? [];
  const localPreviewRanges = fixture.project === "cr3" ? result.cr3?.previewRanges ?? [] : result.raf?.previewRanges ?? [];
  const comparisons = [
    comparison("identity", "file-type", fixture.project, result.fileKind, fileType(oracle.FileType), normalizeText, "matched"),
    comparison("dimensions", "image-header", fixture.project, dimensions, oracleDimensions, (value) => value === null || finiteInteger(value.width) === null || finiteInteger(value.height) === null ? null : value, "matched"),
    comparison("make", "EXIF", fixture.project, localField(result, "Make"), oracle.Make, normalizeText, "normalized-match"),
    comparison("model", "EXIF", fixture.project, localField(result, "Model"), oracle.Model, normalizeText, "normalized-match"),
    comparison("orientation", "EXIF", fixture.project, localField(result, "Orientation"), oracle.Orientation, orientationCode, "normalized-match"),
    comparison("preview-present", "preview-inventory", fixture.project, localPreview !== null, oracleBinaryPresent(selected.PreviewImage), (value) => typeof value === "boolean" ? value : null, "matched"),
    comparison("raw-range-present", "raw-inventory", fixture.project, localRaw !== null, fixture.project === "cr3" ? numeric(oracle.MediaDataSize) !== null : numeric(oracle.StripByteCounts) !== null, (value) => typeof value === "boolean" ? value : null, "matched"),
    comparison("metadata-range-present", "metadata-inventory", fixture.project, localMetadataRanges.some(({ status }) => status === "valid"), fixture.project === "cr3" ? normalizeText(oracle.MetaFormat) !== null : numeric(oracle.StripOffsets) !== null, (value) => typeof value === "boolean" ? value : null, "matched"),
    comparison("preview-count-positive", "preview-inventory", fixture.project, localPreviewRanges.filter(({ status }) => status === "valid").length > 0, oracleBinaryPresent(selected.PreviewImage), (value) => typeof value === "boolean" ? value : null, "matched"),
    fixture.project === "cr3"
      ? nonComparable("preview-range", "preview-inventory", fixture.project, rangeShape(localPreview), selected.PreviewImage, "ExifTool exposes CR3 preview bytes but does not expose the PRVW/JpgFromRaw source offset and length in its stable output.")
      : nonComparable("preview-range", "preview-inventory", fixture.project, rangeShape(localPreview), selected.PreviewImage, "ExifTool exposes RAF preview bytes but does not expose the directory range as a numeric field; the standards-based parser retains the exact range."),
    fixture.project === "raf"
      ? comparison("thumbnail-range", "EXIF", fixture.project, rangeShape(result.raf?.ranges.find(({ role, status, offset, length }) => role === "thumbnail" && status === "valid" && offset !== null && length !== null) ?? null), { offset: numeric(oracle.ThumbnailOffset), length: numeric(oracle.ThumbnailLength) }, (value) => value === null || finiteInteger(value.offset) === null || finiteInteger(value.length) === null ? null : value, "matched")
      : nonComparable("thumbnail-range", "EXIF", fixture.project, null, null, "The CR3 fixture and independent oracle do not expose a stable numeric thumbnail range."),
  ];
  const counts = statusCounts(comparisons);
  const parserInventory = fixture.project === "cr3" ? result.cr3 : result.raf;
  assert(parserInventory?.complete === true, `${fixture.fileName} inventory did not complete.`);
  assert((parserInventory.previewRanges ?? []).some(({ status }) => status === "valid"), `${fixture.fileName} has no valid preview range.`);
  assert((parserInventory.metadataRanges ?? []).some(({ status }) => status === "valid"), `${fixture.fileName} has no valid metadata range.`);
  assert((parserInventory.rawRanges ?? []).some(({ status }) => status === "valid"), `${fixture.fileName} has no valid RAW/CFA range.`);
  if (fixture.project === "cr3") {
    const tracks = result.cr3.sequences.flatMap(({ tracks }) => tracks);
    assert(tracks.length >= 2, `${fixture.fileName} does not provide the required multiple-track CR3 evidence.`);
    assert(result.cr3.primarySelection === "ambiguous", `${fixture.fileName} did not retain its ambiguous CR3 primary selection.`);
  }
  if (fixture.project === "raf") {
    assert(result.raf.directory?.complete === true, `${fixture.fileName} RAF directory is not complete.`);
    assert(result.raf.previewRanges.some(({ role, status }) => role === "thumbnail" && status === "valid"), `${fixture.fileName} did not retain the embedded RAF thumbnail range.`);
  }
  rows.push({
    project: fixture.project,
    fileKind: fixture.fileKind,
    fixture: `temporary/${fixture.fileName}`,
    sourceId: fixture.sourceId,
    sourceUrl: fixture.url,
    bytes: bytes.length,
    sha256: actualHash,
    parser: {
      format: result.format,
      container: result.container,
      fileKind: result.fileKind,
      dimensions: result.dimensions,
      completeness: result.completeness,
      warningCodes: result.warnings.map(({ code }) => code),
      inventoryComplete: parserInventory?.complete ?? false,
      inventoryDiagnostics: parserInventory?.diagnostics ?? [],
      previewRanges: parserInventory?.previewRanges ?? [],
      metadataRanges: parserInventory?.metadataRanges ?? [],
      rawRanges: parserInventory?.rawRanges ?? [],
      opaqueStructures: parserInventory?.opaqueStructures ?? [],
      ...(fixture.project === "cr3" ? {
        primarySelection: result.cr3?.primarySelection ?? "none",
        trackCount: result.cr3?.sequences.flatMap(({ tracks }) => tracks).length ?? 0,
        trackKinds: result.cr3?.sequences.flatMap(({ tracks }) => tracks.map(({ kind }) => kind)) ?? [],
        trackStructures: result.cr3?.sequences.flatMap(({ tracks }) => tracks.map((track) => ({
          id: track.id,
          kind: track.kind,
          dimensions: track.dimensions,
          transformation: track.transformation,
          sampleDescriptionCount: track.sampleDescriptions.length,
          sampleCount: track.samples.length,
          fragmentSampleCount: track.samples.filter(({ fragmentOffset }) => fragmentOffset !== null).length,
          referenceCount: track.references.length,
          editCount: track.edits.length,
          associatedTrackIds: track.associatedTrackIds,
          metadataTrackIds: track.metadataTrackIds,
          complete: track.complete,
        }))) ?? [],
      } : { directory: result.raf?.directory ?? null }),
    },
    oracle: selected,
    comparisons,
    counts,
    status: counts.mismatched === 0 && counts["missing-local"] === 0 && counts["missing-reference"] === 0 ? "passed" : "failed",
  });
}
await exiftool.end();

const projects = Object.fromEntries(["cr3", "raf"].map((project) => {
  const projectRows = rows.filter((row) => row.project === project);
  const projectCounts = aggregate(projectRows.flatMap(({ comparisons }) => comparisons));
  const expected = sourceManifest.projects[project];
  assert(projectRows.length >= expected.minimumFixtures, `B05 ${project.toUpperCase()} examined ${projectRows.length} fixtures; at least ${expected.minimumFixtures} are required.`);
  return [project, { name: expected.name, fixtureCount: projectRows.length, minimumFixtures: expected.minimumFixtures, counts: projectCounts, status: projectRows.every(({ status }) => status === "passed") ? "passed" : "failed" }];
}));
const aggregateCounts = aggregate(rows.flatMap(({ comparisons }) => comparisons));
assert(rows.length >= minimumFixtures, `B05 examined ${rows.length} fixtures; at least ${minimumFixtures} are required.`);
assert(aggregateCounts.matched + aggregateCounts["normalized-match"] >= minimumComparableValues, `B05 produced only ${aggregateCounts.matched + aggregateCounts["normalized-match"]} comparable values; at least ${minimumComparableValues} are required.`);
assert(aggregateCounts.mismatched <= maximumMismatches, `B05 independent-oracle mismatches exceeded threshold: ${aggregateCounts.mismatched}`);
assert(aggregateCounts["missing-local"] <= maximumMissing && aggregateCounts["missing-reference"] <= maximumMissing, "B05 independent-oracle missing values exceeded threshold.");
assert(rows.every(({ status }) => status === "passed"), "B05 one or more CR3/RAF fixture comparisons failed.");
assert(projects.cr3.status === "passed" && projects.raf.status === "passed", "B05 requires independently passing CR3 and RAF projects.");

const report = {
  schema: "browser-image-metadata.raw-b05-evidence.v1",
  status: "pass",
  generatedAt: new Date().toISOString(),
  package: { name: packageManifest.name, version: packageManifest.version },
  corpus: { directoryPolicy: "temporary-untracked-only", fixtureCount: rows.length, minimumFixtures, noImagesCopied: true },
  sourceManifest: { path: "data/raw/raw-b05-sources.json", sha256: sourceHash(sourceManifestBytes), schema: sourceManifest.schema, retrievedAt: sourceManifest.retrievedAt, source: sourceManifest.source, projects: sourceManifest.projects },
  independentOracle: { package: "exiftool-vendored", packageVersion: expectedExifToolPackageVersion, version: actualExifToolVersion, license: "Artistic License 1.0 / GPL-1.0-or-later", provenance: "https://exiftool.org/ and the pinned exiftool-vendored development dependency; secondary output oracle only" },
  implementation: {
    model: "CR3 keeps an ISO-BMFF item/track graph plus a separate range/UUID inventory; RAF keeps its fixed directory plus separate embedded range inventory. Neither parser decodes sensor pixels or retains payload bytes.",
    supportedProjects: ["cr3", "raf"],
    normalizationPolicy: "Text comparisons trim NULs and collapse whitespace; file identity is lower-cased; dimensions and offsets require safe non-negative integers; booleans compare presence only; non-numeric vendor ranges are explicitly non-comparable and never matches.",
    provenancePolicy: "Every retained range records source-relative offset, bounded length, role, format, source structure, associated item/track when available, and status. CR3 item/track candidates and primary ambiguity are retained independently rather than merged.",
    payloadPolicy: "The parser indexes JPEG preview, TIFF metadata, ISO-BMFF, RAW, and CFA ranges but never decodes RAW mosaics or retains image payload bytes in the CR3/RAF inventories.",
    unsupportedPolicy: "Canon UUID/MakerNote data and RAF proprietary metadata remain bounded opaque structures with diagnostics; unknown, contradictory, overlapping, truncated, or over-limit structures fail closed.",
  },
  thresholds: { minimumFixtures, minimumComparableValues, maximumMismatches, maximumMissing },
  counts: aggregateCounts,
  projects,
  fixtures: rows,
  complete: rows.length === sourceManifest.fixtures.length && rows.every(({ status }) => status === "passed"),
};
assert(report.complete, "B05 evidence was incomplete.");
await mkdir(outputDirectory, { recursive: true });
await writeFile(join(outputDirectory, "raw-b05-evidence.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
const markdown = [
  "# B05 RAW phase-two evidence",
  "",
  `- Status: **${report.status}**`,
  `- Package: \`${report.package.name}@${report.package.version}\``,
  `- Projects: CR3 ${projects.cr3.fixtureCount}/${projects.cr3.minimumFixtures}; RAF ${projects.raf.fixtureCount}/${projects.raf.minimumFixtures}; total ${report.corpus.fixtureCount}/${report.thresholds.minimumFixtures}`, 
  `- Independent oracle: \`${report.independentOracle.package}@${report.independentOracle.packageVersion}\`, ExifTool ${report.independentOracle.version}`, 
  `- Comparable values: ${report.counts.matched + report.counts["normalized-match"]}; non-comparable: ${report.counts["non-comparable"]}; mismatched: ${report.counts.mismatched}`,
  `- Normalization policy: ${report.implementation.normalizationPolicy}`,
  `- Thresholds: at least ${report.thresholds.minimumFixtures} fixtures and ${report.thresholds.minimumComparableValues} comparable values; at most ${report.thresholds.maximumMismatches} mismatches and ${report.thresholds.maximumMissing} missing values`,
  "- Redistribution policy: only hashes, source metadata, parser facts, and comparison results are retained; no CR3 or RAF image bytes are copied into the repository.",
  "",
  "## Project acceptance",
  "",
  "| Project | Fixtures | Comparable | Non-comparable | Mismatched | Status |",
  "| --- | ---: | ---: | ---: | ---: | --- |",
  ...[projects.cr3, projects.raf].map((project) => `| ${project.name} | ${project.fixtureCount} | ${project.counts.matched + project.counts["normalized-match"]} | ${project.counts["non-comparable"]} | ${project.counts.mismatched} | ${project.status} |`),
  "",
  "## Fixtures",
  "",
  "| Project | Fixture | Bytes | SHA-256 | Dimensions | Preview ranges | Metadata ranges | RAW/CFA ranges | Primary/directory | Status |",
  "| --- | --- | ---: | --- | --- | ---: | ---: | ---: | --- | --- |",
  ...rows.map((row) => `| ${row.project} | \`${row.fixture}\` | ${row.bytes} | \`${row.sha256}\` | ${row.parser.dimensions === null ? "none" : `${row.parser.dimensions.width}×${row.parser.dimensions.height}`} | ${row.parser.previewRanges.length} | ${row.parser.metadataRanges.length} | ${row.parser.rawRanges.length} | ${row.project === "cr3" ? `${row.parser.trackCount} tracks; ${row.parser.primarySelection}` : row.parser.directory?.complete === true ? "complete directory" : "incomplete directory"} | ${row.status} |`),
  "",
  "## Comparison counts",
  "",
  `Overall: ${JSON.stringify(report.counts)}. Every non-comparable comparison is retained with a reason and is excluded from the comparable-match threshold; null or unsupported values never count as a match.`,
  "",
  "The standards-based parser is the implementation under test. ExifTool is used only as a secondary output oracle for identity, dimensions, stable EXIF values, and presence/range facts where its output is available.",
  "",
  `Source manifest SHA-256: \`${report.sourceManifest.sha256}\`; corpus storage: temporary and untracked; reports contain no source image bytes.`,
].join("\n");
await writeFile(join(outputDirectory, "raw-b05-evidence.md"), `${markdown}\n`, "utf8");
console.log(`B05 RAW evidence passed for ${rows.length} fixtures across CR3 and RAF; reports written to ${relative(root, outputDirectory)}/raw-b05-evidence.{json,md}`);
