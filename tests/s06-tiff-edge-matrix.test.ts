import { describe, expect, it } from "vitest";

import { parseTiffGraph, rewriteTiff, serializeTiff } from "../src/index.js";
import { TiffSerializationError } from "../src/tiff.js";
import type { TiffGraph, TiffGraphDirectory } from "../src/types.js";

function graph(byteOrder: "little-endian" | "big-endian", variant: "classic" | "big-tiff"): TiffGraph {
  const child: TiffGraphDirectory = {
    id: "exif", nextDirectoryId: "thumb", entries: [
      { id: "ascii", tag: 0x010f, type: "ASCII", value: { kind: "text", value: "Camera", nulTerminated: true } },
      { id: "bytes", tag: 0xc001, type: "BYTE", value: { kind: "numbers", values: [0, 1, 255] } },
      { id: "signed", tag: 0xc002, type: "SLONG", value: { kind: "numbers", values: [{ decimal: "-3", signed: true }] } },
      { id: "rationals", tag: 0xc003, type: "RATIONAL", value: { kind: "rationals", values: [{ numerator: 1, denominator: 2 }, { numerator: 3, denominator: 4 }] } },
      { id: "srationals", tag: 0xc004, type: "SRATIONAL", value: { kind: "rationals", values: [{ numerator: -1, denominator: 3 }] } },
      { id: "floats", tag: 0xc005, type: "FLOAT", value: { kind: "floats", values: [1.25, -2.5] } },
      { id: "doubles", tag: 0xc006, type: "DOUBLE", value: { kind: "floats", values: [Math.PI] } },
      { id: "raw", tag: 0xc007, type: "UNDEFINED", value: { kind: "raw", bytes: Uint8Array.of(9, 8, 7), count: 3 } },
      { id: "utf8", tag: 0xc008, type: "UTF-8", value: { kind: "text", value: "Δ", nulTerminated: false } },
    ],
  };
  const thumb: TiffGraphDirectory = { id: "thumb", nextDirectoryId: null, entries: [{ id: "compression", tag: 0x0103, type: "SHORT", value: { kind: "numbers", values: [6] } }] };
  const root: TiffGraphDirectory = {
    id: "root", nextDirectoryId: null, entries: [
      { id: "width", tag: 0x0100, type: variant === "classic" ? "LONG" : "LONG8", value: { kind: "numbers", values: [640] } },
      { id: "height", tag: 0x0101, type: variant === "classic" ? "LONG" : "LONG8", value: { kind: "numbers", values: [480] } },
      { id: "pointer", tag: 0x8769, type: variant === "classic" ? "IFD" : "IFD8", value: { kind: "directory-references", directoryIds: ["exif"] } },
      { id: "unknown", tag: 0xc009, type: "UNKNOWN", typeCode: 7, value: { kind: "raw", bytes: Uint8Array.of(1, 2, 3) } },
    ],
  };
  return { byteOrder, variant, rootDirectoryId: "root", directories: [root, child, thumb], preservedData: [] };
}

function expectTiffFailure(bytes: Uint8Array): void {
  expect(() => parseTiffGraph(bytes)).toThrow(TiffSerializationError);
}

describe("S06 TIFF graph and serialization boundaries", () => {
  it("round-trips every supported value family, byte order, directory relation, and variant", () => {
    for (const byteOrder of ["little-endian", "big-endian"] as const) for (const variant of ["classic", "big-tiff"] as const) {
      const input = graph(byteOrder, variant);
      const bytes = serializeTiff(input);
      const parsed = parseTiffGraph(bytes);
      expect(parsed.byteOrder).toBe(byteOrder);
      expect(parsed.variant).toBe(variant);
      expect(parsed.directories).toHaveLength(3);
      expect(parsed.directories.flatMap(({ entries }) => entries).map(({ value }) => value.kind)).toEqual(expect.arrayContaining(["raw", "directory-references"]));
      expect(parsed.directories[0]?.entries.find(({ tag }) => tag === 0x8769)?.value).toMatchObject({ kind: "directory-references" });
      expect(serializeTiff(parsed)).toEqual(bytes);
    }
  });

  it("preserves and rewrites image-data ranges without confusing them with directory ranges", () => {
    const input = graph("little-endian", "classic");
    const withPayload: TiffGraph = { ...input, preservedData: [{ id: "payload", sourceOffset: 200, data: Uint8Array.of(0xaa, 0xbb), kind: "thumbnail" }] };
    const bytes = serializeTiff(withPayload);
    const parsed = parseTiffGraph(bytes);
    expect(parsed.preservedData.every(({ data }) => data.length > 0)).toBe(true);
    const rewritten = rewriteTiff(bytes, { edits: [{ op: "set", directoryId: parsed.rootDirectoryId, tag: 0x010f, type: "ASCII", value: { kind: "text", value: "Edited" } }] });
    expect(parseTiffGraph(rewritten).directories.flatMap(({ entries }) => entries).some(({ value }) => value.kind === "raw" && value.bytes.includes(69))).toBe(true);
    expect(rewriteTiff(bytes, { edits: [], duplicatePolicy: "preserve", ordering: "preserve-source" })).toBeInstanceOf(Uint8Array);
    expect(rewriteTiff(bytes, { edits: [], duplicatePolicy: "deduplicate-equivalent", ordering: "canonical" })).toBeInstanceOf(Uint8Array);
  });

  it("rejects malformed headers, directory tables, types, ranges, and unsafe limits with typed failures", () => {
    const valid = serializeTiff(graph("little-endian", "classic"));
    const cases: Uint8Array[] = [
      new Uint8Array(), Uint8Array.of(0x49, 0x49, 42), Uint8Array.of(0x49, 0x4d, 42, 0, 8, 0, 0, 0),
      Uint8Array.from([0x49, 0x49, 0x2b, 0, 4, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0]),
      Uint8Array.from([0x49, 0x49, 42, 0, 4, 0, 0, 0]),
      valid.slice(0, 9),
    ];
    for (const bytes of cases) expectTiffFailure(bytes);
    const badType = valid.slice(); badType[12] = 16; badType[13] = 0; expectTiffFailure(badType);
    const badPointer = valid.slice(); badPointer[42] = 0xff; badPointer[43] = 0xff; badPointer[44] = 0xff; badPointer[45] = 0x7f; expectTiffFailure(badPointer);
    expect(() => parseTiffGraph(valid, { limits: { maxInputBytes: 1 } })).toThrow(TiffSerializationError);
  });

  it("rejects contradictory graph definitions before allocating output", () => {
    const base = graph("little-endian", "classic");
    const rootDirectory = base.directories[0];
    if (!rootDirectory) throw new Error("TIFF graph fixture has no root directory");
    const invalidGraphs: TiffGraph[] = [
      { ...base, rootDirectoryId: "missing" },
      { ...base, directories: [] },
      { ...base, directories: [{ ...rootDirectory, entries: [{ id: "bad", tag: 1, type: "LONG8", value: { kind: "numbers", values: [1] } }] }] },
      { ...base, directories: [{ ...rootDirectory, entries: [{ id: "bad", tag: 1, type: "UNKNOWN", typeCode: 0, value: { kind: "raw", bytes: Uint8Array.of(1) } }] }] },
    ];
    for (const invalid of invalidGraphs) expect(() => serializeTiff(invalid)).toThrow(TiffSerializationError);
    expect(() => serializeTiff(base, { maxOutputBytes: 1 })).toThrow(TiffSerializationError);
  });
});
