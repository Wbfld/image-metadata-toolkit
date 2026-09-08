import { parentPort } from "node:worker_threads";
import { parseMetadata } from "../dist/index.js";

if (parentPort === null) throw new Error("Worker was not started with a parent port");

parentPort.on("message", async (bytes) => {
  try {
    const result = await parseMetadata(bytes);
    parentPort.postMessage({ ok: true, result });
  } catch (error) {
    parentPort.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});
