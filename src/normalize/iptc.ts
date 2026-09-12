import { IPTC_TECHREFERENCE_PROPERTIES, IPTC_TECHREFERENCE_SOURCE, IPTC_TECHREFERENCE_STRUCTURES, IPTC_TECHREFERENCE_VERSION_DELTA } from "../generated/iptc-pmd.js";
import type {
  IptcData,
  IptcSemanticCandidate,
  IptcSemanticConflict,
  IptcSemanticData,
  IptcSemanticField,
  IptcSemanticSelectionPolicy,
  IptcSemanticSource,
  IptcSemanticValue,
  MetadataBlock,
  MetadataField,
  MetadataResult,
  MetadataWarning,
  SecurityLimits,
  Sensitivity,
  XmpPacketProvenance,
  XmpData,
} from "../types.js";
import { parseStructuredXmpDetailed, type XmpProperty, type XmpValue } from "../metadata/xmp.js";

const NAMESPACE_BY_PREFIX: Readonly<Record<string, string>> = {
  Iptc4xmpCore: "http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/",
  Iptc4xmpExt: "http://iptc.org/std/Iptc4xmpExt/2008-02-29/",
  photoshop: "http://ns.adobe.com/photoshop/1.0/",
  dc: "http://purl.org/dc/elements/1.1/",
  plus: "http://ns.useplus.org/ldf/xmp/1.0/",
  xmpRights: "http://ns.adobe.com/xap/1.0/rights/",
  xmp: "http://ns.adobe.com/xap/1.0/",
  exif: "http://ns.adobe.com/exif/1.0/",
};

type Definition = (typeof IPTC_TECHREFERENCE_PROPERTIES)[number];

function splitXmpId(value: string | null): { readonly prefix: string; readonly localName: string; readonly namespaceUri: string } | null {
  if (value === null) return null;
  const separator = value.indexOf(":");
  if (separator <= 0 || separator === value.length - 1) return null;
  const prefix = value.slice(0, separator);
  const localName = value.slice(separator + 1);
  const namespaceUri = NAMESPACE_BY_PREFIX[prefix];
  return namespaceUri === undefined ? null : { prefix, localName, namespaceUri };
}

function definitionMatchesProperty(definition: Definition, property: XmpProperty): boolean {
  const parsed = splitXmpId(definition.xmpId);
  if (parsed === null) return false;
  const name = property.aliasOf ?? property.name;
  return name.namespaceUri === parsed.namespaceUri && name.localName === parsed.localName;
}

function sensitivityFor(definition: Definition): Sensitivity {
  if (definition.topic === "rights" || definition.topic === "licensing" || definition.topic === "person" || definition.topic === "location") return "high";
  if (definition.topic === "imgreg" || definition.topic === "admin" || definition.topic === "othings") return "moderate";
  return "moderate";
}

function stableJson(value: unknown): string {
  try {
    const encoded = JSON.stringify(value);
    return typeof encoded === "string" ? encoded : "";
  } catch { return ""; }
}

function xmpValueToSemantic(value: XmpValue, depth: number, limit: number): IptcSemanticValue {
  if (depth > limit) return { kind: "truncated", reason: "maxIptcStructureDepth" };
  if (value.kind === "literal") {
    return {
      kind: "literal",
      lexicalValue: value.lexicalValue,
      value: value.value,
      datatypeUri: value.datatypeUri,
      language: value.language,
      qualifiers: value.qualifiers.map((item) => ({ name: item.name, value: xmpValueToSemantic(item.value, depth + 1, limit), order: item.order })),
    };
  }
  if (value.kind === "array") {
    return {
      kind: "array",
      container: value.container,
      items: value.items.map((item) => xmpValueToSemantic(item, depth + 1, limit)),
      qualifiers: value.qualifiers.map((item) => ({ name: item.name, value: xmpValueToSemantic(item.value, depth + 1, limit), order: item.order })),
    };
  }
  return {
    kind: value.kind,
    resourceUri: value.resourceUri,
    nodeId: value.nodeId,
    typeName: value.typeName,
    properties: value.properties.map((item) => ({ name: item.name, value: xmpValueToSemantic(item.value, depth + 1, limit), qualifiers: item.qualifiers.map((qualifier) => ({ name: qualifier.name, value: xmpValueToSemantic(qualifier.value, depth + 1, limit), order: qualifier.order })), order: item.order })),
    qualifiers: value.qualifiers.map((item) => ({ name: item.name, value: xmpValueToSemantic(item.value, depth + 1, limit), order: item.order })),
  };
}

