# 0008 - Go Backend Project Layout

- Status: Accepted
- Date: 2026-05-08

## Context

The bootstrap instructions define Go backend layout for Modes B and C.

## Decision

Skip Go backend folders in v1. There is no `cmd/`, `internal/`, Docker image, or runtime API.

## Consequences

The repository stays focused on the static frontend. If Mode B data generation is added later, Go generators may follow the requested project layout.

## Alternatives Considered

Creating empty Go folders was rejected as misleading scaffolding.

