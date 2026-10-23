import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatCOP, parseCOP } from '../src/money.js';

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

test('lee montos con separador de miles', () => {
  assert.equal(parseCOP('$1.200.000'), 1200000);
  assert.equal(parseCOP('1.000'), 1000);
});

test('lee montos con la escala mil', () => {
  assert.equal(parseCOP('95 mil'), 95000);
});

test('lee decimales con coma y la escala millones sin error de redondeo', () => {
  assert.equal(parseCOP('1,2 millones'), 1200000);
});

test('lee la coma sin escala como decimal', () => {
  assert.equal(parseCOP('1,5'), 1.5);
});

test('devuelve null cuando no hay monto', () => {
  assert.equal(parseCOP('hola, ¿cuánto cuesta?'), null);
  assert.equal(parseCOP(''), null);
  assert.equal(parseCOP('mil'), null);
});

test('devuelve null para entradas que no son texto', () => {
  assert.equal(parseCOP(null), null);
  assert.equal(parseCOP(42), null);
});

test('devuelve null para un punto que no forma grupos de tres dígitos', () => {
  assert.equal(parseCOP('1.2'), null);
  assert.equal(parseCOP('1.2.3'), null);
});

test('devuelve el primer monto cuando hay varios', () => {
  assert.equal(parseCOP('pagó 2 millones y 5 mil'), 2000000);
});

test('devuelve null para formatos no soportados', () => {
  assert.equal(parseCOP('un millón'), null);
});

test('ignora el punto final de una frase', () => {
  assert.equal(parseCOP('Pagó 2.'), 2);
});
