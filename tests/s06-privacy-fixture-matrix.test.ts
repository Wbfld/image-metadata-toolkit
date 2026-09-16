import { readdir, readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { auditPrivacy } from "../src/index.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";

const imageExtensions = new Set([".avif", ".cr2", ".cr3", ".gif", ".heic", ".jpg", ".jpeg", ".jxl", ".nef", ".png", ".raf", ".tif", ".tiff", ".webp"]);

async function fixtureNames(): Promise<string[]> {
  const names = await readdir(new URL("./fixtures/", import.meta.url));
  return names
    .filter((name) => imageExtensions.has(name.slice(name.lastIndexOf(".")).toLowerCase()))
    .sort();
}

describe("S06 privacy audit fixture and limit matrix", () => {
  it("inspects every repository image fixture through the bounded privacy model", async () => {
    const names = await fixtureNames();
    expect(names.length).toBeGreaterThanOrEqual(30);
    for (const name of names) {
      const bytes = new Uint8Array(await readFile(new URL(`./fixtures/${name}`, import.meta.url)));
      const audit = await auditPrivacy(bytes);
      expect(audit.format).toBeTypeOf("string");
      expect(audit.findings).toBeInstanceOf(Array);
      expect(audit.opaqueBlocks).toBeInstanceOf(Array);
      expect(audit.gaps).toBeInstanceOf(Array);
      expect(typeof audit.coverage.wholeFile).toBe("string");
      expect(audit.coverage.reasons).toBeInstanceOf(Array);
      expect(audit.reasonCodes.every((code) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
      expect(audit.findings.every((finding) => finding.target.length > 0 && finding.category.length > 0 && finding.state.length > 0)).toBe(true);
    }
  }, 120000);

  it("executes explicit raw-value, semantic, parser-limit, and bounded-output branches", async () => {
    const xmp = new Uint8Array(await readFile(new URL("./fixtures/jpeg-iptc.jpg", import.meta.url)));
    const raw = await auditPrivacy(xmp, { includeRawValues: true });
    expect(raw.findings).toBeInstanceOf(Array);
    expect(raw.findings.every((finding) => finding.rawValue === undefined || typeof JSON.stringify(finding.rawValue) === "string")).toBe(true);

    const constrained = await auditPrivacy(xmp, {
      limits: {
        ...DEFAULT_LIMITS,
        maxIptcCandidates: 1,
        maxIptcStructureDepth: 1,
        maxImageDetailRelationships: 1,
        maxWarnings: 1,
      },
    });
    expect(constrained.findings).toBeInstanceOf(Array);
    expect(constrained.coverage.wholeFile).not.toBe("complete");
    expect(constrained.gaps.length + constrained.coverage.reasons.length).toBeGreaterThan(0);
  }, 120000);
});
