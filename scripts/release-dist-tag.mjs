import { appendFile, readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const prerelease = packageJson.version.split("+", 1)[0].split("-", 2)[1];
const tag = prerelease ? prerelease.split(".", 1)[0] : "latest";

if (!/^[a-z][a-z0-9-]*$/u.test(tag)) throw new Error(`The derived npm dist-tag is invalid: ${tag}.`);
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `tag=${tag}\n`, "utf8");
process.stdout.write(`npm dist-tag for ${packageJson.name}@${packageJson.version}: ${tag}\n`);
