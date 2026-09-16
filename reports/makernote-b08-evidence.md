# B08 MakerNote vendor-pack evidence

- Package: `browser-image-metadata@2.0.0-alpha.3`
- Evidence schema: `browser-image-metadata.makernote-b08-evidence.v1`
- Real fixtures examined: 14
- Vendor packs: 7
- Corpus images copied into repository: no
- No-plugin failure control: passed
- Cross-pack isolation: passed

## Provenance

- Format reference: https://www.exiv2.org/makernote.html (retrieved-2026-09-13; SHA-256 `166c17756e3dcc5b501eb57adea9541ccd154d3ee125c8d237ba41d20f55cba4`)
- Fixture index: https://raw.pixls.us/data/filelist.sha256 (2026-09-13 index; SHA-256 `768df432528714bc7e2d66666e4cb2ef33e8ba66b0f5d7408cb54fad94f028d8`)
- Independent oracle: exiftool-vendored 38.1.0, bundled ExifTool 13.59; MIT wrapper; bundled ExifTool is Artistic License 2.0 / GPL-1.0-or-later

## Comparison normalization

Numeric values compare in canonical decimal form. Text compares after Unicode NFC normalization and ordinary trimming; fields declared ascii-padding additionally remove trailing NUL/space padding; case-insensitive-ascii is used only for documented enum labels whose independent oracle differs in case. numeric-sequence compares bounded numeric arrays with an oracle's space-delimited representation, and dimensions compares a two-number array with an oracle's WIDTHxHEIGHT representation. Arrays, rationals, and byte payloads without an explicit semantic policy are represented only by stable hashes. Null, absent, opaque, and unsupported values never count as matches.

## Counts

| Scope | Found | Matched | Normalized match | Mismatched | Missing local | Missing reference | Non-comparable |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Overall | 217 | 37 | 6 | 0 | 0 | 0 | 174 |
| Apple | 28 | 2 | 0 | 0 | 0 | 0 | 26 |
| Canon | 18 | 6 | 0 | 0 | 0 | 0 | 12 |
| Nikon | 24 | 8 | 6 | 0 | 0 | 0 | 10 |
| Sony | 19 | 4 | 0 | 0 | 0 | 0 | 15 |
| Fujifilm | 46 | 8 | 0 | 0 | 0 | 0 | 38 |
| Panasonic/Leica | 30 | 0 | 0 | 0 | 0 | 0 | 30 |
| Pentax | 52 | 9 | 0 | 0 | 0 | 0 | 43 |

## Fixture results

