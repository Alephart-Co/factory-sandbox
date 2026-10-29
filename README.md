# factory-sandbox

Repo de juguete para probar Mastra Factory. No tiene datos reales.
Pruebas: `npm test` (Node 20+).

## Funciones de dinero

`src/money.js` exporta dos funciones para pesos colombianos (COP):

- `formatCOP(valor)` — da formato de pesos con punto de miles: `formatCOP(1200000)` → `'$1.200.000'`. Redondea a pesos enteros, alejándose del cero, antes de agrupar: `formatCOP(1234567.5)` → `'$1.234.568'`; por debajo de medio peso (y el cero) da `'$0'`, sin signo. Lanza `TypeError` si el valor no es un número finito (por ejemplo `null`, `'1200'`, `NaN`) o si su valor absoluto es `1e21` o mayor.
- `parseCOP(texto)` — lee un único monto escrito por el contacto: `parseCOP('95 mil')` → `95000`. Devuelve `null` si no hay un monto único y claro.
