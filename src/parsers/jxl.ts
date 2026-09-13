import { parseExif } from "../metadata/exif.js";
import { wantsGroup, type ResolvedSelection } from "../selection.js";
import { throwIfAborted } from "../security/abort.js";
import type { ExifData, JxlBrotliDecompressor, MetadataBlock, MetadataField, MetadataWarning, ParsedMetadataResult, SecurityLimits } from "../types.js";
import type { MetadataRegistry } from "../registry.js";

const JXL_CONTAINER_SIGNATURE = [0x00, 0x00, 0x00, 0x0c, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a];
const JXL_CODESTREAM_MARKER = [0xff, 0x0a];
const JXL_DIMENSION_HEADER_BYTES = 16;

interface Box {
  readonly type: string;
  readonly offset: number;
  readonly headerLength: number;
  readonly payloadOffset: number;
  readonly payloadLength: number;
}

interface DimensionResult {
  readonly dimensions: { readonly width: number; readonly height: number } | null;
  readonly status: "ok" | "truncated" | "invalid";
}

interface BrotliResult {
  readonly bytes: Uint8Array | null;
  readonly error?: "UNSUPPORTED_COMPRESSION" | "INVALID_VALUE" | "LIMIT_EXCEEDED";
}

interface JxlpFragment {
  readonly sequence: number;
  readonly last: boolean;
  readonly payload: Uint8Array;
  readonly offset: number;
}

function uint32(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] ?? 0) * 0x1000000) + ((bytes[offset + 1] ?? 0) << 16) + ((bytes[offset + 2] ?? 0) << 8) + (bytes[offset + 3] ?? 0);
}

function uint64(bytes: Uint8Array, offset: number): number | null {
  const high = uint32(bytes, offset);
  const low = uint32(bytes, offset + 4);
  const value = BigInt(high) * 0x100000000n + BigInt(low);
  return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : null;
}

function boxType(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(bytes[offset] ?? 0, bytes[offset + 1] ?? 0, bytes[offset + 2] ?? 0, bytes[offset + 3] ?? 0);
}

function isTiffHeader(bytes: Uint8Array): boolean {
  return bytes.length >= 8 && ((bytes[0] === 0x49 && bytes[1] === 0x49) || (bytes[0] === 0x4d && bytes[1] === 0x4d));
}

function jxlExif(payload: Uint8Array): Uint8Array | null {
  if (isTiffHeader(payload)) return payload;
  if (payload.length < 4) return null;
  const offset = uint32(payload, 0);
  return offset <= payload.length - 4 ? payload.subarray(4 + offset) : null;
}

function decodeUtf8(bytes: Uint8Array): string | null {
  try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { return null; }
}

/** JPEG XL's codestream size header is little-endian at bit granularity. */
class BitReader {
  private bitOffset = 0;

  public constructor(private readonly bytes: Uint8Array) {}

  public read(bits: number): number | null {
    if (!Number.isSafeInteger(bits) || bits < 0 || bits > 32 || this.bitOffset > this.bytes.length * 8 - bits) return null;
    let value = 0;
    for (let index = 0; index < bits; index += 1) {
      const offset = this.bitOffset + index;
      const byte = this.bytes[Math.floor(offset / 8)];
      if (byte === undefined) return null;
      value += ((byte >>> (offset % 8)) & 1) * (2 ** index);
    }
    this.bitOffset += bits;
    return value;
  }
}

function readSizeValue(reader: BitReader): number | null {
  const selector = reader.read(2);
  if (selector === null) return null;
  const extraBits = [9, 13, 18, 30][selector];
  if (extraBits === undefined) return null;
  const value = reader.read(extraBits);
  return value === null ? null : value + 1;
}

