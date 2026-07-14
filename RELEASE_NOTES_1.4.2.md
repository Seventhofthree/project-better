# Pathfinder 1.4.2 — Unified Food Search & Quick Log

## Purpose

Replace the manual-first Quick Food Entry experience with one search-first calorie-logging workflow.

## Added

- One unified “What did you eat?” search box
- Instant local search across favorites, recent foods, saved foods, and starter foods
- Deliberate packaged-food search
- Natural shortcuts such as `3 bacon`, `2 eggs`, `milk 1 cup`, and `chicken 6 oz`
- Serving-unit conversion when a shortcut and food serving use the same unit
- Smart default meal based on time of day
- Calories, protein, and fiber preview before logging
- Manual UPC/EAN barcode lookup
- Optional camera barcode scan when supported
- Product nutrition-completeness warnings
- Package-label fallback for incomplete products
- One-tap Log, Save, and Favorite controls
- Recent duplicate warning
- Undo for removed modern food entries
- Cached packaged-food results
- New `food-search.js` pure helper module
- Automated visual-system regression test to prevent the full theme from being replaced again

## Changed

- Manual label/estimate entry is now a collapsed fallback instead of the main logger.
- Food database search remains available in Plan & Library, but Today’s Food uses the unified logger.
- Open packaged results use stable barcode-based IDs when available.
- Online results distinguish serving nutrition from per-100-gram nutrition.

## Data impact

None. Pathfinder remains on application schema 3 and the passed 1.1 IndexedDB foundation.
