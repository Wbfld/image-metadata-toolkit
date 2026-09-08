import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const iccJpeg = await readFile(resolve(root, "tests/fixtures/jpeg-icc.jpg"));
const output = resolve(root, "tests/fixtures/tiff-metadata.tif");
const truncatedOutput = resolve(root, "tests/fixtures/tiff-metadata-truncated.tif");
const marker = Buffer.from("ICC_PROFILE\0", "ascii");
const markerOffset = iccJpeg.indexOf(marker);
if (markerOffset < 0) throw new Error("JPEG fixture has no ICC profile");
const profileStart = markerOffset + marker.length + 2;
const profile = iccJpeg.subarray(profileStart, profileStart + iccJpeg.readUInt32BE(profileStart));
const xmp = Buffer.from("<x:xmpmeta><rdf:RDF/></x:xmpmeta>", "utf8");

const iptc = Buffer.concat([
  Buffer.from([0x1c, 0x02, 0x19, 0x00, 0x05]), Buffer.from("news\0", "latin1"),
  Buffer.from([0x1c, 0x02, 0x19, 0x00, 0x07]), Buffer.from("fixture", "latin1"),
]);
const valueStart = 8 + 2 + 5 * 12 + 4;
const xmpOffset = valueStart;
const iccOffset = (xmpOffset + xmp.length + 3) & ~3;
const iptcOffset = (iccOffset + profile.length + 3) & ~3;
const bytes = Buffer.alloc(iptcOffset + iptc.length);
bytes.write("II", 0, "ascii");
bytes.writeUInt16LE(42, 2);
bytes.writeUInt32LE(8, 4);
bytes.writeUInt16LE(5, 8);

function entry(offset, tag, type, count, value) {
  bytes.writeUInt16LE(tag, offset);
  bytes.writeUInt16LE(type, offset + 2);
  bytes.writeUInt32LE(count, offset + 4);
  bytes.writeUInt32LE(value, offset + 8);
}

entry(10, 0x0100, 4, 1, 2);
entry(22, 0x0101, 4, 1, 2);
entry(34, 700, 7, xmp.length, xmpOffset);
entry(46, 34675, 7, profile.length, iccOffset);
entry(58, 33723, 7, iptc.length, iptcOffset);
bytes.writeUInt32LE(0, 70);
xmp.copy(bytes, xmpOffset);
profile.copy(bytes, iccOffset);
iptc.copy(bytes, iptcOffset);
await writeFile(output, bytes);
await writeFile(truncatedOutput, bytes.subarray(0, bytes.length - 7));
