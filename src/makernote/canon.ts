import { createMakerNotePack, tag } from "../metadata/makernote-pack.js";
import { fixtureSource, makerNoteReference, rawPixlsIndex } from "../metadata/makernote-pack-sources.js";

const canon = createMakerNotePack({
  identity: {
    id: "org.browser-image-metadata.makernote.canon",
    version: "1.0.0",
    vendor: "Canon",
    noteFamily: "Canon Camera MakerNote",
    supportedModels: ["Canon EOS 7D"],
    minimumConfidence: 0.9,
    signatureTests: ["bounded little-endian directory", "first directory tags include Canon camera settings"],
    byteOrder: "little-endian",
    baseOffsetRule: "note-start",
    nestedIfd: "bounded",
    encryption: "none",
    securityRequirements: ["bounded directory count", "safe value multiplication", "opaque unknown tags", "no network or filesystem access"],
  },
  sources: [
    makerNoteReference,
    rawPixlsIndex,
    fixtureSource("canon-eos-7d-raw", "https://raw.pixls.us/data/Canon/EOS%207D/RAW_CANON_EOS_7D-raw.CR2", "b5e47c5fcf7332ac03e0134926f17a338a42e68c1fd7f83e16f45f4b767544e8"),
    fixtureSource("canon-eos-7d-image", "https://raw.pixls.us/data/Canon/EOS%207D/_MG_0001.CR2", "b303a596a7d8888b56a265d3b9ec78ae4f3fa3dd68c20c8276a50250393fdb39"),
  ],
  signatures: [],
  detectStructure: (context) => {
    if (context.noteLength < 14) return false;
    const count = context.readUint16(0, "little-endian");
    if (count === 0 || count > 4096 || 2 + count * 12 > context.noteLength) return false;
    const firstTag = context.readUint16(2, "little-endian");
    return firstTag === 0x0001 || firstTag === 0x0002 || firstTag === 0x0004;
  },
  layout: { byteOrder: "little-endian", countOffset: 0, entriesOffset: 2, valueOrigin: 0 },
  tags: [
    tag({ id: "canon:0x0001", tag: 0x0001, name: "CanonCameraSettings", label: "Canon camera settings", description: "Canon camera-settings directory payload." , type: "SHORT", decoder: "number", repeatable: true, sensitivity: "moderate", rawValueBehavior: "retain", source: "Canon MakerNote tag 0x0001; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "canon:0x0002", tag: 0x0002, name: "CanonMovieInfo", label: "Canon movie information", description: "Canon movie-information payload." , type: "SHORT", decoder: "number", repeatable: true, sensitivity: "moderate", rawValueBehavior: "retain", source: "Canon MakerNote tag 0x0002; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "canon:0x0004", tag: 0x0004, name: "CanonImageType", label: "Canon image type", description: "Canon image type or capture mode values." , type: "SHORT", decoder: "number", repeatable: true, sensitivity: "moderate", rawValueBehavior: "retain", source: "Canon MakerNote tag 0x0004; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "canon:0x0006", tag: 0x0006, name: "CanonFirmwareVersion", label: "Canon firmware version", description: "Canon firmware version text." , type: "ASCII", decoder: "text", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Canon MakerNote tag 0x0006; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "canon:0x0007", tag: 0x0007, name: "CanonFileNumber", label: "Canon file number", description: "Canon capture file number." , type: "ASCII", decoder: "text", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Canon MakerNote tag 0x0007; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "canon:0x0009", tag: 0x0009, name: "CanonOwnerName", label: "Canon owner name", description: "Canon owner name text." , type: "ASCII", decoder: "text", repeatable: false, sensitivity: "high", rawValueBehavior: "retain", source: "Canon MakerNote tag 0x0009; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "canon:0x000c", tag: 0x000c, name: "CanonSerialNumber", label: "Canon serial number", description: "Canon camera serial identifier." , type: "LONG", decoder: "number", repeatable: false, sensitivity: "high", rawValueBehavior: "retain", source: "Canon MakerNote tag 0x000C; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "canon:0x000d", tag: 0x000d, name: "CanonCameraInfo", label: "Canon camera information", description: "Canon camera-information directory payload." , type: "SHORT", decoder: "number", repeatable: true, sensitivity: "moderate", rawValueBehavior: "retain", source: "Canon MakerNote tag 0x000D; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "canon:0x0013", tag: 0x0013, name: "CanonOriginalFileName", label: "Canon original filename", description: "Canon original filename text." , type: "ASCII", decoder: "text", repeatable: false, sensitivity: "high", rawValueBehavior: "retain", source: "Canon MakerNote tag 0x0013; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
  ],
});

export default canon;
