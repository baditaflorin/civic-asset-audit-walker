# 0001 - Deployment Mode

- Status: Accepted
- Date: 2026-05-08

## Context

The app should help volunteers scan tagged civic assets, record condition reports, and share anonymous audits. The user explicitly prefers GitHub Pages whenever feasible and does not want a runtime backend unless it is genuinely necessary.

## Decision

Use Mode A: Pure GitHub Pages. The app is a static React/Vite PWA served from `main:/docs`. Camera scanning, local storage, map rendering, aggregation, and peer sync all run in the browser.

## Consequences

- There is no runtime API, Docker backend, server database, or secret-bearing service.
- Persistence uses IndexedDB on the device.
- WebRTC signaling is manual copy/paste or QR-friendly text because there is no signaling server.
- Anonymous aggregation is peer-to-peer and local-first, not a central citywide source of truth.
- Native `libosmscout` and `libpostal` are not shipped in v1 because their browser/WASM story is too heavy for a Pages-first asset budget.

## Alternatives Considered

- Mode B: useful later for prebuilt OSM extracts or address normalization artifacts, but not required for v1.
- Mode C: rejected because auth, central writes, and server secrets are non-goals for v1.

