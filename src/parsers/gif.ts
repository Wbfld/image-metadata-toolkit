import { wantsGroup, type ResolvedSelection } from "../selection.js";
import { throwIfAborted } from "../security/abort.js";
import type { MetadataBlock, MetadataField, MetadataWarning, ParsedMetadataResult, SecurityLimits } from "../types.js";

interface SubBlocks {
  readonly data: Uint8Array | null;
  readonly next: number;
  readonly malformed: boolean;
}

function little16(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8);
}

function field(tag: number, name: string, value: string | number, sensitivity: MetadataField["sensitivity"]): MetadataField {
  return {
    id: `GIF:0x${tag.toString(16).padStart(4, "0")}`,
    ifd: "GIF",
    tag,
    name,
    raw: value,
    value,
    display: String(value),
    description: name === "Comment" ? "GIF comment extension text." : name === "LoopCount" ? "GIF animation loop count." : "Number of GIF image frames.",
    type: "COMPOSITE",
    sensitivity,
    count: 1,
    known: true,
  };
}

function readSubBlocks(bytes: Uint8Array, start: number, limits: SecurityLimits, retain: boolean): SubBlocks {
  let cursor = start;
  let blocks = 0;
  let length = 0;
  const chunks: Uint8Array[] = [];
  while (cursor < bytes.length) {
    const blockLength = bytes[cursor] ?? 0;
    cursor += 1;
    if (blockLength === 0) return { data: retain ? concat(chunks, length) : null, next: cursor, malformed: false };
    if (++blocks > limits.maxSegments || cursor > bytes.length - blockLength) return { data: null, next: bytes.length, malformed: true };
    if (retain) {
      if (length > limits.maxMetadataBytes - blockLength) return { data: null, next: bytes.length, malformed: true };
      chunks.push(bytes.subarray(cursor, cursor + blockLength));
      length += blockLength;
    }
    cursor += blockLength;
  }
  return { data: null, next: cursor, malformed: true };
}

