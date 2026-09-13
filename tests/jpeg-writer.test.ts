import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { afterAll, describe, expect, it } from "vitest";
import { exiftool } from "exiftool-vendored";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { editMetadata } from "../src/edit.js";
import { parseJpeg } from "../src/parsers/jpeg.js";
import { rewriteJpegMetadata, JpegWriterError } from "../src/jpeg-writer.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";

const encoder = new TextEncoder();
const EXIF = encoder.encode("Exif\0\0");
const XMP = encoder.encode("http://ns.adobe.com/xap/1.0/\0");
const PHOTOSHOP = encoder.encode("Photoshop 3.0\0");
const RESOURCE = encoder.encode("8BIM");
const EXTENDED_XMP = encoder.encode("http://ns.adobe.com/xmp/extension/\0");
const ICC_IDENTIFIER = encoder.encode("ICC_PROFILE\0");

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}

function segment(marker: number, payload: Uint8Array): Uint8Array {
  const output = new Uint8Array(payload.length + 4);
  output.set([0xff, marker, (payload.length + 2) >>> 8, (payload.length + 2) & 0xff], 0);
  output.set(payload, 4);
  return output;
}

function sof(marker = 0xc0, width = 4, height = 3): Uint8Array {
  return segment(marker, Uint8Array.of(8, height >>> 8, height & 0xff, width >>> 8, width & 0xff, 1, 1, 0x11, 0));
}

function sos(): Uint8Array { return segment(0xda, Uint8Array.of(1, 1, 0, 0, 0x3f, 0)); }

function syntheticJpeg(metadata: readonly Uint8Array[] = [], progressive = false, trailing = Uint8Array.of()): { readonly bytes: Uint8Array; readonly scans: readonly Uint8Array[] } {
  const scans = progressive ? [Uint8Array.of(1, 0xff, 0, 2), Uint8Array.of(3, 0xff, 0xd0, 4)] : [Uint8Array.of(1, 2, 3, 0xff, 0, 4)];
  const parts: Uint8Array[] = [Uint8Array.of(0xff, 0xd8), ...metadata, sof(progressive ? 0xc2 : 0xc0)];
  for (const scan of scans) parts.push(sos(), scan);
  parts.push(Uint8Array.of(0xff, 0xd9), trailing);
  return { bytes: concat(...parts), scans };
}

function minimalExif(make = "Writer"): Uint8Array {
  const text = encoder.encode(`${make}\0`);
  const tiff = new Uint8Array(8 + 2 + 12 + 4 + text.length);
  tiff.set([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0], 0);
  tiff[8] = 1;
  tiff[10] = 0x0f;
  tiff[11] = 0x01;
  tiff[12] = 0x02;
  tiff[14] = text.length;
  const valueOffset = 8 + 2 + 12 + 4;
  tiff[18] = valueOffset;
  tiff.set(text, valueOffset);
  return concat(EXIF, tiff);
}

function profile(length = 132): Uint8Array {
  const bytes = new Uint8Array(length);
  bytes[0] = (length >>> 24) & 0xff; bytes[1] = (length >>> 16) & 0xff; bytes[2] = (length >>> 8) & 0xff; bytes[3] = length & 0xff;
  bytes.set([0x61, 0x63, 0x73, 0x70], 36);
  return bytes;
}

function iptc(): Uint8Array { return Uint8Array.of(0x1c, 2, 5, 0, 3, 65, 66, 67); }

function photoshopResource(id: number, data: Uint8Array): Uint8Array {
  const nameBytes = Uint8Array.of(0);
  const nameArea = 1 + nameBytes.length;
  const paddedNameArea = nameArea + (nameArea & 1);
  const paddedData = data.length & 1;
  const output = new Uint8Array(4 + 2 + paddedNameArea + 4 + data.length + paddedData);
  let offset = 0;
  output.set(RESOURCE, offset); offset += RESOURCE.length;
  output[offset] = id >>> 8; output[offset + 1] = id & 0xff; offset += 2;
  output[offset] = nameBytes.length; offset += 1;
  output.set(nameBytes, offset); offset += nameBytes.length;
  offset += paddedNameArea - nameArea;
  output[offset] = data.length >>> 24; output[offset + 1] = (data.length >>> 16) & 0xff; output[offset + 2] = (data.length >>> 8) & 0xff; output[offset + 3] = data.length & 0xff; offset += 4;
  output.set(data, offset);
  return output;
}

