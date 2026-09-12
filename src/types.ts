/** Binary inputs accepted in browsers, workers, Node.js, and Deno. */
import type { MetadataRegistry, MetadataRegistryFieldInput, MetadataRegistrySource } from "./registry.js";

export type MetadataInput = ArrayBuffer | ArrayBufferView | Blob;

export type ImageFormat = "jpeg" | "png" | "tiff" | "webp" | "gif" | "jxl" | "heif" | "avif" | "unknown";

export type ImageMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/tiff"
  | "image/webp"
  | "image/gif"
  | "image/jxl"
  | "image/heif"
  | "image/avif"
  | "application/octet-stream";

export interface FormatDetection {
  readonly format: ImageFormat;
  readonly mimeType: ImageMimeType;
}

export interface ImageDimensions {
  readonly width: number;
  readonly height: number;
}

/** A source-preserving common image/container fact. Competing candidates are retained. */
export interface ImageDetailCandidate<T> {
  readonly value: T | null;
  readonly source: string;
  readonly offset: number | null;
  readonly blockId: string | null;
  readonly validation: "valid" | "conflicting" | "malformed" | "unknown";
  /** Stable explanation of how the candidate was obtained. */
  readonly derivation?: string;
}

/** Header-proven image properties. `null` means not proven, never "false" by default. */
export interface ImageDetails {
  readonly storedDimensions: readonly ImageDetailCandidate<ImageDimensions>[];
  readonly displayDimensions: readonly ImageDetailCandidate<ImageDimensions>[];
  readonly bitDepth: readonly ImageDetailCandidate<number | readonly number[]>[];
  readonly components: readonly ImageDetailCandidate<readonly string[]>[];
  readonly colorModel: readonly ImageDetailCandidate<string>[];
  readonly alpha: readonly ImageDetailCandidate<"present" | "absent">[];
  readonly progressive: readonly ImageDetailCandidate<boolean>[];
  readonly interlaced: readonly ImageDetailCandidate<boolean>[];
  readonly animation: readonly ImageDetailCandidate<{ readonly frames: number | null; readonly loopCount: number | null }>[];
  readonly primaryImageId: string | null;
  /** All validated primary-image candidates. The scalar above is populated only when unambiguous. */
  readonly primaryImageCandidates?: readonly ImageDetailCandidate<string>[];
  readonly thumbnails: readonly string[];
  readonly previews: readonly string[];
  readonly auxiliaryImages: readonly { readonly id: string; readonly role: string | null }[];
  /** One entry per validated auxiliary/thumbnail/preview relationship. */
  readonly relationshipCandidates?: readonly ImageDetailCandidate<{ readonly id: string; readonly role: string | null }>[];
  readonly orientation: readonly ImageDetailCandidate<ImageTransform>[];
  readonly conflicts: readonly { readonly property: string; readonly candidates: readonly number[]; readonly reason: string }[];
  readonly support: Readonly<Record<"storedDimensions" | "displayDimensions" | "bitDepth" | "components" | "colorModel" | "alpha" | "progressive" | "interlaced" | "animation" | "relationships", "supported" | "conditional" | "unsupported">>;
  /** Validated details that have no honest common representation. */
  readonly formatSpecific: Readonly<Record<string, unknown>>;
  /** Stable diagnostics generated while inspecting bounded image headers. */
  readonly diagnostics?: readonly MetadataWarning[];
}

export interface ImageTransform {
  /** Counter-clockwise quarter-turns from the stored image. */
  readonly rotation: 0 | 90 | 180 | 270;
  /** Whether the image is mirrored around the declared axis. */
  readonly mirrored: boolean;
  /** `vertical` flips top/bottom; `horizontal` flips left/right. */
  readonly mirrorAxis?: "vertical" | "horizontal";
}

/** ISO/IEC 23001-8 `nclx` colour parameters from a HEIF/AVIF `colr` property. */
export interface NclxColorData {
  readonly colourPrimaries: number;
  readonly transferCharacteristics: number;
  readonly matrixCoefficients: number;
  readonly fullRange: boolean;
}

export type WarningSeverity = "warning" | "error";

export type WarningCode =
  | "UNKNOWN_FORMAT"
  | "UNSUPPORTED_FORMAT"
  | "UNSUPPORTED_COMPRESSION"
  | "TRUNCATED_DATA"
  | "MALFORMED_JPEG"
  | "MALFORMED_PNG"
  | "MALFORMED_WEBP"
  | "MALFORMED_GIF"
  | "MALFORMED_JXL"
  | "MALFORMED_HEIF"
  | "MALFORMED_IPTC"
  | "MALFORMED_EXIF"
  | "UNSAFE_OFFSET"
  | "LIMIT_EXCEEDED"
  | "INVALID_ASCII"
  | "INVALID_DATE"
  | "INVALID_VALUE"
  | "ZERO_DENOMINATOR"
  | "DUPLICATE_EXIF"
  | "INCOMPLETE_GPS"
  | "UNSUPPORTED_STRUCTURE"
  | "REDACTION_SKIPPED"
  | "ABORTED";

