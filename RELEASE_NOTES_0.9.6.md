# Pathfinder 0.9.6 Assistant Layer

## Purpose

Make Pathfinder feel more like a good friend that points you toward the next useful action.

## What changed

- `APP_VERSION` is now `0.9.6`.
- Today page now includes a **Your next best step** companion card.
- Assistant page now includes:
  - Morning brief
  - Next action stack
  - Evening wind-down coach
  - What changed?
  - Upcoming focus
  - Body / weight expectation
  - Quick jumps
  - Copy companion packet
- Guidance uses existing logged data from:
  - meals
  - custom food logs
  - exercise
  - routines
  - wind-down
  - weekly stats
  - progress trend
- Kept 0.9.5 food/calorie counter polish.
- Kept 0.9.4 review polish.
- Kept 0.9.3 progress trend polish.
- Kept 0.9.2 exercise/routine polish.
- Kept 0.9.1 meal dashboard polish.
- No persistence behavior was changed.

## Why this matters

The app already tracks useful behavior. This release turns those logs into clearer guidance: what matters next, what can wait, and what the simplest useful action is.

## Done When

- Existing saved data survives the update.
- Today page opens.
- Your next best step card appears.
- Assistant page opens.
- Morning brief appears.
- Next action stack appears.
- Evening wind-down coach appears.
- What changed card appears.
- Copy companion packet works.
- Settings still opens.
- Run save test still passes.
- Refresh still preserves data.
