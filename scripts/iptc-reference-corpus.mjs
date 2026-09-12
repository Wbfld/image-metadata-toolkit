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
function markdown(report) {
  const rows = report.images.map((image) => `| ${image.edition} | ${image.fileName} | ${image.sha256} | ${image.presentProperties}/${image.expectedProperties} | ${image.candidateCount} | ${image.normalizedSemanticHash} |`);
  return `# IPTC official reference-image conformance\n\n` +
    `Status: **${report.status}**. Both official images were required, hash-verified, and parsed; this report contains hashes and metadata evidence only, not image bytes.\n\n` +
    `- Package: \`${report.package.name}@${report.package.version}\`\n- Normalization: ${report.normalizationPolicy}\n- Source manifest: \`${report.manifest}\`\n- Executed: ${report.executedAt}\n\n` +
    `| Edition | Image | SHA-256 | Properties | Candidates | Normalized semantic hash |\n| --- | --- | --- | ---: | ---: | --- |\n${rows.join("\n")}\n\n` +
    `Diagnostics: ${report.diagnostics.length === 0 ? "none" : report.diagnostics.map((diagnostic) => `\`${diagnostic}\``).join(", ")}.\n`;
}

const { parseMetadata } = await import(path.join(root, "dist", "index.js"));
const report = {
  schemaVersion: 1, status: "pass", executedAt: new Date().toISOString(), package: { name: packageJson.name, version: packageJson.version }, manifest: path.relative(root, manifestPath),
  normalizationPolicy: "Lossless semantic candidates are normalized into sorted JSON object keys; RDF array order, language alternatives, lexical values, nested resources, IIM/XMP repetitions, conflicts, and packet/block/offset provenance remain ordered evidence.",
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
  report.diagnostics.push(...diagnostics.map((diagnostic) => `${image.edition}: ${diagnostic}`));
  report.images.push({ edition: image.edition, fileName: image.fileName, sha256: hash, byteLength: bytes.byteLength, sourceUrl: image.url, standard: image.standard, expectedProperties: expectedProperties.length, presentProperties: presentProperties.length, candidateCount, normalizedSemanticHash, mismatches: { missingPropertyIds: missing, unexpectedPropertyIds: unexpected, normalizedSemanticHash: normalizedSemanticHash === image.normalizedSemanticHash ? null : { expected: image.normalizedSemanticHash, actual: normalizedSemanticHash } }, diagnostics });
}

if (report.images.length !== requiredEditions.length) throw new Error(`IPTC conformance examined ${report.images.length} of ${requiredEditions.length} required reference images.`);
fs.mkdirSync(reportDirectory, { recursive: true });
fs.writeFileSync(path.join(reportDirectory, "iptc-reference-conformance.json"), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join(reportDirectory, "iptc-reference-conformance.md"), markdown(report));
console.log(`IPTC official reference conformance passed for ${report.images.length} images; reports: ${path.relative(root, reportDirectory)}/iptc-reference-conformance.{json,md}`);
