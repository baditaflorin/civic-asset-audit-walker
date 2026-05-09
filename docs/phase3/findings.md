# Phase 3 Findings

Audit date: 2026-05-09  
Version audited: v0.2.1

## Top 5 usability gaps

1. A stranger can save reports, but cannot save and restore their whole workspace state, including draft and settings.
2. Import is single-file and hidden behind one control, with no drag-drop, paste, clipboard, or URL path.
3. The app has no first-class settings surface, so several behaviors that should be explicit remain hard-coded.
4. WebRTC sync works technically but asks the user to already understand the offer/answer dance.
5. There is no share-link or deep-link story, so collaboration still depends on manual files and copied SDP blobs.

## Top 5 half-baked features

1. Report backup/restore: finish as full workspace snapshots.
2. Import control: finish as a multi-path import surface.
3. Reset behavior: finish as an explicit, configurable workspace action.
4. WebRTC sync guidance: finish with clearer state and action labels.
5. Print/export pathway: finish as a workspace-level action instead of a scanner-only button.

## Top 5 codebase pain points

1. No shared workspace-state boundary for settings, drafts, share state, and action history.
2. `ReportList` owns too many responsibilities.
3. Toast/error wording is scattered across panels.
4. Export and import are report-centric, not workspace-centric.
5. E2E coverage currently checks only the demo report happy path.

## Top 5 documentation / reality mismatches

1. README backup language implies more than row-level import/export currently delivers.
2. README offline claim omits the lack of draft persistence.
3. README does not explain the current limits or operator steps for WebRTC sync.
4. README does not distinguish report export from full workspace export.
5. No explicit limitations section exists for URL/CORS import behavior.

## Fully usable means

1. A volunteer can open the site, use demo or their own pasted/uploaded data, and get reports into the app without needing dev tools.
2. A volunteer can leave the app and come back later with their reports, preferences, and in-progress draft still present.
3. A volunteer can hand their work to someone else through a file or share link and that person can restore it cleanly.
4. A volunteer can understand when to use each sync/import/export control from the interface itself.
5. Every claim in the README corresponds to something the UI and tests actually support.

## Phase 3 success metrics

1. Input audit ends with every row green or explicitly ADR’d out of scope.
2. Output audit ends with every row green or explicitly ADR’d out of scope.
3. A full workspace backup exports and restores reports, settings, and draft state with deterministic JSON.
4. At least one Playwright flow covers import, reload persistence, and restore.
5. Stranger test top 3 blockers are fixed before release.

## Out of scope

- New domain features beyond existing audit / sync / import / export workflows.
- Visual polish work unrelated to completeness.
- Replacing the Phase 2 inference engine or data model.