export interface MetadataWarning {
  readonly code: WarningCode;
  readonly message: string;
  readonly severity: WarningSeverity;
  readonly offset?: number;
  readonly length?: number;
  readonly ifd?: string;
  readonly tag?: number;
}

export interface RationalValue {
  readonly numerator: number;
  readonly denominator: number;
}

/** Exact TIFF 64-bit integer retained when it exceeds JavaScript's safe range. */
export interface Integer64Value {
  readonly decimal: string;
  readonly signed: boolean;
}

export interface FlashValue {
  readonly code: number;
  readonly fired: boolean;
  readonly returnStatus: "not-supported" | "not-detected" | "detected" | "reserved";
  readonly mode: "unknown" | "compulsory-firing" | "compulsory-suppression" | "auto";
  readonly functionPresent: boolean;
  readonly redEyeReduction: boolean;
}

export interface ApexValue {
  readonly apex: RationalValue;
  readonly computed: number;
  readonly unit: "seconds" | "f-number" | "ev";
}

/** Composite normalization policy. Lenient mode preserves usable derived
 * values while retaining diagnostics; strict mode withholds a composite when
 * any required source is invalid or ambiguous. */
export type NormalizationMode = "lenient" | "strict";

export type CompositeKind =
  | "capture-time"
  | "gps-time"
  | "field-of-view"
  | "exposure-value"
  | "35mm-equivalence"
  | "orientation"
  | "primary-display-dimensions";

export type CompositeUncertainty = "exact" | "derived" | "ambiguous" | "partial" | "invalid" | "unavailable";

export interface CaptureTimeValue {
  readonly local: string;
  readonly iso8601: string;
  readonly date: string;
  readonly time: string;
  readonly subsecond: string | null;
  readonly offset: string | null;
  readonly timezoneKnown: boolean;
}

export interface GpsTimeValue {
  readonly date: string;
  readonly time: string;
  readonly iso8601: string;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly utc: true;
}

export interface FieldOfViewValue {
  readonly horizontalDegrees: number;
  readonly verticalDegrees: number;
  readonly diagonalDegrees: number;
  readonly focalLengthMillimetres: number;
  readonly sensorWidthMillimetres: number;
  readonly sensorHeightMillimetres: number;
  readonly resolutionUnit: "inch" | "centimetre";
}

export interface ExposureValueValue {
  readonly ev: number;
  readonly source: "ExposureTime+FNumber" | "ShutterSpeedValue+ApertureValue" | "BrightnessValue+ExposureBiasValue";
  readonly exposureTimeSeconds: number | null;
  readonly fNumber: number | null;
}

export interface Equivalence35mmValue {
  readonly equivalentFocalLengthMillimetres: number;
  readonly actualFocalLengthMillimetres: number | null;
  readonly cropFactor: number | null;
  readonly source: "FocalLengthIn35mmFilm" | "FocalLength+sensorGeometry";
}

export interface OrientationValue {
  readonly code: ExifOrientationCode;
  readonly label: string;
  readonly rotationDegrees: 0 | 90 | 180 | 270;
  readonly mirrored: boolean;
  readonly mirrorAxis: "horizontal" | "vertical" | null;
}

export type ExifOrientationCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface PrimaryDisplayDimensionsValue {
  readonly width: number;
  readonly height: number;
  readonly storedWidth: number;
  readonly storedHeight: number;
  readonly orientation: ExifOrientationCode;
  readonly source: "PixelXDimension+PixelYDimension" | "ImageWidth+ImageLength" | "container-dimensions";
}

export type CompositePayload =
  | CaptureTimeValue
  | GpsTimeValue
  | FieldOfViewValue
  | ExposureValueValue
  | Equivalence35mmValue
  | OrientationValue
  | PrimaryDisplayDimensionsValue;

export interface CompositeCandidate<T extends CompositePayload = CompositePayload> {
  readonly value: T | null;
  readonly sourceFieldIds: readonly string[];
  readonly uncertainty: CompositeUncertainty;
  readonly derivation: string;
  readonly diagnostics: readonly string[];
}

export interface CompositeConflict {
  readonly sourceFieldIds: readonly string[];
  readonly values: readonly string[];
  readonly reason: string;
}

export interface ExifComposite<T extends CompositePayload = CompositePayload> {
  readonly id: `composite:${CompositeKind}`;
  readonly kind: CompositeKind;
  readonly value: T | null;
  readonly sourceFieldIds: readonly string[];
  readonly uncertainty: CompositeUncertainty;
  readonly derivation: string;
  readonly candidates: readonly CompositeCandidate<T>[];
  readonly conflicts: readonly CompositeConflict[];
  readonly diagnostics: readonly string[];
}

