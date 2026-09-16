import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { promisify } from "node:util";
import { gzipSync } from "node:zlib";

const execFile = promisify(execFileCallback);
const root = resolve(import.meta.dirname, "..");
const stage = await mkdtemp(join(tmpdir(), "browser-image-metadata-package-"));
const childProcessEnvironment = Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== "npm_config_dry_run" && key !== "npm_config_dry-run"));

async function run(command, args, cwd) {
  return execFile(command, args, { cwd, encoding: "utf8", maxBuffer: 8 * 1024 * 1024, env: childProcessEnvironment });
}

try {
  const packed = await run("npm", ["pack", "--json", "--cache", join(stage, "npm-cache"), "--pack-destination", stage], root);
  const manifest = JSON.parse(packed.stdout);
  assert.ok(Array.isArray(manifest) && manifest.length === 1, "npm pack did not produce exactly one tarball");
  const tarballName = manifest[0]?.filename;
  assert.equal(typeof tarballName, "string", "npm pack did not report a tarball filename");
  const tarball = join(stage, tarballName);
  const archive = await run("tar", ["-tzf", tarball], root);
  const entries = new Set(archive.stdout.trim().split("\n"));
  const packedPackage = JSON.parse((await run("tar", ["-xOf", tarball, "package/package.json"], root)).stdout);
  assert.equal(packedPackage.bin?.["image-metadata"], "./cli/index.mjs", "published package is missing the R03 CLI bin entry");
  for (const required of [
    "package/package.json",
    "package/README.md",
    "package/API.md",
    "package/W01_MUTATION_MODEL.md",
    "package/W02_TIFF_SERIALIZATION.md",
    "package/W03_JPEG_WRITING.md",
    "package/W04_PNG_WRITING.md",
    "package/W05_WEBP_WRITING.md",
    "package/W06_IPTC_SERIALIZATION.md",
    "package/W07_REDACTION_SELECTORS.md",
    "package/W08_PRESERVATION_VERIFIER.md",
    "package/B04_RAW_PHASE_ONE.md",
    "package/B05_RAW_PHASE_TWO.md",
    "package/B10_XMP_SIDECAR.md",
    "package/R01_API_DECISION.md",
    "package/DEPRECATION_POLICY.md",
    "package/RUNTIME_SUPPORT.md",
    "package/schemas/r01-api-v1.schema.json",
    "package/R02_DOCUMENTATION_SITE.md",
    "package/R03_CLI.md",
    "package/R04_MIGRATION_COMPATIBILITY.md",
    "package/R04_CODEMOD_DECISION.md",
    "package/R05_EXTERNAL_REVIEW_PACKET.md",
    "package/R05_COMPATIBILITY_LIMITATIONS.md",
    "package/COMPARISON.md",
    "package/reports/r04-compatibility.json",
    "package/reports/r04-compatibility.md",
    "package/cli/index.mjs",
    "package/docs-site/index.html",
    "package/docs-site/registry.html",
    "package/docs-site/playground.html",
    "package/docs-site/generated/site-data.js",
    "package/docs-site/generated/site-data.json",
    "package/docs-site/registry-selectors.html",
    "package/docs-site/registry-capabilities.html",
    "package/CAPABILITIES.md",
    "package/METADATA_REGISTRY.md",
    "package/MIGRATION.md",
    "package/CONTRIBUTING.md",
    "package/PUBLISHING.md",
    "package/BENCHMARKS.md",
    "package/RELEASE_CHECKLIST.md",
    "package/EXTERNAL_CORPORA.md",
    "package/CHANGELOG.md",
    "package/LICENSE",
    "package/dist/index.js",
    "package/dist/index.cjs",
    "package/dist/index.d.ts",
    "package/dist/index.d.cts",
    "package/dist/c2pa-browser.js",
    "package/dist/c2pa-browser.cjs",
    "package/dist/c2pa-browser.d.ts",
    "package/dist/c2pa-browser.d.cts",
    "package/dist/c2pa-node.js",
    "package/dist/c2pa-node.cjs",
    "package/dist/c2pa-node.d.ts",
    "package/dist/c2pa-node.d.cts",
    "package/dist/adapters.js",
    "package/dist/adapters.cjs",
    "package/dist/adapters.d.ts",
    "package/dist/adapters.d.cts",
    "package/dist/detect.js",
    "package/dist/detect.cjs",
    "package/dist/edit.js",
    "package/dist/edit.cjs",
    "package/dist/edit.d.ts",
    "package/dist/edit.d.cts",
    "package/dist/tiff.js",
    "package/dist/tiff.cjs",
    "package/dist/tiff.d.ts",
    "package/dist/tiff.d.cts",
    "package/dist/jpeg-writer.js",
    "package/dist/jpeg-writer.cjs",
    "package/dist/jpeg-writer.d.ts",
    "package/dist/jpeg-writer.d.cts",
    "package/dist/png-writer.js",
    "package/dist/png-writer.cjs",
    "package/dist/png-writer.d.ts",
    "package/dist/png-writer.d.cts",
    "package/dist/webp-writer.js",
    "package/dist/webp-writer.cjs",
    "package/dist/webp-writer.d.ts",
    "package/dist/webp-writer.d.cts",
    "package/dist/preservation.js",
    "package/dist/preservation.cjs",
    "package/dist/preservation.d.ts",
    "package/dist/preservation.d.cts",
    "package/dist/iptc.js",
    "package/dist/iptc.cjs",
    "package/dist/iptc.d.ts",
    "package/dist/iptc.d.cts",
    "package/dist/fetch.js",
    "package/dist/fetch.cjs",
    "package/dist/fetch.d.ts",
    "package/dist/fetch.d.cts",
    "package/dist/http.js",
    "package/dist/http.cjs",
    "package/dist/http.d.ts",
    "package/dist/http.d.cts",
    "package/dist/node.js",
    "package/dist/node.cjs",
    "package/dist/node.d.ts",
    "package/dist/node.d.cts",
    "package/dist/node-browser.js",
    "package/dist/node-browser.d.ts",
    "package/dist/jpeg.js",
    "package/dist/jpeg.cjs",
    "package/dist/mini.js",
    "package/dist/mini.cjs",
    "package/dist/mini.d.ts",
    "package/dist/mini.d.cts",
    "package/dist/redact.js",
    "package/dist/redact.cjs",
    "package/dist/xmp.js",
    "package/dist/xmp.cjs",
    "package/dist/xmp-rgrove.js",
    "package/dist/xmp-rgrove.cjs",
    "package/dist/xmp-sidecar.js",
    "package/dist/xmp-sidecar.cjs",
    "package/dist/xmp-sidecar.d.ts",
    "package/dist/xmp-sidecar.d.cts",
    "package/dist/worker.js",
    "package/dist/worker.cjs",
  ]) assert.ok(entries.has(required), `published tarball is missing ${required}`);
  assert.ok(![...entries].some((entry) => entry.startsWith("package/tests/") || entry.startsWith("package/src/") || entry.startsWith("package/examples/") || entry.startsWith("package/.github/")), "published tarball contains development-only sources, tests, examples, or CI files");
  assert.ok(![...entries].some((entry) => /(?:fixture|\.env|\.pem|\.key|secret|credential|token)/i.test(entry)), "published tarball contains a fixture or secret-like file");
  const browserBundle = await readFile(join(root, "dist/index.js"), "utf8");
  assert.ok(!/\bnode:(?:fs|net|http|https|worker_threads)\b/.test(browserBundle), "browser ESM bundle contains a Node-only import");
  assert.ok(Buffer.byteLength(browserBundle, "utf8") < 300 * 1024, "browser ESM bundle exceeds the release size budget");
  for (const entry of await readdir(join(root, "dist"))) {
    if (!/\.(?:js|cjs)$/u.test(entry) || /^c2pa-(?:browser|node)\./u.test(entry)) continue;
    const bundle = await readFile(join(root, "dist", entry), "utf8");
    assert.ok(!/@contentauth\/c2pa-(?:web|node)|c2pa_(?:web|node)/u.test(bundle), `ordinary bundle ${entry} contains an optional C2PA SDK reference`);
  }
  for (const [entry, budget] of [["detect.js", 1.5], ["jpeg.js", 15], ["mini.js", 4], ["index.js", 30], ["redact.js", 12]]) {
    const compressedKiB = gzipSync(await readFile(join(root, "dist", entry))).byteLength / 1024;
    assert.ok(compressedKiB <= budget, `${entry} initial ESM shell is ${compressedKiB.toFixed(2)} KiB gzip, above its ${budget} KiB budget`);
  }
  for (const entry of [...entries].filter((name) => /\.(?:js|cjs|map|json|md|d\.ts|d\.cts)$/.test(name))) {
    const content = (await run("tar", ["-xOf", tarball, entry], root)).stdout;
    assert.ok(!/(SECRET-123|-----BEGIN [A-Z ]+PRIVATE KEY-----|(?:api[_-]?key|password)\s*[:=])/i.test(content), `published tarball contains secret-like content in ${entry}`);
  }

  const consumer = join(stage, "consumer");
  await mkdir(consumer);
  await writeFile(join(consumer, "package.json"), JSON.stringify({ private: true, type: "module" }));
  await run("npm", ["install", "--cache", join(stage, "npm-cache"), "--omit=peer", "--ignore-scripts", "--offline", "--no-audit", "--no-fund", tarball], consumer);

  const fixture = new Uint8Array(await readFile(join(root, "tests/fixtures/jpeg-exif-little-endian.jpg")));
  const fixtureLiteral = JSON.stringify([...fixture]);
  const tiffFixture = new Uint8Array(await readFile(join(root, "tests/fixtures/tiff-exif-little-endian.tif")));
  const tiffFixtureLiteral = JSON.stringify([...tiffFixture]);
  await writeFile(join(consumer, "esm-smoke.mjs"), [
    'import assert from "node:assert/strict";',
    'import { detectFormat, editMetadata, getCapabilities, inventoryC2pa, parseCr3, parseMetadata, parseRaf, readGps, readTags } from "browser-image-metadata";',
    'import { verifyC2paInBrowser } from "browser-image-metadata/c2pa/browser";',
    'import { detectFormat as detectOnly } from "browser-image-metadata/detect";',
    'import { fetchMetadata } from "browser-image-metadata/fetch";',
    'import { fetchMetadata as fetchHttpMetadata } from "browser-image-metadata/http";',
    'import { parseJpegMetadata } from "browser-image-metadata/jpeg";',
    'import { parseMetadata as parseMiniMetadata } from "browser-image-metadata/mini";',
    'import { redactMetadata as redactFocused } from "browser-image-metadata/redact";',
    'import { editMetadata as editFocused } from "browser-image-metadata/edit";',
    'import { parseTiffGraph, serializeTiff } from "browser-image-metadata/tiff";',
    'import { rewriteJpegMetadata } from "browser-image-metadata/jpeg-writer";',
    'import { verifyPreservation } from "browser-image-metadata/preservation";',
    'import { parseStructuredXmp, serializeStructuredXmp } from "browser-image-metadata/xmp";',
    'import { parseXmpSidecar, serializeXmpSidecar } from "browser-image-metadata/xmp/sidecar";',
    'import { serializeIptcIim } from "browser-image-metadata/iptc";',
    'import { toJsonSafe } from "browser-image-metadata/adapters";',
    `const bytes = Uint8Array.from(${fixtureLiteral});`,
    `const tiffBytes = Uint8Array.from(${tiffFixtureLiteral});`,
    'const rafHeader = new Uint8Array(108); rafHeader.set(new TextEncoder().encode("FUJIFILMCCD-RAW "));',
    'const cr3Header = Uint8Array.from([0, 0, 0, 16, 0x66, 0x74, 0x79, 0x70, 0x63, 0x72, 0x78, 0x20, 0, 0, 0, 0]);',
    'assert.equal(typeof parseCr3, "function"); assert.equal(typeof parseRaf, "function");',
    'assert.equal((await parseMetadata(rafHeader)).fileKind, "raf"); assert.equal((await parseMetadata(cr3Header)).fileKind, "cr3");',
    'const jpegWritten = rewriteJpegMetadata(bytes, { blocks: [{ op: "add", kind: "standard-xmp", data: "<x:xmpmeta xmlns:x=\\"adobe\\"/>" }] });',
    'assert.equal(jpegWritten.preservation?.successful, true);',
    'assert.equal((await verifyPreservation(bytes, jpegWritten.data)).successful, true);',
    'assert.equal(detectFormat(bytes).format, "jpeg");',
    'assert.equal((await inventoryC2pa(bytes)).status, "not-present");',
    'assert.match((await verifyC2paInBrowser(bytes)).status, /^adapter:(?:sdk-unavailable|configuration)$/u);',
    'const esmEdit = await editMetadata(bytes, { operations: [{ op: "set", operationId: "title", target: { kind: "field", fieldId: "XMP:dc:title" }, value: "title" }] });',
    'assert.equal(esmEdit.status, "applied");',
    'assert.ok(esmEdit.data instanceof Uint8Array && esmEdit.data.byteLength > bytes.byteLength);',
    'const esmDeleted = await editFocused(bytes, { operations: [{ op: "delete", operationId: "title", target: { kind: "field", fieldId: "XMP:dc:title" } }] });',
    'assert.equal(esmDeleted.status, "applied");',
    'assert.ok(esmDeleted.data instanceof Uint8Array);',
    'assert.deepEqual(getCapabilities("jpeg").readScopes, ["full", "jpeg-header", "metadata"]);',
    'assert.equal(detectOnly(bytes).format, "jpeg");',
    'assert.equal((await fetchMetadata("https://example.invalid/photo.jpg", { fetch: () => Promise.resolve(new Response(bytes)) })).format, "jpeg");',
    'assert.equal(typeof fetchHttpMetadata, "function");',
    'assert.equal(parseStructuredXmp(`<x:xmpmeta xmlns:x="x"/>`)?.properties !== undefined, true);',
    'assert.ok(serializeIptcIim([{ record: 2, dataset: 25, value: "smoke" }]).byteLength > 0);',
    'assert.ok(serializeStructuredXmp({ namespaces: { ex: "https://example.invalid/" }, properties: { "ex:value": "smoke" } }).includes("smoke"));',
    'assert.equal((await parseXmpSidecar(new TextEncoder().encode("<rdf:RDF xmlns:rdf=\\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\\"/>"))).coverage.complete, true);',
    'assert.equal((await serializeXmpSidecar({ namespaces: { ex: "https://example.invalid/" }, properties: { "ex:value": "smoke" } })).verified, true);',
    'assert.equal(JSON.stringify(toJsonSafe({ value: 1 })), "{\\"value\\":1}");',
    'assert.equal((await parseMetadata(bytes)).dimensions?.width, 2);',
    'assert.equal((await parseMetadata(jpegWritten.data)).xmp?.packets.includes("<x:xmpmeta xmlns:x=\\"adobe\\"/>") ?? false, true);',
    'assert.equal((await readGps(bytes)).latitude, 51.5);',
    'assert.deepEqual((await readTags(bytes, ["Make"])).map((field) => field.name), ["Make"]);',
    'assert.equal((await parseJpegMetadata(bytes, { scope: "jpeg-header" })).completeness.scope, "partial");',
    'assert.equal((await parseJpegMetadata(new Blob([bytes, new Uint8Array(64 * 1024)], { type: "image/jpeg" }), { scope: "metadata", select: { tags: ["Make"] } })).completeness.scope, "partial");',
    'assert.equal((await parseMiniMetadata(bytes)).format, "jpeg");',
    'assert.equal((await redactFocused(bytes, { remove: ["EXIF"] })).format, "jpeg");',
    'assert.equal(parseTiffGraph(serializeTiff(parseTiffGraph(tiffBytes))).variant, "classic");',
  ].join("\n"));
  await writeFile(join(consumer, "node-esm-smoke.mjs"), [
    'import assert from "node:assert/strict";',
    'import { writeFile } from "node:fs/promises";',
    'import { parseMetadata } from "browser-image-metadata/node";',
    'import { verifyC2paInNode } from "browser-image-metadata/c2pa/node";',
    `const bytes = Uint8Array.from(${fixtureLiteral});`,
    'await writeFile("node-fixture.jpg", bytes);',
    'assert.equal((await parseMetadata("node-fixture.jpg", { scope: "metadata" })).format, "jpeg");',
    'assert.equal((await verifyC2paInNode(bytes, { remoteManifestFetch: false })).status, "adapter:sdk-unavailable");',
  ].join("\n"));
  await writeFile(join(consumer, "node-browser-smoke.mjs"), [
    'import assert from "node:assert/strict";',
    'import { parseMetadata } from "browser-image-metadata/node";',
    'await assert.rejects(parseMetadata(new Uint8Array()), { code: "UNSUPPORTED_FORMAT" });',
  ].join("\n"));
  await writeFile(join(consumer, "cjs-smoke.cjs"), [
    'const assert = require("node:assert/strict");',
    'const { detectFormat, editMetadata, parseMetadata } = require("browser-image-metadata");',
    'const { detectFormat: detectOnly } = require("browser-image-metadata/detect");',
    'const { parseMetadata: parseNodeMetadata } = require("browser-image-metadata/node");',
    'const { toJsonSafe } = require("browser-image-metadata/adapters");',
    'const { rewriteJpegMetadata } = require("browser-image-metadata/jpeg-writer");',
    `const bytes = Uint8Array.from(${fixtureLiteral});`,
    'assert.equal(detectFormat(bytes).format, "jpeg");',
    'assert.equal(detectOnly(bytes).format, "jpeg");',
    'assert.equal(JSON.stringify(toJsonSafe({ value: 1 })), "{\\"value\\":1}");',
    '(async () => {',
    '  const cjsDeleted = await editMetadata(bytes, { operations: [{ op: "delete", operationId: "title", target: { kind: "field", fieldId: "XMP:dc:title" } }] });',
    '  assert.equal(cjsDeleted.status, "applied");',
    '  assert.ok(cjsDeleted.data instanceof Uint8Array);',
    '  assert.equal((await parseMetadata(rewriteJpegMetadata(bytes, { blocks: [{ op: "add", kind: "standard-xmp", data: "<x:xmpmeta xmlns:x=\\"adobe\\"/>" }] }).data)).xmp?.packets.includes("<x:xmpmeta xmlns:x=\\"adobe\\"/>") ?? false, true);',
    '  assert.equal((await parseNodeMetadata(bytes)).format, "jpeg");',
    '  assert.equal((await parseMetadata(bytes)).dimensions?.height, 2);',
    '})().catch((error) => { throw error; });',
  ].join("\n"));
  await run(process.execPath, ["esm-smoke.mjs"], consumer);
  await run(process.execPath, ["node-esm-smoke.mjs"], consumer);
  await run(process.execPath, ["--conditions=browser", "node-browser-smoke.mjs"], consumer);
  await run(process.execPath, ["--conditions=browser", "esm-smoke.mjs"], consumer);
  await run(process.execPath, ["cjs-smoke.cjs"], consumer);
  process.stdout.write(`Tarball smoke passed: ${basename(tarball)}\n`);
} finally {
  await rm(stage, { recursive: true, force: true });
}
