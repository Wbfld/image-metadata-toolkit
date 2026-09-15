# Autonomous completion prompt: B04-B10 and R01-R05

This file is an execution prompt for a coding model such as Luna Extra High.
The roadmap calls the tenth breadth ticket `B10`; references to `B010` in a
scheduler request mean `B10`.

## Scheduler instruction

Work autonomously in:

`/Users/will/Documents/image-metadata-toolkit/image-metadata-toolkit`

Read this file completely, then execute every instruction below. Implement the
tickets strictly in this order:

1. B04
2. B05
3. B06
4. B07
5. B08
6. B09
7. B10
8. R01
9. R02
10. R03
11. R04
12. R05

Complete exactly one ticket at a time. After implementing a ticket, perform
the full acceptance and self-review loop in this prompt. Continue
automatically only when every deliverable and acceptance criterion for that
ticket has executable evidence. Do not ask for routine input between tickets.

If a genuine blocker prevents an acceptance criterion from being proven, stop
at that ticket and report the blocker precisely. Do not continue to later
tickets, weaken the criterion, invent evidence, reinterpret a governance gate,
or claim completion.

## Source of truth and scope

`COMPETITIVE_ROADMAP.md` is the source of truth. Before each ticket, re-read
that ticket in full, including its dependencies, the roadmap's architecture
decisions, release gates, per-ticket review checklist, execution-order notes,
and explicit non-goals. The ticket-specific requirements below are minimum
acceptance interpretations; they do not replace or weaken the roadmap.

Do not broadly reimplement completed work. B01-B03, F01-F07, S01-S09,
I01-I02, W01-W08, and T01-T04 already have substantial implementation and
evidence. Touch them only when the current ticket requires a documented
integration or when focused tests expose a direct regression. Preserve their
public contracts and retained evidence.

Do not implement G01-G04 or other post-ticket work during this run.

## Non-negotiable implementation rules

- Write complete, production-ready source, tests, fixtures, scripts,
  declarations, documentation, workflows, reports, and generated artifacts.
- Do not truncate code, tests, comments, documentation, reports, snapshots, or
  generated output.
- Do not replace implementation with prose, comments, pseudocode, examples,
  placeholders, stubs, empty branches, hard-coded passing results, or future
  work notes.
- Do not add TODOs, skipped/quarantined tests, `.only` tests, weakened
  assertions, reduced thresholds, fake fixtures, fake reports, or silent
  no-run success.
- Null, unavailable, opaque, unsupported, skipped, or unexecuted results must
  never count as successful evidence.
- Do not make correctness, security, privacy, conformance, or mutation
  decisions by matching human-readable warning text. Use stable typed codes,
  identities, and operation outcomes.
- Preserve every unrelated and pre-existing working-tree change. The worktree
  may be dirty. Never discard, overwrite, reformat, or claim ownership of
  changes outside the current ticket.
- Do not commit, push, publish, create a release, upload assets, or edit files
  outside this repository.
- Do not copy implementation code, tag tables, or undocumented behavior from
  ExifTool, ExifReader, exifr, exif-js, piexifjs, dcraw, LibRaw, or other
  competing implementations.
- ExifTool and other independent readers may be secondary output oracles only.
  They are not the implementation or the standards source.
- Preserve compatibility unless the current roadmap ticket explicitly
  requires a public-contract change. Record every additive or breaking impact.
- Do not add pixel decoding, rendering, color transforms, RAW development,
  image re-encoding, in-place file mutation, a home-grown C2PA verifier, or
  unrelated format support.
- Do not infer support from a magic number or filename extension alone.
- Unknown metadata remains visible and fail-closed. Never classify an unknown
  block, property, MakerNote, resource, item, track, or sidecar value as safe
  merely because it could not be decoded.
- Preserve source bytes until a complete write and all post-write verification
  have succeeded. Failed operations must produce no partial output.
- Never overwrite a source file. Core APIs should accept and return bytes or
  existing input abstractions; Node-only filesystem behavior belongs in an
  isolated Node entry point or CLI.

## Standards, provenance, and fixture policy

For every standards-derived behavior:

- Prefer authoritative specifications, vendor documentation, registries, and
  reference implementations.
- Pin title, authority, version/edition, URL, license/provenance, retrieval
  date, and a SHA-256 hash when source bytes are lawfully retained.
- When a copyrighted specification cannot be retained, record a stable URL,
  edition, license status, retrieval date, and an explicit no-copy hash policy.
- Reject contradictory or duplicate generated definitions.
- Keep derived data generation deterministic and check generated files in CI.
- Use lawful, reproducible fixtures with documented licenses and SHA-256
  hashes. Do not commit third-party camera files unless redistribution is
  explicitly permitted and compatible with repository fixture policy.
- Download non-redistributable fixtures only into temporary untracked storage,
  verify their pinned hashes before use, and retain redistribution-safe JSON
  and Markdown evidence without copying source or derived image bytes.
- Real-format acceptance requires real vendor/conformance files. Synthetic
  structural fixtures are useful for malformed boundaries and limits but do
  not replace real-file evidence.
- Record tool versions and licenses for every independent oracle or decoder.

## Security and bounded-processing rules

