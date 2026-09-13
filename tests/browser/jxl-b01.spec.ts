import { expect, test } from "@playwright/test";

test("B01 reports browser Brotli availability explicitly and supports custom JPEG XL decompression", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const dist = "/dist";
    const { parseMetadata } = await import(`${dist}/index.js`);
    const text = new TextEncoder();
    const signature = Uint8Array.of(0, 0, 0, 12, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a);
    const codestream = Uint8Array.of(0xff, 0x0a, 0x01, 0x02);
    const compressed = Uint8Array.from(atob("iwWAPHg6eG1wbWV0YS8+Aw=="), (character) => character.charCodeAt(0));
    const wrapped = new Uint8Array(4 + compressed.length);
    wrapped.set(text.encode("xml "));
    wrapped.set(compressed, 4);
    const jxlc = new Uint8Array(8 + codestream.length);
    new DataView(jxlc.buffer).setUint32(0, jxlc.length);
    jxlc.set(text.encode("jxlc"), 4);
    jxlc.set(codestream, 8);
    const brob = new Uint8Array(8 + wrapped.length);
    new DataView(brob.buffer).setUint32(0, brob.length);
    brob.set(text.encode("brob"), 4);
    brob.set(wrapped, 8);
    const input = new Uint8Array(signature.length + jxlc.length + brob.length);
    input.set(signature);
    input.set(jxlc, signature.length);
    input.set(brob, signature.length + jxlc.length);
    const native = await parseMetadata(input);
    const custom = await parseMetadata(input, {
      jxlBrotliDecompressor: (value: Uint8Array) => {
        const expected = compressed.every((byte, index) => value[index] === byte) && value.length === compressed.length;
        if (!expected) throw new Error("Unexpected Brotli payload");
        return text.encode("<x:xmpmeta/>");
      },
    });
    return {
      nativeDimensions: native.dimensions,
      nativeXmp: native.xmp,
      nativeUnsupported: native.warnings.some(({ code }: { code: string }) => code === "UNSUPPORTED_COMPRESSION"),
      customDimensions: custom.dimensions,
      customXmp: custom.xmp?.packets ?? [],
      customWarnings: custom.warnings,
    };
  });

  expect(result.nativeDimensions).toEqual({ width: 16, height: 8 });
  expect(result.customDimensions).toEqual({ width: 16, height: 8 });
  expect(result.customXmp).toEqual(["<x:xmpmeta/>"]);
  expect(result.customWarnings).toEqual([]);
  if (result.nativeXmp === null) expect(result.nativeUnsupported).toBe(true);
  else expect(result.nativeUnsupported).toBe(false);
});
