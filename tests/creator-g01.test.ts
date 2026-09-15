import { inspectCreatorMetadata, migrateCreatorMetadataToIptc } from "../src/index.js";
import { describe, expect, it } from "vitest";

const encoder = new TextEncoder();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u32(value: number): Uint8Array {
  return Uint8Array.of((value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = encoder.encode(type);
  const crcInput = new Uint8Array(typeBytes.length + data.length);
  crcInput.set(typeBytes);
  crcInput.set(data, typeBytes.length);
  return concat(u32(data.length), typeBytes, data, Uint8Array.of((crc32(crcInput) >>> 24) & 0xff, (crc32(crcInput) >>> 16) & 0xff, (crc32(crcInput) >>> 8) & 0xff, crc32(crcInput) & 0xff));
}

function pngText(keyword: string, text: string): Uint8Array {
  return pngChunk("tEXt", concat(encoder.encode(keyword), Uint8Array.of(0), encoder.encode(text)));
}

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function png(chunks: readonly Uint8Array[]): Uint8Array {
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, 1);
  view.setUint32(4, 1);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const idat = pngChunk("IDAT", Uint8Array.of(0));
  return concat(Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), pngChunk("IHDR", ihdr), ...chunks, idat, pngChunk("IEND", new Uint8Array()));
}

function webpExif(prompt: string): Uint8Array {
  const value = encoder.encode(`${prompt}\0`);
  const tiff = new Uint8Array(26 + value.length);
  const view = new DataView(tiff.buffer);
  tiff.set(encoder.encode("II\x2a\x00"), 0);
  view.setUint32(4, 8, true);
  view.setUint16(8, 1, true);
  view.setUint16(10, 0x010f, true);
  view.setUint16(12, 2, true);
  view.setUint32(14, value.length, true);
  view.setUint32(18, 26, true);
  view.setUint32(22, 0, true);
  tiff.set(value, 26);
  const exif = concat(encoder.encode("Exif\0\0"), tiff.slice(0, 26 + value.length));
  const vp8x = new Uint8Array(10);
  vp8x[4] = 0;
  vp8x[5] = 0;
  vp8x[6] = 0;
  vp8x[7] = 0;
  vp8x[8] = 0;
  vp8x[9] = 0;
  const chunk = (type: string, data: Uint8Array): Uint8Array => concat(encoder.encode(type), Uint8Array.of(data.length & 0xff, (data.length >>> 8) & 0xff, (data.length >>> 16) & 0xff, (data.length >>> 24) & 0xff), data, data.length % 2 === 0 ? new Uint8Array() : Uint8Array.of(0));
  const body = concat(chunk("VP8X", vp8x), chunk("EXIF", exif));
  return concat(encoder.encode("RIFF"), Uint8Array.of((body.length + 4) & 0xff, ((body.length + 4) >>> 8) & 0xff, ((body.length + 4) >>> 16) & 0xff, ((body.length + 4) >>> 24) & 0xff), encoder.encode("WEBP"), body);
}

