# 0010 - GitHub Pages Publishing Strategy

- Status: Accepted
- Date: 2026-05-08

## Context

The live Pages URL is a first-class deliverable from the first commit. GitHub Actions are not allowed.

## Decision

Publish from `main` branch `/docs` folder. Vite builds the app into `docs/` with base path `/civic-asset-audit-walker/`. Documentation subfolders under `docs/` are preserved during builds. `docs/404.html` is generated as the SPA fallback.

## Consequences

The built frontend is committed. `.gitignore` excludes `dist/` but not `docs/`. Rollback is a normal git revert and push.

## Alternatives Considered

A `gh-pages` branch was rejected because it splits source and published artifacts. Publishing from repository root was rejected because source files would be publicly served as site files.

