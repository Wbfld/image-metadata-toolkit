import crypto from "node:crypto";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { TextEncoder } from "node:util";
import { exiftool } from "exiftool-vendored";

const root = resolve(new URL("..", import.meta.url).pathname);
const reports = resolve(root, process.env.PHOTOSHOP_B06_OUTPUT_DIR ?? "reports");
const sourceManifestPath = join(root, "data/photoshop-b06-sources.json");
const packageManifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const sourceManifestBytes = await readFile(sourceManifestPath);
const sourceManifest = JSON.parse(sourceManifestBytes.toString("utf8"));
const parser = await import(join(root, "dist/index.js"));

const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const text = (value) => new TextEncoder().encode(value);
const concat = (...parts) => {
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
};
const segment = (marker, payload) => {
  const length = payload.length + 2;
  return concat(Uint8Array.of(0xff, marker, length >>> 8, length & 0xff), payload);
};
const resource = (id, name, payload) => {
  const nameBytes = text(name);
  const nameFieldLength = 1 + nameBytes.length + ((1 + nameBytes.length) & 1);
  const output = new Uint8Array(4 + 2 + nameFieldLength + 4 + payload.length + (payload.length & 1));
  let offset = 0;
  output.set(text("8BIM"), offset); offset += 4;
  output[offset++] = id >>> 8; output[offset++] = id & 0xff;
  output[offset++] = nameBytes.length; output.set(nameBytes, offset); offset += nameBytes.length;
  if ((1 + nameBytes.length) & 1) output[offset++] = 0;
  new DataView(output.buffer).setUint32(offset, payload.length); offset += 4;
  output.set(payload, offset); offset += payload.length;
  if (payload.length & 1) output[offset] = 0;
  return output;
};
const resolution = () => {
  const value = new Uint8Array(16);
  const view = new DataView(value.buffer);
  view.setUint32(0, 300 * 65536); view.setUint16(4, 1); view.setUint16(6, 1);
  view.setUint32(8, 300 * 65536); view.setUint16(12, 1); view.setUint16(14, 1);
  return value;
};
const thumbnail = () => {
  const value = new Uint8Array(34);
  const view = new DataView(value.buffer);
  view.setUint32(4, 2); view.setUint32(8, 1); view.setUint32(12, 6); view.setUint32(16, 6); view.setUint32(20, 6); view.setUint16(24, 24); view.setUint16(26, 1);
  value.set([1, 2, 3, 4, 5, 6], 28);
  return value;
};
const resourceBytes = () => concat(
  text("Photoshop 3.0\0"),
  resource(0x03ed, "resolution", resolution()),
  resource(0x0409, "thumb", thumbnail()),
  resource(0x040c, "thumb-rgb", thumbnail()),
  resource(0x0404, "iptc", Uint8Array.of(0x1c, 2, 5, 0, 3, 0x41, 0x42, 0x43)),
  resource(0x0424, "xmp", text("<x:xmpmeta/>")),
  resource(0x0425, "digest", Uint8Array.from({ length: 16 }, (_, index) => index)),
  resource(0x07d0, "path", new Uint8Array(26)),
  resource(0x0bb7, "clip", concat(Uint8Array.of(4), text("clip"))),
  resource(0x1234, "odd", Uint8Array.of(9)),
  resource(0x1234, "", new Uint8Array()),
);
const fixtureBytes = () => concat(
  Uint8Array.of(0xff, 0xd8),
  segment(0xed, resourceBytes()),
  segment(0xc0, Uint8Array.of(8, 0, 1, 0, 2, 1, 1, 0x11, 0)),
  segment(0xda, Uint8Array.of(1, 1, 0, 0, 63, 0)),
  Uint8Array.of(1, 2, 3, 0xff, 0xd9),
);

