# Pathfinder 0.8.8.1 Save Reliability Fix

## Purpose

Fix the failed 0.8.8 patch immediately.

0.8.8 showed the version correctly, but normal logging did not reliably save. That fails the release gate because saving data is the entire point of Pathfinder.

## What changed

- Visible release becomes `0.8.8.1 Save Reliability Fix`.
- Service worker cache becomes `pathfinder-0.8.8.1`.
- `index.html` loads `persistence-bootstrap.js?v=0.8.8.1`.
- `persistence-bootstrap.js` loads `app.js` normally again.
- The risky 0.8.8 runtime patch is removed.
- The Settings version card remains.
- The Settings Data safety card remains.
- Download best backup remains.
- Repair from best backup remains.
- Startup restore from localStorage/backup/IndexedDB remains.

## Why it matters

We are choosing reliable saving over clever cleanup. The blank-day cleanup still matters, but it should be done by editing the real `app.js` source in 0.8.9, not by runtime-patching it at startup.

## Done When / Test Before Moving On

- Settings shows `0.8.8.1 Save Reliability Fix`.
- Runtime patch says `removed`.
- Data safety card appears.
- Meal status logging survives refresh.
- Meal note or swap survives refresh.
- Exercise logging survives refresh.
- Water/check-in survives refresh.
- Weight entry survives refresh from the normal daily/progress flow, not only Settings.
- Download best backup creates a JSON file.
- Phone and PC both show the same version.

## Decision

0.8.8 is marked failed.
0.8.8.1 is the forward fix.
0.8.9 should edit and split the real source files instead of runtime-patching `app.js`.
