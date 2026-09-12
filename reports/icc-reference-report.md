# ICC semantic differential evidence

Status: **pass**

Generated: 2026-09-12T19:29:52.566Z
Profiles examined: 14 (minimum 10)
Comparable values: 201 (minimum 100)
Mismatches: 0 (maximum 0)
Parser warnings: 6; oracle warnings: 0

## Provenance

- Implementation under test: browser-image-metadata standards-based ICC.1:2022 decoder
- Independent oracle: ExifTool 13.42 via exiftool-vendored 33.5.0
- Oracle license: ExifTool: Perl Artistic License or GPL-1.0-or-later; exiftool-vendored.js: MIT
- Corpus manifest: data/icc/reference-corpus.json
- Profile hashes: recorded in JSON for every examined fixture; profile bytes are not copied into this report.

## Counts

| found | comparable | matched | exact | normalized-match | mismatched | non-comparable | missing parser | missing oracle |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 263 | 201 | 201 | 0 | 201 | 0 | 68 | 6 | 0 |

## Profile results

| profile | bytes | SHA-256 | complete | parser warnings | oracle warnings | comparable | matched | non-comparable | mismatched |
| --- | ---: | --- | :---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ACESCG Linear.icc | 600 | `49110baa1ffb2abaf4eac27ba83cd9e79e2d49f62b5ba94f406365a83ae9a827` | yes | 0 | 0 | 15 | 15 | 6 | 0 |
| AdobeRGB1998.icc | 560 | `304f569a83c1e5eddaddac54e99ed03339333db013738bb499ab64f049887e28` | yes | 0 | 0 | 15 | 15 | 6 | 0 |
| DCI(P3) RGB.icc | 556 | `736431a84f4b3a74913af17316f0ff5f98db2cdd4738e6d67e9d6831428791d2` | yes | 0 | 0 | 15 | 15 | 6 | 0 |
| Display P3.icc | 536 | `20789fdbea9835251a4f0796c8bf45cbd964896044886540da21ffc7457af0ab` | yes | 0 | 0 | 15 | 15 | 6 | 0 |
| Generic CMYK Profile.icc | 55280 | `0c8a584b288a306eac9e1d3f1e68bc1b64331c717ceb051420e6257f17b3509a` | yes | 6 | 0 | 15 | 15 | 6 | 0 |
| Generic Gray Gamma 2.2 Profile.icc | 4508 | `73d504558e7d03ef4ff2676ba62c7553ee5bd856b45da2d330e33e012ad61fb3` | yes | 0 | 0 | 10 | 10 | 2 | 0 |
| Generic Gray Profile.icc | 2020 | `0ef4da994a2b833d54af2d4ecbb2c6654b7198ad9e6bd80ed86d684e54fd37d3` | yes | 0 | 0 | 10 | 10 | 2 | 0 |
| Generic Lab Profile.icc | 3588 | `42831b7c1a5fb25d738bd5c09c67343363f897f63053f808f2b3315fc4ef8215` | yes | 0 | 0 | 11 | 11 | 2 | 0 |
| Generic RGB Profile.icc | 1992 | `49429d4dd70f439f6fa47a298e5ffbd280375d2cbd18708b1e05a34aafe5d219` | yes | 0 | 0 | 15 | 15 | 6 | 0 |
| Generic XYZ Profile.icc | 1936 | `358fecec016b7c44d0e2af5e608c7c3f4aef834c2beb8fce6859e724a1b8a39e` | yes | 0 | 0 | 11 | 11 | 2 | 0 |
| ITU-2020.icc | 556 | `fbeb93829179232121e0ef0ce9ec92e2d8844b86d319b98d7915143f294a6cd0` | yes | 0 | 0 | 15 | 15 | 6 | 0 |
| ITU-709.icc | 556 | `ac17db72f76f7ae4feb3681076ae0395d53ba22cea12ff346984a2f414d7c379` | yes | 0 | 0 | 15 | 15 | 6 | 0 |
| ROMM RGB.icc | 568 | `8004970ea74ffd17a2c5cee9468aece4080b75687147011226763c7dca2ee879` | yes | 0 | 0 | 15 | 15 | 6 | 0 |
| sRGB Profile.icc | 3144 | `2b3aa1645779a9e634744faf9b01e9102b0c9b88fd6deced7934df86b949af7e` | yes | 0 | 0 | 24 | 24 | 6 | 0 |

## Normalization and non-comparable values

- **localizedStrings:** Compare one decoded ICC text/MLUC record with ExifTool's selected string; preserve and report every parser MLUC record; multi-record values are non-comparable because ExifTool does not expose the complete array.
- **fixedPoint:** Round independently decoded XYZ and other fixed-point numeric values to five decimal places before comparison; preserve the parser's decoded values and curve hashes in the row evidence.
- **signatures:** Trim ICC four-character padding for comparison, but retain the parser signature/type signature in the row evidence. Known CMM, technology, and profile-class labels are mapped to their ICC signatures.
- **curves:** Compare the independently exposed ICC tag byte length. ExifTool exposes TRC payloads as opaque BinaryField values in this corpus, so curve form, gamma, and sampled-curve characteristics are explicitly non-comparable, never matches.
- **arrays:** Preserve array order in parser evidence. No first/last convenience selection is used; an array is comparable only when the oracle exposes the same ordered structure.
- **dates:** Compare the ICC local creation timestamp as YYYY-MM-DDTHH:mm:ss with ExifTool's YYYY:MM:DD HH:mm:ss raw value; ICC has no timezone field.

Non-comparable values are explicit observations, not matches. In particular, TRC curve form/gamma/sample comparisons are non-comparable when ExifTool exposes only an opaque binary field; the independently compared structural byte length remains a separate value.

## Failures

None.
