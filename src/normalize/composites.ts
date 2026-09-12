import { describeOrientation } from "./descriptions.js";
import type {
  CaptureTimeValue,
  CompositeCandidate,
  CompositeConflict,
  CompositeKind,
  CompositePayload,
  CompositeUncertainty,
  Equivalence35mmValue,
  ExifComposite,
  ExifCompositeSet,
  ExifOrientationCode,
  ExposureValueValue,
  FieldOfViewValue,
  GpsTimeValue,
  MetadataField,
  MetadataResult,
  MetadataWarning,
  NormalizationMode,
  OrientationValue,
  PrimaryDisplayDimensionsValue,
  RationalValue,
} from "../types.js";

export interface CompositeNormalizationResult {
  readonly composites: ExifCompositeSet;
  readonly fields: readonly MetadataField[];
  readonly warnings: readonly MetadataWarning[];
}

type CandidateField = MetadataField;
type FieldIndex = ReadonlyMap<string, readonly CandidateField[]>;

const ORIENTATION_CODES = new Set<number>([1, 2, 3, 4, 5, 6, 7, 8]);
const MILLIMETRES_PER_INCH = 25.4;
const MILLIMETRES_PER_CENTIMETRE = 10;
const FULL_FRAME_DIAGONAL_MM = 43.266615305567875;
const MAX_COMPOSITE_CANDIDATES = 256;

function indexFields(fields: readonly CandidateField[]): FieldIndex {
  const map = new Map<string, CandidateField[]>();
  for (const field of fields) {
    const key = `${field.ifd}:${field.tag}`;
    const list = map.get(key) ?? [];
    list.push(field);
    map.set(key, list);
  }
  return map;
}

function candidates(index: FieldIndex, ifd: string, tag: number): readonly CandidateField[] {
  return index.get(`${ifd}:${tag}`) ?? [];
}

function sourceId(field: CandidateField): string {
  const offset = field.source?.entryOffset;
  return offset === undefined || offset === null ? field.id : `${field.id}@${offset}`;
}

function sourceIds(fields: readonly CandidateField[]): readonly string[] {
  return [...new Set(fields.map(sourceId))];
}

function rawRational(field: CandidateField | undefined): RationalValue | null {
  if (field === undefined) return null;
  const raw = field.raw;
  if (typeof raw !== "object" || raw === null || Array.isArray(raw) || raw instanceof Uint8Array) return null;
  const value = raw as { readonly numerator?: unknown; readonly denominator?: unknown };
  return typeof value.numerator === "number" && typeof value.denominator === "number"
    ? { numerator: value.numerator, denominator: value.denominator }
    : null;
}

function rawRationalArray(field: CandidateField | undefined): readonly RationalValue[] | null {
  if (field === undefined || !Array.isArray(field.raw)) return null;
  const values = field.raw as readonly unknown[];
  if (!values.every((item) => typeof item === "object" && item !== null && !Array.isArray(item) && !(item instanceof Uint8Array) && typeof (item as { numerator?: unknown }).numerator === "number" && typeof (item as { denominator?: unknown }).denominator === "number")) return null;
  return values as readonly RationalValue[];
}

function rationalNumber(value: RationalValue | null): number | null {
  if (value === null || value.denominator === 0) return null;
  const result = value.numerator / value.denominator;
  return Number.isFinite(result) ? result : null;
}

function numeric(field: CandidateField | undefined): number | null {
  if (field === undefined) return null;
  if (typeof field.value === "number" && Number.isFinite(field.value)) return field.value;
  return rationalNumber(rawRational(field));
}

function numericPositive(field: CandidateField | undefined): number | null {
  const value = numeric(field);
  return value !== null && value > 0 ? value : null;
}

function text(field: CandidateField | undefined): string | null {
  if (field === undefined) return null;
  if (typeof field.value === "string") return field.value.replace(/\0+$/u, "");
  if (typeof field.raw === "string") return field.raw.replace(/\0+$/u, "");
  return null;
}

