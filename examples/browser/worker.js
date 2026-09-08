/* global self */
import { parseMetadata } from "../../dist/index.js";

self.addEventListener("message", async (event) => {
  if (!(event.data instanceof ArrayBuffer)) return;
  try {
    const result = await parseMetadata(event.data);
    self.postMessage({ ok: true, result });
  } catch (error) {
    self.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});
