import type { ExifDataType, Sensitivity } from "./types.js";
import {
  GENERATED_METADATA_BY_ID,
  GENERATED_METADATA_BY_LOCATION,
  GENERATED_METADATA_BY_NAME,
  GENERATED_METADATA_FIELDS,
  GENERATED_METADATA_SOURCES,
} from "./generated/metadata-registry.js";

export interface MetadataCountConstraint {
  readonly min: number;
  readonly max: number | null;
}

export interface MetadataRegistrySource {
  readonly id: string;
  readonly standard: string;
  readonly edition: string;
  readonly extractionDate: string;
  readonly license: string;
  readonly url?: string;
}

export interface MetadataRegistryField {
  readonly id: string;
  readonly ifd: string;
  readonly family: string;
  readonly tag: number;
  readonly legalTypes: readonly ExifDataType[];
  readonly count: MetadataCountConstraint;
  readonly version: string;
  readonly name: string;
  readonly aliases: readonly string[];
  readonly enumValues?: Readonly<Record<string, string>> | undefined;
  readonly bitfield?: Readonly<Record<string, Readonly<{ mask: number; shift?: number }>>> | undefined;
  readonly sensitivity: Sensitivity;
  readonly description: string;
  readonly validation: Readonly<Record<string, unknown>>;
  readonly writePolicy: "preserve" | "safe" | "unsupported";
  readonly source: MetadataRegistrySource;
  readonly legacyEditability: boolean;
}

export type MetadataRegistryFieldInput = {
  readonly id: string;
  readonly ifd: string;
  readonly family?: string;
  readonly tag: number;
  readonly name: string;
  readonly legalTypes?: readonly ExifDataType[];
  readonly count?: MetadataCountConstraint;
  readonly version?: string;
  readonly aliases?: readonly string[];
  readonly enumValues?: Readonly<Record<string, string>> | undefined;
  readonly bitfield?: Readonly<Record<string, Readonly<{ mask: number; shift?: number }>>> | undefined;
  readonly sensitivity?: Sensitivity;
  readonly description?: string;
  readonly validation?: Readonly<Record<string, unknown>>;
  readonly writePolicy?: "preserve" | "safe" | "unsupported";
  readonly source?: MetadataRegistrySource;
  readonly sourceId?: string;
};

export interface MetadataRegistry {
  readonly fields: readonly MetadataRegistryField[];
  readonly sources: readonly MetadataRegistrySource[];
  get(ifd: string, tag: number): MetadataRegistryField | undefined;
  getById(id: string): MetadataRegistryField | undefined;
  getByName(name: string): MetadataRegistryField | undefined;
}

type RegistryInput =
  | MetadataRegistry
  | readonly MetadataRegistryFieldInput[]
  | { readonly fields: readonly MetadataRegistryFieldInput[]; readonly sources?: readonly MetadataRegistrySource[] };

const DEFAULT_TYPES: readonly ExifDataType[] = Object.freeze([
  "BYTE", "ASCII", "UTF-8", "SHORT", "LONG", "RATIONAL", "SBYTE", "UNDEFINED", "SSHORT",
  "SLONG", "SRATIONAL", "FLOAT", "DOUBLE", "IFD", "LONG8", "SLONG8", "IFD8",
]);
const DEFAULT_COUNT: MetadataCountConstraint = Object.freeze({ min: 1, max: null });
const CUSTOM_SOURCE: MetadataRegistrySource = Object.freeze({
  id: "custom",
  standard: "User registry",
  edition: "custom",
  extractionDate: "user-supplied",
  license: "User supplied",
});

function cloneAndFreeze(value: unknown): unknown {
  if (Array.isArray(value)) return Object.freeze(value.map(cloneAndFreeze));
  if (typeof value !== "object" || value === null) return value;
  const output: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) output[key] = cloneAndFreeze(nested);
  return Object.freeze(output);
}

function freezeSource(source: MetadataRegistrySource): MetadataRegistrySource {
  return Object.freeze({ ...source });
}

function sameSource(left: MetadataRegistrySource, right: MetadataRegistrySource): boolean {
  return left.id === right.id
    && left.standard === right.standard
    && left.edition === right.edition
    && left.extractionDate === right.extractionDate
    && left.license === right.license
    && left.url === right.url;
}

