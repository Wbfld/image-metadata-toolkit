# Community response targets

These are maintainer response targets for triage, not a guarantee of a fix or
release date. Report privately through the security channel when a report
contains an exploit or secret.

| Report class | Initial acknowledgement target | Triage target | Handling |
| --- | ---: | ---: | --- |
| Security/privacy | 2 business days | 5 business days | Private disclosure, bounded reproducer, severity and mitigation record |
| Corruption/data loss | 3 business days | 7 business days | Preserve the source, add a deterministic regression case, assess fail-closed behavior |
| Compatibility regression | 5 business days | 10 business days | Identify the public boundary and compare the smallest affected fixture |
| Ordinary feature/fixture | 7 business days | 15 business days | Confirm scope, provenance, demand, and an isolated contributor ticket |

Targets are measured from a complete report with reproducible input identity.
Incomplete or unsafe submissions may be acknowledged with a request for a
scrubbed fixture and provenance record before technical triage.
