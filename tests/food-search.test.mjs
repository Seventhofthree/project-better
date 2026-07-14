import test from 'node:test';
import assert from 'node:assert/strict';
import {
  foodLogPreview,
  foodNutritionCompleteness,
  isLikelyFoodBarcode,
  isRecentDuplicate,
  normalizeBarcode,
  parseFoodQuery,
  quantityForFoodQuery,
  rankUnifiedFoodResults,
  smartMealForHour
} from '../food-search.js';

test('natural food shortcuts recognize counts, units, and trailing amounts', () => {
  assert.deepEqual(parseFoodQuery('3 strips bacon'), { original: '3 strips bacon', query: 'bacon', amount: 3, unit: 'strip', hasAmount: true });
  assert.deepEqual(parseFoodQuery('milk 1 cup'), { original: 'milk 1 cup', query: 'milk', amount: 1, unit: 'cup', hasAmount: true });
  assert.equal(parseFoodQuery('2 eggs').query, 'eggs');
  assert.equal(parseFoodQuery('2 eggs').amount, 2);
  assert.equal(parseFoodQuery('1% milk').hasAmount, false);
});

test('ounce shortcuts convert to the serving size of the selected food', () => {
  const parsed = parseFoodQuery('chicken 6 oz');
  assert.equal(quantityForFoodQuery(parsed, { serving: '4 oz' }), 1.5);
  assert.equal(quantityForFoodQuery(parseFoodQuery('3 bacon'), { serving: '1 slice' }), 3);
});

test('smart meal defaults follow the expected dayparts', () => {
  assert.equal(smartMealForHour(8), 'breakfast');
  assert.equal(smartMealForHour(13), 'lunch');
  assert.equal(smartMealForHour(18), 'dinner');
  assert.equal(smartMealForHour(23), 'snack');
});

test('unified ranking prioritizes favorites, then recent, saved, starter, and online', () => {
  const base = { name: 'Cooked bacon', serving: '1 slice', calories: 43, protein: 3, fiber: 0 };
  const ranked = rankUnifiedFoodResults({
    query: 'bacon',
    favorites: [{ ...base, id: 'favorite' }],
    recent: [{ ...base, id: 'recent' }],
    saved: [{ ...base, id: 'saved' }],
    starter: [{ ...base, id: 'starter' }],
    online: [{ ...base, id: 'online' }]
  });
  assert.equal(ranked.results.length, 1);
  assert.equal(ranked.results[0].searchOrigin, 'favorite');
});

test('plural searches match singular food names', () => {
  const ranked = rankUnifiedFoodResults({
    query: '2 eggs',
    starter: [{ id: 'egg', name: 'Large egg', serving: '1 egg', calories: 72, protein: 6, fiber: 0 }]
  });
  assert.equal(ranked.results.length, 1);
  assert.equal(ranked.results[0].name, 'Large egg');
});

test('food previews calculate calories and macros before logging', () => {
  const preview = foodLogPreview({ calories: 43, protein: 3, fiber: 0 }, 3);
  assert.deepEqual(preview, { quantity: 3, calories: 129, protein: 9, fiber: 0 });
});

test('nutrition completeness prevents zero-calorie database records from being logged silently', () => {
  assert.equal(foodNutritionCompleteness({ calories: 0 }).status, 'missing');
  assert.equal(foodNutritionCompleteness({ calories: 120, protein: 0, fiber: 0 }).status, 'partial');
  assert.equal(foodNutritionCompleteness({ calories: 120, protein: 20, fiber: 0 }).status, 'complete');
});

test('barcode helpers accept common UPC and EAN lengths', () => {
  assert.equal(normalizeBarcode('0 12345-67890 5'), '012345678905');
  assert.equal(isLikelyFoodBarcode('012345678905'), true);
  assert.equal(isLikelyFoodBarcode('1234567'), false);
  assert.equal(isLikelyFoodBarcode('not a barcode'), false);
});

test('duplicate detection only warns for an equivalent food logged moments ago in the same meal', () => {
  const now = Date.now();
  const item = { name: 'Cooked bacon', serving: '1 slice', calories: 43, protein: 3, fiber: 0 };
  const entries = [{ ...item, meal: 'breakfast', createdAt: new Date(now - 30000).toISOString() }];
  assert.equal(isRecentDuplicate(entries, item, 'breakfast', now), true);
  assert.equal(isRecentDuplicate(entries, item, 'lunch', now), false);
  assert.equal(isRecentDuplicate(entries, item, 'breakfast', now + 300000), false);
});
