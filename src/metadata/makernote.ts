import type {
  MakerNoteContainerData,
  MakerNoteDiagnostic,
  MakerNoteDetection,
  MakerNoteField,
  MakerNoteInput,
  MakerNoteInspectionOptions,
  MakerNoteOpaqueRange,
  MakerNotePlugin,
  MakerNotePluginIdentity,
  MakerNotePluginResult,
  MakerNoteProvenance,
  MakerNoteReadContext,
  MakerNoteDetectionEvidence,
  MakerNoteSourceReference,
  MakerNoteTagDefinition,
  MakerNoteStatus,
  MetadataField,
  MetadataValue,
  SecurityLimits,
} from "../types.js";
import { throwIfAborted } from "../security/abort.js";
import { checkedAdd, isValidRange } from "../security/bounds.js";

const MAX_PLUGIN_TEXT_BYTES = 512;
const MAX_DIAGNOSTIC_TEXT_BYTES = 256;

interface PluginValidation {
  readonly plugin: MakerNotePlugin | null;
  readonly diagnostic: MakerNoteDiagnostic | null;
}

function safeText(value: unknown, maxBytes = MAX_PLUGIN_TEXT_BYTES): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > maxBytes) return false;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 0x20 || code === 0x7f) return false;
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (next < 0xdc00 || next > 0xdfff) return false;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) return false;
  }
  return true;
}

function diagnostic(code: MakerNoteDiagnostic["code"], message: string, pluginId?: string, noteId?: string, noteRelativeOffset?: number, originalFileOffset?: number | null, length?: number): MakerNoteDiagnostic {
  return {
    code,
    message: message.slice(0, MAX_DIAGNOSTIC_TEXT_BYTES),
    ...(pluginId === undefined ? {} : { pluginId }),
    ...(noteId === undefined ? {} : { noteId }),
    ...(noteRelativeOffset === undefined ? {} : { noteRelativeOffset }),
    ...(originalFileOffset === undefined ? {} : { originalFileOffset }),
    ...(length === undefined ? {} : { length }),
  };
}

