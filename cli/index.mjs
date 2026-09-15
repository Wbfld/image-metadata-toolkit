#!/usr/bin/env node
import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { access, lstat, open, readFile, realpath, rename, rm, stat } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import process from "node:process";
import { URL } from "node:url";
import {
  DEFAULT_LIMITS,
  PRIVACY_POLICY_PRESETS,
  auditPrivacy,
  editMetadata,
  parseMetadata,
  sanitizeMetadata,
  toJsonSafe,
  toJsonSafeResult,
  verifyPreservation,
} from "../dist/index.js";

const EXIT = Object.freeze({ success: 0, usage: 2, unsupported: 3, incomplete: 4, policy: 5, malformed: 6, verification: 7, io: 8, internal: 9 });
const COMMANDS = Object.freeze(["inspect", "audit", "sanitize", "edit", "verify", "benchmark-file"]);
const PACKAGE_URL = new URL("../package.json", import.meta.url);
const packageManifest = JSON.parse(await readFile(PACKAGE_URL, "utf8"));
const operationAbort = new globalThis.AbortController();
process.once("SIGINT", () => operationAbort.abort());
process.once("SIGTERM", () => operationAbort.abort());

function usage(command = null) {
  const commandHelp = command === null ? "" : `\n\n${command} options:\n  ${command === "inspect" ? "[input] [--table]" : command === "audit" ? "[input] [--raw-values] [--table]" : command === "sanitize" ? "[input] --policy <id> [--output <path>] [--table]" : command === "edit" ? "[input] --operation <json>... [--output <path>] [--table]" : command === "verify" ? "<input> <output> [--table]" : "[input] [--operation inspect|audit] [--warmup <n>] [--iterations <n>] [--table]"}`;
  return `browser-image-metadata ${packageManifest.version}\n\nUsage: image-metadata <command> [options] [input]\n\nCommands:\n  inspect          Parse bounded metadata and provenance\n  audit            Inspect privacy findings (safe by default)\n  sanitize         Apply a named T02 policy\n  edit             Apply typed mutation operations\n  verify           Verify W08 preservation between two files\n  benchmark-file   Measure one bounded library operation\n\nGlobal options:\n  --help           Show help\n  --version        Show version\n  --table          Use a readable table instead of JSON\n  --output <path>  Write binary output to a new destination\n  -                Read input from stdin${commandHelp}`;
}

function parseArgs(argv) {
  const args = [...argv];
  const command = args.shift();
  if (command === undefined || command === "--help" || command === "-h") return { command: null, options: {}, positionals: [], help: true };
  if (command === "--version") return { command: null, options: {}, positionals: [], version: true };
  if (!COMMANDS.includes(command)) throw Object.assign(new Error(`Unknown command: ${command}`), { exitCode: EXIT.usage });
  const options = {};
  const positionals = [];
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token === "--help" || token === "-h") options.help = true;
    else if (token === "--table") options.table = true;
    else if (token === "--raw-values") options.rawValues = true;
    else if (token === "--policy" || token === "--output" || token === "--operation" || token === "--warmup" || token === "--iterations") {
      const value = args[++index];
      if (value === undefined || value.startsWith("--")) throw Object.assign(new Error(`${token} requires a value.`), { exitCode: EXIT.usage });
      if (token === "--operation") {
        if (Buffer.byteLength(value, "utf8") > DEFAULT_LIMITS.maxAdapterOutputBytes || (options.operations?.length ?? 0) >= 256) throw Object.assign(new Error("--operation exceeds the bounded CLI operation budget."), { exitCode: EXIT.usage });
        (options.operations ??= []).push(value);
      }
      else options[token.slice(2).replaceAll("-", "")] = value;
    } else if (token.startsWith("--")) throw Object.assign(new Error(`Unknown option: ${token}`), { exitCode: EXIT.usage });
    else positionals.push(token);
  }
  if (positionals.length > (command === "verify" ? 2 : 1)) throw Object.assign(new Error("Too many input paths."), { exitCode: EXIT.usage });
  return { command, options, positionals };
}

