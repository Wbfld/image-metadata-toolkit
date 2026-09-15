import { wantsGroup, type ResolvedSelection } from "../selection.js";
import { throwIfAborted } from "../security/abort.js";
import type { MetadataBlock, MetadataWarning, ParsedMetadataResult, SecurityLimits } from "../types.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const RDF_NAMESPACE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const NAME = /^[A-Za-z_][\w.-]*(?::[A-Za-z_][\w.-]*)?$/u;

interface OpenTag {
  readonly name: string;
  readonly localName: string;
  readonly namespace: string | null;
  readonly start: number;
  readonly end: number;
  readonly selfClosing: boolean;
  readonly bindings: ReadonlyMap<string, string>;
}

interface StackEntry extends OpenTag {
  readonly metadataStart: number | null;
  readonly rdfStart: number | null;
}

function appendWarning(warnings: MetadataWarning[], limits: SecurityLimits, warning: MetadataWarning): void {
  if (warnings.length < limits.maxWarnings) warnings.push(warning);
}

function byteOffset(text: string, characterOffset: number): number {
  return new TextEncoder().encode(text.slice(0, characterOffset)).byteLength;
}

function tagEnd(text: string, start: number): number | null {
  let quote: "\"" | "'" | null = null;
  for (let index = start + 1; index < text.length; index += 1) {
    const character = text[index] ?? "";
    if (quote !== null) {
      if (character === quote) quote = null;
    } else if (character === "\"" || character === "'") quote = character;
    else if (character === ">") return index + 1;
  }
  return null;
}

