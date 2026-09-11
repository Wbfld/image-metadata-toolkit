import type { ExifDataType, Sensitivity } from "./types.js";
import { GENERATED_METADATA_FIELDS, GENERATED_METADATA_SOURCES } from "./generated/metadata-registry.js";

export interface MetadataCountConstraint { readonly min: number; readonly max: number | null; }
export interface MetadataRegistrySource { readonly id: string; readonly standard: string; readonly edition: string; readonly extractionDate: string; readonly license: string; readonly url?: string; }
export interface MetadataRegistryField {
  readonly id: string; readonly ifd: string; readonly family: string; readonly tag: number;
  readonly legalTypes: readonly ExifDataType[]; readonly count: MetadataCountConstraint; readonly version: string;
  readonly name: string; readonly aliases: readonly string[]; readonly enumValues?: Readonly<Record<string, string>> | undefined;
  readonly bitfield?: Readonly<Record<string, Readonly<{ mask: number; shift?: number }>>> | undefined;
  readonly sensitivity: Sensitivity; readonly description: string; readonly validation: Readonly<Record<string, unknown>>;
  readonly writePolicy: "preserve" | "safe" | "unsupported"; readonly source: MetadataRegistrySource; readonly legacyEditability: boolean;
}
export type MetadataRegistryFieldInput = {
  readonly id: string; readonly ifd: string; readonly family?: string; readonly tag: number; readonly name: string;
  readonly legalTypes?: readonly ExifDataType[]; readonly count?: MetadataCountConstraint; readonly version?: string;
  readonly aliases?: readonly string[]; readonly enumValues?: Readonly<Record<string, string>>;
  readonly bitfield?: Readonly<Record<string, Readonly<{ mask: number; shift?: number }>>>;
  readonly sensitivity?: Sensitivity; readonly description?: string; readonly validation?: Readonly<Record<string, unknown>>;
  readonly writePolicy?: "preserve" | "safe" | "unsupported"; readonly source?: MetadataRegistrySource; readonly sourceId?: string;
};
export interface MetadataRegistry { readonly fields: readonly MetadataRegistryField[]; readonly sources: readonly MetadataRegistrySource[]; get(ifd: string, tag: number): MetadataRegistryField | undefined; getById(id: string): MetadataRegistryField | undefined; getByName(name: string): MetadataRegistryField | undefined; }