function concat(chunks: readonly Uint8Array[], length: number): Uint8Array {
  const output = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

function decodeUtf8(bytes: Uint8Array): string | null {
  try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { return null; }
}

function decodeLatin1(bytes: Uint8Array): string {
  return new TextDecoder("latin1").decode(bytes);
}

export function parseGif(bytes: Uint8Array, limits: SecurityLimits, selection?: ResolvedSelection, signal?: AbortSignal): ParsedMetadataResult {
  const warnings: MetadataWarning[] = [];
  const fields: MetadataField[] = [];
  const provenance: MetadataBlock[] = [];
  const xmpPackets: string[] = [];
  const includeDimensions = wantsGroup(selection, "Dimensions");
  const includeXmp = wantsGroup(selection, "XMP");
  const includeComments = wantsGroup(selection, "EXIF");
  if (bytes.length < 13) {
    return {
      format: "gif", mimeType: "image/gif", dimensions: null, fields, exif: null, xmp: null, iptc: null, icc: null, jfif: null, pngText: [],
      warnings: [{ code: "MALFORMED_GIF", message: "GIF logical screen descriptor is truncated.", severity: "error", offset: 0, length: bytes.length }],
    };
  }
  const packed = bytes[10] ?? 0;
  let cursor = 13;
  if ((packed & 0x80) !== 0) {
    const tableLength = 3 * (1 << ((packed & 0x07) + 1));
    if (cursor > bytes.length - tableLength) {
      return {
        format: "gif", mimeType: "image/gif", dimensions: includeDimensions ? { width: little16(bytes, 6), height: little16(bytes, 8) } : null, fields, exif: null, xmp: null, iptc: null, icc: null, jfif: null, pngText: [],
        warnings: [{ code: "MALFORMED_GIF", message: "GIF global colour table is truncated.", severity: "error", offset: cursor, length: tableLength }],
      };
    }
    cursor += tableLength;
  }
  let frames = 0;
  let loopCount: number | null = null;
  while (cursor < bytes.length) {
    throwIfAborted(signal);
    const marker = bytes[cursor] ?? 0;
    cursor += 1;
    if (marker === 0x3b) break;
    if (marker === 0x2c) {
      if (cursor > bytes.length - 9) { warnings.push({ code: "MALFORMED_GIF", message: "GIF image descriptor is truncated.", severity: "error", offset: cursor - 1 }); break; }
      const imagePacked = bytes[cursor + 8] ?? 0;
      cursor += 9;
      if ((imagePacked & 0x80) !== 0) {
        const localTable = 3 * (1 << ((imagePacked & 0x07) + 1));
        if (cursor > bytes.length - localTable) { warnings.push({ code: "MALFORMED_GIF", message: "GIF local colour table is truncated.", severity: "error", offset: cursor, length: localTable }); break; }
        cursor += localTable;
      }
      if (cursor >= bytes.length) { warnings.push({ code: "MALFORMED_GIF", message: "GIF image data is truncated before its LZW code size.", severity: "error", offset: cursor }); break; }
      cursor += 1;
      const blocks = readSubBlocks(bytes, cursor, limits, false);
      cursor = blocks.next;
      if (blocks.malformed) { warnings.push({ code: "MALFORMED_GIF", message: "GIF image data sub-blocks are malformed or exceed limits.", severity: "error", offset: cursor }); break; }
      frames += 1;
      continue;
    }
    if (marker !== 0x21 || cursor >= bytes.length) { warnings.push({ code: "MALFORMED_GIF", message: "GIF contains an invalid block introducer.", severity: "error", offset: cursor - 1 }); break; }
    const label = bytes[cursor] ?? 0;
    cursor += 1;
    if (label === 0xff) {
      const extensionOffset = cursor - 2;
      const identifierLength = bytes[cursor] ?? 0;
      cursor += 1;
      if (identifierLength !== 11 || cursor > bytes.length - identifierLength) { warnings.push({ code: "MALFORMED_GIF", message: "GIF application extension identifier is malformed.", severity: "error", offset: cursor - 1 }); break; }
      const identifier = decodeLatin1(bytes.subarray(cursor, cursor + identifierLength));
      cursor += identifierLength;
      const blocks = readSubBlocks(bytes, cursor, limits, includeXmp || identifier === "NETSCAPE2.0" || identifier === "ANIMEXTS1.0");
      cursor = blocks.next;
      if (blocks.malformed) { warnings.push({ code: "MALFORMED_GIF", message: "GIF application extension sub-blocks are malformed or exceed limits.", severity: "error", offset: cursor }); break; }
      if ((identifier === "NETSCAPE2.0" || identifier === "ANIMEXTS1.0") && blocks.data?.length === 3 && blocks.data[0] === 1) loopCount = little16(blocks.data, 1);
      if (includeXmp && identifier === "XMP DataXMP" && blocks.data !== null) {
        provenance.push({ id: `gif:XMP:${extensionOffset}`, family: "XMP", container: "GIF XMP application extension", status: "decoded", offset: extensionOffset, length: cursor - extensionOffset, associatedImage: null, sensitivity: "moderate", warningCodes: [] });
        const payload = blocks.data.at(-1) === 1 ? blocks.data.subarray(0, -1) : blocks.data;
        const packet = decodeUtf8(payload);
        if (packet === null) warnings.push({ code: "INVALID_VALUE", message: "GIF XMP application extension is not valid UTF-8.", severity: "warning" });
        else xmpPackets.push(packet);
      } else if (identifier === "XMP DataXMP") provenance.push({ id: `gif:XMP:${extensionOffset}`, family: "XMP", container: "GIF XMP application extension", status: "skipped", offset: extensionOffset, length: cursor - extensionOffset, associatedImage: null, sensitivity: "moderate", warningCodes: [] });
      continue;
    }
    if (label === 0xfe) {
      const extensionOffset = cursor - 2;
      const blocks = readSubBlocks(bytes, cursor, limits, includeComments);
      cursor = blocks.next;
      if (blocks.malformed) { warnings.push({ code: "MALFORMED_GIF", message: "GIF comment extension sub-blocks are malformed or exceed limits.", severity: "error", offset: cursor }); break; }
      if (includeComments && blocks.data !== null) {
        const blockId = `gif:comment:${extensionOffset}`;
        provenance.push({ id: blockId, family: "Unknown", container: "GIF comment extension", status: "decoded", offset: extensionOffset, length: cursor - extensionOffset, associatedImage: null, sensitivity: "moderate", warningCodes: [] });
        fields.push({ ...field(0x00fe, "Comment", decodeLatin1(blocks.data), "moderate"), source: { blockId, entryOffset: extensionOffset, entryLength: cursor - extensionOffset, valueOffset: null, valueLength: null } });
      } else provenance.push({ id: `gif:comment:${extensionOffset}`, family: "Unknown", container: "GIF comment extension", status: "skipped", offset: extensionOffset, length: cursor - extensionOffset, associatedImage: null, sensitivity: "moderate", warningCodes: [] });
      continue;
    }
    const blockSize = bytes[cursor] ?? 0;
    cursor += 1;
    if (cursor > bytes.length - blockSize) { warnings.push({ code: "MALFORMED_GIF", message: "GIF extension block is truncated.", severity: "error", offset: cursor - 1 }); break; }
    cursor += blockSize;
    const blocks = readSubBlocks(bytes, cursor, limits, false);
    cursor = blocks.next;
    if (blocks.malformed) { warnings.push({ code: "MALFORMED_GIF", message: "GIF extension sub-blocks are malformed or exceed limits.", severity: "error", offset: cursor }); break; }
  }
  if (frames > 0) fields.push(field(0x0001, "FrameCount", frames, "none"));
  if (loopCount !== null) fields.push(field(0x0002, "LoopCount", loopCount, "none"));
  const resolvedBlocks = provenance.map((block) => {
    const { offset, length } = block;
    if (offset === null || length === null) return block;
    const local = warnings.filter((item) => item.offset !== undefined && item.offset >= offset && item.offset < offset + length);
    return { ...block, status: local.some((item) => item.severity === "error") ? "partial" : block.status, warningCodes: [...new Set(local.map((item) => item.code))] };
  });
  return {
    format: "gif", mimeType: "image/gif", dimensions: includeDimensions ? { width: little16(bytes, 6), height: little16(bytes, 8) } : null, fields,
    exif: null, xmp: xmpPackets.length > 0 ? { packets: xmpPackets } : null, iptc: null, icc: null, jfif: null, pngText: [], blocks: resolvedBlocks, warnings,
  };
}