function parseCodestreamDimensions(codestream: Uint8Array): DimensionResult {
  if (codestream.length < 2 || codestream[0] !== JXL_CODESTREAM_MARKER[0] || codestream[1] !== JXL_CODESTREAM_MARKER[1]) return { dimensions: null, status: "invalid" };
  const reader = new BitReader(codestream.subarray(2, Math.min(codestream.length, JXL_DIMENSION_HEADER_BYTES)));
  const small = reader.read(1);
  if (small === null) return { dimensions: null, status: "truncated" };
  let height: number | null;
  if (small === 1) {
    const encoded = reader.read(5);
    height = encoded === null ? null : (encoded + 1) * 8;
  } else {
    height = readSizeValue(reader);
  }
  const ratio = reader.read(3);
  if (height === null || ratio === null) return { dimensions: null, status: "truncated" };

  const ratios: readonly [number, number][] = [[1, 1], [12, 10], [4, 3], [3, 2], [16, 9], [5, 4], [2, 1]];
  let width: number | null;
  if (ratio === 0) {
    if (small === 1) {
      const encoded = reader.read(5);
      width = encoded === null ? null : (encoded + 1) * 8;
    } else {
      width = readSizeValue(reader);
    }
  } else {
    const aspect = ratios[ratio - 1];
    width = aspect === undefined ? null : Math.floor(height * aspect[0] / aspect[1]);
  }
  if (width === null) return { dimensions: null, status: "truncated" };
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || width > 0xffffffff || height > 0xffffffff) return { dimensions: null, status: "invalid" };
  return { dimensions: { width, height }, status: "ok" };
}

function copyHeaderParts(parts: readonly Uint8Array[]): Uint8Array {
  const length = parts.reduce((total, part) => Math.min(JXL_DIMENSION_HEADER_BYTES, total + part.length), 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    if (offset >= output.length) break;
    const count = Math.min(part.length, output.length - offset);
    output.set(part.subarray(0, count), offset);
    offset += count;
  }
  return output;
}

function pushWarning(warnings: MetadataWarning[], limits: SecurityLimits, warning: MetadataWarning): void {
  if (warnings.length < limits.maxWarnings) warnings.push(warning);
}

function codestreamHeader(boxes: readonly Box[], bytes: Uint8Array, warnings: MetadataWarning[], limits: SecurityLimits): Uint8Array | null {
  const complete = boxes.filter((box) => box.type === "jxlc");
  const partial = boxes.filter((box) => box.type === "jxlp");
  let structurallyValid = true;
  if (complete.length > 0 && partial.length > 0) {
    structurallyValid = false;
    pushWarning(warnings, limits, { code: "MALFORMED_JXL", message: "JPEG XL container contains both a complete and partial codestream.", severity: "error" });
  }
  if (complete.length > 1) {
    structurallyValid = false;
    pushWarning(warnings, limits, { code: "MALFORMED_JXL", message: "JPEG XL container contains more than one complete codestream box.", severity: "error" });
  }
  if (complete[0] !== undefined) {
    const box = complete[0];
    return structurallyValid ? bytes.subarray(box.payloadOffset, box.payloadOffset + box.payloadLength) : null;
  }
  if (partial.length === 0) return null;

  const fragments: JxlpFragment[] = [];
  for (const box of partial) {
    if (box.payloadLength < 4) {
      pushWarning(warnings, limits, { code: "MALFORMED_JXL", message: "JPEG XL partial codestream box is missing its sequence number.", severity: "error", offset: box.payloadOffset, length: box.payloadLength });
      continue;
    }
    const sequenceWord = uint32(bytes, box.payloadOffset);
    fragments.push({ sequence: sequenceWord & 0x7fffffff, last: (sequenceWord & 0x80000000) !== 0, payload: bytes.subarray(box.payloadOffset + 4, box.payloadOffset + box.payloadLength), offset: box.offset });
  }
  fragments.sort((left, right) => left.sequence - right.sequence);
  const parts: Uint8Array[] = [];
  let expected = 0;
  let lastCount = 0;
  let lastSequence: number | null = null;
  let headerBytes = 0;
  for (const fragment of fragments) {
    if (fragment.sequence !== expected) {
      structurallyValid = false;
      pushWarning(warnings, limits, { code: "MALFORMED_JXL", message: "JPEG XL partial codestream sequence numbers are duplicated or have a gap.", severity: "error", offset: fragment.offset });
      expected = fragment.sequence;
    }
    expected += 1;
    if (fragment.last) {
      lastCount += 1;
      lastSequence = fragment.sequence;
    }
    if (headerBytes < JXL_DIMENSION_HEADER_BYTES) {
      parts.push(fragment.payload);
      headerBytes = Math.min(JXL_DIMENSION_HEADER_BYTES, headerBytes + fragment.payload.length);
    }
  }
  if (fragments[0]?.sequence !== 0 || lastCount !== 1 || lastSequence !== fragments.at(-1)?.sequence) {
    structurallyValid = false;
    pushWarning(warnings, limits, { code: "MALFORMED_JXL", message: "JPEG XL partial codestream does not identify a contiguous stream from sequence zero to its final fragment.", severity: "error" });
  }
  return structurallyValid && fragments.length <= limits.maxSegments ? copyHeaderParts(parts) : null;
}

