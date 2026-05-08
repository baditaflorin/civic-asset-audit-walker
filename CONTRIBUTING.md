# Contributing

Thanks for helping make civic asset audits easier to run from the street, not just from city hall.

## Local Setup

```bash
npm install
make install-hooks
make dev
```

## Checks

Run these before pushing:

```bash
make lint
make test
make smoke
```

## Commits

Use Conventional Commits:

```text
feat: add report import summary
fix: preserve peer report source
docs: clarify Pages deployment
```

Allowed types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ops`, `data`.

## Architecture

Read the ADRs before changing deployment, storage, sync, or heavy browser modules:

docs/adr/

Mode A is intentional. Do not add a backend, auth, server database, Docker image, or secret-bearing flow without a new ADR.

## Privacy

Avoid adding volunteer identifiers. Reports should stay anonymous and user-controlled by default.
