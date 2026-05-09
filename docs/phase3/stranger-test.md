# Phase 3 Stranger Test

Date: 2026-05-09  
Method: fresh browser context on localhost, no preloaded storage, no code-side shortcuts

## Path exercised

1. Load the app with no prior context.
2. Import a sample dataset.
3. Save a demo-tag report.
4. Reload and confirm persistence.
5. Back up the workspace.
6. Copy a share link and open it in a fresh browser context.

## Top 3 confusion points found

1. The reports toolbar labels were too terse.
   Response: `Files` became `Import files`, `Sample` became `Load sample`, and `Read clipboard` became `Import clipboard`.
2. The scanner `Print` action did not say what it printed.
   Response: it became `Print tag`.
3. WebRTC actions used protocol language instead of task language.
   Response: `Accept offer` became `Make answer`, `Accept answer` became `Apply answer`, and the exchange order is now described inline.

## Residual friction

1. URL import still depends on the remote site allowing cross-origin fetches.
2. WebRTC sync is still a manual exchange, even though it is now guided better.

## Result

The stranger path completed without asking for outside help. The biggest remaining limits are browser-platform limits, not missing in-app pathways.
