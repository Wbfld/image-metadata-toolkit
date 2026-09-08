import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const tiff = await readFile(resolve(root, "tests/fixtures/tiff-exif-little-endian.tif"));
const iccJpeg = await readFile(resolve(root, "tests/fixtures/jpeg-icc.jpg"));

function extractIccProfile(bytes) {
  const marker = Buffer.from("ICC_PROFILE\0", "ascii");
  const start = bytes.indexOf(marker);
  if (start < 0) throw new Error("ICC fixture has no profile");
  const profileStart = start + marker.length + 2;
  const profileLength = bytes.readUInt32BE(profileStart);
  return bytes.subarray(profileStart, profileStart + profileLength);
}

const iccProfile = extractIccProfile(iccJpeg);

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

function pitm(id) {
  const payload = Buffer.alloc(6);
  payload.writeUInt16BE(id, 4);
  return box("pitm", payload);
}

function ipma(associations) {
  const entries = associations.map(([itemId, propertyIndices]) => {
    const entry = Buffer.alloc(3 + propertyIndices.length);
    entry.writeUInt16BE(itemId, 0);
    entry[2] = propertyIndices.length;
    propertyIndices.forEach((index, offset) => { entry[3 + offset] = index; });
    return entry;
  });
  const payload = Buffer.alloc(8);
  payload.writeUInt32BE(entries.length, 4);
  return box("ipma", Buffer.concat([payload, ...entries]));
}

function itemProperties(dimensions, associations, profile = null) {
  return box("iprp", Buffer.concat([
    box("ipco", Buffer.concat([
      ...dimensions.map(([width, height]) => ispe(width, height)),
      ...(profile === null ? [] : [box("colr", Buffer.concat([Buffer.from("prof", "ascii"), profile]))]),
    ])),
    ipma(associations),
  ]));
}

function makeFile(brand) {
  const ftypPayload = Buffer.concat([Buffer.from(brand, "ascii"), Buffer.alloc(4)]);
  const ftyp = box("ftyp", ftypPayload);
  const meta = box("meta", Buffer.concat([
    Buffer.alloc(4),
    box("Exif", tiff),
    box("xml ", Buffer.from("<x:xmpmeta><rdf:RDF/></x:xmpmeta>", "utf8")),
    pitm(1),
    itemProperties([[2, 2]], [[1, [1]]]),
  ]));
  return Buffer.concat([ftyp, meta]);
}

