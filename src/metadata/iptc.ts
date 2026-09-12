import type { ExifDataType, IptcData, IptcIimDatasetDefinition, MetadataField, MetadataWarning, SecurityLimits } from "../types.js";
import { IPTC_TECHREFERENCE_PROPERTIES } from "../generated/iptc-pmd.js";

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
  // Envelope record (1), including legacy transport fields retained as raw
  // values when a container carries them.
  0x0101: "ModelVersion",
  0x0105: "Destination",
  0x0114: "FileFormat",
  0x0116: "FileVersion",
  0x011e: "ServiceIdentifier",
  0x0128: "EnvelopeNumber",
  0x0132: "ProductID",
  0x013c: "EnvelopePriority",
  0x0146: "DateSent",
  0x0150: "TimeSent",
  0x015a: "CodedCharacterSet",
  0x0164: "UNO",
  0x0178: "ARMIdentifier",
  0x017a: "ARMVersion",
  // Application record (2).
  0x0201: "RecordVersion",
  0x0203: "ObjectTypeReference",
  0x0204: "ObjectAttributeReference",
  0x0205: "ObjectName",
  0x0207: "EditStatus",
  0x0208: "EditorialUpdate",
  0x020a: "Urgency",
  0x020c: "SubjectReference",
  0x020f: "Category",
  0x0214: "FixtureIdentifier",
  0x0216: "ContentStatus",
  0x0219: "Keywords",
  0x021a: "ContentAdvisory",
  0x021b: "LocationCode",
  0x021c: "LocationName",
  0x021e: "ReleaseDate",
  0x0223: "ReleaseTime",
  0x0225: "ExpirationDate",
  0x022a: "ExpirationTime",
  0x022c: "SpecialInstructions",
  0x022e: "ActionAdvised",
  0x0232: "ReferenceService",
  0x0234: "ReferenceDate",
  0x0236: "ReferenceNumber",
  0x0237: "DateCreated",
  0x0238: "DigitalCreationDate",
  0x023c: "TimeCreated",
  0x023e: "DigitalCreationTime",
  0x0241: "OriginatingProgram",
  0x0246: "ProgramVersion",
  0x024b: "ObjectCycle",
  0x0250: "Byline",
  0x0255: "BylineTitle",
  0x025a: "City",
  0x025c: "Sublocation",
  0x025f: "ProvinceState",
  0x0264: "CountryCode",
  0x0265: "CountryName",
  0x0267: "OriginalTransmissionReference",
  0x0269: "Headline",
  0x026e: "Credit",
  0x0273: "Source",
  0x0274: "CopyrightNotice",
  0x0276: "Contact",
  0x0278: "Caption",
  0x027a: "Writer",
  0x027d: "RasterizedCaption",
  0x0282: "ImageType",
  0x0283: "ImageOrientation",
  0x0287: "LanguageIdentifier",
  0x0296: "AudioType",
  0x0297: "AudioSamplingRate",
  0x0298: "AudioSamplingResolution",
  0x0299: "AudioDuration",
  0x029a: "AudioOutcue",
  0x02c8: "ObjectDataPreviewFileFormat",
  0x02c9: "ObjectDataPreviewFileFormatVersion",
  0x02ca: "ObjectDataPreviewData",
  // NewsPhoto, pre-object-data and object-data records.
  0x0301: "RecordVersion3",
  0x030a: "MaximumObjectDataSize",
  0x030f: "ObjectDataSizeAnnounced",
  0x0314: "MaximumSubfileSize",
  0x031e: "ObjectDataSizeAnnounced2",
  0x0328: "Subfile",
  0x070a: "PreObjectDataSize",
  0x070b: "ObjectDataSize",
  0x080a: "SubfileData",
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

type IimDefinition = (typeof IPTC_TECHREFERENCE_PROPERTIES)[number];
const IIM_DEFINITIONS = new Map<number, IimDefinition>();
for (const definition of IPTC_TECHREFERENCE_PROPERTIES) {
  const ids = definition.iimId?.match(/\d+\s*:\s*\d+/g) ?? [];
  for (const id of ids) {
    const [record, dataset] = id.split(":").map((part) => Number(part));
    if (record !== undefined && dataset !== undefined && Number.isSafeInteger(record) && Number.isSafeInteger(dataset)) {
      const key = (record << 8) | dataset;
      const existing = IIM_DEFINITIONS.get(key);
      if (existing !== undefined && existing.id !== definition.id) throw new Error(`Contradictory IPTC Photo Metadata mappings for IIM ${record}:${dataset}.`);
      IIM_DEFINITIONS.set(key, definition);
    }
  }
}

