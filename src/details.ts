import type {
  ImageDetailCandidate,
  ImageDetails,
  ImageDimensions,
  ImageTransform,
  MetadataField,
  MetadataResult,
  MetadataWarning,
  ParsedMetadataResult,
  SecurityLimits,
} from "./types.js";

type Candidate<T> = ImageDetailCandidate<T>;
type Support = ImageDetails["support"];

const EMPTY_SUPPORT: Support = {
  storedDimensions: "conditional",
  displayDimensions: "conditional",
  bitDepth: "conditional",
  components: "conditional",
  colorModel: "conditional",
  alpha: "conditional",
  progressive: "conditional",
  interlaced: "conditional",
  animation: "conditional",
  relationships: "conditional",
};

function candidate<T>(value: T | null, source: string, offset: number | null = null, blockId: string | null = null, validation: Candidate<T>["validation"] = "valid", derivation?: string): Candidate<T> {
  return { value, source, offset, blockId, validation, ...(derivation === undefined ? {} : { derivation }) };
}
function be16(bytes: Uint8Array, offset: number): number { return ((bytes[offset] ?? 0) << 8) | (bytes[offset + 1] ?? 0); }
function be32(bytes: Uint8Array, offset: number): number { return (bytes[offset] ?? 0) * 0x1000000 + ((bytes[offset + 1] ?? 0) << 16) + ((bytes[offset + 2] ?? 0) << 8) + (bytes[offset + 3] ?? 0); }
function le16(bytes: Uint8Array, offset: number): number { return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8); }
function le24(bytes: Uint8Array, offset: number): number { return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8) | ((bytes[offset + 2] ?? 0) << 16); }
function le32(bytes: Uint8Array, offset: number): number { return (bytes[offset] ?? 0) + (bytes[offset + 1] ?? 0) * 0x100 + (bytes[offset + 2] ?? 0) * 0x10000 + (bytes[offset + 3] ?? 0) * 0x1000000; }
function ascii(bytes: Uint8Array, offset: number, text: string): boolean { return offset >= 0 && offset <= bytes.length - text.length && Array.from(text).every((char, index) => bytes[offset + index] === char.charCodeAt(0)); }
function dimensions(width: number, height: number): ImageDimensions | null { return Number.isSafeInteger(width) && Number.isSafeInteger(height) && width > 0 && height > 0 ? { width, height } : null; }

interface Facts {
  storedDimensions: Candidate<ImageDimensions>[];
  displayDimensions: Candidate<ImageDimensions>[];
  orientation: Candidate<ImageTransform>[];
  bitDepth: Candidate<number | readonly number[]>[];
  components: Candidate<readonly string[]>[];
  colorModel: Candidate<string>[];
  alpha: Candidate<"present" | "absent">[];
  progressive: Candidate<boolean>[];
  interlaced: Candidate<boolean>[];
  animation: Candidate<{ readonly frames: number | null; readonly loopCount: number | null }>[];
  primaryImage: Candidate<string>[];
  relationships: Candidate<{ readonly id: string; readonly role: string | null }>[];
  formatSpecific: Record<string, unknown>;
  diagnostics: MetadataWarning[];
}
function facts(): Facts { return { storedDimensions: [], displayDimensions: [], orientation: [], bitDepth: [], components: [], colorModel: [], alpha: [], progressive: [], interlaced: [], animation: [], primaryImage: [], relationships: [], formatSpecific: {}, diagnostics: [] }; }

