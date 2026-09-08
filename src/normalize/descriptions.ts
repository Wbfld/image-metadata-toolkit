import type { FlashValue, Sensitivity } from "../types.js";

export interface TagDefinition {
  readonly name: string;
  readonly description: string;
  readonly editable: boolean;
  readonly sensitivity: Sensitivity;
}

const IFD0_TAGS: Readonly<Record<number, TagDefinition>> = {
  0x0100: tag("ImageWidth", "Image width recorded by TIFF."),
  0x0101: tag("ImageLength", "Image height recorded by TIFF."),
  0x0102: tag("BitsPerSample", "Number of bits used for each image component."),
  0x0103: tag("Compression", "TIFF compression scheme."),
  0x0106: tag("PhotometricInterpretation", "Pixel composition and colour interpretation."),
  0x010e: tag("ImageDescription", "Free-form image description.", true, "low"),
  0x010f: tag("Make", "Camera or scanner manufacturer.", true, "low"),
  0x0110: tag("Model", "Camera or scanner model.", true, "low"),
  0x0111: tag("StripOffsets", "Offsets of TIFF image-data strips."),
  0x0112: tag("Orientation", "How the stored pixels should be oriented for display.", true),
  0x0115: tag("SamplesPerPixel", "Number of components per pixel."),
  0x0116: tag("RowsPerStrip", "Rows in each TIFF image-data strip."),
  0x0117: tag("StripByteCounts", "Byte counts of TIFF image-data strips."),
  0x011a: tag("XResolution", "Horizontal pixel density."),
  0x011b: tag("YResolution", "Vertical pixel density."),
  0x011c: tag("PlanarConfiguration", "How pixel components are stored."),
  0x0128: tag("ResolutionUnit", "Unit used for XResolution and YResolution."),
  0x012d: tag("TransferFunction", "Transfer function for the image."),
  0x0131: tag("Software", "Software or firmware that created or modified the image.", true, "moderate"),
  0x0132: tag("DateTime", "Last image-modification date and time; EXIF does not require a timezone.", true, "moderate"),
  0x013b: tag("Artist", "Creator of the image.", true, "moderate"),
  0x013e: tag("WhitePoint", "Chromaticity of the image white point."),
  0x013f: tag("PrimaryChromaticities", "Chromaticities of the image primaries."),
  0x0201: tag("JPEGInterchangeFormat", "Offset of the embedded JPEG thumbnail."),
  0x0202: tag("JPEGInterchangeFormatLength", "Length of the embedded JPEG thumbnail."),
  0x0211: tag("YCbCrCoefficients", "Matrix coefficients used to transform RGB to YCbCr."),
  0x0212: tag("YCbCrSubSampling", "YCbCr chroma subsampling factors."),
  0x0213: tag("YCbCrPositioning", "Position of subsampled chroma relative to luminance."),
  0x0214: tag("ReferenceBlackWhite", "Reference black and white component values."),
  0x8298: tag("Copyright", "Copyright notice.", true, "moderate"),
  0x8769: tag("ExifIFDPointer", "Offset of the EXIF sub-IFD."),
  0x8825: tag("GPSInfoIFDPointer", "Offset of the GPS sub-IFD.", false, "high"),
};

