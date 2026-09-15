import type {
  PhotoshopContainerData,
  PhotoshopResource,
  PhotoshopResourceDecoded,
  PhotoshopResourceDiagnostic,
  PhotoshopResourceKind,
  PhotoshopResourceStatus,
  SecurityLimits,
} from "../types.js";

/** Adobe Photoshop File Formats Specification image-resource signatures. */
export const PHOTOSHOP_IDENTIFIER = new Uint8Array([0x50, 0x68, 0x6f, 0x74, 0x6f, 0x73, 0x68, 0x6f, 0x70, 0x20, 0x33, 0x2e, 0x30, 0x00]);
export const PHOTOSHOP_RESOURCE_SIGNATURE = new Uint8Array([0x38, 0x42, 0x49, 0x4d]);

export const PHOTOSHOP_RESOURCE_IDS = Object.freeze({
  resolution: 0x03ed,
  iptc: 0x0404,
  thumbnailBgr: 0x0409,
  thumbnailRgb: 0x040c,
  xmp: 0x0424,
  captionDigest: 0x0425,
  pathFirst: 0x07d0,
  pathLast: 0x0bb5,
  clippingPathName: 0x0bb7,
});

export interface PhotoshopResourceSpan {
  readonly index: number;
  readonly resourceId: number;
  readonly start: number;
  readonly end: number;
  readonly payloadStart: number;
  readonly payloadEnd: number;
}

export interface PhotoshopResourceSpans {
  readonly identifier: boolean;
  readonly resourceStart: number;
  readonly spans: readonly PhotoshopResourceSpan[];
  readonly complete: boolean;
  readonly diagnostics: readonly PhotoshopResourceDiagnostic[];
}

export interface PhotoshopParseOptions {
  readonly container: "app13" | "tiff";
  readonly blockId: string;
  readonly sourceOffset: number;
  readonly sourceLength: number;
}

function hasPrefix(bytes: Uint8Array, prefix: Uint8Array, offset = 0): boolean {
  return offset >= 0 && offset <= bytes.length - prefix.length && prefix.every((value, index) => bytes[offset + index] === value);
}

function be16(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] ?? 0) << 8) | (bytes[offset + 1] ?? 0);
}

function be32(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) * 0x1000000 + ((bytes[offset + 1] ?? 0) << 16) + ((bytes[offset + 2] ?? 0) << 8) + (bytes[offset + 3] ?? 0);
}

function safeAdd(left: number, right: number): number | null {
  const result = left + right;
  return Number.isSafeInteger(result) && result >= left ? result : null;
}

function copy(bytes: Uint8Array): Uint8Array {
  return bytes.slice();
}

function diagnostic(
  code: PhotoshopResourceDiagnostic["code"],
  message: string,
  offset: number,
  length?: number,
  resourceId?: number,
): PhotoshopResourceDiagnostic {
  return { code, message, offset, ...(length === undefined ? {} : { length }), ...(resourceId === undefined ? {} : { resourceId }) };
}

function unitResolution(value: number): "pixels-per-inch" | "pixels-per-centimeter" | "unknown" {
  return value === 1 ? "pixels-per-inch" : value === 2 ? "pixels-per-centimeter" : "unknown";
}

function unitDimension(value: number): "inches" | "centimeters" | "points" | "picas" | "columns" | "unknown" {
  return value === 1 ? "inches" : value === 2 ? "centimeters" : value === 3 ? "points" : value === 4 ? "picas" : value === 5 ? "columns" : "unknown";
}

function decodeResolution(payload: Uint8Array): PhotoshopResourceDecoded | null {
  if (payload.length < 16) return null;
  const horizontal = be32(payload, 0) / 65536;
  const vertical = be32(payload, 8) / 65536;
  if (!Number.isFinite(horizontal) || !Number.isFinite(vertical) || horizontal <= 0 || vertical <= 0) return null;
  return {
    kind: "resolution",
    horizontalResolution: horizontal,
    verticalResolution: vertical,
    horizontalUnit: unitResolution(be16(payload, 4)),
    verticalUnit: unitResolution(be16(payload, 12)),
    widthUnit: unitDimension(be16(payload, 6)),
    heightUnit: unitDimension(be16(payload, 14)),
  };
}

