# Runtime and module support policy

This matrix distinguishes tested support from compatibility that has not been
executed. It is derived from the repository workflows and retained test
results, not from an aspiration list.

| Boundary | Policy | Executed evidence |
| --- | --- | --- |
| Node.js | Supported on Node 22.x in CI; Node 23.x is additionally exercised in the current development environment | `.github/workflows/*.yml`, `npm test`, `npm run package:smoke`, `npm run examples` |
| Browser ESM | Supported in Chromium and Firefox through the public browser entrypoint | `tests/browser/metadata.spec.ts`, Playwright Chromium/Firefox results |
| WebKit | Not claimed until the runner can create a page; current environment is unavailable because Playwright reports `Unknown setting: PushAPIEnabled` | Recorded as unavailable in the Stage 7 evidence handoff |
| Web Worker | Supported through the explicit worker entrypoint and message contract | `tests/worker.test.ts`, `examples/worker-smoke.mjs`, browser worker fixtures |
| CommonJS | Supported for published Node-compatible exports and declarations | package smoke CJS consumer and `dist/*.cjs` export checks |
| Deno | Compatibility is conditional and not a support claim until the Deno runtime check executes in CI | `npm run test:deno` when the runtime is installed; no unavailable run is treated as pass |
| Bun | Not a support claim; no Bun runtime evidence is currently retained | Must be added to CI before being advertised |
| WASM | Only optional official C2PA browser integration may load SDK WASM; core parsing has no WASM requirement | T04 adapter documentation and package-isolation checks |
| Optional C2PA Node adapter | Separate Node-only boundary with optional native SDK; never imported by core | `tests/trust-t04.test.ts`, `npm run test:c2pa` where SDK/runtime is available |
| Serverless | Supported only through the Node or browser-compatible in-memory contracts; filesystem/network behavior is caller-owned and explicit | Node/browser package smoke; no provider-specific guarantee |
| Browser fetch/http | Separate opt-in adapters; core remains local-only | `tests/http.test.ts`, `tests/integration.test.ts` |

The package publishes ESM and CommonJS conditions with declarations. Browser
bundles must not contain Node built-ins or optional C2PA SDK code. Node-only
paths are isolated behind `node`, `http`, and `c2pa/node` exports. A runtime is
not upgraded from conditional or unavailable to supported without a real CI
run and a retained report recording versions and environment.

