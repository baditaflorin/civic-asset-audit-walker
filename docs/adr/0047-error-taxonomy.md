# 0047 - Error Taxonomy and Messaging

- Status: Accepted
- Date: 2026-05-09

## Context

Generic "Import failed" hides what happened and makes support impossible.

## Decision

Every import issue has severity, code, what, why, now what, and optional row number. Fatal errors stop import; recoverable errors produce partial candidates.

## Consequences

Users know whether to fix the file, review rows, or proceed with partial data.

## Alternatives Considered

Single toast errors were rejected for multi-row imports.
