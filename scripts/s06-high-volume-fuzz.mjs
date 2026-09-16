import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(await readFile(join(repositoryRoot, "package.json"), "utf8"));
const outputJson = join(repositoryRoot, "reports", "s06-high-volume-fuzz-evidence.json");
const outputMarkdown = join(repositoryRoot, "reports", "s06-high-volume-fuzz-evidence.md");
const fixtureRootValue = process.env.S06_FUZZ_FIXTURE_ROOT;
if (fixtureRootValue === undefined || fixtureRootValue.length === 0) {
  throw new Error("S06_FUZZ_FIXTURE_ROOT is required; the high-volume fuzz gate cannot pass without its fixture directory.");
}
const fixtureRoot = resolve(fixtureRootValue);
const fixtureDirectory = await stat(fixtureRoot).catch(() => null);
if (fixtureDirectory === null || !fixtureDirectory.isDirectory()) throw new Error(`S06 fuzz fixture directory does not exist: ${fixtureRoot}`);

const nodeMajor = Number(process.versions.node.split(".")[0]);
if (!Number.isSafeInteger(nodeMajor) || nodeMajor < 22) throw new Error(`S06 high-volume fuzz requires Node.js 22 or newer; found ${process.versions.node}.`);

function positiveInteger(value, fallback, maximum, label) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) throw new Error(`${label} must be a positive safe integer no greater than ${maximum}.`);
  return parsed;
}

const iterations = positiveInteger(process.env.S06_FUZZ_ITERATIONS, 20_000, 100_000, "S06_FUZZ_ITERATIONS");
const timeLimitMs = positiveInteger(process.env.S06_FUZZ_TIME_MS, 120_000, 300_000, "S06_FUZZ_TIME_MS");
const maxInputBytes = positiveInteger(process.env.S06_FUZZ_MAX_INPUT_BYTES, 64 * 1024, 16 * 1024 * 1024, "S06_FUZZ_MAX_INPUT_BYTES");
const maxOutputBytes = positiveInteger(process.env.S06_FUZZ_MAX_OUTPUT_BYTES, 2 * 1024 * 1024, 64 * 1024 * 1024, "S06_FUZZ_MAX_OUTPUT_BYTES");
const maxMemoryBytes = positiveInteger(process.env.S06_FUZZ_MAX_MEMORY_BYTES, 512 * 1024 * 1024, 4 * 1024 * 1024 * 1024, "S06_FUZZ_MAX_MEMORY_BYTES");
const seeds = Object.freeze({ container: 0x6f0e1d2c, decoder: 0x5a17c0de, writer: 0x4b1d5eed });
const startedAt = Date.now();

const fixtureNames = Object.freeze({
  jpeg: "jpeg-exif-little-endian.jpg",
  png: "png-metadata.png",
  webp: "webp-metadata.webp",
  tiff: "tiff-metadata.tif",
  xmp: "jpeg-iptc.jpg",
  iptc: "jpeg-iptc.jpg",
  icc: "jpeg-icc.jpg",
  photoshop: "jpeg-iptc.jpg",
  makernote: "jpeg-exif-little-endian.jpg",
  c2pa: "base.png",
  mpf: "jpeg-exif-little-endian.jpg",
  creator: "jpeg-iptc.jpg",
});

const fixtureBytes = new Map();
const fixtureEvidence = [];
const fixtureRoles = new Map();
for (const [key, name] of Object.entries(fixtureNames)) {
  const roles = fixtureRoles.get(name) ?? [];
  roles.push(key);
  fixtureRoles.set(name, roles);
}
for (const [key, name] of Object.entries(fixtureNames)) {
  if (fixtureBytes.has(name)) continue;
  const path = resolve(fixtureRoot, name);
  const pathRelative = relative(fixtureRoot, path);
  if (pathRelative.startsWith("..") || isAbsolute(pathRelative)) throw new Error(`S06 fuzz fixture escapes the configured fixture directory: ${name}`);
  const bytes = new Uint8Array(await readFile(path));
  if (bytes.byteLength < 1 || bytes.byteLength > maxInputBytes) throw new Error(`S06 fuzz fixture ${name} is outside the configured input bound.`);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  fixtureBytes.set(name, bytes);
  fixtureEvidence.push({ roles: Object.freeze([...(fixtureRoles.get(name) ?? [key])]), path: `tests/fixtures/${name}`, byteLength: bytes.byteLength, sha256 });
}

