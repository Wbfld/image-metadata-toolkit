import { detectFormat } from "./detect-format.js";
import { parseJpeg } from "./parsers/jpeg.js";
import { parsePng, parsePngDimensions } from "./parsers/png.js";
import { parseTiffMetadata } from "./parsers/tiff.js";
import { parseHeif } from "./parsers/heif.js";
import { parseWebp, parseWebpDimensions } from "./parsers/webp.js";
import { redactBytes } from "./privacy/redact.js";
import { DEFAULT_LIMITS, resolveLimits } from "./security/limits.js";
import {
  MetadataError,
  type ImageDimensions,
  type MetadataInput,
  type MetadataResult,
  type MetadataWarning,
  type ParseOptions,
  type RedactOptions,
  type RedactionResult,
  type SecurityLimits,
} from "./types.js";

export { detectFormat, DEFAULT_LIMITS, MetadataError };
export type * from "./types.js";

function isBlobLike(value: unknown): value is Blob {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { readonly size?: unknown; readonly arrayBuffer?: unknown };
  return typeof candidate.size === "number" && typeof candidate.arrayBuffer === "function";
}

function isArrayBuffer(value: unknown): value is ArrayBuffer {
  if (typeof value !== "object" || value === null) return false;
  try {
    // `instanceof` fails for ArrayBuffers received from an iframe or another
    // realm. The intrinsic's brand check works across realms and rejects
    // look-alike objects without consuming their contents.
    ArrayBuffer.prototype.slice.call(value, 0, 0);
    return true;
  } catch {
    return false;
  }
}

async function inputBytes(input: MetadataInput, limits: SecurityLimits): Promise<Uint8Array> {
  let bytes: Uint8Array;
  if (isArrayBuffer(input)) {
    bytes = new Uint8Array(input);
  } else if (ArrayBuffer.isView(input)) {
    bytes = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  } else if (isBlobLike(input)) {
    if (!Number.isSafeInteger(input.size) || input.size < 0) {
      throw new MetadataError("INVALID_VALUE", "Blob size must be a non-negative safe integer.");
    }
    if (input.size > limits.maxInputBytes) {
      throw new MetadataError(
        "LIMIT_EXCEEDED",
        `Input is ${input.size} bytes; the configured limit is ${limits.maxInputBytes} bytes.`,
      );
    }
    bytes = new Uint8Array(await input.arrayBuffer());
  } else {
    throw new MetadataError("INVALID_VALUE", "Input must be an ArrayBuffer, ArrayBufferView, Blob, or File.");
  }

  if (bytes.byteLength > limits.maxInputBytes) {
    throw new MetadataError(
      "LIMIT_EXCEEDED",
      `Input is ${bytes.byteLength} bytes; the configured limit is ${limits.maxInputBytes} bytes.`,
    );
  }
  return bytes;
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

function dimensionsForKnownContainer(format: MetadataResult["format"], bytes: Uint8Array): ImageDimensions | null {
  if (format === "png") return parsePngDimensions(bytes);
  if (format === "webp") return parseWebpDimensions(bytes);
  return null;
}

function unsupportedResult(bytes: Uint8Array, limits: SecurityLimits): MetadataResult {
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
            message: "Input does not have a recognized JPEG, PNG, TIFF, WebP, HEIF, or AVIF signature.",
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
    dimensions: dimensionsForKnownContainer(detection.format, bytes),
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
  const bytes = await inputBytes(input, limits);
  const detection = detectFormat(bytes);
  if (detection.format === "jpeg") return parseJpeg(bytes, limits);
  if (detection.format === "png") return parsePng(bytes, limits);
  if (detection.format === "tiff") return parseTiffMetadata(bytes, limits);
  if (detection.format === "webp") return parseWebp(bytes, limits);
  if (detection.format === "heif") return parseHeif(bytes, limits, "heif");
  if (detection.format === "avif") return parseHeif(bytes, limits, "avif");
  return unsupportedResult(bytes, limits);
}

/** Remove selected JPEG metadata without decoding or recompressing image pixels. */
export async function redactMetadata(input: MetadataInput, options: RedactOptions): Promise<RedactionResult> {
  const limits = resolveLimits(options.limits);
  const bytes = await inputBytes(input, limits);
  return redactBytes(bytes, options, limits);
}
