# Pathfinder 0.8.3

Pathfinder is a local-first daily companion app for meals, movement, routines, beginner exercise guidance, progress, and weekly review.

## What changed in 0.8.3

- Removed version-note clutter from the main app cards.
- Added meal recipe cards for the breakfast block and egg fried rice bowls.
- Added recipe editing fields in the Food / Plan editor tab.
- Added TDEE inputs in Settings: age, sex, height, baseline activity, and manual fallback maintenance.
- Updated the bodyweight expectation and At this pace projection to use:
  - food logs,
  - current/latest weight,
  - calculated TDEE,
  - logged exercise minutes/intensity/status.
- Updated the offline cache name so hosted/PWA installs can pick up the new build.

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

## Data note

This version is still local-first. Nothing syncs between devices until cloud sync is built in 0.9. Use Export backup before replacing files or switching devices.
