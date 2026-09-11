import { inspectIccProfile, parseIccChunk, type IccChunk } from "../metadata/icc.js";
import { parseExif } from "../metadata/exif.js";
import { parseIptcMetadata } from "../metadata/iptc.js";
import { parseJfif } from "../metadata/jfif.js";
import { extractExifThumbnail } from "../metadata/thumbnail.js";
import { extendedXmpGuid, parseExtendedXmpChunk, parseXmpPacket, reassembleExtendedXmp, type ExtendedXmpChunk } from "../metadata/xmp.js";
import type {
  ExifData,
  ImageDimensions,
  JfifData,
  MetadataField,
  MetadataBlock,
  ParsedMetadataResult,
  MetadataWarning,
  SecurityLimits,
} from "../types.js";
import { WarningCollector } from "../security/warnings.js";
import { throwIfAborted } from "../security/abort.js";
import { wantsGroup, type ResolvedSelection } from "../selection.js";
import type { MetadataRegistry } from "../registry.js";

const EXIF_IDENTIFIER = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00] as const;
const JFIF_IDENTIFIER = [0x4a, 0x46, 0x49, 0x46, 0x00] as const;

function hasPrefix(bytes: Uint8Array, prefix: readonly number[]): boolean {
  return bytes.length >= prefix.length && prefix.every((byte, index) => bytes[index] === byte);
}

function warning(
  warnings: WarningCollector,
  _limits: SecurityLimits,
  value: MetadataWarning,
): void {
  warnings.add(value);
}

function isRestartMarker(marker: number): boolean {
  return marker >= 0xd0 && marker <= 0xd7;
}

function isStartOfFrame(marker: number): boolean {
  return (
    marker >= 0xc0 &&
    marker <= 0xcf &&
    marker !== 0xc4 &&
    marker !== 0xc8 &&
    marker !== 0xcc
  );
}

function readDimensions(payload: Uint8Array): ImageDimensions | null {
  if (payload.length < 6) return null;
  const precision = payload[0] ?? 0;
  const componentCount = payload[5] ?? 0;
  if (precision === 0 || componentCount === 0 || payload.length !== 6 + componentCount * 3) return null;
  const height = ((payload[1] ?? 0) << 8) | (payload[2] ?? 0);
  const width = ((payload[3] ?? 0) << 8) | (payload[4] ?? 0);
  return width > 0 && height > 0 ? { width, height } : null;
}

function findMarkerAfterScan(bytes: Uint8Array, from: number, signal?: AbortSignal): number | null {
  let cursor = from;
  while (cursor < bytes.length) {
    throwIfAborted(signal);
    if (bytes[cursor] !== 0xff) {
      cursor += 1;
      continue;
    }
    const markerStart = cursor;
    while (cursor < bytes.length && bytes[cursor] === 0xff) cursor += 1;
    if (cursor >= bytes.length) return null;
    const marker = bytes[cursor] ?? 0;
    if (marker === 0x00 || isRestartMarker(marker)) {
      cursor += 1;
      continue;
    }
    return markerStart;
  }
  return null;
}

export interface JpegParseOptions {
  readonly selection?: ResolvedSelection;
  /** The supplied bytes stop immediately after a valid start-of-scan header. */
  readonly headerOnly?: boolean;
  /** Remap offsets from a compact range view to the original source file. */
  readonly offsetMap?: (offset: number) => number;
  readonly signal?: AbortSignal;
  readonly registry?: MetadataRegistry;
}

