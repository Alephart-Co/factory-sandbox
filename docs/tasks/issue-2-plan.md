# Plan v1 — Agregar parseCOP para leer montos escritos por el contacto (#2)

2026-10-22 · Factory (mastracode-web-v1) · Triage: https://github.com/Alephart-Co/factory-sandbox/issues/2#issuecomment-6353870926
Estimación: 5 puntos → 5 puntos confirmados (sin cambio).

## Contexto
El contacto escribe montos en texto libre (`$1.200.000`, `95 mil`, `1,2 millones`) y hoy no hay forma de convertirlos en número. Verificado contra el código actual: `src/money.js:2` solo exporta `formatCOP` (número → texto), y `grep parseCOP` no encuentra nada en `src/` ni en `test/`. No hay consumidores en el repo que dependan del parser. El triage decidió aceptar como feature request, causa raíz `requisito`, prioridad media, y dejó tres supuestos abiertos (separadores, formatos, varios montos), que este plan resuelve abajo.

## Objetivo y criterio de terminado
- `parseCOP(texto)` exportado desde `src/money.js` devuelve el monto como número o `null`.
- `npm test` pasa, incluidas las pruebas nuevas de `parseCOP` y las 4 existentes de `formatCOP`.
- Los tres ejemplos del issue dan el valor exacto: `'$1.200.000'` → `1200000`, `'95 mil'` → `95000`, `'1,2 millones'` → `1200000`. Sin monto → `null`.

## Cambios frente al triage
- Separador decimal `,` sin palabra de escala (`1,5`) → cubierta: se lee como decimal colombiano (`1.5`). Razón: en COP el punto agrupa miles y la coma decimal; es la convención del propio `formatCOP`, que deja decimales con punto en su salida.
- Formatos fuera de los tres ejemplos (`un millón`, `2M`) → cubierta como no soportada: devuelven `null`. Razón: el triage lo dejó fuera salvo confirmación; no hay confirmación.
- Varios montos en un texto → cubierta: se devuelve el primero (supuesto del triage sin cambio).
- Estimación → sin cambio.

## Alcance
**Dentro:**
- Función `parseCOP` en `src/money.js`.
- Pruebas de `parseCOP` en `test/money.test.js`.

**Fuera de alcance** (cada punto con su destino):
- Integrar `parseCOP` con el flujo del contacto (no existe en el repo) → no se hará en este ítem: requiere un issue propio cuando exista el consumidor.
- Soporte de `un millón`, `2M`, palabras con errores ortográficos → no se hará: fuera del alcance del triage; registrar en el Intake del tracker si el autor lo pide.
- Otros usos de `formatCOP` → no se toca.

## Decisiones técnicas
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Función pura en `src/money.js`, junto a `formatCOP` | Módulo nuevo `src/parse-money.js` | El módulo ya agrupa la lógica de montos COP; un archivo nuevo no aporta nada |
| Una sola expresión regular sobre el texto, sin librerías | Librería de parseo de números | AGENTS.md: JavaScript sin dependencias externas |
| Puntos como separador de miles solo si van en grupos de 3 dígitos; coma como decimal | Tratar cualquier punto como decimal | Coincide con la convención COP y evita leer `1.200` como 1.2 |
| Un punto que no forma grupos de 3 (`1.2`) → `null` | Devolver 1 o 1.2 en silencio | Un monto mal leído es peor que un monto ausente; el llamador decide |
| Multiplicar por la escala en aritmética decimal y redondear a 2 decimales | Multiplicar flotantes sin redondeo | `1.2 * 1000000` en flotante puede dar residuos; el redondeo fija `1200000` |
| Entrada no textual → `null` | Lanzar excepción | Es texto del contacto (entrada de borde); AGENTS.md no pide validación extra fuera de este límite |

## Convenciones
- `parseCOP` — sigue a `formatCOP` (`src/money.js:2`): función exportada en nombre `…COP`, sin clase ni estado. Solo existe ese ejemplo en el repo; no hay segundo modelo que citar.
- Pruebas nuevas — siguen el estilo de `test/money.test.js:5` (`test('…', () => assert.equal(…))` con descripción en español y `node:test` + `node:assert/strict`).

## Fases
### Fase 0 — Versionar el plan
- Copiar este plan **tal como se aprobó** a `docs/tasks/issue-2-plan.md` (crear `docs/tasks/` si no existe), sin el marcador HTML.
- Verificación: el archivo está en el commit de la rama.

