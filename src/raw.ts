import type {
  ExifData,
  ExifIfd,
  ImageContainer,
  ImageDimensions,
  ImageFileKind,
  Integer64Value,
  MetadataField,
  RawContainerData,
  RawPayloadFormat,
  RawPayloadReference,
  RawPayloadRole,
  SecurityLimits,
} from "./types.js";

/** TIFF tags needed to identify a TIFF-derived RAW file and inventory its
 * offset-addressed image/preview payloads. They are always inspected in a
 * bounded parse, even when the caller selects a narrower EXIF view. */
export const RAW_TIFF_TAGS: ReadonlySet<number> = new Set([
  46, 256, 257, 259, 262, 273, 279, 280, 330, 324, 325, 513, 514, 271, 272, 37500, 50706,
]);

type RawKind = "dng" | "cr2" | "nef" | "arw" | "orf" | "rw2" | "iiq";

interface RawDirectoryFacts {
  readonly directory: ExifIfd;
  readonly fields: readonly MetadataField[];
  readonly dimensions: ImageDimensions | null;
  readonly rawLike: boolean;
}

interface RawClassification {
  readonly kind: RawKind;
  readonly signature: string;
  readonly detection: RawContainerData["detection"];
}

interface RawDiagnostic {
  readonly code: RawContainerData["diagnostics"][number]["code"];
  readonly detail: string;
  readonly offset: number | null;
}

function bytesAt(bytes: Uint8Array, offset: number, expected: readonly number[]): boolean {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > bytes.length - expected.length) return false;
  return expected.every((value, index) => bytes[offset + index] === value);
}

function numericValues(value: unknown, maxItems: number): readonly number[] {
  const candidates = Array.isArray(value) ? value : [value];
  const output: number[] = [];
  for (const candidate of candidates.slice(0, maxItems)) {
    if (typeof candidate === "number" && Number.isSafeInteger(candidate) && candidate >= 0) output.push(candidate);
    else if (isInteger64(candidate)) {
      const parsed = Number(candidate.decimal);
      if (Number.isSafeInteger(parsed) && parsed >= 0 && String(parsed) === candidate.decimal) output.push(parsed);
    }
  }
  return output;
}

function isInteger64(value: unknown): value is Integer64Value {
  return value !== null && typeof value === "object"
    && typeof (value as { readonly decimal?: unknown }).decimal === "string"
    && typeof (value as { readonly signed?: unknown }).signed === "boolean";
}

function firstField(fields: readonly MetadataField[], tag: number): MetadataField | undefined {
  return fields.find((field) => field.tag === tag);
}

function textValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.replace(/\0+$/u, "").trim();
}

function directoryFields(exif: ExifData): readonly RawDirectoryFacts[] {
  const fieldsByDirectory = new Map<string, MetadataField[]>();
  for (const field of exif.fields) {
    const id = field.directoryId ?? field.source?.directoryId ?? field.ifd;
    const fields = fieldsByDirectory.get(id) ?? [];
    fields.push(field);
    fieldsByDirectory.set(id, fields);
  }
  return exif.ifds.map((directory) => {
    const directoryId = directory.id ?? `${directory.name}@${directory.offset}`;
    const fields = fieldsByDirectory.get(directoryId) ?? fieldsByDirectory.get(directory.name) ?? [];
    const width = numericValues(firstField(fields, 256)?.value, 1)[0] ?? numericValues(firstField(fields, 2)?.value, 1)[0] ?? null;
    const height = numericValues(firstField(fields, 257)?.value, 1)[0] ?? numericValues(firstField(fields, 3)?.value, 1)[0] ?? null;
    const dimensions = width !== null && height !== null && width > 0 && height > 0 ? { width, height } : null;
    const compression = numericValues(firstField(fields, 259)?.value, 1)[0];
    const photometric = numericValues(firstField(fields, 262)?.value, 1)[0];
    const rawLike = photometric === 32803
      || compression === 32767
      || compression === 34713
      || compression === 34892;
    return { directory: { ...directory, id: directoryId }, fields, dimensions, rawLike };
  });
}

