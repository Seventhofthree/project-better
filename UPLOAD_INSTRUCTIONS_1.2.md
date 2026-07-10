# Pathfinder 1.2 Upload Instructions

Export a fresh JSON backup from Pathfinder 1.1 before uploading.

## Replace

- `app.js`
- `index.html`
- `service-worker.js`
- `README.md`
- `ROADMAP.md`
- `package.json`
- the changed files inside `tests/`

## Add

- `navigation.js`
- `tests/navigation.test.mjs`
- `RELEASE_NOTES_1.2.md`
- `README_UPDATE_1.2.md`
- `UPLOAD_INSTRUCTIONS_1.2.md`
- `TEST_CHECKLIST_1.2.md`
- `SANITY_CHECK_1.2.json`

## Keep unchanged

- `styles.css`
- `app-catalog.js`
- `data-foundation.js`
- `history-snapshots.js`
- `manifest.webmanifest`
- `icon.svg`

Do not upload `app-replacement-1.2.txt` when normal `app.js` uploading works. It is only an alternate copy.
