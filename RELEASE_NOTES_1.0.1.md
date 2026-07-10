# Pathfinder 1.0.1 — Correctness and Safety

## Purpose

Address the full-audit findings that can be corrected safely without redesigning the storage architecture.

## What changed

### Correctness

- Fixed Release readiness to use real storage fields.
- Included primary and backup local saves in the readiness result.
- Save test now reports:
  - passed when both durable localStorage checks pass
  - degraded when only sessionStorage works
  - failed when neither works
- Selected meal adjustments now contribute calories, protein, and fiber.
- Editing meal nutrition now recalculates plan calories.
- Manual base-calorie edits remain possible.
- Navigation, copying, exporting, and maintenance actions no longer create blank daily records.

### Import and export safety

- Added a 4 MB import limit.
- Added object-shape and date-key validation.
- Blocked dangerous prototype-related keys.
- Added an import confirmation.
- Downloads and stores a pre-import backup before replacement.
- Added spreadsheet formula-injection protection to CSV cells.

### Privacy and defaults

- Corrected the Settings privacy statement.
- Explained what weather and online food search send externally.
- Removed Joshua-specific identity, body-stat, and location defaults from public source.
- Weather is off on a fresh installation.
- Existing user settings remain preserved during update.

### Documentation and cleanup

- Updated `README.md`.
- Replaced the outdated root roadmap with the authoritative 1.0-to-2.0 roadmap.
- Removed the obsolete bootstrap file from the service-worker asset list.
- The durable storage redesign remains scheduled for 1.1.

## Storage statement

1.0.1 does not redesign persistence. It keeps the passed 1.0 storage model so the current fixes can be verified independently before 1.1.

## Existing-data behavior

Existing settings and historical records override the new neutral defaults and should remain unchanged.
