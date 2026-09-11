# Framework integration snippets

These snippets use the public ESM package entry point. Install `browser-image-metadata` in the application that owns the file input, then copy the example for its framework. Files never need to leave the browser for metadata inspection.

- [`vite.ts`](./vite.ts) is framework-neutral Vite browser code.
- [`react.tsx`](./react.tsx) is a React file-input component.
- [`next-client.tsx`](./next-client.tsx) is a Next.js client component.
- [`deno.ts`](./deno.ts) reads a local file through Deno's npm compatibility layer.

Run the repository's tested vanilla browser and module-worker examples from [`../browser`](../browser). The framework snippets are intentionally source-only so this package does not impose Vite, React, Next.js, or Deno dependencies on its own release gate.
