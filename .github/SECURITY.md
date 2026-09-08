# Security policy

## Supported versions

Security fixes are applied to the latest published release on the `main`
branch. Consumers should keep `browser-image-metadata` and their runtime on a
supported, patched version.

## Reporting a vulnerability

Please report suspected vulnerabilities privately through
[GitHub Security Advisories](https://github.com/Wbfld/image-metadata-toolkit/security/advisories/new).
Do not disclose an exploitable parser input in a public issue before a fix is
available. Include the affected version, runtime, a minimal reproducer (or a
fixture that can be shared safely), and the expected versus observed behavior.

The project will acknowledge valid reports, assess impact, and coordinate a
fix and disclosure timeline with the reporter. Do not include personal or
confidential image metadata in a report.

## Security design

The parser is local-only and has no network-capable runtime dependency. Input,
metadata, segment, IFD, nesting, string, chunk, warning, and decompression
budgets are enforced before allocation or decoding. JPEG and PNG redaction is
atomic when the structure needed for safe surgery is malformed.
