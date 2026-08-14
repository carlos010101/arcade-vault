# SPEC 07 — Integración del juego real de Tetris

> **Status:** Aprobado
> **Depends on:** SPEC 05, SPEC 06
> **Date:** 2026-08-14
> **Objective:** Renombrar la entrada del catálogo `caida`/`CAÍDA` a `tetris`/`TETRIS` y portar el juego standalone de `references/started-games/03-tetris/game.js` a un componente React (`components/games/Tetris.tsx`) conectado a `/juego/tetris/jugar`, con leaderboard real en Supabase, siguiendo el mismo patrón validado en SPEC 05 (componente de juego real) y SPEC 06 (persistencia real de puntuaciones), sin tocar el resto del catálogo.

## Scope

**In:**

- Migración en Supabase (`mcp__supabase__apply_migration`) que actualiza la fila existente de `games` con `id: "caida"` a `id: "tetris"` y `title: "CAÍDA"` a `title: "TETRIS"`. El resto de columnas (`cover: "cover-tetro"`, `cat: "PUZZLE"`, `color: "magenta"`, `best: 184220`, `plays: "31.8K"`) se mantiene sin cambios. Esto cambia la ruta pública de `/juego/caida` y `/juego/caida/jugar` a `/juego/tetris` y `/juego/tetris/jugar`.
- Nuevo componente `components/games/Tetris.tsx`: dos canvas —tablero 10×20 (`COLS`/`ROWS`/`BLOCK` = 30px, 300×600) y preview de la siguiente pieza (120×120)— con la lógica completa portada de `game.js`: tablero (`board`), las 8 piezas (`PIECES`, incluida la N/tuerca), rotación con wall kicks (`rotateCW`, `tryRotate`), colisiones (`collide`), fusión (`merge`), limpieza de líneas (`clearLines`), pieza fantasma (`ghostY`), scoring (`LINE_SCORES` × nivel, +2/celda hard drop, +1/fila soft drop), nivel y velocidad (`dropInterval = max(100, 1000 − (level−1)×90)`, nivel = `floor(lines/10)+1`).
- El componente expone:
  - Prop `paused: boolean` — congela el avance del loop (auto-drop y `draw()` de la pieza en movimiento) sin cancelar `requestAnimationFrame`.
  - Prop `onStateChange(state: { score: number; lines: number; level: number; gameOver: boolean }) => void` — se invoca cuando cambia alguno de esos valores.
  - Un handle vía `forwardRef` + `useImperativeHandle`: `{ forceGameOver(): void; restart(): void }`.
- Excepción documentada al contrato estándar de un solo canvas (SPEC 05): `Tetris.tsx` renderiza dos `<canvas>` propios (tablero + preview de siguiente pieza) dentro del mismo bloque que ocupa `.crt-screen`, porque el original depende de esa vista previa para la mecánica de planificación del jugador.
- Wiring en `GamePlayerClient.tsx`: gate `isTetris = game.id === 'tetris'` junto a `isAsteroids`; montaje de `Tetris` dentro de `.crt-screen` cuando `isTetris`. El HUD se vuelve condicional por juego: para Tetris se muestra "Puntuación" / "Líneas" / "Nivel" (usando `state.lines`) en vez de "Puntuación" / "Vidas" / "Nivel"; para asteroids y el resto de juegos el HUD actual no cambia. Botones PAUSA/FIN/JUGAR DE NUEVO/SALIR conectados al handle de Tetris igual que para asteroids.
- `handleSaveScore` inserta de verdad en `scores` cuando `isTetris` (mismo patrón que asteroids: `supabase.from('scores').insert({ game_id: 'tetris', player_name: name, score })`, error inline sin marcar `saved`, reintentable).
- `app/juego/[id]/page.tsx`: cuando `id === 'tetris'`, usa `getTopScores('tetris', 10)` en vez de `getSeededScores`.
- `SalonClient.tsx`: cuando `tab === 'tetris'`, usa las filas reales de `getTopScores('tetris', 12)` (se generaliza la condición existente para asteroids a una lista de ids con leaderboard real); el podio ya tiene el guard `rows[N] &&` existente, válido para cualquier juego con pocas filas reales.
- Listeners de teclado (`ArrowLeft`, `ArrowRight`, `ArrowDown`, `ArrowUp`, `KeyX`, `Space`) agregados al montar el componente y removidos al desmontar, con `preventDefault()` en `Space` para que no haga scroll de la página.
- Se elimina el atajo de tecla `P` (`togglePause`) y el botón `restartBtn`/`init()` del original: la pausa y el reinicio quedan controlados exclusivamente por los botones del HUD de React (`paused` prop y `restart()` del handle).

