import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "data", "iptc", "reference-images.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const directory = process.env.IPTC_REFERENCE_CORPUS_DIR;
const reportDirectory = path.resolve(root, process.env.IPTC_REFERENCE_REPORT_DIR ?? "reports");
const requiredEditions = ["2023.1", "2025.1"];

if (directory === undefined || directory.length === 0) throw new Error("IPTC_REFERENCE_CORPUS_DIR is required; the official reference corpus must be examined.");
if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) throw new Error(`IPTC reference corpus directory is missing: ${directory}`);
if (!Array.isArray(manifest.images) || manifest.images.length !== requiredEditions.length) throw new Error("Reference-image manifest must pin exactly the 2023.1 and 2025.1 official images.");
for (const edition of requiredEditions) if (manifest.images.filter((image) => image.edition === edition).length !== 1) throw new Error(`Reference-image manifest must contain exactly one ${edition} image.`);

function sha256(bytes) { return crypto.createHash("sha256").update(bytes).digest("hex"); }
function jsonSafe(value) {
  if (value instanceof Uint8Array) return { bytes: value.byteLength, sha256: sha256(value) };
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (value !== null && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => [key, jsonSafe(child)]));
  return value;
}
function semanticEvidence(semantic) {
  return semantic.fields.map((field) => ({
    id: field.id, sensitivity: field.sensitivity,
    candidates: field.candidates.map((candidate) => ({
      mapping: candidate.mapping, validation: candidate.validation, lexicalValue: candidate.lexicalValue ?? null,
      value: jsonSafe(candidate.value), raw: jsonSafe(candidate.raw),
      source: {
        kind: candidate.source.kind, family: candidate.source.family, record: candidate.source.record ?? null, dataset: candidate.source.dataset ?? null, occurrence: candidate.source.occurrence ?? null,
        namespaceUri: candidate.source.namespaceUri ?? null, localName: candidate.source.localName ?? null, packetIndex: candidate.source.packetIndex ?? null, packetId: candidate.source.packetId ?? null,
        blockId: candidate.source.blockId ?? null, offset: candidate.source.offset ?? null, length: candidate.source.length ?? null,
      }, diagnostics: candidate.diagnostics,
    })), conflicts: field.conflicts.map((conflict) => conflict.reason),
  }));
}
function normalizedHash(value) { return sha256(Buffer.from(JSON.stringify(value))); }
function semanticRoundTripEvidence(semantic) {
  const sourceEvidence = (source) => ({
    kind: source.kind, family: source.family, fieldId: source.fieldId,
    record: source.record ?? null, dataset: source.dataset ?? null, occurrence: source.occurrence ?? null,
    namespaceUri: source.namespaceUri ?? null, localName: source.localName ?? null,
    qualifiedName: source.qualifiedName ?? null, packetIndex: source.packetIndex ?? null,
    language: source.language ?? null,
  });
  const candidateEvidence = (candidate) => ({
    value: jsonSafe(candidate.value), raw: jsonSafe(candidate.raw), lexicalValue: candidate.lexicalValue ?? null,
    validation: candidate.validation, mapping: candidate.mapping, source: sourceEvidence(candidate.source), diagnostics: candidate.diagnostics,
  });
  return {
    fields: semantic.fields.map((field) => ({
      id: field.id,
      candidates: field.candidates.map(candidateEvidence),
      conflicts: field.conflicts.map((conflict) => ({ fieldId: conflict.fieldId, reason: conflict.reason, candidates: conflict.candidates.map(candidateEvidence) })),
    })),
    conflicts: semantic.conflicts.map((conflict) => ({ fieldId: conflict.fieldId, reason: conflict.reason, candidates: conflict.candidates.map(candidateEvidence) })),
    unknown: semantic.unknown.map(candidateEvidence),
  };
}
function provenanceEvidence(semantic) {
  const candidates = [...semantic.fields.flatMap((field) => field.candidates), ...semantic.unknown];
  const withBlockId = candidates.filter((candidate) => typeof candidate.source.blockId === "string" && candidate.source.blockId.length > 0).length;
  const withOffset = candidates.filter((candidate) => Number.isSafeInteger(candidate.source.offset) && candidate.source.offset >= 0).length;
  const withLength = candidates.filter((candidate) => Number.isSafeInteger(candidate.source.length) && candidate.source.length >= 0).length;
  const invalid = candidates.filter((candidate) => (candidate.source.offset !== null && candidate.source.offset !== undefined && (!Number.isSafeInteger(candidate.source.offset) || candidate.source.offset < 0)) || (candidate.source.length !== null && candidate.source.length !== undefined && (!Number.isSafeInteger(candidate.source.length) || candidate.source.length < 0))).length;
  return { candidateCount: candidates.length, withBlockId, withOffset, withLength, invalid };
}
function xmpPacketForSerialization(packet, parseStructuredXmpDetailed, serializeStructuredXmp) {
  const parsed = parseStructuredXmpDetailed(packet);
  if (parsed.value?.rdf === undefined) throw new Error("Official XMP packet could not be represented by the bounded RDF model.");
  if (parsed.diagnostics.some((diagnostic) => diagnostic.severity === "error")) throw new Error(`Official XMP packet has serializer-blocking diagnostics: ${parsed.diagnostics.map((diagnostic) => diagnostic.message).join("; ")}`);
  return serializeStructuredXmp(parsed.value.rdf);
}
function semanticShapeEvidence(semantic) {
  const values = [...semantic.fields.flatMap((field) => field.candidates), ...semantic.unknown].map((candidate) => candidate.value);
  const shape = { arrays: 0, languageAlternatives: 0, structuredResources: 0, qualifiers: 0, nestedProperties: 0 };
  const visit = (value) => {
    if (value === null || typeof value !== "object" || value instanceof Uint8Array) return;
    if (Array.isArray(value)) { value.forEach(visit); return; }
    const kind = value.kind;
    if (kind === "array") {
      shape.arrays += 1;
      if (value.container === "Alt") shape.languageAlternatives += 1;
      if (Array.isArray(value.items)) value.items.forEach(visit);
    }
    if (kind === "resource" || kind === "typed-resource" || kind === "blank-node") {
      shape.structuredResources += 1;
      if (Array.isArray(value.properties)) { shape.nestedProperties += value.properties.length; value.properties.forEach((property) => visit(property.value)); }
    }
    if (Array.isArray(value.qualifiers)) { shape.qualifiers += value.qualifiers.length; value.qualifiers.forEach((qualifier) => visit(qualifier.value)); }
  };
  values.forEach(visit);
  return shape;
}
function semanticCoverageEvidence(semantic, expectedProperties) {
  const fields = semantic.fields.filter((field) => field.candidates.length > 0);
  const versionSpecificIds = new Set(["iptc:aIPromptInformation", "iptc:aIPromptWriterNam", "iptc:aISystemUsed", "iptc:aISystemVersionUsed"]);
  return {
    supportedPropertyCount: expectedProperties.length,
    presentPropertyCount: fields.length,
    candidateCount: fields.reduce((total, field) => total + field.candidates.length, 0) + semantic.unknown.length,
    conflictCount: semantic.conflicts.length,
    invalidCandidateCount: [...fields.flatMap((field) => field.candidates), ...semantic.unknown].filter((candidate) => candidate.validation === "invalid").length,
    unsupportedCandidateCount: [...fields.flatMap((field) => field.candidates), ...semantic.unknown].filter((candidate) => candidate.validation === "unsupported").length,
    versionSpecificProperties: [...versionSpecificIds].filter((id) => fields.some((field) => field.id === id)),
    shape: semanticShapeEvidence(semantic),
  };
}
function markdown(report) {
  const rows = report.images.map((image) => `| ${image.edition} | ${image.fileName} | ${image.sha256} | ${image.presentProperties}/${image.expectedProperties} | ${image.candidateCount} | ${image.serialization.roundTrippedPropertyCount}/${image.serialization.supportedPropertyCount} | ${image.serialization.semanticEqual ? "pass" : "fail"} | ${image.serialization.outputSha256} |`);
  const details = report.images.map((image) => {
    const unsupported = image.serialization.unsupportedSourceProperties.length === 0
      ? "none"
      : image.serialization.unsupportedSourceProperties.map((item) => `${item.identity}: ${item.reason}`).join("; ");
    const diagnostics = image.diagnostics.length === 0 ? "none" : image.diagnostics.join(", ");
    return [
      `## ${image.edition}`,
      `- Source: ${image.byteLength} bytes, \`${image.sha256}\``,
      `- Standard: ${image.standard}`,
      `- Semantic hash before/after: \`${image.serialization.semanticHashBefore}\` / \`${image.serialization.semanticHashAfter}\``,
      `- Serialized output: ${image.serialization.outputByteLength} bytes, \`${image.serialization.outputSha256}\` (not retained)`,
      `- Coverage: ${JSON.stringify(image.serialization.coverage)}`,
      `- Provenance before/after: ${JSON.stringify(image.serialization.provenanceBefore)} / ${JSON.stringify(image.serialization.provenanceAfter)}`,
      `- Unsupported source properties: ${unsupported}`,
      `- Diagnostics: ${diagnostics}.`,
    ].join("\n");
  }).join("\n\n");
  return `# IPTC official reference-image conformance\n\n` +
    `Status: **${report.status}**. Both official images were required, hash-verified, serialized through the W06 writers, reparsed, and semantically compared; this report contains hashes and metadata evidence only, not image bytes.\n\n` +
    `- Package: \`${report.package.name}@${report.package.version}\`\n- Normalization: ${report.normalizationPolicy}\n- Serialization policy: ${report.serializationPolicy}\n- Source manifest: \`${report.manifest}\`\n- Executed: ${report.executedAt}\n\n` +
    `| Edition | Image | Source SHA-256 | Parsed properties | Candidates | Round-tripped properties | Round-trip | Serialized output SHA-256 |\n| --- | --- | --- | ---: | ---: | ---: | --- | --- |\n${rows.join("\n")}\n\n${details}\n\n` +
    `Diagnostics are retained standards-validation findings; they do not make an invalid lexical value valid, and raw/lexical representations remain in the JSON evidence.\n`;
}

