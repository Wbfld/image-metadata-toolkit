import { gzipSync } from "node:zlib";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { performance } from "node:perf_hooks";

import { parseMetadata } from "../dist/index.js";

const root = resolve(import.meta.dirname, "..");
const runs = Number.parseInt(process.env.BENCHMARK_RUNS ?? "25", 10);
if (!Number.isSafeInteger(runs) || runs < 1) throw new Error("BENCHMARK_RUNS must be a positive safe integer.");

const fixtures = [
  ["jpeg-full", "jpeg-exif-little-endian.jpg", {}],
  ["jpeg-header-blob", "jpeg-exif-little-endian.jpg", { scope: "jpeg-header" }],
  ["png-full", "png-metadata.png", {}],
  ["webp-full", "webp-metadata.webp", {}],
  ["heif-full", "sips-heic-exif-xmp.heic", {}],
  ["avif-full", "libavif-paris-icc-exif-xmp.avif", {}],
];

function percentile(values, ratio) {
  const index = Math.min(values.length - 1, Math.floor((values.length - 1) * ratio));
  return values[index] ?? 0;
}

async function measure(name, filename, options) {
  const bytes = await readFile(join(root, "tests/fixtures", filename));
  const samples = [];
  for (let index = 0; index < runs; index += 1) {
    const input = options.scope === "jpeg-header" ? new Blob([bytes], { type: "image/jpeg" }) : bytes;
    const start = performance.now();
    await parseMetadata(input, options);
    samples.push(performance.now() - start);
  }
  samples.sort((left, right) => left - right);
  return {
    name,
    inputBytes: bytes.byteLength,
    runs,
    milliseconds: {
      min: Number(percentile(samples, 0).toFixed(3)),
      median: Number(percentile(samples, 0.5).toFixed(3)),
      p95: Number(percentile(samples, 0.95).toFixed(3)),
    },
  };
}

async function bundleSizes() {
  const directory = join(root, "dist");
  const names = (await readdir(directory)).filter((name) => name.endsWith(".js")).sort();
  return Promise.all(names.map(async (name) => {
    const path = join(directory, name);
    const source = await readFile(path);
    return { file: name, bytes: (await stat(path)).size, gzipBytes: gzipSync(source).byteLength };
  }));
}

const rssBefore = process.memoryUsage().rss;
const measurements = [];
for (const [name, filename, options] of fixtures) measurements.push(await measure(name, filename, options));
const report = {
  node: process.version,
  platform: `${process.platform}-${process.arch}`,
  runs,
  rssDeltaBytes: process.memoryUsage().rss - rssBefore,
  measurements,
  bundles: await bundleSizes(),
};
console.log(JSON.stringify(report, null, 2));
