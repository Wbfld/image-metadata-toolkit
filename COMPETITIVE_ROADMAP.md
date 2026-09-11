# Competitive gap analysis and implementation roadmap

Status: planning document, based on the working tree and public competitor documentation inspected on 2026-09-11.

This plan targets the package published as `browser-image-metadata` from the `image-metadata-toolkit` repository. The working tree inspected for this plan is the unreleased `2.0.0-alpha.3` state, including its uncommitted changes. Re-run the baselines in this document after those changes are committed because the repository's current `main` commit does not contain the whole audited implementation.

## Executive recommendation

Do not try to win by claiming to have the largest tag dictionary or the lowest time on one tiny JPEG. ExifReader already has broad, actively maintained format and tag support, while exifr has a very simple API, mature optimizations, and substantial installed usage.

The most defensible position is:

> The trust-first image metadata engine for JavaScript: inspect, explain, edit, sanitize, and verify metadata locally without silently corrupting images or claiming work was completed when it was not.

Reach read-compatibility on mainstream files, then lead in five areas that the two incumbents do not offer together:

1. Safe, transactional metadata editing and redaction with byte-level preservation evidence.
2. Fail-closed privacy policies with explicit coverage, uncertainty, and unapplied operations.
3. Current standards support: Exif 3.1, IPTC Photo Metadata 2025.1, MPF 2025, Ultra HDR, and C2PA/JUMBF awareness.
4. Real block provenance: exact source ranges, associated image/item, decode status, and warnings for every value.
5. Browser-first range I/O, workers, cancellation, and a dependency-free core with optional standards adapters.

The current implementation has already built much of the safety wedge. It is not yet a credible general replacement for ExifReader or exifr because metadata vocabulary depth, MakerNotes, MPF/Photoshop/ICC interpretation, input adapters, real-world evidence, and arbitrary editing are still materially behind.

## Evidence and baseline

### Local package snapshot

| Area | Audited state |
| --- | --- |
| Package | `browser-image-metadata@2.0.0-alpha.3` (unreleased working tree) |
| Public containers | JPEG, PNG, TIFF/BigTIFF, WebP, GIF, JPEG XL, HEIF, AVIF |
| Public families | EXIF, XMP, IPTC-IIM, ICC header/directory, JFIF, PNG text, selected container transforms |
| Modification | Lossless removal for JPEG, PNG, and WebP; selective EXIF surgery for JPEG and PNG; no arbitrary writer |
| Inputs | `ArrayBuffer`, `ArrayBufferView`, `Blob`/`File`; separate bounded fetch adapter |
| Named EXIF definitions | 138 entries in `src/normalize/descriptions.ts`; unknown entries are retained numerically |
| Named IPTC-IIM datasets | 21 |
| ICC interpretation | 7 header fields plus validated tag directory ranges; tag payloads are not decoded |
| Checked-in fixture files | 41 entries including the fixture README and source PPM |
| Tests | 221 passing tests across 10 Vitest files |
| Coverage | 89.37% statements/lines, 97.72% functions, 75.27% branches in the audited run |
| Build/package | ESM and CJS build passed; `publint` and tarball smoke passed with an isolated npm cache |
| Example smoke | ESM, CJS, Blob, typed-array, and Node worker examples passed |
| External corpus | 108-file scheduled corpus, but only overlapping Make, Model, Orientation, and dimensions are compared |
| Benchmark sample | Warm 25-run medians on tiny fixtures ranged from 0.056 ms to 0.845 ms; this is useful for regression detection, not a competitor claim |

The normal `npm run check` reached `publint` and then failed because `/Users/will/.npm` contains root-owned cache files. Running `publint` and `package:smoke` with `npm_config_cache` pointed at `/private/tmp` passed. This is a workstation problem, but the release instructions should document a clean-cache diagnostic so it is not mistaken for a code failure.

### What is already genuinely strong

- Bounds exist for input, metadata, segments, IFD depth and entries, strings, decompression, warnings, and several container-specific structures.
- Malformed nested structures normally become structured warnings instead of unhandled parser exceptions.
- Exact rational and out-of-range 64-bit TIFF values are retained instead of silently rounded.
- Metadata-family and EXIF-tag selection are applied across the principal containers.
- Blob/File metadata-only reads skip pixel payloads for JPEG, PNG, WebP, classic TIFF, HEIF, and AVIF.
- The worker client has request IDs, queue limits, cancellation, and transferable-buffer coverage.
- Redaction is designed to fail atomically when surgery cannot be proven safe.
- `sanitizeMetadata()` returns no bytes when its policy cannot be satisfied.
- MPF and Ultra HDR are detected before JPEG mutation and currently cause a safe refusal.
- The package has a focused export map, declarations for ESM and CommonJS, tarball smoke tests, browser tests, fuzzing, and trusted-publishing documentation.
- MIT licensing is simpler for many commercial adopters than ExifReader's MPL-2.0 licensing.

### Important gaps hidden by the headline feature list

1. `MetadataResult.blocks` is not yet real provenance. `src/result.ts` creates one synthetic record per detected family after parsing. Offsets and lengths are null, duplicate packets/segments are collapsed, `associatedImage` is null, and every block receives the full result's warning codes.
2. `completeness` is mostly result-wide. It does not say, for example, that EXIF was complete while XMP was malformed and MakerNote remained opaque.
3. The tag vocabulary is narrow. Unknown EXIF is retained safely, but most less-common standard, DNG, Windows, vendor, and Exif 3.0/3.1 fields do not get names, enums, validation, or useful display values.
4. XMP parsing is intentionally small. It handles simple RDF properties, arrays, and language alternatives but not the full RDF/XMP data model, typed schema mapping, qualifiers, nested resources, aliases, or semantic privacy classification.
5. IPTC support covers 21 IIM datasets, not the current IPTC Core and Extension model. Current accessibility, rights, regions, data-mining, and AI-generation properties live primarily in XMP and are not normalized.
6. ICC support validates structure but does not decode the common tag payload types or expose colorant/TRC/profile-description values that exifr documents.
7. MakerNote is opaque. MPF is only recognized for refusal. Photoshop resources other than the IPTC resource are not interpreted.
8. `fetchMetadata()` bounds and streams a response, but it does not issue HTTP Range requests or let the parser seek directly into a remote asset.
9. The range readers rebuild compact synthetic containers and then invoke legacy parsers. This duplicates structural knowledge and will become fragile as support expands.
10. There is no Node path/FileHandle adapter, sidecar XMP API, base64/data URL adapter, HTML image adapter, or documented React Native path.
11. TIFF/BigTIFF, GIF, JPEG XL, HEIF, and AVIF cannot be redacted. WebP cannot selectively retain or remove individual EXIF fields.
12. JPEG XL has no dimensions and no Brotli-compressed metadata support. HEIF/AVIF intentionally omit multiple construction modes, external references, sequences, and much item-property semantics.
13. Image details are not a consistent first-class model. Animation, bit depth, color model, progressive/interlaced state, frame count, alpha, and primary/auxiliary image relationships vary by parser or are absent.
14. The benchmark only measures this package, mostly on sub-25 KiB fixtures after module warm-up. It does not measure cold import, dependency closure, peak memory, remote byte reads, large metadata, batches, or equal-output comparisons with competitors.
15. The scheduled external corpus gate is broad in file count but shallow in asserted metadata. A parser can miss most fields and still pass because absent actual fields are skipped.
16. Four repository commits and a large uncommitted alpha mean there is not yet enough release history to support a reliability reputation.
17. Branding is split between repository name `image-metadata-toolkit` and package name `browser-image-metadata`. That weakens search recall and copy/paste discovery unless the relationship is made explicit everywhere.