function displayCandidate(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function uniqueValues<T extends CompositePayload>(candidatesList: readonly CompositeCandidate<T>[]): readonly T[] {
  const values: T[] = [];
  for (const candidate of candidatesList) {
    if (candidate.value === null) continue;
    if (!values.some((value) => displayCandidate(value) === displayCandidate(candidate.value))) values.push(candidate.value);
  }
  return values;
}

function flattenSourceIds<T extends CompositePayload>(candidatesList: readonly CompositeCandidate<T>[]): readonly string[] {
  return [...new Set(candidatesList.flatMap((candidate) => candidate.sourceFieldIds))];
}

function flattenDiagnostics<T extends CompositePayload>(candidatesList: readonly CompositeCandidate<T>[]): readonly string[] {
  return [...new Set(candidatesList.flatMap((candidate) => candidate.diagnostics))];
}

function composite<T extends CompositePayload>(
  kind: CompositeKind,
  candidatesList: readonly CompositeCandidate<T>[],
  normalization: NormalizationMode,
): ExifComposite<T> {
  const valid = candidatesList.filter((candidate) => candidate.value !== null);
  const values = uniqueValues(candidatesList);
  const conflicts: CompositeConflict[] = values.length > 1
    ? [{
        sourceFieldIds: flattenSourceIds(candidatesList),
        values: values.map(displayCandidate),
        reason: "Multiple source candidates produce different composite values.",
      }]
    : [];
  const diagnostics = flattenDiagnostics(candidatesList);
  const invalid = candidatesList.some((candidate) => candidate.uncertainty === "invalid");
  const chosen = normalization === "strict" && (conflicts.length > 0 || invalid)
    ? null
    : valid[0]?.value ?? null;
  let uncertainty: CompositeUncertainty;
  if (candidatesList.length === 0) uncertainty = "unavailable";
  else if (valid.length === 0) uncertainty = candidatesList.some((candidate) => candidate.uncertainty === "invalid")
    ? "invalid"
    : candidatesList.some((candidate) => candidate.uncertainty === "partial") ? "partial" : "unavailable";
  else if (conflicts.length > 0) uncertainty = "ambiguous";
  else if (invalid) uncertainty = "partial";
  else if (valid.some((candidate) => candidate.uncertainty === "partial" || candidate.uncertainty === "invalid")) uncertainty = "partial";
  else uncertainty = valid[0]?.uncertainty ?? "unavailable";
  return {
    id: `composite:${kind}`,
    kind,
    value: chosen,
    sourceFieldIds: flattenSourceIds(candidatesList),
    uncertainty,
    derivation: valid[0]?.derivation ?? candidatesList[0]?.derivation ?? "No derivation was possible from the retained EXIF fields.",
    candidates: candidatesList,
    conflicts,
    diagnostics,
  };
}

function warning(
  warnings: MetadataWarning[],
  mode: NormalizationMode,
  message: string,
  fields: readonly CandidateField[],
  code: MetadataWarning["code"] = "INVALID_VALUE",
): void {
  const first = fields[0];
  warnings.push({
    code,
    message,
    severity: mode === "strict" ? "error" : "warning",
    ...(first?.source?.valueOffset === undefined || first.source.valueOffset === null ? {} : { offset: first.source.valueOffset }),
    ...(first === undefined ? {} : { ifd: first.ifd, tag: first.tag }),
  });
}

function candidate<T extends CompositePayload>(
  value: T | null,
  fields: readonly CandidateField[],
  uncertainty: CompositeUncertainty,
  derivation: string,
  diagnostics: readonly string[] = [],
): CompositeCandidate<T> {
  return { value, sourceFieldIds: sourceIds(fields), uncertainty, derivation, diagnostics };
}

/** Keep derivation work bounded even when a malformed file repeats a tag many times. */
function cartesianFields(lists: readonly (readonly CandidateField[])[]): {
  readonly tuples: readonly (readonly CandidateField[])[];
  readonly truncated: boolean;
} {
  let tuples: CandidateField[][] = [[]];
  let truncated = false;
  for (const list of lists) {
    const choices: readonly (CandidateField | undefined)[] = list.length === 0 ? [undefined] : list;
    const next: CandidateField[][] = [];
    for (const tuple of tuples) {
      for (const choice of choices) {
        if (next.length >= MAX_COMPOSITE_CANDIDATES) {
          truncated = true;
          break;
        }
        next.push(choice === undefined ? tuple : [...tuple, choice]);
      }
      if (truncated) break;
    }
    tuples = next;
    if (truncated) break;
  }
  return { tuples, truncated };
}

function addTruncationCandidate<T extends CompositePayload>(
  candidatesList: CompositeCandidate<T>[],
  fields: readonly CandidateField[],
  derivation: string,
): void {
  candidatesList.push(candidate<T>(null, fields, "partial", derivation, [`More than ${MAX_COMPOSITE_CANDIDATES} source combinations were present; derivation was bounded without discarding raw fields.`]));
}

function parseDate(value: string | null): { date: string; time: string; local: string } | null {
  if (value === null) return null;
  const match = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/u.exec(value);
  if (match === null) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = month === 2 ? leap ? 29 : 28 : [4, 6, 9, 11].includes(month) ? 30 : 31;
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days || hour > 23 || minute > 59 || second > 59) return null;
  const date = `${match[1]}-${match[2]}-${match[3]}`;
  const time = `${match[4]}:${match[5]}:${match[6]}`;
  return { date, time, local: `${date} ${time}` };
}

function parseOffset(value: string | null): string | null {
  if (value === null || !/^[+-]\d{2}:\d{2}$/u.test(value)) return null;
  const hours = Number(value.slice(1, 3));
  const minutes = Number(value.slice(4, 6));
  return hours <= 23 && minutes <= 59 ? value : null;
}

function formatGpsSecond(value: number): string {
  const text = /e/i.test(String(value)) ? value.toFixed(15).replace(/0+$/u, "").replace(/\.$/u, "") : String(value);
  const [integer = "0", fraction] = text.split(".");
  return `${integer.padStart(2, "0")}${fraction === undefined ? "" : `.${fraction}`}`;
}

