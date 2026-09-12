import type { FlashValue, MetadataValue } from "../types.js";
import { DEFAULT_METADATA_REGISTRY, type MetadataRegistry, type MetadataRegistryField } from "../registry.js";
export type TagDefinition = MetadataRegistryField;
export function getTagDefinition(ifd: string, tagNumber: number, registry: MetadataRegistry = DEFAULT_METADATA_REGISTRY): TagDefinition | undefined { return registry.get(ifd, tagNumber); }
export function formatUnknownTag(tagNumber: number): string { return `Tag 0x${tagNumber.toString(16).padStart(4, "0").toUpperCase()}`; }
export function describeOrientation(value: number): string { const descriptions: Readonly<Record<number, string>> = { 1: "Top-left (normal)", 2: "Top-right (mirrored horizontally)", 3: "Bottom-right (rotated 180°)", 4: "Bottom-left (mirrored vertically)", 5: "Left-top (mirrored horizontally, then rotated 270° clockwise)", 6: "Right-top (rotated 90° clockwise)", 7: "Right-bottom (mirrored horizontally, then rotated 90° clockwise)", 8: "Left-bottom (rotated 270° clockwise)" }; return descriptions[value] ?? `Invalid orientation (${value})`; }
export function describeFlash(value: FlashValue): string { const parts: string[] = [value.fired ? "Flash fired" : "Flash did not fire"]; const modes: Readonly<Record<FlashValue["mode"], string>> = { unknown: "mode unknown", "compulsory-firing": "compulsory firing mode", "compulsory-suppression": "compulsory suppression mode", auto: "auto mode" }; parts.push(modes[value.mode]); if (value.returnStatus === "detected") parts.push("return light detected"); if (value.returnStatus === "not-detected") parts.push("return light not detected"); if (value.returnStatus === "reserved") parts.push("reserved return-status value"); if (value.returnStatus === "not-supported") parts.push("return detection not supported"); if (!value.functionPresent) parts.push("no flash function present"); if (value.redEyeReduction) parts.push("red-eye reduction enabled"); return `${parts.join("; ")}.`; }

/** Render generated standard enum meanings without replacing the numeric/raw value. */
export function describeEnum(
  raw: MetadataValue,
  definition: MetadataRegistryField | undefined,
): string | null {
  const values = definition?.enumValues;
  if (values === undefined) return null;
  const candidates: Array<number | string> = [];
  if (typeof raw === "number" || typeof raw === "string") candidates.push(typeof raw === "string" ? raw.replace(/\0+$/u, "") : raw);
  else if (raw instanceof Uint8Array && raw.length > 0) {
    const shown = raw.length <= 64 ? raw : raw.subarray(0, 64);
    const ascii = Array.from(shown, (byte) => String.fromCharCode(byte)).join("").replace(/\0+$/u, "");
    if (raw.length <= 64 && /^[\x20-\x7e]+$/u.test(ascii)) candidates.push(ascii);
    else candidates.push(raw[0] ?? 0);
  }
  else if (Array.isArray(raw) && raw.every((item) => typeof item === "number" || typeof item === "string")) candidates.push(raw.length <= 64 ? raw.join(",") : String(raw[0] ?? 0));
  if (candidates.length === 0) return null;
  return candidates.map((value) => {
    const meaning = values[String(value)];
    return meaning === undefined ? `${value} (reserved)` : `${value} (${meaning})`;
  }).join(", ");
}
