# Pathfinder 1.3 Test Checklist

## Phase 1 — Startup and preservation

1. Open the versioned 1.3 URL.
2. Confirm Today loads without a display guard.
3. Confirm existing settings, foods, routines, workouts, and history remain.
4. Refresh and confirm data remains.

## Phase 2 — Today-first header

5. Confirm the left card shows the current phase: Morning, Afternoon, or Evening.
6. Confirm the right card prominently shows calories remaining.
7. Confirm the calorie target and logged calories are correct.
8. Confirm Today, Food, Movement, Progress, and the separate Settings gear remain unchanged.

## Phase 3 — Food from Today

9. Use the Food now card to mark the current meal Ate plan.
10. Confirm logged calories and calories remaining update immediately.
11. Change the status to Swapped or Skipped and confirm totals react correctly.
12. Open full Food and confirm the same status is present.
13. Refresh and confirm the status remains.

## Phase 4 — Movement and routine from Today

14. Log Minimum movement from Today.
15. Confirm the Movement card becomes completed.
16. Complete one visible routine item from Today.
17. Open the full routine board and confirm it is completed there.
18. Refresh and confirm both records remain.

## Phase 5 — Check-in and wind-down

19. Open Quick check-in and record energy, sleep, stress, hunger, water, and a one-line note.
20. Confirm the check-in collapses to a recorded summary after refresh.
21. Open Wind-down, add a note, and mark it done.
22. Confirm the evening recap appears and survives refresh.

## Phase 6 — Saved-day review

23. Select a past date.
24. Confirm the phase changes to Saved day.
25. Confirm live Morning/Afternoon/Evening instructions are not applied to that date.
26. Confirm Day overview opens for factual review.

## Phase 7 — Foundation regression

27. Open Settings.
28. Confirm the Pathfinder 1.3 Today-First Daily Flow card appears.
29. Confirm the 1.2.1 Calm Navigation and 1.1 Durable Data Foundation cards remain.
30. Run Save test and confirm it passes.
31. Export a JSON backup.

## Phase 8 — Phone and offline

32. Confirm Today’s main cards stack cleanly on phone.
33. Confirm the four daily destinations remain in the bottom navigation and Settings remains in the header.
34. Open offline and confirm Today, saved data, calories remaining, and all four daily destinations work.

## Pass condition

Existing data remains intact, Today supports the normal daily workflow, calories remaining updates correctly, time-aware phases make sense, historical dates stay factual, and the durable foundation shows no regression.
