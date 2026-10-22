// Formatea un valor en pesos colombianos para mostrarlo al contacto.
export function formatCOP(value) {
  const texto = String(value);
  if (texto.includes('.')) return '$' + texto;
  return '$' + texto.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
