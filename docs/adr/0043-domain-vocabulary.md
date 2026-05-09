# 0043 - Domain Vocabulary and UI Language

- Status: Accepted
- Date: 2026-05-09

## Context

V1 errors speak in generic import terms. Phase 2 needs domain terms a volunteer understands.

## Decision

Use civic vocabulary in messages: asset, report, row, location, source ID, 311 request, OSM node, stale check date, duplicate request, and condition. Avoid exposing internal parser jargon in user-facing copy.

## Consequences

Import errors and warnings are actionable and tied to the user's data.

## Alternatives Considered

Raw exception messages were rejected.
