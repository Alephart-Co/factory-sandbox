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

test('parseCOP lee miles con punto', () => {
  assert.equal(parseCOP('$1.200.000'), 1200000);
});

test('parseCOP lee la escala mil', () => {
  assert.equal(parseCOP('95 mil'), 95000);
});

test('parseCOP lee decimales con escala sin residuo de flotante', () => {
  assert.equal(parseCOP('1,2 millones'), 1200000);
});

test('parseCOP lee la escala M mayúscula', () => {
  assert.equal(parseCOP('2M'), 2000000);
  assert.equal(parseCOP('1,2 M'), 1200000);
});

test('parseCOP lee millón con y sin tilde', () => {
  assert.equal(parseCOP('1 millón'), 1000000);
  assert.equal(parseCOP('1 millon'), 1000000);
});

test('parseCOP no lee montos escritos en letras', () => {
  assert.equal(parseCOP('un millón'), null);
  assert.equal(parseCOP('cien mil'), null);
});

test('parseCOP acepta mil sin espacio y en mayúsculas', () => {
  assert.equal(parseCOP('95mil'), 95000);
  assert.equal(parseCOP('95 MIL'), 95000);
});

test('parseCOP acepta espacio tras el signo y montos sin separadores', () => {
  assert.equal(parseCOP('$ 1.200.000'), 1200000);
  assert.equal(parseCOP('500'), 500);
  assert.equal(parseCOP('1200000'), 1200000);
});

test('parseCOP acepta el cero como monto', () => {
  assert.equal(parseCOP('0'), 0);
});

test('parseCOP acepta montos agrupados de 10 dígitos', () => {
  assert.equal(parseCOP('1.000.000.000'), 1000000000);
});

test('parseCOP rechaza decimales sin escala', () => {
  assert.equal(parseCOP('1,5'), null);
});

test('parseCOP rechaza un punto que no agrupa miles', () => {
  assert.equal(parseCOP('1.2'), null);
  assert.equal(parseCOP('1.2 millones'), null);
});

test('parseCOP rechaza grupos de miles mal formados', () => {
  assert.equal(parseCOP('12.34.567'), null);
  assert.equal(parseCOP('1.2.3'), null);
});

test('parseCOP rechaza decimales sin escala aunque haya miles', () => {
  assert.equal(parseCOP('1.200,50'), null);
  assert.equal(parseCOP('1.200.000,5'), null);
});

test('parseCOP redondea a pesos enteros tras aplicar la escala', () => {
  assert.equal(parseCOP('1,2345 millones'), 1234500);
});

test('parseCOP devuelve null cuando no hay monto', () => {
  assert.equal(parseCOP('hola, ¿cuánto cuesta?'), null);
  assert.equal(parseCOP(''), null);
});

test('parseCOP devuelve null si la entrada no es texto', () => {
  assert.equal(parseCOP(null), null);
  assert.equal(parseCOP(undefined), null);
  assert.equal(parseCOP(42), null);
});

test('parseCOP devuelve null con varios montos', () => {
  assert.equal(parseCOP('pagó 2 millones y 5 mil'), null);
});

test('parseCOP devuelve null con un número suelto junto al monto', () => {
  assert.equal(parseCOP('tengo 2 hijos y 95 mil'), null);
});

test('parseCOP ignora puntuación y palabras después del monto', () => {
  assert.equal(parseCOP('cuesta $1.200.000.'), 1200000);
  assert.equal(parseCOP('cuesta 95 mil, ok'), 95000);
  assert.equal(parseCOP('$50.000 pesos'), 50000);
});

test('parseCOP no lee la escala k', () => {
  assert.equal(parseCOP('95k'), null);
  assert.equal(parseCOP('95 K'), null);
});

test('parseCOP no confunde mil con palabras que empiezan por mil', () => {
  assert.equal(parseCOP('5 milagros'), null);
  assert.equal(parseCOP('3 militares'), null);
});

test('parseCOP no confunde millones con millonarios', () => {
  assert.equal(parseCOP('2 millonarios'), null);
});

test('parseCOP lee de vuelta enteros positivos formateados con formatCOP', () => {
  assert.equal(parseCOP(formatCOP(500)), 500);
  assert.equal(parseCOP(formatCOP(1000)), 1000);
  assert.equal(parseCOP(formatCOP(1200000)), 1200000);
});

test('parseCOP rechaza la salida de formatCOP con decimales', () => {
  assert.equal(parseCOP(formatCOP(1200.5)), null);
});

test('parseCOP rechaza negativos', () => {
  assert.equal(parseCOP(formatCOP(-1200000)), null);
  assert.equal(parseCOP('-500'), null);
});

test('parseCOP rechaza teléfonos sin separadores', () => {
  assert.equal(parseCOP('3001234567'), null);
});

test('parseCOP rechaza varios números como un teléfono con espacios', () => {
  assert.equal(parseCOP('+57 300 123 4567'), null);
});

test('parseCOP trata la m minúscula como palabra desconocida', () => {
  assert.equal(parseCOP('2 m'), 2);
});

test('parseCOP ignora el texto después de la escala', () => {
  assert.equal(parseCOP('2 millones de pesos'), 2000000);
});

test('parseCOP trata palabras heredadas de Object como palabra desconocida', () => {
  assert.equal(parseCOP('5 constructor'), 5);
  assert.equal(parseCOP('5 toString'), 5);
});

test('parseCOP rechaza dos escalas seguidas', () => {
  assert.equal(parseCOP('5 mil millones'), null);
});
