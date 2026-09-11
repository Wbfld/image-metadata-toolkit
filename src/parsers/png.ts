import { parseExif } from "../metadata/exif.js";
import { inspectIccProfile, type IccChunk } from "../metadata/icc.js";
import { extractExifThumbnail } from "../metadata/thumbnail.js";
import { wantsGroup, type ResolvedSelection } from "../selection.js";
import { throwIfAborted } from "../security/abort.js";
import type {
  ExifData,
  ImageDimensions,
  MetadataField,
  MetadataBlock,
  ParsedMetadataResult,
  MetadataWarning,
  PngTextChunkType,
  PngTextEntry,
  SecurityLimits,
} from "../types.js";
import type { MetadataRegistry } from "../registry.js";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;
const XMP_KEYWORD = "XML:com.adobe.xmp";
const TEXT_CHUNK_TYPES = new Set<PngTextChunkType>(["tEXt", "zTXt", "iTXt"]);
const ASCII_DECODE_CHUNK_BYTES = 8_192;

interface TextParseResult {
  readonly entry: PngTextEntry | null;
  readonly xmp: string | null;
  readonly decodedBytes: number;
  readonly warning?: {
    readonly code: MetadataWarning["code"];
    readonly message: string;
  };
}

interface InflateResult {
  readonly bytes: Uint8Array | null;
  readonly error?: "UNSUPPORTED_COMPRESSION" | "LIMIT_EXCEEDED" | "INVALID_VALUE";
}

function uint32BigEndian(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] ?? 0) * 0x1000000 +
    ((bytes[offset + 1] ?? 0) << 16) +
    ((bytes[offset + 2] ?? 0) << 8) +
    (bytes[offset + 3] ?? 0)
  );
}

function crc32(bytes: Uint8Array, start: number, end: number): number {
  let crc = 0xffffffff;
  for (let offset = start; offset < end; offset += 1) {
    crc ^= bytes[offset] ?? 0;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function validBitDepth(bitDepth: number, colorType: number): boolean {
  if (colorType === 0) return [1, 2, 4, 8, 16].includes(bitDepth);
  if (colorType === 2 || colorType === 4 || colorType === 6) return bitDepth === 8 || bitDepth === 16;
  if (colorType === 3) return [1, 2, 4, 8].includes(bitDepth);
  return false;
}

function isPngSignature(bytes: Uint8Array): boolean {
  return bytes.length >= PNG_SIGNATURE.length && PNG_SIGNATURE.every((byte, index) => bytes[index] === byte);
}

function chunkType(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(
    bytes[offset] ?? 0,
    bytes[offset + 1] ?? 0,
    bytes[offset + 2] ?? 0,
    bytes[offset + 3] ?? 0,
  );
}

function isValidChunkType(bytes: Uint8Array, offset: number): boolean {
  for (let index = 0; index < 4; index += 1) {
    const byte = bytes[offset + index] ?? 0;
    if (!((byte >= 0x41 && byte <= 0x5a) || (byte >= 0x61 && byte <= 0x7a))) return false;
  }
  return true;
}

function isAncillaryChunk(type: string): boolean {
  const first = type.charCodeAt(0);
  return first >= 0x61 && first <= 0x7a;
}

function warning(
  warnings: MetadataWarning[],
  limits: SecurityLimits,
  value: Omit<MetadataWarning, "severity"> & { readonly severity?: MetadataWarning["severity"] },
): void {
  if (warnings.length >= limits.maxWarnings) return;
  warnings.push({ severity: "warning", ...value });
}

function warningError(
  warnings: MetadataWarning[],
  limits: SecurityLimits,
  value: Omit<MetadataWarning, "severity"> & { readonly severity?: MetadataWarning["severity"] },
): void {
  if (warnings.length >= limits.maxWarnings) return;
  warnings.push({ severity: "error", ...value });
}

/** Extracts only the mandatory, non-compressed IHDR dimensions. */
export function parsePngDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 33 || !isPngSignature(bytes)) return null;
  if (uint32BigEndian(bytes, 8) !== 13) return null;
  if (bytes[12] !== 0x49 || bytes[13] !== 0x48 || bytes[14] !== 0x44 || bytes[15] !== 0x52) return null;
  const width = uint32BigEndian(bytes, 16);
  const height = uint32BigEndian(bytes, 20);
  const bitDepth = bytes[24] ?? 0;
  const colorType = bytes[25] ?? 0;
  const compression = bytes[26] ?? 0;
  const filter = bytes[27] ?? 0;
  const interlace = bytes[28] ?? 0;
  if (
    width === 0 ||
    height === 0 ||
    width > 0x7fffffff ||
    height > 0x7fffffff ||
    !validBitDepth(bitDepth, colorType) ||
    compression !== 0 ||
    filter !== 0 ||
    (interlace !== 0 && interlace !== 1) ||
    crc32(bytes, 12, 29) !== uint32BigEndian(bytes, 29)
  ) {
    return null;
  }
  return { width, height };
}

