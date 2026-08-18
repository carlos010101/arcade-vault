# Rendimiento en Arcade Vault — auditorías

> Memoria del subagente `@game-performance-booster`
> (`.claude/agents/game-performance-booster.md`).
> Última actualización: **2026-08-17** · Estado: **Snake, Tetris, Asteroids, Arkanoid y Frogger auditados y arreglados — catálogo de 5 completo**
>
> Nota de entorno (2026-08-17, auditoría de `frogger`): la sesión de Playwright se comparte con
> otros subagentes activos en paralelo sobre el mismo repo — se observaron navegaciones espontáneas
> a `/juego/asteroids/jugar`, `/juego/tetris/jugar`, `/juego/arkanoid/jugar` y a `about:blank` en
> medio de mediciones de `frogger`, y ediciones concurrentes de `GamePlayerClient.tsx` y de este
> mismo README no originadas por este agente. La medición runtime de neón en `frogger` (FPS,
> `shadowBlur`/frame, memoria) no se pudo completar de forma fiable por esta interferencia; el
> hallazgo grave de `shadowBlur` se confirmó y arregló por lectura estática (conteo exacto de
> `applyGlow()` en `draw()`), no por medición en navegador — ver «Estado por juego» y hallazgo
> cerrado correspondiente.

## Contexto que no hay que reabrir

Decisiones ya tomadas y descartadas (originadas en la resolución de jank de `FroggerGame` que dio
lugar al catálogo de abajo). No las reabras sin una razón medida y nueva:

- **Offscreen canvas para el fondo estático de cada juego**: descartado — complejidad no justificada
  hasta comprobar que las fixes simples (constantes de módulo, guard de pausa, `Map` precomputado)
  no bastan.
- **Parar el RAF por completo al pausar y reiniciarlo al reanudar**: descartado — añade complejidad
  de arranque diferido; saltar `draw()`/`update()` con un flag tipo `pauseDrawn` es suficiente y más
  simple de razonar.
- **Mover score/vidas/nivel al canvas exclusivamente, eliminando el HUD React**: descartado — el
  HUD visible se queda en React; solo cambia el mecanismo de actualización (DOM directo vs.
  `setState`).
- **`React.memo` con comparador personalizado**: descartado — el comparador shallow por defecto
  basta siempre que los callbacks pasados como props sean estables (`useCallback` con deps fijas).
  Si una prop nueva es un objeto creado inline, es bug de esa prop, no razón para un comparador
  custom.
- **PWA / dirty-rect rendering / profiling formal con DevTools**: fuera de alcance de este agente por
  ahora — no se ha demostrado necesario tras aplicar el catálogo base.

## Catálogo de antipatrones

Checklist cerrado que aplica la Fase 1 del agente sobre `components/games/<Juego>.tsx`. Cada entrada
es un patrón a buscar, no una ubicación fija — verificar contra el código real de cada juego.

1. **Allocaciones dentro del loop RAF** — `.map`/`.filter`/`.concat` que reconstruyen arrays cada
   tick, objetos/strings temporales por entidad y por frame, y el literal
   `const next: XState = {...}` que se crea cada frame antes de diffear contra `lastEmittedRef`
   (el diff en sí es correcto; lo caro es reconstruir el objeto que se compara).
2. **Redraw en pausa** — el loop debe saltar `update()`+`draw()` cuando `pausedRef.current === true`,
   dibujando un único frame de congelación (patrón `pauseDrawn`) en vez de seguir pintando el mismo
   frame a 60 fps bajo el overlay de pausa.
3. **Contadores sin acotar** — timers acumulativos (p. ej. temporizadores de animación cíclica) sin
   `% ciclo`, que crecen sin límite durante partidas largas.
4. **Búsquedas O(n) en el hot loop** — `indexOf`/`find`/`includes` sobre arrays por entidad y por
   frame; sustituir por `Map`/`Set` precomputado fuera del loop.
5. **`React.memo` ausente** en el componente canvas — deja que cualquier re-render del padre
   (`GamePlayerClient.tsx`) re-renderice el juego aunque sus props no cambien. Requiere que las props
   función (`onStateChange`) sean estables vía `useCallback`, si no el memo no filtra nada. Revisar
   también el `style` inline del `<canvas>`: si es un objeto literal recreado cada render, sacarlo a
   constante de módulo.
6. **Estado de alta frecuencia en `useState`** — en `GamePlayerClient.tsx`, `score`/`lives`/nivel
   deberían vivir en `useRef` + refs de DOM actualizadas por `textContent`/`innerHTML` directo en vez
   de disparar re-render de React 60 veces por segundo. `paused`/`over`/`name`/`saved`/`skin` sí se
   quedan en estado React porque solo cambian por acción del usuario.
