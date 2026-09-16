/* global Image, TextDecoder, TextEncoder, atob, btoa, document */

import crypto from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { extname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { chromium, firefox } from "@playwright/test";
import { exiftool } from "exiftool-vendored";

const execFile = promisify(execFileCallback);
const root = resolve(new URL("..", import.meta.url).pathname);
const manifest = JSON.parse(await readFile(join(root, "data/writer-corpus.json"), "utf8"));
const packageManifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const { editMetadata, parseMetadata, rewriteJpegMetadata, rewritePngMetadata, rewriteWebpMetadata } = await import(join(root, "dist/index.js"));
const outputDirectory = resolve(root, process.env.WRITER_CORPUS_OUTPUT_DIR ?? "reports");
const configuredRootsText = process.env.WRITER_CORPUS_ROOTS_JSON;
const protectedDirectoryValue = process.env.WRITER_PROTECTED_CORPUS_DIR;
const minimumPerFamily = Number(process.env.WRITER_CORPUS_MINIMUM ?? manifest.minimumFixturesPerFamily);
const maximumFixtureBytes = Number(process.env.WRITER_CORPUS_MAX_BYTES ?? manifest.maximumFixtureBytes);
const maximumSourceFiles = Number(manifest.maximumSourceFiles);
const expectedExifToolVersion = "13.59";
const expectedExifToolPackageVersion = "38.1.0";
const maximumOracleBytes = 64 * 1024 * 1024;
const formatExtensions = new Map([
  ["jpeg", new Set([".jpg", ".jpeg"])],
  ["png", new Set([".png"])],
  ["webp", new Set([".webp"])],
]);
const mimeForFormat = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
const XMP_PREFIX = "<x:xmpmeta xmlns:x=\"adobe:ns:meta/\"><rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\"><rdf:Description xmlns:xmp=\"http://ns.adobe.com/xap/1.0/\" xmp:CreatorTool=\"browser-image-metadata-stage5\"/></rdf:RDF></x:xmpmeta>";
const XMP_REPLACEMENT = "<x:xmpmeta xmlns:x=\"adobe:ns:meta/\"><rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\"><rdf:Description xmlns:xmp=\"http://ns.adobe.com/xap/1.0/\" xmp:CreatorTool=\"browser-image-metadata-stage5-replaced\"/></rdf:RDF></x:xmpmeta>";
const XMP_LARGE = `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmp:CreatorTool="browser-image-metadata-stage5" xmp:Label="${"x".repeat(2048)}"/></rdf:RDF></x:xmpmeta>`;

function fail(message, cause) {
  throw new Error(message, cause === undefined ? undefined : { cause });
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function typedFailure(error) {
  const record = error !== null && typeof error === "object" ? error : null;
  return {
    name: error instanceof Error ? error.name : "UnknownError",
    code: record !== null && typeof record.code === "string" ? record.code : "UNCLASSIFIED_FAILURE",
    detail: error instanceof Error ? error.message : String(error),
  };
}

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function safeInteger(name, value, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) fail(`${name} must be a safe integer >= ${minimum}.`);
  return value;
}

safeInteger("WRITER_CORPUS_MINIMUM", minimumPerFamily, 500);
safeInteger("WRITER_CORPUS_MAX_BYTES", maximumFixtureBytes, 1);

async function requireDirectory(path, label) {
  let details;
  try {
    details = await stat(path);
  } catch (error) {
    fail(`${label} directory is missing: ${path}`, error);
  }
  if (!details.isDirectory()) fail(`${label} path is not a directory: ${path}`);
}

function parseRoots() {
  if (typeof configuredRootsText !== "string" || configuredRootsText.length === 0) fail("WRITER_CORPUS_ROOTS_JSON is required; the writer corpus must be executed against pinned temporary checkouts.");
  let configured;
  try {
    configured = JSON.parse(configuredRootsText);
  } catch (error) {
    fail("WRITER_CORPUS_ROOTS_JSON is not valid JSON.", error);
  }
  if (configured === null || typeof configured !== "object" || Array.isArray(configured)) fail("WRITER_CORPUS_ROOTS_JSON must be an object keyed by manifest source ID.");
  const expected = new Set(manifest.sources.map((source) => source.id));
  const actual = new Set(Object.keys(configured));
  if (expected.size !== actual.size || [...expected].some((id) => !actual.has(id))) fail(`WRITER_CORPUS_ROOTS_JSON must contain exactly: ${[...expected].join(", ")}.`);
  for (const [id, value] of Object.entries(configured)) if (typeof value !== "string" || value.length === 0) fail(`Writer corpus root ${id} must be a non-empty path.`);
  return configured;
}

const configuredRoots = parseRoots();

async function verifyCommit(path, expected, source) {
  let actual;
  try {
    actual = (await execFile("git", ["-C", path, "rev-parse", "HEAD"], { encoding: "utf8" })).stdout.trim();
  } catch (error) {
    fail(`${source} checkout is not a verifiable git checkout.`, error);
  }
  if (!/^[0-9a-f]{40}$/u.test(actual) || actual !== expected) fail(`${source} checkout is ${actual || "unknown"}, not pinned ${expected}.`);
  return actual;
}

function safeRelative(rootPath, relativePath) {
  if (relativePath.startsWith("/") || relativePath.includes("..")) fail(`Unsafe writer corpus relative path: ${relativePath}`);
  const path = resolve(rootPath, relativePath);
  const prefix = rootPath.endsWith("/") ? rootPath : `${rootPath}/`;
  if (path !== rootPath && !path.startsWith(prefix)) fail(`Writer corpus path escapes its pinned checkout: ${relativePath}`);
  return path;
}

async function walk(directory, extensions, depth = 0, counter = { files: 0 }) {
  if (depth > 64) fail(`Writer corpus directory nesting exceeds the bounded depth at ${directory}.`);
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) paths.push(...await walk(path, extensions, depth + 1, counter));
    else if (extensions.has(extname(entry.name).toLowerCase())) {
      counter.files += 1;
      if (counter.files > maximumSourceFiles) fail(`Writer corpus exceeds the bounded ${maximumSourceFiles}-file scan limit.`);
      paths.push(path);
    }
  }
  return paths;
}

async function collectSourceFiles() {
  const revisions = {};
  const candidates = [];
  for (const source of manifest.sources) {
    const checkout = resolve(configuredRoots[source.id]);
    await requireDirectory(checkout, `${source.id} checkout`);
    revisions[source.id] = await verifyCommit(checkout, source.commit, source.id);
    const roots = source.roots ?? [source.root];
    const extensions = new Set(source.extensions);
    for (const relativeRoot of roots) {
      if (typeof relativeRoot !== "string" || relativeRoot.startsWith("/") || relativeRoot.includes("..")) fail(`Unsafe ${source.id} root: ${relativeRoot}`);
      const rootDirectory = safeRelative(checkout, relativeRoot);
      await requireDirectory(rootDirectory, `${source.id}/${relativeRoot}`);
      const sourceFiles = (await walk(rootDirectory, extensions)).sort();
      if (sourceFiles.length === 0) fail(`No writer fixtures were found under ${source.id}/${relativeRoot}.`);
      for (const path of sourceFiles) candidates.push({
        path,
        sourceId: source.id,
        sourceRoot: relativeRoot,
        relativePath: `${source.id}/${relative(checkout, path).split("\\").join("/")}`,
        origin: "external",
      });
    }
  }
  return { candidates, revisions };
}

function asBase64(bytes) {
  return Buffer.from(bytes).toString("base64");
}

class BrowserDecoders {
  constructor() {
    this.browsers = [];
    this.pages = new Map();
    this.versions = {};
  }

  async open() {
    const chromiumBrowser = await chromium.launch({ headless: true });
    const firefoxBrowser = await firefox.launch({ headless: true });
    this.browsers = [chromiumBrowser, firefoxBrowser];
    this.versions = { chromium: chromiumBrowser.version(), firefox: firefoxBrowser.version() };
    for (const [name, browser] of [["chromium", chromiumBrowser], ["firefox", firefoxBrowser]]) this.pages.set(name, await browser.newPage());
  }

