import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "data", "iptc", "iptc-pmd-techreference_2025.1.json");
const previousSourcePath = path.join(root, "data", "iptc", "iptc-pmd-techreference_2023.1.json");
const outputPath = path.join(root, "src", "generated", "iptc-pmd.ts");
const check = process.argv.includes("--check");
const sourceBytes = fs.readFileSync(sourcePath);
const previousSourceBytes = fs.readFileSync(previousSourcePath);
const sourceHash = crypto.createHash("sha256").update(sourceBytes).digest("hex");
const previousSourceHash = crypto.createHash("sha256").update(previousSourceBytes).digest("hex");
const pinnedSourceHash = "592c37b01fe02c7333cd7059a212bdceee13c1147ad7bcc6dbe996ba433128a8";
const pinnedPreviousHash = "6ce036311ac30a8b0755029870b3b508061e17bc69206ac0949315b4b8ebe49f";
if (sourceHash !== pinnedSourceHash || previousSourceHash !== pinnedPreviousHash) {
  throw new Error("Pinned IPTC TechReference hash mismatch; refuse to regenerate semantic vocabulary.");
}
const source = JSON.parse(sourceBytes.toString("utf8"));
const previousSource = JSON.parse(previousSourceBytes.toString("utf8"));
const NAMESPACE_BY_PREFIX = {
  Iptc4xmpCore: "http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/",
  Iptc4xmpExt: "http://iptc.org/std/Iptc4xmpExt/2008-02-29/",
  photoshop: "http://ns.adobe.com/photoshop/1.0/",
  dc: "http://purl.org/dc/elements/1.1/",
  plus: "http://ns.useplus.org/ldf/xmp/1.0/",
  xmpRights: "http://ns.adobe.com/xap/1.0/rights/",
  xmp: "http://ns.adobe.com/xap/1.0/",
  exif: "http://ns.adobe.com/exif/1.0/",
};

function splitXmpId(value) {
  if (typeof value !== "string") return null;
  const separator = value.indexOf(":");
  if (separator <= 0 || separator === value.length - 1) return null;
  const prefix = value.slice(0, separator);
  const namespaceUri = NAMESPACE_BY_PREFIX[prefix];
  return namespaceUri === undefined ? null : { prefix, namespaceUri, localName: value.slice(separator + 1) };
}

function iimMappings(value) {
  const ids = typeof value.IIMid === "string" ? value.IIMid.match(/\d+\s*:\s*\d+/g) ?? [] : [];
  return ids.map((id) => {
    const [record, dataset] = id.split(":").map((part) => Number(part.trim()));
    return { record, dataset, id: `${record}:${dataset}` };
  });
}

function controlledValues(value) {
  const values = value.controlledvalues ?? value.controlledValues ?? value.cvterm ?? value.cvterms ?? null;
  if (values === null || values === undefined) return [];
  return Array.isArray(values) ? values.map(String) : [String(values)];
}

function projectProperty([id, value], edition, allEditions) {
  const xmp = splitXmpId(value.XMPid);
  const structureId = value.datatype === "struct" && typeof value.dataformat === "string" ? value.dataformat : null;
  const occurrence = value.propoccurrence ?? null;
  return {
    id,
    stableIdentity: `iptc-pmd:${id}`,
    name: value.name,
    label: value.label ?? value.name,
    description: value.helptext ?? value.usernotes ?? value.name,
    schema: value.ipmdschema ?? null,
    datatype: value.datatype ?? null,
    dataformat: value.dataformat ?? null,
    minimumLength: 0,
    maximumLength: typeof value.IIMmaxbytes === "number" ? value.IIMmaxbytes : null,
    occurrence,
    repeatable: occurrence === "multi",
    cardinality: occurrence === "multi" ? "0..n" : "0..1",
    required: value.isrequired === "1",
    applicableVersions: allEditions,
    controlledValues: controlledValues(value),
    structuredResource: structureId === null ? null : { id: structureId, requiredMembers: [], cardinality: occurrence === "multi" ? "0..n" : "0..1" },
    validationRules: [
      "preserve-raw-lexical-value",
      occurrence === "multi" ? "repeatable" : "non-repeatable",
      ...(typeof value.IIMmaxbytes === "number" ? ["iim-byte-length"] : []),
      ...(value.dataformat === "uri" || value.dataformat === "url" ? ["absolute-uri"] : []),
      ...(value.dataformat === "date-time" ? ["calendar-date-time"] : []),
      ...(value.datatype === "number" ? ["finite-number"] : []),
      ...(structureId === null ? [] : ["structured-resource"]),
    ],
    sensitivity: ["rights", "licensing", "person", "location"].includes(value.ugtopic) ? "high" : "moderate",
    rawValueBehavior: "Retain exact IIM bytes and the XMP lexical value; report stable diagnostics without coercing invalid values.",
    iimId: value.IIMid ?? null,
    iimName: value.IIMname ?? null,
    iimMaxBytes: typeof value.IIMmaxbytes === "number" ? value.IIMmaxbytes : null,
    xmpId: value.XMPid ?? null,
    namespaceUri: xmp?.namespaceUri ?? null,
    localName: xmp?.localName ?? null,
    mappings: {
      iim: iimMappings(value),
      xmp,
      exif: value.EXIFid ?? null,
      schemaOrg: value.SCHEMAid ?? null,
      exifTool: { xmp: value.etXMP ?? null, iim: value.etIIM ?? null, exif: value.etEXIF ?? null },
    },
    topic: value.ugtopic ?? null,
    sourceDefinition: value,
  };
}