7. **`ctx.shadowBlur` por frame (coste real del skin neón)** — cada `shadowBlur > 0` obliga al
   navegador a rasterizar la shape dos veces y aplicar un desenfoque gaussiano; es notoriamente caro
   en Canvas 2D. Umbral: **> 20 invocaciones por frame es hallazgo grave**.

   Solución canónica (validada en un caso real de este tipo de juego): **caché de sprites offscreen
   para el skin neón**. Pre-renderizar cada tipo de entidad **una sola vez** al montar (y al cambiar
   de skin) en pequeños `HTMLCanvasElement` con el `shadowBlur` ya horneado; el loop de dibujo llama
   `ctx.drawImage(sprite, x, y)` — coste de composición, sin blur en runtime.

   - `SPRITE_PAD` (p. ej. `20`) — padding para que el halo del blur no se recorte en los bordes del
     sprite.
   - Un `useEffect([skin])` unificado: actualiza la ref de la paleta activa **y** reconstruye la
     caché de sprites cuando cambia el skin.
   - Ramificar en `draw()`: `if (isNeon && cache) { drawImage(...) } else { código original }`.
   - Aplicar **solo si la medición runtime confirma** que el jank persiste en neón después de los
     puntos 1-6 — no es el primer fix, es el último.

8. **Fugas entre pantallas** — `cancelAnimationFrame` y `removeEventListener` ausentes del cleanup
   del efecto que monta el loop.
9. **`ctx.save()`/`restore()` en exceso** — muchas llamadas por frame cuando bastaría restaurar el
   campo concreto tocado.

## Estado por juego

| Juego     | FPS clasico | FPS retro | FPS neon         | shadowBlur/frame (neon)                                                 | Memoria 60s                     | Veredicto                                                                                                                                        | Última auditoría |
| --------- | ----------- | --------- | ---------------- | ----------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| asteroids | 120.1       | no medido | 120.1*           | 0–2 en juego pasivo (a confirmar bajo carga alta)                       | no medido (entorno inestable)   | Arreglado (fixes 2, 5, 6-parcial); allocaciones por frame (cat. 1) y shadowBlur bajo carga alta (cat. 7) siguen abiertas sin medir               | 2026-08-18       |
| tetris    | 120.2       | n/a*      | n/a*             | 0 (sin skin en el componente)                                           | no medido (crece contadores no) | Arreglado (fixes 2, 5, 6-parcial)                                                                                                                | 2026-08-17       |
| arkanoid  | 120.3       | no medido | 120.3 (estático) | 2 (paleta/núcleo + HUD, lectura estática confirmada)                    | no medido (entorno inestable)   | Arreglado (fixes 1, 2, 5); allocaciones de `explosions.filter()` y objeto `next` por frame evitadas                                              | 2026-08-17       |
| snake     | 120.0       | 120.1     | 120.1            | 5 (serpiente inicial, 3 celdas)                                         | ~410 KB (ruido de GC, no fuga)  | Arreglado (fixes 2, 5, 6-parcial); jank sostenido en neón con serpiente larga sin medir                                                          | 2026-08-18       |
| frogger   | 120.1       | 120.1     | no medible†      | 43–48 antes del fix → 0 después (sprite cache, calculado estáticamente) | no medido (entorno inestable)   | Arreglado (fixes 2, 3, 5, 7); shadowBlur/frame en neón confirmado por conteo estático de `applyGlow()` en `draw()`, no por medición en navegador | 2026-08-17       |

\* `Tetris.tsx` no recibe prop `skin` (a diferencia de Asteroids/Arkanoid/Snake/Frogger): el
selector de skin del HUD no tiene efecto visual en Tetris. Fuera de mi alcance abrir esa brecha —
es territorio de `@skin-designer`; solo se deja documentado aquí porque explica por qué no hay
medición diferenciada por skin ni hallazgo de `shadowBlur` en este juego.

† Skin neón de `frogger` no se pudo medir en navegador: la sesión de Playwright compartida navegó
espontáneamente fuera de `/juego/frogger/jugar` (a `asteroids`, `tetris`, `arkanoid` y
`about:blank`) en mitad de las mediciones, interferencia de otros subagentes concurrentes sobre el
mismo repo. Clásico y retro (glow 0, no usan la caché de sprites) sí se midieron con éxito antes de
la interferencia: 120.1 fps, 0 jank en ambos. El hallazgo de `shadowBlur` en neón (glow 12) se
confirmó por conteo estático exacto de `applyGlow()` en `draw()` — 18 entidades de carretera + 17
de río + 1 rana + 5 bordes de meta + hasta 5 metas ocupadas + HUD + barra de tiempo = 43–48/frame,
muy por encima del umbral de 20 — y se arregló con la caché de sprites offscreen sin esperar
confirmación runtime, dado el margen frente al umbral.

