# Pathfinder 0.8.2

Pathfinder is a local-first daily companion app for meals, movement, routines, progress, and weekly guidance.

## What changed in 0.8.2

0.8.2 fixes the layout issue you found and keeps the 0.8.1 fixes:

- Form fields now stay inside their cards on tablet/desktop views
- Unstyled text inputs are now dark themed instead of showing white browser defaults
- Routine cards wrap into readable columns instead of squeezing text
- Exercise guide cards now have different simple visual diagrams instead of reusing one picture
- Morning/night grooming routines are restored in the Routine Builder, including oral care, face/skin care, hand/foot/lip care, and weekly nails/feet reset
- Existing 0.8 local data will be migrated so the grooming routine items are added back instead of requiring a reset

## What changed in 0.8

0.8 focuses on making Pathfinder more useful before cloud sync:

- Beginner exercise guide with plain-English instructions
- Movement detail cards with what it should feel like, common mistakes, easier/harder versions, and stop rules
- Exercise tab now links directly into the Guide tab
- MyFitnessPal-style “At this pace” projection
- Projection uses the logged food average, maintenance estimate, and current/latest weight
- Projection shows a range and a confidence note instead of pretending the math is exact
- Meals tab now shows plan vs actual and a projection card
- Weekly review now has clearer sections: scoreboard, weight/projection, what went well, what got in the way, next-week focus, and coach note
- AI-ready weekly packet can be copied from the Review tab for future AI analysis
- 0.9 is reserved for cloud sync
- 1.0 is reserved for Health Connect / device integration

## Run locally

Double-click `index.html` for a quick test.

For the better install/offline test, open a terminal in this folder and run:

```bash
python -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

## Data storage

Pathfinder 0.8 still stores data in the browser using local storage. Nothing leaves the browser unless you export it.

Use **Settings → Export backup** before replacing older builds or testing risky changes.

## Upgrade note

0.8 can import/migrate data from the 0.7 local-storage key in the same browser. If you are switching devices, export a backup from the old device and import it into 0.8.

## Testing checklist

- Open Today and use **Do quick check-in**
- Log breakfast/lunch/dinner as planned, swapped, or skipped
- Add one “ate something else” food log
- Open Exercise and tap **Open guide**
- Open at least three exercise guide cards
- Mark movement as full, minimum, recovery, or missed
- Add weight and check the Progress projection
- Open Review and copy both the normal review and AI packet
- Export a JSON backup from Settings

## Roadmap after 0.8

- **0.9:** cloud sync, login, same data on phone/tablet/PC
- **1.0:** Health Connect, steps/activity/sleep import, polished installable release
