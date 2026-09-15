import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { TextEncoder } from "node:util";

const root = resolve(import.meta.dirname, "..");
const reportPath = join(root, "reports/g04-launch-evidence.json");
const markdownPath = join(root, "reports/g04-launch-evidence.md");
const checkOnly = process.argv.includes("--check");
const encoder = new TextEncoder();

function assert(condition, message) {
  if (!condition) throw new Error(`G04 launch audit: ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function concat(...parts) {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.byteLength, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}

function jpegSegment(marker, payload) {
  assert(payload.byteLength <= 0xfffd, "demo JPEG metadata segment exceeds the baseline segment limit");
  return concat(Uint8Array.of(0xff, marker, (payload.byteLength + 2) >>> 8, (payload.byteLength + 2) & 0xff), payload);
}

function extractIccProfile(bytes) {
  const identifier = encoder.encode("ICC_PROFILE\0");
  let cursor = 2;
  const chunks = [];
  while (cursor + 4 <= bytes.byteLength) {
    if (bytes[cursor] !== 0xff) { cursor += 1; continue; }
    while (bytes[cursor] === 0xff) cursor += 1;
    const marker = bytes[cursor] ?? 0;
    cursor += 1;
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (cursor + 2 > bytes.byteLength) break;
    const length = ((bytes[cursor] ?? 0) << 8) | (bytes[cursor + 1] ?? 0);
    if (length < 2 || cursor + length > bytes.byteLength) break;
    const payload = bytes.subarray(cursor + 2, cursor + length);
    let matches = payload.byteLength >= identifier.byteLength;
    for (let index = 0; matches && index < identifier.byteLength; index += 1) matches = payload[index] === identifier[index];
    if (marker === 0xe2 && matches && payload.byteLength >= identifier.byteLength + 2) chunks.push(payload.subarray(identifier.byteLength + 2));
    cursor += length;
  }
  assert(chunks.length > 0, "the pinned ICC fixture did not expose an ICC profile");
  return concat(...chunks);
}

function pngChunk(type, payload) {
  const typeBytes = encoder.encode(type);
  const body = concat(typeBytes, payload);
  let crc = 0xffffffff;
  for (const byte of body) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  const checksum = (crc ^ 0xffffffff) >>> 0;
  return concat(Uint8Array.of(payload.length >>> 24, (payload.length >>> 16) & 0xff, (payload.length >>> 8) & 0xff, payload.length & 0xff), body, Uint8Array.of(checksum >>> 24, (checksum >>> 16) & 0xff, (checksum >>> 8) & 0xff, checksum & 0xff));
}

function virtualLargeJpeg(prefix, size) {
  let fullMaterializationRequested = false;
  return {
    get fullMaterializationRequested() { return fullMaterializationRequested; },
    size,
    arrayBuffer: async () => { fullMaterializationRequested = true; throw new Error("The launch demo forbids full-image materialization."); },
    slice(start, end) {
      const result = new Uint8Array(end - start);
      const sourceStart = Math.max(0, start);
      const sourceEnd = Math.min(prefix.byteLength, end);
      if (sourceEnd > sourceStart) result.set(prefix.subarray(sourceStart, sourceEnd), sourceStart - start);
      return { arrayBuffer: async () => result.buffer };
    },
  };
}

async function runDemos() {
  const { parseMetadata, redactMetadata, rewriteJpegMetadata, toExifReaderCompatible, toExifrCompatible, verifyPreservation, IPTC_TECHREFERENCE_PROPERTIES } = await import("../dist/index.js");
  const gpsSource = new Uint8Array(await readFile(join(root, "tests/fixtures/jpeg-exif-little-endian.jpg")));
  const iccSource = new Uint8Array(await readFile(join(root, "tests/fixtures/jpeg-icc.jpg")));
  const profile = extractIccProfile(iccSource);
  const sourceWithColor = rewriteJpegMetadata(gpsSource, { blocks: [{ op: "add", kind: "icc", data: profile }] }).data;
  const before = await parseMetadata(sourceWithColor);
  assert(before.fields.some((field) => field.name === "Orientation" && field.value === 6), "metadata-removal demo fixture lacks its non-default orientation");
  assert(before.icc?.complete === true, "metadata-removal demo fixture lacks a complete ICC profile");
  assert(before.fields.some((field) => field.name === "GPSLatitude"), "metadata-removal demo fixture lacks GPS metadata");
  const redacted = await redactMetadata(sourceWithColor, { remove: ["GPS"], preserve: ["Orientation", "ICC"] });
  assert(redacted.outcome.successful && redacted.outcome.complete, "GPS-removal demo was not applied completely");
  const after = await parseMetadata(redacted.data);
  const preservation = await verifyPreservation(sourceWithColor, redacted.data);
  assert(after.fields.some((field) => field.name === "Orientation" && field.value === 6), "GPS-removal demo changed orientation");
  assert(after.icc?.complete === true, "GPS-removal demo removed the ICC profile");
  assert(!after.fields.some((field) => field.name === "GPSLatitude" || field.name === "GPSLongitude"), "GPS-removal demo retained GPS coordinates");
  assert(preservation.status === "passed" && preservation.payloadSummary.mismatchedCount === 0, "GPS-removal demo did not prove encoded payload preservation");

  const large = virtualLargeJpeg(gpsSource, 200 * 1024 * 1024);
  const ranged = await parseMetadata(large, { scope: "metadata", select: { groups: ["Dimensions", "EXIF"], tags: ["Make"] } });
  assert(ranged.completeness.inputBytes === large.size, "large-image demo did not retain the 200 MiB source size");
  assert((ranged.telemetry?.bytesRead ?? Number.POSITIVE_INFINITY) < large.size, "large-image demo read the complete 200 MiB source");
  assert(!large.fullMaterializationRequested, "large-image demo requested Blob full materialization");

  const packet = `<x:xmpmeta xmlns:x="adobe:ns:meta/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:iptcCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/" xmlns:iptcExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" xmlns:plus="http://ns.useplus.org/ldf/xmp/1.0/"><rdf:RDF><rdf:Description rdf:about="" iptcCore:AltTextAccessibility="Accessible description" iptcExt:AIPromptInformation="creator prompt" iptcExt:AISystemUsed="creator system" plus:DataMining="prohibited"/></rdf:RDF></x:xmpmeta>`;
  const standards = await parseMetadata(rewriteJpegMetadata(new Uint8Array(await readFile(join(root, "tests/fixtures/base.jpg"))), { blocks: [{ op: "add", kind: "standard-xmp", data: packet }] }).data);
  const semantic = standards.iptcSemantic?.fields ?? [];
  const semanticIds = new Set(semantic.filter((field) => field.candidates.length > 0).map((field) => field.id));
  for (const id of ["iptc:altTextAccessibility", "iptc:aIPromptInformation", "iptc:aISystemUsed", "iptc:dataMining"]) assert(semanticIds.has(id), `standards demo did not decode ${id}`);
  const ai2025 = IPTC_TECHREFERENCE_PROPERTIES.filter((property) => property.applicableVersions.includes("2025.1") && /AI|Prompt/u.test(property.name));
  assert(ai2025.length >= 4, "generated IPTC 2025.1 AI coverage was not available to the launch demo");
  const exifReaderView = toExifReaderCompatible(before);
  const exifrView = toExifrCompatible(before);
  assert(typeof exifReaderView === "object" && exifReaderView !== null && typeof exifrView === "object" && exifrView !== null, "compatibility demo did not produce reader-shaped views");

  const pngBase = new Uint8Array(await readFile(join(root, "tests/fixtures/base.png")));
  const iend = pngBase.byteLength - 12;
  const c2paPng = concat(pngBase.subarray(0, iend), pngChunk("caBX", encoder.encode("c2pa urn:c2pa:manifest https://example.invalid/remote")), pngBase.subarray(iend));
  const c2paRefusal = await redactMetadata(c2paPng, { remove: ["PNGText"] });
  assert(!c2paRefusal.outcome.successful && c2paRefusal.data.byteLength === c2paPng.byteLength, "C2PA refusal demo produced a successful or changed output");
  const hdr = concat(gpsSource.subarray(0, 2), jpegSegment(0xe1, encoder.encode("http://ns.adobe.com/xap/1.0/\0<hdrgm:Version=1.0/>")), gpsSource.subarray(2));
  const hdrRefusal = await redactMetadata(hdr, { remove: ["EXIF"] });
  assert(!hdrRefusal.outcome.successful && hdrRefusal.data.byteLength === hdr.byteLength, "Ultra HDR refusal demo produced a successful or changed output");

  return {
    metadataRemoval: { inputSha256: sha256(sourceWithColor), outputSha256: sha256(redacted.data), orientation: after.fields.find((field) => field.name === "Orientation")?.value ?? null, iccComplete: after.icc?.complete === true, gpsRemoved: !after.fields.some((field) => field.name === "GPSLatitude" || field.name === "GPSLongitude"), preservationStatus: preservation.status, protectedPayloadMatches: preservation.payloadSummary.matchedCount, protectedPayloadMismatches: preservation.payloadSummary.mismatchedCount },
    largeImageMetadataRanges: { inputBytes: ranged.completeness.inputBytes, bytesRead: ranged.completeness.bytesRead ?? ranged.telemetry?.bytesRead ?? null, readRequests: ranged.telemetry?.readRequests ?? null, fullMaterializationRequested: large.fullMaterializationRequested },
    standardsInspection: { propertyIds: ["iptc:altTextAccessibility", "iptc:aIPromptInformation", "iptc:aISystemUsed", "iptc:dataMining"], decodedPropertyCount: semantic.filter((field) => field.candidates.length > 0).length, ai2025PropertyCount: ai2025.length, compatibilityViews: ["exifreader", "exifr"] },
    protectedMetadataRefusal: { c2pa: { refused: !c2paRefusal.outcome.successful, atomic: c2paRefusal.data.byteLength === c2paPng.byteLength }, ultraHdr: { refused: !hdrRefusal.outcome.successful, atomic: hdrRefusal.data.byteLength === hdr.byteLength } },
  };
}

async function fileEvidence(relativePath) {
  const bytes = await readFile(join(root, relativePath));
  return { path: relativePath, byteLength: bytes.byteLength, sha256: sha256(bytes) };
}

function markdownReport(report) {
  const artifacts = report.artifacts.map((artifact) => `| ${artifact.path} | ${artifact.byteLength} | ${artifact.sha256} |`).join("\n");
  return `# G04 launch evidence\n\n- Status: **${report.status}**\n- Package: ${report.package.name} ${report.package.version}\n- Evidence version: ${report.reportVersion}\n- External publication: ${report.publication.status}\n\n## Executed launch workflows\n\n| Workflow | Result |\n| --- | --- |\n| Remove GPS while retaining orientation and ICC | ${report.demos.metadataRemoval.preservationStatus}, ${report.demos.metadataRemoval.protectedPayloadMatches} protected payload match |\n| Read metadata ranges from a 200 MiB virtual image | ${report.demos.largeImageMetadataRanges.bytesRead} bytes read of ${report.demos.largeImageMetadataRanges.inputBytes}; full materialization: ${report.demos.largeImageMetadataRanges.fullMaterializationRequested ? "yes" : "no"} |\n| Inspect Exif 3.1/IPTC 2025.1 AI and accessibility | ${report.demos.standardsInspection.decodedPropertyCount} semantic values, ${report.demos.standardsInspection.ai2025PropertyCount} AI properties available |\n| Refuse C2PA and Ultra HDR invalidation | C2PA: ${report.demos.protectedMetadataRefusal.c2pa.refused ? "refused atomically" : "not refused"}; Ultra HDR: ${report.demos.protectedMetadataRefusal.ultraHdr.refused ? "refused atomically" : "not refused"} |\n| Migrate common ExifReader/exifr calls | ${report.demos.standardsInspection.compatibilityViews.join(" and ")} views generated |\n\nNo image bytes are retained in this evidence report; only derived hashes, dimensions, counters, statuses, and compatibility identities are recorded.\n\n## Release-day artifacts\n\n| Path | Bytes | SHA-256 |\n| --- | ---: | --- |\n${artifacts}\n\nThe technical article, local playground, benchmark artifacts, integration examples, and launch plan are present and hash-audited. The package does not claim that an external site, article, playground, or benchmark publication occurred; an operator must publish these repository artifacts separately.\n`;
}

const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const demos = await runDemos();
const artifactPaths = [
  "G04_LAUNCH_PLAN.md",
  "G04_TECHNICAL_ARTICLE.md",
  "G04_INTEGRATION_EXAMPLES.md",
  "docs-site/index.html",
  "docs-site/playground.html",
  "BENCHMARKS.md",
  "reports/g02-comparison.json",
  "examples/integrations/README.md",
  "examples/integrations/deno.ts",
  "examples/integrations/next-client.tsx",
  "examples/integrations/react.tsx",
  "examples/integrations/vite.ts",
];
const artifacts = await Promise.all(artifactPaths.map(fileEvidence));
const report = {
  schemaVersion: 1,
  reportVersion: "g04-launch-audit/1",
  status: "passed",
  generatedAt: new Date().toISOString(),
  package: { name: packageJson.name, version: packageJson.version },
  demos,
  artifacts,
  publication: { status: "ready-for-operator-publication", externalPublicationPerformed: false, reason: "This repository operation does not publish or modify external services." },
  normalizationPolicy: ["SHA-256 lowercase hexadecimal", "counts and statuses are derived from executed APIs", "reader compatibility views are only shape smoke checks", "protected encoded payloads are compared by the preservation verifier", "no pixel equivalence is claimed"],
};

if (checkOnly) {
  const existing = JSON.parse(await readFile(reportPath, "utf8"));
  assert(existing.status === "passed" && existing.reportVersion === report.reportVersion, "checked-in launch report is not the expected passed version");
  assert(existing.publication.externalPublicationPerformed === false, "launch report makes an unsupported external-publication claim");
  assert(existing.demos.metadataRemoval.preservationStatus === "passed" && existing.demos.metadataRemoval.protectedPayloadMismatches === 0, "checked-in metadata-removal evidence is incomplete");
  assert(existing.demos.largeImageMetadataRanges.fullMaterializationRequested === false && existing.demos.largeImageMetadataRanges.bytesRead < existing.demos.largeImageMetadataRanges.inputBytes, "checked-in range-read evidence is incomplete");
  assert(existing.demos.protectedMetadataRefusal.c2pa.refused && existing.demos.protectedMetadataRefusal.ultraHdr.refused, "checked-in protected-metadata refusal evidence is incomplete");
  for (const artifact of artifacts) {
    const previous = existing.artifacts.find((candidate) => candidate.path === artifact.path);
    assert(previous?.sha256 === artifact.sha256 && previous.byteLength === artifact.byteLength, `checked-in launch artifact is stale for ${artifact.path}`);
  }
  const markdown = await readFile(markdownPath, "utf8");
  assert(markdown.includes("Status: **passed**") && markdown.includes("ready-for-operator-publication"), "checked-in launch Markdown is incomplete");
  console.log(JSON.stringify({ status: "passed", checked: "reports/g04-launch-evidence.json" }, null, 2));
} else {
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdownPath, markdownReport(report));
  console.log(JSON.stringify({ status: report.status, report: "reports/g04-launch-evidence.json", workflows: 5, artifacts: artifacts.length }, null, 2));
}
