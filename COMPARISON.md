# Choosing an image metadata tool

`browser-image-metadata`, ExifReader, exifr, and ExifTool are all good tools,
but they optimize for different jobs. This guide explains where this package is
a stronger product dependency, where an incumbent is the better choice, and
which claims have executable evidence.

## The short answer

Choose `browser-image-metadata` when an application must do several of these in
one typed JavaScript API:

- inspect metadata locally in a browser, worker, Node.js, or serverless runtime;
- preserve duplicates, conflicts, exact identities, and byte provenance;
- distinguish a complete inspection from partial, opaque, malformed, or
  unsupported coverage;
- find semantic privacy risks without leaking their values into reports;
- apply a named privacy policy that refuses output when it cannot prove the
  requested result;
- edit supported JPEG, PNG, WebP, TIFF, or BigTIFF metadata atomically;
- prove that protected encoded image payloads survived a metadata edit;
- inventory JUMBF/C2PA without confusing inventory with cryptographic
  verification; or
- read bounded metadata ranges under explicit local or network policy.

Choose another tool when its specialization is the requirement:

- Choose **ExifTool** for the broadest format and tag coverage, mature shell
  automation, and writing across many media types.
- Choose **exifr** for a compact, convenience-oriented reader when warm parsing
  speed matters more than provenance, privacy policy, or mutation evidence.
- Choose **ExifReader** for a flexible browser/Node reader with broad metadata
  extraction, direct URL/path loading, configurable builds, and its documented
  MakerNote coverage.

## Product-level comparison

| Decision | browser-image-metadata | ExifReader | exifr | ExifTool |
| --- | --- | --- | --- | --- |
| Primary fit | Trust-sensitive application workflows: inspect, explain, audit, redact, edit, verify | General browser/Node metadata extraction | Fast, convenient JavaScript metadata extraction | Comprehensive desktop/server metadata inspection and automation |
| Runtime model | Browser, Web Worker, Node.js, and local-byte serverless use; separate explicit network and optional SDK entry points | Browser and Node.js; can load bytes, files, paths, and URLs | Browser and Node.js; supports byte, file, path, URL, image-element, and sidecar inputs | Perl application/CLI and library; designed for desktop and server automation |
| Canonical output | Typed families plus raw, lexical, normalized, semantic, duplicate, conflict, range, and completeness data | Tag objects; expanded mode keeps metadata groups separate | Convenience object with selectable segments/tags | Tag/group-oriented command and API output across a very large registry |
| Privacy workflow | Semantic audit, opaque-risk reporting, safe serialization, seven immutable policies, strict no-output refusal | No equivalent end-to-end privacy-policy workflow is documented | No equivalent end-to-end privacy-policy workflow is documented | Powerful tag selection/removal, but not the same browser-safe semantic policy contract |
| Metadata writing | Atomic supported writes for JPEG, PNG, WebP, TIFF, and BigTIFF with typed refusal and verification | The official project describes a metadata reader | The official project describes an EXIF reading library | Extensive read/write/create support across many formats; strongest breadth here |
| Preservation evidence | Reparse evidence plus independent encoded-payload range hashes; pixel equivalence is explicitly not claimed | Not an equivalent documented writer contract | Not an equivalent documented writer contract | Protects originals by default when writing, but has a different CLI-oriented evidence model |
| Untrusted-input model | Public security budgets for reads, offsets, recursion, decompression, counts, strings, and cumulative output | Parser limits and behavior follow ExifReader's implementation/API | Chunk limits and selective parsing are configurable | Mature defensive behavior, but not a browser-memory budget contract |
| Network behavior | Core never fetches; `/fetch` and `/http` are opt-in, and range validation/fallback policy is explicit | URL loading and automatic metadata-range reads are supported | URL/path readers and chunked reads are supported | Operates on caller-selected files and streams outside a browser core |
| Format breadth | Broad image-focused set with operation-by-operation capability evidence | Broad modern image metadata support | Focused image metadata support | Broadest choice by a wide margin, including many non-image media types |
| Runtime dependencies | None in ordinary core; XML and official C2PA integrations are optional peers | Consult the selected build/package | None documented by the project | Requires its Perl/runtime distribution rather than bundling as browser JavaScript |

“No equivalent documented workflow” means the cited official documentation did
not present the same end-to-end contract. It does not claim that a custom
application could not be built around that tool.

## What is materially different

### A parse result says what remains unknown

A successful function return is not treated as proof that an entire file was
understood. Results retain block-level coverage and whole-file completeness,
including skipped, malformed, opaque, and unsupported structures. Unknown XMP,
MakerNotes, trailing bytes, embedded previews, and unclassified blocks remain
visible to privacy policy.

This matters when metadata controls sharing, compliance, moderation, or
forensic review. A convenient value such as `latitude` can coexist with its
exact EXIF source fields, candidate conflicts, source ranges, and an explicit
statement that another block was not understood.

### Privacy is a first-class operation

