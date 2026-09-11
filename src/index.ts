import { detectFormat } from "./detect-format.js";
import { getCapabilities } from "./capabilities.js";
import { getMetadataSummary } from "./summary.js";
import { getCaptureTime, getGps, getOrientation, getRotation, getThumbnail } from "./convenience.js";
import { completeMetadataResult, completeRedactionResult } from "./result.js";
import { materializeInput, materializeJpegHeader, materializeMetadata } from "./input.js";
import { DEFAULT_LIMITS, resolveLimits } from "./security/limits.js";
import { resolveSelection, wantsGroup, type ResolvedSelection } from "./selection.js";
import {
  MetadataError,
  type MetadataInput,
  type MetadataResult,
  type ParsedMetadataResult,
  type MetadataWarning,
  type ParseOptions,
  type RedactOptions,
  type RedactionTarget,
  type RedactionResult,
  type SanitizationResult,
  type SanitizeOptions,
  type SecurityLimits,
} from "./types.js";

export { detectFormat, DEFAULT_LIMITS, getCapabilities, getCaptureTime, getGps, getMetadataSummary, getOrientation, getRotation, getThumbnail, MetadataError };
export type { FormatCapabilities, MetadataCapability } from "./capabilities.js";
export type { MetadataSummary, MetadataConflict, CameraSummary, LensSummary, ExposureSummary, CaptureSummary, LocationSummary } from "./summary.js";
export type { CaptureTimeSummary, ExifOrientation, GpsSummary, OrientationSummary, RotationSummary } from "./convenience.js";
export type { PrivacyAuditResult, PrivacyFinding, PrivacyOpaqueBlock } from "./privacy/audit.js";
export type * from "./types.js";

function selectedExif<T extends { readonly name: string; readonly id: string }>(fields: readonly T[], selection: ResolvedSelection): readonly T[] {
  if (selection.tags === null) return fields;
  return fields.filter((field) => selection.tags?.has(field.name) || selection.tags?.has(field.id));
}

/** Keep public result shapes consistent for selections that a legacy parser
 * cannot yet skip internally. JPEG applies the same selection before decode. */
function applySelection(result: ParsedMetadataResult, selection: ResolvedSelection): ParsedMetadataResult {
  const includeExif = wantsGroup(selection, "EXIF");
  const includeIptc = wantsGroup(selection, "IPTC");
  const includeIcc = wantsGroup(selection, "ICC");
  const exif = includeExif && result.exif !== null
    ? { ...result.exif, fields: selectedExif(result.exif.fields, selection) }
    : null;
  const fields = result.fields.filter((field) =>
    (includeIcc && field.ifd === "ICC") ||
    (includeIptc && field.ifd === "IPTC") ||
    (includeExif && field.ifd !== "ICC" && field.ifd !== "IPTC" && (selection.tags === null || selection.tags.has(field.name) || selection.tags.has(field.id))),
  );
  const { displayDimensions, transform, nclx, ...base } = result;
  return {
    ...base,
    ...(wantsGroup(selection, "Dimensions") ? {} : { dimensions: null }),
    ...(wantsGroup(selection, "Dimensions") && displayDimensions !== undefined ? { displayDimensions } : {}),
    ...(wantsGroup(selection, "Transform") && transform !== undefined ? { transform } : {}),
    ...(wantsGroup(selection, "Nclx") && nclx !== undefined ? { nclx } : {}),
    fields,
    exif,
    ...(wantsGroup(selection, "XMP") ? {} : { xmp: null }),
    ...(includeIptc ? {} : { iptc: null }),
    ...(includeIcc ? {} : { icc: null }),
    ...(wantsGroup(selection, "JFIF") ? {} : { jfif: null }),
    ...(wantsGroup(selection, "PNGText") ? {} : { pngText: [] }),
  };
}

function appearsTruncated(bytes: Uint8Array): boolean {
  const prefixes: readonly (readonly number[])[] = [
    [0xff, 0xd8, 0xff],
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    [0x49, 0x49, 0x2a, 0x00],
    [0x4d, 0x4d, 0x00, 0x2a],
  ];
  if (bytes.length > 0 && prefixes.some((prefix) => bytes.length < prefix.length && bytes.every((byte, i) => byte === prefix[i]))) {
    return true;
  }
  if (bytes.length >= 1 && bytes.length < 12) {
    const riff = [0x52, 0x49, 0x46, 0x46];
    if (bytes.subarray(0, Math.min(4, bytes.length)).every((byte, i) => byte === riff[i])) return true;
  }
  return bytes.length >= 4 && bytes.length < 12 && bytes[4] === 0x66 && bytes[5] === 0x74;
}

