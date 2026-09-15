import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const reportPath = resolve(root, "reports/b09-demand-decision.json");
const report = JSON.parse(await readFile(reportPath, "utf8"));

const REQUIRED_GATES = ["namedWorkflow", "lawfulConformanceFixtures", "boundedSecurityModel", "maintenanceOwner"];
const CANDIDATE_IDS = ["bmp", "ico", "jpeg-xr", "svg-metadata", "camera-sidecar-xmp"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u;

function fail(message) {
  throw new Error(`B09 demand decision is invalid: ${message}`);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

assert(report.schema === "browser-image-metadata.b09-demand-decision.v1", "unexpected schema");
assert(report.ticket === "B09", "ticket must be B09");
assert(report.decisionStatus === "selected-svg-metadata", "the checked decision must retain the reviewed SVG selection");
assert(ISO_DATE.test(report.generatedAt), "generatedAt must be an ISO calendar date");
assert(Array.isArray(report.candidates), "candidates must be an array");
assert(report.candidates.length === CANDIDATE_IDS.length, "every roadmap candidate must be evaluated exactly once");
assert(JSON.stringify(report.candidates.map((candidate) => candidate.id)) === JSON.stringify(CANDIDATE_IDS), "candidate inventory or deterministic order changed");
assert(report.selectedCandidate === "svg-metadata", "the selected candidate must be bounded SVG metadata");
assert(Array.isArray(report.qualifyingCandidates) && JSON.stringify(report.qualifyingCandidates) === JSON.stringify(["svg-metadata"]), "SVG must be the sole qualifying candidate");
assert(Array.isArray(report.blockingGates) && report.blockingGates.length === 0, "a selected decision cannot retain blocking gates");

const evidenceIds = new Set([
  ...(Array.isArray(report.demandEvidence) ? report.demandEvidence.map((item) => item.id) : []),
  ...(Array.isArray(report.internalEvidence) ? report.internalEvidence.map((item) => item.id) : []),
]);
assert(evidenceIds.size > 0, "evidence inventory is empty");
for (const evidence of [...(report.demandEvidence ?? []), ...(report.internalEvidence ?? [])]) {
  assert(typeof evidence.id === "string" && evidence.id.length > 0, "evidence has no stable ID");
  assert(typeof evidence.retrievedAt === "string" && ISO_DATE.test(evidence.retrievedAt), `evidence ${evidence.id} has no retrieval date`);
  assert(typeof evidence.observation === "string" && evidence.observation.length > 0, `evidence ${evidence.id} has no observation`);
  if (typeof evidence.url === "string") {
    const url = new URL(evidence.url);
    assert(url.protocol === "https:", `evidence ${evidence.id} must use HTTPS`);
  }
}

for (const candidate of report.candidates) {
  assert(typeof candidate.name === "string" && candidate.name.length > 0, `${candidate.id} has no name`);
  assert(["selected", "not-selected"].includes(candidate.decision), `${candidate.id} has an invalid decision`);
  assert(candidate.gates !== null && typeof candidate.gates === "object", `${candidate.id} has no gate set`);
  for (const gate of REQUIRED_GATES) {
    const value = candidate.gates[gate];
    assert(value !== null && typeof value === "object", `${candidate.id} is missing ${gate}`);
    assert(["proven", "proven-existing-model-not-yet-sidecar-project", "absent"].includes(value.status), `${candidate.id}.${gate} has an invalid status`);
    assert(Array.isArray(value.evidenceIds), `${candidate.id}.${gate} evidenceIds must be an array`);
    for (const evidenceId of value.evidenceIds) assert(evidenceIds.has(evidenceId), `${candidate.id}.${gate} references unknown evidence ${evidenceId}`);
    if (value.status === "absent") assert(typeof value.reason === "string" || candidate.id !== "camera-sidecar-xmp", `${candidate.id}.${gate} must explain an absent sidecar gate`);
  }
  const allProven = REQUIRED_GATES.every((gate) => ["proven", "proven-existing-model-not-yet-sidecar-project"].includes(candidate.gates[gate].status));
  if (candidate.id === "svg-metadata") {
    assert(candidate.decision === "selected" && allProven, "SVG must be selected only with all B09 gates proven");
  } else assert(candidate.decision === "not-selected" && !allProven, `${candidate.id} cannot qualify for the scoped B09 selection`);
}

assert(report.repository.issueCount === 0, "the retained zero-issue repository audit changed; refresh the decision before accepting it");
assert(report.repository.governanceMaintenanceOwner === "WBLFD", "the governance maintenance owner must be the recorded B09 owner");
assert(report.repository.governanceMaintenanceOwnerStatus === "proven", "governance owner status must remain explicit");
assert(report.nextAction.startsWith("B09 is complete"), "selected decision must record B09 completion");

console.log(`B09 demand gate verified: ${report.candidates.length} candidates evaluated; bounded SVG metadata is the sole qualifying candidate.`);
