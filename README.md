# Civic Asset Audit Walker

[![Live GitHub Pages](https://img.shields.io/badge/live-GitHub%20Pages-006b57)](https://baditaflorin.github.io/civic-asset-audit-walker/)
[![Mode](https://img.shields.io/badge/deployment-Mode%20A%20static-d85c27)](https://baditaflorin.github.io/civic-asset-audit-walker/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Live site: https://baditaflorin.github.io/civic-asset-audit-walker/

Repository: https://github.com/baditaflorin/civic-asset-audit-walker

Support: https://www.paypal.com/paypalme/florinbadita

Civic Asset Audit Walker is an offline-first GitHub Pages PWA for volunteers who place cheap AprilTag stickers on streetlights, benches, bins, signs, and other neighborhood assets, then scan and report conditions without waiting for a city audit program.

![Civic Asset Audit Walker screenshot](https://raw.githubusercontent.com/baditaflorin/civic-asset-audit-walker/main/docs/media/screenshot.png)

## Quickstart

```bash
npm install
make install-hooks
make dev
make test
make smoke
```

## What Works in v0.3.0

- Guided AprilTag 36h11 sticker generation, centered camera scan flow, and printable tag sheet.
- Offline report creation with IndexedDB persistence plus durable draft and settings state.
- Leaflet/OpenStreetMap report map with repository and PayPal links visible from the map.
- Multi-path import for files, drag-drop, pasted text, clipboard text, public URLs, and a built-in sample dataset.
- JSON and CSV report export plus full workspace backup/restore and share links.
- Manual WebRTC offer/answer sync for anonymous peer report exchange, with in-app step guidance.
- DuckDB-WASM aggregate query behind a user action, with TypeScript fallback.
- PWA shell, service worker, and GitHub Pages build output in `docs/`.

## Architecture

```mermaid
C4Context
  title Civic Asset Audit Walker - Mode A
  Person(volunteer, "Volunteer", "Walks a neighborhood and audits tagged assets")
  System_Boundary(pages, "GitHub Pages static site") {
    System(app, "React PWA", "Camera scan, reports, workspace restore, map, sync, exports")
    SystemDb(indexeddb, "IndexedDB", "Local reports")
    SystemDb(localstate, "localStorage", "Draft, settings, activity history")
    System_Ext(wasm, "Lazy browser modules", "OpenCV.js CDN, DuckDB-WASM CDN/local package")
  }
  System_Ext(osm, "OpenStreetMap tiles", "Public raster tiles")
  Rel(volunteer, app, "Uses in browser")
  Rel(app, indexeddb, "Stores reports")
  Rel(app, localstate, "Stores workspace state")
  Rel(app, wasm, "Loads on demand")
  Rel(app, osm, "Fetches map tiles")
```

Detailed architecture: docs/architecture.md

ADRs: docs/adr/

Deploy guide: docs/deploy.md

Privacy: docs/privacy.md

Postmortem: docs/postmortem.md

Phase 2 Substance postmortem: docs/postmortem-phase2-substance.md

Phase 3 Completeness postmortem: docs/postmortem-phase3.md

## Commands

```bash
make help
make dev
make build
make pages-preview
make test
make smoke
make lint
make fmt
make release VERSION=v0.3.0
```

## Deployment

The project is Mode A: static GitHub Pages only. `make build` writes the Pages-ready app into `docs/`, preserving documentation under `docs/adr/`. GitHub Pages serves `main` branch `/docs`.

Public URL: https://baditaflorin.github.io/civic-asset-audit-walker/

## Security

No runtime secrets are required. Real `.env*` files are ignored. Local hooks run `gitleaks protect --staged`.

## Limitations

- URL import only works when the remote source allows browser cross-origin fetches. If not, use file upload or paste rendered text.
- WebRTC sync remains manual. The app now explains the order of operations, but it does not use a signaling server.
- Share links are practical for small workspaces. Larger workspaces should use the full workspace backup file instead.
