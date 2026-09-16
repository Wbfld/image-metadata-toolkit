import { execFile as execFileCallback, spawn } from "node:child_process";
import { link, mkdtemp, readFile, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFile = promisify(execFileCallback);
const root = resolve(process.cwd());
const fixture = join(root, "tests/fixtures/jpeg-exif-little-endian.jpg");
const childProcessEnvironment = Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== "npm_config_dry_run" && key !== "npm_config_dry-run"));
const operation = JSON.stringify({ op: "set", operationId: "cli-title", target: { kind: "field", fieldId: "XMP:dc:title" }, value: "CLI title" });
type CliOutput = { readonly format?: unknown; readonly output?: { readonly path?: unknown; readonly byteLength?: unknown } };
function parseCliOutput(value: string): CliOutput { return JSON.parse(value) as CliOutput; }

async function run(nodePath: string, args: string[], cwd: string) {
  try {
    const result = await execFile(process.execPath, [nodePath, ...args], { cwd, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
    return { status: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    const value = error as { code?: number; stdout?: string; stderr?: string };
    return { status: typeof value.code === "number" ? value.code : 1, stdout: value.stdout ?? "", stderr: value.stderr ?? "" };
  }
}

async function runWithInput(nodePath: string, args: string[], input: Uint8Array, cwd: string) {
  return new Promise<{ status: number; stdout: string; stderr: string }>((resolveResult) => {
    const child = spawn(process.execPath, [nodePath, ...args], { cwd, stdio: ["pipe", "pipe", "pipe"] });
    const stdout: Buffer[] = []; const stderr: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk)); child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("close", (status) => resolveResult({ status: status ?? 1, stdout: Buffer.concat(stdout).toString("utf8"), stderr: Buffer.concat(stderr).toString("utf8") }));
    child.stdin.end(input);
  });
}

describe("R03 isolated CLI", () => {
  it("runs every command in JSON and table modes and keeps direct semantics", async () => {
    const directory = await mkdtemp(join(tmpdir(), "browser-image-metadata-cli-"));
    try {
      const output = join(directory, "edited.jpg");
      const inspect = await run(join(root, "cli/index.mjs"), ["inspect", fixture], root);
      expect(inspect.status).toBe(0); expect(parseCliOutput(inspect.stdout).format).toBe("jpeg");
      expect((await run(join(root, "cli/index.mjs"), ["inspect", fixture, "--table"], root)).status).toBe(0);
      expect((await run(join(root, "cli/index.mjs"), ["audit", fixture], root)).status).toBe(0);
      expect((await run(join(root, "cli/index.mjs"), ["audit", fixture, "--table"], root)).status).toBe(0);
      const missingOutput = await run(join(root, "cli/index.mjs"), ["sanitize", fixture, "--policy", "forensic-preserve"], root);
      expect(missingOutput.status).toBe(2); expect(missingOutput.stderr).toContain("requires --output");
      const refused = await run(join(root, "cli/index.mjs"), ["sanitize", fixture, "--policy", "share-safe", "--output", output], root);
      expect(refused.status).toBe(5); await expect(stat(output)).rejects.toMatchObject({ code: "ENOENT" });
      const sanitized = await run(join(root, "cli/index.mjs"), ["sanitize", fixture, "--policy", "forensic-preserve", "--output", output], root);
      expect(sanitized.status).toBe(0); expect(parseCliOutput(sanitized.stdout).output?.path).toBe(resolve(output));
      await rm(output);
      const edited = await run(join(root, "cli/index.mjs"), ["edit", fixture, "--operation", operation, "--output", output], root);
      expect(edited.status).toBe(0); expect(edited.stdout.length).toBeGreaterThan(0); expect(Number(parseCliOutput(edited.stdout).output?.byteLength)).toBeGreaterThan(0);
      expect((await run(join(root, "cli/index.mjs"), ["edit", fixture, "--operation", operation, "--output", output, "--table"], root)).status).toBe(8);
      expect((await run(join(root, "cli/index.mjs"), ["verify", fixture, output], root)).status).toBe(0);
      expect((await run(join(root, "cli/index.mjs"), ["verify", fixture, output, "--table"], root)).status).toBe(0);
      expect((await run(join(root, "cli/index.mjs"), ["benchmark-file", fixture, "--warmup", "0", "--iterations", "2"], root)).status).toBe(0);
      expect((await run(join(root, "cli/index.mjs"), ["benchmark-file", fixture, "--warmup", "0", "--iterations", "2", "--table"], root)).status).toBe(0);
      const stdin = await runWithInput(join(root, "cli/index.mjs"), ["inspect", "-"], await readFile(fixture), root);
      expect(stdin.status).toBe(0); expect(parseCliOutput(stdin.stdout).format).toBe("jpeg");
      const help = await run(join(root, "cli/index.mjs"), ["edit", "--help"], root); expect(help.status).toBe(0); expect(help.stdout).toContain("--operation");
    } finally { await rm(directory, { recursive: true, force: true }); }
  }, 30_000);

  it("rejects malformed input, source aliases, existing destinations, and terminal controls", async () => {
    const directory = await mkdtemp(join(tmpdir(), "browser-image-metadata-cli-limits-"));
    try {
      const malformed = join(directory, "malformed.bin"); const existing = join(directory, "existing.jpg"); const alias = join(directory, "alias.jpg"); const hardlink = join(directory, "hardlink.jpg");
      await writeFile(malformed, Buffer.from([0, 1, 2, 3])); await writeFile(existing, await readFile(fixture));
      await symlink(fixture, alias); await link(fixture, hardlink);
      const bad = await run(join(root, "cli/index.mjs"), ["inspect", malformed], root); expect([3, 4, 6]).toContain(bad.status);
      const same = await run(join(root, "cli/index.mjs"), ["edit", fixture, "--operation", operation, "--output", fixture], root); expect(same.status).toBe(8);
      const destination = await run(join(root, "cli/index.mjs"), ["edit", fixture, "--operation", operation, "--output", existing], root); expect(destination.status).toBe(8);
      expect((await run(join(root, "cli/index.mjs"), ["edit", fixture, "--operation", operation, "--output", alias], root)).status).toBe(8);
      expect((await run(join(root, "cli/index.mjs"), ["edit", fixture, "--operation", operation, "--output", hardlink], root)).status).toBe(8);
      const terminal = await run(join(root, "cli/index.mjs"), ["edit", fixture, "--operation", "{\"op\":\"set\",\"operationId\":\"\u001b[31m\",\"target\":{\"kind\":\"field\",\"fieldId\":\"XMP:dc:title\"},\"value\":\"x\"}"], root);
      expect(terminal.status).not.toBe(0); expect(terminal.stderr).not.toContain("\u001b[");
    } finally { await rm(directory, { recursive: true, force: true }); }
  }, 30_000);

  it("runs from the packed tarball and keeps the package bin declaration", async () => {
    const directory = await mkdtemp(join(tmpdir(), "browser-image-metadata-cli-pack-"));
    try {
      const packed = JSON.parse((await execFile("npm", ["pack", "--json", "--cache", join(directory, "npm-cache"), "--pack-destination", directory], { cwd: root, encoding: "utf8", env: childProcessEnvironment })).stdout) as Array<{ filename: string }>;
      const tarball = packed.at(0)?.filename; expect(tarball).toBeDefined();
      await execFile("tar", ["-xzf", join(directory, tarball as string), "-C", directory], { cwd: root });
      const manifest = JSON.parse(await readFile(join(directory, "package/package.json"), "utf8")) as { bin: { "image-metadata": string } };
      expect(manifest.bin["image-metadata"]).toBe("./cli/index.mjs");
      const packedCli = join(directory, "package/cli/index.mjs"); const packedOutput = join(directory, "packed-edited.jpg");
      const result = await run(packedCli, ["inspect", fixture], root);
      expect(result.status).toBe(0); expect(parseCliOutput(result.stdout).format).toBe("jpeg");
      for (const command of [["inspect", fixture, "--table"], ["audit", fixture], ["audit", fixture, "--table"], ["benchmark-file", fixture, "--warmup", "0", "--iterations", "1"], ["benchmark-file", fixture, "--warmup", "0", "--iterations", "1", "--table"]]) expect((await run(packedCli, command, root)).status).toBe(0);
      expect((await run(packedCli, ["sanitize", fixture, "--policy", "forensic-preserve", "--output", packedOutput], root)).status).toBe(0);
      await rm(packedOutput);
      expect((await run(packedCli, ["edit", fixture, "--operation", operation, "--output", packedOutput], root)).status).toBe(0);
      expect((await run(packedCli, ["verify", fixture, packedOutput], root)).status).toBe(0);
    } finally { await rm(directory, { recursive: true, force: true }); }
  }, 120_000);
});
