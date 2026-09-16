import { describe, expect, it } from "vitest";

import { parseCr3, parseRaf } from "../src/parsers/raw-phase-two.js";
import { DEFAULT_METADATA_REGISTRY } from "../src/registry.js";
import { resolveSelection } from "../src/selection.js";
import { resolveLimits } from "../src/security/limits.js";

const encoder = new TextEncoder();
const limits = resolveLimits({ maxInputBytes: 2 * 1024 * 1024, maxWarnings: 64, maxSegments: 64, maxIfdEntries: 64, maxIfdDepth: 8, maxMetadataBytes: 512 * 1024, maxValueBytes: 128 * 1024, maxStringBytes: 64 * 1024 });

function text(value: string): Uint8Array { return encoder.encode(value); }

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}

function u32(value: number): Uint8Array {
  const output = new Uint8Array(4);
  new DataView(output.buffer).setUint32(0, value, false);
  return output;
}

function box(type: string, ...payloads: readonly Uint8Array[]): Uint8Array {
  const payload = concat(...payloads);
  return concat(u32(8 + payload.length), text(type), payload);
}

function extendedBox(type: string, ...payloads: readonly Uint8Array[]): Uint8Array {
  const payload = concat(...payloads);
  return concat(u32(1), text(type), u32(0), u32(16 + payload.length), payload);
}

function uuidBox(uuid: string, payload: Uint8Array): Uint8Array {
  const id = Uint8Array.from(uuid.match(/../gu)?.map((part) => Number.parseInt(part, 16)) ?? []);
  return box("uuid", id, payload);
}

function jpeg(): Uint8Array {
  const sof = Uint8Array.from([0xff, 0xc0, 0, 11, 8, 0, 3, 0, 4, 1, 1, 0x11, 0]);
  const sos = Uint8Array.from([0xff, 0xda, 0, 8, 1, 1, 0, 0, 0x3f, 0]);
  return concat(Uint8Array.of(0xff, 0xd8), sof, sos, Uint8Array.of(1, 2, 3, 0xff, 0xd9));
}

function jpegWithMetadata(): Uint8Array {
  const exifText = text("Preview\0");
  const tiff = new Uint8Array(26 + exifText.length);
  tiff.set([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0]);
  const view = new DataView(tiff.buffer);
  view.setUint16(8, 1, true);
  view.setUint16(10, 0x010f, true);
  view.setUint16(12, 2, true);
  view.setUint32(14, exifText.length, true);
  view.setUint32(18, 26, true);
  tiff.set(exifText, 26);
  const exifPayload = concat(text("Exif\0\0"), tiff);
  const xmpPayload = concat(text("http://ns.adobe.com/xap/1.0/\0"), text("<x:xmpmeta/>"));
  const app1 = (payload: Uint8Array): Uint8Array => concat(Uint8Array.of(0xff, 0xe1, (payload.length + 2) >>> 8, (payload.length + 2) & 0xff), payload);
  const sof = Uint8Array.from([0xff, 0xc0, 0, 11, 8, 0, 3, 0, 4, 1, 1, 0x11, 0]);
  const sos = Uint8Array.from([0xff, 0xda, 0, 8, 1, 1, 0, 0, 0x3f, 0]);
  return concat(Uint8Array.of(0xff, 0xd8), app1(exifPayload), app1(xmpPayload), sof, sos, Uint8Array.of(1, 2, 3, 0xff, 0xd9));
}

function tiff(): Uint8Array {
  const output = new Uint8Array(64);
  output.set([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0]);
  const view = new DataView(output.buffer);
  view.setUint16(8, 2, true);
  view.setUint16(10, 256, true); view.setUint16(12, 4, true); view.setUint32(14, 1, true); view.setUint32(18, 12, true);
  view.setUint16(22, 257, true); view.setUint16(24, 4, true); view.setUint32(26, 1, true); view.setUint32(30, 8, true);
  return output;
}

