# Pathfinder 1.4.2

Pathfinder is a local-first daily companion for food, movement, routines, progress, and review.

## Current release

**1.4.2 — Unified Food Search & Quick Log**

Pathfinder’s calorie tracker now starts with one question:

```text
What did you eat?
```

Typing in that box searches, in order:

1. Favorites
2. Recent foods
3. My foods
4. Pathfinder starter foods
5. Cached packaged-food results

Search is local and instant. Packaged-food search only runs when the user presses **Search packaged**.

### Natural shortcuts

Examples:

```text
3 bacon
2 eggs
milk 1 cup
chicken 6 oz
```

Pathfinder recognizes the amount, matches the food, converts compatible serving units, and shows the calorie/protein/fiber total before logging.

### Packaged food and barcodes

- Deliberate online packaged-food search
- Manual UPC/EAN barcode lookup
- Optional camera barcode scan when the browser supports it
- Nutrition-completeness warnings
- Manual package-label fallback
- Cached packaged results for later reuse

### Logging safety and speed

- Smart meal default based on time of day
- Optional servings override
- One-tap Log, Save, and Favorite actions
- Duplicate warning for an identical food logged moments earlier
- Undo after removing a food entry
- Source labels remain visible
- Foods with missing calories cannot be silently logged

## Existing 1.4 features retained

- Individual foods, drinks, snacks, and extras
- Partial and multiple servings
- Editable quantity and meal assignment
- Daily calories, protein, and fiber targets
- Favorites and recent foods
- Reusable meals
- Repeat yesterday or one meal
- Optional meal-plan compatibility
- CSV and JSON exports
- Exercise calories remain separate from the food budget

## Data impact

There is **no new data-schema migration** in 1.4.2.

```text
Application schema: 3
IndexedDB foundation: unchanged
Daily records: unchanged
Backup format: unchanged
```

Existing food entries, favorites, recent history, reusable meals, settings, frozen meal snapshots, and backups remain compatible.

## Navigation

```text
Today
Food
Movement
Progress
⚙ Settings
```

The unified logger lives in **Food → Today’s Food**. The detailed food library and optional plans remain under **Food → Plan & Library**.

## Local development

```bash
npm test
npm run check
```

The app remains static and can be hosted through GitHub Pages without a build step.
