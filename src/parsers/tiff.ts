import { parseBigTiff, parseExif, type ParsedExif } from "../metadata/exif.js";
import { inspectIccProfile, type IccChunk } from "../metadata/icc.js";
import { parseIptcMetadata } from "../metadata/iptc.js";
import { parsePhotoshopResources } from "../metadata/photoshop.js";
import { inspectMakerNotes, makerNoteFieldsAsMetadataFields } from "../metadata/makernote.js";
import { extractExifThumbnail } from "../metadata/thumbnail.js";
import { wantsGroup, type ResolvedSelection } from "../selection.js";
import { throwIfAborted } from "../security/abort.js";
import { inspectRawTiff, normalizeRawTiffHeader } from "../raw.js";
import type { ExifData, ExifDirectory, ImageDimensions, MakerNotePlugin, MetadataBlock, MetadataField, ParsedMetadataResult, MetadataWarning, SecurityLimits } from "../types.js";
import type { MetadataRegistry } from "../registry.js";

/** True for a classic TIFF header in either byte order. */
export function isTiffHeader(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 4) return false;
  return (
    (bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) ||
    (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a) ||
    (bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x52 && bytes[3] === 0x4f) ||
    (bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x55 && bytes[3] === 0x00)
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

function mapExifOffsets(exif: ExifData, offsetMap?: (offset: number) => number): ExifData {
  if (offsetMap === undefined) return exif;
  const fields = exif.fields.map((field) => mapFieldOffsets(field, offsetMap));
  const ifds: ExifDirectory[] = exif.ifds.map((ifd) => ({
    ...ifd,
    id: ifd.id ?? `${ifd.name}@${ifd.offset}`,
    kind: ifd.kind ?? "unknown",
    parentId: ifd.parentId ?? null,
    depth: ifd.depth ?? 0,
    nextId: ifd.nextId ?? null,
    sharedOffset: ifd.sharedOffset ?? false,
    associatedImage: ifd.associatedImage ?? null,
    offset: offsetMap(ifd.offset),
  }));
  const byId = new Map(ifds.map((ifd) => [ifd.id, ifd]));
  const topology = exif.topology === undefined ? undefined : {
    directories: exif.topology.directories.map((ifd) => byId.get(ifd.id) ?? { ...ifd, offset: offsetMap(ifd.offset) }),
    relations: exif.topology.relations,
  };
  const associatedImages = exif.associatedImages?.map((image) => ({
    ...image,
    offset: image.offset === null ? null : offsetMap(image.offset),
  }));
  return { ...exif, fields, ifds, ...(topology === undefined ? {} : { topology }), ...(associatedImages === undefined ? {} : { associatedImages }) };
}

function mapFieldOffsets(field: MetadataField, offsetMap?: (offset: number) => number): MetadataField {
  if (offsetMap === undefined || field.source === undefined) return field;
  return {
    ...field,
    source: {
      ...field.source,
      ...(field.source.entryOffset === null ? {} : { entryOffset: offsetMap(field.source.entryOffset) }),
      ...(field.source.valueOffset === null ? {} : { valueOffset: offsetMap(field.source.valueOffset) }),
    },
  };
}

/** Parse a standalone classic TIFF through the bounded EXIF/IFD decoder. */
function tiffSelectionTags(selection: ResolvedSelection | undefined): ReadonlySet<string> | null | undefined {
  if (selection === undefined || selection.groups === null) {
    if (selection?.tags === null || selection?.tags === undefined) return selection?.tags;
    const tags = new Set(selection.tags);
    for (const tag of ["Make", "Model", "DNGVersion", "ImageWidth", "ImageLength", "Compression", "PhotometricInterpretation", "StripOffsets", "StripByteCounts", "JPEGInterchangeFormat", "JPEGInterchangeFormatLength", "SubIFDs", "TileOffsets", "TileByteCounts", "MakerNote"]) tags.add(tag);
    return tags;
  }
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
    if (wantsGroup(selection, "Photoshop")) tags.add("IFD0:0x8649");
    if (wantsGroup(selection, "MakerNote")) { tags.add("ExifIFD:0x927c"); tags.add("IFD0:0x927c"); tags.add("IFD0:0x002e"); }
    for (const tag of ["Make", "Model", "DNGVersion", "ImageWidth", "ImageLength", "Compression", "PhotometricInterpretation", "StripOffsets", "StripByteCounts", "JPEGInterchangeFormat", "JPEGInterchangeFormatLength", "SubIFDs", "TileOffsets", "TileByteCounts", "MakerNote"]) tags.add(tag);
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
  if (wantsGroup(selection, "Photoshop")) tags.add("IFD0:0x8649");
  if (wantsGroup(selection, "MakerNote")) { tags.add("MakerNote"); tags.add("ExifIFD:0x927c"); tags.add("IFD0:0x927c"); tags.add("IFD0:0x002e"); }
  for (const tag of ["Make", "Model", "DNGVersion", "ImageWidth", "ImageLength", "Compression", "PhotometricInterpretation", "StripOffsets", "StripByteCounts", "JPEGInterchangeFormat", "JPEGInterchangeFormatLength", "SubIFDs", "TileOffsets", "TileByteCounts", "MakerNote"]) tags.add(tag);
  return tags;
}

export function parseTiffMetadata(bytes: Uint8Array, limits: SecurityLimits, selection?: ResolvedSelection, extractThumbnail = true, signal?: AbortSignal, registry?: MetadataRegistry, offsetMap?: (offset: number) => number, sourceLength = bytes.length, makerNotePlugins?: readonly MakerNotePlugin[]): ParsedMetadataResult {
  throwIfAborted(signal);
  const normalizedBytes = normalizeRawTiffHeader(bytes);
  const littleEndian = normalizedBytes[0] === 0x49 && normalizedBytes[1] === 0x49;
  const bigTiffMagic = littleEndian
    ? normalizedBytes.length >= 4 && normalizedBytes[2] === 0x2b && normalizedBytes[3] === 0x00
    : normalizedBytes.length >= 4 && normalizedBytes[2] === 0x00 && normalizedBytes[3] === 0x2b;
  const includeExif = wantsGroup(selection, "EXIF");
  const includeXmp = wantsGroup(selection, "XMP");
  const includeIptc = wantsGroup(selection, "IPTC");
  const includeIcc = wantsGroup(selection, "ICC");
  const includePhotoshop = wantsGroup(selection, "Photoshop");
  const includeMakerNote = wantsGroup(selection, "MakerNote");
  const parsed = bigTiffMagic
    ? parseBigTiff(normalizedBytes, limits, 0, tiffSelectionTags(selection), registry)
    : parseTiff(normalizedBytes, limits, 0, tiffSelectionTags(selection), registry);
  throwIfAborted(signal);
  const raw = inspectRawTiff(bytes, parsed.exif, limits, offsetMap, sourceLength);
  const mappedExif = parsed.exif === null ? null : mapExifOffsets(parsed.exif, offsetMap);
  const exif = !includeExif || mappedExif === null ? null : (() => {
    const thumbnail = extractThumbnail && offsetMap === undefined ? extractExifThumbnail(normalizedBytes, mappedExif, limits) : null;
    return thumbnail === null ? mappedExif : { ...mappedExif, thumbnail };
  })();
  const sourceFields = mappedExif?.fields ?? [];
  const warnings = parsed.warnings.map((warning) => warning.offset === undefined || offsetMap === undefined ? warning : { ...warning, offset: offsetMap(warning.offset) });
  const xmpField = includeXmp ? sourceFields.find(({ tag, raw }) => tag === 700 && raw instanceof Uint8Array) : undefined;
  const xmpBytes = xmpField?.raw instanceof Uint8Array ? xmpField.raw : null;
  const xmpText = xmpBytes !== null && xmpBytes.length <= limits.maxStringBytes ? decodeUtf8(xmpBytes) : null;
  if (xmpBytes !== null && xmpText === null && warnings.length < limits.maxWarnings) {
    warnings.push({ code: "INVALID_VALUE", message: "TIFF XMP tag is not valid UTF-8 or exceeds the configured string limit.", severity: "warning", tag: 700 });
  }
  const iccField = includeIcc ? sourceFields.find(({ tag, raw }) => tag === 34675 && raw instanceof Uint8Array) : undefined;
  const iptcField = includeIptc ? sourceFields.find(({ tag, raw }) => tag === 33723 && raw instanceof Uint8Array) : undefined;
  const photoshopField = includePhotoshop ? sourceFields.find(({ tag, raw }) => tag === 34377 && raw instanceof Uint8Array) : undefined;
  let icc: ParsedMetadataResult["icc"] = null;
  let iccMalformed = false;
  let iptc: ParsedMetadataResult["iptc"] = null;
  const entryBytes = bigTiffMagic ? 20 : 12;
  const directoryPrefixBytes = bigTiffMagic ? 8 : 2;
  const nextOffsetBytes = bigTiffMagic ? 8 : 4;
  const blocks: MetadataBlock[] = (mappedExif?.ifds ?? []).map((ifd) => {
    const length = directoryPrefixBytes + ifd.entryCount * entryBytes + nextOffsetBytes;
    const complete = Number.isSafeInteger(length) && (offsetMap !== undefined || (ifd.offset <= bytes.length && length <= bytes.length - ifd.offset));
    return {
      id: `tiff:IFD:${ifd.offset}`,
      family: "EXIF",
      container: `TIFF ${ifd.name} directory`,
      status: complete ? "decoded" : "partial",
      offset: ifd.offset,
      length: complete ? length : Math.max(0, bytes.length - ifd.offset),
      associatedImage: ifd.associatedImage ?? (ifd.name === "IFD1" ? "thumbnail" : "primary"),
      sensitivity: "moderate",
      warningCodes: complete ? [] : ["TRUNCATED_DATA"],
      ...(ifd.id === undefined ? {} : { directoryId: ifd.id }),
      ...(ifd.kind === undefined ? {} : { role: ifd.kind }),
    };
  });
  const blockForIfd = new Map((mappedExif?.ifds ?? []).map((ifd) => [ifd.name, `tiff:IFD:${ifd.offset}`]));
  const directoryBlock = new Map((mappedExif?.ifds ?? []).map((ifd) => [ifd.id ?? `${ifd.name}@${ifd.offset}`, `tiff:IFD:${ifd.offset}`]));
  if (mappedExif?.topology !== undefined) {
    for (const relation of mappedExif.topology.relations) {
      const source = directoryBlock.get(relation.fromDirectoryId);
      const target = directoryBlock.get(relation.toDirectoryId);
      if (source === undefined || target === undefined) continue;
      const block = blocks.find((candidate) => candidate.id === source);
      if (block === undefined) continue;
      const relationships = block.relationships === undefined ? [] : [...block.relationships];
      relationships.push({ type: relation.type, sourceBlockId: source, targetBlockId: target, ...(relation.tag === undefined ? {} : { tag: relation.tag }) });
      const related = block.relatedBlockIds === undefined ? [] : [...block.relatedBlockIds];
      if (!related.includes(target)) related.push(target);
      const index = blocks.indexOf(block);
      blocks[index] = { ...block, relatedBlockIds: related, relationships };
    }
  }
  for (const field of sourceFields) {
    const family = field.tag === 700 ? "XMP" : field.tag === 33723 ? "IPTC" : field.tag === 34675 ? "ICC" : field.tag === 34377 ? "Photoshop" : null;
    if (family === null || field.source?.entryOffset === null || field.source?.entryOffset === undefined) continue;
    const selected = family === "XMP" ? includeXmp : family === "IPTC" ? includeIptc : family === "ICC" ? includeIcc : includePhotoshop;
    blocks.push({
      id: `tiff:tag:${field.source.entryOffset}`,
      family,
      container: `TIFF tag ${field.tag}`,
      status: selected ? "decoded" : "skipped",
      offset: field.source.entryOffset,
      length: field.source.entryLength,
      associatedImage: "primary",
      sensitivity: family === "ICC" ? "low" : family === "Photoshop" ? "high" : "moderate",
      warningCodes: [],
    });
  }
  const fields = parsed.fields.map((sourceField) => {
    const field = mapFieldOffsets(sourceField, offsetMap);
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
  let photoshop: NonNullable<ParsedMetadataResult["photoshop"]> | null = null;
  if (photoshopField?.raw instanceof Uint8Array && photoshopField.source?.valueOffset !== null && photoshopField.source?.valueOffset !== undefined) {
    const blockId = `tiff:tag:${photoshopField.source.entryOffset ?? photoshopField.source.valueOffset}:photoshop`;
    const sourceLength = photoshopField.source.valueLength ?? photoshopField.raw.length;
    const inventory = parsePhotoshopResources(photoshopField.raw, limits, { container: "tiff", blockId, sourceOffset: photoshopField.source.valueOffset, sourceLength });
    if (inventory !== null) {
      photoshop = inventory;
      const parentIndex = blocks.findIndex((block) => block.id === `tiff:tag:${photoshopField.source?.entryOffset ?? 0}`);
      if (parentIndex >= 0) blocks[parentIndex] = { ...(blocks[parentIndex] as MetadataBlock), id: blockId, container: "TIFF tag 34377 Photoshop image resources", family: "Photoshop", sensitivity: "high", status: inventory.complete ? "decoded" : inventory.resources.some((resource) => resource.status === "malformed") ? "malformed" : "partial" };
      else blocks.push({ id: blockId, family: "Photoshop", container: "TIFF tag 34377 Photoshop image resources", status: inventory.complete ? "decoded" : "partial", offset: photoshopField.source.valueOffset, length: sourceLength, associatedImage: "primary", sensitivity: "high", warningCodes: [] });
      for (const resource of inventory.resources) {
        const status: MetadataBlock["status"] = resource.status === "decoded" ? "decoded" : resource.status === "unknown" ? "opaque" : resource.status === "limited" ? "partial" : "malformed";
        blocks.push({ id: `${resource.id}:block`, family: "Photoshop", container: `TIFF tag 34377 Photoshop resource 0x${resource.resourceId.toString(16).padStart(4, "0")}`, status, offset: resource.offset, length: resource.length, associatedImage: resource.kind === "thumbnail" ? "thumbnail" : "primary", sensitivity: resource.kind === "unknown" || resource.kind === "thumbnail" ? "high" : "moderate", warningCodes: inventory.diagnostics.filter((item) => item.offset >= resource.offset && item.offset < resource.offset + resource.length).map((item) => item.code === "MALFORMED_PHOTOSHOP" ? "MALFORMED_PHOTOSHOP" : item.code), parentBlockId: blockId });
      }
      for (const item of inventory.diagnostics) {
        warnings.push({ code: item.code, message: item.message, severity: item.code === "INVALID_VALUE" ? "warning" : "error", offset: item.offset, ...(item.length === undefined ? {} : { length: item.length }) });
      }
    }
  }
  let makerNotes: NonNullable<ParsedMetadataResult["makerNotes"]> | null = null;
  if (includeMakerNote && mappedExif !== null) {
    const tiffOffset = offsetMap?.(0) ?? 0;
    const makerInputs = mappedExif.fields.flatMap((field, index) => {
      const isMakerNoteTag = field.tag === 0x927c || (field.tag === 0x002e && field.type === "UNDEFINED");
      if (!isMakerNoteTag || !(field.raw instanceof Uint8Array) || field.source?.valueOffset === null || field.source?.valueOffset === undefined) return [];
      const noteOffset = field.source.valueOffset;
      const parentBlockId = `tiff:IFD:${mappedExif.ifds.find((ifd) => ifd.id === field.directoryId)?.offset ?? 0}`;
      const blockId = `${parentBlockId}:makernote:${index}`;
      return [{ id: blockId, fieldId: field.id, raw: field.raw, noteOffset, sourceLength, tiffOffset, fileOffset: noteOffset, blockId }];
    });
    if (makerInputs.length > 0) {
      makerNotes = inspectMakerNotes(makerInputs, limits, { ...(makerNotePlugins === undefined ? {} : { plugins: makerNotePlugins }), ...(signal === undefined ? {} : { signal }) });
      fields.push(...makerNoteFieldsAsMetadataFields(makerNotes));
      for (const note of makerNotes.notes) {
        const status: MetadataBlock["status"] = note.status === "detected-decoded" ? "decoded" : note.status === "malformed" || note.status === "rejected" ? "malformed" : note.status === "unknown" || note.status === "low-confidence" || note.status === "detected-opaque" || note.status === "encrypted" || note.status === "obfuscated" || note.status === "unsupported" ? "opaque" : "partial";
        blocks.push({ id: note.provenance.blockId, family: "MakerNote", container: `TIFF MakerNote ${note.plugin?.vendor ?? "unknown"}`, status, offset: note.provenance.noteOffset, length: note.byteLength, associatedImage: "primary", sensitivity: "high", warningCodes: [], parentBlockId: note.provenance.blockId.slice(0, note.provenance.blockId.lastIndexOf(":makernote:")) });
      }
      for (const item of makerNotes.diagnostics) warnings.push({ code: item.code === "LIMIT_EXCEEDED" ? "LIMIT_EXCEEDED" : item.code === "MALFORMED_NOTE" || item.code === "PLUGIN_REJECTED" || item.code === "PLUGIN_THROWN" ? "MALFORMED_EXIF" : "UNSUPPORTED_STRUCTURE", message: item.message, severity: item.code === "UNKNOWN_NOTE" || item.code === "LOW_CONFIDENCE" ? "warning" : "error", ...(item.originalFileOffset === null || item.originalFileOffset === undefined ? {} : { offset: item.originalFileOffset }), ...(item.length === undefined ? {} : { length: item.length }) });
    }
  }
  return {
    format: "tiff",
    mimeType: "image/tiff",
    container: raw?.container ?? (bigTiffMagic ? "bigtiff" : "tiff"),
    fileKind: raw?.kind ?? (bigTiffMagic ? "bigtiff" : "tiff"),
    raw,
    dimensions: raw?.rawPayloads.find(({ dimensions }) => dimensions !== null)?.dimensions ?? tiffDimensions(sourceFields),
    fields,
    exif,
    xmp: xmpText === null ? null : { packets: [xmpText] },
    iptc,
    icc,
    jfif: null,
    photoshop,
    makerNotes,
    pngText: [],
    blocks: blocks.map((block) => block.family === "ICC" && iccMalformed ? { ...block, status: "malformed" as const } : block),
    warnings,
  };
}
