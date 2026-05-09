# Phase 2 Substance - Real-Data Audit

Date: 2026-05-08

App version audited: v0.1.0

Mode: A, GitHub Pages static PWA

Live site: https://baditaflorin.github.io/civic-asset-audit-walker/

Repository: https://github.com/baditaflorin/civic-asset-audit-walker

## Real-World Inputs

The audit uses the v1 happy path: open app, use scanner/form/import/map/export/sync as currently exposed. "Import" in v1 means the existing JSON import button in Local reports.

Sources consulted:

- NYC City Bench Locations dataset: https://catalog.data.gov/dataset/city-bench-locations-3903f
- NYC City Bench Socrata API: https://data.cityofnewyork.us/resource/kuxa-tauh.json
- Chicago 311 Street Lights All Out dataset: https://catalog.data.gov/dataset/311-service-requests-street-lights-all-out-historical
- Chicago 311 Street Lights Socrata API: https://data.cityofchicago.org/resource/zuxi-7xem.json
- NYC 311 Service Requests API: https://data.cityofnewyork.us/resource/erm2-nwe9.json
- OpenStreetMap Overpass API: https://wiki.openstreetmap.org/wiki/Overpass_API
- OSM `amenity=waste_basket`: https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dwaste_basket

## Fixture Audit

| #   | Input                                                                                                                                                               | What v1 did                                                                                                 | What it should have done                                                                                                                                                 | Why it failed                                                                                                              | Failure mode                                                            | Manual work v1 forced                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1   | Clean v1 JSON export with 3 reports                                                                                                                                 | Imported and displayed reports. Map populated when reports had locations.                                   | Keep working. Preserve exact state and provenance on round-trip.                                                                                                         | Mostly passes, but export adds `exportedAt` and re-import changes source to `import`, so round-trip is not byte-identical. | Mostly correct, but not reproducible.                                   | User must trust hidden import/export transformations.                |
| 2   | Empty file from cancelled upload or AirDrop, `0 bytes`                                                                                                              | Generic "Import failed" toast. Existing data stayed intact.                                                 | Say the file is empty, no reports were imported, and offer to choose another file.                                                                                       | Import path assumes JSON parseable text and does not classify empty input.                                                 | Obvious but not actionable.                                             | User has to guess whether the file, app, or schema is wrong.         |
| 3   | Truncated v1 export, e.g. valid envelope cut off halfway through `reports`                                                                                          | Generic "Import failed" toast; salvages nothing.                                                            | Recover complete report objects when possible, identify the truncation point, and report skipped rows.                                                                   | Parser is all-or-nothing JSON.parse plus zod array validation.                                                             | Obvious, but throws away recoverable data.                              | User must hand-edit JSON or re-export.                               |
| 4   | NYC City Bench Locations CSV/JSON rows with `benchid`, `benchtype`, `address`, `latitude`, `longitude`                                                              | JSON API shape fails import; CSV fails import.                                                              | Infer asset kind `bench`, stable asset ID `NYC-DOT-BENCH-260`, coordinates, address, and unknown/manual condition with low confidence.                                   | App only understands its own report schema; no Socrata/CSV/schema inference.                                               | Obvious generic failure.                                                | User must manually create every bench report and copy coordinates.   |
| 5   | OSM Overpass JSON for Bucharest benches, e.g. `amenity=bench`, `backrest=yes`, `check_date=2021-02-10`, `lat`, `lon`                                                | Fails import.                                                                                               | Infer asset kind `bench`, source ID `osm:node:4151705106`, location, stale-check warning, and condition `watch` or `unknown` with low confidence.                        | No OSM tag vocabulary, no source ID mapping, no confidence model.                                                          | Obvious generic failure.                                                | User must manually type asset kind, location, and a tag.             |
| 6   | OSM Overpass CSV for Bucharest waste baskets, headers like `@type,@id,@lat,@lon,amenity,waste,bin,name`                                                             | Fails import.                                                                                               | Sniff CSV, infer `trash_bin`, stable ID `osm:node:11107980400`, location, waste subtype, and condition unknown.                                                          | No CSV dialect sniffing; no OSM `amenity=waste_basket` mapping.                                                            | Obvious generic failure.                                                | User must manually transpose each row into the form.                 |
| 7   | Chicago 311 Street Lights All Out JSON/CSV with `type_of_service_request`, `status=Open - Dup`, `street_address`, `latitude`, `longitude`                           | Fails import.                                                                                               | Infer asset kind `streetlight`, condition `needs_repair`, duplicate/open status anomaly, address, location, source request ID.                                           | No 311 vocabulary, no status/descriptor-to-condition mapping, no duplicate semantics.                                      | Obvious generic failure.                                                | User must decide condition and manually dedupe.                      |
| 8   | NYC 311 Street Light Condition JSON with `descriptor=Street Light Lamp Dim`, no coordinates in sampled row, and mojibake in text (`â`)                              | Fails import.                                                                                               | Normalize encoding, infer `streetlight`, condition `needs_repair`, preserve request ID, flag missing coordinates, keep text readable.                                    | No encoding repair, no partial-location handling, no 311 descriptor mapping.                                               | Obvious generic failure.                                                | User must clean text and decide whether unmapped records are usable. |
| 9   | Volunteer spreadsheet CSV from a local group: UTF-8 BOM, semicolon delimiter, Romanian labels, decimal commas, embedded newline in notes, formula-looking note text | Fails import.                                                                                               | Detect delimiter/encoding, normalize labels like `bancă` to bench, parse decimal comma coordinates, treat spreadsheet formulas as inert text, and surface row anomalies. | No CSV parser, no locale-aware coordinate parsing, no Romanian civic vocabulary, no formula-injection policy.              | Obvious generic failure; could become unsafe if exported naively later. | User must reformat the sheet into v1 JSON by hand.                   |
| 10  | Large real 311 CSV export, tens of thousands of rows                                                                                                                | Not accepted by import; if converted to v1 JSON, import would parse in memory with no progress/cancel path. | Stream or worker-parse, show progress after 300ms, allow cancel, sample preview first, and avoid blocking the UI.                                                        | Import path is synchronous whole-file parse and whole-array validation.                                                    | Obvious at format boundary; likely stuck-state at scale.                | User must downsample externally and hope the browser survives.       |

