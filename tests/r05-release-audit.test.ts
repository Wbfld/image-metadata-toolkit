import { describe, expect, it } from "vitest";

import {
  REQUIRED_AUDIT_CHECKS,
  evaluateReleaseGate,
  validateReport,
} from "../scripts/r05-release-audit.mjs";

function checks(status = "passed"): Array<{ id: string; status: string; reason?: string }> {
  return REQUIRED_AUDIT_CHECKS.map((id) => ({ id, status }));
}

describe("R05 release audit gate", () => {
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

  it("rejects a report that claims pass without external review", () => {
    const report = {
      schema: "browser-image-metadata/r05-release-audit@1",
      checks: checks(),
      gate: { passed: true, automatedPassed: true, externalReview: "blocked" },
    };
    expect(() => validateReport(report)).toThrow(/external review/iu);
  });

  it("requires the complete check inventory in retained evidence", () => {
    const report = {
      schema: "browser-image-metadata/r05-release-audit@1",
      checks: checks().slice(1),
      gate: { passed: false, automatedPassed: false, externalReview: "blocked" },
    };
    expect(() => validateReport(report)).toThrow(/clean-clone/iu);
  });
});
