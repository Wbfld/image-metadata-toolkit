# Publishing browser-image-metadata

The public package identity is `browser-image-metadata` everywhere users install,
import, search, and read documentation. `image-metadata-toolkit` is the current
GitHub repository slug only; it is not a second npm name. Keep that distinction
explicit until a repository rename is separately approved.

Releases use npm trusted publishing so npm obtains provenance through GitHub Actions OIDC instead of a long-lived registry token.

## One-time npm setup

In npm's package settings, add this repository as a trusted publisher with repository `Wbfld/image-metadata-toolkit`, workflow `release.yml`, and no environment unless the repository later protects a named environment.

Grant the workflow `id-token: write` permission. Keep npm publishing out of pull-request workflows. The release workflow runs package, fuzz, Deno, and Chromium/Firefox/WebKit gates before `npm publish --provenance`.

## Cutting a release

Follow [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md) from a clean checkout. In particular, confirm `CHANGELOG.md`, the version in `package.json`, capability documentation, and examples describe the shipped behavior. The release tag must be exactly `v<package-version>`; the workflow verifies this before running its package gate.

The workflow intentionally has no fallback npm token. If trusted publishing is not configured, it fails before publication rather than silently using a maintainer credential.

See npm's [trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/) for current registry-side setup and supported GitHub Actions requirements.
