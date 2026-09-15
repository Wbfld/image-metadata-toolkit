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

function rafHeader(): Uint8Array {
  const bytes = new Uint8Array(108);
  bytes.set(new TextEncoder().encode("FUJIFILMCCD-RAW "), 0);
  bytes.set(new TextEncoder().encode("0201"), 16);
  return bytes;
}

describe("worker entry point", () => {
  it("parses an explicit XMP sidecar through the worker boundary", async () => {
    const clientPort = new TestPort();
    const workerPort = new TestPort();
    clientPort.peer = workerPort;
    workerPort.peer = clientPort;
    const uninstall = installMetadataWorker(workerPort);
    const client = createMetadataWorkerClient(clientPort);
    const packet = new TextEncoder().encode('<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:ex="urn:worker:"><rdf:Description><ex:value>sidecar</ex:value></rdf:Description></rdf:RDF>');
    const result = await client.parseSidecar(packet, { id: "worker-sidecar.xmp" });
    expect(result.source).toMatchObject({ kind: "sidecar", id: "worker-sidecar.xmp" });
    expect(result.coverage.complete).toBe(true);
    expect(result.value?.rdf?.properties[0]?.name.namespaceUri).toBe("urn:worker:");
    client.close();
    uninstall();
  });

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

  it("keeps B05 RAF detection available through the worker boundary", async () => {
    const clientPort = new TestPort();
    const workerPort = new TestPort();
    clientPort.peer = workerPort;
    workerPort.peer = clientPort;
    const uninstall = installMetadataWorker(workerPort);
    const client = createMetadataWorkerClient(clientPort);
    const result = await client.parse(rafHeader().slice().buffer);
    expect(result.format).toBe("raf");
    expect(result.fileKind).toBe("raf");
    expect(result.completeness.complete).toBe(false);
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
    await expect(aborting.parse(fixture, { jxlBrotliDecompressor: () => new Uint8Array() })).rejects.toMatchObject({ code: "UNSUPPORTED_STRUCTURE" });
    await expect(aborting.parse(fixture, { makerNotePlugins: [] })).rejects.toMatchObject({ code: "UNSUPPORTED_STRUCTURE" });
    const controller = new AbortController();
    const aborted = aborting.parse(fixture, { signal: controller.signal });
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    controller.abort();
    await expect(aborted).rejects.toMatchObject({ code: "ABORTED" });
    aborting.close();
  });

  it("keeps Blob inputs intact so metadata-scoped worker reads can slice them", async () => {
    const clientPort = new TestPort();
    const workerPort = new TestPort();
    clientPort.peer = workerPort;
    workerPort.peer = clientPort;
    const uninstall = installMetadataWorker(workerPort);
    const client = createMetadataWorkerClient(clientPort);
    const fixture = await readFile(new URL("./fixtures/jpeg-exif-little-endian.jpg", import.meta.url));
    const blob = new Blob([fixture]);
    Object.defineProperty(blob, "arrayBuffer", {
      configurable: true,
      value: () => Promise.reject(new Error("The client must not materialize a Blob before sending it to a worker.")),
    });

    const result = await client.parse(blob, { scope: "metadata" });
    expect(result.format).toBe("jpeg");
    expect(result.completeness.scope).toBe("partial");
    client.close();
    uninstall();
  });
});
