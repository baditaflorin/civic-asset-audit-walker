# Phase 3 Codebase Audit

Audit date: 2026-05-09  
Version audited: v0.2.1

## DRY violations

1. Import/export state messaging is spread between [src/App.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-civic-asset-audit/src/App.tsx), [src/features/reports/ReportList.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-civic-asset-audit/src/features/reports/ReportList.tsx), and [src/features/sync/WebRtcSync.tsx), creating multiple toast wording patterns for similar “imported / copied / failed” states.
2. Browser persistence is split between IndexedDB-only report storage in [src/lib/storage.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-civic-asset-audit/src/lib/storage.ts) and ad hoc component state elsewhere; there is no shared local-state boundary for settings, draft, or share state.
3. Export pathways are split across `reportsToJson`, `reportsToCsv`, and import handling in `ReportList` with no single “workspace snapshot” abstraction.

## SOLID / module-boundary issues

1. [src/features/reports/ReportList.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-civic-asset-audit/src/features/reports/ReportList.tsx) currently owns file picking, import orchestration, progress display, reset confirmation, and export controls.
2. [src/App.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-civic-asset-audit/src/App.tsx) is the only coordinator for top-level toast/status wiring; adding more workspace-level flows here will need a clearer boundary.

## Dead code / dormant code

- No source-level `TODO`, `FIXME`, `XXX`, or `HACK` markers were found in `src/` or `tests/`.
- `parseReportImport` in [src/features/reports/exportReports.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-civic-asset-audit/src/features/reports/exportReports.ts) is no longer a primary import path and should either become part of a shared snapshot boundary or be removed.

## Type-safety holes

- No `@ts-ignore` markers were found.
- No `any` types were found in application code during the baseline grep.
- Main remaining boundary risk is permissive `unknown` JSON handling inside the import engine, which is intentional but should be paired with clearer workspace snapshot validation.

## Inconsistent patterns

1. User feedback strings vary widely between panels, especially around copy/import/send flows.
2. Control states are inconsistent: some actions disable while unavailable, others stay clickable and rely on a toast after the fact.

## Real-user path test gaps

1. No end-to-end coverage for import via user-provided files.
2. No end-to-end coverage for persistence across reload.
3. No end-to-end coverage for a full backup/export/restore flow.
4. No end-to-end coverage for shareable state or deep-link restore, because neither feature exists yet.
