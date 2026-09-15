import { materializeInput } from "./input.js";
import { parseStructuredXmpDetailed, type XmpProperty, type XmpValue } from "./metadata/xmp.js";
import { resolveLimits } from "./security/limits.js";
import { throwIfAborted } from "./security/abort.js";
import type { ImageFormat, MetadataField, MetadataInput, MetadataResult, PngTextEntry, SecurityLimits } from "./types.js";

/** Version of the public creator-schema result, independent of a producer's release. */
export const CREATOR_SCHEMA_VERSION = "creator-metadata/1" as const;

/** Producer conventions are intentionally versioned separately from the standards parser. */
export const CREATOR_PARSER_VERSIONS = Object.freeze({
  comfyuiPng: "comfyui-png-convention/1",
  comfyuiWebpExif: "comfyui-webp-exif-convention/1",
  stableDiffusionWebui: "stable-diffusion-webui-infotext/1",
  invokeAi: "invokeai-png-convention/1",
  xmpCommon: "creator-xmp-convention/1",
});

export type CreatorProducer = "comfyui" | "stable-diffusion-webui" | "invokeai" | "unknown";
export type CreatorFieldKind = "model" | "sampler" | "seed" | "steps" | "prompt" | "negative-prompt" | "workflow-reference";
export type CreatorGraphKind = "prompt" | "workflow";
export type CreatorJsonValue = null | boolean | number | string | readonly CreatorJsonValue[] | { readonly [key: string]: CreatorJsonValue };

export interface CreatorWorkflowNode {
  readonly id: string;
  readonly classType: string | null;
  readonly inputs: Readonly<Record<string, CreatorJsonValue>>;
}

export interface CreatorWorkflowEdge {
  readonly from: string;
  readonly to: string;
  readonly input: string;
}

export interface CreatorWorkflowReference {
  readonly kind: "workflow-reference";
  readonly graphKind: CreatorGraphKind;
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly nodeIds: readonly string[];
  readonly nodes: readonly CreatorWorkflowNode[];
  readonly edges: readonly CreatorWorkflowEdge[];
  readonly truncated: boolean;
}

export interface CreatorSourceProvenance {
  readonly id: string;
  readonly format: ImageFormat;
  readonly family: "PNGText" | "EXIF" | "XMP";
  readonly keyword: string | null;
  readonly fieldId: string | null;
  readonly blockId: string | null;
  readonly packetIndex: number | null;
  readonly offset: number | null;
  readonly length: number | null;
  readonly parserVersion: string;
}

export interface CreatorSource {
  readonly provenance: CreatorSourceProvenance;
  readonly rawByteLength: number;
  /** Raw producer text is retained by default. Set includeRawData:false to omit it from the result. */
  readonly rawText: string | null;
}

export interface CreatorMetadataField {
  readonly id: string;
  readonly producer: CreatorProducer;
  readonly kind: CreatorFieldKind;
  readonly value: string | number | CreatorWorkflowReference;
  /** Exact source lexical value retained when includeRawData is enabled. */
  readonly rawValue: string | null;
  readonly source: CreatorSourceProvenance;
  readonly path: string;
}

export type CreatorDiagnosticCode = "INVALID_JSON" | "INVALID_VALUE" | "MALFORMED_SOURCE" | "LIMIT_EXCEEDED" | "UNSUPPORTED_CONVENTION" | "UNSUPPORTED_ENCODING";

export interface CreatorDiagnostic {
  readonly code: CreatorDiagnosticCode;
  readonly message: string;
  readonly sourceId: string | null;
  readonly offset: number | null;
}

export interface CreatorMetadataInspection {
  readonly schemaVersion: typeof CREATOR_SCHEMA_VERSION;
  readonly format: ImageFormat;
  readonly producers: readonly CreatorProducer[];
  readonly parserVersions: readonly string[];
  readonly sources: readonly CreatorSource[];
  readonly fields: readonly CreatorMetadataField[];
  readonly workflowReferences: readonly CreatorWorkflowReference[];
  readonly diagnostics: readonly CreatorDiagnostic[];
  readonly complete: boolean;
  readonly retainedRawBytes: number;
}

export interface CreatorMetadataOptions {
  readonly limits?: Partial<SecurityLimits>;
  readonly signal?: AbortSignal;
  /** Defaults to true because G01 requires lossless retention of producer text. */
  readonly includeRawData?: boolean;
}

export interface CreatorIptcMigrationField {
  readonly propertyId: "aIPromptInformation" | "aISystemUsed";
  readonly namespaceUri: "http://iptc.org/std/Iptc4xmpExt/2008-02-29/";
  readonly localName: "AIPromptInformation" | "AISystemUsed";
  readonly values: readonly string[];
  readonly sourceFieldIds: readonly string[];
}

