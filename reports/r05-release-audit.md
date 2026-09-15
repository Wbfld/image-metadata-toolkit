# R05 release candidate and GA audit

- Schema: `browser-image-metadata/r05-release-audit@1`
- Generated: `2026-09-15T03:42:52.028Z`
- Package: `browser-image-metadata@2.0.0-alpha.3`
- Overall gate: **BLOCKED**
- Automated gates: **BLOCKED**
- External TIFF/writer review: **BLOCKED**
- Publication: **BLOCKED**

This is a redistribution-safe audit record. It contains no external corpus, reference image, ICC profile, or other third-party payload.

## Environment and candidate identity

- Node: `v23.7.0`; platform: `darwin`; architecture: `arm64`.
- Package manager: `npm`; user agent: `npm/10.9.2 node/v23.7.0 darwin arm64 workspaces/false`.
- Repository HEAD observed by the audit: `dc8677fd376078a1e5c4068cc47f4b7d2d20a074`.
- Source worktree dirty at audit time: `true`.
- Candidate tracked diff files: 48; candidate untracked files: 126.
- A clean-clone result is accepted only from `R05_CLEAN_CHECKOUT`, which must be a clean checkout of the exact candidate; a dirty source tree, tarball, or HEAD-only clone is not substituted.

## Pinned tools, standards, and retained evidence

- @playwright/test: `1.63.0`.
- @contentauth/c2pa-node: `0.9.5`.
- @contentauth/c2pa-web: `0.14.6`.
- exiftool-vendored: `33.5.0`.
- exifr: `7.1.3`.
- exifreader: `4.45.0`.
- typescript: `5.9.3`.
- vitest: `3.2.7`.
- publint: `0.3.24`.
- External corpus commit: `a69bf74770caf6b333221658f5092ed69f99faac`.
- `data/metadata-registry.json`: SHA-256 `d8d8be4d61ce5357e1abfbdc47167209823ed0ca30f914a122c4efb20c542498`.
- `scripts/external-registry.json`: SHA-256 `c0a643468137cbca137b8bf4357ad841d238e1126ca673fedae427cf50ef945a`.
- `scripts/external-allowlist.json`: SHA-256 `614b922099aac29ff42ad71fb300c34422fca4fc6b40acd3895747c4f05f25cf`.
- `data/iptc/reference-images.json`: SHA-256 `c84e6a90a8bad42e0cd46adbec3b8380d37a685d94355f568cd41ec8d0d04b99`.
- `data/icc/reference-corpus.json`: SHA-256 `de4089212874ec464b98323b05b55746490702dba4537466a4323724f35eb144`.
- `data/c2pa/provenance.json`: SHA-256 `974069b098607b9430ce4d44856925eb6e30f57197a2accedc375aec0d3dcef9`.
- `data/raw/raw-b04-sources.json`: SHA-256 `3f8b479de1aa67119576919f558736847dd30105f419a68b50c6753ba3cc797a`.
- `data/raw/raw-b05-sources.json`: SHA-256 `d7a4eb33e001ce308e2132b219bcd97f55470081fdffda125156d2e974441e39`.
- `data/makernote-b08-sources.json`: SHA-256 `6a874f4d9fc87bb55c5bdcca08d1236f7bbde4cd1eb2e6bdc693f08fe404b2e7`.
- `data/svg/b09-sources.json`: SHA-256 `53a5322a5baad171d56e5d47022eb2845a9a52ea08913eb0e72d321c46fb4eb2`.

