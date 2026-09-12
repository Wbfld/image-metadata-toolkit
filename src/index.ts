import { detectFormat } from "./detect-format.js";
import { getCapabilities } from "./capabilities.js";
import { getMetadataSummary, type MetadataSummary } from "./summary.js";
import {
  getCaptureTime,
  getGps,
  getOrientation,
  getRotation,
  getThumbnail,
  type CaptureTimeSummary,
  type GpsSummary,
  type OrientationSummary,
  type RotationSummary,
} from "./convenience.js";
import { completeMetadataResult, completeRedactionResult } from "./result.js";
import { materializeInput, materializeJpegHeader, materializeMetadata } from "./input.js";
import { throwIfAborted } from "./security/abort.js";
import { DEFAULT_LIMITS, resolveLimits } from "./security/limits.js";
import { resolveSelection, wantsGroup, type ResolvedSelection } from "./selection.js";
import { deriveXmpPacketProvenance, mergeStructuredXmp, parseStructuredXmpDetailed } from "./metadata/xmp.js";
import type { StructuredXmpOptions, StructuredXmpPacket, XmpDiagnostic, XmpMergedDocument } from "./metadata/xmp.js";
import {
  MetadataError,
  type MetadataInput,
  type MetadataField,
  type MetadataSelection,
  type MetadataResult,
  type ParsedMetadataResult,
  type MetadataWarning,
  type ExifCompositeSet,
  type ParseOptions,
  type ParseManyOptions,
  type PrivacyAuditOptions,
  type PrivacyReasonCode,
  type RedactOptions,
  type RedactionTarget,
  type RedactionResult,
  type SanitizationResult,
  type SanitizeOptions,
  type SecurityLimits,
  type XmpPacketProvenance,
  type IptcSemanticData,
  type IptcSemanticSelectionPolicy,
} from "./types.js";
import { resolveMetadataRegistry } from "./registry.js";
import { deriveExifComposites } from "./normalize/composites.js";
import { attachIptcSemantic, deriveIptcSemantic } from "./normalize/iptc.js";
import { deriveImageDetails, getImageDetails } from "./details.js";
import { fromJsonSafe, queryIccTags, queryImageDetails, queryIptcSemantic, queryMetadata, queryStructuredXmp, toExifReaderCompatible, toExifrCompatible, toFamilyGroups, toFlatObject, toJsonSafe, toJsonSafeResult, toLosslessFamilyGroups } from "./adapters.js";