## Competitor snapshot

This table compares documented public behavior, not every implementation detail.

| Capability | This package today | ExifReader 4.45.0 | exifr 7.1.3 | Required response |
| --- | --- | --- | --- | --- |
| Weekly npm use at snapshot | Pre-launch/alpha | About 139k downloads, 134 dependents | About 1.08m downloads, 205 dependents | Treat adoption as a separate product problem |
| Activity | Large unreleased alpha | Actively published in September 2026 | Last npm release shown as five years old | Ship predictably and publish transparent compatibility reports |
| Containers | Strong headline breadth | Same major eight image families | JPEG, TIFF/IIQ, PNG, HEIF/AVIF are documented | Match depth, not just format detection |
| EXIF/TIFF | Safe core, BigTIFF, 138 named definitions | Broad standard dictionaries and computed values | Broad standard/proprietary dictionaries and configurable dictionaries | Generate a complete current registry and validators |
| MakerNotes | Opaque | Some Canon and Pentax | Proprietary/less-common tags documented in full build | Add a plugin boundary, then high-value vendor packs |
| XMP | Raw packets, Extended XMP reassembly, bounded basic RDF | Broad XMP output | XMP and Extended XMP with structured output | Build a standards-oriented RDF model and schema layer |
| IPTC | 21 IPTC-IIM datasets | Broad IPTC support | IPTC support | Add full IIM plus current Core/Extension mapping |
| ICC | Header and tag ranges | ICC fields | Multi-segment ICC and tag values | Decode common ICC payload types safely |
| MPF/Photoshop | MPF refusal; IPTC resource only | MPF and some Photoshop tags | No comparable headline claim | Parse MPF and Photoshop resource inventories |
| Inputs | Bytes and Blob/File; explicit fetch adapter | Bytes, File, URL, path; automatic metadata range | Bytes, Blob, URL/path, image element, base64, sidecar | Add explicit optional adapters without making core I/O surprising |
| Range reads | Excellent Blob/File direction, but parser-specific compacting | `length: 'auto'` supports HTTP, path, and File range reads with offsets | Chunked/pointer reads | Introduce one seekable `ByteSource` used by every parser |
| Common-task API | Typed GPS/orientation/rotation/time/thumbnail helpers | Flat tags, expanded groups, computed/composite tags | Very concise `parse`, `gps`, `orientation`, `rotation`, `thumbnail`, `sidecar` | Keep typed APIs but add ergonomic flat/compatibility views |
| Editing | Removal/sanitization only | No supported writer documented; writing request remains open | No writer documented | This is the clearest leapfrog opportunity |
| Safety contract | Strong explicit limits and fail-closed outcomes | New limits and controlled-error work are documented | Salvage behavior is emphasized more than explicit proof | Make coverage and preservation evidence real and externally tested |
| Bundles | Good lazy entry shells; true loaded closure not reported | Custom builds around 9 KiB Brotli for small tag sets | Mini/lite/full bundles around 8/12/22 KiB gzip | Report cold dependency closure and offer generated tag packs |
| License | MIT | MPL-2.0 | MIT | Keep the core MIT and audit all imported data licenses |

The market numbers are a moving snapshot, not a success guarantee. Exifr's download count also includes transitive and legacy use. The useful conclusion is that API familiarity, documentation, and migration cost matter as much as parser quality.

## Product position and unique selling points

### Primary wedge: provably safe metadata workflows

The package should make every operation answer four questions:

1. What metadata-bearing structures were found?
2. What was decoded, skipped, malformed, or opaque?
3. What bytes changed, and what image payload bytes were proven unchanged?
4. Did the requested policy fully succeed?

This turns the current warnings/outcome concept into a marketable contract rather than an internal implementation detail.

### Secondary wedge: the first standards-current JavaScript toolkit

Prioritize current fields that solve real workflows:

- Exif 3.0/3.1 UTF-8 strings, ImageTitle, photographer/editor/software lineage, LearningOptOutIn, development type, and correction-processing fields.
- IPTC 2025.1 accessibility, rights, data-mining, digital-source type, image regions, and AI system/prompt fields.
- MPF 2025 and Ultra HDR gain-map inventories that are preserved or rewritten deliberately.
- C2PA/JUMBF presence and integrity awareness. Full cryptographic validation must be delegated to the official Content Authenticity Initiative SDK, not reimplemented casually.

### Third wedge: one read/edit/policy model

Users should not need one package to read, another to write, and custom byte surgery to sanitize. The desired pipeline is:

```text
Memory / Blob / HTTP Range / FileHandle
                    |
               ByteSource
                    |
       container index with exact spans
                    |
       typed metadata blocks and fields
                    |
     normalized graph + conflicts + coverage
                    |
       policy / mutation transaction plan
                    |
     writer + reparse + payload verification
```

### Optional growth wedge: modern creator metadata

After the standards core is stable, optional schema packs can interpret bounded metadata from ComfyUI, Stable Diffusion/A1111, InvokeAI, and other creator tools. Keep these volatile conventions outside the core parser. Combine them with standard IPTC AI fields rather than inventing another permanent core schema.

## Product and architecture decisions to settle before expansion

### Preserve the current safe defaults

- The core parser must never fetch URLs or open paths implicitly.
- Network, filesystem, C2PA, and volatile schema features belong in explicit entry points.
- The core stays dependency-free. Optional entry points may have peer or optional dependencies.
- Malformed nested metadata returns diagnostics; programmer errors and top-level resource-policy violations may throw typed errors.
- Writers return new bytes and never mutate source bytes or files in place.
- Unknown blocks and fields are preserved by default during edits unless an explicit policy removes them.

### Replace synthetic provenance with a container index

Each container parser should produce an internal index before decoding values. A block should carry at least:

