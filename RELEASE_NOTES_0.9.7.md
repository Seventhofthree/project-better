# Pathfinder 0.9.7 Mobile / PWA Polish

## Purpose

Make Pathfinder easier to use on a phone and clearer as an installable/offline local-first app.

## What changed

- `APP_VERSION` is now `0.9.7`.
- Added a Mobile / app status card in Settings.
- Added compact mode toggle.
- Added online/offline toast messages.
- Added update habit card in Settings.
- Injected mobile polish styles from `app.js` so the existing `styles.css` file is not replaced.
- Mobile improvements:
  - larger tap targets
  - better mobile input font sizing
  - sticky horizontal tab bar
  - improved date controls on small screens
  - single-column mobile layouts
  - safer canvas sizing
  - compact mode styles
- Kept 0.9.6 assistant layer.
- Kept 0.9.5 food/calorie counter polish.
- Kept 0.9.4 review polish.
- Kept 0.9.3 progress trend polish.
- Kept 0.9.2 exercise/routine polish.
- Kept 0.9.1 meal dashboard polish.
- No persistence behavior was changed.

## Why this matters

Pathfinder is meant to live on phone, tablet, and PC. This release makes the phone experience less cramped and gives clearer feedback about offline/app status.

## Done When

- Existing saved data survives the update.
- Today page opens on phone/PC.
- Tabs are easier to scroll/tap on mobile.
- Settings opens.
- Mobile / app status card appears.
- Compact mode toggle works.
- Run save test still passes.
- Refresh still preserves data.
- App still opens from the versioned link.