function decodeThumbnail(payload: Uint8Array, resourceId: number, sourcePayloadOffset: number): PhotoshopResourceDecoded | null {
  if (payload.length < 28) return null;
  const format = be32(payload, 0);
  const width = be32(payload, 4);
  const height = be32(payload, 8);
  const widthBytes = be32(payload, 12);
  const totalBytes = be32(payload, 16);
  const compressedBytes = be32(payload, 20);
  const bitsPerPixel = be16(payload, 24);
  const planes = be16(payload, 26);
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || width > 0x7fffffff || height > 0x7fffffff || planes < 1 || planes > 4 || bitsPerPixel < 1 || bitsPerPixel > 64) return null;
  const imageDataLength = payload.length - 28;
  if (compressedBytes > imageDataLength || (format === 1 && compressedBytes === 0)) return null;
  if (format !== 0 && format !== 1) return null;
  const expected = safeAdd(0, width * height);
  if (expected === null || expected > 0x7fffffff) return null;
  return {
    kind: "thumbnail",
    format: format === 0 ? "raw-rgb" : "jpeg-rgb",
    channelOrder: resourceId === PHOTOSHOP_RESOURCE_IDS.thumbnailBgr ? "bgr" : resourceId === PHOTOSHOP_RESOURCE_IDS.thumbnailRgb ? "rgb" : "unknown",
    width,
    height,
    widthBytes,
    totalBytes,
    compressedBytes,
    bitsPerPixel,
    planes,
    imageDataOffset: sourcePayloadOffset + 28,
    imageDataLength,
  };
}

function decodeUtf8(payload: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(payload);
  } catch {
    return null;
  }
}

