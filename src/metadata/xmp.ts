import type { MetadataBlock, XmpPacketProvenance } from "../types.js";

const XMP_IDENTIFIER_TEXT = "http://ns.adobe.com/xap/1.0/\u0000";
const XMP_IDENTIFIER = Uint8Array.from(XMP_IDENTIFIER_TEXT, (character) => character.charCodeAt(0));
const EXTENDED_XMP_IDENTIFIER = Uint8Array.from("http://ns.adobe.com/xmp/extension/\u0000", (character) => character.charCodeAt(0));
const RDF_NAMESPACE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
const XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";

export interface XmpPacketParseResult { readonly matched: boolean; readonly packet: string | null; }
export interface ExtendedXmpChunk { readonly guid: string; readonly fullLength: number; readonly offset: number; readonly data: Uint8Array; }
export type XmpDiagnosticCode = "MALFORMED_XML" | "UNSAFE_ENTITY" | "LIMIT_EXCEEDED" | "INVALID_NAMESPACE" | "INVALID_RDF" | "INVALID_ADAPTER_OUTPUT" | "CONFLICT";
export interface XmpDiagnostic { readonly code: XmpDiagnosticCode; readonly message: string; readonly severity: "warning" | "error"; readonly offset?: number; readonly length?: number; }
export interface XmpQualifiedName { readonly namespaceUri: string; readonly localName: string; readonly prefix: string; readonly qualifiedName: string; }
export interface XmpNamespaceBinding { readonly prefix: string; readonly namespaceUri: string; readonly order: number; }
export interface XmpQualifier { readonly name: XmpQualifiedName; readonly value: XmpValue; readonly order: number; }
export interface XmpLiteralValue { readonly kind: "literal"; readonly lexicalValue: string; readonly value: string | number | boolean; readonly datatypeUri: string | null; readonly language: string | null; readonly qualifiers: readonly XmpQualifier[]; readonly parseType?: "Literal"; }
export interface XmpResourceValue { readonly kind: "resource" | "blank-node" | "typed-resource"; readonly resourceUri: string | null; readonly nodeId: string | null; readonly typeName: XmpQualifiedName | null; readonly properties: readonly XmpProperty[]; readonly qualifiers: readonly XmpQualifier[]; }
export interface XmpArrayValue { readonly kind: "array"; readonly container: "Bag" | "Seq" | "Alt"; readonly items: readonly XmpValue[]; readonly qualifiers: readonly XmpQualifier[]; }
export type XmpValue = XmpLiteralValue | XmpResourceValue | XmpArrayValue;
export interface XmpProperty { readonly name: XmpQualifiedName; readonly value: XmpValue; readonly qualifiers: readonly XmpQualifier[]; readonly order: number; readonly sourceStart: number; readonly sourceEnd: number; readonly aliasOf: XmpQualifiedName | null; }
export interface XmpDescription { readonly subject: string; readonly typeName: XmpQualifiedName | null; readonly properties: readonly XmpProperty[]; readonly sourceStart: number; readonly sourceEnd: number; }
export interface XmpRdfDocument { readonly namespaces: readonly XmpNamespaceBinding[]; readonly descriptions: readonly XmpDescription[]; readonly properties: readonly XmpProperty[]; readonly sourceLength: number; }
export interface XmpAliasDefinition { readonly alias: XmpQualifiedName; readonly canonical: XmpQualifiedName; readonly arrayForm?: "Bag" | "Seq" | "Alt"; }
export interface XmpPropertyCandidate { readonly identity: string; readonly property: XmpProperty; readonly packetIndex: number; readonly sourceId: string | null; readonly source: XmpPacketProvenance | null; }
export interface XmpConflict { readonly identity: string; readonly candidates: readonly XmpPropertyCandidate[]; readonly reason: "different-values" | "alias-values"; }
export interface XmpMergedDocument { readonly properties: readonly XmpPropertyCandidate[]; readonly candidates: Readonly<Record<string, readonly XmpPropertyCandidate[]>>; readonly conflicts: readonly XmpConflict[]; readonly policy: "preserve-all" | "first" | "last"; }
export type XmpPropertyValue = string | readonly string[] | Readonly<Record<string, string>>;

export interface StructuredXmpPacket {
  readonly namespaces: Readonly<Record<string, string>>;
  readonly properties: Readonly<Record<string, XmpPropertyValue>>;
  readonly rdf?: XmpRdfDocument;
  readonly model?: XmpRdfDocument;
  readonly diagnostics?: readonly XmpDiagnostic[];
}
export interface StructuredXmpOptions {
  readonly maxInputBytes?: number;
  readonly maxElements?: number;
  readonly maxProperties?: number;
  readonly maxDepth?: number;
  readonly maxAttributes?: number;
  readonly maxNamespaces?: number;
  readonly maxTextBytes?: number;
  readonly maxArrayItems?: number;
  readonly maxQualifiers?: number;
  readonly maxOutputBytes?: number;
  readonly maxPackets?: number;
}
export interface StructuredXmpDecoder { readonly parse: (packet: string, options?: StructuredXmpOptions) => StructuredXmpPacket | null; }
export interface StructuredXmpParseResult { readonly value: StructuredXmpPacket | null; readonly diagnostics: readonly XmpDiagnostic[]; }

interface XmlAttribute { readonly qualifiedName: string; readonly prefix: string; readonly localName: string; readonly namespaceUri: string | null; readonly value: string; readonly order: number; }
interface XmlNode { readonly qualifiedName: string; readonly prefix: string; readonly localName: string; readonly namespaceUri: string | null; readonly attributes: readonly XmlAttribute[]; readonly children: XmlNode[]; readonly start: number; end: number; depth: number; text: string; readonly language: string | null; }
interface EffectiveOptions { readonly maxInputBytes: number; readonly maxElements: number; readonly maxProperties: number; readonly maxDepth: number; readonly maxAttributes: number; readonly maxNamespaces: number; readonly maxTextBytes: number; readonly maxArrayItems: number; readonly maxQualifiers: number; readonly maxOutputBytes: number; readonly maxPackets: number; }
interface ParseState { readonly options: EffectiveOptions; readonly diagnostics: XmpDiagnostic[]; readonly namespaceBindings: XmpNamespaceBinding[]; elements: number; attributes: number; textBytes: number; namespaces: number; properties: number; qualifiers: number; outputBytes: number; blankNodeIndex: number; }

