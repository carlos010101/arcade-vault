# SPEC 09 — Integración del juego real de Snake

> **Status:** Aprobado
> **Depends on:** SPEC 05, SPEC 06
> **Date:** 2026-08-14
> **Objective:** Renombrar la entrada del catálogo `serpentina`/`SERPENTINA` a `snake`/`SNAKE` y portar un Snake clásico desde cero (sin `game.js` fuente, usando los sprites de `references/souce-assets/snake-assets/`) a un componente React (`components/games/Snake.tsx`) conectado a `/juego/snake/jugar`, con leaderboard real en Supabase igual que Asteroids/Tetris/Arkanoid.

## Scope

**In:**

- Renombrar en la tabla `games` de Supabase la fila `id: "serpentina"` / `title: "SERPENTINA"` a `id: "snake"` / `title: "SNAKE"` vía `mcp__supabase__apply_migration`. `short`, `long`, `cat` (`ARCADE`), `cover` (`cover-snake`), `color` (`green`), `best` (`7820`), `plays` (`9.1K`) no cambian.
- Copiar `references/souce-assets/snake-assets/fruits.png` a `public/snake-assets/fruits.png`. Las coordenadas de `sprites.js` se portan como constante TypeScript (`FRUIT_SPRITES`) dentro de `components/games/Snake.tsx` — mismo patrón que `EXPLOSION_FRAMES` en `components/games/Arkanoid.tsx` — en vez de mantener el script global `window.SPRITE_ATLAS`.
- Nuevo componente `components/games/Snake.tsx`: canvas 800×600, grilla de celdas 20×20px (40 columnas × 30 filas). Snake clásico implementado desde cero (no hay `game.js` fuente que portar):
  - La serpiente se mueve en una grilla a intervalos fijos (tick del loop), no en píxeles continuos.
  - Cambiar de dirección con flechas; no se permite invertir 180° en un solo tick (ej. si va a la derecha, `ArrowLeft` no hace nada ese tick).
  - Come una fruta dibujada con un sprite aleatorio de `FRUIT_SPRITES` (recortado de `fruits.png`); al comerla, la serpiente crece un segmento, el score sube, y aparece una fruta nueva en una celda libre aleatoria.
  - Cada 5 frutas comidas, sube el nivel (`level += 1`) y el intervalo del tick se acorta (velocidad sube).
  - Game over al morder su propia cola o al tocar cualquier borde de la grilla (sin wrap).
  - Sin sistema de vidas por colisiones múltiples: la partida termina en el primer choque. El campo `lives` del contrato se usa como bandera binaria (`1` mientras viva, `0` en game over) para reutilizar el HUD "Vidas" existente sin tocar `GamePlayerClient.tsx`.
- El componente expone el contrato estándar:
  - Prop `paused: boolean` — congela el tick de movimiento sin cancelar el loop de dibujo.
  - Prop `onStateChange(state: SnakeState) => void`.
  - Handle vía `forwardRef` + `useImperativeHandle`: `{ forceGameOver(): void; restart(): void }`.
- Listeners de teclado (`ArrowLeft/Right/Up/Down`) agregados al montar con `preventDefault()`, removidos al desmontar.
- Wiring en `GamePlayerClient.tsx`: gate `isSnake = game.id === 'snake'` junto a `isAsteroids`/`isTetris`/`isArkanoid`; se agrega `snakeGameRef`, estado `snakeLevel`, se monta `<Snake ref={snakeGameRef} paused={paused} onStateChange={handleSnakeStateChange} />` dentro de `.crt-screen`; el nivel del HUD usa `snakeLevel` cuando `isSnake`; `endGame`/`restart` llaman a `snakeGameRef.current?.forceGameOver()`/`restart()`.
- `handleSaveScore` inserta en `scores` con `game_id: 'snake'` cuando `isSnake` (extiende el condicional ternario existente `isTetris ? 'tetris' : isArkanoid ? 'arkanoid' : isAsteroids ? 'asteroids' : 'snake'`), mismo patrón de error inline sin marcar `saved`.
- `app/juego/[id]/page.tsx`: agregar `'snake'` al array `['asteroids', 'tetris', 'arkanoid']` que decide usar `getTopScores(id, 10)` en vez de `getSeededScores`.
- `SalonClient.tsx`: nueva prop `snakeScores: ScoreRow[]`; `rows` usa `snakeScores` cuando `tab === 'snake'`; el podio ya tiene el guard `rows[N] &&` existente (SPEC 06), no requiere cambios adicionales.
- `app/salon/page.tsx`: agregar `await getTopScores('snake', 12)` y pasarlo como prop `snakeScores` a `SalonClient`.

