# Phase 3 Output Audit

Audit date: 2026-05-09  
Version audited: v0.2.1

| Pathway                     | Status          | Notes                                                                                                                                       |
| --------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| JSON export                 | works           | Report export exists and produces canonical JSON.                                                                                           |
| CSV export                  | works           | CSV export exists and escapes spreadsheet formulas.                                                                                         |
| Full workspace state export | not built       | There is no download that captures reports plus user settings/drafts.                                                                       |
| Copy JSON to clipboard      | not built       | Export requires a download only.                                                                                                            |
| Copy CSV to clipboard       | not built       | Export requires a download only.                                                                                                            |
| Shareable link              | not built       | No hash-state or URL-based sharing.                                                                                                         |
| Downloadable state file     | not built       | No full-state artifact to resume later.                                                                                                     |
| Print-friendly report view  | works partially | The browser can print, and scanner exposes a print button for stickers, but there is no print action for report summaries or local reports. |
| Screenshot-ready surface    | works partially | The page can be screenshotted, but there is no explicit capture/export affordance.                                                          |
| Embed code                  | out of scope    | This app is not an embeddable widget.                                                                                                       |
| API/curl-ready output       | works partially | Canonical JSON is machine-readable, but there is no one-click copy or documented example in the UI.                                         |
| Round-trip export/import    | works partially | Report JSON round-trips, but not full workspace state, draft state, or settings.                                                            |

Baseline result:

- Green: 2
- Yellow: 4
- Red: 5
- ADR/out-of-scope: 1
