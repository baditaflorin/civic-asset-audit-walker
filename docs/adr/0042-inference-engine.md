# 0042 - Inference Engine

- Status: Accepted
- Date: 2026-05-09

## Context

Users bring data whose meaning is obvious to a civic-tech human: `amenity=bench`, 311 street-light descriptors, `benchid`, `latitude`, `longitude`, Romanian labels, and address fields.

## Decision

Implement a deterministic rule-based inference engine for v0.2.0. It infers input shape, asset kind, condition, source ID, location, notes, and dates using transparent heuristics and domain vocabulary.

## Consequences

The first useful guess appears without setup. Later ML or libpostal-like normalization can be added only after rule-based behavior is exhausted and testable.

## Alternatives Considered

An opaque ML classifier was rejected because confidence and explainability matter more than breadth in Phase 2.
