# Pathfinder 1.2 — Calm Navigation

## Purpose

Reduce information overload by organizing the existing eleven feature views inside five primary destinations. This is a navigation and presentation release, not a new feature expansion.

## Primary navigation

```text
Today
Food
Movement
Progress
Settings
```

## Nested views

### Today

- Today
- Routines
- Assistant

### Food

- Today’s Food
- Plan & Library

### Movement

- Today’s Workout
- Exercise Guide

### Progress

- Overview
- Reviews
- History

### Settings

Settings remains a separate maintenance destination.

## Other changes

- Added a tested navigation model in `navigation.js`.
- Existing jump buttons still resolve to the correct nested view.
- The page title now reflects the primary section rather than the internal feature renderer.
- Phone-sized screens use compact bottom navigation.
- Desktop retains the primary navigation near the top.
- Added a 1.2 release card in Settings.
- Preserved the 1.1 Durable Data Foundation card and diagnostics.
- Added automated tests proving all eleven views remain reachable and map to the intended section.

## Data safety

- No data schema change
- No IndexedDB migration
- No changes to historical snapshots
- No changes to import/export format
- No changes to rotating backups
- Existing 1.1 data remains the source of truth
