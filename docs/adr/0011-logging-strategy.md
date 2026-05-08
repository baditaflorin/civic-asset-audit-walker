# 0011 - Logging Strategy

- Status: Accepted
- Date: 2026-05-08

## Context

Mode A has no server logs. Console noise in production hurts trust.

## Decision

Use visible UI status, error toasts, and test assertions instead of production console logging. Development-only diagnostics may use guarded console output.

## Consequences

Users see actionable errors in the app. There is no remote log collection.

## Alternatives Considered

Client log beacons were rejected because analytics and telemetry are non-goals for v1.