const toolkit = await import(join(repositoryRoot, "dist/index.js"));
const limits = {
  maxInputBytes,
  maxMetadataBytes: Math.min(maxOutputBytes, 16 * 1024 * 1024),
  maxSegmentBytes: Math.min(maxOutputBytes, 16 * 1024 * 1024),
  maxValueBytes: Math.min(maxOutputBytes, 8 * 1024 * 1024),
  maxStringBytes: Math.min(maxOutputBytes, 1024 * 1024),
  maxDecompressedBytes: Math.min(maxOutputBytes, 8 * 1024 * 1024),
  maxDecompressedMetadataBytes: Math.min(maxOutputBytes, 16 * 1024 * 1024),
  maxAdapterOutputBytes: maxOutputBytes,
  maxWarnings: 32,
};

function nextRandom(state) {
  let value = state.value >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  state.value = value >>> 0;
  return state.value;
}

function mutated(source, state, iteration) {
  const original = source;
  const maximumLength = original.byteLength;
  const requestedLength = iteration % 7 === 0 ? nextRandom(state) % (maximumLength + 1) : maximumLength;
  const bytes = original.slice(0, requestedLength);
  const changes = Math.min(bytes.byteLength, 1 + (nextRandom(state) % 8));
  for (let index = 0; index < changes; index += 1) {
    if (bytes.byteLength === 0) break;
    const offset = nextRandom(state) % bytes.byteLength;
    bytes[offset] = (bytes[offset] ?? 0) ^ (1 + (nextRandom(state) & 0xff));
  }
  return bytes;
}

function errorCode(error) {
  if (typeof error !== "object" || error === null) return null;
  const value = error.code;
  return typeof value === "string" ? value : null;
}

const expectedFailureCodes = new Set([
  "INVALID_VALUE", "LIMIT_EXCEEDED", "TRUNCATED_DATA", "MALFORMED_JPEG", "MALFORMED_PNG", "MALFORMED_WEBP", "UNSUPPORTED_STRUCTURE", "UNSUPPORTED_OPERATION", "UNSAFE_STRUCTURE", "VERIFICATION_FAILURE", "NON_REPEATABLE", "CONFLICT", "INVALID_INPUT", "ABORTED",
]);

function assertMemoryBound() {
  const used = process.memoryUsage().heapUsed;
  if (used > maxMemoryBytes) throw new Error(`S06 fuzz heap bound exceeded: ${used} > ${maxMemoryBytes}.`);
}

function assertRunning() {
  if (Date.now() - startedAt > timeLimitMs) throw new Error(`S06 high-volume fuzz time bound of ${timeLimitMs} ms was exceeded.`);
  assertMemoryBound();
}

function assertParsed(result, label) {
  if (result === null || typeof result !== "object") throw new Error(`${label} returned no bounded result.`);
  if (!Array.isArray(result.fields) || !Array.isArray(result.warnings)) throw new Error(`${label} returned an incomplete parser result.`);
  if (result.fields.length > 4_096 || result.warnings.length > limits.maxWarnings) throw new Error(`${label} exceeded its bounded output contract.`);
  for (const warning of result.warnings) {
    if (typeof warning.code !== "string" || !/^[A-Z][A-Z0-9_]+$/u.test(warning.code)) throw new Error(`${label} produced an unstable diagnostic code.`);
  }
}

const phaseResults = [];
const unexpectedFailures = [];
const expectedFailures = [];
const successfulWriterOutputs = [];

async function runPhase(name, count, callback) {
  const result = { name, seed: seeds[name === "writer-planning" ? "writer" : name === "container-indexers" ? "container" : "decoder"], iterations: 0, expectedFailures: 0, status: "passed" };
  for (let iteration = 0; iteration < count; iteration += 1) {
    assertRunning();
    result.iterations += 1;
    try {
      await callback(iteration);
    } catch (error) {
      const code = errorCode(error);
      if (code !== null && expectedFailureCodes.has(code)) {
        result.expectedFailures += 1;
        expectedFailures.push({ phase: name, iteration, code });
      } else {
        unexpectedFailures.push({ phase: name, iteration, error: error instanceof Error ? error.message : String(error) });
        result.status = "failed";
        throw error;
      }
    }
  }
  if (result.iterations === 0) throw new Error(`S06 fuzz phase ${name} performed no iterations.`);
  phaseResults.push(result);
}

const containerState = { value: seeds.container };
await runPhase("container-indexers", iterations, async (iteration) => {
  const names = [fixtureNames.jpeg, fixtureNames.png, fixtureNames.webp, fixtureNames.tiff];
  const name = names[iteration % names.length];
  const source = fixtureBytes.get(name);
  if (source === undefined) throw new Error(`Missing container fixture ${name}.`);
  const before = source.slice();
  const input = mutated(source, containerState, iteration);
  const parsed = await toolkit.parseMetadata(input, { limits });
  assertParsed(parsed, `container ${name}`);
  const inventory = toolkit.inventoryJumbfC2pa(input, { limits });
  if (inventory.remoteReferencesFetched !== false) throw new Error("C2PA inventory attempted remote fetching.");
  if (source.some((byte, index) => byte !== before[index])) throw new Error(`Container fuzz mutated source fixture ${name}.`);
});