/** IIM 4.1 length ceilings for transport/application datasets not represented
 * by the Photo Metadata TechReference. Values are bytes, not characters. */
const IIM_MAX_BYTES: Readonly<Record<number, number>> = {
  0x0101: 2, 0x0105: 1024, 0x0114: 2, 0x0116: 2, 0x011e: 10, 0x0128: 8, 0x0132: 64, 0x013c: 1, 0x0146: 8, 0x0150: 11, 0x015a: 3, 0x0164: 64, 0x0178: 2, 0x017a: 2,
  // Category is historically emitted as four ASCII bytes by common Adobe
  // writers (for example NEWS); retain that interoperable form and reject
  // larger values.
  0x0201: 2, 0x0203: 3, 0x0204: 4, 0x0205: 64, 0x0207: 64, 0x0208: 2, 0x020a: 1, 0x020c: 236, 0x020f: 4, 0x0214: 32, 0x0216: 60, 0x0219: 64, 0x021a: 64, 0x021b: 3, 0x021c: 64, 0x021e: 8, 0x0223: 11, 0x0225: 8, 0x022a: 11, 0x022c: 256, 0x022e: 2, 0x0232: 32, 0x0234: 8, 0x0236: 32, 0x0237: 8, 0x0238: 8, 0x023c: 11, 0x023e: 11, 0x0241: 32, 0x0246: 10, 0x024b: 1, 0x0250: 32, 0x0255: 32, 0x025a: 32, 0x025c: 32, 0x025f: 32, 0x0264: 3, 0x0265: 64, 0x0267: 32, 0x0269: 256, 0x026e: 32, 0x0273: 32, 0x0274: 128, 0x0276: 128, 0x0278: 2000, 0x027a: 32, 0x027d: 256, 0x0282: 2, 0x0283: 1, 0x0287: 3, 0x0296: 2, 0x0297: 11, 0x0298: 2, 0x0299: 6, 0x029a: 64,
};
const IIM_MIN_BYTES: Readonly<Record<number, number>> = {
  0x0101: 2, 0x0114: 2, 0x0116: 2, 0x013c: 1, 0x0146: 8, 0x0150: 6, 0x0201: 2, 0x020a: 1, 0x0237: 8, 0x023c: 6, 0x0282: 2, 0x0283: 1, 0x0287: 2,
};

/** IIM's extended-length form carries at most four big-endian length bytes. */
const IIM_EXTENDED_LENGTH_MAX_BYTES = 0xffffffff;

const DATE_DATASETS = new Set([0x0146, 0x021e, 0x0225, 0x0234, 0x0237, 0x0238]);
const TIME_DATASETS = new Set([0x0150, 0x0223, 0x022a, 0x023c, 0x023e]);
const BINARY_DATASETS = new Set([0x02ca, 0x0328, 0x070b, 0x080a]);
const SENSITIVE_DATASETS = new Set([0x0250, 0x0255, 0x025a, 0x025c, 0x025f, 0x0264, 0x0265, 0x0274, 0x0276, 0x0278, 0x027a]);

function dataTypeForDataset(key: number): ExifDataType {
  if ([0x0101, 0x0114, 0x0116, 0x013c, 0x0178, 0x017a, 0x0201, 0x020a, 0x022e, 0x0283].includes(key)) return "BYTE";
  return key === 0x015a || BINARY_DATASETS.has(key) ? "UNDEFINED" : "ASCII";
}

function validationRulesForDataset(key: number, format: string): readonly string[] {
  return [
    "minimum-byte-length", "maximum-byte-length", "repeatability", "preserve-raw-on-invalid",
    ...(format === "binary" ? ["bounded-binary"] : ["declared-character-set"]),
    ...(DATE_DATASETS.has(key) ? ["calendar-date"] : []),
    ...(TIME_DATASETS.has(key) ? ["clock-time-timezone"] : []),
    ...(key === 0x020a ? ["urgency-enumeration"] : []),
    ...(key === 0x0264 ? ["country-code"] : []),
    ...(key === 0x0287 ? ["language-code"] : []),
  ];
}

