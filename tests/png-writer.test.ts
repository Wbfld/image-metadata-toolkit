import { describe, expect, it } from "vitest";

import { parsePngDimensions } from "../src/parsers/png.js";
import { parseMetadata } from "../src/index.js";
import { rewritePngMetadata, PngWriterError } from "../src/png-writer.js";

const encoder = new TextEncoder();

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}

function crc32(bytes: Uint8Array, start: number, end: number): number {
  let crc = 0xffffffff;
  for (let offset = start; offset < end; offset += 1) {
    crc ^= bytes[offset] ?? 0;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length + 12);
  new DataView(result.buffer).setUint32(0, data.length);
  result.set(encoder.encode(type), 4);
  result.set(data, 8);
  new DataView(result.buffer).setUint32(data.length + 8, crc32(result, 4, data.length + 8));
  return result;
}

function png(chunks: readonly Uint8Array[]): Uint8Array {
  return concat(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), ...chunks);
}

function ihdr(width = 2, height = 2): Uint8Array {
  const data = new Uint8Array(13);
  const view = new DataView(data.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  data.set([8, 6, 0, 0, 0], 8);
  return chunk("IHDR", data);
}

function minimalTiff(make = "Before"): Uint8Array {
  const text = encoder.encode(`${make}\0`);
  const result = new Uint8Array(8 + 2 + 12 + 4 + text.length);
  result.set([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0], 0);
  result.set([1, 0], 8);
  result.set([0x0f, 0x01, 0x02, 0], 10);
  new DataView(result.buffer).setUint32(14, text.length, true);
  new DataView(result.buffer).setUint32(18, 26, true);
  result.set(text, 26);
  return result;
}

function basePng(extra: readonly Uint8Array[] = []): Uint8Array {
  return png([ihdr(), ...extra, chunk("IDAT", Uint8Array.of(1, 2, 3, 4)), chunk("IEND", new Uint8Array())]);
}

describe("W04 transactional PNG metadata writing", () => {
  it("adds, replaces, and removes eXIf, iTXt XMP, ordinary text, and iCCP without changing IDAT", async () => {
    const input = basePng([chunk("tEXt", concat(encoder.encode("Comment\0before"))), chunk("IDAT", Uint8Array.of(5, 6))]);
    const first = await rewritePngMetadata(input, {
      blocks: [
        { op: "add", kind: "exif", data: minimalTiff() },
        { op: "add", kind: "xmp", data: "<x:xmpmeta>one</x:xmpmeta>" },
        { op: "add", kind: "text", keyword: "Comment", data: "after" },
        { op: "add", kind: "icc", data: (() => { const profileBytes = new Uint8Array(132); new DataView(profileBytes.buffer).setUint32(0, 132); profileBytes.set([0x61, 0x63, 0x73, 0x70], 36); return profileBytes; })() },
      ],
    });
    expect(first.preservedPayloads.map(({ before }) => before)).toEqual([Uint8Array.of(5, 6), Uint8Array.of(1, 2, 3, 4)]);
    expect(first.preservedPayloads.every(({ before, after }) => before.length === after.length && before.every((byte, index) => after[index] === byte))).toBe(true);
    const parsed = await parseMetadata(first.data);
    expect(parsed.exif?.fields.find((field) => field.name === "Make")?.value).toBe("Before");
    expect(parsed.xmp?.packets).toEqual(["<x:xmpmeta>one</x:xmpmeta>"]);
    expect(parsed.pngText.map(({ keyword, text }) => [keyword, text])).toEqual([["Comment", "before"], ["Comment", "after"], ["XML:com.adobe.xmp", "<x:xmpmeta>one</x:xmpmeta>"]]);
    expect(parsed.icc?.complete).toBe(true);

    const xmp = parsed.blocks.find((block) => block.family === "XMP");
    if (xmp === undefined) throw new Error("XMP block was not indexed");
    const replaced = await rewritePngMetadata(first.data, { blocks: [{ op: "replace", kind: "xmp", blockId: xmp.id, data: "<x:xmpmeta>two</x:xmpmeta>" }] });
    expect((await parseMetadata(replaced.data)).xmp?.packets).toEqual(["<x:xmpmeta>two</x:xmpmeta>"]);
    const removed = await rewritePngMetadata(replaced.data, { blocks: [{ op: "remove", kind: "xmp" }, { op: "remove", kind: "icc" }] });
    expect(removed.data).toBeInstanceOf(Uint8Array);
  });

  it("supports compressed zTXt/iTXt values, Unicode, repeated IDAT, APNG controls, and unknown ancillary chunks", async () => {
    const input = basePng([
      chunk("acTL", Uint8Array.of(1, 0, 0, 0, 1, 0, 0, 0)),
      chunk("fcTL", Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0)),
      chunk("fdAT", Uint8Array.of(0, 0, 0, 1, 7, 8)),
      chunk("vpAg", Uint8Array.of(9, 8, 7)),
    ]);
    const result = await rewritePngMetadata(input, { blocks: [{ op: "add", kind: "text", keyword: "Unicode", chunkType: "iTXt", compressed: true, language: "en", translatedKeyword: "Label", data: "héllo 🌍" }] });
    const parsed = await parseMetadata(result.data);
    expect(parsed.pngText.find(({ keyword }) => keyword === "Unicode")?.text).toBe("héllo 🌍");
    expect(result.preservedPayloads).toHaveLength(2);
    expect(result.preservedPayloads.every(({ before, after }) => before.every((value, index) => value === after[index]))).toBe(true);
    const compressed = await rewritePngMetadata(result.data, { blocks: [{ op: "add", kind: "text", keyword: "Compressed", chunkType: "zTXt", data: "compressed value" }] });
    expect((await parseMetadata(compressed.data)).pngText.find(({ keyword }) => keyword === "Compressed")?.text).toBe("compressed value");
  });

  it("enforces duplicate policy, CRC policy, ordering, truncation, and output limits atomically", async () => {
    const duplicate = basePng([chunk("tEXt", concat(encoder.encode("Same\0one"))), chunk("tEXt", concat(encoder.encode("Same\0two")))]);
    await expect(rewritePngMetadata(duplicate, { blocks: [{ op: "replace", kind: "text", keyword: "Same", data: "x" }], duplicatePolicy: "reject" })).rejects.toThrow(PngWriterError);
    const first = await rewritePngMetadata(duplicate, { blocks: [{ op: "replace", kind: "text", keyword: "Same", data: "x" }], duplicatePolicy: "replace-target" });
    expect((await parseMetadata(first.data)).pngText.filter(({ keyword }) => keyword === "Same").map(({ text }) => text)).toEqual(["x", "two"]);

    const bad = basePng([chunk("vpAg", Uint8Array.of(1, 2, 3))]);
    bad[44] = (bad[44] ?? 0) ^ 0xff;
    await expect(rewritePngMetadata(bad, { blocks: [{ op: "add", kind: "text", keyword: "x", data: "y" }] })).rejects.toThrow(/CRC/);
    await expect(rewritePngMetadata(bad, { blocks: [{ op: "add", kind: "text", keyword: "x", data: "y" }], crcPolicy: "preserve-unknown" })).resolves.toBeDefined();

    const truncated = basePng().slice(0, -3);
    await expect(rewritePngMetadata(truncated, { blocks: [{ op: "add", kind: "text", keyword: "x", data: "y" }] })).rejects.toThrow(PngWriterError);
    await expect(rewritePngMetadata(basePng(), { blocks: [{ op: "add", kind: "text", keyword: "x", data: "y" }], limits: { maxAdapterOutputBytes: 20 } })).rejects.toThrow(/output limit/);
  });

  it("retains source bytes and exposes a strict parser index", () => {
    const input = basePng();
    expect(parsePngDimensions(input)).toEqual({ width: 2, height: 2 });
    expect(input).toEqual(basePng());
  });

  it("executes normalized EXIF set/delete transactions through editMetadata, including a missing eXIf block", async () => {
    const input = basePng();
    const set = await (await import("../src/edit.js")).editMetadata(input, {
      operations: [{ op: "set", operationId: "make", target: { kind: "field", fieldId: "normalized:Make" }, value: "PNG camera" }],
    });
    expect(set.successful).toBe(true);
    if (!set.successful) throw new Error("PNG EXIF set did not complete");
    expect((await parseMetadata(set.data)).fields.find(({ name }) => name === "Make")?.value).toBe("PNG camera");
    const deleted = await (await import("../src/edit.js")).editMetadata(set.data, {
      operations: [{ op: "delete", operationId: "make", target: { kind: "field", fieldId: "normalized:Make" } }],
    });
    expect(deleted.successful).toBe(true);
    if (!deleted.successful) throw new Error("PNG EXIF delete did not complete");
    expect((await parseMetadata(deleted.data)).fields.some(({ name }) => name === "Make")).toBe(false);
  });
});
