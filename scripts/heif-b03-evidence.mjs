import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { TextEncoder } from "node:util";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const reports = join(root, "reports");
const packageManifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const sourceManifestBytes = await readFile(join(root, "data", "heif", "sources.json"));
const sourceManifest = JSON.parse(sourceManifestBytes.toString("utf8"));
const { parseMetadata } = await import(join(root, "dist", "index.js"));

const text = (value) => new TextEncoder().encode(value);
const u16 = (value) => { const output = new Uint8Array(2); new DataView(output.buffer).setUint16(0, value, false); return output; };
const u32 = (value) => { const output = new Uint8Array(4); new DataView(output.buffer).setUint32(0, value >>> 0, false); return output; };
const i32 = (value) => { const output = new Uint8Array(4); new DataView(output.buffer).setInt32(0, value, false); return output; };
const fixed = (value) => i32(value * 65536);
const concat = (parts) => { const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0)); let offset = 0; for (const part of parts) { output.set(part, offset); offset += part.length; } return output; };
const box = (type, ...payloads) => { const payload = concat(payloads); const output = new Uint8Array(payload.length + 8); new DataView(output.buffer).setUint32(0, output.length, false); output.set(text(type), 4); output.set(payload, 8); return output; };
const full = (version, flags, ...payloads) => concat([Uint8Array.of(version, flags >> 16 & 0xff, flags >> 8 & 0xff, flags & 0xff), ...payloads]);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

function ftyp(brand = "heic") {
  return box("ftyp", concat([text(brand), u32(0), text(brand), text("mif1")]));
}

function mvhd(timescale = 1000, duration = 3000) {
  return box("mvhd", full(0, 0, new Uint8Array(8), u32(timescale), u32(duration), new Uint8Array(80)));
}

function tkhd(id, width, height, duration = 3000, matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1]) {
  const payload = new Uint8Array(84);
  payload.set(Uint8Array.of(0, 0, 0, 7), 0);
  payload.set(u32(id), 12);
  payload.set(u32(duration), 20);
  matrix.forEach((value, index) => payload.set(fixed(value), 40 + index * 4));
  payload.set(fixed(width), 76);
  payload.set(fixed(height), 80);
  return box("tkhd", payload);
}

function mdhd(timescale = 1000, duration = 3000, language = "eng") {
  const packed = ((language.charCodeAt(0) - 0x60) << 10) | ((language.charCodeAt(1) - 0x60) << 5) | (language.charCodeAt(2) - 0x60);
  return box("mdhd", full(0, 0, new Uint8Array(8), u32(timescale), u32(duration), u16(packed), u16(0)));
}

function hdlr(handlerType, name) {
  return box("hdlr", full(0, 0, new Uint8Array(4), text(handlerType), new Uint8Array(12), text(name), Uint8Array.of(0)));
}

function visualSampleEntry(width, height) {
  const payload = new Uint8Array(78);
  payload.set(u16(1), 6);
  payload.set(u16(width), 24);
  payload.set(u16(height), 26);
  payload.set(u32(0x00480000), 28);
  payload.set(u32(0x00480000), 32);
  payload.set(u16(1), 40);
  payload.set(u16(0x0018), 72);
  payload.set(u16(0xffff), 76);
  return box("av01", payload);
}

function metadataSampleEntry() {
  const payload = new Uint8Array(8);
  payload.set(u16(1), 6);
  return box("mett", payload);
}

function stsd(entry) { return box("stsd", full(0, 0, u32(1), entry)); }
function stts(sampleCount, duration) { return box("stts", full(0, 0, u32(1), u32(sampleCount), u32(duration))); }
function ctts(sampleCount, offset) { return box("ctts", full(1, 0, u32(1), u32(sampleCount), i32(offset))); }
function stsc(sampleCount) { return box("stsc", full(0, 0, u32(1), u32(1), u32(sampleCount), u32(1))); }
function stsz(sizes) { return box("stsz", full(0, 0, u32(0), u32(sizes.length), ...sizes.map(u32))); }
function stco(offset) { return box("stco", full(0, 0, u32(1), u32(offset))); }
function stss(samples) { return box("stss", full(0, 0, u32(samples.length), ...samples.map(u32))); }
function trackReference(type, ids) { return box(type, ...ids.map(u32)); }

function unfragmentedTrack({ id, handler, width = 0, height = 0, sizes, offset, reference, matrix }) {
  const entry = handler === "pict" ? visualSampleEntry(width, height) : metadataSampleEntry();
  const table = box("stbl", stsd(entry), stts(sizes.length, 1000), ctts(sizes.length, -100), stsc(sizes.length), stsz(sizes), stco(offset), stss([1, sizes.length]));
  const media = box("mdia", mdhd(), hdlr(handler, handler === "pict" ? "picture sequence" : "metadata sequence"), box("minf", table));
  return box("trak", tkhd(id, width, height, sizes.length * 1000, matrix), reference === undefined ? new Uint8Array(0) : box("tref", reference), media);
}