function captureTime(index: FieldIndex, mode: NormalizationMode, warnings: MetadataWarning[]): ExifComposite<CaptureTimeValue> {
  const definitions = [
    { ifd: "ExifIFD", tag: 0x9003, subsec: 0x9291, offset: 0x9011, priority: 0 },
    { ifd: "IFD0", tag: 0x0132, subsec: 0x9290, offset: 0x9010, priority: 1 },
    { ifd: "ExifIFD", tag: 0x9004, subsec: 0x9292, offset: 0x9012, priority: 2 },
  ] as const;
  const candidatesList: CompositeCandidate<CaptureTimeValue>[] = [];
  for (const definition of definitions) {
    const dates = candidates(index, definition.ifd, definition.tag);
    const subsecondFields = candidates(index, "ExifIFD", definition.subsec);
    const offsetFields = candidates(index, "ExifIFD", definition.offset);
    if (dates.length === 0 && subsecondFields.length === 0 && offsetFields.length === 0) continue;
    const combinations = cartesianFields([dates, subsecondFields, offsetFields]);
    for (const tuple of combinations.tuples) {
      const dateField = tuple.find((field) => field.ifd === definition.ifd && field.tag === definition.tag);
      const subsecondField = tuple.find((field) => field.ifd === "ExifIFD" && field.tag === definition.subsec);
      const offsetField = tuple.find((field) => field.ifd === "ExifIFD" && field.tag === definition.offset);
      const fields = tuple;
      const parsed = parseDate(text(dateField));
      const subsecond = text(subsecondField);
      const offset = parseOffset(text(offsetField));
      const diagnostics: string[] = [];
      const invalidSource: string[] = [];
      const missingSource = dateField === undefined;
      if (parsed === null && !missingSource) invalidSource.push(`${dateField.name} is malformed or outside the EXIF calendar range.`);
      if (offsetField !== undefined && offset === null) invalidSource.push(`${dateField?.name ?? "Capture time"} has an invalid UTC offset companion.`);
      if (subsecond !== null && !/^\d+$/u.test(subsecond)) invalidSource.push(`${dateField?.name ?? "Capture time"} has a non-numeric subsecond companion.`);
      diagnostics.push(...invalidSource, ...(missingSource ? ["A capture date/time source is required."] : []));
      if (invalidSource.length > 0) warning(warnings, mode, invalidSource.join(" "), fields);
      if (parsed === null) {
        candidatesList.push(candidate<CaptureTimeValue>(null, fields, invalidSource.length > 0 ? "invalid" : "partial", `Parse ${dateField?.name ?? "the capture date/time"} with its EXIF subsecond and UTC-offset companions.`, diagnostics));
        continue;
      }
      const normalizedSubsecond = subsecond !== null && /^\d+$/u.test(subsecond) ? subsecond : null;
      const local = parsed.local;
      const iso8601 = `${parsed.date}T${parsed.time}${normalizedSubsecond === null ? "" : `.${normalizedSubsecond}`}${offset ?? ""}`;
      candidatesList.push(candidate<CaptureTimeValue>({ local, iso8601, date: parsed.date, time: parsed.time, subsecond: normalizedSubsecond, offset, timezoneKnown: offset !== null }, fields, invalidSource.length > 0 ? "invalid" : offset === null ? "partial" : "derived", `Combine ${dateField?.name ?? "capture date/time"}, ${subsecondField?.name ?? "no subsecond tag"}, and ${offsetField?.name ?? "no offset tag"}.`, diagnostics));
    }
    if (combinations.truncated) addTruncationCandidate(candidatesList, [...dates, ...subsecondFields, ...offsetFields], `Combine ${definition.ifd}:0x${definition.tag.toString(16)} and its time companions.`);
  }
  candidatesList.sort((left, right) => {
    const leftPriority = left.sourceFieldIds.some((id) => id.includes("0x9003")) ? 0 : left.sourceFieldIds.some((id) => id.includes("0x0132")) ? 1 : 2;
    const rightPriority = right.sourceFieldIds.some((id) => id.includes("0x9003")) ? 0 : right.sourceFieldIds.some((id) => id.includes("0x0132")) ? 1 : 2;
    return leftPriority - rightPriority;
  });
  return composite<CaptureTimeValue>("capture-time", candidatesList, mode);
}

