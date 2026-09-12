import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The mapping in this script is transcribed from CIPA DC-008-Translation-2026,
// Tables 6, 8, 9, 14, and 16. It intentionally does not consume a competitor
// registry: the JSON source remains the reviewed, generated-registry input.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "data", "metadata-registry.json");
const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const any = { min: 1, max: null };
const one = { min: 1, max: 1 };
const spec = (legalTypes, count = one) => ({ legalTypes, count });
const SHORT = ["SHORT"];
const LONG = ["LONG"];
const RATIONAL = ["RATIONAL"];
const SRATIONAL = ["SRATIONAL"];
const ASCII = ["ASCII"];
const UTF8 = ["UTF-8"];
const ASCII_UTF8 = ["ASCII", "UTF-8"];
const UNDEFINED = ["UNDEFINED"];
const SHORT_LONG = ["SHORT", "LONG"];

const specs = new Map();
const add = (ifd, tag, types, count = one) => specs.set(`${ifd}:0x${tag.toString(16).padStart(4, "0")}`, spec(types, count));
const count = (min, max) => ({ min, max });

// TIFF Rev. 6.0 attribute information used by Exif (CIPA Table 6).
[
  [0x0100, SHORT_LONG, one], [0x0101, SHORT_LONG, one], [0x0102, SHORT, count(3, 3)],
  [0x0103, SHORT, one], [0x0106, SHORT, one], [0x0111, SHORT_LONG, any],
  [0x0112, SHORT, one], [0x0115, SHORT, one], [0x0116, SHORT_LONG, one],
  [0x0117, SHORT_LONG, any], [0x011a, RATIONAL, one], [0x011b, RATIONAL, one],
  [0x011c, SHORT, one], [0x0128, SHORT, one], [0x012d, SHORT, count(768, 768)],
  [0x013e, RATIONAL, count(2, 2)], [0x013f, RATIONAL, count(6, 6)],
  [0x0201, LONG, one], [0x0202, LONG, one], [0x0211, RATIONAL, count(3, 3)],
  [0x0212, SHORT, count(2, 2)], [0x0213, SHORT, one], [0x0214, RATIONAL, count(6, 6)],
  [0x8769, LONG, one], [0x8825, LONG, one],
].forEach(([tag, types, itemCount]) => add("IFD0", tag, types, itemCount));
[
  [0x010e, ASCII_UTF8], [0x010f, ASCII_UTF8], [0x0110, ASCII_UTF8],
  [0x0131, ASCII_UTF8], [0x0132, ASCII, count(20, 20)], [0x013b, ASCII_UTF8],
  [0x8298, ASCII_UTF8],
].forEach(([tag, types, itemCount = any]) => add("IFD0", tag, types, itemCount));

