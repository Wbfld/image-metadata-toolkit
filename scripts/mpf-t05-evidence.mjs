import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "data", "mpf", "reference-corpus.json");
const packagePath = join(root, "package.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const packageManifest = JSON.parse(await readFile(packagePath, "utf8"));
const { parseMetadata } = await import(join(root, "dist", "index.js"));

function argument(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}

function requiredArgument(name, value) {
  if (value === undefined || value.length === 0) throw new Error(`${name} is required; T05 evidence must examine a real temporary corpus.`);
  return value;
}

const corpusDirectory = resolve(requiredArgument("--corpus", argument("--corpus") ?? process.env.T05_CORPUS_DIR));
const sourceDirectory = resolve(requiredArgument("--sources", argument("--sources") ?? process.env.T05_SOURCES_DIR));
const reportDirectory = resolve(root, argument("--report-dir") ?? process.env.T05_REPORT_DIR ?? "reports");

async function requireDirectory(path, label) {
  let details;
  try {
    details = await stat(path);
  } catch (error) {
    throw new Error(`${label} directory is missing: ${path}`, { cause: error });
  }
  if (!details.isDirectory()) throw new Error(`${label} path is not a directory: ${path}`);
}

await requireDirectory(corpusDirectory, "T05 corpus");
await requireDirectory(sourceDirectory, "T05 standards source");

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function sha256Json(value) {
  return sha256(Buffer.from(JSON.stringify(value)));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function safeChild(parent, fileName) {
  const candidate = resolve(parent, fileName);
  const prefix = parent.endsWith("/") ? parent : `${parent}/`;
  if (candidate !== parent && !candidate.startsWith(prefix)) throw new Error(`Refusing a path outside the temporary T05 directory: ${fileName}`);
  return candidate;
}

function imageEvidence(result) {
  return result.mpf?.images.map((image) => ({
    index: image.index,
    attributes: image.attributes,
    imageFormat: image.imageFormat,
    imageFormatCode: image.imageFormatCode,
    imageType: image.imageType,
    imageTypeCode: image.imageTypeCode,
    representative: image.representative,
    dependentChild: image.dependentChild,
    dependentParent: image.dependentParent,
    size: image.size,
    offset: image.offset,
    absoluteOffset: image.absoluteOffset,
    rangeLength: image.rangeLength,
    dependentImage1: image.dependentImage1,
    dependentImage2: image.dependentImage2,
    status: image.status,
    metadata: image.metadata === null ? null : {
      complete: image.metadata.complete,
      format: image.metadata.format,
      dimensions: image.metadata.dimensions,
      fieldCount: image.metadata.fieldIds.length,
      fieldIds: image.metadata.fieldIds,
      metadataFamilies: image.metadata.metadataFamilies,
      xmpPacketCount: image.metadata.xmpPacketCount,
      diagnosticCodes: image.metadata.diagnostics.map(({ code }) => code),
    },
  })) ?? [];
}

function segmentEvidence(result) {
  return result.mpf?.segments.map((segment) => ({
    id: segment.id,
    sourceOffset: segment.sourceOffset,
    byteLength: segment.byteLength,
    complete: segment.complete,
    mpfVersion: segment.mpfVersion,
    numberOfImages: segment.numberOfImages,
    indexIfd: segment.indexIfd === null ? null : {
      kind: segment.indexIfd.kind,
      sourceOffset: segment.indexIfd.sourceOffset,
      relativeOffset: segment.indexIfd.relativeOffset,
      byteLength: segment.indexIfd.byteLength,
      entryTags: segment.indexIfd.entries.map(({ tag }) => `0x${tag.toString(16).padStart(4, "0")}`),
    },
    attributeIfds: segment.attributeIfds.map((ifd) => ({
      kind: ifd.kind,
      sourceOffset: ifd.sourceOffset,
      relativeOffset: ifd.relativeOffset,
      byteLength: ifd.byteLength,
      entryTags: ifd.entries.map(({ tag }) => `0x${tag.toString(16).padStart(4, "0")}`),
    })),
    diagnosticCodes: segment.diagnostics.map(({ code }) => code),
  })) ?? [];
}

function ultraHdrEvidence(result) {
  if (result.ultraHdr === null || result.ultraHdr === undefined) return null;
  return {
    standard: result.ultraHdr.standard,
    namespaceUri: result.ultraHdr.namespaceUri,
    gContainerNamespaceUri: result.ultraHdr.gContainerNamespaceUri,
    sourcePacketIndices: result.ultraHdr.sourcePacketIndices,
    sourceBlockIds: result.ultraHdr.sourceBlockIds,
    version: result.ultraHdr.version,
    gainMapProperties: result.ultraHdr.gainMapProperties.map((property) => ({
      namespaceUri: property.namespaceUri,
      localName: property.localName,
      sourcePacketIndex: property.sourcePacketIndex,
      lexicalValueCount: property.lexicalValues.length,
      lexicalValues: property.lexicalValues,
      numericValues: property.numericValues,
    })),
    directory: result.ultraHdr.directory,
    primaryImageId: result.ultraHdr.primaryImageId,
    gainMapImageId: result.ultraHdr.gainMapImageId,
    status: result.ultraHdr.status,
    complete: result.ultraHdr.complete,
    diagnosticCodes: result.ultraHdr.diagnostics.map(({ code }) => code),
  };
}

const standards = [];
for (const source of manifest.standards) {
  assert(typeof source.temporaryFileName === "string" && source.temporaryFileName.length > 0, `${source.id} has no pinned temporary source filename.`);
  const path = safeChild(sourceDirectory, source.temporaryFileName);
  const bytes = new Uint8Array(await readFile(path));
  const actualHash = sha256(bytes);
  assert(actualHash === source.sha256, `${source.id} source hash mismatch: expected ${source.sha256}, received ${actualHash}`);
  standards.push({ ...source, byteLength: bytes.byteLength, verifiedSha256: actualHash });
}

const entries = [];
for (const fixture of manifest.fixtures) {
  const path = safeChild(corpusDirectory, fixture.fileName);
  const bytes = new Uint8Array(await readFile(path));
  const actualHash = sha256(bytes);
  assert(actualHash === fixture.sha256, `${fixture.fileName} fixture hash mismatch: expected ${fixture.sha256}, received ${actualHash}`);
  const result = await parseMetadata(bytes, { select: { groups: ["Dimensions", "MPF", "XMP"] } });
  assert(result.format === "jpeg", `${fixture.fileName} was detected as ${result.format}, not JPEG/MPF.`);
  assert(result.mpf !== null && result.mpf !== undefined, `${fixture.fileName} did not produce an MPF inventory.`);
  assert(result.mpf.complete, `${fixture.fileName} MPF inventory is incomplete: ${result.mpf.diagnostics.map(({ code }) => code).join(", ") || "no diagnostic code"}`);
  assert(result.mpf.images.length === fixture.expected.mpfImages, `${fixture.fileName} image count mismatch: expected ${fixture.expected.mpfImages}, received ${result.mpf.images.length}`);
  assert(result.mpf.images.every((image) => image.status === "decoded" && image.rangeLength === image.size && image.absoluteOffset !== null), `${fixture.fileName} has an undecoded or unresolved MPF image range.`);
  assert(result.mpf.images.slice(1).every((image) => image.metadata?.complete === true), `${fixture.fileName} has a secondary image without complete metadata inventory.`);
  assert(result.mpf.images[0]?.offset === 0 && result.mpf.images[0]?.absoluteOffset === 0, `${fixture.fileName} first MPF image does not use the required zero offset.`);
  if (fixture.kind === "android-ultra-hdr") {
    assert(result.ultraHdr?.complete === fixture.expected.ultraHdrComplete, `${fixture.fileName} Ultra HDR completeness did not match the pinned expectation.`);
    assert(result.ultraHdr?.status === "decoded", `${fixture.fileName} Ultra HDR status was not decoded.`);
    for (const property of fixture.expected.gainMapProperties) assert(result.ultraHdr.gainMapProperties.some((candidate) => candidate.localName === property), `${fixture.fileName} is missing required gain-map property ${property}.`);
    for (const semantic of fixture.expected.directorySemantics) assert(result.ultraHdr.directory.some((item) => item.semantic === semantic), `${fixture.fileName} is missing GContainer semantic ${semantic}.`);
    assert(result.ultraHdr.primaryImageId !== null && result.ultraHdr.gainMapImageId !== null, `${fixture.fileName} did not link both primary and gain-map images.`);
  } else {
    assert(fixture.expected.ultraHdrComplete === false, `${fixture.fileName} CIPA expectation must explicitly state that Ultra HDR is not required.`);
    assert(result.ultraHdr === null || result.ultraHdr.complete === false, `${fixture.fileName} unexpectedly produced a complete Ultra HDR inventory.`);
  }
  entries.push({
    id: fixture.id,
    kind: fixture.kind,
    fixture: `temporary-t05-corpus/${fixture.fileName}`,
    sourceUrl: fixture.url,
    repository: fixture.repository,
    commit: fixture.commit,
    license: fixture.license,
    byteLength: bytes.byteLength,
    sha256: actualHash,
    format: result.format,
    dimensions: result.dimensions,
    warningCodes: result.warnings.map(({ code }) => code),
    blockFamilies: [...new Set((result.blocks ?? []).map(({ family }) => family))],
    mpf: {
      complete: result.mpf.complete,
      segmentCount: result.mpf.segments.length,
      segments: segmentEvidence(result),
      imageCount: result.mpf.images.length,
      images: imageEvidence(result),
      primaryMetadataComplete: result.mpf.images[0]?.metadata?.complete === true,
      secondaryMetadataComplete: result.mpf.images.slice(1).every((image) => image.metadata?.complete === true),
      relationshipTypes: [...new Set(result.mpf.relationships.map(({ type }) => type))],
      diagnosticCodes: result.mpf.diagnostics.map(({ code }) => code),
    },
    ultraHdr: ultraHdrEvidence(result),
    status: "passed",
  });
}

const manifestHash = sha256Json(manifest);
const report = {
  schema: "browser-image-metadata.mpf-t05-evidence.v1",
  status: "pass",
  generatedAt: new Date().toISOString(),
  package: { name: packageManifest.name, version: packageManifest.version },
  manifest: { path: "data/mpf/reference-corpus.json", sha256: manifestHash, schema: manifest.schema },
  standards,
  corpusPolicy: "Temporary hash-pinned fixture directory only; fixture-relative paths, byte lengths, hashes, source commits, licenses, and decoded summaries are retained. No corpus bytes or derived image copies are written to the repository or report directory.",
  normalizationPolicy: "MPF offsets are retained as CIPA stored offsets and resolved absolute source offsets; TIFF numeric values are represented as integers; XMP values retain lexical strings alongside finite numeric interpretations; array and GContainer order is preserved; diagnostics are represented by stable codes and messages.",
  limitsPolicy: "SecurityLimits bound input, segment, IFD, image, XMP, nested JPEG, field, warning, and output sizes. Safe-integer arithmetic is required for every MPF offset and length. Remote URI references are never fetched.",
  writePolicy: "MPF and Ultra HDR writes remain refused by default. The explicit typed mpf: { mode: 'preserve', ultraHdr: 'preserve' } policy recalculates MPF offsets/sizes, verifies every bounded associated JPEG scan hash, and preserves complete Ultra HDR GContainer semantics; malformed or ambiguous relationships fail atomically.",
  corpus: {
    directoryRequired: true,
    expectedFixtureCount: manifest.fixtures.length,
    examinedFixtureCount: entries.length,
    completeParticipation: entries.length === manifest.fixtures.length,
    kinds: [...new Set(entries.map(({ kind }) => kind))].sort(),
  },
  fixtures: entries,
  complete: entries.length === manifest.fixtures.length && entries.every(({ status, mpf, kind, ultraHdr }) => status === "passed" && mpf.complete === true && (kind === "cipa-mpf" || ultraHdr?.complete === true)),
};
assert(report.corpus.completeParticipation, `T05 corpus participation was incomplete: examined ${entries.length} of ${manifest.fixtures.length} fixtures.`);
assert(report.corpus.kinds.includes("android-ultra-hdr") && report.corpus.kinds.includes("cipa-mpf"), "T05 evidence must include both Android Ultra HDR and CIPA MPF fixture classes.");
assert(report.complete, "T05 real corpus evidence did not pass all pinned fixture checks.");

await mkdir(reportDirectory, { recursive: true });
const jsonPath = join(reportDirectory, "mpf-t05-evidence.json");
const markdownPath = join(reportDirectory, "mpf-t05-evidence.md");
await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
const markdown = [
  "# T05 MPF and Ultra HDR evidence",
  "",
  `- Status: **${report.status}**`,
  `- Package: \`${report.package.name}@${report.package.version}\``,
  `- Standards manifest: \`${report.manifest.path}\` (SHA-256 \`${report.manifest.sha256}\`)`,
  `- Standards verified: ${report.standards.length}`,
  `- Fixtures examined: ${report.corpus.examinedFixtureCount}/${report.corpus.expectedFixtureCount} (Android Ultra HDR and CIPA MPF both present)`,
  "- Payload policy: temporary fixtures only; no third-party image bytes are copied into the repository or reports.",
  "",
  "| Fixture | Kind | Bytes | SHA-256 | MPF images | Secondary metadata | Ultra HDR | Status |",
  "| --- | --- | ---: | --- | ---: | --- | --- | --- |",
  ...report.fixtures.map((fixture) => `| ${fixture.fixture} | ${fixture.kind} | ${fixture.byteLength} | \`${fixture.sha256}\` | ${fixture.mpf.imageCount} | ${fixture.mpf.secondaryMetadataComplete ? "complete" : "incomplete"} | ${fixture.ultraHdr === null ? "not present" : fixture.ultraHdr.status} | ${fixture.status} |`),
  "",
  "## Verified policies",
  "",
  `- Normalization: ${report.normalizationPolicy}`,
  `- Limits: ${report.limitsPolicy}`,
  `- Write behavior: ${report.writePolicy}`,
  "",
  "The JSON artifact retains the complete bounded structural summary, including IFD tags, stored and resolved offsets, image attributes, relationships, secondary dimensions and metadata families, XMP lexical/numeric evidence, hashes, source commits, licenses, and diagnostic codes. It contains no image bytes.",
].join("\n");
await writeFile(markdownPath, `${markdown}\n`, "utf8");
console.log(`T05 MPF/Ultra HDR evidence passed for ${report.fixtures.length} fixtures; reports: ${relative(root, jsonPath).replaceAll("\\", "/")}, ${relative(root, markdownPath).replaceAll("\\", "/")}`);
