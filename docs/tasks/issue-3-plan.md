# Plan v1 — Documentar en el README las funciones de dinero (#3)

2026-10-23 · Factory · Triage: https://github.com/Alephart-Co/factory-sandbox/issues/3#issuecomment-6369750418
Estimación: 1 → 1 punto (confirmado: solo README y una prueba pequeña)

## Contexto
`README.md` tiene 3 líneas (descripción y `npm test`) y no documenta `src/money.js`, que exporta `formatCOP` (línea 2) y `parseCOP` (línea 14). Verificado contra el código actual en la rama `factory/issue-3`. El triage aceptó el ítem como docs, causa raíz `requisito`, prioridad baja.

## Objetivo y criterio de terminado
- `README.md` tiene una sección corta en español sobre `formatCOP` y `parseCOP`, con un ejemplo de cada una.
- Los ejemplos del README son ciertos: una prueba los ejecuta contra el código.
- `npm test` pasa.

## Cambios frente al triage
- Sección corta con un ejemplo de cada función → cubierta.
- Pregunta del triage (¿mencionar que `parseCOP` devuelve `null`?) → sin respuesta humana en el hilo; el plan aplica la propuesta (una línea) y la repite en "Preguntas para el humano".
- Hallazgo lateral (`formatCOP(null)` → `'$null'`) → fuera de alcance, ver abajo.

## Alcance
**Dentro:**
- Sección "Funciones de dinero" en `README.md` con un ejemplo de `formatCOP` y uno de `parseCOP`, y una línea sobre `null`.
- Prueba que verifica los ejemplos documentados.

**Fuera de alcance:**
- Validar tipos en `formatCOP` (`null` → `'$null'`, `src/money.js:2-7`) → registrar en el Intake del tracker.
- Documentar todas las reglas de `parseCOP` (escalas, rechazos) → no se hará: el issue pide una sección corta.
- Cambios a `src/money.js` → no se hará: no hay defecto.

## Decisiones técnicas
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Ejemplos tomados de pruebas existentes (`formatCOP(1200000)` → `$1.200.000`, `parseCOP('95 mil')` → `95000`; `test/money.test.js`) | Ejemplos nuevos | Ya están probados y reflejan el comportamiento real |
| Prueba `test/readme.test.js` que comprueba que el README contiene las llamadas de ejemplo y que sus resultados son los documentados | Sin prueba | AGENTS.md: todo cambio lleva su prueba |
| README en español | Inglés | AGENTS.md: textos para el usuario final en español |

## Convenciones
- `test/readme.test.js` — sigue a `test/money.test.js` (mismo directorio, sufijo `.test.js`, `node:test` + `node:assert/strict`, imports ES relativos a `../src/`) y a la regla `node --test` de `package.json` (`scripts.test`).
- Sin nombres nuevos de código.

## Fases
### Fase 0 — Versionar el plan
- Copiar este plan tal como se aprobó a `docs/tasks/issue-3-plan.md`, sin el marcador HTML (como `docs/tasks/issue-2-plan.md`).
- Verificación: el archivo está en el commit de la rama.

### Fase 1 — Sección del README
- **Cambios:** `README.md` → agregar al final:
  ```
  ## Funciones de dinero

  `src/money.js` exporta dos funciones para pesos colombianos (COP):

  - `formatCOP(valor)` — da formato de pesos con punto de miles: `formatCOP(1200000)` → `'$1.200.000'`.
  - `parseCOP(texto)` — lee un único monto escrito por el contacto: `parseCOP('95 mil')` → `95000`. Devuelve `null` si no hay un monto único y claro.
  ```
- **Pruebas:** ver Fase 2.
- **Verificación:** `git diff README.md` muestra solo la sección nueva.

### Fase 2 — Prueba de los ejemplos
- **Cambios:** `test/readme.test.js` → lee `README.md`; afirma que contiene `formatCOP(1200000)` con `$1.200.000` y `parseCOP('95 mil')` con `95000`, y que `formatCOP(1200000) === '$1.200.000'` y `parseCOP('95 mil') === 95000`.
- **Pruebas:** la nueva; falla si el README o el código se desalinean.
- **Verificación:** `npm test` → todas las pruebas pasan, incluida la nueva.

## Escenarios de aceptación
| # | Dado | Cuando | Entonces | Y nunca | Cubierto por |
|---|---|---|---|---|---|
| 1 | README con el ejemplo de `formatCOP` | se ejecuta `formatCOP(1200000)` | devuelve `$1.200.000` | el README documenta otro resultado | `test/readme.test.js` |
| 2 | README con el ejemplo de `parseCOP` | se ejecuta `parseCOP('95 mil')` | devuelve `95000` | el README documenta otro resultado | `test/readme.test.js` |
| 3 | texto sin monto claro | `parseCOP('hola')` | `null` (documentado en una línea) | — | `test/money.test.js` (existente) |

## Operación
- **Entorno de prueba:** local, `npm test` (Node 20+).
- **Migraciones:** No aplica — solo documentación y una prueba.
- **Rollback:** revertir el commit.
- **Orden de salida a prod:** No aplica — merge del PR por una persona.
- **Observabilidad:** No aplica.

## Seguridad y tenancy
No aplica — sin secretos ni datos de clientes.

## Riesgos
| Riesgo | Cómo se detecta temprano | Mitigación |
|---|---|---|
| El README se desalinea del código | `npm test` falla | La prueba de Fase 2 |

## Supuestos
- Los ejemplos de `test/money.test.js` siguen válidos — verificado: leídos en esta rama.
- Una prueba de README es aceptable para cumplir "todo cambio lleva su prueba" — sin verificar: confirmar con quien aprueba.

## Lo que no verifiqué
- No ejecuté `npm test` en esta fase; no se modificó nada versionado.

## Preguntas para el humano
- ¿Debe el README mencionar que `parseCOP` devuelve `null` sin monto único y claro? Propuesta: sí, una línea (incluida en el plan).