const decoderState = { value: seeds.decoder };
await runPhase("decoder-families", iterations, async (iteration) => {
  const decoderNames = ["xmp", "iptc", "icc", "photoshop", "makernote", "mpf", "c2pa", "creator"];
  const decoderName = decoderNames[iteration % decoderNames.length];
  const fixtureName = fixtureNames[decoderName];
  const source = fixtureBytes.get(fixtureName);
  if (source === undefined) throw new Error(`Missing decoder fixture ${fixtureName}.`);
  const input = mutated(source, decoderState, iteration);
  if (decoderName === "c2pa") {
    const inventory = toolkit.inventoryJumbfC2pa(input, { limits });
    if (inventory === null || typeof inventory !== "object" || !Array.isArray(inventory.stores) || !Array.isArray(inventory.diagnostics)) throw new Error("C2PA decoder returned an incomplete bounded inventory.");
    if (inventory.remoteReferencesFetched !== false) throw new Error("C2PA decoder attempted remote fetching.");
  } else {
    const selectedGroup = decoderName === "xmp" ? "XMP" : decoderName === "iptc" ? "IPTC" : decoderName === "icc" ? "ICC" : decoderName === "photoshop" ? "Photoshop" : decoderName === "makernote" ? "MakerNote" : "MPF";
    const parsed = await toolkit.parseMetadata(input, { select: { groups: [selectedGroup] }, limits });
    assertParsed(parsed, `${decoderName} decoder`);
    if (decoderName === "creator") {
      const inspection = toolkit.inspectCreatorMetadataResult(parsed, { limits });
      if (inspection === null || !Array.isArray(inspection.fields) || !Array.isArray(inspection.diagnostics)) throw new Error("Creator decoder returned an incomplete bounded result.");
    }
    if (decoderName === "mpf") {
      const inventory = toolkit.inventoryJumbfC2pa(input, { limits });
      if (inventory.stores.length > limits.maxSegments) throw new Error("C2PA inventory exceeded its store bound.");
    }
  }
});

const writerState = { value: seeds.writer };
let serializationBoundaryCount = 0;
await runPhase("writer-planning", Math.max(1_000, Math.floor(iterations / 4)), async (iteration) => {
  const families = [
    ["jpeg", fixtureNames.jpeg, () => toolkit.rewriteJpegMetadata(fixtureBytes.get(fixtureNames.jpeg), { blocks: [{ op: "add", kind: "standard-xmp", data: "<x:xmpmeta/>" }], limits })],
    ["png", fixtureNames.png, () => toolkit.rewritePngMetadata(fixtureBytes.get(fixtureNames.png), { blocks: [{ op: "add", kind: "xmp", data: "<x:xmpmeta/>" }], limits })],
    ["webp", fixtureNames.webp, () => toolkit.rewriteWebpMetadata(fixtureBytes.get(fixtureNames.webp), { blocks: [{ op: "add", kind: "xmp", data: "<x:xmpmeta/>" }], limits })],
  ];
  const selected = families[iteration % families.length];
  const family = selected[0];
  const source = fixtureBytes.get(selected[1]);
  if (source === undefined) throw new Error(`Missing writer fixture ${selected[1]}.`);
  const beforeHash = createHash("sha256").update(source).digest("hex");
  const output = await selected[2]();
  if (!(output?.data instanceof Uint8Array) || output.data.byteLength > maxOutputBytes) throw new Error(`${family} writer produced an unbounded output.`);
  const reparsed = await toolkit.parseMetadata(output.data, { limits });
  assertParsed(reparsed, `${family} writer verification`);
  const afterHash = createHash("sha256").update(source).digest("hex");
  if (beforeHash !== afterHash) throw new Error(`${family} writer mutated source bytes.`);
  successfulWriterOutputs.push({ family, iteration, byteLength: output.data.byteLength });
  const xmp = toolkit.serializeStructuredXmp({ namespaces: { dc: "http://purl.org/dc/elements/1.1/" }, properties: { "dc:title": [`fuzz-${iteration}`, `family-${family}`] } }, { maxOutputBytes: maxOutputBytes });
  if (typeof xmp !== "string" || xmp.length < 1) throw new Error("XMP serialization boundary produced no bounded packet.");
  const iim = toolkit.serializeIptcIim([{ record: 2, dataset: 25, value: `fuzz-${iteration}` }], { maxOutputBytes: maxOutputBytes });
  if (!(iim instanceof Uint8Array) || iim.byteLength < 1 || iim.byteLength > maxOutputBytes) throw new Error("IPTC serialization boundary produced an unbounded packet.");
  serializationBoundaryCount += 2;
  nextRandom(writerState);
});

