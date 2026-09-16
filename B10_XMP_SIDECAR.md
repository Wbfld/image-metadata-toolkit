# B10 XMP sidecar and merge API

Status: implementation and retained evidence complete; human review is treated
as approved based on the explicit repository-owner instruction recorded in the
task session: “B10 human review has passed.”

## Scope

B10 provides an explicit, dependency-free API for caller-supplied XMP sidecar bytes. The core accepts `ArrayBuffer`, typed-array views, and `Blob` inputs, but never opens a path, follows a URL, fetches a remote reference, or changes an image. The RDF/XML model is the existing bounded, namespace-aware S05/S06 model and retains URI/local-name identities, source order, arrays, language alternatives, qualifiers, nested resources, lexical values, unknown properties, diagnostics, and ranges.

The public functions are exported from the package root and from `browser-image-metadata/xmp/sidecar`:

- `parseXmpSidecar(input, options)` materializes bounded bytes, computes a stable SHA-256 source identity, parses one sidecar packet, and returns a standalone XMP block and packet provenance covering the source byte range.
- `mergeXmpSources(sources, options)` merges explicit embedded and sidecar packets. `preserve-all` is the default and keeps every candidate and conflict. `embedded-first`, `sidecar-first`, and `reject-conflicts` are explicit alternatives. Malformed or error-diagnostic packets make the merge unaccepted.
- `mergeMetadataWithXmpSidecar(result, sidecar, options)` parses the image's retained embedded XMP packets and merges them with the caller-supplied sidecar without mutating the image result or its bytes.
- `serializeXmpSidecar(value, options)` uses the existing RDF/XML serializer, enforces the shared output limits, returns new sidecar bytes, and by default reparses and compares a stable semantic model before returning.

No policy silently selects a first or last value. Precedence is only applied when the caller names it, and `reject-conflicts` refuses output acceptance when identities disagree. Source packet provenance includes source kind, source ID, packet index, block ID, offset, length, and sidecar ID. Rewritten sidecar offsets are source-relative to the new standalone packet and are not confused with embedded image offsets.

## Safety and privacy

The parser reuses the bounded XML model: UTF-8 is fatal, DTD and entity declarations are refused, namespace and RDF structure are validated, and node, attribute, namespace, depth, property, text, array, qualifier, packet, input, output, and cumulative metadata limits are applied. Diagnostics are typed and stable. Unknown namespaces and properties remain in the structured result and are not reclassified as harmless; privacy callers should apply the existing T01/T02 audit and policy model to the merged candidates before sharing them. Default evidence reports use hashes and identities rather than lexical values.

The serializer escapes XML text and attributes through the existing serializer. It rejects values that cannot be represented by that serializer and fails if the reparsed semantic model differs. It does not write an image, sidecar path, or network resource. The worker entry point exposes `parseSidecar` as a bounded transferable operation; browser and Node consumers use the same dependency-free core export.

## Authoritative sources and evidence

The standards basis is pinned in [`data/sidecar/b10-sources.json`](./data/sidecar/b10-sources.json): W3C RDF 1.1 XML Syntax and Adobe's XMP specifications. The W3C recommendation defines RDF/XML namespace and graph syntax, and Adobe documents XMP's RDF/XML serialization model ([W3C RDF 1.1 XML Syntax](https://www.w3.org/TR/rdf-syntax-grammar/), [Adobe XMP Specifications](https://developer.adobe.com/xmp/docs/xmp-specifications/)). The reference pages are not copied into the repository; the manifest records their versions, URLs, licenses, retrieval dates, and that no local content hash is claimed for an unarchived page.

`npm run test:sidecar-b10` builds the package, runs the focused sidecar and worker tests, and runs [`scripts/sidecar-b10-evidence.mjs`](./scripts/sidecar-b10-evidence.mjs). The command writes redistribution-safe [`reports/sidecar-b10-evidence.json`](./reports/sidecar-b10-evidence.json) and [`reports/sidecar-b10-evidence.md`](./reports/sidecar-b10-evidence.md). Evidence uses a repository fixture plus deterministic, caller-authored embedded and sidecar packets, verifies both sources participate, exercises all four merge policies, checks arrays and language alternatives, checks nested resources and unknown properties, records hashes and provenance, proves semantic serialization reparse, and proves source image bytes remain unchanged. No third-party image or sidecar bytes are retained.

The approval basis is limited to the explicit owner instruction above. No
reviewer identity, independence claim, findings, or commands are inferred.
