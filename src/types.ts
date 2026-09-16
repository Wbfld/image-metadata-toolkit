/** Binary inputs accepted in browsers, workers, Node.js, and Deno. */
import type { MetadataRegistry, MetadataRegistryFieldInput, MetadataRegistrySource } from "./registry.js";
import type { PrivacyPolicyReport } from "./privacy/policies.js";

export type MetadataInput = ArrayBuffer | ArrayBufferView | Blob;

export type ImageFormat = "jpeg" | "png" | "tiff" | "webp" | "gif" | "jxl" | "heif" | "avif" | "cr3" | "raf" | "svg" | "unknown";

/** Physical container identity. A TIFF-derived RAW file remains a TIFF
 * container while its camera-file kind is retained separately. */
export type ImageContainer = "jpeg" | "png" | "tiff" | "bigtiff" | "webp" | "gif" | "jxl" | "iso-bmff" | "raf" | "svg" | "unknown";

/** Recognized TIFF-derived camera-file variants. `tiff` and `bigtiff` retain
 * the compatibility identity for ordinary TIFF inputs. */
export type ImageFileKind = ImageFormat | "dng" | "cr2" | "nef" | "arw" | "orf" | "rw2" | "iiq" | "bigtiff";

export type ImageMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/tiff"
  | "image/webp"
  | "image/gif"
  | "image/jxl"
  | "image/heif"
  | "image/avif"
  | "image/x-canon-cr3"
  | "image/x-fuji-raf"
  | "image/svg+xml"
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

/** How an HEIF/AVIF item obtains its bytes from the ISO Base Media File Format. */
export type HeifItemConstructionMode = "file" | "idat" | "item-offset" | "unsupported";

/** A data-reference entry retained without dereferencing external resources. */
export interface HeifDataReference {
  readonly index: number;
  readonly type: "url" | "urn" | "unknown";
  readonly selfContained: boolean;
  readonly resolvable: boolean;
  readonly sourceOffset: number;
  readonly byteLength: number;
}

/** One extent in an `iloc` item location. Offsets are source-relative and are
 * never interpreted as pixel coordinates. */
export interface HeifItemExtent {
  readonly index: number | null;
  readonly offset: number;
  readonly length: number;
  readonly source: "file" | "idat" | "item-offset" | "unsupported";
  readonly absoluteOffset: number | null;
  readonly sourceItemId: number | null;
  readonly resolved: boolean;
}

/** A property association retains both its property index and essential bit. */
export interface HeifItemPropertyReference {
  readonly propertyIndex: number;
  readonly essential: boolean;
}

/** Bounded structural facts for a parsed HEIF/AVIF item property. `essential`
 * is true when at least one retained item association marks this property as
 * essential; per-item essentiality is retained in `HeifItemGraph.items[].properties`. */
export interface HeifItemProperty {
  readonly index: number;
  readonly type: string;
  readonly essential: boolean;
  readonly sourceOffset: number;
  readonly byteLength: number;
  readonly dimensions?: ImageDimensions;
  readonly auxiliaryType?: string;
  readonly auxiliarySubtypes?: readonly number[];
}

/** A resolved or intentionally non-resolved item location. */
export interface HeifItemLocation {
  readonly constructionMethod: HeifItemConstructionMode;
  readonly dataReferenceIndex: number;
  readonly dataReference: HeifDataReference | null;
  readonly baseOffset: number;
  readonly extents: readonly HeifItemExtent[];
  readonly resolvedByteLength: number | null;
  readonly resolution: "resolved" | "empty" | "external" | "unsupported" | "malformed";
}

export type HeifItemRelationshipType = "thumbnail" | "auxiliary" | "derived" | "describes" | "overlay-input" | "item-offset" | "unknown";

/** Ordered directed relationship between two item IDs in one MetaBox. */
export interface HeifItemRelationship {
  readonly type: HeifItemRelationshipType;
  readonly referenceType: string;
  readonly sourceItemId: number;
  readonly targetItemId: number;
  readonly order: number;
  readonly sourceOffset: number;
  readonly byteLength: number;
}

/** Bounded item graph for one or more HEIF/AVIF MetaBoxes. */
export interface HeifItemGraph {
  readonly metaOffset: number;
  readonly primaryItemId: number | null;
  readonly items: readonly {
    readonly id: number;
    readonly type: string;
    readonly name: string | null;
    readonly contentType: string | null;
    readonly contentEncoding: string | null;
    readonly hidden: boolean;
    readonly location: HeifItemLocation | null;
    readonly properties: readonly HeifItemPropertyReference[];
    readonly dimensions: ImageDimensions | null;
    readonly derived?: {
      readonly type: "grid" | "overlay" | "identity" | "unknown";
      readonly outputWidth: number | null;
      readonly outputHeight: number | null;
      readonly rows?: number;
      readonly columns?: number;
      readonly referenceCount: number;
      readonly offsets?: readonly { readonly horizontal: number; readonly vertical: number }[];
    };
    readonly roles: readonly ("primary" | "thumbnail" | "auxiliary" | "derived" | "metadata" | "unknown")[];
  }[];
  readonly properties: readonly HeifItemProperty[];
  readonly dataReferences: readonly HeifDataReference[];
  readonly relationships: readonly HeifItemRelationship[];
  readonly complete: boolean;
}

/** The ISO BMFF handler class retained for a HEIF/AVIF sequence track. */
export type HeifSequenceTrackKind = "picture" | "auxiliary" | "metadata" | "unknown";

/** Matrix and normalized orientation facts from a track header. */
export interface HeifSequenceTransformation {
  readonly matrix: readonly number[];
  /** Present only when the matrix is one of the unambiguous orthogonal forms. */
  readonly orientation: ImageTransform | null;
}

/** One sample description entry from a track's `stsd` box. */
export interface HeifSequenceSampleDescription {
  readonly index: number;
  readonly format: string;
  readonly dataReferenceIndex: number | null;
  readonly dimensions: ImageDimensions | null;
  readonly codecConfigurationTypes: readonly string[];
  readonly sourceOffset: number;
  readonly byteLength: number;
}

/** A track reference is retained without assigning semantic meaning to an unknown type. */
export interface HeifSequenceTrackReference {
  readonly type: string;
  readonly targetTrackIds: readonly number[];
  readonly sourceOffset: number;
  readonly byteLength: number;
}

/** A bounded edit-list entry in track media time units. */
export interface HeifSequenceEdit {
  readonly segmentDuration: number;
  readonly mediaTime: number | null;
  readonly mediaRate: number | null;
  readonly sourceOffset: number;
  readonly byteLength: number;
}

/** One independently addressable sample; no sample payload is decoded or copied. */
export interface HeifSequenceSample {
  readonly index: number;
  readonly descriptionIndex: number | null;
  readonly byteLength: number | null;
  readonly offset: number | null;
  readonly decodeTime: number | null;
  readonly compositionTime: number | null;
  readonly duration: number | null;
  readonly sync: boolean | null;
  readonly sourceOffset: number;
  readonly sourceByteLength: number;
  readonly fragmentOffset: number | null;
}

/** Explicit item/track metadata linkage, retaining unresolved item associations. */
export interface HeifSequenceMetadataAssociation {
  readonly relationshipType: string;
  readonly sourceItemId: number | null;
  readonly targetItemId: number | null;
  readonly sourceTrackId: number | null;
  readonly targetTrackId: number | null;
  readonly sourceOffset: number;
  readonly byteLength: number;
  readonly resolved: boolean;
}

