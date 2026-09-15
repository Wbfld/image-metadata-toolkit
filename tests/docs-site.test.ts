import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const site = join(process.cwd(), "docs-site");
const data = JSON.parse(readFileSync(join(site, "generated/site-data.json"), "utf8")) as { exif: unknown[]; iptc: unknown[]; xmp: unknown[]; icc: unknown[]; policies: unknown[]; selectors: unknown[]; capabilities: unknown[]; formats: unknown[]; generatedFrom: { registry: { sha256: string } } };

describe("R02 generated documentation site", () => {
  it("contains deterministic source-derived registry coverage", () => {
    expect(data.exif.length).toBe(165);
    expect(data.iptc.length).toBeGreaterThan(66);
    expect(data.xmp.length).toBe(66);
    expect(data.icc.length).toBeGreaterThan(0);
    expect(data.policies).toHaveLength(7);
    expect(data.selectors).toHaveLength(7);
    expect(data.capabilities.length).toBeGreaterThan(0);
    expect(data.formats.length).toBeGreaterThan(0);
    expect(data.generatedFrom.registry.sha256).toMatch(/^[a-f0-9]{64}$/u);
    expect(data.exif.every((entry) => typeof (entry as { id?: unknown }).id === "string")).toBe(true);
    expect(data.iptc.every((entry) => typeof (entry as { id?: unknown }).id === "string")).toBe(true);
    expect(data.xmp.every((entry) => typeof (entry as { namespaceUri?: unknown; localName?: unknown }).namespaceUri === "string" && typeof (entry as { localName?: unknown }).localName === "string")).toBe(true);
  });

  it("keeps every site page local and CSP-protected", () => {
    for (const name of ["index", "registry", "registry-exif", "registry-iptc", "registry-xmp", "registry-icc", "registry-policies", "registry-selectors", "registry-capabilities", "registry-formats", "playground", "fetch-demo", "recipes"]) {
      const html = readFileSync(join(site, `${name}.html`), "utf8");
      expect(html).toContain("Content-Security-Policy");
      expect(html).not.toMatch(/(?:src|href)=["'](?:https?:|\/\/)/u);
    }
    expect(readFileSync(join(site, "registry-page.html"), "utf8")).toContain("source-provenance");
  });

  it("uses safe text sinks for untrusted playground values", () => {
    const source = readFileSync(join(site, "playground.js"), "utf8");
    expect(source).not.toContain("innerHTML");
    expect(source).not.toContain("document.write");
    expect(source).toContain("textContent");
  });
});
