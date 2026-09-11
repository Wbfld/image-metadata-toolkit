import type { IccData, IccTag, MetadataField, MetadataWarning, SecurityLimits } from "../types.js";
import { readUint32 } from "../security/bounds.js";

const ICC_IDENTIFIER = [0x49, 0x43, 0x43, 0x5f, 0x50, 0x52, 0x4f, 0x46, 0x49, 0x4c, 0x45, 0x00] as const;

export interface IccChunk {
  readonly sequence: number;
  readonly total: number;
  readonly byteLength: number;
  readonly data?: Uint8Array;
}

export function parseIccChunk(payload: Uint8Array): IccChunk | null {
  if (payload.length < 14 || !ICC_IDENTIFIER.every((byte, index) => payload[index] === byte)) {
    return null;
  }

  const sequence = payload[12] ?? 0;
  const total = payload[13] ?? 0;
  if (sequence === 0 || total === 0 || sequence > total) {
    return null;
  }
  return { sequence, total, byteLength: payload.length - 14, data: payload.subarray(14).slice() };
}

export function summarizeIcc(chunks: readonly IccChunk[]): IccData | null {
  if (chunks.length === 0) return null;

  const totals = new Set(chunks.map((chunk) => chunk.total));
  const expected = totals.size === 1 ? (chunks[0]?.total ?? 0) : 0;
  const sequences = new Set(chunks.map((chunk) => chunk.sequence));
  return {
    byteLength: chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0),
    chunks: chunks.length,
    complete: expected > 0 && chunks.length === expected && sequences.size === expected,
  };
}

const ICC_FIELD_DEFINITIONS: Readonly<Record<number, { name: string; description: string }>> = {
  0x0000: { name: "ProfileSize", description: "Declared ICC profile size in bytes." },
  0x0004: { name: "CMMType", description: "Profile connection-space module signature." },
  0x0008: { name: "ProfileVersion", description: "Encoded ICC profile version." },
  0x000c: { name: "DeviceClass", description: "ICC device class signature." },
  0x0010: { name: "ColorSpace", description: "Encoded device color space signature." },
  0x0014: { name: "PCS", description: "Profile connection space signature." },
  0x0040: { name: "RenderingIntent", description: "Default rendering intent." },
};

function ascii(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(bytes[offset] ?? 0, bytes[offset + 1] ?? 0, bytes[offset + 2] ?? 0, bytes[offset + 3] ?? 0);
}

function uint32BigEndian(bytes: Uint8Array, offset: number): number {
  return readUint32(bytes, offset, "big-endian");
}

function iccWarning(
  warnings: MetadataWarning[],
  limits: SecurityLimits,
  message: string,
  offset?: number,
  length?: number,
  code: MetadataWarning["code"] = "INVALID_VALUE",
): void {
  if (warnings.length >= limits.maxWarnings) return;
  warnings.push({
    code,
    message,
    severity: "warning",
    ...(offset === undefined ? {} : { offset }),
    ...(length === undefined ? {} : { length }),
  });
}

