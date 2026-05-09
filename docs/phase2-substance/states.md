# Phase 2 Substance State Taxonomy

Date: 2026-05-09

## App Load States

- `loading`: IndexedDB report read is in progress. Exit: storage resolves or errors.
- `ready-empty`: storage loaded and no reports exist. Exit: save/import/sync a report.
- `ready-some`: storage loaded and reports exist. Exit: save/import/sync/delete/export.
- `error-recoverable`: local storage read failed. Exit: refresh or clear browser site data.
- `fatal-render`: React error boundary rendered. Exit: refresh; IndexedDB reports remain intact.

## Import States

- `idle`: no import is running. Exit: choose a file.
- `reading`: browser is reading the selected file. Exit: parse starts, read fails, or cancel.
- `normalizing`: encoding and newline normalization are running. Exit: parse starts or cancel.
- `parsing`: JSON/CSV/text structure detection is running. Exit: inference starts, fatal parse issue, or cancel.
- `inferring`: row-by-row civic inference is running. Exit: partial/complete success or cancel.
- `partial-success`: at least one report candidate was created and one or more issues were found. Exit: review summary, delete/edit imported reports, export.
- `complete-success`: report candidates were created with no issues. Exit: continue normal workflow.
- `failed-actionable`: no reports were created; issue explains what/why/next step. Exit: choose another file or fix source.
- `cancelling`: user pressed cancel; `AbortController` is signaled. Exit: `cancelled`.
- `cancelled`: local reports are unchanged. Exit: choose another file.

## Concurrency Rules

- Choosing a second file while import is running is ignored because the import button is disabled.
- Cancel only affects the in-progress import; already-saved local reports remain unchanged.
- Import merge is atomic at the app level: reports are only saved after analysis returns candidates.
- Duplicate imported report IDs or tags merge by deterministic freshness/confidence rules.

## No-Stuck-State Rule

Every state above has a visible exit: retry, cancel, review, edit, delete, export, refresh, or continue.
