import { expect, test } from "@playwright/test";
import path from "node:path";

test("R02 registry pages load generated entries and filter with keyboard-accessible search", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  const response = await page.goto("/docs-site/registry-exif.html");
  expect(response?.headers()["content-security-policy"]).toContain("connect-src 'none'");
  await expect(page.locator("#source-provenance")).toContainText("sha256=");
  await expect(page.locator("#result-count")).toContainText("165");
  const search = page.locator("#registry-search"); await search.fill("GPSLatitude");
  await expect(page.locator("#result-count")).toContainText("1");
  await expect(page.locator("#registry-list")).toContainText("GPSLatitude");
  await search.press("Tab"); await expect(page.locator("#clear-search")).toBeFocused();
  expect(requests.every((url) => url.startsWith("http://127.0.0.1:4173/"))).toBe(true);
});

test("R02 playground inspects a local file and renders bounded results without network access", async ({ page }) => {
  const requests: string[] = []; page.on("request", (request) => requests.push(request.url()));
  const response = await page.goto("/docs-site/playground.html");
  expect(response?.headers()["content-security-policy"]).toContain("connect-src 'none'");
  await page.locator("#image-file").setInputFiles(path.join(process.cwd(), "tests/fixtures/jpeg-exif-little-endian.jpg"));
  await expect(page.locator("#playground-status")).toContainText("JPEG inspected locally", { timeout: 10_000 });
  await expect(page.locator("#fields")).toContainText("OpenAI Camera");
  await expect(page.locator("#coverage")).toContainText("completeness");
  await expect(page.locator("#privacy")).toContainText("location");
  await expect(page.locator("label[for=image-file]")).toHaveText("Image file");
  expect(requests.every((url) => url.startsWith("http://127.0.0.1:4173/"))).toBe(true);
});

test("R02 keeps fetch demonstration separate and visibly network-enabled by policy", async ({ page }) => {
  const response = await page.goto("/docs-site/fetch-demo.html");
  expect(response?.headers()["content-security-policy"]).toContain("connect-src 'self' https:");
  await expect(page.locator("h1")).toHaveText("Separate fetch demonstration");
  await expect(page.locator(".warning")).toContainText("intentionally separate");
});
