import { createMakerNotePack, tag } from "../metadata/makernote-pack.js";
import { fixtureSource, makerNoteReference, rawPixlsIndex } from "../metadata/makernote-pack-sources.js";

const nikon = createMakerNotePack({
  identity: {
    id: "org.browser-image-metadata.makernote.nikon",
    version: "1.0.0",
    vendor: "Nikon",
    noteFamily: "Nikon Type 3 MakerNote",
    supportedModels: ["NIKON D3200", "NIKON 1 AW1"],
    minimumConfidence: 0.9,
    signatureTests: ["Nikon prefix", "Nikon TIFF marker at note offset 10", "big-endian offset-bounded directory"],
    byteOrder: "from-note",
    baseOffsetRule: "declared-by-detection",
    nestedIfd: "bounded",
    encryption: "none",
    securityRequirements: ["bounded 16-bit directory count", "TIFF offsets remain note-relative to the embedded header", "unknown data remains opaque", "no network or filesystem access"],
  },
  sources: [
    makerNoteReference,
    rawPixlsIndex,
    fixtureSource("nikon-d3200", "https://raw.pixls.us/data/Nikon/D3200/DSC_0059.NEF", "91657dd8e9c7a086826683f6d20799685657dd7ca2056702b145851465f57cd3"),
    fixtureSource("nikon-1-aw1", "https://raw.pixls.us/data/Nikon/1%20AW1/_DSC0521.NEF", "519d354ec40907f1cd30329fc1a641ddec5b46e08e88883f3cf2fddc4ddd9974"),
  ],
  signatures: [{ offset: 0, bytes: [0x4e, 0x69, 0x6b, 0x6f, 0x6e], description: "Nikon MakerNote prefix" }],
  detectByteOrder: (context) => {
    if (context.noteLength < 14) return "unknown";
    const marker = context.read(10, 4);
    if (marker[0] === 0x4d && marker[1] === 0x4d && marker[2] === 0x00 && marker[3] === 0x2a) return "big-endian";
    if (marker[0] === 0x49 && marker[1] === 0x49 && marker[2] === 0x2a && marker[3] === 0x00) return "little-endian";
    return "unknown";
  },
  detectStructure: (context) => {
    if (context.noteLength < 20) return false;
    const marker = context.read(10, 4);
    const order = marker[0] === 0x49 && marker[1] === 0x49 ? "little-endian" : marker[0] === 0x4d && marker[1] === 0x4d ? "big-endian" : null;
    if (order === null) return false;
    const count = context.readUint16(18, order);
    return count > 0 && count <= 4096 && 20 + count * 12 <= context.noteLength;
  },
  layoutForDetection: (_context, detection) => detection.byteOrder === "little-endian" || detection.byteOrder === "big-endian"
    ? { byteOrder: detection.byteOrder, countOffset: 18, entriesOffset: 20, valueOrigin: 10 }
    : null,
  layout: { byteOrder: "big-endian", countOffset: 18, entriesOffset: 20, valueOrigin: 10 },
  tags: [
    tag({ id: "nikon:0x0001", tag: 0x0001, name: "NikonMakerNoteVersion", label: "Nikon MakerNote version", description: "Nikon MakerNote version bytes." , type: "UNDEFINED", decoder: "bytes", repeatable: false, sensitivity: "low", rawValueBehavior: "retain", source: "Nikon Type 3 directory tag 0x0001; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "nikon:0x0002", tag: 0x0002, name: "NikonISOSettings", label: "Nikon ISO settings", description: "Nikon ISO setting pair." , type: "SHORT", decoder: "number", repeatable: true, sensitivity: "moderate", rawValueBehavior: "retain", source: "Nikon MakerNote tag 0x0002; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "nikon:0x0004", tag: 0x0004, name: "NikonQuality", label: "Nikon image quality", description: "Nikon capture quality text." , type: "ASCII", decoder: "text", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Nikon MakerNote tag 0x0004; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "nikon:0x0005", tag: 0x0005, name: "NikonWhiteBalance", label: "Nikon white balance", description: "Nikon white-balance mode." , type: "ASCII", decoder: "text", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Nikon MakerNote tag 0x0005; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "nikon:0x0007", tag: 0x0007, name: "NikonFocusMode", label: "Nikon focus mode", description: "Nikon focus-mode text." , type: "ASCII", decoder: "text", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Nikon MakerNote tag 0x0007; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "nikon:0x0008", tag: 0x0008, name: "NikonFlashSetting", label: "Nikon flash setting", description: "Nikon flash-setting text." , type: "ASCII", decoder: "text", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Nikon MakerNote tag 0x0008; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "nikon:0x0009", tag: 0x0009, name: "NikonFlashType", label: "Nikon flash type", description: "Nikon flash-type text." , type: "ASCII", decoder: "text", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Nikon MakerNote tag 0x0009; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "nikon:0x000b", tag: 0x000b, name: "NikonWhiteBalanceFineTune", label: "Nikon white-balance fine tune", description: "Nikon fine-tuning pair." , type: "SSHORT", decoder: "number", repeatable: true, sensitivity: "moderate", rawValueBehavior: "retain", source: "Nikon MakerNote tag 0x000B; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "nikon:0x000c", tag: 0x000c, name: "NikonWhiteBalanceLevels", label: "Nikon white-balance levels", description: "Nikon white-balance rational levels." , type: "RATIONAL", decoder: "rational", repeatable: true, sensitivity: "moderate", rawValueBehavior: "retain", source: "Nikon MakerNote tag 0x000C; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "nikon:0x00a7", tag: 0x00a7, name: "NikonShutterCount", label: "Nikon shutter count", description: "Nikon shutter-actuation count." , type: "LONG", decoder: "number", repeatable: false, sensitivity: "high", rawValueBehavior: "retain", source: "Nikon MakerNote tag 0x00A7; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
  ],
});

export default nikon;
