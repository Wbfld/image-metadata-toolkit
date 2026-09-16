import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourceFiles = [
  "src/trust/jumbf.ts",
  "src/index.ts",
  "README.md",
  "API.md",
  "CAPABILITIES.md",
  "CHANGELOG.md",
  "T03_C2PA_INVENTORY.md",
  "T03_C2PA_TERMINOLOGY_REVIEW.md",
  "tests/trust-t03.test.ts",
  "tests/trust-t04.test.ts",
  "scripts/c2pa-integration.mjs",
];
const reviewPath = resolve(root, "T03_C2PA_TERMINOLOGY_REVIEW.md");
const jsonPath = resolve(root, "reports/c2pa-terminology-audit.json");
const markdownPath = resolve(root, "reports/c2pa-terminology-audit.md");
const forbiddenPublicInventoryTerms = /\b(?:valid|verified|trusted|authentic)\b/iu;
const requiredReviewStatements = [
  "This is an implementation audit packet, not human approval.",
  "`inventoryC2pa`",
  "`inventoryJumbfC2pa`",
  "`detected`",
  "`inventoried`",
  "T04 adapters",
  "human reviewer must still approve",
];

const inventoryReference = /(?:inventoryC2pa|inventoryJumbfC2pa|C2paInventory|T03[^\n]*C2PA|C2PA[^\n]*(?:inventory|inventor))/iu;
const explicitSeparation = /(?:not|never|without|separate|pending|structurally|T04|official SDK|inventory-only|inventory only)/iu;

const sourceResults = [];
for (const relative of sourceFiles) {
  const content = await readFile(resolve(root, relative), "utf8");
  const reviewedLines = content.split("\n").flatMap((line, index) => inventoryReference.test(line) ? [{ line: index + 1, text: line }] : []);
  const violations = reviewedLines.filter(({ text: line }) => forbiddenPublicInventoryTerms.test(line) && !explicitSeparation.test(line));
  assert.equal(violations.length, 0, `${relative} uses verification terminology in a T03 inventory statement: ${violations.map(({ line }) => line).join(", ")}`);
  sourceResults.push({ file: relative, reviewedStatements: reviewedLines.length, forbiddenTerms: 0, classified: reviewedLines.length > 0 });
}

const review = await readFile(reviewPath, "utf8");
for (const statement of requiredReviewStatements) assert.ok(review.includes(statement), `T03 terminology packet is missing: ${statement}`);

const report = {
  schema: "c2pa-terminology-audit-1",
  checkedAt: new Date().toISOString(),
  policy: "T03 inventory APIs may use detected/inventoried/present; official verification terminology is reserved for T04 adapters.",
  sourceResults,
  reviewPacket: { path: "T03_C2PA_TERMINOLOGY_REVIEW.md", requiredStatements: requiredReviewStatements, humanApproval: "pending" },
  passed: true,
};
await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await writeFile(markdownPath, [
  "# C2PA terminology audit",
  "",
  "This executable audit checks the public T03 inventory source, documentation, tests, and integration scripts for verification-state terms and checks that the retained review packet distinguishes T03 inventory from T04 official verification and from the pending human approval gate.",
  "",
  `- Schema: \`${report.schema}\``,
  `- Checked: \`${report.checkedAt}\``,
  `- T03-related statements reviewed: ${sourceResults.reduce((total, entry) => total + entry.reviewedStatements, 0)}`,
  "- T03 public inventory verification-state terms: 0",
  "- Human terminology approval: pending",
  "- Result: passed",
  "",
  "## Checked source surfaces",
  "",
  ...sourceResults.map((entry) => `- \`${entry.file}\`: ${entry.reviewedStatements} public inventory lines checked; forbidden terms: ${entry.forbiddenTerms}`),
  "",
  "The JSON artifact is redistribution-safe and contains no image or profile payload.",
  "",
].join("\n"), "utf8");
process.stdout.write(`C2PA terminology audit passed; report: ${jsonPath}\n`);
