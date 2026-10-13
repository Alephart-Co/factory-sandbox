// Formatea un valor en pesos colombianos para mostrarlo al contacto.
export function formatCOP(value) {
  return '$' + String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
