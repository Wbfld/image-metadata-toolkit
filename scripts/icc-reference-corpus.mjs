import crypto from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { exiftool } from "exiftool-vendored";

const root = resolve(new URL("..", import.meta.url).pathname);
const corpusDirectoryValue = process.env.ICC_REFERENCE_CORPUS_DIR;
const outputDirectory = resolve(root, process.env.ICC_REFERENCE_CORPUS_OUTPUT_DIR ?? "reports");
const basePath = resolve(process.env.ICC_REFERENCE_BASE_IMAGE ?? join(root, "tests/fixtures/jpeg-exif-little-endian.jpg"));
const manifestPath = join(root, "data/icc/reference-corpus.json");
const maxProfiles = Number(process.env.ICC_REFERENCE_MAX_PROFILES ?? 128);
const minimumProfiles = Number(process.env.ICC_REFERENCE_MIN_PROFILES ?? 10);
const minimumComparableValues = Number(process.env.ICC_REFERENCE_MIN_COMPARABLE_VALUES ?? 100);
const expectedExifToolVersion = "13.42";
const expectedVendoredPackageVersion = "33.5.0";

const NORMALIZATION_POLICY = {
  localizedStrings: "Compare one decoded ICC text/MLUC record with ExifTool's selected string; preserve and report every parser MLUC record; multi-record values are non-comparable because ExifTool does not expose the complete array.",
  fixedPoint: "Round independently decoded XYZ and other fixed-point numeric values to five decimal places before comparison; preserve the parser's decoded values and curve hashes in the row evidence.",
  signatures: "Trim ICC four-character padding for comparison, but retain the parser signature/type signature in the row evidence. Known CMM, technology, and profile-class labels are mapped to their ICC signatures.",
  curves: "Compare the independently exposed ICC tag byte length. ExifTool exposes TRC payloads as opaque BinaryField values in this corpus, so curve form, gamma, and sampled-curve characteristics are explicitly non-comparable, never matches.",
  arrays: "Preserve array order in parser evidence. No first/last convenience selection is used; an array is comparable only when the oracle exposes the same ordered structure.",
  dates: "Compare the ICC local creation timestamp as YYYY-MM-DDTHH:mm:ss with ExifTool's YYYY:MM:DD HH:mm:ss raw value; ICC has no timezone field.",
};

const ICC_CLASS_SIGNATURES = new Map([
  ["Input Device Profile", "scnr"],
  ["Display Device Profile", "mntr"],
  ["Output Device Profile", "prtr"],
  ["DeviceLink Profile", "link"],
  ["ColorSpace Conversion Profile", "spac"],
  ["Abstract Profile", "abst"],
  ["Named Color Profile", "nmcl"],
]);

const CMM_SIGNATURES = new Map([["Apple Computer Inc.", "appl"], ["Adobe Systems Inc.", "ADBE"], ["Linotronic", "Lino"]]);

const TECHNOLOGY_SIGNATURES = new Map([
  ["Cathode Ray Tube Display", "CRT"],
  ["Video Monitor", "vidm"],
  ["Output Monitor", "moni"],
  ["Image Scanner", "scnr"],
  ["Film Scanner", "fscn"],
  ["Video Camera", "vidc"],
  ["Still Camera", "stca"],
  ["Digital Camera", "dcam"],
  ["Projection Television", "pjtv"],
  ["Video Projector", "pjpr"],
  ["Film Writer", "fprn"],
  ["Video Printer", "vidp"],
  ["Electrophotographic Printer", "epho"],
  ["Electrostatic Printer", "esta"],
  ["Dye Sublimation Printer", "dsub"],
  ["Photographic Paper Printer", "rpho"],
  ["Film Recorder", "frec"],
  ["Digital Imaging Device", "dcam"],
  ["Offset Lithography", "offs"],
  ["Gravure", "grav"],
  ["Flexography", "flex"],
  ["Motion Picture Film Scanner", "mpfs"],
  ["Motion Picture Film Recorder", "mpfr"],
  ["Digital Cinema Projector", "dcpj"],
]);

const OBSERVER_SIGNATURES = new Map([["Unknown", 0], ["CIE 1931", 1], ["CIE 1964", 2]]);
const GEOMETRY_SIGNATURES = new Map([["Unknown", 0], ["0°:45° or 45°:0°", 1], ["0°:d or d:0°", 2]]);
const ILLUMINANT_SIGNATURES = new Map([["Unknown", 0], ["D50", 1], ["D65", 2], ["D93", 3], ["F2", 4], ["D55", 5], ["A", 6], ["Equi-Power (E)", 7], ["F8", 8]]);

