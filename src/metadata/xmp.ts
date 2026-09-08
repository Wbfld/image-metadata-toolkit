const XMP_IDENTIFIER_TEXT = "http://ns.adobe.com/xap/1.0/\u0000";
const XMP_IDENTIFIER = Uint8Array.from(XMP_IDENTIFIER_TEXT, (character) => character.charCodeAt(0));

export interface XmpPacketParseResult {
  readonly matched: boolean;
  readonly packet: string | null;
}

export function parseXmpPacket(payload: Uint8Array, maxStringBytes: number): XmpPacketParseResult {
  if (payload.length < XMP_IDENTIFIER.length) return { matched: false, packet: null };
  for (let index = 0; index < XMP_IDENTIFIER.length; index += 1) {
    if (payload[index] !== XMP_IDENTIFIER[index]) return { matched: false, packet: null };
  }

  const bytes = payload.subarray(XMP_IDENTIFIER.length);
  if (bytes.length > maxStringBytes) return { matched: true, packet: null };
  try {
    return { matched: true, packet: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return { matched: true, packet: null };
  }
}