// Exif private IFD (CIPA Tables 8 and 9).
[
  [0x9000, UNDEFINED, count(4, 4)], [0xa000, UNDEFINED, count(4, 4)],
  [0xa001, SHORT], [0xa500, RATIONAL], [0x9101, UNDEFINED, count(4, 4)],
  [0x9102, RATIONAL], [0xa002, SHORT_LONG], [0xa003, SHORT_LONG],
  [0x927c, UNDEFINED, any], [0x9286, UNDEFINED, any], [0x9287, UNDEFINED, any],
  [0x9003, ASCII, count(20, 20)], [0x9004, ASCII, count(20, 20)],
  [0x9010, ASCII, count(7, 7)], [0x9011, ASCII, count(7, 7)], [0x9012, ASCII, count(7, 7)],
  [0x9290, ASCII, any], [0x9291, ASCII, any], [0x9292, ASCII, any],
  [0xa004, ASCII, count(13, 13)], [0xa005, LONG],
  [0x9400, SRATIONAL], [0x9401, RATIONAL], [0x9402, RATIONAL], [0x9403, SRATIONAL],
  [0x9404, RATIONAL], [0x9405, SRATIONAL],
  [0xa420, ASCII, count(33, 33)], [0xa431, ASCII, any], [0xa432, RATIONAL, count(4, 4)],
  [0xa435, ASCII, any],
  [0x829a, RATIONAL], [0x829d, RATIONAL], [0x8822, SHORT], [0x8824, ASCII, any],
  [0x8827, SHORT, any], [0x8828, UNDEFINED, any], [0x8830, SHORT], [0x8831, LONG],
  [0x8832, LONG], [0x8833, LONG], [0x8834, LONG], [0x8835, LONG],
  [0x9201, SRATIONAL], [0x9202, RATIONAL], [0x9203, SRATIONAL], [0x9204, SRATIONAL],
  [0x9205, RATIONAL], [0x9206, RATIONAL], [0x9207, SHORT], [0x9208, SHORT],
  [0x9209, SHORT], [0x920a, RATIONAL], [0x9214, SHORT, count(2, 4)], [0xa20b, RATIONAL], [0xa20c, UNDEFINED, any],
  [0xa20e, RATIONAL], [0xa20f, RATIONAL], [0xa210, SHORT], [0xa214, SHORT, count(2, 2)],
  [0xa215, RATIONAL], [0xa217, SHORT], [0xa300, UNDEFINED, count(1, 1)],
  [0xa301, UNDEFINED, count(1, 1)], [0xa302, UNDEFINED, any], [0xa401, SHORT],
  [0xa402, SHORT], [0xa403, SHORT], [0xa404, RATIONAL], [0xa405, SHORT],
  [0xa406, SHORT], [0xa407, RATIONAL], [0xa408, SHORT], [0xa409, SHORT],
  [0xa40a, SHORT], [0xa40b, UNDEFINED, any], [0xa40c, SHORT], [0xa40d, SHORT],
  [0xa40e, UTF8, any], [0xa40f, SHORT], [0xa410, SHORT], [0xa411, SHORT], [0xa412, SHORT],
  [0xa460, SHORT], [0xa461, SHORT, count(2, 2)], [0xa462, UNDEFINED, any],
].forEach(([tag, types, itemCount = one]) => add("ExifIFD", tag, types, itemCount));
[
  [0xa430, ASCII_UTF8], [0xa433, ASCII_UTF8], [0xa434, ASCII_UTF8], [0xa436, ASCII_UTF8],
  [0xa437, ASCII_UTF8], [0xa438, ASCII_UTF8], [0xa439, ASCII_UTF8], [0xa43a, ASCII_UTF8],
  [0xa43b, ASCII_UTF8], [0xa43c, ASCII_UTF8],
].forEach(([tag, types, itemCount = any]) => add("ExifIFD", tag, types, itemCount));

// GPS IFD (CIPA Table 14).
[
  [0x0000, ["BYTE"], count(4, 4)], [0x0001, ASCII, count(2, 2)], [0x0002, RATIONAL, count(3, 3)],
  [0x0003, ASCII, count(2, 2)], [0x0004, RATIONAL, count(3, 3)], [0x0005, ["BYTE"]],
  [0x0006, RATIONAL], [0x0007, RATIONAL, count(3, 3)], [0x0008, ASCII, any],
  [0x0009, ASCII, count(2, 2)], [0x000a, ASCII, count(2, 2)], [0x000b, RATIONAL],
  [0x000c, ASCII, count(2, 2)], [0x000d, RATIONAL], [0x000e, ASCII, count(2, 2)],
  [0x000f, RATIONAL], [0x0010, ASCII, count(2, 2)], [0x0011, RATIONAL], [0x0012, ASCII, any],
  [0x0013, ASCII, count(2, 2)], [0x0014, RATIONAL, count(3, 3)], [0x0015, ASCII, count(2, 2)],
  [0x0016, RATIONAL, count(3, 3)], [0x0017, ASCII, count(2, 2)], [0x0018, RATIONAL],
  [0x0019, ASCII, count(2, 2)], [0x001a, RATIONAL], [0x001b, UNDEFINED, any],
  [0x001c, UNDEFINED, any], [0x001d, ASCII, count(11, 11)], [0x001e, SHORT], [0x001f, RATIONAL],
].forEach(([tag, types, itemCount]) => add("GPSIFD", tag, types, itemCount));

