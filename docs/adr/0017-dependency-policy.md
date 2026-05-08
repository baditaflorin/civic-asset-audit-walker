# 0017 - Dependency Policy

- Status: Accepted
- Date: 2026-05-08

## Context

The project should use production-ready libraries and avoid custom implementations where a proven browser library exists.

## Decision

Use mature packages for React, Vite, Tailwind, IndexedDB, Leaflet, DuckDB-WASM, OpenCV.js, zod validation, and testing. Keep custom code limited to domain-specific report merging, guided AprilTag sampling, and UI glue.

## Consequences

Dependency updates should be reviewed deliberately. `npm audit` and smoke tests are part of release hygiene.

## Alternatives Considered

Hand-rolled storage, maps, and SQL-like aggregation were rejected.