export interface CreatorIptcMigration {
  readonly targetEdition: "2025.1";
  readonly explicitOptIn: true;
  readonly fields: readonly CreatorIptcMigrationField[];
  readonly diagnostics: readonly string[];
}

export interface CreatorIptcMigrationOptions {
  /** Required to make migration an explicit caller decision. No image is mutated by this function. */
  readonly confirm: boolean;
}

interface CreatorState {
  readonly result: MetadataResult;
  readonly limits: SecurityLimits;
  readonly includeRawData: boolean;
  readonly sources: CreatorSource[];
  readonly fields: CreatorMetadataField[];
  readonly workflowReferences: CreatorWorkflowReference[];
  readonly diagnostics: CreatorDiagnostic[];
  readonly producers: Set<CreatorProducer>;
  readonly parserVersions: Set<string>;
  rawBytes: number;
  complete: boolean;
}

interface CreatorSourceInput {
  readonly format: ImageFormat;
  readonly family: CreatorSourceProvenance["family"];
  readonly keyword?: string | null;
  readonly fieldId?: string | null;
  readonly blockId?: string | null;
  readonly packetIndex?: number | null;
  readonly offset?: number | null;
  readonly length?: number | null;
  readonly parserVersion: string;
  readonly rawText: string;
}

interface GraphNodeInput {
  readonly id: string;
  readonly classType: string | null;
  readonly inputs: unknown;
}

const CREATOR_KEYWORDS = new Set([
  "prompt", "workflow", "parameters", "invokeai_metadata", "invokeai", "sd-metadata", "dream", "dream", "comf",
]);
const ITP_EXT_NAMESPACE = "http://iptc.org/std/Iptc4xmpExt/2008-02-29/" as const;

function textBytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function diagnostic(state: CreatorState, code: CreatorDiagnosticCode, message: string, sourceId: string | null, offset: number | null): void {
  if (state.diagnostics.length >= state.limits.maxWarnings) {
    state.complete = false;
    return;
  }
  state.diagnostics.push({ code, message, sourceId, offset });
}

function safeText(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (!(value instanceof Uint8Array)) return null;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(value);
  } catch {
    return new TextDecoder("latin1").decode(value);
  }
}

function safeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  if (typeof value !== "string" || !/^[+-]?\d+$/u.test(value.trim())) return null;
  const parsed = Number(value.trim());
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function sourceId(input: CreatorSourceInput): string {
  return [input.format, input.family, input.offset ?? "none", input.keyword ?? input.fieldId ?? "value"].join(":");
}

function addSource(state: CreatorState, input: CreatorSourceInput): CreatorSource | null {
  if (state.sources.length >= state.limits.maxCreatorSources) {
    state.complete = false;
    diagnostic(state, "LIMIT_EXCEEDED", `Creator source count exceeds ${state.limits.maxCreatorSources}.`, null, input.offset ?? null);
    return null;
  }
  const id = sourceId(input);
  const byteLength = textBytes(input.rawText);
  const remaining = state.limits.maxCreatorRawBytes - state.rawBytes;
  const keepRaw = state.includeRawData && byteLength <= remaining;
  if (state.includeRawData && !keepRaw) {
    state.complete = false;
    diagnostic(state, "LIMIT_EXCEEDED", `Creator raw-data retention exceeds ${state.limits.maxCreatorRawBytes} bytes.`, id, input.offset ?? null);
  }
  if (keepRaw) state.rawBytes += byteLength;
  const provenance: CreatorSourceProvenance = {
    id,
    format: input.format,
    family: input.family,
    keyword: input.keyword ?? null,
    fieldId: input.fieldId ?? null,
    blockId: input.blockId ?? null,
    packetIndex: input.packetIndex ?? null,
    offset: input.offset ?? null,
    length: input.length ?? null,
    parserVersion: input.parserVersion,
  };
  const source: CreatorSource = { provenance, rawByteLength: byteLength, rawText: keepRaw ? input.rawText : null };
  state.sources.push(source);
  state.parserVersions.add(input.parserVersion);
  return source;
}

function addField(
  state: CreatorState,
  producer: CreatorProducer,
  kind: CreatorFieldKind,
  value: string | number | CreatorWorkflowReference,
  rawValue: string,
  source: CreatorSource,
  path: string,
): CreatorMetadataField | null {
  if (state.fields.length >= state.limits.maxCreatorFields) {
    state.complete = false;
    diagnostic(state, "LIMIT_EXCEEDED", `Creator field count exceeds ${state.limits.maxCreatorFields}.`, source.provenance.id, source.provenance.offset);
    return null;
  }
  state.producers.add(producer);
  const occurrence = state.fields.filter((field) => field.producer === producer && field.kind === kind).length;
  const field: CreatorMetadataField = {
    id: `creator:${producer}:${kind}:${source.provenance.id}:${occurrence}`,
    producer,
    kind,
    value,
    rawValue: state.includeRawData ? rawValue : null,
    source: source.provenance,
    path,
  };
  state.fields.push(field);
  return field;
}

