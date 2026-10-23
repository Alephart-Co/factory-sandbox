// Formatea un valor en pesos colombianos para mostrarlo al contacto.
export function formatCOP(value) {
  const texto = String(value);
  const signo = texto.startsWith('-') ? '-' : '';
  const absoluto = signo ? texto.slice(1) : texto;
  if (absoluto.includes('.')) return signo + '$' + absoluto;
  return signo + '$' + absoluto.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Lee el primer monto escrito en texto libre (p. ej. '$1.200.000', '95 mil', '1,2 millones').
// Devuelve el número o null si no hay monto válido.
export function parseCOP(texto) {
  if (typeof texto !== 'string') return null;
  const coincidencia = texto.match(/(\d+(?:\.\d+)*)(?:,(\d+))?(?:\s*(millones|mil)\b)?/i);
  if (!coincidencia) return null;
  const [, enteroTexto, decimales, escalaTexto] = coincidencia;
  const grupos = enteroTexto.split('.');
  if (grupos.length > 1 && (grupos[0].length > 3 || grupos.slice(1).some((g) => g.length !== 3))) {
    return null;
  }
  const escala = { mil: 1000, millones: 1000000 }[escalaTexto?.toLowerCase()] ?? 1;
  const numero = Number(enteroTexto.replaceAll('.', '') + (decimales ? '.' + decimales : ''));
  return Math.round(numero * escala * 100) / 100;
}
