import { parseJpeg } from "./jpeg.js";
import { parseTiffMetadata } from "./tiff.js";
import { parseHeif } from "./heif.js";
import { throwIfAborted } from "../security/abort.js";
import { wantsGroup, type ResolvedSelection } from "../selection.js";
import type { MetadataRegistry } from "../registry.js";
import type {
  Cr3BoxReference,
  Cr3ContainerData,
  ExifData,
  HeifSequence,
  ImageDimensions,
  MetadataBlock,
  MetadataField,
  MetadataWarning,
  MakerNoteContainerData,
  MakerNotePlugin,
  ParsedMetadataResult,
  RafContainerData,
  RafDirectory,
  RawPhaseTwoDiagnostic,
  RawPhaseTwoRange,
  RawPhaseTwoRangeFormat,
  RawPhaseTwoRangeRole,
  SecurityLimits,
} from "../types.js";

const CR3_CANON_UUID = "85c0b687820f11e08111f4ce462b6a48";
const CR3_XMP_UUID = "be7acfcb97a942e89c71999491e3afac";
const CR3_PREVIEW_UUID = "eaf42b5e1c984b88b9fbb7dc406e4d16";
const RAF_SIGNATURE = "FUJIFILMCCD-RAW ";
const CR3_CONTAINERS = new Set(["moov", "trak", "mdia", "minf", "stbl", "edts", "dinf", "udta", "meta", "ilst"]);

function uint32(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] as number) * 0x1000000 + (bytes[offset + 1] as number) * 0x10000 + (bytes[offset + 2] as number) * 0x100 + (bytes[offset + 3] as number);
}

function uint64(bytes: Uint8Array, offset: number): number | null {
  if (offset < 0 || offset > bytes.length - 8) return null;
  const high = uint32(bytes, offset);
  const low = uint32(bytes, offset + 4);
  if (high > 0x1fffff) return null;
  const value = high * 0x100000000 + low;
  return Number.isSafeInteger(value) ? value : null;
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function hex(bytes: Uint8Array, offset: number, length: number): string {
  return Array.from(bytes.subarray(offset, offset + length), (value) => value.toString(16).padStart(2, "0")).join("");
}

function decodeText(bytes: Uint8Array, offset: number, length: number): string | null {
  if (offset < 0 || length < 0 || offset > bytes.length || length > bytes.length - offset) return null;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(offset, offset + length));
  } catch {
    return null;
  }
}

function hasAt(bytes: Uint8Array, offset: number, expected: readonly number[]): boolean {
  return offset >= 0 && offset <= bytes.length - expected.length && expected.every((value, index) => bytes[offset + index] === value);
}

function formatForRange(bytes: Uint8Array, offset: number, length: number): RawPhaseTwoRangeFormat {
  if (hasAt(bytes, offset, [0xff, 0xd8, 0xff])) return "jpeg";
  if (hasAt(bytes, offset, [0x49, 0x49, 0x2a, 0x00]) || hasAt(bytes, offset, [0x4d, 0x4d, 0x00, 0x2a])) return "tiff";
  if (length >= 8 && ascii(bytes, offset + 4, 4) === "ftyp") return "iso-bmff";
  return "unknown";
}

function addDiagnostic(diagnostics: RawPhaseTwoDiagnostic[], limits: SecurityLimits, diagnostic: RawPhaseTwoDiagnostic): void {
  if (diagnostics.length < limits.maxWarnings) diagnostics.push(diagnostic);
}

function safeRange(
  id: string,
  role: RawPhaseTwoRangeRole,
  format: RawPhaseTwoRangeFormat,
  offset: number | null,
  length: number | null,
  source: string,
  dimensions: ImageDimensions | null,
  associatedItemId: number | null,
  associatedTrackId: number | null,
  fileLength: number,
  bytes: Uint8Array,
): RawPhaseTwoRange {
  const validNumbers = offset !== null && length !== null && Number.isSafeInteger(offset) && Number.isSafeInteger(length) && offset >= 0 && length > 0;
  const inBounds = validNumbers && offset <= fileLength && length <= fileLength - offset;
  const actualFormat = format === "unknown" && inBounds ? formatForRange(bytes, offset, length) : format;
  return {
    id,
    role,
    format: actualFormat,
    offset,
    length,
    source,
    dimensions,
    associatedItemId,
    associatedTrackId,
    status: !validNumbers ? "malformed" : inBounds ? "valid" : "out-of-bounds",
  };
}

function rangeIsValid(range: RawPhaseTwoRange): boolean {
  return range.status === "valid" && range.offset !== null && range.length !== null;
}

function validRange(range: RawPhaseTwoRange): range is RawPhaseTwoRange & { readonly offset: number; readonly length: number } {
  return rangeIsValid(range);
}

