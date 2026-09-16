import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_LIMITS,
  getExifComposites,
  getStructuredXmp,
  indexMetadataFields,
  parseMetadata,
  parseMetadataMany,
  queryImageDetails,
  queryMetadata,
  queryStructuredXmp,
  readCaptureTime,
  readExifComposites,
  readGps,
  readIptcSemantic,
  readMetadataSummary,
  readOrientation,
  readPreset,
  readRotation,
  readStructuredXmp,
  readTags,
  readThumbnail,
  toExifReaderCompatible,
  toExifrCompatible,
  toFamilyGroups,
  toFlatObject,
  toJsonSafe,
  toJsonSafeResult,
  toLosslessFamilyGroups,
} from "../src/index.js";
import { verifyC2paInBrowser } from "../src/c2pa-browser.js";
import { verifyC2paInNode } from "../src/c2pa-node.js";
import { MetadataError } from "../src/types.js";

const fixture = (name: string): URL => new URL(`./fixtures/${name}`, import.meta.url);

async function bytes(name: string): Promise<Uint8Array> {
  return new Uint8Array(await readFile(fixture(name)));
}

describe("S06 public API and runtime-boundary matrix", () => {
  it("retains input order across byte views, Blob inputs, bounded concurrency, and empty batches", async () => {
    const jpeg = await bytes("jpeg-exif-little-endian.jpg");
    const png = await bytes("png-metadata.png");
    const results = await parseMetadataMany([jpeg.slice().buffer, png, new Blob([jpeg.slice().buffer])], { concurrency: 2 });
    expect(results).toHaveLength(3);
    expect(results.map((result) => result.format)).toEqual(["jpeg", "png", "jpeg"]);
    expect(results[0]?.dimensions).toEqual({ width: 2, height: 2 });
    expect(results[1]?.dimensions?.width).toBeGreaterThan(0);
    expect((await parseMetadataMany([], { concurrency: 1 })).length).toBe(0);
    await expect(parseMetadataMany([jpeg], { concurrency: 0 })).rejects.toMatchObject({ code: "INVALID_VALUE" });
    const controller = new AbortController();
    controller.abort();
    await expect(parseMetadataMany([jpeg], { signal: controller.signal })).rejects.toBeInstanceOf(MetadataError);
  });

  it("exercises every direct read helper against real metadata and preserves typed semantics", async () => {
    const jpeg = await bytes("jpeg-exif-little-endian.jpg");
    const parsed = await parseMetadata(jpeg);
    const index = indexMetadataFields(parsed);
    expect(index.byName.get("Make")?.value).toBe("OpenAI Camera");
    expect(index.allByName.get("Model")?.length).toBeGreaterThan(0);
    expect(getExifComposites(parsed)).not.toBeNull();
    expect((await readPreset(jpeg, "essential")).fields.some(({ name }) => name === "Make")).toBe(true);
    expect((await readPreset(jpeg, "camera")).fields.some(({ name }) => name === "FocalLength")).toBe(true);
    expect((await readPreset(jpeg, "location")).fields.some(({ name }) => name === "GPSLatitude")).toBe(true);
    expect((await readPreset(jpeg, "privacy")).exif).not.toBeNull();
    expect((await readPreset(jpeg, "all")).fields.length).toBeGreaterThan(0);
    expect((await readTags(jpeg, ["Model", "Orientation", "missing", "Model"])).map(({ name }) => name)).toEqual(["Model", "Orientation"]);
    expect((await readMetadataSummary(jpeg)).camera.make).toBe("OpenAI Camera");
    expect((await readGps(jpeg)).latitude).toBeCloseTo(51.5, 3);
    expect((await readOrientation(jpeg)).value).toBe(6);
    expect((await readRotation(jpeg))?.degrees).toBe(90);
    expect((await readCaptureTime(jpeg)).value).toContain("2026");
    expect(await readThumbnail(jpeg)).toBeNull();
    expect(await readExifComposites(jpeg)).not.toBeNull();
  });

  it("preserves structured XMP packet boundaries and query views under each merge policy", async () => {
    const png = await bytes("png-metadata.png");
    const parsed = await parseMetadata(png, { select: { groups: ["XMP"] } });
    const structured = getStructuredXmp(parsed, { mergePolicy: "preserve-all" });
    expect(structured.documents.length).toBeGreaterThan(0);
    expect(structured.documents.every((document) => document.sourceIndex >= 0)).toBe(true);
    expect(queryStructuredXmp(structured.documents[0]?.value ?? { namespaces: {}, properties: {} })).toBeDefined();
    expect(queryMetadata(parsed, { family: "XMP" })).toBeDefined();
    expect(queryImageDetails(parsed, { property: "storedDimensions" })).toBeDefined();
    const read = await readStructuredXmp(png, { mergePolicy: "first" });
    expect(read.documents.length).toBe(structured.documents.length);
    expect(getStructuredXmp(parsed, { maxPackets: 0 }).complete).toBe(false);
    expect((await readIptcSemantic(await bytes("jpeg-iptc.jpg")))?.selectionPolicy).toBeDefined();
  });

  it("exercises bounded safe projections and reports serialization failures", async () => {
    const parsed = await parseMetadata(await bytes("jpeg-exif-little-endian.jpg"));
    const safe = toJsonSafe(parsed);
    expect(JSON.stringify(safe)).not.toContain("[object Object]");
    expect(toJsonSafeResult(parsed)).toBeDefined();
    expect(toFlatObject(parsed).Make).toBe("OpenAI Camera");
    expect(toFamilyGroups(parsed).IFD0).toBeDefined();
    expect(toLosslessFamilyGroups(parsed).fields.IFD0).toBeDefined();
    const readerView = toExifReaderCompatible(parsed) as Readonly<Record<string, Readonly<Record<string, { readonly value?: unknown }>>>>;
    expect(readerView.IFD0?.Make?.value).toBe("OpenAI Camera");
    expect(toExifrCompatible(parsed).Make).toBe("OpenAI Camera");
    const cyclic = {} as { self?: unknown };
    cyclic.self = cyclic;
    const failure = toJsonSafe(cyclic);
    expect(failure).toEqual({ self: { $circular: true } });
    expect(DEFAULT_LIMITS.maxAdapterOutputBytes).toBeGreaterThan(0);
  });

  it("keeps optional C2PA adapters isolated and typed when SDKs are absent", async () => {
    const input = Uint8Array.of(1, 2, 3);
    const node = await verifyC2paInNode(input);
    expect(node.verifiedBy).toBe("none");
    expect(node.status).toMatch(/^adapter:/u);
    expect(node.officialResult).not.toBeUndefined();
    const browser = await verifyC2paInBrowser(input);
    expect(browser.verifiedBy).toBe("none");
    expect(browser.status).toMatch(/^adapter:/u);
    expect(browser.officialResult).not.toBeUndefined();
  });
});
