# 0007 - Data Generation Pipeline

- Status: Accepted
- Date: 2026-05-08

## Context

Mode B projects require a scheduled or local static data-generation pipeline.

## Decision

No data-generation pipeline exists in v1 because this is Mode A. `make data` is a documented no-op.

## Consequences

All reports originate from local volunteers or peer imports. A later Mode B ADR can introduce OSM extracts, libpostal normalization outputs, or release-hosted data artifacts.

## Alternatives Considered

A starter pipeline was rejected because it would imply freshness and source guarantees the v1 app does not need.
