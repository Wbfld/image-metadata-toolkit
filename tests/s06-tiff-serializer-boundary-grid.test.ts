import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { parseTiffGraph, rewriteTiff, serializeTiff } from "../src/index.js";
import { TiffSerializationError } from "../src/tiff.js";
import { resolveLimits } from "../src/security/limits.js";
import type { TiffEntryValue, TiffGraph, TiffGraphEntry } from "../src/types.js";

function baseGraph(entry: TiffGraphEntry = { tag: 0xc000, type: "LONG", value: { kind: "numbers", values: [1] } }): TiffGraph {
  return {
    byteOrder: "little-endian",
    variant: "classic",
    rootDirectoryId: "root",
    directories: [{ id: "root", nextDirectoryId: null, entries: [entry] }],
    preservedData: [],
  };
}

function fails(candidate: unknown, expected: TiffSerializationError["code"]): void {
  expect(() => serializeTiff(candidate as TiffGraph)).toThrow(expect.objectContaining({ name: "TiffSerializationError", code: expected }));
}

function withValue(type: TiffGraphEntry["type"], value: TiffEntryValue, extra: Partial<TiffGraphEntry> = {}): TiffGraph {
  return baseGraph({ tag: 0xc000, type, value, ...extra });
}

describe("S06 TIFF serialization boundary grid", () => {
  it("rejects incompatible value families, type codes, counts, and raw lengths", () => {
    fails(withValue("LONG", { kind: "text", value: "wrong" }), "INVALID_VALUE");
    fails(withValue("ASCII", { kind: "numbers", values: [1] }), "INVALID_VALUE");
    fails(withValue("LONG", { kind: "rationals", values: [{ numerator: 1, denominator: 2 }] }), "INVALID_VALUE");
    fails(withValue("LONG", { kind: "floats", values: [1.5] }), "INVALID_VALUE");
    fails(withValue("SHORT", { kind: "raw", bytes: Uint8Array.of(1) }), "INVALID_VALUE");
    fails(withValue("LONG", { kind: "numbers", values: [1] }, { count: 2 }), "INVALID_VALUE");
    fails(withValue("LONG", { kind: "numbers", values: [1] }, { typeCode: 3 }), "INVALID_VALUE");
    fails(withValue("LONG8", { kind: "numbers", values: [1] }), "INVALID_VALUE");
    fails(withValue("UNKNOWN", { kind: "raw", bytes: Uint8Array.of(1) }, { typeCode: 0 }), "INVALID_VALUE");
    fails(withValue("ASCII", { kind: "text", value: "café" }), "INVALID_VALUE");
    fails(withValue("ASCII", { kind: "text", value: "embedded\0nul" }), "INVALID_VALUE");
    fails(withValue("LONG", { kind: "directory-references", directoryIds: ["root"] }), "INVALID_VALUE");
    fails(withValue("LONG", { kind: "data-references", dataIds: ["payload"] }, { tag: 0x0201 }), "UNSAFE_STRUCTURE");
    fails(withValue("LONG", { kind: "numbers", values: [1] }, { tag: 0x0100, count: 0 }), "INVALID_VALUE");
  });

  it("validates every integer width, signedness, lexical form, and range", () => {
    fails(withValue("BYTE", { kind: "numbers", values: [-1] }), "INVALID_VALUE");
    fails(withValue("BYTE", { kind: "numbers", values: [256] }), "INVALID_VALUE");
    fails(withValue("SBYTE", { kind: "numbers", values: [-129] }), "INVALID_VALUE");
    fails(withValue("SBYTE", { kind: "numbers", values: [128] }), "INVALID_VALUE");
    fails(withValue("SHORT", { kind: "numbers", values: [-1] }), "INVALID_VALUE");
    fails(withValue("SHORT", { kind: "numbers", values: [65536] }), "INVALID_VALUE");
    fails(withValue("SSHORT", { kind: "numbers", values: [-32769] }), "INVALID_VALUE");
    fails(withValue("SSHORT", { kind: "numbers", values: [32768] }), "INVALID_VALUE");
    fails(withValue("LONG", { kind: "numbers", values: [-1] }), "INVALID_VALUE");
    fails(withValue("LONG", { kind: "numbers", values: [0x100000000] }), "INVALID_VALUE");
    fails(withValue("SLONG", { kind: "numbers", values: [-2147483649] }), "INVALID_VALUE");
    fails(withValue("SLONG", { kind: "numbers", values: [2147483648] }), "INVALID_VALUE");
    fails(withValue("LONG8", { kind: "numbers", values: [{ signed: true, decimal: "1" }] }, { tag: 0xc001, typeCode: 16 }), "INVALID_VALUE");
    const big: TiffGraph = { ...baseGraph(), variant: "big-tiff", directories: [{ id: "root", nextDirectoryId: null, entries: [{ tag: 0xc001, type: "LONG8", value: { kind: "numbers", values: [{ signed: true, decimal: "1" }] } }] }] };
    fails({ ...big, directories: [{ ...big.directories[0], entries: [{ tag: 0xc001, type: "LONG8", value: { kind: "numbers", values: [{ signed: true, decimal: "1" }] } }] }] }, "INVALID_VALUE");
    fails({ ...big, directories: [{ ...big.directories[0], entries: [{ tag: 0xc001, type: "LONG8", value: { kind: "numbers", values: [{ signed: true, decimal: "+1" }] } }] }] }, "INVALID_VALUE");
    fails({ ...big, directories: [{ ...big.directories[0], entries: [{ tag: 0xc001, type: "LONG8", value: { kind: "numbers", values: [{ signed: true, decimal: "9223372036854775808" }] } }] }] }, "INVALID_VALUE");
    fails({ ...big, directories: [{ ...big.directories[0], entries: [{ tag: 0xc001, type: "SLONG8", value: { kind: "numbers", values: [{ signed: true, decimal: "-9223372036854775809" }] } }] }] }, "INVALID_VALUE");
    fails(withValue("LONG", { kind: "numbers", values: [Number.NaN] }), "INVALID_VALUE");
  });

  it("validates text, rational, floating-point, and bounded value limits", () => {
    fails(withValue("RATIONAL", { kind: "rationals", values: [{ numerator: Number.MAX_SAFE_INTEGER + 1, denominator: 1 }] }), "INVALID_VALUE");
    fails(withValue("RATIONAL", { kind: "rationals", values: [{ numerator: -1, denominator: 1 }] }), "INVALID_VALUE");
    fails(withValue("SRATIONAL", { kind: "rationals", values: [{ numerator: 1.5, denominator: 1 }] }), "INVALID_VALUE");
    fails(withValue("FLOAT", { kind: "floats", values: [Number.NaN] }), "INVALID_VALUE");
    fails(withValue("DOUBLE", { kind: "floats", values: [Number.POSITIVE_INFINITY] }), "INVALID_VALUE");
    fails(withValue("ASCII", { kind: "text", value: "a" }, { count: 3 }), "INVALID_VALUE");
    expect(() => serializeTiff(withValue("UTF-8", { kind: "text", value: "long" }), { maxOutputBytes: 1 })).toThrow(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    expect(() => serializeTiff(withValue("BYTE", { kind: "numbers", values: [1, 2, 3] }), { limits: { maxValueBytes: 2 } })).toThrow(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    expect(() => serializeTiff(withValue("BYTE", { kind: "numbers", values: [1] }), { maxOutputBytes: 0 })).toThrow(expect.objectContaining({ code: "INVALID_VALUE" }));
    expect(() => serializeTiff(withValue("BYTE", { kind: "numbers", values: [1] }), { maxOutputBytes: Number.MAX_SAFE_INTEGER + 1 })).toThrow(expect.objectContaining({ code: "INVALID_VALUE" }));
  });

  it("rejects unsafe pointer targets and preserves exact valid pointer forms", () => {
    fails(withValue("LONG", { kind: "directory-references", directoryIds: ["missing"] }, { tag: 0x8769 }), "UNSAFE_STRUCTURE");
    fails(withValue("LONG", { kind: "directory-references", directoryIds: ["root"] }, { tag: 0xc000 }), "INVALID_VALUE");
    fails(withValue("LONG", { kind: "directory-references", directoryIds: ["root"] }, { tag: 0x8769, count: 2 }), "INVALID_VALUE");
    fails(withValue("LONG", { kind: "data-references", dataIds: ["missing"] }, { tag: 0x0201 }), "UNSAFE_STRUCTURE");
    fails({ ...baseGraph({ tag: 0x0201, type: "LONG", count: 2, value: { kind: "data-references", dataIds: ["payload"] } }), preservedData: [{ id: "payload", sourceOffset: 0, data: Uint8Array.of(1), kind: "opaque" }] }, "INVALID_VALUE");
    const valid: TiffGraph = { ...baseGraph({ tag: 0x8769, type: "LONG", value: { kind: "directory-references", directoryIds: ["child"] } }), directories: [{ id: "root", nextDirectoryId: null, entries: [{ tag: 0x8769, type: "LONG", value: { kind: "directory-references", directoryIds: ["child"] } }] }, { id: "child", nextDirectoryId: null, entries: [] }] };
    expect(serializeTiff(valid).byteLength).toBeGreaterThan(0);
    const payload: TiffGraph = { ...baseGraph({ tag: 0x0201, type: "LONG", value: { kind: "data-references", dataIds: ["payload"] } }), preservedData: [{ id: "payload", sourceOffset: 100, data: Uint8Array.of(1, 2), kind: "thumbnail" }] };
    expect(serializeTiff(payload).byteLength).toBeGreaterThan(0);
  });

  it("rejects malformed graph identity, limits, relationships, and preserved payloads", () => {
    const base = baseGraph();
    fails({ ...base, rootDirectoryId: "missing" }, "INVALID_VALUE");
    fails({ ...base, directories: [] }, "LIMIT_EXCEEDED");
    fails({ ...base, directories: [{ id: "bad/id", nextDirectoryId: null, entries: [] }] }, "INVALID_VALUE");
    fails({ ...base, directories: [{ id: "root", nextDirectoryId: "missing", entries: [] }] }, "UNSAFE_STRUCTURE");
    fails({ ...base, directories: [{ id: "root", nextDirectoryId: null, entries: [{ id: "same", tag: 1, type: "LONG", value: { kind: "numbers", values: [1] } }, { id: "same", tag: 2, type: "LONG", value: { kind: "numbers", values: [2] } }] }] }, "INVALID_VALUE");
    fails({ ...base, directories: [{ id: "root", nextDirectoryId: null, entries: [{ tag: 1, type: "LONG", value: { kind: "numbers", values: [1] } }, { tag: 1, type: "LONG", value: { kind: "numbers", values: [2] } }] }] }, "INVALID_VALUE");
    fails({ ...base, directories: [{ id: "root", nextDirectoryId: null, entries: [{ id: "bad/id", tag: 1, type: "LONG", value: { kind: "numbers", values: [1] } }] }] }, "INVALID_VALUE");
    fails({ ...base, directories: [{ id: "root", nextDirectoryId: null, entries: [{ tag: -1, type: "LONG", value: { kind: "numbers", values: [1] } }] }] }, "INVALID_VALUE");
    fails({ ...base, directories: [{ id: "root", nextDirectoryId: null, entries: [{ tag: 1, type: "LONG", count: -1, value: { kind: "numbers", values: [1] } }] }] }, "INVALID_VALUE");
    fails({ ...base, preservedData: [{ id: "payload", sourceOffset: -1, data: Uint8Array.of(1), kind: "opaque" }] }, "INVALID_VALUE");
    fails({ ...base, preservedData: [{ id: "bad/id", sourceOffset: 0, data: Uint8Array.of(1), kind: "opaque" }] }, "INVALID_VALUE");
    fails({ ...base, preservedData: [{ id: "payload", sourceOffset: 0, data: Uint8Array.of(1), kind: "opaque" }, { id: "payload", sourceOffset: 1, data: Uint8Array.of(2), kind: "opaque" }] }, "INVALID_VALUE");
    fails({ ...base, preservedData: [{ id: "payload", sourceOffset: 0, data: Uint8Array.of(1), kind: "not-a-kind" }] }, "INVALID_VALUE");
    expect(() => serializeTiff({ ...base, preservedData: [{ id: "payload", sourceOffset: 0, data: new Uint8Array(3), kind: "opaque" }] }, { limits: { maxMetadataBytes: 2 } })).toThrow(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    const manyEntries: TiffGraphEntry[] = Array.from({ length: 3 }, (_, index) => ({ tag: 0xc000 + index, type: "LONG", value: { kind: "numbers", values: [index] } }));
    const rootDirectory = base.directories[0];
    if (!rootDirectory) throw new Error("TIFF graph fixture has no root directory");
    expect(() => serializeTiff({ ...base, directories: [{ ...rootDirectory, entries: manyEntries }] }, { limits: { maxIfdEntries: 2 } })).toThrow(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
  });

  it("checks every prefix of repository TIFF fixtures through the graph parser", async () => {
    const names = ["tiff-metadata.tif", "tiff-exif-little-endian.tif", "tiff-metadata-truncated.tif", "tiff-truncated.tif"];
    for (const name of names) {
      const input = new Uint8Array(await readFile(new URL(`./fixtures/${name}`, import.meta.url)));
      for (let length = 0; length <= input.length; length += 1) {
        try {
          const graph = parseTiffGraph(input.subarray(0, length));
          expect(graph.directories.length).toBeLessThanOrEqual(4096);
          expect(graph.preservedData.length).toBeLessThanOrEqual(4096);
        } catch (error) {
          expect(error).toBeInstanceOf(TiffSerializationError);
          expect((error as TiffSerializationError).code).toMatch(/^(?:INVALID_VALUE|UNSAFE_STRUCTURE|LIMIT_EXCEEDED)$/u);
        }
      }
    }
  });

  it("retains every payload-offset family and remaps multi-target directory pointers", () => {
    const payloads = [
      { id: "strips", tag: 0x0111, lengthTag: 0x0117, kind: "image-data" as const, data: Uint8Array.of(1, 2, 3) },
      { id: "tiles", tag: 0x0144, lengthTag: 0x0145, kind: "image-data" as const, data: Uint8Array.of(4, 5, 6, 7) },
      { id: "jpeg", tag: 0x0201, lengthTag: 0x0202, kind: "thumbnail" as const, data: Uint8Array.of(0xff, 0xd8, 0xff, 0xd9) },
      { id: "subifd-data", tag: 0x0120, lengthTag: 0x0121, kind: "image-data" as const, data: Uint8Array.of(8, 9) },
    ];
    const graphWithPayloads: TiffGraph = {
      byteOrder: "little-endian",
      variant: "classic",
      rootDirectoryId: "root",
      directories: [{
        id: "root",
        nextDirectoryId: "child",
        entries: [
          ...payloads.flatMap(({ tag, lengthTag, id, data }) => [
            { id: `${id}-offset`, tag, type: "LONG" as const, value: { kind: "data-references" as const, dataIds: [id] } },
            { id: `${id}-length`, tag: lengthTag, type: "LONG" as const, value: { kind: "numbers" as const, values: [data.length] } },
          ]),
          { id: "pointer-array", tag: 0x014a, type: "LONG" as const, value: { kind: "directory-references" as const, directoryIds: ["child", "second"] } },
          { id: "unknown-known-type", tag: 0xc7a1, type: "UNKNOWN" as const, typeCode: 7, value: { kind: "raw" as const, bytes: Uint8Array.of(0xaa, 0xbb) } },
        ],
      }, { id: "child", nextDirectoryId: "second", entries: [] }, { id: "second", nextDirectoryId: null, entries: [] }],
      preservedData: payloads.map(({ id, kind, data }, index) => ({ id, sourceOffset: 100 + index, data, kind })),
    };
    const serialized = serializeTiff(graphWithPayloads);
    const parsed = parseTiffGraph(serialized);
    expect(parsed.preservedData.map(({ kind }) => kind)).toEqual(["image-data", "image-data", "image-data", "thumbnail"]);
    const pointer = parsed.directories[0]?.entries.find(({ tag }) => tag === 0x014a);
    expect(pointer?.value).toMatchObject({ kind: "directory-references", directoryIds: parsed.directories.slice(1).map(({ id }) => id) });
    expect(parsed.directories[0]?.entries.find(({ tag }) => tag === 0xc7a1)?.type).toBe("UNDEFINED");
    expect(parsed.directories[0]?.entries.filter(({ value }) => value.kind === "data-references")).toHaveLength(4);
  });

  it("covers occurrence targeting, insertion, typed transaction values, and typed failure results", async () => {
    const source = serializeTiff({
      byteOrder: "little-endian", variant: "classic", rootDirectoryId: "root", preservedData: [], directories: [{
        id: "root", nextDirectoryId: null, entries: [
          { id: "width", tag: 0x0100, type: "LONG", value: { kind: "numbers", values: [1] } },
          { id: "exposure", tag: 0x829a, type: "RATIONAL", value: { kind: "rationals", values: [{ numerator: 1, denominator: 60 }] } },
          { id: "first", tag: 0x010f, type: "ASCII", value: { kind: "text", value: "one" } },
          { id: "second", tag: 0x010f, type: "ASCII", value: { kind: "text", value: "two" } },
        ],
      }],
    });
    const second = rewriteTiff(source, { edits: [{ op: "set", directoryId: "IFD0@8", tag: 0x010f, occurrence: 1, type: "ASCII", value: { kind: "text", value: "changed" } }] });
    expect(parseTiffGraph(second).directories[0]?.entries.filter(({ tag }) => tag === 0x010f).map(({ value }) => value)).toEqual([
      { kind: "raw", bytes: Uint8Array.of(111, 110, 101, 0), count: 4 },
      { kind: "raw", bytes: Uint8Array.of(99, 104, 97, 110, 103, 101, 100, 0), count: 8 },
    ]);
    const deleted = rewriteTiff(second, { edits: [{ op: "delete", directoryId: "IFD0@8", tag: 0x010f, occurrence: 0 }] });
    expect(parseTiffGraph(deleted).directories[0]?.entries.filter(({ tag }) => tag === 0x010f)).toHaveLength(1);
    const inserted = rewriteTiff(source, { edits: [{ op: "set", directoryId: "IFD0@8", tag: 0x0100, type: "LONG", value: { kind: "numbers", values: [640] } }] });
    expect(parseTiffGraph(inserted).directories[0]?.entries.some(({ tag }) => tag === 0x0100)).toBe(true);

    const { applyTiffEditTransaction } = await import("../src/tiff.js");
    const policy = { preserve: [], remove: [], preserveRemovePrecedence: "preserve-wins", unknown: "preserve", ordering: { mode: "preserve-source" }, duplicates: "preserve", conflicts: "reject", verification: "none", orientation: "preserve", overlappingTargets: [] } as const;
    const limits = resolveLimits({ maxInputBytes: source.length + 1024, maxAdapterOutputBytes: source.length + 1024 });
    const arrayNumbers = applyTiffEditTransaction(source, [{ op: "set", operationId: "numbers", target: { kind: "field", fieldId: "EXIF:IFD0:0x0100" }, value: [1, 2] }], policy, limits);
    expect(arrayNumbers.output).not.toBeNull();
    const arrayRationals = applyTiffEditTransaction(source, [{ op: "set", operationId: "rationals", target: { kind: "field", fieldId: "EXIF:IFD0:0x829a" }, value: [{ numerator: 1, denominator: 30 }] }], policy, limits);
    expect(arrayRationals.operations[0]?.status).toBe("applied");
    expect(arrayRationals.output).not.toBeNull();
    const unsupported = applyTiffEditTransaction(source, [{ op: "set", operationId: "family", target: { kind: "selector", selector: { kind: "family", family: "XMP" } }, value: "x" }], policy, limits);
    expect(unsupported.output).toBeNull();
    expect(unsupported.operations[0]?.failure?.code).toBe("UNSUPPORTED_OPERATION");
    expect(() => rewriteTiff(source, { edits: [{ op: "set", directoryId: "missing", tag: 1, type: "LONG", value: { kind: "numbers", values: [1] } }] })).toThrow(expect.objectContaining({ code: "UNSAFE_STRUCTURE" }));
    expect(() => rewriteTiff(source, { edits: [{ op: "set", directoryId: "IFD0@8", tag: 1, occurrence: 5, type: "LONG", value: { kind: "numbers", values: [1] } }] })).toThrow(expect.objectContaining({ code: "INVALID_VALUE" }));
  });

  it("rejects every remaining graph-shape and integer lexical boundary without allocating output", () => {
    const base = baseGraph();
    const candidates: readonly unknown[] = [
      { ...base, directories: [{ id: "root", nextDirectoryId: null, entries: [{ tag: 1, type: "LONG", value: { kind: "numbers", values: [1] }, count: Number.NaN }] }] },
      { ...base, directories: [{ id: "root", nextDirectoryId: null, entries: [{ tag: 1, type: "LONG", value: { kind: "numbers", values: [{ signed: true, decimal: "1" }] } }] }] },
      { ...base, directories: [{ id: "root", nextDirectoryId: null, entries: [{ tag: 1, type: "LONG", typeCode: 4, value: { kind: "raw", bytes: Uint8Array.of(1) } }] }] },
      { ...base, directories: [{ id: "root", nextDirectoryId: null, entries: [{ tag: 1, type: "UTF-8", value: { kind: "raw", bytes: Uint8Array.of(1, 2), count: 1 } }] }] },
      { ...base, directories: [{ id: "root", nextDirectoryId: null, entries: [{ tag: 1, type: "LONG", value: { kind: "numbers", values: [1] } }] }], preservedData: [{ id: "payload", sourceOffset: Number.NaN, data: Uint8Array.of(1), kind: "opaque" }] },
      { ...base, directories: [{ id: "root", nextDirectoryId: null, entries: [{ tag: 1, type: "LONG", value: { kind: "numbers", values: [1] } }] }], preservedData: [{ id: "payload", sourceOffset: 0, data: Uint8Array.of(1), kind: "opaque" }, { id: "payload", sourceOffset: 0, data: Uint8Array.of(2), kind: "opaque" }] },
    ];
    for (const candidate of candidates) expect(() => serializeTiff(candidate as TiffGraph)).toThrow(expect.objectContaining({ name: "TiffSerializationError" }));
  });
});
