import type {
  ApexValue,
  ExifDataType,
  FlashValue,
  GpsCoordinateRaw,
  MetadataField,
  MetadataValue,
  MetadataWarning,
  RationalValue,
  Sensitivity,
} from "../types.js";
import {
  describeFlash,
  describeOrientation,
  getTagDefinition,
} from "./descriptions.js";

export interface NormalizationResult {
  readonly fields: readonly MetadataField[];
  readonly warnings: readonly MetadataWarning[];
}

export function isRational(value: MetadataValue): value is RationalValue {
  return isRationalUnknown(value);
}

function isRationalUnknown(value: unknown): value is RationalValue {
  if (typeof value !== "object" || value === null || Array.isArray(value) || value instanceof Uint8Array) {
    return false;
  }
  const candidate = value as { readonly numerator?: unknown; readonly denominator?: unknown };
  return (
    typeof candidate.numerator === "number" &&
    typeof candidate.denominator === "number"
  );
}

export function isRationalArray(value: MetadataValue): value is readonly RationalValue[] {
  if (!Array.isArray(value)) return false;
  const components = value as readonly unknown[];
  return components.every(isRationalUnknown);
}

export function rationalToNumber(value: RationalValue): number | null {
  if (value.denominator === 0) return null;
  const result = value.numerator / value.denominator;
  return Number.isFinite(result) ? result : null;
}

export function formatExactRational(value: RationalValue): string {
  return `${value.numerator}/${value.denominator}`;
}

export function decodeFlash(code: number): FlashValue {
  const returnBits = (code >>> 1) & 0x03;
  const modeBits = (code >>> 3) & 0x03;
  const returnStatus: FlashValue["returnStatus"] =
    returnBits === 0
      ? "not-supported"
      : returnBits === 2
        ? "not-detected"
        : returnBits === 3
          ? "detected"
          : "reserved";
  const mode: FlashValue["mode"] =
    modeBits === 1
      ? "compulsory-firing"
      : modeBits === 2
        ? "compulsory-suppression"
        : modeBits === 3
          ? "auto"
          : "unknown";

  return {
    code,
    fired: (code & 0x01) !== 0,
    returnStatus,
    mode,
    functionPresent: (code & 0x20) === 0,
    redEyeReduction: (code & 0x40) !== 0,
  };
}

/** Interpret tags whose EXIF encoding carries semantics beyond the TIFF scalar. */
export function interpretExifValue(
  ifd: string,
  tag: number,
  raw: MetadataValue,
  type?: ExifDataType,
): MetadataValue {
  if (
    ifd === "ExifIFD" &&
    tag === 0x9209 &&
    (type === undefined || type === "SHORT") &&
    typeof raw === "number" &&
    Number.isInteger(raw)
  ) {
    return decodeFlash(raw);
  }

  if (ifd === "ExifIFD" && isRational(raw)) {
    const apexNumber = rationalToNumber(raw);
    if (apexNumber === null) return raw;
    if (tag === 0x9201 && (type === undefined || type === "SRATIONAL")) {
      const computed = 2 ** -apexNumber;
      return Number.isFinite(computed) && computed > 0 ? apex(raw, computed, "seconds") : raw;
    }
    if ((tag === 0x9202 || tag === 0x9205) && (type === undefined || type === "RATIONAL")) {
      const computed = 2 ** (apexNumber / 2);
      return Number.isFinite(computed) && computed > 0 ? apex(raw, computed, "f-number") : raw;
    }
    if ((tag === 0x9203 || tag === 0x9204) && (type === undefined || type === "SRATIONAL")) {
      return apex(raw, apexNumber, "ev");
    }
  }
  return raw;
}

export function displayExifValue(
  ifd: string,
  tag: number,
  raw: MetadataValue,
  value: MetadataValue,
): string {
  if (ifd === "IFD0" && tag === 0x0112 && typeof raw === "number") {
    return describeOrientation(raw);
  }
  if (isFlashValue(value)) return describeFlash(value);
  if (isApexValue(value)) return displayApex(value);
  if (isRational(raw)) return formatExactRational(raw);
  if (isRationalArray(raw)) return raw.map(formatExactRational).join(", ");
  if (raw instanceof Uint8Array) return displayBytes(raw);
  if (Array.isArray(raw)) return displayArray(raw);
  if (typeof raw === "string") return raw.split("\0").join(" / ");
  if (raw === null) return "";
  if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
  return "Composite metadata value";
}

