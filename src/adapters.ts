import { resolveLimits } from "./security/limits.js";
import type {
  IccDecodedTag,
  ImageDetailCandidate,
  ImageDetails,
  Integer64Value,
  IptcSemanticField,
  MetadataField,
  MetadataResult,
  RationalValue,
  SecurityLimits,
} from "./types.js";
import type { StructuredXmpPacket, XmpProperty } from "./metadata/xmp.js";

/** The three supported duplicate policies. `preserve` is the lossless default. */
export type FlatCollisionPolicy = "preserve" | "first" | "last";

export interface AdapterBudgetOptions {
  /** Tighter per-call limit; the effective value is also bounded by SecurityLimits. */
  readonly maxItems?: number;
  readonly limits?: Partial<SecurityLimits>;
}

export interface FlatObjectOptions extends AdapterBudgetOptions {
  readonly collision?: FlatCollisionPolicy;
  readonly includeDiagnostics?: boolean;
  /** Add canonical structured families under deterministic `$canonical` keys. */
  readonly includeStructured?: boolean;
}

export interface FamilyGroupOptions extends AdapterBudgetOptions {
  /** Include canonical non-field families in `toLosslessFamilyGroups`. */
  readonly includeStructured?: boolean;
}

export interface JsonSafeOptions extends AdapterBudgetOptions {
  /** Maximum nesting depth retained by the JSON-safe representation. */
  readonly maxDepth?: number;
}

export interface MigrationOptions extends AdapterBudgetOptions {
  /** Migration views are lossy by design; preserve is not accepted here. */
  readonly collision?: "first" | "last";
  readonly includeDiagnostics?: boolean;
}

export type ExifReaderDuplicatePolicy = "array" | "first" | "last";

export interface ExifReaderMigrationOptions extends AdapterBudgetOptions {
  readonly duplicate?: ExifReaderDuplicatePolicy;
  readonly includeDiagnostics?: boolean;
}

export interface MetadataQuery extends AdapterBudgetOptions {
  readonly id?: string;
  readonly name?: string;
  /** Metadata family/IFD identity, for example `IFD0`, `ExifIFD`, or `XMP`. */
  readonly family?: string;
  readonly blockId?: string;
  readonly directoryId?: string;
  readonly tag?: number;
  readonly sourceOffset?: number;
  readonly known?: boolean;
  /** Zero-based occurrence in deterministic source order. */
  readonly occurrence?: number;
}

export interface XmpPropertyQuery extends AdapterBudgetOptions {
  readonly namespaceUri?: string;
  readonly localName?: string;
  /** Prefix is only a presentation hint; URI/localName remain authoritative. */
  readonly prefix?: string;
  readonly occurrence?: number;
}

export interface ImageDetailQuery extends AdapterBudgetOptions {
  readonly property?: keyof ImageDetails;
  readonly source?: string;
  readonly blockId?: string | null;
  readonly validation?: ImageDetailCandidate<unknown>["validation"];
  readonly occurrence?: number;
}

export interface IptcSemanticQuery extends AdapterBudgetOptions {
  readonly id?: string;
  readonly name?: string;
  readonly occurrence?: number;
}

export interface IccTagQuery extends AdapterBudgetOptions {
  readonly signature?: string;
  readonly status?: IccDecodedTag["status"];
  readonly occurrence?: number;
}

export interface CanonicalFamilyGroups {
  readonly fields: Readonly<Record<string, readonly MetadataField[]>>;
  readonly details: ImageDetails | null;
  readonly composites: MetadataResult["composites"];
  readonly exif: MetadataResult["exif"];
  readonly xmp: MetadataResult["xmp"];
  readonly iptc: MetadataResult["iptc"];
  readonly iptcSemantic: MetadataResult["iptcSemantic"];
  readonly icc: MetadataResult["icc"];
  readonly jfif: MetadataResult["jfif"];
  readonly pngText: MetadataResult["pngText"];
  readonly blocks: MetadataResult["blocks"];
  readonly warnings: MetadataResult["warnings"];
}

function fields(result: MetadataResult): readonly MetadataField[] { return result.fields; }