function mergeRanges(ranges: readonly RawPhaseTwoRange[], diagnostics: RawPhaseTwoDiagnostic[], limits: SecurityLimits): readonly RawPhaseTwoRange[] {
  const output: RawPhaseTwoRange[] = [];
  for (const candidate of ranges.slice(0, limits.maxSegments)) {
    if (output.some((item) => item.offset === candidate.offset && item.length === candidate.length && item.offset !== null)) {
      addDiagnostic(diagnostics, limits, { code: "DUPLICATE_RANGE", detail: `Duplicate source range ${candidate.id} was retained as a separate candidate.`, offset: candidate.offset, ...(candidate.length === null ? {} : { length: candidate.length }) });
      output.push({ ...candidate, status: candidate.status === "valid" ? "overlap" : candidate.status });
      continue;
    }
    const candidateOffset = candidate.offset;
    const candidateLength = candidate.length;
    const overlap = candidateOffset !== null && candidateLength !== null && output.some((item) => {
      if (item.offset === null || item.length === null || item.status !== "valid") return false;
      return candidateOffset < item.offset + item.length && item.offset < candidateOffset + candidateLength;
    });
    if (overlap) {
      addDiagnostic(diagnostics, limits, { code: "OVERLAPPING_RANGE", detail: `Source range ${candidate.id} overlaps another indexed payload.`, offset: candidateOffset, length: candidateLength });
      output.push({ ...candidate, status: candidate.status === "valid" ? "overlap" : candidate.status });
    } else output.push(candidate);
  }
  if (ranges.length > limits.maxSegments) addDiagnostic(diagnostics, limits, { code: "LIMIT_EXCEEDED", detail: "RAW phase-two range count exceeded the configured segment limit.", offset: null });
  return output;
}

interface BoxWalkState {
  readonly boxes: Cr3BoxReference[];
  readonly diagnostics: RawPhaseTwoDiagnostic[];
  count: number;
}

function scanCr3Boxes(bytes: Uint8Array, limits: SecurityLimits, signal?: AbortSignal): BoxWalkState {
  const state: BoxWalkState = { boxes: [], diagnostics: [], count: 0 };
  const visit = (start: number, end: number, depth: number, parentOffset: number | null): void => {
    throwIfAborted(signal);
    if (depth > limits.maxIfdDepth) {
      addDiagnostic(state.diagnostics, limits, { code: "LIMIT_EXCEEDED", detail: "CR3 ISO-BMFF nesting exceeded the configured depth limit.", offset: start });
      return;
    }
    let cursor = start;
    while (cursor < end) {
      throwIfAborted(signal);
      if (state.count >= limits.maxSegments) {
        addDiagnostic(state.diagnostics, limits, { code: "LIMIT_EXCEEDED", detail: "CR3 ISO-BMFF box count exceeded the configured segment limit.", offset: cursor });
        return;
      }
      state.count += 1;
      if (cursor > end - 8) {
        addDiagnostic(state.diagnostics, limits, { code: "TRUNCATED_DATA", detail: "CR3 box header is truncated.", offset: cursor });
        return;
      }
      const size32 = uint32(bytes, cursor);
      const type = ascii(bytes, cursor + 4, 4);
      let headerLength = 8;
      let size: number | null = size32;
      if (size32 === 1) {
        headerLength = 16;
        size = uint64(bytes, cursor + 8);
      } else if (size32 === 0) {
        size = end - cursor;
      }
      if (size === null || size < headerLength || !Number.isSafeInteger(size) || size > end - cursor) {
        addDiagnostic(state.diagnostics, limits, { code: "UNSAFE_RANGE", detail: `CR3 ${type} box has an unsafe or truncated length.`, offset: cursor, ...(size === null || size < 0 ? {} : { length: size }) });
        state.boxes.push({ id: `cr3:box:${cursor}`, type, offset: cursor, length: Math.max(0, end - cursor), payloadOffset: Math.min(end, cursor + headerLength), parentOffset, uuid: null, status: "truncated" });
        return;
      }
      const boxEnd = cursor + size;
      const payloadOffset = cursor + headerLength;
      const uuid = type === "uuid" && size - headerLength >= 16 ? hex(bytes, payloadOffset, 16) : null;
      const box: Cr3BoxReference = { id: `cr3:box:${cursor}`, type, offset: cursor, length: size, payloadOffset, parentOffset, uuid, status: type === "uuid" && uuid === null ? "unsupported" : "valid" };
      state.boxes.push(box);
      if (CR3_CONTAINERS.has(type)) {
        const childStart = type === "meta" ? payloadOffset + 4 : payloadOffset;
        if (childStart > boxEnd) {
          addDiagnostic(state.diagnostics, limits, { code: "TRUNCATED_DATA", detail: `CR3 ${type} container has no complete full-box prefix.`, offset: payloadOffset });
          return;
        }
        visit(childStart, boxEnd, depth + 1, cursor);
      }
      cursor = boxEnd;
    }
  };
  visit(0, bytes.length, 0, null);
  return state;
}

function findJpegRange(bytes: Uint8Array, start: number, end: number): { readonly offset: number; readonly length: number } | null {
  let soi = -1;
  for (let cursor = start; cursor <= end - 3; cursor += 1) {
    if (bytes[cursor] === 0xff && bytes[cursor + 1] === 0xd8 && bytes[cursor + 2] === 0xff) { soi = cursor; break; }
  }
  if (soi < 0) return null;
  for (let cursor = soi + 3; cursor <= end - 2; cursor += 1) {
    if (bytes[cursor] === 0xff && bytes[cursor + 1] === 0xd9) return { offset: soi, length: cursor + 2 - soi };
  }
  return null;
}

function findTiffHeaders(bytes: Uint8Array, start: number, end: number, maximum: number): readonly number[] {
  const offsets: number[] = [];
  for (let cursor = start; cursor <= end - 4 && offsets.length < maximum; cursor += 1) {
    if (hasAt(bytes, cursor, [0x49, 0x49, 0x2a, 0x00]) || hasAt(bytes, cursor, [0x4d, 0x4d, 0x00, 0x2a])) offsets.push(cursor);
  }
  return offsets;
}

function textAt(bytes: Uint8Array, offset: number, length: number): string | null {
  const end = Math.min(bytes.length, offset + length);
  let cursor = offset;
  while (cursor < end && bytes[cursor] !== 0) cursor += 1;
  const value = decodeText(bytes, offset, cursor - offset);
  return value === null ? null : value.trim();
}

