import test from 'node:test';
import assert from 'node:assert/strict';
import { installFakeIndexedDb, installFakeLocalStorage } from './fake-indexeddb.mjs';

const fakeDatabases = installFakeIndexedDb();
installFakeLocalStorage();

const foundation = await import('../data-foundation.js');

function makeState() {
  return {
    version: '1.1',
    schemaVersion: 2,
    meta: { createdAt: '2026-07-10T00:00:00.000Z', updatedAt: '2026-07-10T12:00:00.000Z' },
    settings: { calorieGoal: 1500 },
    days: {
      '2026-07-09': { key: '2026-07-09', weight: 300 },
      '2026-07-10': { key: '2026-07-10', weight: 299 }
    }
  };
}

test('IndexedDB foundation persists shell, separate days, backup, and emergency metadata', async () => {
  const state = makeState();
  await foundation.persistFoundationState(state, { allDays: true, forceBackup: true, backupReason: 'test-initial' });

  const candidates = await foundation.loadFoundationCandidates();
  assert.equal(candidates[0].source, 'IndexedDB primary');
  assert.deepEqual(candidates[0].state.days, state.days);
  assert.ok(candidates.some(candidate => candidate.source.includes('last-known-good')));

  const diagnostics = await foundation.getFoundationDiagnostics();
  assert.equal(diagnostics.available, true);
  assert.equal(diagnostics.primaryExists, true);
  assert.equal(diagnostics.dayCount, 2);
  assert.equal(diagnostics.backupCount, 1);
  assert.equal(diagnostics.pointerExists, true);
  assert.equal(diagnostics.emergencyShellExists, true);
});


test('a malformed primary remains rejectable while a healthy rotating backup is available', async () => {
  const db = fakeDatabases.get(foundation.FOUNDATION_DB_NAME);
  const dayStore = db._stores.get('days');
  dayStore.records.set('invalid-day-key', { key: 'invalid-day-key', day: {} });

  const candidates = await foundation.loadFoundationCandidates();
  const primary = candidates.find(candidate => candidate.source === 'IndexedDB primary');
  const backup = candidates.find(candidate => candidate.source.includes('last-known-good'));
  assert.throws(() => foundation.validateFoundationState(primary.state), /Invalid foundation day key/);
  assert.doesNotThrow(() => foundation.validateFoundationState(backup.state));

  dayStore.records.delete('invalid-day-key');
});

test('a one-day save updates only the dirty day and keeps other records', async () => {
  const state = makeState();
  state.meta.updatedAt = '2026-07-10T13:00:00.000Z';
  state.days['2026-07-10'].weight = 298.5;
  delete state.days['2026-07-09'];

  await foundation.persistFoundationState(state, { dayKeys: ['2026-07-10'] });
  const primary = (await foundation.loadFoundationCandidates()).find(candidate => candidate.source === 'IndexedDB primary');
  assert.equal(primary.state.days['2026-07-10'].weight, 298.5);
  assert.equal(primary.state.days['2026-07-09'].weight, 300);
});

test('foundation save test verifies IndexedDB and emergency metadata', async () => {
  const result = await foundation.runFoundationSaveTest();
  assert.equal(result.status, 'passed');
  assert.equal(result.indexedDbPassed, true);
  assert.equal(result.localMetadataPassed, true);
});

test('forced backup rotation keeps no more than three recovery copies', async () => {
  for (let index = 0; index < 5; index += 1) {
    const state = makeState();
    state.meta.updatedAt = new Date(Date.UTC(2026, 6, 10, 14, index)).toISOString();
    await foundation.persistFoundationState(state, { allDays: true, forceBackup: true, backupReason: `rotation-${index}` });
  }
  const diagnostics = await foundation.getFoundationDiagnostics();
  assert.equal(diagnostics.backupCount, 3);
});
