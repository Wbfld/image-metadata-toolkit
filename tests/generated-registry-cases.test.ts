import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { GENERATED_METADATA_FIELDS } from "../src/generated/metadata-registry.js";

interface SourceField {
  id: string;
  ifd: string;
  family: string;
  tag: string;
  name: string;
  aliases: string[];
  legalTypes: string[];
  count: { min: number; max: number | null };
  version: string;
  sensitivity: string;
  description: string;
  validation: { kind: string; values?: unknown[] };
  writePolicy: string;
  sourceId: string;
}

const source = JSON.parse(readFileSync(new URL("../data/metadata-registry.json", import.meta.url), "utf8")) as { fields: SourceField[] };
const generated = GENERATED_METADATA_FIELDS as unknown as readonly (SourceField & { tag: number; source: unknown })[];
const generatedByName = new Map(generated.map((field) => [field.name, field]));

describe("generated standardized EXIF registry evidence", () => {
  it("contains every source field exactly once and preserves the 3.1 additions", () => {
    expect(generated).toHaveLength(source.fields.length);
    expect(new Set(generated.map((field) => field.id)).size).toBe(generated.length);
    expect(source.fields.filter((field) => field.version === "3.1")).toHaveLength(8);
    expect(source.fields.filter((field) => field.version === "3.1").every((field) => generatedByName.has(field.name))).toBe(true);
  });

  it.each(source.fields.map((field) => [field.id, field] as const))("has a complete executable definition for %s", (_id, sourceField) => {
    const field = generatedByName.get(sourceField.name);
    expect(field).toBeDefined();
    expect(field).toMatchObject({
      id: sourceField.id,
      ifd: sourceField.ifd,
      family: sourceField.family,
      tag: Number.parseInt(sourceField.tag, 16),
      name: sourceField.name,
      aliases: sourceField.aliases,
      legalTypes: sourceField.legalTypes,
      count: sourceField.count,
      version: sourceField.version,
      sensitivity: sourceField.sensitivity,
      description: sourceField.description,
      validation: sourceField.validation,
      writePolicy: sourceField.writePolicy,
      legacyEditability: sourceField.writePolicy === "safe",
    });
    expect(field?.source).toMatchObject({ id: sourceField.sourceId });
    expect(field?.legalTypes.length).toBeGreaterThan(0);
    expect(Number.isInteger(field?.count.min)).toBe(true);
    expect(field?.count.max === null || Number.isInteger(field?.count.max)).toBe(true);
    expect(field?.validation.kind.length).toBeGreaterThan(0);
    expect(field?.description.length).toBeGreaterThan(0);
    expect(field?.sensitivity.length).toBeGreaterThan(0);
  });
});