function hasDngVersion(exif: ExifData): boolean {
  return exif.fields.some((field) => field.tag === 50706 && (
    (field.raw instanceof Uint8Array && field.raw.length >= 4)
    || (Array.isArray(field.value) && field.value.length >= 4)
  ));
}

function classifyRaw(bytes: Uint8Array, exif: ExifData): RawClassification | null {
  if (bytesAt(bytes, 0, [0x49, 0x49, 0x52, 0x4f])) return { kind: "orf", signature: "IIRO", detection: "structural-signature" };
  if (bytesAt(bytes, 0, [0x49, 0x49, 0x55, 0x00])) return { kind: "rw2", signature: "IIU\\0", detection: "structural-signature" };
  if (bytesAt(bytes, 8, [0x43, 0x52, 0x02, 0x00]) || bytesAt(bytes, 8, [0x43, 0x52, 0x01, 0x00])) {
    return { kind: "cr2", signature: "CR2 marker at TIFF offset 8", detection: "structural-signature" };
  }
  if (bytesAt(bytes, 8, [0x49, 0x49, 0x49, 0x49]) && bytesAt(bytes, 12, [0x43, 0x77, 0x61, 0x52])) {
    return { kind: "iiq", signature: "IIII/CwaR maker structure", detection: "structural-signature" };
  }
  if (hasDngVersion(exif)) return { kind: "dng", signature: "TIFF DNGVersion (50706)", detection: "structural-directory" };

  const root = directoryFields(exif).find(({ directory }) => directory.name === "IFD0");
  const make = textValue(firstField(root?.fields ?? [], 271)?.value)?.toUpperCase() ?? "";
  const directories = directoryFields(exif);
  if (directories.some(({ rawLike }) => rawLike) && make.includes("NIKON")) return { kind: "nef", signature: "TIFF IFD0 Make= Nikon with RAW directory", detection: "structural-directory" };
  if (directories.some(({ rawLike }) => rawLike) && make.includes("SONY")) return { kind: "arw", signature: "TIFF IFD0 Make= Sony with RAW directory", detection: "structural-directory" };
  return null;
}

function tiffPayloadFormat(bytes: Uint8Array, offset: number, length: number): RawPayloadFormat {
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length <= 0 || offset > bytes.length || length > bytes.length - offset) return "unknown";
  if (bytesAt(bytes, offset, [0xff, 0xd8, 0xff])) return "jpeg";
  if (bytesAt(bytes, offset, [0x49, 0x49, 0x2a, 0x00]) || bytesAt(bytes, offset, [0x4d, 0x4d, 0x00, 0x2a])) return "tiff";
  if (bytesAt(bytes, offset, [0x49, 0x49, 0x2b, 0x00]) || bytesAt(bytes, offset, [0x4d, 0x4d, 0x00, 0x2b])) return "bigtiff";
  return "unknown";
}

function tiffPayloadFormatAt(bytes: Uint8Array, offset: number | null, length: number | null): RawPayloadFormat {
  return offset === null || length === null ? "unknown" : tiffPayloadFormat(bytes, offset, length);
}

function rangePairs(fields: readonly MetadataField[], offsetTag: number, lengthTag: number, maxItems: number): readonly { readonly offset: number; readonly length: number; readonly sourceTags: readonly number[]; readonly provenance: RawPayloadReference["provenance"] }[] {
  const offsets = numericValues(firstField(fields, offsetTag)?.value, maxItems);
  const lengths = numericValues(firstField(fields, lengthTag)?.value, maxItems);
  if (offsets.length === 0 || lengths.length === 0) return [];
  const count = Math.min(offsets.length, lengths.length, maxItems);
  return Array.from({ length: count }, (_, index) => ({
    offset: offsets[index] ?? 0,
    length: lengths[index] ?? 0,
    sourceTags: [offsetTag, lengthTag],
    provenance: offsetTag === 513 ? "tiff-jpeg-offset-length" as const : "tiff-offset-count" as const,
  }));
}