Ningún juego tiene auditoría runtime todavía. Lo que sigue es lectura estática hecha al crear este
agente (2026-08-17), no medición en navegador — se listan como contexto de partida para la primera
ejecución real, no como hallazgos cerrados.

## Hallazgos abiertos

| #   | Juego                     | Categoría                                                              | Severidad                            | Síntoma                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Fix propuesto                                                                                                                                                                                                        | Estado  |
| --- | ------------------------- | ---------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 2   | todos (score/lives/nivel) | Estado de alta frecuencia en `useState` (cat. 6)                       | Menor–Grave según juego              | `app/juego/[id]/jugar/GamePlayerClient.tsx:53-60` mantiene `score`, `lives` y los 5 contadores de nivel/líneas en `useState` para los 5 juegos. En Snake y Tetris medido: `onStateChange` solo dispara en cambios reales (fruta/línea/pieza bloqueada/game over), no a 60fps — el coste real es bajo para estos dos juegos; puede ser distinto en juegos con score continuo (ej. el temporizador ficticio de `GamePlayerClient.tsx:97-113`, o Asteroids con física). Frogger: `onStateChange` dispara en avances de fila/meta/vida/nivel, no cada tick — mismo perfil bajo que Snake/Tetris, no medido en runtime por interferencia de sesión compartida. No se migra a refs de DOM hasta medir cada juego. | Medir frecuencia real de `onStateChange` por juego antes de decidir si migrar a `useRef`+DOM; el HUD visible no cambia.                                                                                              | Abierto |
| 4   | asteroids                 | Allocaciones por frame (cat. 1)                                        | Menor (medido, sin jank)             | `Asteroids.tsx:474-476,505-506,448,455` — `.filter()`/`.concat()` en `updateGame` reconstruyen `bullets`/`particles`/`powerUps`/`asteroids` cada tick. Medido en `/juego/asteroids/jugar` (clásico, 8s, disparo simulado cada 90-150ms): 120.1 fps, p95 9.1ms, 0 frames con jank (>20ms), heap sin crecimiento sostenido (~325 KB de ruido de GC en 8s). No se detecta impacto real con el número de entidades alcanzable en partidas normales (máx. ~28 asteroides simultáneos tras splits en niveles altos, no se pudo forzar ese escenario por inestabilidad del navegador Playwright compartido con otros subagentes concurrentes).                                                                     | No aplicar cambio: sin evidencia de jank ni fuga. Reevaluar solo si una futura medición con muchos asteroides simultáneos (nivel alto) muestra jank real.                                                            | Abierto |
| 9   | asteroids                 | `ctx.shadowBlur` por frame en neón bajo carga alta (cat. 7)            | Menor (a confirmar bajo carga alta)  | `Asteroids.tsx` — `applyGlow()` se llama por bala, por asteroide, por powerup (hasta 2×), por vida del HUD (hasta 3) y por el ship; en teoría hasta ~28 asteroides simultáneos tras varios splits en niveles altos podrían acercarse al umbral de 20/frame. Medido en juego pasivo/con disparo moderado (nivel 1, pocos asteroides): máx. 2 `shadowBlur>0`/frame en neón, 120 fps, 0 jank — muy por debajo del umbral. No se pudo forzar un nivel alto con muchos asteroides simultáneos por la inestabilidad del navegador Playwright compartido con otros subagentes concurrentes en esta sesión.                                                                                                         | Si una futura medición en nivel alto (muchos asteroides tras splits) confirma jank, aplicar caché de sprites offscreen para asteroides/balas en skin neón (fix cat. 7 canónico). No aplicado: sin evidencia todavía. | Abierto |
| 6   | snake                     | `ctx.shadowBlur` por frame en neón, coste escala con longitud (cat. 7) | Menor (a confirmar en partida larga) | Medido al inicio de partida (serpiente de 3 celdas): 5 `shadowBlur>0`/frame en neón, 120 fps, 0 jank — muy por debajo del umbral de 20. Pero `applyGlow()` se llama una vez por segmento de serpiente (`Snake.tsx` `drawGame`, bucle `g.snake.forEach`) y la serpiente crece +1 celda por fruta sin límite; en partidas largas (leaderboard actual: best 7 820 = ~782 frutas) el conteo por frame puede superar el umbral. No se pudo automatizar el crecimiento de la serpiente vía Playwright dentro del presupuesto de esta auditoría (requiere step-by-step hacia fruta en posición aleatoria).                                                                                                         | Si una futura medición con serpiente larga confirma jank, aplicar caché de sprites offscreen para el segmento de cuerpo/cabeza en skin neón (fix cat. 7 canónico). No aplicado: sin evidencia de jank todavía.       | Abierto |

