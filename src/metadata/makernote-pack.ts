import type {
  ExifDataType,
  MakerNoteDetection,
  MakerNoteField,
  MakerNotePlugin,
  MakerNotePluginIdentity,
  MakerNotePluginInput,
  MakerNotePluginResult,
  MakerNoteOpaqueRange,
  MakerNoteProvenance,
  MakerNoteSourceReference,
  MakerNoteStatus,
  MetadataValue,
  RationalValue,
  Sensitivity,
} from "../types.js";

type PackDecoder = "text" | "number" | "rational" | "bytes";

export interface MakerNotePackTag extends Omit<MakerNoteTagDefinitionLike, "type"> {
  readonly type: ExifDataType;
  readonly decoder: PackDecoder;
}

interface MakerNoteTagDefinitionLike {
  readonly id: string;
  readonly tag: number;
  readonly name: string;
  readonly label: string;
  readonly description: string;
  readonly unit?: string;
  readonly enumValues?: Readonly<Record<string, string>>;
  readonly repeatable: boolean;
  readonly applicableModels?: readonly string[];
  readonly applicableVersions?: readonly string[];
  readonly sensitivity: Sensitivity;
  readonly validation?: string;
  readonly rawValueBehavior: "retain" | "opaque" | "omit";
  readonly source?: string;
}

export interface BoundedIfdLayout {
  readonly byteOrder: "little-endian" | "big-endian";
  readonly countOffset: number;
  readonly countSize?: 2 | 4;
  readonly entriesOffset: number;
  readonly valueOrigin: number;
  readonly entrySize?: number;
}

export interface MakerNotePackConfig {
  readonly identity: Omit<MakerNotePluginIdentity, "tagRegistry" | "sources">;
  readonly sources: readonly MakerNoteSourceReference[];
  readonly signatures: readonly {
    readonly offset: number;
    readonly bytes: readonly number[];
    readonly description: string;
  }[];
  readonly detectStructure?: (context: MakerNotePluginInput["context"]) => boolean;
  readonly detectByteOrder?: (context: MakerNotePluginInput["context"]) => MakerNoteDetection["byteOrder"];
  readonly layoutForDetection?: (context: MakerNotePluginInput["context"], detection: MakerNoteDetection) => BoundedIfdLayout | null;
  readonly layoutOffset?: (context: MakerNotePluginInput["context"]) => number | null;
  readonly layout: BoundedIfdLayout | null;
  readonly tags: readonly MakerNotePackTag[];
  readonly opaqueReason?: MakerNoteOpaqueRange["reason"];
}

const TYPE_CODES: Readonly<Record<number, { readonly type: ExifDataType; readonly size: number }>> = Object.freeze({
  1: { type: "BYTE", size: 1 },
  2: { type: "ASCII", size: 1 },
  3: { type: "SHORT", size: 2 },
  4: { type: "LONG", size: 4 },
  5: { type: "RATIONAL", size: 8 },
  6: { type: "SBYTE", size: 1 },
  7: { type: "UNDEFINED", size: 1 },
  8: { type: "SSHORT", size: 2 },
  9: { type: "SLONG", size: 4 },
  10: { type: "SRATIONAL", size: 8 },
});

const TYPE_TO_CODE: Readonly<Record<ExifDataType, number>> = Object.freeze({
  BYTE: 1, ASCII: 2, SHORT: 3, LONG: 4, RATIONAL: 5, SBYTE: 6, UNDEFINED: 7,
  SSHORT: 8, SLONG: 9, SRATIONAL: 10, FLOAT: 11, DOUBLE: 12, IFD: 13,
  LONG8: 16, SLONG8: 17, IFD8: 18, COMPOSITE: 13, "UTF-8": 129, UNKNOWN: 7,
});

function safeAdd(left: number, right: number): number | null {
  if (!Number.isSafeInteger(left) || !Number.isSafeInteger(right) || left < 0 || right < 0 || right > Number.MAX_SAFE_INTEGER - left) return null;
  return left + right;
}