export interface ExifCompositeSet {
  readonly captureTime: ExifComposite<CaptureTimeValue>;
  readonly gpsTime: ExifComposite<GpsTimeValue>;
  readonly fieldOfView: ExifComposite<FieldOfViewValue>;
  readonly exposureValue: ExifComposite<ExposureValueValue>;
  readonly equivalence35mm: ExifComposite<Equivalence35mmValue>;
  readonly orientation: ExifComposite<OrientationValue>;
  readonly primaryDisplayDimensions: ExifComposite<PrimaryDisplayDimensionsValue>;
  readonly normalization: NormalizationMode;
}

export interface GpsCoordinateRaw {
  readonly reference: string;
  readonly components: readonly RationalValue[];
}

export type MetadataValue =
  | null
  | boolean
  | number
  | string
  | Uint8Array
  | RationalValue
  | Integer64Value
  | FlashValue
  | ApexValue
  | GpsCoordinateRaw
  | ExifComposite
  | readonly number[]
  | readonly RationalValue[]
  | readonly Integer64Value[]
  | readonly (number | Integer64Value)[];

export type ExifDataType =
  | "BYTE"
  | "ASCII"
  /** Exif 3.0/3.1 UTF-8, NUL-terminated and without a BOM. */
  | "UTF-8"
  | "SHORT"
  | "LONG"
  | "RATIONAL"
  | "SBYTE"
  | "UNDEFINED"
  | "SSHORT"
  | "SLONG"
  | "SRATIONAL"
  | "FLOAT"
  | "DOUBLE"
  | "IFD"
  | "LONG8"
  | "SLONG8"
  | "IFD8"
  | "COMPOSITE"
  | "UNKNOWN";

export type Sensitivity = "none" | "low" | "moderate" | "high";

/** Original-input provenance for a decoded metadata field. Offsets are absent
 * only when a container cannot safely preserve a field's exact source span. */
export interface MetadataFieldSource {
  readonly blockId: string;
  /** Stable TIFF directory identity when the field came from an EXIF/ TIFF IFD. */
  readonly directoryId?: string;
  readonly entryOffset: number | null;
  readonly entryLength: number | null;
  readonly valueOffset: number | null;
  readonly valueLength: number | null;
}

export interface MetadataField<TRaw extends MetadataValue = MetadataValue, TValue extends MetadataValue = MetadataValue> {
  /** Stable identifier such as `IFD0:0x010f` or `normalized:Make`. */
  readonly id: string;
  readonly ifd: string;
  readonly tag: number;
  readonly name: string;
  readonly raw: TRaw;
  readonly value: TValue;
  readonly display: string;
  readonly description: string;
  readonly type: ExifDataType;
  readonly sensitivity: Sensitivity;
  readonly count?: number;
  readonly known?: boolean;
  /** IPTC-IIM validation metadata when this is an IIM dataset. */
  readonly format?: string;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly repeatable?: boolean;
  readonly standardVersion?: string;
  readonly source?: MetadataFieldSource;
  /** Zero-based occurrence for repeatable IPTC-IIM datasets. */
  readonly occurrence?: number;
  /** Stable directory identity; distinct SubIFDs never share this value. */
  readonly directoryId?: string;
}

export type ExifDirectoryKind = "primary" | "exif" | "gps" | "interop" | "subifd" | "chain" | "thumbnail" | "preview" | "unknown";

export type ExifDirectoryRelationType = "pointer" | "subifd" | "next" | "shared-offset" | "cycle" | "associated-image";

export interface ExifDirectoryRelation {
  readonly type: ExifDirectoryRelationType;
  readonly fromDirectoryId: string;
  readonly toDirectoryId: string;
  readonly tag?: number;
  readonly sharedOffset?: boolean;
}

export interface ExifIfd {
  readonly name: string;
  readonly offset: number;
  readonly entryCount: number;
  /** Additive S04 topology identity. Older consumers may use only name/offset. */
  readonly id?: string;
  readonly kind?: ExifDirectoryKind;
  readonly parentId?: string | null;
  readonly parentTag?: number;
  readonly depth?: number;
  readonly nextId?: string | null;
  readonly sharedOffset?: boolean;
  readonly associatedImage?: string | null;
}

/** Stable S04 directory node exposed by `ExifData.topology`. */
export interface ExifDirectory extends ExifIfd {
  readonly id: string;
  readonly kind: ExifDirectoryKind;
  readonly parentId: string | null;
  readonly depth: number;
  readonly nextId: string | null;
  readonly sharedOffset: boolean;
  readonly associatedImage: string | null;
}

export interface ExifTopology {
  readonly directories: readonly ExifDirectory[];
  readonly relations: readonly ExifDirectoryRelation[];
}

/** A bounded reference to an associated TIFF image payload. Pixel bytes are
 * intentionally not decoded by the metadata reader. */
export interface ExifAssociatedImage {
  readonly directoryId: string;
  readonly role: "thumbnail" | "preview" | "associated";
  readonly offset: number | null;
  readonly length: number | null;
  readonly mimeType: "image/jpeg" | "application/octet-stream";
}