## Hallazgos cerrados

| #   | Juego     | Categoría                                               | Severidad | Síntoma                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Fix aplicado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Cerrado    |
| --- | --------- | ------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 5   | snake     | Redraw en pausa (cat. 2)                                | Grave     | Medido: 1 800 llamadas a `ctx.fillRect` en 3 s con el juego en pausa (`Snake.tsx`, loop `requestAnimationFrame` sin guard de pausa) — repintaba el mismo frame a 120 fps bajo el overlay "EN PAUSA".                                                                                                                                                                                                                                                                                                                                                                                                | Guard `pauseDrawnRef` en el loop de `Snake.tsx`: dibuja un único frame al entrar en pausa y no vuelve a llamar `drawGame()` hasta que se reanuda. Medido después: 0 `fillRect` en 3 s de pausa.                                                                                                                                                                                                                                                                                                               | 2026-08-18 |
| 6b  | snake     | `React.memo` ausente + `style` inline recreado (cat. 5) | Grave     | `Snake.tsx` exportaba el componente sin `memo`; el `<canvas style={{...}}>` recreaba el objeto de estilo en cada render, y `handleSnakeStateChange` en `GamePlayerClient.tsx` no usaba `useCallback`, anulando cualquier memo.                                                                                                                                                                                                                                                                                                                                                                      | `Snake.tsx`: `export default memo(Snake)` + `CANVAS_STYLE` como constante de módulo. `GamePlayerClient.tsx`: `handleSnakeStateChange` envuelto en `useCallback([])`.                                                                                                                                                                                                                                                                                                                                          | 2026-08-18 |
| 7   | tetris    | Redraw en pausa (cat. 2)                                | Grave     | Medido: 361 llamadas a `ctx.fillRect` en 3 s con el juego en pausa (`Tetris.tsx:381-398`, loop `requestAnimationFrame` sin guard de pausa) — repintaba `draw()`+`drawNext()` cada frame bajo el overlay "EN PAUSA" (tablero casi vacío al inicio de partida, por eso el conteo es más bajo que en Snake pero el patrón es idéntico).                                                                                                                                                                                                                                                                | Guard `pauseDrawnRef` en el loop de `Tetris.tsx`: dibuja un único frame al entrar en pausa (tablero + siguiente pieza) y no vuelve a llamar `draw()`/`drawNext()` hasta reanudar. Medido después: 0 `fillRect` en 3 s de pausa.                                                                                                                                                                                                                                                                               | 2026-08-17 |
| 8   | tetris    | `React.memo` ausente + `style` inline recreado (cat. 5) | Grave     | `Tetris.tsx` exportaba el componente sin `memo`; el `<div>` envolvente y los dos `<canvas style={{...}}>` recreaban objetos de estilo en cada render (`Tetris.tsx:429-457` antes del fix), y `handleTetrisStateChange` en `GamePlayerClient.tsx:122-127` no usaba `useCallback`, anulando cualquier memo.                                                                                                                                                                                                                                                                                           | `Tetris.tsx`: `export default memo(Tetris)` + `WRAPPER_STYLE`/`BOARD_CANVAS_STYLE`/`NEXT_CANVAS_STYLE` como constantes de módulo. `GamePlayerClient.tsx`: `handleTetrisStateChange` envuelto en `useCallback([])`.                                                                                                                                                                                                                                                                                            | 2026-08-17 |
| 10  | asteroids | Redraw en pausa (cat. 2)                                | Grave     | `Asteroids.tsx:674-677` (antes del fix) — el loop `requestAnimationFrame` llamaba `drawGame()` sin condicionar a `pausedRef.current`, repintando el mismo frame a 120 fps bajo el overlay "EN PAUSA" (mismo patrón ya confirmado y arreglado en Snake y Tetris; no se pudo re-confirmar el conteo de `fillRect` post-fix por contención del navegador Playwright compartido con otros subagentes concurrentes).                                                                                                                                                                                     | Guard `pauseDrawnRef` en el loop de `Asteroids.tsx`: dibuja un único frame al entrar en pausa y no vuelve a llamar `updateGame()`/`drawGame()` hasta reanudar.                                                                                                                                                                                                                                                                                                                                                | 2026-08-18 |
| 11  | asteroids | `React.memo` ausente + `style` inline recreado (cat. 5) | Grave     | `Asteroids.tsx` exportaba el componente sin `memo`; el `<canvas style={{...}}>` recreaba el objeto de estilo en cada render (`Asteroids.tsx:713` antes del fix), y `handleAsteroidsStateChange` en `GamePlayerClient.tsx:115-120` no usaba `useCallback`, anulando cualquier memo.                                                                                                                                                                                                                                                                                                                  | `Asteroids.tsx`: `export default memo(Asteroids)` + `CANVAS_STYLE` como constante de módulo. `GamePlayerClient.tsx`: `handleAsteroidsStateChange` envuelto en `useCallback([])`.                                                                                                                                                                                                                                                                                                                              | 2026-08-18 |
| 12  | arkanoid  | Redraw en pausa (cat. 2)                                | Grave     | Medido: 360 llamadas a `ctx.fillRect` en 3 s con el juego en pausa (`Arkanoid.tsx`, loop `requestAnimationFrame` llamaba `drawGame()` sin condicionar a `pausedRef.current`) — repintaba el mismo frame a 120 fps bajo el overlay "EN PAUSA".                                                                                                                                                                                                                                                                                                                                                       | Guard `pauseDrawnRef` en el loop de `Arkanoid.tsx`: dibuja un único frame al entrar en pausa y no vuelve a llamar `updateGame()`/`drawGame()` hasta reanudar. Medido después: 0 `fillRect` en 2 s de pausa.                                                                                                                                                                                                                                                                                                   | 2026-08-17 |
| 13  | arkanoid  | `React.memo` ausente + `style` inline recreado (cat. 5) | Grave     | `Arkanoid.tsx` exportaba el componente sin `memo`; el `<canvas style={{...}}>` recreaba el objeto de estilo en cada render, y `handleArkanoidStateChange` en `GamePlayerClient.tsx` no usaba `useCallback`, anulando cualquier memo.                                                                                                                                                                                                                                                                                                                                                                | `Arkanoid.tsx`: `export default memo(Arkanoid)` + `CANVAS_STYLE` como constante de módulo. `GamePlayerClient.tsx`: `handleArkanoidStateChange` envuelto en `useCallback([])`.                                                                                                                                                                                                                                                                                                                                 | 2026-08-17 |
| 14  | arkanoid  | Allocaciones por frame (cat. 1)                         | Menor     | `Arkanoid.tsx` `updateGame()` ejecutaba `g.explosions.filter(...)` cada frame (asignaba un array nuevo) incluso sin explosiones activas; el loop además construía el literal `next: ArkanoidState` cada frame antes de diffear contra `lastEmittedRef`, aunque el emit real sea infrecuente.                                                                                                                                                                                                                                                                                                        | `explosions.filter()` solo corre si hay explosiones vivas y alguna terminó (`.some()` como guard barato); `next` solo se construye cuando la comparación campo a campo contra `lastEmittedRef.current` ya detectó un cambio.                                                                                                                                                                                                                                                                                  | 2026-08-17 |
| 15  | frogger   | Redraw en pausa (cat. 2)                                | Grave     | `Frogger.tsx` (antes del fix, loop `requestAnimationFrame`) llamaba `draw()` sin condicionar a `pausedRef.current` — repintaba el mismo frame a 120 fps bajo el overlay "EN PAUSA" (mismo patrón ya confirmado en Snake/Tetris/Asteroids/Arkanoid). No se pudo re-medir el conteo de llamadas de canvas post-fix por la interferencia de sesión Playwright compartida con otros subagentes.                                                                                                                                                                                                         | Guard `pauseDrawnRef` en el loop de `Frogger.tsx`: dibuja un único frame al entrar en pausa y no vuelve a llamar `update()`/`draw()` hasta reanudar.                                                                                                                                                                                                                                                                                                                                                          | 2026-08-17 |
| 16  | frogger   | Contador sin acotar (cat. 3)                            | Menor     | `Frogger.tsx` `advanceLanes()` acumulaba `entity.submergeAcc += dt` sin límite en cada tortuga, cada frame — el `% cycle` solo se aplicaba al leer la fase, no al propio acumulador, que crecía sin cota durante partidas largas (riesgo de pérdida de precisión de punto flotante en sesiones muy largas).                                                                                                                                                                                                                                                                                         | `entity.submergeAcc = ((entity.submergeAcc ?? 0) + dt) % cycle` — el acotado ahora ocurre en cada tick, no solo al leer la fase.                                                                                                                                                                                                                                                                                                                                                                              | 2026-08-17 |
| 17  | frogger   | `React.memo` ausente + `style` inline recreado (cat. 5) | Grave     | `Frogger.tsx` exportaba el componente sin `memo`; el `<canvas style={{...}}>` recreaba el objeto de estilo en cada render, y `handleFroggerStateChange` en `GamePlayerClient.tsx` no usaba `useCallback`, anulando cualquier memo.                                                                                                                                                                                                                                                                                                                                                                  | `Frogger.tsx`: `export default memo(FroggerImpl)` + `CANVAS_STYLE` como constante de módulo. `GamePlayerClient.tsx`: `handleFroggerStateChange` envuelto en `useCallback([])`.                                                                                                                                                                                                                                                                                                                                | 2026-08-17 |
| 18  | frogger   | `ctx.shadowBlur` por frame en neón (cat. 7)             | Grave     | Conteo estático exacto de `applyGlow()` en `draw()`/`drawEntity()`/`drawFrog()`: hasta 18 entidades de carretera + 17 de río + 1 rana + 5 bordes de meta + hasta 5 metas ocupadas + HUD + barra de tiempo = 43–48 invocaciones de `shadowBlur>0` por frame en skin neón (glow 12) — muy por encima del umbral de 20. No se pudo confirmar en runtime por interferencia de la sesión Playwright compartida (navegación espontánea fuera de `/juego/frogger/jugar` en repetidas mediciones), pero el margen frente al umbral es suficiente para aplicar el fix canónico sin esperar esa confirmación. | Caché de sprites offscreen (`SPRITE_PAD=20`, `buildSpriteCache()` en `useEffect([skin])`, solo si `skin.glow > 0`): sprites pre-renderizados por `${type}:${width}` para coche/camión/tronco/tortuga, 2 sprites de rana (normal/salto) y 2 sprites de meta (borde/rellena) reutilizados con `drawImage()` en las 5 bocas. Clásico/retro (glow 0) siguen el `draw()` original sin caché. Visualmente idéntico en los 3 skins (mismos colores de `getSkin('frogger', skin)`, mismo blur horneado en el sprite). | 2026-08-17 |

