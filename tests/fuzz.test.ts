import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { parseMetadata, redactMetadata } from "../src/index.js";

const MAX_INPUT_BYTES = 64 * 1024;

describe("malformed input properties", () => {
  it("keeps random inputs bounded and returns a stable public result", async () => {
    await fc.assert(
      fc.asyncProperty(fc.uint8Array({ maxLength: MAX_INPUT_BYTES }), async (input) => {
        const parsed = await parseMetadata(input, { limits: { maxInputBytes: MAX_INPUT_BYTES, maxWarnings: 8 } });
        expect(parsed.warnings.length).toBeLessThanOrEqual(8);
        expect(parsed.fields.length).toBeLessThanOrEqual(4_096);

        const redacted = await redactMetadata(input, {
          remove: ["AllMetadata"],
          limits: { maxInputBytes: MAX_INPUT_BYTES, maxWarnings: 8 },
        });
        expect(redacted.data.byteLength).toBeLessThanOrEqual(input.byteLength);
        expect(redacted.warnings.length).toBeLessThanOrEqual(8);
      }),
      { numRuns: 250, interruptAfterTimeLimit: 10_000 },
    );
  });

  it("handles truncation and arbitrary byte mutations of recognized containers", async () => {
    const seeds = await Promise.all([
      import("node:fs/promises").then(({ readFile }) => readFile(new URL("./fixtures/jpeg-exif-little-endian.jpg", import.meta.url))),
      import("node:fs/promises").then(({ readFile }) => readFile(new URL("./fixtures/png-metadata.png", import.meta.url))),
      import("node:fs/promises").then(({ readFile }) => readFile(new URL("./fixtures/webp-metadata.webp", import.meta.url))),
      import("node:fs/promises").then(({ readFile }) => readFile(new URL("./fixtures/avif-metadata.avif", import.meta.url))),
    ]);

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: seeds.length - 1 }),
        fc.integer({ min: 0, max: MAX_INPUT_BYTES }),
        fc.array(fc.tuple(fc.nat({ max: MAX_INPUT_BYTES - 1 }), fc.integer({ min: 0, max: 255 })), { maxLength: 32 }),
        async (seedIndex, requestedLength, mutations) => {
          const seed = seeds[seedIndex] ?? new Uint8Array();
          const length = Math.min(seed.byteLength, requestedLength);
          const input = new Uint8Array(seed.subarray(0, length));
          for (const [offset, value] of mutations) {
            if (input.byteLength > 0) input[offset % input.byteLength] = value;
          }
          const result = await parseMetadata(input, { limits: { maxInputBytes: MAX_INPUT_BYTES, maxWarnings: 8 } });
          expect(result.warnings.length).toBeLessThanOrEqual(8);
        },
      ),
      { numRuns: 250, interruptAfterTimeLimit: 10_000 },
    );
  });
});