**Out of scope (para futuros specs):**

- Controles táctiles / soporte mobile.
- Sonido (el original tampoco tiene) y cualquier cambio de balance a las constantes de juego (`COLS`, `ROWS`, `BLOCK`, `COLORS`, `LINE_SCORES`, `dropInterval`) respecto al original.
- Cualquier otro juego del catálogo (`bloque-buster`, `duelo-pixel`, `gloton`, `invasores`, `ranaria`, `serpentina`): siguen usando exactamente la pantalla simulada actual, sin cambios.
- Auth real / atar el `player_name` a un usuario autenticado.
- Recalcular `best`/`plays` desde `scores` (quedan estáticos, igual que en SPEC 06).
- Anti-spam/rate-limiting sobre el insert público en `scores`.
- Toggle de tema claro/oscuro del `index.html` original (`themeToggle`, `localStorage['tetris-theme']`): el proyecto ya tiene su propio sistema de tema, no se porta el del juego standalone.
- Cualquier otro cambio a la fila de `games` más allá del renombre de `id`/`title` (no se toca `cover`, `cat`, `color`, `best`, `plays`).

## Data model

Se introduce un contrato de props/ref interno entre el componente de juego y la pantalla que lo aloja, análogo al de `AsteroidsState`/`AsteroidsProps`/`AsteroidsHandle` pero sin `lives` (Tetris no tiene vidas) y con `lines` en su lugar:

```ts
type TetrisState = {
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
};

type TetrisProps = {
  paused: boolean;
  onStateChange: (state: TetrisState) => void;
};

type TetrisHandle = {
  forceGameOver: () => void;
  restart: () => void;
};
```

No se introducen tablas nuevas: reutiliza `games` y `scores` de SPEC 06.

```sql
update public.games
set id = 'tetris', title = 'TETRIS'
where id = 'caida';
```

## Implementation plan

