import { materializeInput } from "./input.js";
import { mergeStructuredXmp, parseStructuredXmpBytesDetailed, parseStructuredXmpDetailed } from "./metadata/xmp.js";
import { serializeStructuredXmp, XmpSerializationError, type XmpSerializeOptions } from "./metadata/serialization.js";
import { resolveLimits } from "./security/limits.js";
import { sha256Hex } from "./security/sha256.js";
import { throwIfAborted } from "./security/abort.js";
import type {
  MetadataInput,
  MetadataResult,
  SecurityLimits,
  XmpPacketProvenance,
} from "./types.js";
import type {
  StructuredXmpOptions,
  StructuredXmpPacket,
  XmpDiagnostic,
  XmpMergedDocument,
  XmpRdfDocument,
  XmpValue,
} from "./metadata/xmp.js";

/** Explicit merge policies for embedded and standalone XMP sources. */
export type XmpSidecarMergePolicy = "preserve-all" | "embedded-first" | "sidecar-first" | "reject-conflicts";

export interface XmpSidecarParseOptions {
  /** Caller-visible label retained as provenance; it is never dereferenced. */
  readonly id?: string;
  readonly limits?: Partial<SecurityLimits>;
  readonly decode?: StructuredXmpOptions;
  readonly signal?: AbortSignal;
}

