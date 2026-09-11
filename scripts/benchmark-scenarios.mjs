/**
 * Equal-output contracts used by the reproducible competitor benchmark.
 *
 * The libraries expose different raw shapes and names, so each scenario has
 * one small canonical output contract. A timing sample is valid only when all
 * participating readers produce the same canonical JSON.
 */

export const COMMON_EXIF_TAGS = Object.freeze([
  "Make",
  "Model",
  "Orientation",
  "DateTimeOriginal",
  "ExposureTime",
  "FNumber",
  "ISOSpeedRatings",
  "FocalLength",
  "Software",
  "Artist",
  "Copyright",
]);

export const DOCUMENTED_TAGS = Object.freeze([
  ...COMMON_EXIF_TAGS,
  "GPSLatitude",
  "GPSLongitude",
  "GPSAltitude",
  "GPSLatitudeRef",
  "GPSLongitudeRef",
]);

const jpegSelection = Object.freeze({ groups: ["Dimensions", "EXIF"], tags: [...DOCUMENTED_TAGS] });

export const benchmarkScenarios = Object.freeze([
  Object.freeze({
    name: "detection",
    fixture: "jpeg-exif-little-endian.jpg",
    contract: "supported-format",
    operation: "detection",
    options: Object.freeze({}),
  }),
  Object.freeze({
    name: "orientation",
    fixture: "jpeg-exif-little-endian.jpg",
    contract: "orientation",
    operation: "orientation",
    options: Object.freeze({ scope: "metadata", select: { groups: ["Dimensions", "EXIF", "Transform"], tags: ["Orientation"] } }),
  }),
  Object.freeze({
    name: "gps",
    fixture: "jpeg-exif-little-endian.jpg",
    contract: "gps",
    operation: "gps",
    options: Object.freeze({ scope: "metadata", select: { groups: ["EXIF"], tags: ["GPSLatitude", "GPSLatitudeRef", "GPSLongitude", "GPSLongitudeRef", "GPSAltitude", "GPSAltitudeRef"] } }),
  }),
  Object.freeze({
    name: "camera-date",
    fixture: "jpeg-exif-little-endian.jpg",
    contract: "camera-date",
    operation: "camera-date",
    options: Object.freeze({ scope: "metadata", select: { groups: ["EXIF"], tags: ["Make", "Model", "DateTimeOriginal"] } }),
  }),
  Object.freeze({
    name: "all-common-exif",
    fixture: "jpeg-exif-little-endian.jpg",
    contract: "common-exif",
    operation: "common-exif",
    options: Object.freeze({ scope: "metadata", select: jpegSelection }),
  }),
  Object.freeze({
    name: "all-documented-metadata",
    fixture: "jpeg-exif-little-endian.jpg",
    contract: "documented-metadata",
    operation: "documented-metadata",
    options: Object.freeze({}),
  }),
  Object.freeze({
    name: "remote-range-simulation",
    fixture: "jpeg-exif-little-endian.jpg",
    contract: "common-exif",
    operation: "remote-range",
    options: Object.freeze({ scope: "metadata", select: jpegSelection }),
  }),
]);

function valueOf(field) {
  if (field === undefined || field === null) return null;
  if (Array.isArray(field)) return field.length === 1 ? valueOf(field[0]) : field.map(valueOf);
  if (typeof field === "object") {
    if (typeof field.numerator === "number" && typeof field.denominator === "number" && field.denominator !== 0) return field.numerator / field.denominator;
    if (typeof field.decimal === "string") return Number(field.decimal);
    return field;
  }
  return field;
}

function rationalValue(value) {
  if (Array.isArray(value) && value.length >= 2 && value.every((part) => Array.isArray(part) && part.length >= 2)) {
    return value.map((part) => Number(part[0]) / Number(part[1]));
  }
  if (Array.isArray(value) && value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") return value[0] / value[1];
  return valueOf(value);
}

function dms(value, reference) {
  if (!Array.isArray(value) || value.length < 3) return null;
  const parts = value.map((part) => Array.isArray(part) ? Number(part[0]) / Number(part[1]) : Number(part));
  if (parts.some((part) => !Number.isFinite(part))) return null;
  const sign = reference === "S" || reference === "W" ? -1 : 1;
  return sign * (Math.abs(parts[0]) + parts[1] / 60 + parts[2] / 3600);
}

function normalizeDate(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (/^\d{4}:\d{2}:\d{2}(?: |T)/.test(trimmed)) return trimmed.slice(0, 10).replace(/:/g, "-");
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  return trimmed;
}

function normalizeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? Number(value.toFixed(9)) : value;
}

function normalizeValue(name, value, source) {
  if (name === "DateTimeOriginal") return normalizeDate(valueOf(value));
  if (["ExposureTime", "FNumber", "FocalLength", "GPSAltitude"].includes(name)) return normalizeNumber(rationalValue(value));
  if (name === "GPSLatitude" || name === "GPSLongitude") {
    if (source === "exifr") return normalizeNumber(dms(value, name === "GPSLatitude" ? source.referenceLatitude : source.referenceLongitude));
    return normalizeNumber(value);
  }
  if (typeof value === "string") return value.trim();
  return valueOf(value);
}

function fieldMap(result) {
  return new Map([...(result?.exif?.fields ?? []), ...(result?.fields ?? [])].map((field) => [field.name, field.value]));
}

function toolkitFields(result, names) {
  const fields = fieldMap(result);
  return Object.fromEntries(names.map((name) => [name, normalizeValue(name, fields.get(name) ?? null, "toolkit")]));
}