export { detectFormat, DEFAULT_LIMITS, getCapabilities, getCaptureTime, getGps, getMetadataSummary, getOrientation, getRotation, getThumbnail, getImageDetails, fromJsonSafe, queryIccTags, queryImageDetails, queryIptcSemantic, queryMetadata, queryStructuredXmp, toExifReaderCompatible, toExifrCompatible, toFamilyGroups, toFlatObject, toJsonSafe, toJsonSafeResult, toLosslessFamilyGroups, MetadataError };
export type { AdapterBudgetOptions, CanonicalFamilyGroups, ExifReaderDuplicatePolicy, ExifReaderMigrationOptions, FamilyGroupOptions, FlatCollisionPolicy, FlatObjectOptions, IccTagQuery, ImageDetailQuery, IptcSemanticQuery, JsonSafeOptions, MetadataQuery, MigrationOptions, XmpPropertyQuery } from "./adapters.js";
export { deriveExifComposites } from "./normalize/composites.js";
export { attachIptcSemantic, deriveIptcSemantic } from "./normalize/iptc.js";
export { IPTC_IIM_DATASETS } from "./metadata/iptc.js";
export { IPTC_TECHREFERENCE_PREVIOUS_PROPERTIES, IPTC_TECHREFERENCE_PROPERTIES, IPTC_TECHREFERENCE_SOURCE, IPTC_TECHREFERENCE_STRUCTURES, IPTC_TECHREFERENCE_VERSION_DELTA } from "./generated/iptc-pmd.js";
export { mergeStructuredXmp, parseStructuredXmp, parseStructuredXmpBytes, parseStructuredXmpBytesDetailed, parseStructuredXmpDetailed, parseStructuredXmpDocuments, parseStructuredXmpWithDecoder, parseStructuredXmpWithDecoderDetailed, parseStructuredXmpBytesWithDecoder, parseStructuredXmpBytesWithDecoderDetailed, validateStructuredXmpPacket } from "./metadata/xmp.js";
export type { StructuredXmpDecoder, StructuredXmpOptions, StructuredXmpPacket, StructuredXmpParseResult, XmpAliasDefinition, XmpArrayValue, XmpConflict, XmpDescription, XmpDiagnostic, XmpDiagnosticCode, XmpLiteralValue, XmpMergedDocument, XmpNamespaceBinding, XmpProperty, XmpPropertyCandidate, XmpPropertyValue, XmpQualifiedName, XmpQualifier, XmpRdfDocument, XmpResourceValue, XmpValue } from "./metadata/xmp.js";
export { createByteSource } from "./io/byte-source.js";
export type { ByteSource, ByteSourceOptions } from "./io/byte-source.js";
export type { FormatCapabilities, MetadataCapability, MetadataReadScope } from "./capabilities.js";
export type { MetadataSummary, MetadataConflict, CameraSummary, LensSummary, ExposureSummary, CaptureSummary, LocationSummary } from "./summary.js";
export type { CaptureTimeSummary, ExifOrientation, GpsSummary, OrientationSummary, RotationSummary } from "./convenience.js";
export type { CaptureTimeValue, CompositeCandidate, CompositeConflict, CompositeKind, CompositePayload, CompositeUncertainty, Equivalence35mmValue, ExifComposite, ExifCompositeSet, ExposureValueValue, FieldOfViewValue, GpsTimeValue, NormalizationMode, OrientationValue, PrimaryDisplayDimensionsValue } from "./types.js";
export type { PrivacyAuditResult, PrivacyFinding, PrivacyOpaqueBlock } from "./privacy/audit.js";
export { createMetadataRegistry, DEFAULT_METADATA_REGISTRY, METADATA_REGISTRY_SIZE, resolveMetadataRegistry } from "./registry.js";
export type { MetadataCountConstraint, MetadataRegistry, MetadataRegistryField, MetadataRegistryFieldInput, MetadataRegistrySource } from "./registry.js";
export type * from "./types.js";

/** Parse options used by direct task helpers. Helpers own their minimal selection. */
export type DirectReadOptions = Omit<ParseOptions, "select">;

/** Useful metadata views for common application workflows. */
export type MetadataPreset = "essential" | "camera" | "location" | "privacy" | "all";

export interface MetadataFieldIndex {
  readonly byId: ReadonlyMap<string, MetadataField>;
  readonly byName: ReadonlyMap<string, MetadataField>;
  readonly allByName: ReadonlyMap<string, readonly MetadataField[]>;
}

export interface StructuredXmpDocument {
  /** Index into the original `result.xmp.packets` array. */
  readonly sourceIndex: number;
  /** The bounded structured representation, or null when that packet is not safe XML/RDF. */
  readonly value: StructuredXmpPacket | null;
  /** Exact embedded/Extended-XMP source evidence when the container exposed it. */
  readonly provenance?: XmpPacketProvenance;
  readonly diagnostics: readonly XmpDiagnostic[];
}

export interface StructuredXmpResult {
  readonly documents: readonly StructuredXmpDocument[];
  /** True only when every stored packet decoded as bounded structured XMP. */
  readonly complete: boolean;
  /** Explicit merge result; `preserve-all` retains every packet candidate. */
  readonly merged?: XmpMergedDocument;
}

export interface StructuredXmpReadOptions {
  /** Parse controls for the source image. */
  readonly parse?: DirectReadOptions;
  /** Bounds for structured XML/RDF decoding. */
  readonly decode?: StructuredXmpOptions;
  readonly mergePolicy?: "preserve-all" | "first" | "last";
}

