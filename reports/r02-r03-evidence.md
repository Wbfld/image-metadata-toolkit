# R02/R03 retained evidence

Package version: `2.0.0-alpha.3`.

## R02

The deterministic generated site contains 165 EXIF entries, 165 IPTC
properties/structures, 66 URI-qualified XMP mappings, 19 ICC semantic entries,
7 policies, 7 selectors, 9 capability entries, and 11 formats. Source hashes
and generated-artifact hashes are recorded in `r02-r03-evidence.json` and the
site’s `generated/MANIFEST.md`.

`node scripts/generate-docs-site.mjs --check`, the three focused unit tests,
the six Chromium/Firefox browser tests, loopback static serving with CSP, and
package smoke all passed. The local pages use `connect-src 'none'`; the fetch
demo is a visibly separate route with an explicit HTTPS transport policy.
The full browser run also passed all 22 Chromium/Firefox tests. WebKit remains
unavailable because the installed Playwright WebKit fails context setup with
`Unknown setting: PushAPIEnabled`; this is an environment limitation, not a
passing WebKit result.

## R03

The isolated package bin `./cli/index.mjs` implements all six commands. The
focused suite runs every command in JSON and table mode from the repository
build and from the packed tarball, with stdin, policy refusal, malformed and
unsupported inputs, privacy defaults, terminal-control handling, source,
existing-destination, same-file, hardlink, and symlink refusal. `cli:check`
proves that core bundles do not import CLI or Node-only CLI modules. Atomic
destination writes use a private sibling temporary and rename after successful
mutation and reparse verification.

The complete repository check passed with 51 test files and 554 tests, 89.69%
statement coverage, 75.27% branch coverage, 95.49% function coverage, build,
typecheck, lint, generated-artifact checks, package smoke, examples, publint,
baseline verification, and `git diff --check`.