function cr3(options: { readonly brand?: string; readonly canon?: Uint8Array; readonly xmp?: Uint8Array; readonly preview?: Uint8Array; readonly extra?: Uint8Array; readonly movie?: Uint8Array } = {}): Uint8Array {
  const brand = options.brand ?? "crx ";
  const ftyp = box("ftyp", text(brand), u32(1), text("isom"), text("crx "));
  const movie = options.movie ?? box("moov", box("free", Uint8Array.of(1)));
  const canon = options.canon === undefined ? uuidBox("85c0b687820f11e08111f4ce462b6a48", text("CMT1\0opaque")) : uuidBox("85c0b687820f11e08111f4ce462b6a48", options.canon);
  const xmp = options.xmp === undefined ? uuidBox("be7acfcb97a942e89c71999491e3afac", text("<rdf:RDF/>\0")) : uuidBox("be7acfcb97a942e89c71999491e3afac", options.xmp);
  const preview = options.preview === undefined ? uuidBox("eaf42b5e1c984b88b9fbb7dc406e4d16", concat(u32(1), text("PRVW"), jpeg())) : uuidBox("eaf42b5e1c984b88b9fbb7dc406e4d16", options.preview);
  return concat(ftyp, movie, canon, xmp, preview, options.extra ?? extendedBox("free", Uint8Array.of(2)));
}

function fullBox(type: string, payload: Uint8Array, version = 0, flags = 0): Uint8Array {
  return box(type, concat(Uint8Array.of(version, (flags >>> 16) & 0xff, (flags >>> 8) & 0xff, flags & 0xff), payload));
}

function fixed16(value: number): Uint8Array {
  const output = new Uint8Array(4);
  new DataView(output.buffer).setInt32(0, value * 65536, false);
  return output;
}

function sequenceMovie(sampleOffsets: readonly number[], secondFormat = "JPEG", secondHandler = "vide"): Uint8Array {
  const mvhdPayload = new Uint8Array(20);
  new DataView(mvhdPayload.buffer).setUint32(8, 1000, false);
  new DataView(mvhdPayload.buffer).setUint32(12, 3000, false);
  const mvhd = fullBox("mvhd", mvhdPayload);

  const tkhd = (id: number, width: number, height: number): Uint8Array => {
    const payload = new Uint8Array(84);
    const view = new DataView(payload.buffer);
    view.setUint32(8, id, false);
    payload.set(fixed16(1), 36);
    payload.set(fixed16(1), 52);
    payload.set(fixed16(1), 68);
    view.setUint32(72, width * 65536, false);
    view.setUint32(76, height * 65536, false);
    return fullBox("tkhd", payload);
  };
  const mdhd = (): Uint8Array => {
    const payload = new Uint8Array(22);
    const view = new DataView(payload.buffer);
    view.setUint32(8, 1000, false);
    view.setUint32(12, 1000, false);
    view.setUint16(16, 0x15c7, false);
    return fullBox("mdhd", payload);
  };
  const hdlr = (handler: string, name: string): Uint8Array => {
    const payload = new Uint8Array(24 + name.length + 1);
    payload.set(text(handler), 4);
    payload.set(text(`${name}\0`), 20);
    return fullBox("hdlr", payload);
  };
  const sampleEntry = (format: string, width: number, height: number): Uint8Array => {
    if (format !== "JPEG" && format !== "av01") {
      const payload = new Uint8Array(8);
      new DataView(payload.buffer).setUint16(6, 1, false);
      return box(format, payload);
    }
    const payload = new Uint8Array(78);
    const view = new DataView(payload.buffer);
    view.setUint16(6, 1, false);
    view.setUint16(24, width, false);
    view.setUint16(26, height, false);
    payload.set(fixed16(72), 28);
    payload.set(fixed16(72), 32);
    view.setUint16(40, 1, false);
    view.setUint16(72, 24, false);
    view.setUint16(76, 0xffff, false);
    return box(format, payload);
  };
  const stsd = (entry: Uint8Array): Uint8Array => fullBox("stsd", concat(u32(1), entry));
  const stts = fullBox("stts", concat(u32(1), u32(1), u32(1000)));
  const stsc = fullBox("stsc", concat(u32(1), u32(1), u32(1), u32(1)));
  const stsz = (size: number): Uint8Array => fullBox("stsz", concat(u32(0), u32(1), u32(size)));
  const stco = (offset: number): Uint8Array => fullBox("stco", concat(u32(1), u32(offset)));
  const stss = fullBox("stss", concat(u32(1), u32(1)));
  const track = (id: number, handler: string, format: string, width: number, height: number, offset: number, size: number): Uint8Array => {
    const stbl = box("stbl", stsd(sampleEntry(format, width, height)), stts, stsc, stsz(size), stco(offset), stss);
    const media = box("mdia", mdhd(), hdlr(handler, `${handler} sequence`), box("minf", stbl));
    return box("trak", tkhd(id, width, height), media);
  };
  return box(
    "moov",
    mvhd,
    track(1, "pict", "av01", 640, 480, sampleOffsets[0] ?? 0, 4),
    track(2, secondHandler, secondFormat, 320, 240, sampleOffsets[1] ?? 0, 4),
    track(3, "meta", "mett", 0, 0, sampleOffsets[2] ?? 0, 2),
  );
}

