# R05 release candidate and GA audit

- Schema: `browser-image-metadata/r05-release-audit@2`
- Generated: `2026-09-16T23:54:38.792Z`
- Phase: `prepublication`
- Package: `browser-image-metadata@2.0.0-alpha.3`
- Overall gate: **BLOCKED**
- Automated gates: **BLOCKED**
- External TIFF/writer review: **BLOCKED**
- Publication/provenance: **PENDING**

This is a redistribution-safe audit record. It contains no external corpus, reference image, ICC profile, or other third-party payload.

## Environment and candidate identity

- Node: `v23.7.0`; platform: `darwin`; architecture: `arm64`.
- Package manager: `npm`; user agent: `npm/10.9.2 node/v23.7.0 darwin arm64 workspaces/false`.
- Repository HEAD observed by the audit: `fb0b526476d876a36f17eca51c665994fcd051dc`.
- Source worktree dirty at audit time: `true`.
- Candidate tracked diff files: 116; candidate untracked files: 104.
- A clean-clone result is accepted only from `R05_CLEAN_CHECKOUT`, which must be a clean checkout of the exact candidate; a dirty source tree, tarball, or HEAD-only clone is not substituted.

## Pinned tools, standards, and retained evidence

- @playwright/test: `1.63.0`.
- @contentauth/c2pa-node: `0.9.5`.
- @contentauth/c2pa-web: `0.14.6`.
- exiftool-vendored: `38.1.0`.
- exifr: `7.1.3`.
- exifreader: `4.45.0`.
- typescript: `5.9.3`.
- vitest: `4.1.11`.
- publint: `0.3.24`.
- External corpus commit: `a69bf74770caf6b333221658f5092ed69f99faac`.
- `data/metadata-registry.json`: SHA-256 `d8d8be4d61ce5357e1abfbdc47167209823ed0ca30f914a122c4efb20c542498`.
- `scripts/external-registry.json`: SHA-256 `c0a643468137cbca137b8bf4357ad841d238e1126ca673fedae427cf50ef945a`.
- `scripts/external-allowlist.json`: SHA-256 `614b922099aac29ff42ad71fb300c34422fca4fc6b40acd3895747c4f05f25cf`.
- `data/iptc/reference-images.json`: SHA-256 `c84e6a90a8bad42e0cd46adbec3b8380d37a685d94355f568cd41ec8d0d04b99`.
- `data/icc/reference-corpus.json`: SHA-256 `425f3f6915a835f663b415f53b413303fad6a528805e72fe58e9a4be758d9922`.
- `data/c2pa/provenance.json`: SHA-256 `974069b098607b9430ce4d44856925eb6e30f57197a2accedc375aec0d3dcef9`.
- `data/raw/raw-b04-sources.json`: SHA-256 `3f8b479de1aa67119576919f558736847dd30105f419a68b50c6753ba3cc797a`.
- `data/raw/raw-b05-sources.json`: SHA-256 `d7a4eb33e001ce308e2132b219bcd97f55470081fdffda125156d2e974441e39`.
- `data/dependency-license-provenance.json`: SHA-256 `4e3a407d744a812b7454561fc0b6becc34a716063eea4e08b15705e467ec4f8d`.
- `data/makernote-b08-sources.json`: SHA-256 `161bc0075ef095d9c1f9ccd68d675c7e0f9f9aa997e3855bdee89f23a8dd472b`.
- `data/svg/b09-sources.json`: SHA-256 `53a5322a5baad171d56e5d47022eb2845a9a52ea08913eb0e72d321c46fb4eb2`.

