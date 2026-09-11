import { createHash } from "node:crypto";

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
  if (value instanceof Uint8Array) return { type: "bytes", hex: [...value].map((byte) => byte.toString(16).padStart(2, "0")).join("") };
  if (typeof value === "bigint") return Number.isSafeInteger(Number(value)) ? Number(value) : value.toString();
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value * 1e6) / 1e6 : String(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/(?:fired|did not fire)/i.test(trimmed) && /(?:auto|compulsory|suppression)/i.test(trimmed)) return {
      fired: /fired/i.test(trimmed) && !/did not fire/i.test(trimmed),
      mode: /auto/i.test(trimmed) ? "auto" : /suppression/i.test(trimmed) ? "compulsory-suppression" : "compulsory-firing",
      redEyeReduction: /red-eye/i.test(trimmed),
    };
    const fraction = /^([+-]?\d+)\s*\/\s*(\d+)$/.exec(trimmed);
    if (fraction !== null && Number(fraction[2]) !== 0) return Math.round((Number(fraction[1]) / Number(fraction[2])) * 1e6) / 1e6;
    const numericWithUnit = /^([+-]?(?:\d+\.?\d*|\.\d+))(?:\s+[A-Za-z%]+)?$/.exec(trimmed);
    if (numericWithUnit !== null) return Math.round(Number(numericWithUnit[1]) * 1e6) / 1e6;
    if (/^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed.replace(/^([\d]{4}):([\d]{2}):([\d]{2}) /, "$1-$2-$3 ");
    return trimmed.replace(/\s+/g, " ");
  }
  if (Array.isArray(value)) return value.map(normalizedValue).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  if (value !== null && typeof value === "object") {
    if (typeof value.rawValue === "string") return normalizedValue(value.rawValue);
    if (typeof value.fired === "boolean" && typeof value.mode === "string") return { fired: value.fired, mode: value.mode, redEyeReduction: Boolean(value.redEyeReduction) };
    if (typeof value.numerator === "number" && typeof value.denominator === "number" && value.denominator !== 0) return Math.round((value.numerator / value.denominator) * 1e9) / 1e9;
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

function fieldValue(result, name) {
  if (name === "ImageWidth" && result.dimensions !== null) return result.dimensions.width;
  if (name === "ImageLength" && result.dimensions !== null) return result.dimensions.height;
  return result.fields.find((field) => field.name === name)?.value;
}

function xmpValue(result, name) {
  if (result.xmp === null) return undefined;
  const property = name.includes(":") ? name.slice(name.indexOf(":") + 1) : name;
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const packet of result.xmp.packets) {
    const attribute = new RegExp(`(?:[\\w-]+:)?${escaped}\\s*=\\s*["']([^"']*)["']`, "i").exec(packet);
    if (attribute?.[1] !== undefined) return attribute[1];
    const element = new RegExp(`<(?:[\\w-]+:)?${escaped}[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?${escaped}>`, "i").exec(packet);
    if (element?.[1] !== undefined) return element[1].replace(/<[^>]+>/g, "").trim();
  }
  return undefined;
}

function localValue(result, entry) {
  if (entry.family === "XMP") return xmpValue(result, entry.name);
  return fieldValue(result, entry.name);
}

function referenceValue(external, entry) {
  for (const reference of entry.references) if (hasValue(external[reference])) return external[reference];
  return undefined;
}

function externalHasReference(external, references) {
  return Object.keys(external).some((key) => references.some((reference) => key === reference || key.startsWith(`${reference}:`)));
}

function compareValues(local, reference) {
  if (!hasValue(local) && !hasValue(reference)) return "not-observed";
  if (!hasValue(local)) return "missing-local";
  if (!hasValue(reference)) return "missing-reference";
  if (stable(local) === stable(reference)) return "matched";
  if (normalizedStable(local) === normalizedStable(reference)) return "normalized-match";
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
  const local = localValue(result, entry);
  const reference = referenceValue(external, entry);
  const status = compareValues(local, reference);
  return {
    key: entry.name,
    family: entry.family,
    status,
    local: hasValue(local) ? jsonSafe(local) : null,
    reference: hasValue(reference) ? jsonSafe(reference) : null,
    metrics: metricFor(status),
  };
}

function compareBlock(result, external, entry) {
  const local = result.blocks.some((block) => block.family === entry.family);
  const reference = externalHasReference(external, entry.references);
  const status = local === reference ? (local ? "matched" : "not-observed") : local ? "missing-reference" : "missing-local";
  return { key: `block:${entry.family}`, family: entry.family, status, local, reference, metrics: metricFor(status) };
}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function producerFor(result, external) {
  const producer = external.Make ?? result.fields.find((field) => field.name === "Make")?.value;
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

function matchesAllowlist(row, fixture, allowlist) {
  return allowlist.entries.some((entry) =>
    (entry.key === "*" || entry.key === row.key)
    && (entry.status === "*" || entry.status === row.status)
    && (entry.producer === "*" || entry.producer === fixture.producer)
    && (entry.fixture === "*" || entry.fixture === fixture.fixture));
}

export function evaluateGate({ fixtures, minimumFixtures = 100, maxMissingLocalRate = 0.05, allowlist = { entries: [] } }) {
  const failures = [];
  let referencePresent = 0;
  let missingLocal = 0;
  if (fixtures.length < minimumFixtures) failures.push(`Expected at least ${minimumFixtures} fixtures, found ${fixtures.length}.`);
  for (const fixture of fixtures) {
    if (fixture.error !== undefined) failures.push(`${fixture.fixture}: ${fixture.error}`);
    for (const row of fixture.rows) {
      if (row.status === "mismatched" && !matchesAllowlist(row, fixture, allowlist)) failures.push(`${fixture.fixture}: ${row.key} mismatched.`);
      if (["matched", "normalized-match", "mismatched", "missing-local"].includes(row.status)) referencePresent += 1;
      if (row.status === "missing-local" && !matchesAllowlist(row, fixture, allowlist)) missingLocal += 1;
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
