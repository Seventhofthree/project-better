import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

test('the complete Pathfinder visual system is present', () => {
  assert.match(styles, /:root\s*\{/);
  assert.match(styles, /--bg:\s*#101815/);
  assert.match(styles, /--accent:\s*#7bcf9e/);
  assert.match(styles, /\.app-shell\s*\{/);
  assert.match(styles, /\.card\s*\{/);
  assert.match(styles, /\.tabs\s*\{/);
  assert.ok(styles.split('\n').length > 300, 'stylesheet should include the complete theme, not only an add-on');
});

test('1.4.2 unified food search and phone rules are appended to the theme', () => {
  assert.match(styles, /Pathfinder 1\.4\.2 unified food search and quick log/);
  assert.match(styles, /\.unified-food-search-controls\s*\{/);
  assert.match(styles, /\.food-search-result-card\s*\{/);
  assert.match(styles, /\.barcode-camera video\s*\{/);
  assert.match(styles, /\.food-undo-bar\s*\{/);
  assert.match(styles, /@media \(max-width: 520px\)/);
});