function sourceBlockId(prefix: string, id: string): string {
  return `${prefix}:${id}`;
}

function remapExif(exif: ExifData | null, prefix: string, blockIds: ReadonlyMap<string, string>): ExifData | null {
  if (exif === null) return null;
  const directoryIds = new Map<string, string>();
  for (const directory of exif.ifds) {
    const oldId = directory.id ?? `${directory.name}@${directory.offset}`;
    directoryIds.set(oldId, sourceBlockId(prefix, oldId));
  }
  const mapDirectoryId = (id: string | null | undefined): string | null | undefined => id === undefined ? undefined : id === null ? null : directoryIds.get(id) ?? sourceBlockId(prefix, id);
  const ifds = exif.ifds.map((directory) => {
    const mapped = { ...directory };
    if (directory.id !== undefined) mapped.id = mapDirectoryId(directory.id) as string;
    if (directory.parentId !== undefined) {
      const parentId = mapDirectoryId(directory.parentId);
      if (parentId !== undefined) mapped.parentId = parentId;
    }
    if (directory.nextId !== undefined) {
      const nextId = mapDirectoryId(directory.nextId);
      if (nextId !== undefined) mapped.nextId = nextId;
    }
    return mapped;
  });
  const remapField = (field: MetadataField): MetadataField => field.source === undefined ? field : {
    ...field,
    ...(field.directoryId === undefined ? {} : { directoryId: mapDirectoryId(field.directoryId) as string }),
    source: {
      ...field.source,
      blockId: blockIds.get(field.source.blockId) ?? sourceBlockId(prefix, field.source.blockId),
      ...(field.source.directoryId === undefined ? {} : { directoryId: mapDirectoryId(field.source.directoryId) as string }),
    },
  };
  const topology = exif.topology === undefined ? undefined : {
    directories: exif.topology.directories.map((directory) => ({
      ...directory,
      id: mapDirectoryId(directory.id) as string,
      parentId: mapDirectoryId(directory.parentId) as string | null,
      nextId: mapDirectoryId(directory.nextId) as string | null,
    })),
    relations: exif.topology.relations.map((relation) => ({
      ...relation,
      fromDirectoryId: mapDirectoryId(relation.fromDirectoryId) as string,
      toDirectoryId: mapDirectoryId(relation.toDirectoryId) as string,
    })),
  };
  const withoutThumbnail = { ...exif };
  delete withoutThumbnail.thumbnail;
  return { ...withoutThumbnail, ifds, fields: exif.fields.map(remapField), ...(topology === undefined ? {} : { topology }) };
}

interface RelabeledResult {
  readonly fields: readonly MetadataField[];
  readonly exif: ExifData | null;
  readonly xmp: ParsedMetadataResult["xmp"];
  readonly iptc: ParsedMetadataResult["iptc"];
  readonly icc: ParsedMetadataResult["icc"];
  readonly blocks: readonly MetadataBlock[];
  readonly dimensions: ImageDimensions | null;
  readonly warnings: readonly MetadataWarning[];
  readonly makerNotes: ParsedMetadataResult["makerNotes"];
}

function relabelResult(result: ParsedMetadataResult, prefix: string): RelabeledResult {
  const blockIds = new Map((result.blocks ?? []).map((block) => [block.id, sourceBlockId(prefix, block.id)] as const));
  const remapField = (field: MetadataField): MetadataField => field.source === undefined ? field : { ...field, source: { ...field.source, blockId: blockIds.get(field.source.blockId) ?? sourceBlockId(prefix, field.source.blockId) } };
  const blocks = (result.blocks ?? []).map((block) => ({ ...block, id: blockIds.get(block.id) ?? sourceBlockId(prefix, block.id) }));
  const iptc = result.iptc === null || result.iptc.fields === undefined
    ? result.iptc
    : { ...result.iptc, fields: result.iptc.fields.map(remapField) };
  const makerNotes = result.makerNotes === null || result.makerNotes === undefined ? result.makerNotes : {
    ...result.makerNotes,
    notes: result.makerNotes.notes.map((note) => ({
      ...note,
      provenance: { ...note.provenance, blockId: blockIds.get(note.provenance.blockId) ?? sourceBlockId(prefix, note.provenance.blockId) },
      fields: note.fields.map((field) => ({ ...field, provenance: { ...field.provenance, blockId: blockIds.get(field.provenance.blockId) ?? sourceBlockId(prefix, field.provenance.blockId) } })),
      opaqueRanges: note.opaqueRanges.map((range) => ({ ...range, provenance: { ...range.provenance, blockId: blockIds.get(range.provenance.blockId) ?? sourceBlockId(prefix, range.provenance.blockId) } })),
    })),
  } satisfies NonNullable<ParsedMetadataResult["makerNotes"]>;
  return {
    fields: result.fields.map(remapField),
    exif: remapExif(result.exif, prefix, blockIds),
    xmp: result.xmp,
    iptc,
    icc: result.icc,
    blocks,
    dimensions: result.dimensions,
    warnings: result.warnings,
    makerNotes,
  };
}

