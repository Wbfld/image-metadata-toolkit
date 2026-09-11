import type { ExifData, ExifThumbnail, SecurityLimits } from "../types.js";

/** Extract the bounded thumbnail referenced by EXIF IFD1. */
export function extractExifThumbnail(tiff: Uint8Array, exif: ExifData, limits: SecurityLimits): ExifThumbnail | null {
  const offsetValue = exif.fields.find(({ name }) => name === "JPEGInterchangeFormat")?.value;
  const lengthValue = exif.fields.find(({ name }) => name === "JPEGInterchangeFormatLength")?.value;
  if (typeof offsetValue !== "number" || typeof lengthValue !== "number") return null;
  if (!Number.isSafeInteger(offsetValue) || !Number.isSafeInteger(lengthValue) || offsetValue < 0 || lengthValue <= 0 || lengthValue > limits.maxValueBytes || offsetValue > tiff.length || lengthValue > tiff.length - offsetValue) return null;
  const data = tiff.subarray(offsetValue, offsetValue + lengthValue).slice();
  const mimeType = data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff ? "image/jpeg" : "application/octet-stream";
  return { data, mimeType };
}