```ts
interface SourceSpan {
  offset: number;
  length: number;
}

interface MetadataBlock {
  id: string;
  family: MetadataBlockFamily;
  container: string;
  status: "decoded" | "partial" | "opaque" | "malformed" | "skipped";
  source: readonly SourceSpan[];
  associatedImage: string | null;
  warningCodes: readonly WarningCode[];
}
```

Fields should reference their source block and exact entry/value spans. Do not expose mutable views into the input.

### Introduce a single seekable byte abstraction

All parsers should eventually read through a small async abstraction such as:

```ts
interface ByteSource {
  readonly size: number;
  read(start: number, length: number, signal?: AbortSignal): Promise<Uint8Array>;
}
```

Adapters should cover in-memory bytes, Blob/File, HTTP Range, and Node FileHandle. Add request coalescing, caching, byte/request counters, and hard budgets around the abstraction. Do not add separate container-specific remote readers.

### Generate vocabulary data

Move tag names, types, descriptions, enum maps, sensitivity, cardinality, validation, and writing rules into reviewed data files. A generator should emit compact TypeScript maps and declarations. Runtime custom registries should be explicit and immutable per parser instance so one consumer cannot mutate process-global dictionaries.

Do not copy source code or large tag tables from ExifReader, exifr, or ExifTool into this MIT project. Use official standards, independently written mappings, and provenance/license records for every generated dataset. Vendor tables need an explicit legal review and source record.

### Make mutation transactional

The future writer should consume a plan, validate it, calculate all affected offsets and lengths, build output into new buffers, reparse the output, and verify invariants before returning success.

Provisional API shape:

```ts
const edited = await editMetadata(input, {
  operations: [
    { op: "set", field: "EXIF:ExifIFD:0x9003", value: "2026:09:11 12:00:00" },
    { op: "delete", selector: { sensitivity: "high" } },
    { op: "set", field: "XMP:dc:rights", value: { "x-default": "Copyright ..." } },
  ],
  preserveUnknown: true,
  verifyImagePayload: true,
});

if (!edited.successful) showReasons(edited.reasons);
```

Do not finalize names until the API design ticket supplies type tests and migration examples.

## Release gates and measurable definition of “better”

The package should not claim general superiority. It may claim a specific win only when the corresponding public benchmark or conformance report passes.

### Read correctness gate

- At least 1,000 redistributable or pinned external real-world files across supported containers, producers, byte orders, metadata sizes, and malformed cases.
- For standardized fields supported by both tools, at least 99% exact semantic agreement with ExifTool after documented normalization.
- No fixture may silently lose a metadata block that ExifTool and at least one incumbent both find; an intentional unsupported block must appear as `opaque` or `skipped` with a reason.
- Every standardized Exif 3.1 tag has a registry entry, type/cardinality metadata, and at least one generated unit case. High-value tags also need independently produced binary fixtures.
- Every format capability in the public matrix is generated from executable contract tests.

### Robustness and security gate

- No unexpected throw, hang, out-of-bounds read, or unbounded allocation in scheduled mutation/truncation/property tests.
- Fuzz each container indexer and each metadata decoder separately, not only the root API.
- Every decompressor has per-value and cumulative output limits plus cancellation tests.
- Security-relevant parsers have at least 90% branch coverage; overall branch coverage reaches at least 85% without excluding difficult files.
- Run a continuous native fuzzer or a high-volume JS fuzz job in addition to the short Vitest property suite.

### Writer gate

- For at least 500 representative files per writable container family, output reparses successfully in this package and independent tools.
- Encoded image payload hashes are byte-identical for lossless metadata-only operations.
- Edits preserve unknown metadata by default and prove what was removed or rewritten.
- Interrupted or failed work returns no output bytes and never alters the original file.
- MPF, Ultra HDR, and C2PA-bearing files are either correctly updated with independent validation or rejected before modification.

### Performance gate

- Compare equal inputs and equal requested outputs with pinned ExifReader and exifr versions.
- Report cold import, first parse, warm parse, batches, peak memory, bytes read, HTTP request count, and full loaded dependency closure.
- On the common JPEG/HEIC GPS, orientation, date, and camera tasks, target no more than 1.25x the fastest incumbent median and no more bytes read than ExifReader's automatic-range mode.
- Keep detection at or below 1.5 KiB gzip and set mini/full closure budgets only after measuring actual transitive chunks. Never market the size of a lazy shell as the whole operation.

### Runtime and packaging gate

- Node 22/24/26, Chromium, Firefox, WebKit, Deno, Bun, and one worker/serverless runtime have executable smoke tests.
- Add React Native only after a real device or emulator test exists; documentation alone does not count.
- ESM, CommonJS, declarations, export maps, source maps, side-effect flags, and tarball contents pass in clean consumers.
- Every release publishes provenance, a changelog, a compatibility report, and benchmark artifacts.

### Adoption gate

- A new user can install, read GPS, remove GPS, edit a caption, and verify unchanged image payloads from five copy/paste examples.
- Migration recipes cover exifr, ExifReader, exif-js, and piexifjs use cases.
- Public issue templates collect a lawful fixture, producing device/software, expected result, runtime, and redacted metadata report.
- Track weekly downloads, direct dependents, docs-to-install conversion, issue response time, and repeat contributors. Do not optimize for unaudited star or download campaigns.

## Roadmap overview

| Milestone | Required work | Product result |
| --- | --- | --- |
| M0: Truthful alpha | Foundation tickets F01-F07 | Public claims exactly match executable evidence |
| M1: Read-parity beta | Standards tickets S01-S09 plus I/O I01-I02 | Credible replacement for common read workflows |
| M2: Trust/edit beta | Mutation tickets W01-W08 and trust tickets T01-T03 | Clear product advantage over read-only incumbents |
| M3: 2.0 GA | Release tickets R01-R05 and all GA gates | Stable, documented, independently verified release |
| M4: Breadth releases | Format/plugin tickets B01-B10 and growth tickets G01-G04 | Deep vendor, RAW, creator, and multi-image coverage |

Do not assign a whole milestone to one coding model. Give it exactly one ticket and one definition of done per session.

## M0: Truthful alpha and architectural foundation

### F01 — Capture a reproducible baseline

Size: S. Dependencies: none.

Deliverables:

- Add a script that emits package version, git commit/dirty state, runtime, test counts, coverage summary, tarball size, export entry sizes, and benchmark fixture hashes.
- Store a checked-in baseline JSON for each planned release, not for every local run.
- Change benchmarks to distinguish source input bytes from bytes actually read.
- Include cold and warm measurements separately.

Acceptance:

- The report is deterministic except for explicitly labeled timing/memory fields.
- It fails when a referenced fixture or competitor version changes without baseline review.
- Documentation does not quote timing without a report filename and environment.