export interface ExifData {
  readonly byteOrder: "little-endian" | "big-endian";
  /** Every safely decoded entry, including unknown tags. */
  readonly fields: readonly MetadataField[];
  readonly ifds: readonly ExifIfd[];
  /** Complete bounded directory graph. `ifds` remains as the compatibility view. */
  readonly topology?: ExifTopology;
  readonly associatedImages?: readonly ExifAssociatedImage[];
  /** Bounded embedded EXIF thumbnail bytes, when a valid thumbnail is present. */
  readonly thumbnail?: ExifThumbnail;
}

export interface ExifThumbnail {
  readonly data: Uint8Array;
  readonly mimeType: "image/jpeg" | "application/octet-stream";
}

export interface XmpData {
  readonly packets: readonly string[];
  /** Physical/logical source records aligned with `packets` when available. */
  readonly packetProvenance?: readonly XmpPacketProvenance[];
}

export type XmpPacketSourceKind = "embedded" | "extended-embedded" | "sidecar";

/** Source evidence for one retained XMP packet. */
export interface XmpPacketProvenance {
  readonly id: string;
  readonly source: XmpPacketSourceKind;
  readonly blockIds: readonly string[];
  readonly packetIndex: number;
  readonly offset: number | null;
  readonly length: number | null;
  readonly extendedGuid?: string;
  /** Sidecar path/identifier is caller-provided and never fetched by core APIs. */
  readonly sidecarId?: string;
}

/** JSON-safe lossless representation of an IPTC semantic value.  Structured
 * values intentionally retain array order, language alternatives, nested
 * resources and lexical forms rather than being flattened to a string. */
export type IptcSemanticPrimitive = null | boolean | number | string;
export type IptcSemanticValue =
  | IptcSemanticPrimitive
  | Uint8Array
  | readonly IptcSemanticValue[]
  | { readonly [key: string]: unknown };

export type IptcSemanticSourceKind = "iim" | "xmp";
export type IptcSemanticValidation = "valid" | "invalid" | "unsupported" | "unknown";

/** Evidence for one semantic candidate. Every candidate is retained even when
 * another source has the same property or a conflicting value. */
export interface IptcSemanticSource {
  readonly kind: IptcSemanticSourceKind;
  readonly family: "IPTC-IIM" | "XMP";
  readonly fieldId: string;
  readonly record?: number;
  readonly dataset?: number;
  readonly occurrence?: number;
  readonly namespaceUri?: string;
  readonly localName?: string;
  readonly qualifiedName?: string;
  readonly packetIndex?: number;
  readonly packetId?: string | null;
  readonly blockId?: string | null;
  readonly offset?: number | null;
  readonly length?: number | null;
  readonly language?: string | null;
}

export interface IptcSemanticCandidate {
  readonly value: IptcSemanticValue | null;
  readonly raw: IptcSemanticValue | null;
  readonly lexicalValue?: string | null;
  readonly source: IptcSemanticSource;
  readonly validation: IptcSemanticValidation;
  readonly mapping: string;
  readonly diagnostics: readonly string[];
}

export interface IptcSemanticConflict {
  readonly fieldId: string;
  readonly candidates: readonly IptcSemanticCandidate[];
  readonly reason: "different-values" | "duplicate-values" | "invalid-value";
}

export interface IptcSemanticField {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly schema: string | null;
  readonly datatype: string | null;
  readonly dataformat: string | null;
  readonly occurrence: string | null;
  readonly sensitivity: Sensitivity;
  /** Convenience value selected by the requested policy; candidates remain authoritative. */
  readonly value: IptcSemanticValue | null;
  readonly candidates: readonly IptcSemanticCandidate[];
  readonly conflicts: readonly IptcSemanticConflict[];
  readonly description: string;
  readonly sourceStandard: string;
  readonly sourceEdition: string;
}

export type IptcSemanticSelectionPolicy = "preserve-all" | "first" | "last";

export interface IptcSemanticData {
  readonly standard: string;
  readonly edition: string;
  readonly source: {
    readonly url: string;
    readonly sha256: string;
    readonly license: string;
    readonly previousEdition: string;
    readonly previousSha256: string;
    readonly addedInCurrentEdition: readonly string[];
    readonly removedSincePreviousEdition: readonly string[];
  };
  readonly fields: readonly IptcSemanticField[];
  readonly conflicts: readonly IptcSemanticConflict[];
  /** Bounded unknown IIM datasets and XMP properties retained with provenance. */
  readonly unknown: readonly IptcSemanticCandidate[];
  readonly diagnostics: readonly MetadataWarning[];
  readonly selectionPolicy: IptcSemanticSelectionPolicy;
  readonly complete: boolean;
}

export interface IptcData {
  readonly byteLength: number;
  readonly characterSet?: "latin1" | "utf-8" | "unknown";
  readonly fields?: readonly MetadataField[];
  /** Additive IPTC Photo Metadata semantic view. */
  readonly semantic?: IptcSemanticData;
  readonly diagnostics?: readonly MetadataWarning[];
}

