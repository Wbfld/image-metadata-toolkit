import { describe, expect, it } from "vitest";
import { parseMetadata } from "../src/index.js";
import { toJsonSafeResult } from "../src/adapters.js";
import { parseHeifSequences } from "../src/heif-sequences.js";
import { resolveLimits } from "../src/security/limits.js";
import type { HeifItemGraph } from "../src/types.js";

const text = (value: string): Uint8Array => new TextEncoder().encode(value);

function u16(value: number): Uint8Array {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, false);
  return bytes;
}

function u32(value: number): Uint8Array {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value >>> 0, false);
  return bytes;
}

function i32(value: number): Uint8Array {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setInt32(0, value, false);
  return bytes;
}

function u64(value: number): Uint8Array {
  const bytes = new Uint8Array(8);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, Math.floor(value / 0x100000000), false);
  view.setUint32(4, value >>> 0, false);
  return bytes;
}

function fixed(value: number): Uint8Array {
  return i32(value * 65536);
}

function box(type: string, ...payloads: readonly Uint8Array[]): Uint8Array {
  const payloadLength = payloads.reduce((sum, payload) => sum + payload.length, 0);
  const output = new Uint8Array(8 + payloadLength);
  output.set(u32(output.length), 0);
  output.set(text(type), 4);
  let cursor = 8;
  for (const payload of payloads) {
    output.set(payload, cursor);
    cursor += payload.length;
  }
  return output;
}

function full(version: number, flags: number, ...payloads: readonly Uint8Array[]): Uint8Array {
  return Uint8Array.from([version, flags >> 16 & 0xff, flags >> 8 & 0xff, flags & 0xff, ...payloads.flatMap((payload) => [...payload])]);
}

function ftyp(brand = "heic"): Uint8Array {
  return box("ftyp", Uint8Array.from([...text(brand), ...u32(0), ...text(brand), ...text("mif1")]));
}

function mvhd(timescale = 1000, duration = 3000, version: 0 | 1 = 0): Uint8Array {
  return box("mvhd", full(version, 0, version === 1 ? new Uint8Array(16) : new Uint8Array(8), u32(timescale), ...(version === 1 ? [u64(duration)] : [u32(duration)]), new Uint8Array(80)));
}

function tkhd(id: number, width: number, height: number, duration = 3000, matrix: readonly number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1], version = 0): Uint8Array {
  const payload = new Uint8Array(version === 1 ? 96 : 84);
  payload.set([version, 0, 0, 7], 0);
  payload.set(u32(id), version === 1 ? 20 : 12);
  if (version === 1) payload.set(u64(duration), 28);
  else payload.set(u32(duration), 20);
  const matrixOffset = version === 1 ? 52 : 40;
  const dimensionsOffset = version === 1 ? 88 : 76;
  matrix.forEach((value, index) => payload.set(fixed(value), matrixOffset + index * 4));
  payload.set(fixed(width), dimensionsOffset);
  payload.set(fixed(height), dimensionsOffset + 4);
  return box("tkhd", payload);
}

function mdhd(timescale = 1000, duration = 3000, language = "eng", version = 0): Uint8Array {
  const packed = ((language.charCodeAt(0) - 0x60) << 10) | ((language.charCodeAt(1) - 0x60) << 5) | (language.charCodeAt(2) - 0x60);
  return box("mdhd", full(version, 0, version === 1 ? new Uint8Array(16) : new Uint8Array(8), u32(timescale), ...(version === 1 ? [u64(duration)] : [u32(duration)]), u16(packed), u16(0)));
}

function hdlr(handlerType: string, name: string): Uint8Array {
  return box("hdlr", full(0, 0, new Uint8Array(4), text(handlerType), new Uint8Array(12), text(name), Uint8Array.of(0)));
}

function visualSampleEntry(format: string, width: number, height: number): Uint8Array {
  const payload = new Uint8Array(78);
  payload.set(new Uint8Array(6), 0);
  payload.set(u16(1), 6);
  payload.set(u16(width), 24);
  payload.set(u16(height), 26);
  payload.set(u32(0x00480000), 28);
  payload.set(u32(0x00480000), 32);
  payload.set(u16(1), 40);
  payload.set(u16(0x0018), 72);
  payload.set(u16(0xffff), 76);
  return box(format, payload);
}