Likely files: `scripts/baseline.mjs`, `scripts/benchmark.mjs`, `BENCHMARKS.md`, `package.json`, `tests/baseline.test.ts`.

### F02 — Implement real metadata block provenance

Size: L. Dependencies: F01.

Deliverables:

- Remove the synthetic `metadataBlocks()` construction in `src/result.ts`.
- Make each container parser emit a block per actual APP segment, PNG/WebP chunk, TIFF tag/directory, GIF/JXL extension/box, or HEIF/AVIF item/property.
- Record exact source ranges, decode status, associated image/item, and only warnings belonging to that block.
- Give duplicate blocks stable distinct IDs.
- Link fields to a source block ID and entry/value spans.

Acceptance:

- Two XMP packets produce two block records.
- Extended XMP records all component spans and its assembled relationship.
- HEIF metadata identifies the associated primary/thumbnail item when known.
- Offsets index the original input even for range reads; they never point into a compact synthetic buffer.
- Contract tests assert offsets against hand-built fixtures.

Likely files: `src/types.ts`, `src/result.ts`, every file under `src/parsers/`, metadata range readers, integration tests.

Implementation note: split this ticket by container if the first design patch exceeds roughly 500 changed lines. Merge the types and JPEG implementation first, then migrate one parser per follow-up ticket.

### F03 — Add family- and block-level coverage

Size: M. Dependencies: F02.

Deliverables:

- Define coverage states such as complete, partial, skipped-by-selection, unsupported, malformed, and opaque.
- Separate requested-scope completeness from whole-file inspection coverage.
- Make `auditPrivacy()` derive safety from block coverage, not from result-wide warnings alone.
- Add machine-readable reason codes; keep human text secondary.

Acceptance:

- A selected EXIF-only read may be complete for its request while explicitly unknown for whole-file privacy.
- A malformed ICC block does not mark unrelated EXIF blocks malformed.
- Sanitization cannot succeed when an unclassified metadata-bearing block remains under a strict policy.

Likely files: `src/types.ts`, `src/result.ts`, `src/privacy/audit.ts`, `src/index.ts`, capability and API docs.

### F04 — Introduce `ByteSource` for memory and Blob/File

Size: L. Dependencies: F02 design agreed.

Deliverables:

- Add the seekable abstraction, bounds validation, request coalescing, small LRU/range cache, and telemetry.
- Implement Uint8Array/ArrayBufferView and Blob/File adapters.
- Port JPEG first without compacting a synthetic file.
- Preserve current public input types and behavior.

Acceptance:

- Selected JPEG parsing reads only required ranges and produces original offsets.
- Repeated overlapping reads are coalesced or served from cache.
- `maxInputBytes`, maximum read requests, maximum cumulative bytes, and abort are enforced.
- Existing byte and Blob tests remain green.

Likely files: new `src/io/` directory, `src/index.ts`, `src/parsers/jpeg.ts`, `src/jpeg-range.ts`, `src/input.ts`.

### F05 — Convert the external corpus into a differential report

Size: M. Dependencies: F01.

Deliverables:

- Compare all registry-supported standardized EXIF fields, dimensions, block presence, and selected XMP/IPTC values.
- Count found, matched, normalized-match, mismatched, missing-local, and missing-reference results per tag and producer.
- Maintain an explicit, reviewed allowlist with issue links and expiry versions.
- Emit JSON and Markdown CI artifacts.

Acceptance:

- Missing local fields fail above a defined threshold rather than being skipped.
- The report names the exact fixture hash without publishing files that cannot be redistributed.
- A deliberately removed decoder test proves the gate fails.

Likely files: `scripts/external-corpus.mjs`, `EXTERNAL_CORPORA.md`, new schemas and test fixtures.

### F06 — Build fair competitor benchmarks

Size: M. Dependencies: F01, F05.

Deliverables:

- Pin ExifReader and exifr in dev dependencies.
- Define equal-output scenarios: detection, orientation, GPS, camera/date subset, all common EXIF, all documented metadata, and remote-range simulation.
- Measure cold process and warm process separately.
- Record actual bytes/request counts with an instrumented ByteSource/server.
- Compare semantic output before accepting a speed sample.

Acceptance:

- A competitor timing is rejected when its output does not meet the scenario contract.
- Results include runtime, OS, CPU architecture, fixture hashes, package versions, percentile method, and sample count.
- No README superlative is added automatically.

Likely files: `scripts/benchmark.mjs`, new `scripts/benchmark-child.mjs`, `BENCHMARKS.md`.

### F07 — Align capability claims, package identity, and release state

Size: S. Dependencies: F02-F06 for final completion.

Deliverables:

- Generate `CAPABILITIES.md` data from contract tests or a single capability manifest.
- Decide whether the public brand is `browser-image-metadata` or a renamed/scoped package before stable 2.0, then use one name consistently.
- Make unsupported and partial behavior visible above the README fold.
- Add a release checklist that starts from a clean tracked tree.

Acceptance:

- Every “yes” cell maps to at least one positive, malformed, and selection test.
- Detection is never presented as full metadata support.
- The npm name, repository description, docs title, import snippets, badges, and SEO terms agree.

## M1: Read-parity beta

### S01 — Create a generated metadata registry

Size: L. Dependencies: F01.

Deliverables:

- Define a source schema for field ID, IFD/family, numeric tag, legal types, count/cardinality, version, name, aliases, enum/bitfield mapping, sensitivity, description, validation, and write policy.
- Generate compact runtime maps and public type unions.
- Record source standard, edition, extraction date, and license/provenance for each dataset.
- Support immutable user registries passed through options or parser instances.

Acceptance:

- Generated output is deterministic and checked for duplicate IDs/names.
- A custom registry cannot change another parse or global process state.
- The current 138 definitions migrate without public result regression.

Likely files: new `data/`, `scripts/generate-registry.mjs`, generated `src/generated/`, `src/normalize/`, registry tests.

### S02 — Implement Exif 3.1 vocabulary and UTF-8 values

Size: L. Dependencies: S01.

Deliverables:

- Add every standardized Exif 3.1 TIFF/Exif/GPS/Interop tag, legal type, count, version, and base description.
- Implement the Exif-specific UTF-8 tag type and allowed UTF-8 use in applicable string tags.
- Add Exif 3.0 lineage fields and Exif 3.1 LearningOptOutIn, DevelopmentType, correction, and noise-reduction fields.
- Update LightSource values added in Exif 3.1.

Acceptance:

- Generated conformance cases cover both byte orders, inline/out-of-line values, valid Unicode, invalid UTF-8, wrong type/count, and truncation.
- Current ASCII behavior remains compatible.
- New privacy/rights fields receive reviewed sensitivity and policy categories.

Source of truth: CIPA DC-008-Translation-2026. Do not use a competitor table as the source.