/** Complete bounded IIM catalog used by the parser, including transport and
 * application datasets that do not have an IPTC Photo Metadata XMP mapping. */
export interface IptcIimDatasetDefinition {
  readonly id: string;
  /** Stable identity independent of a display label. */
  readonly stableIdentity: string;
  readonly record: number;
  readonly dataset: number;
  readonly name: string;
  readonly label: string;
  readonly description: string;
  readonly datatype: ExifDataType;
  readonly format: string;
  readonly minLength: number;
  readonly maxLength: number | null;
  readonly repeatable: boolean;
  readonly cardinality: "0..1" | "0..n";
  readonly required: boolean;
  readonly applicableVersions: readonly string[];
  readonly controlledValues: readonly string[];
  readonly structuredResource: string | null;
  readonly validationRules: readonly string[];
  readonly rawValueBehavior: string;
  /** Official IIM identity and any Photo Metadata XMP mapping. */
  readonly mappings: {
    readonly iim: { readonly record: number; readonly dataset: number; readonly id: string };
    readonly xmp: readonly { readonly namespaceUri: string; readonly localName: string; readonly id: string }[];
  };
  readonly standardVersion: string;
  readonly sensitivity: Sensitivity;
}

export interface IccData {
  readonly byteLength: number;
  readonly chunks: number;
  readonly complete: boolean;
  /** Bounded directory entries from a complete ICC profile. */
  readonly tags?: readonly IccTag[];
  readonly fields?: readonly MetadataField[];
  /** Bounded decoded standard ICC tag payloads. Unknown payloads remain ranges in `tags`. */
  readonly decodedTags?: readonly IccDecodedTag[];
}

export interface IccTag {
  readonly signature: string;
  readonly offset: number;
  readonly byteLength: number;
  readonly valid: boolean;
  /** Four-character payload type signature when the range contains a complete type header. */
  readonly typeSignature?: string | null;
  /** `shared` denotes an exactly shared payload range; partial overlaps are invalid. */
  readonly rangeStatus?: "unique" | "shared" | "overlap" | "invalid";
}

export type IccDecodedValue =
  | { readonly kind: "text"; readonly text: string; readonly encoding: "ascii" | "latin1" | "utf-16be"; readonly asciiText?: string; readonly unicodeText?: string; readonly scriptCode?: number }
  | { readonly kind: "mluc"; readonly values: readonly { readonly language: string; readonly country: string; readonly text: string }[] }
  | { readonly kind: "xyz"; readonly values: readonly { readonly x: number; readonly y: number; readonly z: number }[] }
  | { readonly kind: "curve"; readonly form: "identity" | "gamma" | "sampled"; readonly gamma?: number; readonly samples?: readonly number[] }
  | { readonly kind: "parametric-curve"; readonly functionType: number; readonly parameters: readonly number[] }
  | { readonly kind: "matrix"; readonly values: readonly number[] }
  | { readonly kind: "measurement"; readonly value: { readonly observer: number; readonly backing: { readonly x: number; readonly y: number; readonly z: number }; readonly geometry: number; readonly flare: number; readonly illuminant: number } }
  | { readonly kind: "viewing-conditions" | "colorant-order" | "colorant-table" | "signature" | "lut"; readonly value: Readonly<Record<string, unknown>> };

/** A decoded ICC tag retains its profile-relative source range and never owns an unbounded payload copy. */
export interface IccDecodedTag {
  readonly signature: string;
  readonly typeSignature: string;
  readonly offset: number;
  readonly byteLength: number;
  readonly status: "decoded" | "unknown" | "malformed" | "limited";
  readonly value: IccDecodedValue | null;
  readonly sharedWith: readonly string[];
}

export type PngTextChunkType = "tEXt" | "zTXt" | "iTXt";

export interface PngTextEntry {
  readonly type: PngTextChunkType;
  readonly keyword: string;
  readonly text: string;
  readonly language: string;
  readonly translatedKeyword: string;
  readonly compressed: boolean;
  /** Encoded text bytes from the chunk; zTXt/iTXt retains compressed bytes. */
  readonly raw: Uint8Array;
}

export interface JfifData {
  readonly version: string;
  readonly densityUnits: "none" | "dpi" | "dpcm" | "unknown";
  readonly xDensity: number;
  readonly yDensity: number;
}

