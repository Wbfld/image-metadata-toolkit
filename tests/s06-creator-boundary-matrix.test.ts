import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { inspectCreatorMetadata, inspectCreatorMetadataResult } from "../src/creator.js";
import { parseMetadata } from "../src/index.js";
import type { MetadataResult } from "../src/types.js";

const encoder = new TextEncoder();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const output = new Uint8Array(12 + data.length);
  const view = new DataView(output.buffer);
  view.setUint32(0, data.length);
  output.set(encoder.encode(type), 4);
  output.set(data, 8);
  view.setUint32(8 + data.length, crc32(output.subarray(4, 8 + data.length)));
  return output;
}

function insertBeforeIend(png: Uint8Array, inserted: Uint8Array): Uint8Array {
  const marker = Uint8Array.of(0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44);
  const offset = png.findIndex((value, index) => marker.every((item, markerIndex) => png[index + markerIndex] === item));
  if (offset < 0) throw new Error("Fixture PNG has no IEND chunk");
  return Uint8Array.from([...png.subarray(0, offset), ...inserted, ...png.subarray(offset)]);
}

async function pngBytes(): Promise<Uint8Array> {
  return new Uint8Array(await readFile(new URL("./fixtures/png-metadata.png", import.meta.url)));
}

describe("S06 creator decoder boundary matrix", () => {
  it("inspects the direct PNG byte path, custom ComfyUI chunks, CRC failures, truncation, and limits", async () => {
    const png = await pngBytes();
    const workflow = JSON.stringify({ prompt: { loader: { class_type: "CheckpointLoader", inputs: { seed: 7 } }, sampler: { class_type: "KSampler", inputs: { positive: ["loader", 0] } } } });
    const creatorChunk = chunk("comf", Uint8Array.from([...encoder.encode("prompt\0"), ...encoder.encode(workflow)]));
    const withCreator = insertBeforeIend(png, creatorChunk);
    const inspection = await inspectCreatorMetadata(withCreator);
    expect(inspection.complete).toBe(false);
    expect(inspection.producers).toContain("comfyui");
    expect(inspection.fields.some((field) => field.kind === "workflow-reference")).toBe(true);
    expect(inspection.sources.some((source) => source.provenance.family === "PNGText" && source.provenance.offset !== null)).toBe(true);

    const badCrc = withCreator.slice();
    badCrc[withCreator.length - 5] = (badCrc[withCreator.length - 5] ?? 0) ^ 0xff;
    const badInspection = await inspectCreatorMetadata(badCrc);
    expect(badInspection.complete).toBe(false);
    expect(badInspection.diagnostics.some((diagnostic) => diagnostic.code === "MALFORMED_SOURCE")).toBe(true);

    const noSeparator = insertBeforeIend(png, chunk("comf", encoder.encode("prompt-without-separator")));
    const noSeparatorInspection = await inspectCreatorMetadata(noSeparator);
    expect(noSeparatorInspection.complete).toBe(false);
    expect(noSeparatorInspection.diagnostics.some((diagnostic) => diagnostic.code === "MALFORMED_SOURCE")).toBe(true);

    const truncated = withCreator.slice(0, withCreator.length - 2);
    const truncatedInspection = await inspectCreatorMetadata(truncated);
    expect(truncatedInspection.complete).toBe(false);
    expect(truncatedInspection.diagnostics.some((diagnostic) => diagnostic.code === "MALFORMED_SOURCE")).toBe(true);

    const limited = await inspectCreatorMetadata(withCreator, { limits: { maxPngChunks: 1, maxWarnings: 4 } });
    expect(limited.complete).toBe(false);
    expect(limited.diagnostics.some((diagnostic) => diagnostic.code === "LIMIT_EXCEEDED")).toBe(true);
    const controller = new AbortController();
    controller.abort();
    await expect(inspectCreatorMetadata(withCreator, { signal: controller.signal })).rejects.toMatchObject({ code: "ABORTED" });
  });

  it("keeps non-literal XMP values and malformed source forms incomplete without leaking raw values", async () => {
    const result = {
      format: "png",
      mimeType: "image/png",
      container: "png",
      fileKind: "png",
      raw: null,
      dimensions: { width: 1, height: 1 },
      fields: [],
      exif: null,
      iptc: null,
      icc: null,
      jfif: null,
      photoshop: null,
      makerNotes: null,
      pngText: [],
      blocks: [],
      coverage: { requested: "complete", wholeFile: "complete", reasons: [], unclassifiedBlockIds: [] },
      completeness: { complete: true, scope: "full", reasons: [] },
      warnings: [],
      xmp: { packets: ["<x:xmpmeta xmlns:x=\"adobe:ns:meta/\"><rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\" xmlns:c=\"urn:creator\"><rdf:Description><c:prompt><rdf:Bag><rdf:li>opaque prompt</rdf:li></rdf:Bag></c:prompt></rdf:Description></rdf:RDF></x:xmpmeta>", "<not-xml"] },
    } as unknown as MetadataResult;
    const inspection = inspectCreatorMetadataResult(result, { includeRawData: false });
    expect(inspection.fields).toEqual([]);
    expect(inspection.complete).toBe(false);
    expect(inspection.diagnostics.some((diagnostic) => diagnostic.code === "MALFORMED_SOURCE")).toBe(true);
    expect(JSON.stringify(inspection)).not.toContain("opaque prompt");
    const parsed = await parseMetadata(await pngBytes(), { limits: { maxWarnings: 2 } });
    expect(parsed.format).toBe("png");
  });
});
