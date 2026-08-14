---
name: port-game
description: Genera un spec para portar un juego (desde references/started-games/ o desde cero) al catálogo de Arcade Vault con leaderboard real en Supabase, siguiendo el patrón de SPEC 05 + SPEC 06. Úsalo antes de /spec-impl cuando quieras agregar un juego nuevo jugable con puntuaciones reales.
disable-model-invocation: true
argument-hint: 'nombre del juego a portar, ej. tetris, o vacío para elegir de la lista'
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion, Bash(ls:*), Bash(cat:*), Bash(date:*)
---

# /port-game — Generador de spec para portar juegos al Vault

## Session context

Fecha de hoy (úsala para el header del spec, nunca la adivines):
!`date +%F`

Specs que ya existen:
!`ls specs/ 2>/dev/null || echo "La carpeta specs/ no existe todavía"`

Juegos de referencia disponibles para portar:
!`ls references/started-games/ 2>/dev/null || echo "No existe references/started-games/"`

Componentes de juego ya portados:
!`ls components/games/ 2>/dev/null || echo "No existe components/games/ todavía"`

---

Esta skill genera un **spec** (no escribe código) para portar un juego jugable al catálogo de Arcade Vault, con leaderboard real en Supabase incluido siempre. Sigue exactamente el mismo template y disciplina que `/spec` (ver `template.md` en el skill `spec` instalado globalmente), pero pre-cargado con el patrón que ya se validó en `specs/05-integracion-asteroids.md` (componente de juego real) y `specs/06-leaderboard-tabla-juegos.md` (leaderboard real en Supabase) — de forma que portar el segundo, tercer, N-ésimo juego real no repita ese trabajo de diseño desde cero.

El spec resultante se implementa después con `/spec-impl NN-slug`, igual que cualquier otro spec de este repo.

## Filosofía

SPEC 05 y SPEC 06 ya resolvieron, para ASTEROIDS, dos problemas separables: (1) cómo un juego con lógica real se conecta a la pantalla de juego (`components/games/*.tsx` con el contrato `{paused, onStateChange}` / `{forceGameOver, restart}`, montado en `GamePlayerClient.tsx`), y (2) cómo ese juego guarda y muestra puntuaciones reales en Supabase (`games`/`scores`, `getTopScores`, insert en `handleSaveScore`, guards de podio). Esta skill funde ambos problemas en un solo spec por juego nuevo, porque el usuario de este proyecto decidió que todo juego portado con esta skill lleva leaderboard real desde el primer momento — no hay versión "solo canvas, sin leaderboard".

## Command flow

Sigue las cuatro fases en orden. Tus respuestas deben estar en el mismo idioma del prompt inicial (español por defecto en este repo).

### Phase 1 — Entender el contrato existente

Antes de preguntar nada, reúne contexto real (no lo inventes de memoria):

1. Lee `CLAUDE.md` y `AGENTS.md` del proyecto.
2. **Lee completo `~/.claude/skills/spec/SKILL.md`** (la skill `/spec` instalada globalmente) **y su `~/.claude/skills/spec/template.md`**, antes de escribir nada. No son solo referencia de forma: son el método que gobierna cómo se hace un spec en este repo (fases, forma de preguntar, cuándo escribir sección por sección vs. de una vez, reglas de la sección "Decisions taken and discarded", criterios de aceptación verificables). Todo lo que hagas en Phase 2 y Phase 3 de esta skill debe ser consistente con lo que `/spec` prescribe — este documento (`port-game/SKILL.md`) es una especialización de `/spec` para juegos, no un método aparte.
3. Lee completos `specs/05-integracion-asteroids.md` y `specs/06-leaderboard-tabla-juegos.md`. Son la referencia canónica de contenido: todo spec que generes debe citar sus mismos nombres de archivo, mismo shape de tipos, y mismas decisiones ya tomadas (ver Phase 3).
4. Lee `lib/games.ts`, `lib/app-data.ts`, `components/games/Asteroids.tsx` (el contrato exacto de props/ref: `AsteroidsState`/`AsteroidsProps`/`AsteroidsHandle`), `app/juego/[id]/jugar/GamePlayerClient.tsx`, `app/juego/[id]/page.tsx` y `app/salon/SalonClient.tsx`. Necesitas los patrones concretos ya existentes para citarlos literalmente en el spec: el gate `isAsteroids`, el branch `tab === 'asteroids'` en el salón, los guards `rows[N] &&` del podio.
5. Si `$ARGUMENTS` nombra un juego que coincide con una carpeta de `references/started-games/` (ver el listado en el session context), lee su `game.js`, `CLAUDE.md` y `README.md` como fuente a portar — anota sus constantes, clases/entidades, controles y condiciones de fin de juego.
   - Si no hay match, o el usuario quiere un juego que no está en `references/`, trátalo como **juego desde cero**: en Phase 2 vas a necesitar que el usuario te describa la mecánica mínima, porque no hay `game.js` fuente que portar.