### S03 — Complete EXIF interpretations and composite values

Size: L. Dependencies: S02.

Deliverables:

- Generate standard enum descriptions and bitfields.
- Add typed composite capture time, GPS time, field of view where derivable, exposure value, 35mm equivalence, image orientation, and primary display dimensions.
- Preserve every source and conflict; never overwrite duplicate values silently.
- Define strict vs lenient normalization behavior explicitly.

Acceptance:

- Composites list source field IDs and uncertainty.
- Values agree with ExifTool on the differential corpus after documented normalization.
- Invalid inputs remain available as raw values with diagnostics.

### S04 — Support complete TIFF directory topology

Size: L. Dependencies: F04, S01.

Deliverables:

- Generalize beyond fixed IFD0/Exif/GPS/Interop/IFD1 names.
- Support bounded SubIFDs, chained directories, thumbnail/preview directories, and pointer relationships without decoding pixel strips.
- Apply the same topology to BigTIFF.
- Expose image/preview relationships in the block model.

Acceptance:

- Multiple SubIFDs and previews remain distinct.
- Cycles, shared offsets, overlaps, huge counts, and unsafe 64-bit offsets are bounded and diagnosed.
- Metadata-only reads seek only to required tables and values.

### S05 — Replace the minimal XMP map with a bounded RDF model

Size: L. Dependencies: F03, S01.

Deliverables:

- Preserve qualified names by namespace URI, arrays (`Bag`, `Seq`, `Alt`), language alternatives, nested resources, qualifiers, `rdf:resource`, typed values, aliases, and packet provenance.
- Define duplicate/conflict semantics across packets and embedded/sidecar XMP.
- Keep a safe lightweight parser and the injected full-parser adapter.
- Prevent DTD/entity expansion and bound nodes, attributes, depth, text, output properties, and total decoded bytes.

Acceptance:

- Run an XMP conformance fixture set plus adversarial XML tests.
- Round-trip-ready values preserve ordering and qualifiers required by a later serializer.
- Old `StructuredXmpPacket` users get a migration adapter or an alpha-era documented break.

### S06 — Add current IPTC Core/Extension semantic mapping

Size: L. Dependencies: S05.

Deliverables:

- Complete recognized IPTC-IIM datasets and validation.
- Map XMP IPTC Core/Extension 2025.1, Dublin Core, Photoshop, PLUS, and XMP Rights properties into normalized typed fields.
- Cover accessibility, rights/licensing, people/locations, image regions, digital source/data mining, and AI fields.
- Generate definitions from IPTC's machine-readable TechReference where licensing permits; pin the standard version and hash.

Acceptance:

- Pass IPTC reference images for 2025.1 and a previous version.
- Preserve repetitions, language alternatives, structures, and IIM/XMP conflicts.
- Never label a prompt, creator, or rights value as harmless in privacy policies without explicit review.

### S07 — Decode common ICC tag payloads

Size: L. Dependencies: F02.

Deliverables:

- Decode standard text/MLUC, XYZ, curve/parametric curve, chromatic adaptation, measurement, viewing conditions, colorant, and LUT header structures under bounds.
- Expose profile description, copyright, white point, primaries/colorants, TRCs, technology, and date where valid.
- Retain unknown payload ranges without copying excessive data.

Acceptance:

- Shared identical tag payloads are accepted; partial overlaps are rejected.
- Malformed counts, offsets, curves, and localized strings are bounded.
- Results agree with an independent ICC implementation on a licensed corpus.

Non-goal: applying color transforms or replacing a color-management system.

### S08 — Add consistent image/container details

Size: M. Dependencies: F02.

Deliverables:

- Define common fields for stored/display dimensions, bit depth, components/color model, alpha, progressive/interlaced state, animation/frame count/loop count, primary image, thumbnails, auxiliary images, and orientation transforms.
- Fill only values provable from headers and container structures.
- Keep format-specific detail available without flattening ambiguity.

Acceptance:

- Every supported format has explicit supported/unsupported detail tests.
- Conflicting dimension sources are surfaced, not arbitrarily chosen.

### S09 — Add ergonomic and migration output adapters

Size: M. Dependencies: S03, S05, S06.

Deliverables:

- Add `toFlatObject()`, family-grouped output, JSON-safe serialization, and deterministic field querying.
- Provide documented ExifReader- and exifr-oriented migration helpers where semantics can be represented honestly.
- Add a thumbnail object-URL helper in a browser-only entry point with an explicit revoke lifecycle.
- Consider a synchronous in-memory JPEG/TIFF subset only if bundle and maintenance costs are acceptable; do not duplicate parser logic.

Acceptance:

- Type tests cover duplicate tags, exact rationals, binary values, BigInt-like 64-bit values, and JSON serialization.
- Compatibility adapters document every lossy conversion.

## I/O parity

### I01 — Implement true HTTP Range metadata reads

Size: L. Dependencies: F04 and at least JPEG/TIFF/HEIF ports to ByteSource.

Deliverables:

- Add an explicit `browser-image-metadata/http` entry point.
- Probe range support safely, validate `Content-Range`, identity encoding, validators, total size, redirects, and changed resources.
- Coalesce requests and fall back to a bounded full response only under caller policy.
- Expose request count, response bytes, decoded bytes, cache hits, fallback reason, and completeness.

Acceptance:

- Local test server covers 206, ignored Range/200, 416, missing length, compression, changed ETag, abort, redirect, and malicious headers.
- HEIF metadata near the end is fetched without downloading intervening pixel data.
- No cross-origin or credential behavior is hidden from the caller.

### I02 — Add explicit Node file and stream adapters

Size: M. Dependencies: F04.

Deliverables:

- Add a Node-only entry accepting path, `FileHandle`, and seekable file source.
- Add an input-bounded stream spool adapter for non-seekable streams; document that it cannot provide true range efficiency.
- Avoid any `node:` import in browser export closures.

Acceptance:

- ESM/CJS tests run in clean consumers.
- File descriptors close on success, failure, and abort.
- Paths are never accepted by the browser/core entry point.

## M2: Trust/edit beta

### W01 — Specify the mutation model before writing bytes

Size: M. Dependencies: F02, S01, S05.

Deliverables:

- Write an API decision record covering set, delete, copy, rename/alias, group removal, policy removal, sidecar merge, ordering, duplicates, conflicts, and unknown preservation.
- Define input validation and result evidence types.
- Add compile-only type tests and example calls; implementations may initially return an explicit unsupported result.

Acceptance:

- Every operation identifies a canonical field or an explicit selector.
- Preserve/remove precedence is unambiguous.
- No string matching against warning messages is required to compute unapplied operations.
- The result distinguishes unsupported operation, invalid value, unsafe structure, policy failure, and verification failure.

