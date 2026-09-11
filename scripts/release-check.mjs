import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const root = resolve(import.meta.dirname, "..");
const execFile = promisify(execFileCallback);
const brand = "browser-image-metadata";

async function text(path) {
  return readFile(join(root, path), "utf8");
}

async function gitStatus() {
  return (await execFile("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: root })).stdout.trim();
}

const packageJson = JSON.parse(await text("package.json"));
assert.equal(packageJson.name, brand, "The npm package name must remain browser-image-metadata.");
assert.equal(packageJson.description.includes("image metadata"), true, "The package description must describe image metadata.");

const readme = await text("README.md");
assert.equal(readme.startsWith(`# ${brand}\n`), true, "README title must match the public package brand.");
assert.match(readme, new RegExp(`npm install ${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
assert.match(readme, new RegExp(`from ["']${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
assert.ok(readme.indexOf("> **Support boundaries:**") >= 0 && readme.indexOf("> **Support boundaries:**") < 1000, "README must expose unsupported and partial behavior above the fold.");
assert.doesNotMatch(readme, /2\.0\.0-alpha\.2/, "README examples must not reference an older unreleased package version.");

for (const document of ["API.md", "CAPABILITIES.md", "MIGRATION.md", "CONTRIBUTING.md", "PUBLISHING.md", "BENCHMARKS.md", "EXTERNAL_CORPORA.md"]) {
  assert.match(await text(document), new RegExp(brand), `${document} must use the public package brand.`);
}

await execFile(process.execPath, ["scripts/generate-capabilities.mjs", "--check"], { cwd: root });
const status = await gitStatus();
assert.equal(status, "", `Release must start from a clean tracked and untracked tree.\n${status}`);
console.log(`Release preflight passed for ${brand} ${packageJson.version}.`);
