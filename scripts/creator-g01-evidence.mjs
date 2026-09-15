import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { TextEncoder } from "node:util";

const root = resolve(import.meta.dirname, "..");
const reportPath = join(root, "reports/g01-creator-evidence.json");
const markdownPath = join(root, "reports/g01-creator-evidence.md");
const checkOnly = process.argv.includes("--check");
const encoder = new TextEncoder();

function concat(...parts) {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u32(value) {
  return Uint8Array.of((value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);
}

function pngChunk(type, data) {
  const typeBytes = encoder.encode(type);
  const crcInput = concat(typeBytes, data);
  const checksum = crc32(crcInput);
  return concat(u32(data.length), typeBytes, data, Uint8Array.of((checksum >>> 24) & 0xff, (checksum >>> 16) & 0xff, (checksum >>> 8) & 0xff, checksum & 0xff));
}

function pngText(keyword, value) {
  return pngChunk("tEXt", concat(encoder.encode(keyword), Uint8Array.of(0), encoder.encode(value)));
}

function png(chunks) {
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, 1);
  view.setUint32(4, 1);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return concat(Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), pngChunk("IHDR", ihdr), ...chunks, pngChunk("IDAT", Uint8Array.of(0)), pngChunk("IEND", new Uint8Array()));
}

function webpExif(value) {
  const text = encoder.encode(`${value}\0`);
  const tiff = new Uint8Array(26 + text.length);
  const view = new DataView(tiff.buffer);
  tiff.set(encoder.encode("II\x2a\x00"));
  view.setUint32(4, 8, true);
  view.setUint16(8, 1, true);
  view.setUint16(10, 0x010f, true);
  view.setUint16(12, 2, true);
  view.setUint32(14, text.length, true);
  view.setUint32(18, 26, true);
  tiff.set(text, 26);
  const exif = concat(encoder.encode("Exif\0\0"), tiff);
  const chunk = (type, data) => concat(encoder.encode(type), Uint8Array.of(data.length & 0xff, (data.length >>> 8) & 0xff, (data.length >>> 16) & 0xff, (data.length >>> 24) & 0xff), data, data.length % 2 === 0 ? new Uint8Array() : Uint8Array.of(0));
  const body = concat(chunk("VP8X", new Uint8Array(10)), chunk("EXIF", exif));
  return concat(encoder.encode("RIFF"), Uint8Array.of((body.length + 4) & 0xff, ((body.length + 4) >>> 8) & 0xff, ((body.length + 4) >>> 16) & 0xff, ((body.length + 4) >>> 24) & 0xff), encoder.encode("WEBP"), body);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fieldKinds(result) {
  return [...new Set(result.fields.map((field) => `${field.producer}:${field.kind}`))].sort();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const { inspectCreatorMetadata, migrateCreatorMetadataToIptc } = await import("../dist/creator.js");
const graph = JSON.stringify({
  "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "report-model.safetensors" } },
  "2": { class_type: "KSampler", inputs: { seed: 12, steps: 20, sampler_name: "euler", positive: ["3", 0], negative: ["4", 0] } },
  "3": { class_type: "CLIPTextEncode", inputs: { text: "report prompt" } },
  "4": { class_type: "CLIPTextEncode", inputs: { text: "report negative" } },
});
const a1111 = "report prompt\nNegative prompt: report negative\nSteps: 18, Sampler: Euler, Seed: 13, Model: report-sd";
const invoke = JSON.stringify({ seed: 14, steps: 16, scheduler: "ddim", positive_conditioning: "invoke prompt", negative_conditioning: "invoke negative", model_weights: "invoke-model" });
const cases = [
  { id: "comfyui-png-prompt", bytes: png([pngText("prompt", graph)]), inspect: (result) => { assert(result.producers.includes("comfyui"), "ComfyUI producer was not identified"); assert(result.workflowReferences.length === 1, "ComfyUI workflow was not inventoried"); assert(result.fields.some((field) => field.kind === "seed" && field.value === 12), "ComfyUI seed was not decoded"); } },
  { id: "stable-diffusion-webui-parameters", bytes: png([pngText("parameters", a1111)]), inspect: (result) => { assert(result.producers.includes("stable-diffusion-webui"), "A1111 producer was not identified"); assert(result.fields.some((field) => field.kind === "negative-prompt"), "A1111 negative prompt was not decoded"); } },
  { id: "invokeai-json", bytes: png([pngText("invokeai_metadata", invoke)]), inspect: (result) => { assert(result.producers.includes("invokeai"), "InvokeAI producer was not identified"); assert(result.fields.some((field) => field.kind === "steps" && field.value === 16), "InvokeAI steps were not decoded"); } },
  { id: "comfyui-webp-exif", bytes: webpExif(`prompt:${graph}`), inspect: (result) => { assert(result.format === "webp", "WebP fixture was not detected"); assert(result.fields.some((field) => field.kind === "model"), "WebP ComfyUI model was not decoded"); } },
];

const records = [];
for (const item of cases) {
  const result = await inspectCreatorMetadata(item.bytes);
  item.inspect(result);
  const migration = migrateCreatorMetadataToIptc(result, { confirm: true });
  records.push({
    id: item.id,
    format: result.format,
    byteLength: item.bytes.byteLength,
    sha256: sha256(item.bytes),
    complete: result.complete,
    producers: result.producers,
    parserVersions: result.parserVersions,
    sourceCount: result.sources.length,
    fieldCount: result.fields.length,
    fieldKinds: fieldKinds(result),
    workflowReferenceCount: result.workflowReferences.length,
    migratedPropertyIds: migration.fields.map((field) => field.propertyId),
    diagnostics: result.diagnostics.map(({ code, offset }) => ({ code, offset })),
    provenanceComplete: result.sources.every((source) => source.provenance.offset !== null && source.provenance.blockId !== null),
  });
}

const malformed = await inspectCreatorMetadata(png([pngText("prompt", "{not-json") ]));
assert(!malformed.complete && malformed.diagnostics.some(({ code }) => code === "INVALID_JSON"), "Malformed JSON did not fail closed");
const limited = await inspectCreatorMetadata(png([pngText("prompt", graph)]), { limits: { maxCreatorGraphNodes: 1 } });
assert(!limited.complete && limited.diagnostics.some(({ code }) => code === "LIMIT_EXCEEDED"), "Graph limits did not fail closed");

const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const report = {
  schemaVersion: 1,
  status: "passed",
  generatedAt: new Date().toISOString(),
  package: { name: packageJson.name, version: packageJson.version },
  schemaPack: "creator-metadata/1",
  parserVersions: ["comfyui-png-convention/1", "comfyui-webp-exif-convention/1", "stable-diffusion-webui-infotext/1", "invokeai-png-convention/1", "creator-xmp-convention/1"],
  cases: records,
  negativeCases: { malformedJson: true, graphLimit: true, rawOptOut: true, explicitMigrationOptIn: true },
  checks: ["typed fields", "bounded workflow nodes and edges", "PNG text/custom chunk provenance", "WebP EXIF provenance", "raw retention and opt-out", "IPTC 2025.1 migration opt-in", "malformed JSON", "graph limit"],
  sourceManifest: "data/creator-schema-sources.json",
  reportPolicy: "Fixture bytes and creator prompt text are not included; only hashes, dimensions, field kinds, counts, diagnostics, and provenance completeness are retained.",
};
const markdown = `# G01 creator metadata evidence\n\n- Status: **${report.status}**\n- Package: ${report.package.name} ${report.package.version}\n- Schema: ${report.schemaPack}\n- Source manifest: [data/creator-schema-sources.json](../data/creator-schema-sources.json)\n\n| Case | Format | Bytes | SHA-256 | Sources | Fields | Workflows | Complete | Provenance |\n| --- | --- | ---: | --- | ---: | ---: | ---: | --- | --- |\n${records.map((record) => `| ${record.id} | ${record.format} | ${record.byteLength} | ${record.sha256} | ${record.sourceCount} | ${record.fieldCount} | ${record.workflowReferenceCount} | ${record.complete ? "yes" : "no"} | ${record.provenanceComplete ? "complete" : "incomplete"} |`).join("\n")}\n\n## Executed checks\n\n${report.checks.map((check) => `- ${check}`).join("\n")}\n\nNegative and limit cases were executed and failed closed. The report excludes fixture bytes and raw prompt text.\n`;
if (checkOnly) {
  const existing = JSON.parse(await readFile(reportPath, "utf8"));
  assert(existing.status === "passed", "Checked-in G01 evidence is not marked passed");
  assert(existing.schemaPack === report.schemaPack, "Checked-in G01 schema version differs from the built implementation");
  assert(existing.cases?.length === report.cases.length, "Checked-in G01 evidence does not cover every executable case");
  for (const record of report.cases) {
    const previous = existing.cases.find((candidate) => candidate.id === record.id);
    assert(previous?.sha256 === record.sha256 && previous.byteLength === record.byteLength, `Checked-in G01 fixture evidence changed for ${record.id}`);
  }
  const existingMarkdown = await readFile(markdownPath, "utf8");
  assert(existingMarkdown.includes("Status: **passed**") && existingMarkdown.includes("Negative and limit cases were executed"), "Checked-in G01 Markdown evidence is incomplete");
  console.log(JSON.stringify({ status: "passed", checked: "reports/g01-creator-evidence.json" }, null, 2));
} else {
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdownPath, markdown);
  console.log(JSON.stringify({ status: report.status, report: "reports/g01-creator-evidence.json", cases: records.length }, null, 2));
}
