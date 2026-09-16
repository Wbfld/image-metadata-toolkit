import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { rewriteJpegMetadata } from "../src/jpeg-writer.js";
import { rewritePngMetadata } from "../src/png-writer.js";
import { rewriteWebpMetadata } from "../src/webp-writer.js";
import { parseMetadata } from "../src/index.js";

async function fixture(name: string): Promise<Uint8Array> { return new Uint8Array(await readFile(new URL(`./fixtures/${name}`, import.meta.url))); }

function profile(): Uint8Array {
  const bytes = new Uint8Array(132);
  new DataView(bytes.buffer).setUint32(0, bytes.length, false);
  bytes.set([0x61, 0x63, 0x73, 0x70], 36);
  return bytes;
}

function tiff(): Uint8Array {
  const bytes = new Uint8Array(26);
  bytes.set([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 1, 0, 0x0f, 0x01, 0x02, 0, 0, 0, 0, 0, 26, 0, 0, 0, 0, 0, 0, 0]);
  return bytes;
}

async function expectFailure(action: () => unknown, code?: string): Promise<void> {
  const result = await Promise.resolve().then(action).catch((error: unknown) => error);
  if (!(result instanceof Error) || !("code" in result) || typeof result.code !== "string") throw result;
  if (code !== undefined) expect(result.code).toBe(code);
}

