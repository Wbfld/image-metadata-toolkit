import { brotliCompressSync, brotliDecompressSync } from "node:zlib";
import { TextEncoder } from "node:util";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const packageManifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const reportJsonPath = join(root, "reports/jxl-b01-evidence.json");
const reportMarkdownPath = join(root, "reports/jxl-b01-evidence.md");
const { parseMetadata } = await import(join(root, "dist/index.js"));

const signature = Uint8Array.of(0, 0, 0, 12, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a);
const text = new TextEncoder();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function appendBits(output, value, count) {
  for (let index = 0; index < count; index += 1) output.push((value >>> index) & 1);
}

function sizeValue(value) {
  if (value <= 512) return [0, 0, value - 1, 9];
  if (value <= 8192) return [1, 1, value - 1, 13];
  if (value <= 262144) return [2, 2, value - 1, 18];
  return [3, 3, value - 1, 30];
}

function codestream(width, height) {
  const bits = [];
  const small = width <= 256 && height <= 256 && width % 8 === 0 && height % 8 === 0;
  bits.push(small ? 1 : 0);
  if (small) appendBits(bits, height / 8 - 1, 5);
  else {
    const [, selector, value, count] = sizeValue(height);
    appendBits(bits, selector, 2);
    appendBits(bits, value, count);
  }
  appendBits(bits, 0, 3);
  if (small) appendBits(bits, width / 8 - 1, 5);
  else {
    const [, selector, value, count] = sizeValue(width);
    appendBits(bits, selector, 2);
    appendBits(bits, value, count);
  }
  const output = new Uint8Array(2 + Math.ceil(bits.length / 8));
  output.set([0xff, 0x0a]);
  bits.forEach((bit, index) => {
    const offset = 2 + Math.floor(index / 8);
    output[offset] = (output[offset] ?? 0) | (bit << (index % 8));
  });
  return output;
}

function box(type, payload) {
  const output = new Uint8Array(8 + payload.length);
  new DataView(output.buffer).setUint32(0, output.length);
  output.set(text.encode(type), 4);
  output.set(payload, 8);
  return output;
}

function container(...boxes) {
  const output = new Uint8Array(signature.length + boxes.reduce((total, item) => total + item.length, 0));
  output.set(signature);
  let offset = signature.length;
  for (const item of boxes) {
    output.set(item, offset);
    offset += item.length;
  }
  return output;
}

function compressedBox(type, payload) {
  const compressed = new Uint8Array(brotliCompressSync(payload));
  const wrapped = new Uint8Array(4 + compressed.length);
  wrapped.set(text.encode(type));
  wrapped.set(compressed, 4);
  return box("brob", wrapped);
}

const results = [];
const raw = await parseMetadata(codestream(800, 600));
assert(raw.dimensions?.width === 800 && raw.dimensions.height === 600, "raw codestream dimensions did not match");
assert(raw.xmp === null && raw.blocks?.length === 0, "raw codestream invented container metadata");
results.push({ case: "raw-codestream-dimensions", status: "passed", dimensions: raw.dimensions, containerMetadata: false, warningCodes: raw.warnings.map(({ code }) => code) });

const complete = await parseMetadata(container(box("jxlc", codestream(1600, 900))));
assert(complete.dimensions?.width === 1600 && complete.dimensions.height === 900, "jxlc dimensions did not match");
results.push({ case: "jxlc-dimensions", status: "passed", dimensions: complete.dimensions, warningCodes: complete.warnings.map(({ code }) => code) });

const packet = text.encode("<x:xmpmeta/>");
const brobInput = container(box("jxlc", codestream(16, 8)), compressedBox("xml ", packet));
const custom = await parseMetadata(brobInput, { jxlBrotliDecompressor: (compressed) => new Uint8Array(brotliDecompressSync(compressed)) });
assert(custom.dimensions?.width === 16 && custom.dimensions.height === 8, "compressed metadata fixture lost dimensions");
assert(custom.xmp?.packets.length === 1 && custom.xmp.packets[0] === "<x:xmpmeta/>", "custom Brotli decoder did not restore XML");
assert(custom.warnings.length === 0, "custom Brotli decoder produced unexpected warnings");
results.push({ case: "brotli-xml-custom-decoder", status: "passed", dimensions: custom.dimensions, packets: custom.xmp.packets.length, warningCodes: [] });

const platform = await parseMetadata(container(compressedBox("xml ", packet)));
const platformStatus = platform.xmp === null ? "unsupported-or-invalid" : "decoded";
if (platform.xmp === null) assert(platform.warnings.some(({ code }) => code === "UNSUPPORTED_COMPRESSION" || code === "INVALID_VALUE"), "platform Brotli failure was not diagnosed");
results.push({ case: "platform-brotli-capability", status: "passed", outcome: platformStatus, warningCodes: platform.warnings.map(({ code }) => code) });