function addDiagnosticForSource(state: CreatorState, code: CreatorDiagnosticCode, message: string, source: CreatorSource): void {
  diagnostic(state, code, message, source.provenance.id, source.provenance.offset);
  if (code !== "UNSUPPORTED_CONVENTION") state.complete = false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

interface JsonCloneState {
  readonly limits: SecurityLimits;
  nodes: number;
  complete: boolean;
}

function cloneJsonValue(value: unknown, state: JsonCloneState, depth: number): CreatorJsonValue {
  if (depth > state.limits.maxXmpDepth) {
    state.complete = false;
    return null;
  }
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    if (textBytes(value) > state.limits.maxStringBytes) {
      state.complete = false;
      return null;
    }
    return value;
  }
  if (Array.isArray(value)) {
    const output: CreatorJsonValue[] = [];
    for (const item of value.slice(0, state.limits.maxXmpArrayItems)) output.push(cloneJsonValue(item, state, depth + 1));
    if (value.length > state.limits.maxXmpArrayItems) state.complete = false;
    return output;
  }
  if (!isRecord(value)) return null;
  const output: Record<string, CreatorJsonValue> = {};
  for (const key of Object.keys(value).slice(0, Math.min(state.limits.maxXmpProperties, 256))) {
    state.nodes += 1;
    if (state.nodes > state.limits.maxCreatorGraphNodes) {
      state.complete = false;
      break;
    }
    output[key] = cloneJsonValue(value[key], state, depth + 1);
  }
  if (Object.keys(value).length > Math.min(state.limits.maxXmpProperties, 256)) state.complete = false;
  return output;
}

function parseJson(raw: string, state: CreatorState, source: CreatorSource): unknown {
  if (textBytes(raw) > state.limits.maxStringBytes || textBytes(raw) > state.limits.maxCreatorRawBytes) {
    addDiagnosticForSource(state, "LIMIT_EXCEEDED", "Creator JSON source exceeds the configured text limit.", source);
    return null;
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    addDiagnosticForSource(state, "INVALID_JSON", "Creator source is not valid JSON.", source);
    return null;
  }
}

function graphNodes(value: unknown, limits: SecurityLimits): { readonly nodes: GraphNodeInput[]; readonly truncated: boolean } {
  const candidates: GraphNodeInput[] = [];
  let truncated = false;
  const append = (id: string, node: unknown): void => {
    if (!isRecord(node)) return;
    if (candidates.length >= limits.maxCreatorGraphNodes) {
      truncated = true;
      return;
    }
    const classType = typeof node.class_type === "string" ? node.class_type : typeof node.type === "string" ? node.type : null;
    candidates.push({ id, classType, inputs: node.inputs ?? node });
  };
  if (isRecord(value)) {
    const prompt = isRecord(value.prompt) ? value.prompt : value;
    if (isRecord(prompt)) {
      for (const [id, node] of Object.entries(prompt)) append(id, node);
    }
    if (Array.isArray(value.nodes)) {
      for (const node of value.nodes.slice(0, limits.maxCreatorGraphNodes)) {
        if (isRecord(node)) append(typeof node.id === "string" ? node.id : String(candidates.length), node);
      }
      if (value.nodes.length > limits.maxCreatorGraphNodes) truncated = true;
    }
  }
  return { nodes: candidates, truncated };
}

function linkFromValue(value: unknown): string | null {
  if (!Array.isArray(value) || typeof value[0] !== "string") return null;
  return value[0];
}