export function normalizeExifFields(rawFields: readonly MetadataField[]): NormalizationResult {
  const fields: MetadataField[] = [];
  const warnings: MetadataWarning[] = [];
  const byLocation = indexFields(rawFields);

  normalizeString(byLocation, fields, warnings, "IFD0", 0x010f, "Make", "low");
  normalizeString(byLocation, fields, warnings, "IFD0", 0x0110, "Model", "low");
  normalizeOrientation(byLocation, fields, warnings);
  normalizeDate(byLocation, fields, warnings, "IFD0", 0x0132, "DateTime");
  normalizeDate(byLocation, fields, warnings, "ExifIFD", 0x9003, "DateTimeOriginal");
  normalizePositiveRational(byLocation, fields, warnings, 0x829a, "ExposureTime", "seconds");
  normalizePositiveRational(byLocation, fields, warnings, 0x829d, "FNumber", "f-number");
  normalizeIso(byLocation, fields, warnings);
  normalizeFlash(byLocation, fields, warnings);
  normalizePositiveRational(byLocation, fields, warnings, 0x920a, "FocalLength", "millimetres");
  normalizeGpsCoordinate(byLocation, fields, warnings, "latitude");
  normalizeGpsCoordinate(byLocation, fields, warnings, "longitude");
  normalizeGpsAltitude(byLocation, fields, warnings);
  normalizeString(byLocation, fields, warnings, "IFD0", 0x8298, "Copyright", "moderate", true);
  normalizeString(byLocation, fields, warnings, "IFD0", 0x013b, "Artist", "moderate");
  normalizeString(byLocation, fields, warnings, "IFD0", 0x0131, "Software", "moderate");

  return { fields, warnings };
}

function apex(apexValue: RationalValue, computed: number, unit: ApexValue["unit"]): ApexValue {
  return { apex: apexValue, computed, unit };
}

function isFlashValue(value: MetadataValue): value is FlashValue {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Uint8Array) &&
    "fired" in value &&
    "returnStatus" in value
  );
}

function isApexValue(value: MetadataValue): value is ApexValue {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Uint8Array) &&
    "apex" in value &&
    "computed" in value &&
    "unit" in value
  );
}

function displayApex(value: ApexValue): string {
  const encoded = formatExactRational(value.apex);
  if (value.unit === "seconds") {
    const seconds = formatNumber(value.computed, 8);
    return `${seconds} s (APEX ${encoded})`;
  }
  if (value.unit === "f-number") {
    return `f/${formatNumber(value.computed, 4)} (APEX ${encoded})`;
  }
  return `${formatNumber(value.computed, 4)} EV (APEX ${encoded})`;
}

function displayBytes(value: Uint8Array): string {
  const shown = value.subarray(0, 32);
  const text = Array.from(shown, (byte) => byte.toString(16).padStart(2, "0")).join(" ");
  return value.length > shown.length ? `${text} … (${value.length} bytes)` : text;
}

function displayArray(value: readonly unknown[]): string {
  const shown = value.slice(0, 16).map((item) => {
    if (isRational(item as MetadataValue)) return formatExactRational(item as RationalValue);
    return String(item);
  });
  return value.length > shown.length ? `${shown.join(", ")}, … (${value.length} values)` : shown.join(", ");
}

function formatNumber(value: number, precision = 6): string {
  if (!Number.isFinite(value)) return String(value);
  if (Object.is(value, -0)) return "0";
  return Number(value.toFixed(precision)).toString();
}

type FieldIndex = ReadonlyMap<string, readonly MetadataField[]>;

function indexFields(fields: readonly MetadataField[]): FieldIndex {
  const index = new Map<string, MetadataField[]>();
  for (const field of fields) {
    const key = locationKey(field.ifd, field.tag);
    const existing = index.get(key);
    if (existing === undefined) index.set(key, [field]);
    else existing.push(field);
  }
  return index;
}

function locationKey(ifd: string, tag: number): string {
  return `${ifd}:${tag}`;
}

function findSource(
  index: FieldIndex,
  warnings: MetadataWarning[],
  ifd: string,
  tag: number,
): MetadataField | undefined {
  const candidates = index.get(locationKey(ifd, tag));
  if (candidates === undefined || candidates.length === 0) return undefined;
  if (candidates.length > 1) {
    warnings.push(
      validationWarning(
        "MALFORMED_EXIF",
        `Duplicate ${candidates[0]?.name ?? "EXIF tag"} entries are ambiguous and were not normalized.`,
        ifd,
        tag,
      ),
    );
    return undefined;
  }
  return candidates[0];
}

