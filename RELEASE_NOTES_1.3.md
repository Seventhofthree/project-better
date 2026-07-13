# Pathfinder 1.3 — Today-First Daily Flow

## Purpose

Turn Today into the main place to operate Pathfinder instead of a dashboard that mostly redirects to deeper sections.

## Changes

- Added Morning, Afternoon, Evening, and Saved-day review modes.
- Added a prominent calories-remaining budget to the top of Today.
- Added quick meal-status controls directly to Today.
- Kept full, minimum, and recovery movement logging on Today.
- Prioritized the routine block relevant to the current part of the day.
- Collapsed supporting, completed, and later-day information.
- Brought quick check-in, water, weight, notes, wind-down, weather, and day overview into a clearer flow.
- Added a current-release card in Settings.
- Added a pure Today-flow module and automated boundary/calorie-budget tests.

## Data impact

None. Pathfinder 1.3 uses the same application data schema and 1.1 IndexedDB foundation as 1.2.1.

## 1.4 bridge

The calories-remaining card currently uses meal statuses, frozen meal snapshots, and extra food logs. Pathfinder 1.4 will introduce the robust individual-food calorie tracker and turn meal plans into optional templates.