const DEFAULT_TYPES: readonly ExifDataType[] = ["BYTE", "ASCII", "SHORT", "LONG", "RATIONAL", "SBYTE", "UNDEFINED", "SSHORT", "SLONG", "SRATIONAL", "FLOAT", "DOUBLE", "IFD", "LONG8", "SLONG8", "IFD8"];
const DEFAULT_COUNT: MetadataCountConstraint = Object.freeze({ min: 1, max: null });
function freezeField(field: MetadataRegistryField): MetadataRegistryField { return Object.freeze({ ...field, legalTypes: Object.freeze([...field.legalTypes]), aliases: Object.freeze([...field.aliases]), count: Object.freeze({ ...field.count }), validation: Object.freeze({ ...field.validation }), source: Object.freeze({ ...field.source }), enumValues: field.enumValues === undefined ? undefined : Object.freeze({ ...field.enumValues }), bitfield: field.bitfield === undefined ? undefined : Object.freeze(Object.fromEntries(Object.entries(field.bitfield).map(([key, value]) => [key, Object.freeze({ ...value })]))) }); }
function validate(fields: readonly MetadataRegistryField[], sources: readonly MetadataRegistrySource[]): { fields: readonly MetadataRegistryField[]; sources: readonly MetadataRegistrySource[] } { const ids = new Set<string>(), names = new Set<string>(); for (const field of fields) { if (ids.has(field.id)) throw new TypeError(`Duplicate metadata registry field id: ${field.id}`); if (names.has(field.name)) throw new TypeError(`Duplicate metadata registry field name: ${field.name}`); if (!Number.isInteger(field.tag) || field.tag < 0 || field.tag > 0xffff) throw new TypeError(`Invalid metadata registry tag for ${field.name}.`); if (field.count.min < 0 || (field.count.max !== null && field.count.max < field.count.min)) throw new TypeError(`Invalid metadata registry count for ${field.name}.`); ids.add(field.id); names.add(field.name); for (const alias of field.aliases) { if (names.has(alias)) throw new TypeError(`Duplicate metadata registry alias: ${alias}`); names.add(alias); } } return { fields: Object.freeze(fields.map(freezeField)), sources: Object.freeze(sources.map((source) => Object.freeze({ ...source }))) }; }
function build(fields: readonly MetadataRegistryField[], sources: readonly MetadataRegistrySource[]): MetadataRegistry { const frozen = validate(fields, sources), byLocation = new Map<string, MetadataRegistryField>(), byId = new Map<string, MetadataRegistryField>(), byName = new Map<string, MetadataRegistryField>(); for (const field of frozen.fields) { byLocation.set(`${field.ifd}:${field.tag}`, field); byId.set(field.id, field); byName.set(field.name, field); for (const alias of field.aliases) byName.set(alias, field); } return Object.freeze({ fields: frozen.fields, sources: frozen.sources, get: (ifd: string, tag: number) => byLocation.get(`${ifd}:${tag}`) ?? (ifd === "IFD1" ? byLocation.get(`IFD0:${tag}`) : undefined), getById: (id: string) => byId.get(id), getByName: (name: string) => byName.get(name) }); }
const builtinFields = GENERATED_METADATA_FIELDS as unknown as readonly MetadataRegistryField[];
export const DEFAULT_METADATA_REGISTRY = build(builtinFields, GENERATED_METADATA_SOURCES);
export const METADATA_REGISTRY_SIZE = DEFAULT_METADATA_REGISTRY.fields.length;
export type MetadataFieldName = typeof GENERATED_METADATA_FIELDS[number]["name"];
export function createMetadataRegistry(input: readonly MetadataRegistryFieldInput[] | { readonly fields: readonly MetadataRegistryFieldInput[]; readonly sources?: readonly MetadataRegistrySource[] }): MetadataRegistry {
  let entries: readonly MetadataRegistryFieldInput[];
  let sources: MetadataRegistrySource[];
  if ("fields" in input) { entries = input.fields; sources = [...(input.sources ?? [])]; } else { entries = input; sources = []; }
  const fallback: MetadataRegistrySource = { id: "custom", standard: "User registry", edition: "custom", extractionDate: new Date().toISOString().slice(0, 10), license: "User supplied" };
  if (!sources.some((source) => source.id === fallback.id)) sources.push(fallback);
  const fields: MetadataRegistryField[] = entries.map((entry: MetadataRegistryFieldInput) => {
    const source = entry.source ?? sources.find((candidate) => candidate.id === entry.sourceId) ?? fallback;
    if (!sources.some((candidate) => candidate.id === source.id)) sources.push(source);
    return { ...entry, family: entry.family ?? "EXIF", legalTypes: entry.legalTypes ?? DEFAULT_TYPES, count: entry.count ?? DEFAULT_COUNT, version: entry.version ?? "custom", aliases: entry.aliases ?? [], sensitivity: entry.sensitivity ?? "none", description: entry.description ?? entry.name, validation: entry.validation ?? { kind: "custom" }, writePolicy: entry.writePolicy ?? "preserve", source, legacyEditability: entry.writePolicy === "safe" };
  });
  return build(fields, sources);
}
export function isMetadataRegistry(value: unknown): value is MetadataRegistry { return typeof value === "object" && value !== null && Array.isArray((value as MetadataRegistry).fields) && typeof (value as MetadataRegistry).get === "function"; }
export function resolveMetadataRegistry(input: MetadataRegistry | readonly MetadataRegistryFieldInput[] | { readonly fields: readonly MetadataRegistryFieldInput[]; readonly sources?: readonly MetadataRegistrySource[] } | undefined): MetadataRegistry { if (input === undefined) return DEFAULT_METADATA_REGISTRY; if (isMetadataRegistry(input)) return input; return createMetadataRegistry(input); }
