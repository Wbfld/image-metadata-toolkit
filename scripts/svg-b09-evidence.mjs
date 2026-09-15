import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const corpusValue = process.env.B09_SVG_CORPUS_DIR;
const outputDirectory = resolve(root, process.env.B09_SVG_OUTPUT_DIR ?? "reports");
const manifest = JSON.parse(await readFile(join(root, "data/svg/b09-sources.json"), "utf8"));
const packageManifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));

function fail(message) { throw new Error(`B09 SVG evidence failed: ${message}`); }
function assert(condition, message) { if (!condition) fail(message); }
function hash(value) { return createHash("sha256").update(value).digest("hex"); }
function normalizedHash(value) { return hash(value.replace(/\s+/gu, " ").trim()); }

if (typeof corpusValue !== "string" || corpusValue.trim().length === 0) {
  fail("no SVG corpus was examined: set B09_SVG_CORPUS_DIR to the temporary hash-pinned W3C fixture directory.");
}
assert(manifest.schema === "browser-image-metadata.b09-svg-sources.v1", "source manifest schema is invalid");
assert(manifest.maintenanceOwner === "WBLFD", "maintenance owner must remain WBLFD");
assert(Array.isArray(manifest.fixtures) && manifest.fixtures.length >= 1, "source manifest has no fixtures");
const parser = await import(join(root, "dist/index.js"));
const corpusDirectory = resolve(corpusValue);
const rows = [];

for (const fixture of manifest.fixtures) {
  const path = join(corpusDirectory, fixture.fileName);
  const info = await stat(path).catch(() => null);
  assert(info?.isFile() === true, `fixture is missing: ${fixture.fileName}`);
  const bytes = new Uint8Array(await readFile(path));
  assert(bytes.byteLength === fixture.bytes, `${fixture.fileName} byte length mismatch: expected ${fixture.bytes}, received ${bytes.byteLength}`);
  const sha256 = hash(bytes);
  assert(sha256 === fixture.sha256, `${fixture.fileName} SHA-256 mismatch: expected ${fixture.sha256}, received ${sha256}`);
  const result = await parser.parseMetadata(bytes);
  assert(result.format === "svg" && result.mimeType === "image/svg+xml" && result.container === "svg", `${fixture.fileName} was not recognized as SVG`);
  assert(result.completeness.complete, `${fixture.fileName} did not receive complete parser coverage`);
  assert(result.warnings.length === 0, `${fixture.fileName} produced diagnostics: ${result.warnings.map((warning) => warning.code).join(", ")}`);
  assert(result.xmp !== null && result.xmp.packets.length > 0, `${fixture.fileName} has no decoded RDF/XML packet`);
  assert(result.xmp.packetProvenance?.length === result.xmp.packets.length, `${fixture.fileName} lacks packet provenance`);
  const xmpBlocks = result.blocks.filter((block) => block.family === "XMP" && block.status === "decoded");
  assert(xmpBlocks.length === result.xmp.packets.length, `${fixture.fileName} does not have one decoded XMP block per packet`);
  for (const block of xmpBlocks) assert(block.offset !== null && block.length !== null && block.offset >= 0 && block.length > 0 && block.offset + block.length <= bytes.byteLength, `${fixture.fileName} has an invalid XMP byte range`);
  const documents = result.xmp.packets.map((packet) => parser.parseStructuredXmpDetailed(packet));
  assert(documents.every((document) => document.value !== null && document.diagnostics.every((diagnostic) => diagnostic.severity !== "error")), `${fixture.fileName} XMP packet did not parse as bounded RDF/XML`);
  const identities = [...new Set(documents.flatMap((document) => document.value.rdf.properties.map((property) => `${property.name.namespaceUri}#${property.name.localName}`)))].sort();
  assert(JSON.stringify(identities) === JSON.stringify([...fixture.expectedPropertyIdentities].sort()), `${fixture.fileName} property identities changed`);
  rows.push({
    fixture: `temporary/${fixture.fileName}`,
    bytes: bytes.byteLength,
    sha256,
    format: result.format,
    container: result.container,
    completeness: result.completeness,
    packetCount: result.xmp.packets.length,
    propertyIdentities: identities,
    propertyValueHashes: documents.flatMap((document) => document.value.rdf.properties.map((property) => ({ identity: `${property.name.namespaceUri}#${property.name.localName}`, hash: normalizedHash(JSON.stringify(property.value)) }))),
    blockRanges: xmpBlocks.map((block) => ({ id: block.id, offset: block.offset, length: block.length, status: block.status })),
    warningCodes: result.warnings.map((warning) => warning.code),
  });
}

assert(rows.length === manifest.fixtures.length, "only a partial SVG corpus run occurred");
const report = {
  schema: "browser-image-metadata.b09-svg-evidence.v1",
  ticket: "B09",
  generatedAt: new Date().toISOString(),
  package: { name: packageManifest.name, version: packageManifest.version },
  maintenanceOwner: manifest.maintenanceOwner,
  sources: manifest.sources.map(({ id, url, version, license }) => ({ id, url, version, license })),
  archive: manifest.archive,
  normalization: "SHA-256 over whitespace-normalized serialized structured XMP values; reports never retain lexical metadata values.",
  thresholds: { minimumFixtures: manifest.fixtures.length, minimumDecodedPackets: manifest.fixtures.length, maximumDiagnostics: 0, maximumMismatches: 0 },
  results: { fixtureCount: rows.length, decodedPacketCount: rows.reduce((total, row) => total + row.packetCount, 0), mismatches: 0, diagnostics: 0, rows },
};
await mkdir(outputDirectory, { recursive: true });
await writeFile(join(outputDirectory, "svg-b09-evidence.json"), `${JSON.stringify(report, null, 2)}\n`);
const markdown = [
  "# B09 SVG metadata evidence",
  "",
  `- Package: ${report.package.name} ${report.package.version}`,
  `- Maintenance owner: ${report.maintenanceOwner}`,
  `- Fixtures: ${report.results.fixtureCount}/${manifest.fixtures.length}`,
  `- Decoded RDF/XML packets: ${report.results.decodedPacketCount}`,
  "- Diagnostics: 0; mismatches: 0.",
  "- The W3C SVG fixture is temporary and is not redistributed here. Property values are represented only by normalized SHA-256 hashes.",
  "",
  "| Temporary fixture | SHA-256 | RDF/XML packets | Decoded XMP ranges | Property identities |",
  "| --- | --- | ---: | ---: | ---: |",
  ...rows.map((row) => `| ${row.fixture} | ${row.sha256} | ${row.packetCount} | ${row.blockRanges.length} | ${row.propertyIdentities.length} |`),
  "",
].join("\n");
await writeFile(join(outputDirectory, "svg-b09-evidence.md"), markdown);
console.log(`B09 SVG evidence verified: ${rows.length} hash-pinned W3C fixture(s), ${report.results.decodedPacketCount} decoded RDF/XML packet(s).`);