function requireSafePositive(name, value) {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${name} must be a positive safe integer.`);
  return value;
}

requireSafePositive("ICC_REFERENCE_MAX_PROFILES", maxProfiles);
requireSafePositive("ICC_REFERENCE_MIN_PROFILES", minimumProfiles);
requireSafePositive("ICC_REFERENCE_MIN_COMPARABLE_VALUES", minimumComparableValues);

if (typeof corpusDirectoryValue !== "string" || corpusDirectoryValue.trim().length === 0) {
  throw new Error("ICC reference corpus was not examined: set ICC_REFERENCE_CORPUS_DIR to the hash-pinned corpus directory.");
}
const corpusDirectory = resolve(corpusDirectoryValue);

const profileExtensions = new Set([".icc", ".icm"]);

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return files(path);
    return profileExtensions.has(extname(entry.name).toLowerCase()) ? [path] : [];
  }));
  return nested.flat().sort();
}

function sha256(bytes) { return crypto.createHash("sha256").update(bytes).digest("hex"); }
function stable(value) { return JSON.stringify(value); }
function present(value) { return value !== undefined && value !== null; }
function normalizeText(value) { return typeof value === "string" ? value.trim().replace(/\s+/gu, " ") : null; }
function roundFixed(value) { return Number.isFinite(value) ? Object.is(Math.round(value * 100000) / 100000, -0) ? 0 : Math.round(value * 100000) / 100000 : null; }
function signature(value) { return typeof value === "string" ? value.replace(/\0/gu, "").trim() : null; }

function parseNumericTuple(value) {
  if (Array.isArray(value)) {
    if (!value.every((item) => typeof item === "number" && Number.isFinite(item))) return null;
    return value.map(roundFixed);
  }
  if (typeof value !== "string") return null;
  const parts = value.trim().split(/\s+/u).filter(Boolean);
  const numbers = parts.map(Number);
  return parts.length > 0 && numbers.every(Number.isFinite) ? numbers.map(roundFixed) : null;
}

function xyz(value) {
  if (value?.kind === "xyz" && Array.isArray(value.values)) {
    if (!value.values.every((item) => typeof item?.x === "number" && typeof item?.y === "number" && typeof item?.z === "number")) return null;
    return value.values.map((item) => ({ x: roundFixed(item.x), y: roundFixed(item.y), z: roundFixed(item.z) }));
  }
  if (value && typeof value === "object" && typeof value.x === "number" && typeof value.y === "number" && typeof value.z === "number") return [{ x: roundFixed(value.x), y: roundFixed(value.y), z: roundFixed(value.z) }];
  const tuple = parseNumericTuple(value);
  return tuple?.length === 3 ? [{ x: tuple[0], y: tuple[1], z: tuple[2] }] : null;
}

function localized(value) {
  if (value?.kind === "text") return normalizeText(value.text);
  if (value?.kind === "mluc" && Array.isArray(value.values) && value.values.length === 1) return normalizeText(value.values[0]?.text);
  if (typeof value === "string") return normalizeText(value.replace(/^[A-Za-z]{2}(?:-[A-Za-z]{2})?:/u, ""));
  return null;
}

function normalizeNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return roundFixed(value);
  if (typeof value === "string" && value.trim().length > 0 && Number.isFinite(Number(value))) return roundFixed(Number(value));
  return null;
}

function normalizeVersion(value) {
  if (typeof value === "string") {
    const match = /^(\d+)\.(\d+)\.(\d+)/u.exec(value.trim());
    return match === null ? null : `${match[1]}.${match[2]}.${match[3]}`;
  }
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) return null;
  return `${value >>> 24}.${(value >>> 20) & 0x0f}.${(value >>> 16) & 0x0f}`;
}

function normalizeClass(value) {
  const direct = signature(value);
  if (direct !== null && direct.length === 4) return direct;
  return ICC_CLASS_SIGNATURES.get(normalizeText(value) ?? "") ?? null;
}

function normalizeCmm(value) {
  const direct = signature(value);
  if (direct !== null && direct.length === 4) return direct;
  return CMM_SIGNATURES.get(normalizeText(value) ?? "") ?? null;
}

function normalizeTechnology(value) {
  if (value?.kind === "signature") return signature(value.value?.signature);
  const direct = signature(value);
  if (direct !== null && direct.length === 4) return direct;
  return TECHNOLOGY_SIGNATURES.get(normalizeText(value) ?? "") ?? null;
}

function normalizeDate(value) {
  const raw = typeof value === "object" && value !== null && typeof value.rawValue === "string" ? value.rawValue : typeof value === "string" ? value : null;
  if (raw === null) return null;
  const match = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/u.exec(raw.trim()) ?? /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/u.exec(raw.trim());
  return match === null ? null : `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}`;
}

function normalizeFlare(value) {
  if (typeof value === "string" && value.trim().endsWith("%")) return normalizeNumber(value.trim().slice(0, -1)) === null ? null : roundFixed(Number(value.trim().slice(0, -1)) / 100);
  return normalizeNumber(value);
}

function normalizeEnum(value, labels) {
  if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  return labels.get(normalizeText(value) ?? "") ?? null;
}

function isBinaryField(value) {
  return value && typeof value === "object" && (value.constructor?.name === "BinaryField" || value._ctor === "BinaryField") && Number.isSafeInteger(value.bytes);
}

function binaryBytes(value) {
  return isBinaryField(value) ? value.bytes : null;
}

function normalizedValue(raw, normalizer) {
  try { return normalizer(raw); } catch { return null; }
}

function rawSummary(value) {
  if (!present(value)) return null;
  if (value?.kind !== undefined) return summarizeDecoded(value);
  if (isBinaryField(value)) return { kind: "opaque-binary", bytes: value.bytes };
  if (value?.rawValue !== undefined) return value.rawValue;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  return "unsupported-value";
}

function compareValues(key, parserRaw, oracleRaw, normalizer, reasonWhenUnsupported = "unsupported-by-independent-oracle") {
  const parserPresent = present(parserRaw);
  const oraclePresent = present(oracleRaw);
  const parserNormalized = normalizedValue(parserRaw, normalizer);
  const oracleNormalized = normalizedValue(oracleRaw, normalizer);
  let status = "non-comparable";
  let reason = reasonWhenUnsupported;
  if (!parserPresent || !oraclePresent) reason = !parserPresent && !oraclePresent ? "missing-from-both" : !parserPresent ? "missing-from-parser" : "missing-from-oracle";
  else if (parserNormalized !== null && oracleNormalized !== null) {
    status = stable(parserNormalized) === stable(oracleNormalized) ? "matched" : "mismatched";
    reason = status === "matched" ? null : "normalized-values-differ";
  }
  return {
    key,
    status,
    reason,
    parserPresent,
    oraclePresent,
    parser: parserNormalized ?? rawSummary(parserRaw),
    oracle: oracleNormalized ?? rawSummary(oracleRaw),
    normalized: parserNormalized !== null && oracleNormalized !== null,
  };
}

function summarizeDecoded(value) {
  if (!present(value)) return null;
  if (value.kind === "text") return { kind: "text", text: value.text, encoding: value.encoding, ...(value.asciiText === undefined ? {} : { asciiText: value.asciiText }), ...(value.unicodeText === undefined ? {} : { unicodeText: value.unicodeText }), ...(value.scriptCode === undefined ? {} : { scriptCode: value.scriptCode }) };
  if (value.kind === "mluc") return { kind: "mluc", values: value.values.map((item) => ({ language: item.language, country: item.country, text: item.text })) };
  if (value.kind === "xyz") return { kind: "xyz", values: value.values.map((item) => ({ x: roundFixed(item.x), y: roundFixed(item.y), z: roundFixed(item.z) })) };
  if (value.kind === "curve") {
    const samples = value.samples ?? [];
    return { kind: "curve", form: value.form, ...(value.gamma === undefined ? {} : { gamma: roundFixed(value.gamma) }), ...(value.samples === undefined ? {} : { sampleCount: samples.length, first: samples[0] ?? null, last: samples.at(-1) ?? null, minimum: Math.min(...samples), maximum: Math.max(...samples), samplesSha256: sha256(Buffer.from(JSON.stringify(samples), "utf8")) }) };
  }
  if (value.kind === "parametric-curve") return { kind: value.kind, functionType: value.functionType, parameters: value.parameters.map(roundFixed) };
  if (value.kind === "matrix") return { kind: value.kind, count: value.values.length, valuesSha256: sha256(Buffer.from(JSON.stringify(value.values.map(roundFixed)), "utf8")) };
  if (value.kind === "measurement") return { kind: value.kind, value: { ...value.value, backing: xyz(value.value.backing)?.[0] ?? null } };
  if (value.kind === "viewing-conditions") return { kind: value.kind, value: { ...value.value, illuminant: xyz(value.value.illuminant)?.[0] ?? null, surround: xyz(value.value.surround)?.[0] ?? null } };
  if (value.kind === "lut") return { kind: value.kind, value: value.value };
  return { kind: value.kind, value: value.value };
}

function app2(payload) {
  if (payload.length > 65_533) throw new Error(`ICC APP2 payload is too large: ${payload.length} bytes`);
  const segment = Buffer.alloc(payload.length + 4);
  segment[0] = 0xff;
  segment[1] = 0xe2;
  segment.writeUInt16BE(payload.length + 2, 2);
  payload.copy(segment, 4);
  return segment;
}

function jpegWithIcc(baseImage, profile) {
  const identifier = Buffer.from("ICC_PROFILE\0", "ascii");
  const maxChunk = 60_000 - identifier.length - 2;
  const total = Math.ceil(profile.length / maxChunk);
  if (total < 1 || total > 255) throw new Error(`ICC profile cannot be represented in APP2 chunks: ${profile.length} bytes`);
  const segments = [];
  for (let index = 0; index < total; index += 1) {
    const part = profile.subarray(index * maxChunk, Math.min(profile.length, (index + 1) * maxChunk));
    segments.push(app2(Buffer.concat([identifier, Buffer.from([index + 1, total]), part])));
  }
  let scan = 2;
  while (scan + 1 < baseImage.length && !(baseImage[scan] === 0xff && baseImage[scan + 1] === 0xda)) scan += 1;
  if (scan + 1 >= baseImage.length) throw new Error("Base ICC reference image has no JPEG scan marker.");
  return Buffer.concat([baseImage.subarray(0, scan), ...segments, baseImage.subarray(scan)]);
}

function fieldMap(result) {
  return new Map((result.fields ?? []).filter((item) => item.ifd === "ICC").map((item) => [item.name, item.value]));
}

function tagMap(result) {
  return new Map((result.icc?.decodedTags ?? []).map((item) => [item.signature, item]));
}

function tagValue(tags, tagName) {
  const tag = tags.get(tagName);
  return tag?.status === "decoded" ? tag.value : undefined;
}

function tagEntry(result, tagName) {
  return (result.icc?.tags ?? []).find((item) => item.signature === tagName);
}

function oracleWarnings(oracle) {
  return ["Warning", "Error"].filter((name) => present(oracle[name])).map((name) => ({ name, value: rawSummary(oracle[name]) }));
}

function oracleSnapshot(oracle) {
  const names = [
    "ProfileCMMType", "ProfileVersion", "ProfileClass", "ColorSpaceData", "ProfileConnectionSpace", "ProfileFileSignature", "ProfileDateTime",
    "ProfileDescription", "ProfileCopyright", "MediaWhitePoint", "RedMatrixColumn", "GreenMatrixColumn", "BlueMatrixColumn", "GrayMatrixColumn",
    "RedTRC", "GreenTRC", "BlueTRC", "GrayTRC", "Technology", "MeasurementObserver", "MeasurementBacking", "MeasurementGeometry", "MeasurementFlare",
    "MeasurementIlluminant", "ViewingCondDescription", "ViewingCondIlluminant", "ViewingCondSurround", "ViewingCondIlluminantType", "ColorantOrder",
    "AToB0", "AToB1", "AToB2", "BToA0", "BToA1", "BToA2",
  ];
  return Object.fromEntries(names.filter((name) => present(oracle[name])).map((name) => [name, rawSummary(oracle[name])]));
}

function addComparison(comparisons, key, parserRaw, oracleRaw, normalizer, reason) {
  comparisons.push(compareValues(key, parserRaw, oracleRaw, normalizer, reason));
}

function makeComparisons(result, oracle) {
  const fields = fieldMap(result);
  const tags = tagMap(result);
  const comparisons = [];
  const field = (name) => fields.get(name);
  const add = (key, parserRaw, oracleRaw, normalizer, reason) => addComparison(comparisons, key, parserRaw, oracleRaw, normalizer, reason);

  add("header.cmmType", field("CMMType"), oracle.ProfileCMMType, normalizeCmm);
  add("header.version", field("ProfileVersion"), oracle.ProfileVersion, normalizeVersion);
  add("header.class", field("DeviceClass"), oracle.ProfileClass, normalizeClass);
  add("header.colorSpace", field("ColorSpace"), oracle.ColorSpaceData, signature);
  add("header.pcs", field("PCS"), oracle.ProfileConnectionSpace, signature);
  add("header.creationDate", field("ProfileDate"), oracle.ProfileDateTime, normalizeDate);
  add("description", tagValue(tags, "desc"), oracle.ProfileDescription, localized);
  add("copyright", tagValue(tags, "cprt"), oracle.ProfileCopyright, localized);
  add("media.whitePoint", tagValue(tags, "wtpt"), oracle.MediaWhitePoint, xyz);

  const colorants = [
    ["red", "rXYZ", "RedMatrixColumn"],
    ["green", "gXYZ", "GreenMatrixColumn"],
    ["blue", "bXYZ", "BlueMatrixColumn"],
    ["gray", "kXYZ", "GrayMatrixColumn"],
  ];
  for (const [name, parserTag, oracleName] of colorants) {
    if (tags.has(parserTag) || present(oracle[oracleName])) add(`colorant.${name}`, tagValue(tags, parserTag), oracle[oracleName], xyz);
  }

  const trcs = [
    ["red", "rTRC", "RedTRC"],
    ["green", "gTRC", "GreenTRC"],
    ["blue", "bTRC", "BlueTRC"],
    ["gray", "kTRC", "GrayTRC"],
  ];
  for (const [name, parserTag, oracleName] of trcs) {
    const parserTagEntry = tagEntry(result, parserTag);
    if (!parserTagEntry && !present(oracle[oracleName])) continue;
    const parserCurve = tagValue(tags, parserTag);
    add(`trc.${name}.payloadBytes`, parserTagEntry?.byteLength, binaryBytes(oracle[oracleName]), normalizeNumber);
    add(`trc.${name}.form`, parserCurve, oracle[oracleName], () => null);
    add(`trc.${name}.characteristics`, parserCurve, oracle[oracleName], () => null);
  }

  const technology = tagValue(tags, "tech");
  if (tags.has("tech") || present(oracle.Technology)) add("technology.signature", technology, oracle.Technology, normalizeTechnology);

  const measurement = tagValue(tags, "meas")?.value;
  const hasMeasurementOracle = ["MeasurementObserver", "MeasurementBacking", "MeasurementGeometry", "MeasurementFlare", "MeasurementIlluminant"].some((name) => present(oracle[name]));
  if (measurement !== undefined || hasMeasurementOracle) {
    add("measurement.observer", measurement?.observer, oracle.MeasurementObserver, (value) => normalizeEnum(value, OBSERVER_SIGNATURES));
    add("measurement.backing", measurement?.backing, oracle.MeasurementBacking, xyz);
    add("measurement.geometry", measurement?.geometry, oracle.MeasurementGeometry, (value) => normalizeEnum(value, GEOMETRY_SIGNATURES));
    add("measurement.flare", measurement?.flare, oracle.MeasurementFlare, normalizeFlare);
    add("measurement.illuminant", measurement?.illuminant, oracle.MeasurementIlluminant, (value) => normalizeEnum(value, ILLUMINANT_SIGNATURES));
  }

  const viewing = tagValue(tags, "view")?.value;
  if (viewing !== undefined || present(oracle.ViewingCondIlluminant) || present(oracle.ViewingCondSurround) || present(oracle.ViewingCondIlluminantType)) {
    add("viewing.illuminant", viewing?.illuminant, oracle.ViewingCondIlluminant, xyz);
    add("viewing.surround", viewing?.surround, oracle.ViewingCondSurround, xyz);
    add("viewing.illuminantType", viewing?.illuminantType, oracle.ViewingCondIlluminantType, (value) => normalizeEnum(value, ILLUMINANT_SIGNATURES));
  }

  const colorantOrder = tagValue(tags, "clro")?.value;
  if (colorantOrder !== undefined || present(oracle.ColorantOrder)) add("colorant.order", colorantOrder?.order ?? colorantOrder, oracle.ColorantOrder, (value) => Array.isArray(value) ? value : parseNumericTuple(value));

  const lutFields = { A2B0: "AToB0", A2B1: "AToB1", A2B2: "AToB2", B2A0: "BToA0", B2A1: "BToA1", B2A2: "BToA2" };
  for (const [parserTag, oracleName] of Object.entries(lutFields)) {
    const parserTagEntry = tagEntry(result, parserTag);
    if (!parserTagEntry && !present(oracle[oracleName])) continue;
    add(`lut.${parserTag}.payloadBytes`, parserTagEntry?.byteLength, binaryBytes(oracle[oracleName]), normalizeNumber);
    add(`lut.${parserTag}.structure`, tagValue(tags, parserTag), oracle[oracleName], () => null);
  }
  return comparisons;
}

function countComparisons(comparisons) {
  const empty = () => ({ found: 0, comparable: 0, matched: 0, exactMatch: 0, normalizedMatch: 0, mismatched: 0, nonComparable: 0, missingParser: 0, missingOracle: 0 });
  const counts = empty();
  const byField = {};
  for (const comparison of comparisons) {
    const target = byField[comparison.key] ?? (byField[comparison.key] = empty());
    for (const bucket of [counts, target]) {
      if (comparison.parserPresent && comparison.oraclePresent) bucket.found += 1;
      if (comparison.status === "matched" || comparison.status === "mismatched") bucket.comparable += 1;
      if (comparison.status === "matched") { bucket.matched += 1; if (comparison.normalized) bucket.normalizedMatch += 1; else bucket.exactMatch += 1; }
      if (comparison.status === "mismatched") bucket.mismatched += 1;
      if (comparison.status === "non-comparable") bucket.nonComparable += 1;
      if (!comparison.parserPresent) bucket.missingParser += 1;
      if (!comparison.oraclePresent) bucket.missingOracle += 1;
    }
  }
  return { counts, byField };
}

function parserSnapshot(result) {
  const tags = (result.icc?.decodedTags ?? []).map((tag) => ({
    signature: tag.signature,
    typeSignature: tag.typeSignature,
    offset: tag.offset,
    byteLength: tag.byteLength,
    status: tag.status,
    sharedWith: tag.sharedWith,
    ...(tag.value === null ? {} : { value: summarizeDecoded(tag.value) }),
  }));
  const statusCounts = Object.fromEntries(["decoded", "unknown", "malformed", "limited"].map((status) => [status, tags.filter((tag) => tag.status === status).length]));
  return { complete: result.icc?.complete === true, tagCount: result.icc?.tags?.length ?? 0, decodedTagCount: tags.length, statusCounts, tags };
}

function collectRows(result, oracle, entry, path, profile) {
  const comparisons = makeComparisons(result, oracle);
  const { counts, byField } = countComparisons(comparisons);
  return {
    file: entry.file,
    sourcePath: relative(corpusDirectory, path).split("\\").join("/"),
    profileBytes: profile.length,
    sha256: sha256(profile),
    parser: parserSnapshot(result),
    oracle: oracleSnapshot(oracle),
    oracleWarnings: oracleWarnings(oracle),
    comparisons,
    counts,
    byField,
    warnings: result.warnings,
  };
}

function aggregateRows(rows) {
  const empty = () => ({ found: 0, comparable: 0, matched: 0, exactMatch: 0, normalizedMatch: 0, mismatched: 0, nonComparable: 0, missingParser: 0, missingOracle: 0 });
  const counts = empty();
  const byField = {};
  const byColorSpace = {};
  for (const row of rows) {
    for (const key of Object.keys(counts)) counts[key] += row.counts[key] ?? 0;
    for (const [field, fieldCounts] of Object.entries(row.byField)) {
      const target = byField[field] ?? (byField[field] = empty());
      for (const key of Object.keys(target)) target[key] += fieldCounts[key] ?? 0;
    }
    const colorSpace = row.comparisons.find((comparison) => comparison.key === "header.colorSpace")?.parser ?? "unknown";
    const target = byColorSpace[colorSpace] ?? (byColorSpace[colorSpace] = empty());
    for (const key of Object.keys(target)) target[key] += row.counts[key] ?? 0;
  }
  return { counts, byField, byColorSpace };
}

function markdownReport(report) {
  const lines = [
    "# ICC semantic differential evidence",
    "",
    `Status: **${report.status}**`,
    "",
    `Generated: ${report.generatedAt}`,
    `Profiles examined: ${report.corpus.count} (minimum ${report.thresholds.minimumProfiles})`,
    `Comparable values: ${report.counts.comparable} (minimum ${report.thresholds.minimumComparableValues})`,
    `Mismatches: ${report.counts.mismatched} (maximum ${report.thresholds.maximumMismatches})`,
    `Parser warnings: ${report.rows.reduce((sum, row) => sum + row.warnings.length, 0)}; oracle warnings: ${report.rows.reduce((sum, row) => sum + row.oracleWarnings.length, 0)}`,
    "",
    "## Provenance",
    "",
    `- Implementation under test: ${report.reference.implementationUnderTest}`,
    `- Independent oracle: ${report.reference.oracle.name} ${report.reference.oracle.version} via ${report.reference.oracle.package} ${report.reference.oracle.packageVersion}`,
    `- Oracle license: ${report.reference.oracle.license}`,
    `- Corpus manifest: ${report.reference.corpusManifest}`,
    "- Profile hashes: recorded in JSON for every examined fixture; profile bytes are not copied into this report.",
    "",
    "## Counts",
    "",
    "| found | comparable | matched | exact | normalized-match | mismatched | non-comparable | missing parser | missing oracle |",
    "| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    `| ${report.counts.found} | ${report.counts.comparable} | ${report.counts.matched} | ${report.counts.exactMatch} | ${report.counts.normalizedMatch} | ${report.counts.mismatched} | ${report.counts.nonComparable} | ${report.counts.missingParser} | ${report.counts.missingOracle} |`,
    "",
    "## Profile results",
    "",
    "| profile | bytes | SHA-256 | complete | parser warnings | oracle warnings | comparable | matched | non-comparable | mismatched |",
    "| --- | ---: | --- | :---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...report.rows.map((row) => `| ${row.file.replace(/\|/gu, "\\|")} | ${row.profileBytes} | \`${row.sha256}\` | ${row.parser.complete ? "yes" : "no"} | ${row.warnings.length} | ${row.oracleWarnings.length} | ${row.counts.comparable} | ${row.counts.matched} | ${row.counts.nonComparable} | ${row.counts.mismatched} |`),
    "",
    "## Normalization and non-comparable values",
    "",
    ...Object.entries(report.normalization).map(([key, value]) => `- **${key}:** ${value}`),
    "",
    "Non-comparable values are explicit observations, not matches. In particular, TRC curve form/gamma/sample comparisons are non-comparable when ExifTool exposes only an opaque binary field; the independently compared structural byte length remains a separate value.",
    "",
    "## Failures",
    "",
    ...(report.failures.length === 0 ? ["None."] : report.failures.map((failure) => `- ${failure}`)),
    "",
  ];
  return lines.join("\n");
}