function infe(id, type, contentType = "") {
  const name = Buffer.from("metadata\0", "ascii");
  const extra = type === "mime" ? Buffer.from(`${contentType}\0\0`, "ascii") : Buffer.alloc(0);
  const payload = Buffer.concat([Buffer.from([2, 0, 0, 0]), Buffer.from([id >> 8, id & 0xff, 0, 0]), Buffer.from(type, "ascii"), name, extra]);
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

function makeItemFile(brand, includeThumbnail = false, conflictingPrimary = false) {
  const exif = Buffer.concat([Buffer.alloc(4), tiff]);
  // HEIF's Exif TIFF-header offset is relative to the byte immediately after
  // this four-byte field, so zero points at the following TIFF header.
  exif.writeUInt32BE(0, 0);
  const xmp = Buffer.from("<x:xmpmeta><rdf:RDF/></x:xmpmeta>", "utf8");
  const ftyp = box("ftyp", Buffer.concat([Buffer.from(brand, "ascii"), Buffer.alloc(4)]));
  const spatialExtents = includeThumbnail ? [[2, 2], [1, 1]] : [[2, 2]];
  const associations = includeThumbnail ? [[3, conflictingPrimary ? [1, 2] : [1]], [4, [2]]] : [[3, [1]]];
  const metaPrefix = Buffer.concat([Buffer.alloc(4), pitm(3), box("iinf", Buffer.concat([Buffer.from([0, 0, 0, 0, 0, 2]), infe(1, "Exif"), infe(2, "mime", "application/rdf+xml")])), itemProperties(spatialExtents, associations) ]);
  const ilocSize = iloc(0, exif.length, exif.length, xmp.length);
  const mdatPayloadStart = ftyp.length + 8 + metaPrefix.length + ilocSize.length + 8;
  const mdat = box("mdat", Buffer.concat([exif, xmp]));
  const meta = box("meta", Buffer.concat([metaPrefix, iloc(mdatPayloadStart, exif.length, mdatPayloadStart + exif.length, xmp.length)]));
  return Buffer.concat([ftyp, meta, mdat]);
}

function ilocIdat(exifLength, xmpLength, { indexed = false, xmpToEnd = false } = {}) {
  const extentIndexBytes = indexed ? 4 : 0;
  const payload = Buffer.alloc(4 + 2 + 2 + 2 * (2 + 2 + 2 + 2 + extentIndexBytes + 4 + 4));
  payload[0] = 0x01;
  payload[4] = 0x44;
  payload[5] = indexed ? 0x40 : 0x00;
  payload.writeUInt16BE(2, 6);
  let cursor = 8;
  for (const [id, offset, length] of [[1, 0, exifLength], [2, exifLength, xmpToEnd ? 0 : xmpLength]]) {
    payload.writeUInt16BE(id, cursor); cursor += 2;
    payload.writeUInt16BE(1, cursor); cursor += 2;
    payload.writeUInt16BE(0, cursor); cursor += 2;
    payload.writeUInt16BE(1, cursor); cursor += 2;
    if (indexed) { payload.writeUInt32BE(1, cursor); cursor += 4; }
    payload.writeUInt32BE(offset, cursor); cursor += 4;
    payload.writeUInt32BE(length, cursor); cursor += 4;
  }
  return box("iloc", payload);
}

function makeIdatItemFile(brand, options = {}) {
  const exif = Buffer.concat([Buffer.alloc(4), tiff]);
  exif.writeUInt32BE(0, 0);
  const xmp = Buffer.from("<x:xmpmeta><rdf:RDF/></x:xmpmeta>", "utf8");
  const ftyp = box("ftyp", Buffer.concat([Buffer.from(brand, "ascii"), Buffer.alloc(4)]));
  const meta = box("meta", Buffer.concat([
    Buffer.alloc(4),
    pitm(3),
    box("iinf", Buffer.concat([Buffer.from([0, 0, 0, 0, 0, 2]), infe(1, "Exif"), infe(2, "mime", "application/rdf+xml")])),
    ilocIdat(exif.length, xmp.length, options),
    box("idat", Buffer.concat([exif, xmp])),
    itemProperties([[2, 2]], [[3, options.includeIcc ? [1, 2] : [1]]], options.includeIcc ? iccProfile : null),
  ]));
  return Buffer.concat([ftyp, meta]);
}

// Deliberately split an Exif item's information and location across two
// MetaBoxes. Item IDs are MetaBox-local, so a safe parser must not combine
// these into a resolvable item.
function makeCrossMetaItemFile(brand) {
  const exif = Buffer.concat([Buffer.alloc(4), tiff]);
  const ftyp = box("ftyp", Buffer.concat([Buffer.from(brand, "ascii"), Buffer.alloc(4)]));
  const itemInfoMeta = box("meta", Buffer.concat([
    Buffer.alloc(4),
    box("iinf", Buffer.concat([Buffer.from([0, 0, 0, 0, 0, 1]), infe(1, "Exif")])),
  ]));
  const locationMeta = box("meta", Buffer.concat([
    Buffer.alloc(4),
    ilocIdat(exif.length, 0),
    box("idat", exif),
  ]));
  return Buffer.concat([ftyp, itemInfoMeta, locationMeta]);
}

const heif = makeFile("heic");
const avif = makeFile("avif");
const heifItem = makeItemFile("heic");
const avifItem = makeItemFile("avif");
const heifPrimaryDimensions = makeItemFile("heic", true);
const avifPrimaryDimensions = makeItemFile("avif", true);
const heifConflictingPrimaryDimensions = makeItemFile("heic", true, true);
const heifIdatItem = makeIdatItemFile("heic");
const avifIdatItem = makeIdatItemFile("avif");
const heifIndexedIdatItem = makeIdatItemFile("heic", { indexed: true });
const heifTailIdatItem = makeIdatItemFile("heic", { xmpToEnd: true });
const heifIccItem = makeIdatItemFile("heic", { includeIcc: true });
const avifIccItem = makeIdatItemFile("avif", { includeIcc: true });
const heifCrossMetaItem = makeCrossMetaItemFile("heic");
const malformedHeifIccItem = Buffer.from(heifIccItem);
const iccSignature = malformedHeifIccItem.indexOf(Buffer.from("acsp", "ascii"));
if (iccSignature < 0) throw new Error("HEIF ICC fixture has no ICC signature");
malformedHeifIccItem[iccSignature] = 0x00;
await writeFile(resolve(root, "tests/fixtures/heif-metadata.heic"), heif);
await writeFile(resolve(root, "tests/fixtures/heif-truncated.heic"), heif.subarray(0, heif.length - 5));
await writeFile(resolve(root, "tests/fixtures/avif-metadata.avif"), avif);
await writeFile(resolve(root, "tests/fixtures/heif-item-metadata.heic"), heifItem);
await writeFile(resolve(root, "tests/fixtures/heif-item-truncated.heic"), heifItem.subarray(0, heifItem.length - 5));
await writeFile(resolve(root, "tests/fixtures/avif-item-metadata.avif"), avifItem);
await writeFile(resolve(root, "tests/fixtures/heif-primary-dimensions.heic"), heifPrimaryDimensions);
await writeFile(resolve(root, "tests/fixtures/avif-primary-dimensions.avif"), avifPrimaryDimensions);
await writeFile(resolve(root, "tests/fixtures/heif-conflicting-primary-dimensions.heic"), heifConflictingPrimaryDimensions);
await writeFile(resolve(root, "tests/fixtures/heif-idat-item-metadata.heic"), heifIdatItem);
await writeFile(resolve(root, "tests/fixtures/avif-idat-item-metadata.avif"), avifIdatItem);
await writeFile(resolve(root, "tests/fixtures/heif-indexed-idat-item-metadata.heic"), heifIndexedIdatItem);
await writeFile(resolve(root, "tests/fixtures/heif-tail-idat-item-metadata.heic"), heifTailIdatItem);
await writeFile(resolve(root, "tests/fixtures/heif-primary-icc.heic"), heifIccItem);
await writeFile(resolve(root, "tests/fixtures/avif-primary-icc.avif"), avifIccItem);
await writeFile(resolve(root, "tests/fixtures/heif-primary-icc-malformed.heic"), malformedHeifIccItem);
await writeFile(resolve(root, "tests/fixtures/heif-cross-meta-item-reference.heic"), heifCrossMetaItem);
