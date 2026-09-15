# Building a local-first image metadata toolkit with evidence

Image metadata is small in relation to image pixels but large in consequence.
A GPS coordinate, camera serial number, embedded preview, creator name, AI
prompt, or opaque application block can outlive the visible image. A useful
tool therefore has to answer two questions at once: what was decoded, and what
was not safely understood?

## Read only what is needed

The toolkit accepts byte views, Blob/File inputs, and explicit Node file
sources. Metadata-scoped parsing walks container headers and reads bounded
ranges. The launch evidence demonstrates a 200 MiB virtual JPEG source whose
metadata parse reads only 645 bytes in the current environment and never asks
the source for a full buffer. Every request, cumulative byte count, cache, and
source-relative provenance value is observable. Callers can tighten the
repository security limits for input, metadata, recursion, strings, and
output.

## Explain privacy findings semantically

Privacy inspection distinguishes metadata presence, decoded semantic findings,
opaque risk, and policy violations. XMP identity is a namespace URI plus local
name. IPTC candidates retain repetitions and conflicts. Unknown XMP,
MakerNotes, malformed structures, previews, and associated images remain
fail-closed risks instead of being declared safe because they could not be
decoded. Reports omit raw sensitive values by default; deliberate raw-value
access is a separate opt-in.

## Edit metadata without rewriting pixels

The JPEG, PNG, and WebP writers edit supported metadata blocks while copying
encoded image payloads. An edit is planned and preflighted before output is
allocated. Exact selectors target fields or physical blocks, and preserve
rules win over removal. The launch workflow removes GPS from a fixture while
retaining orientation and ICC, then reparses the output and compares protected
encoded payload hashes. This proves structural payload preservation, not pixel
equivalence: the toolkit does not decode or compare pixels.

## Keep trust boundaries explicit

JUMBF and C2PA inventory reports structural stores, ranges, relationships,
duplicates, and remote references without cryptographic verification. Ordinary
writers refuse protected offset-bearing data unless the caller selects an
explicit supported policy. The launch evidence tests atomic refusal for C2PA
and Ultra HDR inputs. Optional official C2PA SDK adapters are separate from the
dependency-free parser core; an inventory result must never be confused with a
verification result.

## Make claims reproducible

The repository benchmark records pinned competitor versions, fixture hashes,
semantic contracts, transport bytes, speed samples, memory observations,
malformed-input behavior, and ordinary-bundle closure. It retains rows where a
competitor wins. Reports are checked artifacts rather than marketing prose.
The same principle applies to the IPTC, ICC, external-corpus, creator-schema,
community, and launch evidence: the command, source identity, limits, and
normalization policy are visible so an independent reviewer can reproduce or
challenge the result.

## Integrate at the boundary you need

Applications can use the root browser-safe API, the explicit Node adapter,
worker entry points, or the compatibility views for common ExifReader and
exifr migration paths. Browser examples never gain hidden network access. The
HTTP fetch adapter is separate and makes range, validator, redirect, and full
response fallback policy explicit. Deno, Bun, Vite, Next.js, React, and
serverless examples document their runtime boundary rather than widening the
core package.

The release packet is complete when the code, evidence, documentation, and
integration examples are versioned together. External publication remains an
operator action; no checked-in report claims that it has already happened.

