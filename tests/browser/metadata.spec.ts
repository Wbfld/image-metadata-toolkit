import { expect, test } from "@playwright/test";

test("parses local File and Blob inputs without network access", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const dist = "/dist";
    const [{ parseMetadata }, bytes, pngBytes, webpBytes, tiffBytes, heifBytes, avifBytes] = await Promise.all([
      import(`${dist}/index.js`),
      fetch("/tests/fixtures/jpeg-exif-little-endian.jpg").then(async (response) => new Uint8Array(await response.arrayBuffer())),
      fetch("/tests/fixtures/png-metadata.png").then(async (response) => new Uint8Array(await response.arrayBuffer())),
      fetch("/tests/fixtures/webp-metadata.webp").then(async (response) => new Uint8Array(await response.arrayBuffer())),
      fetch("/tests/fixtures/tiff-metadata.tif").then(async (response) => new Uint8Array(await response.arrayBuffer())),
      fetch("/tests/fixtures/heif-item-metadata.heic").then(async (response) => new Uint8Array(await response.arrayBuffer())),
      fetch("/tests/fixtures/avif-idat-item-metadata.avif").then(async (response) => new Uint8Array(await response.arrayBuffer())),
    ]);
    const file = new File([bytes], "fixture.jpg", { type: "image/jpeg" });
    const full = await parseMetadata(file, { select: { groups: ["Dimensions", "EXIF"], tags: ["Make", "Orientation"] } });
    const preview = await parseMetadata(new Blob([bytes], { type: "image/jpeg" }), { scope: "jpeg-header" });
    const jpegScope = await parseMetadata(new Blob([bytes, new Uint8Array(128 * 1024)], { type: "image/jpeg" }), { scope: "metadata", select: { groups: ["Dimensions", "EXIF"], tags: ["Make"] } });
    const pngScope = await parseMetadata(new Blob([pngBytes], { type: "image/png" }), { scope: "metadata", select: { groups: ["Dimensions", "EXIF"] } });
    const webpScope = await parseMetadata(new Blob([webpBytes], { type: "image/webp" }), { scope: "metadata", select: { groups: ["Dimensions", "EXIF"] } });
    const tiffScope = await parseMetadata(new Blob([tiffBytes], { type: "image/tiff" }), { scope: "metadata", select: { groups: ["Dimensions", "XMP", "ICC"] } });
    const heifScope = await parseMetadata(new Blob([heifBytes, new Uint8Array(128 * 1024)], { type: "image/heic" }), { scope: "metadata" });
    const avifScope = await parseMetadata(new Blob([avifBytes, new Uint8Array(128 * 1024)], { type: "image/avif" }), { scope: "metadata" });
    return {
      fields: full.fields.map((field: { name: string; value: unknown }) => [field.name, field.value]),
      dimensions: full.dimensions,
      preview: preview.completeness,
      jpegScope: jpegScope.completeness,
      pngScope: pngScope.completeness,
      webpScope: webpScope.completeness,
      tiffScope: tiffScope.completeness,
      heifScope: heifScope.completeness,
      avifScope: avifScope.completeness,
    };
  });

  expect(result.dimensions).toEqual({ width: 2, height: 2 });
  expect(result.fields).toEqual(expect.arrayContaining([["Make", "OpenAI Camera"], ["Orientation", 6]]));
  expect(result.preview).toEqual({ complete: true, scope: "partial", reasons: ["JPEG scan data was intentionally not read."] });
  expect(result.jpegScope.scope).toBe("partial");
  expect(result.jpegScope.bytesRead).toBeLessThan(result.jpegScope.inputBytes);
  expect(result.pngScope.scope).toBe("partial");
  expect(result.pngScope.bytesRead).toBeLessThan(result.pngScope.inputBytes);
  expect(result.webpScope.scope).toBe("partial");
  expect(result.webpScope.bytesRead).toBeLessThan(result.webpScope.inputBytes);
  expect(result.tiffScope.scope).toBe("partial");
  expect(result.tiffScope.bytesRead).toBeLessThan(result.tiffScope.inputBytes);
  expect(result.heifScope.scope).toBe("partial");
  expect(result.heifScope.bytesRead).toBeLessThan(result.heifScope.inputBytes);
  expect(result.avifScope.scope).toBe("partial");
  expect(result.avifScope.bytesRead).toBeLessThan(result.avifScope.inputBytes);
});

test("uses the module-worker client and honors an aborted request", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const dist = "/dist";
    const [{ createMetadataWorkerClient }, { parseMetadata }, bytes] = await Promise.all([
      import(`${dist}/worker.js`),
      import(`${dist}/index.js`),
      fetch("/tests/fixtures/jpeg-exif-little-endian.jpg").then(async (response) => new Uint8Array(await response.arrayBuffer())),
    ]);
    const worker = new Worker("/tests/browser/metadata-worker.mjs", { type: "module" });
    const client = createMetadataWorkerClient(worker);
    const parsed = await client.parse(bytes.buffer);
    client.close();
    worker.terminate();

    const controller = new AbortController();
    controller.abort();
    let abortCode = "";
    try {
      await parseMetadata(bytes, { signal: controller.signal });
    } catch (error) {
      abortCode = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
    }
    return { format: parsed.format, width: parsed.dimensions?.width, abortCode };
  });

  expect(result).toEqual({ format: "jpeg", width: 2, abortCode: "ABORTED" });
});
