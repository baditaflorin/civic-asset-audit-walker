# 0015 - Deployment Topology

- Status: Accepted
- Date: 2026-05-08

## Context

Mode C requires Docker Compose and nginx. Mode A does not.

## Decision

Deploy only through GitHub Pages at `https://baditaflorin.github.io/civic-asset-audit-walker/`.

## Consequences

There is no `deploy/` directory, nginx config, Docker image, Prometheus endpoint, or server port. Deployment is a git push to `main` after building `docs/`.

## Alternatives Considered

A backend topology was rejected as unnecessary for v1.