| Evidence artifact | Present | Bytes | SHA-256 |
| --- | --- | --- | --- |
| reports/f05-external-corpus-evidence.json | yes | 86418 | `c6aba99919a5dd4590ba80db8a75bcc5a500dfd6ac2e48f26720bf440d7f02dc` |
| reports/iptc-reference-conformance.json | yes | 11273 | `6fc08cceefa14f8e4d1482c77eca7792a8ca88548b28faee29e9f4aa76e4bdd8` |
| reports/icc-reference-report.json | yes | 311976 | `24cf0c5acc246214bab1a2e199a4b7d7d6df28bff793fc0348c3a693b054a6e6` |
| reports/c2pa-adapter-integration.json | yes | 4428 | `46eba14a4a0dc057ccd37abc0bef02111e1253321cfb45021775840d9bd29772` |
| reports/raw-b04-evidence.json | yes | 36261 | `f0a8dcc5e6517d66c2510fb0a90976c0de0f35a82fff0adbf6ff153988a69094` |
| reports/raw-b04-evidence.md | yes | 2559 | `b8f7b0b163b44f6efe95553b829e33cc9e587c8dc77577b5052a9363613264da` |
| reports/raw-b05-evidence.json | yes | 39082 | `67f26368545b3f18178de33cd830ccff62d3546701b5fd7e18d7fd9dc56f8647` |
| reports/raw-b05-evidence.md | yes | 4912 | `91671e7ed0a6b3085ce0ebc203aee683f745d5f4671b15f9a56d992bd347eba3` |
| reports/photoshop-b06-evidence.json | yes | 10813 | `c535aa217de5fb451368785af423501d0061cd421ae2d2723a8bd7fa0d87f934` |
| reports/photoshop-b06-evidence.md | yes | 1106 | `15aab456efa7c5096e3d77038fe9c2641a721389eec8ede60a7d8f52fce0f640` |
| reports/makernote-b07-contract-evidence.json | yes | 2193 | `f4bfd34b9bd194f0c5d412561c3f74540846477a3add0c051d411d6ef73c9811` |
| reports/makernote-b07-contract-evidence.md | yes | 1223 | `9bc462b6ea9c8803ab72ed6568034c686cac24593291d1d5f9e040ef07e9a44b` |
| reports/makernote-b08-evidence.json | yes | 157027 | `eac06e2363311f73ef1c3c40b9f10a6d0c4a359e89615cb523058afd82e8c41c` |
| reports/makernote-b08-evidence.md | yes | 6361 | `4831c35e3533e3077762fb620b5978980f09f6956223f05c0de9eab8b8e80684` |
| reports/svg-b09-evidence.json | yes | 3089 | `1f34690b184120af45a12d8e641010089d76f9750d7e7972ccb8a867ed2daba4` |
| reports/svg-b09-evidence.md | yes | 563 | `c57bcf4d097c67592602f4e5f767b6668faa09f8cb0df23e8ed8d90ed2216415` |
| reports/sidecar-b10-evidence.json | yes | 6703 | `99767bd7afeb82c276da4a476d415069d2178f2f4b69629b9a425c4915e49adf` |
| reports/sidecar-b10-evidence.md | yes | 700 | `f047fdae1985f3a96feb8172f8e08b44062ce6bc746329080d41880e1fe68d96` |
| reports/r01-api-snapshot.json | yes | 1238 | `44bd195677d943c5f66f1d111d9f1a3af3e1e4568763232ff980f3944c54d9fc` |
| reports/r02-r03-evidence.json | yes | 3063 | `90790bb1143f74a5e51e62f23d31e0ae02d2bd76f3c53aeb08edcea079ec85d8` |
| reports/r02-r03-evidence.md | yes | 1830 | `faa0fae693d41e33b5ff66bec767ee85d6b91415ba544cc57b7aec58b1641fcc` |
| reports/r04-compatibility.json | yes | 16495 | `d54df341e8e91b7340a5c25d397edfa2f51d31b09770c86a07a1779d5e19c39f` |
| reports/r04-compatibility.md | yes | 8243 | `09053f95c2f2927f39bdf7b70e41e7228100d76b4888990d651ebc26348ab2ff` |
| reports/r05-benchmark.json | yes | 74901 | `dee7ed4aa13ec388d242a68d9e418c000211e3e153c541a29663fe0b74a36397` |
| artifacts/r05-external/external-corpus-report.json | yes | 11375561 | `de6ef043c942b920c518fc00222e8a48980ddb5405f6957b78a58d04b1b20470` |
| artifacts/r05-external/external-corpus-report.md | yes | 382159 | `554fa48b53d507d80647676d2bda3c7253d964c2f39e80650561360088c63895` |
| artifacts/r05-iptc/iptc-reference-conformance.json | yes | 11273 | `561686a9c016f9695af7db8c680c2026d378539e15aa8cb9163b6c5a106ba47a` |
| artifacts/r05-iptc/iptc-reference-conformance.md | yes | 6214 | `6b150ab099a42b6899fe4f5c859e592ec23a440d4eaac3777261c35ef9d85dfb` |
| artifacts/r05-icc/icc-reference-report.json | yes | 311976 | `57d53796f5adeff85cb1bc8ed122d6db49796cf550a5c76cb49a2eff35e5f648` |
| artifacts/r05-icc/icc-reference-report.md | yes | 4529 | `c8e958f9a93d24a21ce39f9c3e8310babd510839c6004d1f66329f51a6ff5cfe` |

## Required checks

