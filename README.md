# Pathfinder 1.4

Pathfinder is a local-first daily companion for food, movement, routines, progress, and review.

## Current release

**1.4 — Food Depth & Calorie Tracking**

Food now centers what was actually eaten rather than requiring one hard-coded meal plan.

### Today’s Food

- Individual foods, drinks, snacks, and extras
- Partial and multiple serving quantities
- Editable quantity and meal assignment after logging
- Daily calories logged and calories remaining
- Protein and fiber targets
- Favorites and recent foods
- Reusable meals made from food entries
- Repeat all of yesterday or one meal from yesterday
- Starter food search plus optional Open Food Facts packaged-food search
- Nutrition-source labels on every modern entry

### Nutrition sources

```text
Exact label
Database estimate
Personal estimate
Planned value
```

Package labels are the best choice for packaged foods. Database and personal estimates remain useful for consistency but are not medical precision.

### Plans are optional

The existing meal plan remains available as a template and compatibility layer. **Ate plan** still works, including frozen historical nutrition, but individual food entries are now the primary workflow.

### Today integration

The calories-remaining card on Today reads from:

- Individual 1.4 food entries
- Preserved legacy extra-food records
- Frozen planned-meal records when Ate plan is used

Exercise calories remain separate and do not automatically increase the food budget.

## Data migration

Pathfinder 1.4 updates the application data schema from 2 to 3.

- Existing 1.3 history remains intact.
- Existing meal statuses and frozen snapshots remain intact.
- Existing extra-food logs remain intact as legacy entries.
- Existing saved meals become reusable meal templates.
- New daily food entries are stored inside the existing separate IndexedDB day record.
- The 1.1 rotating backups and emergency metadata remain unchanged.
- JSON backup and restore includes entries, favorites, targets, and reusable meals.

Export a fresh 1.3 JSON backup before upgrading.

## Navigation

```text
Today
Food
Movement
Progress
⚙ Settings
```

Food contains **Today’s Food** and **Plan & Library**. Meal plans and saved foods no longer create additional top-level navigation.

## Local development

```bash
npm test
npm run check
```

The app remains static and can be hosted through GitHub Pages without a build step.
