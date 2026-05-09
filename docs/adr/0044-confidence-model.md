# 0044 - Confidence Model

- Status: Accepted
- Date: 2026-05-09

## Context

No silent wrongness is a non-negotiable Phase 2 constraint.

## Decision

Each inferred report carries confidence for asset kind, condition, location, asset tag/source ID, and an overall score. Confidence includes a short reason. Low-confidence fields are saved and exported rather than hidden.

## Consequences

The app can be useful without pretending certainty. Downstream users can filter or review low-confidence rows.

## Alternatives Considered

Only showing confidence in the UI was rejected because exported data must remain inspectable.
