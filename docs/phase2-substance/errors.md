# Phase 2 Substance Error Taxonomy

Date: 2026-05-09

Every import issue contains:

- `severity`: info, warning, error, or fatal.
- `code`: stable machine-readable code.
- `what`: what happened in civic-domain terms.
- `why`: why the app reached that conclusion.
- `nowWhat`: next step the user can take.
- `rowNumber`: present when the issue belongs to a row.

## Current Codes

- `empty_input`: selected file had no rows.
- `invalid_json`: JSON could not be parsed or salvaged.
- `partial_json`: malformed/truncated JSON had recoverable objects.
- `unsupported_json_shape`: JSON was not a supported civic shape.
- `low_condition_confidence`: condition was inferred but needs review.
- `missing_location`: no usable coordinates or geometry were found.
- `duplicate_request`: a 311 request status indicates duplicate.
- `stale_check_date`: OSM check date is older than two years.
- `generated_source_id`: no recognized source ID was present.
- `spreadsheet_formula_text`: a text field looked like a spreadsheet formula.
- `encoding_repaired`: mojibake was normalized.
- `duplicate_asset_tag`: duplicate imported tag was skipped.

## Recoverable vs Fatal

Fatal issues produce no candidates. Recoverable issues preserve valid report candidates and surface review notes.
