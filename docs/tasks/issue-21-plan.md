# Plan v1 — parseCOP no lee montos con punto decimal y escala ('1.5 millones', '2.5 mil') (#21)

2026-11-02 · Factory · Triage: https://github.com/Alephart-Co/factory-sandbox/issues/21#issuecomment-6584409464
Estimación: 2 → 2 puntos (confirmado: una función, pruebas y una línea de README)

## Contexto
`parseCOP` (`src/money.js:19-53`) solo acepta la coma como decimal: la expresión de `src/money.js:30` (`^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?$`) rechaza `'1.5'`, `'2.5'`, `'1.25'` y `'1.2345'`, así que `'1.5 millones'`, `'2.5 mil'`, `'1.25 millones'` y `'2.5M'` dan `null` (verificado ejecutando el código de la rama). `'1.200 millones'` hoy da 1.200.000.000 (punto de miles) y debe seguir igual. `test/money.test.js:88-91` fija `'1.2 millones'` → `null`; @alephart (permiso `admin`, verificado; comentario del 2026-11-02 18:07, sin editar) decidió que esa prueba se reemplaza porque no era una decisión de producto. El triage aceptó el bug (causa `codigo`, prioridad media). Suite actual: 46 pruebas, todas pasan.

## Objetivo y criterio de terminado
Regla decidida por @alephart (2026-11-02 18:07). Con escala (`mil`, `millón/millones`, `M`) y **un solo punto** en el número:
- seguido de 1 o 2 dígitos → decimal: `'1.5 millones'` → 1500000, `'2.5 mil'` → 2500, `'1.25 millones'` → 1250000, `'2.5M'` → 2500000;
- seguido de exactamente 3 dígitos → punto de miles, como hoy: `'1.200 millones'` → 1200000000, `'1.500 mil'` → 1500000;
- seguido de 4 o más dígitos → decimal, igual que con coma: `'1.2345 millones'` → 1234500.
Sin escala nada cambia (`'1.5'`, `'1.2'`, `'1.2345'` → `null`). Mezclas de punto de miles y punto decimal (`'1.234.5 millones'`, `'1.5.5 mil'`) → `null`. `node --test` pasa y las pruebas nuevas fallan sin el cambio.

## Cambios frente al triage
- Regla de desambiguación con escala (1–2 dígitos decimal, 3 miles, 4+ decimal, mezclas `null`, sin escala sin cambio) → cubierta según la decisión de @alephart del 2026-11-02 18:07.
- Reemplazar la prueba `'1.2 millones'` → `null` (`test/money.test.js:90`) → cubierta en Fase 1.
- Estimación 2 puntos → confirmada.

## Alcance
**Dentro:**
- Normalizar en `parseCOP` el punto decimal con escala (`src/money.js`).
- Pruebas en `test/money.test.js` (reemplazo de `:90` y casos nuevos).
- Una línea de ejemplo en `README.md` y su comprobación en `test/readme.test.js`.

**Fuera de alcance:**
- Decimales sin escala (`'1,5'`, `'1.5'`, `'1.200,50'`) → no se hará: @alephart decidió en #19 que `parseCOP` trabaja en pesos enteros y `null` es lo correcto.
- Cambios en `formatCOP` → no se hará: no está afectada.
- Otras escalas o sufijos (`k`, `mil millones`) → no se hará: siguen rechazados como hoy (`test/money.test.js:185`).

## Decisiones técnicas
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Antes de la expresión `formato` (`src/money.js:30`), si `numero` coincide con `/^(\d+)\.(\d{1,2}|\d{4,})$/` se reescribe el punto como coma y sigue el flujo existente | Añadir una tercera rama a la expresión `formato` con más grupos | Reutiliza la ruta ya probada de la coma; el rechazo sin escala (`src/money.js:48`, `escala === 1 && decimales`) y el redondeo (`:52`) se heredan sin código nuevo |
| La condición "solo con escala" no se escribe aparte | Comprobarla en la normalización | Ya la impone `src/money.js:48`: tras reescribir, `'1.5'` es `'1,5'` con `escala === 1` → `null` |
| Los 3 dígitos exactos no entran en la normalización | — | Es la regla decidida y conserva `'1.200 millones'` y `'1.500 mil'` |
| Mezclas (`'1.234.5'`, `'1.5.5'`) no coinciden con la expresión nueva ni con `formato` | Tratarlas con lógica propia | Caen solas en `if (!formato) return null` (`src/money.js:31`) |

## Convenciones
Sin nombres públicos nuevos. Si se introduce una constante local para la expresión del punto decimal, sigue a `ESCALAS` (`src/money.js:16`, constante de módulo en mayúsculas) y a las expresiones inline de `src/money.js:23,30`; basta dejarla inline como esas.
Pruebas nuevas: `test('parseCOP …', …)` con `assert.equal`, como `test/money.test.js:42-48,84-91`.

## Fases
### Fase 0 — Versionar el plan
- Copiar este plan tal como se aprobó a `docs/tasks/issue-21-plan.md`, sin el marcador HTML.
- Verificación: el archivo está en el commit de la rama.

