import { createMakerNotePack, tag } from "../metadata/makernote-pack.js";
import { fixtureSource, makerNoteReference, rawPixlsIndex } from "../metadata/makernote-pack-sources.js";

const fujifilm = createMakerNotePack({
  identity: {
    id: "org.browser-image-metadata.makernote.fujifilm",
    version: "1.0.0",
    vendor: "Fujifilm",
    noteFamily: "Fujifilm RAF MakerNote directory",
    supportedModels: ["Fujifilm X-T3"],
    minimumConfidence: 0.9,
    signatureTests: ["FUJIFILM MakerNote prefix", "bounded little-endian four-byte directory count", "direct RAF MakerNote entry table"],
    byteOrder: "little-endian",
    baseOffsetRule: "note-start",
    nestedIfd: "bounded",
    encryption: "none",
    securityRequirements: ["bounded four-byte directory count", "safe value multiplication", "unknown tags remain opaque", "no network or filesystem access"],
  },
  sources: [
    makerNoteReference,
    rawPixlsIndex,
    fixtureSource("fujifilm-x-t3-2720", "https://raw.pixls.us/data/Fujifilm/X-T3/AFXT2720.RAF", "24abd27b4a200f3170ea1579672944b807d0eb35bf21422a3937bb644f27f2eb"),
    fixtureSource("fujifilm-x-t3-2721", "https://raw.pixls.us/data/Fujifilm/X-T3/AFXT2721.RAF", "95b33021160b239ceb1a09d46a1b29cb60cb7dd47581feb126b337c219091754"),
  ],
  signatures: [{ offset: 0, bytes: [0x46, 0x55, 0x4a, 0x49, 0x46, 0x49, 0x4c, 0x4d], description: "Fujifilm MakerNote prefix" }],
  detectStructure: (context) => {
    if (context.noteLength < 54) return false;
    const count = context.readUint32(12, "little-endian");
    return count > 0 && count <= 4096 && 50 + count * 12 <= context.noteLength;
  },
  layout: { byteOrder: "little-endian", countOffset: 12, countSize: 4, entriesOffset: 50, valueOrigin: 0 },
  tags: [
    tag({ id: "fujifilm:0x1000", tag: 0x1000, name: "FujifilmQuality", label: "Fujifilm image quality", description: "Fujifilm image-quality text, such as the documented quality mode.", type: "ASCII", decoder: "text", repeatable: false, sensitivity: "low", rawValueBehavior: "retain", source: "Fujifilm MakerNote directory tag 0x1000; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "fujifilm:0x1001", tag: 0x1001, name: "FujifilmImageQuality", label: "Fujifilm image quality", description: "Fujifilm image-quality value.", type: "SHORT", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Fujifilm MakerNote directory tag 0x1001; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "fujifilm:0x1002", tag: 0x1002, name: "FujifilmSharpness", label: "Fujifilm sharpness", description: "Fujifilm in-camera sharpness value.", type: "SHORT", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Fujifilm MakerNote directory tag 0x1002; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "fujifilm:0x1003", tag: 0x1003, name: "FujifilmWhiteBalance", label: "Fujifilm white balance", description: "Fujifilm white-balance value.", type: "SHORT", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Fujifilm MakerNote directory tag 0x1003; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "fujifilm:0x100a", tag: 0x100a, name: "FujifilmColorTemperature", label: "Fujifilm color temperature", description: "Fujifilm color-temperature values.", type: "SLONG", decoder: "number", repeatable: true, sensitivity: "moderate", rawValueBehavior: "retain", unit: "kelvin", source: "Fujifilm MakerNote directory tag 0x100A; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "fujifilm:0x100b", tag: 0x100b, name: "FujifilmContrast", label: "Fujifilm contrast", description: "Fujifilm in-camera contrast value.", type: "SHORT", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Fujifilm MakerNote directory tag 0x100B; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "fujifilm:0x100e", tag: 0x100e, name: "FujifilmSaturation", label: "Fujifilm saturation", description: "Fujifilm in-camera saturation value.", type: "SHORT", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Fujifilm MakerNote directory tag 0x100E; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "fujifilm:0x1010", tag: 0x1010, name: "FujifilmFlashMode", label: "Fujifilm flash mode", description: "Fujifilm flash-mode value.", type: "SHORT", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Fujifilm MakerNote directory tag 0x1010; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "fujifilm:0x1011", tag: 0x1011, name: "FujifilmFlashExposureCompensation", label: "Fujifilm flash exposure compensation", description: "Fujifilm flash exposure-compensation rational.", type: "SRATIONAL", decoder: "rational", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", unit: "EV", source: "Fujifilm MakerNote directory tag 0x1011; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "fujifilm:0x1021", tag: 0x1021, name: "FujifilmFocusMode", label: "Fujifilm focus mode", description: "Fujifilm focus-mode value.", type: "SHORT", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Fujifilm MakerNote directory tag 0x1021; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "fujifilm:0x1022", tag: 0x1022, name: "FujifilmAFMode", label: "Fujifilm autofocus mode", description: "Fujifilm autofocus-mode value.", type: "SHORT", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Fujifilm MakerNote directory tag 0x1022; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "fujifilm:0x1023", tag: 0x1023, name: "FujifilmFocusPoint", label: "Fujifilm focus point", description: "Fujifilm focus-point values.", type: "SHORT", decoder: "number", repeatable: true, sensitivity: "high", rawValueBehavior: "retain", source: "Fujifilm MakerNote directory tag 0x1023; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "fujifilm:0x1025", tag: 0x1025, name: "FujifilmImageStabilization", label: "Fujifilm image stabilization", description: "Fujifilm image-stabilization state.", type: "LONG", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Fujifilm MakerNote directory tag 0x1025; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "fujifilm:0x1031", tag: 0x1031, name: "FujifilmLensType", label: "Fujifilm lens type", description: "Fujifilm lens type value.", type: "SHORT", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Fujifilm MakerNote directory tag 0x1031; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "fujifilm:0x1040", tag: 0x1040, name: "FujifilmSerialNumber", label: "Fujifilm serial number", description: "Fujifilm camera serial value.", type: "SLONG", decoder: "number", repeatable: false, sensitivity: "high", rawValueBehavior: "retain", source: "Fujifilm MakerNote directory tag 0x1040; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "fujifilm:0x1041", tag: 0x1041, name: "FujifilmLensSerialNumber", label: "Fujifilm lens serial number", description: "Fujifilm lens serial value.", type: "SLONG", decoder: "number", repeatable: false, sensitivity: "high", rawValueBehavior: "retain", source: "Fujifilm MakerNote directory tag 0x1041; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "fujifilm:0x1404", tag: 0x1404, name: "FujifilmExposureTime", label: "Fujifilm exposure time", description: "Fujifilm exposure-time rational.", type: "RATIONAL", decoder: "rational", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", unit: "seconds", source: "Fujifilm MakerNote directory tag 0x1404; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "fujifilm:0x1405", tag: 0x1405, name: "FujifilmFNumber", label: "Fujifilm f-number", description: "Fujifilm f-number rational.", type: "RATIONAL", decoder: "rational", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Fujifilm MakerNote directory tag 0x1405; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "fujifilm:0x1406", tag: 0x1406, name: "FujifilmExposureCompensation", label: "Fujifilm exposure compensation", description: "Fujifilm exposure-compensation rational.", type: "SRATIONAL", decoder: "rational", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", unit: "EV", source: "Fujifilm MakerNote directory tag 0x1406; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "fujifilm:0x1407", tag: 0x1407, name: "FujifilmWhiteBalanceTemperature", label: "Fujifilm white-balance temperature", description: "Fujifilm white-balance temperature rational.", type: "RATIONAL", decoder: "rational", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", unit: "kelvin", source: "Fujifilm MakerNote directory tag 0x1407; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "fujifilm:0x1439", tag: 0x1439, name: "FujifilmImageGeneration", label: "Fujifilm image generation", description: "Fujifilm image-generation text.", type: "ASCII", decoder: "text", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Fujifilm MakerNote directory tag 0x1439; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "fujifilm:0x1447", tag: 0x1447, name: "FujifilmModel", label: "Fujifilm model identifier", description: "Fujifilm model or MakerNote model identifier text.", type: "ASCII", decoder: "text", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Fujifilm MakerNote directory tag 0x1447; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
  ],
});

export default fujifilm;
