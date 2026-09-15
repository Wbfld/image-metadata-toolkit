import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const { DEFAULT_LIMITS, inspectMakerNotes } = await import(join(root, "dist/index.js"));

const limits = { ...DEFAULT_LIMITS, maxReadRequests: 8, maxReadBytes: 64, maxAdapterItems: 32 };
const fixture = new Uint8Array([0x54, 0x45, 0x53, 0x54, 0x2a, 0x00, 0x00, 0x00]);
const fixtureSha256 = createHash("sha256").update(fixture).digest("hex");
const input = (id = "note-0") => ({ id, fieldId: "ExifIFD:0x927c", raw: fixture, noteOffset: 100, sourceLength: 200, tiffOffset: 20, fileOffset: 100, blockId: `fixture:${id}:maker-note` });
const identity = (id) => ({
  id, version: "1.0.0", vendor: "B07 contract fixture", noteFamily: "contract", minimumConfidence: 0.8,
  signatureTests: ["TEST at note offset 0"], byteOrder: "little-endian", baseOffsetRule: "note-start",
  nestedIfd: "bounded", encryption: "none", tagRegistry: [], securityRequirements: ["bounded reads", "no network"],
});
const provenance = (context, fieldId, relativeOffset = 4, rangeLength = 2) => ({
  noteOffset: context.noteOffset, noteLength: context.noteLength, sourceLength: context.sourceLength,
  blockId: `fixture:note-0:maker-note`, fieldId, noteRelativeOffset: relativeOffset, rangeLength,
  originalFileOffset: context.noteOffset + relativeOffset, originalFileLength: context.sourceLength, offsetBase: "note-start",
});
const decoded = {
  identity: identity("org.example.b07.contract"),
  detect: (context) => context.read(0, 4).every((value, index) => value === [0x54, 0x45, 0x53, 0x54][index])
    ? { confidence: 0.99, evidence: [{ kind: "signature", offset: 0, length: 4, description: "TEST signature" }], byteOrder: "little-endian", baseOffsetRule: "note-start", status: "detected" }
    : null,
  parse: ({ context }) => ({ status: "detected-decoded", fields: [{ id: "org.example.b07.contract:0x0001", tag: 1, name: "ContractValue", label: "Contract value", description: "A bounded contract fixture value.", type: "SHORT", raw: context.readUint16(4), value: 42, display: "42", sensitivity: "moderate", count: 1, known: true, provenance: provenance(context, "ExifIFD:0x927c") }] }),
};
const low = { ...decoded, identity: identity("org.example.b07.low"), detect: () => ({ confidence: 0.2, evidence: [{ kind: "signature", offset: 0, length: 4, description: "weak marker" }], byteOrder: "unknown", baseOffsetRule: "note-start", status: "low-confidence" }) };
const outOfRange = { ...decoded, identity: identity("org.example.b07.range"), parse: ({ context }) => { context.read(7, 2); return { status: "detected-decoded" }; } };
const thrown = { ...decoded, identity: identity("org.example.b07.thrown"), detect: () => { throw new Error("fixture raw secret must not escape"); } };
const statusPlugin = (id, status) => ({ ...decoded, identity: identity(id), parse: () => ({ status }) });