const PRESET_SELECTIONS: Readonly<Record<Exclude<MetadataPreset, "all">, MetadataSelection>> = {
  essential: { groups: ["Dimensions", "EXIF"], tags: ["Make", "Model", "Orientation", "DateTimeOriginal"] },
  camera: { groups: ["Dimensions", "EXIF"], tags: ["Make", "Model", "LensMake", "LensModel", "LensSpecification", "FocalLength", "FNumber", "ExposureTime", "ISOSpeedRatings", "Flash"] },
  location: { groups: ["EXIF"], tags: ["GPSLatitude", "GPSLatitudeRef", "GPSLongitude", "GPSLongitudeRef", "GPSAltitude", "GPSAltitudeRef"] },
  privacy: { groups: ["EXIF", "XMP", "IPTC", "ICC", "JFIF", "PNGText"] },
};

const GPS_TAGS = ["GPSLatitude", "GPSLatitudeRef", "GPSLongitude", "GPSLongitudeRef", "GPSAltitude", "GPSAltitudeRef"] as const;
const CAPTURE_TIME_TAGS = ["DateTime", "DateTimeOriginal", "DateTimeDigitized", "SubSecTime", "SubSecTimeOriginal", "SubSecTimeDigitized", "OffsetTime", "OffsetTimeOriginal", "OffsetTimeDigitized"] as const;
const SUMMARY_TAGS = ["Make", "Model", "CameraOwnerName", "BodySerialNumber", "LensSerialNumber", "LensMake", "LensModel", "LensSpecification", "FocalLength", "FocalLengthIn35mmFilm", "ExposureTime", "FNumber", "ISOSpeedRatings", "StandardOutputSensitivity", "RecommendedExposureIndex", "ISOSpeed", "Flash", "Orientation", ...GPS_TAGS, ...CAPTURE_TIME_TAGS] as const;

function helperOptions(options: DirectReadOptions, select: MetadataSelection): ParseOptions {
  return { ...options, select };
}

/** Build efficient, reusable field lookups without flattening duplicate metadata. */
export function indexMetadataFields(result: MetadataResult): MetadataFieldIndex {
  const byId = new Map<string, MetadataField>();
  const byName = new Map<string, MetadataField>();
  const allByName = new Map<string, MetadataField[]>();
  const seen = new Set<string>();
  for (const field of [...result.fields, ...(result.exif?.fields ?? [])]) {
    if (seen.has(field.id)) continue;
    seen.add(field.id);
    byId.set(field.id, field);
    if (!byName.has(field.name)) byName.set(field.name, field);
    const matches = allByName.get(field.name) ?? [];
    matches.push(field);
    allByName.set(field.name, matches);
  }
  return {
    byId,
    byName,
    allByName: new Map([...allByName].map(([name, fields]) => [name, Object.freeze([...fields])])),
  };
}

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