All reads, offset calculations, box/chunk/directory traversal, recursion,
collection counts, string decoding, decompression, allocations, graph
relationships, output bytes, diagnostics, and report serialization must be
bounded through the repository's `SecurityLimits` model or a narrowly reviewed
new limit.

Use safe integer arithmetic for every offset, size, count, stride, table, and
range. Test:

- truncation at meaningful boundaries;
- zero, extended, maximum, overflow, underflow, and contradictory lengths;
- duplicate, overlapping, aliased, cyclic, and out-of-order structures;
- excessive nesting, item counts, table counts, strings, metadata bytes,
  decompressed bytes, warnings, and cumulative output;
- unsupported external references without fetching them;
- abort behavior at bounded checkpoints; and
- atomic failure without partial output.

Malformed nested metadata must return stable typed diagnostics rather than an
unexpected exception. Limit exhaustion must never turn an incomplete result
into a complete or safe result merely because further diagnostics were
suppressed.

## Initial repository audit

Before editing any file:

1. Read the complete B04-B10 and R01-R05 roadmap text.
2. Read `CONTRIBUTING.md`, `CAPABILITIES.md`, `API.md`, `README.md`,
   `CHANGELOG.md`, package manifests/exports, build configuration, security
   limits, generated registries, release baseline, fixture policies, and all
   applicable architecture or ticket documents.
3. Read all related parser, writer, registry, privacy, mutation, adapter,
   worker, Node, browser, CLI, documentation, workflow, test, fixture,
   evidence, and generation files.
4. Capture `git status --short`, the complete existing diff, package versions,
   available runtimes/tools, and the current test baseline.
5. Distinguish pre-existing changes from changes made by this run. Maintain a
   per-ticket changed-file ledger.
6. Verify each dependency ticket through its public API and focused tests. Do
   not reopen a dependency unless a direct integration defect is proven.
7. Build an explicit criterion-by-criterion acceptance matrix for B04 before
   changing code. Do not pause for approval; begin unless a genuine ambiguity
   would force an unsafe or incompatible public contract.

## Per-ticket completion loop

For every ticket, without exception:

1. Translate every roadmap deliverable and criterion into concrete public,
   malformed-input, security, compatibility, and evidence tests.
2. Add the smallest meaningful failing tests first.
3. Implement the smallest complete production solution.
4. Add focused positive, negative, duplicate, conflict, malformed, truncated,
   limit, privacy, selection, provenance, browser/runtime, and regression tests
   as applicable.
5. Add real-fixture or official-reference execution where the ticket requires
   actual ecosystem evidence.
6. Run all focused tests and relevant dependency regressions.
7. Re-read the complete ticket and its dependencies.
8. Map every criterion to exact source, public contract tests, documentation,
   and retained executable evidence.
9. Inspect the complete relevant diff, including generated files and reports.
10. Search relevant files and the public surface for placeholders, TODOs,
    stubs, pseudocode, skipped/quarantined/`.only` tests, weakened assertions,
    warning-text logic, silent no-run success, unsupported claims, accidental
    sensitive-value leakage, and non-deterministic generated data.
11. Verify offsets remain relative to the original input, unknown data remains
    represented, selection skips work rather than filtering afterward, and
    cumulative limits are enforced.
12. Verify package exports, declarations, browser/Node isolation, bundle
    closure, generated artifacts, capability statements, and package contents.
13. Fix every issue and repeat the loop until all checks pass.
14. Record a concise ticket checkpoint and continue automatically only if the
    acceptance matrix contains no unproven row.

Self-review is required but does not replace a roadmap-mandated human or
external review. Prepare review-ready evidence for such gates and report their
actual status truthfully.

## Stage 1 — B04: RAW phase one, DNG and TIFF-derived camera files

Implement B04 fully for DNG, CR2, NEF, ARW, ORF, RW2, and IIQ.

Minimum production requirements:

- Introduce or complete a public `container` plus `fileKind` model. Preserve a
  truthful TIFF/BigTIFF container identity while exposing the recognized RAW
  kind. Do not flatten all variants into generic TIFF and do not break existing
  TIFF consumers.
- Detect each file kind through validated structural/vendor markers and
  directory semantics, not extensions alone. Ambiguous inputs must remain
  generic TIFF or explicit unknown rather than being guessed.
- Reuse the standards-based TIFF graph and EXIF registry where correct, while
  retaining variant-specific roots, offsets, byte order, subdirectories,
  duplicate fields, thumbnails, previews, strips/tiles, and associated-image
  relationships.
- Safely index preview/thumbnail ranges, dimensions, format, role, and
  provenance without decoding RAW mosaics or image pixels.
- Keep primary RAW data ranges distinct from embedded JPEG/TIFF previews and
  metadata. Do not expose compressed RAW payloads as ordinary decoded images.
- Preserve every recognized and unknown directory/tag candidate with original
  directory, entry, value-offset, byte-length, and file-relative provenance.
- Integrate selection, `Blob`/`File`, range-backed input, cancellation,
  coverage, privacy inspection, image details, JSON-safe adapters, workers,
  Node, and supported browser boundaries.
- Unknown or unsupported vendor structures and MakerNotes must remain bounded
  opaque risks. B04 must not implement vendor MakerNotes ahead of B07/B08.
