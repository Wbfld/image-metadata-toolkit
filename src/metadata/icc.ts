import type { IccData, IccDecodedTag, IccDecodedValue, IccTag, MetadataField, MetadataWarning, SecurityLimits } from "../types.js";
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
function signatureNumber(value: string): number { return Array.from(value.slice(0, 4)).reduce((sum, character) => sum * 256 + character.charCodeAt(0), 0); }

function uint32BigEndian(bytes: Uint8Array, offset: number): number {
  return readUint32(bytes, offset, "big-endian");
}

function int32BigEndian(bytes: Uint8Array, offset: number): number {
  const value = uint32BigEndian(bytes, offset);
  return value > 0x7fffffff ? value - 0x100000000 : value;
}

function s15Fixed16(bytes: Uint8Array, offset: number): number { return int32BigEndian(bytes, offset) / 65536; }
function uint16BigEndian(bytes: Uint8Array, offset: number): number { return ((bytes[offset] ?? 0) << 8) | (bytes[offset + 1] ?? 0); }
function u16Fixed16(bytes: Uint8Array, offset: number): number { return uint32BigEndian(bytes, offset) / 65536; }
function safeProduct(values: readonly number[], maximum: number): number | null { let product = 1; for (const value of values) { if (!Number.isSafeInteger(value) || value < 0 || (value !== 0 && product > Math.floor(maximum / value))) return null; product *= value; } return product; }
function allZero(bytes: Uint8Array, offset: number, length: number): boolean {
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || length < 0 || offset > bytes.length - length) return false;
  for (let index = offset; index < offset + length; index += 1) if ((bytes[index] ?? 0) !== 0) return false;
  return true;
}

function boundedText(bytes: Uint8Array, offset: number, length: number, encoding: "ascii" | "latin1" | "utf-16be", limits: SecurityLimits): string | null {
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || length < 0 || length > limits.maxStringBytes || offset > bytes.length - length) return null;
  const payload = bytes.subarray(offset, offset + length);
  try {
    if (encoding === "utf-16be") {
      if ((payload.length & 1) !== 0) return null;
      const swapped = new Uint8Array(payload.length);
      for (let index = 0; index < payload.length; index += 2) { swapped[index] = payload[index + 1] ?? 0; swapped[index + 1] = payload[index] ?? 0; }
      return new TextDecoder("utf-16le", { fatal: true }).decode(swapped).replace(/\0+$/u, "");
    }
    if (encoding === "ascii" && payload.some((byte) => byte > 0x7f)) return null;
    return new TextDecoder(encoding === "ascii" ? "utf-8" : "latin1", { fatal: encoding === "ascii" }).decode(payload).replace(/\0+$/u, "");
  } catch { return null; }
}