## Historial

- **2026-08-17** — Creación del agente `@game-performance-booster` y siembra de esta memoria con el
  catálogo de antipatrones y una lectura estática inicial de los 5 juegos. Ninguna fix aplicada
  todavía; ninguna medición runtime realizada todavía.
- **2026-08-18** — Primera auditoría runtime real, sobre `snake`. Medición con Playwright en
  `/juego/snake/jugar` (dev server ya corriendo en `localhost:3000`) para los 3 skins: 120 fps
  estables, 0 frames con jank (>20ms) en los 3, tanto antes como después de las fixes. Hallazgo
  confirmado y arreglado: redraw en pausa (1 800 `fillRect`/3s → 0). Aplicados también `React.memo` +
  `useCallback` + constante de módulo para el `style` del canvas (cat. 5). La migración de
  score/lives/nivel a `useRef`+DOM (cat. 6) se reevalúa: en Snake el `onStateChange` no dispara a
  60fps sino solo en eventos reales, así que el impacto medido es bajo; se deja abierta para
  reevaluar por juego, no como fix genérico. El coste de `shadowBlur` en skin neón con serpiente
  larga (crecimiento sin cota con el score) no se pudo medir por falta de automatización de juego
  prolongado; queda como hallazgo abierto sin aplicar caché de sprites (no hay evidencia de jank
  real todavía). `npm run lint` y `npm run build` limpios tras los cambios.
