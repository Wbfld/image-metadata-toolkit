import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, describe, expect, it } from "vitest";
import { exiftool } from "exiftool-vendored";

import { editMetadata, parseMetadata, parseTiffGraph, rewriteTiff, serializeTiff, tiffEvidence } from "../src/index.js";
import { TiffSerializationError } from "../src/tiff.js";
import type { TiffGraph, TiffGraphDirectory } from "../src/types.js";

const fixtureUrl = new URL("./fixtures/tiff-exif-little-endian.tif", import.meta.url);

afterAll(async () => {
  await exiftool.end();
});

function graph(byteOrder: "little-endian" | "big-endian", variant: "classic" | "big-tiff" = "classic"): TiffGraph {
  const child: TiffGraphDirectory = {
    id: "exif",
    nextDirectoryId: null,
    entries: [
      { id: "exposure", tag: 0x829a, type: "RATIONAL", value: { kind: "rationals", values: [{ numerator: 1, denominator: 125 }] } },
      { id: "curve", tag: 0xc7a1, type: "UNDEFINED", value: { kind: "raw", bytes: Uint8Array.of(0, 1, 2, 3, 4) } },
      { id: "utf8", tag: 0xa40e, type: "UTF-8", value: { kind: "text", value: "Δ 📷" } },
    ],
  };
  const root: TiffGraphDirectory = {
    id: "root",
    nextDirectoryId: null,
    entries: [
      { id: "width", tag: 0x0100, type: variant === "classic" ? "LONG" : "LONG8", value: { kind: "numbers", values: [640] } },
      { id: "height", tag: 0x0101, type: variant === "classic" ? "LONG" : "LONG8", value: { kind: "numbers", values: [480] } },
      { id: "make", tag: 0x010f, type: "ASCII", value: { kind: "text", value: "W02" } },
      { id: "pointer", tag: 0x8769, type: variant === "classic" ? "LONG" : "IFD8", value: { kind: "directory-references", directoryIds: ["exif"] } },
    ],
  };
  return { byteOrder, variant, rootDirectoryId: "root", directories: [root, child], preservedData: [] };
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  return left.length === right.length && left.every((byte, index) => byte === right[index]);
}