function budget(options: AdapterBudgetOptions): { readonly limits: SecurityLimits; readonly items: number } {
  const limits = resolveLimits(options.limits);
  if (options.maxItems !== undefined && (!Number.isSafeInteger(options.maxItems) || options.maxItems <= 0)) {
    throw new RangeError("Adapter maxItems must be a positive safe integer");
  }
  return { limits, items: Math.min(limits.maxAdapterItems, options.maxItems ?? limits.maxAdapterItems) };
}

function validOccurrence(value: number | undefined): boolean {
  return value === undefined || (Number.isSafeInteger(value) && value >= 0);
}

function selectOccurrence<T>(values: readonly T[], occurrence: number | undefined): readonly T[] {
  if (occurrence === undefined) return values;
  const value = values[occurrence];
  return value === undefined ? [] : [value];
}

/** Deterministically query canonical fields without flattening duplicates. */
export function queryMetadata(result: MetadataResult, query: MetadataQuery = {}): readonly MetadataField[] {
  if (!validOccurrence(query.occurrence) || (query.tag !== undefined && !Number.isSafeInteger(query.tag)) ||
      (query.sourceOffset !== undefined && (!Number.isSafeInteger(query.sourceOffset) || query.sourceOffset < 0))) return [];
  const { items } = budget(query);
  const matched: MetadataField[] = [];
  for (const field of fields(result)) {
    if (matched.length >= items) break;
    if (query.id !== undefined && field.id !== query.id) continue;
    if (query.name !== undefined && field.name !== query.name) continue;
    if (query.tag !== undefined && field.tag !== query.tag) continue;
    if (query.family !== undefined && field.ifd !== query.family) continue;
    if (query.blockId !== undefined && field.source?.blockId !== query.blockId) continue;
    if (query.directoryId !== undefined && (field.directoryId ?? field.source?.directoryId) !== query.directoryId) continue;
    if (query.sourceOffset !== undefined && field.source?.entryOffset !== query.sourceOffset && field.source?.valueOffset !== query.sourceOffset) continue;
    if (query.known !== undefined && field.known !== query.known) continue;
    matched.push(field);
  }
  return selectOccurrence(matched, query.occurrence);
}

/** Query the lossless RDF property sequence by expanded name, never by prefix alone. */
export function queryStructuredXmp(packet: StructuredXmpPacket, query: XmpPropertyQuery = {}): readonly XmpProperty[] {
  if (!validOccurrence(query.occurrence)) return [];
  const { items } = budget(query);
  const properties = packet.rdf?.properties ?? packet.model?.properties ?? [];
  const matched: XmpProperty[] = [];
  for (const property of properties) {
    if (matched.length >= items) break;
    if (query.namespaceUri !== undefined && property.name.namespaceUri !== query.namespaceUri) continue;
    if (query.localName !== undefined && property.name.localName !== query.localName) continue;
    if (query.prefix !== undefined && property.name.prefix !== query.prefix) continue;
    matched.push(property);
  }
  return selectOccurrence(matched, query.occurrence);
}

/** Query S08 image-detail candidates in stable property/source order. */
export function queryImageDetails(result: MetadataResult, query: ImageDetailQuery = {}): readonly unknown[] {
  if (!validOccurrence(query.occurrence)) return [];
  const details = result.details;
  if (details === undefined) return [];
  const { items } = budget(query);
  const propertyNames: readonly (keyof ImageDetails)[] = query.property === undefined
    ? ["storedDimensions", "displayDimensions", "bitDepth", "components", "colorModel", "alpha", "progressive", "interlaced", "animation", "orientation", "primaryImageCandidates", "relationshipCandidates"]
    : [query.property];
  const matched: unknown[] = [];
  for (const property of propertyNames) {
    const value = details[property];
    if (!Array.isArray(value)) continue;
    for (const candidate of value) {
      if (matched.length >= items) break;
      if (typeof candidate !== "object" || candidate === null) continue;
      const item = candidate as { readonly source?: unknown; readonly blockId?: unknown; readonly validation?: unknown };
      if (query.source !== undefined && item.source !== query.source) continue;
      if (query.blockId !== undefined && item.blockId !== query.blockId) continue;
      if (query.validation !== undefined && item.validation !== query.validation) continue;
      matched.push(candidate);
    }
  }
  return selectOccurrence(matched, query.occurrence);
}

