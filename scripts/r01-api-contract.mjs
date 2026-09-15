import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { TextEncoder } from "node:util";

const root = resolve(new URL("..", import.meta.url).pathname);
const schemaPath = join(root, "schemas/r01-api-v1.schema.json");
const snapshotPath = join(root, "reports/r01-api-snapshot.json");
const schema = JSON.parse(await readFile(schemaPath, "utf8"));
const packageManifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const schemaText = await readFile(schemaPath);
const declaration = await readFile(join(root, "dist/index.d.ts"));
const ctsDeclaration = await readFile(join(root, "dist/index.d.cts"));

function hash(value) { return createHash("sha256").update(value).digest("hex"); }
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
function equal(left, right) { return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right)); }

function resolveRef(ref) {
  if (!ref.startsWith("#/$defs/")) throw new Error(`Unsupported schema reference ${ref}`);
  const definition = schema.$defs[ref.slice("#/$defs/".length)];
  if (definition === undefined) throw new Error(`Missing schema definition for ${ref}`);
  return definition;
}

function validate(value, rule, path = "$", depth = 0) {
  if (depth > 96) return [`${path}: schema validation depth exceeded`];
  if (rule.$ref !== undefined) return validate(value, resolveRef(rule.$ref), path, depth + 1);
  if (rule.allOf !== undefined) {
    const errors = rule.allOf.flatMap((child) => validate(value, child, path, depth + 1));
    if (errors.length > 0) return errors;
  }
  if (rule.if !== undefined) {
    const condition = validate(value, rule.if, path, depth + 1);
    const branch = condition.length === 0 ? rule.then : rule.else;
    if (branch !== undefined) {
      const errors = validate(value, branch, path, depth + 1);
      if (errors.length > 0) return errors;
    }
  }
  if (rule.anyOf !== undefined) {
    const failures = rule.anyOf.map((child) => validate(value, child, path, depth + 1));
    if (failures.some((errors) => errors.length === 0)) return [];
    return [`${path}: no anyOf branch matched (${failures.map((errors) => errors[0]).join("; ")})`];
  }
  if (rule.oneOf !== undefined) {
    const matches = rule.oneOf.map((child) => validate(value, child, path, depth + 1)).filter((errors) => errors.length === 0).length;
    return matches === 1 ? [] : [`${path}: expected exactly one oneOf branch, matched ${matches}`];
  }
  if (rule.const !== undefined && !equal(value, rule.const)) return [`${path}: expected constant ${JSON.stringify(rule.const)}`];
  if (rule.enum !== undefined && !rule.enum.some((candidate) => equal(value, candidate))) return [`${path}: value is not in enum`];
  if (rule.type !== undefined) {
    const valid = rule.type === "null" ? value === null
      : rule.type === "array" ? Array.isArray(value)
        : rule.type === "object" ? value !== null && typeof value === "object" && !Array.isArray(value)
          : rule.type === "number" ? typeof value === "number" && Number.isFinite(value)
            : rule.type === "integer" ? typeof value === "number" && Number.isSafeInteger(value)
              : typeof value === rule.type;
    if (!valid) return [`${path}: expected ${rule.type}`];
  }
  if (typeof value === "string") {
    if (rule.minLength !== undefined && value.length < rule.minLength) return [`${path}: shorter than minLength`];
    if (rule.pattern !== undefined && !new RegExp(rule.pattern, "u").test(value)) return [`${path}: pattern mismatch`];
  }
  if (typeof value === "number" && rule.minimum !== undefined && value < rule.minimum) return [`${path}: below minimum`];
  if (Array.isArray(value)) {
    if (rule.minItems !== undefined && value.length < rule.minItems) return [`${path}: fewer than minItems`];
    if (rule.items !== undefined) return value.flatMap((item, index) => validate(item, rule.items, `${path}[${index}]`, depth + 1));
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const key of rule.required ?? []) if (!(key in value)) return [`${path}: missing required property ${key}`];
    const properties = rule.properties ?? {};
    for (const [key, child] of Object.entries(properties)) if (key in value) {
      const errors = validate(value[key], child, `${path}.${key}`, depth + 1);
      if (errors.length > 0) return errors;
    }
    if (rule.additionalProperties === false) {
      const unknown = Object.keys(value).find((key) => !(key in properties));
      if (unknown !== undefined) return [`${path}: unexpected property ${unknown}`];
    } else if (rule.additionalProperties !== undefined && typeof rule.additionalProperties === "object") {
      for (const [key, child] of Object.entries(value)) if (!(key in properties)) {
        const errors = validate(child, rule.additionalProperties, `${path}.${key}`, depth + 1);
        if (errors.length > 0) return errors;
      }
    }
  }
  return [];
}

