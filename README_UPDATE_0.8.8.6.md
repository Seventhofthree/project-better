# Pathfinder 0.8.8.6 Startup Migration Fix

Upload these files to the repo root and overwrite:

- `index.html`
- `app.js`
- `persistence-bootstrap.js`
- `service-worker.js`
- `RELEASE_NOTES_0.8.8.6.md`
- `README_UPDATE_0.8.8.6.md`

After GitHub Pages updates, open:

`https://seventhofthree.github.io/project-better/?v=0.8.8.6`

Test:

1. Open DevTools Console.
2. Confirm there is no `Cannot access 'appState' before initialization` error.
3. Go to Meals.
4. Click Meal 1 Ate plan.
5. Refresh.
6. Go back to Meals.
7. Confirm Ate plan stayed selected.
