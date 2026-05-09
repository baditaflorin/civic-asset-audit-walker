# 0046 - Performance Budgets

- Status: Accepted
- Date: 2026-05-09

## Context

Real civic exports can be much larger than hand-entered reports.

## Decision

The budget is: under 1 MB should preview within 1 second median; above 5 MB must show progress within 300ms and be cancellable. Parser loops yield periodically and report progress.

## Consequences

Huge imports may still take time, but the UI must be honest and recoverable.

## Alternatives Considered

Blocking whole-file parsing was rejected.
