# SPEC 08 — Integración del juego real de Arkanoid

> **Status:** Aprobado
> **Depends on:** SPEC 05, SPEC 06, SPEC 07
> **Date:** 2026-08-14
> **Objective:** Renombrar la entrada del catálogo `bloque-buster`/`BLOQUE BUSTER` a `arkanoid`/`ARKANOID` y portar el juego standalone de `references/started-games/04-arkanoid/game.js` a un componente React (`components/games/Arkanoid.tsx`) conectado a `/juego/arkanoid/jugar`, con leaderboard real en Supabase, siguiendo el mismo patrón validado en SPEC 05 (componente de juego real), SPEC 06 (persistencia real de puntuaciones) y SPEC 07 (segundo juego real), sin tocar el resto del catálogo.

## Scope

**In:**

- Migración en Supabase (`mcp__supabase__apply_migration`) que actualiza la fila existente de `games` con `id: "bloque-buster"` a `id: "arkanoid"` y `title: "BLOQUE BUSTER"` a `title: "ARKANOID"`. El resto de columnas (`cover: "cover-bricks"`, `cat: "ARCADE"`, `color: "cyan"`, `best: 28450`, `plays: "12.4K"`) se mantiene sin cambios. Esto cambia la ruta pública de `/juego/bloque-buster` y `/juego/bloque-buster/jugar` a `/juego/arkanoid` y `/juego/arkanoid/jugar`.
- Copiar `references/started-games/04-arkanoid/assets/spritesheet-breakout.png` a `public/games/arkanoid/spritesheet-breakout.png`. Los sonidos (`assets/sounds/ball-bounce.mp3`, `assets/sounds/break-sound.mp3`) no se copian — el audio queda fuera de alcance.
- Nuevo componente `components/games/Arkanoid.tsx`: canvas 800×600 con la lógica completa portada de `game.js` y `levels.js` — constantes (`PADDLE_SPEED`, `BLOCK_COLS`, `BLOCK_ROWS`, `BLOCK_W`, `BLOCK_H`, `BLOCK_COLORS`, `BLOCKS_ORIGIN_X`, `BLOCKS_ORIGIN_Y`, `BASE_BALL_VX`, `BASE_BALL_VY`), estado (`paddle`, `ball`, `blocks`, `explosions`, `lives`, `score`, `gameState`, `currentLevel`), funciones (`initPaddle`, `initBall`, `loadLevel`, `collideAABB`, `update`, `draw`) y los 5 niveles de `LEVELS` (`levels.js`, patrones y multiplicadores de velocidad `1.00`→`1.46` sin cambios). Se porta también el helper de sprites (`loadSpritesheet`, `drawSprite`, `drawFrame`, `SPRITES`, `EXPLOSION_FRAMES`, `EXPLOSION_DURATION` de `assets/spritesheet.js`) apuntando a `/games/arkanoid/spritesheet-breakout.png`, incluida la animación de explosión al romper un bloque.
- El componente expone:
  - Prop `paused: boolean` — congela el avance de `update(dt)` (paddle, pelota, colisiones, explosiones) sin cancelar el loop de dibujo.
  - Prop `onStateChange(state: { score: number; lives: number; level: number; gameOver: boolean }) => void` — se invoca cuando cambia alguno de esos valores. El estado `'win'` del original (completar los 5 niveles) también se reporta como `gameOver: true`, igual que `'gameover'` (sin vidas) — el HUD de React no distingue victoria de derrota, mismo criterio ya usado para asteroids/tetris.
  - Un handle vía `forwardRef` + `useImperativeHandle`: `{ forceGameOver: () => void; restart: () => void }`.
