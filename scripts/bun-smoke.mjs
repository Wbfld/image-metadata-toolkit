import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const bytes = new Uint8Array(await readFile(new URL("../tests/fixtures/jpeg-exif-little-endian.jpg", import.meta.url)));
const { detectFormat, parseMetadata } = await import("../dist/index.js");
assert.equal(detectFormat(bytes).format, "jpeg");
const result = await parseMetadata(bytes, { scope: "metadata" });
assert.equal(result.format, "jpeg");
assert.equal(result.dimensions?.width, 2);
assert.equal(result.dimensions?.height, 2);
process.stdout.write("Bun core ESM smoke passed.\n");
