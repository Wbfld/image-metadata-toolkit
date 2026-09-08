import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = await readFile(resolve(root, "tests/fixtures/jpeg-exif-little-endian.jpg"));
const output = resolve(root, "tests/fixtures/jpeg-icc.jpg");
const malformedOutput = resolve(root, "tests/fixtures/jpeg-icc-malformed.jpg");

const profile = Buffer.alloc(132);
profile.writeUInt32BE(132, 0);
profile.write("Lino", 4, "ascii");
profile.writeUInt32BE(0x04300000, 8);
profile.write("mntr", 12, "ascii");
profile.write("RGB ", 16, "ascii");
profile.write("XYZ ", 20, "ascii");
profile.write("acsp", 36, "ascii");
profile.writeUInt32BE(0, 64);
profile.writeInt32BE(0x0000f6d6, 68);
profile.writeInt32BE(0x00010000, 72);
profile.writeInt32BE(0x0000d32d, 76);
profile.writeUInt32BE(0, 128); // ICC tag count; this fixture intentionally has no tag payloads.

function app2(data) {
  const payload = Buffer.concat([Buffer.from("ICC_PROFILE\0", "ascii"), Buffer.from([1, 1]), data]);
  const segment = Buffer.alloc(payload.length + 4);
  segment[0] = 0xff;
  segment[1] = 0xe2;
  segment.writeUInt16BE(payload.length + 2, 2);
  payload.copy(segment, 4);
  return segment;
}

let cursor = 2;
let insertAt = -1;
while (cursor + 4 <= source.length) {
  if (source[cursor] !== 0xff) throw new Error("Malformed JPEG fixture");
  while (source[cursor] === 0xff) cursor += 1;
  const marker = source[cursor++];
  if (marker === 0xda) { insertAt = cursor - 2; break; }
  if (marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
  cursor += source.readUInt16BE(cursor);
}
if (insertAt < 0) throw new Error("JPEG fixture has no scan");
const segment = app2(profile);
await writeFile(output, Buffer.concat([source.subarray(0, insertAt), segment, source.subarray(insertAt)]));
const malformed = Buffer.from(profile);
malformed.writeUInt32BE(512, 0);
await writeFile(malformedOutput, Buffer.concat([source.subarray(0, insertAt), app2(malformed), source.subarray(insertAt)]));