function record(value: unknown): Readonly<Record<string, unknown>> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Uint8Array) ? value as Readonly<Record<string, unknown>> : null;
}

function lexicalValue(value: IptcSemanticValue | null): string | null {
  if (typeof value === "string") return value;
  const item = record(value);
  return typeof item?.lexicalValue === "string" ? item.lexicalValue : null;
}

function isAsciiDigits(value: string): boolean {
  return /^\d+$/u.test(value);
}

function isIsoDateTime(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/.exec(value);
  if (match === null) return false;
  const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]);
  const days = [31, (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > (days[month - 1] ?? 0)) return false;
  if (match[4] === undefined) return true;
  return Number(match[4]) <= 23 && Number(match[5]) <= 59 && Number(match[6]) <= 59;
}

function isAbsoluteUri(value: string): boolean {
  if (value.length === 0 || Array.from(value).some((character) => (character.codePointAt(0) ?? 0) <= 0x20)) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol.length > 1 && !parsed.protocol.startsWith(".");
  } catch { return false; }
}

function isFiniteNumericLexical(value: string): boolean {
  if (value.trim().length === 0) return false;
  const fraction = value.split("/");
  if (fraction.length === 2) return Number.isFinite(Number(fraction[0])) && Number.isFinite(Number(fraction[1])) && Number(fraction[1]) !== 0;
  const compass = value.at(-1);
  if (compass === "N" || compass === "S" || compass === "E" || compass === "W") {
    const parts = value.slice(0, -1).split(",");
    return parts.length === 2 && parts.every((part) => Number.isFinite(Number(part)));
  }
  return Number.isFinite(Number(value));
}

function structuredNodes(value: IptcSemanticValue | null): readonly Readonly<Record<string, unknown>>[] {
  const item = record(value);
  if (item?.kind === "array" && Array.isArray(item.items)) return item.items.flatMap((child) => structuredNodes(child as IptcSemanticValue));
  return item !== null && (item.kind === "resource" || item.kind === "typed-resource") ? [item] : [];
}

function validateStructuredValue(definition: Definition, value: IptcSemanticValue | null, depth = 0): readonly string[] {
  if (depth > 8) return ["Structured resource exceeds the IPTC validation depth."];
  const diagnostics: string[] = [];
  const item = record(value);
  if (definition.dataformat === "AltLang") {
    if (item?.kind !== "array" || item.container !== "Alt" || !Array.isArray(item.items) || item.items.length === 0) return ["AltLang must be a non-empty rdf:Alt language-alternative array."];
    for (const child of item.items) {
      const literal = record(child);
      if (literal?.kind !== "literal" || typeof literal.lexicalValue !== "string" || typeof literal.language !== "string" || literal.language.length === 0) diagnostics.push("AltLang members must retain a non-empty language tag and lexical value.");
    }
    return diagnostics;
  }
  const structureId = definition.structuredResource?.id ?? definition.dataformat;
  const structure = typeof structureId === "string" ? IPTC_TECHREFERENCE_STRUCTURES[structureId as keyof typeof IPTC_TECHREFERENCE_STRUCTURES] : undefined;
  const nodes = structuredNodes(value);
  if (nodes.length === 0) return ["Structured IPTC value must be an RDF resource or an array of RDF resources."];
  if (structure === undefined) return diagnostics;
  const expected = structure.members.filter((member) => member.namespaceUri !== null);
  for (const node of nodes) {
    const members = Array.isArray(node.properties) ? node.properties.map(record).filter((member): member is Readonly<Record<string, unknown>> => member !== null) : [];
    const counts = new Map<string, number>();
    for (const member of members) {
      const name = record(member.name);
      const namespaceUri = name?.namespaceUri;
      const localName = name?.localName;
      const expectedMember = expected.find((candidate) => candidate.namespaceUri === namespaceUri && candidate.localName === localName);
      if (expectedMember === undefined) {
        if (!structure.members.some((candidate) => candidate.id === "$anypmdproperty")) diagnostics.push(`Unexpected member ${typeof namespaceUri === "string" ? namespaceUri : "unresolved"}${typeof localName === "string" ? localName : ""} in ${structureId}.`);
        continue;
      }
      const key = expectedMember.id;
      counts.set(key, (counts.get(key) ?? 0) + 1);
      if (expectedMember.occurrence !== "multi" && (counts.get(key) ?? 0) > 1) diagnostics.push(`${structureId}.${key} is non-repeatable.`);
      const childValue = member.value as IptcSemanticValue | null;
      if (expectedMember.datatype === "struct") diagnostics.push(...validateStructuredValue(expectedMember as unknown as Definition, childValue, depth + 1));
      if ((String(expectedMember.dataformat) === "uri" || String(expectedMember.dataformat) === "url") && lexicalValue(childValue) !== null && !isAbsoluteUri(lexicalValue(childValue) as string)) diagnostics.push(`${structureId}.${key} must be an absolute URI.`);
      if (expectedMember.datatype === "number" && lexicalValue(childValue) !== null && !isFiniteNumericLexical(lexicalValue(childValue) as string)) diagnostics.push(`${structureId}.${key} must be finite numeric text.`);
    }
    for (const expectedMember of expected) {
      const required = (expectedMember as unknown as { readonly required: boolean }).required;
      if (required && !counts.has(expectedMember.id)) diagnostics.push(`${structureId}.${expectedMember.id} is required.`);
    }
  }
  return diagnostics;
}