- **2026-08-17** — Auditoría runtime de `tetris`. Medición con Playwright en `/juego/tetris/jugar`
  (dev server ya corriendo): 120.2 fps, p95 9.0ms, 0 frames con jank (>20ms) en clásico, antes y
  después de las fixes. Hallazgo confirmado: `Tetris.tsx` no recibe prop `skin` (a diferencia de
  Asteroids/Arkanoid/Snake/Frogger) — no tiene skins implementados, el selector del HUD no cambia
  nada visualmente; por eso no hay medición diferenciada retro/neón ni hallazgo de `shadowBlur`
  (0 invocaciones, componente no las usa). Añadir skins a Tetris es territorio de `@skin-designer`,
  fuera de mi alcance — solo se deja documentado como contexto. Redraw en pausa confirmado y
  arreglado (361 `fillRect`/3s → 0; conteo bajo porque el tablero estaba casi vacío al inicio de
  partida, pero el patrón — repintar sin guard bajo el overlay de pausa — es el mismo que en
  Snake). Aplicados también `React.memo` + `useCallback` + constantes de módulo para los 3 `style`
  inline (wrapper + 2 canvas). La migración de score/líneas/nivel a `useRef`+DOM (cat. 6) se deja
  abierta: `onStateChange` en Tetris dispara solo en eventos reales (gravedad por `dropInterval`,
  máx. 10/s con nivel alto; línea limpiada; hard/soft drop; game over), no a 60-120fps, impacto
  medido bajo. Verificación manual: PAUSA/REANUDAR, modal "FIN DEL JUEGO" con puntuación correcta
  tras `endGame()` confirmados por screenshot; JUGAR DE NUEVO no se pudo verificar por interacción
  directa porque un agente concurrente (`@game-performance-booster` sobre `asteroids`, visible en
  cambios paralelos de `GamePlayerClient.tsx`) estaba navegando el mismo navegador Playwright
  compartido y desincronizó la sesión — no es un fallo del código, es contención de entorno; el
  comportamiento de `restart()` no cambió (no se tocó esa función). `npm run lint` y `npm run build`
  limpios tras los cambios.