function graphReference(value: unknown, kind: CreatorGraphKind, state: CreatorState, source: CreatorSource): CreatorWorkflowReference | null {
  const sourceNodes = graphNodes(value, state.limits);
  if (sourceNodes.nodes.length === 0) {
    addDiagnosticForSource(state, "INVALID_VALUE", "Creator workflow JSON contains no bounded graph nodes.", source);
    return null;
  }
  const cloneState: JsonCloneState = { limits: state.limits, nodes: 0, complete: true };
  const nodes: CreatorWorkflowNode[] = [];
  const edges: CreatorWorkflowEdge[] = [];
  const knownIds = new Set(sourceNodes.nodes.map((node) => node.id));
  for (const node of sourceNodes.nodes) {
    const inputs: Record<string, CreatorJsonValue> = {};
    if (isRecord(node.inputs)) {
      for (const key of Object.keys(node.inputs).slice(0, Math.min(state.limits.maxXmpProperties, 256))) {
        const valueForKey = node.inputs[key];
        inputs[key] = cloneJsonValue(valueForKey, cloneState, 0);
        const linked = linkFromValue(valueForKey);
        if (linked !== null && knownIds.has(linked)) {
          if (edges.length < state.limits.maxCreatorGraphEdges) edges.push({ from: linked, to: node.id, input: key });
          else cloneState.complete = false;
        }
      }
    }
    nodes.push({ id: node.id, classType: node.classType, inputs });
  }
  const reference: CreatorWorkflowReference = {
    kind: "workflow-reference",
    graphKind: kind,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodeIds: Object.freeze(nodes.map((node) => node.id)),
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges),
    truncated: sourceNodes.truncated || !cloneState.complete,
  };
  if (reference.truncated || !cloneState.complete) {
    state.complete = false;
    diagnostic(state, "LIMIT_EXCEEDED", "Creator workflow graph was bounded; omitted nodes, values, or edges remain uninspected.", source.provenance.id, source.provenance.offset);
  }
  state.workflowReferences.push(reference);
  return reference;
}

function inputValue(node: CreatorWorkflowNode, names: readonly string[]): unknown {
  for (const name of names) if (Object.hasOwn(node.inputs, name)) return node.inputs[name];
  return undefined;
}

function textInput(node: CreatorWorkflowNode, names: readonly string[]): string | null {
  const value = inputValue(node, names);
  return typeof value === "string" ? value : null;
}

function graphFields(reference: CreatorWorkflowReference, raw: string, producer: CreatorProducer, source: CreatorSource, state: CreatorState): void {
  const positive = new Set<string>();
  const negative = new Set<string>();
  for (const node of reference.nodes) {
    const positiveLink = linkFromValue(inputValue(node, ["positive"]));
    const negativeLink = linkFromValue(inputValue(node, ["negative"]));
    if (positiveLink !== null) positive.add(positiveLink);
    if (negativeLink !== null) negative.add(negativeLink);
  }
  for (const node of reference.nodes) {
    const model = textInput(node, ["ckpt_name", "checkpoint", "unet_name", "model_name", "model"]);
    if (model !== null) addField(state, producer, "model", model, raw, source, `nodes.${node.id}.inputs`);
    const sampler = textInput(node, ["sampler_name", "sampler", "scheduler"]);
    if (sampler !== null) addField(state, producer, "sampler", sampler, raw, source, `nodes.${node.id}.inputs`);
    const seed = safeNumber(inputValue(node, ["seed", "noise_seed"]));
    if (seed !== null) addField(state, producer, "seed", seed, raw, source, `nodes.${node.id}.inputs`);
    const steps = safeNumber(inputValue(node, ["steps", "num_steps"]));
    if (steps !== null) addField(state, producer, "steps", steps, raw, source, `nodes.${node.id}.inputs`);
    const prompt = textInput(node, ["text", "prompt"]);
    if (prompt !== null) {
      const lower = `${node.classType ?? ""} ${node.id}`.toLowerCase();
      const kind: CreatorFieldKind = negative.has(node.id) || lower.includes("negative") ? "negative-prompt" : positive.has(node.id) ? "prompt" : "prompt";
      addField(state, producer, kind, prompt, raw, source, `nodes.${node.id}.inputs`);
    }
  }
  addField(state, producer, "workflow-reference", reference, raw, source, "workflow");
}

function decodeComfySource(raw: string, state: CreatorState, source: CreatorSource, graphKind: CreatorGraphKind = "prompt"): void {
  const json = parseJson(raw, state, source);
  if (json === null) return;
  const reference = graphReference(json, graphKind, state, source);
  if (reference !== null) graphFields(reference, raw, "comfyui", source, state);
}

