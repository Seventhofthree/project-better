# Pathfinder 0.8.8 Data Safety Cleanup

## Purpose

Make Pathfinder safer before adding more features.

This release focuses on one thing: reduce the chance that simply viewing History, Review, Progress, or Assistant creates and saves fake blank day records.

## What changed

- Updates visible release to `0.8.8 Data Safety Cleanup`.
- Updates `index.html` to load `persistence-bootstrap.js?v=0.8.8`.
- Updates `service-worker.js` cache to `pathfinder-0.8.8`.
- The bootstrap now runtime-patches the current `app.js` before it runs.
- `getDay()` no longer saves immediately when it creates a day.
- Adds a runtime `peekDay()` helper for read-only views.
- Weekly stats and History now use `peekDay()` instead of creating real saved day records.
- `saveState()` now prunes empty auto-created days before writing to storage.
- Adds a **Data safety** card in Settings.
- Adds **Download best backup** and **Repair from best backup** buttons.

## Why it matters

0.8.7 fixed startup restore order, but the main app could still create blank day records while rendering read-only screens. This patch reduces that risk without doing the larger 0.8.9 file split yet.

## Known limitation

This is a runtime patch over the existing `app.js` file. The actual `app.js` source file has not been fully rewritten yet. That cleanup is planned for 0.8.9.

## Done When / Test Before Moving On

- Settings shows `0.8.8 Data Safety Cleanup`.
- Settings shows Runtime patch `0.8.8`.
- Settings shows the Data safety card.
- Opening History does not create a bunch of new saved blank days.
- Opening Review does not create a bunch of new saved blank days.
- Meal logging survives refresh.
- Exercise logging survives refresh.
- Weight entry survives refresh.
- Download best backup creates a JSON file.
- Phone and PC both show the same version.
