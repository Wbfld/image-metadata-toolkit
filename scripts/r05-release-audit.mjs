import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const root = resolve(import.meta.dirname, "..");
const execFile = promisify(execFileCallback);
const REPORT_SCHEMA = "browser-image-metadata/r05-release-audit@2";
const DEFAULT_REPORT_DIRECTORY = "reports";
const MAX_OUTPUT = 32 * 1024 * 1024;
const COMMAND_TIMEOUT = 30 * 60 * 1000;
const MAX_REGISTRY_RESPONSE = 8 * 1024 * 1024;
const REGISTRY_URL = "https://registry.npmjs.org";
const SLSA_PROVENANCE_V1 = "https://slsa.dev/provenance/v1";

export const R05_PHASES = Object.freeze(["prepublication", "postpublication"]);
export const REQUIRED_EXTERNAL_WRITER_SCOPE = Object.freeze([
  "src/jpeg-writer.ts",
  "src/png-writer.ts",
  "src/webp-writer.ts",
  "src/metadata/serialization.ts",
  "src/edit.ts",
]);

export const REQUIRED_AUDIT_CHECKS = Object.freeze([
  "clean-clone",
  "release-preflight",
  "unit-integration-check",
  "full-check",
  "fuzzing",
  "browser-matrix",
  "deno-runtime",
  "bun-runtime",
  "benchmark",
  "external-corpus",
  "official-iptc-reference",
  "official-icc-reference",
  "generated-artifacts",
  "typecheck",
  "lint",
  "coverage",
  "build",
  "publint",
  "package-smoke",
  "examples",
  "api-schema-contract",
  "baseline",
  "cli-contract",
  "docs-site",
  "official-adapter-integration",
  "focused-ticket-evidence",
  "documentation-links",
  "dependency-vulnerability-scan",
  "license-scan",
  "package-provenance",
  "git-diff-check",
]);

const PUBLIC_DOCUMENTS = Object.freeze([
  "README.md", "API.md", "CAPABILITIES.md", "METADATA_REGISTRY.md", "MIGRATION.md", "COMPARISON.md",
  "CONTRIBUTING.md", "PUBLISHING.md", "BENCHMARKS.md", "EXTERNAL_CORPORA.md",
  "RELEASE_CHECKLIST.md", "RUNTIME_SUPPORT.md", "CHANGELOG.md",
  "W01_MUTATION_MODEL.md", "W02_TIFF_SERIALIZATION.md", "W03_JPEG_WRITING.md",
  "W04_PNG_WRITING.md", "W05_WEBP_WRITING.md", "W06_IPTC_SERIALIZATION.md",
  "W07_REDACTION_SELECTORS.md", "W08_PRESERVATION_VERIFIER.md", "R01_API_DECISION.md",
  "R02_DOCUMENTATION_SITE.md", "R03_CLI.md", "R04_MIGRATION_COMPATIBILITY.md",
  "R04_CODEMOD_DECISION.md", "DEPRECATION_POLICY.md", "T01_PRIVACY_INSPECTION.md",
  "T02_PRIVACY_POLICIES.md", "T03_C2PA_INVENTORY.md", "T04_C2PA_ADAPTERS.md",
  "B04_RAW_PHASE_ONE.md", "B05_RAW_PHASE_TWO.md", "B06_PHOTOSHOP_RESOURCES.md",
  "B07_MAKERNOTE_PLUGIN_CONTRACT.md", "B08_MAKERNOTE_VENDOR_PACKS.md",
  "B09_DEMAND_GATE.md", "B10_XMP_SIDECAR.md",
  "R05_EXTERNAL_REVIEW_PACKET.md", "R05_COMPATIBILITY_LIMITATIONS.md",
]);

const SENSITIVE_PUBLIC_TEXT = /\b(?:fully featured|safest|fastest)\b/iu;
const UNSAFE_MARKER = /\b(?:TODO|FIXME|placeholder|pseudocode|stub)\b|\.only\s*\(|\b(?:skip|skipped|quarantined)\s*\(/iu;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function now() {
  return new Date().toISOString();
}

function asError(error) {
  return error instanceof Error ? error.message : String(error);
}

function validIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value ?? "")) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function sanitizedFailureReason(output) {
  if (/Page\.overrideSetting[^:]*:\s*Unknown setting:\s*PushAPIEnabled/iu.test(output)) return "The installed Playwright WebKit engine rejects the PushAPIEnabled context setting during page setup; Chromium and Firefox completed separately.";
  if (/Release must start from a clean tracked and untracked tree/iu.test(output)) return "The current source tree is dirty; release preflight requires a clean candidate checkout.";
  if (/Baseline stable contract changed/iu.test(output)) return "The stable release baseline changed and requires an intentional recapture/review.";
  return null;
}

function displayCommand(command, args) {
  return [command, ...args].map((argument) => {
    if (argument === root) return ".";
    if (argument.startsWith(`${root}${sep}`)) return `.${argument.slice(root.length)}`;
    return argument;
  }).join(" ");
}

function insideRoot(path) {
  const resolved = resolve(root, path);
  return resolved === root || resolved.startsWith(`${root}${sep}`);
}

function unsupportedClaim(line) {
  return SENSITIVE_PUBLIC_TEXT.test(line) && !/(?:does not use|without|unscoped|requires|defined scope|direct evidence)/iu.test(line);
}

function reportDirectory() {
  const configured = process.env.R05_REPORT_DIR ?? DEFAULT_REPORT_DIRECTORY;
  const directory = resolve(root, configured);
  if (!insideRoot(directory)) throw new Error("R05_REPORT_DIR must remain inside the repository.");
  return directory;
}

