# Pathfinder Roadmap: 1.0 to 2.0

## North star

Pathfinder should become deeper, calmer, and more useful rather than wider.

Target navigation:

```text
Today
Food
Movement
Progress
Settings
```

No new capability automatically earns a top-level tab. New depth should appear inside the four main sections or only when context makes it relevant.

## 1.0.1 — Correctness and Safety

Fix the known 1.0 correctness, privacy, import, CSV, documentation, and blank-record issues without redesigning storage.

**Status: completed and passed.**

## 1.1 — Durable Data Foundation

- Snapshot meal nutrition when logged
- Snapshot routine and workout definitions
- Keep historical meaning immutable going forward
- Validate and migrate storage candidates one at a time
- Fall back to healthy backups
- Add rotating last-known-good backups
- Store daily records separately in IndexedDB
- Debounce text saves
- Preserve complete import/export
- Split storage and history logic into native modules
- Add automated storage, migration, calculation, startup, and rendering tests

**Status: completed and passed.**

## 1.2 — Calm Navigation

Consolidate eleven tabs into:

- Today
- Food
- Movement
- Progress
- Settings

Existing features remain available as nested views.

**Status: current release under user verification.**

## 1.3 — Today-First Daily Flow

**Status: next.**

Make Today the main operating screen with time-aware morning, afternoon, and evening guidance. Most normal days should be completed without leaving Today.

## 1.4 — Food Depth

Strengthen today’s food logging, meal plans, serving sizes, recent foods, favorites, partial meals, swaps, and nutrition-source labels.

## 1.5 — Movement Depth

Combine today’s workout, exercise guidance, plan progression, quiet alternatives, recovery logic, and explainable recommendations.

## 1.6 — Progress and Review Depth

Strengthen trend views, historical detail, daily and weekly reviews, confidence labels, comparisons, and grounded recommendations.

## 1.7 — Personalization Without Clutter

Add schedule, priority, tone, display, and card-order preferences without adding primary navigation.

## 1.8 — Accessibility and PWA Hardening

Improve labels, focus behavior, keyboard support, reduced motion, screen-reader support, icons, offline fallback, caching, and update behavior.

## 1.9 — 2.0 Release Candidate

Freeze visible features and run full regression, migration, long-history, recovery, accessibility, offline, phone, tablet, and desktop testing.

## 2.0 — Integrated Companion

Pathfinder 2.0 should answer four questions:

```text
Today: What matters now?
Food: What have I eaten, and what is next?
Movement: What should I do today?
Progress: What direction am I moving?
```

Core requirements:

- Four-section navigation
- Today-first operation
- Immutable historical meaning
- Durable local database
- Reliable backup and recovery
- Fast logging
- Explainable recommendations
- Strong offline behavior
- Accessible interaction
- Automated regression coverage
- Clear privacy boundaries
- No account requirement

## Deliberately excluded before 2.0

- Additional primary tabs
- Social feeds
- Public profiles
- Competitive leaderboards
- Account requirement
- Medical diagnosis
- Integrations before the data foundation is ready
