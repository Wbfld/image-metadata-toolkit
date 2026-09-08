import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Worker } from "node:worker_threads";

const fixture = await readFile(new URL("../tests/fixtures/png-metadata.png", import.meta.url));
const worker = new Worker(new URL("./worker-node.mjs", import.meta.url), { type: "module" });
const response = await new Promise((resolve, reject) => {
  worker.once("message", resolve);
  worker.once("error", reject);
  const transferable = fixture.buffer.slice(fixture.byteOffset, fixture.byteOffset + fixture.byteLength);
  worker.postMessage(transferable, [transferable]);
});
await worker.terminate();

assert.equal(response.ok, true);
assert.equal(response.result.format, "png");
assert.deepEqual(response.result.dimensions, { width: 2, height: 2 });
assert.equal(response.result.xmp.packets.length, 1);
console.log("Node worker transferable-buffer smoke check passed.");