function decodeIccPayload(profile: Uint8Array, tag: IccTag, limits: SecurityLimits): IccDecodedTag {
  const fail = (status: "malformed" | "limited", typeSignature = tag.typeSignature ?? "????"): IccDecodedTag => ({ signature: tag.signature, typeSignature, offset: tag.offset, byteLength: tag.byteLength, status, value: null, sharedWith: [] });
  if (!tag.valid || tag.rangeStatus === "overlap" || tag.byteLength < 8 || tag.offset > profile.length - tag.byteLength) return fail("malformed");
  const typeSignature = ascii(profile, tag.offset);
  const payload = tag.offset + 8;
  const end = tag.offset + tag.byteLength;
  if (!allZero(profile, tag.offset + 4, 4)) return fail("malformed", typeSignature);
  const need = (count: number, bytes: number): boolean => Number.isSafeInteger(count) && count >= 0 && count <= limits.maxIccElements && count <= Math.floor((end - payload) / bytes);
  let value: IccDecodedValue | null = null;
  if (typeSignature === "text") {
    const text = boundedText(profile, payload, end - payload, "ascii", limits); if (text === null) return fail("malformed", typeSignature); value = { kind: "text", text, encoding: "ascii" };
  } else if (typeSignature === "desc") {
    if (payload > end - 4) return fail("malformed", typeSignature);
    const asciiLength = uint32BigEndian(profile, payload);
    if (asciiLength < 1 || asciiLength > limits.maxStringBytes || payload + 4 > end - asciiLength) return fail(asciiLength > limits.maxStringBytes ? "limited" : "malformed", typeSignature);
    if ((profile[payload + 4 + asciiLength - 1] ?? 0) !== 0) return fail("malformed", typeSignature);
    const asciiText = boundedText(profile, payload + 4, asciiLength, "ascii", limits);
    if (asciiText === null) return fail("malformed", typeSignature);
    let unicodeText: string | undefined;
    let scriptCode: number | undefined;
    const unicodeHeader = payload + 4 + asciiLength;
    if (unicodeHeader < end && unicodeHeader > end - 8) return fail("malformed", typeSignature);
    if (unicodeHeader <= end - 8) {
      uint32BigEndian(profile, unicodeHeader);
      const unicodeCount = uint32BigEndian(profile, unicodeHeader + 4);
      const unicodeLength = safeProduct([unicodeCount, 2], Math.min(limits.maxStringBytes, end - unicodeHeader - 8));
      if (unicodeLength === null || unicodeHeader + 8 > end - unicodeLength) return unicodeCount > limits.maxStringBytes ? fail("limited", typeSignature) : fail("malformed", typeSignature);
      const decodedUnicode = boundedText(profile, unicodeHeader + 8, unicodeLength, "utf-16be", limits);
      if (decodedUnicode === null) return fail("malformed", typeSignature);
      if (unicodeLength > 0) unicodeText = decodedUnicode;
      const scriptHeader = unicodeHeader + 8 + unicodeLength;
      if (scriptHeader < end && scriptHeader > end - 70) return fail("malformed", typeSignature);
      if (scriptHeader <= end - 70) {
        scriptCode = uint16BigEndian(profile, scriptHeader);
        const scriptLength = profile[scriptHeader + 2] ?? 0;
        if (scriptLength > 67 || scriptHeader + 70 > end) return fail("malformed", typeSignature);
      }
    }
    value = { kind: "text", text: unicodeText ?? asciiText, encoding: unicodeText === undefined ? "ascii" : "utf-16be", asciiText, ...(unicodeText === undefined ? {} : { unicodeText }), ...(scriptCode === undefined ? {} : { scriptCode }) };
  } else if (typeSignature === "mluc") {
    if (payload > end - 8) return fail("malformed", typeSignature); const count = uint32BigEndian(profile, payload); const recordSize = uint32BigEndian(profile, payload + 4); const recordsBytes = safeProduct([count, recordSize], end - payload - 8); if (recordSize < 12 || count > limits.maxIccElements || recordsBytes === null || payload + 8 + recordsBytes > end) return fail(count > limits.maxIccElements ? "limited" : "malformed", typeSignature);
    const values: Array<{ language: string; country: string; text: string }> = [];
    for (let index = 0; index < count; index += 1) { const record = payload + 8 + index * recordSize; const length = uint32BigEndian(profile, record + 4); const relativeOffset = uint32BigEndian(profile, record + 8); const offset = tag.offset + relativeOffset; const languageBytes = profile.subarray(record, record + 2); const countryBytes = profile.subarray(record + 2, record + 4); const validCode = [...languageBytes, ...countryBytes].every((byte) => byte >= 0x20 && byte <= 0x7e); const text = boundedText(profile, offset, length, "utf-16be", limits); if (!validCode || text === null || relativeOffset < 8 + recordsBytes || offset > end - length) return fail("malformed", typeSignature); values.push({ language: ascii(profile, record).slice(0, 2), country: ascii(profile, record).slice(2, 4), text }); }
    value = { kind: "mluc", values };
  } else if (typeSignature === "XYZ ") {
    const count = (end - payload) / 12; if (!Number.isInteger(count) || !need(count, 12)) return fail("malformed", typeSignature); value = { kind: "xyz", values: Array.from({ length: count }, (_, index) => ({ x: s15Fixed16(profile, payload + index * 12), y: s15Fixed16(profile, payload + index * 12 + 4), z: s15Fixed16(profile, payload + index * 12 + 8) })) };
  } else if (typeSignature === "curv") {
    if (payload > end - 4) return fail("malformed", typeSignature); const count = uint32BigEndian(profile, payload); if (count === 0) value = { kind: "curve", form: "identity" }; else if (count === 1 && payload <= end - 6) value = { kind: "curve", form: "gamma", gamma: (((profile[payload + 4] ?? 0) << 8) | (profile[payload + 5] ?? 0)) / 256 }; else { if (!need(count, 2) || payload + 4 + count * 2 > end) return fail(count > limits.maxIccElements ? "limited" : "malformed", typeSignature); value = { kind: "curve", form: "sampled", samples: Array.from({ length: count }, (_, index) => (((profile[payload + 4 + index * 2] ?? 0) << 8) | (profile[payload + 5 + index * 2] ?? 0))) }; }
  } else if (typeSignature === "para") {
    if (payload > end - 4 || !allZero(profile, payload + 2, 2)) return fail("malformed", typeSignature); const functionType = (profile[payload] ?? 0) * 256 + (profile[payload + 1] ?? 0); const parameterCount = [1, 3, 4, 5, 7].at(functionType); if (parameterCount === undefined || !need(parameterCount, 4) || payload + 4 + parameterCount * 4 > end) return fail("malformed", typeSignature); value = { kind: "parametric-curve", functionType, parameters: Array.from({ length: parameterCount }, (_, index) => s15Fixed16(profile, payload + 4 + index * 4)) };
  } else if (typeSignature === "sf32") {
    const count = (end - payload) / 4; if (!Number.isInteger(count) || !need(count, 4)) return fail("malformed", typeSignature); value = { kind: "matrix", values: Array.from({ length: count }, (_, index) => s15Fixed16(profile, payload + index * 4)) };
  } else if (typeSignature === "sig ") {
    if (payload > end - 4) return fail("malformed", typeSignature); value = { kind: "signature", value: { signature: ascii(profile, payload) } };
  } else if (typeSignature === "meas") {
    // ICC.1:2022 measurementType is 36 bytes including the type header. Its
    // final four bytes are the enumerated standard-illuminant code, not an
    // XYZNumber (Table 49 and Table 53).
    if (tag.byteLength < 36 || payload > end - 28) return fail("malformed", typeSignature); value = { kind: "measurement", value: { observer: uint32BigEndian(profile, payload), backing: { x: s15Fixed16(profile, payload + 4), y: s15Fixed16(profile, payload + 8), z: s15Fixed16(profile, payload + 12) }, geometry: uint32BigEndian(profile, payload + 16), flare: u16Fixed16(profile, payload + 20), illuminant: uint32BigEndian(profile, payload + 24) } };
  } else if (typeSignature === "view") {
    if (tag.byteLength < 36) return fail("malformed", typeSignature); value = { kind: "viewing-conditions", value: { illuminant: { x: s15Fixed16(profile, payload), y: s15Fixed16(profile, payload + 4), z: s15Fixed16(profile, payload + 8) }, surround: { x: s15Fixed16(profile, payload + 12), y: s15Fixed16(profile, payload + 16), z: s15Fixed16(profile, payload + 20) }, illuminantType: uint32BigEndian(profile, payload + 24) } };
  } else if (typeSignature === "clro") {
    if (tag.byteLength < 12) return fail("malformed", typeSignature); const count = uint32BigEndian(profile, payload); if (count > limits.maxIccElements) return fail("limited", typeSignature); if (payload + 4 + count > end) return fail("malformed", typeSignature); value = { kind: "colorant-order", value: { count, order: Array.from(profile.subarray(payload + 4, payload + 4 + count)) } };
  } else if (typeSignature === "clrt") {
    const recordSize = 44;
    if (tag.byteLength < 12) return fail("malformed", typeSignature); const count = uint32BigEndian(profile, payload); const required = safeProduct([count, recordSize], limits.maxIccOutputBytes); if (count > limits.maxIccElements || required === null) return fail("limited", typeSignature); if (payload + 4 + required > end) return fail("malformed", typeSignature); const entries: Array<{ name: string; pcs: { x: number; y: number; z: number } }> = []; for (let index = 0; index < count; index += 1) { const at = payload + 4 + index * recordSize; const name = boundedText(profile, at, 32, "ascii", limits); if (name === null) return fail("malformed", typeSignature); entries.push({ name, pcs: { x: s15Fixed16(profile, at + 32), y: s15Fixed16(profile, at + 36), z: s15Fixed16(profile, at + 40) } }); } value = { kind: "colorant-table", value: { count, entries } };
  } else if (typeSignature === "mft1" || typeSignature === "mft2") {
    const minimum = typeSignature === "mft1" ? 48 : 52; if (tag.byteLength < minimum) return fail("malformed", typeSignature); const inputChannels = profile[payload] ?? 0; const outputChannels = profile[payload + 1] ?? 0; const gridPoints = profile[payload + 2] ?? 0; if (inputChannels < 1 || inputChannels > 15 || outputChannels < 1 || outputChannels > 15 || gridPoints < 2) return fail("malformed", typeSignature); const inputEntries = typeSignature === "mft1" ? 256 : uint16BigEndian(profile, tag.offset + 48); const outputEntries = typeSignature === "mft1" ? 256 : uint16BigEndian(profile, tag.offset + 50); if (inputEntries < 1 || outputEntries < 1) return fail("malformed", typeSignature); const bytesPerEntry = typeSignature === "mft1" ? 1 : 2; const gridCells = safeProduct(Array.from({ length: inputChannels }, () => gridPoints), limits.maxIccElements); const clutEntries = gridCells === null ? null : safeProduct([gridCells, outputChannels], limits.maxIccElements); const tableBytes = clutEntries === null ? null : safeProduct([inputChannels * inputEntries + clutEntries + outputChannels * outputEntries, bytesPerEntry], limits.maxIccOutputBytes); if (tableBytes === null) return fail("limited", typeSignature); if (minimum + tableBytes > tag.byteLength) return fail("malformed", typeSignature); value = { kind: "lut", value: { type: typeSignature, inputChannels, outputChannels, gridPoints, inputEntries, outputEntries, matrix: Array.from({ length: 9 }, (_, index) => s15Fixed16(profile, tag.offset + 12 + index * 4)), tableBytes } };
  } else if (typeSignature === "mAB " || typeSignature === "mBA ") {
    if (tag.byteLength < 32 || !allZero(profile, tag.offset + 10, 2)) return fail("malformed", typeSignature); const inputChannels = profile[payload] ?? 0; const outputChannels = profile[payload + 1] ?? 0; if (inputChannels < 1 || inputChannels > 15 || outputChannels < 1 || outputChannels > 15) return fail("malformed", typeSignature); const names = ["bCurves", "matrix", "mCurves", "clut", "aCurves"] as const; const offsets = Object.fromEntries(names.map((name, index) => [name, uint32BigEndian(profile, tag.offset + 12 + index * 4)])); if (Object.values(offsets).some((offset) => typeof offset !== "number" || (offset !== 0 && (offset < 32 || offset % 4 !== 0 || offset > tag.byteLength - 8)))) return fail("malformed", typeSignature); const clutOffset = offsets.clut ?? 0; let clut: Record<string, unknown> | null = null; if (clutOffset !== 0) { const at = tag.offset + clutOffset; if (at > end - 20 - inputChannels) return fail("malformed", typeSignature); const grid = Array.from(profile.subarray(at, at + inputChannels)); const precision = profile[at + 16] ?? 0; if (grid.length !== inputChannels || grid.some((item) => item < 2) || (precision !== 1 && precision !== 2)) return fail("malformed", typeSignature); const entries = safeProduct([...grid, outputChannels, precision], limits.maxIccOutputBytes); if (entries === null) return fail("limited", typeSignature); if (at + 20 + entries > end) return fail("malformed", typeSignature); clut = { gridPoints: grid, precisionBytes: precision, tableBytes: entries }; } value = { kind: "lut", value: { type: typeSignature, inputChannels, outputChannels, offsets, clut } };
  }
  return { signature: tag.signature, typeSignature, offset: tag.offset, byteLength: tag.byteLength, status: value === null ? "unknown" : "decoded", value, sharedWith: [] };
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
  const profileEnd = declaredSize >= 132 && declaredSize <= profile.length ? declaredSize : profile.length;
  if (ascii(profile, 36) !== "acsp") iccWarning(warnings, limits, "ICC profile signature is invalid; expected acsp.", 36, 4);
  if (!allZero(profile, 100, 28)) iccWarning(warnings, limits, "ICC profile header reserved bytes are non-zero.", 100, 28);
  const renderingIntent = uint32BigEndian(profile, 64);
  if (renderingIntent > 3) {
    iccWarning(warnings, limits, "ICC rendering intent is outside the four defined values.", 64, 4);
  }
  if ((renderingIntent & 0xffff0000) !== 0) {
    iccWarning(warnings, limits, "ICC rendering intent has non-zero reserved high bits.", 64, 4);
  }
  const tagCount = uint32BigEndian(profile, 128);
  const tagTableEnd = 132 + tagCount * 12;
  if (!Number.isSafeInteger(tagTableEnd) || tagTableEnd > profileEnd) {
    iccWarning(warnings, limits, "ICC tag table extends beyond the assembled profile.", 128, 4);
  } else {
    const ranges: Array<{ start: number; end: number; signature: string }> = [];
    const tagLimit = Math.min(tagCount, limits.maxIfdEntries);
    if (tagCount > tagLimit) iccWarning(warnings, limits, "ICC tag count exceeds the configured entry limit; remaining tags were not inspected.", 128, 4, "LIMIT_EXCEEDED");
    for (let index = 0; index < tagLimit; index += 1) {
      const entry = 132 + index * 12;
      const offset = uint32BigEndian(profile, entry + 4);
      const length = uint32BigEndian(profile, entry + 8);
      const end = offset + length;
      const signature = ascii(profile, entry);
      let rangeStatus: IccTag["rangeStatus"] = "unique";
      const valid = length >= 8 && offset % 4 === 0 && offset >= tagTableEnd && Number.isSafeInteger(end) && end <= profileEnd;
      if (!valid) {
        iccWarning(warnings, limits, "ICC tag payload range is invalid.", entry + 4, 8);
        tags.push({ signature, offset, byteLength: length, valid });
        continue;
      }
      // ICC tag-table entries are allowed to share one complete payload. This
      // is common for equivalent TRC tags. A partial overlap, however, has no
      // unambiguous bounded interpretation and remains invalid.
      const exact = ranges.filter((range) => range.start === offset && range.end === end);
      if (exact.length > 0) rangeStatus = "shared";
      if (ranges.some((range) => (range.start !== offset || range.end !== end) && offset < range.end && range.start < end)) {
        iccWarning(warnings, limits, "ICC tag payloads overlap.", entry + 4, 8);
        rangeStatus = "overlap";
      }
      tags.push({ signature, offset, byteLength: length, valid: rangeStatus !== "overlap", ...(rangeStatus === "unique" ? {} : { typeSignature: ascii(profile, offset), rangeStatus }) });
      ranges.push({ start: offset, end, signature });
    }
    for (let left = 0; left < tags.length; left += 1) for (let right = left + 1; right < tags.length; right += 1) {
      const a = tags[left]; const b = tags[right]; if (a === undefined || b === undefined || a.offset > profile.length - a.byteLength || b.offset > profile.length - b.byteLength) continue;
      const aEnd = a.offset + a.byteLength; const bEnd = b.offset + b.byteLength; const exact = a.offset === b.offset && aEnd === bEnd;
      if (exact) { tags[left] = { ...a, typeSignature: ascii(profile, a.offset), rangeStatus: "shared" }; tags[right] = { ...b, typeSignature: ascii(profile, b.offset), rangeStatus: "shared" }; }
      else if (a.offset < bEnd && b.offset < aEnd) { tags[left] = { ...a, valid: false, typeSignature: ascii(profile, a.offset), rangeStatus: "overlap" }; tags[right] = { ...b, valid: false, typeSignature: ascii(profile, b.offset), rangeStatus: "overlap" }; }
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
  const dateParts = Array.from({ length: 6 }, (_, index) => ((profile[24 + index * 2] ?? 0) << 8) | (profile[25 + index * 2] ?? 0));
  const [year = 0, month = 0, day = 0, hour = 0, minute = 0, second = 0] = dateParts;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const validDate = year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= (monthDays[month - 1] ?? 0) && hour <= 23 && minute <= 59 && second <= 59;
  if (dateParts.some((part) => part !== 0) && !validDate) iccWarning(warnings, limits, "ICC profile creation date is invalid.", 24, 12);
  if (validDate) {
    const display = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}T${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
    fields.push({ id: "ICC:0x0018", ifd: "ICC", tag: 0x18, name: "ProfileDate", raw: display, value: display, display, description: "ICC profile creation date and time; no timezone is encoded.", type: "COMPOSITE", sensitivity: "low" });
  }
  const decodedTags: IccDecodedTag[] = [];
  const cached = new Map<string, IccDecodedTag>();
  let decodedOutputBytes = 0;
  for (const tag of tags.slice(0, limits.maxIccDecodedTags)) {
    const key = `${tag.offset}:${tag.byteLength}`;
    const decoded = cached.get(key) ?? decodeIccPayload(profile, tag, limits);
    cached.set(key, decoded);
    const sharedWith = tags.filter((candidate) => candidate.offset === tag.offset && candidate.byteLength === tag.byteLength && candidate.signature !== tag.signature).map((candidate) => candidate.signature);
    if (decoded.status === "malformed") {
      iccWarning(warnings, limits, `ICC tag ${tag.signature} has a malformed or truncated ${decoded.typeSignature} payload.`, tag.offset, tag.byteLength, "TRUNCATED_DATA");
    } else if (decoded.status === "limited") {
      iccWarning(warnings, limits, `ICC tag ${tag.signature} exceeds the configured decoding limits.`, tag.offset, tag.byteLength, "LIMIT_EXCEEDED");
    }
    const retained = JSON.stringify(decoded.value).length;
    if (retained > limits.maxIccOutputBytes - decodedOutputBytes) {
      decodedTags.push({ ...decoded, signature: tag.signature, status: "limited", value: null, sharedWith });
      iccWarning(warnings, limits, "ICC decoded output exceeds the configured cumulative limit.", tag.offset, tag.byteLength, "LIMIT_EXCEEDED");
    } else { decodedOutputBytes += retained; decodedTags.push({ ...decoded, signature: tag.signature, sharedWith }); }
  }
  const names: Readonly<Record<string, string>> = { desc: "ProfileDescription", cprt: "ProfileCopyright", wtpt: "MediaWhitePoint", rXYZ: "RedColorant", gXYZ: "GreenColorant", bXYZ: "BlueColorant", rTRC: "RedTRC", gTRC: "GreenTRC", bTRC: "BlueTRC", kTRC: "GrayTRC", tech: "ProfileTechnology", chad: "ChromaticAdaptation" };
  for (const decoded of decodedTags) {
    if (decoded.status !== "decoded" || decoded.value === null || names[decoded.signature] === undefined) continue;
    const display = decoded.value.kind === "text" ? decoded.value.text : decoded.value.kind === "mluc" ? decoded.value.values.map((item) => `${item.language}-${item.country}:${item.text}`).join("; ") : JSON.stringify(decoded.value);
    fields.push({ id: `ICC:${decoded.signature}`, ifd: "ICC", tag: signatureNumber(decoded.signature), name: names[decoded.signature] ?? decoded.signature, raw: decoded.typeSignature, value: display, display, description: `Decoded ICC ${decoded.signature} tag payload.`, type: "COMPOSITE", sensitivity: decoded.signature === "cprt" ? "moderate" : "low", count: 1, known: true });
  }
  if (tags.length > limits.maxIccDecodedTags) iccWarning(warnings, limits, "ICC decoded tag count exceeds the configured limit.", 128, 4, "LIMIT_EXCEEDED");
  const data: IccData = { ...summary, tags, fields, decodedTags };
  return { data, fields, warnings };
}
