import { detectFormat } from "./detect-format.js";
import { MetadataError, type MetadataInput, type MetadataWarning, type SecurityLimits } from "./types.js";
import { jpegHeaderEnd } from "./jpeg-header.js";
import { wantsGroup, type ResolvedSelection } from "./selection.js";
import { materializeTiffMetadata } from "./tiff-range.js";
import { materializeHeifMetadata } from "./heif-range.js";
import { materializeJpegMetadata } from "./jpeg-range.js";
import { throwIfAborted } from "./security/abort.js";
import { createByteSource, type ByteSource } from "./io/byte-source.js";
import type { ReadTelemetry } from "./types.js";

export interface MetadataMaterialization {
  readonly bytes: Uint8Array;
  readonly partial: boolean;
  readonly bytesRead?: number;
  readonly inputBytes?: number;
  readonly warnings: readonly MetadataWarning[];
  readonly telemetry?: ReadTelemetry;
  /** Map offsets in a compact parser view back to source-file offsets. */
  readonly mapOffset?: (offset: number) => number;
}

export function isBlobLike(value: unknown): value is Blob {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { readonly size?: unknown; readonly arrayBuffer?: unknown };
  return typeof candidate.size === "number" && typeof candidate.arrayBuffer === "function";
}

/**
 * Read only the JPEG prefix through the start-of-scan header. Blob slices avoid
 * materialising pixel data for latency-sensitive metadata previews.
 */
export async function materializeJpegHeader(input: MetadataInput, limits: SecurityLimits, signal?: AbortSignal): Promise<Uint8Array> {
  throwIfAborted(signal);
  if (!isBlobLike(input)) {
    const bytes = await materializeInput(input, limits, signal);
    const end = jpegHeaderEnd(bytes);
    return end === null ? bytes : bytes.subarray(0, end).slice();
  }
  if (typeof input.slice !== "function") throw new MetadataError("INVALID_VALUE", "Blob or File inputs used with JPEG header scope must implement slice().");
  if (!Number.isSafeInteger(input.size) || input.size < 0) throw new MetadataError("INVALID_VALUE", "Blob size must be a non-negative safe integer.");
  if (input.size > limits.maxInputBytes) throw new MetadataError("LIMIT_EXCEEDED", `Input is ${input.size} bytes; the configured limit is ${limits.maxInputBytes} bytes.`);
  let end = Math.min(input.size, 64 * 1024);
  for (;;) {
    throwIfAborted(signal);
    const buffer = await input.slice(0, end).arrayBuffer();
    throwIfAborted(signal);
    if (!isArrayBuffer(buffer)) throw new MetadataError("INVALID_VALUE", "Blob or File slice arrayBuffer() must resolve to an ArrayBuffer.");
    const bytes = new Uint8Array(buffer);
    const headerEnd = jpegHeaderEnd(bytes);
    if (headerEnd !== null) return bytes.subarray(0, headerEnd).slice();
    if (end >= input.size) return bytes;
    end = Math.min(input.size, end * 2);
  }
}

function uint32BigEndian(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) * 0x1000000 + (bytes[offset + 1] ?? 0) * 0x10000 + (bytes[offset + 2] ?? 0) * 0x100 + (bytes[offset + 3] ?? 0);
}

function uint32LittleEndian(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) + (bytes[offset + 1] ?? 0) * 0x100 + (bytes[offset + 2] ?? 0) * 0x10000 + (bytes[offset + 3] ?? 0) * 0x1000000;
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function concatenate(parts: readonly Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(data.byteLength + 12);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.byteLength);
  chunk.set(Array.from(type, (character) => character.charCodeAt(0)), 4);
  chunk.set(data, 8);
  let crc = 0xffffffff;
  for (let index = 4; index < data.byteLength + 8; index += 1) {
    crc ^= chunk[index] ?? 0;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  view.setUint32(data.byteLength + 8, (crc ^ 0xffffffff) >>> 0);
  return chunk;
}

function webpChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(8 + data.byteLength + (data.byteLength & 1));
  chunk.set(Array.from(type, (character) => character.charCodeAt(0)), 0);
  new DataView(chunk.buffer).setUint32(4, data.byteLength, true);
  chunk.set(data, 8);
  return chunk;
}

function selectedPngChunk(type: string, selection: ResolvedSelection): boolean {
  if (type === "IHDR" || type === "IEND") return true;
  if (type === "eXIf") return wantsGroup(selection, "EXIF");
  if (type === "iCCP") return wantsGroup(selection, "ICC");
  if (type === "tEXt" || type === "zTXt" || type === "iTXt") return wantsGroup(selection, "PNGText") || wantsGroup(selection, "XMP");
  return false;
}

function selectedWebpChunk(type: string, selection: ResolvedSelection): boolean {
  if (type === "EXIF") return wantsGroup(selection, "EXIF");
  if (type === "XMP ") return wantsGroup(selection, "XMP");
  if (type === "ICCP") return wantsGroup(selection, "ICC");
  return false;
}

export interface BlobReader {
  readonly size: number;
  readonly read: (start: number, end: number) => Promise<Uint8Array>;
  readonly bytesRead: () => number;
  readonly telemetry: () => ReadTelemetry;
}

function blobReader(input: Blob, limits: SecurityLimits, signal?: AbortSignal): BlobReader {
  const source: ByteSource = createByteSource(input, limits, signal);
  return {
    size: source.size,
    read: source.read,
    bytesRead: () => source.telemetry().bytesRead,
    telemetry: source.telemetry,
  };
}

async function materializePngMetadata(reader: BlobReader, selection: ResolvedSelection, limits: SecurityLimits): Promise<MetadataMaterialization> {
  const signature = await reader.read(0, Math.min(reader.size, 8));
  if (signature.length < 8 || ascii(signature, 0, 8) !== "\x89PNG\r\n\x1a\n") return { bytes: await reader.read(0, reader.size), partial: false, inputBytes: reader.size, bytesRead: reader.bytesRead(), warnings: [], telemetry: reader.telemetry() };
  const chunks: Uint8Array[] = [];
  let cursor = 8;
  let sawIdat = false;
  let sawIend = false;
  let metadataBytes = 0;
  const warnings: MetadataWarning[] = [];
  while (cursor + 8 <= reader.size) {
    const header = await reader.read(cursor, cursor + 8);
    const length = uint32BigEndian(header, 0);
    const type = ascii(header, 4, 4);
    if (!Number.isSafeInteger(length) || length > reader.size - cursor - 12) {
      return { bytes: await reader.read(0, reader.size), partial: false, inputBytes: reader.size, bytesRead: reader.bytesRead(), warnings: [], telemetry: reader.telemetry() };
    }
    const next = cursor + 12 + length;
    if (type === "IDAT") {
      sawIdat = true;
    } else if (selectedPngChunk(type, selection)) {
      const chunkLength = next - cursor;
      metadataBytes += type === "IHDR" || type === "IEND" ? 0 : length;
      if (chunkLength > limits.maxSegmentBytes + 12 && type !== "IHDR" && type !== "IEND") {
        warnings.push({ code: "LIMIT_EXCEEDED", message: `PNG ${type} metadata chunk exceeds the configured segment limit and was not read.`, severity: "warning", offset: cursor, length: chunkLength });
      } else if (metadataBytes > limits.maxMetadataBytes && type !== "IHDR" && type !== "IEND") {
        warnings.push({ code: "LIMIT_EXCEEDED", message: "PNG selected metadata exceeds the configured metadata budget and later chunks were not read.", severity: "warning", offset: cursor, length });
      } else {
        chunks.push(await reader.read(cursor, next));
      }
    }
    cursor = next;
    if (type === "IEND") { sawIend = true; break; }
  }
  const iendIndex = chunks.findIndex((chunk) => ascii(chunk, 4, 4) === "IEND");
  if (sawIdat || iendIndex >= 0) chunks.splice(iendIndex < 0 ? chunks.length : iendIndex, 0, pngChunk("IDAT", new Uint8Array()));
  const bytes = concatenate([signature, ...chunks]);
  if (sawIend && cursor < reader.size) warnings.push({ code: "MALFORMED_PNG", message: "PNG contains bytes after its IEND chunk; trailing bytes were not read.", severity: "warning", offset: cursor, length: reader.size - cursor });
  return {
    bytes,
    partial: true,
    bytesRead: reader.bytesRead(),
    inputBytes: reader.size,
    warnings: sawIend ? warnings : [...warnings, { code: "TRUNCATED_DATA", message: "PNG metadata scan did not reach IEND.", severity: "error", offset: cursor }],
    telemetry: reader.telemetry(),
  };
}

