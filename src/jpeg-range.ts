import type { BlobReader, MetadataMaterialization } from "./input.js";
import type { JpegByteView } from "./io/jpeg-byte-view.js";
import { wantsGroup, type ResolvedSelection } from "./selection.js";
import type { MetadataWarning, SecurityLimits } from "./types.js";

const EXIF_IDENTIFIER = Uint8Array.of(0x45, 0x78, 0x69, 0x66, 0x00, 0x00);
const JFIF_IDENTIFIER = Uint8Array.of(0x4a, 0x46, 0x49, 0x46, 0x00);
const ICC_IDENTIFIER = Uint8Array.from("ICC_PROFILE\0", (character) => character.charCodeAt(0));
const XMP_IDENTIFIER = Uint8Array.from("http://ns.adobe.com/xap/1.0/\0", (character) => character.charCodeAt(0));
const EXTENDED_XMP_IDENTIFIER = Uint8Array.from("http://ns.adobe.com/xmp/extension/\0", (character) => character.charCodeAt(0));
const CLASSIFICATION_BYTES = EXTENDED_XMP_IDENTIFIER.length + 40;

interface PayloadRange {
  readonly start: number;
  readonly end: number;
  readonly data: Uint8Array;
  readonly complete: boolean;
}

function uint16(bytes: Uint8Array): number {
  return ((bytes[0] ?? 0) << 8) | (bytes[1] ?? 0);
}

function isRestartMarker(marker: number): boolean {
  return marker >= 0xd0 && marker <= 0xd7;
}

function hasLength(marker: number): boolean {
  return marker !== 0xd8 && marker !== 0xd9 && marker !== 0x01 && !isRestartMarker(marker);
}

