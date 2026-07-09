# Pathfinder 0.9.0 Update Safety

## Purpose

Make future updates safer, easier to verify, and easier to debug.

## What changed

- `APP_VERSION` is now `0.9.0`.
- Settings now includes an **Update safety** card.
- Settings now includes a **Storage debug** card.
- Added one-click **Run save test**.
- Added **Copy debug info** for quick troubleshooting.
- Storage diagnostics show:
  - localStorage primary
  - localStorage backup
  - sessionStorage refresh fallback
  - saved version
  - meaningful day count
  - last saved timestamp
  - approximate size
- Existing 0.8.8.5 storage fallback behavior remains.
- Existing 0.8.8.6 startup migration fix remains.
- Existing 0.8.9 read-only day cleanup remains.

## Why this matters

The save bug took too long because the app did not show what it had actually saved or loaded. 0.9.0 gives Pathfinder a built-in diagnostic panel so future updates can be verified faster.

## Done When

- Existing saved data survives the update.
- Settings shows Update safety.
- Run save test passes.
- Copy debug info works or prints to console if clipboard is blocked.
- Meal changes still survive refresh.
- Exercise changes still survive refresh.
- History/Review/Progress still work.