/** Query normalized IPTC candidates without imposing an IIM/XMP precedence. */
export function queryIptcSemantic(result: MetadataResult, query: IptcSemanticQuery = {}): readonly IptcSemanticField[] {
  if (!validOccurrence(query.occurrence)) return [];
  const { items } = budget(query);
  const matched = (result.iptcSemantic?.fields ?? []).filter((field) =>
    (query.id === undefined || field.id === query.id) &&
    (query.name === undefined || field.name === query.name),
  ).slice(0, items);
  return selectOccurrence(matched, query.occurrence);
}

/** Query decoded ICC tags while retaining each tag identity and occurrence. */
export function queryIccTags(result: MetadataResult, query: IccTagQuery = {}): readonly IccDecodedTag[] {
  if (!validOccurrence(query.occurrence)) return [];
  const { items } = budget(query);
  const matched = (result.icc?.decodedTags ?? []).filter((tag) =>
    (query.signature === undefined || tag.signature === query.signature) &&
    (query.status === undefined || tag.status === query.status),
  ).slice(0, items);
  return selectOccurrence(matched, query.occurrence);
}

/** A duplicate-safe flat view. The default preserves collisions as ordered arrays. */
export function toFlatObject(result: MetadataResult, options: FlatObjectOptions = {}): Readonly<Record<string, unknown>> {
  const collision = options.collision ?? "preserve";
  const { items } = budget(options);
  const output: Record<string, unknown> = {};
  const occurrences = new Map<string, number>();
  const preserved = new Map<string, unknown[]>();
  let retained = 0;
  for (const field of fields(result)) {
    if (retained >= items) break;
    retained += 1;
    const key = field.name;
    const occurrence = occurrences.get(key) ?? 0;
    occurrences.set(key, occurrence + 1);
    if (occurrence === 0) output[key] = field.value;
    else if (collision === "last") output[key] = field.value;
    else if (collision === "preserve") {
      const values = preserved.get(key) ?? [output[key]];
      values.push(field.value);
      preserved.set(key, values);
      output[key] = values;
    }
  }
  if (retained < fields(result).length) output.$adapter = { truncated: true, omittedFields: fields(result).length - retained };
  if (options.includeStructured) {
    output.$canonical = {
      details: result.details ?? null,
      composites: result.composites ?? null,
      exif: result.exif,
      xmp: result.xmp,
      iptc: result.iptc,
      iptcSemantic: result.iptcSemantic ?? null,
      icc: result.icc,
      jfif: result.jfif,
      pngText: result.pngText,
      blocks: result.blocks,
      coverage: result.coverage,
      completeness: result.completeness,
      telemetry: result.telemetry ?? null,
    };
  }
  if (options.includeDiagnostics) output.$warnings = result.warnings;
  return output;
}

/** Group canonical values by metadata family without pretending families are mutually exclusive. */
export function toFamilyGroups(result: MetadataResult, options: FamilyGroupOptions = {}): Readonly<Record<string, readonly MetadataField[]>> {
  const { items } = budget(options);
  const groups: Record<string, MetadataField[]> = {};
  let retained = 0;
  for (const field of fields(result)) {
    if (retained >= items) break;
    retained += 1;
    (groups[field.ifd] ??= []).push(field);
  }
  return Object.fromEntries(Object.entries(groups).map(([key, value]) => [key, Object.freeze(value.slice())]));
}

/** Lossless grouped view for callers that need every canonical family. */
export function toLosslessFamilyGroups(result: MetadataResult, options: FamilyGroupOptions = {}): CanonicalFamilyGroups {
  return {
    fields: toFamilyGroups(result, options),
    details: result.details ?? null,
    composites: result.composites,
    exif: result.exif,
    xmp: result.xmp,
    iptc: result.iptc,
    iptcSemantic: result.iptcSemantic,
    icc: result.icc,
    jfif: result.jfif,
    pngText: result.pngText,
    blocks: result.blocks,
    warnings: result.warnings,
  };
}

function base64(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index] ?? 0;
    const b = bytes[index + 1] ?? 0;
    const c = bytes[index + 2] ?? 0;
    const word = a * 65536 + b * 256 + c;
    output += alphabet[(word >>> 18) & 63] ?? "";
    output += alphabet[(word >>> 12) & 63] ?? "";
    output += index + 1 < bytes.length ? (alphabet[(word >>> 6) & 63] ?? "") : "=";
    output += index + 2 < bytes.length ? (alphabet[word & 63] ?? "") : "=";
  }
  return output;
}

