import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const root = resolve(import.meta.dirname, "..");
const stage = await mkdtemp(join(tmpdir(), "browser-image-metadata-package-"));

async function run(command, args, cwd) {
  return execFile(command, args, { cwd, encoding: "utf8" });
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
    "package/CHANGELOG.md",
    "package/LICENSE",
    "package/dist/index.js",
    "package/dist/index.cjs",
    "package/dist/index.d.ts",
    "package/dist/index.d.cts",
  ]) assert.ok(entries.has(required), `published tarball is missing ${required}`);
  assert.ok(![...entries].some((entry) => entry.startsWith("package/tests/") || entry.startsWith("package/src/") || entry.startsWith("package/examples/") || entry.startsWith("package/.github/")), "published tarball contains development-only sources, tests, examples, or CI files");
  assert.ok(![...entries].some((entry) => /(?:fixture|\.env|\.pem|\.key|secret|credential|token)/i.test(entry)), "published tarball contains a fixture or secret-like file");
  const browserBundle = await readFile(join(root, "dist/index.js"), "utf8");
  assert.ok(!/\bnode:(?:fs|net|http|https|worker_threads)\b/.test(browserBundle), "browser ESM bundle contains a Node-only import");
  assert.ok(Buffer.byteLength(browserBundle, "utf8") < 300 * 1024, "browser ESM bundle exceeds the release size budget");
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
    'import { detectFormat, parseMetadata } from "browser-image-metadata";',
    `const bytes = Uint8Array.from(${fixtureLiteral});`,
    'assert.equal(detectFormat(bytes).format, "jpeg");',
    'assert.equal((await parseMetadata(bytes)).dimensions?.width, 2);',
  ].join("\n"));
  await writeFile(join(consumer, "cjs-smoke.cjs"), [
    'const assert = require("node:assert/strict");',
    'const { detectFormat, parseMetadata } = require("browser-image-metadata");',
    `const bytes = Uint8Array.from(${fixtureLiteral});`,
    'assert.equal(detectFormat(bytes).format, "jpeg");',
    '(async () => assert.equal((await parseMetadata(bytes)).dimensions?.height, 2))().catch((error) => { throw error; });',
  ].join("\n"));
  await run(process.execPath, ["esm-smoke.mjs"], consumer);
  await run(process.execPath, ["--conditions=browser", "esm-smoke.mjs"], consumer);
  await run(process.execPath, ["cjs-smoke.cjs"], consumer);
  process.stdout.write(`Tarball smoke passed: ${basename(tarball)}\n`);
} finally {
  await rm(stage, { recursive: true, force: true });
}