function jpegFacts(bytes: Uint8Array, limits: SecurityLimits): Facts {
  const output = facts();
  if (!ascii(bytes, 0, "\xff\xd8")) { output.diagnostics.push({ code: "MALFORMED_JPEG", message: "JPEG header is missing the SOI marker.", severity: "error", offset: 0 }); return output; }
  let cursor = 2; let segments = 0; const frames: Array<Record<string, unknown>> = [];
  while (cursor <= bytes.length - 2 && segments++ < limits.maxSegments) {
    if (bytes[cursor] !== 0xff) { cursor += 1; continue; }
    while (cursor < bytes.length && bytes[cursor] === 0xff) cursor += 1;
    if (cursor >= bytes.length) break;
    const marker = bytes[cursor++] ?? 0;
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (cursor > bytes.length - 2) { output.diagnostics.push({ code: "TRUNCATED_DATA", message: "JPEG marker length is truncated.", severity: "error", offset: cursor }); break; }
    const length = be16(bytes, cursor);
    if (length < 2 || cursor + length > bytes.length) { output.diagnostics.push({ code: "TRUNCATED_DATA", message: "JPEG marker segment extends beyond the bounded header.", severity: "error", offset: cursor, length }); break; }
    const sof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (sof && length >= 8) {
      const precision = bytes[cursor + 2] ?? 0; const height = be16(bytes, cursor + 3); const width = be16(bytes, cursor + 5); const count = bytes[cursor + 7] ?? 0; const expected = 8 + count * 3;
      if (precision < 1 || count < 1 || count > 4 || expected > length || width < 1 || height < 1) output.diagnostics.push({ code: "MALFORMED_JPEG", message: "JPEG start-of-frame header has invalid dimensions, precision, component count, or length.", severity: "error", offset: cursor });
      else {
        const source = `JPEG SOF${marker.toString(16).toUpperCase()}`; const frameComponents = Array.from({ length: count }, (_, index) => String(bytes[cursor + 8 + index * 3] ?? index));
        const sampling = Array.from({ length: count }, (_, index) => bytes[cursor + 9 + index * 3] ?? 0).map((value) => ({ horizontal: value >> 4, vertical: value & 0x0f }));
        output.storedDimensions.push(candidate({ width, height }, source, cursor + 3, null, "valid", "Validated SOF dimensions and component table."));
        output.bitDepth.push(candidate(precision, source, cursor + 2, null, "valid", "SOF sample precision."));
        output.components.push(candidate(frameComponents, source, cursor + 7, null, "valid", "SOF component identifiers in source order."));
        output.colorModel.push(candidate(count === 1 ? "grayscale" : count === 3 ? "YCbCr/RGB-unspecified" : count === 4 ? "CMYK/YCCK-unspecified" : "unknown", source, cursor, null, "valid", "JPEG SOF does not identify a rendered colour space."));
        output.alpha.push(candidate("absent", "JPEG frame syntax", cursor, null, "valid", "JPEG frame syntax has no alpha component."));
        const progressive = [0xc2, 0xc6, 0xca, 0xce].includes(marker);
        output.progressive.push(candidate(progressive, source, cursor, null, "valid", progressive ? "Progressive SOF marker." : "Sequential SOF marker."));
        output.interlaced.push(candidate(false, "JPEG frame syntax", cursor, null, "valid", "JPEG is not an interlaced container."));
        frames.push({ marker, width, height, precision, components: frameComponents, sampling });
      }
    }
    cursor += length;
  }
  if (segments >= limits.maxSegments) output.diagnostics.push({ code: "LIMIT_EXCEEDED", message: "JPEG header marker count exceeded the configured limit.", severity: "warning", offset: cursor });
  output.formatSpecific = { coding: frames.map((frame) => frame.marker), frames };
  return output;
}

function pngFacts(bytes: Uint8Array, limits: SecurityLimits): Facts {
  const output = facts(); const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  if (bytes.length < 33 || !signature.every((value, index) => bytes[index] === value)) { output.diagnostics.push({ code: "MALFORMED_PNG", message: "PNG signature or IHDR header is truncated.", severity: "error", offset: 0 }); return output; }
  let cursor = 8; let chunks = 0; let sawIend = false; let colorType = -1; let alphaByTransparency = false; let declaredFrames: number | null = null; let declaredLoops: number | null = null; let actualFrames = 0; const frameOffsets: number[] = [];
  while (cursor <= bytes.length - 12 && chunks++ < limits.maxPngChunks) {
    const length = be32(bytes, cursor); const dataStart = cursor + 8; const dataEnd = dataStart + length; const next = dataEnd + 4;
    if (!Number.isSafeInteger(length) || dataEnd > bytes.length || next > bytes.length) { output.diagnostics.push({ code: "TRUNCATED_DATA", message: "PNG chunk extends beyond the bounded input.", severity: "error", offset: cursor, length }); break; }
    const type = String.fromCharCode(...bytes.subarray(cursor + 4, cursor + 8));
    if (type === "IHDR" && length === 13 && output.storedDimensions.length === 0) {
      const stored = dimensions(be32(bytes, dataStart), be32(bytes, dataStart + 4)); colorType = bytes[dataStart + 9] ?? -1; const depth = bytes[dataStart + 8] ?? 0;
      const channels: Readonly<Record<number, readonly string[]>> = { 0: ["gray"], 2: ["red", "green", "blue"], 3: ["palette-index"], 4: ["gray", "alpha"], 6: ["red", "green", "blue", "alpha"] }; const names = channels[colorType];
      if (stored === null || names === undefined || depth < 1) output.diagnostics.push({ code: "MALFORMED_PNG", message: "PNG IHDR has invalid dimensions, bit depth, or color type.", severity: "error", offset: dataStart });
      else { output.storedDimensions.push(candidate(stored, "PNG IHDR", dataStart, null, "valid", "Validated IHDR width and height.")); output.bitDepth.push(candidate(names.map(() => depth), "PNG IHDR", dataStart + 8, null, "valid", "IHDR bit depth applied to each declared component.")); output.components.push(candidate(names, "PNG IHDR", dataStart + 9, null, "valid", "IHDR color type component model.")); output.colorModel.push(candidate(colorType === 0 || colorType === 4 ? "grayscale" : colorType === 3 ? "indexed" : "RGB", "PNG IHDR", dataStart + 9)); output.interlaced.push(candidate((bytes[dataStart + 12] ?? 0) === 1, "PNG IHDR", dataStart + 12, null, "valid", "IHDR interlace method.")); output.progressive.push(candidate(false, "PNG syntax", dataStart + 12, null, "valid", "PNG has no progressive scan mode.")); }
    } else if (type === "tRNS") alphaByTransparency = true;
    else if (type === "acTL" && length === 8) { declaredFrames = be32(bytes, dataStart); declaredLoops = be32(bytes, dataStart + 4); if (declaredFrames < 1) output.diagnostics.push({ code: "MALFORMED_PNG", message: "APNG acTL declares zero frames.", severity: "error", offset: dataStart }); }
    else if (type === "fcTL" && length >= 26) { actualFrames += 1; if (frameOffsets.length < limits.maxImageDetailFrames) frameOffsets.push(cursor); }
    else if (type === "IEND") { sawIend = true; break; }
    cursor = next;
  }
  if (output.storedDimensions.length > 0) { const alpha = colorType === 4 || colorType === 6 || alphaByTransparency; if (alpha) output.alpha.push(candidate("present", alphaByTransparency ? "PNG tRNS" : "PNG IHDR color type", null, null, "valid", "Validated transparent samples or alpha channel.")); else if (sawIend) output.alpha.push(candidate("absent", "PNG complete color stream", null, null, "valid", "Complete color type has no transparent sample declaration.")); }
  if (declaredFrames !== null) { output.animation.push(candidate({ frames: declaredFrames, loopCount: declaredLoops }, "PNG acTL", null, null, declaredFrames === actualFrames || actualFrames === 0 ? "valid" : "conflicting", "Declared APNG animation control.")); if (actualFrames > 0) output.animation.push(candidate({ frames: actualFrames, loopCount: declaredLoops }, "PNG fcTL sequence", frameOffsets[0] ?? null, null, actualFrames === declaredFrames ? "valid" : "conflicting", "Count of validated frame-control chunks.")); }
  output.formatSpecific = { colorType, declaredFrames, declaredLoops, actualFrames, frameOffsets };
  if (!sawIend) output.diagnostics.push({ code: "TRUNCATED_DATA", message: "PNG header scan did not reach IEND.", severity: "warning", offset: cursor });
  if (chunks >= limits.maxPngChunks) output.diagnostics.push({ code: "LIMIT_EXCEEDED", message: "PNG chunk count exceeded the configured limit.", severity: "warning", offset: cursor });
  return output;
}

