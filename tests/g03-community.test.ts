import { readFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { defineCommunityMakerNotePlugin } from "../community/plugin-template.js";
import type { MakerNotePluginInput, MakerNotePluginResult } from "../src/types.js";

const root = join(import.meta.dirname, "..");
const source = {
  id: "community-source",
  url: "https://example.invalid/community-source",
  version: "1.0.0",
  license: "CC-BY-4.0",
  retrievedAt: "2026-09-15",
  sha256: "a".repeat(64),
  role: "vendor" as const,
};

function pluginDefinition() {
  const input = {} as MakerNotePluginInput;
  const result: MakerNotePluginResult = { status: "detected-opaque", fields: [], opaqueRanges: [], diagnostics: [] };
  return {
    identity: {
      id: "community/example",
      version: "1.0.0",
      vendor: "Example Vendor",
      noteFamily: "Example Note",
      minimumConfidence: 1,
      signatureTests: ["example"],
      byteOrder: "little-endian" as const,
      baseOffsetRule: "note-start" as const,
      nestedIfd: "none" as const,
      encryption: "none" as const,
      tagRegistry: [{
        id: "example:tag",
        tag: 1,
        name: "Example",
        label: "Example",
        description: "Example tag",
        type: "ASCII" as const,
        repeatable: false,
        sensitivity: "none" as const,
        rawValueBehavior: "retain" as const,
        enumValues: { one: "One" },
        applicableModels: ["Example Model"],
        applicableVersions: ["1.0"],
      }],
      securityRequirements: ["bounded-context"],
      sources: [source],
    },
    detect: () => null,
    parse: () => result,
    input,
  };
}

describe("G03 community program", () => {
  it("creates an immutable isolated plugin with hashed source provenance", () => {
    const definition = pluginDefinition();
    const plugin = defineCommunityMakerNotePlugin(definition);
    expect(Object.isFrozen(plugin)).toBe(true);
    expect(Object.isFrozen(plugin.identity)).toBe(true);
    expect(Object.isFrozen(plugin.identity.sources)).toBe(true);
    expect(Object.isFrozen(plugin.identity.signatureTests)).toBe(true);
    expect(Object.isFrozen(plugin.identity.tagRegistry)).toBe(true);
    const tag = plugin.identity.tagRegistry[0];
    if (tag === undefined) throw new Error("test plugin tag definition was not retained");
    expect(Object.isFrozen(tag)).toBe(true);
    expect(Object.isFrozen(tag.enumValues)).toBe(true);
    expect(Object.isFrozen(tag.applicableModels)).toBe(true);
    expect(Object.isFrozen(tag.applicableVersions)).toBe(true);
    expect(plugin.identity.id).toBe("community/example");
    expect(plugin.detect({} as never)).toBeNull();
    expect(plugin.parse(definition.input)).toEqual({ status: "detected-opaque", fields: [], opaqueRanges: [], diagnostics: [] });
    expect(Reflect.set(plugin as object, "identity", definition.identity)).toBe(false);
    expect(Reflect.set(plugin.identity as object, "id", "changed")).toBe(false);
    expect(Reflect.set(plugin.identity.signatureTests as object, "0", "changed")).toBe(false);
    expect(Reflect.set(plugin.identity.tagRegistry as object, "0", {})).toBe(false);
    expect(Reflect.set(tag as object, "name", "changed")).toBe(false);
    expect(Reflect.set(tag.enumValues as object, "two", "Two")).toBe(false);
    expect(Reflect.set(tag.applicableModels as object, "0", "changed")).toBe(false);
    expect(Reflect.set(tag.applicableVersions as object, "0", "changed")).toBe(false);
  });

  it("rejects missing, non-HTTPS, and un-hashed provenance", () => {
    const definition = pluginDefinition();
    expect(() => defineCommunityMakerNotePlugin({ ...definition, identity: { ...definition.identity, sources: [] } })).toThrow(TypeError);
    expect(() => defineCommunityMakerNotePlugin({ ...definition, identity: { ...definition.identity, sources: [{ ...source, url: "http://example.invalid" }] } })).toThrow(TypeError);
    expect(() => defineCommunityMakerNotePlugin({ ...definition, identity: { ...definition.identity, sources: [{ ...source, sha256: "short" }] } })).toThrow(TypeError);
  });

  it("retains a bounded scrubber contract and redistribution-safe evidence", async () => {
    const report = JSON.parse(await readFile(join(root, "reports/g03-community-evidence.json"), "utf8")) as { status: string; scrubber: { limitRefusal: boolean; reportPrivacy: string }; schema: { boundedTags: number } };
    expect(report.status).toBe("passed");
    expect(report.scrubber.limitRefusal).toBe(true);
    expect(report.scrubber.reportPrivacy).not.toContain("SECRET-123");
    expect(report.schema.boundedTags).toBe(4096);
  });

  it("does not overwrite a source fixture and refuses oversized input before allocation", async () => {
    const scrubber = await import("../scripts/fixture-scrubber.mjs");
    const temporary = await mkdtemp(join(tmpdir(), "image-metadata-g03-test-"));
    const input = join(temporary, "fixture.bin");
    try {
      await writeFile(input, Uint8Array.of(1, 2, 3));
      await expect(scrubber.inspectAndScrub({ input, report: join(temporary, "report.json"), output: input, policy: "share-safe", maxInputBytes: 10 })).rejects.toThrow("must not overwrite");
      await expect(scrubber.inspectAndScrub({ input, report: join(temporary, "report.json"), output: null, policy: "share-safe", maxInputBytes: 2 })).rejects.toThrow("exceeds");
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  });
});
