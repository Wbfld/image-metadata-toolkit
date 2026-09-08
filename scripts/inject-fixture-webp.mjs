import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const base = await readFile(resolve(root, "tests/fixtures/base.webp"));
const tiff = await readFile(resolve(root, "tests/fixtures/tiff-exif-little-endian.tif"));
const iccSource = await readFile(resolve(root, "tests/fixtures/jpeg-icc.jpg"));
const output = resolve(root, "tests/fixtures/webp-metadata.webp");
const truncatedOutput = resolve(root, "tests/fixtures/webp-truncated.webp");

function chunk(type, data) {
  const result = Buffer.alloc(8 + data.length + (data.length & 1));
  result.write(type, 0, "ascii");
  result.writeUInt32LE(data.length, 4);
  data.copy(result, 8);
  return result;
}

function extractIccProfile(jpeg) {
  const marker = Buffer.from("ICC_PROFILE\0", "ascii");
  const start = jpeg.indexOf(marker);
  if (start < 0) throw new Error("JPEG fixture has no ICC profile");
  const profileStart = start + marker.length + 2;
  const profileSize = jpeg.readUInt32BE(profileStart);
  return jpeg.subarray(profileStart, profileStart + profileSize);
}

if (!base.subarray(0, 4).equals(Buffer.from("RIFF")) || !base.subarray(8, 12).equals(Buffer.from("WEBP"))) throw new Error("Base fixture is not WebP");
const chunks = Buffer.concat([
  base.subarray(12),
  chunk("EXIF", tiff),
  chunk("XMP ", Buffer.from("<x:xmpmeta><rdf:RDF/></x:xmpmeta>", "utf8")),
  chunk("ICCP", extractIccProfile(iccSource)),
]);
const outputBytes = Buffer.alloc(8 + 4 + chunks.length);
outputBytes.write("RIFF", 0, "ascii");
outputBytes.writeUInt32LE(4 + chunks.length, 4);
outputBytes.write("WEBP", 8, "ascii");
chunks.copy(outputBytes, 12);
await writeFile(output, outputBytes);
await writeFile(truncatedOutput, outputBytes.subarray(0, outputBytes.length - 5));
