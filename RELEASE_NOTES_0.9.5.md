# Pathfinder 0.9.5 Saved Food / Calorie Counter Polish

## Purpose

Make real-world food logging faster when the planned meal did not happen.

## What changed

- `APP_VERSION` is now `0.9.5`.
- Meals page now has quick estimate buttons for common “ate something else” situations.
- Custom food logs now support a servings / multiplier field.
- Saving a custom food now saves it into **My foods** as a repeat food.
- Added recent repeat-food options from recent custom food logs.
- Food page now has a calorie counter helper card.
- Food page now has a saved food quick logger with meal slot and serving multiplier.
- My foods cards now support ½x, 1x, and 2x quick-add buttons.
- Kept 0.9.4 review polish.
- Kept 0.9.3 progress trend polish.
- Kept 0.9.2 exercise/routine polish.
- Kept 0.9.1 meal dashboard polish.
- No persistence behavior was changed.

## Why this matters

The food plan only works if logging is easy after real life happens. This release makes “rough and logged” faster than leaving blanks.

## Done When

- Existing saved data survives the update.
- Meals page opens.
- Quick estimate buttons fill the custom food logger.
- Custom food with servings saves across refresh.
- Recent repeat foods appear after logging a custom food.
- Food page opens.
- Saved food quick logger works.
- My foods quick-add still works.
- Settings still opens.
- Run save test still passes.
