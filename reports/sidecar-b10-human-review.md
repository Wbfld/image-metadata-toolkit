# B10 mandatory human review record

Status: approved based on explicit repository-owner instruction recorded in the
task session: “B10 human review has passed.”

This record preserves the exact review scope for the roadmap-mandated human
review before proceeding to R01. The diff adds `src/sidecar.ts`, the public
`src/xmp-sidecar.ts` entry point and `./xmp/sidecar` package export, the
`parseSidecar` worker operation, focused tests, the evidence command and
report, authoritative-source manifest, documentation, and the interoperability
workflow job.

The reviewer should inspect the complete diff and confirm:

- sidecar input is explicit caller-supplied bytes and performs no filesystem,
  network, DTD, entity, or external-resource resolution;
- all parser limits and abort checks are preserved and malformed or error
  diagnostics cannot be accepted as a complete merge;
- source kind, source ID, packet/block identity, URI/local-name identity,
  order, arrays, language alternatives, qualifiers, nested resources, unknown
  properties, lexical values, and byte ranges remain observable;
- `preserve-all` is the default, precedence is explicit, and
  `reject-conflicts` cannot silently overwrite a candidate;
- serialization uses the existing RDF/XML serializer, escapes safely, enforces
  output limits, and reparses before returning output;
- worker, browser, Node/package export, JSON-safe adapter, and retained-evidence
  boundaries are complete and do not introduce unrelated dependencies.

Executable supporting evidence is in
[`reports/sidecar-b10-evidence.json`](./sidecar-b10-evidence.json) and
[`reports/sidecar-b10-evidence.md`](./sidecar-b10-evidence.md). This packet
is accompanied by the explicit owner approval quoted above. No reviewer
identity, independence claim, findings, or commands are inferred beyond that
instruction.