function mergeExif(first: ExifData | null, second: ExifData | null): ExifData | null {
  if (first === null) return second;
  if (second === null) return first;
  return {
    byteOrder: first.byteOrder,
    fields: [...first.fields, ...second.fields],
    ifds: [...first.ifds, ...second.ifds],
    ...(first.topology === undefined && second.topology === undefined ? {} : {
      topology: {
        directories: [...(first.topology?.directories ?? []), ...(second.topology?.directories ?? [])],
        relations: [...(first.topology?.relations ?? []), ...(second.topology?.relations ?? [])],
      },
    }),
    ...(first.associatedImages === undefined && second.associatedImages === undefined ? {} : { associatedImages: [...(first.associatedImages ?? []), ...(second.associatedImages ?? [])] }),
  };
}

function mergeMakerNotes(first: ParsedMetadataResult["makerNotes"], second: ParsedMetadataResult["makerNotes"]): ParsedMetadataResult["makerNotes"] {
  if (first === null || first === undefined) return second;
  if (second === null || second === undefined) return first;
  return {
    notes: [...first.notes, ...second.notes],
    diagnostics: [...first.diagnostics, ...second.diagnostics],
    complete: first.complete && second.complete,
  } satisfies MakerNoteContainerData;
}

function makeXmp(packets: readonly (string | null)[]): ParsedMetadataResult["xmp"] {
  const values = packets.filter((packet): packet is string => packet !== null);
  return values.length === 0 ? null : { packets: values };
}

function primarySelection(itemCandidates: readonly number[], trackCandidates: readonly number[]): Cr3ContainerData["primarySelection"] {
  const candidates = [...new Set([...itemCandidates, ...trackCandidates])];
  return candidates.length === 0 ? "none" : candidates.length === 1 ? "unambiguous" : "ambiguous";
}

function normalizeCr3Sequences(sequences: readonly HeifSequence[], bytes: Uint8Array): readonly HeifSequence[] {
  return sequences.map((sequence) => {
    const tracks = sequence.tracks.map((track) => {
      const format = track.sampleDescriptions[0]?.format.toUpperCase() ?? "";
      const kind = track.kind === "unknown" && (format === "CRAW" || format === "JPEG") && track.handlerType === "vide" ? "picture" as const : track.kind;
      const samplesBounded = track.samples.length > 0 && track.samples.every((sample) => sample.offset !== null && sample.byteLength !== null && sample.offset >= 0 && sample.byteLength > 0 && sample.offset <= bytes.length && sample.byteLength <= bytes.length - sample.offset);
      return { ...track, kind, complete: track.complete || samplesBounded };
    });
    const pictureTrackCandidates = tracks.filter(({ kind }) => kind === "picture").map(({ id }) => id);
    const primaryTrackId = pictureTrackCandidates.length === 1 ? pictureTrackCandidates[0] ?? null : null;
    const primarySelection = pictureTrackCandidates.length === 1 ? "sole-picture-track" as const : pictureTrackCandidates.length > 1 ? "ambiguous-picture-tracks" as const : "no-picture-track" as const;
    return { ...sequence, tracks, primaryTrackId, primaryTrackCandidates: pictureTrackCandidates, primarySelection, complete: sequence.complete || tracks.every(({ complete }) => complete) };
  });
}

