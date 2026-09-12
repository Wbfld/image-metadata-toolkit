import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { promisify } from "node:util";
import { gzipSync } from "node:zlib";

const execFile = promisify(execFileCallback);
const root = resolve(import.meta.dirname, "..");
const stage = await mkdtemp(join(tmpdir(), "browser-image-metadata-package-"));

async function run(command, args, cwd) {
  return execFile(command, args, { cwd, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
}

try {
  const packed = await run("npm", ["pack", "--json", "--pack-destination", stage], root);
  const manifest = JSON.parse(packed.stdout);
  assert.ok(Array.isArray(manifest) && manifest.length === 1, "npm pack did not produce exactly one tarball");
  const tarballName = manifest[0]?.filename;
  assert.equal(typeof tarballName, "string", "npm pack did not report a tarball filename");
  const tarball = join(stage, tarballName);
  const archive = await run("tar", ["-tzf", tarball], root);
  const entries = new Set(archive.stdout.trim().split("\n"));
  for (const required of [
    "package/package.json",
    "package/README.md",
    "package/API.md",
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
    "package/dist/adapters.js",
    "package/dist/adapters.cjs",
    "package/dist/adapters.d.ts",
    "package/dist/adapters.d.cts",
    "package/dist/detect.js",
    "package/dist/detect.cjs",
    "package/dist/fetch.js",
    "package/dist/fetch.cjs",
    "package/dist/fetch.d.ts",
    "package/dist/fetch.d.cts",
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
    "package/dist/worker.js",
    "package/dist/worker.cjs",
  ]) assert.ok(entries.has(required), `published tarball is missing ${required}`);
  assert.ok(![...entries].some((entry) => entry.startsWith("package/tests/") || entry.startsWith("package/src/") || entry.startsWith("package/examples/") || entry.startsWith("package/.github/")), "published tarball contains development-only sources, tests, examples, or CI files");
  assert.ok(![...entries].some((entry) => /(?:fixture|\.env|\.pem|\.key|secret|credential|token)/i.test(entry)), "published tarball contains a fixture or secret-like file");
  const browserBundle = await readFile(join(root, "dist/index.js"), "utf8");
  assert.ok(!/\bnode:(?:fs|net|http|https|worker_threads)\b/.test(browserBundle), "browser ESM bundle contains a Node-only import");
  assert.ok(Buffer.byteLength(browserBundle, "utf8") < 300 * 1024, "browser ESM bundle exceeds the release size budget");
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
  await run("npm", ["install", "--ignore-scripts", "--offline", "--no-audit", "--no-fund", tarball], consumer);

  const fixture = new Uint8Array(await readFile(join(root, "tests/fixtures/jpeg-exif-little-endian.jpg")));
  const fixtureLiteral = JSON.stringify([...fixture]);
  await writeFile(join(consumer, "esm-smoke.mjs"), [
    'import assert from "node:assert/strict";',
    'import { detectFormat, getCapabilities, parseMetadata, readGps, readTags } from "browser-image-metadata";',
    'import { detectFormat as detectOnly } from "browser-image-metadata/detect";',
    'import { fetchMetadata } from "browser-image-metadata/fetch";',
    'import { parseJpegMetadata } from "browser-image-metadata/jpeg";',
    'import { parseMetadata as parseMiniMetadata } from "browser-image-metadata/mini";',
    'import { redactMetadata as redactFocused } from "browser-image-metadata/redact";',
    'import { parseStructuredXmp } from "browser-image-metadata/xmp";',
    'import { toJsonSafe } from "browser-image-metadata/adapters";',
    `const bytes = Uint8Array.from(${fixtureLiteral});`,
    'assert.equal(detectFormat(bytes).format, "jpeg");',
    'assert.deepEqual(getCapabilities("jpeg").readScopes, ["full", "jpeg-header", "metadata"]);',
    'assert.equal(detectOnly(bytes).format, "jpeg");',
    'assert.equal((await fetchMetadata("https://example.invalid/photo.jpg", { fetch: () => Promise.resolve(new Response(bytes)) })).format, "jpeg");',
    'assert.equal(parseStructuredXmp(`<x:xmpmeta xmlns:x="x"/>`)?.properties !== undefined, true);',
    'assert.equal(JSON.stringify(toJsonSafe({ value: 1 })), "{\\"value\\":1}");',
    'assert.equal((await parseMetadata(bytes)).dimensions?.width, 2);',
    'assert.equal((await readGps(bytes)).latitude, 51.5);',
    'assert.deepEqual((await readTags(bytes, ["Make"])).map((field) => field.name), ["Make"]);',
    'assert.equal((await parseJpegMetadata(bytes, { scope: "jpeg-header" })).completeness.scope, "partial");',
    'assert.equal((await parseJpegMetadata(new Blob([bytes, new Uint8Array(64 * 1024)], { type: "image/jpeg" }), { scope: "metadata", select: { tags: ["Make"] } })).completeness.scope, "partial");',
    'assert.equal((await parseMiniMetadata(bytes)).format, "jpeg");',
    'assert.equal((await redactFocused(bytes, { remove: ["EXIF"] })).format, "jpeg");',
  ].join("\n"));
  await writeFile(join(consumer, "cjs-smoke.cjs"), [
    'const assert = require("node:assert/strict");',
    'const { detectFormat, parseMetadata } = require("browser-image-metadata");',
    'const { detectFormat: detectOnly } = require("browser-image-metadata/detect");',
    'const { toJsonSafe } = require("browser-image-metadata/adapters");',
    `const bytes = Uint8Array.from(${fixtureLiteral});`,
    'assert.equal(detectFormat(bytes).format, "jpeg");',
    'assert.equal(detectOnly(bytes).format, "jpeg");',
    'assert.equal(JSON.stringify(toJsonSafe({ value: 1 })), "{\\"value\\":1}");',
    '(async () => assert.equal((await parseMetadata(bytes)).dimensions?.height, 2))().catch((error) => { throw error; });',
  ].join("\n"));
  await run(process.execPath, ["esm-smoke.mjs"], consumer);
  await run(process.execPath, ["--conditions=browser", "esm-smoke.mjs"], consumer);
  await run(process.execPath, ["cjs-smoke.cjs"], consumer);
  process.stdout.write(`Tarball smoke passed: ${basename(tarball)}\n`);
} finally {
  await rm(stage, { recursive: true, force: true });
}
