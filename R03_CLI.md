# R03 small CLI

The package exposes the isolated Node executable `image-metadata` through the
`bin` entry in `package.json`. The CLI imports the same built public APIs as
applications; it contains no parser, writer, or policy implementation of its
own. It is not imported by the browser, worker, or ordinary parser bundles.

## Commands

`inspect` emits the bounded `toJsonSafeResult()` view, including format,
dimensions, fields, coverage, completeness, provenance, and diagnostics.
`audit` emits the T01 privacy result and omits sensitive raw values unless the
deliberate `--raw-values` opt-in is supplied. Table mode is presentation-only
and never changes the result or exposes raw audit values.

`sanitize --policy <id>` uses one of the seven immutable T02 presets and requires
`--output <path>` or `--output -`; it never silently discards a successful
sanitization. Strict refusal produces no destination output. `edit --operation <json>` accepts one
or more existing typed mutation operations and enables reparse plus payload
verification. Both output-producing commands reject an existing destination,
same-file aliases, and source-overwriting paths. They write a private sibling
temporary file and rename it only after the operation succeeds. `--output -`
is binary stdout; its result summary is written to stderr so binary and
diagnostic streams cannot be mixed.

`verify <input> <output>` calls the W08 preservation verifier. Its result is
explicitly preservation evidence and is not C2PA inventory or official C2PA
verification. `benchmark-file` measures equal bounded `inspect` or `audit`
operations, records package/runtime identity, input hash and length, warmup,
iterations, samples, elapsed time, memory delta where available, and limits.

JSON is the default output. `--table` is a deterministic tab-separated summary
with terminal control characters replaced. All command diagnostics use stable
exit codes:

| Code | Meaning |
| ---: | --- |
| 0 | Success |
| 2 | Usage or argument error |
| 3 | Unsupported operation/input |
| 4 | Incomplete coverage |
| 5 | Policy refusal |
| 6 | Malformed or over-limit input |
| 7 | Verification failure |
| 8 | Filesystem I/O failure |
| 9 | Unexpected internal failure |

Input `-` reads bounded stdin. Binary output is allowed only with an explicit
`--output -`; otherwise output-producing commands require a distinct file
destination and JSON remains safe for automation. Source bytes are read before
mutation, never modified in place, and temporary output is cleaned after a
failed write. The core’s documented security limits bound parser, serializer,
adapter, and benchmark work.

## Reproducibility and checks

Run `npm run build` before using the repository-local executable,
`node cli/index.mjs --help` for command help, and `npm pack` to test the
published `bin` entry. The CLI tests spawn both the built repository executable
and a packed tarball installation. They cover every command in JSON and table
mode, malformed and unsupported inputs, privacy redaction, policy refusal,
duplicate/conflict and limit results, stdin/stdout, terminal escaping,
same-file and symlink aliases, existing destinations, failed atomic writes,
stable exit codes, and direct-API semantic equivalence.