// Interoperability IFD entries retained for backwards compatibility with the
// prior registry in addition to the CIPA-defined InteroperabilityIndex.
add("InteropIFD", 0x0001, ASCII, any);
add("InteropIFD", 0x0002, UNDEFINED, count(4, 4));
add("InteropIFD", 0x1000, ASCII, any);
add("InteropIFD", 0x1001, LONG, one);
add("InteropIFD", 0x1002, LONG, one);

const lightSource = {
  "0": "Unknown", "1": "Daylight", "2": "Fluorescent", "3": "Tungsten (incandescent light)",
  "4": "Flash", "9": "Fine weather", "10": "Cloudy weather", "11": "Shade",
  "12": "Daylight fluorescent (D 5700–7100K)", "13": "Day white fluorescent (N 4600–5500K)",
  "14": "Cool white fluorescent (W 3800–4500K)", "15": "White fluorescent (WW 3250–3800K)",
  "16": "Warm white fluorescent (L 2600–3250K)", "17": "Standard light A", "18": "Standard light B",
  "19": "Standard light C", "20": "D55", "21": "D65", "22": "D75", "23": "D50",
  "24": "ISO studio tungsten", "25": "Daylight light source (D 5700–7100K)",
  "26": "Day white light source (N 4600–5500K)", "27": "Cool white light source (W 3800–4500K)",
  "28": "White light source (WW 3250–3800K)", "29": "Warm white light source (L 2600–3250K)",
  "30": "Daylight LED (D 5700–7100K)", "31": "Day white LED (N 4600–5500K)",
  "32": "Cool white LED (W 3800–4500K)", "33": "White LED (WW 3250–3800K)",
  "34": "Warm white LED (L 2600–3250K)", "255": "Other light source",
};

const registrySource = source;
const fields = registrySource.fields;
for (const field of fields) {
  const idTag = Number.parseInt(field.id.split(":")[1] ?? "0", 16);
  const parsedTag = typeof field.tag === "number" ? field.tag : Number.parseInt(String(field.tag), 16);
  const numericTag = parsedTag > 0xffff ? idTag : parsedTag;
  field.tag = `0x${numericTag.toString(16).padStart(4, "0")}`;
  const entry = specs.get(field.id);
  if (entry === undefined) throw new Error(`No CIPA DC-008-2026 mapping for ${field.id}`);
  field.legalTypes = entry.legalTypes;
  field.count = entry.count;
  if (field.id === "ExifIFD:0x8827") field.aliases = ["PhotographicSensitivity"];
  if (field.id === "ExifIFD:0x9208") {
    field.enumValues = lightSource;
    field.version = "3.1";
    field.validation = { kind: "enum", values: Object.keys(lightSource).map(Number) };
  }
  if (field.id === "GPSIFD:0x0005") {
    field.version = "3.0";
    field.enumValues = {
      "0": "Positive ellipsoidal height (at or above ellipsoidal surface)",
      "1": "Negative ellipsoidal height (below ellipsoidal surface)",
      "2": "Positive sea level value (at or above sea level reference)",
      "3": "Negative sea level value (below sea level reference)",
    };
    field.validation = { kind: "enum", values: [0, 1, 2, 3] };
  }
  if (new Set([
    "ExifIFD:0x9010", "ExifIFD:0x9011", "ExifIFD:0x9012", "ExifIFD:0x9400",
    "ExifIFD:0x9401", "ExifIFD:0x9402", "ExifIFD:0x9403", "ExifIFD:0x9404", "ExifIFD:0x9405",
  ]).has(field.id)) field.version = "2.31";
  if (field.id === "ExifIFD:0xa430" || field.id === "ExifIFD:0xa431" || field.id === "ExifIFD:0xa432" || field.id === "ExifIFD:0xa433" || field.id === "ExifIFD:0xa434" || field.id === "ExifIFD:0xa435") {
    field.version = "2.3";
  }
}

