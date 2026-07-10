# Pathfinder 1.0.1

Pathfinder is a local-first daily companion for food, movement, routines, progress, and review.

## Current release

**1.0.1 — Correctness and Safety**

This maintenance release fixes the findings that could be addressed without redesigning storage:

- Correct storage-readiness reporting
- Durable save-test results with passed, degraded, and failed states
- Correct nutrition totals for selected meal adjustments
- Correct meal-plan calorie recalculation
- No blank daily records from navigation, copying, or exporting
- Safer JSON import with validation, confirmation, and a pre-import backup
- CSV formula-injection protection
- Accurate privacy wording
- Neutral defaults in the public source
- Current release documentation

The larger durable-data redesign remains scheduled for Pathfinder 1.1.

## Privacy

Pathfinder has no account and no Pathfinder server. Daily tracking history remains in this browser.

Two optional features contact external services:

- Weather sends the latitude and longitude entered in Settings to Open-Meteo.
- Online packaged-food search sends the entered search terms to Open Food Facts.

Pathfinder does not send meal history, weight history, exercise history, routine history, check-ins, or notes to those services.

## Data safety

Pathfinder currently saves the application state to:

- Primary localStorage
- Backup localStorage
- Session-storage refresh fallback
- IndexedDB mirror

Download a JSON backup weekly, before an update, and before switching browsers or devices.

## Run locally

From the repository folder:

```bash
python -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

## Deployment

The app is a static GitHub Pages site. The repo root contains the live application files.

## Roadmap

See `ROADMAP.md`. The project direction through 2.0 is to strengthen and deepen the existing app rather than add more top-level features.
