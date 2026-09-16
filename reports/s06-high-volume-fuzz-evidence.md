# S06 high-volume fuzz evidence

Status: **passed** (checked: true)

Package: browser-image-metadata@2.0.0-alpha.3; Node: 23.7.0; V8: 12.9.202.28-node.12.

## Bounds and determinism

Iterations: 20000; time bound: 120000 ms; input bound: 65536 bytes; output bound: 2097152 bytes; heap bound: 536870912 bytes.
Seeds: container 1863195948, decoder 1511506142, writer 1260216045.

## Required independent phases

| Phase | Iterations | Typed failures | Status |
| --- | ---: | ---: | --- |
| container-indexers | 20000 | 0 | passed |
| decoder-families | 20000 | 0 | passed |
| writer-planning | 5000 | 0 | passed |

Successfully reparsed writer outputs: 5000 (JPEG 1667, PNG 1667, WebP 1666).
Unexpected failures: 0; source mutations: 0; remote C2PA references fetched: 0.

## Repo-local fixture evidence

| Fixture | Bytes | SHA-256 |
| --- | ---: | --- |
| tests/fixtures/jpeg-exif-little-endian.jpg (jpeg, makernote, mpf) | 1332 | 6727e301428933a6accd496168a6c3b6fbf0c800f2a0e026afe384799c58f27e |
| tests/fixtures/png-metadata.png (png) | 985 | 5811509f52bb9ca60ca7d077e8b5dac9720794b5f2a7882ae349a6899f329506 |
| tests/fixtures/webp-metadata.webp (webp) | 804 | 0bdc0894e5b76fabacb7bbad5f590b1ec58b796f8a96db1076cb5e066edbae71 |
| tests/fixtures/tiff-metadata.tif (tiff) | 262 | a27c42137f0443afd9dcbedc635b4529f60d7b9e84b360d7dc14a5003c7a2875 |
| tests/fixtures/jpeg-iptc.jpg (xmp, iptc, photoshop, creator) | 1510 | 4b5a1b54c292ea60c1e5d4e4f66906c445e702c609476541631faecf33ffeaef |
| tests/fixtures/jpeg-icc.jpg (icc) | 1482 | c44d2eb179662e35da1a89c6974c3f569421b365871bff21e257e8f978600add |
| tests/fixtures/base.png (c2pa) | 171 | d2eb7e9208ea23ead0947738e379f7d6b356480370e6865960a1751203ad3fc0 |

Normalization policy: No semantic normalization is used for fuzz pass/fail. Parser diagnostics are matched by typed code; successful writer outputs are reparsed before they count.
Source policy: Every source fixture is hashed before and after its phase; mutation is a failure. Mutated inputs are in-memory copies only.
Regression policy: No unexpected failure occurred; no regression bytes were generated. Any future unexpected failure must be minimized from the repo-local lawful fixture and retained only after review.

This redistribution-safe report contains fixture paths and hashes only; it does not contain image bytes or mutated inputs.