const limited = await parseMetadata(brobInput, { limits: { maxDecompressedBytes: 4 }, jxlBrotliDecompressor: () => new Uint8Array(packet.length + 1) });
assert(limited.xmp === null && limited.warnings.some(({ code }) => code === "LIMIT_EXCEEDED"), "decompressed output limit was not enforced");
results.push({ case: "decompressed-output-limit", status: "passed", warningCodes: limited.warnings.map(({ code }) => code) });

const firstPacket = text.encode("<x:xmpmeta>a</x:xmpmeta>");
const secondPacket = text.encode("<x:xmpmeta>b</x:xmpmeta>");
const aggregateLimited = await parseMetadata(container(box("xml ", firstPacket), box("xml ", secondPacket)), { limits: { maxMetadataBytes: firstPacket.length + secondPacket.length - 1 } });
assert(aggregateLimited.xmp?.packets.length === 1 && aggregateLimited.warnings.some(({ code }) => code === "LIMIT_EXCEEDED"), "aggregate metadata limit was not enforced");
const stringLimited = await parseMetadata(container(box("xml ", firstPacket)), { limits: { maxStringBytes: firstPacket.length - 1 } });
assert(stringLimited.xmp === null && stringLimited.warnings.some(({ code }) => code === "LIMIT_EXCEEDED"), "XML string limit was not enforced");
const packetLimited = await parseMetadata(container(box("xml ", firstPacket), box("xml ", secondPacket)), { limits: { maxXmpPackets: 1 } });
assert(packetLimited.xmp?.packets.length === 1 && packetLimited.warnings.some(({ code }) => code === "LIMIT_EXCEEDED"), "XMP packet count limit was not enforced");
results.push({ case: "metadata-aggregate-string-and-packet-limits", status: "passed", retainedPackets: 1, warningCodes: ["LIMIT_EXCEEDED"] });

const malformed = await parseMetadata(container(box("brob", Uint8Array.of(1, 2, 3, 4))));
assert(malformed.warnings.some(({ code }) => code === "UNSUPPORTED_STRUCTURE"), "unknown brob type was not diagnosed");
assert(malformed.blocks?.some(({ family, status }) => family === "Unknown" && status === "opaque"), "unknown brob block was not retained as opaque");
results.push({ case: "malformed-and-unknown-box", status: "passed", warningCodes: malformed.warnings.map(({ code }) => code), opaqueBlock: true });

const report = {
  schema: "browser-image-metadata.jxl-b01-evidence.v1",
  status: "pass",
  generatedAt: new Date().toISOString(),
  package: { name: packageManifest.name, version: packageManifest.version },
  standards: ["ISO/IEC 18181-1:2024", "ISO/IEC 18181-2:2024"],
  sourceManifest: "data/jxl/sources.json",
  implementation: {
    dimensions: "little-endian bit-level JPEG XL codestream size header",
    metadata: ["Exif", "xml ", "brob(Exif)", "brob(xml )"],
    rawCodestreamPolicy: "dimensions only; no container metadata inferred",
    decompressionPolicy: "injected bounded decoder or platform DecompressionStream(\"brotli\"); copied output; maxMetadataBytes, maxDecompressedBytes, maxDecompressedMetadataBytes, maxStringBytes, and maxXmpPackets enforced",
    provenancePolicy: "physical box ranges retained; decompressed logical field offsets are null",
  },
  cases: results,
  complete: results.length === 7 && results.every(({ status }) => status === "passed"),
  payloadPolicy: "synthetic compact byte fixtures only; no third-party or image payloads are retained",
};
assert(report.complete, "B01 evidence cases were incomplete");
await mkdir(dirname(reportJsonPath), { recursive: true });
await writeFile(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
const markdown = [
  "# JPEG XL B01 evidence",
  "",
  `- Status: **${report.status}**`,
  `- Package: \`${report.package.name}@${report.package.version}\``,
  `- Standards: ${report.standards.join(", ")}`,
  `- Cases: ${report.cases.length} (all passed)`,
  "- Payload policy: synthetic compact byte fixtures only; no third-party or image payloads are retained.",
  "",
  "| Case | Status | Dimensions | Warnings |",
  "| --- | --- | --- | --- |",
  ...report.cases.map((item) => `| ${item.case} | ${item.status} | ${item.dimensions === undefined ? "—" : `${item.dimensions.width}×${item.dimensions.height}`} | ${item.warningCodes.join(", ") || "none"} |`),
  "",
  "## Policies",
  "",
  `- Raw codestream: ${report.implementation.rawCodestreamPolicy}.`,
  `- Decompression: ${report.implementation.decompressionPolicy}.`,
  `- Provenance: ${report.implementation.provenancePolicy}.`,
  "",
  "The JSON artifact contains the complete machine-readable case evidence.",
].join("\n");
await writeFile(reportMarkdownPath, `${markdown}\n`, "utf8");
console.log(`JPEG XL B01 evidence passed for ${report.cases.length} cases; reports: reports/jxl-b01-evidence.{json,md}`);
