# Community fixture provenance template

Copy this document for every proposed fixture. Do not submit private images,
third-party assets without redistribution permission, or a fixture whose
source chain cannot be documented. A fixture may be kept only after the
scrubber report is complete and a maintainer approves the license and scope.

## Fixture identity

- Proposed filename:
- Format/container:
- Intended isolated ticket:
- Why this fixture is needed:
- Expected metadata behavior:
- Expected malformed/security behavior, if applicable:

## Source and permission

- Original source URL or repository:
- Source revision, release, or archive identity:
- Download/retrieval date:
- License name and license URL:
- Permission to redistribute the exact bytes:
- Attribution required:
- Modifications made to the source:

## Integrity

- Original byte length:
- Original SHA-256:
- Scrubbed byte length:
- Scrubbed SHA-256:
- Scrubber command and package version:
- Scrubber report path:

## Privacy and review

- T01 audit result and coverage:
- Sensitive categories removed or intentionally retained:
- Opaque/unknown blocks and their disposition:
- Does the fixture contain personal data, locations, identifiers, prompts,
  credentials, or private workflow material? Explain the disposition.
- Reviewer and review date:
- Approval or rejection decision:

Do not put secrets, raw private values, or credentials in this form. Store
machine-readable identity and findings in the scrubber report, not in issue
comments.
