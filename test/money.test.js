import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatCOP } from '../src/money.js';

test('formatea sin decimales', () => {
  assert.equal(formatCOP(500), '$500');
});

test('agrupa miles con punto', () => {
  assert.equal(formatCOP(1000), '$1.000');
  assert.equal(formatCOP(1200000), '$1.200.000');
  assert.equal(formatCOP(1000000), '$1.000.000');
});

test('no agrupa valores con decimales', () => {
  assert.equal(formatCOP(1200.5), '$1200.5');
  assert.equal(formatCOP(1200.567), '$1200.567');
});

test('pone el signo negativo antes del $', () => {
  assert.equal(formatCOP(-1200000), '-$1.200.000');
  assert.equal(formatCOP(-500), '-$500');
  assert.equal(formatCOP(-1200.5), '-$1200.5');
});