  async close() {
    await Promise.all(this.browsers.map((browser) => browser.close()));
    this.browsers = [];
    this.pages.clear();
  }

  async decode(name, bytes, mime) {
    if (bytes.length > maximumFixtureBytes) return { status: "rejected", reason: "fixture-byte-limit" };
    const page = this.pages.get(name);
    if (page === undefined) fail(`Decoder page ${name} is unavailable.`);
    return page.evaluate(async ({ encoded, type }) => {
      const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type }));
      try {
        const image = new Image();
        image.decoding = "async";
        image.src = url;
        await new Promise((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error("native-image-decoder-rejected-input"));
        });
        if (!Number.isSafeInteger(image.naturalWidth) || !Number.isSafeInteger(image.naturalHeight) || image.naturalWidth < 1 || image.naturalHeight < 1) throw new Error("native-image-decoder-returned-invalid-dimensions");
        return { status: "decoded", width: image.naturalWidth, height: image.naturalHeight };
      } catch (error) {
        return { status: "rejected", reason: error instanceof Error ? error.message : String(error) };
      } finally {
        URL.revokeObjectURL(url);
      }
    }, { encoded: asBase64(bytes), type: mime });
  }

  async encodeFromPng(bytes, outputType, quality) {
    const page = this.pages.get("chromium");
    if (page === undefined) fail("Chromium encoder page is unavailable.");
    return page.evaluate(async ({ encoded, type, outputQuality }) => {
      const inputBytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
      const inputUrl = URL.createObjectURL(new Blob([inputBytes], { type: "image/png" }));
      try {
        const image = new Image();
        image.src = inputUrl;
        await new Promise((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("chromium-encoder-input-decode-failed")); });
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d", { alpha: true });
        if (context === null) throw new Error("chromium-encoder-canvas-unavailable");
        context.drawImage(image, 0, 0);
        const blob = await new Promise((resolve, reject) => canvas.toBlob((value) => value === null ? reject(new Error("chromium-encoder-produced-no-blob")) : resolve(value), type, outputQuality));
        const output = new Uint8Array(await blob.arrayBuffer());
        let binary = "";
        for (let offset = 0; offset < output.length; offset += 0x8000) binary += String.fromCharCode(...output.subarray(offset, Math.min(offset + 0x8000, output.length)));
        return { width: image.naturalWidth, height: image.naturalHeight, encoded: btoa(binary) };
      } finally {
        URL.revokeObjectURL(inputUrl);
      }
    }, { encoded: asBase64(bytes), type: outputType, outputQuality: quality });
  }
}

function bytesFromBase64(value) {
  return new Uint8Array(Buffer.from(value, "base64"));
}

function addBytes(parts) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  if (!Number.isSafeInteger(length)) fail("Writer fixture byte assembly exceeded safe arithmetic.");
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}

function crc32(bytes, start, end) {
  let crc = 0xffffffff;
  for (let offset = start; offset < end; offset += 1) {
    crc ^= bytes[offset] ?? 0;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const output = new Uint8Array(data.length + 12);
  output.set(new TextEncoder().encode(type), 4);
  output.set(data, 8);
  const view = new DataView(output.buffer);
  view.setUint32(0, data.length);
  view.setUint32(data.length + 8, crc32(output, 4, data.length + 8));
  return output;
}

function webpChunk(type, data) {
  const output = new Uint8Array(8 + data.length + (data.length & 1));
  output.set(new TextEncoder().encode(type), 0);
  new DataView(output.buffer).setUint32(4, data.length, true);
  output.set(data, 8);
  return output;
}

function jpegC2paCarrier(bytes) {
  const payload = new TextEncoder().encode("JUMBF c2pa manifest-store inventory control");
  const segment = new Uint8Array(payload.length + 4);
  segment.set([0xff, 0xeb, (payload.length + 2) >>> 8, (payload.length + 2) & 0xff]);
  segment.set(payload, 4);
  return addBytes([bytes.subarray(0, 2), segment, bytes.subarray(2)]);
}

function pngC2paCarrier(bytes) {
  const marker = pngChunk("caBX", new TextEncoder().encode("c2pa manifest-store inventory control"));
  const end = bytes.length - 12;
  if (end < 8) fail("PNG C2PA control source is shorter than IEND.");
  return addBytes([bytes.subarray(0, end), marker, bytes.subarray(end)]);
}

function webpC2paCarrier(bytes) {
  const chunk = webpChunk("C2PA", new TextEncoder().encode("c2pa manifest-store inventory control"));
  const output = addBytes([bytes, chunk]);
  const view = new DataView(output.buffer);
  view.setUint32(4, output.length - 8, true);
  return output;
}

function multiset(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([value, count]) => `${value}:${count}`);
}

function jpegSegments(bytes) {
  const segments = [];
  if (bytes.length < 2 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return { segments, scans: 0, frameMarkers: [], comments: 0, progressive: false, trailingBytes: 0, complete: false };
  let cursor = 2;
  let scans = 0;
  const frameMarkers = [];
  let comments = 0;
  let eoi = -1;
  while (cursor < bytes.length) {
    if (bytes[cursor] !== 0xff) return { segments, scans, frameMarkers, comments, progressive: frameMarkers.includes(0xc2), trailingBytes: 0, complete: false };
    while (cursor < bytes.length && bytes[cursor] === 0xff) cursor += 1;
    if (cursor >= bytes.length) break;
    const marker = bytes[cursor] ?? 0;
    cursor += 1;
    if (marker === 0xd9) { eoi = cursor; break; }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (marker === 0xda) {
      if (cursor > bytes.length - 2) break;
      const length = ((bytes[cursor] ?? 0) << 8) | (bytes[cursor + 1] ?? 0);
      const end = cursor + length;
      if (length < 2 || end > bytes.length) break;
      cursor = end;
      scans += 1;
      while (cursor < bytes.length - 1) {
        if (bytes[cursor] !== 0xff) { cursor += 1; continue; }
        let markerCursor = cursor + 1;
        while (markerCursor < bytes.length && bytes[markerCursor] === 0xff) markerCursor += 1;
        const next = bytes[markerCursor] ?? 0;
        if (next === 0 || (next >= 0xd0 && next <= 0xd7)) { cursor = markerCursor + 1; continue; }
        break;
      }
      continue;
    }
    if (cursor > bytes.length - 2) break;
    const length = ((bytes[cursor] ?? 0) << 8) | (bytes[cursor + 1] ?? 0);
    const payloadStart = cursor + 2;
    const end = payloadStart + length - 2;
    if (length < 2 || end > bytes.length) break;
    const payload = bytes.subarray(payloadStart, end);
    segments.push({ marker, payload, hash: sha256(payload) });
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) frameMarkers.push(marker);
    if (marker === 0xfe) comments += 1;
    cursor = end;
  }
  return { segments, scans, frameMarkers, comments, progressive: frameMarkers.includes(0xc2), trailingBytes: eoi < 0 ? 0 : bytes.length - eoi, complete: eoi >= 0 };
}

function isJpegTarget(segment) {
  const text = new TextDecoder().decode(segment.payload.subarray(0, Math.min(segment.payload.length, 64)));
  return segment.marker === 0xfe || text.startsWith("Exif\0\0") || text.startsWith("http://ns.adobe.com/xap/1.0/") || text.startsWith("http://ns.adobe.com/xmp/extension/") || text.startsWith("ICC_PROFILE\0") || text.startsWith("Photoshop 3.0\0") || text.startsWith("MPF\0") || text.startsWith("JUMBF");
}

function pngChunks(bytes) {
  const chunks = [];
  if (bytes.length < 8) return { chunks, complete: false };
  let cursor = 8;
  while (cursor <= bytes.length - 12) {
    const length = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(cursor);
    const end = cursor + 12 + length;
    if (!Number.isSafeInteger(end) || end > bytes.length) return { chunks, complete: false };
    const type = String.fromCharCode(...bytes.subarray(cursor + 4, cursor + 8));
    const data = bytes.subarray(cursor + 8, cursor + 8 + length);
    chunks.push({ type, data, hash: sha256(data) });
    cursor = end;
    if (type === "IEND") return { chunks, complete: cursor === bytes.length };
  }
  return { chunks, complete: false };
}

