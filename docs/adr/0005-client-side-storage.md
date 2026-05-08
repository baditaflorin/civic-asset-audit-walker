# 0005 - Client-Side Storage Strategy

- Status: Accepted
- Date: 2026-05-08

## Context

Reports must survive refreshes and field use without accounts or connectivity.

## Decision

Store reports, app settings, and peer metadata in IndexedDB using the `idb` library. Use localStorage only for small UI preferences if needed.

## Consequences

IndexedDB gives durable browser storage and can hold more reports than localStorage. Exports are still required for user-controlled backups.

## Alternatives Considered

OPFS was considered for larger binary assets, but v1 does not store photos or local map extracts.
