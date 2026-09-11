import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { performance } from "node:perf_hooks";

const root = resolve(import.meta.dirname, "..");
const payload = JSON.parse(process.argv[2] ?? "null");
if (payload === null || typeof payload !== "object" || typeof payload.reader !== "string" || typeof payload.filename !== "string" || payload.scenario === null) {
  throw new Error("Expected reader, filename, and scenario benchmark payload.");
}

const bytes = await readFile(join(root, "tests/fixtures", payload.filename));
const started = performance.now();
const runner = await import("./benchmark-runner.mjs");
const modules = {};
if (payload.reader === "exifreader") modules.ExifReader = (await import("exifreader")).default;
if (payload.reader === "exifr") modules.exifr = (await import("exifr")).default;
const result = await runner.runBenchmarkOperation(payload.reader, bytes, payload.scenario, modules);
console.log(JSON.stringify({ milliseconds: Number((performance.now() - started).toFixed(3)), output: result.output, transport: result.transport }));

