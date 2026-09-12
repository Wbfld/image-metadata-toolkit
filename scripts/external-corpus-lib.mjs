import { createHash } from "node:crypto";
import { TextDecoder } from "node:util";

export const REPORT_SCHEMA = "browser-image-metadata.external-report.v1";
export const METRIC_KEYS = ["found", "matched", "normalizedMatch", "mismatched", "missingLocal", "missingReference"];

export function validateRegistry(registry) {
  if (registry?.schema !== "browser-image-metadata.external-registry.v1" || !Number.isSafeInteger(registry.version) || registry.version < 1 || !Array.isArray(registry.fields) || !Array.isArray(registry.blocks)) throw new Error("External registry schema is invalid.");
  const keys = new Set();
  for (const entry of registry.fields) {
    if (typeof entry.name !== "string" || entry.name.length === 0 || keys.has(entry.name) || typeof entry.family !== "string" || entry.family.length === 0 || !Array.isArray(entry.references) || entry.references.length === 0 || entry.references.some((reference) => typeof reference !== "string" || reference.length === 0)) throw new Error(`External registry entry ${entry.name ?? "unknown"} is invalid.`);
    keys.add(entry.name);
  }
  const families = new Set();
  for (const entry of registry.blocks) {
    if (typeof entry.family !== "string" || entry.family.length === 0 || families.has(entry.family) || !Array.isArray(entry.references) || entry.references.length === 0 || entry.references.some((reference) => typeof reference !== "string" || reference.length === 0)) throw new Error(`External block registry entry ${entry.family ?? "unknown"} is invalid.`);
    families.add(entry.family);
  }
  return registry;
}

export function validateAllowlist(allowlist) {
  if (allowlist?.schema !== "browser-image-metadata.external-allowlist.v1" || !Number.isSafeInteger(allowlist.version) || allowlist.version < 1 || !Array.isArray(allowlist.entries)) throw new Error("External allowlist schema is invalid.");
  for (const entry of allowlist.entries) {
    const issueUrl = entry.issueUrl ?? entry.issue;
    const expiryVersion = entry.expiryVersion ?? entry.expires;
    if (typeof entry.key !== "string" || typeof entry.status !== "string" || typeof entry.producer !== "string" || typeof entry.fixture !== "string" || typeof issueUrl !== "string" || !/^https?:\/\//.test(issueUrl) || typeof expiryVersion !== "string" || !/^\d+\.\d+\.\d+$/.test(expiryVersion)) throw new Error("Every external allowlist entry requires key, status, scope, issue URL, and semver expiry.");
  }
  return allowlist;
}

function emptyMetrics() {
  return Object.fromEntries(METRIC_KEYS.map((key) => [key, 0]));
}

function hasValue(value) {
  return value !== undefined && value !== null;
}

function jsonSafe(value) {
  if (value instanceof Uint8Array) return { type: "bytes", hex: [...value].map((byte) => byte.toString(16).padStart(2, "0")).join("") };
  if (typeof value === "bigint") return { type: "bigint", decimal: value.toString() };
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (value !== null && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, jsonSafe(value[key])]));
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value * 1e9) / 1e9;
  return value;
}

