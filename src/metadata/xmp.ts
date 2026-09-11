const XMP_IDENTIFIER_TEXT = "http://ns.adobe.com/xap/1.0/\u0000";
const XMP_IDENTIFIER = Uint8Array.from(XMP_IDENTIFIER_TEXT, (character) => character.charCodeAt(0));
const EXTENDED_XMP_IDENTIFIER = Uint8Array.from("http://ns.adobe.com/xmp/extension/\u0000", (character) => character.charCodeAt(0));

export interface XmpPacketParseResult {
  readonly matched: boolean;
  readonly packet: string | null;
}

export interface ExtendedXmpChunk {
  readonly guid: string;
  readonly fullLength: number;
  readonly offset: number;
  readonly data: Uint8Array;
}

function startsWith(bytes: Uint8Array, prefix: Uint8Array): boolean {
  return bytes.length >= prefix.length && prefix.every((byte, index) => bytes[index] === byte);
}

function uint32BigEndian(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] ?? 0) * 0x1000000) + ((bytes[offset + 1] ?? 0) << 16) + ((bytes[offset + 2] ?? 0) << 8) + (bytes[offset + 3] ?? 0);
}

/** Parse an Adobe extended-XMP APP1 payload without assembling it yet. */
export function parseExtendedXmpChunk(payload: Uint8Array): ExtendedXmpChunk | null {
  if (!startsWith(payload, EXTENDED_XMP_IDENTIFIER)) return null;
  const headerEnd = EXTENDED_XMP_IDENTIFIER.length + 40;
  if (payload.length < headerEnd) return null;
  const guid = new TextDecoder("ascii", { fatal: true }).decode(payload.subarray(EXTENDED_XMP_IDENTIFIER.length, EXTENDED_XMP_IDENTIFIER.length + 32));
  if (!/^[A-Fa-f0-9]{32}$/.test(guid)) return null;
  const fullLength = uint32BigEndian(payload, EXTENDED_XMP_IDENTIFIER.length + 32);
  const offset = uint32BigEndian(payload, EXTENDED_XMP_IDENTIFIER.length + 36);
  if (fullLength < 1 || offset > fullLength || payload.length - headerEnd > fullLength - offset) return null;
  return { guid: guid.toUpperCase(), fullLength, offset, data: payload.subarray(headerEnd).slice() };
}

/** Reassemble complete, non-overlapping extended-XMP chunks into one UTF-8 packet. */
export function reassembleExtendedXmp(chunks: readonly ExtendedXmpChunk[], maxStringBytes: number): string | null {
  if (chunks.length === 0) return null;
  const fullLength = chunks[0]?.fullLength;
  if (fullLength === undefined || fullLength > maxStringBytes || chunks.some((chunk) => chunk.fullLength !== fullLength)) return null;
  const ordered = [...chunks].sort((left, right) => left.offset - right.offset);
  let cursor = 0;
  for (const chunk of ordered) {
    if (chunk.offset !== cursor) return null;
    cursor += chunk.data.length;
  }
  if (cursor !== fullLength) return null;
  const bytes = new Uint8Array(fullLength);
  for (const chunk of ordered) bytes.set(chunk.data, chunk.offset);
  try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { return null; }
}

