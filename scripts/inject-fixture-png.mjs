import { deflateSync } from "node:zlib";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const basePath = resolve(root, "tests/fixtures/base.png");
const jpegPath = resolve(root, "tests/fixtures/jpeg-exif-little-endian.jpg");
const iccPath = resolve(root, "tests/fixtures/jpeg-icc.jpg");
const outputPath = resolve(root, "tests/fixtures/png-metadata.png");
const truncatedPath = resolve(root, "tests/fixtures/png-truncated.png");
const badTextPath = resolve(root, "tests/fixtures/png-bad-text.png");
const badIccPath = resolve(root, "tests/fixtures/png-icc-malformed.png");

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const result = Buffer.alloc(12 + data.length);
  result.writeUInt32BE(data.length, 0);
  typeBytes.copy(result, 4);
  data.copy(result, 8);
  result.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 8 + data.length);
  return result;
}

function extractExifTiff(jpeg) {
  let cursor = 2;
  while (cursor + 4 <= jpeg.length) {
    if (jpeg[cursor] !== 0xff) throw new Error("Malformed JPEG fixture");
    while (jpeg[cursor] === 0xff) cursor += 1;
    const marker = jpeg[cursor++];
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = jpeg.readUInt16BE(cursor);
    const payload = jpeg.subarray(cursor + 2, cursor + length);
    if (marker === 0xe1 && payload.subarray(0, 6).equals(Buffer.from("Exif\0\0", "binary"))) {
      return payload.subarray(6);
    }
    cursor += length;
  }
  throw new Error("JPEG fixture has no EXIF APP1");
}

function extractIccProfile(jpeg) {
  const marker = Buffer.from("ICC_PROFILE\0", "ascii");
  const start = jpeg.indexOf(marker);
  if (start < 0) throw new Error("JPEG fixture has no ICC profile");
  const profileStart = start + marker.length + 2;
  const profileSize = jpeg.readUInt32BE(profileStart);
  return jpeg.subarray(profileStart, profileStart + profileSize);
}

function textData(keyword, value) {
  return Buffer.concat([Buffer.from(keyword, "latin1"), Buffer.from([0]), Buffer.from(value, "latin1")]);
}

function itxtData(keyword, language, translated, value, compressed = false) {
  return Buffer.concat([
    Buffer.from(keyword, "ascii"), Buffer.from([0, compressed ? 1 : 0, 0]),
    Buffer.from(language, "ascii"), Buffer.from([0]),
    Buffer.from(translated, "utf8"), Buffer.from([0]),
    compressed ? deflateSync(Buffer.from(value, "utf8")) : Buffer.from(value, "utf8"),
  ]);
}

const base = await readFile(basePath);
const jpeg = await readFile(jpegPath);
const iccJpeg = await readFile(iccPath);
const tiff = extractExifTiff(jpeg);
const icc = extractIccProfile(iccJpeg);
if (!base.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) throw new Error("Base fixture is not PNG");
const iend = base.length - 12;
if (base.readUInt32BE(iend) !== 0 || base.subarray(iend + 4, iend + 8).toString("ascii") !== "IEND") throw new Error("Base PNG has no terminal IEND");

const metadata = Buffer.concat([
  chunk("eXIf", tiff),
  chunk("iCCP", Buffer.concat([Buffer.from("ICC\0", "ascii"), Buffer.from([0]), deflateSync(icc)])),
  chunk("tEXt", textData("Author", "PNG Fixture")),
  chunk("zTXt", Buffer.concat([Buffer.from("Comment\0", "ascii"), Buffer.from([0]), deflateSync(Buffer.from("compressed text", "utf8"))])),
  chunk("iTXt", itxtData("Description", "en", "Description", "A PNG fixture")),
  chunk("iTXt", itxtData("Compressed", "en", "Compressed", "compressed iTXt text", true)),
  chunk("iTXt", itxtData("XML:com.adobe.xmp", "", "", "<x:xmpmeta><rdf:RDF/></x:xmpmeta>")),
]);
const kept = [];
let idatOffset = null;
let cursor = 8;
while (cursor < iend) {
  const length = base.readUInt32BE(cursor);
  const end = cursor + 12 + length;
  const type = base.subarray(cursor + 4, cursor + 8).toString("ascii");
  if (type === "eXIf") {
    cursor = end;
    continue;
  }
  if (idatOffset === null && type === "IDAT") idatOffset = kept.reduce((sum, part) => sum + part.length, 8);
  kept.push(base.subarray(cursor, end));
  cursor = end;
}
if (idatOffset === null) throw new Error("Base PNG has no IDAT");
const prefixLength = idatOffset - 8;
const prefix = Buffer.concat(kept.slice(0, kept.findIndex((part) => part.subarray(4, 8).toString("ascii") === "IDAT")));
const suffix = Buffer.concat(kept.slice(kept.findIndex((part) => part.subarray(4, 8).toString("ascii") === "IDAT")));
const valid = Buffer.concat([base.subarray(0, 8), prefix.subarray(0, prefixLength), metadata, suffix, base.subarray(iend)]);
await writeFile(outputPath, valid);
await writeFile(truncatedPath, valid.subarray(0, valid.length - 5));

const badIcc = Buffer.from(valid);
let badIccCursor = 8;
while (badIccCursor + 12 <= badIcc.length) {
  const length = badIcc.readUInt32BE(badIccCursor);
  const type = badIcc.subarray(badIccCursor + 4, badIccCursor + 8).toString("ascii");
  if (type === "iCCP") {
    badIcc[badIccCursor + 8 + 4] = 1;
    badIcc.writeUInt32BE(crc32(badIcc.subarray(badIccCursor + 4, badIccCursor + 8 + length)), badIccCursor + 8 + length);
    break;
  }
  badIccCursor += 12 + length;
}
await writeFile(badIccPath, badIcc);

const bad = chunk("zTXt", Buffer.concat([Buffer.from("Bad\0", "ascii"), Buffer.from([0]), Buffer.from([0xff, 0x00, 0x01])]))
  .toString("binary");
await writeFile(badTextPath, Buffer.concat([base.subarray(0, iend), Buffer.from(bad, "binary"), base.subarray(iend)]));
