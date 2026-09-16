import { describe, expect, it } from "vitest";

import type { TiffSerializationError } from "../src/index.js";
import { parseTiffGraph, serializeTiff } from "../src/index.js";
import type { TiffGraph, TiffGraphEntry } from "../src/types.js";

function graph(entry: TiffGraphEntry, variant: TiffGraph["variant"] = "classic"): TiffGraph {
  return {
    byteOrder: "little-endian",
    variant,
    rootDirectoryId: "root",
    directories: [{ id: "root", nextDirectoryId: null, entries: [entry] }],
    preservedData: [],
  };
}

function expectCode(action: () => unknown, code: TiffSerializationError["code"]): void {
  expect(action).toThrow(expect.objectContaining({ name: "TiffSerializationError", code }));
}

describe("S06 TIFF value and graph validation matrix", () => {
  it("round-trips every scalar family, explicit count mode, raw values, and payload references", () => {
    const entries: TiffGraphEntry[] = [
      { tag: 0xc000, type: "BYTE", value: { kind: "numbers", values: [0, 255] } },
      { tag: 0xc001, type: "SBYTE", value: { kind: "numbers", values: [-128, 127] } },
      { tag: 0xc002, type: "SHORT", value: { kind: "numbers", values: [0, 65535] } },
      { tag: 0xc003, type: "SSHORT", value: { kind: "numbers", values: [-32768, 32767] } },
      { tag: 0xc004, type: "LONG", value: { kind: "numbers", values: [0, 4294967295] } },
      { tag: 0xc005, type: "SLONG", value: { kind: "numbers", values: [-2147483648, 2147483647] } },
      { tag: 0xc006, type: "ASCII", value: { kind: "text", value: "ascii", nulTerminated: false } },
      { tag: 0xc007, type: "UTF-8", value: { kind: "text", value: "Δ 📷" } },
      { tag: 0xc008, type: "RATIONAL", value: { kind: "rationals", values: [{ numerator: 1, denominator: 3 }] } },
      { tag: 0xc009, type: "SRATIONAL", value: { kind: "rationals", values: [{ numerator: -1, denominator: 3 }] } },
      { tag: 0xc00a, type: "FLOAT", value: { kind: "floats", values: [-1.25, 2.5] } },
      { tag: 0xc00b, type: "DOUBLE", value: { kind: "floats", values: [-1.25, 2.5] } },
      { tag: 0xc00c, type: "UNDEFINED", value: { kind: "raw", bytes: Uint8Array.of(1, 2, 3) } },
    ];
    const bytes = serializeTiff(graphs(entries));
    expect(parseTiffGraph(bytes).directories[0]?.entries).toHaveLength(entries.length);
    expect(serializeTiff(parseTiffGraph(bytes))).toEqual(bytes);

    const withPayload: TiffGraph = {
      ...graph({ tag: 0x0201, type: "LONG", value: { kind: "data-references", dataIds: ["thumb"] } }),
      directories: [{ id: "root", nextDirectoryId: null, entries: [
        { tag: 0x0201, type: "LONG", value: { kind: "data-references", dataIds: ["thumb"] } },
        { tag: 0x0202, type: "LONG", value: { kind: "numbers", values: [4] } },
      ] }],
      preservedData: [{ id: "thumb", sourceOffset: 0, data: Uint8Array.of(0xff, 0xd8, 0xff, 0xd9), kind: "thumbnail" }],
    };
    const payloadBytes = serializeTiff(withPayload);
    expect(parseTiffGraph(payloadBytes).preservedData[0]?.data).toEqual(Uint8Array.of(0xff, 0xd8, 0xff, 0xd9));
  });

  it("rejects contradictory types, lexical values, ranges, counts, references, and limits with typed failures", () => {
    expectCode(() => serializeTiff(graph({ tag: 1, type: "ASCII", value: { kind: "text", value: "é" } })), "INVALID_VALUE");
    expectCode(() => serializeTiff(graph({ tag: 1, type: "ASCII", value: { kind: "text", value: "a\0b" } })), "INVALID_VALUE");
    expectCode(() => serializeTiff(graph({ tag: 1, type: "LONG", value: { kind: "text", value: "not numeric" } })), "INVALID_VALUE");
    expectCode(() => serializeTiff(graph({ tag: 1, type: "SHORT", value: { kind: "numbers", values: [65536] } })), "INVALID_VALUE");
    expectCode(() => serializeTiff(graph({ tag: 1, type: "SBYTE", value: { kind: "numbers", values: [-129] } })), "INVALID_VALUE");
    expectCode(() => serializeTiff(graph({ tag: 1, type: "FLOAT", value: { kind: "floats", values: [Number.NaN] } })), "INVALID_VALUE");
    expectCode(() => serializeTiff(graph({ tag: 1, type: "RATIONAL", value: { kind: "rationals", values: [{ numerator: 1, denominator: Number.MAX_SAFE_INTEGER + 1 }] } })), "INVALID_VALUE");
    expectCode(() => serializeTiff(graph({ tag: 1, type: "RATIONAL", value: { kind: "rationals", values: [{ numerator: 1, denominator: -1 }] } })), "INVALID_VALUE");
    expectCode(() => serializeTiff(graph({ tag: 1, type: "LONG", count: 2, value: { kind: "numbers", values: [1] } })), "INVALID_VALUE");
    expectCode(() => serializeTiff(graph({ tag: 1, type: "UNDEFINED", value: { kind: "raw", bytes: Uint8Array.of(1), count: 2 } })), "INVALID_VALUE");
    expectCode(() => serializeTiff(graph({ tag: 1, type: "LONG", typeCode: 3, value: { kind: "numbers", values: [1] } })), "INVALID_VALUE");
    expectCode(() => serializeTiff(graph({ tag: 1, type: "LONG8", value: { kind: "numbers", values: [1] } })), "INVALID_VALUE");
    expectCode(() => serializeTiff(graph({ tag: 0x0201, type: "LONG", value: { kind: "data-references", dataIds: ["missing"] } })), "UNSAFE_STRUCTURE");
    expectCode(() => serializeTiff(graph({ tag: 0x0100, type: "LONG", value: { kind: "directory-references", directoryIds: ["missing"] } })), "UNSAFE_STRUCTURE");
    expectCode(() => serializeTiff(graph({ tag: 0x0100, type: "LONG", value: { kind: "directory-references", directoryIds: ["root"] } })), "INVALID_VALUE");
    expectCode(() => serializeTiff(graph({ tag: 1, type: "UNKNOWN", typeCode: 999, value: { kind: "raw", bytes: Uint8Array.of(1) } })), "INVALID_VALUE");
    expectCode(() => serializeTiff(graph({ tag: 1, type: "UNDEFINED", value: { kind: "unsupported" } as never })), "INVALID_VALUE");
    expectCode(() => serializeTiff(graph({ tag: 1, type: "ASCII", value: { kind: "text", value: "too long" } }), { limits: { maxValueBytes: 1 } }), "LIMIT_EXCEEDED");
    expectCode(() => serializeTiff(graph({ tag: 1, type: "UNDEFINED", value: { kind: "raw", bytes: Uint8Array.of(1, 2) } }), { maxOutputBytes: 1 }), "LIMIT_EXCEEDED");
  });

  it("rejects invalid graph identity, directory, preservation, and duplicate invariants", () => {
    const base = graph({ id: "entry", tag: 1, type: "LONG", value: { kind: "numbers", values: [1] } });
    const invalidGraphs: readonly [unknown, TiffSerializationError["code"]][] = [
      [{ ...base, rootDirectoryId: "missing" }, "INVALID_VALUE"],
      [{ ...base, directories: [] }, "LIMIT_EXCEEDED"],
      [{ ...base, directories: [{ id: "root", nextDirectoryId: "missing", entries: [] }] }, "UNSAFE_STRUCTURE"],
      [{ ...base, directories: [{ id: "bad id", nextDirectoryId: null, entries: [] }] }, "INVALID_VALUE"],
      [{ ...base, directories: [{ id: "root", nextDirectoryId: null, entries: [{ tag: 1, type: "LONG", value: { kind: "numbers", values: [1] } }, { tag: 1, type: "LONG", value: { kind: "numbers", values: [2] } }] }] }, "INVALID_VALUE"],
      [{ ...base, preservedData: [{ id: "bad id", sourceOffset: 0, data: Uint8Array.of(1), kind: "opaque" }] }, "INVALID_VALUE"],
      [{ ...base, preservedData: [{ id: "payload", sourceOffset: -1, data: Uint8Array.of(1), kind: "opaque" }] }, "INVALID_VALUE"],
      [{ ...base, preservedData: [{ id: "payload", sourceOffset: 0, data: Uint8Array.of(1), kind: "opaque" }, { id: "payload", sourceOffset: 0, data: Uint8Array.of(2), kind: "opaque" }] }, "INVALID_VALUE"],
    ];
    for (const [candidate, code] of invalidGraphs) expectCode(() => serializeTiff(candidate as TiffGraph), code);
    expectCode(() => serializeTiff(base, { maxOutputBytes: 0 }), "INVALID_VALUE");
    expectCode(() => serializeTiff(base, { maxOutputBytes: Number.MAX_SAFE_INTEGER + 1 }), "INVALID_VALUE");
  });
});

function graphs(entries: readonly TiffGraphEntry[]): TiffGraph {
  return { ...graph(entries[0] ?? { tag: 1, type: "LONG", value: { kind: "numbers", values: [1] } }), directories: [{ id: "root", nextDirectoryId: null, entries }] };
}
