# External fixture corpora

The repository keeps its small, targeted fixtures under version control. Broader camera interoperability coverage runs from a pinned public source so the npm package and this repository do not redistribute image assets with mixed upstream licenses.

## exif-py resource corpus

The scheduled interoperability workflow checks out [`ianare/exif-py`](https://github.com/ianare/exif-py) at commit `a69bf74770caf6b333221658f5092ed69f99faac` and runs its `tests/resources` directory through this package and pinned ExifTool. At that revision, the directory contains 108 supported JPEG, TIFF, HEIF, and HEIC files: camera-vendor, mobile, HDR, GPS, orientation, XMP, malformed, and legacy samples.

The upstream resource README says user-contributed samples are CC BY-SA 4.0 and that other samples are generally derived from Wikimedia Commons; its directory-level notes identify exceptions and direct maintainers to original author and license pages. The workflow does not copy or publish those resources. Any fixture promoted into this repository must still meet the provenance requirements in `CONTRIBUTING.md`, including its individual redistribution terms, source, SHA-256, and independently established expectation.

Run the corpus locally after obtaining that exact upstream checkout:

```sh
npm ci
EXTERNAL_FIXTURE_ROOT=/path/to/exif-py/tests/resources npm run test:corpus
```

The gate requires at least 100 supported files and compares overlapping Make, Model, Orientation, and dimensions against pinned ExifTool output. It keeps malformed inputs in the scan to ensure bounded handling, while only asserting fields both tools report.