export interface XmpSidecarSourceIdentity {
  readonly kind: "sidecar";
  readonly id: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface XmpSidecarPacket {
  readonly sourceIndex: number;
  readonly value: StructuredXmpPacket | null;
  readonly diagnostics: readonly XmpDiagnostic[];
  readonly provenance: XmpPacketProvenance;
}

export interface XmpSidecarCoverage {
  readonly complete: boolean;
  readonly sourceBytes: number;
  readonly packetCount: number;
  readonly propertyCount: number;
  readonly unknownPropertyCount: number;
  readonly diagnostics: readonly XmpDiagnostic[];
}

/** Lossless, bounded result for an explicit `.xmp` byte input. */
export interface XmpSidecarResult {
  readonly source: XmpSidecarSourceIdentity;
  readonly block: {
    readonly id: string;
    readonly family: "XMP";
    readonly container: "XMP sidecar";
    readonly status: "decoded" | "malformed" | "skipped";
    readonly offset: 0;
    readonly length: number;
  };
  readonly packets: readonly XmpSidecarPacket[];
  readonly value: StructuredXmpPacket | null;
  readonly coverage: XmpSidecarCoverage;
}

export interface XmpSidecarMergeInput {
  readonly kind: "embedded" | "sidecar";
  readonly sourceId: string;
  readonly packets: readonly {
    readonly value: StructuredXmpPacket | null;
    readonly provenance?: XmpPacketProvenance | null;
    readonly diagnostics?: readonly XmpDiagnostic[];
  }[];
}

export interface XmpSidecarMergeOptions {
  readonly policy?: XmpSidecarMergePolicy;
  readonly limits?: Partial<SecurityLimits>;
  readonly signal?: AbortSignal;
}

export interface XmpSidecarMergeResult {
  readonly policy: XmpSidecarMergePolicy;
  readonly accepted: boolean;
  readonly sources: readonly { readonly kind: "embedded" | "sidecar"; readonly sourceId: string; readonly packetCount: number }[];
  readonly documents: readonly {
    readonly sourceKind: "embedded" | "sidecar";
    readonly sourceId: string;
    readonly packetIndex: number;
    readonly value: StructuredXmpPacket | null;
    readonly provenance: XmpPacketProvenance | null;
  }[];
  readonly merged: XmpMergedDocument;
  readonly conflicts: XmpMergedDocument["conflicts"];
  readonly diagnostics: readonly XmpDiagnostic[];
}

export interface XmpSidecarSerializationOptions extends XmpSerializeOptions {
  /** Reparse and semantically compare output before returning it. Defaults true. */
  readonly verify?: boolean;
  readonly decode?: StructuredXmpOptions;
  readonly limits?: Partial<SecurityLimits>;
}

export interface XmpSidecarSerializationResult {
  readonly data: Uint8Array;
  readonly text: string;
  readonly sha256: string;
  readonly verified: boolean;
  readonly semanticHash: string;
  readonly reparsedSemanticHash: string | null;
  readonly diagnostics: readonly XmpDiagnostic[];
}

function decoderOptions(limits: SecurityLimits, overrides: StructuredXmpOptions = {}): StructuredXmpOptions {
  return {
    maxInputBytes: Math.min(limits.maxStringBytes, limits.maxMetadataBytes, limits.maxInputBytes),
    maxElements: limits.maxXmpNodes,
    maxProperties: limits.maxXmpProperties,
    maxDepth: limits.maxXmpDepth,
    maxAttributes: limits.maxXmpAttributes,
    maxNamespaces: limits.maxXmpNamespaces,
    maxTextBytes: limits.maxXmpTextBytes,
    maxArrayItems: limits.maxXmpArrayItems,
    maxQualifiers: limits.maxXmpQualifiers,
    maxOutputBytes: limits.maxXmpOutputBytes,
    maxPackets: limits.maxXmpPackets,
    ...overrides,
  };
}

function sidecarId(requested: string | undefined, digest: string): string {
  if (requested !== undefined && requested.length > 0 && requested.length <= 256) return requested;
  return `xmp-sidecar:${digest}`;
}

function propertyCount(value: StructuredXmpPacket | null): number {
  return value?.rdf?.properties.length ?? value?.model?.properties.length ?? 0;
}

function unknownPropertyCount(value: StructuredXmpPacket | null): number {
  const document = value?.rdf ?? value?.model;
  if (document === undefined) return 0;
  const knownNamespaces = new Set(["http://www.w3.org/1999/02/22-rdf-syntax-ns#", "http://ns.adobe.com/xap/1.0/", "http://purl.org/dc/elements/1.1/", "http://ns.adobe.com/photoshop/1.0/", "http://ns.adobe.com/xap/1.0/mm/", "http://ns.adobe.com/xap/1.0/rights/"]);
  return document.properties.filter((property) => !knownNamespaces.has(property.name.namespaceUri)).length;
}

function freezePacketProvenance(sourceId: string, blockId: string, length: number): XmpPacketProvenance {
  return Object.freeze({ id: sourceId, source: "sidecar", blockIds: Object.freeze([blockId]), packetIndex: 0, offset: 0, length, sidecarId: sourceId });
}

/** Parse caller-supplied XMP sidecar bytes without filesystem or network access. */
export async function parseXmpSidecar(input: MetadataInput, options: XmpSidecarParseOptions = {}): Promise<XmpSidecarResult> {
  const limits = resolveLimits(options.limits);
  throwIfAborted(options.signal);
  const bytes = await materializeInput(input, limits, options.signal);
  throwIfAborted(options.signal);
  const digest = await sha256Hex(bytes);
  if (bytes.byteLength > limits.maxMetadataBytes) {
    const sourceId = sidecarId(options.id, digest);
    const diagnostic: XmpDiagnostic = { code: "LIMIT_EXCEEDED", message: `XMP sidecar exceeds ${limits.maxMetadataBytes} metadata bytes.`, severity: "error" };
    const provenance = freezePacketProvenance(sourceId, `${sourceId}:block`, bytes.byteLength);
    return { source: { kind: "sidecar", id: sourceId, byteLength: bytes.byteLength, sha256: digest }, block: { id: `${sourceId}:block`, family: "XMP", container: "XMP sidecar", status: "skipped", offset: 0, length: bytes.byteLength }, packets: Object.freeze([{ sourceIndex: 0, value: null, diagnostics: Object.freeze([diagnostic]), provenance }]), value: null, coverage: { complete: false, sourceBytes: bytes.byteLength, packetCount: 1, propertyCount: 0, unknownPropertyCount: 0, diagnostics: Object.freeze([diagnostic]) } };
  }
  const sourceId = sidecarId(options.id, digest);
  const blockId = `${sourceId}:block`;
  const provenance = freezePacketProvenance(sourceId, blockId, bytes.byteLength);
  const parsed = parseStructuredXmpBytesDetailed(bytes, decoderOptions(limits, options.decode));
  const packet = Object.freeze({ sourceIndex: 0, value: parsed.value, diagnostics: Object.freeze([...parsed.diagnostics]), provenance });
  const diagnostics = Object.freeze([...parsed.diagnostics]);
  return {
    source: Object.freeze({ kind: "sidecar", id: sourceId, byteLength: bytes.byteLength, sha256: digest }),
    block: Object.freeze({ id: blockId, family: "XMP", container: "XMP sidecar", status: parsed.value === null ? "malformed" : "decoded", offset: 0 as const, length: bytes.byteLength }),
    packets: Object.freeze([packet]),
    value: parsed.value,
    coverage: Object.freeze({ complete: parsed.value !== null && !diagnostics.some((diagnostic) => diagnostic.severity === "error"), sourceBytes: bytes.byteLength, packetCount: 1, propertyCount: propertyCount(parsed.value), unknownPropertyCount: unknownPropertyCount(parsed.value), diagnostics }),
  };
}

function mergePolicy(policy: XmpSidecarMergePolicy): "preserve-all" | "first" | "last" {
  if (policy === "embedded-first") return "first";
  if (policy === "sidecar-first") return "last";
  return "preserve-all";
}

/** Merge explicit embedded and sidecar packets while retaining source order and every candidate. */
export function mergeXmpSources(sources: readonly XmpSidecarMergeInput[], options: XmpSidecarMergeOptions = {}): XmpSidecarMergeResult {
  const policy = options.policy ?? "preserve-all";
  const limits = resolveLimits(options.limits);
  throwIfAborted(options.signal);
  if (sources.length > limits.maxXmpPackets) throw new RangeError(`XMP source count exceeds ${limits.maxXmpPackets}.`);
  const documents: Array<XmpSidecarMergeResult["documents"][number]> = [];
  const mergeInputs: { value: StructuredXmpPacket | null; packetIndex: number; sourceId: string; source: XmpPacketProvenance | null }[] = [];
  const sourceSummary: Array<XmpSidecarMergeResult["sources"][number]> = [];
  let packetIndex = 0;
  const diagnostics: XmpDiagnostic[] = [];
  for (const source of sources) {
    if (source.sourceId.length < 1 || source.sourceId.length > 256) throw new TypeError("XMP sourceId must be explicit and bounded.");
    if (source.packets.length > limits.maxXmpPackets - packetIndex) throw new RangeError(`XMP packet count exceeds ${limits.maxXmpPackets}.`);
    sourceSummary.push(Object.freeze({ kind: source.kind, sourceId: source.sourceId, packetCount: source.packets.length }));
    for (const packet of source.packets) {
      throwIfAborted(options.signal);
      const provenance = packet.provenance ?? null;
      documents.push({ sourceKind: source.kind, sourceId: source.sourceId, packetIndex, value: packet.value, provenance });
      mergeInputs.push({ value: packet.value, packetIndex, sourceId: source.sourceId, source: provenance });
      if (packet.diagnostics !== undefined) diagnostics.push(...packet.diagnostics);
      packetIndex += 1;
    }
  }
  const merged = mergeStructuredXmp(mergeInputs, mergePolicy(policy));
  const conflicts = merged.conflicts;
  const accepted = diagnostics.every((diagnostic) => diagnostic.severity !== "error") && (policy !== "reject-conflicts" || conflicts.length === 0);
  if (!accepted) diagnostics.push({ code: "CONFLICT", message: `XMP merge contains ${conflicts.length} conflicting property identities.`, severity: "error" });
  return Object.freeze({ policy, accepted, sources: Object.freeze(sourceSummary), documents: Object.freeze(documents), merged, conflicts, diagnostics: Object.freeze(diagnostics) });
}

/** Merge an already parsed image result with one explicit sidecar byte input. */
export async function mergeMetadataWithXmpSidecar(result: MetadataResult, sidecar: MetadataInput | XmpSidecarResult, options: XmpSidecarMergeOptions = {}): Promise<XmpSidecarMergeResult> {
  const parsed = "source" in (sidecar as object) && "packets" in (sidecar as object)
    ? sidecar as XmpSidecarResult
    : await parseXmpSidecar(sidecar as MetadataInput, { ...(options.limits === undefined ? {} : { limits: options.limits }), ...(options.signal === undefined ? {} : { signal: options.signal }) });
  const limits = resolveLimits(options.limits);
  const decode = decoderOptions(limits);
  const embeddedPackets = (result.xmp?.packets ?? []).map((packet, index) => { const parsed = parseStructuredXmpDetailed(packet, decode); return { value: parsed.value, diagnostics: parsed.diagnostics, provenance: result.xmp?.packetProvenance?.[index] ?? null }; });
  const embeddedSource: XmpSidecarMergeInput = { kind: "embedded", sourceId: `embedded:${result.container}`, packets: embeddedPackets };
  const sidecarSource: XmpSidecarMergeInput = { kind: "sidecar", sourceId: parsed.source.id, packets: parsed.packets.map((packet) => ({ value: packet.value, diagnostics: packet.diagnostics, provenance: packet.provenance })) };
  return mergeXmpSources([embeddedSource, sidecarSource], options);
}

function stableValue(value: XmpValue): unknown {
  if (value.kind === "literal") return { kind: value.kind, lexicalValue: value.lexicalValue, value: value.value, datatypeUri: value.datatypeUri, language: value.language, qualifiers: value.qualifiers.map((qualifier) => ({ name: qualifier.name.namespaceUri, localName: qualifier.name.localName, value: stableValue(qualifier.value), order: qualifier.order })) };
  if (value.kind === "array") return { kind: value.kind, container: value.container, items: value.items.map(stableValue), qualifiers: value.qualifiers.map((qualifier) => ({ name: qualifier.name.namespaceUri, localName: qualifier.name.localName, value: stableValue(qualifier.value), order: qualifier.order })) };
  return { kind: value.kind, resourceUri: value.resourceUri, nodeId: value.nodeId === null || value.nodeId.startsWith("_:") ? value.nodeId : `_:${value.nodeId}`, typeName: value.typeName === null ? null : { namespaceUri: value.typeName.namespaceUri, localName: value.typeName.localName }, properties: value.properties.map((property) => ({ namespaceUri: property.name.namespaceUri, localName: property.name.localName, order: property.order, value: stableValue(property.value) })), qualifiers: value.qualifiers.map((qualifier) => ({ name: qualifier.name.namespaceUri, localName: qualifier.name.localName, value: stableValue(qualifier.value), order: qualifier.order })) };
}

function stableSubject(subject: string): string {
  return subject.startsWith("_:") ? subject : `_:${subject}`;
}

function semanticDocument(value: StructuredXmpPacket | XmpRdfDocument): unknown {
  const document = "descriptions" in value ? value : value.rdf ?? value.model;
  if (document === undefined) return { namespaces: Object.entries(value.namespaces).sort(), properties: Object.entries(value.properties).sort() };
  return { descriptions: document.descriptions.map((description) => ({ subject: stableSubject(description.subject), typeName: description.typeName === null ? null : { namespaceUri: description.typeName.namespaceUri, localName: description.typeName.localName }, properties: description.properties.map((property) => ({ namespaceUri: property.name.namespaceUri, localName: property.name.localName, value: stableValue(property.value) })).sort((left, right) => `${left.namespaceUri}\u0000${left.localName}`.localeCompare(`${right.namespaceUri}\u0000${right.localName}`)) })) };
}

function semanticBytes(value: StructuredXmpPacket | XmpRdfDocument): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(semanticDocument(value)));
}

