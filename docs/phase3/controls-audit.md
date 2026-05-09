# Phase 3 Controls Audit

Audit date: 2026-05-09  
Version audited: v0.2.1

| Control                     | Status          | Notes                                                                                                                      |
| --------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `Open camera`               | works partially | Opens the camera when permission is granted, but does not expose a clearer fallback path in the same panel.                |
| `Scan frame`                | works           | Scans the current frame and reports centered tag detections.                                                               |
| `Use demo`                  | works           | Loads a deterministic demo tag into the report flow.                                                                       |
| `Print`                     | works partially | Prints the page, but the label does not explain it prints the whole browser page rather than only the sticker/report view. |
| Condition segmented buttons | works           | Update report condition correctly.                                                                                         |
| `Use location`              | works partially | Attaches geolocation or skips with a toast, but there is no manual coordinate entry.                                       |
| `Save report`               | works partially | Saves reports, but leaves no durable draft if the user reloads before saving.                                              |
| `Run DuckDB aggregate`      | works           | Re-runs aggregate with DuckDB-WASM behind an explicit user action.                                                         |
| `Create offer`              | works           | Generates a WebRTC offer payload.                                                                                          |
| `Accept offer`              | works partially | Works for valid payloads, but the UI does not explain when to use it versus `Accept answer`.                               |
| `Accept answer`             | works partially | Works only after creating an offer; there is no in-panel guidance.                                                         |
| `Send`                      | works partially | Sends current reports when the channel is open, but there is no disabled state until connected.                            |
| `Copy local signal`         | works partially | Copies text when populated, but there is no paste counterpart or clipboard fallback message.                               |
| `JSON` export               | works           | Downloads canonical JSON.                                                                                                  |
| `CSV` export                | works           | Downloads CSV.                                                                                                             |
| `Import`                    | works partially | Imports one file at a time only.                                                                                           |
| `Reset local reports`       | works partially | Two-step reset exists, but the behavior is not user-configurable and is only visible through a toast.                      |

Baseline result:

- Green: 5
- Yellow: 11
- Red: 0