- Writing RAW containers remains outside scope unless the roadmap explicitly
  says otherwise. Existing writer APIs must return typed unsupported results
  for these file kinds.

Required evidence and tests:

- Real lawful, hash-pinned fixtures for every listed file kind, with source,
  license, camera/producer where known, byte length, and provenance.
- Independent secondary-oracle comparisons for container/file-kind identity,
  dimensions, preview inventory, and stable EXIF fields available to both
  tools.
- Synthetic boundary fixtures for byte order, classic TIFF/BigTIFF where
  applicable, duplicate directories, cycles, aliasing, out-of-file offsets,
  oversized previews, truncation, excessive entries/depth, and ambiguous
  signatures.
- Tests proving generic TIFF compatibility and proving each RAW kind is not
  mislabeled when its required marker is absent or contradictory.
- Tests proving preview ranges are exact, non-overlapping where required,
  bounded, source-relative, and never decoded by the metadata parser.
- Redistribution-safe JSON and Markdown evidence, recommended at
  `reports/raw-b04-evidence.json` and `.md`.
- A ticket document recording support, explicit omissions, sources, fixtures,
  privacy implications, and no-pixel-decoding policy.

Do not complete B04 until all seven file kinds have real-file participation and
the public `container`/`fileKind` contract is locked by type and runtime tests.

## Stage 2 — B05: RAW phase two, CR3 and RAF

Implement CR3 and RAF as separate conformance projects. Do not treat either as
an extension-only alias or flatten them into the B04 model.

CR3 requirements:

- Build on B02/B03 ISO-BMFF items and tracks while retaining CR3-specific box,
  item, track, metadata, preview, thumbnail, and primary-selection semantics.
- Preserve all item/track candidates, transformations, sample/range
  provenance, and metadata associations. Do not merge unrelated images or
  metadata into one primary result.
- Parse supported EXIF/XMP and high-value container metadata through existing
  standards-based decoders where applicable.
- Index image-bearing and RAW-bearing ranges without decoding payloads.
- Treat unsupported Canon boxes, UUID data, MakerNotes, and offset-bearing
  structures as bounded explicit opaque/unsupported results.

RAF requirements:

- Validate RAF identity through its documented structure, not filename alone.
- Safely index embedded preview/JPEG, metadata, RAW/CFA, and other documented
  ranges with exact original-file offsets and bounded lengths.
- Parse embedded supported metadata through existing container parsers while
  preserving the RAF parent provenance and associated-image role.
- Never decode or reinterpret the RAW mosaic.
- Diagnose conflicting, overlapping, truncated, oversized, or contradictory
  embedded ranges with stable typed outcomes.

Required evidence and tests:

- Real lawful, hash-pinned CR3 and RAF fixtures from documented vendors or
  conformance sources. Synthetic files do not satisfy real participation.
- Separate authoritative source/provenance records and separate acceptance
  counts for CR3 and RAF.
- Independent oracle comparisons for identity, dimensions, preview inventory,
  and stable metadata as available.
- Tests for multiple CR3 tracks/items, ambiguous primaries, fragments,
  metadata association, transformations, RAF preview placement, malformed
  offsets, overlaps, truncation, duplicates, limits, cancellation, and
  no-network behavior.
- Public type, adapter, worker, browser, Node, range-input, coverage, privacy,
  and package-export tests.
- Redistribution-safe JSON and Markdown evidence, recommended at
  `reports/raw-b05-evidence.json` and `.md`.

Do not complete B05 unless both CR3 and RAF have independently passing
real-fixture evidence and no RAW pixel decoder has been introduced.

## Stage 3 — B06: Photoshop image-resource inventory

Implement a complete bounded Photoshop image-resource-block inventory wherever
the repository claims support, including Photoshop APP13 data and applicable
TIFF/other embedded resource containers.

Minimum production requirements:

- Index every structurally valid `8BIM` resource, including duplicate IDs, in
  original order with signature, resource ID, Pascal name bytes/string,
  name-padding bytes, payload range, payload length, payload-padding byte,
  parent block identity, and original-file provenance.
- Do not collapse duplicate resources and do not drop unknown resources.
- Decode standards-sourced high-value resources for resolution, thumbnails,
  clipping-path names and path metadata, XMP/IPTC linkage, and digest data.
- Keep decoded semantic values separate from exact retained raw/resource
  representation.
- Validate Pascal-string and even-byte resource padding exactly, including
  empty names, odd/even names, odd/even payloads, and malformed padding.
- Integrate inventory with metadata blocks, selection, coverage, image details,
  privacy classification, adapters, workers, package exports, and existing
  JPEG/TIFF metadata parsing.
- Unknown resources must remain bounded and privacy fail-closed.

Writing requirements:

- Integrate with each applicable existing writer without rewriting image
  payloads.
- Preserve unknown resources, duplicate ordering, Pascal-name bytes, name
  padding, payload bytes, and payload padding exactly during unrelated edits.
- Add explicit exact-resource targeting where the existing mutation model
  permits it. A resource selector must never degrade into removal of the whole
  APP13 or metadata family.
- Validate serialized lengths with safe arithmetic and reject oversized APP13
  or container representations atomically with typed outcomes.
- Reparse the result and prove byte-range/payload invariants before returning
  output.