/** Serialize a standalone XMP sidecar and verify semantic equivalence by reparsing it. */
export async function serializeXmpSidecar(value: StructuredXmpPacket | XmpRdfDocument, options: XmpSidecarSerializationOptions = {}): Promise<XmpSidecarSerializationResult> {
  const limits = resolveLimits(options.limits);
  const text = serializeStructuredXmp(value, { ...(options.includeWrapper === undefined ? {} : { includeWrapper: options.includeWrapper }), maxOutputBytes: Math.min(options.maxOutputBytes ?? limits.maxXmpOutputBytes, limits.maxXmpOutputBytes) });
  const data = new TextEncoder().encode(text);
  if (data.byteLength > limits.maxXmpOutputBytes || data.byteLength > limits.maxMetadataBytes) throw new RangeError("Serialized XMP sidecar exceeds the configured output limit.");
  const sha256 = await sha256Hex(data);
  const canonicalValue = "descriptions" in value || value.rdf !== undefined || value.model !== undefined
    ? value
    : parseStructuredXmpBytesDetailed(data, decoderOptions(limits, options.decode)).value ?? value;
  const semanticHash = await sha256Hex(semanticBytes(canonicalValue));
  const verify = options.verify ?? true;
  let reparsedSemanticHash: string | null = null;
  const diagnostics: XmpDiagnostic[] = [];
  if (verify) {
    const parsed = parseStructuredXmpBytesDetailed(data, decoderOptions(limits, options.decode));
    diagnostics.push(...parsed.diagnostics);
    if (parsed.value === null) throw new XmpSerializationError("INVALID_VALUE", "Serialized XMP sidecar did not reparse as bounded RDF/XML.");
    reparsedSemanticHash = await sha256Hex(semanticBytes(parsed.value));
    if (reparsedSemanticHash !== semanticHash) throw new XmpSerializationError("INVALID_VALUE", "Serialized XMP sidecar changed its semantic RDF model.");
  }
  return Object.freeze({ data, text, sha256, verified: verify, semanticHash, reparsedSemanticHash, diagnostics: Object.freeze(diagnostics) });
}
