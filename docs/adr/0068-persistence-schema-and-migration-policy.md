# 0068 Persistence Schema And Migration Policy

- Status: accepted

## Context

Phase 3 adds persisted settings, draft state, history, and a full workspace snapshot format.

## Decision

All new persisted browser payloads use explicit schema versions and `zod` validation. Invalid payloads are ignored safely, and workspace snapshots restore only after schema validation.

## Consequences

The app can evolve persistence without silently corrupting or trusting stale browser state.

## Alternatives considered

- Trust raw `localStorage` JSON: rejected because it undermines restore reliability.