1. Vía `mcp__supabase__apply_migration`: ejecutar el `update` de arriba sobre `public.games`, y verificar con `mcp__supabase__execute_sql` que la fila queda con `id = 'tetris'`, `title = 'TETRIS'`, y el resto de columnas intactas.
2. Crear `components/games/Tetris.tsx`: portar constantes (`COLS`, `ROWS`, `BLOCK`, `COLORS`, `PIECES`, `LINE_SCORES`) y funciones (`createBoard`, `randomPiece`, `collide`, `rotateCW`, `tryRotate`, `merge`, `clearLines`, `ghostY`, `hardDrop`, `softDrop`, `lockPiece`, `spawn`, `drawBlock`, `drawGrid`, `draw`, `drawNext`) desde `references/started-games/03-tetris/game.js`. El estado mutable del juego (`board`, `current`, `next`, `score`, `lines`, `level`, `paused` interno, `gameOver`, `dropAccum`, `dropInterval`) vive en `useRef`, no en `useState`, para no re-renderizar React en cada frame.
3. Dos elementos `<canvas>`: tablero con atributos `width={300} height={600}` y preview con `width={120} height={120}`, con estilos que los acomoden juntos dentro de `.crt-screen` (tablero centrado ocupando el alto disponible, preview como panel pequeño superpuesto o al costado, análogo al layout de `index.html` original pero sin su sidebar completo).
4. Implementar la prop `paused`: cuando es `true`, el loop sigue llamando a `requestAnimationFrame` y a `draw()`, pero no avanza `dropAccum` ni ejecuta auto-drop/`lockPiece`.
5. Implementar `onStateChange`: en cada frame, comparar `{score, lines, level, gameOver}` contra el último valor emitido (guardado en un `ref`) y llamar al callback solo si cambió algo.
6. Exponer `forwardRef` + `useImperativeHandle` con `forceGameOver()` (fuerza el equivalente de `endGame()` internamente) y `restart()` (reinicializa todo el estado interno igual que `init()` del original, sin el `cancelAnimationFrame`/`requestAnimationFrame` duplicado ya que el loop de React sigue corriendo).
7. Quitar del port el atajo de tecla `KeyP` (`togglePause`) y el `restartBtn`/`init()` enlazado a un botón propio del canvas — la pausa y el reinicio ahora solo ocurren vía props/handle desde React.
8. `useEffect` de montaje: agrega listeners `keydown` en `window` para `ArrowLeft`, `ArrowRight`, `ArrowDown`, `ArrowUp`, `KeyX`, `Space` (con `preventDefault()` en `Space`); arranca el loop con `requestAnimationFrame`. Cleanup: remueve el listener y hace `cancelAnimationFrame`.
9. En `GamePlayerClient.tsx`: agregar `isTetris = game.id === 'tetris'` y `tetrisGameRef = useRef<TetrisHandle>(null)`; renderizar `<Tetris ref={tetrisGameRef} paused={paused} onStateChange={handleTetrisStateChange} />` dentro de `.crt-screen` cuando `isTetris`, análogo al bloque de `Asteroids`. `endGame`/`restart` llaman a `tetrisGameRef.current?.forceGameOver()`/`restart()` cuando `isTetris`. El HUD reemplaza el bloque "Vidas" por "Líneas" (`state.lines`) cuando `isTetris`; para el resto de juegos (incluido asteroids) el HUD no cambia.
10. `handleSaveScore`: agregar rama para `isTetris` con `supabase.from('scores').insert({ game_id: 'tetris', player_name: name, score })`, mismo manejo de error/reintento que la rama de asteroids.
11. `app/juego/[id]/page.tsx`: cambiar la condición `id === 'asteroids'` por una lista `['asteroids', 'tetris'].includes(id)` (o equivalente) para decidir entre `getTopScores(id, 10)` y `getSeededScores(id.length * 17 + 3, 10)`.
12. `SalonClient.tsx`: recibir también `tetrisScores: ScoreRow[]` como prop (fetch adicional en `app/salon/page.tsx` vía `getTopScores('tetris', 12)`); generalizar `rows` para que sea `asteroidsScores` cuando `tab === 'asteroids'`, `tetrisScores` cuando `tab === 'tetris'`, o `getSeededScores(...)` en cualquier otro caso.
13. Verificación manual end-to-end con `npm run dev`: jugar una partida de Tetris (mover, rotar, soft/hard drop), limpiar líneas y ver el score/líneas/nivel del HUD actualizarse en tiempo real, perder por apilar hasta el spawn y ver el modal "FIN DEL JUEGO", pausar y reanudar, reiniciar con "JUGAR DE NUEVO", guardar puntuación y confirmar que aparece en `/salon` (pestaña "TETRIS") y en `/juego/tetris` tras recargar; confirmar que salir del juego no deja listeners de teclado activos en otras pantallas; confirmar que asteroids y el resto del catálogo no cambiaron de comportamiento.

## Acceptance criteria

- [ ] `components/games/Tetris.tsx` existe y renderiza un tablero jugable con teclado (`←`/`→` mover, `↓` soft drop, `↑`/`X` rotar, `Espacio` hard drop) y una vista previa de la siguiente pieza.
- [ ] En `/juego/tetris/jugar`, el HUD ("Puntuación", "Líneas", "Nivel") refleja en tiempo real el estado interno del juego real, no valores simulados.
- [ ] Completar una línea la elimina del tablero, suma los puntos de `LINE_SCORES` multiplicados por el nivel actual, y sube el contador de líneas; cada 10 líneas sube el nivel y acelera la caída, igual que el original.
- [ ] La pieza fantasma (`ghost piece`) se dibuja en la posición de aterrizaje proyectada.
- [ ] Apilar piezas hasta que una nueva colisione al aparecer dispara el modal "FIN DEL JUEGO" existente con la puntuación final real.
- [ ] "PAUSA" congela el juego real (la pieza deja de caer) y "REANUDAR" lo continúa.
- [ ] "JUGAR DE NUEVO" reinicia completamente el estado interno (tablero vacío, score/líneas en 0, nivel 1).
- [ ] "SALIR" no deja listeners de teclado activos en otras pantallas.
- [ ] Ningún otro juego del catálogo (incluido asteroids) cambió de comportamiento.
- [ ] "GUARDAR PUNTUACIÓN" inserta una fila real en `scores` con `game_id: 'tetris'`, `player_name`/`score` correctos.
- [ ] El salón de la fama (pestaña "TETRIS") y el detalle de `/juego/tetris` reflejan la puntuación guardada tras recargar, ordenada descendente.
- [ ] Con menos de 3 puntuaciones reales de Tetris, el podio no rompe (no muestra `undefined`).
- [ ] `npm run lint` y `npm run build` pasan sin errores nuevos.