function isStartOfFrame(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

function hasPrefix(bytes: Uint8Array, prefix: Uint8Array): boolean {
  return bytes.length >= prefix.length && prefix.every((byte, index) => bytes[index] === byte);
}

function isIcc(bytes: Uint8Array): boolean {
  return hasPrefix(bytes, ICC_IDENTIFIER)
    && (bytes[12] ?? 0) > 0
    && (bytes[13] ?? 0) > 0
    && (bytes[12] ?? 0) <= (bytes[13] ?? 0);
}

function isXmp(bytes: Uint8Array): boolean {
  return hasPrefix(bytes, XMP_IDENTIFIER) || hasPrefix(bytes, EXTENDED_XMP_IDENTIFIER);
}

function needsClassification(marker: number): boolean {
  return marker === 0xe0 || marker === 0xe1 || marker === 0xe2;
}

function shouldMaterialize(marker: number, prefix: Uint8Array, selection: ResolvedSelection): boolean {
  if (isStartOfFrame(marker)) return wantsGroup(selection, "Dimensions");
  if (marker === 0xe0) return wantsGroup(selection, "JFIF") && hasPrefix(prefix, JFIF_IDENTIFIER);
  if (marker === 0xe1 && hasPrefix(prefix, EXIF_IDENTIFIER)) return wantsGroup(selection, "EXIF");
  if (marker === 0xe1 && isXmp(prefix)) return wantsGroup(selection, "XMP");
  if (marker === 0xe2) return wantsGroup(selection, "ICC") && isIcc(prefix);
  if (marker === 0xed) return wantsGroup(selection, "IPTC");
  return false;
}

function addWarning(
  warnings: MetadataWarning[],
  limits: SecurityLimits,
  value: Omit<MetadataWarning, "severity"> & { severity?: MetadataWarning["severity"] },
): void {
  if (warnings.length < limits.maxWarnings) warnings.push({ severity: "warning", ...value });
}

function createView(
  size: number,
  structuralBytes: ReadonlyMap<number, number>,
  payloads: readonly PayloadRange[],
): JpegByteView {
  const byStart = new Map(payloads.map((payload) => [payload.start, payload]));
  return Object.freeze({
    length: size,
    byteAt(offset: number) {
      const structural = structuralBytes.get(offset);
      if (structural !== undefined) return structural;
      for (const payload of payloads) {
        if (offset >= payload.start && offset < payload.end) {
          return payload.data[offset - payload.start];
        }
      }
      return undefined;
    },
    subarray(start: number, end: number) {
      const payload = byStart.get(start);
      if (payload === undefined || payload.end !== end) {
        throw new RangeError(`JPEG sparse view has no payload range [${start}, ${end}).`);
      }
      return payload.data;
    },
    isMaterialized(start: number, end: number) {
      const payload = byStart.get(start);
      return payload?.end === end && payload.complete;
    },
  });
}

async function full(reader: BlobReader): Promise<MetadataMaterialization> {
  const bytes = await reader.read(0, reader.size);
  return {
    bytes,
    partial: false,
    bytesRead: reader.bytesRead(),
    inputBytes: reader.size,
    warnings: [],
    telemetry: reader.telemetry(),
  };
}

/**
 * Index a JPEG directly in source coordinates and materialize only selected
 * payload ranges. The parser consumes the sparse view without a compacted
 * surrogate container or offset-remapping layer.
 */
export async function materializeJpegMetadata(
  reader: BlobReader,
  limits: SecurityLimits,
  selection: ResolvedSelection,
): Promise<MetadataMaterialization> {
  if (reader.size < 2) return full(reader);
  const soi = await reader.read(0, 2);
  if (soi[0] !== 0xff || soi[1] !== 0xd8) return full(reader);

  const structuralBytes = new Map<number, number>([[0, 0xff], [1, 0xd8]]);
  const payloads: PayloadRange[] = [];
  const warnings: MetadataWarning[] = [];
  let cursor = 2;
  let segments = 0;
  let selectedMetadataBytes = 0;
  let reachedScan = false;

  while (cursor < reader.size) {
    if (segments >= limits.maxSegments) return full(reader);
    const markerPrefix = await reader.read(cursor, cursor + 1);
    if (markerPrefix[0] !== 0xff) return full(reader);
    structuralBytes.set(cursor, 0xff);
    cursor += 1;
    while (cursor < reader.size) {
      const fill = await reader.read(cursor, cursor + 1);
      structuralBytes.set(cursor, fill[0] ?? 0);
      if (fill[0] !== 0xff) break;
      cursor += 1;
    }
    if (cursor >= reader.size) return full(reader);
    const marker = structuralBytes.get(cursor) ?? 0;
    cursor += 1;
    segments += 1;

    if (marker === 0x00 || marker === 0xd8 || isRestartMarker(marker)) return full(reader);
    if (marker === 0xd9) return full(reader);
    if (!hasLength(marker)) continue;
    if (cursor > reader.size - 2) return full(reader);

    const lengthBytes = await reader.read(cursor, cursor + 2);
    structuralBytes.set(cursor, lengthBytes[0] ?? 0);
    structuralBytes.set(cursor + 1, lengthBytes[1] ?? 0);
    const declaredLength = uint16(lengthBytes);
    if (declaredLength < 2 || declaredLength > reader.size - cursor) return full(reader);
    const segmentEnd = cursor + declaredLength;
    const payloadStart = cursor + 2;
    const payloadLength = declaredLength - 2;

    const prefixLength = marker === 0xda
      ? payloadLength
      : needsClassification(marker)
        ? Math.min(payloadLength, CLASSIFICATION_BYTES)
        : 0;
    let payload = prefixLength === 0
      ? new Uint8Array()
      : await reader.read(payloadStart, payloadStart + prefixLength);
    let complete = prefixLength === payloadLength;

    if (marker === 0xda) {
      if (payloadLength < 4) return full(reader);
      payloads.push({ start: payloadStart, end: segmentEnd, data: payload, complete: true });
      reachedScan = true;
      break;
    }

    if (shouldMaterialize(marker, payload, selection)) {
      selectedMetadataBytes += payloadLength;
      if (payloadLength > limits.maxSegmentBytes
        || !Number.isSafeInteger(selectedMetadataBytes)
        || selectedMetadataBytes > limits.maxMetadataBytes) {
        addWarning(warnings, limits, {
          code: "LIMIT_EXCEEDED",
          message: "Selected JPEG metadata exceeds the configured byte limit; this segment was not read.",
          offset: payloadStart,
          length: payloadLength,
        });
      } else if (!complete) {
        payload = await reader.read(payloadStart, segmentEnd);
        complete = true;
      }
    }
    payloads.push({ start: payloadStart, end: segmentEnd, data: payload, complete });
    cursor = segmentEnd;
  }

  if (!reachedScan) return full(reader);
  return {
    bytes: Uint8Array.of(soi[0], soi[1], 0xff),
    jpegView: createView(reader.size, structuralBytes, payloads),
    partial: true,
    bytesRead: reader.bytesRead(),
    inputBytes: reader.size,
    warnings,
    telemetry: reader.telemetry(),
  };
}
