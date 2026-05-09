# 0069 Type Safety At Boundaries

- Status: accepted

## Context

Workspace snapshots, URL state, clipboard text, and imported files are all untrusted boundaries.

## Decision

Every external workspace payload is parsed through `zod` schemas before use. The import engine remains the permissive boundary for messy civic source data, while workspace snapshots stay strict and deterministic.

## Consequences

The app can be forgiving about civic source formats without becoming lax about its own saved state.

## Alternatives considered

- Reuse the civic import heuristics for snapshots: rejected because internal workspace state should be exact, not inferred.