function outputPath(directory, name) {
  const path = resolve(directory, name);
  if (!path.startsWith(`${root}${sep}`)) throw new Error(`R05 output escaped the repository: ${name}`);
  return path;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function safeStat(path) {
  try {
    return await stat(path);
  } catch {
    return null;
  }
}

async function packageManifest() {
  return JSON.parse(await readFile(join(root, "package.json"), "utf8"));
}

async function hashFile(relativePath) {
  const path = join(root, relativePath);
  if (!(await exists(path))) return null;
  return sha256(await readFile(path));
}

async function toolingRecord() {
  const packageJson = await packageManifest();
  const lockfile = JSON.parse(await readFile(join(root, "package-lock.json"), "utf8"));
  const versions = Object.fromEntries([
    "@playwright/test", "@contentauth/c2pa-node", "@contentauth/c2pa-web", "exiftool-vendored",
    "exifr", "exifreader", "typescript", "vitest", "publint",
  ].map((name) => [name, lockfile.packages?.[`node_modules/${name}`]?.version ?? null]));
  const manifests = [
    "data/metadata-registry.json", "scripts/external-registry.json", "scripts/external-allowlist.json",
    "data/iptc/reference-images.json", "data/icc/reference-corpus.json", "data/c2pa/provenance.json",
    "data/raw/raw-b04-sources.json", "data/raw/raw-b05-sources.json", "data/dependency-license-provenance.json",
    "data/makernote-b08-sources.json", "data/svg/b09-sources.json",
  ];
  return {
    package: { name: packageJson.name, version: packageJson.version },
    pinnedPackages: versions,
    corpusCommit: process.env.EXTERNAL_CORPUS_COMMIT ?? null,
    manifestHashes: Object.fromEntries(await Promise.all(manifests.map(async (path) => [path, await hashFile(path)]))),
    browserProjects: ["chromium", "firefox", "webkit"],
    standardsAndPolicy: {
      iptc: "data/iptc/reference-images.json",
      icc: "data/icc/reference-corpus.json",
      c2pa: "data/c2pa/provenance.json",
      normalization: "Each ticket-owned evidence runner records its own normalization; R05 never substitutes one runner’s result for another.",
    },
  };
}

async function retainedEvidence() {
  const paths = [
    "reports/f05-external-corpus-evidence.json", "reports/iptc-reference-conformance.json",
    "reports/icc-reference-report.json", "reports/c2pa-adapter-integration.json",
    "reports/raw-b04-evidence.json", "reports/raw-b04-evidence.md",
    "reports/raw-b05-evidence.json", "reports/raw-b05-evidence.md",
    "reports/photoshop-b06-evidence.json", "reports/photoshop-b06-evidence.md",
    "reports/makernote-b07-contract-evidence.json", "reports/makernote-b07-contract-evidence.md",
    "reports/makernote-b08-evidence.json", "reports/makernote-b08-evidence.md",
    "reports/svg-b09-evidence.json", "reports/svg-b09-evidence.md",
    "reports/sidecar-b10-evidence.json", "reports/sidecar-b10-evidence.md",
    "reports/r01-api-snapshot.json", "reports/r02-r03-evidence.json", "reports/r02-r03-evidence.md",
    "reports/r04-compatibility.json", "reports/r04-compatibility.md", "reports/r05-benchmark.json",
    "artifacts/r05-external/external-corpus-report.json", "artifacts/r05-external/external-corpus-report.md",
    "artifacts/r05-iptc/iptc-reference-conformance.json", "artifacts/r05-iptc/iptc-reference-conformance.md",
    "artifacts/r05-icc/icc-reference-report.json", "artifacts/r05-icc/icc-reference-report.md",
  ];
  return Promise.all(paths.map(async (path) => {
    const bytes = await safeStat(join(root, path));
    return { path, present: bytes?.isFile() === true, bytes: bytes?.size ?? null, sha256: bytes?.isFile() === true ? await hashFile(path) : null };
  }));
}

async function run(command, args, options = {}) {
  const started = Date.now();
  const environment = { ...process.env, ...(options.env ?? {}) };
  delete environment.R05_RUNNING_AUDIT;
  try {
    const result = await execFile(command, args, {
      cwd: options.cwd ?? root,
      env: environment,
      timeout: options.timeout ?? COMMAND_TIMEOUT,
      maxBuffer: options.maxBuffer ?? MAX_OUTPUT,
      encoding: "utf8",
    });
    return {
      status: "passed",
      command: displayCommand(command, args),
      durationMs: Date.now() - started,
      exitCode: 0,
      stdoutBytes: Buffer.byteLength(result.stdout),
      stderrBytes: Buffer.byteLength(result.stderr),
      outputSha256: sha256(`${result.stdout}\u0000${result.stderr}`),
      ...(options.retainStdout ? { stdoutTail: result.stdout.slice(-4000) } : {}),
    };
  } catch (error) {
    const code = error?.code;
    const timedOut = error?.killed === true || code === "ETIMEDOUT";
    const output = `${typeof error?.stdout === "string" ? error.stdout : ""}\n${typeof error?.stderr === "string" ? error.stderr : ""}`;
    const environmentBlocked = /(?:listen\s+EPERM|operation not permitted.*127\.0\.0\.1|root-owned files|ENOTFOUND\s+(?:registry\.npmjs\.org|raw\.githubusercontent\.com))/iu.test(output);
    return {
      status: environmentBlocked ? "unavailable" : "failed",
      command: displayCommand(command, args),
      durationMs: Date.now() - started,
      exitCode: Number.isInteger(error?.status) ? error.status : null,
      signal: error?.signal ?? null,
      timedOut,
      stdoutBytes: typeof error?.stdout === "string" ? Buffer.byteLength(error.stdout) : 0,
      stderrBytes: typeof error?.stderr === "string" ? Buffer.byteLength(error.stderr) : 0,
      outputSha256: sha256(`${typeof error?.stdout === "string" ? error.stdout : ""}\u0000${typeof error?.stderr === "string" ? error.stderr : ""}`),
      errorCode: typeof code === "string" ? code : null,
      reason: environmentBlocked ? "The local execution environment prevented this command from running to completion; this is not successful evidence." : sanitizedFailureReason(output),
    };
  }
}

function unavailable(id, reason, command = null) {
  return { id, status: "unavailable", command, reason, durationMs: 0 };
}

function commandResult(id, result) {
  return { id, ...result };
}

async function executable(name) {
  const result = await run("which", [name], { timeout: 10_000, maxBuffer: 64 * 1024 });
  return result.status === "passed";
}

async function environmentRecord() {
  const packageJson = await packageManifest();
  const lockfile = JSON.parse(await readFile(join(root, "package-lock.json"), "utf8"));
  const git = await run("git", ["rev-parse", "HEAD"], { timeout: 10_000, maxBuffer: 64 * 1024, retainStdout: true });
  const status = await run("git", ["status", "--porcelain", "--untracked-files=all"], { timeout: 10_000, maxBuffer: 4 * 1024 * 1024, retainStdout: true });
  return {
    package: { name: packageJson.name, version: packageJson.version },
    packageManager: { name: "npm", version: process.env.npm_config_user_agent ?? "unknown" },
    runtime: { node: process.version, platform: process.platform, architecture: process.arch },
    git: { head: git.stdoutTail.trim() || null, dirty: status.status !== "passed" || status.stdoutTail.length > 0, statusBytes: status.stdoutTail.length },
    lockfileSha256: sha256(lockfileText(lockfile)),
  };
}

function lockfileText(lockfile) {
  return `${JSON.stringify(lockfile, null, 2)}\n`;
}

async function gitCandidateFiles() {
  const tracked = await run("git", ["diff", "--name-only", "HEAD"], { timeout: 10_000, maxBuffer: 4 * 1024 * 1024, retainStdout: true });
  const untracked = await run("git", ["ls-files", "--others", "--exclude-standard"], { timeout: 10_000, maxBuffer: 4 * 1024 * 1024, retainStdout: true });
  return {
    trackedDiff: tracked.status === "passed" ? tracked.stdoutTail.trim().split("\n").filter(Boolean) : [],
    untracked: untracked.status === "passed" ? untracked.stdoutTail.trim().split("\n").filter(Boolean) : [],
  };
}

async function cleanCloneCheck() {
  const configured = process.env.R05_CLEAN_CHECKOUT;
  const checkout = configured ? resolve(configured) : root;
  if (!configured) {
    const currentStatus = await run("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: root, timeout: 10_000, maxBuffer: 4 * 1024 * 1024, retainStdout: true });
    if (currentStatus.status !== "passed" || currentStatus.stdoutTail.trim() !== "") return { id: "clean-clone", status: "unavailable", reason: "R05_CLEAN_CHECKOUT is not set and the current source tree is dirty. A dirty working tree cannot prove a clean checkout containing the exact candidate." };
  }
  if (!(await safeStat(checkout))?.isDirectory()) return { id: "clean-clone", status: "unavailable", reason: `Configured clean checkout does not exist: ${checkout}` };
  const status = await run("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: checkout, timeout: 10_000, maxBuffer: 4 * 1024 * 1024, retainStdout: true });
  if (status.status !== "passed") return { id: "clean-clone", status: "failed", reason: "Unable to inspect the configured candidate checkout.", detail: status };
  if (status.stdoutTail.trim() !== "") return { id: "clean-clone", status: "failed", reason: "Configured candidate checkout is not clean.", detail: status.stdoutTail.trim().slice(0, 4000) };
  const revision = await run("git", ["rev-parse", "HEAD"], { cwd: checkout, timeout: 10_000, maxBuffer: 64 * 1024, retainStdout: true });
  if (revision.status !== "passed" || !revision.stdoutTail.trim()) return { id: "clean-clone", status: "failed", reason: "Unable to identify the clean candidate revision." };
  const expectedRevision = process.env.R05_CANDIDATE_COMMIT?.trim() || null;
  if (expectedRevision && revision.stdoutTail.trim() !== expectedRevision) {
    return { id: "clean-clone", status: "failed", reason: `Clean candidate revision ${revision.stdoutTail.trim()} does not match the reviewed candidate ${expectedRevision}.`, candidateCommit: revision.stdoutTail.trim(), expectedCommit: expectedRevision };
  }
  const expectedTag = process.env.R05_CANDIDATE_TAG?.trim() || null;
  if (expectedTag) {
    const tag = await run("git", ["describe", "--tags", "--exact-match", "HEAD"], { cwd: checkout, timeout: 10_000, maxBuffer: 64 * 1024, retainStdout: true });
    if (tag.status !== "passed" || tag.stdoutTail.trim() !== expectedTag) return { id: "clean-clone", status: "failed", reason: `Clean candidate is not exactly the reviewed release tag ${expectedTag}.`, candidateCommit: revision.stdoutTail.trim(), expectedTag, observedTag: tag.stdoutTail.trim() || null };
  }
  const packageCheck = await run("npm", ["ci"], { cwd: checkout, timeout: COMMAND_TIMEOUT, maxBuffer: MAX_OUTPUT });
  if (packageCheck.status !== "passed") return { id: "clean-clone", status: "failed", reason: "npm ci failed in the clean candidate checkout.", detail: packageCheck };
  const check = await run("npm", ["run", "check"], { cwd: checkout, timeout: COMMAND_TIMEOUT, maxBuffer: MAX_OUTPUT });
  return { id: "clean-clone", status: check.status, checkout: configured ? "operator-supplied clean checkout" : "current clean candidate checkout", candidateCommit: revision.stdoutTail.trim(), expectedCommit: expectedRevision, expectedTag, npmCi: packageCheck, check };
}

async function documentationAudit() {
  const missing = [];
  const links = [];
  const claims = [];
  const unsafe = [];
  const headingsByFile = new Map();
  for (const relativePath of PUBLIC_DOCUMENTS) {
    const path = join(root, relativePath);
    if (!(await exists(path))) {
      missing.push(relativePath);
      continue;
    }
    const content = await readFile(path, "utf8");
    const headings = new Set(content.split("\n").flatMap((line) => {
      const match = /^(?:#{1,6})\s+(.+?)\s*#*\s*$/u.exec(line);
      return match ? [slugify(match[1])] : [];
    }));
    headingsByFile.set(relativePath, headings);
    for (const [index, line] of content.split("\n").entries()) {
      if (unsupportedClaim(line)) claims.push({ file: relativePath, line: index + 1, text: line.trim() });
      if (UNSAFE_MARKER.test(line)) unsafe.push({ file: relativePath, line: index + 1, text: line.trim() });
      for (const match of line.matchAll(/\]\(([^)]+)\)/gu)) {
        const target = match[1];
        if (/^(?:https?:|mailto:|#)/u.test(target)) {
          links.push({ file: relativePath, target, status: "external-or-local-anchor" });
          continue;
        }
        const [fileTarget, anchor] = target.split("#", 2);
        const destination = resolve(root, dirname(relativePath), fileTarget);
        const destinationRelative = relative(root, destination).split(sep).join("/");
        const generatedOutput = destinationRelative === "reports/r05-release-audit.json" || destinationRelative === "reports/r05-release-audit.md";
        const fileExists = generatedOutput || await exists(destination);
        const anchorExists = !anchor || headingsByFile.get(destinationRelative)?.has(anchor) || (fileExists ? await headingExists(destination, anchor) : false);
        links.push({ file: relativePath, target, status: fileExists && anchorExists ? (generatedOutput ? "generated-output" : "passed") : "failed" });
      }
    }
  }
  const failures = links.filter((link) => link.status === "failed");
  return {
    status: missing.length === 0 && failures.length === 0 && claims.length === 0 && unsafe.length === 0 ? "passed" : "failed",
    checkedDocuments: PUBLIC_DOCUMENTS.length - missing.length,
    missing,
    links,
    unsupportedClaims: claims,
    unsafeMarkers: unsafe,
  };
}

function slugify(value) {
  return value.toLowerCase().replace(/<[^>]+>/gu, "").replace(/[^\p{Letter}\p{Number}\s-]/gu, "").trim().replace(/\s+/gu, "-");
}

async function headingExists(path, anchor) {
  if (!(await exists(path))) return false;
  const content = await readFile(path, "utf8");
  return content.split("\n").some((line) => {
    const match = /^(?:#{1,6})\s+(.+?)\s*#*\s*$/u.exec(line);
    return match !== null && slugify(match[1]) === anchor;
  });
}

async function sourceAudit() {
  const roots = ["src", "scripts", "tests", "cli", "docs-site"].map((directory) => join(root, directory));
  const findings = [];
  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "coverage") continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (/\.(?:[cm]?[jt]s|tsx?|md|json)$/u.test(entry.name) && entry.name !== "r05-release-audit.mjs" && entry.name !== "r05-release-audit.test.ts") {
        const content = await readFile(path, "utf8");
        const file = relative(root, path);
        content.split("\n").forEach((line, index) => {
          const intentionalBoundary = file === "src/node-browser.ts" && /Browser-condition stub for the explicit Node-only entry point/u.test(line);
          const auditFieldName = file === "scripts/baseline.mjs" && /skipped:\s+tests\.filter/u.test(line);
          if (UNSAFE_MARKER.test(line) && !intentionalBoundary && !auditFieldName) findings.push({ file, line: index + 1, text: line.trim() });
        });
      }
    }
  }
  for (const directory of roots) if (await exists(directory)) await visit(directory);
  return {
    status: findings.length === 0 ? "passed" : "failed",
    findings,
    allowedMarkers: [
      { file: "src/node-browser.ts", reason: "Intentional browser-condition boundary for the Node-only entry point." },
      { file: "scripts/baseline.mjs", reason: "The field counts pending/todo test results; it is not a skipped test." },
    ],
  };
}

async function packageLicenseAudit() {
  const packageJson = await packageManifest();
  const lockfile = JSON.parse(await readFile(join(root, "package-lock.json"), "utf8"));
  const provenancePath = "data/dependency-license-provenance.json";
  let provenance;
  try {
    provenance = JSON.parse(await readFile(join(root, provenancePath), "utf8"));
  } catch (error) {
    return { status: "failed", reason: `Dependency license provenance could not be read: ${asError(error)}`, provenancePath, scannedPackages: 0, missingLicenses: [], byGroup: {} };
  }
  if (provenance?.schema !== "browser-image-metadata.dependency-license-provenance.v1" || !Array.isArray(provenance.entries)) {
    return { status: "failed", reason: "Dependency license provenance has an invalid schema.", provenancePath, scannedPackages: 0, missingLicenses: [], byGroup: {} };
  }
  const provenanceKeys = new Set();
  const provenanceFailures = [];
  for (const entry of provenance.entries) {
    const key = `${entry?.name ?? ""}@${entry?.version ?? ""}`;
    if (provenanceKeys.has(key)) provenanceFailures.push({ key, reason: "duplicate provenance entry" });
    provenanceKeys.add(key);
    if (
      typeof entry?.name !== "string" || typeof entry?.version !== "string" || typeof entry?.license !== "string" ||
      !/^https:\/\//u.test(entry?.sourceRepository ?? "") || !/^[0-9a-f]{40}$/u.test(entry?.sourceCommit ?? "") ||
      !/^https:\/\//u.test(entry?.sourceLicenseUrl ?? "") || !/^https:\/\//u.test(entry?.registryTarball ?? "") ||
      !/^sha512-[A-Za-z0-9+/]+=*$/u.test(entry?.registryIntegrity ?? "") || !/^[0-9a-f]{64}$/u.test(entry?.registryTarballSha256 ?? "") ||
      !/^\d{4}-\d{2}-\d{2}$/u.test(entry?.retrievedAt ?? "")
    ) provenanceFailures.push({ key, reason: "incomplete or malformed provenance fields" });
  }
  const groups = {
    runtime: Object.keys(packageJson.dependencies ?? {}),
    optional: Object.keys(packageJson.optionalDependencies ?? {}),
    development: Object.keys(packageJson.devDependencies ?? {}),
    peer: Object.keys(packageJson.peerDependencies ?? {}),
  };
  const packages = [];
  async function licenseFromFile(directory) {
    for (const name of ["LICENSE", "LICENSE.txt", "LICENSE.md", "COPYING", "COPYING.txt"]) {
      try {
        const text = await readFile(join(directory, name), "utf8");
        if (/MIT License/iu.test(text)) return { value: "MIT", source: name };
        if (/Apache License.*Version 2\.0/isu.test(text)) return { value: "Apache-2.0", source: name };
        if (/GNU GENERAL PUBLIC LICENSE/iu.test(text)) return { value: "GPL", source: name };
        if (/Mozilla Public License.*2\.0/isu.test(text)) return { value: "MPL-2.0", source: name };
      } catch {
        // An absent or unreadable license file remains unresolved evidence.
      }
    }
    return null;
  }
  async function visit(directory, seen = new Set()) {
    if (!(await exists(directory))) return;
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith("@")) {
        await visit(join(directory, entry.name), seen);
        continue;
      }
      const packagePath = join(directory, entry.name, "package.json");
      if (!(await exists(packagePath))) continue;
      if (seen.has(packagePath)) continue;
      seen.add(packagePath);
      let manifest;
      try { manifest = JSON.parse(await readFile(packagePath, "utf8")); } catch { continue; }
      const manifestLicense = typeof manifest.license === "string" ? { value: manifest.license, source: "package.json" } : Array.isArray(manifest.licenses) ? { value: manifest.licenses.map((item) => item?.type).filter(Boolean).join(" OR "), source: "package.json" } : null;
      const license = manifestLicense ?? await licenseFromFile(join(directory, entry.name));
      packages.push({ name: manifest.name ?? entry.name, version: manifest.version ?? null, license: license?.value ?? null, licenseSource: license?.source ?? null, path: relative(root, packagePath) });
      await visit(join(directory, entry.name, "node_modules"), seen);
    }
  }
  await visit(join(root, "node_modules"));
  const resolvedPackages = packages.map((item) => {
    if (item.license) return item;
    const entry = provenance.entries.find((candidate) => candidate?.name === item.name && candidate?.version === item.version);
    const lockKey = item.path.replace(/\/package\.json$/u, "");
    const lockEntry = lockfile.packages?.[lockKey];
    if (!entry || provenanceFailures.some((failure) => failure.key === `${entry.name}@${entry.version}`) || lockEntry?.version !== entry.version || lockEntry?.integrity !== entry.registryIntegrity) {
      return item;
    }
    return {
      ...item,
      license: entry.license,
      licenseSource: `${provenancePath}#${entry.name}@${entry.version}`,
      licenseProvenance: {
        sourceRepository: entry.sourceRepository,
        sourceCommit: entry.sourceCommit,
        sourceLicenseUrl: entry.sourceLicenseUrl,
        registryTarball: entry.registryTarball,
        registryTarballSha256: entry.registryTarballSha256,
        registryIntegrity: entry.registryIntegrity,
        retrievedAt: entry.retrievedAt,
      },
    };
  });
  const missing = resolvedPackages.filter((item) => !item.license);
  const byGroup = Object.fromEntries(Object.entries(groups).map(([group, names]) => [group, names.map((name) => resolvedPackages.find((item) => item.name === name) ?? { name, missing: true })]));
  return {
    status: missing.length === 0 && provenanceFailures.length === 0 ? "passed" : "failed",
    reason: missing.length === 0 && provenanceFailures.length === 0 ? null : [
      missing.length ? `License metadata is unresolved for: ${missing.map((item) => `${item.name}@${item.version ?? "unknown"}`).join(", ")}.` : null,
      provenanceFailures.length ? `License provenance is invalid: ${provenanceFailures.map((failure) => `${failure.key} (${failure.reason})`).join(", ")}.` : null,
    ].filter(Boolean).join(" "),
    scannedPackages: resolvedPackages.length,
    packages: resolvedPackages,
    missingLicenses: missing,
    byGroup,
    provenancePath,
    provenanceEntries: provenance.entries.length,
    provenanceFailures,
    policy: "Every installed package must expose a package.json license or an identifiable common license file; a package without metadata may use only an exact lockfile-matched, hash-pinned upstream provenance entry. Optional, development, peer, and runtime groups are reported separately.",
  };
}