function safeMultiply(left: number, right: number): number | null {
  if (!Number.isSafeInteger(left) || !Number.isSafeInteger(right) || left < 0 || right < 0 || (left !== 0 && right > Math.floor(Number.MAX_SAFE_INTEGER / left))) return null;
  return left * right;
}

function inRange(total: number, offset: number, length: number): boolean {
  return Number.isSafeInteger(offset) && Number.isSafeInteger(length) && offset >= 0 && length >= 0 && offset <= total && length <= total - offset;
}

function provenance(context: MakerNotePluginInput["context"], relativeOffset: number, rangeLength: number): MakerNoteProvenance {
  return {
    noteOffset: context.noteOffset,
    noteLength: context.noteLength,
    sourceLength: context.sourceLength,
    blockId: context.blockId,
    fieldId: context.fieldId,
    noteRelativeOffset: relativeOffset,
    rangeLength,
    originalFileOffset: safeAdd(context.noteOffset, relativeOffset),
    originalFileLength: context.sourceLength,
    offsetBase: context.baseOffsetRule,
  };
}

function fieldProvenance(context: MakerNotePluginInput["context"], relativeOffset: number, rangeLength: number): MakerNoteProvenance {
  return provenance(context, relativeOffset, rangeLength);
}

function opaque(context: MakerNotePluginInput["context"], reason: MakerNoteOpaqueRange["reason"], relativeOffset = 0, length = context.noteLength): MakerNoteOpaqueRange {
  const boundedLength = inRange(context.noteLength, relativeOffset, length) && length > 0 ? length : context.noteLength;
  const boundedOffset = boundedLength === context.noteLength ? 0 : relativeOffset;
  return {
    id: `maker-note:${context.noteOffset}:opaque:${boundedOffset}`,
    noteRelativeOffset: boundedOffset,
    originalFileOffset: safeAdd(context.noteOffset, boundedOffset),
    length: boundedLength,
    reason,
    provenance: provenance(context, boundedOffset, boundedLength),
  };
}

function emptyResult(context: MakerNotePluginInput["context"], status: MakerNoteStatus, reason: MakerNoteOpaqueRange["reason"]): MakerNotePluginResult {
  return { status, opaqueRanges: [opaque(context, reason)] };
}

function decodeText(bytes: Uint8Array, decoder: PackDecoder): string | null {
  if (decoder !== "text") return null;
  if (bytes.some((value) => value === 0 && bytes.indexOf(value) < bytes.length - 1)) {
    const firstNul = bytes.indexOf(0);
    bytes = bytes.subarray(0, firstNul < 0 ? bytes.length : firstNul);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/\0+$/gu, "");
  } catch {
    return null;
  }
}

function display(value: MetadataValue, limit = 240): string {
  if (value instanceof Uint8Array) return `bytes(${value.byteLength})`;
  if (Array.isArray(value)) {
    const items = value as readonly MetadataValue[];
    let output = "";
    for (const item of items) {
      const next = output.length === 0 ? display(item, limit) : `${output}, ${display(item, limit - output.length - 2)}`;
      if (next.length > limit) return `${output.slice(0, Math.max(0, limit - 1))}…`;
      output = next;
    }
    return output;
  }
  if (typeof value === "object" && value !== null && "numerator" in value && "denominator" in value) {
    return `${value.numerator}/${value.denominator}`;
  }
  if (typeof value === "object" && value !== null) {
    if ("decimal" in value && typeof value.decimal === "string") return value.decimal;
    if ("code" in value && typeof value.code === "number") return String(value.code);
    if ("computed" in value && typeof value.computed === "number") return String(value.computed);
    return "structured-value";
  }
  const output = typeof value === "string" && value.length === 0 ? "(empty)" : String(value);
  return output.length > limit ? `${output.slice(0, Math.max(0, limit - 1))}…` : output;
}