async function materializeWebpMetadata(reader: BlobReader, selection: ResolvedSelection, limits: SecurityLimits): Promise<MetadataMaterialization> {
  const header = await reader.read(0, Math.min(reader.size, 12));
  if (header.length < 12 || ascii(header, 0, 4) !== "RIFF" || ascii(header, 8, 4) !== "WEBP") return { bytes: await reader.read(0, reader.size), partial: false, inputBytes: reader.size, bytesRead: reader.bytesRead(), warnings: [], telemetry: reader.telemetry() };
  const chunks: Uint8Array[] = [];
  let cursor = 12;
  let imageChunk: Uint8Array | null = null;
  let metadataBytes = 0;
  const warnings: MetadataWarning[] = [];
  const declaredEnd = uint32LittleEndian(header, 4) + 8;
  if (!Number.isSafeInteger(declaredEnd) || declaredEnd > reader.size) return { bytes: await reader.read(0, reader.size), partial: false, inputBytes: reader.size, bytesRead: reader.bytesRead(), warnings: [], telemetry: reader.telemetry() };
  const scanEnd = Math.min(declaredEnd, reader.size);
  while (cursor + 8 <= scanEnd) {
    const chunkHeader = await reader.read(cursor, cursor + 8);
    const type = ascii(chunkHeader, 0, 4);
    const length = uint32LittleEndian(chunkHeader, 4);
    if (!Number.isSafeInteger(length) || length > scanEnd - cursor - 8) {
      return { bytes: await reader.read(0, reader.size), partial: false, inputBytes: reader.size, bytesRead: reader.bytesRead(), warnings: [], telemetry: reader.telemetry() };
    }
    const dataStart = cursor + 8;
    const next = dataStart + length + (length & 1);
    if (next > scanEnd) return { bytes: await reader.read(0, reader.size), partial: false, inputBytes: reader.size, bytesRead: reader.bytesRead(), warnings: [], telemetry: reader.telemetry() };
    if (type === "VP8X" || type === "VP8L" || type === "VP8 ") {
      const needed = type === "VP8X" ? 10 : type === "VP8L" ? 5 : 10;
      if (length >= needed) imageChunk = webpChunk(type, await reader.read(dataStart, dataStart + needed));
    } else if (selectedWebpChunk(type, selection)) {
      metadataBytes += length;
      if (length > limits.maxSegmentBytes) warnings.push({ code: "LIMIT_EXCEEDED", message: `WebP ${type.trim()} metadata chunk exceeds the configured segment limit and was not read.`, severity: "warning", offset: dataStart, length });
      else if (metadataBytes > limits.maxMetadataBytes) warnings.push({ code: "LIMIT_EXCEEDED", message: "WebP selected metadata exceeds the configured metadata budget and later chunks were not read.", severity: "warning", offset: dataStart, length });
      else chunks.push(await reader.read(cursor, next));
    }
    cursor = next;
  }
  const payload = imageChunk === null ? chunks : [imageChunk, ...chunks];
  const size = payload.reduce((sum, chunk) => sum + chunk.byteLength, 4);
  const riff = new Uint8Array(12);
  riff.set([0x52, 0x49, 0x46, 0x46], 0);
  riff.set([0x57, 0x45, 0x42, 0x50], 8);
  new DataView(riff.buffer).setUint32(4, size, true);
  if (declaredEnd < reader.size) warnings.push({ code: "MALFORMED_WEBP", message: "WebP contains bytes after its declared RIFF boundary; trailing bytes were not read.", severity: "warning", offset: declaredEnd, length: reader.size - declaredEnd });
  return { bytes: concatenate([riff, ...payload]), partial: true, bytesRead: reader.bytesRead(), inputBytes: reader.size, warnings, telemetry: reader.telemetry() };
}

