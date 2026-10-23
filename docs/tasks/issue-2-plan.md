# Plan v2 — Parsear montos en pesos desde texto (#2)

2026-10-23 · Factory (claude-3-7-sonnet-20250219) · Triage: https://github.com/Alephart-Co/factory-sandbox/issues/2#issuecomment-6355719564
Estimación: 2 → 2 (sin cambio — alcance confirmado por @alephart)

## Cambios frente al plan v1

Esta versión atiende los 9 hallazgos de la [revisión independiente](https://github.com/Alephart-Co/factory-sandbox/issues/2#issuecomment-6355775340) y aplica las [respuestas de @alephart](https://github.com/Alephart-Co/factory-sandbox/issues/2#issuecomment-6353933405) que el v1 no recogió (publicadas 1 minuto antes del v1):

### Bloqueantes atendidos
1. **Contradicción sobre `2M`/`1 millón`** (hallazgo 1) → RESUELTO: @alephart confirmó que son formatos válidos (`2M` → `2000000`, `1 millón` → `1000000`). El v1 decía que devuelven `null` en "Cambios frente al triage" pero la regla 2 los aceptaba. El v2 los acepta explícitamente (escenarios 4-5) y corrige la contradicción.
2. **Palabras de escala sin límite de palabra** (hallazgo 2: `'5 milagros'` → `5000`) → RESUELTO: la regex de escala ahora exige límite de palabra completa (`\b`) tras `mil`/`millon`/`M`, y valida que la palabra siguiente sea **exactamente** una escala conocida o no empiece por `mil`/`mill` (escenarios 22-23, 29).

### Ajustes atendidos
3. **Ida y vuelta con `formatCOP` rota** (hallazgo 3) → RESUELTO: el plan v2 clarifica que `parseCOP` NO soporta decimales ni negativos (aunque `formatCOP` los produce), y documenta explícitamente que el roundtrip solo funciona para enteros positivos formateados (escenarios 24-26). Decisión: `parseCOP` se diseña para mensajes del contacto, no para parsear la salida de `formatCOP` con decimales/negativos.
4. **Casos borde sin escenario** (hallazgo 4) → RESUELTO: agregados 13 escenarios nuevos: `'$ 1.200.000'` (espacio tras `$`), `'95mil'` y `'95 MIL'` (sin espacio, mayúsculas), `'1.2 millones'` (punto no agrupado), `'1.200,50'` (decimales sin escala), `'0'`, `'1.000.000.000'` (10 dígitos), `'12.34.567'` (grupos mal formados), teléfonos, negativos. Total: 30 escenarios (v1 tenía 10).
5. **Decisión de `1,5` sin confirmar** (hallazgo 5) → RESUELTO: @alephart confirmó `'1,5'` sin escala → `null` ("nadie escribe montos con decimales en pesos; solo tiene sentido con millones"). Ya no es supuesto; es decisión confirmada (escenario 11). Regla general: **sin escala no hay decimales**.
6. **Issue #3 no mencionado** (hallazgo 6) → RESUELTO: #3 ("Documentar en el README las funciones de dinero") depende de que `parseCOP` exista; va **después** de #2. Registrado en "Operación" (orden de salida).
7. **Fuera de alcance sin destinos** (hallazgo 7) → RESUELTO: cada punto fuera de alcance tiene destino concreto: integración con flujo del contacto → issue aparte cuando exista consumidor; soporte de más formatos (si el autor lo pide) → issue aparte; workflow de CI → fuera de alcance, no se hará.
8. **npm test en CI sin respaldo** (hallazgo 8) → RESUELTO: aclarado en "Operación" que el repo no tiene CI (`.github/` no existe, verificado) y que las pruebas se corren manualmente con `npm test` antes del merge.
9. **Aritmética decimal** (hallazgo 9) → RESUELTO: clarificado en "Decisiones técnicas" que la aritmética es con flotantes (`Math.round(x * escala)`), no con librería decimal. El redondeo a pesos enteros protege de residuos de punto flotante (ej: `1.2 * 1000000` da `1200000.0000000002` → `Math.round` → `1200000`). Escenario 15 prueba `'1,2345 millones'` → `1234500`.

### Respuestas de @alephart aplicadas (no estaban en v1)
- `'1,5'` sin escala → `null` (v1 decía `1.5`). Regla: sin escala no hay decimales.
- Formatos soportados: los del issue + `mil`, `millón`/`millones` y `M` (mayúscula). **Fuera:** `k` y montos en letras (`cien mil`, `un millón`).
- Varios montos en el mismo texto → `null` (ambiguo, no adivinar).

## Contexto

El issue #2 pide una función `parseCOP(texto)` que extraiga montos en pesos colombianos de texto natural del contacto, como `'$1.200.000'`, `'95 mil'` o `'1,2 millones'`. Causa raíz (verificada): la función no existe — `src/money.js` solo exporta `formatCOP` (línea 2), confirmado con `git grep parseCOP` (vacío) y `npm test` (4/4 pasan, todas de `formatCOP`). El triage aceptó el issue como feature request de 2 puntos; @alephart confirmó el comportamiento esperado en comentario del 2026-10-22 23:53.

## Objetivo y criterio de terminado

`parseCOP` exportada en `src/money.js`, con 30 escenarios de prueba en `test/money.test.js` que cubren montos válidos, escalas (`mil`/`millón`/`millones`/`M`), casos ambiguos (varios montos, teléfonos, negativos, decimales sin escala) que devuelven `null`, y roundtrip con `formatCOP` para enteros positivos.

**Verificación:** `node --test` → 0 fallos (4 de `formatCOP` + 30 nuevas de `parseCOP`).

## Cambios frente al triage

Todas las condiciones del triage se cubren sin cambios:

- ✓ Formatos del issue (`$1.200.000`, `95 mil`, `1,2 millones`) → cubiertos (escenarios 1-3)
- ✓ Devolver `null` si no hay monto o es ambiguo → cubierto (escenarios 6, 16, 18-19)
- ✓ Redondear a pesos enteros → cubierto (escenarios 3, 15)
- ✓ No romper las pruebas existentes de `formatCOP` → verificado en Fase 2

**Adición:** @alephart confirmó soporte de `mil`, `millón`/`millones` y `M` (no estaban en el triage), y exclusión de `k` y montos en letras. El v2 los integra como decisiones confirmadas, no como supuestos.

## Alcance

**Dentro:**
- `parseCOP(texto)` exportada en `src/money.js`, tras `formatCOP`
- 30 escenarios de prueba en `test/money.test.js` (nuevo bloque `test()` bajo las 4 existentes)
- Soporte de formatos: `$N`, `N`, `N mil`, `N millón/millones`, `N M` (mayúscula), con punto como separador de miles y coma como separador decimal opcional (solo con escala)
- Validación: un solo monto por texto; sin decimales a menos que haya escala; sin negativos; sin teléfonos de 10+ dígitos sin separadores
- Plan versionado en `docs/tasks/issue-2-plan.md` (crear `docs/tasks/`)

**Fuera de alcance:**
- Integración con el flujo del contacto → **issue aparte cuando exista el consumidor** (registrar en Intake si se pide)
- Soporte de `k`, montos en letras (`cien mil`), `m` minúscula, otras escalas (`K`, `B`) → **issue aparte solo si @alephart lo pide** (ahora confirmó que no)
- Workflow de CI (`.github/workflows/`) → **no se hará** (el repo no lo tiene; las pruebas se corren manualmente)
- Documentación en README → **issue #3** (depende de que `parseCOP` exista; va después de #2)

## Decisiones técnicas

| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Varios montos en el texto → `null` | Tomar el primero / devolver array | @alephart: "varios montos es ambiguo, no adivinar"; evita casos como `'tengo 2 hijos y 95 mil'` → tomar `2` por error |
| Decimales solo con escala (`'1,2 millones'` → `1200000`) | Aceptar `'1,5'` → `1.5` | @alephart: "en pesos nadie escribe decimales; `1,5` solo tiene sentido con millones"; regla general: **sin escala no hay decimales** |
| Negativos → `null` | Parsear negativos | `formatCOP` los produce pero no hay evidencia de montos negativos en mensajes del contacto; si se necesitan, issue aparte |
| Teléfonos de 10+ dígitos sin separadores → `null` | Aceptarlos como montos | Un teléfono como `'3001234567'` no es un monto; la regla de "varios números" lo rechaza |
| `M` solo mayúscula | `m` minúscula también | `M` es abreviatura estándar de "millón" (SI); `m` es metro. Escenario 29: `'2 m'` → `null` (decisión de @alephart, 2026-10-23) |
| `k` excluido | `k` = 1000 | @alephart: "nada de k"; además, `k` es más común en inglés que en español |
| Palabra completa de escala (`\b` tras `mil`/`millon`/`M`) | Sin límite | Evita `'5 milagros'` → `5000` (hallazgo 2 del review); `'militares'` o `'millonarios'` no son escalas |
| Aritmética con flotantes + `Math.round` | Librería decimal | `AGENTS.md:3` prohíbe dependencias sin justificación; `Math.round(x * escala)` es exacto para los casos cubiertos y evita residuos de punto flotante (ej: `1.2 * 1e6 = 1200000.0000000002` → `1200000`) |
| Roundtrip solo para enteros positivos formateados | Roundtrip completo con decimales/negativos | `parseCOP` se diseña para mensajes del contacto, no para parsear salida de `formatCOP`; decisión: no es objetivo soportar `parseCOP(formatCOP(1200.5))` |

## Convenciones

- `parseCOP` — sigue a `formatCOP` (`src/money.js:2`), único ejemplo existente de función de dinero
- `test/money.test.js` — sigue el patrón de `test/money.test.js:1-24` (bloques `test()` con `assert/strict`, títulos en español, varias aserciones por bloque)
- `docs/tasks/issue-2-plan.md` — formato de la plantilla de la fábrica; `docs/` aún no existe en el repo (verificado con `ls`)

## Fases

### Fase 0 — Versionar el plan
- Copiar este plan **tal como se aprobó** a `docs/tasks/issue-2-plan.md` (crear `docs/tasks/`), sin el marcador HTML.
- Verificación: `git ls-files docs/tasks/issue-2-plan.md` lo lista tras el commit.

### Fase 1 — Escribir las pruebas de `parseCOP` (`test/money.test.js`)
- **Cambios:** agregar un nuevo bloque `test('parsea montos en pesos desde texto', () => { ... })` bajo las 4 pruebas existentes de `formatCOP`, con los 30 escenarios de la tabla de aceptación (montos válidos, escalas, ambiguos/`null`, no texto, ida y vuelta limitada, signo/teléfono).
- **Pruebas:** todos los casos de la tabla de escenarios.
- **Verificación:** `cd factory-sandbox && node --test` → las nuevas fallan (`parseCOP is not a function`); las 4 de `formatCOP` siguen pasando (4/34 ok).

### Fase 2 — Implementar `parseCOP` (`src/money.js`)
- **Cambios:** agregar `export function parseCOP(texto)` bajo `formatCOP` (línea 8), con esta lógica:
  1. `typeof texto !== 'string'` → `return null` (escenario 17)
  2. Buscar todos los números con `/\d[\d.,]*/g`. Si no hay exactamente uno → `return null` (escenarios 16, 18, 28)
  3. Quitar `.` y `,` finales del número capturado. Mirar el texto **antes** del número: si termina en `-` (con espacios/`$` opcionales) → `return null` (escenario 26: negativos fuera)
  4. Validar que el número cumple `^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?$` (miles con punto, opcional coma decimal). Si no cumple (`'1.2'`, `'12.34.567'`, `'1.200,50'`) → `return null` (escenarios 12-14)
  5. Extraer la palabra de letras (`/\p{L}+/u`) que sigue al número tras espacios opcionales. Si es `mil`, `millon`, `millón`, `millones` (sin importar mayúsculas, con o sin tilde) → escala 1.000 / 1.000.000. Si es exactamente `M` (mayúscula) → escala 1.000.000. Si no es escala exacta pero empieza por `mil` o `mill` (`'milagros'`, `'militares'`, `'millonarios'`) o es `k`/`K` → `return null` (escenarios 21-23). Si es `m` minúscula → `return null` (decisión de @alephart, escenario 29). Cualquier otra palabra (`'pesos'`, `'COP'`, `'de'`) → escala 1 (sin multiplicador, escenario 29-30).
  6. Si hay parte decimal (`,N`) y escala 1 → `return null` (escenario 14: decimales solo con escala). Si el número es entero sin puntos, escala 1, y tiene 10+ dígitos → `return null` (escenario 27: teléfonos fuera).
  7. Construir el número: quitar puntos de miles, reemplazar coma por punto. Devolver `Math.round(Number(resultado) * escala)`.
- **Pruebas:** las 30 de la Fase 1 pasan.
- **Verificación:** `cd factory-sandbox && node --test` → 0 fallos (34/34 ok: 4 de `formatCOP` + 30 de `parseCOP`).

### Fase 3 — Revisión de alcance
- **Cambios:** ninguno de código.
- **Verificación:** 
  - `cd factory-sandbox && git diff --stat main...` → solo `src/money.js`, `test/money.test.js`, `docs/tasks/issue-2-plan.md`; `.artifacts/` no se commitea.
  - `cd factory-sandbox && npm test` → sin fallos.

## Escenarios de aceptación

| # | Dado | Cuando | Entonces | Y nunca | Cubierto por |
|---|---|---|---|---|---|
| 1 | `'$1.200.000'` | `parseCOP` | `1200000` | — | miles con punto, formato estándar |
| 2 | `'95 mil'` | `parseCOP` | `95000` | — | escala `mil` |
| 3 | `'1,2 millones'` | `parseCOP` | `1200000` | residuo de flotante | decimal con escala, redondeo a entero |
| 4 | `'2M'` y `'1,2 M'` | `parseCOP` | `2000000` y `1200000` | `2`, `null` | escala `M` (mayúscula), con y sin decimal |
| 5 | `'1 millón'` y `'1 millon'` | `parseCOP` | `1000000` | `1`, `null` | escala singular, con y sin tilde |
| 6 | `'un millón'`, `'cien mil'` | `parseCOP` | `null` | `1000000`, `100000` | montos en letras fuera (confirmado por @alephart) |
| 7 | `'95mil'` y `'95 MIL'` | `parseCOP` | `95000` | `null` | espacio opcional, mayúsculas insensible |
| 8 | `'$ 1.200.000'`, `'500'`, `'1200000'` | `parseCOP` | `1200000`, `500`, `1200000` | — | espacio tras `$`, sin separadores |
| 9 | `'0'` | `parseCOP` | `0` | `null` | cero es un monto válido |
| 10 | `'1.000.000.000'` | `parseCOP` | `1000000000` | `null` | agrupado de 10 dígitos (no es teléfono si tiene separadores) |
| 11 | `'1,5'` | `parseCOP` | `null` | `1.5`, `15` | decisión de @alephart: sin escala no hay decimales |
| 12 | `'1.2'` y `'1.2 millones'` | `parseCOP` | `null` ambos | `1`, `1.2`, `1200000` | punto no es separador de miles si solo hay 1 dígito después |
| 13 | `'12.34.567'`, `'1.2.3'` | `parseCOP` | `null` | — | grupos de miles mal formados (no 3 dígitos) |
| 14 | `'1.200,50'`, `'1.200.000,5'` | `parseCOP` | `null` | `1200.5` | decimales solo con escala (regla de @alephart) |
| 15 | `'1,2345 millones'` | `parseCOP` | `1234500` | decimales sin redondear | redondeo a pesos enteros tras multiplicar |
| 16 | `'hola, ¿cuánto cuesta?'`, `''` | `parseCOP` | `null` | — | sin monto reconocible |
| 17 | `null`, `undefined`, `42` | `parseCOP` | `null` | excepción | no string |
| 18 | `'pagó 2 millones y 5 mil'` | `parseCOP` | `null` | `2000000`, `5000` | varios montos → ambiguo (@alephart) |
| 19 | `'tengo 2 hijos y 95 mil'` | `parseCOP` | `null` | `2`, `95000` | número suelto + monto → ambiguo |
| 20 | `'cuesta $1.200.000.'`, `'cuesta 95 mil, ok'`, `'$50.000 pesos'` | `parseCOP` | `1200000`, `95000`, `50000` | `null` | puntuación y palabra después |
| 21 | `'95k'`, `'95 K'` | `parseCOP` | `null` | `95`, `95000` | `k` excluida por @alephart |
| 22 | `'5 milagros'`, `'3 militares'` | `parseCOP` | `null` | `5000`, `3000`, `5` | palabra completa: `mil` no es prefijo válido (hallazgo 2) |
| 23 | `'2 millonarios'` | `parseCOP` | `null` | `2000000` | palabra completa: `millon*` no es prefijo válido |
| 24 | `formatCOP(500)`, `formatCOP(1000)`, `formatCOP(1200000)` | `parseCOP` del resultado | `500`, `1000`, `1200000` | — | ida y vuelta para enteros positivos formateados |
| 25 | `formatCOP(1200.5)` = `'$1200.5'` | `parseCOP` | `null` | `1200`, `1200.5` | decimales sin escala → null (no roundtrip) |
| 26 | `formatCOP(-1200000)` = `'-$1.200.000'`, `'-500'` | `parseCOP` | `null` | `1200000`, `500` | negativos fuera (no roundtrip) |
| 27 | `'3001234567'` | `parseCOP` | `null` | `3001234567` | teléfono sin separadores: 10+ dígitos enteros sin puntos |
| 28 | `'+57 300 123 4567'` | `parseCOP` | `null` | un monto | varios números → ambiguo |
| 29 | `'2 m'`, `'2m'` | `parseCOP` | `null` | `2`, `2000000` | `m` minúscula es ambigua (metro); decisión de @alephart → `null` |
| 30 | `'2 millones de pesos'` | `parseCOP` | `2000000` | `null` | texto después de la escala no afecta |
| 31 | `'1,000 mil'` | `parseCOP` | `null` | `1000` | Decimal de exactamente 3 dígitos es ambiguo con separador de miles; decisión de @alephart → `null` (`'1,2 millones'` sigue → `1200000`) |

## Operación

- **Entorno de prueba:** local, `npm test` (definido en `package.json` como `node --test`). `README.md:3` indica Node 20+; `package.json` no declara `engines`; entorno verificado con Node 22.
- **Migraciones:** No aplica — sin base de datos.
- **Rollback:** revertir el commit que agrega `parseCOP` y sus pruebas; no hay consumidores en el repo (verificado con `git grep parseCOP` vacío en main).
- **Orden de salida a prod:** 
  1. Merge de #2 (este plan) → `parseCOP` disponible
  2. Después: #3 ("Documentar en el README las funciones de dinero") documenta `formatCOP` y `parseCOP` juntas
  3. Después: integración con flujo del contacto (cuando exista el consumidor; issue aparte)
  No hay deploy automatizado; la salida la ejecuta una persona.
- **Observabilidad:** el repo **no tiene CI** (`.github/` no existe, verificado con `ls -la factory-sandbox/`). Las pruebas se corren manualmente con `npm test` antes del merge. Un workflow de CI queda fuera de alcance del issue #2.

## Seguridad y tenancy

No aplica — función pura de texto a número, sin secretos, sin datos de clientes, sin escritura. El texto del contacto se trata solo como texto: nunca se evalúa (`eval`/`new Function` no usados) y las regex no tienen cuantificadores anidados (sin riesgo de ReDoS: `/\d[\d.,]*/g` y `/\p{L}+/u` son lineales en el tamaño de la entrada).

## Riesgos

| Riesgo | Cómo se detecta temprano | Mitigación |
|---|---|---|
| Rechazo excesivo: cualquier número extra en el mensaje (id de pedido, fecha, `'2 hijos'`) vuelve todo `null` | Escenarios 18-19, 28; revisar mensajes reales del contacto | Es el comportamiento pedido por @alephart ("varios montos es ambiguo"); si molesta en producción, issue aparte para ajustar la regla |
| Aceptación incorrecta: `'5 Metros'` lee `5` (palabra desconocida tras el número) | Escenario 29 | Aceptado: se bloquean palabras que parecen escala (`mil*`, `mill*`, `k`/`K`) y `m` minúscula; otras palabras → escala 1 |
| Regex acepta montos mal formados (`'1.2'`, `'12.34.567'`) como si fueran válidos | Escenarios 12-13 | Validación explícita del patrón de miles (grupos de 3 dígitos) y decimales (máx. 1 coma) en paso 4 de la Fase 2 |
| Redondeo a pesos altera el valor de decimales | Escenarios 3, 15 | Solo se redondea **tras** multiplicar por la escala; sin escala no hay decimales (regla de @alephart); el redondeo elimina residuos de punto flotante |
| Consumidor futuro quiere soportar decimales sin escala o negativos | Issue de integración (cuando exista el consumidor) | Decisiones registradas arriba; si se necesitan, issue aparte con justificación de caso de uso real |

## Supuestos

- `'1,5'` sin escala → `null`; formatos soportados (`mil`/`millón`/`M`); varios montos → `null`; `k` y montos en letras fuera — **verificado:** [respuesta de @alephart del 2026-10-22 23:53](https://github.com/Alephart-Co/factory-sandbox/issues/2#issuecomment-6353933405)
- `M` solo en mayúscula; `m` minúscula → `null` (confirmado por @alephart, 2026-10-23)
- `0` es un monto válido (`parseCOP('0')` → `0`) — decisión de este plan; **sin verificar:** si el consumidor prefiere que `'0'` devuelva `null` (ajustar si se pide)
- Negativos y teléfonos de 10+ dígitos sin separadores → `null` — decisión de este plan; **sin verificar:** ejemplos reales de mensajes del contacto (¿hay negativos? ¿cómo escriben los teléfonos?)
- No hay consumidor de `parseCOP` en el repo — **verificado:** `git grep parseCOP` vacío en main; **sin verificar:** otras ramas o repos externos
- No hay CI configurado — **verificado:** `.github/` no existe en el checkout; **sin verificar:** checks configurados fuera del repo (en ajustes de GitHub)
- #3 solo documenta funciones y no depende de comportamientos distintos a este plan — **verificado:** cuerpo de #3 dice "sección corta con `formatCOP` y `parseCOP` y un ejemplo de cada una" (no menciona comportamientos específicos)

## Lo que no verifiqué

- No ejecuté la implementación real de `parseCOP` (el plan describe la lógica pero no la construye hasta la aprobación humana)
- No vi mensajes reales del contacto más allá de los ejemplos del issue y los formatos confirmados por @alephart
- No revisé otras ramas del repo ni repos externos por consumidores de `parseCOP`
- No comprobé si hay checks de CI configurados en ajustes de GitHub (solo verifiqué que `.github/workflows/` no existe en el checkout)

## Preguntas para el humano

- Ninguna — todas las decisiones de comportamiento están confirmadas por @alephart o se derivan sin ambigüedad del issue y sus respuestas.

