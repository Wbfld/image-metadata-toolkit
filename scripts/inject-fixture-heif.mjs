import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const tiff = await readFile(resolve(root, "tests/fixtures/tiff-exif-little-endian.tif"));

function box(type, payload) {
  const result = Buffer.alloc(8 + payload.length);
  result.writeUInt32BE(result.length, 0);
  result.write(type, 4, "ascii");
  payload.copy(result, 8);
  return result;
}

function ispe(width, height) {
  const payload = Buffer.alloc(12);
  payload.writeUInt32BE(width, 4);
  payload.writeUInt32BE(height, 8);
  return box("ispe", payload);
}

function makeFile(brand) {
  const ftypPayload = Buffer.concat([Buffer.from(brand, "ascii"), Buffer.alloc(4)]);
  const ftyp = box("ftyp", ftypPayload);
  const meta = box("meta", Buffer.concat([
    Buffer.alloc(4),
    box("Exif", tiff),
    box("xml ", Buffer.from("<x:xmpmeta><rdf:RDF/></x:xmpmeta>", "utf8")),
    box("iprp", box("ipco", ispe(2, 2))),
  ]));
  return Buffer.concat([ftyp, meta]);
}

function infe(id, type, contentType = "") {
  const name = Buffer.from("metadata\0", "ascii");
  const extra = type === "mime" ? Buffer.from(`${contentType}\0`, "ascii") : Buffer.alloc(0);
  const payload = Buffer.concat([Buffer.from([2, 0, 0, 0]), Buffer.from([id >> 8, id & 0xff, 0, 0]), Buffer.from(type, "ascii"), Buffer.from([0]), extra, name]);
  return box("infe", payload);
}

function iloc(exifOffset, exifLength, xmpOffset, xmpLength) {
  const payload = Buffer.alloc(4 + 2 + 2 + 2 * (2 + 2 + 2 + 4 + 4));
  payload[0] = 0x00;
  payload[4] = 0x44;
  payload[5] = 0x00;
  payload.writeUInt16BE(2, 6);
  let cursor = 8;
  for (const [id, offset, length] of [[1, exifOffset, exifLength], [2, xmpOffset, xmpLength]]) {
    payload.writeUInt16BE(id, cursor); cursor += 2;
    payload.writeUInt16BE(0, cursor); cursor += 2;
    payload.writeUInt16BE(1, cursor); cursor += 2;
    payload.writeUInt32BE(offset, cursor); cursor += 4;
    payload.writeUInt32BE(length, cursor); cursor += 4;
  }
  return box("iloc", payload);
}

function makeItemFile(brand) {
  const exif = Buffer.concat([Buffer.alloc(4), tiff]);
  exif.writeUInt32BE(4, 0);
  const xmp = Buffer.from("<x:xmpmeta><rdf:RDF/></x:xmpmeta>", "utf8");
  const ftyp = box("ftyp", Buffer.concat([Buffer.from(brand, "ascii"), Buffer.alloc(4)]));
  const metaPrefix = Buffer.concat([Buffer.alloc(4), box("iinf", Buffer.concat([Buffer.from([0, 0, 0, 0, 0, 2]), infe(1, "Exif"), infe(2, "mime", "application/rdf+xml")])), box("iprp", box("ipco", ispe(2, 2))) ]);
  const ilocSize = iloc(0, exif.length, exif.length, xmp.length);
  const mdatPayloadStart = ftyp.length + 8 + metaPrefix.length + ilocSize.length + 8;
  const mdat = box("mdat", Buffer.concat([exif, xmp]));
  const meta = box("meta", Buffer.concat([metaPrefix, iloc(mdatPayloadStart, exif.length, mdatPayloadStart + exif.length, xmp.length)]));
  return Buffer.concat([ftyp, meta, mdat]);
}

const heif = makeFile("heic");
const avif = makeFile("avif");
const heifItem = makeItemFile("heic");
const avifItem = makeItemFile("avif");
await writeFile(resolve(root, "tests/fixtures/heif-metadata.heic"), heif);
await writeFile(resolve(root, "tests/fixtures/heif-truncated.heic"), heif.subarray(0, heif.length - 5));
await writeFile(resolve(root, "tests/fixtures/avif-metadata.avif"), avif);
await writeFile(resolve(root, "tests/fixtures/heif-item-metadata.heic"), heifItem);
await writeFile(resolve(root, "tests/fixtures/heif-item-truncated.heic"), heifItem.subarray(0, heifItem.length - 5));
await writeFile(resolve(root, "tests/fixtures/avif-item-metadata.avif"), avifItem);
