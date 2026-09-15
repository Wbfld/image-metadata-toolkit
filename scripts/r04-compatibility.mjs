import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import * as toolkit from "../dist/index.js";
import { assertEvidenceEquals, createCompatibilityReport, renderCompatibilityMarkdown, stableJson } from "./r04-compatibility-lib.mjs";

const root = resolve(import.meta.dirname, "..");
const check = process.argv.slice(2).includes("--check");
const report = await createCompatibilityReport({ root, toolkit });
const json = stableJson(report);
const markdown = renderCompatibilityMarkdown(report);
const jsonPath = resolve(root, "reports/r04-compatibility.json");
const markdownPath = resolve(root, "reports/r04-compatibility.md");

if (check) {
  assertEvidenceEquals("JSON compatibility evidence", await readFile(jsonPath, "utf8"), json);
  assertEvidenceEquals("Markdown compatibility evidence", await readFile(markdownPath, "utf8"), markdown);
  process.stdout.write("R04 compatibility evidence verified.\n");
} else {
  await writeFile(jsonPath, json);
  await writeFile(markdownPath, markdown);
  process.stdout.write("R04 compatibility evidence written.\n");
}
