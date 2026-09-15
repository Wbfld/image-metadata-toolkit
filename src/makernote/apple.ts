import { createMakerNotePack, tag } from "../metadata/makernote-pack.js";
import { fixtureSource, makerNoteReference, rawPixlsIndex } from "../metadata/makernote-pack-sources.js";

const apple = createMakerNotePack({
  identity: {
    id: "org.browser-image-metadata.makernote.apple",
    version: "1.0.0",
    vendor: "Apple",
    noteFamily: "Apple iOS MakerNote",
    supportedModels: ["iPhone 6s Plus", "iPhone 7 Plus"],
    minimumConfidence: 0.9,
    signatureTests: ["Apple iOS marker at note offset 0", "big-endian Apple directory at offset 12"],
    byteOrder: "big-endian",
    baseOffsetRule: "note-start",
    nestedIfd: "bounded",
    encryption: "none",
    securityRequirements: ["bounded 16-bit directory count", "bounded value ranges", "fatal UTF-8 decoding", "no network or filesystem access"],
  },
  sources: [
    makerNoteReference,
    rawPixlsIndex,
    fixtureSource("apple-iphone-6s-plus", "https://raw.pixls.us/data/Apple/iPhone%206s%20Plus/IMG_0853.DNG", "845fee4f09c832af3728778737f5ae9b99124debb821b6e2066b94aed1daa91c"),
    fixtureSource("apple-iphone-7-plus", "https://raw.pixls.us/data/Apple/iPhone%207%20Plus/IMG_0739.DNG", "e8c7ebd8f22f7281d165496b91c8fea8a8e79c8113172fb499e1d66d6045332e"),
  ],
  signatures: [
    { offset: 0, bytes: [0x41, 0x70, 0x70, 0x6c, 0x65, 0x20, 0x69, 0x4f, 0x53], description: "Apple iOS MakerNote signature" },
    { offset: 12, bytes: [0x4d, 0x4d], description: "Apple MakerNote big-endian directory marker" },
  ],
  layout: { byteOrder: "big-endian", countOffset: 14, entriesOffset: 16, valueOrigin: 0 },
  tags: [
    tag({ id: "apple:0x0001", tag: 0x0001, name: "MakerNoteVersion", label: "MakerNote version", description: "Apple MakerNote format version." , type: "SLONG", decoder: "number", repeatable: false, sensitivity: "low", rawValueBehavior: "retain", source: "Apple iOS MakerNote directory tag 0x0001; corroborated by pinned CC0 fixtures" }),
    tag({ id: "apple:0x0002", tag: 0x0002, name: "AppleAEWarning", label: "Apple AE warning", description: "Apple auto-exposure warning bytes." , type: "UNDEFINED", decoder: "bytes", repeatable: false, sensitivity: "moderate", rawValueBehavior: "opaque", source: "Apple iOS MakerNote directory tag 0x0002; corroborated by pinned CC0 fixtures" }),
    tag({ id: "apple:0x0003", tag: 0x0003, name: "AppleFocusDistance", label: "Apple focus distance", description: "Apple focus-distance payload." , type: "UNDEFINED", decoder: "bytes", repeatable: false, sensitivity: "moderate", rawValueBehavior: "opaque", source: "Apple iOS MakerNote directory tag 0x0003; corroborated by pinned CC0 fixtures" }),
    tag({ id: "apple:0x0004", tag: 0x0004, name: "AppleCameraType", label: "Apple camera type", description: "Apple camera-module identifier." , type: "SLONG", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Apple iOS MakerNote directory tag 0x0004; corroborated by pinned CC0 fixtures" }),
    tag({ id: "apple:0x0005", tag: 0x0005, name: "AppleFocusMode", label: "Apple focus mode", description: "Apple focus-mode identifier." , type: "SLONG", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Apple iOS MakerNote directory tag 0x0005; corroborated by pinned CC0 fixtures" }),
    tag({ id: "apple:0x0006", tag: 0x0006, name: "AppleAFConfidence", label: "Apple AF confidence", description: "Apple autofocus confidence value." , type: "SLONG", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Apple iOS MakerNote directory tag 0x0006; corroborated by pinned CC0 fixtures" }),
    tag({ id: "apple:0x0007", tag: 0x0007, name: "AppleFocusPosition", label: "Apple focus position", description: "Apple focus-position value." , type: "SLONG", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Apple iOS MakerNote directory tag 0x0007; corroborated by pinned CC0 fixtures" }),
    tag({ id: "apple:0x0008", tag: 0x0008, name: "AppleCaptureTiming", label: "Apple capture timing", description: "Apple capture timing rationals." , type: "SRATIONAL", decoder: "rational", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Apple iOS MakerNote directory tag 0x0008; corroborated by pinned CC0 fixtures" }),
    tag({ id: "apple:0x000c", tag: 0x000c, name: "AppleHDRImageType", label: "Apple HDR image type", description: "Apple HDR image classification values." , type: "SRATIONAL", decoder: "rational", repeatable: false, sensitivity: "high", rawValueBehavior: "retain", source: "Apple iOS MakerNote directory tag 0x000C; corroborated by pinned CC0 fixtures" }),
    tag({ id: "apple:0x000d", tag: 0x000d, name: "AppleBurstUUID", label: "Apple burst identifier", description: "Apple burst/workflow identifier payload." , type: "SLONG", decoder: "number", repeatable: false, sensitivity: "high", rawValueBehavior: "retain", source: "Apple iOS MakerNote directory tag 0x000D; corroborated by pinned CC0 fixtures" }),
    tag({ id: "apple:0x000e", tag: 0x000e, name: "AppleSceneFlags", label: "Apple scene flags", description: "Apple scene classification flags." , type: "SLONG", decoder: "number", repeatable: false, sensitivity: "moderate", rawValueBehavior: "retain", source: "Apple iOS MakerNote directory tag 0x000E; corroborated by pinned CC0 fixtures" }),
    tag({ id: "apple:0x000f", tag: 0x000f, name: "AppleImageUniqueID", label: "Apple image unique identifier", description: "Apple image/workflow identifier." , type: "SLONG", decoder: "number", repeatable: false, sensitivity: "high", rawValueBehavior: "retain", source: "Apple iOS MakerNote directory tag 0x000F; corroborated by pinned CC0 fixtures" }),
  ],
});

export default apple;
