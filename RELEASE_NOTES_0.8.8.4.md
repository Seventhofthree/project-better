# Pathfinder 0.8.8.4 No-Bootstrap Save Repair

## Purpose

Remove the old startup bootstrap from the save path.

## What changed

- `index.html` now loads `app.js?v=0.8.8.4` directly.
- `persistence-bootstrap.js` is now an inert fallback only, for old cached index files.
- The old IndexedDB restore decision in bootstrap no longer runs.
- `app.js` version is `0.8.8.4`.
- `app.js` still saves to localStorage primary and backup.
- `app.js` still has IndexedDB saving/hydration disabled.
- `service-worker.js` cache is bumped to `pathfinder-0.8.8.4`.

## Why

The direct `app.js` repair was correct, but the repo still had an older bootstrap in front of it. That bootstrap could inspect IndexedDB before the app started and restore stale state. This release removes that startup layer.

## Done When

- Hard refresh shows the app.
- Settings storage status shows local save ready.
- Meal status survives refresh.
- Meal note survives refresh.
- Meal swap survives refresh.
- Custom food log survives refresh.
- Exercise status survives refresh.
- Water/check-in survives refresh.
- Weight survives refresh.

## Test URL

After upload, open:

`https://seventhofthree.github.io/project-better/?v=0.8.8.4`

The query string helps bypass old cached pages.
