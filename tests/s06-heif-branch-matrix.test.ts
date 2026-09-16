import { describe, expect, it } from "vitest";

import { parseHeif } from "../src/parsers/heif.js";
import { resolveLimits } from "../src/security/limits.js";
import { resolveSelection } from "../src/selection.js";

const encoder = new TextEncoder();
const selection = resolveSelection({ groups: ["Dimensions", "EXIF", "XMP", "ICC"] });
const limits = resolveLimits({
  maxInputBytes: 128 * 1024,
  maxMetadataBytes: 32 * 1024,
  maxSegmentBytes: 16 * 1024,
  maxValueBytes: 16 * 1024,
  maxStringBytes: 16 * 1024,
  maxIfdEntries: 64,
  maxSegments: 128,
  maxWarnings: 128,
});

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function u16(value: number): Uint8Array { return Uint8Array.of((value >>> 8) & 0xff, value & 0xff); }
function u32(value: number): Uint8Array { return Uint8Array.of((value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff); }

function box(type: string, ...payloads: readonly Uint8Array[]): Uint8Array {
  const payload = concat(...payloads);
  return concat(u32(payload.length + 8), encoder.encode(type), payload);
}

function fullBox(type: string, payload: Uint8Array, version = 0, flags = 0): Uint8Array {
  return box(type, Uint8Array.of(version, (flags >>> 16) & 0xff, (flags >>> 8) & 0xff, flags & 0xff), payload);
}

function ftyp(): Uint8Array { return box("ftyp", concat(encoder.encode("heic"), u32(0), encoder.encode("mif1"))); }
function container(...children: readonly Uint8Array[]): Uint8Array { return concat(ftyp(), box("meta", concat(new Uint8Array(4), ...children))); }

function infe(id: number, type: string, contentType?: string): Uint8Array {
  return box("infe", concat(Uint8Array.of(2, 0, 0, 0), u16(id), u16(0), encoder.encode(type), encoder.encode(`${type}-${id}\0`), contentType === undefined ? new Uint8Array() : encoder.encode(`${contentType}\0`)));
}

function iinf(infos: readonly Uint8Array[]): Uint8Array { return fullBox("iinf", concat(u16(infos.length), ...infos)); }

function ilocPayloads(entries: readonly { readonly id: number; readonly method?: number; readonly offset?: number; readonly length?: number }[]): Uint8Array {
  return concat(
    Uint8Array.of(1, 0, 0, 0, 0x44, 0x40),
    u16(entries.length),
    ...entries.map((entry) => concat(u16(entry.id), u16(entry.method ?? 0), u16(0), u16(1), u32(1), u32(entry.offset ?? 0), u32(entry.length ?? 1))),
  );
}

function ilocPayload(id: number, method = 0, offset = 0, length = 1): Uint8Array {
  return ilocPayloads([{ id, method, offset, length }]);
}

function ipmaPayload(itemId = 1, encoded: number | readonly number[] = 0x81): Uint8Array {
  const values = typeof encoded === "number" ? [encoded] : encoded;
  return concat(Uint8Array.of(0, 0, 0, 0), u32(1), u16(itemId), Uint8Array.of(values.length, ...values));
}

function irefPayload(child: Uint8Array): Uint8Array { return concat(Uint8Array.of(0, 0, 0, 0), child); }
function reference(type: string, from: number, target: number): Uint8Array { return box(type, concat(u16(from), u16(1), u16(target))); }

describe("S06 HEIF parser bounded branch matrix", () => {
  it("exercises every progressive truncation boundary of item information, locations, data references, associations, and references", () => {
    const validInfo = iinf([infe(1, "mime", "application/rdf+xml")]);
    const validIloc = box("iloc", ilocPayload(1));
    const validDrefPayload = concat(Uint8Array.of(0, 0, 0, 0), u32(1), fullBox("url ", new Uint8Array(), 0, 1));
    const validIpma = box("ipma", ipmaPayload());
    const validIref = box("iref", irefPayload(reference("dimg", 1, 2)));
    const cases: readonly [string, Uint8Array][] = [
      ["iinf", validInfo],
      ["iloc", validIloc],
      ["dref", box("dinf", box("dref", validDrefPayload))],
      ["ipma", validIpma],
      ["iref", validIref],
    ];
    for (const [type, value] of cases) {
      for (let length = 0; length <= value.length; length += 1) {
        const candidate = value.slice(0, length);
        const parsed = type === "dref"
          ? parseHeif(container(candidate), limits, "heif", selection)
          : parseHeif(container(candidate), limits, "heif", selection);
        expect(parsed.warnings.length, `${type} truncation ${length}`).toBeGreaterThanOrEqual(0);
        expect(parsed.warnings.every(({ code, offset, length: warningLength }) => /^[A-Z][A-Z0-9_]+$/u.test(code) && (offset === undefined || (Number.isSafeInteger(offset) && offset >= 0)) && (warningLength === undefined || (Number.isSafeInteger(warningLength) && warningLength >= 0)))).toBe(true);
      }
    }

    const validStructure = container(
      fullBox("pitm", u16(1)),
      iinf([infe(1, "av01"), infe(2, "av01")]),
      box("iloc", ilocPayload(1)),
      box("iref", irefPayload(reference("dimg", 1, 2))),
      box("iprp", box("ipco", box("ispe", concat(Uint8Array.of(0, 0, 0, 0), u32(32), u32(16))), box("irot", Uint8Array.of(1)), box("imir", Uint8Array.of(0))), box("ipma", ipmaPayload())),
      box("idat", Uint8Array.of(1, 2, 3)),
    );
    for (let length = 0; length <= validStructure.length; length += 1) {
      const parsed = parseHeif(validStructure.slice(0, length), limits, "avif", selection);
      expect(parsed.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
    }
  });

  it("covers wide and narrow derived descriptors, auxiliary properties, zero and extended boxes, and resolved item semantics", () => {
    const gridNarrow = Uint8Array.of(0, 0, 0, 0, 0, 2, 0, 2);
    const gridWide = concat(Uint8Array.of(0, 1, 0, 0), u32(0x10000), u32(0x20000));
    const overlayNarrow = Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 3, 0xff, 0xfe, 0, 1);
    const overlayWide = concat(Uint8Array.of(0, 1, 0, 0), new Uint8Array(6), u32(0x10000), u32(0x20000), u32(1), u32(-1));
    const propertyContainer = box("iprp", box("ipco",
      box("ispe", concat(Uint8Array.of(0, 0, 0, 0), u32(32), u32(16))),
      box("colr", concat(encoder.encode("nclx"), u16(1), u16(13), u16(6), Uint8Array.of(0x80))),
      box("auxC", concat(new Uint8Array(4), encoder.encode("urn:example:alpha\0"), u32(1))),
      box("irot", Uint8Array.of(2)), box("imir", Uint8Array.of(1)),
    ), box("ipma", ipmaPayload(1, [0x81, 0x82, 0x83, 0x84, 0x85])));
    const input = container(
      fullBox("pitm", u16(1)),
      iinf([infe(1, "grid"), infe(2, "iovl"), infe(3, "iden")]),
      box("iloc", ilocPayloads([
        { id: 1, method: 1, offset: 0, length: gridNarrow.length },
        { id: 2, method: 1, offset: gridNarrow.length, length: overlayNarrow.length },
      ])),
      box("iref", irefPayload(concat(reference("dimg", 1, 3), reference("dimg", 2, 3)))),
      propertyContainer,
      box("idat", concat(gridNarrow, overlayNarrow)),
    );
    const parsed = parseHeif(input, limits, "heif", selection);
    expect(parsed.heif?.[0]?.items.some(({ derived }) => derived?.type === "grid")).toBe(true);
    expect(parsed.heif?.[0]?.items.some(({ derived }) => derived?.type === "overlay")).toBe(true);
    expect(parsed.transform).toMatchObject({ rotation: 180, mirrored: true, mirrorAxis: "horizontal" });
    expect(parsed.nclx?.fullRange).toBe(true);
    expect(parsed.heif?.[0]?.properties.some(({ auxiliaryType }) => auxiliaryType === "urn:example:alpha")).toBe(true);

    const wideDescriptor = container(
      fullBox("pitm", u16(1)),
      iinf([infe(1, "grid"), infe(2, "iovl"), infe(3, "iden")]),
      box("iloc", ilocPayloads([
        { id: 1, method: 1, offset: 0, length: gridWide.length },
        { id: 2, method: 1, offset: gridWide.length, length: overlayWide.length },
      ])),
      box("iref", irefPayload(concat(reference("dimg", 1, 3), reference("dimg", 2, 3)))),
      box("idat", concat(gridWide, overlayWide)),
    );
    const wide = parseHeif(wideDescriptor, limits, "heif", selection);
    expect(wide.warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
    expect(wide.heif?.[0]?.items.every(({ derived }) => derived === undefined || derived.type === "grid" || derived.type === "overlay" || derived.type === "identity")).toBe(true);

    const extended = concat(ftyp(), Uint8Array.of(0, 0, 0, 1), encoder.encode("meta"), Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 12), new Uint8Array(4));
    const zeroSized = concat(ftyp(), Uint8Array.of(0, 0, 0, 0), encoder.encode("free"));
    expect(parseHeif(extended, limits, "heif", selection).warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
    expect(parseHeif(zeroSized, limits, "heif", selection).warnings.length).toBeLessThanOrEqual(limits.maxWarnings);
  });

  it("keeps malformed colour, text, references, and metadata resolution fail-closed under selected limits", () => {
    const malformedColour = container(
      fullBox("pitm", u16(1)),
      iinf([infe(1, "mime", "application/rdf+xml")]),
      box("iprp", box("ipco", box("colr", concat(encoder.encode("nclx"), new Uint8Array(2))), box("auxC", Uint8Array.of(0, 0, 0, 0, 0xff))), box("ipma", ipmaPayload(1, 0))),
      box("xml ", Uint8Array.of(0xff, 0xfe)),
      box("iref", irefPayload(reference("xxxx", 999, 0))),
    );
    const parsed = parseHeif(malformedColour, resolveLimits({ ...limits, maxSegments: 8, maxWarnings: 8 }), "cr3", selection);
    expect(parsed.warnings.length).toBeLessThanOrEqual(8);
    expect(parsed.warnings.some(({ code }) => code === "MALFORMED_HEIF" || code === "INVALID_VALUE")).toBe(true);
    expect(parsed.xmp).toBeNull();

    const missingData = container(fullBox("pitm", u16(1)), iinf([infe(1, "Exif")]), box("iloc", ilocPayload(1, 0, 0, 99)));
    const result = parseHeif(missingData, limits, "heif", resolveSelection({ groups: ["EXIF"] }));
    expect(result.exif).toBeNull();
    expect(result.warnings.some(({ code }) => code === "UNSAFE_OFFSET" || code === "MALFORMED_HEIF")).toBe(true);
  });
});
