# Plan v1 — parseCOP lee "$2MM" como 2 pesos en vez de 2 millones (#27)

2026-11-22 · Factory · Triage: https://github.com/Alephart-Co/factory-sandbox/issues/27#issuecomment-7081289721
Estimación: 2 → 2 puntos (confirmados)

## Contexto
`parseCOP` (`src/money.js:21`) lee la palabra que sigue al número (`:42`). Solo reconoce las escalas de `ESCALAS` (`:14`) y la `M` exacta (`:47`); rechaza con `null` `k`, `m` y prefijos `mil` (`:48`). `MM` no cae en ninguna rama, se trata como palabra desconocida (ruido) y devuelve el número sin escala: `$2MM`→2, `2 MM`→2, `2mm`→2. `1,5MM`→`null` porque con escala 1 los decimales se rechazan (`:59`). Verificado en la rama actual (`factory/issue-27`, sobre `69480a2`). El triage aceptó el bug (prioridad alta).

## Objetivo y criterio de terminado
- `parseCOP('$2MM')`, `parseCOP('2 MM')` → `2000000`; `parseCOP('1,5MM')` → `1500000`; `parseCOP('2mm')` → `null`.
- `npm test` en verde, con una prueba por cada fila de la tabla del issue.

## Cambios frente al triage
- `MM` mayúscula = millones → cubierta, según la respuesta de @alephart (admin) del 2026-11-22.
- `mm` → `null` → cubierta, según la respuesta de @alephart del 2026-11-22.
- Palabras coloquiales/desconocidas (`5 lucas`) fuera → cubierta (queda fuera), según @alephart: lo registra él por aparte.
- Hallazgo `2 MMM` → pasa a **dentro** del alcance: la misma regla (rechazar toda secuencia de `m` que no sea `M` ni `MM`) lo resuelve sin código extra, por eso no queda "fuera de alcance".

## Alcance
**Dentro:**
- `MM` exacta como escala 1.000.000 (con/sin `$`, espacio, decimales).
- `null` para otras secuencias de solo `m`/`M` (`mm`, `mM`, `Mm`, `MMM`), manteniendo `m`→`null` y `M`→millones.
- `2 MM mil` / `5 mil MM` → `null` (dos escalas seguidas, como ya ocurre con `M`).

**Fuera de alcance:**
- Palabras desconocidas/coloquiales (`5 lucas`) → las registra @alephart por aparte.
- Cambiar que las palabras desconocidas se ignoren (`$50.000 pesos`, `5 constructor`→5 siguen igual) → no se hará: comportamiento diseñado y con pruebas.

## Decisiones técnicas
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Rama explícita `palabra === 'MM'` junto a la de `'M'` (`:47`) | Agregar `mm` a `ESCALAS` | `ESCALAS` se consulta en minúscula (`:45-46`) y haría válido `2mm`, contra la decisión de que sea `null` |
| Reemplazar `minuscula === 'm'` (`:48`) por `/^m+$/.test(minuscula)` | Listar `mm`, `mmm` una a una | Cubre cualquier longitud; `M` y `MM` ya salieron antes por sus ramas |
| Extender el chequeo de doble escala (`:55`) a `'MM'` | Dejarlo | Sin esto `2 MM mil` daría 2.000.000 en vez de `null`, inconsistente con `2 M mil` |

## Convenciones
No hay nombres nuevos (sin funciones, constantes ni archivos). Las pruebas siguen el patrón `test('parseCOP …', () => { assert.equal(...) })` de `test/money.test.js` (p. ej. "parseCOP rechaza la m minúscula (ambigua con metro)" y "parseCOP rechaza dos escalas seguidas").

## Fases
### Fase 0 — Versionar el plan
- Copiar este plan tal como se aprobó a `docs/tasks/issue-27-plan.md` (crear `docs/tasks/` si no existe), sin el marcador HTML.
- Verificación: el archivo está en el commit de la rama.

### Fase 1 — Pruebas que fallan
- **Cambios:** `test/money.test.js` → agregar al final:
  - `parseCOP lee MM como millones`: `'$2MM'`, `'2 MM'`, `'2MM'` → 2000000; `'1,5MM'`, `'1.5MM'` → 1500000.
  - `parseCOP rechaza mm y otras secuencias de m`: `'2mm'`, `'2 mM'`, `'2 Mm'`, `'2MMM'` → `null`.
  - `parseCOP rechaza MM seguida de otra escala`: `'2 MM mil'`, `'5 mil MM'`, `'2 MM millones'` → `null`.
- **Verificación:** `npm test` → fallan solo las pruebas nuevas.

### Fase 2 — Implementar
- **Cambios:** `src/money.js`:
  - tras `:47` agregar `else if (palabra === 'MM') escala = 1000000;`
  - `:48`: `minuscula === 'm'` → `/^m+$/.test(minuscula)`.
  - `:55`: `siguiente === 'M'` → `siguiente === 'M' || siguiente === 'MM'`.
  - actualizar el comentario de `:19` para mencionar `'2MM'`.
- **Pruebas:** las de la Fase 1 y las existentes (`2M`→2000000, `2m`→null, `5 mil millones`→null, `$50.000 pesos`→50000).
- **Verificación:** `npm test` → todo en verde.

## Escenarios de aceptación
| # | Dado | Cuando | Entonces | Y nunca | Cubierto por |
|---|---|---|---|---|---|
| 1 | `'$2MM'` | parseCOP | 2000000 | 2 | prueba "lee MM" |
| 2 | `'2 MM'` | parseCOP | 2000000 | 2 | idem |
| 3 | `'1,5MM'` | parseCOP | 1500000 | `null` | idem |
| 4 | `'2mm'` | parseCOP | `null` | 2 ni 2000000 | prueba "rechaza mm" |
| 5 | `'2MMM'` | parseCOP | `null` | 2 | idem |
| 6 | `'2 MM mil'` | parseCOP | `null` | 2000000 | prueba "MM seguida de escala" |
| 7 | `'2M'`, `'2m'` | parseCOP | 2000000, `null` | cambio de comportamiento | pruebas existentes |
| 8 | `'$50.000 pesos'` | parseCOP | 50000 | `null` | prueba existente |

## Operación
- **Entorno de prueba:** local, `npm test` (`node --test`, sin dependencias).
- **Migraciones:** No aplica — sin datos ni esquema.
- **Rollback:** revertir el commit; función pura sin estado.
- **Orden de salida a prod:** merge del PR; lo ejecuta una persona.
- **Observabilidad:** No aplica — librería pura; la cubren las pruebas.

## Seguridad y tenancy
No aplica — función pura sobre texto, sin secretos ni datos por cliente. La regla `/^m+$/` no tiene backtracking costoso.

## Riesgos
| Riesgo | Cómo se detecta temprano | Mitigación |
|---|---|---|
| Romper `M`/`m` existentes | Pruebas existentes en `npm test` | `M` y `MM` se evalúan antes del rechazo por `/^m+$/` |
| Texto pegado tipo `2MMx` sigue devolviendo 2 | Revisión | Es el comportamiento de palabra desconocida, fuera de alcance |

## Supuestos
- `MM` solo en mayúsculas es escala — verificado: respuesta de @alephart y simetría con `M` (`src/money.js:47`).
- Los números de línea corresponden a `69480a2` — verificado leyendo el archivo.

## Lo que no verifiqué
- Consumidores externos de `parseCOP` fuera de este repo.

## Preguntas para el humano
- Ninguna
