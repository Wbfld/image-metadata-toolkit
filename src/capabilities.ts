import type { ImageFormat, RedactionTarget } from "./types.js";

export type MetadataCapability = "EXIF" | "XMP" | "IPTC" | "ICC" | "JFIF" | "PNGText" | "Dimensions" | "Transform" | "Nclx";

export interface FormatCapabilities {
  readonly format: ImageFormat;
  readonly metadata: readonly MetadataCapability[];
  readonly redaction: readonly RedactionTarget[];
  readonly losslessRedaction: boolean;
}

const CAPABILITIES: Readonly<Record<ImageFormat, FormatCapabilities>> = {
  jpeg: {
    format: "jpeg",
    metadata: ["Dimensions", "EXIF", "XMP", "IPTC", "ICC", "JFIF"],
    redaction: ["AllMetadata", "EXIF", "XMP", "IPTC", "ICC", "JFIF", "GPS", "SerialNumber", "Make", "Model", "Orientation", "DateTime", "DateTimeOriginal", "ExposureTime", "FNumber", "ISOSpeedRatings", "Flash", "FocalLength", "GPSLatitude", "GPSLongitude", "GPSAltitude", "Copyright", "Artist", "Software"],
    losslessRedaction: true,
  },
  png: {
    format: "png",
    metadata: ["Dimensions", "EXIF", "XMP", "ICC", "PNGText"],
    redaction: ["AllMetadata", "EXIF", "XMP", "ICC", "PNGText"],
    losslessRedaction: true,
  },
  tiff: {
    format: "tiff",
    metadata: ["Dimensions", "EXIF", "XMP", "IPTC", "ICC"],
    redaction: [],
    losslessRedaction: false,
  },
  webp: {
    format: "webp",
    metadata: ["Dimensions", "EXIF", "XMP", "ICC"],
    redaction: ["AllMetadata", "EXIF", "XMP", "ICC"],
    losslessRedaction: true,
  },
  heif: {
    format: "heif",
    metadata: ["Dimensions", "EXIF", "XMP", "ICC", "Transform", "Nclx"],
    redaction: [],
    losslessRedaction: false,
  },
  avif: {
    format: "avif",
    metadata: ["Dimensions", "EXIF", "XMP", "ICC", "Transform", "Nclx"],
    redaction: [],
    losslessRedaction: false,
  },
  unknown: {
    format: "unknown",
    metadata: [],
    redaction: [],
    losslessRedaction: false,
  },
};

/** Return the parser and lossless-redaction capabilities for a detected format. */
export function getCapabilities(format: ImageFormat): FormatCapabilities {
  const capabilities = Object.hasOwn(CAPABILITIES, format)
    ? CAPABILITIES[format]
    : CAPABILITIES.unknown;
  return {
    ...capabilities,
    metadata: [...capabilities.metadata],
    redaction: [...capabilities.redaction],
  };
}
