# 0041 - Input Robustness and Normalization Policy

- Status: Accepted
- Date: 2026-05-09

## Context

Real civic data arrives with BOMs, CRLF, NBSP, mojibake, semicolon delimiters, decimal commas, embedded CSV newlines, partial JSON, and mixed source schemas.

## Decision

Normalize text at the import boundary. Detect JSON, CSV, and field-note text. Decode files with UTF-8 first and fall back to Windows-1252 when replacement characters or mojibake indicate likely encoding damage. Salvage parseable JSON objects from partial JSON where possible.

## Consequences

The rest of the app receives canonical records. Recoverable parsing errors become row-level import issues instead of fatal app errors.

## Alternatives Considered

Keeping strict app-native JSON only was rejected because it fails the real-data set.
