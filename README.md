# Pathfinder 1.3

Pathfinder is a local-first daily companion for food, movement, routines, progress, and review.

## Current release

**1.3 — Today-First Daily Flow**

Today is now the main operating screen. It changes emphasis based on the selected date and the current part of the day:

- **Morning** prioritizes the quick check-in, breakfast, and morning routine anchors.
- **Afternoon** prioritizes lunch, the preferred movement window, and the current routine block.
- **Evening** prioritizes a minimum movement win, dinner, the evening reset, and wind-down.
- **Saved day** shows a factual review instead of applying live time-of-day prompts to history.

### What can be done from Today

- See a prominent calories-remaining budget
- Mark the current meal as Ate plan, Swapped, or Skipped
- Review all three meal statuses
- Log full, minimum, or recovery movement
- Complete current routine items
- Record sleep, energy, mood, stress, hunger, water, weight, and a one-line note
- Complete the wind-down and view the daily recap

Completed and later-day details collapse so the current action remains easier to find.

## Calorie-tracker bridge

The Today page now keeps **calories remaining** prominent. In 1.3 it is calculated from the existing meal statuses, historical meal snapshots, and extra-food logs. Pathfinder 1.4 will replace the hard-coded-meal emphasis with a more robust individual-food calorie tracker, serving quantities, recent foods, favorites, and reusable meal templates.

## Navigation

```text
Today
Food
Movement
Progress
⚙ Settings
```

Today, Food, Movement, and Progress remain the four daily destinations. Settings remains a separate upper-right utility.

## Data foundation

Pathfinder 1.3 keeps the passed 1.1 durable data foundation unchanged:

- Separate IndexedDB daily records
- Immutable meal, routine, and workout snapshots
- Up to three rotating last-known-good backups
- Emergency recovery metadata in localStorage
- Debounced saves with immediate exit flushing
- Complete JSON import and export
- The 1.0.1 localStorage rollback copy remains untouched

There is no 1.3 data-schema migration.

## Local development

```bash
npm test
npm run check
```

The app remains static and can be hosted through GitHub Pages without a build step.
