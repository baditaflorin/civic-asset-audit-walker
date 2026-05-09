# 0062 Output Pathway Coverage Policy

- Status: accepted

## Context

Report export exists, but there is no full workspace artifact, clipboard export, or shareable link.

## Decision

The app will support JSON download, CSV download, JSON copy, CSV copy, full workspace snapshot download, print-friendly browser print, and shareable hash URLs for small snapshots.

## Consequences

Users can leave the app with their work in multiple practical formats without introducing a runtime backend.

## Alternatives considered

- Add cloud sync backend: rejected because the project remains Mode A.