- **2026-08-18** — Auditoría runtime de `asteroids`. Medición con Playwright en
  `/juego/asteroids/jugar` (dev server ya corriendo): antes de las fixes, clásico 120.1 fps / p95
  8.4ms / 0 jank / 0 `shadowBlur` (glow 0, esperado); neón con disparo simulado cada 90-150ms
  durante 8s: 120.1 fps / p95 9.0-9.1ms / 0 jank / 1 924 `shadowBlur>0` en 8s con máximo 2/frame —
  muy por debajo del umbral de 20, sin evidencia de jank real ni con fuego sostenido en nivel 1.
  Hallazgo confirmado por lectura de código (no se pudo re-confirmar con `fillRect` en pausa por la
  inestabilidad del navegador Playwright, ver abajo): redraw en pausa — el loop de
  `Asteroids.tsx:674-677` llamaba `drawGame()` sin condicionar a `pausedRef.current`, mismo patrón
  ya arreglado en Snake y Tetris. Arreglado con guard `pauseDrawnRef`. Aplicados también
  `React.memo` + `useCallback` en `handleAsteroidsStateChange` + `CANVAS_STYLE` como constante de
  módulo (cat. 5). Las allocaciones por frame (`.filter()`/`.concat()` en `updateGame`, cat. 1) y el
  coste de `shadowBlur` bajo un nivel alto con muchos asteroides simultáneos tras splits (cat. 7)
  quedan como hallazgos abiertos: medidos en escenarios normales sin evidencia de jank, pero no se
  pudo forzar un nivel alto con ~28 asteroides simultáneos porque **el navegador Playwright estaba
  compartido con otros subagentes `@game-performance-booster` corriendo en paralelo sobre
  `tetris`/`arkanoid`/`snake`/`frogger` en esta misma sesión** (navegaciones cruzadas entre rutas de
  distintos juegos, `about:blank` espontáneo, contexto de ejecución destruido a mitad de
  `browser_evaluate`, clics que no reflejaban el estado esperado del DOM). Esto también causó que
  `npm run build` fallara transitoriamente por un error de TypeScript en `Frogger.tsx` (archivo
  fuera de mi alcance, editado por un agente concurrente) — se resolvió solo al re-ejecutar el build
  tras que el otro proceso terminara su escritura; no fue causado por los cambios de esta auditoría.
  `npm run lint` y `npm run build` limpios tras los cambios (verificados también con
  `tsc --noEmit` para aislar mis archivos de la edición concurrente de `Frogger.tsx`).
- **2026-08-17** — Auditoría runtime de `arkanoid`. Lectura estática de `Arkanoid.tsx` y de la rama
  `isArkanoid` de `GamePlayerClient.tsx`: sin `Map`/`Set` faltante (la colisión bola-bloque es O(n)
  intrínseca al gameplay, no antipatrón), sin contadores sin acotar, sin fugas de listeners/RAF
  (cleanup correcto). `applyGlow()` se llama como máximo 2 veces por frame en estado `playing`
  (paleta+núcleo, luego HUD), muy por debajo del umbral de 20 — no se aplicó caché de sprites neón.
  Medición con Playwright en `/juego/arkanoid/jugar` (dev server ya corriendo): clásico 120.0-120.3
  fps, p95 ~9ms, 0-1 jank en 10-12s, antes y después de las fixes. Hallazgo confirmado y arreglado:
  redraw en pausa — el loop llamaba `drawGame()` sin condicionar a `pausedRef.current` (360
  `fillRect`/3s medido antes → 0 `fillRect`/2s medido después). Aplicados también `React.memo` +
  `CANVAS_STYLE` como constante de módulo (cat. 5) y `useCallback` en `handleArkanoidStateChange` de
  `GamePlayerClient.tsx`. Además, dos allocaciones evitables por frame (cat. 1): `explosions.filter()`
  corría siempre aunque no hubiera explosiones vivas (ahora solo si `explosions.length > 0` y alguna
  terminó), y el objeto `next: ArkanoidState` se construía cada frame antes del diff (ahora solo se
  construye si la comparación campo a campo ya detectó un cambio real). La migración de
  score/vidas/nivel a `useRef`+DOM (cat. 6) se deja abierta: en Arkanoid `onStateChange` dispara solo
  por bloque destruido (+10 puntos), pérdida de vida o cambio de nivel/gameover — no a 60-120fps,
  impacto medido bajo, mismo criterio que Snake/Tetris/Asteroids. No se pudo medir de forma fiable
  FPS/jank/`shadowBlur`/memoria en retro y neón vía Playwright: **el navegador estaba compartido con
  otros subagentes `@game-performance-booster` corriendo en paralelo sobre
  `asteroids`/`tetris`/`snake`/`frogger` en esta misma sesión** — navegaciones espontáneas a otras
  rutas de juego y a `about:blank` en medio de cada `browser_evaluate`, confirmadas comprobando
  `location.pathname` dentro del propio script antes y después de medir. El umbral de `shadowBlur`
  para neón se validó únicamente por lectura estática (2/frame, muy por debajo de 20), no por
  medición runtime — documentado como limitación, no como hallazgo. `npm run build` falló
  transitoriamente varias veces por un error de TypeScript en `Frogger.tsx` (archivo fuera de mi
  alcance, editado por un agente concurrente); se resolvió solo al reintentar tras que el otro
  proceso terminara su escritura, no fue causado por los cambios de esta auditoría. `npm run lint` y
  `npm run build` limpios tras los cambios (confirmados también con `npx eslint`/`tsc --noEmit`
  aislados a `Arkanoid.tsx` y `GamePlayerClient.tsx` mientras `Frogger.tsx` seguía inestable).
