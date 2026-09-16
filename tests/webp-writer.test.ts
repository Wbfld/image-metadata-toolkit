import { afterAll, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { exiftool } from "exiftool-vendored";

import { editMetadata } from "../src/edit.js";
import { parseMetadata } from "../src/index.js";
import { rewriteWebpMetadata, WebpWriterError } from "../src/webp-writer.js";

const encoder = new TextEncoder();

afterAll(async () => { await exiftool.end(); });

function oracleTag(tags: unknown, key: string): unknown {
  if (typeof tags !== "object" || tags === null) return undefined;
  return (tags as Record<string, unknown>)[key];
}

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const result = new Uint8Array(8 + data.length + (data.length & 1));
  result.set(encoder.encode(type), 0);
  new DataView(result.buffer).setUint32(4, data.length, true);
  result.set(data, 8);
  return result;
}

function webp(chunks: readonly Uint8Array[]): Uint8Array {
  const body = concat(...chunks);
  const result = new Uint8Array(12 + body.length);
  result.set(encoder.encode("RIFF"), 0);
  new DataView(result.buffer).setUint32(4, body.length + 4, true);
  result.set(encoder.encode("WEBP"), 8);
  result.set(body, 12);
  return result;
}

function vp8l(): Uint8Array { return chunk("VP8L", Uint8Array.of(0x2f, 1, 0x40, 0, 0)); }

function vp8x(flags = 0): Uint8Array {
  return chunk("VP8X", Uint8Array.of(flags, 0, 0, 0, 1, 0, 0, 1, 0, 0));
}

function tiff(make = "Before"): Uint8Array {
  const text = encoder.encode(`${make}\0`);
  const result = new Uint8Array(26 + text.length);
  result.set([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 1, 0, 0x0f, 0x01, 0x02, 0, text.length, 0, 0, 0, 26, 0, 0, 0], 0);
  result.set(text, 26);
  return result;
}

function tiffWithOrientation(make = "Before", orientation = 6): Uint8Array {
  const text = encoder.encode(`${make}\0`);
  const result = new Uint8Array(38 + text.length);
  const view = new DataView(result.buffer);
  result.set([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0], 0);
  view.setUint16(8, 2, true);
  view.setUint16(10, 0x010f, true); view.setUint16(12, 2, true); view.setUint32(14, text.length, true); view.setUint32(18, 38, true);
  view.setUint16(22, 0x0112, true); view.setUint16(24, 3, true); view.setUint32(26, 1, true); view.setUint16(30, orientation, true);
  view.setUint32(34, 0, true);
  result.set(text, 38);
  return result;
}

function profile(): Uint8Array {
  const result = new Uint8Array(132);
  new DataView(result.buffer).setUint32(0, result.length);
  result.set([0x61, 0x63, 0x73, 0x70], 36);
  return result;
}