**Out of scope (para futuros specs):**

- Controles táctiles/mobile.
- Sonido y cualquier balance de dificultad más allá de lo confirmado (nivel +1 cada 5 frutas).
- Cualquier otro juego del catálogo (`gloton`, `invasores`, `ranaria`, `duelo-pixel`).
- Auth real / atar `player_name` a un usuario autenticado.
- Recalcular `best`/`plays` desde `scores`.
- Anti-spam/rate-limiting sobre el insert público en `scores`.
- Usar más de un sprite de fruta simultáneo en pantalla, power-ups, o obstáculos adicionales al Snake clásico.
- Mantener `window.SPRITE_ATLAS` como script global cargado en `<script>`; los datos de `sprites.js` se re-tipan en TS dentro del componente.

## Data model

```ts
type SnakeState = {
  score: number;
  lives: number; // 1 mientras vive, 0 en game over — sin sistema de vidas múltiples
  level: number;
  gameOver: boolean;
};

type SnakeProps = {
  paused: boolean;
  onStateChange: (state: SnakeState) => void;
};

type SnakeHandle = {
  forceGameOver: () => void;
  restart: () => void;
};

// components/games/Snake.tsx — recortes portados de snake-assets/sprites.js
type SpriteFrame = { x: number; y: number; w: number; h: number };
const FRUIT_SPRITES: SpriteFrame[] = [
  { x: 34, y: 136, w: 110, h: 160 }, // banana
  { x: 186, y: 136, w: 150, h: 160 }, // orange
  // ...resto de frutas de sprites.js, mismas coordenadas
];
```

Migración SQL de renombre:

```sql
update public.games
set id = 'snake', title = 'SNAKE'
where id = 'serpentina';
```

(Nota: `scores.game_id` no tiene filas previas para `serpentina` — no requiere migración de datos en `scores`.)

## Implementation plan