function validConfidence(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function validMakerNoteInput(value: unknown): value is MakerNoteInput {
  if (typeof value !== "object" || value === null) return false;
  const input = value as Partial<MakerNoteInput>;
  return safeText(input.id) && safeText(input.fieldId) && safeText(input.blockId) && input.raw instanceof Uint8Array && validInteger(input.noteOffset) && validInteger(input.sourceLength) && (input.tiffOffset === undefined || input.tiffOffset === null || validInteger(input.tiffOffset)) && (input.fileOffset === undefined || input.fileOffset === null || validInteger(input.fileOffset));
}

function validateIdentity(candidate: unknown): PluginValidation {
  if (typeof candidate !== "object" || candidate === null) {
    return { plugin: null, diagnostic: diagnostic("PLUGIN_INVALID", "MakerNote plugin does not implement the required contract.") };
  }
  const candidateRecord = candidate as { readonly identity?: unknown; readonly detect?: unknown; readonly parse?: unknown };
  if (typeof candidateRecord.identity !== "object" || candidateRecord.identity === null || typeof candidateRecord.detect !== "function" || typeof candidateRecord.parse !== "function") {
    return { plugin: null, diagnostic: diagnostic("PLUGIN_INVALID", "MakerNote plugin does not implement the required contract.") };
  }
  const plugin = candidate as MakerNotePlugin;
  const identity = candidateRecord.identity as MakerNotePluginIdentity;
  const validTextArray = (value: unknown): value is readonly string[] => Array.isArray(value) && value.length <= 64 && value.every((item) => safeText(item));
  if (!safeText(identity.id) || !safeText(identity.version) || !safeText(identity.vendor) || !safeText(identity.noteFamily) || !validTextArray(identity.signatureTests) || !validTextArray(identity.securityRequirements) || !validConfidence(identity.minimumConfidence) || identity.minimumConfidence <= 0 || !Array.isArray(identity.tagRegistry)) {
    return { plugin: null, diagnostic: diagnostic("PLUGIN_INVALID", "MakerNote plugin identity is invalid.") };
  }
  const sourcesValid = identity.sources === undefined || (Array.isArray(identity.sources) && identity.sources.length <= 64 && identity.sources.every((sourceValue) => {
    const sourceUnknown: unknown = sourceValue;
    if (typeof sourceUnknown !== "object" || sourceUnknown === null) return false;
    const source = sourceUnknown as Partial<MakerNoteSourceReference>;
    return safeText(source.id) && safeText(source.url) && safeText(source.version) && safeText(source.license) && safeText(source.retrievedAt) && typeof source.sha256 === "string" && /^[0-9a-f]{64}$/u.test(source.sha256) && (source.role === "format" || source.role === "vendor" || source.role === "fixture" || source.role === "oracle");
  }));
  if (!sourcesValid) {
    return { plugin: null, diagnostic: diagnostic("PLUGIN_INVALID", "MakerNote plugin source references are invalid.", identity.id) };
  }
  if ((identity.supportedModels !== undefined && !validTextArray(identity.supportedModels)) || (identity.supportedVersions !== undefined && !validTextArray(identity.supportedVersions))) {
    return { plugin: null, diagnostic: diagnostic("PLUGIN_INVALID", "MakerNote plugin identity model/version claims are invalid.", identity.id) };
  }
  const definitionIds = new Set<string>();
  const definitionTags = new Set<number>();
  for (const definitionValue of identity.tagRegistry as readonly unknown[]) {
    if (typeof definitionValue !== "object" || definitionValue === null) {
      return { plugin: null, diagnostic: diagnostic("DUPLICATE_DEFINITION", "MakerNote plugin tag definitions are duplicate or invalid.", identity.id) };
    }
    const definition = definitionValue as Partial<MakerNoteTagDefinition>;
    const definitionId = definition.id;
    const definitionTag = definition.tag;
    if (!safeText(definitionId) || !validInteger(definitionTag) || definitionTag > 0xffff || !safeText(definition.name) || !safeText(definition.label) || !safeText(definition.description) || !safeText(definition.type) || typeof definition.repeatable !== "boolean" || !safeText(definition.rawValueBehavior) || (definition.applicableModels !== undefined && !validTextArray(definition.applicableModels)) || (definition.applicableVersions !== undefined && !validTextArray(definition.applicableVersions)) || definitionIds.has(definitionId) || definitionTags.has(definitionTag)) {
      return { plugin: null, diagnostic: diagnostic("DUPLICATE_DEFINITION", "MakerNote plugin tag definitions are duplicate or invalid.", identity.id) };
    }
    definitionIds.add(definitionId);
    definitionTags.add(definitionTag);
  }
  return { plugin, diagnostic: null };
}

function immutableIdentity(identity: MakerNotePluginIdentity): MakerNotePluginIdentity {
  const tagRegistry = identity.tagRegistry.map((definition) => Object.freeze({
    ...definition,
    ...(definition.applicableModels === undefined ? {} : { applicableModels: Object.freeze([...definition.applicableModels]) }),
    ...(definition.enumValues === undefined ? {} : { enumValues: Object.freeze({ ...definition.enumValues }) }),
    ...(definition.applicableVersions === undefined ? {} : { applicableVersions: Object.freeze([...definition.applicableVersions]) }),
  }));
  return Object.freeze({
    ...identity,
    ...(identity.supportedModels === undefined ? {} : { supportedModels: Object.freeze([...identity.supportedModels]) }),
    ...(identity.supportedVersions === undefined ? {} : { supportedVersions: Object.freeze([...identity.supportedVersions]) }),
    signatureTests: Object.freeze([...identity.signatureTests]),
    tagRegistry: Object.freeze(tagRegistry),
    securityRequirements: Object.freeze([...identity.securityRequirements]),
    ...(identity.sources === undefined ? {} : { sources: Object.freeze(identity.sources.map((source) => Object.freeze({ ...source }))) }),
  });
}

function orderedPlugins(plugins: readonly MakerNotePlugin[] | undefined): { readonly plugins: readonly MakerNotePlugin[]; readonly diagnostics: readonly MakerNoteDiagnostic[] } {
  if (plugins === undefined) return { plugins: [], diagnostics: [] };
  if (!Array.isArray(plugins)) return { plugins: [], diagnostics: [diagnostic("PLUGIN_INVALID", "MakerNote plugin collection must be an array.")] };
  const accepted: MakerNotePlugin[] = [];
  const diagnostics: MakerNoteDiagnostic[] = [];
  const ids = new Set<string>();
  for (const candidate of plugins) {
    const validation = validateIdentity(candidate);
    if (validation.plugin === null) {
      if (validation.diagnostic !== null) diagnostics.push(validation.diagnostic);
      continue;
    }
    if (ids.has(validation.plugin.identity.id)) {
      diagnostics.push(diagnostic("DUPLICATE_DEFINITION", "MakerNote plugin IDs must be unique within one parse operation.", validation.plugin.identity.id));
      continue;
    }
    ids.add(validation.plugin.identity.id);
    accepted.push(Object.freeze({ ...validation.plugin, identity: immutableIdentity(validation.plugin.identity) }));
  }
  accepted.sort((left, right) => left.identity.id.localeCompare(right.identity.id) || left.identity.version.localeCompare(right.identity.version));
  return { plugins: Object.freeze(accepted.slice()), diagnostics: Object.freeze(diagnostics.slice()) };
}

function validInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function validDetection(value: unknown, input: MakerNoteInput, limits: SecurityLimits): value is MakerNoteDetection {
  if (typeof value !== "object" || value === null) return false;
  const detection = value as Partial<MakerNoteDetection>;
  const statuses: readonly unknown[] = ["detected", "low-confidence", "opaque"];
  if (!validConfidence(detection.confidence) || (detection.byteOrder !== "little-endian" && detection.byteOrder !== "big-endian" && detection.byteOrder !== "from-note" && detection.byteOrder !== "unknown") || (detection.baseOffsetRule !== "note-start" && detection.baseOffsetRule !== "tiff-start" && detection.baseOffsetRule !== "file-start" && detection.baseOffsetRule !== "absolute" && detection.baseOffsetRule !== "declared-by-detection") || (detection.status !== undefined && !statuses.includes(detection.status)) || !Array.isArray(detection.evidence) || detection.evidence.length > limits.maxAdapterItems) return false;
  return (detection.evidence as readonly unknown[]).every((evidenceValue) => {
    if (typeof evidenceValue !== "object" || evidenceValue === null) return false;
    const evidence = evidenceValue as Partial<MakerNoteDetectionEvidence>;
    const kind = evidence.kind;
    return (kind === "signature" || kind === "structure" || kind === "byte-order" || kind === "base-offset" || kind === "vendor-marker") && validInteger(evidence.offset) && validInteger(evidence.length) && evidence.length > 0 && isValidRange(input.raw.byteLength, evidence.offset, evidence.length) && safeText(evidence.description);
  });
}

function createContext(input: MakerNoteInput, limits: SecurityLimits, detection: MakerNoteDetection | null): MakerNoteReadContext {
  const raw = input.raw.slice();
  const noteLength = raw.byteLength;
  let readRequests = 0;
  let readBytes = 0;
  const order = detection?.byteOrder ?? "unknown";
  const declaredBase = detection?.baseOffsetRule ?? "note-start";
  const resolveByteOrder = (requested?: "little-endian" | "big-endian"): "little-endian" | "big-endian" => {
    if (requested !== undefined) return requested;
    return order === "big-endian" ? "big-endian" : "little-endian";
  };
  const context: MakerNoteReadContext = {
    noteLength,
    noteOffset: input.noteOffset,
    sourceLength: input.sourceLength,
    fieldId: input.fieldId,
    blockId: input.blockId,
    tiffOffset: input.tiffOffset ?? null,
    fileOffset: input.fileOffset ?? null,
    byteOrder: order,
    baseOffsetRule: declaredBase,
    read: (noteRelativeOffset, length): Uint8Array => {
      if (!validInteger(noteRelativeOffset) || !validInteger(length) || !isValidRange(noteLength, noteRelativeOffset, length)) throw new RangeError("MakerNote read is outside the bounded note range.");
      if (readRequests >= limits.maxReadRequests || length > limits.maxReadBytes - readBytes) throw new RangeError("MakerNote read budget exceeded.");
      readRequests += 1;
      readBytes += length;
      return raw.slice(noteRelativeOffset, noteRelativeOffset + length);
    },
    readUint8: (offset): number => context.read(offset, 1)[0] ?? 0,
    readUint16: (offset, requested): number => {
      const value = context.read(offset, 2);
      const view = new DataView(value.buffer, value.byteOffset, value.byteLength);
      return view.getUint16(0, resolveByteOrder(requested) === "little-endian");
    },
    readUint32: (offset, requested): number => {
      const value = context.read(offset, 4);
      const view = new DataView(value.buffer, value.byteOffset, value.byteLength);
      return view.getUint32(0, resolveByteOrder(requested) === "little-endian");
    },
    resolveOffset: (offset, rule): number | null => {
      if (!validInteger(offset)) return null;
      const selectedRule = rule ?? declaredBase;
      let base: number | null | undefined;
      switch (selectedRule) {
        case "note-start":
        case "declared-by-detection":
          base = input.noteOffset;
          break;
        case "tiff-start":
          base = input.tiffOffset;
          break;
        case "file-start":
        case "absolute":
          base = 0;
          break;
      }
      if (base === null || base === undefined || !validInteger(base) || !validInteger(input.sourceLength) || input.sourceLength < base || offset > input.sourceLength - base) return null;
      return checkedAdd(base, offset, "MakerNote resolved offset");
    },
  };
  return Object.freeze(context);
}

function textBytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function boundedValue(value: unknown, limits: SecurityLimits, depth = 0, seen = new Set<object>()): value is MetadataValue {
  if (depth > limits.maxIfdDepth) return false;
  if (value === null || typeof value === "boolean" || typeof value === "number") return typeof value !== "number" || Number.isFinite(value);
  if (typeof value === "string") return textBytes(value) <= limits.maxStringBytes;
  if (value instanceof Uint8Array) return value.byteLength <= limits.maxValueBytes;
  if (typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) {
    if (value.length > limits.maxAdapterItems) return false;
    return value.every((item) => boundedValue(item, limits, depth + 1, seen));
  }
  if (Object.keys(value).length > limits.maxAdapterItems) return false;
  return Object.values(value).every((item) => boundedValue(item, limits, depth + 1, seen));
}

function validProvenance(value: unknown, input: MakerNoteInput, limits: SecurityLimits): value is MakerNoteProvenance {
  if (typeof value !== "object" || value === null) return false;
  const provenance = value as MakerNoteProvenance;
  return validInteger(provenance.noteRelativeOffset) && validInteger(provenance.rangeLength) && isValidRange(input.raw.byteLength, provenance.noteRelativeOffset, provenance.rangeLength) && validInteger(provenance.noteLength) && validInteger(provenance.noteOffset) && validInteger(provenance.sourceLength) && provenance.sourceLength === input.sourceLength && safeText(provenance.blockId) && safeText(provenance.fieldId) && safeText(provenance.offsetBase) && (provenance.originalFileOffset === null || validInteger(provenance.originalFileOffset)) && provenance.originalFileLength === input.sourceLength && provenance.noteOffset === input.noteOffset && provenance.noteLength === input.raw.byteLength && provenance.noteLength <= limits.maxValueBytes;
}

function validField(value: unknown, input: MakerNoteInput, limits: SecurityLimits): value is MakerNoteField {
  if (typeof value !== "object" || value === null) return false;
  const field = value as MakerNoteField;
  return safeText(field.id) && validInteger(field.tag) && field.tag <= 0xffff && safeText(field.name) && safeText(field.label) && safeText(field.description) && safeText(field.type) && boundedValue(field.raw, limits) && boundedValue(field.value, limits) && safeText(field.display, MAX_DIAGNOSTIC_TEXT_BYTES) && safeText(field.sensitivity) && validInteger(field.count) && field.count <= limits.maxAdapterItems && typeof field.known === "boolean" && validProvenance(field.provenance, input, limits);
}

function validOpaqueRange(value: unknown, input: MakerNoteInput, limits: SecurityLimits): value is MakerNoteOpaqueRange {
  if (typeof value !== "object" || value === null) return false;
  const range = value as MakerNoteOpaqueRange;
  return safeText(range.id) && validInteger(range.noteRelativeOffset) && validInteger(range.length) && range.length > 0 && isValidRange(input.raw.byteLength, range.noteRelativeOffset, range.length) && (range.originalFileOffset === null || validInteger(range.originalFileOffset)) && ["unknown", "encrypted", "obfuscated", "unsupported", "malformed", "limit-exceeded"].includes(range.reason) && validProvenance(range.provenance, input, limits);
}

function normalizePluginResult(result: unknown, plugin: MakerNotePlugin, input: MakerNoteInput, limits: SecurityLimits): { readonly result: MakerNotePluginResult | null; readonly diagnostic: MakerNoteDiagnostic | null } {
  if (typeof result !== "object" || result === null || typeof (result as { status?: unknown }).status !== "string") return { result: null, diagnostic: diagnostic("PLUGIN_REJECTED", "MakerNote plugin returned an invalid result.", plugin.identity.id, input.id) };
  const candidate = result as MakerNotePluginResult;
  const statuses: readonly MakerNoteStatus[] = ["detected-decoded", "detected-opaque", "low-confidence", "unknown", "encrypted", "obfuscated", "malformed", "unsupported", "rejected", "aborted", "limit-exceeded"];
  if (!statuses.includes(candidate.status)) return { result: null, diagnostic: diagnostic("PLUGIN_REJECTED", "MakerNote plugin returned an unknown status.", plugin.identity.id, input.id) };
  const fields = candidate.fields ?? [];
  const opaqueRanges = candidate.opaqueRanges ?? [];
  const diagnostics = candidate.diagnostics ?? [];
  if (!Array.isArray(fields) || !Array.isArray(opaqueRanges) || !Array.isArray(diagnostics) || fields.length > limits.maxAdapterItems || opaqueRanges.length > limits.maxSegments || diagnostics.length > limits.maxWarnings || !fields.every((field) => validField(field, input, limits)) || !opaqueRanges.every((range) => validOpaqueRange(range, input, limits))) {
    return { result: null, diagnostic: diagnostic("PLUGIN_REJECTED", "MakerNote plugin output exceeded the bounded result contract.", plugin.identity.id, input.id) };
  }
  const safeDiagnostics = diagnostics.map(() => diagnostic("PLUGIN_REJECTED", "MakerNote plugin supplied a diagnostic; its raw message is not retained.", plugin.identity.id, input.id));
  return { result: { status: candidate.status, fields: Object.freeze(fields.slice()), opaqueRanges: Object.freeze(opaqueRanges.slice()), diagnostics: Object.freeze(safeDiagnostics) }, diagnostic: null };
}

function opaqueRange(input: MakerNoteInput, reason: MakerNoteOpaqueRange["reason"]): MakerNoteOpaqueRange {
  const provenance: MakerNoteProvenance = {
    noteOffset: input.noteOffset,
    noteLength: input.raw.byteLength,
    sourceLength: input.sourceLength,
    blockId: input.blockId,
    fieldId: input.fieldId,
    noteRelativeOffset: 0,
    rangeLength: input.raw.byteLength,
    originalFileOffset: input.noteOffset,
    originalFileLength: input.sourceLength,
    offsetBase: "note-start",
  };
  return { id: `${input.id}:opaque`, noteRelativeOffset: 0, originalFileOffset: input.noteOffset, length: input.raw.byteLength, reason, provenance };
}

function noteForInput(input: MakerNoteInput, status: MakerNoteStatus, plugin: MakerNotePluginIdentity | null, detection: MakerNoteDetection | null, fields: readonly MakerNoteField[], opaqueRanges: readonly MakerNoteOpaqueRange[], diagnostics: readonly MakerNoteDiagnostic[]): MakerNoteNoteLike {
  const provenance: MakerNoteProvenance = {
    noteOffset: input.noteOffset,
    noteLength: input.raw.byteLength,
    sourceLength: input.sourceLength,
    blockId: input.blockId,
    fieldId: input.fieldId,
    noteRelativeOffset: 0,
    rangeLength: input.raw.byteLength,
    originalFileOffset: input.noteOffset,
    originalFileLength: input.sourceLength,
    offsetBase: detection?.baseOffsetRule ?? "note-start",
  };
  return { id: input.id, fieldId: input.fieldId, byteLength: input.raw.byteLength, status, plugin, detection, provenance, fields, opaqueRanges, diagnostics };
}

interface MakerNoteNoteLike {
  readonly id: string;
  readonly fieldId: string;
  readonly byteLength: number;
  readonly status: MakerNoteStatus;
  readonly plugin: MakerNotePluginIdentity | null;
  readonly detection: MakerNoteDetection | null;
  readonly provenance: MakerNoteProvenance;
  readonly fields: readonly MakerNoteField[];
  readonly opaqueRanges: readonly MakerNoteOpaqueRange[];
  readonly diagnostics: readonly MakerNoteDiagnostic[];
}

function inspectOne(input: MakerNoteInput, plugins: readonly MakerNotePlugin[], limits: SecurityLimits, signal?: AbortSignal): MakerNoteNoteLike {
  if (!safeText(input.id) || !safeText(input.fieldId) || !safeText(input.blockId) || !validInteger(input.noteOffset) || !validInteger(input.sourceLength) || !isValidRange(input.sourceLength, input.noteOffset, input.raw.byteLength) || input.raw.byteLength > limits.maxValueBytes) {
    return noteForInput(input, "limit-exceeded", null, null, [], [opaqueRange(input, "limit-exceeded")], [diagnostic("UNSAFE_RANGE", "MakerNote source range is outside the bounded input.", undefined, input.id)]);
  }
  const matches: Array<{ readonly plugin: MakerNotePlugin; readonly detection: MakerNoteDetection }> = [];
  const pluginDiagnostics: MakerNoteDiagnostic[] = [];
  for (const plugin of plugins) {
    throwIfAborted(signal);
    const context = createContext(input, limits, null);
    let detection: MakerNoteDetection | null = null;
    try {
      const candidateDetection: unknown = plugin.detect(context);
      if (candidateDetection !== null && !validDetection(candidateDetection, input, limits)) {
        pluginDiagnostics.push(diagnostic("PLUGIN_REJECTED", "MakerNote plugin returned invalid detection evidence.", plugin.identity.id, input.id));
        continue;
      }
      detection = candidateDetection;
    } catch {
      pluginDiagnostics.push(diagnostic("PLUGIN_THROWN", "MakerNote plugin detection failed safely.", plugin.identity.id, input.id));
      continue;
    }
    if (detection === null) continue;
    matches.push({ plugin, detection });
  }
  if (matches.length === 0) {
    return noteForInput(input, "unknown", null, null, [], [opaqueRange(input, "unknown")], [...pluginDiagnostics, diagnostic("UNKNOWN_NOTE", "No explicitly supplied MakerNote plugin recognized this note.", undefined, input.id)]);
  }
  const bestConfidence = Math.max(...matches.map(({ detection }) => detection.confidence));
  const best = matches.filter(({ detection }) => detection.confidence === bestConfidence);
  if (best.length !== 1) {
    return noteForInput(input, "low-confidence", null, null, [], [opaqueRange(input, "unknown")], [...pluginDiagnostics, diagnostic("AMBIGUOUS_DETECTION", "Multiple MakerNote plugins reported the same highest confidence.", undefined, input.id)]);
  }
  const selected = best[0];
  if (selected === undefined) return noteForInput(input, "low-confidence", null, null, [], [opaqueRange(input, "unknown")], [...pluginDiagnostics, diagnostic("AMBIGUOUS_DETECTION", "MakerNote detection did not produce one deterministic plugin.", undefined, input.id)]);
  const context = createContext(input, limits, selected.detection);
  if (selected.detection.confidence < selected.plugin.identity.minimumConfidence || selected.detection.status === "low-confidence" || selected.detection.status === "opaque") {
    return noteForInput(input, "low-confidence", selected.plugin.identity, selected.detection, [], [opaqueRange(input, "unknown")], [...pluginDiagnostics, diagnostic("LOW_CONFIDENCE", "MakerNote detection did not meet the plugin confidence threshold.", selected.plugin.identity.id, input.id)]);
  }
  let pluginResult: unknown;
  try {
    throwIfAborted(signal);
    pluginResult = selected.plugin.parse({ context, detection: selected.detection, limits, ...(signal === undefined ? {} : { signal }) });
  } catch (error) {
    if (signal?.aborted) return noteForInput(input, "aborted", selected.plugin.identity, selected.detection, [], [opaqueRange(input, "malformed")], [...pluginDiagnostics, diagnostic("ABORTED", "MakerNote plugin operation was aborted.", selected.plugin.identity.id, input.id)]);
    const code = error instanceof RangeError ? "UNSAFE_RANGE" : "PLUGIN_THROWN";
    return noteForInput(input, "rejected", selected.plugin.identity, selected.detection, [], [opaqueRange(input, "malformed")], [...pluginDiagnostics, diagnostic(code, "MakerNote plugin failed safely and its output was rejected.", selected.plugin.identity.id, input.id)]);
  }
  const normalized = normalizePluginResult(pluginResult, selected.plugin, input, limits);
  if (normalized.result === null) return noteForInput(input, "rejected", selected.plugin.identity, selected.detection, [], [opaqueRange(input, "malformed")], [...pluginDiagnostics, normalized.diagnostic as MakerNoteDiagnostic]);
  const result = normalized.result;
  const status = result.status;
  const opaque = result.opaqueRanges ?? [];
  const allDiagnostics = [...pluginDiagnostics, ...(result.diagnostics ?? [])];
  const fields = result.fields ?? [];
  if (status === "detected-decoded" && opaque.length === 0 && allDiagnostics.length === 0) return noteForInput(input, status, selected.plugin.identity, selected.detection, fields, opaque, allDiagnostics);
  const reason: MakerNoteOpaqueRange["reason"] = status === "encrypted" ? "encrypted" : status === "obfuscated" ? "obfuscated" : status === "limit-exceeded" ? "limit-exceeded" : status === "unsupported" ? "unsupported" : "malformed";
  return noteForInput(input, status, selected.plugin.identity, selected.detection, fields, opaque.length === 0 ? [opaqueRange(input, reason)] : opaque, allDiagnostics);
}

/**
 * Inspect MakerNote values with explicitly supplied, per-operation plugins.
 * The core never keeps a process-wide plugin registry and never supplies a
 * plugin with bytes outside the current MakerNote value.
 */
export function inspectMakerNotes(inputs: readonly MakerNoteInput[], limits: SecurityLimits, options: MakerNoteInspectionOptions = {}): MakerNoteContainerData {
  const ordered = orderedPlugins(options.plugins);
  const diagnostics = [...ordered.diagnostics];
  if (!Array.isArray(inputs) || inputs.length > limits.maxSegments) {
    return Object.freeze({ notes: [], complete: false, diagnostics: Object.freeze([...diagnostics, diagnostic("LIMIT_EXCEEDED", "MakerNote input count exceeds the configured limit.")]) });
  }
  const notes: MakerNoteNoteLike[] = [];
  for (const [index, input] of inputs.entries()) {
    if (!validMakerNoteInput(input)) {
      const invalidInput: MakerNoteInput = { id: `invalid-${index}`, fieldId: "invalid", raw: new Uint8Array([0]), noteOffset: 0, sourceLength: 1, blockId: "invalid" };
      notes.push(noteForInput(invalidInput, "rejected", null, null, [], [], [diagnostic("PLUGIN_REJECTED", "MakerNote input does not implement the bounded input contract.", undefined, invalidInput.id)]));
      continue;
    }
    try {
      notes.push(inspectOne(input, ordered.plugins, limits, options.signal));
    } catch {
      notes.push(noteForInput(input, "aborted", null, null, [], [opaqueRange(input, "malformed")], [diagnostic(options.signal?.aborted ? "ABORTED" : "PLUGIN_THROWN", "MakerNote inspection failed safely.", undefined, input.id)]));
    }
  }
  for (const note of notes) diagnostics.push(...note.diagnostics);
  const complete = diagnostics.length === 0 && notes.every((note) => note.status === "detected-decoded" && note.opaqueRanges.length === 0);
  return Object.freeze({ notes: Object.freeze(notes.map((note) => Object.freeze({ ...note, fields: Object.freeze(note.fields.slice()), opaqueRanges: Object.freeze(note.opaqueRanges.slice()), diagnostics: Object.freeze(note.diagnostics.slice()) }))), complete, diagnostics: Object.freeze(diagnostics.slice(0, limits.maxWarnings)) });
}

/** Convert decoded plugin fields into the common field view without losing the MakerNote-specific model. */
export function makerNoteFieldsAsMetadataFields(data: MakerNoteContainerData): readonly MetadataField[] {
  const output: MetadataField[] = [];
  for (const note of data.notes) {
    for (const field of note.fields) {
      output.push({
        id: field.id,
        ifd: `MakerNote:${note.plugin?.vendor ?? "unknown"}`,
        tag: field.tag,
        name: field.name,
        raw: field.raw,
        value: field.value,
        display: field.display,
        description: field.description,
        type: field.type,
        sensitivity: field.sensitivity,
        count: field.count,
        known: field.known,
        source: {
          blockId: field.provenance.blockId,
          entryOffset: field.provenance.originalFileOffset,
          entryLength: field.provenance.rangeLength,
          valueOffset: field.provenance.originalFileOffset,
          valueLength: field.provenance.rangeLength,
        },
      });
    }
  }
  return output;
}