describe("W05 transactional WebP metadata writing", () => {
  it("writes the repository WebP fixture and reparses it with unchanged image payload evidence", async () => {
    const input = new Uint8Array(await readFile(new URL("./fixtures/webp-metadata.webp", import.meta.url)));
    const result = rewriteWebpMetadata(input, { blocks: [{ op: "add", kind: "xmp", data: "<x:xmpmeta>fixture</x:xmpmeta>" }] });
    expect(result.preservedPayloads.length).toBeGreaterThan(0);
    expect(result.preservedPayloads.every(({ before, after }) => before.every((value, index) => value === after[index]))).toBe(true);
    expect((await parseMetadata(result.data)).xmp?.packets).toContain("<x:xmpmeta>fixture</x:xmpmeta>");
  });

  it("promotes simple VP8L to VP8X and writes XMP/ICC/EXIF while preserving the image chunk", async () => {
    const input = webp([vp8l()]);
    const imageBefore = input.slice(20);
    const result = rewriteWebpMetadata(input, {
      blocks: [
        { op: "add", kind: "xmp", data: "<x:xmpmeta>one</x:xmpmeta>" },
        { op: "add", kind: "icc", data: profile() },
        { op: "add", kind: "exif", data: tiff() },
      ],
    });
    expect(result.data.slice(-imageBefore.length)).toEqual(imageBefore);
    const parsed = await parseMetadata(result.data);
    expect(parsed.dimensions).toEqual({ width: 2, height: 2 });
    expect(parsed.xmp?.packets).toEqual(["<x:xmpmeta>one</x:xmpmeta>"]);
    expect(parsed.icc?.complete).toBe(true);
    expect(parsed.exif?.fields.find(({ name }) => name === "Make")?.value).toBe("Before");
    const vp8xOffset = result.data.findIndex((value, index) => value === 0x56 && result.data[index + 1] === 0x50 && result.data[index + 2] === 0x38 && result.data[index + 3] === 0x58);
    expect(vp8xOffset).toBe(12);
    expect(result.data[20]).toBe(0x20 | 0x08 | 0x04);
    expect(new DataView(result.data.buffer, result.data.byteOffset, result.data.byteLength).getUint32(4, true)).toBe(result.data.length - 8);
  });

  it("edits EXIF fields selectively and preserves VP8X alpha, animation, odd padding, and unknown chunks", async () => {
    const unknown = chunk("JUNK", Uint8Array.of(9, 8, 7));
    const alpha = chunk("ALPH", Uint8Array.of(4, 3, 2));
    const anim = chunk("ANIM", Uint8Array.of(1, 0, 0, 0, 1, 0, 0, 0));
    const frame = chunk("ANMF", Uint8Array.of(1, 2, 3, 4, 5));
    const exif = chunk("EXIF", tiff());
    const input = webp([vp8x(0x12), unknown, exif, alpha, anim, frame]);
    const result = await editMetadata(input, { operations: [{ op: "set", operationId: "make", target: { kind: "field", fieldId: "normalized:Make" }, value: "After" }] });
    expect(result.successful).toBe(true);
    if (!result.successful) throw new Error("WebP EXIF edit did not complete");
    const parsed = await parseMetadata(result.data);
    expect(parsed.exif?.fields.find(({ name }) => name === "Make")?.value).toBe("After");
    expect(result.data).toContainEqual(9);
    expect(result.output?.payloads).toHaveLength(2);
    expect(result.output?.payloads.every(({ comparable }) => comparable)).toBe(true);
    expect(result.data[20]).toBe(0x12 | 0x08);
    const deleted = await editMetadata(result.data, { operations: [{ op: "delete", operationId: "make", target: { kind: "field", fieldId: "normalized:Make" } }] });
    expect(deleted.successful).toBe(true);
    if (!deleted.successful) throw new Error("WebP EXIF delete did not complete");
    expect((await parseMetadata(deleted.data)).fields.some(({ name }) => name === "Make")).toBe(false);
  });

  it("preserves, edits, and deletes orientation independently of another EXIF field across VP8, VP8L, and VP8X", async () => {
    const realVp8 = new Uint8Array(await readFile(new URL("./fixtures/webp-metadata.webp", import.meta.url)));
    const vp8lInput = webp([vp8l(), chunk("EXIF", tiffWithOrientation())]);
    const vp8xInput = webp([vp8x(0x12), chunk("ALPH", Uint8Array.of(4, 3, 2)), chunk("ANIM", Uint8Array.of(1, 0, 0, 0, 1, 0, 0, 0)), chunk("ANMF", Uint8Array.of(1, 2, 3, 4, 5)), chunk("EXIF", tiffWithOrientation())]);
    const directory = await mkdtemp(join(tmpdir(), "w05-webp-orientation-"));

    try {
      const oracle = async (name: string, bytes: Uint8Array) => {
        const pathname = join(directory, `${name}.webp`);
        await writeFile(pathname, bytes);
        const result = await exiftool.read(pathname, { readArgs: ["-G1", "-n"] });
        expect(result.errors, name).toEqual([]);
        return result;
      };

      for (const [container, input] of [["VP8", realVp8], ["VP8L", vp8lInput], ["VP8X", vp8xInput]] as const) {
        const before = await parseMetadata(input);
        expect(before.dimensions, container).toEqual({ width: 2, height: 2 });
        expect(before.exif?.fields.find(({ name }) => name === "Orientation")?.value, container).toBe(6);
        const beforeOracle = await oracle(`${container}-before`, input);
        expect(oracleTag(beforeOracle, "IFD0:Orientation"), container).toBe(6);
        const changed = await editMetadata(input, { operations: [{ op: "set", operationId: `${container}-make`, target: { kind: "field", fieldId: "normalized:Make" }, value: "Changed" }] });
        expect(changed.successful, `${container} unrelated edit`).toBe(true);
        if (!changed.successful) throw new Error(`${container} unrelated EXIF edit failed`);
        const afterUnrelatedEdit = await parseMetadata(changed.data);
        expect(afterUnrelatedEdit.dimensions, container).toEqual({ width: 2, height: 2 });
        expect(afterUnrelatedEdit.exif?.fields.find(({ name }) => name === "Make")?.value, container).toBe("Changed");
        expect(afterUnrelatedEdit.exif?.fields.find(({ name }) => name === "Orientation")?.value, container).toBe(6);
        expect(changed.output?.payloads.every(({ comparable }) => comparable), container).toBe(true);
        const changedOracle = await oracle(`${container}-unrelated`, changed.data);
        expect(oracleTag(changedOracle, "IFD0:Orientation"), container).toBe(6);
        expect(oracleTag(changedOracle, "IFD0:Make"), container).toBe("Changed");

        const explicitlyChanged = await editMetadata(changed.data, { policy: { orientation: "allow-change" }, operations: [{ op: "set", operationId: `${container}-orientation`, target: { kind: "field", fieldId: "normalized:Orientation" }, value: 3 }] });
        expect(explicitlyChanged.successful, `${container} orientation set`).toBe(true);
        if (!explicitlyChanged.successful) throw new Error(`${container} orientation set failed`);
        const changedOrientation = await parseMetadata(explicitlyChanged.data);
        expect(changedOrientation.dimensions, container).toEqual({ width: 2, height: 2 });
        expect(changedOrientation.exif?.fields.find(({ name }) => name === "Orientation")?.value, container).toBe(3);
        expect(changedOrientation.exif?.fields.find(({ name }) => name === "Make")?.value, container).toBe("Changed");
        expect(explicitlyChanged.output?.payloads.every(({ comparable }) => comparable), container).toBe(true);
        const explicitlyChangedOracle = await oracle(`${container}-changed`, explicitlyChanged.data);
        expect(oracleTag(explicitlyChangedOracle, "IFD0:Orientation"), container).toBe(3);
        expect(oracleTag(explicitlyChangedOracle, "IFD0:Make"), container).toBe("Changed");

        const deleted = await editMetadata(explicitlyChanged.data, { policy: { orientation: "allow-change" }, operations: [{ op: "delete", operationId: `${container}-orientation-delete`, target: { kind: "field", fieldId: "normalized:Orientation" } }] });
        expect(deleted.successful, `${container} orientation delete`).toBe(true);
        if (!deleted.successful) throw new Error(`${container} orientation delete failed`);
        const afterDelete = await parseMetadata(deleted.data);
        expect(afterDelete.dimensions, container).toEqual({ width: 2, height: 2 });
        expect(afterDelete.exif?.fields.some(({ name }) => name === "Orientation"), container).toBe(false);
        expect(afterDelete.exif?.fields.find(({ name }) => name === "Make")?.value, container).toBe("Changed");
        expect(deleted.output?.payloads.every(({ comparable }) => comparable), container).toBe(true);
        const deletedOracle = await oracle(`${container}-deleted`, deleted.data);
        expect(oracleTag(deletedOracle, "IFD0:Orientation"), container).toBeUndefined();
        expect(oracleTag(deletedOracle, "IFD0:Make"), container).toBe("Changed");
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }, 30_000);

  it("handles duplicate XMP chunks, physical selectors, removals, malformed RIFF, and unsupported values", async () => {
    const input = webp([vp8x(), chunk("XMP ", encoder.encode("one")), chunk("XMP ", encoder.encode("two")), vp8l()]);
    const parsed = await parseMetadata(input);
    const first = parsed.blocks.find(({ family }) => family === "XMP");
    if (first === undefined) throw new Error("XMP chunk was not indexed");
    const replaced = rewriteWebpMetadata(input, { blocks: [{ op: "replace", kind: "xmp", blockId: first.id, data: "first" }] });
    expect((await parseMetadata(replaced.data)).xmp?.packets).toEqual(["first", "two"]);
    await expect(Promise.resolve().then(() => rewriteWebpMetadata(input, { blocks: [{ op: "replace", kind: "xmp", data: "x" }], duplicatePolicy: "reject" }))).rejects.toThrow(WebpWriterError);
    const removed = rewriteWebpMetadata(input, { blocks: [{ op: "remove", kind: "xmp" }] });
    expect((await parseMetadata(removed.data)).xmp).toBeNull();
    const malformed = input.slice(0, -1);
    await expect(Promise.resolve().then(() => rewriteWebpMetadata(malformed, { blocks: [{ op: "add", kind: "xmp", data: "x" }] }))).rejects.toThrow(/RIFF|boundary/);
    await expect(Promise.resolve().then(() => rewriteWebpMetadata(input, { blocks: [{ op: "add", kind: "icc", data: Uint8Array.of(1, 2, 3) }] }))).rejects.toThrow(/ICC/);
  });
});