function enrichXmpProvenance(result: ParsedMetadataResult): ParsedMetadataResult {
  if (result.xmp === null || result.xmp.packets.length === 0) return result;
  return { ...result, xmp: { ...result.xmp, packetProvenance: deriveXmpPacketProvenance(result.xmp.packets, result.blocks ?? []) } };
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
            message: "Input does not have a recognized JPEG, PNG, TIFF, WebP, GIF, JPEG XL, HEIF, or AVIF signature.",
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

/** Parse metadata locally. This function never performs network I/O. */
export async function parseMetadata(input: MetadataInput, options: ParseOptions = {}): Promise<MetadataResult> {
  const limits = resolveLimits(options.limits);
  const selection = resolveSelection(options.select);
  const registry = resolveMetadataRegistry(options.registry);
  throwIfAborted(options.signal);
  const materialization = options.scope === "metadata"
    ? await materializeMetadata(input, limits, selection, options.signal)
    : {
        bytes: options.scope === "jpeg-header" ? await materializeJpegHeader(input, limits, options.signal) : await materializeInput(input, limits, options.signal),
        partial: options.scope === "jpeg-header",
        warnings: [],
      };
  let bytes = materialization.bytes;
  let partial = materialization.partial;
  throwIfAborted(options.signal);
  let detection = detectFormat(bytes);
  if (options.scope === "jpeg-header" && detection.format !== "jpeg") {
    bytes = await materializeInput(input, limits, options.signal);
    detection = detectFormat(bytes);
    partial = false;
  }
  let result: ParsedMetadataResult;
  const headerOnly = (options.scope === "jpeg-header" || options.scope === "metadata") && detection.format === "jpeg";
  if (detection.format === "jpeg") {
    const { parseJpeg } = await import("./parsers/jpeg.js");
    result = parseJpeg(bytes, limits, { selection, headerOnly, registry, ...(materialization.mapOffset === undefined ? {} : { offsetMap: materialization.mapOffset }), ...(materialization.jpegView === undefined ? {} : { byteView: materialization.jpegView }), ...(options.signal === undefined ? {} : { signal: options.signal }) });
  } else if (detection.format === "png") {
    const { parsePng } = await import("./parsers/png.js");
    result = await parsePng(bytes, limits, selection, options.signal, registry);
  } else if (detection.format === "tiff") {
    const { parseTiffMetadata } = await import("./parsers/tiff.js");
    result = parseTiffMetadata(bytes, limits, selection, true, options.signal, registry, materialization.mapOffset);
  } else if (detection.format === "webp") {
    const { parseWebp } = await import("./parsers/webp.js");
    result = parseWebp(bytes, limits, selection, options.signal, registry);
  } else if (detection.format === "gif") {
    const { parseGif } = await import("./parsers/gif.js");
    result = parseGif(bytes, limits, selection, options.signal);
  } else if (detection.format === "jxl") {
    const { parseJxl } = await import("./parsers/jxl.js");
    result = parseJxl(bytes, limits, selection, options.signal, registry);
  } else if (detection.format === "heif" || detection.format === "avif") {
    const { parseHeif } = await import("./parsers/heif.js");
    result = parseHeif(bytes, limits, detection.format, selection, options.signal, registry);
  }
  else result = unsupportedResult(bytes, limits);
  throwIfAborted(options.signal);
  const parserResult: ParsedMetadataResult = enrichXmpProvenance({ ...result, warnings: [...materialization.warnings, ...result.warnings] });
  const rawExifFields = parserResult.exif?.fields ?? [];
  const withComposites = rawExifFields.length === 0
    ? parserResult
    : (() => {
      const derived = deriveExifComposites(rawExifFields, parserResult.dimensions, options.normalization ?? "lenient");
      return {
        ...parserResult,
        composites: derived.composites,
        warnings: [...parserResult.warnings, ...derived.warnings].slice(0, limits.maxWarnings),
      };
    })();
  const selectedBase = attachIptcSemantic(applySelection(withComposites, selection), limits) as ParsedMetadataResult;
  const includeDetails = wantsGroup(selection, "Dimensions");
  const selected = { ...selectedBase, details: deriveImageDetails(selectedBase, includeDetails ? bytes : undefined, includeDetails ? limits : undefined, includeDetails ? materialization.mapOffset : undefined) };
  return completeMetadataResult(
    selected,
    partial ? "partial" : "full",
    partial
      ? [headerOnly ? "JPEG scan data was intentionally not read." : "Image payload ranges were intentionally not read."]
      : [],
    partial && materialization.bytesRead !== undefined
      ? { bytesRead: materialization.bytesRead, ...(materialization.inputBytes === undefined ? {} : { inputBytes: materialization.inputBytes }) }
      : undefined,
    materialization.telemetry,
  );
}

/**
 * Parse an ordered collection with bounded concurrency. Results retain input
 * order, while each item uses the same limits, selection, scope, and abort
 * signal as `parseMetadata`.
 */
export async function parseMetadataMany(inputs: readonly MetadataInput[], options: ParseManyOptions = {}): Promise<readonly MetadataResult[]> {
  const concurrency = options.concurrency ?? 4;
  if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
    throw new MetadataError("INVALID_VALUE", "Parse concurrency must be a positive safe integer.");
  }
  throwIfAborted(options.signal);
  const results = new Array<MetadataResult>(inputs.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < inputs.length) {
      throwIfAborted(options.signal);
      const index = next;
      next += 1;
      const input = inputs.at(index);
      if (input === undefined) return;
      results[index] = await parseMetadata(input, options);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, inputs.length) }, worker));
  return results;
}