const EXIF_TAGS: Readonly<Record<number, TagDefinition>> = {
  0x829a: tag("ExposureTime", "Exposure duration in seconds.", true),
  0x829d: tag("FNumber", "Lens f-number used for the exposure.", true),
  0x8822: tag("ExposureProgram", "Program used to set exposure."),
  0x8824: tag("SpectralSensitivity", "Spectral sensitivity of the camera sensor."),
  0x8827: tag("ISOSpeedRatings", "ISO speed or sensitivity rating.", true),
  0x8830: tag("SensitivityType", "Meaning of the sensitivity tags."),
  0x8831: tag("StandardOutputSensitivity", "Standard output sensitivity."),
  0x8832: tag("RecommendedExposureIndex", "Recommended exposure index."),
  0x8833: tag("ISOSpeed", "ISO speed value."),
  0x8834: tag("ISOSpeedLatitudeyyy", "ISO speed latitude yyy."),
  0x8835: tag("ISOSpeedLatitudezzz", "ISO speed latitude zzz."),
  0x9000: tag("ExifVersion", "Version of the EXIF standard."),
  0x9003: tag("DateTimeOriginal", "Date and time when the original image was captured; timezone may be separate.", true, "moderate"),
  0x9004: tag("DateTimeDigitized", "Date and time when the image was digitized.", true, "moderate"),
  0x9010: tag("OffsetTime", "UTC offset for DateTime.", true, "moderate"),
  0x9011: tag("OffsetTimeOriginal", "UTC offset for DateTimeOriginal.", true, "moderate"),
  0x9012: tag("OffsetTimeDigitized", "UTC offset for DateTimeDigitized.", true, "moderate"),
  0x9101: tag("ComponentsConfiguration", "Meaning and order of image components."),
  0x9102: tag("CompressedBitsPerPixel", "Compression mode expressed in bits per pixel."),
  0x9201: tag("ShutterSpeedValue", "APEX shutter-speed value (Tv)."),
  0x9202: tag("ApertureValue", "APEX aperture value (Av)."),
  0x9203: tag("BrightnessValue", "APEX brightness value (Bv)."),
  0x9204: tag("ExposureBiasValue", "APEX exposure-bias value."),
  0x9205: tag("MaxApertureValue", "Smallest lens f-number, encoded as an APEX value."),
  0x9206: tag("SubjectDistance", "Distance to the subject in metres."),
  0x9207: tag("MeteringMode", "Exposure-metering mode."),
  0x9208: tag("LightSource", "Light source or white-balance setting."),
  0x9209: tag("Flash", "Flash status and mode bit field.", true),
  0x920a: tag("FocalLength", "Actual lens focal length in millimetres.", true),
  0x927c: tag("MakerNote", "Manufacturer-specific metadata.", false, "high"),
  0x9286: tag("UserComment", "User-supplied image comment.", true, "moderate"),
  0x9290: tag("SubSecTime", "Fractional seconds for DateTime.", true, "moderate"),
  0x9291: tag("SubSecTimeOriginal", "Fractional seconds for DateTimeOriginal.", true, "moderate"),
  0x9292: tag("SubSecTimeDigitized", "Fractional seconds for DateTimeDigitized.", true, "moderate"),
  0xa000: tag("FlashpixVersion", "Supported Flashpix version."),
  0xa001: tag("ColorSpace", "Image colour-space identifier."),
  0xa002: tag("PixelXDimension", "Valid image width."),
  0xa003: tag("PixelYDimension", "Valid image height."),
  0xa004: tag("RelatedSoundFile", "Name of a related sound file.", true, "low"),
  0xa005: tag("InteroperabilityIFDPointer", "Offset of the interoperability sub-IFD."),
  0xa20b: tag("FlashEnergy", "Flash energy in beam-candlepower-seconds."),
  0xa20e: tag("FocalPlaneXResolution", "Horizontal focal-plane resolution."),
  0xa20f: tag("FocalPlaneYResolution", "Vertical focal-plane resolution."),
  0xa210: tag("FocalPlaneResolutionUnit", "Unit of focal-plane resolution."),
  0xa214: tag("SubjectLocation", "Subject location within the image."),
  0xa215: tag("ExposureIndex", "Exposure index selected by the camera."),
  0xa217: tag("SensingMethod", "Image-sensor type."),
  0xa300: tag("FileSource", "Image source."),
  0xa301: tag("SceneType", "Type of scene captured."),
  0xa302: tag("CFAPattern", "Colour-filter array pattern."),
  0xa401: tag("CustomRendered", "Whether special rendering was applied."),
  0xa402: tag("ExposureMode", "Exposure mode selected by the camera."),
  0xa403: tag("WhiteBalance", "White-balance mode."),
  0xa404: tag("DigitalZoomRatio", "Digital zoom ratio."),
  0xa405: tag("FocalLengthIn35mmFilm", "35 mm-equivalent focal length."),
  0xa406: tag("SceneCaptureType", "Scene-capture category."),
  0xa407: tag("GainControl", "Overall image-gain adjustment."),
  0xa408: tag("Contrast", "Contrast-processing setting."),
  0xa409: tag("Saturation", "Saturation-processing setting."),
  0xa40a: tag("Sharpness", "Sharpness-processing setting."),
  0xa40b: tag("DeviceSettingDescription", "Camera configuration information.", false, "moderate"),
  0xa40c: tag("SubjectDistanceRange", "Approximate subject-distance range."),
  0xa420: tag("ImageUniqueID", "Identifier assigned to the image.", false, "high"),
  0xa430: tag("CameraOwnerName", "Camera owner's name.", true, "high"),
  0xa431: tag("BodySerialNumber", "Camera body serial number.", true, "high"),
  0xa432: tag("LensSpecification", "Lens focal-length and aperture specification."),
  0xa433: tag("LensMake", "Lens manufacturer.", true, "low"),
  0xa434: tag("LensModel", "Lens model.", true, "low"),
  0xa435: tag("LensSerialNumber", "Lens serial number.", true, "high"),
};