/** One independently addressable HEIF/AVIF image-sequence track. */
export interface HeifSequenceTrack {
  readonly id: number;
  readonly kind: HeifSequenceTrackKind;
  readonly handlerType: string | null;
  readonly handlerName: string | null;
  readonly timescale: number | null;
  readonly duration: number | null;
  readonly language: string | null;
  readonly dimensions: ImageDimensions | null;
  readonly transformation: HeifSequenceTransformation | null;
  readonly sampleDescriptions: readonly HeifSequenceSampleDescription[];
  readonly samples: readonly HeifSequenceSample[];
  readonly references: readonly HeifSequenceTrackReference[];
  readonly edits: readonly HeifSequenceEdit[];
  readonly associatedTrackIds: readonly number[];
  readonly metadataTrackIds: readonly number[];
  readonly sourceOffset: number;
  readonly byteLength: number;
  readonly complete: boolean;
}

/** A bounded movie/fragment sequence view. Item metadata remains in `heif`. */
export interface HeifSequence {
  readonly sourceOffset: number;
  readonly byteLength: number;
  readonly timescale: number | null;
  readonly duration: number | null;
  readonly fragmented: boolean;
  readonly tracks: readonly HeifSequenceTrack[];
  readonly primaryTrackId: number | null;
  readonly primaryTrackCandidates: readonly number[];
  readonly primarySelection: "sole-picture-track" | "ambiguous-picture-tracks" | "no-picture-track";
  readonly metadataItemIds: readonly number[];
  readonly metadataAssociations: readonly HeifSequenceMetadataAssociation[];
  readonly complete: boolean;
}

/** A bounded source range in a non-TIFF RAW container. The payload is never
 * decoded here; only its validated identity, range, role, and associations
 * are retained. */
export type RawPhaseTwoRangeRole = "preview" | "thumbnail" | "metadata" | "raw" | "cfa" | "image" | "unknown";
export type RawPhaseTwoRangeFormat = "jpeg" | "tiff" | "iso-bmff" | "raw" | "unknown";
export type RawPhaseTwoRangeStatus = "valid" | "malformed" | "out-of-bounds" | "overlap" | "unsupported" | "truncated";

export interface RawPhaseTwoRange {
  readonly id: string;
  readonly role: RawPhaseTwoRangeRole;
  readonly format: RawPhaseTwoRangeFormat;
  readonly offset: number | null;
  readonly length: number | null;
  readonly source: string;
  readonly dimensions: ImageDimensions | null;
  readonly associatedItemId: number | null;
  readonly associatedTrackId: number | null;
  readonly status: RawPhaseTwoRangeStatus;
}

export type RawPhaseTwoDiagnosticCode = "MALFORMED_STRUCTURE" | "UNSAFE_RANGE" | "LIMIT_EXCEEDED" | "AMBIGUOUS_PRIMARY" | "DUPLICATE_RANGE" | "OVERLAPPING_RANGE" | "TRUNCATED_DATA" | "UNSUPPORTED_STRUCTURE";

export interface RawPhaseTwoDiagnostic {
  readonly code: RawPhaseTwoDiagnosticCode;
  readonly detail: string;
  readonly offset: number | null;
  readonly length?: number;
}

/** A CR3 ISO-BMFF box identity retained independently from generic HEIF item
 * metadata. UUID payloads are indexed but not interpreted as a complete Canon
 * private schema. */
export interface Cr3BoxReference {
  readonly id: string;
  readonly type: string;
  readonly offset: number;
  readonly length: number;
  readonly payloadOffset: number;
  readonly parentOffset: number | null;
  readonly uuid: string | null;
  readonly status: "valid" | "truncated" | "unsupported";
}

export interface Cr3ContainerData {
  readonly kind: "cr3";
  readonly container: "iso-bmff";
  readonly signature: "crx";
  readonly majorBrand: string;
  readonly compatibleBrands: readonly string[];
  readonly boxes: readonly Cr3BoxReference[];
  /** Full B02/B03 graphs are retained rather than reduced to one primary. */
  readonly itemGraphs: readonly HeifItemGraph[];
  readonly sequences: readonly HeifSequence[];
  readonly primaryItemCandidates: readonly number[];
  readonly primaryTrackCandidates: readonly number[];
  readonly primarySelection: "unambiguous" | "ambiguous" | "none";
  readonly ranges: readonly RawPhaseTwoRange[];
  readonly metadataRanges: readonly RawPhaseTwoRange[];
  readonly previewRanges: readonly RawPhaseTwoRange[];
  readonly rawRanges: readonly RawPhaseTwoRange[];
  readonly opaqueStructures: readonly RawPhaseTwoRange[];
  readonly complete: boolean;
  readonly diagnostics: readonly RawPhaseTwoDiagnostic[];
}

export interface RafDirectoryRange {
  readonly offset: number | null;
  readonly length: number | null;
  readonly status: RawPhaseTwoRangeStatus;
}

export interface RafDirectory {
  readonly offset: number;
  readonly byteLength: number;
  readonly version: string | null;
  readonly preview: RafDirectoryRange;
  readonly metadata: RafDirectoryRange;
  readonly raw: RafDirectoryRange;
  readonly complete: boolean;
}

