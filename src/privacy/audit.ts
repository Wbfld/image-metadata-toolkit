import { parseMetadata } from "../index.js";
import { materializeInput } from "../input.js";
import { resolveLimits } from "../security/limits.js";
import type { MetadataInput, MetadataResult, MetadataWarning, Sensitivity } from "../types.js";

export interface PrivacyFinding {
  readonly target: string;
  readonly sensitivity: Sensitivity;
  readonly message: string;
}

export interface PrivacyAuditResult {
  readonly format: MetadataResult["format"];
  readonly safe: boolean;
  readonly complete: boolean;
  readonly findings: readonly PrivacyFinding[];
  readonly opaqueBlocks: readonly PrivacyOpaqueBlock[];
  readonly thumbnails: readonly string[];
  readonly trailingBytes: number;
  readonly gaps: readonly string[];
  readonly warnings: readonly MetadataWarning[];
}

export interface PrivacyOpaqueBlock {
  readonly format: MetadataResult["format"];
  readonly label: string;
  readonly offset: number;
  readonly length: number;
}

function jpegInspection(bytes: Uint8Array): { readonly opaqueBlocks: readonly PrivacyOpaqueBlock[]; readonly trailingBytes: number; readonly malformed: boolean } {
  const opaqueBlocks: PrivacyOpaqueBlock[] = [];
  let eoi = -1;
  for (let index = 0; index + 1 < bytes.length; index += 1) if (bytes[index] === 0xff && bytes[index + 1] === 0xd9) eoi = index;
  let cursor = 2;
  let malformed = false;
  while (cursor + 1 < bytes.length && bytes[cursor] === 0xff) {
    while (bytes[cursor] === 0xff) cursor += 1;
    const marker = bytes[cursor] ?? 0;
    cursor += 1;
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (cursor + 2 > bytes.length) { malformed = true; break; }
    const length = ((bytes[cursor] ?? 0) << 8) | (bytes[cursor + 1] ?? 0);
    if (length < 2 || cursor + length > bytes.length) { malformed = true; break; }
    if (marker >= 0xe0 && marker <= 0xef) {
      const payload = bytes.subarray(cursor + 2, cursor + length);
      const prefix = new TextDecoder("latin1").decode(payload.subarray(0, Math.min(payload.length, 32)));
      const fullPayload = new TextDecoder("latin1").decode(payload);
      const mpf = prefix.startsWith("MPF\0");
      const gainMap = fullPayload.includes("http://ns.adobe.com/hdr-gain-map/1.0/") || fullPayload.includes("hdrgm:Version");
      const recognized = prefix.startsWith("Exif\0\0") || prefix.startsWith("http://ns.adobe.com/xap/") || prefix.startsWith("ICC_PROFILE\0") || prefix.startsWith("JFIF\0") || prefix.startsWith("JFXX\0") || prefix.startsWith("Photoshop 3.0\0") || mpf || gainMap;
      if (!recognized) opaqueBlocks.push({ format: "jpeg", label: `APP${marker - 0xe0}`, offset: cursor - 2, length: length + 2 });
      if (mpf) opaqueBlocks.push({ format: "jpeg", label: "MPF multi-picture", offset: cursor - 2, length: length + 2 });
      if (gainMap) opaqueBlocks.push({ format: "jpeg", label: "Ultra HDR gain map", offset: cursor - 2, length: length + 2 });
    }
    cursor += length;
  }
  return { opaqueBlocks, trailingBytes: eoi < 0 ? 0 : bytes.length - (eoi + 2), malformed };
}

/** Inspect recognized privacy-sensitive metadata without modifying the input. */
export async function auditPrivacy(input: MetadataInput): Promise<PrivacyAuditResult> {
  const limits = resolveLimits();
  const bytes = await materializeInput(input, limits);
  const result = await parseMetadata(bytes, { limits });
  const findings: PrivacyFinding[] = [];
  const classes: Array<[string, boolean, Sensitivity, string]> = [
    ["EXIF", result.exif !== null, "moderate", "EXIF metadata is present."],
    ["XMP", result.xmp !== null, "moderate", "XMP metadata is present and its packet contents were not semantically inspected."],
    ["IPTC", result.iptc !== null, "moderate", "IPTC metadata is present."],
    ["ICC", result.icc !== null, "low", "An ICC color profile is present."],
    ["JFIF", result.jfif !== null, "low", "JFIF header metadata is present."],
    ["PNGText", result.pngText.length > 0, "moderate", "PNG textual metadata is present."],
  ];
  for (const [target, present, sensitivity, message] of classes) {
    if (present) findings.push({ target, sensitivity, message });
  }
  for (const item of result.fields) {
    if (item.sensitivity === "high" || item.sensitivity === "moderate") {
      findings.push({ target: item.name, sensitivity: item.sensitivity, message: `${item.name} is present in ${item.ifd}.` });
    }
  }
  const gaps: string[] = [];
  const opaqueBlocks: PrivacyOpaqueBlock[] = [];
  const thumbnails: string[] = [];
  let trailingBytes = 0;
  if (result.format === "unknown") gaps.push("The image format was not recognized, so metadata safety could not be established.");
  if (result.xmp !== null) gaps.push("XMP packets are retained as raw XML and may contain additional sensitive properties.");
  if (result.format === "jpeg") {
    const inspection = jpegInspection(bytes);
    opaqueBlocks.push(...inspection.opaqueBlocks);
    trailingBytes = inspection.trailingBytes;
    if (inspection.opaqueBlocks.length > 0) gaps.push("Opaque JPEG APP markers are retained by lossless redaction.");
    if (inspection.opaqueBlocks.some(({ label }) => label === "MPF multi-picture")) gaps.push("JPEG MPF secondary images are not rewritten by lossless redaction.");
    if (inspection.opaqueBlocks.some(({ label }) => label === "Ultra HDR gain map")) gaps.push("Ultra HDR gain-map structures are not rewritten by lossless redaction.");
    if (inspection.trailingBytes > 0) gaps.push("Bytes after the JPEG end marker are retained by lossless redaction.");
    if (inspection.malformed) gaps.push("JPEG marker structure could not be fully inspected.");
  }
  if (result.format === "heif" || result.format === "avif") gaps.push("HEIF/AVIF item properties outside the bounded metadata paths are not inspected.");
  if (result.exif?.fields.some((field) => field.name === "JPEGInterchangeFormat" || field.name === "JPEGInterchangeFormatLength")) thumbnails.push("EXIF JPEG thumbnail");
  const complete = result.format !== "unknown" && !result.warnings.some(({ severity, code }) => severity === "error" || code === "UNSUPPORTED_FORMAT");
  return {
    format: result.format,
    safe: complete && findings.length === 0 && gaps.length === 0,
    complete,
    findings,
    opaqueBlocks,
    thumbnails,
    trailingBytes,
    gaps,
    warnings: result.warnings,
  };
}
