# RANARIA — Motor del juego

> **Status:** Draft
> **Depends on:** SPEC 05, SPEC 09
> **Date:** 2026-08-15
> **Objective:** Implementar desde cero un Frogger genérico (`components/games/Ranaria.tsx`) sobre la fila `ranaria` ya sembrada en `games`, conectado a `/juego/ranaria/jugar` con el contrato estándar `RanariaState`/`RanariaProps`/`RanariaHandle` y el wiring de `GamePlayerClient.tsx` (gate, HUD, PAUSA/FIN/JUGAR DE NUEVO/SALIR).

## Scope

**In:**

- Verificar (no migrar) que la fila `id: 'ranaria'` en `games` ya tiene los valores exactos de Fase 1 (ver `## Data model`); no se ejecuta ningún `insert`/`update` sobre `games`.
- Nuevo componente `components/games/Ranaria.tsx`: canvas 800×600, grilla de 20 columnas × 15 filas de 40px, dibujado íntegramente por canvas (rects, gradientes, `ctx.fillText`) — sin sprites PNG.
  - Layout de filas (0 = arriba, 14 = abajo): fila 0 meta (5 huecos de nenúfar en columnas fijas), filas 1–5 río con troncos, fila 6 mediana de césped segura, filas 7–11 tráfico, filas 12–14 zona de salida segura (la rana nace centrada en la fila 14).
  - Movimiento de la rana: discreto por celda, un salto por pulsación de flecha (no por tick continuo como Snake), con debounce de 100ms y guard `event.repeat` para ignorar auto-repetición del sistema operativo.
  - Vehículos (filas 7–11) y troncos (filas 1–5): rects que se mueven en píxeles continuos por `requestAnimationFrame`, alternando dirección izquierda/derecha por carril, con velocidad propia por carril.
  - Colisión con vehículo → pierde una vida. Rana en fila de río sin estar sobre un tronco (al aterrizar o porque el tronco se movió por debajo) → pierde una vida (cae al agua). Tronco que empuja a la rana fuera del borde del canvas → pierde una vida.
  - Temporizador por vida: 25s (reducible por nivel, suelo 15s) dibujado como barra en el propio canvas (no en el HUD de React); llegar a 0 → pierde una vida.
  - Al perder una vida con `lives > 0`: la rana vuelve a la fila 14 centrada, se reinicia el temporizador de esa vida; el progreso de nenúfares llenados en el nivel actual NO se pierde.
  - Al perder la última vida (`lives === 0`): `gameOver = true`.
  - Llegar a un hueco de nenúfar vacío en la fila 0 lo marca como lleno (+50 puntos) y respawnea la rana en la fila 14. Intentar entrar a un hueco ya lleno o a una columna de la fila 0 que no es un hueco es un movimiento inválido (la rana no se mueve).
  - +10 puntos por cada fila nueva de avance máximo alcanzado desde el último respawn (subir no repite puntos si se retrocede y se vuelve a avanzar la misma fila).
  - Cuando los 5 huecos de nenúfar están llenos: +200 puntos de bonus, `level += 1`, se vacían los 5 huecos, la rana respawnea en la fila 14, y las velocidades de tráfico/río suben (`speed *= 1.15`, tope ×2.2 sobre la base) mientras el temporizador por vida baja (suelo 15s).
- El componente expone el contrato estándar:
  - Prop `paused: boolean` — congela el loop de física (tráfico, troncos, temporizador) sin cancelar el `requestAnimationFrame` de dibujo.
  - Prop `onStateChange(state: RanariaState) => void`.
  - Handle vía `forwardRef` + `useImperativeHandle`: `{ forceGameOver(): void; restart(): void }`.
