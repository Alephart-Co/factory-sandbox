# Plan v1 — parseCOP no lee montos con apóstrofo de millones ($1'200.000) (#24)

2026-11-03 · Factory · Triage: https://github.com/Alephart-Co/factory-sandbox/issues/24#issuecomment-6594719480
Estimación: 3 → 3 puntos (cambio acotado en una función, con pruebas y README)

## Contexto
`parseCOP("$1'200.000")` devuelve `null`: la expresión `/\d[\d.,]*/g` (`src/money.js:21`) no incluye el apóstrofo, así que encuentra dos números (`1` y `200.000`) y `src/money.js:22` devuelve `null`. Verificado ejecutando el código actual (también con `’`). El triage clasificó el caso como feature request (causa: requisito) y @alephart (admin) respondió las decisiones de producto el 2026-11-03.

## Objetivo y criterio de terminado
`parseCOP` lee `'` y `’` como separador de millones solo en la forma `N'DDD.DDD`, y todo lo que hoy se lee bien da el mismo resultado. Demostración: `node --test` pasa con las pruebas nuevas y las existentes sin modificar.

## Cambios frente al triage
- Apóstrofo solo como separador de millones, una vez, seguido de exactamente `DDD.DDD` → cubierta, según la respuesta de @alephart del 2026-11-03.
- Cualquier otra forma (`1'200`, `1'200000`, `1'2'000.000`, `1''200.000`) → `null` → cubierta, según @alephart.
- `"1'500 millones"` → `null` → cubierta, según @alephart; se extiende a cualquier escala tras la forma válida (`1'200.000 millones`, `1'200.000 mil`) por la misma regla "no se mezcla con escala".
- `’` igual que `'` → cubierta, según @alephart.
- Resultados actuales sin cambios → cubierta con regresión (escenario 9).
- Triage editado a las 03:34:57 (tras el comentario de @alephart): es la propia actualización del triage con esa respuesta, no una decisión nueva.

## Alcance
**Dentro:**
- Normalización del apóstrofo en `parseCOP` (`src/money.js`).
- Pruebas en `test/money.test.js`; una línea en `README.md` con su prueba en `test/readme.test.js`.

**Fuera de alcance:**
- Que `formatCOP` emita apóstrofo → no se hará: no se pidió.
- Otros separadores (espacio, `_`) → registrar en el Intake del tracker si alguien los pide.
- Apóstrofo en montos de más de 12 dígitos (`1'200.000.000`) → `null` por la regla; sin ítem.

## Decisiones técnicas
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Antes de `matchAll`, reemplazar `N'DDD.DDD` por `N.DDD.DDD` con una expresión acotada | Ampliar `\d[\d.,]*` para admitir `'` | La ampliación dejaría pasar formas mal formadas al validador y obligaría a reescribir `formato` (`:32`); reemplazar reutiliza todo el flujo actual |
| Bandera `conApostrofo` y `null` si hay escala (`escala > 1`) | Dejar que `1'200.000 millones` valga 1.2e12 | Lo decidió @alephart: no se mezcla con escala |
| Expresión: `/(?<![\d.,'’])([1-9]\d{0,2})['’](\d{3}\.\d{3})(?!\d|[.,]\d)/` | Sin lookarounds | Rechaza `1234'200.000`, `1'2'000.000` y `1'200.000.000` sin código extra; deja pasar un `.`/`,` final de frase |

## Convenciones
- `conApostrofo` (variable local) — sigue a `escala` (`src/money.js:37`) y `numeros` (`src/money.js:21`): `const`/`let` en español, minúscula.
- Pruebas nuevas `parseCOP lee …` / `parseCOP rechaza …` — siguen a `test/money.test.js:191` y `:223`.

## Fases
### Fase 0 — Versionar el plan
- Copiar este plan tal como se aprobó a `docs/tasks/issue-24-plan.md`, sin el marcador HTML.
- Verificación: el archivo está en el commit de la rama.

