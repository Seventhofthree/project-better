/* Pathfinder 1.1 history snapshot model.
   Pure helpers keep logged meals, routines, and workouts historically stable.
*/

export const HISTORY_SNAPSHOT_VERSION = 1;

function clone(value) {
  if (value === undefined) return undefined;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function number(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildPlanSnapshot(plan, capturedAt = new Date().toISOString()) {
  const meals = plan?.meals || {};
  const summedCalories = Object.values(meals).reduce((sum, meal) => sum + number(meal?.calories), 0);
  const summedProtein = Object.values(meals).reduce((sum, meal) => sum + number(meal?.protein), 0);
  const summedFiber = Object.values(meals).reduce((sum, meal) => sum + number(meal?.fiber), 0);
  return {
    snapshotVersion: HISTORY_SNAPSHOT_VERSION,
    planName: String(plan?.planName || ''),
    baseCalories: number(plan?.baseCalories) || summedCalories,
    baseMacros: {
      protein: number(plan?.baseMacros?.protein) || summedProtein,
      fat: number(plan?.baseMacros?.fat),
      carbs: number(plan?.baseMacros?.carbs),
      fiber: number(plan?.baseMacros?.fiber) || summedFiber
    },
    capturedAt
  };
}

export function buildMealSnapshot({ key, status, meal, swap = null, capturedAt = new Date().toISOString() }) {
  const normalizedStatus = String(status || '');
  const base = {
    label: String(meal?.label || meal?.shortLabel || key || ''),
    shortLabel: String(meal?.shortLabel || meal?.label || key || ''),
    calories: number(meal?.calories),
    protein: number(meal?.protein),
    fiber: number(meal?.fiber),
    items: Array.isArray(meal?.items) ? clone(meal.items) : []
  };
  const adjustment = swap ? {
    id: String(swap.id || ''),
    name: String(swap.name || ''),
    calories: number(swap.calories),
    protein: number(swap.protein),
    fiber: number(swap.fiber),
    use: String(swap.use || '')
  } : null;

  const active = normalizedStatus === 'planned' || (normalizedStatus === 'swapped' && Boolean(adjustment));
  const includeAdjustment = normalizedStatus === 'swapped' && adjustment;
  return {
    snapshotVersion: HISTORY_SNAPSHOT_VERSION,
    key: String(key || ''),
    status: normalizedStatus,
    label: base.label,
    base,
    adjustment,
    calories: active ? base.calories + (includeAdjustment ? adjustment.calories : 0) : 0,
    protein: active ? base.protein + (includeAdjustment ? adjustment.protein : 0) : 0,
    fiber: active ? base.fiber + (includeAdjustment ? adjustment.fiber : 0) : 0,
    capturedAt
  };
}

export function mealSnapshotNutrient(day, key, nutrient) {
  const snapshot = day?.meals?.snapshots?.[key];
  const currentStatus = day?.meals?.statuses?.[key] || '';
  if (!snapshot || snapshot.status !== currentStatus) return null;
  const value = Number(snapshot[nutrient]);
  return Number.isFinite(value) ? value : 0;
}

export function buildRoutineSnapshot({ modeKey, mode, blocks, capturedAt = new Date().toISOString() }) {
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  const items = safeBlocks.flatMap(block => (Array.isArray(mode?.[block]) ? mode[block] : []).map(item => ({
    id: String(item?.id || ''),
    text: String(item?.text || ''),
    minutes: number(item?.minutes) || 1,
    block
  })));
  return {
    snapshotVersion: HISTORY_SNAPSHOT_VERSION,
    modeKey: String(modeKey || ''),
    label: String(mode?.label || modeKey || 'Routine'),
    items,
    capturedAt
  };
}

export function routineItemsFromSnapshot(day) {
  const items = day?.routine?.snapshot?.items;
  return Array.isArray(items) ? items : null;
}

export function routineCompletionFromSnapshot(day, fallbackItems = []) {
  const items = routineItemsFromSnapshot(day) || fallbackItems;
  if (!items.length) return 0;
  const completedIds = day?.routine?.completedIds || {};
  const completed = items.filter(item => completedIds[item.id]).length;
  return Math.round((completed / items.length) * 100);
}

export function buildWorkoutSnapshot(workout, capturedAt = new Date().toISOString()) {
  if (!workout) return null;
  return {
    snapshotVersion: HISTORY_SNAPSHOT_VERSION,
    id: String(workout.id || ''),
    title: String(workout.title || ''),
    focus: String(workout.focus || ''),
    level: number(workout.level),
    quiet: Boolean(workout.quiet),
    bestFor: String(workout.bestFor || ''),
    full: clone(workout.full || workout.fullSteps || []),
    minimum: clone(workout.minimum || workout.minimumSteps || []),
    recovery: clone(workout.recovery || workout.recoverySteps || []),
    capturedAt
  };
}

export function backfillHistorySnapshots(day, context = {}) {
  if (!day || typeof day !== 'object') return false;
  const capturedAt = day.createdAt || context.capturedAt || new Date().toISOString();
  let changed = false;

  day.meals = day.meals || {};
  day.meals.snapshots = day.meals.snapshots || {};
  const statuses = day.meals.statuses || {};
  const hasFoodHistory = Object.values(statuses).some(Boolean) || (Array.isArray(day.meals.customItems) && day.meals.customItems.length > 0);
  if (hasFoodHistory && !day.meals.planSnapshot) {
    day.meals.planSnapshot = buildPlanSnapshot(context.plan || {}, capturedAt);
    changed = true;
  }

  for (const key of context.mealKeys || []) {
    const status = statuses[key] || '';
    if (!status || day.meals.snapshots[key]) continue;
    const swapId = day.meals.swaps?.[key] || '';
    const swap = (context.swaps || []).find(item => item.id === swapId) || null;
    day.meals.snapshots[key] = buildMealSnapshot({
      key,
      status,
      meal: context.plan?.meals?.[key] || {},
      swap,
      capturedAt
    });
    changed = true;
  }

  day.routine = day.routine || { completedIds: {} };
  const hasRoutineHistory = Object.values(day.routine.completedIds || {}).some(Boolean);
  if (hasRoutineHistory && !day.routine.snapshot) {
    day.routine.snapshot = buildRoutineSnapshot({
      modeKey: context.routineModeKey,
      mode: context.routineMode || {},
      blocks: context.routineBlocks || [],
      capturedAt
    });
    changed = true;
  }

  day.exercise = day.exercise || {};
  const hasWorkoutHistory = Boolean(
    day.exercise.status ||
    day.exercise.version ||
    day.exercise.completed ||
    day.exercise.minutes ||
    day.exercise.notes ||
    day.exercise.pain ||
    day.exercise.soreness
  );
  if (hasWorkoutHistory && !day.exercise.snapshot) {
    const workout = (context.workouts || []).find(item => item.id === day.exercise.workoutId) || context.defaultWorkout || null;
    day.exercise.snapshot = buildWorkoutSnapshot(workout, capturedAt);
    changed = true;
  }

  day.history = day.history || {};
  if (day.history.snapshotVersion !== HISTORY_SNAPSHOT_VERSION) {
    day.history.snapshotVersion = HISTORY_SNAPSHOT_VERSION;
    day.history.migratedAt = context.migratedAt || new Date().toISOString();
    day.history.migrationNote = 'Legacy records were frozen using the definitions available during Pathfinder 1.1 migration.';
    changed = true;
  }
  return changed;
}
