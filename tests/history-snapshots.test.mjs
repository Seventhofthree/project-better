import test from 'node:test';
import assert from 'node:assert/strict';
import {
  backfillHistorySnapshots,
  buildMealSnapshot,
  buildPlanSnapshot,
  buildRoutineSnapshot,
  mealSnapshotNutrient,
  routineCompletionFromSnapshot
} from '../history-snapshots.js';

function makePlan() { return {
  planName: 'Test plan',
  baseCalories: 1500,
  baseMacros: { protein: 90, fiber: 30 },
  meals: {
    breakfast: { label: 'Breakfast', calories: 400, protein: 25, fiber: 10 },
    lunch: { label: 'Lunch', calories: 500, protein: 30, fiber: 10 },
    dinner: { label: 'Dinner', calories: 600, protein: 35, fiber: 10 }
  }
}; }

test('planned meal snapshot remains fixed after plan edits', () => {
  const plan = makePlan();
  const day = { meals: { statuses: { breakfast: 'planned' }, snapshots: {} } };
  day.meals.snapshots.breakfast = buildMealSnapshot({ key: 'breakfast', status: 'planned', meal: plan.meals.breakfast });
  plan.meals.breakfast.calories = 999;
  assert.equal(mealSnapshotNutrient(day, 'breakfast', 'calories'), 400);
});

test('saved adjustment snapshot adds its nutrition to the planned meal', () => {
  const plan = makePlan();
  const snapshot = buildMealSnapshot({
    key: 'lunch',
    status: 'swapped',
    meal: plan.meals.lunch,
    swap: { id: 'extra-egg', name: 'Extra egg', calories: 70, protein: 6, fiber: 0 }
  });
  assert.equal(snapshot.calories, 570);
  assert.equal(snapshot.protein, 36);
});

test('custom replacement status without a saved adjustment does not double count the planned meal', () => {
  const plan = makePlan();
  const snapshot = buildMealSnapshot({ key: 'dinner', status: 'swapped', meal: plan.meals.dinner, swap: null });
  assert.equal(snapshot.calories, 0);
  assert.equal(snapshot.protein, 0);
});

test('plan snapshot remains fixed after target changes', () => {
  const plan = makePlan();
  const snapshot = buildPlanSnapshot(plan);
  plan.baseCalories = 1800;
  assert.equal(snapshot.baseCalories, 1500);
});

test('routine completion uses captured routine items instead of a later edited list', () => {
  const mode = { label: 'Workday', morning: [{ id: 'a', text: 'A', minutes: 1 }], evening: [{ id: 'b', text: 'B', minutes: 1 }] };
  const day = {
    routine: {
      completedIds: { a: true },
      snapshot: buildRoutineSnapshot({ modeKey: 'workday', mode, blocks: ['morning', 'evening'] })
    }
  };
  assert.equal(routineCompletionFromSnapshot(day, [{ id: 'different' }]), 50);
});

test('legacy day backfill creates meal, plan, routine, and workout snapshots once', () => {
  const plan = makePlan();
  const day = {
    key: '2026-07-10',
    createdAt: '2026-07-10T12:00:00.000Z',
    meals: { statuses: { breakfast: 'planned', lunch: '', dinner: '' }, swaps: {}, customItems: [], snapshots: {} },
    routine: { completedIds: { a: true } },
    exercise: { status: 'minimum', workoutId: 'w1', minutes: 5 }
  };
  const changed = backfillHistorySnapshots(day, {
    plan,
    swaps: [],
    workouts: [{ id: 'w1', title: 'Workout one' }],
    routineModeKey: 'workday',
    routineMode: { label: 'Workday', morning: [{ id: 'a', text: 'A', minutes: 1 }] },
    routineBlocks: ['morning'],
    mealKeys: ['breakfast', 'lunch', 'dinner']
  });
  assert.equal(changed, true);
  assert.equal(day.meals.snapshots.breakfast.calories, 400);
  assert.equal(day.routine.snapshot.items.length, 1);
  assert.equal(day.exercise.snapshot.id, 'w1');
  assert.equal(day.history.snapshotVersion, 1);
});