function webpFacts(bytes: Uint8Array, limits: SecurityLimits): Facts {
  const output = facts();
  if (bytes.length < 12 || !ascii(bytes, 0, "RIFF") || !ascii(bytes, 8, "WEBP")) { output.diagnostics.push({ code: "MALFORMED_WEBP", message: "WebP RIFF/WEBP signature is missing.", severity: "error", offset: 0 }); return output; }
  const declaredEnd = le32(bytes, 4) + 8; const scanEnd = Math.min(bytes.length, Number.isSafeInteger(declaredEnd) ? declaredEnd : bytes.length); if (!Number.isSafeInteger(declaredEnd) || declaredEnd < 12 || declaredEnd > bytes.length) output.diagnostics.push({ code: "TRUNCATED_DATA", message: "WebP RIFF size is outside the bounded input.", severity: "warning", offset: 4, length: Math.max(0, declaredEnd - bytes.length) }); let cursor = 12; let chunks = 0; let animated = false; let declaredLoop: number | null = null; let declaredCanvas: ImageDimensions | null = null; let frameCount = 0; const frameKinds: string[] = [];
  while (cursor <= scanEnd - 8 && chunks++ < limits.maxSegments) {
    const type = String.fromCharCode(...bytes.subarray(cursor, cursor + 4)); const length = le32(bytes, cursor + 4); const end = cursor + 8 + length;
    if (!Number.isSafeInteger(end) || end > scanEnd) { output.diagnostics.push({ code: "TRUNCATED_DATA", message: "WebP chunk extends beyond the RIFF bounds.", severity: "error", offset: cursor, length }); break; }
    if (type === "VP8X" && length >= 10) { const flags = bytes[cursor + 8] ?? 0; declaredCanvas = dimensions(le24(bytes, cursor + 12) + 1, le24(bytes, cursor + 15) + 1); if (declaredCanvas !== null) output.storedDimensions.push(candidate(declaredCanvas, "WebP VP8X canvas", cursor + 12, null, "valid", "Validated VP8X 24-bit canvas dimensions.")); animated = (flags & 0x02) !== 0; output.alpha.push(candidate((flags & 0x10) !== 0 ? "present" : "absent", "WebP VP8X alpha flag", cursor + 8, null, "valid", "Validated VP8X feature flags.")); output.colorModel.push(candidate((flags & 0x10) !== 0 ? "RGBA" : "RGB", "WebP VP8X", cursor + 8)); output.bitDepth.push(candidate(8, "WebP VP8X syntax", cursor + 8)); }
    else if (type === "VP8L" && length >= 5 && bytes[cursor + 8] === 0x2f) { const b1 = bytes[cursor + 9] ?? 0; const b2 = bytes[cursor + 10] ?? 0; const b3 = bytes[cursor + 11] ?? 0; const b4 = bytes[cursor + 12] ?? 0; const stored = dimensions(1 + b1 + ((b2 & 0x3f) << 8), 1 + (b2 >> 6) + (b3 << 2) + ((b4 & 0x0f) << 10)); if (stored !== null) output.storedDimensions.push(candidate(stored, "WebP VP8L frame header", cursor + 9, null, "valid", "Validated lossless frame dimensions.")); const alpha = (b4 & 0x10) !== 0; output.alpha.push(candidate(alpha ? "present" : "absent", "WebP VP8L alpha bit", cursor + 12)); output.colorModel.push(candidate(alpha ? "RGBA" : "RGB", "WebP VP8L frame", cursor + 8)); output.bitDepth.push(candidate(8, "WebP VP8L syntax", cursor + 8)); frameKinds.push("VP8L"); }
    else if (type === "VP8 " && length >= 10 && bytes[cursor + 11] === 0x9d && bytes[cursor + 12] === 0x01 && bytes[cursor + 13] === 0x2a) { const stored = dimensions(le16(bytes, cursor + 14) & 0x3fff, le16(bytes, cursor + 16) & 0x3fff); if (stored !== null) output.storedDimensions.push(candidate(stored, "WebP VP8 frame header", cursor + 14, null, "valid", "Validated lossy frame dimensions.")); output.alpha.push(candidate("absent", "WebP VP8 lossy syntax", cursor + 8, null, "valid", "VP8 lossy syntax has no alpha plane.")); output.colorModel.push(candidate("YCbCr", "WebP VP8 frame", cursor + 8)); output.bitDepth.push(candidate(8, "WebP VP8 syntax", cursor + 8)); frameKinds.push("VP8"); }
    else if (type === "ANIM" && length >= 6) { animated = true; declaredLoop = le16(bytes, cursor + 12); }
    else if (type === "ANMF" && length >= 16) { frameCount += 1; if (frameCount <= limits.maxImageDetailFrames) frameKinds.push("ANMF"); }
    cursor = end + (length & 1);
  }
  if (animated || frameCount > 0) output.animation.push(candidate({ frames: frameCount > 0 ? frameCount : null, loopCount: declaredLoop }, "WebP animation chunks", null, null, frameCount > 0 || declaredLoop !== null ? "valid" : "unknown", "Validated ANIM/ANMF relationship graph."));
  output.progressive.push(candidate(false, "WebP syntax", null, null, "valid", "WebP bitstreams do not expose progressive scan modes.")); output.interlaced.push(candidate(false, "WebP syntax", null, null, "valid", "WebP bitstreams do not expose interlaced scan modes.")); output.formatSpecific = { canvas: declaredCanvas, animated, declaredLoop, frameCount, frameKinds };
  if (chunks >= limits.maxSegments) output.diagnostics.push({ code: "LIMIT_EXCEEDED", message: "WebP chunk count exceeded the configured limit.", severity: "warning", offset: cursor });
  return output;
}

