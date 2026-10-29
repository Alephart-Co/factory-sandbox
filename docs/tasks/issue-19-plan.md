# Plan v2 — formatCOP muestra los decimales sin separador de miles y con punto decimal (#19)

2026-10-29 · Factory · Triage: https://github.com/Alephart-Co/factory-sandbox/issues/19#issuecomment-6498805945
Estimación: 2 → 2 puntos (confirmado: un archivo de código, pruebas y una línea de README)

> Reemplaza al plan v1. Incorpora la decisión de @alephart de las 14:48 (los valores pequeños redondean a `$0` y ya no lanzan `TypeError`) y atiende la revisión del plan v1 (AJUSTAR, 14:44).

## Contexto
`formatCOP` (`src/money.js:2-14`) convierte con `String(value)` y, si el texto tiene `.`, lo devuelve sin agrupar (`src/money.js:12`): `formatCOP(1234567.5)` → `'$1234567.5'`, ambiguo porque en Colombia el punto separa miles. Con enteros agrupa (línea 13). Verificado contra el código de `main` (`718ac24`, árbol sin cambios; los números de línea coinciden). Esa rama la fijan a propósito `test/money.test.js:15-17` y `:23`. El triage aceptó el bug (causa `codigo`, prioridad media). @alephart (permiso `admin`, verificado) decidió:
1. 2026-10-29 14:18: redondear a pesos enteros, simétrico alejándose del cero, cero sin signo; `1e-6` entra en este ítem.
2. 2026-10-29 14:48: con el redondeo la salida ya no es exponencial, así que los valores pequeños dejan de lanzar `TypeError` y dan `$0` (`1e-7`, `-0.0000005`). El `TypeError` queda solo para |n| ≥ 1e21 (más no finitos y no numéricos). Esto cambia lo decidido en #16 para el extremo pequeño.
3. 2026-10-29 14:48: descartado registrar en el Intake que `parseCOP` rechaza decimales sin escala (`'1,5'`, `'1.200,50'`): el módulo trabaja en pesos enteros y `null` es lo correcto.

## Objetivo y criterio de terminado
- `formatCOP(1234567.5)` → `'$1.234.568'`; `-1.5` → `'-$2'`; `-0.4` → `'$0'`; `1200.567` → `'$1.201'`.
- Cualquier valor con |n| < 1e-6 (incluidos `1e-6`, `1e-7`, `-0.0000005`, `1.5e-7`) → `'$0'`, sin error y sin signo.
- Ninguna salida contiene `.` como decimal ni `,`.
- Siguen lanzando `TypeError` solo los no finitos, los no numéricos y |n| ≥ 1e21.
- `node --test` pasa; las pruebas nuevas fallan sin el cambio.

## Cambios frente al triage
- Redondear a pesos enteros, simétrico, cero sin signo → cubierta (decisión 1).
- `1e-6` entra en este ítem → cubierta: `'$0'`.
- Valores pequeños → `'$0'` sin `TypeError`; guarda exponencial solo desde 1e21 → cubierta (decisión 2); el triage ya lo recoge.
- Ajustar la prueba `parseCOP rechaza la salida de formatCOP con decimales` (`test/money.test.js:140-142`) → cubierta en Fase 1 sin tocar `parseCOP`.
- Pendiente del triage "¿redondeo antes o después de la validación exponencial?" → resuelto: se redondea primero y la única guarda de tamaño es |n| ≥ 1e21 (ver Decisiones técnicas).
- Estimación 2 puntos → confirmada.

## Alcance
**Dentro:**
- `src/money.js`: redondeo en `formatCOP` y guarda de tamaño.
- `test/money.test.js`: reemplazar/ajustar pruebas de decimales y de límites.
- `README.md` línea 10 y `test/readme.test.js`: documentar y verificar el redondeo y el nuevo límite.

**Fuera de alcance:**
- Cambios a `parseCOP` → no se hará: no lo pide el issue; solo cambia su prueba de ida y vuelta.
- `parseCOP` rechazando decimales sin escala (`'1,5'`) → no se registra en Intake: descartado por @alephart (decisión 3).
- Mostrar decimales con coma → no se hará: decidido por @alephart.

