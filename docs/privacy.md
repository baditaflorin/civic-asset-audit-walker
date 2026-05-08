# Privacy

## Default

No analytics are shipped in v0.1.0.

No user accounts, names, emails, phone numbers, or volunteer identifiers are collected by the app.

## Local Data

Reports are stored in the browser's IndexedDB on the volunteer's device. A report may include:

- Asset tag.
- Asset type.
- Condition.
- Optional notes.
- Optional asset location if the volunteer grants browser geolocation.
- Timestamps.

## Sharing

Exports and WebRTC sync are user-initiated. Peer sync sends reports over a WebRTC data channel after manual offer/answer signaling. There is no central aggregation server.

## Third Parties

The app may contact:

- https://tile.openstreetmap.org for map tiles.
- https://api.github.com for public commit metadata.
- https://cdn.jsdelivr.net for lazy OpenCV.js and DuckDB-WASM runtime assets.

## Opt Out

Do not grant geolocation if location should not be attached. Use JSON/CSV export only with people or organizations you trust.
