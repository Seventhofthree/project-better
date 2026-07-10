# Pathfinder 1.1

Pathfinder is a local-first daily companion for food, movement, routines, progress, and review.

## Current release

**1.1 — Durable Data Foundation**

This release strengthens the app underneath the existing interface. It does not add another top-level feature or tab.

### What changed

- Daily records are stored as separate IndexedDB records rather than rewriting the entire history on every edit.
- The plan/settings shell is stored separately from daily records.
- Logged meals preserve nutrition and meal-plan snapshots.
- Routine completion preserves the routine definition used for that day.
- Logged workouts preserve the selected workout definition.
- Saved candidates are validated and migrated one at a time.
- A damaged primary record can fall through to a healthy last-known-good backup.
- Up to three recovery backups rotate automatically.
- Text-entry saves are debounced, while page exit and visibility changes request an immediate flush.
- JSON import/export still contains the complete Pathfinder state.
- Storage, historical snapshots, and built-in catalogs now live in separate native JavaScript modules.
- Automated tests cover snapshots, separated day storage, backup rotation, save verification, 1.0.1 migration, startup, and key historical rendering paths.

## Migration from 1.0.1

The first 1.1 launch reads the existing 1.0.1 save, validates it, freezes historical definitions, writes the new IndexedDB foundation, and creates a last-known-good backup.

Records created before 1.1 did not contain snapshots. Pathfinder cannot reconstruct definitions that were already changed in the past, so legacy records are frozen using the meal plan, routine mode, swaps, and workouts available during the 1.1 migration. New 1.1 records preserve the definitions present when they are logged.

The old 1.0.1 localStorage save is retained as a rollback copy. It is not updated by normal 1.1 logging. Export a current 1.1 JSON backup before rolling back.

## Privacy

Pathfinder has no account and no Pathfinder server. Daily tracking history remains in this browser.

Two optional features contact external services:

- Weather sends the latitude and longitude entered in Settings to Open-Meteo.
- Online packaged-food search sends entered search terms to Open Food Facts.

Pathfinder does not send meal history, weight history, exercise history, routine history, check-ins, or notes to those services.

## Data safety

Pathfinder 1.1 uses:

- IndexedDB application shell
- Separate IndexedDB daily records
- Up to three rotating last-known-good IndexedDB backups
- Compact emergency metadata in localStorage
- The unchanged 1.0.1 localStorage rollback copy

A JSON export remains the portable backup. Download one weekly, before an update, before changing browsers or devices, and before a rollback.

## Run locally

From the repository folder:

```bash
python -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

Native JavaScript modules require the local HTTP server; opening `index.html` directly as a `file:` URL is not supported.

## Automated checks

No packages need to be installed.

```bash
npm test
```

Or run syntax checks and all tests:

```bash
npm run check
```

## Deployment

The app is a static GitHub Pages site. The repo root contains the live application files.

## Roadmap

See `ROADMAP.md`. Pathfinder 1.2 is the calm-navigation release that consolidates the eleven visible tabs into four main sections plus Settings.