/** Parse one of the supported application-oriented metadata presets. */
export async function readPreset(input: MetadataInput, preset: MetadataPreset, options: DirectReadOptions = {}): Promise<MetadataResult> {
  return preset === "all"
    ? parseMetadata(input, options)
    : parseMetadata(input, helperOptions(options, PRESET_SELECTIONS[preset]));
}

/** Read a small set of EXIF fields without requiring callers to scan result arrays. */
export async function readTags(input: MetadataInput, tags: readonly string[], options: DirectReadOptions = {}): Promise<readonly MetadataField[]> {
  const result = await parseMetadata(input, helperOptions(options, { groups: ["EXIF"], tags }));
  const index = indexMetadataFields(result);
  const fields: MetadataField[] = [];
  const seen = new Set<string>();
  for (const tag of tags) {
    const field = index.byId.get(tag) ?? index.byName.get(tag);
    if (field !== undefined && !seen.has(field.id)) {
      seen.add(field.id);
      fields.push(field);
    }
  }
  return fields;
}

/** Read the typed application summary directly from image input. */
export async function readMetadataSummary(input: MetadataInput, options: DirectReadOptions = {}): Promise<MetadataSummary> {
  return getMetadataSummary(await parseMetadata(input, helperOptions(options, { groups: ["EXIF"], tags: SUMMARY_TAGS })));
}

/** Return all bounded typed EXIF interpretations, including source candidates and conflicts. */
export function getExifComposites(result: MetadataResult): ExifCompositeSet | null {
  if (result.composites !== undefined) return result.composites;
  const rawFields = result.exif?.fields ?? [];
  if (rawFields.length === 0) return null;
  return deriveExifComposites(rawFields, result.dimensions, "lenient").composites;
}

/** Return the additive IPTC Photo Metadata semantic view, retaining every IIM
 * and URI-aware XMP candidate. */
export function getIptcSemantic(result: MetadataResult, options: { readonly policy?: IptcSemanticSelectionPolicy } = {}): IptcSemanticData | null {
  if (result.iptcSemantic !== undefined && (options.policy === undefined || result.iptcSemantic.selectionPolicy === options.policy)) return result.iptcSemantic;
  if (result.iptc === null && result.xmp === null) return null;
  return deriveIptcSemantic(result.iptc, result.xmp, result.blocks, resolveLimits(), options);
}

/** Read IPTC-IIM and XMP IPTC Photo Metadata semantics from an image. */
export async function readIptcSemantic(input: MetadataInput, options: DirectReadOptions & { readonly policy?: IptcSemanticSelectionPolicy } = {}): Promise<IptcSemanticData | null> {
  const result = await parseMetadata(input, { ...options, select: { groups: ["IPTC", "XMP"] } });
  return options.policy === undefined ? getIptcSemantic(result) : getIptcSemantic(result, { policy: options.policy });
}

/** Read all EXIF fields required to derive the typed composite interpretation set. */
export async function readExifComposites(input: MetadataInput, options: DirectReadOptions = {}): Promise<ExifCompositeSet | null> {
  const result = await parseMetadata(input, helperOptions(options, { groups: ["Dimensions", "EXIF"] }));
  return getExifComposites(result);
}

