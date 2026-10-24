# Plan v1 — formatCOP números en notación exponencial (#16)

2026-10-24 · Factory · Triage: https://github.com/Alephart-Co/factory-sandbox/issues/16#issuecomment-6385868248
Estimación: 2 → 2 puntos (confirmado: un archivo de código, una prueba y una línea de README)

## Contexto
`formatCOP` convierte el número con `String(value)` (`src/money.js:6`) y da formato al texto sin comprobar que sean dígitos. Para |n| ≥ 1e21 o 0 < |n| < 1e-6, `String()` devuelve notación exponencial y la función la devuelve tal cual: `formatCOP(1e21)` → `'$1e+21'`, `formatCOP(1e-7)` → `'$1e-7'`, `formatCOP(-1e21)` → `'-$1e+21'` (rama con punto, línea 9; rama de miles, línea 10). Verificado contra `factory/issue-16` (HEAD `d7ef504`). La guarda de la línea 3 (PR #15) solo cubre tipo y finitud. El triage aceptó el bug (causa `codigo`, prioridad baja) y @alephart respondió: lanzar `TypeError` en ambos casos.

## Objetivo y criterio de terminado
- `formatCOP(1e21)`, `formatCOP(-1e21)`, `formatCOP(1e-7)`, `formatCOP(-1e-7)` y `formatCOP(1.5e-7)` lanzan `TypeError`.
- `formatCOP` nunca devuelve un string que contenga `e`.
- Sin cambios para el resto de números finitos: `1e20` → `'$100.000.000.000.000.000.000'`, `1e-6` → `'$0.000001'`, `0`/`-0` → `'$0'`, y las pruebas existentes de `test/money.test.js` y `test/readme.test.js` siguen pasando.
- `npm test` pasa; la prueba nueva falla sin el cambio.

## Cambios frente al triage
- Lanzar `TypeError` también para 1e21 y para 1e-7 → según la respuesta de @alephart del 2026-10-24.
- Mensaje del `TypeError`: el triage dejó "el de la guarda o equivalente en español" como supuesto → cambiada: mensaje propio en español, ver Decisiones técnicas.
- Hallazgo fuera de alcance del triage (decimales sin separador de miles, `'$1234.5'`) → **corregido**: no es un defecto; `test/money.test.js:15-17` y `:23` lo fijan a propósito (`formatCOP(1200.5)` → `'$1200.5'`). Se retira de la lista de pendientes.

## Alcance
**Dentro:**
- Guarda en `src/money.js` que lanza `TypeError` cuando `String(value)` esté en notación exponencial.
- Una prueba en `test/money.test.js`.
- Una frase en `README.md:10`.

**Fuera de alcance:**
- Formatear números grandes completos (p. ej. `1e21` → `'$1.000.000.000.000.000.000.000'`) → no se hará: decisión humana, lanzar `TypeError`.
- Redondear o formatear fracciones diminutas → no se hará: decisión humana.
- Cambiar `parseCOP` → no se hará: no está afectado (devuelve `null` ante formatos que no coinciden, `src/money.js:29-30`).

## Decisiones técnicas
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Tras `const texto = String(value)` añadir `if (texto.includes('e')) throw new TypeError('formatCOP no admite números en notación exponencial');` | Umbrales numéricos (`Math.abs(value) >= 1e21 \|\| ...`) | Detecta exactamente lo que el motor representa en exponencial; no duplica el umbral de `String()` ni deja huecos (p. ej. `1.5e-7`). Un finito nunca contiene `e` salvo en exponencial |
| `TypeError` (no `RangeError`) | `RangeError` | Decisión humana y coherencia con la guarda de la línea 3 |
| Mensaje propio, no el de la línea 3 | Reutilizar `formatCOP espera un número finito` | Ese mensaje sería falso: `1e21` es finito. Español por AGENTS.md |
| Guarda separada, después de la existente | Unirla a la condición de la línea 3 | Necesita `texto`, que se calcula después; mantiene un mensaje exacto por causa |

## Convenciones
- Sin nombres nuevos de código. La prueba nueva sigue a `test/money.test.js:181-185` (`assert.throws(() => formatCOP(entrada), TypeError)` en un `for...of`) y `:187-190` (`test('formatCOP ...', () => {...})`, títulos en español, `node:test` + `node:assert/strict`).

## Fases
### Fase 0 — Versionar el plan
- Copiar este plan tal como se aprobó a `docs/tasks/issue-16-plan.md`, sin el marcador HTML.
- Verificación: el archivo está en el commit de la rama.

### Fase 1 — Rechazar la notación exponencial
- **Cambios:** `src/money.js` → después de la línea 6 (`const texto = String(value);`), `if (texto.includes('e')) throw new TypeError('formatCOP no admite números en notación exponencial');`.
- **Pruebas:** en `test/money.test.js`, tras la prueba de la línea 181: `formatCOP lanza TypeError ante notación exponencial` con `assert.throws(..., TypeError)` para `1e21`, `-1e21`, `1e-7`, `-1e-7`, `1.5e-7`; y una prueba de límites que afirme `formatCOP(1e20)` → `'$100.000.000.000.000.000.000'` y `formatCOP(1e-6)` → `'$0.000001'`.
- **Verificación:** `npm test` → todo en verde. Quitando la línea nueva de `src/money.js`, la prueba de `TypeError` falla.

### Fase 2 — Documentar
- **Cambios:** `README.md:10` → ampliar la frase del `TypeError` para incluir "o si su representación sería exponencial (por ejemplo `1e21` o `1e-7`)". No alterar `` `formatCOP(1200000)` → `'$1.200.000'` `` (fijado por `test/readme.test.js:9`).
- **Verificación:** `npm test` → `test/readme.test.js` sigue pasando.

## Escenarios de aceptación
| # | Dado | Cuando | Entonces | Y nunca | Cubierto por |
|---|---|---|---|---|---|
| 1 | `1e21` o `-1e21` | `formatCOP(x)` | `TypeError` | `'$1e+21'` | test/money.test.js (Fase 1) |
| 2 | `1e-7`, `-1e-7`, `1.5e-7` | `formatCOP(x)` | `TypeError` | `'$1e-7'` | test/money.test.js (Fase 1) |
| 3 | `1e20` | `formatCOP(x)` | `'$100.000.000.000.000.000.000'` | lanzar | test/money.test.js (Fase 1) |
| 4 | `1e-6` | `formatCOP(x)` | `'$0.000001'` | lanzar | test/money.test.js (Fase 1) |
| 5 | `0`, `-0`, `1200000`, `1200.5` | `formatCOP(x)` | igual que hoy | cambiar su salida | pruebas existentes |

## Operación
- **Entorno de prueba:** local con `npm test` (Node 20+); sin otro entorno.
- **Migraciones:** No aplica — sin datos ni esquema.
- **Rollback:** revertir el commit; cambio aislado en una función.
- **Orden de salida a prod:** merge del PR; no hay despliegue (repo de juguete). La ejecuta una persona.
- **Observabilidad:** No aplica — la función lanza un error visible para quien la llama.

## Seguridad y tenancy
No aplica — función pura, sin secretos ni datos de clientes.

## Riesgos
| Riesgo | Cómo se detecta temprano | Mitigación |
|---|---|---|
| Un llamador pasa hoy valores ≥ 1e21 o < 1e-6 y empezará a recibir excepción | `grep -rn formatCOP src` | Verificado: en el repo solo se usa en `src/money.js`, pruebas y README; cambio pedido por el humano |
| `texto.includes('e')` coincide con algo que no es exponencial | La prueba de límites (`1e20`, `1e-6`) | `String()` de un número finito solo contiene dígitos, `.`, `-`, y `e` en exponencial (`Infinity`/`NaN` ya se descartan en la línea 3) |

## Supuestos
- `String(n)` pasa a exponencial exactamente en |n| ≥ 1e21 y 0 < |n| < 1e-6 — verificado: `String(1e-6)` → `'0.000001'`, `String(1.5e-7)` → `'1.5e-7'`, `String(1e21)` → `'1e+21'` en Node local.
- Sin llamadores externos a `formatCOP` en el repo — verificado: solo `src/money.js`, `test/` y docs.

## Lo que no verifiqué
- Otros motores JS distintos de Node (el umbral de `String()` está fijado por la especificación ECMAScript, no es específico de V8).

## Preguntas para el humano
Ninguna. Las decisiones de comportamiento (`TypeError` para ambos extremos) las confirmó @alephart el 2026-10-24.
