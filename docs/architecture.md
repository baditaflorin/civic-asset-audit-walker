# Architecture

## Context

```mermaid
C4Context
  title Civic Asset Audit Walker
  Person(volunteer, "Volunteer", "Scans tagged civic assets and records conditions")
  Person(peer, "Nearby volunteer", "Exchanges anonymous reports peer-to-peer")
  System_Ext(githubPages, "GitHub Pages", "Static hosting from main:/docs")
  System_Ext(osm, "OpenStreetMap", "Public raster tile service")
  Rel(volunteer, githubPages, "Loads PWA")
  Rel(peer, githubPages, "Loads PWA")
  Rel(githubPages, osm, "Fetches map tiles")
```

## Container

```mermaid
C4Container
  title Static Pages Boundary
  Person(volunteer, "Volunteer")
  Container_Boundary(pages, "https://baditaflorin.github.io/civic-asset-audit-walker/") {
    Container(app, "React/Vite PWA", "TypeScript", "Audit workspace, scanner, map, sync, exports")
    ContainerDb(indexeddb, "IndexedDB", "Browser storage", "Saved reports")
    ContainerDb(localstate, "localStorage", "Browser storage", "Draft, settings, activity, share restore")
    Container(scanner, "Guided scanner", "AprilTag + OpenCV.js", "Camera capture and tag matching")
    Container(analytics, "Aggregate engine", "DuckDB-WASM", "Local SQL summaries")
    Container(sync, "Peer sync", "WebRTC DataChannel", "Manual offer/answer report exchange")
  }
  System_Ext(cdn, "jsDelivr", "OpenCV.js and DuckDB-WASM runtime assets")
  System_Ext(osm, "OpenStreetMap tiles")
  Rel(volunteer, app, "Uses")
  Rel(app, indexeddb, "Reads/writes")
  Rel(app, localstate, "Reads/writes")
  Rel(app, scanner, "Lazy loads")
  Rel(app, analytics, "Lazy loads")
  Rel(app, sync, "Starts peer sessions")
  Rel(scanner, cdn, "Loads OpenCV.js on demand")
  Rel(analytics, cdn, "Loads DuckDB runtime bundles on demand")
  Rel(app, osm, "Fetches tiles")
```

## Module Boundaries

- `src/features/scanner`: AprilTag rendering, centered tag matching, and OpenCV.js loader.
- `src/features/reports`: validation, report form, imports, exports, and local list.
- `src/features/workspace`: settings/history surface for backup, sharing, and reset flows.
- `src/features/map`: Leaflet/OpenStreetMap report map.
- `src/features/sync`: WebRTC manual signaling and report exchange.
- `src/features/analytics`: local aggregate fallback and DuckDB-WASM SQL aggregate.
- `src/lib`: schemas, workspace persistence, share/snapshot helpers, merge logic, hooks, and build metadata.

## Pages Boundary

The deployed artifact is committed under `docs/`. GitHub Pages serves only static files; there is no runtime server, API, secret store, Docker container, or GitHub Actions workflow.
