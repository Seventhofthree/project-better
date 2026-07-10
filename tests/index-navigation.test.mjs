import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('index exposes only the five calm-navigation primary destinations', () => {
  const primaryButtons = [...indexHtml.matchAll(/<button data-section="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(primaryButtons, ['today', 'food', 'movement', 'progress', 'settings']);
  assert.doesNotMatch(indexHtml, /<button data-tab="(meals|exercise|guide|routines|assistant|review|history)"/);
});

test('index and module entry consistently identify Pathfinder 1.2', () => {
  assert.match(indexHtml, /release: '1\.2 Calm Navigation'/);
  assert.match(indexHtml, /serviceWorkerCache: 'pathfinder-1\.2'/);
  assert.match(indexHtml, /type="module" src="app\.js\?v=1\.2"/);
});
