import { describe, expect, it } from "vitest";
import {
  DEFAULT_LIMITS,
  inspectMakerNotes,
  makerNoteFieldsAsMetadataFields,
  parseMetadata,
  type MakerNoteField,
  type MakerNoteInput,
  type MakerNotePlugin,
  type MakerNoteProvenance,
} from "../src/index.js";

const limits = { ...DEFAULT_LIMITS, maxReadRequests: 8, maxReadBytes: 64, maxAdapterItems: 32 };

function input(raw = new Uint8Array([0x54, 0x45, 0x53, 0x54, 0x2a, 0x00, 0x00, 0x00])): MakerNoteInput {
  return { id: "note-0", fieldId: "ExifIFD:0x927c", raw, noteOffset: 100, sourceLength: 200, tiffOffset: 20, fileOffset: 100, blockId: "tiff:IFD:0:makernote:0" };
}

function provenance(): MakerNoteProvenance {
  return { noteOffset: 100, noteLength: 8, sourceLength: 200, blockId: "tiff:IFD:0:makernote:0", fieldId: "ExifIFD:0x927c", noteRelativeOffset: 4, rangeLength: 2, originalFileOffset: 104, originalFileLength: 200, offsetBase: "note-start" };
}

function field(): MakerNoteField {
  return { id: "contract:test:0x0001", tag: 1, name: "ContractValue", label: "Contract value", description: "A bounded contract fixture value.", type: "SHORT", raw: 42, value: 42, display: "42", sensitivity: "moderate", count: 1, known: true, provenance: provenance() };
}

function fieldAt(context: { readonly noteOffset: number; readonly noteLength: number; readonly sourceLength: number; }): MakerNoteField {
  return { ...field(), provenance: { ...provenance(), noteOffset: context.noteOffset, noteLength: context.noteLength, sourceLength: context.sourceLength, originalFileOffset: context.noteOffset + 4, originalFileLength: context.sourceLength, rangeLength: 2 } };
}

function plugin(id: string, overrides: Partial<MakerNotePlugin> = {}): MakerNotePlugin {
  return {
    identity: {
      id,
      version: "1.0.0",
      vendor: "Contract Vendor",
      noteFamily: "contract",
      minimumConfidence: 0.8,
      signatureTests: ["TEST at note offset 0"],
      byteOrder: "little-endian",
      baseOffsetRule: "note-start",
      nestedIfd: "bounded",
      encryption: "none",
      tagRegistry: [],
      securityRequirements: ["bounded reads", "no network"],
    },
    detect: (context) => context.read(0, 4).every((value, index) => value === [0x54, 0x45, 0x53, 0x54][index])
      ? { confidence: 0.99, evidence: [{ kind: "signature", offset: 0, length: 4, description: "TEST signature" }], byteOrder: "little-endian", baseOffsetRule: "note-start", status: "detected" }
      : null,
    parse: ({ context }) => ({ status: "detected-decoded", fields: [fieldAt(context)] }),
    ...overrides,
  };
}