- Listeners de teclado (`ArrowLeft/Right/Up/Down`) agregados al montar con `preventDefault()`, removidos al desmontar.
- Wiring en `GamePlayerClient.tsx`: gate `isRanaria = game.id === 'ranaria'` junto a `isAsteroids`/`isTetris`/`isArkanoid`/`isSnake`; se agrega `ranariaGameRef`, estado `ranariaLevel`, se monta `<Ranaria ref={ranariaGameRef} paused={paused} onStateChange={handleRanariaStateChange} />` dentro de `.crt-screen`; el nivel del HUD usa `ranariaLevel` cuando `isRanaria`; `endGame`/`restart` llaman a `ranariaGameRef.current?.forceGameOver()`/`restart()`; `restart()` también resetea `ranariaLevel` a 1 y `lives` a 3.
- `handleSaveScore` inserta en `scores` con `game_id: 'ranaria'` cuando `isRanaria` (extiende el condicional ternario existente a `isTetris ? 'tetris' : isArkanoid ? 'arkanoid' : isAsteroids ? 'asteroids' : isSnake ? 'snake' : 'ranaria'`), mismo patrón de error inline sin marcar `saved`.
- `app/juego/[id]/page.tsx`: agregar `'ranaria'` al array `['asteroids', 'tetris', 'arkanoid', 'snake']` que decide usar `getTopScores(id, 10)` en vez de `getSeededScores`.
- `SalonClient.tsx`: nueva prop `ranariaScores: ScoreRow[]`; `rows` usa `ranariaScores` cuando `tab === 'ranaria'`; el podio ya tiene el guard `rows[N] &&` existente (SPEC 06), no requiere cambios adicionales.
- `app/salon/page.tsx`: agregar `await getTopScores('ranaria', 12)` y pasarlo como prop `ranariaScores` a `SalonClient`.

**Out of scope (para futuros specs):**

- Controles táctiles/mobile.
- Sonido y cualquier balance de dificultad más allá de lo confirmado (escalado ×1.15 por nivel, tope ×2.2, temporizador con suelo de 15s).
- Cualquier otro juego del catálogo (`gloton`, `invasores`, `duelo-pixel`).
- Auth real / atar `player_name` a un usuario autenticado.
- Recalcular `best`/`plays` desde `scores`.
- Anti-spam/rate-limiting sobre el insert público en `scores`.
- Sprites PNG de vehículos/agua/rana: se descarta expresamente la sugerencia original de `references/game-suggestions-todo.md` de usar sprites nuevos — todo se dibuja por canvas (mismo criterio que Asteroids), evitando el riesgo de assets pendientes.
- Turtles que se sumergen, power-ups, más de 5 carriles por zona, o cualquier variante de Frogger más allá de tráfico + troncos + meta.

## Data model

```ts
type RanariaState = {
  score: number;
  lives: number; // 3 vidas iniciales, multivida real (no bandera binaria)
  level: number;
  gameOver: boolean;
};

type RanariaProps = {
  paused: boolean;
  onStateChange: (state: RanariaState) => void;
};

type RanariaHandle = {
  forceGameOver: () => void;
  restart: () => void;
};

// components/games/Ranaria.tsx — geometría interna, no expuesta en XState
type Lane = {
  row: number; // índice de fila (0 arriba .. 14 abajo)
  kind: 'traffic' | 'river';
  direction: 1 | -1;
  speedPxPerSec: number;
  obstacles: { x: number; width: number }[]; // coches o troncos
};
const GOAL_SLOT_COLUMNS = [1, 5, 9, 13, 17]; // de 20 columnas (0..19)
const CELL = 40; // 800/20 = 20 columnas, 600/40 = 15 filas
const LIFE_TIME_MS = 25_000;
const LIFE_TIME_FLOOR_MS = 15_000;
```

No se ejecuta ninguna migración de escritura sobre `games`: la fila `ranaria` ya existe con estos valores exactos (verificado el 2026-08-15 vía REST `GET /rest/v1/games?id=eq.ranaria`):

```json
{
  "id": "ranaria",
  "title": "RANARIA",
  "short": "Cruza la autopista de pixeles.",
  "long": "Salta entre carriles de coches a toda velocidad y troncos a la deriva en el río. Llega a los nenúfares antes de que se acabe el tiempo.",
  "cat": "ARCADE",
  "cover": "cover-rana",
  "color": "green",
  "best": 18900,
  "plays": "6.4K"
}
```

La clase `.cover-rana` ya existe en `app/globals.css` (línea 499) — no requiere CSS nuevo. `color: 'green'` coincide con el ya usado por `snake` en el catálogo; es una duplicidad de escaparate preexistente a esta spec (la fila `ranaria` ya la traía sembrada desde antes de portar Snake) y queda fuera de alcance corregirla aquí, ya que `color` solo afecta un acento visual, no una restricción funcional.

## Implementation plan