function requestedPhase() {
  const argumentIndex = process.argv.findIndex((argument) => argument === "--phase" || argument.startsWith("--phase="));
  const argumentValue = argumentIndex < 0 ? null : process.argv[argumentIndex].startsWith("--phase=") ? process.argv[argumentIndex].slice("--phase=".length) : process.argv[argumentIndex + 1];
  const phase = argumentValue ?? process.env.R05_PHASE ?? "prepublication";
  if (!R05_PHASES.includes(phase)) throw new Error(`R05 phase must be one of ${R05_PHASES.join(" or ")}; received ${phase}.`);
  return phase;
}

function expectedDistTag(version) {
  const prerelease = version.split("+", 1)[0].split("-", 2)[1];
  return process.env.R05_EXPECTED_DIST_TAG?.trim() || (prerelease ? prerelease.split(".", 1)[0] : "latest");
}

async function fetchBounded(url, maximumBytes = MAX_REGISTRY_RESPONSE) {
  const controller = new globalThis.AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 120_000);
  try {
    const response = await globalThis.fetch(url, { signal: controller.signal, redirect: "error" });
    if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
    const declaredLength = Number(response.headers.get("content-length"));
    if (Number.isSafeInteger(declaredLength) && declaredLength > maximumBytes) throw new Error(`Response from ${url} exceeds the ${maximumBytes}-byte limit.`);
    if (!response.body) return Buffer.alloc(0);
    const reader = response.body.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (!Number.isSafeInteger(total) || total > maximumBytes) {
        await reader.cancel();
        throw new Error(`Response from ${url} exceeds the ${maximumBytes}-byte limit.`);
      }
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks, total);
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