function propertiesFor(document, edition, allEditions) {
  return Object.entries(document.ipmd_top ?? {})
    .filter(([, value]) => value && typeof value === "object" && typeof value.name === "string")
    .map((entry) => projectProperty(entry, edition, allEditions));
}

const properties = propertiesFor(source, "2025.1", ["2025.1"]);
const previousProperties = propertiesFor(previousSource, "2023.1", ["2023.1"]);
const currentIds = new Set(properties.map(({ id }) => id));
const previousIds = new Set(previousProperties.map(({ id }) => id));
const versionDelta = {
  addedIn2025_1: properties.filter(({ id }) => !previousIds.has(id)).map(({ id }) => id),
  removedSince2023_1: previousProperties.filter(({ id }) => !currentIds.has(id)).map(({ id }) => id),
};
for (const property of properties) property.applicableVersions = previousIds.has(property.id) ? ["2023.1", "2025.1"] : ["2025.1"];
for (const property of previousProperties) property.applicableVersions = currentIds.has(property.id) ? ["2023.1", "2025.1"] : ["2023.1"];

function assertUniqueDefinitions(definitions, label) {
  const identities = new Set();
  const xmpMappings = new Set();
  for (const definition of definitions) {
    if (identities.has(definition.stableIdentity)) throw new Error(`Duplicate ${label} stable identity: ${definition.stableIdentity}`);
    identities.add(definition.stableIdentity);
    if (definition.namespaceUri !== null && definition.localName !== null) {
      const key = `${definition.namespaceUri}\u0000${definition.localName}`;
      if (xmpMappings.has(key)) throw new Error(`Contradictory ${label} XMP mapping: ${key}`);
      xmpMappings.add(key);
    }
  }
}

assertUniqueDefinitions(properties, "2025.1 property");
assertUniqueDefinitions(previousProperties, "2023.1 property");

const structures = Object.fromEntries(Object.entries(source.ipmd_struct ?? {}).map(([id, value]) => {
  const members = Object.entries(value)
    .filter(([, member]) => member && typeof member === "object" && typeof member.name === "string")
    .map((entry) => projectProperty(entry, "2025.1", ["2025.1"]));
  assertUniqueDefinitions(members, `structure ${id} member`);
  return [id, { id, stableIdentity: `iptc-pmd-structure:${id}`, members, sourceDefinition: value }];
}));
const provenance = {
  standard: "IPTC Photo Metadata Standard",
  edition: "2025.1",
  url: "https://iptc.org/std/photometadata/specification/iptc-pmd-techreference_2025.1.json",
  documentation: "https://iptc.org/std/photometadata/documentation/techreference",
  releaseComment: source.release_comment,
  releaseTimestamp: source.release_timestamp,
  retrievedAt: "2026-09-12",
  license: "CC BY 4.0",
  sha256: sourceHash,
  previousEdition: "2023.1",
  previousUrl: "https://iptc.org/std/photometadata/specification/iptc-pmd-techreference_2023.1.json",
  previousRetrievedAt: "2026-09-12",
  previousSha256: previousSourceHash,
};
const output = `/** Generated from IPTC Photo Metadata TechReference 2025.1. Do not edit manually. */\n` +
  `export const IPTC_TECHREFERENCE_SOURCE = ${JSON.stringify(provenance)} as const;\n` +
  `export const IPTC_TECHREFERENCE_PROPERTIES = ${JSON.stringify(properties)} as const;\n` +
  `export const IPTC_TECHREFERENCE_PREVIOUS_PROPERTIES = ${JSON.stringify(previousProperties)} as const;\n` +
  `export const IPTC_TECHREFERENCE_VERSION_DELTA = ${JSON.stringify(versionDelta)} as const;\n` +
  `export const IPTC_TECHREFERENCE_STRUCTURES = ${JSON.stringify(structures)} as const;\n`;
if (check) {
  const actual = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : "";
  if (actual !== output) { console.error("Generated IPTC semantic data is stale. Run npm run iptc:generate."); process.exitCode = 1; }
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output);
}
