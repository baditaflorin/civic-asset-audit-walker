# 0065 Module Boundaries And Dependency Direction

- Status: accepted

## Context

`App` coordinates top-level surfaces, while `ReportList` currently owns too much workflow logic.

## Decision

Keep dependency direction as `App -> feature panels -> lib helpers`. Add a workspace helper layer under `src/lib/` for snapshots, preferences, and browser persistence, and keep React components focused on UI and event wiring.

## Consequences

Completeness work stays incremental without introducing a large architectural rewrite.

## Alternatives considered

- Introduce a global store library: rejected because current complexity does not require it.
