# 0048 - Determinism and Reproducibility

- Status: Accepted
- Date: 2026-05-09

## Context

Same input must produce same normalized output. Random IDs, locale ordering, timestamps, and map iteration order break reproducibility.

## Decision

Imported reports use deterministic UUIDs derived from source type, source ID, location, and notes. Canonical exports sort by stable keys and include schema, app version, confidence, and provenance.

## Consequences

Fixtures can assert byte-identical canonical output.

## Alternatives Considered

Using `crypto.randomUUID()` for imported rows was rejected.
