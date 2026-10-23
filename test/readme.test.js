import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { formatCOP, parseCOP } from '../src/money.js';

const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');

test('el ejemplo de formatCOP del README coincide con el código', () => {
  assert.ok(readme.includes("`formatCOP(1200000)` → `'$1.200.000'`"));
  assert.equal(formatCOP(1200000), '$1.200.000');
});

test('el ejemplo de parseCOP del README coincide con el código', () => {
  assert.ok(readme.includes("`parseCOP('95 mil')` → `95000`"));
  assert.equal(parseCOP('95 mil'), 95000);
});