function normalizedValue(value) {
  if (value instanceof Uint8Array) {
    const withoutNul = [...value].filter((byte, index, bytes) => byte !== 0 || index < bytes.findLastIndex((candidate) => candidate !== 0));
    if (withoutNul.length > 0 && withoutNul.every((byte) => byte >= 0x20 && byte <= 0x7e)) return normalizedValue(String.fromCharCode(...withoutNul).trim());
    return normalizedValue([...value]);
  }
  if (typeof value === "bigint") return Number.isSafeInteger(Number(value)) ? Number(value) : value.toString();
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value * 1e8) / 1e8 : String(value);
  if (typeof value === "string") {
    const trimmed = value.split("\0", 1)[0].trim();
    if (/(?:fired|did not fire)/i.test(trimmed) && /(?:auto|compulsory|suppression)/i.test(trimmed)) return {
      fired: /fired/i.test(trimmed) && !/did not fire/i.test(trimmed),
      mode: /auto/i.test(trimmed) ? "auto" : /suppression/i.test(trimmed) ? "compulsory-suppression" : "compulsory-firing",
      redEyeReduction: /red-eye/i.test(trimmed),
    };
    const fraction = /^([+-]?\d+)\s*\/\s*(\d+)$/.exec(trimmed);
    if (fraction !== null && Number(fraction[2]) !== 0) return normalizedValue(Number(fraction[1]) / Number(fraction[2]));
    if (/^[+-]?(?:\d+\.?\d*|\.\d+)(?:\s+[+-]?(?:\d+\.?\d*|\.\d+))+$/.test(trimmed)) return trimmed.split(/\s+/).map((part) => normalizedValue(Number(part)));
    if (/^\d{8}$/.test(trimmed)) return trimmed.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3");
    const numericWithUnit = /^([+-]?(?:\d+\.?\d*|\.\d+))(?:\s+[A-Za-z%]+)?$/.exec(trimmed);
    if (numericWithUnit !== null) return normalizedValue(Number(numericWithUnit[1]));
    if (/^\d{4}:\d{2}:\d{2}(?:[ T].*)?$/.test(trimmed)) return trimmed.replace(/^(\d{4}):(\d{2}):(\d{2})(?: |T)?/, "$1-$2-$3T").replace(/T$/, "");
    if (/^\d{4}-\d{2}-\d{2} /.test(trimmed)) return trimmed.replace(" ", "T");
    const collapsed = trimmed.replace(/\s+/g, " ");
    try {
      const repaired = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(collapsed, (character) => character.charCodeAt(0)));
      return repaired.includes("�") ? collapsed : repaired;
    } catch {
      return collapsed;
    }
  }
  if (Array.isArray(value)) {
    const normalized = value.map(normalizedValue);
    return normalized.length === 1 ? normalized[0] : normalized;
  }
  if (value !== null && typeof value === "object") {
    if (typeof value.rawValue === "string") return normalizedValue(value.rawValue);
    if (typeof value.computed === "number") return normalizedValue(value.computed);
    if (typeof value.fired === "boolean" && typeof value.mode === "string") return { fired: value.fired, mode: value.mode, redEyeReduction: Boolean(value.redEyeReduction) };
    if (typeof value.numerator === "number" && typeof value.denominator === "number" && value.denominator !== 0) return normalizedValue(value.numerator / value.denominator);
    if (typeof value.decimal === "string") return normalizedValue(value.decimal);
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalizedValue(value[key])]));
  }
  return value;
}

function stable(value) {
  return JSON.stringify(jsonSafe(value));
}

function normalizedStable(value) {
  return JSON.stringify(normalizedValue(value));
}

function semanticallyEqual(left, right) {
  if (typeof left === "number" && typeof right === "number") {
    return Math.abs(left - right) <= Math.max(1e-8, Math.max(Math.abs(left), Math.abs(right)) * 1e-7);
  }
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((value, index) => semanticallyEqual(value, right[index]));
  }
  if (left !== null && right !== null && typeof left === "object" && typeof right === "object") {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    return leftKeys.length === rightKeys.length
      && leftKeys.every((key, index) => key === rightKeys[index] && semanticallyEqual(left[key], right[key]));
  }
  return Object.is(left, right);
}

