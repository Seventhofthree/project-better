import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRIMARY_SECTIONS,
  SECTION_DEFINITIONS,
  VIEW_IDS,
  defaultViewForSection,
  normalizeView,
  sectionForView
} from '../navigation.js';

test('calm navigation exposes five primary destinations and preserves all eleven views', () => {
  assert.deepEqual(PRIMARY_SECTIONS, ['today', 'food', 'movement', 'progress', 'settings']);
  const nestedViews = PRIMARY_SECTIONS.flatMap(section => SECTION_DEFINITIONS[section].views.map(view => view.id));
  assert.equal(nestedViews.length, 11);
  assert.deepEqual(new Set(nestedViews), new Set(VIEW_IDS));
});

test('legacy feature views map to the expected calm-navigation section', () => {
  assert.equal(sectionForView('today'), 'today');
  assert.equal(sectionForView('routines'), 'today');
  assert.equal(sectionForView('assistant'), 'today');
  assert.equal(sectionForView('meals'), 'food');
  assert.equal(sectionForView('food'), 'food');
  assert.equal(sectionForView('exercise'), 'movement');
  assert.equal(sectionForView('guide'), 'movement');
  assert.equal(sectionForView('progress'), 'progress');
  assert.equal(sectionForView('review'), 'progress');
  assert.equal(sectionForView('history'), 'progress');
  assert.equal(sectionForView('settings'), 'settings');
});

test('primary destinations open their intended default nested view', () => {
  assert.equal(defaultViewForSection('today'), 'today');
  assert.equal(defaultViewForSection('food'), 'meals');
  assert.equal(defaultViewForSection('movement'), 'exercise');
  assert.equal(defaultViewForSection('progress'), 'progress');
  assert.equal(defaultViewForSection('settings'), 'settings');
  assert.equal(defaultViewForSection('unknown'), 'today');
  assert.equal(normalizeView('unknown'), 'today');
});