function exifReaderValue(expanded, name) {
  if (name === "GPSLatitude") return expanded?.gps?.Latitude;
  if (name === "GPSLongitude") return expanded?.gps?.Longitude;
  if (name === "GPSAltitude") return expanded?.gps?.Altitude;
  const aliases = { ISOSpeedRatings: "ISOSpeedRatings" };
  const field = expanded?.exif?.[aliases[name] ?? name] ?? expanded?.[aliases[name] ?? name];
  if (field !== undefined) return field.value;
  return undefined;
}

function exifReaderFields(expanded, names) {
  return Object.fromEntries(names.map((name) => [name, normalizeValue(name, exifReaderValue(expanded, name) ?? null, "exifreader")]));
}

function exifrValue(parsed, name) {
  const aliases = { ISOSpeedRatings: "ISO" };
  return parsed?.[aliases[name] ?? name];
}

function exifrFields(parsed, names) {
  const latitudeReference = parsed?.GPSLatitudeRef;
  const longitudeReference = parsed?.GPSLongitudeRef;
  return Object.fromEntries(names.map((name) => {
    const value = exifrValue(parsed, name);
    if (name === "GPSLatitude") return [name, normalizeNumber(dms(value, latitudeReference))];
    if (name === "GPSLongitude") return [name, normalizeNumber(dms(value, longitudeReference))];
    if (name === "Orientation" && typeof value === "string") {
      const namesByValue = { "Horizontal (normal)": 1, "Mirror horizontal": 2, "Rotate 180": 3, "Mirror vertical": 4, "Mirror horizontal and rotate 270 CW": 5, "Rotate 90 CW": 6, "Mirror horizontal and rotate 90 CW": 7, "Rotate 270 CW": 8 };
      return [name, namesByValue[value] ?? null];
    }
    return [name, normalizeValue(name, value ?? null, "exifr")];
  }));
}

function documentedFields(fields) {
  return fields;
}

export function canonicalToolkit(result, scenario) {
  if (scenario.operation === "detection") return { supported: result.format !== "unknown" };
  if (scenario.operation === "orientation") return { value: result.fields.find((field) => field.name === "Orientation")?.value ?? null };
  if (scenario.operation === "gps") return toolkitFields(result, ["GPSLatitude", "GPSLongitude", "GPSAltitude"]);
  if (scenario.operation === "camera-date") return toolkitFields(result, ["Make", "Model", "DateTimeOriginal"]);
  if (scenario.operation === "common-exif" || scenario.operation === "remote-range") return toolkitFields(result, COMMON_EXIF_TAGS);
  return { fields: documentedFields(toolkitFields(result, DOCUMENTED_TAGS)) };
}

export function canonicalExifReader(result, scenario) {
  if (scenario.operation === "detection") return { supported: result?.FileType?.value !== undefined || result?.file?.FileType?.value !== undefined };
  if (scenario.operation === "orientation") return { value: result?.exif?.Orientation?.value ?? null };
  if (scenario.operation === "gps") return exifReaderFields(result, ["GPSLatitude", "GPSLongitude", "GPSAltitude"]);
  if (scenario.operation === "camera-date") return exifReaderFields(result, ["Make", "Model", "DateTimeOriginal"]);
  if (scenario.operation === "common-exif" || scenario.operation === "remote-range") return exifReaderFields(result, COMMON_EXIF_TAGS);
  return { fields: documentedFields(exifReaderFields(result, DOCUMENTED_TAGS)) };
}

export function canonicalExifr(result, scenario) {
  if (scenario.operation === "detection") return { supported: result !== null && result !== undefined };
  if (scenario.operation === "orientation") {
    const names = { "Horizontal (normal)": 1, "Mirror horizontal": 2, "Rotate 180": 3, "Mirror vertical": 4, "Mirror horizontal and rotate 270 CW": 5, "Rotate 90 CW": 6, "Mirror horizontal and rotate 90 CW": 7, "Rotate 270 CW": 8 };
    return { value: typeof result === "number" ? result : names[result] ?? null };
  }
  if (scenario.operation === "gps") return { GPSLatitude: normalizeNumber(result?.latitude ?? null), GPSLongitude: normalizeNumber(result?.longitude ?? null), GPSAltitude: normalizeNumber(result?.GPSAltitude ?? null) };
  if (scenario.operation === "camera-date") return exifrFields(result, ["Make", "Model", "DateTimeOriginal"]);
  if (scenario.operation === "common-exif" || scenario.operation === "remote-range") return exifrFields(result, COMMON_EXIF_TAGS);
  return { fields: documentedFields(exifrFields(result, DOCUMENTED_TAGS)) };
}

export function stableJson(value) {
  return JSON.stringify(value, (_key, entry) => entry instanceof Uint8Array ? [...entry] : entry);
}

export function semanticDiff(expected, actual) {
  const left = stableJson(expected);
  const right = stableJson(actual);
  return left === right ? null : { expected, actual };
}

export function assertScenarioContract(outputs) {
  const names = Object.keys(outputs);
  if (names.length === 0) return { passed: false, failures: ["No competitor outputs were produced."] };
  const baselineName = names[0];
  const baseline = outputs[baselineName];
  const failures = [];
  for (const name of names.slice(1)) {
    const difference = semanticDiff(baseline, outputs[name]);
    if (difference !== null) failures.push(`${name} differs from ${baselineName}: ${stableJson(difference)}`);
  }
  return { passed: failures.length === 0, failures, baseline: baselineName };
}
