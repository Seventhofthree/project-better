# Pathfinder 0.8.8.6 Startup Migration Fix

## Purpose

Fix the real refresh failure found in Chrome DevTools.

## What happened

The app was saving correctly. DevTools showed:

- `localStorage` had a large saved JSON state.
- `sessionStorage` had a large saved JSON state.
- the selected date existed.
- breakfast was saved as `planned`.

The failure happened on refresh because startup logged:

`ReferenceError: Cannot access 'appState' before initialization`

That means loading saved data crashed during migration, then the app fell back to a blank/default state.

## What changed

- `APP_VERSION` is now `0.8.8.6`.
- `getWorkoutById()` no longer crashes if called while `appState` is still initializing.
- During startup migration, it safely falls back to the built-in workout list.
- The storage fallback work from 0.8.8.5 remains in place.

## Why this matters

Saved days call `migrateDay()`.
`migrateDay()` calls `workoutForDate()`.
`workoutForDate()` calls `getWorkoutById()`.
The old `getWorkoutById()` tried to read `appState` before `appState` existed.

That broke saved-state loading on every refresh once saved days existed.

## Done When

- Meal status survives refresh.
- Meal note survives refresh.
- Exercise survives refresh.
- Water/check-in survives refresh.
- Weight survives refresh.
- Console no longer shows `Cannot access 'appState' before initialization`.