function gifFacts(bytes: Uint8Array, limits: SecurityLimits): Facts {
  const output = facts();
  if (bytes.length < 13 || !(ascii(bytes, 0, "GIF87a") || ascii(bytes, 0, "GIF89a"))) { output.diagnostics.push({ code: "MALFORMED_GIF", message: "GIF signature or logical screen descriptor is truncated.", severity: "error", offset: 0 }); return output; }
  const stored = dimensions(le16(bytes, 6), le16(bytes, 8)); if (stored !== null) output.storedDimensions.push(candidate(stored, "GIF logical screen descriptor", 6, null, "valid", "Validated logical screen dimensions.")); const packed = bytes[10] ?? 0; const globalDepth = (packed & 7) + 1;
  output.bitDepth.push(candidate(globalDepth, "GIF logical screen descriptor", 10)); output.components.push(candidate(["palette-index"], "GIF image data", 10)); output.colorModel.push(candidate("indexed", "GIF logical screen descriptor", 10)); output.progressive.push(candidate(false, "GIF syntax", null, null, "valid", "GIF has no progressive scan mode."));
  let cursor = 13; let frames = 0; let loopCount: number | null = null; let transparency = false; let interlaced = false; let complete = false; let steps = 0; const frameDetails: Array<Record<string, unknown>> = [];
  const skipSubBlocks = (start: number): number => { let at = start; for (let count = 0; at < bytes.length && count++ < limits.maxSegments; count += 1) { const length = bytes[at++] ?? 0; if (length === 0) return at; if (at > bytes.length - length) return bytes.length; at += length; } return bytes.length; };
  if ((packed & 0x80) !== 0) cursor = Math.min(bytes.length, cursor + 3 * (1 << ((packed & 7) + 1)));
  while (cursor < bytes.length && steps++ < limits.maxSegments) {
    const marker = bytes[cursor++]; if (marker === 0x3b) { complete = true; break; }
    if (marker === 0x21) { if (cursor >= bytes.length) break; const label = bytes[cursor++]; if (label === 0xf9) { if (cursor >= bytes.length) break; const size = bytes[cursor++] ?? 0; if (size < 4 || cursor + size > bytes.length) break; transparency ||= ((bytes[cursor] ?? 0) & 1) !== 0; cursor += size; if (cursor < bytes.length && bytes[cursor] === 0) cursor += 1; } else if (label === 0xff) { if (cursor >= bytes.length) break; const size = bytes[cursor++] ?? 0; const app = bytes.subarray(cursor, Math.min(bytes.length, cursor + size)); const at = cursor + size; if (app.length >= 11 && String.fromCharCode(...app.subarray(0, 11)) === "NETSCAPE2.0" && at + 3 < bytes.length && bytes[at] === 3 && bytes[at + 1] === 1) loopCount = le16(bytes, at + 2); cursor = skipSubBlocks(at); } else cursor = skipSubBlocks(cursor); }
    else if (marker === 0x2c) { if (cursor > bytes.length - 9) break; const descriptor = cursor; const framePacked = bytes[cursor + 8] ?? 0; const localDepth = (framePacked & 7) + 1; interlaced ||= (framePacked & 0x40) !== 0; frames += 1; frameDetails.push({ offset: descriptor, interlaced: (framePacked & 0x40) !== 0, bitDepth: (framePacked & 0x80) !== 0 ? localDepth : globalDepth }); if ((framePacked & 0x80) !== 0) output.bitDepth.push(candidate(localDepth, "GIF local color table", descriptor + 8)); cursor += 9; if (cursor >= bytes.length) break; cursor += 1; cursor = skipSubBlocks(cursor); }
    else break;
  }
  if (transparency) output.alpha.push(candidate("present", "GIF graphic-control transparency flag", null)); else if (complete) output.alpha.push(candidate("absent", "GIF complete image stream", null, null, "valid", "Complete GIF stream contains no transparency extension."));
  if (frames > 0) output.interlaced.push(candidate(interlaced, "GIF image descriptors", null, null, "valid", "Validated image-descriptor interlace flags."));
  if (frames > 0 || loopCount !== null) output.animation.push(candidate({ frames: frames || null, loopCount }, "GIF image descriptors and NETSCAPE loop extension", null, null, "valid", "Validated GIF frame count and loop extension."));
  output.formatSpecific = { globalColorTableDepth: globalDepth, frames: frameDetails, loopCount, complete }; if (steps >= limits.maxSegments) output.diagnostics.push({ code: "LIMIT_EXCEEDED", message: "GIF block count exceeded the configured limit.", severity: "warning", offset: cursor }); return output;
}

