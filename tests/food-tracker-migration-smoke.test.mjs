import test from 'node:test';
import assert from 'node:assert/strict';
import { installFakeIndexedDb, installFakeLocalStorage } from './fake-indexeddb.mjs';

test('a 1.3 state migrates to schema 3 without losing legacy food logs or saved meals', async () => {
  installFakeIndexedDb();
  installFakeLocalStorage();
  const sessionValues = new Map();
  globalThis.sessionStorage = {
    getItem: key => sessionValues.get(key) ?? null,
    setItem: (key, value) => sessionValues.set(key, String(value)),
    removeItem: key => sessionValues.delete(key)
  };

  const state13 = {
    version: '1.3',
    schemaVersion: 2,
    meta: { createdAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-07-12T22:00:00.000Z' },
    settings: { name: 'Food Migration', calorieGoal: 1500, routineMode: 'workday' },
    plan: {
      planName: 'Flexible plan',
      baseCalories: 1500,
      baseMacros: { protein: 90, fiber: 30 },
      meals: {
        breakfast: { label: 'Breakfast', shortLabel: 'Breakfast', calories: 400, protein: 25, fiber: 5, items: [] },
        lunch: { label: 'Lunch', shortLabel: 'Lunch', calories: 500, protein: 30, fiber: 10, items: [] },
        dinner: { label: 'Dinner', shortLabel: 'Dinner', calories: 600, protein: 35, fiber: 15, items: [] }
      }
    },
    foods: [{ id: 'label-food', name: 'Label food', serving: '1 package', calories: 240, protein: 20, fiber: 3, category: 'Saved' }],
    savedMeals: [{ id: 'custom-saved', name: 'Chicken dinner', calories: 450, protein: 40, fiber: 6, notes: 'User-created in 1.3.' }],
    swaps: [],
    workouts: [],
    routines: {},
    days: {
      '2026-07-12': {
        key: '2026-07-12',
        meals: {
          statuses: { breakfast: '', lunch: 'swapped', dinner: '' },
          notes: { breakfast: '', lunch: 'Ate out', dinner: '' },
          customItems: [{ id: 'legacy-lunch', name: 'Restaurant lunch', meal: 'lunch', calories: 650, protein: 25, fiber: 4, source: 'Quick estimate' }],
          swaps: {},
          snapshots: {},
          planSnapshot: null
        },
        exercise: { status: '', workoutId: '', completed: false },
        checkin: {}, windDown: {}, routine: { completedIds: {} }, weight: '', dailyNote: ''
      }
    }
  };
  localStorage.setItem('pathfinder.state.v8', JSON.stringify(state13));

  class FakeClassList { toggle() {} add() {} remove() {} }
  class FakeElement {
    constructor(id = '') { this.id = id; this.value = ''; this.innerHTML = ''; this.textContent = ''; this.classList = new FakeClassList(); this.style = {}; }
    addEventListener() {} appendChild() {} remove() {} click() {} focus() {} scrollIntoView() {}
    insertAdjacentHTML(position, html) { this.innerHTML = position === 'afterbegin' ? String(html) + this.innerHTML : this.innerHTML + String(html); }
    querySelector() { return null; }
  }
  const elements = new Map(['app', 'date-picker', 'page-title', 'prev-day', 'next-day', 'today-btn'].map(id => [id, new FakeElement(id)]));
  const toastTemplate = new FakeElement('toast-template');
  toastTemplate.content = { firstElementChild: { cloneNode: () => new FakeElement('toast') } };
  elements.set('toast-template', toastTemplate);
  const listeners = {};
  const head = new FakeElement('head');
  const body = new FakeElement('body');
  globalThis.document = {
    head, body, visibilityState: 'visible',
    querySelector(selector) { return selector.startsWith('#') ? elements.get(selector.slice(1)) || null : null; },
    querySelectorAll() { return []; }, createElement() { return new FakeElement(); },
    addEventListener(type, callback) { listeners[type] = callback; }
  };
  globalThis.window = globalThis;
  window.__PATHFINDER_RELEASE__ = { release: '1.4 Food Depth & Calorie Tracking', coreAppVersion: '1.4', serviceWorkerCache: 'pathfinder-1.4' };
  window.addEventListener = () => {};
  window.matchMedia = () => ({ matches: false });
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: true, storage: { persist: async () => true } }, configurable: true });
  Object.defineProperty(globalThis, 'location', { value: { protocol: 'http:' }, configurable: true });
  globalThis.fetch = async () => { throw new Error('Network disabled'); };
  globalThis.confirm = () => true;

  const foundation = await import('../data-foundation.js');
  await import(`../app.js?food-migration=${Date.now()}`);
  await new Promise(resolve => setTimeout(resolve, 500));

  const primary = (await foundation.loadFoundationCandidates()).find(candidate => candidate.source === 'IndexedDB primary');
  assert.ok(primary);
  assert.equal(primary.state.version, '1.4');
  assert.equal(primary.state.schemaVersion, 3);
  assert.equal(primary.state.settings.proteinGoal, 100);
  assert.equal(primary.state.settings.fiberGoal, 30);
  assert.deepEqual(primary.state.favoriteFoods, []);
  assert.equal(primary.state.mealTemplates.length, 1);
  assert.equal(primary.state.mealTemplates[0].name, 'Chicken dinner');
  assert.equal(primary.state.mealTemplates[0].calories, 450);
  assert.deepEqual(primary.state.days['2026-07-12'].meals.entries, []);
  assert.equal(primary.state.days['2026-07-12'].meals.customItems[0].calories, 650);
  assert.equal(primary.state.foods[0].sourceType, 'personal_estimate');
});