function unfragmentedFixture(pictureCount = 1, brand = "heic") {
  const pictureSizes = [4, 5, 6];
  const metadataSizes = [3];
  const metadataId = pictureCount + 1;
  const sizingPictures = Array.from({ length: pictureCount }, (_, index) => unfragmentedTrack({ id: index + 1, handler: "pict", width: 320 + index, height: 240, sizes: pictureSizes, offset: 0, matrix: index === 0 ? [0, 1, 0, -1, 0, 0, 0, 0, 1] : undefined }));
  const sizingMetadata = unfragmentedTrack({ id: metadataId, handler: "meta", sizes: metadataSizes, offset: 0, reference: trackReference("cdsc", [pictureCount === 1 ? 1 : 2]) });
  const sizingMovie = box("moov", mvhd(), ...sizingPictures, sizingMetadata);
  const firstPayloadOffset = ftyp(brand).length + sizingMovie.length + 8;
  let offset = firstPayloadOffset;
  const pictures = Array.from({ length: pictureCount }, (_, index) => {
    const output = unfragmentedTrack({ id: index + 1, handler: "pict", width: 320 + index, height: 240, sizes: pictureSizes, offset, matrix: index === 0 ? [0, 1, 0, -1, 0, 0, 0, 0, 1] : undefined });
    offset += pictureSizes.reduce((sum, value) => sum + value, 0);
    return output;
  });
  const metadata = unfragmentedTrack({ id: metadataId, handler: "meta", sizes: metadataSizes, offset, reference: trackReference("cdsc", [pictureCount === 1 ? 1 : 2]) });
  const movie = box("moov", mvhd(), ...pictures, metadata);
  const sampleBytes = Uint8Array.from({ length: pictureCount * 15 + 3 }, (_, index) => (index + 1) & 0xff);
  return concat([ftyp(brand), movie, box("mdat", sampleBytes)]);
}

function trex(trackId, size, duration) { return box("trex", full(0, 0, u32(trackId), u32(1), u32(duration), u32(size), u32(0))); }
function tfhd(trackId, size, duration) { return box("tfhd", full(0, 0x020000 | 0x000002 | 0x000008 | 0x000010, u32(trackId), u32(1), u32(duration), u32(size))); }
function tfdt(value) { return box("tfdt", full(0, 0, u32(value))); }
function trun(samples, dataOffset) { return box("trun", full(1, 0x000001 | 0x000100 | 0x000200 | 0x000400 | 0x000800, u32(samples.length), i32(dataOffset), ...samples.flatMap((sample) => [u32(sample.duration), u32(sample.size), u32(sample.flags), i32(sample.offset)]))); }

function fragmentedFixture() {
  const moov = box("moov", mvhd(), box("trak", tkhd(1, 320, 240, 3000), box("mdia", mdhd(), hdlr("pict", "fragmented picture"), box("minf", box("stbl", stsd(visualSampleEntry(320, 240)), stsz([]))))), box("mvex", trex(1, 5, 1000)));
  const samples = [{ size: 5, duration: 1000, flags: 0, offset: 0 }, { size: 5, duration: 1000, flags: 0x00010000, offset: 10 }];
  const provisional = box("moof", box("traf", tfhd(1, 5, 1000), tfdt(0), trun(samples, 0)));
  const moof = box("moof", box("traf", tfhd(1, 5, 1000), tfdt(0), trun(samples, provisional.length + 8)));
  const media = Uint8Array.from({ length: 10 }, (_, index) => index & 0xff);
  return concat([ftyp(), moov, moof, box("mdat", media)]);
}

function summarize(result) {
  return {
    format: result.format,
    dimensions: result.dimensions,
    sequenceCount: result.heifSequences?.length ?? 0,
    sequences: (result.heifSequences ?? []).map((sequence) => ({
      sourceOffset: sequence.sourceOffset,
      byteLength: sequence.byteLength,
      fragmented: sequence.fragmented,
      duration: sequence.duration,
      primaryTrackId: sequence.primaryTrackId,
      primaryTrackCandidates: sequence.primaryTrackCandidates,
      primarySelection: sequence.primarySelection,
      complete: sequence.complete,
      tracks: sequence.tracks.map((track) => ({ id: track.id, kind: track.kind, dimensions: track.dimensions, sampleDescriptions: track.sampleDescriptions.length, samples: track.samples.length, metadataTrackIds: track.metadataTrackIds, references: track.references.map(({ type, targetTrackIds }) => ({ type, targetTrackIds })), complete: track.complete })),
      metadataItemIds: sequence.metadataItemIds,
      metadataAssociations: sequence.metadataAssociations,
    })),
    warningCodes: result.warnings.map(({ code }) => code),
  };
}