function numberValue(value: unknown): number | null { if (typeof value === "number" && Number.isSafeInteger(value)) return value; if (typeof value === "bigint" && value >= BigInt(Number.MIN_SAFE_INTEGER) && value <= BigInt(Number.MAX_SAFE_INTEGER)) return Number(value); return null; }
function transformForOrientation(value: number): ImageTransform { const table: Readonly<Record<number, ImageTransform>> = { 1: { rotation: 0, mirrored: false }, 2: { rotation: 0, mirrored: true, mirrorAxis: "horizontal" }, 3: { rotation: 180, mirrored: false }, 4: { rotation: 0, mirrored: true, mirrorAxis: "vertical" }, 5: { rotation: 270, mirrored: true, mirrorAxis: "horizontal" }, 6: { rotation: 90, mirrored: false }, 7: { rotation: 90, mirrored: true, mirrorAxis: "horizontal" }, 8: { rotation: 270, mirrored: false } }; return table[value] ?? { rotation: 0, mirrored: false }; }
function displayFor(stored: ImageDimensions, transform: ImageTransform): ImageDimensions { return transform.rotation === 90 || transform.rotation === 270 ? { width: stored.height, height: stored.width } : stored; }

function fieldFacts(result: ParsedMetadataResult, limits: SecurityLimits): Facts {
  const output = facts(); const all = [...result.fields, ...(result.exif?.fields ?? [])]; const byDirectory = new Map<string, { widths: MetadataField[]; heights: MetadataField[] }>();
  const sourceOf = (field: MetadataField): { offset: number | null; blockId: string | null; key: string } => ({ offset: field.source?.valueOffset ?? field.source?.entryOffset ?? null, blockId: field.source?.blockId ?? null, key: field.directoryId ?? field.source?.directoryId ?? field.ifd });
  for (const field of all) {
    const source = sourceOf(field);
    if (["ImageWidth", "PixelXDimension", "RelatedImageWidth"].includes(field.name)) { const item = byDirectory.get(source.key) ?? { widths: [], heights: [] }; if (item.widths.length < limits.maxImageDetailCandidates) item.widths.push(field); byDirectory.set(source.key, item); }
    if (["ImageLength", "PixelYDimension", "RelatedImageLength"].includes(field.name)) { const item = byDirectory.get(source.key) ?? { widths: [], heights: [] }; if (item.heights.length < limits.maxImageDetailCandidates) item.heights.push(field); byDirectory.set(source.key, item); }
    if (field.name === "BitsPerSample") { const value = typeof field.value === "number" || Array.isArray(field.value) ? field.value as number | readonly number[] : null; if (value !== null) output.bitDepth.push(candidate(value, field.id, source.offset, source.blockId, "valid", "Validated TIFF BitsPerSample field.")); }
    if (field.name === "SamplesPerPixel") { const value = numberValue(field.value); if (value !== null && value > 0 && value <= limits.maxImageDetailCandidates) output.components.push(candidate(Array.from({ length: value }, (_, index) => `component-${index + 1}`), field.id, source.offset, source.blockId, "valid", "Validated TIFF SamplesPerPixel field.")); }
    if (field.name === "PhotometricInterpretation") output.colorModel.push(candidate(field.display || (typeof field.value === "string" || typeof field.value === "number" ? String(field.value) : field.name), field.id, source.offset, source.blockId, "valid", "Validated TIFF PhotometricInterpretation field."));
    if (field.name === "ExtraSamples") { const values = Array.isArray(field.value) ? field.value : [field.value]; const alpha = values.some((value) => value === 1 || value === 2) ? "present" : values.every((value) => value === 0) ? "absent" : null; if (alpha !== null) output.alpha.push(candidate(alpha, field.id, source.offset, source.blockId, "valid", "Validated TIFF ExtraSamples field.")); }
    if (field.name === "Orientation") { const value = numberValue(field.value); if (value !== null && value >= 1 && value <= 8) output.orientation.push(candidate(transformForOrientation(value), field.id, source.offset, source.blockId, "valid", "Validated EXIF Orientation code.")); else if (value !== null) output.orientation.push(candidate<ImageTransform>(null, field.id, source.offset, source.blockId, "malformed", "EXIF Orientation code is outside 1 through 8.")); }
  }
  for (const [key, item] of byDirectory) for (const widthField of item.widths) for (const heightField of item.heights) { const width = numberValue(widthField.value); const height = numberValue(heightField.value); if (width === null || height === null || output.storedDimensions.length >= limits.maxImageDetailCandidates) continue; const source = sourceOf(widthField); const stored = dimensions(width, height); if (stored !== null) output.storedDimensions.push(candidate(stored, `${key}:ImageWidth/ImageLength`, source.offset, source.blockId, "valid", "Paired validated directory dimension fields.")); }
  if (output.orientation.length === 0 && result.transform !== undefined) output.orientation.push(candidate(result.transform, "container transform", null, null, "valid", "Validated container orientation transform."));
  output.formatSpecific = { fieldSources: all.filter((field) => ["ImageWidth", "ImageLength", "BitsPerSample", "SamplesPerPixel", "PhotometricInterpretation", "ExtraSamples", "Orientation"].includes(field.name)).slice(0, limits.maxImageDetailCandidates).map((field) => ({ id: field.id, name: field.name, directoryId: field.directoryId ?? field.source?.directoryId ?? null, blockId: field.source?.blockId ?? null })) }; return output;
}