/** Public catalog for every IIM dataset recognised by the bounded parser. */
export const IPTC_IIM_DATASETS: readonly IptcIimDatasetDefinition[] = Object.freeze(Object.entries(DATASET_NAMES).map(([key, name]) => {
  const numericKey = Number(key);
  const record = numericKey >>> 8;
  const dataset = numericKey & 0xff;
  const definition = IIM_DEFINITIONS.get(numericKey);
  const maxLength = definition?.iimMaxBytes ?? IIM_MAX_BYTES[numericKey] ?? IIM_EXTENDED_LENGTH_MAX_BYTES;
  const repeatable = definition?.occurrence === "multi" || numericKey === 0x020c || numericKey === 0x0219;
  const format = definition?.dataformat ?? (numericKey === 0x015a ? "coded-character-set" : BINARY_DATASETS.has(numericKey) ? "binary" : "text");
  const xmpMapping = definition?.mappings.xmp;
  return {
    id: `IIM:${record}:${dataset}`,
    stableIdentity: `iptc-iim:${record}:${dataset}`,
    record,
    dataset,
    name,
    label: definition?.label ?? name,
    description: definition?.description ?? `IPTC-IIM ${record}:${dataset} ${name} dataset.`,
    datatype: dataTypeForDataset(numericKey),
    format,
    minLength: IIM_MIN_BYTES[numericKey] ?? 0,
    maxLength,
    repeatable,
    cardinality: repeatable ? "0..n" : "0..1",
    required: false,
    applicableVersions: ["IPTC-IIM 4.1", ...(definition?.applicableVersions ?? [])],
    controlledValues: numericKey === 0x020a ? ["1", "2", "3", "4", "5", "6", "7", "8"] : [],
    structuredResource: definition?.structuredResource?.id ?? null,
    validationRules: validationRulesForDataset(numericKey, format),
    rawValueBehavior: "Exact dataset bytes are retained. Invalid or unsupported text remains raw bytes with a stable diagnostic.",
    mappings: {
      iim: { record, dataset, id: `${record}:${dataset}` },
      xmp: xmpMapping === undefined
        ? []
        : [{ namespaceUri: xmpMapping.namespaceUri, localName: xmpMapping.localName, id: definition?.xmpId ?? `${xmpMapping.namespaceUri}${xmpMapping.localName}` }],
    },
    standardVersion: "IPTC-IIM 4.1 / IPTC Photo Metadata 2025.1",
    sensitivity: SENSITIVE_DATASETS.has(numericKey) ? "moderate" : "low",
  } satisfies IptcIimDatasetDefinition;
}).sort((left, right) => left.record - right.record || left.dataset - right.dataset));

function officialDatasetName(definition: IimDefinition | undefined): string | undefined {
  const value = definition?.iimName;
  if (value === undefined || value === null) return undefined;
  return value.split("+")[0]?.trim() || undefined;
}

function iimType(key: number, decoded: string | null): ExifDataType {
  if (dataTypeForDataset(key) === "BYTE") return "BYTE";
  if (dataTypeForDataset(key) === "UNDEFINED") return "UNDEFINED";
  return decoded === null ? "UNDEFINED" : "ASCII";
}

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

