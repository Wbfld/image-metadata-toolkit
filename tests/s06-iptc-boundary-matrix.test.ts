import { describe, expect, it } from "vitest";

import { inspectIptc, IPTC_IIM_DATASETS, parseIptcMetadata } from "../src/metadata/iptc.js";
import { resolveLimits } from "../src/security/limits.js";

const encoder = new TextEncoder();
const photoshop = Uint8Array.from("Photoshop 3.0\0", (character) => character.charCodeAt(0));
const resourceSignature = Uint8Array.from("8BIM", (character) => character.charCodeAt(0));

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}

function dataset(record: number, number: number, value: Uint8Array): Uint8Array {
  return concat(Uint8Array.of(0x1c, record, number, (value.length >>> 8) & 0xff, value.length & 0xff), value);
}

function extendedDataset(record: number, number: number, value: Uint8Array, countBytes = 1): Uint8Array {
  const length = value.length;
  const lengthBytes = new Uint8Array(countBytes);
  let remaining = length;
  for (let index = countBytes - 1; index >= 0; index -= 1) { lengthBytes[index] = remaining & 0xff; remaining >>>= 8; }
  return concat(Uint8Array.of(0x1c, record, number, 0x80, countBytes), lengthBytes, value);
}

function resource(id: number, payload: Uint8Array, name = ""): Uint8Array {
  const nameBytes = encoder.encode(name);
  const paddedNameLength = (1 + nameBytes.length + 1) & ~1;
  const paddedDataLength = payload.length + (payload.length & 1);
  const output = new Uint8Array(4 + 2 + paddedNameLength + 4 + paddedDataLength);
  let offset = 0;
  output.set(resourceSignature, offset); offset += 4;
  output[offset] = (id >>> 8) & 0xff; output[offset + 1] = id & 0xff; offset += 2;
  output[offset] = nameBytes.length; offset += 1;
  output.set(nameBytes, offset); offset += nameBytes.length;
  offset += paddedNameLength - 1 - nameBytes.length;
  new DataView(output.buffer).setUint32(offset, payload.length, false); offset += 4;
  output.set(payload, offset);
  return output;
}

function photoshopResources(...resources: readonly Uint8Array[]): Uint8Array { return concat(photoshop, ...resources); }

function parsed(payload: Uint8Array, overrides: Parameters<typeof resolveLimits>[0] = {}): ReturnType<typeof parseIptcMetadata> {
  return parseIptcMetadata(payload, resolveLimits({ maxMetadataBytes: 64 * 1024, maxSegmentBytes: 64 * 1024, maxStringBytes: 64 * 1024, maxIptcDatasets: 256, maxIfdEntries: 256, maxWarnings: 256, ...overrides }), 100);
}