function valuesEqual(left: unknown, right: unknown): boolean { try { return JSON.stringify(left) === JSON.stringify(right); } catch { return Object.is(left, right); } }
function markConflicts<T>(items: readonly Candidate<T>[], property: string): { readonly candidates: Candidate<T>[]; readonly conflicts: ImageDetails["conflicts"] } { const distinct: unknown[] = []; for (const item of items) if (!distinct.some((value) => valuesEqual(value, item.value))) distinct.push(item.value); if (distinct.length <= 1) return { candidates: [...items], conflicts: [] }; return { candidates: items.map((item) => ({ ...item, validation: item.validation === "valid" ? "conflicting" as const : item.validation })), conflicts: [{ property, candidates: items.map((_, index) => index), reason: "Validated sources disagree; no candidate was selected." }] }; }
function bounded<T>(items: readonly Candidate<T>[], limit: number): Candidate<T>[] { return items.slice(0, Math.max(0, limit)); }

function blockRelationships(result: ParsedMetadataResult, limits: SecurityLimits): { primary: Candidate<string>[]; relationships: Candidate<{ readonly id: string; readonly role: string | null }>[]; thumbnails: string[]; previews: string[] } {
  const primary: Candidate<string>[] = []; const relationships: Candidate<{ readonly id: string; readonly role: string | null }>[] = []; const thumbnails: string[] = result.exif?.thumbnail === undefined ? [] : ["exif:thumbnail"]; const previews: string[] = [];
  for (const block of result.blocks ?? []) { const id = block.associatedImage; if (block.role === "thumbnail") thumbnails.push(block.id); if (block.role === "preview") previews.push(block.id); if (id === null) continue; if (id === "primary") primary.push(candidate(id, `block:${block.id}`, block.offset, block.id, "valid", "Validated primary-image block relationship.")); else if (!(id.startsWith("item:") && block.role === undefined && ["EXIF", "XMP", "ICC", "Unknown"].includes(block.family))) relationships.push(candidate({ id, role: block.role ?? null }, `block:${block.id}`, block.offset, block.id, "valid", "Validated associated-image block relationship.")); if (primary.length + relationships.length >= limits.maxImageDetailRelationships) break; }
  return { primary: bounded(primary, limits.maxImageDetailCandidates), relationships: bounded(relationships, limits.maxImageDetailRelationships), thumbnails: [...new Set(thumbnails)].slice(0, limits.maxImageDetailRelationships), previews: [...new Set(previews)].slice(0, limits.maxImageDetailRelationships) };
}

