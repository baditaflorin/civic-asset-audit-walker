# 0071 Stranger Test Findings And Response

- Status: accepted

## Context

Phase 3 required a fresh-user pass on the real app, not just code inspection.

## Decision

The stranger test focused on loading sample data, backing up a workspace, restoring shared state, and understanding peer sync without prior project context. The top fixes shipped in the same pass were clearer import labels, clearer WebRTC button labels, and an honest scanner print label.

## Consequences

The app speaks more directly about what each action will do, reducing wrong-clicks and dead-end exploration.

## Alternatives considered

- Treat wording as polish and defer it: rejected because misleading labels are a completeness bug, not a cosmetic one.
