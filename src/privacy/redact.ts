import { detectFormat } from "../detect-format.js";
import type {
  MetadataWarning,
  RedactionResult,
  RedactOptions,
  SecurityLimits,
} from "../types.js";
import { redactJpeg } from "./jpeg-surgery.js";
import { redactPng } from "./png-surgery.js";

/**
 * Synchronously redact an already materialized byte array using resolved limits.
 * JPEG and PNG metadata writers operate without decoding or recompressing pixels.
 */
export function redactBytes(
  bytes: Uint8Array,
  options: RedactOptions,
  limits: SecurityLimits,
): RedactionResult {
  const detection = detectFormat(bytes);
  const beginsWithSoi = bytes[0] === 0xff && bytes[1] === 0xd8;
  if (detection.format === "jpeg" || beginsWithSoi) {
    return redactJpeg(bytes, options, limits);
  }
  if (detection.format === "png") return redactPng(bytes, options, limits);

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
    warnings,
  };
}