function uniqueValues(values) {
  const seen = new Set();
  return values.filter((value) => {
    if (!hasValue(value)) return false;
    const key = stable(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fieldValues(result, name, family) {
  if (family === "DIMENSIONS") {
    if (result.dimensions === null) return [];
    return name === "width" ? [result.dimensions.width] : name === "height" ? [result.dimensions.height] : [];
  }
  const decoded = family === "EXIF"
    ? result.exif?.fields ?? []
    : result.fields.filter((field) => field.ifd === family);
  const normalized = result.fields.filter((field) => field.name === name && field.ifd !== "ICC");
  const fields = [...decoded.filter((field) => field.name === name), ...normalized];
  const values = fields.flatMap((field) => [field.value, field.raw]);
  if (family === "IPTC" && fields.length > 1) values.unshift(uniqueValues(fields.map((field) => field.value)));
  if (/^GPS(?:Latitude|Longitude|DestLatitude|DestLongitude)$/.test(name)) {
    for (const value of [...values]) {
      if (typeof value === "number") values.push(Math.abs(value));
      if (Array.isArray(value) && value.length === 3) {
        const components = value.map((part) => normalizedValue(part));
        if (components.every((part) => typeof part === "number")) values.push(Math.abs(components[0] + components[1] / 60 + components[2] / 3600));
      }
    }
  }
  if (name === "GPSTimeStamp") {
    for (const value of [...values]) {
      if (!Array.isArray(value) || value.length !== 3) continue;
      const components = value.map((part) => normalizedValue(part));
      if (!components.every((part) => typeof part === "number")) continue;
      const seconds = components[2].toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
      const [whole = "0", fraction] = seconds.split(".");
      values.push(`${String(components[0]).padStart(2, "0")}:${String(components[1]).padStart(2, "0")}:${whole.padStart(2, "0")}${fraction === undefined ? "" : `.${fraction}`}`);
    }
  }
  if (name === "CFAPattern") {
    for (const value of [...values]) {
      if (!(value instanceof Uint8Array) || value.length < 4) continue;
      values.push([(value[0] << 8) | value[1], (value[2] << 8) | value[3], ...value.subarray(4)]);
    }
  }
  if (["JPEGInterchangeFormat", "StripOffsets"].includes(name) && result.format === "jpeg") {
    const exifOffset = result.blocks.find((block) => block.family === "EXIF")?.offset;
    if (typeof exifOffset === "number") {
      for (const value of [...values]) {
        if (typeof value === "number") values.push(value + exifOffset + 10);
        else if (Array.isArray(value) && value.every((part) => typeof part === "number")) values.push(value.map((part) => part + exifOffset + 10));
      }
    }
  }
  return uniqueValues(values);
}

function decodeXml(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function xmpValue(result, name) {
  if (result.xmp === null) return undefined;
  const qualified = /^XMP-([^:]+):(.+)$/.exec(name);
  const prefix = qualified?.[1];
  const property = qualified?.[2] ?? (name.includes(":") ? name.slice(name.indexOf(":") + 1) : name);
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const qualifiedName = prefix === undefined ? `(?:[\\w-]+:)?${escaped}` : `${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:${escaped}`;
  for (const packet of result.xmp.packets) {
    const attribute = new RegExp(`${qualifiedName}\\s*=\\s*["']([^"']*)["']`, "i").exec(packet);
    if (attribute?.[1] !== undefined) return decodeXml(attribute[1]);
    const element = new RegExp(`<${qualifiedName}[^>]*>([\\s\\S]*?)</${qualifiedName}>`, "i").exec(packet);
    if (element?.[1] !== undefined) {
      const items = [...element[1].matchAll(/<rdf:li(?:\s[^>]*)?>([\s\S]*?)<\/rdf:li>/gi)]
        .map((match) => decodeXml(match[1].replace(/<[^>]+>/g, "").trim()));
      if (items.length > 0) return property.toLowerCase() === "creator" ? items : items[0];
      return decodeXml(element[1].replace(/<[^>]+>/g, "").trim());
    }
  }
  return undefined;
}

function localValues(result, entry) {
  if (entry.family === "XMP") {
    const value = xmpValue(result, entry.name);
    return hasValue(value) ? [value] : [];
  }
  return fieldValues(result, entry.name, entry.family);
}

const EXIF_GROUPS = /^(?:IFD0|IFD1|ExifIFD|GPS|InteropIFD|SubIFD\d*)$/i;

function groupMatches(family, group) {
  if (family === "EXIF") return EXIF_GROUPS.test(group);
  if (family === "XMP") return /^XMP(?:-|$)/i.test(group);
  if (family === "IPTC") return /^IPTC$/i.test(group);
  if (family === "DIMENSIONS") return /^File$/i.test(group);
  if (family === "ICC") return /^ICC/i.test(group);
  if (family === "JFIF") return /^JFIF$/i.test(group);
  return group.toLowerCase() === family.toLowerCase();
}

function referenceNames(reference) {
  const parts = reference.split(":");
  return new Set([reference.toLowerCase(), (parts.at(-1) ?? reference).toLowerCase()]);
}

function referenceValue(external, entry) {
  const entries = Object.entries(external);
  const grouped = entries.some(([key]) => key.includes(":"));
  for (const reference of entry.references) {
    const names = referenceNames(reference);
    for (const [key, value] of entries) {
      if (!hasValue(value)) continue;
      const separator = key.indexOf(":");
      if (separator < 0) {
        if (!grouped && names.has(key.toLowerCase())) return value;
        continue;
      }
      const group = key.slice(0, separator);
      const tag = key.slice(separator + 1).toLowerCase();
      if (groupMatches(entry.family, group) && names.has(tag)) return value;
    }
  }
  return undefined;
}

function externalHasFamily(external, entry) {
  const keys = Object.keys(external);
  const grouped = keys.some((key) => key.includes(":"));
  if (!grouped) return entry.references.some((reference) => hasValue(external[reference]));
  return keys.some((key) => {
    const separator = key.indexOf(":");
    return separator > 0 && groupMatches(entry.family, key.slice(0, separator));
  });
}

function compareValues(locals, reference) {
  if (locals.length === 0 && !hasValue(reference)) return "not-observed";
  if (locals.length === 0) return "missing-local";
  if (!hasValue(reference)) return "missing-reference";
  if (reference !== null && typeof reference === "object" && typeof reference.rawValue === "string" && /^\(Binary data \d+ bytes?/.test(reference.rawValue)) return "normalized-match";
  if (locals.some((local) => stable(local) === stable(reference))) return "matched";
  const normalizedReference = normalizedValue(reference);
  if (normalizedReference === "" && !locals.some((local) => normalizedValue(local) === "")) return "missing-reference";
  if (locals.some((local) => normalizedStable(local) === JSON.stringify(normalizedReference)
    || semanticallyEqual(normalizedValue(local), normalizedReference))) return "normalized-match";
  return "mismatched";
}

function metricFor(status) {
  const metrics = emptyMetrics();
  if (status === "not-observed") return metrics;
  if (status === "matched" || status === "normalized-match" || status === "mismatched" || status === "missing-reference") metrics.found = 1;
  if (status === "matched") metrics.matched = 1;
  if (status === "normalized-match") metrics.normalizedMatch = 1;
  if (status === "mismatched") metrics.mismatched = 1;
  if (status === "missing-local") metrics.missingLocal = 1;
  if (status === "missing-reference") metrics.missingReference = 1;
  return metrics;
}

function compareEntry(result, external, entry) {
  const locals = localValues(result, entry);
  const reference = referenceValue(external, entry);
  const status = compareValues(locals, reference);
  return {
    key: entry.name,
    family: entry.family,
    status,
    local: locals.length > 0 ? jsonSafe(locals[0]) : null,
    ...(locals.length > 1 ? { localCandidates: locals.map(jsonSafe) } : {}),
    reference: hasValue(reference) ? jsonSafe(reference) : null,
    metrics: metricFor(status),
  };
}

function compareBlock(result, external, entry) {
  const local = result.blocks.some((block) => block.family === entry.family);
  const reference = externalHasFamily(external, entry);
  const status = local === reference ? (local ? "matched" : "not-observed") : local ? "missing-reference" : "missing-local";
  return { key: `block:${entry.family}`, family: entry.family, status, local, reference, metrics: metricFor(status) };
}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function producerFor(result, external) {
  const producer = referenceValue(external, { family: "EXIF", references: ["Make"] })
    ?? result.fields.find((field) => field.name === "Make")?.value;
  return hasValue(producer) ? String(producer).trim() || "unknown" : "unknown";
}

export function compareFixture({ relativePath, hash, bytes, result, external, registry }) {
  const rows = registry.fields.map((entry) => compareEntry(result, external, entry));
  rows.push(...registry.blocks.map((entry) => compareBlock(result, external, entry)));
  return {
    fixture: relativePath,
    sha256: hash ?? sha256(bytes),
    format: result.format,
    producer: producerFor(result, external),
    localBlocks: result.blocks.map((block) => block.family),
    warningCount: result.warnings.length,
    rows,
  };
}

function addMetrics(target, metrics) {
  for (const key of METRIC_KEYS) target[key] += metrics[key] ?? 0;
}

export function summarize(fixtures) {
  const byTag = new Map();
  const byProducer = new Map();
  for (const fixture of fixtures) {
    for (const row of fixture.rows) {
      const tagKey = row.key;
      if (!byTag.has(tagKey)) byTag.set(tagKey, { key: tagKey, family: row.family, ...emptyMetrics() });
      addMetrics(byTag.get(tagKey), row.metrics);
      const producerKey = `${fixture.producer}\u0000${tagKey}`;
      if (!byProducer.has(producerKey)) byProducer.set(producerKey, { producer: fixture.producer, key: tagKey, family: row.family, ...emptyMetrics() });
      addMetrics(byProducer.get(producerKey), row.metrics);
    }
  }
  const totals = emptyMetrics();
  for (const item of byTag.values()) addMetrics(totals, item);
  return { totals, byTag: [...byTag.values()].sort((a, b) => a.key.localeCompare(b.key)), byProducer: [...byProducer.values()].sort((a, b) => a.producer.localeCompare(b.producer) || a.key.localeCompare(b.key)) };
}

function semverAtLeast(version, minimum) {
  const parse = (value) => {
    const [core = "", prerelease] = value.replace(/^v/, "").split("-", 2);
    return { core: core.split(".").map(Number), prerelease };
  };
  const left = parse(version);
  const right = parse(minimum);
  for (let index = 0; index < 3; index += 1) {
    if ((left.core[index] ?? 0) !== (right.core[index] ?? 0)) return (left.core[index] ?? 0) > (right.core[index] ?? 0);
  }
  if (left.prerelease !== undefined && right.prerelease === undefined) return false;
  if (left.prerelease === undefined && right.prerelease !== undefined) return true;
  return (left.prerelease ?? "") >= (right.prerelease ?? "");
}

function matchesAllowlist(row, fixture, allowlist, currentVersion) {
  return allowlist.entries.some((entry) =>
    (currentVersion === undefined || !semverAtLeast(currentVersion, entry.expiryVersion ?? entry.expires))
    &&
    (entry.key === "*" || entry.key === row.key)
    && (entry.status === "*" || entry.status === row.status)
    && (entry.producer === "*" || entry.producer === fixture.producer)
    && (entry.fixture === "*" || entry.fixture === fixture.fixture));
}

export function evaluateGate({ fixtures, minimumFixtures = 100, maxMissingLocalRate = 0.05, allowlist = { entries: [] }, currentVersion }) {
  const failures = [];
  let referencePresent = 0;
  let missingLocal = 0;
  if (fixtures.length < minimumFixtures) failures.push(`Expected at least ${minimumFixtures} fixtures, found ${fixtures.length}.`);
  for (const fixture of fixtures) {
    if (fixture.error !== undefined) failures.push(`${fixture.fixture}: ${fixture.error}`);
    for (const row of fixture.rows) {
      if (row.status === "mismatched" && !matchesAllowlist(row, fixture, allowlist, currentVersion)) failures.push(`${fixture.fixture}: ${row.key} mismatched.`);
      if (["matched", "normalized-match", "mismatched", "missing-local"].includes(row.status)) referencePresent += 1;
      if (row.status === "missing-local" && !matchesAllowlist(row, fixture, allowlist, currentVersion)) missingLocal += 1;
    }
  }
  const missingRate = referencePresent === 0 ? 0 : missingLocal / referencePresent;
  if (missingRate > maxMissingLocalRate) failures.push(`Missing-local rate ${(missingRate * 100).toFixed(2)}% exceeds ${(maxMissingLocalRate * 100).toFixed(2)}% threshold.`);
  return { passed: failures.length === 0, failures, missingLocalRate: missingRate, maxMissingLocalRate, minimumFixtures };
}

export function renderMarkdown(report) {
  const lines = [
    "# External corpus differential report",
    "",
    `- Schema: \`${report.schema}\``,
    `- Fixtures: ${report.corpus.fixtureCount} (minimum ${report.gate.minimumFixtures})`,
    `- Gate: **${report.gate.passed ? "PASS" : "FAIL"}**`,
    `- Missing-local rate: ${(report.gate.missingLocalRate * 100).toFixed(2)}% (maximum ${(report.gate.maxMissingLocalRate * 100).toFixed(2)}%)`,
    "",
    "## Totals",
    "",
    "| found | matched | normalized-match | mismatched | missing-local | missing-reference |",
    "| ---: | ---: | ---: | ---: | ---: | ---: |",
    `| ${report.summary.totals.found} | ${report.summary.totals.matched} | ${report.summary.totals.normalizedMatch} | ${report.summary.totals.mismatched} | ${report.summary.totals.missingLocal} | ${report.summary.totals.missingReference} |`,
    "",
    "## Per-tag results",
    "",
    "| tag | family | found | matched | normalized | mismatched | missing local | missing reference |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...report.summary.byTag.map((item) => `| ${item.key} | ${item.family} | ${item.found} | ${item.matched} | ${item.normalizedMatch} | ${item.mismatched} | ${item.missingLocal} | ${item.missingReference} |`),
    "",
    "## Per-producer results",
    "",
    "| producer | tag | family | found | matched | normalized | mismatched | missing local | missing reference |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...report.summary.byProducer.map((item) => `| ${item.producer} | ${item.key} | ${item.family} | ${item.found} | ${item.matched} | ${item.normalizedMatch} | ${item.mismatched} | ${item.missingLocal} | ${item.missingReference} |`),
    "",
    "## Fixture hashes",
    "",
    "| fixture | SHA-256 | format | producer |",
    "| --- | --- | --- | --- |",
    ...report.fixtures.map((fixture) => `| ${fixture.fixture} | \`${fixture.sha256}\` | ${fixture.format ?? "error"} | ${fixture.producer ?? "unknown"} |`),
  ];
  if (report.gate.failures.length > 0) lines.push("", "## Gate failures", "", ...report.gate.failures.map((failure) => `- ${failure}`));
  return `${lines.join("\n")}\n`;
}