function registryUnavailable(error) {
  return error?.name === "AbortError" || /(?:ENOTFOUND|EAI_AGAIN|ECONNRESET|ECONNREFUSED|fetch failed|network|timed out)/iu.test(asError(error));
}

function registryUrl(path) {
  return `${REGISTRY_URL}/${path}`;
}

async function registryProvenanceAudit(packageJson) {
  const packageName = packageJson.name;
  const version = packageJson.version;
  const encodedName = encodeURIComponent(packageName);
  const versionUrl = registryUrl(`${encodedName}/${encodeURIComponent(version)}`);
  const packageUrl = registryUrl(encodedName);
  const expectedTag = expectedDistTag(version);
  let versionMetadata;
  let packageMetadata;
  try {
    const [versionBytes, packageBytes] = await Promise.all([fetchBounded(versionUrl), fetchBounded(packageUrl)]);
    try {
      versionMetadata = JSON.parse(versionBytes.toString("utf8"));
      packageMetadata = JSON.parse(packageBytes.toString("utf8"));
    } catch (error) {
      return { status: "failed", reason: `The npm registry returned malformed JSON: ${asError(error)}.`, registry: { versionUrl, packageUrl } };
    }
  } catch (error) {
    return { status: registryUnavailable(error) ? "unavailable" : "failed", reason: registryUnavailable(error) ? "The npm registry or provenance service was unavailable; postpublication evidence is not successful without a completed registry read." : `The npm registry metadata could not be read: ${asError(error)}.`, registry: { versionUrl, packageUrl } };
  }

  const dist = versionMetadata?.dist;
  const tags = packageMetadata?.["dist-tags"];
  const metadataFailures = [];
  if (versionMetadata?.name !== packageName || versionMetadata?.version !== version) metadataFailures.push("registry metadata does not identify the exact package name and version");
  if (tags?.[expectedTag] !== version) metadataFailures.push(`dist-tag ${expectedTag} does not resolve to ${version}`);
  if (typeof dist?.tarball !== "string" || !/^https:\/\//u.test(dist.tarball)) metadataFailures.push("registry metadata has no HTTPS tarball URL");
  if (typeof dist?.integrity !== "string" || !/^sha512-[A-Za-z0-9+/]+=*$/u.test(dist.integrity)) metadataFailures.push("registry metadata has no valid SHA-512 integrity");
  if (typeof dist?.shasum !== "string" || !/^[0-9a-f]{40}$/iu.test(dist.shasum)) metadataFailures.push("registry metadata has no valid SHA-1 shasum");
  const signatures = Array.isArray(dist?.signatures) ? dist.signatures : [];
  if (signatures.length === 0 || signatures.some((signature) => typeof signature?.keyid !== "string" || typeof signature?.sig !== "string" || signature.sig.length === 0)) metadataFailures.push("registry metadata has no complete npm signature set");
  const attestations = dist?.attestations;
  const attestationPredicate = typeof attestations?.provenance === "string" ? attestations.provenance : attestations?.provenance?.predicateType;
  if (attestationPredicate !== SLSA_PROVENANCE_V1 || typeof attestations?.url !== "string" || !/^https:\/\//u.test(attestations.url)) metadataFailures.push("registry metadata has no SLSA provenance attestation URL");
  if (metadataFailures.length) return { status: "failed", reason: metadataFailures.join("; ") + ".", registry: { versionUrl, packageUrl, expectedTag, observedTagVersion: tags?.[expectedTag] ?? null, metadataFailures } };

  const directory = await mkdtemp(join(tmpdir(), "browser-image-metadata-r05-registry-"));
  try {
    let tarballBytes;
    try {
      tarballBytes = await fetchBounded(dist.tarball, 64 * 1024 * 1024);
    } catch (error) {
      return { status: registryUnavailable(error) ? "unavailable" : "failed", reason: registryUnavailable(error) ? "The npm registry tarball was unavailable; this is not successful postpublication evidence." : `The npm registry tarball could not be read: ${asError(error)}.`, registry: { versionUrl, packageUrl, expectedTag } };
    }
    const tarballPath = join(directory, "package.tgz");
    await writeFile(tarballPath, tarballBytes);
    const sha512 = `sha512-${createHash("sha512").update(tarballBytes).digest("base64")}`;
    const sha1 = createHash("sha1").update(tarballBytes).digest("hex");
    const tarball = { bytes: tarballBytes.byteLength, sha256: sha256(tarballBytes), sha1, integrity: sha512, expectedIntegrity: dist.integrity, expectedShasum: dist.shasum };
    const tarballFailures = [];
    if (sha512 !== dist.integrity) tarballFailures.push("downloaded tarball integrity does not match registry metadata");
    if (sha1.toLowerCase() !== dist.shasum.toLowerCase()) tarballFailures.push("downloaded tarball shasum does not match registry metadata");
    let listing;
    let packageEntry;
    try {
      listing = await execFile("tar", ["-tzf", tarballPath], { cwd: root, timeout: 30_000, maxBuffer: MAX_OUTPUT, encoding: "utf8" });
      packageEntry = await execFile("tar", ["-xOf", tarballPath, "package/package.json"], { cwd: root, timeout: 30_000, maxBuffer: 2 * 1024 * 1024, encoding: "utf8" });
    } catch (error) {
      tarballFailures.push(`downloaded registry tarball could not be inspected: ${asError(error)}`);
    }
    let packedPackage = null;
    if (packageEntry) {
      try { packedPackage = JSON.parse(packageEntry.stdout); } catch (error) { tarballFailures.push(`downloaded package manifest is malformed: ${asError(error)}`); }
    }
    const entries = listing?.stdout.split("\n").filter(Boolean) ?? [];
    const required = ["package/package.json", "package/README.md", "package/LICENSE", "package/dist/index.js", "package/dist/index.d.ts"];
    const missing = required.filter((name) => !entries.includes(name));
    if (missing.length) tarballFailures.push(`downloaded registry tarball is missing: ${missing.join(", ")}`);
    if (packedPackage?.name !== packageName || packedPackage?.version !== version) tarballFailures.push("downloaded package manifest does not match the exact candidate");

    let attestationDocument;
    let attestationBytes;
    try {
      attestationBytes = await fetchBounded(attestations.url);
      attestationDocument = JSON.parse(attestationBytes.toString("utf8"));
    } catch (error) {
      return { status: registryUnavailable(error) ? "unavailable" : "failed", reason: registryUnavailable(error) ? "The npm provenance attestation was unavailable; no provenance claim is made." : `The npm provenance attestation could not be validated: ${asError(error)}.`, registry: { versionUrl, packageUrl, expectedTag, tarball, signatures: signatures.length } };
    }
    const statements = Array.isArray(attestationDocument?.attestations) ? attestationDocument.attestations.filter((item) => item?.predicateType === SLSA_PROVENANCE_V1) : [];
    const decodedStatements = [];
    for (const statement of statements) {
      const encodedPayload = statement?.bundle?.dsseEnvelope?.payload ?? statement?.dsseEnvelope?.payload;
      if (typeof encodedPayload !== "string") continue;
      try {
        const decoded = JSON.parse(Buffer.from(encodedPayload, "base64").toString("utf8"));
        if (decoded?.predicateType === SLSA_PROVENANCE_V1 && Array.isArray(decoded.subject) && decoded.subject.length > 0) decodedStatements.push(decoded);
      } catch {
        // An undecodable attestation is not counted as provenance evidence.
      }
    }
    if (decodedStatements.length === 0) tarballFailures.push("the registry attestation contains no decodable SLSA provenance statement");
    const tarballSha512Hex = createHash("sha512").update(tarballBytes).digest("hex");
    const provenanceSubjectMatches = decodedStatements.some((statement) => statement.subject.some((subject) => subject?.name === `pkg:npm/${packageName}@${version}` && subject?.digest?.sha512 === tarballSha512Hex));
    if (!provenanceSubjectMatches) tarballFailures.push("the registry SLSA subject does not match the exact package and tarball SHA-512");
    return {
      status: tarballFailures.length === 0 ? "passed" : "failed",
      reason: tarballFailures.length ? tarballFailures.join("; ") + "." : null,
      registry: {
        versionUrl,
        packageUrl,
        expectedTag,
        observedTagVersion: tags[expectedTag],
        tarball,
        requiredEntries: required,
        entryCount: entries.length,
        sourceMapCount: entries.filter((name) => name.endsWith(".map")).length,
        signatures: signatures.map((signature) => ({ keyid: signature.keyid, signatureSha256: sha256(signature.sig) })),
        attestation: { url: attestations.url, predicateType: SLSA_PROVENANCE_V1, responseBytes: attestationBytes.byteLength, responseSha256: sha256(attestationBytes), statementCount: decodedStatements.length, subjectMatchesTarball: provenanceSubjectMatches },
        parserCompleteness: { metadata: metadataFailures.length === 0, tarball: tarballFailures.length === 0, attestation: decodedStatements.length > 0 && provenanceSubjectMatches },
      },
    };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export async function packageProvenanceAudit(phase = "prepublication") {
  if (!R05_PHASES.includes(phase)) throw new Error(`Unsupported R05 phase: ${phase}.`);
  const directory = await mkdtemp(join(tmpdir(), "browser-image-metadata-r05-pack-"));
  try {
    let packed;
    try {
      packed = await execFile("npm", ["pack", "--json", "--pack-destination", directory], {
        cwd: root,
        env: { ...process.env, npm_config_cache: join(directory, "npm-cache") },
        timeout: COMMAND_TIMEOUT,
        maxBuffer: MAX_OUTPUT,
        encoding: "utf8",
      });
    } catch (error) {
      const stderr = typeof error?.stderr === "string" ? error.stderr : asError(error);
      return { status: "failed", reason: "npm pack failed before an artifact could be inspected.", exitCode: Number.isInteger(error?.status) ? error.status : null, stderrBytes: Buffer.byteLength(stderr), stderrSha256: sha256(stderr) };
    }
    const result = { status: "passed", command: "npm pack --json", exitCode: 0, durationMs: null, stderrBytes: Buffer.byteLength(packed.stderr), stderrSha256: sha256(packed.stderr) };
    let manifest;
    try { manifest = JSON.parse(packed.stdout); } catch (error) { return { status: "failed", reason: `npm pack JSON was not parseable: ${asError(error)}`, result }; }
    const entry = manifest[0];
    if (!entry?.filename) return { status: "failed", reason: "npm pack produced no reported filename.", result };
    const tarball = join(directory, entry.filename);
    const bytes = await readFile(tarball);
    let listing;
    let packageEntry;
    try {
      listing = await execFile("tar", ["-tzf", tarball], { cwd: root, timeout: 30_000, maxBuffer: MAX_OUTPUT, encoding: "utf8" });
      packageEntry = await execFile("tar", ["-xOf", tarball, "package/package.json"], { cwd: root, timeout: 30_000, maxBuffer: 2 * 1024 * 1024, encoding: "utf8" });
    } catch (error) {
      return { status: "failed", reason: `The packed artifact could not be inspected: ${asError(error)}`, tarball: { file: entry.filename, bytes: bytes.byteLength, sha256: sha256(bytes), integrity: entry.integrity ?? null } };
    }
    const entries = listing.stdout.split("\n").filter(Boolean);
    const packageJson = JSON.parse(packageEntry.stdout);
    const required = ["package/package.json", "package/README.md", "package/LICENSE", "package/dist/index.js", "package/dist/index.d.ts"];
    const missing = required.filter((name) => !entries.includes(name));
    const packageManifest = await packageManifestFile();
    const localIntegrity = `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
    const localTarball = { file: entry.filename, bytes: bytes.byteLength, sha256: sha256(bytes), integrity: localIntegrity, reportedIntegrity: entry.integrity ?? null };
    const localPassed = missing.length === 0 && packageJson.name === packageManifest.name && packageJson.version === packageManifest.version && entry.integrity === localIntegrity;
    if (!localPassed) {
      return {
        status: "failed",
        phase,
        tarball: localTarball,
        package: { name: packageJson.name, version: packageJson.version },
        requiredEntries: required,
        missing,
        sourceMaps: entries.filter((name) => name.endsWith(".map")).length,
        entryCount: entries.length,
        reason: "The locally generated package artifact does not match the candidate package contract.",
      };
    }
    const local = {
      status: "passed",
      phase,
      tarball: localTarball,
      package: { name: packageJson.name, version: packageJson.version },
      requiredEntries: required,
      missing,
      sourceMaps: entries.filter((name) => name.endsWith(".map")).length,
      entryCount: entries.length,
      registryProvenance: phase === "prepublication" ? { status: "pending", reason: "Registry version, dist-tag, tarball, signatures, and npm provenance are verified only after trusted publication." } : await registryProvenanceAudit(packageManifest),
      policy: "Prepublication verifies the local package artifact and records registry provenance as pending. Postpublication requires exact registry metadata, prerelease/stable dist-tag, tarball integrity, npm signatures, and a decodable SLSA provenance attestation.",
    };
    if (phase === "postpublication") local.status = local.registryProvenance.status;
    return local;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function packageManifestFile() {
  return JSON.parse(await readFile(join(root, "package.json"), "utf8"));
}

async function npmAudit() {
  let raw;
  try {
    raw = await execFile("npm", ["audit", "--json", "--omit=optional"], { cwd: root, env: process.env, timeout: 120_000, maxBuffer: MAX_OUTPUT, encoding: "utf8" });
  } catch (error) {
    let parsed = null;
    try { parsed = JSON.parse(typeof error?.stdout === "string" ? error.stdout : ""); } catch { /* network and process failures are retained as command failures */ }
    const networkUnavailable = /(?:ENOTFOUND|EAI_AGAIN|ECONNRESET|network|audit endpoint)/iu.test(`${typeof error?.stderr === "string" ? error.stderr : ""}\n${asError(error)}`);
    return {
      status: networkUnavailable ? "unavailable" : "failed",
      command: "npm audit --json --omit=optional",
      exitCode: Number.isInteger(error?.status) ? error.status : null,
      stderrBytes: typeof error?.stderr === "string" ? Buffer.byteLength(error.stderr) : 0,
      stderrSha256: sha256(typeof error?.stderr === "string" ? error.stderr : asError(error)),
      vulnerabilities: parsed?.metadata?.vulnerabilities ?? null,
      reason: networkUnavailable ? "The npm audit service was unavailable; this is not successful evidence." : "npm audit exited without a zero-vulnerability result.",
      policy: "A non-zero vulnerability result or unavailable audit service is not a pass.",
    };
  }
  let parsed = null;
  try { parsed = JSON.parse(raw.stdout); } catch { /* malformed scanner output remains a failed evidence result */ }
  const vulnerabilities = parsed?.metadata?.vulnerabilities ?? null;
  return { status: vulnerabilities !== null && Object.values(vulnerabilities).every((count) => count === 0) ? "passed" : "failed", command: "npm audit --json --omit=optional", exitCode: 0, stderrBytes: Buffer.byteLength(raw.stderr), stderrSha256: sha256(raw.stderr), vulnerabilities, policy: "A non-zero vulnerability result or unavailable audit service is not a pass." };
}

async function prerequisite(directory, label) {
  if (!directory) return { ok: false, reason: `${label} environment variable is not set.` };
  const info = await safeStat(resolve(directory));
  if (!info?.isDirectory()) return { ok: false, reason: `${label} directory is missing or not a directory: ${directory}` };
  return { ok: true };
}

async function runConfiguredCommand(id, command, args, envName, label, timeout = COMMAND_TIMEOUT) {
  const check = await prerequisite(process.env[envName], label);
  if (!check.ok) return unavailable(id, check.reason, `${command} ${args.join(" ")}`);
  return commandResult(id, await run(command, args, { env: { [envName]: process.env[envName] }, timeout }));
}

async function runChecks(phase) {
  const results = [];
  const npm = (id, script, args = [], timeout = COMMAND_TIMEOUT) => run("npm", ["run", script, ...args], { timeout, maxBuffer: MAX_OUTPUT }).then((result) => commandResult(id, result));
  results.push(await npm("release-preflight", "release:check"));
  results.push(await cleanCloneCheck());
  results.push(await npm("unit-integration-check", "test"));
  results.push(await npm("full-check", "check"));
  results.push(await npm("fuzzing", "test:fuzz"));
  results.push(await npm("browser-matrix", "test:browser"));
  results.push(await (await executable("deno") ? npm("deno-runtime", "test:deno") : unavailable("deno-runtime", "Deno executable is not installed; no Deno result is treated as pass.", "npm run test:deno")));
  results.push(await (await executable("bun") ? run("bun", ["run", "test:bun"], { timeout: COMMAND_TIMEOUT, maxBuffer: MAX_OUTPUT }).then((result) => commandResult("bun-runtime", result)) : unavailable("bun-runtime", "Bun executable is not installed; no Bun result is treated as pass.", "bun run test:bun")));
  const benchmarkOutput = resolve(root, process.env.R05_BENCHMARK_OUTPUT ?? "reports/r05-benchmark.json");
  if (!insideRoot(benchmarkOutput)) throw new Error("R05_BENCHMARK_OUTPUT must remain inside the repository.");
  results.push(await npm("benchmark", "benchmark", ["--", "--output", benchmarkOutput]));
  results.push(await runConfiguredCommand("external-corpus", "npm", ["run", "test:corpus"], "EXTERNAL_FIXTURE_ROOT", "EXTERNAL_FIXTURE_ROOT"));
  results.push(await runConfiguredCommand("official-iptc-reference", "npm", ["run", "iptc:reference"], "IPTC_REFERENCE_CORPUS_DIR", "IPTC_REFERENCE_CORPUS_DIR"));
  results.push(await runConfiguredCommand("official-icc-reference", "npm", ["run", "icc:reference"], "ICC_REFERENCE_CORPUS_DIR", "ICC_REFERENCE_CORPUS_DIR"));
  results.push(await npm("generated-artifacts", "capabilities:check"));
  results.push(await npm("generated-registry", "registry:check"));
  results.push(await npm("generated-iptc", "iptc:check"));
  results.push(await npm("typecheck", "typecheck"));
  results.push(await npm("lint", "lint"));
  results.push(await npm("coverage", "test:coverage"));
  results.push(await npm("build", "build"));
  results.push(await npm("publint", "publint"));
  results.push(await npm("package-smoke", "package:smoke"));
  results.push(await npm("examples", "examples"));
  results.push(await npm("api-schema-contract", "r01:check"));
  results.push(await npm("baseline", "baseline:verify"));
  results.push(await npm("cli-contract", "cli:check"));
  results.push(await npm("docs-site", "docs:check"));
  results.push(await npm("official-adapter-integration", "test:c2pa", [], 120_000));
  const focused = [
    ["jxl-b01", "test:jxl"],
    ["heif-b02", "test:heif"],
    ["heif-b03", "test:heif-sequences"],
    ["raw-b04", "test:raw", "RAW_B04_CORPUS_DIR"],
    ["raw-b05", "test:raw-b05", "RAW_B05_CORPUS_DIR"],
    ["photoshop-b06", "test:photoshop-b06"],
    ["makernote-b07", "test:makernote-b07"],
    ["makernote-b08", "test:makernote-b08"],
    ["svg-b09", "test:svg-b09", "B09_SVG_CORPUS_DIR"],
    ["sidecar-b10", "test:sidecar-b10"],
    ["r04-compatibility", "test:r04"],
  ];
  for (const [id, script, environment] of focused) {
    results.push(environment ? await runConfiguredCommand(id, "npm", ["run", script], environment, environment) : await npm(id, script));
  }
  results.push({ id: "focused-ticket-evidence", status: focused.every(([id]) => results.find((result) => result.id === id)?.status === "passed") ? "passed" : "failed", members: focused.map(([id]) => id) });
  const docs = await documentationAudit();
  results.push({ id: "documentation-links", ...docs });
  results.push({ id: "source-marker-audit", ...(await sourceAudit()) });
  results.push({ id: "dependency-vulnerability-scan", ...(await npmAudit()) });
  results.push({ id: "license-scan", ...(await packageLicenseAudit()) });
  results.push({ id: "package-provenance", ...(await packageProvenanceAudit(phase)) });
  results.push(commandResult("git-diff-check", await run("git", ["diff", "--check"], { timeout: 30_000, maxBuffer: 4 * 1024 * 1024 })));
  return results;
}

export function validateExternalReviewRecord(record) {
  const failures = [];
  if (record?.schema !== "browser-image-metadata/r05-external-review@1") failures.push("schema is not browser-image-metadata/r05-external-review@1");
  if (typeof record?.reviewer?.identity !== "string" || record.reviewer.identity.trim().length < 2) failures.push("reviewer identity is missing");
  if (record?.reviewer?.independent !== true) failures.push("reviewer independence is not explicitly recorded");
  if (!/^[0-9a-f]{40}$/iu.test(record?.revision?.commit ?? "")) failures.push("reviewed revision is not a full commit hash");
  if (record?.scope?.tiffOffsetHandling !== true) failures.push("TIFF offset handling is not in scope");
  const writerCoverage = Array.isArray(record?.scope?.writerCoverage) ? new Set(record.scope.writerCoverage) : new Set();
  for (const writer of REQUIRED_EXTERNAL_WRITER_SCOPE) if (!writerCoverage.has(writer)) failures.push(`writer scope is missing ${writer}`);
  if (!Array.isArray(record?.findings)) failures.push("findings is not an array");
  else record.findings.forEach((finding, index) => {
    if (typeof finding?.id !== "string" || !finding.id.trim()) failures.push(`finding ${index + 1} has no stable id`);
    if (typeof finding?.severity !== "string" || !finding.severity.trim()) failures.push(`finding ${index + 1} has no severity`);
    if (!Array.isArray(finding?.affectedFiles) || finding.affectedFiles.length === 0) failures.push(`finding ${index + 1} has no affected files`);
    if (typeof finding?.description !== "string" || !finding.description.trim()) failures.push(`finding ${index + 1} has no description`);
    if (typeof finding?.disposition !== "string" || !finding.disposition.trim()) failures.push(`finding ${index + 1} has no disposition`);
  });
  if (!validIsoDate(record?.reviewedAt)) failures.push("review date is missing or invalid");
  if (record?.approval?.status !== "approved") failures.push("review approval is not recorded as approved");
  if (!validIsoDate(record?.approval?.date)) failures.push("approval date is missing or invalid");
  if (typeof record?.conclusion !== "string" || !record.conclusion.trim()) failures.push("review conclusion is missing");
  return failures;
}

async function externalReviewGate() {
  const candidate = "reports/r05-external-review.json";
  const path = join(root, candidate);
  if (!(await exists(path))) return { status: "blocked", reason: "No retained external review record exists. The prepared packet is not an approval." };
  let record;
  try {
    record = JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    return { status: "failed", record: candidate, reason: `The retained external review record is not valid JSON: ${asError(error)}.` };
  }
  const failures = validateExternalReviewRecord(record);
  if (failures.length) return { status: "blocked", record: candidate, reason: `The retained external review record is incomplete: ${failures.join("; ")}.`, recordSha256: await hashFile(candidate) };
  return { status: "passed", record: candidate, recordSha256: await hashFile(candidate), reviewer: record.reviewer.identity, revision: record.revision.commit, reviewedAt: record.reviewedAt, findingCount: record.findings.length, policy: "Only a structured retained external record with independent reviewer identity, exact revision, complete TIFF and writer scope, per-finding dispositions, dated conclusion, and explicit approval can satisfy this gate." };
}

function publicationGate(packageJson, phase, packageProvenance) {
  const tag = expectedDistTag(packageJson.version);
  if (phase === "prepublication") {
    return {
      status: "pending",
      phase,
      expectedDistTag: tag,
      package: { name: packageJson.name, version: packageJson.version },
      reason: "Registry version, dist-tag, tarball integrity, npm signatures, and provenance are intentionally pending until the trusted-publishing step succeeds.",
      policy: "Prepublication is the permission gate for npm publish; it must not require facts that can exist only after publication.",
    };
  }
  return {
    status: packageProvenance?.registryProvenance?.status === "passed" ? "passed" : packageProvenance?.registryProvenance?.status ?? "failed",
    phase,
    expectedDistTag: tag,
    package: { name: packageJson.name, version: packageJson.version },
    reason: packageProvenance?.registryProvenance?.reason ?? "Postpublication registry verification did not produce a successful result.",
    registry: packageProvenance?.registryProvenance?.registry ?? null,
    policy: "Postpublication is successful only after exact registry metadata, the expected dist-tag, tarball integrity, npm signatures, and a decodable SLSA provenance attestation have all been verified.",
  };
}

export function evaluateReleaseGate({ phase = "prepublication", checks, externalReview, publication }) {
  if (!R05_PHASES.includes(phase)) throw new Error(`Unsupported R05 phase: ${phase}.`);
  const required = new Set(REQUIRED_AUDIT_CHECKS);
  const missing = [...required].filter((id) => !checks.some((check) => check.id === id));
  const failed = checks.filter((check) => required.has(check.id) && check.status !== "passed");
  const publicationAccepted = phase === "prepublication" ? publication.status === "pending" : publication.status === "passed";
  const passed = missing.length === 0 && failed.length === 0 && externalReview.status === "passed" && publicationAccepted;
  return {
    phase,
    passed,
    automatedPassed: missing.length === 0 && failed.length === 0,
    missingChecks: missing,
    failedChecks: failed.map((check) => ({ id: check.id, status: check.status, reason: check.reason ?? check.stderrTail ?? null })),
    externalReview: externalReview.status,
    publication: publication.status,
    failures: [
      ...(missing.length ? [`Missing required audit checks: ${missing.join(", ")}.`] : []),
      ...failed.map((check) => `${check.id} is ${check.status}.`),
      ...(externalReview.status !== "passed" ? [externalReview.reason] : []),
      ...(!publicationAccepted ? [`${phase} publication gate is ${publication.status}; expected ${phase === "prepublication" ? "pending" : "passed"}.`] : []),
    ].filter(Boolean),
  };
}

export function validateReport(report) {
  if (report?.schema !== REPORT_SCHEMA) throw new Error(`Unexpected R05 report schema: ${report?.schema ?? "missing"}`);
  if (!R05_PHASES.includes(report?.phase)) throw new Error(`R05 report phase must be one of ${R05_PHASES.join(" or ")}.`);
  if (!Array.isArray(report.checks)) throw new Error("R05 report checks must be an array.");
  const ids = new Set(report.checks.map((check) => check.id));
  for (const id of REQUIRED_AUDIT_CHECKS) if (!ids.has(id)) throw new Error(`R05 report is missing required check ${id}.`);
  if (report.gate?.passed === true && report.gate?.externalReview !== "passed") throw new Error("R05 cannot pass without external review approval.");
  if (report.gate?.passed === true && report.gate?.automatedPassed !== true) throw new Error("R05 cannot pass with failed automation.");
  if (report.gate?.phase !== report.phase) throw new Error("R05 report gate phase does not match the report phase.");
  if (report.gate?.passed === true && report.phase === "prepublication" && report.publication?.status !== "pending") throw new Error("R05 prepublication cannot pass unless registry publication remains explicitly pending.");
  if (report.gate?.passed === true && report.phase === "postpublication" && report.publication?.status !== "passed") throw new Error("R05 postpublication cannot pass without registry publication verification.");
  return true;
}

function markdown(report) {
  const lines = [
    "# R05 release candidate and GA audit",
    "",
    `- Schema: \`${report.schema}\``,
    `- Generated: \`${report.generatedAt}\``,
    `- Phase: \`${report.phase}\``,
    `- Package: \`${report.environment.package.name}@${report.environment.package.version}\``,
    `- Overall gate: **${report.gate.passed ? "PASS" : "BLOCKED"}**`,
    `- Automated gates: **${report.gate.automatedPassed ? "PASS" : "BLOCKED"}**`,
    `- External TIFF/writer review: **${report.externalReview.status.toUpperCase()}**`,
    `- Publication/provenance: **${report.publication.status.toUpperCase()}**`,
    "",
    "This is a redistribution-safe audit record. It contains no external corpus, reference image, ICC profile, or other third-party payload.",
    "",
    "## Environment and candidate identity",
    "",
    `- Node: \`${report.environment.runtime.node}\`; platform: \`${report.environment.runtime.platform}\`; architecture: \`${report.environment.runtime.architecture}\`.`,
    `- Package manager: \`${report.environment.packageManager.name}\`; user agent: \`${report.environment.packageManager.version}\`.`,
    `- Repository HEAD observed by the audit: \`${report.environment.git.head ?? "unavailable"}\`.`,
    `- Source worktree dirty at audit time: \`${report.environment.git.dirty}\`.`,
    `- Candidate tracked diff files: ${report.candidate.trackedDiff.length}; candidate untracked files: ${report.candidate.untracked.length}.`,
    "- A clean-clone result is accepted only from `R05_CLEAN_CHECKOUT`, which must be a clean checkout of the exact candidate; a dirty source tree, tarball, or HEAD-only clone is not substituted.",
    "",
    "## Pinned tools, standards, and retained evidence",
    "",
    ...Object.entries(report.tooling.pinnedPackages).map(([name, version]) => `- ${name}: \`${version ?? "unavailable"}\`.`),
    `- External corpus commit: \`${report.tooling.corpusCommit ?? "not supplied for this run"}\`.`,
    ...Object.entries(report.tooling.manifestHashes).map(([path, hash]) => `- \`${path}\`: SHA-256 \`${hash ?? "unavailable"}\`.`),
    "",
    "| Evidence artifact | Present | Bytes | SHA-256 |",
    "| --- | --- | --- | --- |",
    ...report.retainedEvidence.map((entry) => `| ${entry.path} | ${entry.present ? "yes" : "no"} | ${entry.bytes ?? "unknown"} | \`${entry.sha256 ?? "unavailable"}\` |`),
    "",
    "## Required checks",
    "",
    "| Check | Status | Evidence or reason |",
    "| --- | --- | --- |",
    ...report.checks.map((check) => `| ${check.id} | **${String(check.status).toUpperCase()}** | ${(check.reason ?? check.command ?? check.policy ?? "recorded").replaceAll("|", "\\|")} |`),
    "",
    "## External review gate",
    "",
    `- Status: **${report.externalReview.status.toUpperCase()}**.`,
    `- ${report.externalReview.reason ?? `Retained record: ${report.externalReview.record}.`}`,
    "- The review packet is prepared in `R05_EXTERNAL_REVIEW_PACKET.md`; it is not an approval record.",
    "",
    "## Publication gate",
    "",
    `- Status: **${report.publication.status.toUpperCase()}**.`,
    `- ${report.publication.reason}`,
    report.phase === "prepublication" ? "- Prepublication does not publish, tag, commit, or push. A `pending` registry result is intentional and is not a successful postpublication claim." : "- Postpublication verifies the registry tarball, integrity, expected dist-tag, npm signatures, and provenance; no publication action is performed by this verifier.",
    "",
    "## Failures and unproven criteria",
    "",
    ...(report.gate.failures.length ? report.gate.failures.map((failure) => `- ${failure}`) : ["None."]),
    "",
    "The overall gate is deliberately fail-closed. Unavailable runtimes, scanners, corpora, references, clean checkouts, or human review are not successful evidence.",
    "",
  ];
  return `${lines.join("\n")}\n`;
}

async function main() {
  const phase = requestedPhase();
  const packageJson = await packageManifest();
  const directory = await reportDirectory();
  await mkdir(directory, { recursive: true });
  const checks = await runChecks(phase);
  const report = {
    schema: REPORT_SCHEMA,
    phase,
    generatedAt: now(),
    environment: await environmentRecord(),
    tooling: await toolingRecord(),
    candidate: await gitCandidateFiles(),
    retainedEvidence: await retainedEvidence(),
    policy: {
      requiredChecks: REQUIRED_AUDIT_CHECKS,
      noRunIsPass: true,
      externalAssets: "temporary untracked storage only; only paths, byte lengths, and hashes may be retained",
      unsupportedClaims: "fully featured, safest, and fastest require defined scope and direct evidence",
      publication: phase === "prepublication" ? "Prepublication gates publication and leaves registry provenance explicitly pending." : "Postpublication verifies registry metadata and provenance; it never publishes.",
    },
    checks,
    externalReview: await externalReviewGate(),
    publication: publicationGate(packageJson, phase, checks.find((check) => check.id === "package-provenance")),
  };
  report.gate = evaluateReleaseGate(report);
  validateReport(report);
  const jsonPath = outputPath(directory, "r05-release-audit.json");
  const markdownPath = outputPath(directory, "r05-release-audit.md");
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, markdown(report), "utf8");
  process.stdout.write(`R05 release audit ${report.gate.passed ? "passed" : "blocked"}. Reports: ${jsonPath}, ${markdownPath}\n`);
  if (!report.gate.passed) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();

export { REPORT_SCHEMA, documentationAudit, expectedDistTag, markdown, packageLicenseAudit, registryProvenanceAudit };
