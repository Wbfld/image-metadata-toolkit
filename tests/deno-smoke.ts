import { detectFormat, parseMetadata } from "../dist/index.js";

declare const Deno: {
  readFile(path: URL): Promise<Uint8Array>;
  test(name: string, callback: () => void | Promise<void>): void;
};

Deno.test("parses local ESM output in Deno", async () => {
  const bytes = await Deno.readFile(new URL("./fixtures/jpeg-exif-little-endian.jpg", import.meta.url));
  if (detectFormat(bytes).format !== "jpeg") throw new Error("Deno failed to detect the JPEG fixture.");
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const result = await parseMetadata(new Blob([buffer], { type: "image/jpeg" }));
  if (result.format !== "jpeg" || result.dimensions?.width !== 2 || result.dimensions.height !== 2) {
    throw new Error("Deno failed to parse the JPEG fixture.");
  }
});