function validationFor(definition: Definition, value: IptcSemanticValue | null, raw: IptcSemanticValue | null): { readonly state: IptcSemanticCandidate["validation"]; readonly diagnostics: readonly string[] } {
  const diagnostics: string[] = [];
  if (raw instanceof Uint8Array && definition.iimMaxBytes !== null && raw.byteLength > definition.iimMaxBytes) diagnostics.push(`Value exceeds official maximum of ${definition.iimMaxBytes} bytes.`);
  const lexical = lexicalValue(value);
  if ((String(definition.dataformat) === "uri" || String(definition.dataformat) === "url") && lexical !== null && !isAbsoluteUri(lexical)) diagnostics.push("Value is not a valid absolute URI.");
  if (definition.dataformat === "date-time" && lexical !== null && !(isIsoDateTime(lexical) || (lexical.length === 8 && isAsciiDigits(lexical)))) diagnostics.push("Value is not an actual calendar date or date-time.");
  if (definition.datatype === "number" && lexical !== null && !isFiniteNumericLexical(lexical)) diagnostics.push("Value is not finite numeric text.");
  if (definition.id === "sceneCodes" && lexical !== null && !(lexical.length === 6 && isAsciiDigits(lexical))) diagnostics.push("IPTC Scene Code must contain exactly six digits.");
  if (definition.datatype === "struct" && !(raw instanceof Uint8Array)) diagnostics.push(...validateStructuredValue(definition, value));
  return { state: diagnostics.length === 0 ? "valid" : "invalid", diagnostics };
}

function warningForCandidate(candidate: IptcSemanticCandidate): MetadataWarning | null {
  if (candidate.validation === "valid") return null;
  return { code: "INVALID_VALUE", message: `${candidate.mapping}: ${candidate.diagnostics.join(" ") || "value could not be validated"}`, severity: "warning", ...(candidate.source.offset === null || candidate.source.offset === undefined ? {} : { offset: candidate.source.offset }), ...(candidate.source.length === null || candidate.source.length === undefined ? {} : { length: candidate.source.length }) };
}

function iimCandidates(fields: readonly MetadataField[], definition: Definition, max: number): IptcSemanticCandidate[] {
  const ids = (definition.iimId?.match(/\d+\s*:\s*\d+/g) ?? []).map((id) => {
    const [record, dataset] = id.split(":").map((item) => Number(item));
    return record === undefined || dataset === undefined ? -1 : (record << 8) | dataset;
  });
  const candidates: IptcSemanticCandidate[] = [];
  for (const field of fields) {
    if (!ids.includes(field.tag) || candidates.length >= max) continue;
    const raw: IptcSemanticValue = field.raw as unknown as IptcSemanticValue;
    const value: IptcSemanticValue = field.value as unknown as IptcSemanticValue;
    const validation = validationFor(definition, value, raw);
    const source: IptcSemanticSource = {
      kind: "iim", family: "IPTC-IIM", fieldId: field.id, record: (field.tag >>> 8) & 0xff, dataset: field.tag & 0xff, occurrence: field.occurrence ?? 0,
      ...(field.source?.blockId === undefined ? {} : { blockId: field.source.blockId }), offset: field.source?.valueOffset ?? null, length: field.source?.valueLength ?? (field.raw instanceof Uint8Array ? field.raw.byteLength : null),
    };
    candidates.push({ value, raw, lexicalValue: typeof value === "string" ? value : null, source, validation: validation.state, mapping: `IPTC-IIM ${field.tag >>> 8}:${field.tag & 0xff} -> ${definition.id}`, diagnostics: validation.diagnostics });
  }
  return candidates;
}

