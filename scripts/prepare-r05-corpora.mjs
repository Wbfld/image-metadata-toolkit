/* global fetch */

import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { copyFile, mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { execFile as execFileCallback } from "node:child_process";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";

const root = resolve(import.meta.dirname, "..");
const execFile = promisify(execFileCallback);
const MAX_FILE_BYTES = 512 * 1024 * 1024;
const MAX_TOTAL_BYTES = 2 * 1024 * 1024 * 1024;
const ALLOWED_HOSTS = new Set(["raw.pixls.us", "www.w3.org"]);
const HASH_PATTERN = /^[a-f0-9]{64}$/u;

function fail(message) {
  throw new Error(`R05 corpus preparation failed: ${message}`);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

export function validateSourceUrl(value) {
  assert(typeof value === "string" && value.length <= 4096, "source URL is missing or oversized");
  const url = new URL(value);
  assert(url.protocol === "https:", `source URL is not HTTPS: ${value}`);
  assert(ALLOWED_HOSTS.has(url.hostname), `source host is not allowlisted: ${url.hostname}`);
  return url;
}

export function safeTarget(rootDirectory, relativePath) {
  assert(typeof relativePath === "string" && relativePath.length > 0 && relativePath.length <= 512, "fixture path is missing or oversized");
  assert(!relativePath.startsWith("/") && !relativePath.includes("\\"), `fixture path is not repository-relative: ${relativePath}`);
  const target = resolve(rootDirectory, relativePath);
  assert(target === resolve(rootDirectory) || target.startsWith(`${resolve(rootDirectory)}${sep}`), `fixture path escaped the temporary root: ${relativePath}`);
  return target;
}

function expectedHash(value, label) {
  assert(typeof value === "string" && HASH_PATTERN.test(value), `${label} is not a SHA-256 value`);
  return value;
}

function expectedBytes(value, label) {
  assert(Number.isSafeInteger(value) && value >= 0 && value <= MAX_FILE_BYTES, `${label} has an unsafe byte length`);
  return value;
}

async function digestFile(path) {
  const info = await stat(path).catch(() => null);
  if (info?.isFile() !== true || info.size > MAX_FILE_BYTES) return null;
  const digest = createHash("sha256");
  let bytes = 0;
  for await (const chunk of createReadStream(path)) {
    bytes += chunk.byteLength;
    if (bytes > MAX_FILE_BYTES) return null;
    digest.update(chunk);
  }
  return { bytes, sha256: digest.digest("hex") };
}

async function verifiedFile(path, expectedSha256, expectedLength) {
  const actual = await digestFile(path);
  return actual !== null && (expectedLength === undefined || actual.bytes === expectedLength) && actual.sha256 === expectedSha256;
}

let downloadedBytes = 0;

async function downloadToCache(cachePath, fixture) {
  const sha256 = expectedHash(fixture.sha256, fixture.fileName ?? "fixture");
  const bytes = fixture.bytes === undefined ? undefined : expectedBytes(fixture.bytes, fixture.fileName ?? "fixture");
  validateSourceUrl(fixture.url);
  if (await verifiedFile(cachePath, sha256, bytes)) return { bytes, sha256, downloaded: false };
  await rm(cachePath, { force: true });
  const response = await fetch(fixture.url, { redirect: "follow" });
  assert(response.ok, `${fixture.fileName ?? "fixture"} returned HTTP ${response.status}`);
  validateSourceUrl(response.url);
  const contentLength = response.headers.get("content-length");
  if (contentLength !== null && bytes !== undefined) {
    const declared = Number(contentLength);
    assert(Number.isSafeInteger(declared) && declared === bytes, `${fixture.fileName ?? "fixture"} content length does not match the pinned length`);
  }
  assert(response.body !== null, `${fixture.fileName ?? "fixture"} response has no body`);
  const partialPath = `${cachePath}.partial-${process.pid}`;
  await rm(partialPath, { force: true });
  let received = 0;
  const digest = createHash("sha256");
  const meter = new Transform({
    transform(chunk, _encoding, callback) {
      received += chunk.byteLength;
      if ((bytes !== undefined && received > bytes) || received > MAX_FILE_BYTES) {
        callback(new Error(`${fixture.fileName ?? "fixture"} exceeded its pinned byte length`));
        return;
      }
      digest.update(chunk);
      callback(null, chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(response.body), meter, createWriteStream(partialPath, { flags: "wx" }));
    const actualHash = digest.digest("hex");
    assert((bytes === undefined || received === bytes) && actualHash === sha256, `${fixture.fileName ?? "fixture"} SHA-256 or byte length mismatch`);
    assert(downloadedBytes <= MAX_TOTAL_BYTES - received, "temporary corpus download limit exceeded");
    await rename(partialPath, cachePath);
  } finally {
    await rm(partialPath, { force: true });
  }
  downloadedBytes += received;
  return { bytes: received, sha256, downloaded: true };
}

async function placeFixture(cachePath, targetPath, fixture) {
  assert(await verifiedFile(cachePath, fixture.sha256, fixture.bytes), `${fixture.fileName ?? "fixture"} failed cache verification`);
  await mkdir(resolve(targetPath, ".."), { recursive: true });
  await copyFile(cachePath, targetPath);
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(join(root, relativePath), "utf8"));
}

async function prepareRawCorpora(destinationRoot) {
  const cacheRoot = safeTarget(destinationRoot, ".cache");
  await mkdir(cacheRoot, { recursive: true });
  const b04 = await readJson("data/raw/raw-b04-sources.json");
  const b05 = await readJson("data/raw/raw-b05-sources.json");
  const b08 = await readJson("data/makernote-b08-sources.json");
  const fixtures = [
    ...b04.fixtures.map((fixture) => ({ ...fixture, destination: safeTarget(destinationRoot, join("raw-b04", fixture.fileName)) })),
    ...b05.fixtures.map((fixture) => ({ ...fixture, destination: safeTarget(destinationRoot, join("raw-b05", fixture.fileName)) })),
    ...b08.packs.flatMap((pack) => pack.fixtures.map((fixture) => ({ ...fixture, destination: safeTarget(destinationRoot, join("makernote-b08", fixture.path)) }))),
  ];
  assert(fixtures.length === 23, `expected 23 B04/B05/B08 fixture records, found ${fixtures.length}`);
  const caches = new Map();
  for (const fixture of fixtures) {
    expectedHash(fixture.sha256, fixture.fileName);
    if (fixture.bytes !== undefined) expectedBytes(fixture.bytes, fixture.fileName);
    let cachePath = caches.get(fixture.sha256);
    if (cachePath === undefined) {
      cachePath = safeTarget(cacheRoot, fixture.sha256);
      const source = b04.fixtures.find((candidate) => candidate.sha256 === fixture.sha256) ?? b05.fixtures.find((candidate) => candidate.sha256 === fixture.sha256) ?? b08.packs.flatMap((pack) => pack.fixtures).find((candidate) => candidate.sha256 === fixture.sha256);
      assert(source !== undefined, `${fixture.fileName} has no source manifest record`);
      await downloadToCache(cachePath, { ...source, bytes: fixture.bytes });
      caches.set(fixture.sha256, cachePath);
    }
    await placeFixture(cachePath, fixture.destination, fixture);
  }
  return {
    b04: relative(destinationRoot, safeTarget(destinationRoot, "raw-b04")),
    b05: relative(destinationRoot, safeTarget(destinationRoot, "raw-b05")),
    b08: relative(destinationRoot, safeTarget(destinationRoot, "makernote-b08")),
    fixtureCount: fixtures.length,
    uniqueDownloads: caches.size,
  };
}

async function prepareSvgCorpus(destinationRoot) {
  const manifest = await readJson("data/svg/b09-sources.json");
  const archive = { ...manifest.archive, fileName: "W3C_SVG_11_TestSuite.tar.gz" };
  const archivePath = safeTarget(destinationRoot, join("svg-cache", archive.fileName));
  await mkdir(resolve(archivePath, ".."), { recursive: true });
  validateSourceUrl(archive.url);
  await downloadToCache(archivePath, archive);
  const svgRoot = safeTarget(destinationRoot, "svg");
  for (const fixture of manifest.fixtures) {
    assert(typeof fixture.sourcePath === "string" && !fixture.sourcePath.includes("..") && !fixture.sourcePath.startsWith("/"), `unsafe W3C archive member: ${fixture.sourcePath}`);
    const target = safeTarget(svgRoot, fixture.fileName);
    if (await verifiedFile(target, fixture.sha256, fixture.bytes)) continue;
    const extracted = await execFile("tar", ["-xOzf", archivePath, fixture.sourcePath], { cwd: destinationRoot, encoding: "buffer", maxBuffer: MAX_FILE_BYTES });
    const bytes = Buffer.isBuffer(extracted.stdout) ? extracted.stdout : Buffer.from(extracted.stdout);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    assert(bytes.length === fixture.bytes && sha256 === fixture.sha256, `${fixture.fileName} extracted bytes do not match the pinned fixture`);
    await mkdir(resolve(target, ".."), { recursive: true });
    await rm(target, { force: true });
    await writeFile(target, bytes, { flag: "wx" });
  }
  return { svg: relative(destinationRoot, svgRoot), fixtureCount: manifest.fixtures.length, archiveSha256: archive.sha256 };
}

export async function prepareReleaseCorpora(destinationRoot) {
  assert(typeof destinationRoot === "string" && destinationRoot.length > 0, "a temporary destination is required");
  const resolvedRoot = resolve(destinationRoot);
  assert(resolvedRoot !== root && !resolvedRoot.startsWith(`${root}${sep}`), "corpus destination must be outside the repository");
  await mkdir(resolvedRoot, { recursive: true });
  downloadedBytes = 0;
  const raw = await prepareRawCorpora(resolvedRoot);
  const svg = await prepareSvgCorpus(resolvedRoot);
  return { root: resolvedRoot, raw, svg, downloadedBytes };
}

async function main() {
  const argumentIndex = process.argv.indexOf("--root");
  const destination = argumentIndex >= 0 ? process.argv[argumentIndex + 1] : process.env.R05_CORPUS_ROOT;
  assert(typeof destination === "string" && destination.length > 0, "use --root <temporary-directory> or R05_CORPUS_ROOT");
  const result = await prepareReleaseCorpora(destination);
  process.stdout.write(`${JSON.stringify({ ...result, policy: "temporary untracked storage; only pinned hashes and counts are reported" })}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