function numberOption(value, name, fallback, maximum = 1000) {
  if (value === undefined) return fallback;
  if (!/^\d+$/u.test(value)) throw Object.assign(new Error(`${name} must be a non-negative integer.`), { exitCode: EXIT.usage });
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > maximum) throw Object.assign(new Error(`${name} exceeds the supported bound.`), { exitCode: EXIT.usage });
  return parsed;
}

async function readStdin() {
  const chunks = [];
  let total = 0;
  for await (const chunk of process.stdin) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += bytes.byteLength;
    if (total > DEFAULT_LIMITS.maxInputBytes) throw Object.assign(new Error("stdin exceeds maxInputBytes."), { exitCode: EXIT.malformed });
    chunks.push(bytes);
  }
  return new Uint8Array(Buffer.concat(chunks, total));
}

async function inputBytes(path) {
  if (path === undefined || path === "-") return readStdin();
  const info = await stat(path);
  if (!info.isFile()) throw new Error("Input path is not a regular file.");
  if (info.size > DEFAULT_LIMITS.maxInputBytes) throw Object.assign(new Error("Input exceeds maxInputBytes."), { exitCode: EXIT.malformed });
  return new Uint8Array(await readFile(path));
}

function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function json(value) { return `${JSON.stringify(toJsonSafe(value), null, 2)}\n`; }
function stripControls(value) {
  let output = "";
  for (const character of String(value)) {
    const code = character.codePointAt(0) ?? 0;
    output += code < 0x20 || (code >= 0x7f && code <= 0x9f) ? "�" : character;
  }
  return output;
}
function table(value) {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value : { value };
  return Object.entries(record).map(([key, item]) => `${stripControls(key)}\t${stripControls(typeof item === "string" ? item : JSON.stringify(item))}`).join("\n") + "\n";
}
function emit(value, asTable) { process.stdout.write(asTable ? table(value) : json(value)); }
function throwIfAborted() { if (operationAbort.signal.aborted) throw Object.assign(new Error("CLI operation was aborted."), { exitCode: EXIT.io }); }

