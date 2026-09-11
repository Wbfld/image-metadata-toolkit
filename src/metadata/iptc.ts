import type { IptcData, MetadataField, MetadataWarning, SecurityLimits } from "../types.js";

const PHOTOSHOP_IDENTIFIER = Uint8Array.from("Photoshop 3.0\u0000", (character) => character.charCodeAt(0));
const RESOURCE_SIGNATURE = [0x38, 0x42, 0x49, 0x4d] as const;
const IPTC_RESOURCE_ID = 0x0404;

export interface IptcInspection {
  readonly data: IptcData | null;
  readonly malformed: boolean;
}

export interface ParsedIptc {
  readonly data: IptcData | null;
  readonly fields: readonly MetadataField[];
  readonly warnings: readonly MetadataWarning[];
  readonly malformed: boolean;
}

const DATASET_NAMES: Readonly<Record<number, string>> = {
  0x0205: "ObjectName",
  0x0207: "EditStatus",
  0x020a: "Urgency",
  0x015a: "CodedCharacterSet",
  0x020f: "Category",
  0x0219: "Keywords",
  0x0237: "DateCreated",
  0x023c: "TimeCreated",
  0x0250: "Byline",
  0x0255: "BylineTitle",
  0x025a: "City",
  0x025f: "ProvinceState",
  0x0264: "CountryCode",
  0x0265: "CountryName",
  0x0269: "Headline",
  0x026e: "Credit",
  0x0273: "Source",
  0x0274: "CopyrightNotice",
  0x0278: "Caption",
  0x027a: "Writer",
  0x0282: "ImageType",
};

const DATASET_DESCRIPTIONS: Readonly<Record<string, string>> = {
  ObjectName: "Short title or identifier for the image.",
  Keywords: "Search keywords assigned to the image.",
  DateCreated: "Editorial date on which the image was created.",
  TimeCreated: "Editorial time at which the image was created.",
  Byline: "Name of the creator of the image.",
  City: "City of the image subject or dateline.",
  CountryCode: "Three-letter country code.",
  Headline: "Displayed headline for the image.",
  CopyrightNotice: "Copyright notice associated with the image.",
  Caption: "Description or caption of the image.",
};

function readUint16(payload: Uint8Array, offset: number): number {
  return ((payload[offset] ?? 0) << 8) | (payload[offset + 1] ?? 0);
}

function decodeLatin1(payload: Uint8Array): string {
  const chunks: string[] = [];
  for (let offset = 0; offset < payload.length; offset += 8192) {
    chunks.push(String.fromCharCode(...payload.subarray(offset, Math.min(offset + 8192, payload.length))));
  }
  return chunks.join("");
}

function decodeUtf8(payload: Uint8Array): string | null {
  try { return new TextDecoder("utf-8", { fatal: true }).decode(payload); } catch { return null; }
}