function valueFromBytes(context: MakerNotePluginInput["context"], byteOrder: BoundedIfdLayout["byteOrder"], type: ExifDataType, count: number, start: number, byteLength: number, decoder: PackDecoder): { readonly raw: MetadataValue; readonly value: MetadataValue } | null {
  const bytes = context.read(start, byteLength);
  const code = TYPE_TO_CODE[type];
  if (decoder === "text" || type === "ASCII" || type === "UTF-8") {
    const text = decodeText(bytes, "text");
    return text === null ? null : { raw: text, value: text };
  }
  if (decoder === "bytes" || type === "BYTE" || type === "SBYTE" || type === "UNDEFINED") return { raw: bytes, value: bytes };
  const little = byteOrder === "little-endian";
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const values: Array<number | RationalValue> = [];
  for (let index = 0; index < count; index += 1) {
    const offset = index * (TYPE_CODES[code]?.size ?? 1);
    if (type === "SHORT") values.push(view.getUint16(offset, little));
    else if (type === "SSHORT") values.push(view.getInt16(offset, little));
    else if (type === "LONG") values.push(view.getUint32(offset, little));
    else if (type === "SLONG") values.push(view.getInt32(offset, little));
    else if (type === "RATIONAL" || type === "SRATIONAL") {
      const numerator = type === "RATIONAL" ? view.getUint32(offset, little) : view.getInt32(offset, little);
      const denominator = type === "RATIONAL" ? view.getUint32(offset + 4, little) : view.getInt32(offset + 4, little);
      values.push({ numerator, denominator });
    } else return null;
  }
  const value = values.length === 1
    ? values[0] ?? null
    : type === "RATIONAL" || type === "SRATIONAL"
      ? values as readonly RationalValue[]
      : values as readonly number[];
  return { raw: value, value };
}

function tagMap(tags: readonly MakerNotePackTag[]): ReadonlyMap<number, MakerNotePackTag> {
  return new Map(tags.map((tag) => [tag.tag, tag] as const));
}

function validateConfig(config: MakerNotePackConfig): void {
  const ids = new Set<string>();
  const tags = new Set<number>();
  for (const tag of config.tags) {
    if (ids.has(tag.id) || tags.has(tag.tag) || !Number.isSafeInteger(tag.tag) || tag.tag < 0 || tag.tag > 0xffff) throw new TypeError(`MakerNote pack ${config.identity.id} has duplicate or invalid tag definitions.`);
    ids.add(tag.id); tags.add(tag.tag);
  }
  if (new Set(config.signatures.map(({ offset }) => offset)).size !== config.signatures.length || config.signatures.some(({ offset, bytes }) => !Number.isSafeInteger(offset) || offset < 0 || bytes.length === 0 || bytes.some((value) => !Number.isInteger(value) || value < 0 || value > 0xff))) throw new TypeError(`MakerNote pack ${config.identity.id} has invalid signature definitions.`);
}

function signatureMatches(context: MakerNotePluginInput["context"], signatures: MakerNotePackConfig["signatures"]): boolean {
  return signatures.every((signature) => inRange(context.noteLength, signature.offset, signature.bytes.length) && context.read(signature.offset, signature.bytes.length).every((value, index) => value === signature.bytes[index]));
}

