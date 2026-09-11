/** Return the first byte after a complete JPEG start-of-scan header, or null
 * when more header bytes are needed. It deliberately never reads scan data. */
export function jpegHeaderEnd(bytes: Uint8Array): number | null {
  if (bytes.length < 2 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let cursor = 2;
  while (cursor < bytes.length) {
    if (bytes[cursor] !== 0xff) return null;
    while (cursor < bytes.length && bytes[cursor] === 0xff) cursor += 1;
    if (cursor >= bytes.length) return null;
    const marker = bytes[cursor] ?? 0;
    cursor += 1;
    if (marker === 0xda) {
      if (cursor + 2 > bytes.length) return null;
      const length = ((bytes[cursor] ?? 0) << 8) | (bytes[cursor + 1] ?? 0);
      const end = cursor + length;
      return length >= 2 && end <= bytes.length ? end : null;
    }
    if (marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) return null;
    if (cursor + 2 > bytes.length) return null;
    const length = ((bytes[cursor] ?? 0) << 8) | (bytes[cursor + 1] ?? 0);
    const end = cursor + length;
    if (length < 2 || end > bytes.length) return null;
    cursor = end;
  }
  return null;
}
