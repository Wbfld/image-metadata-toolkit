import { IPTC_IIM_DATASETS } from "./iptc.js";
import { IPTC_TECHREFERENCE_PROPERTIES } from "../generated/iptc-pmd.js";
import type {
  XmpArrayValue,
  XmpDescription,
  XmpLiteralValue,
  XmpNamespaceBinding,
  XmpProperty,
  XmpPropertyValue,
  XmpQualifiedName,
  XmpQualifier,
  XmpRdfDocument,
  XmpValue,
  StructuredXmpPacket,
} from "./xmp.js";
import { sha256Hex } from "../security/sha256.js";

const RDF_NAMESPACE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
const XMP_META_NAMESPACE = "adobe:ns:meta/";
const EXTENDED_XMP_IDENTIFIER = "http://ns.adobe.com/xmp/extension/\0";
const DEFAULT_XMP_OUTPUT_BYTES = 4 * 1024 * 1024;
const DEFAULT_IIM_OUTPUT_BYTES = 16 * 1024 * 1024;
const MAX_IIM_LENGTH = 0xffffffff;

export class XmpSerializationError extends Error {
  readonly code: "INVALID_VALUE" | "LIMIT_EXCEEDED" | "INVALID_NAMESPACE";

  constructor(code: XmpSerializationError["code"], message: string) {
    super(message);
    this.name = "XmpSerializationError";
    this.code = code;
  }
}

export interface XmpSerializeOptions {
  readonly includeWrapper?: boolean;
  readonly maxOutputBytes?: number;
}

export interface ExtendedXmpChunkOptions {
  readonly guid?: string;
  /** Maximum number of logical XMP bytes in one returned payload. */
  readonly maxChunkBytes?: number;
  readonly maxOutputBytes?: number;
}

export interface ExtendedXmpSerialization {
  readonly guid: string;
  readonly fullLength: number;
  readonly data: Uint8Array;
  /** APP1 payloads, without the JPEG marker and segment length. */
  readonly chunks: readonly Uint8Array[];
}

export type IptcIimEncoding = "utf-8" | "latin1" | "binary";
export type IptcInvalidValuePolicy = "reject" | "preserve-raw";

export interface IptcIimFieldInput {
  readonly record: number;
  readonly dataset: number;
  readonly value: string | Uint8Array;
  readonly encoding?: IptcIimEncoding;
  /** A caller-visible occurrence label; it does not alter the wire format. */
  readonly occurrence?: number;
}

export interface IptcIimSerializeOptions {
  readonly characterSet?: "utf-8" | "latin1" | "none";
  readonly invalidValuePolicy?: IptcInvalidValuePolicy;
  readonly maxOutputBytes?: number;
  readonly maxDatasets?: number;
  readonly allowExtendedLengths?: boolean;
}

export interface PhotoshopIptcResourceOptions {
  readonly maxOutputBytes?: number;
  readonly resourceName?: Uint8Array;
}

export class IptcSerializationError extends Error {
  readonly code: "INVALID_VALUE" | "LIMIT_EXCEEDED" | "NON_REPEATABLE";

  constructor(code: IptcSerializationError["code"], message: string) {
    super(message);
    this.name = "IptcSerializationError";
    this.code = code;
  }
}

export type IptcSynchronizationPolicy = "preserve-all" | "prefer-iim" | "prefer-xmp" | "reject-conflict";

export interface IptcXmpSynchronizationInput {
  readonly iim?: readonly IptcIimFieldInput[];
  readonly xmp?: StructuredXmpPacket | XmpRdfDocument | null;
}

export interface IptcSynchronizationConflict {
  readonly propertyId: string;
  readonly xmpIdentity: string;
  readonly iimIdentity: string;
  readonly iimValues: readonly string[];
  readonly xmpValues: readonly string[];
}

export interface IptcXmpSynchronizationOptions extends IptcIimSerializeOptions, XmpSerializeOptions {
  readonly policy?: IptcSynchronizationPolicy;
}

export interface IptcXmpSynchronizationResult {
  readonly policy: IptcSynchronizationPolicy;
  readonly iim: Uint8Array | null;
  readonly xmp: string | null;
  readonly conflicts: readonly IptcSynchronizationConflict[];
}

export class IptcSynchronizationError extends Error {
  readonly conflicts: readonly IptcSynchronizationConflict[];

  constructor(conflicts: readonly IptcSynchronizationConflict[]) {
    super(`IPTC/XMP synchronization found ${conflicts.length} conflicting mapped value${conflicts.length === 1 ? "" : "s"}.`);
    this.name = "IptcSynchronizationError";
    this.conflicts = conflicts;
  }
}

function checkedLimit(value: number | undefined, fallback: number, label: string): number {
  const result = value ?? fallback;
  if (!Number.isSafeInteger(result) || result < 1) throw new XmpSerializationError("LIMIT_EXCEEDED", `${label} must be a positive safe integer.`);
  return result;
}

