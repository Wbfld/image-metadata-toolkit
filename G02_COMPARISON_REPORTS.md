# G02 reproducible comparison reports

The package keeps comparison evidence as versioned, repository-hosted
artifacts. The evidence generator does not select a winner in advance: every
semantic, byte-read, speed, memory, malformed-input, and ordinary-bundle row
records whether its values were comparable, retains unavailable values as
unavailable, and derives a winner only from measured comparable values. A tie
is a tie. A row with no comparable values is not a match and is not a win.

Run the report locally:

```sh
npm ci
npm run g02:run
npm run g02:check
```

`g02:run` executes the existing pinned competitor benchmark in a child
process, then runs real memory observations, malformed-input probes against the
toolkit/ExifReader/exifr, and a built ordinary-bundle closure scan. The
benchmark uses the repository's checked-in fixtures and records each file's
SHA-256; no third-party or repository fixture bytes are copied into the
reports. The sample counts, percentile policy, semantic contracts, package
versions, runtime, and transport methodology remain in
[`reports/g02-benchmark.json`](./reports/g02-benchmark.json).

The aggregate report is
[`reports/g02-comparison.json`](./reports/g02-comparison.json) with its
human-readable companion
[`reports/g02-comparison.md`](./reports/g02-comparison.md). The aggregate is
deliberately an artifact, not a claim that this package wins every row.
Competitor wins remain visible whenever their measured comparable value is
lower.

## Reproduction and challenge policy

- The exact package and competitor versions are read from `package.json` and
  `package-lock.json`.
- Fixture paths, lengths, and SHA-256 identities are retained; changing a
  fixture changes the report identity and requires a new run.
- Correctness timing is accepted only when every reader satisfies the existing
  equal-output contract. Contract failures reject timing; they are not
  silently treated as matches.
- Transport counts use actual reader instrumentation. Memory values are
  observational process-heap deltas and are not converted into an unscoped
  performance claim.
- Malformed-input behavior records whether each reader returned or threw; it
  is evidence about behavior, not a correctness score.
- Bundle closure records hashes and scans ordinary built entry points for
  optional C2PA SDK imports. Optional trust adapters remain separate.

The report is safe to redistribute because it contains no image payloads,
raw metadata, prompts, or private paths. It is suitable for publication after
an operator reviews the generated environment and chooses an external host;
this repository does not publish external artifacts automatically.
