# 0013 - Testing Strategy

- Status: Accepted
- Date: 2026-05-08

## Context

The project needs fast local checks because GitHub Actions are intentionally absent.

## Decision

Use Vitest for unit tests and Playwright for a headless static-site smoke test. `make test`, `make build`, `make smoke`, and `make lint` are the core gates.

## Consequences

Hooks run the same checks locally before pushes. Browser-only APIs are isolated behind testable adapters.

## Alternatives Considered

Remote CI was rejected by project constraint.

