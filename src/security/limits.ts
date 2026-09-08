import type { SecurityLimits } from "../types.js";

const MEBIBYTE = 1024 * 1024;

/**
 * Conservative parsing limits used when callers do not provide tighter limits.
 *
 * These limits constrain work performed by the parser; they are not statements
 * about what the underlying image formats can represent.
 */
export const DEFAULT_LIMITS: SecurityLimits = Object.freeze({
  maxInputBytes: 256 * MEBIBYTE,
  maxMetadataBytes: 16 * MEBIBYTE,
  maxSegmentBytes: 16 * MEBIBYTE,
  maxSegments: 4096,
  maxIfdEntries: 4096,
  maxIfdDepth: 8,
  maxValueBytes: 8 * MEBIBYTE,
  maxStringBytes: MEBIBYTE,
  maxPngChunks: 4096,
  maxDecompressedBytes: 8 * MEBIBYTE,
  maxWarnings: 256,
});

const LIMIT_KEYS = [
  "maxInputBytes",
  "maxMetadataBytes",
  "maxSegmentBytes",
  "maxSegments",
  "maxIfdEntries",
  "maxIfdDepth",
  "maxValueBytes",
  "maxStringBytes",
  "maxPngChunks",
  "maxDecompressedBytes",
  "maxWarnings",
] as const satisfies readonly (keyof SecurityLimits)[];

const LIMIT_KEY_SET: ReadonlySet<string> = new Set(LIMIT_KEYS);

function resolveLimit(
  overrides: Partial<SecurityLimits>,
  key: (typeof LIMIT_KEYS)[number],
): number {
  const value = Object.hasOwn(overrides, key) ? (overrides[key] ?? DEFAULT_LIMITS[key]) : DEFAULT_LIMITS[key];

  if (typeof value !== "number") {
    throw new TypeError(`Security limit ${key} must be a number`);
  }

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`Security limit ${key} must be a positive safe integer`);
  }

  return value;
}

/** Merge caller overrides with validated defaults. */
export function resolveLimits(overrides: Partial<SecurityLimits> = {}): SecurityLimits {
  for (const key of Object.keys(overrides)) {
    if (!LIMIT_KEY_SET.has(key)) {
      throw new TypeError(`Unknown security limit: ${key}`);
    }
  }

  return Object.freeze({
    maxInputBytes: resolveLimit(overrides, "maxInputBytes"),
    maxMetadataBytes: resolveLimit(overrides, "maxMetadataBytes"),
    maxSegmentBytes: resolveLimit(overrides, "maxSegmentBytes"),
    maxSegments: resolveLimit(overrides, "maxSegments"),
    maxIfdEntries: resolveLimit(overrides, "maxIfdEntries"),
    maxIfdDepth: resolveLimit(overrides, "maxIfdDepth"),
    maxValueBytes: resolveLimit(overrides, "maxValueBytes"),
    maxStringBytes: resolveLimit(overrides, "maxStringBytes"),
    maxPngChunks: resolveLimit(overrides, "maxPngChunks"),
    maxDecompressedBytes: resolveLimit(overrides, "maxDecompressedBytes"),
    maxWarnings: resolveLimit(overrides, "maxWarnings"),
  });
}
