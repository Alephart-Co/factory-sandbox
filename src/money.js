// Formatea un valor en pesos colombianos para mostrarlo al contacto, redondeado a pesos enteros.
export function formatCOP(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError('formatCOP espera un número finito');
  }
  if (Math.abs(value) >= 1e21) {
    throw new TypeError('formatCOP no admite números de 1e21 o más');
  }
  const entero = Math.round(Math.abs(value));
  const signo = value < 0 && entero !== 0 ? '-' : '';
  return signo + '$' + String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const ESCALAS = { mil: 1000, millon: 1000000, millón: 1000000, millones: 1000000 };

// Lee un único monto en pesos escrito por el contacto ('$1.200.000', '95 mil', '1,2 millones', '2M').
// Devuelve el valor en pesos enteros, o null si no hay un monto claro y único.
export function parseCOP(texto) {
  if (typeof texto !== 'string') return null;

  const numeros = [...texto.matchAll(/\d[\d.,]*/g)];
  if (numeros.length !== 1) return null;

  const [crudo] = numeros[0];
  const numero = crudo.replace(/[.,]+$/, '');
  const antes = texto.slice(0, numeros[0].index);
  const despues = texto.slice(numeros[0].index + numero.length);
  if (/-[\s$]*$/.test(antes)) return null;

  const formato = numero.match(/^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?$/);
  if (!formato) return null;
  const [, entero, decimales] = formato;

  const palabra = despues.match(/^\s*(\p{L}+)/u)?.[1];
  let escala = 1;
  if (palabra) {
    const minuscula = palabra.toLowerCase();
    if (Object.hasOwn(ESCALAS, minuscula)) escala = ESCALAS[minuscula];
    else if (palabra === 'M') escala = 1000000;
    else if (minuscula === 'k' || minuscula === 'm' || minuscula.startsWith('mil')) return null;
  }

  if (escala > 1) {
    const siguiente = despues.match(/^\s*\p{L}+\s+(\p{L}+)/u)?.[1];
    if (siguiente && (Object.hasOwn(ESCALAS, siguiente.toLowerCase()) || siguiente === 'M')) return null;
  }

  if (decimales?.length === 3) return null;
  if (escala === 1 && decimales) return null;
  if (escala === 1 && /^\d{10,}$/.test(entero)) return null;

  const valor = Number(entero.replaceAll('.', '') + (decimales ? '.' + decimales : ''));
  return Math.round(valor * escala);
}