- El componente sigue el contrato estándar de un solo canvas (a diferencia de la excepción de dos canvas de `Tetris.tsx`), igual que `Asteroids.tsx`.
- Controles: solo teclado (`ArrowLeft`/`ArrowRight` mueven el paddle mediante `PADDLE_SPEED`); no se porta el `mousemove` del original que mueve el paddle con el cursor.
- Se elimina del port el listener de `keydown` que alterna `isPaused` con `P`/`Escape` y el overlay de pausa propio con selector de nivel por click (`drawPauseOverlay`, el `canvas.addEventListener('click', ...)` de saltar de nivel). La pausa y el reinicio quedan controlados exclusivamente por los botones del HUD de React (`paused` prop y `restart()` del handle), mismo criterio que SPEC 05/07.
- Wiring en `GamePlayerClient.tsx`: gate `isArkanoid = game.id === 'arkanoid'` junto a `isAsteroids`/`isTetris`; montaje de `Arkanoid` dentro de `.crt-screen` cuando `isArkanoid`. El HUD para Arkanoid usa el bloque "Vidas" existente (igual que asteroids, no el de "Líneas" de tetris) y "Nivel" con el valor recibido de `onStateChange`. Botones PAUSA/FIN/JUGAR DE NUEVO/SALIR conectados al handle de Arkanoid igual que para los otros dos juegos.
- `handleSaveScore` inserta de verdad en `scores` cuando `isArkanoid` (mismo patrón que asteroids/tetris: `supabase.from('scores').insert({ game_id: 'arkanoid', player_name: name, score })`, error inline sin marcar `saved`, reintentable).
- `app/juego/[id]/page.tsx`: la lista `['asteroids', 'tetris']` que decide entre `getTopScores(id, 10)` y `getSeededScores(...)` se extiende a `['asteroids', 'tetris', 'arkanoid']`.
- `SalonClient.tsx`: recibe también `arkanoidScores: ScoreRow[]` como prop (fetch adicional en `app/salon/page.tsx` vía `getTopScores('arkanoid', 12)`); `rows` se extiende con `tab === 'arkanoid' ? arkanoidScores : ...`. El guard `rows[N] &&` del podio ya es genérico y cubre a Arkanoid sin cambios adicionales.

**Out of scope (para futuros specs):**

- Controles táctiles / soporte mobile.
- Control de paddle por mouse (el original lo soporta; este port es solo teclado, confirmado en Phase 2).
- Sonido (`ball-bounce.mp3`, `break-sound.mp3`) — el original sí lo tiene, pero se deja fuera de alcance, mismo criterio que asteroids/tetris.
- El overlay de pausa propio con selector de nivel (saltar directamente a un nivel 1-5 por click) — se elimina, la pausa solo la controla el HUD de React.
- Cualquier otro juego del catálogo (`duelo-pixel`, `gloton`, `invasores`, `ranaria`, `serpentina`): siguen usando exactamente la pantalla simulada actual, sin cambios.
- Auth real / atar el `player_name` a un usuario autenticado.
- Recalcular `best`/`plays` desde `scores` (quedan estáticos, igual que en SPEC 06/07).
- Anti-spam/rate-limiting sobre el insert público en `scores`.
- Cualquier otro cambio a la fila de `games` más allá del renombre de `id`/`title` (no se toca `cover`, `cat`, `color`, `best`, `plays`).

## Data model

Se introduce un contrato de props/ref interno entre el componente de juego y la pantalla que lo aloja, idéntico en forma a `AsteroidsState`/`AsteroidsProps`/`AsteroidsHandle` (con `lives`, no `lines`):

```ts
type ArkanoidState = {
  score: number;
  lives: number;
  level: number;
  gameOver: boolean;
};

type ArkanoidProps = {
  paused: boolean;
  onStateChange: (state: ArkanoidState) => void;
};

type ArkanoidHandle = {
  forceGameOver: () => void;
  restart: () => void;
};
```

No se introducen tablas nuevas: reutiliza `games` y `scores` de SPEC 06.

```sql
update public.games
set id = 'arkanoid', title = 'ARKANOID'
where id = 'bloque-buster';
```

## Implementation plan