function freezeField(field: MetadataRegistryField): MetadataRegistryField {
  return Object.freeze({
    ...field,
    legalTypes: Object.freeze([...field.legalTypes]),
    aliases: Object.freeze([...field.aliases]),
    count: Object.freeze({ ...field.count }),
    validation: cloneAndFreeze(field.validation) as Readonly<Record<string, unknown>>,
    source: freezeSource(field.source),
    enumValues: field.enumValues === undefined
      ? undefined
      : cloneAndFreeze(field.enumValues) as Readonly<Record<string, string>>,
    bitfield: field.bitfield === undefined
      ? undefined
      : cloneAndFreeze(field.bitfield) as MetadataRegistryField["bitfield"],
  });
}

function validateAndFreeze(
  fields: readonly MetadataRegistryField[],
  sources: readonly MetadataRegistrySource[],
): { fields: readonly MetadataRegistryField[]; sources: readonly MetadataRegistrySource[] } {
  const sourceIds = new Set<string>();
  for (const source of sources) {
    if (sourceIds.has(source.id)) throw new TypeError(`Duplicate metadata registry source id: ${source.id}`);
    if (!source.id || !source.standard || !source.edition || !source.extractionDate || !source.license) {
      throw new TypeError("Metadata registry provenance entries require id, standard, edition, extractionDate, and license.");
    }
    sourceIds.add(source.id);
  }

  const ids = new Set<string>();
  const names = new Set<string>();
  const locations = new Set<string>();
  for (const field of fields) {
    if (!Number.isInteger(field.tag) || field.tag < 0 || field.tag > 0xffff) {
      throw new TypeError(`Invalid metadata registry tag for ${field.name}.`);
    }
    const expectedId = `${field.ifd}:0x${field.tag.toString(16).padStart(4, "0")}`;
    if (field.id !== expectedId) {
      throw new TypeError(`Metadata registry field id ${field.id} does not match ${expectedId}.`);
    }
    const location = `${field.ifd}:${field.tag}`;
    if (locations.has(location)) throw new TypeError(`Duplicate metadata registry location: ${field.id}`);
    if (ids.has(field.id)) throw new TypeError(`Duplicate metadata registry field id: ${field.id}`);
    if (!field.name || names.has(field.name)) throw new TypeError(`Duplicate metadata registry field name: ${field.name}`);
    if (field.legalTypes.length === 0) throw new TypeError(`No legal metadata types for ${field.name}.`);
    if (!Number.isInteger(field.count.min) || field.count.min < 0
      || (field.count.max !== null && (!Number.isInteger(field.count.max) || field.count.max < field.count.min))) {
      throw new TypeError(`Invalid metadata registry count for ${field.name}.`);
    }
    if (!sourceIds.has(field.source.id)) throw new TypeError(`Unknown metadata registry source: ${field.source.id}`);
    ids.add(field.id);
    locations.add(location);
    names.add(field.name);
    for (const alias of field.aliases) {
      if (!alias || names.has(alias)) throw new TypeError(`Duplicate metadata registry alias: ${alias}`);
      names.add(alias);
    }
  }

  return {
    fields: Object.freeze(fields.map(freezeField)),
    sources: Object.freeze(sources.map(freezeSource)),
  };
}

function build(
  fields: readonly MetadataRegistryField[],
  sources: readonly MetadataRegistrySource[],
): MetadataRegistry {
  const frozen = validateAndFreeze(fields, sources);
  const byLocation = new Map<string, MetadataRegistryField>();
  const byId = new Map<string, MetadataRegistryField>();
  const byName = new Map<string, MetadataRegistryField>();
  for (const field of frozen.fields) {
    byLocation.set(`${field.ifd}:${field.tag}`, field);
    byId.set(field.id, field);
    byName.set(field.name, field);
    for (const alias of field.aliases) byName.set(alias, field);
  }
  return Object.freeze({
    fields: frozen.fields,
    sources: frozen.sources,
    get: (ifd: string, tag: number) => byLocation.get(`${ifd}:${tag}`)
      ?? (ifd === "IFD1" ? byLocation.get(`IFD0:${tag}`) : undefined),
    getById: (id: string) => byId.get(id),
    getByName: (name: string) => byName.get(name),
  });
}

