/* Pathfinder 1.4.2 unified food-search helpers.
   Pure functions keep natural shortcuts, ranking, deduplication, barcode validation,
   and serving previews testable outside the browser UI.
*/

export const FOOD_SEARCH_ORIGIN_PRIORITY = {
  favorite: 500,
  recent: 400,
  saved: 300,
  starter: 200,
  online: 100
};

const FRACTIONS = { '¼': 0.25, '½': 0.5, '¾': 0.75 };
const UNIT_ALIASES = {
  x: 'serving', serving: 'serving', servings: 'serving',
  slice: 'slice', slices: 'slice', strip: 'strip', strips: 'strip',
  piece: 'piece', pieces: 'piece', egg: 'egg', eggs: 'egg',
  cup: 'cup', cups: 'cup', oz: 'oz', ounce: 'oz', ounces: 'oz',
  g: 'g', gram: 'g', grams: 'g', ml: 'ml',
  tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp'
};
const UNIT_PATTERN = '(?:x|servings?|slices?|strips?|pieces?|eggs?|cups?|oz|ounces?|g|grams?|ml|tbsp|tablespoons?|tsp|teaspoons?)';

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function parseAmount(value) {
  const text = String(value || '').trim();
  if (Object.prototype.hasOwnProperty.call(FRACTIONS, text)) return FRACTIONS[text];
  const fraction = text.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    return denominator ? Number(fraction[1]) / denominator : 0;
  }
  return safeNumber(text, 0);
}

export function normalizeFoodSearchText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9%]+/g, ' ')
    .trim();
}

function singularToken(value) {
  const token = String(value || '');
  if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.length > 3 && token.endsWith('es')) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s')) return token.slice(0, -1);
  return token;
}

export function foodSearchTokens(value = '') {
  return normalizeFoodSearchText(value).split(/\s+/).filter(Boolean).map(singularToken);
}

export function parseFoodQuery(value = '') {
  const original = String(value || '').trim();
  if (!original) return { original, query: '', amount: 1, unit: '', hasAmount: false };

  const amountPattern = '(\\d+(?:\\.\\d+)?|\\d+\\s*\\/\\s*\\d+|[¼½¾])';
  const leading = original.match(new RegExp(`^${amountPattern}\\s*(${UNIT_PATTERN})?\\s+(.+)$`, 'i'));
  if (leading) {
    const amount = parseAmount(leading[1]);
    const unit = leading[2] ? UNIT_ALIASES[leading[2].toLowerCase()] || leading[2].toLowerCase() : '';
    return { original, query: leading[3].trim(), amount: amount > 0 ? amount : 1, unit, hasAmount: amount > 0 };
  }

  const trailing = original.match(new RegExp(`^(.+?)\\s+(?:x\\s*)?${amountPattern}\\s*(${UNIT_PATTERN})?$`, 'i'));
  if (trailing) {
    const amount = parseAmount(trailing[2]);
    const unit = trailing[3] ? UNIT_ALIASES[trailing[3].toLowerCase()] || trailing[3].toLowerCase() : '';
    return { original, query: trailing[1].trim(), amount: amount > 0 ? amount : 1, unit, hasAmount: amount > 0 };
  }

  return { original, query: original, amount: 1, unit: '', hasAmount: false };
}

export function smartMealForHour(hour = new Date().getHours()) {
  const value = safeNumber(hour, 12);
  if (value < 11) return 'breakfast';
  if (value < 16) return 'lunch';
  if (value < 21) return 'dinner';
  return 'snack';
}

function servingAmountAndUnit(serving = '') {
  const text = String(serving || '').toLowerCase();
  const match = text.match(/(\d+(?:\.\d+)?|\d+\s*\/\s*\d+|[¼½¾])\s*(servings?|slices?|strips?|pieces?|eggs?|cups?|oz|ounces?|g|grams?|ml|tbsp|tablespoons?|tsp|teaspoons?)/i);
  if (!match) return { amount: 1, unit: '' };
  return {
    amount: Math.max(0.0001, parseAmount(match[1]) || 1),
    unit: UNIT_ALIASES[match[2].toLowerCase()] || match[2].toLowerCase()
  };
}

export function quantityForFoodQuery(parsed, item = {}) {
  if (!parsed?.hasAmount) return 1;
  if (!parsed.unit || parsed.unit === 'serving') return Math.max(0.05, parsed.amount);
  const serving = servingAmountAndUnit(item.serving);
  if (serving.unit && serving.unit === parsed.unit) return Math.max(0.05, parsed.amount / serving.amount);
  return Math.max(0.05, parsed.amount);
}

