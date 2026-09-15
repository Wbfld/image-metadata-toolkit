import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");

describe("G04 launch packet", () => {
  it("retains executed evidence for every required workflow", async () => {
    const report = JSON.parse(await readFile(join(root, "reports/g04-launch-evidence.json"), "utf8")) as {
      status: string;
      reportVersion: string;
      demos: { metadataRemoval: { preservationStatus: string; protectedPayloadMismatches: number; gpsRemoved: boolean; iccComplete: boolean }; largeImageMetadataRanges: { inputBytes: number; bytesRead: number; fullMaterializationRequested: boolean }; standardsInspection: { ai2025PropertyCount: number; decodedPropertyCount: number }; protectedMetadataRefusal: { c2pa: { refused: boolean; atomic: boolean }; ultraHdr: { refused: boolean; atomic: boolean } } };
      publication: { externalPublicationPerformed: boolean };
      artifacts: readonly { sha256: string }[];
    };
    expect(report.status).toBe("passed");
    expect(report.reportVersion).toBe("g04-launch-audit/1");
    expect(report.demos.metadataRemoval.preservationStatus).toBe("passed");
    expect(report.demos.metadataRemoval.protectedPayloadMismatches).toBe(0);
    expect(report.demos.metadataRemoval.gpsRemoved).toBe(true);
    expect(report.demos.metadataRemoval.iccComplete).toBe(true);
    expect(report.demos.largeImageMetadataRanges.inputBytes).toBe(200 * 1024 * 1024);
    expect(report.demos.largeImageMetadataRanges.bytesRead).toBeLessThan(report.demos.largeImageMetadataRanges.inputBytes);
    expect(report.demos.largeImageMetadataRanges.fullMaterializationRequested).toBe(false);
    expect(report.demos.standardsInspection.decodedPropertyCount).toBeGreaterThanOrEqual(4);
    expect(report.demos.standardsInspection.ai2025PropertyCount).toBeGreaterThanOrEqual(4);
    expect(report.demos.protectedMetadataRefusal.c2pa).toEqual({ refused: true, atomic: true });
    expect(report.demos.protectedMetadataRefusal.ultraHdr).toEqual({ refused: true, atomic: true });
    expect(report.publication.externalPublicationPerformed).toBe(false);
    expect(report.artifacts.every((artifact) => /^[a-f0-9]{64}$/u.test(artifact.sha256))).toBe(true);
  });

  it("keeps launch claims explicit and redistribution-safe", async () => {
    const json = await readFile(join(root, "reports/g04-launch-evidence.json"), "utf8");
    const markdown = await readFile(join(root, "reports/g04-launch-evidence.md"), "utf8");
    expect(json).not.toContain("creator prompt");
    expect(json).not.toContain("remote");
    expect(markdown).toContain("ready-for-operator-publication");
    expect(markdown).toContain("No image bytes are retained");
  });
});