export type MetadataBlockFamily = "EXIF" | "XMP" | "IPTC" | "ICC" | "JFIF" | "PNGText" | "MakerNote" | "Photoshop" | "MPF" | "Unknown";
export type MetadataBlockStatus = "decoded" | "partial" | "opaque" | "malformed" | "skipped";
export type MetadataCoverageState = "complete" | "partial" | "skipped-by-selection" | "unsupported" | "malformed" | "opaque";
export type MetadataCoverageReasonCode =
  | "REQUEST_SCOPE_LIMITED"
  | "PARSER_ERROR"
  | "UNSUPPORTED_FORMAT"
  | "BLOCK_SKIPPED_BY_SELECTION"
  | "BLOCK_PARTIAL"
  | "BLOCK_MALFORMED"
  | "BLOCK_OPAQUE"
  | "UNKNOWN_FORMAT"
  | "OPAQUE_JPEG_MARKER"
  | "TRAILING_BYTES"
  | "UNSUPPORTED_STRUCTURE"
  | WarningCode;

export interface MetadataCoverageReason {
  readonly code: MetadataCoverageReasonCode;
  readonly message: string;
}

export interface MetadataBlockRelationship {
  readonly type: ExifDirectoryRelationType | "component";
  readonly sourceBlockId: string;
  readonly targetBlockId: string;
  readonly tag?: number;
}

/** Separates the requested operation's result from whole-file privacy knowledge. */
export interface MetadataCoverage {
  readonly requested: MetadataCoverageState;
  readonly wholeFile: MetadataCoverageState;
  readonly reasons: readonly MetadataCoverageReason[];
  /** IDs of metadata-bearing blocks not fully classified for the whole file. */
  readonly unclassifiedBlockIds: readonly string[];
}

/** A provenance record for one recognized or opaque metadata-bearing source. */
export interface MetadataBlock {
  readonly id: string;
  readonly family: MetadataBlockFamily;
  readonly container: string;
  readonly status: MetadataBlockStatus;
  /** Normalized coverage meaning of `status` for policy and privacy consumers. */
  readonly coverage?: MetadataCoverageState;
  readonly offset: number | null;
  readonly length: number | null;
  readonly associatedImage: string | null;
  readonly sensitivity: Sensitivity;
  readonly warningCodes: readonly WarningCode[];
  /** Component blocks contributing to an assembled logical metadata value. */
  readonly relatedBlockIds?: readonly string[];
  /** Optional directory identity for directory-scoped EXIF blocks. */
  readonly directoryId?: string;
  readonly role?: ExifDirectoryKind;
  readonly parentBlockId?: string | null;
  readonly relationships?: readonly MetadataBlockRelationship[];
}

export interface MetadataResult {
  readonly format: ImageFormat;
  readonly mimeType: ImageMimeType;
  readonly dimensions: ImageDimensions | null;
  /** Additive, provenance-preserving common image/container detail view. */
  readonly details?: ImageDetails;
  /** Display-space dimensions after a HEIF/AVIF rotation transform. */
  readonly displayDimensions?: ImageDimensions;
  /** HEIF/AVIF item transform; absent for containers without item transforms. */
  readonly transform?: ImageTransform;
  /** HEIF/AVIF primary-item `nclx` colour parameters, when present. */
  readonly nclx?: NclxColorData;
  /** Common, normalized fields. Raw EXIF entries remain in `exif.fields`. */
  readonly fields: readonly MetadataField[];
  /** Typed EXIF interpretations derived from one or more retained fields. */
  readonly composites?: ExifCompositeSet;
  readonly exif: ExifData | null;
  readonly xmp: XmpData | null;
  readonly iptc: IptcData | null;
  /** IPTC Photo Metadata semantic view, including XMP-only candidates. */
  readonly iptcSemantic?: IptcSemanticData;
  readonly icc: IccData | null;
  readonly jfif: JfifData | null;
  /** Bounded PNG textual chunks, when parsing a PNG input. */
  readonly pngText: readonly PngTextEntry[];
  /** Recognized metadata sources with family-level provenance and inspection status. */
  readonly blocks: readonly MetadataBlock[];
  /** Requested-scope and whole-file inspection coverage. */
  readonly coverage: MetadataCoverage;
  /** Whether this result covers the requested inspection scope without parser errors. */
  readonly completeness: ParseCompleteness;
  /** Read telemetry for range-backed inputs. Absent for direct in-memory parses. */
  readonly telemetry?: ReadTelemetry;
  readonly warnings: readonly MetadataWarning[];
}

/** Bounded range-read evidence collected by a ByteSource. */
export interface ReadTelemetry {
  readonly readRequests: number;
  readonly bytesRead: number;
  readonly cacheHits: number;
  readonly coalescedReads: number;
  readonly cacheBytes: number;
  /** Transport evidence attached by the explicit HTTP entry point. */
  readonly http?: HttpReadTelemetry;
}

/**
 * Bounded transport evidence for an HTTP-backed metadata read. Both byte
 * counters describe bytes consumed from Fetch response bodies; the decoded
 * counter is the post-fetch representation made available to the local source
 * and is kept separate so runtimes can report transport decoding accurately.
 */
