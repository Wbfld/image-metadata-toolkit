import { describe, expect, it } from "vitest";

import { inspectMakerNotes, makerNoteFieldsAsMetadataFields } from "../src/metadata/makernote.js";
import { resolveLimits } from "../src/security/limits.js";
import type { MakerNoteDetection, MakerNoteField, MakerNoteInput, MakerNotePlugin, MakerNotePluginResult } from "../src/types.js";

const limits = resolveLimits({ maxValueBytes: 128, maxStringBytes: 128, maxWarnings: 64, maxSegments: 16, maxAdapterItems: 16 });

function input(overrides: Partial<MakerNoteInput> = {}): MakerNoteInput {
  return { id: "note-1", fieldId: "EXIF:MakerNote", raw: Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]), noteOffset: 100, sourceLength: 108, tiffOffset: 12, fileOffset: 100, blockId: "exif:maker-note", ...overrides };
}

function detection(overrides: Partial<MakerNoteDetection> = {}): MakerNoteDetection {
  return { confidence: 1, byteOrder: "little-endian", baseOffsetRule: "note-start", evidence: [{ kind: "signature", offset: 0, length: 2, description: "bounded test signature" }], ...overrides };
}

function field(note: MakerNoteInput): MakerNoteField {
  return {
    id: "maker:test:1",
    tag: 1,
    name: "TestTag",
    label: "Test tag",
    description: "A bounded test tag.",
    type: "SHORT",
    raw: 258,
    value: 258,
    display: "258",
    sensitivity: "low",
    count: 1,
    known: true,
    provenance: {
      noteOffset: note.noteOffset,
      noteLength: note.raw.length,
      sourceLength: note.sourceLength,
      blockId: note.blockId,
      fieldId: note.fieldId,
      noteRelativeOffset: 0,
      rangeLength: 2,
      originalFileOffset: note.noteOffset,
      originalFileLength: note.sourceLength,
      offsetBase: "note-start",
    },
  };
}

function plugin(id: string, detect: MakerNotePlugin["detect"], parse: MakerNotePlugin["parse"]): MakerNotePlugin {
  return {
    identity: {
      id,
      version: "1.0.0",
      vendor: "Test vendor",
      noteFamily: "Test MakerNote",
      supportedModels: ["Test model"],
      supportedVersions: ["1"],
      minimumConfidence: 0.5,
      signatureTests: ["01 02"],
      byteOrder: "from-note",
      baseOffsetRule: "note-start",
      nestedIfd: "bounded",
      encryption: "none",
      tagRegistry: [{ id: `${id}:tag:1`, tag: 1, name: "TestTag", label: "Test tag", description: "A bounded test tag.", type: "SHORT", repeatable: false, sensitivity: "low", rawValueBehavior: "retain", applicableModels: ["Test model"], applicableVersions: ["1"] }],
      securityRequirements: ["bounded reads"],
      sources: [{ id: `${id}:source`, url: "https://example.test/makernote", version: "1", license: "MIT", retrievedAt: "2026-01-01", sha256: "0".repeat(64), role: "fixture" }],
    },
    detect,
    parse,
  };
}