6. Si `$ARGUMENTS` viene vacío, muestra el listado de `references/started-games/` del session context y pregunta cuál portar, o si el usuario prefiere describir un juego nuevo desde cero.

### Phase 2 — Clarificar (bloques de 3–5 preguntas, como `/spec`)

Usa `AskUserQuestion` cuando esté disponible; si no, lista numerada en markdown con tu recomendación marcada.

**Bloque de identidad del juego** (fila que va a `games`):

- `id` (kebab-case, se vuelve la ruta `/juego/{id}` y `/juego/{id}/jugar` — no puede chocar con un `id` ya sembrado).
- `title`, `short`, `long`.
- `cat`: una de `ARCADE | PUZZLE | SHOOTER | VERSUS`.
- `cover`: clase CSS existente en `app/globals.css` o una nueva a crear.
- `color`: una de `cyan | magenta | yellow | green`.
- `best`/`plays` iniciales para el seed (valores de arranque, no reales).

**Bloque de fuente y mecánica:**

- Si viene de `references/started-games/NN-x`: confirma cuál, y si el port debe ser fiel 1:1 a `game.js` o si hay cambios de balance/reglas a propósito.
- Si es desde cero: pide las reglas mínimas — condición de victoria por nivel, condición de game over, cómo sube el score, cuántas vidas (si aplica).
- Controles de teclado exactos a interceptar (para el listener `keydown`/`keyup` con `preventDefault`, igual que `KEY_CODES` en `Asteroids.tsx`).

**Bloque de contrato y alcance:**

- Confirma que el componente sigue el contrato estándar `{paused, onStateChange}` / `{forceGameOver, restart}` (recomendado, default sí) — si el juego necesita algo distinto (ej. un segundo canvas como en tetris para "next piece"), que el usuario lo diga explícitamente.
- El leaderboard real **no se pregunta como sí/no** — siempre se incluye, es una decisión ya tomada en este proyecto. Sí confirma el límite de filas si debe diferir de los defaults (`getTopScores(id, 10)` en detalle, `12` en salón).
- Cualquier cosa fuera de alcance que el usuario mencione de pasada (multiplayer, sonido, mobile/touch) — señala que va a otro spec y pregunta si la dejamos fuera de este.

Detente cuando puedas responder sin asumir nada: qué archivos van a cambiar, cuál es el primer y último paso ejecutable, y cómo se verifica que quedó terminado.

### Phase 3 — Escribir el spec

Aplica el método que leíste en Phase 1 de `~/.claude/skills/spec/SKILL.md` y la forma de `~/.claude/skills/spec/template.md`: mismo orden de secciones (Header, Scope In/Out, Data model, Implementation plan, Acceptance criteria, Decisions taken and discarded, Identified risks), mismas reglas de redacción (objetivo en una sola frase, "out of scope" explícito, criterios de aceptación verificables, no TODOs). Si ya tienes todo lo de Phase 2 sin asumir nada, escribe el spec completo de una vez (no vayas sección por sección pidiendo confirmación) — igual que la regla de `/spec` Phase 3. Si algo quedó sin confirmar en Phase 2, desarrolla sección por sección con confirmación, también igual que `/spec` Phase 3.

Rellena cada sección con el patrón fusionado de SPEC 05 + SPEC 06, adaptado al `{gameId}`/`{GameId}` de este juego:

