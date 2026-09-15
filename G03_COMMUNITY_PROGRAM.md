# G03 community fixture and plugin program

G03 provides a bounded, reviewable intake path for fixtures, tag-data sets,
and B07-compatible MakerNote plugins. It is contributor tooling and review
policy; it does not add a new parser, output format, global plugin registry,
network fetch, sidecar path, or mutation operation.

## Executable tooling

`npm run community:scrub -- --input <fixture> --report <report.json>
--output <temporary-output>` runs the repository's built privacy audit and
strict policy sanitizer. It refuses missing, non-regular, oversized, or
source-overwriting paths. It writes output only after the inspection and
re-audit are complete, and its JSON/Markdown report contains hashes, counts,
statuses, and basenames rather than raw metadata values or image bytes.

The checked-in command `npm run community:check` verifies the retained G03
evidence, the tag-data schema, the scrubber limit case, and hashes of every
program artifact. `scripts/g03-community-evidence.mjs` uses only the existing
redistribution-safe PNG fixture; no third-party bytes are copied into the
repository.

## Additive tag data and plugins

`schemas/community-tag-data.schema.json` is the machine-readable additive tag
data contract. It requires bounded definitions, stable IDs, exact physical
identity where known, sensitivity, raw-value behavior, and validation rules.
`community/plugin-template.ts` creates an immutable plugin identity from a
versioned HTTPS source with a license and SHA-256. Plugins are supplied to one
operation through the existing B07 API and have no global registration side
effect.

The plugin template deliberately does not run parsing code or access the
filesystem/network. A contributed parser must use only the bounded
`MakerNoteReadContext`, return typed opaque outcomes for unknown/encrypted or
malformed data, and provide exact field provenance.

## Review and support

Use [COMMUNITY_PROVENANCE_TEMPLATE.md](COMMUNITY_PROVENANCE_TEMPLATE.md) for
every fixture or report, [COMMUNITY_REVIEW_CHECKLIST.md](COMMUNITY_REVIEW_CHECKLIST.md)
for review, and [COMMUNITY_CONTRIBUTOR_TICKETS.md](COMMUNITY_CONTRIBUTOR_TICKETS.md)
to keep scopes isolated. [COMMUNITY_SUPPORT_POLICY.md](COMMUNITY_SUPPORT_POLICY.md)
defines maintainer response targets for security, corruption, compatibility,
and ordinary feature reports. The targets are triage targets, not promises of
acceptance or release.

## G03 evidence

The executable evidence is retained in
[reports/g03-community-evidence.json](reports/g03-community-evidence.json) and
[reports/g03-community-evidence.md](reports/g03-community-evidence.md). It
proves the scrubber success and configured-limit refusal, schema bounds,
immutable plugin contract, and hashes of the review artifacts. It does not
represent human approval of any particular future contribution.