const cases = [];
const run = async (name, bytes, check, expectedStatus = "passed") => {
  const result = await parseMetadata(bytes);
  check(result);
  const summary = summarize(result);
  cases.push({ name, fixturePath: `generated://heif-b03/${name}.bin`, bytes: bytes.length, sha256: sha256(bytes), result: summary, status: expectedStatus });
};

await run("unfragmented-independent-picture-and-metadata-tracks", unfragmentedFixture(), (result) => {
  const sequence = result.heifSequences?.[0];
  assert(result.format === "heif", "unfragmented fixture was not detected as HEIF");
  assert(result.dimensions?.width === 320 && result.dimensions.height === 240, "unfragmented primary dimensions were not retained");
  assert(sequence?.complete === true && sequence.primaryTrackId === 1 && sequence.primarySelection === "sole-picture-track", "unfragmented primary selection was not complete");
  assert(sequence.tracks.length === 2 && sequence.tracks[0]?.samples.length === 3, "unfragmented tracks or samples were flattened or lost");
  assert(sequence.tracks[0]?.metadataTrackIds.join(",") === "2", "metadata-track association was not reverse-linked");
  assert(sequence.tracks[0]?.transformation?.orientation?.rotation === 90, "track transformation was not retained");
  assert(sequence.tracks[0]?.samples[1]?.decodeTime === 1000 && sequence.tracks[0]?.samples[1]?.compositionTime === 900, "sample timing was not retained");
  assert(result.details?.animation.some(({ value }) => value.frames === 3), "primary sequence animation summary was not exposed");
  assert(result.warnings.length === 0, "complete unfragmented fixture emitted warnings");
});

await run("ambiguous-multiple-picture-tracks", unfragmentedFixture(2), (result) => {
  const sequence = result.heifSequences?.[0];
  assert(sequence?.tracks.filter(({ kind }) => kind === "picture").length === 2, "multiple picture tracks were not retained");
  assert(sequence.primaryTrackId === null && sequence.primarySelection === "ambiguous-picture-tracks", "ambiguous primary selection was guessed");
  assert(result.dimensions === null && result.details?.primaryImageId === null, "ambiguous top-level primary view was not fail-closed");
  assert(result.warnings.length === 0, "complete ambiguous fixture emitted warnings");
});

await run("avif-sequence-primary-track", unfragmentedFixture(1, "avif"), (result) => {
  assert(result.format === "avif", "AVIF sequence fixture was not detected as AVIF");
  assert(result.heifSequences?.[0]?.primaryTrackId === 1 && result.heifSequences[0].complete === true, "AVIF sequence primary track was not retained");
  assert(result.warnings.length === 0, "complete AVIF sequence fixture emitted warnings");
});

await run("fragmented-picture-samples", fragmentedFixture(), (result) => {
  const sequence = result.heifSequences?.[0];
  const track = sequence?.tracks[0];
  assert(sequence?.fragmented === true && sequence.complete === true, "fragmented sequence was not complete");
  assert(track?.samples.length === 2 && track.samples[0]?.fragmentOffset !== null, "fragment samples or fragment provenance were not retained");
  assert(track.samples[1]?.decodeTime === 1000 && track.samples[1]?.sync === false, "fragment timing or sync state was not retained");
  assert(result.warnings.length === 0, "complete fragmented fixture emitted warnings");
});

const malformed = unfragmentedFixture().subarray(0, unfragmentedFixture().length - 3);
await run("truncated-top-level-data", malformed, (result) => {
  assert(result.heifSequences?.[0]?.complete === false, "truncated sequence was reported complete");
  assert(result.warnings.some(({ code }) => code === "TRUNCATED_DATA"), "truncated sequence did not retain a typed diagnostic");
});

const limited = await parseMetadata(unfragmentedFixture(), { limits: { maxImageDetailFrames: 2 } });
assert(limited.heifSequences?.[0]?.complete === false, "sample-limit sequence was reported complete");
assert(limited.warnings.some(({ code }) => code === "LIMIT_EXCEEDED"), "sample-limit diagnostic was absent");
cases.push({ name: "bounded-sample-limit", fixturePath: "generated://heif-b03/bounded-sample-limit.bin", bytes: unfragmentedFixture().length, sha256: sha256(unfragmentedFixture()), result: summarize(limited), status: "passed" });