### Fase 1 — Parser
- **Cambios:** `src/money.js`, en `parseCOP`: tras la verificación de tipo, `const conApostrofo = APOSTROFO.test(texto)` y `texto = texto.replace(APOSTROFO, "$1.$2")` (constante de módulo con la expresión de arriba, sin bandera `g` en la de `test`, o usar una sola con `replace` y comparar el resultado). Tras calcular `escala`: `if (conApostrofo && escala > 1) return null;`. Actualizar el comentario de la función con el nuevo formato.
- **Pruebas:** casos de la tabla de escenarios, en `test/money.test.js`.
- **Verificación:** `node --test test/money.test.js` → todo en verde.

### Fase 2 — README
- **Cambios:** `README.md:11` añade `parseCOP("$1'200.000")` → `1200000`; `test/readme.test.js` añade una prueba como la de `:23`.
- **Verificación:** `node --test` → todo en verde.

## Escenarios de aceptación
| # | Dado | Cuando | Entonces | Y nunca | Cubierto por |
|---|---|---|---|---|---|
| 1 | `"$1'200.000"` | `parseCOP` | `1200000` | `null` | Fase 1 |
| 2 | `"1'200.000 pesos"` | `parseCOP` | `1200000` | — | Fase 1 |
| 3 | `"$12'500.000"`, `"123'456.789"` | `parseCOP` | `12500000`, `123456789` | — | Fase 1 |
| 4 | `"$1’200.000"` (tipográfico) | `parseCOP` | `1200000` | — | Fase 1 |
| 5 | `"1'200"`, `"1'200000"`, `"1'2'000.000"`, `"1''200.000"` | `parseCOP` | `null` | leer un monto parcial | Fase 1 |
| 6 | `"1'500 millones"`, `"1'200.000 millones"`, `"1'200.000 mil"`, `"1'200.000 M"` | `parseCOP` | `null` | multiplicar por la escala | Fase 1 |
| 7 | `"1234'200.000"`, `"1'200.000.000"`, `"0'200.000"` | `parseCOP` | `null` | leerlos | Fase 1 |
| 8 | `"1'200.000."` (punto final de frase), `"-1'200.000"` | `parseCOP` | `1200000`; `null` | aceptar negativos | Fase 1 |
| 9 | `"$1.200.000"`, `"95 mil"`, `"1,2 millones"`, `"1.5 millones"`, `"2M"` | `parseCOP` | igual que hoy | regresión | pruebas existentes |

## Operación
- **Entorno de prueba:** local, `node --test` (sin dependencias).
- **Migraciones:** No aplica — función pura.
- **Rollback:** revertir el commit.
- **Orden de salida a prod:** merge → publicación habitual; la ejecuta una persona.
- **Observabilidad:** No aplica — biblioteca sin telemetría.

## Seguridad y tenancy
No aplica — función pura de texto; la expresión es de longitud acotada (sin retroceso catastrófico).

## Riesgos
| Riesgo | Cómo se detecta temprano | Mitigación |
|---|---|---|
| Regresión en montos sin apóstrofo | Pruebas existentes (`test/money.test.js`) | La expresión exige `'`/`’`; sin él, el texto no cambia |
| Un número previo con apóstrofo suelto de otro uso (`"l'a 1.200"`) | Escenario 5 | Sin `N'DDD.DDD` exacto no se reemplaza nada |

## Supuestos
- `"0'200.000"` → `null` (prefijo `[1-9]`) — sin verificar con producto; consecuencia de "bien formado". Es trivial de cambiar.
- El texto con el apóstrofo en un número y otro número aparte sigue dando `null` por la regla de monto único — verificado: `src/money.js:22`.

## Lo que no verifiqué
- Uso real de `parseCOP` fuera de este repo.
- Teclados que emitan otros apóstrofos (`ʼ`, `´`): fuera de lo decidido.

## Preguntas para el humano
Ninguna — las decisiones de comportamiento las confirmó @alephart (admin) el 2026-11-03.