function isPngTarget(chunk) {
  return ["eXIf", "iTXt", "tEXt", "zTXt", "iCCP"].includes(chunk.type);
}

function webpChunks(bytes) {
  const chunks = [];
  if (bytes.length < 12 || String.fromCharCode(...bytes.subarray(0, 4)) !== "RIFF" || String.fromCharCode(...bytes.subarray(8, 12)) !== "WEBP") return { chunks, complete: false };
  let cursor = 12;
  while (cursor <= bytes.length - 8) {
    const type = String.fromCharCode(...bytes.subarray(cursor, cursor + 4));
    const length = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(cursor + 4, true);
    const end = cursor + 8 + length + (length & 1);
    if (!Number.isSafeInteger(end) || end > bytes.length) return { chunks, complete: false };
    const data = bytes.subarray(cursor + 8, cursor + 8 + length);
    chunks.push({ type, data, hash: sha256(data) });
    cursor = end;
  }
  return { chunks, complete: cursor === bytes.length };
}

function unknownMetadataSignature(format, bytes) {
  if (format === "jpeg") {
    const inventory = jpegSegments(bytes);
    return { complete: inventory.complete, values: multiset(inventory.segments.filter((segment) => !isJpegTarget(segment)).map((segment) => `${segment.marker.toString(16)}:${segment.hash}`)), structure: { scans: inventory.scans, frameMarkers: inventory.frameMarkers, baseline: inventory.frameMarkers.includes(0xc0), comments: inventory.comments, progressive: inventory.progressive, trailingBytes: inventory.trailingBytes } };
  }
  if (format === "png") {
    const inventory = pngChunks(bytes);
    return { complete: inventory.complete, values: multiset(inventory.chunks.filter((chunk) => !isPngTarget(chunk) && chunk.type !== "IDAT" && chunk.type !== "fdAT").map((chunk) => `${chunk.type}:${chunk.hash}`)), structure: { chunkTypes: inventory.chunks.map((chunk) => chunk.type), compressedTextChunks: inventory.chunks.filter((chunk) => ["zTXt", "iTXt"].includes(chunk.type)).length, colorProfileChunks: inventory.chunks.filter((chunk) => chunk.type === "iCCP").length, animationChunks: inventory.chunks.filter((chunk) => ["acTL", "fcTL", "fdAT"].includes(chunk.type)).length } };
  }
  const inventory = webpChunks(bytes);
  return { complete: inventory.complete, values: multiset(inventory.chunks.filter((chunk) => !["EXIF", "XMP ", "ICCP", "VP8X", "VP8 ", "VP8L", "ALPH", "ANMF"].includes(chunk.type)).map((chunk) => `${chunk.type}:${chunk.hash}`)), structure: { chunkTypes: inventory.chunks.map((chunk) => chunk.type), vp8: inventory.chunks.filter((chunk) => chunk.type === "VP8 ").length, vp8l: inventory.chunks.filter((chunk) => chunk.type === "VP8L").length, vp8x: inventory.chunks.filter((chunk) => chunk.type === "VP8X").length, alpha: inventory.chunks.filter((chunk) => chunk.type === "ALPH").length, animation: inventory.chunks.filter((chunk) => chunk.type === "ANMF").length } };
}

function requiredStructureCandidates(format) {
  if (format === "jpeg") return [
    ["baseline", (structure) => structure.baseline === true],
    ["progressive", (structure) => structure.progressive === true],
    ["multi-scan", (structure) => structure.scans >= 2],
    ["comments", (structure) => structure.comments > 0],
    ["trailing-bytes", (structure) => structure.trailingBytes > 0],
  ];
  if (format === "png") return [
    ["APNG animation", (structure) => structure.animationChunks > 0],
    ["compressed text", (structure) => structure.compressedTextChunks > 0],
    ["embedded color profile", (structure) => structure.colorProfileChunks > 0],
  ];
  return [
    ["VP8", (structure) => structure.vp8 > 0],
    ["VP8L", (structure) => structure.vp8l > 0],
    ["VP8X", (structure) => structure.vp8x > 0],
    ["alpha", (structure) => structure.alpha > 0],
    ["animation", (structure) => structure.animation > 0],
  ];
}

function selectRepresentativeCandidates(format, candidates) {
  const selected = [];
  const selectedPaths = new Set();
  for (const [label, predicate] of requiredStructureCandidates(format)) {
    const candidate = candidates.find((item) => !selectedPaths.has(item.relativePath) && predicate(unknownMetadataSignature(format, item.bytes).structure));
    if (candidate === undefined) fail(`No eligible ${format} fixture provides required ${label} structure evidence.`);
    selected.push(candidate);
    selectedPaths.add(candidate.relativePath);
  }
  for (const candidate of candidates) {
    if (selected.length >= minimumPerFamily) break;
    if (!selectedPaths.has(candidate.relativePath)) {
      selected.push(candidate);
      selectedPaths.add(candidate.relativePath);
    }
  }
  if (selected.length < minimumPerFamily) fail(`Only ${selected.length} eligible ${format} fixtures were available after required structure selection; ${minimumPerFamily} are required.`);
  return selected;
}

function metadataPresence(format, bytes) {
  if (format === "jpeg") {
    const inventory = jpegSegments(bytes);
    return { EXIF: inventory.segments.some((segment) => new TextDecoder().decode(segment.payload.subarray(0, 6)) === "Exif\0\0"), XMP: inventory.segments.some((segment) => new TextDecoder().decode(segment.payload.subarray(0, 32)).startsWith("http://ns.adobe.com/xap/1.0/")), IPTC: inventory.segments.some((segment) => new TextDecoder().decode(segment.payload.subarray(0, 14)).startsWith("Photoshop 3.0")), ICC: inventory.segments.some((segment) => new TextDecoder().decode(segment.payload.subarray(0, 12)).startsWith("ICC_PROFILE")), JFIF: inventory.segments.some((segment) => new TextDecoder().decode(segment.payload.subarray(0, 5)) === "JFIF\0") };
  }
  if (format === "png") {
    const chunks = pngChunks(bytes).chunks;
    return { EXIF: chunks.some((chunk) => chunk.type === "eXIf"), XMP: chunks.some((chunk) => chunk.type === "iTXt"), ICC: chunks.some((chunk) => chunk.type === "iCCP"), PNGText: chunks.some((chunk) => ["tEXt", "zTXt", "iTXt"].includes(chunk.type)) };
  }
  const chunks = webpChunks(bytes).chunks;
  return { EXIF: chunks.some((chunk) => chunk.type === "EXIF"), XMP: chunks.some((chunk) => chunk.type === "XMP "), ICC: chunks.some((chunk) => chunk.type === "ICCP") };
}

function writerFor(format) {
  if (format === "jpeg") return (bytes, blocks, options = {}) => rewriteJpegMetadata(bytes, { ...options, blocks });
  if (format === "png") return (bytes, blocks, options = {}) => rewritePngMetadata(bytes, { ...options, blocks });
  return (bytes, blocks, options = {}) => rewriteWebpMetadata(bytes, { ...options, blocks });
}

function blockFor(format, op, data) {
  if (format === "jpeg") return { op, kind: "standard-xmp", data };
  if (format === "png") return { op, kind: "xmp", data };
  return { op, kind: "xmp", data };
}

function operationBlocks(format, operation) {
  if (operation === "add-xmp") return [blockFor(format, "add", XMP_PREFIX)];
  if (operation === "add-large-xmp") return [blockFor(format, "add", XMP_LARGE)];
  if (operation === "add-secondary-metadata") {
    if (format === "png") return [blockFor(format, "add", XMP_PREFIX), { op: "add", kind: "text", keyword: "Stage5", data: "unknown metadata remains explicit" }];
    return [blockFor(format, "add", XMP_PREFIX)];
  }
  return [blockFor(format, "add", XMP_PREFIX)];
}