Required tests and evidence:

- Positive fixtures containing each decoded high-value resource.
- Duplicate, unknown, zero-length, odd/even padding, malformed name, malformed
  length, truncated, oversized, overlapping-container, and excessive-count
  cases.
- Writer tests proving an unrelated edit preserves every unknown-resource byte
  and all image-bearing bytes.
- Independent secondary-oracle checks where both implementations expose the
  same resource semantics.
- Redistribution-safe JSON and Markdown evidence, recommended at
  `reports/photoshop-b06-evidence.json` and `.md`.

The roadmap requires human review of every writer. Prepare a complete writer
review packet containing byte-range maps, before/after hashes, atomicity
results, malformed cases, and public contract changes. Self-review does not
satisfy that governance gate. Do not continue to B07 unless an actual human
approval exists for the exact B06 writer diff and scope. If it does not exist,
stop after completing all safely executable B06 work and its review packet,
then report the human-review gate as the precise blocker. Never claim the human
review occurred when it did not.

## Stage 4 — B07: MakerNote plugin contract

Implement the plugin architecture only. Do not smuggle vendor tag packs into
B07.

Minimum production requirements:

- Define stable public types for plugin identity/version, supported vendor or
  note family, detection evidence and confidence, minimum confidence,
  signature tests, base-offset rules, byte order, nested IFD behavior,
  encryption/obfuscation status, tag registry, security requirements,
  diagnostics, decoded fields, opaque ranges, and provenance.
- Use explicit caller imports/registration per parse operation. Plugins must
  not mutate a process-wide or package-wide global registry and import order
  must not change results.
- Make plugin collections immutable or defensively copied.
- Resolve offsets relative to an explicit documented base and retain both
  note-relative and original-file provenance.
- Bound plugin input, reads, recursion, directories, entries, decoded values,
  strings, warnings, and output. Plugins may request data only through a
  bounded read context and may not fetch network resources.
- Define typed outcomes for detected/decoded, low-confidence, opaque,
  encrypted, obfuscated, malformed, unsupported, rejected, aborted, and
  limit-exceeded notes.
- Unknown or low-confidence MakerNotes remain opaque and privacy fail-closed.
  No fallback may guess a vendor solely from camera make text.
- A plugin failure must not crash the host parser, leak raw sensitive values,
  mutate shared state, or make the overall result falsely complete.
- Integrate plugin results with metadata fields/blocks, registry identity,
  privacy, coverage, adapters, worker transfer rules, browser/Node boundaries,
  and package exports.

Required tests and evidence:

- Contract-test plugins authored in the repository for little/big endian,
  absolute and relative bases, nested IFDs, low confidence, unknown notes,
  encrypted/obfuscated notes, malformed output, thrown/rejected plugins,
  limits, aborts, and deterministic ordering.
- Tests proving two independent plugin sets cannot affect one another, import
  order cannot mutate global state, and a plugin cannot escape its bounded
  note/read range.
- Type tests for plugin authors and consumers, including browser-safe imports.
- A plugin-author guide, source-data schema, compatibility/versioning policy,
  and security review checklist.
- Redistribution-safe contract evidence, recommended at
  `reports/makernote-b07-contract-evidence.json` and `.md`.

Do not complete B07 until the public contract is executable through the normal
parse API and unknown/low-confidence behavior is proven opaque and fail-closed.

## Stage 5 — B08: Initial vendor MakerNote packs

Implement independent explicit-import packs for Apple, Canon, Nikon, Sony,
Fujifilm, Panasonic/Leica, and Pentax. Treat each vendor or documented shared
family as its own substage and complete its acceptance loop before starting
the next pack.

For every pack:

- Use the B07 contract without adding global registration or hidden imports.
- Record stable pack ID/version, supported signatures/models/versions,
  detection evidence, confidence rules, byte order, base-offset behavior,
  nested structure, encryption/obfuscation limitations, tag sources, licenses,
  and fixture provenance.
- Generate tag definitions deterministically from independently sourced data
  where appropriate. Reject duplicate or contradictory definitions.
- Implement only behavior supported by authoritative/vendor documentation or
  independently corroborated lawful evidence. Never copy competitor tables.
- Prioritize supported high-value identity, device/serial, lens, shutter-count,
  location/motion, focus, HDR, and capture-state fields. Retain exact lexical or
  rational values and source provenance.
- Give every decoded standardized or vendor field a stable identity, type,
  unit/enum semantics, repeatability, applicable versions/models, sensitivity,
  validation rule, raw-value behavior, and original-file provenance.
- Treat serials, identity, locations, motion, focus/subject, people, and
  workflow data as sensitive where applicable. Unknown vendor fields and
  undecoded portions remain privacy fail-closed.
- Represent encrypted, obfuscated, checksum-protected, compressed, unknown,
  low-confidence, and unsupported variants explicitly. Do not guess or report
  them decoded.
- Preserve duplicate tags/directories, nested paths, ordering, and conflicts.
- Keep the dependency-free core free of vendor packs unless a caller imports a
  pack explicitly. Verify tree-shaking and package export isolation.

Per-pack acceptance evidence:

- Multiple real lawful, hash-pinned vendor fixtures covering supported
  variants and high-value fields. At least one fixture is not meaningful
  breadth; justify the count based on model/version diversity.