async function main() {
  let manifest;
  try { manifest = JSON.parse(await readFile(manifestPath, "utf8")); } catch (error) { throw new Error(`ICC reference corpus manifest could not be read: ${error.message}`); }
  if (!Array.isArray(manifest.profiles) || manifest.profiles.length < minimumProfiles) throw new Error(`ICC reference corpus manifest contains fewer than ${minimumProfiles} profiles.`);
  if (manifest.profiles.length > maxProfiles) throw new Error(`ICC reference run would be partial: max profile limit ${maxProfiles} is below the pinned corpus size ${manifest.profiles.length}.`);
  try { if (!(await stat(corpusDirectory)).isDirectory()) throw new Error("not a directory"); } catch (error) { throw new Error(`ICC reference corpus directory is missing or unreadable: ${corpusDirectory} (${error.message})`); }
  const discovered = await files(corpusDirectory);
  if (discovered.length === 0) throw new Error(`ICC reference corpus contains no .icc or .icm profiles: ${corpusDirectory}`);
  const entries = manifest.profiles;
  const seenFiles = new Set();
  const profilePaths = [];
  for (const entry of entries) {
    if (typeof entry?.file !== "string" || !/^[^/\\][^/\\]*(?:[\\/][^/\\]+)*$/u.test(entry.file) || seenFiles.has(entry.file)) throw new Error("ICC reference corpus manifest contains an invalid or duplicate profile path.");
    if (!/^[0-9a-f]{64}$/u.test(entry.sha256 ?? "")) throw new Error(`ICC reference corpus manifest has an invalid SHA-256 for ${entry.file}.`);
    seenFiles.add(entry.file);
    const path = resolve(corpusDirectory, entry.file);
    if (!path.startsWith(`${corpusDirectory}/`) && path !== corpusDirectory) throw new Error(`ICC reference corpus profile escapes the corpus directory: ${entry.file}`);
    try { if (!(await stat(path)).isFile()) throw new Error("not a file"); } catch (error) { throw new Error(`Pinned ICC profile is missing or unreadable: ${entry.file} (${error.message})`); }
    profilePaths.push({ entry, path });
  }
  if (profilePaths.length !== entries.length || profilePaths.some(({ entry }) => !discovered.some((path) => relative(corpusDirectory, path).split("\\").join("/") === entry.file))) throw new Error("ICC reference corpus was only partially examined: every pinned profile must be present.");
  const baseImage = await readFile(basePath);
  const packageManifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  const manifestBytes = await readFile(manifestPath);
  const toolVersion = await exiftool.version();
  if (toolVersion !== expectedExifToolVersion) throw new Error(`Pinned ExifTool version mismatch: expected ${expectedExifToolVersion}, got ${toolVersion}.`);
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "image-metadata-toolkit-icc-"));
  const rows = [];
  try {
    const { parseMetadata } = await import(join(root, "dist/index.js"));
    for (let index = 0; index < profilePaths.length; index += 1) {
      const { entry, path } = profilePaths[index];
      const profile = await readFile(path);
      const actualHash = sha256(profile);
      if (actualHash !== entry.sha256) throw new Error(`ICC profile hash mismatch for ${entry.file}: expected ${entry.sha256}, got ${actualHash}.`);
      const wrapped = jpegWithIcc(baseImage, profile);
      const wrappedPath = join(temporaryDirectory, `${index}.jpg`);
      await writeFile(wrappedPath, wrapped);
      // The standards-based decoder runs first. ExifTool is used only as an
      // independent output oracle for the same profile after this parse.
      const result = await parseMetadata(wrapped, { select: { groups: ["ICC"] } });
      const oracle = await exiftool.read(path);
      rows.push(collectRows(result, oracle, entry, path, profile));
    }
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
    await exiftool.end();
  }

  const aggregate = aggregateRows(rows);
  const failures = [];
  if (rows.length < minimumProfiles) failures.push(`profile count ${rows.length} is below minimum ${minimumProfiles}`);
  if (aggregate.counts.comparable < minimumComparableValues) failures.push(`comparable value count ${aggregate.counts.comparable} is below minimum ${minimumComparableValues}`);
  if (aggregate.counts.mismatched > 0) failures.push(`${aggregate.counts.mismatched} unexpected semantic mismatches`);
  const incomplete = rows.filter((row) => !row.parser.complete).map((row) => row.file);
  if (incomplete.length > 0) failures.push(`incomplete parser results: ${incomplete.join(", ")}`);
  const report = {
    schema: "browser-image-metadata/icc-reference-report@2",
    status: failures.length === 0 ? "pass" : "fail",
    generatedAt: new Date().toISOString(),
    reference: {
      standard: "ICC.1:2022",
      implementationUnderTest: "browser-image-metadata standards-based ICC.1:2022 decoder",
      oracle: {
        name: "ExifTool",
        version: toolVersion,
        package: "exiftool-vendored",
        packageVersion: packageManifest.devDependencies?.["exiftool-vendored"] ?? expectedVendoredPackageVersion,
        license: "ExifTool: Perl Artistic License or GPL-1.0-or-later; exiftool-vendored.js: MIT",
        provenance: ["https://exiftool.org/", "https://github.com/photostructure/exiftool-vendored.js"],
      },
      corpusManifest: relative(root, manifestPath),
      corpusManifestSha256: sha256(manifestBytes),
      baseImage: relative(root, basePath),
    },
    corpus: { directory: "local-opt-in", count: rows.length, pinnedCount: entries.length, discoveredCount: discovered.length, complete: rows.length === entries.length },
    thresholds: { minimumProfiles, minimumComparableValues, maximumMismatches: 0, requireCompleteProfiles: true },
    normalization: NORMALIZATION_POLICY,
    package: { name: packageManifest.name, version: packageManifest.version },
    counts: aggregate.counts,
    byField: aggregate.byField,
    byColorSpace: aggregate.byColorSpace,
    failures,
    rows,
  };
  await mkdir(outputDirectory, { recursive: true });
  const jsonPath = join(outputDirectory, "icc-reference-report.json");
  const markdownPath = join(outputDirectory, "icc-reference-report.md");
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdownPath, markdownReport(report));
  if (failures.length > 0) {
    console.error(`ICC semantic reference corpus failed. Reports: ${jsonPath}, ${markdownPath}`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  } else {
    console.log(`ICC semantic reference corpus passed: ${rows.length} profiles, ${aggregate.counts.comparable} comparable values. Reports: ${jsonPath}, ${markdownPath}`);
  }
}

try {
  await main();
} catch (error) {
  console.error(`ICC semantic reference corpus failed before completion: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
