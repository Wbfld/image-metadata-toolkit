import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const tag = process.env.RELEASE_TAG;
assert.equal(typeof tag, "string", "RELEASE_TAG must be set to the release tag.");
const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
assert.equal(tag, `v${manifest.version}`, `Release tag ${tag} must match package version v${manifest.version}.`);
console.log(`Release tag ${tag} matches package version ${manifest.version}.`);