**Scope (In) — siempre incluye estos puntos:**

- Fila nueva en la tabla `games` de Supabase con los valores confirmados en Phase 2.
- `components/games/{GameId}.tsx`: componente con el contrato estándar, estado mutable en `useRef` (no `useState`), loop `requestAnimationFrame`.
- Wiring en `GamePlayerClient.tsx`: gate `is{GameId}` junto a `isAsteroids`, montaje del canvas, HUD con nivel/score/vidas reales, botones PAUSA/FIN/JUGAR DE NUEVO/SALIR conectados al handle.
- `handleSaveScore` inserta de verdad en `scores` cuando `is{GameId}` (mismo patrón que asteroids: `supabase.from('scores').insert({ game_id: '{gameId}', player_name: name, score })`, error inline sin marcar `saved`, reintentable).
- `app/juego/[id]/page.tsx`: cuando `id === '{gameId}'`, usa `getTopScores('{gameId}', 10)` en vez de `getSeededScores`.
- `SalonClient.tsx`: cuando `tab === '{gameId}'`, usa las filas reales de `getTopScores('{gameId}', 12)`; el podio oculta slots sin dato en vez de acceder a `rows[1]`/`rows[2]` `undefined` (guard `rows[N] &&`).

**Scope (Out) — hereda por defecto de SPEC 05/06 salvo que el usuario pida lo contrario:**

- Controles táctiles/mobile.
- Sonido y balance de dificultad más allá del original portado.
- Cualquier otro juego del catálogo que no sea este.
- Auth real / atar el `player_name` a un usuario autenticado.
- Recalcular `best`/`plays` desde `scores` (quedan estáticos).
- Anti-spam/rate-limiting sobre el insert público.

**Data model:**

```ts
type {GameId}State = { score: number; lives: number; level: number; gameOver: boolean };
type {GameId}Props = { paused: boolean; onStateChange: (state: {GameId}State) => void };
type {GameId}Handle = { forceGameOver: () => void; restart: () => void };
```

Ajusta el shape si Phase 2 confirmó un contrato distinto (documenta el porqué en Decisions). Incluye también la fila SQL de seed para `games` con los valores exactos confirmados.

**Implementation plan** (numerado, cada paso deja el sistema funcional — calca la granularidad de SPEC 05 pasos 1-12 + SPEC 06 pasos 1-11, fusionados y renumerados para un solo juego):

1. Insertar la fila del juego en `games` vía `mcp__supabase__apply_migration`.
2. Crear `components/games/{GameId}.tsx` (portar desde `references/started-games/NN-x/game.js` o implementar desde cero según lo confirmado en Phase 2).
3. Conectar listeners de teclado con `preventDefault` al montar, limpiarlos al desmontar; loop RAF con `cancelAnimationFrame` en cleanup.
4. Exponer `forwardRef`/`useImperativeHandle` con `forceGameOver`/`restart`.
5. Wiring en `GamePlayerClient.tsx`: gate `is{GameId}`, render del canvas, HUD, botones.
6. `handleSaveScore` con insert real gateado por `is{GameId}`.
7. `app/juego/[id]/page.tsx`: `getTopScores` gateado por `id === '{gameId}'`.
8. `SalonClient.tsx`: tab con datos reales + guard de podio.
9. Verificación manual end-to-end: jugar, perder/terminar, guardar puntuación, confirmar que aparece en salón y detalle tras recargar; confirmar que salir del juego no deja listeners de teclado activos en otras pantallas; confirmar que ningún otro juego del catálogo cambió de comportamiento.

**Acceptance criteria** (checklist booleano, adapta al `{GameId}` concreto, cubre como mínimo):