## Decisiones técnicas
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Tras validar tipo y finitud, lanzar `TypeError` si `Math.abs(value) >= 1e21`; sustituye la guarda `texto.includes('e')` (`src/money.js:6-9`) | Mantener la guarda sobre `String(value)` | Esa guarda lanzaba también para `1e-7`; la decisión 2 pide `$0`. Para |n| < 1e21, `String(Math.round(n))` no usa notación exponencial |
| `entero = Math.round(Math.abs(value))`; signo `-` solo si `value < 0 && entero !== 0` | `Math.round(value)` | `Math.round(-1.5)` da `-1` (hacia +∞); se pide alejarse del cero. `-0.4` → `$0` sin signo |
| Agrupar con el mismo `replace(/\B(?=(\d{3})+(?!\d))/g, '.')` sobre `String(entero)` | `Intl.NumberFormat('es-CO')` | Mantiene el patrón existente, sin depender de datos de ICU |
| Eliminar `texto`, `absoluto` y la rama `includes('.')` (líneas 6-12) | Mantenerlas | Tras redondear no hay punto decimal |

Comprobado con un script desechable (fuera del repo) con el diseño propuesto: `1234567.5`→`$1.234.568`, `-1.5`→`-$2`, `-0.4`, `1e-7`, `-0.0000005`, `5e-324`, `0.49999999999999994`→`$0`, `1.005`→`$1`, `2.675`→`$3`, `1e20`→`$100.000.000.000.000.000.000`, `±1e21` lanza.

## Convenciones
No aplica — no se agregan nombres nuevos de archivo, función ni campo. Las pruebas nuevas siguen el patrón `test('formatCOP …', …)` de `test/money.test.js:5` y `:193`.

## Fases
### Fase 0 — Versionar el plan
- Copiar este plan **tal como se aprobó** a `docs/tasks/issue-19-plan.md` (junto a `docs/tasks/issue-16-plan.md`), sin el marcador HTML.
- Verificación: el archivo está en el commit de la rama.

### Fase 1 — Redondeo en `formatCOP` y pruebas
- **Cambios:**
  - `src/money.js`: dejar la validación de tipo/finitud (líneas 3-5); sustituir las líneas 6-13 por: `if (Math.abs(value) >= 1e21) throw new TypeError('formatCOP no admite números de 1e21 o más');` `const entero = Math.round(Math.abs(value));` `const signo = value < 0 && entero !== 0 ? '-' : '';` `return signo + '$' + String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, '.');`. Actualizar el comentario de cabecera (una línea: redondea a pesos enteros).
  - `test/money.test.js`:
    - Reemplazar `no agrupa valores con decimales` (líneas 14-17) por `formatCOP redondea a pesos enteros`: `1200.5` → `'$1.201'`, `1200.567` → `'$1.201'`, `1234567.5` → `'$1.234.568'`, `1200.4` → `'$1.200'`, `0.5` → `'$1'`, `1.005` → `'$1'`, `2.675` → `'$3'`.
    - En `pone el signo negativo antes del $` (línea 23) cambiar `formatCOP(-1200.5)` a `'-$1.201'`; añadir `-1.5` → `'-$2'`.
    - Añadir `formatCOP no deja signo en un resultado de cero`: `-0.4` → `'$0'`, `-0.0000005` → `'$0'`, `-1e-7` → `'$0'`.
    - Reemplazar `formatCOP lanza TypeError si el número saldría en notación exponencial` (líneas 186-190) por una prueba que lanza solo con `1e21` y `-1e21`; mensaje de la prueba: `formatCOP lanza TypeError desde 1e21`.
    - Añadir `formatCOP redondea a $0 los valores casi nulos`: `1e-6`, `-1e-6`, `1e-7`, `1.5e-7`, `5e-324` → `'$0'`.
    - En `formatCOP sigue formateando los límites…` (líneas 193-196) quitar la aserción de `1e-6` (pasa a la prueba anterior); conservar `1e20`.
    - Reemplazar `parseCOP rechaza la salida de formatCOP con decimales` (líneas 140-142) por `parseCOP lee de vuelta la salida redondeada de formatCOP`: `parseCOP(formatCOP(1200.5))` → `1201`.
- **Verificación:** `node --test` → todas pasan. Mutación: `git stash push src/money.js`, `node --test` → las pruebas nuevas fallan; `git stash pop`.