- Independent secondary-oracle comparisons for every comparable decoded field,
  with matched, normalized-match, mismatch, missing-local, missing-reference,
  and non-comparable counts. Null/unsupported never counts as a match.
- Malformed signature, wrong vendor, low confidence, truncation, nested cycles,
  unsafe base offsets, invalid enums, oversized values, excessive counts,
  encrypted/obfuscated, duplicate, conflict, limits, abort, and privacy tests.
- A per-pack source/fixture manifest, documentation page, focused test suite,
  and redistribution-safe JSON/Markdown evidence.
- A generated cross-pack test proving one pack cannot claim another pack's
  fixtures and ambiguous detection remains opaque.

Do not mark B08 complete merely because the B07 API exists or one vendor pack
works. All seven listed vendor groups must have independently executable
evidence, truthful omissions, and passing integration/isolation tests.

## Stage 6 — B09: Additional containers gated by demand evidence

B09 is a demand and maintenance gate, not permission to increase a format
count. Independently verify whether any candidate has all four prerequisites:

1. a named, evidenced user workflow;
2. lawful conformance fixtures;
3. a defined bounded security model; and
4. a named maintenance owner recorded in repository governance.

Candidate formats include BMP, ICO, JPEG XR, SVG metadata, and camera sidecars,
but the roadmap does not require choosing from this list if another candidate
has stronger documented evidence.

Rules:

- Search repository issues, decision records, support requests, corpus
  frequency reports, and other retained evidence. External demand evidence
  must have stable links and retrieval dates.
- Do not invent users, workflows, issue links, corpus frequency, fixtures,
  ownership, or maintenance commitments.
- Produce a checked demand-decision artifact listing every evaluated candidate,
  evidence for each prerequisite, decision, and rationale.
- If no candidate satisfies all four gates, B09 cannot be claimed complete.
  Stop at B09 and report exactly which gates are absent. Do not add a format and
  do not continue to B10.
- If one or more candidates qualify, select the strongest justified candidate
  and document why. Implement exactly the approved scope as a separate
  conformance project using the same real-fixture, safe-arithmetic, malformed,
  limit, privacy, selection, public-contract, browser/Node, and retained
  evidence standards used above.
- Do not implement several weakly justified formats to improve marketing
  breadth.

Recommended decision evidence paths are
`reports/b09-demand-decision.json` and `.md`. If a format qualifies, add a
separate format-specific evidence report. B09 acceptance requires the selected
format's complete executable evidence, not the decision record alone.

## Stage 7 — B10: Sidecar XMP and metadata merge

Implement a sidecar-specific API rather than treating arbitrary XML as an
image container.

Minimum production requirements:

- Parse `.xmp` bytes through an explicit public sidecar API using the existing
  standards-based bounded RDF/XML model.
- Accept bytes and existing input abstractions in the dependency-free core. Do
  not add implicit filesystem access, extension-based trust, network access,
  DTD/entity expansion, or external-resource resolution.
- Return stable sidecar source identity, packet/block ranges, namespaces by URI
  and local name, properties, arrays, language alternatives, qualifiers,
  lexical values, nested resources, unknown properties, diagnostics,
  completeness, and coverage.
- Merge embedded and sidecar metadata through an explicit API with caller-
  selected precedence. The default must preserve every candidate and every
  conflict; it must never silently choose first/last or overwrite repetitions.
- Preserve source order, packet/block identity, namespace URI/local-name
  identity, source kind, source ID, source ranges, and derivation provenance for
  every merged candidate.
- Define explicit policies for embedded-first, sidecar-first, preserve-all,
  reject-conflicts, and any supported field-specific override. Lossy policies
  must be named and documented.
- Reuse generated EXIF/IPTC/XMP registry identities and semantic mappings where
  applicable. Keep fields in different metadata groups or namespaces distinct.
- Preserve unknown XMP properties and privacy fail-closed behavior.
- Integrate conflicts with T01 privacy inspection, T02 policies, W01 mutation
  planning, adapters, workers, browser/Node exports, and JSON-safe reporting.
- Support generation of a new bounded XMP sidecar through the existing RDF/XML
  serializer without modifying image bytes. Return bytes; do not write paths in
  the core. Serialization must escape safely, reject unsupported/lossy values
  unless explicit policy permits them, reparse, and compare semantics before
  returning output.

Required tests and evidence:

- Official or authoritative RDF/XML/XMP vectors plus lawful real embedded and
  sidecar pairs.
- Arrays, ordering, duplicates, language alternatives, qualifiers, nested
  structures, namespace-prefix changes, unknown properties, conflicts,
  malformed XML, encoding errors, DTD/entity attacks, excessive depth/counts,
  limits, abort, and cumulative-output tests.
- Every precedence/conflict policy, default preserve-all behavior, exact
  provenance, serialization/reparse equivalence, XML escaping/injection, and
  proof that source image bytes are never touched.
- Worker transfer, browser, Node, Deno where available, package export,
  declaration, bundle-isolation, and JSON-safe adapter tests.
- Redistribution-safe evidence, recommended at
  `reports/sidecar-b10-evidence.json` and `.md`.