### W02 — Build a reusable TIFF/EXIF serializer

Size: XL; split into multiple tickets. Dependencies: W01, S02, S04.

Deliverables:

- Phase A: serialize a new bounded classic-TIFF EXIF graph in both byte orders.
- Phase B: preserve/rewrite existing directories, unknown entries, values, and thumbnails.
- Phase C: edit values with changed type/count/length and recalculate all internal offsets.
- Phase D: add BigTIFF only after classic TIFF is independently verified.

Acceptance for every phase:

- Output reparses in this package and ExifTool.
- Random valid graphs round-trip semantically.
- Offsets, alignment, overflows, ordering, duplicate policy, and maximum output size are tested.
- No mutation occurs when planning or verification fails.

### W03 — Add transactional JPEG metadata editing

Size: L. Dependencies: W02.

Deliverables:

- Set/delete EXIF values; add/replace/remove standard and Extended XMP; add/replace ICC and IPTC blocks under format size constraints.
- Preserve entropy-coded scans and decoding-critical markers byte-for-byte.
- Split/reassemble oversized supported metadata correctly or reject with a typed reason.
- Return a byte-change map and payload hash verification.

Acceptance:

- Baseline, progressive, multiple-scan, comments, duplicate APP blocks, trailing bytes, and malformed files are covered.
- Independent decoders still display the image.
- MPF, Ultra HDR, JUMBF/C2PA, and unknown offset-bearing structures remain fail-closed until their dedicated tickets pass.

### W04 — Add transactional PNG metadata editing

Size: L. Dependencies: W01, W02, S05.

Deliverables:

- Set/delete eXIf, XMP iTXt, ordinary text, and ICC profile chunks.
- Preserve IDAT chunks byte-for-byte and maintain legal chunk ordering and CRCs.
- Support uncompressed and compressed text with configured decompression/compression budgets.

Acceptance:

- Multiple IDAT/APNG chunks, unknown ancillary chunks, ordering rules, Unicode, duplicate keywords, and bad CRC policy are covered.
- Payload verification proves image-data chunks are unchanged.

### W05 — Add selective WebP EXIF editing

Size: L. Dependencies: W02, S05.

Deliverables:

- Replace the current whole-chunk-only limitation with EXIF field set/delete and orientation preservation.
- Add XMP and ICC replacement.
- Maintain RIFF length, padding, VP8X feature flags, and legal ordering.

Acceptance:

- VP8, VP8L, VP8X, alpha, animation, odd chunk lengths, duplicate chunks, and unknown chunks are covered.
- Image payload chunks remain byte-identical.

### W06 — Add standards-aware XMP and IPTC serialization

Size: XL; split XMP and IPTC. Dependencies: S05, S06, W01.

Deliverables:

- Deterministic namespace handling and safe XML escaping.
- Preserve unknown properties, qualifiers, arrays, language alternatives, and ordering where necessary.
- Map normalized fields to XMP and IIM under an explicit synchronization policy.
- Implement Extended XMP chunking for JPEG.

Acceptance:

- Round-trip IPTC reference images without semantic loss in supported fields.
- No XML entity/markup injection can escape values into executable markup.
- Conflicting IIM/XMP values are never overwritten without caller policy.

### W07 — Generalize redaction selectors and policy evaluation

Size: L. Dependencies: W01-W06 as applicable.

Deliverables:

- Replace the closed `RedactionTarget` list with typed canonical IDs and selectors while preserving old names through adapters.
- Support selection by family, namespace, sensitivity, field ID, block ID, and associated image.
- Compute outcomes from operation IDs and block coverage, never human message text.
- Generate policies from the same registry used by readers/writers.

Acceptance:

- Every readable standardized sensitive field can be targeted.
- Unsupported selectors are rejected before mutation.
- Preserve rules have explicit, tested precedence.

### W08 — Add a public preservation verifier

Size: M. Dependencies: F02, W03-W05.

Deliverables:

- Inventory and hash encoded image payload ranges before and after editing.
- Compare dimensions, animation/image relationships, color/orientation preservation policy, and independent decodability.
- Return a machine-readable verification report that applications can store.

Acceptance:

- The verifier detects one-byte changes in every protected payload category.
- It does not claim pixel equivalence for formats where payload extraction is incomplete.
- `successful: true` writer results require the configured verifier to pass.

## Trust and policy differentiators

### T01 — Add semantic privacy inspection

Size: L. Dependencies: F03, S02, S05, S06.

Deliverables:

- Inspect XMP/IPTC/EXIF values semantically for locations, people/creator names, serial IDs, device identifiers, timestamps, document/history IDs, face/region data, prompts, workflow JSON, and embedded previews.
- Explain why each finding is sensitive and link it to exact fields/blocks.
- Distinguish presence, decoded finding, opaque risk, and policy violation.

Acceptance:

- Raw XMP presence alone is no longer the only XMP privacy result.
- Opaque MakerNotes and unknown blocks remain visible risk, not “safe”.
- Reports can be serialized without leaking the sensitive raw values unless explicitly requested.

### T02 — Ship named, versioned policy presets

Size: M. Dependencies: T01, W07.

Deliverables:

- Suggested presets: `share-safe`, `location-safe`, `anonymous`, `retain-rights`, `publisher`, `accessibility`, and `forensic-preserve`.
- Each policy declares inspected families, removal rules, allowed opaque data, retained technical metadata, and failure behavior.
- Policies are immutable, versioned data with change logs.

Acceptance:

- A report includes the exact policy ID/version.
- Adding a newly recognized sensitive field cannot silently make an old policy pass; policy tests must be updated explicitly.
- Strict presets return no output when coverage is insufficient.

### T03 — Inventory JUMBF and C2PA without claiming verification

Size: L. Dependencies: F02.

Deliverables:

- Detect and index JUMBF/C2PA stores in JPEG, PNG, WebP, and ISO-BMFF locations covered by the C2PA specification.
- Report presence, ranges, manifest-store relationships, and mutation risk.
- Make writers refuse C2PA-bearing files by default until a caller chooses an explicit invalidation/preservation policy.

Acceptance:

- Detection fixtures include valid stores, malformed box trees, remote references, duplicates, truncation, and deep nesting.
- API names say `detected`/`inventoried`, never `valid` or `verified`.

### T04 — Add official C2PA verifier adapters

Size: M. Dependencies: T03. Post-GA optional feature.

Deliverables:

- Create separate browser and Node entry points integrating the official `@contentauth/c2pa-web` and `@contentauth/c2pa-node` SDKs as optional peers.
- Normalize SDK validation status into a namespaced result without hiding the full official result.
- Document WASM, native binary, network, trust-list, and bundle implications.

Acceptance:

