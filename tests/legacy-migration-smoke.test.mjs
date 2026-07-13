import test from 'node:test';
import assert from 'node:assert/strict';
import { installFakeIndexedDb, installFakeLocalStorage } from './fake-indexeddb.mjs';

test('a 1.0.1 localStorage state migrates into the durable foundation and opens in 1.3 with frozen history', async () => {
  installFakeIndexedDb();
  installFakeLocalStorage();
  const sessionValues = new Map();
  globalThis.sessionStorage = {
    getItem: key => sessionValues.get(key) ?? null,
    setItem: (key, value) => sessionValues.set(key, String(value)),
    removeItem: key => sessionValues.delete(key)
  };

  const legacyState = {
    version: '1.0.1',
    meta: { createdAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-07-09T20:00:00.000Z' },
    settings: { name: 'Migration Test', routineMode: 'workday', calorieGoal: 1500 },
    plan: {
      planName: 'Legacy plan',
      baseCalories: 1500,
      baseMacros: { protein: 90, fat: 30, carbs: 200, fiber: 30 },
      meals: {
        breakfast: { label: 'Legacy breakfast', shortLabel: 'Breakfast', calories: 410, protein: 25, fiber: 10, items: [] },
        lunch: { label: 'Legacy lunch', shortLabel: 'Lunch', calories: 540, protein: 30, fiber: 10, items: [] },
        dinner: { label: 'Legacy dinner', shortLabel: 'Dinner', calories: 550, protein: 35, fiber: 10, items: [] }
      }
    },
    days: {
      '2026-07-09': {
        key: '2026-07-09',
        createdAt: '2026-07-09T12:00:00.000Z',
        meals: {
          statuses: { breakfast: 'planned', lunch: '', dinner: '' },
          notes: { breakfast: '', lunch: '', dinner: '' },
          customItems: [],
          swaps: {}
        },
        exercise: { status: 'minimum', workoutId: 'chair-posture', version: 'minimum', completed: true, minutes: 5, intensity: 'comfortable', soreness: '', pain: '', notes: '' },
        checkin: { energy: 'Okay', mood: '', sleep: '', stress: '', hunger: '', water: 2, notes: '' },
        windDown: { completed: false, calmMinutes: '', note: '' },
        routine: { completedIds: { 'm-brush-teeth': true } },
        weight: 300,
        dailyNote: 'Legacy history'
      }
    }
  };
  localStorage.setItem('pathfinder.state.v8', JSON.stringify(legacyState));

  class FakeClassList { toggle() {} add() {} remove() {} }
  class FakeElement {
    constructor(id = '') { this.id = id; this.value = ''; this.innerHTML = ''; this.textContent = ''; this.classList = new FakeClassList(); this.style = {}; }
    addEventListener() {}
    appendChild() {}
    insertAdjacentHTML(position, html) { this.innerHTML = position === 'afterbegin' ? String(html) + this.innerHTML : this.innerHTML + String(html); }
    remove() {}
    click() {}
    focus() {}
    scrollIntoView() {}
    querySelector() { return null; }
  }
  const elements = new Map(['app', 'date-picker', 'page-title', 'prev-day', 'next-day', 'today-btn'].map(id => [id, new FakeElement(id)]));
  const toastTemplate = new FakeElement('toast-template');
  toastTemplate.content = { firstElementChild: { cloneNode: () => new FakeElement('toast') } };
  elements.set('toast-template', toastTemplate);
  const listeners = {};
  const head = new FakeElement('head');
  head.appendChild = element => { if (element.id) elements.set(element.id, element); };
  const body = new FakeElement('body');
  body.appendChild = () => {};
  globalThis.document = {
    head,
    body,
    visibilityState: 'visible',
    querySelector(selector) { return selector.startsWith('#') ? elements.get(selector.slice(1)) || null : null; },
    querySelectorAll() { return []; },
    createElement() { return new FakeElement(); },
    addEventListener(type, callback) { listeners[type] = callback; }
  };
  globalThis.window = globalThis;
  window.__PATHFINDER_RELEASE__ = { release: '1.3 Today-First Daily Flow', coreAppVersion: '1.3', serviceWorkerCache: 'pathfinder-1.3' };
  window.addEventListener = () => {};
  window.matchMedia = () => ({ matches: false });
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: true, storage: { persist: async () => true } }, configurable: true });
  Object.defineProperty(globalThis, 'location', { value: { protocol: 'http:' }, configurable: true });
  globalThis.confirm = () => true;
  globalThis.fetch = async () => { throw new Error('Network disabled in migration smoke test'); };

  const foundation = await import('../data-foundation.js');
  await import(`../app.js?legacy-smoke=${Date.now()}`);
  await new Promise(resolve => setTimeout(resolve, 220));

  const candidates = await foundation.loadFoundationCandidates();
  const primary = candidates.find(candidate => candidate.source === 'IndexedDB primary');
  assert.ok(primary);
  assert.equal(primary.state.settings.name, 'Migration Test');
  assert.equal(primary.state.version, '1.3');
  assert.equal(primary.state.schemaVersion, 2);
  const migratedDay = primary.state.days['2026-07-09'];
  assert.equal(migratedDay.meals.snapshots.breakfast.calories, 410);
  assert.equal(migratedDay.meals.planSnapshot.baseCalories, 1500);
  assert.ok(migratedDay.routine.snapshot.items.some(item => item.id === 'm-brush-teeth'));
  assert.equal(migratedDay.exercise.snapshot.id, 'chair-posture');
  assert.equal(migratedDay.history.snapshotVersion, 1);
  assert.equal(localStorage.getItem('pathfinder.state.v8'), JSON.stringify(legacyState));

  const diagnostics = await foundation.getFoundationDiagnostics();
  assert.equal(diagnostics.primaryExists, true);
  assert.equal(diagnostics.dayCount >= 1, true);
  assert.equal(diagnostics.backupCount >= 1, true);

  listeners.click({ target: { closest(selector) { return selector === '[data-tab]' ? { dataset: { tab: 'settings' } } : null; } } });
  assert.match(elements.get('app').innerHTML, /legacy localStorage primary → 1\.1 foundation/);
});