function parseIfd(context: MakerNotePluginInput["context"], input: MakerNotePluginInput, config: MakerNotePackConfig): MakerNotePluginResult {
  if (config.layout === null) return emptyResult(context, "unsupported", config.opaqueReason ?? "unsupported");
  const layout = config.layoutForDetection === undefined ? config.layout : config.layoutForDetection(context, input.detection);
  if (layout === null) return emptyResult(context, "unsupported", config.opaqueReason ?? "unsupported");
  const entrySize = layout.entrySize ?? 12;
  const layoutOffset = config.layoutOffset === undefined ? 0 : config.layoutOffset(context);
  if (layoutOffset === null || !Number.isSafeInteger(layoutOffset) || layoutOffset < 0) return emptyResult(context, "malformed", "malformed");
  const countSize = layout.countSize ?? 2;
  const countOffset = safeAdd(layoutOffset, layout.countOffset);
  const entriesOffset = safeAdd(layoutOffset, layout.entriesOffset);
  const valueOrigin = safeAdd(layoutOffset, layout.valueOrigin);
  if (entrySize !== 12 || countOffset === null || entriesOffset === null || valueOrigin === null || !inRange(context.noteLength, countOffset, countSize) || !inRange(context.noteLength, entriesOffset, 0)) return emptyResult(context, "malformed", "malformed");
  const count = countSize === 4 ? context.readUint32(countOffset, layout.byteOrder) : context.readUint16(countOffset, layout.byteOrder);
  if (count > input.limits.maxIfdEntries || count > input.limits.maxAdapterItems) return emptyResult(context, "limit-exceeded", "limit-exceeded");
  const map = tagMap(config.tags);
  const fields: MakerNoteField[] = [];
  const opaqueRanges: MakerNoteOpaqueRange[] = [];
  const diagnostics = [];
  for (let index = 0; index < count; index += 1) {
    const entryDelta = safeMultiply(index, entrySize);
    const entryOffset = entryDelta === null ? null : safeAdd(entriesOffset, entryDelta);
    if (entryOffset === null || !inRange(context.noteLength, entryOffset, entrySize)) return { status: "malformed", fields, opaqueRanges: opaqueRanges.length > 0 ? opaqueRanges : [opaque(context, "malformed")], diagnostics };
    const tag = context.readUint16(entryOffset, layout.byteOrder);
    const typeCode = context.readUint16(entryOffset + 2, layout.byteOrder);
    const typeInfo = TYPE_CODES[typeCode];
    const countValue = context.readUint32(entryOffset + 4, layout.byteOrder);
    const byteLength = typeInfo === undefined ? null : safeMultiply(countValue, typeInfo.size);
    const valueStartValue = byteLength !== null && byteLength <= 4
      ? entryOffset + 8
      : typeInfo === undefined || byteLength === null || !inRange(context.noteLength, entryOffset + 8, 4)
        ? null
        : safeAdd(valueOrigin, context.readUint32(entryOffset + 8, layout.byteOrder));
    if (typeInfo === undefined || byteLength === null || countValue === 0 || byteLength > input.limits.maxValueBytes || countValue > input.limits.maxAdapterItems || valueStartValue === null || !inRange(context.noteLength, valueStartValue, byteLength)) {
      if (opaqueRanges.length < input.limits.maxSegments) opaqueRanges.push(opaque(context, typeInfo === undefined ? "unsupported" : byteLength !== null && byteLength > input.limits.maxValueBytes ? "limit-exceeded" : "malformed", entryOffset, entrySize));
      if (typeInfo === undefined) diagnostics.push({ code: "UNSUPPORTED_NOTE" as const, message: "MakerNote tag type is not supported by this pack." });
      else if (byteLength !== null && byteLength > input.limits.maxValueBytes) diagnostics.push({ code: "LIMIT_EXCEEDED" as const, message: "MakerNote tag value exceeds the configured limit." });
      else diagnostics.push({ code: "MALFORMED_NOTE" as const, message: countValue === 0 ? "MakerNote tag has an invalid zero value count." : "MakerNote tag value range is malformed." });
      continue;
    }
    const definition = map.get(tag);
    if (definition === undefined) {
      if (opaqueRanges.length < input.limits.maxSegments) opaqueRanges.push(opaque(context, "unknown", valueStartValue, Math.max(1, byteLength)));
      continue;
    }
    const expectedCode = TYPE_TO_CODE[definition.type];
    if (expectedCode !== typeCode && !(definition.type === "BYTE" && typeCode === 7)) {
      opaqueRanges.push(opaque(context, "malformed", entryOffset, entrySize));
      diagnostics.push({ code: "MALFORMED_NOTE" as const, message: "MakerNote tag type contradicts its generated definition." });
      continue;
    }
    const decoded = valueFromBytes(context, layout.byteOrder, typeInfo.type, countValue, valueStartValue, byteLength, definition.decoder);
    if (decoded === null) {
      opaqueRanges.push(opaque(context, "malformed", valueStartValue, byteLength));
      diagnostics.push({ code: "MALFORMED_NOTE" as const, message: "MakerNote value could not be decoded under the declared encoding." });
      continue;
    }
    fields.push({
      id: definition.id,
      tag,
      name: definition.name,
      label: definition.label,
      description: definition.description,
      type: typeInfo.type,
      raw: decoded.raw,
      value: decoded.value,
      display: display(decoded.value),
      sensitivity: definition.sensitivity,
      count: countValue,
      known: true,
      ...(definition.unit === undefined ? {} : { unit: definition.unit }),
      provenance: fieldProvenance(context, valueStartValue, byteLength),
    });
  }
  if (opaqueRanges.length > 0 || diagnostics.length > 0) return { status: "detected-decoded", fields, opaqueRanges, diagnostics };
  return { status: "detected-decoded", fields };
}

