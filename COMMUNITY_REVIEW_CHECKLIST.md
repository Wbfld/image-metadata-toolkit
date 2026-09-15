# Community fixture and plugin review checklist

This checklist is required for B07-compatible plugins, tag data, fixtures, and
reproducibility reports. It is a review gate, not a substitute for tests.

## Fixture or report

- [ ] The ticket is isolated and named with a `community/<ticket>` label.
- [ ] Source URL, revision, license, retrieval date, permission, and SHA-256
      are recorded.
- [ ] The fixture was scrubbed with the repository tool into a temporary path;
      no third-party bytes are committed without permission.
- [ ] The report contains no raw sensitive values or absolute private paths.
- [ ] Positive, malformed, truncation, duplicate, and configured-limit cases
      are present where the format permits them.
- [ ] Hashes and expected semantic outcomes are deterministic.

## Plugin or tag data

- [ ] `schemas/community-tag-data.schema.json` validates the tag data.
- [ ] The plugin identity includes a version, license, HTTPS source, and
      immutable source provenance.
- [ ] Detection is conservative and does not claim a vendor from a weak
      string match alone.
- [ ] Parsing uses only the bounded `MakerNoteReadContext` and configured
      limits; it performs no network or filesystem I/O.
- [ ] Unknown, encrypted, malformed, and truncated values remain typed opaque
      outcomes and do not become safe values.
- [ ] Every decoded field has exact physical provenance and a sensitivity
      classification.
- [ ] No global registration or mutable singleton state is introduced.
- [ ] License and implementation provenance are independent from competing
      library code or copied tables.

## Security and compatibility

- [ ] No warning-text matching determines safety or mutation behavior.
- [ ] Output and diagnostics are bounded by the repository security model.
- [ ] Existing parser, redaction, browser, Node, and Deno boundaries remain
      unchanged unless the isolated ticket explicitly requires integration.
- [ ] Focused tests and the complete affected suite pass.
- [ ] Documentation, capabilities, changelog, and generated artifacts are
      reconciled.

## Disposition

- Reviewer:
- Review date:
- Scope/revision reviewed:
- Findings:
- Dispositions:
- Decision: approved / changes requested / rejected