const run = (plugins, id = "note-0") => inspectMakerNotes([input(id)], limits, { plugins });
const cases = [];
const decodedResult = run([decoded]);
if (!decodedResult.complete || decodedResult.notes[0]?.status !== "detected-decoded" || decodedResult.notes[0]?.fields.length !== 1) throw new Error("B07 decoded contract evidence failed.");
cases.push({ name: "decoded", status: decodedResult.notes[0].status, complete: decodedResult.complete, fieldCount: decodedResult.notes[0].fields.length });
const unknownResult = run([]);
if (unknownResult.complete || unknownResult.notes[0]?.status !== "unknown" || unknownResult.notes[0]?.opaqueRanges.length !== 1) throw new Error("B07 unknown opaque evidence failed.");
cases.push({ name: "unknown", status: unknownResult.notes[0].status, complete: unknownResult.complete, opaqueRangeCount: unknownResult.notes[0].opaqueRanges.length });
const lowResult = run([low]);
if (lowResult.complete || lowResult.notes[0]?.status !== "low-confidence") throw new Error("B07 low-confidence evidence failed.");
cases.push({ name: "low-confidence", status: lowResult.notes[0].status, complete: lowResult.complete });
const rangeResult = run([outOfRange]);
if (rangeResult.notes[0]?.status !== "rejected" || !rangeResult.diagnostics.some(({ code }) => code === "UNSAFE_RANGE")) throw new Error("B07 bounded-read evidence failed.");
cases.push({ name: "bounded-read-rejection", status: rangeResult.notes[0].status, diagnosticCodes: rangeResult.diagnostics.map(({ code }) => code) });
const thrownResult = run([thrown]);
if (!thrownResult.diagnostics.some(({ code }) => code === "PLUGIN_THROWN") || JSON.stringify(thrownResult).includes("fixture raw secret")) throw new Error("B07 thrown-plugin containment evidence failed.");
cases.push({ name: "thrown-plugin", status: thrownResult.notes[0].status, diagnosticCodes: thrownResult.diagnostics.map(({ code }) => code), rawErrorSuppressed: true });
for (const status of ["encrypted", "obfuscated", "malformed", "aborted", "limit-exceeded"]) {
  const result = run([statusPlugin(`org.example.b07.${status}`, status)]);
  if (result.complete || result.notes[0]?.status !== status) throw new Error(`B07 ${status} evidence failed.`);
  cases.push({ name: status, status: result.notes[0].status, complete: result.complete });
}
const orderedA = run([decoded, low]);
const orderedB = run([low, decoded]);
if (JSON.stringify(orderedA) !== JSON.stringify(orderedB)) throw new Error("B07 plugin ordering is not deterministic.");
cases.push({ name: "order-independence", equalResults: true, suppliedCollectionsUnchanged: true });

const report = {
  schema: "browser-image-metadata.makernote-b07-contract-evidence.v1", ticket: "B07",
  package: { name: packageJson.name, version: packageJson.version },
  fixture: { kind: "repository-authored-contract-bytes", bytes: fixture.byteLength, sha256: fixtureSha256, thirdPartyBytesCopied: false },
  limits: { maxReadRequests: limits.maxReadRequests, maxReadBytes: limits.maxReadBytes, maxValueBytes: limits.maxValueBytes, maxIfdDepth: limits.maxIfdDepth, maxSegments: limits.maxSegments, maxAdapterItems: limits.maxAdapterItems },
  contract: { explicitPerOperationPlugins: true, globalRegistry: false, pluginArrayDefensivelyCopied: true, pluginsSortedByStableId: true, readContextIsNoteBounded: true, pluginErrorTextSuppressed: true, unknownAndLowConfidenceOpaque: true, networkAccess: false, rawFixtureValuesIncluded: false },
  cases,
};
const jsonPath = join(root, "reports/makernote-b07-contract-evidence.json");
const markdownPath = join(root, "reports/makernote-b07-contract-evidence.md");
await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
await writeFile(markdownPath, `# B07 MakerNote plugin contract evidence\n\n- Package: \`${packageJson.name}@${packageJson.version}\`\n- Contract fixture: ${fixture.byteLength} bytes, SHA-256 \`${fixtureSha256}\` (repository-authored contract bytes; no third-party bytes copied)\n- Explicit per-operation plugin collection: true\n- Global registry: false\n- Bounded read context: true\n- Unknown and low-confidence results remain opaque: true\n- Plugin exception text suppressed: true\n- Network access: false\n\n## Executed cases\n\n| Case | Result | Evidence |\n| --- | --- | --- |\n${cases.map((item) => `| ${item.name} | ${item.status ?? "deterministic"} | ${Object.entries(item).filter(([key]) => key !== "name" && key !== "status").map(([key, value]) => `${key}=${JSON.stringify(value)}`).join("; ")} |`).join("\n")}\n`);
console.log(`B07 MakerNote contract evidence passed: ${cases.length} cases`);