| Check | Status | Evidence or reason |
| --- | --- | --- |
| release-preflight | **FAILED** | The current source tree is dirty; release preflight requires a clean candidate checkout. |
| clean-clone | **UNAVAILABLE** | R05_CLEAN_CHECKOUT is not set and the current source tree is dirty. A dirty working tree cannot prove a clean checkout containing the exact candidate. |
| unit-integration-check | **PASSED** | npm run test |
| full-check | **PASSED** | npm run check |
| fuzzing | **PASSED** | npm run test:fuzz |
| browser-matrix | **FAILED** | The installed Playwright WebKit engine rejects the PushAPIEnabled context setting during page setup; Chromium and Firefox completed separately. |
| deno-runtime | **UNAVAILABLE** | Deno executable is not installed; no Deno result is treated as pass. |
| bun-runtime | **UNAVAILABLE** | Bun executable is not installed; no Bun result is treated as pass. |
| benchmark | **PASSED** | npm run benchmark -- --output ./reports/r05-benchmark.json |
| external-corpus | **PASSED** | npm run test:corpus |
| official-iptc-reference | **PASSED** | npm run iptc:reference |
| official-icc-reference | **PASSED** | npm run icc:reference |
| generated-artifacts | **PASSED** | npm run capabilities:check |
| generated-registry | **PASSED** | npm run registry:check |
| generated-iptc | **PASSED** | npm run iptc:check |
| typecheck | **PASSED** | npm run typecheck |
| lint | **PASSED** | npm run lint |
| coverage | **PASSED** | npm run test:coverage |
| build | **PASSED** | npm run build |
| publint | **PASSED** | npm run publint |
| package-smoke | **PASSED** | npm run package:smoke |
| examples | **PASSED** | npm run examples |
| api-schema-contract | **PASSED** | npm run r01:check |
| baseline | **PASSED** | npm run baseline:verify |
| cli-contract | **PASSED** | npm run cli:check |
| docs-site | **PASSED** | npm run docs:check |
| official-adapter-integration | **PASSED** | npm run test:c2pa |
| jxl-b01 | **PASSED** | npm run test:jxl |
| heif-b02 | **PASSED** | npm run test:heif |
| heif-b03 | **PASSED** | npm run test:heif-sequences |
| raw-b04 | **PASSED** | npm run test:raw |
| raw-b05 | **PASSED** | npm run test:raw-b05 |
| photoshop-b06 | **PASSED** | npm run test:photoshop-b06 |
| makernote-b07 | **PASSED** | npm run test:makernote-b07 |
| makernote-b08 | **PASSED** | npm run test:makernote-b08 |
| svg-b09 | **PASSED** | npm run test:svg-b09 |
| sidecar-b10 | **PASSED** | npm run test:sidecar-b10 |
| r04-compatibility | **PASSED** | npm run test:r04 |
| focused-ticket-evidence | **PASSED** | recorded |
| documentation-links | **PASSED** | recorded |
| source-marker-audit | **PASSED** | recorded |
| dependency-vulnerability-scan | **FAILED** | npm audit exited without a zero-vulnerability result. |
| license-scan | **FAILED** | License metadata is unresolved for: buffers@0.1.1. |
| package-provenance | **UNAVAILABLE** | Local npm pack structure was verified, but registry trusted-publishing provenance cannot be established without a publication, which this task forbids. |
| git-diff-check | **PASSED** | git diff --check |

## External review gate

- Status: **BLOCKED**.
- No retained external review record covers TIFF offset handling and every writer with reviewer identity, scope, revision, findings, dispositions, date, and approval.
- The review packet is prepared in `R05_EXTERNAL_REVIEW_PACKET.md`; it is not an approval record.

## Publication gate

- Status: **BLOCKED**.
- Publication is intentionally prohibited by the task instructions; no tag, release, registry publication, or external provenance claim is made.
- The compatibility and limitations report is prepared in `R05_COMPATIBILITY_LIMITATIONS.md` for a later reviewed release; this run does not publish, tag, commit, or push.

## Failures and unproven criteria

- release-preflight is failed.
- clean-clone is unavailable.
- browser-matrix is failed.
- deno-runtime is unavailable.
- bun-runtime is unavailable.
- dependency-vulnerability-scan is failed.
- license-scan is failed.
- package-provenance is unavailable.
- No retained external review record covers TIFF offset handling and every writer with reviewer identity, scope, revision, findings, dispositions, date, and approval.

The overall gate is deliberately fail-closed. Unavailable runtimes, scanners, corpora, references, clean checkouts, or human review are not successful evidence.

