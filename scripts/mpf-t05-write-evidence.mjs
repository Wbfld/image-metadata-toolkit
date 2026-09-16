import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { exiftool } from "exiftool-vendored";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "data", "mpf", "reference-corpus.json");
const packagePath = join(root, "package.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const packageManifest = JSON.parse(await readFile(packagePath, "utf8"));
const { parseMetadata, rewriteJpegMetadata } = await import(join(root, "dist", "index.js"));

function argument(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}

function requiredArgument(name, value) {
  if (value === undefined || value.length === 0) throw new Error(`${name} is required; T05 write evidence must execute against a real temporary corpus.`);
  return value;
}

const corpusDirectory = resolve(requiredArgument("--corpus", argument("--corpus") ?? process.env.T05_CORPUS_DIR));
const requestedFixture = argument("--fixture") ?? process.env.T05_WRITE_FIXTURE ?? "pillow-frame-size.mpo";
const reportDirectory = resolve(root, argument("--report-dir") ?? process.env.T05_WRITE_REPORT_DIR ?? "reports");

async function requireDirectory(path, label) {
  let details;
  try {
    details = await stat(path);
  } catch (error) {
    throw new Error(`${label} directory is missing: ${path}`, { cause: error });
  }
  if (!details.isDirectory()) throw new Error(`${label} path is not a directory: ${path}`);
}

await requireDirectory(corpusDirectory, "T05 write corpus");

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

const fixture = manifest.fixtures.find((candidate) => candidate.fileName === requestedFixture);
assert(fixture !== undefined, `T05 write fixture ${requestedFixture} is not listed in the pinned manifest.`);
assert(fixture.kind === "cipa-mpf", `T05 write evidence requires a complete CIPA MPF fixture; ${requestedFixture} is ${fixture.kind}.`);
const fixturePath = safeChild(corpusDirectory, fixture.fileName);
const input = new Uint8Array(await readFile(fixturePath));
const inputSha256 = sha256(input);
assert(inputSha256 === fixture.sha256, `${fixture.fileName} fixture hash mismatch: expected ${fixture.sha256}, received ${inputSha256}`);

const selection = { groups: ["Dimensions", "MPF", "XMP"] };
const before = await parseMetadata(input, { select: selection });
assert(before.format === "jpeg", `${fixture.fileName} was detected as ${before.format}, not JPEG.`);
assert(before.mpf?.complete === true, `${fixture.fileName} MPF inventory is incomplete before writing.`);
assert(before.mpf.images.length >= 2, `${fixture.fileName} must contain a primary and at least one secondary image.`);
assert(before.mpf.images.every((image) => image.status === "decoded" && image.absoluteOffset !== null && image.rangeLength === image.size), `${fixture.fileName} contains an unresolved protected image range.`);

const sourceSnapshot = input.slice();
const rewritten = rewriteJpegMetadata(input, {
  blocks: [{ op: "add", kind: "standard-xmp", data: "T05 write evidence metadata" }],
  mpf: { mode: "preserve" },
});
assert(inputSha256 === sha256(input), "The MPF writer modified caller-owned source bytes.");
assert(rewritten.mpf !== undefined && rewritten.mpf.relationshipsVerified === true, "The MPF writer did not return relationship verification evidence.");
if (rewritten.mpf === undefined) throw new Error("The MPF writer did not return typed MPF evidence.");
assert(rewritten.mpf.images.length === before.mpf.images.length, "The MPF writer changed the image count.");
assert(rewritten.preservation?.successful === true, "The MPF writer did not pass the independent preservation verifier.");
const output = rewritten.data;
const outputSha256 = sha256(output);
assert(!sourceSnapshot.every((value, index) => output[index] === value) || output.length !== sourceSnapshot.length, "The evidence edit did not produce a metadata change.");

const after = await parseMetadata(output, { select: selection });
assert(after.format === "jpeg", "The rewritten output did not reparse as JPEG.");
assert(after.mpf?.complete === true, "The rewritten output MPF inventory is incomplete.");
assert(after.mpf.images.length === before.mpf.images.length, "The rewritten output changed the MPF image count.");
assert(after.mpf.images.every((image) => image.status === "decoded" && image.absoluteOffset !== null && image.rangeLength === image.size), "The rewritten output contains an unresolved MPF image range.");

const imageEvidence = rewritten.mpf.images.map((evidence, index) => {
  const beforeImage = before.mpf.images[index];
  const afterImage = after.mpf.images[index];
  assert(beforeImage !== undefined && afterImage !== undefined, `MPF image ${index + 1} disappeared during the write.`);
  assert(evidence.encodedPayloads.every((payload) => payload.status === "matched"), `MPF image ${index + 1} has an unverified protected payload.`);
  assert(afterImage.absoluteOffset === evidence.outputOffset && afterImage.size === evidence.outputSize, `MPF image ${index + 1} output range disagrees with writer evidence.`);
  for (const payload of evidence.encodedPayloads) {
    const beforeBytes = input.subarray(payload.before.offset, payload.before.offset + payload.before.length);
    const afterBytes = output.subarray(payload.after.offset, payload.after.offset + payload.after.length);
    assert(sha256(beforeBytes) === payload.before.sha256, `MPF image ${index + 1} before-payload hash evidence is incorrect.`);
    assert(sha256(afterBytes) === payload.after.sha256, `MPF image ${index + 1} after-payload hash evidence is incorrect.`);
    assert(payload.before.sha256 === payload.after.sha256, `MPF image ${index + 1} encoded payload changed during the metadata-only write.`);
  }
  if (index > 0) {
    assert(beforeImage.absoluteOffset !== null && afterImage.absoluteOffset !== null, `MPF secondary image ${index + 1} does not have a resolved range.`);
    const beforeBytes = input.subarray(beforeImage.absoluteOffset, beforeImage.absoluteOffset + beforeImage.size);
    const afterBytes = output.subarray(afterImage.absoluteOffset, afterImage.absoluteOffset + afterImage.size);
    assert(sha256(beforeBytes) === sha256(afterBytes), `MPF secondary image ${index + 1} encoded JPEG bytes changed.`);
  }
  return {
    id: evidence.id,
    index: evidence.index,
    imageType: evidence.imageType,
    input: { offset: evidence.inputOffset, size: evidence.inputSize },
    output: { offset: evidence.outputOffset, size: evidence.outputSize },
    protectedEncodedPayloadCount: evidence.encodedPayloads.length,
    protectedEncodedPayloads: evidence.encodedPayloads.map((payload) => ({
      id: payload.id,
      before: payload.before,
      after: payload.after,
      status: payload.status,
    })),
    secondaryWholeImageSha256: index === 0 ? null : sha256(output.subarray(afterImage.absoluteOffset, afterImage.absoluteOffset + afterImage.size)),
  };
});

const temporaryOutputDirectory = await mkdtemp(join(tmpdir(), "t05-mpf-write-evidence-"));
let oracle;
let oracleVersion;
try {
  const outputPath = join(temporaryOutputDirectory, "edited.mpo");
  await writeFile(outputPath, output);
  oracleVersion = await exiftool.version();
  assert(oracleVersion === "13.59", `The pinned ExifTool oracle is ${oracleVersion}; expected 13.59.`);
  oracle = await exiftool.read(outputPath, { readArgs: ["-ee", "-G1", "-n"] });
  const imageCount = oracle["MPF0:NumberOfImages"];
  assert(Number(imageCount) === before.mpf.images.length, `ExifTool reported ${String(imageCount)} MPF images; expected ${before.mpf.images.length}.`);
} finally {
  await rm(temporaryOutputDirectory, { recursive: true, force: true });
}
await exiftool.end();

const manifestHash = sha256Json(manifest);
const report = {
  schema: "browser-image-metadata.mpf-t05-write-evidence.v1",
  status: "pass",
  generatedAt: new Date().toISOString(),
  package: { name: packageManifest.name, version: packageManifest.version },
  manifest: { path: "data/mpf/reference-corpus.json", sha256: manifestHash, schema: manifest.schema },
  fixture: {
    path: `temporary-t05-corpus/${fixture.fileName}`,
    kind: fixture.kind,
    repository: fixture.repository,
    commit: fixture.commit,
    license: fixture.license,
    byteLength: input.byteLength,
    sha256: inputSha256,
  },
  edit: {
    operation: "add standard XMP metadata before the primary JPEG frame",
    policy: { mode: "preserve" },
    inputByteLength: input.byteLength,
    outputByteLength: output.byteLength,
    inputSha256,
    outputSha256,
    inputUnchangedAfterPlanning: sha256(input) === inputSha256,
    packageReparse: { format: after.format, mpfComplete: after.mpf.complete, imageCount: after.mpf.images.length, relationshipsVerified: rewritten.mpf.relationshipsVerified },
    preservation: { successful: rewritten.preservation.successful, diagnostics: rewritten.preservation.diagnostics },
    byteChanges: rewritten.byteChanges,
    images: imageEvidence,
    diagnostics: rewritten.mpf.diagnostics,
  },
  independentOracle: {
    package: "exiftool-vendored",
    packageVersion: packageManifest.devDependencies?.["exiftool-vendored"] ?? null,
    implementationVersion: oracleVersion,
    license: "ExifTool: Perl Artistic License or GPL-1.0-or-later; exiftool-vendored.js: MIT",
    provenance: ["https://exiftool.org/", "https://github.com/photostructure/exiftool-vendored.js"],
    role: "secondary metadata output oracle only",
    comparison: { field: "MPF0:NumberOfImages", expected: before.mpf.images.length, observed: Number(oracle["MPF0:NumberOfImages"]), status: "matched" },
  },
  independentDecoderEvidence: {
    implementation: "browser-native JPEG decoders exercised by tests/browser/metadata.spec.ts",
    policy: "The retained Playwright test decodes every edited primary and secondary JPEG in Chromium and Firefox; browser engine launcher failures are reported separately and never count as successful decoding evidence.",
    retainedTest: "tests/browser/metadata.spec.ts",
  },
  normalizationPolicy: "MPF stored offsets remain distinct from resolved absolute offsets. TIFF numeric fields are compared as unsigned integers in the source byte order. Protected JPEG scan ranges are compared byte-for-byte and by SHA-256. Secondary complete JPEG ranges are additionally compared by SHA-256. No image bytes are retained in this report.",
  limitsPolicy: "The writer and parser apply SecurityLimits to input bytes, marker segments, metadata totals, IFD entries, image counts, ranges, nested metadata, and output. All MPF arithmetic is safe-integer checked; malformed, ambiguous, overlapping, unsupported, and out-of-range relationships fail before output is exposed.",
  complete: true,
};

await mkdir(reportDirectory, { recursive: true });
const jsonPath = join(reportDirectory, "mpf-t05-write-evidence.json");
const markdownPath = join(reportDirectory, "mpf-t05-write-evidence.md");
await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
const markdown = [
  "# T05 MPF metadata-only write evidence",
  "",
  `- Status: **${report.status}**`,
  `- Package: \`${report.package.name}@${report.package.version}\``,
  `- Fixture: \`${report.fixture.path}\`, ${report.fixture.byteLength} bytes, SHA-256 \`${report.fixture.sha256}\``,
  `- Policy: \`mpf: { mode: "preserve" }\` (default refusal remains covered by the focused tests)`,
  `- Output: ${report.edit.inputByteLength} -> ${report.edit.outputByteLength} bytes; package reparse complete=${report.edit.packageReparse.mpfComplete}; relationships verified=${report.edit.packageReparse.relationshipsVerified}`,
  `- Protected encoded scan payloads: ${report.edit.images.reduce((total, image) => total + image.protectedEncodedPayloadCount, 0)}; all SHA-256 comparisons matched`,
  `- Secondary metadata oracle: ExifTool ${report.independentOracle.implementationVersion}; MPF image count matched ${report.independentOracle.comparison.expected}`,
  "- Image-decoder evidence: the retained browser test covers every edited primary and secondary JPEG in Chromium and Firefox; unsupported browser launchers are never treated as passes.",
  "- Redistribution: temporary fixture and derived output only; no image bytes are present in this report.",
  "",
  "## Normalization and limits",
  "",
  `- ${report.normalizationPolicy}`,
  `- ${report.limitsPolicy}`,
  "",
  "The JSON artifact retains the complete byte-change map, input/output hashes, MPF image ranges, protected scan-range hashes, package reparse result, ExifTool comparison, fixture provenance, and typed policy diagnostics without retaining image payloads.",
].join("\n");
await writeFile(markdownPath, `${markdown}\n`, "utf8");
console.log(`T05 MPF write evidence passed for ${report.fixture.fileName ?? fixture.fileName}; reports: ${relative(root, jsonPath).replaceAll("\\", "/")}, ${relative(root, markdownPath).replaceAll("\\", "/")}`);