| Evidence artifact | Present | Bytes | SHA-256 |
| --- | --- | --- | --- |
| reports/f05-external-corpus-evidence.json | yes | 112250 | `76417955b205b0298e3114475b59e24e6eb948c54925cda7ee4de8000cd22003` |
| reports/iptc-reference-conformance.json | yes | 11273 | `d1df6de89f91cb402d85398098a2dc2b15c177d26caeec529aa159af632be6ea` |
| reports/icc-reference-report.json | yes | 311976 | `342f3a7508ae2842533aa54e6522093e8dfd35011f48fc6de95227d13c4c03f4` |
| reports/c2pa-adapter-integration.json | yes | 135 | `213083695b1b89e6b21afbebfce5aa167f011c709860cf6fe3a3cb17c0ac6692` |
| reports/raw-b04-evidence.json | yes | 36261 | `a9a2fd36bdfb4108ad40acc24a33c2979e44073fc1eb122d757221b1caa00fdc` |
| reports/raw-b04-evidence.md | yes | 2559 | `1fd87ee5d6c271fac686d08be912318a5b736ad41f43fad81fd40b9059f804fa` |
| reports/raw-b05-evidence.json | yes | 39082 | `fec0c5c96799e7de5fa5da49c3da6eaf0f5f1bab08176a4727ea0fdce8af4a9d` |
| reports/raw-b05-evidence.md | yes | 4912 | `837aafbd9cfb396e0c526872aecb97f72ac3eda003a686b8906963853fd2ad4f` |
| reports/photoshop-b06-evidence.json | yes | 10871 | `0e35c9030dec48bb2e84f5f1e17ce0c8f9ff10b9e1c206a6c82ca4ff12d08114` |
| reports/photoshop-b06-evidence.md | yes | 1107 | `15c5c5be8900843b672f8bcf3a5d543f849ba857f5f2f63a6336177f9a060ac8` |
| reports/makernote-b07-contract-evidence.json | yes | 2193 | `f4bfd34b9bd194f0c5d412561c3f74540846477a3add0c051d411d6ef73c9811` |
| reports/makernote-b07-contract-evidence.md | yes | 1223 | `9bc462b6ea9c8803ab72ed6568034c686cac24593291d1d5f9e040ef07e9a44b` |
| reports/makernote-b08-evidence.json | yes | 157027 | `0319ec8ef03e4c404e7d43680a1dbc69ccfa6d50f6906648d88b09ea468e8ecc` |
| reports/makernote-b08-evidence.md | yes | 6361 | `2a201f44441673ac82cc2ecb6ed78439bd3c488bb1badcee06ca70f5f40891e6` |
| reports/svg-b09-evidence.json | yes | 3089 | `869a63294b0c00c32218c10505035c5e718b687ec7cfb64efcb7e8fe746717ed` |
| reports/svg-b09-evidence.md | yes | 563 | `c57bcf4d097c67592602f4e5f767b6668faa09f8cb0df23e8ed8d90ed2216415` |
| reports/sidecar-b10-evidence.json | yes | 6703 | `f50acafcde1c07b1fd7da4ac3913238c9d450328ff9e26bdd7aa7fe0a7dabf59` |
| reports/sidecar-b10-evidence.md | yes | 700 | `f047fdae1985f3a96feb8172f8e08b44062ce6bc746329080d41880e1fe68d96` |
| reports/r01-api-snapshot.json | yes | 1238 | `3fd7dc258d0a697d7ab5ff28d55458703b7e0df12cf2017720f947cd8b53f899` |
| reports/r02-r03-evidence.json | yes | 3063 | `90790bb1143f74a5e51e62f23d31e0ae02d2bd76f3c53aeb08edcea079ec85d8` |
| reports/r02-r03-evidence.md | yes | 1830 | `faa0fae693d41e33b5ff66bec767ee85d6b91415ba544cc57b7aec58b1641fcc` |
| reports/r04-compatibility.json | yes | 16495 | `d54df341e8e91b7340a5c25d397edfa2f51d31b09770c86a07a1779d5e19c39f` |
| reports/r04-compatibility.md | yes | 8243 | `09053f95c2f2927f39bdf7b70e41e7228100d76b4888990d651ebc26348ab2ff` |
| reports/r05-benchmark.json | yes | 74904 | `3f7ef05469d515e77b07ca42e854bd23c3eac05f9b416c50682e27a64a468ff7` |
| artifacts/r05-external/external-corpus-report.json | yes | 12294060 | `f6fda23f47172d214627756ac9b2561dcf1219cafbac87681278ea3ac67949af` |
| artifacts/r05-external/external-corpus-report.md | yes | 418642 | `9a98bfd927f25fa0f31c69ab76f6c81f0d42e02998e32d178748019b002c62c9` |
| artifacts/r05-iptc/iptc-reference-conformance.json | yes | 11273 | `019072ed788895a120a0d12cfd1a66a7442bf956def76f93cbd8804fad51fec2` |
| artifacts/r05-iptc/iptc-reference-conformance.md | yes | 6214 | `5d07d1664b0030539cae1ff3fe5d667038865843ef0680f1038cb3287c569bae` |
| artifacts/r05-icc/icc-reference-report.json | yes | 311976 | `d4531b16531f82ad81d37f9d6af8f47dca66cde365eb27dc18d4c7fdd1226577` |
| artifacts/r05-icc/icc-reference-report.md | yes | 4529 | `6fddd38a4251af4faa002a221c7452de3feb61a3561563b08fd55396559950df` |