function normalizedField(
  source: MetadataField,
  name: string,
  value: MetadataValue,
  display: string,
  type = source.type,
  raw: MetadataValue = source.raw,
  sensitivity: Sensitivity = source.sensitivity,
): MetadataField {
  const definition = getTagDefinition(source.ifd, source.tag);
  const field: {
    id: string;
    ifd: string;
    tag: number;
    name: string;
    raw: MetadataValue;
    value: MetadataValue;
    display: string;
    description: string;
    type: MetadataField["type"];
    editable: boolean;
    sensitivity: Sensitivity;
    count?: number;
    known: boolean;
  } = {
    id: `normalized:${name}`,
    ifd: source.ifd,
    tag: source.tag,
    name,
    raw,
    value,
    display,
    description: definition?.description ?? source.description,
    type,
    editable: true,
    sensitivity,
    known: true,
  };
  if (source.count !== undefined) field.count = source.count;
  return field;
}

function normalizeString(
  index: FieldIndex,
  fields: MetadataField[],
  warnings: MetadataWarning[],
  ifd: string,
  tag: number,
  name: string,
  sensitivity: Sensitivity,
  allowMultiple = false,
): void {
  const source = findSource(index, warnings, ifd, tag);
  if (source === undefined) return;
  if (source.type === "ASCII" && source.value === null) return;
  if (source.type !== "ASCII" || typeof source.value !== "string") {
    warnings.push(validationWarning("INVALID_VALUE", `${name} must be an ASCII value.`, ifd, tag));
    return;
  }

  const pieces = source.value.split("\0");
  if (!allowMultiple && pieces.length !== 1) {
    warnings.push(validationWarning("INVALID_ASCII", `${name} contains multiple NUL-separated strings.`, ifd, tag));
    return;
  }
  const value = allowMultiple
    ? pieces.map((piece) => piece.trim()).filter((piece) => piece.length > 0).join("; ")
    : source.value.trim();
  if (value.length === 0) {
    warnings.push(validationWarning("INVALID_VALUE", `${name} is empty.`, ifd, tag));
  }
  fields.push(normalizedField(source, name, value, value, source.type, source.raw, sensitivity));
}

function normalizeOrientation(
  index: FieldIndex,
  fields: MetadataField[],
  warnings: MetadataWarning[],
): void {
  const source = findSource(index, warnings, "IFD0", 0x0112);
  if (source === undefined) return;
  if (source.type !== "SHORT" || source.count !== 1 || typeof source.value !== "number" || !Number.isInteger(source.value)) {
    warnings.push(validationWarning("INVALID_VALUE", "Orientation must be a single integer.", "IFD0", 0x0112));
    return;
  }
  if (source.value < 1 || source.value > 8) {
    warnings.push(validationWarning("INVALID_VALUE", `Orientation ${source.value} is outside the defined range 1–8.`, "IFD0", 0x0112));
  }
  fields.push(normalizedField(source, "Orientation", source.value, describeOrientation(source.value)));
}

function normalizeDate(
  index: FieldIndex,
  fields: MetadataField[],
  warnings: MetadataWarning[],
  ifd: string,
  tag: number,
  name: string,
): void {
  const source = findSource(index, warnings, ifd, tag);
  if (source === undefined) return;
  if (source.type === "ASCII" && source.value === null) return;
  if (source.type !== "ASCII" || typeof source.value !== "string") {
    warnings.push(validationWarning("INVALID_DATE", `${name} must be an ASCII date.`, ifd, tag));
    return;
  }
  const parsed = parseExifDate(source.value);
  if (parsed === null) {
    warnings.push(
      validationWarning(
        "INVALID_DATE",
        `${name} is not a valid EXIF date in YYYY:MM:DD HH:MM:SS form.`,
        ifd,
        tag,
      ),
    );
    fields.push(normalizedField(source, name, source.value, source.value, source.type, source.raw, "moderate"));
    return;
  }
  fields.push(normalizedField(source, name, parsed, parsed, source.type, source.raw, "moderate"));
}

