# Pathfinder 1.4 Test Checklist

## Phase 1 — Startup and schema migration

1. Open the versioned 1.4 URL.
2. Confirm Today loads without a display guard.
3. Confirm existing settings, history, routines, workouts, food library, and meal statuses remain.
4. Confirm Settings shows Pathfinder 1.4 and application schema 3.
5. Refresh and confirm the migrated data remains.

## Phase 2 — Calorie tracker basics

6. Open Food → Today’s Food.
7. Confirm calories remaining, calories logged, protein, and fiber appear.
8. Log one food using Quick food entry.
9. Confirm the food appears in the selected meal group.
10. Confirm Today’s calories-remaining card updates immediately.
11. Refresh and confirm the entry remains.

## Phase 3 — Serving and meal editing

12. Change the logged quantity to a partial or multiple serving.
13. Confirm calories, protein, and fiber recalculate.
14. Move the food to a different meal group.
15. Confirm totals stay the same and the entry moves.
16. Remove the entry and confirm the totals reverse correctly.

## Phase 4 — Food sources and search

17. Log a manual Exact label entry.
18. Confirm its Exact label badge appears.
19. Search and log a starter-database food.
20. Confirm Database estimate appears.
21. Optionally search packaged foods online and confirm Open Food Facts remains identified as the source.
22. Refresh and confirm source labels remain attached to the entries.

## Phase 5 — Favorites and recent foods

23. Favorite a logged entry.
24. Confirm it appears in Favorites.
25. Add it again from Favorites.
26. Confirm it appears in Recent foods.
27. Remove the favorite and confirm the logged food remains intact.

## Phase 6 — Reusable meals and repeat

28. Log at least two foods in one meal.
29. Save that meal as a reusable meal.
30. Add the reusable meal to a blank date and confirm every component is copied.
31. Edit the copied quantity and confirm the original date and template do not change.
32. Test Repeat yesterday or repeat one meal from yesterday.

## Phase 7 — Optional plan compatibility

33. Use Ate plan for one meal.
34. Confirm its frozen plan calories count correctly.
35. Add an individual extra food and confirm it adds without rewriting the frozen planned meal.
36. Edit the active plan and confirm the old date remains historically frozen.

## Phase 8 — Targets, export, and foundation regression

37. Change calorie, protein, and fiber targets in Plan & Library or Settings.
38. Confirm Today and Today’s Food use the new targets.
39. Export CSV and confirm food-entry detail and fiber columns are included.
40. Export a JSON backup.
41. Run Save test and confirm IndexedDB and rotating backups pass.
42. Import the JSON backup and confirm food entries, favorites, and reusable meals return.

## Phase 9 — Phone and offline

43. Confirm the food ledger and entry controls stack cleanly on phone.
44. Confirm the four daily destinations remain in the bottom navigation and Settings remains in the header.
45. Open offline and confirm saved food entries, favorites, reusable meals, and calories remaining work.

## Pass condition

Existing 1.3 data remains intact, actual food entries drive the calorie budget, serving edits are accurate, reusable meals and repeats create independent records, nutrition sources remain visible, Today stays synchronized, backups work, and the app remains usable offline.
