# 0004 - Static Data Contract

- Status: Accepted
- Date: 2026-05-08

## Context

Mode A has no generated city dataset or server API. The app still needs a stable data contract for reports exchanged through exports and WebRTC.

## Decision

Use schema version `1` for local and peer-exchanged reports:

- `id`: random UUID.
- `assetTag`: canonical tag such as `CAW-36H11-000123`.
- `tagFamily`: default `tag36h11`.
- `tagId`: numeric AprilTag id when known.
- `assetKind`: streetlight, bench, trash bin, bus stop, crossing, pothole, sign, tree, or other.
- `condition`: good, watch, needs repair, unsafe, or missing.
- `lat`, `lng`, `accuracy`: optional browser geolocation.
- `notes`: optional free text, locally entered.
- `createdAt`, `updatedAt`: ISO-8601 timestamps.

## Consequences

The contract works over JSON export, CSV export, WebRTC messages, and DuckDB aggregation without an API server.

## Alternatives Considered

Parquet and SQLite artifacts were rejected for v1 because there is no build-time data pipeline yet.
