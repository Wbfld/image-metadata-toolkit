import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { createMetadataWorkerClient, installMetadataWorker } from "../src/worker.js";

type Listener = (event: MessageEvent<unknown>) => void;

class TestPort {
  private readonly listeners = new Set<Listener>();
  public peer: TestPort | undefined;

  public postMessage(message: unknown): void {
    for (const listener of this.peer?.listeners ?? []) queueMicrotask(() => listener({ data: message } as MessageEvent<unknown>));
  }

  public addEventListener(_type: "message", listener: Listener): void { this.listeners.add(listener); }
  public removeEventListener(_type: "message", listener: Listener): void { this.listeners.delete(listener); }
}

describe("worker entry point", () => {
  it("round-trips bounded requests through request IDs and cleans up", async () => {
    const clientPort = new TestPort();
    const workerPort = new TestPort();
    clientPort.peer = workerPort;
    workerPort.peer = clientPort;
    const uninstall = installMetadataWorker(workerPort);
    const client = createMetadataWorkerClient(clientPort, { maxPending: 1 });
    const fixture = await readFile(new URL("./fixtures/jpeg-exif-little-endian.jpg", import.meta.url));
    const result = await client.parse(fixture);
    expect(result.format).toBe("jpeg");
    expect(result.completeness.complete).toBe(true);
    client.close();
    uninstall();
  });

  it("bounds queued work and rejects cancelled or closed requests", async () => {
    const clientPort = new TestPort();
    const sinkPort = new TestPort();
    clientPort.peer = sinkPort;
    sinkPort.peer = clientPort;
    expect(() => createMetadataWorkerClient(clientPort, { maxPending: 0 })).toThrow(RangeError);

    const client = createMetadataWorkerClient(clientPort, { maxPending: 1 });
    const fixture = await readFile(new URL("./fixtures/jpeg-exif-little-endian.jpg", import.meta.url));
    const queued = client.parse(fixture);
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    await expect(client.parse(fixture)).rejects.toMatchObject({ code: "LIMIT_EXCEEDED" });
    client.close();
    await expect(queued).rejects.toMatchObject({ code: "ABORTED" });
    await expect(client.parse(fixture)).rejects.toMatchObject({ code: "ABORTED" });
    client.close();

    const aborting = createMetadataWorkerClient(clientPort);
    const preAborted = new AbortController();
    preAborted.abort();
    await expect(aborting.parse(fixture, { signal: preAborted.signal })).rejects.toMatchObject({ code: "ABORTED" });
    const controller = new AbortController();
    const aborted = aborting.parse(fixture, { signal: controller.signal });
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    controller.abort();
    await expect(aborted).rejects.toMatchObject({ code: "ABORTED" });
    aborting.close();
  });
});
