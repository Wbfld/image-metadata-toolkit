import { createMakerNotePack, tag } from "../metadata/makernote-pack.js";
import { fixtureSource, makerNoteReference, rawPixlsIndex } from "../metadata/makernote-pack-sources.js";

const pentax = createMakerNotePack({
  identity: {
    id: "org.browser-image-metadata.makernote.pentax",
    version: "1.0.0",
    vendor: "Pentax",
    noteFamily: "Pentax PEF MakerNote directory",
    supportedModels: ["Pentax K-1"],
    minimumConfidence: 0.9,
    signatureTests: ["PENTAX prefix", "little-endian marker", "bounded four-byte directory count"],
    byteOrder: "little-endian",
    baseOffsetRule: "note-start",
    nestedIfd: "bounded",
    encryption: "none",
    securityRequirements: ["bounded four-byte directory count", "safe value multiplication", "unknown tags remain opaque", "no network or filesystem access"],
  },
  sources: [
    makerNoteReference,
    rawPixlsIndex,
    fixtureSource("pentax-k-1-8550", "https://raw.pixls.us/data/Pentax/K-1/IMGP8550.PEF", "068c902e7b38ac31c7c6eca5c55f69ca395ec6aa7170489281b692a893d0fee9"),
    fixtureSource("pentax-k-1-8552", "https://raw.pixls.us/data/Pentax/K-1/IMGP8552.PEF", "aea857a6bd9f2cdf02b3370b0a597f89dd31f567af84b7bc0a770f547d0a0d85"),
  ],
  signatures: [
    { offset: 0, bytes: [0x50, 0x45, 0x4e, 0x54, 0x41, 0x58, 0x20], description: "Pentax MakerNote prefix" },
    { offset: 8, bytes: [0x49, 0x49, 0x79, 0x00], description: "Pentax little-endian marker" },
  ],
  detectStructure: (context) => {
    if (context.noteLength < 36) return false;
    const count = context.readUint32(20, "little-endian");
    return count > 0 && count <= 4096 && 24 + count * 12 <= context.noteLength;
  },
  layout: { byteOrder: "little-endian", countOffset: 20, countSize: 4, entriesOffset: 24, valueOrigin: 0 },
  tags: [
    tag({ id: "pentax:0x0001", tag: 0x0001, name: "PentaxCaptureMode", label: "Pentax capture mode", description: "Pentax capture-mode value.", type: "SHORT", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Pentax MakerNote directory tag 0x0001; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "pentax:0x0002", tag: 0x0002, name: "PentaxQuality", label: "Pentax quality", description: "Pentax image-quality values.", type: "SHORT", decoder: "number", repeatable: true, sensitivity: "moderate", rawValueBehavior: "retain", source: "Pentax MakerNote directory tag 0x0002; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "pentax:0x0003", tag: 0x0003, name: "PentaxFocusMode", label: "Pentax focus mode", description: "Pentax focus-mode value.", type: "LONG", decoder: "number", repeatable: false, sensitivity: "high", rawValueBehavior: "retain", source: "Pentax MakerNote directory tag 0x0003; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "pentax:0x0004", tag: 0x0004, name: "PentaxWhiteBalance", label: "Pentax white balance", description: "Pentax white-balance value.", type: "LONG", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Pentax MakerNote directory tag 0x0004; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "pentax:0x0005", tag: 0x0005, name: "PentaxImageSize", label: "Pentax image size", description: "Pentax image-size value.", type: "LONG", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Pentax MakerNote directory tag 0x0005; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "pentax:0x0006", tag: 0x0006, name: "PentaxSerialPayload", label: "Pentax serial payload", description: "Pentax device identity payload.", type: "UNDEFINED", decoder: "bytes", repeatable: false, sensitivity: "high", rawValueBehavior: "opaque", source: "Pentax MakerNote directory tag 0x0006; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "pentax:0x0007", tag: 0x0007, name: "PentaxLensData", label: "Pentax lens data", description: "Pentax lens-information payload.", type: "UNDEFINED", decoder: "bytes", repeatable: false, sensitivity: "high", rawValueBehavior: "opaque", source: "Pentax MakerNote directory tag 0x0007; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "pentax:0x0008", tag: 0x0008, name: "PentaxFlashMode", label: "Pentax flash mode", description: "Pentax flash-mode value.", type: "SHORT", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Pentax MakerNote directory tag 0x0008; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "pentax:0x000c", tag: 0x000c, name: "PentaxExposureCompensation", label: "Pentax exposure compensation", description: "Pentax exposure-compensation values.", type: "SHORT", decoder: "number", repeatable: true, sensitivity: "moderate", rawValueBehavior: "retain", unit: "EV", source: "Pentax MakerNote directory tag 0x000C; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "pentax:0x000d", tag: 0x000d, name: "PentaxCaptureParameter", label: "Pentax capture parameter", description: "Pentax capture parameter whose vendor meaning is retained as a numeric value without an unverified shutter-count claim.", type: "SHORT", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Pentax MakerNote directory tag 0x000D; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "pentax:0x000e", tag: 0x000e, name: "PentaxAperture", label: "Pentax aperture", description: "Pentax aperture value.", type: "SHORT", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Pentax MakerNote directory tag 0x000E; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
    tag({ id: "pentax:0x0012", tag: 0x0012, name: "PentaxAuxiliaryCaptureParameter", label: "Pentax auxiliary capture parameter", description: "Pentax auxiliary capture parameter retained as a numeric value without an unverified lens-serial claim.", type: "LONG", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Pentax MakerNote directory tag 0x0012; independently derived from pinned CC0 fixtures and corroborated by Exiv2 documentation" }),
  ],
});

export default pentax;
