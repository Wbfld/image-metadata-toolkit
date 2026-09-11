import {
  canonicalExifReader,
  canonicalExifr,
  canonicalToolkit,
} from "./benchmark-scenarios.mjs";

/** Blob-compatible source that records every range fetched by the toolkit. */
export class InstrumentedBlob {
  constructor(bytes) {
    this.bytes = bytes;
    this.size = bytes.byteLength;
    this.requests = 0;
    this.bytesRead = 0;
  }

  async arrayBuffer() {
    return this.bytes.buffer.slice(this.bytes.byteOffset, this.bytes.byteOffset + this.bytes.byteLength);
  }

  slice(start, end) {
    this.requests += 1;
    this.bytesRead += end - start;
    const data = this.bytes.slice(start, end);
    return { arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) };
  }

  telemetry() {
    return { readRequests: this.requests, bytesRead: this.bytesRead };
  }
}

function directTransport(bytes) {
  return { readRequests: 0, bytesRead: 0, sourceBytes: bytes.byteLength, mode: "memory" };
}

function fullInputTransport(bytes) {
  return { readRequests: 1, bytesRead: bytes.byteLength, sourceBytes: bytes.byteLength, mode: "full-input" };
}

function toolkitInput(bytes, scenario) {
  if (scenario.operation === "remote-range") {
    const input = new InstrumentedBlob(bytes);
    return { input, source: input };
  }
  return { input: bytes, source: null };
}

async function toolkitOperation(bytes, scenario) {
  const toolkit = await import("../dist/index.js");
  if (scenario.operation === "detection") {
    return { output: { supported: toolkit.detectFormat(bytes).format !== "unknown" }, transport: directTransport(bytes) };
  }
  const { input, source } = toolkitInput(bytes, scenario);
  const result = await toolkit.parseMetadata(input, scenario.options);
  const telemetry = result.telemetry;
  const measured = source?.telemetry() ?? directTransport(bytes);
  return {
    output: canonicalToolkit(result, scenario),
    transport: {
      ...measured,
      readRequests: telemetry?.readRequests ?? measured.readRequests,
      bytesRead: telemetry?.bytesRead ?? measured.bytesRead,
      sourceBytes: bytes.byteLength,
      cacheHits: telemetry?.cacheHits ?? 0,
      coalescedReads: telemetry?.coalescedReads ?? 0,
      mode: source === null ? "memory" : "instrumented-range",
    },
  };
}

async function exifReaderOperation(bytes, scenario, ExifReader) {
  const load = (expanded) => ExifReader.load(bytes, { expanded, async: true });
  if (scenario.operation === "detection") return { output: canonicalExifReader(await load(false), scenario), transport: fullInputTransport(bytes) };
  return { output: canonicalExifReader(await load(true), scenario), transport: fullInputTransport(bytes) };
}

async function exifrOperation(bytes, scenario, exifr) {
  let raw;
  if (scenario.operation === "orientation") raw = await exifr.orientation(bytes);
  else if (scenario.operation === "detection") raw = await exifr.parse(bytes);
  else raw = await exifr.parse(bytes);
  return { output: canonicalExifr(raw, scenario), transport: fullInputTransport(bytes) };
}

/** Execute one semantic benchmark operation for a named reader. */
export async function runBenchmarkOperation(reader, bytes, scenario, modules) {
  if (reader === "toolkit") return toolkitOperation(bytes, scenario);
  if (reader === "exifreader") return exifReaderOperation(bytes, scenario, modules.ExifReader);
  if (reader === "exifr") return exifrOperation(bytes, scenario, modules.exifr);
  throw new Error(`Unknown benchmark reader: ${reader}`);
}