### Fase 1 — Pruebas (primero, deben fallar)
- **Cambios:** en `test/money.test.js` reemplazar `:88-91` por: `'1.2'` sigue `null` (sin escala) y `'1.2 millones'` → 1200000. Añadir pruebas: con punto decimal y escala (`'1.5 millones'` → 1500000, `'2.5 mil'` → 2500, `'1.25 millones'` → 1250000, `'2.5M'` → 2500000, `'$1.5 millones'` → 1500000, `'1.5 millón'` → 1500000, `'0.5 millones'` → 500000); 4+ dígitos (`'1.2345 millones'` → 1234500); 3 dígitos sigue siendo miles (`'1.200 millones'` → 1200000000, `'1.500 mil'` → 1500000); sin escala `null` (`'1.5'`, `'1.2345'`); mezclas `null` (`'1.234.5 millones'`, `'1.5.5 mil'`, `'1.200.5 mil'`, `'1.5,5 millones'`); doble escala sigue `null` (`'1.5 mil millones'`); equivalencia punto/coma (`'1.5 millones'` igual a `'1,5 millones'`).
- **Verificación:** `node --test test/money.test.js` → fallan las pruebas nuevas de punto decimal, antes del cambio.

### Fase 2 — Implementación
- **Cambios:** `src/money.js`, en `parseCOP`: tras `const numero = …` (línea 25) y antes de `formato`, reescribir el punto como coma cuando coincida con `/^(\d+)\.(\d{1,2}|\d{4,})$/` (p. ej. `const normalizado = numero.replace(/^(\d+)\.(\d{1,2}|\d{4,})$/, '$1,$2')` y usarlo en `numero.match`). Actualizar el comentario de la línea 18 con un ejemplo (`'1.5 millones'`).
- **Pruebas:** las de la Fase 1.
- **Verificación:** `node --test` → 0 fallas.

### Fase 3 — README
- **Cambios:** `README.md:11` añadir `parseCOP('1.5 millones')` → `1500000` conservando intacto el ejemplo `` `parseCOP('95 mil')` → `95000` `` (lo comprueba `test/readme.test.js:19`). Añadir en `test/readme.test.js` la comprobación equivalente del ejemplo nuevo (`includes` + `assert.equal`), como `:18-21`.
- **Verificación:** `node --test` → 0 fallas.

## Escenarios de aceptación
| # | Dado | Cuando | Entonces | Y nunca | Cubierto por |
|---|---|---|---|---|---|
| 1 | `'1.5 millones'` | `parseCOP` | 1500000 | `null` | Fase 1 |
| 2 | `'2.5 mil'`, `'1.25 millones'`, `'2.5M'` | `parseCOP` | 2500, 1250000, 2500000 | `null` | Fase 1 |
| 3 | `'1.200 millones'`, `'1.500 mil'` | `parseCOP` | 1200000000, 1500000 | leer 3 dígitos como decimal | Fase 1 |
| 4 | `'1.2345 millones'` | `parseCOP` | 1234500 | `null` | Fase 1 |
| 5 | `'1.5'`, `'1.2'`, `'1.2345'` sin escala | `parseCOP` | `null` | tratar el punto como decimal | Fase 1 |
| 6 | `'1.234.5 millones'`, `'1.5.5 mil'`, `'1.5,5 millones'` | `parseCOP` | `null` | adivinar | Fase 1 |
| 7 | `'$1.200.000'`, `'1.000.000.000'`, `'1,2 millones'`, `'1.5 mil millones'` | `parseCOP` | igual que hoy (1200000, 1000000000, 1200000, `null`) | regresión | pruebas existentes + Fase 1 |

## Operación
- **Entorno de prueba:** local, `node --test` (sin dependencias).
- **Migraciones:** No aplica — función pura sin datos.
- **Rollback:** revertir el commit.
- **Orden de salida a prod:** merge → publicación habitual; la ejecuta una persona.
- **Observabilidad:** No aplica — biblioteca sin telemetría.

## Seguridad y tenancy
No aplica — función pura de texto; la expresión nueva es lineal (sin retroceso catastrófico) y se aplica sobre `\d[\d.,]*` ya acotado.

## Riesgos
| Riesgo | Cómo se detecta temprano | Mitigación |
|---|---|---|
| Un número de 4+ dígitos con un punto de miles tecleado mal (`'1.2345 mil'`) se lee como decimal | Prueba explícita | Es la regla decidida por @alephart; queda documentada en las pruebas |
| Regresión en `'1.200 millones'` / `'$1.200.000'` | Pruebas existentes (`:39,71,81`) y las de Fase 1 | La normalización excluye los 3 dígitos exactos |

## Supuestos
- `'0.5 millones'` → 500000 (la regla no exige entero ≥ 1; la coma ya lo admite) — sin verificar con producto, consecuencia directa de la regla.
- El entero antes del punto puede tener cualquier longitud (`'12345.5 millones'`), igual que con coma — verificado: la ruta de la coma usa `\d+`.

## Lo que no verifiqué
- Uso real de `parseCOP` fuera de este repo.
- Redondeo en flotantes extremos con 4+ decimales (se hereda del código actual, `src/money.js:52`).

## Preguntas para el humano
Ninguna — la regla la decidió @alephart (admin) el 2026-11-02 18:07.