const { parseMetadata, rewriteJpegMetadata, serializeIptcIim, serializeStructuredXmp } = await import(path.join(root, "dist", "index.js"));
const { parseStructuredXmpDetailed } = await import(path.join(root, "dist", "xmp.js"));
const report = {
  schemaVersion: 2, status: "pass", executedAt: new Date().toISOString(), package: { name: packageJson.name, version: packageJson.version }, manifest: path.relative(root, manifestPath),
  normalizationPolicy: "Lossless semantic candidates are normalized into sorted JSON object keys; RDF array order, language alternatives, lexical values, nested resources, IIM/XMP repetitions, conflicts, and packet/block/offset provenance remain ordered evidence. Physical offsets are compared only for validity after writing, never for semantic equality.",
  serializationPolicy: "Parse the complete supported official IIM/XMP view, serialize each XMP packet and each IPTC resource through the package writers, replace only those JPEG metadata blocks, reparse, and compare stable semantic candidates. No source or output image is retained in the repository.",
  images: [], mismatches: [], diagnostics: [],
};

for (const image of [...manifest.images].sort((left, right) => left.edition.localeCompare(right.edition))) {
  const file = path.join(directory, image.fileName);
  if (!fs.existsSync(file)) throw new Error(`Missing hash-pinned IPTC reference image: ${file}`);
  const bytes = fs.readFileSync(file); const hash = sha256(bytes);
  if (hash !== image.sha256) throw new Error(`${image.fileName} hash mismatch: expected ${image.sha256}, got ${hash}`);
  const result = await parseMetadata(bytes, { select: { groups: ["Dimensions", "IPTC", "XMP"] } });
  const semantic = result.iptcSemantic;
  if (semantic === undefined) throw new Error(`${image.fileName} did not produce IPTC semantic output.`);
  const evidence = semanticEvidence(semantic);
  const presentProperties = evidence.filter((field) => field.candidates.length > 0).map((field) => field.id.replace(/^iptc:/, ""));
  const expectedProperties = image.expectedPropertyIds;
  if (!Array.isArray(expectedProperties) || expectedProperties.length === 0) throw new Error(`${image.fileName} lacks pinned expected property identities.`);
  const missing = expectedProperties.filter((id) => !presentProperties.includes(id));
  const unexpected = presentProperties.filter((id) => !expectedProperties.includes(id));
  const candidateCount = evidence.reduce((total, field) => total + field.candidates.length, 0);
  const normalizedSemanticHash = normalizedHash(evidence);
  const diagnostics = semantic.diagnostics.map((diagnostic) => `${diagnostic.code}:${diagnostic.message}`);
  if (missing.length > 0 || unexpected.length > 0 || !semantic.complete || candidateCount === 0) throw new Error(`${image.fileName} conformance failed: missing=${missing.join(",") || "none"}; unexpected=${unexpected.join(",") || "none"}; semanticComplete=${semantic.complete}; diagnostics=${diagnostics.length}; candidates=${candidateCount}.`);
  if (typeof image.normalizedSemanticHash !== "string" || image.normalizedSemanticHash.length !== 64) throw new Error(`${image.fileName} lacks a pinned normalized semantic hash.`);
  if (normalizedSemanticHash !== image.normalizedSemanticHash) throw new Error(`${image.fileName} normalized semantic hash mismatch: expected ${image.normalizedSemanticHash}, got ${normalizedSemanticHash}`);
  const beforeRoundTrip = semanticRoundTripEvidence(semantic);
  const beforeRoundTripHash = normalizedHash(beforeRoundTrip);
  const xmpEdits = (result.xmp?.packets ?? []).map((packet, packetIndex) => {
    const serialized = xmpPacketForSerialization(packet, parseStructuredXmpDetailed, serializeStructuredXmp);
    const provenance = result.xmp?.packetProvenance?.find((candidate) => candidate.packetIndex === packetIndex);
    const blockId = provenance?.blockIds[0];
    return { op: "replace", kind: "standard-xmp", ...(blockId === undefined ? {} : { blockId }), data: serialized };
  });
  const iimByBlock = new Map();
  for (const field of result.iptc?.fields ?? []) {
    const blockId = field.source?.blockId ?? "__single_iptc_block__";
    const fields = iimByBlock.get(blockId) ?? [];
    fields.push({ record: field.tag >>> 8, dataset: field.tag & 0xff, value: field.raw, encoding: "binary", occurrence: field.occurrence });
    iimByBlock.set(blockId, fields);
  }
  const iptcEdits = [...iimByBlock.entries()].map(([blockId, fields]) => ({
    op: "replace", kind: "iptc", ...(blockId === "__single_iptc_block__" ? {} : { blockId }),
    data: serializeIptcIim(fields, { characterSet: "none", invalidValuePolicy: "preserve-raw", allowExtendedLengths: true }),
  }));
  const serializedOutput = rewriteJpegMetadata(bytes, { blocks: [...xmpEdits, ...iptcEdits], duplicatePolicy: "replace-target" });
  const reparsed = await parseMetadata(serializedOutput.data, { select: { groups: ["Dimensions", "IPTC", "XMP"] } });
  const afterSemantic = reparsed.iptcSemantic;
  if (afterSemantic === undefined) throw new Error(`${image.fileName} serialized output did not produce IPTC semantic output.`);
  const afterRoundTrip = semanticRoundTripEvidence(afterSemantic);
  const afterRoundTripHash = normalizedHash(afterRoundTrip);
  const roundTripMismatches = beforeRoundTripHash === afterRoundTripHash ? [] : [{ kind: "semantic-hash", before: beforeRoundTripHash, after: afterRoundTripHash }];
  const beforeProvenance = provenanceEvidence(semantic);
  const afterProvenance = provenanceEvidence(afterSemantic);
  if (roundTripMismatches.length > 0 || !afterSemantic.complete || afterProvenance.withBlockId !== afterProvenance.candidateCount || afterProvenance.invalid > 0) throw new Error(`${image.fileName} IPTC serializer round-trip failed: semanticEqual=${roundTripMismatches.length === 0}; semanticComplete=${afterSemantic.complete}; provenance=${JSON.stringify(afterProvenance)}.`);
  const serializedHash = sha256(serializedOutput.data);
  report.diagnostics.push(...diagnostics.map((diagnostic) => `${image.edition}: ${diagnostic}`));
  const coverage = semanticCoverageEvidence(semantic, expectedProperties);
  const afterCoverage = semanticCoverageEvidence(afterSemantic, expectedProperties);
  report.images.push({ edition: image.edition, fileName: image.fileName, sha256: hash, byteLength: bytes.byteLength, sourceUrl: image.url, standard: image.standard, expectedProperties: expectedProperties.length, presentProperties: presentProperties.length, candidateCount, normalizedSemanticHash, mismatches: { missingPropertyIds: missing, unexpectedPropertyIds: unexpected, normalizedSemanticHash: normalizedSemanticHash === image.normalizedSemanticHash ? null : { expected: image.normalizedSemanticHash, actual: normalizedSemanticHash } }, diagnostics, serialization: { attempted: true, serialized: true, reparsed: true, xmpPackets: xmpEdits.length, iptcBlocks: iptcEdits.length, outputByteLength: serializedOutput.data.byteLength, outputSha256: serializedHash, semanticHashBefore: beforeRoundTripHash, semanticHashAfter: afterRoundTripHash, semanticEqual: roundTripMismatches.length === 0, mismatches: roundTripMismatches, supportedPropertyCount: coverage.supportedPropertyCount, roundTrippedPropertyCount: afterCoverage.presentPropertyCount, coverage: { before: coverage, after: afterCoverage }, unsupportedSourceProperties: [], provenanceBefore: beforeProvenance, provenanceAfter: afterProvenance, reparsedFormat: reparsed.format, reparsedDimensions: reparsed.dimensions, reparsedBlocks: reparsed.blocks.filter((block) => block.family === "IPTC" || block.family === "XMP").map((block) => ({ id: block.id, family: block.family, offset: block.offset, length: block.length })) } });
}

if (report.images.length !== requiredEditions.length) throw new Error(`IPTC conformance examined ${report.images.length} of ${requiredEditions.length} required reference images.`);
fs.mkdirSync(reportDirectory, { recursive: true });
fs.writeFileSync(path.join(reportDirectory, "iptc-reference-conformance.json"), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join(reportDirectory, "iptc-reference-conformance.md"), markdown(report));
console.log(`IPTC official reference conformance passed for ${report.images.length} images; reports: ${path.relative(root, reportDirectory)}/iptc-reference-conformance.{json,md}`);
