# Pathfinder 0.8.9 Real Source Cleanup — Phase 1

## Purpose

Make the first post-save-fix cleanup directly in the real source code.

## What changed

- `APP_VERSION` is now `0.8.9`.
- Added `readDay()`.
- `getDay()` still creates and saves a day when the user is actively editing today.
- `readDay()` lets read-only screens inspect missing days without saving blank records.
- Weekly stats now use `readDay()`.
- History now uses `readDay()`.
- Progress projections now use `readDay()` when appropriate.
- The 0.8.8.6 startup migration fix remains.
- The 0.8.8.5 storage fallback behavior remains.

## Why this matters

Before this, simply opening History, Review, or Progress could create saved blank days. That makes the app look like there is more history than there really is and can pollute trend calculations.

## Done When

- Existing saved data survives the update.
- Meal status still survives refresh.
- Exercise still survives refresh.
- Routines still survive refresh.
- History opens without creating a pile of fake new saved days.
- Review opens without creating fake saved days.
- Progress opens without creating fake saved days.
- Console has no startup migration error.