1. Vía `mcp__supabase__apply_migration`: ejecutar el `update` de arriba sobre `public.games`, y verificar con `mcp__supabase__execute_sql` que la fila queda con `id = 'arkanoid'`, `title = 'ARKANOID'`, y el resto de columnas intactas.
2. Copiar `references/started-games/04-arkanoid/assets/spritesheet-breakout.png` a `public/games/arkanoid/spritesheet-breakout.png`.
3. Crear `components/games/Arkanoid.tsx`: portar constantes (`PADDLE_SPEED`, `BLOCK_COLS`, `BLOCK_ROWS`, `BLOCK_W`, `BLOCK_H`, `BLOCK_COLORS`, `BLOCKS_ORIGIN_X`, `BLOCKS_ORIGIN_Y`, `BASE_BALL_VX`, `BASE_BALL_VY`), los 5 niveles de `LEVELS` (`levels.js`, sin cambios), y funciones (`initPaddle`, `initBall`, `loadLevel`, `collideAABB`, `update`, `draw`, helpers de sprites `loadSpritesheet`/`drawSprite`/`drawFrame` apuntando a `/games/arkanoid/spritesheet-breakout.png`) desde `references/started-games/04-arkanoid/game.js`, `levels.js` y `assets/spritesheet.js`. El estado mutable del juego (`paddle`, `ball`, `blocks`, `explosions`, `lives`, `score`, `gameState`, `currentLevel`, `keys`) vive en `useRef`, no en `useState`, para no re-renderizar React en cada frame.
4. Canvas con atributos `width={800} height={600}` y estilos `width: 100%; height: 100%; display: block;` para escalar dentro de `.crt-screen`, mismo patrón que `Asteroids.tsx`.
5. Implementar la prop `paused`: cuando es `true`, el loop sigue llamando a `requestAnimationFrame` y a `draw()`, pero no llama a `update(dt)`.
6. Implementar `onStateChange`: en cada frame, comparar `{score, lives, level: currentLevel, gameOver: gameState === 'gameover' || gameState === 'win'}` contra el último valor emitido (guardado en un `ref`) y llamar al callback solo si cambió algo.
7. Exponer `forwardRef` + `useImperativeHandle` con `forceGameOver()` (fuerza `gameState = 'gameover'` internamente) y `restart()` (reinicializa todo el estado interno igual que `initPaddle()` + `loadLevel(1)` + `score = 0; lives = 3; gameState = 'playing'` del original).
8. Quitar del port el listener de `keydown` que alterna `isPaused` con `P`/`Escape`, el listener de `click` sobre el canvas que salta de nivel, `drawPauseOverlay()` y el listener de `mousemove` que mueve el paddle — la pausa, el reinicio y el movimiento del paddle ahora solo ocurren vía props/handle/teclado desde React.
9. `useEffect` de montaje: agrega listeners `keydown`/`keyup` en `window` para `ArrowLeft`/`ArrowRight` con `preventDefault()`; arranca el loop con `requestAnimationFrame`. Cleanup: remueve los listeners y hace `cancelAnimationFrame`.
10. En `GamePlayerClient.tsx`: agregar `isArkanoid = game.id === 'arkanoid'` y `arkanoidGameRef = useRef<ArkanoidHandle>(null)`; renderizar `<Arkanoid ref={arkanoidGameRef} paused={paused} onStateChange={handleArkanoidStateChange} />` dentro de `.crt-screen` cuando `isArkanoid`, análogo al bloque de `Asteroids`. `endGame`/`restart` llaman a `arkanoidGameRef.current?.forceGameOver()`/`restart()` cuando `isArkanoid`. El HUD usa el bloque "Vidas" existente (no el de "Líneas" de tetris) para `isArkanoid`.
11. `handleSaveScore`: agregar rama para `isArkanoid` con `supabase.from('scores').insert({ game_id: 'arkanoid', player_name: name, score })`, mismo manejo de error/reintento que las ramas de asteroids/tetris.
12. `app/juego/[id]/page.tsx`: extender la lista `['asteroids', 'tetris']` a `['asteroids', 'tetris', 'arkanoid']` para decidir entre `getTopScores(id, 10)` y `getSeededScores(id.length * 17 + 3, 10)`.
13. `SalonClient.tsx`: recibir también `arkanoidScores: ScoreRow[]` como prop (fetch adicional en `app/salon/page.tsx` vía `getTopScores('arkanoid', 12)`); extender `rows` para que sea `arkanoidScores` cuando `tab === 'arkanoid'`, además de los casos existentes de asteroids/tetris/seeded.
14. Verificación manual end-to-end con `npm run dev`: jugar una partida de Arkanoid (mover el paddle con las flechas, rebotar la pelota, romper bloques y ver la animación de explosión), completar un nivel y ver el avance automático al siguiente (velocidad incrementada), perder las 3 vidas y ver el modal "FIN DEL JUEGO", completar los 5 niveles y confirmar que también dispara el modal "FIN DEL JUEGO" con la puntuación final, pausar y reanudar, reiniciar con "JUGAR DE NUEVO", guardar puntuación y confirmar que aparece en `/salon` (pestaña "ARKANOID") y en `/juego/arkanoid` tras recargar; confirmar que salir del juego no deja listeners de teclado activos en otras pantallas; confirmar que asteroids, tetris y el resto del catálogo no cambiaron de comportamiento.