const XML_DEFAULTS: EffectiveOptions = { maxInputBytes: 1024 * 1024, maxElements: 4096, maxProperties: 4096, maxDepth: 32, maxAttributes: 16_384, maxNamespaces: 512, maxTextBytes: 1024 * 1024, maxArrayItems: 4096, maxQualifiers: 4096, maxOutputBytes: 4 * 1024 * 1024, maxPackets: 64 };

function startsWith(bytes: Uint8Array, prefix: Uint8Array): boolean { return bytes.length >= prefix.length && prefix.every((byte, index) => bytes[index] === byte); }
function uint32BigEndian(bytes: Uint8Array, offset: number): number { return ((bytes[offset] ?? 0) * 0x1000000) + ((bytes[offset + 1] ?? 0) << 16) + ((bytes[offset + 2] ?? 0) << 8) + (bytes[offset + 3] ?? 0); }

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

export function reassembleExtendedXmp(chunks: readonly ExtendedXmpChunk[], maxStringBytes: number): string | null {
  if (chunks.length === 0) return null;
  const fullLength = chunks[0]?.fullLength;
  if (fullLength === undefined || fullLength > maxStringBytes || chunks.some((chunk) => chunk.fullLength !== fullLength)) return null;
  const ordered = [...chunks].sort((left, right) => left.offset - right.offset);
  let cursor = 0;
  for (const chunk of ordered) { if (chunk.offset !== cursor) return null; cursor += chunk.data.length; }
  if (cursor !== fullLength) return null;
  const bytes = new Uint8Array(fullLength);
  for (const chunk of ordered) bytes.set(chunk.data, chunk.offset);
  try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { return null; }
}

