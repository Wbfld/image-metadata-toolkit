import { createMakerNotePack, tag } from "../metadata/makernote-pack.js";
import { fixtureSource, makerNoteReference, rawPixlsIndex } from "../metadata/makernote-pack-sources.js";

const sony = createMakerNotePack({
  identity: {
    id: "org.browser-image-metadata.makernote.sony",
    version: "1.0.0",
    vendor: "Sony",
    noteFamily: "Sony direct MakerNote directory",
    supportedModels: ["NEX-6", "DSC-HX99"],
    minimumConfidence: 0.9,
    signatureTests: ["Sony direct-directory marker 0x59", "bounded little-endian entry table"],
    byteOrder: "little-endian",
    baseOffsetRule: "note-start",
    nestedIfd: "bounded",
    encryption: "none",
    securityRequirements: ["bounded direct directory count", "safe type/count multiplication", "unknown values remain opaque", "no network or filesystem access"],
  },
  sources: [
    makerNoteReference,
    rawPixlsIndex,
    fixtureSource("sony-nex-6", "https://raw.pixls.us/data/Sony/NEX-6/DSC07133.ARW", "bf4c6d21136aa4fd626212fe72b962b6404e3fca45cdc3b6afbed8e73fee2cf8"),
    fixtureSource("sony-dsc-hx99", "https://raw.pixls.us/data/Sony/DSC-HX99/DSC00001.ARW", "0223d56b8c3af16e6f588b5340275c9bb30bed2cb5a5cafb0f3ffc7ef4da84e4"),
  ],
  signatures: [],
  detectStructure: (context) => {
    const count = context.readUint8(0);
    if (count === 0 || count > 255 || 2 + count * 12 > context.noteLength) return false;
    const firstTag = context.readUint16(2, "little-endian");
    return firstTag === 0x1003 || firstTag === 0x2003 || firstTag === 0x9400;
  },
  layout: { byteOrder: "little-endian", countOffset: 0, entriesOffset: 2, valueOrigin: 0 },
  tags: [
    tag({ id: "sony:0x1003", tag: 0x1003, name: "SonyCameraSettings", label: "Sony camera settings", description: "Sony camera-settings payload." , type: "LONG", decoder: "number", repeatable: true, sensitivity: "moderate", rawValueBehavior: "retain", source: "Sony MakerNote tag 0x1003; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "sony:0x2003", tag: 0x2003, name: "SonyLensSpecification", label: "Sony lens specification", description: "Sony lens-specification text." , type: "ASCII", decoder: "text", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Sony MakerNote tag 0x2003; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "sony:0x200c", tag: 0x200c, name: "SonyFocusPosition", label: "Sony focus position", description: "Sony focus-position values." , type: "LONG", decoder: "number", repeatable: true, sensitivity: "moderate", rawValueBehavior: "retain", source: "Sony MakerNote tag 0x200C; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "sony:0x200d", tag: 0x200d, name: "SonyExposureRational", label: "Sony exposure rational", description: "Sony exposure rational." , type: "RATIONAL", decoder: "rational", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Sony MakerNote tag 0x200D; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "sony:0x2014", tag: 0x2014, name: "SonyShutterState", label: "Sony shutter state", description: "Sony shutter-state values." , type: "SLONG", decoder: "number", repeatable: true, sensitivity: "high", rawValueBehavior: "retain", source: "Sony MakerNote tag 0x2014; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "sony:0xb020", tag: 0xb020, name: "SonyLensFirmware", label: "Sony lens firmware", description: "Sony lens firmware or model text." , type: "ASCII", decoder: "text", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Sony MakerNote tag 0xB020; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "sony:0xb02a", tag: 0xb02a, name: "SonyLensMountData", label: "Sony lens mount data", description: "Sony lens-mount byte payload." , type: "BYTE", decoder: "bytes", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Sony MakerNote tag 0xB02A; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
    tag({ id: "sony:0x9400", tag: 0x9400, name: "SonyRawImageData", label: "Sony raw image data", description: "Sony raw image auxiliary payload." , type: "UNDEFINED", decoder: "bytes", repeatable: false, sensitivity: "high", rawValueBehavior: "opaque", source: "Sony MakerNote tag 0x9400; independently derived from pinned CC0 samples and corroborated by Exiv2 documentation" }),
  ],
});

export default sony;
