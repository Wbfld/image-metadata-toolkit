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
  | "REDACTION_SKIPPED";

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
  /** Common, normalized fields. Raw EXIF entries remain in `exif.fields`. */
  readonly fields: readonly MetadataField[];
  readonly exif: ExifData | null;
  readonly xmp: XmpData | null;
  readonly iptc: IptcData | null;
  readonly icc: IccData | null;
  readonly jfif: JfifData | null;
  /** Bounded PNG textual chunks, when parsing a PNG input. */
  readonly pngText: readonly PngTextEntry[];
  readonly warnings: readonly MetadataWarning[];
}

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
  readonly maxWarnings: number;
}

export interface ParseOptions {
  readonly limits?: Partial<SecurityLimits>;
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
}

export interface RedactionRecord {
  readonly target: RedactionTarget;
  readonly occurrences: number;
}

export interface RedactionResult {
  readonly data: Uint8Array;
  readonly format: ImageFormat;
  readonly removed: readonly RedactionRecord[];
  readonly warnings: readonly MetadataWarning[];
}

export class MetadataError extends Error {
  public readonly code: WarningCode;

  public constructor(code: WarningCode, message: string) {
    super(message);
    this.name = "MetadataError";
    this.code = code;
  }
}