function metadataSampleEntry(format = "mett"): Uint8Array {
  const payload = new Uint8Array(8);
  payload.set(u16(1), 6);
  return box(format, payload);
}

function stsd(entry: Uint8Array): Uint8Array {
  return box("stsd", full(0, 0, u32(1), entry));
}

function stts(sampleCount: number, duration: number): Uint8Array {
  return box("stts", full(0, 0, u32(1), u32(sampleCount), u32(duration)));
}

function ctts(sampleCount: number, offset: number): Uint8Array {
  return box("ctts", full(1, 0, u32(1), u32(sampleCount), i32(offset)));
}

function stsc(sampleCount: number): Uint8Array {
  return box("stsc", full(0, 0, u32(1), u32(1), u32(sampleCount), u32(1)));
}

function stsz(sizes: readonly number[]): Uint8Array {
  return box("stsz", full(0, 0, u32(0), u32(sizes.length), ...sizes.map(u32)));
}

function stz2(fieldSize: 4 | 8 | 16, sizes: readonly number[]): Uint8Array {
  const encoded = fieldSize === 4
    ? Uint8Array.from(Array.from({ length: Math.ceil(sizes.length / 2) }, (_, index) => ((sizes[index * 2] ?? 0) << 4) | (sizes[index * 2 + 1] ?? 0)))
    : fieldSize === 8
      ? Uint8Array.from(sizes)
      : new Uint8Array(sizes.flatMap((size) => [...u16(size)]));
  return box("stz2", full(0, 0, new Uint8Array(3), Uint8Array.of(fieldSize), u32(sizes.length), encoded));
}

function stco(offset: number): Uint8Array {
  return box("stco", full(0, 0, u32(1), u32(offset)));
}

function stss(samples: readonly number[]): Uint8Array {
  return box("stss", full(0, 0, u32(samples.length), ...samples.map(u32)));
}

function editList(): Uint8Array {
  return box("edts", box("elst", full(0, 0, u32(1), u32(3000), i32(0), fixed(1))));
}

function trackReference(type: string, targetIds: readonly number[]): Uint8Array {
  return box(type, ...targetIds.map(u32));
}

function track(options: { id: number; handler: string; width?: number; height?: number; sampleSizes: readonly number[]; sampleOffset: number; reference?: Uint8Array; fragmented?: boolean; matrix?: readonly number[]; compactSampleSize?: 4 | 8 | 16; version?: 0 | 1; editList?: Uint8Array }): Uint8Array {
  const width = options.width ?? 0;
  const height = options.height ?? 0;
  const entry = options.handler === "pict" ? visualSampleEntry("av01", width, height) : metadataSampleEntry();
  const sampleTable = options.fragmented
    ? box("stbl", stsd(entry), stsz([]))
    : box("stbl", stsd(entry), stts(options.sampleSizes.length, 1000), ctts(options.sampleSizes.length, -100), stsc(options.sampleSizes.length), options.compactSampleSize === undefined ? stsz(options.sampleSizes) : stz2(options.compactSampleSize, options.sampleSizes), stco(options.sampleOffset), stss([1, options.sampleSizes.length]));
  const media = box("mdia", mdhd(1000, options.sampleSizes.length * 1000, "eng", options.version ?? 0), hdlr(options.handler, options.handler === "pict" ? "picture sequence" : "metadata sequence"), box("minf", sampleTable));
  return box("trak", tkhd(options.id, width, height, options.sampleSizes.length * 1000, options.matrix, options.version ?? 0), options.reference === undefined ? new Uint8Array(0) : box("tref", options.reference), options.editList ?? new Uint8Array(0), media);
}

function trex(trackId: number, size: number, duration: number): Uint8Array {
  return box("trex", full(0, 0, u32(trackId), u32(1), u32(duration), u32(size), u32(0)));
}

function tfhd(trackId: number, size: number, duration: number, defaultBaseIsMoof = true): Uint8Array {
  const flags = (defaultBaseIsMoof ? 0x020000 : 0) | 0x000002 | 0x000008 | 0x000010;
  return box("tfhd", full(0, flags, u32(trackId), u32(1), u32(duration), u32(size)));
}

function tfdt(value: number): Uint8Array {
  return box("tfdt", full(0, 0, u32(value)));
}