## Acceptance criteria

- [ ] `components/games/Arkanoid.tsx` existe y renderiza un canvas jugable con teclado (`←`/`→` mover el paddle).
- [ ] En `/juego/arkanoid/jugar`, el HUD ("Puntuación", "Vidas", "Nivel") refleja en tiempo real el estado interno del juego real, no valores simulados.
- [ ] Romper un bloque suma 10 puntos, dispara la animación de explosión con los 4 frames del spritesheet, y al vaciar todos los bloques del nivel avanza automáticamente al siguiente nivel con la pelota más rápida (mismo multiplicador que `levels.js`).
- [ ] Perder las 3 vidas dispara el modal "FIN DEL JUEGO" existente con la puntuación final real.
- [ ] Completar los 5 niveles también dispara el modal "FIN DEL JUEGO" con la puntuación final real.
- [ ] "PAUSA" congela el juego real (paddle, pelota y bloques dejan de moverse) y "REANUDAR" lo continúa.
- [ ] "JUGAR DE NUEVO" reinicia completamente el estado interno (nivel 1, score en 0, 3 vidas, bloques completos).
- [ ] "SALIR" no deja listeners de teclado activos en otras pantallas.
- [ ] Ningún otro juego del catálogo (incluidos asteroids y tetris) cambió de comportamiento.
- [ ] "GUARDAR PUNTUACIÓN" inserta una fila real en `scores` con `game_id: 'arkanoid'`, `player_name`/`score` correctos.
- [ ] El salón de la fama (pestaña "ARKANOID") y el detalle de `/juego/arkanoid` reflejan la puntuación guardada tras recargar, ordenada descendente.
- [ ] Con menos de 3 puntuaciones reales de Arkanoid, el podio no rompe (no muestra `undefined`).
- [ ] `npm run lint` y `npm run build` pasan sin errores nuevos.

## Decisions taken and discarded

