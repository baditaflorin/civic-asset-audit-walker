# 0067 State Management Convention

- Status: accepted

## Context

Reports are persisted in IndexedDB, but settings and drafts do not yet have a stable home.

## Decision

Reports remain in IndexedDB through `useAuditReports`. Workspace settings, draft state, and activity history live in versioned `localStorage`, mediated by typed helper functions and React state in `App`.

## Consequences

The app stays Mode A and gains persistence for the rest of the user workflow without conflating report records and UI preferences.

## Alternatives considered

- Move everything to IndexedDB: rejected because settings and draft state are small and do not need asynchronous transactional storage.
