# 0012 - Metrics and Observability

- Status: Accepted
- Date: 2026-05-08

## Context

The app handles civic observations and should avoid tracking volunteers.

## Decision

Ship no analytics by default. Local counters shown in the UI are computed from the user's IndexedDB reports only.

## Consequences

There is no centralized usage dashboard and no PII collection. Public interest is measured through GitHub stars, forks, and voluntary feedback.

## Alternatives Considered

Plausible and Cloudflare Worker beacons were considered but rejected for v1.