| Pack | Fixture | Bytes | SHA-256 | Notes | Fields | Opaque ranges | Diagnostics |
| --- | --- | ---: | --- | ---: | ---: | ---: | --- |
| org.browser-image-metadata.makernote.apple | apple/IMG_0853.DNG | 10227467 | `845fee4f09c832af3728778737f5ae9b99124debb821b6e2066b94aed1daa91c` | 1 | 12 | 3 | none |
| org.browser-image-metadata.makernote.apple | apple/IMG_0739.DNG | 10550105 | `e8c7ebd8f22f7281d165496b91c8fea8a8e79c8113172fb499e1d66d6045332e` | 1 | 12 | 3 | none |
| org.browser-image-metadata.makernote.canon | canon/RAW_CANON_EOS_7D-raw.CR2 | 25155690 | `b5e47c5fcf7332ac03e0134926f17a338a42e68c1fd7f83e16f45f4b767544e8` | 1 | 7 | 34 | PLUGIN_REJECTED |
| org.browser-image-metadata.makernote.canon | canon/_MG_0001.CR2 | 25812218 | `b303a596a7d8888b56a265d3b9ec78ae4f3fa3dd68c20c8276a50250393fdb39` | 1 | 7 | 34 | PLUGIN_REJECTED |
| org.browser-image-metadata.makernote.nikon | nikon/DSC_0059.NEF | 22582799 | `91657dd8e9c7a086826683f6d20799685657dd7ca2056702b145851465f57cd3` | 1 | 10 | 49 | PLUGIN_REJECTED |
| org.browser-image-metadata.makernote.nikon | nikon/_DSC0521.NEF | 12781061 | `519d354ec40907f1cd30329fc1a641ddec5b46e08e88883f3cf2fddc4ddd9974` | 1 | 10 | 45 | PLUGIN_REJECTED |
| org.browser-image-metadata.makernote.sony | sony/DSC07133.ARW | 16646144 | `bf4c6d21136aa4fd626212fe72b962b6404e3fca45cdc3b6afbed8e73fee2cf8` | 1 | 8 | 81 | PLUGIN_REJECTED |
| org.browser-image-metadata.makernote.sony | sony/DSC00001.ARW | 19063552 | `0223d56b8c3af16e6f588b5340275c9bb30bed2cb5a5cafb0f3ffc7ef4da84e4` | 1 | 7 | 91 | PLUGIN_REJECTED |
| org.browser-image-metadata.makernote.fujifilm | fujifilm/AFXT2720.RAF | 56087360 | `24abd27b4a200f3170ea1579672944b807d0eb35bf21422a3937bb644f27f2eb` | 1 | 21 | 44 | PLUGIN_REJECTED |
| org.browser-image-metadata.makernote.fujifilm | fujifilm/AFXT2721.RAF | 27313968 | `95b33021160b239ceb1a09d46a1b29cb60cb7dd47581feb126b337c219091754` | 1 | 21 | 44 | PLUGIN_REJECTED |
| org.browser-image-metadata.makernote.panasonic-leica | panasonic/P1060736_4x3.RW2 | 19607552 | `dace6b3818f00a5d4f7cc1cfc29744d15dcf7dd8684c882bea4a81c6ef670ad0` | 1 | 13 | 117 | PLUGIN_REJECTED |
| org.browser-image-metadata.makernote.panasonic-leica | panasonic/P1060737_3x2.RW2 | 17453568 | `3d839ffdc55819f9b47eaa966f39f60a09616e2c075979d2a479314ff2c41857` | 1 | 13 | 117 | PLUGIN_REJECTED |
| org.browser-image-metadata.makernote.pentax | pentax/IMGP8550.PEF | 46896111 | `068c902e7b38ac31c7c6eca5c55f69ca395ec6aa7170489281b692a893d0fee9` | 1 | 12 | 0 | none |
| org.browser-image-metadata.makernote.pentax | pentax/IMGP8552.PEF | 175828391 | `aea857a6bd9f2cdf02b3370b0a597f89dd31f567af84b7bc0a770f547d0a0d85` | 3 | 36 | 0 | none |

## Gate policy

The gate requires two real hash-verified fixtures per listed vendor group, at least one decoded field per fixture, exact fixture lengths and SHA-256 values, one-and-only-one recognized pack under the all-pack control, an opaque no-plugin control, bounded truncation and entry-limit controls, at least 14 meaningful independent comparisons, and zero mismatches or missing values for every mapped independent comparison. Unmapped and duplicate values without a one-to-one oracle representation are explicitly non-comparable and never count as matches. Raw image and MakerNote values are not written to this report.

## Per-pack source and registry hashes

| Pack | Version | Registry SHA-256 | Source references |
| --- | --- | --- | ---: |
| org.browser-image-metadata.makernote.apple | 1.0.0 | `64161f19b6557e552d92985362deb630a91c2f38f3f8d974371749392e15da6f` | 4 |
| org.browser-image-metadata.makernote.canon | 1.0.0 | `a6755fbd4f8ec1b9382c313514eb9603d841f6e297bd3017c87224a9b1d09036` | 4 |
| org.browser-image-metadata.makernote.nikon | 1.0.0 | `b05f91aad9af915d10cab93848dcf154a6fff8ecece69f5126d31b81775d21f4` | 4 |
| org.browser-image-metadata.makernote.sony | 1.0.0 | `b238f1059bbf355d3ce167e9821b146d18b8789e4eabf8229a66d889f562da24` | 4 |
| org.browser-image-metadata.makernote.fujifilm | 1.0.0 | `1e789d7fd50f81128c46f35b336b38b0029aebcd09276f00d9295e662d637a93` | 4 |
| org.browser-image-metadata.makernote.panasonic-leica | 1.0.0 | `17b6d381f39eedbe935f8384c00c32102c34bd71b1db3f0e841e68b49a0c1c2b` | 4 |
| org.browser-image-metadata.makernote.pentax | 1.0.0 | `866356b3f7ab47ff20f72e658d27babccb6eb0bf0d9c0f041a2aee5be73000b0` | 4 |
