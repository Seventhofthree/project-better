# Pathfinder 0.9.2 Exercise/Routine Polish

## Purpose

Make the Exercise and Routines screens more useful day-to-day without touching the save system.

## What changed

- `APP_VERSION` is now `0.9.2`.
- Exercise page now has a **Today’s movement choice** card.
- Exercise page shows:
  - suggested version
  - starter minutes
  - intensity
  - first steps to do today
- Workout cards now explain when to use Full, Minimum, and Recovery.
- Routines page now has a **Routine status** card.
- Routines page shows:
  - done
  - left
  - total
  - next-up routine items
- Kept 0.9.1 meal dashboard polish.
- Kept 0.9.0.1 Settings and Update Safety fixes.
- No persistence behavior was changed.

## Done When

- Existing saved data survives the update.
- Exercise page opens.
- Today’s movement choice card appears.
- Minimum win saves across refresh.
- Routines page opens.
- Routine status card appears.
- Toggling routine items saves across refresh.
- Settings still opens.
- Run save test still passes.