function parseBindings(body: string, inherited: ReadonlyMap<string, string>, limits: SecurityLimits): ReadonlyMap<string, string> | null {
  const bindings = new Map(inherited);
  const attribute = /\s(xmlns(?::[A-Za-z_][\w.-]*)?)\s*=\s*(["'])(.*?)\2/gsu;
  let count = 0;
  for (const match of body.matchAll(attribute)) {
    if (++count > limits.maxXmpAttributes) return null;
    const name = match[1] ?? "";
    const value = match[3] ?? "";
    if (value.length > limits.maxStringBytes || /[<>]/u.test(value)) return null;
    bindings.set(name === "xmlns" ? "" : name.slice(6), value);
  }
  return bindings;
}

function parseOpenTag(text: string, start: number, end: number, inherited: ReadonlyMap<string, string>, limits: SecurityLimits): OpenTag | null {
  const body = text.slice(start + 1, end - 1);
  const match = /^\s*([^\s/>]+)([\s\S]*?)\/?\s*$/u.exec(body);
  if (match === null || !NAME.test(match[1] ?? "")) return null;
  const name = match[1] ?? "";
  const bindings = parseBindings(match[2] ?? "", inherited, limits);
  if (bindings === null) return null;
  const separator = name.indexOf(":");
  const prefix = separator < 0 ? "" : name.slice(0, separator);
  return {
    name,
    localName: separator < 0 ? name : name.slice(separator + 1),
    namespace: bindings.get(prefix) ?? null,
    start,
    end,
    selfClosing: /\/\s*>$/u.test(text.slice(start, end)),
    bindings,
  };
}

function malformed(message: string, offset: number): ParsedMetadataResult {
  return {
    format: "svg", mimeType: "image/svg+xml", dimensions: null, fields: [], exif: null, xmp: null, iptc: null, icc: null, jfif: null, photoshop: null, pngText: [],
    warnings: [{ code: "INVALID_VALUE", message, severity: "error", offset }],
  };
}

/** Parse bounded embedded RDF/XML packets in an SVG `<metadata>` element.
 * This is intentionally an inventory parser, not a general SVG/XML renderer.
 */
export function parseSvg(bytes: Uint8Array, limits: SecurityLimits, selection?: ResolvedSelection, signal?: AbortSignal): ParsedMetadataResult {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return malformed("SVG input is not valid UTF-8.", 0);
  }
  const warnings: MetadataWarning[] = [];
  const blocks: MetadataBlock[] = [];
  const packets: string[] = [];
  const stack: StackEntry[] = [];
  const includeXmp = wantsGroup(selection, "XMP");
  let rootSeen = false;
  let rootValid = false;
  let rootClosed = false;
  let tags = 0;
  let cursor = 0;
  while (cursor < text.length) {
    throwIfAborted(signal);
    const start = text.indexOf("<", cursor);
    if (start < 0) break;
    if (text.startsWith("<!--", start)) {
      const end = text.indexOf("-->", start + 4);
      if (end < 0) return malformed("SVG comment is not terminated.", byteOffset(text, start));
      cursor = end + 3;
      continue;
    }
    if (text.startsWith("<![CDATA[", start)) {
      const end = text.indexOf("]]>", start + 9);
      if (end < 0) return malformed("SVG CDATA section is not terminated.", byteOffset(text, start));
      cursor = end + 3;
      continue;
    }
    if (text.startsWith("<?", start)) {
      const end = text.indexOf("?>", start + 2);
      if (end < 0) return malformed("SVG processing instruction is not terminated.", byteOffset(text, start));
      cursor = end + 2;
      continue;
    }
    if (text.startsWith("<!", start)) return malformed("SVG DTD and entity declarations are not supported.", byteOffset(text, start));
    const end = tagEnd(text, start);
    if (end === null) return malformed("SVG element tag is not terminated.", byteOffset(text, start));
    if (++tags > limits.maxXmpNodes) return malformed("SVG element count exceeds the configured limit.", byteOffset(text, start));
    const raw = text.slice(start, end);
    if (raw.startsWith("</")) {
      const name = /^<\/\s*([^\s>]+)\s*>$/u.exec(raw)?.[1];
      const entry = stack.pop();
      if (name === undefined || entry === undefined || entry.name !== name) return malformed("SVG element nesting is malformed.", byteOffset(text, start));
      if (entry.rdfStart !== null && entry.metadataStart !== null) {
        const offset = byteOffset(text, entry.rdfStart);
        const length = byteOffset(text, end) - offset;
        if (!includeXmp) blocks.push({ id: `svg:XMP:${offset}`, family: "XMP", container: "SVG metadata RDF/XML", status: "skipped", offset, length, associatedImage: null, sensitivity: "high", warningCodes: [] });
        else if (packets.length >= limits.maxXmpPackets) {
          blocks.push({ id: `svg:XMP:${offset}`, family: "XMP", container: "SVG metadata RDF/XML", status: "partial", offset, length, associatedImage: null, sensitivity: "high", warningCodes: ["LIMIT_EXCEEDED"] });
          appendWarning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "SVG RDF packet count exceeds the configured limit.", severity: "warning", offset });
        }
        else {
          const packet = text.slice(entry.rdfStart, end);
          const packetBytes = new TextEncoder().encode(packet).byteLength;
          if (packetBytes > limits.maxMetadataBytes || packetBytes > limits.maxXmpTextBytes) {
            blocks.push({ id: `svg:XMP:${offset}`, family: "XMP", container: "SVG metadata RDF/XML", status: "partial", offset, length, associatedImage: null, sensitivity: "high", warningCodes: ["LIMIT_EXCEEDED"] });
            appendWarning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "SVG RDF packet exceeds the configured metadata limit.", severity: "warning", offset, length: packetBytes });
          }
          else {
            packets.push(packet);
            blocks.push({ id: `svg:XMP:${offset}`, family: "XMP", container: "SVG metadata RDF/XML", status: "decoded", offset, length, associatedImage: null, sensitivity: "high", warningCodes: [] });
          }
        }
      }
      if (entry.metadataStart !== null && entry.rdfStart === null) {
        const offset = byteOffset(text, entry.metadataStart);
        const length = byteOffset(text, end) - offset;
        if (entry.localName === "metadata") {
          if (length > limits.maxMetadataBytes) {
            blocks.push({ id: `svg:metadata:${offset}`, family: "Unknown", container: "SVG metadata element", status: "partial", offset, length, associatedImage: null, sensitivity: "high", warningCodes: ["LIMIT_EXCEEDED"] });
            appendWarning(warnings, limits, { code: "LIMIT_EXCEEDED", message: "SVG metadata element exceeds the configured metadata limit.", severity: "warning", offset, length });
          } else if (!blocks.some((block) => block.offset !== null && block.length !== null && block.offset >= offset && block.offset + block.length <= offset + length)) {
            blocks.push({ id: `svg:metadata:${offset}`, family: "Unknown", container: "SVG metadata element", status: "opaque", offset, length, associatedImage: null, sensitivity: "high", warningCodes: [] });
          }
        }
      }
      if (stack.length === 0) rootClosed = true;
      cursor = end;
      continue;
    }
    const open = parseOpenTag(text, start, end, stack.at(-1)?.bindings ?? new Map(), limits);
    if (open === null) return malformed("SVG element name or namespace declaration is malformed.", byteOffset(text, start));
    if (!rootSeen) {
      rootSeen = true;
      rootValid = open.localName === "svg" && open.namespace === SVG_NAMESPACE;
      if (!rootValid) return malformed("SVG root must be in the SVG namespace.", byteOffset(text, start));
    } else if (rootClosed || stack.length === 0) return malformed("SVG document contains more than one root element.", byteOffset(text, start));
    const metadataStart = open.localName === "metadata" && open.namespace === SVG_NAMESPACE ? start : stack.at(-1)?.metadataStart ?? null;
    const rdfStart = open.localName === "RDF" && open.namespace === RDF_NAMESPACE && metadataStart !== null ? start : null;
    const entry: StackEntry = { ...open, metadataStart, rdfStart };
    if (!open.selfClosing) {
      if (stack.length >= limits.maxXmpDepth) return malformed("SVG nesting depth exceeds the configured limit.", byteOffset(text, start));
      stack.push(entry);
    } else {
      if (stack.length === 0 && open.localName === "svg") rootClosed = true;
      if (metadataStart !== null && rdfStart === null && open.localName === "metadata") {
        blocks.push({ id: `svg:metadata:${byteOffset(text, start)}`, family: "Unknown", container: "SVG metadata element", status: "opaque", offset: byteOffset(text, start), length: byteOffset(text, end) - byteOffset(text, start), associatedImage: null, sensitivity: "high", warningCodes: [] });
      }
    }
    cursor = end;
  }
  if (!rootSeen || !rootValid || !rootClosed || stack.length !== 0 || text.slice(cursor).trim().length > 0) return malformed("SVG document is incomplete, has trailing content, or has unclosed elements.", byteOffset(text, cursor));
  return { format: "svg", mimeType: "image/svg+xml", dimensions: null, fields: [], exif: null, xmp: includeXmp && packets.length > 0 ? { packets } : null, iptc: null, icc: null, jfif: null, photoshop: null, pngText: [], blocks, warnings };
}