/** Parse a Canon CR3 as an ISO-BMFF container with a separate CR3 inventory. */
export function parseCr3(bytes: Uint8Array, limits: SecurityLimits, selection?: ResolvedSelection, signal?: AbortSignal, registry?: MetadataRegistry, makerNotePlugins?: readonly MakerNotePlugin[]): ParsedMetadataResult {
  throwIfAborted(signal);
  const includeExif = wantsGroup(selection, "EXIF");
  const includeXmp = wantsGroup(selection, "XMP");
  const boxState = scanCr3Boxes(bytes, limits, signal);
  const brands = boxState.boxes.find(({ type }) => type === "ftyp");
  const majorBrand = brands === undefined || brands.payloadOffset > brands.offset + brands.length - 8 ? "" : ascii(bytes, brands.payloadOffset, 4);
  const compatibleBrands: string[] = [];
  if (brands !== undefined && brands.payloadOffset + 8 <= brands.offset + brands.length) {
    for (let offset = brands.payloadOffset + 8; offset + 4 <= brands.offset + brands.length && compatibleBrands.length < limits.maxIfdEntries; offset += 4) compatibleBrands.push(ascii(bytes, offset, 4));
  }
  const warnings: MetadataWarning[] = boxState.diagnostics.map((item) => ({ code: item.code === "TRUNCATED_DATA" ? "TRUNCATED_DATA" : item.code === "LIMIT_EXCEEDED" ? "LIMIT_EXCEEDED" : "MALFORMED_CR3", message: item.detail, severity: item.code === "LIMIT_EXCEEDED" ? "warning" : "error", ...(item.offset === null ? {} : { offset: item.offset }), ...(item.length === undefined ? {} : { length: item.length }) }));
  if (majorBrand !== "crx ") warnings.push({ code: "MALFORMED_CR3", message: "CR3 input is missing the required crx major brand.", severity: "error", offset: 8 });

  const generic = parseHeif(bytes, limits, "cr3", selection, signal, registry);
  const sequences = normalizeCr3Sequences(generic.heifSequences ?? [], bytes);
  const itemGraphs = generic.heif ?? [];
  const itemCandidates = itemGraphs.flatMap((graph) => graph.primaryItemId === null ? [] : [graph.primaryItemId]);
  const trackCandidates = sequences.flatMap((sequence) => sequence.primaryTrackCandidates);
  const ranges: RawPhaseTwoRange[] = [];
  const metadataRanges: RawPhaseTwoRange[] = [];
  const previewRanges: RawPhaseTwoRange[] = [];
  const rawRanges: RawPhaseTwoRange[] = [];
  const opaqueStructures: RawPhaseTwoRange[] = [];
  for (const graph of itemGraphs) {
    for (const item of graph.items.slice(0, limits.maxIfdEntries)) {
      const role: RawPhaseTwoRangeRole = item.roles.includes("metadata") || item.type === "Exif" || item.contentType === "application/rdf+xml" ? "metadata" : item.roles.includes("thumbnail") || item.roles.includes("auxiliary") ? "preview" : item.type === "jpeg" || item.type === "JPEG" ? "preview" : "raw";
      const format: RawPhaseTwoRangeFormat = role === "metadata" ? "unknown" : role === "preview" ? "jpeg" : "raw";
      for (const extent of item.location?.extents ?? []) {
        const range = safeRange(`cr3:item:${item.id}:extent:${extent.index ?? 0}`, role, format, extent.absoluteOffset, extent.length, `iloc:item:${item.id}`, item.dimensions, item.id, null, bytes.length, bytes);
        ranges.push(range);
        if (role === "metadata") metadataRanges.push(range); else if (role === "preview") previewRanges.push(range); else rawRanges.push(range);
      }
    }
  }
  for (const sequence of sequences) for (const track of sequence.tracks) {
    const description = track.sampleDescriptions[0];
    const descriptionFormat = description?.format.toLowerCase() ?? "";
    for (const sample of track.samples.slice(0, limits.maxIfdEntries)) {
      const sampleIsJpeg = sample.offset !== null && sample.byteLength !== null && sample.offset >= 0 && sample.byteLength > 0 && sample.offset <= bytes.length && sample.byteLength <= bytes.length - sample.offset && formatForRange(bytes, sample.offset, sample.byteLength) === "jpeg";
      const role: RawPhaseTwoRangeRole = track.kind === "metadata" ? "metadata" : sampleIsJpeg || descriptionFormat.includes("jpeg") || descriptionFormat.includes("mjpg") ? "preview" : "raw";
      const format: RawPhaseTwoRangeFormat = role === "metadata" ? "unknown" : role === "preview" ? "jpeg" : "raw";
      const range = safeRange(`cr3:track:${track.id}:sample:${sample.index}`, role, format, sample.offset, sample.byteLength, `stbl:track:${track.id}:sample:${sample.index}`, track.dimensions, null, track.id, bytes.length, bytes);
      ranges.push(range);
      if (role === "metadata") metadataRanges.push(range); else if (role === "preview") previewRanges.push(range); else rawRanges.push(range);
    }
  }
  for (const box of boxState.boxes) {
    if (box.type !== "uuid" || box.uuid === CR3_XMP_UUID || box.uuid === CR3_PREVIEW_UUID) continue;
    const payloadLength = box.length - (box.payloadOffset - box.offset);
    if (box.uuid === CR3_CANON_UUID) {
      const metadataRange = safeRange(`cr3:canon-metadata:${box.offset}`, "metadata", "unknown", box.payloadOffset + 16, payloadLength - 16, `uuid:${box.uuid}`, null, null, null, bytes.length, bytes);
      ranges.push(metadataRange);
      metadataRanges.push(metadataRange);
      const opaqueRange = safeRange(`cr3:opaque:${box.offset}`, "unknown", "unknown", box.payloadOffset, payloadLength, `uuid:${box.uuid}`, null, null, null, bytes.length, bytes);
      opaqueStructures.push(opaqueRange);
    } else {
      const range = safeRange(`cr3:opaque:${box.offset}`, "unknown", "unknown", box.payloadOffset, payloadLength, `uuid:${box.uuid ?? "unknown"}`, null, null, null, bytes.length, bytes);
      ranges.push(range);
      opaqueStructures.push(range);
    }
  }
  const xmpBox = boxState.boxes.find(({ type, uuid }) => type === "uuid" && uuid === CR3_XMP_UUID);
  if (xmpBox !== undefined) {
    const payloadLength = xmpBox.length - (xmpBox.payloadOffset - xmpBox.offset);
    const xmpRange = safeRange(`cr3:xmp:${xmpBox.offset}`, "metadata", "unknown", xmpBox.payloadOffset + 16, payloadLength - 16, `uuid:${CR3_XMP_UUID}`, null, null, null, bytes.length, bytes);
    ranges.push(xmpRange);
    metadataRanges.push(xmpRange);
  }
  const previewBox = boxState.boxes.find(({ type, uuid }) => type === "uuid" && uuid === CR3_PREVIEW_UUID);
  if (previewBox !== undefined) {
    const preview = findJpegRange(bytes, previewBox.payloadOffset + 16, previewBox.offset + previewBox.length);
    if (preview !== null) {
      const range = safeRange("cr3:preview:prvw", "preview", "jpeg", preview.offset, preview.length, `uuid:${CR3_PREVIEW_UUID}`, null, null, null, bytes.length, bytes);
      ranges.push(range); previewRanges.push(range);
    } else addDiagnostic(boxState.diagnostics, limits, { code: "TRUNCATED_DATA", detail: "CR3 PRVW UUID does not contain a complete embedded JPEG.", offset: previewBox.offset, length: previewBox.length });
  }
  const finalRanges = mergeRanges(ranges, boxState.diagnostics, limits);
  const finalMetadata = finalRanges.filter((range) => metadataRanges.some(({ id }) => id === range.id));
  const finalPreview = finalRanges.filter((range) => previewRanges.some(({ id }) => id === range.id));
  const finalRaw = finalRanges.filter((range) => rawRanges.some(({ id }) => id === range.id));
  const finalOpaque = opaqueStructures.slice(0, limits.maxSegments);
  const cr3: Cr3ContainerData = {
    kind: "cr3",
    container: "iso-bmff",
    signature: "crx",
    majorBrand,
    compatibleBrands,
    boxes: boxState.boxes,
    itemGraphs,
    sequences,
    primaryItemCandidates: itemCandidates,
    primaryTrackCandidates: trackCandidates,
    primarySelection: primarySelection(itemCandidates, trackCandidates),
    ranges: finalRanges,
    metadataRanges: finalMetadata,
    previewRanges: finalPreview,
    rawRanges: finalRaw,
    opaqueStructures: finalOpaque,
    complete: boxState.diagnostics.length === 0 && majorBrand === "crx ",
    diagnostics: boxState.diagnostics,
  };
  if (cr3.primarySelection === "ambiguous") addDiagnostic(boxState.diagnostics, limits, { code: "AMBIGUOUS_PRIMARY", detail: "CR3 contains multiple independent primary item or picture-track candidates; none was merged or selected.", offset: null });

  let parsedFields = generic.fields;
  let parsedExif = generic.exif;
  let parsedXmp = generic.xmp;
  let parsedIptc = generic.iptc;
  let parsedIcc = generic.icc;
  let parsedMakerNotes = generic.makerNotes;
  let parsedDimensions: ImageDimensions | null = null;
  let parsedBlocks = [...(generic.blocks ?? [])];
  const previewCandidates = finalPreview.filter(validRange).sort((a, b) => a.offset - b.offset);
  if (includeExif || includeXmp || wantsGroup(selection, "Dimensions") || wantsGroup(selection, "MakerNote")) {
    for (const previewRange of previewCandidates.slice(0, limits.maxIfdEntries)) {
      const jpegOptions = {
        ...(selection === undefined ? {} : { selection }),
        ...(signal === undefined ? {} : { signal }),
        offsetMap: (offset: number): number => previewRange.offset + offset,
        ...(registry === undefined ? {} : { registry }),
        ...(makerNotePlugins === undefined ? {} : { makerNotePlugins }),
      };
      const previewResult = relabelResult(parseJpeg(bytes.subarray(previewRange.offset, previewRange.offset + previewRange.length), limits, jpegOptions), "cr3:preview");
      parsedFields = [...parsedFields, ...previewResult.fields];
      parsedExif = mergeExif(parsedExif, previewResult.exif);
      parsedIptc = parsedIptc ?? previewResult.iptc;
      parsedIcc = parsedIcc ?? previewResult.icc;
      parsedMakerNotes = mergeMakerNotes(parsedMakerNotes, previewResult.makerNotes);
      if (previewResult.dimensions !== null && (parsedDimensions === null || previewResult.dimensions.width * previewResult.dimensions.height > parsedDimensions.width * parsedDimensions.height)) parsedDimensions = previewResult.dimensions;
      parsedBlocks = [...parsedBlocks, ...previewResult.blocks];
      warnings.push(...previewResult.warnings);
      parsedXmp = makeXmp([...(parsedXmp?.packets ?? []), ...(previewResult.xmp?.packets ?? [])]);
    }
  }
  parsedDimensions ??= generic.dimensions;
  if (includeXmp) {
    if (xmpBox !== undefined && xmpBox.payloadOffset + 16 < xmpBox.offset + xmpBox.length) {
      const body = decodeText(bytes, xmpBox.payloadOffset + 16, xmpBox.offset + xmpBox.length - xmpBox.payloadOffset - 16);
      const packet = body === null ? null : body.replace(/\0+$/u, "");
      parsedXmp = makeXmp([...(parsedXmp?.packets ?? []), packet]);
      parsedBlocks.push({ id: `cr3:xmp-uuid:${xmpBox.offset}`, family: "XMP", container: "CR3 XMP UUID", status: packet === null ? "malformed" : "decoded", offset: xmpBox.offset, length: xmpBox.length, associatedImage: null, sensitivity: "moderate", warningCodes: packet === null ? ["INVALID_VALUE"] : [] });
      if (packet === null || packet.length === 0) warnings.push({ code: "INVALID_VALUE", message: "CR3 XMP UUID is not valid bounded UTF-8.", severity: "warning", offset: xmpBox.payloadOffset + 16 });
    }
  }
  if (includeExif) {
    for (const metadataRange of finalMetadata.filter(validRange).filter((range) => range.source === `uuid:${CR3_CANON_UUID}`).slice(0, limits.maxIfdEntries)) {
      const metadataOffset = metadataRange.offset;
      const metadataEnd = metadataRange.offset + metadataRange.length;
      const tiffOffsets = findTiffHeaders(bytes, metadataOffset, metadataEnd, limits.maxIfdEntries)
        .filter((offset) => offset >= 4 && (ascii(bytes, offset - 4, 4) === "CMT1" || ascii(bytes, offset - 4, 4) === "CMT2"));
      for (let index = 0; index < tiffOffsets.length; index += 1) {
        const tiffOffset = tiffOffsets[index];
        if (tiffOffset === undefined) continue;
        const nextTiffOffset = tiffOffsets[index + 1] ?? metadataEnd;
        const parsed = relabelResult(parseTiffMetadata(bytes.subarray(tiffOffset, nextTiffOffset), limits, selection, false, signal, registry, (offset) => tiffOffset + offset, bytes.length, makerNotePlugins), `cr3:metadata:${tiffOffset}`);
        if (parsed.exif === null && parsed.fields.length === 0) {
          warnings.push(...parsed.warnings);
          continue;
        }
        parsedFields = [...parsedFields, ...parsed.fields];
        parsedExif = mergeExif(parsedExif, parsed.exif);
        parsedIptc = parsedIptc ?? parsed.iptc;
        parsedIcc = parsedIcc ?? parsed.icc;
        parsedMakerNotes = mergeMakerNotes(parsedMakerNotes, parsed.makerNotes);
        if (parsedDimensions === null) parsedDimensions = parsed.dimensions;
        parsedBlocks = [...parsedBlocks, ...parsed.blocks];
        warnings.push(...parsed.warnings);
      }
    }
  }
  const diagnostics = boxState.diagnostics;
  const structurallyComplete = majorBrand === "crx " && diagnostics.every(({ code }) => code === "AMBIGUOUS_PRIMARY");
  return {
    ...generic,
    format: "cr3",
    mimeType: "image/x-canon-cr3",
    dimensions: parsedDimensions,
    heifSequences: sequences,
    fields: parsedFields,
    exif: parsedExif,
    xmp: parsedXmp,
    iptc: parsedIptc,
    icc: parsedIcc,
    makerNotes: parsedMakerNotes ?? null,
    blocks: parsedBlocks,
    cr3: { ...cr3, sequences, primaryTrackCandidates: sequences.flatMap((sequence) => sequence.primaryTrackCandidates), primarySelection: primarySelection(itemCandidates, sequences.flatMap((sequence) => sequence.primaryTrackCandidates)), diagnostics: diagnostics.slice(0, limits.maxWarnings), complete: structurallyComplete },
    warnings: [...generic.warnings.map((item) => item.code === "TRUNCATED_DATA" && item.message.startsWith("ISO BMFF box extends beyond its parent.") ? { ...item, code: "UNSUPPORTED_STRUCTURE" as const, severity: "warning" as const, message: "CR3 vendor sample-entry bytes are indexed as an opaque structure; the CR3 parser retains the associated track and sample ranges." } : item), ...warnings].slice(0, limits.maxWarnings),
  };
}

