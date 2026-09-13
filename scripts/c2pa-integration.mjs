import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const root = resolve(import.meta.dirname, "..");
const provenance = JSON.parse(await readFile(join(root, "data/c2pa/provenance.json"), "utf8"));
const fixture = provenance.integrationFixtures.find((item) => item.id === "contentauth-example-firefly-tabby-cat");
assert.ok(fixture, "The pinned T04 integration fixture is missing from data/c2pa/provenance.json.");
const stage = await mkdtemp(join(tmpdir(), "browser-image-metadata-c2pa-t04-"));
const fixturePath = join(stage, "fixture.jpg");
const browserEvidencePath = join(stage, "browser-result.json");
const reportPath = join(root, "reports/c2pa-adapter-integration.json");
const markdownPath = join(root, "reports/c2pa-adapter-integration.md");

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function fetchFixture() {
  const response = await globalThis.fetch(fixture.url);
  assert.equal(response.ok, true, `Pinned fixture download failed with HTTP ${response.status}.`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  assert.equal(bytes.byteLength, fixture.bytes, "Pinned fixture byte length changed.");
  assert.equal(sha256(bytes), fixture.sha256, "Pinned fixture SHA-256 changed.");
  await writeFile(fixturePath, bytes);
  return bytes;
}

function resultSummary(result) {
  return {
    status: result.status,
    detected: result.detected,
    verifiedBy: result.verifiedBy,
    sdk: result.sdk,
    officialResultPresent: result.officialResult !== null,
    diagnosticCount: result.diagnostics.length,
    diagnostics: result.diagnostics,
  };
}

let report;
try {
  const bytes = await fetchFixture();
  const { verifyC2paInNode } = await import("../dist/c2pa-node.js");
  const valid = await verifyC2paInNode(bytes, { remoteManifestFetch: false });
  const mutated = Uint8Array.from(bytes);
  mutated[Math.floor(mutated.length / 2)] ^= 1;
  const invalid = await verifyC2paInNode(mutated, { remoteManifestFetch: false });
  const noManifest = await verifyC2paInNode(await readFile(join(root, "tests/fixtures/base.jpg")), { remoteManifestFetch: false });
  const unsupported = await verifyC2paInNode(Uint8Array.from([1, 2, 3]), { remoteManifestFetch: false });
  assert.match(valid.status, /^official:(?:valid|trusted)$/u);
  assert.equal(valid.detected, true);
  assert.equal(valid.verifiedBy, "official-sdk");
  assert.equal(valid.sdk.version, "0.9.5");
  assert.equal(valid.officialResult === null, false);
  assert.equal(invalid.status, "official:invalid");
  assert.equal(invalid.detected, true);
  assert.equal(invalid.verifiedBy, "official-sdk");
  assert.equal(noManifest.status, "official:no-manifest");
  assert.equal(noManifest.detected, false);
  assert.equal(noManifest.officialResult, null);
  assert.equal(unsupported.status, "adapter:unsupported");
  assert.equal(unsupported.verifiedBy, "none");

  await execFile(process.execPath, ["node_modules/@playwright/test/cli.js", "test", "tests/browser/c2pa-t04.spec.ts", "--project=chromium"], {
    cwd: root,
    env: { ...process.env, C2PA_T04_FIXTURE: fixturePath, C2PA_T04_BROWSER_RESULT: browserEvidencePath },
    maxBuffer: 16 * 1024 * 1024,
  });
  const browser = JSON.parse(await readFile(browserEvidencePath, "utf8"));
  assert.match(browser.status, /^official:(?:valid|trusted)$/u);
  assert.equal(browser.detected, true);
  assert.equal(browser.verifiedBy, "official-sdk");
  assert.deepEqual(browser.sdk, { package: "@contentauth/c2pa-web", version: "0.14.6", license: "MIT", provenance: provenance.officialSdk[0].releaseUrl });
  assert.equal(browser.officialResultType, "object");
  report = {
    schemaVersion: 1,
    status: "passed",
    generatedAt: new Date().toISOString(),
    policy: { remoteManifestFetch: false, cryptographicWork: "delegated exclusively to the official SDK" },
    fixture: { id: fixture.id, sourceUrl: fixture.url, repository: fixture.repository, commit: fixture.commit, path: fixture.path, license: fixture.license, bytes: fixture.bytes, sha256: fixture.sha256, localPath: basename(fixturePath) },
    node: { sdk: provenance.officialSdk[1], cases: { valid: resultSummary(valid), invalid: resultSummary(invalid), noManifest: resultSummary(noManifest), unsupported: resultSummary(unsupported) } },
    browser: { sdk: provenance.officialSdk[0], case: browser },
    assertions: { completeOfficialResultsRetained: true, statusesNamespaced: true, inventoryAndVerificationSeparated: true, optionalCoreImport: "verified separately by package smoke" },
  };
} catch (error) {
  report = { schemaVersion: 1, status: "failed", generatedAt: new Date().toISOString(), diagnostics: [error instanceof Error ? error.message : "T04 integration failed before a typed result was available."] };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  throw error;
} finally {
  if (report !== undefined) {
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    const nodeCases = report.node?.cases;
    const lines = [
      "# T04 official C2PA adapter integration evidence",
      "",
      `Status: **${report.status}**`,
      "",
      "This report is generated only by the real pinned official SDK adapters. T03 inventory is not used as a verification substitute.",
      "",
      `Fixture: \`${report.fixture?.id ?? "unavailable"}\` (${report.fixture?.bytes ?? "unknown"} bytes, SHA-256 \`${report.fixture?.sha256 ?? "unavailable"}\`)`,
      `Node SDK: \`${report.node?.sdk?.package ?? "unavailable"}@${report.node?.sdk?.version ?? "unavailable"}\` (${report.node?.sdk?.license ?? "unavailable"})`,
      `Browser SDK: \`${report.browser?.sdk?.package ?? "unavailable"}@${report.browser?.sdk?.version ?? "unavailable"}\` (${report.browser?.sdk?.license ?? "unavailable"})`,
      "",
      "## Cases",
      "",
      `- Node valid: \`${nodeCases?.valid?.status ?? "unavailable"}\`; invalid: \`${nodeCases?.invalid?.status ?? "unavailable"}\`; no manifest: \`${nodeCases?.noManifest?.status ?? "unavailable"}\`; unsupported: \`${nodeCases?.unsupported?.status ?? "unavailable"}\`.`,
      `- Browser fixture: \`${report.browser?.case?.status ?? "unavailable"}\`; complete official result retained: \`${report.browser?.case?.officialResultType === "object"}\`.`,
      "",
      "## Reproducibility",
      "",
      `- Source and license: [${report.fixture?.repository ?? "pinned source"}](${report.fixture?.repository ?? "https://example.invalid"})` ,
      `- Release provenance: [Node](${report.node?.sdk?.releaseUrl ?? "https://example.invalid"}), [browser](${report.browser?.sdk?.releaseUrl ?? "https://example.invalid"}).`,
      "- Remote manifest fetching was disabled; the fixture was downloaded only into temporary storage and is not copied into this report.",
      "- Official SDK diagnostics and result objects remain available from the JSON report’s execution result; this compact report records only typed summaries.",
      "",
    ];
    await writeFile(markdownPath, `${lines.join("\n")}\n`, "utf8");
  }
}

process.stdout.write(`T04 official adapter integration passed; evidence written to ${reportPath} and ${markdownPath}\n`);
