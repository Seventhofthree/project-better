# Pathfinder Roadmap to 1.0

## Current: 0.8.8 — Data Safety Cleanup

### Purpose

Make saved data safer and stop read-only screens from creating fake blank day records.

### What changed

- Runtime patch over the current `app.js`.
- `getDay()` no longer saves immediately when creating a day.
- Added `peekDay()` for read-only views.
- History and weekly stats use `peekDay()`.
- `saveState()` prunes empty auto-created days before writing.
- Added Data safety card in Settings.
- Added Download best backup.
- Added Repair from best backup.

### Done When

- Settings shows `0.8.8 Data Safety Cleanup`.
- Settings shows Runtime patch `0.8.8`.
- Settings shows Data safety card.
- Opening History does not create blank saved records.
- Opening Review does not create blank saved records.
- Meal logging survives refresh.
- Exercise logging survives refresh.
- Weight entry survives refresh.
- Download best backup works.
- Phone and PC both show the same version.

## 0.8.9 — Code Organization Cleanup

### Purpose

Make the app easier and safer to build on without changing to React, Next.js, or a server.

### Planned changes

- Split the giant `app.js` into smaller files.
- Keep the static GitHub Pages deployment model.
- Move storage, state, migrations, meals, exercise, routines, assistant, weather, charts, rendering, and events into separate files.
- Unify version number source so `app.js`, bootstrap, and Settings agree without explanation.

### Done When

- App still works visually the same.
- Settings version info is consistent.
- Save tests still pass.
- No Next.js starter folder returns.
- Future feature edits can target smaller files instead of one huge `app.js`.

## 0.9.0 — Local Data Foundation

### Purpose

Move from one giant saved JSON object to a safer local data model.

### Planned changes

- Use IndexedDB as the primary local database.
- Store daily records separately.
- Keep localStorage only for small settings/emergency backup.
- Add formal migrations.
- Add data integrity checks.
- Keep JSON export/import.

### Done When

- Old 0.8 data migrates safely.
- Daily records save separately.
- Import/export restores the whole app.
- Refresh tests pass.
- Offline tests pass.
- No known data-loss bugs.

## 0.9.1 — Update and Backup Workflow

### Purpose

Make updates safer and easier for phone/PC testing.

### Planned changes

- In-app update checklist.
- Backup reminder before updates.
- After-update verification checklist.
- More prominent backup/export controls.
- Better storage status explanations.

### Done When

- You can verify the current version quickly.
- You know exactly what to test after an update.
- Backup and restore are obvious.
- A bad update can be recovered from backup.

## 0.9.2 — Meal Plan and Food Logging Polish

### Purpose

Make the current 3-meal rice plan faster and easier to use.

### Planned changes

- Better meal buttons: Ate plan, Swapped, Skipped, Partial.
- Better "ate something else" flow.
- Better quick-add saved foods/meals.
- Planned calories vs logged calories.
- Daily calories/protein/fiber summary.
- Better snacks/extras handling.

### Done When

- A normal day can be logged in under a minute.
- A messy food day can still be logged honestly.
- Weekly review can tell planned eating from swapped eating.
- Daily totals feel useful.

## 0.9.3 — Exercise and Routine Polish

### Purpose

Make movement and routines easier to follow after work.

### Planned changes

- Cleaner workout screen.
- Better minimum-win flow.
- Better workout completion history.
- Recommendation based on energy, sleep, soreness, pain, and day.
- Better between-lunch-and-dinner emphasis.
- Optional too-tired mode.

### Done When

- You can open the app tired and know exactly what to do.
- Minimum win feels like success.
- Exercise data improves the weekly summary.
- Pain/recovery logic is clear.

## 0.9.4 — Progress and Weight Trend Upgrade

### Purpose

Make weight-loss expectations useful without overreacting.

### Planned changes

- Better weight trend display.
- 7-day average.
- 14-day/28-day direction.
- Water-weight/noise explanation.
- Better calorie deficit estimate.
- Confidence rating for projections.

### Done When

- One weird weigh-in does not dominate the app.
- Weekly direction feels realistic.
- Progress page explains trend vs noise.
- The projection tells you how confident it is.

## 0.9.5 — Calorie Counter Upgrade

### Purpose

Turn food tracking into a practical beginner calorie counter.

### Planned changes

- Better serving quantities.
- Repeat yesterday's meal.
- Repeat common meal.
- Save custom foods.
- Save custom meals.
- Better built-in food search.
- Open Food Facts remains optional.
- Weekly average calories.

### Done When

- Pathfinder can be your simple daily calorie counter.
- Repeated foods are fast to log.
- Custom foods save reliably.
- Daily and weekly calorie summaries make sense.

## 0.9.6 — Assistant Layer Upgrade

### Purpose

Make Pathfinder feel more like a useful friend/personal assistant.

### Planned changes

- Better morning brief.
- Better evening recap.
- Better weekly review.
- Better "what changed?" logic.
- Better upcoming focus.
- Summaries use actual food, exercise, weight, energy, sleep, and routine data.

### Done When

- Daily guidance feels specific.
- Weekly review feels useful.
- Advice changes based on actual logs.
- Copy-to-ChatGPT packet remains available.

## 0.9.7 — Mobile/PWA Polish

### Purpose

Make Pathfinder comfortable as a daily phone app.

### Planned changes

- Better mobile layout.
- Easier tapping.
- Cleaner Settings.
- Better tab scrolling.
- Better offline behavior.
- Better update refresh behavior.

### Done When

- Phone use feels natural.
- PC use still works.
- PWA/offline behavior is acceptable.
- Version/update behavior is clear.

## 0.9.8 — Full Bug Sweep

### Purpose

Stop adding features and test the whole app like 1.0 is close.

### Planned tests

- New user startup.
- Existing user migration.
- Meal save/refresh.
- Exercise save/refresh.
- Weight save/refresh.
- History no fake records.
- Export backup.
- Reset.
- Import restore.
- Offline use.
- Service worker update.
- Phone test.
- PC test.

### Done When

- No known data-loss bugs.
- No confusing update behavior.
- No major broken screens.
- Backup/restore is trusted.

## 0.9.9 — 1.0 Release Candidate

### Purpose

Freeze major features and prepare for stable release.

### Planned changes

- Bug fixes only.
- Clean README.
- Clean roadmap.
- Add simple user instructions.
- Add update instructions.
- Add backup instructions.
- Final version card.
- Final migration check.

### Done When

- Daily use feels stable.
- No foundation problems remain.
- You can trust it for real tracking.
- We are comfortable calling the next build 1.0.

## 1.0 — Pathfinder Personal Daily Companion

### Purpose

A reliable local-first daily companion for food, movement, routines, progress, and review.

### Included

- Stable daily food logging.
- 3-meal rice plan support.
- Custom foods and saved meals.
- Calorie/protein/fiber tracking.
- Exercise logging.
- Beginner exercise guide.
- Routine tracking.
- Weight tracking.
- Progress trends.
- Morning brief.
- Evening wind-down.
- Weekly review.
- History.
- Backup/export/import.
- Offline/PWA support.
- Visible version number.
- Clear update process.
- Safe local data foundation.

### Done When

- Phone and PC daily use are stable.
- Saving is trusted.
- History is trusted.
- Backup/restore is trusted.
- Updates are understandable.
- The app is useful enough to keep using every day.
