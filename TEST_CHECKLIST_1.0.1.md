# Pathfinder 1.0.1 Test Checklist

## Update and existing data

1. Open the 1.0.1 test URL.
2. Confirm existing saved data is still present.
3. Confirm existing name, body settings, weather location, and goals were not reset.
4. Open every current tab.
5. Open Settings.

## Settings and save diagnostics

6. Confirm the 1.0.1 Correctness & Safety card appears.
7. Confirm Release readiness identifies primary and backup local saves as readable.
8. Run Save test.
9. Confirm it begins with `passed`, not merely a session-storage pass.

## Nutrition

10. Open a meal and select one of the built-in adjustments.
11. Confirm the meal becomes swapped.
12. Confirm daily calories, protein, and fiber change by the adjustment.
13. Edit one planned meal’s calories.
14. Confirm Base calories recalculates to the sum of the three meals.
15. Edit Base calories directly and confirm the manual value remains.

## Blank-day protection

16. Select a date with no saved entry.
17. Use navigation, Copy review, Copy companion packet, Export CSV, and Export backup.
18. Return to History and confirm those maintenance actions did not create a meaningful daily record.

## Import safety

19. Export a normal JSON backup.
20. Import it.
21. Confirm Pathfinder asks for approval.
22. Confirm a pre-import JSON backup downloads.
23. Confirm the import succeeds and data remains.
24. Cancel a second import and confirm no data changes.

## CSV protection

25. Enter a note beginning with `=`.
26. Export CSV.
27. Confirm the spreadsheet displays it as text rather than executing it as a formula.

## Refresh and offline shell

28. Refresh the page.
29. Confirm saved data remains.
30. Confirm Today and Settings still open normally.
31. Confirm the app still opens from its installed shortcut or offline cache.

## Pass condition

All checks pass with no lost or altered existing data.
