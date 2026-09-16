import { expect, test } from "@playwright/test";

const W03_PROGRESSIVE_JPEG = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wgARCAACAAIDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAB//EABUBAQEAAAAAAAAAAAAAAAAAAAMF/9oADAMBAAIQAxAAAAF1Wf8A/8QAFhABAQEAAAAAAAAAAAAAAAAABAYD/9oACAEBAAEFApsAdJ7/xAAcEQEAAQQDAAAAAAAAAAAAAAABAgADBEEFITH/2gAIAQMBAT8Blx2HlSb9+1GU5dqxFV9V2u2v/8QAHBEAAgICAwAAAAAAAAAAAAAAAQIEBQADQlJh/9oACAECAQE/AbupgJZyFXQgAd+I7HzP/8QAGxAAAgIDAQAAAAAAAAAAAAAAAQMCBAAFERL/2gAIAQEABj8C1bGU0SlKkkklY6T4Gf/EABcQAQEBAQAAAAAAAAAAAAAAAAERACH/2gAIAQEAAT8hRi76i6s67//aAAwDAQACAAMAAAAQ3//EABcRAQADAAAAAAAAAAAAAAAAAAEAESH/2gAIAQMBAT8QeDrvrkBUKoqqq3P/xAAXEQEAAwAAAAAAAAAAAAAAAAABACFB/9oACAECAQE/EA3BAGAAAFAwn//EABcQAQADAAAAAAAAAAAAAAAAAAEAESH/2gAIAQEAAT8QQ/T9QUsiqrqs/9k=";

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

test("keeps CR3 and RAF detection and typed results available in browsers", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const dist = "/dist";
    const { parseMetadata } = await import(`${dist}/index.js`);
    const raf = new Uint8Array(16);
    raf.set(new TextEncoder().encode("FUJIFILMCCD-RAW "));
    const cr3 = Uint8Array.from([0, 0, 0, 16, 0x66, 0x74, 0x79, 0x70, 0x63, 0x72, 0x78, 0x20, 0, 0, 0, 0]);
    const rafResult = await parseMetadata(new Blob([raf], { type: "image/x-fuji-raf" }));
    const cr3Result = await parseMetadata(new Blob([cr3], { type: "image/x-canon-cr3" }));
    return {
      raf: { format: rafResult.format, fileKind: rafResult.fileKind, container: rafResult.container },
      cr3: { format: cr3Result.format, fileKind: cr3Result.fileKind, container: cr3Result.container },
    };
  });
  expect(result).toEqual({
    raf: { format: "raf", fileKind: "raf", container: "raf" },
    cr3: { format: "cr3", fileKind: "cr3", container: "iso-bmff" },
  });
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

test("parses standalone XMP sidecars in the browser entry point", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const dist = "/dist";
    const { parseXmpSidecar, serializeXmpSidecar } = await import(`${dist}/xmp-sidecar.js`);
    const bytes = new TextEncoder().encode('<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:ex="urn:browser-sidecar:"><rdf:Description><ex:value>&lt;safe&gt;</ex:value></rdf:Description></rdf:RDF>');
    const parsed = await parseXmpSidecar(bytes, { id: "browser.xmp" });
    const serialized = parsed.value === null ? null : await serializeXmpSidecar(parsed.value);
    return { id: parsed.source.id, complete: parsed.coverage.complete, value: parsed.value?.rdf?.properties[0]?.value, verified: serialized?.verified ?? false };
  });
  expect(result.id).toBe("browser.xmp");
  expect(result.complete).toBe(true);
  expect(result.value).toMatchObject({ kind: "literal", lexicalValue: "<safe>" });
  expect(result.verified).toBe(true);
});

test("creates and idempotently revokes browser thumbnail object URLs", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const modulePath = "/dist/browser-thumbnail.js";
    const { createThumbnailObjectUrl } = await import(modulePath);
    const handle = createThumbnailObjectUrl({ exif: { fields: [], thumbnail: { data: new Uint8Array([0xff, 0xd8, 0xff]), mimeType: "image/jpeg" } } });
    if (handle === null) return { created: false, revoked: false };
    const url = handle.url;
    handle.revoke();
    handle.revoke();
    return { created: url.startsWith("blob:"), revoked: true };
  });
  expect(result).toEqual({ created: true, revoked: true });
});