function cr3WithSequence(secondFormat = "JPEG", secondHandler = "vide"): Uint8Array {
  const provisionalMovie = sequenceMovie([0, 0, 0], secondFormat, secondHandler);
  const provisional = cr3({ movie: provisionalMovie });
  const sampleOffset = provisional.length + 8;
  const movie = sequenceMovie([sampleOffset, sampleOffset + 4, sampleOffset + 8], secondFormat, secondHandler);
  const source = cr3({ movie });
  return concat(source, box("mdat", Uint8Array.of(1, 2, 3, 4, 0xff, 0xd8, 0xff, 0xd9, 9, 10)));
}

function raf(options: { readonly preview?: Uint8Array; readonly previewOffset?: number; readonly previewLength?: number; readonly metadataOffset?: number; readonly metadataLength?: number; readonly rawOffset?: number; readonly rawLength?: number; readonly camera?: Uint8Array } = {}): Uint8Array {
  const image = options.preview ?? jpeg();
  const metadata = text("opaque RAF metadata");
  const raw = tiff();
  const previewOffset = options.previewOffset ?? 148;
  const metadataOffset = options.metadataOffset ?? previewOffset + image.length + 4;
  const rawOffset = options.rawOffset ?? metadataOffset + metadata.length + 4;
  const output = new Uint8Array(Math.max(512, rawOffset + (options.rawLength ?? raw.length)));
  output.set(text("FUJIFILMCCD-RAW "), 0); output.set(text("0201"), 16); output.set(options.camera ?? text("X-T3"), 24);
  const view = new DataView(output.buffer);
  view.setUint32(84, previewOffset, false); view.setUint32(88, options.previewLength ?? image.length, false);
  view.setUint32(92, metadataOffset, false); view.setUint32(96, options.metadataLength ?? metadata.length, false);
  view.setUint32(100, rawOffset, false); view.setUint32(104, options.rawLength ?? raw.length, false);
  output.set(image, previewOffset); output.set(metadata, metadataOffset); output.set(raw, rawOffset);
  return output;
}