function checkedIptcLimit(value: number | undefined, fallback: number, label: string): number {
  const result = value ?? fallback;
  if (!Number.isSafeInteger(result) || result < 1) throw new IptcSerializationError("LIMIT_EXCEEDED", `${label} must be a positive safe integer.`);
  return result;
}

function isXmlCodePoint(codePoint: number): boolean {
  return codePoint === 0x9 || codePoint === 0xa || codePoint === 0xd || (codePoint >= 0x20 && codePoint <= 0xd7ff) || (codePoint >= 0xe000 && codePoint <= 0xfffd) || (codePoint >= 0x10000 && codePoint <= 0x10ffff);
}

function assertXmlText(value: string, label: string): void {
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? -1;
    if (!isXmlCodePoint(codePoint)) throw new XmpSerializationError("INVALID_VALUE", `${label} contains a code point that XML 1.0 cannot represent.`);
  }
}

function escapeXml(value: string, attribute: boolean): string {
  return value.replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;").replace(attribute ? /["']/gu : /$^/gu, (character) => character === '"' ? "&quot;" : "&apos;");
}

function xmlName(value: string, label: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_.-]*$/u.test(value)) throw new XmpSerializationError("INVALID_NAMESPACE", `${label} is not a valid XML name.`);
  return value;
}

function ordered<T extends { readonly order: number }>(values: readonly T[]): readonly T[] {
  return values.map((value, index) => ({ value, index })).sort((left, right) => left.value.order - right.value.order || left.index - right.index).map(({ value }) => value);
}

interface NamespacePlan {
  readonly prefixForUri: ReadonlyMap<string, string>;
  readonly declarations: readonly { readonly prefix: string; readonly uri: string }[];
}

function collectNames(value: XmpValue, result: XmpQualifiedName[]): void {
  if (value.kind === "literal") {
    for (const qualifier of value.qualifiers) { result.push(qualifier.name); collectNames(qualifier.value, result); }
    return;
  }
  if (value.kind === "array") {
    for (const qualifier of value.qualifiers) { result.push(qualifier.name); collectNames(qualifier.value, result); }
    for (const item of value.items) collectNames(item, result);
    return;
  }
  for (const qualifier of value.qualifiers) { result.push(qualifier.name); collectNames(qualifier.value, result); }
  if (value.typeName !== null) result.push(value.typeName);
  for (const property of value.properties) { result.push(property.name); collectNames(property.value, result); }
}

function namespacePlan(document: XmpRdfDocument): NamespacePlan {
  const bindings = new Map<string, { readonly uri: string; readonly order: number; readonly prefix: string }[]>();
  for (const binding of [...document.namespaces].sort((left, right) => left.order - right.order || left.prefix.localeCompare(right.prefix) || left.namespaceUri.localeCompare(right.namespaceUri))) {
    if (binding.namespaceUri.length === 0) throw new XmpSerializationError("INVALID_NAMESPACE", "XMP namespace URI cannot be empty.");
    if (!/^[A-Za-z_][A-Za-z0-9_.-]*$/u.test(binding.prefix) || binding.prefix === "xml" || binding.prefix === "xmlns") continue;
    const entries = bindings.get(binding.namespaceUri) ?? [];
    entries.push({ uri: binding.namespaceUri, order: binding.order, prefix: binding.prefix });
    bindings.set(binding.namespaceUri, entries);
  }
  const names: XmpQualifiedName[] = [];
  for (const description of document.descriptions) {
    if (description.typeName !== null) names.push(description.typeName);
    for (const property of description.properties) { names.push(property.name); collectNames(property.value, names); }
  }
  const usedUris = new Set(names.map((name) => name.namespaceUri));
  for (const property of document.properties) { names.push(property.name); collectNames(property.value, names); }
  const prefixForUri = new Map<string, string>([[RDF_NAMESPACE, "rdf"], [XML_NAMESPACE, "xml"], [XMP_META_NAMESPACE, "x"]]);
  const occupied = new Set(["rdf", "xml", "x"]);
  const declarations: { prefix: string; uri: string }[] = [{ prefix: "x", uri: XMP_META_NAMESPACE }, { prefix: "rdf", uri: RDF_NAMESPACE }];
  const sortedUris = [...new Set([...bindings.keys(), ...usedUris, ...names.map((name) => name.namespaceUri)])].filter((uri) => uri !== RDF_NAMESPACE && uri !== XML_NAMESPACE && uri !== XMP_META_NAMESPACE).sort((left, right) => left.localeCompare(right));
  let generated = 0;
  for (const uri of sortedUris) {
    const candidate = [...(bindings.get(uri) ?? [])].sort((left, right) => left.order - right.order || left.prefix.localeCompare(right.prefix))[0]?.prefix;
    let prefix = candidate === undefined || occupied.has(candidate) ? "" : candidate;
    if (prefix === "") {
      do { prefix = `ns${generated}`; generated += 1; } while (occupied.has(prefix));
    }
    occupied.add(prefix);
    prefixForUri.set(uri, prefix);
    declarations.push({ prefix, uri });
  }
  return { prefixForUri, declarations };
}