interface JsonState {
  readonly seen: WeakSet<object>;
  readonly maxItems: number;
  readonly maxBytes: number;
  readonly maxDepth: number;
  items: number;
  bytes: number;
}

function reserve(state: JsonState, estimate: number): boolean {
  if (state.items >= state.maxItems || state.bytes > state.maxBytes) return false;
  state.items += 1;
  state.bytes += Math.max(0, estimate);
  return state.bytes <= state.maxBytes;
}

function truncated(reason: string): Readonly<Record<string, string>> { return { $truncated: reason }; }

function jsonNumber(value: number): number | Readonly<Record<string, string>> {
  return Number.isFinite(value) ? value : { $number: String(value) };
}

/** Convert all public metadata values to deterministic JSON-compatible tagged values. */
function jsonSafe(value: unknown, state: JsonState, depth: number): unknown {
  if (depth > state.maxDepth) return truncated("depth");
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "string") return reserve(state, value.length) ? value : truncated("bytes");
  if (typeof value === "number") return Number.isFinite(value) ? value : { $number: String(value) };
  if (typeof value === "bigint") return reserve(state, 24) ? { $bigint: value.toString(10) } : truncated("items");
  if (value instanceof Uint8Array) return reserve(state, value.byteLength * 4 + 32) ? { $binary: base64(value), encoding: "base64" } : truncated("bytes");
  if (value instanceof ArrayBuffer) return jsonSafe(new Uint8Array(value), state, depth + 1);
  if (ArrayBuffer.isView(value)) return jsonSafe(new Uint8Array(value.buffer, value.byteOffset, value.byteLength), state, depth + 1);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    if (keys.length === 2 && typeof record.numerator === "number" && typeof record.denominator === "number") {
      return { $rational: { numerator: jsonNumber(record.numerator), denominator: jsonNumber(record.denominator) } };
    }
    if (keys.length === 2 && typeof record.decimal === "string" && typeof record.signed === "boolean") {
      return { $integer64: { decimal: record.decimal, signed: record.signed } };
    }
    if (state.seen.has(value)) return { $circular: true };
    state.seen.add(value);
    if (Array.isArray(value)) {
      const output: unknown[] = [];
      for (const item of value) {
        if (!reserve(state, 1)) { output.push(truncated("items")); break; }
        output.push(jsonSafe(item, state, depth + 1));
      }
      state.seen.delete(value);
      return output;
    }
    const output: Record<string, unknown> = {};
    for (const key of keys.sort()) {
      if (!reserve(state, key.length + 2)) { output.$truncated = "items"; break; }
      output[key] = jsonSafe(record[key], state, depth + 1);
    }
    state.seen.delete(value);
    return output;
  }
  return value === undefined ? { $undefined: true } : { $unsupported: typeof value };
}

export function toJsonSafe(value: unknown, options: JsonSafeOptions = {}): unknown {
  const { limits, items } = budget(options);
  const maxDepth = options.maxDepth === undefined ? 64 : options.maxDepth;
  if (!Number.isSafeInteger(maxDepth) || maxDepth <= 0) throw new RangeError("JSON-safe maxDepth must be a positive safe integer");
  const state: JsonState = { seen: new WeakSet(), maxItems: items, maxBytes: limits.maxAdapterOutputBytes, maxDepth, items: 0, bytes: 0 };
  return jsonSafe(value, state, 0);
}

/** Explicit full-result adapter. Unlike a flat view, this retains every canonical family. */
export function toJsonSafeResult(result: MetadataResult, options: JsonSafeOptions = {}): unknown {
  return toJsonSafe({
    format: result.format,
    mimeType: result.mimeType,
    dimensions: result.dimensions,
    displayDimensions: result.displayDimensions,
    transform: result.transform,
    nclx: result.nclx,
    fields: result.fields,
    composites: result.composites ?? null,
    details: result.details ?? null,
    exif: result.exif,
    xmp: result.xmp,
    iptc: result.iptc,
    iptcSemantic: result.iptcSemantic ?? null,
    icc: result.icc,
    jfif: result.jfif,
    pngText: result.pngText,
    blocks: result.blocks,
    coverage: result.coverage,
    completeness: result.completeness,
    telemetry: result.telemetry ?? null,
    warnings: result.warnings,
  }, options);
}