function assert(condition, message) { if (!condition) throw new Error(message); }
function equalBytes(left, right) { return left.length === right.length && left.every((value, index) => value === right[index]); }
function app13Range(bytes) {
  for (let index = 0; index + 3 < bytes.length; index += 1) {
    if (bytes[index] !== 0xff || bytes[index + 1] !== 0xed) continue;
    const length = (bytes[index + 2] << 8) | bytes[index + 3];
    return { offset: index, length: length + 2 };
  }
  throw new Error("B06 evidence fixture has no APP13 segment.");
}
function scanPayload(bytes) {
  for (let index = 0; index + 3 < bytes.length; index += 1) {
    if (bytes[index] !== 0xff || bytes[index + 1] !== 0xda) continue;
    const length = (bytes[index + 2] << 8) | bytes[index + 3];
    const start = index + 4 + length - 2;
    const end = bytes.indexOf(0xff, start);
    if (end >= 0 && bytes[end + 1] === 0xd9) return bytes.subarray(start, end);
  }
  throw new Error("B06 evidence fixture has no complete scan payload.");
}
function sourceResourceBytes(bytes, resource) {
  return bytes.subarray(resource.offset, resource.offset + resource.length);
}
function comparison(field, local, oracle) {
  const localPresent = local !== null && local !== undefined;
  const oraclePresent = oracle !== null && oracle !== undefined;
  if (!localPresent || !oraclePresent) return { field, status: "non-comparable", localPresent, oraclePresent, reason: "one-oracle-view-does-not-expose-this-semantic" };
  const normalize = (value) => typeof value === "string" ? value.replace(/\0/gu, "").trim().replace(/\s+/gu, " ") : value;
  const left = normalize(local); const right = normalize(oracle);
  return { field, status: JSON.stringify(left) === JSON.stringify(right) ? "matched" : "mismatched", localPresent, oraclePresent, local: left, oracle: right };
}

const temp = await mkdtemp(join(tmpdir(), "photoshop-b06-"));
const fixturePath = join(temp, "photoshop-b06.jpg");
const input = fixtureBytes();
await writeFile(fixturePath, input);
const limits = parser.DEFAULT_LIMITS;
const before = await parser.parseMetadata(input);
assert(before.photoshop?.complete === true, "B06 fixture inventory is not complete.");
assert(before.photoshop.resources.length === 10, "B06 fixture did not exercise all 10 resources.");
const target = before.photoshop.resources[8];
assert(target !== undefined, "B06 exact-resource target is missing.");
const unrelated = parser.rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "standard-xmp", data: "<x:xmpmeta/>" }] });
const inputApp13 = app13Range(input);
const unrelatedApp13 = app13Range(unrelated.data);
assert(equalBytes(input.subarray(inputApp13.offset, inputApp13.offset + inputApp13.length), unrelated.data.subarray(unrelatedApp13.offset, unrelatedApp13.offset + unrelatedApp13.length)), "Unrelated JPEG edit did not retain the APP13 bytes.");
assert(sha256(scanPayload(input)) === sha256(scanPayload(unrelated.data)), "Unrelated JPEG edit changed entropy-coded image bytes.");
const exact = parser.rewriteJpegMetadata(input, { blocks: [{ op: "remove", kind: "photoshop-resource", resourceId: target.id }] });
const afterExact = await parser.parseMetadata(exact.data);
assert(afterExact.photoshop?.resources.length === 9, "Exact Photoshop resource removal did not remove one resource.");
assert(afterExact.photoshop.resources.filter((resource) => resource.resourceId === 0x1234).length === 1, "Exact Photoshop resource removal widened or removed the wrong duplicate.");
const exactSurvivors = before.photoshop.resources.filter((resource) => resource.id !== target.id);
assert(afterExact.photoshop.resources.length === exactSurvivors.length, "Exact Photoshop resource removal changed the survivor count.");
const survivorComparisons = afterExact.photoshop.resources.map((resource, index) => ({
  index,
  beforeSha256: sha256(sourceResourceBytes(input, exactSurvivors[index])),
  afterSha256: sha256(sourceResourceBytes(exact.data, resource)),
}));
assert(survivorComparisons.every((comparison) => comparison.beforeSha256 === comparison.afterSha256), "Exact Photoshop resource removal changed a surviving resource block.");
assert(sha256(scanPayload(input)) === sha256(scanPayload(exact.data)), "Exact Photoshop resource removal changed entropy-coded image bytes.");
const redacted = await parser.redactMetadata(input, { remove: [{ kind: "selector", selector: { kind: "photoshop-resource", resourceId: target.id } }] });
assert(redacted.outcome.successful && redacted.data !== null, "Typed exact Photoshop redaction did not succeed.");
const malformed = input.slice();
const firstNamePadding = 14 + 4 + 2 + 1 + 10;
malformed[app13Range(malformed).offset + 4 + firstNamePadding] = 7;
let malformedRefused = false;
try { parser.rewriteJpegMetadata(malformed, { blocks: [{ op: "add", kind: "standard-xmp", data: "<x:xmpmeta/>" }] }); } catch (error) { malformedRefused = error?.code === "UNSAFE_STRUCTURE"; }
assert(malformedRefused, "Malformed Photoshop padding was not refused atomically.");
const oversized = parser.parsePhotoshopResources(resourceBytes(), { ...limits, maxValueBytes: 1 }, { container: "app13", blockId: "fixture", sourceOffset: 0, sourceLength: resourceBytes().length });
assert(oversized?.resources.some((resource) => resource.status === "limited" && resource.rawPayload === null), "B06 payload retention limit did not produce a bounded limited resource.");

