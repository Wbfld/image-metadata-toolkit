import { detectFormat } from "../detect-format.js";
import { materializeInput } from "../input.js";
import { resolveLimits } from "../security/limits.js";
import type { ImageFormat, MetadataInput, SecurityLimits } from "../types.js";

export type C2paInventoryStatus = "not-present" | "detected" | "malformed" | "limited" | "unsupported";
export type C2paInventoryContainer = "jpeg-app11" | "png-cabx" | "png-itxt" | "webp-chunk" | "iso-bmff-box";

export interface C2paInventoryDiagnostic {
  readonly code: "TRUNCATED_DATA" | "MALFORMED_STRUCTURE" | "LIMIT_EXCEEDED" | "UNSUPPORTED_STRUCTURE" | "REMOTE_REFERENCE" | "DUPLICATE_STORE";
  readonly message: string;
  readonly offset: number | null;
  readonly length: number | null;
}

export interface C2paInventoryStore {
  readonly id: string;
  readonly kind: "jumbf" | "c2pa" | "candidate";
  readonly container: C2paInventoryContainer;
  readonly format: ImageFormat;
  readonly offset: number;
  readonly length: number;
  readonly payloadOffset: number;
  readonly payloadLength: number;
  readonly parentId: string | null;
  readonly boxType: string | null;
  readonly label: string | null;
  readonly manifestReferences: readonly string[];
  readonly remoteReferences: readonly string[];
  readonly mutationRisk: "high" | "unknown";
  readonly structuralStatus: "inventoried" | "malformed" | "opaque";
}

export interface C2paInventoryRelationship {
  readonly sourceStoreId: string;
  readonly targetStoreId: string | null;
  readonly reference: string;
  readonly kind: "manifest" | "remote" | "duplicate" | "unresolved";
}

export interface C2paInventoryResult {
  readonly format: ImageFormat;
  readonly status: C2paInventoryStatus;
  readonly detected: boolean;
  readonly stores: readonly C2paInventoryStore[];
  readonly relationships: readonly C2paInventoryRelationship[];
  readonly diagnostics: readonly C2paInventoryDiagnostic[];
  readonly mutationRisk: "none" | "high" | "unknown";
  readonly complete: boolean;
  readonly remoteReferencesFetched: false;
}

export interface C2paInventoryOptions {
  readonly limits?: Partial<SecurityLimits>;
}

interface MutableInventory {
  readonly bytes: Uint8Array;
  readonly format: ImageFormat;
  readonly stores: C2paInventoryStore[];
  readonly relationships: C2paInventoryRelationship[];
  readonly diagnostics: C2paInventoryDiagnostic[];
  limited: boolean;
  malformed: boolean;
  unsupported: boolean;
  scannedComplete: boolean;
  scannedUnits: number;
}

const UTF8 = new TextDecoder("utf-8", { fatal: false });
const C2PA_MANIFEST_UUID = Uint8Array.from([0x63, 0x32, 0x70, 0x61, 0x00, 0x11, 0x00, 0x10, 0x80, 0x00, 0x00, 0xaa, 0x00, 0x38, 0x9b, 0x71]);
const C2PA_ASSERTION_UUID = Uint8Array.from([0x63, 0x32, 0x61, 0x73, 0x00, 0x11, 0x00, 0x10, 0x80, 0x00, 0x00, 0xaa, 0x00, 0x38, 0x9b, 0x71]);

function uint32(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) * 0x1000000 + (bytes[offset + 1] ?? 0) * 0x10000 + (bytes[offset + 2] ?? 0) * 0x100 + (bytes[offset + 3] ?? 0);
}

function uint32LittleEndian(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) + (bytes[offset + 1] ?? 0) * 0x100 + (bytes[offset + 2] ?? 0) * 0x10000 + (bytes[offset + 3] ?? 0) * 0x1000000;
}

