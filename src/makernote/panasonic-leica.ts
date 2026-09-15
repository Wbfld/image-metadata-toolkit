import { createMakerNotePack, tag } from "../metadata/makernote-pack.js";
import { fixtureSource, makerNoteReference, rawPixlsIndex } from "../metadata/makernote-pack-sources.js";

const PANASONIC = new Uint8Array([0x50, 0x61, 0x6e, 0x61, 0x73, 0x6f, 0x6e, 0x69, 0x63]);

function findPanasonicNote(context: Parameters<NonNullable<Parameters<typeof createMakerNotePack>[0]["layoutOffset"]>>[0]): number | null {
  const searchLength = Math.min(context.noteLength, 1024 * 1024);
  if (searchLength < PANASONIC.length + 14) return null;
  const bytes = context.read(0, searchLength);
  for (let offset = 0; offset <= bytes.length - PANASONIC.length - 14; offset += 1) {
    let matches = true;
    for (let index = 0; index < PANASONIC.length; index += 1) if (bytes[offset + index] !== PANASONIC[index]) { matches = false; break; }
    if (!matches) continue;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const count = view.getUint16(offset + 12, true);
    if (count > 0 && count <= 4096 && 14 + count * 12 <= bytes.length - offset) return offset;
  }
  return null;
}

const panasonicLeica = createMakerNotePack({
  identity: {
    id: "org.browser-image-metadata.makernote.panasonic-leica",
    version: "1.0.0",
    vendor: "Panasonic/Leica",
    noteFamily: "Panasonic/Leica embedded-JPEG MakerNote directory",
    supportedModels: ["Panasonic DMC-GF6"],
    minimumConfidence: 0.9,
    signatureTests: ["embedded JPEG carrier", "Panasonic MakerNote prefix inside carrier", "bounded little-endian directory count"],
    byteOrder: "little-endian",
    baseOffsetRule: "note-start",
    nestedIfd: "bounded",
    encryption: "none",
    securityRequirements: ["bounded carrier scan", "safe nested offset arithmetic", "unknown values remain opaque", "no network or filesystem access"],
  },
  sources: [
    makerNoteReference,
    rawPixlsIndex,
    fixtureSource("panasonic-dmc-gf6-4x3", "https://raw.pixls.us/data/Panasonic/DMC-GF6/P1060736_4x3.RW2", "dace6b3818f00a5d4f7cc1cfc29744d15dcf7dd8684c882bea4a81c6ef670ad0"),
    fixtureSource("panasonic-dmc-gf6-3x2", "https://raw.pixls.us/data/Panasonic/DMC-GF6/P1060737_3x2.RW2", "3d839ffdc55819f9b47eaa966f39f60a09616e2c075979d2a479314ff2c41857"),
  ],
  signatures: [{ offset: 0, bytes: [0xff, 0xd8, 0xff], description: "Panasonic embedded JPEG carrier" }],
  layoutOffset: findPanasonicNote,
  detectStructure: (context) => findPanasonicNote(context) !== null,
  layout: { byteOrder: "little-endian", countOffset: 12, entriesOffset: 14, valueOrigin: 0 },
  tags: [
    tag({ id: "panasonic:0x0001", tag: 0x0001, name: "PanasonicQuality", label: "Panasonic quality", description: "Panasonic capture-quality value.", type: "SHORT", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Panasonic MakerNote directory tag 0x0001; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "panasonic:0x0002", tag: 0x0002, name: "PanasonicFirmwareVersion", label: "Panasonic firmware version", description: "Panasonic firmware byte payload.", type: "UNDEFINED", decoder: "bytes", repeatable: false, sensitivity: "moderate", rawValueBehavior: "opaque", source: "Panasonic MakerNote directory tag 0x0002; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "panasonic:0x0003", tag: 0x0003, name: "PanasonicWhiteBalance", label: "Panasonic white balance", description: "Panasonic white-balance value.", type: "SHORT", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Panasonic MakerNote directory tag 0x0003; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "panasonic:0x0007", tag: 0x0007, name: "PanasonicFocusMode", label: "Panasonic focus mode", description: "Panasonic focus-mode value.", type: "SHORT", decoder: "number", repeatable: false, sensitivity: "high", rawValueBehavior: "retain", source: "Panasonic MakerNote directory tag 0x0007; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "panasonic:0x000f", tag: 0x000f, name: "PanasonicSerialPayload", label: "Panasonic serial payload", description: "Panasonic device identity payload.", type: "BYTE", decoder: "bytes", repeatable: true, sensitivity: "high", rawValueBehavior: "opaque", source: "Panasonic MakerNote directory tag 0x000F; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "panasonic:0x001a", tag: 0x001a, name: "PanasonicLensType", label: "Panasonic lens type", description: "Panasonic lens type value.", type: "SHORT", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Panasonic MakerNote directory tag 0x001A; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "panasonic:0x001c", tag: 0x001c, name: "PanasonicLensSerialNumber", label: "Panasonic lens serial number", description: "Panasonic lens serial payload.", type: "SHORT", decoder: "number", repeatable: true, sensitivity: "high", rawValueBehavior: "retain", source: "Panasonic MakerNote directory tag 0x001C; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "panasonic:0x001f", tag: 0x001f, name: "PanasonicFocusPosition", label: "Panasonic focus position", description: "Panasonic focus-position value.", type: "SHORT", decoder: "number", repeatable: false, sensitivity: "high", rawValueBehavior: "retain", source: "Panasonic MakerNote directory tag 0x001F; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "panasonic:0x0020", tag: 0x0020, name: "PanasonicImageStabilization", label: "Panasonic image stabilization", description: "Panasonic image-stabilization value.", type: "SHORT", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Panasonic MakerNote directory tag 0x0020; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "panasonic:0x0021", tag: 0x0021, name: "PanasonicCameraInfo", label: "Panasonic camera information", description: "Panasonic camera-information payload.", type: "UNDEFINED", decoder: "bytes", repeatable: false, sensitivity: "high", rawValueBehavior: "opaque", source: "Panasonic MakerNote directory tag 0x0021; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "panasonic:0x0025", tag: 0x0025, name: "PanasonicSerialNumber", label: "Panasonic serial number", description: "Panasonic camera serial payload.", type: "UNDEFINED", decoder: "bytes", repeatable: false, sensitivity: "high", rawValueBehavior: "opaque", source: "Panasonic MakerNote directory tag 0x0025; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "panasonic:0x0029", tag: 0x0029, name: "PanasonicShutterCount", label: "Panasonic shutter count", description: "Panasonic shutter-actuation count.", type: "LONG", decoder: "number", repeatable: false, sensitivity: "high", rawValueBehavior: "retain", source: "Panasonic MakerNote directory tag 0x0029; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "panasonic:0x002b", tag: 0x002b, name: "PanasonicBurstCount", label: "Panasonic burst count", description: "Panasonic burst/capture count.", type: "LONG", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Panasonic MakerNote directory tag 0x002B; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "panasonic:0x0033", tag: 0x0033, name: "PanasonicCameraModel", label: "Panasonic camera model", description: "Panasonic camera-model text.", type: "ASCII", decoder: "text", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Panasonic MakerNote directory tag 0x0033; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
  ],
});

export default panasonicLeica;
