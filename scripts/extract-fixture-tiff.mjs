import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const jpeg = await readFile(resolve(root, "tests/fixtures/jpeg-exif-little-endian.jpg"));
const output = resolve(root, "tests/fixtures/tiff-exif-little-endian.tif");
const truncatedOutput = resolve(root, "tests/fixtures/tiff-truncated.tif");

let cursor = 2;
let tiff = null;
while (cursor + 4 <= jpeg.length) {
  if (jpeg[cursor] !== 0xff) throw new Error("Malformed JPEG fixture");
  while (jpeg[cursor] === 0xff) cursor += 1;
  const marker = jpeg[cursor++];
  if (marker === 0xda || marker === 0xd9) break;
  if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
  const length = jpeg.readUInt16BE(cursor);
  const payload = jpeg.subarray(cursor + 2, cursor + length);
  if (marker === 0xe1 && payload.subarray(0, 6).equals(Buffer.from("Exif\0\0", "binary"))) {
    tiff = payload.subarray(6);
    break;
  }
  cursor += length;
}
if (tiff === null) throw new Error("JPEG fixture has no EXIF payload");
await writeFile(output, tiff);
await writeFile(truncatedOutput, tiff.subarray(0, Math.max(0, tiff.length - 7)));