interface ParsedXmpProperty {
  readonly property: XmpProperty;
  readonly packetIndex: number;
  readonly provenance?: XmpPacketProvenance;
}

function parseXmpProperties(xmp: XmpData | null, limits: SecurityLimits): { readonly properties: readonly ParsedXmpProperty[]; readonly diagnostics: readonly MetadataWarning[] } {
  if (xmp === null) return { properties: [], diagnostics: [] };
  const properties: ParsedXmpProperty[] = [];
  const diagnostics: MetadataWarning[] = [];
  const packetCount = Math.min(xmp.packets.length, limits.maxXmpPackets);
  for (let packetIndex = 0; packetIndex < packetCount; packetIndex += 1) {
    const packet = xmp.packets[packetIndex];
    if (packet === undefined) continue;
    const parsed = parseStructuredXmpDetailed(packet, { maxInputBytes: limits.maxStringBytes, maxElements: limits.maxXmpNodes, maxProperties: limits.maxXmpProperties, maxDepth: limits.maxXmpDepth, maxAttributes: limits.maxXmpAttributes, maxNamespaces: limits.maxXmpNamespaces, maxTextBytes: limits.maxXmpTextBytes, maxArrayItems: limits.maxXmpArrayItems, maxQualifiers: limits.maxXmpQualifiers, maxOutputBytes: limits.maxXmpOutputBytes, maxPackets: 1 });
    for (const diagnostic of parsed.diagnostics) diagnostics.push({ code: diagnostic.code === "LIMIT_EXCEEDED" ? "LIMIT_EXCEEDED" : "MALFORMED_IPTC", message: diagnostic.message, severity: diagnostic.severity, ...(diagnostic.offset === undefined ? {} : { offset: diagnostic.offset }), ...(diagnostic.length === undefined ? {} : { length: diagnostic.length }) });
    const provenance = xmp.packetProvenance?.[packetIndex];
    for (const property of parsed.value?.rdf?.properties ?? []) {
      if (properties.length >= limits.maxIptcCandidates) break;
      properties.push({ property, packetIndex, ...(provenance === undefined ? {} : { provenance }) });
    }
  }
  if (xmp.packets.length > packetCount) diagnostics.push({ code: "LIMIT_EXCEEDED", message: `IPTC semantic mapping examined ${packetCount} of ${xmp.packets.length} XMP packets.`, severity: "warning" });
  return { properties, diagnostics };
}

function xmpCandidates(properties: readonly ParsedXmpProperty[], definition: Definition, limits: SecurityLimits): IptcSemanticCandidate[] {
  const candidates: IptcSemanticCandidate[] = [];
  for (const item of properties) {
    const { property, packetIndex, provenance } = item;
    if (!definitionMatchesProperty(definition, property) || candidates.length >= limits.maxIptcCandidates) continue;
    const semanticValue = xmpValueToSemantic(property.value, 0, limits.maxIptcStructureDepth);
    const validation = validationFor(definition, semanticValue, semanticValue);
    const source: IptcSemanticSource = { kind: "xmp", family: "XMP", fieldId: `XMP:${property.name.namespaceUri}:${property.name.localName}:${packetIndex}:${property.order}`, namespaceUri: property.name.namespaceUri, localName: property.name.localName, qualifiedName: property.name.qualifiedName, packetIndex, packetId: provenance?.id ?? null, blockId: provenance?.blockIds[0] ?? null, offset: provenance?.offset ?? null, length: provenance?.length ?? null };
    candidates.push({ value: semanticValue, raw: semanticValue, lexicalValue: property.value.kind === "literal" ? property.value.lexicalValue : null, source, validation: validation.state, mapping: `XMP ${property.name.namespaceUri}${property.name.localName} -> ${definition.id}`, diagnostics: validation.diagnostics });
  }
  return candidates;
}

