import type { FlashValue, MetadataField, MetadataResult, MetadataValue } from "./types.js";

export interface CameraSummary {
  readonly make: string | null;
  readonly model: string | null;
  readonly owner: string | null;
  readonly serialNumber: string | null;
}

export interface LensSummary {
  readonly make: string | null;
  readonly model: string | null;
  readonly focalLength: number | null;
  readonly focalLengthIn35mm: number | null;
  readonly specification: readonly number[] | null;
}

export interface ExposureSummary {
  readonly time: number | null;
  readonly fNumber: number | null;
  readonly iso: number | null;
  readonly standardOutputSensitivity: number | null;
  readonly recommendedExposureIndex: number | null;
  readonly isoSpeed: number | null;
  readonly flash: FlashValue | null;
}

export interface CaptureSummary {
  readonly dateTime: string | null;
  readonly dateTimeOriginal: string | null;
  readonly dateTimeDigitized: string | null;
}

export interface LocationSummary {
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly altitude: number | null;
}

export interface MetadataSummary {
  readonly camera: CameraSummary;
  readonly lens: LensSummary;
  readonly exposure: ExposureSummary;
  readonly capture: CaptureSummary;
  readonly location: LocationSummary;
  readonly orientation: number | null;
  /** Values that disagree across repeated metadata fields are never silently chosen. */
  readonly conflicts: readonly MetadataConflict[];
}

export interface MetadataConflict {
  readonly name: string;
  readonly values: readonly string[];
}

function field(result: MetadataResult, name: string): MetadataField | undefined {
  return result.fields.find((candidate) => candidate.name === name);
}

function fields(result: MetadataResult, name: string): readonly MetadataField[] {
  const all = [...result.fields, ...(result.exif?.fields ?? [])];
  return all.filter((candidate) => candidate.name === name);
}

function rawField(result: MetadataResult, name: string): MetadataField | undefined {
  return fields(result, name).find((candidate) => candidate.ifd !== "normalized") ?? field(result, name);
}

function stringValue(result: MetadataResult, name: string): string | null {
  const value = field(result, name)?.value;
  return typeof value === "string" ? value : null;
}

function numberValue(result: MetadataResult, name: string): number | null {
  const value = field(result, name)?.value;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function numberArrayValue(result: MetadataResult, name: string): readonly number[] | null {
  const value = field(result, name)?.value;
  return Array.isArray(value) && value.every((item): item is number => typeof item === "number" && Number.isFinite(item)) ? value : null;
}

function flashValue(result: MetadataResult): FlashValue | null {
  const value = field(result, "Flash")?.value;
  if (typeof value !== "object" || value === null || Array.isArray(value) || value instanceof Uint8Array) return null;
  return "fired" in value && "mode" in value ? value : null;
}

function captureValue(result: MetadataResult, dateName: string, subsecondName: string, offsetName: string): string | null {
  const date = stringValue(result, dateName);
  if (date === null) return null;
  const subsecond = rawField(result, subsecondName)?.value;
  const offset = rawField(result, offsetName)?.value;
  const fraction = typeof subsecond === "string" && /^\d+$/.test(subsecond) ? `.${subsecond}` : "";
  // Offsets are attached only when explicitly stored by the camera. No local
  // timezone is inferred for offset-free EXIF dates.
  const suffix = typeof offset === "string" && /^[+-]\d\d:\d\d$/.test(offset) ? offset : "";
  return `${date}${fraction}${suffix}`;
}

function displayValue(value: MetadataValue): string {
  if (value instanceof Uint8Array) return `bytes:${value.byteLength}`;
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value);
}

function conflicts(result: MetadataResult): readonly MetadataConflict[] {
  const all = [...result.fields, ...(result.exif?.fields ?? [])];
  const byName = new Map<string, Set<string>>();
  for (const item of all) {
    const values = byName.get(item.name) ?? new Set<string>();
    values.add(displayValue(item.value));
    byName.set(item.name, values);
  }
  return [...byName]
    .filter(([, values]) => values.size > 1)
    .map(([name, values]) => ({ name, values: [...values] }));
}

/** Build a stable, application-oriented view over normalized fields. */
export function getMetadataSummary(result: MetadataResult): MetadataSummary {
  return {
    camera: {
      make: stringValue(result, "Make"),
      model: stringValue(result, "Model"),
      owner: stringValue(result, "CameraOwnerName"),
      serialNumber: stringValue(result, "BodySerialNumber") ?? stringValue(result, "LensSerialNumber"),
    },
    lens: {
      make: stringValue(result, "LensMake"),
      model: stringValue(result, "LensModel"),
      focalLength: numberValue(result, "FocalLength"),
      focalLengthIn35mm: numberValue(result, "FocalLengthIn35mmFilm"),
      specification: numberArrayValue(result, "LensSpecification"),
    },
    exposure: {
      time: numberValue(result, "ExposureTime"),
      fNumber: numberValue(result, "FNumber"),
      iso: numberValue(result, "ISOSpeedRatings"),
      standardOutputSensitivity: numberValue(result, "StandardOutputSensitivity"),
      recommendedExposureIndex: numberValue(result, "RecommendedExposureIndex"),
      isoSpeed: numberValue(result, "ISOSpeed"),
      flash: flashValue(result),
    },
    capture: {
      dateTime: captureValue(result, "DateTime", "SubSecTime", "OffsetTime"),
      dateTimeOriginal: captureValue(result, "DateTimeOriginal", "SubSecTimeOriginal", "OffsetTimeOriginal"),
      dateTimeDigitized: captureValue(result, "DateTimeDigitized", "SubSecTimeDigitized", "OffsetTimeDigitized"),
    },
    location: {
      latitude: numberValue(result, "GPSLatitude"),
      longitude: numberValue(result, "GPSLongitude"),
      altitude: numberValue(result, "GPSAltitude"),
    },
    orientation: numberValue(result, "Orientation"),
    conflicts: conflicts(result),
  };
}
