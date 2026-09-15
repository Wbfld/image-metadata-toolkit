# R04 codemod decision

Status: no codemod is published for 2.0.0-alpha.3.

R04 reviewed import and helper transformations from exifr, ExifReader, exif-js,
and piexifjs. None is both syntactically local and semantically equivalent:

| Source shape | Why an automatic replacement is unsafe |
| --- | --- |
| `exifr.parse(pathOrUrlOrImage)` | The source accepts paths, URLs, and DOM image elements; the core package accepts caller-owned bytes only and must not add implicit network or filesystem reads. |
| `ExifReader.load()` | Its flat/grouped tag shape and optional file/URL loading do not preserve the toolkit's coverage and duplicate semantics. |
| `EXIF.getData(image, callback)` | Replacing a callback attached to a mutable DOM image with an async byte transaction changes loading, error, and lifecycle behavior. |
| `piexif.load/dump/insert/remove` | A broad EXIF-object rewrite can silently discard metadata blocks. Toolkit writes require exact typed operations and reparse/payload verification. |

The published mappings in [R04_MIGRATION_COMPATIBILITY.md](./R04_MIGRATION_COMPATIBILITY.md)
are intentionally manual and executable. A future codemod requires all of the
following before publication: one exact import/helper transformation, AST-based
ambiguity refusal, comment/format preservation, idempotence, dry-run and check
modes, and fixture-based semantic tests. This decision avoids presenting a
lossy migration as an equivalent rewrite.