test("W03 edited baseline and progressive multi-scan JPEGs remain independently displayable", async ({ page }, testInfo) => {
  await page.goto("/");
  const result = await page.evaluate(async ({ progressive }) => {
    const modulePath = "/dist/jpeg-writer.js";
    const { rewriteJpegMetadata } = await import(modulePath);
    const packet = "<x:xmpmeta xmlns:x=\"adobe:ns:meta/\"/>";
    const cases = [
      { name: "baseline", bytes: new Uint8Array(await (await fetch("/tests/fixtures/base.jpg")).arrayBuffer()) },
      { name: "progressive-multi-scan", bytes: Uint8Array.from(atob(progressive), (character) => character.charCodeAt(0)) },
    ];
    const decoded = [];
    for (const item of cases) {
      const edited = rewriteJpegMetadata(item.bytes, { blocks: [{ op: "add", kind: "standard-xmp", data: packet }] });
      const url = URL.createObjectURL(new Blob([edited.data], { type: "image/jpeg" }));
      try {
        const image = new Image();
        image.src = url;
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error(`${item.name} JPEG was not displayable`));
        });
        decoded.push({ name: item.name, width: image.naturalWidth, height: image.naturalHeight });
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    return decoded;
  }, { progressive: W03_PROGRESSIVE_JPEG });
  expect(result).toEqual([
    { name: "baseline", width: 2, height: 2 },
    { name: "progressive-multi-scan", width: 2, height: 2 },
  ]);
  expect(testInfo.project.name).toMatch(/chromium|firefox|webkit/u);
});

test("T05 explicitly preserved MPF primary and secondary JPEGs remain independently displayable", async ({ page }, testInfo) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const dist = "/dist";
    const [{ parseMetadata }, { rewriteJpegMetadata }] = await Promise.all([
      import(`${dist}/index.js`),
      import(`${dist}/jpeg-writer.js`),
    ]);
    const source = new Uint8Array(await (await fetch("/tests/fixtures/base.jpg")).arrayBuffer());
    const concat = (...parts: Uint8Array[]): Uint8Array => {
      const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
      let offset = 0;
      for (const part of parts) { result.set(part, offset); offset += part.length; }
      return result;
    };
    const segment = (marker: number, payload: Uint8Array): Uint8Array => {
      const result = new Uint8Array(payload.length + 4);
      result.set([0xff, marker, (payload.length + 2) >>> 8, (payload.length + 2) & 0xff], 0);
      result.set(payload, 4);
      return result;
    };
    const mpfPayload = (primarySize: number, secondarySize: number): Uint8Array => {
      const tiff = new Uint8Array(82);
      tiff.set([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0], 0);
      const view = new DataView(tiff.buffer);
      view.setUint16(8, 3, true);
      const entry = (index: number, tag: number, type: number, count: number): number => {
        const offset = 10 + index * 12;
        view.setUint16(offset, tag, true);
        view.setUint16(offset + 2, type, true);
        view.setUint32(offset + 4, count, true);
        return offset + 8;
      };
      tiff.set(new TextEncoder().encode("0100"), entry(0, 0xb000, 7, 4));
      view.setUint32(entry(1, 0xb001, 4, 1), 2, true);
      view.setUint32(entry(2, 0xb002, 7, 32), 50, true);
      view.setUint32(50, 0xa0030000, true); view.setUint32(54, primarySize, true); view.setUint32(58, 0, true); view.setUint16(62, 2, true);
      view.setUint32(66, 0x40050000, true); view.setUint32(70, secondarySize, true); view.setUint32(74, primarySize - 10, true);
      return concat(new TextEncoder().encode("MPF\0"), tiff);
    };
    const secondary = source.slice();
    const markerLength = segment(0xe2, mpfPayload(0, secondary.length)).length;
    const primarySize = source.length + markerLength;
    const primary = concat(source.slice(0, 2), segment(0xe2, mpfPayload(primarySize, secondary.length)), source.slice(2));
    const input = concat(primary, secondary);
    const edited = rewriteJpegMetadata(input, { blocks: [{ op: "add", kind: "standard-xmp", data: "browser T05" }], mpf: { mode: "preserve" } });
    const parsed = await parseMetadata(edited.data, { select: { groups: ["Dimensions", "MPF"] } });
    const secondaryImage = parsed.mpf?.images[1];
    if (secondaryImage?.absoluteOffset === null || secondaryImage === undefined || secondaryImage.rangeLength === null) throw new Error("T05 browser MPF secondary range was not resolved");
    const decode = async (bytes: Uint8Array): Promise<{ width: number; height: number }> => {
      const url = URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: "image/jpeg" }));
      try {
        const image = new Image();
        image.src = url;
        await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("JPEG image decoder rejected the edited output")); });
        return { width: image.naturalWidth, height: image.naturalHeight };
      } finally { URL.revokeObjectURL(url); }
    };
    return { primary: await decode(edited.data.slice(0, parsed.mpf?.images[0]?.size ?? 0)), secondary: await decode(edited.data.slice(secondaryImage.absoluteOffset, secondaryImage.absoluteOffset + secondaryImage.size)), complete: parsed.mpf?.complete === true };
  });
  expect(result).toEqual({ primary: { width: 2, height: 2 }, secondary: { width: 2, height: 2 }, complete: true });
  expect(testInfo.project.name).toMatch(/chromium|firefox|webkit/u);
});