async function platformBrotliDecompress(compressed: Uint8Array, maxOutputBytes: number, signal?: AbortSignal): Promise<BrotliResult> {
  throwIfAborted(signal);
  if (typeof DecompressionStream !== "function" || typeof Blob !== "function") return { bytes: null, error: "UNSUPPORTED_COMPRESSION" };
  try {
    const input = new Uint8Array(compressed.length);
    input.set(compressed);
    // Chromium currently exposes DecompressionStream without the Brotli format.
    let stream: ReadableStream<Uint8Array>;
    try {
      stream = new Blob([input.buffer]).stream().pipeThrough(new DecompressionStream("brotli" as never));
    } catch {
      return { bytes: null, error: "UNSUPPORTED_COMPRESSION" };
    }
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

function copyReturnedBytes(value: unknown): Uint8Array | null {
  if (!ArrayBuffer.isView(value) || value instanceof DataView) return null;
  const view = value as Uint8Array;
  return new Uint8Array(view.buffer, view.byteOffset, view.byteLength).slice();
}

async function decompressBrotli(compressed: Uint8Array, maxOutputBytes: number, signal: AbortSignal | undefined, custom?: JxlBrotliDecompressor): Promise<BrotliResult> {
  if (custom === undefined) return platformBrotliDecompress(compressed, maxOutputBytes, signal);
  try {
    throwIfAborted(signal);
    const result = copyReturnedBytes(await custom(compressed.slice(), maxOutputBytes, signal));
    if (result === null) return { bytes: null, error: "INVALID_VALUE" };
    if (result.byteLength > maxOutputBytes) return { bytes: null, error: "LIMIT_EXCEEDED" };
    return { bytes: result };
  } catch (error) {
    if (signal?.aborted) throw error;
    return { bytes: null, error: "INVALID_VALUE" };
  }
}

function metadataBlock(id: string, family: "EXIF" | "XMP" | "Unknown", container: string, status: MetadataBlock["status"], box: Box, warningCodes: readonly MetadataWarning["code"][]): MetadataBlock {
  return { id, family, container, status, offset: box.offset, length: box.headerLength + box.payloadLength, associatedImage: null, sensitivity: family === "Unknown" ? "high" : "moderate", warningCodes };
}

function rebaseFields(fields: readonly MetadataField[], blockId: string, compressed: boolean): MetadataField[] {
  return fields.map((field) => field.source === undefined
    ? { ...field, source: { blockId, entryOffset: null, entryLength: null, valueOffset: null, valueLength: null } }
    : {
        ...field,
        source: compressed
          ? { ...field.source, blockId, entryOffset: null, entryLength: null, valueOffset: null, valueLength: null }
          : { ...field.source, blockId },
      });
}

export async function parseJxl(
  bytes: Uint8Array,
  limits: SecurityLimits,
  selection?: ResolvedSelection,
  signal?: AbortSignal,
  registry?: MetadataRegistry,
  customBrotliDecompressor?: JxlBrotliDecompressor,
): Promise<ParsedMetadataResult> {
  const warnings: MetadataWarning[] = [];
  const includeDimensions = wantsGroup(selection, "Dimensions");
  const includeExif = wantsGroup(selection, "EXIF");
  const includeXmp = wantsGroup(selection, "XMP");
  const rawCodestream = bytes.length >= 2 && bytes[0] === JXL_CODESTREAM_MARKER[0] && bytes[1] === JXL_CODESTREAM_MARKER[1];
  if (rawCodestream) {
    const parsed = includeDimensions ? parseCodestreamDimensions(bytes) : { dimensions: null, status: "ok" as const };
    if (includeDimensions && parsed.status !== "ok") pushWarning(warnings, limits, { code: parsed.status === "truncated" ? "TRUNCATED_DATA" : "MALFORMED_JXL", message: "JPEG XL raw codestream size header is truncated or invalid.", severity: "warning", offset: 2 });
    pushWarning(warnings, limits, { code: "UNSUPPORTED_STRUCTURE", message: "Raw JPEG XL codestream metadata is not externally box-addressable; only its codestream dimensions were inspected.", severity: "warning" });
    return {
      format: "jxl", mimeType: "image/jxl", dimensions: parsed.dimensions, fields: [], exif: null, xmp: null, iptc: null, icc: null, jfif: null, pngText: [],
      warnings,
    };
  }
  if (bytes.length < JXL_CONTAINER_SIGNATURE.length || JXL_CONTAINER_SIGNATURE.some((byte, index) => bytes[index] !== byte)) {
    return {
      format: "jxl", mimeType: "image/jxl", dimensions: null, fields: [], exif: null, xmp: null, iptc: null, icc: null, jfif: null, pngText: [],
      warnings: [{ code: "MALFORMED_JXL", message: "JPEG XL container signature is truncated or invalid.", severity: "error", offset: 0, length: bytes.length }],
    };
  }

  const boxes: Box[] = [];
  let cursor = JXL_CONTAINER_SIGNATURE.length;
  while (cursor < bytes.length) {
    throwIfAborted(signal);
    if (boxes.length >= limits.maxSegments || cursor > bytes.length - 8) {
      pushWarning(warnings, limits, { code: "MALFORMED_JXL", message: "JPEG XL box sequence is truncated or exceeds the configured box limit.", severity: "error", offset: cursor });
      break;
    }
    const shortSize = uint32(bytes, cursor);
    const type = boxType(bytes, cursor + 4);
    let headerLength = 8;
    let size = shortSize;
    if (shortSize === 1) {
      if (cursor > bytes.length - 16) { pushWarning(warnings, limits, { code: "MALFORMED_JXL", message: "JPEG XL extended-size box is truncated.", severity: "error", offset: cursor }); break; }
      const large = uint64(bytes, cursor + 8);
      if (large === null) { pushWarning(warnings, limits, { code: "UNSAFE_OFFSET", message: "JPEG XL extended-size box exceeds the safe integer range.", severity: "error", offset: cursor }); break; }
      size = large;
      headerLength = 16;
    } else if (shortSize === 0) {
      size = bytes.length - cursor;
    }
    if (!Number.isSafeInteger(size) || size < headerLength || size > bytes.length - cursor) {
      pushWarning(warnings, limits, { code: "MALFORMED_JXL", message: "JPEG XL box length is invalid.", severity: "error", offset: cursor, length: size });
      break;
    }
    boxes.push({ type, offset: cursor, headerLength, payloadOffset: cursor + headerLength, payloadLength: size - headerLength });
    cursor += size;
  }

  let dimensions: { readonly width: number; readonly height: number } | null = null;
  if (includeDimensions) {
    const header = codestreamHeader(boxes, bytes, warnings, limits);
    if (header !== null) {
      const parsed = parseCodestreamDimensions(header);
      dimensions = parsed.dimensions;
      if (parsed.status !== "ok") pushWarning(warnings, limits, { code: parsed.status === "truncated" ? "TRUNCATED_DATA" : "MALFORMED_JXL", message: "JPEG XL codestream size header is truncated or invalid.", severity: "warning" });
    }
  }

  let exif: ExifData | null = null;
  const fields: MetadataField[] = [];
  const provenance: MetadataBlock[] = [];
  const packets: string[] = [];
  let metadataBytes = 0;
  let decompressedMetadataBytes = 0;

  for (const box of boxes) {
    throwIfAborted(signal);
    let metadataType = box.type;
    let payload: Uint8Array | null = null;
    let compressed = false;
    if (box.type === "brob") {
      if (box.payloadLength < 4) {
        pushWarning(warnings, limits, { code: "MALFORMED_JXL", message: "JPEG XL Brotli-compressed box is missing its underlying box type.", severity: "warning", offset: box.payloadOffset, length: box.payloadLength });
        provenance.push(metadataBlock(`jxl:brob:${box.offset}`, "Unknown", "Brotli-compressed box", "malformed", box, ["MALFORMED_JXL"]));
        continue;
      }
      const innerType = boxType(bytes, box.payloadOffset);
      if (innerType !== "Exif" && innerType !== "xml ") {
        pushWarning(warnings, limits, { code: "UNSUPPORTED_STRUCTURE", message: "JPEG XL Brotli-compressed box contains an unsupported underlying box type.", severity: "warning", offset: box.payloadOffset, length: 4 });
        provenance.push(metadataBlock(`jxl:brob:${box.offset}`, "Unknown", `Brotli-compressed ${innerType} box`, "opaque", box, ["UNSUPPORTED_STRUCTURE"]));
        continue;
      }
      metadataType = innerType;
      compressed = true;
      const family = metadataType === "Exif" ? "EXIF" : "XMP";
      if ((family === "EXIF" && !includeExif) || (family === "XMP" && !includeXmp)) {
        provenance.push(metadataBlock(`jxl:brob:${box.offset}`, family, `Brotli-compressed ${metadataType} box`, "skipped", box, []));
        continue;
      }
      if (box.payloadLength - 4 > limits.maxMetadataBytes) {
        pushWarning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "JPEG XL Brotli-compressed metadata exceeds the configured compressed metadata limit.", severity: "warning", offset: box.payloadOffset + 4, length: box.payloadLength - 4 });
        provenance.push(metadataBlock(`jxl:brob:${box.offset}`, family, `Brotli-compressed ${metadataType} box`, "partial", box, ["LIMIT_EXCEEDED"]));
        continue;
      }
      if (metadataBytes > limits.maxMetadataBytes - (box.payloadLength - 4)) {
        pushWarning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "JPEG XL metadata boxes exceed the configured cumulative metadata limit.", severity: "warning", offset: box.payloadOffset + 4, length: box.payloadLength - 4 });
        provenance.push(metadataBlock(`jxl:brob:${box.offset}`, family, `Brotli-compressed ${metadataType} box`, "partial", box, ["LIMIT_EXCEEDED"]));
        continue;
      }
      metadataBytes += box.payloadLength - 4;
      const available = Math.min(limits.maxMetadataBytes, limits.maxDecompressedBytes, limits.maxDecompressedMetadataBytes - decompressedMetadataBytes);
      if (available < 1) {
        pushWarning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "JPEG XL decompressed metadata exceeds the configured cumulative limit.", severity: "warning", offset: box.payloadOffset + 4 });
        provenance.push(metadataBlock(`jxl:brob:${box.offset}`, family, `Brotli-compressed ${metadataType} box`, "partial", box, ["LIMIT_EXCEEDED"]));
        continue;
      }
      const decoded = await decompressBrotli(bytes.slice(box.payloadOffset + 4, box.payloadOffset + box.payloadLength), available, signal, customBrotliDecompressor);
      if (decoded.bytes === null) {
        const code = decoded.error ?? "INVALID_VALUE";
        pushWarning(warnings, limits, { code, message: code === "UNSUPPORTED_COMPRESSION" ? "JPEG XL Brotli metadata requires an injected decoder because this runtime does not provide Brotli DecompressionStream support." : code === "LIMIT_EXCEEDED" ? "JPEG XL Brotli metadata exceeds the configured decompressed output limit." : "JPEG XL Brotli metadata could not be decompressed.", severity: "warning", offset: box.payloadOffset + 4, length: box.payloadLength - 4 });
        provenance.push(metadataBlock(`jxl:brob:${box.offset}`, family, `Brotli-compressed ${metadataType} box`, code === "UNSUPPORTED_COMPRESSION" ? "opaque" : "malformed", box, [code]));
        continue;
      }
      payload = decoded.bytes;
      decompressedMetadataBytes += payload.length;
    } else if (box.type === "Exif" || box.type === "xml ") {
      metadataType = box.type;
      payload = bytes.subarray(box.payloadOffset, box.payloadOffset + box.payloadLength);
      const family = box.type === "Exif" ? "EXIF" : "XMP";
      if ((family === "EXIF" && !includeExif) || (family === "XMP" && !includeXmp)) {
        provenance.push(metadataBlock(`jxl:${box.type}:${box.offset}`, family, `${box.type} box`, "skipped", box, []));
        continue;
      }
      if (box.payloadLength > limits.maxMetadataBytes) {
        pushWarning(warnings, limits, { code: "LIMIT_EXCEEDED", message: `JPEG XL ${box.type} box exceeds the configured metadata limit.`, severity: "warning", offset: box.payloadOffset, length: box.payloadLength });
        provenance.push(metadataBlock(`jxl:${box.type}:${box.offset}`, family, `${box.type} box`, "partial", box, ["LIMIT_EXCEEDED"]));
        continue;
      }
      if (metadataBytes > limits.maxMetadataBytes - box.payloadLength) {
        pushWarning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "JPEG XL metadata boxes exceed the configured cumulative metadata limit.", severity: "warning", offset: box.payloadOffset, length: box.payloadLength });
        provenance.push(metadataBlock(`jxl:${box.type}:${box.offset}`, family, `${box.type} box`, "partial", box, ["LIMIT_EXCEEDED"]));
        continue;
      }
      metadataBytes += box.payloadLength;
    } else continue;

    const family = metadataType === "Exif" ? "EXIF" : "XMP";
    const blockId = `jxl:${compressed ? "brob:" : `${metadataType}:`}${box.offset}`;
    let status: MetadataBlock["status"] = "decoded";
    const warningCodes: MetadataWarning["code"][] = [];
    if (metadataType === "Exif") {
      const tiff = jxlExif(payload);
      if (tiff === null) {
        status = "malformed";
        warningCodes.push("MALFORMED_EXIF");
        pushWarning(warnings, limits, { code: "MALFORMED_EXIF", message: "JPEG XL Exif box does not contain a valid TIFF payload offset.", severity: "warning", offset: box.payloadOffset, length: box.payloadLength });
      } else {
        const relativeTiffOffset = tiff.byteOffset - payload.byteOffset;
        const tiffOffset = compressed ? box.payloadOffset : box.payloadOffset + relativeTiffOffset;
        const parsed = parseExif(tiff, limits, tiffOffset, selection?.tags, registry);
        const rebasedFields = rebaseFields(parsed.fields, blockId, compressed);
        if (exif === null && parsed.exif !== null) exif = { ...parsed.exif, fields: rebasedFields };
        fields.push(...rebasedFields);
        for (const warning of parsed.warnings) pushWarning(warnings, limits, warning);
        if (parsed.warnings.some((warning) => warning.severity === "error" || warning.code === "MALFORMED_EXIF")) {
          status = "malformed";
          warningCodes.push("MALFORMED_EXIF");
        }
      }
    } else {
      if (payload.length > limits.maxStringBytes) {
        status = "partial";
        warningCodes.push("LIMIT_EXCEEDED");
        pushWarning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "JPEG XL XML metadata exceeds the configured string limit.", severity: "warning", offset: box.payloadOffset, length: payload.length });
      } else {
        const packet = decodeUtf8(payload);
        if (packet === null) {
          status = "malformed";
          warningCodes.push("INVALID_VALUE");
          pushWarning(warnings, limits, { code: "INVALID_VALUE", message: "JPEG XL XML box is not valid UTF-8.", severity: "warning", offset: box.payloadOffset, length: box.payloadLength });
        } else if (packets.length >= limits.maxXmpPackets) {
          status = "partial";
          warningCodes.push("LIMIT_EXCEEDED");
          pushWarning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "JPEG XL XML metadata exceeds the configured packet count limit.", severity: "warning", offset: box.payloadOffset, length: box.payloadLength });
        } else {
          packets.push(packet);
        }
      }
    }
    provenance.push(metadataBlock(blockId, family, compressed ? `Brotli-compressed ${metadataType} box` : `${metadataType} box`, status, box, warningCodes));
  }
  return { format: "jxl", mimeType: "image/jxl", dimensions, fields, exif, xmp: packets.length > 0 ? { packets } : null, iptc: null, icc: null, jfif: null, pngText: [], blocks: provenance, warnings: warnings.slice(0, limits.maxWarnings) };
}
