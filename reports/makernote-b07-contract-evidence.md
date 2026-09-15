# B07 MakerNote plugin contract evidence

- Package: `browser-image-metadata@2.0.0-alpha.3`
- Contract fixture: 8 bytes, SHA-256 `5c1bb6fbb5e2af3cb9ee93f0ffd4d098efb9b66f62b0ee27b1ae7bdf30d0db67` (repository-authored contract bytes; no third-party bytes copied)
- Explicit per-operation plugin collection: true
- Global registry: false
- Bounded read context: true
- Unknown and low-confidence results remain opaque: true
- Plugin exception text suppressed: true
- Network access: false

## Executed cases

| Case | Result | Evidence |
| --- | --- | --- |
| decoded | detected-decoded | complete=true; fieldCount=1 |
| unknown | unknown | complete=false; opaqueRangeCount=1 |
| low-confidence | low-confidence | complete=false |
| bounded-read-rejection | rejected | diagnosticCodes=["UNSAFE_RANGE"] |
| thrown-plugin | unknown | diagnosticCodes=["PLUGIN_THROWN","UNKNOWN_NOTE"]; rawErrorSuppressed=true |
| encrypted | encrypted | complete=false |
| obfuscated | obfuscated | complete=false |
| malformed | malformed | complete=false |
| aborted | aborted | complete=false |
| limit-exceeded | limit-exceeded | complete=false |
| order-independence | deterministic | equalResults=true; suppliedCollectionsUnchanged=true |
