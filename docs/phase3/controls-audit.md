# Phase 3 Controls Audit

Audit date: 2026-05-09  
Baseline version: v0.2.1  
Final state: Phase 3 workspace build

| Control                     | Final status | Notes                                                                                       |
| --------------------------- | ------------ | ------------------------------------------------------------------------------------------- |
| `Open camera`               | works fully  | Opens the camera when permission is granted; demo tag remains visible as the fallback path. |
| `Scan frame`                | works fully  | Scans the current frame and reports centered tag detections.                                |
| `Use demo`                  | works fully  | Loads a deterministic demo tag into the report flow.                                        |
| `Print tag`                 | works fully  | Prints the tag/sticker page intentionally and now says so.                                  |
| Condition segmented buttons | works fully  | Update report condition correctly.                                                          |
| `Use location`              | works fully  | Attaches geolocation when available and degrades honestly when skipped.                     |
| `Save report`               | works fully  | Saves reports and works alongside durable draft persistence.                                |
| `Run DuckDB aggregate`      | works fully  | Re-runs aggregate with DuckDB-WASM behind an explicit user action.                          |
| `Create offer`              | works fully  | Generates a WebRTC offer payload.                                                           |
| `Make answer`               | works fully  | Creates a WebRTC answer from a pasted offer and is supported by in-panel guidance.          |
| `Apply answer`              | works fully  | Applies an answer to an existing offer with clearer status/error messaging.                 |
| `Send`                      | works fully  | Stays disabled until the channel is ready and then sends current reports.                   |
| `Copy local signal`         | works fully  | Copies the local signal when available.                                                     |
| `JSON` export               | works fully  | Downloads canonical JSON.                                                                   |
| `CSV` export                | works fully  | Downloads CSV.                                                                              |
| `Copy JSON`                 | works fully  | Copies canonical JSON.                                                                      |
| `Copy CSV`                  | works fully  | Copies CSV.                                                                                 |
| `Import files`              | works fully  | Opens a multi-file picker with batch import support.                                        |
| `Load sample`               | works fully  | Loads a built-in sample dataset through the same report flow.                               |
| `Import paste`              | works fully  | Imports pasted text through the same parser boundary.                                       |
| `Import clipboard`          | works fully  | Reads text directly from the clipboard with honest fallback messaging.                      |
| `Import URL`                | works fully  | Fetches public URL content and explains CORS failures.                                      |
| `Backup workspace`          | works fully  | Downloads the complete workspace snapshot.                                                  |
| `Share link`                | works fully  | Copies a hash-based workspace URL.                                                          |
| `Print reports`             | works fully  | Prints a report-focused view.                                                               |
| `Start fresh`               | works fully  | Clears reports, settings, draft, and history back to defaults.                              |
| `Clear saved reports`       | works fully  | Clears saved reports and obeys the confirmation setting.                                    |

Before:

- Green: 5
- Yellow: 11
- Red: 0

After:

- Green: 22
- Yellow: 0
- Red: 0
