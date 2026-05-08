# 0016 - Local Git Hooks

- Status: Accepted
- Date: 2026-05-08

## Context

The project forbids GitHub Actions but still needs repeatable quality gates and secret scanning.

## Decision

Use plain `.githooks/` wired by `make install-hooks`. Hooks run formatting checks, linting, type checks, gitleaks, tests, builds, smoke tests, and Conventional Commit validation.

## Consequences

Contributors must install hooks locally. The Makefile exposes each hook target for manual runs.

## Alternatives Considered

Lefthook was considered, but plain hooks reduce one dependency and are transparent.

