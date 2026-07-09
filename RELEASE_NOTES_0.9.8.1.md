# Pathfinder 0.9.8.1 Settings Hotfix

## Purpose

Fix the Settings render break introduced in 0.9.8.

## What broke

The new Release readiness card expected storage diagnostics as an object, but the existing app returns diagnostics as a list. That caused Settings to crash while rendering.

## What changed

- `APP_VERSION` is now `0.9.8.1`.
- Fixed Release readiness card to read the existing diagnostics list safely.
- Kept 0.9.8 bug sweep items.
- Kept 0.9.7 mobile/PWA polish.
- No persistence behavior was changed.

## Done When

- Existing saved data survives the update.
- Settings opens.
- Release readiness card appears.
- Save test passes.
- Review copy still works.
- Assistant companion packet copy still works.
- Refresh still preserves data.
