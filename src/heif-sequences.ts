import type {
  HeifItemGraph,
  HeifSequence,
  HeifSequenceEdit,
  HeifSequenceMetadataAssociation,
  HeifSequenceSample,
  HeifSequenceSampleDescription,
  HeifSequenceTrack,
  HeifSequenceTrackKind,
  HeifSequenceTrackReference,
  HeifSequenceTransformation,
  ImageDimensions,
  ImageTransform,
  MetadataWarning,
  SecurityLimits,
} from "./types.js";

interface Box {
  readonly type: string;
  readonly start: number;
  readonly headerSize: number;
  readonly payloadStart: number;
  readonly end: number;
}

interface BoxBudget {
  remaining: number;
}

interface SequenceState {
  readonly warnings: MetadataWarning[];
  readonly limits: SecurityLimits;
  readonly bytes: Uint8Array;
  readonly boxes: BoxBudget;
  readonly childrenCache: Map<number, readonly Box[]>;
}

interface MutableSample {
  readonly index: number;
  descriptionIndex: number | null;
  byteLength: number | null;
  offset: number | null;
  decodeTime: number | null;
  compositionTime: number | null;
  duration: number | null;
  sync: boolean | null;
  readonly sourceOffset: number;
  readonly sourceByteLength: number;
  fragmentOffset: number | null;
}

interface MutableTrack {
  readonly id: number;
  handlerType: string | null;
  handlerName: string | null;
  kind: HeifSequenceTrackKind;
  timescale: number | null;
  duration: number | null;
  language: string | null;
  dimensions: ImageDimensions | null;
  transformation: HeifSequenceTransformation | null;
  readonly sampleDescriptions: HeifSequenceSampleDescription[];
  readonly samples: MutableSample[];
  readonly references: HeifSequenceTrackReference[];
  readonly edits: HeifSequenceEdit[];
  readonly associatedTrackIds: Set<number>;
  readonly metadataTrackIds: Set<number>;
  readonly sourceOffset: number;
  sourceEnd: number;
  complete: boolean;
}

interface TimingRun {
  readonly count: number;
  readonly value: number;
}

interface ChunkMapEntry {
  readonly firstChunk: number;
  readonly samplesPerChunk: number;
  readonly descriptionIndex: number;
}

interface TrackDefaults {
  readonly descriptionIndex: number | null;
  readonly duration: number | null;
  readonly size: number | null;
  readonly flags: number | null;
}

interface FragmentInfo {
  readonly trackId: number;
  readonly baseOffset: number | null;
  readonly defaultBaseIsMoof: boolean;
  readonly defaults: TrackDefaults;
  readonly decodeTime: number | null;
  readonly sourceOffset: number;
  readonly sourceEnd: number;
}

function uint16(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] ?? 0) << 8) | (bytes[offset + 1] ?? 0);
}

function uint32(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) * 0x1000000 +
    ((bytes[offset + 1] ?? 0) << 16) +
    ((bytes[offset + 2] ?? 0) << 8) +
    (bytes[offset + 3] ?? 0);
}

function int32(bytes: Uint8Array, offset: number): number {
  const value = uint32(bytes, offset);
  return value >= 0x80000000 ? value - 0x100000000 : value;
}

function uint64(bytes: Uint8Array, offset: number): number | null {
  const high = uint32(bytes, offset);
  const low = uint32(bytes, offset + 4);
  if (high > 0x1fffff) return null;
  const value = high * 0x100000000 + low;
  return Number.isSafeInteger(value) ? value : null;
}

function int64(bytes: Uint8Array, offset: number): number | null {
  const high = int32(bytes, offset);
  const low = uint32(bytes, offset + 4);
  const value = high * 0x100000000 + low;
  return Number.isSafeInteger(value) ? value : null;
}

function fixed16(bytes: Uint8Array, offset: number): number | null {
  const raw = int32(bytes, offset);
  const value = raw / 65536;
  return Number.isFinite(value) ? value : null;
}

function ascii(bytes: Uint8Array, offset: number, length = 4): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function safeAdd(left: number, right: number): number | null {
  const value = left + right;
  return Number.isSafeInteger(value) ? value : null;
}