function parseA1111(raw: string, state: CreatorState, source: CreatorSource): void {
  const normalized = raw.replace(/\r/gu, "");
  const lines = normalized.split("\n");
  const negativeIndex = lines.findIndex((line) => /^Negative prompt\s*:/iu.test(line));
  const parameterIndex = lines.findIndex((line, index) => index > Math.max(negativeIndex, 0) && /(?:^|,\s*)Steps\s*:/iu.test(line));
  const promptEnd = negativeIndex >= 0 ? negativeIndex : parameterIndex >= 0 ? parameterIndex : lines.length;
  const prompt = lines.slice(0, promptEnd).join("\n").trim();
  if (prompt.length > 0) addField(state, "stable-diffusion-webui", "prompt", prompt, raw, source, "prompt");
  if (negativeIndex >= 0) {
    const negativeEnd = parameterIndex >= 0 ? parameterIndex : lines.length;
    const negative = lines.slice(negativeIndex, negativeEnd).join("\n").replace(/^Negative prompt\s*:\s*/iu, "").trim();
    if (negative.length > 0) addField(state, "stable-diffusion-webui", "negative-prompt", negative, raw, source, "negative-prompt");
  }
  const parameters = lines.slice(parameterIndex >= 0 ? parameterIndex : Math.max(0, lines.length - 1)).join(", ");
  const value = (name: string): string | null => {
    const match = new RegExp(`(?:^|,\\s*)${name}\\s*:\\s*([^,]+)`, "iu").exec(parameters);
    return match?.[1]?.trim() ?? null;
  };
  const steps = safeNumber(value("Steps"));
  if (steps !== null) addField(state, "stable-diffusion-webui", "steps", steps, raw, source, "parameters.Steps");
  const seed = safeNumber(value("Seed"));
  if (seed !== null) addField(state, "stable-diffusion-webui", "seed", seed, raw, source, "parameters.Seed");
  const sampler = value("Sampler");
  if (sampler !== null) addField(state, "stable-diffusion-webui", "sampler", sampler, raw, source, "parameters.Sampler");
  const model = value("Model");
  if (model !== null) addField(state, "stable-diffusion-webui", "model", model, raw, source, "parameters.Model");
}

function invokeValue(record: Record<string, unknown>, names: readonly string[]): unknown {
  for (const name of names) if (Object.hasOwn(record, name)) return record[name];
  return undefined;
}

function decodeInvokeSource(raw: string, state: CreatorState, source: CreatorSource): void {
  const parsed = parseJson(raw, state, source);
  if (!isRecord(parsed)) return;
  const root = isRecord(parsed.invokeai_metadata) ? parsed.invokeai_metadata : isRecord(parsed.image) ? parsed : parsed;
  const image = isRecord(root.image) ? root.image : root;
  const model = invokeValue(root, ["model_weights", "model_name", "model", "model_hash"]);
  if (typeof model === "string") addField(state, "invokeai", "model", model, raw, source, "model");
  const sampler = invokeValue(image, ["sampler", "scheduler"]) ?? invokeValue(root, ["sampler", "scheduler"]);
  if (typeof sampler === "string") addField(state, "invokeai", "sampler", sampler, raw, source, "sampler");
  const seed = safeNumber(invokeValue(image, ["seed"]) ?? invokeValue(root, ["seed"]));
  if (seed !== null) addField(state, "invokeai", "seed", seed, raw, source, "seed");
  const steps = safeNumber(invokeValue(image, ["steps"]) ?? invokeValue(root, ["steps"]));
  if (steps !== null) addField(state, "invokeai", "steps", steps, raw, source, "steps");
  const positive = invokeValue(image, ["positive_conditioning", "positive_prompt", "prompt"]) ?? invokeValue(root, ["positive_conditioning", "positive_prompt", "prompt"]);
  if (typeof positive === "string") addField(state, "invokeai", "prompt", positive, raw, source, "positive_prompt");
  const negative = invokeValue(image, ["negative_conditioning", "negative_prompt"]) ?? invokeValue(root, ["negative_conditioning", "negative_prompt"]);
  if (typeof negative === "string") addField(state, "invokeai", "negative-prompt", negative, raw, source, "negative_prompt");
  const workflow = invokeValue(root, ["workflow", "node_graph", "graph"]);
  if (workflow !== undefined) {
    const workflowRaw = typeof workflow === "string" ? workflow : JSON.stringify(workflow);
    const reference = graphReference(workflow, "workflow", state, source);
    if (reference !== null) addField(state, "invokeai", "workflow-reference", reference, workflowRaw, source, "workflow");
  }
}

function decodeDreamSource(raw: string, state: CreatorState, source: CreatorSource): void {
  const seedMatch = /(?:^|\s)-S\s*(\d+)/u.exec(raw);
  const seed = safeNumber(seedMatch?.[1]);
  if (seed !== null) addField(state, "invokeai", "seed", seed, raw, source, "-S");
  const prompt = raw.replace(/(?:^|\s)-S\s*\d+/u, "").trim();
  if (prompt.length > 0) addField(state, "invokeai", "prompt", prompt, raw, source, "prompt");
}

