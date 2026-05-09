# 0066 Error Handling Convention

- Status: accepted

## Context

Panel messages are inconsistent and often assume the user already knows the workflow.

## Decision

User-facing errors must explain what failed and what to do next in domain language. Actions that are unavailable should disable when possible; otherwise they must produce a corrective toast.

## Consequences

Stranger users get fewer dead-end interactions and clearer recovery paths.

## Alternatives considered

- Keep generic toasts: rejected because they are the main bridge between hidden browser APIs and the user.
