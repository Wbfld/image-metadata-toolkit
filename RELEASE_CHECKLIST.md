# browser-image-metadata release checklist

The public npm brand is `browser-image-metadata`. The GitHub repository slug is
`image-metadata-toolkit`; it is not an alternate package name. Release work
must begin from a clean checkout and must not publish generated reports,
fixtures, or local credentials.

## Preflight

1. Check out the exact commit intended for release and verify the working tree:

   ```sh
   git status --porcelain --untracked-files=all
   npm run release:check
   ```

   The preflight rejects tracked or untracked changes, stale generated
   `CAPABILITIES.md`, the generated metadata registry, package/docs brand drift,
   and old package-version snippets.

2. Confirm `package.json` has the intended version, the package name remains
   `browser-image-metadata`, and the lockfile is current:

   ```sh
   npm ci
   npm run capabilities:check
   npm run registry:check
   ```

3. Review the generated capability matrix and its evidence map. Every
   affirmative capability cell must retain positive, malformed, and selection
   test evidence in `scripts/capabilities-manifest.json`.

## Verification

Run the release gate from the clean checkout:

```sh
npm run check
npm run test:fuzz
npm run test:deno
npm run test:browser
npm run benchmark -- --output artifacts/release-benchmark.json
```

Review the benchmark's semantic gates before discussing performance. Do not
copy timing or superiority claims into the README automatically.

## Version and publication

1. Update `CHANGELOG.md`, capability documentation, migration notes, and
   examples for the exact package version.
2. Create and publish the matching Git tag `v<package.version>`.
3. Create the GitHub release from that tag and allow the trusted-publishing
   workflow to run its own clean checkout and release preflight.
4. Verify the npm tarball in a clean consumer with `npm pack` or the package
   smoke test. Confirm the tarball contains only the documented public files.

The release workflow is intentionally fail-closed: a tag mismatch, capability
drift, test failure, package validation failure, browser/runtime failure, or
dirty release checkout stops publication before `npm publish --provenance`.
