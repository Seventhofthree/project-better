import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assembleState,
  newestBackups,
  stripDays,
  validateFoundationState
} from '../data-foundation.js';

const state = {
  version: '1.1',
  settings: { calorieGoal: 1500 },
  meta: { updatedAt: '2026-07-10T12:00:00.000Z' },
  days: {
    '2026-07-09': { key: '2026-07-09', weight: 300 },
    '2026-07-10': { key: '2026-07-10', weight: 299 }
  }
};

test('state shell and daily records can be separated and reassembled', () => {
  const shell = stripDays(state);
  assert.equal('days' in shell, false);
  const restored = assembleState(shell, Object.entries(state.days).map(([key, day]) => ({ key, day })));
  assert.deepEqual(restored.days, state.days);
  assert.equal(restored.settings.calorieGoal, 1500);
});

test('foundation validation accepts a valid separated-state result', () => {
  assert.deepEqual(validateFoundationState(state), { dayCount: 2 });
});

test('foundation validation rejects invalid day keys and records', () => {
  assert.throws(() => validateFoundationState({ settings: {}, days: { bad: {} } }), /Invalid foundation day key/);
  assert.throws(() => validateFoundationState({ settings: {}, days: { '2026-99-99': {} } }), /Invalid foundation day key/);
  assert.throws(() => validateFoundationState({ settings: {}, days: { '2026-07-10': null } }), /Invalid foundation day record/);
  assert.throws(() => validateFoundationState({ settings: {}, days: { '2026-07-10': { key: '2026-07-09' } } }), /Mismatched foundation day key/);
});

test('backup rotation keeps the three newest records', () => {
  const records = [
    { id: 'one', createdAt: '2026-07-01T00:00:00Z' },
    { id: 'four', createdAt: '2026-07-04T00:00:00Z' },
    { id: 'two', createdAt: '2026-07-02T00:00:00Z' },
    { id: 'three', createdAt: '2026-07-03T00:00:00Z' }
  ];
  assert.deepEqual(newestBackups(records).map(item => item.id), ['four', 'three', 'two']);
});