function unsupportedResult(bytes: Uint8Array, limits: SecurityLimits): ParsedMetadataResult {
  const detection = detectFormat(bytes);
  const warnings: MetadataWarning[] = [];
  if (detection.format === "unknown") {
    warnings.push(
      appearsTruncated(bytes)
        ? {
            code: "TRUNCATED_DATA",
            message: "Input ends before a recognized image signature is complete.",
            severity: "error",
          }
        : {
            code: "UNKNOWN_FORMAT",
            message: "Input does not have a recognized JPEG, PNG, TIFF, WebP, HEIF, or AVIF signature.",
            severity: "warning",
          },
    );
  } else {
    warnings.push({
      code: "UNSUPPORTED_FORMAT",
      message: `${detection.format.toUpperCase()} signature detection is supported, but metadata parsing is not implemented in this release.`,
      severity: "warning",
    });
  }

  return {
    ...detection,
    dimensions: null,
    fields: [],
    exif: null,
    xmp: null,
    iptc: null,
    icc: null,
    jfif: null,
    pngText: [],
    warnings: warnings.slice(0, limits.maxWarnings),
  };
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw new MetadataError("ABORTED", "Metadata operation was aborted.");
}

/** Parse metadata locally. This function never performs network I/O. */
export async function parseMetadata(input: MetadataInput, options: ParseOptions = {}): Promise<MetadataResult> {
  const limits = resolveLimits(options.limits);
  const selection = resolveSelection(options.select);
  throwIfAborted(options.signal);
  const materialization = options.scope === "metadata"
    ? await materializeMetadata(input, limits, selection)
    : {
        bytes: options.scope === "jpeg-header" ? await materializeJpegHeader(input, limits) : await materializeInput(input, limits),
        partial: options.scope === "jpeg-header",
        warnings: [],
      };
  let bytes = materialization.bytes;
  let partial = materialization.partial;
  throwIfAborted(options.signal);
  let detection = detectFormat(bytes);
  if (options.scope === "jpeg-header" && detection.format !== "jpeg") {
    bytes = await materializeInput(input, limits);
    detection = detectFormat(bytes);
    partial = false;
  }
  let result: ParsedMetadataResult;
  const headerOnly = (options.scope === "jpeg-header" || options.scope === "metadata") && detection.format === "jpeg";
  if (detection.format === "jpeg") {
    const { parseJpeg } = await import("./parsers/jpeg.js");
    result = parseJpeg(bytes, limits, { selection, headerOnly });
  } else if (detection.format === "png") {
    const { parsePng } = await import("./parsers/png.js");
    result = await parsePng(bytes, limits, selection);
  } else if (detection.format === "tiff") {
    const { parseTiffMetadata } = await import("./parsers/tiff.js");
    result = parseTiffMetadata(bytes, limits);
  } else if (detection.format === "webp") {
    const { parseWebp } = await import("./parsers/webp.js");
    result = parseWebp(bytes, limits, selection);
  } else if (detection.format === "heif" || detection.format === "avif") {
    const { parseHeif } = await import("./parsers/heif.js");
    result = parseHeif(bytes, limits, detection.format);
  }
  else result = unsupportedResult(bytes, limits);
  throwIfAborted(options.signal);
  const selected = applySelection({ ...result, warnings: [...materialization.warnings, ...result.warnings] }, selection);
  return completeMetadataResult(
    selected,
    partial ? "partial" : "full",
    partial
      ? [headerOnly ? "JPEG scan data was intentionally not read." : "Image payload ranges were intentionally not read."]
      : [],
    partial && materialization.bytesRead !== undefined
      ? { bytesRead: materialization.bytesRead, ...(materialization.inputBytes === undefined ? {} : { inputBytes: materialization.inputBytes }) }
      : undefined,
  );
}

/** Remove selected JPEG metadata without decoding or recompressing image pixels. */
export async function redactMetadata(input: MetadataInput, options: RedactOptions): Promise<RedactionResult> {
  const limits = resolveLimits(options.limits);
  throwIfAborted(options.signal);
  const bytes = await materializeInput(input, limits);
  throwIfAborted(options.signal);
  const { redactBytes } = await import("./privacy/redact.js");
  return completeRedactionResult(redactBytes(bytes, options, limits), options);
}