const GPS_TAGS: Readonly<Record<number, TagDefinition>> = {
  0x0000: tag("GPSVersionID", "Version of the GPS IFD.", false, "high"),
  0x0001: tag("GPSLatitudeRef", "North or south latitude reference.", true, "high"),
  0x0002: tag("GPSLatitude", "Latitude as degrees, minutes, and seconds.", true, "high"),
  0x0003: tag("GPSLongitudeRef", "East or west longitude reference.", true, "high"),
  0x0004: tag("GPSLongitude", "Longitude as degrees, minutes, and seconds.", true, "high"),
  0x0005: tag("GPSAltitudeRef", "Whether altitude is above or below sea level.", true, "high"),
  0x0006: tag("GPSAltitude", "Altitude relative to sea level.", true, "high"),
  0x0007: tag("GPSTimeStamp", "UTC time from the GPS receiver.", true, "high"),
  0x0008: tag("GPSSatellites", "Satellites used for the measurement.", true, "high"),
  0x0009: tag("GPSStatus", "GPS receiver status.", true, "high"),
  0x000a: tag("GPSMeasureMode", "GPS measurement mode.", true, "high"),
  0x000b: tag("GPSDOP", "GPS dilution of precision.", true, "high"),
  0x000c: tag("GPSSpeedRef", "Unit used for GPS speed.", true, "high"),
  0x000d: tag("GPSSpeed", "GPS receiver speed.", true, "high"),
  0x000e: tag("GPSTrackRef", "Reference for direction of movement.", true, "high"),
  0x000f: tag("GPSTrack", "Direction of movement.", true, "high"),
  0x0010: tag("GPSImgDirectionRef", "Reference for image direction.", true, "high"),
  0x0011: tag("GPSImgDirection", "Direction of the image when captured.", true, "high"),
  0x0012: tag("GPSMapDatum", "Geodetic survey data used by the receiver.", true, "high"),
  0x0013: tag("GPSDestLatitudeRef", "Destination north or south reference.", true, "high"),
  0x0014: tag("GPSDestLatitude", "Destination latitude.", true, "high"),
  0x0015: tag("GPSDestLongitudeRef", "Destination east or west reference.", true, "high"),
  0x0016: tag("GPSDestLongitude", "Destination longitude.", true, "high"),
  0x0017: tag("GPSDestBearingRef", "Reference for destination bearing.", true, "high"),
  0x0018: tag("GPSDestBearing", "Bearing to the destination.", true, "high"),
  0x0019: tag("GPSDestDistanceRef", "Unit used for destination distance.", true, "high"),
  0x001a: tag("GPSDestDistance", "Distance to the destination.", true, "high"),
  0x001b: tag("GPSProcessingMethod", "GPS processing method.", true, "high"),
  0x001c: tag("GPSAreaInformation", "Name of the GPS area.", true, "high"),
  0x001d: tag("GPSDateStamp", "UTC date from the GPS receiver.", true, "high"),
  0x001e: tag("GPSDifferential", "Whether differential GPS correction was used.", true, "high"),
  0x001f: tag("GPSHPositioningError", "Horizontal positioning error in metres.", true, "high"),
};

const INTEROP_TAGS: Readonly<Record<number, TagDefinition>> = {
  0x0001: tag("InteroperabilityIndex", "Interoperability rule identifier."),
  0x0002: tag("InteroperabilityVersion", "Interoperability version."),
  0x1000: tag("RelatedImageFileFormat", "File format of the related image."),
  0x1001: tag("RelatedImageWidth", "Width of the related image."),
  0x1002: tag("RelatedImageLength", "Height of the related image."),
};

function tag(
  name: string,
  description: string,
  editable = false,
  sensitivity: Sensitivity = "none",
): TagDefinition {
  return { name, description, editable, sensitivity };
}

export function getTagDefinition(ifd: string, tagNumber: number): TagDefinition | undefined {
  if (ifd === "ExifIFD") return EXIF_TAGS[tagNumber];
  if (ifd === "GPSIFD") return GPS_TAGS[tagNumber];
  if (ifd === "InteropIFD") return INTEROP_TAGS[tagNumber];
  return IFD0_TAGS[tagNumber];
}

export function formatUnknownTag(tagNumber: number): string {
  return `Tag 0x${tagNumber.toString(16).padStart(4, "0").toUpperCase()}`;
}

export function describeOrientation(value: number): string {
  const descriptions: Readonly<Record<number, string>> = {
    1: "Top-left (normal)",
    2: "Top-right (mirrored horizontally)",
    3: "Bottom-right (rotated 180°)",
    4: "Bottom-left (mirrored vertically)",
    5: "Left-top (mirrored horizontally, then rotated 270° clockwise)",
    6: "Right-top (rotated 90° clockwise)",
    7: "Right-bottom (mirrored horizontally, then rotated 90° clockwise)",
    8: "Left-bottom (rotated 270° clockwise)",
  };
  return descriptions[value] ?? `Invalid orientation (${value})`;
}

export function describeFlash(value: FlashValue): string {
  const parts: string[] = [value.fired ? "Flash fired" : "Flash did not fire"];
  const modes: Readonly<Record<FlashValue["mode"], string>> = {
    unknown: "mode unknown",
    "compulsory-firing": "compulsory firing mode",
    "compulsory-suppression": "compulsory suppression mode",
    auto: "auto mode",
  };
  parts.push(modes[value.mode]);

  if (value.returnStatus === "detected") parts.push("return light detected");
  if (value.returnStatus === "not-detected") parts.push("return light not detected");
  if (value.returnStatus === "reserved") parts.push("reserved return-status value");
  if (value.returnStatus === "not-supported") parts.push("return detection not supported");
  if (!value.functionPresent) parts.push("no flash function present");
  if (value.redEyeReduction) parts.push("red-eye reduction enabled");
  return `${parts.join("; ")}.`;
}
