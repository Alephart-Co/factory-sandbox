# Plan v1 — formatCOP no valida el tipo de entrada (#14)

2026-10-24 · Factory · Triage: https://github.com/Alephart-Co/factory-sandbox/issues/14#issuecomment-6384721373
Estimación: 2 → 2 puntos (confirmado: un archivo de código, pruebas y una línea de README)

## Contexto
`formatCOP` convierte cualquier valor con `String(value)` (`src/money.js:3`) y nunca comprueba el tipo, así que `null` → `'$null'`, `undefined` → `'$undefined'`, `{}` → `'$[object Object]'`, `'abc'` → `'$abc'`, `NaN` → `'$NaN'`. Verificado contra el código actual en `factory/issue-14`. `parseCOP` sí valida con `typeof` (`src/money.js:14`). El triage aceptó el bug (causa `codigo`, prioridad media). El README documenta `formatCOP` en `README.md:10` y `test/readme.test.js:8-10` fija su ejemplo.

## Objetivo y criterio de terminado
- `formatCOP` lanza `TypeError` si el argumento no es un número (`typeof value !== 'number'`) o no es finito (`NaN`, `±Infinity`).
- Para números finitos el resultado no cambia (las pruebas existentes de `test/money.test.js` siguen pasando).
- Strings numéricos como `'1200'` también lanzan `TypeError`.
- `npm test` pasa.

## Cambios frente al triage
- Entradas no numéricas → lanzar `TypeError` → según la respuesta de @alephart del 2026-10-24.
- No aceptar strings numéricos → según la respuesta de @alephart del 2026-10-24.
- `NaN`/`Infinity` (supuesto del triage) → cubierta: lanzan `TypeError`; se repite en "Preguntas para el humano" por ser comportamiento visible no confirmado.
- Notación exponencial (`1e21`) → fuera de alcance, ver abajo.

## Alcance
**Dentro:**
- Guarda al inicio de `formatCOP` en `src/money.js`.
- Pruebas en `test/money.test.js`.
- Una línea en `README.md` que documente el `TypeError`.

**Fuera de alcance:**
- Números en notación exponencial (`1e21` → `'$1e+21'`, `1e-7` → `'$1e-7'`) → registrar en el Intake del tracker.
- Cambiar `parseCOP` → no se hará: ya devuelve `null` ante no-strings.

## Decisiones técnicas
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| `if (typeof value !== 'number' \|\| !Number.isFinite(value)) throw new TypeError(...)` | Devolver `null` | Decisión humana: lanzar `TypeError` |
| Mensaje del error en español: `formatCOP espera un número finito` | Inglés | AGENTS.md: textos en español |
| `NaN`/`Infinity` lanzan `TypeError` (no `RangeError`) | `RangeError` para no finitos | Un solo tipo de error, coherente con la respuesta humana; ver pregunta |
| Sin validación de strings numéricos | Aceptarlos | Decisión humana |

## Convenciones
- Sin nombres nuevos de código. Las pruebas nuevas siguen a las existentes en `test/money.test.js:5-7` y `:20-24` (`test('...', () => { assert... })`, `node:test` + `node:assert/strict`, títulos en español).

## Fases
### Fase 0 — Versionar el plan
- Copiar este plan tal como se aprobó a `docs/tasks/issue-14-plan.md`, sin el marcador HTML.
- Verificación: el archivo está en el commit de la rama.

### Fase 1 — Validar la entrada
- **Cambios:** `src/money.js` → al inicio de `formatCOP`, lanzar `TypeError` si `typeof value !== 'number' || !Number.isFinite(value)`.
- **Pruebas:** en `test/money.test.js`: `assert.throws(() => formatCOP(x), TypeError)` para `null`, `undefined`, `{}`, `[]`, `'abc'`, `'1200'`, `NaN`, `Infinity`, `-Infinity`; y que `formatCOP(0)` → `'$0'` y `formatCOP(-0)` siguen sin lanzar.
- **Verificación:** `node --test` → todas pasan; las pruebas nuevas fallan sin el cambio.

### Fase 2 — Documentar
- **Cambios:** `README.md:10` → añadir que lanza `TypeError` si no recibe un número finito. No alterar el texto `` `formatCOP(1200000)` → `'$1.200.000'` `` que fija `test/readme.test.js:9`.
- **Verificación:** `node --test` → `test/readme.test.js` sigue pasando.

## Escenarios de aceptación
| # | Dado | Cuando | Entonces | Y nunca | Cubierto por |
|---|---|---|---|---|---|
| 1 | `null` o `undefined` | `formatCOP(x)` | `TypeError` | devuelve `'$null'` | test/money.test.js |
| 2 | `{}`, `[]` | `formatCOP(x)` | `TypeError` | `'$[object Object]'` | test/money.test.js |
| 3 | `'1200'`, `'abc'` | `formatCOP(x)` | `TypeError` | formatea el string | test/money.test.js |
| 4 | `NaN`, `±Infinity` | `formatCOP(x)` | `TypeError` | `'$NaN'` | test/money.test.js |
| 5 | `0`, `500`, `1200000`, `-1200.5` | `formatCOP(x)` | igual que hoy | cambia el formato | pruebas existentes |

## Operación
- **Entorno de prueba:** local, `node --test`; sin dependencias.
- **Migraciones:** No aplica — sin datos ni esquema.
- **Rollback:** revertir el commit.
- **Orden de salida a prod:** merge; la ejecuta una persona.
- **Observabilidad:** ahora una entrada inválida falla con excepción en vez de mostrar texto basura; los llamadores deben capturarla si no quieren romper.

## Seguridad y tenancy
No aplica — función pura sin secretos ni datos de clientes.

## Riesgos
| Riesgo | Cómo se detecta temprano | Mitigación |
|---|---|---|
| Un llamador pasa hoy strings numéricos o `null` y ahora rompe | `grep -rn formatCOP` | Verificado: solo pruebas y README usan `formatCOP` en el repo |
| `-0` | Prueba | `Number.isFinite(-0)` es true; sigue el comportamiento actual |

## Supuestos
- No hay más llamadores de `formatCOP` que pruebas y README — verificado con `grep` el 2026-10-24.
- `NaN`/`Infinity` cuentan como "no numéricas" — sin verificar: confirmar con la persona.

## Lo que no verifiqué
- Consumidores fuera de este repositorio.

## Preguntas para el humano
- ¿`NaN` e `Infinity` deben lanzar `TypeError` como las demás entradas no numéricas? Propuesta: sí, `TypeError`.
