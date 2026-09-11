# Reproducible benchmarks

Run the same parser requests against the checked-in fixtures with:

```sh
npm ci
npm run benchmark
```

The command emits JSON with Node version, operating system and architecture, input bytes, 25-run minimum/median/p95 latency, RSS delta, and compressed sizes for every ESM output file. Set `BENCHMARK_RUNS` to change the sample count.

The report deliberately separates each ESM file instead of adding split chunks into an invented single number. Dynamic imports load the relevant parser chunks at operation time, so a consumer's total transfer depends on its entry point and requested operation. The packed-artifact smoke test enforces initial ESM-shell gzip budgets of 1.5 KiB for detection, 15 KiB for the JPEG entry point, 30 KiB for the root entry point, and 12 KiB for redaction. Compare the same requested output, completeness scope, fixtures, runtime, and batch size before making a speed or size claim.

Browser byte-read, cancellation, and module-worker behavior are covered separately by `npm run test:browser`. Deno ESM runtime compatibility is covered by `npm run test:deno`, which first checks the TypeScript source and then executes the built ESM output. The runtime phase uses `--no-check` because Deno's direct-file resolver does not map tsup's declaration-only split chunks from their `.js` specifiers to their adjacent `.d.ts` files. The normal TypeScript declaration check remains part of `npm run check`. Independent metadata comparisons are pinned in the lockfile and run through the normal Vitest suite.
