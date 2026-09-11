import { parseXml } from "@rgrove/parse-xml";
import { parseStructuredXmp, parseStructuredXmpBytes } from "./metadata/xmp.js";
import type { StructuredXmpOptions, StructuredXmpPacket } from "./metadata/xmp.js";

function isSafePacket(packet: string, maxInputBytes: number): boolean {
  return Number.isSafeInteger(maxInputBytes) && maxInputBytes > 0 &&
    new TextEncoder().encode(packet).byteLength <= maxInputBytes &&
    !/<!\s*(DOCTYPE|ENTITY)\b/i.test(packet);
}

/**
 * Validate an XMP packet with the optional standards-focused `@rgrove/parse-xml`
 * parser, then return the package's bounded RDF-oriented property map. This
 * entry point is separate so the core reader and default XMP entry point have
 * no runtime dependency on the optional peer.
 */
export function parseStructuredXmpWithRgrove(packet: string, options: StructuredXmpOptions = {}): StructuredXmpPacket | null {
  const maxInputBytes = options.maxInputBytes ?? 1024 * 1024;
  if (!isSafePacket(packet, maxInputBytes)) return null;
  try {
    parseXml(packet);
  } catch {
    return null;
  }
  return parseStructuredXmp(packet, options);
}

/** Validate UTF-8 XMP bytes with the optional `@rgrove/parse-xml` adapter. */
export function parseStructuredXmpBytesWithRgrove(bytes: Uint8Array, options: StructuredXmpOptions = {}): StructuredXmpPacket | null {
  const maxInputBytes = options.maxInputBytes ?? 1024 * 1024;
  if (!Number.isSafeInteger(maxInputBytes) || maxInputBytes < 1 || bytes.byteLength > maxInputBytes) return null;
  try {
    const packet = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return parseStructuredXmpWithRgrove(packet, options);
  } catch {
    return null;
  }
}

export { parseStructuredXmpBytes };
export type { StructuredXmpOptions, StructuredXmpPacket };
