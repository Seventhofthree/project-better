# Pathfinder 1.4 Upload Instructions

## Before uploading

1. Export a fresh Pathfinder 1.3 JSON backup.
2. Keep the passed 1.3 ZIP as the rollback package.

## Replace at the repository root

- `app.js`
- `app-catalog.js`
- `styles.css`
- `index.html`
- `service-worker.js`
- `README.md`
- `ROADMAP.md`
- `package.json`

## Add at the repository root

- `food-tracker.js`
- `RELEASE_NOTES_1.4.md`
- `README_UPDATE_1.4.md`
- `UPLOAD_INSTRUCTIONS_1.4.md`
- `TEST_CHECKLIST_1.4.md`
- `SANITY_CHECK_1.4.json`

## Replace inside `tests`

- `tests/app-smoke.test.mjs`
- `tests/index-navigation.test.mjs`
- `tests/legacy-migration-smoke.test.mjs`

## Add inside `tests`

- `tests/food-tracker.test.mjs`
- `tests/food-tracker-migration-smoke.test.mjs`

`app-replacement-1.4.txt` is an alternate copy of `app.js` and does not need to be uploaded.

Keep `data-foundation.js`, `history-snapshots.js`, `navigation.js`, `today-flow.js`, `manifest.webmanifest`, and `icon.svg` unchanged.