describe("S06 writer execution and failure matrix", () => {
  it("exercises JPEG block kinds, duplicate policies, verification modes, and typed malformed-input rejection", async () => {
    const input = await fixture("jpeg-exif-little-endian.jpg");
    const standardXmp = "<x:xmpmeta xmlns:x=\"adobe:ns:meta/\"><rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\"><rdf:Description xmlns:xmpNote=\"http://ns.adobe.com/xmp/note/\" xmpNote:HasExtendedXMP=\"0123456789ABCDEF0123456789ABCDEF\"/></rdf:RDF></x:xmpmeta>";
    const blocks = [
      { op: "add" as const, kind: "standard-xmp" as const, data: standardXmp },
      { op: "add" as const, kind: "extended-xmp" as const, guid: "0123456789abcdef0123456789abcdef", data: "extended" },
      { op: "add" as const, kind: "icc" as const, data: profile() },
      { op: "add" as const, kind: "iptc" as const, data: Uint8Array.of(0x1c, 2, 5, 0, 1, 65) },
    ];
    const added = rewriteJpegMetadata(input, { blocks, verify: false });
    expect(added.preservation).toBeNull();
    expect((await parseMetadata(added.data)).xmp?.packets).toContain(standardXmp);
    expect((await parseMetadata(added.data)).icc?.complete).toBe(true);
    expect((await parseMetadata(added.data)).iptc).not.toBeNull();
    for (const duplicatePolicy of ["preserve", "replace-target", "deduplicate-equivalent", "reject"] as const) {
      const duplicate = rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "standard-xmp", data: "one" }, { op: "add", kind: "standard-xmp", data: "two" }], duplicatePolicy, verify: false });
      expect(duplicate.data.length).toBeGreaterThan(input.length);
    }
    const standardBlock = (await parseMetadata(added.data)).blocks.find(({ family }) => family === "XMP");
    expect(standardBlock).toBeDefined();
    const replaced = rewriteJpegMetadata(added.data, { blocks: [{ op: "replace", kind: "standard-xmp", data: standardXmp.replace("HasExtendedXMP=\"0123456789ABCDEF0123456789ABCDEF\"", "HasExtendedXMP=\"0123456789ABCDEF0123456789ABCDEF\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\"") }] });
    expect((await parseMetadata(replaced.data)).xmp?.packets).toHaveLength(2);
    const removed = rewriteJpegMetadata(replaced.data, { blocks: [{ op: "remove", kind: "standard-xmp" }, { op: "remove", kind: "extended-xmp", guid: "0123456789abcdef0123456789abcdef" }] });
    expect((await parseMetadata(removed.data)).xmp?.packets ?? []).not.toContain(standardXmp);
    await expectFailure(() => rewriteJpegMetadata(new Uint8Array(), { blocks: [{ op: "add", kind: "standard-xmp", data: "x" }] }), "UNSAFE_STRUCTURE");
    await expectFailure(() => rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "standard-xmp", data: "x" }], limits: { maxInputBytes: 1 }, c2pa: "preserve" }), "LIMIT_EXCEEDED");
    expect(rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "standard-xmp", data: "x" }], verify: false, preservation: { colorPolicy: "allow-change", orientationPolicy: "allow-change", requireCompletePayloadExtraction: false } }).data).toBeInstanceOf(Uint8Array);
    expect(rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "standard-xmp", data: "x" }], verify: false, preservation: { colorPolicy: "report-only", orientationPolicy: "report-only" } }).data).toBeInstanceOf(Uint8Array);
  });

  it("exercises PNG metadata placement, compression choices, CRC policies, duplicate policies, and output refusal", async () => {
    const input = await fixture("png-metadata.png");
    const additions = [
      { op: "add" as const, kind: "xmp" as const, data: "<x:xmpmeta/>" },
      { op: "add" as const, kind: "text" as const, keyword: "Plain", data: "text" },
      { op: "add" as const, kind: "text" as const, keyword: "Compressed", chunkType: "zTXt" as const, data: "zlib" },
      { op: "add" as const, kind: "text" as const, keyword: "Unicode", chunkType: "iTXt" as const, language: "en", translatedKeyword: "Label", compressed: false, data: "héllo" },
      { op: "add" as const, kind: "icc" as const, data: profile() },
      { op: "add" as const, kind: "exif" as const, data: tiff() },
    ];
    const added = await rewritePngMetadata(input, { blocks: additions, verify: false });
    expect(added.preservation).toBeNull();
    const parsed = await parseMetadata(added.data);
    expect(parsed.xmp?.packets).toContain("<x:xmpmeta/>");
    expect(parsed.pngText.some(({ keyword }) => keyword === "Plain")).toBe(true);
    expect(parsed.pngText.some(({ keyword }) => keyword === "Compressed")).toBe(true);
    expect(parsed.icc?.complete).toBe(true);
    for (const duplicatePolicy of ["preserve", "replace-target", "deduplicate-equivalent", "reject"] as const) {
      const duplicate = await rewritePngMetadata(input, { blocks: [{ op: "add", kind: "xmp", data: "one" }, { op: "add", kind: "xmp", data: "two" }], duplicatePolicy, verify: false });
      expect(duplicate.data.length).toBeGreaterThan(input.length);
    }
    const textKeyword = parsed.pngText[0]?.keyword;
    expect(textKeyword).toBeDefined();
    if (textKeyword === undefined) throw new Error("PNG fixture has no text keyword");
    const replaced = await rewritePngMetadata(added.data, { blocks: [{ op: "replace", kind: "text", keyword: textKeyword, data: "new" }] });
    expect((await parseMetadata(replaced.data)).pngText.some(({ keyword, text }) => keyword === textKeyword && text === "new")).toBe(true);
    const removed = await rewritePngMetadata(replaced.data, { blocks: [{ op: "remove", kind: "text", keyword: textKeyword }] });
    expect(removed.data).toBeInstanceOf(Uint8Array);
    await expectFailure(() => rewritePngMetadata(new Uint8Array(), { blocks: [{ op: "add", kind: "xmp", data: "x" }] }), "UNSAFE_STRUCTURE");
    const cleanPng = await fixture("base.png");
    await expectFailure(() => rewritePngMetadata(cleanPng, { blocks: [{ op: "add", kind: "xmp", data: "x" }], limits: { maxInputBytes: 1 }, c2pa: "preserve" }), "LIMIT_EXCEEDED");
    expect((await rewritePngMetadata(input, { blocks: [{ op: "add", kind: "xmp", data: "x" }], verify: false, crcPolicy: "preserve-unknown" })).data).toBeInstanceOf(Uint8Array);
  });

  it("exercises WebP VP8/VP8L/VP8X metadata promotion, removal, duplicate handling, and preservation switches", async () => {
    const input = await fixture("webp-metadata.webp");
    const clean = (() => {
      const chunk = Uint8Array.of(0x56, 0x50, 0x38, 0x4c, 5, 0, 0, 0, 0x2f, 1, 0, 0, 0);
      const output = new Uint8Array(12 + chunk.length);
      output.set([0x52, 0x49, 0x46, 0x46], 0); output.set([0x57, 0x45, 0x42, 0x50], 8); output.set(chunk, 12);
      new DataView(output.buffer).setUint32(4, output.length - 8, true);
      return output;
    })();
    const additions = [
      { op: "add" as const, kind: "xmp" as const, data: "<x:xmpmeta/>" },
      { op: "add" as const, kind: "icc" as const, data: profile() },
      { op: "add" as const, kind: "exif" as const, data: tiff() },
    ];
    const added = rewriteWebpMetadata(input, { blocks: additions, verify: false });
    expect(added.preservation).toBeNull();
    expect((await parseMetadata(added.data)).xmp?.packets).toContain("<x:xmpmeta/>");
    expect((await parseMetadata(added.data)).icc?.complete).toBe(true);
    expect((await parseMetadata(added.data)).exif).not.toBeNull();
    for (const duplicatePolicy of ["preserve", "replace-target", "deduplicate-equivalent", "reject"] as const) {
      const duplicate = rewriteWebpMetadata(input, { blocks: [{ op: "add", kind: "xmp", data: "one" }, { op: "add", kind: "xmp", data: "two" }], duplicatePolicy, verify: false });
      expect(duplicate.data.length).toBeGreaterThan(input.length);
    }
    const xmpBlock = (await parseMetadata(added.data)).blocks.find(({ family }) => family === "XMP");
    expect(xmpBlock).toBeDefined();
    if (!xmpBlock) throw new Error("WebP writer did not emit an XMP block");
    const replaced = rewriteWebpMetadata(added.data, { blocks: [{ op: "replace", kind: "xmp", blockId: xmpBlock.id, data: "changed" }] });
    expect((await parseMetadata(replaced.data)).xmp?.packets).toContain("changed");
    const removed = rewriteWebpMetadata(replaced.data, { blocks: [{ op: "remove", kind: "xmp", blockId: xmpBlock.id }] });
    expect(removed.data).toBeInstanceOf(Uint8Array);
    await expectFailure(() => rewriteWebpMetadata(new Uint8Array(), { blocks: [{ op: "add", kind: "xmp", data: "x" }] }), "UNSAFE_STRUCTURE");
    await expectFailure(() => rewriteWebpMetadata(clean, { blocks: [{ op: "add", kind: "xmp", data: "x" }], limits: { maxInputBytes: 1 }, c2pa: "preserve" }), "LIMIT_EXCEEDED");
    expect(rewriteWebpMetadata(input, { blocks: [{ op: "add", kind: "xmp", data: "x" }], verify: false, preservation: { colorPolicy: "report-only", orientationPolicy: "allow-change" } }).data).toBeInstanceOf(Uint8Array);
  });
});
