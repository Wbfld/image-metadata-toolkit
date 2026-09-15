# B09 — Additional containers demand gate

Status: complete for bounded SVG metadata RDF/XML inventory as of 2026-09-14.

B09 is deliberately a demand and maintenance gate. It does not authorize a
format implementation merely because a format is technically interesting or
would increase the format count. A candidate must have all four prerequisites:

1. a named, evidenced user workflow;
2. lawful conformance fixtures;
3. a defined bounded security model; and
4. a named maintenance owner recorded in repository governance.

The checked decision is [reports/b09-demand-decision.json](reports/b09-demand-decision.json).
The decision script validates the complete candidate inventory, evidence
identities, stable URLs, retrieval dates, gate statuses, and the fail-closed
selection rule:

```sh
npm run b09:check
```

## Audit result and selected scope

The evaluated roadmap candidates are BMP metadata, ICO metadata, JPEG XR
metadata, SVG metadata, and camera XMP sidecars. The repository issue tracker
contained zero issues at retrieval. WBLFD is the recorded maintenance owner
for a project selected through this gate; that ownership alone does not make a
candidate eligible.

Camera XMP sidecars have the strongest external workflow evidence. The
retained evidence links to real application workflows involving XMP sidecar
export, corrected capture timestamps, sidecar write policy, and XMP
interoperability. That evidence does not establish a browser-image-metadata
fixture license or a repository maintenance commitment. The repository's
bounded RDF/XML implementation is an applicable existing security foundation,
not proof that a sidecar conformance project has been completed.

SVG metadata is the sole qualifying candidate. The Inkscape workflow evidence,
W3C Test Suite fixture, bounded SVG security model, and WBLFD ownership satisfy
the four B09 prerequisites. The implementation recognizes a namespace-validated
SVG root, inventories RDF/XML inside SVG `metadata` elements as XMP with exact
byte provenance, rejects DTD/entity declarations, and keeps non-RDF metadata
opaque and privacy-sensitive. It does not render SVG, decode pixels, mutate SVG,
or implement sidecar XMP.

`npm run test:svg-b09` requires `B09_SVG_CORPUS_DIR`, verifies the W3C fixture
hash and length, and writes redistribution-safe JSON and Markdown evidence to
`reports/svg-b09-evidence.{json,md}`. No W3C file is committed. The B10 sidecar
ticket remains separate and is not approved by this SVG selection.

This document records B09 SVG metadata support only; it does not claim B10 completion.