/** Decode every retained XMP packet while preserving packet-level failure information. */
export function getStructuredXmp(result: MetadataResult, options: StructuredXmpOptions & { readonly mergePolicy?: "preserve-all" | "first" | "last" } = {}): StructuredXmpResult {
  const packets = result.xmp?.packets ?? [];
  const packetLimit = options.maxPackets ?? 64;
  const documents = packets.slice(0, packetLimit).map((packet, sourceIndex) => {
    const parsed = parseStructuredXmpDetailed(packet, options);
    return {
      sourceIndex,
      value: parsed.value,
      diagnostics: parsed.diagnostics,
      ...(result.xmp?.packetProvenance?.[sourceIndex] === undefined ? {} : { provenance: result.xmp.packetProvenance[sourceIndex] }),
    };
  });
  if (packets.length > packetLimit) documents.push({ sourceIndex: packetLimit, value: null, diagnostics: [{ code: "LIMIT_EXCEEDED", message: `XMP packet count exceeds ${packetLimit}.`, severity: "error" }] });
  const merged = mergeStructuredXmp(documents.map((document) => ({ value: document.value, packetIndex: document.sourceIndex, sourceId: document.provenance?.id ?? null, source: document.provenance ?? null })), options.mergePolicy ?? "preserve-all");
  return { documents, complete: documents.every((document) => document.value !== null), merged };
}

/** Read XMP from an image and decode its retained packets into bounded RDF values. */
export async function readStructuredXmp(input: MetadataInput, options: StructuredXmpReadOptions = {}): Promise<StructuredXmpResult> {
  const result = await parseMetadata(input, helperOptions(options.parse ?? {}, { groups: ["XMP"] }));
  const limits = resolveLimits(options.parse?.limits);
  const decode: StructuredXmpOptions = {
    maxInputBytes: Math.min(limits.maxStringBytes, limits.maxMetadataBytes),
    maxElements: limits.maxXmpNodes,
    maxProperties: limits.maxXmpProperties,
    maxDepth: limits.maxXmpDepth,
    maxAttributes: limits.maxXmpAttributes,
    maxNamespaces: limits.maxXmpNamespaces,
    maxTextBytes: limits.maxXmpTextBytes,
    maxArrayItems: limits.maxXmpArrayItems,
    maxQualifiers: limits.maxXmpQualifiers,
    maxOutputBytes: limits.maxXmpOutputBytes,
    maxPackets: limits.maxXmpPackets,
    ...options.decode,
  };
  const decoded = getStructuredXmp(result, decode);
  if (options.mergePolicy === undefined || decoded.merged === undefined || options.mergePolicy === "preserve-all") return decoded;
  const merged = mergeStructuredXmp(decoded.documents.map((document) => ({ value: document.value, packetIndex: document.sourceIndex, sourceId: document.provenance?.id ?? null, source: document.provenance ?? null })), options.mergePolicy);
  return { ...decoded, merged };
}

/** Read validated decimal GPS coordinates directly from image input. */
export async function readGps(input: MetadataInput, options: DirectReadOptions = {}): Promise<GpsSummary> {
  return getGps(await parseMetadata(input, helperOptions(options, { groups: ["EXIF"], tags: GPS_TAGS })));
}

/** Read EXIF and container orientation directly from image input. */
export async function readOrientation(input: MetadataInput, options: DirectReadOptions = {}): Promise<OrientationSummary> {
  return getOrientation(await parseMetadata(input, helperOptions(options, { groups: ["EXIF", "Transform"], tags: ["Orientation"] })));
}

/** Read browser-friendly rotation instructions directly from image input. */
export async function readRotation(input: MetadataInput, options: DirectReadOptions = {}): Promise<RotationSummary | null> {
  return getRotation(await parseMetadata(input, helperOptions(options, { groups: ["EXIF", "Transform"], tags: ["Orientation"] })));
}

/** Read a bounded embedded EXIF thumbnail directly from image input. */
export async function readThumbnail(input: MetadataInput, options: DirectReadOptions = {}): Promise<ReturnType<typeof getThumbnail>> {
  return getThumbnail(await parseMetadata(input, helperOptions(options, { groups: ["EXIF"] })));
}