1. Consultar `games` (`select * where id = 'ranaria'`) y confirmar que los valores coinciden con los de `## Data model`; si difieren, corregir a mano vía `mcp__supabase__apply_migration` con un `update` mínimo antes de continuar (no se espera que ocurra).
2. Crear `components/games/Ranaria.tsx`: definir `LANES` (5 carriles de tráfico en filas 7–11, 5 carriles de río en filas 1–5) con velocidad base y dirección alternada por fila; estado mutable (`frog: {row, col, pixelX}`, `lanes`, `filledSlots: boolean[5]`, `lives`, `level`, `score`, `maxRowThisTrip`, `lifeTimeRemainingMs`, `state`) en `useRef`.
3. Loop `requestAnimationFrame` con delta de tiempo: avanza la posición continua de cada obstáculo de cada carril (`x += direction * speedPxPerSec * dt`), envolviendo en los bordes del canvas; descuenta `lifeTimeRemainingMs`; `paused=true` detiene toda la física (obstáculos, temporizador) sin detener el RAF ni el dibujo.
4. Dibujar la grilla (bandas de color por zona: meta, río, mediana, tráfico, salida), los 5 huecos de nenúfar (llenos vs. vacíos con relleno visual distinto), los obstáculos (rects con detalle simple: faros para coches, vetas para troncos), la rana (forma simple verde con ojos), y una barra de temporizador con `ctx.fillRect` proporcional a `lifeTimeRemainingMs / LIFE_TIME_MS` en una esquina del canvas.
5. `useEffect` de montaje: listeners `keydown` para `ArrowLeft/Right/Up/Down` con `preventDefault()`, guard `event.repeat` y debounce de 100ms entre saltos; cada salto válido mueve `frog.row`/`frog.col` una celda, clamp de columnas 0–19 y filas 0–14; cleanup remueve listeners y hace `cancelAnimationFrame`.
6. Reglas de movimiento hacia la fila 0 (meta): si la columna destino no está en `GOAL_SLOT_COLUMNS` o el hueco correspondiente ya está `filledSlots[i] === true`, el salto se rechaza (la rana no se mueve, sin penalización).
7. Tras cada salto válido: si `frog.row < maxRowThisTrip`, sumar `+10 * (maxRowThisTrip - frog.row)` y actualizar `maxRowThisTrip`; si la rana entra a un hueco de nenúfar vacío, marcarlo `filledSlots[i] = true`, sumar `+50`, y respawnear la rana en fila 14 columna central (resetea `maxRowThisTrip` a 14, resetea `lifeTimeRemainingMs`).
8. Detección continua por frame (no solo en el salto): si `frog.row` está en 1–5 (río) y la posición horizontal de la rana no queda dentro de ningún tronco del carril correspondiente (incluye el caso de haber sido empujada fuera del canvas), o si `frog.row` está en 7–11 (tráfico) y su rect colisiona con un vehículo, o si `lifeTimeRemainingMs <= 0` → perder una vida.
9. Al perder una vida: si `lives - 1 > 0`, `lives -= 1`, respawnear rana en fila 14 columna central, resetear `lifeTimeRemainingMs` (sin tocar `filledSlots`/`level`); si `lives - 1 === 0`, `lives = 0`, `state = 'gameover'`.
10. Cuando los 5 `filledSlots` están llenos: sumar `+200`, `level += 1`, vaciar `filledSlots`, respawnear rana, multiplicar velocidades de todos los carriles ×1.15 (tope acumulado ×2.2 sobre la velocidad base) y reducir `LIFE_TIME_MS` efectivo del nivel (suelo `LIFE_TIME_FLOOR_MS`).
11. Implementar `onStateChange`: comparar `{score, lives, level, gameOver: state === 'gameover'}` contra el último valor emitido (ref) y notificar solo si cambió.
12. Exponer `forwardRef` + `useImperativeHandle` con `forceGameOver()` (`state = 'gameover'`, `lives = 0`) y `restart()` (reinicializa rana en fila 14 centrada, `lives = 3`, `level = 1`, `score = 0`, `filledSlots` vacío, velocidades base, `lifeTimeRemainingMs = LIFE_TIME_MS`).
13. Wiring en `GamePlayerClient.tsx`: `isRanaria`, `ranariaGameRef`, `ranariaLevel`, `handleRanariaStateChange`, render condicional de `<Ranaria />`, extender `endGame`/`restart`/`handleSaveScore`/`level` con la rama `isRanaria` (usa la rama `lives` estándar del HUD, no requiere HUD condicional nuevo).
14. `app/juego/[id]/page.tsx`: agregar `'ranaria'` al array que gatea `getTopScores`.
15. `app/salon/page.tsx` + `SalonClient.tsx`: agregar `getTopScores('ranaria', 12)` y la prop/rama `ranariaScores`.
16. Verificación manual con `npm run dev`: jugar en `/juego/ranaria/jugar`, cruzar tráfico sin chocar, subir a un tronco y verificar que la rana viaja con él, caer al agua fuera de un tronco y perder una vida, dejar correr el temporizador hasta 0 y perder una vida, llenar los 5 nenúfares y confirmar el bonus + subida de nivel + aumento de velocidad, perder las 3 vidas y confirmar game over; pausar/reanudar congela tráfico/troncos/temporizador; reiniciar; guardar puntuación y confirmar que aparece en `/salon` (pestaña RANARIA) y en `/juego/ranaria` tras recargar; confirmar que las flechas no quedan interceptadas en otras pantallas al salir; confirmar que ningún otro juego del catálogo cambió de comportamiento.

