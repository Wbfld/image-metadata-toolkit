import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const site = join(root, "docs-site");
const generated = join(site, "generated");
const registry = JSON.parse(await readFile(join(root, "data/metadata-registry.json"), "utf8"));
const iptc = JSON.parse(await readFile(join(root, "data/iptc/iptc-pmd-techreference_2025.1.json"), "utf8"));
const iptc2023 = JSON.parse(await readFile(join(root, "data/iptc/iptc-pmd-techreference_2023.1.json"), "utf8"));
const capabilities = JSON.parse(await readFile(join(root, "scripts/capabilities-manifest.json"), "utf8"));
const packageManifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const iccSource = await readFile(join(root, "src/metadata/icc.ts"), "utf8");
const policySource = await readFile(join(root, "src/privacy/policies.ts"), "utf8");

function hash(value) { return createHash("sha256").update(value).digest("hex"); }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}
function iptcEntries(value, parent = "") {
  const entries = [];
  for (const [key, item] of Object.entries(value ?? {})) {
    if (!item || typeof item !== "object") continue;
    if (typeof item.name === "string" && typeof item.datatype === "string") entries.push({
      id: `iptc:${parent || "top"}:${parent ? `${parent}.` : ""}${key}`, key, name: item.name, label: item.label ?? item.name,
      description: item.helptext ?? item.usernotes ?? "", type: item.datatype,
      format: item.dataformat ?? "", cardinality: item.propoccurrence ?? "",
      required: item.isrequired === "1", version: "2025.1", namespace: item.ipmdschema ?? "",
      iim: item.IIMid ?? null, xmp: item.XMPid ?? null,
      minLength: item.IIMminbytes ?? null, maxLength: item.IIMmaxbytes ?? null,
      controlledValues: item.vocab ?? item.controlledvalues ?? null,
      source: "IPTC Photo Metadata Standard 2025.1", parent,
    });
    else entries.push(...iptcEntries(item, parent ? `${parent}.${key}` : key));
  }
  return entries;
}
function extractIccDefinitions(source) {
  const entries = [];
  const object = source.match(/const ICC_FIELD_DEFINITIONS[^=]*=\s*\{([\s\S]*?)\n\};/u)?.[1] ?? "";
  for (const match of object.matchAll(/(0x[0-9a-f]+):\s*\{\s*name:\s*"([^"]+)",\s*description:\s*"([^"]+)"\s*\}/gu)) entries.push({ id: `icc:${match[1]}`, name: match[2], label: match[2], description: match[3], type: "decoded tag", format: "ICC tag payload", cardinality: "single", required: false, version: "ICC.1:2022", source: "ICC.1:2022" });
  const names = source.match(/const names[^=]*=\s*\{([\s\S]*?)\};/u)?.[1] ?? "";
  for (const match of names.matchAll(/(\w+):\s*"([^"]+)"/gu)) entries.push({ id: `icc:${match[1]}`, name: match[2], label: match[2], description: `Decoded ICC ${match[1]} semantic tag payload.`, type: "semantic", format: "typed ICC value", cardinality: "single", required: false, version: "ICC.1:2022", source: "ICC.1:2022" });
  return [...new Map(entries.map((entry) => [entry.id, entry])).values()].sort((a, b) => a.id.localeCompare(b.id));
}
function extractPolicyIds(source) {
  return [...source.matchAll(/"([a-z-]+)":\s*freezePolicy\(\{\s*id:\s*"([a-z-]+)",\s*version:\s*"([^"]+)"/gu)].map((match) => ({ id: match[1], name: match[1], version: match[3], description: `Named immutable privacy policy ${match[1]}.`, source: "src/privacy/policies.ts" }));
}

const XMP_NAMESPACE_URIS = {
  IptcCore: "http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/",
  Iptc4xmpCore: "http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/",
  Iptc4xmpExt: "http://iptc.org/std/Iptc4xmpExt/2008-02-29/",
  photoshop: "http://ns.adobe.com/photoshop/1.0/",
  dc: "http://purl.org/dc/elements/1.1/",
  xmp: "http://ns.adobe.com/xap/1.0/",
  xmpMM: "http://ns.adobe.com/xap/1.0/mm/",
  xmpRights: "http://ns.adobe.com/xap/1.0/rights/",
  plus: "http://ns.useplus.org/ldf/xmp/1.0/",
};

const selectors = [
  { id: "selector:field", name: "Field selector", label: "Exact field", description: "Targets one generated registry field identity and never falls back to a family.", type: "fieldId", format: "registry identity", cardinality: "single", support: "W07 registry-driven selector", source: "src/selection.ts; src/edit.ts" },
  { id: "selector:namespace-property", name: "Namespace/property selector", label: "Namespace URI + local name", description: "Targets an XMP property by namespace URI and local name; prefixes are not identity.", type: "namespaceUri/localName", format: "URI-qualified", cardinality: "single", support: "W07 registry-driven selector", source: "src/edit.ts" },
  { id: "selector:family", name: "Family selector", label: "Metadata family", description: "Targets an explicitly named metadata family when a broad operation is intended.", type: "MetadataGroup", format: "enumerated", cardinality: "single", support: "W07 registry-driven selector", source: "src/edit.ts" },
  { id: "selector:sensitivity", name: "Sensitivity selector", label: "Sensitivity", description: "Targets fields classified at a requested sensitivity level through generated registry coverage.", type: "sensitivity", format: "enumerated", cardinality: "repeatable", support: "W07 registry-driven selector", source: "src/edit.ts" },
  { id: "selector:block", name: "Block selector", label: "Physical block", description: "Targets a physical metadata block while retaining explicit duplicate and provenance semantics.", type: "blockId", format: "provenance identity", cardinality: "single", support: "W07 registry-driven selector", source: "src/edit.ts" },
  { id: "selector:associated-image", name: "Associated-image selector", label: "Associated image", description: "Targets embedded previews, thumbnails, or associated images by typed identity.", type: "associatedImageId", format: "provenance identity", cardinality: "repeatable", support: "W07 registry-driven selector", source: "src/edit.ts" },
  { id: "selector:resource", name: "Structured-resource selector", label: "Nested resource", description: "Targets a nested structured resource without discarding unknown siblings.", type: "resourceId", format: "provenance identity", cardinality: "repeatable", support: "W06/W07 structured metadata", source: "src/edit.ts; src/normalize/iptc.ts" },
];

const capabilitiesPage = [
  ...capabilities.matrixColumns.map((item) => ({ id: `capability:${item.key}`, name: item.label, label: item.label, description: `Capability matrix column for ${item.label}.`, type: "capability", format: "manifest boolean/text", cardinality: "per format", support: "capabilities manifest", source: "scripts/capabilities-manifest.json" })),
  { id: "capability:duplicate-default", name: "Duplicate default", label: "Duplicate default", description: capabilities.outputAdapters.duplicateDefault, type: "policy", format: "enumerated", cardinality: "single", support: "public adapter contract", source: "scripts/capabilities-manifest.json" },
  { id: "capability:adapter-output", name: "Adapter output limit", label: "Adapter output limit", description: `${capabilities.outputAdapters.maxAdapterOutputBytes} bytes`, type: "limit", format: "unsigned integer", cardinality: "single", support: "security limit", source: "scripts/capabilities-manifest.json" },
  { id: "capability:maker-note-registration", name: "MakerNote registration", label: "MakerNote registration", description: capabilities.makerNotePlugins.registration, type: "plugin policy", format: "explicit per operation", cardinality: "single", support: "B07 contract", source: "scripts/capabilities-manifest.json" },
];

const exif = registry.fields.map((field) => ({ id: field.id, name: field.name, label: field.name, description: field.description, type: field.legalTypes.join(" | "), format: field.validation?.kind ?? "standard", minLength: field.count?.min ?? null, maxLength: field.count?.max ?? null, cardinality: field.count?.max === 1 ? "single" : "repeatable", required: false, version: field.version, sensitivity: field.sensitivity, ifd: field.ifd, tag: field.tag, aliases: field.aliases, enumValues: field.enumValues, validation: field.validation, rawBehavior: field.writePolicy, support: "generated EXIF registry", source: "CIPA Exif 3.1" }));
const iptcProperties = iptcEntries(iptc.ipmd_top);
const iptcStructural = iptcEntries(iptc.ipmd_struct, "structured");
const xmp = iptcProperties.map((entry) => {
  const prefix = entry.xmp?.split(":")[0] ?? entry.namespace ?? "unknown";
  const localName = entry.xmp?.split(":").at(-1) ?? entry.key;
  const namespaceUri = XMP_NAMESPACE_URIS[prefix] ?? null;
  return { ...entry, id: `xmp:${namespaceUri ?? prefix}:${localName}`, namespace: prefix, namespaceUri, localName };
});
const icc = extractIccDefinitions(iccSource);
const policies = extractPolicyIds(policySource);
const formats = capabilities.formats.map((item) => ({ format: item.format, read: item.read, selectiveDecode: item.selectiveDecode, redaction: item.redaction, evidence: item.evidence }));

const data = {
  schemaVersion: 1,
  generatedFrom: {
    registry: { path: "data/metadata-registry.json", sha256: hash(JSON.stringify(stable(registry))) },
    iptc2025: { path: "data/iptc/iptc-pmd-techreference_2025.1.json", sha256: hash(JSON.stringify(stable(iptc))), edition: "2025.1", url: iptc.documentation_available_at },
    iptc2023: { path: "data/iptc/iptc-pmd-techreference_2023.1.json", sha256: hash(JSON.stringify(stable(iptc2023))), edition: "2023.1", url: iptc2023.documentation_available_at },
    capabilities: { path: "scripts/capabilities-manifest.json", sha256: hash(JSON.stringify(stable(capabilities))) },
  },
  package: { name: packageManifest.name, version: packageManifest.version },
  exif, iptc: [...iptcProperties, ...iptcStructural], xmp, icc, policies, selectors, capabilities: capabilitiesPage, formats,
  recipes: ["browser", "worker", "node", "deno", "bun", "vite", "next", "react", "serverless"],
};
const siteData = `// Generated by scripts/generate-docs-site.mjs.\nexport default ${JSON.stringify(data, null, 2)};\n`;
const outputs = { [join(generated, "site-data.js")]: siteData, [join(generated, "site-data.json")]: `${JSON.stringify(data, null, 2)}\n` };
const checking = process.argv.includes("--check");
if (!checking) for (const [path, content] of Object.entries(outputs)) await writeFile(path, content);
const registryTemplate = await readFile(join(site, "registry-page.html"), "utf8");
const registryPages = ["exif", "iptc", "xmp", "icc", "policies", "selectors", "capabilities", "formats"];
if (!checking) for (const page of registryPages) await writeFile(join(site, `registry-${page}.html`), registryTemplate);
const generatedAt = `<!-- Generated from pinned repository source data by scripts/generate-docs-site.mjs; data-sha256: ${hash(siteData)} -->`;
const manifest = `${generatedAt}\n# Documentation site\n\n- EXIF entries: ${exif.length}\n- IPTC properties and structures: ${iptcProperties.length + iptcStructural.length}\n- XMP mappings: ${xmp.length}\n- ICC semantics: ${icc.length}\n- Policies: ${policies.length}\n- Selectors: ${selectors.length}\n- Capabilities: ${capabilitiesPage.length}\n- Formats: ${formats.length}\n`;
if (!checking) await writeFile(join(generated, "MANIFEST.md"), manifest);
if (checking) {
  for (const [path, expected] of Object.entries(outputs)) if (await readFile(path, "utf8") !== expected) throw new Error(`Generated documentation data is stale: ${path}`);
  if (await readFile(join(generated, "MANIFEST.md"), "utf8") !== manifest) throw new Error("Generated documentation manifest is stale.");
  for (const page of registryPages) if (await readFile(join(site, `registry-${page}.html`), "utf8") !== registryTemplate) throw new Error(`Generated registry page is stale: ${page}`);
  for (const page of ["index", "registry", "registry-exif", "registry-iptc", "registry-xmp", "registry-icc", "registry-policies", "registry-selectors", "registry-capabilities", "registry-formats", "playground", "fetch-demo", "recipes"]) {
    const html = await readFile(join(site, `${page}.html`), "utf8");
    if (!html.includes("Content-Security-Policy")) throw new Error(`Documentation page lacks CSP: ${page}`);
    if (/<script[^>]+src=["'](?:https?:|\/\/)/u.test(html) || /<link[^>]+href=["'](?:https?:|\/\/)/u.test(html)) throw new Error(`Documentation page has a remote executable/style dependency: ${page}`);
    for (const link of html.matchAll(/(?:href|src)=["']([^"'#]+)["']/gu)) {
      const target = link[1];
      if (target.startsWith("data:") || target.startsWith("blob:")) continue;
      const resolved = resolve(site, target);
      if (!resolved.startsWith(`${root}/`) || !(await readFile(resolved).then(() => true).catch(() => false))) throw new Error(`Documentation link does not resolve: ${page} -> ${target}`);
    }
  }
  for (const [name, entries] of Object.entries({ exif, iptc: [...iptcProperties, ...iptcStructural], xmp, icc, policies, selectors, capabilities: capabilitiesPage, formats })) {
    const ids = entries.map((entry) => entry.id ?? entry.format);
    if (new Set(ids).size !== ids.length) throw new Error(`Generated ${name} registry contains duplicate identities.`);
  }
  const playgroundSource = await readFile(join(site, "playground.js"), "utf8");
  if (playgroundSource.includes("innerHTML") || playgroundSource.includes("document.write")) throw new Error("Playground uses an unsafe HTML sink.");
  console.log(`Documentation data verified: ${exif.length} EXIF, ${iptcProperties.length + iptcStructural.length} IPTC properties/structures, ${xmp.length} XMP, ${icc.length} ICC entries.`);
} else console.log(`Documentation data generated: ${exif.length} EXIF, ${iptcProperties.length + iptcStructural.length} IPTC properties/structures, ${xmp.length} XMP, ${icc.length} ICC entries.`);