function unknownCandidates(iptc: IptcData | null, properties: readonly ParsedXmpProperty[], limits: SecurityLimits): IptcSemanticCandidate[] {
  const unknown: IptcSemanticCandidate[] = [];
  const knownTags = new Set<number>();
  for (const definition of IPTC_TECHREFERENCE_PROPERTIES) for (const id of definition.iimId?.match(/\d+\s*:\s*\d+/g) ?? []) {
    const [record, dataset] = id.split(":").map(Number);
    if (record !== undefined && dataset !== undefined) knownTags.add((record << 8) | dataset);
  }
  for (const field of iptc?.fields ?? []) {
    if (knownTags.has(field.tag) || unknown.length >= limits.maxIptcCandidates) continue;
    unknown.push({ value: field.value as unknown as IptcSemanticValue, raw: field.raw as unknown as IptcSemanticValue, lexicalValue: typeof field.value === "string" ? field.value : null, source: { kind: "iim", family: "IPTC-IIM", fieldId: field.id, record: field.tag >>> 8, dataset: field.tag & 0xff, occurrence: field.occurrence ?? 0, ...(field.source?.blockId === undefined ? {} : { blockId: field.source.blockId }), offset: field.source?.valueOffset ?? null, length: field.source?.valueLength ?? (field.raw instanceof Uint8Array ? field.raw.byteLength : null) }, validation: "unknown", mapping: "IPTC-IIM unknown dataset retained as raw", diagnostics: [] });
  }
  for (const item of properties) {
    const { property, packetIndex, provenance } = item;
    if (IPTC_TECHREFERENCE_PROPERTIES.some((definition) => definitionMatchesProperty(definition, property)) || unknown.length >= limits.maxIptcCandidates) continue;
    const value = xmpValueToSemantic(property.value, 0, limits.maxIptcStructureDepth);
    unknown.push({ value, raw: value, lexicalValue: property.value.kind === "literal" ? property.value.lexicalValue : null, source: { kind: "xmp", family: "XMP", fieldId: `XMP:${property.name.namespaceUri}:${property.name.localName}:${packetIndex}:${property.order}`, namespaceUri: property.name.namespaceUri, localName: property.name.localName, qualifiedName: property.name.qualifiedName, packetIndex, packetId: provenance?.id ?? null, blockId: provenance?.blockIds[0] ?? null, offset: provenance?.offset ?? null, length: provenance?.length ?? null }, validation: "unknown", mapping: "XMP unknown property retained by URI/local name", diagnostics: [] });
  }
  return unknown;
}

function fieldConflicts(id: string, candidates: readonly IptcSemanticCandidate[]): readonly IptcSemanticConflict[] {
  if (candidates.length < 2) return [];
  const unique = new Set(candidates.map((candidate) => stableJson(candidate.value)));
  return [{ fieldId: id, candidates, reason: unique.size === 1 ? "duplicate-values" : candidates.some((candidate) => candidate.validation !== "valid") ? "invalid-value" : "different-values" }];
}

function selectedValue(candidates: readonly IptcSemanticCandidate[], policy: IptcSemanticSelectionPolicy): IptcSemanticValue | null {
  if (candidates.length === 0) return null;
  if (policy === "last") return candidates.at(-1)?.value ?? null;
  if (policy === "first") return candidates[0]?.value ?? null;
  return candidates.length === 1 ? candidates[0]?.value ?? null : null;
}

export interface IptcSemanticOptions {
  readonly policy?: IptcSemanticSelectionPolicy;
}

/** Build the lossless IPTC semantic view from official vocabulary, IIM fields,
 * and the S05 URI-aware RDF model. */
