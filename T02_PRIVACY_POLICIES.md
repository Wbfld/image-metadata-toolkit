# T02 named privacy policy presets

The seven exported presets in `PRIVACY_POLICY_PRESETS` are immutable data. Each preset has a stable ID, semantic version, inspected family list, explicit allowed and removed categories, an exact generated-field removal scope, explicitly empty family/namespace fallback scopes, opaque-data treatment, retained technical metadata, coverage requirement, failure behavior, and a changelog entry. `getPrivacyPolicy` returns the frozen definition; callers cannot mutate the policy or its nested arrays.

| Policy | Version | Intended treatment |
| --- | --- | --- |
| `share-safe` | `1.0.0` | Strict removal of all sensitive categories; unknown and opaque data block output. |
| `location-safe` | `1.0.0` | Remove exact location and embedded-preview findings while retaining declared attribution categories; unknown and opaque data block output. |
| `anonymous` | `1.0.0` | Remove identity, location, device, workflow, region, prompt, and preview findings; retain only declared technical ICC metadata. |
| `retain-rights` | `1.0.0` | Remove personal/location/workflow risk while retaining declared creator, contact, attribution, and rights-bearing metadata. |
| `publisher` | `1.0.0` | Remove personal/location/workflow risk while retaining publisher attribution and rights-related metadata. |
| `accessibility` | `1.0.0` | Remove personal and workflow risk while retaining declared accessibility fields and technical presentation metadata. |
| `forensic-preserve` | `1.0.0` | Report-only preservation policy. Findings, including opaque data, remain visible and no removal is planned. |

Policies are evaluated before mutation and again after mutation. A strict policy refuses to allocate output data when coverage is incomplete, an opaque category is not explicitly permitted, or a required exact field target cannot be resolved. A report-only policy never changes bytes. Every successful or refused sanitization result carries the exact policy ID and version in its `policy` report.

Policy rules never fall back to a whole family, namespace, or block when an exact field cannot be resolved. Duplicate findings are de-duplicated by exact field ID for planning while the audit retains all candidates and provenance. Conflicts and unknown XMP remain visible; they are not silently overwritten or classified as harmless.

The checked-in review ledger covers all 74 currently sensitive generated registry fields. Its stable hash is stored in every preset and compared against the live sensitive-field set at policy evaluation time. A newly recognized sensitive field, a stale reviewed field, or a changed ledger hash makes strict policy coverage incomplete until a maintainer explicitly reviews the field and updates the policy data and changelog. This is intentional fail-closed drift detection. The report exposes both the whole-registry hash and the reviewed sensitive-ledger hash.
