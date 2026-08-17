---
name: spec-impl-game
description: Implementa un spec de juego aprobado (numerado en specs/ o carpeta de @game-jam) siguiendo el método de /spec-impl, y al terminar encadena @skin-designer y luego @mobile-porter, en ese orden y nunca en paralelo.
disable-model-invocation: true
argument-hint: '<NN-slug> o <game-jam-id>, ej. 11-integracion-ranaria o frogger'
allowed-tools: Read, Glob, Grep, Edit, Write, Task, AskUserQuestion, Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(git log:*), Bash(git diff:*), Bash(cat:*), Bash(ls:*), Bash(npm run lint), Bash(npm run build), mcp__supabase__apply_migration, mcp__supabase__list_tables, mcp__supabase__execute_sql
---

# /spec-impl-game — Implementador de specs de juego, con skins y auditoría móvil encadenadas

## Session context

Current repository state:
!`git status --short`

Current branch:
!`git branch --show-current`

Specs numerados disponibles:
!`ls specs/*.md 2>/dev/null || echo "La carpeta specs/ no tiene .md sueltos"`

Specs de game-jam disponibles:
!`ls specs/game-jam/*/ 2>/dev/null || echo "No hay carpetas en specs/game-jam/"`

Branch-creation config:
!`cat specs/.spec-config.yml 2>/dev/null || echo "AutoCreateBranch: true (default, sin config file)"`

Componentes de juego ya portados:
!`ls components/games/ 2>/dev/null || echo "No existe components/games/ todavía"`

---

## Qué es esto

Esta skill es una **especialización de `/spec-impl`** (mismo método, mismas cuatro fases, mismas reglas de ritmo) para specs cuyo entregable es un juego jugable de Arcade Vault. La diferencia frente a `/spec-impl` genérico:

1. Además de `specs/NN-slug.md`, sabe resolver specs de `@game-jam` en `specs/game-jam/<id>/` (motor + leaderboard, dos `.md`).
2. Al terminar de implementar, **encadena dos subagentes en secuencia estricta**: primero `@skin-designer`, y solo cuando ese termina, `@mobile-porter`. Nunca en paralelo — `mobile-porter` mide en el navegador el resultado visual que `skin-designer` acaba de escribir, así que lanzarlos juntos audita código a medio escribir.

No reemplaza `/spec-impl`: úsala específicamente para specs que porten o diseñen un juego (crean/tocan `components/games/*.tsx`).

---

## Instrucciones

Sigue las cinco fases en orden estricto. **No avances de fase si la anterior no se completó correctamente.**

---

### Fase 0 — Contexto obligatorio del proyecto

Antes de tocar nada, lee (no opines de memoria):

1. `CLAUDE.md` y `AGENTS.md` — el contrato estándar de juego (`XState`/`XProps`/`XHandle`, estado mutable en `useRef`, loop `requestAnimationFrame`, listeners `keydown`/`keyup` con cleanup, sin auto-reinicio por tecla, colores solo vía `lib/skins.ts`) y el aviso de Next.js 16 (leer `node_modules/next/dist/docs/` antes de tocar routing/data-fetching).
2. `references/implemented-games/README.md` — inventario canónico de juegos ya portados.
3. `references/skins/README.md` — memoria de `@skin-designer`: qué paletas ya existen.
4. `references/mobile/README.md` — memoria de `@mobile-porter`: qué se auditó y qué falta.

---

### Fase 1 — Identificar el spec (dos modos)

El argumento recibido es: `$ARGUMENTS`

**Si `$ARGUMENTS` está vacío:** muestra ambos listados de la sesión (specs numerados y carpetas de `specs/game-jam/`) y pregunta cuál implementar. Detente y espera respuesta. No continúes.

**Si `$ARGUMENTS` tiene valor**, prueba en este orden:

1. **Modo numerado** — igual que `/spec-impl`: busca en `specs/` por número (`11`), slug (`integracion-ranaria`) o nombre completo (`11-integracion-ranaria`). Si hay match, la cola de implementación es ese único archivo.
2. **Modo game-jam** — si el argumento coincide con una carpeta de `specs/game-jam/<id>/` (por nombre exacto o aproximado, ej. `frogger`), la cola de implementación son **todos los `.md` de esa carpeta, en orden lexicográfico de nombre de archivo** (el motor antes que el leaderboard — ver `specs/game-jam/frogger/01-frogger-core.md` antes de `02-leaderboard-ranaria.md`). Se implementan uno tras otro, sobre la misma rama, sin volver a pasar por Fase 3.

Si no hay match en ninguno de los dos modos: muestra ambos listados y pide al usuario que corrija el nombre. No adivines ni mezcles modos.

---

### Fase 2 — Validar el estado de cada spec de la cola

Lee cada archivo de la cola (uno en modo numerado, dos en modo game-jam) con Read.

Busca la línea de estado (`**Status:**` / `**Estado:**` u equivalente en cualquier idioma, cerca del encabezado). **Regla absoluta:** solo continúas si el estado de **todos** los archivos de la cola significa "Aprobado" — `Approved`, `Aprobado`, `Aprovado`, `Approuvé`, `Genehmigt`, `Approvato`, o el equivalente claro en otro idioma.

Cualquier otro valor (`Draft`/`Borrador`, `In review`/`En revisión`, `Implemented`/`Implementado`, `Obsolete`/`Obsoleto`, o valor no reconocido) en **cualquiera** de los archivos de la cola detiene todo el proceso — no se implementa parcialmente un game-jam con un solo spec aprobado.

**Mensaje de error estándar** (igual que `/spec-impl`, adaptado a cola):

```
❌ No puedo implementar este spec.

Archivo:        [ruta]
Estado actual:  [ESTADO ENCONTRADO]
Solo trabajo con specs cuyo estado signifique "Aprobado" (p.ej. `Approved`, `Aprobado`,
o el equivalente en otro idioma).

Para continuar tienes dos opciones:
  1. Si el spec está listo, ábrelo y cambia el estado a "Aprobado" manualmente.
     Ese cambio lo hace el humano, no el agente.
  2. Si el spec aún necesita trabajo, usa /spec [nombre] o @game-jam para retomarlo.
```

No ofrezcas alternativas del tipo "puedo empezar igual si quieres". El bloqueo es intencional.

Si es un modo game-jam y el primer `.md` está aprobado pero el segundo no, repórtalo explícitamente: no implementes el primero a solas sin confirmarlo con el usuario, porque el spec de leaderboard suele depender del motor.

---

### Fase 3 — Crear la rama git y cambiar a ella

Una vez confirmado que toda la cola significa `Aprobado`:

0. **Revisa primero el working tree.** Si `git status --short` de la sesión no está vacío, detente, muestra los cambios pendientes y pregunta:

   ```
   ⚠️ Hay cambios sin commitear en el working tree.
   Cambiar de rama los arrastraría. ¿Qué prefieres?
     1. Commitearlos o guardarlos en stash tú mismo, y reejecutar el comando (recomendado)
     2. Continuar de todos modos — los cambios viajan a la rama nueva
   ```

   No stashees ni commitees en nombre del usuario salvo que lo pida explícitamente. Si el working tree está limpio, sáltate este paso sin mencionarlo.

1. Deriva el nombre de rama:
   - modo numerado → `spec-NN-slug` (ej. `spec-11-integracion-ranaria`)
   - modo game-jam → `gamejam-<id>` (ej. `gamejam-frogger`)

2. Lee `AutoCreateBranch` de `specs/.spec-config.yml` (mostrado en la sesión). Ausente o no reconocido → trátalo como `true`. Solo un `false` explícito desactiva la creación automática.

   **`AutoCreateBranch: true` (default):** procede sin preguntar.
   - Rama no existe → créala con `git checkout -b <rama>`.
   - Rama ya existe → se retoma trabajo previo: cámbiate, lee `git log --oneline` de la rama, y dile al usuario qué pasos del plan ya parecen hechos y desde cuál propones retomar. Espera confirmación del punto de retoma antes de tocar código.

   **`AutoCreateBranch: false`:** pregunta antes de tocar git:

   ```
   AutoCreateBranch está en false.
   ¿Creo y cambio a la rama <rama>? [y/N]
   ```
   - Sí → procede como en el caso `true`.
   - No / vacío → no crees rama. Implementa en la rama actual, previa confirmación explícita.