function bytesToHex(payload: Uint8Array): string {
  return [...payload].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function decodeClippingPathName(payload: Uint8Array): PhotoshopResourceDecoded | null {
  if (payload.length < 1) return null;
  const length = payload[0] ?? 0;
  if (length > payload.length - 1) return null;
  return { kind: "clipping-path-name", name: new TextDecoder("latin1").decode(payload.subarray(1, 1 + length)) };
}

function decodePath(payload: Uint8Array, limits: SecurityLimits): PhotoshopResourceDecoded | null {
  if (payload.length === 0 || payload.length % 26 !== 0) return null;
  if (payload.length / 26 > limits.maxAdapterItems) return null;
  const selectors: number[] = [];
  for (let offset = 0; offset < payload.length; offset += 26) selectors.push(be16(payload, offset));
  return { kind: "path", recordCount: payload.length / 26, selectors };
}

function decodeResource(
  resourceId: number,
  payload: Uint8Array,
  sourcePayloadOffset: number,
  limits: SecurityLimits,
): { readonly kind: PhotoshopResourceKind; readonly status: PhotoshopResourceStatus; readonly decoded: PhotoshopResourceDecoded | null; readonly diagnostic?: PhotoshopResourceDiagnostic } {
  if (resourceId === PHOTOSHOP_RESOURCE_IDS.resolution) {
    const value = decodeResolution(payload);
    return value === null
      ? { kind: "resolution", status: "malformed", decoded: null, diagnostic: diagnostic("INVALID_VALUE", "ResolutionInfo resource is shorter than its fixed structure or contains an invalid fixed-point resolution.", sourcePayloadOffset, payload.length, resourceId) }
      : { kind: "resolution", status: "decoded", decoded: value };
  }
  if (resourceId === PHOTOSHOP_RESOURCE_IDS.thumbnailBgr || resourceId === PHOTOSHOP_RESOURCE_IDS.thumbnailRgb) {
    const value = decodeThumbnail(payload, resourceId, sourcePayloadOffset);
    return value === null
      ? { kind: "thumbnail", status: "malformed", decoded: null, diagnostic: diagnostic("INVALID_VALUE", "Photoshop thumbnail resource has an invalid fixed header or image-data length.", sourcePayloadOffset, payload.length, resourceId) }
      : { kind: "thumbnail", status: "decoded", decoded: value };
  }
  if (resourceId === PHOTOSHOP_RESOURCE_IDS.iptc) {
    return { kind: "iptc", status: "decoded", decoded: { kind: "iptc", byteLength: payload.length } };
  }
  if (resourceId === PHOTOSHOP_RESOURCE_IDS.xmp) {
    if (payload.length > limits.maxStringBytes) return { kind: "xmp", status: "limited", decoded: null, diagnostic: diagnostic("LIMIT_EXCEEDED", "Photoshop XMP resource exceeds the configured string limit.", sourcePayloadOffset, payload.length, resourceId) };
    const packet = decodeUtf8(payload);
    return packet === null
      ? { kind: "xmp", status: "malformed", decoded: null, diagnostic: diagnostic("INVALID_VALUE", "Photoshop XMP resource is not valid UTF-8.", sourcePayloadOffset, payload.length, resourceId) }
      : { kind: "xmp", status: "decoded", decoded: { kind: "xmp", packet } };
  }
  if (resourceId === PHOTOSHOP_RESOURCE_IDS.captionDigest) {
    return payload.length === 16
      ? { kind: "caption-digest", status: "decoded", decoded: { kind: "caption-digest", algorithm: "MD5", hex: bytesToHex(payload) } }
      : { kind: "caption-digest", status: "malformed", decoded: null, diagnostic: diagnostic("INVALID_VALUE", "Photoshop caption digest resource must contain exactly 16 bytes.", sourcePayloadOffset, payload.length, resourceId) };
  }
  if (resourceId >= PHOTOSHOP_RESOURCE_IDS.pathFirst && resourceId <= PHOTOSHOP_RESOURCE_IDS.pathLast) {
    if (payload.length > limits.maxValueBytes || payload.length / 26 > limits.maxAdapterItems) return { kind: "path", status: "limited", decoded: null, diagnostic: diagnostic("LIMIT_EXCEEDED", "Photoshop path resource exceeds the configured path-record retention limit.", sourcePayloadOffset, payload.length, resourceId) };
    const value = decodePath(payload, limits);
    return value === null
      ? { kind: "path", status: "malformed", decoded: null, diagnostic: diagnostic("INVALID_VALUE", "Photoshop path resource length is not an integral number of 26-byte records.", sourcePayloadOffset, payload.length, resourceId) }
      : { kind: "path", status: "decoded", decoded: value };
  }
  if (resourceId === PHOTOSHOP_RESOURCE_IDS.clippingPathName) {
    const value = decodeClippingPathName(payload);
    return value === null
      ? { kind: "clipping-path-name", status: "malformed", decoded: null, diagnostic: diagnostic("INVALID_VALUE", "Photoshop clipping-path name is not a bounded Pascal string.", sourcePayloadOffset, payload.length, resourceId) }
      : { kind: "clipping-path-name", status: "decoded", decoded: value };
  }
  return { kind: "unknown", status: "unknown", decoded: null };
}

/** Parse the bounded resource spans without decoding payload semantics. This is
 * also used by the JPEG writer for exact resource selection. */
export function inspectPhotoshopResourceSpans(bytes: Uint8Array, container: "app13" | "tiff", limits: SecurityLimits): PhotoshopResourceSpans | null {
  const identifier = container === "app13";
  if (identifier && !hasPrefix(bytes, PHOTOSHOP_IDENTIFIER)) return null;
  if (!identifier && (bytes.length < 4 || !hasPrefix(bytes, PHOTOSHOP_RESOURCE_SIGNATURE))) return null;
  const resourceStart = identifier ? PHOTOSHOP_IDENTIFIER.length : 0;
  const spans: PhotoshopResourceSpan[] = [];
  const diagnostics: PhotoshopResourceDiagnostic[] = [];
  let cursor = resourceStart;
  let complete = true;
  while (cursor < bytes.length) {
    if (spans.length >= limits.maxSegments) {
      diagnostics.push(diagnostic("LIMIT_EXCEEDED", `Photoshop resource count exceeds the configured limit of ${limits.maxSegments}.`, cursor));
      complete = false;
      break;
    }
    const remaining = bytes.length - cursor;
    if (remaining < 8 || !hasPrefix(bytes, PHOTOSHOP_RESOURCE_SIGNATURE, cursor)) {
      diagnostics.push(diagnostic(remaining < 8 ? "TRUNCATED_DATA" : "MALFORMED_PHOTOSHOP", "Photoshop image-resource header or signature is malformed or truncated.", cursor, remaining));
      complete = false;
      break;
    }
    const resourceId = be16(bytes, cursor + 4);
    const nameLength = bytes[cursor + 6] ?? 0;
    const nameFieldLength = safeAdd(1, nameLength);
    const paddedNameLength = nameFieldLength === null ? null : (nameFieldLength + 1) & ~1;
    const sizeOffset = paddedNameLength === null ? null : safeAdd(cursor, 6 + paddedNameLength);
    if (sizeOffset === null || sizeOffset > bytes.length - 4) {
      diagnostics.push(diagnostic("TRUNCATED_DATA", "Photoshop resource Pascal-name field or length field is truncated.", cursor, bytes.length - cursor, resourceId));
      complete = false;
      break;
    }
    const size = be32(bytes, sizeOffset);
    const payloadStart = safeAdd(sizeOffset, 4);
    const payloadEnd = payloadStart === null ? null : safeAdd(payloadStart, size);
    const end = payloadEnd === null ? null : safeAdd(payloadEnd, size & 1);
    if (payloadStart === null || payloadEnd === null || end === null || payloadEnd > bytes.length || end > bytes.length) {
      diagnostics.push(diagnostic("TRUNCATED_DATA", "Photoshop resource payload or even-byte padding extends beyond the container.", cursor, bytes.length - cursor, resourceId));
      complete = false;
      break;
    }
    const namePaddingStart = cursor + 7 + nameLength;
    const namePaddingEnd = cursor + 6 + ((1 + nameLength + 1) & ~1);
    if (bytes.subarray(namePaddingStart, namePaddingEnd).some((value) => value !== 0)) {
      diagnostics.push(diagnostic("MALFORMED_PHOTOSHOP", "Photoshop Pascal-name padding must contain zero bytes.", namePaddingStart, namePaddingEnd - namePaddingStart, resourceId));
      complete = false;
    }
    if (bytes.subarray(payloadEnd, end).some((value) => value !== 0)) {
      diagnostics.push(diagnostic("MALFORMED_PHOTOSHOP", "Photoshop payload padding must contain zero bytes.", payloadEnd, end - payloadEnd, resourceId));
      complete = false;
    }
    spans.push({ index: spans.length, resourceId, start: cursor, end, payloadStart, payloadEnd });
    cursor = end;
  }
  return { identifier, resourceStart, spans, complete, diagnostics };
}

/** Inventory Photoshop image resources in an APP13 block or TIFF tag 34377. */
export function parsePhotoshopResources(bytes: Uint8Array, limits: SecurityLimits, options: PhotoshopParseOptions): PhotoshopContainerData | null {
  const spans = inspectPhotoshopResourceSpans(bytes, options.container, limits);
  if (spans === null) return null;
  const diagnostics: PhotoshopResourceDiagnostic[] = [...spans.diagnostics];
  const resources: PhotoshopResource[] = [];
  let retainedBytes = 0;
  for (const span of spans.spans) {
    const nameLength = bytes[span.start + 6] ?? 0;
    const nameStart = span.start + 7;
    const paddedNameLength = ((1 + nameLength + 1) & ~1);
    const nameEnd = span.start + 6 + paddedNameLength;
    const nameBytes = copy(bytes.subarray(nameStart, nameStart + nameLength));
    const namePadding = copy(bytes.subarray(nameStart + nameLength, nameEnd));
    const payload = bytes.subarray(span.payloadStart, span.payloadEnd);
    const payloadPadding = copy(bytes.subarray(span.payloadEnd, span.end));
    const sourceOffset = options.sourceOffset + span.start;
    const payloadOffset = options.sourceOffset + span.payloadStart;
    const resourceId = `${options.blockId}:resource:${span.index}`;
    let status: PhotoshopResourceStatus = "decoded";
    let kind: PhotoshopResourceKind = "unknown";
    let decoded: PhotoshopResourceDecoded | null = null;
    if (namePadding.some((value) => value !== 0)) {
      status = "malformed";
    }
    if (payloadPadding.some((value) => value !== 0)) {
      status = "malformed";
    }
    const decodedValue = decodeResource(span.resourceId, payload, payloadOffset, limits);
    kind = decodedValue.kind;
    decoded = decodedValue.decoded;
    if (decodedValue.diagnostic !== undefined) {
      diagnostics.push(decodedValue.diagnostic);
      status = decodedValue.status;
    } else if (status === "decoded") {
      status = decodedValue.status;
    }
    const canRetain = payload.length <= limits.maxValueBytes && retainedBytes <= limits.maxMetadataBytes - payload.length;
    const rawPayload = canRetain ? copy(payload) : null;
    if (!canRetain) {
      status = status === "malformed" ? status : "limited";
      diagnostics.push(diagnostic("LIMIT_EXCEEDED", "Photoshop resource payload was not copied because the configured retention budget was exceeded.", payloadOffset, payload.length, span.resourceId));
    } else {
      retainedBytes += payload.length;
    }
    resources.push({
      id: resourceId,
      signature: "8BIM",
      resourceId: span.resourceId,
      nameBytes,
      name: new TextDecoder("latin1").decode(nameBytes),
      namePadding,
      offset: sourceOffset,
      length: span.end - span.start,
      payloadOffset,
      payloadLength: payload.length,
      payloadPadding,
      parentBlockId: options.blockId,
      status,
      kind,
      decoded,
      rawPayload,
    });
  }
  return {
    identifier: options.container === "app13" ? "Photoshop 3.0" : null,
    source: { blockId: options.blockId, offset: options.sourceOffset, length: options.sourceLength },
    resources,
    complete: spans.complete && !diagnostics.some(({ code }) => new Set(["MALFORMED_PHOTOSHOP", "TRUNCATED_DATA", "UNSAFE_OFFSET", "INVALID_VALUE", "LIMIT_EXCEEDED"]).has(code)),
    diagnostics,
  };
}
