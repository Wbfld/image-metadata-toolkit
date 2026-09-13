import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

test("browser T04 adapter runs the pinned official SDK and retains its complete result", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const response = await fetch("/c2pa-t04-fixture.jpg");
    const adapterModule = "/dist/c2pa-browser.js";
    const { verifyC2paInBrowser } = await import(adapterModule);
    if (!response.ok) {
      const baseResponse = await fetch("/tests/fixtures/base.jpg");
      if (!baseResponse.ok) throw new Error("The browser optional-adapter boundary fixture is unavailable.");
      const boundary = await verifyC2paInBrowser(new Uint8Array(await baseResponse.arrayBuffer()), { remoteManifestFetch: false });
      return { mode: "optional-boundary", status: boundary.status, detected: boundary.detected, verifiedBy: boundary.verifiedBy, sdk: boundary.sdk, officialResultType: boundary.officialResult === null ? "null" : typeof boundary.officialResult, diagnostics: boundary.diagnostics };
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    const wasmSrc = new URL("/node_modules/@contentauth/c2pa-web/dist/resources/c2pa_bg.wasm", location.href).toString();
    const verification = await verifyC2paInBrowser(bytes, { wasmSrc, remoteManifestFetch: false });
    return {
      mode: "official-integration",
      status: verification.status,
      detected: verification.detected,
      verifiedBy: verification.verifiedBy,
      sdk: verification.sdk,
      officialResultType: verification.officialResult === null ? "null" : typeof verification.officialResult,
      diagnostics: verification.diagnostics,
    };
  });
  if (result.mode === "optional-boundary") {
    expect(result.status).toMatch(/^adapter:(?:configuration|sdk-unavailable)$/u);
    expect(result.detected).toBe(false);
    expect(result.verifiedBy).toBe("none");
    expect(result.officialResultType).toBe("null");
    return;
  }
  expect(result.status).toMatch(/^official:(?:valid|trusted)$/u);
  expect(result.detected).toBe(true);
  expect(result.verifiedBy).toBe("official-sdk");
  expect(result.sdk).toMatchObject({ package: "@contentauth/c2pa-web", version: "0.14.6", license: "MIT" });
  expect(result.officialResultType).toBe("object");
  expect(result.diagnostics).toEqual([]);
  const evidencePath = process.env.C2PA_T04_BROWSER_RESULT;
  if (evidencePath !== undefined) await writeFile(evidencePath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
});