function findNull(bytes: Uint8Array, start: number): number | null {
  for (let offset = start; offset < bytes.length; offset += 1) {
    if (bytes[offset] === 0) return offset;
  }
  return null;
}

function validKeyword(bytes: Uint8Array): boolean {
  if (bytes.length < 1 || bytes.length > 79) return false;
  return bytes.every((byte) => byte >= 0x20 && byte <= 0x7e);
}

function decodeLatin1(bytes: Uint8Array): string {
  const chunks: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += ASCII_DECODE_CHUNK_BYTES) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, Math.min(offset + ASCII_DECODE_CHUNK_BYTES, bytes.length))));
  }
  return chunks.join("");
}

function decodeUtf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function textWarning(code: MetadataWarning["code"], message: string, decodedBytes = 0): TextParseResult {
  return { entry: null, xmp: null, decodedBytes, warning: { code, message } };
}

function makeTextEntry(
  type: PngTextChunkType,
  keyword: string,
  text: string,
  raw: Uint8Array,
  language = "",
  translatedKeyword = "",
  compressed = false,
): Pick<TextParseResult, "entry" | "xmp"> {
  const entry: PngTextEntry = {
    type,
    keyword,
    text,
    language,
    translatedKeyword,
    compressed,
    raw,
  };
  return { entry, xmp: keyword === XMP_KEYWORD ? text : null };
}

function parseTextBytes(
  type: PngTextChunkType,
  keywordBytes: Uint8Array,
  textBytes: Uint8Array,
  limits: SecurityLimits,
  language = "",
  translatedKeyword = "",
  compressed = false,
  rawBytes?: Uint8Array,
): TextParseResult {
  if (!validKeyword(keywordBytes)) return textWarning("INVALID_VALUE", "PNG text keyword is not a printable 1–79 byte value.");
  if (textBytes.length > limits.maxStringBytes) {
    return textWarning("LIMIT_EXCEEDED", `PNG ${type} text exceeds the configured string limit of ${limits.maxStringBytes} bytes.`, textBytes.length);
  }
  const keyword = decodeLatin1(keywordBytes);
  const decoded = type === "iTXt" || keyword === XMP_KEYWORD ? decodeUtf8(textBytes) : decodeLatin1(textBytes);
  if (decoded === null) return textWarning("INVALID_VALUE", `PNG ${type} text is not valid UTF-8.`, textBytes.length);
  return { ...makeTextEntry(type, keyword, decoded, (rawBytes ?? textBytes).slice(), language, translatedKeyword, compressed), decodedBytes: textBytes.length };
}

