/* Pathfinder 1.4 food-tracker helpers.
   Pure functions keep quantity math, source labels, daily totals, and reusable templates testable.
*/

export const FOOD_MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];

export const NUTRITION_SOURCES = {
  exact_label: { label: 'Exact label', detail: 'Copied from the package or restaurant nutrition label.' },
  database_estimate: { label: 'Database estimate', detail: 'Estimated from a food database or Pathfinder starter value.' },
  personal_estimate: { label: 'Personal estimate', detail: 'Entered or adjusted by you.' },
  planned_value: { label: 'Planned value', detail: 'Taken from an optional Pathfinder meal template.' }
};

export function normalizeNutritionSource(value) {
  return Object.prototype.hasOwnProperty.call(NUTRITION_SOURCES, value) ? value : 'personal_estimate';
}

export function nutritionSourceLabel(value) {
  return NUTRITION_SOURCES[normalizeNutritionSource(value)].label;
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function rounded(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(safeNumber(value) * factor) / factor;
}

export function normalizeFoodEntry(entry = {}) {
  const quantity = Math.max(0.05, safeNumber(entry.quantity || entry.servings || 1));
  const baseCalories = Math.max(0, safeNumber(entry.baseCalories ?? entry.calories / quantity ?? entry.calories));
  const baseProtein = Math.max(0, safeNumber(entry.baseProtein ?? entry.protein / quantity ?? entry.protein));
  const baseFiber = Math.max(0, safeNumber(entry.baseFiber ?? entry.fiber / quantity ?? entry.fiber));
  const meal = FOOD_MEALS.includes(entry.meal) ? entry.meal : 'snack';
  const sourceType = normalizeNutritionSource(entry.sourceType);
  return {
    id: String(entry.id || `food-${Date.now()}-${Math.random().toString(16).slice(2)}`),
    foodId: String(entry.foodId || ''),
    name: String(entry.name || 'Food'),
    meal,
    serving: String(entry.serving || '1 serving'),
    quantity,
    baseCalories: rounded(baseCalories, 2),
    baseProtein: rounded(baseProtein, 2),
    baseFiber: rounded(baseFiber, 2),
    calories: Math.round(baseCalories * quantity),
    protein: rounded(baseProtein * quantity),
    fiber: rounded(baseFiber * quantity),
    sourceType,
    sourceLabel: String(entry.sourceLabel || nutritionSourceLabel(sourceType)),
    templateId: String(entry.templateId || ''),
    createdAt: String(entry.createdAt || new Date().toISOString())
  };
}

export function foodEntryFromItem(item = {}, { quantity = 1, meal = 'snack', sourceType, sourceLabel, prefix = 'food', templateId = '' } = {}) {
  const normalizedSource = normalizeNutritionSource(sourceType || item.sourceType || inferSourceType(item.source));
  return normalizeFoodEntry({
    id: `${prefix}-${item.id || 'item'}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    foodId: item.id || '',
    name: item.name || 'Food',
    meal,
    serving: item.serving || '1 serving',
    quantity,
    baseCalories: item.baseCalories ?? item.calories ?? 0,
    baseProtein: item.baseProtein ?? item.protein ?? 0,
    baseFiber: item.baseFiber ?? item.fiber ?? 0,
    sourceType: normalizedSource,
    sourceLabel: sourceLabel || item.sourceLabel || nutritionSourceLabel(normalizedSource),
    templateId
  });
}

export function inferSourceType(source = '') {
  const text = String(source).toLowerCase();
  if (text.includes('label')) return 'exact_label';
  if (text.includes('open food facts')) return 'database_estimate';
  if (text.includes('starter') || text.includes('database')) return 'database_estimate';
  if (text.includes('plan') || text.includes('template')) return 'planned_value';
  return 'personal_estimate';
}

export function rescaleFoodEntry(entry, quantity) {
  return normalizeFoodEntry({ ...entry, quantity: Math.max(0.05, safeNumber(quantity)) });
}

export function foodEntryTotals(entries = []) {
  return (entries || []).reduce((totals, rawEntry) => {
    const entry = normalizeFoodEntry(rawEntry);
    totals.calories += entry.calories;
    totals.protein += entry.protein;
    totals.fiber += entry.fiber;
    totals.entries += 1;
    return totals;
  }, { calories: 0, protein: 0, fiber: 0, entries: 0 });
}

export function groupedFoodEntries(entries = []) {
  const groups = Object.fromEntries(FOOD_MEALS.map(meal => [meal, []]));
  (entries || []).forEach(entry => {
    const normalized = normalizeFoodEntry(entry);
    groups[normalized.meal].push(normalized);
  });
  return groups;
}

export function cloneEntriesForDate(entries = [], { meal, templateId = '', prefix = 'repeat' } = {}) {
  return (entries || []).map(rawEntry => {
    const entry = normalizeFoodEntry(rawEntry);
    return normalizeFoodEntry({
      ...entry,
      id: `${prefix}-${entry.foodId || 'item'}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      meal: FOOD_MEALS.includes(meal) ? meal : entry.meal,
      templateId: templateId || entry.templateId,
      createdAt: new Date().toISOString()
    });
  });
}

