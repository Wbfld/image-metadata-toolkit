import { describe, expect, it } from "vitest";

import {
  REQUIRED_AUDIT_CHECKS,
  REQUIRED_EXTERNAL_WRITER_SCOPE,
  REPORT_SCHEMA,
  evaluateReleaseGate,
  expectedDistTag,
  packageLicenseAudit,
  packageProvenanceAudit,
  validateExternalReviewRecord,
  validateReport,
} from "../scripts/r05-release-audit.mjs";

function checks(status = "passed"): Array<{ id: string; status: string; reason?: string }> {
  return REQUIRED_AUDIT_CHECKS.map((id) => ({ id, status }));
}

describe("R05 release audit gate", () => {
  it("derives a prerelease dist-tag without assigning alpha candidates to latest", () => {
    expect(expectedDistTag("2.0.0-alpha.3")).toBe("alpha");
    expect(expectedDistTag("2.0.0")).toBe("latest");
  });

  it("requires every machine-verifiable check and an external review", () => {
    const gate = evaluateReleaseGate({
      checks: checks(),
      externalReview: { status: "blocked", reason: "review pending" },
      publication: { status: "blocked" },
    });
    expect(gate.automatedPassed).toBe(true);
    expect(gate.passed).toBe(false);
    expect(gate.externalReview).toBe("blocked");
  });

  it("does not treat unavailable or failed checks as evidence", () => {
    const actual = checks();
    actual[0] = { id: "clean-clone", status: "unavailable", reason: "no clean candidate" };
    const gate = evaluateReleaseGate({
      checks: actual,
      externalReview: { status: "passed" },
      publication: { status: "blocked" },
    });
    expect(gate.automatedPassed).toBe(false);
    expect(gate.passed).toBe(false);
    expect(gate.failedChecks).toContainEqual(expect.objectContaining({ id: "clean-clone", status: "unavailable" }));
  });

  it("allows the prepublication gate to leave registry provenance pending", () => {
    const gate = evaluateReleaseGate({
      phase: "prepublication",
      checks: checks(),
      externalReview: { status: "passed" },
      publication: { status: "pending" },
    });
    expect(gate.phase).toBe("prepublication");
    expect(gate.automatedPassed).toBe(true);
    expect(gate.passed).toBe(true);
  });

  it("requires completed registry evidence in the postpublication phase", () => {
    const blocked = evaluateReleaseGate({
      phase: "postpublication",
      checks: checks(),
      externalReview: { status: "passed" },
      publication: { status: "pending" },
    });
    expect(blocked.passed).toBe(false);
    expect(blocked.failures.join(" ")).toMatch(/postpublication publication gate/iu);

    const passed = evaluateReleaseGate({
      phase: "postpublication",
      checks: checks(),
      externalReview: { status: "passed" },
      publication: { status: "passed" },
    });
    expect(passed.passed).toBe(true);
  });

  it("rejects a report that claims pass without external review", () => {
    const report = {
      schema: REPORT_SCHEMA,
      phase: "prepublication",
      checks: checks(),
      gate: { phase: "prepublication", passed: true, automatedPassed: true, externalReview: "blocked" },
    };
    expect(() => validateReport(report)).toThrow(/external review/iu);
  });

  it("requires the complete check inventory in retained evidence", () => {
    const report = {
      schema: REPORT_SCHEMA,
      checks: checks().slice(1),
      phase: "prepublication",
      gate: { phase: "prepublication", passed: false, automatedPassed: false, externalReview: "blocked" },
    };
    expect(() => validateReport(report)).toThrow(/clean-clone/iu);
  });

  it("resolves the documented buffers license provenance against the lockfile", async () => {
    const result = await packageLicenseAudit();
    expect(result.status).toBe("passed");
    expect(result.provenanceFailures).toEqual([]);
    expect(result.missingLicenses).toEqual([]);
    const packages = result.packages as Array<{ name?: unknown; license?: unknown; licenseSource?: unknown }>;
    const buffers = packages.find((item) => item.name === "buffers");
    expect(buffers?.license).toBe("MIT");
    expect(buffers?.licenseSource).toBe("data/dependency-license-provenance.json#buffers@0.1.1");
  });

  it("rejects an unstructured or incomplete external review record", () => {
    const failures = validateExternalReviewRecord({
      schema: "browser-image-metadata/r05-external-review@1",
      reviewer: { identity: "Reviewer", independent: true },
      revision: { commit: "f".repeat(40) },
      scope: { tiffOffsetHandling: true, writerCoverage: REQUIRED_EXTERNAL_WRITER_SCOPE },
      findings: [{ id: "finding-1", severity: "low", affectedFiles: ["src/tiff.ts"], description: "Observed condition.", disposition: "accepted with documented limitation." }],
      reviewedAt: "2026-09-16",
      approval: { status: "pending", date: "2026-09-16" },
      conclusion: "Not approved.",
    });
    expect(failures).toContain("review approval is not recorded as approved");
  });

  it("passes local package inspection while explicitly deferring registry provenance", async () => {
    const result = await packageProvenanceAudit("prepublication");
    expect(result.status).toBe("passed");
    expect(result.phase).toBe("prepublication");
    expect(result.registryProvenance).toEqual(expect.objectContaining({ status: "pending" }));
  }, 120_000);
});
