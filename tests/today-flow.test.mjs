import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calorieBudgetSummary,
  currentMealForPhase,
  todayPhaseDefinition,
  todayPhaseForHour
} from '../today-flow.js';

test('Today phase boundaries match the intended morning, afternoon, and evening flow', () => {
  assert.equal(todayPhaseForHour(0, true), 'morning');
  assert.equal(todayPhaseForHour(10, true), 'morning');
  assert.equal(todayPhaseForHour(11, true), 'betweenLunchDinner');
  assert.equal(todayPhaseForHour(16, true), 'betweenLunchDinner');
  assert.equal(todayPhaseForHour(17, true), 'evening');
  assert.equal(todayPhaseForHour(23, true), 'evening');
});

test('a non-current selected date uses factual review mode', () => {
  assert.equal(todayPhaseForHour(9, false), 'review');
  assert.equal(todayPhaseDefinition('review').label, 'Saved day');
});

test('each live phase points to the relevant meal', () => {
  assert.equal(currentMealForPhase('morning'), 'breakfast');
  assert.equal(currentMealForPhase('betweenLunchDinner'), 'lunch');
  assert.equal(currentMealForPhase('evening'), 'dinner');
  assert.equal(currentMealForPhase('review'), '');
});

test('calorie budget starts with the full target when nothing is logged', () => {
  const budget = calorieBudgetSummary({ goal: 1500, logged: 0, loggedEntries: 0 });
  assert.equal(budget.remaining, 1500);
  assert.equal(budget.status, 'empty');
  assert.equal(budget.progressPercent, 0);
});

test('calorie budget reports remaining food room from logged intake', () => {
  const budget = calorieBudgetSummary({ goal: 1500, logged: 980, loggedEntries: 4 });
  assert.equal(budget.remaining, 520);
  assert.equal(budget.status, 'within');
  assert.equal(Math.round(budget.progressPercent), 65);
});

test('calorie budget distinguishes near-target, over-target, and missing-target states', () => {
  assert.equal(calorieBudgetSummary({ goal: 1500, logged: 1400, loggedEntries: 3 }).status, 'near');
  const over = calorieBudgetSummary({ goal: 1500, logged: 1725, loggedEntries: 5 });
  assert.equal(over.status, 'over');
  assert.equal(over.remaining, -225);
  assert.equal(calorieBudgetSummary({ goal: 0, logged: 400, loggedEntries: 1 }).status, 'unconfigured');
});