Do not complete B10 until merge conflicts remain fully observable by default
and sidecar serialization has semantic reparse evidence.

Because B10 adds a serializer, apply the roadmap's mandatory writer-review
gate to its exact diff. Self-review is not human approval. Do not continue to
R01 unless the required human review is genuinely recorded; otherwise stop
with a complete review packet and identify the pending approval precisely.

## Stage 8 — R01: Stabilize the 2.0 public API

Treat R01 as a release contract, not a documentation-only ticket.

Required deliverables:

- Publish-ready API decision record covering naming, result shape,
  discriminated success/failure outcomes, async/sync boundaries, input types,
  mutation atomicity, coverage/completeness, diagnostics, provenance, raw
  values, privacy defaults, writers, optional adapters, and extension/plugin
  contracts.
- A precise deprecation policy with support period, warning/type behavior,
  replacement naming, removal rules, and semver expectations.
- A browser/runtime support policy covering exact supported Node, browser,
  worker, Deno, Bun, module, CommonJS, WASM/optional-adapter, and serverless
  boundaries. Derive the matrix from tested CI rather than aspiration.
- A versioned JSON Schema for the stable result and important operation
  outcomes. Validate representative and adversarial serialized results against
  it and test schema/version compatibility.
- Type-level contract tests locking every public overload, generic,
  discriminated union, selector, plugin, sidecar, writer, policy, and adapter
  result. Include expected compile failures.
- Runtime contract tests locking package-root and subpath exports in ESM,
  CommonJS, browser, worker, and Node contexts.
- Audit misleading, duplicate, or redundant names. Remove or deprecate them
  before RC only when the decision record and migration path justify the
  change. Do not perform cosmetic churn or silently break consumers.
- Lock the API through generated declaration/API snapshots and the existing
  release baseline. Drift must fail CI until explicitly reviewed.
- Reconcile README, API reference, capabilities, security model, migration
  guidance, changelog, examples, package exports, and declarations.

Do not complete R01 while any public result is only privately tested, the JSON
Schema omits supported discriminants, or documented runtime support lacks an
executed matrix result.

## Stage 9 — R02: Documentation site and local-only playground

Build a production-ready documentation site without adding framework/runtime
weight to the dependency-free core.

Required deliverables:

- Searchable EXIF tag, IPTC dataset/property, XMP namespace/property, ICC
  semantic, policy, selector, format, and capability pages generated
  deterministically from repository source data.
- Stable URLs/anchors, cross-links, source edition/provenance, sensitivity,
  types, cardinality, versions, validation, raw behavior, and support status.
- A runnable local-only playground exposing blocks, fields, raw/semantic
  values, coverage, privacy findings, policy decisions, planned edits, byte
  changes, and preservation verification.
- Default playground behavior must parse local bytes only. No analytics,
  telemetry, uploads, remote fonts, CDN scripts, or hidden network requests.
- A restrictive tested CSP that prevents unintended uploads/connections. Keep
  any fetch demonstration on a separate, conspicuously labeled route with its
  transport/security policy visible.
- Safe rendering: no unescaped metadata HTML, script execution, object-URL
  leak, raw-sensitive-value exposure by default, or unbounded table/tree
  rendering.
- Accessible keyboard navigation, labels, focus behavior, semantic structure,
  responsive layout, useful empty/error/limit states, and deterministic builds.
- Complete recipes for browser, worker, Node, Deno, Bun, Vite, Next.js, React,
  and serverless runtimes. Compile or run every recipe in the applicable real
  runtime; unavailable runtimes remain explicitly unverified.
- Documentation link, anchor, code-snippet, generated-page, CSP, local-only
  network, accessibility, and browser end-to-end tests.
- Package/build isolation proving documentation dependencies never enter core
  or ordinary parser bundles.

Do not accept screenshots or a development server merely starting as evidence.
Production build, static serving, navigation, search, playground behavior, CSP,
and local-only network assertions must run in CI.

## Stage 10 — R03: Small CLI

Implement an intentionally small Node CLI with these explicit commands:

- `inspect`
- `audit`
- `sanitize`
- `edit`
- `verify`
- `benchmark-file`

Required behavior:

- JSON is the default machine-readable output. Provide an explicit readable
  table mode without changing semantic outcomes.
- Use existing public APIs rather than separate parser/mutation logic.
- `inspect` exposes bounded metadata, coverage, completeness, provenance, and
  diagnostics.
- `audit` uses T01 safe-by-default privacy serialization. Sensitive raw values
  require a deliberate documented opt-in and must never leak to errors/table
  output by default.
- `sanitize` uses named/versioned T02 policies and refuses strict-policy output
  when coverage or exact targeting is insufficient.
- `edit` uses existing typed mutation operations, preflight, atomic writes, and
  reparse verification.
- `verify` uses W08 preservation verification and clearly distinguishes it from
  C2PA inventory or optional official verification.
- `benchmark-file` records bounded reproducible timing, byte-read, memory where
  supportable, package/runtime identity, input hash/length, selected operation,
  warmup, and iterations. It must not compare unequal semantic work.
- Never overwrite a source path. Output-producing commands require stdout or an
  explicit distinct destination. Reject same-file aliases/symlinks and existing
  destinations unless a separately named safe policy is explicitly designed.