describe("S06 IPTC-IIM parser boundary and validation matrix", () => {
  it("handles raw IIM, Photoshop resource selection, multiple resources, and opaque payloads", () => {
    const title = dataset(2, 5, encoder.encode("Title"));
    expect(parsed(title).data?.byteLength).toBe(title.length);
    expect(parsed(title).fields[0]?.source).toMatchObject({ blockId: "IPTC-IIM", entryOffset: 100, valueOffset: 105 });

    const other = resource(0x0406, Uint8Array.of(7, 8), "other");
    const first = resource(0x0404, title, "iptc");
    const second = resource(0x0404, dataset(2, 0x19, encoder.encode("keyword")));
    const payload = photoshopResources(other, first, second);
    const inspection = inspectIptc(payload);
    expect(inspection).toEqual({ data: { byteLength: title.length + dataset(2, 0x19, encoder.encode("keyword")).length }, malformed: false });
    expect(parsed(payload).fields).toHaveLength(2);
    expect(parsed(photoshopResources(other)).data).toBeNull();
    expect(parsed(concat(dataset(2, 5, encoder.encode("x")), Uint8Array.of(0x41))).warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_IPTC" }));
    expect(parsed(Uint8Array.of(1, 2, 3)).data).toBeNull();
    expect(parsed(photoshop.subarray(0, photoshop.length - 1)).data).toBeNull();
  });

  it("validates ordinary and extended lengths, minimums, maximums, counts, and malformed resources", () => {
    const validExtended = extendedDataset(2, 5, encoder.encode("extended"));
    expect(parsed(validExtended).fields[0]?.value).toBe("extended");
    expect(parsed(concat(extendedDataset(2, 5, Uint8Array.of()), dataset(2, 5, encoder.encode("second")))).warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
    const badCountZero = Uint8Array.of(0x1c, 2, 5, 0x80, 0);
    const badCountFive = Uint8Array.of(0x1c, 2, 5, 0x80 | 5, 0, 0, 0, 0, 0);
    expect(parsed(badCountZero).warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_IPTC" }));
    expect(parsed(badCountFive).warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_IPTC" }));
    expect(parsed(Uint8Array.of(0x1c, 2, 5, 0x80, 1, 1)).warnings).toContainEqual(expect.objectContaining({ code: "TRUNCATED_DATA" }));
    expect(parsed(Uint8Array.of(0x1c, 2, 5, 0, 10, 1)).warnings).toContainEqual(expect.objectContaining({ code: "TRUNCATED_DATA" }));
    expect(parsed(Uint8Array.of(0x1c, 2, 5)).warnings).toContainEqual(expect.objectContaining({ code: "TRUNCATED_DATA" }));
    expect(parsed(concat(dataset(2, 5, encoder.encode("abc")), Uint8Array.of(0x41))).warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_IPTC" }));
    expect(parsed(dataset(2, 0x37, encoder.encode("2024"))).warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
    expect(parsed(dataset(2, 0x37, new Uint8Array(65))).warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
    expect(parsed(dataset(2, 5, new Uint8Array(20)), { maxStringBytes: 4 }).fields[0]?.type).toBe("UNDEFINED");
    expect(parsed(dataset(2, 5, encoder.encode("one")), { maxIptcDatasets: 0 + 1 }).fields).toHaveLength(1);
    expect(parsed(concat(dataset(2, 5, encoder.encode("one")), dataset(2, 5, encoder.encode("two"))), { maxIptcDatasets: 1 }).warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    expect(parsed(concat(dataset(2, 5, encoder.encode("one")), dataset(2, 5, encoder.encode("two")))).warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));

    const malformedSignature = photoshopResources(resource(0x0404, dataset(2, 5, encoder.encode("x"))).subarray(0, 8));
    expect(parsed(malformedSignature).malformed).toBe(true);
    const malformedLength = photoshopResources(concat(resourceSignature, Uint8Array.of(4, 4, 0xff), new Uint8Array(12)));
    expect(parsed(malformedLength).malformed).toBe(true);
  });

  it("retains raw values and emits stable diagnostics for encodings, dates, times, codes, and enumerations", () => {
    const valid = concat(
      dataset(1, 0x5a, Uint8Array.of(0x1b, 0x25, 0x47)),
      dataset(2, 5, encoder.encode("café")),
      dataset(2, 0x37, encoder.encode("20240229")),
      dataset(2, 0x3c, encoder.encode("235959-1400")),
      dataset(2, 0x64, encoder.encode("GBR")),
      dataset(2, 0x87, encoder.encode("eng")),
      dataset(2, 0x0a, encoder.encode("8")),
    );
    const validResult = parsed(valid);
    expect(validResult.warnings).toEqual([]);
    expect(validResult.fields.find(({ name }) => name === "ObjectName")?.value).toBe("café");
    expect(validResult.fields.find(({ name }) => name === "Urgency")?.value).toBe(8);

    const invalid = concat(
      dataset(1, 0x5a, Uint8Array.of(0x1b, 0x25, 0x47)),
      dataset(2, 5, Uint8Array.of(0xc3, 0x28)),
      dataset(2, 0x37, encoder.encode("20230229")),
      dataset(2, 0x3c, encoder.encode("246000+1460")),
      dataset(2, 0x64, encoder.encode("NO!")),
      dataset(2, 0x87, encoder.encode("e-")),
      dataset(2, 0x0a, encoder.encode("9")),
    );
    const invalidResult = parsed(invalid);
    expect(invalidResult.fields.some(({ value }) => value instanceof Uint8Array)).toBe(true);
    expect(invalidResult.warnings.some(({ code }) => code === "INVALID_DATE")).toBe(true);
    expect(invalidResult.warnings.filter(({ code }) => code === "INVALID_VALUE").length).toBeGreaterThanOrEqual(4);
    expect(invalidResult.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);

    expect(parsed(dataset(1, 0x5a, Uint8Array.of(0x1b, 0x25, 0x48))).warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
    expect(parsed(dataset(2, 0x37, encoder.encode("19000229"))).warnings).toContainEqual(expect.objectContaining({ code: "INVALID_DATE" }));
    expect(parsed(dataset(2, 0x3c, encoder.encode("120000"))).warnings).toEqual([]);
    expect(parsed(dataset(2, 0x3c, encoder.encode("120000+1401"))).warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
    expect(parsed(dataset(2, 0x3c, encoder.encode("120000*0000"))).warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
    expect(parsed(dataset(2, 0x64, encoder.encode("12"))).warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
    expect(parsed(dataset(2, 0x87, encoder.encode("abcd"))).warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
    expect(parsed(dataset(2, 0x0a, encoder.encode("0"))).warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
  });

  it("keeps unknown datasets bounded and preserves provenance for repeated and binary values", () => {
    const unknown = dataset(9, 9, Uint8Array.of(1, 2, 3));
    const binary = dataset(7, 0x0b, Uint8Array.of(4, 5));
    const result = parsed(concat(unknown, binary));
    expect(result.fields).toHaveLength(2);
    expect(result.fields[0]).toMatchObject({ name: "Dataset 9:9", known: false, type: "ASCII", source: { entryOffset: 100, valueOffset: 105, valueLength: 3 } });
    expect(result.fields[1]).toMatchObject({ type: "UNDEFINED", source: { valueOffset: 113 } });
    const rawBinary = parsed(concat(dataset(1, 0x5a, Uint8Array.of(1)), binary));
    expect(rawBinary.data?.fields?.[1]?.raw).toEqual(Uint8Array.of(4, 5));
    expect(rawBinary.data?.fields?.[1]?.value).toEqual(Uint8Array.of(4, 5));
    expect(parsed(dataset(2, 0x19, new Uint8Array(9)), { maxSegmentBytes: 4 }).warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
  });

  it("exercises one standards-shaped value for every generated IIM dataset definition", () => {
    const valueFor = (definition: (typeof IPTC_IIM_DATASETS)[number]): Uint8Array => {
      if (definition.name === "CodedCharacterSet") return Uint8Array.of(0x1b, 0x25, 0x47);
      if (definition.name === "DateSent" || definition.name === "ReleaseDate" || definition.name === "ExpirationDate" || definition.name === "ReferenceDate" || definition.name === "DateCreated" || definition.name === "DigitalCreationDate") return encoder.encode("20240229");
      if (definition.name === "TimeSent" || definition.name === "ReleaseTime" || definition.name === "ExpirationTime" || definition.name === "TimeCreated" || definition.name === "DigitalCreationTime") return encoder.encode("120000");
      if (definition.name === "CountryCode") return encoder.encode("GBR");
      if (definition.name === "LanguageIdentifier") return encoder.encode("eng");
      if (definition.name === "Urgency") return encoder.encode("1");
      const length = Math.max(1, definition.minLength);
      if (definition.datatype === "BYTE") return new Uint8Array(length).fill(1);
      if (definition.datatype === "UNDEFINED" || definition.format === "binary") return new Uint8Array(length).fill(2);
      return encoder.encode("x".repeat(length));
    };

    for (const definition of IPTC_IIM_DATASETS) {
      const value = valueFor(definition);
      const result = parsed(dataset(definition.record, definition.dataset, value));
      expect(result.fields, definition.id).toHaveLength(1);
      expect(result.fields[0]?.id, definition.id).toBe(`IPTC:${definition.record}:${definition.dataset}`);
      expect(result.fields[0]?.source, definition.id).toMatchObject({ entryOffset: 100, valueOffset: 105, valueLength: value.length });
    }
  });
});
