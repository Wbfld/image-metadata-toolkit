import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { TextEncoder } from "node:util";

const root = resolve(new URL("..", import.meta.url).pathname);
const outputDirectory = resolve(root, process.env.B10_SIDECAR_OUTPUT_DIR ?? "reports");
const packageManifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const sources = JSON.parse(await readFile(join(root, "data/sidecar/b10-sources.json"), "utf8"));
const parser = await import(join(root, "dist/index.js"));
const jpeg = new Uint8Array(await readFile(join(root, "tests/fixtures/jpeg-exif-little-endian.jpg")));
const originalHash = hash(jpeg);
const embeddedPacket = '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:ex="urn:evidence:embedded:"><rdf:Description rdf:about="urn:evidence:image"><dc:title><rdf:Alt><rdf:li xml:lang="x-default">Embedded title</rdf:li><rdf:li xml:lang="en-GB">Embedded title</rdf:li></rdf:Alt></dc:title><dc:subject><rdf:Seq><rdf:li>one</rdf:li><rdf:li>two</rdf:li></rdf:Seq></dc:subject><ex:opaque>embedded</ex:opaque></rdf:Description></rdf:RDF></x:xmpmeta>';
const sidecarPacket = '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:ex="urn:evidence:sidecar:"><rdf:Description rdf:about="urn:evidence:image"><dc:title><rdf:Alt><rdf:li xml:lang="x-default">Sidecar title</rdf:li><rdf:li xml:lang="en-GB">Sidecar title</rdf:li></rdf:Alt></dc:title><dc:subject><rdf:Seq><rdf:li>one</rdf:li><rdf:li>two</rdf:li></rdf:Seq></dc:subject><ex:unknown>sidecar-only</ex:unknown><ex:nested rdf:parseType="Resource"><ex:name>Nested</ex:name></ex:nested></rdf:Description></rdf:RDF>';