function decodeBase64(text: string): Uint8Array | null {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(text)) return null;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const output: number[] = [];
  for (let index = 0; index < text.length; index += 4) {
    const a = alphabet.indexOf(text[index] ?? "");
    const b = alphabet.indexOf(text[index + 1] ?? "");
    const c = text[index + 2] === "=" ? 0 : alphabet.indexOf(text[index + 2] ?? "");
    const d = text[index + 3] === "=" ? 0 : alphabet.indexOf(text[index + 3] ?? "");
    if (a < 0 || b < 0 || c < 0 || d < 0) return null;
    const word = a * 262144 + b * 4096 + c * 64 + d;
    output.push((word >>> 16) & 255);
    if (text[index + 2] !== "=") output.push((word >>> 8) & 255);
    if (text[index + 3] !== "=") output.push(word & 255);
  }
  return Uint8Array.from(output);
}

/** Restore tagged values emitted by `toJsonSafe`. Unknown objects remain ordinary records. */
export function fromJsonSafe(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(fromJsonSafe);
  if (value === null || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  if (typeof record.$bigint === "string") {
    try { return BigInt(record.$bigint); } catch { /* retain malformed tags below */ }
  }
  if (record.$rational !== null && typeof record.$rational === "object") {
    const rational = record.$rational as Record<string, unknown>;
    const decodeNumber = (candidate: unknown): number | undefined => {
      if (typeof candidate === "number") return candidate;
      if (candidate !== null && typeof candidate === "object" && typeof (candidate as Record<string, unknown>).$number === "string") {
        const number = (candidate as Record<string, unknown>).$number;
        if (number === "NaN") return Number.NaN;
        if (number === "Infinity") return Number.POSITIVE_INFINITY;
        if (number === "-Infinity") return Number.NEGATIVE_INFINITY;
      }
      return undefined;
    };
    const numerator = decodeNumber(rational.numerator);
    const denominator = decodeNumber(rational.denominator);
    if (numerator !== undefined && denominator !== undefined) return { numerator, denominator };
  }
  if (record.$integer64 !== null && typeof record.$integer64 === "object") {
    const integer = record.$integer64 as Record<string, unknown>;
    if (typeof integer.decimal === "string" && typeof integer.signed === "boolean") return { decimal: integer.decimal, signed: integer.signed };
  }
  if (typeof record.$binary === "string" && record.encoding === "base64") return decodeBase64(record.$binary);
  if (typeof record.$number === "string") {
    if (record.$number === "NaN") return Number.NaN;
    if (record.$number === "Infinity") return Number.POSITIVE_INFINITY;
    if (record.$number === "-Infinity") return Number.NEGATIVE_INFINITY;
  }
  if (record.$undefined === true) return undefined;
  return Object.fromEntries(Object.keys(record).sort().map((key) => [key, fromJsonSafe(record[key])]));
}

/** Honest, deliberately lossy migration view for common exifr-style flat reads. */
export function toExifrCompatible(result: MetadataResult, options: MigrationOptions = {}): Readonly<Record<string, unknown>> {
  return toFlatObject(result, { ...options, collision: options.collision ?? "last" });
}

/** Honest ExifReader-style grouped tags; duplicate tag names remain arrays by default. */
export function toExifReaderCompatible(result: MetadataResult, options: ExifReaderMigrationOptions = {}): Readonly<Record<string, Readonly<Record<string, unknown>>>> {
  const { items } = budget(options);
  const duplicate = options.duplicate ?? "array";
  const groups: Record<string, Record<string, unknown>> = {};
  const preserved = new Map<string, unknown[]>();
  let retained = 0;
  for (const field of fields(result)) {
    if (retained >= items) break;
    retained += 1;
    const group = groups[field.ifd] ??= {};
    const old = group[field.name];
    const next = { value: field.value, description: field.description };
    if (old === undefined || duplicate === "first") group[field.name] = old === undefined ? next : old;
    else if (duplicate === "last") group[field.name] = next;
    else {
      const key = `${field.ifd}\u0000${field.name}`;
      const values = preserved.get(key) ?? (Array.isArray(old) ? old as unknown[] : [old]);
      values.push(next);
      preserved.set(key, values);
      group[field.name] = values;
    }
  }
  if (retained < fields(result).length && options.includeDiagnostics) groups.$adapter = { truncated: true };
  return groups;
}

export type { Integer64Value, RationalValue };