describe("W02 reusable TIFF/EXIF serializer", () => {
  it.each(["little-endian", "big-endian"] as const)("serializes a bounded classic graph in %s order and reparses it", async (byteOrder) => {
    const input = graph(byteOrder);
    const bytes = serializeTiff(input);
    const reparsed = parseTiffGraph(bytes);
    expect(reparsed.byteOrder).toBe(byteOrder);
    expect(reparsed.variant).toBe("classic");
    expect(reparsed.directories).toHaveLength(2);
    expect(reparsed.directories[0]?.entries.map((entry) => entry.tag)).toEqual([0x0100, 0x0101, 0x010f, 0x8769]);
    expect(reparsed.directories[0]?.entries[3]?.value).toMatchObject({ kind: "directory-references", directoryIds: ["IFD1@62"] });
    const parsed = await parseMetadata(bytes);
    expect(parsed.format).toBe("tiff");
    expect(parsed.dimensions).toEqual({ width: 640, height: 480 });
    expect(parsed.warnings).toEqual([]);
  });

  it("round-trips a representative generated graph without losing raw values", () => {
    const input = graph("little-endian");
    const first = serializeTiff(input);
    const second = serializeTiff(parseTiffGraph(first));
    expect(bytesEqual(first, second)).toBe(true);
    const reparsed = parseTiffGraph(second);
    expect(reparsed.directories[1]?.entries.map((entry) => [entry.tag, entry.type, entry.count, entry.value.kind])).toEqual([
      [0x829a, "RATIONAL", 1, "raw"],
      [0xc7a1, "UNDEFINED", 5, "raw"],
      [0xa40e, "UTF-8", 8, "raw"],
    ]);
  });

  it("round-trips deterministic random valid scalar and array graphs", () => {
    let state = 0x12345678;
    const next = (): number => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state;
    };
    for (const byteOrder of ["little-endian", "big-endian"] as const) {
      for (let iteration = 0; iteration < 32; iteration += 1) {
        const entries = Array.from({ length: 8 }, (_unused, index) => ({
          id: `random-${iteration}-${index}`,
          tag: 0xc000 + index,
          type: index % 3 === 0 ? "SHORT" as const : index % 3 === 1 ? "LONG" as const : "RATIONAL" as const,
          value: index % 3 === 0
            ? { kind: "numbers" as const, values: [next() % 65536, next() % 65536] }
            : index % 3 === 1
              ? { kind: "numbers" as const, values: [next() >>> 0] }
              : { kind: "rationals" as const, values: [{ numerator: next() % 10000, denominator: (next() % 999) + 1 }] },
        }));
        const candidate: TiffGraph = { byteOrder, variant: "classic", rootDirectoryId: "root", directories: [{ id: "root", nextDirectoryId: null, entries }], preservedData: [] };
        const bytes = serializeTiff(candidate);
        expect(bytesEqual(bytes, serializeTiff(parseTiffGraph(bytes)))).toBe(true);
      }
    }
  });

  it("covers every bounded TIFF value family and BigTIFF signed 64-bit values", () => {
    const classic: TiffGraph = {
      byteOrder: "little-endian", variant: "classic", rootDirectoryId: "root", preservedData: [], directories: [{
        id: "root", nextDirectoryId: null, entries: [
          { tag: 0xc000, type: "BYTE", value: { kind: "numbers", values: [1, 2] } },
          { tag: 0xc001, type: "ASCII", value: { kind: "text", value: "ascii" } },
          { tag: 0xc002, type: "SHORT", value: { kind: "numbers", values: [1, 2] } },
          { tag: 0xc003, type: "LONG", value: { kind: "numbers", values: [3] } },
          { tag: 0xc004, type: "RATIONAL", value: { kind: "rationals", values: [{ numerator: 1, denominator: 2 }] } },
          { tag: 0xc005, type: "SBYTE", value: { kind: "numbers", values: [-1, 1] } },
          { tag: 0xc006, type: "UNDEFINED", value: { kind: "raw", bytes: Uint8Array.of(4, 5, 6) } },
          { tag: 0xc007, type: "SSHORT", value: { kind: "numbers", values: [-2, 2] } },
          { tag: 0xc008, type: "SLONG", value: { kind: "numbers", values: [-3] } },
          { tag: 0xc009, type: "SRATIONAL", value: { kind: "rationals", values: [{ numerator: -1, denominator: 2 }] } },
          { tag: 0xc00a, type: "FLOAT", value: { kind: "floats", values: [1.5] } },
          { tag: 0xc00b, type: "DOUBLE", value: { kind: "floats", values: [2.5] } },
          { tag: 0xc00c, type: "UTF-8", value: { kind: "text", value: "é" } },
        ],
      }],
    };
    expect(bytesEqual(serializeTiff(classic), serializeTiff(parseTiffGraph(serializeTiff(classic))))).toBe(true);
    const big: TiffGraph = {
      byteOrder: "big-endian", variant: "big-tiff", rootDirectoryId: "root", preservedData: [], directories: [{
        id: "root", nextDirectoryId: null, entries: [
          { tag: 0xc100, type: "LONG8", value: { kind: "numbers", values: [{ decimal: "9223372036854775807", signed: false }] } },
          { tag: 0xc101, type: "SLONG8", value: { kind: "numbers", values: [{ decimal: "-2", signed: true }] } },
          { tag: 0x8769, type: "IFD8", value: { kind: "directory-references", directoryIds: ["child"] } },
        ],
      }, { id: "child", nextDirectoryId: null, entries: [] }],
    };
    expect(bytesEqual(serializeTiff(big), serializeTiff(parseTiffGraph(serializeTiff(big))))).toBe(true);
  });

  it("preserves unknown entries, relocated thumbnails, and their byte payload", async () => {
    const input: TiffGraph = {
      byteOrder: "little-endian",
      variant: "classic",
      rootDirectoryId: "root",
      directories: [{
        id: "root",
        nextDirectoryId: "thumb",
        entries: [{ id: "width", tag: 256, type: "LONG", value: { kind: "numbers", values: [2] } }],
      }, {
        id: "thumb",
        nextDirectoryId: null,
        entries: [
          { id: "thumbnail-offset", tag: 0x0201, type: "LONG", value: { kind: "data-references", dataIds: ["jpeg"] } },
          { id: "thumbnail-offset-duplicate", tag: 0x0201, type: "LONG", value: { kind: "data-references", dataIds: ["jpeg"] } },
          { id: "thumbnail-length", tag: 0x0202, type: "LONG", value: { kind: "numbers", values: [6] } },
          { id: "unknown", tag: 0xc7a1, type: "UNDEFINED", value: { kind: "raw", bytes: Uint8Array.of(9, 8, 7, 6, 5) } },
        ],
      }],
      preservedData: [{ id: "jpeg", sourceOffset: 2048, data: Uint8Array.of(0xff, 0xd8, 1, 2, 0xff, 0xd9), kind: "thumbnail" }],
    };
    const bytes = serializeTiff(input);
    const parsed = parseTiffGraph(bytes);
    expect(parsed.preservedData[0]?.data).toEqual(Uint8Array.of(0xff, 0xd8, 1, 2, 0xff, 0xd9));
    expect(parsed.directories[1]?.entries.filter((entry) => entry.tag === 0x0201)).toHaveLength(2);
    const rewritten = rewriteTiff(bytes, { edits: [{ op: "set", directoryId: "IFD1@26", tag: 0xc7a1, type: "UNDEFINED", value: { kind: "raw", bytes: Uint8Array.of(1, 2, 3, 4, 5, 6, 7, 8) } }] });
    const result = await parseMetadata(rewritten);
    expect(result.exif?.associatedImages?.[0]?.length).toBe(6);
    expect(parseTiffGraph(rewritten).preservedData[0]?.data).toEqual(Uint8Array.of(0xff, 0xd8, 1, 2, 0xff, 0xd9));
  });

  it("rewrites values with changed type, count, and encoded length", async () => {
    const bytes = serializeTiff(graph("little-endian"));
    const rewritten = rewriteTiff(bytes, {
      edits: [
        { op: "set", directoryId: "IFD0@8", tag: 0x010f, type: "UTF-8", value: { kind: "text", value: "Longer Δ value" } },
        { op: "set", directoryId: "IFD0@8", tag: 0x0100, type: "SHORT", value: { kind: "numbers", values: [12, 34] } },
      ],
    });
    const parsed = await parseMetadata(rewritten);
    expect(parsed.fields.find((field) => field.name === "Make")).toMatchObject({ type: "UTF-8", value: "Longer Δ value", count: 16 });
    expect(parsed.exif?.fields.find((field) => field.name === "ImageWidth")).toMatchObject({ type: "SHORT", raw: [12, 34], count: 2 });
    expect(parsed.warnings.some((warning) => warning.code === "UNSAFE_OFFSET")).toBe(false);
  });

  it("applies duplicate policies deterministically and rejects unsafe limits before output", () => {
    const input: TiffGraph = {
      byteOrder: "little-endian", variant: "classic", rootDirectoryId: "root", preservedData: [], directories: [{
        id: "root", nextDirectoryId: null, entries: [
          { id: "a", tag: 0xc7a1, type: "UNDEFINED", value: { kind: "raw", bytes: Uint8Array.of(1) } },
          { id: "b", tag: 0xc7a1, type: "UNDEFINED", value: { kind: "raw", bytes: Uint8Array.of(2) } },
        ],
      }],
    };
    const bytes = serializeTiff(input);
    expect(() => rewriteTiff(bytes, { duplicatePolicy: "reject", edits: [{ op: "set", directoryId: "IFD0@8", tag: 0xc7a1, type: "UNDEFINED", value: { kind: "raw", bytes: Uint8Array.of(3) } }] })).toThrow(TiffSerializationError);
    expect(() => serializeTiff(input, { maxOutputBytes: 8 })).toThrow(/maxOutputBytes/i);
  });

  it("keeps duplicate and ordering policies explicit", () => {
    const input = serializeTiff({
      byteOrder: "little-endian", variant: "classic", rootDirectoryId: "root", preservedData: [], directories: [{
        id: "root", nextDirectoryId: null, entries: [
          { id: "make", tag: 0x010f, type: "ASCII", value: { kind: "text", value: "old" } },
          { id: "width", tag: 0x0100, type: "LONG", value: { kind: "numbers", values: [1] } },
          { id: "make-copy", tag: 0x010f, type: "ASCII", value: { kind: "text", value: "other" } },
        ],
      }],
    });
    const replacement = { op: "set" as const, directoryId: "IFD0@8", tag: 0x010f, type: "ASCII" as const, value: { kind: "text" as const, value: "new" } };
    const preserved = parseTiffGraph(rewriteTiff(input, { duplicatePolicy: "preserve", edits: [replacement] }));
    expect(preserved.directories[0]?.entries.filter((entry) => entry.tag === 0x010f).map((entry) => entry.value)).toEqual([
      { kind: "raw", bytes: Uint8Array.of(110, 101, 119, 0), count: 4 },
      { kind: "raw", bytes: Uint8Array.of(110, 101, 119, 0), count: 4 },
    ]);
    const deduplicated = parseTiffGraph(rewriteTiff(input, { duplicatePolicy: "deduplicate-equivalent", edits: [replacement] }));
    expect(deduplicated.directories[0]?.entries.filter((entry) => entry.tag === 0x010f)).toHaveLength(2);
    expect(deduplicated.directories[0]?.entries.filter((entry) => entry.tag === 0x010f).map((entry) => entry.value)).toEqual([
      { kind: "raw", bytes: Uint8Array.of(110, 101, 119, 0), count: 4 },
      { kind: "raw", bytes: Uint8Array.of(111, 116, 104, 101, 114, 0), count: 6 },
    ]);
    const canonical = parseTiffGraph(rewriteTiff(input, { ordering: "canonical", edits: [] }));
    expect(canonical.directories[0]?.entries.map((entry) => entry.tag)).toEqual([0x0100, 0x010f, 0x010f]);
  });

  it("records immutable byte evidence and rejects malformed graph or input structures", async () => {
    const input = serializeTiff(graph("little-endian"));
    const output = rewriteTiff(input, { edits: [{ op: "set", directoryId: "IFD0@8", tag: 0x010f, type: "ASCII", value: { kind: "text", value: "evidence" } }] });
    const evidence = await tiffEvidence(input, output);
    expect(evidence).toMatchObject({ inputBytes: input.byteLength, outputBytes: output.byteLength });
    expect(evidence.inputSha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(evidence.outputSha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(evidence.inputSha256).not.toBe(evidence.outputSha256);
    expect(() => parseTiffGraph(Uint8Array.of(0x49, 0x49, 0, 99, 0, 0, 0, 8))).toThrow(TiffSerializationError);
    expect(() => serializeTiff({ ...graph("little-endian"), directories: [{ id: "root", nextDirectoryId: null, entries: [{ tag: 0x10000, type: "LONG", value: { kind: "numbers", values: [1] } }] }] })).toThrow(TiffSerializationError);
    const base = graph("little-endian");
    const malformedGraphs: readonly unknown[] = [
      null,
      { ...base, byteOrder: "network" },
      { ...base, variant: "classic-tiff" },
      { ...base, rootDirectoryId: 42 },
      { ...base, directories: null },
      { ...base, directories: [null] },
      { ...base, directories: [{ id: "root", entries: null, nextDirectoryId: null }] },
      { ...base, preservedData: null },
      { ...base, preservedData: [null] },
      { ...base, directories: [{ id: "root", nextDirectoryId: null, entries: [null] }] },
      { ...base, directories: [{ id: "root", nextDirectoryId: null, entries: [{ tag: 256, type: "not-a-type", value: { kind: "raw", bytes: new Uint8Array() } }] }] },
      { ...base, directories: [{ id: "root", nextDirectoryId: null, entries: [{ tag: 256, type: "LONG", value: null }] }] },
      { ...base, directories: [{ id: "root", nextDirectoryId: "missing", entries: [] }] },
      { ...base, directories: [{ id: "root", nextDirectoryId: null, entries: [{ tag: 256, type: "LONG", value: { kind: "numbers", values: [1] } }] }], preservedData: [{ id: "x", sourceOffset: 0, data: new Uint8Array(), kind: "not-a-kind" }] },
    ];
    for (const malformed of malformedGraphs) expect(() => serializeTiff(malformed as never)).toThrow(TiffSerializationError);
    expect(() => serializeTiff({ ...base, directories: [{ id: "root", nextDirectoryId: null, entries: [{ tag: 256, type: "ASCII", value: { kind: "text", value: "too long" } }] }] }, { maxOutputBytes: 4 })).toThrow(TiffSerializationError);
  });

  it("does not mutate input or expose a partial W01 transaction", async () => {
    const source = new Uint8Array(await readFile(fixtureUrl));
    const original = new Uint8Array(source);
    const result = await editMetadata(source, {
      operations: [
        { op: "set", operationId: "make", target: { kind: "field", fieldId: "normalized:Make" }, value: "Edited" },
        { op: "merge-sidecar", operationId: "unsupported", target: { kind: "selector", selector: { kind: "family", family: "XMP" } }, sidecar: { id: "xmp", format: "xmp", data: "<x:xmpmeta/>" } },
      ],
    });
    expect(result.successful).toBe(false);
    expect(result.output).toBeNull();
    expect(result.data).toBeNull();
    expect(result.operations.every((operation) => operation.appliedCount === 0)).toBe(true);
    expect(source).toEqual(original);
  });

  it("executes exact standalone TIFF set, delete, copy, alias, and rename operations", async () => {
    const source = new Uint8Array(await readFile(fixtureUrl));
    const copy = await editMetadata(source, {
      operations: [{ op: "copy", operationId: "copy", source: { kind: "field", fieldId: "normalized:Make" }, destination: { kind: "field", fieldId: "normalized:Model" } }],
    });
    expect(copy.successful).toBe(true);
    if (!copy.successful) throw new Error("copy transaction did not complete");
    expect((await parseMetadata(copy.data)).fields.find((field) => field.name === "Model")?.value).toBe("OpenAI Camera");

    const alias = await editMetadata(source, {
      operations: [{ op: "alias", operationId: "alias", source: { kind: "field", fieldId: "normalized:Make" }, destination: { kind: "field", fieldId: "normalized:Artist" } }],
    });
    expect(alias.successful).toBe(true);
    if (!alias.successful) throw new Error("alias transaction did not complete");
    expect((await parseMetadata(alias.data)).fields.find((field) => field.name === "Artist")?.value).toBe("OpenAI Camera");

    const rename = await editMetadata(source, {
      operations: [{ op: "rename", operationId: "rename", source: { kind: "field", fieldId: "normalized:Model" }, destination: { kind: "field", fieldId: "normalized:Artist" } }],
    });
    expect(rename.successful).toBe(true);
    if (!rename.successful) throw new Error("rename transaction did not complete");
    const renamed = await parseMetadata(rename.data);
    expect(renamed.fields.find((field) => field.name === "Artist")?.value).toBe("Fixture One");
    expect(renamed.fields.some((field) => field.name === "Model")).toBe(false);

    const deleted = await editMetadata(source, {
      operations: [{ op: "delete", operationId: "delete", target: { kind: "field", fieldId: "normalized:Software" } }],
    });
    expect(deleted.successful).toBe(true);
    if (!deleted.successful) throw new Error("delete transaction did not complete");
    expect((await parseMetadata(deleted.data)).fields.some((field) => field.name === "Software")).toBe(false);

    const rational = await editMetadata(source, {
      operations: [{ op: "set", operationId: "rational", target: { kind: "field", fieldId: "normalized:ExposureTime" }, value: { numerator: 1, denominator: 30 } }],
    });
    expect(rational.successful).toBe(true);

    const explicit = await editMetadata(source, {
      operations: [{ op: "set", operationId: "explicit", target: { kind: "field", fieldId: "IFD0:0xc7a1" }, value: Uint8Array.of(7, 6, 5) }],
    });
    expect(explicit.successful).toBe(true);
    if (!explicit.successful) throw new Error("explicit TIFF transaction did not complete");
    expect(parseTiffGraph(explicit.data).directories[0]?.entries.some((entry) => entry.tag === 0xc7a1)).toBe(true);

    const invalidType = await editMetadata(source, {
      operations: [{ op: "set", operationId: "invalid-type", target: { kind: "field", fieldId: "normalized:Orientation" }, value: "not numeric" }],
    });
    expect(invalidType.successful).toBe(false);
    expect(invalidType.status).toBe("invalid-value");
  });

  it("writes and reparses BigTIFF only with BigTIFF structures", async () => {
    const bytes = serializeTiff(graph("big-endian", "big-tiff"));
    expect(bytes.slice(0, 4)).toEqual(Uint8Array.of(0x4d, 0x4d, 0, 43));
    const reparsed = parseTiffGraph(bytes);
    expect(reparsed.variant).toBe("big-tiff");
    expect(reparsed.directories[0]?.entries[0]).toMatchObject({ type: "LONG8", count: 1 });
    expect((await parseMetadata(bytes)).dimensions).toEqual({ width: 640, height: 480 });
  });

  it("is accepted by the independent ExifTool reader after serialization", async () => {
    const directory = await mkdtemp(join(tmpdir(), "w02-tiff-"));
    const pathname = join(directory, "graph.tif");
    try {
      await writeFile(pathname, serializeTiff(graph("little-endian")));
      const external = await exiftool.read(pathname);
      expect(external.Make).toBe("W02");
      expect(external.ImageWidth).toBe(640);
      expect(external.ImageHeight).toBe(480);
      await writeFile(pathname, serializeTiff(graph("little-endian", "big-tiff")));
      const bigExternal = await exiftool.read(pathname);
      expect(bigExternal.Make).toBe("W02");
      expect(bigExternal.ImageWidth).toBe(640);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