function gpsTime(index: FieldIndex, mode: NormalizationMode, warnings: MetadataWarning[]): ExifComposite<GpsTimeValue> {
  const timeFields = candidates(index, "GPSIFD", 0x0007);
  const dateFields = candidates(index, "GPSIFD", 0x001d);
  const candidatesList: CompositeCandidate<GpsTimeValue>[] = [];
  if (timeFields.length === 0 && dateFields.length === 0) return composite<GpsTimeValue>("gps-time", candidatesList, mode);
  const combinations = cartesianFields([timeFields, dateFields]);
  for (const tuple of combinations.tuples) {
      const timeField = tuple.find((field) => field.ifd === "GPSIFD" && field.tag === 0x0007);
      const dateField = tuple.find((field) => field.ifd === "GPSIFD" && field.tag === 0x001d);
      const fields = tuple;
      const values = rawRationalArray(timeField);
      const dateText = text(dateField);
      const dateMatch = dateText === null ? null : /^(\d{4}):(\d{2}):(\d{2})$/u.exec(dateText);
      const diagnostics: string[] = [];
      const invalidSource: string[] = [];
      if (timeField !== undefined && (values === null || values.length !== 3)) invalidSource.push("GPSTimeStamp must contain three rational values.");
      const numbers = values?.map(rationalNumber) ?? [];
      if (timeField !== undefined && numbers.some((value) => value === null)) invalidSource.push("GPSTimeStamp contains a zero denominator or non-finite rational.");
      const [hour, minute, second] = numbers as [number | undefined, number | undefined, number | undefined];
      if (timeField !== undefined && (hour === undefined || minute === undefined || second === undefined || hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second >= 60)) invalidSource.push("GPSTimeStamp is outside UTC clock ranges.");
      if (dateField !== undefined && dateMatch === null) invalidSource.push("GPSDateStamp must use a valid YYYY:MM:DD date.");
      else if (dateField !== undefined && parseDate(`${dateText} 00:00:00`) === null) invalidSource.push("GPSDateStamp is outside the EXIF calendar range.");
      const missingSource = timeField === undefined || dateField === undefined;
      diagnostics.push(...invalidSource, ...(missingSource ? ["Both GPSDateStamp and GPSTimeStamp are required for a complete UTC instant."] : []));
      if (invalidSource.length > 0) warning(warnings, mode, invalidSource.join(" "), fields, "INCOMPLETE_GPS");
      if (diagnostics.length > 0) {
        candidatesList.push(candidate<GpsTimeValue>(null, fields, invalidSource.length > 0 ? "invalid" : "partial", "Combine GPSDateStamp and GPSTimeStamp as UTC.", diagnostics));
        continue;
      }
      const date = `${dateMatch?.[1]}-${dateMatch?.[2]}-${dateMatch?.[3]}`;
      const secondText = formatGpsSecond(second ?? 0);
      const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${secondText}`;
      candidatesList.push(candidate<GpsTimeValue>({ date, time, iso8601: `${date}T${time}Z`, hour: hour ?? 0, minute: minute ?? 0, second: second ?? 0, utc: true }, fields, "derived", "Combine GPSDateStamp and GPSTimeStamp as UTC."));
  }
  if (combinations.truncated) addTruncationCandidate(candidatesList, [...timeFields, ...dateFields], "Combine GPSDateStamp and GPSTimeStamp as UTC.");
  return composite<GpsTimeValue>("gps-time", candidatesList, mode);
}

function dimensionsFromField(field: CandidateField | undefined): number | null {
  const value = numeric(field);
  return value !== null && Number.isSafeInteger(value) && value > 0 ? value : null;
}

function orientationValue(index: FieldIndex, mode: NormalizationMode, warnings: MetadataWarning[]): ExifComposite<OrientationValue> {
  const fields = candidates(index, "IFD0", 0x0112);
  const candidatesList: CompositeCandidate<OrientationValue>[] = [];
  for (const field of fields) {
    const value = numeric(field);
    const diagnostics: string[] = [];
    if (value === null || !Number.isInteger(value) || !ORIENTATION_CODES.has(value)) diagnostics.push("Orientation must be an integer from 1 through 8.");
    if (diagnostics.length > 0) warning(warnings, mode, diagnostics[0] ?? "Orientation is invalid.", [field]);
    if (value === null || !Number.isInteger(value) || !ORIENTATION_CODES.has(value)) {
      candidatesList.push(candidate<OrientationValue>(null, [field], "invalid", "Interpret the CIPA Orientation code as a display transform.", diagnostics));
      continue;
    }
    const code = value as ExifOrientationCode;
    const transform = orientationTransform(code);
    candidatesList.push(candidate<OrientationValue>({ code, label: describeOrientation(code), rotationDegrees: transform.rotationDegrees, mirrored: transform.mirrored, mirrorAxis: transform.mirrorAxis }, [field], "exact", "Interpret the CIPA Orientation code as a display transform."));
  }
  return composite("orientation", candidatesList, mode);
}

function orientationTransform(code: ExifOrientationCode): Pick<OrientationValue, "rotationDegrees" | "mirrored" | "mirrorAxis"> {
  switch (code) {
    case 2: return { rotationDegrees: 0, mirrored: true, mirrorAxis: "horizontal" };
    case 3: return { rotationDegrees: 180, mirrored: false, mirrorAxis: null };
    case 4: return { rotationDegrees: 0, mirrored: true, mirrorAxis: "vertical" };
    case 5: return { rotationDegrees: 270, mirrored: true, mirrorAxis: "horizontal" };
    case 6: return { rotationDegrees: 90, mirrored: false, mirrorAxis: null };
    case 7: return { rotationDegrees: 90, mirrored: true, mirrorAxis: "horizontal" };
    case 8: return { rotationDegrees: 270, mirrored: false, mirrorAxis: null };
    default: return { rotationDegrees: 0, mirrored: false, mirrorAxis: null };
  }
}

function fov(
  index: FieldIndex,
  dimensions: MetadataResult["dimensions"],
  mode: NormalizationMode,
  warnings: MetadataWarning[],
): ExifComposite<FieldOfViewValue> {
  const focalFields = candidates(index, "ExifIFD", 0x920a);
  const xResolutionFields = candidates(index, "ExifIFD", 0xa20e);
  const yResolutionFields = candidates(index, "ExifIFD", 0xa20f);
  const unitFields = candidates(index, "ExifIFD", 0xa210);
  const dimensionSources = [
    { width: candidates(index, "ExifIFD", 0xa002), height: candidates(index, "ExifIFD", 0xa003), source: "PixelXDimension+PixelYDimension" },
    { width: candidates(index, "IFD0", 0x0100), height: candidates(index, "IFD0", 0x0101), source: "ImageWidth+ImageLength" },
    { width: [], height: [], source: "container-dimensions" },
  ] as const;
  const fields = [...focalFields, ...xResolutionFields, ...yResolutionFields, ...unitFields, ...dimensionSources.flatMap((pair) => [...pair.width, ...pair.height])];
  const candidatesList: CompositeCandidate<FieldOfViewValue>[] = [];
  if (fields.length === 0 && dimensions === null) return composite<FieldOfViewValue>("field-of-view", candidatesList, mode);
  for (const pair of dimensionSources) {
    if (pair.width.length === 0 && pair.height.length === 0 && dimensions === null && pair.source !== "container-dimensions") continue;
    const combinations = cartesianFields([focalFields, xResolutionFields, yResolutionFields, unitFields, pair.width, pair.height]);
    for (const tuple of combinations.tuples) {
      const focalField = tuple.find((field) => field.ifd === "ExifIFD" && field.tag === 0x920a);
      const xResolutionField = tuple.find((field) => field.ifd === "ExifIFD" && field.tag === 0xa20e);
      const yResolutionField = tuple.find((field) => field.ifd === "ExifIFD" && field.tag === 0xa20f);
      const unitField = tuple.find((field) => field.ifd === "ExifIFD" && field.tag === 0xa210);
      const widthField = tuple.find((field) => field.tag === (pair.source === "PixelXDimension+PixelYDimension" ? 0xa002 : 0x0100));
      const heightField = tuple.find((field) => field.tag === (pair.source === "PixelXDimension+PixelYDimension" ? 0xa003 : 0x0101));
      const focal = numericPositive(focalField);
      const xResolution = numericPositive(xResolutionField);
      const yResolution = numericPositive(yResolutionField);
      const unitValue = numeric(unitField);
      const width = pair.source === "container-dimensions" ? dimensions?.width ?? null : dimensionsFromField(widthField) ?? dimensions?.width ?? null;
      const height = pair.source === "container-dimensions" ? dimensions?.height ?? null : dimensionsFromField(heightField) ?? dimensions?.height ?? null;
      const diagnostics: string[] = [];
      const invalidSource: string[] = [];
      if (focalField !== undefined && focal === null) invalidSource.push("FocalLength must be positive.");
      if (xResolutionField !== undefined && xResolution === null) invalidSource.push("FocalPlaneXResolution must be positive.");
      if (yResolutionField !== undefined && yResolution === null) invalidSource.push("FocalPlaneYResolution must be positive.");
      if (unitField !== undefined && unitValue !== 2 && unitValue !== 3) invalidSource.push("FocalPlaneResolutionUnit must be 2 (inch) or 3 (centimetre).");
      if (widthField !== undefined && dimensionsFromField(widthField) === null) invalidSource.push(`${pair.source} width must be a positive integer.`);
      if (heightField !== undefined && dimensionsFromField(heightField) === null) invalidSource.push(`${pair.source} height must be a positive integer.`);
      const missingSource = focal === null || xResolution === null || yResolution === null || width === null || height === null || (unitValue !== 2 && unitValue !== 3);
      diagnostics.push(...invalidSource, ...(missingSource ? ["Focal length, focal-plane resolution, resolution unit, and primary dimensions are required."] : []));
      if (invalidSource.length > 0) warning(warnings, mode, invalidSource.join(" "), tuple);
      if (missingSource || invalidSource.length > 0) {
        candidatesList.push(candidate<FieldOfViewValue>(null, tuple, invalidSource.length > 0 ? "invalid" : "partial", `Derive sensor geometry from ${pair.source} and focal-plane resolution.`, diagnostics));
        continue;
      }
      const scale = unitValue === 2 ? MILLIMETRES_PER_INCH : MILLIMETRES_PER_CENTIMETRE;
      const sensorWidthMillimetres = width / xResolution * scale;
      const sensorHeightMillimetres = height / yResolution * scale;
      const sensorDiagonalMillimetres = Math.hypot(sensorWidthMillimetres, sensorHeightMillimetres);
      const horizontalDegrees = 2 * Math.atan(sensorWidthMillimetres / (2 * focal)) * 180 / Math.PI;
      const verticalDegrees = 2 * Math.atan(sensorHeightMillimetres / (2 * focal)) * 180 / Math.PI;
      const diagonalDegrees = 2 * Math.atan(sensorDiagonalMillimetres / (2 * focal)) * 180 / Math.PI;
      candidatesList.push(candidate<FieldOfViewValue>({ horizontalDegrees, verticalDegrees, diagonalDegrees, focalLengthMillimetres: focal, sensorWidthMillimetres, sensorHeightMillimetres, resolutionUnit: unitValue === 2 ? "inch" : "centimetre" }, tuple, "derived", `Compute sensor dimensions from ${pair.source} and focal-plane resolution, then apply 2·atan(sensor/(2·focalLength)).`, diagnostics));
    }
    if (combinations.truncated) addTruncationCandidate(candidatesList, [...focalFields, ...xResolutionFields, ...yResolutionFields, ...unitFields, ...pair.width, ...pair.height], `Derive field of view from ${pair.source}.`);
  }
  return composite("field-of-view", candidatesList, mode);
}

function exposureValue(index: FieldIndex, mode: NormalizationMode, warnings: MetadataWarning[]): ExifComposite<ExposureValueValue> {
  const exposureFields = candidates(index, "ExifIFD", 0x829a);
  const fNumberFields = candidates(index, "ExifIFD", 0x829d);
  const shutterFields = candidates(index, "ExifIFD", 0x9201);
  const apertureFields = candidates(index, "ExifIFD", 0x9202);
  const brightnessFields = candidates(index, "ExifIFD", 0x9203);
  const biasFields = candidates(index, "ExifIFD", 0x9204);
  const candidatesList: CompositeCandidate<ExposureValueValue>[] = [];
  if (exposureFields.length > 0 || fNumberFields.length > 0) {
    const combinations = cartesianFields([exposureFields, fNumberFields]);
    for (const tuple of combinations.tuples) {
      const exposureSource = tuple.find((field) => field.ifd === "ExifIFD" && field.tag === 0x829a);
      const fNumberSource = tuple.find((field) => field.ifd === "ExifIFD" && field.tag === 0x829d);
      const fields = tuple;
      const exposure = rationalNumber(rawRational(exposureSource));
      const fNumber = rationalNumber(rawRational(fNumberSource));
      const diagnostics: string[] = [];
      const invalidSource: string[] = [];
      if (exposureSource !== undefined && (exposure === null || exposure <= 0)) invalidSource.push("ExposureTime must be a positive rational.");
      if (fNumberSource !== undefined && (fNumber === null || fNumber <= 0)) invalidSource.push("FNumber must be a positive rational.");
      const missingSource = exposureSource === undefined || fNumberSource === undefined;
      diagnostics.push(...invalidSource, ...(missingSource ? ["ExposureTime and FNumber are both required for photographic EV."] : []));
      if (invalidSource.length > 0) warning(warnings, mode, invalidSource.join(" "), fields);
      if (exposure !== null && fNumber !== null) candidatesList.push(candidate<ExposureValueValue>({ ev: Math.log2(fNumber ** 2 / exposure), source: "ExposureTime+FNumber", exposureTimeSeconds: exposure, fNumber }, fields, "derived", "Compute EV = log2(FNumber² / ExposureTime)." , diagnostics));
      else candidatesList.push(candidate<ExposureValueValue>(null, fields, invalidSource.length > 0 ? "invalid" : "partial", "Compute EV = log2(FNumber² / ExposureTime).", diagnostics));
    }
    if (combinations.truncated) addTruncationCandidate(candidatesList, [...exposureFields, ...fNumberFields], "Compute EV = log2(FNumber² / ExposureTime).");
  }
  if (shutterFields.length > 0 || apertureFields.length > 0) {
    const combinations = cartesianFields([shutterFields, apertureFields]);
    for (const tuple of combinations.tuples) {
      const shutterSource = tuple.find((field) => field.ifd === "ExifIFD" && field.tag === 0x9201);
      const apertureSource = tuple.find((field) => field.ifd === "ExifIFD" && field.tag === 0x9202);
      const fields = tuple;
      const shutter = rationalNumber(rawRational(shutterSource));
      const aperture = rationalNumber(rawRational(apertureSource));
      const diagnostics: string[] = [];
      const invalidSource: string[] = [];
      if (shutterSource !== undefined && (shutter === null || !Number.isFinite(shutter))) invalidSource.push("ShutterSpeedValue must be a finite signed rational.");
      if (apertureSource !== undefined && (aperture === null || !Number.isFinite(aperture))) invalidSource.push("ApertureValue must be a finite rational.");
      const missingSource = shutterSource === undefined || apertureSource === undefined;
      diagnostics.push(...invalidSource, ...(missingSource ? ["ShutterSpeedValue and ApertureValue are both required for APEX EV."] : []));
      if (invalidSource.length > 0) warning(warnings, mode, invalidSource.join(" "), fields);
      if (shutter !== null && aperture !== null) candidatesList.push(candidate<ExposureValueValue>({ ev: shutter + aperture, source: "ShutterSpeedValue+ApertureValue", exposureTimeSeconds: 2 ** -shutter, fNumber: 2 ** (aperture / 2) }, fields, "derived", "Compute APEX EV = ShutterSpeedValue + ApertureValue.", diagnostics));
      else candidatesList.push(candidate<ExposureValueValue>(null, fields, invalidSource.length > 0 ? "invalid" : "partial", "Compute APEX EV = ShutterSpeedValue + ApertureValue.", diagnostics));
    }
    if (combinations.truncated) addTruncationCandidate(candidatesList, [...shutterFields, ...apertureFields], "Compute APEX EV = ShutterSpeedValue + ApertureValue.");
  }
  if (brightnessFields.length > 0 || biasFields.length > 0) {
    const combinations = cartesianFields([brightnessFields, biasFields]);
    for (const tuple of combinations.tuples) {
      const brightnessSource = tuple.find((field) => field.ifd === "ExifIFD" && field.tag === 0x9203);
      const biasSource = tuple.find((field) => field.ifd === "ExifIFD" && field.tag === 0x9204);
      const brightness = rationalNumber(rawRational(brightnessSource));
      const bias = rationalNumber(rawRational(biasSource));
      const diagnostics: string[] = [];
      const invalidSource: string[] = [];
      if (brightnessSource !== undefined && (brightness === null || !Number.isFinite(brightness))) invalidSource.push("BrightnessValue must be a finite signed rational.");
      if (biasSource !== undefined && (bias === null || !Number.isFinite(bias))) invalidSource.push("ExposureBiasValue must be a finite signed rational.");
      const missingSource = brightnessSource === undefined || biasSource === undefined;
      diagnostics.push(...invalidSource, ...(missingSource ? ["BrightnessValue and ExposureBiasValue are both required for APEX EV."] : []));
      if (invalidSource.length > 0) warning(warnings, mode, invalidSource.join(" "), tuple);
      if (brightness !== null && bias !== null) candidatesList.push(candidate<ExposureValueValue>({ ev: brightness + bias, source: "BrightnessValue+ExposureBiasValue", exposureTimeSeconds: null, fNumber: null }, tuple, "derived", "Compute APEX EV = BrightnessValue + ExposureBiasValue.", diagnostics));
      else candidatesList.push(candidate<ExposureValueValue>(null, tuple, invalidSource.length > 0 ? "invalid" : "partial", "Compute APEX EV = BrightnessValue + ExposureBiasValue.", diagnostics));
    }
    if (combinations.truncated) addTruncationCandidate(candidatesList, [...brightnessFields, ...biasFields], "Compute APEX EV = BrightnessValue + ExposureBiasValue.");
  }
  return composite("exposure-value", candidatesList, mode);
}

function equivalence35mm(
  index: FieldIndex,
  fieldOfView: ExifComposite<FieldOfViewValue>,
  mode: NormalizationMode,
  warnings: MetadataWarning[],
): ExifComposite<Equivalence35mmValue> {
  const explicitFields = candidates(index, "ExifIFD", 0xa405);
  const focalFields = candidates(index, "ExifIFD", 0x920a);
  const candidatesList: CompositeCandidate<Equivalence35mmValue>[] = [];
  if (explicitFields.length > 0) {
    const combinations = cartesianFields([explicitFields, focalFields]);
    for (const tuple of combinations.tuples) {
      const explicitField = tuple.find((field) => field.ifd === "ExifIFD" && field.tag === 0xa405);
      const actualField = tuple.find((field) => field.ifd === "ExifIFD" && field.tag === 0x920a);
      if (explicitField === undefined) continue;
      const explicit = numeric(explicitField);
      const actual = numericPositive(actualField);
      const diagnostics: string[] = [];
      if (explicit === null || explicit <= 0) diagnostics.push("FocalLengthIn35mmFilm value 0 or a non-positive value means unknown.");
      if (diagnostics.length > 0) warning(warnings, mode, diagnostics.join(" "), [explicitField]);
      candidatesList.push(candidate<Equivalence35mmValue>(explicit !== null && explicit > 0 ? { equivalentFocalLengthMillimetres: explicit, actualFocalLengthMillimetres: actual, cropFactor: actual === null ? null : explicit / actual, source: "FocalLengthIn35mmFilm" } : null, tuple, diagnostics.length > 0 ? "invalid" : "exact", "Use the explicit CIPA FocalLengthIn35mmFilm value.", diagnostics));
    }
    if (combinations.truncated) addTruncationCandidate(candidatesList, [...explicitFields, ...focalFields], "Use the explicit CIPA FocalLengthIn35mmFilm value.");
  }
  const fovCandidates = fieldOfView.candidates.filter((item) => item.value !== null);
  let derivedCombinations = 0;
  let derivedTruncated = false;
  for (const actualField of focalFields) {
    for (const fovCandidate of fovCandidates) {
      if (derivedCombinations >= MAX_COMPOSITE_CANDIDATES) {
        derivedTruncated = true;
        break;
      }
      derivedCombinations += 1;
      const actual = numericPositive(actualField);
      const fovValue = fovCandidate.value;
      if (actual !== null && fovValue !== null) {
        const diagonal = Math.hypot(fovValue.sensorWidthMillimetres, fovValue.sensorHeightMillimetres);
        if (diagonal > 0) {
          const cropFactor = FULL_FRAME_DIAGONAL_MM / diagonal;
          candidatesList.push(candidate<Equivalence35mmValue>({ equivalentFocalLengthMillimetres: actual * cropFactor, actualFocalLengthMillimetres: actual, cropFactor, source: "FocalLength+sensorGeometry" }, [actualField, ...fovCandidate.sourceFieldIds.map((id) => ({ id } as CandidateField))], "derived", "Derive 35mm equivalence from actual focal length and sensor diagonal relative to the 36×24 mm frame diagonal."));
        }
      }
    }
    if (derivedTruncated) break;
  }
  if (derivedTruncated) addTruncationCandidate(candidatesList, [...focalFields, ...fieldOfView.sourceFieldIds.map((id) => ({ id } as CandidateField))], "Derive 35mm equivalence from actual focal length and sensor geometry.");
  return composite("35mm-equivalence", candidatesList, mode);
}

function primaryDisplayDimensions(
  index: FieldIndex,
  dimensions: MetadataResult["dimensions"],
  orientation: ExifComposite<OrientationValue>,
  mode: NormalizationMode,
  warnings: MetadataWarning[],
): ExifComposite<PrimaryDisplayDimensionsValue> {
  const orientationCode = orientation.value?.code ?? 1;
  const orientationFields = candidates(index, "IFD0", 0x0112);
  const candidatesList: CompositeCandidate<PrimaryDisplayDimensionsValue>[] = [];
  const pairs: Array<{ width: readonly CandidateField[]; height: readonly CandidateField[]; source: PrimaryDisplayDimensionsValue["source"] }> = [
    { width: candidates(index, "ExifIFD", 0xa002), height: candidates(index, "ExifIFD", 0xa003), source: "PixelXDimension+PixelYDimension" as const },
    { width: candidates(index, "IFD0", 0x0100), height: candidates(index, "IFD0", 0x0101), source: "ImageWidth+ImageLength" as const },
  ];
  if (dimensions !== null) pairs.push({ width: [], height: [], source: "container-dimensions" });
  const orientationCandidates = orientation.candidates.length === 0
    ? [{ value: orientation.value, sourceFieldIds: [] as readonly string[] }]
    : orientation.candidates;
  for (const pair of pairs) {
    if (pair.width.length === 0 && pair.height.length === 0 && pair.source !== "container-dimensions" && dimensions === null) continue;
    const combinations = cartesianFields([pair.width, pair.height]);
    let combinationCount = 0;
    let truncated = combinations.truncated;
    for (const tuple of combinations.tuples) {
      const widthField = tuple.find((field) => field.tag === (pair.source === "PixelXDimension+PixelYDimension" ? 0xa002 : 0x0100));
      const heightField = tuple.find((field) => field.tag === (pair.source === "PixelXDimension+PixelYDimension" ? 0xa003 : 0x0101));
      const width = pair.source === "container-dimensions" ? dimensions?.width ?? null : dimensionsFromField(widthField) ?? dimensions?.width ?? null;
      const height = pair.source === "container-dimensions" ? dimensions?.height ?? null : dimensionsFromField(heightField) ?? dimensions?.height ?? null;
      if (width === null && height === null) continue;
      for (const orientationCandidate of orientationCandidates) {
        if (combinationCount >= MAX_COMPOSITE_CANDIDATES) {
          truncated = true;
          break;
        }
        combinationCount += 1;
        const orientationValue = orientationCandidate.value;
        const code = orientationValue?.code ?? orientationCode;
        const fields = [...tuple, ...orientationCandidate.sourceFieldIds.map((id) => ({ id } as CandidateField))];
        const diagnostics: string[] = [];
        const invalidSource: string[] = [];
        if (widthField !== undefined && dimensionsFromField(widthField) === null) invalidSource.push(`${pair.source} width must be a positive integer.`);
        if (heightField !== undefined && dimensionsFromField(heightField) === null) invalidSource.push(`${pair.source} height must be a positive integer.`);
        if (orientationValue === null && orientationFields.length > 0) invalidSource.push("Orientation is invalid; display-space dimensions cannot be determined strictly.");
        const missingSource = width === null || height === null;
        diagnostics.push(...invalidSource, ...(missingSource ? [`${pair.source} requires both width and height.`] : []));
        if (invalidSource.length > 0) warning(warnings, mode, invalidSource.join(" "), fields);
        if (missingSource || (invalidSource.length > 0 && mode === "strict")) {
          candidatesList.push(candidate<PrimaryDisplayDimensionsValue>(null, fields, invalidSource.length > 0 ? "invalid" : "partial", "Select primary dimensions and apply the EXIF orientation transform.", diagnostics));
          continue;
        }
        const swapped = code >= 5;
        candidatesList.push(candidate<PrimaryDisplayDimensionsValue>({ width: swapped ? height : width, height: swapped ? width : height, storedWidth: width, storedHeight: height, orientation: code, source: pair.source }, fields, diagnostics.length > 0 ? "partial" : pair.source === "container-dimensions" ? "partial" : "derived", "Select PixelXDimension/PixelYDimension, fall back to ImageWidth/ImageLength or container dimensions, then apply orientation." , diagnostics));
      }
      if (truncated) break;
    }
    if (truncated) addTruncationCandidate(candidatesList, [...pair.width, ...pair.height, ...orientationFields], `Select primary display dimensions from ${pair.source}.`);
  }
  return composite("primary-display-dimensions", candidatesList, mode);
}

function compositeField<T extends CompositePayload>(name: string, value: ExifComposite<T>): MetadataField {
  const display = value.value === null
    ? `${name}: unavailable (${value.uncertainty})`
    : `${name}: ${displayCandidate(value.value)}`;
  return {
    id: value.id,
    ifd: "Composite",
    tag: 0,
    name,
    raw: null,
    value,
    display,
    description: value.derivation,
    type: "COMPOSITE",
    sensitivity: "none",
    known: true,
  };
}

export function compositeFields(composites: ExifCompositeSet): readonly MetadataField[] {
  return [
    compositeField("CaptureTime", composites.captureTime),
    compositeField("GPSTime", composites.gpsTime),
    compositeField("FieldOfView", composites.fieldOfView),
    compositeField("ExposureValue", composites.exposureValue),
    compositeField("FocalLength35mmEquivalent", composites.equivalence35mm),
    compositeField("ImageOrientation", composites.orientation),
    compositeField("PrimaryDisplayDimensions", composites.primaryDisplayDimensions),
  ];
}

/** Derive bounded, provenance-carrying interpretations from retained EXIF fields. */
export function deriveExifComposites(
  rawFields: readonly MetadataField[],
  dimensions: MetadataResult["dimensions"],
  normalization: NormalizationMode = "lenient",
): CompositeNormalizationResult {
  const index = indexFields(rawFields);
  const warnings: MetadataWarning[] = [];
  const orientation = orientationValue(index, normalization, warnings);
  const capture = captureTime(index, normalization, warnings);
  const gps = gpsTime(index, normalization, warnings);
  const view = fov(index, dimensions, normalization, warnings);
  const exposure = exposureValue(index, normalization, warnings);
  const equivalence = equivalence35mm(index, view, normalization, warnings);
  const display = primaryDisplayDimensions(index, dimensions, orientation, normalization, warnings);
  const composites: ExifCompositeSet = { captureTime: capture, gpsTime: gps, fieldOfView: view, exposureValue: exposure, equivalence35mm: equivalence, orientation, primaryDisplayDimensions: display, normalization };
  if (normalization === "strict") {
    for (const item of [capture, gps, view, exposure, equivalence, orientation, display]) {
      if (item.conflicts.length > 0) warnings.push({ code: "INVALID_VALUE", message: `${item.kind} has conflicting source candidates; strict normalization withheld its value.`, severity: "error", ifd: "Composite" });
    }
  }
  return { composites, fields: compositeFields(composites), warnings };
}