const addField = (field) => {
  if (fields.some((candidate) => candidate.id === field.id)) return;
  fields.push({
    aliases: [], enumValues: {}, validation: { kind: "standard" }, sourceId: "exif",
    family: "EXIF", ...field,
  });
};
addField({ id: "ExifIFD:0xa500", ifd: "ExifIFD", tag: "0xa500", name: "Gamma", legalTypes: RATIONAL, count: one, version: "2.21", sensitivity: "none", description: "Coefficient gamma for image reproduction.", writePolicy: "preserve" });
addField({ id: "ExifIFD:0x8828", ifd: "ExifIFD", tag: "0x8828", name: "OECF", legalTypes: UNDEFINED, count: any, version: "2.3", sensitivity: "none", description: "Opto-Electric Conversion Function table.", writePolicy: "preserve" });
addField({ id: "ExifIFD:0x9214", ifd: "ExifIFD", tag: "0x9214", name: "SubjectArea", legalTypes: SHORT, count: count(2, 4), version: "2.3", sensitivity: "low", description: "Location and area of the main subject.", validation: { kind: "count-enum", values: [2, 3, 4] }, writePolicy: "preserve" });
addField({ id: "ExifIFD:0xa20c", ifd: "ExifIFD", tag: "0xa20c", name: "SpatialFrequencyResponse", legalTypes: UNDEFINED, count: any, version: "2.3", sensitivity: "none", description: "Spatial frequency response table of the camera or input device.", writePolicy: "preserve" });
addField({ id: "ExifIFD:0x9400", ifd: "ExifIFD", tag: "0x9400", name: "Temperature", legalTypes: SRATIONAL, count: one, version: "2.31", sensitivity: "moderate", description: "Ambient temperature at capture in degrees Celsius.", writePolicy: "safe" });
addField({ id: "ExifIFD:0x9401", ifd: "ExifIFD", tag: "0x9401", name: "Humidity", legalTypes: RATIONAL, count: one, version: "2.31", sensitivity: "moderate", description: "Ambient humidity at capture as a percentage.", writePolicy: "safe" });
addField({ id: "ExifIFD:0x9402", ifd: "ExifIFD", tag: "0x9402", name: "Pressure", legalTypes: RATIONAL, count: one, version: "2.31", sensitivity: "moderate", description: "Ambient pressure at capture in hPa.", writePolicy: "safe" });
addField({ id: "ExifIFD:0x9403", ifd: "ExifIFD", tag: "0x9403", name: "WaterDepth", legalTypes: SRATIONAL, count: one, version: "2.31", sensitivity: "moderate", description: "Water depth at capture in metres.", writePolicy: "safe" });
addField({ id: "ExifIFD:0x9404", ifd: "ExifIFD", tag: "0x9404", name: "Acceleration", legalTypes: RATIONAL, count: one, version: "2.31", sensitivity: "moderate", description: "Scalar acceleration at capture in mGal.", writePolicy: "safe" });
addField({ id: "ExifIFD:0x9405", ifd: "ExifIFD", tag: "0x9405", name: "CameraElevationAngle", legalTypes: SRATIONAL, count: one, version: "2.31", sensitivity: "moderate", description: "Camera elevation/depression angle at capture in degrees.", writePolicy: "safe" });
addField({ id: "ExifIFD:0x9287", ifd: "ExifIFD", tag: "0x9287", name: "LearningOptOutIn", legalTypes: UNDEFINED, count: any, version: "3.1", sensitivity: "moderate", description: "Copyright holder intention for machine (AI) learning use.", validation: { kind: "structured-learning-intention" }, writePolicy: "safe" });
addField({ id: "ExifIFD:0xa40d", ifd: "ExifIFD", tag: "0xa40d", name: "DevelopmentType", legalTypes: SHORT, count: one, version: "3.1", sensitivity: "none", description: "Qualitative type of image development and its difference from capture-device defaults.", validation: { kind: "development-type" }, writePolicy: "preserve" });
addField({ id: "ExifIFD:0xa40e", ifd: "ExifIFD", tag: "0xa40e", name: "DevelopmentTypeDescription", legalTypes: UTF8, count: any, version: "3.1", sensitivity: "low", description: "UTF-8 description of image development processing.", validation: { kind: "utf8" }, writePolicy: "preserve" });
addField({ id: "ExifIFD:0xa436", ifd: "ExifIFD", tag: "0xa436", name: "ImageTitle", legalTypes: ASCII_UTF8, count: any, version: "3.0", sensitivity: "low", description: "Title of the image.", validation: { kind: "standard" }, writePolicy: "safe" });
addField({ id: "ExifIFD:0xa437", ifd: "ExifIFD", tag: "0xa437", name: "Photographer", legalTypes: ASCII_UTF8, count: any, version: "3.0", sensitivity: "moderate", description: "Name of the photographer.", validation: { kind: "standard" }, writePolicy: "safe" });
addField({ id: "ExifIFD:0xa438", ifd: "ExifIFD", tag: "0xa438", name: "ImageEditor", legalTypes: ASCII_UTF8, count: any, version: "3.0", sensitivity: "moderate", description: "Person who edited the image.", validation: { kind: "standard" }, writePolicy: "safe" });
addField({ id: "ExifIFD:0xa439", ifd: "ExifIFD", tag: "0xa439", name: "CameraFirmware", legalTypes: ASCII_UTF8, count: any, version: "3.0", sensitivity: "moderate", description: "Camera firmware name and version.", validation: { kind: "standard" }, writePolicy: "preserve" });
addField({ id: "ExifIFD:0xa43a", ifd: "ExifIFD", tag: "0xa43a", name: "RAWDevelopingSoftware", legalTypes: ASCII_UTF8, count: any, version: "3.0", sensitivity: "moderate", description: "Software used to develop the RAW image.", validation: { kind: "standard" }, writePolicy: "preserve" });
addField({ id: "ExifIFD:0xa43b", ifd: "ExifIFD", tag: "0xa43b", name: "ImageEditingSoftware", legalTypes: ASCII_UTF8, count: any, version: "3.0", sensitivity: "moderate", description: "Main software used to process or edit the image.", validation: { kind: "standard" }, writePolicy: "preserve" });
addField({ id: "ExifIFD:0xa43c", ifd: "ExifIFD", tag: "0xa43c", name: "MetadataEditingSoftware", legalTypes: ASCII_UTF8, count: any, version: "3.0", sensitivity: "moderate", description: "Software used to edit image metadata.", validation: { kind: "standard" }, writePolicy: "preserve" });
addField({ id: "ExifIFD:0xa40f", ifd: "ExifIFD", tag: "0xa40f", name: "DistortionCorrection", legalTypes: SHORT, count: one, version: "3.1", sensitivity: "none", description: "Whether distortion correction was applied at capture.", enumValues: { "0": "Not applied", "1": "Applied" }, validation: { kind: "enum", values: [0, 1] }, writePolicy: "preserve" });
addField({ id: "ExifIFD:0xa410", ifd: "ExifIFD", tag: "0xa410", name: "ChromaticAberrationCorrection", legalTypes: SHORT, count: one, version: "3.1", sensitivity: "none", description: "Whether chromatic aberration correction was applied at capture.", enumValues: { "0": "Not applied", "1": "Applied" }, validation: { kind: "enum", values: [0, 1] }, writePolicy: "preserve" });
addField({ id: "ExifIFD:0xa411", ifd: "ExifIFD", tag: "0xa411", name: "ShadingCorrection", legalTypes: SHORT, count: one, version: "3.1", sensitivity: "none", description: "Whether shading correction was applied at capture.", enumValues: { "0": "Not applied", "1": "Applied" }, validation: { kind: "enum", values: [0, 1] }, writePolicy: "preserve" });
addField({ id: "ExifIFD:0xa412", ifd: "ExifIFD", tag: "0xa412", name: "NoiseReduction", legalTypes: SHORT, count: one, version: "3.1", sensitivity: "none", description: "Noise-reduction application and strength at capture.", enumValues: { "0": "Not applied", "1": "Low strength noise reduction", "2": "Normal strength noise reduction", "3": "High strength noise reduction" }, validation: { kind: "enum", values: [0, 1, 2, 3] }, writePolicy: "preserve" });
addField({ id: "ExifIFD:0xa460", ifd: "ExifIFD", tag: "0xa460", name: "CompositeImage", legalTypes: SHORT, count: one, version: "2.32", sensitivity: "none", description: "Whether the recorded image is composite.", enumValues: { "0": "Unknown", "1": "Non-composite image", "2": "General composite image", "3": "Composite image captured when shooting" }, validation: { kind: "enum", values: [0, 1, 2, 3] }, writePolicy: "preserve" });
addField({ id: "ExifIFD:0xa461", ifd: "ExifIFD", tag: "0xa461", name: "SourceImageNumberOfCompositeImage", legalTypes: SHORT, count: count(2, 2), version: "2.32", sensitivity: "none", description: "Number of source images used for a composite image.", validation: { kind: "standard" }, writePolicy: "preserve" });
addField({ id: "ExifIFD:0xa462", ifd: "ExifIFD", tag: "0xa462", name: "SourceExposureTimesOfCompositeImage", legalTypes: UNDEFINED, count: any, version: "2.32", sensitivity: "none", description: "Exposure parameters for source images used for a composite image.", validation: { kind: "standard" }, writePolicy: "preserve" });

