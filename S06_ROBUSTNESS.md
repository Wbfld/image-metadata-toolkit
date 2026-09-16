# S06 robustness and fuzzing gate

The Stage 6 gate has two complementary parts:

- `npm run test:fuzz` is the short deterministic Vitest property suite. It is
  intended for local feedback and covers bounded random input and mutations of
  the repository's recognized container fixtures.
- `npm run test:fuzz:high-volume` is the continuous high-volume gate. It runs
  independent container/indexer, metadata-decoder, and writer-planning phases,
  verifies every successful writer output by reparsing it, and records checked
  evidence in `reports/s06-high-volume-fuzz-evidence.json` and
  `reports/s06-high-volume-fuzz-evidence.md`.

The high-volume command requires `S06_FUZZ_FIXTURE_ROOT` and refuses to run when
the fixture directory is absent. CI points it at the checked-in
`tests/fixtures` directory. It uses only repository-owned fixtures; mutated
inputs stay in memory and are never written. The report records repository
fixture paths, byte lengths, and SHA-256 values, but never embeds image bytes.

The default deterministic seed set is:

| Phase | Seed |
| --- | ---: |
| Container/indexer | `0x6f0e1d2c` |
| Decoder families | `0x5a17c0de` |
| Writer planning | `0x4b1d5eed` |

Node.js 22 or newer is required. The command bounds iterations, elapsed time,
input size, output size, and heap use. Every parser diagnostic is required to
have a stable typed code. Expected malformed-input and writer refusal outcomes
are counted as typed failures; unexpected throws, hangs/time-bound failures,
heap-bound failures, source mutation, incomplete parser results, and output
that cannot be reparsed fail the command. C2PA/JUMBF remote references are
never fetched.

Coverage is measured with V8 over all `src/**/*.ts` files except the type-only
`src/types.ts` declaration file. The repository gate requires at least 85%
overall branch coverage and at least 90% for the bounded parser/indexer,
metadata-decoder, structured-input, range-I/O, decompression, JUMBF-inventory,
and security-limit boundaries listed by the checked coverage gate. Mutation
policies, surgery, selectors, HTTP adapters, and writers remain included in the
repository-wide threshold even though they are not parser/indexer branches.

`npm run test:coverage` executes the complete instrumented suite (excluding
only the separately exercised CLI and compatibility integration test files),
enforces the 85% branch threshold in `vitest.config.ts`, and then runs
`scripts/s06-coverage-gate.mjs`. The gate aggregates the fresh V8 summary,
rejects skipped branch records and contradictory counters, enforces 90% across
the complete listed parser/indexer scope, and retains checked redistribution-safe
evidence in `reports/s06-coverage-evidence.json` and
`reports/s06-coverage-evidence.md`. A missing summary or failed threshold is a
non-zero result and does not produce passing evidence.

No timeout, unavailable runtime, missing fixture, or missing report is a
passing result.
