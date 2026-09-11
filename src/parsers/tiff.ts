import { parseBigTiff, parseExif, type ParsedExif } from "../metadata/exif.js";
import { inspectIccProfile, type IccChunk } from "../metadata/icc.js";
import { parseIptcMetadata } from "../metadata/iptc.js";
import { extractExifThumbnail } from "../metadata/thumbnail.js";
import { wantsGroup, type ResolvedSelection } from "../selection.js";
import { throwIfAborted } from "../security/abort.js";
import type { ImageDimensions, MetadataBlock, ParsedMetadataResult, MetadataWarning, SecurityLimits } from "../types.js";
import type { MetadataRegistry } from "../registry.js";

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
  selectedTags?: ReadonlySet<string> | null,
  registry?: MetadataRegistry,
): ParsedExif {
  return parseExif(bytes, limits, warningBaseOffset, selectedTags, registry);
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
function tiffSelectionTags(selection: ResolvedSelection | undefined): ReadonlySet<string> | null | undefined {
  if (selection === undefined || selection.groups === null) return selection?.tags;
  if (wantsGroup(selection, "EXIF")) {
    if (selection.tags === null) return null;
    const tags = new Set(selection.tags);
    if (wantsGroup(selection, "Dimensions")) {
      tags.add("ImageWidth");
      tags.add("ImageLength");
    }
    if (wantsGroup(selection, "XMP")) tags.add("IFD0:0x02bc");
    if (wantsGroup(selection, "IPTC")) tags.add("IFD0:0x83bb");
    if (wantsGroup(selection, "ICC")) tags.add("IFD0:0x8773");
    return tags;
  }

  const tags = new Set<string>();
  if (wantsGroup(selection, "Dimensions")) {
    tags.add("ImageWidth");
    tags.add("ImageLength");
  }
  if (wantsGroup(selection, "XMP")) tags.add("IFD0:0x02bc");
  if (wantsGroup(selection, "IPTC")) tags.add("IFD0:0x83bb");
  if (wantsGroup(selection, "ICC")) tags.add("IFD0:0x8773");
  return tags;
}

export function parseTiffMetadata(bytes: Uint8Array, limits: SecurityLimits, selection?: ResolvedSelection, extractThumbnail = true, signal?: AbortSignal, registry?: MetadataRegistry): ParsedMetadataResult {
  throwIfAborted(signal);
  const littleEndian = bytes[0] === 0x49 && bytes[1] === 0x49;
  const bigTiffMagic = littleEndian
    ? bytes.length >= 4 && bytes[2] === 0x2b && bytes[3] === 0x00
    : bytes.length >= 4 && bytes[2] === 0x00 && bytes[3] === 0x2b;
  const includeExif = wantsGroup(selection, "EXIF");
  const includeXmp = wantsGroup(selection, "XMP");
  const includeIptc = wantsGroup(selection, "IPTC");
  const includeIcc = wantsGroup(selection, "ICC");
  const parsed = bigTiffMagic
    ? parseBigTiff(bytes, limits, 0, tiffSelectionTags(selection), registry)
    : parseTiff(bytes, limits, 0, tiffSelectionTags(selection), registry);
  throwIfAborted(signal);
  const exif = !includeExif || parsed.exif === null ? null : (() => {
    const thumbnail = extractThumbnail ? extractExifThumbnail(bytes, parsed.exif, limits) : null;
    return thumbnail === null ? parsed.exif : { ...parsed.exif, thumbnail };
  })();
  const sourceFields = parsed.exif?.fields ?? [];
  const warnings = [...parsed.warnings];
  const xmpField = includeXmp ? sourceFields.find(({ tag, raw }) => tag === 700 && raw instanceof Uint8Array) : undefined;
  const xmpBytes = xmpField?.raw instanceof Uint8Array ? xmpField.raw : null;
  const xmpText = xmpBytes !== null && xmpBytes.length <= limits.maxStringBytes ? decodeUtf8(xmpBytes) : null;
  if (xmpBytes !== null && xmpText === null && warnings.length < limits.maxWarnings) {
    warnings.push({ code: "INVALID_VALUE", message: "TIFF XMP tag is not valid UTF-8 or exceeds the configured string limit.", severity: "warning", tag: 700 });
  }
  const iccField = includeIcc ? sourceFields.find(({ tag, raw }) => tag === 34675 && raw instanceof Uint8Array) : undefined;
  const iptcField = includeIptc ? sourceFields.find(({ tag, raw }) => tag === 33723 && raw instanceof Uint8Array) : undefined;
  let icc: ParsedMetadataResult["icc"] = null;
  let iccMalformed = false;
  let iptc: ParsedMetadataResult["iptc"] = null;
  const entryBytes = bigTiffMagic ? 20 : 12;
  const directoryPrefixBytes = bigTiffMagic ? 8 : 2;
  const nextOffsetBytes = bigTiffMagic ? 8 : 4;
  const blocks: MetadataBlock[] = (parsed.exif?.ifds ?? []).map((ifd) => {
    const length = directoryPrefixBytes + ifd.entryCount * entryBytes + nextOffsetBytes;
    const complete = Number.isSafeInteger(length) && ifd.offset <= bytes.length && length <= bytes.length - ifd.offset;
    return {
      id: `tiff:IFD:${ifd.offset}`,
      family: "EXIF",
      container: `TIFF ${ifd.name} directory`,
      status: complete ? "decoded" : "partial",
      offset: ifd.offset,
      length: complete ? length : Math.max(0, bytes.length - ifd.offset),
      associatedImage: ifd.name === "IFD1" ? "thumbnail" : "primary",
      sensitivity: "moderate",
      warningCodes: complete ? [] : ["TRUNCATED_DATA"],
    };
  });
  const blockForIfd = new Map((parsed.exif?.ifds ?? []).map((ifd) => [ifd.name, `tiff:IFD:${ifd.offset}`]));
  for (const field of sourceFields) {
    const family = field.tag === 700 ? "XMP" : field.tag === 33723 ? "IPTC" : field.tag === 34675 ? "ICC" : null;
    if (family === null || field.source?.entryOffset === null || field.source?.entryOffset === undefined) continue;
    const selected = family === "XMP" ? includeXmp : family === "IPTC" ? includeIptc : includeIcc;
    blocks.push({
      id: `tiff:tag:${field.source.entryOffset}`,
      family,
      container: `TIFF tag ${field.tag}`,
      status: selected ? "decoded" : "skipped",
      offset: field.source.entryOffset,
      length: field.source.entryLength,
      associatedImage: "primary",
      sensitivity: family === "ICC" ? "low" : "moderate",
      warningCodes: [],
    });
  }
  const fields = parsed.fields.map((field) => {
    const blockId = blockForIfd.get(field.ifd);
    return blockId === undefined || field.source === undefined ? field : { ...field, source: { ...field.source, blockId } };
  });
  if (iccField?.raw instanceof Uint8Array) {
    const chunk: IccChunk = { sequence: 1, total: 1, byteLength: iccField.raw.length, data: iccField.raw.slice() };
    const inspected = inspectIccProfile([chunk], limits);
    icc = inspected.data;
    for (const item of inspected.fields) {
      if (fields.length >= limits.maxIfdEntries) break;
      fields.push(item);
    }
    appendWarnings(warnings, inspected.warnings, limits);
    iccMalformed = inspected.warnings.length > 0;
  }
  if (iptcField?.raw instanceof Uint8Array) {
    const parsedIptc = parseIptcMetadata(iptcField.raw, limits);
    if (parsedIptc.data !== null) {
      iptc = { byteLength: parsedIptc.data.byteLength, ...(parsedIptc.data.characterSet === undefined ? {} : { characterSet: parsedIptc.data.characterSet }), fields: parsedIptc.fields };
      for (const item of parsedIptc.fields) {
        if (fields.length >= limits.maxIfdEntries) break;
        fields.push({ ...item, source: { blockId: `tiff:tag:${iptcField.source?.entryOffset ?? 0}`, entryOffset: iptcField.source?.entryOffset ?? null, entryLength: iptcField.source?.entryLength ?? null, valueOffset: null, valueLength: null } });
      }
    }
    appendWarnings(warnings, parsedIptc.warnings, limits);
  }
  return {
    format: "tiff",
    mimeType: "image/tiff",
    dimensions: tiffDimensions(sourceFields),
    fields,
    exif,
    xmp: xmpText === null ? null : { packets: [xmpText] },
    iptc,
    icc,
    jfif: null,
    pngText: [],
    blocks: blocks.map((block) => block.family === "ICC" && iccMalformed ? { ...block, status: "malformed" as const } : block),
    warnings,
  };
}