function parseExifDate(value: string): string | null {
  const match = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value);
  if (match === null) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  if (year < 1 || month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return null;
  const maximumDay = daysInMonth(year, month);
  if (day < 1 || day > maximumDay) return null;
  return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${match[6]}`;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leap ? 29 : 28;
  }
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}

function normalizePositiveRational(
  index: FieldIndex,
  fields: MetadataField[],
  warnings: MetadataWarning[],
  tag: number,
  name: string,
  unit: "seconds" | "f-number" | "millimetres",
): void {
  const source = findSource(index, warnings, "ExifIFD", tag);
  if (source === undefined) return;
  if (source.type !== "RATIONAL" || source.count !== 1 || !isRational(source.raw)) {
    warnings.push(validationWarning("INVALID_VALUE", `${name} must be a single rational value.`, "ExifIFD", tag));
    return;
  }
  const value = rationalToNumber(source.raw);
  if (value === null) return;
  const maximum = unit === "f-number" ? 1_000 : unit === "millimetres" ? 100_000 : Number.MAX_VALUE;
  if (value <= 0 || value > maximum) {
    warnings.push(validationWarning("INVALID_VALUE", `${name} is outside its valid positive range.`, "ExifIFD", tag));
  }
  let display: string;
  if (unit === "seconds") {
    display = source.raw.numerator === 1
      ? `${formatExactRational(source.raw)} s`
      : `${formatExactRational(source.raw)} s (${formatNumber(value, 8)} s)`;
  } else if (unit === "f-number") {
    display = `f/${formatNumber(value, 4)}`;
  } else {
    display = `${formatNumber(value, 4)} mm`;
  }
  fields.push(normalizedField(source, name, value, display));
}

function normalizeIso(index: FieldIndex, fields: MetadataField[], warnings: MetadataWarning[]): void {
  const source = findSource(index, warnings, "ExifIFD", 0x8827);
  if (source === undefined) return;
  if (source.type !== "SHORT") {
    warnings.push(validationWarning("INVALID_VALUE", "ISOSpeedRatings must use the TIFF SHORT type.", "ExifIFD", 0x8827));
    return;
  }
  const values = typeof source.raw === "number"
    ? [source.raw]
    : isNumberArray(source.raw)
      ? source.raw
      : null;
  if (values === null || values.length === 0 || values.some((value) => !Number.isInteger(value))) {
    warnings.push(validationWarning("INVALID_VALUE", "ISOSpeedRatings must contain integer values.", "ExifIFD", 0x8827));
    return;
  }
  if (values.some((value) => value <= 0 || value > 100_000_000)) {
    warnings.push(validationWarning("INVALID_VALUE", "ISOSpeedRatings contains a value outside its valid positive range.", "ExifIFD", 0x8827));
  }
  const value: MetadataValue = values.length === 1 ? values[0] ?? 0 : values;
  fields.push(normalizedField(source, "ISOSpeedRatings", value, `ISO ${values.join(", ")}`));
}

function normalizeFlash(index: FieldIndex, fields: MetadataField[], warnings: MetadataWarning[]): void {
  const source = findSource(index, warnings, "ExifIFD", 0x9209);
  if (source === undefined) return;
  if (
    source.type !== "SHORT" ||
    source.count !== 1 ||
    typeof source.raw !== "number" ||
    !Number.isInteger(source.raw) ||
    source.raw < 0 ||
    source.raw > 0xffff
  ) {
    warnings.push(validationWarning("INVALID_VALUE", "Flash must be a 16-bit integer bit field.", "ExifIFD", 0x9209));
    return;
  }
  const value = decodeFlash(source.raw);
  if ((source.raw & 0xff80) !== 0) {
    warnings.push(validationWarning("INVALID_VALUE", "Flash contains non-zero reserved bits.", "ExifIFD", 0x9209));
  }
  fields.push(normalizedField(source, "Flash", value, describeFlash(value)));
}

function normalizeGpsCoordinate(
  index: FieldIndex,
  fields: MetadataField[],
  warnings: MetadataWarning[],
  kind: "latitude" | "longitude",
): void {
  const valueTag = kind === "latitude" ? 0x0002 : 0x0004;
  const referenceTag = kind === "latitude" ? 0x0001 : 0x0003;
  const name = kind === "latitude" ? "GPSLatitude" : "GPSLongitude";
  const valueSource = findSource(index, warnings, "GPSIFD", valueTag);
  const referenceSource = findSource(index, warnings, "GPSIFD", referenceTag);
  if (valueSource === undefined && referenceSource === undefined) return;
  if (valueSource === undefined || referenceSource === undefined) {
    warnings.push(validationWarning("INCOMPLETE_GPS", `${name} requires both a coordinate and a hemisphere reference.`, "GPSIFD", valueTag));
    return;
  }
  if (referenceSource.type === "ASCII" && referenceSource.value === null) return;
  if (valueSource.type !== "RATIONAL" || !isRationalArray(valueSource.raw) || valueSource.raw.length !== 3) {
    warnings.push(validationWarning("INVALID_VALUE", `${name} must contain exactly three rational components.`, "GPSIFD", valueTag));
    return;
  }
  if (referenceSource.type !== "ASCII" || typeof referenceSource.value !== "string") {
    warnings.push(validationWarning("INVALID_VALUE", `${name} hemisphere reference must be ASCII.`, "GPSIFD", referenceTag));
    return;
  }
  const allowedReferences = kind === "latitude" ? ["N", "S"] : ["E", "W"];
  if (!allowedReferences.includes(referenceSource.value)) {
    warnings.push(validationWarning("INVALID_VALUE", `${name} has an invalid hemisphere reference.`, "GPSIFD", referenceTag));
    return;
  }
  const numericComponents = valueSource.raw.map(rationalToNumber);
  if (numericComponents.some((component) => component === null)) return;
  const degrees = numericComponents[0] ?? null;
  const minutes = numericComponents[1] ?? null;
  const seconds = numericComponents[2] ?? null;
  if (degrees === null || minutes === null || seconds === null) return;
  const maximumDegrees = kind === "latitude" ? 90 : 180;
  if (
    degrees < 0 ||
    degrees > maximumDegrees ||
    minutes < 0 ||
    minutes >= 60 ||
    seconds < 0 ||
    seconds >= 60 ||
    (degrees === maximumDegrees && (minutes !== 0 || seconds !== 0))
  ) {
    warnings.push(validationWarning("INVALID_VALUE", `${name} components are outside their geographic ranges.`, "GPSIFD", valueTag));
    return;
  }
  const unsigned = degrees + minutes / 60 + seconds / 3_600;
  const negative = referenceSource.value === "S" || referenceSource.value === "W";
  const coordinate = negative && unsigned !== 0 ? -unsigned : unsigned;
  const raw: GpsCoordinateRaw = {
    reference: referenceSource.value,
    components: valueSource.raw,
  };
  fields.push(
    normalizedField(
      valueSource,
      name,
      coordinate,
      `${formatNumber(Math.abs(coordinate), 7)}° ${referenceSource.value}`,
      "COMPOSITE",
      raw,
      "high",
    ),
  );
}

function normalizeGpsAltitude(
  index: FieldIndex,
  fields: MetadataField[],
  warnings: MetadataWarning[],
): void {
  const altitude = findSource(index, warnings, "GPSIFD", 0x0006);
  const reference = findSource(index, warnings, "GPSIFD", 0x0005);
  if (altitude === undefined && reference === undefined) return;
  if (altitude === undefined || reference === undefined) {
    warnings.push(validationWarning("INCOMPLETE_GPS", "GPSAltitude requires both altitude and altitude reference tags.", "GPSIFD", 0x0006));
    return;
  }
  if (
    altitude.type !== "RATIONAL" ||
    altitude.count !== 1 ||
    reference.type !== "BYTE" ||
    reference.count !== 1 ||
    !isRational(altitude.raw) ||
    typeof reference.raw !== "number"
  ) {
    warnings.push(validationWarning("INVALID_VALUE", "GPSAltitude or its reference has an invalid TIFF type.", "GPSIFD", 0x0006));
    return;
  }
  if (reference.raw !== 0 && reference.raw !== 1) {
    warnings.push(validationWarning("INVALID_VALUE", "GPSAltitudeRef must be 0 (above sea level) or 1 (below sea level).", "GPSIFD", 0x0005));
    return;
  }
  const unsigned = rationalToNumber(altitude.raw);
  if (unsigned === null) return;
  if (unsigned < 0) {
    warnings.push(validationWarning("INVALID_VALUE", "GPSAltitude must be an unsigned distance.", "GPSIFD", 0x0006));
    return;
  }
  const value = reference.raw === 1 && unsigned !== 0 ? -unsigned : unsigned;
  if (value < -12_000 || value > 1_000_000) {
    warnings.push(validationWarning("INVALID_VALUE", "GPSAltitude is outside the supported geographic range.", "GPSIFD", 0x0006));
  }
  fields.push(normalizedField(altitude, "GPSAltitude", value, `${formatNumber(value, 4)} m`, altitude.type, altitude.raw, "high"));
}

function isNumberArray(value: MetadataValue): value is readonly number[] {
  return Array.isArray(value) && value.every((item) => typeof item === "number");
}

function validationWarning(
  code: MetadataWarning["code"],
  message: string,
  ifd: string,
  tag: number,
): MetadataWarning {
  return { code, message, severity: "warning", ifd, tag };
}