- No home-grown signature or certificate validation.
- Browser and Node integration tests pin official SDK versions and test valid, invalid, missing, and unsupported assets.
- The dependency-free core and ordinary parse bundles never import C2PA SDK code.

### T05 — Support MPF 2025 and Ultra HDR safely

Size: XL; split read and write phases. Dependencies: F02, S04, W03, W08.

Deliverables:

- Parse MP Index/Attribute IFDs, image offsets/sizes, dependencies, and representative-image flags.
- Parse GContainer and HDR gain-map XMP into typed relationships.
- Inventory each secondary JPEG and its metadata.
- In the write phase, recalculate offsets/sizes or prove that an edit before secondary images did not invalidate them.

Acceptance:

- Validate against current Android Ultra HDR and CIPA MPF fixtures.
- Preserve both primary and gain-map encoded data byte-for-byte during metadata-only edits.
- Refuse ambiguous or mixed MPF/GContainer structures atomically.

## Breadth after the GA-critical path

### B01 — JPEG XL dimensions and compressed metadata

Size: L. Dependencies: F04.

- Parse container dimensions and Brotli-compressed Exif/XML boxes through an injected decompressor or supported platform stream.
- Keep Chrome's missing Brotli stream support explicit and test custom decompression.
- Treat raw codestream metadata separately; do not infer container boxes that do not exist.

### B02 — HEIF/AVIF multi-extent and item semantics

Size: L. Dependencies: F04, F02.

- Add supported `iloc` construction modes, multiple extents, safe data references, thumbnails (`thmb`), auxiliary images (`auxl`), derived images, and richer property relationships.
- Add grid/overlay relationships without decoding pixels.

### B03 — HEIF/AVIF sequences and multi-image results

Size: XL. Dependencies: B02, S08.

- Model tracks/sequences, samples, transformations, metadata association, and primary selection.
- Avoid flattening all items into one result; design a backward-compatible top-level primary view plus an image/item collection.

### B04 — RAW phase one: DNG and TIFF-derived camera files

Size: XL. Dependencies: S04, S01.

- Start with DNG, CR2, NEF, ARW, ORF, RW2, and IIQ detection and safe directory/preview metadata.
- Keep raw decoding out of scope.
- Use a `container` plus `fileKind` model rather than pretending every TIFF-derived file is generic TIFF.

### B05 — RAW phase two: ISO-BMFF and non-TIFF RAW

Size: XL. Dependencies: B02, B04.

- Add CR3 item/track metadata and RAF embedded preview/metadata indexing.
- Treat every format as a separate conformance project with real vendor fixtures.

### B06 — Photoshop image-resource inventory

Size: L. Dependencies: F02.

- Index all 8BIM resources and safely decode high-value resolution, thumbnail, clipping path name/path metadata, XMP/IPTC links, and digest resources.
- Preserve unknown resources and Pascal-string padding exactly during writes.

### B07 — MakerNote plugin contract

Size: L. Dependencies: S01, S04.

- Define detection confidence, base-offset rules, byte order, nested IFDs, encryption/obfuscation status, tag registry, safety limits, and returned provenance.
- Plugins must be explicit imports and may not mutate a global registry.
- Unknown or low-confidence notes remain opaque.

### B08 — Initial vendor MakerNote packs

Size: XL per group. Dependencies: B07.

- Prioritize Apple, Canon, Nikon, Sony, Fujifilm, Panasonic/Leica, and Pentax based on corpus frequency and user requests.
- Ship each vendor independently with source/license provenance and real fixtures.
- Start with high-value identity, serial, lens, shutter count, location/motion, focus, and HDR fields.

### B09 — Additional containers only after demand evidence

Size: varies.

Candidates include BMP, ICO, JPEG XR, SVG metadata, and camera sidecars. Add one only when it has a named user workflow, available conformance fixtures, security limits, and a maintenance owner. Format-count marketing alone is not sufficient.

### B10 — Sidecar XMP and metadata merge

Size: M. Dependencies: S05, S06.

- Parse `.xmp` bytes through an explicit sidecar API.
- Merge embedded and sidecar metadata with source precedence, conflicts, and provenance.
- Later allow writing a new sidecar without touching the image.

## Developer experience and market execution

### R01 — Stabilize the 2.0 public API

Size: M. Dependencies: M0-M2 GA subset.

- Publish an API decision record, deprecation policy, browser/runtime support policy, and result JSON schema.
- Use type tests to lock overloads and discriminated results.
- Remove misleading or redundant names before release candidate, not after GA.

### R02 — Build a real documentation site and playground

Size: L. Dependencies: R01.

- Searchable tag/namespace registry pages generated from source data.
- Runnable local-only playground showing blocks, fields, raw/semantic values, coverage, privacy, planned edits, byte changes, and verification.
- CSP that prevents unintended uploads; clearly label the separate fetch demo.
- Recipes for browser, worker, Node, Deno, Bun, Vite, Next.js, React, and serverless runtimes.

### R03 — Ship a small CLI

Size: M. Dependencies: R01, W08, T02.

- Explicit commands: `inspect`, `audit`, `sanitize`, `edit`, `verify`, and `benchmark-file`.
- JSON output by default for automation plus a readable table mode.
- Never overwrite a source file unless a later, separately approved design adds backup/atomic rename semantics.

The CLI is a discovery and debugging surface, not a reason to put Node dependencies in the browser core.

### R04 — Publish migration and compatibility assets

Size: M. Dependencies: S09, R01.

- Copy/paste mappings from exifr, ExifReader, exif-js, and piexifjs.
- A codemod is worthwhile only for high-confidence import/helper replacements.
- Publish side-by-side output examples and explicitly call out changed date, rational, duplicate, and warning semantics.

### R05 — Release candidate and GA audit

Size: M. Dependencies: all GA gates.

- Run clean-clone CI, external corpora, browser/runtime matrix, fuzzing, package provenance, dependency/license scan, benchmark suite, and documentation link checks.
- Commission an external review of TIFF offset handling and all writers.
- Publish the compatibility/limitations report with the release.
- Do not use “fully featured”, “safest”, or “fastest” without a defined scope and linked evidence.

### G01 — Optional AI/creator metadata schema pack

Size: L. Dependencies: S05, T01, B10.

- Decode bounded ComfyUI workflow/prompt graphs and common Stable Diffusion/InvokeAI PNG/WebP conventions.
- Extract typed model, sampler, seed, steps, prompt, negative prompt, and workflow references with source provenance.
- Version parsers by producer convention and retain raw data.
- Offer migration into IPTC 2025.1 AI fields under explicit caller control.

### G02 — Publish reproducible comparison reports

Size: M. Dependencies: F05, F06.

- Host correctness, byte-read, speed, memory, bundle-closure, and malformed-input results as versioned artifacts.
- Let competitors win rows they genuinely win.
- Include scripts and fixture hashes so others can reproduce or challenge the result.

