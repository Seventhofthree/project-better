# Pathfinder Release Roadmap

## Current baseline: 0.8.6

Status: Working static local-first prototype.

Already present:
- Today dashboard
- 3-meal rice-plan structure
- Food logging
- My Foods and saved meals
- Open Food Facts packaged-food search
- Beginner exercise guide
- Workout logging
- Daily routines
- Assistant-style daily/weekly summaries
- Progress charts
- History table
- JSON backup/restore
- CSV export
- Weather snippet
- PWA/offline shell

Main risk:
- Storage exists, but startup and render flow need to be made safer.

## 0.8.7 Stability Update

Goal: stop old-cache and startup-restore issues from hiding or overwriting saved state.

Scope:
- Bootstrap restore before `app.js` starts.
- localStorage primary + backup recovery.
- IndexedDB mirror recovery before first render.
- Service worker cache bump.
- Network-first update strategy for app files.
- Old Pathfinder cache cleanup.

Included in this zip:
- `index.html`
- `persistence-bootstrap.js`
- `service-worker.js`
- `RELEASE_NOTES_0.8.7.md`
- `docs/ROADMAP.md`

## 0.8.8 Data Safety Cleanup

Goal: fix the remaining save-risk inside the app core.

Planned:
- Change `getDay()` so it does not automatically save when merely viewing a date.
- Add `peekDay()` for read-only history/review/progress views.
- Make History and Review stop creating blank day records.
- Add a visible storage diagnostics card showing:
  - primary localStorage age
  - backup localStorage age
  - IndexedDB mirror age
  - bootstrap restore source
- Add a manual "Repair from backup" button.
- Add a "Download backup before update" reminder.

## 0.8.9 Code Organization

Goal: make the app easier to maintain without jumping frameworks yet.

Planned:
- Split the large `app.js` into smaller files:
  - storage
  - state/migrations
  - food/meals
  - exercise
  - routines
  - assistant summaries
  - rendering
  - event handling
  - weather
- Keep the same static/no-server deployment model.
- Keep GitHub Pages compatibility.

## 0.9 Data Foundation

Goal: move from one giant saved JSON blob to a safer local data model.

Planned:
- Store daily records separately in IndexedDB.
- Keep localStorage only for small settings and emergency pointers.
- Add data migrations with version numbers.
- Add import/export that can restore all records.
- Add a simple data integrity check.
- Prepare for future cloud sync without requiring it yet.

## 0.9.5 Calorie Counter Upgrade

Goal: make food tracking more useful and less manual.

Planned:
- Better serving sizes.
- Meal templates.
- Repeating meals.
- Quick-add common foods.
- Daily calorie/protein/fiber summary.
- Better "ate something else" flow.
- Separate planned calories from logged calories.

## 1.0 Personal Daily Companion

Goal: reliable daily use on phone, PC, and tablet.

Target features:
- Stable local-first daily tracking.
- Reliable history and backup/restore.
- Meal, calorie, protein, and fiber tracking.
- Workout and routine tracking.
- Weight trend and weekly direction.
- Morning brief.
- Evening wind-down.
- Saturday weekly review.
- Offline-first behavior.
- Clear update process.

Not included in 1.0 unless specifically chosen:
- Cloud sync
- Google Fit integration
- Account login
- Multi-user support
