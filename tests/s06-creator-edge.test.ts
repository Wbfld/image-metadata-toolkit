import { describe, expect, it } from "vitest";

import { inspectCreatorMetadataResult, migrateCreatorMetadataToIptc } from "../src/creator.js";
import type { MetadataResult } from "../src/types.js";

const provenance = { blockId: "png:0", entryOffset: 10, entryLength: 20, valueOffset: 15, valueLength: 8 };
const base = {
  format: "png", mimeType: "image/png", container: "png", fileKind: "png", raw: null, dimensions: { width: 2, height: 2 }, fields: [], exif: null, xmp: null, iptc: null, icc: null, jfif: null, photoshop: null, makerNotes: null, pngText: [], blocks: [], coverage: { requested: "complete", wholeFile: "complete", reasons: [], unclassifiedBlockIds: [] }, completeness: { complete: true, scope: "full", reasons: [] }, warnings: [],
} as unknown as MetadataResult;

function withSources(overrides: Partial<MetadataResult>): MetadataResult { return { ...base, ...overrides }; }
function text(keyword: string, value: string) { return { type: "tEXt" as const, keyword, text: value, language: "", translatedKeyword: "", compressed: false, raw: new TextEncoder().encode(value), sourceOffset: 12, sourceLength: value.length + 12, blockId: `png:${keyword}` }; }
function field(name: string, value: string) { return { id: `IFD0:${name}`, ifd: "IFD0", tag: 0x010f, name, raw: value, value, display: value, description: name, type: "ASCII" as const, sensitivity: "high" as const, source: provenance }; }

describe("S06 creator metadata semantic boundaries", () => {
  it("decodes all supported producer keyword conventions and retains graph semantics", () => {
    const comfy = JSON.stringify({ prompt: { loader: { class_type: "CheckpointLoader", inputs: { ckpt_name: "model.safetensors" } }, sampler: { class_type: "KSampler", inputs: { seed: "42", steps: 20, sampler_name: "euler", positive: ["text", 0], negative: ["neg", 0] } }, text: { class_type: "CLIPTextEncode", inputs: { text: "positive" } }, neg: { class_type: "CLIPTextEncode (negative)", inputs: { text: "negative" } } } });
    const invoke = JSON.stringify({ invokeai_metadata: { model_name: "invoke-model", image: { sampler: "ddim", seed: "8", steps: "12", positive_prompt: "sun", negative_prompt: "rain" }, workflow: { nodes: [{ id: "a", type: "Loader", inputs: { value: true } }, { id: "b", type: "Sampler", inputs: { link: ["a", 0] } }] } } });
    const a1111 = "A portrait\nNegative prompt: blur\nSteps: 20, Sampler: Euler, Seed: 123, Model: stable";
    const result = withSources({ pngText: [text("prompt", comfy), text("workflow", comfy), text("parameters", a1111), text("dream", "a castle -S 77"), text("invokeai_metadata", invoke), text("invokeai", invoke), text("sd-metadata", invoke), text("comf", comfy)] });
    const inspection = inspectCreatorMetadataResult(result);
    expect(inspection.complete).toBe(true);
    expect(inspection.producers).toEqual(expect.arrayContaining(["comfyui", "stable-diffusion-webui", "invokeai"]));
    expect(inspection.fields.map(({ kind }) => kind)).toEqual(expect.arrayContaining(["model", "sampler", "seed", "steps", "prompt", "negative-prompt", "workflow-reference"]));
    expect(inspection.workflowReferences.some(({ edgeCount, nodeCount }) => edgeCount >= 1 && nodeCount >= 1)).toBe(true);
    expect(inspection.sources.every(({ rawText }) => rawText !== null)).toBe(true);
    const migration = migrateCreatorMetadataToIptc(inspection, { confirm: true });
    expect(migration.explicitOptIn).toBe(true);
    expect(migration.fields.map(({ propertyId }) => propertyId)).toEqual(expect.arrayContaining(["aIPromptInformation", "aISystemUsed"]));
    expect(() => migrateCreatorMetadataToIptc(inspection, { confirm: false })).toThrow(/confirm/u);
  });

  it("handles XMP semantic properties, WebP EXIF conventions, unknown values, and safe raw omission", () => {
    const xmp = `<x:xmpmeta xmlns:x="adobe:ns:meta/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:c="urn:creator"><rdf:RDF><rdf:Description><c:prompt>single prompt</c:prompt><c:negativePrompt>do not use</c:negativePrompt><c:sampler>Euler</c:sampler><c:seed>55</c:seed><c:numSteps>16</c:numSteps><c:model>model</c:model><c:workflow>{"nodes":[{"id":"x","class_type":"Text","inputs":{"text":"graph"}}]}</c:workflow><c:unrelated>ignored</c:unrelated></rdf:Description></rdf:RDF></x:xmpmeta>`;
    const result = withSources({ format: "webp", xmp: { packets: [xmp], packetProvenance: [{ id: "xmp:0", source: "embedded", packetIndex: 0, blockIds: ["xmp:0"], offset: 0, length: xmp.length }] }, fields: [field("Make", "prompt:from exif"), field("Model", "parameters:Steps: 2"), field("Software", "unknown:opaque")] });
    const withRaw = inspectCreatorMetadataResult(result);
    expect(withRaw.fields.some(({ value }) => value === "single prompt")).toBe(true);
    expect(withRaw.fields.some(({ producer }) => producer === "comfyui")).toBe(true);
    const withoutRaw = inspectCreatorMetadataResult(result, { includeRawData: false });
    expect(withoutRaw.fields.every(({ rawValue }) => rawValue === null)).toBe(true);
    expect(withoutRaw.sources.every(({ rawText }) => rawText === null)).toBe(true);
    const malformed = inspectCreatorMetadataResult(withSources({ xmp: { packets: ["<not-xml"] } }));
    expect(malformed.complete).toBe(false);
    expect(malformed.diagnostics.some(({ code }) => code === "MALFORMED_SOURCE")).toBe(true);
  });

  it("fails closed for invalid JSON, graph/value limits, unsupported keywords, and migration of incomplete data", () => {
    const invalid = inspectCreatorMetadataResult(withSources({ pngText: [text("prompt", "not-json"), text("workflow", JSON.stringify({ nodes: [] })), text("unknown-key", "opaque")] }));
    expect(invalid.complete).toBe(false);
    expect(invalid.diagnostics.some(({ code }) => code === "INVALID_JSON" || code === "INVALID_VALUE")).toBe(true);
    const limited = inspectCreatorMetadataResult(withSources({ pngText: [text("prompt", JSON.stringify({ prompt: { a: { inputs: { text: "long" } } } }))] }), { limits: { maxCreatorFields: 1, maxCreatorSources: 1, maxCreatorRawBytes: 1, maxWarnings: 1, maxCreatorGraphNodes: 1, maxCreatorGraphEdges: 1 } });
    expect(limited.complete).toBe(false);
    expect(limited.diagnostics.length).toBeLessThanOrEqual(1);
    expect(migrateCreatorMetadataToIptc(limited, { confirm: true }).diagnostics.length).toBeGreaterThan(0);
  });
});
