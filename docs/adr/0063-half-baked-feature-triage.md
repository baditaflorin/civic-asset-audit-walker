# 0063 Half-Baked Feature Triage

- Status: accepted

## Context

Several Phase 2 features technically worked but still depended on operator knowledge or hidden assumptions.

## Decision

Keep and finish: import/export, backup/restore, sync guidance, reset behavior, draft persistence, sample data.  
Keep but document limits: URL import under CORS, browser print, manual WebRTC exchange.  
Do not add in Phase 3: pasted image import, folder import, embed widgets, backend sync.

## Consequences

The app gets materially more usable without widening the product surface into unrelated feature work.

## Alternatives considered

- Preserve every experimental path: rejected because hidden or half-wired affordances make the app feel less trustworthy.
