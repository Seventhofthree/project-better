# Pathfinder 0.8.5

Pathfinder is a local-first daily companion app for meals, movement, routines, beginner exercise guidance, progress, and weekly review.

## What changed through 0.8.5

### 0.8.3-style cleanup and prediction

- Removed version-note clutter from the main app cards.
- Added meal recipe cards for the breakfast block and egg fried rice bowls.
- Added recipe editing fields in the Food / Plan editor tab.
- Added TDEE inputs in Settings: age, sex, height, baseline activity, and manual fallback maintenance.
- Updated bodyweight expectation and At this pace projection to use logged food, current/latest weight, calculated TDEE, and logged exercise status/minutes/intensity.

### 0.8.4-style daily guidance polish

- Added a context-aware Today routine focus so the Today tab focuses on the current block instead of showing the entire routine board.
- Missed earlier routine items collapse into a softer note instead of taking over the day.
- Added a weather snippet for current conditions and the next few hours.
- Weather guidance suggests indoor movement, walking, hydration, or flexible movement based on heat, humidity, wind, and rain risk.
- Added a better exercise guide support layer with setup/move/check form snapshots.

### 0.8.5-style food logging upgrade

- Added a Food database search card.
- Searches the built-in starter food database, My Foods, and optional online packaged-food results.
- Added serving multiplier and meal target for faster real-world logging.
- Added optional Open Food Facts packaged-food search when online.
- Added Save-to-My-Foods from database results.

## Run locally

From this folder:

```bash
python -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

You can also double-click `index.html` for a quick look, but serving locally is better for PWA/offline behavior.

## GitHub Pages update

Upload the contents of this folder into the root of your repo so the repo contains `index.html`, `app.js`, `styles.css`, `manifest.webmanifest`, `service-worker.js`, and `icon.svg` directly.

## Data note

This version is still local-first. Nothing syncs between devices until cloud sync is built in 0.9. Use Export backup before replacing files or switching devices.
