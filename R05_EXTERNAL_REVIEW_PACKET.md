# R05 external TIFF and writer review packet

This packet is prepared for the roadmap-required external review. It is not a
review result, approval, or substitute for an independent reviewer. The R05
audit remains blocked until a genuine external record identifies the reviewer,
scope, reviewed candidate revision, findings, dispositions, and date.

## Requested scope

Review the exact candidate revision and complete diff, with particular attention
to:

- classic TIFF and BigTIFF offset, count, width, overflow, range, and base-offset
  arithmetic in `src/tiff.ts`, `src/tiff-range.ts`, `src/parsers/tiff.ts`, and
  `src/metadata/exif.ts`;
- atomicity, source-byte retention, output allocation, and failure behavior of
  every writer: `src/jpeg-writer.ts`, `src/png-writer.ts`, and
  `src/webp-writer.ts`, plus TIFF/IPTC serialization and mutation integration;
- exact field/block selection and preservation behavior in `src/edit.ts`,
  `src/selection.ts`, and `src/privacy/redact.ts`;
- bounded reads, output sizes, recursion, collection counts, malformed input,
  overlapping ranges, and fail-closed handling at all writer boundaries;
- evidence quality for unit, malformed-input, corpus, reference-image, browser,
  fuzz, and preservation tests, including whether assertions prove the stated
  byte and semantic claims.

## Candidate identity

The executable `npm run r05:audit` records the observed repository HEAD,
tracked diff file list, untracked candidate file list, package version,
lockfile hash, runtime, and platform in `reports/r05-release-audit.json`.
The reviewer must obtain the exact candidate from a genuinely clean checkout;
the dirty development tree and a packed tarball are not sufficient substitutes.

## Architecture and threat model

The package parses untrusted image bytes in browser, worker, and Node-facing
boundaries. TIFF offsets are untrusted integers relative to a TIFF base and may
be malformed, overlapping, truncated, or intentionally chosen to overflow
JavaScript-safe arithmetic. Writers must preserve source bytes and must not
allocate or return an output until all validation and serialization steps have
completed. Metadata mutation is exact-field or exact-block scoped; a selector
that cannot resolve exactly must fail during preflight.

The principal review threats are integer wraparound, out-of-range reads,
unbounded counts or output, accidental source mutation, partial output after a
failed write, broad removal caused by an ambiguous selector, and a mismatch
between retained byte ranges and the bytes actually written.

## Invariants to inspect

1. Every offset plus length is checked with safe arithmetic before indexing or
   allocation.
2. Classic TIFF and BigTIFF use their distinct offset and count widths.
3. Relative offsets are resolved against the correct embedded TIFF base, not
   the containing file by accident.
4. Directory, value, sub-IFD, and associated-image ranges are bounded and
   provenance is retained.
5. A malformed, unsupported, overlapping, or ambiguous range produces a typed
   diagnostic and cannot silently become a valid writable target.
6. Writers retain the original source bytes until serialization, verification,
   and preservation checks succeed.
7. A writer failure does not expose a partial output or mutate caller-owned
   input.
8. JPEG, PNG, and WebP image-bearing payloads, scan/chunk structure, padding,
   and unrelated metadata are preserved according to their documented policy.
9. Exact field selectors never degrade into family-wide or block-wide removal.
10. Security and conformance decisions derive from typed outcomes and operation
    identifiers, never warning-message text.

## Evidence to review

The reviewer should execute the current focused suites and the real gates named
by `scripts/r05-release-audit.mjs`. For external corpora and official images,
the runner must verify the pinned source, byte length, and SHA-256 in temporary
untracked storage and retain only redistribution-safe report data. Fuzz runs
must include bounded iteration/time policy, seed identity, crash/hang/OOM
criteria, and minimized regressions. Browser and runtime failures remain
failures or unavailable results, never implicit passes.

## Exact review questions

- Are all TIFF/BigTIFF offset and length calculations safe for every reachable
  parser and writer path, including embedded and relocated TIFF bases?
- Can any malformed count, offset, range, or nested structure cause an
  out-of-bounds read, unsafe allocation, output truncation, or partial output?
- Does each writer preserve unrelated bytes and fail atomically when the input
  contains unsupported offset-bearing or authenticity-sensitive structures?
- Can any public selector remove more than the exact requested field, including
  duplicate instances and fields sharing one physical block?
- Do the retained tests and reports prove these properties independently of the
  implementation under review?
- Which findings require code changes, which are accepted limitations, and what
  evidence verifies each disposition?

## Required reviewer response

The completed record must add a dated external-review document under the
repository’s reports directory containing:

- reviewer identity and independence statement;
- exact revision or candidate-diff hash reviewed;
- explicit scope covering TIFF offset handling and every writer;
- findings with severity, affected file/symbol, reproduction, and risk;
- disposition for every finding and linked follow-up where applicable;
- residual limitations and unanswered questions;
- reviewer conclusion and approval or rejection; and
- the commands and evidence artifacts inspected.

Until that record exists and is accepted by the executable audit, R05 and GA
readiness remain unproven.