function isCalendarDate(value: string): boolean {
  if (!/^\d{8}$/u.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const days = [31, (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= (days[month - 1] ?? 0);
}

function isIptcTime(value: string): boolean {
  if (value.length !== 6 && value.length !== 11) return false;
  const clock = value.slice(0, 6);
  if (!/^\d{6}$/u.test(clock)) return false;
  const hours = Number(clock.slice(0, 2));
  const minutes = Number(clock.slice(2, 4));
  const seconds = Number(clock.slice(4, 6));
  if (hours > 23 || minutes > 59 || seconds > 59) return false;
  if (value.length === 6) return true;
  const sign = value[6];
  const offset = value.slice(7);
  if ((sign !== "+" && sign !== "-") || !/^\d{4}$/u.test(offset)) return false;
  const offsetHours = Number(offset.slice(0, 2));
  const offsetMinutes = Number(offset.slice(2, 4));
  return offsetMinutes <= 59 && (offsetHours < 14 || (offsetHours === 14 && offsetMinutes === 0));
}

function isCountryCode(value: string): boolean {
  // IIM identifies this as the three-character ISO country-code field. The
  // official reference image deliberately uses the synthetic R25 value, so
  // validate its bounded code grammar rather than a non-standard local list.
  return /^[A-Za-z0-9]{3}$/u.test(value);
}

function isLanguageCode(value: string): boolean {
  const subtags = value.split("-");
  if (subtags.length === 0 || subtags.some((subtag) => subtag.length === 0 || subtag.length > 8)) return false;
  const primary = subtags[0] ?? "";
  if (primary.length < 2 || primary.length > 3 || !/^[A-Za-z]+$/u.test(primary)) return false;
  for (const subtag of subtags.slice(1)) {
    if (!/^[A-Za-z0-9]+$/u.test(subtag)) return false;
    if (subtag.length === 4 && !/^[A-Za-z]+$/u.test(subtag)) return false;
  }
  return true;
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
    if (!Number.isSafeInteger(byteLength + resource.length)) {
      if (warnings.length < limits.maxWarnings) warnings.push({ code: "LIMIT_EXCEEDED", message: "IPTC resource byte accounting overflowed safely.", severity: "error" });
      break;
    }
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
        for (let index = 0; index < countBytes; index += 1) {
          const nextLength = valueLength * 256 + (resource[cursor + 5 + index] ?? 0);
          if (!Number.isSafeInteger(nextLength)) {
            if (warnings.length < limits.maxWarnings) warnings.push({ code: "LIMIT_EXCEEDED", message: "IPTC extended dataset length overflowed safely.", severity: "error", offset: warningBaseOffset + consumed + cursor + 3 });
            valueLength = -1;
            break;
          }
          valueLength = nextLength;
        }
        if (valueLength < 0) break;
        headerLength += countBytes;
      }
      const valueStart = cursor + headerLength;
      const valueEnd = valueStart + valueLength;
      if (!Number.isSafeInteger(valueEnd) || valueEnd > resource.length) {
        if (warnings.length < limits.maxWarnings) warnings.push({ code: "TRUNCATED_DATA", message: "IPTC dataset extends beyond its resource.", severity: "error", offset: warningBaseOffset + consumed + cursor, length: valueLength });
        break;
      }
      if (datasets.length >= Math.min(limits.maxIfdEntries, limits.maxIptcDatasets)) {
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

  const occurrences = new Map<number, number>();
  for (const dataset of datasets) occurrences.set(dataset.key, (occurrences.get(dataset.key) ?? 0) + 1);
  for (const [key, count] of occurrences) {
    const definition = IIM_DEFINITIONS.get(key);
    const repeatable = definition?.occurrence === "multi" || key === 0x020c || key === 0x0219;
    if (count > 1 && !repeatable && warnings.length < limits.maxWarnings) {
      warnings.push({ code: "INVALID_VALUE", message: `Non-repeatable IPTC-IIM dataset ${key >>> 8}:${key & 0xff} occurs ${count} times; every occurrence is retained.`, severity: "warning" });
    }
  }

  for (const dataset of datasets) {
    const definition = IIM_DEFINITIONS.get(dataset.key);
    const name = DATASET_NAMES[dataset.key] ?? officialDatasetName(definition) ?? `Dataset ${dataset.record}:${dataset.dataset}`;
    const decoded = dataset.key === 0x015a
      ? (characterSet === "utf-8" ? "UTF-8" : hex(dataset.raw))
      : characterSet === "utf-8" ? decodeUtf8(dataset.raw) : characterSet === "latin1" ? decodeLatin1(dataset.raw) : null;
    let value: MetadataField["value"] = decoded ?? dataset.raw;
    let type: MetadataField["type"] = iimType(dataset.key, decoded);
    let invalid = false;
    if (dataset.raw.length > limits.maxStringBytes && decoded !== null) {
      value = dataset.raw;
      type = "UNDEFINED";
      if (warnings.length < limits.maxWarnings) warnings.push({ code: "LIMIT_EXCEEDED", message: "IPTC text value exceeds the configured string limit and was not decoded.", severity: "warning", offset: dataset.offset, length: dataset.raw.length });
    } else if (decoded === null && dataset.key !== 0x015a && warnings.length < limits.maxWarnings) {
      warnings.push({ code: "INVALID_VALUE", message: "IPTC text value is not valid UTF-8 for its declared character set; raw bytes were preserved.", severity: "warning", offset: dataset.offset, length: dataset.raw.length });
    }
    const maxBytes = definition?.iimMaxBytes ?? IIM_MAX_BYTES[dataset.key] ?? (Object.hasOwn(DATASET_NAMES, dataset.key) ? IIM_EXTENDED_LENGTH_MAX_BYTES : undefined);
    const minBytes = IIM_MIN_BYTES[dataset.key];
    if (minBytes !== undefined && dataset.raw.length < minBytes) {
      invalid = true;
      if (warnings.length < limits.maxWarnings) warnings.push({ code: "INVALID_VALUE", message: `${name} is shorter than the official minimum of ${minBytes} bytes; raw bytes were preserved.`, severity: "warning", offset: dataset.offset, length: dataset.raw.length });
    }
    if (maxBytes !== undefined && dataset.raw.length > maxBytes) {
      invalid = true;
      if (warnings.length < limits.maxWarnings) warnings.push({ code: "INVALID_VALUE", message: `${name} exceeds the official IPTC-IIM maximum of ${maxBytes} bytes; raw bytes were preserved.`, severity: "warning", offset: dataset.offset, length: dataset.raw.length });
    }
    if (dataset.key === 0x020a && typeof decoded === "string") {
      type = "BYTE";
      const urgency = Number(decoded);
      value = Number.isInteger(urgency) && urgency >= 1 && urgency <= 8 ? urgency : decoded;
      if (typeof value === "string") {
        invalid = true;
        if (warnings.length < limits.maxWarnings) warnings.push({ code: "INVALID_VALUE", message: "IPTC Urgency must be an integer from 1 through 8.", severity: "warning", offset: dataset.offset });
      }
    }
    if (DATE_DATASETS.has(dataset.key) && typeof decoded === "string" && !isCalendarDate(decoded)) {
      invalid = true;
      if (warnings.length < limits.maxWarnings) warnings.push({ code: "INVALID_DATE", message: `${name} must be an actual YYYYMMDD calendar date.`, severity: "warning", offset: dataset.offset, length: dataset.raw.length });
    }
    if (TIME_DATASETS.has(dataset.key) && typeof decoded === "string" && !isIptcTime(decoded)) {
      invalid = true;
      if (warnings.length < limits.maxWarnings) warnings.push({ code: "INVALID_VALUE", message: `${name} must be a valid HHMMSS time with a UTC offset no greater than 14:00.`, severity: "warning", offset: dataset.offset, length: dataset.raw.length });
    }
    if (dataset.key === 0x0264 && typeof decoded === "string" && !isCountryCode(decoded)) {
      invalid = true;
      if (warnings.length < limits.maxWarnings) warnings.push({ code: "INVALID_VALUE", message: "IPTC CountryCode must be a bounded three-character country code.", severity: "warning", offset: dataset.offset, length: dataset.raw.length });
    }
    if (dataset.key === 0x0287 && typeof decoded === "string" && !isLanguageCode(decoded)) {
      invalid = true;
      if (warnings.length < limits.maxWarnings) warnings.push({ code: "INVALID_VALUE", message: "IPTC LanguageIdentifier must be a valid BCP 47 language-tag structure.", severity: "warning", offset: dataset.offset, length: dataset.raw.length });
    }
    if (invalid) { value = dataset.raw; type = "UNDEFINED"; }
    const display = typeof value === "number" ? `Urgency ${value}` : typeof value === "string" ? value : `0x${hex(dataset.raw)}`;
    const occurrence = fields.filter((field) => field.tag === dataset.key).length;
    fields.push({ id: occurrence === 0 ? `IPTC:${dataset.record}:${dataset.dataset}` : `IPTC:${dataset.record}:${dataset.dataset}:${occurrence}`, ifd: "IPTC", tag: dataset.key, name, raw: dataset.raw, value, display, description: DATASET_DESCRIPTIONS[name] ?? definition?.description ?? definition?.label ?? `IPTC-IIM record ${dataset.record}, dataset ${dataset.dataset}.`, type, sensitivity: SENSITIVE_DATASETS.has(dataset.key) ? "moderate" : "low", known: definition !== undefined || Object.hasOwn(DATASET_NAMES, dataset.key), occurrence, ...(definition?.dataformat === null || definition?.dataformat === undefined ? {} : { format: definition.dataformat }), ...(IIM_MIN_BYTES[dataset.key] === undefined ? {} : { minLength: IIM_MIN_BYTES[dataset.key] }), ...(maxBytes === undefined ? {} : { maxLength: maxBytes }), repeatable: definition?.occurrence === "multi" || dataset.key === 0x020c || dataset.key === 0x0219, standardVersion: "IPTC Photo Metadata 2025.1" });
  }
  const data = byteLength > 0
    ? { byteLength, ...(charsetDataset === undefined ? {} : { characterSet }), fields, diagnostics: warnings }
    : null;
  return { data, fields, warnings, malformed: warnings.some(({ code }) => code === "MALFORMED_IPTC" || code === "TRUNCATED_DATA") };
}