function decodeKeywordSource(keyword: string, raw: string, state: CreatorState, source: CreatorSource, producerHint?: CreatorProducer): void {
  const normalized = keyword.toLowerCase();
  if (normalized === "parameters") {
    parseA1111(raw, state, source);
    return;
  }
  if (normalized === "dream") {
    decodeDreamSource(raw, state, source);
    return;
  }
  if (normalized === "invokeai_metadata" || normalized === "invokeai" || normalized === "sd-metadata") {
    decodeInvokeSource(raw, state, source);
    return;
  }
  if (normalized === "prompt" || normalized === "workflow" || normalized === "comf") {
    decodeComfySource(raw, state, source, normalized === "workflow" ? "workflow" : "prompt");
    return;
  }
  if (producerHint !== undefined) {
    if (producerHint === "comfyui") decodeComfySource(raw, state, source);
    else if (producerHint === "invokeai") decodeInvokeSource(raw, state, source);
  }
}

function fieldString(field: MetadataField): string | null {
  return safeText(field.value);
}

function inspectPngText(state: CreatorState, entry: PngTextEntry, format: ImageFormat): void {
  const keyword = entry.keyword;
  if (!CREATOR_KEYWORDS.has(keyword.toLowerCase())) return;
  const parserVersion = keyword.toLowerCase() === "parameters" ? CREATOR_PARSER_VERSIONS.stableDiffusionWebui : keyword.toLowerCase() === "invokeai_metadata" || keyword.toLowerCase() === "invokeai" || keyword.toLowerCase() === "sd-metadata" || keyword.toLowerCase() === "dream" ? CREATOR_PARSER_VERSIONS.invokeAi : CREATOR_PARSER_VERSIONS.comfyuiPng;
  const source = addSource(state, { format, family: "PNGText", keyword, fieldId: null, blockId: entry.blockId ?? null, packetIndex: null, offset: entry.sourceOffset ?? null, length: entry.sourceLength ?? null, parserVersion, rawText: entry.text });
  if (source !== null) decodeKeywordSource(keyword, entry.text, state, source);
}

function inspectXmpProperty(state: CreatorState, property: XmpProperty, packetIndex: number, blockId: string | null): void {
  const local = property.name.localName;
  const lower = local.toLowerCase();
  const valueText = (value: XmpValue): string | null => value.kind === "literal" ? value.lexicalValue : null;
  const lexical = valueText(property.value);
  if (lexical === null) return;
  const source = addSource(state, { format: state.result.format, family: "XMP", keyword: local, fieldId: null, blockId, packetIndex, offset: property.sourceStart, length: property.sourceEnd - property.sourceStart, parserVersion: CREATOR_PARSER_VERSIONS.xmpCommon, rawText: lexical });
  if (source === null) return;
  if (lower === "parameters" || lower === "infotext") parseA1111(lexical, state, source);
  else if (lower.includes("workflow") || lower.includes("promptgraph") || lower === "prompt") {
    if (lexical.trim().startsWith("{")) {
      const producer: CreatorProducer = lower.includes("invoke") ? "invokeai" : "comfyui";
      if (lower === "prompt") decodeComfySource(lexical, state, source);
      else {
        const parsed = parseJson(lexical, state, source);
        if (parsed !== null) {
          const reference = graphReference(parsed, "workflow", state, source);
          if (reference !== null) {
            graphFields(reference, lexical, producer, source, state);
          }
        }
      }
    } else if (lexical.length > 0) {
      addField(state, "unknown", lower.includes("negative") ? "negative-prompt" : "prompt", lexical, lexical, source, local);
    }
  } else if (lower.includes("negative") && lower.includes("prompt")) addField(state, "unknown", "negative-prompt", lexical, lexical, source, local);
  else if (lower.includes("sampler") || lower === "scheduler") addField(state, "unknown", "sampler", lexical, lexical, source, local);
  else if (lower === "seed") {
    const seed = safeNumber(lexical);
    if (seed !== null) addField(state, "unknown", "seed", seed, lexical, source, local);
  } else if (lower === "steps" || lower === "numsteps") {
    const steps = safeNumber(lexical);
    if (steps !== null) addField(state, "unknown", "steps", steps, lexical, source, local);
  } else if (lower.includes("model") || lower === "aisystemused") addField(state, "unknown", "model", lexical, lexical, source, local);
}

