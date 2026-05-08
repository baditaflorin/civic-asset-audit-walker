# 0006 - WASM and Heavy Browser Modules

- Status: Accepted
- Date: 2026-05-08

## Context

The product idea names OpenCV, DuckDB, libosmscout, and libpostal. GitHub Pages cannot provide custom response headers, secrets, or server-side native services.

## Decision

Lazy-load browser-appropriate heavy modules:

- OpenCV.js via `@techstark/opencv-js` for scanner preprocessing when the scan panel is used.
- DuckDB-WASM via `@duckdb/duckdb-wasm` for local aggregation when the analytics panel is used.
- AprilTag generation via `apriltag` for printable test stickers and guided scan matching.

Do not ship libosmscout or libpostal in v1. Use browser geolocation, OSM raster tiles, and explicit asset fields instead.

## Consequences

The initial app shell stays small and usable. Advanced modules load behind user actions. Native map/address parsing can return in a Mode B pipeline with prebuilt artifacts.

## Alternatives Considered

Bundling native libosmscout/libpostal WASM was rejected for v1 due size, build complexity, and GitHub Pages header constraints.