function supportFor(format: ParsedMetadataResult["format"]): Support {
  if (format === "jpeg") return { storedDimensions: "supported", displayDimensions: "conditional", bitDepth: "supported", components: "supported", colorModel: "supported", alpha: "supported", progressive: "supported", interlaced: "supported", animation: "unsupported", relationships: "conditional" };
  if (format === "png") return { storedDimensions: "supported", displayDimensions: "conditional", bitDepth: "supported", components: "supported", colorModel: "supported", alpha: "conditional", progressive: "supported", interlaced: "supported", animation: "conditional", relationships: "conditional" };
  if (format === "webp") return { storedDimensions: "conditional", displayDimensions: "conditional", bitDepth: "conditional", components: "conditional", colorModel: "conditional", alpha: "conditional", progressive: "supported", interlaced: "supported", animation: "conditional", relationships: "conditional" };
  if (format === "gif") return { storedDimensions: "supported", displayDimensions: "conditional", bitDepth: "conditional", components: "supported", colorModel: "supported", alpha: "conditional", progressive: "supported", interlaced: "supported", animation: "conditional", relationships: "conditional" };
  if (format === "tiff") return { ...EMPTY_SUPPORT, progressive: "unsupported", interlaced: "unsupported", animation: "unsupported", relationships: "supported" };
  if (format === "heif" || format === "avif") return { ...EMPTY_SUPPORT, progressive: "unsupported", interlaced: "unsupported", animation: "unsupported", relationships: "supported" };
  if (format === "jxl") return { storedDimensions: "conditional", displayDimensions: "conditional", bitDepth: "conditional", components: "conditional", colorModel: "conditional", alpha: "conditional", progressive: "conditional", interlaced: "conditional", animation: "conditional", relationships: "conditional" };
  return EMPTY_SUPPORT;
}