const sourceManifestHash = sha256(sourceManifestBytes);
const report = {
  schema: "browser-image-metadata.heif-b03-evidence.v1",
  status: "pass",
  generatedAt: new Date().toISOString(),
  package: { name: packageManifest.name, version: packageManifest.version },
  sourceManifest: { path: "data/heif/sources.json", schema: sourceManifest.schema, sha256: sourceManifestHash },
  standards: sourceManifest.sources.map(({ title, version, edition, editionDate, url, license, hash }) => ({ title, version, ...(edition === undefined ? {} : { edition }), ...(editionDate === undefined ? {} : { editionDate }), url, license, hash })),
  implementation: {
    model: "one result-level primary view plus a bounded collection of independent sequences, tracks, sample descriptions, samples, transformations, edits, references, and metadata associations",
    primarySelection: "a primary track is selected only when a sequence has exactly one picture track; multiple picture tracks remain candidates and produce ambiguous-picture-tracks",
    metadataPolicy: "item-graph relationships and track references remain separate; cdsc/meta track references are reverse-linked to the referenced picture track without flattening item metadata",
    samplePolicy: "sample payloads are never copied or decoded; only offsets, lengths, timing, sync state, and source provenance are retained",
    incompletePolicy: "malformed, truncated, unsafe, unsupported, or over-limit structures remain returned with typed diagnostics and complete=false",
    securityPolicy: "safe-integer arithmetic, bounded box/track/table/sample/relationship counts, bounded strings, bounded warning output, and no payload allocation",
  },
  coverage: {
    cases: cases.length,
    unfragmented: cases.some(({ name }) => name === "unfragmented-independent-picture-and-metadata-tracks"),
    multiplePictureTracks: cases.some(({ name }) => name === "ambiguous-multiple-picture-tracks"),
    avif: cases.some(({ name }) => name === "avif-sequence-primary-track"),
    fragmented: cases.some(({ name }) => name === "fragmented-picture-samples"),
    malformed: cases.some(({ name }) => name === "truncated-top-level-data"),
    limits: cases.some(({ name }) => name === "bounded-sample-limit"),
    pixelDecode: false,
  },
  cases,
  payloadPolicy: "All fixtures are deterministic repository-authored structural bytes generated in memory by this command. No third-party image bytes, image copies, or decoded pixels are written.",
  complete: cases.length === 6 && cases.every(({ status }) => status === "passed"),
};
assert(report.complete, "B03 evidence was incomplete");
await mkdir(reports, { recursive: true });
await writeFile(join(reports, "heif-b03-evidence.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
const markdown = [
  "# HEIF/AVIF B03 sequence evidence",
  "",
  `- Status: **${report.status}**`,
  `- Package: \`${report.package.name}@${report.package.version}\``,
  `- Source manifest: \`${report.sourceManifest.path}\` (SHA-256 \`${report.sourceManifest.sha256}\`)`,
  `- Cases: ${report.cases.length} (all passed)`,
  "- Pixel policy: structural sequence inspection only; sample payloads were not copied or decoded.",
  "",
  "| Case | Fixture path | Bytes | SHA-256 | Sequences | Tracks | Samples | Primary selection | Complete | Status |",
  "| --- | --- | ---: | --- | ---: | ---: | ---: | --- | --- | --- |",
  ...report.cases.map((item) => {
    const sequence = item.result.sequences[0];
    const tracks = sequence?.tracks.length ?? 0;
    const samples = sequence?.tracks.reduce((sum, track) => sum + track.samples, 0) ?? 0;
    return `| ${item.name} | ${item.fixturePath} | ${item.bytes} | \`${item.sha256}\` | ${item.result.sequenceCount} | ${tracks} | ${samples} | ${sequence?.primarySelection ?? "none"} | ${sequence?.complete ?? false} | ${item.status} |`;
  }),
  "",
  "## Retained model and limits",
  "",
  `- ${report.implementation.model}.`,
  `- ${report.implementation.primarySelection}.`,
  `- ${report.implementation.metadataPolicy}.`,
  `- ${report.implementation.incompletePolicy}.`,
  `- ${report.implementation.securityPolicy}.`,
  "- The report records fixture paths, byte lengths, SHA-256 values, package version, source-manifest hash, primary candidates, track/sample summaries, provenance-bearing fragment samples, and warning codes without storing fixture payloads.",
].join("\n");
await writeFile(join(reports, "heif-b03-evidence.md"), `${markdown}\n`, "utf8");
console.log(`HEIF/AVIF B03 evidence passed for ${report.cases.length} cases; reports: reports/heif-b03-evidence.{json,md}`);
