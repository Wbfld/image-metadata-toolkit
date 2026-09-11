import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { performance } from "node:perf_hooks";

import { usesBlobInput } from "./benchmark-fixtures.mjs";

const root = resolve(import.meta.dirname, "..");
const [filename, options] = JSON.parse(process.argv[2] ?? "null");
if (typeof filename !== "string" || options === null || typeof options !== "object") throw new Error("Expected benchmark fixture filename and options.");

const bytes = await readFile(join(root, "tests/fixtures", filename));
const input = usesBlobInput(options) ? new Blob([bytes]) : bytes;
// Process launch and fixture I/O are intentionally excluded. This captures
// parser module initialization plus one parse without a warmed module cache.
const start = performance.now();
const { parseMetadata } = await import("../dist/index.js");
const result = await parseMetadata(input, options);
console.log(JSON.stringify({ milliseconds: performance.now() - start, completeness: result.completeness }));
