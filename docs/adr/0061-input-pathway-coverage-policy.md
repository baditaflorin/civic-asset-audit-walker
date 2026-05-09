# 0061 Input Pathway Coverage Policy

- Status: accepted

## Context

Users currently have one hidden file-picker import and no first-class paste, drop, clipboard, URL, or sample-data path.

## Decision

The app will expose one import surface that supports multi-file upload, drag-drop, text paste, clipboard read, URL fetch, full-workspace restore, and a built-in sample dataset. Folder import, pasted images, and pasted HTML stay out of scope and are documented as such.

## Consequences

Strangers can bring data in through the pathway they already have, while unsupported browser-specific paths are explicit rather than implied.

## Alternatives considered

- Keep file upload only: rejected because it fails the stranger test and mobile/clipboard workflows.
