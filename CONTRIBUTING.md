# Contributing

Thank you for improving `browser-image-metadata`. The project prioritizes bounded parsing, accurate source preservation, explicit warnings, and browser integration that never uploads a user's image.

## Local setup

Use Node.js 22 or newer, then install the locked dependencies and run the full release gate:

```sh
npm ci
npm run check
```

Target a focused test while iterating with `npx vitest run tests/<name>.test.ts`. Run `npm run check` before a pull request; it type-checks, lints, runs coverage, builds ESM and CommonJS artifacts, validates the package, installs the packed tarball into a clean consumer, and runs example smoke checks. Run `npm run test:fuzz`, `npm run test:browser`, and `npm run test:deno` before changes to parser boundaries, input handling, or browser integration.

## Code and API changes

- Keep every offset and length bounded before allocating, slicing, or decoding.
- Preserve tolerant inspection and strict mutation as separate behaviors.
- Add warnings for ambiguous or unsupported data; do not guess a value.
- Keep documented public APIs backward compatible whenever practical. When a correctness fix changes behavior, add a regression test and describe it in `CHANGELOG.md`.
- Update `README.md`, `API.md`, and `CAPABILITIES.md` when a capability changes.
- Do not add a runtime dependency to the core parser. Optional functionality belongs behind an opt-in entry point with bounded inputs and outputs.

## Fixture submissions

Fixtures are part of the security and interoperability test suite. Submit only an image you created, have explicit permission to redistribute, or that carries a compatible license. Do not submit personal photographs, location history, serial numbers, contact data, credentials, or confidential work.

For each fixture, include in the pull request:

1. its container, producing device/application and version when known;
2. license or consent and a source link when redistribution permits one;
3. SHA-256, expected dimensions, and expected metadata established independently of this package;
4. the exact behavior it exercises, including whether an independent decoder accepted it; and
5. a minimal test that references the checked-in fixture rather than generating an equivalent structure in the test itself.

Record the same provenance in `tests/fixtures/README.md`. Keep fixtures small unless their real layout is essential to the regression. Generated structural fixtures must identify their generator script and source inputs.

## Reporting problems

Use the bug report form for reproducible parser, API, documentation, or performance problems. Use the fixture form for a legally shareable interoperability sample. Report potential vulnerabilities privately according to [SECURITY.md](.github/SECURITY.md), never in a public issue.
