import { describe, expect, it } from "vitest";
import { createMetadataRegistry, DEFAULT_METADATA_REGISTRY, METADATA_REGISTRY_SIZE, parseMetadata } from "../src/index.js";
import { readFile } from "node:fs/promises";

describe("generated metadata registry", () => {
  it("contains the migrated 138 definitions and immutable provenance", () => {
    expect(METADATA_REGISTRY_SIZE).toBe(138);
    expect(DEFAULT_METADATA_REGISTRY.get("IFD0", 0x010f)?.name).toBe("Make");
    expect(DEFAULT_METADATA_REGISTRY.get("GPSIFD", 0x0002)?.sensitivity).toBe("high");
    expect(DEFAULT_METADATA_REGISTRY.sources[0]?.standard).toContain("Exif");
    expect(Object.isFrozen(DEFAULT_METADATA_REGISTRY.fields)).toBe(true);
    expect(Object.isFrozen(DEFAULT_METADATA_REGISTRY.fields[0])).toBe(true);
  });

  it("rejects duplicate IDs and names before creating a registry", () => {
    const field = {
      id: "custom:0x0001",
      ifd: "custom",
      tag: 1,
      name: "One",
    } as const;
    expect(() => createMetadataRegistry([field, { ...field, id: "custom:0x0002" }])).toThrow(/name/i);
    expect(() => createMetadataRegistry([field, { ...field, name: "Two" }])).toThrow(/id/i);
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
});