### Fase 1 — Implementar `parseCOP`
- **Cambios:** `src/money.js` → agregar `export function parseCOP(texto)`. Reglas:
  1. Si `texto` no es string → `null`.
  2. Buscar el primer número con separadores: grupos `\d{1,3}(\.\d{3})+` o dígitos simples, coma decimal opcional, y palabra de escala opcional `mil` / `millones` (sin distinguir mayúsculas, con espacios opcionales). Ignorar `$`.
  3. Si el número tiene un punto que no forma grupos de 3 dígitos → `null`.
  4. Valor = parte entera + decimal × escala (`mil` = 1000, `millones` = 1000000), redondeado a 2 decimales.
  5. Sin número → `null`.
- **Pruebas:** en `test/money.test.js`, un bloque nuevo con los casos de la tabla de escenarios.
- **Verificación:** `npm test` → todas las pruebas pasan (4 existentes + las nuevas), sin fallos.

### Fase 2 — Revisión de estilo y alcance
- **Cambios:** ninguno de código; solo confirmar que el diff toca únicamente `src/money.js` y `test/money.test.js` (y `docs/tasks/`, Fase 0).
- **Pruebas:** no aplica — revisión de diff.
- **Verificación:** `git diff --stat` → solo esos archivos; `node --test` → sin fallos.

## Escenarios de aceptación
Para código: cada fila es un caso de prueba.

| # | Dado | Cuando | Entonces | Y nunca | Cubierto por |
|---|---|---|---|---|---|
| 1 | `'$1.200.000'` | `parseCOP` | `1200000` | — | prueba de grupos de miles |
| 2 | `'95 mil'` | `parseCOP` | `95000` | — | prueba de escala `mil` |
| 3 | `'1,2 millones'` | `parseCOP` | `1200000` | valor flotante inexacto | prueba de decimal con escala |
| 4 | `'1,5'` | `parseCOP` | `1.5` | `15` | prueba de coma decimal sin escala |
| 5 | `'hola, ¿cuánto cuesta?'` | `parseCOP` | `null` | — | prueba de sin monto |
| 6 | `''` y `'mil'` | `parseCOP` | `null` | — | prueba de vacío y de escala sin número |
| 7 | `null`, `42` (no string) | `parseCOP` | `null` | lanzar excepción | prueba de entrada no textual |
| 8 | `'1.2'` | `parseCOP` | `null` | `1` o `1.2` | prueba de punto no agrupado |
| 9 | `'pagó 2 millones y 5 mil'` | `parseCOP` | `2000000` | `5000` | prueba de varios montos |
| 10 | `'un millón'` | `parseCOP` | `null` | — | prueba de formato no soportado |

## Operación
- **Entorno de prueba:** repo local `factory-sandbox`, `npm test` (Node 20+).
- **Migraciones:** no aplica — sin base de datos.
- **Rollback:** revertir el commit que agrega `parseCOP` y sus pruebas.
- **Orden de salida a prod:** merge → (sin deploy de servicio: repo de juguete). La salida la ejecuta una persona.
- **Observabilidad:** `npm test` en CI; un fallo de las pruebas nuevas lo muestra.

## Seguridad y tenancy
No aplica — función pura de texto sin secretos, sin datos de clientes ni escritura. La entrada es texto del contacto: se trata solo como texto (no se evalúa ni se ejecuta).

## Riesgos
| Riesgo | Cómo se detecta temprano | Mitigación |
|---|---|---|
| Expresión regular que acepta montos mal formados (`1.2.3`) | Escenarios 8 y pruebas de grupos | Exigir grupos de 3 dígitos; `null` en otro caso |
| Redondeo que cambia el valor (`1,2 millones`) | Escenario 3 | Aritmética decimal + redondeo a 2 decimales |
| Consumidor futuro espera otro comportamiento con `1,5` | Revisión de Planning / próximo issue de integración | Decisión registrada en "Cambios frente al triage" |

## Supuestos
- En `1,5` sin escala la coma es decimal (`1.5`) — verificado: convención de COP y `formatCOP` (`src/money.js:2`) usa punto decimal | sin verificar: confirmación del autor del issue.
- Solo se soportan `mil` y `millones` — verificado: el issue da solo esos ejemplos | sin verificar: pedido de `un millón` o `2M` por el autor.
- Con varios montos se devuelve el primero — verificado: sin consumidor en el repo, es decisión de diseño | sin verificar: caso real del contacto.
- No hay consumidor de `parseCOP` en el repo — verificado: búsqueda de texto en `src/` y `test/` | sin verificar: otras ramas o repos que lo llamen.

## Lo que no verifiqué
- No se ejecutó la implementación: el plan no se construye hasta la aprobación humana.
- No se revisaron ejemplos reales de mensajes del contacto más allá de los tres del issue.
- `.artifacts/` no tiene `.gitignore` en el repo: el archivo de este plan quedará como no versionado; no se debe commitear.

## Preguntas para el humano
- Ninguna