export function deriveIptcSemantic(
  iptc: IptcData | null,
  xmp: XmpData | null,
  blocks: readonly MetadataBlock[],
  limits: SecurityLimits,
  options: IptcSemanticOptions = {},
): IptcSemanticData {
  const policy = options.policy ?? "preserve-all";
  const fields: IptcSemanticField[] = [];
  const conflicts: IptcSemanticConflict[] = [];
  const diagnostics: MetadataWarning[] = [...(iptc?.diagnostics ?? [])];
  const parsedXmp = parseXmpProperties(xmp, limits);
  diagnostics.push(...parsedXmp.diagnostics);
  const unknown = unknownCandidates(iptc, parsedXmp.properties, limits);
  let candidatesUsed = 0;
  let estimatedOutputBytes = 0;
  let outputTruncated = false;
  for (const definition of IPTC_TECHREFERENCE_PROPERTIES) {
    const iim = iimCandidates(iptc?.fields ?? [], definition, Math.max(0, limits.maxIptcCandidates - candidatesUsed));
    candidatesUsed += iim.length;
    const xmpCandidatesResult = xmpCandidates(parsedXmp.properties, definition, limits);
    const candidates = [...iim, ...xmpCandidatesResult].slice(0, limits.maxIptcCandidates);
    candidatesUsed += xmpCandidatesResult.length;
    const fieldConflictsResult = fieldConflicts(definition.id, candidates);
    conflicts.push(...fieldConflictsResult);
    const candidateWarnings = candidates.map(warningForCandidate).filter((warning): warning is MetadataWarning => warning !== null);
    diagnostics.push(...candidateWarnings);
    const semanticField: IptcSemanticField = { id: `iptc:${definition.id}`, name: definition.name, label: definition.label, schema: definition.schema, datatype: definition.datatype, dataformat: definition.dataformat, occurrence: definition.occurrence, sensitivity: candidates.length === 0 ? "none" : sensitivityFor(definition), value: selectedValue(candidates, policy), candidates, conflicts: fieldConflictsResult, description: definition.description, sourceStandard: IPTC_TECHREFERENCE_SOURCE.standard, sourceEdition: IPTC_TECHREFERENCE_SOURCE.edition };
    const fieldBytes = new TextEncoder().encode(stableJson(semanticField)).byteLength;
    if (!Number.isSafeInteger(estimatedOutputBytes + fieldBytes) || estimatedOutputBytes + fieldBytes > limits.maxIptcOutputBytes) {
      diagnostics.push({ code: "LIMIT_EXCEEDED", message: `IPTC semantic output exceeds ${limits.maxIptcOutputBytes} bytes; remaining fields were not materialized.`, severity: "warning" });
      outputTruncated = true;
      break;
    }
    estimatedOutputBytes += fieldBytes;
    fields.push(semanticField);
    if (candidatesUsed >= limits.maxIptcCandidates) {
      diagnostics.push({ code: "LIMIT_EXCEEDED", message: `IPTC semantic candidate limit ${limits.maxIptcCandidates} reached.`, severity: "warning" });
      break;
    }
  }
  const complete = !outputTruncated && diagnostics.every((warning) => warning.severity !== "error") && candidatesUsed <= limits.maxIptcCandidates;
  return { standard: IPTC_TECHREFERENCE_SOURCE.standard, edition: IPTC_TECHREFERENCE_SOURCE.edition, source: { url: IPTC_TECHREFERENCE_SOURCE.url, sha256: IPTC_TECHREFERENCE_SOURCE.sha256, license: IPTC_TECHREFERENCE_SOURCE.license, previousEdition: IPTC_TECHREFERENCE_SOURCE.previousEdition, previousSha256: IPTC_TECHREFERENCE_SOURCE.previousSha256, addedInCurrentEdition: IPTC_TECHREFERENCE_VERSION_DELTA.addedIn2025_1, removedSincePreviousEdition: IPTC_TECHREFERENCE_VERSION_DELTA.removedSince2023_1 }, fields, conflicts, unknown, diagnostics: diagnostics.slice(0, limits.maxWarnings), selectionPolicy: policy, complete };
}

/** Attach S06 semantics without changing the legacy flattened views. */
export function attachIptcSemantic(result: MetadataResult | Omit<MetadataResult, "completeness" | "blocks" | "coverage">, limits: SecurityLimits, options: IptcSemanticOptions = {}): MetadataResult | Omit<MetadataResult, "completeness" | "blocks" | "coverage"> {
  if (result.iptc === null && result.xmp === null) return result;
  const blocks = "blocks" in result ? result.blocks : [];
  const semantic = deriveIptcSemantic(result.iptc, result.xmp, blocks, limits, options);
  const iptc = result.iptc === null ? null : { ...result.iptc, semantic };
  return { ...result, iptc, iptcSemantic: semantic };
}
