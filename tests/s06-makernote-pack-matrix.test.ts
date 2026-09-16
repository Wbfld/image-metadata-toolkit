import { describe, expect, it } from "vitest";

import { createMakerNotePack, source, tag } from "../src/metadata/makernote-pack.js";
import { inspectMakerNotes } from "../src/metadata/makernote.js";
import { resolveLimits } from "../src/security/limits.js";
import type { MakerNoteInput } from "../src/types.js";

const limits = resolveLimits({ maxValueBytes: 512, maxStringBytes: 512, maxIfdEntries: 32, maxAdapterItems: 32, maxSegments: 32, maxWarnings: 64 });

function u16(view: DataView, offset: number, value: number): void { view.setUint16(offset, value, true); }
function u32(view: DataView, offset: number, value: number): void { view.setUint32(offset, value >>> 0, true); }

function makerNote(): Uint8Array {
  const bytes = new Uint8Array(256);
  const view = new DataView(bytes.buffer);
  bytes[0] = 0xaa;
  u16(view, 1, 10);
  const entries = [
    [1, 2, 2, [0x41, 0]],
    [2, 1, 2, [1, 2]],
    [3, 3, 1, [0x34, 0x12]],
    [4, 8, 1, [0xfe, 0xff]],
    [5, 4, 1, [0x78, 0x56, 0x34, 0x12]],
    [6, 9, 1, [0xfe, 0xff, 0xff, 0xff]],
    [7, 5, 1, [0, 0, 0, 0]],
    [8, 10, 1, [4, 0, 0, 0]],
    [9, 7, 3, [9, 8, 7]],
    [99, 3, 1, [1, 0]],
  ] as const;
  for (const [index, [tagValue, type, count, inline]] of entries.entries()) {
    const offset = 3 + index * 12;
    u16(view, offset, tagValue);
    u16(view, offset + 2, type);
    u32(view, offset + 4, count);
    if (tagValue === 7) u32(view, offset + 8, 0);
    else if (tagValue === 8) u32(view, offset + 8, 8);
    else bytes.set(inline, offset + 8);
  }
  u32(view, 180, 1); u32(view, 184, 2);
  u32(view, 188, 3); u32(view, 192, 4);
  return bytes;
}

function input(raw = makerNote()): MakerNoteInput {
  return { id: "pack-note", fieldId: "EXIF:MakerNote", blockId: "exif:maker", raw, noteOffset: 200, sourceLength: 456, tiffOffset: 40, fileOffset: 200 };
}

function pack() {
  const common = { label: "Test", description: "Test tag", repeatable: false, sensitivity: "low" as const, rawValueBehavior: "retain" as const, source: "bounded test pack" };
  return createMakerNotePack({
    identity: { id: "pack-test", version: "1.0.0", vendor: "Test", noteFamily: "Pack", minimumConfidence: 0.5, signatureTests: ["AA"], byteOrder: "little-endian", baseOffsetRule: "note-start", nestedIfd: "bounded", encryption: "none", securityRequirements: ["bounded"] },
    sources: [source("pack-source", "https://example.test/pack", "1", "MIT", "0".repeat(64), "fixture")],
    signatures: [{ offset: 0, bytes: [0xaa], description: "pack marker" }],
    detectStructure: (context) => context.noteLength >= 123,
    detectByteOrder: () => "little-endian",
    layout: { byteOrder: "little-endian", countOffset: 1, entriesOffset: 3, valueOrigin: 180 },
    tags: [
      tag({ ...common, id: "pack:text", tag: 1, name: "Text", type: "ASCII", decoder: "text" }),
      tag({ ...common, id: "pack:byte", tag: 2, name: "Byte", type: "BYTE", decoder: "bytes" }),
      tag({ ...common, id: "pack:short", tag: 3, name: "Short", type: "SHORT", decoder: "number" }),
      tag({ ...common, id: "pack:sshort", tag: 4, name: "SShort", type: "SSHORT", decoder: "number" }),
      tag({ ...common, id: "pack:long", tag: 5, name: "Long", type: "LONG", decoder: "number" }),
      tag({ ...common, id: "pack:slong", tag: 6, name: "SLong", type: "SLONG", decoder: "number" }),
      tag({ ...common, id: "pack:rational", tag: 7, name: "Rational", type: "RATIONAL", decoder: "rational" }),
      tag({ ...common, id: "pack:srational", tag: 8, name: "SRational", type: "SRATIONAL", decoder: "rational" }),
      tag({ ...common, id: "pack:undefined", tag: 9, name: "Undefined", type: "UNDEFINED", decoder: "bytes" }),
    ],
  });
}

