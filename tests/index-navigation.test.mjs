import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('index keeps four daily destinations together and Settings separate', () => {
  const navMatch = indexHtml.match(/<nav class="tabs primary-tabs"[\s\S]*?<\/nav>/);
  assert.ok(navMatch);
  const dailyButtons = [...navMatch[0].matchAll(/<button data-section="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(dailyButtons, ['today', 'food', 'movement', 'progress']);
  assert.match(indexHtml, /class="ghost topbar-settings" data-section="settings"/);
  assert.doesNotMatch(navMatch[0], /data-section="settings"/);
  assert.doesNotMatch(indexHtml, /<button data-tab="(meals|exercise|guide|routines|assistant|review|history)"/);
});

test('index and module entry consistently identify Pathfinder 1.2.1', () => {
  assert.match(indexHtml, /release: '1\.2\.1 Calm Navigation'/);
  assert.match(indexHtml, /serviceWorkerCache: 'pathfinder-1\.2\.1'/);
  assert.match(indexHtml, /type="module" src="app\.js\?v=1\.2\.1"/);
});
