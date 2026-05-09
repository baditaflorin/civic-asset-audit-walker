# Phase 3 Input Audit

Audit date: 2026-05-09  
Version audited: v0.2.1

| Pathway             | Status          | Notes                                                                                                                                   |
| ------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| File upload         | works partially | Imports one file at a time through the hidden file picker. CSV, JSON, TXT work, but no batch import and no explicit state-file restore. |
| Drag and drop       | not built       | There is no drop target in the UI.                                                                                                      |
| Paste text          | not built       | No paste box for CSV, JSON, or field notes.                                                                                             |
| Paste HTML          | not built       | No pathway; the import engine could accept pasted text, but the UI does not expose it.                                                  |
| Paste image         | not built       | Camera scan exists, but clipboard image import does not.                                                                                |
| URL input           | not built       | No fetch-by-URL import path or CORS guidance.                                                                                           |
| Clipboard read      | not built       | No `navigator.clipboard.readText()` entry point.                                                                                        |
| Mobile file picker  | works partially | Mobile browsers can use the native file picker via the file input, but there is no explicit affordance or batch feedback.               |
| Multi-file import   | not built       | Hidden input is single-file only.                                                                                                       |
| Folder import       | out of scope    | Browser folder imports are not required for v1 and there is no contract for merging arbitrary directory shapes.                         |
| Sample/demo import  | works partially | The scanner has a demo tag, but there is no equivalent sample dataset import for the reports flow.                                      |
| Deep links          | not built       | The app shows live/version links but cannot open a shared workspace state.                                                              |
| Imported state file | not built       | JSON report import works, but there is no full-workspace state format.                                                                  |
| Restored autosave   | works partially | Saved reports survive reload via IndexedDB, but in-progress form state is lost.                                                         |

Baseline result:

- Green: 0
- Yellow: 4
- Red: 8
- ADR/out-of-scope: 1