// CIPA DC-008-Translation-2026 coded values. Keeping these in the source
// registry makes descriptions deterministic for both raw fields and generated
// public metadata maps; no competitor registry is consulted.
const standardEnums = new Map([
  ["ImageWidth", {}],
  ["Compression", { "1": "Uncompressed", "6": "JPEG compression (thumbnail only)" }],
  ["PhotometricInterpretation", { "2": "RGB", "6": "YCbCr" }],
  ["Orientation", { "1": "Top-left", "2": "Top-right", "3": "Bottom-right", "4": "Bottom-left", "5": "Left-top", "6": "Right-top", "7": "Right-bottom", "8": "Left-bottom" }],
  ["PlanarConfiguration", { "1": "Chunky format", "2": "Planar format" }],
  ["ResolutionUnit", { "2": "Inches", "3": "Centimeters" }],
  ["YCbCrSubSampling", { "2,1": "YCbCr 4:2:2", "2,2": "YCbCr 4:2:0" }],
  ["YCbCrPositioning", { "1": "Centered", "2": "Co-sited" }],
  ["ColorSpace", { "1": "sRGB", "65535": "Uncalibrated" }],
  ["FlashpixVersion", { "0100": "Flashpix Format Version 1.0" }],
  ["ExposureProgram", { "0": "Not defined", "1": "Manual", "2": "Normal program", "3": "Aperture priority", "4": "Shutter priority", "5": "Creative program", "6": "Action program", "7": "Portrait mode", "8": "Landscape mode" }],
  ["SensitivityType", { "0": "Unknown", "1": "Standard output sensitivity (SOS)", "2": "Recommended exposure index (REI)", "3": "ISO speed", "4": "SOS and REI", "5": "SOS and ISO speed", "6": "REI and ISO speed", "7": "SOS, REI, and ISO speed" }],
  ["MeteringMode", { "0": "Unknown", "1": "Average", "2": "Center-weighted average", "3": "Spot", "4": "Multi-spot", "5": "Pattern", "6": "Partial", "255": "Other" }],
  ["FocalPlaneResolutionUnit", { "2": "Inches", "3": "Centimeters" }],
  ["SensingMethod", { "1": "Not defined", "2": "One-chip color area sensor", "3": "Two-chip color area sensor", "4": "Three-chip color area sensor", "5": "Color sequential area sensor", "7": "Trilinear sensor", "8": "Color sequential linear sensor" }],
  ["FileSource", { "0": "Other", "1": "Scanner of transparent type", "2": "Scanner of reflex type", "3": "DSC" }],
  ["SceneType", { "1": "Directly photographed image" }],
  ["CustomRendered", { "0": "Normal process", "1": "Custom process" }],
  ["ExposureMode", { "0": "Auto exposure", "1": "Manual exposure", "2": "Auto bracket" }],
  ["WhiteBalance", { "0": "Auto white balance", "1": "Manual white balance" }],
  ["SceneCaptureType", { "0": "Standard", "1": "Landscape", "2": "Portrait", "3": "Night scene" }],
  ["GainControl", { "0": "None", "1": "Low gain up", "2": "High gain up", "3": "Low gain down", "4": "High gain down" }],
  ["Contrast", { "0": "Normal", "1": "Soft", "2": "Hard" }],
  ["Saturation", { "0": "Normal", "1": "Low saturation", "2": "High saturation" }],
  ["Sharpness", { "0": "Normal", "1": "Soft", "2": "Hard" }],
  ["SubjectDistanceRange", { "0": "Unknown", "1": "Macro", "2": "Close view", "3": "Distant view" }],
  ["GPSStatus", { A: "Measurement in progress", V: "Measurement interrupted" }],
  ["GPSMeasureMode", { "2": "2-dimensional measurement", "3": "3-dimensional measurement" }],
  ["GPSLatitudeRef", { N: "North latitude", S: "South latitude" }],
  ["GPSLongitudeRef", { E: "East longitude", W: "West longitude" }],
  ["GPSSpeedRef", { K: "Kilometres per hour", M: "Miles per hour", N: "Knots" }],
  ["GPSTrackRef", { T: "True direction", M: "Magnetic direction" }],
  ["GPSImgDirectionRef", { T: "True direction", M: "Magnetic direction" }],
  ["GPSDestLatitudeRef", { N: "North latitude", S: "South latitude" }],
  ["GPSDestLongitudeRef", { E: "East longitude", W: "West longitude" }],
  ["GPSDestBearingRef", { T: "True direction", M: "Magnetic direction" }],
  ["GPSDestDistanceRef", { K: "Kilometres", M: "Miles", N: "Nautical miles" }],
  ["GPSDifferential", { "0": "Measurement without differential correction", "1": "Differential correction applied" }],
]);
const enumValidation = new Map([
  ["Compression", [1, 6]], ["PhotometricInterpretation", [2, 6]], ["Orientation", [1, 2, 3, 4, 5, 6, 7, 8]],
  ["PlanarConfiguration", [1, 2]], ["ResolutionUnit", [2, 3]], ["YCbCrSubSampling", ["2,1", "2,2"]], ["YCbCrPositioning", [1, 2]], ["ColorSpace", [1, 65535]],
  ["ExposureProgram", [0, 1, 2, 3, 4, 5, 6, 7, 8]], ["SensitivityType", [0, 1, 2, 3, 4, 5, 6, 7]],
  ["MeteringMode", [0, 1, 2, 3, 4, 5, 6, 255]], ["FocalPlaneResolutionUnit", [2, 3]],
  ["SensingMethod", [1, 2, 3, 4, 5, 7, 8]], ["FileSource", [0, 1, 2, 3]], ["SceneType", [1]],
  ["CustomRendered", [0, 1]], ["ExposureMode", [0, 1, 2]], ["WhiteBalance", [0, 1]],
  ["SceneCaptureType", [0, 1, 2, 3]], ["GainControl", [0, 1, 2, 3, 4]], ["Contrast", [0, 1, 2]],
  ["Saturation", [0, 1, 2]], ["Sharpness", [0, 1, 2]], ["SubjectDistanceRange", [0, 1, 2, 3]],
  ["GPSStatus", ["A", "V"]], ["GPSMeasureMode", ["2", "3"]], ["GPSLatitudeRef", ["N", "S"]], ["GPSLongitudeRef", ["E", "W"]], ["GPSSpeedRef", ["K", "M", "N"]],
  ["GPSTrackRef", ["T", "M"]], ["GPSImgDirectionRef", ["T", "M"]], ["GPSDestLatitudeRef", ["N", "S"]],
  ["GPSDestLongitudeRef", ["E", "W"]], ["GPSDestBearingRef", ["T", "M"]], ["GPSDestDistanceRef", ["K", "M", "N"]],
  ["GPSDifferential", [0, 1]],
]);
for (const field of fields) {
  const values = standardEnums.get(field.name);
  if (values !== undefined && Object.keys(values).length > 0) field.enumValues = values;
  const valid = enumValidation.get(field.name);
  if (valid !== undefined) field.validation = { kind: "enum", values: valid };
}

fields.sort((left, right) => `${left.ifd}:${left.tag}`.localeCompare(`${right.ifd}:${right.tag}`));
const output = {
  ...registrySource,
  sources: [{
    id: "exif", standard: "CIPA Exif", edition: "3.1", extractionDate: "2026-09-12",
    license: "CIPA specification; field descriptions reproduced for interoperability.",
    url: "https://www.cipa.jp/std/documents/download_e.html?CIPA_DC-008-2026-E=",
  }],
  fields,
};
fs.writeFileSync(sourcePath, `${JSON.stringify(output)}\n`);
