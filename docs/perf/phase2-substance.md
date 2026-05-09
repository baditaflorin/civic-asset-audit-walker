# Phase 2 Substance Performance Notes

Date: 2026-05-09

## Budgets

- Inputs under 1 MB: useful preview in under 1 second median.
- Inputs over 5 MB: progress visible within 300ms and cancel available.
- Import inference yields every 250 rows so the browser can paint and handle cancellation.

## Measured Fixture Results

The real-data fixture suite runs in Vitest/JSDOM and exercises 10 fixtures, including JSON, CSV, empty input, partial JSON, OSM, Socrata-like 311, mojibake text, Romanian spreadsheet labels, embedded CSV newlines, and a larger repeated 311 sample.

Latest local run:

- 10/10 real-data fixtures passed.
- 13 total unit/fixture tests passed.
- Full Vitest run duration: about 1-3 seconds on the local development machine.
- Verbose real-data fixture run: median 4 ms, p95 19 ms, worst 19 ms.
- Import operations for all committed fixtures complete below the 1 second budget.

## Hot Paths

1. CSV parsing for large files.
2. JSON salvage for truncated files.
3. Row-by-row civic inference.

## Mitigations

- Parser and inference are deterministic and allocation-light.
- Long row loops yield every 250 rows.
- Large file imports surface cancellable progress from the existing Import control.
