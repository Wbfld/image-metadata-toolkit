import { parseExif, type ParsedExif } from "../metadata/exif.js";
import { inspectIccProfile, type IccChunk } from "../metadata/icc.js";
import { parseIptcMetadata } from "../metadata/iptc.js";
import type { ImageDimensions, MetadataResult, MetadataWarning, SecurityLimits } from "../types.js";

/** True for a classic TIFF header in either byte order. */
export function isTiffHeader(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 4) return false;
  return (
    (bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) ||
    (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a)
  );
}

/** Parse the metadata IFDs of a classic TIFF file without reading pixel strips. */
export function parseTiff(
  bytes: Uint8Array,
  limits: SecurityLimits,
  warningBaseOffset = 0,
): ParsedExif {
  return parseExif(bytes, limits, warningBaseOffset);
}

function tiffDimensions(fields: ParsedExif["fields"]): ImageDimensions | null {
  const width = fields.find(({ name }) => name === "ImageWidth")?.value;
  const height = fields.find(({ name }) => name === "ImageLength")?.value;
  if (typeof width !== "number" || typeof height !== "number") return null;
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0) return null;
  return { width, height };
}

function decodeUtf8(bytes: Uint8Array): string | null {
  try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { return null; }
}

function appendWarnings(destination: MetadataWarning[], source: readonly MetadataWarning[], limits: SecurityLimits): void {
  for (const item of source) {
    if (destination.length >= limits.maxWarnings) break;
    destination.push(item);
  }
}

/** Parse a standalone classic TIFF through the bounded EXIF/IFD decoder. */
export function parseTiffMetadata(bytes: Uint8Array, limits: SecurityLimits): MetadataResult {
  const littleEndian = bytes[0] === 0x49 && bytes[1] === 0x49;
  const bigTiffMagic = littleEndian
    ? bytes.length >= 4 && bytes[2] === 0x2b && bytes[3] === 0x00
    : bytes.length >= 4 && bytes[2] === 0x00 && bytes[3] === 0x2b;
  if (bigTiffMagic) {
    return {
      format: "tiff",
      mimeType: "image/tiff",
      dimensions: null,
      fields: [],
      exif: null,
      xmp: null,
      iptc: null,
      icc: null,
      jfif: null,
      pngText: [],
      warnings: [
        {
          code: "UNSUPPORTED_FORMAT",
          message: "BigTIFF metadata parsing is not implemented; only classic TIFF IFDs are supported.",
          severity: "warning",
        },
      ],
    };
  }

  const parsed = parseTiff(bytes, limits);
  const sourceFields = parsed.exif?.fields ?? [];
  const warnings = [...parsed.warnings];
  const xmpField = sourceFields.find(({ tag, raw }) => tag === 700 && raw instanceof Uint8Array);
  const xmpBytes = xmpField?.raw instanceof Uint8Array ? xmpField.raw : null;
  const xmpText = xmpBytes !== null && xmpBytes.length <= limits.maxStringBytes ? decodeUtf8(xmpBytes) : null;
  if (xmpBytes !== null && xmpText === null && warnings.length < limits.maxWarnings) {
    warnings.push({ code: "INVALID_VALUE", message: "TIFF XMP tag is not valid UTF-8 or exceeds the configured string limit.", severity: "warning", tag: 700 });
  }
  const iccField = sourceFields.find(({ tag, raw }) => tag === 34675 && raw instanceof Uint8Array);
  const iptcField = sourceFields.find(({ tag, raw }) => tag === 33723 && raw instanceof Uint8Array);
  let icc: MetadataResult["icc"] = null;
  let iptc: MetadataResult["iptc"] = null;
  const fields = [...parsed.fields];
  if (iccField?.raw instanceof Uint8Array) {
    const chunk: IccChunk = { sequence: 1, total: 1, byteLength: iccField.raw.length, data: iccField.raw.slice() };
    const inspected = inspectIccProfile([chunk], limits);
    icc = inspected.data;
    for (const item of inspected.fields) {
      if (fields.length >= limits.maxIfdEntries) break;
      fields.push(item);
    }
    appendWarnings(warnings, inspected.warnings, limits);
  }
  if (iptcField?.raw instanceof Uint8Array) {
    const parsedIptc = parseIptcMetadata(iptcField.raw, limits);
    if (parsedIptc.data !== null) {
      iptc = { byteLength: parsedIptc.data.byteLength, ...(parsedIptc.data.characterSet === undefined ? {} : { characterSet: parsedIptc.data.characterSet }), fields: parsedIptc.fields };
      for (const item of parsedIptc.fields) {
        if (fields.length >= limits.maxIfdEntries) break;
        fields.push(item);
      }
    }
    appendWarnings(warnings, parsedIptc.warnings, limits);
  }
  return {
    format: "tiff",
    mimeType: "image/tiff",
    dimensions: tiffDimensions(sourceFields),
    fields,
    exif: parsed.exif,
    xmp: xmpText === null ? null : { packets: [xmpText] },
    iptc,
    icc,
    jfif: null,
    pngText: [],
    warnings,
  };
}
