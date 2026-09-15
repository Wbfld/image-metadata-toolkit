# G04 launch evidence

- Status: **passed**
- Package: browser-image-metadata 2.0.0-alpha.3
- Evidence version: g04-launch-audit/1
- External publication: ready-for-operator-publication

## Executed launch workflows

| Workflow | Result |
| --- | --- |
| Remove GPS while retaining orientation and ICC | passed, 1 protected payload match |
| Read metadata ranges from a 200 MiB virtual image | 645 bytes read of 209715200; full materialization: no |
| Inspect Exif 3.1/IPTC 2025.1 AI and accessibility | 4 semantic values, 4 AI properties available |
| Refuse C2PA and Ultra HDR invalidation | C2PA: refused atomically; Ultra HDR: refused atomically |
| Migrate common ExifReader/exifr calls | exifreader and exifr views generated |

No image bytes are retained in this evidence report; only derived hashes, dimensions, counters, statuses, and compatibility identities are recorded.

## Release-day artifacts

| Path | Bytes | SHA-256 |
| --- | ---: | --- |
| G04_LAUNCH_PLAN.md | 3399 | faadee8278272e0a6f9e62a7186a927c3db883a1e9a2f0990c16347be7dab696 |
| G04_TECHNICAL_ARTICLE.md | 3895 | 13328b517254f07c98dacf6f33957b45218760720b86ad71f7f2753043de14ae |
| G04_INTEGRATION_EXAMPLES.md | 1533 | b5ed22b5eca20d1b440a0f25164b6ee35f4e3025acc20aed5e892dbd7c92db09 |
| docs-site/index.html | 2569 | b0455604857d5b883b7eb17f077594e6e4d0a3cd0e960dbc02af75d80a15e8d6 |
| docs-site/playground.html | 1890 | 0ba0b9bc67ac59a93c766fb271af6580c388f63a8f464ca51a383a95e604c8af |
| BENCHMARKS.md | 4037 | 0eda52e0d8362c2403131167c13ede4ddc82401ce3be6aee6f037577aec61dca |
| reports/g02-comparison.json | 14764 | 3c86ce3eddd95d4bdd4a29176976a76866223bef70bbd3e2a8f0d03550dfe7ac |
| examples/integrations/README.md | 813 | eab7ca5f2d59092141057055c4fec232d8a82c0329455bec48836b45b3c2a004 |
| examples/integrations/deno.ts | 326 | bd5a17a15508d0e1d805e6664b018584b391d018572c935d77bdd69e52c404d9 |
| examples/integrations/next-client.tsx | 451 | f8d4147fbfca1a08f8b6591e7156d148d1cfa484888ffdb6c7dd6eee4729cae0 |
| examples/integrations/react.tsx | 447 | ee5ca50ad8170dc96a1a5618c2324eae717f0d246726bed8e221aa51a3455aba |
| examples/integrations/vite.ts | 332 | 3bb4e1babb02e8d1d6c13401cf7e229c407e0fa03a5bdaa15dc673bbfc2d8e6a |

The technical article, local playground, benchmark artifacts, integration examples, and launch plan are present and hash-audited. The package does not claim that an external site, article, playground, or benchmark publication occurred; an operator must publish these repository artifacts separately.