function trun(samples: readonly { readonly size: number; readonly duration: number; readonly flags: number; readonly offset: number }[], dataOffset: number): Uint8Array {
  const flags = 0x000001 | 0x000100 | 0x000200 | 0x000400 | 0x000800;
  return box("trun", full(1, flags, u32(samples.length), i32(dataOffset), ...samples.flatMap((sample) => [u32(sample.duration), u32(sample.size), u32(sample.flags), i32(sample.offset)])));
}

function fragmentedMovie(trackId: number, sampleSizes: readonly number[], defaultBaseIsMoof = true, dataOffsetAdjustment = 0): { readonly movie: Uint8Array; readonly media: Uint8Array } {
  const movie = box("moov", mvhd(), box("trak", tkhd(trackId, 320, 240, 3000), box("mdia", mdhd(), hdlr("pict", "fragmented picture"), box("minf", box("stbl", stsd(visualSampleEntry("av01", 320, 240)), stsz([]))))), box("mvex", trex(trackId, sampleSizes[0] ?? 0, 1000)));
  const samples = sampleSizes.map((size, index) => ({ size, duration: 1000, flags: index === 0 ? 0 : 0x00010000, offset: index === 0 ? 0 : 10 }));
  const provisionalMoof = box("moof", box("traf", tfhd(trackId, sampleSizes[0] ?? 0, 1000, defaultBaseIsMoof), tfdt(0), trun(samples, 0)));
  const moof = box("moof", box("traf", tfhd(trackId, sampleSizes[0] ?? 0, 1000, defaultBaseIsMoof), tfdt(0), trun(samples, provisionalMoof.length + 8 + dataOffsetAdjustment)));
  const media = Uint8Array.from(Array.from({ length: sampleSizes.reduce((sum, size) => sum + size, 0) }, (_, index) => index & 0xff));
  return { movie: Uint8Array.from([...movie, ...moof]), media: box("mdat", media) };
}

function sequenceFixture(options: { readonly brand?: string; readonly pictureTracks?: number; readonly fragmented?: boolean; readonly unsafeOffset?: boolean; readonly unresolvedFragmentOffset?: boolean; readonly fragmentDataOffsetAdjustment?: number; readonly duplicateTrackId?: boolean; readonly compactSampleSize?: 4 | 8 | 16; readonly version?: 0 | 1; readonly matrix?: readonly number[]; readonly edits?: boolean } = {}): Uint8Array {
  if (options.fragmented) {
    const parts = fragmentedMovie(1, [5, 5], !options.unresolvedFragmentOffset, options.fragmentDataOffsetAdjustment ?? 0);
    return Uint8Array.from([...ftyp(options.brand ?? "heic"), ...parts.movie, ...parts.media]);
  }
  const pictureTrackCount = options.pictureTracks ?? 1;
  const sampleData = Uint8Array.from({ length: pictureTrackCount * 15 + 3 }, (_, index) => index + 1);
  const sizingTracks = Array.from({ length: pictureTrackCount }, (_, index) => track({ id: options.duplicateTrackId ? 1 : index + 1, handler: "pict", width: 320 + index, height: 240, sampleSizes: [4, 5, 6], sampleOffset: 0, ...(options.compactSampleSize === undefined ? {} : { compactSampleSize: options.compactSampleSize }), ...(options.version === undefined ? {} : { version: options.version }), ...(options.edits && index === 0 ? { editList: editList() } : {}), ...(index === 0 ? { matrix: options.matrix ?? [0, 1, 0, -1, 0, 0, 0, 0, 1] } : {}) }));
  const metadataTrackId = pictureTrackCount + 1;
  const metadataTrack = track({ id: metadataTrackId, handler: "meta", sampleSizes: [3], sampleOffset: 0, reference: trackReference("cdsc", [pictureTrackCount === 1 ? 1 : 2]), ...(options.version === undefined ? {} : { version: options.version }) });
  const movieWithoutOffsets = box("moov", mvhd(1000, 3000, options.version ?? 0), ...sizingTracks, metadataTrack);
  const firstPayloadOffset = ftyp(options.brand ?? "heic").length + movieWithoutOffsets.length + 8;
  let cursor = firstPayloadOffset;
  const pictureTracks = Array.from({ length: pictureTrackCount }, (_, index) => {
    const sizes = [4, 5, 6];
    const value = track({ id: options.duplicateTrackId ? 1 : index + 1, handler: "pict", width: 320 + index, height: 240, sampleSizes: sizes, sampleOffset: options.unsafeOffset ? 0xfffffff0 : cursor, ...(options.compactSampleSize === undefined ? {} : { compactSampleSize: options.compactSampleSize }), ...(options.version === undefined ? {} : { version: options.version }), ...(options.edits && index === 0 ? { editList: editList() } : {}), ...(index === 0 ? { matrix: options.matrix ?? [0, 1, 0, -1, 0, 0, 0, 0, 1] } : {}) });
    cursor += sizes.reduce((sum, size) => sum + size, 0);
    return value;
  });
  const metadata = track({ id: metadataTrackId, handler: "meta", sampleSizes: [3], sampleOffset: options.unsafeOffset ? 0xfffffff0 : cursor, reference: trackReference("cdsc", [pictureTrackCount === 1 ? 1 : 2]), ...(options.version === undefined ? {} : { version: options.version }) });
  const movie = box("moov", mvhd(1000, 3000, options.version ?? 0), ...pictureTracks, metadata);
  return Uint8Array.from([...ftyp(options.brand ?? "heic"), ...movie, ...box("mdat", sampleData)]);
}