const builtin = validateAndFreeze(
  GENERATED_METADATA_FIELDS,
  GENERATED_METADATA_SOURCES,
);
const generatedByLocation = GENERATED_METADATA_BY_LOCATION as ReadonlyMap<string, number>;
const generatedById = GENERATED_METADATA_BY_ID as ReadonlyMap<string, number>;
const generatedByName = GENERATED_METADATA_BY_NAME as ReadonlyMap<string, number>;

function generatedLookup(index: ReadonlyMap<string, number>, key: string): MetadataRegistryField | undefined {
  const position = index.get(key);
  return position === undefined ? undefined : builtin.fields[position];
}

// The generated fields and indexes share object identities. They are generated from the
// reviewed JSON source, so the default path avoids rebuilding 138 lookup entries per import.
export const DEFAULT_METADATA_REGISTRY: MetadataRegistry = Object.freeze({
  fields: builtin.fields,
  sources: builtin.sources,
  get: (ifd: string, tag: number) => generatedLookup(generatedByLocation, `${ifd}:${tag}`)
    ?? (ifd === "IFD1" ? generatedLookup(generatedByLocation, `IFD0:${tag}`) : undefined),
  getById: (id: string) => generatedLookup(generatedById, id),
  getByName: (name: string) => generatedLookup(generatedByName, name),
});

export const METADATA_REGISTRY_SIZE = DEFAULT_METADATA_REGISTRY.fields.length;
export type MetadataFieldName = typeof GENERATED_METADATA_FIELDS[number]["name"];

export function createMetadataRegistry(
  input: readonly MetadataRegistryFieldInput[]
    | { readonly fields: readonly MetadataRegistryFieldInput[]; readonly sources?: readonly MetadataRegistrySource[] },
): MetadataRegistry {
  const entries = "fields" in input ? input.fields : input;
  const sources = [...("fields" in input ? input.sources ?? [] : [])];
  const fields: MetadataRegistryField[] = [];

  for (const entry of entries) {
    let source = entry.source;
    if (source !== undefined && entry.sourceId !== undefined && source.id !== entry.sourceId) {
      throw new TypeError(`Metadata registry source ${source.id} does not match sourceId ${entry.sourceId}.`);
    }
    if (source === undefined && entry.sourceId !== undefined) {
      source = sources.find((candidate) => candidate.id === entry.sourceId);
      if (source === undefined) throw new TypeError(`Unknown metadata registry source: ${entry.sourceId}`);
    }
    source ??= CUSTOM_SOURCE;
    const existing = sources.find((candidate) => candidate.id === source.id);
    if (existing !== undefined && !sameSource(existing, source)) {
      throw new TypeError(`Conflicting metadata registry source id: ${source.id}`);
    }
    if (existing === undefined) sources.push(source);
    const writePolicy = entry.writePolicy ?? "preserve";
    fields.push({
      id: entry.id,
      ifd: entry.ifd,
      family: entry.family ?? "EXIF",
      tag: entry.tag,
      name: entry.name,
      legalTypes: entry.legalTypes ?? DEFAULT_TYPES,
      count: entry.count ?? DEFAULT_COUNT,
      version: entry.version ?? "custom",
      aliases: entry.aliases ?? [],
      enumValues: entry.enumValues,
      bitfield: entry.bitfield,
      sensitivity: entry.sensitivity ?? "none",
      description: entry.description ?? entry.name,
      validation: entry.validation ?? { kind: "custom" },
      writePolicy,
      source,
      legacyEditability: writePolicy === "safe",
    });
  }
  return build(fields, sources);
}

export function isMetadataRegistry(value: unknown): value is MetadataRegistry {
  return typeof value === "object"
    && value !== null
    && Array.isArray((value as MetadataRegistry).fields)
    && Array.isArray((value as MetadataRegistry).sources)
    && typeof (value as MetadataRegistry).get === "function"
    && typeof (value as MetadataRegistry).getById === "function"
    && typeof (value as MetadataRegistry).getByName === "function";
}

export function resolveMetadataRegistry(input: RegistryInput | undefined): MetadataRegistry {
  if (input === undefined || input === DEFAULT_METADATA_REGISTRY) return DEFAULT_METADATA_REGISTRY;
  if (isMetadataRegistry(input)) {
    return createMetadataRegistry({ fields: input.fields, sources: input.sources });
  }
  return createMetadataRegistry(input);
}
