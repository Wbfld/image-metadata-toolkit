import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import {
  auditPrivacy,
  DEFAULT_LIMITS,
  inspectMakerNotes,
  type MakerNoteInput,
  type MakerNotePlugin,
  type SecurityLimits,
} from "../src/index.js";
import apple from "../src/makernote/apple.js";
import canon from "../src/makernote/canon.js";
import fujifilm from "../src/makernote/fujifilm.js";
import nikon from "../src/makernote/nikon.js";
import panasonicLeica from "../src/makernote/panasonic-leica.js";
import pentax from "../src/makernote/pentax.js";
import sony from "../src/makernote/sony.js";

const packs = [apple, canon, nikon, sony, fujifilm, panasonicLeica, pentax] as const;

function put16(bytes: Uint8Array, offset: number, value: number, little: boolean): void {
  const view = new DataView(bytes.buffer);
  view.setUint16(offset, value, little);
}

function put32(bytes: Uint8Array, offset: number, value: number, little: boolean): void {
  const view = new DataView(bytes.buffer);
  view.setUint32(offset, value, little);
}

function putAscii(bytes: Uint8Array, offset: number, value: string): void {
  bytes.set(new TextEncoder().encode(value), offset);
}

function directDirectory(count: number, tagNumber: number, type: number, value: number, little: boolean, countOffset = 0, entriesOffset = 2, countSize: 1 | 2 | 4 = 2, prefix?: (bytes: Uint8Array) => void): Uint8Array {
  const bytes = new Uint8Array(Math.max(entriesOffset + count * 12 + 16, countOffset + countSize + 4));
  prefix?.(bytes);
  if (countSize === 4) put32(bytes, countOffset, count, little);
  else if (countSize === 2) put16(bytes, countOffset, count, little);
  else bytes[countOffset] = count;
  put16(bytes, entriesOffset, tagNumber, little);
  put16(bytes, entriesOffset + 2, type, little);
  put32(bytes, entriesOffset + 4, 1, little);
  if (type === 3) put16(bytes, entriesOffset + 8, value, little);
  else put32(bytes, entriesOffset + 8, value, little);
  return bytes;
}

function fixtureFor(pack: MakerNotePlugin): Uint8Array {
  switch (pack.identity.id.split(".").at(-1)) {
    case "apple":
      return directDirectory(1, 1, 9, 4, false, 14, 16, 2, (bytes) => { putAscii(bytes, 0, "Apple iOS"); putAscii(bytes, 12, "MM"); });
    case "canon":
      return directDirectory(1, 1, 3, 7, true);
    case "nikon":
      return directDirectory(1, 2, 3, 800, false, 18, 20, 2, (bytes) => { bytes.set([0x4e, 0x69, 0x6b, 0x6f, 0x6e, 0x00, 0x02, 0x10, 0x00, 0x00], 0); bytes.set([0x4d, 0x4d, 0x00, 0x2a], 10); });
    case "sony":
      return directDirectory(1, 0x1003, 4, 42, true, 0, 2, 1, (bytes) => { bytes[0] = 1; });
    case "fujifilm":
      return directDirectory(1, 0x1001, 3, 132, true, 12, 50, 4, (bytes) => { putAscii(bytes, 0, "FUJIFILM"); });
    case "panasonic-leica": {
      const bytes = directDirectory(1, 1, 3, 7, true, 44, 46, 2, (output) => { output.set([0xff, 0xd8, 0xff], 0); putAscii(output, 32, "Panasonic\0\0\0"); });
      return bytes;
    }
    case "pentax":
      return directDirectory(1, 1, 3, 7, true, 20, 24, 4, (bytes) => { putAscii(bytes, 0, "PENTAX \0"); putAscii(bytes, 8, "IIy\0"); });
    default:
      throw new Error(`No B08 synthetic fixture for ${pack.identity.id}`);
  }
}

function input(id: string, raw: Uint8Array): MakerNoteInput {
  return { id, fieldId: "ExifIFD:0x927c", raw, noteOffset: 100, sourceLength: 100 + raw.length, tiffOffset: 100, fileOffset: 100, blockId: `test:${id}` };
}