## Required checks

| Check | Status | Evidence or reason |
| --- | --- | --- |
| release-preflight | **FAILED** | The current source tree is dirty; release preflight requires a clean candidate checkout. |
| clean-clone | **UNAVAILABLE** | R05_CLEAN_CHECKOUT is not set and the current source tree is dirty. A dirty working tree cannot prove a clean checkout containing the exact candidate. |
| unit-integration-check | **UNAVAILABLE** | The local execution environment prevented this command from running to completion; this is not successful evidence. |
| full-check | **UNAVAILABLE** | The local execution environment prevented this command from running to completion; this is not successful evidence. |
| fuzzing | **PASSED** | npm run test:fuzz |
| browser-matrix | **UNAVAILABLE** | The local execution environment prevented this command from running to completion; this is not successful evidence. |
| deno-runtime | **PASSED** | npm run test:deno |
| bun-runtime | **PASSED** | bun run test:bun |
| benchmark | **PASSED** | npm run benchmark -- --output ./reports/r05-benchmark.json |
| external-corpus | **PASSED** | npm run test:corpus |
| official-iptc-reference | **PASSED** | npm run iptc:reference |
| official-icc-reference | **PASSED** | npm run icc:reference |
| generated-artifacts | **PASSED** | npm run capabilities:check |
| generated-registry | **PASSED** | npm run registry:check |
| generated-iptc | **PASSED** | npm run iptc:check |
| typecheck | **PASSED** | npm run typecheck |
| lint | **PASSED** | npm run lint |
| coverage | **UNAVAILABLE** | The local execution environment prevented this command from running to completion; this is not successful evidence. |
| build | **PASSED** | npm run build |
| publint | **PASSED** | npm run publint |
| package-smoke | **PASSED** | npm run package:smoke |
| examples | **PASSED** | npm run examples |
| api-schema-contract | **PASSED** | npm run r01:check |
| baseline | **FAILED** | npm run baseline:verify |
| cli-contract | **PASSED** | npm run cli:check |
| docs-site | **PASSED** | npm run docs:check |
| official-adapter-integration | **UNAVAILABLE** | The local execution environment prevented this command from running to completion; this is not successful evidence. |
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
| source-marker-audit | **FAILED** | recorded |
| dependency-vulnerability-scan | **UNAVAILABLE** | The npm audit service was unavailable; this is not successful evidence. |
| license-scan | **PASSED** | Every installed package must expose a package.json license or an identifiable common license file; a package without metadata may use only an exact lockfile-matched, hash-pinned upstream provenance entry. Optional, development, peer, and runtime groups are reported separately. |
| package-provenance | **PASSED** | Prepublication verifies the local package artifact and records registry provenance as pending. Postpublication requires exact registry metadata, prerelease/stable dist-tag, tarball integrity, npm signatures, and a decodable SLSA provenance attestation. |
| git-diff-check | **PASSED** | git diff --check |

## External review gate

- Status: **BLOCKED**.
- No retained external review record exists. The prepared packet is not an approval.
- The review packet is prepared in `R05_EXTERNAL_REVIEW_PACKET.md`; it is not an approval record.

## Publication gate

- Status: **PENDING**.
- Registry version, dist-tag, tarball integrity, npm signatures, and provenance are intentionally pending until the trusted-publishing step succeeds.
- Prepublication does not publish, tag, commit, or push. A `pending` registry result is intentional and is not a successful postpublication claim.

## Failures and unproven criteria

- release-preflight is failed.
- clean-clone is unavailable.
- unit-integration-check is unavailable.
- full-check is unavailable.
- browser-matrix is unavailable.
- coverage is unavailable.
- baseline is failed.
- official-adapter-integration is unavailable.
- dependency-vulnerability-scan is unavailable.
- No retained external review record exists. The prepared packet is not an approval.

The overall gate is deliberately fail-closed. Unavailable runtimes, scanners, corpora, references, clean checkouts, or human review are not successful evidence.

