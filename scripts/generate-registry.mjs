import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "data", "metadata-registry.json");
const outputPath = path.join(root, "src", "generated", "metadata-registry.ts");
const check = process.argv.includes("--check");

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
validateSource(source);
const output = render(source);
if (check) {
  const actual = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : "";
  if (actual !== output) {
    console.error("Generated metadata registry is stale. Run npm run registry:generate.");
    process.exitCode = 1;
  }
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output);
}

function validateSource(value) {
  if (!value || value.schemaVersion !== 1 || !Array.isArray(value.sources) || !Array.isArray(value.fields)) {
    throw new Error("Metadata registry source must contain schemaVersion 1, sources, and fields.");
  }
  const sourceIds = new Set();
  for (const provenance of value.sources) {
    for (const key of ["id", "standard", "edition", "extractionDate", "license"]) {
      if (typeof provenance?.[key] !== "string" || provenance[key].length === 0) throw new Error(`Registry source is missing ${key}.`);
    }
    if (sourceIds.has(provenance.id)) throw new Error(`Duplicate registry source id: ${provenance.id}`);
    sourceIds.add(provenance.id);
  }
  const ids = new Set();
  const names = new Set();
  const locations = new Set();
  for (const field of value.fields) {
    for (const key of ["id", "ifd", "family", "tag", "name", "version", "sensitivity", "description", "validation", "writePolicy", "sourceId"]) {
      if (field?.[key] === undefined) throw new Error(`Registry field ${field?.id ?? "<unknown>"} is missing ${key}.`);
    }
    if (!/^([A-Za-z][A-Za-z0-9]*):0x[0-9a-f]{4}$/u.test(field.id)) throw new Error(`Invalid registry field id: ${field.id}`);
    if (ids.has(field.id)) throw new Error(`Duplicate registry field id: ${field.id}`);
    if (names.has(field.name)) throw new Error(`Duplicate registry field name or alias: ${field.name}`);
    ids.add(field.id);
    names.add(field.name);
    if (!sourceIds.has(field.sourceId)) throw new Error(`Unknown provenance source ${field.sourceId} for ${field.id}.`);
    if (!Array.isArray(field.legalTypes) || field.legalTypes.length === 0) throw new Error(`No legal types for ${field.id}.`);
    if (!field.count || !Number.isInteger(field.count.min) || field.count.min < 0 || (field.count.max !== null && (!Number.isInteger(field.count.max) || field.count.max < field.count.min))) {
      throw new Error(`Invalid count constraint for ${field.id}.`);
    }
    if (!Array.isArray(field.aliases) || new Set(field.aliases).size !== field.aliases.length) throw new Error(`Invalid aliases for ${field.id}.`);
    if (typeof field.tag !== "string" || !/^0x[0-9a-f]{4}$/u.test(field.tag)) throw new Error(`Invalid numeric tag for ${field.id}.`);
    if (field.id !== `${field.ifd}:${field.tag}`) throw new Error(`Registry field id does not match its IFD and tag: ${field.id}`);
    const location = `${field.ifd}:${Number.parseInt(field.tag, 16)}`;
    if (locations.has(location)) throw new Error(`Duplicate registry field location: ${field.id}`);
    locations.add(location);
    for (const alias of field.aliases) {
      if (typeof alias !== "string" || alias.length === 0 || names.has(alias)) throw new Error(`Duplicate registry field name or alias: ${alias}`);
      names.add(alias);
    }
  }
}

function render(source) {
  const legalTypes = JSON.stringify(source.fields[0]?.legalTypes ?? []);
  const defaultCount = JSON.stringify(source.fields[0]?.count ?? { min: 1, max: null });
  const sources = JSON.stringify(source.sources);
  const sourceIndexes = new Map(source.sources.map((item, index) => [item.id, index]));
  const fieldLiterals = source.fields.map((field) => {
    const sourceIndex = sourceIndexes.get(field.sourceId);
    const entries = [];
    for (const [key, value] of Object.entries(field)) {
      if (key === "sourceId") continue;
      if (key === "tag") entries.push(`${key}:${Number.parseInt(value, 16)}`);
      else if (key === "legalTypes" && JSON.stringify(value) === legalTypes) entries.push(`${key}:LEGAL_TYPES`);
      else if (key === "count" && JSON.stringify(value) === defaultCount) entries.push(`${key}:DEFAULT_COUNT`);
      else if (key === "enumValues" && Object.keys(value).length === 0) continue;
      else entries.push(`${key}:${JSON.stringify(value)}`);
    }
    entries.push(`source:SOURCES[${sourceIndex}]`);
    entries.push(`legacyEditability:${field.writePolicy === "safe"}`);
    return `{${entries.join(",")}}`;
  });
  const locations = source.fields.map((field, index) => [`${field.ifd}:${Number.parseInt(field.tag, 16)}`, index]);
  const names = source.fields.flatMap((field, index) => [[field.name, index], ...field.aliases.map((alias) => [alias, index])]);
  const ids = source.fields.map((field, index) => [field.id, index]);
  const mapLiteral = (entries) => `new Map<string, number>(${JSON.stringify(entries)})`;
  return `/** Generated by scripts/generate-registry.mjs. Do not edit manually. */\nconst LEGAL_TYPES = ${legalTypes} as const;\nconst DEFAULT_COUNT = ${defaultCount} as const;\nconst SOURCES = ${sources} as const;\nexport const GENERATED_METADATA_SOURCES = SOURCES;\nexport const GENERATED_METADATA_FIELDS = [${fieldLiterals.join(",")}] as const;\nexport const GENERATED_METADATA_BY_LOCATION = ${mapLiteral(locations)};\nexport const GENERATED_METADATA_BY_NAME = ${mapLiteral(names)};\nexport const GENERATED_METADATA_BY_ID = ${mapLiteral(ids)};\nexport type GeneratedMetadataFieldName = typeof GENERATED_METADATA_FIELDS[number]["name"];\n`;
}