function assertSchema(value, label) {
  const errors = validate(value, schema, label);
  if (errors.length > 0) throw new Error(`${label} failed R01 schema validation: ${errors[0]}`);
}

const api = await import(join(root, "dist/index.js"));
const sidecarApi = await import(join(root, "dist/xmp-sidecar.js"));
const fixture = new Uint8Array(await readFile(join(root, "tests/fixtures/jpeg-exif-little-endian.jpg")));
const parsed = await api.parseMetadata(fixture);
const metadataJson = api.toJsonSafeResult(parsed);
assertSchema(metadataJson, "metadata result");
const edit = await api.editMetadata(fixture, { operations: [{ op: "set", operationId: "r01-invalid", target: { kind: "field", fieldId: "not-a-supported-field" }, value: "x" }] });
const editJson = api.toJsonSafe(edit);
assertSchema(editJson, "edit result");
const redaction = await api.redactMetadata(fixture, { remove: ["GPS"] });
assertSchema(api.toJsonSafe(redaction), "redaction result");
const sanitization = await api.sanitizeMetadata(fixture);
assertSchema(api.toJsonSafe(sanitization), "sanitization result");
const sidecar = await sidecarApi.parseXmpSidecar(new TextEncoder().encode('<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"/>'));
assertSchema(api.toJsonSafe(sidecar), "sidecar result");

const missingFormat = { ...metadataJson };
delete missingFormat.format;
if (validate(missingFormat, schema).length === 0) throw new Error("adversarial result without format unexpectedly matched the schema");
const forgedEdit = { ...editJson, successful: false, status: "applied", data: null };
if (validate(forgedEdit, schema).length === 0) throw new Error("forged edit discriminant was not rejected");

const requiredRootExports = ["parseMetadata", "editMetadata", "redactMetadata", "sanitizeMetadata", "toJsonSafeResult", "parseXmpSidecar", "mergeXmpSources", "serializeXmpSidecar"];
for (const name of requiredRootExports) if (typeof api[name] !== "function") throw new Error(`root export ${name} is missing`);
for (const name of ["parseXmpSidecar", "mergeXmpSources", "serializeXmpSidecar"]) if (typeof sidecarApi[name] !== "function") throw new Error(`sidecar export ${name} is missing`);

const snapshot = {
  schema: { id: schema.$id, version: schema.version, sha256: hash(schemaText) },
  package: { name: packageManifest.name, version: packageManifest.version, exportsSha256: hash(JSON.stringify(canonical(packageManifest.exports))) },
  declarations: { esmSha256: hash(declaration), commonjsSha256: hash(ctsDeclaration) },
  requiredRootExports,
  requiredSubpathExports: { "./xmp/sidecar": ["parseXmpSidecar", "mergeXmpSources", "serializeXmpSidecar"] },
  validation: { representatives: ["metadata", "edit", "redaction", "sanitization", "sidecar"], adversarial: ["missing-required-discriminant"], validator: "bounded draft-2020-12 subset used by the checked schema" },
};
const check = process.argv.includes("--check");
if (check) {
  const previous = JSON.parse(await readFile(snapshotPath, "utf8"));
  if (!equal(previous, snapshot)) throw new Error("R01 API snapshot drifted; review the schema, exports, declarations, and decision record before updating reports/r01-api-snapshot.json.");
} else {
  await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
}
console.log(`R01 API contract ${check ? "verified" : "written"}: schema ${schema.version}, ${requiredRootExports.length} root exports checked.`);