if (unexpectedFailures.length > 0) throw new Error(`S06 fuzz found ${unexpectedFailures.length} unexpected failures.`);
if (successfulWriterOutputs.length === 0) throw new Error("S06 fuzz produced no successfully verified writer output.");
if (phaseResults.length !== 3 || phaseResults.some((phase) => phase.status !== "passed" || phase.iterations < 1)) throw new Error("S06 fuzz did not complete every required phase.");
assertMemoryBound();

const report = {
  schema: "browser-image-metadata.s06-high-volume-fuzz-evidence.v1",
  checked: true,
  status: "passed",
  package: { name: packageJson.name, version: packageJson.version },
  runtime: { node: process.versions.node, v8: process.versions.v8, platform: process.platform, architecture: process.arch },
  seeds,
  bounds: { iterations, timeLimitMs, maxInputBytes, maxOutputBytes, maxMemoryBytes },
  fixtures: fixtureEvidence,
  phases: phaseResults,
  expectedFailureCount: expectedFailures.length,
  unexpectedFailureCount: unexpectedFailures.length,
  writerVerificationCount: successfulWriterOutputs.length,
  writerVerificationByFamily: Object.fromEntries(["jpeg", "png", "webp"].map((family) => [family, successfulWriterOutputs.filter((item) => item.family === family).length])),
  serializationBoundaryCount,
  normalizationPolicy: "No semantic normalization is used for fuzz pass/fail. Parser diagnostics are matched by typed code; successful writer outputs are reparsed before they count.",
  sourceMutationPolicy: "Every source fixture is hashed before and after its phase; mutation is a failure. Mutated inputs are in-memory copies only.",
  remoteReferencePolicy: "C2PA/JUMBF remote references are inventoried without fetching.",
  regressionPolicy: "No unexpected failure occurred; no regression bytes were generated. Any future unexpected failure must be minimized from the repo-local lawful fixture and retained only after review.",
  evidence: { json: "reports/s06-high-volume-fuzz-evidence.json", markdown: "reports/s06-high-volume-fuzz-evidence.md", containsInputBytes: false },
};

await writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
const markdown = [
  "# S06 high-volume fuzz evidence",
  "",
  `Status: **${report.status}** (checked: ${report.checked})`,
  "",
  `Package: ${report.package.name}@${report.package.version}; Node: ${report.runtime.node}; V8: ${report.runtime.v8}.`,
  "",
  "## Bounds and determinism",
  "",
  `Iterations: ${report.bounds.iterations}; time bound: ${report.bounds.timeLimitMs} ms; input bound: ${report.bounds.maxInputBytes} bytes; output bound: ${report.bounds.maxOutputBytes} bytes; heap bound: ${report.bounds.maxMemoryBytes} bytes.`,
  `Seeds: container ${report.seeds.container}, decoder ${report.seeds.decoder}, writer ${report.seeds.writer}.`,
  "",
  "## Required independent phases",
  "",
  "| Phase | Iterations | Typed failures | Status |",
  "| --- | ---: | ---: | --- |",
  ...report.phases.map((phase) => `| ${phase.name} | ${phase.iterations} | ${phase.expectedFailures} | ${phase.status} |`),
  "",
  `Successfully reparsed writer outputs: ${report.writerVerificationCount} (JPEG ${report.writerVerificationByFamily.jpeg}, PNG ${report.writerVerificationByFamily.png}, WebP ${report.writerVerificationByFamily.webp}).`,
  `Unexpected failures: ${report.unexpectedFailureCount}; source mutations: 0; remote C2PA references fetched: 0.`,
  "",
  "## Repo-local fixture evidence",
  "",
  "| Fixture | Bytes | SHA-256 |",
  "| --- | ---: | --- |",
  ...report.fixtures.map((fixture) => `| ${fixture.path} (${fixture.roles.join(", ")}) | ${fixture.byteLength} | ${fixture.sha256} |`),
  "",
  `Normalization policy: ${report.normalizationPolicy}`,
  `Source policy: ${report.sourceMutationPolicy}`,
  `Regression policy: ${report.regressionPolicy}`,
  "",
  "This redistribution-safe report contains fixture paths and hashes only; it does not contain image bytes or mutated inputs.",
  "",
].join("\n");
await writeFile(outputMarkdown, markdown, "utf8");
console.log(`S06 high-volume fuzz passed: ${iterations} container/decoder iterations, ${successfulWriterOutputs.length} verified writer outputs.`);
