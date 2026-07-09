# Pathfinder 0.8.9 Real Source Cleanup — Phase 1

Upload these files to the repo root and overwrite:

- `index.html`
- `app.js`
- `persistence-bootstrap.js`
- `service-worker.js`
- `RELEASE_NOTES_0.8.9.md`
- `README_UPDATE_0.8.9.md`

After GitHub Pages updates, open:

`https://seventhofthree.github.io/project-better/?v=0.8.9`

Test:

1. Confirm existing 0.8.8.6 saved data is still there.
2. Click Meal 1 Ate plan or add a meal note.
3. Refresh.
4. Confirm it stayed.
5. Open History.
6. Refresh.
7. Confirm the app still loads and saved data is still there.
8. Open Review and Progress.
9. Confirm no console error about `appState` initialization.