/** Validate and expose bounded ICC profile header fields from complete chunks. */
export function inspectIccProfile(chunks: readonly IccChunk[], limits: SecurityLimits): { data: IccData | null; fields: readonly MetadataField[]; warnings: readonly MetadataWarning[] } {
  const summary = summarizeIcc(chunks);
  if (summary === null || !summary.complete) return { data: summary, fields: [], warnings: [] };
  if (summary.byteLength > limits.maxMetadataBytes || summary.byteLength > limits.maxValueBytes) {
    return {
      data: summary,
      fields: [],
      warnings: [{ code: "LIMIT_EXCEEDED", message: "ICC profile exceeds the configured metadata limit and was not decoded.", severity: "warning" }],
    };
  }
  const ordered = [...chunks].sort((left, right) => left.sequence - right.sequence);
  const profile = new Uint8Array(summary.byteLength);
  let cursor = 0;
  for (const chunk of ordered) {
    if (chunk.data === undefined || chunk.data.length !== chunk.byteLength) return { data: summary, fields: [], warnings: [] };
    profile.set(chunk.data, cursor);
    cursor += chunk.data.length;
  }
  const warnings: MetadataWarning[] = [];
  const tags: IccTag[] = [];
  if (profile.length < 132) {
    warnings.push({ code: "TRUNCATED_DATA", message: "ICC profile is shorter than the 128-byte header and tag-count table.", severity: "error" });
    return { data: summary, fields: [], warnings };
  }
  const declaredSize = uint32BigEndian(profile, 0);
  if (declaredSize < 132 || declaredSize > profile.length) iccWarning(warnings, limits, "ICC profile size is invalid or exceeds the assembled profile.", 0, 4);
  if (declaredSize !== profile.length) iccWarning(warnings, limits, "ICC profile contains trailing or missing bytes relative to its declared size.", 0, 4);
  if (ascii(profile, 36) !== "acsp") iccWarning(warnings, limits, "ICC profile signature is invalid; expected acsp.", 36, 4);
  const renderingIntent = uint32BigEndian(profile, 64);
  if (renderingIntent > 3) {
    iccWarning(warnings, limits, "ICC rendering intent is outside the four defined values.", 64, 4);
  }
  if ((renderingIntent & 0xffff0000) !== 0) {
    iccWarning(warnings, limits, "ICC rendering intent has non-zero reserved high bits.", 64, 4);
  }
  const tagCount = uint32BigEndian(profile, 128);
  const tagTableEnd = 132 + tagCount * 12;
  if (!Number.isSafeInteger(tagTableEnd) || tagTableEnd > profile.length) {
    iccWarning(warnings, limits, "ICC tag table extends beyond the assembled profile.", 128, 4);
  } else {
    const ranges: Array<{ start: number; end: number }> = [];
    const tagLimit = Math.min(tagCount, limits.maxIfdEntries);
    if (tagCount > tagLimit) iccWarning(warnings, limits, "ICC tag count exceeds the configured entry limit; remaining tags were not inspected.", 128, 4, "LIMIT_EXCEEDED");
    for (let index = 0; index < tagLimit; index += 1) {
      const entry = 132 + index * 12;
      const offset = uint32BigEndian(profile, entry + 4);
      const length = uint32BigEndian(profile, entry + 8);
      const end = offset + length;
      const signature = ascii(profile, entry);
      const valid = offset % 4 === 0 && offset >= tagTableEnd && Number.isSafeInteger(end) && end <= profile.length;
      tags.push({ signature, offset, byteLength: length, valid });
      if (!valid) {
        iccWarning(warnings, limits, "ICC tag payload range is invalid.", entry + 4, 8);
        continue;
      }
      // ICC tag-table entries are allowed to share one complete payload. This
      // is common for equivalent TRC tags. A partial overlap, however, has no
      // unambiguous bounded interpretation and remains invalid.
      if (ranges.some((range) => range.start !== offset && offset < range.end && range.start < end)) {
        iccWarning(warnings, limits, "ICC tag payloads overlap.", entry + 4, 8);
      }
      ranges.push({ start: offset, end });
    }
  }
  const fields: MetadataField[] = [];
  for (const [offsetText, definition] of Object.entries(ICC_FIELD_DEFINITIONS)) {
    const offset = Number(offsetText);
    const numeric = offset === 0 || offset === 8 || offset === 64;
    const raw = numeric ? uint32BigEndian(profile, offset) : ascii(profile, offset);
    const display = offset === 64
      ? `${raw} (${["perceptual", "media-relative colorimetric", "saturation", "ICC-absolute colorimetric"][Number(raw)] ?? "unknown"})`
      : offset === 8
        ? `0x${Number(raw).toString(16).padStart(8, "0")}`
        : String(raw);
    const value: MetadataField["value"] = raw;
    fields.push({ id: `ICC:0x${offset.toString(16).padStart(4, "0")}`, ifd: "ICC", tag: offset, name: definition.name, raw, value, display, description: definition.description, type: numeric ? "LONG" : "UNDEFINED", sensitivity: "low" });
  }
  const data: IccData = { ...summary, tags, fields };
  return { data, fields, warnings };
}