/** Read only metadata-bearing ranges for PNG/WebP Blob inputs. */
export async function materializeMetadata(input: MetadataInput, limits: SecurityLimits, selection: ResolvedSelection, signal?: AbortSignal): Promise<MetadataMaterialization> {
  throwIfAborted(signal);
  if (!isBlobLike(input)) {
    const bytes = await materializeInput(input, limits, signal);
    return { bytes, partial: false, bytesRead: bytes.byteLength, inputBytes: bytes.byteLength, warnings: [] };
  }
  const reader = blobReader(input, limits, signal);
  // ISO BMFF brand lists can be longer than the minimum 16-byte ftyp box;
  // read a small bounded prefix so AVIF/HEIF files with extended brand lists
  // can enter the range planner without touching image payload data.
  const prefix = await reader.read(0, Math.min(reader.size, 64));
  const format = detectFormat(prefix).format;
  if (format === "png") return materializePngMetadata(reader, selection, limits);
  if (format === "webp") return materializeWebpMetadata(reader, selection, limits);
  if (format === "tiff") {
    const tiff = await materializeTiffMetadata(reader, limits, selection);
    if (tiff !== null) return tiff;
  }
  if (format === "heif" || format === "avif") {
    const heif = await materializeHeifMetadata(reader, limits, selection);
    if (heif !== null) return heif;
  }
  if (format === "jpeg") {
    return materializeJpegMetadata(reader, limits, selection);
  }
  const bytes = await reader.read(0, reader.size);
  return { bytes, partial: false, bytesRead: reader.bytesRead(), inputBytes: reader.size, warnings: [], telemetry: reader.telemetry() };
}

function isArrayBuffer(value: unknown): value is ArrayBuffer {
  if (typeof value !== "object" || value === null) return false;
  try {
    ArrayBuffer.prototype.slice.call(value, 0, 0);
    return true;
  } catch {
    return false;
  }
}

/** Materialize supported inputs with the same limits enforced by public APIs. */
export async function materializeInput(input: MetadataInput, limits: SecurityLimits, signal?: AbortSignal): Promise<Uint8Array> {
  throwIfAborted(signal);
  let bytes: Uint8Array;
  if (isArrayBuffer(input)) {
    bytes = new Uint8Array(input);
  } else if (ArrayBuffer.isView(input)) {
    bytes = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  } else if (isBlobLike(input)) {
    if (!Number.isSafeInteger(input.size) || input.size < 0) throw new MetadataError("INVALID_VALUE", "Blob size must be a non-negative safe integer.");
    if (input.size > limits.maxInputBytes) throw new MetadataError("LIMIT_EXCEEDED", `Input is ${input.size} bytes; the configured limit is ${limits.maxInputBytes} bytes.`);
    const buffer = await input.arrayBuffer();
    throwIfAborted(signal);
    if (!isArrayBuffer(buffer)) throw new MetadataError("INVALID_VALUE", "Blob or File arrayBuffer() must resolve to an ArrayBuffer.");
    bytes = new Uint8Array(buffer);
  } else {
    throw new MetadataError("INVALID_VALUE", "Input must be an ArrayBuffer, ArrayBufferView, Blob, or File.");
  }
  throwIfAborted(signal);
  if (bytes.byteLength > limits.maxInputBytes) throw new MetadataError("LIMIT_EXCEEDED", `Input is ${bytes.byteLength} bytes; the configured limit is ${limits.maxInputBytes} bytes.`);
  return bytes;
}