function photoshopPayload(resources: readonly Uint8Array[]): Uint8Array { return concat(PHOTOSHOP, ...resources); }

function findSequence(bytes: Uint8Array, sequence: Uint8Array): number {
  outer: for (let offset = 0; offset <= bytes.length - sequence.length; offset += 1) {
    for (let index = 0; index < sequence.length; index += 1) if (bytes[offset + index] !== sequence[index]) continue outer;
    return offset;
  }
  return -1;
}

afterAll(async () => { await exiftool.end(); });

describe("W03 transactional JPEG metadata editing", () => {
  it("sets EXIF through W02 while preserving scan bytes, frame markers, and trailing bytes", async () => {
    const fixture = syntheticJpeg([segment(0xe1, minimalExif("Before")), segment(0xfe, encoder.encode("comment"))], true, Uint8Array.of(9, 8, 7));
    const before = fixture.bytes.slice();
    const result = await editMetadata(fixture.bytes, {
      operations: [{ op: "set", operationId: "make", target: { kind: "field", fieldId: "normalized:Make" }, value: "After" }],
    });
    expect(result.successful).toBe(true);
    if (!result.successful) throw new Error("JPEG EXIF edit did not complete");
    expect(fixture.bytes).toEqual(before);
    expect(parseJpeg(result.data, DEFAULT_LIMITS).fields.find((field) => field.name === "Make")?.value).toBe("After");
    for (const scan of fixture.scans) expect(findSequence(result.data, scan)).toBeGreaterThan(-1);
    expect(result.data.slice(-3)).toEqual(Uint8Array.of(9, 8, 7));
    expect(result.output?.payloads.every((payload) => payload.comparable)).toBe(true);
    expect(result.output?.payloads.every((payload) => payload.beforeSha256 !== null && payload.afterSha256 !== null && /^[a-f0-9]{64}$/u.test(payload.beforeSha256) && /^[a-f0-9]{64}$/u.test(payload.afterSha256))).toBe(true);
    expect(result.output?.byteChanges.some((change) => change.kind === "rewritten")).toBe(true);

    const deleted = await editMetadata(fixture.bytes, {
      operations: [{ op: "delete", operationId: "make", target: { kind: "field", fieldId: "normalized:Make" } }],
    });
    expect(deleted.successful).toBe(true);
    if (!deleted.successful) throw new Error("JPEG EXIF delete did not complete");
    expect(parseJpeg(deleted.data, DEFAULT_LIMITS).fields.some((field) => field.name === "Make")).toBe(false);
  });

  it("adds and replaces standard XMP, ICC, and IPTC blocks with package reparsing", () => {
    const fixture = syntheticJpeg().bytes;
    const blockEdits = [
      { op: "add" as const, kind: "standard-xmp" as const, data: "<x:xmpmeta xmlns:x=\"adobe\"/>" },
      { op: "add" as const, kind: "icc" as const, data: profile() },
      { op: "add" as const, kind: "iptc" as const, data: iptc() },
    ];
    const added = rewriteJpegMetadata(fixture, { blocks: blockEdits });
    const parsed = parseJpeg(added.data, DEFAULT_LIMITS);
    expect(parsed.xmp?.packets).toEqual(["<x:xmpmeta xmlns:x=\"adobe\"/>"]);
    expect(parsed.icc?.complete).toBe(true);
    expect(parsed.iptc?.byteLength).toBe(8);

    const replaced = rewriteJpegMetadata(added.data, {
      blocks: [{ op: "replace", kind: "standard-xmp", data: "<x:xmpmeta xmlns:x=\"adobe\">replacement</x:xmpmeta>" }],
    });
    expect(parseJpeg(replaced.data, DEFAULT_LIMITS).xmp?.packets).toEqual(["<x:xmpmeta xmlns:x=\"adobe\">replacement</x:xmpmeta>"]);

    const appended = rewriteJpegMetadata(replaced.data, { blocks: [{ op: "add", kind: "standard-xmp", data: "second" }] });
    expect(parseJpeg(appended.data, DEFAULT_LIMITS).xmp?.packets).toEqual(["<x:xmpmeta xmlns:x=\"adobe\">replacement</x:xmpmeta>", "second"]);
  });

  it("splits and reassembles an oversized ICC profile when replacing its complete sequence", () => {
    const fixture = syntheticJpeg().bytes;
    const first = rewriteJpegMetadata(fixture, { blocks: [{ op: "add", kind: "icc", data: profile(70_000) }] });
    expect(parseJpeg(first.data, DEFAULT_LIMITS).icc?.complete).toBe(true);
    const replaced = rewriteJpegMetadata(first.data, { blocks: [{ op: "replace", kind: "icc", data: profile(70_000) }] });
    const parsed = parseJpeg(replaced.data, DEFAULT_LIMITS);
    expect(parsed.icc?.complete).toBe(true);
    expect(parsed.icc?.byteLength).toBe(70_000);
  });

  it("replaces IPTC resources without dropping unrelated Photoshop resources", () => {
    const other = photoshopResource(0x0406, Uint8Array.of(9, 8, 7));
    const fixture = syntheticJpeg([segment(0xed, photoshopPayload([photoshopResource(0x0404, iptc()), other]))]).bytes;
    const result = rewriteJpegMetadata(fixture, { blocks: [{ op: "replace", kind: "iptc", data: Uint8Array.of(0x1c, 2, 5, 0, 1, 90) }] });
    expect(findSequence(result.data, other)).toBeGreaterThan(-1);
    expect(parseJpeg(result.data, DEFAULT_LIMITS).iptc?.byteLength).toBe(6);
    const removed = rewriteJpegMetadata(result.data, { blocks: [{ op: "remove", kind: "iptc" }] });
    expect(parseJpeg(removed.data, DEFAULT_LIMITS).iptc).toBeNull();
    const rawRemoved = rewriteJpegMetadata(syntheticJpeg([segment(0xed, iptc())]).bytes, { blocks: [{ op: "remove", kind: "iptc" }] });
    expect(parseJpeg(rawRemoved.data, DEFAULT_LIMITS).iptc).toBeNull();

    const emptyPhotoshop = syntheticJpeg([segment(0xed, photoshopPayload([]))]).bytes;
    const preservedEmpty = rewriteJpegMetadata(emptyPhotoshop, { blocks: [{ op: "remove", kind: "iptc" }] });
    expect(preservedEmpty.data).toEqual(emptyPhotoshop);

    const duplicateIptc = syntheticJpeg([segment(0xed, photoshopPayload([photoshopResource(0x0404, iptc())])), segment(0xed, photoshopPayload([photoshopResource(0x0404, iptc())]))]).bytes;
    const deduplicated = rewriteJpegMetadata(duplicateIptc, { blocks: [{ op: "replace", kind: "iptc", data: iptc() }], duplicatePolicy: "deduplicate-equivalent" });
    expect(parseJpeg(deduplicated.data, DEFAULT_LIMITS).blocks?.filter((block) => block.family === "IPTC")).toHaveLength(1);
  });

  it("chunks and reassembles Extended XMP without changing entropy data", () => {
    const guid = "0123456789ABCDEF0123456789ABCDEF";
    const standard = `<x:xmpmeta xmlns:x="adobe" xmpNote:HasExtendedXMP="${guid}"/>`;
    const logical = `<rdf:RDF>${"x".repeat(70_000)}</rdf:RDF>`;
    const fixture = syntheticJpeg().bytes;
    const result = rewriteJpegMetadata(fixture, {
      blocks: [
        { op: "add", kind: "standard-xmp", data: standard },
        { op: "add", kind: "extended-xmp", guid, data: logical },
      ],
    });
    const parsed = parseJpeg(result.data, DEFAULT_LIMITS);
    expect(parsed.xmp?.packets).toEqual([standard, logical]);
    expect(findSequence(result.data, encoder.encode(logical.slice(0, 128)))).toBeGreaterThan(-1);
    const removed = rewriteJpegMetadata(result.data, { blocks: [{ op: "remove", kind: "standard-xmp" }, { op: "remove", kind: "extended-xmp", guid }] });
    expect(parseJpeg(removed.data, DEFAULT_LIMITS).xmp).toBeNull();
  });

  it("removes all XMP blocks, preserves unrelated APP markers, and reports exact changes", () => {
    const fixture = syntheticJpeg([segment(0xe1, concat(XMP, encoder.encode("one"))), segment(0xe1, concat(XMP, encoder.encode("two"))), segment(0xee, encoder.encode("Adobe"))]).bytes;
    const result = rewriteJpegMetadata(fixture, { blocks: [{ op: "remove", kind: "standard-xmp" }] });
    expect(parseJpeg(result.data, DEFAULT_LIMITS).xmp).toBeNull();
    expect(findSequence(result.data, encoder.encode("Adobe"))).toBeGreaterThan(-1);
    expect(result.byteChanges.filter((change) => change.kind === "removed")).toHaveLength(2);
    const deduplicated = rewriteJpegMetadata(fixture, { blocks: [{ op: "replace", kind: "standard-xmp", data: "same" }], duplicatePolicy: "deduplicate-equivalent" });
    expect(parseJpeg(deduplicated.data, DEFAULT_LIMITS).xmp?.packets).toEqual(["same"]);
  });

  it("supports physical block selectors and explicit duplicate policies", () => {
    const fixture = syntheticJpeg([segment(0xe1, concat(XMP, encoder.encode("one"))), segment(0xe1, concat(XMP, encoder.encode("two")))]).bytes;
    const first = (parseJpeg(fixture, DEFAULT_LIMITS).blocks ?? []).find((block) => block.family === "XMP");
    if (first === undefined) throw new Error("synthetic XMP block was not indexed");
    const replaced = rewriteJpegMetadata(fixture, { blocks: [{ op: "replace", kind: "standard-xmp", blockId: first.id, data: "first" }] });
    expect(parseJpeg(replaced.data, DEFAULT_LIMITS).xmp?.packets).toEqual(["first", "two"]);
    expect(() => rewriteJpegMetadata(fixture, { blocks: [{ op: "replace", kind: "standard-xmp", data: "nope" }], duplicatePolicy: "reject" })).toThrow(JpegWriterError);
    const firstOnly = rewriteJpegMetadata(fixture, { blocks: [{ op: "replace", kind: "standard-xmp", data: "first-only" }], duplicatePolicy: "replace-target" });
    expect(parseJpeg(firstOnly.data, DEFAULT_LIMITS).xmp?.packets).toEqual(["first-only", "two"]);
  });

  it("fails closed for MPF, Ultra HDR, JUMBF/APP11, malformed input, and output limits", async () => {
    const mpf = syntheticJpeg([segment(0xe2, concat(encoder.encode("MPF\0"), Uint8Array.of(1))) ]).bytes;
    expect(() => rewriteJpegMetadata(mpf, { blocks: [{ op: "add", kind: "standard-xmp", data: "x" }] })).toThrow(/MPF/);
    const hdr = syntheticJpeg([segment(0xe1, concat(XMP, encoder.encode("hdrgm:Version=1"))) ]).bytes;
    const hdrResult = await editMetadata(hdr, { operations: [{ op: "set", operationId: "xmp", target: { kind: "field", fieldId: "XMP:standard" }, value: "replacement" }] });
    expect(hdrResult.successful).toBe(false);
    expect(hdrResult.status).toBe("unsupported");
    const jumbf = syntheticJpeg([segment(0xeb, encoder.encode("JPjumb"))]).bytes;
    expect(() => rewriteJpegMetadata(jumbf, { blocks: [{ op: "add", kind: "standard-xmp", data: "x" }] })).toThrow(/JUMBF/);
    const malformed = Uint8Array.of(0xff, 0xd8, 0xff, 0xe1, 0, 8, 1);
    expect(() => rewriteJpegMetadata(malformed, { blocks: [{ op: "add", kind: "standard-xmp", data: "x" }] })).toThrow(JpegWriterError);
    const invalidXmp = syntheticJpeg([segment(0xe1, concat(XMP, Uint8Array.of(0xff))) ]).bytes;
    expect(() => rewriteJpegMetadata(invalidXmp, { blocks: [{ op: "add", kind: "standard-xmp", data: "x" }] })).toThrow(/UTF-8/);
    expect(() => rewriteJpegMetadata(syntheticJpeg().bytes, { blocks: [{ op: "add", kind: "standard-xmp", data: "too large" }], limits: { maxAdapterOutputBytes: syntheticJpeg().bytes.length } })).toThrow(/output limit/);
  });

  it("rejects malformed marker layouts, metadata identities, values, and security-limit violations", () => {
    const edit = { op: "add" as const, kind: "standard-xmp" as const, data: "x" };
    expect(() => rewriteJpegMetadata(syntheticJpeg().bytes, undefined as never)).toThrow(/options/);
    expect(() => rewriteJpegMetadata(Uint8Array.of(), { blocks: [edit] })).toThrow(/SOI/);
    expect(() => rewriteJpegMetadata(Uint8Array.of(0xff, 0xd8, 0xff, 0xd8), { blocks: [edit] })).toThrow(/second SOI/);
    expect(() => rewriteJpegMetadata(Uint8Array.of(0xff, 0xd8, 0xff, 0xd0), { blocks: [edit] })).toThrow(/standalone/);
    expect(() => rewriteJpegMetadata(Uint8Array.of(0xff, 0xd8, 0xff, 0xe1, 0), { blocks: [edit] })).toThrow(/truncated/);
    expect(() => rewriteJpegMetadata(Uint8Array.of(0xff, 0xd8, 0xff, 0xe1, 0, 1), { blocks: [edit] })).toThrow(/smaller/);
    const withoutEoi = syntheticJpeg().bytes.slice(0, -2);
    expect(() => rewriteJpegMetadata(withoutEoi, { blocks: [edit] })).toThrow(/no terminating marker|no EOI/);
    const badSof = concat(Uint8Array.of(0xff, 0xd8), segment(0xc0, Uint8Array.of(8, 0, 3, 0, 4, 1)));
    expect(() => rewriteJpegMetadata(badSof, { blocks: [edit] })).toThrow(/start-of-frame/);
    const badSos = concat(Uint8Array.of(0xff, 0xd8), sof(), segment(0xda, Uint8Array.of(0, 1, 0, 0, 0x3f, 0)));
    expect(() => rewriteJpegMetadata(badSos, { blocks: [edit] })).toThrow(/start-of-scan/);
    const dnl = concat(Uint8Array.of(0xff, 0xd8), sof(), sos(), Uint8Array.of(1, 2, 3), segment(0xdc, Uint8Array.of(0, 3)), Uint8Array.of(0xff, 0xd9));
    expect(() => rewriteJpegMetadata(dnl, { blocks: [edit] })).toThrow(/DNL/);

    expect(() => rewriteJpegMetadata(syntheticJpeg().bytes, { blocks: [] })).toThrow(/at least one/);
    expect(() => rewriteJpegMetadata(syntheticJpeg().bytes, { blocks: [{ op: "replace", kind: "extended-xmp", guid: "bad", data: "x" }] })).toThrow(/32-hex/);
    expect(() => rewriteJpegMetadata(syntheticJpeg().bytes, { blocks: [{ op: "add", kind: "standard-xmp", blockId: "not-add", data: "x" }] })).toThrow(/add operations/);
    expect(() => rewriteJpegMetadata(syntheticJpeg().bytes, { blocks: [{ op: "remove", kind: "standard-xmp", guid: "0123456789ABCDEF0123456789ABCDEF" }] })).toThrow(/Only Extended/);
    expect(() => rewriteJpegMetadata(syntheticJpeg().bytes, { blocks: [{ op: "remove", kind: "extended-xmp", guid: "0123456789ABCDEF0123456789ABCDEF", blockId: "physical-chunk" }] })).toThrow(/logical sequence/);
    expect(() => rewriteJpegMetadata(syntheticJpeg().bytes, { blocks: [{ op: "remove", kind: "standard-xmp", data: "x" }] })).toThrow(/cannot include data/);
    expect(() => rewriteJpegMetadata(syntheticJpeg().bytes, { blocks: [null as never] })).toThrow(/block edits/);
    expect(() => rewriteJpegMetadata(syntheticJpeg().bytes, { blocks: [{ op: "add", kind: "standard-xmp", data: 3 as never }] })).toThrow(/string or Uint8Array/);
    expect(() => rewriteJpegMetadata(syntheticJpeg().bytes, { blocks: [edit], verify: "yes" as never })).toThrow(/verify/);
    expect(() => rewriteJpegMetadata(syntheticJpeg().bytes, { blocks: [edit], duplicatePolicy: "first" as never })).toThrow(/duplicatePolicy/);
    expect(() => rewriteJpegMetadata(syntheticJpeg().bytes, { blocks: [{ op: "add", kind: "standard-xmp", data: new Uint8Array([0xff]) }] })).toThrow(/UTF-8/);
    expect(() => rewriteJpegMetadata(syntheticJpeg().bytes, { blocks: [{ op: "add", kind: "standard-xmp", data: "long" }], limits: { maxStringBytes: 2 } })).toThrow(/string limit/);
    expect(() => rewriteJpegMetadata(syntheticJpeg().bytes, { blocks: [{ op: "add", kind: "icc", data: profile().slice(0, 131) }] })).toThrow(/complete header/);
    expect(() => rewriteJpegMetadata(syntheticJpeg().bytes, { blocks: [{ op: "add", kind: "icc", data: profile() }], limits: { maxSegmentBytes: 10 } })).toThrow(/no room/);
    const malformedPhotoshop = syntheticJpeg([segment(0xed, concat(PHOTOSHOP, RESOURCE))]).bytes;
    expect(() => rewriteJpegMetadata(malformedPhotoshop, { blocks: [edit] })).toThrow(/Photoshop/);
    const malformedIcc = syntheticJpeg([segment(0xe2, concat(ICC_IDENTIFIER, Uint8Array.of(1, 2))) ]).bytes;
    expect(() => rewriteJpegMetadata(malformedIcc, { blocks: [edit] })).toThrow(/ICC_PROFILE/);
    const malformedExtended = syntheticJpeg([segment(0xe1, concat(EXTENDED_XMP, encoder.encode("0123456789ABCDEF0123456789ABCDEF"), Uint8Array.of(0, 0, 0, 1, 0, 0, 0, 0))) ]).bytes;
    expect(() => rewriteJpegMetadata(malformedExtended, { blocks: [edit] })).toThrow(/Extended XMP/);
    const tem = syntheticJpeg([Uint8Array.of(0xff, 0x01)]).bytes;
    expect(rewriteJpegMetadata(tem, { blocks: [edit], verify: false }).data).not.toEqual(tem);
  });

  it("creates a new EXIF APP1 for a supported normalized field and rolls back on verification failure", async () => {
    const fixture = syntheticJpeg().bytes;
    const result = await editMetadata(fixture, {
      operations: [{ op: "set", operationId: "make", target: { kind: "field", fieldId: "normalized:Make" }, value: "New camera" }],
    });
    expect(result.successful).toBe(true);
    if (!result.successful) throw new Error("new EXIF edit did not complete");
    expect(parseJpeg(result.data, DEFAULT_LIMITS).fields.find((field) => field.name === "Make")?.value).toBe("New camera");

    const before = fixture.slice();
    const failed = await editMetadata(fixture, {
      operations: [
        { op: "set", operationId: "make", target: { kind: "field", fieldId: "normalized:Make" }, value: "New camera" },
        { op: "set", operationId: "bad", target: { kind: "field", fieldId: "XMP:extended:00000000000000000000000000000000" }, value: "orphan" },
      ],
    });
    expect(failed.successful).toBe(false);
    expect(failed.data).toBeNull();
    expect(fixture).toEqual(before);
    expect(failed.operations.find((operation) => operation.operationId === "make")?.status).toBe("verification-failure");
  });

  it("adds a missing standard XMP block through the trust-first transaction", async () => {
    const fixture = syntheticJpeg().bytes;
    const packet = "<x:xmpmeta xmlns:x=\"adobe\"/>";
    const result = await editMetadata(fixture, {
      operations: [{ op: "set", operationId: "xmp", target: { kind: "field", fieldId: "XMP:standard" }, value: packet }],
    });
    expect(result.successful).toBe(true);
    if (!result.successful) throw new Error("standard XMP edit did not complete");
    expect(parseJpeg(result.data, DEFAULT_LIMITS).xmp?.packets).toEqual([packet]);
  });

  it("is accepted by ExifTool after an EXIF edit on a real JPEG fixture", async () => {
    const input = new Uint8Array(await readFile(new URL("./fixtures/jpeg-exif-little-endian.jpg", import.meta.url)));
    const result = await editMetadata(input, {
      operations: [{ op: "set", operationId: "make", target: { kind: "field", fieldId: "normalized:Make" }, value: "W03 Camera" }],
    });
    expect(result.successful).toBe(true);
    if (!result.successful) throw new Error("real JPEG edit did not complete");
    const directory = await mkdtemp(join(tmpdir(), "w03-jpeg-"));
    const pathname = join(directory, "edited.jpg");
    try {
      await writeFile(pathname, result.data);
      const external = await exiftool.read(pathname);
      expect(external.Make).toBe("W03 Camera");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