/** Read the preferred explicit capture time directly from image input. */
export async function readCaptureTime(input: MetadataInput, options: DirectReadOptions = {}): Promise<CaptureTimeSummary> {
  return getCaptureTime(await parseMetadata(input, helperOptions(options, { groups: ["EXIF"], tags: CAPTURE_TIME_TAGS })));
}

/** Remove selected JPEG metadata without decoding or recompressing image pixels. */
export async function redactMetadata(input: MetadataInput, options: RedactOptions): Promise<RedactionResult> {
  const limits = resolveLimits(options.limits);
  throwIfAborted(options.signal);
  const bytes = await materializeInput(input, limits, options.signal);
  throwIfAborted(options.signal);
  const { redactBytes } = await import("./privacy/redact.js");
  return completeRedactionResult(redactBytes(bytes, options, limits), options);
}

/** Audit recognized privacy metadata without modifying the input. */
export async function auditPrivacy(input: MetadataInput, options: PrivacyAuditOptions = {}) {
  const { auditPrivacy: inspectPrivacy } = await import("./privacy/audit.js");
  return inspectPrivacy(input, options);
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
  const bytes = await materializeInput(input, limits, options.signal);
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
  const reasonCodes: PrivacyReasonCode[] = surgery.warnings.map(({ code }) => code);

  if (!surgery.outcome.successful) {
    return { format, data: null, successful: false, retained, warnings, reasons, reasonCodes: [...new Set(reasonCodes)] };
  }

  const reparsed = await parseMetadata(surgery.data, options.signal === undefined ? { limits } : { limits, signal: options.signal });
  if (!reparsed.completeness.complete) reasons.push(...reparsed.completeness.reasons);
  for (const coverageReason of reparsed.coverage.reasons) {
    reasonCodes.push(coverageReason.code);
  }
  if (reparsed.coverage.wholeFile !== "complete" || reparsed.coverage.unclassifiedBlockIds.length > 0) {
    reasons.push(...reparsed.coverage.reasons.map(({ code, message }) => `${code}: ${message}`));
    if (reparsed.coverage.unclassifiedBlockIds.length > 0) reasons.push("Unclassified metadata-bearing blocks remain after sanitization.");
  }
  if (reparsed.xmp !== null || reparsed.iptc !== null || reparsed.jfif !== null || reparsed.pngText.length > 0) {
    reasons.push("Recognized descriptive metadata remains after sanitization.");
  }
  const nonOrientationExif = reparsed.exif?.fields.filter((field) => field.name !== "Orientation") ?? [];
  if (nonOrientationExif.length > 0) reasons.push("EXIF fields other than the requested orientation remain after sanitization.");
  if (reparsed.fields.some((field) => field.name !== "Orientation" && field.ifd !== "ICC" && (field.sensitivity === "high" || field.sensitivity === "moderate"))) {
    reasons.push("Recognized sensitive fields remain after sanitization.");
  }
  if (format === "jpeg") {
    const strictGaps = jpegStrictGaps(surgery.data);
    reasons.push(...strictGaps);
    for (const gap of strictGaps) {
      if (gap.includes("opaque")) reasonCodes.push("OPAQUE_JPEG_MARKER");
      else if (gap.includes("end marker")) reasonCodes.push("TRAILING_BYTES");
      else reasonCodes.push("UNSUPPORTED_STRUCTURE");
    }
  }
  if (format !== "jpeg" && format !== "png" && format !== "webp") reasons.push(`Strict metadata sanitization is not implemented for ${format.toUpperCase()}.`);
  const uniqueReasons = [...new Set(reasons)];
  if (uniqueReasons.length === 0) {
    return { format, data: surgery.data, successful: true, retained, warnings, reasons: uniqueReasons, reasonCodes: [...new Set(reasonCodes)] };
  }
  return { format, data: null, successful: false, retained, warnings, reasons: uniqueReasons, reasonCodes: [...new Set(reasonCodes)] };
}