export interface RafContainerData {
  readonly kind: "raf";
  readonly container: "raf";
  readonly signature: "FUJIFILMCCD-RAW ";
  readonly version: string | null;
  readonly camera: string | null;
  readonly directory: RafDirectory | null;
  readonly ranges: readonly RawPhaseTwoRange[];
  readonly previewRanges: readonly RawPhaseTwoRange[];
  readonly metadataRanges: readonly RawPhaseTwoRange[];
  readonly rawRanges: readonly RawPhaseTwoRange[];
  readonly opaqueStructures: readonly RawPhaseTwoRange[];
  readonly complete: boolean;
  readonly diagnostics: readonly RawPhaseTwoDiagnostic[];
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
  | "MALFORMED_CR3"
  | "MALFORMED_RAF"
  | "MALFORMED_MPF"
  | "MALFORMED_ULTRA_HDR"
  | "MALFORMED_PHOTOSHOP"
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

/** Stable byte-order declarations used by explicit MakerNote plugins. */
export type MakerNoteByteOrder = "little-endian" | "big-endian" | "from-note" | "unknown";

/** The coordinate system a plugin uses when resolving an embedded offset. */
export type MakerNoteBaseOffsetRule = "note-start" | "tiff-start" | "file-start" | "absolute" | "declared-by-detection";

export type MakerNoteNestedIfdBehavior = "none" | "bounded" | "vendor-defined";
export type MakerNoteEncryptionStatus = "none" | "encrypted" | "obfuscated" | "conditionally-protected" | "unknown";

export type MakerNoteStatus =
  | "detected-decoded"
  | "detected-opaque"
  | "low-confidence"
  | "unknown"
  | "encrypted"
  | "obfuscated"
  | "malformed"
  | "unsupported"
  | "rejected"
  | "aborted"
  | "limit-exceeded";

export type MakerNoteDiagnosticCode =
  | "PLUGIN_INVALID"
  | "PLUGIN_THROWN"
  | "PLUGIN_REJECTED"
  | "LOW_CONFIDENCE"
  | "UNKNOWN_NOTE"
  | "AMBIGUOUS_DETECTION"
  | "UNSAFE_RANGE"
  | "UNSAFE_BASE_OFFSET"
  | "MALFORMED_NOTE"
  | "ENCRYPTED_NOTE"
  | "OBFUSCATED_NOTE"
  | "UNSUPPORTED_NOTE"
  | "LIMIT_EXCEEDED"
  | "ABORTED"
  | "DUPLICATE_DEFINITION"
  | "CONTRADICTORY_DEFINITION";

export interface MakerNoteDetectionEvidence {
  readonly kind: "signature" | "structure" | "byte-order" | "base-offset" | "vendor-marker";
  readonly offset: number;
  readonly length: number;
  readonly description: string;
}

export interface MakerNoteDetection {
  readonly confidence: number;
  readonly evidence: readonly MakerNoteDetectionEvidence[];
  readonly byteOrder: MakerNoteByteOrder;
  readonly baseOffsetRule: MakerNoteBaseOffsetRule;
  readonly status?: "detected" | "low-confidence" | "opaque";
}

export interface MakerNoteTagDefinition {
  readonly id: string;
  readonly tag: number;
  readonly name: string;
  readonly label: string;
  readonly description: string;
  readonly type: ExifDataType;
  readonly unit?: string;
  readonly enumValues?: Readonly<Record<string, string>>;
  readonly repeatable: boolean;
  readonly applicableModels?: readonly string[];
  readonly applicableVersions?: readonly string[];
  readonly sensitivity: Sensitivity;
  readonly validation?: string;
  readonly rawValueBehavior: "retain" | "opaque" | "omit";
  readonly source?: string;
}

/** A pinned, human-auditable source used to derive one explicit MakerNote pack. */
export interface MakerNoteSourceReference {
  readonly id: string;
  readonly url: string;
  readonly version: string;
  readonly license: string;
  readonly retrievedAt: string;
  readonly sha256: string;
  readonly role: "format" | "vendor" | "fixture" | "oracle";
}

export interface MakerNotePluginIdentity {
  readonly id: string;
  readonly version: string;
  readonly vendor: string;
  readonly noteFamily: string;
  readonly supportedModels?: readonly string[];
  readonly supportedVersions?: readonly string[];
  readonly minimumConfidence: number;
  readonly signatureTests: readonly string[];
  readonly byteOrder: MakerNoteByteOrder;
  readonly baseOffsetRule: MakerNoteBaseOffsetRule;
  readonly nestedIfd: MakerNoteNestedIfdBehavior;
  readonly encryption: MakerNoteEncryptionStatus;
  readonly tagRegistry: readonly MakerNoteTagDefinition[];
  readonly securityRequirements: readonly string[];
  readonly sources?: readonly MakerNoteSourceReference[];
}

export interface MakerNoteProvenance {
  readonly noteOffset: number;
  readonly noteLength: number;
  readonly sourceLength: number;
  readonly blockId: string;
  readonly fieldId: string;
  readonly noteRelativeOffset: number;
  /** Length of the specific field/range represented by this provenance. */
  readonly rangeLength: number;
  readonly originalFileOffset: number | null;
  readonly originalFileLength: number;
  readonly offsetBase: MakerNoteBaseOffsetRule;
}

export interface MakerNoteField {
  readonly id: string;
  readonly tag: number;
  readonly name: string;
  readonly label: string;
  readonly description: string;
  readonly type: ExifDataType;
  readonly raw: MetadataValue;
  readonly value: MetadataValue;
  readonly display: string;
  readonly sensitivity: Sensitivity;
  readonly count: number;
  readonly known: boolean;
  readonly unit?: string;
  readonly enumName?: string;
  readonly provenance: MakerNoteProvenance;
}

export interface MakerNoteOpaqueRange {
  readonly id: string;
  readonly noteRelativeOffset: number;
  readonly originalFileOffset: number | null;
  readonly length: number;
  readonly reason: "unknown" | "encrypted" | "obfuscated" | "unsupported" | "malformed" | "limit-exceeded";
  readonly provenance: MakerNoteProvenance;
}

export interface MakerNoteDiagnostic {
  readonly code: MakerNoteDiagnosticCode;
  readonly message: string;
  readonly pluginId?: string;
  readonly noteId?: string;
  readonly noteRelativeOffset?: number;
  readonly originalFileOffset?: number | null;
  readonly length?: number;
}

export interface MakerNoteNote {
  readonly id: string;
  readonly fieldId: string;
  readonly byteLength: number;
  readonly status: MakerNoteStatus;
  readonly plugin: MakerNotePluginIdentity | null;
  readonly detection: MakerNoteDetection | null;
  readonly provenance: MakerNoteProvenance;
  readonly fields: readonly MakerNoteField[];
  readonly opaqueRanges: readonly MakerNoteOpaqueRange[];
  readonly diagnostics: readonly MakerNoteDiagnostic[];
}

export interface MakerNoteContainerData {
  readonly notes: readonly MakerNoteNote[];
  readonly complete: boolean;
  readonly diagnostics: readonly MakerNoteDiagnostic[];
}

export type RawPayloadFormat = "raw" | "jpeg" | "tiff" | "bigtiff" | "unknown";
export type RawPayloadRole = "raw" | "preview" | "thumbnail" | "metadata" | "unknown";

/** One bounded source range belonging to a RAW or embedded image payload.
 * The bytes themselves are intentionally not retained or decoded. */
export interface RawPayloadReference {
  readonly id: string;
  readonly role: RawPayloadRole;
  readonly format: RawPayloadFormat;
  readonly offset: number | null;
  readonly length: number | null;
  readonly dimensions: ImageDimensions | null;
  readonly sourceDirectoryId: string | null;
  readonly sourceTags: readonly number[];
  readonly provenance: "tiff-offset-count" | "tiff-jpeg-offset-length" | "directory-only";
  readonly status: "valid" | "malformed" | "unknown" | "out-of-bounds";
}

/** Bounded, provenance-preserving RAW container inventory. This is metadata
 * inspection only: no sensor samples or compressed RAW pixels are decoded. */
export interface RawContainerData {
  readonly kind: Exclude<ImageFileKind, ImageFormat | "bigtiff">;
  readonly container: Extract<ImageContainer, "tiff" | "bigtiff">;
  readonly detection: "structural-signature" | "structural-directory";
  readonly signature: string;
  readonly rawPayloads: readonly RawPayloadReference[];
  readonly previews: readonly RawPayloadReference[];
  readonly thumbnails: readonly RawPayloadReference[];
  readonly opaquePayloads: readonly RawPayloadReference[];
  readonly complete: boolean;
  readonly diagnostics: readonly { readonly code: "MALFORMED_STRUCTURE" | "UNSAFE_RANGE" | "LIMIT_EXCEEDED" | "AMBIGUOUS_VARIANT"; readonly detail: string; readonly offset: number | null }[];
}

export interface ExifThumbnail {
  readonly data: Uint8Array;
  readonly mimeType: "image/jpeg" | "application/octet-stream";
}

/** TIFF serialization byte order. */
export type TiffByteOrder = "little-endian" | "big-endian";

/** TIFF directory container variant. */
export type TiffVariant = "classic" | "big-tiff";

/** A bounded integer accepted by an 8-byte TIFF field. Large values retain
 * their decimal lexical form so callers cannot accidentally round them. */
export type TiffInteger = number | Integer64Value;

/** Explicit value forms prevent ambiguous coercion during serialization. */
export type TiffEntryValue =
  | { readonly kind: "raw"; readonly bytes: Uint8Array; readonly count?: number }
  | { readonly kind: "text"; readonly value: string; readonly nulTerminated?: boolean }
  | { readonly kind: "numbers"; readonly values: readonly TiffInteger[] }
  | { readonly kind: "rationals"; readonly values: readonly RationalValue[] }
  | { readonly kind: "floats"; readonly values: readonly number[] }
  | { readonly kind: "directory-references"; readonly directoryIds: readonly string[] }
  | { readonly kind: "data-references"; readonly dataIds: readonly string[] };

/** One TIFF directory entry in the reusable serializer graph. */
export interface TiffGraphEntry {
  /** Caller-stable identity. Parsed graphs always provide one. */
  readonly id?: string;
  readonly tag: number;
  readonly type: ExifDataType;
  /** Original numeric type code for UNKNOWN or extension values. */
  readonly typeCode?: number;
  readonly value: TiffEntryValue;
  /** Original count for raw values; derived from the value for new entries. */
  readonly count?: number;
  /** Source locations are evidence only and are not trusted as output offsets. */
  readonly source?: { readonly entryOffset: number; readonly valueOffset: number; readonly valueLength: number };
}

/** A relocatable opaque payload referenced by offset/length TIFF fields. */
export interface TiffPreservedData {
  readonly id: string;
  readonly sourceOffset: number;
  readonly data: Uint8Array;
  readonly kind: "thumbnail" | "image-data" | "opaque";
}

/** A complete bounded TIFF/EXIF directory graph. */
export interface TiffGraphDirectory {
  readonly id: string;
  readonly entries: readonly TiffGraphEntry[];
  readonly nextDirectoryId: string | null;
}

export interface TiffGraph {
  readonly byteOrder: TiffByteOrder;
  readonly variant: TiffVariant;
  readonly rootDirectoryId: string;
  readonly directories: readonly TiffGraphDirectory[];
  /** Known offset-addressed payloads are relocated with their references. */
  readonly preservedData: readonly TiffPreservedData[];
}

export interface TiffSerializeOptions {
  readonly limits?: Partial<SecurityLimits>;
  /** Maximum generated byte length. Defaults to maxAdapterOutputBytes. */
  readonly maxOutputBytes?: number;
}

export type TiffEntryEdit =
  | { readonly op: "set"; readonly directoryId: string; readonly tag: number; readonly occurrence?: number; readonly type: ExifDataType; readonly typeCode?: number; readonly value: TiffEntryValue; readonly count?: number }
  | { readonly op: "delete"; readonly directoryId: string; readonly tag: number; readonly occurrence?: number };

export interface TiffRewriteOptions extends TiffSerializeOptions {
  readonly edits: readonly TiffEntryEdit[];
  readonly duplicatePolicy?: "preserve" | "replace-target" | "deduplicate-equivalent" | "reject";
  readonly ordering?: "preserve-source" | "canonical";
  /** Reparse and compare the complete bounded graph before returning bytes. */
  readonly verify?: boolean;
}

export interface XmpData {
  readonly packets: readonly string[];
  /** Physical/logical source records aligned with `packets` when available. */
  readonly packetProvenance?: readonly XmpPacketProvenance[];
}

/** A bounded MPF index or attribute IFD entry. Raw image bytes are never
 * retained by the metadata result. */
export interface MpfIfdEntry {
  readonly tag: number;
  readonly type: number;
  readonly count: number;
  readonly valueOffset: number;
  readonly valueLength: number;
  readonly sourceOffset: number;
}

export interface MpfIfd {
  readonly kind: "index" | "attribute";
  readonly sourceOffset: number;
  readonly relativeOffset: number;
  readonly byteLength: number;
  readonly entries: readonly MpfIfdEntry[];
  readonly nextIfdOffset: number;
}

export type MpfImageFormat = "jpeg" | "unsupported";

export type MpfImageType =
  | "undefined"
  | "large-thumbnail-vga"
  | "large-thumbnail-full-hd"
  | "large-thumbnail-4k"
  | "large-thumbnail-8k"
  | "large-thumbnail-16k"
  | "multi-frame-panorama"
  | "multi-frame-disparity"
  | "multi-angle"
  | "baseline-primary"
  | "original-preservation"
  | "gain-map"
  | "other";

export interface MpfEmbeddedMetadataInventory {
  readonly complete: boolean;
  readonly format: "jpeg" | "unknown";
  readonly dimensions: ImageDimensions | null;
  readonly fieldIds: readonly string[];
  readonly metadataFamilies: readonly MetadataBlockFamily[];
  readonly xmpPacketCount: number;
  readonly diagnostics: readonly MetadataWarning[];
}

export interface MpfImageEntry {
  readonly id: string;
  readonly index: number;
  readonly attributes: number;
  readonly imageFormat: MpfImageFormat;
  readonly imageFormatCode: number;
  readonly imageType: MpfImageType;
  readonly imageTypeCode: number;
  readonly representative: boolean;
  readonly dependentChild: boolean;
  readonly dependentParent: boolean;
  readonly size: number;
  /** CIPA stored offset: zero for the first image, otherwise relative to the MP Endian field. */
  readonly offset: number;
  readonly absoluteOffset: number | null;
  readonly rangeLength: number | null;
  readonly dependentImage1: number | null;
  readonly dependentImage2: number | null;
  readonly status: "decoded" | "partial" | "malformed" | "opaque";
  readonly metadata: MpfEmbeddedMetadataInventory | null;
}

export interface MpfSegment {
  readonly id: string;
  readonly sourceOffset: number;
  readonly byteLength: number;
  readonly indexIfd: MpfIfd | null;
  readonly attributeIfds: readonly MpfIfd[];
  readonly mpfVersion: string | null;
  readonly numberOfImages: number | null;
  readonly images: readonly MpfImageEntry[];
  readonly complete: boolean;
  readonly diagnostics: readonly MpfDiagnostic[];
}

export interface MpfDiagnostic {
  readonly code: "MALFORMED_MPF" | "MALFORMED_ULTRA_HDR" | "TRUNCATED_DATA" | "UNSAFE_OFFSET" | "LIMIT_EXCEEDED" | "INVALID_VALUE" | "UNSUPPORTED_STRUCTURE" | "DUPLICATE_MPF";
  readonly message: string;
  readonly severity: "warning" | "error";
  readonly offset?: number;
  readonly length?: number;
}

export interface MpfRelationship {
  readonly type: "dependent-image" | "representative-image" | "primary-image" | "gain-map-image";
  readonly sourceImageId: string;
  readonly targetImageId: string | null;
}

export interface MpfData {
  readonly standard: "CIPA DC-X007:2025";
  readonly segments: readonly MpfSegment[];
  readonly images: readonly MpfImageEntry[];
  readonly relationships: readonly MpfRelationship[];
  readonly complete: boolean;
  readonly diagnostics: readonly MpfDiagnostic[];
}

export interface UltraHdrGainMapProperty {
  readonly namespaceUri: "http://ns.adobe.com/hdr-gain-map/1.0/";
  readonly localName: string;
  readonly sourcePacketIndex: number;
  readonly lexicalValues: readonly string[];
  readonly numericValues: readonly (number | null)[];
}

export interface GContainerItem {
  readonly index: number;
  readonly semantic: "Primary" | "GainMap" | "Other";
  readonly mime: string | null;
  readonly length: number | null;
  readonly padding: number;
  readonly uri: string | null;
  readonly sourcePacketIndex: number;
  readonly mpfImageId: string | null;
  readonly status: "decoded" | "malformed" | "ambiguous";
}

export interface UltraHdrData {
  readonly standard: "Android Ultra HDR v1.1";
  readonly namespaceUri: "http://ns.adobe.com/hdr-gain-map/1.0/";
  readonly gContainerNamespaceUri: "http://ns.google.com/photos/1.0/container/";
  readonly sourcePacketIndices: readonly number[];
  readonly sourceBlockIds: readonly string[];
  readonly version: string | null;
  readonly gainMapProperties: readonly UltraHdrGainMapProperty[];
  readonly directory: readonly GContainerItem[];
  readonly primaryImageId: string | null;
  readonly gainMapImageId: string | null;
  readonly status: "decoded" | "partial" | "malformed" | "ambiguous" | "unsupported";
  readonly complete: boolean;
  readonly diagnostics: readonly MpfDiagnostic[];
}

/** Explicit opt-in for transactional MPF metadata rewrites. The default is
 * refusal because offset-bearing associated-image structures must never be
 * rewritten accidentally. Ultra HDR relationships are preserved, not
 * regenerated, by this policy. */
export interface JpegMpfMutationPolicy {
  readonly mode: "preserve";
  /** Required when an Ultra HDR gain-map relationship is present. */
  readonly ultraHdr?: "preserve";
}

export interface JpegEncodedPayloadRangeEvidence {
  readonly offset: number;
  readonly length: number;
  readonly sha256: string;
}

export interface JpegMpfImageWriteEvidence {
  readonly id: string;
  readonly index: number;
  readonly imageType: MpfImageType;
  readonly inputOffset: number;
  readonly inputSize: number;
  readonly outputOffset: number;
  readonly outputSize: number;
  readonly encodedPayloads: readonly {
    readonly id: string;
    readonly before: JpegEncodedPayloadRangeEvidence;
    readonly after: JpegEncodedPayloadRangeEvidence;
    readonly status: "matched";
  }[];
}

/** Redistribution-safe evidence returned for an opted-in MPF rewrite. */
export interface JpegMpfWriteEvidence {
  readonly schema: "browser-image-metadata.jpeg-mpf-write.v1";
  readonly policy: "preserve";
  readonly mpfSegmentId: string;
  readonly relationshipsVerified: boolean;
  readonly ultraHdr: "not-present" | "preserved";
  readonly images: readonly JpegMpfImageWriteEvidence[];
  readonly diagnostics: readonly string[];
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
  /** Source-relative evidence for creator-schema consumers. */
  readonly sourceOffset?: number;
  readonly sourceLength?: number;
  readonly blockId?: string;
}

export interface JfifData {
  readonly version: string;
  readonly densityUnits: "none" | "dpi" | "dpcm" | "unknown";
  readonly xDensity: number;
  readonly yDensity: number;
}

/** Standards-derived semantic facts decoded from one Photoshop image resource.
 * The exact resource bytes remain available separately on the containing
 * inventory; these values are intentionally bounded summaries. */
export type PhotoshopResourceDecoded =
  | {
    readonly kind: "resolution";
    readonly horizontalResolution: number;
    readonly verticalResolution: number;
    readonly horizontalUnit: "pixels-per-inch" | "pixels-per-centimeter" | "unknown";
    readonly verticalUnit: "pixels-per-inch" | "pixels-per-centimeter" | "unknown";
    readonly widthUnit: "inches" | "centimeters" | "points" | "picas" | "columns" | "unknown";
    readonly heightUnit: "inches" | "centimeters" | "points" | "picas" | "columns" | "unknown";
  }
  | {
    readonly kind: "thumbnail";
    readonly format: "raw-rgb" | "jpeg-rgb" | "unknown";
    readonly channelOrder: "rgb" | "bgr" | "unknown";
    readonly width: number;
    readonly height: number;
    readonly widthBytes: number;
    readonly totalBytes: number;
    readonly compressedBytes: number;
    readonly bitsPerPixel: number;
    readonly planes: number;
    readonly imageDataOffset: number;
    readonly imageDataLength: number;
  }
  | {
    readonly kind: "iptc";
    readonly byteLength: number;
  }
  | {
    readonly kind: "xmp";
    readonly packet: string;
  }
  | {
    readonly kind: "caption-digest";
    readonly algorithm: "MD5";
    readonly hex: string;
  }
  | {
    readonly kind: "path";
    readonly recordCount: number;
    readonly selectors: readonly number[];
  }
  | {
    readonly kind: "clipping-path-name";
    readonly name: string;
  };

export type PhotoshopResourceKind = PhotoshopResourceDecoded["kind"] | "unknown";
export type PhotoshopResourceStatus = "decoded" | "unknown" | "malformed" | "limited";

export interface PhotoshopResourceDiagnostic {
  readonly code: "MALFORMED_PHOTOSHOP" | "TRUNCATED_DATA" | "LIMIT_EXCEEDED" | "INVALID_VALUE" | "UNSAFE_OFFSET";
  readonly message: string;
  readonly offset: number;
  readonly length?: number;
  readonly resourceId?: number;
}

/** One Photoshop 8BIM resource, retained in source order including duplicates. */
export interface PhotoshopResource {
  readonly id: string;
  readonly signature: "8BIM";
  readonly resourceId: number;
  readonly nameBytes: Uint8Array;
  readonly name: string;
  readonly namePadding: Uint8Array;
  readonly offset: number;
  readonly length: number;
  readonly payloadOffset: number;
  readonly payloadLength: number;
  readonly payloadPadding: Uint8Array;
  readonly parentBlockId: string;
  readonly status: PhotoshopResourceStatus;
  readonly kind: PhotoshopResourceKind;
  readonly decoded: PhotoshopResourceDecoded | null;
  /** Exact payload copy when it fits the configured value budget. */
  readonly rawPayload: Uint8Array | null;
}

export interface PhotoshopContainerData {
  readonly identifier: "Photoshop 3.0" | null;
  readonly source: { readonly blockId: string; readonly offset: number; readonly length: number };
  readonly resources: readonly PhotoshopResource[];
  readonly complete: boolean;
  readonly diagnostics: readonly PhotoshopResourceDiagnostic[];
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
  /** Physical bytes-on-disk container, independent of camera-file variant. */
  readonly container: ImageContainer;
  /** Stable variant identity; ordinary TIFF remains `tiff`. */
  readonly fileKind: ImageFileKind;
  /** Non-null only for structurally recognized TIFF-derived RAW variants. */
  readonly raw: RawContainerData | null;
  readonly dimensions: ImageDimensions | null;
  /** Additive, provenance-preserving common image/container detail view. */
  readonly details?: ImageDetails;
  /** Display-space dimensions after a HEIF/AVIF rotation transform. */
  readonly displayDimensions?: ImageDimensions;
  /** HEIF/AVIF item transform; absent for containers without item transforms. */
  readonly transform?: ImageTransform;
  /** HEIF/AVIF primary-item `nclx` colour parameters, when present. */
  readonly nclx?: NclxColorData;
  /** Bounded HEIF/AVIF item graph, including locations, properties, and references. */
  readonly heif?: readonly HeifItemGraph[];
  /** Bounded HEIF/AVIF movie and image-sequence tracks; item graphs remain separate in `heif`. */
  readonly heifSequences?: readonly HeifSequence[];
  /** CR3-specific ISO-BMFF inventory; generic HEIF views remain separate. */
  readonly cr3?: Cr3ContainerData;
  /** RAF-specific directory and embedded-range inventory. */
  readonly raf?: RafContainerData;
  /** Common, normalized fields. Raw EXIF entries remain in `exif.fields`. */
  readonly fields: readonly MetadataField[];
  /** Typed EXIF interpretations derived from one or more retained fields. */
  readonly composites?: ExifCompositeSet;
  readonly exif: ExifData | null;
  readonly xmp: XmpData | null;
  /** CIPA MPF index/attribute IFD and bounded secondary-image inventory. */
  readonly mpf?: MpfData | null;
  /** Android Ultra HDR gain-map and GContainer relationship inventory. */
  readonly ultraHdr?: UltraHdrData | null;
  readonly iptc: IptcData | null;
  /** IPTC Photo Metadata semantic view, including XMP-only candidates. */
  readonly iptcSemantic?: IptcSemanticData;
  readonly icc: IccData | null;
  readonly jfif: JfifData | null;
  /** Bounded Photoshop image-resource inventory for APP13 and TIFF tag 34377. */
  readonly photoshop?: PhotoshopContainerData | null;
  /** Explicitly supplied MakerNote plugin results; absent plugins leave notes opaque. */
  readonly makerNotes?: MakerNoteContainerData | null;
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
export type ParsedMetadataResult = Omit<MetadataResult, "completeness" | "blocks" | "coverage" | "container" | "fileKind" | "raw"> & {
  readonly photoshop?: PhotoshopContainerData | null;
  readonly makerNotes?: MakerNoteContainerData | null;
  readonly container?: ImageContainer;
  readonly fileKind?: ImageFileKind;
  readonly raw?: RawContainerData | null;
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
  /** Maximum creator-convention metadata sources inspected in one input. */
  readonly maxCreatorSources: number;
  /** Maximum workflow/prompt graph nodes retained from one creator source. */
  readonly maxCreatorGraphNodes: number;
  /** Maximum workflow/prompt graph edges retained from one creator source. */
  readonly maxCreatorGraphEdges: number;
  /** Maximum raw creator-convention bytes retained in one inspection. */
  readonly maxCreatorRawBytes: number;
  /** Maximum typed creator fields retained in one inspection. */
  readonly maxCreatorFields: number;
  readonly maxWarnings: number;
}

/** A bounded read capability handed to one plugin for one MakerNote. */
export interface MakerNoteReadContext {
  readonly noteLength: number;
  readonly noteOffset: number;
  readonly sourceLength: number;
  readonly fieldId: string;
  readonly blockId: string;
  readonly tiffOffset: number | null;
  readonly fileOffset: number | null;
  readonly byteOrder: MakerNoteByteOrder;
  readonly baseOffsetRule: MakerNoteBaseOffsetRule;
  readonly read: (noteRelativeOffset: number, length: number) => Uint8Array;
  readonly readUint8: (noteRelativeOffset: number) => number;
  readonly readUint16: (noteRelativeOffset: number, byteOrder?: "little-endian" | "big-endian") => number;
  readonly readUint32: (noteRelativeOffset: number, byteOrder?: "little-endian" | "big-endian") => number;
  readonly resolveOffset: (offset: number, rule?: MakerNoteBaseOffsetRule) => number | null;
}

export interface MakerNotePluginInput {
  readonly context: MakerNoteReadContext;
  readonly detection: MakerNoteDetection;
  readonly limits: SecurityLimits;
  readonly signal?: AbortSignal;
}

export interface MakerNotePluginResult {
  readonly status: MakerNoteStatus;
  readonly fields?: readonly MakerNoteField[];
  readonly opaqueRanges?: readonly MakerNoteOpaqueRange[];
  readonly diagnostics?: readonly MakerNoteDiagnostic[];
}

/** Explicit per-operation MakerNote plugin. It has no registration side effect. */
export interface MakerNotePlugin {
  readonly identity: MakerNotePluginIdentity;
  readonly detect: (context: MakerNoteReadContext) => MakerNoteDetection | null;
  readonly parse: (input: MakerNotePluginInput) => MakerNotePluginResult;
}

export interface MakerNoteInput {
  readonly id: string;
  readonly fieldId: string;
  readonly raw: Uint8Array;
  readonly noteOffset: number;
  readonly sourceLength: number;
  readonly tiffOffset?: number | null;
  readonly fileOffset?: number | null;
  readonly blockId: string;
}

export interface MakerNoteInspectionOptions {
  readonly plugins?: readonly MakerNotePlugin[];
  readonly signal?: AbortSignal;
}

/** Metadata families that can be requested independently during parsing. */
export type MetadataGroup = "Dimensions" | "EXIF" | "XMP" | "IPTC" | "ICC" | "JFIF" | "PNGText" | "Photoshop" | "MakerNote" | "MPF" | "Transform" | "Nclx";

/**
 * Limits decoding work to requested metadata families. `tags` applies to EXIF
 * field names (for example `Make` or `DateTimeOriginal`) and stable field IDs
 * such as `IFD0:0x010f`.
 */
export interface MetadataSelection {
  readonly groups?: readonly MetadataGroup[];
  readonly tags?: readonly string[];
}

/**
 * Bounded Brotli decoder supplied for JPEG XL `brob` metadata boxes.
 *
 * The parser copies the compressed input before calling this hook and checks
 * the returned byte length against `maxOutputBytes`. Implementations must not
 * allocate or retain output beyond that budget.
 */
export type JxlBrotliDecompressor = (
  compressed: Uint8Array,
  maxOutputBytes: number,
  signal?: AbortSignal,
) => Uint8Array | PromiseLike<Uint8Array>;

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
  /** Explicit MakerNote plugins for this parse operation. No global plugin registry exists. */
  readonly makerNotePlugins?: readonly MakerNotePlugin[];
  /** Controls whether ambiguous or invalid composite derivations are withheld. */
  readonly normalization?: NormalizationMode;
  /** Optional bounded Brotli implementation for JPEG XL `brob` metadata boxes. Not transferable through the structured-clone worker API. */
  readonly jxlBrotliDecompressor?: JxlBrotliDecompressor;
}

/** Options for bounded-concurrency parsing of an ordered input collection. */
export interface ParseManyOptions extends ParseOptions {
  /** Maximum simultaneous parses. Defaults to 4. */
  readonly concurrency?: number;
}

/** Legacy redaction names retained as a compatibility adapter. */
export type LegacyRedactionTarget =
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

/** Typed, canonical redaction selectors. Identity is based on field IDs,
 * namespace URIs, block IDs, and parser metadata—not display messages. */
export type RedactionSelector =
  | { readonly kind: "family"; readonly family: MetadataBlockFamily }
  | { readonly kind: "namespace-property"; readonly namespaceUri: string; readonly localName: string }
  | { readonly kind: "sensitivity"; readonly sensitivity: Sensitivity }
  | { readonly kind: "field-id"; readonly fieldId: EditCanonicalFieldId }
  | { readonly kind: "block"; readonly blockId: string }
  | { readonly kind: "associated-image"; readonly imageId: string }
  | { readonly kind: "photoshop-resource"; readonly resourceId: string };

export type RedactionTarget =
  | LegacyRedactionTarget
  | { readonly kind: "field"; readonly fieldId: EditCanonicalFieldId }
  | { readonly kind: "selector"; readonly selector: RedactionSelector };

/** Stable field IDs are registry identities, not display names or prefixes. */
export type EditCanonicalFieldId = string;

export type EditSelector =
  | { readonly kind: "family"; readonly family: MetadataBlockFamily }
  | { readonly kind: "block"; readonly blockId: string }
  | { readonly kind: "associated-image"; readonly imageId: string }
  | { readonly kind: "sensitivity"; readonly sensitivity: Sensitivity }
  | { readonly kind: "namespace-property"; readonly namespaceUri: string; readonly localName: string }
  | { readonly kind: "field-id"; readonly fieldId: EditCanonicalFieldId }
  | { readonly kind: "photoshop-resource"; readonly resourceId: string }
  | { readonly kind: "policy"; readonly policyId: string };

/** An operation address is either a canonical registry field or an explicit selector. */
export type EditTarget =
  | { readonly kind: "field"; readonly fieldId: EditCanonicalFieldId }
  | { readonly kind: "selector"; readonly selector: EditSelector };

/** Bounded values accepted by future writers, including structured XMP values. */
export type EditValue = MetadataValue | readonly EditValue[] | { readonly [key: string]: EditValue };

export type EditOperationKind =
  | "set"
  | "delete"
  | "copy"
  | "rename"
  | "alias"
  | "remove-group"
  | "remove-policy"
  | "merge-sidecar";

export interface EditOperationIdentity {
  /** Caller-stable identity used to compute unapplied operations. */
  readonly operationId: string;
}

export interface EditSetOperation extends EditOperationIdentity {
  readonly op: "set";
  readonly target: EditTarget;
  readonly value: EditValue;
}

export interface EditDeleteOperation extends EditOperationIdentity {
  readonly op: "delete";
  readonly target: EditTarget;
}

export interface EditCopyOperation extends EditOperationIdentity {
  readonly op: "copy";
  readonly source: EditTarget;
  readonly destination: EditTarget;
}

export interface EditRenameOperation extends EditOperationIdentity {
  readonly op: "rename";
  readonly source: EditTarget;
  readonly destination: EditTarget;
}

export interface EditAliasOperation extends EditOperationIdentity {
  readonly op: "alias";
  readonly source: EditTarget;
  readonly destination: EditTarget;
}

export type EditFamilyTarget = {
  readonly kind: "selector";
  readonly selector: { readonly kind: "family"; readonly family: MetadataBlockFamily };
};

export interface EditGroupRemovalOperation extends EditOperationIdentity {
  readonly op: "remove-group";
  readonly target: EditFamilyTarget;
}

export type EditPolicyTarget = {
  readonly kind: "selector";
  readonly selector: { readonly kind: "policy"; readonly policyId: string };
};

export interface EditPolicyRemovalOperation extends EditOperationIdentity {
  readonly op: "remove-policy";
  readonly target: EditPolicyTarget;
}

export type EditSidecarFormat = "xmp" | "iptc-iim";

/** Sidecar bytes are supplied by the caller; the core never opens a path or URL. */
export interface EditSidecarInput {
  readonly id: string;
  readonly format: EditSidecarFormat;
  readonly data: string | Uint8Array;
  readonly mediaType?: "application/rdf+xml" | "application/xmp" | "application/octet-stream";
  readonly source?: string;
}

export type EditSidecarMergePolicy = "append" | "preserve-existing" | "prefer-sidecar" | "reject-conflict";

export interface EditSidecarMergeOperation extends EditOperationIdentity {
  readonly op: "merge-sidecar";
  readonly target: EditTarget;
  readonly sidecar: EditSidecarInput;
  readonly mergePolicy?: EditSidecarMergePolicy;
}

export type EditOperation =
  | EditSetOperation
  | EditDeleteOperation
  | EditCopyOperation
  | EditRenameOperation
  | EditAliasOperation
  | EditGroupRemovalOperation
  | EditPolicyRemovalOperation
  | EditSidecarMergeOperation;

export type EditOrderingPolicy =
  | { readonly mode: "preserve-source" }
  | { readonly mode: "canonical" }
  | { readonly mode: "operation-order"; readonly operationIds: readonly string[] };

export type EditDuplicatePolicy = "preserve" | "replace-target" | "deduplicate-equivalent" | "reject";
export type EditConflictPolicy = "preserve-all" | "prefer-existing" | "prefer-requested" | "reject";
export type EditUnknownPolicy = "preserve" | "remove-unselected" | "reject";
export type EditVerificationPolicy = "none" | "reparse" | "reparse-and-preserve-payload";
export type EditOrientationPolicy = "preserve" | "report-only" | "allow-change";

export interface EditPolicy {
  /** Candidates matched by either exact field identity or the explicit selector. */
  readonly preserve?: readonly EditTarget[];
  /** Removal rules are evaluated after preserve rules; preserve always wins. */
  readonly remove?: readonly EditTarget[];
  readonly preserveRemovePrecedence?: "preserve-wins";
  readonly unknown?: EditUnknownPolicy;
  readonly ordering?: EditOrderingPolicy;
  readonly duplicates?: EditDuplicatePolicy;
  readonly conflicts?: EditConflictPolicy;
  readonly verification?: EditVerificationPolicy;
  /** Orientation metadata is preserved unless an intentional change is explicit. */
  readonly orientation?: EditOrientationPolicy;
  /** Explicit opt-in for safe MPF/Ultra HDR offset preservation on JPEG. */
  readonly mpf?: JpegMpfMutationPolicy;
}

export interface EditMetadataOptions {
  readonly operations: readonly EditOperation[];
  readonly policy?: EditPolicy;
  /** Compatibility shorthand for `policy.unknown`; omitted means preserve. */
  readonly preserveUnknown?: boolean;
  /** Compatibility shorthand for payload-preserving verification. */
  readonly verifyImagePayload?: boolean;
  readonly limits?: Partial<SecurityLimits>;
  readonly signal?: AbortSignal;
}

export type EditFailureCode =
  | "UNSUPPORTED_OPERATION"
  | "INVALID_VALUE"
  | "UNSAFE_STRUCTURE"
  | "POLICY_FAILURE"
  | "VERIFICATION_FAILURE";

export type EditOperationStatus =
  | "applied"
  | "unsupported"
  | "invalid-value"
  | "unsafe-structure"
  | "policy-failure"
  | "verification-failure";

export type EditResultStatus = EditOperationStatus | "mixed-failure";

export interface EditFailure {
  readonly code: EditFailureCode;
  /** Human-readable context; callers must use `code` and operationId programmatically. */
  readonly detail: string;
}

export interface EditDiagnostic {
  readonly code: EditFailureCode;
  readonly detail: string;
  readonly operationId?: string;
}

export interface EditByteRange {
  readonly blockId: string;
  readonly offset: number;
  readonly length: number;
  readonly kind: "preserved" | "removed" | "rewritten" | "inserted";
}

export interface EditPayloadEvidence {
  readonly payloadId: string;
  readonly beforeSha256: string | null;
  readonly afterSha256: string | null;
  readonly comparable: boolean;
}

export interface EditInputEvidence {
  readonly examined: boolean;
  readonly format: ImageFormat | null;
  readonly byteLength: number | null;
  readonly sha256: string | null;
  /** Writers must never mutate caller-owned input bytes. */
  readonly sourceMutated: false;
}

export interface EditOutputEvidence {
  readonly generated: boolean;
  readonly format: ImageFormat | null;
  readonly byteLength: number | null;
  readonly sha256: string | null;
  readonly byteChanges: readonly EditByteRange[];
  readonly payloads: readonly EditPayloadEvidence[];
  /** MPF relationship and associated-image preservation evidence when the
   * explicit JPEG MPF policy was used. */
  readonly mpf?: JpegMpfWriteEvidence;
}

export interface EditVerificationEvidence {
  readonly policy: EditVerificationPolicy;
  readonly status: "not-run" | "passed" | "failed";
  readonly checked: readonly ("reparse" | "image-payload" | "dimensions" | "relationships")[];
  readonly failure: EditFailure | null;
}

export interface EditPolicyEvidence {
  readonly preserve: readonly EditTarget[];
  readonly remove: readonly EditTarget[];
  readonly preserveRemovePrecedence: "preserve-wins";
  readonly unknown: EditUnknownPolicy;
  readonly ordering: EditOrderingPolicy;
  readonly duplicates: EditDuplicatePolicy;
  readonly conflicts: EditConflictPolicy;
  readonly verification: EditVerificationPolicy;
  readonly orientation: EditOrientationPolicy;
  /** Explicit opt-in for safe MPF/Ultra HDR offset preservation on JPEG. */
  readonly mpf?: JpegMpfMutationPolicy;
  readonly overlappingTargets: readonly EditTarget[];
}

export interface EditOperationEvidence {
  readonly operationId: string;
  readonly operation: EditOperationKind | null;
  readonly targets: readonly EditTarget[];
  readonly status: EditOperationStatus;
  readonly candidateCount: number | null;
  readonly appliedCount: number;
  readonly matchedFieldIds: readonly string[];
  readonly matchedBlockIds: readonly string[];
  readonly byteChanges: readonly EditByteRange[];
  readonly preservedUnknownCandidates: number | null;
  readonly failure: EditFailure | null;
}

export interface EditUnappliedOperation {
  readonly operationId: string;
  readonly operation: EditOperationKind | null;
  readonly targets: readonly EditTarget[];
  readonly status: Exclude<EditOperationStatus, "applied">;
  readonly failure: EditFailure;
}

interface EditMetadataResultBase {
  readonly format: ImageFormat | null;
  readonly input: EditInputEvidence;
  readonly output: EditOutputEvidence | null;
  readonly operations: readonly EditOperationEvidence[];
  readonly unapplied: readonly EditUnappliedOperation[];
  readonly policy: EditPolicyEvidence;
  readonly verification: EditVerificationEvidence;
  readonly diagnostics: readonly EditDiagnostic[];
  readonly warnings: readonly MetadataWarning[];
}

export interface SuccessfulEditMetadataResult extends EditMetadataResultBase {
  readonly successful: true;
  readonly status: "applied";
  readonly data: Uint8Array;
}

export interface FailedEditMetadataResult extends EditMetadataResultBase {
  readonly successful: false;
  readonly status: Exclude<EditResultStatus, "applied">;
  readonly data: null;
}

export type EditMetadataResult = SuccessfulEditMetadataResult | FailedEditMetadataResult;

export interface RedactOptions {
  readonly remove: readonly RedactionTarget[];
  readonly preserve?: readonly RedactionTarget[];
  /** Optional immutable registry used to resolve canonical field selectors. */
  readonly registry?: MetadataRegistry | readonly MetadataRegistryFieldInput[] | { readonly fields: readonly MetadataRegistryFieldInput[]; readonly sources?: readonly MetadataRegistrySource[] };
  /** C2PA/JUMBF is refused by default; preservation must be explicit. */
  readonly c2pa?: "refuse" | "preserve" | "invalidate";
  readonly limits?: Partial<SecurityLimits>;
  readonly signal?: AbortSignal;
}

/** Internal physical scope produced by a typed selector before format surgery.
 * The public API exposes block IDs and associated-image selectors; format
 * adapters consume this normalized form so a family-wide legacy target cannot
 * accidentally widen a block-scoped request. */
export interface LegacyRedactionScope {
  readonly target: LegacyRedactionTarget;
  readonly blockIds: readonly string[];
}

/** Internal compatibility shape consumed by the existing format surgeries. */
export type LegacyRedactOptions = Omit<RedactOptions, "remove" | "preserve"> & {
  readonly remove: readonly LegacyRedactionTarget[];
  readonly preserve?: readonly LegacyRedactionTarget[];
  readonly scopes?: readonly LegacyRedactionScope[];
};

export interface RedactionRecord {
  readonly target: RedactionTarget;
  readonly occurrences: number;
}

/** Machine-readable evidence for one typed redaction request. Human-readable
 * warnings explain failures, but status and counts are derived from this
 * operation record and its physical metadata coverage. */
export interface RedactionOperationEvidence {
  readonly operationId: string;
  readonly target: RedactionTarget;
  readonly status: "applied" | "rejected";
  readonly candidateCount: number;
  readonly appliedCount: number;
  readonly matchedFieldIds: readonly string[];
  readonly matchedBlockIds: readonly string[];
  readonly failureCode: WarningCode | null;
}

export interface RedactionResult {
  readonly data: Uint8Array;
  readonly format: ImageFormat;
  readonly removed: readonly RedactionRecord[];
  /** Present for typed requests; omitted for the legacy string adapter. */
  readonly operations?: readonly RedactionOperationEvidence[];
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
  /** Named immutable T02 privacy policy. Omitted retains the legacy strict policy. */
  readonly policy?: PrivacyPolicyId;
}

export interface PrivacyAuditOptions {
  readonly limits?: Partial<SecurityLimits>;
  readonly signal?: AbortSignal;
  /** Explicit MakerNote plugins used only for this audit operation. */
  readonly makerNotePlugins?: readonly MakerNotePlugin[];
  /** Include decoded sensitive lexical values only when explicitly requested. */
  readonly includeRawValues?: boolean;
}

/** Machine-readable policy outcomes emitted by the privacy audit. */
export type PrivacyReasonCode = MetadataCoverageReasonCode | "SENSITIVE_METADATA_PRESENT" | "RAW_XMP";

export type PrivacyPolicyId = "share-safe" | "location-safe" | "anonymous" | "retain-rights" | "publisher" | "accessibility" | "forensic-preserve";

/** Stable semantic state for a privacy finding. Human-readable messages are
 * explanatory only; policy code must use this value and the category. */
export type PrivacyFindingState = "presence" | "decoded-finding" | "opaque-risk" | "policy-violation";

/** Stable semantic categories used by privacy inspection and policy presets. */
export type PrivacyFindingCategory =
  | "metadata-presence"
  | "location"
  | "person"
  | "creator"
  | "contact"
  | "descriptive"
  | "serial-identifier"
  | "device-identifier"
  | "timestamp"
  | "document-identifier"
  | "region"
  | "prompt"
  | "workflow"
  | "embedded-preview"
  | "unknown-xmp"
  | "opaque-block"
  | "unsupported-structure";

interface SanitizationResultBase {
  readonly format: ImageFormat;
  readonly retained: readonly RedactionTarget[];
  readonly warnings: readonly MetadataWarning[];
  readonly reasons: readonly string[];
  readonly reasonCodes?: readonly PrivacyReasonCode[];
  readonly policy?: PrivacyPolicyReport;
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
