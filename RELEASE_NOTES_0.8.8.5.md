# Pathfinder 0.8.8.5 Storage Fallback Repair

## Purpose

Fix the save-refresh failure after confirming the screen updates but the saved state is not coming back after refresh.

## What changed

- `app.js` version is `0.8.8.5`.
- `index.html` loads `app.js?v=0.8.8.5` directly.
- `saveState()` now saves to:
  - primary localStorage
  - backup localStorage
  - sessionStorage refresh fallback
  - IndexedDB fallback
- `loadState()` now checks multiple saved copies and loads the best candidate.
- IndexedDB hydration is re-enabled, but guarded:
  - it can restore only if the current loaded state has no meaningful user data
  - it cannot overwrite localStorage/sessionStorage data that already has meal, exercise, check-in, water, weight, or note data
- Service worker cache is bumped to `pathfinder-0.8.8.5`.

## Why

0.8.8.4 proved the old bootstrap was removed and the direct app was running, but the data still did not survive refresh. This patch adds multiple save targets and a safer loading decision.

## Test URL

After upload, open:

`https://seventhofthree.github.io/project-better/?v=0.8.8.5`

## Done When

- Meal status survives refresh.
- Meal note survives refresh.
- Meal swap survives refresh.
- Custom food log survives refresh.
- Exercise status survives refresh.
- Exercise minutes/notes survive refresh.
- Water/check-in survives refresh.
- Weight survives refresh.
