# G04 integration examples

These examples are part of the launch packet and are kept at runtime-specific
boundaries:

| Runtime or bundler | Example | Boundary |
| --- | --- | --- |
| Browser | `examples/browser/index.html` and `app.js` | Root browser-safe API; no network input |
| Worker | `examples/browser/worker.html` and `worker.js` | Explicit worker entry point |
| Node | `examples/node.mjs` | Node path/file-source adapter |
| Node worker | `examples/worker-node.mjs` | Worker transport and bounded parse |
| Deno | `examples/integrations/deno.ts` | Deno ESM import and local bytes |
| Vite | `examples/integrations/vite.ts` | Browser bundle entry |
| Next.js | `examples/integrations/next-client.tsx` | Client-only browser boundary |
| React | `examples/integrations/react.tsx` | Client component boundary |
| Playground | `examples/playground/index.html` and `app.js` | Local file inspection |

For migration from common reader APIs, use the explicit
`toExifReaderCompatible(result)` and `toExifrCompatible(result)` adapters after
one package parse. The adapters are intentionally lossy views; the source
result remains available for provenance, duplicates, conflicts, raw bytes, and
semantic coverage.

The launch audit executes the package APIs behind these examples, verifies the
local-only playground and benchmark assets are present, and retains hashes in
[reports/g04-launch-evidence.json](reports/g04-launch-evidence.json). It does
not claim that these examples have been deployed to an external hosting
service.

