import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const serviceWorker = await readFile(new URL('../service-worker.js', import.meta.url), 'utf8');

test('index keeps four daily destinations together and Settings separate', () => {
  const navMatch = indexHtml.match(/<nav class="tabs primary-tabs"[\s\S]*?<\/nav>/);
  assert.ok(navMatch);
  const dailyButtons = [...navMatch[0].matchAll(/<button data-section="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(dailyButtons, ['today', 'food', 'movement', 'progress']);
  assert.match(indexHtml, /class="ghost topbar-settings" data-section="settings"/);
  assert.doesNotMatch(navMatch[0], /data-section="settings"/);
  assert.doesNotMatch(indexHtml, /<button data-tab="(meals|exercise|guide|routines|assistant|review|history)"/);
});

test('index, module entry, and offline cache consistently identify Pathfinder 1.3', () => {
  assert.match(indexHtml, /release: '1\.3 Today-First Daily Flow'/);
  assert.match(indexHtml, /serviceWorkerCache: 'pathfinder-1\.3'/);
  assert.match(indexHtml, /type="module" src="app\.js\?v=1\.3"/);
  assert.match(serviceWorker, /const CACHE_NAME = 'pathfinder-1\.3'/);
  assert.match(serviceWorker, /'\.\/today-flow\.js'/);
});