describe("G01 creator metadata schema pack", () => {
  it("decodes bounded ComfyUI graphs and A1111 infotext with source evidence", async () => {
    const promptGraph = JSON.stringify({
      "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "model.safetensors" } },
      "2": { class_type: "KSampler", inputs: { seed: 1234, steps: 28, sampler_name: "euler", positive: ["3", 0], negative: ["4", 0] } },
      "3": { class_type: "CLIPTextEncode", inputs: { text: "a red kite" } },
      "4": { class_type: "CLIPTextEncode", inputs: { text: "blurry" } },
    });
    const info = "a red kite\nNegative prompt: blurry\nSteps: 20, Sampler: Euler, Seed: 88, Model: sd15";
    const result = await inspectCreatorMetadata(png([pngText("prompt", promptGraph), pngText("parameters", info)]));
    expect(result.schemaVersion).toBe("creator-metadata/1");
    expect(result.producers).toEqual(expect.arrayContaining(["comfyui", "stable-diffusion-webui"]));
    expect(result.fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ producer: "comfyui", kind: "model", value: "model.safetensors" }),
      expect.objectContaining({ producer: "comfyui", kind: "sampler", value: "euler" }),
      expect.objectContaining({ producer: "comfyui", kind: "seed", value: 1234 }),
      expect.objectContaining({ producer: "comfyui", kind: "steps", value: 28 }),
      expect.objectContaining({ producer: "comfyui", kind: "negative-prompt", value: "blurry" }),
      expect.objectContaining({ producer: "stable-diffusion-webui", kind: "prompt", value: "a red kite" }),
    ]));
    const graph = result.workflowReferences[0];
    expect(graph).toMatchObject({ nodeCount: 4, edgeCount: 2, truncated: false });
    expect(result.sources.every((source) => source.provenance.offset !== null && source.provenance.blockId !== null)).toBe(true);
    expect(result.sources.every((source) => source.rawText !== null)).toBe(true);
  });

  it("decodes ComfyUI animated-PNG chunks and InvokeAI versioned records", async () => {
    const graph = JSON.stringify({ "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "checkpoint.ckpt" } } });
    const comf = pngChunk("comf", concat(encoder.encode("prompt"), Uint8Array.of(0), encoder.encode(graph)));
    const invoke = JSON.stringify({ app_version: "3.5", type: "t2l", seed: 44, steps: 12, scheduler: "euler", positive_conditioning: "mountain", negative_conditioning: "noise", model_weights: "invoke-model" });
    const result = await inspectCreatorMetadata(png([comf, pngText("invokeai_metadata", invoke)]));
    expect(result.producers).toEqual(expect.arrayContaining(["comfyui", "invokeai"]));
    expect(result.fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ producer: "invokeai", kind: "seed", value: 44 }),
      expect.objectContaining({ producer: "invokeai", kind: "steps", value: 12 }),
      expect.objectContaining({ producer: "invokeai", kind: "prompt", value: "mountain" }),
      expect.objectContaining({ producer: "invokeai", kind: "negative-prompt", value: "noise" }),
      expect.objectContaining({ producer: "comfyui", kind: "model", value: "checkpoint.ckpt" }),
    ]));
    expect(result.sources.some((source) => source.provenance.keyword === "prompt" && source.provenance.blockId?.startsWith("png:comf:") === true)).toBe(true);
  });

  it("handles the WebP EXIF convention, explicit migration, and raw-data opt-out", async () => {
    const graph = JSON.stringify({ "1": { class_type: "KSampler", inputs: { seed: 7, steps: 9, sampler_name: "ddim", model: "web-model" } } });
    const result = await inspectCreatorMetadata(webpExif(`prompt:${graph}`));
    expect(result.format).toBe("webp");
    expect(result.fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ producer: "comfyui", kind: "seed", value: 7 }),
      expect.objectContaining({ producer: "comfyui", kind: "steps", value: 9 }),
      expect.objectContaining({ producer: "comfyui", kind: "model", value: "web-model" }),
    ]));
    const migration = migrateCreatorMetadataToIptc(result, { confirm: true });
    expect(migration.explicitOptIn).toBe(true);
    expect(migration.targetEdition).toBe("2025.1");
    expect(() => migrateCreatorMetadataToIptc(result, { confirm: false })).toThrow(/confirm:true/u);
    const noRaw = await inspectCreatorMetadata(webpExif(`prompt:${graph}`), { includeRawData: false });
    expect(noRaw.sources.every((source) => source.rawText === null)).toBe(true);
    expect(noRaw.fields.every((field) => field.rawValue === null)).toBe(true);
  });

  it("fails closed for malformed, corrupt, and over-limit creator data", async () => {
    const invalid = png([pngText("prompt", "{not-json")]);
    const invalidResult = await inspectCreatorMetadata(invalid);
    expect(invalidResult.complete).toBe(false);
    expect(invalidResult.diagnostics).toContainEqual(expect.objectContaining({ code: "INVALID_JSON" }));

    const corrupt = png([pngText("prompt", JSON.stringify({ "1": { inputs: { text: "safe" } } })).slice(0, -1)]);
    const corruptResult = await inspectCreatorMetadata(corrupt);
    expect(corruptResult.complete).toBe(false);
    expect(corruptResult.diagnostics.some(({ code }) => code === "MALFORMED_SOURCE" || code === "INVALID_VALUE")).toBe(true);

    const graph = JSON.stringify({ "1": { inputs: { text: "bounded" } } });
    const limited = await inspectCreatorMetadata(png([pngText("prompt", graph)]), { limits: { maxCreatorGraphNodes: 1, maxCreatorFields: 1 } });
    expect(limited.complete).toBe(false);
    expect(limited.diagnostics.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
  });
});
