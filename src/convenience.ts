import { getMetadataSummary, type CaptureSummary, type MetadataConflict } from "./summary.js";
import type { ExifThumbnail, ImageTransform, MetadataResult } from "./types.js";

export interface GpsSummary {
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly altitude: number | null;
  readonly complete: boolean;
  readonly conflicts: readonly MetadataConflict[];
}

export type ExifOrientation = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface OrientationSummary {
  /** The validated EXIF orientation code, when one is present. */
  readonly value: ExifOrientation | null;
  /** A container transform, such as HEIF `irot`/`imir`, when present. */
  readonly transform: ImageTransform | null;
  readonly source: "none" | "exif" | "container" | "combined";
  readonly conflicts: readonly MetadataConflict[];
}

export interface RotationSummary {
  readonly degrees: 0 | 90 | 180 | 270;
  readonly radians: number;
  readonly scaleX: -1 | 1;
  readonly scaleY: -1 | 1;
  readonly dimensionSwapped: boolean;
  /** A convenient CSS transform for an element displaying the stored image. */
  readonly css: string;
  /** Source conflicts that callers should resolve before displaying the image. */
  readonly conflicts: readonly MetadataConflict[];
}

export interface CaptureTimeSummary extends CaptureSummary {
  /** DateTimeOriginal is preferred, followed by DateTime and DateTimeDigitized. */
  readonly value: string | null;
  readonly source: "DateTimeOriginal" | "DateTime" | "DateTimeDigitized" | "none";
}

function conflictsFor(result: MetadataResult, names: readonly string[]): readonly MetadataConflict[] {
  const wanted = new Set(names);
  const normalized = new Set(result.fields.filter(({ id }) => id.startsWith("normalized:")).map(({ name }) => name));
  // A normalized field and its source EXIF entry intentionally have different
  // representations (for example DMS GPS versus decimal degrees). They are
  // one value, not a conflict. Keep conflicts between source families visible
  // when no normalized canonical value exists.
  return getMetadataSummary(result).conflicts.filter(({ name }) => wanted.has(name) && !normalized.has(name));
}

function validOrientation(value: number | null): ExifOrientation | null {
  return value !== null && Number.isInteger(value) && value >= 1 && value <= 8 ? value as ExifOrientation : null;
}

function exifTransform(value: ExifOrientation): ImageTransform {
  switch (value) {
    case 2: return { rotation: 0, mirrored: true, mirrorAxis: "horizontal" };
    case 3: return { rotation: 180, mirrored: false };
    case 4: return { rotation: 0, mirrored: true, mirrorAxis: "vertical" };
    case 5: return { rotation: 270, mirrored: true, mirrorAxis: "horizontal" };
    case 6: return { rotation: 90, mirrored: false };
    case 7: return { rotation: 90, mirrored: true, mirrorAxis: "horizontal" };
    case 8: return { rotation: 270, mirrored: false };
    default: return { rotation: 0, mirrored: false };
  }
}

function sameTransform(left: ImageTransform, right: ImageTransform): boolean {
  return left.rotation === right.rotation && left.mirrored === right.mirrored && left.mirrorAxis === right.mirrorAxis;
}

/** Return validated GPS values without making callers understand the raw EXIF layout. */
export function getGps(result: MetadataResult): GpsSummary {
  const summary = getMetadataSummary(result);
  const conflicts = conflictsFor(result, ["GPSLatitude", "GPSLongitude", "GPSAltitude"]);
  return {
    ...summary.location,
    complete: summary.location.latitude !== null && summary.location.longitude !== null && conflicts.length === 0,
    conflicts,
  };
}

/** Return EXIF and container orientation without silently choosing between them. */
export function getOrientation(result: MetadataResult): OrientationSummary {
  const value = validOrientation(getMetadataSummary(result).orientation);
  const transform = result.transform ?? null;
  return {
    value,
    transform,
    source: value === null && transform === null ? "none" : value === null ? "container" : transform === null ? "exif" : "combined",
    conflicts: conflictsFor(result, ["Orientation"]),
  };
}

/** Return browser-friendly rotation and mirror instructions for the stored image. */
export function getRotation(result: MetadataResult): RotationSummary | null {
  const orientation = getOrientation(result);
  const exif = orientation.value === null ? null : exifTransform(orientation.value);
  const transform = orientation.transform ?? exif;
  if (transform === null) return null;
  const conflicts = [...orientation.conflicts];
  if (orientation.transform !== null && exif !== null && !sameTransform(orientation.transform, exif)) {
    conflicts.push({ name: "Orientation", values: [`EXIF:${orientation.value}`, `container:${orientation.transform.rotation}`] });
  }
  const scaleX = transform.mirrored && transform.mirrorAxis === "horizontal" ? -1 : 1;
  const scaleY = transform.mirrored && transform.mirrorAxis === "vertical" ? -1 : 1;
  const degrees = transform.rotation;
  return {
    degrees,
    radians: degrees * Math.PI / 180,
    scaleX,
    scaleY,
    dimensionSwapped: degrees === 90 || degrees === 270,
    css: `rotate(${degrees}deg) scale(${scaleX}, ${scaleY})`,
    conflicts,
  };
}

/** Return a defensive copy of the bounded embedded EXIF thumbnail, if present. */
export function getThumbnail(result: MetadataResult): ExifThumbnail | null {
  const thumbnail = result.exif?.thumbnail;
  return thumbnail === undefined ? null : { ...thumbnail, data: thumbnail.data.slice() };
}

/** Choose the most useful explicit EXIF capture time without inferring a timezone. */
export function getCaptureTime(result: MetadataResult): CaptureTimeSummary {
  const capture = getMetadataSummary(result).capture;
  if (capture.dateTimeOriginal !== null) return { ...capture, value: capture.dateTimeOriginal, source: "DateTimeOriginal" };
  if (capture.dateTime !== null) return { ...capture, value: capture.dateTime, source: "DateTime" };
  if (capture.dateTimeDigitized !== null) return { ...capture, value: capture.dateTimeDigitized, source: "DateTimeDigitized" };
  return { ...capture, value: null, source: "none" };
}
