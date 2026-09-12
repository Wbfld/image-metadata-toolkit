import { describe, expect, it } from "vitest";
import { createMetadataRegistry, DEFAULT_METADATA_REGISTRY, METADATA_REGISTRY_SIZE, parseMetadata } from "../src/index.js";
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
});