function roleFor(facts: RawDirectoryFacts, offsetTag: number, format: RawPayloadFormat): RawPayloadRole {
  // Some vendor parsers describe a preview SubIFD with the generic
  // `thumbnail` kind. Only an actual IFD1 directory is a TIFF thumbnail;
  // preserving the directory name keeps vendor preview directories distinct
  // without relying on a parser-specific kind label.
  if ((offsetTag === 513 && facts.directory.name === "IFD1") || (facts.directory.kind === "thumbnail" && facts.directory.name === "IFD1")) return "thumbnail";
  if (facts.rawLike) return "raw";
  return format === "unknown" ? "unknown" : "preview";
}

function effectiveRawLike(facts: RawDirectoryFacts, kind: RawKind): boolean {
  if (facts.rawLike) return true;
  if (kind === "cr2" && facts.directory.name === "IFD3") return true;
  if ((kind === "orf" || kind === "rw2") && facts.directory.name === "IFD0") return true;
  return false;
}

function safePayloadId(kind: RawKind, index: number, offset: number, length: number): string {
  return `raw:${kind}:payload:${index}:${offset}:${length}`;
}

function pushDiagnostic(diagnostics: RawDiagnostic[], limits: SecurityLimits, diagnostic: RawDiagnostic): void {
  if (diagnostics.length < limits.maxWarnings) diagnostics.push(diagnostic);
}

function mappedPayload(payload: RawPayloadReference, mapOffset?: (offset: number) => number): RawPayloadReference {
  return mapOffset === undefined || payload.offset === null ? payload : { ...payload, offset: mapOffset(payload.offset) };
}

/** Replace only the proprietary classic-TIFF magic used by ORF and RW2.
 * The returned copy is bounded by the caller's already-materialized input. */
export function normalizeRawTiffHeader(bytes: Uint8Array): Uint8Array {
  if (!bytesAt(bytes, 0, [0x49, 0x49, 0x52, 0x4f]) && !bytesAt(bytes, 0, [0x49, 0x49, 0x55, 0x00])) return bytes;
  const normalized = bytes.slice();
  normalized[2] = 0x2a;
  normalized[3] = 0x00;
  return normalized;
}

/** Classify a parsed TIFF graph without interpreting MakerNote payloads. */
export function classifyRawTiff(bytes: Uint8Array, exif: ExifData | null): ImageFileKind | null {
  if (exif === null) {
    if (bytesAt(bytes, 0, [0x49, 0x49, 0x52, 0x4f])) return "orf";
    if (bytesAt(bytes, 0, [0x49, 0x49, 0x55, 0x00])) return "rw2";
    if (bytesAt(bytes, 8, [0x43, 0x52, 0x02, 0x00]) || bytesAt(bytes, 8, [0x43, 0x52, 0x01, 0x00])) return "cr2";
    if (bytesAt(bytes, 8, [0x49, 0x49, 0x49, 0x49]) && bytesAt(bytes, 12, [0x43, 0x77, 0x61, 0x52])) return "iiq";
    return null;
  }
  return classifyRaw(bytes, exif)?.kind ?? null;
}

