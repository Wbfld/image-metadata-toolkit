import { wantsGroup, type ResolvedSelection } from "./selection.js";
import type { BlobReader, MetadataMaterialization } from "./input.js";
import type { MetadataWarning, SecurityLimits } from "./types.js";

interface SourcePart {
  readonly bytes: Uint8Array;
  readonly sourceStart: number;
}

function uint16(bytes: Uint8Array): number { return ((bytes[0] ?? 0) << 8) | (bytes[1] ?? 0); }

function isRestartMarker(marker: number): boolean { return marker >= 0xd0 && marker <= 0xd7; }

function hasLength(marker: number): boolean {
  return marker !== 0xd8 && marker !== 0xd9 && marker !== 0x01 && !isRestartMarker(marker);
}

function isStartOfFrame(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}

function warning(warnings: MetadataWarning[], limits: SecurityLimits, value: Omit<MetadataWarning, "severity"> & { severity?: MetadataWarning["severity"] }): void {
  if (warnings.length < limits.maxWarnings) warnings.push({ severity: "warning", ...value });
}

function selectedMarker(marker: number, selection: ResolvedSelection): boolean {
  if (isStartOfFrame(marker)) return wantsGroup(selection, "Dimensions");
  if (marker === 0xe0) return wantsGroup(selection, "JFIF");
  if (marker === 0xe1) return wantsGroup(selection, "EXIF") || wantsGroup(selection, "XMP");
  if (marker === 0xe2) return wantsGroup(selection, "ICC");
  if (marker === 0xed) return wantsGroup(selection, "IPTC");
  return false;
}

async function full(reader: BlobReader): Promise<MetadataMaterialization> {
  const bytes = await reader.read(0, reader.size);
  return { bytes, partial: false, bytesRead: reader.bytesRead(), inputBytes: reader.size, warnings: [], telemetry: reader.telemetry(), mapOffset: (offset) => offset };
}

/** Read selected JPEG marker segments without materializing opaque headers or scan data. */
export async function materializeJpegMetadata(reader: BlobReader, limits: SecurityLimits, selection: ResolvedSelection): Promise<MetadataMaterialization> {
  if (reader.size < 2) return full(reader);
  const soi = await reader.read(0, 2);
  if (soi[0] !== 0xff || soi[1] !== 0xd8) return full(reader);

  const parts: SourcePart[] = [{ bytes: soi, sourceStart: 0 }];
  const warnings: MetadataWarning[] = [];
  let cursor = 2;
  let segments = 0;
  let metadataBytes = 0;
  let reachedScan = false;

  while (cursor < reader.size) {
    if (segments >= limits.maxSegments) return full(reader);
    const markerStart = cursor;
    const prefix = await reader.read(cursor, Math.min(reader.size, cursor + 1));
    if (prefix.length !== 1 || prefix[0] !== 0xff) return full(reader);
    cursor += 1;
    while (cursor < reader.size) {
      const fill = await reader.read(cursor, cursor + 1);
      if (fill[0] !== 0xff) break;
      cursor += 1;
    }
    if (cursor >= reader.size) return full(reader);
    const markerBytes = await reader.read(cursor, cursor + 1);
    const marker = markerBytes[0] ?? 0;
    cursor += 1;
    segments += 1;

    if (marker === 0x00 || marker === 0xd8 || isRestartMarker(marker)) return full(reader);
    if (marker === 0xd9) return full(reader);
    if (!hasLength(marker)) continue;

    if (cursor > reader.size - 2) return full(reader);
    const lengthBytes = await reader.read(cursor, cursor + 2);
    const declaredLength = uint16(lengthBytes);
    if (declaredLength < 2 || declaredLength > reader.size - cursor) return full(reader);
    const segmentEnd = cursor + declaredLength;
    const payloadStart = cursor + 2;
    const payloadLength = declaredLength - 2;

    if (marker === 0xda) {
      if (payloadLength < 4) return full(reader);
      const scan = await reader.read(markerStart, segmentEnd);
      parts.push({ bytes: scan, sourceStart: markerStart });
      reachedScan = true;
      break;
    }

    const keep = selectedMarker(marker, selection);
    if (keep) {
      metadataBytes += payloadLength;
      if (payloadLength > limits.maxSegmentBytes || !Number.isSafeInteger(metadataBytes) || metadataBytes > limits.maxMetadataBytes) {
        warning(warnings, limits, {
          code: "LIMIT_EXCEEDED",
          message: "Selected JPEG metadata exceeds the configured byte limit; this segment was not read.",
          offset: payloadStart,
          length: payloadLength,
        });
      } else {
        parts.push({ bytes: await reader.read(markerStart, segmentEnd), sourceStart: markerStart });
      }
    }
    cursor = segmentEnd;
  }

  if (!reachedScan) return full(reader);
  return {
    bytes: concat(parts.map(({ bytes }) => bytes)),
    partial: true,
    bytesRead: reader.bytesRead(),
    inputBytes: reader.size,
    warnings,
    telemetry: reader.telemetry(),
    mapOffset: (() => {
      let compactStart = 0;
      const ranges = parts.map(({ bytes, sourceStart }) => {
        const range = { compactStart, sourceStart, length: bytes.byteLength };
        compactStart += bytes.byteLength;
        return range;
      });
      return (offset: number): number => {
        const range = ranges.find(({ compactStart: start, length }) => offset >= start && offset < start + length);
        return range === undefined ? offset : range.sourceStart + offset - range.compactStart;
      };
    })(),
  };
}