function safeAdd(left: number, right: number): number | null {
  const value = left + right;
  return left >= 0 && right >= 0 && Number.isSafeInteger(value) ? value : null;
}

function ascii(bytes: Uint8Array, offset: number, text: string): boolean {
  if (offset < 0 || offset + text.length > bytes.length) return false;
  for (let index = 0; index < text.length; index += 1) if (bytes[offset + index] !== text.charCodeAt(index)) return false;
  return true;
}

function startsWithBytes(bytes: Uint8Array, expected: Uint8Array): boolean {
  if (expected.length > bytes.length) return false;
  for (let index = 0; index < expected.length; index += 1) if (bytes[index] !== expected[index]) return false;
  return true;
}

function text(bytes: Uint8Array): string {
  return UTF8.decode(bytes.subarray(0, Math.min(bytes.length, 64 * 1024)));
}

function references(bytes: Uint8Array, limits: SecurityLimits): { readonly manifests: readonly string[]; readonly remote: readonly string[] } {
  const value = text(bytes);
  const manifests = [...new Set((value.match(/urn:c2pa:[A-Za-z0-9._:/-]+|c2pa:[A-Za-z0-9._:/-]+/gu) ?? []).slice(0, limits.maxXmpProperties))];
  const remote = [...new Set((value.match(/https?:\/\/[^\s"'<>]{1,2048}/gu) ?? []).slice(0, limits.maxXmpProperties))];
  return { manifests, remote };
}

function candidateKind(bytes: Uint8Array, boxType: string | null): "jumbf" | "c2pa" | "candidate" {
  const lower = text(bytes).toLowerCase();
  if (boxType === "jumb" || lower.includes("jumbf")) return "jumbf";
  if (boxType === "c2pa" || lower.includes("c2pa")) return "c2pa";
  return "candidate";
}

function addDiagnostic(state: MutableInventory, limits: SecurityLimits, diagnostic: C2paInventoryDiagnostic): void {
  if (state.diagnostics.length < limits.maxWarnings) state.diagnostics.push(diagnostic);
  if (diagnostic.code === "LIMIT_EXCEEDED") state.limited = true;
  if (diagnostic.code === "UNSUPPORTED_STRUCTURE") state.unsupported = true;
  if (diagnostic.code === "MALFORMED_STRUCTURE" || diagnostic.code === "TRUNCATED_DATA") state.malformed = true;
}

function addRelationship(state: MutableInventory, limits: SecurityLimits, relationship: C2paInventoryRelationship): void {
  if (state.relationships.length >= limits.maxAdapterItems) {
    addDiagnostic(state, limits, { code: "LIMIT_EXCEEDED", message: "C2PA/JUMBF relationship output exceeds the configured limit.", offset: null, length: null });
    return;
  }
  state.relationships.push(relationship);
}

function consumeUnit(state: MutableInventory, limits: SecurityLimits, offset: number, length: number | null): boolean {
  if (state.scannedUnits >= limits.maxSegments) {
    addDiagnostic(state, limits, { code: "LIMIT_EXCEEDED", message: "C2PA/JUMBF container structure exceeds the configured unit limit.", offset, length });
    return false;
  }
  state.scannedUnits += 1;
  return true;
}

function addStore(
  state: MutableInventory,
  limits: SecurityLimits,
  input: { readonly kind: C2paInventoryStore["kind"]; readonly container: C2paInventoryContainer; readonly start: number; readonly end: number; readonly payloadStart: number; readonly payloadEnd: number; readonly parentId: string | null; readonly boxType: string | null },
): string | null {
  if (state.stores.length >= limits.maxSegments) {
    addDiagnostic(state, limits, { code: "LIMIT_EXCEEDED", message: "C2PA/JUMBF inventory store count exceeds the configured limit.", offset: input.start, length: input.end - input.start });
    return null;
  }
  const payload = state.bytes.subarray(input.payloadStart, input.payloadEnd);
  const id = `c2pa:${state.stores.length}:${input.start}`;
  const refs = references(payload, limits);
  const store: C2paInventoryStore = {
    id,
    kind: input.kind,
    container: input.container,
    format: state.format,
    offset: input.start,
    length: input.end - input.start,
    payloadOffset: input.payloadStart,
    payloadLength: input.payloadEnd - input.payloadStart,
    parentId: input.parentId,
    boxType: input.boxType,
    label: null,
    manifestReferences: refs.manifests,
    remoteReferences: refs.remote,
    mutationRisk: "high",
    structuralStatus: input.kind === "candidate" ? "opaque" : "inventoried",
  };
  state.stores.push(store);
  return id;
}

function scanTextForStore(state: MutableInventory, bytes: Uint8Array, limits: SecurityLimits, container: C2paInventoryContainer, start: number, end: number, payloadStart: number, payloadEnd: number, boxType: string | null, parentId: string | null = null, forceCarrier = false): void {
  const payload = bytes.subarray(payloadStart, payloadEnd);
  const value = text(payload).toLowerCase();
  const unknownC2paBox = boxType !== null && (boxType.startsWith("c2") || boxType.includes("jumb"));
  if (!forceCarrier && !value.includes("c2pa") && !value.includes("jumbf") && boxType !== "jumb" && boxType !== "c2pa" && !unknownC2paBox) return;
  if (unknownC2paBox && boxType !== "jumb" && boxType !== "c2pa") addDiagnostic(state, limits, { code: "UNSUPPORTED_STRUCTURE", message: `The ${boxType} C2PA/JUMBF-like carrier is opaque and was not structurally decoded.`, offset: start, length: end - start });
  const kind = candidateKind(payload, boxType);
  const id = addStore(state, limits, { kind, container, start, end, payloadStart, payloadEnd, parentId, boxType });
  if (id === null) return;
  const store = state.stores.at(-1);
  if (store === undefined) return;
  const refs = references(payload, limits);
  state.stores[state.stores.length - 1] = { ...store, parentId, manifestReferences: refs.manifests, remoteReferences: refs.remote };
  for (const reference of refs.remote) {
    addDiagnostic(state, limits, { code: "REMOTE_REFERENCE", message: "A remote C2PA/JUMBF reference was inventoried but not fetched.", offset: start, length: end - start });
    addRelationship(state, limits, { sourceStoreId: id, targetStoreId: null, reference, kind: "remote" });
  }
  for (const reference of refs.manifests) addRelationship(state, limits, { sourceStoreId: id, targetStoreId: null, reference, kind: "unresolved" });
}

function scanJpeg(state: MutableInventory, bytes: Uint8Array, limits: SecurityLimits): void {
  if (bytes.length < 2) {
    addDiagnostic(state, limits, { code: "TRUNCATED_DATA", message: "JPEG start marker is truncated while inventorying C2PA/JUMBF.", offset: 0, length: bytes.length });
    return;
  }
  let cursor = 2;
  let reachedScan = false;
  let terminated = false;
  while (cursor + 1 < bytes.length) {
    if (bytes[cursor] !== 0xff) {
      state.scannedComplete = false;
      return;
    }
    while (cursor < bytes.length && bytes[cursor] === 0xff) cursor += 1;
    const marker = bytes[cursor];
    if (marker === undefined) break;
    cursor += 1;
    if (marker === 0xd9) {
      terminated = true;
      break;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (cursor + 2 > bytes.length) {
      addDiagnostic(state, limits, { code: "TRUNCATED_DATA", message: "JPEG marker length is truncated while inventorying C2PA/JUMBF.", offset: cursor - 2, length: null });
      return;
    }
    const length = (bytes[cursor] ?? 0) * 0x100 + (bytes[cursor + 1] ?? 0);
    const end = safeAdd(cursor, length);
    if (length < 2 || end === null || end > bytes.length) {
      addDiagnostic(state, limits, { code: "TRUNCATED_DATA", message: "JPEG marker extends beyond the supplied bytes.", offset: cursor - 2, length });
      return;
    }
    if (!consumeUnit(state, limits, cursor - 2, end - cursor + 2)) return;
    if (marker === 0xda) {
      reachedScan = true;
      let hasEoi = false;
      for (let index = end; index + 1 < bytes.length; index += 1) {
        if (bytes[index] === 0xff && bytes[index + 1] === 0xd9) {
          hasEoi = true;
          break;
        }
      }
      if (!hasEoi) addDiagnostic(state, limits, { code: "TRUNCATED_DATA", message: "JPEG entropy-coded data has no end marker.", offset: end, length: bytes.length - end });
      terminated = hasEoi;
      break;
    }
    if (marker === 0xeb) scanTextForStore(state, bytes, limits, "jpeg-app11", cursor - 2, end, cursor + 2, end, null, null, true);
    cursor = end;
  }
  if (!reachedScan && !terminated) addDiagnostic(state, limits, { code: "TRUNCATED_DATA", message: "JPEG scan structure is truncated before a complete image terminator.", offset: cursor, length: null });
}

function pngCrc(bytes: Uint8Array, start: number, end: number): number {
  let crc = 0xffffffff;
  for (let index = start; index < end; index += 1) {
    crc ^= bytes[index] ?? 0;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function scanPng(state: MutableInventory, bytes: Uint8Array, limits: SecurityLimits): void {
  if (bytes.length < 8) {
    addDiagnostic(state, limits, { code: "TRUNCATED_DATA", message: "PNG signature is truncated while inventorying C2PA/JUMBF.", offset: 0, length: bytes.length });
    return;
  }
  let cursor = 8;
  let chunks = 0;
  let sawIend = false;
  while (cursor + 12 <= bytes.length) {
    if (chunks >= limits.maxPngChunks) {
      addDiagnostic(state, limits, { code: "LIMIT_EXCEEDED", message: "PNG chunk count exceeds the configured inventory limit.", offset: cursor, length: null });
      return;
    }
    chunks += 1;
    const length = uint32(bytes, cursor);
    const dataStart = cursor + 8;
    const dataEnd = safeAdd(dataStart, length);
    const end = dataEnd === null ? null : safeAdd(dataEnd, 4);
    if (dataEnd === null || end === null || end > bytes.length) {
      addDiagnostic(state, limits, { code: "TRUNCATED_DATA", message: "PNG chunk extends beyond the supplied bytes.", offset: cursor, length });
      return;
    }
    if (!consumeUnit(state, limits, cursor, end - cursor)) return;
    const type = String.fromCharCode(...bytes.subarray(cursor + 4, cursor + 8));
    if (pngCrc(bytes, cursor + 4, dataEnd) !== uint32(bytes, dataEnd)) addDiagnostic(state, limits, { code: "MALFORMED_STRUCTURE", message: `PNG ${type} chunk CRC does not match its payload.`, offset: cursor, length: end - cursor });
    if (type === "caBX") scanTextForStore(state, bytes, limits, "png-cabx", cursor, end, dataStart, dataEnd, "c2pa", null, true);
    if (type === "iTXt") {
      const payload = bytes.subarray(dataStart, dataEnd);
      const keywordEnd = payload.indexOf(0);
      if (keywordEnd >= 0 && text(payload.subarray(0, keywordEnd)).toLowerCase().includes("c2pa")) scanTextForStore(state, bytes, limits, "png-itxt", cursor, end, dataStart, dataEnd, "c2pa", null, true);
    }
    if (type !== "caBX" && type !== "iTXt" && text(bytes.subarray(dataStart, dataEnd)).toLowerCase().includes("c2pa")) scanTextForStore(state, bytes, limits, "png-itxt", cursor, end, dataStart, dataEnd, type);
    cursor = end;
    if (type === "IEND") {
      sawIend = true;
      break;
    }
  }
  if (!sawIend) {
    state.scannedComplete = false;
    addDiagnostic(state, limits, { code: "TRUNCATED_DATA", message: "PNG stream has no complete IEND chunk.", offset: cursor, length: bytes.length - cursor });
  } else if (cursor < bytes.length) {
    state.scannedComplete = false;
    addDiagnostic(state, limits, { code: "UNSUPPORTED_STRUCTURE", message: "PNG contains bytes after IEND that were not inventoried.", offset: cursor, length: bytes.length - cursor });
  }
}

function scanWebp(state: MutableInventory, bytes: Uint8Array, limits: SecurityLimits): void {
  if (bytes.length < 12) {
    addDiagnostic(state, limits, { code: "TRUNCATED_DATA", message: "RIFF/WebP header is truncated while inventorying C2PA/JUMBF.", offset: 0, length: bytes.length });
    return;
  }
  let cursor = 12;
  const riffEnd = bytes.length >= 8 ? safeAdd(uint32LittleEndian(bytes, 4), 8) : null;
  if (riffEnd === null || riffEnd > bytes.length) {
    addDiagnostic(state, limits, { code: "TRUNCATED_DATA", message: "RIFF boundary is truncated while inventorying C2PA/JUMBF.", offset: 4, length: 4 });
    return;
  }
  let chunks = 0;
  while (cursor + 8 <= riffEnd) {
    if (chunks >= limits.maxPngChunks) {
      addDiagnostic(state, limits, { code: "LIMIT_EXCEEDED", message: "WebP chunk count exceeds the configured inventory limit.", offset: cursor, length: null });
      return;
    }
    chunks += 1;
    if (!consumeUnit(state, limits, cursor, null)) return;
    const length = uint32LittleEndian(bytes, cursor + 4);
    const dataStart = cursor + 8;
    const dataEnd = safeAdd(dataStart, length);
    const end = dataEnd === null ? null : safeAdd(dataEnd, length & 1);
    if (dataEnd === null || end === null || end > riffEnd) {
      addDiagnostic(state, limits, { code: "TRUNCATED_DATA", message: "WebP chunk extends beyond the RIFF boundary.", offset: cursor, length });
      return;
    }
    const type = String.fromCharCode(...bytes.subarray(cursor, cursor + 4));
    if (type === "C2PA" || type === "JUMF" || type === "JUMBF" || type.startsWith("C2") || type.startsWith("JUM")) scanTextForStore(state, bytes, limits, "webp-chunk", cursor, end, dataStart, dataEnd, type.toLowerCase(), null, true);
    cursor = end;
  }
  if (cursor !== riffEnd) addDiagnostic(state, limits, { code: "TRUNCATED_DATA", message: "WebP chunk header is truncated at the RIFF boundary.", offset: cursor, length: riffEnd - cursor });
}

function uint64Safe(bytes: Uint8Array, offset: number): number | null {
  if (offset + 8 > bytes.length) return null;
  let value = 0n;
  for (let index = 0; index < 8; index += 1) value = (value << 8n) | BigInt(bytes[offset + index] ?? 0);
  return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : null;
}

function scanBmffBoxes(state: MutableInventory, bytes: Uint8Array, limits: SecurityLimits, start: number, end: number, parentId: string | null, depth: number): void {
  if (depth > limits.maxIfdDepth) {
    addDiagnostic(state, limits, { code: "LIMIT_EXCEEDED", message: "ISO-BMFF nesting depth exceeds the configured C2PA inventory limit.", offset: start, length: end - start });
    return;
  }
  let cursor = start;
  while (cursor < end) {
    if (!consumeUnit(state, limits, cursor, null)) return;
    if (cursor + 8 > end) {
      addDiagnostic(state, limits, { code: "TRUNCATED_DATA", message: "ISO-BMFF box header is truncated.", offset: cursor, length: end - cursor });
      return;
    }
    const size32 = uint32(bytes, cursor);
    const type = String.fromCharCode(...bytes.subarray(cursor + 4, cursor + 8));
    let header = 8;
    let size = size32;
    if (size32 === 1) {
      const extended = uint64Safe(bytes, cursor + 8);
      if (extended === null) {
        addDiagnostic(state, limits, { code: "LIMIT_EXCEEDED", message: "ISO-BMFF extended box size is not safely representable.", offset: cursor, length: 16 });
        return;
      }
      size = extended;
      header = 16;
    } else if (size32 === 0) size = end - cursor;
    if (size < header) {
      addDiagnostic(state, limits, { code: "MALFORMED_STRUCTURE", message: "ISO-BMFF box size is smaller than its header.", offset: cursor, length: size });
      return;
    }
    const boxEnd = safeAdd(cursor, size);
    if (boxEnd === null || boxEnd > end) {
      addDiagnostic(state, limits, { code: "TRUNCATED_DATA", message: "ISO-BMFF box extends beyond its containing range.", offset: cursor, length: size });
      return;
    }
    const payloadStart = cursor + header;
    const lower = text(bytes.subarray(payloadStart, boxEnd)).toLowerCase();
    let id: string | null = null;
    const uuidC2pa = type === "uuid" && (startsWithBytes(bytes.subarray(payloadStart, boxEnd), C2PA_MANIFEST_UUID) || startsWithBytes(bytes.subarray(payloadStart, boxEnd), C2PA_ASSERTION_UUID));
    if (type === "jumb" || uuidC2pa || type === "c2pa" || lower.includes("jumbf") || lower.includes("c2pa") || type.startsWith("c2")) {
      if (type.startsWith("c2") && type !== "c2pa") addDiagnostic(state, limits, { code: "UNSUPPORTED_STRUCTURE", message: `The ${type} C2PA-like box is opaque and was not structurally decoded.`, offset: cursor, length: boxEnd - cursor });
      const kind = candidateKind(bytes.subarray(payloadStart, boxEnd), type);
      id = addStore(state, limits, { kind, container: "iso-bmff-box", start: cursor, end: boxEnd, payloadStart, payloadEnd: boxEnd, parentId, boxType: type });
      if (id !== null) {
        const refs = references(bytes.subarray(payloadStart, boxEnd), limits);
        const store = state.stores.at(-1);
        if (store !== undefined) state.stores[state.stores.length - 1] = { ...store, parentId, manifestReferences: refs.manifests, remoteReferences: refs.remote };
        for (const reference of refs.remote) {
          addDiagnostic(state, limits, { code: "REMOTE_REFERENCE", message: "A remote C2PA/JUMBF reference was inventoried but not fetched.", offset: cursor, length: boxEnd - cursor });
          addRelationship(state, limits, { sourceStoreId: id, targetStoreId: null, reference, kind: "remote" });
        }
        for (const reference of refs.manifests) addRelationship(state, limits, { sourceStoreId: id, targetStoreId: null, reference, kind: "unresolved" });
      }
    }
    const containerTypes = new Set(["jumb", "jp2h", "jp2c", "moov", "trak", "meta", "meco", "mere"]);
    if (containerTypes.has(type)) scanBmffBoxes(state, bytes, limits, payloadStart, boxEnd, id ?? parentId, depth + 1);
    cursor = boxEnd;
  }
}

function scanIsoBmff(state: MutableInventory, bytes: Uint8Array, limits: SecurityLimits): void {
  scanBmffBoxes(state, bytes, limits, 0, bytes.length, null, 0);
}

function fingerprint(bytes: Uint8Array): string {
  let hash = 0xcbf29ce484222325n;
  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

function sameRange(bytes: Uint8Array, left: C2paInventoryStore, right: C2paInventoryStore): boolean {
  if (left.payloadLength !== right.payloadLength) return false;
  for (let index = 0; index < left.payloadLength; index += 1) if (bytes[left.payloadOffset + index] !== bytes[right.payloadOffset + index]) return false;
  return true;
}

function duplicateRelationships(state: MutableInventory, limits: SecurityLimits): void {
  const byShape = new Map<string, C2paInventoryStore[]>();
  for (const store of state.stores) {
    const payload = state.bytes.subarray(store.payloadOffset, store.payloadOffset + store.payloadLength);
    const key = `${store.kind}:${store.container}:${store.payloadLength}:${store.boxType ?? ""}:${fingerprint(payload)}`;
    byShape.set(key, [...(byShape.get(key) ?? []), store]);
  }
  for (const stores of byShape.values()) {
    if (stores.length < 2) continue;
    const first = stores[0];
    if (first === undefined) continue;
    for (const store of stores.slice(1)) {
      if (!sameRange(state.bytes, first, store)) continue;
      addRelationship(state, limits, { sourceStoreId: store.id, targetStoreId: first.id, reference: first.id, kind: "duplicate" });
      addDiagnostic(state, limits, { code: "DUPLICATE_STORE", message: "Duplicate C2PA/JUMBF store payload was inventoried.", offset: store.offset, length: store.length });
    }
  }
}

function resolveManifestRelationships(state: MutableInventory, limits: SecurityLimits): void {
  const storesById = new Map(state.stores.map((store) => [store.id, store]));
  for (let index = 0; index < state.relationships.length; index += 1) {
    const relationship = state.relationships[index];
    if (relationship === undefined || relationship.kind !== "unresolved") continue;
    const target = storesById.get(relationship.reference);
    if (target === undefined) continue;
    state.relationships[index] = { ...relationship, targetStoreId: target.id, kind: "manifest" };
  }
  for (const store of state.stores) {
    if (store.parentId === null) continue;
    const parent = storesById.get(store.parentId);
    if (parent === undefined) addDiagnostic(state, limits, { code: "MALFORMED_STRUCTURE", message: "A C2PA/JUMBF store refers to a missing parent store.", offset: store.offset, length: store.length });
  }
}

function overlapRelationships(state: MutableInventory, limits: SecurityLimits): void {
  for (let leftIndex = 0; leftIndex < state.stores.length; leftIndex += 1) {
    const left = state.stores[leftIndex];
    if (left === undefined) continue;
    for (let rightIndex = leftIndex + 1; rightIndex < state.stores.length; rightIndex += 1) {
      const right = state.stores[rightIndex];
      if (right === undefined || left.offset >= right.offset + right.length || right.offset >= left.offset + left.length) continue;
      const leftContainsRight = left.offset <= right.offset && right.offset + right.length <= left.offset + left.length && right.parentId === left.id;
      const rightContainsLeft = right.offset <= left.offset && left.offset + left.length <= right.offset + right.length && left.parentId === right.id;
      if (!leftContainsRight && !rightContainsLeft) addDiagnostic(state, limits, { code: "MALFORMED_STRUCTURE", message: "C2PA/JUMBF stores have overlapping ranges without a declared containment relationship.", offset: Math.max(left.offset, right.offset), length: Math.min(left.offset + left.length, right.offset + right.length) - Math.max(left.offset, right.offset) });
    }
  }
}

export function inventoryJumbfC2pa(bytes: Uint8Array, options: C2paInventoryOptions = {}): C2paInventoryResult {
  const limits = resolveLimits(options.limits);
  const format = detectFormat(bytes).format;
  const state: MutableInventory = { bytes, format, stores: [], relationships: [], diagnostics: [], limited: false, malformed: false, unsupported: false, scannedComplete: true, scannedUnits: 0 };
  if (format === "jpeg") scanJpeg(state, bytes, limits);
  else if (format === "png") scanPng(state, bytes, limits);
  else if (format === "webp") scanWebp(state, bytes, limits);
  else if (format === "heif" || format === "avif") scanIsoBmff(state, bytes, limits);
  else if (format !== "unknown") state.scannedComplete = false;
  else state.scannedComplete = false;
  resolveManifestRelationships(state, limits);
  duplicateRelationships(state, limits);
  overlapRelationships(state, limits);
  const detected = state.stores.length > 0;
  const status: C2paInventoryStatus = detected ? state.malformed ? "malformed" : state.limited ? "limited" : state.unsupported ? "unsupported" : "detected" : state.malformed ? "malformed" : state.limited ? "limited" : state.unsupported || format === "unknown" ? "unsupported" : "not-present";
  return {
    format,
    status,
    detected,
    stores: state.stores,
    relationships: state.relationships,
    diagnostics: state.diagnostics,
    mutationRisk: detected ? state.malformed ? "unknown" : "high" : "none",
    complete: state.scannedComplete && !state.malformed && !state.limited && !state.unsupported,
    remoteReferencesFetched: false,
  };
}

export async function inventoryC2pa(input: MetadataInput, options: C2paInventoryOptions = {}): Promise<C2paInventoryResult> {
  const limits = resolveLimits(options.limits);
  const bytes = await materializeInput(input, limits);
  return inventoryJumbfC2pa(bytes, options);
}

/** Fast, conservative mutation guard. It recognizes C2PA/JUMBF candidates but
 * performs no cryptographic or certificate operation. */
export function hasC2paInventoryCandidate(bytes: Uint8Array, limitsInput?: SecurityLimits): boolean {
  const limits = limitsInput ?? resolveLimits();
  if (bytes.length > limits.maxInputBytes) return true;
  const value = text(bytes).toLowerCase();
  if (value.includes("c2pa") || value.includes("jumbf")) return true;
  const format = detectFormat(bytes).format;
  if (format === "jpeg") {
    let units = 0;
    for (let index = 0; index + 1 < bytes.length; index += 1) {
      if (bytes[index] === 0xff && bytes[index + 1] === 0xeb) return true;
      if (bytes[index] !== 0xff) continue;
      units += 1;
      if (units >= limits.maxSegments && index + 1 < bytes.length) return true;
    }
  }
  if (format === "webp") {
    let cursor = 12;
    let chunks = 0;
    while (cursor + 8 <= bytes.length) {
      if (chunks >= limits.maxPngChunks) return true;
      chunks += 1;
      const length = uint32LittleEndian(bytes, cursor + 4);
      if (ascii(bytes, cursor, "C2PA") || ascii(bytes, cursor, "JUMF") || ascii(bytes, cursor, "JUMBF")) return true;
      const next = safeAdd(cursor + 8, length + (length & 1));
      if (next === null || next <= cursor || next > bytes.length) break;
      cursor = next;
    }
    if (chunks >= limits.maxPngChunks && cursor + 8 <= bytes.length) return true;
  }
  if (format === "png") {
    let cursor = 8;
    let chunks = 0;
    while (cursor + 12 <= bytes.length) {
      if (chunks >= limits.maxPngChunks) return true;
      chunks += 1;
      if (ascii(bytes, cursor + 4, "caBX")) return true;
      const dataEnd = safeAdd(cursor + 8, uint32(bytes, cursor));
      const end = dataEnd === null ? null : safeAdd(dataEnd, 4);
      if (end === null || end > bytes.length) break;
      cursor = end;
    }
    if (chunks >= limits.maxPngChunks && cursor + 12 <= bytes.length) return true;
  }
  return false;
}

export type C2paMutationPolicy = "refuse" | "preserve" | "invalidate";

export function c2paMutationFailure(bytes: Uint8Array, policy: C2paMutationPolicy | undefined, limits?: SecurityLimits): string | null {
  if (!hasC2paInventoryCandidate(bytes, limits)) return null;
  if (policy === "preserve") return null;
  if (policy === "invalidate") return "C2PA/JUMBF invalidation is unavailable in this release; mutation was refused atomically.";
  return "C2PA/JUMBF data was detected or may be present; choose the explicit preserve policy before mutation.";
}