- **Se renombra el catálogo de "BLOQUE BUSTER" a "ARKANOID"**: decisión del usuario, mismo patrón que SPEC 05/07; "BLOQUE BUSTER" era el nombre placeholder del mock, `cover-bricks` ya estaba preparado para este juego.
- **Se mantienen `cover`, `cat`, `color`, `best`, `plays` de la fila existente**: confirmado por el usuario — `cover-bricks`/ARCADE/cyan ya encajan y no chocan con asteroids (yellow) ni tetris (magenta); solo cambia `id`/`title`.
- **Solo teclado (←/→), sin control por mouse**: confirmado por el usuario — consistente con asteroids/tetris, que tampoco soportan mouse/touch; se descarta el listener `mousemove` del original.
- **Se elimina el overlay de pausa propio con selector de nivel y el atajo P/Escape**: mismo criterio que SPEC 05 (auto-reinicio por Espacio) y SPEC 07 (atajo P, `restartBtn`) — dejar UI/atajos internos activos desincronizaría el estado de React (`paused`, modal de fin de partida) del estado interno del canvas.
- **No se porta el sonido**: confirmado por el usuario — ni asteroids ni tetris tienen audio; mantiene el criterio y el componente más simple. `ball-bounce.mp3`/`break-sound.mp3` no se copian a `public/`.
- **El spritesheet se copia a `public/games/arkanoid/spritesheet-breakout.png`**: confirmado por el usuario — carpeta dedicada por juego, evita colisiones si se portan más juegos con assets propios en el futuro.
- **Port fiel 1:1 a `game.js`/`levels.js`**: confirmado por el usuario — mismas constantes, mismos 5 niveles, mismo scoring (10 pts/bloque) y mismo balance de velocidad (×1.00→×1.46).
- **El estado `'win'` del original también reporta `gameOver: true`**: confirmado por el usuario — el contrato estándar `{gameOver: boolean}` no distingue victoria de derrota; completar los 5 niveles abre el mismo modal "FIN DEL JUEGO" que perder las vidas, sin lógica adicional en `GamePlayerClient.tsx`.
- **`ArkanoidState` usa `lives`, no `lines`**: a diferencia de `TetrisState` (SPEC 07), Arkanoid sí tiene vidas como el original y como asteroids; el HUD de `GamePlayerClient` usa el bloque "Vidas" existente para `isArkanoid`, no el de "Líneas".
- **El componente usa un solo canvas**, sin la excepción de dos canvas que SPEC 07 documentó para `Tetris.tsx` (no hay vista previa de "siguiente pieza" en Arkanoid).
- **El leaderboard real se incluye siempre, igual que asteroids y tetris**: decisión ya tomada a nivel de proyecto (ver `port-game` skill), no se reabre por juego.
- **Se extiende la lista de ids con leaderboard real en `app/juego/[id]/page.tsx` y `SalonClient.tsx`** (`['asteroids', 'tetris']` → `['asteroids', 'tetris', 'arkanoid']`, y una prop `arkanoidScores` más en `SalonClient`): mismo patrón de generalización que SPEC 07 introdujo al pasar de un juego real a dos.

## Identified risks

- **Fuga de listeners de teclado entre pantallas**: si el cleanup no remueve `keydown`/`keyup` al desmontar, las flechas podrían seguir interceptadas en otras rutas tras salir de `/juego/arkanoid/jugar`. Mitigación: cleanup explícito verificado en el paso 14 del plan.
- **Loop de canvas fantasma tras desmontar**: sin `cancelAnimationFrame` en el cleanup, el loop seguiría corriendo en memoria al navegar fuera de la pantalla de juego. Mitigación: cancelar el `requestAnimationFrame` en el cleanup del `useEffect` de montaje.
- **Desincronía entre el modal de React y la pausa/reinicio interno**: si quedara activo el atajo `P`/`Escape` o el overlay de pausa con selector de nivel por click, el usuario podría pausar/saltar de nivel el canvas por debajo del modal de React sin que el estado (`paused`, `over`, `saved`) se entere. Mitigación: decisión ya tomada arriba de eliminar ambos.
- **Ruta de assets rota si el spritesheet no se copia a `public/`**: `loadSpritesheet` depende de una URL servible por Next.js; si el PNG queda solo en `references/started-games/04-arkanoid/assets/` (fuera de `public/`), el canvas se dibuja sin sprites. Mitigación: paso 2 del plan copia el archivo antes de escribir el componente, y la verificación manual del paso 14 confirma que los sprites se ven.
- **Podio con menos de 3 puntuaciones reales de Arkanoid**: mismo riesgo que SPEC 06/07 documentaron para asteroids/tetris, ahora aplicado a un tercer `game_id`. Mitigación: el guard `rows[N] &&` que SPEC 06 dejó en `SalonClient.tsx` es genérico por `rows`, cubre a Arkanoid sin cambios adicionales.
- **Desincronía entre el `id` renombrado en `games` y el `id` hardcodeado `'arkanoid'` usado en el código**: si la migración del paso 1 no se aplica correctamente, los filtros `isArkanoid`/`id === 'arkanoid'` dejarían de activar el guardado y lectura reales silenciosamente. Mitigación: el paso 1 del plan verifica la fila con `execute_sql` antes de escribir código, y el paso 14 confirma el guardado end-to-end.
