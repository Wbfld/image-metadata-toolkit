/** Binary inputs accepted in browsers, workers, Node.js, and Deno. */
export type MetadataInput = ArrayBuffer | ArrayBufferView | Blob;

export type ImageFormat = "jpeg" | "png" | "tiff" | "webp" | "heif" | "avif" | "unknown";

export type ImageMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/tiff"
  | "image/webp"
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
  | FlashValue
  | ApexValue
  | GpsCoordinateRaw
  | readonly number[]
  | readonly RationalValue[];

export type ExifDataType =
  | "BYTE"
  | "ASCII"
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
  | "COMPOSITE"
  | "UNKNOWN";

export type Sensitivity = "none" | "low" | "moderate" | "high";

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
  /** @deprecated Editing is not exposed by this package; consult `getCapabilities()` instead. */
  readonly editable: boolean;
  readonly sensitivity: Sensitivity;
  readonly count?: number;
  readonly known?: boolean;
}

export interface ExifIfd {
  readonly name: string;
  readonly offset: number;
  readonly entryCount: number;
}

export interface ExifData {
  readonly byteOrder: "little-endian" | "big-endian";
  /** Every safely decoded entry, including unknown tags. */
  readonly fields: readonly MetadataField[];
  readonly ifds: readonly ExifIfd[];
  /** Bounded embedded EXIF thumbnail bytes, when a valid thumbnail is present. */
  readonly thumbnail?: ExifThumbnail;
}

export interface ExifThumbnail {
  readonly data: Uint8Array;
  readonly mimeType: "image/jpeg" | "application/octet-stream";
}

export interface XmpData {
  readonly packets: readonly string[];
}

export interface IptcData {
  readonly byteLength: number;
  readonly characterSet?: "latin1" | "utf-8" | "unknown";
  readonly fields?: readonly MetadataField[];
}

export interface IccData {
  readonly byteLength: number;
  readonly chunks: number;
  readonly complete: boolean;
  readonly fields?: readonly MetadataField[];
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

export interface MetadataResult {
  readonly format: ImageFormat;
  readonly mimeType: ImageMimeType;
  readonly dimensions: ImageDimensions | null;
  /** Display-space dimensions after a HEIF/AVIF rotation transform. */
  readonly displayDimensions?: ImageDimensions;
  /** HEIF/AVIF item transform; absent for containers without item transforms. */
  readonly transform?: ImageTransform;
  /** HEIF/AVIF primary-item `nclx` colour parameters, when present. */
  readonly nclx?: NclxColorData;
  /** Common, normalized fields. Raw EXIF entries remain in `exif.fields`. */
  readonly fields: readonly MetadataField[];
  readonly exif: ExifData | null;
  readonly xmp: XmpData | null;
  readonly iptc: IptcData | null;
  readonly icc: IccData | null;
  readonly jfif: JfifData | null;
  /** Bounded PNG textual chunks, when parsing a PNG input. */
  readonly pngText: readonly PngTextEntry[];
  /** Whether this result covers the requested inspection scope without parser errors. */
  readonly completeness: ParseCompleteness;
  readonly warnings: readonly MetadataWarning[];
}

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
export type ParsedMetadataResult = Omit<MetadataResult, "completeness">;

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

export interface SanitizationResult {
  readonly format: ImageFormat;
  /** Bytes are supplied only if the requested policy was fully satisfied. */
  readonly data: Uint8Array | null;
  readonly successful: boolean;
  readonly retained: readonly RedactionTarget[];
  readonly warnings: readonly MetadataWarning[];
  readonly reasons: readonly string[];
}

export class MetadataError extends Error {
  public readonly code: WarningCode;

  public constructor(code: WarningCode, message: string) {
    super(message);
    this.name = "MetadataError";
    this.code = code;
  }
}
