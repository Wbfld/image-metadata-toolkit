import { open, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { parseMetadata as parseCoreMetadata } from "../src/index.js";
import { parseMetadata as parseNodeMetadata, type NodeFileHandle, type SeekableFileSource } from "../src/node.js";

const fixtureUrl = new URL("./fixtures/jpeg-exif-little-endian.jpg", import.meta.url);

async function temporaryFixture(): Promise<{ readonly path: string; readonly cleanup: () => Promise<void> }> {
  const directory = await mkdtemp(join(tmpdir(), "browser-image-metadata-node-"));
  const path = join(directory, "fixture.jpg");
  await writeFile(path, await readFile(fixtureUrl));
  return { path, cleanup: () => rm(directory, { recursive: true, force: true }) };
}

describe("Node input adapters", () => {
  it("reads a path through the Node-only entry and keeps paths out of the core entry", async () => {
    const fixture = await temporaryFixture();
    try {
      const result = await parseNodeMetadata(fixture.path, { scope: "metadata" });
      expect(result.format).toBe("jpeg");
      expect(result.dimensions).toEqual({ width: 2, height: 2 });
      await expect(parseCoreMetadata(fixture.path as never)).rejects.toMatchObject({ code: "INVALID_VALUE" });
    } finally {
      await fixture.cleanup();
    }
  });

  it("accepts a native FileHandle and closes it after a successful read", async () => {
    const fixture = await temporaryFixture();
    const handle = await open(fixture.path, "r");
    try {
      const result = await parseNodeMetadata(handle, { scope: "metadata" });
      expect(result.format).toBe("jpeg");
      await expect(handle.stat()).rejects.toThrow();
    } finally {
      await fixture.cleanup();
    }
  });

  it("closes a FileHandle when validation fails before reading", async () => {
    const fixture = await temporaryFixture();
    const handle = await open(fixture.path, "r");
    try {
      await expect(parseNodeMetadata(handle, { limits: { maxInputBytes: 1 } })).rejects.toMatchObject({ code: "LIMIT_EXCEEDED" });
      await expect(handle.stat()).rejects.toThrow();
    } finally {
      await fixture.cleanup();
    }
  });

  it("closes a FileHandle when an in-flight read is aborted", async () => {
    const bytes = await readFile(fixtureUrl);
    let closed = false;
    let allowRead: (() => void) | undefined;
    const readReleased = new Promise<void>((resolve) => { allowRead = resolve; });
    const handle: NodeFileHandle = {
      stat: () => Promise.resolve({ size: bytes.byteLength }),
      read: (buffer, offset, length, position) => readReleased.then(() => {
        buffer.set(bytes.subarray(position, position + length), offset);
        return { bytesRead: length, buffer };
      }),
      close: () => { closed = true; return Promise.resolve(); },
    };
    const controller = new AbortController();
    const pending = parseNodeMetadata(handle, { signal: controller.signal });
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: "ABORTED" });
    expect(closed).toBe(true);
    allowRead?.();
  });

  it("uses a seekable source for bounded metadata ranges and closes it", async () => {
    const bytes = await readFile(fixtureUrl);
    const ranges: Array<readonly [number, number]> = [];
    let closed = false;
    const source: SeekableFileSource = {
      size: bytes.byteLength,
      read: (start, end) => {
        ranges.push([start, end]);
        return Promise.resolve(bytes.subarray(start, end));
      },
      close: () => { closed = true; return Promise.resolve(); },
    };
    const result = await parseNodeMetadata(source, { scope: "metadata" });
    expect(result.format).toBe("jpeg");
    expect(ranges.length).toBeGreaterThan(0);
    expect(ranges.every(([start, end]) => start >= 0 && end <= bytes.byteLength && end >= start)).toBe(true);
    expect(closed).toBe(true);
  });

  it("closes an oversized seekable source and supports explicit external ownership", async () => {
    const bytes = await readFile(fixtureUrl);
    let oversizedClosed = false;
    const oversized: SeekableFileSource = {
      size: bytes.byteLength,
      read: (start, end) => Promise.resolve(bytes.subarray(start, end)),
      close: () => { oversizedClosed = true; return Promise.resolve(); },
    };
    await expect(parseNodeMetadata(oversized, { limits: { maxInputBytes: 1 } })).rejects.toMatchObject({ code: "LIMIT_EXCEEDED" });
    expect(oversizedClosed).toBe(true);

    let externallyOwnedClosed = false;
    const externallyOwned: SeekableFileSource = {
      size: bytes.byteLength,
      read: (start, end) => Promise.resolve(bytes.subarray(start, end)),
      close: () => { externallyOwnedClosed = true; return Promise.resolve(); },
    };
    const result = await parseNodeMetadata(externallyOwned, { scope: "metadata", closeSource: false });
    expect(result.format).toBe("jpeg");
    expect(externallyOwnedClosed).toBe(false);
  });

  it("spools non-seekable streams under the input bound and documents full materialization in behavior", async () => {
    const bytes = await readFile(fixtureUrl);
    async function* chunks(): AsyncGenerator<Uint8Array> {
      await Promise.resolve();
      yield bytes.subarray(0, 17);
      yield bytes.subarray(17);
    }
    const result = await parseNodeMetadata(chunks(), { scope: "metadata" });
    expect(result.format).toBe("jpeg");
    expect(result.completeness.scope).toBe("full");
    await expect(parseNodeMetadata((async function* (): AsyncGenerator<Uint8Array> { await Promise.resolve(); yield bytes; })(), { limits: { maxInputBytes: bytes.byteLength - 1 } })).rejects.toMatchObject({ code: "LIMIT_EXCEEDED" });
  });

  it("aborts a non-seekable stream while waiting for its next chunk", async () => {
    let release: (() => void) | undefined;
    const waiting = new Promise<void>((resolve) => { release = resolve; });
    async function* stream(): AsyncGenerator<Uint8Array> {
      await waiting;
      yield Uint8Array.of(0xff, 0xd8, 0xff);
    }
    const controller = new AbortController();
    const pending = parseNodeMetadata(stream(), { signal: controller.signal });
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: "ABORTED" });
    release?.();
  });
});
