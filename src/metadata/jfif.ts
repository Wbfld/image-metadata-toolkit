import type { JfifData } from "../types.js";

const JFIF_IDENTIFIER = [0x4a, 0x46, 0x49, 0x46, 0x00] as const;

export function parseJfif(payload: Uint8Array): JfifData | null {
  if (payload.length < 14 || !JFIF_IDENTIFIER.every((byte, index) => payload[index] === byte)) {
    return null;
  }

  const xThumbnail = payload[12] ?? 0;
  const yThumbnail = payload[13] ?? 0;
  if ((xThumbnail === 0) !== (yThumbnail === 0)) return null;
  const thumbnailLength = xThumbnail * yThumbnail * 3;
  if (payload.length !== 14 + thumbnailLength) return null;

  const units = payload[7];
  const densityUnits = units === 0 ? "none" : units === 1 ? "dpi" : units === 2 ? "dpcm" : "unknown";
  return {
    version: `${payload[5]}.${String(payload[6]).padStart(2, "0")}`,
    densityUnits,
    xDensity: ((payload[8] ?? 0) << 8) | (payload[9] ?? 0),
    yDensity: ((payload[10] ?? 0) << 8) | (payload[11] ?? 0),
  };
}
