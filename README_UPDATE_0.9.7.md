# Pathfinder 0.9.7 Mobile / PWA Polish

Upload these files to the repo root and overwrite:

- `index.html`
- `app.js`
- `persistence-bootstrap.js`
- `service-worker.js`
- `RELEASE_NOTES_0.9.7.md`
- `README_UPDATE_0.9.7.md`

Do not replace `styles.css` for this patch. Mobile polish is injected from `app.js`.

After upload, wait for GitHub Pages to finish.

Then tell ChatGPT to verify the repo before testing.

Test URL after verification:

`https://seventhofthree.github.io/project-better/?v=0.9.7`

Test:

1. Confirm saved data is still there.
2. Go to Today.
3. Confirm mobile layout still looks okay.
4. Scroll/tap the tab bar.
5. Go to Settings.
6. Confirm Mobile / app status card appears.
7. Toggle compact mode.
8. Refresh.
9. Confirm compact mode setting stayed.
10. Run save test.
11. On phone, confirm tabs and buttons are easier to tap.
