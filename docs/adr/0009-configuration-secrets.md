# 0009 - Configuration and Secrets Management

- Status: Accepted
- Date: 2026-05-08

## Context

The frontend must never contain secrets. The app also needs visible version and commit metadata.

## Decision

Use build-time public constants for version and fallback commit. Fetch the public GitHub main commit from the GitHub API when available. No secret configuration is required.

## Consequences

`.env.example` contains placeholders only. Real `.env*` files are gitignored. Public URLs for GitHub, PayPal, OSM tiles, and GitHub API are safe in frontend code.

## Alternatives Considered

Runtime configuration endpoints were rejected because Mode A has no backend.

