# Pathfinder 0.9.1 Meal Dashboard Polish

## Purpose

Make the Meals screen easier to understand without changing the save system.

## What changed

- `APP_VERSION` is now `0.9.1`.
- Meals dashboard now shows:
  - logged calories
  - calorie room left or over
  - logged protein
  - logged fiber
- Added plain-language daily meal guidance.
- Added logged fiber tracking based on meals marked **Ate plan** plus custom food logs.
- Kept existing custom food logging, saved meal quick-add, and food database behavior.
- Kept 0.9.0.1 Settings and Update Safety fixes.

## Why this matters

The app already logs meal status and custom foods, but the top of the Meals page did not clearly answer: “Where am I today?” This patch makes the daily food picture easier to read.

## Done When

- Existing saved data survives the update.
- Meals page opens.
- Meal dashboard shows calories/protein/fiber.
- Meal status still saves after refresh.
- Custom food still saves after refresh.
- Settings still opens.
- Run save test still passes.
