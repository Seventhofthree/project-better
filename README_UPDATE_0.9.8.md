# Pathfinder 0.9.8 Bug Sweep

Upload these files to the repo root and overwrite:

- `index.html`
- `app.js`
- `persistence-bootstrap.js`
- `service-worker.js`
- `RELEASE_NOTES_0.9.8.md`
- `README_UPDATE_0.9.8.md`

Do not replace `styles.css` for this patch.

After upload, wait for GitHub Pages to finish.

Then tell ChatGPT to verify the repo before testing.

Test URL after verification:

`https://seventhofthree.github.io/project-better/?v=0.9.8`

Test:

1. Confirm saved data is still there.
2. Go to Today.
3. Go to Settings.
4. Confirm Release readiness card appears.
5. Run save test.
6. Go to Review.
7. Try Copy review.
8. Go to Assistant.
9. Try Copy companion packet.
10. Refresh.
11. Confirm Today, Settings, Review, and Assistant still open normally.
