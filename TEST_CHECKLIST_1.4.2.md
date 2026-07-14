# Pathfinder 1.4.2 Test Checklist

## Phase 1 — Startup and preservation

1. Open the versioned 1.4.2 URL.
2. Confirm the full dark-green Pathfinder appearance remains.
3. Confirm Today loads and existing food entries, favorites, history, routines, workouts, and settings remain.
4. Confirm Settings shows Pathfinder 1.4.2 and application schema 3.
5. Refresh and confirm data and styling remain.

## Phase 2 — Unified local search

6. Open Food → Today’s Food.
7. Confirm “What did you eat?” is the main entry card.
8. Type `bacon` and confirm Cooked bacon appears without pressing Search packaged.
9. Type `3 bacon` and confirm the result previews 129 calories.
10. Select Breakfast and log it.
11. Confirm the Breakfast ledger and Today calorie card update.
12. Refresh and confirm the entry remains.

## Phase 3 — Natural shortcuts

13. Search `2 eggs` and confirm two eggs are previewed.
14. Search `milk 1 cup` and confirm a one-cup result.
15. Search `chicken 6 oz` and confirm a 4-ounce chicken result converts to 1.5 servings.
16. Use Servings override and confirm it replaces the automatic amount.

## Phase 4 — Search order and actions

17. Favorite a logged food.
18. Search it again and confirm Favorite appears before other equivalent matches.
19. Confirm Recent foods and My foods appear before starter/online equivalents.
20. Save a packaged or starter result to My foods.
21. Confirm Log, Save, and Favorite actions behave correctly without duplicating saved definitions.

## Phase 5 — Packaged-food search

22. Type a branded packaged food and press Search packaged.
23. Confirm packaged results appear and remain labeled Database estimate / Open Food Facts.
24. Confirm a result shows its serving basis and nutrition preview.
25. Confirm a result with missing calories cannot be silently logged and offers Add label values.
26. Disconnect the internet and confirm local search still works.

## Phase 6 — Barcode tools

27. Open Barcode tools.
28. Enter a valid UPC/EAN number and run lookup.
29. Confirm the product loads into the unified results.
30. On a supported browser, test Use camera and Stop camera.
31. On an unsupported browser, confirm manual barcode entry remains available.

## Phase 7 — Duplicate protection and undo

32. Log a food and immediately try to log the identical item to the same meal again.
33. Confirm Pathfinder asks before creating the likely duplicate.
34. Remove a modern food entry.
35. Confirm the Undo bar appears.
36. Press Undo and confirm the entry and calorie totals return.

## Phase 8 — Manual fallback

37. Open “Can’t find it? Enter from a label or estimate.”
38. Enter an Exact label food with calories, protein, and fiber.
39. Log it and confirm the Exact label badge remains after refresh.
40. Confirm quick estimate buttons still fill the manual form.

## Phase 9 — Foundation and offline regression

41. Run Save test and confirm IndexedDB and rotating backups pass.
42. Export JSON and CSV.
43. Import the JSON backup and confirm unified-search foods, favorites, and entries return.
44. Open the installed app offline and confirm local search, logging, undo, and saved results work.
45. Confirm the four daily destinations remain in bottom navigation on phone and Settings remains in the header.

## Pass condition

The complete Pathfinder theme remains intact; local food search is instant; natural amounts preview accurately; online and barcode tools fail safely; nutrition gaps are visible; duplicate protection and undo work; Today remains synchronized; data, backups, and offline operation show no regression.