function rafRange(
  id: string,
  role: RawPhaseTwoRangeRole,
  offset: number,
  length: number,
  source: string,
  bytes: Uint8Array,
): RawPhaseTwoRange {
  return safeRange(id, role, role === "preview" ? "jpeg" : "unknown", offset, length, source, null, null, null, bytes.length, bytes);
}

function parseRafDirectory(bytes: Uint8Array, limits: SecurityLimits): { readonly directory: RafDirectory | null; readonly ranges: readonly RawPhaseTwoRange[]; readonly diagnostics: readonly RawPhaseTwoDiagnostic[] } {
  const diagnostics: RawPhaseTwoDiagnostic[] = [];
  if (bytes.length < 108 || ascii(bytes, 0, 16) !== RAF_SIGNATURE) {
    addDiagnostic(diagnostics, limits, { code: "MALFORMED_STRUCTURE", detail: "RAF identity or fixed directory header is truncated.", offset: 0 });
    return { directory: null, ranges: [], diagnostics };
  }
  const directoryOffset = 80;
  const directoryByteLength = 28;
  const values = Array.from({ length: 6 }, (_, index) => uint32(bytes, directoryOffset + 4 + index * 4));
  const [previewOffset, previewLength, metadataOffset, metadataLength, rawOffset, rawLength] = values;
  const version = textAt(bytes, 16, 4);
  const preview = rafRange("raf:preview", "preview", previewOffset ?? 0, previewLength ?? 0, "RAF directory preview offset/length", bytes);
  const metadata = rafRange("raf:metadata", "metadata", metadataOffset ?? 0, metadataLength ?? 0, "RAF directory metadata offset/length", bytes);
  const raw = rafRange("raf:cfa", "cfa", rawOffset ?? 0, rawLength ?? 0, "RAF directory CFA/RAW offset/length", bytes);
  const ranges = mergeRanges([preview, metadata, raw], diagnostics, limits);
  if (ranges.some((range) => range.status !== "valid")) addDiagnostic(diagnostics, limits, { code: "UNSAFE_RANGE", detail: "One or more RAF directory ranges are not wholly inside the source file.", offset: directoryOffset, length: directoryByteLength });
  const validRanges = ranges.filter(validRange);
  if (validRanges.length > 1) {
    const ordered = [...validRanges].sort((a, b) => a.offset - b.offset);
    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1]; const current = ordered[index];
      if (previous !== undefined && current !== undefined && previous.offset + previous.length > current.offset) addDiagnostic(diagnostics, limits, { code: "OVERLAPPING_RANGE", detail: "RAF embedded ranges overlap.", offset: current.offset, length: current.length });
    }
  }
  const directory: RafDirectory = {
    offset: directoryOffset,
    byteLength: directoryByteLength,
    version,
    preview: { offset: preview.offset, length: preview.length, status: preview.status },
    metadata: { offset: metadata.offset, length: metadata.length, status: metadata.status },
    raw: { offset: raw.offset, length: raw.length, status: raw.status },
    complete: diagnostics.length === 0,
  };
  return { directory, ranges, diagnostics };
}