function qualifiedName(name: XmpQualifiedName, plan: NamespacePlan): string {
  const local = xmlName(name.localName, "XMP local name");
  if (name.namespaceUri === RDF_NAMESPACE) return `rdf:${local}`;
  if (name.namespaceUri === XML_NAMESPACE) return `xml:${local}`;
  const prefix = plan.prefixForUri.get(name.namespaceUri);
  if (prefix === undefined) throw new XmpSerializationError("INVALID_NAMESPACE", `No namespace binding exists for ${name.namespaceUri}.`);
  return `${prefix}:${local}`;
}

function literalAttribute(name: XmpQualifiedName, value: string, plan: NamespacePlan): string {
  assertXmlText(value, `XMP qualifier ${name.localName}`);
  return `${qualifiedName(name, plan)}="${escapeXml(value, true)}"`;
}

function valueAttributes(value: XmpValue, plan: NamespacePlan): string[] {
  const attributes: string[] = [];
  for (const qualifier of ordered(value.qualifiers)) {
    if (qualifier.value.kind !== "literal") continue;
    attributes.push(literalAttribute(qualifier.name, qualifier.value.lexicalValue, plan));
  }
  if (value.kind === "literal") {
    if (value.datatypeUri !== null) { assertXmlText(value.datatypeUri, "XMP datatype URI"); attributes.push(`rdf:datatype="${escapeXml(value.datatypeUri, true)}"`); }
    if (value.language !== null) { assertXmlText(value.language, "XMP language tag"); attributes.push(`xml:lang="${escapeXml(value.language, true)}"`); }
  }
  return attributes;
}

function nonLiteralQualifiers(value: XmpValue): readonly XmpQualifier[] {
  return value.qualifiers.filter((qualifier) => qualifier.value.kind !== "literal");
}

function serializeValueBody(value: XmpValue, plan: NamespacePlan, depth: number): string {
  if (depth > 64) throw new XmpSerializationError("LIMIT_EXCEEDED", "XMP value nesting exceeds 64 levels.");
  if (value.kind === "literal") {
    assertXmlText(value.lexicalValue, "XMP literal");
    return escapeXml(value.lexicalValue, false);
  }
  if (value.kind === "array") {
    const items = ordered(value.items.map((item, order) => ({ item, order }))).map(({ item }) => serializeNamedValue({ namespaceUri: RDF_NAMESPACE, localName: "li", prefix: "rdf", qualifiedName: "rdf:li" }, item, plan, depth + 1)).join("");
    return `<rdf:${value.container}>${items}</rdf:${value.container}>`;
  }
  const nestedProperties = ordered(value.properties).map((property) => serializeProperty(property, plan, depth + 1)).join("");
  const type = value.typeName === null ? "" : `<rdf:type rdf:resource="${escapeXml(`${value.typeName.namespaceUri}${value.typeName.localName}`, true)}"/>`;
  const subject = value.nodeId !== null ? ` rdf:nodeID="${escapeXml(value.nodeId, true)}"` : value.resourceUri !== null ? ` rdf:about="${escapeXml(value.resourceUri, true)}"` : "";
  return `<rdf:Description${subject}>${type}${nestedProperties}</rdf:Description>`;
}

function serializeQualifierResource(value: XmpValue, plan: NamespacePlan, depth: number): string {
  const qualifiers = ordered(value.qualifiers).filter((qualifier) => qualifier.value.kind !== "literal").map((qualifier) => serializeNamedValue(qualifier.name, qualifier.value, plan, depth + 1)).join("");
  const core = serializeValueBody({ ...value, qualifiers: [] }, plan, depth + 1);
  const resourceMarker = value.kind === "typed-resource" ? ` rdf:parseType="Resource"` : "";
  return `<rdf:value${resourceMarker}>${core}</rdf:value>${qualifiers}`;
}

function serializeValue(value: XmpValue, plan: NamespacePlan, depth: number): string {
  if (nonLiteralQualifiers(value).length > 0) return serializeQualifierResource(value, plan, depth);
  return serializeValueBody(value, plan, depth);
}

function serializeNamedValue(name: XmpQualifiedName, value: XmpValue, plan: NamespacePlan, depth: number): string {
  const qname = qualifiedName(name, plan);
  const attributes = valueAttributes(value, plan);
  if (value.kind === "resource" && value.resourceUri !== null && nonLiteralQualifiers(value).length === 0) return `<${qname}${attributes.length === 0 ? "" : ` ${attributes.join(" ")}`} rdf:resource="${escapeXml(value.resourceUri, true)}"/>`;
  if (value.kind === "blank-node" && value.nodeId !== null && value.properties.length === 0 && nonLiteralQualifiers(value).length === 0) return `<${qname}${attributes.length === 0 ? "" : ` ${attributes.join(" ")}`} rdf:nodeID="${escapeXml(value.nodeId, true)}"/>`;
  const structural = value.kind === "literal" && value.parseType === "Literal" ? ["rdf:parseType=\"Literal\""] : value.kind === "typed-resource" || nonLiteralQualifiers(value).length > 0 ? ["rdf:parseType=\"Resource\""] : [];
  const body = serializeValue(value, plan, depth);
  return `<${qname}${[...attributes, ...structural].length === 0 ? "" : ` ${[...attributes, ...structural].join(" ")}`}>${body}</${qname}>`;
}