async function eligibleCandidates(candidates, format, decoders) {
  const eligible = [];
  const rejected = [];
  for (const candidate of candidates.filter(({ path: filePath }) => formatExtensions.get(format).has(extname(filePath).toLowerCase())).sort((left, right) => left.relativePath.localeCompare(right.relativePath))) {
    const bytes = await readFile(candidate.path);
    if (bytes.length > maximumFixtureBytes) { rejected.push({ fixture: candidate.relativePath, reason: "fixture-byte-limit" }); continue; }
    const packageResult = await parseMetadata(bytes);
    if (packageResult.format !== format || packageResult.dimensions === null) { rejected.push({ fixture: candidate.relativePath, reason: "package-format-or-dimensions-unsupported" }); continue; }
    const decoded = {};
    let decoderRejected = false;
    for (const name of ["chromium", "firefox"]) {
      decoded[name] = await decoders.decode(name, bytes, mimeForFormat[format]);
      if (decoded[name].status !== "decoded") decoderRejected = true;
    }
    if (decoderRejected || decoded.chromium.width !== packageResult.dimensions.width || decoded.chromium.height !== packageResult.dimensions.height || decoded.firefox.width !== packageResult.dimensions.width || decoded.firefox.height !== packageResult.dimensions.height) {
      rejected.push({ fixture: candidate.relativePath, reason: "independent-decoder-or-dimension-mismatch" });
      continue;
    }
    const sourceHash = sha256(bytes);
    try {
      const preflight = await writerFor(format)(bytes, operationBlocks(format, "add-xmp"));
      assert(preflight.data instanceof Uint8Array && preflight.preservation?.successful === true, "writer-preflight-did-not-produce-verified-output");
    } catch (error) {
      assert(sha256(bytes) === sourceHash, `${candidate.relativePath} writer preflight modified source bytes before rejection.`);
      rejected.push({ fixture: candidate.relativePath, reason: "writer-preflight-rejected", failure: typedFailure(error) });
      continue;
    }
    eligible.push({ ...candidate, format, bytes, sha256: sha256(bytes), byteLength: bytes.length, packageDimensions: packageResult.dimensions, decoded, metadataPresence: metadataPresence(format, bytes) });
  }
  return { eligible, rejected };
}

async function deriveCandidates(pngCandidates, format, needed, decoders, derivedDirectory) {
  const derived = [];
  for (const source of pngCandidates.slice(0, needed)) {
    const encoded = await decoders.encodeFromPng(source.bytes, mimeForFormat[format], manifest.derivedPolicy[format === "jpeg" ? "jpegQuality" : "webpQuality"]);
    const bytes = bytesFromBase64(encoded.encoded);
    if (bytes.length === 0 || bytes.length > maximumFixtureBytes) continue;
    const packageResult = await parseMetadata(bytes);
    if (packageResult.format !== format || packageResult.dimensions === null || packageResult.dimensions.width !== source.packageDimensions.width || packageResult.dimensions.height !== source.packageDimensions.height) continue;
    const candidatePath = join(derivedDirectory, `${format}-${String(derived.length + 1).padStart(4, "0")}.${format === "jpeg" ? "jpg" : "webp"}`);
    await writeFile(candidatePath, bytes);
    const decoded = {};
    let rejected = false;
    for (const name of ["chromium", "firefox"]) {
      decoded[name] = await decoders.decode(name, bytes, mimeForFormat[format]);
      if (decoded[name].status !== "decoded") rejected = true;
    }
    if (rejected || decoded.chromium.width !== source.packageDimensions.width || decoded.chromium.height !== source.packageDimensions.height || decoded.firefox.width !== source.packageDimensions.width || decoded.firefox.height !== source.packageDimensions.height) continue;
    derived.push({
      path: candidatePath,
      sourceId: "web-platform-tests",
      sourceRoot: ".",
      relativePath: `derived-from-real/web-platform-tests/${source.relativePath}`,
      origin: "derived-from-real",
      derivedFrom: { fixture: source.relativePath, sha256: source.sha256, byteLength: source.byteLength },
      format,
      bytes,
      sha256: sha256(bytes),
      byteLength: bytes.length,
      packageDimensions: packageResult.dimensions,
      decoded,
      metadataPresence: metadataPresence(format, bytes),
    });
  }
  return derived;
}

function normalizeOracleValue(value) {
  if (Array.isArray(value)) return value.map(normalizeOracleValue);
  if (value !== null && typeof value === "object") return JSON.stringify(value);
  return value;
}

async function oracleCheck(path, expectedMarker) {
  const values = await exiftool.read(path, { readArgs: ["-G1", "-n"] });
  const result = Array.isArray(values) ? values[0] ?? {} : values;
  const errors = (Array.isArray(result.errors) ? result.errors : []).map(String);
  const warnings = (Array.isArray(result.warnings) ? result.warnings : []).map(String);
  if (errors.length > 0) return { success: false, status: "failed", errors, warnings };
  const marker = normalizeOracleValue(result["XMP-xmp:CreatorTool"] ?? result["XMP:CreatorTool"]);
  const markerValues = Array.isArray(marker) ? marker.map(String) : [marker === undefined ? null : String(marker)];
  const expected = expectedMarker === null ? !markerValues.includes("browser-image-metadata-stage5") : markerValues.includes(expectedMarker);
  return {
    success: expected,
    status: expected ? warnings.length > 0 ? "passed-with-warnings" : "passed" : "failed",
    errors: expected ? [] : ["independent-oracle-did-not-expose-requested-XMP-marker"],
    warnings,
    marker: markerValues,
  };
}

function payloadEvidence(report, input, output) {
  assert(report !== null && report.successful === true, "Writer preservation evidence was unavailable or unsuccessful.");
  assert(report.payloadSummary.protectedCount > 0, "Writer reported no protected encoded image payload.");
  assert(report.payloadSummary.comparableCount === report.payloadSummary.protectedCount, "Writer payload comparison was not fully comparable.");
  assert(report.payloadSummary.matchedCount === report.payloadSummary.protectedCount, "Writer changed an encoded image payload.");
  assert(report.payloadSummary.mismatchedCount === 0 && report.payloadSummary.missingBeforeCount === 0 && report.payloadSummary.missingAfterCount === 0 && report.payloadSummary.nonComparableCount === 0, "Writer payload preservation was incomplete.");
  return report.payloads.map((payload) => {
    assert(payload.status === "matched" && payload.before !== null && payload.after !== null, `Payload ${payload.id} was not matched.`);
    assert(payload.before.sha256 === sha256(input.subarray(payload.before.offset, payload.before.offset + payload.before.length)), `Before payload hash for ${payload.id} is incorrect.`);
    assert(payload.after.sha256 === sha256(output.subarray(payload.after.offset, payload.after.offset + payload.after.length)), `After payload hash for ${payload.id} is incorrect.`);
    assert(payload.before.sha256 === payload.after.sha256, `Payload ${payload.id} changed during a metadata-only write.`);
    return { id: payload.id, kind: payload.kind, status: payload.status, before: payload.before, after: payload.after };
  });
}

function assertUnknownPreservation(format, input, output) {
  const before = unknownMetadataSignature(format, input);
  const after = unknownMetadataSignature(format, output);
  assert(before.complete && after.complete, `${format} unknown metadata inventory was incomplete.`);
  assert(JSON.stringify(before.values) === JSON.stringify(after.values), `${format} unknown metadata changed during the default metadata-only operation.`);
  return { preserved: true, beforeCount: before.values.length, afterCount: after.values.length, structureBefore: before.structure, structureAfter: after.structure };
}

function editPayloadEvidence(result, input, output, label) {
  assert(result.successful === true && result.output?.generated === true, `${label} did not produce typed output evidence.`);
  assert(result.verification.status === "passed", `${label} did not pass its configured verification.`);
  assert(result.output.sha256 === sha256(output) && result.input.sha256 === sha256(input), `${label} reported incorrect input/output hashes.`);
  assert(result.output.payloads.length > 0 && result.output.payloads.every((payload) => payload.comparable && payload.beforeSha256 !== null && payload.afterSha256 !== null && payload.beforeSha256 === payload.afterSha256), `${label} did not preserve every encoded image payload.`);
  return result.output.payloads.map((payload) => ({ payloadId: payload.payloadId, comparable: payload.comparable, beforeSha256: payload.beforeSha256, afterSha256: payload.afterSha256 }));
}

