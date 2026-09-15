import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const packageManifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
assert.equal(packageManifest.bin?.["image-metadata"], "./cli/index.mjs", "R03 bin declaration drifted");
const cli = await readFile(join(root, "cli/index.mjs"), "utf8");
for (const command of ["inspect", "audit", "sanitize", "edit", "verify", "benchmark-file"]) assert.ok(cli.includes(`command === "${command}"`) || cli.includes(`command === '${command}'`), `CLI command is not implemented: ${command}`);
const core = await readFile(join(root, "dist/index.js"), "utf8");
assert.ok(!core.includes("cli/index.mjs") && !core.includes("node:child_process"), "core bundle imports CLI code");
assert.ok(!/node:(?:fs|path|process|crypto|child_process)/u.test(core), "core browser bundle imports Node-only CLI modules");
console.log("CLI contract verified: six commands and core dependency isolation.");