export function parseJpeg(bytes: Uint8Array, limits: SecurityLimits, options: JpegParseOptions = {}): ParsedMetadataResult {
  throwIfAborted(options.signal);
  const warnings = new WarningCollector(limits);
  const normalizedFields: MetadataField[] = [];
  const blocks: MetadataBlock[] = [];
  const xmpPackets: string[] = [];
  const extendedXmp = new Map<string, ExtendedXmpChunk[]>();
  const extendedXmpBlockIds = new Map<string, string[]>();
  const iccChunks: IccChunk[] = [];
  let exif: ExifData | null = null;
  let jfif: JfifData | null = null;
  let iptcBytes = 0;
  let iptcCharacterSet: "latin1" | "utf-8" | "unknown" | undefined;
  let dimensions: ImageDimensions | null = null;
  let metadataBytes = 0;
  let segmentCount = 0;
  let cursor = 2;
  let reachedScan = false;
  let reachedEnd = false;
  let inEntropyData = false;

  if (bytes.length < 2 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    warning(warnings, limits, {
      code: "MALFORMED_JPEG",
      message: "The input does not begin with a JPEG start-of-image marker.",
      severity: "error",
      offset: 0,
    });
  } else {
    while (cursor < bytes.length) {
      throwIfAborted(options.signal);
      let markerCameFromEntropyData = false;
      if (inEntropyData) {
        const nextMarker = findMarkerAfterScan(bytes, cursor, options.signal);
        if (nextMarker === null) {
          warning(warnings, limits, {
            code: "TRUNCATED_DATA",
            message: "JPEG entropy-coded data has no complete end marker.",
            severity: "error",
            offset: cursor,
          });
          break;
        }
        cursor = nextMarker;
        inEntropyData = false;
        markerCameFromEntropyData = true;
      }
      if (segmentCount >= limits.maxSegments) {
        warning(warnings, limits, {
          code: "LIMIT_EXCEEDED",
          message: `JPEG segment count exceeds the configured limit of ${limits.maxSegments}.`,
          severity: "error",
          offset: cursor,
        });
        break;
      }
      segmentCount += 1;

      const markerStart = cursor;
      if (bytes[cursor] !== 0xff) {
        warning(warnings, limits, {
          code: "MALFORMED_JPEG",
          message: "Expected a JPEG marker before scan data.",
          severity: "error",
          offset: cursor,
        });
        break;
      }
      while (cursor < bytes.length && bytes[cursor] === 0xff) cursor += 1;
      if (cursor >= bytes.length) {
        warning(warnings, limits, {
          code: "TRUNCATED_DATA",
          message: "JPEG ends in an incomplete marker.",
          severity: "error",
          offset: markerStart,
        });
        break;
      }

      const marker = bytes[cursor] ?? 0;
      cursor += 1;
      if (marker === 0x00) {
        warning(warnings, limits, {
          code: "MALFORMED_JPEG",
          message: "Found a byte-stuffed marker outside JPEG scan data.",
          severity: "error",
          offset: markerStart,
        });
        break;
      }
      if (marker === 0xd9) {
        reachedEnd = true;
        break;
      }
      if (marker === 0xd8) {
        warning(warnings, limits, {
          code: "MALFORMED_JPEG",
          message: "Found a second JPEG start-of-image marker.",
          severity: "error",
          offset: markerStart,
        });
        break;
      }
      if (isRestartMarker(marker)) {
        warning(warnings, limits, {
          code: "MALFORMED_JPEG",
          message: "Found a JPEG restart marker outside entropy-coded scan data.",
          severity: "error",
          offset: markerStart,
        });
        break;
      }
      if (marker === 0x01) continue;
      if (cursor + 2 > bytes.length) {
        warning(warnings, limits, {
          code: "TRUNCATED_DATA",
          message: "JPEG segment length is truncated.",
          severity: "error",
          offset: cursor,
        });
        break;
      }

      const declaredLength = ((bytes[cursor] ?? 0) << 8) | (bytes[cursor + 1] ?? 0);
      if (declaredLength < 2) {
        warning(warnings, limits, {
          code: "MALFORMED_JPEG",
          message: "JPEG segment length must include its two-byte length field.",
          severity: "error",
          offset: cursor,
        });
        break;
      }
      const segmentEnd = cursor + declaredLength;
      if (!Number.isSafeInteger(segmentEnd) || segmentEnd > bytes.length) {
        warning(warnings, limits, {
          code: "TRUNCATED_DATA",
          message: "JPEG segment extends beyond the input.",
          severity: "error",
          offset: markerStart,
          length: declaredLength + 2,
        });
        break;
      }

      const dataStart = cursor + 2;
      const payload = bytes.subarray(dataStart, segmentEnd);
      if (payload.length > limits.maxSegmentBytes) {
        warning(warnings, limits, {
          code: "LIMIT_EXCEEDED",
          message: `JPEG segment payload exceeds the configured limit of ${limits.maxSegmentBytes} bytes.`,
          severity: "error",
          offset: dataStart,
          length: payload.length,
        });
        break;
      }
      if (marker === 0xda) {
        const componentCount = payload[0] ?? 0;
        if (componentCount < 1 || componentCount > 4 || payload.length !== 4 + componentCount * 2) {
          warning(warnings, limits, {
            code: "MALFORMED_JPEG",
            message: "JPEG start-of-scan header has an invalid component count or length.",
            severity: "error",
            offset: dataStart,
            length: payload.length,
          });
          break;
        }
        reachedScan = true;
        cursor = segmentEnd;
        if (options.headerOnly) {
          reachedEnd = true;
          break;
        }
        inEntropyData = true;
        continue;
      }
      if (marker === 0xdc) {
        const lineCount = payload.length === 2 ? ((payload[0] ?? 0) << 8) | (payload[1] ?? 0) : 0;
        if (!markerCameFromEntropyData || lineCount === 0) {
          warning(warnings, limits, {
            code: "MALFORMED_JPEG",
            message: "JPEG define-number-of-lines marker is invalid or outside scan data.",
            severity: "error",
            offset: dataStart,
          });
          break;
        }
        cursor = segmentEnd;
        inEntropyData = true;
        continue;
      }
      if (wantsGroup(options.selection, "Dimensions") && isStartOfFrame(marker)) {
        const frameDimensions = readDimensions(payload);
        if (frameDimensions === null) {
          warning(warnings, limits, {
            code: "MALFORMED_JPEG",
            message: "JPEG start-of-frame header or dimensions are invalid.",
            severity: "error",
            offset: dataStart,
          });
        } else if (dimensions === null) {
          dimensions = frameDimensions;
        }
      }

      const isMetadataSegment = marker >= 0xe0 && marker <= 0xef;
      if (isMetadataSegment) {
        metadataBytes += payload.length;
        if (metadataBytes > limits.maxMetadataBytes) {
          warning(warnings, limits, {
            code: "LIMIT_EXCEEDED",
            message: "Total JPEG metadata exceeds the configured byte limit; this segment was skipped.",
            severity: "warning",
            offset: dataStart,
            length: payload.length,
          });
          cursor = segmentEnd;
          continue;
        }
      }

      const skippedBlock = (family: MetadataBlock["family"], container: string, sensitivity: MetadataBlock["sensitivity"]): void => {
        const app = marker === 0xed ? "13" : String(marker - 0xe0);
        blocks.push({ id: `jpeg:APP${app}:${markerStart}`, family, container, status: "skipped", offset: markerStart, length: segmentEnd - markerStart, associatedImage: null, sensitivity, warningCodes: [] });
      };
      if (marker === 0xe0 && hasPrefix(payload, JFIF_IDENTIFIER) && !wantsGroup(options.selection, "JFIF")) skippedBlock("JFIF", "APP0 JFIF", "low");
      else if (marker === 0xe1 && hasPrefix(payload, EXIF_IDENTIFIER) && !wantsGroup(options.selection, "EXIF")) skippedBlock("EXIF", "APP1 Exif", "moderate");
      else if (marker === 0xe2 && parseIccChunk(payload) !== null && !wantsGroup(options.selection, "ICC")) skippedBlock("ICC", "APP2 ICC", "low");
      else if (marker === 0xed && !wantsGroup(options.selection, "IPTC")) skippedBlock("IPTC", "APP13 Photoshop", "moderate");
      else if (marker === 0xe1 && !hasPrefix(payload, EXIF_IDENTIFIER) && !wantsGroup(options.selection, "XMP")) {
        const extended = parseExtendedXmpChunk(payload);
        if (extended !== null || parseXmpPacket(payload, 0).matched) skippedBlock("XMP", extended === null ? "APP1 XMP" : "APP1 Extended XMP", "moderate");
      }

      if (wantsGroup(options.selection, "JFIF") && marker === 0xe0 && hasPrefix(payload, JFIF_IDENTIFIER)) {
        const block = { id: `jpeg:APP0:${markerStart}`, family: "JFIF", container: "APP0 JFIF", status: "decoded", offset: markerStart, length: segmentEnd - markerStart, associatedImage: null, sensitivity: "low", warningCodes: [] } satisfies MetadataBlock;
        blocks.push(block);
        const parsedJfif = parseJfif(payload);
        if (parsedJfif === null) {
          const xThumbnail = payload[12] ?? 0;
          const yThumbnail = payload[13] ?? 0;
          const expectedLength = 14 + xThumbnail * yThumbnail * 3;
          warning(warnings, limits, {
            code: payload.length < expectedLength ? "TRUNCATED_DATA" : "INVALID_VALUE",
            message: "JFIF header or embedded thumbnail length is invalid.",
            severity: "warning",
            offset: dataStart,
            length: payload.length,
          });
        } else if (jfif === null) {
          jfif = parsedJfif;
        }
      } else if (wantsGroup(options.selection, "EXIF") && marker === 0xe1 && hasPrefix(payload, EXIF_IDENTIFIER)) {
        const block = { id: `jpeg:APP1:${markerStart}`, family: "EXIF", container: "APP1 Exif", status: "decoded", offset: markerStart, length: segmentEnd - markerStart, associatedImage: null, sensitivity: "moderate", warningCodes: [] } satisfies MetadataBlock;
        blocks.push(block);
        if (exif !== null) {
          warning(warnings, limits, {
            code: "DUPLICATE_EXIF",
            message: "A later JPEG EXIF segment was ignored.",
            severity: "warning",
            offset: dataStart,
          });
        } else {
          const parsed = parseExif(payload.subarray(EXIF_IDENTIFIER.length), limits, dataStart + EXIF_IDENTIFIER.length, options.selection?.tags, options.registry);
          for (const item of parsed.warnings) warning(warnings, limits, item);
          if (parsed.exif !== null) {
            const tiff = payload.subarray(EXIF_IDENTIFIER.length);
            const thumbnail = extractExifThumbnail(tiff, parsed.exif, limits);
            exif = thumbnail === null ? parsed.exif : { ...parsed.exif, thumbnail };
            normalizedFields.push(...parsed.fields.map((field) => ({
              ...field,
              source: field.source === undefined
                ? { blockId: block.id, entryOffset: null, entryLength: null, valueOffset: null, valueLength: null }
                : {
                    ...field.source,
                    blockId: block.id,
                    entryOffset: field.source.entryOffset === null ? null : dataStart + EXIF_IDENTIFIER.length + field.source.entryOffset,
                    valueOffset: field.source.valueOffset === null ? null : dataStart + EXIF_IDENTIFIER.length + field.source.valueOffset,
                  },
            })));
          }
        }
      } else if (wantsGroup(options.selection, "XMP") && marker === 0xe1) {
        const extended = parseExtendedXmpChunk(payload);
        if (extended !== null) {
          const blockId = `jpeg:APP1:${markerStart}`;
          blocks.push({ id: blockId, family: "XMP", container: "APP1 Extended XMP", status: "decoded", offset: markerStart, length: segmentEnd - markerStart, associatedImage: null, sensitivity: "moderate", warningCodes: [] });
          const blockIds = extendedXmpBlockIds.get(extended.guid) ?? [];
          blockIds.push(blockId);
          extendedXmpBlockIds.set(extended.guid, blockIds);
          const chunks = extendedXmp.get(extended.guid) ?? [];
          chunks.push(extended);
          extendedXmp.set(extended.guid, chunks);
        } else {
          const parsed = parseXmpPacket(payload, limits.maxStringBytes);
          if (parsed.matched) blocks.push({ id: `jpeg:APP1:${markerStart}`, family: "XMP", container: "APP1 XMP", status: parsed.packet === null ? "malformed" : "decoded", offset: markerStart, length: segmentEnd - markerStart, associatedImage: null, sensitivity: "moderate", warningCodes: parsed.packet === null ? ["INVALID_VALUE"] : [] });
          if (parsed.matched && parsed.packet === null) {
          warning(warnings, limits, {
            code: "INVALID_VALUE",
            message: "XMP packet is invalid UTF-8 or exceeds the configured string limit.",
            severity: "warning",
            offset: dataStart,
            length: payload.length,
          });
          } else if (parsed.packet !== null) {
            xmpPackets.push(parsed.packet);
          }
        }
      } else if (wantsGroup(options.selection, "ICC") && marker === 0xe2) {
        const chunk = parseIccChunk(payload);
        if (chunk !== null) {
          blocks.push({ id: `jpeg:APP2:${markerStart}`, family: "ICC", container: "APP2 ICC", status: "decoded", offset: markerStart, length: segmentEnd - markerStart, associatedImage: null, sensitivity: "low", warningCodes: [] });
          iccChunks.push(chunk);
        }
      } else if (wantsGroup(options.selection, "IPTC") && marker === 0xed) {
        const blockId = `jpeg:APP13:${markerStart}`;
        blocks.push({ id: blockId, family: "IPTC", container: "APP13 Photoshop", status: "decoded", offset: markerStart, length: segmentEnd - markerStart, associatedImage: null, sensitivity: "moderate", warningCodes: [] });
        const parsedIptc = parseIptcMetadata(payload, limits, dataStart);
        if (parsedIptc.data !== null) {
          iptcBytes += parsedIptc.data.byteLength;
          iptcCharacterSet = parsedIptc.data.characterSet;
          normalizedFields.push(...parsedIptc.fields.map((field) => ({ ...field, source: { blockId, entryOffset: null, entryLength: null, valueOffset: null, valueLength: null } })));
        }
        for (const item of parsedIptc.warnings) {
          warning(
            warnings,
            limits,
            item.code === "MALFORMED_IPTC"
              ? {
                  ...item,
                  code: "INVALID_VALUE",
                  message: "Photoshop APP13 image-resource data is malformed or truncated; IPTC was not accepted.",
                }
              : item,
          );
        }
      }

      cursor = segmentEnd;
    }
  }

  if (!reachedScan && bytes.length > 2 && !warnings.some(({ severity }) => severity === "error")) {
    warning(warnings, limits, {
      code: "MALFORMED_JPEG",
      message: "JPEG contains no start-of-scan segment.",
      severity: "error",
    });
  }
  if (reachedScan && !reachedEnd && !warnings.some(({ severity }) => severity === "error")) {
    warning(warnings, limits, {
      code: "TRUNCATED_DATA",
      message: "JPEG contains no end-of-image marker.",
      severity: "error",
    });
  }
  if (reachedScan && wantsGroup(options.selection, "Dimensions") && dimensions === null && !warnings.some(({ code }) => code === "MALFORMED_JPEG")) {
    warning(warnings, limits, {
      code: "MALFORMED_JPEG",
      message: "JPEG scan has no preceding valid start-of-frame dimensions.",
      severity: "error",
    });
  }

  const inspectedIcc = wantsGroup(options.selection, "ICC") ? inspectIccProfile(iccChunks, limits) : { data: null, fields: [], warnings: [] };
  const icc = inspectedIcc.data;
  for (const item of inspectedIcc.fields) normalizedFields.push(item);
  for (const item of inspectedIcc.warnings) warning(warnings, limits, item);
  if (icc !== null && !icc.complete) {
    warning(warnings, limits, {
      code: "INVALID_VALUE",
      message: "JPEG ICC_PROFILE chunks are incomplete, duplicated, or inconsistent.",
      severity: "warning",
    });
  }

  const referencedExtended = wantsGroup(options.selection, "XMP")
    ? new Set(xmpPackets.map(extendedXmpGuid).filter((guid): guid is string => guid !== null))
    : new Set<string>();
  for (const guid of referencedExtended) {
    const packet = reassembleExtendedXmp(extendedXmp.get(guid) ?? [], limits.maxStringBytes);
    if (packet === null) {
      warning(warnings, limits, { code: "INVALID_VALUE", message: "Extended XMP chunks are incomplete, overlapping, or invalid UTF-8.", severity: "warning" });
    } else {
      xmpPackets.push(packet);
      const relatedBlockIds = extendedXmpBlockIds.get(guid) ?? [];
      blocks.push({ id: `jpeg:extended-xmp:${guid}`, family: "XMP", container: "Assembled Extended XMP", status: "decoded", offset: null, length: null, associatedImage: null, sensitivity: "moderate", warningCodes: [], relatedBlockIds });
    }
  }

  const collectedWarnings = warnings.toArray();
  const resolvedBlocks = blocks.map((block) => {
    const offset = block.offset;
    const length = block.length;
    const localWarnings = offset === null || length === null
      ? []
      : collectedWarnings.filter((item) => item.offset !== undefined && item.offset >= offset && item.offset < offset + length);
    const inspectedIccMalformed = block.family === "ICC" && (inspectedIcc.warnings.length > 0 || (icc !== null && !icc.complete));
    return {
      ...block,
      status: inspectedIccMalformed ? "malformed" : localWarnings.some((item) => item.severity === "error") ? "partial" : block.status,
      warningCodes: [...new Set([...block.warningCodes, ...localWarnings.map((item) => item.code)])],
    };
  });

  const mapOffset = options.offsetMap ?? ((offset: number): number => offset);
  const blockIdMap = new Map(resolvedBlocks.map((block) => {
    const match = /^(jpeg:[^:]+:)(\d+)$/.exec(block.id);
    return [block.id, match === null ? block.id : `${match[1]}${mapOffset(Number(match[2]))}`] as const;
  }));
  const remappedBlocks = resolvedBlocks.map((block) => {
    const relatedBlockIds = block.relatedBlockIds?.map((id) => blockIdMap.get(id) ?? id);
    return {
      ...block,
      id: blockIdMap.get(block.id) ?? block.id,
      offset: block.offset === null ? null : mapOffset(block.offset),
      ...(relatedBlockIds === undefined ? {} : { relatedBlockIds }),
    };
  });
  const remapField = (field: MetadataField): MetadataField => field.source === undefined ? field : ({
    ...field,
    source: {
      ...field.source,
      blockId: blockIdMap.get(field.source.blockId) ?? field.source.blockId,
      entryOffset: field.source.entryOffset === null ? null : mapOffset(field.source.entryOffset),
      valueOffset: field.source.valueOffset === null ? null : mapOffset(field.source.valueOffset),
    },
  });
  const remappedFields = normalizedFields.map(remapField);
  const remappedExif = exif === null ? null : { ...exif, fields: exif.fields.map(remapField) };
  const remappedWarnings = collectedWarnings.map((item) => item.offset === undefined ? item : { ...item, offset: mapOffset(item.offset) });

  return {
    format: "jpeg",
    mimeType: "image/jpeg",
    dimensions,
    fields: remappedFields,
    exif: remappedExif,
    xmp: xmpPackets.length > 0 ? { packets: xmpPackets } : null,
    iptc: iptcBytes > 0
      ? (() => {
          const iptcFields = remappedFields.filter(({ ifd }) => ifd === "IPTC");
          return iptcFields.length > 0
            ? { byteLength: iptcBytes, ...(iptcCharacterSet === undefined ? {} : { characterSet: iptcCharacterSet }), fields: iptcFields }
            : { byteLength: iptcBytes, ...(iptcCharacterSet === undefined ? {} : { characterSet: iptcCharacterSet }) };
        })()
      : null,
    icc,
    jfif,
    pngText: [],
    blocks: remappedBlocks,
    warnings: remappedWarnings,
  };
}