`auditPrivacy()` finds semantic categories rather than merely reporting that
XMP or EXIF exists. It covers locations, people, creators, identifiers,
timestamps, regions, prompts, workflow data, thumbnails, and opaque risk.
Sensitive raw values are omitted from serialized reports unless a caller opts
in deliberately.

`sanitizeMetadata()` applies a versioned policy, preflights exact selectors,
mutates supported containers, reparses the output, and audits it again. Strict
policies return no output bytes if inspection or mutation coverage is
insufficient. That refusal is part of the public contract, not a warning a
caller has to infer.

### Editing and evidence are one transaction

Supported metadata edits plan and validate every operation before output is
committed. Exact field selectors cannot silently widen into whole-family
removal. Preserve rules, duplicates, conflicts, protected structures, and
unsupported targets have typed outcomes.

For JPEG, PNG, and WebP, the independent preservation verifier inventories the
encoded image-bearing ranges before and after an edit and compares their
SHA-256 values. Reports also compare dimensions and relevant image
relationships. The package deliberately says “encoded payload preserved,” not
“pixels are identical,” because it does not decode pixels.

### Network and optional trust code stay outside the core

Passing bytes, a `Blob`, or a `File` never initiates a request. Applications
that want network I/O choose `/fetch` or the stricter `/http` range adapter.
Official C2PA verification is also isolated in optional browser and Node entry
points; structural C2PA inventory in the core never claims authenticity.

This boundary keeps ordinary parsing usable when the XML and official C2PA SDK
peers are absent and makes network, native, WASM, trust-list, and bundle-size
decisions explicit.

## Performance without benchmark theatre

The checked comparison report runs this package, ExifReader 4.45.0, and exifr
7.1.3 against equal semantic contracts and the same hash-pinned fixtures. It
records warm timing, bytes read, memory observations, malformed-input behavior,
runtime identity, and non-comparable values.

The retained report does **not** say this package wins every benchmark. In the
current single-fixture report, exifr or ExifReader wins most warm parse-time
rows. This package wins the measured detection row and the instrumented
metadata-range byte count. Those results are evidence for that fixture and
environment, not universal performance claims.

Reproduce or challenge the results:

```sh
npm ci
npm run g02:run
npm run g02:check
```

See [the methodology](./G02_COMPARISON_REPORTS.md),
[the human-readable result](./reports/g02-comparison.md), and
[the benchmark contract](./BENCHMARKS.md).

## Migration paths

Existing ExifReader and exifr consumers can keep a familiar projection while
adopting the canonical result incrementally:

```ts
import {
  parseMetadata,
  toExifReaderCompatible,
  toExifrCompatible,
} from "browser-image-metadata";

const result = await parseMetadata(file);
const exifReaderView = toExifReaderCompatible(result, { duplicate: "array" });
const exifrView = toExifrCompatible(result);

// Keep `result` for provenance, conflicts, completeness, and safe mutation.
console.log(exifReaderView, exifrView, result.coverage);
```

These views are intentionally lossy; they do not pretend a flat object can
represent duplicate RDF properties, qualifiers, IPTC conflicts, exact binary
provenance, or inspection gaps. The [migration guide](./MIGRATION.md) and
[executable compatibility guide](./R04_MIGRATION_COMPATIBILITY.md) document the
loss boundaries.

ExifTool users should migrate selectively. Move browser-facing inspection,
privacy, and supported lossless-edit workflows into this package when avoiding
a subprocess or upload is important. Keep ExifTool for unsupported formats,
specialized vendor tags, broad batch conversion, and write operations outside
the generated [capability matrix](./CAPABILITIES.md).

## Claims and sources

The comparison above was reviewed on 2026-09-16 against:

- the [ExifReader official README](https://github.com/mattiasw/ExifReader),
  with executable local compatibility evidence pinned to 4.45.0;
- the [exifr official README](https://github.com/MikeKovarik/exifr), with
  executable local compatibility evidence pinned to 7.1.3; and
- the [ExifTool official site](https://exiftool.org/),
  [supported-file table](https://exiftool.org/#supported), and
  [writing documentation](https://exiftool.org/writing.html). Repository
  interoperability evidence uses the separately pinned ExifTool version
  recorded by each corpus report.

Official projects evolve. Check their current documentation before making a
feature-specific migration decision. Product names belong to their respective
owners; this project is not affiliated with or endorsed by them.

## Verify the package, not the prose

Start with these repository contracts:

- [Capability matrix](./CAPABILITIES.md) — exact read, selection, range, removal,
  and sanitization boundaries by container.
- [API reference](./API.md) — public types, outcomes, and security limits.
- [External corpora](./EXTERNAL_CORPORA.md) — pinned interoperability gates and
  redistribution-safe evidence.
- [Writer corpus](./WRITER_CORPUS.md) — real-image writer and independent-decoder
  evidence.
- [Compatibility reports](./G02_COMPARISON_REPORTS.md) — reproducible competitor
  comparison methodology.
- [Known compatibility limitations](./R05_COMPATIBILITY_LIMITATIONS.md) — what
  this release does not claim.

If a format or operation is absent from the capability matrix, treat it as
unsupported even if format detection succeeds.
