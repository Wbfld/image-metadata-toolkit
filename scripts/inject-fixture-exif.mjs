import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const inputPath = resolve(root, "tests/fixtures/base.jpg");
const outputPath = resolve(root, "tests/fixtures/jpeg-exif-little-endian.jpg");

const TYPE_SIZES = new Map([
  [1, 1],
  [2, 1],
  [3, 2],
  [4, 4],
  [5, 8],
  [10, 8],
]);

const ascii = (value) => Buffer.from(`${value}\0`, "ascii");
const short = (value) => {
  const result = Buffer.alloc(2);
  result.writeUInt16LE(value);
  return result;
};
const long = (value) => {
  const result = Buffer.alloc(4);
  result.writeUInt32LE(value);
  return result;
};
const rationals = (...pairs) => {
  const result = Buffer.alloc(pairs.length * 8);
  pairs.forEach(([numerator, denominator], index) => {
    result.writeUInt32LE(numerator, index * 8);
    result.writeUInt32LE(denominator, index * 8 + 4);
  });
  return result;
};
const signedRational = (numerator, denominator) => {
  const result = Buffer.alloc(8);
  result.writeInt32LE(numerator, 0);
  result.writeInt32LE(denominator, 4);
  return result;
};

const ifd0Entries = [
  [0x010f, 2, ascii("OpenAI Camera")],
  [0x0110, 2, ascii("Fixture One")],
  [0x0112, 3, short(6)],
  [0x0131, 2, ascii("browser-image-metadata fixture")],
  [0x0132, 2, ascii("2026:09:07 12:34:56")],
  [0x013b, 2, ascii("Fixture Artist")],
  [0x8298, 2, ascii("Public Domain")],
];
const exifEntries = [
  [0x829a, 5, rationals([1, 125])],
  [0x829d, 5, rationals([28, 10])],
  [0x8827, 3, short(400)],
  [0x9003, 2, ascii("2026:09:07 12:34:56")],
  [0x9201, 10, signedRational(6965784, 1000000)],
  [0x9202, 5, rationals([2970854, 1000000])],
  [0x9209, 3, short(0x59)],
  [0x920a, 5, rationals([50, 1])],
  [0xa431, 2, ascii("SECRET-123")],
];
const gpsEntries = [
  [0x0001, 2, ascii("N")],
  [0x0002, 5, rationals([51, 1], [30, 1], [0, 1])],
  [0x0003, 2, ascii("W")],
  [0x0004, 5, rationals([0, 1], [7, 1], [0, 1])],
  [0x0005, 1, Buffer.from([0])],
  [0x0006, 5, rationals([350, 10])],
];

const ifdSize = (entries) => 2 + entries.length * 12 + 4;
const ifd0Offset = 8;
const exifOffset = ifd0Offset + ifdSize([...ifd0Entries, [0x8769, 4, long(0)], [0x8825, 4, long(0)]]);
const gpsOffset = exifOffset + ifdSize(exifEntries);
ifd0Entries.push([0x8769, 4, long(exifOffset)], [0x8825, 4, long(gpsOffset)]);
ifd0Entries.sort(([left], [right]) => left - right);

const dataStart = gpsOffset + ifdSize(gpsEntries);
const deferred = [];
let dataCursor = dataStart;

function writeIfd(buffer, offset, entries) {
  buffer.writeUInt16LE(entries.length, offset);
  entries.forEach(([tag, type, value], index) => {
    const entryOffset = offset + 2 + index * 12;
    const typeSize = TYPE_SIZES.get(type);
    if (typeSize === undefined || value.length % typeSize !== 0) throw new Error(`Bad fixture entry ${tag}`);
    buffer.writeUInt16LE(tag, entryOffset);
    buffer.writeUInt16LE(type, entryOffset + 2);
    buffer.writeUInt32LE(value.length / typeSize, entryOffset + 4);
    if (value.length <= 4) {
      value.copy(buffer, entryOffset + 8);
    } else {
      buffer.writeUInt32LE(dataCursor, entryOffset + 8);
      deferred.push([dataCursor, value]);
      dataCursor += value.length + (value.length & 1);
    }
  });
  buffer.writeUInt32LE(0, offset + 2 + entries.length * 12);
}

// Allocate once after a dry run determines deferred data size.
const dryRun = Buffer.alloc(65535);
writeIfd(dryRun, ifd0Offset, ifd0Entries);
writeIfd(dryRun, exifOffset, exifEntries);
writeIfd(dryRun, gpsOffset, gpsEntries);
const finalLength = dataCursor;
deferred.length = 0;
dataCursor = dataStart;

const tiff = Buffer.alloc(finalLength);
tiff.write("II", 0, "ascii");
tiff.writeUInt16LE(42, 2);
tiff.writeUInt32LE(ifd0Offset, 4);
writeIfd(tiff, ifd0Offset, ifd0Entries);
writeIfd(tiff, exifOffset, exifEntries);
writeIfd(tiff, gpsOffset, gpsEntries);
for (const [offset, value] of deferred) value.copy(tiff, offset);

const exifPayload = Buffer.concat([Buffer.from("Exif\0\0", "binary"), tiff]);
const segmentLength = exifPayload.length + 2;
if (segmentLength > 0xffff) throw new Error("Fixture EXIF segment is too large");
const app1 = Buffer.alloc(exifPayload.length + 4);
app1[0] = 0xff;
app1[1] = 0xe1;
app1.writeUInt16BE(segmentLength, 2);
exifPayload.copy(app1, 4);

const jpeg = await readFile(inputPath);
if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) throw new Error("Base fixture is not JPEG");

function stripExistingExif(input) {
  const parts = [input.subarray(0, 2)];
  let cursor = 2;
  while (cursor < input.length) {
    const markerStart = cursor;
    if (input[cursor] !== 0xff) throw new Error("Malformed base JPEG marker stream");
    while (input[cursor] === 0xff) cursor += 1;
    const marker = input[cursor];
    cursor += 1;
    if (marker === 0xda || marker === 0xd9) {
      parts.push(input.subarray(markerStart));
      return Buffer.concat(parts);
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      parts.push(input.subarray(markerStart, cursor));
      continue;
    }
    if (cursor + 2 > input.length) throw new Error("Truncated base JPEG segment");
    const length = input.readUInt16BE(cursor);
    const end = cursor + length;
    if (length < 2 || end > input.length) throw new Error("Invalid base JPEG segment length");
    const isExif = marker === 0xe1 && input.subarray(cursor + 2, cursor + 8).equals(Buffer.from("Exif\0\0", "binary"));
    if (!isExif) parts.push(input.subarray(markerStart, end));
    cursor = end;
  }
  throw new Error("Base JPEG has no scan");
}

const stripped = stripExistingExif(jpeg);
await writeFile(outputPath, Buffer.concat([stripped.subarray(0, 2), app1, stripped.subarray(2)]));