describe("B07 MakerNote plugin contract", () => {
  function tiffWithMakerNote(): Uint8Array {
    const bytes = new Uint8Array(53);
    const view = new DataView(bytes.buffer);
    bytes.set([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00], 0);
    view.setUint16(8, 2, true);
    view.setUint16(10, 271, true); view.setUint16(12, 2, true); view.setUint32(14, 7, true); view.setUint32(18, 38, true);
    view.setUint16(22, 37500, true); view.setUint16(24, 7, true); view.setUint32(26, 8, true); view.setUint32(30, 45, true);
    view.setUint32(34, 0, true);
    bytes.set([67, 97, 109, 101, 114, 97, 0], 38);
    bytes.set([0x54, 0x45, 0x53, 0x54, 0x2a, 0x00, 0x00, 0x00], 45);
    return bytes;
  }

  it("integrates explicit plugins with normal TIFF parsing, blocks, fields, selection, and provenance", async () => {
    const result = await parseMetadata(tiffWithMakerNote(), { makerNotePlugins: [plugin("contract.parser")], select: { groups: ["MakerNote"] } });
    expect(result.makerNotes?.notes[0]?.status).toBe("detected-decoded");
    expect(result.makerNotes?.notes[0]?.provenance.noteOffset).toBe(45);
    expect(result.fields.some((field) => field.ifd === "MakerNote:Contract Vendor")).toBe(true);
    expect(result.blocks.some((block) => block.family === "MakerNote" && block.parentBlockId === "tiff:IFD:8")).toBe(true);
    expect(result.exif).toBeNull();
  });

  it("runs an explicitly supplied plugin through the public inspection contract", () => {
    const result = inspectMakerNotes([input()], limits, { plugins: [plugin("contract.plugin")] });
    expect(result.complete).toBe(true);
    expect(result.notes).toHaveLength(1);
    expect(result.notes[0]?.status).toBe("detected-decoded");
    expect(result.notes[0]?.fields[0]?.id).toBe("contract:test:0x0001");
    expect(makerNoteFieldsAsMetadataFields(result)[0]?.ifd).toBe("MakerNote:Contract Vendor");
  });

  it("supports deterministic little/big endian and relative/absolute offset contract fixtures", () => {
    const calls: string[] = [];
    const make = (id: string, order: "little-endian" | "big-endian", baseOffsetRule: "note-start" | "file-start"): MakerNotePlugin => plugin(id, {
      identity: { ...plugin(id).identity, byteOrder: order, baseOffsetRule },
      detect: (context) => {
        calls.push(`${id}:${context.readUint16(4, order)}`);
        return { confidence: 0.9, evidence: [{ kind: "structure", offset: 0, length: 6, description: "bounded structure" }], byteOrder: order, baseOffsetRule, status: "detected" };
      },
      parse: ({ context }) => {
        const value = context.readUint16(4, order);
        return { status: "detected-decoded", fields: [{ ...field(), raw: value, value, display: String(value), provenance: provenance() }] };
      },
    });
    const little = make("contract.a", "little-endian", "note-start");
    const big = make("contract.b", "big-endian", "file-start");
    const bytes = new Uint8Array([0x54, 0x45, 0x53, 0x54, 0x2a, 0x00, 0x00, 0x00]);
    const one = inspectMakerNotes([{ ...input(bytes), id: "little" }], limits, { plugins: [little] });
    const two = inspectMakerNotes([{ ...input(bytes), id: "big" }], limits, { plugins: [big] });
    expect(one.notes[0]?.status).toBe("detected-decoded");
    expect(two.notes[0]?.status).toBe("detected-decoded");
    expect(calls).toEqual(["contract.a:42", "contract.b:10752"]);
  });

  it("keeps unknown and low-confidence notes opaque and fail closed", () => {
    const unknown = inspectMakerNotes([input()], limits);
    expect(unknown.complete).toBe(false);
    expect(unknown.notes[0]?.status).toBe("unknown");
    expect(unknown.notes[0]?.opaqueRanges[0]?.reason).toBe("unknown");
    const low = inspectMakerNotes([input()], limits, { plugins: [plugin("low", { detect: () => ({ confidence: 0.2, evidence: [{ kind: "signature", offset: 0, length: 4, description: "weak marker" }], byteOrder: "unknown", baseOffsetRule: "note-start", status: "low-confidence" }) })] });
    expect(low.notes[0]?.status).toBe("low-confidence");
    expect(low.notes[0]?.opaqueRanges[0]?.reason).toBe("unknown");
  });

  it("contains thrown, rejected, encrypted, obfuscated, malformed, aborted, and limit outcomes", () => {
    const thrown = inspectMakerNotes([input()], limits, { plugins: [plugin("thrown", { detect: () => { throw new Error("secret raw value"); } })] });
    expect(thrown.notes[0]?.status).toBe("unknown");
    expect(thrown.diagnostics.some(({ code }) => code === "PLUGIN_THROWN")).toBe(true);
    expect(JSON.stringify(thrown)).not.toContain("secret raw value");

    const statuses = ["encrypted", "obfuscated", "malformed", "aborted", "limit-exceeded"] as const;
    for (const status of statuses) {
      const result = inspectMakerNotes([input()], limits, { plugins: [plugin(status, { parse: () => ({ status }) })] });
      expect(result.notes[0]?.status).toBe(status);
      expect(result.complete).toBe(false);
    }
    const rejected = inspectMakerNotes([input()], limits, { plugins: [plugin("out-of-range", { parse: ({ context }) => { context.read(7, 2); return { status: "detected-decoded" }; } })] });
    expect(rejected.notes[0]?.status).toBe("rejected");
    expect(rejected.diagnostics.some(({ code }) => code === "UNSAFE_RANGE")).toBe(true);
  });

  it("does not allow plugin order or shared collection mutation to change results", () => {
    const first = plugin("contract.first");
    const second = plugin("contract.second", { detect: () => null });
    const supplied = [second, first];
    const one = inspectMakerNotes([input()], limits, { plugins: supplied });
    const two = inspectMakerNotes([input()], limits, { plugins: supplied.slice().reverse() });
    expect(JSON.stringify(one)).toBe(JSON.stringify(two));
    expect(supplied).toEqual([second, first]);
  });

  it("rejects duplicate and contradictory plugin definitions without global registration", () => {
    const duplicate = plugin("duplicate", { identity: { ...plugin("duplicate").identity, tagRegistry: [{ id: "x", tag: 1, name: "X", label: "X", description: "X", type: "SHORT", repeatable: false, sensitivity: "none", rawValueBehavior: "retain" }, { id: "x", tag: 2, name: "Y", label: "Y", description: "Y", type: "SHORT", repeatable: false, sensitivity: "none", rawValueBehavior: "retain" }] } });
    const result = inspectMakerNotes([input()], limits, { plugins: [duplicate] });
    expect(result.complete).toBe(false);
    expect(result.diagnostics[0]?.code).toBe("DUPLICATE_DEFINITION");
    const independent = inspectMakerNotes([input()], limits, { plugins: [plugin("independent")] });
    expect(independent.notes[0]?.status).toBe("detected-decoded");
  });

  it("exhausts bounded plugin input, detection, result, and context failure paths", () => {
    const invalidInput = inspectMakerNotes([null as never], limits, { plugins: [plugin("invalid-input")] });
    expect(invalidInput.notes[0]?.status).toBe("rejected");
    expect(invalidInput.diagnostics[0]?.code).toBe("PLUGIN_REJECTED");
    expect(inspectMakerNotes([input(), input()], { ...limits, maxSegments: 1 }, { plugins: [plugin("too-many")] }).diagnostics).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));

    const invalidDetection = inspectMakerNotes([input()], limits, { plugins: [plugin("bad-detection", { detect: () => ({ confidence: 1 }) as never })] });
    expect(invalidDetection.notes[0]?.status).toBe("unknown");
    expect(invalidDetection.diagnostics).toContainEqual(expect.objectContaining({ code: "PLUGIN_REJECTED" }));
    const ambiguous = inspectMakerNotes([input()], limits, { plugins: [plugin("ambiguous-a"), plugin("ambiguous-b")] });
    expect(ambiguous.notes[0]?.status).toBe("low-confidence");
    expect(ambiguous.notes[0]?.diagnostics).toContainEqual(expect.objectContaining({ code: "AMBIGUOUS_DETECTION" }));

    const contextPlugin = plugin("context", {
      detect: (context) => {
        expect(context.resolveOffset(2, "note-start")).toBe(102);
        expect(context.resolveOffset(2, "file-start")).toBe(2);
        expect(context.resolveOffset(2, "tiff-start")).toBe(22);
        expect(context.resolveOffset(2, "absolute")).toBe(2);
        expect(context.resolveOffset(-1)).toBeNull();
        expect(context.resolveOffset(300)).toBeNull();
        return { confidence: 0.9, evidence: [{ kind: "structure", offset: 0, length: 4, description: "bounded" }], byteOrder: "unknown", baseOffsetRule: "tiff-start", status: "detected" };
      },
    });
    expect(inspectMakerNotes([input()], limits, { plugins: [contextPlugin] }).notes[0]?.status).toBe("detected-decoded");

    const invalidStatuses = ["not-a-status", "verified"] as const;
    for (const status of invalidStatuses) {
      const result = inspectMakerNotes([input()], limits, { plugins: [plugin(`status-${status}`, { parse: () => ({ status } as never) })] });
      expect(result.notes[0]?.status).toBe("rejected");
      expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: "PLUGIN_REJECTED" }));
    }
    const invalidField = inspectMakerNotes([input()], limits, { plugins: [plugin("bad-field", { parse: () => ({ status: "detected-decoded", fields: [{} as never] }) })] });
    expect(invalidField.notes[0]?.status).toBe("rejected");
    const invalidOpaque = inspectMakerNotes([input()], limits, { plugins: [plugin("bad-opaque", { parse: () => ({ status: "detected-decoded", opaqueRanges: [{} as never] }) })] });
    expect(invalidOpaque.notes[0]?.status).toBe("rejected");
    const diagnostics = inspectMakerNotes([input()], limits, { plugins: [plugin("diagnostics", { parse: () => ({ status: "detected-decoded", diagnostics: [{ code: "PLUGIN_THROWN", message: "secret payload" }] }) })] });
    expect(diagnostics.notes[0]?.status).toBe("detected-decoded");
    expect(JSON.stringify(diagnostics)).not.toContain("secret payload");
    const opaque = inspectMakerNotes([input()], limits, { plugins: [plugin("opaque-result", { parse: () => ({ status: "detected-decoded", opaqueRanges: [{ id: "opaque", noteRelativeOffset: 0, length: 1, originalFileOffset: 100, reason: "unknown", provenance: { ...provenance(), noteRelativeOffset: 0, rangeLength: 1 } }] }) })] });
    expect(opaque.notes[0]?.status).toBe("detected-decoded");
    expect(opaque.complete).toBe(false);

    const rangeFailure = inspectMakerNotes([input()], limits, { plugins: [plugin("range-failure", { parse: () => { throw new RangeError("outside"); } })] });
    expect(rangeFailure.notes[0]?.status).toBe("rejected");
    expect(rangeFailure.diagnostics).toContainEqual(expect.objectContaining({ code: "UNSAFE_RANGE" }));
    const thrown = inspectMakerNotes([input()], limits, { plugins: [plugin("thrown-parse", { parse: () => { throw new Error("failure"); } })] });
    expect(thrown.notes[0]?.status).toBe("rejected");
    expect(thrown.diagnostics).toContainEqual(expect.objectContaining({ code: "PLUGIN_THROWN" }));
    const aborted = new AbortController();
    aborted.abort();
    const abortedResult = inspectMakerNotes([input()], limits, { plugins: [plugin("aborted", { detect: () => { throw new Error("should not run"); } })], signal: aborted.signal });
    expect(abortedResult.notes[0]?.status).toBe("aborted");
    expect(abortedResult.diagnostics).toContainEqual(expect.objectContaining({ code: "ABORTED" }));
  });
});