function replaceBoxType(bytes: Uint8Array, from: string, to: string, occurrence = 0): Uint8Array {
  const output = bytes.slice();
  const source = text(from);
  const target = text(to);
  let seen = 0;
  for (let index = 0; index <= output.length - 8; index += 1) {
    if (!source.every((value, offset) => output[index + 4 + offset] === value)) continue;
    if (seen === occurrence) { output.set(target, index + 4); return output; }
    seen += 1;
  }
  throw new Error(`Fixture box ${from} occurrence ${occurrence} was not found`);
}

function setBoxPayloadU32(bytes: Uint8Array, type: string, relativeOffset: number, value: number, occurrence = 0): Uint8Array {
  const output = bytes.slice();
  const start = (() => {
    const source = text(type);
    let seen = 0;
    for (let index = 0; index <= output.length - 8; index += 1) {
      if (!source.every((item, offset) => output[index + 4 + offset] === item)) continue;
      if (seen === occurrence) return index;
      seen += 1;
    }
    return -1;
  })();
  if (start < 0 || start + 8 + relativeOffset + 4 > output.length) throw new Error(`Fixture box ${type} occurrence ${occurrence} was not found`);
  output.set(u32(value), start + 8 + relativeOffset);
  return output;
}

function setByteInBox(bytes: Uint8Array, type: string, relativeOffset: number, value: number, occurrence = 0): Uint8Array {
  const output = bytes.slice();
  const source = text(type);
  let seen = 0;
  for (let index = 0; index <= output.length - 8; index += 1) {
    if (!source.every((item, offset) => output[index + 4 + offset] === item)) continue;
    if (seen === occurrence) {
      if (index + 8 + relativeOffset >= output.length) throw new Error(`Fixture byte offset for ${type} is out of bounds`);
      output[index + 8 + relativeOffset] = value;
      return output;
    }
    seen += 1;
  }
  throw new Error(`Fixture box ${type} occurrence ${occurrence} was not found`);
}

function setBoxSize(bytes: Uint8Array, type: string, size: number, occurrence = 0): Uint8Array {
  const output = bytes.slice();
  const source = text(type);
  let seen = 0;
  for (let index = 0; index <= output.length - 8; index += 1) {
    if (!source.every((item, offset) => output[index + 4 + offset] === item)) continue;
    if (seen === occurrence) { output.set(u32(size), index); return output; }
    seen += 1;
  }
  throw new Error(`Fixture box ${type} occurrence ${occurrence} was not found`);
}

function warningCodes(bytes: Uint8Array): Set<string> {
  return new Set(parseHeifSequences(bytes, resolveLimits()).warnings.map(({ code }) => code));
}

