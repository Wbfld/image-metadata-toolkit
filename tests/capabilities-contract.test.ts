import { access, readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { getCapabilities } from "../src/index.js";

interface CapabilityFormat {
  format: string;
  code: string;
  read: string;
  selectiveDecode: string;
  jpegHeaderBlobRead: string;
  metadataBlobFileRead: string;
  losslessRemoval: string;
  strictSanitization: string;
  evidence: { positive: string; malformed: string; selection: string };
}

interface CapabilityManifest {
  schema: string;
  brand: string;
  packageName: string;
  matrixColumns: readonly { key: string; label: string }[];
  formats: readonly CapabilityFormat[];
}

const manifestUrl = new URL("../scripts/capabilities-manifest.json", import.meta.url);

function affirmative(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  return typeof value === "string" && value.trim().toLowerCase() !== "no" && value.trim().length > 0;
}

function readGroups(value: string): string[] {
  return ["Dimensions", "EXIF", "XMP", "IPTC", "ICC", "JFIF", "PNGText", "Transform", "Nclx"].filter((group) => value.includes(group));
}

describe("capability manifest", () => {
  it("matches runtime capabilities and has evidence for every affirmative cell", async () => {
    const manifest = JSON.parse(await readFile(manifestUrl, "utf8")) as CapabilityManifest;
    expect(manifest.schema).toBe("browser-image-metadata.capabilities.v1");
    expect(manifest.brand).toBe("browser-image-metadata");
    expect(manifest.packageName).toBe("browser-image-metadata");
    expect(manifest.formats).toHaveLength(8);

    for (const entry of manifest.formats) {
      const runtime = getCapabilities(entry.code as Parameters<typeof getCapabilities>[0]);
      expect(runtime.format).toBe(entry.code);
      expect(runtime.readScopes).toContain("full");
      if (entry.jpegHeaderBlobRead === "Yes") expect(runtime.readScopes).toContain("jpeg-header");
      if (affirmative(entry.metadataBlobFileRead)) expect(runtime.readScopes).toContain("metadata");
      expect(runtime.losslessRedaction).toBe(affirmative(entry.losslessRemoval));
      for (const group of readGroups(entry.read)) expect(runtime.metadata).toContain(group);

      for (const column of manifest.matrixColumns) {
        if (!affirmative(entry[column.key as keyof CapabilityFormat])) continue;
        const evidence = entry.evidence;
        expect(evidence.positive).toMatch(/^tests\/[^#]+#/);
        expect(evidence.malformed).toMatch(/^tests\/[^#]+#/);
        expect(evidence.selection).toMatch(/^tests\/[^#]+#/);
        for (const reference of [evidence.positive, evidence.malformed, evidence.selection]) {
          const [file, anchor] = reference.split("#");
          const evidenceUrl = new URL(`../${file}`, import.meta.url);
          await access(evidenceUrl);
          expect(await readFile(evidenceUrl, "utf8")).toContain(anchor);
        }
      }
    }
  });
});
