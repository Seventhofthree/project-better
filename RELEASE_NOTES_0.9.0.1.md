# Pathfinder 0.9.0.1 Settings Hotfix

## Purpose

Fix the 0.9.0 Settings page regression.

## What happened

0.9.0 added the Update safety and Storage debug cards, but the Settings page referenced helper functions that were not present in the passed 0.8.9 base file. When Settings tried to render, it hit a missing helper and left the previous Today page content on screen.

## What changed

- `APP_VERSION` is now `0.9.0.1`.
- Added the missing helper functions used by the Settings debug cards:
  - `safeSessionGet()`
  - `parseStateCandidate()`
  - `dayHasUserData()`
- No persistence behavior was changed.
- No feature behavior was changed.

## Done When

- Settings tab shows the Settings page body.
- Update safety card appears.
- Run save test works.
- Existing saved data is still there.
- Meal/exercise still survive refresh.