/** Build a bounded RAW inventory from the already parsed TIFF graph. */
export function inspectRawTiff(bytes: Uint8Array, exif: ExifData | null, limits: SecurityLimits, mapOffset?: (offset: number) => number, sourceLength = bytes.length): RawContainerData | null {
  if (exif === null) return null;
  const classification = classifyRaw(bytes, exif);
  if (classification === null) return null;
  const container: Extract<ImageContainer, "tiff" | "bigtiff"> = bytesAt(bytes, 0, [0x49, 0x49, 0x2b, 0x00]) || bytesAt(bytes, 0, [0x4d, 0x4d, 0x00, 0x2b]) ? "bigtiff" : "tiff";
  const diagnostics: RawDiagnostic[] = [];
  const payloads: RawPayloadReference[] = [];
  const directories = directoryFields(exif);
  let payloadIndex = 0;

  for (const facts of directories) {
    const rawLike = effectiveRawLike(facts, classification.kind);
    const effectiveFacts = rawLike === facts.rawLike ? facts : { ...facts, rawLike };
    const pairs = [
      ...rangePairs(facts.fields, 273, 279, limits.maxIfdEntries),
      ...rangePairs(facts.fields, 324, 325, limits.maxIfdEntries),
      ...rangePairs(facts.fields, 513, 514, limits.maxIfdEntries),
    ];
    const hasOffset = [273, 324, 513].some((tag) => firstField(facts.fields, tag) !== undefined);
    const hasLength = [279, 325, 514].some((tag) => firstField(facts.fields, tag) !== undefined);
    if (hasOffset !== hasLength) pushDiagnostic(diagnostics, limits, { code: "MALFORMED_STRUCTURE", detail: `Directory ${facts.directory.id} has an incomplete offset/count pair.`, offset: facts.directory.offset });
    for (const pair of pairs) {
      // Panasonic uses the classic StripOffsets/StripByteCounts pair as a
      // sentinel for sensor data stored at its private RawDataOffset tag.
      // It is not an addressable payload and must not become a false range
      // error when the vendor offset is present.
      if (classification.kind === "rw2" && pair.offset === 0xffffffff && pair.length === 0) continue;
      if (payloads.length >= limits.maxSegments) {
        pushDiagnostic(diagnostics, limits, { code: "LIMIT_EXCEEDED", detail: "RAW payload count exceeds the configured segment limit.", offset: pair.offset });
        break;
      }
      const sourceOffset = mapOffset === undefined ? pair.offset : mapOffset(pair.offset);
      const inBounds = Number.isSafeInteger(sourceOffset) && Number.isSafeInteger(pair.length) && sourceOffset >= 0 && pair.length > 0 && sourceOffset <= sourceLength && pair.length <= sourceLength - sourceOffset;
      const compactRangeAvailable = pair.offset >= 0 && pair.length > 0 && pair.offset <= bytes.length && pair.length <= bytes.length - pair.offset;
      const format = inBounds && compactRangeAvailable ? tiffPayloadFormat(bytes, pair.offset, pair.length) : "unknown";
      const role = roleFor(effectiveFacts, pair.sourceTags[0] ?? 0, format);
      const payload: RawPayloadReference = {
        id: safePayloadId(classification.kind, payloadIndex, pair.offset, pair.length),
        role,
        format: role === "raw" ? "raw" : format,
        offset: inBounds ? sourceOffset : null,
        length: inBounds ? pair.length : null,
        dimensions: effectiveFacts.dimensions,
        sourceDirectoryId: facts.directory.id ?? `${facts.directory.name}@${facts.directory.offset}`,
        sourceTags: pair.sourceTags,
        provenance: pair.provenance,
        status: inBounds ? (format === "unknown" && role !== "raw" ? "unknown" : "valid") : "out-of-bounds",
      };
      payloads.push(payload);
      payloadIndex += 1;
      if (!inBounds) pushDiagnostic(diagnostics, limits, { code: "UNSAFE_RANGE", detail: `RAW payload range ${sourceOffset}+${pair.length} is outside the source file bounds.`, offset: sourceOffset });
    }
    const vendorJpeg = firstField(facts.fields, 46);
    if (classification.kind === "rw2" && vendorJpeg !== undefined && payloads.length < limits.maxSegments) {
      const offset = vendorJpeg.source?.valueOffset ?? null;
      const length = vendorJpeg.source?.valueLength ?? null;
      const mappedOffset = offset === null ? null : mapOffset === undefined ? offset : mapOffset(offset);
      const inBounds = mappedOffset !== null && length !== null && mappedOffset >= 0 && length > 0 && mappedOffset <= sourceLength && length <= sourceLength - mappedOffset;
      const format = inBounds ? tiffPayloadFormatAt(bytes, offset, length) : "unknown";
      payloads.push({
        id: safePayloadId(classification.kind, payloadIndex, offset ?? -1, length ?? -1),
        role: "preview",
        format,
        offset: inBounds ? mappedOffset : null,
        length: inBounds ? length : null,
        dimensions: facts.dimensions,
        sourceDirectoryId: facts.directory.id ?? `${facts.directory.name}@${facts.directory.offset}`,
        sourceTags: [46],
        provenance: "directory-only",
        status: inBounds && format === "jpeg" ? "valid" : inBounds ? "unknown" : "out-of-bounds",
      });
      payloadIndex += 1;
    }
    const rawDataOffset = classification.kind === "rw2" ? numericValues(firstField(facts.fields, 280)?.value, 1)[0] : undefined;
    if (rawDataOffset !== undefined && rawDataOffset < bytes.length && payloads.length < limits.maxSegments) {
      const length = bytes.length - rawDataOffset;
      payloads.push({
        id: safePayloadId(classification.kind, payloadIndex, rawDataOffset, length),
        role: "raw",
        format: "raw",
        offset: mapOffset === undefined ? rawDataOffset : mapOffset(rawDataOffset),
        length,
        dimensions: facts.dimensions,
        sourceDirectoryId: facts.directory.id ?? `${facts.directory.name}@${facts.directory.offset}`,
        sourceTags: [280],
        provenance: "directory-only",
        status: "valid",
      });
      payloadIndex += 1;
    }
    const makerNote = firstField(facts.fields, 37500);
    if (makerNote !== undefined && payloads.length < limits.maxSegments) {
      const offset = makerNote.source?.valueOffset ?? null;
      const length = makerNote.source?.valueLength ?? null;
      payloads.push({
        id: safePayloadId(classification.kind, payloadIndex, offset ?? -1, length ?? -1),
        role: "metadata",
        format: "unknown",
        offset: offset === null ? null : mapOffset === undefined ? offset : mapOffset(offset),
        length,
        dimensions: null,
        sourceDirectoryId: facts.directory.id ?? `${facts.directory.name}@${facts.directory.offset}`,
        sourceTags: [37500],
        provenance: "directory-only",
        status: offset !== null && length !== null ? "unknown" : "malformed",
      });
      payloadIndex += 1;
    }
  }

  const rawPayloads = payloads.filter((payload) => payload.role === "raw");
  const previews = payloads.filter((payload) => payload.role === "preview");
  const thumbnails = payloads.filter((payload) => payload.role === "thumbnail");
  const opaquePayloads = payloads.filter((payload) => payload.role === "unknown" || payload.role === "metadata");
  if (rawPayloads.length === 0) pushDiagnostic(diagnostics, limits, { code: "AMBIGUOUS_VARIANT", detail: `Recognized ${classification.kind.toUpperCase()} input has no standard TIFF RAW range; vendor sensor storage remains opaque and no pixel bytes were inferred.`, offset: null });
  return {
    kind: classification.kind,
    container,
    detection: classification.detection,
    signature: classification.signature,
    rawPayloads,
    previews,
    thumbnails,
    opaquePayloads,
    complete: diagnostics.every(({ code }) => code !== "MALFORMED_STRUCTURE" && code !== "UNSAFE_RANGE" && code !== "LIMIT_EXCEEDED"),
    diagnostics,
  };
}

/** The public inventory already contains source-relative offsets; this helper
 * is retained as a focused mapping boundary for future range planners. */
export function mapRawPayloadOffsets(raw: RawContainerData, mapOffset?: (offset: number) => number): RawContainerData {
  if (mapOffset === undefined) return raw;
  const map = (payloads: readonly RawPayloadReference[]): readonly RawPayloadReference[] => payloads.map((payload) => mappedPayload(payload, mapOffset));
  return { ...raw, rawPayloads: map(raw.rawPayloads), previews: map(raw.previews), thumbnails: map(raw.thumbnails), opaquePayloads: map(raw.opaquePayloads) };
}