### Fase 2 — README
- **Cambios:** `README.md:10`: indicar que redondea a pesos enteros (alejándose del cero, con cero sin signo) antes de agrupar, con ejemplo `formatCOP(1234567.5)` → `'$1.234.568'`; conservar `formatCOP(1200000)` → `'$1.200.000'`; sustituir la frase del `TypeError` por "o si su valor absoluto es 1e21 o mayor"; añadir que los valores por debajo de medio peso dan `'$0'`.
- **Pruebas:** en `test/readme.test.js` añadir obligatoriamente la aserción del ejemplo nuevo, siguiendo `test/readme.test.js:8-11` (`readme.includes("`formatCOP(1234567.5)` → `'$1.234.568'`")` y `formatCOP(1234567.5) === '$1.234.568'`).
- **Verificación:** `node --test` → pasa.

## Escenarios de aceptación
| # | Dado | Cuando | Entonces | Y nunca | Cubierto por |
|---|---|---|---|---|---|
| 1 | 1234567.5 | `formatCOP` | `'$1.234.568'` | `'$1234567.5'` | `redondea a pesos enteros` |
| 2 | -1.5 | `formatCOP` | `'-$2'` | `'-$1'` | prueba de signo negativo |
| 3 | -0.4, -0.0000005 | `formatCOP` | `'$0'` | `'-$0'`, `TypeError` | `no deja signo…` |
| 4 | 1e-6, 1e-7, 1.5e-7, 5e-324 | `formatCOP` | `'$0'` | `TypeError`, `'$0.000001'` | `redondea a $0 los valores casi nulos` |
| 5 | 1e21, -1e21, NaN, `'1200'`, `null` | `formatCOP` | `TypeError` | una salida con `e` | `lanza TypeError desde 1e21` y pruebas existentes (181-185) |
| 6 | enteros 500, 1000, 1200000 | `formatCOP` | sin cambio | — | pruebas existentes (5-13) |
| 7 | 1200.5 | `parseCOP(formatCOP(x))` | `1201` | `null` | prueba de ida y vuelta |
| 8 | 1e20 | `formatCOP` | `'$100.000.000.000.000.000.000'` | notación exponencial | prueba de límites |
| 9 | 1.005, 2.675 | `formatCOP` | `'$1'`, `'$3'` | — | `redondea a pesos enteros` |

## Operación
- **Entorno de prueba:** local, `node --test` (sin dependencias, `AGENTS.md`).
- **Migraciones:** No aplica.
- **Rollback:** revertir el commit/PR.
- **Orden de salida a prod:** merge; la salida a prod la ejecuta una persona.
- **Observabilidad:** No aplica — función pura.

## Seguridad y tenancy
No aplica — función pura sin secretos ni datos de clientes.

## Riesgos
| Riesgo | Cómo se detecta temprano | Mitigación |
|---|---|---|
| Imprecisión binaria al redondear (`x.4999…`) | Pruebas con `1.005`, `2.675` y `0.49999999999999994` (este último en el script de comprobación; da `$0`) | Se redondea el valor numérico tal cual; con enteros resultantes no hay ambigüedad salvo en `.5` exactos, que alejan del cero |
| Un llamador depende de ver decimales o del `TypeError` de valores pequeños | `git grep formatCOP` solo muestra `src/money.js`, pruebas, README y `docs/tasks/` | Cambio decidido por @alephart |

## Supuestos
- `formatCOP` no tiene otros llamadores en el repo — verificado: `git grep formatCOP` solo encuentra `src/money.js`, `test/`, `README.md` y `docs/tasks/`.
- `Math.round` sobre el valor absoluto aleja del cero en los `.5` exactos — verificado con el script desechable (`1234567.5`, `-1.5`).
- Para |n| < 1e21 `String(Math.round(n))` no usa notación exponencial — verificado (`1e20` → `'100000000000000000000'`).
- La rama `factory/issue-19` es local de la sesión; las citas de línea se verificaron contra `main` (`718ac24`).

## Lo que no verifiqué
- No ejecuté `node --test` sobre los cambios (aún no están hechos); solo el script desechable del diseño.
- No cubrí valores enteros mayores a 2^53 (ya son enteros; el redondeo no los cambia).

## Preguntas para el humano
- Ninguna
