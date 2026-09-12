/**
 * Small browser entry point for the most common JPEG workflow. It does not
 * import the general container dispatcher or non-JPEG parsers.
 */
export { parseJpegMetadata, parseJpegMetadata as parseMetadata } from "./jpeg.js";
export { getCaptureTime, getGps, getOrientation, getRotation, getThumbnail } from "./convenience.js";
export { deriveExifComposites } from "./normalize/composites.js";
export { getMetadataSummary } from "./summary.js";
export type { CaptureTimeSummary, ExifOrientation, GpsSummary, OrientationSummary, RotationSummary } from "./convenience.js";
export type { MetadataInput, MetadataResult, ParseOptions } from "./types.js";