describe("S06 RAW phase-two independent boundary matrix", () => {
  it("exercises CR3 box lengths, UUID inventory, metadata candidates, preview outcomes, and selection paths", () => {
    const withTiff = concat(text("CMT1"), tiff(), text("CMT2"), tiff());
    const parsed = parseCr3(cr3({ canon: withTiff }), limits, resolveSelection({ groups: ["EXIF", "XMP", "Dimensions", "MakerNote"] }));
    expect(parsed.cr3?.majorBrand).toBe("crx ");
    expect(parsed.cr3?.compatibleBrands).toEqual(expect.arrayContaining(["isom", "crx "]));
    expect(parsed.cr3?.previewRanges.some(({ status }) => status === "valid")).toBe(true);
    expect(parsed.cr3?.metadataRanges.length).toBeGreaterThan(0);
    expect(parsed.exif?.fields.some(({ name }) => name === "ImageWidth")).toBe(true);
    expect(parsed.xmp?.packets).toEqual(["<rdf:RDF/>"]);

    const noBrand = parseCr3(cr3({ brand: "isom" }), limits, resolveSelection({ groups: ["Dimensions"] }));
    expect(noBrand.cr3?.complete).toBe(false);
    expect(noBrand.warnings.some(({ code }) => code === "MALFORMED_CR3")).toBe(true);
    expect(parseCr3(cr3({ preview: concat(u32(1), text("PRVW"), text("not-an-image")) }), limits).cr3?.diagnostics.some(({ code }) => code === "TRUNCATED_DATA")).toBe(true);

    const invalidUtf8 = parseCr3(cr3({ xmp: concat(new Uint8Array(16).fill(0), Uint8Array.of(0xff)) }), limits, resolveSelection({ groups: ["XMP"] }));
    expect(invalidUtf8.xmp).toBeNull();
    expect(invalidUtf8.warnings.some(({ code }) => code === "INVALID_VALUE")).toBe(true);
    expect(parseCr3(cr3({ xmp: new Uint8Array(16) }), limits, resolveSelection({ groups: ["Dimensions"] })).xmp).toBeNull();

    const shortUuid = cr3({ extra: box("uuid", Uint8Array.of(1, 2, 3)) });
    expect(parseCr3(shortUuid, limits).cr3?.boxes.some(({ type, status }) => type === "uuid" && status === "unsupported")).toBe(true);
    const unknownUuid = cr3({ extra: uuidBox("0102030405060708090a0b0c0d0e0f10", Uint8Array.of(9, 8, 7)) });
    expect(parseCr3(unknownUuid, limits).cr3?.opaqueStructures.length).toBeGreaterThan(0);

    const sizeZero = parseCr3(concat(box("ftyp", text("crx ")), Uint8Array.of(0, 0, 0, 0, 0x66, 0x72, 0x65, 0x65, 1, 2)), limits);
    expect(sizeZero.cr3?.boxes.some(({ type, length }) => type === "free" && length === 10)).toBe(true);
    const extended = parseCr3(concat(box("ftyp", text("crx ")), extendedBox("free", Uint8Array.of(1))), limits);
    expect(extended.cr3?.boxes.some(({ type, length }) => type === "free" && length === 17)).toBe(true);
    const unsafeExtended = concat(box("ftyp", text("crx ")), Uint8Array.from([0, 0, 0, 1, 0x66, 0x72, 0x65, 0x65, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]));
    expect(parseCr3(unsafeExtended, limits).cr3?.diagnostics.some(({ code }) => code === "UNSAFE_RANGE")).toBe(true);

    const nested = box("moov", box("meta", Uint8Array.of(0, 0, 0, 0), box("trak", box("free"))));
    expect(parseCr3(concat(box("ftyp", text("crx ")), nested), limits).cr3?.boxes.length).toBeGreaterThan(1);
    const malformedContainer = concat(box("ftyp", text("crx ")), u32(32), text("moov"), Uint8Array.of(0));
    expect(parseCr3(malformedContainer, limits).cr3?.diagnostics.some(({ code }) => code === "UNSAFE_RANGE")).toBe(true);
    expect(parseCr3(cr3(), resolveLimits({ maxSegments: 1, maxWarnings: 4 })).warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
  });

  it("exercises RAF identity, text decoding, exact range statuses, duplicate/overlap, and selection behavior", () => {
    const complete = parseRaf(raf(), limits, resolveSelection({ groups: ["EXIF", "XMP", "Dimensions", "MakerNote"] }));
    expect(complete.raf?.directory?.complete).toBe(true);
    expect(complete.dimensions).toEqual({ width: 4, height: 3 });
    expect(complete.raf?.previewRanges[0]?.format).toBe("jpeg");
    expect(complete.raf?.rawRanges[0]?.format).toBe("tiff");
    expect(complete.blocks?.some(({ container }) => container.includes("proprietary"))).toBe(true);

    const noSelection = parseRaf(raf(), limits, resolveSelection({ groups: ["ICC"] }));
    expect(noSelection.dimensions).toBeNull();
    expect(noSelection.fields).toHaveLength(0);
    expect(noSelection.blocks?.some(({ status }) => status === "opaque")).toBe(true);
    expect(parseRaf(new Uint8Array(107), limits).raf?.directory).toBeNull();
    expect(parseRaf(new Uint8Array(), limits).warnings[0]?.code).toBe("MALFORMED_RAF");

    const invalidCamera = raf({ camera: Uint8Array.of(0xff, 0) });
    expect(parseRaf(invalidCamera, limits).raf?.camera).toBeNull();
    const noRanges = parseRaf(raf({ previewOffset: 400, previewLength: 0, metadataOffset: 420, metadataLength: 0, rawOffset: 440, rawLength: 0 }), limits);
    expect(noRanges.raf?.directory?.complete).toBe(false);
    expect(noRanges.raf?.ranges.every(({ status }) => status !== "valid")).toBe(true);
    const overlap = parseRaf(raf({ metadataOffset: 148 }), limits);
    expect(overlap.raf?.diagnostics.some(({ code }) => code === "OVERLAPPING_RANGE")).toBe(true);
    const duplicate = parseRaf(raf({ metadataOffset: 148, metadataLength: jpeg().length }), limits);
    expect(duplicate.raf?.diagnostics.some(({ code }) => code === "DUPLICATE_RANGE")).toBe(true);
    const outOfBounds = parseRaf(raf({ rawOffset: 4096, rawLength: 100 }).slice(0, 512), limits);
    expect(outOfBounds.raf?.diagnostics.some(({ code }) => code === "UNSAFE_RANGE")).toBe(true);
    expect(parseRaf(raf(), resolveLimits({ maxSegments: 1, maxWarnings: 4 })).warnings.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
  });

  it("fails closed for truncated inputs and cancellation without throwing unrelated errors", () => {
    for (const input of [new Uint8Array([0x49]), new Uint8Array([0x46, 0x55, 0x4a, 0x49]), new Uint8Array([0, 0, 0, 8, 0x66, 0x74, 0x79, 0x70])]) {
      expect(() => parseCr3(input, limits)).not.toThrow();
      expect(() => parseRaf(input, limits)).not.toThrow();
    }
    const controller = new AbortController(); controller.abort();
    expect(() => parseCr3(cr3(), limits, undefined, controller.signal)).toThrow(/abort/i);
    expect(() => parseRaf(raf(), limits, undefined, controller.signal)).toThrow(/abort/i);
  });

  it("normalizes CR3 picture-track candidates and retains raw, preview, and metadata sample ranges", () => {
    const parsed = parseCr3(
      cr3WithSequence(),
      limits,
      resolveSelection({ groups: ["EXIF", "XMP", "Dimensions", "MakerNote"] }),
    );
    expect(parsed.cr3?.sequences).toHaveLength(1);
    expect(parsed.cr3?.primarySelection).toBe("ambiguous");
    expect(parsed.cr3?.primaryTrackCandidates).toEqual([1, 2]);
    expect(parsed.cr3?.sequences[0]?.tracks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 1, kind: "picture", complete: true }),
      expect.objectContaining({ id: 2, kind: "picture", handlerType: "vide" }),
      expect.objectContaining({ id: 3, kind: "metadata" }),
    ]));
    expect(parsed.cr3?.ranges.some(({ role, status }) => role === "raw" && status === "valid")).toBe(true);
    expect(parsed.cr3?.ranges.some(({ role, status }) => role === "metadata" && status === "valid")).toBe(true);
    expect(parsed.cr3?.previewRanges.filter(({ status }) => status === "valid").length).toBeGreaterThanOrEqual(2);
    expect(parsed.cr3?.diagnostics.some(({ code }) => code === "AMBIGUOUS_PRIMARY")).toBe(true);
  });

  it("merges independently parsed preview and raw metadata while retaining source-specific provenance", () => {
    const preview = jpegWithMetadata();
    const cr3Result = parseCr3(
      cr3({ preview: concat(u32(1), text("PRVW"), preview), xmp: text("<x:xmpmeta/>"), canon: concat(text("CMT1"), tiff()) }),
      limits,
      resolveSelection({ groups: ["EXIF", "XMP", "Dimensions", "MakerNote"] }),
    );
    expect(cr3Result.exif?.fields.some(({ name }) => name === "Make")).toBe(true);
    expect(cr3Result.xmp?.packets).toContain("<x:xmpmeta/>");
    expect(cr3Result.fields.some(({ source }) => source?.blockId.startsWith("cr3:preview:"))).toBe(true);
    expect(cr3Result.blocks?.some(({ id }) => id.startsWith("cr3:preview:"))).toBe(true);

    const rafResult = parseRaf(raf({ preview }), limits, resolveSelection({ groups: ["EXIF", "XMP", "Dimensions", "MakerNote"] }));
    expect(rafResult.exif?.fields.some(({ name }) => name === "Make")).toBe(true);
    expect(rafResult.xmp?.packets).toEqual(["<x:xmpmeta/>"]);
    expect(rafResult.fields.every(({ source }) => source?.blockId.startsWith("raf:") || source === undefined)).toBe(true);
    expect(rafResult.raf?.ranges.some(({ format }) => format === "jpeg")).toBe(true);
  });

  it("reparses every byte boundary of complete CR3 and RAF inventories with typed bounded outcomes", () => {
    const inputs = [cr3(), raf()];
    for (const source of inputs) {
      for (let offset = 0; offset < source.length; offset += 1) {
        for (const replacement of [0, 0xff]) {
          const mutated = source.slice();
          mutated[offset] = replacement;
          const cr3Result = parseCr3(mutated, limits, resolveSelection({ groups: ["EXIF", "XMP", "Dimensions", "MakerNote"] }));
          expect(cr3Result.fields.length).toBeLessThanOrEqual(limits.maxAdapterItems);
          expect(cr3Result.blocks?.length ?? 0).toBeLessThanOrEqual(limits.maxAdapterItems);
          expect(cr3Result.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
          const rafResult = parseRaf(mutated, limits, resolveSelection({ groups: ["EXIF", "XMP", "Dimensions", "MakerNote"] }));
          expect(rafResult.fields.length).toBeLessThanOrEqual(limits.maxAdapterItems);
          expect(rafResult.blocks?.length ?? 0).toBeLessThanOrEqual(limits.maxAdapterItems);
          expect(rafResult.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
        }
      }
    }
  }, 30_000);

  it("retains explicit registry and plugin provenance through preview and raw reparse paths", () => {
    const selection = resolveSelection({ groups: ["EXIF", "XMP", "Dimensions", "MakerNote"] });
    const cr3Result = parseCr3(
      cr3({ preview: jpegWithMetadata(), canon: concat(text("CMT1"), tiff()) }),
      limits,
      selection,
      undefined,
      DEFAULT_METADATA_REGISTRY,
      [],
    );
    expect(cr3Result.fields.length).toBeGreaterThan(0);
    expect(cr3Result.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);

    const rafResult = parseRaf(
      raf({ preview: jpegWithMetadata() }),
      limits,
      selection,
      undefined,
      DEFAULT_METADATA_REGISTRY,
      [],
    );
    expect(rafResult.fields.length).toBeGreaterThan(0);
    expect(rafResult.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
  });

  it("retains empty and malformed UUID payloads as typed bounded candidates", () => {
    const emptyXmp = parseCr3(
      cr3({ xmp: concat(new Uint8Array(16), Uint8Array.of(0)) }),
      limits,
      resolveSelection({ groups: ["XMP"] }),
    );
    expect(emptyXmp.xmp?.packets).toEqual([""]);
    expect(emptyXmp.warnings.some(({ code }) => code === "INVALID_VALUE")).toBe(true);
    expect(emptyXmp.blocks?.some(({ family, status }) => family === "XMP" && status === "decoded")).toBe(true);

    const emptyCanon = parseCr3(
      cr3({ canon: new Uint8Array() }),
      limits,
      resolveSelection({ groups: ["EXIF"] }),
    );
    expect(emptyCanon.cr3?.metadataRanges.some(({ status }) => status === "malformed")).toBe(true);
    expect(emptyCanon.cr3?.opaqueStructures.length).toBeGreaterThan(0);

    const noMetadataSelection = parseCr3(
      cr3({ xmp: new Uint8Array(16), canon: new Uint8Array() }),
      limits,
      resolveSelection({ groups: ["ICC"] }),
    );
    expect(noMetadataSelection.xmp).toBeNull();
    expect(noMetadataSelection.fields.length).toBeLessThanOrEqual(limits.maxAdapterItems);
  });

  it("covers sole-track normalization, unknown CRAW tracks, explicit optional arguments, and invalid samples", () => {
    const soleTrack = parseCr3(
      cr3WithSequence("CRAW", "meta"),
      limits,
      resolveSelection({ groups: ["Dimensions"] }),
      new AbortController().signal,
      DEFAULT_METADATA_REGISTRY,
      [],
    );
    expect(soleTrack.cr3?.primarySelection).toBe("unambiguous");
    expect(soleTrack.cr3?.primaryTrackCandidates).toEqual([1]);
    expect(soleTrack.cr3?.sequences[0]?.tracks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 1, kind: "picture", complete: true }),
      expect.objectContaining({ id: 2, kind: "metadata", handlerType: "meta" }),
    ]));

    const normalizedCraw = parseCr3(
      cr3WithSequence("CRAW"),
      limits,
      resolveSelection({ groups: ["Dimensions"] }),
      new AbortController().signal,
    );
    expect(normalizedCraw.cr3?.sequences[0]?.tracks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 2, kind: "picture", handlerType: "vide" }),
    ]));

    const invalidSamples = parseCr3(
      cr3WithSequence("CRAW", "vide").slice(0, -6),
      limits,
      resolveSelection({ groups: ["Dimensions"] }),
    );
    expect(invalidSamples.cr3?.sequences[0]?.tracks.every(({ complete }) => typeof complete === "boolean")).toBe(true);
    expect(invalidSamples.cr3?.ranges.every(({ status }) => status === "valid" || status === "out-of-bounds" || status === "malformed" || status === "overlap")).toBe(true);

    const noExif = parseCr3(
      cr3({ canon: concat(text("CMT1"), tiff()), xmp: text("<rdf:RDF/>") }),
      limits,
      resolveSelection({ groups: ["XMP"] }),
      new AbortController().signal,
    );
    expect(noExif.xmp?.packets).toEqual(expect.arrayContaining(["<rdf:RDF/>"]));
    expect(noExif.exif).toBeNull();
  });
});
