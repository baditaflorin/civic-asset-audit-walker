# Phase 2 Substance Postmortem

Date: 2026-05-09

Version: v0.2.0

Live site: https://baditaflorin.github.io/civic-asset-audit-walker/

Repository: https://github.com/baditaflorin/civic-asset-audit-walker

## Real-Data Pass Rate

Before Phase 2 Substance: 1/10 fixtures completed the primary import flow without manual reshaping.

After Phase 2 Substance: 10/10 fixtures pass at the import engine and app import-control level.

| Fixture                  | Before                       | After                                                              |
| ------------------------ | ---------------------------- | ------------------------------------------------------------------ |
| Clean v1 JSON export     | Mostly passed, not canonical | Passed with canonical deterministic export                         |
| Empty file               | Generic failure              | Passed with actionable `empty_input`                               |
| Truncated v1 JSON        | Failed all-or-nothing        | Passed with `partial_json` salvage                                 |
| NYC bench inventory      | Failed                       | Passed with bench/source/location inference                        |
| OSM benches              | Failed                       | Passed with OSM ID/location/stale-date inference                   |
| OSM waste basket CSV     | Failed                       | Passed with CSV sniffing and trash-bin inference                   |
| Chicago 311 streetlights | Failed                       | Passed with streetlight/needs-repair/duplicate inference           |
| NYC 311 mojibake         | Failed                       | Passed with encoding repair and missing-location warning           |
| Romanian volunteer sheet | Failed                       | Passed with BOM, semicolon, decimal comma, Romanian label handling |
| Larger 311 CSV sample    | Failed at format boundary    | Passed deterministically                                           |

## Top 5 Logic Gaps Closed

1. App-native JSON only: closed with JSON/CSV/text structure detection.
2. No domain inference: closed with rule-based civic inference for OSM, 311, municipal benches, and volunteer sheets.
3. All-or-nothing import: closed with row-level issues and partial JSON salvage.
4. No confidence/provenance: closed with per-report confidence, reasons, source type, source ID, row number, warnings, and suggestions.
5. No performance contract: improved with progress phases, cancellation path, periodic yielding, cache, and fixture performance assertions.

## Promised Smart Behaviors

- Useful first guess on import: works on all 10 fixtures.
- Infer asset kind, condition, source ID, and location: works where source data contains enough evidence; missing location is explicitly flagged.
- Degrade row-by-row: works for empty, partial, malformed, and low-confidence cases.
- Confidence and provenance in UI/export: implemented in local report rows, canonical JSON, CSV, and debug mode.
- Large import honesty: progress/cancel path is implemented; true multi-megabyte municipal export testing is still open.

## Determinism

All 10 fixtures pass deterministic canonical-output tests.

Imported rows use deterministic UUIDs derived from source type, source ID, location, and notes. Canonical JSON output sorts reports by stable keys and omits generated timestamps.

## Performance

Verbose real-data fixture run:

- Median: 4 ms.
- p95: 19 ms.
- Worst: 19 ms.
- All sub-1 MB fixtures are asserted under 1 second.

These numbers are for committed fixtures in Vitest/JSDOM. Browser testing with true multi-megabyte city exports remains a Phase 3 scale check.

## Surprises

- The biggest "toy" failure was not scanner accuracy; it was that import implied civic-data understanding while only accepting app-native JSON.
- Truncated JSON salvage was more valuable than expected because many real transfers fail halfway but still contain complete objects.
- Encoding repair needed to happen before JSON parsing, otherwise mojibake became normalized into valid-but-wrong text too late.

## Still Open: 5 Most Valuable Substance Improvements

1. True Web Worker import path for multi-megabyte files instead of cooperative yielding on the main thread.
2. More complete condition vocabulary for Romanian civic notes and 311 descriptors.
3. A review queue for low-confidence imported reports before saving.
4. QR-based WebRTC signaling and deterministic peer-sync fixture tests.
5. Full perspective-correct AprilTag detection rather than centered guided matching.

## Honest Take

The app no longer feels like a toy at the import/data-understanding layer. A stranger can bring OSM exports, 311 records, municipal bench rows, or a messy volunteer sheet and get useful candidate reports immediately.

It still feels toy-like in two specific ways: camera scanning is guided rather than truly robust to arbitrary perspective, and large-file import has a progress/cancel path but not a dedicated worker. Those are the next real substance targets.