function itemGraph(): HeifItemGraph {
  return {
    metaOffset: 1,
    primaryItemId: 1,
    items: [
      { id: 1, type: "av01", name: "", contentType: null, contentEncoding: null, hidden: false, location: null, properties: [], dimensions: { width: 320, height: 240 }, roles: ["primary"] },
      { id: 4, type: "mime", name: "", contentType: "application/rdf+xml", contentEncoding: null, hidden: false, location: null, properties: [], dimensions: null, roles: ["metadata"] },
    ],
    properties: [],
    dataReferences: [],
    relationships: [{ type: "describes", referenceType: "cdsc", sourceItemId: 4, targetItemId: 1, order: 0, sourceOffset: 20, byteLength: 16 }],
    complete: true,
  };
}

describe("B03 HEIF/AVIF sequences and multi-image results", () => {
  it("retains independent picture tracks, samples, timing, transformations, and primary selection", async () => {
    const result = await parseMetadata(sequenceFixture());
    const sequence = result.heifSequences?.[0];
    expect(result.format).toBe("heif");
    expect(result.dimensions).toEqual({ width: 320, height: 240 });
    expect(sequence).toMatchObject({ fragmented: false, timescale: 1000, duration: 3000, primaryTrackId: 1, primaryTrackCandidates: [1], primarySelection: "sole-picture-track" });
    expect(sequence?.tracks).toHaveLength(2);
    expect(sequence?.tracks[0]).toMatchObject({ id: 1, kind: "picture", handlerType: "pict", timescale: 1000, duration: 3000, dimensions: { width: 320, height: 240 } });
    expect(sequence?.tracks[0]?.transformation).toMatchObject({ orientation: { rotation: 90, mirrored: false } });
    expect(sequence?.tracks[0]?.samples).toMatchObject([
      { index: 1, byteLength: 4, decodeTime: 0, compositionTime: -100, duration: 1000, sync: true },
      { index: 2, byteLength: 5, decodeTime: 1000, compositionTime: 900, duration: 1000, sync: false },
      { index: 3, byteLength: 6, decodeTime: 2000, compositionTime: 1900, duration: 1000, sync: true },
    ]);
    expect(sequence?.tracks[0]?.metadataTrackIds).toEqual([2]);
    expect(sequence?.tracks[1]?.metadataTrackIds).toEqual([]);
    expect(sequence?.metadataAssociations).toEqual(expect.arrayContaining([expect.objectContaining({ relationshipType: "cdsc", sourceTrackId: 2, targetTrackId: 1, resolved: true })]));
    expect(result.details?.animation).toContainEqual(expect.objectContaining({ value: { frames: 3, loopCount: null } }));

    const avif = await parseMetadata(sequenceFixture({ brand: "avif" }));
    expect(avif.format).toBe("avif");
    expect(avif.heifSequences?.[0]?.primaryTrackId).toBe(1);
  });

  it("keeps multiple picture tracks as an explicit collection and refuses ambiguous primary selection", async () => {
    const result = await parseMetadata(sequenceFixture({ pictureTracks: 2 }));
    const sequence = result.heifSequences?.[0];
    expect(sequence?.tracks.filter(({ kind }) => kind === "picture")).toHaveLength(2);
    expect(sequence).toMatchObject({ primaryTrackId: null, primaryTrackCandidates: [1, 2], primarySelection: "ambiguous-picture-tracks" });
    expect(result.dimensions).toBeNull();
    expect(result.details?.primaryImageId).toBeNull();
  });

  it("parses fragmented samples and preserves fragment provenance without decoding payloads", async () => {
    const fixture = sequenceFixture({ fragmented: true });
    const result = await parseMetadata(fixture);
    const track = result.heifSequences?.[0]?.tracks[0];
    expect(result.dimensions).toEqual({ width: 320, height: 240 });
    expect(result.heifSequences?.[0]).toMatchObject({ fragmented: true, primaryTrackId: 1, primarySelection: "sole-picture-track" });
    expect(track?.samples).toHaveLength(2);
    expect(track?.samples[0]).toMatchObject({ byteLength: 5, decodeTime: 0, duration: 1000, sync: true });
    expect(typeof track?.samples[0]?.offset).toBe("number");
    expect(typeof track?.samples[0]?.fragmentOffset).toBe("number");
    expect(track?.samples[1]).toMatchObject({ byteLength: 5, decodeTime: 1000, sync: false });
    expect(track?.samples.every(({ sourceByteLength }) => sourceByteLength > 0)).toBe(true);

    const signedOffset = await parseMetadata(sequenceFixture({ fragmented: true, fragmentDataOffsetAdjustment: -1 }));
    expect(signedOffset.heifSequences?.[0]?.complete).toBe(true);
    expect(signedOffset.heifSequences?.[0]?.tracks[0]?.samples[0]?.offset).not.toBeNull();
    expect(signedOffset.warnings).toEqual([]);

    const negativeSourceOffset = await parseMetadata(sequenceFixture({ fragmented: true, fragmentDataOffsetAdjustment: -0x7fffffff }));
    expect(negativeSourceOffset.heifSequences?.[0]?.complete).toBe(false);
    expect(negativeSourceOffset.heifSequences?.[0]?.tracks[0]?.samples[0]?.offset).toBeNull();
    expect(negativeSourceOffset.warnings).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));
  });

  it("retains item metadata associations separately from track references", () => {
    const parsed = parseHeifSequences(sequenceFixture(), resolveLimits(), [itemGraph()]);
    const sequence = parsed.sequences[0];
    expect(sequence?.metadataItemIds).toEqual([4]);
    expect(sequence?.metadataAssociations).toEqual(expect.arrayContaining([
      expect.objectContaining({ relationshipType: "cdsc", sourceItemId: 4, targetItemId: 1, sourceTrackId: null, targetTrackId: null, resolved: true }),
    ]));
  });

  it("fails closed for duplicate tracks, unsafe sample offsets, missing tables, and sample limits", async () => {
    const duplicate = await parseMetadata(sequenceFixture({ pictureTracks: 2, duplicateTrackId: true }));
    expect(duplicate.heifSequences?.[0]?.complete).toBe(false);
    expect(duplicate.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_HEIF" }));

    const unsafe = await parseMetadata(sequenceFixture({ unsafeOffset: true }));
    expect(unsafe.heifSequences?.[0]?.tracks[0]?.samples[0]?.offset).toBe(0xfffffff0);
    expect(unsafe.warnings).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));
    expect(unsafe.heifSequences?.[0]?.complete).toBe(false);

    const limited = await parseMetadata(sequenceFixture(), { limits: { maxImageDetailFrames: 2 } });
    expect(limited.heifSequences?.[0]?.tracks[0]?.samples).toHaveLength(2);
    expect(limited.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    expect(limited.heifSequences?.[0]?.complete).toBe(false);

    const malformed = sequenceFixture().subarray(0, sequenceFixture().length - 3);
    const malformedResult = await parseMetadata(malformed);
    expect(malformedResult.warnings).toContainEqual(expect.objectContaining({ code: "TRUNCATED_DATA" }));
    expect(malformedResult.heifSequences?.[0]?.complete).toBe(false);
  });

  it("validates compact sample sizes, version-one headers, unresolved fragments, and sequence-aware Blob fallback", async () => {
    for (const fieldSize of [4, 8, 16] as const) {
      const compact = await parseMetadata(sequenceFixture({ compactSampleSize: fieldSize }));
      expect(compact.heifSequences?.[0]?.complete).toBe(true);
      expect(compact.heifSequences?.[0]?.tracks[0]?.samples.map(({ byteLength }) => byteLength)).toEqual([4, 5, 6]);
      expect(compact.warnings).toEqual([]);
    }

    const versionOne = await parseMetadata(sequenceFixture({ version: 1 }));
    expect(versionOne.heifSequences?.[0]).toMatchObject({ timescale: 1000, duration: 3000, primaryTrackId: 1 });
    expect(versionOne.heifSequences?.[0]?.tracks[0]).toMatchObject({ id: 1, duration: 3000, timescale: 1000, language: "eng", dimensions: { width: 320, height: 240 } });
    expect(versionOne.warnings).toEqual([]);

    const unresolvedFragment = await parseMetadata(sequenceFixture({ fragmented: true, unresolvedFragmentOffset: true }));
    expect(unresolvedFragment.heifSequences?.[0]?.complete).toBe(false);
    expect(unresolvedFragment.warnings).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));
    expect(unresolvedFragment.heifSequences?.[0]?.tracks[0]?.samples[0]?.offset).toBeNull();

    const source = sequenceFixture();
    const ranged = await parseMetadata(new Blob([source.buffer as ArrayBuffer]), { scope: "metadata" });
    expect(ranged.heifSequences?.[0]?.complete).toBe(true);
    expect(ranged.completeness.scope).toBe("full");
    expect(ranged.completeness.complete).toBe(true);
  });

  it("retains typed diagnostics for malformed BMFF headers and sequence tables", () => {
    const malformedHeader = Uint8Array.from([...u32(4), ...text("moov")]);
    expect(warningCodes(malformedHeader)).toContain("TRUNCATED_DATA");

    const extendedHeader = Uint8Array.from([...u32(1), ...text("moov")]);
    expect(warningCodes(extendedHeader)).toContain("TRUNCATED_DATA");

    const unsafeExtended = Uint8Array.from([...u32(1), ...text("moov"), ...u32(0x00200000), ...u32(0)]);
    expect(warningCodes(unsafeExtended)).toContain("UNSAFE_OFFSET");

    const zeroSized = Uint8Array.from([...u32(0), ...text("moov"), ...u32(0), ...text("free")]);
    expect(warningCodes(zeroSized)).toEqual(new Set());
    expect(parseHeifSequences(zeroSized, resolveLimits()).sequences[0]).toMatchObject({ sourceOffset: 0, tracks: [], primarySelection: "no-picture-track", complete: false });

    const noMovie = box("moov");
    expect(parseHeifSequences(noMovie, resolveLimits()).sequences[0]).toMatchObject({ tracks: [], primarySelection: "no-picture-track", complete: false });

    const zeroTimescale = setBoxPayloadU32(sequenceFixture(), "mvhd", 12, 0);
    expect(warningCodes(zeroTimescale)).toContain("MALFORMED_HEIF");

    const invalidMovieVersion = setByteInBox(sequenceFixture(), "mvhd", 0, 2);
    expect(warningCodes(invalidMovieVersion)).toContain("MALFORMED_HEIF");

    const invalidTrackVersion = setByteInBox(sequenceFixture(), "tkhd", 0, 2);
    expect(warningCodes(invalidTrackVersion)).toContain("MALFORMED_HEIF");

    const zeroTrackId = setBoxPayloadU32(sequenceFixture(), "tkhd", 12, 0);
    expect(warningCodes(zeroTrackId)).toContain("MALFORMED_HEIF");

    const zeroMediaTimescale = setBoxPayloadU32(sequenceFixture(), "mdhd", 12, 0);
    expect(warningCodes(zeroMediaTimescale)).toContain("MALFORMED_HEIF");

    const invalidLanguage = setByteInBox(setByteInBox(sequenceFixture(), "mdhd", 20, 0), "mdhd", 21, 0);
    expect(parseHeifSequences(invalidLanguage, resolveLimits()).sequences[0]?.tracks[0]?.language).toBeNull();

    const invalidHandlerName = setByteInBox(sequenceFixture(), "hdlr", 24, 0xff);
    expect(warningCodes(invalidHandlerName)).toContain("MALFORMED_HEIF");

    const unknownTrackReference = (() => {
      const output = sequenceFixture();
      const source = text("cdsc");
      for (let index = 0; index <= output.length - 8; index += 1) if (source.every((value, offset) => output[index + 4 + offset] === value)) { output.set(u32(99), index + 8); break; }
      return output;
    })();
    expect(warningCodes(unknownTrackReference)).toContain("MALFORMED_HEIF");

    const missingTiming = replaceBoxType(sequenceFixture(), "stts", "free");
    expect(warningCodes(missingTiming)).toContain("MALFORMED_HEIF");
    const missingChunkMap = replaceBoxType(sequenceFixture(), "stsc", "free");
    expect(warningCodes(missingChunkMap)).toContain("MALFORMED_HEIF");
    const missingOffsets = replaceBoxType(sequenceFixture(), "stco", "free");
    expect(warningCodes(missingOffsets)).toContain("MALFORMED_HEIF");
    const missingSizes = replaceBoxType(sequenceFixture(), "stsz", "free");
    expect(warningCodes(missingSizes)).toContain("MALFORMED_HEIF");

    const zeroSyncSample = setBoxPayloadU32(sequenceFixture(), "stss", 8, 0);
    expect(warningCodes(zeroSyncSample)).toContain("MALFORMED_HEIF");

    const zeroTimingRun = setBoxPayloadU32(sequenceFixture(), "stts", 8, 0);
    expect(warningCodes(zeroTimingRun)).toContain("MALFORMED_HEIF");

    const invalidCompactWidth = setByteInBox(sequenceFixture({ compactSampleSize: 8 }), "stz2", 7, 12);
    expect(warningCodes(invalidCompactWidth)).toContain("MALFORMED_HEIF");
  });

  it("retains recognized track transforms, edit lists, and unsafe version-one durations", async () => {
    const orientations: readonly { readonly matrix: readonly number[]; readonly rotation: number; readonly mirrored: boolean }[] = [
      { matrix: [-1, 0, 0, 0, -1, 0, 0, 0, 1], rotation: 180, mirrored: false },
      { matrix: [0, -1, 0, 1, 0, 0, 0, 0, 1], rotation: 270, mirrored: false },
      { matrix: [-1, 0, 0, 0, 1, 0, 0, 0, 1], rotation: 0, mirrored: true },
      { matrix: [1, 0, 0, 0, -1, 0, 0, 0, 1], rotation: 0, mirrored: true },
    ];
    for (const expected of orientations) {
      const result = await parseMetadata(sequenceFixture({ matrix: expected.matrix }));
      expect(result.heifSequences?.[0]?.tracks[0]?.transformation?.orientation).toMatchObject({ rotation: expected.rotation, mirrored: expected.mirrored });
      expect(result.warnings).toEqual([]);
    }
    const arbitrary = await parseMetadata(sequenceFixture({ matrix: [2, 0, 0, 0, 1, 0, 0, 0, 1] }));
    expect(arbitrary.heifSequences?.[0]?.tracks[0]?.transformation?.orientation).toBeNull();

    const edited = await parseMetadata(sequenceFixture({ edits: true }));
    expect(edited.heifSequences?.[0]?.tracks[0]?.edits).toEqual([expect.objectContaining({ segmentDuration: 3000, mediaTime: 0, mediaRate: 1 })]);
    expect(edited.heifSequences?.[0]?.complete).toBe(true);
    expect(edited.warnings).toEqual([]);

    const unsafeMovieDuration = parseHeifSequences(setBoxPayloadU32(sequenceFixture({ version: 1 }), "mvhd", 24, 0x00200000), resolveLimits()).warnings;
    expect(unsafeMovieDuration).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));
    const unsafeTrackDuration = parseHeifSequences(setBoxPayloadU32(sequenceFixture({ version: 1 }), "tkhd", 28, 0x00200000), resolveLimits()).warnings;
    expect(unsafeTrackDuration).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));
    const unsafeMediaDuration = parseHeifSequences(setBoxPayloadU32(sequenceFixture({ version: 1 }), "mdhd", 24, 0x00200000), resolveLimits()).warnings;
    expect(unsafeMediaDuration).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));
  });

  it("bounds truncated headers, edit counts, and non-picture handler kinds", () => {
    expect(warningCodes(setBoxSize(sequenceFixture(), "tkhd", 40))).toContain("TRUNCATED_DATA");
    expect(warningCodes(setBoxSize(sequenceFixture(), "mdhd", 16))).toContain("MALFORMED_HEIF");
    expect(warningCodes(setBoxSize(sequenceFixture(), "hdlr", 16))).toContain("TRUNCATED_DATA");

    const excessiveEdits = setBoxPayloadU32(sequenceFixture({ edits: true }), "elst", 4, 0xffffffff);
    expect(warningCodes(excessiveEdits)).toContain("LIMIT_EXCEEDED");
    expect(warningCodes(excessiveEdits)).toContain("TRUNCATED_DATA");

    let auxiliary = sequenceFixture();
    for (const [offset, value] of [8, 9, 10, 11].map((offset, index) => [offset, "auxv".charCodeAt(index)] as const)) auxiliary = setByteInBox(auxiliary, "hdlr", offset, value, 1);
    expect(parseHeifSequences(auxiliary, resolveLimits()).sequences[0]?.tracks[1]?.kind).toBe("auxiliary");
  });

  it("keeps sequence fields available through the bounded JSON result adapter", async () => {
    const result = await parseMetadata(sequenceFixture({ fragmented: true }));
    const safe = toJsonSafeResult(result) as { readonly heifSequences?: readonly unknown[] };
    expect(safe.heifSequences).toHaveLength(1);
    expect(JSON.stringify(safe)).toContain("primaryTrackCandidates");
  });
});