function serializeProperty(property: XmpProperty, plan: NamespacePlan, depth: number): string {
  return serializeNamedValue(property.name, property.value, plan, depth);
}

function qnameFromLegacy(value: string, namespaces: Readonly<Record<string, string>>): XmpQualifiedName {
  const separator = value.indexOf(":");
  if (separator <= 0 || separator >= value.length - 1) throw new XmpSerializationError("INVALID_NAMESPACE", `Legacy XMP property ${value} must use a bound prefix.`);
  const prefix = xmlName(value.slice(0, separator), "XMP prefix");
  const localName = xmlName(value.slice(separator + 1), "XMP local name");
  const namespaceUri = namespaces[prefix];
  if (namespaceUri === undefined || namespaceUri.length === 0) throw new XmpSerializationError("INVALID_NAMESPACE", `Legacy XMP property ${value} has no namespace binding.`);
  return { namespaceUri, localName, prefix, qualifiedName: value };
}

function legacyValue(value: XmpPropertyValue): XmpValue {
  if (typeof value === "string") return { kind: "literal", lexicalValue: value, value, datatypeUri: null, language: null, qualifiers: [] } satisfies XmpLiteralValue;
  if (Array.isArray(value)) { const items = value as readonly string[]; return { kind: "array", container: "Bag", items: items.map((item) => ({ kind: "literal", lexicalValue: item, value: item, datatypeUri: null, language: null, qualifiers: [] } satisfies XmpLiteralValue)), qualifiers: [] } satisfies XmpArrayValue; }
  const languages = value as Readonly<Record<string, string>>;
  return { kind: "array", container: "Alt", items: Object.keys(languages).map((language) => { const item = languages[language] ?? ""; return { kind: "literal", lexicalValue: item, value: item, datatypeUri: null, language: language === "x-default" ? "x-default" : language, qualifiers: [] } satisfies XmpLiteralValue; }), qualifiers: [] } satisfies XmpArrayValue;
}

function documentFor(value: StructuredXmpPacket | XmpRdfDocument): XmpRdfDocument {
  if (Object.hasOwn(value, "descriptions")) return value as XmpRdfDocument;
  const packet = value as StructuredXmpPacket;
  if (packet.rdf !== undefined) return packet.rdf;
  if (packet.model !== undefined) return packet.model;
  const namespaces = Object.entries(packet.namespaces).map(([prefix, namespaceUri], order) => ({ prefix, namespaceUri, order } satisfies XmpNamespaceBinding));
  const properties = Object.entries(packet.properties).map(([name, propertyValue], order) => ({ name: qnameFromLegacy(name, packet.namespaces), value: legacyValue(propertyValue), qualifiers: [], order, sourceStart: 0, sourceEnd: 0, aliasOf: null } satisfies XmpProperty));
  const description: XmpDescription = { subject: "", typeName: null, properties, sourceStart: 0, sourceEnd: 0 };
  return { namespaces, descriptions: [description], properties, sourceLength: 0 };
}

/** Serialize the complete RDF model, retaining lexical values, arrays, resources, qualifiers, and property order. */
export function serializeStructuredXmp(value: StructuredXmpPacket | XmpRdfDocument, options: XmpSerializeOptions = {}): string {
  const document = documentFor(value);
  const plan = namespacePlan(document);
  const descriptions = document.descriptions.length > 0 ? document.descriptions : document.properties.length > 0 ? [{ subject: "", typeName: null, properties: document.properties, sourceStart: 0, sourceEnd: 0 } satisfies XmpDescription] : [];
  const body = descriptions.map((description) => {
    const subject = description.subject.startsWith("_:") ? ` rdf:nodeID="${escapeXml(description.subject.slice(2), true)}"` : ` rdf:about="${escapeXml(description.subject, true)}"`;
    const properties = ordered(description.properties).map((property) => serializeProperty(property, plan, 0)).join("");
    return `<rdf:Description${subject}>${properties}</rdf:Description>`;
  }).join("");
  const declarations = plan.declarations.map(({ prefix, uri }) => `xmlns:${prefix}="${escapeXml(uri, true)}"`).join(" ");
  const includeWrapper = options.includeWrapper ?? true;
  const output = includeWrapper ? `<x:xmpmeta ${declarations}><rdf:RDF>${body}</rdf:RDF></x:xmpmeta>` : `<rdf:RDF ${declarations}>${body}</rdf:RDF>`;
  assertXmlText(output, "XMP output");
  const maxOutputBytes = checkedLimit(options.maxOutputBytes, DEFAULT_XMP_OUTPUT_BYTES, "maxOutputBytes");
  if (new TextEncoder().encode(output).byteLength > maxOutputBytes) throw new XmpSerializationError("LIMIT_EXCEEDED", `Serialized XMP exceeds ${maxOutputBytes} bytes.`);
  return output;
}

