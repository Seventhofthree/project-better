import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cloneEntriesForDate,
  entriesFromMealTemplate,
  foodBudgetSummary,
  foodEntryFromItem,
  foodEntryTotals,
  groupedFoodEntries,
  mealTemplateFromEntries,
  normalizeFoodEntry,
  nutritionSourceLabel,
  recentFoodChoices,
  rescaleFoodEntry
} from '../food-tracker.js';

test('food entries scale calories, protein, and fiber from partial servings', () => {
  const entry = foodEntryFromItem({ id: 'egg', name: 'Large egg', serving: '1 egg', calories: 72, protein: 6, fiber: 0 }, { quantity: 2.5, meal: 'breakfast', sourceType: 'exact_label' });
  assert.equal(entry.quantity, 2.5);
  assert.equal(entry.calories, 180);
  assert.equal(entry.protein, 15);
  assert.equal(entry.meal, 'breakfast');
  assert.equal(nutritionSourceLabel(entry.sourceType), 'Exact label');
});

test('rescaling an existing entry preserves per-serving nutrition', () => {
  const entry = normalizeFoodEntry({ id: 'milk', name: 'Whole milk', serving: '1 cup', quantity: 1, baseCalories: 149, baseProtein: 8, baseFiber: 0, sourceType: 'database_estimate' });
  const half = rescaleFoodEntry(entry, 0.5);
  assert.equal(half.calories, 75);
  assert.equal(half.protein, 4);
  assert.equal(half.baseCalories, 149);
});

test('daily totals combine individual food entries', () => {
  const totals = foodEntryTotals([
    normalizeFoodEntry({ name: 'Eggs', quantity: 2, baseCalories: 72, baseProtein: 6, meal: 'breakfast' }),
    normalizeFoodEntry({ name: 'English muffin', quantity: 1, baseCalories: 134, baseProtein: 5, baseFiber: 1, meal: 'breakfast' })
  ]);
  assert.equal(totals.calories, 278);
  assert.equal(totals.protein, 17);
  assert.equal(totals.fiber, 1);
  assert.equal(totals.entries, 2);
});

test('food budget keeps exercise separate and reports macro room', () => {
  const summary = foodBudgetSummary({ calorieGoal: 1500, proteinGoal: 100, fiberGoal: 30, totals: { calories: 980, protein: 72, fiber: 19 } });
  assert.equal(summary.caloriesRemaining, 520);
  assert.equal(summary.proteinRemaining, 28);
  assert.equal(summary.fiberRemaining, 11);
});

test('meal templates preserve component servings and replay as new entries', () => {
  const entries = [
    normalizeFoodEntry({ id: 'egg-log', foodId: 'egg', name: 'Large egg', serving: '1 egg', quantity: 2, baseCalories: 72, baseProtein: 6, meal: 'breakfast', sourceType: 'exact_label' }),
    normalizeFoodEntry({ id: 'bacon-log', foodId: 'bacon', name: 'Bacon', serving: '1 slice', quantity: 3, baseCalories: 43, baseProtein: 3, meal: 'breakfast', sourceType: 'exact_label' })
  ];
  const template = mealTemplateFromEntries({ id: 'breakfast-template', name: 'Bacon and eggs', meal: 'breakfast', entries });
  assert.equal(template.entries.length, 2);
  assert.equal(template.calories, 273);
  const replayed = entriesFromMealTemplate(template);
  assert.equal(replayed.length, 2);
  assert.equal(replayed[0].meal, 'breakfast');
  assert.notEqual(replayed[0].id, entries[0].id);
});

test('repeating a previous day creates independent entry ids', () => {
  const source = [normalizeFoodEntry({ id: 'old', name: 'Chicken breast', quantity: 1, baseCalories: 187, baseProtein: 35, meal: 'dinner' })];
  const copied = cloneEntriesForDate(source, { prefix: 'yesterday' });
  assert.equal(copied[0].calories, 187);
  assert.notEqual(copied[0].id, 'old');
});

test('recent foods deduplicate equivalent entries and keep newest use', () => {
  const days = {
    '2026-07-12': { meals: { entries: [normalizeFoodEntry({ id: 'older', foodId: 'egg', name: 'Large egg', serving: '1 egg', quantity: 1, baseCalories: 72, baseProtein: 6 })] } },
    '2026-07-13': { meals: { entries: [normalizeFoodEntry({ id: 'newer', foodId: 'egg', name: 'Large egg', serving: '1 egg', quantity: 2, baseCalories: 72, baseProtein: 6 })] } }
  };
  const recent = recentFoodChoices(days, 8);
  assert.equal(recent.length, 1);
  assert.equal(recent[0].lastUsed, '2026-07-13');
});

test('grouped food entries keep meal slots separate', () => {
  const groups = groupedFoodEntries([
    normalizeFoodEntry({ name: 'Milk', meal: 'breakfast', baseCalories: 149 }),
    normalizeFoodEntry({ name: 'Chicken', meal: 'dinner', baseCalories: 187 }),
    normalizeFoodEntry({ name: 'Snack', meal: 'snack', baseCalories: 100 })
  ]);
  assert.equal(groups.breakfast.length, 1);
  assert.equal(groups.dinner.length, 1);
  assert.equal(groups.snack.length, 1);
});
