// Formatea un valor en pesos colombianos para mostrarlo al contacto.
export function formatCOP(value) {
  const texto = String(value);
  const signo = texto.startsWith('-') ? '-' : '';
  const absoluto = signo ? texto.slice(1) : texto;
  if (absoluto.includes('.')) return signo + '$' + absoluto;
  return signo + '$' + absoluto.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
