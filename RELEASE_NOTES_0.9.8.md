# Pathfinder 0.9.8 Bug Sweep

## Purpose

Tighten the current app before the release-candidate pass.

## What changed

- `APP_VERSION` is now `0.9.8`.
- Added a runtime guard for invalid selected date or invalid active tab.
- Added safer copy-to-clipboard handling:
  - Weekly review
  - AI packet
  - Companion packet
  - Storage debug packet
- Added a Release readiness card in Settings.
- Cleaned up confusing storage wording about cloud sync.
- Improved update-habit wording.
- Kept 0.9.7 mobile/PWA polish.
- Kept 0.9.6 assistant layer.
- Kept 0.9.5 food/calorie counter polish.
- Kept 0.9.4 review polish.
- Kept 0.9.3 progress trend polish.
- Kept 0.9.2 exercise/routine polish.
- Kept 0.9.1 meal dashboard polish.
- No persistence behavior was changed.
- No major new feature was added.

## Why this matters

This pass is about reducing avoidable update/test failures before 0.9.9 Release Candidate.

## Done When

- Existing saved data survives the update.
- Today opens.
- Settings opens.
- Release readiness card appears.
- Save test passes.
- Copy review still works.
- Copy companion packet still works.
- Invalid navigation does not break the app.
- Refresh still preserves data.