function safeMultiply(left: number, right: number): number | null {
  const value = left * right;
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function fullVersion(payload: Uint8Array): number | null {
  return payload.length >= 4 ? payload[0] ?? 0 : null;
}

function addWarning(state: SequenceState, code: MetadataWarning["code"], message: string, offset: number, length?: number, severity: MetadataWarning["severity"] = "error"): void {
  if (state.warnings.length >= state.limits.maxWarnings) return;
  state.warnings.push({ code, message, severity, offset, ...(length === undefined ? {} : { length }) });
}

function invalid(state: SequenceState, message: string, offset: number, length?: number): void {
  addWarning(state, "MALFORMED_HEIF", message, offset, length);
}

function truncated(state: SequenceState, message: string, offset: number, length?: number): void {
  addWarning(state, "TRUNCATED_DATA", message, offset, length);
}

function limited(state: SequenceState, message: string, offset: number): void {
  addWarning(state, "LIMIT_EXCEEDED", message, offset, undefined, "warning");
}

function unsafe(state: SequenceState, message: string, offset: number, length?: number): void {
  addWarning(state, "UNSAFE_OFFSET", message, offset, length);
}

function parseBox(bytes: Uint8Array, start: number, end: number, state: SequenceState): Box | null {
  if (start > end - 8) {
    truncated(state, "ISO BMFF box header is truncated.", start);
    return null;
  }
  const size32 = uint32(bytes, start);
  const type = ascii(bytes, start + 4);
  let headerSize = 8;
  let size = size32;
  if (size32 === 1) {
    if (start > end - 16) {
      truncated(state, "ISO BMFF extended box header is truncated.", start);
      return null;
    }
    const extended = uint64(bytes, start + 8);
    if (extended === null) {
      unsafe(state, "ISO BMFF extended box size is outside the safe integer range.", start);
      return null;
    }
    size = extended;
    headerSize = 16;
  } else if (size32 === 0) {
    size = end - start;
  }
  const boxEnd = safeAdd(start, size);
  if (boxEnd === null || size < headerSize || boxEnd > end) {
    truncated(state, "ISO BMFF box extends beyond its parent.", start, size);
    return null;
  }
  return { type, start, headerSize, payloadStart: start + headerSize, end: boxEnd };
}

function children(box: Box, state: SequenceState): Box[] {
  const cached = state.childrenCache.get(box.start);
  if (cached !== undefined) return [...cached];
  const result: Box[] = [];
  let cursor = box.payloadStart;
  while (cursor < box.end) {
    if (state.boxes.remaining <= 0) {
      limited(state, "ISO BMFF box count exceeds the configured limit.", cursor);
      break;
    }
    state.boxes.remaining -= 1;
    const child = parseBox(state.bytes, cursor, box.end, state);
    if (child === null) break;
    result.push(child);
    cursor = child.end;
  }
  state.childrenCache.set(box.start, result);
  return result;
}

function topLevel(bytes: Uint8Array, state: SequenceState): Box[] {
  const result: Box[] = [];
  let cursor = 0;
  while (cursor < bytes.length) {
    if (state.boxes.remaining <= 0) {
      limited(state, "ISO BMFF top-level box count exceeds the configured limit.", cursor);
      break;
    }
    state.boxes.remaining -= 1;
    const box = parseBox(bytes, cursor, bytes.length, state);
    if (box === null) break;
    result.push(box);
    cursor = box.end;
  }
  return result;
}

function boxPayload(box: Box, state: SequenceState): Uint8Array {
  return state.bytes.subarray(box.payloadStart, box.end);
}

function parsedFullBox(box: Box, state: SequenceState): { readonly version: number; readonly flags: number; readonly payload: Uint8Array } | null {
  const payload = boxPayload(box, state);
  const version = fullVersion(payload);
  if (version === null) {
    truncated(state, `${box.type} full-box header is truncated.`, box.payloadStart);
    return null;
  }
  return { version, flags: ((payload[1] ?? 0) << 16) | ((payload[2] ?? 0) << 8) | (payload[3] ?? 0), payload };
}

function readLanguage(payload: Uint8Array, offset: number): string | null {
  const packed = uint16(payload, offset) & 0x7fff;
  if (packed === 0) return null;
  const letters = [
    String.fromCharCode(0x60 + ((packed >> 10) & 0x1f)),
    String.fromCharCode(0x60 + ((packed >> 5) & 0x1f)),
    String.fromCharCode(0x60 + (packed & 0x1f)),
  ];
  return letters.every((letter) => letter >= "a" && letter <= "z") ? letters.join("") : null;
}

function parseMovieHeader(box: Box, state: SequenceState): { readonly timescale: number | null; readonly duration: number | null } {
  const parsed = parsedFullBox(box, state);
  if (parsed === null) return { timescale: null, duration: null };
  const { version, payload } = parsed;
  const timeOffset = version === 1 ? 28 : 16;
  const timescaleOffset = version === 1 ? 20 : 12;
  const durationOffset = version === 1 ? 24 : 16;
  if (version !== 0 && version !== 1 || payload.length < timeOffset + 4) {
    invalid(state, "Movie header version or length is unsupported.", box.payloadStart);
    return { timescale: null, duration: null };
  }
  const timescale = uint32(payload, timescaleOffset);
  const duration = version === 1 ? uint64(payload, durationOffset) : uint32(payload, durationOffset);
  if (timescale === 0) invalid(state, "Movie header has a zero timescale.", box.payloadStart + timescaleOffset);
  if (version === 1 && duration === null) unsafe(state, "Movie duration is outside the safe integer range.", box.payloadStart + durationOffset);
  return { timescale: timescale > 0 ? timescale : null, duration };
}

function parseTrackHeader(box: Box, state: SequenceState): { readonly id: number | null; readonly duration: number | null; readonly dimensions: ImageDimensions | null; readonly transformation: HeifSequenceTransformation | null } {
  const parsed = parsedFullBox(box, state);
  if (parsed === null) return { id: null, duration: null, dimensions: null, transformation: null };
  const { version, payload } = parsed;
  if (version !== 0 && version !== 1) {
    invalid(state, "Track header version is unsupported.", box.payloadStart);
    return { id: null, duration: null, dimensions: null, transformation: null };
  }
  const trackIdOffset = version === 1 ? 20 : 12;
  const durationOffset = version === 1 ? 28 : 20;
  const matrixOffset = version === 1 ? 52 : 40;
  const dimensionsOffset = version === 1 ? 88 : 76;
  if (payload.length < dimensionsOffset + 8) {
    truncated(state, "Track header is truncated before its matrix or dimensions.", box.payloadStart);
    return { id: null, duration: null, dimensions: null, transformation: null };
  }
  const id = uint32(payload, trackIdOffset);
  const duration = version === 1 ? uint64(payload, durationOffset) : uint32(payload, durationOffset);
  if (id === 0) invalid(state, "Track header uses reserved track ID zero.", box.payloadStart + trackIdOffset);
  if (version === 1 && duration === null) unsafe(state, "Track duration is outside the safe integer range.", box.payloadStart + durationOffset);
  const widthRaw = uint32(payload, dimensionsOffset);
  const heightRaw = uint32(payload, dimensionsOffset + 4);
  const width = widthRaw / 65536;
  const height = heightRaw / 65536;
  const dimensions = width > 0 && height > 0 && Number.isSafeInteger(width) && Number.isSafeInteger(height) ? { width, height } : null;
  if (widthRaw !== 0 && dimensions === null || heightRaw !== 0 && dimensions === null) invalid(state, "Track header has invalid fixed-point dimensions.", box.payloadStart + dimensionsOffset);
  const matrix: number[] = [];
  for (let index = 0; index < 9; index += 1) {
    const value = fixed16(payload, matrixOffset + index * 4);
    if (value === null) {
      invalid(state, "Track header transformation matrix is truncated.", box.payloadStart + matrixOffset);
      break;
    }
    matrix.push(value);
  }
  const orientation = matrix.length === 9 ? matrixOrientation(matrix) : null;
  return { id: id === 0 ? null : id, duration, dimensions, transformation: matrix.length === 9 ? { matrix, orientation } : null };
}

function matrixOrientation(matrix: readonly number[]): ImageTransform | null {
  const rounded = matrix.map((value) => Math.round(value));
  const [a, b, , c, d] = rounded;
  if (a === 1 && b === 0 && c === 0 && d === 1) return { rotation: 0, mirrored: false };
  if (a === 0 && b === 1 && c === -1 && d === 0) return { rotation: 90, mirrored: false };
  if (a === -1 && b === 0 && c === 0 && d === -1) return { rotation: 180, mirrored: false };
  if (a === 0 && b === -1 && c === 1 && d === 0) return { rotation: 270, mirrored: false };
  if (a === -1 && b === 0 && c === 0 && d === 1) return { rotation: 0, mirrored: true, mirrorAxis: "horizontal" };
  if (a === 1 && b === 0 && c === 0 && d === -1) return { rotation: 0, mirrored: true, mirrorAxis: "vertical" };
  return null;
}

function parseMediaHeader(box: Box, state: SequenceState): { readonly timescale: number | null; readonly duration: number | null; readonly language: string | null } {
  const parsed = parsedFullBox(box, state);
  if (parsed === null) return { timescale: null, duration: null, language: null };
  const { version, payload } = parsed;
  const timescaleOffset = version === 1 ? 20 : 12;
  const durationOffset = version === 1 ? 24 : 16;
  const languageOffset = version === 1 ? 32 : 20;
  if (version !== 0 && version !== 1 || payload.length < languageOffset + 2) {
    invalid(state, "Media header version or length is unsupported.", box.payloadStart);
    return { timescale: null, duration: null, language: null };
  }
  const timescale = uint32(payload, timescaleOffset);
  const duration = version === 1 ? uint64(payload, durationOffset) : uint32(payload, durationOffset);
  if (timescale === 0) invalid(state, "Media header has a zero timescale.", box.payloadStart + timescaleOffset);
  if (version === 1 && duration === null) unsafe(state, "Media duration is outside the safe integer range.", box.payloadStart + durationOffset);
  return { timescale: timescale > 0 ? timescale : null, duration, language: readLanguage(payload, languageOffset) };
}

function parseHandler(box: Box, state: SequenceState): { readonly type: string | null; readonly name: string | null } {
  const parsed = parsedFullBox(box, state);
  if (parsed === null || parsed.payload.length < 24) {
    if (parsed !== null) truncated(state, "Handler reference is truncated before its handler type.", box.payloadStart);
    return { type: null, name: null };
  }
  const type = ascii(parsed.payload, 8);
  const nameBytes = parsed.payload.subarray(24);
  const nul = nameBytes.indexOf(0);
  const selected = nul < 0 ? nameBytes : nameBytes.subarray(0, nul);
  let name: string | null = null;
  try {
    name = new TextDecoder("utf-8", { fatal: true }).decode(selected);
  } catch {
    invalid(state, "Handler name is not valid UTF-8.", box.payloadStart + 24, selected.length);
  }
  return { type: type === "\0\0\0\0" ? null : type, name: name === "" ? null : name };
}

function trackKind(handlerType: string | null): HeifSequenceTrackKind {
  if (handlerType === "pict") return "picture";
  if (handlerType === "auxv") return "auxiliary";
  if (handlerType === "meta" || handlerType === "mdta") return "metadata";
  return "unknown";
}

function parseTrackReferences(box: Box, state: SequenceState): HeifSequenceTrackReference[] {
  const result: HeifSequenceTrackReference[] = [];
  for (const child of children(box, state)) {
    const payloadLength = child.end - child.payloadStart;
    if (payloadLength % 4 !== 0) {
      invalid(state, `Track reference ${child.type} has a non-integral track-ID list.`, child.payloadStart, payloadLength);
      continue;
    }
    const count = payloadLength / 4;
    if (count > state.limits.maxImageDetailRelationships) {
      limited(state, `Track reference ${child.type} exceeds the configured relationship limit.`, child.payloadStart);
      continue;
    }
    const targetTrackIds: number[] = [];
    for (let index = 0; index < count; index += 1) {
      const target = uint32(state.bytes, child.payloadStart + index * 4);
      if (target === 0) invalid(state, `Track reference ${child.type} uses reserved track ID zero.`, child.payloadStart + index * 4);
      else targetTrackIds.push(target);
    }
    result.push({ type: child.type, targetTrackIds, sourceOffset: child.start, byteLength: child.end - child.start });
  }
  return result;
}

function parseEdits(box: Box, state: SequenceState): HeifSequenceEdit[] {
  const result: HeifSequenceEdit[] = [];
  const editList = children(box, state).find(({ type }) => type === "elst");
  if (editList === undefined) return result;
  const parsed = parsedFullBox(editList, state);
  if (parsed === null || parsed.payload.length < 8) return result;
  const { version, payload } = parsed;
  if (version !== 0 && version !== 1) {
    invalid(state, "Edit-list version is unsupported.", editList.payloadStart);
    return result;
  }
  const count = uint32(payload, 4);
  if (count > state.limits.maxIfdEntries) {
    limited(state, "Edit-list entry count exceeds the configured limit.", editList.payloadStart + 4);
  }
  const retained = Math.min(count, state.limits.maxIfdEntries);
  const entryBytes = version === 1 ? 20 : 12;
  const expected = safeAdd(8, safeMultiply(count, entryBytes) ?? Number.MAX_SAFE_INTEGER);
  if (expected === null || expected > payload.length) {
    truncated(state, "Edit-list entries extend beyond the box.", editList.payloadStart, editList.end - editList.payloadStart);
  }
  let cursor = 8;
  for (let index = 0; index < retained; index += 1) {
    if (cursor > payload.length - entryBytes) break;
    const segmentDuration = version === 1 ? uint64(payload, cursor) : uint32(payload, cursor);
    const mediaTime = version === 1 ? int64(payload, cursor + 8) : int32(payload, cursor + 4);
    if (segmentDuration === null) {
      unsafe(state, "Edit-list segment duration is outside the safe integer range.", editList.payloadStart + cursor);
    }
    if (mediaTime === null) unsafe(state, "Edit-list media time is outside the safe integer range.", editList.payloadStart + cursor + (version === 1 ? 8 : 4));
    const rateOffset = version === 1 ? cursor + 16 : cursor + 8;
    const mediaRate = fixed16(payload, rateOffset);
    result.push({ segmentDuration: segmentDuration ?? 0, mediaTime, mediaRate, sourceOffset: editList.payloadStart + cursor, byteLength: entryBytes });
    cursor += entryBytes;
  }
  return result;
}

function parseSampleDescriptionEntry(box: Box, index: number, state: SequenceState): HeifSequenceSampleDescription {
  const payloadLength = box.end - box.start;
  let dataReferenceIndex: number | null = null;
  let dimensions: ImageDimensions | null = null;
  const visualStart = box.start + 32;
  if (payloadLength >= 16) {
    const rawDataReferenceIndex = uint16(state.bytes, box.start + 14);
    dataReferenceIndex = rawDataReferenceIndex || null;
    if (rawDataReferenceIndex === 0) invalid(state, "Sample entry uses reserved data-reference index zero.", box.start + 14);
  }
  if (payloadLength >= 36) {
    const width = uint16(state.bytes, box.start + 32);
    const height = uint16(state.bytes, box.start + 34);
    if (width > 0 && height > 0) dimensions = { width, height };
  }
  const codecConfigurationTypes: string[] = [];
  if (dimensions !== null && visualStart + 54 <= box.end) {
    let cursor = box.start + 86;
    while (cursor < box.end) {
      if (state.boxes.remaining <= 0) {
        limited(state, "Sample-entry child box count exceeds the configured limit.", cursor);
        break;
      }
      state.boxes.remaining -= 1;
      if (cursor > box.end - 8) {
        truncated(state, "Visual sample-entry child box is truncated.", cursor);
        break;
      }
      const child = parseBox(state.bytes, cursor, box.end, state);
      if (child === null) break;
      codecConfigurationTypes.push(child.type);
      cursor = child.end;
    }
  }
  return { index, format: ascii(state.bytes, box.start + 4), dataReferenceIndex, dimensions, codecConfigurationTypes, sourceOffset: box.start, byteLength: box.end - box.start };
}

function parseSampleDescriptions(box: Box, track: MutableTrack, state: SequenceState): void {
  const parsed = parsedFullBox(box, state);
  if (parsed === null || parsed.payload.length < 8) return;
  const count = uint32(parsed.payload, 4);
  if (count > state.limits.maxIfdEntries) limited(state, "Sample-description count exceeds the configured limit.", box.payloadStart + 4);
  const retained = Math.min(count, state.limits.maxIfdEntries);
  let cursor = box.payloadStart + 8;
  for (let index = 1; index <= retained; index += 1) {
    if (state.boxes.remaining <= 0) {
      limited(state, "Sample-description box count exceeds the configured limit.", cursor);
      break;
    }
    state.boxes.remaining -= 1;
    const entry = parseBox(state.bytes, cursor, box.end, state);
    if (entry === null) break;
    if (entry.end <= cursor || entry.end > box.end) break;
    track.sampleDescriptions.push(parseSampleDescriptionEntry(entry, index, state));
    cursor = entry.end;
  }
  if (cursor !== box.end && count <= state.limits.maxIfdEntries) invalid(state, "Sample-description entries do not consume the complete stsd box.", cursor);
}

function parseRuns(box: Box, state: SequenceState, signedValue: boolean): TimingRun[] {
  const parsed = parsedFullBox(box, state);
  if (parsed === null || parsed.payload.length < 8) return [];
  const count = uint32(parsed.payload, 4);
  if (count > state.limits.maxIfdEntries) limited(state, `${box.type} entry count exceeds the configured limit.`, box.payloadStart + 4);
  const retained = Math.min(count, state.limits.maxIfdEntries);
  const result: TimingRun[] = [];
  let cursor = 8;
  for (let index = 0; index < retained; index += 1) {
    if (cursor > parsed.payload.length - 8) {
      truncated(state, `${box.type} entry table is truncated.`, box.payloadStart + cursor);
      break;
    }
    const countValue = uint32(parsed.payload, cursor);
    const value = signedValue ? int32(parsed.payload, cursor + 4) : uint32(parsed.payload, cursor + 4);
    result.push({ count: countValue, value });
    cursor += 8;
  }
  if (count <= state.limits.maxIfdEntries && cursor !== parsed.payload.length) invalid(state, `${box.type} has trailing bytes after its entry table.`, box.payloadStart + cursor);
  return result;
}

function expandRuns(runs: readonly TimingRun[], max: number, state: SequenceState, label: string): number[] {
  const values: number[] = [];
  for (const run of runs) {
    if (run.count === 0) {
      invalid(state, `${label} contains a zero-count run.`, 0);
      continue;
    }
    for (let index = 0; index < run.count; index += 1) {
      if (values.length >= max) {
        limited(state, `${label} expands beyond the configured sample limit.`, 0);
        return values;
      }
      values.push(run.value);
    }
  }
  return values;
}

function parseChunkMap(box: Box, state: SequenceState): ChunkMapEntry[] {
  const parsed = parsedFullBox(box, state);
  if (parsed === null || parsed.payload.length < 8) return [];
  const count = uint32(parsed.payload, 4);
  if (count > state.limits.maxIfdEntries) limited(state, "Sample-to-chunk entry count exceeds the configured limit.", box.payloadStart + 4);
  const retained = Math.min(count, state.limits.maxIfdEntries);
  const result: ChunkMapEntry[] = [];
  let cursor = 8;
  let previous = 0;
  for (let index = 0; index < retained; index += 1) {
    if (cursor > parsed.payload.length - 12) {
      truncated(state, "Sample-to-chunk table is truncated.", box.payloadStart + cursor);
      break;
    }
    const firstChunk = uint32(parsed.payload, cursor);
    const samplesPerChunk = uint32(parsed.payload, cursor + 4);
    const descriptionIndex = uint32(parsed.payload, cursor + 8);
    if (firstChunk === 0 || firstChunk <= previous || samplesPerChunk === 0 || descriptionIndex === 0) invalid(state, "Sample-to-chunk table contains an invalid entry.", box.payloadStart + cursor);
    previous = firstChunk;
    result.push({ firstChunk, samplesPerChunk, descriptionIndex });
    cursor += 12;
  }
  if (count <= state.limits.maxIfdEntries && cursor !== parsed.payload.length) invalid(state, "Sample-to-chunk table has trailing bytes.", box.payloadStart + cursor);
  return result;
}

function parseChunkOffsets(box: Box, state: SequenceState): number[] {
  const parsed = parsedFullBox(box, state);
  if (parsed === null || parsed.payload.length < 8) return [];
  const count = uint32(parsed.payload, 4);
  if (count > state.limits.maxIfdEntries) limited(state, "Chunk-offset entry count exceeds the configured limit.", box.payloadStart + 4);
  const retained = Math.min(count, state.limits.maxIfdEntries);
  const width = box.type === "co64" ? 8 : 4;
  const result: number[] = [];
  let cursor = 8;
  for (let index = 0; index < retained; index += 1) {
    if (cursor > parsed.payload.length - width) {
      truncated(state, "Chunk-offset table is truncated.", box.payloadStart + cursor);
      break;
    }
    const value = width === 8 ? uint64(parsed.payload, cursor) : uint32(parsed.payload, cursor);
    if (value === null) unsafe(state, "Chunk offset is outside the safe integer range.", box.payloadStart + cursor);
    else result.push(value);
    cursor += width;
  }
  if (count <= state.limits.maxIfdEntries && cursor !== parsed.payload.length) invalid(state, "Chunk-offset table has trailing bytes.", box.payloadStart + cursor);
  return result;
}

function parseSampleSizes(box: Box, state: SequenceState): { readonly sizes: number[]; readonly sampleCount: number } {
  const parsed = parsedFullBox(box, state);
  if (parsed === null || parsed.payload.length < 12) return { sizes: [], sampleCount: 0 };
  const sampleSize = uint32(parsed.payload, 4);
  const sampleCount = uint32(parsed.payload, 8);
  if (sampleCount > state.limits.maxImageDetailFrames) limited(state, "Sample count exceeds the configured limit.", box.payloadStart + 8);
  const retained = Math.min(sampleCount, state.limits.maxImageDetailFrames);
  if (sampleSize !== 0) {
    if (parsed.payload.length !== 12) invalid(state, "Fixed-size sample table has trailing bytes.", box.payloadStart + 12);
    return { sizes: Array.from({ length: retained }, () => sampleSize), sampleCount };
  }
  const sizes: number[] = [];
  let cursor = 12;
  for (let index = 0; index < retained; index += 1) {
    if (cursor > parsed.payload.length - 4) {
      truncated(state, "Variable sample-size table is truncated.", box.payloadStart + cursor);
      break;
    }
    sizes.push(uint32(parsed.payload, cursor));
    cursor += 4;
  }
  if (sampleCount <= state.limits.maxImageDetailFrames && cursor !== parsed.payload.length) invalid(state, "Sample-size table has trailing bytes.", box.payloadStart + cursor);
  return { sizes, sampleCount };
}

function parseSyncSamples(box: Box, state: SequenceState): Set<number> {
  const parsed = parsedFullBox(box, state);
  const result = new Set<number>();
  if (parsed === null || parsed.payload.length < 8) return result;
  const count = uint32(parsed.payload, 4);
  if (count > state.limits.maxImageDetailFrames) limited(state, "Sync-sample count exceeds the configured limit.", box.payloadStart + 4);
  const retained = Math.min(count, state.limits.maxImageDetailFrames);
  let cursor = 8;
  for (let index = 0; index < retained; index += 1) {
    if (cursor > parsed.payload.length - 4) {
      truncated(state, "Sync-sample table is truncated.", box.payloadStart + cursor);
      break;
    }
    const sample = uint32(parsed.payload, cursor);
    if (sample === 0) invalid(state, "Sync-sample table uses reserved sample number zero.", box.payloadStart + cursor);
    else result.add(sample);
    cursor += 4;
  }
  return result;
}

function sampleDescriptionForChunk(chunk: number, map: readonly ChunkMapEntry[]): number | null {
  let selected: ChunkMapEntry | undefined;
  for (const candidate of map) {
    if (candidate.firstChunk <= chunk) selected = candidate;
    else break;
  }
  if (selected === undefined) return null;
  return selected.descriptionIndex;
}

function buildUnfragmentedSamples(track: MutableTrack, stbl: Box, state: SequenceState): void {
  const boxes = children(stbl, state);
  const stts = boxes.find(({ type }) => type === "stts");
  const ctts = boxes.find(({ type }) => type === "ctts");
  const stsc = boxes.find(({ type }) => type === "stsc");
  const stsz = boxes.find(({ type }) => type === "stsz" || type === "stz2");
  const offsetsBox = boxes.find(({ type }) => type === "stco" || type === "co64");
  const stss = boxes.find(({ type }) => type === "stss");
  if (stsz === undefined) {
    invalid(state, "Track sample table has no stsz/stz2 box.", stbl.start);
    return;
  }
  const sampleData = stsz.type === "stsz" ? parseSampleSizes(stsz, state) : parseCompactSampleSizes(stsz, state);
  const sampleCount = Math.min(sampleData.sampleCount, state.limits.maxImageDetailFrames);
  const durations = stts === undefined ? [] : expandRuns(parseRuns(stts, state, false), sampleCount, state, "stts");
  const compositionOffsets = ctts === undefined ? [] : expandRuns(parseRuns(ctts, state, (cttsPayloadVersion(ctts, state) === 1)), sampleCount, state, "ctts");
  const chunkMap = stsc === undefined ? [] : parseChunkMap(stsc, state);
  const chunkOffsets = offsetsBox === undefined ? [] : parseChunkOffsets(offsetsBox, state);
  const syncSamples = stss === undefined ? null : parseSyncSamples(stss, state);
  if (stts === undefined && sampleCount > 0) invalid(state, "Track sample table has no stts timing box.", stbl.start);
  if (stsc === undefined && sampleCount > 0) invalid(state, "Track sample table has no stsc sample-to-chunk box.", stbl.start);
  if (offsetsBox === undefined && sampleCount > 0) invalid(state, "Track sample table has no stco/co64 chunk-offset box.", stbl.start);
  if (durations.length < sampleCount) invalid(state, "Track stts timing does not cover every sample.", stbl.start);
  const chunkSampleOffsets = new Map<number, number>();
  let sampleCursor = 0;
  for (let chunk = 1; chunk <= chunkOffsets.length && sampleCursor < sampleCount; chunk += 1) {
    let samplesPerChunk = 0;
    for (const entry of chunkMap) {
      if (entry.firstChunk > chunk) break;
      samplesPerChunk = entry.samplesPerChunk;
    }
    if (samplesPerChunk === 0) continue;
    for (let local = 0; local < samplesPerChunk && sampleCursor < sampleCount; local += 1) {
      chunkSampleOffsets.set(sampleCursor, chunk);
      sampleCursor += 1;
    }
  }
  if (sampleCursor < sampleCount) invalid(state, "Sample-to-chunk mapping does not cover every sample.", stbl.start);
  let decodeTime = 0;
  for (let index = 0; index < sampleCount; index += 1) {
    const size = sampleData.sizes[index] ?? null;
    const duration = durations[index] ?? null;
    const offset = sampleOffset(index, size, chunkSampleOffsets, chunkOffsets, sampleData.sizes, state);
    const compositionOffset = compositionOffsets[index] ?? 0;
    const compositionTime = decodeTimeFor(decodeTime, compositionOffset);
    const descriptionIndex = sampleDescriptionForChunk(chunkSampleOffsets.get(index) ?? 0, chunkMap);
    if (descriptionIndex !== null && !track.sampleDescriptions.some(({ index: candidate }) => candidate === descriptionIndex)) invalid(state, "Sample-to-chunk entry references a missing sample description.", stbl.start);
    track.samples.push({ index: index + 1, descriptionIndex, byteLength: size, offset, decodeTime, compositionTime, duration, sync: syncSamples === null ? true : syncSamples.has(index + 1), sourceOffset: stbl.start, sourceByteLength: stbl.end - stbl.start, fragmentOffset: null });
    if (duration !== null) {
      const next = safeAdd(decodeTime, duration);
      if (next === null) {
        unsafe(state, "Sample decode time exceeds the safe integer range.", stbl.start);
        decodeTime = 0;
      } else decodeTime = next;
    }
  }
  if (syncSamples !== null) for (const sample of syncSamples) if (sample > sampleCount) invalid(state, "Sync-sample table references a sample outside stsz.", stbl.start);
}

function cttsPayloadVersion(box: Box, state: SequenceState): number | null {
  const payload = boxPayload(box, state);
  return fullVersion(payload);
}

function parseCompactSampleSizes(box: Box, state: SequenceState): { readonly sizes: number[]; readonly sampleCount: number } {
  const parsed = parsedFullBox(box, state);
  if (parsed === null || parsed.payload.length < 12) return { sizes: [], sampleCount: 0 };
  const fieldSize = parsed.payload[7] ?? 0;
  if (fieldSize !== 4 && fieldSize !== 8 && fieldSize !== 16) {
    invalid(state, "Compact sample-size field width is unsupported.", box.payloadStart + 1);
    return { sizes: [], sampleCount: 0 };
  }
  const sampleCount = uint32(parsed.payload, 8);
  if (sampleCount > state.limits.maxImageDetailFrames) limited(state, "Compact sample count exceeds the configured limit.", box.payloadStart + 8);
  const retained = Math.min(sampleCount, state.limits.maxImageDetailFrames);
  const sizes: number[] = [];
  for (let index = 0; index < retained; index += 1) {
    const byteOffset = fieldSize === 4 ? 12 + Math.floor(index / 2) : fieldSize === 8 ? 12 + index : 12 + index * 2;
    const byteLength = fieldSize === 16 ? 2 : 1;
    if (byteOffset > parsed.payload.length - byteLength) {
      truncated(state, "Compact sample-size table is truncated.", box.payloadStart + byteOffset);
      break;
    }
    if (fieldSize === 4) sizes.push(index % 2 === 0 ? ((parsed.payload[byteOffset] ?? 0) >> 4) & 0x0f : (parsed.payload[byteOffset] ?? 0) & 0x0f);
    else if (fieldSize === 8) sizes.push(parsed.payload[byteOffset] ?? 0);
    else sizes.push(uint16(parsed.payload, byteOffset));
  }
  const expectedBytes = fieldSize === 4 ? Math.ceil(sampleCount / 2) : fieldSize === 8 ? sampleCount : sampleCount * 2;
  if (sampleCount <= state.limits.maxImageDetailFrames && parsed.payload.length !== 12 + expectedBytes) invalid(state, "Compact sample-size table has trailing bytes.", box.payloadStart + Math.min(parsed.payload.length, 12 + expectedBytes));
  return { sizes, sampleCount };
}

function sampleOffset(index: number, size: number | null, chunkForSample: ReadonlyMap<number, number>, chunkOffsets: readonly number[], sizes: readonly number[], state: SequenceState): number | null {
  const chunk = chunkForSample.get(index);
  if (chunk === undefined) return null;
  const base = chunkOffsets[chunk - 1];
  if (base === undefined || size === null) return null;
  let offset = base;
  for (let sample = index - 1; sample >= 0 && chunkForSample.get(sample) === chunk; sample -= 1) {
    const previousSize = sizes[sample];
    if (previousSize === undefined) return null;
    const next = safeAdd(offset, previousSize);
    if (next === null) return null;
    offset = next;
  }
  const end = safeAdd(offset, size);
  if (end === null) return null;
  if (offset > state.bytes.length || end > state.bytes.length) unsafe(state, "Sample data range extends beyond the input.", offset, size);
  return offset;
}

function decodeTimeFor(value: number, offset: number): number | null {
  const result = value + offset;
  return Number.isSafeInteger(result) ? result : null;
}

function parseTrack(trackBox: Box, state: SequenceState): MutableTrack | null {
  const trackHeader = children(trackBox, state).find(({ type }) => type === "tkhd");
  if (trackHeader === undefined) {
    invalid(state, "Track is missing tkhd.", trackBox.start);
    return null;
  }
  const header = parseTrackHeader(trackHeader, state);
  if (header.id === null) return null;
  const track: MutableTrack = {
    id: header.id,
    handlerType: null,
    handlerName: null,
    kind: "unknown",
    timescale: null,
    duration: header.duration,
    language: null,
    dimensions: header.dimensions,
    transformation: header.transformation,
    sampleDescriptions: [],
    samples: [],
    references: [],
    edits: [],
    associatedTrackIds: new Set<number>(),
    metadataTrackIds: new Set<number>(),
    sourceOffset: trackBox.start,
    sourceEnd: trackBox.end,
    complete: true,
  };
  const trackChildren = children(trackBox, state);
  const tref = trackChildren.find(({ type }) => type === "tref");
  if (tref !== undefined) track.references.push(...parseTrackReferences(tref, state));
  const edts = trackChildren.find(({ type }) => type === "edts");
  if (edts !== undefined) track.edits.push(...parseEdits(edts, state));
  const mdia = trackChildren.find(({ type }) => type === "mdia");
  if (mdia === undefined) {
    invalid(state, "Track is missing mdia.", trackBox.start);
    return track;
  }
  const mediaChildren = children(mdia, state);
  const mdhd = mediaChildren.find(({ type }) => type === "mdhd");
  if (mdhd !== undefined) {
    const media = parseMediaHeader(mdhd, state);
    track.timescale = media.timescale;
    track.duration = media.duration ?? track.duration;
    track.language = media.language;
  } else invalid(state, "Track media is missing mdhd.", mdia.start);
  const hdlr = mediaChildren.find(({ type }) => type === "hdlr");
  if (hdlr !== undefined) {
    const handler = parseHandler(hdlr, state);
    track.handlerType = handler.type;
    track.handlerName = handler.name;
    track.kind = trackKind(track.handlerType);
  } else invalid(state, "Track media is missing hdlr.", mdia.start);
  const minf = mediaChildren.find(({ type }) => type === "minf");
  const stbl = minf === undefined ? undefined : children(minf, state).find(({ type }) => type === "stbl");
  if (stbl === undefined) {
    invalid(state, "Track media is missing stbl.", mdia.start);
    return track;
  }
  const stsd = children(stbl, state).find(({ type }) => type === "stsd");
  if (stsd === undefined) invalid(state, "Track sample table is missing stsd.", stbl.start);
  else parseSampleDescriptions(stsd, track, state);
  buildUnfragmentedSamples(track, stbl, state);
  const sampleDimensions = track.sampleDescriptions.map(({ dimensions }) => dimensions).find((value): value is ImageDimensions => value !== null);
  if (track.dimensions === null) track.dimensions = sampleDimensions ?? null;
  else if (sampleDimensions !== undefined && (sampleDimensions.width !== track.dimensions.width || sampleDimensions.height !== track.dimensions.height)) invalid(state, "Track header and sample-description dimensions conflict.", trackBox.start);
  return track;
}

function parseTrex(box: Box, state: SequenceState): Map<number, TrackDefaults> {
  const defaults = new Map<number, TrackDefaults>();
  for (const child of children(box, state)) {
    if (child.type !== "trex") continue;
    const parsed = parsedFullBox(child, state);
    if (parsed === null || parsed.payload.length < 24) {
      truncated(state, "Track-fragment defaults are truncated.", child.payloadStart);
      continue;
    }
    const trackId = uint32(parsed.payload, 4);
    if (trackId === 0) invalid(state, "Track-fragment defaults use reserved track ID zero.", child.payloadStart + 4);
    else defaults.set(trackId, { descriptionIndex: uint32(parsed.payload, 8) || null, duration: uint32(parsed.payload, 12) || null, size: uint32(parsed.payload, 16) || null, flags: uint32(parsed.payload, 20) });
  }
  return defaults;
}

function parseTfhd(box: Box, moof: Box, state: SequenceState, defaults: Map<number, TrackDefaults>): FragmentInfo | null {
  const parsed = parsedFullBox(box, state);
  if (parsed === null || parsed.payload.length < 8) return null;
  const { flags, payload } = parsed;
  const trackId = uint32(payload, 4);
  if (trackId === 0) {
    invalid(state, "Track fragment uses reserved track ID zero.", box.payloadStart + 4);
    return null;
  }
  let cursor = 8;
  let baseOffset: number | null = null;
  if ((flags & 0x000001) !== 0) {
    if (cursor > payload.length - 8) {
      truncated(state, "Track fragment base-data-offset is truncated.", box.payloadStart + cursor);
      return null;
    }
    baseOffset = uint64(payload, cursor);
    if (baseOffset === null) unsafe(state, "Track fragment base-data-offset is outside the safe integer range.", box.payloadStart + cursor);
    cursor += 8;
  }
  let descriptionIndex: number | null = null;
  let duration: number | null = null;
  let size: number | null = null;
  let sampleFlags: number | null = null;
  if ((flags & 0x000002) !== 0) { if (cursor > payload.length - 4) return null; descriptionIndex = uint32(payload, cursor) || null; cursor += 4; }
  if ((flags & 0x000008) !== 0) { if (cursor > payload.length - 4) return null; duration = uint32(payload, cursor); cursor += 4; }
  if ((flags & 0x000010) !== 0) { if (cursor > payload.length - 4) return null; size = uint32(payload, cursor); cursor += 4; }
  if ((flags & 0x000020) !== 0) { if (cursor > payload.length - 4) return null; sampleFlags = uint32(payload, cursor); }
  const trex = defaults.get(trackId) ?? { descriptionIndex: null, duration: null, size: null, flags: null };
  return {
    trackId,
    baseOffset,
    defaultBaseIsMoof: (flags & 0x020000) !== 0,
    defaults: {
      descriptionIndex: descriptionIndex ?? trex.descriptionIndex,
      duration: duration ?? trex.duration,
      size: size ?? trex.size,
      flags: sampleFlags ?? trex.flags,
    },
    decodeTime: null,
    sourceOffset: moof.start,
    sourceEnd: moof.end,
  };
}

function parseTfdt(box: Box, state: SequenceState): number | null {
  const parsed = parsedFullBox(box, state);
  if (parsed === null) return null;
  if (parsed.version === 1) {
    if (parsed.payload.length < 12) { truncated(state, "Track fragment decode time is truncated.", box.payloadStart); return null; }
    const value = uint64(parsed.payload, 4);
    if (value === null) unsafe(state, "Track fragment decode time is outside the safe integer range.", box.payloadStart + 4);
    return value;
  }
  if (parsed.version !== 0 || parsed.payload.length < 8) {
    invalid(state, "Track fragment decode-time version is unsupported.", box.payloadStart);
    return null;
  }
  return uint32(parsed.payload, 4);
}

function addFragmentSamples(track: MutableTrack, traf: Box, moof: Box, defaults: Map<number, TrackDefaults>, state: SequenceState): void {
  const trafChildren = children(traf, state);
  const tfhdBox = trafChildren.find(({ type }) => type === "tfhd");
  if (tfhdBox === undefined) { invalid(state, "Track fragment is missing tfhd.", traf.start); return; }
  const fragment = parseTfhd(tfhdBox, moof, state, defaults);
  if (fragment === null) return;
  const tfdt = trafChildren.find(({ type }) => type === "tfdt");
  let decodeTime: number | null;
  if (tfdt === undefined) {
    const previous = track.samples.at(-1);
    const previousEnd = previous === undefined ? 0 : safeAdd(previous.decodeTime ?? 0, previous.duration ?? 0);
    if (previousEnd === null) {
      unsafe(state, "Fragment decode timeline exceeds the safe integer range.", traf.start);
      decodeTime = null;
    } else decodeTime = previousEnd;
  } else decodeTime = parseTfdt(tfdt, state);
  let dataCursor = fragment.baseOffset ?? (fragment.defaultBaseIsMoof ? moof.start : null);
  let sampleIndex = track.samples.length;
  for (const trun of trafChildren.filter(({ type }) => type === "trun")) {
    const parsed = parsedFullBox(trun, state);
    if (parsed === null || parsed.payload.length < 8) continue;
    const { flags, payload, version } = parsed;
    const sampleCount = uint32(payload, 4);
    if (sampleCount > state.limits.maxImageDetailFrames || sampleIndex + sampleCount > state.limits.maxImageDetailFrames) {
      limited(state, "Fragment sample count exceeds the configured limit.", trun.payloadStart + 4);
    }
    const retained = Math.min(sampleCount, Math.max(0, state.limits.maxImageDetailFrames - sampleIndex));
    let cursor = 8;
    let runDataOffset: number | null = dataCursor;
    if ((flags & 0x000001) !== 0) {
      if (cursor > payload.length - 4) { truncated(state, "Fragment run data offset is truncated.", trun.payloadStart + cursor); break; }
      const resolvedRunDataOffset = dataCursor === null ? null : safeAdd(dataCursor, int32(payload, cursor));
      cursor += 4;
      if (resolvedRunDataOffset === null || resolvedRunDataOffset < 0) {
        runDataOffset = null;
        if (dataCursor !== null) unsafe(state, "Fragment run data offset is outside the safe source range.", trun.payloadStart + cursor - 4);
      } else runDataOffset = resolvedRunDataOffset;
    }
    if (retained > 0 && runDataOffset === null) {
      unsafe(state, "Fragment sample data has no safely resolvable base offset.", trun.start);
      track.complete = false;
    }
    let firstFlags: number | null = null;
    if ((flags & 0x000004) !== 0) {
      if (cursor > payload.length - 4) { truncated(state, "Fragment first-sample-flags field is truncated.", trun.payloadStart + cursor); break; }
      firstFlags = uint32(payload, cursor);
      cursor += 4;
    }
    for (let local = 0; local < retained; local += 1) {
      const duration = (flags & 0x000100) !== 0 ? (cursor <= payload.length - 4 ? uint32(payload, cursor) : null) : fragment.defaults.duration;
      if ((flags & 0x000100) !== 0) cursor += 4;
      const size = (flags & 0x000200) !== 0 ? (cursor <= payload.length - 4 ? uint32(payload, cursor) : null) : fragment.defaults.size;
      if ((flags & 0x000200) !== 0) cursor += 4;
      const sampleFlags = (flags & 0x000400) !== 0
        ? (cursor <= payload.length - 4 ? uint32(payload, cursor) : null)
        : local === 0 && firstFlags !== null ? firstFlags : fragment.defaults.flags;
      if ((flags & 0x000400) !== 0) cursor += 4;
      const compositionOffset = (flags & 0x000800) !== 0 ? (cursor <= payload.length - 4 ? (version === 1 ? int32(payload, cursor) : uint32(payload, cursor)) : null) : 0;
      if ((flags & 0x000800) !== 0) cursor += 4;
      if (duration === null || size === null) invalid(state, "Fragment sample lacks a bounded duration or size.", trun.payloadStart + cursor);
      const sampleOffset = runDataOffset;
      const compositionTime = decodeTime === null || compositionOffset === null ? null : decodeTimeFor(decodeTime, compositionOffset);
      const sync = sampleFlags === null ? null : (sampleFlags & 0x00010000) === 0;
      const sampleDescriptionIndex = fragment.defaults.descriptionIndex;
      track.samples.push({ index: sampleIndex + 1, descriptionIndex: sampleDescriptionIndex, byteLength: size, offset: sampleOffset, decodeTime, compositionTime, duration, sync, sourceOffset: trun.start, sourceByteLength: trun.end - trun.start, fragmentOffset: trun.start });
      sampleIndex += 1;
      if (runDataOffset !== null && size !== null) {
        const next = safeAdd(runDataOffset, size);
        if (next === null) unsafe(state, "Fragment sample data range exceeds the safe integer range.", runDataOffset, size);
        runDataOffset = next;
      }
      if (decodeTime !== null && duration !== null) {
        const next = safeAdd(decodeTime, duration);
        if (next === null) unsafe(state, "Fragment decode timeline exceeds the safe integer range.", trun.start);
        decodeTime = next;
      }
    }
    if (sampleCount > retained) break;
    dataCursor = runDataOffset;
    if (cursor > payload.length) { truncated(state, "Fragment run sample fields extend beyond trun.", trun.payloadStart + cursor); break; }
  }
  track.sourceEnd = Math.max(track.sourceEnd, fragment.sourceEnd);
}

function parseMovie(moov: Box, state: SequenceState, itemGraphs: readonly HeifItemGraph[], movieChildren = children(moov, state)): HeifSequence {
  const movieHeader = movieChildren.find(({ type }) => type === "mvhd");
  const movie = movieHeader === undefined ? { timescale: null, duration: null } : parseMovieHeader(movieHeader, state);
  const tracks: MutableTrack[] = [];
  for (const trackBox of movieChildren.filter(({ type }) => type === "trak")) {
    if (tracks.length >= state.limits.maxIfdEntries) { limited(state, "HEIF/AVIF track count exceeds the configured limit.", trackBox.start); break; }
    const track = parseTrack(trackBox, state);
    if (track === null) continue;
    if (tracks.some(({ id }) => id === track.id)) invalid(state, `Movie contains duplicate track ID ${track.id}.`, trackBox.start);
    else tracks.push(track);
  }
  return buildSequence(moov.start, moov.end, movie.timescale, movie.duration, tracks, false, itemGraphs, state);
}

function parseFragments(moofs: readonly Box[], sequence: HeifSequence, state: SequenceState, defaults: Map<number, TrackDefaults>, itemGraphs: readonly HeifItemGraph[]): HeifSequence {
  const tracks = sequence.tracks.map((track): MutableTrack => ({
    ...track,
    sampleDescriptions: [...track.sampleDescriptions],
    samples: track.samples.map((sample): MutableSample => ({ ...sample })),
    references: [...track.references],
    edits: [...track.edits],
    associatedTrackIds: new Set(track.associatedTrackIds),
    metadataTrackIds: new Set(track.metadataTrackIds),
    sourceEnd: track.sourceOffset + track.byteLength,
  }));
  let end = sequence.sourceOffset + sequence.byteLength;
  for (const moof of moofs) {
    for (const traf of children(moof, state).filter(({ type }) => type === "traf")) {
      const tfhd = children(traf, state).find(({ type }) => type === "tfhd");
      if (tfhd === undefined) continue;
      const parsed = parsedFullBox(tfhd, state);
      const trackId = parsed === null || parsed.payload.length < 8 ? null : uint32(parsed.payload, 4);
      if (trackId === null || trackId === 0) continue;
      let track = tracks.find(({ id }) => id === trackId);
      if (track === undefined) {
        if (tracks.length >= state.limits.maxIfdEntries) { limited(state, "Fragment track count exceeds the configured limit.", tfhd.start); continue; }
        track = {
          id: trackId,
          handlerType: null,
          handlerName: null,
          kind: "unknown",
          timescale: null,
          duration: null,
          language: null,
          dimensions: null,
          transformation: null,
          sampleDescriptions: [],
          samples: [],
          references: [],
          edits: [],
          associatedTrackIds: new Set<number>(),
          metadataTrackIds: new Set<number>(),
          sourceOffset: moof.start,
          sourceEnd: moof.end,
          complete: false,
        };
        tracks.push(track);
      }
      addFragmentSamples(track, traf, moof, defaults, state);
    }
    end = Math.max(end, moof.end);
  }
  return buildSequence(sequence.sourceOffset, end, sequence.timescale, sequence.duration, tracks, true, itemGraphs, state);
}

function buildSequence(sourceOffset: number, sourceEnd: number, timescale: number | null, duration: number | null, tracks: readonly MutableTrack[], fragmented: boolean, itemGraphs: readonly HeifItemGraph[], state: SequenceState): HeifSequence {
  const trackIds = new Set(tracks.map(({ id }) => id));
  const byId = new Map(tracks.map((track) => [track.id, track]));
  for (const track of tracks) {
    for (const reference of track.references) {
      for (const target of reference.targetTrackIds) {
        if (!trackIds.has(target)) invalid(state, `Track ${track.id} references unknown track ${target}.`, reference.sourceOffset);
        else track.associatedTrackIds.add(target);
      }
      if (reference.type === "cdsc" || reference.type === "meta") {
        for (const target of reference.targetTrackIds) {
          if (byId.get(target)?.kind === "metadata") track.metadataTrackIds.add(target);
          else if (track.kind === "metadata" && byId.get(target)?.kind === "picture") byId.get(target)?.metadataTrackIds.add(track.id);
        }
      }
    }
    if (track.sampleDescriptions.length === 0 && track.samples.length > 0) invalid(state, `Track ${track.id} has samples but no sample descriptions.`, track.sourceOffset);
    for (const sample of track.samples) {
      if (sample.descriptionIndex !== null && !track.sampleDescriptions.some(({ index }) => index === sample.descriptionIndex)) invalid(state, `Track ${track.id} sample ${sample.index} references an unknown sample description.`, sample.sourceOffset);
      if (sample.offset !== null && sample.byteLength !== null) {
        const end = safeAdd(sample.offset, sample.byteLength);
        if (sample.offset < 0 || end === null || end > state.bytes.length) unsafe(state, `Track ${track.id} sample ${sample.index} exceeds the input boundary.`, sample.offset, sample.byteLength);
      }
    }
  }
  for (const metadataTrack of tracks.filter(({ kind }) => kind === "metadata")) {
    for (const reference of metadataTrack.references) {
      if (reference.type !== "cdsc" && reference.type !== "meta") continue;
      for (const target of reference.targetTrackIds) {
        const picture = byId.get(target);
        if (picture?.kind === "picture") picture.metadataTrackIds.add(metadataTrack.id);
      }
    }
  }
  const pictureTrackIds = tracks.filter(({ kind }) => kind === "picture").map(({ id }) => id);
  const primaryTrackId = pictureTrackIds.length === 1 ? pictureTrackIds[0] ?? null : null;
  const primarySelection: HeifSequence["primarySelection"] = pictureTrackIds.length === 1 ? "sole-picture-track" : pictureTrackIds.length > 1 ? "ambiguous-picture-tracks" : "no-picture-track";
  const metadataItemIds = itemGraphs.flatMap((graph) => graph.items.filter(({ type }) => type === "Exif" || type === "mime").map(({ id }) => id));
  const metadataAssociations: HeifSequenceMetadataAssociation[] = [];
  for (const graph of itemGraphs) {
    for (const relationship of graph.relationships.filter(({ type }) => type === "describes")) {
      metadataAssociations.push({ relationshipType: relationship.referenceType, sourceItemId: relationship.sourceItemId, targetItemId: relationship.targetItemId, sourceTrackId: null, targetTrackId: null, sourceOffset: relationship.sourceOffset, byteLength: relationship.byteLength, resolved: graph.items.some(({ id }) => id === relationship.sourceItemId) && graph.items.some(({ id }) => id === relationship.targetItemId) });
    }
  }
  for (const track of tracks) {
    for (const reference of track.references) {
      for (const target of reference.targetTrackIds) {
        metadataAssociations.push({ relationshipType: reference.type, sourceItemId: null, targetItemId: null, sourceTrackId: track.id, targetTrackId: target, sourceOffset: reference.sourceOffset, byteLength: reference.byteLength, resolved: trackIds.has(target) });
      }
    }
  }
  const publicTracks = tracks.map((track): HeifSequenceTrack => ({
    id: track.id,
    kind: track.kind,
    handlerType: track.handlerType,
    handlerName: track.handlerName,
    timescale: track.timescale,
    duration: track.duration,
    language: track.language,
    dimensions: track.dimensions,
    transformation: track.transformation,
    sampleDescriptions: track.sampleDescriptions,
    samples: track.samples.map((sample): HeifSequenceSample => ({ ...sample })),
    references: track.references,
    edits: track.edits,
    associatedTrackIds: [...track.associatedTrackIds],
    metadataTrackIds: [...track.metadataTrackIds],
    sourceOffset: track.sourceOffset,
    byteLength: Math.max(0, track.sourceEnd - track.sourceOffset),
    complete: track.complete && !state.warnings.some(({ offset }) => offset !== undefined && offset >= track.sourceOffset && offset < track.sourceEnd),
  }));
  const localFailure = state.warnings.some(({ offset }) => offset === undefined || (offset >= sourceOffset && offset < sourceEnd));
  return {
    sourceOffset,
    byteLength: Math.max(0, sourceEnd - sourceOffset),
    timescale,
    duration,
    fragmented,
    tracks: publicTracks,
    primaryTrackId,
    primaryTrackCandidates: pictureTrackIds,
    primarySelection,
    metadataItemIds: [...new Set(metadataItemIds)],
    metadataAssociations,
    complete: !localFailure,
  };
}

function completeFor(state: SequenceState, sequence: HeifSequence): boolean {
  if (sequence.tracks.length === 0) return false;
  const structuralFailure = state.warnings.some(({ code }) => code === "MALFORMED_HEIF" || code === "TRUNCATED_DATA" || code === "UNSAFE_OFFSET" || code === "LIMIT_EXCEEDED");
  return sequence.complete && !structuralFailure;
}

function parseMovieSequence(moov: Box, moofs: readonly Box[], bytes: Uint8Array, limits: SecurityLimits, itemGraphs: readonly HeifItemGraph[]): { readonly sequence: HeifSequence; readonly warnings: readonly MetadataWarning[] } {
  const state: SequenceState = { warnings: [], limits, bytes, boxes: { remaining: limits.maxSegments }, childrenCache: new Map() };
  const movieChildren = children(moov, state);
  const mvex = movieChildren.find(({ type }) => type === "mvex");
  const defaults = mvex === undefined ? new Map<number, TrackDefaults>() : parseTrex(mvex, state);
  const initial = parseMovie(moov, state, itemGraphs, movieChildren);
  const sequence = moofs.length === 0 ? initial : parseFragments(moofs, initial, state, defaults, itemGraphs);
  const complete = completeFor(state, sequence);
  return { sequence: { ...sequence, complete }, warnings: state.warnings };
}

/** Parse bounded HEIF/AVIF ISO-BMFF movie and fragment sequence structures. */
export function parseHeifSequences(bytes: Uint8Array, limits: SecurityLimits, itemGraphs: readonly HeifItemGraph[] = []): { readonly sequences: readonly HeifSequence[]; readonly warnings: readonly MetadataWarning[] } {
  const scanState: SequenceState = { warnings: [], limits, bytes, boxes: { remaining: limits.maxSegments }, childrenCache: new Map() };
  const boxes = topLevel(bytes, scanState);
  const moovs = boxes.filter(({ type }) => type === "moov");
  const moofs = boxes.filter(({ type }) => type === "moof");
  const sequences: HeifSequence[] = [];
  if (moovs.length > limits.maxIfdEntries) limited(scanState, "Movie count exceeds the configured limit.", moovs[limits.maxIfdEntries]?.start ?? bytes.length);
  const warnings = [...scanState.warnings];
  for (let index = 0; index < Math.min(moovs.length, limits.maxIfdEntries); index += 1) {
    const moov = moovs[index];
    if (moov === undefined) continue;
    const nextMoov = moovs[index + 1];
    const result = parseMovieSequence(moov, moofs.filter(({ start }) => start > moov.start && (nextMoov === undefined || start < nextMoov.start)), bytes, limits, itemGraphs);
    sequences.push(result.sequence);
    warnings.push(...result.warnings.slice(0, Math.max(0, limits.maxWarnings - warnings.length)));
  }
  if (moovs.length === 0 && moofs.length > 0) {
    const first = moofs[0];
    if (first !== undefined) {
      const state: SequenceState = { warnings: [], limits, bytes, boxes: { remaining: limits.maxSegments }, childrenCache: new Map() };
      const empty: HeifSequence = { sourceOffset: first.start, byteLength: bytes.length - first.start, timescale: null, duration: null, fragmented: true, tracks: [], primaryTrackId: null, primaryTrackCandidates: [], primarySelection: "no-picture-track", metadataItemIds: [], metadataAssociations: [], complete: false };
      const sequence = parseFragments(moofs, empty, state, new Map(), itemGraphs);
      addWarning(state, "UNSUPPORTED_STRUCTURE", "Fragmented HEIF/AVIF input has no movie header describing its tracks.", first.start, undefined, "warning");
      sequences.push({ ...sequence, complete: false });
      warnings.push(...state.warnings.slice(0, Math.max(0, limits.maxWarnings - warnings.length)));
    }
  }
  const scanFailure = scanState.warnings.some(({ code }) => code === "MALFORMED_HEIF" || code === "TRUNCATED_DATA" || code === "UNSAFE_OFFSET" || code === "LIMIT_EXCEEDED");
  return { sequences: scanFailure ? sequences.map((sequence) => ({ ...sequence, complete: false })) : sequences, warnings: warnings.slice(0, limits.maxWarnings) };
}