function parseTextChunk(
  type: PngTextChunkType,
  data: Uint8Array,
  limits: SecurityLimits,
  maxDecodedBytes = limits.maxDecompressedBytes,
  signal?: AbortSignal,
): Promise<TextParseResult> {
  throwIfAborted(signal);
  const keywordEnd = findNull(data, 0);
  if (keywordEnd === null) return Promise.resolve(textWarning("MALFORMED_PNG", `PNG ${type} chunk has no keyword terminator.`));

  if (type === "tEXt") {
    const text = data.subarray(keywordEnd + 1);
    if (text.length > maxDecodedBytes) {
      return Promise.resolve(textWarning("LIMIT_EXCEEDED", "PNG decoded metadata exceeds the configured aggregate limit.", maxDecodedBytes + 1));
    }
    return Promise.resolve(parseTextBytes(type, data.subarray(0, keywordEnd), text, limits));
  }

  if (type === "zTXt") {
    if (keywordEnd + 2 > data.length) return Promise.resolve(textWarning("TRUNCATED_DATA", "PNG zTXt chunk is missing its compression method."));
    if (data[keywordEnd + 1] !== 0) return Promise.resolve(textWarning("UNSUPPORTED_COMPRESSION", "PNG zTXt uses an unsupported compression method."));
    const compressed = data.subarray(keywordEnd + 2);
    return inflateZlib(compressed, Math.min(limits.maxDecompressedBytes, maxDecodedBytes), signal).then((inflated) => {
      if (inflated.bytes === null) {
        return textWarning(inflated.error ?? "INVALID_VALUE", "PNG zTXt decompression failed or exceeded its output limit.", maxDecodedBytes + 1);
      }
      return parseTextBytes(type, data.subarray(0, keywordEnd), inflated.bytes, limits, "", "", true, compressed);
    });
  }

  if (keywordEnd + 3 > data.length) return Promise.resolve(textWarning("TRUNCATED_DATA", "PNG iTXt chunk is missing its compression fields."));
  const compressionFlag = data[keywordEnd + 1];
  const compressionMethod = data[keywordEnd + 2];
  if (compressionFlag !== 0 && compressionFlag !== 1) return Promise.resolve(textWarning("INVALID_VALUE", "PNG iTXt has an invalid compression flag."));
  if (compressionMethod !== 0) return Promise.resolve(textWarning("UNSUPPORTED_COMPRESSION", "PNG iTXt uses an unsupported compression method."));

  const languageStart = keywordEnd + 3;
  const languageEnd = findNull(data, languageStart);
  if (languageEnd === null) return Promise.resolve(textWarning("MALFORMED_PNG", "PNG iTXt language tag is not terminated."));
  const translatedStart = languageEnd + 1;
  const translatedEnd = findNull(data, translatedStart);
  if (translatedEnd === null) return Promise.resolve(textWarning("MALFORMED_PNG", "PNG iTXt translated keyword is not terminated."));

  const languageBytes = data.subarray(languageStart, languageEnd);
  const translatedBytes = data.subarray(translatedStart, translatedEnd);
  if (languageBytes.length > limits.maxStringBytes || translatedBytes.length > limits.maxStringBytes) {
    return Promise.resolve(textWarning("LIMIT_EXCEEDED", "PNG iTXt language or translated keyword exceeds the configured string limit."));
  }
  const language = decodeUtf8(languageBytes);
  const translatedKeyword = decodeUtf8(translatedBytes);
  if (language === null || translatedKeyword === null) {
    return Promise.resolve(textWarning("INVALID_VALUE", "PNG iTXt language or translated keyword is not valid UTF-8."));
  }

  const textStart = translatedEnd + 1;
  const sourceText = data.subarray(textStart);
  if (compressionFlag === 0) {
    if (sourceText.length > maxDecodedBytes) {
      return Promise.resolve(textWarning("LIMIT_EXCEEDED", "PNG decoded metadata exceeds the configured aggregate limit.", maxDecodedBytes + 1));
    }
    return Promise.resolve(parseTextBytes(type, data.subarray(0, keywordEnd), sourceText, limits, language, translatedKeyword));
  }
    return inflateZlib(sourceText, Math.min(limits.maxDecompressedBytes, maxDecodedBytes), signal).then((inflated) => {
      if (inflated.bytes === null) {
      return textWarning(inflated.error ?? "INVALID_VALUE", "PNG iTXt decompression failed or exceeded its output limit.", maxDecodedBytes + 1);
    }
    return parseTextBytes(type, data.subarray(0, keywordEnd), inflated.bytes, limits, language, translatedKeyword, true, sourceText);
  });
}

export async function inflateZlib(compressed: Uint8Array, maxOutputBytes: number, signal?: AbortSignal): Promise<InflateResult> {
  throwIfAborted(signal);
  if (typeof DecompressionStream !== "function") {
    return { bytes: null, error: "UNSUPPORTED_COMPRESSION" };
  }

  try {
    const payload = new Uint8Array(compressed.byteLength);
    payload.set(compressed);
    const stream = new Blob([payload.buffer]).stream().pipeThrough(new DecompressionStream("deflate"));
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      throwIfAborted(signal);
      const result = await reader.read();
      throwIfAborted(signal);
      if (result.done) break;
      const chunk = result.value;
      if (chunk.byteLength > maxOutputBytes - total) {
        await reader.cancel();
        return { bytes: null, error: "LIMIT_EXCEEDED" };
      }
      chunks.push(chunk.slice());
      total += chunk.byteLength;
    }
    const output = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      output.set(chunk, offset);
      offset += chunk.length;
    }
    return { bytes: output };
  } catch (error) {
    if (signal?.aborted) throw error;
    return { bytes: null, error: "INVALID_VALUE" };
  }
}