describe("S06 MakerNote pack coverage", () => {
  it("decodes every packed scalar, text, bytes, and rational family with bounded provenance", () => {
    const result = inspectMakerNotes([input()], limits, { plugins: [pack()] });
    expect(result.complete).toBe(false);
    const note = result.notes[0];
    expect(note?.plugin?.id).toBe("pack-test");
    expect(note?.fields.map(({ name }) => name)).toEqual(["Text", "Byte", "Short", "SShort", "Long", "SLong", "Rational", "SRational", "Undefined"]);
    expect(note?.opaqueRanges.some(({ reason }) => reason === "unknown")).toBe(true);
    expect(note?.fields.every(({ provenance }) => provenance.originalFileOffset !== null && provenance.noteLength === 256)).toBe(true);
  });

  it("handles pack layout, signature, count, type, range, and value-limit failures as typed opaque results", () => {
    const candidates = [
      new Uint8Array([0xbb, 0, 0]),
      (() => { const value = makerNote(); new DataView(value.buffer).setUint16(1, 33, true); return value; })(),
      (() => { const value = makerNote(); new DataView(value.buffer).setUint16(3 + 2, 99, true); return value; })(),
      (() => { const value = makerNote(); new DataView(value.buffer).setUint32(3 + 6 * 12 + 8, 0xfffffff0, true); return value; })(),
      (() => { const value = makerNote(); new DataView(value.buffer).setUint32(3 + 8 * 12 + 4, 999, true); return value; })(),
    ];
    for (const raw of candidates) {
      const result = inspectMakerNotes([input(raw)], limits, { plugins: [pack()] });
      expect(result.notes[0]?.opaqueRanges.length).toBeGreaterThan(0);
      expect(result.diagnostics.every(({ code }) => /^[A-Z_]+$/u.test(code))).toBe(true);
    }
    const tiny = inspectMakerNotes([input()], resolveLimits({ maxValueBytes: 2, maxStringBytes: 2, maxIfdEntries: 2, maxAdapterItems: 2, maxSegments: 2 }), { plugins: [pack()] });
    expect(tiny.notes[0]?.status).not.toBe("detected-decoded");
  });

  it("covers custom layout callbacks and unsupported pack layouts without global registration", () => {
    const base = pack();
    const config = {
      identity: base.identity,
      sources: base.identity.sources ?? [],
      signatures: [{ offset: 0, bytes: [0xaa], description: "pack marker" }],
      layout: null,
      layoutForDetection: () => null,
      layoutOffset: () => null,
      tags: [],
    } as const;
    const unsupported = createMakerNotePack(config);
    expect(inspectMakerNotes([input()], limits, { plugins: [unsupported] }).notes[0]?.status).toBe("unsupported");
    const noStructure = createMakerNotePack({ ...config, layout: { byteOrder: "little-endian", countOffset: 1, entriesOffset: 3, valueOrigin: 180 }, detectStructure: () => false, layoutOffset: () => 0, layoutForDetection: () => ({ byteOrder: "little-endian", countOffset: 1, entriesOffset: 3, valueOrigin: 180 }) });
    expect(inspectMakerNotes([input()], limits, { plugins: [noStructure] }).notes[0]?.status).toBe("unknown");
  });

  it("rejects every contradictory tag and signature registry shape before exposing a plugin", () => {
    const base = pack();
    const identity = base.identity;
    const common = { label: "Boundary", description: "Boundary tag", repeatable: false, sensitivity: "low" as const, rawValueBehavior: "retain" as const };
    const validTag = tag({ ...common, id: "boundary:one", tag: 1, name: "One", type: "SHORT", decoder: "number" });
    const make = (overrides: Record<string, unknown> = {}) => ({
      identity,
      sources: identity.sources ?? [],
      signatures: [{ offset: 0, bytes: [0xaa], description: "marker" }],
      layout: { byteOrder: "little-endian" as const, countOffset: 1, entriesOffset: 3, valueOrigin: 20 },
      tags: [validTag],
      ...overrides,
    });
    const invalidTags = [
      [{ ...validTag }, { ...validTag, tag: 2 }],
      [{ ...validTag }, { ...validTag, id: "boundary:two" }],
      [{ ...validTag, tag: Number.NaN }],
      [{ ...validTag, tag: -1 }],
      [{ ...validTag, tag: 0x1_0000 }],
    ];
    for (const tags of invalidTags) expect(() => createMakerNotePack(make({ tags }) as never)).toThrow(TypeError);
    for (const signatures of [
      [{ offset: 0, bytes: [0xaa], description: "one" }, { offset: 0, bytes: [0xbb], description: "two" }],
      [{ offset: Number.NaN, bytes: [0xaa], description: "bad" }],
      [{ offset: -1, bytes: [0xaa], description: "bad" }],
      [{ offset: 0, bytes: [], description: "bad" }],
      [{ offset: 0, bytes: [-1], description: "bad" }],
      [{ offset: 0, bytes: [256], description: "bad" }],
      [{ offset: 0, bytes: [1.5], description: "bad" }],
    ]) expect(() => createMakerNotePack(make({ signatures }) as never)).toThrow(TypeError);
  });

  it("fails closed for every unsafe IFD layout and signature boundary", () => {
    const base = pack();
    const identity = base.identity;
    const config = {
      identity,
      sources: identity.sources ?? [],
      signatures: [{ offset: 0, bytes: [0xaa], description: "marker" }],
      layout: { byteOrder: "little-endian" as const, countOffset: 1, entriesOffset: 3, valueOrigin: 20 },
      tags: [],
    };
    const badLayouts = [
      { ...config.layout, entrySize: 16 },
      { ...config.layout, countOffset: -1 },
      { ...config.layout, entriesOffset: -1 },
      { ...config.layout, valueOrigin: -1 },
      { ...config.layout, countOffset: Number.MAX_SAFE_INTEGER, entriesOffset: Number.MAX_SAFE_INTEGER },
      { ...config.layout, countOffset: 999 },
      { ...config.layout, entriesOffset: 999 },
    ];
    for (const layout of badLayouts) {
      const plugin = createMakerNotePack({ ...config, layout });
      expect(inspectMakerNotes([input()], limits, { plugins: [plugin] }).notes[0]?.status).toBe("malformed");
    }
    for (const layoutOffset of [() => null, () => Number.NaN, () => -1]) {
      const plugin = createMakerNotePack({ ...config, layoutOffset });
      expect(inspectMakerNotes([input()], limits, { plugins: [plugin] }).notes[0]?.status).toBe("malformed");
    }
    const count32 = makerNote();
    new DataView(count32.buffer).setUint32(1, 1, true);
    const plugin32 = createMakerNotePack({ ...config, layout: { ...config.layout, countSize: 4, entriesOffset: 5 } });
    expect(inspectMakerNotes([input(count32)], limits, { plugins: [plugin32] }).notes[0]?.status).toBe("detected-decoded");

    const outOfRangeSignature = createMakerNotePack({ ...config, signatures: [{ offset: 255, bytes: [0xaa, 0xbb], description: "past end" }] });
    const mismatchedSignature = createMakerNotePack({ ...config, signatures: [{ offset: 0, bytes: [0xbb], description: "wrong" }] });
    expect(inspectMakerNotes([input()], limits, { plugins: [outOfRangeSignature] }).notes[0]?.status).toBe("unknown");
    expect(inspectMakerNotes([input()], limits, { plugins: [mismatchedSignature] }).notes[0]?.status).toBe("unknown");
  });

  it("decodes repeated numeric families and retains malformed zero-count and type contradictions", () => {
    const raw = new Uint8Array(320);
    const view = new DataView(raw.buffer);
    raw[0] = 0xaa;
    u16(view, 1, 8);
    const definitions = [
      [1, 3, 2, 200],
      [2, 8, 2, 204],
      [3, 4, 2, 208],
      [4, 9, 2, 216],
      [5, 5, 2, 224],
      [6, 10, 2, 240],
      [7, 7, 1, 0],
      [8, 3, 0, 0],
    ] as const;
    for (const [index, [tagNumber, typeCode, count, valueOffset]] of definitions.entries()) {
      const offset = 3 + index * 12;
      u16(view, offset, tagNumber);
      u16(view, offset + 2, typeCode);
      u32(view, offset + 4, count);
      u32(view, offset + 8, valueOffset);
    }
    u16(view, 200, 1); u16(view, 202, 2);
    view.setInt16(204, -1, true); view.setInt16(206, -2, true);
    u32(view, 208, 3); u32(view, 212, 4);
    view.setInt32(216, -3, true); view.setInt32(220, -4, true);
    u32(view, 224, 1); u32(view, 228, 2); u32(view, 232, 3); u32(view, 236, 4);
    view.setInt32(240, -1, true); view.setInt32(244, 2, true); view.setInt32(248, -3, true); view.setInt32(252, 4, true);
    const common = { label: "Repeated", description: "Repeated numeric value", repeatable: true, sensitivity: "low" as const, rawValueBehavior: "retain" as const };
    const plugin = createMakerNotePack({
      identity: { id: "pack-repeated", version: "1", vendor: "Test", noteFamily: "Repeated", minimumConfidence: 0.5, signatureTests: ["AA"], byteOrder: "little-endian", baseOffsetRule: "note-start", nestedIfd: "bounded", encryption: "none", securityRequirements: ["bounded"] },
      sources: [], signatures: [{ offset: 0, bytes: [0xaa], description: "marker" }],
      layout: { byteOrder: "little-endian", countOffset: 1, entriesOffset: 3, valueOrigin: 0 },
      tags: [
        tag({ ...common, id: "repeat:short", tag: 1, name: "Short", type: "SHORT", decoder: "number" }),
        tag({ ...common, id: "repeat:sshort", tag: 2, name: "SShort", type: "SSHORT", decoder: "number" }),
        tag({ ...common, id: "repeat:long", tag: 3, name: "Long", type: "LONG", decoder: "number" }),
        tag({ ...common, id: "repeat:slong", tag: 4, name: "SLong", type: "SLONG", decoder: "number" }),
        tag({ ...common, id: "repeat:rational", tag: 5, name: "Rational", type: "RATIONAL", decoder: "rational" }),
        tag({ ...common, id: "repeat:srational", tag: 6, name: "SRational", type: "SRATIONAL", decoder: "rational" }),
        tag({ ...common, id: "repeat:byte", tag: 7, name: "Byte", type: "BYTE", decoder: "bytes" }),
        tag({ ...common, id: "repeat:empty", tag: 8, name: "Empty", type: "SHORT", decoder: "number" }),
      ],
    });
    const note = inspectMakerNotes([{ ...input(raw), sourceLength: 1024 }], limits, { plugins: [plugin] }).notes[0];
    expect(note?.status).toBe("detected-decoded");
    expect(note?.fields.map(({ id }) => id)).toEqual(["repeat:short", "repeat:sshort", "repeat:long", "repeat:slong", "repeat:rational", "repeat:srational", "repeat:byte"]);
    expect(note?.fields.find(({ id }) => id === "repeat:rational")?.display).toBe("1/2, 3/4");
    expect(note?.opaqueRanges.some(({ reason }) => reason === "malformed")).toBe(true);
    expect(note?.diagnostics).toContainEqual(expect.objectContaining({ code: "PLUGIN_REJECTED" }));
  });
});
