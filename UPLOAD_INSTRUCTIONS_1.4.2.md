# Pathfinder 1.4.2 Upload Instructions

## Before uploading

1. Export a fresh Pathfinder 1.4/1.4.1 JSON backup.
2. Keep the passed 1.4.1 visual-restoration ZIP as a rollback package.

## Replace at the repository root

- `app.js`
- `styles.css`
- `index.html`
- `service-worker.js`
- `README.md`
- `ROADMAP.md`
- `package.json`

## Add at the repository root

- `food-search.js`
- `RELEASE_NOTES_1.4.2.md`
- `README_UPDATE_1.4.2.md`
- `UPLOAD_INSTRUCTIONS_1.4.2.md`
- `TEST_CHECKLIST_1.4.2.md`
- `SANITY_CHECK_1.4.2.json`

## Replace inside `tests`

- `tests/app-smoke.test.mjs`
- `tests/food-tracker-migration-smoke.test.mjs`
- `tests/index-navigation.test.mjs`
- `tests/legacy-migration-smoke.test.mjs`

## Add inside `tests`

- `tests/food-search.test.mjs`
- `tests/styles-regression.test.mjs`

`app-replacement-1.4.2.txt` is an alternate copy of `app.js` and does not need uploading.

Keep `app-catalog.js`, `data-foundation.js`, `food-tracker.js`, `history-snapshots.js`, `navigation.js`, `today-flow.js`, `manifest.webmanifest`, and `icon.svg` unchanged.
