# Pathfinder 0.8.7.1 Version Badge Patch

Small follow-up patch after 0.8.7.

## What changed

- Adds an App version card to Settings.
- Shows:
  - visible release version
  - bootstrap version
  - core `app.js` version
  - service worker cache version
  - startup restore source
  - bootstrap finished timestamp
- Updates `index.html` to load `persistence-bootstrap.js?v=0.8.7.1`.
- Updates `service-worker.js` cache to `pathfinder-0.8.7.1`.

## Why

This makes it easier to confirm from the phone that the newest pushed update is actually the one being tested.

## Note

The core `app.js` still declares `APP_VERSION = '0.8.6'`. The visible release version comes from the bootstrap/update layer for now. We should unify the version source during the 0.8.8/0.8.9 cleanup.
