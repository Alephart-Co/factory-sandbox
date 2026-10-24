# factory-sandbox

Repo de juguete para probar Mastra Factory. No tiene datos reales.
Pruebas: `npm test` (Node 20+).

## Funciones de dinero

`src/money.js` exporta dos funciones para pesos colombianos (COP):

- `formatCOP(valor)` — da formato de pesos con punto de miles: `formatCOP(1200000)` → `'$1.200.000'`. Lanza `TypeError` si el valor no es un número finito (por ejemplo `null`, `'1200'`, `NaN`) o si el número se escribiría en notación exponencial (desde `1e21` o por debajo de `1e-6`).
- `parseCOP(texto)` — lee un único monto escrito por el contacto: `parseCOP('95 mil')` → `95000`. Devuelve `null` si no hay un monto único y claro.