/** Read the extended-XMP GUID advertised by a standard XMP packet. */
export function extendedXmpGuid(packet: string): string | null {
  const match = /(?:xmpNote:HasExtendedXMP|HasExtendedXMP)\s*=\s*["']([A-Fa-f0-9]{32})["']/.exec(packet);
  return match?.[1]?.toUpperCase() ?? null;
}

export type XmpPropertyValue = string | readonly string[] | Readonly<Record<string, string>>;

export interface StructuredXmpPacket {
  readonly namespaces: Readonly<Record<string, string>>;
  readonly properties: Readonly<Record<string, XmpPropertyValue>>;
}

export interface StructuredXmpOptions {
  readonly maxInputBytes?: number;
  readonly maxElements?: number;
  readonly maxProperties?: number;
}

/** Adapter contract for applications that want to supply a standards-focused XML decoder. */
export interface StructuredXmpDecoder {
  readonly parse: (packet: string, options?: StructuredXmpOptions) => StructuredXmpPacket | null;
}

interface XmlNode {
  readonly name: string;
  readonly attributes: ReadonlyMap<string, string>;
  readonly children: XmlNode[];
  text: string;
}

const XML_DEFAULTS = { maxInputBytes: 1024 * 1024, maxElements: 4096, maxProperties: 1024 } as const;

function resolveStructuredXmpOptions(overrides: StructuredXmpOptions): Required<StructuredXmpOptions> | null {
  const options: Required<StructuredXmpOptions> = { ...XML_DEFAULTS, ...overrides };
  return Number.isSafeInteger(options.maxInputBytes) &&
    Number.isSafeInteger(options.maxElements) &&
    Number.isSafeInteger(options.maxProperties) &&
    options.maxInputBytes >= 1 && options.maxElements >= 1 && options.maxProperties >= 1
    ? options
    : null;
}

function isSafeStructuredPacket(packet: string, options: Required<StructuredXmpOptions>): boolean {
  return new TextEncoder().encode(packet).byteLength <= options.maxInputBytes && !/<!\s*(DOCTYPE|ENTITY)\b/i.test(packet);
}

function isPropertyValue(value: unknown): value is XmpPropertyValue {
  if (typeof value === "string") return true;
  if (Array.isArray(value)) return value.every((entry) => typeof entry === "string");
  return value !== null && typeof value === "object" && Object.values(value).every((entry) => typeof entry === "string");
}

function isStructuredXmpPacket(value: unknown, options: Required<StructuredXmpOptions>): value is StructuredXmpPacket {
  if (value === null || typeof value !== "object") return false;
  const candidate = value as { namespaces?: unknown; properties?: unknown };
  if (candidate.namespaces === null || typeof candidate.namespaces !== "object" || candidate.properties === null || typeof candidate.properties !== "object") return false;
  const namespaces = Object.values(candidate.namespaces);
  const properties = Object.values(candidate.properties);
  return namespaces.length <= options.maxProperties && namespaces.every((entry) => typeof entry === "string") &&
    properties.length <= options.maxProperties && properties.every(isPropertyValue);
}

function decodeEntity(value: string): string {
  return value.replace(/&(amp|lt|gt|quot|apos);|&#(x[0-9a-fA-F]+|\d+);/g, (whole, named: string | undefined, numeric: string | undefined) => {
    if (named !== undefined) return ({ amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'" } as Record<string, string>)[named] ?? whole;
    const code = numeric?.startsWith("x") ? Number.parseInt(numeric.slice(1), 16) : Number.parseInt(numeric ?? "", 10);
    return Number.isSafeInteger(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
  });
}

function readTag(packet: string, start: number): { readonly source: string; readonly end: number } | null {
  let quote = "";
  for (let cursor = start + 1; cursor < packet.length; cursor += 1) {
    const character = packet[cursor] ?? "";
    if (quote !== "") {
      if (character === quote) quote = "";
    } else if (character === "\"" || character === "'") {
      quote = character;
    } else if (character === ">") {
      return { source: packet.slice(start + 1, cursor), end: cursor + 1 };
    }
  }
  return null;
}

function attributes(source: string): ReadonlyMap<string, string> | null {
  const result = new Map<string, string>();
  const matcher = /([^\s=/>]+)\s*=\s*("[^"]*"|'[^']*')/gy;
  let cursor = 0;
  while (cursor < source.length) {
    while (/\s/.test(source[cursor] ?? "")) cursor += 1;
    if (cursor >= source.length) break;
    matcher.lastIndex = cursor;
    const match = matcher.exec(source);
    if (match === null || match.index !== cursor) return null;
    const name = match[1];
    const quoted = match[2];
    if (name === undefined || quoted === undefined || quoted.length < 2) return null;
    result.set(name, decodeEntity(quoted.slice(1, -1)));
    cursor = matcher.lastIndex;
  }
  return result;
}

function parseXml(packet: string, options: Required<StructuredXmpOptions>): XmlNode | null {
  if (!isSafeStructuredPacket(packet, options)) return null;
  const roots: XmlNode[] = [];
  const stack: XmlNode[] = [];
  let elements = 0;
  let cursor = 0;
  while (cursor < packet.length) {
    const open = packet.indexOf("<", cursor);
    if (open < 0) {
      const current = stack[stack.length - 1];
      if (current !== undefined) current.text += decodeEntity(packet.slice(cursor));
      break;
    }
    const current = stack[stack.length - 1];
    if (open > cursor && current !== undefined) current.text += decodeEntity(packet.slice(cursor, open));
    if (packet.startsWith("<!--", open)) {
      const end = packet.indexOf("-->", open + 4);
      if (end < 0) return null;
      cursor = end + 3;
      continue;
    }
    if (packet.startsWith("<?", open)) {
      const end = packet.indexOf("?>", open + 2);
      if (end < 0) return null;
      cursor = end + 2;
      continue;
    }
    const tag = readTag(packet, open);
    if (tag === null) return null;
    const source = tag.source.trim();
    cursor = tag.end;
    if (source.startsWith("!")) return null;
    if (source.startsWith("/")) {
      const name = source.slice(1).trim();
      if (stack.length === 0 || stack[stack.length - 1]?.name !== name) return null;
      stack.pop();
      continue;
    }
    const selfClosing = source.endsWith("/");
    const body = (selfClosing ? source.slice(0, -1) : source).trim();
    const space = body.search(/\s/);
    const name = space < 0 ? body : body.slice(0, space);
    if (!/^[A-Za-z_][\w:.-]*$/.test(name)) return null;
    const parsedAttributes = attributes(space < 0 ? "" : body.slice(space + 1));
    if (parsedAttributes === null || ++elements > options.maxElements) return null;
    const node: XmlNode = { name, attributes: parsedAttributes, children: [], text: "" };
    if (stack.length > 0) stack[stack.length - 1]?.children.push(node); else roots.push(node);
    if (!selfClosing) stack.push(node);
  }
  return stack.length === 0 && roots.length === 1 ? roots[0] ?? null : null;
}

function descendants(node: XmlNode, name: string): readonly XmlNode[] {
  const found: XmlNode[] = [];
  const visit = (candidate: XmlNode): void => {
    if (name === "*" || candidate.name === name) found.push(candidate);
    for (const child of candidate.children) visit(child);
  };
  visit(node);
  return found;
}

function textValue(node: XmlNode): string | null {
  const resource = node.attributes.get("rdf:resource");
  if (resource !== undefined) return resource;
  const text = node.text.trim();
  return text === "" ? null : text;
}

function propertyValue(node: XmlNode): XmpPropertyValue | null {
  const container = node.children.find((child) => child.name === "rdf:Bag" || child.name === "rdf:Seq" || child.name === "rdf:Alt");
  if (container === undefined) return textValue(node);
  const entries = container.children.filter((child) => child.name === "rdf:li");
  if (container.name === "rdf:Alt") {
    const languages: Record<string, string> = {};
    for (const entry of entries) {
      const value = textValue(entry);
      const language = entry.attributes.get("xml:lang") ?? "x-default";
      if (value !== null) languages[language] = value;
    }
    return Object.keys(languages).length > 0 ? languages : null;
  }
  const values = entries.map(textValue).filter((value): value is string => value !== null);
  return values.length > 0 ? values : null;
}

/**
 * Decode an XMP packet into a bounded RDF-oriented property map. The decoder
 * intentionally rejects DTDs and entity declarations and performs no external
 * resource resolution.
 */
export function parseStructuredXmp(packet: string, overrides: StructuredXmpOptions = {}): StructuredXmpPacket | null {
  const options = resolveStructuredXmpOptions(overrides);
  if (options === null) return null;
  const root = parseXml(packet, options);
  if (root === null) return null;
  const namespaces: Record<string, string> = {};
  for (const node of descendants(root, "*")) {
    for (const [name, value] of node.attributes) {
      if (name === "xmlns") namespaces[""] = value;
      else if (name.startsWith("xmlns:")) namespaces[name.slice(6)] = value;
    }
  }
  const properties: Record<string, XmpPropertyValue> = {};
  for (const description of descendants(root, "rdf:Description")) {
    for (const [name, value] of description.attributes) {
      if (!name.startsWith("xmlns") && name !== "rdf:about" && Object.keys(properties).length < options.maxProperties) properties[name] = value;
    }
    for (const child of description.children) {
      if (Object.keys(properties).length >= options.maxProperties) break;
      const value = propertyValue(child);
      if (value !== null) properties[child.name] = value;
    }
  }
  return { namespaces, properties };
}

/**
 * Run an application-supplied structured-XMP decoder behind the same UTF-8,
 * DTD/entity, and result-size limits as the built-in decoder. The adapter is
 * useful when an application already owns a full XML parser; it must not
 * perform external resource resolution.
 */
export function parseStructuredXmpWithDecoder(packet: string, decoder: StructuredXmpDecoder, overrides: StructuredXmpOptions = {}): StructuredXmpPacket | null {
  const options = resolveStructuredXmpOptions(overrides);
  if (options === null || !isSafeStructuredPacket(packet, options)) return null;
  try {
    const result = decoder.parse(packet, options);
    return isStructuredXmpPacket(result, options) ? result : null;
  } catch {
    return null;
  }
}

/** Decode UTF-8 XMP bytes with the same input bound as string parsing. */
export function parseStructuredXmpBytes(bytes: Uint8Array, overrides: StructuredXmpOptions = {}): StructuredXmpPacket | null {
  const options = resolveStructuredXmpOptions(overrides);
  if (options === null || bytes.byteLength > options.maxInputBytes) return null;
  try {
    return parseStructuredXmp(new TextDecoder("utf-8", { fatal: true }).decode(bytes), options);
  } catch {
    return null;
  }
}

/** Decode UTF-8 XMP bytes with an application-supplied bounded XML decoder. */
export function parseStructuredXmpBytesWithDecoder(bytes: Uint8Array, decoder: StructuredXmpDecoder, overrides: StructuredXmpOptions = {}): StructuredXmpPacket | null {
  const options = resolveStructuredXmpOptions(overrides);
  if (options === null || bytes.byteLength > options.maxInputBytes) return null;
  try {
    return parseStructuredXmpWithDecoder(new TextDecoder("utf-8", { fatal: true }).decode(bytes), decoder, options);
  } catch {
    return null;
  }
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