/** Short alias for callers that already have an RDF/XML vocabulary object. */
export const serializeXmp = serializeStructuredXmp;

/** Build deterministic Adobe Extended XMP payloads; profile images are never copied or retained. */
export async function chunkExtendedXmp(packet: string | Uint8Array, options: ExtendedXmpChunkOptions = {}): Promise<ExtendedXmpSerialization> {
  const data = typeof packet === "string" ? new TextEncoder().encode(packet) : packet.slice();
  if (data.length < 1 || data.length > MAX_IIM_LENGTH) throw new XmpSerializationError("LIMIT_EXCEEDED", "Extended XMP must contain between one byte and 2^32-1 bytes.");
  const maxOutputBytes = checkedLimit(options.maxOutputBytes, DEFAULT_XMP_OUTPUT_BYTES, "maxOutputBytes");
  if (data.length > maxOutputBytes) throw new XmpSerializationError("LIMIT_EXCEEDED", `Extended XMP exceeds ${maxOutputBytes} bytes.`);
  const requestedChunk = options.maxChunkBytes ?? (0xffff - 2 - new TextEncoder().encode(EXTENDED_XMP_IDENTIFIER).length - 40);
  if (!Number.isSafeInteger(requestedChunk) || requestedChunk < 1) throw new XmpSerializationError("LIMIT_EXCEEDED", "maxChunkBytes must be a positive safe integer.");
  const guid = options.guid === undefined ? (await sha256Hex(data)).slice(0, 32).toUpperCase() : options.guid.toUpperCase();
  if (!/^[A-F0-9]{32}$/u.test(guid)) throw new XmpSerializationError("INVALID_VALUE", "Extended XMP GUID must be exactly 32 hexadecimal characters.");
  const identifier = new TextEncoder().encode(EXTENDED_XMP_IDENTIFIER);
  const chunks: Uint8Array[] = [];
  for (let offset = 0; offset < data.length; offset += requestedChunk) {
    const part = data.subarray(offset, Math.min(data.length, offset + requestedChunk));
    const payload = new Uint8Array(identifier.length + 40 + part.length);
    payload.set(identifier, 0); payload.set(new TextEncoder().encode(guid), identifier.length);
    const view = new DataView(payload.buffer);
    view.setUint32(identifier.length + 32, data.length, false);
    view.setUint32(identifier.length + 36, offset, false);
    payload.set(part, identifier.length + 40);
    chunks.push(payload);
  }
  return { guid, fullLength: data.length, data, chunks };
}

function invalidUnicode(value: string): boolean {
  for (const character of value) if (!isXmlCodePoint(character.codePointAt(0) ?? -1)) return true;
  return false;
}

function encodeIptcValue(value: string | Uint8Array, encoding: IptcIimEncoding): Uint8Array {
  if (value instanceof Uint8Array) return value.slice();
  if (invalidUnicode(value)) throw new IptcSerializationError("INVALID_VALUE", "IPTC string contains an invalid Unicode scalar value.");
  if (encoding === "utf-8") return new TextEncoder().encode(value);
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code > 0xff) throw new IptcSerializationError("INVALID_VALUE", "Latin-1 and binary IPTC values may only contain bytes 0x00 through 0xff.");
    bytes[index] = code;
  }
  return bytes;
}

function datasetDefinition(record: number, dataset: number) {
  return IPTC_IIM_DATASETS.find((item) => item.record === record && item.dataset === dataset);
}

function isValidByteCoordinate(value: number): boolean { return Number.isSafeInteger(value) && value >= 0 && value <= 255; }

function encodeIimLength(length: number, allowExtended: boolean): Uint8Array {
  if (!Number.isSafeInteger(length) || length < 0 || length > MAX_IIM_LENGTH) throw new IptcSerializationError("LIMIT_EXCEEDED", "IPTC dataset length does not fit its 32-bit wire representation.");
  if (length <= 0x7fff) return Uint8Array.of(length >>> 8, length & 0xff);
  if (!allowExtended) throw new IptcSerializationError("LIMIT_EXCEEDED", "IPTC dataset requires an extended length but extended lengths are disabled.");
  let count = 1;
  while (count < 4 && length >= 2 ** (count * 8)) count += 1;
  const result = new Uint8Array(2 + count);
  result[0] = 0x80;
  result[1] = count;
  for (let index = 0; index < count; index += 1) result[2 + index] = Math.floor(length / (2 ** ((count - index - 1) * 8))) & 0xff;
  return result;
}