export function mealTemplateFromEntries({ id, name, meal = 'snack', entries = [], note = '' } = {}) {
  const normalizedEntries = cloneEntriesForDate(entries, { meal, prefix: 'template-source' }).map(entry => ({
    foodId: entry.foodId,
    name: entry.name,
    serving: entry.serving,
    quantity: entry.quantity,
    baseCalories: entry.baseCalories,
    baseProtein: entry.baseProtein,
    baseFiber: entry.baseFiber,
    sourceType: entry.sourceType,
    sourceLabel: entry.sourceLabel
  }));
  const totals = foodEntryTotals(normalizedEntries);
  return {
    id: String(id || `template-${Date.now()}`),
    name: String(name || 'Saved meal'),
    meal: FOOD_MEALS.includes(meal) ? meal : 'snack',
    note: String(note || ''),
    entries: normalizedEntries,
    calories: Math.round(totals.calories),
    protein: rounded(totals.protein),
    fiber: rounded(totals.fiber),
    createdAt: new Date().toISOString()
  };
}

export function entriesFromMealTemplate(template = {}, mealOverride = '') {
  const meal = FOOD_MEALS.includes(mealOverride) ? mealOverride : FOOD_MEALS.includes(template.meal) ? template.meal : 'snack';
  if (Array.isArray(template.entries) && template.entries.length) {
    return cloneEntriesForDate(template.entries, { meal, templateId: template.id || '', prefix: 'template' });
  }
  return [foodEntryFromItem({
    id: template.id || 'template',
    name: template.name || 'Saved meal',
    serving: '1 saved meal',
    calories: template.calories || 0,
    protein: template.protein || 0,
    fiber: template.fiber || 0,
    sourceType: 'planned_value'
  }, { meal, sourceType: 'planned_value', sourceLabel: 'Planned value', prefix: 'template', templateId: template.id || '' })];
}

export function recentFoodChoices(days = {}, limit = 8) {
  const seen = new Map();
  Object.keys(days || {}).sort().reverse().forEach(dayKey => {
    const entries = days[dayKey]?.meals?.entries || [];
    entries.forEach(rawEntry => {
      const entry = normalizeFoodEntry(rawEntry);
      const key = `${entry.foodId || entry.name.toLowerCase()}|${entry.serving}|${entry.baseCalories}|${entry.baseProtein}|${entry.baseFiber}`;
      if (!seen.has(key)) seen.set(key, { ...entry, lastUsed: dayKey });
    });
  });
  return Array.from(seen.values()).slice(0, Math.max(0, Number(limit) || 0));
}

export function foodBudgetSummary({ calorieGoal = 0, proteinGoal = 0, fiberGoal = 0, totals = {} } = {}) {
  const calories = Math.max(0, safeNumber(totals.calories));
  const protein = Math.max(0, safeNumber(totals.protein));
  const fiber = Math.max(0, safeNumber(totals.fiber));
  return {
    calorieGoal: Math.max(0, safeNumber(calorieGoal)),
    proteinGoal: Math.max(0, safeNumber(proteinGoal)),
    fiberGoal: Math.max(0, safeNumber(fiberGoal)),
    calories,
    protein,
    fiber,
    caloriesRemaining: safeNumber(calorieGoal) - calories,
    proteinRemaining: Math.max(0, safeNumber(proteinGoal) - protein),
    fiberRemaining: Math.max(0, safeNumber(fiberGoal) - fiber)
  };
}
