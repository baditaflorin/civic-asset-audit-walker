# Phase 3 Feature Claims Audit

Audit date: 2026-05-09  
Version audited: v0.2.1

| Claim source | Claim                                                                                  | Status            | Notes                                                                                         |
| ------------ | -------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------- |
| README       | Guided AprilTag sticker generation and centered camera scan flow                       | shipped fully     | Demo generation and scan flow exist.                                                          |
| README       | Offline report creation with IndexedDB persistence                                     | shipped partially | Saved reports persist, but unsaved draft state does not.                                      |
| README       | Leaflet/OpenStreetMap report map with repository and PayPal links visible from the map | shipped fully     | Verified in app and live Pages.                                                               |
| README       | JSON and CSV export/import for volunteer-controlled backups                            | shipped partially | Report-level import/export works, but there is no full-workspace backup/restore.              |
| README       | Manual WebRTC offer/answer sync for anonymous peer report exchange                     | shipped partially | Transport works, but the panel lacks guidance and stronger control states.                    |
| README       | DuckDB-WASM aggregate query behind a user action, with TypeScript fallback             | shipped fully     | Verified in code and UI.                                                                      |
| README       | PWA shell, service worker, and GitHub Pages build output in `docs/`                    | shipped fully     | Verified by build and live Pages output.                                                      |
| README       | Quickstart reaches a working local site in five commands                               | shipped partially | Developer quickstart is accurate, but no user-facing “bring your own data” quickstart exists. |

Highest-priority mismatches:

1. “Volunteer-controlled backups” overstates the current export/import story because only report rows round-trip cleanly.
2. “Offline report creation” is true for saved reports but not for in-progress report drafts.
3. WebRTC sync is technically shipped but still reads like a low-context operator tool rather than a stranger-usable flow.
