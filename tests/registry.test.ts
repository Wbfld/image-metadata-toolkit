import { describe, expect, it } from "vitest";
import { createMetadataRegistry, DEFAULT_METADATA_REGISTRY, METADATA_REGISTRY_SIZE, parseMetadata } from "../src/index.js";
import { isMetadataRegistry, resolveMetadataRegistry } from "../src/registry.js";
import { readFile } from "node:fs/promises";

describe("generated metadata registry", () => {
  it("contains the complete Exif 3.1 definitions and immutable provenance", () => {
    expect(METADATA_REGISTRY_SIZE).toBe(165);
    expect(DEFAULT_METADATA_REGISTRY.get("IFD0", 0x010f)?.name).toBe("Make");
    expect(DEFAULT_METADATA_REGISTRY.get("GPSIFD", 0x0002)?.sensitivity).toBe("high");
    expect(DEFAULT_METADATA_REGISTRY.sources[0]?.standard).toContain("Exif");
    expect(Object.isFrozen(DEFAULT_METADATA_REGISTRY.fields)).toBe(true);
    expect(Object.isFrozen(DEFAULT_METADATA_REGISTRY.fields[0])).toBe(true);
    expect(Object.isFrozen(DEFAULT_METADATA_REGISTRY.fields[0]?.validation)).toBe(true);
    expect(DEFAULT_METADATA_REGISTRY.getById("IFD0:0x010f")).toBe(DEFAULT_METADATA_REGISTRY.getByName("Make"));
  });

  it("rejects duplicate IDs and names before creating a registry", () => {
    const field = {
      id: "custom:0x0001",
      ifd: "custom",
      tag: 1,
      name: "One",
    } as const;
    expect(() => createMetadataRegistry([
      field,
      { ...field, id: "custom:0x0002", tag: 2 },
    ])).toThrow(/name/i);
    expect(() => createMetadataRegistry([field, { ...field, name: "Two" }])).toThrow(/id|location/i);
    expect(() => createMetadataRegistry([{ ...field, id: "custom:0x0002" }])).toThrow(/does not match/i);
    expect(() => createMetadataRegistry({
      fields: [{ ...field, sourceId: "missing" }],
      sources: [],
    })).toThrow(/unknown metadata registry source/i);
  });

  it("uses a custom registry for one parse without mutating the built-in registry", async () => {
    const input = await readFile(new URL("./fixtures/jpeg-exif-little-endian.jpg", import.meta.url));
    const custom = createMetadataRegistry([{ id: "IFD0:0x010f", ifd: "IFD0", tag: 0x010f, name: "CameraBrand", description: "Custom camera brand" }]);
    const customResult = await parseMetadata(input, { registry: custom });
    const builtInResult = await parseMetadata(input);
    expect(customResult.fields.some((field) => field.name === "CameraBrand")).toBe(true);
    expect(builtInResult.fields.some((field) => field.name === "Make")).toBe(true);
    expect(DEFAULT_METADATA_REGISTRY.get("IFD0", 0x010f)?.name).toBe("Make");
  });

  it("snapshots registry-shaped inputs so later caller mutation cannot leak into parsing", async () => {
    const input = await readFile(new URL("./fixtures/jpeg-exif-little-endian.jpg", import.meta.url));
    const mutableField = { id: "IFD0:0x010f", ifd: "IFD0", tag: 0x010f, name: "OriginalName" };
    const mutableFields = [mutableField];
    const original = createMetadataRegistry(mutableFields);
    const registryLike = {
      fields: [...original.fields],
      sources: [...original.sources],
      get: (ifd: string, tag: number) => original.get(ifd, tag),
      getById: (id: string) => original.getById(id),
      getByName: (name: string) => original.getByName(name),
    };
    const pending = parseMetadata(input, { registry: registryLike });
    registryLike.fields.length = 0;
    mutableField.name = "MutatedName";
    const parsed = await pending;
    expect(parsed.fields.some((field) => field.name === "OriginalName")).toBe(true);
    expect(parsed.fields.some((field) => field.name === "MutatedName")).toBe(false);
  });

  it("validates every custom registry invariant before freezing the lookup tables", () => {
    const base = { id: "custom:0x0001", ifd: "custom", tag: 1, name: "One" } as const;
    expect(() => createMetadataRegistry([{ ...base, tag: -1 }])).toThrow(/tag/i);
    expect(() => createMetadataRegistry([{ ...base, tag: 0x10000 }])).toThrow(/tag/i);
    expect(() => createMetadataRegistry([{ ...base, tag: 1.5 }])).toThrow(/tag/i);
    expect(() => createMetadataRegistry([{ ...base, count: { min: -1, max: null } }])).toThrow(/count/i);
    expect(() => createMetadataRegistry([{ ...base, count: { min: 2, max: 1 } }])).toThrow(/count/i);
    expect(() => createMetadataRegistry([{ ...base, legalTypes: [] }])).toThrow(/types/i);
    expect(() => createMetadataRegistry([{ ...base, aliases: [""] }])).toThrow(/alias/i);
    expect(() => createMetadataRegistry([{ ...base, aliases: ["One"] }])).toThrow(/alias/i);
    expect(() => createMetadataRegistry({ fields: [], sources: [
      { id: "dup", standard: "s", edition: "e", extractionDate: "d", license: "l" },
      { id: "dup", standard: "s", edition: "e", extractionDate: "d", license: "l" },
    ] })).toThrow(/source/i);
    expect(() => createMetadataRegistry({ fields: [], sources: [{ id: "", standard: "s", edition: "e", extractionDate: "d", license: "l" }] })).toThrow(/provenance/i);
    const source = { id: "source", standard: "s", edition: "e", extractionDate: "d", license: "l" } as const;
    expect(() => createMetadataRegistry({ fields: [{ ...base, source, sourceId: "other" }], sources: [source] })).toThrow(/source/i);
    expect(() => createMetadataRegistry({ fields: [{ ...base, sourceId: "source" }], sources: [] })).toThrow(/unknown/i);
    expect(() => createMetadataRegistry({ fields: [{ ...base, source: { ...source, id: "source" } }, { ...base, id: "custom:0x0002", tag: 2, name: "Two", source: { ...source, standard: "different" } }], sources: [source] })).toThrow(/conflicting/i);
    const registry = createMetadataRegistry([{ ...base, aliases: ["Alias"], enumValues: { "1": "one" }, bitfield: { flag: { mask: 1 } }, writePolicy: "safe" }]);
    expect(registry.get("custom", 1)?.legacyEditability).toBe(true);
    expect(registry.get("IFD1", 1)).toBeUndefined();
    expect(registry.getByName("Alias")).toBe(registry.getById("custom:0x0001"));
    expect(resolveMetadataRegistry(registry).getById("custom:0x0001")).toBeDefined();
    const fallback = createMetadataRegistry([{ id: "IFD0:0x0001", ifd: "IFD0", tag: 1, name: "Fallback" }]);
    expect(fallback.get("IFD1", 1)?.name).toBe("Fallback");
    expect(resolveMetadataRegistry([{ id: "custom:0x0002", ifd: "custom", tag: 2, name: "ArrayInput" }]).getByName("ArrayInput")).toBeDefined();
    const omittedSources = { fields: [], sources: undefined } as unknown as Parameters<typeof createMetadataRegistry>[0];
    expect(createMetadataRegistry(omittedSources).sources).toHaveLength(0);
    expect(isMetadataRegistry(registry)).toBe(true);
    expect(isMetadataRegistry(null)).toBe(false);
    expect(isMetadataRegistry({ fields: [], sources: [], get: () => undefined })).toBe(false);
  });
});
