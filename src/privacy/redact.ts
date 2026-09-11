import { detectFormat } from "../detect-format.js";
import type {
  MetadataWarning,
  SurgeryResult,
  RedactOptions,
  SecurityLimits,
} from "../types.js";
import { redactJpeg } from "./jpeg-surgery.js";
import { redactPng } from "./png-surgery.js";
import { redactWebp } from "./webp-surgery.js";

const VALID_TARGETS = new Set<string>([
  "AllMetadata", "EXIF", "XMP", "PNGText", "IPTC", "ICC", "JFIF", "GPS", "SerialNumber",
  "Make", "Model", "Orientation", "DateTime", "DateTimeOriginal", "ExposureTime", "FNumber",
  "ISOSpeedRatings", "Flash", "FocalLength", "GPSLatitude", "GPSLongitude", "GPSAltitude",
  "Copyright", "Artist", "Software",
]);

function optionWarnings(options: RedactOptions, limits: SecurityLimits): MetadataWarning[] {
  const warnings: MetadataWarning[] = [];
  const values: readonly unknown[] = [
    ...(options.remove as readonly unknown[]),
    ...(options.preserve ?? [] as readonly unknown[]),
  ];
  for (const target of values) {
    const rendered = typeof target === "string" ? target : String(target);
    if (typeof target !== "string" || VALID_TARGETS.has(target) || warnings.some(({ message }) => message.includes(rendered))) continue;
    if (warnings.length >= limits.maxWarnings) break;
    warnings.push({ code: "REDACTION_SKIPPED", message: `Unknown redaction target ${rendered}; no matching metadata was changed.`, severity: "warning" });
  }
  return warnings;
}

function withOptionWarnings(result: SurgeryResult, options: RedactOptions, limits: SecurityLimits): SurgeryResult {
  const warnings = [...optionWarnings(options, limits), ...result.warnings].slice(0, limits.maxWarnings);
  return warnings.length === result.warnings.length ? result : { ...result, warnings };
}

/**
 * Synchronously redact an already materialized byte array using resolved limits.
 * JPEG and PNG metadata writers operate without decoding or recompressing pixels.
 */
export function redactBytes(
  bytes: Uint8Array,
  options: RedactOptions,
  limits: SecurityLimits,
): SurgeryResult {
  const detection = detectFormat(bytes);
  const beginsWithSoi = bytes[0] === 0xff && bytes[1] === 0xd8;
  if (detection.format === "jpeg" || beginsWithSoi) {
    return withOptionWarnings(redactJpeg(bytes, options, limits), options, limits);
  }
  if (detection.format === "png") return withOptionWarnings(redactPng(bytes, options, limits), options, limits);
  if (detection.format === "webp") return withOptionWarnings(redactWebp(bytes, options, limits), options, limits);

  const warnings: MetadataWarning[] = [];
  if (limits.maxWarnings > 0) {
  warnings.push({
      code: "UNSUPPORTED_FORMAT",
      message:
        detection.format === "unknown"
          ? "Metadata redaction requires a recognized JPEG input."
          : `Lossless metadata redaction is not implemented for ${detection.format.toUpperCase()}.`,
      severity: "warning",
    });
  }

  return {
    data: new Uint8Array(bytes),
    format: detection.format,
    removed: [],
    warnings: [...warnings, ...optionWarnings(options, limits)].slice(0, limits.maxWarnings),
  };
}
