# Isolated community tickets

Community work is accepted as small, independently reviewable tickets. Each
ticket must carry one label from this list and must not combine unrelated
formats, vendors, or mutation behavior.

| Label | Isolated scope | Required evidence |
| --- | --- | --- |
| `community/fixture` | One lawful, scrubbed fixture and its provenance record | Scrubber JSON/Markdown report, hashes, license review |
| `community/tag-data` | One additive tag-data definition set | Schema validation, source citation, positive/negative parser tests |
| `community/makernote-plugin` | One B07-compatible vendor plugin | Bounded context tests, malformed/limit tests, exact provenance, license |
| `community/compatibility` | One report about an existing public reader contract | Minimal fixture or reproduction, regression test, compatibility impact |
| `community/corruption` | One malformed or damaged input behavior | Deterministic bytes, typed diagnostic, bounded failure test |
| `community/security` | One security or privacy concern | Safe reproducer, impact, disclosure details, no public secret |

A ticket should have one owner, one narrow acceptance statement, and one
reviewer. A plugin or fixture ticket may not introduce a new output format,
mutation feature, sidecar I/O path, pixel decoder, or unrelated runtime.