/** Serialize ordered IPTC-IIM datasets, including safe ordinary and extended lengths. */
export function serializeIptcIim(fields: readonly IptcIimFieldInput[], options: IptcIimSerializeOptions = {}): Uint8Array {
  const maxOutputBytes = checkedIptcLimit(options.maxOutputBytes, DEFAULT_IIM_OUTPUT_BYTES, "maxOutputBytes");
  const maxDatasets = checkedIptcLimit(options.maxDatasets, 4096, "maxDatasets");
  if (fields.length > maxDatasets) throw new IptcSerializationError("LIMIT_EXCEEDED", `IPTC dataset count exceeds ${maxDatasets}.`);
  const policy = options.invalidValuePolicy ?? "reject";
  const allowExtended = options.allowExtendedLengths ?? true;
  const occurrences = new Map<number, number>();
  const encoded: Uint8Array[] = [];
  const charsetPresent = fields.some((field) => field.record === 1 && field.dataset === 90);
  if (options.characterSet === "utf-8" && !charsetPresent) {
    encoded.push(Uint8Array.of(0x1c, 1, 90, 0, 3, 0x1b, 0x25, 0x47));
  }
  let total = encoded.reduce((sum, item) => sum + item.length, 0);
  for (const field of fields) {
    if (!isValidByteCoordinate(field.record) || !isValidByteCoordinate(field.dataset)) throw new IptcSerializationError("INVALID_VALUE", "IPTC record and dataset numbers must be in the range 0 through 255.");
    const key = (field.record << 8) | field.dataset;
    const count = (occurrences.get(key) ?? 0) + 1;
    occurrences.set(key, count);
    const definition = datasetDefinition(field.record, field.dataset);
    const reservedCoordinate = field.record === 0 || field.dataset === 0;
    if (reservedCoordinate && (definition !== undefined || policy !== "preserve-raw" || !(field.value instanceof Uint8Array))) throw new IptcSerializationError("INVALID_VALUE", "Reserved IPTC record or dataset coordinates may only be retained as unknown raw bytes.");
    if (count > 1 && definition?.repeatable === false && policy === "reject") throw new IptcSerializationError("NON_REPEATABLE", `IPTC ${field.record}:${field.dataset} is not repeatable.`);
    const encoding = field.encoding ?? (definition?.format === "binary" || definition?.format === "coded-character-set" ? "binary" : options.characterSet === "utf-8" ? "utf-8" : "latin1");
    const bytes = encodeIptcValue(field.value, encoding);
    if (definition?.minLength !== undefined && bytes.length < definition.minLength && policy === "reject") throw new IptcSerializationError("INVALID_VALUE", `IPTC ${field.record}:${field.dataset} is shorter than its minimum byte length.`);
    if (definition?.maxLength !== null && definition?.maxLength !== undefined && bytes.length > definition.maxLength && policy === "reject") throw new IptcSerializationError("INVALID_VALUE", `IPTC ${field.record}:${field.dataset} exceeds its maximum byte length.`);
    const length = encodeIimLength(bytes.length, allowExtended);
    const datasetBytes = new Uint8Array(3 + length.length + bytes.length);
    datasetBytes.set(Uint8Array.of(0x1c, field.record, field.dataset), 0); datasetBytes.set(length, 3); datasetBytes.set(bytes, 3 + length.length);
    total += datasetBytes.length;
    if (total > maxOutputBytes || !Number.isSafeInteger(total)) throw new IptcSerializationError("LIMIT_EXCEEDED", `Serialized IPTC exceeds ${maxOutputBytes} bytes.`);
    encoded.push(datasetBytes);
  }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const item of encoded) { result.set(item, offset); offset += item.length; }
  return result;
}

/** Wrap one or more raw IIM payloads as Photoshop 3.0 image resources. */
export function serializePhotoshopIptcResources(resources: Uint8Array | readonly Uint8Array[], options: PhotoshopIptcResourceOptions = {}): Uint8Array {
  const values = resources instanceof Uint8Array ? [resources] : resources;
  const maxOutputBytes = checkedIptcLimit(options.maxOutputBytes, DEFAULT_IIM_OUTPUT_BYTES, "maxOutputBytes");
  const name = options.resourceName?.slice() ?? new Uint8Array(0);
  if (name.length > 255) throw new IptcSerializationError("INVALID_VALUE", "Photoshop resource names are limited to 255 bytes.");
  const header = new TextEncoder().encode("Photoshop 3.0\0");
  const chunks: Uint8Array[] = [header];
  let total = header.length;
  for (const resource of values) {
    if (resource.length > 0xffffffff) throw new IptcSerializationError("LIMIT_EXCEEDED", "Photoshop resource length does not fit its 32-bit wire representation.");
    const paddedName = (1 + name.length + 1) & ~1;
    const size = 4 + 2 + paddedName + 4 + resource.length + (resource.length & 1);
    total += size;
    if (total > maxOutputBytes || !Number.isSafeInteger(total)) throw new IptcSerializationError("LIMIT_EXCEEDED", `Photoshop IPTC resources exceed ${maxOutputBytes} bytes.`);
    const chunk = new Uint8Array(size);
    chunk.set(Uint8Array.of(0x38, 0x42, 0x49, 0x4d, 0x04, 0x04), 0); chunk[6] = name.length; chunk.set(name, 7);
    const sizeOffset = 6 + paddedName; new DataView(chunk.buffer).setUint32(sizeOffset, resource.length, false); chunk.set(resource, sizeOffset + 4);
    chunks.push(chunk);
  }
  const result = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}