3. Confirma visualmente al usuario:

   ```
   ✅ Listo para implementar.

   Spec(s):  [ruta(s) de la cola]
   Rama:     <rama>  (activa)
   Estado:   Aprobado  (de cada archivo de la cola)
   ```

4. **No empieces a implementar todavía.** Muestra primero el resumen de cada spec de la cola: objetivo, alcance (`## Scope`/`## Alcance`), plan de implementación numerado, y criterios de aceptación. En modo game-jam, muestra ambos resúmenes en el orden de implementación (motor, luego leaderboard).

---

### Fase 4 — Implementar paso a paso

Tras mostrar el resumen, di:

```
Voy a implementar el spec siguiendo el plan al pie de la letra.
Pauso después de cada paso para que revises el diff.

¿Empezamos con el Paso 1?
```

Espera confirmación explícita ("sí", "adelante", "go", o equivalente). No empieces sin ella.

Confirmado, aplica durante toda la implementación:

- **Nunca commitees automáticamente.** Ni por paso, ni al final. Tú escribes el código y muestras el diff; commitear es decisión y comando del usuario.
- **Regla sobre todas:** implementa lo que dice el spec. Si algo te parece subóptimo, coméntalo como observación pero implementa lo acordado. Cambios al spec van al spec, no al código por sorpresa.
- **Reglas de juego, siempre activas:**
  - Estado mutable en `useRef`, nunca `useState`; loop con `requestAnimationFrame` y `cancelAnimationFrame` en el cleanup.
  - El canvas comunica estado a React por callback (`onStateChange`), no polling.
  - Listeners `keydown`/`keyup` con `preventDefault` al montar, removidos al desmontar.
  - Cualquier auto-reinicio por tecla del juego original queda deshabilitado — reinicio solo por el botón del HUD.
  - Todo color de render sale de `getSkin('<id>', skin)` en `lib/skins.ts` — nunca hex literal en el `.tsx`. Si el spec no define las 3 paletas, deja el color en `clasico` fiel al original y anota que `@skin-designer` completará `retro`/`neon` en la Fase 5.
- **Ritmo de trabajo:**
  - Implementa un paso del plan (o, en modo game-jam, todos los pasos del primer `.md` antes de pasar al segundo).
  - Muestra qué archivos tocaste y qué hiciste.
  - Di: `Paso N completado. ¿Revisas el diff y me dices si sigo con el Paso N+1?`
  - Espera confirmación antes de continuar.
- **Ambigüedad no resuelta por el spec:** detente, descríbela, presenta 2-3 opciones concretas, espera decisión. No improvises.
- **Pedido fuera del alcance del spec:** recuerda que está fuera de alcance, sugiere anotarlo para el siguiente spec, no lo implementes en esta rama.

**Al terminar el último paso de toda la cola:**

1. Corre `npm run lint` y `npm run build`. Si algo falla, arréglalo dentro del alcance del spec antes de seguir — **no lances los agentes de la Fase 5 con lint/build rotos.**
2. Si el spec lo contempla, actualiza `references/implemented-games/README.md` con la entrada del juego nuevo.
3. Dile al usuario:
   ```
   ✅ Todos los pasos del plan están implementados. lint y build pasan limpios.

   Voy a encadenar ahora @skin-designer y, al terminar, @mobile-porter — uno
   después del otro, nunca en paralelo. ¿Continúo?
   ```
   Espera confirmación antes de pasar a la Fase 5.

---

### Fase 5 — Encadenar agentes: `@skin-designer` → `@mobile-porter`

**Regla dura:** estrictamente secuencial. Lanza `@skin-designer` con el tool Task en un mensaje; espera su resultado; recién entonces lanza `@mobile-porter` en un mensaje distinto. Nunca dos llamadas a Task en el mismo turno para esto, nunca en background simultáneo.

