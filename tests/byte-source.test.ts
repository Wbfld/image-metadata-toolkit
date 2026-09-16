import { describe, expect, it } from "vitest";
import { createByteSource, MetadataError } from "../src/index.js";
import { resolveLimits } from "../src/security/limits.js";

describe("ByteSource", () => {
  it("validates ranges, caches repeated reads, and coalesces overlapping reads", async () => {
    const source = createByteSource(Uint8Array.from([0, 1, 2, 3, 4, 5]), resolveLimits({ maxReadCacheBytes: 32 }));
    await expect(source.read(-1, 1)).rejects.toMatchObject({ code: "UNSAFE_OFFSET" });
    const [first, second] = await Promise.all([source.read(0, 4), source.read(2, 6)]);
    expect([...first]).toEqual([0, 1, 2, 3]);
    expect([...second]).toEqual([2, 3, 4, 5]);
    expect(source.telemetry().readRequests).toBe(1);
    expect(source.telemetry().coalescedReads).toBeGreaterThan(0);
    expect(await source.read(1, 3)).toEqual(Uint8Array.from([1, 2]));
    expect(source.telemetry().cacheHits).toBeGreaterThan(0);
    expect(await source.read(4, 6)).toEqual(Uint8Array.from([4, 5]));
    expect(await source.read(3, 6)).toEqual(Uint8Array.from([3, 4, 5]));
    expect(source.telemetry().bytesRead).toBe(6);
  });

  it("does not merge disjoint queued ranges through unread bytes", async () => {
    const source = createByteSource(Uint8Array.from([0, 1, 2, 3, 4, 5]), resolveLimits({ maxReadCacheBytes: 32 }));
    const [left, right] = await Promise.all([source.read(0, 1), source.read(5, 6)]);
    expect([...left, ...right]).toEqual([0, 5]);
    expect(source.telemetry()).toMatchObject({ readRequests: 2, bytesRead: 2, coalescedReads: 0 });
  });

  it("orders concurrent requests with the same start before coalescing their coverage", async () => {
    const source = createByteSource(Uint8Array.from([0, 1, 2, 3, 4, 5]), resolveLimits({ maxReadCacheBytes: 32 }));
    const [short, long] = await Promise.all([source.read(0, 1), source.read(0, 5)]);
    expect(short).toEqual(Uint8Array.of(0));
    expect(long).toEqual(Uint8Array.from([0, 1, 2, 3, 4]));
    expect(source.telemetry()).toMatchObject({ readRequests: 1, bytesRead: 5, coalescedReads: 1 });
  });

  it("composes partially overlapping reads from cached and missing ranges", async () => {
    const source = createByteSource(Uint8Array.from([0, 1, 2, 3, 4, 5]), resolveLimits({ maxReadCacheBytes: 32 }));
    expect(await source.read(0, 3)).toEqual(Uint8Array.from([0, 1, 2]));
    expect(await source.read(2, 5)).toEqual(Uint8Array.from([2, 3, 4]));
    expect(source.telemetry()).toMatchObject({ readRequests: 2, bytesRead: 5 });
  });

  it("supports Blob/File ranges and enforces request and cumulative byte limits", async () => {
    const source = createByteSource(new Blob([Uint8Array.from([10, 11, 12, 13])]), resolveLimits({ maxReadRequests: 1, maxReadBytes: 3 }));
    expect(await source.read(0, 3)).toEqual(Uint8Array.from([10, 11, 12]));
    await expect(source.read(3, 4)).rejects.toMatchObject({ code: "LIMIT_EXCEEDED" });
    expect(source.telemetry().readRequests).toBe(1);
  });

  it("honors abort signals before a queued range reaches the adapter", async () => {
    const controller = new AbortController();
    controller.abort();
    const source = createByteSource(Uint8Array.of(1, 2), resolveLimits(), controller.signal);
    await expect(source.read(0, 1)).rejects.toBeInstanceOf(MetadataError);
  });

  it("rejects malformed Blob adapters and invalid input sizes without touching the source", async () => {
    const malformedBlob = {
      size: 2,
      slice: () => ({ arrayBuffer: () => Promise.resolve({}) }),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    } as unknown as Blob;
    const malformedSource = createByteSource(malformedBlob, resolveLimits());
    await expect(malformedSource.read(0, 1)).rejects.toMatchObject({ code: "INVALID_VALUE" });

    const noSliceBlob = {
      size: 2,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(2)),
    } as unknown as Blob;
    expect(() => createByteSource(noSliceBlob, resolveLimits())).toThrow(MetadataError);
    expect(() => createByteSource({ size: Number.NaN, arrayBuffer: () => Promise.resolve(new ArrayBuffer()) } as unknown as Blob, resolveLimits())).toThrow(MetadataError);
    expect(() => createByteSource({ size: 1, arrayBuffer: () => Promise.resolve(new ArrayBuffer()) } as unknown as Blob, resolveLimits())).toThrow(MetadataError);
  });

  it("enforces cache eviction, disabled caching, empty reads, and adapter range lengths", async () => {
    const source = createByteSource(Uint8Array.from([0, 1, 2, 3]), resolveLimits({ maxReadCacheBytes: 2 }), undefined, { cacheBytes: 2 });
    expect(await source.read(0, 0)).toEqual(new Uint8Array());
    await source.read(0, 2);
    await source.read(2, 4);
    await source.read(0, 2);
    expect(source.telemetry().cacheBytes).toBeLessThanOrEqual(2);

    const uncached = createByteSource(Uint8Array.from([4, 5]), resolveLimits(), undefined, { cacheBytes: 0 });
    await uncached.read(0, 1);
    await uncached.read(0, 1);
    expect(uncached.telemetry().cacheHits).toBe(0);

    expect(() => createByteSource(new Uint8Array([1, 2]).buffer, resolveLimits({ maxInputBytes: 1 }))).toThrow(MetadataError);
  });
});