1. Vía `mcp__supabase__apply_migration`: renombrar `serpentina`→`snake` en `games` con el SQL de arriba.
2. Copiar `references/souce-assets/snake-assets/fruits.png` a `public/snake-assets/fruits.png`.
3. Crear `components/games/Snake.tsx`: portar `FRUIT_SPRITES` desde `snake-assets/sprites.js` como constante TS; estado mutable (`snake: {x,y}[]`, `direction`, `pendingDirection`, `fruit: {x,y,sprite}`, `score`, `level`, `state`, `tickAcc`) en `useRef`.
4. Loop `requestAnimationFrame` con acumulador de tiempo: avanza la serpiente una celda cada `tickInterval` ms (`tickInterval` baja con el nivel); `paused=true` detiene el avance sin detener el RAF ni el dibujo.
5. Dibujar grilla, cuerpo de la serpiente (rects) y la fruta actual con `ctx.drawImage(img, sprite.x, sprite.y, sprite.w, sprite.h, dx, dy, cellSize, cellSize)` usando la imagen cargada desde `/snake-assets/fruits.png`.
6. Detectar colisión con pared o con el propio cuerpo → `state = 'gameover'`; detectar colisión con la fruta → crecer, sumar score, elegir sprite aleatorio nuevo y reposicionar fruta en celda libre; cada 5 frutas comidas, `level += 1` y reducir `tickInterval`.
7. Implementar `onStateChange`: comparar `{score, lives: state === 'gameover' ? 0 : 1, level, gameOver: state === 'gameover'}` contra el último valor emitido (ref) y notificar solo si cambió.
8. Exponer `forwardRef` + `useImperativeHandle` con `forceGameOver()` y `restart()` (reinicializa serpiente de 3 celdas al centro, score 0, nivel 1, nueva fruta).
9. `useEffect` de montaje: listeners `keydown` para `ArrowLeft/Right/Up/Down` con `preventDefault()` y guard anti-reversa-180°; cleanup remueve listeners y hace `cancelAnimationFrame`.
10. Wiring en `GamePlayerClient.tsx`: `isSnake`, `snakeGameRef`, `snakeLevel`, `handleSnakeStateChange`, render condicional de `<Snake />`, extender `endGame`/`restart`/`handleSaveScore`/`level` con la rama `isSnake`.
11. `app/juego/[id]/page.tsx`: agregar `'snake'` al array que gatea `getTopScores`.
12. `app/salon/page.tsx` + `SalonClient.tsx`: agregar `getTopScores('snake', 12)` y la prop/rama `snakeScores`.
13. Verificación manual con `npm run dev`: jugar en `/juego/snake/jugar`, comer frutas y ver crecer la serpiente con sprites distintos, subir de nivel cada 5 frutas y notar el aumento de velocidad, chocar contra pared y contra el propio cuerpo (ambos casos terminan la partida), pausar/reanudar, reiniciar, guardar puntuación y confirmar que aparece en `/salon` (pestaña SNAKE) y en `/juego/snake` tras recargar; confirmar que las flechas no quedan interceptadas en otras pantallas al salir; confirmar que ningún otro juego del catálogo cambió de comportamiento.

## Acceptance criteria

- [ ] `components/games/Snake.tsx` existe y renderiza un canvas jugable con teclado (`←→↑↓` cambian dirección, sin reversa de 180°).
- [ ] La fruta se dibuja con un sprite recortado de `public/snake-assets/fruits.png` (no un rectángulo de color plano).
- [ ] El HUD ("Puntuación", "Vidas", "Nivel") refleja en tiempo real el estado interno del juego real.
- [ ] Comer una fruta alarga la serpiente en un segmento y aumenta el score.
- [ ] Cada 5 frutas comidas, el nivel sube y el juego se mueve visiblemente más rápido.
- [ ] Chocar contra un borde de la grilla dispara game over.
- [ ] Morder el propio cuerpo dispara game over.
- [ ] El botón "FIN" del HUD termina la partida inmediatamente y abre el modal "FIN DEL JUEGO" con la puntuación final real.
- [ ] "PAUSA"/"REANUDAR" congela y reanuda el avance real de la serpiente.
- [ ] "JUGAR DE NUEVO" reinicia completamente el estado interno (serpiente inicial, score 0, nivel 1).
- [ ] "SALIR" no deja listeners de teclado activos en otras pantallas.
- [ ] Ningún otro juego del catálogo cambió de comportamiento.
- [ ] "GUARDAR PUNTUACIÓN" inserta una fila real en `scores` con `game_id: 'snake'`, `player_name` y `score` correctos.
- [ ] `/salon` (pestaña SNAKE) y `/juego/snake` reflejan la puntuación guardada tras recargar, ordenada descendente.
- [ ] Con menos de 3 puntuaciones reales de Snake, el podio de `/salon` no rompe (usa el guard `rows[N] &&` ya existente).
- [ ] `npm run lint` y `npm run build` pasan sin errores nuevos.

## Decisions taken and discarded