const oracleVersion = await exiftool.version();
const oracle = await exiftool.read(fixturePath, ["-G1", "-n"]);
const oracleComparisons = [
  comparison("IPTC:ObjectName", before.iptc?.fields.find((field) => field.name === "ObjectName")?.value ?? null, oracle["IPTC:ObjectName"] ?? oracle.ObjectName ?? null),
  comparison("XMP:packet-present", before.photoshop.resources.some((resource) => resource.kind === "xmp"), oracle.XMP ?? null),
  comparison("thumbnail-present", before.photoshop.resources.some((resource) => resource.kind === "thumbnail"), oracle.ThumbnailImage ?? null),
];
assert(!oracleComparisons.some((item) => item.status === "mismatched"), "A comparable Photoshop semantic differed from the independent secondary oracle.");
await exiftool.end();

const sourceHash = sha256(sourceManifestBytes);
const resourceEvidence = before.photoshop.resources.map((resource, index) => ({
  index,
  id: resource.id,
  resourceId: resource.resourceId,
  nameByteLength: resource.nameBytes.length,
  name: resource.name,
  status: resource.status,
  kind: resource.kind,
  offset: resource.offset,
  length: resource.length,
  payloadOffset: resource.payloadOffset,
  payloadLength: resource.payloadLength,
  payloadSha256: resource.rawPayload === null ? null : sha256(resource.rawPayload),
}));
const report = {
  schema: "browser-image-metadata.photoshop-b06-evidence.v1",
  ticket: "B06",
  generatedAt: new Date().toISOString(),
  package: { name: packageManifest.name, version: packageManifest.version },
  authoritativeSources: { manifest: "data/photoshop-b06-sources.json", manifestSha256: sourceHash, sources: sourceManifest.sources.map(({ id, url, retrieved, sha256: hash, license }) => ({ id, url, retrieved, sha256: hash, license })) },
  fixture: { path: "temporary/photoshop-b06.jpg", bytes: input.length, sha256: sha256(input), noRepositoryCopy: true },
  normalizationPolicy: { strings: "resource names are bounded Latin-1 presentation; XMP is strict UTF-8; raw payloads are hashed only in evidence", offsets: "source-relative absolute ranges; output offsets are reparsed and may move", padding: "name and payload padding must be zero and even-aligned", duplicates: "source order and duplicate resource IDs are preserved; exact removal addresses one source occurrence" },
  inventory: { complete: before.photoshop.complete, resourceCount: before.photoshop.resources.length, decodedKinds: [...new Set(before.photoshop.resources.map((resource) => resource.kind))].sort(), resources: resourceEvidence, diagnostics: before.photoshop.diagnostics },
  writer: { unrelatedEdit: { inputSha256: sha256(input), outputSha256: sha256(unrelated.data), beforeApp13: inputApp13, afterApp13: unrelatedApp13, app13Preserved: equalBytes(input.subarray(inputApp13.offset, inputApp13.offset + inputApp13.length), unrelated.data.subarray(unrelatedApp13.offset, unrelatedApp13.offset + unrelatedApp13.length)), imageScanSha256Before: sha256(scanPayload(input)), imageScanSha256After: sha256(scanPayload(unrelated.data)) }, exactResourceRemoval: { targetResourceId: target.id, inputSha256: sha256(input), outputSha256: sha256(exact.data), removedResourceCount: 1, retainedDuplicateIdCount: afterExact.photoshop.resources.filter((resource) => resource.resourceId === 0x1234).length, survivingResourceBlocksPreserved: survivorComparisons.every((comparison) => comparison.beforeSha256 === comparison.afterSha256), survivingResourceBlockSha256: survivorComparisons, imageScanPreserved: sha256(scanPayload(input)) === sha256(scanPayload(exact.data)), reparsed: true }, malformedAtomicity: { refused: malformedRefused, outputAllocated: false }, oversizedPayload: { limitedResourceDetected: true, rawPayloadOmitted: true } },
  secondaryOracle: { package: "exiftool-vendored", packageVersion: packageManifest.devDependencies?.["exiftool-vendored"] ?? null, version: oracleVersion, license: "ExifTool: Perl Artistic License or GPL-1.0-or-later; exiftool-vendored.js: MIT", provenance: ["https://exiftool.org/", "https://github.com/photostructure/exiftool-vendored.js"], role: "secondary output oracle only", comparisons: oracleComparisons },
  publicContractChanges: ["MetadataResult.photoshop bounded inventory", "MetadataGroup Photoshop", "parsePhotoshopResources and inspectPhotoshopResourceSpans exports", "photoshop-resource exact JPEG writer/edit/redaction selector"],
  humanReview: { required: true, status: "pending", scope: "every B06 writer change and exact Photoshop resource targeting diff", selfReviewIsNotApproval: true },
};
await mkdir(reports, { recursive: true });
await writeFile(join(reports, "photoshop-b06-evidence.json"), `${JSON.stringify(report, null, 2)}\n`);
const markdown = `# B06 Photoshop image-resource evidence\n\n- Package: \`${report.package.name}@${report.package.version}\`\n- Fixture: ${report.fixture.bytes} bytes, SHA-256 \`${report.fixture.sha256}\` (temporary only)\n- Authoritative source manifest SHA-256: \`${report.authoritativeSources.manifestSha256}\`\n- Inventory: ${report.inventory.resourceCount} resources, complete=${report.inventory.complete}\n- Unrelated edit APP13 preservation: ${report.writer.unrelatedEdit.app13Preserved}; entropy scan preserved: ${report.writer.unrelatedEdit.imageScanSha256Before === report.writer.unrelatedEdit.imageScanSha256After}\n- Exact resource removal: removed=${report.writer.exactResourceRemoval.removedResourceCount}; duplicate resources retained=${report.writer.exactResourceRemoval.retainedDuplicateIdCount}; reparsed=${report.writer.exactResourceRemoval.reparsed}\n- Exact-removal survivor blocks preserved byte-for-byte: ${report.writer.exactResourceRemoval.survivingResourceBlocksPreserved}\n- Malformed-padding atomic refusal: ${report.writer.malformedAtomicity.refused}\n- Oversized-payload bounding: limited resource detected=${report.writer.oversizedPayload.limitedResourceDetected}; raw payload omitted=${report.writer.oversizedPayload.rawPayloadOmitted}\n- Secondary oracle: ExifTool ${report.secondaryOracle.version}; comparable mismatches=${report.secondaryOracle.comparisons.filter((item) => item.status === "mismatched").length}; non-comparable=${report.secondaryOracle.comparisons.filter((item) => item.status === "non-comparable").length}\n- Mandatory human writer review: **pending**; this automated evidence and self-review do not constitute approval.\n\nSee the JSON report for complete source-order resource ranges, payload hashes, diagnostics, normalization rules, before/after hashes, and public contract changes. No fixture bytes are redistributed by this report.\n`;
await writeFile(join(reports, "photoshop-b06-evidence.md"), markdown);
console.log(`B06 Photoshop evidence passed: ${report.inventory.resourceCount} resources; reports written to reports/photoshop-b06-evidence.{json,md}`);