/** Inspect common details directly from bounded container headers without decoding pixels. */
export function deriveImageDetails(result: ParsedMetadataResult, bytes?: Uint8Array, limits?: SecurityLimits, mapOffset?: (offset: number) => number): ImageDetails {
  const effectiveLimits = limits ?? ({ maxSegments: 4096, maxPngChunks: 4096, maxImageDetailCandidates: 4096, maxImageDetailFrames: 4096, maxImageDetailRelationships: 4096, maxWarnings: 256 } as SecurityLimits);
  const raw = bytes === undefined || limits === undefined ? fieldFacts(result, effectiveLimits) : result.format === "jpeg" ? jpegFacts(bytes, effectiveLimits) : result.format === "png" ? pngFacts(bytes, effectiveLimits) : result.format === "webp" ? webpFacts(bytes, effectiveLimits) : result.format === "gif" ? gifFacts(bytes, effectiveLimits) : fieldFacts(result, effectiveLimits);
  if (bytes !== undefined && limits !== undefined && result.format !== "tiff") {
    const fields = fieldFacts(result, effectiveLimits);
    raw.storedDimensions.push(...fields.storedDimensions);
    raw.orientation.push(...fields.orientation);
    raw.bitDepth.push(...fields.bitDepth);
    raw.components.push(...fields.components);
    raw.colorModel.push(...fields.colorModel);
    raw.alpha.push(...fields.alpha);
  }
  const relationships = blockRelationships(result, effectiveLimits); raw.primaryImage.push(...relationships.primary); raw.relationships.push(...relationships.relationships);
  if (result.displayDimensions !== undefined) raw.displayDimensions.push(candidate(result.displayDimensions, "container display dimensions", null, null, "valid", "Validated container transform applied to stored dimensions."));
  if (result.transform !== undefined && raw.orientation.length === 0) raw.orientation.push(candidate(result.transform, "container transform", null, null, "valid", "Validated container orientation transform."));
  if (raw.storedDimensions.length === 0 && result.dimensions !== null) raw.storedDimensions.push(candidate(result.dimensions, `${result.format} parser dimensions`, null, null, "valid", "Validated dimensions supplied by the format parser."));
  if (raw.displayDimensions.length === 0 && raw.storedDimensions.length > 0) {
    if (raw.orientation.length > 0) {
      for (const stored of raw.storedDimensions.slice(0, effectiveLimits.maxImageDetailCandidates)) for (const orientation of raw.orientation.slice(0, effectiveLimits.maxImageDetailCandidates)) {
        if (stored.value === null || orientation.value === null) continue;
        raw.displayDimensions.push(candidate(displayFor(stored.value, orientation.value), `${stored.source}+${orientation.source}`, stored.offset ?? orientation.offset, stored.blockId ?? orientation.blockId, orientation.validation, "Apply the validated orientation transform to stored dimensions."));
      }
    } else if (["jpeg", "png", "webp", "gif"].includes(result.format)) {
      for (const stored of raw.storedDimensions.slice(0, effectiveLimits.maxImageDetailCandidates)) raw.displayDimensions.push(candidate(stored.value, `${stored.source} (display)`, stored.offset, stored.blockId, stored.validation, "No format-level orientation transform was declared; display dimensions equal stored dimensions."));
    }
  }
  if (raw.animation.length === 0) { const frame = result.fields.find((field) => field.name === "FrameCount"); const loop = result.fields.find((field) => field.name === "LoopCount"); const frames = frame === undefined ? null : numberValue(frame.value); const loopCount = loop === undefined ? null : numberValue(loop.value); if (frames !== null || loopCount !== null) raw.animation.push(candidate({ frames, loopCount }, `${result.format} parsed fields`, frame?.source?.valueOffset ?? null, frame?.source?.blockId ?? null, "valid", "Validated parser animation fields.")); }
  if (result.format === "heif" || result.format === "avif") { raw.formatSpecific = { ...raw.formatSpecific, nclx: result.nclx ?? null, primaryBlocks: (result.blocks ?? []).filter((block) => block.associatedImage?.startsWith("item:") === true).map((block) => ({ id: block.id, associatedImage: block.associatedImage, role: block.role ?? null, offset: block.offset })) }; if (raw.primaryImage.length === 0) { const ids = [...new Set((result.blocks ?? []).map((block) => block.associatedImage).filter((id): id is string => id !== null && id.startsWith("item:")))]; raw.primaryImage.push(...ids.slice(0, effectiveLimits.maxImageDetailCandidates).map((id) => candidate(id, `${result.format} item-properties`, null, null, "valid", "Validated primary item relationship from item properties."))); } }
  const map = mapOffset ?? ((offset: number): number => offset); const remap = <T>(items: readonly Candidate<T>[]): Candidate<T>[] => items.slice(0, effectiveLimits.maxImageDetailCandidates).map((item) => ({ ...item, offset: item.offset === null ? null : map(item.offset) }));
  const stored = remap(raw.storedDimensions); const display = remap(raw.displayDimensions); const bitDepth = remap(raw.bitDepth); const components = remap(raw.components); const colorModel = remap(raw.colorModel); const alpha = remap(raw.alpha); const progressive = remap(raw.progressive); const interlaced = remap(raw.interlaced); const animation = remap(raw.animation).map((item): Candidate<{ readonly frames: number | null; readonly loopCount: number | null }> => { const value = item.value; if (value === null) return item; return { ...item, value: { ...value, frames: value.frames === null ? null : Math.min(value.frames, effectiveLimits.maxImageDetailFrames) } }; }); const orientation = remap(raw.orientation); const primary = remap(raw.primaryImage); const relationshipsMapped = raw.relationships.slice(0, effectiveLimits.maxImageDetailRelationships).map((item) => ({ ...item, offset: item.offset === null ? null : map(item.offset) }));
  const storedCheck = markConflicts(stored, "storedDimensions"); const displayCheck = markConflicts(display, "displayDimensions"); const bitDepthCheck = markConflicts(bitDepth, "bitDepth"); const componentsCheck = markConflicts(components, "components"); const colorModelCheck = markConflicts(colorModel, "colorModel"); const alphaCheck = markConflicts(alpha, "alpha"); const animationCheck = markConflicts(animation, "animation"); const orientationCheck = markConflicts(orientation, "orientation"); const primaryCheck = markConflicts(primary, "primaryImage");
  const conflicts = [...storedCheck.conflicts, ...displayCheck.conflicts, ...bitDepthCheck.conflicts, ...componentsCheck.conflicts, ...colorModelCheck.conflicts, ...alphaCheck.conflicts, ...animationCheck.conflicts, ...orientationCheck.conflicts, ...primaryCheck.conflicts]; const firstPrimary = primary.at(0); const selectedPrimary = primary.length === 1 && firstPrimary !== undefined && firstPrimary.value !== null ? firstPrimary.value : null;
  return { storedDimensions: storedCheck.candidates, displayDimensions: displayCheck.candidates, bitDepth: bitDepthCheck.candidates, components: componentsCheck.candidates, colorModel: colorModelCheck.candidates, alpha: alphaCheck.candidates, progressive, interlaced, animation: animationCheck.candidates, primaryImageId: selectedPrimary, primaryImageCandidates: primary, thumbnails: relationships.thumbnails, previews: relationships.previews, auxiliaryImages: relationshipsMapped.map((item) => item.value).filter((value): value is { readonly id: string; readonly role: string | null } => value !== null), relationshipCandidates: relationshipsMapped, orientation: orientationCheck.candidates, conflicts, support: supportFor(result.format), formatSpecific: raw.formatSpecific, diagnostics: [...result.warnings, ...raw.diagnostics].slice(0, effectiveLimits.maxWarnings) };
}

export function getImageDetails(result: MetadataResult): ImageDetails { return result.details ?? deriveImageDetails(result); }