- **Se renombra `serpentina`→`snake`**: mismo patrón que SPEC 05 (`rocas`→`asteroids`); `serpentina` era el placeholder del mock inicial para este slot del catálogo (confirmado por `cover: 'cover-snake'` ya sembrado).
- **Title pasa a "SNAKE" (no "SERPENTINA")**: consistencia con el resto de juegos reales portados (ASTEROIDS, TETRIS, ARKANOID), todos en inglés — decisión explícita del usuario.
- **Snake clásico con muerte en pared (sin wrap)** y **1 vida (game over inmediato en el primer choque)**: decisión explícita del usuario; simplifica el contrato reutilizando `lives` como bandera binaria en vez de extender `SnakeState` con un campo nuevo que `GamePlayerClient.tsx` no sabría interpretar.
- **No hay `game.js` fuente**: a diferencia de Asteroids/Tetris/Arkanoid, este juego se implementa desde cero siguiendo reglas de Snake clásico, usando solo los sprites de `references/souce-assets/snake-assets/` como referencia visual.
- **Sprites de fruta portados a una constante TS dentro del componente, no como script global `window.SPRITE_ATLAS`**: mismo patrón que `EXPLOSION_FRAMES` en `Arkanoid.tsx`; evita depender de un script cargado por `<script src>` fuera del bundle de React.
- **Asset movido a `public/snake-assets/fruits.png`**: Next.js solo sirve estáticos servidos desde `public/`; `references/` no es accesible desde el navegador.
- **Nivel sube cada 5 frutas comidas**: decisión explícita del usuario; umbral simple y visible en el HUD.
- **Grilla de 40×30 celdas de 20px sobre canvas 800×600**: mismo tamaño de canvas que Asteroids/Tetris/Arkanoid (encaja en el `.crt-screen` existente con `aspect-ratio: 4/3`), celda de 20px es un tamaño estándar para Snake que deja margen visual cómodo.
- **El canvas comunica su estado a React vía callback (`onStateChange`), no polling**: consistente con SPEC 05/07/08.
- **Reinicio controlado exclusivamente por el botón "JUGAR DE NUEVO"**: ningún atajo de teclado interno reinicia la partida, igual que en Asteroids/Tetris/Arkanoid.
- **El leaderboard real se incluye siempre**: decisión ya tomada a nivel de proyecto para todo juego portado con esta skill, no se reabre aquí.
- **RLS abierta en `scores`**: mismo nivel de exposición que el resto del catálogo (SPEC 06); anti-spam queda fuera de alcance.

## Identified risks

- **Fuga de listeners de teclado entre pantallas**: si el cleanup del `useEffect` no remueve `keydown` al desmontar, las flechas seguirían interceptadas en otras rutas. Mitigación: cleanup explícito verificado en el paso 13 del plan.
- **Loop de canvas fantasma tras desmontar**: sin `cancelAnimationFrame` en el cleanup, el loop seguiría corriendo en memoria. Mitigación: cancelar el RAF en el cleanup del `useEffect` de montaje.
- **Reversa de 180° instantánea**: si no se guarda `direction` vs. `pendingDirection` y se aplica el nuevo input en el mismo tick, la serpiente podría "morderse" contra su propio segundo segmento de forma injusta. Mitigación: el paso 9 del plan aplica el guard anti-reversa antes de mover.
- **Podio con menos de 3 puntuaciones reales**: mitigado por el guard `rows[N] &&` ya existente en `SalonClient.tsx` desde SPEC 06 — no requiere cambios nuevos, pero se re-verifica en el paso 13.
- **Desincronía entre el `id` renombrado en `games` y el `id: 'snake'` hardcodeado en el código**: si la migración de renombre tuviera un typo, el filtro `game.id === 'snake'` en `GamePlayerClient` dejaría de activar el guardado real silenciosamente. Mitigación: el paso 1 del plan usa el SQL exacto de arriba y el paso 13 verifica el guardado end-to-end.
- **Carga asíncrona de `fruits.png`**: si el canvas intenta dibujar el sprite antes de que la imagen termine de cargar (`Image.onload`), la fruta no se vería en los primeros frames. Mitigación: no dibujar la fruta hasta que `img.complete` sea `true`.