async function runEditOutput(candidate, format, label, input, result, expectedOrientation, expectedMake, decoders, oracleDirectory) {
  assert(result.successful === true, `${candidate.relativePath} ${label} was not applied: ${result.diagnostics.map((diagnostic) => diagnostic.detail).join(" ")}`);
  const output = result.data;
  assert(sha256(input) === result.input.sha256, `${candidate.relativePath} ${label} input hash changed before commit.`);
  const parsed = await parseMetadata(output);
  assert(parsed.format === format && parsed.dimensions !== null, `${candidate.relativePath} ${label} did not reparse as ${format}.`);
  assert(JSON.stringify(parsed.dimensions) === JSON.stringify(candidate.packageDimensions), `${candidate.relativePath} ${label} changed dimensions.`);
  const orientation = parsed.fields.find((field) => field.name === "Orientation")?.value;
  const make = parsed.fields.find((field) => field.name === "Make")?.value;
  assert(orientation === expectedOrientation, `${candidate.relativePath} ${label} has orientation ${String(orientation)}, expected ${String(expectedOrientation)}.`);
  if (expectedMake === null || expectedMake === undefined) assert(make === undefined, `${candidate.relativePath} ${label} unexpectedly exposed Make metadata.`);
  else assert(make === expectedMake, `${candidate.relativePath} ${label} has Make ${String(make)}, expected ${expectedMake}.`);
  const decoded = {};
  const displayDimensions = expectedOrientation !== undefined && [5, 6, 7, 8].includes(expectedOrientation)
    ? { width: candidate.packageDimensions.height, height: candidate.packageDimensions.width }
    : candidate.packageDimensions;
  for (const name of ["chromium", "firefox"]) {
    decoded[name] = await decoders.decode(name, output, mimeForFormat[format]);
    assert(decoded[name].status === "decoded" && decoded[name].width === displayDimensions.width && decoded[name].height === displayDimensions.height, `${candidate.relativePath} ${label} failed ${name} decoding or display dimensions.`);
  }
  const payloads = editPayloadEvidence(result, input, output, `${candidate.relativePath} ${label}`);
  const unknownMetadata = assertUnknownPreservation(format, input, output);
  const outputPath = join(oracleDirectory, `${sha256(output)}.${outputExtension(format)}`);
  await writeFile(outputPath, output);
  const oracleValues = await exiftool.read(outputPath, { readArgs: ["-G1", "-n"] });
  await rm(outputPath, { force: true });
  const oracle = Array.isArray(oracleValues) ? oracleValues[0] ?? {} : oracleValues;
  const errors = (Array.isArray(oracle.errors) ? oracle.errors : []).map(String);
  const warnings = (Array.isArray(oracle.warnings) ? oracle.warnings : []).map(String);
  assert(errors.length === 0, `${candidate.relativePath} ${label} independent oracle failed: ${errors.join(" ")}`);
  if (expectedOrientation === undefined) assert(oracle["IFD0:Orientation"] === undefined, `${candidate.relativePath} ${label} independent oracle retained Orientation.`);
  else assert(Number(oracle["IFD0:Orientation"]) === expectedOrientation, `${candidate.relativePath} ${label} independent oracle reported the wrong orientation.`);
  if (expectedMake === null || expectedMake === undefined) assert(oracle["IFD0:Make"] === undefined, `${candidate.relativePath} ${label} independent oracle exposed Make.`);
  else assert(String(oracle["IFD0:Make"]) === expectedMake, `${candidate.relativePath} ${label} independent oracle reported the wrong Make.`);
  return { label, inputSha256: sha256(input), outputSha256: sha256(output), inputByteLength: input.length, outputByteLength: output.length, packageReparse: { format: parsed.format, storedDimensions: parsed.dimensions, displayDimensions, orientation, make }, decoded, independentOracle: { status: warnings.length > 0 ? "passed-with-warnings" : "passed", warnings, orientation: expectedOrientation, make: expectedMake }, payloads, unknownMetadata, byteChanges: result.output.byteChanges };
}

async function runOrientationControls(eligibleByFormat, decoders, oracleDirectory) {
  const controls = [];
  for (const format of ["jpeg", "png", "webp"]) {
    const orientationCandidates = format === "png"
      ? eligibleByFormat[format].filter((item) => unknownMetadataSignature(format, item.bytes).structure.animationChunks === 0)
      : eligibleByFormat[format];
    const candidate = orientationCandidates.find(({ metadataPresence }) => metadataPresence.EXIF !== true) ?? orientationCandidates[0];
    assert(candidate !== undefined, `No ${format} fixture exists for orientation controls.`);
    const added = await editMetadata(candidate.bytes, { verifyImagePayload: true, policy: { orientation: "allow-change" }, operations: [{ operationId: `${format}-orientation-initial`, op: "set", target: { kind: "field", fieldId: "normalized:Orientation" }, value: 6 }] });
    const initialRecord = await runEditOutput(candidate, format, "orientation-initialized", candidate.bytes, added, 6, undefined, decoders, oracleDirectory);
    const unrelated = await editMetadata(added.data, { verifyImagePayload: true, operations: [{ operationId: `${format}-unrelated-make`, op: "set", target: { kind: "field", fieldId: "normalized:Make" }, value: "Changed" }] });
    const unrelatedRecord = await runEditOutput(candidate, format, "orientation-preserved-during-unrelated-edit", added.data, unrelated, 6, "Changed", decoders, oracleDirectory);
    const changed = await editMetadata(unrelated.data, { verifyImagePayload: true, policy: { orientation: "allow-change" }, operations: [{ operationId: `${format}-orientation-change`, op: "set", target: { kind: "field", fieldId: "normalized:Orientation" }, value: 3 }] });
    const changedRecord = await runEditOutput(candidate, format, "orientation-explicitly-changed", unrelated.data, changed, 3, "Changed", decoders, oracleDirectory);
    const deleted = await editMetadata(changed.data, { verifyImagePayload: true, policy: { orientation: "allow-change" }, operations: [{ operationId: `${format}-orientation-delete`, op: "delete", target: { kind: "field", fieldId: "normalized:Orientation" } }] });
    const deletedRecord = await runEditOutput(candidate, format, "orientation-explicitly-deleted", changed.data, deleted, undefined, "Changed", decoders, oracleDirectory);
    controls.push({ format, source: candidate.relativePath, sourceSha256: candidate.sha256, initialOrientation: initialRecord, unrelated: unrelatedRecord, changed: changedRecord, deleted: deletedRecord });
  }
  return controls;
}

function outputExtension(format) {
  return format === "jpeg" ? "jpg" : format;
}