function inspectXmp(state: CreatorState): void {
  for (const [packetIndex, packet] of (state.result.xmp?.packets ?? []).entries()) {
    const parsed = parseStructuredXmpDetailed(packet, {
      maxInputBytes: state.limits.maxStringBytes,
      maxElements: state.limits.maxXmpNodes,
      maxProperties: state.limits.maxXmpProperties,
      maxDepth: state.limits.maxXmpDepth,
      maxAttributes: state.limits.maxXmpAttributes,
      maxNamespaces: state.limits.maxXmpNamespaces,
      maxTextBytes: state.limits.maxXmpTextBytes,
      maxArrayItems: state.limits.maxXmpArrayItems,
      maxQualifiers: state.limits.maxXmpQualifiers,
      maxOutputBytes: state.limits.maxXmpOutputBytes,
    });
    if (parsed.value?.rdf === undefined) {
      state.complete = false;
      diagnostic(state, "MALFORMED_SOURCE", "XMP creator inspection could not decode the packet as bounded RDF.", null, null);
      continue;
    }
    const blockId = state.result.xmp?.packetProvenance?.[packetIndex]?.blockIds[0] ?? null;
    for (const property of parsed.value.rdf.properties) inspectXmpProperty(state, property, packetIndex, blockId);
  }
}

function inspectWebpExif(state: CreatorState): void {
  if (state.result.format !== "webp") return;
  const fields = [...(state.result.exif?.fields ?? []), ...state.result.fields].filter((field) => field.name === "Make" || field.name === "Model" || field.name === "Software");
  for (const field of fields) {
    const raw = fieldString(field);
    if (raw === null) continue;
    const separator = raw.indexOf(":");
    if (separator <= 0) continue;
    const keyword = raw.slice(0, separator).trim();
    if (!CREATOR_KEYWORDS.has(keyword.toLowerCase())) continue;
    const parserVersion = keyword.toLowerCase() === "prompt" ? CREATOR_PARSER_VERSIONS.comfyuiWebpExif : CREATOR_PARSER_VERSIONS.comfyuiWebpExif;
    const source = addSource(state, { format: "webp", family: "EXIF", keyword, fieldId: field.id, blockId: field.source?.blockId ?? null, packetIndex: null, offset: field.source?.valueOffset ?? null, length: field.source?.valueLength ?? null, parserVersion, rawText: raw.slice(separator + 1) });
    if (source !== null) decodeKeywordSource(keyword, raw.slice(separator + 1), state, source, "comfyui");
  }
}