- [ ] El componente renderiza un canvas jugable con los controles confirmados en Phase 2.
- [ ] El HUD refleja en tiempo real el estado interno del juego real, no valores simulados.
- [ ] La mecánica propia del juego (la que lo distingue, ej. división de asteroides) funciona igual que la fuente portada o la descripción desde cero.
- [ ] Perder/terminar la partida dispara el modal de fin de juego existente con la puntuación final real.
- [ ] "PAUSA" congela y reanuda el juego real.
- [ ] "JUGAR DE NUEVO" reinicia completamente el estado interno.
- [ ] "SALIR" no deja listeners de teclado activos en otras pantallas.
- [ ] Ningún otro juego del catálogo cambió de comportamiento.
- [ ] "GUARDAR PUNTUACIÓN" inserta una fila real en `scores` con `player_name`/`score` correctos.
- [ ] El salón de la fama y el detalle del juego reflejan la puntuación guardada tras recargar, ordenada descendente.
- [ ] Con menos de 3 puntuaciones reales, el podio no rompe (no muestra `undefined`).
- [ ] `npm run lint` y `npm run build` pasan sin errores nuevos.

**Decisions taken and discarded** — precarga estas, ya validadas en 05/06 y vigentes para todo juego portado con esta skill:

- El canvas comunica su estado a React vía callback (`onStateChange`), no polling.
- Se deshabilita cualquier auto-reinicio por tecla que el juego original dispare solo — el reinicio pasa a estar controlado exclusivamente por el botón del HUD.
- El leaderboard real se incluye siempre para juegos portados con esta skill — no es una decisión a re-abrir por juego, ya fue tomada a nivel de proyecto.
- Persistencia vía Server Component (fetch) + Client Component (interacción por props), sin Route Handlers intermedios — mismo patrón que `app/juego/[id]/page.tsx` ya usa.
- RLS abierta en `scores` (lectura y escritura pública) — mismo nivel de exposición que el resto del catálogo, anti-spam queda fuera de alcance.

Añade cualquier decisión adicional específica de este juego que haya salido en Phase 2.

**Identified risks** — precarga estos, adaptados al `{gameId}`:

- Fuga de listeners de teclado entre pantallas si el cleanup no remueve `keydown`/`keyup` al desmontar.
- Loop de canvas fantasma si falta `cancelAnimationFrame` en el cleanup.
- Desincronía entre el modal de React y el reinicio interno si queda activo algún atajo de teclado de reinicio del original.
- Podio con menos de 3 puntuaciones reales accediendo a índices `undefined` si falta el guard.
- Desincronía entre el `id` sembrado en `games` y el `id` hardcodeado en el código si hay un typo en la migración de seed.

### Phase 4 — Guardar

Igual que `/spec`:

1. Número secuencial siguiente de `specs/` (highest + 1, zero-padded a 2 dígitos).
2. Slug kebab-case derivado del `id` del juego (ej. `07-integracion-tetris`).
3. Fecha real leída del session context — nunca la adivines.
4. Escribe directo en `specs/NN-slug.md`. No pidas permiso para escribirlo ni preguntes si el nombre está bien — anuncia la ruta en la confirmación final. Solo pregunta si el archivo destino ya existe.
5. Estado `Draft` por defecto. Nunca lo marques `Aprobado`/`Approved` automáticamente.
6. Si el header lista dependencias (`**Depends on:** SPEC 05, SPEC 06`), verifica que existan en `specs/`.
7. Respeta `specs/.spec-config.yml` si existe (no lo toques ni lo recrees — eso ya lo maneja `/spec`).
8. Confirma al usuario: ruta del archivo creado, recordatorio de que está en `Draft`, y que el siguiente paso es `/spec-impl NN-slug` una vez revisado y aprobado. **Detente ahí** — no propongas implementar ni escribir código.

## Hard rules

- **Nunca escribas código durante esta skill.** Solo el `.md` del spec al final.
- **Nunca propongas implementar el spec después de guardarlo.** Eso es trabajo de `/spec-impl`.
- **Nunca asumas decisiones que el usuario no confirmó** — en particular `id`/`title`/controles/fuente del juego. Si falta algo, pregunta en Phase 2.
- **Cita patrones reales del código leído en Phase 1**, no los reinventes — si `GamePlayerClient.tsx` cambió de forma desde que se escribió esta skill, el spec debe reflejar el código actual, no esta descripción.
- **El leaderboard real nunca se omite** para juegos portados con esta skill — es la diferencia principal frente a usar `/spec` genérico para un juego nuevo.