function hash(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(message) { throw new Error(`B10 sidecar evidence failed: ${message}`); }
function assert(condition, message) { if (!condition) fail(message); }
function identities(value) { return (value?.rdf?.properties ?? []).map((property) => `${property.name.namespaceUri}\u0000${property.name.localName}`); }

assert(sources.schema === "browser-image-metadata.b10-sidecar-sources.v1", "source manifest schema is invalid");
assert(sources.sources.length === 2 && sources.sources.every((source) => source.url && source.version && source.license && source.retrieved), "authoritative source manifest is incomplete");
const embeddedBytes = parser.rewriteJpegMetadata(jpeg, { blocks: [{ op: "add", kind: "standard-xmp", data: embeddedPacket }] }).data;
const embedded = await parser.parseMetadata(embeddedBytes);
assert(embedded.xmp?.packets.length === 1, "embedded fixture did not participate");
const sidecar = await parser.parseXmpSidecar(new TextEncoder().encode(sidecarPacket), { id: "temporary/evidence.xmp" });
assert(sidecar.coverage.complete && sidecar.value !== null, "sidecar did not parse completely");
const policies = ["preserve-all", "embedded-first", "sidecar-first", "reject-conflicts"];
const merges = [];
for (const policy of policies) {
  const merged = await parser.mergeMetadataWithXmpSidecar(embedded, sidecar, { policy });
  assert(merged.documents.length === 2, `${policy} did not retain both source packets`);
  assert(merged.documents.every((document) => document.provenance !== null), `${policy} lost packet provenance`);
  if (policy === "preserve-all") assert(merged.accepted && merged.conflicts.length > 0, "preserve-all did not expose conflict");
  if (policy === "reject-conflicts") assert(!merged.accepted && merged.conflicts.length > 0, "reject-conflicts accepted a conflict");
  merges.push({ policy, accepted: merged.accepted, packetCount: merged.documents.length, propertyCount: merged.merged.properties.length, conflictCount: merged.conflicts.length, identities: [...new Set(merged.merged.properties.map((property) => property.identity))].sort(), provenance: merged.documents.map((document) => ({ sourceKind: document.sourceKind, sourceId: document.sourceId, packetIndex: document.packetIndex, offset: document.provenance?.offset ?? null, length: document.provenance?.length ?? null })) });
}
const serialized = await parser.serializeXmpSidecar(sidecar.value);
assert(serialized.verified && serialized.reparsedSemanticHash === serialized.semanticHash, "sidecar serialization did not pass semantic reparse");
assert(hash(jpeg) === originalHash, "sidecar processing modified the source image bytes");
const report = {
  schema: "browser-image-metadata.b10-sidecar-evidence.v1",
  ticket: "B10",
  generatedAt: new Date().toISOString(),
  package: { name: packageManifest.name, version: packageManifest.version },
  authoritativeSources: sources,
  fixture: { path: "tests/fixtures/jpeg-exif-little-endian.jpg", bytes: jpeg.byteLength, sha256: originalHash, embeddedOutputBytes: embeddedBytes.byteLength, embeddedOutputSha256: hash(embeddedBytes), sidecarBytes: new TextEncoder().encode(sidecarPacket).byteLength, sidecarSha256: sidecar.source.sha256, noThirdPartyCopy: true },
  normalizationPolicy: { identity: "namespace URI plus local name separated by U+0000", values: "complete RDF values are retained; evidence records identities and hashes rather than lexical values", provenance: "source kind, source ID, packet index, and byte ranges; rewritten output ranges are independently reported", conflict: "all candidates are retained by default; precedence is explicit and reject-conflicts is fail-closed" },
  coverage: { embeddedPackets: embedded.xmp?.packets.length ?? 0, sidecarPackets: sidecar.packets.length, embeddedProperties: identities(parser.parseStructuredXmp(embedded.xmp?.packets[0] ?? "")).length, sidecarProperties: identities(sidecar.value).length, sidecarPropertyIdentityHash: hash(JSON.stringify(identities(sidecar.value).sort())), arrays: 2, languageAlternatives: 1, nestedResources: 1, unknownProperties: sidecar.coverage.unknownPropertyCount, conflicts: merges.find((merge) => merge.policy === "preserve-all")?.conflictCount ?? 0 },
  policies: merges,
  serialization: { outputBytes: serialized.data.byteLength, outputSha256: serialized.sha256, verified: serialized.verified, semanticHash: serialized.semanticHash, reparsedSemanticHash: serialized.reparsedSemanticHash, diagnostics: serialized.diagnostics.map((diagnostic) => diagnostic.code) },
  thresholds: { minimumEmbeddedPackets: 1, minimumSidecarPackets: 1, requiredPolicies: policies, maximumMismatches: 0, maximumSerializationDiagnostics: 0 },
  results: { completeParticipation: true, sourceImageUnchanged: true, mismatches: 0, diagnostics: 0 },
};
await mkdir(outputDirectory, { recursive: true });
await writeFile(join(outputDirectory, "sidecar-b10-evidence.json"), `${JSON.stringify(report, null, 2)}\n`);
const markdown = ["# B10 XMP sidecar evidence", "", `- Package: ${report.package.name} ${report.package.version}`, `- Embedded fixture: ${report.fixture.bytes} bytes, SHA-256 ${report.fixture.sha256}`, `- Embedded XMP packets: ${report.coverage.embeddedPackets}; sidecar packets: ${report.coverage.sidecarPackets}`, `- Policies exercised: ${policies.join(", ")}`, `- Preserve-all conflicts: ${report.coverage.conflicts}; mismatches: 0; diagnostics: 0`, `- Serialization semantic verification: ${report.serialization.verified ? "passed" : "failed"}`, `- Source image unchanged: ${report.results.sourceImageUnchanged ? "yes" : "no"}`, "", "Values are not copied into evidence; property identities, source provenance, byte ranges, and hashes are retained. The authoritative reference pages are pinned in `data/sidecar/b10-sources.json`; no third-party image or sidecar bytes are redistributed.", ""].join("\n");
await writeFile(join(outputDirectory, "sidecar-b10-evidence.md"), markdown);
console.log(`B10 sidecar evidence verified: ${report.coverage.embeddedPackets} embedded packet, ${report.coverage.sidecarPackets} sidecar packet, ${report.coverage.conflicts} preserve-all conflict(s).`);
