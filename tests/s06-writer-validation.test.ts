import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { rewriteJpegMetadata, JpegWriterError } from "../src/jpeg-writer.js";
import { rewritePngMetadata, PngWriterError } from "../src/png-writer.js";
import { rewriteWebpMetadata, WebpWriterError } from "../src/webp-writer.js";

async function fixture(name: string): Promise<Uint8Array> { return new Uint8Array(await readFile(new URL(`./fixtures/${name}`, import.meta.url))); }
async function expectCode(action: () => unknown, code: string): Promise<void> {
  await expect(Promise.resolve().then(action)).rejects.toMatchObject({ code });
}

function webpWithC2paCandidate(input: Uint8Array): Uint8Array {
  const payload = new TextEncoder().encode("c2pa urn:c2pa:manifest https://example.invalid/manifest");
  const chunkLength = 8 + payload.length + (payload.length % 2);
  const output = new Uint8Array(input.length + chunkLength);
  output.set(input, 0);
  output.set(new TextEncoder().encode("XMP "), input.length);
  new DataView(output.buffer).setUint32(input.length + 4, payload.length, true);
  output.set(payload, input.length + 8);
  new DataView(output.buffer).setUint32(4, output.length - 8, true);
  return output;
}

describe("S06 writer validation and atomic-boundary matrix", () => {
  it("rejects malformed JPEG writer options and exercises all block validation paths", async () => {
    const input = await fixture("jpeg-exif-little-endian.jpg");
    await expectCode(() => rewriteJpegMetadata(input, null as never), "INVALID_VALUE");
    await expectCode(() => rewriteJpegMetadata(input, { blocks: [] }), "INVALID_VALUE");
    await expectCode(() => rewriteJpegMetadata(input, { blocks: [{} as never] }), "INVALID_VALUE");
    await expectCode(() => rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "standard-xmp", data: "x" }], verify: "yes" as never }), "INVALID_VALUE");
    await expectCode(() => rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "standard-xmp", data: "x" }], duplicatePolicy: "bad" as never }), "INVALID_VALUE");
    await expectCode(() => rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "standard-xmp", data: "x" }], preservation: null as never }), "INVALID_VALUE");
    await expectCode(() => rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "standard-xmp", data: "x" }], preservation: { colorPolicy: "bad" as never } }), "INVALID_VALUE");
    await expectCode(() => rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "standard-xmp", data: "x" }], preservation: { requireCompletePayloadExtraction: "yes" as never } }), "INVALID_VALUE");
    await expectCode(() => rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "extended-xmp", data: "x" }] }), "INVALID_VALUE");
    await expectCode(() => rewriteJpegMetadata(input, { blocks: [{ op: "replace", kind: "extended-xmp", guid: "00000000000000000000000000000000", data: "x" }] }), "INVALID_VALUE");
    await expectCode(() => rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "standard-xmp", data: new Uint8Array([0xff]) }], limits: { maxValueBytes: 0 } }), "INVALID_VALUE");
    const added = rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "standard-xmp", data: "<x:xmpmeta/>" }], verify: false });
    expect(added.data.length).toBeGreaterThan(input.length);
    expect(added.preservation).toBeNull();
    const removed = rewriteJpegMetadata(added.data, { blocks: [{ op: "remove", kind: "standard-xmp" }] });
    expect(removed.data.length).toBeLessThan(added.data.length);
  });

  it("rejects malformed PNG writer options and validates text, block, CRC, and policy boundaries", async () => {
    const input = await fixture("png-metadata.png");
    await expectCode(() => rewritePngMetadata(input, null as never), "INVALID_VALUE");
    await expectCode(() => rewritePngMetadata(input, { blocks: [] }), "INVALID_VALUE");
    await expectCode(() => rewritePngMetadata(input, { blocks: [{} as never] }), "INVALID_VALUE");
    await expectCode(() => rewritePngMetadata(input, { blocks: [{ op: "add", kind: "xmp", data: "x" }], verify: "yes" as never }), "INVALID_VALUE");
    await expectCode(() => rewritePngMetadata(input, { blocks: [{ op: "add", kind: "xmp", data: "x" }], duplicatePolicy: "bad" as never }), "INVALID_VALUE");
    await expectCode(() => rewritePngMetadata(input, { blocks: [{ op: "add", kind: "xmp", data: "x" }], crcPolicy: "bad" as never }), "INVALID_VALUE");
    await expectCode(() => rewritePngMetadata(input, { blocks: [{ op: "add", kind: "xmp", data: "x" }], preservation: null as never }), "INVALID_VALUE");
    await expectCode(() => rewritePngMetadata(input, { blocks: [{ op: "add", kind: "xmp", data: "x" }], preservation: { colorPolicy: "bad" as never } }), "INVALID_VALUE");
    await expectCode(() => rewritePngMetadata(input, { blocks: [{ op: "add", kind: "text", data: "x" }] }), "INVALID_VALUE");
    await expectCode(() => rewritePngMetadata(input, { blocks: [{ op: "add", kind: "text", keyword: "bad\0key", data: "x" }] }), "INVALID_VALUE");
    await expectCode(() => rewritePngMetadata(input, { blocks: [{ op: "add", kind: "text", keyword: "key", chunkType: "bad" as never, data: "x" }] }), "INVALID_VALUE");
    await expectCode(() => rewritePngMetadata(input, { blocks: [{ op: "add", kind: "text", keyword: "key", data: new Uint8Array([0xff]) }] }), "INVALID_VALUE");
    await expectCode(() => rewritePngMetadata(input, { blocks: [{ op: "add", kind: "icc", data: Uint8Array.of(1, 2) }] }), "INVALID_VALUE");
    const noVerify = await rewritePngMetadata(input, { blocks: [{ op: "add", kind: "xmp", data: "<x:xmpmeta/>" }], verify: false });
    expect(noVerify.preservation).toBeNull();
    const removed = await rewritePngMetadata(noVerify.data, { blocks: [{ op: "remove", kind: "xmp" }] });
    expect(removed.data).toBeInstanceOf(Uint8Array);
  });

  it("rejects malformed WebP writer options and exercises replacement, removal, promotion, and limits", async () => {
    const input = await fixture("webp-metadata.webp");
    const c2paInput = webpWithC2paCandidate(input);
    await expectCode(() => rewriteWebpMetadata(input, null as never), "INVALID_VALUE");
    await expectCode(() => rewriteWebpMetadata(input, { blocks: [] }), "INVALID_VALUE");
    await expectCode(() => rewriteWebpMetadata(input, { blocks: [{} as never] }), "INVALID_VALUE");
    await expectCode(() => rewriteWebpMetadata(input, { blocks: [{ op: "add", kind: "xmp", data: "x" }], verify: "yes" as never }), "INVALID_VALUE");
    await expectCode(() => rewriteWebpMetadata(input, { blocks: [{ op: "add", kind: "xmp", data: "x" }], duplicatePolicy: "bad" as never }), "INVALID_VALUE");
    await expectCode(() => rewriteWebpMetadata(input, { blocks: [{ op: "add", kind: "xmp", data: "x" }], preservation: null as never }), "INVALID_VALUE");
    await expectCode(() => rewriteWebpMetadata(input, { blocks: [{ op: "add", kind: "xmp", data: "x" }], preservation: { orientationPolicy: "bad" as never } }), "INVALID_VALUE");
    await expectCode(() => rewriteWebpMetadata(input, { blocks: [{ op: "add", kind: "xmp", data: "x" }], preservation: { requireCompletePayloadExtraction: "yes" as never } }), "INVALID_VALUE");
    await expectCode(() => rewriteWebpMetadata(c2paInput, { blocks: [{ op: "add", kind: "xmp", data: "x" }], c2pa: "bad" as never }), "UNSUPPORTED_STRUCTURE");
    const duplicate = rewriteWebpMetadata(input, { blocks: [{ op: "add", kind: "xmp", data: "first" }, { op: "add", kind: "xmp", data: "second" }], verify: false }).data;
    await expectCode(() => rewriteWebpMetadata(duplicate, { blocks: [{ op: "replace", kind: "xmp", data: "x" }], duplicatePolicy: "reject" }), "INVALID_VALUE");
    await expectCode(() => rewriteWebpMetadata(input, { blocks: [{ op: "replace", kind: "xmp", blockId: "missing", data: "x" }] }), "INVALID_VALUE");
    await expectCode(() => rewriteWebpMetadata(input, { blocks: [{ op: "add", kind: "exif", data: Uint8Array.of(1, 2) }] }), "INVALID_VALUE");
    await expectCode(() => rewriteWebpMetadata(input, { blocks: [{ op: "add", kind: "xmp", data: new Uint8Array([0xff]) }] }), "INVALID_VALUE");
    const noVerify = rewriteWebpMetadata(input, { blocks: [{ op: "add", kind: "xmp", data: "x" }], verify: false });
    expect(noVerify.preservation).toBeNull();
    expect(rewriteWebpMetadata(noVerify.data, { blocks: [{ op: "remove", kind: "xmp" }] }).data).toBeInstanceOf(Uint8Array);
    await expectCode(() => rewriteWebpMetadata(input, { blocks: [{ op: "add", kind: "xmp", data: "x" }], limits: { maxAdapterOutputBytes: 20 } }), "LIMIT_EXCEEDED");
    expect(JpegWriterError).toBeDefined();
    expect(PngWriterError).toBeDefined();
    expect(WebpWriterError).toBeDefined();
  });
});