/** Parse Fuji RAF directory ranges and supported metadata without decoding the CFA payload. */
export function parseRaf(bytes: Uint8Array, limits: SecurityLimits, selection?: ResolvedSelection, signal?: AbortSignal, registry?: MetadataRegistry, makerNotePlugins?: readonly MakerNotePlugin[]): ParsedMetadataResult {
  throwIfAborted(signal);
  const directoryResult = parseRafDirectory(bytes, limits);
  const warnings: MetadataWarning[] = directoryResult.diagnostics.map((item) => ({ code: item.code === "TRUNCATED_DATA" ? "TRUNCATED_DATA" : item.code === "LIMIT_EXCEEDED" ? "LIMIT_EXCEEDED" : "MALFORMED_RAF", message: item.detail, severity: item.code === "LIMIT_EXCEEDED" ? "warning" : "error", ...(item.offset === null ? {} : { offset: item.offset }), ...(item.length === undefined ? {} : { length: item.length }) }));
  let fields: MetadataField[] = [];
  let exif: ExifData | null = null;
  let xmp: ParsedMetadataResult["xmp"] = null;
  let iptc: ParsedMetadataResult["iptc"] = null;
  let icc: ParsedMetadataResult["icc"] = null;
  let makerNotes: ParsedMetadataResult["makerNotes"] = null;
  let dimensions: ImageDimensions | null = null;
  let blocks: MetadataBlock[] = [];
  const associatedPreviewRanges: RawPhaseTwoRange[] = [];
  const preview = directoryResult.ranges.find(({ id }) => id === "raf:preview");
  if (preview !== undefined && validRange(preview) && (wantsGroup(selection, "EXIF") || wantsGroup(selection, "XMP") || wantsGroup(selection, "Dimensions") || wantsGroup(selection, "MakerNote"))) {
    const jpegOptions = {
      ...(selection === undefined ? {} : { selection }),
      ...(signal === undefined ? {} : { signal }),
      offsetMap: (offset: number): number => preview.offset + offset,
      ...(registry === undefined ? {} : { registry }),
      ...(makerNotePlugins === undefined ? {} : { makerNotePlugins }),
    };
    const parsed = relabelResult(parseJpeg(bytes.subarray(preview.offset, preview.offset + preview.length), limits, jpegOptions), "raf:preview");
    fields.push(...parsed.fields); exif = parsed.exif; xmp = parsed.xmp; iptc = parsed.iptc; icc = parsed.icc; makerNotes = parsed.makerNotes; dimensions = parsed.dimensions; blocks.push(...parsed.blocks); warnings.push(...parsed.warnings);
    for (const image of parsed.exif?.associatedImages ?? []) {
      if (image.role !== "thumbnail" && image.role !== "preview") continue;
      if (image.offset === null || image.length === null) continue;
      const range = rafRange(`raf:${image.role}:${image.offset}`, image.role, image.offset, image.length, "RAF preview EXIF associated-image reference", bytes);
      if (range.status === "valid") associatedPreviewRanges.push(range);
      else if (warnings.length < limits.maxWarnings) warnings.push({ code: "UNSAFE_OFFSET", message: "RAF preview EXIF associated-image range is outside the RAF source.", severity: "warning", ...(range.offset === null ? {} : { offset: range.offset }), ...(range.length === null ? {} : { length: range.length }) });
    }
  }
  const raw = directoryResult.ranges.find(({ id }) => id === "raf:cfa");
  if (raw !== undefined && validRange(raw) && wantsGroup(selection, "EXIF")) {
    const parsed = relabelResult(parseTiffMetadata(bytes.subarray(raw.offset, raw.offset + raw.length), limits, selection, false, signal, registry, (offset) => raw.offset + offset, bytes.length, makerNotePlugins), "raf:cfa");
    fields = [...fields, ...parsed.fields]; exif = mergeExif(exif, parsed.exif); xmp = makeXmp([...(xmp?.packets ?? []), ...(parsed.xmp?.packets ?? [])]); iptc = iptc ?? parsed.iptc; icc = icc ?? parsed.icc; makerNotes = mergeMakerNotes(makerNotes, parsed.makerNotes); dimensions = dimensions ?? parsed.dimensions; blocks = [...blocks, ...parsed.blocks]; warnings.push(...parsed.warnings);
  }
  const metadata = directoryResult.ranges.find(({ id }) => id === "raf:metadata");
  if (metadata !== undefined) blocks.push({ id: "raf:metadata", family: "Unknown", container: "RAF proprietary metadata range", status: rangeIsValid(metadata) ? "opaque" : "malformed", offset: metadata.offset, length: metadata.length, associatedImage: null, sensitivity: "high", warningCodes: rangeIsValid(metadata) ? ["UNSUPPORTED_STRUCTURE"] : ["UNSAFE_OFFSET"] });
  const previewRanges = [...directoryResult.ranges.filter(({ id }) => id === "raf:preview"), ...associatedPreviewRanges].slice(0, limits.maxSegments);
  const metadataRanges = directoryResult.ranges.filter(({ id }) => id === "raf:metadata");
  const rawRanges = directoryResult.ranges.filter(({ id }) => id === "raf:cfa");
  const opaqueStructures = metadataRanges;
  const raf: RafContainerData = {
    kind: "raf",
    container: "raf",
    signature: RAF_SIGNATURE,
    version: textAt(bytes, 16, 4),
    camera: textAt(bytes, 24, 32),
    directory: directoryResult.directory,
    ranges: [...directoryResult.ranges, ...associatedPreviewRanges].slice(0, limits.maxSegments),
    previewRanges,
    metadataRanges,
    rawRanges,
    opaqueStructures,
    complete: directoryResult.diagnostics.length === 0,
    diagnostics: directoryResult.diagnostics,
  };
  return {
    format: "raf",
    mimeType: "image/x-fuji-raf",
    dimensions,
    fields,
    exif,
    xmp,
    iptc,
    icc,
    makerNotes: makerNotes ?? null,
    jfif: null,
    pngText: [],
    blocks,
    raf,
    warnings: warnings.slice(0, limits.maxWarnings),
  };
}