- When writing a destination, use a temporary sibling plus atomic rename where
  the platform permits, clean up failed temporary output, and never mutate the
  source. Do not claim crash-safe behavior unless proven.
- Define stable exit codes for success, usage, unsupported input, incomplete
  coverage, policy refusal, malformed input, verification failure, I/O failure,
  and internal failure.
- Support stdin/stdout where safe, including binary-output separation from
  diagnostics. Prevent terminal escape/control-sequence injection.
- Keep Node-only code and dependencies in isolated CLI files/exports. Core and
  browser bundles must not import CLI dependencies transitively.
- Add `--help`, `--version`, command-specific help, deterministic argument
  validation, abort/signal handling, and documented limits.

Required tests:

- Spawn the built CLI and the packed-tarball CLI, exercising every command in
  JSON and table modes.
- Positive, malformed, unsupported, duplicate, conflict, limit, privacy,
  policy-refusal, no-overwrite, same-file/symlink, interrupted write, exit-code,
  stdin/stdout, terminal escaping, and atomic failure cases.
- Compare CLI JSON semantics with direct library results.
- Prove browser/core bundles and dependency graphs contain no Node CLI code or
  dependencies.

Do not complete R03 until all six commands run through the packaged binary and
source-overwrite refusal is proven across relevant path-equivalence cases.

## Stage 11 — R04: Migration and compatibility assets

Produce accurate executable migration material for exifr, ExifReader, exif-js,
and piexifjs.

Required deliverables:

- Copy/paste mappings for common imports, input forms, field access, EXIF
  groups, dates, GPS, rationals, duplicate fields, unknown tags, XMP/IPTC/ICC,
  thumbnails, errors/warnings, privacy inspection, and writing where the source
  library supports it.
- Side-by-side outputs generated from lawful hash-pinned fixtures and pinned
  competitor versions. Explicitly explain changed date/timezone, rational,
  duplicate, raw/semantic, warning/error, missing/undefined/null, and ordering
  semantics.
- Never make this package mimic ambiguous or lossy competitor behavior by
  default. Use explicit compatibility adapters where they already exist.
- Compile and execute every replacement snippet against the packed package.
- Record unsupported mappings and semantic loss instead of inventing an
  equivalent.
- Cite official competitor documentation and licenses; summarize rather than
  copying substantial copyrighted text or implementation.
- Add deterministic compatibility reports and tests that fail on stale API,
  output, version, fixture hash, or documentation anchors.

A codemod is conditional, not mandatory marketing output. Implement one only
for transformations proven syntactically and semantically high-confidence,
such as exact import/helper replacements. If no safe transformations justify a
codemod, retain a reviewed decision record explaining why. A codemod must be
idempotent, preserve formatting/comments, refuse ambiguous cases, include
dry-run/check modes, and have fixture-based tests.

Do not complete R04 until every published snippet is executable and every
semantic difference is explicit.

## Stage 12 — R05: Release candidate and GA audit

R05 is an evidence and governance gate. Do not change product scope merely to
make the audit green.

Required automated audit:

- Reproduce required CI from a genuinely clean checkout containing the exact
  candidate changes. A dirty working tree or tarball smoke test alone is not a
  clean-clone result.
- Run all required unit, integration, type, lint, coverage, build, package,
  publint, examples, generated-artifact, declaration/API-schema, documentation,
  link, browser, worker, Node, Deno, Bun, CLI, playground, fuzz, external
  corpus, official reference, differential, benchmark, bundle-size, bundle
  closure, dependency, license, provenance, and security checks.
- Verify scheduled workflows run the same gates and upload complete reports.
- Pin and record OS, architecture, runtime, package manager, browser, external
  tool, corpus, fixture, registry, policy, standard, and package versions.
- Run dependency vulnerability and license scans without treating an
  unavailable scanner as passing. Review optional, development, native, WASM,
  and documentation dependencies separately from the dependency-free core.
- Verify package provenance, package contents, export conditions, source maps,
  declaration paths, side effects, optional-peer isolation, reproducible build
  facts, and install/import smoke tests.
- Run fuzzing with retained seed/corpus identity, bounded duration/iterations,
  crash/hang/OOM criteria, and minimized regression fixtures for any failure.
- Run external corpora and official reference assets in temporary untracked
  storage, verifying pinned hashes and preserving redistribution-safe evidence.
- Run the benchmark suite without changing thresholds or comparing unequal
  work. Record regressions honestly.
- Check all documentation links, anchors, examples, compatibility claims,
  capability cells, limitations, and release wording against executable
  evidence.
- Search public text for unsupported claims including “fully featured”,
  “safest”, and “fastest”. Such claims require a defined scope and direct linked
  evidence; otherwise remove them.

Required human/external gate:

- The roadmap requires an external review of TIFF offset handling and every
  writer. Model self-review, another automated model pass, or internally
  generated evidence does not satisfy this requirement.
- First search for actual retained external-review records identifying the
  reviewer, scope, reviewed revision/diff, findings, dispositions, and date.
- If absent, prepare a complete review packet with architecture, threat model,
  public contracts, offset/range invariants, writer atomicity, byte-preservation
  maps, tests, fuzz/corpus evidence, known limitations, and exact review
  questions.