async function destinationGuard(sourcePath, destination) {
  if (destination === undefined || destination === "-") return;
  if (sourcePath !== undefined && sourcePath !== "-") {
    const sourceReal = await realpath(sourcePath);
    try {
      const destinationReal = await realpath(destination);
      if (sourceReal === destinationReal) throw Object.assign(new Error("Output destination aliases the source."), { exitCode: EXIT.io });
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    const sourceStat = await stat(sourcePath);
    try {
      const destinationStat = await stat(destination);
      if (sourceStat.dev === destinationStat.dev && sourceStat.ino === destinationStat.ino) throw Object.assign(new Error("Output destination aliases the source."), { exitCode: EXIT.io });
      throw Object.assign(new Error("Output destination already exists; refusing overwrite."), { exitCode: EXIT.io });
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  } else {
    try { await lstat(destination); throw Object.assign(new Error("Output destination already exists; refusing overwrite."), { exitCode: EXIT.io }); } catch (error) { if (error?.code !== "ENOENT") throw error; }
  }
  const parent = dirname(resolve(destination));
  await access(parent);
}

async function atomicWrite(destination, bytes) {
  throwIfAborted();
  if (destination === "-") { process.stdout.write(Buffer.from(bytes)); return { path: "-", byteLength: bytes.byteLength, sha256: sha256(bytes) }; }
  const absolute = resolve(destination);
  const temporary = join(dirname(absolute), `.${basename(absolute)}.${process.pid}.${Date.now()}.tmp`);
  let handle;
  try {
    handle = await open(temporary, "wx", 0o600);
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close(); handle = undefined;
    throwIfAborted();
    await rename(temporary, absolute);
    return { path: absolute, byteLength: bytes.byteLength, sha256: sha256(bytes) };
  } catch (error) {
    await handle?.close().catch(() => undefined);
    await rm(temporary, { force: true }).catch(() => undefined);
    throw error;
  }
}

function outputSummary(result, output) {
  const safe = toJsonSafe(result);
  if (safe && typeof safe === "object" && !Array.isArray(safe)) {
    const record = { ...safe };
    delete record.data;
    return output === undefined ? record : { ...record, output };
  }
  return output === undefined ? safe : { result: safe, output };
}

function exitCodeFor(error) {
  if (typeof error?.exitCode === "number") return error.exitCode;
  if (error?.code === "UNSUPPORTED_FORMAT" || error?.code === "UNSUPPORTED_OPERATION") return EXIT.unsupported;
  if (error?.code === "TRUNCATED_DATA" || error?.code === "INVALID_VALUE" || error?.code === "UNSAFE_OFFSET" || error?.code === "UNSAFE_STRUCTURE") return EXIT.malformed;
  if (error?.code === "POLICY_FAILURE") return EXIT.policy;
  if (error?.code === "VERIFICATION_FAILURE") return EXIT.verification;
  if (error?.code === "ENOENT" || error?.code === "EACCES" || error?.code === "EEXIST") return EXIT.io;
  return EXIT.internal;
}

async function commandResult(parsed) {
  throwIfAborted();
  const { command, options, positionals } = parsed;
  if (options.help) { process.stdout.write(`${usage(command)}\n`); return { exit: EXIT.success, emitted: true }; }
  const source = positionals[0];
  if (command === "verify") {
    if (positionals.length !== 2) throw Object.assign(new Error("verify requires input and output paths."), { exitCode: EXIT.usage });
    if (positionals[0] === "-" || positionals[1] === "-") throw Object.assign(new Error("verify requires two distinct file inputs; stdin cannot represent both sides."), { exitCode: EXIT.usage });
    const result = await verifyPreservation(await inputBytes(positionals[0]), await inputBytes(positionals[1]));
    return { value: result, exit: result.successful ? EXIT.success : EXIT.verification };
  }
  const bytes = await inputBytes(source);
  if (command === "inspect") {
    const result = await parseMetadata(bytes, { signal: operationAbort.signal });
    return { value: toJsonSafeResult(result), exit: result.format === "unknown" ? EXIT.unsupported : result.completeness.complete ? EXIT.success : EXIT.incomplete };
  }
  if (command === "audit") {
    const result = await auditPrivacy(bytes, { includeRawValues: options.rawValues === true, signal: operationAbort.signal });
    return { value: result, exit: result.format === "unknown" ? EXIT.unsupported : result.coverage.wholeFile === "complete" ? EXIT.success : EXIT.incomplete };
  }
  if (command === "sanitize") {
    if (options.policy === undefined || !Object.hasOwn(PRIVACY_POLICY_PRESETS, options.policy)) throw Object.assign(new Error("sanitize requires a known --policy."), { exitCode: EXIT.usage });
    if (options.output === undefined) throw Object.assign(new Error("sanitize requires --output or --output - for binary output."), { exitCode: EXIT.usage });
    await destinationGuard(source, options.output);
    const result = await sanitizeMetadata(bytes, { policy: options.policy, signal: operationAbort.signal });
    if (!result.successful || result.data === null) return { value: outputSummary(result), exit: result.policy?.complete === false ? EXIT.incomplete : EXIT.policy };
    const output = options.output === undefined ? undefined : await atomicWrite(options.output, result.data);
    return output?.path === "-" ? { value: null, diagnostic: outputSummary(result, output), exit: EXIT.success, emitted: true } : { value: outputSummary(result, output), exit: EXIT.success };
  }
  if (command === "edit") {
    if (!Array.isArray(options.operations) || options.operations.length === 0) throw Object.assign(new Error("edit requires at least one --operation JSON value."), { exitCode: EXIT.usage });
    if (options.output === undefined) throw Object.assign(new Error("edit requires --output <path> or --output -; mutation results are never silently discarded."), { exitCode: EXIT.usage });
    let operations;
    try { operations = options.operations.map((item) => JSON.parse(item)); } catch { throw Object.assign(new Error("Each --operation must be valid JSON."), { exitCode: EXIT.usage }); }
    await destinationGuard(source, options.output);
    const result = await editMetadata(bytes, { operations, policy: { verification: "reparse-and-preserve-payload" }, signal: operationAbort.signal });
    if (!result.successful || result.data === null) return { value: outputSummary(result), exit: result.status === "verification-failure" ? EXIT.verification : result.status === "policy-failure" ? EXIT.policy : result.status === "unsupported" ? EXIT.unsupported : EXIT.malformed };
    const output = options.output === undefined ? undefined : await atomicWrite(options.output, result.data);
    return output?.path === "-" ? { value: null, diagnostic: outputSummary(result, output), exit: EXIT.success, emitted: true } : { value: outputSummary(result, output), exit: EXIT.success };
  }
  if (command === "benchmark-file") {
    const warmup = numberOption(options.warmup, "--warmup", 1, 20); const iterations = numberOption(options.iterations, "--iterations", 5, 100);
    const operation = options.operation ?? "inspect"; if (!["inspect", "audit"].includes(operation)) throw Object.assign(new Error("benchmark-file --operation must be inspect or audit."), { exitCode: EXIT.usage });
    for (let index = 0; index < warmup; index += 1) await (operation === "inspect" ? parseMetadata(bytes, { signal: operationAbort.signal }) : auditPrivacy(bytes, { signal: operationAbort.signal }));
    const samples = []; const startMemory = process.memoryUsage().rss; const start = process.hrtime.bigint();
    for (let index = 0; index < iterations; index += 1) { const sampleStart = process.hrtime.bigint(); await (operation === "inspect" ? parseMetadata(bytes, { signal: operationAbort.signal }) : auditPrivacy(bytes, { signal: operationAbort.signal })); samples.push(Number(process.hrtime.bigint() - sampleStart) / 1e6); }
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
    return { value: { operation, input: { byteLength: bytes.byteLength, sha256: sha256(bytes) }, package: { name: packageManifest.name, version: packageManifest.version }, runtime: { node: process.version, platform: process.platform, arch: process.arch }, warmup, iterations, elapsedMs, meanMs: elapsedMs / iterations, samplesMs: samples, rssDeltaBytes: process.memoryUsage().rss - startMemory, limits: { maxInputBytes: DEFAULT_LIMITS.maxInputBytes, maxAdapterOutputBytes: DEFAULT_LIMITS.maxAdapterOutputBytes } }, exit: EXIT.success };
  }
  throw Object.assign(new Error(`Unsupported command: ${command}`), { exitCode: EXIT.usage });
}

let parsed;
try { parsed = parseArgs(process.argv.slice(2)); } catch (error) { process.stderr.write(`${stripControls(error.message)}\n\n${usage()}\n`); process.exitCode = error.exitCode ?? EXIT.usage; }
if (parsed?.help === true) process.stdout.write(`${usage()}\n`);
else if (parsed?.version === true) process.stdout.write(`${packageManifest.version}\n`);
else if (parsed !== undefined) {
  try {
    const result = await commandResult(parsed);
    if (result.diagnostic !== undefined) process.stderr.write(json(result.diagnostic));
    if (!result.emitted) emit(result.value, parsed.options.table === true);
    process.exitCode = result.exit;
  } catch (error) {
    const code = exitCodeFor(error);
    process.stderr.write(`${stripControls(error instanceof Error ? error.message : "CLI operation failed.")}\n`);
    process.exitCode = code;
  }
}