function crc32(bytes: Uint8Array, start: number, end: number): number {
  let crc = 0xffffffff;
  for (let offset = start; offset < end; offset += 1) {
    crc ^= bytes[offset] ?? 0;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function uint32(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) * 0x1000000 + ((bytes[offset + 1] ?? 0) << 16) + ((bytes[offset + 2] ?? 0) << 8) + (bytes[offset + 3] ?? 0);
}

function inspectComfyAnimatedPng(state: CreatorState, bytes: Uint8Array): void {
  if (state.result.format !== "png" || bytes.length < 8) return;
  let cursor = 8;
  let count = 0;
  while (cursor + 12 <= bytes.length && count < state.limits.maxPngChunks) {
    const length = uint32(bytes, cursor);
    const dataStart = cursor + 8;
    const dataEnd = dataStart + length;
    const next = dataEnd + 4;
    if (!Number.isSafeInteger(dataEnd) || !Number.isSafeInteger(next) || dataEnd > bytes.length || next > bytes.length) {
      state.complete = false;
      diagnostic(state, "MALFORMED_SOURCE", "PNG creator chunk is truncated.", null, cursor);
      return;
    }
    const type = String.fromCharCode(...bytes.subarray(cursor + 4, cursor + 8));
    if (type === "comf") {
      if (crc32(bytes, cursor + 4, dataEnd) !== uint32(bytes, dataEnd)) {
        state.complete = false;
        diagnostic(state, "MALFORMED_SOURCE", "PNG ComfyUI chunk has an invalid CRC.", null, cursor);
      } else {
        const payload = bytes.subarray(dataStart, dataEnd);
        const separator = payload.indexOf(0);
        if (separator <= 0) {
          state.complete = false;
          diagnostic(state, "MALFORMED_SOURCE", "PNG ComfyUI chunk has no bounded key separator.", null, cursor);
        } else {
          const keyword = new TextDecoder("latin1").decode(payload.subarray(0, separator));
          const raw = new TextDecoder("latin1").decode(payload.subarray(separator + 1));
          const source = addSource(state, { format: "png", family: "PNGText", keyword, fieldId: null, blockId: `png:comf:${cursor}`, packetIndex: null, offset: cursor, length: next - cursor, parserVersion: CREATOR_PARSER_VERSIONS.comfyuiPng, rawText: raw });
          if (source !== null) decodeKeywordSource(keyword, raw, state, source);
        }
      }
    }
    cursor = next;
    count += 1;
    if (type === "IEND") break;
  }
  if (count >= state.limits.maxPngChunks) {
    state.complete = false;
    diagnostic(state, "LIMIT_EXCEEDED", "PNG creator chunk inspection reached the configured chunk limit.", null, cursor);
  }
}

function makeInspection(state: CreatorState): CreatorMetadataInspection {
  return Object.freeze({
    schemaVersion: CREATOR_SCHEMA_VERSION,
    format: state.result.format,
    producers: Object.freeze([...state.producers]),
    parserVersions: Object.freeze([...state.parserVersions]),
    sources: Object.freeze(state.sources.slice()),
    fields: Object.freeze(state.fields.slice()),
    workflowReferences: Object.freeze(state.workflowReferences.slice()),
    diagnostics: Object.freeze(state.diagnostics.slice()),
    complete: state.complete,
    retainedRawBytes: state.rawBytes,
  });
}

/** Inspect an already parsed result. This overload is useful when an application already has a bounded parse. */
export function inspectCreatorMetadataResult(result: MetadataResult, options: CreatorMetadataOptions = {}): CreatorMetadataInspection {
  const limits = resolveLimits(options.limits);
  const state: CreatorState = {
    result,
    limits,
    includeRawData: options.includeRawData !== false,
    sources: [],
    fields: [],
    workflowReferences: [],
    diagnostics: [],
    producers: new Set(),
    parserVersions: new Set(),
    rawBytes: 0,
    complete: result.completeness.complete && result.coverage.wholeFile === "complete",
  };
  for (const entry of result.pngText) inspectPngText(state, entry, result.format);
  inspectWebpExif(state);
  inspectXmp(state);
  return makeInspection(state);
}

/** Parse and inspect bounded creator metadata from a PNG, WebP, or XMP-bearing image. No network I/O occurs. */
export async function inspectCreatorMetadata(input: MetadataInput, options: CreatorMetadataOptions = {}): Promise<CreatorMetadataInspection> {
  const limits = resolveLimits(options.limits);
  throwIfAborted(options.signal);
  const bytes = await materializeInput(input, limits, options.signal);
  throwIfAborted(options.signal);
  const { parseMetadata } = await import("./index.js");
  const result = await parseMetadata(bytes, {
    limits,
    select: { groups: ["Dimensions", "EXIF", "XMP", "PNGText"] },
    ...(options.signal === undefined ? {} : { signal: options.signal }),
  });
  const base = inspectCreatorMetadataResult(result, options);
  if (result.format !== "png") return base;
  const state: CreatorState = {
    result,
    limits,
    includeRawData: options.includeRawData !== false,
    sources: [...base.sources],
    fields: [...base.fields],
    workflowReferences: [...base.workflowReferences],
    diagnostics: [...base.diagnostics],
    producers: new Set(base.producers),
    parserVersions: new Set(base.parserVersions),
    rawBytes: base.retainedRawBytes,
    complete: base.complete,
  };
  inspectComfyAnimatedPng(state, bytes);
  return makeInspection(state);
}

/**
 * Convert explicitly selected creator fields into IPTC Photo Metadata 2025.1
 * AI properties. This is a data conversion only; it never mutates an image or
 * silently writes metadata. `confirm:true` is required at the call boundary.
 */
export function migrateCreatorMetadataToIptc(inspection: CreatorMetadataInspection, options: CreatorIptcMigrationOptions): CreatorIptcMigration {
  if (!options.confirm) throw new TypeError("Creator-to-IPTC migration requires confirm:true.");
  const promptFields = inspection.fields.filter((field) => field.kind === "prompt" || field.kind === "negative-prompt");
  const modelFields = inspection.fields.filter((field) => field.kind === "model");
  const fields: CreatorIptcMigrationField[] = [];
  const prompts = promptFields.map((field) => {
    const value = typeof field.value === "string" ? field.value : JSON.stringify(field.value);
    return `${field.kind === "negative-prompt" ? "Negative prompt" : "Prompt"}: ${value}`;
  });
  if (prompts.length > 0) fields.push({ propertyId: "aIPromptInformation", namespaceUri: ITP_EXT_NAMESPACE, localName: "AIPromptInformation", values: Object.freeze([prompts.join("\n")]), sourceFieldIds: Object.freeze(promptFields.map((field) => field.id)) });
  const systems = modelFields.map((field) => `${field.producer}${typeof field.value === "string" ? `: ${field.value}` : ""}`);
  if (systems.length > 0) fields.push({ propertyId: "aISystemUsed", namespaceUri: ITP_EXT_NAMESPACE, localName: "AISystemUsed", values: Object.freeze([...new Set(systems)]), sourceFieldIds: Object.freeze(modelFields.map((field) => field.id)) });
  return Object.freeze({ targetEdition: "2025.1", explicitOptIn: true, fields: Object.freeze(fields), diagnostics: Object.freeze(inspection.complete ? [] : ["Creator inspection was incomplete; migration output is partial and must be reviewed before serialization."]) });
}