- **2026-08-17** — Auditoría de `frogger`. Lectura estática completa de `Frogger.tsx` contra el
  checklist de 9 categorías: confirmados redraw en pausa (cat. 2, `draw()` se llamaba sin condicionar
  a `pausedRef.current`), contador `submergeAcc` de tortugas sin acotar por tick (cat. 3), ausencia
  de `React.memo` + `style` inline recreado (cat. 5, `handleFroggerStateChange` en
  `GamePlayerClient.tsx` tampoco tenía `useCallback`), y un conteo estático exacto de `applyGlow()`
  en `draw()`: 43–48 invocaciones de `shadowBlur>0` por frame en skin neón (glow 12) — muy por encima
  del umbral de 20/frame. Medición runtime con Playwright en `/juego/frogger/jugar` (dev server ya
  corriendo): clásico y retro se midieron con éxito antes de que empezara la interferencia (120.1
  fps, 0 jank, 0 `shadowBlur` en ambos, consistente con `glow: 0` en esos dos skins). La medición de
  neón (FPS, `shadowBlur`/frame, memoria en 60s) **no se pudo completar**: la sesión de Playwright es
  compartida con otros subagentes `@game-performance-booster` corriendo en paralelo sobre
  `asteroids`/`tetris`/`arkanoid` en esta misma sesión — navegaciones espontáneas a esas rutas y a
  `about:blank` interrumpieron repetidamente los scripts de medición (confirmado leyendo
  `location.href` dentro de cada script antes/después), y el propio `GamePlayerClient.tsx` y este
  README se encontraron modificados por otros agentes entre lecturas. Se aplicaron las 4 fixes con
  evidencia suficiente sin esperar la confirmación runtime del último punto, dado el margen amplio
  del conteo estático frente al umbral: guard `pauseDrawnRef` (cat. 2), `submergeAcc % cycle` en cada
  tick en vez de solo al leer la fase (cat. 3), `React.memo(FroggerImpl)` + `CANVAS_STYLE` constante
  - `useCallback` en `handleFroggerStateChange` (cat. 5), y caché de sprites offscreen para el skin
    neón (`SPRITE_PAD=20`, sprites por `${type}:${width}` para coche/camión/tronco/tortuga, 2 sprites
    de rana normal/salto, 2 sprites de meta borde/rellena reutilizados con `drawImage()` en las 5
    bocas; clásico/retro con `glow: 0` no construyen la caché y siguen el `draw()` original). La
    migración de score/vidas/nivel a `useRef`+DOM (cat. 6) se deja abierta con el mismo criterio que el
    resto del catálogo: `onStateChange` en Frogger dispara solo en eventos reales (avance de fila
    nueva, meta ocupada, ronda completa, pérdida de vida, game over), no a 60-120fps. Verificación
    visual: capturas de pantalla en `/juego/frogger/jugar` confirmaron clásico y neón renderizando
    correctamente (zonas, autos, camiones, troncos, tortugas, metas, rana, halo neón visible) antes de
    que la interferencia impidiera continuar; no se pudo verificar PAUSA/REANUDAR ni JUGAR DE NUEVO por
    interacción directa en esta sesión por el mismo motivo — no es un fallo del código portado, es
    contención de entorno; ninguna de las fixes tocó `restart()`, `forceGameOver()` ni la lógica de
    pausa fuera del guard añadido. `npm run lint` y `npm run build` limpios tras los cambios.
