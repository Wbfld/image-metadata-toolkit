# G04 launch plan

G04 is the repository launch packet for the local-first metadata toolkit. It
connects the production APIs, documentation site, benchmark artifacts,
integration examples, and release-day communications into reproducible
workflows. The packet is ready for an operator to publish; this repository
change does not publish to external services.

## Demonstrable workflows

Run `npm run g04:check` after a build to execute the launch audit and verify
the retained report. The audit runs these five workflows against real package
APIs:

1. Remove GPS from a JPEG while retaining non-default orientation and ICC,
   reparse the result, and verify protected encoded payload hashes.
2. Parse metadata from a virtual 200 MiB JPEG source while recording the
   bounded range-read telemetry and forbidding full Blob materialization.
3. Decode IPTC 2025.1 AI, accessibility, and data-mining properties through
   the generated semantic registry, with ExifReader/exifr-shaped compatibility
   views produced from the same parsed result.
4. Refuse C2PA and Ultra HDR invalidation atomically when a writer/redactor
   cannot safely rewrite the protected structure.
5. Demonstrate the common ExifReader and exifr adapter calls without importing
   either competitor as a core runtime dependency.

The exact derived hashes, counters, and statuses are in
[reports/g04-launch-evidence.json](reports/g04-launch-evidence.json) and
[reports/g04-launch-evidence.md](reports/g04-launch-evidence.md). The report
does not contain source image bytes or raw metadata values.

## Same-day release packet

The following artifacts are prepared together:

- [G04_TECHNICAL_ARTICLE.md](G04_TECHNICAL_ARTICLE.md), a technical article
  describing bounded parsing, privacy, lossless editing, trust boundaries,
  and reproducibility.
- [docs-site/index.html](docs-site/index.html) and
  [docs-site/playground.html](docs-site/playground.html), the local-only
  interactive documentation and playground. The deliberate fetch demo remains
  separately labeled and is not silently enabled by the core.
- [BENCHMARKS.md](BENCHMARKS.md) and the repository-hosted G02 reports,
  including fixture hashes, pinned reader versions, contracts, transport, and
  malformed-input results.
- [G04_INTEGRATION_EXAMPLES.md](G04_INTEGRATION_EXAMPLES.md) and the tested
  browser, worker, Deno, Vite, Next.js, React, and Node examples.
- [G03_COMMUNITY_PROGRAM.md](G03_COMMUNITY_PROGRAM.md), which supplies the
  lawful fixture scrubber and contributor-review path for follow-up reports.

## Operator publication checklist

Before external publication, the release owner must:

- run `npm run check`, `npm run g04:check`, and the required browser/Node
  integration checks in the target release environment;
- publish the technical article, playground, benchmark repository/artifacts,
  and integration examples at URLs whose content hashes are recorded in the
  release record;
- link the issue tracker and security channel, including the response targets
  in [COMMUNITY_SUPPORT_POLICY.md](COMMUNITY_SUPPORT_POLICY.md);
- invite independent reproduction and record any correction rather than
  presenting a benchmark row as a universal speed claim;
- preserve the exact package version and report hashes used for the release.

External publication is an operational action and is intentionally not claimed
by the checked-in evidence.