1. **Lanza `@skin-designer`** (`subagent_type: "skin-designer"`). En el prompt, dale contexto autocontenido (el agente arranca sin memoria de esta conversación):
   - Qué juego se acaba de implementar (`id`, ruta de `components/games/<GameId>.tsx`).
   - Ruta del/los spec(s) recién implementados y la rama activa.
   - Que confirme si el juego ya tiene los 3 skins (`clasico`/`retro`/`neon`) con selector en el HUD y contraste verificado, y que complete lo que falte.

   Espera a que termine. Muestra al usuario un resumen: paletas añadidas o ajustadas, hex, ratios de contraste, archivos tocados (`lib/skins.ts`, el `.tsx` del juego, `GamePlayerClient.tsx` si aplicó selector nuevo).

2. **Verifica que haya un servidor de dev accesible** para la auditoría en navegador (`npm run dev`). Si no está corriendo, avisa al usuario y pregunta si lo levanta o si prefieres lanzarlo tú antes de continuar.

3. **Lanza `@mobile-porter`** (`subagent_type: "mobile-porter"`) — solo después de que el paso 1 haya terminado y se haya mostrado su resumen. En el prompt:
   - Mismo contexto de juego/spec/rama que le diste a `skin-designer`.
   - Que su foco principal es este juego recién portado (ver `references/implemented-games/README.md` para confirmarlo como "nuevo").
   - Que `specs/10-controles-tactiles.md` es referencia obligatoria.
   - Recuérdale que no escribe código: solo mide, prioriza y reporta en `references/mobile/README.md`.

   Espera a que termine. Resume su informe priorizado al usuario tal cual lo entregó — **no apliques tú los fixes**, ese es trabajo de un spec de arreglo posterior.

4. Cierra con:

   ```
   ✅ Spec implementado, skins completos, auditoría móvil registrada.

   Siguiente paso: verifica los criterios de aceptación, marca el/los spec(s)
   como "Implementado", y si el informe de @mobile-porter trae fallos, crea un
   spec de arreglo con /spec antes de mergear esta rama.
   ```

---

## Hard rules

- **Nunca lances los dos agentes a la vez.** `@mobile-porter` audita en navegador el resultado visual que `@skin-designer` acaba de escribir; lanzarlos juntos mide código a medio terminar.
- **Nunca lances ningún agente si la implementación quedó a medias o si `lint`/`build` fallan.**
- **Nunca commitees ni mergees automáticamente** — en ningún punto de las 5 fases.
- **No apliques tú los fixes del informe de `@mobile-porter`** dentro de este comando — eso es un spec de arreglo aparte.
- **Implementa lo que dice el spec.** Cualquier desvío se anota como observación, no se codea por iniciativa propia.
- **En modo game-jam, no implementes el leaderboard sin el motor aprobado e implementado primero** — el segundo spec depende del primero.

---

## Resumen de comportamiento esperado

```
/spec-impl-game 11-integracion-ranaria   (modo numerado, Aprobado)

  Fase 0  →  Lee CLAUDE.md, AGENTS.md, memorias de skins/mobile
  Fase 1  →  Encuentra specs/11-integracion-ranaria.md
  Fase 2  →  Estado "Aprobado" → continúa
  Fase 3  →  git checkout -b spec-11-integracion-ranaria
              Muestra objetivo, alcance, plan, criterios
  Fase 4  →  Implementa paso a paso con pausas; lint+build limpios al final
  Fase 5  →  @skin-designer (espera) → resumen → @mobile-porter (espera) → informe

/spec-impl-game frogger   (modo game-jam, ambos specs Aprobados)

  Fase 1  →  Resuelve specs/game-jam/frogger/ → cola: 01-frogger-core.md, 02-leaderboard-ranaria.md
  Fase 2  →  Valida los dos → ambos Aprobado → continúa
  Fase 3  →  git checkout -b gamejam-frogger
  Fase 4  →  Implementa 01 completo, luego 02, con pausas
  Fase 5  →  @skin-designer → @mobile-porter, secuencial

/spec-impl-game 03-about-contact-email   (estado no es Aprobado)

  Fase 2  →  ❌ Bloquea con el mensaje estándar. No crea rama, no lanza agentes.
```