function xmpLexicals(value: XmpValue): readonly string[] {
  if (value.kind === "literal") return [value.lexicalValue];
  if (value.kind === "array") return value.items.flatMap((item) => xmpLexicals(item));
  return [];
}

function equalValues(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function mappedProperty(property: XmpProperty): (typeof IPTC_TECHREFERENCE_PROPERTIES)[number] | undefined {
  return IPTC_TECHREFERENCE_PROPERTIES.find((definition) => definition.namespaceUri === property.name.namespaceUri && definition.localName === property.name.localName);
}

function cloneLiteral(value: XmpLiteralValue, lexicalValue: string): XmpLiteralValue {
  return { ...value, lexicalValue, value: lexicalValue };
}

function replaceXmpValue(value: XmpValue, lexicals: readonly string[], altLanguage: boolean): XmpValue {
  if (value.kind === "literal") {
    if (lexicals.length > 1) return { kind: "array", container: altLanguage ? "Alt" : "Seq", items: lexicals.map((lexicalValue) => cloneLiteral(value, lexicalValue)), qualifiers: value.qualifiers };
    return cloneLiteral(value, lexicals[0] ?? value.lexicalValue);
  }
  if (value.kind === "array") {
    const items = lexicals.map((lexicalValue, index) => {
      const previous = value.items[index];
      return previous?.kind === "literal" ? cloneLiteral(previous, lexicalValue) : { kind: "literal", lexicalValue, value: lexicalValue, datatypeUri: null, language: value.container === "Alt" ? "x-default" : null, qualifiers: [] } satisfies XmpLiteralValue;
    });
    return { ...value, items };
  }
  return { kind: "literal", lexicalValue: lexicals[0] ?? "", value: lexicals[0] ?? "", datatypeUri: null, language: null, qualifiers: [] } satisfies XmpLiteralValue;
}

function withXmpProperty(document: XmpRdfDocument, property: XmpProperty): XmpRdfDocument {
  const descriptions = document.descriptions.length === 0
    ? [{ subject: "", typeName: null, properties: [property], sourceStart: 0, sourceEnd: 0 } satisfies XmpDescription]
    : document.descriptions.map((description, index) => index === 0 ? { ...description, properties: [...description.properties, property] } : description);
  return { ...document, descriptions, properties: descriptions.flatMap((description) => description.properties) };
}

function xmpDocumentWithReplacements(document: XmpRdfDocument, iim: readonly IptcIimFieldInput[], policy: IptcSynchronizationPolicy): XmpRdfDocument {
  const valuesByDefinition = new Map<string, string[]>();
  for (const field of iim) {
    const catalog = datasetDefinition(field.record, field.dataset);
    const xmp = catalog?.mappings.xmp[0];
    if (xmp === undefined) continue;
    const bytes = field.value instanceof Uint8Array ? field.value : encodeIptcValue(field.value, field.encoding ?? "utf-8");
    const value = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    const definition = IPTC_TECHREFERENCE_PROPERTIES.find((candidate) => candidate.namespaceUri === xmp.namespaceUri && candidate.localName === xmp.localName);
    if (definition !== undefined) valuesByDefinition.set(definition.id, [...(valuesByDefinition.get(definition.id) ?? []), value]);
  }
  if (policy !== "prefer-iim") return document;
  const replaced = new Set<string>();
  const descriptions = document.descriptions.map((description) => ({ ...description, properties: description.properties.map((property) => {
    const definition = mappedProperty(property); const values = definition === undefined ? undefined : valuesByDefinition.get(definition.id);
    if (definition === undefined || values === undefined) return property;
    replaced.add(definition.id); return { ...property, value: replaceXmpValue(property.value, values, definition.dataformat === "AltLang"), qualifiers: property.value.qualifiers };
  }) }));
  let result: XmpRdfDocument = { ...document, descriptions, properties: descriptions.flatMap((description) => description.properties) };
  for (const definition of IPTC_TECHREFERENCE_PROPERTIES) {
    const values = valuesByDefinition.get(definition.id); const xmp = definition.mappings.xmp;
    if (values === undefined || replaced.has(definition.id)) continue;
    const name: XmpQualifiedName = { namespaceUri: xmp.namespaceUri, localName: xmp.localName, prefix: xmp.prefix, qualifiedName: `${xmp.prefix}:${xmp.localName}` };
    const value: XmpValue = definition.dataformat === "AltLang" ? { kind: "array", container: "Alt", items: values.map((lexicalValue) => ({ kind: "literal", lexicalValue, value: lexicalValue, datatypeUri: null, language: "x-default", qualifiers: [] } satisfies XmpLiteralValue)), qualifiers: [] } : values.length > 1 ? { kind: "array", container: "Seq", items: values.map((lexicalValue) => ({ kind: "literal", lexicalValue, value: lexicalValue, datatypeUri: null, language: null, qualifiers: [] } satisfies XmpLiteralValue)), qualifiers: [] } : { kind: "literal", lexicalValue: values[0] ?? "", value: values[0] ?? "", datatypeUri: null, language: null, qualifiers: [] } satisfies XmpLiteralValue;
    result = withXmpProperty(result, { name, value, qualifiers: [], order: result.properties.length, sourceStart: 0, sourceEnd: 0, aliasOf: null });
  }
  return result;
}

function iimWithXmp(document: XmpRdfDocument, iim: readonly IptcIimFieldInput[], policy: IptcSynchronizationPolicy): readonly IptcIimFieldInput[] {
  if (policy !== "prefer-xmp") return iim;
  const values = new Map<string, string[]>();
  for (const property of document.properties) {
    const definition = mappedProperty(property); if (definition?.iimId === null || definition?.iimId === undefined) continue;
    values.set(definition.id, [...(values.get(definition.id) ?? []), ...xmpLexicals(property.value)]);
  }
  const output: IptcIimFieldInput[] = [];
  const replaced = new Set<string>();
  for (const field of iim) {
    const definition = datasetDefinition(field.record, field.dataset); const mapping = definition?.mappings.xmp[0]; const mappedDefinition = mapping === undefined ? undefined : IPTC_TECHREFERENCE_PROPERTIES.find((candidate) => candidate.namespaceUri === mapping.namespaceUri && candidate.localName === mapping.localName); const replacement = mappedDefinition === undefined ? undefined : values.get(mappedDefinition.id);
    if (definition === undefined || replacement === undefined || replacement.length === 0) { output.push(field); continue; }
    if (mappedDefinition !== undefined && replaced.has(mappedDefinition.id)) continue;
    const valuesToWrite = definition.repeatable ? replacement : [replacement[0] ?? ""];
    output.push(...valuesToWrite.map((value) => ({ ...field, value, encoding: "utf-8" as const }))); if (mappedDefinition !== undefined) replaced.add(mappedDefinition.id);
  }
  for (const definition of IPTC_TECHREFERENCE_PROPERTIES) {
    if (replaced.has(definition.id) || definition.iimId === null) continue;
    const replacement = values.get(definition.id); if (replacement === undefined || replacement.length === 0) continue;
    const [record, dataset] = definition.iimId.split(":").map(Number); if (record === undefined || dataset === undefined) continue;
    const valuesToWrite = definition.repeatable ? replacement : [replacement[0] ?? ""];
    output.push(...valuesToWrite.map((value) => ({ record, dataset, value, encoding: "utf-8" as const })));
  }
  return output;
}

/** Synchronize only explicitly mapped IPTC/XMP values. Conflicts are preserved by default and are never silently discarded. */
export function synchronizeIptcXmp(input: IptcXmpSynchronizationInput, options: IptcXmpSynchronizationOptions = {}): IptcXmpSynchronizationResult {
  const policy = options.policy ?? "preserve-all";
  const document = input.xmp === null || input.xmp === undefined ? null : documentFor(input.xmp);
  const iim = input.iim ?? [];
  const conflicts: IptcSynchronizationConflict[] = [];
  if (document !== null) {
    for (const definition of IPTC_TECHREFERENCE_PROPERTIES) {
      if (definition.iimId === null) continue;
      const [record, dataset] = definition.iimId.split(":").map(Number); if (record === undefined || dataset === undefined) continue;
      const iimValues = iim.filter((field) => field.record === record && field.dataset === dataset).map((field) => field.value instanceof Uint8Array ? new TextDecoder("utf-8", { fatal: false }).decode(field.value) : field.value);
      const xmpValues = document.properties.filter((property) => property.name.namespaceUri === definition.namespaceUri && property.name.localName === definition.localName).flatMap((property) => xmpLexicals(property.value));
      if (iimValues.length > 0 && xmpValues.length > 0 && !equalValues(iimValues, xmpValues)) conflicts.push({ propertyId: definition.id, xmpIdentity: `${definition.namespaceUri}${definition.localName}`, iimIdentity: `${record}:${dataset}`, iimValues, xmpValues });
    }
  }
  if (policy === "reject-conflict" && conflicts.length > 0) throw new IptcSynchronizationError(conflicts);
  const outputIimFields = iimWithXmp(document ?? { namespaces: [], descriptions: [], properties: [], sourceLength: 0 }, iim, policy);
  const outputDocument = document === null ? null : xmpDocumentWithReplacements(document, iim, policy);
  return { policy, iim: input.iim === undefined && outputIimFields.length === 0 ? null : serializeIptcIim(outputIimFields, options), xmp: outputDocument === null ? null : serializeStructuredXmp(outputDocument, options), conflicts };
}