/** Audit recognized privacy metadata without modifying the input. */
export async function auditPrivacy(input: MetadataInput) {
  const { auditPrivacy: inspectPrivacy } = await import("./privacy/audit.js");
  return inspectPrivacy(input);
}

function jpegStrictGaps(bytes: Uint8Array): readonly string[] {
  const gaps: string[] = [];
  let eoi = -1;
  for (let index = 0; index + 1 < bytes.length; index += 1) {
    if (bytes[index] === 0xff && bytes[index + 1] === 0xd9) eoi = index;
  }
  if (eoi < 0) gaps.push("JPEG has no end-of-image marker.");
  else if (eoi + 2 !== bytes.length) gaps.push("JPEG contains bytes after its end-of-image marker.");

  let cursor = 2;
  while (cursor + 1 < bytes.length && bytes[cursor] === 0xff) {
    while (bytes[cursor] === 0xff) cursor += 1;
    const marker = bytes[cursor] ?? 0;
    cursor += 1;
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (cursor + 2 > bytes.length) { gaps.push("JPEG marker length is truncated."); break; }
    const length = ((bytes[cursor] ?? 0) << 8) | (bytes[cursor + 1] ?? 0);
    if (length < 2 || cursor + length > bytes.length) { gaps.push("JPEG marker extends beyond the input."); break; }
    if (marker >= 0xe0 && marker <= 0xef) {
      const payload = bytes.subarray(cursor + 2, cursor + length);
      const text = new TextDecoder("latin1").decode(payload.subarray(0, Math.min(payload.length, 32)));
      const recognized = text.startsWith("Exif\0\0")
        || text.startsWith("http://ns.adobe.com/xap/")
        || text.startsWith("ICC_PROFILE\0")
        || text.startsWith("JFIF\0")
        || text.startsWith("JFXX\0")
        || text.startsWith("Photoshop 3.0\0");
      if (!recognized) gaps.push(`JPEG APP${marker - 0xe0} block is opaque to the sanitization policy.`);
    }
    cursor += length;
  }
  return gaps;
}

/**
 * Remove recognized descriptive metadata for sharing. Bytes are returned only
 * when the declared strict policy is completely satisfied.
 */
export async function sanitizeMetadata(input: MetadataInput, options: SanitizeOptions = {}): Promise<SanitizationResult> {
  const limits = resolveLimits(options.limits);
  throwIfAborted(options.signal);
  const bytes = await materializeInput(input, limits);
  throwIfAborted(options.signal);
  const format = detectFormat(bytes).format;
  const retained: RedactionTarget[] = [];
  if (options.preserveColorProfile !== false) retained.push("ICC");
  if (options.preserveOrientation !== false) retained.push("Orientation");
  const surgeryOptions = { remove: ["AllMetadata"] as const, preserve: retained };
  const { redactBytes } = await import("./privacy/redact.js");
  const surgery = completeRedactionResult(redactBytes(bytes, surgeryOptions, limits), surgeryOptions);
  const warnings = [...surgery.warnings];
  const reasons = [...surgery.outcome.reasons];

  if (!surgery.outcome.successful) {
    return { format, data: null, successful: false, retained, warnings, reasons };
  }

  const reparsed = await parseMetadata(surgery.data, options.signal === undefined ? { limits } : { limits, signal: options.signal });
  if (!reparsed.completeness.complete) reasons.push(...reparsed.completeness.reasons);
  if (reparsed.xmp !== null || reparsed.iptc !== null || reparsed.jfif !== null || reparsed.pngText.length > 0) {
    reasons.push("Recognized descriptive metadata remains after sanitization.");
  }
  const nonOrientationExif = reparsed.exif?.fields.filter((field) => field.name !== "Orientation") ?? [];
  if (nonOrientationExif.length > 0) reasons.push("EXIF fields other than the requested orientation remain after sanitization.");
  if (reparsed.fields.some((field) => field.name !== "Orientation" && field.ifd !== "ICC" && (field.sensitivity === "high" || field.sensitivity === "moderate"))) {
    reasons.push("Recognized sensitive fields remain after sanitization.");
  }
  if (format === "jpeg") reasons.push(...jpegStrictGaps(surgery.data));
  if (format !== "jpeg" && format !== "png" && format !== "webp") reasons.push(`Strict metadata sanitization is not implemented for ${format.toUpperCase()}.`);
  const uniqueReasons = [...new Set(reasons)];
  return {
    format,
    data: uniqueReasons.length === 0 ? surgery.data : null,
    successful: uniqueReasons.length === 0,
    retained,
    warnings,
    reasons: uniqueReasons,
  };
}
