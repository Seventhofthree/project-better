# Pathfinder 1.3 Upload Instructions

## Before uploading

1. Export a fresh Pathfinder 1.2.1 JSON backup.
2. Keep the passed 1.2.1 ZIP as the rollback package.

## Replace at the repository root

- `app.js`
- `index.html`
- `service-worker.js`
- `README.md`
- `ROADMAP.md`
- `package.json`

## Add at the repository root

- `today-flow.js`
- `RELEASE_NOTES_1.3.md`
- `README_UPDATE_1.3.md`
- `UPLOAD_INSTRUCTIONS_1.3.md`
- `TEST_CHECKLIST_1.3.md`
- `SANITY_CHECK_1.3.json`

## Replace inside `tests`

- `tests/app-smoke.test.mjs`
- `tests/index-navigation.test.mjs`
- `tests/legacy-migration-smoke.test.mjs`

## Add inside `tests`

- `tests/today-flow.test.mjs`

`app-replacement-1.3.txt` is an alternate copy of `app.js` and does not need to be uploaded.

Keep `app-catalog.js`, `data-foundation.js`, `history-snapshots.js`, `navigation.js`, `styles.css`, `manifest.webmanifest`, and `icon.svg` unchanged.