async function runOutput(candidate, format, operation, decoders, oracleDirectory, blocks = operationBlocks(format, operation), expectedMarker = "browser-image-metadata-stage5") {
  const input = candidate.bytes;
  const sourceHash = sha256(input);
  const beforeMetadata = await parseMetadata(input);
  const writer = writerFor(format);
  let result;
  try {
    result = await writer(input, blocks);
  } catch (error) {
    fail(`${candidate.relativePath} ${operation} writer failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  assert(sha256(input) === sourceHash, `${candidate.relativePath} writer modified caller-owned source bytes.`);
  assert(result !== null && result.data instanceof Uint8Array, `${candidate.relativePath} ${operation} produced no output bytes.`);
  const output = result.data;
  assert(output.length <= maximumOracleBytes, `${candidate.relativePath} output exceeds the bounded oracle size.`);
  const afterMetadata = await parseMetadata(output);
  assert(afterMetadata.format === format && afterMetadata.dimensions !== null, `${candidate.relativePath} output did not reparse as ${format}.`);
  assert(JSON.stringify(afterMetadata.dimensions) === JSON.stringify(beforeMetadata.dimensions), `${candidate.relativePath} dimensions changed during metadata-only writing.`);
  const decoded = {};
  for (const name of ["chromium", "firefox"]) {
    decoded[name] = await decoders.decode(name, output, mimeForFormat[format]);
    assert(decoded[name].status === "decoded", `${candidate.relativePath} output failed ${name} image decoding.`);
    assert(decoded[name].width === candidate.packageDimensions.width && decoded[name].height === candidate.packageDimensions.height, `${candidate.relativePath} ${name} output dimensions changed.`);
  }
  const payloads = payloadEvidence(result.preservation, input, output);
  const unknown = assertUnknownPreservation(format, input, output);
  const outputPath = join(oracleDirectory, `${sha256(output)}.${outputExtension(format)}`);
  await writeFile(outputPath, output);
  const oracle = await oracleCheck(outputPath, expectedMarker);
  await rm(outputPath, { force: true });
  assert(oracle.success, `${candidate.relativePath} independent metadata oracle failed: ${oracle.errors.join(" ")}`);
  return {
    operation,
    inputSha256: sourceHash,
    outputSha256: sha256(output),
    inputByteLength: input.length,
    outputByteLength: output.length,
    packageReparse: { format: afterMetadata.format, dimensions: afterMetadata.dimensions, blockFamilies: [...new Set(afterMetadata.blocks.map((block) => block.family))].sort() },
    decoded,
    independentOracle: { status: oracle.status, warnings: oracle.warnings, marker: oracle.marker ?? null },
    payloads,
    payloadCount: payloads.length,
    unknownMetadata: unknown,
    byteChanges: result.byteChanges,
  };
}

async function runOperationMatrix(candidate, format, index, decoders, oracleDirectory) {
  const records = [];
  if (index < 6) {
    records.push(await runOutput(candidate, format, "add-xmp", decoders, oracleDirectory));
    const added = await writerFor(format)(candidate.bytes, operationBlocks(format, "add-xmp"));
    const addedMetadata = await parseMetadata(added.data);
    const addedBlocks = addedMetadata.blocks.filter((block) => block.family === "XMP");
    const addedPacketIndex = addedMetadata.xmp?.packets.findIndex((packet) => packet.includes("browser-image-metadata-stage5")) ?? -1;
    const addedBlock = addedBlocks[addedPacketIndex] ?? addedBlocks[0];
    assert(addedBlock !== undefined, `${candidate.relativePath} did not expose the added XMP block for replacement.`);
    const replacement = format === "jpeg" ? { op: "replace", kind: "standard-xmp", blockId: addedBlock.id, data: XMP_REPLACEMENT } : { op: "replace", kind: "xmp", blockId: addedBlock.id, data: XMP_REPLACEMENT };
    const replaced = await writerFor(format)(added.data, [replacement]);
    assert(sha256(added.data) !== sha256(replaced.data), `${candidate.relativePath} replacement did not change metadata.`);
    const replaceCandidate = { ...candidate, bytes: added.data, packageDimensions: candidate.packageDimensions };
    records.push(await runOutput(replaceCandidate, format, "replace-xmp", decoders, oracleDirectory, [replacement], "browser-image-metadata-stage5-replaced"));
    const removeKind = format === "jpeg" ? "standard-xmp" : "xmp";
    const replacedMetadata = await parseMetadata(replaced.data);
    const replacedBlocks = replacedMetadata.blocks.filter((block) => block.family === "XMP");
    const replacedPacketIndex = replacedMetadata.xmp?.packets.findIndex((packet) => packet.includes("browser-image-metadata-stage5-replaced")) ?? -1;
    const replacedBlock = replacedBlocks[replacedPacketIndex] ?? replacedBlocks[0];
    assert(replacedBlock !== undefined, `${candidate.relativePath} did not expose the replaced XMP block for deletion.`);
    const removeBlock = { op: "remove", kind: removeKind, blockId: replacedBlock.id };
    const removed = await writerFor(format)(replaced.data, [removeBlock]);
    const removeCandidate = { ...candidate, bytes: replaced.data, packageDimensions: candidate.packageDimensions };
    records.push(await runOutput(removeCandidate, format, "remove-xmp", decoders, oracleDirectory, [removeBlock], null));
    const removedMetadata = await parseMetadata(removed.data);
    assert(removedMetadata.blocks.every((block) => block.id !== addedBlock.id), `${candidate.relativePath} explicit XMP removal left its selected block.`);
    assert(removedMetadata.xmp?.packets.every((packet) => !packet.includes("browser-image-metadata-stage5")) ?? true, `${candidate.relativePath} explicit XMP removal left the Stage 5 marker.`);
  } else if (index === 6) {
    records.push(await runOutput(candidate, format, "add-large-xmp", decoders, oracleDirectory));
  } else if (index === 7) {
    records.push(await runOutput(candidate, format, "add-secondary-metadata", decoders, oracleDirectory));
  } else {
    records.push(await runOutput(candidate, format, "add-xmp", decoders, oracleDirectory));
  }
  return records;
}

async function runMalformedControls(eligibleByFormat) {
  const controls = [];
  for (const format of ["jpeg", "png", "webp"]) {
    const candidate = eligibleByFormat[format][0];
    assert(candidate !== undefined, `No ${format} fixture exists for malformed-input controls.`);
    const truncated = candidate.bytes.slice(0, -1);
    const beforeHash = sha256(truncated);
    const writer = writerFor(format);
    let refused = false;
    let errorRecord = null;
    try { await writer(truncated, operationBlocks(format, "add-xmp")); }
    catch (error) { refused = true; errorRecord = { name: error instanceof Error ? error.name : "UnknownError", code: error?.code ?? null, message: error instanceof Error ? error.message : String(error) }; }
    assert(refused, `${format} truncated control unexpectedly succeeded.`);
    assert(sha256(truncated) === beforeHash, `${format} truncated control changed its original bytes.`);
    controls.push({ format, source: candidate.relativePath, sourceSha256: candidate.sha256, inputSha256: beforeHash, refused, error: errorRecord });
  }
  return controls;
}

async function runCarrierControls(eligibleByFormat) {
  const controls = [];
  const carriers = { jpeg: jpegC2paCarrier, png: pngC2paCarrier, webp: webpC2paCarrier };
  for (const format of ["jpeg", "png", "webp"]) {
    const candidate = eligibleByFormat[format][0];
    assert(candidate !== undefined, `No ${format} fixture exists for C2PA carrier controls.`);
    const input = carriers[format](candidate.bytes);
    const beforeHash = sha256(input);
    const writer = writerFor(format);
    let refused = false;
    let errorRecord = null;
    try { await writer(input, operationBlocks(format, "add-xmp")); }
    catch (error) { refused = true; errorRecord = { name: error instanceof Error ? error.name : "UnknownError", code: error?.code ?? null, message: error instanceof Error ? error.message : String(error) }; }
    assert(refused, `${format} C2PA-bearing input unexpectedly succeeded under the default policy.`);
    assert(sha256(input) === beforeHash, `${format} C2PA control changed source bytes.`);
    let explicit;
    try {
      const preserved = await writer(input, operationBlocks(format, "add-xmp"), { c2pa: "preserve" });
      const reparsed = await parseMetadata(preserved.data);
      assert(reparsed.format === format && reparsed.dimensions !== null, `${format} explicit C2PA preservation did not reparse.`);
      assert(preserved.preservation?.successful === true, `${format} explicit C2PA preservation did not verify payloads.`);
      explicit = { status: "passed", outputSha256: sha256(preserved.data), payloadCount: preserved.preservation.payloadSummary.matchedCount };
    } catch (error) {
      explicit = { status: "failed", error: error instanceof Error ? error.message : String(error) };
    }
    assert(explicit.status === "passed", `${format} explicit C2PA preservation failed.`);
    controls.push({ format, source: candidate.relativePath, sourceSha256: candidate.sha256, carrierSha256: beforeHash, defaultPolicy: { refused, error: errorRecord }, explicitPolicyTested: true, explicitPolicy: "preserve", explicitResult: explicit });
  }
  return controls;
}

async function runProtectedControls() {
  if (typeof protectedDirectoryValue !== "string" || protectedDirectoryValue.length === 0) fail("WRITER_PROTECTED_CORPUS_DIR is required; MPF and Ultra HDR controls must execute against the temporary hash-pinned T05 corpus.");
  const protectedDirectory = resolve(protectedDirectoryValue);
  await requireDirectory(protectedDirectory, "writer protected corpus");
  const protectedManifest = JSON.parse(await readFile(join(root, "data/mpf/reference-corpus.json"), "utf8"));
  const controls = [];
  for (const fixture of protectedManifest.fixtures) {
    if (!fixture.fileName.endsWith(".jpg") && !fixture.fileName.endsWith(".mpo")) continue;
    const path = join(protectedDirectory, fixture.fileName);
    await requireDirectory(protectedDirectory, "writer protected corpus");
    let input;
    try { input = await readFile(path); } catch (error) { fail(`Protected fixture is missing: ${fixture.fileName}`, error); }
    const hash = sha256(input);
    assert(hash === fixture.sha256, `${fixture.fileName} protected fixture hash mismatch.`);
    const writer = rewriteJpegMetadata;
    let refused = false;
    let errorRecord = null;
    try { writer(input, { blocks: [{ op: "add", kind: "standard-xmp", data: XMP_PREFIX }] }); }
    catch (error) { refused = true; errorRecord = { name: error instanceof Error ? error.name : "UnknownError", code: error?.code ?? null, message: error instanceof Error ? error.message : String(error) }; }
    assert(refused, `${fixture.fileName} protected input unexpectedly succeeded under the default policy.`);
    assert(sha256(input) === hash, `${fixture.fileName} default-refusal path changed source bytes.`);
    let explicit;
    try {
      const preserved = writer(input, { blocks: [{ op: "add", kind: "standard-xmp", data: XMP_PREFIX }], mpf: { mode: "preserve" } });
      const reparsed = await parseMetadata(preserved.data);
      assert(reparsed.format === "jpeg" && reparsed.mpf?.complete === true, `${fixture.fileName} explicit MPF preservation did not reparse completely.`);
      assert(preserved.preservation?.successful === true, `${fixture.fileName} explicit MPF preservation did not verify encoded payloads.`);
      explicit = { status: "passed", outputSha256: sha256(preserved.data), payloadCount: preserved.preservation.payloadSummary.matchedCount };
    } catch (error) {
      explicit = { status: "refused-safe", error: { name: error instanceof Error ? error.name : "UnknownError", code: error?.code ?? null, message: error instanceof Error ? error.message : String(error) } };
    }
    if (fixture.kind === "cipa-mpf") assert(explicit.status === "passed", `${fixture.fileName} explicit MPF preservation failed.`);
    else assert(explicit.status === "passed" || explicit.status === "refused-safe", `${fixture.fileName} explicit Ultra HDR policy produced an unclassified result.`);
    controls.push({ fixture: fixture.fileName, kind: fixture.kind, sha256: hash, defaultPolicy: { refused, error: errorRecord }, explicitPolicy: "mpf-preserve", explicitResult: explicit, explicitPolicyOutcome: explicit.status === "passed" ? "preserved-and-verified" : "safe-typed-refusal-before-output" });
  }
  assert(controls.length >= 3, "MPF/Ultra HDR protected controls did not participate completely.");
  return controls;
}

function summarizeFamily(records) {
  const operations = records.flatMap((record) => record.outputs);
  return {
    fixtures: records.length,
    successfulOutputs: operations.length,
    payloads: operations.reduce((total, operation) => total + operation.payloadCount, 0),
    payloadsMatched: operations.reduce((total, operation) => total + operation.payloads.filter((payload) => payload.status === "matched").length, 0),
    unknownMetadataPreserved: operations.filter((operation) => operation.unknownMetadata.preserved).length,
    independentOraclePassed: operations.filter((operation) => operation.independentOracle.status === "passed" || operation.independentOracle.status === "passed-with-warnings").length,
    browserDecodedByChromium: operations.filter((operation) => operation.decoded.chromium.status === "decoded").length,
    browserDecodedByFirefox: operations.filter((operation) => operation.decoded.firefox.status === "decoded").length,
    metadataPresence: records.reduce((counts, record) => { for (const [key, value] of Object.entries(record.metadataPresence)) counts[key] = (counts[key] ?? 0) + (value ? 1 : 0); return counts; }, {}),
    origins: records.reduce((counts, record) => { counts[record.origin] = (counts[record.origin] ?? 0) + 1; return counts; }, {}),
    sourceIds: [...new Set(records.map((record) => record.sourceId ?? record.origin))].sort(),
    operationsByClass: operations.reduce((counts, operation) => { counts[operation.operation] = (counts[operation.operation] ?? 0) + 1; return counts; }, {}),
    containerStructure: records.reduce((counts, record) => { const structure = record.containerStructure; for (const key of ["baseline", "progressive", "scans", "comments", "trailingBytes", "compressedTextChunks", "colorProfileChunks", "animationChunks", "vp8", "vp8l", "vp8x", "alpha", "animation"]) if (typeof structure[key] === "boolean" ? structure[key] : typeof structure[key] === "number" && (key === "scans" ? structure[key] >= 2 : structure[key] > 0)) counts[key] = (counts[key] ?? 0) + 1; return counts; }, {}),
  };
}

function renderMarkdown(report) {
  const lines = [
    "# Roadmap-wide writer corpus evidence",
    "",
    `- Schema: \`${report.schema}\``,
    `- Status: **${report.gate.passed ? "PASS" : "FAIL"}**`,
    `- Package: ${report.package.name} ${report.package.version}`,
    `- ExifTool oracle: ${report.independentOracle.package}@${report.independentOracle.packageVersion}, ExifTool ${report.independentOracle.version}`,
    `- Browser decoders: Chromium ${report.decoders.chromium.version} (BSD-derived Chromium license) and Firefox ${report.decoders.firefox.version} (MPL-2.0) through Playwright ${report.decoders.playwright.packageVersion} (Apache-2.0)`,
    `- Normalization: ${report.normalizationPolicy.id}; ${report.normalizationPolicy.text}`,
    "",
    "## Corpus provenance",
    "",
    ...report.sources.map((source) => `- ${source.id}: ${source.repository} @ \`${source.commit}\`; ${source.license}; ${source.fixtureCount} participating source fixtures`),
    `- Derived-real policy: ${report.derivedPolicy.description}`,
    "",
    "## Family gate",
    "",
    "| family | fixtures | successful outputs | payloads | payloads matched | oracle passed | Chromium decoded | Firefox decoded | unknown preserved |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...Object.entries(report.families).map(([format, family]) => `| ${format} | ${family.fixtures} | ${family.successfulOutputs} | ${family.payloads} | ${family.payloadsMatched} | ${family.independentOraclePassed} | ${family.browserDecodedByChromium} | ${family.browserDecodedByFirefox} | ${family.unknownMetadataPreserved} |`),
    "",
    "## Required structure participation",
    "",
    "The selected fixtures must include each required structure; counts are participating fixtures, not merely available corpus candidates.",
    "",
    "| family | baseline | progressive | multi-scan | comments | trailing bytes | APNG animation | compressed text | color profile | VP8 | VP8L | VP8X | alpha | animation |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...["jpeg", "png", "webp"].map((format) => { const structure = report.gate.requiredStructureCoverage?.[format] ?? {}; return `| ${format} | ${structure.baseline ?? 0} | ${structure.progressive ?? 0} | ${structure.scans ?? 0} | ${structure.comments ?? 0} | ${structure.trailingBytes ?? 0} | ${structure.animationChunks ?? 0} | ${structure.compressedTextChunks ?? 0} | ${structure.colorProfileChunks ?? 0} | ${structure.vp8 ?? 0} | ${structure.vp8l ?? 0} | ${structure.vp8x ?? 0} | ${structure.alpha ?? 0} | ${structure.animation ?? 0} |`; }),
    "",
    "## Failure and protected-structure controls",
    "",
    `- Truncated-input controls: ${report.controls.malformed.map((control) => `${control.format} refused (${control.error?.code ?? "typed-error"})`).join(", ")}`,
    `- C2PA default-refusal controls: ${report.controls.c2pa.map((control) => `${control.format} refused (${control.defaultPolicy.error?.code ?? "typed-error"})`).join(", ")}`,
    `- MPF/Ultra HDR default-refusal controls: ${report.controls.protected.map((control) => `${control.fixture} refused (${control.defaultPolicy.error?.code ?? "typed-error"})`).join(", ")}`,
    `- Orientation controls: ${report.controls.orientation.map((control) => `${control.format} preservation/change/deletion passed`).join(", ")}`,
    "",
    "All report rows retain fixture-relative identity, byte lengths, SHA-256 values, operation results, exact byte-change ranges, payload ranges/hashes, package reparsing, oracle status, decoder dimensions, and typed failure details. Image bytes and output copies are temporary only and are not present in this report.",
    "",
  ];
  return `${lines.join("\n")}\n`;
}

const { candidates, revisions } = await collectSourceFiles();
const temporaryRoot = await mkdtemp(join(tmpdir(), "image-metadata-toolkit-writer-corpus-"));
const derivedDirectory = join(temporaryRoot, "derived");
const oracleDirectory = join(temporaryRoot, "oracle");
await mkdir(derivedDirectory, { recursive: true });
await mkdir(oracleDirectory, { recursive: true });
const decoders = new BrowserDecoders();
const report = {
  schema: "browser-image-metadata.writer-corpus-evidence.v1",
  generatedAt: new Date().toISOString(),
  package: { name: packageManifest.name, version: packageManifest.version },
  independentOracle: { package: "exiftool-vendored", packageVersion: expectedExifToolPackageVersion, version: null, license: "Artistic License 1.0 / GPL-1.0-or-later", provenance: "https://exiftool.org/; secondary metadata output oracle only" },
  decoders: { playwright: { package: "@playwright/test", packageVersion: packageManifest.devDependencies?.["@playwright/test"] ?? null, license: "Apache-2.0", provenance: "https://playwright.dev/" }, chromium: { version: null, implementation: "Chromium native image decoder", license: "BSD-derived Chromium license" }, firefox: { version: null, implementation: "Firefox native image decoder", license: "MPL-2.0" } },
  sources: [],
  revisions,
  derivedPolicy: manifest.derivedPolicy,
  normalizationPolicy: { id: "browser-image-metadata.writer-normalization.v1", text: "No metadata-value normalization is used for acceptance. Package and ExifTool must both reparse the written output; payload ranges compare exact SHA-256 bytes; decoder dimensions compare exact positive integers; source order and unknown metadata signatures compare ordered multiset identities." },
  controls: { malformed: [], c2pa: [], protected: [], orientation: [] },
  families: {},
  fixtures: [],
  gate: { passed: false, failures: [], minimumFixturesPerFamily: minimumPerFamily },
};
try {
  await decoders.open();
  report.decoders.chromium.version = decoders.versions.chromium;
  report.decoders.firefox.version = decoders.versions.firefox;
  const exifToolVersion = await exiftool.version();
  report.independentOracle.version = exifToolVersion;
  assert(exifToolVersion === expectedExifToolVersion, `ExifTool ${exifToolVersion} is not pinned ${expectedExifToolVersion}.`);
  const eligibleByFormat = {};
  const rejectedByFormat = {};
  for (const format of ["jpeg", "png", "webp"]) {
    const eligibleResult = await eligibleCandidates(candidates, format, decoders);
    eligibleByFormat[format] = eligibleResult.eligible;
    rejectedByFormat[format] = eligibleResult.rejected;
  }
  const pngSources = eligibleByFormat.png;
  assert(pngSources.length >= minimumPerFamily, `Only ${pngSources.length} eligible real PNG fixtures were independently decodable; ${minimumPerFamily} are required.`);
  for (const format of ["jpeg", "webp"]) {
    const needed = Math.max(0, minimumPerFamily - eligibleByFormat[format].length);
    if (needed > 0) {
      const derived = await deriveCandidates(pngSources, format, needed, decoders, derivedDirectory);
      eligibleByFormat[format].push(...derived);
    }
    if (eligibleByFormat[format].length < minimumPerFamily) fail(`Only ${eligibleByFormat[format].length} eligible ${format} fixtures participated; ${minimumPerFamily} are required.`);
  }
  for (const format of ["jpeg", "png", "webp"]) eligibleByFormat[format] = selectRepresentativeCandidates(format, eligibleByFormat[format]);
  for (const source of manifest.sources) report.sources.push({ id: source.id, repository: source.repository, commit: revisions[source.id], license: source.license, licenseSource: source.licenseSource, fixtureCount: candidates.filter((candidate) => candidate.sourceId === source.id).length });
  for (const format of ["jpeg", "png", "webp"]) {
    const records = [];
    for (const [index, candidate] of eligibleByFormat[format].entries()) {
      const outputs = await runOperationMatrix(candidate, format, index, decoders, oracleDirectory);
      records.push({ fixture: candidate.relativePath, sourceId: candidate.sourceId ?? null, origin: candidate.origin, derivedFrom: candidate.derivedFrom ?? null, format, byteLength: candidate.byteLength, sha256: candidate.sha256, metadataPresence: candidate.metadataPresence, containerStructure: unknownMetadataSignature(format, candidate.bytes).structure, packageDimensions: candidate.packageDimensions, decodedInput: candidate.decoded, bytes: candidate.bytes, outputs });
    }
    report.families[format] = summarizeFamily(records);
    report.fixtures.push(...records.map((record) => {
      const reportRecord = { ...record };
      delete reportRecord.bytes;
      return reportRecord;
    }));
  }
  const eligibleForControls = Object.fromEntries(["jpeg", "png", "webp"].map((format) => [format, eligibleByFormat[format]]));
  report.controls.malformed = await runMalformedControls(eligibleForControls);
  report.controls.c2pa = await runCarrierControls(eligibleForControls);
  report.controls.protected = await runProtectedControls();
  report.controls.orientation = await runOrientationControls(eligibleForControls, decoders, oracleDirectory);
  assert(report.controls.orientation.length === 3, "Orientation controls did not participate for JPEG, PNG, and WebP.");
  for (const format of ["jpeg", "png", "webp"]) assert(eligibleByFormat[format].some((candidate) => candidate.origin === "external"), `${format} has no directly external fixture in the writer corpus.`);
  report.gate = {
    passed: true,
    failures: [],
    minimumFixturesPerFamily: minimumPerFamily,
    observed: Object.fromEntries(Object.entries(report.families).map(([format, family]) => [format, { fixtures: family.fixtures, successfulOutputs: family.successfulOutputs, payloads: family.payloads, payloadsMatched: family.payloadsMatched, independentOraclePassed: family.independentOraclePassed, browserDecodedByChromium: family.browserDecodedByChromium, browserDecodedByFirefox: family.browserDecodedByFirefox, unknownMetadataPreserved: family.unknownMetadataPreserved }])),
    rejectedSourceCounts: rejectedByFormat,
    corpusSourceFileCount: candidates.length,
    noSyntheticOnly: Object.values(report.families).every((family) => family.fixtures >= minimumPerFamily && (family.origins.external ?? 0) > 0),
    externalFixturesByFormat: Object.fromEntries(Object.entries(report.families).map(([format, family]) => [format, family.origins.external ?? 0])),
    orientationControls: report.controls.orientation.length,
    requiredStructureCoverage: Object.fromEntries(Object.entries(report.families).map(([format, family]) => [format, family.containerStructure])),
  };
} catch (error) {
  report.gate = { passed: false, failures: [error instanceof Error ? error.message : String(error)], minimumFixturesPerFamily: minimumPerFamily };
  throw error;
} finally {
  await exiftool.end();
  await decoders.close();
  await mkdir(outputDirectory, { recursive: true });
  const reportPath = join(outputDirectory, "roadmap-writer-corpus-evidence.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(join(outputDirectory, "roadmap-writer-corpus-evidence.md"), renderMarkdown(report));
  await rm(temporaryRoot, { recursive: true, force: true });
}

if (!report.gate.passed) fail(`Writer corpus gate failed: ${report.gate.failures.join(" ")}`);
console.log(`Writer corpus passed: ${Object.values(report.families).map((family) => family.fixtures).join("/")} JPEG/PNG/WebP fixtures. Reports written to ${outputDirectory}.`);