function hex(payload: Uint8Array): string {
  return [...payload].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isUtf8Charset(payload: Uint8Array): boolean {
  return payload.length === 3 && payload[0] === 0x1b && payload[1] === 0x25 && payload[2] === 0x47;
}

interface DatasetValue {
  readonly record: number;
  readonly dataset: number;
  readonly key: number;
  readonly raw: Uint8Array;
  readonly offset: number;
}

function resourcePayloads(payload: Uint8Array): { payloads: Uint8Array[]; malformed: boolean } {
  if (payload[0] === 0x1c) return { payloads: [payload], malformed: false };
  if (payload.length < PHOTOSHOP_IDENTIFIER.length) return { payloads: [], malformed: false };
  for (let index = 0; index < PHOTOSHOP_IDENTIFIER.length; index += 1) {
    if (payload[index] !== PHOTOSHOP_IDENTIFIER[index]) return { payloads: [], malformed: false };
  }
  const payloads: Uint8Array[] = [];
  let cursor = PHOTOSHOP_IDENTIFIER.length;
  while (cursor < payload.length) {
    if (cursor > payload.length - 12 || !RESOURCE_SIGNATURE.every((byte, index) => payload[cursor + index] === byte)) return { payloads: [], malformed: true };
    const resourceId = readUint16(payload, cursor + 4);
    const nameLength = payload[cursor + 6] ?? 0;
    const paddedNameSize = (1 + nameLength + 1) & ~1;
    const sizeOffset = cursor + 6 + paddedNameSize;
    if (sizeOffset > payload.length - 4) return { payloads: [], malformed: true };
    const resourceLength = readUint32(payload, sizeOffset);
    const resourceStart = sizeOffset + 4;
    const resourceEnd = resourceStart + resourceLength;
    const next = resourceEnd + (resourceLength & 1);
    if (!Number.isSafeInteger(resourceEnd) || !Number.isSafeInteger(next) || next > payload.length) return { payloads: [], malformed: true };
    if (resourceId === IPTC_RESOURCE_ID) payloads.push(payload.subarray(resourceStart, resourceEnd));
    cursor = next;
  }
  return { payloads, malformed: false };
}

function readUint32(payload: Uint8Array, offset: number): number {
  return (
    (payload[offset] ?? 0) * 0x1000000 +
    ((payload[offset + 1] ?? 0) << 16) +
    ((payload[offset + 2] ?? 0) << 8) +
    (payload[offset + 3] ?? 0)
  );
}

/** Inspect Photoshop APP13 resources without interpreting IPTC character encoding. */
export function inspectIptc(payload: Uint8Array): IptcInspection {
  if (payload.length < PHOTOSHOP_IDENTIFIER.length) return { data: null, malformed: false };
  for (let index = 0; index < PHOTOSHOP_IDENTIFIER.length; index += 1) {
    if (payload[index] !== PHOTOSHOP_IDENTIFIER[index]) return { data: null, malformed: false };
  }

  let cursor = PHOTOSHOP_IDENTIFIER.length;
  let iptcBytes = 0;
  while (cursor < payload.length) {
    if (cursor + 12 > payload.length) return { data: null, malformed: true };
    if (!RESOURCE_SIGNATURE.every((byte, index) => payload[cursor + index] === byte)) {
      return { data: null, malformed: true };
    }
    const resourceId = ((payload[cursor + 4] ?? 0) << 8) | (payload[cursor + 5] ?? 0);
    const nameLength = payload[cursor + 6] ?? 0;
    const paddedNameSize = (1 + nameLength + 1) & ~1;
    const sizeOffset = cursor + 6 + paddedNameSize;
    if (sizeOffset + 4 > payload.length) return { data: null, malformed: true };
    const resourceLength = readUint32(payload, sizeOffset);
    const resourceStart = sizeOffset + 4;
    const resourceEnd = resourceStart + resourceLength;
    if (!Number.isSafeInteger(resourceEnd) || resourceEnd > payload.length) {
      return { data: null, malformed: true };
    }
    if (resourceId === IPTC_RESOURCE_ID) iptcBytes += resourceLength;
    cursor = resourceEnd + (resourceLength & 1);
    // Photoshop image resources with an odd data size have one mandatory pad
    // byte. Do not identify a truncated resource block as safely removable IPTC.
    if (cursor > payload.length) return { data: null, malformed: true };
  }

  return { data: iptcBytes > 0 ? { byteLength: iptcBytes } : null, malformed: false };
}

/** Reports the bounded size of IPTC-IIM resources without interpreting their character encoding. */
export function parseIptc(payload: Uint8Array): IptcData | null {
  return inspectIptc(payload).data;
}

/** Parse bounded IPTC-IIM datasets from Photoshop resource blocks. */
export function parseIptcMetadata(payload: Uint8Array, limits: SecurityLimits, warningBaseOffset = 0): ParsedIptc {
  const warnings: MetadataWarning[] = [];
  const fields: MetadataField[] = [];
  const inspected = resourcePayloads(payload);
  if (inspected.payloads.length === 0) {
    if (inspected.malformed) {
      warnings.push({ code: "MALFORMED_IPTC", message: "Photoshop APP13 image-resource data is malformed or truncated.", severity: "warning", offset: warningBaseOffset });
    }
    return { data: null, fields, warnings, malformed: inspected.malformed };
  }

  let byteLength = 0;
  let consumed = 0;
  const datasets: DatasetValue[] = [];
  for (const resource of inspected.payloads) {
    byteLength += resource.length;
    if (byteLength > limits.maxMetadataBytes || resource.length > limits.maxSegmentBytes) {
      if (warnings.length < limits.maxWarnings) warnings.push({ code: "LIMIT_EXCEEDED", message: "IPTC resource exceeds the configured metadata limit and was not decoded.", severity: "warning" });
      continue;
    }
    let cursor = 0;
    while (cursor < resource.length) {
      if (resource[cursor] !== 0x1c) {
        // Preserve opaque resource bytes for compatibility. Some producers use
        // private payloads in the IPTC resource block that are not IIM datasets.
        if (cursor > 0 && warnings.length < limits.maxWarnings) warnings.push({ code: "MALFORMED_IPTC", message: "IPTC resource contains bytes outside an IIM dataset.", severity: "warning", offset: warningBaseOffset + consumed + cursor });
        break;
      }
      if (cursor > resource.length - 5) {
        if (warnings.length < limits.maxWarnings) warnings.push({ code: "TRUNCATED_DATA", message: "IPTC dataset header is truncated.", severity: "error", offset: warningBaseOffset + consumed + cursor });
        break;
      }
      const record = resource[cursor + 1] ?? 0;
      const dataset = resource[cursor + 2] ?? 0;
      const declared = readUint16(resource, cursor + 3);
      let headerLength = 5;
      let valueLength = declared;
      if ((declared & 0x8000) !== 0) {
        const countBytes = declared & 0x7fff;
        if (countBytes < 1 || countBytes > 4 || cursor > resource.length - 5 - countBytes) {
          if (warnings.length < limits.maxWarnings) warnings.push({ code: "MALFORMED_IPTC", message: "IPTC extended dataset length is invalid.", severity: "error", offset: warningBaseOffset + consumed + cursor + 3 });
          break;
        }
        valueLength = 0;
        for (let index = 0; index < countBytes; index += 1) valueLength = valueLength * 256 + (resource[cursor + 5 + index] ?? 0);
        headerLength += countBytes;
      }
      const valueStart = cursor + headerLength;
      const valueEnd = valueStart + valueLength;
      if (!Number.isSafeInteger(valueEnd) || valueEnd > resource.length) {
        if (warnings.length < limits.maxWarnings) warnings.push({ code: "TRUNCATED_DATA", message: "IPTC dataset extends beyond its resource.", severity: "error", offset: warningBaseOffset + consumed + cursor, length: valueLength });
        break;
      }
      if (fields.length >= limits.maxIfdEntries) {
        if (warnings.length < limits.maxWarnings) warnings.push({ code: "LIMIT_EXCEEDED", message: "IPTC dataset count exceeds the configured entry limit.", severity: "warning" });
        break;
      }
      const key = (record << 8) | dataset;
      datasets.push({ record, dataset, key, raw: resource.subarray(valueStart, valueEnd).slice(), offset: warningBaseOffset + consumed + valueStart });
      cursor = valueEnd;
    }
    consumed += resource.length;
  }
  let characterSet: "latin1" | "utf-8" | "unknown" = "latin1";
  const charsetDataset = datasets.find(({ key }) => key === 0x015a);
  if (charsetDataset !== undefined) {
    if (isUtf8Charset(charsetDataset.raw)) characterSet = "utf-8";
    else {
      characterSet = "unknown";
      if (warnings.length < limits.maxWarnings) warnings.push({ code: "INVALID_VALUE", message: "IPTC coded character set is unsupported; text values remain raw bytes.", severity: "warning", offset: charsetDataset.offset, length: charsetDataset.raw.length });
    }
  }

  for (const dataset of datasets) {
    const name = DATASET_NAMES[dataset.key] ?? `Dataset ${dataset.record}:${dataset.dataset}`;
    const decoded = dataset.key === 0x015a
      ? (characterSet === "utf-8" ? "UTF-8" : hex(dataset.raw))
      : characterSet === "utf-8" ? decodeUtf8(dataset.raw) : characterSet === "latin1" ? decodeLatin1(dataset.raw) : null;
    let value: MetadataField["value"] = decoded ?? dataset.raw;
    let type: MetadataField["type"] = decoded === null ? "UNDEFINED" : "ASCII";
    if (dataset.raw.length > limits.maxStringBytes && decoded !== null) {
      value = dataset.raw;
      type = "UNDEFINED";
      if (warnings.length < limits.maxWarnings) warnings.push({ code: "LIMIT_EXCEEDED", message: "IPTC text value exceeds the configured string limit and was not decoded.", severity: "warning", offset: dataset.offset, length: dataset.raw.length });
    } else if (decoded === null && dataset.key !== 0x015a && warnings.length < limits.maxWarnings) {
      warnings.push({ code: "INVALID_VALUE", message: "IPTC text value is not valid UTF-8 for its declared character set; raw bytes were preserved.", severity: "warning", offset: dataset.offset, length: dataset.raw.length });
    }
    if (dataset.key === 0x020a && typeof decoded === "string") {
      type = "BYTE";
      const urgency = Number(decoded);
      value = Number.isInteger(urgency) && urgency >= 1 && urgency <= 8 ? urgency : decoded;
      if (typeof value === "string" && warnings.length < limits.maxWarnings) warnings.push({ code: "INVALID_VALUE", message: "IPTC Urgency must be an integer from 1 through 8.", severity: "warning", offset: dataset.offset });
    }
    if (dataset.key === 0x0237 && typeof decoded === "string" && !/^\d{8}$/.test(decoded) && warnings.length < limits.maxWarnings) warnings.push({ code: "INVALID_DATE", message: "IPTC DateCreated must use YYYYMMDD digits.", severity: "warning", offset: dataset.offset, length: dataset.raw.length });
    if (dataset.key === 0x023c && typeof decoded === "string" && !/^\d{6}(?:[+-]\d{4})?$/.test(decoded) && warnings.length < limits.maxWarnings) warnings.push({ code: "INVALID_VALUE", message: "IPTC TimeCreated must use HHMMSS with an optional numeric offset.", severity: "warning", offset: dataset.offset, length: dataset.raw.length });
    if (dataset.key === 0x0264 && typeof decoded === "string" && !/^[A-Za-z]{3}$/.test(decoded) && warnings.length < limits.maxWarnings) warnings.push({ code: "INVALID_VALUE", message: "IPTC CountryCode must contain three ASCII letters.", severity: "warning", offset: dataset.offset, length: dataset.raw.length });
    const display = typeof value === "number" ? `Urgency ${value}` : typeof value === "string" ? value : `0x${hex(dataset.raw)}`;
    fields.push({ id: `IPTC:${dataset.record}:${dataset.dataset}`, ifd: "IPTC", tag: dataset.key, name, raw: dataset.raw, value, display, description: DATASET_DESCRIPTIONS[name] ?? `IPTC-IIM record ${dataset.record}, dataset ${dataset.dataset}.`, type, sensitivity: dataset.key === 0x0274 ? "moderate" : "low" });
  }
  const data = byteLength > 0
    ? { byteLength, ...(charsetDataset === undefined ? {} : { characterSet }), fields }
    : null;
  return { data, fields, warnings, malformed: warnings.some(({ code }) => code === "MALFORMED_IPTC" || code === "TRUNCATED_DATA") };
}
