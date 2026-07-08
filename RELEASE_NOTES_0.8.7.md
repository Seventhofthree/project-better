# Pathfinder 0.8.7 Stability Update

This is a stability-focused patch for the current root static Pathfinder app.

## What changed

- Added `persistence-bootstrap.js`.
- Updated `index.html` so the bootstrap runs before `app.js`.
- The bootstrap checks localStorage, backup localStorage, legacy storage keys, and IndexedDB before the main app starts.
- If IndexedDB has the better saved state, it restores it into localStorage before `app.js` renders.
- If the backup storage key is the best copy, it restores it to the primary key before startup.
- Updated `service-worker.js` to `pathfinder-0.8.7`.
- The service worker now uses a network-first strategy for app files so updates are less likely to get trapped behind an old cache.
- Added cache cleanup for old `pathfinder-*` caches.

## What this does not change

- It does not rewrite the main `app.js` core.
- It does not remove the remaining render-time issue where history/review can create blank day records.
- It does not add cloud sync.
- It does not change the current 3-meal rice plan structure.

## Install instructions

Unzip this package into the repository root and overwrite the included files.

This package is a patch package. It does not include `app.js`, `styles.css`, `manifest.webmanifest`, or `icon.svg` because those files should stay as they currently are.

After upload, open the app and refresh once or twice. If the installed PWA still shows old behavior, close/reopen it or clear the Pathfinder site cache once.
