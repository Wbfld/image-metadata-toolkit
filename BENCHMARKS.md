# browser-image-metadata reproducible competitor benchmarks

The `browser-image-metadata` benchmark compares this package with pinned ExifReader and exifr versions
using the same fixture bytes and explicit equal-output contracts. It does not
publish a README performance superlative automatically.

Run it with the default sample counts:

```sh
npm ci
npm run benchmark -- --output artifacts/benchmark.json
```

For a quick local smoke run:

```sh
BENCHMARK_RUNS=3 BENCHMARK_COLD_RUNS=1 npm run benchmark -- --output artifacts/benchmark-smoke.json
```

The report contains seven scenarios:

- detection (`supported` result);
- orientation (validated EXIF orientation code);
- GPS (decimal latitude, longitude, and altitude);
- camera/date (`Make`, `Model`, and capture date);
- all common EXIF fields;
- all documented metadata fields in the benchmark contract;
- remote-range simulation using the toolkit's instrumented Blob/ByteSource path.

Raw competitor field shapes are normalized to these contracts before any timing
is accepted. If one reader differs, the scenario is marked `timingRejected` and
does not report a speed result. Date comparisons intentionally use the calendar
date because readers differ in whether an EXIF timestamp is interpreted as a
wall-clock value or an instant.

Cold and warm measurements are separate. Cold samples use fresh child processes
and include dynamic reader imports while excluding process launch and fixture
I/O. Warm samples reuse imported modules and include input construction and
parsing. Each report records the percentile method, sample counts, Node version,
operating system, CPU architecture, package versions, fixture SHA-256 hashes,
and min/median/p95 timing values.

Transport data is measured independently of timing. The remote-range scenario
records actual range requests, bytes fetched, cache hits, and coalesced reads
from an instrumented Blob adapter. ExifReader and exifr receive the same bytes
through a full-input baseline, so their one request and full byte count are
visible rather than silently omitted.

The benchmark implementation is split across
[`scripts/benchmark.mjs`](./scripts/benchmark.mjs),
[`scripts/benchmark-child.mjs`](./scripts/benchmark-child.mjs),
[`scripts/benchmark-runner.mjs`](./scripts/benchmark-runner.mjs), and
[`scripts/benchmark-scenarios.mjs`](./scripts/benchmark-scenarios.mjs).
The scenario and transport contracts are regression-tested in
[`tests/benchmark-contracts.test.ts`](./tests/benchmark-contracts.test.ts).

## Release baseline

Before a release, capture the test/coverage/build baseline and review the
resulting JSON:

```sh
npm run baseline -- --output baselines/2.0.0-alpha.3.json
npm run baseline:verify
```

The baseline command emits runtime and git state for traceability, package
version, fixture hashes, installed competitor versions, test totals, coverage,
tarball size, and export-entry sizes. The checked-in baseline pins the
package/fixture/competitor contract, so verification deliberately fails if any
of those change; update it only after reviewing that change.

Browser byte-read, cancellation, and module-worker behavior are covered
separately by `npm run test:browser`. Deno ESM runtime compatibility is covered
by `npm run test:deno`. Independent metadata comparisons are pinned in the
lockfile and run through the normal Vitest suite.
