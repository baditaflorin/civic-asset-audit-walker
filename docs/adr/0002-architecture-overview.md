# 0002 - Architecture Overview and Module Boundaries

- Status: Accepted
- Date: 2026-05-08

## Context

The project needs a field-friendly UI with isolated concerns for scanning, reports, storage, maps, aggregation, and peer sync.

## Decision

Use a feature-oriented frontend:

- `features/scanner`: guided AprilTag capture and decoding.
- `features/reports`: report forms, validation, summaries, and CSV/JSON export.
- `features/map`: Leaflet-based local report map.
- `features/sync`: WebRTC data channel signaling and merge logic.
- `features/analytics`: DuckDB-WASM aggregation with a TypeScript fallback.
- `lib`: shared schemas, storage, build metadata, and utility functions.

## Consequences

Each feature can be tested independently and lazy-load expensive modules. Shared state stays small and flows through React hooks backed by IndexedDB.

## Alternatives Considered

A page-first layout was rejected because scanner, sync, and reporting logic need reuse across multiple panels.

