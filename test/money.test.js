import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatCOP } from '../src/money.js';

test('formatea sin decimales', () => {
  assert.equal(formatCOP(500), '$500');
});
