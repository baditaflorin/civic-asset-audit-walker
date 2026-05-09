# 0049 - Inspectability and Debug Surface

- Status: Accepted
- Date: 2026-05-09

## Context

Power users and maintainers need to see why an inference happened.

## Decision

When `?debug=1` is present, show a compact debug panel with report count, import status, latest issue count, and inference metadata. Exports always include provenance/confidence.

## Consequences

Support and fixture debugging become easier without adding telemetry.

## Alternatives Considered

Console-only debugging was rejected because production console output is intentionally minimal.
