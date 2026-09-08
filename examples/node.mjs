import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseMetadata } from "../dist/index.js";

const defaultFixture = fileURLToPath(new URL("../tests/fixtures/jpeg-exif-little-endian.jpg", import.meta.url));
const imagePath = resolve(process.argv[2] ?? defaultFixture);
const image = await readFile(imagePath);
const result = await parseMetadata(image);

console.log(
  JSON.stringify(
    {
      file: imagePath,
      format: result.format,
      dimensions: result.dimensions,
      fields: Object.fromEntries(result.fields.map((field) => [field.name, field.display])),
      pngText: result.pngText,
      xmp: result.xmp,
      warnings: result.warnings,
    },
    null,
    2,
  ),
);