function inspect(pack: MakerNotePlugin, raw = fixtureFor(pack), limits: SecurityLimits = DEFAULT_LIMITS, plugins: readonly MakerNotePlugin[] = [pack]) {
  return inspectMakerNotes([input(pack.identity.id, raw)], limits, { plugins });
}

describe("B08 explicit MakerNote vendor packs", () => {
  it("exposes seven immutable, independently imported pack registries with provenance", () => {
    expect(packs).toHaveLength(7);
    const ids = new Set<string>();
    for (const pack of packs) {
      expect(Object.isFrozen(pack)).toBe(true);
      expect(Object.isFrozen(pack.identity)).toBe(true);
      expect(Object.isFrozen(pack.identity.tagRegistry)).toBe(true);
      expect(Object.isFrozen(pack.identity.sources)).toBe(true);
      expect(pack.identity.minimumConfidence).toBeGreaterThan(0);
      expect(pack.identity.sources?.length).toBeGreaterThan(0);
      expect(pack.identity.tagRegistry.length).toBeGreaterThan(0);
      expect(ids.has(pack.identity.id)).toBe(false);
      ids.add(pack.identity.id);
      expect(new Set(pack.identity.tagRegistry.map((definition) => definition.id)).size).toBe(pack.identity.tagRegistry.length);
      expect(new Set(pack.identity.tagRegistry.map((definition) => definition.tag)).size).toBe(pack.identity.tagRegistry.length);
      expect(pack.identity.tagRegistry.every((definition) => definition.source !== undefined && definition.source.length > 0)).toBe(true);
      expect(Object.isFrozen(pack.identity.signatureTests)).toBe(true);
      expect(Object.isFrozen(pack.identity.securityRequirements)).toBe(true);
      expect(Object.isFrozen(pack.identity.supportedModels)).toBe(true);
      expect(pack.identity.tagRegistry.every((definition) => definition.applicableModels?.length === pack.identity.supportedModels?.length && definition.applicableVersions?.length === 1 && definition.validation !== undefined && definition.validation.length > 0)).toBe(true);
      expect(pack.identity.tagRegistry.every((definition) => Object.isFrozen(definition.applicableModels) && Object.isFrozen(definition.applicableVersions))).toBe(true);
    }
  });

  it.each(packs.map((pack) => [pack.identity.vendor, pack] as const))("decodes a bounded positive structure for %s", (_vendor, pack) => {
    const result = inspect(pack);
    const note = result.notes[0];
    expect(note?.plugin?.id).toBe(pack.identity.id);
    expect(note?.status).toBe("detected-decoded");
    expect(note?.fields.length).toBeGreaterThan(0);
    expect(note?.fields.every((field) => field.provenance.noteRelativeOffset >= 0 && field.provenance.originalFileOffset !== null)).toBe(true);
  });

  it("supports Nikon Type 2 and Type 3 byte order variants through one pack", () => {
    const type2 = directDirectory(1, 2, 3, 800, true, 18, 20, 2, (bytes) => { bytes.set([0x4e, 0x69, 0x6b, 0x6f, 0x6e, 0x00, 0x02, 0x11, 0x00, 0x00], 0); bytes.set([0x49, 0x49, 0x2a, 0x00], 10); });
    const type3 = fixtureFor(nikon);
    for (const raw of [type2, type3]) {
      const note = inspect(nikon, raw).notes[0];
      expect(note?.status).toBe("detected-decoded");
      expect(note?.detection?.byteOrder).toMatch(/little-endian|big-endian/);
      expect(note?.fields.length).toBe(1);
    }
  });

  it("keeps wrong-vendor and ambiguous detection opaque", () => {
    const raw = fixtureFor(canon);
    const wrong = inspectMakerNotes([input("wrong", raw)], DEFAULT_LIMITS, { plugins: [apple, nikon, sony, fujifilm, panasonicLeica, pentax] });
    expect(wrong.notes[0]?.status).not.toBe("detected-decoded");
    expect(wrong.notes[0]?.fields).toHaveLength(0);
    const ambiguous = inspectMakerNotes([input("ambiguous", raw)], DEFAULT_LIMITS, {
      plugins: [canon, { ...canon, identity: { ...canon.identity, id: "org.test.duplicate-structure", version: "1.0.0" } }],
    });
    expect(ambiguous.notes[0]?.status).toBe("low-confidence");
    expect(ambiguous.notes[0]?.opaqueRanges.length).toBeGreaterThan(0);
  });

  it.each(packs.map((pack) => [pack.identity.vendor, pack] as const))("fails closed for truncation and entry limits: %s", (_vendor, pack) => {
    const raw = fixtureFor(pack);
    const truncated = inspect(pack, raw.slice(0, 5));
    const truncatedNote = truncated.notes[0];
    expect(truncatedNote?.status === "detected-decoded" && truncatedNote.opaqueRanges.length === 0).toBe(false);
    const limited = inspect(pack, raw, { ...DEFAULT_LIMITS, maxIfdEntries: 0 });
    expect(limited.notes[0]?.status).toBe("limit-exceeded");
    expect(limited.notes[0]?.opaqueRanges.length).toBeGreaterThan(0);
  });

  it("retains invalid text as opaque instead of decoding it", () => {
    const raw = new Uint8Array(40);
    put16(raw, 0, 2, true);
    put16(raw, 2, 1, true); put16(raw, 4, 3, true); put32(raw, 6, 1, true); put16(raw, 10, 7, true);
    put16(raw, 14, 6, true); put16(raw, 16, 2, true); put32(raw, 18, 3, true); raw.set([0xff, 0x00, 0x00], 22);
    const result = inspect(canon, raw);
    expect(result.notes[0]?.fields.some((field) => field.id === "canon:0x0006")).toBe(false);
    expect(result.notes[0]?.opaqueRanges.length).toBeGreaterThan(0);
  });

  it("keeps malformed, unsupported, oversized, and unsafe structures opaque", () => {
    for (const pack of packs) {
      const malformed = fixtureFor(pack).slice();
      malformed[0] = (malformed[0] ?? 0) ^ 0xff;
      const malformedResult = inspect(pack, malformed);
      expect(malformedResult.notes[0]?.status).not.toBe("detected-decoded");
      expect(malformedResult.notes[0]?.opaqueRanges.length).toBeGreaterThan(0);

      const unsupported = fixtureFor(pack).slice();
      const layout = pack.identity.id.endsWith("apple") ? 16 : pack.identity.id.endsWith("fujifilm") ? 50 : pack.identity.id.endsWith("pentax") ? 24 : pack.identity.id.endsWith("nikon") ? 20 : pack.identity.id.endsWith("panasonic-leica") ? 46 : 2;
      const little = !pack.identity.id.endsWith("apple") && !pack.identity.id.endsWith("nikon");
      put16(unsupported, layout + 2, 13, little);
      const unsupportedResult = inspect(pack, unsupported);
      expect(unsupportedResult.notes[0]?.opaqueRanges.length).toBeGreaterThan(0);

      const unsafe = fixtureFor(pack).slice();
      const countOffset = pack.identity.id.endsWith("apple") ? 14 : pack.identity.id.endsWith("fujifilm") ? 12 : pack.identity.id.endsWith("pentax") ? 20 : pack.identity.id.endsWith("nikon") ? 18 : pack.identity.id.endsWith("panasonic-leica") ? 44 : 0;
      const countSize = pack.identity.id.endsWith("fujifilm") || pack.identity.id.endsWith("pentax") ? 4 : 2;
      if (countSize === 4) put32(unsafe, countOffset, 0xffffffff, little); else put16(unsafe, countOffset, 0xffff, little);
      const unsafeResult = inspect(pack, unsafe);
      expect(unsafeResult.notes[0]?.status).not.toBe("detected-decoded");
      expect(unsafeResult.notes[0]?.opaqueRanges.length).toBeGreaterThan(0);
    }
  });

  it("preserves duplicate note instances and aborts before decoding", () => {
    const raw = fixtureFor(apple);
    const duplicate = inspectMakerNotes([input("first", raw), input("second", raw)], DEFAULT_LIMITS, { plugins: [apple] });
    expect(duplicate.notes).toHaveLength(2);
    expect(duplicate.notes.map((note) => note.id)).toEqual(["first", "second"]);

    const controller = new AbortController();
    controller.abort();
    const aborted = inspectMakerNotes([input("aborted", raw)], DEFAULT_LIMITS, { plugins: [apple], signal: controller.signal });
    expect(aborted.notes[0]?.status).toBe("aborted");
    expect(aborted.complete).toBe(false);
  });

  it("keeps MakerNote privacy fail-closed with and without an explicit pack", async () => {
    const raw = new Uint8Array(32);
    putAscii(raw, 0, "Apple iOS");
    putAscii(raw, 12, "MM");
    put16(raw, 14, 1, false);
    put16(raw, 16, 0x000f, false);
    put16(raw, 18, 9, false);
    put32(raw, 20, 1, false);
    put32(raw, 24, 7, false);
    const bytes = new Uint8Array(88);
    bytes.set([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00], 0);
    put16(bytes, 8, 1, true);
    put16(bytes, 10, 0x8769, true); put16(bytes, 12, 4, true); put32(bytes, 14, 1, true); put32(bytes, 18, 38, true);
    put32(bytes, 22, 0, true);
    put16(bytes, 38, 1, true);
    put16(bytes, 40, 0x927c, true); put16(bytes, 42, 7, true); put32(bytes, 44, raw.length, true); put32(bytes, 48, 56, true);
    put32(bytes, 52, 0, true);
    bytes.set(raw, 56);

    const decoded = await auditPrivacy(bytes, { makerNotePlugins: [apple] });
    expect(decoded.findings.some((finding) => finding.target === "apple:0x000f" && finding.state === "decoded-finding")).toBe(true);
    const opaque = await auditPrivacy(bytes);
    expect(opaque.findings.some((finding) => finding.category === "opaque-block" && finding.state === "opaque-risk")).toBe(true);
    expect(JSON.stringify(opaque)).not.toContain("Apple iOS");
  });

  it("rejects duplicate plugin IDs and does not allow import order to change selection", () => {
    const raw = fixtureFor(nikon);
    const duplicate = inspectMakerNotes([input("duplicate", raw)], DEFAULT_LIMITS, { plugins: [nikon, nikon] });
    expect(duplicate.diagnostics.some((item) => item.code === "DUPLICATE_DEFINITION")).toBe(true);
    const forward = inspectMakerNotes([input("order", raw)], DEFAULT_LIMITS, { plugins: [nikon, canon, apple] });
    const reverse = inspectMakerNotes([input("order", raw)], DEFAULT_LIMITS, { plugins: [apple, canon, nikon] });
    expect(forward.notes[0]?.plugin?.id).toBe(reverse.notes[0]?.plugin?.id);
    expect(forward.notes[0]?.fields.map((field) => field.id)).toEqual(reverse.notes[0]?.fields.map((field) => field.id));
  });

  it("keeps vendor packs out of the package-root bundle and exposes separate subpath exports", () => {
    const rootBundle = readFileSync(new URL("../dist/index.js", import.meta.url), "utf8");
    for (const vendor of ["apple", "canon", "nikon", "sony", "fujifilm", "panasonic-leica", "pentax"]) {
      expect(rootBundle).not.toContain(`org.browser-image-metadata.makernote.${vendor}`);
    }
    const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { exports: Record<string, { import: { types: string; default: string }; require: { types: string; default: string } }> };
    for (const subpath of ["./makernote/apple", "./makernote/canon", "./makernote/nikon", "./makernote/sony", "./makernote/fujifilm", "./makernote/panasonic-leica", "./makernote/pentax"]) {
      expect(packageJson.exports[subpath]).toBeDefined();
      const entry = packageJson.exports[subpath];
      if (entry === undefined) throw new Error(`Missing MakerNote package export: ${subpath}`);
      expect(() => readFileSync(new URL(`../${entry.import.types.slice(2)}`, import.meta.url))).not.toThrow();
      expect(() => readFileSync(new URL(`../${entry.import.default.slice(2)}`, import.meta.url))).not.toThrow();
      expect(() => readFileSync(new URL(`../${entry.require.types.slice(2)}`, import.meta.url))).not.toThrow();
      expect(() => readFileSync(new URL(`../${entry.require.default.slice(2)}`, import.meta.url))).not.toThrow();
    }
    const require = createRequire(import.meta.url);
    const cjsPlugin = require("../dist/makernote/apple.cjs") as MakerNotePlugin;
    expect(cjsPlugin.identity.id).toBe(apple.identity.id);
  });
});
