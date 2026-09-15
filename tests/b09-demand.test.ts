import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const reportUrl = new URL("../reports/b09-demand-decision.json", import.meta.url);
type Gate = { status: string };
type Candidate = {
  id: string;
  decision: string;
  gates: {
    namedWorkflow: Gate;
    lawfulConformanceFixtures: Gate;
    boundedSecurityModel: Gate;
    maintenanceOwner: Gate;
  };
};

describe("B09 demand gate", () => {
  it("retains a deterministic selection only for the fully evidenced SVG candidate", async () => {
    const report = JSON.parse(await readFile(reportUrl, "utf8")) as {
      schema: string;
      ticket: string;
      decisionStatus: string;
      candidates: Candidate[];
      selectedCandidate: string | null;
      qualifyingCandidates: string[];
    };
    expect(report.schema).toBe("browser-image-metadata.b09-demand-decision.v1");
    expect(report.ticket).toBe("B09");
    expect(report.decisionStatus).toBe("selected-svg-metadata");
    expect(report.candidates.map((candidate) => candidate.id)).toEqual(["bmp", "ico", "jpeg-xr", "svg-metadata", "camera-sidecar-xmp"]);
    const svg = report.candidates.find((candidate) => candidate.id === "svg-metadata");
    expect(svg?.decision).toBe("selected");
    expect(svg === undefined ? false : Object.values(svg.gates).every((gate) => gate.status === "proven")).toBe(true);
    expect(report.candidates.filter((candidate) => candidate.id !== "svg-metadata").every((candidate) => candidate.decision === "not-selected")).toBe(true);
    expect(report.selectedCandidate).toBe("svg-metadata");
    expect(report.qualifyingCandidates).toEqual(["svg-metadata"]);
  });

  it("does not convert external sidecar demand into unsupported ownership or fixture claims", async () => {
    const report = JSON.parse(await readFile(reportUrl, "utf8")) as {
      candidates: Candidate[];
      demandEvidence: Array<{ url: string; retrievedAt: string }>;
    };
    const sidecar = report.candidates.find((candidate) => candidate.id === "camera-sidecar-xmp");
    expect(sidecar).toBeDefined();
    if (sidecar === undefined) return;
    expect(sidecar.gates.namedWorkflow.status).toBe("proven");
    expect(sidecar.gates.lawfulConformanceFixtures.status).toBe("absent");
    expect(sidecar.gates.maintenanceOwner.status).toBe("proven");
    expect(report.demandEvidence.length).toBeGreaterThanOrEqual(3);
    for (const evidence of report.demandEvidence) {
      expect(new URL(evidence.url).protocol).toBe("https:");
      expect(evidence.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
    }
  });
});
