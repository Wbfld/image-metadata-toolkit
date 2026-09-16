# R05 compatibility and limitations report

This is a release-ready report draft for the current package candidate. It is
not a publication record. The package remains prerelease until the complete
R05 automated audit, the roadmap-required external TIFF/writer review, and the
normal trusted-publishing release process have completed.

## Package identity

The public npm package is `browser-image-metadata`. The repository slug is
`image-metadata-toolkit`. The exact package version, lockfile hash, runtime,
platform, candidate identity, and executable audit results are recorded in
`reports/r05-release-audit.json` when the audit is run. These generated audit
outputs are repository evidence and are intentionally excluded from the npm
package so their run-specific timestamps and hashes cannot invalidate the
reproducible package baseline.

## Compatibility scope

The compatibility claims are limited to the format, parser, writer, browser,
worker, Node, CLI, and optional-adapter boundaries documented in
[`CAPABILITIES.md`](./CAPABILITIES.md), [`API.md`](./API.md), and
[`RUNTIME_SUPPORT.md`](./RUNTIME_SUPPORT.md). A claim is release-supported only
when its linked focused test, generated contract, corpus/reference report, or
runtime check has executed for the exact candidate.

## Important limitations

- Parsing is bounded and fail-closed; malformed, truncated, opaque, unknown,
  unsupported, or ambiguous structures are not silently treated as safe or
  verified.
- No pixel decoding, color transform, authenticity conclusion, or cryptographic
  verification is provided by the dependency-free core.
- C2PA/JUMBF inventory is structurally descriptive. Official verification is an
  explicitly separate optional adapter boundary.
- SVG support is bounded metadata inventory; rendering and SVG writing are not
  supported.
- RAW and HEIF/AVIF support is limited to the documented read-only metadata and
  container inventories; unsupported writing remains unsupported.
- Optional C2PA SDKs, browser WASM, native binaries, trust lists, network
  access, and deployment CSP requirements remain separate from the core package.
- Runtime support is conditional where the corresponding runtime check has not
  executed. An unavailable browser, Deno, Bun, scanner, corpus, or external
  review is not evidence of compatibility.

## Evidence policy

Reports retain source URLs, versions, licenses, retrieval dates, hashes, tool
versions, fixture identities, byte lengths, and normalized results where the
underlying ticket requires them. Third-party images, profiles, and corpora are
downloaded only into temporary untracked storage and are not copied into this
package. Reports do not turn skipped or unavailable checks into successes.

## Release wording

This report does not use unscoped “fully featured”, “safest”, or “fastest”
claims. Performance statements require the pinned benchmark report, equal
semantic contract, sample policy, and recorded environment described in
[`BENCHMARKS.md`](./BENCHMARKS.md).

## Remaining release actions

1. Run the prepublication R05 audit from a clean checkout containing the exact candidate.
2. Supply every required external corpus/reference/runtime/scanner result and
   resolve any unexpected failure.
3. Obtain and retain the independent TIFF and all-writers review described in
   [`R05_EXTERNAL_REVIEW_PACKET.md`](./R05_EXTERNAL_REVIEW_PACKET.md).
4. Have a maintainer review this report and the complete evidence bundle.
5. Publish only through the documented trusted-publishing workflow after the
   review and release preflight pass. Use the prerelease dist-tag for a
   prerelease candidate rather than `latest`.
6. Run the postpublication R05 phase and retain its registry tarball,
   dist-tag, signature, and provenance evidence.