/** Build one stateless, explicitly imported vendor pack around the B07 contract. */
export function createMakerNotePack(config: MakerNotePackConfig): MakerNotePlugin {
  validateConfig(config);
  const tagRegistry = Object.freeze(config.tags.map((tagDefinition) => {
    const { decoder, ...definition } = tagDefinition;
    return Object.freeze({
      ...definition,
      applicableModels: Object.freeze([...(definition.applicableModels ?? config.identity.supportedModels ?? [])]),
      ...(definition.applicableVersions === undefined ? {} : { applicableVersions: Object.freeze([...definition.applicableVersions]) }),
      ...(definition.enumValues === undefined ? {} : { enumValues: Object.freeze({ ...definition.enumValues }) }),
      validation: definition.validation ?? `Bounded ${definition.type} value decoded as ${decoder}; no vendor-specific enumeration is asserted without independent source evidence.`,
    });
  }));
  const identity: MakerNotePluginIdentity = Object.freeze({
    ...config.identity,
    ...(config.identity.supportedModels === undefined ? {} : { supportedModels: Object.freeze([...config.identity.supportedModels]) }),
    ...(config.identity.supportedVersions === undefined ? {} : { supportedVersions: Object.freeze([...config.identity.supportedVersions]) }),
    signatureTests: Object.freeze([...config.identity.signatureTests]),
    securityRequirements: Object.freeze([...config.identity.securityRequirements]),
    tagRegistry,
    sources: Object.freeze(config.sources.map((source) => Object.freeze({ ...source }))),
  });
  const plugin: MakerNotePlugin = {
    identity,
    detect: (context) => {
      if (!signatureMatches(context, config.signatures)) return null;
      if (config.detectStructure !== undefined && !config.detectStructure(context)) return null;
      const byteOrder = config.detectByteOrder?.(context) ?? config.identity.byteOrder;
      return {
        confidence: 0.99,
        evidence: config.signatures.map((signature) => ({ kind: "vendor-marker" as const, offset: signature.offset, length: signature.bytes.length, description: signature.description })),
        byteOrder,
        baseOffsetRule: config.identity.baseOffsetRule,
        status: "detected" as const,
      } satisfies MakerNoteDetection;
    },
    parse: (input) => parseIfd(input.context, input, config),
  };
  return Object.freeze(plugin);
}

export function source(id: string, url: string, version: string, license: string, sha256: string, role: MakerNoteSourceReference["role"]): MakerNoteSourceReference {
  return Object.freeze({ id, url, version, license, retrievedAt: "2026-09-13", sha256, role });
}

export function tag(definition: Omit<MakerNotePackTag, "id"> & { readonly id: string }): MakerNotePackTag {
  return Object.freeze({
    ...definition,
    applicableVersions: definition.applicableVersions ?? ["1.0.0"],
    validation: definition.validation ?? `Bounded ${definition.type} value; no vendor-specific enumeration is asserted without independent source evidence.`,
  });
}