## Top 5 Logic Gaps

1. V1 only ingests its own JSON schema; real civic data arrives as Socrata CSV/JSON, OSM Overpass CSV/JSON, spreadsheets, and field notes.
2. There is no domain inference layer for asset kind, condition, stable source ID, coordinates, status, or duplicate semantics.
3. Import is all-or-nothing. One bad row, empty file, or truncation gives a generic failure and salvages nothing.
4. No confidence or provenance exists. The app cannot say "this is probably a streetlight outage from a 311 descriptor, but location is missing."
5. Large inputs have no performance contract: no worker, progress, cancellation, streaming, or documented size cliff.

## Top 3 Intuition Failures

1. "Import" looks like it should accept civic data, but it only accepts Civic Asset Audit Walker JSON.
2. Rows that already contain obvious location and asset-type fields still require manual form entry.
3. Export and re-import are not a lossless canonical state round-trip because metadata changes and provenance is flattened.

## Top 3 "Feels Stupid" Moments

1. The user has to tell the app that `amenity=bench` is a bench.
2. The user has to copy latitude and longitude from data that already has latitude and longitude.
3. The user has to choose "needs repair" for rows whose descriptor already says lights are out, dim, missing, or broken.

## What "Smart" Means for This Product

1. Pasting or importing civic asset data should immediately produce a candidate report preview with inferred asset kind, condition, location, stable source ID, and confidence.
2. OSM tags, 311 complaint descriptors, municipal asset fields, and common volunteer spreadsheet labels should map into the app's report schema without setup.
3. Bad inputs should degrade row-by-row: salvage valid records, explain skipped records, and never fail the entire import silently.
4. Every inferred field should carry confidence and provenance through the UI and export.
5. Large imports should stay responsive, show progress, and be cancellable.

## Phase 2 Substance Success Metrics

1. At least 7 of the 10 real-data fixtures produce a useful candidate report preview with no manual configuration.
2. 100% of fixtures avoid crashes and stuck states.
3. 100% of import failures explain what failed, why in civic-domain terms, and the next step.
4. 100% of inferred asset kind, condition, location, and source ID fields include confidence and provenance.
5. Same input plus same settings produces byte-identical canonical normalized output for all 10 fixtures.
6. Inputs up to 1 MB produce a useful preview in under 1 second median on local test hardware.
7. Inputs above 5 MB show progress within 300ms and provide cancellation.
8. Round-trip export to re-import preserves canonical report state, source IDs, confidence, and provenance.

## Explicit Out of Scope

- No backend, auth, central database, or architecture escalation from Mode A.
- No new product surface area beyond making current scanner, import, report, map, aggregate, export, and sync logic smarter.
- No visual polish, theme work, command palette, landing page, or marketing assets.
- No automated image-based defect detection.
- No municipal admin dashboard.
- No global unattended aggregation network.
- No full offline vector-map/libpostal pipeline in this substance pass; that would be a separate Mode B decision.
- No Phase 3 polish work until the real-data pass rate and failure quality improve.