describe("S06 MakerNote bounded plugin contract", () => {
  it("accepts one decoded plugin, freezes its identity, preserves provenance, and exposes common fields", () => {
    const note = input();
    const accepted = plugin("test-a", (context) => {
      expect(context.read(0, 2)).toEqual(Uint8Array.of(1, 2));
      expect(context.readUint8(0)).toBe(1);
      expect(context.readUint16(0)).toBe(513);
      expect(context.readUint16(0, "big-endian")).toBe(258);
      expect(context.readUint32(0)).toBe(0x04030201);
      expect(context.resolveOffset(2)).toBe(102);
      expect(context.resolveOffset(2, "tiff-start")).toBe(14);
      expect(context.resolveOffset(2, "file-start")).toBe(2);
      return detection();
    }, ({ context }): MakerNotePluginResult => {
      expect(context.resolveOffset(2, "absolute")).toBe(2);
      expect(context.resolveOffset(2, "declared-by-detection")).toBe(102);
      return { status: "detected-decoded", fields: [field(note)] };
    });
    const result = inspectMakerNotes([note], limits, { plugins: [accepted] });
    expect(result.complete).toBe(true);
    expect(Object.isFrozen(result.notes)).toBe(true);
    expect(Object.isFrozen(result.notes[0]?.plugin)).toBe(true);
    expect(result.notes[0]?.fields[0]?.provenance.rangeLength).toBe(2);
    expect(makerNoteFieldsAsMetadataFields(result)).toContainEqual(expect.objectContaining({ id: "maker:test:1", ifd: "MakerNote:Test vendor", tag: 1 }));
  });

  it("keeps unknown, ambiguous, low-confidence, opaque, and status-specific results fail-closed", () => {
    const note = input();
    const unknown = inspectMakerNotes([note], limits);
    expect(unknown.notes[0]?.status).toBe("unknown");
    expect(unknown.notes[0]?.opaqueRanges[0]?.reason).toBe("unknown");
    const ambiguous = inspectMakerNotes([note], limits, { plugins: [plugin("b", () => detection(), () => ({ status: "detected-decoded" })), plugin("a", () => detection(), () => ({ status: "detected-decoded" }))] });
    expect(ambiguous.notes[0]?.status).toBe("low-confidence");
    const low = inspectMakerNotes([note], limits, { plugins: [plugin("low", () => detection({ confidence: 0.6, status: "low-confidence" }), () => ({ status: "detected-decoded" }))] });
    expect(low.notes[0]?.status).toBe("low-confidence");
    const opaque = inspectMakerNotes([note], limits, { plugins: [plugin("opaque", () => detection({ status: "opaque" }), () => ({ status: "detected-decoded" }))] });
    expect(opaque.notes[0]?.opaqueRanges[0]?.reason).toBe("unknown");
    for (const status of ["detected-opaque", "encrypted", "obfuscated", "unsupported", "malformed", "limit-exceeded"] as const) {
      const result = inspectMakerNotes([note], limits, { plugins: [plugin(status, () => detection(), () => ({ status }))] });
      expect(result.notes[0]?.status).toBe(status);
      expect(result.notes[0]?.opaqueRanges.length).toBeGreaterThan(0);
    }
  });

  it("rejects invalid identities, detections, fields, plugin results, ranges, and exceptions without throwing", () => {
    const note = input();
    const invalidPlugins: readonly MakerNotePlugin[] = [
      null as unknown as MakerNotePlugin,
      plugin("invalid-detection", () => ({ confidence: 4 } as unknown as MakerNoteDetection), () => ({ status: "detected-decoded" })),
      plugin("throws-detect", () => { throw new Error("detect"); }, () => ({ status: "detected-decoded" })),
      plugin("throws-range", () => detection(), ({ context }) => { context.read(999, 1); return { status: "detected-decoded" }; }),
      plugin("throws-error", () => detection(), () => { throw new Error("parse"); }),
      plugin("bad-status", () => detection(), () => ({ status: "not-a-status" } as unknown as MakerNotePluginResult)),
      plugin("bad-field", () => detection(), () => ({ status: "detected-decoded", fields: [{ ...field(note), display: "\0" }] })),
      plugin("bad-opaque", () => detection(), () => ({ status: "detected-decoded", opaqueRanges: [{ id: "bad", noteRelativeOffset: 0, originalFileOffset: note.noteOffset, length: 99, reason: "unknown", provenance: field(note).provenance }] })),
      plugin("diagnostic", () => detection(), () => ({ status: "detected-opaque", diagnostics: [{ code: "PLUGIN_THROWN", message: "sensitive diagnostic" }] })),
    ];
    const result = inspectMakerNotes([note], limits, { plugins: invalidPlugins });
    expect(result.complete).toBe(false);
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics.every(({ code }) => /^[A-Z_]+$/u.test(code))).toBe(true);
    expect(inspectMakerNotes([null as unknown as MakerNoteInput], limits).complete).toBe(false);
    expect(inspectMakerNotes([input({ noteOffset: 101 })], limits).notes[0]?.status).toBe("limit-exceeded");
    expect(inspectMakerNotes(new Array(20).fill(note), limits).complete).toBe(false);
  });

  it("enforces bounded context reads, nested values, and aborts", () => {
    const note = input();
    const aborted = new AbortController();
    aborted.abort();
    const result = inspectMakerNotes([note], limits, { signal: aborted.signal, plugins: [plugin("aborted", () => detection(), () => ({ status: "detected-decoded" }))] });
    expect(result.notes[0]?.status).toBe("aborted");
    const tiny = resolveLimits({ maxReadRequests: 1, maxReadBytes: 1, maxValueBytes: 8, maxStringBytes: 8, maxWarnings: 8 });
    const limited = inspectMakerNotes([note], tiny, { plugins: [plugin("read-limit", () => detection(), ({ context }) => { context.read(0, 1); context.read(1, 1); return { status: "detected-decoded" }; })] });
    expect(limited.notes[0]?.status).toBe("rejected");
    const recursive: Record<string, unknown> = {};
    recursive.self = recursive;
    const recursiveValue = recursive as unknown as MakerNoteField["value"];
    const recursiveResult = inspectMakerNotes([note], limits, { plugins: [plugin("recursive", () => detection(), () => ({ status: "detected-decoded", fields: [{ ...field(note), raw: recursiveValue, value: recursiveValue }] }))] });
    expect(recursiveResult.notes[0]?.status).toBe("rejected");
  });

  it("validates every untrusted plugin identity and detection boundary independently", () => {
    const note = input();
    const base = plugin("identity-base", () => detection(), () => ({ status: "detected-decoded" }));
    const invalidCandidates: unknown[] = [
      undefined,
      1,
      {},
      { identity: null, detect: base.detect, parse: base.parse },
      { identity: base.identity, detect: null, parse: base.parse },
      { identity: base.identity, detect: base.detect, parse: null },
    ];
    const identityOverrides: Record<string, unknown>[] = [
      { id: "" }, { version: "" }, { vendor: "" }, { noteFamily: "" },
      { signatureTests: "not-an-array" }, { signatureTests: new Array(65).fill("x") }, { signatureTests: [" "] },
      { securityRequirements: "not-an-array" }, { securityRequirements: [""] },
      { minimumConfidence: Number.NaN }, { minimumConfidence: -1 }, { minimumConfidence: 0 }, { minimumConfidence: 2 },
      { tagRegistry: null },
      { sources: [null] }, { sources: [{}] },
      { sources: [{ id: "s", url: "u", version: "v", license: "l", retrievedAt: "d", sha256: "bad", role: "fixture" }] },
      { sources: [{ id: "s", url: "u", version: "v", license: "l", retrievedAt: "d", sha256: "0".repeat(64), role: "invalid" }] },
      { supportedModels: "not-an-array" }, { supportedVersions: [""] },
      { tagRegistry: [null] },
      { tagRegistry: [{ ...base.identity.tagRegistry[0], id: "" }] },
      { tagRegistry: [{ ...base.identity.tagRegistry[0], tag: -1 }] },
      { tagRegistry: [{ ...base.identity.tagRegistry[0], tag: 0x1_0000 }] },
      { tagRegistry: [{ ...base.identity.tagRegistry[0], name: "" }] },
      { tagRegistry: [{ ...base.identity.tagRegistry[0], label: "" }] },
      { tagRegistry: [{ ...base.identity.tagRegistry[0], description: "" }] },
      { tagRegistry: [{ ...base.identity.tagRegistry[0], type: "" }] },
      { tagRegistry: [{ ...base.identity.tagRegistry[0], repeatable: "false" }] },
      { tagRegistry: [{ ...base.identity.tagRegistry[0], rawValueBehavior: "" }] },
      { tagRegistry: [{ ...base.identity.tagRegistry[0], applicableModels: [""] }] },
      { tagRegistry: [{ ...base.identity.tagRegistry[0], applicableVersions: "bad" }] },
      { tagRegistry: [base.identity.tagRegistry[0], { ...base.identity.tagRegistry[0] }] },
      { tagRegistry: [base.identity.tagRegistry[0], { ...base.identity.tagRegistry[0], id: "other" }] },
    ];
    invalidCandidates.push(...identityOverrides.map((overrides) => ({ ...base, identity: { ...base.identity, ...overrides } })));
    for (const [index, candidate] of invalidCandidates.entries()) {
      const result = inspectMakerNotes([note], limits, { plugins: [candidate as MakerNotePlugin] });
      expect(result.complete, `invalid identity ${index}`).toBe(false);
      expect(result.diagnostics.some(({ code }) => code === "PLUGIN_INVALID" || code === "DUPLICATE_DEFINITION"), `invalid identity diagnostic ${index}`).toBe(true);
    }

    const invalidDetections: unknown[] = [
      1, {},
      { ...detection(), confidence: Number.NaN }, { ...detection(), confidence: -1 }, { ...detection(), confidence: 2 },
      { ...detection(), byteOrder: "mixed" }, { ...detection(), baseOffsetRule: "guess" }, { ...detection(), status: "verified" },
      { ...detection(), evidence: null }, { ...detection(), evidence: new Array(17).fill(detection().evidence[0]) },
      { ...detection(), evidence: [null] },
      { ...detection(), evidence: [{ ...detection().evidence[0], kind: "guess" }] },
      { ...detection(), evidence: [{ ...detection().evidence[0], offset: -1 }] },
      { ...detection(), evidence: [{ ...detection().evidence[0], length: 0 }] },
      { ...detection(), evidence: [{ ...detection().evidence[0], length: 99 }] },
      { ...detection(), evidence: [{ ...detection().evidence[0], description: "" }] },
    ];
    for (const [index, value] of invalidDetections.entries()) {
      const result = inspectMakerNotes([note], limits, { plugins: [plugin(`detection-${index}`, () => value as MakerNoteDetection, () => ({ status: "detected-decoded" }))] });
      expect(result.notes[0]?.status).toBe("unknown");
      expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: "PLUGIN_REJECTED" }));
    }
  });

  it("rejects every oversized, cyclic, non-finite, and malformed plugin result component", () => {
    const note = input();
    const excessiveArray = new Array(17).fill(1) as MakerNoteField["value"];
    const deep: Record<string, unknown> = {};
    let cursor = deep;
    for (let depth = 0; depth < 20; depth += 1) {
      const next: Record<string, unknown> = {};
      cursor.next = next;
      cursor = next;
    }
    const manyKeys = Object.fromEntries(new Array(17).fill(0).map((_, index) => [`k${index}`, index])) as unknown as MakerNoteField["value"];
    const invalidValues = [
      undefined, 1n, Number.NaN, Number.POSITIVE_INFINITY, "x".repeat(129), new Uint8Array(129), excessiveArray, deep, manyKeys,
    ] as readonly unknown[];
    for (const [index, value] of invalidValues.entries()) {
      const result = inspectMakerNotes([note], limits, { plugins: [plugin(`value-${index}`, () => detection(), () => ({ status: "detected-decoded", fields: [{ ...field(note), raw: value as never, value: value as never }] }))] });
      expect(result.notes[0]?.status, `invalid value ${index}`).toBe("rejected");
    }
    const invalidFields: readonly Partial<MakerNoteField>[] = [
      { id: "" }, { tag: -1 }, { tag: 0x1_0000 }, { name: "" }, { label: "" }, { description: "" }, { type: "" as never },
      { display: "" }, { sensitivity: "" as never }, { count: -1 }, { count: 17 }, { known: undefined as never },
      { provenance: null as never },
      { provenance: { ...field(note).provenance, noteRelativeOffset: -1 } },
      { provenance: { ...field(note).provenance, rangeLength: 99 } },
      { provenance: { ...field(note).provenance, noteLength: 7 } },
      { provenance: { ...field(note).provenance, noteOffset: 99 } },
      { provenance: { ...field(note).provenance, sourceLength: 109 } },
      { provenance: { ...field(note).provenance, blockId: "" } },
      { provenance: { ...field(note).provenance, fieldId: "" } },
      { provenance: { ...field(note).provenance, offsetBase: "" as never } },
      { provenance: { ...field(note).provenance, originalFileOffset: -1 } },
      { provenance: { ...field(note).provenance, originalFileLength: 109 } },
    ];
    for (const [index, overrides] of invalidFields.entries()) {
      const result = inspectMakerNotes([note], limits, { plugins: [plugin(`field-${index}`, () => detection(), () => ({ status: "detected-decoded", fields: [{ ...field(note), ...overrides }] as MakerNoteField[] }))] });
      expect(result.notes[0]?.status, `invalid field ${index}`).toBe("rejected");
    }
    const invalidCollections: readonly MakerNotePluginResult[] = [
      null as never,
      { status: "detected-decoded", fields: {} as never },
      { status: "detected-decoded", opaqueRanges: {} as never },
      { status: "detected-decoded", diagnostics: {} as never },
      { status: "detected-decoded", fields: new Array(17).fill(field(note)) },
      { status: "detected-decoded", opaqueRanges: new Array(17).fill({}) as never },
      { status: "detected-decoded", diagnostics: new Array(65).fill({ code: "PLUGIN_THROWN", message: "x" }) },
    ];
    for (const [index, value] of invalidCollections.entries()) {
      const result = inspectMakerNotes([note], limits, { plugins: [plugin(`collection-${index}`, () => detection(), () => value)] });
      expect(result.notes[0]?.status, `invalid collection ${index}`).toBe("rejected");
    }
  });
});