### G03 — Community fixture and plugin program

Size: M. Dependencies: B07.

- Provide a fixture scrubber/report tool, provenance template, plugin template, tag-data schema, and review checklist.
- Label small isolated tickets for contributors.
- Maintain response targets for security, corruption, compatibility, and ordinary feature reports.

### G04 — Launch plan

Size: M. Dependencies: R05, G02.

Launch material should lead with demonstrable workflows:

- “Remove GPS but keep orientation and ICC; prove compressed image bytes did not change.”
- “Read only metadata ranges from a 200 MB asset.”
- “Inspect Exif 3.1 AI-training intent and IPTC 2025.1 AI/accessibility fields.”
- “Refuse to invalidate Content Credentials or Ultra HDR silently.”
- “Migrate the five most common exifr/ExifReader calls.”

Publish a technical article, interactive playground, benchmark repository/artifacts, and several integration examples on the same day. Seek real integrations and issue reports rather than paid download traffic.

## Recommended 2.0 GA cut line

Required before 2.0 GA:

- F01-F07.
- S01-S06, S08-S09. S07 may ship as documented partial ICC support if block coverage is truthful.
- I01-I02 for input parity, or a clear reason to defer one with no superiority claim for that input.
- W01-W08 for JPEG, PNG, and WebP.
- T01-T03.
- T05 read support; MPF/Ultra HDR writing may remain a fail-closed limitation if prominently documented.
- R01-R05.

Good 2.1/2.2 work rather than GA blockers:

- T04 official C2PA adapters.
- B01-B10.
- G01 and deeper creator schemas.
- TIFF, HEIF/AVIF, JPEG XL, GIF, and RAW writing.
- Full ICC LUT interpretation.

This cut gives 2.0 a coherent promise: mainstream read parity plus a uniquely safe edit/privacy workflow. Waiting for every vendor MakerNote and RAW format would delay the differentiated product for too long.

## Execution order for a medium-capability coding model

Use this order; do not parallelize tickets that touch the same parser or public types:

1. F01, then F05 and F06.
2. F02 one container at a time, then F03.
3. S01, S02, S03.
4. F04 with JPEG, then TIFF, PNG/WebP, HEIF/AVIF.
5. S04-S09 in separate sessions.
6. I01 and I02.
7. W01; obtain human approval of its API record before W02.
8. W02 phases A-D, then W03, W04, W05.
9. W06, W07, W08.
10. T01, T02, T03, and T05 read support.
11. R01-R05.
12. Breadth and growth tickets based on real issue/corpus frequency.

Human review is mandatory after F02 types, F04 ByteSource, S01 registry schema, S05 XMP model, W01 mutation API, W02 serializer phases, T03 C2PA terminology, and every writer.

## Outsourcing prompt template

Give the model one ticket using this template:

```text
Implement ticket <ID> only from COMPETITIVE_ROADMAP.md in the
browser-image-metadata repository.

Constraints:
- Read the whole ticket, CONTRIBUTING.md, CAPABILITIES.md, and the relevant
  source/tests before editing.
- Preserve unrelated and pre-existing working-tree changes.
- Do not change the public API beyond what this ticket explicitly requires.
- Do not copy code or tag tables from ExifReader, exifr, or ExifTool.
- Write the smallest failing tests first, then implement.
- All reads, allocations, recursion, decompression, and output sizes must be
  bounded through SecurityLimits or an explicitly reviewed new limit.
- Malformed nested metadata must produce structured diagnostics, not an
  unexpected throw.
- Do not weaken tests, coverage thresholds, lint rules, package size budgets,
  or fail-closed behavior.
- Do not commit, publish, push, or edit files outside this repository.

Before coding, respond with:
1. the acceptance criteria in your own words;
2. the exact files you expect to touch;
3. the first failing tests you will add;
4. any ambiguity that would change the public API or safety contract.

After coding, run the targeted tests, typecheck, lint, the full test suite,
coverage, build, publint, and package smoke where relevant. Report:
- changed files;
- test commands and exact results;
- remaining limitations;
- whether every acceptance criterion is met.

Stop and request review if the ticket needs a different public type/API,
cannot preserve an unknown block, or cannot prove an image-payload invariant.
```

## Per-ticket review checklist

The human or stronger review model should reject a patch if any answer is “no”:

- Is the feature observable through public contract tests rather than only private helpers?
- Are offsets relative to the original input and validated with safe arithmetic?
- Are cumulative as well as per-item resource limits enforced?
- Are duplicate, malformed, truncated, overlapping, and unknown cases tested?
- Does selection skip decoding work rather than merely filter output when the capability claims it does?
- Does a writer preserve source bytes until the whole operation and verification succeed?
- Are pixel/image payload invariants checked by byte range, not assumed from dimensions?
- Does an unsupported case remain explicit and fail closed?
- Are new tag/vocabulary data independently sourced and license-recorded?
- Are browser exports free of Node-only imports and optional heavy dependencies?
- Does the benchmark compare equivalent semantic output?
- Do README, API, capability, migration, changelog, and declaration changes agree?

## Explicit non-goals

- Pixel decoding, rendering, color transforms, or re-encoding.
- A home-grown C2PA cryptographic verifier.
- Silent in-place edits of user files.
- Treating unknown metadata as safe.
- Supporting a format based only on its magic bytes.
- Copying competitor or ExifTool data into the MIT package without provenance and license approval.
- Preserving an incumbent's convenient but ambiguous output semantics at the expense of correctness.

## Research sources

- ExifReader package and current feature table: <https://www.npmjs.com/package/exifreader>
- ExifReader repository: <https://github.com/mattiasw/ExifReader>
- ExifReader writing request: <https://github.com/mattiasw/ExifReader/issues/442>
- exifr package and API: <https://www.npmjs.com/package/exifr>
- exifr repository: <https://github.com/MikeKovarik/exifr>
- CIPA current standards list, including Exif 3.1 and MPF 2025: <https://www.cipa.jp/e/std/std-sec.html>
- CIPA Exif 3.0 overview: <https://cipa.jp/std/documents/e/Exif3.0-Overview_E.pdf>
- IPTC Photo Metadata Standard 2025.1: <https://iptc.org/standards/photo-metadata/iptc-standard/>
- C2PA Content Credentials specification: <https://spec.c2pa.org/specifications/specifications/2.2/specs/ContentCredentials.html>
- Official CAI JavaScript SDK: <https://github.com/contentauth/c2pa-js>
- Android Ultra HDR format: <https://developer.android.com/media/platform/hdr-image-format>

Revalidate all external versions, APIs, and standards before implementing the relevant ticket. They are intentionally pinned here as a planning snapshot, not permanent truth.