/** Parse bounded PNG chunks without decoding IDAT image pixels. */
export async function parsePng(bytes: Uint8Array, limits: SecurityLimits, selection?: ResolvedSelection, signal?: AbortSignal, registry?: MetadataRegistry): Promise<ParsedMetadataResult> {
  throwIfAborted(signal);
  const warnings: MetadataWarning[] = [];
  const fields: MetadataField[] = [];
  const blocks: MetadataBlock[] = [];
  const pngText: PngTextEntry[] = [];
  const xmpPackets: string[] = [];
  let icc: ParsedMetadataResult["icc"] = null;
  let iccMalformed = false;
  let exif: ExifData | null = null;
  let dimensions: ImageDimensions | null = null;
  let cursor: number = PNG_SIGNATURE.length;
  let chunkCount = 0;
  let metadataBytes = 0;
  let decompressedMetadataBytes = 0;
  let sawIhdr = false;
  let sawIdat = false;
  let sawIend = false;

  if (!isPngSignature(bytes)) {
    warningError(warnings, limits, {
      code: "MALFORMED_PNG",
      message: "PNG signature is truncated or invalid.",
      offset: 0,
    });
  } else {
    while (cursor < bytes.length) {
      throwIfAborted(signal);
      if (sawIend) {
        warning(warnings, limits, {
          code: "MALFORMED_PNG",
          message: "PNG contains bytes after its IEND chunk.",
          offset: cursor,
        });
        break;
      }
      if (chunkCount >= limits.maxPngChunks) {
        warningError(warnings, limits, {
          code: "LIMIT_EXCEEDED",
          message: `PNG chunk count exceeds the configured limit of ${limits.maxPngChunks}.`,
          offset: cursor,
        });
        break;
      }
      if (cursor > bytes.length - 12) {
        warningError(warnings, limits, {
          code: "TRUNCATED_DATA",
          message: "PNG chunk header or CRC is truncated.",
          offset: cursor,
        });
        break;
      }

      const length = uint32BigEndian(bytes, cursor);
      const dataStart = cursor + 8;
      if (length > bytes.length - dataStart - 4) {
        warningError(warnings, limits, {
          code: "TRUNCATED_DATA",
          message: "PNG chunk extends beyond the input.",
          offset: cursor,
          length,
        });
        break;
      }
      const dataEnd = dataStart + length;
      const next = dataEnd + 4;
      const type = chunkType(bytes, cursor + 4);
      chunkCount += 1;

      if (!isValidChunkType(bytes, cursor + 4)) {
        warning(warnings, limits, {
          code: "MALFORMED_PNG",
          message: "PNG chunk type contains non-letter bytes.",
          offset: cursor + 4,
          length: 4,
        });
        cursor = next;
        continue;
      }
      if (!sawIhdr && type !== "IHDR") {
        warning(warnings, limits, {
          code: "MALFORMED_PNG",
          message: "PNG must begin with an IHDR chunk.",
          offset: cursor + 4,
        });
      }

      const ancillary = isAncillaryChunk(type);
      const exceedsSegmentLimit = ancillary && length > limits.maxSegmentBytes;
      if (ancillary) {
        metadataBytes += length;
        if (exceedsSegmentLimit || metadataBytes > limits.maxMetadataBytes) {
          warning(warnings, limits, {
            code: "LIMIT_EXCEEDED",
            message: exceedsSegmentLimit
              ? `PNG ancillary chunk exceeds the configured segment limit of ${limits.maxSegmentBytes} bytes; this chunk was skipped.`
              : "PNG ancillary metadata exceeds the configured byte limit; this chunk was skipped.",
            offset: dataStart,
            length,
          });
        }
      }

      const shouldValidateCrc = type === "IHDR" || type === "IEND" || type === "eXIf" || type === "iCCP" || TEXT_CHUNK_TYPES.has(type as PngTextChunkType);
      const crcValid = !shouldValidateCrc || crc32(bytes, cursor + 4, dataEnd) === uint32BigEndian(bytes, dataEnd);
      if (!crcValid) {
        warning(warnings, limits, {
          code: "INVALID_VALUE",
          message: `PNG ${type} chunk has an invalid CRC and was not decoded.`,
          offset: dataEnd,
          length: 4,
        });
        cursor = next;
        continue;
      }

      const skippedBlock = (family: MetadataBlock["family"], container: string, sensitivity: MetadataBlock["sensitivity"]): void => {
        blocks.push({ id: `png:${type}:${cursor}`, family, container, status: "skipped", offset: cursor, length: next - cursor, associatedImage: null, sensitivity, warningCodes: [] });
      };
      if (type === "eXIf" && !wantsGroup(selection, "EXIF")) skippedBlock("EXIF", "eXIf chunk", "moderate");
      else if (type === "iCCP" && !wantsGroup(selection, "ICC")) skippedBlock("ICC", "iCCP chunk", "low");
      else if (TEXT_CHUNK_TYPES.has(type as PngTextChunkType) && !wantsGroup(selection, "PNGText") && !wantsGroup(selection, "XMP")) skippedBlock("PNGText", `${type} chunk`, "moderate");

      if (type === "IHDR") {
        if (sawIhdr || chunkCount !== 1 || length !== 13) {
          warning(warnings, limits, {
            code: "MALFORMED_PNG",
            message: "PNG must contain exactly one 13-byte IHDR chunk first.",
            offset: dataStart,
            length,
          });
        } else {
          sawIhdr = true;
          dimensions = wantsGroup(selection, "Dimensions") ? parsePngDimensions(bytes) : null;
          if (wantsGroup(selection, "Dimensions") && dimensions === null) {
            warning(warnings, limits, {
              code: "INVALID_VALUE",
              message: "PNG IHDR dimensions or image parameters are invalid.",
              offset: dataStart,
              length,
            });
          }
        }
      } else if (type === "IDAT") {
        sawIdat = true;
      } else if (wantsGroup(selection, "EXIF") && type === "eXIf") {
        const blockId = `png:eXIf:${cursor}`;
        blocks.push({ id: blockId, family: "EXIF", container: "eXIf chunk", status: "decoded", offset: cursor, length: next - cursor, associatedImage: null, sensitivity: "moderate", warningCodes: [] });
        if (length > limits.maxSegmentBytes || metadataBytes > limits.maxMetadataBytes) {
          // The bounded warning above is sufficient; do not materialize EXIF values.
        } else if (exif !== null) {
          warning(warnings, limits, {
            code: "DUPLICATE_EXIF",
            message: "A later PNG eXIf chunk was ignored.",
            offset: dataStart,
          });
        } else {
          const parsed = parseExif(bytes.subarray(dataStart, dataEnd), limits, dataStart, selection?.tags, registry);
          for (const item of parsed.warnings) {
            if (warnings.length >= limits.maxWarnings) break;
            warnings.push(item);
          }
          if (parsed.exif !== null) {
            const thumbnail = extractExifThumbnail(bytes.subarray(dataStart, dataEnd), parsed.exif, limits);
            exif = thumbnail === null ? parsed.exif : { ...parsed.exif, thumbnail };
            fields.push(...parsed.fields.map((field) => field.source === undefined ? field : ({
              ...field,
              source: {
                ...field.source,
                blockId,
                entryOffset: field.source.entryOffset === null ? null : dataStart + field.source.entryOffset,
                valueOffset: field.source.valueOffset === null ? null : dataStart + field.source.valueOffset,
              },
            })));
          }
        }
      } else if (wantsGroup(selection, "ICC") && type === "iCCP") {
        blocks.push({ id: `png:iCCP:${cursor}`, family: "ICC", container: "iCCP chunk", status: "decoded", offset: cursor, length: next - cursor, associatedImage: null, sensitivity: "low", warningCodes: [] });
        if (length > limits.maxSegmentBytes || metadataBytes > limits.maxMetadataBytes) {
          // The bounded warning above is sufficient; do not decompress this chunk.
          iccMalformed = true;
        } else if (icc !== null) {
          iccMalformed = true;
          warning(warnings, limits, { code: "INVALID_VALUE", message: "A later PNG iCCP chunk was ignored.", offset: dataStart });
        } else {
          const payload = bytes.subarray(dataStart, dataEnd);
          const keywordEnd = findNull(payload, 0);
          if (keywordEnd === null || !validKeyword(payload.subarray(0, keywordEnd)) || keywordEnd + 2 > payload.length) {
            iccMalformed = true;
            warning(warnings, limits, { code: "MALFORMED_PNG", message: "PNG iCCP chunk has an invalid profile name or truncated compression fields.", offset: dataStart, length });
          } else if (payload[keywordEnd + 1] !== 0) {
            iccMalformed = true;
            warning(warnings, limits, { code: "UNSUPPORTED_COMPRESSION", message: "PNG iCCP uses an unsupported compression method.", offset: dataStart + keywordEnd + 1 });
          } else {
            const remainingDecodedBytes = Math.max(0, limits.maxDecompressedMetadataBytes - decompressedMetadataBytes);
            const inflated = await inflateZlib(
              payload.subarray(keywordEnd + 2),
              Math.min(limits.maxDecompressedBytes, remainingDecodedBytes),
              signal,
            );
            if (inflated.bytes === null) {
              iccMalformed = true;
              decompressedMetadataBytes += remainingDecodedBytes + 1;
              warning(warnings, limits, { code: inflated.error ?? "INVALID_VALUE", message: "PNG iCCP profile decompression failed or exceeded its output limit.", offset: dataStart, length });
            } else {
              decompressedMetadataBytes += inflated.bytes.length;
              const chunk: IccChunk = { sequence: 1, total: 1, byteLength: inflated.bytes.length, data: inflated.bytes };
              const inspected = inspectIccProfile([chunk], limits);
              icc = inspected.data;
              for (const item of inspected.fields) {
                if (fields.length >= limits.maxIfdEntries) break;
                fields.push(item);
              }
              for (const item of inspected.warnings) warning(warnings, limits, item);
              if (inspected.warnings.length > 0) iccMalformed = true;
            }
          }
        }
      } else if ((wantsGroup(selection, "PNGText") || wantsGroup(selection, "XMP")) && TEXT_CHUNK_TYPES.has(type as PngTextChunkType)) {
        blocks.push({ id: `png:${type}:${cursor}`, family: "PNGText", container: `${type} chunk`, status: "decoded", offset: cursor, length: next - cursor, associatedImage: null, sensitivity: "moderate", warningCodes: [] });
        if (length > limits.maxSegmentBytes || metadataBytes > limits.maxMetadataBytes) {
          // The bounded warning above is sufficient; avoid decoding this chunk.
        } else {
          const remainingDecodedBytes = Math.max(0, limits.maxDecompressedMetadataBytes - decompressedMetadataBytes);
          const parsed = await parseTextChunk(
            type as PngTextChunkType,
            bytes.subarray(dataStart, dataEnd),
            limits,
            remainingDecodedBytes,
            signal,
          );
          decompressedMetadataBytes += parsed.decodedBytes;
          if (parsed.warning !== undefined) {
            warning(warnings, limits, {
              code: parsed.warning.code,
              message: parsed.warning.message,
              offset: dataStart,
              length,
            });
          } else if (parsed.entry !== null) {
            if (wantsGroup(selection, "PNGText")) pngText.push(parsed.entry);
            if (wantsGroup(selection, "XMP") && parsed.xmp !== null) xmpPackets.push(parsed.xmp);
          }
        }
      } else if (type === "IEND") {
        if (length !== 0) {
          warning(warnings, limits, {
            code: "MALFORMED_PNG",
            message: "PNG IEND chunk must have zero data bytes.",
            offset: dataStart,
            length,
          });
        }
        sawIend = true;
      }

      cursor = next;
    }
  }

  if (!sawIhdr) {
    warningError(warnings, limits, {
      code: "MALFORMED_PNG",
      message: "PNG has no valid IHDR chunk.",
    });
  }
  if (!sawIdat) {
    warning(warnings, limits, {
      code: "MALFORMED_PNG",
      message: "PNG has no IDAT image-data chunk.",
    });
  }
  if (!sawIend) {
    warningError(warnings, limits, {
      code: "TRUNCATED_DATA",
      message: "PNG has no terminating IEND chunk.",
      offset: bytes.length,
    });
  }

  const resolvedBlocks = blocks.map((block) => {
    if (block.offset === null || block.length === null) return block;
    const offset = block.offset;
    const length = block.length;
    const local = warnings.filter((item) => item.offset !== undefined && item.offset >= offset && item.offset < offset + length);
    return { ...block, status: block.family === "ICC" && iccMalformed ? "malformed" : local.some((item) => item.severity === "error") ? "partial" : block.status, warningCodes: [...new Set(local.map((item) => item.code))] };
  });
  return {
    format: "png",
    mimeType: "image/png",
    dimensions,
    fields,
    exif,
    xmp: xmpPackets.length > 0 ? { packets: xmpPackets } : null,
    iptc: null,
    icc,
    jfif: null,
    pngText,
    blocks: resolvedBlocks,
    warnings,
  };
}