## Acceptance criteria

- [ ] `components/games/Ranaria.tsx` existe y renderiza un canvas jugable con teclado (`←→↑↓` mueven la rana una celda por pulsación, sin repetición automática del sistema operativo).
- [ ] Todo el juego se dibuja por canvas (grilla, obstáculos, rana, temporizador); no hay ningún `<img>`/PNG.
- [ ] El HUD ("Puntuación", "Vidas", "Nivel") refleja en tiempo real el estado interno del juego real.
- [ ] Subir a un tronco hace que la rana se mueva junto con él en píxeles continuos.
- [ ] Estar en el río sin un tronco debajo (al aterrizar o porque el tronco se movió) resta una vida.
- [ ] Colisionar con un vehículo en las filas de tráfico resta una vida.
- [ ] El temporizador por vida, visible en el canvas, llega a 0 y resta una vida si la rana no llegó a la meta a tiempo.
- [ ] Llenar los 5 huecos de nenúfar suma el bonus, sube el nivel y aumenta visiblemente la velocidad de tráfico/río.
- [ ] Perder la tercera vida dispara game over.
- [ ] El botón "FIN" del HUD termina la partida inmediatamente y abre el modal "FIN DEL JUEGO" con la puntuación final real.
- [ ] "PAUSA"/"REANUDAR" congela y reanuda el tráfico, los troncos y el temporizador reales.
- [ ] "JUGAR DE NUEVO" reinicia completamente el estado interno (rana en salida, 3 vidas, nivel 1, score 0, nenúfares vacíos).
- [ ] "SALIR" no deja listeners de teclado activos en otras pantallas.
- [ ] Ningún otro juego del catálogo cambió de comportamiento.
- [ ] `npm run lint` y `npm run build` pasan sin errores nuevos.

## Decisions taken and discarded

