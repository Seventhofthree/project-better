import test from 'node:test';
import assert from 'node:assert/strict';
import { installFakeIndexedDb, installFakeLocalStorage } from './fake-indexeddb.mjs';

test('Pathfinder 1.2.1 starts, renders Today, and opens nested sections with foundation diagnostics', async () => {
  installFakeIndexedDb();
  installFakeLocalStorage();
  const sessionValues = new Map();
  globalThis.sessionStorage = {
    getItem: key => sessionValues.get(key) ?? null,
    setItem: (key, value) => sessionValues.set(key, String(value)),
    removeItem: key => sessionValues.delete(key)
  };

  class FakeClassList { toggle() {} add() {} remove() {} }
  class FakeElement {
    constructor(id = '') {
      this.id = id;
      this.value = '';
      this.innerHTML = '';
      this.textContent = '';
      this.classList = new FakeClassList();
      this.style = {};
    }
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
  window.__PATHFINDER_RELEASE__ = { release: '1.2.1 Calm Navigation', coreAppVersion: '1.2.1', serviceWorkerCache: 'pathfinder-1.2.1' };
  window.addEventListener = () => {};
  window.matchMedia = () => ({ matches: false });
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: true, storage: { persist: async () => true } }, configurable: true });
  Object.defineProperty(globalThis, 'location', { value: { protocol: 'http:' }, configurable: true });
  globalThis.confirm = () => true;
  globalThis.fetch = async () => { throw new Error('Network disabled in smoke test'); };

  const foundation = await import('../data-foundation.js');
  await import(`../app.js?smoke=${Date.now()}`);
  await new Promise(resolve => setTimeout(resolve, 160));

  assert.match(elements.get('app').innerHTML, /Today needs/);
  assert.match(elements.get('app').innerHTML, /Inside Today/);
  assert.match(elements.get('app').innerHTML, /Routines/);
  assert.equal(typeof listeners.click, 'function');

  listeners.click({
    target: {
      closest(selector) {
        if (selector === '[data-section]') return { dataset: { section: 'food' } };
        return null;
      }
    }
  });
  assert.match(elements.get('app').innerHTML, /Inside Food/);
  assert.match(elements.get('app').innerHTML, /Today’s Food/);
  assert.match(elements.get('app').innerHTML, /logged calories/);

  listeners.click({
    target: {
      closest(selector) {
        if (selector === '[data-section]') return { dataset: { section: 'settings' } };
        return null;
      }
    }
  });

  assert.match(elements.get('app').innerHTML, /Pathfinder 1\.2\.1 Calm Navigation/);
  assert.match(elements.get('app').innerHTML, /Pathfinder 1\.1 Durable Data Foundation/);
  assert.match(elements.get('app').innerHTML, /IndexedDB foundation/);
  assert.match(elements.get('app').innerHTML, /Last-known-good backups/);

  const dispatchAction = dataset => listeners.click({
    target: {
      closest(selector) {
        if (selector === '[data-tab]') return null;
        if (selector === '[data-action]') return { dataset };
        return null;
      }
    }
  });

  dispatchAction({ action: 'jump', tabTarget: 'today' });
  dispatchAction({ action: 'meal-status', meal: 'breakfast', status: 'planned' });
  assert.match(elements.get('app').innerHTML, />440<\/span><span class="label">logged calories/);

  listeners.change({
    target: {
      id: '',
      value: '441',
      dataset: { planMeal: 'breakfast', mealField: 'calories' }
    }
  });
  assert.match(elements.get('app').innerHTML, />440<\/span><span class="label">logged calories/);

  listeners.change({
    target: {
      id: '',
      value: 'extra-fruit',
      dataset: { mealSwap: 'breakfast' }
    }
  });

  dispatchAction({ action: 'jump', tabTarget: 'meals' });
  assert.match(elements.get('app').innerHTML, /Frozen log/);
  assert.match(elements.get('app').innerHTML, /440 kcal · 30g protein/);

  dispatchAction({ action: 'toggle-routine-item', id: 'm-brush-teeth' });
  dispatchAction({ action: 'jump', tabTarget: 'routines' });
  assert.match(elements.get('app').innerHTML, /routine captured when its first item was completed/);
  assert.doesNotMatch(elements.get('app').innerHTML, /data-action="remove-routine-item"/);

  dispatchAction({ action: 'log-exercise-status', status: 'minimum' });
  dispatchAction({ action: 'jump', tabTarget: 'exercise' });
  assert.match(elements.get('app').innerHTML, /Frozen workout/);
  await new Promise(resolve => setTimeout(resolve, 520));

  const primary = (await foundation.loadFoundationCandidates()).find(candidate => candidate.source === 'IndexedDB primary');
  const savedDay = Object.values(primary.state.days).find(day => day.meals?.statuses?.breakfast === 'planned');
  assert.equal(savedDay.meals.snapshots.breakfast.calories, 440);
  assert.equal(primary.state.plan.meals.breakfast.calories, 441);
  assert.ok(savedDay.routine.snapshot.items.some(item => item.id === 'm-brush-teeth'));
  assert.equal(savedDay.exercise.snapshot.id, savedDay.exercise.workoutId);
});