## Decisions taken and discarded

- **Se renombra el catálogo de "CAÍDA" a "TETRIS"**: decisión del usuario, mismo patrón que SPEC 05 con rocas→asteroids; "CAÍDA" era el nombre placeholder del mock, `cover-tetro` ya estaba preparado para este juego.
- **Se mantienen `cover`, `cat`, `color`, `best`, `plays` de la fila existente**: confirmado por el usuario — `cover-tetro`/PUZZLE/magenta ya encajan y no chocan con asteroids (yellow); solo cambia `id`/`title`.
- **El componente rompe la regla de "un solo canvas" y expone dos**: excepción explícita al patrón de SPEC 05, confirmada por el usuario — la vista previa de la siguiente pieza es parte central de la mecánica de Tetris en el original.
- **`TetrisState` usa `lines` en vez de `lives`**: Tetris no tiene vidas; el HUD de `GamePlayerClient` se vuelve condicional por juego para mostrar "Líneas" en vez de "Vidas" cuando `isTetris`.
- **Se elimina el atajo de teclado `P` (pausa) y el botón `restartBtn` del original**: confirmado por el usuario, mismo criterio que SPEC 05 con el auto-reinicio por Espacio de asteroids — dejar atajos internos activos desincronizaría el estado de React (`paused`, modal de fin de partida) del estado interno del canvas.
- **Port fiel 1:1 a `game.js`**: confirmado por el usuario — mismas constantes, las 8 piezas (incluida la N/tuerca), mismo scoring y velocidad de caída.
- **El leaderboard real se incluye siempre, igual que asteroids**: decisión ya tomada a nivel de proyecto (ver `port-game` skill), no se reabre por juego.
- **Se generaliza la condición `tab === 'asteroids'` en `SalonClient.tsx` y `id === 'asteroids'` en `app/juego/[id]/page.tsx` a una lista de ids con leaderboard real**: evita hardcodear un segundo `if` idéntico; necesario porque ahora hay dos juegos con puntuaciones reales.
- **No se porta el toggle de tema claro/oscuro del `index.html` original**: el proyecto Arcade Vault ya tiene su propio sistema de tema global; el del juego standalone es redundante y fuera de alcance.

## Identified risks

- **Fuga de listeners de teclado entre pantallas**: si el cleanup no remueve el listener `keydown` al desmontar, las flechas/`X`/Espacio podrían seguir interceptadas en otras rutas tras salir de `/juego/tetris/jugar`. Mitigación: cleanup explícito verificado en el paso 13 del plan.
- **Loop de canvas fantasma tras desmontar**: sin `cancelAnimationFrame` en el cleanup, el loop seguiría corriendo en memoria al navegar fuera de la pantalla de juego. Mitigación: cancelar el `requestAnimationFrame` en el cleanup del `useEffect` de montaje.
- **Desincronía entre el modal de React y el reinicio/pausa interno**: si quedara activo el atajo `P` o el `restartBtn` original, el usuario podría pausar/reiniciar el canvas por debajo del modal de React sin que el estado (`paused`, `over`, `saved`) se entere. Mitigación: decisión ya tomada arriba de eliminar ambos.
- **Podio con menos de 3 puntuaciones reales de Tetris**: mismo riesgo que SPEC 06 documentó para asteroids, ahora aplicado a un segundo `game_id`. Mitigación: el guard `rows[N] &&` que SPEC 06 ya dejó en `SalonClient.tsx` es genérico por `rows`, no específico de asteroids, así que cubre a Tetris sin cambios adicionales.
- **Desincronía entre el `id` renombrado en `games` y el `id` hardcodeado `'tetris'` usado en el código**: si la migración del paso 1 no se aplica correctamente, los filtros `isTetris`/`id === 'tetris'` dejarían de activar el guardado y lectura reales silenciosamente. Mitigación: el paso 1 del plan verifica la fila con `execute_sql` antes de escribir código, y el paso 13 confirma el guardado end-to-end.
