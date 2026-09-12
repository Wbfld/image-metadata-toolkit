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
  maxDecompressedMetadataBytes: 16 * MEBIBYTE,
  maxReadRequests: 65_536,
  maxReadBytes: 256 * MEBIBYTE,
  maxReadCacheBytes: 4 * MEBIBYTE,
  maxXmpNodes: 4096,
  maxXmpAttributes: 16_384,
  maxXmpNamespaces: 512,
  maxXmpDepth: 32,
  maxXmpTextBytes: MEBIBYTE,
  maxXmpProperties: 4096,
  maxXmpArrayItems: 4096,
  maxXmpQualifiers: 4096,
  maxXmpPackets: 64,
  maxXmpOutputBytes: 4 * MEBIBYTE,
  maxIptcDatasets: 4096,
  maxIptcCandidates: 8192,
  maxIptcStructureDepth: 32,
  maxIptcOutputBytes: 4 * MEBIBYTE,
  maxIccDecodedTags: 1024,
  maxIccElements: 16_384,
  maxIccOutputBytes: 4 * MEBIBYTE,
  maxImageDetailCandidates: 4096,
  maxImageDetailFrames: 4096,
  maxImageDetailRelationships: 4096,
  maxAdapterItems: 8192,
  maxAdapterOutputBytes: 4 * MEBIBYTE,
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
  "maxDecompressedMetadataBytes",
  "maxReadRequests",
  "maxReadBytes",
  "maxReadCacheBytes",
  "maxXmpNodes",
  "maxXmpAttributes",
  "maxXmpNamespaces",
  "maxXmpDepth",
  "maxXmpTextBytes",
  "maxXmpProperties",
  "maxXmpArrayItems",
  "maxXmpQualifiers",
  "maxXmpPackets",
  "maxXmpOutputBytes",
  "maxIptcDatasets",
  "maxIptcCandidates",
  "maxIptcStructureDepth",
  "maxIptcOutputBytes",
  "maxIccDecodedTags",
  "maxIccElements",
  "maxIccOutputBytes",
  "maxImageDetailCandidates",
  "maxImageDetailFrames",
  "maxImageDetailRelationships",
  "maxAdapterItems",
  "maxAdapterOutputBytes",
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
    maxDecompressedMetadataBytes: resolveLimit(overrides, "maxDecompressedMetadataBytes"),
    maxReadRequests: resolveLimit(overrides, "maxReadRequests"),
    maxReadBytes: resolveLimit(overrides, "maxReadBytes"),
    maxReadCacheBytes: resolveLimit(overrides, "maxReadCacheBytes"),
    maxXmpNodes: resolveLimit(overrides, "maxXmpNodes"),
    maxXmpAttributes: resolveLimit(overrides, "maxXmpAttributes"),
    maxXmpNamespaces: resolveLimit(overrides, "maxXmpNamespaces"),
    maxXmpDepth: resolveLimit(overrides, "maxXmpDepth"),
    maxXmpTextBytes: resolveLimit(overrides, "maxXmpTextBytes"),
    maxXmpProperties: resolveLimit(overrides, "maxXmpProperties"),
    maxXmpArrayItems: resolveLimit(overrides, "maxXmpArrayItems"),
    maxXmpQualifiers: resolveLimit(overrides, "maxXmpQualifiers"),
    maxXmpPackets: resolveLimit(overrides, "maxXmpPackets"),
    maxXmpOutputBytes: resolveLimit(overrides, "maxXmpOutputBytes"),
    maxIptcDatasets: resolveLimit(overrides, "maxIptcDatasets"),
    maxIptcCandidates: resolveLimit(overrides, "maxIptcCandidates"),
    maxIptcStructureDepth: resolveLimit(overrides, "maxIptcStructureDepth"),
    maxIptcOutputBytes: resolveLimit(overrides, "maxIptcOutputBytes"),
    maxIccDecodedTags: resolveLimit(overrides, "maxIccDecodedTags"),
    maxIccElements: resolveLimit(overrides, "maxIccElements"),
    maxIccOutputBytes: resolveLimit(overrides, "maxIccOutputBytes"),
    maxImageDetailCandidates: resolveLimit(overrides, "maxImageDetailCandidates"),
    maxImageDetailFrames: resolveLimit(overrides, "maxImageDetailFrames"),
    maxImageDetailRelationships: resolveLimit(overrides, "maxImageDetailRelationships"),
    maxAdapterItems: resolveLimit(overrides, "maxAdapterItems"),
    maxAdapterOutputBytes: resolveLimit(overrides, "maxAdapterOutputBytes"),
    maxWarnings: resolveLimit(overrides, "maxWarnings"),
  });
}
