import type { FormatDetection } from "./types.js";

const JPEG: FormatDetection = Object.freeze({ format: "jpeg", mimeType: "image/jpeg" });
const PNG: FormatDetection = Object.freeze({ format: "png", mimeType: "image/png" });
const TIFF: FormatDetection = Object.freeze({ format: "tiff", mimeType: "image/tiff" });
const WEBP: FormatDetection = Object.freeze({ format: "webp", mimeType: "image/webp" });
const HEIF: FormatDetection = Object.freeze({ format: "heif", mimeType: "image/heif" });
const AVIF: FormatDetection = Object.freeze({ format: "avif", mimeType: "image/avif" });
const UNKNOWN: FormatDetection = Object.freeze({
  format: "unknown",
  mimeType: "application/octet-stream",
});

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;
const AVIF_BRANDS = new Set(["avif", "avio", "avis"]);
const HEIF_BRANDS = new Set([
  "avci",
  "avcs",
  "heic",
  "heis",
  "heix",
  "heim",
  "hevc",
  "hevs",
  "hevx",
  "hevm",
  "mif1",
  "mif2",
  "msf1",
]);

function hasBytes(bytes: Uint8Array, expected: readonly number[], offset = 0): boolean {
  if (!Number.isSafeInteger(offset) || offset < 0 || expected.length > bytes.byteLength - offset) {
    return false;
  }

  for (let index = 0; index < expected.length; index += 1) {
    if (bytes[offset + index] !== expected[index]) {
      return false;
    }
  }

  return true;
}

function readUint32BigEndian(bytes: Uint8Array, offset: number): number | null {
  if (offset < 0 || offset > bytes.byteLength - 4) {
    return null;
  }

  return (
    ((bytes[offset] ?? 0) * 0x1000000) +
    ((bytes[offset + 1] ?? 0) * 0x10000) +
    ((bytes[offset + 2] ?? 0) * 0x100) +
    (bytes[offset + 3] ?? 0)
  );
}

function readUint64BigEndian(bytes: Uint8Array, offset: number): bigint | null {
  const high = readUint32BigEndian(bytes, offset);
  const low = readUint32BigEndian(bytes, offset + 4);

  if (high === null || low === null) {
    return null;
  }

  return (BigInt(high) << 32n) | BigInt(low);
}

function brandAt(bytes: Uint8Array, offset: number): string | null {
  if (offset < 0 || offset > bytes.byteLength - 4) {
    return null;
  }

  return String.fromCharCode(
    bytes[offset] ?? 0,
    bytes[offset + 1] ?? 0,
    bytes[offset + 2] ?? 0,
    bytes[offset + 3] ?? 0,
  );
}

function detectIsoBmff(bytes: Uint8Array): FormatDetection | null {
  if (bytes.byteLength < 16 || !hasBytes(bytes, [0x66, 0x74, 0x79, 0x70], 4)) {
    return null;
  }

  const shortSize = readUint32BigEndian(bytes, 0);
  if (shortSize === null) {
    return null;
  }

  let headerLength = 8;
  let boxLength: number;

  if (shortSize === 0) {
    // A zero-sized BMFF box extends to EOF.
    boxLength = bytes.byteLength;
  } else if (shortSize === 1) {
    const largeSize = readUint64BigEndian(bytes, 8);
    if (largeSize === null || largeSize > BigInt(bytes.byteLength)) {
      return null;
    }

    boxLength = Number(largeSize);
    headerLength = 16;
  } else {
    boxLength = shortSize;
  }

  const brandListOffset = headerLength;
  const fixedPayloadLength = 8; // major_brand + minor_version
  const minimumLength = headerLength + fixedPayloadLength;

  if (
    boxLength < minimumLength ||
    boxLength > bytes.byteLength ||
    (boxLength - minimumLength) % 4 !== 0
  ) {
    return null;
  }

  let sawHeif = false;
  for (let offset = brandListOffset; offset < boxLength; offset += 4) {
    // Skip minor_version, which follows major_brand and is not a brand.
    if (offset === brandListOffset + 4) {
      continue;
    }

    const brand = brandAt(bytes, offset);
    if (brand !== null && AVIF_BRANDS.has(brand)) {
      return AVIF;
    }
    if (brand !== null && HEIF_BRANDS.has(brand)) {
      sawHeif = true;
    }
  }

  return sawHeif ? HEIF : null;
}

/** Detect a supported image container using only validated file signatures. */
export function detectFormat(bytes: Uint8Array): FormatDetection {
  if (hasBytes(bytes, [0xff, 0xd8, 0xff])) {
    return JPEG;
  }

  if (hasBytes(bytes, PNG_SIGNATURE)) {
    return PNG;
  }

  if (
    hasBytes(bytes, [0x49, 0x49, 0x2a, 0x00]) ||
    hasBytes(bytes, [0x4d, 0x4d, 0x00, 0x2a]) ||
    hasBytes(bytes, [0x49, 0x49, 0x2b, 0x00, 0x08, 0x00, 0x00, 0x00]) ||
    hasBytes(bytes, [0x4d, 0x4d, 0x00, 0x2b, 0x00, 0x08, 0x00, 0x00])
  ) {
    return TIFF;
  }

  if (
    bytes.byteLength >= 12 &&
    hasBytes(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    hasBytes(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return WEBP;
  }

  return detectIsoBmff(bytes) ?? UNKNOWN;
}
