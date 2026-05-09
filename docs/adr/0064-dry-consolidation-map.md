# 0064 DRY Consolidation Map

- Status: accepted

## Context

Workspace persistence, import/export orchestration, and user feedback are split across panels.

## Decision

Create a single workspace-state boundary for settings, draft, activity history, snapshots, and share encoding. Import/export controls will call that boundary instead of inventing their own formats.

## Consequences

Round-trips and tests target one canonical snapshot contract instead of several ad hoc partial contracts.

## Alternatives considered

- Leave report-only export as the main abstraction: rejected because it cannot represent user workspace state completely.
