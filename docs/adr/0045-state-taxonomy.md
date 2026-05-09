# 0045 - State Taxonomy and State Machine

- Status: Accepted
- Date: 2026-05-09

## Context

Import can now be idle, reading, parsing, inferring, partially successful, failed, cancelling, or cancelled.

## Decision

Document reachable states in `docs/phase2-substance/states.md` and make every state have a user-actionable exit. Repeated import clicks are ignored while one import is in progress; cancellation uses `AbortController`.

## Consequences

No half-imported or stuck UI states should be reachable.

## Alternatives Considered

Letting browser file reads race was rejected.