- Do not fabricate a reviewer or approval. Without actual external review, R05
  remains blocked and GA acceptance must not be claimed.

Release/publication constraint:

- Prepare the compatibility/limitations report and all release artifacts in
  publish-ready form, but do not publish, tag, commit, push, or create a release.
- Actual publication cannot be claimed while this prompt's no-publish rule is
  active. Report it as a remaining release action unless the repository already
  contains independently verifiable publication evidence for the exact
  candidate.

Do not complete R05 or claim 2.0 GA readiness unless every automated gate
passes, the clean-clone result covers the exact candidate, the external
TIFF/writer review is real and accepted, and every release claim is supported.

## Final integrated verification

After the last implementable ticket, run all applicable repository gates using
the scripts that actually exist at that point. At minimum:

- every focused test added or changed for B04-B10 and R01-R05;
- all affected parser, registry, privacy, mutation, writer, adapter, worker,
  browser, Node, CLI, documentation, playground, package, and compatibility
  suites;
- every real external corpus and official-reference command required by the
  touched tickets;
- generated registry, capability, documentation, schema, declaration, and
  evidence consistency checks;
- type checking and lint;
- coverage without lowering thresholds;
- build, publint, package contents, packed-package smoke, examples, bundle-size,
  and dependency-isolation checks;
- browser projects in every supported engine;
- Deno and Bun checks when claimed or required;
- documentation build, local-only network/CSP tests, link/anchor checks, and
  executable recipe tests;
- CLI packaged-binary tests;
- fuzzing and benchmarks required by R05;
- `git diff --check`;
- the release baseline refresh and verification under repository policy; and
- `npm run check`.

If a runtime, browser, external tool, corpus, fixture, network resource, SDK,
scanner, or reviewer is unavailable, report that separately and leave the
associated criterion unproven. Never convert unavailability into a pass.

Fix every in-scope failure. Do not fix unrelated failures unless the current
work directly caused them; preserve and report pre-existing failures with
evidence.

## Final self-audit

Before finishing or stopping at a blocker:

1. Re-read every attempted roadmap ticket in full.
2. Produce a criterion-by-criterion acceptance matrix for each ticket.
3. Inspect the complete diff and all untracked files created during the run.
4. Reconcile README, API docs, capabilities, security documentation, decision
   records, migration guides, runtime support, changelog, package exports,
   declarations, JSON Schema, generated sites/pages, workflows, reports, and
   release baseline.
5. Search the repository for placeholders, TODOs, stubs, pseudocode,
   skipped/quarantined/`.only` tests, weakened assertions or thresholds,
   silent no-run success, fake evidence, warning-text decisions, unsupported
   claims, leaked sensitive values, hidden network access, global plugin
   mutation, Node dependencies in browser/core bundles, extension-only format
   detection, raw-payload decoding, and accidental source overwrite paths.
6. Verify all generated and retained evidence is internally consistent,
   redistribution-safe, hash-pinned where applicable, and generated by an
   executable failing gate.
7. Fix every in-scope issue and rerun verification.

## Final response

Report all of the following without omitting failed or unavailable checks:

- Completion status for B04, B05, B06, B07, B08, B09, B10, and R01-R05.
- A per-ticket acceptance matrix mapping every criterion to exact source,
  public tests, documentation, workflows, reports, and generated evidence.
- All changed files and generated artifacts, separated by ticket.
- Standards, vendor sources, licenses, versions, retrieval dates, fixtures,
  hashes, independent tools, and report paths.
- B04 file-kind participation and TIFF-derived preview/directory results.
- B05 separate CR3 and RAF real-fixture results.
- B06 resource counts, decoded resource coverage, unknown-byte preservation,
  writer invariants, and human writer-review status.
- B07 plugin contract, isolation, limits, confidence, opaque behavior, and
  package/export results.
- B08 per-vendor pack versions, fixtures, decoded/comparable counts,
  mismatches, privacy behavior, and cross-pack isolation.
- B09 demand evidence, named workflow, fixtures, security model, maintenance
  owner, selected format and results, or the precise blocking gates.
- B10 sidecar parsing, merge/conflict policies, provenance, serialization
  round-trip, and no-image-mutation proof.
- R01 API decisions, deprecations, runtime matrix, JSON Schema, type/runtime
  contract results, and compatibility impact.
- R02 generated registry/site coverage, playground behavior, CSP/local-only
  proof, accessibility/browser results, and recipe execution status.
- R03 all six commands, exit codes, JSON/table results, no-overwrite and atomic
  output proof, packed-binary tests, and browser/core isolation.
- R04 competitor versions, executable mappings, side-by-side semantic
  differences, compatibility report paths, and codemod decision/results.
- R05 automated audit matrix, clean-clone identity, corpus/reference/fuzz/
  benchmark/provenance/license results, external TIFF/writer review status,
  publication status, and remaining release actions.
- Exact commands and pass/fail/test/coverage counts for focused and integrated
  verification.
- Package size, runtime, compatibility, dependency, and public API impact.
- Every genuine blocker or acceptance criterion that remains unproven.

Do not claim all tickets complete, release-candidate acceptance, or GA
readiness unless every executable and governance criterion is genuinely
proven. Do not present self-review as human or external approval.