export function extendedXmpGuid(packet: string): string | null { const match = /(?:xmpNote:HasExtendedXMP|HasExtendedXMP)\s*=\s*["']([A-Fa-f0-9]{32})["']/.exec(packet); return match?.[1]?.toUpperCase() ?? null; }

/** Align retained packet strings with physical/logical XMP block evidence. */
export function deriveXmpPacketProvenance(packets: readonly string[], blocks: readonly MetadataBlock[]): readonly XmpPacketProvenance[] {
  const candidates = blocks.filter((block) => block.family === "XMP" && block.status === "decoded");
  const direct = candidates.filter((block) => !block.container.includes("Extended XMP") && !block.container.includes("Assembled"));
  const assembled = candidates.filter((block) => block.container.includes("Assembled Extended XMP"));
  return packets.map((packet, packetIndex) => {
    const directBlock = direct[packetIndex];
    const assembledBlock = directBlock === undefined ? assembled[packetIndex - direct.length] : undefined;
    const sourceBlock = assembledBlock ?? directBlock;
    const extendedGuid = assembledBlock?.id.split(":").at(-1)?.toUpperCase();
    const blockIds = assembledBlock?.relatedBlockIds === undefined
      ? sourceBlock === undefined ? [] : [sourceBlock.id]
      : [assembledBlock.id, ...assembledBlock.relatedBlockIds];
    return {
      id: sourceBlock?.id ?? `xmp:packet:${packetIndex}`,
      source: assembledBlock === undefined ? "embedded" as const : "extended-embedded" as const,
      blockIds,
      packetIndex,
      offset: sourceBlock?.offset ?? null,
      length: sourceBlock?.length ?? null,
      ...(extendedGuid === undefined ? {} : { extendedGuid }),
    };
  });
}
function diagnostic(code: XmpDiagnosticCode, message: string, offset?: number, length?: number): XmpDiagnostic { return { code, message, severity: "error", ...(offset === undefined ? {} : { offset }), ...(length === undefined ? {} : { length }) }; }
function validLimit(value: number | undefined, fallback: number): number | null { if (value === undefined) return fallback; return Number.isSafeInteger(value) && value > 0 ? value : null; }
function resolveStructuredXmpOptions(overrides: StructuredXmpOptions): EffectiveOptions | null {
  const values: EffectiveOptions = { maxInputBytes: validLimit(overrides.maxInputBytes, XML_DEFAULTS.maxInputBytes) ?? 0, maxElements: validLimit(overrides.maxElements, XML_DEFAULTS.maxElements) ?? 0, maxProperties: validLimit(overrides.maxProperties, XML_DEFAULTS.maxProperties) ?? 0, maxDepth: validLimit(overrides.maxDepth, XML_DEFAULTS.maxDepth) ?? 0, maxAttributes: validLimit(overrides.maxAttributes, XML_DEFAULTS.maxAttributes) ?? 0, maxNamespaces: validLimit(overrides.maxNamespaces, XML_DEFAULTS.maxNamespaces) ?? 0, maxTextBytes: validLimit(overrides.maxTextBytes, XML_DEFAULTS.maxTextBytes) ?? 0, maxArrayItems: validLimit(overrides.maxArrayItems, XML_DEFAULTS.maxArrayItems) ?? 0, maxQualifiers: validLimit(overrides.maxQualifiers, XML_DEFAULTS.maxQualifiers) ?? 0, maxOutputBytes: validLimit(overrides.maxOutputBytes, XML_DEFAULTS.maxOutputBytes) ?? 0, maxPackets: validLimit(overrides.maxPackets, XML_DEFAULTS.maxPackets) ?? 0 };
  return Object.values(values).every((value) => value > 0) ? values : null;
}
function splitName(name: string): { readonly prefix: string; readonly localName: string } | null {
  if (!/^[A-Za-z_][\w.-]*(?::[A-Za-z_][\w.-]*)?$/.test(name)) return null;
  const separator = name.indexOf(":");
  return separator < 0 ? { prefix: "", localName: name } : { prefix: name.slice(0, separator), localName: name.slice(separator + 1) };
}
function decodeXmlEntities(value: string): { readonly value: string; readonly unsafe: boolean } {
  let unsafe = false;
  if (/&(?!#x[0-9a-fA-F]+;|#\d+;|amp;|lt;|gt;|quot;|apos;)/.test(value)) unsafe = true;
  const decoded = value.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (whole, token: string) => {
    if (token === "amp") return "&"; if (token === "lt") return "<"; if (token === "gt") return ">"; if (token === "quot") return "\""; if (token === "apos") return "'";
    const code = token.startsWith("#x") ? Number.parseInt(token.slice(2), 16) : Number.parseInt(token.slice(1), 10);
    if (!Number.isSafeInteger(code) || code < 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) { unsafe = true; return whole; }
    return String.fromCodePoint(code);
  });
  return { value: decoded, unsafe };
}
function readTag(packet: string, start: number): { readonly source: string; readonly end: number } | null {
  let quote = "";
  for (let cursor = start + 1; cursor < packet.length; cursor += 1) { const character = packet[cursor] ?? ""; if (quote !== "") { if (character === quote) quote = ""; } else if (character === "\"" || character === "'") quote = character; else if (character === ">") return { source: packet.slice(start + 1, cursor), end: cursor + 1 }; }
  return null;
}
function parseAttributes(source: string, baseOffset: number, state: ParseState): readonly { readonly name: string; readonly value: string; readonly offset: number }[] | null {
  const result: { readonly name: string; readonly value: string; readonly offset: number }[] = [];
  let cursor = 0;
  while (cursor < source.length) {
    while (/\s/.test(source[cursor] ?? "")) cursor += 1;
    if (cursor >= source.length) break;
    const nameStart = cursor;
    while (cursor < source.length && !/[\s=]/.test(source[cursor] ?? "")) cursor += 1;
    const name = source.slice(nameStart, cursor);
    if (splitName(name) === null && name !== "xmlns" && !name.startsWith("xmlns:")) return null;
    while (/\s/.test(source[cursor] ?? "")) cursor += 1;
    if (source[cursor] !== "=") return null;
    cursor += 1; while (/\s/.test(source[cursor] ?? "")) cursor += 1;
    const quote = source[cursor]; if (quote !== "\"" && quote !== "'") return null;
    cursor += 1; const valueStart = cursor; while (cursor < source.length && source[cursor] !== quote) cursor += 1;
    if (cursor >= source.length) return null;
    const decoded = decodeXmlEntities(source.slice(valueStart, cursor));
    if (decoded.unsafe) { state.diagnostics.push(diagnostic("UNSAFE_ENTITY", "XMP contains an unknown or invalid XML entity reference.", baseOffset + valueStart, cursor - valueStart)); return null; }
    result.push({ name, value: decoded.value, offset: baseOffset + nameStart }); state.attributes += 1;
    if (state.attributes > state.options.maxAttributes) { state.diagnostics.push(diagnostic("LIMIT_EXCEEDED", `XMP attribute count exceeds ${state.options.maxAttributes}.`, baseOffset + nameStart)); return null; }
    cursor += 1;
  }
  return result;
}

function parseXml(packet: string, state: ParseState): XmlNode | null {
  const roots: XmlNode[] = []; const stack: XmlNode[] = []; const namespaceStack: Map<string, string>[] = [new Map([["xml", XML_NAMESPACE]])]; const languageStack: (string | null)[] = [null]; let cursor = 0;
  while (cursor < packet.length) {
    const open = packet.indexOf("<", cursor); const current = stack.at(-1);
    if (open < 0) {
      const trailing = packet.slice(cursor);
      if (current === undefined) {
        if (trailing.trim() !== "") { state.diagnostics.push(diagnostic("MALFORMED_XML", "XMP contains non-whitespace text outside its root element.", cursor, trailing.length)); return null; }
      } else {
        const decoded = decodeXmlEntities(trailing);
        if (decoded.unsafe) { state.diagnostics.push(diagnostic("UNSAFE_ENTITY", "XMP contains an unknown XML entity reference.", cursor)); return null; }
        current.text += decoded.value; state.textBytes += new TextEncoder().encode(decoded.value).byteLength;
      }
      break;
    }
    if (open > cursor) {
      const text = packet.slice(cursor, open);
      if (current === undefined) {
        if (text.trim() !== "") { state.diagnostics.push(diagnostic("MALFORMED_XML", "XMP contains non-whitespace text outside its root element.", cursor, text.length)); return null; }
      } else {
        const decoded = decodeXmlEntities(text);
        if (decoded.unsafe) { state.diagnostics.push(diagnostic("UNSAFE_ENTITY", "XMP contains an unknown XML entity reference.", cursor, open - cursor)); return null; }
        current.text += decoded.value; state.textBytes += new TextEncoder().encode(decoded.value).byteLength;
      }
    }
    if (state.textBytes > state.options.maxTextBytes) { state.diagnostics.push(diagnostic("LIMIT_EXCEEDED", `XMP decoded text exceeds ${state.options.maxTextBytes} bytes.`, cursor)); return null; }
    if (packet.startsWith("<!--", open)) { const end = packet.indexOf("-->", open + 4); if (end < 0) { state.diagnostics.push(diagnostic("MALFORMED_XML", "XMP comment is unterminated.", open)); return null; } cursor = end + 3; continue; }
    if (packet.startsWith("<![CDATA[", open)) { const end = packet.indexOf("]]>", open + 9); if (end < 0) { state.diagnostics.push(diagnostic("MALFORMED_XML", "XMP CDATA section is unterminated.", open)); return null; } if (current !== undefined) current.text += packet.slice(open + 9, end); state.textBytes += new TextEncoder().encode(packet.slice(open + 9, end)).byteLength; cursor = end + 3; continue; }
    if (packet.startsWith("<?", open)) { const end = packet.indexOf("?>", open + 2); if (end < 0) { state.diagnostics.push(diagnostic("MALFORMED_XML", "XMP processing instruction is unterminated.", open)); return null; } cursor = end + 2; continue; }
    const tag = readTag(packet, open); if (tag === null) { state.diagnostics.push(diagnostic("MALFORMED_XML", "XMP tag is unterminated.", open)); return null; }
    const source = tag.source.trim(); cursor = tag.end;
    if (source.startsWith("!")) { state.diagnostics.push(diagnostic("UNSAFE_ENTITY", "XMP declarations are not permitted.", open)); return null; }
    if (source.startsWith("/")) { const closeName = source.slice(1).trim(); if (stack.length === 0 || stack.at(-1)?.qualifiedName !== closeName) { state.diagnostics.push(diagnostic("MALFORMED_XML", "XMP closing tag does not match its open tag.", open)); return null; } const closed = stack.pop(); if (closed !== undefined) closed.end = tag.end; namespaceStack.pop(); languageStack.pop(); continue; }
    const selfClosing = source.endsWith("/"); const body = (selfClosing ? source.slice(0, -1) : source).trim(); const space = body.search(/\s/); const qualifiedName = space < 0 ? body : body.slice(0, space); const split = splitName(qualifiedName);
    if (split === null) { state.diagnostics.push(diagnostic("MALFORMED_XML", "XMP element name is invalid.", open)); return null; }
    const parsed = parseAttributes(space < 0 ? "" : body.slice(space + 1), open + 1 + (space < 0 ? body.length : space + 1), state); if (parsed === null) return null;
    const parentNamespaces = namespaceStack.at(-1) ?? new Map<string, string>(); const currentNamespaces = new Map(parentNamespaces);
    for (const item of parsed) {
      if (item.name === "xmlns") {
        if (item.value === XMLNS_NAMESPACE) { state.diagnostics.push(diagnostic("INVALID_NAMESPACE", "The XMLNS namespace cannot be used as a default namespace.", item.offset)); return null; }
        currentNamespaces.set("", item.value); state.namespaces += 1; state.namespaceBindings.push({ prefix: "", namespaceUri: item.value, order: state.namespaceBindings.length });
      } else if (item.name.startsWith("xmlns:")) {
        const prefix = item.name.slice(6);
        if (splitName(prefix) === null || prefix.includes(":") || prefix === "xmlns" || (prefix === "xml" && item.value !== XML_NAMESPACE) || (prefix !== "xml" && item.value === XML_NAMESPACE)) { state.diagnostics.push(diagnostic("INVALID_NAMESPACE", "XMP namespace prefix or reserved namespace binding is invalid.", item.offset)); return null; }
        currentNamespaces.set(prefix, item.value); state.namespaces += 1; state.namespaceBindings.push({ prefix, namespaceUri: item.value, order: state.namespaceBindings.length });
      }
    }
    if (state.namespaces > state.options.maxNamespaces) { state.diagnostics.push(diagnostic("LIMIT_EXCEEDED", `XMP namespace count exceeds ${state.options.maxNamespaces}.`, open)); return null; }
    const namespaceUri = split.prefix === "" ? (currentNamespaces.get("") ?? null) : (currentNamespaces.get(split.prefix) ?? null); if (split.prefix !== "" && namespaceUri === null) { state.diagnostics.push(diagnostic("INVALID_NAMESPACE", `XMP prefix ${split.prefix} is not bound.`, open)); return null; }
    const attributes: XmlAttribute[] = []; const seenAttributes = new Set<string>();
    for (const item of parsed) {
      const itemSplit = item.name === "xmlns" ? { prefix: "xmlns", localName: "xmlns" } : item.name.startsWith("xmlns:") ? { prefix: "xmlns", localName: item.name.slice(6) } : splitName(item.name);
      if (itemSplit === null) { state.diagnostics.push(diagnostic("MALFORMED_XML", "XMP attribute name is invalid.", item.offset)); return null; }
      const itemNamespace = itemSplit.prefix === "xmlns" ? XMLNS_NAMESPACE : itemSplit.prefix === "xml" ? XML_NAMESPACE : itemSplit.prefix === "" ? null : currentNamespaces.get(itemSplit.prefix) ?? null;
      if (itemSplit.prefix !== "" && itemSplit.prefix !== "xmlns" && itemSplit.prefix !== "xml" && itemNamespace === null) { state.diagnostics.push(diagnostic("INVALID_NAMESPACE", `XMP prefix ${itemSplit.prefix} is not bound.`, item.offset)); return null; }
      const expanded = `${itemNamespace ?? ""}|${itemSplit.localName}`; if (seenAttributes.has(expanded)) { state.diagnostics.push(diagnostic("MALFORMED_XML", "XMP contains duplicate attributes.", item.offset)); return null; } seenAttributes.add(expanded); attributes.push({ qualifiedName: item.name, prefix: itemSplit.prefix, localName: itemSplit.localName, namespaceUri: itemNamespace, value: item.value, order: attributes.length });
    }
    state.elements += 1; const depth = stack.length; if (state.elements > state.options.maxElements || depth > state.options.maxDepth) { state.diagnostics.push(diagnostic("LIMIT_EXCEEDED", "XMP element count or depth exceeds configured bounds.", open)); return null; }
    const language = attributes.find((item) => item.namespaceUri === XML_NAMESPACE && item.localName === "lang")?.value ?? languageStack.at(-1) ?? null;
    const node: XmlNode = { qualifiedName, prefix: split.prefix, localName: split.localName, namespaceUri, attributes, children: [], start: open, end: tag.end, depth, text: "", language }; if (stack.length > 0) stack.at(-1)?.children.push(node); else roots.push(node); if (!selfClosing) { stack.push(node); namespaceStack.push(currentNamespaces); languageStack.push(language); }
  }
  if (stack.length !== 0 || roots.length !== 1) { state.diagnostics.push(diagnostic("MALFORMED_XML", "XMP must contain exactly one complete XML root element.")); return null; }
  return roots[0] ?? null;
}

function localIs(node: XmlNode, localName: string): boolean { return node.localName === localName; }
function attribute(node: XmlNode, localName: string, namespaceUri: string | null = null): XmlAttribute | undefined { return node.attributes.find((item) => item.localName === localName && (namespaceUri === null || item.namespaceUri === namespaceUri || item.qualifiedName === `rdf:${localName}`)); }
function rdfAttribute(node: XmlNode, localName: string): XmlAttribute | undefined { return node.attributes.find((item) => item.localName === localName && (item.namespaceUri === RDF_NAMESPACE || (item.prefix === "rdf" && item.namespaceUri === "rdf"))); }
function isRdf(node: XmlNode, localName: string): boolean { return localIs(node, localName) && (node.namespaceUri === RDF_NAMESPACE || node.namespaceUri === "rdf"); }
function nameFor(node: XmlNode): XmpQualifiedName { return { namespaceUri: node.namespaceUri ?? "", localName: node.localName, prefix: node.prefix, qualifiedName: node.qualifiedName }; }
function qualifiedNameForAttribute(item: XmlAttribute): XmpQualifiedName { return { namespaceUri: item.namespaceUri ?? "", localName: item.localName, prefix: item.prefix, qualifiedName: item.qualifiedName }; }

function aliasDefinition(name: XmpQualifiedName): XmpAliasDefinition | null {
  const aliases: readonly [string, string, string, string, ("Bag" | "Seq" | "Alt")?][] = [
    ["http://ns.adobe.com/photoshop/1.0/", "Authors", "http://purl.org/dc/elements/1.1/", "creator", "Seq"],
    ["http://ns.adobe.com/photoshop/1.0/", "Caption", "http://purl.org/dc/elements/1.1/", "description", "Alt"],
    ["http://ns.adobe.com/tiff/1.0/", "Artist", "http://purl.org/dc/elements/1.1/", "creator", "Seq"],
    ["http://ns.adobe.com/tiff/1.0/", "ImageDescription", "http://purl.org/dc/elements/1.1/", "description", "Alt"],
    ["http://ns.adobe.com/pdf/1.3/", "Author", "http://purl.org/dc/elements/1.1/", "creator", "Seq"],
    ["http://ns.adobe.com/pdf/1.3/", "Title", "http://purl.org/dc/elements/1.1/", "title", "Alt"],
  ];
  const match = aliases.find(([namespaceUri, localName]) => namespaceUri === name.namespaceUri && localName === name.localName); if (match === undefined) return null;
  return { alias: name, canonical: { namespaceUri: match[2], localName: match[3], prefix: "dc", qualifiedName: `dc:${match[3]}` }, ...(match[4] === undefined ? {} : { arrayForm: match[4] }) };
}
function textContent(node: XmlNode): string { return `${node.text}${node.children.map(textContent).join("")}`; }
function makeLiteral(node: XmlNode, qualifiers: readonly XmpQualifier[] = [], parseType?: "Literal"): XmpLiteralValue {
  const datatype = rdfAttribute(node, "datatype")?.value ?? null; const language = attribute(node, "lang", XML_NAMESPACE)?.value ?? node.language ?? null; const lexicalValue = textContent(node);
  const integer = /^[+-]?\d+$/.test(lexicalValue);
  const decimal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(lexicalValue);
  const double = /^[+-]?(?:(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|INF|NaN)$/.test(lexicalValue);
  const numericValue = Number(lexicalValue);
  const booleanValue = lexicalValue === "true" || lexicalValue === "1" ? true : lexicalValue === "false" || lexicalValue === "0" ? false : lexicalValue;
  const value = datatype === "http://www.w3.org/2001/XMLSchema#boolean" ? booleanValue : datatype === "http://www.w3.org/2001/XMLSchema#integer" && integer ? Number.isSafeInteger(numericValue) ? numericValue : lexicalValue : datatype === "http://www.w3.org/2001/XMLSchema#decimal" && decimal ? Number.isFinite(numericValue) ? numericValue : lexicalValue : datatype === "http://www.w3.org/2001/XMLSchema#double" && double ? Number.isFinite(numericValue) ? numericValue : lexicalValue : lexicalValue;
  return { kind: "literal", lexicalValue, value, datatypeUri: datatype, language, qualifiers, ...(parseType === undefined ? {} : { parseType }) };
}
function valueFingerprint(value: XmpValue): string {
  if (value.kind === "literal") return JSON.stringify([value.kind, value.lexicalValue, value.datatypeUri, value.language, value.qualifiers.map((qualifier) => [qualifier.name.namespaceUri, qualifier.name.localName, valueFingerprint(qualifier.value)])]);
  if (value.kind === "array") return JSON.stringify([value.kind, value.container, value.items.map(valueFingerprint), value.qualifiers.map((qualifier) => [qualifier.name.namespaceUri, qualifier.name.localName, valueFingerprint(qualifier.value)])]);
  return JSON.stringify([value.kind, value.resourceUri, value.nodeId, value.typeName?.namespaceUri, value.typeName?.localName, value.properties.map((property) => [property.name.namespaceUri, property.name.localName, valueFingerprint(property.value)]), value.qualifiers.map((qualifier) => [qualifier.name.namespaceUri, qualifier.name.localName, valueFingerprint(qualifier.value)])]);
}
function legacyValue(value: XmpValue): XmpPropertyValue | null {
  if (value.kind === "literal") return value.lexicalValue;
  if (value.kind === "array") { if (value.container === "Alt") { const languages: Record<string, string> = {}; for (const item of value.items) if (item.kind === "literal") languages[item.language ?? "x-default"] = item.lexicalValue; return languages; } return value.items.map((item) => item.kind === "literal" ? item.lexicalValue : valueFingerprint(item)); }
  return value.resourceUri ?? value.nodeId ?? valueFingerprint(value);
}
function collectQualifiers(node: XmlNode, excluded: ReadonlySet<string>, state: ParseState): readonly XmpQualifier[] {
  const qualifiers: XmpQualifier[] = [];
  for (const item of node.attributes) {
    const structural = (item.namespaceUri === RDF_NAMESPACE && excluded.has(`rdf:${item.localName}`)) || (item.namespaceUri === XML_NAMESPACE && item.localName === "lang");
    if (structural || item.qualifiedName === "xmlns" || item.prefix === "xmlns") continue;
    state.qualifiers += 1;
    if (state.qualifiers > state.options.maxQualifiers) { state.diagnostics.push(diagnostic("LIMIT_EXCEEDED", `XMP qualifier count exceeds ${state.options.maxQualifiers}.`, node.start)); break; }
    const qualifierNode: XmlNode = { qualifiedName: item.qualifiedName, prefix: item.prefix, localName: item.localName, namespaceUri: item.namespaceUri, attributes: [], children: [], start: node.start, end: node.end, depth: node.depth + 1, text: item.value, language: node.language };
    qualifiers.push({ name: qualifiedNameForAttribute(item), value: makeLiteral(qualifierNode), order: qualifiers.length });
  }
  return qualifiers;
}
function parseValue(node: XmlNode, state: ParseState): XmpValue {
  const resource = rdfAttribute(node, "resource")?.value; const nodeId = rdfAttribute(node, "nodeID")?.value; const parseType = rdfAttribute(node, "parseType")?.value; const excluded = new Set(["rdf:resource", "rdf:nodeID", "rdf:parseType", "rdf:datatype", "xml:lang", "xmlns"]); const qualifiers = collectQualifiers(node, excluded, state);
  if (resource !== undefined) return { kind: "resource", resourceUri: resource, nodeId: null, typeName: null, properties: [], qualifiers }; if (nodeId !== undefined) return { kind: "blank-node", resourceUri: null, nodeId, typeName: null, properties: [], qualifiers };
  const container = node.children.find((child) => isRdf(child, "Bag") || isRdf(child, "Seq") || isRdf(child, "Alt")); if (container !== undefined) { const items: XmpValue[] = []; for (const item of container.children.filter((child) => isRdf(child, "li"))) { if (items.length >= state.options.maxArrayItems) { state.diagnostics.push(diagnostic("LIMIT_EXCEEDED", `XMP array items exceed ${state.options.maxArrayItems}.`, container.start)); break; } items.push(parseValue(item, state)); } return { kind: "array", container: container.localName as "Bag" | "Seq" | "Alt", items, qualifiers }; }
  if (parseType === "Literal") return makeLiteral(node, qualifiers, "Literal");
  if (parseType === "Resource" || node.children.length > 0) {
    const resourceDescription = node.children.find((child) => isRdf(child, "Description"));
    const resourceChildren = resourceDescription?.children ?? node.children;
    const typeChild = resourceChildren.find((child) => isRdf(child, "type"));
    const resourceUri = resourceDescription === undefined ? null : rdfAttribute(resourceDescription, "about")?.value ?? null;
    const nestedNodeId = resourceDescription === undefined ? null : rdfAttribute(resourceDescription, "nodeID")?.value ?? null;
    return { kind: parseType === "Resource" ? "typed-resource" : nestedNodeId !== null ? "blank-node" : "resource", resourceUri, nodeId: nestedNodeId ?? (resourceUri === null ? `_:b${state.blankNodeIndex++}` : null), typeName: typeChild === undefined ? null : nameFor(typeChild), properties: parseDescriptionProperties(resourceChildren, state), qualifiers };
  }
  return makeLiteral(node, qualifiers);
}
function parseDescriptionProperties(children: readonly XmlNode[], state: ParseState): readonly XmpProperty[] {
  const properties: XmpProperty[] = []; for (const child of children) { if (state.properties >= state.options.maxProperties) { state.diagnostics.push(diagnostic("LIMIT_EXCEEDED", `XMP property count exceeds ${state.options.maxProperties}.`, child.start)); break; } properties.push(makeProperty(child, state, properties.length)); state.properties += 1; } return properties;
}
function makeProperty(node: XmlNode, state: ParseState, order: number): XmpProperty { const value = parseValue(node, state); const alias = aliasDefinition(nameFor(node)); return { name: nameFor(node), value, qualifiers: value.qualifiers, order, sourceStart: node.start, sourceEnd: node.end, aliasOf: alias?.canonical ?? null }; }
function subjectFor(description: XmlNode, state: ParseState): string { return rdfAttribute(description, "about")?.value ?? rdfAttribute(description, "ID")?.value ?? rdfAttribute(description, "nodeID")?.value ?? `_:b${state.blankNodeIndex++}`; }
function parseRdfDocument(root: XmlNode, state: ParseState, sourceLength: number): XmpRdfDocument | null {
  const descriptions: XmpDescription[] = [];
  const visit = (node: XmlNode, parent: XmlNode | null): void => {
    if (localIs(node, "Description") && (parent === null || isRdf(parent, "RDF"))) {
      const properties: XmpProperty[] = [];
      for (const item of node.attributes) {
        if (item.prefix === "xmlns" || item.qualifiedName === "xmlns" || (item.namespaceUri === RDF_NAMESPACE || (item.prefix === "rdf" && item.namespaceUri === "rdf")) && ["about", "ID", "nodeID", "type"].includes(item.localName) || item.prefix === "xml") continue;
        if (state.properties >= state.options.maxProperties) { state.diagnostics.push(diagnostic("LIMIT_EXCEEDED", `XMP property count exceeds ${state.options.maxProperties}.`, node.start)); break; }
        const valueNode: XmlNode = { qualifiedName: item.qualifiedName, prefix: item.prefix, localName: item.localName, namespaceUri: item.namespaceUri, attributes: [], children: [], start: node.start, end: node.end, depth: node.depth + 1, text: item.value, language: node.language };
        const value = makeLiteral(valueNode); const alias = aliasDefinition(qualifiedNameForAttribute(item));
        properties.push({ name: qualifiedNameForAttribute(item), value, qualifiers: [], order: properties.length, sourceStart: node.start, sourceEnd: node.end, aliasOf: alias?.canonical ?? null }); state.properties += 1;
      }
      properties.push(...parseDescriptionProperties(node.children, state));
      const typeChild = node.children.find((child) => isRdf(child, "type"));
      descriptions.push({ subject: subjectFor(node, state), typeName: typeChild === undefined ? null : nameFor(typeChild), properties, sourceStart: node.start, sourceEnd: node.end });
    }
    for (const child of node.children) visit(child, node);
  };
  visit(root, null);
  const properties = descriptions.flatMap((description) => description.properties);
  const document = { namespaces: state.namespaceBindings.slice(), descriptions, properties, sourceLength } satisfies XmpRdfDocument;
  try { state.outputBytes += new TextEncoder().encode(JSON.stringify(document)).byteLength; } catch { state.diagnostics.push(diagnostic("LIMIT_EXCEEDED", "XMP output could not be represented within the configured bound.")); return null; }
  if (state.outputBytes > state.options.maxOutputBytes) { state.diagnostics.push(diagnostic("LIMIT_EXCEEDED", `XMP output exceeds ${state.options.maxOutputBytes} bytes.`)); return null; }
  return document;
}
function legacyProperties(document: XmpRdfDocument): Readonly<Record<string, XmpPropertyValue>> { const properties: Record<string, XmpPropertyValue> = {}; for (const property of document.properties) { if (Object.hasOwn(properties, property.name.qualifiedName)) continue; const value = legacyValue(property.value); if (value !== null) properties[property.name.qualifiedName] = value; } return properties; }
function legacyNamespaces(document: XmpRdfDocument): Readonly<Record<string, string>> { const namespaces: Record<string, string> = {}; for (const binding of document.namespaces) namespaces[binding.prefix] = binding.namespaceUri; return namespaces; }
function attachStructuredModel(legacy: { readonly namespaces: Readonly<Record<string, string>>; readonly properties: Readonly<Record<string, XmpPropertyValue>> }, document: XmpRdfDocument, diagnostics: readonly XmpDiagnostic[]): StructuredXmpPacket { const packet = { namespaces: legacy.namespaces, properties: legacy.properties } as StructuredXmpPacket; const frozenDiagnostics = Object.freeze([...diagnostics]); Object.defineProperties(packet, { rdf: { value: document, enumerable: false }, model: { value: document, enumerable: false }, diagnostics: { value: frozenDiagnostics, enumerable: false }, toJSON: { value: () => ({ namespaces: packet.namespaces, properties: packet.properties, rdf: document, model: document, diagnostics: frozenDiagnostics }), enumerable: false } }); return packet; }
function packetFailure(diagnostics: readonly XmpDiagnostic[]): StructuredXmpParseResult { return { value: null, diagnostics: diagnostics.length > 0 ? diagnostics : [diagnostic("MALFORMED_XML", "XMP packet is not a safe XML/RDF document.")] }; }

export function parseStructuredXmpDetailed(packet: string, overrides: StructuredXmpOptions = {}): StructuredXmpParseResult {
  const options = resolveStructuredXmpOptions(overrides); if (options === null) return packetFailure([diagnostic("LIMIT_EXCEEDED", "XMP decoder limits must be positive safe integers.")]); let inputBytes: number; try { inputBytes = new TextEncoder().encode(packet).byteLength; } catch { return packetFailure([diagnostic("MALFORMED_XML", "XMP packet could not be encoded as UTF-8.")]); }
  if (inputBytes > options.maxInputBytes) return packetFailure([diagnostic("LIMIT_EXCEEDED", `XMP packet exceeds ${options.maxInputBytes} input bytes.`)]); if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(packet)) return packetFailure([diagnostic("UNSAFE_ENTITY", "XMP DTDs and entity declarations are not permitted.")]);
  const state: ParseState = { options, diagnostics: [], namespaceBindings: [], elements: 0, attributes: 0, textBytes: 0, namespaces: 0, properties: 0, qualifiers: 0, outputBytes: 0, blankNodeIndex: 0 }; const root = parseXml(packet, state); if (root === null || state.diagnostics.some((item) => item.severity === "error")) return packetFailure(state.diagnostics); const document = parseRdfDocument(root, state, packet.length); if (document === null || state.diagnostics.some((item) => item.severity === "error")) return packetFailure(state.diagnostics); return { value: attachStructuredModel({ namespaces: legacyNamespaces(document), properties: legacyProperties(document) }, document, state.diagnostics), diagnostics: state.diagnostics };
}
export function parseStructuredXmp(packet: string, overrides: StructuredXmpOptions = {}): StructuredXmpPacket | null { return parseStructuredXmpDetailed(packet, overrides).value; }
function isLegacyPropertyValue(value: unknown): value is XmpPropertyValue { if (typeof value === "string") return true; if (Array.isArray(value)) return value.every((entry) => typeof entry === "string"); return value !== null && typeof value === "object" && Object.values(value).every((entry) => typeof entry === "string"); }
function isStructuredXmpPacket(value: unknown, options: EffectiveOptions): value is StructuredXmpPacket {
  if (value === null || typeof value !== "object") return false;
  const candidate = value as { namespaces?: unknown; properties?: unknown };
  if (candidate.namespaces === null || typeof candidate.namespaces !== "object" || candidate.properties === null || typeof candidate.properties !== "object") return false;
  const namespaces = Object.values(candidate.namespaces);
  const properties = Object.values(candidate.properties);
  if (namespaces.length > options.maxNamespaces || properties.length > options.maxProperties || !namespaces.every((entry) => typeof entry === "string") || !properties.every(isLegacyPropertyValue)) return false;
  try { return new TextEncoder().encode(JSON.stringify({ namespaces: candidate.namespaces, properties: candidate.properties })).byteLength <= options.maxOutputBytes; } catch { return false; }
}
export function parseStructuredXmpWithDecoder(packet: string, decoder: StructuredXmpDecoder, overrides: StructuredXmpOptions = {}): StructuredXmpPacket | null { const options = resolveStructuredXmpOptions(overrides); if (options === null) return null; const canonical = parseStructuredXmpDetailed(packet, options); if (canonical.value === null || canonical.value.rdf === undefined) return null; try { const result = decoder.parse(packet, options); return isStructuredXmpPacket(result, options) ? attachStructuredModel(result, canonical.value.rdf, canonical.diagnostics) : null; } catch { return null; } }
export function parseStructuredXmpWithDecoderDetailed(packet: string, decoder: StructuredXmpDecoder, overrides: StructuredXmpOptions = {}): StructuredXmpParseResult { const options = resolveStructuredXmpOptions(overrides); if (options === null) return packetFailure([diagnostic("LIMIT_EXCEEDED", "XMP decoder limits must be positive safe integers.")]); const canonical = parseStructuredXmpDetailed(packet, options); if (canonical.value === null || canonical.value.rdf === undefined) return canonical; try { const result = decoder.parse(packet, options); if (!isStructuredXmpPacket(result, options)) return packetFailure([diagnostic("INVALID_ADAPTER_OUTPUT", "Injected XMP decoder output does not satisfy the bounded compatibility contract.")]); return { value: attachStructuredModel(result, canonical.value.rdf, canonical.diagnostics), diagnostics: canonical.diagnostics }; } catch { return packetFailure([diagnostic("INVALID_ADAPTER_OUTPUT", "Injected XMP decoder threw while processing a bounded XMP packet.")]); } }
export function parseStructuredXmpBytes(bytes: Uint8Array, overrides: StructuredXmpOptions = {}): StructuredXmpPacket | null { const options = resolveStructuredXmpOptions(overrides); if (options === null || bytes.byteLength > options.maxInputBytes) return null; try { return parseStructuredXmp(new TextDecoder("utf-8", { fatal: true }).decode(bytes), options); } catch { return null; } }
export function parseStructuredXmpBytesDetailed(bytes: Uint8Array, overrides: StructuredXmpOptions = {}): StructuredXmpParseResult { const options = resolveStructuredXmpOptions(overrides); if (options === null) return packetFailure([diagnostic("LIMIT_EXCEEDED", "XMP byte input exceeds the configured decoder limit.")]); if (bytes.byteLength > options.maxInputBytes) return packetFailure([diagnostic("LIMIT_EXCEEDED", "XMP byte input exceeds the configured decoder limit.")]); try { return parseStructuredXmpDetailed(new TextDecoder("utf-8", { fatal: true }).decode(bytes), options); } catch { return packetFailure([diagnostic("MALFORMED_XML", "XMP bytes are not valid UTF-8.")]); } }
export function parseStructuredXmpBytesWithDecoder(bytes: Uint8Array, decoder: StructuredXmpDecoder, overrides: StructuredXmpOptions = {}): StructuredXmpPacket | null { const options = resolveStructuredXmpOptions(overrides); if (options === null || bytes.byteLength > options.maxInputBytes) return null; try { return parseStructuredXmpWithDecoder(new TextDecoder("utf-8", { fatal: true }).decode(bytes), decoder, options); } catch { return null; } }
export function parseStructuredXmpBytesWithDecoderDetailed(bytes: Uint8Array, decoder: StructuredXmpDecoder, overrides: StructuredXmpOptions = {}): StructuredXmpParseResult { const options = resolveStructuredXmpOptions(overrides); if (options === null) return packetFailure([diagnostic("LIMIT_EXCEEDED", "XMP decoder limits must be positive safe integers.")]); if (bytes.byteLength > options.maxInputBytes) return packetFailure([diagnostic("LIMIT_EXCEEDED", "XMP byte input exceeds the configured decoder limit.")]); try { return parseStructuredXmpWithDecoderDetailed(new TextDecoder("utf-8", { fatal: true }).decode(bytes), decoder, options); } catch { return packetFailure([diagnostic("MALFORMED_XML", "XMP bytes are not valid UTF-8.")]); } }
export function validateStructuredXmpPacket(value: unknown, overrides: StructuredXmpOptions = {}): value is StructuredXmpPacket { const options = resolveStructuredXmpOptions(overrides); return options !== null && isStructuredXmpPacket(value, options); }
function propertyIdentity(property: XmpProperty): string { const name = property.aliasOf ?? property.name; return `${name.namespaceUri}\u0000${name.localName}`; }
export function mergeStructuredXmp(packets: readonly { readonly value: StructuredXmpPacket | null; readonly packetIndex?: number; readonly sourceId?: string | null; readonly source?: XmpPacketProvenance | null }[], policy: "preserve-all" | "first" | "last" = "preserve-all"): XmpMergedDocument { const grouped = new Map<string, XmpPropertyCandidate[]>(); for (const packet of packets) { if (packet.value === null || packet.value.rdf === undefined) continue; for (const property of packet.value.rdf.properties) { const identity = propertyIdentity(property); const candidates = grouped.get(identity) ?? []; candidates.push({ identity, property, packetIndex: packet.packetIndex ?? 0, sourceId: packet.sourceId ?? packet.source?.id ?? null, source: packet.source ?? null }); grouped.set(identity, candidates); } } const properties: XmpPropertyCandidate[] = []; const conflicts: XmpConflict[] = []; for (const [identity, candidates] of grouped) { if (new Set(candidates.map((candidate) => valueFingerprint(candidate.property.value))).size > 1) conflicts.push({ identity, candidates: candidates.slice(), reason: candidates.some((candidate) => candidate.property.aliasOf !== null) ? "alias-values" : "different-values" }); if (policy === "first") properties.push(candidates[0] as XmpPropertyCandidate); else if (policy === "last") properties.push(candidates.at(-1) as XmpPropertyCandidate); else properties.push(...candidates); } const candidateRecord: Record<string, readonly XmpPropertyCandidate[]> = {}; for (const [identity, candidates] of grouped) candidateRecord[identity] = Object.freeze(candidates.slice()); return { properties: Object.freeze(properties), candidates: candidateRecord, conflicts: Object.freeze(conflicts), policy }; }
export function parseStructuredXmpDocuments(packets: readonly string[], options: StructuredXmpOptions & { readonly mergePolicy?: "preserve-all" | "first" | "last" } = {}): { readonly documents: readonly StructuredXmpParseResult[]; readonly merged: XmpMergedDocument } { const resolved = resolveStructuredXmpOptions(options); const limited = resolved === null ? [] : packets.slice(0, resolved.maxPackets); const documents = limited.map((packet) => parseStructuredXmpDetailed(packet, options)); if (resolved !== null && packets.length > resolved.maxPackets) documents.push(packetFailure([diagnostic("LIMIT_EXCEEDED", `XMP packet count exceeds ${resolved.maxPackets}.`)])); return { documents, merged: mergeStructuredXmp(documents.map((document, packetIndex) => ({ value: document.value, packetIndex })), options.mergePolicy ?? "preserve-all") }; }
export function parseXmpPacket(payload: Uint8Array, maxStringBytes: number): XmpPacketParseResult { if (payload.length < XMP_IDENTIFIER.length) return { matched: false, packet: null }; for (let index = 0; index < XMP_IDENTIFIER.length; index += 1) if (payload[index] !== XMP_IDENTIFIER[index]) return { matched: false, packet: null }; const bytes = payload.subarray(XMP_IDENTIFIER.length); if (bytes.length > maxStringBytes) return { matched: true, packet: null }; try { return { matched: true, packet: new TextDecoder("utf-8", { fatal: true }).decode(bytes) }; } catch { return { matched: true, packet: null }; } }
