# Pathfinder 1.2

Pathfinder is a local-first daily companion for food, movement, routines, progress, and review.

## Current release

**1.2 — Calm Navigation**

This release reduces eleven visible feature tabs to five clear destinations without removing any existing capability:

```text
Today
Food
Movement
Progress
Settings
```

### Where everything moved

- **Today** contains the daily dashboard, Routines, and Assistant.
- **Food** contains Today’s Food plus the meal plan, saved foods, swaps, and food search.
- **Movement** contains Today’s Workout and the Exercise Guide.
- **Progress** contains Overview, Reviews, and History.
- **Settings** remains separate for personal targets, backups, diagnostics, and maintenance.

Each section has a small nested view switcher. Existing internal jump buttons still open the correct nested destination.

On phone-sized screens, the five primary destinations move to a compact bottom navigation bar. Desktop keeps the primary navigation near the top.

## Data foundation

Pathfinder 1.2 keeps the passed 1.1 durable data foundation unchanged:

- Separate IndexedDB daily records
- Immutable meal, routine, and workout snapshots
- Up to three rotating last-known-good backups
- Compact emergency metadata in localStorage
- The unchanged 1.0.1 localStorage rollback copy
- Debounced text-entry saves
- Complete JSON import and export

There is no 1.2 data-schema migration. Existing 1.1 data should open unchanged.

## Privacy

Pathfinder has no account and no Pathfinder server. Daily tracking history remains in this browser.

Two optional features contact external services:

- Weather sends the latitude and longitude entered in Settings to Open-Meteo.
- Online packaged-food search sends entered search terms to Open Food Facts.

Pathfinder does not send meal history, weight history, exercise history, routine history, check-ins, or notes to those services.

## Data safety

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

The test suite covers the 1.1 storage foundation, historical snapshots, legacy migration, startup rendering, and the complete 1.2 navigation map.

## Deployment

The app is a static GitHub Pages site. The repo root contains the live application files.

## Roadmap

See `ROADMAP.md`. Pathfinder 1.3 is the Today-first daily-flow release.
