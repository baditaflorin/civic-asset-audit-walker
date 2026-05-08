# 0014 - Error Handling Conventions

- Status: Accepted
- Date: 2026-05-08

## Context

Field users need clear recovery paths when camera, storage, map tiles, or peer sync fail.

## Decision

Represent recoverable failures as typed results or thrown errors caught at feature boundaries. Show concise UI messages and keep local data intact. Never crash the whole app for a single feature failure.

## Consequences

Scanner, WebRTC, DuckDB, and geolocation errors degrade to manual input, export/import, fallback aggregation, or report-without-location.

## Alternatives Considered

Global catch-and-log behavior was rejected because it hides the action the user should take next.

