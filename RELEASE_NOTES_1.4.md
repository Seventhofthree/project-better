# Pathfinder 1.4 — Food Depth & Calorie Tracking

## Purpose

Replace hard-coded meals as the center of Food with a flexible calorie tracker for what was actually eaten.

## Changes

- Added individual daily food entries.
- Added partial and multiple serving quantities.
- Added editable quantity and meal assignment.
- Added calorie, protein, and fiber target tracking.
- Added favorites and recent-food repeats.
- Added reusable meals built from logged food components.
- Added repeat-yesterday and repeat-one-meal actions.
- Added nutrition-source labels: Exact label, Database estimate, Personal estimate, and Planned value.
- Kept the existing meal plan as an optional template and compatibility layer.
- Kept Ate plan and frozen historical meal snapshots.
- Added starter entries for bacon, English muffins, and pork chops to the searchable database.
- Treated Open Food Facts results as database estimates and retained the provider label.
- Added food-entry details and fiber totals to CSV exports.
- Added schema-3 migration coverage and food-tracker automated tests.

## Data impact

Pathfinder’s application data schema changes from 2 to 3.

New fields include:

- `days[date].meals.entries`
- `favoriteFoods`
- `mealTemplates`
- `settings.proteinGoal`
- `settings.fiberGoal`

Existing 1.3 food history, extra-food records, planned-meal snapshots, settings, and saved meals are preserved. Existing saved meals are converted into reusable meal templates during migration.

The IndexedDB database structure itself is unchanged: each day remains a separate day record under the passed 1.1 durable foundation.
