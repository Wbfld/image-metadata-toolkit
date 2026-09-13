# T04 official C2PA verifier adapters

T04 is an optional integration layer. The dependency-free core and ordinary parser/writer entry points do not import either official SDK. The adapters are separate public exports:

```ts
import { verifyC2paInBrowser } from "browser-image-metadata/c2pa/browser";
import { verifyC2paInNode } from "browser-image-metadata/c2pa/node";
```

The package declares exact optional peer versions `@contentauth/c2pa-web@0.14.6` and `@contentauth/c2pa-node@0.9.5`. Both are MIT licensed official packages from the Content Credentials `c2pa-js` repository. Release URLs, source URLs, the browser WASM hash, and the lawful MIT fixture provenance are retained in [`data/c2pa/provenance.json`](data/c2pa/provenance.json).

## Result contract

Adapters delegate parsing, signature verification, certificate processing, trust decisions, and all cryptographic work to the official SDK. The normalized status is namespaced:

- `official:valid`, `official:invalid`, `official:trusted`, and `official:no-manifest` are emitted only from an official SDK result.
- `adapter:unsupported`, `adapter:sdk-unavailable`, `adapter:configuration`, `adapter:trust-list`, `adapter:network`, `adapter:wasm`, `adapter:native-runtime`, and `adapter:runtime-error` are typed adapter conditions and are never converted into an official success.

Every result retains the complete `officialResult` object (or the official error object for a typed SDK failure), the original official status, diagnostics, package/version/license/provenance, and adapter identity. T03 inventory remains a separate API and is never used as a verification substitute.

## Runtime boundaries and deployment

The browser adapter requires a version-matched `wasmSrc` URL or `WebAssembly.Module`, and uses the official SDK's WASM worker. The separate-WASM deployment keeps the package smaller than the official inline-WASM alternative; applications must host the exact resource, preserve its integrity, and account for worker and WASM CSP directives. An application may choose an inline official package variant in its own build, but this package does not bundle it.

The Node adapter loads the official native binding and requires a supported Node runtime and host binary. Installation may download the platform binary through the official package postinstall. Native runtime, WASM, network, trust-list, and configuration failures remain typed. Remote manifest fetching is disabled by default and is enabled only through the adapter option; ordinary inventory never fetches remote references.

The reproducible integration command is `npm run test:c2pa`. It downloads the pinned MIT fixture into a temporary directory, verifies its byte length and SHA-256, runs the real Node adapter and Chromium browser adapter, and writes compact JSON/Markdown evidence without copying the image. Core package smoke tests exercise package import without requiring either optional SDK.
