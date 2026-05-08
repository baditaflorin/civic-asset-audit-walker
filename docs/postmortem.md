# Postmortem

Date: 2026-05-08

Version: v0.1.0

Live site: https://baditaflorin.github.io/civic-asset-audit-walker/

Repository: https://github.com/baditaflorin/civic-asset-audit-walker

## What Was Built

- Public GitHub repository under `baditaflorin/civic-asset-audit-walker`.
- GitHub Pages deployment from `main:/docs`.
- React/Vite/TypeScript PWA with local IndexedDB report storage.
- Guided AprilTag 36h11 sticker rendering and centered camera scan path.
- Leaflet/OpenStreetMap report map with visible GitHub and PayPal links.
- Report form, local report list, JSON/CSV export, and JSON import.
- Manual WebRTC offer/answer peer sync for anonymous report exchange.
- DuckDB-WASM aggregate panel with TypeScript fallback.
- Local hooks for pre-commit, commit-msg, and pre-push.
- ADRs, README, governance files, privacy doc, deploy doc, architecture doc, screenshot, and smoke tests.

## Was Mode A Correct?

Yes. Mode A was the right choice for v0.1.0.

The useful first version does not require auth, a central database, server secrets, or a runtime API. IndexedDB handles field persistence, WebRTC handles volunteer-to-volunteer exchange, and GitHub Pages handles public distribution.

The main caveat is that fully native `libosmscout` and `libpostal` do not fit this static v1 without a serious WASM/data-artifact effort. If the project needs offline vector maps, address normalization, or neighborhood-wide baseline data, the next honest step is Mode B with prebuilt static artifacts rather than Mode C.

## What Worked

- GitHub Pages from `main:/docs` worked immediately and stayed simple.
- Lazy-loading kept the initial app shell small while preserving OpenCV.js and DuckDB-WASM paths.
- Local hooks caught formatting and build-output drift before release.
- Manual WebRTC signaling fit the no-backend constraint.
- The GitHub public API solved the "show current commit" requirement without creating a commit-hash build loop.

## What Did Not Work

- Bundling OpenCV.js directly produced a roughly 10 MB chunk. It had to move to lazy CDN script loading.
- Embedding `git rev-parse HEAD` into generated assets made `docs/` change after every commit. The page now fetches the live commit from GitHub instead.
- Prettier initially tried to format generated Pages assets. `.prettierignore` now excludes those files.

## What Surprised Us

- GitHub Pages could briefly report the new HTML before all hashed assets were available during a build. Polling the actual asset and `version.json` was a better readiness check than only fetching `/`.
- The newer React hooks lint set is more opinionated than the older baseline and needed explicit project tuning.

## Accepted Tech Debt

- The AprilTag scanner is a guided centered-frame matcher, not a full arbitrary-perspective detector.
- OpenCV.js is loaded from jsDelivr, so first camera use depends on network unless it is already cached.
- WebRTC sync uses manual copy/paste signaling and public STUN, not a resilient group signaling layer.
- Leaflet uses online OSM raster tiles; there is no offline map extract in v0.1.0.
- There is no automated two-browser WebRTC integration test yet.

## Next 3 Most Valuable Improvements

1. Add a real perspective-correct AprilTag detector path using OpenCV contours and homography.
2. Introduce Mode B static artifacts for neighborhood OSM extracts, optional offline tiles, and libpostal-normalized address metadata.
3. Add a QR-based WebRTC signaling flow so phones can pair without copying long SDP blobs.

## Time Spent vs Estimate

Initial estimate for a polished static v1: 4-6 focused engineering hours.

Actual bootstrap session: about 2 hours, including repository creation, Pages setup, implementation, tests, docs, public verification, and release prep.