export function normalizeBarcode(value = '') {
  return String(value || '').replace(/\D+/g, '');
}

export function isLikelyFoodBarcode(value = '') {
  const digits = normalizeBarcode(value);
  return /^\d{8,14}$/.test(digits);
}

export function foodSearchIdentity(item = {}) {
  return [
    normalizeFoodSearchText(item.name),
    normalizeFoodSearchText(item.serving),
    Math.round(safeNumber(item.baseCalories ?? item.calories, 0) * 10) / 10,
    Math.round(safeNumber(item.baseProtein ?? item.protein, 0) * 10) / 10,
    Math.round(safeNumber(item.baseFiber ?? item.fiber, 0) * 10) / 10
  ].join('|');
}

function candidateText(item = {}) {
  return normalizeFoodSearchText(`${item.name || ''} ${item.brands || ''} ${item.serving || ''} ${item.category || ''} ${item.source || ''}`);
}

function matchScore(item, query) {
  if (!query) return 1;
  const normalizedQuery = normalizeFoodSearchText(query);
  const name = normalizeFoodSearchText(item.name || '');
  const haystack = candidateText(item);
  const tokens = foodSearchTokens(normalizedQuery);
  const hayTokens = new Set(foodSearchTokens(haystack));
  if (name === normalizedQuery) return 120;
  if (name.startsWith(normalizedQuery)) return 95;
  if (haystack.includes(normalizedQuery)) return 75;
  if (tokens.length && tokens.every(token => hayTokens.has(token) || haystack.includes(token))) return 55;
  if (tokens.some(token => hayTokens.has(token) || haystack.includes(token))) return 20;
  return 0;
}

export function rankUnifiedFoodResults({ query = '', favorites = [], recent = [], saved = [], starter = [], online = [], limit = 16 } = {}) {
  const parsed = parseFoodQuery(query);
  const cleanQuery = parsed.query;
  const groups = { favorite: favorites, recent, saved, starter, online };
  const ranked = [];

  Object.entries(groups).forEach(([origin, items]) => {
    (items || []).forEach((rawItem, index) => {
      if (!rawItem?.name) return;
      const score = matchScore(rawItem, cleanQuery);
      if (cleanQuery && score <= 0) return;
      const sourceId = String(rawItem.id || rawItem.foodId || `${index}`);
      ranked.push({
        ...rawItem,
        searchOrigin: origin,
        searchId: `${origin}:${sourceId}:${index}`,
        searchScore: (FOOD_SEARCH_ORIGIN_PRIORITY[origin] || 0) + score - index * 0.01
      });
    });
  });

  ranked.sort((a, b) => b.searchScore - a.searchScore || String(a.name).localeCompare(String(b.name)));
  const seen = new Set();
  const results = [];
  for (const item of ranked) {
    const identity = foodSearchIdentity(item);
    if (seen.has(identity)) continue;
    seen.add(identity);
    results.push(item);
    if (results.length >= Math.max(1, safeNumber(limit, 16))) break;
  }
  return { parsed, results };
}

export function foodLogPreview(item = {}, quantity = 1) {
  const amount = Math.max(0.05, safeNumber(quantity, 1));
  return {
    quantity: amount,
    calories: Math.round(safeNumber(item.baseCalories ?? item.calories, 0) * amount),
    protein: Math.round(safeNumber(item.baseProtein ?? item.protein, 0) * amount * 10) / 10,
    fiber: Math.round(safeNumber(item.baseFiber ?? item.fiber, 0) * amount * 10) / 10
  };
}

export function foodNutritionCompleteness(item = {}) {
  const calories = safeNumber(item.baseCalories ?? item.calories, 0);
  const protein = safeNumber(item.baseProtein ?? item.protein, 0);
  const fiber = safeNumber(item.baseFiber ?? item.fiber, 0);
  if (calories <= 0) return { status: 'missing', label: 'Nutrition incomplete', note: 'Calories are missing; verify the package label before logging.' };
  if (protein <= 0 && fiber <= 0) return { status: 'partial', label: 'Calories only', note: 'Protein and fiber are unavailable for this result.' };
  return { status: 'complete', label: 'Nutrition available', note: 'Calories, protein, and fiber are available.' };
}

export function isRecentDuplicate(entries = [], item = {}, meal = 'snack', now = Date.now(), windowMs = 120000) {
  const identity = foodSearchIdentity(item);
  return (entries || []).some(entry => {
    const createdAt = Date.parse(entry.createdAt || '');
    return entry.meal === meal && foodSearchIdentity(entry) === identity && Number.isFinite(createdAt) && now - createdAt >= 0 && now - createdAt <= windowMs;
  });
}
