# Pathfinder 1.2 Test Checklist

## Phase 1 — Update and data preservation

1. Open the versioned 1.2 URL.
2. Confirm Today loads without a display guard.
3. Confirm existing settings, foods, routines, workouts, and history remain.
4. Refresh and confirm data remains.

## Phase 2 — Primary navigation

5. Confirm only these primary destinations are visible:
   - Today
   - Food
   - Movement
   - Progress
   - Settings
6. Confirm the old eleven-tab strip is gone.
7. Confirm the active primary destination highlights correctly.

## Phase 3 — Today nested views

8. Open Today.
9. Switch among Today, Routines, and Assistant.
10. Confirm each existing view still works.
11. Confirm old buttons such as Open brief and Open full routine board open the correct nested view.

## Phase 4 — Food nested views

12. Open Food.
13. Confirm Today’s Food shows meal logging and daily totals.
14. Confirm Plan & Library shows the plan editor, saved foods, swaps, and food search.
15. Log or change a meal and confirm saving still works.

## Phase 5 — Movement nested views

16. Open Movement.
17. Confirm Today’s Workout shows the existing exercise system.
18. Confirm Exercise Guide opens and individual guide buttons still work.
19. Log a movement status and confirm it survives refresh.

## Phase 6 — Progress nested views

20. Open Progress.
21. Switch among Overview, Reviews, and History.
22. Confirm history cards, review copying, and CSV export remain available.

## Phase 7 — Settings and foundation regression

23. Open Settings with the gear button.
24. Confirm the Pathfinder 1.2 Calm Navigation card appears.
25. Confirm the Pathfinder 1.1 Durable Data Foundation card still appears.
26. Run Save test and confirm it passes.
27. Confirm IndexedDB foundation and rotating backups remain readable.
28. Export a JSON backup.

## Phase 8 — Phone and offline

29. On a phone-sized screen or installed app, confirm primary navigation appears at the bottom.
30. Confirm nested section controls remain visible and usable.
31. Open the app offline and confirm all five primary destinations and saved data still work.

## Pass condition

All existing features remain reachable, data remains intact, the five-destination navigation is clear, and the 1.1 durable foundation shows no regression.
