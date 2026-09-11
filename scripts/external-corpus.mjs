import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { resolve, join, extname } from "node:path";

import { exiftool } from "exiftool-vendored";
import { parseMetadata } from "../dist/index.js";

const root = process.env.EXTERNAL_FIXTURE_ROOT;
assert.equal(typeof root, "string", "EXTERNAL_FIXTURE_ROOT must point at the pinned external fixture directory.");
const supportedExtensions = new Set([".jpg", ".jpeg", ".tif", ".tiff", ".heic", ".heif"]);

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return files(path);
    return supportedExtensions.has(extname(entry.name).toLowerCase()) ? [path] : [];
  }));
  return nested.flat();
}

function field(result, name) {
  return result.fields.find((candidate) => candidate.name === name)?.value;
}

const paths = (await files(resolve(root))).sort();
assert.ok(paths.length >= 100, `Expected at least 100 supported external fixtures, found ${paths.length}.`);
let compared = 0;
try {
  for (const path of paths) {
    const [bytes, external] = await Promise.all([readFile(path), exiftool.read(path)]);
    const result = await parseMetadata(bytes);
    const info = await stat(path);
    assert.ok(info.size > 0, `${path} is empty.`);
    assert.notEqual(result.format, "unknown", `${path} was not recognized.`);

    for (const [name, expected] of [["Make", external.Make], ["Model", external.Model], ["Orientation", external.Orientation]]) {
      if (expected === undefined || expected === null) continue;
      const actual = field(result, name);
      if (actual === undefined) continue;
      assert.equal(actual, expected, `${path}: ${name} differs from ExifTool.`);
      compared += 1;
    }
    if (result.dimensions !== null && typeof external.ImageWidth === "number" && typeof external.ImageHeight === "number") {
      assert.deepEqual(result.dimensions, { width: external.ImageWidth, height: external.ImageHeight }, `${path}: dimensions differ from ExifTool.`);
      compared += 1;
    }
  }
} finally {
  await exiftool.end();
}

assert.ok(compared > 0, "The external corpus did not provide comparable metadata values.");
console.log(`External corpus passed: ${paths.length} fixtures, ${compared} independent comparisons.`);
