import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourcePath = resolve(root, "tests/fixtures/jpeg-exif-little-endian.jpg");
const outputPath = resolve(root, "tests/fixtures/jpeg-iptc.jpg");
const malformedPath = resolve(root, "tests/fixtures/jpeg-iptc-malformed.jpg");

function dataset(record, number, value) {
  const bytes = Buffer.from(value, "latin1");
  return datasetBytes(record, number, bytes);
}

function datasetBytes(record, number, bytes) {
  const header = Buffer.from([0x1c, record, number, (bytes.length >>> 8) & 0xff, bytes.length & 0xff]);
  return Buffer.concat([header, bytes]);
}

const iim = Buffer.concat([
  datasetBytes(1, 90, Buffer.from([0x1b, 0x25, 0x47])),
  dataset(2, 5, "IPTC fixture"),
  dataset(2, 10, "5"),
  dataset(2, 15, "NEWS"),
  dataset(2, 25, "metadata"),
  dataset(2, 25, "fixture"),
  dataset(2, 80, "Fixture Artist"),
  dataset(2, 90, "London"),
  dataset(2, 100, "GBR"),
  datasetBytes(2, 105, Buffer.from("IPTC headline – café", "utf8")),
  dataset(2, 120, "IPTC caption"),
]);
const resourceHeader = Buffer.concat([
  Buffer.from("8BIM", "ascii"), Buffer.from([0x04, 0x04, 0, 0]),
  Buffer.alloc(4),
]);
resourceHeader.writeUInt32BE(iim.length, 8);
const resourcePad = iim.length & 1 ? Buffer.from([0]) : Buffer.alloc(0);
const app13Payload = Buffer.concat([Buffer.from("Photoshop 3.0\0", "ascii"), resourceHeader, iim, resourcePad]);
const app13 = Buffer.alloc(4 + app13Payload.length);
app13[0] = 0xff;
app13[1] = 0xed;
app13.writeUInt16BE(app13Payload.length + 2, 2);
app13Payload.copy(app13, 4);

const jpeg = await readFile(sourcePath);
let cursor = 2;
let insertAt = -1;
while (cursor + 4 <= jpeg.length) {
  if (jpeg[cursor] !== 0xff) throw new Error("Malformed JPEG fixture");
  while (jpeg[cursor] === 0xff) cursor += 1;
  const marker = jpeg[cursor++];
  if (marker === 0xda) { insertAt = cursor - 2; break; }
  if (marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
  const length = jpeg.readUInt16BE(cursor);
  cursor += length;
}
if (insertAt < 0) throw new Error("JPEG fixture has no scan");
const valid = Buffer.concat([jpeg.subarray(0, insertAt), app13, jpeg.subarray(insertAt)]);
await writeFile(outputPath, valid);
const malformedApp13 = Buffer.from(app13);
// Keep the JPEG segment structurally intact while making the resource length
// exceed the available APP13 bytes.
malformedApp13.writeUInt32BE(iim.length + 20, 26);
await writeFile(malformedPath, Buffer.concat([jpeg.subarray(0, insertAt), malformedApp13, jpeg.subarray(insertAt)]));