- **Estado mutable en `useRef`, nunca `useState`**: consistente con el resto del catálogo (SPEC 05/07/08/09).
- **El canvas comunica su estado a React vía callback (`onStateChange`), no polling**: consistente con SPEC 05/07/08/09.
- **Sin auto-reinicio por tecla**: reiniciar es exclusivo del botón "JUGAR DE NUEVO" del HUD.
- **No se inserta fila nueva en `games`**: `ranaria` ya está sembrada en el catálogo (ver `references/implemented-games/README.md`, sección "Juegos del catálogo aún NO implementados"); se verifica en vez de migrar, a diferencia de SPEC 05/09 que sí insertaban/renombraban.
- **`color: 'green'` se mantiene aunque coincide con `snake`**: la unión `cyan | magenta | yellow | green` de `lib/games.ts` es cerrada y los otros tres colores ya están tomados por Tetris/Arkanoid/Asteroids; el valor ya viene sembrado en la fila `ranaria` desde antes de portar Snake, y `color` es solo un acento visual sin impacto funcional — no se reabre esa decisión de escaparate aquí.
- **Sin sprites PNG, todo dibujado por canvas**: la nota original en `references/game-suggestions-todo.md` sugería "sprites de vehículos y agua", pero Fase 1 de este agente prioriza formas dibujadas cuando es viable; reduce el riesgo de "asset pendiente" y sigue el patrón de Asteroids (vectorial puro), que es más barato de mantener que gestionar un nuevo directorio `public/games/ranaria/`.
- **3 vidas reales (no bandera binaria como Snake)**: Frogger clásico tiene vidas múltiples con respawn in-place; a diferencia de Snake (donde 1 choque siempre termina la partida y `lives` se reutilizó como flag), aquí `lives` se usa en su sentido literal — no requiere HUD condicional nuevo, reutiliza directamente el HUD "Vidas" existente.
- **Movimiento discreto por celda en vez de tick continuo**: a diferencia de Snake (que avanza por tick de tiempo), Frogger clásico se controla por salto discreto ante cada pulsación de flecha; se añade debounce de 100ms y guard `event.repeat` para que mantener la tecla presionada no dispare saltos en cascada.
- **Temporizador por vida dibujado en el canvas, no en el HUD de React**: mantiene `RanariaState` con exactamente los 4 campos estándar (`score`, `lives`, `level`, `gameOver`) sin extender el contrato ni tocar la estructura del HUD de `GamePlayerClient.tsx`, igual que Snake evitó un campo extra reutilizando `lives`.
- **Puntuación: +10 por fila de avance máximo nueva, +50 por nenúfar lleno, +200 por completar el nivel**: es un entero acumulativo mayor-es-mejor de forma nativa (no hay métrica de tiempo/precisión que convertir); recompensa tanto el progreso parcial (avanzar carriles) como el objetivo final (llenar nenúfares), evitando que una partida corta con un solo cruce exitoso puntúe igual que una partida larga con muchos avances parciales.
- **Escalado de dificultad ×1.15 por nivel con tope ×2.2 y temporizador con suelo de 15s**: evita que niveles altos se vuelvan literalmente injugables (velocidad infinita) mientras preserva la sensación de dificultad creciente, mismo criterio que el "suelo mínimo" de tick en Snake.
- **Leaderboard real siempre, no se reabre por juego**: decisión ya tomada a nivel de proyecto para todo juego portado con esta skill.
- **Persistencia Server Component (fetch) → Client Component (insert directo), sin Route Handlers intermedios**: mismo patrón que el resto del catálogo.
- **RLS abierta en `scores`**: mismo nivel de exposición que el resto del catálogo (SPEC 06); anti-spam queda fuera de alcance.

## Identified risks

- **Fuga de listeners de teclado entre pantallas**: si el cleanup del `useEffect` no remueve `keydown` al desmontar, las flechas seguirían interceptadas en otras rutas. Mitigación: cleanup explícito verificado en el paso 16 del plan.
- **Loop de canvas fantasma tras desmontar**: sin `cancelAnimationFrame` en el cleanup, el loop seguiría corriendo en memoria. Mitigación: cancelar el RAF en el cleanup del `useEffect` de montaje (paso 5).
- **Salto en cascada por tecla mantenida**: sin debounce ni guard `event.repeat`, mantener presionada una flecha dispararía múltiples saltos por frame. Mitigación: debounce de 100ms + guard `event.repeat` en el paso 5.
- **Física de tronco desincronizada del salto discreto**: si la colisión rana-tronco solo se evalúa en el instante del salto (no cada frame), un tronco que se mueve por debajo de una rana inmóvil no la haría caer al agua de forma creíble. Mitigación: paso 8 evalúa la colisión de río/tráfico en cada frame del loop, no solo al saltar.
- **Balance de dificultad ambiguo (velocidad/temporizador)**: sin tope, el escalado por nivel podría volver el juego injugable en niveles altos. Mitigación: tope ×2.2 y suelo de 15s fijados explícitamente en el paso 10 y verificados en el paso 16.
- **Condición de fin de partida ambigua entre "perder vida" y "game over"**: si no se distingue `lives - 1 > 0` de `lives - 1 === 0`, una colisión podría terminar la partida prematuramente o dejarla en un estado inconsistente (vidas negativas). Mitigación: paso 9 especifica ambas ramas explícitamente.
- **Podio con menos de 3 puntuaciones reales**: mitigado por el guard `rows[N] &&` ya existente en `SalonClient.tsx` desde SPEC 06 — no requiere cambios nuevos, pero se re-verifica en el paso 16.
- **Desincronía entre el `id` esperado (`ranaria`) y el hardcodeado en el código**: si el gate `game.id === 'ranaria'` no coincide con el `id` real de la fila ya sembrada, el guardado real se desactivaría silenciosamente. Mitigación: el paso 1 del plan verifica la fila existente antes de escribir código, y el paso 16 verifica el guardado end-to-end.
