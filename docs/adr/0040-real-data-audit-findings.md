# 0040 - Real-Data Audit Findings and Substance Success Metrics

- Status: Accepted
- Date: 2026-05-09

## Context

V1 works for its own JSON export but fails on most real civic inputs: OSM exports, Socrata/311 records, municipal CSVs, volunteer spreadsheets, empty files, truncated files, and large files.

## Decision

Use the 10 fixtures in `test/fixtures/realdata/` as the Phase 2 grading set. The import engine must turn at least 7 into useful candidate reports without manual configuration.

## Consequences

Fixture pass rate becomes a release gate. Any regression on a fixture blocks the push unless a later ADR explains the tradeoff.

## Alternatives Considered

Curated demo-only testing was rejected because it preserves the toy failure mode.