export interface HttpReadTelemetry {
  readonly requestCount: number;
  readonly rangeRequestCount: number;
  readonly fullResponseRequestCount: number;
  readonly responseBytes: number;
  readonly decodedBytes: number;
  readonly cacheHits: number;
  readonly coalescedReads: number;
  readonly fallbackReason: HttpFallbackReason | null;
  /** `range` means validated byte ranges; `full` means one complete response; `fallback` means policy-authorized full response after range failure. */
  readonly mode: "range" | "full" | "fallback";
  readonly rangeSupported: boolean;
  readonly complete: boolean;
  readonly totalBytes: number;
  readonly validator: string | null;
  readonly requestedUrl: string;
  readonly redirected: boolean;
  readonly finalUrl: string;
  readonly warnings: readonly string[];
}

export type HttpFallbackReason =
  | "range-ignored"
  | "compressed-response"
  | "invalid-range-response"
  | "missing-validator"
  | "range-status"
  | "full-response-limit";

/** Describes how much of an input was inspected and whether a range scope was used. */
export interface ParseCompleteness {
  readonly complete: boolean;
  readonly scope: "full" | "partial";
  readonly reasons: readonly string[];
  /** Number of source bytes materialized when a range-based scope was used. */
  readonly bytesRead?: number;
  /** Declared source size when the input was a Blob or File. */
  readonly inputBytes?: number;
}

/** Internal parser result before the public completeness annotation is added. */
/** Parser result before common completeness is attached. Parsers may provide
 * source-level provenance while older container readers are migrated. */
export type ParsedMetadataResult = Omit<MetadataResult, "completeness" | "blocks" | "coverage"> & {
  readonly blocks?: readonly MetadataBlock[];
};

export interface SecurityLimits {
  readonly maxInputBytes: number;
  readonly maxMetadataBytes: number;
  readonly maxSegmentBytes: number;
  readonly maxSegments: number;
  readonly maxIfdEntries: number;
  readonly maxIfdDepth: number;
  readonly maxValueBytes: number;
  readonly maxStringBytes: number;
  readonly maxPngChunks: number;
  readonly maxDecompressedBytes: number;
  /** Cumulative decoded output budget for compressed metadata chunks. */
  readonly maxDecompressedMetadataBytes: number;
  /** Maximum underlying range reads performed by a ByteSource. */
  readonly maxReadRequests: number;
  /** Maximum cumulative bytes fetched by a ByteSource. */
  readonly maxReadBytes: number;
  /** Maximum bytes retained by a ByteSource's LRU range cache. */
  readonly maxReadCacheBytes: number;
  /** Maximum XML/RDF nodes retained while decoding structured XMP. */
  readonly maxXmpNodes: number;
  /** Maximum XML attributes inspected while decoding structured XMP. */
  readonly maxXmpAttributes: number;
  /** Maximum namespace declarations retained in one XMP packet. */
  readonly maxXmpNamespaces: number;
  /** Maximum XML/RDF nesting depth in one XMP packet. */
  readonly maxXmpDepth: number;
  /** Maximum decoded text bytes retained in one XMP packet. */
  readonly maxXmpTextBytes: number;
  /** Maximum RDF property occurrences retained in one XMP packet. */
  readonly maxXmpProperties: number;
  /** Maximum items in one RDF array. */
  readonly maxXmpArrayItems: number;
  /** Maximum property/value qualifiers retained in one XMP packet. */
  readonly maxXmpQualifiers: number;
  /** Maximum packet candidates accepted by an XMP merge. */
  readonly maxXmpPackets: number;
  /** Maximum estimated bytes retained by a structured XMP result. */
  readonly maxXmpOutputBytes: number;
  /** Maximum IPTC-IIM datasets decoded across all resources. */
  readonly maxIptcDatasets: number;
  /** Maximum semantic candidates retained across IIM and XMP. */
  readonly maxIptcCandidates: number;
  /** Maximum nested IPTC semantic output depth. */
  readonly maxIptcStructureDepth: number;
  /** Maximum estimated bytes retained by the IPTC semantic view. */
  readonly maxIptcOutputBytes: number;
  /** Maximum ICC tag payloads decoded from one complete profile. */
  readonly maxIccDecodedTags: number;
  /** Maximum localized strings or curve samples retained from one ICC profile. */
  readonly maxIccElements: number;
  /** Maximum estimated decoded ICC output bytes retained from one profile. */
  readonly maxIccOutputBytes: number;
  /** Maximum retained candidates in the common image-details view. */
  readonly maxImageDetailCandidates: number;
  /** Maximum animation frames retained in the common image-details view. */
  readonly maxImageDetailFrames: number;
  /** Maximum image relationships retained in the common image-details view. */
  readonly maxImageDetailRelationships: number;
  /** Maximum values returned or retained by an output adapter operation. */
  readonly maxAdapterItems: number;
  /** Maximum estimated bytes retained by one output adapter result. */
  readonly maxAdapterOutputBytes: number;
  readonly maxWarnings: number;
}

/** Metadata families that can be requested independently during parsing. */
export type MetadataGroup = "Dimensions" | "EXIF" | "XMP" | "IPTC" | "ICC" | "JFIF" | "PNGText" | "Transform" | "Nclx";

