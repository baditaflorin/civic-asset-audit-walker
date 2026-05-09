# Phase 2 Substance Plan

Date: 2026-05-09

Scope: deepen the existing scanner/import/report/map/export/sync surface without changing Mode A or adding a backend.

## Ranked Substance Items

1. A1 - Fuzz parser with 10 real fixtures and 5 synthetic edge cases.
2. B8 - Useful first guess immediately after import.
3. B6 - Auto-detect input structure: v1 JSON, Socrata JSON, OSM JSON/CSV, generic CSV, field note text.
4. B7 - Auto-classify asset kind, condition, source ID, location, and notes.
5. B9 - Normalize formats by default: BOM, CRLF, NBSP, mojibake, decimal commas, coordinates, dates.
6. C13 - Recognize common civic shapes: OSM nodes, 311 requests, municipal bench inventories, volunteer sheets.
7. C15 - Bake in civic data conventions: delimiter sniffing, semantic OSM tags, 311 descriptors, spreadsheet safety.
8. C12 - Domain-aware validation and warnings.
9. D16 - Confidence scores on inferred asset kind, condition, location, tag/source ID, and overall report.
10. D18 - Surface anomalies: missing coordinates, duplicate/open 311 status, stale OSM check dates, malformed rows.
11. D17 - Suggest fixes for recoverable issues.
12. H32 - Actionable errors with what/why/now what.
13. H33 - Validate at input boundaries and report row-local failures.
14. H34 - Explicit recoverable vs fatal import errors.
15. E22 - Stable human-readable source IDs and deterministic UUIDs.
16. E21 - Lossless canonical state round-trip for app-native exports.
17. I35 - Deterministic normalized output.
18. I38 - Export provenance and confidence metadata.
19. I37 - Debug surface via `?debug=1`.
20. F24 - Enumerate reachable states.
21. F25 - No stuck states: every import state has an exit.
22. F27 - Concurrency safety: repeated imports and cancellation are defined.
23. G28 - Profile real-data inputs and document before/after.
24. G31 - Cache derived aggregate/import summaries where input hash is unchanged.
25. A2 - Encoding and format variants documented and normalized.
26. A3 - Huge input budget and tests.
27. A4 - Partial input recovery.
28. A5 - Adversarial input handling.

## Pass-Rate Target

Before: 1/10 fixtures pass the primary flow without manual setup.

Target after Phase 2 Substance: at least 7/10 fixtures produce useful candidate reports with confidence/provenance and actionable row-level failures.