/**
 * Limits decoding work to requested metadata families. `tags` applies to EXIF
 * field names (for example `Make` or `DateTimeOriginal`) and stable field IDs
 * such as `IFD0:0x010f`.
 */
export interface MetadataSelection {
  readonly groups?: readonly MetadataGroup[];
  readonly tags?: readonly string[];
}

export interface ParseOptions {
  readonly limits?: Partial<SecurityLimits>;
  /** Abort before or between asynchronous parsing stages. */
  readonly signal?: AbortSignal;
  /** Decode only selected metadata families or EXIF tags. Omitted means all supported metadata. */
  readonly select?: MetadataSelection;
  /** Stop after JPEG headers and metadata before entropy-coded image data. */
  readonly scope?: "full" | "jpeg-header" | "metadata";
  /** Immutable field vocabulary used for EXIF names, descriptions, and sensitivity. */
  readonly registry?: MetadataRegistry | readonly MetadataRegistryFieldInput[] | { readonly fields: readonly MetadataRegistryFieldInput[]; readonly sources?: readonly MetadataRegistrySource[] };
  /** Controls whether ambiguous or invalid composite derivations are withheld. */
  readonly normalization?: NormalizationMode;
}

/** Options for bounded-concurrency parsing of an ordered input collection. */
export interface ParseManyOptions extends ParseOptions {
  /** Maximum simultaneous parses. Defaults to 4. */
  readonly concurrency?: number;
}

export type RedactionTarget =
  | "AllMetadata"
  | "EXIF"
  | "XMP"
  | "PNGText"
  | "IPTC"
  | "ICC"
  | "JFIF"
  | "GPS"
  | "SerialNumber"
  | "Make"
  | "Model"
  | "Orientation"
  | "DateTime"
  | "DateTimeOriginal"
  | "ExposureTime"
  | "FNumber"
  | "ISOSpeedRatings"
  | "Flash"
  | "FocalLength"
  | "GPSLatitude"
  | "GPSLongitude"
  | "GPSAltitude"
  | "Copyright"
  | "Artist"
  | "Software";

export interface RedactOptions {
  readonly remove: readonly RedactionTarget[];
  readonly preserve?: readonly RedactionTarget[];
  readonly limits?: Partial<SecurityLimits>;
  readonly signal?: AbortSignal;
}

export interface RedactionRecord {
  readonly target: RedactionTarget;
  readonly occurrences: number;
}

export interface RedactionResult {
  readonly data: Uint8Array;
  readonly format: ImageFormat;
  readonly removed: readonly RedactionRecord[];
  /** A machine-readable account of whether the requested operation was fulfilled. */
  readonly outcome: RedactionOutcome;
  readonly warnings: readonly MetadataWarning[];
}

/** Internal surgery result before the public outcome annotation is added. */
export type SurgeryResult = Omit<RedactionResult, "outcome">;

export interface RedactionOutcome {
  /** All requested supported removals were applied without an error warning. */
  readonly successful: boolean;
  /** The operation inspected and handled every structure covered by its policy. */
  readonly complete: boolean;
  /** Requested targets that could not be applied. */
  readonly unapplied: readonly RedactionTarget[];
  /** Human-readable explanations for an unsuccessful operation. */
  readonly reasons: readonly string[];
}

export interface SanitizeOptions {
  readonly limits?: Partial<SecurityLimits>;
  readonly signal?: AbortSignal;
  /** Retain an ICC profile when it is present. Defaults to true. */
  readonly preserveColorProfile?: boolean;
  /** Retain EXIF orientation when selective EXIF surgery is available. Defaults to true. */
  readonly preserveOrientation?: boolean;
}

export interface PrivacyAuditOptions {
  readonly limits?: Partial<SecurityLimits>;
  readonly signal?: AbortSignal;
}

/** Machine-readable policy outcomes emitted by the privacy audit. */
export type PrivacyReasonCode = MetadataCoverageReasonCode | "SENSITIVE_METADATA_PRESENT" | "RAW_XMP";

interface SanitizationResultBase {
  readonly format: ImageFormat;
  readonly retained: readonly RedactionTarget[];
  readonly warnings: readonly MetadataWarning[];
  readonly reasons: readonly string[];
  readonly reasonCodes?: readonly PrivacyReasonCode[];
}

export interface SuccessfulSanitizationResult extends SanitizationResultBase {
  readonly successful: true;
  /** Bytes are supplied only when the requested policy was fully satisfied. */
  readonly data: Uint8Array;
}

export interface FailedSanitizationResult extends SanitizationResultBase {
  readonly successful: false;
  readonly data: null;
}

export type SanitizationResult = SuccessfulSanitizationResult | FailedSanitizationResult;

export class MetadataError extends Error {
  public readonly code: WarningCode;

  public constructor(code: WarningCode, message: string) {
    super(message);
    this.name = "MetadataError";
    this.code = code;
  }
}
