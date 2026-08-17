# TODO — Sugerencias de juegos para Arcade Vault

Memoria del agente `game-planner` (`.claude/agents/game-planner.md`). No edites las
filas de estado a mano sin actualizar también la ficha correspondiente.

Estados: `Sugerido` · `Aprobado` · `Portado` · `Descartado`

Siembra inicial: 2026-08-15, desde `references/implemented-games/README.md`.

| Juego            | id                 | Categoría | Estado     | Fecha      | Spec |
| ---------------- | ------------------ | --------- | ---------- | ---------- | ---- |
| ASTEROIDS        | `asteroids`        | SHOOTER   | Portado    | 2026-08-15 | 05   |
| TETRIS           | `tetris`           | PUZZLE    | Portado    | 2026-08-15 | 07   |
| ARKANOID         | `arkanoid`         | ARCADE    | Portado    | 2026-08-15 | 08   |
| SNAKE            | `snake`            | ARCADE    | Portado    | 2026-08-15 | 09   |
| INVASORES        | `invasores`        | SHOOTER   | Sugerido   | 2026-08-15 | —    |
| ESCUDO ORBITAL   | `escudo-orbital`   | SHOOTER   | Sugerido   | 2026-08-15 | —    |
| RANARIA          | `ranaria`          | ARCADE    | Sugerido   | 2026-08-15 | —    |
| GLOTÓN           | `gloton`           | ARCADE    | Sugerido   | 2026-08-15 | —    |
| DUELO PIXEL      | `duelo-pixel`      | VERSUS    | Sugerido   | 2026-08-15 | —    |
| ORUGA NEÓN       | `oruga-neon`       | SHOOTER   | Sugerido   | 2026-08-15 | —    |
| ENJAMBRE         | `enjambre`         | SHOOTER   | Sugerido   | 2026-08-15 | —    |
| SALTARÍN         | `saltarin`         | ARCADE    | Sugerido   | 2026-08-15 | —    |
| EXCAVADOR        | `excavador`        | ARCADE    | Sugerido   | 2026-08-15 | —    |
| TORRE BARRIL     | `torre-barril`     | ARCADE    | Sugerido   | 2026-08-15 | —    |
| BLOQUE POLAR     | `bloque-polar`     | ARCADE    | Sugerido   | 2026-08-15 | —    |
| FUSIÓN 2048      | `fusion-2048`      | PUZZLE    | Sugerido   | 2026-08-15 | —    |
| BURBUJAS         | `burbujas`         | PUZZLE    | Sugerido   | 2026-08-15 | —    |
| COLUMNAS         | `columnas`         | PUZZLE    | Sugerido   | 2026-08-15 | —    |
| GEMAS            | `gemas`            | PUZZLE    | Sugerido   | 2026-08-15 | —    |
| FUGA CROMO       | `fuga-cromo`       | ARCADE    | Sugerido   | 2026-08-15 | —    |
| CIRCUITO CERO    | `circuito-cero`    | ARCADE    | Sugerido   | 2026-08-15 | —    |
| PULSO NEÓN       | `pulso-neon`       | ARCADE    | Sugerido   | 2026-08-15 | —    |
| CAZA PÍXEL       | `caza-pixel`       | ARCADE    | Sugerido   | 2026-08-15 | —    |
| DECATLÓN VOLTIO  | `decatlon-voltio`  | ARCADE    | Sugerido   | 2026-08-15 | —    |
| TOPOS VOLTIO     | `topos-voltio`     | ARCADE    | Sugerido   | 2026-08-15 | —    |
| SOKOBAN          | `sokoban`          | PUZZLE    | Descartado | 2026-08-15 | —    |
| MINIGOLF ORBITAL | `minigolf-orbital` | ARCADE    | Descartado | 2026-08-15 | —    |

**Ranking vigente (pase de 20 candidatos, 2026-08-15, 5 sub-agentes en paralelo
por eje shooter / puzzle / plataformas-laberinto / deportes-versus-timing /
ritmo-carrera-varios):**

1. `invasores` (SHOOTER) — menor riesgo del lote completo, fila y cover ya existen.
2. `fusion-2048` (PUZZLE) — port más barato y seguro, cero assets, puntuación nativa.
3. `saltarin` (ARCADE) — cero assets, cero pathfinding, aporta eje isométrico/diagonal.
4. `duelo-pixel` (VERSUS) — re-evaluado: formato torneo resuelve el problema de
   puntuación que antes lo descartaba; cierra el único hueco de categoría (VERSUS=0)
   sin migración de catálogo.
5. `oruga-neon` (SHOOTER) — el que más aporta al mix del eje shooter (movilidad 2D,
   terreno destructible), sin assets.
6. `burbujas` (PUZZLE) — mejor juego del eje puzzle (apuntado + timing), coste medio-alto.
7. `ranaria` (ARCADE) — re-priorizado dentro del eje timing/carriles; fila y cover
   ya existen, único hueco real es el arte.
8. `excavador` (ARCADE) — terreno destructible, puntuación impecable, coste medio.
9. `fuga-cromo` (ARCADE) — primer juego con input de un solo botón, port barato.
10. `caza-pixel` (ARCADE) — mejor encaje puntuación↔scores del eje deportes, pero
    solapa con `escudo-orbital` (ambos pointer + olas); elegir uno.
11. `escudo-orbital` (SHOOTER) — primer input de puntero del Vault; baja un puesto
    por concentrar riesgo de input nuevo.
12. `columnas` (PUZZLE) — reutiliza el esqueleto de Tetris casi entero; barato pero
    redundante mecánicamente.
13. `circuito-cero` (ARCADE) — solapa con `ranaria` (ambos esquivar por carriles).
14. `torre-barril` (ARCADE) — único plataformas puro con gravedad; el más arriesgado
    técnicamente (física dependiente de framerate) y el más caro en assets.
15. `gemas` (PUZZLE) — aporta intercambio en vez de caída, pero arrastra decisiones
    de diseño no resueltas (condición de derrota, campo `lives` torcido).
16. `bloque-polar` (ARCADE) — mismo espacio de diseño que `saltarin`/`excavador` con
    menos identidad.
17. `enjambre` (SHOOTER) — casi duplicado de `invasores` en controles y fantasía;
    solo tiene sentido como alternativa excluyente, no sumado.
18. `decatlon-voltio` (ARCADE) — más variedad de input, pero el mayor coste de arte
    del lote (animación de personaje) y posible cambio de taxonomía.
19. `topos-voltio` (ARCADE) — mediocre como juego; plan B barato sin arte, no
    recomendado por encima de ningún otro candidato activo.
20. `pulso-neon` (ARCADE) — el más diferenciador, pero introduce audio y un reloj
    alterno al rAF; fuera del patrón validado, retomar más adelante.

`gloton` sigue `Sugerido` y despriorizado por complejidad de IA (sin cambios este
pase, no estaba en el alcance de ningún sub-agente). `sokoban` y `minigolf-orbital`
se evaluaron y se descartan: su métrica natural es "menos es mejor" (movimientos /
golpes), lo opuesto al contrato `scores` (entero, mayor-es-mejor).

**Nota de contexto:** el campo `color` de `lib/games.ts` es una unión cerrada
(`cyan | magenta | yellow | green`) y el catálogo ya reutiliza colores entre juegos
(`references/templates/data.jsx`). El eje «color de acento libre» no aplica en este
repo: hay que reutilizar uno de los cuatro.

## Fichas

### ASTEROIDS (`asteroids`) — Portado

- **Sugerido:** 2026-08-15 (registro retroactivo)
- **Por qué encaja:** primer port; define el patrón canvas + leaderboard real.
- **Mecánica / controles:** `←` `→` rotar · `↑` propulsión · `Espacio` disparar.
- **Puntuación:** 100 / 50 / 20 según tamaño del asteroide. Estado
  `{ score, lives, level, gameOver }`.
- **Assets / fuente:** `references/started-games/02-asteroids/`.
- **Riesgos:** ninguno pendiente.
- **Historial:** 2026-08-15 registrado como ya portado (spec 05).

### TETRIS (`tetris`) — Portado

- **Sugerido:** 2026-08-15 (registro retroactivo)
- **Por qué encaja:** cubre la categoría PUZZLE, la única sin representación previa.
- **Mecánica / controles:** `←` `→` mover · `↓` soft drop · `↑`/`X` rotar · `Espacio` hard drop.
- **Puntuación:** líneas 100/300/500/800 × nivel. Estado `{ score, lines, level, gameOver }`
  (sin vidas).
- **Assets / fuente:** `references/started-games/03-tetris/`, sin assets externos.
- **Riesgos:** ninguno pendiente.
- **Historial:** 2026-08-15 registrado como ya portado (spec 07).

### ARKANOID (`arkanoid`) — Portado

- **Sugerido:** 2026-08-15 (registro retroactivo)
- **Por qué encaja:** primer juego con spritesheet servido desde `public/games/`.
- **Mecánica / controles:** `←` `→` mover la paleta.
- **Puntuación:** +10 por bloque. Estado `{ score, lives, level, gameOver }`.
- **Assets / fuente:** `references/started-games/04-arkanoid/`, sprites en
  `public/games/arkanoid/`.
- **Riesgos:** ninguno pendiente.
- **Historial:** 2026-08-15 registrado como ya portado (spec 08).

### SNAKE (`snake`) — Portado

- **Sugerido:** 2026-08-15 (registro retroactivo)
- **Por qué encaja:** loop de grilla simple, port de bajo coste.
- **Mecánica / controles:** `↑` `↓` `←` `→`.
- **Puntuación:** +10 por fruta. Estado `{ score, lives, level, gameOver }` con `lives`
  binario (1 vivo / 0 game over).
- **Assets / fuente:** `public/snake-assets/fruits.png`.
- **Riesgos:** ninguno pendiente.
- **Historial:** 2026-08-15 registrado como ya portado (spec 09).

### DUELO PIXEL (`duelo-pixel`) — Sugerido

- **Sugerido:** 2026-08-15
- **Por qué encaja:** ya está en el catálogo de `games` con datos ficticios y es la
  **única entrada VERSUS**; portarlo cierra el hueco de categoría.
- **Mecánica / controles:** Pong genérico contra CPU en formato torneo. Set a 11 puntos; al
  ganar un set, la CPU sube de nivel (más velocidad de paleta, menos error de predicción,
  saque más rápido) y empieza otro set. El jugador continúa hasta perder un set. `↑` `↓`
  mover paleta; ángulo de rebote según punto de impacto.
- **Puntuación (resuelto en el pase de 20 candidatos):** `score` = puntos anotados a la CPU
  acumulados a lo largo de todos los sets × multiplicador de nivel de CPU (nivel 1 ×1, nivel
  2 ×2…) + 500 por set ganado. Entero, acumulativo, mayor-es-mejor, sin conversión artificial.
  `DueloPixelState = { score, lives, level, gameOver }` con `lives` = puntos que le quedan al
  jugador antes de perder el set (11 − puntos CPU) y `level` = nivel de CPU.
- **Assets / fuente:** sin fuente en `references/started-games/`; canvas puro (dos rectángulos,
  un cuadrado, línea de red), sin assets. Fila ya existe en `games` — sin migración de catálogo.
- **Riesgos:** bajos, los de siempre (paletas/pelota/marcador en un único `useRef`;
  `preventDefault` en `↑`/`↓`, removido al desmontar; `cancelAnimationFrame`). Riesgo propio:
  el saque tras cada punto no debe reanudarse por tecla, usa temporizador interno. La CPU no
  puede ser perfecta — capar su velocidad por nivel o la partida se vuelve infinita.
- **Historial:** 2026-08-15 sembrado desde el catálogo existente (aún sin implementar) ·
  2026-08-15 **despriorizado** pese a ser el único hueco de categoría (VERSUS = 0 implementados);
  el marcador «primero a N» no encajaba con `scores`. · 2026-08-15 **re-propuesto y
  repriorizado al nº 4** en el pase de 20 candidatos: el formato torneo resuelve el problema de
  puntuación sin dejar de ser VERSUS; único candidato del lote sin migración de catálogo.

### GLOTÓN (`gloton`) — Sugerido

- **Sugerido:** 2026-08-15
- **Por qué encaja:** ya en catálogo; Pac-Man genérico, puntuación acumulativa nativa.
- **Mecánica / controles:** `↑` `↓` `←` `→` por un laberinto comiendo puntos, esquivando
  fantasmas.
- **Puntuación:** entero acumulativo (puntos, power-pellets, fantasmas). Encaja directo con
  `scores`.
- **Assets / fuente:** sin fuente en `references/started-games/`; necesitaría sprites y
  definición de laberinto.
- **Riesgos:** IA de fantasmas y pathfinding es el loop más complejo del catálogo hasta ahora;
  nombre original es marca registrada — el catálogo ya usa el alias `GLOTÓN`.
- **Historial:** 2026-08-15 sembrado desde el catálogo existente (aún sin implementar) ·
  2026-08-15 **despriorizado** en el pase de priorización: la puntuación encaja perfecto, pero
  IA de 4 fantasmas + laberinto + power-pellets es un salto de complejidad grande frente a
  cualquier port hecho hasta ahora. Buen candidato, mal momento; retomar después de que el
  patrón se haya validado en un quinto juego.

### INVASORES (`invasores`) — Sugerido

- **Sugerido:** 2026-08-15
- **Por qué encaja:** ya en catálogo; puntuación acumulativa nativa y loop de dificultad
  media, muy cercano al patrón ya validado en Asteroids.
- **Mecánica / controles:** `←` `→` mover · `Espacio` disparar; formación que desciende.
- **Puntuación:** entero acumulativo por invasor destruido. Estado
  `{ score, lives, level, gameOver }` idéntico al contrato existente.
- **Assets / fuente:** sin fuente en `references/started-games/`; sprites sencillos.
- **Riesgos:** bajos; el nombre original es marca registrada — el catálogo usa `INVASORES`.
  Riesgos concretos contra el contrato: la formación completa debe vivir en un único
  `useRef` (no un array en `useState`); el disparo con `Espacio` necesita `preventDefault`
  para no hacer scroll y debe removerse al desmontar; nada de reinicio de ola por tecla.
- **Historial:** 2026-08-15 sembrado desde el catálogo existente (aún sin implementar) ·
  2026-08-15 **priorizado como recomendación nº 1** en el pase de priorización: es el único
  candidato cuyo `XState` mapea 1:1 con el contrato ya validado y cuya fila ya existe en
  `games` (color `green`, cover `cover-invaders`).

### RANARIA (`ranaria`) — Sugerido

- **Sugerido:** 2026-08-15
- **Por qué encaja:** ya en catálogo; Frogger genérico, aporta mecánica de timing y carriles
  en vez de disparo o grilla.
- **Mecánica / controles:** `↑` `↓` `←` `→` cruzando carriles de tráfico y troncos.
- **Puntuación:** entero acumulativo por avance y ranas salvadas.
- **Assets / fuente:** sin fuente en `references/started-games/`; sprites de vehículos y agua.
- **Riesgos:** colisiones por carril y plataformas móviles (la rana viaja con el tronco)
  añaden complejidad de física ligera.
- **Historial:** 2026-08-15 sembrado desde el catálogo existente (aún sin implementar) ·
  2026-08-15 priorizado como candidato nº 3: aporta la mecánica de timing/carriles que falta,
  pero cuesta más que `invasores` y necesita sprites nuevos en `public/games/` · 2026-08-15
  **re-propuesto y repriorizado al nº 7** en el pase de 20 candidatos: dentro del eje
  carriles/timing sigue siendo el mejor candidato objetivo; fila y cover ya existen, el único
  hueco real es el arte.

### ESCUDO ORBITAL (`escudo-orbital`) — Sugerido

- **Sugerido:** 2026-08-15
- **Por qué encaja:** clon genérico de Missile Command. Sería el **primer juego del Vault con
  input de puntero**: todos los ports actuales son teclado direccional. Rompe la monotonía de
  input sin salirse de la estética vectorial ya dominada en Asteroids.
- **Mecánica / controles:** lluvia de misiles enemigos cae sobre 6 ciudades. El jugador mueve
  la mira con el ratón y hace clic para lanzar un interceptor que detona en el punto marcado;
  la explosión encadena los misiles que toca. Ola siguiente = más misiles y más rápidos.
- **Puntuación:** +25 por misil interceptado × multiplicador de ola, +100 por cada ciudad
  superviviente al cerrar la ola. Entero acumulativo, mayor-es-mejor, sin conversión forzada.
  `EscudoOrbitalState = { score, lives, level, gameOver }` con `lives` = ciudades en pie y
  `level` = ola.
- **Assets / fuente:** ninguna fuente en `references/started-games/`. **No requiere assets**:
  líneas, arcos y partículas dibujados con primitivas de canvas, igual que Asteroids. Sí
  requiere una fila nueva en `games` (color reutilizado `magenta`) y un cover.
- **Riesgos:** (a) es el único candidato con listeners de puntero — `pointermove`/`pointerdown`
  sobre el canvas, hay que convertir coordenadas con `getBoundingClientRect()` porque el canvas
  se escala por CSS, y removerlos en el cleanup; (b) ocultar el cursor nativo sobre el canvas
  y restaurarlo al desmontar; (c) la detonación en cadena debe resolverse dentro del mismo tick
  del `requestAnimationFrame` para no acumular estado inconsistente entre frames; (d) no existe
  fila en `games` todavía, así que el port arrastra una migración de catálogo.
- **Historial:** 2026-08-15 sugerido (candidato nº 2, propuesta nueva del pase de priorización)
  · 2026-08-15 re-evaluado en el pase de 20 candidatos, baja al nº 11: concentra el riesgo de
  estrenar input de puntero antes de que el patrón tenga más kilometraje; mejor después de
  `invasores` u `oruga-neon`. Solapa con `caza-pixel` (ambos pointer + olas) — elegir uno.

### ORUGA NEÓN (`oruga-neon`) — Sugerido

- **Sugerido:** 2026-08-15
- **Por qué encaja:** clon genérico de Centipede. El que más aporta al mix del eje shooter:
  único con movilidad 2D del jugador y terreno destructible que altera la partida.
- **Mecánica / controles:** oruga segmentada que serpentea descendiendo por un campo de
  hongos; al recibir un impacto se parte en dos y el segmento golpeado se convierte en hongo.
  Jugador libre en banda inferior, arañas y pulgas hostigan. `↑` `↓` `←` `→` mover ·
  `Espacio` disparar.
- **Puntuación:** entero acumulativo — 1 por segmento de cuerpo, 100 por cabeza, 5 por hongo
  destruido, 300–900 por araña según distancia. `OrugaState = { score, lives, level, gameOver }`,
  `level` = oleada.
- **Assets / fuente:** sin fuente; sin assets externos, primitivas de canvas (segmentos, hongos,
  bichos como rects/arcos). Requiere fila nueva en `games` (color `cyan`) + `.cover-oruga`.
- **Riesgos:** la división de la oruga debe reindexar la lista de segmentos dentro del mismo
  tick de rAF, nunca por efectos encadenados; el campo de hongos es una grilla mutable en
  `useRef` que `restart()` debe regenerar entera; 5 teclas con `preventDefault` removidas al
  desmontar; sin auto-reinicio por tecla.
- **Historial:** 2026-08-15 propuesto en el pase de 20 candidatos, priorizado nº 5.

### ENJAMBRE (`enjambre`) — Sugerido

- **Sugerido:** 2026-08-15
- **Por qué encaja:** clon genérico de Galaga/Galaxian; solo tiene sentido como alternativa
  excluyente a `invasores`, no sumado — comparte controles, silueta y fantasía casi exactas.
- **Mecánica / controles:** enemigos entran con trayectorias curvas, se ensamblan en formación
  y lanzan picados individuales; un enemigo especial puede capturar la nave, abatirlo la
  recupera con nave doble. `←` `→` mover · `Espacio` disparar.
- **Puntuación:** entero acumulativo — valor base por enemigo, duplicado si se abate en picado,
  bonus de ola perfecta. `EnjambreState = { score, lives, level, gameOver }`.
- **Assets / fuente:** sin fuente; sprites sencillos, pero necesita paths de entrada (curvas
  Bézier o tablas por ola) — contenido de diseño, no solo código.
- **Riesgos:** máquina de estados por enemigo (`entrando`/`en formación`/`picando`/`volviendo`)
  es bastante más estado por entidad que cualquier port actual, todo en un `useRef`; la
  captura de nave complica `restart()` y `forceGameOver()`.
- **Historial:** 2026-08-15 propuesto y despriorizado en el mismo pase (nº 17): duplicado caro
  frente a `invasores` si ambos entran al catálogo.

### SALTARÍN (`saltarin`) — Sugerido

- **Sugerido:** 2026-08-15
- **Por qué encaja:** clon genérico de Q\*bert. Cero assets, cero pathfinding — port de menor
  coste del eje plataformas/laberinto y el único isométrico del Vault.
- **Mecánica / controles:** pirámide isométrica de 28 cubos; el jugador salta en diagonal
  cambiando el color de cada cara. Enemigos bajan con saltos aleatorios (sin perseguir).
  `↑` `↓` `←` `→` mapeadas a las 4 diagonales isométricas.
- **Puntuación:** +25 por cubo cambiado, +50 por enemigo eliminado con disco, +1000 por nivel
  completo. `SaltarinState = { score, lives, level, gameOver }`, 3 vidas.
- **Assets / fuente:** sin fuente; sin sprites — cubos con `fillPath` (3 paralelogramos),
  jugador/enemigos como círculos. Fila nueva en `games` (color `magenta`) + cover.
- **Riesgos:** modelo por saltos discretos con animación interpolada — el `hopProgress` va en
  el mismo `useRef` del estado o los frames se desincronizan; conversión `(fila,col)` → píxel
  isométrico debe ser función pura, no duplicada en colisiones; sin auto-reinicio por tecla.
- **Historial:** 2026-08-15 propuesto en el pase de 20 candidatos, priorizado nº 3 — mejor
  coste/beneficio de todo el lote junto con `fusion-2048`.

### EXCAVADOR (`excavador`) — Sugerido

- **Sugerido:** 2026-08-15
- **Por qué encaja:** clon genérico de Dig Dug. Terreno destructible por el propio jugador,
  arma no letal por carga, puntuación impecable.
- **Mecánica / controles:** excava túneles en una grilla de tierra de 4 estratos; enemigos
  patrullan y atraviesan tierra en modo fantasma. Se eliminan inflándolos con bomba de aire o
  con una roca. `↑` `↓` `←` `→` mover/excavar · `Espacio` mantenido = bombear.
- **Puntuación:** por enemigo según profundidad (200/300/400/500), bonus por 2+ aplastados con
  la misma roca, bonus de verdura. `ExcavadorState = { score, lives, level, gameOver }`.
- **Assets / fuente:** sin fuente; sprites sencillos en `public/games/excavador/` o versión
  vectorial. Fila nueva en `games` (color `yellow`) + cover.
- **Riesgos:** terreno destructible como `Uint8Array` en `useRef`, con canvas de fondo cacheado
  (repintar celda a celda cada frame mata el framerate); enemigo fantasma debe realinearse a
  celda al re-materializarse; `keydown`/`keyup` de la bomba deben emparejarse y limpiarse al
  desmontar; física de la roca resuelta en el mismo tick de rAF.
- **Historial:** 2026-08-15 propuesto en el pase de 20 candidatos, priorizado nº 8.

### TORRE BARRIL (`torre-barril`) — Sugerido

- **Sugerido:** 2026-08-15
- **Por qué encaja:** clon genérico de Donkey Kong. Único plataformas puro con gravedad del
  Vault — el que más aporta al mix del eje, pero también el más arriesgado.
- **Mecánica / controles:** 4 niveles de andamios inclinados con escaleras; un antagonista
  arroja barriles que ruedan y bajan; el jugador sube saltando barriles con martillo temporal.
  `←` `→` correr · `↑` `↓` subir/bajar escalera · `Espacio` saltar.
- **Puntuación:** +100 por barril saltado, +300/500/800 por barril destruido con martillo,
  bonus decreciente por tiempo al coronar. `TorreBarrilState = { score, lives, level, gameOver }`.
- **Assets / fuente:** sin fuente; **el más caro en assets del lote** — spritesheet con
  animación de carrera/salto/escalera/martillo (~8-12 frames) + layout de 4 pantallas. Fila
  nueva en `games` (color `cyan`) + cover.
- **Riesgos:** único candidato con gravedad y colisión con plataformas inclinadas — el paso de
  integración debe fijarse al delta de rAF o el salto varía entre 60/120 Hz; transición
  suelo↔escalera es fuente clásica de bugs de atravesar plataformas; máquina de estados del
  jugador (`running`/`jumping`/`climbing`/`hammer`) entera en `useRef`.
- **Historial:** 2026-08-15 propuesto en el pase de 20 candidatos, priorizado nº 14 —
  recomendable solo si se busca específicamente plataformas con gravedad y se acepta un spec
  grande.

### BLOQUE POLAR (`bloque-polar`) — Sugerido

- **Sugerido:** 2026-08-15
- **Por qué encaja:** clon genérico de Pengo. Barato y con puntuación nativa, pero mismo
  espacio de diseño que `saltarin`/`excavador` con menos identidad visual.
- **Mecánica / controles:** laberinto de bloques de hielo sobre grilla; el jugador empuja
  bloques que se deslizan hasta chocar, aplastando enemigos, o los rompe. Bonus por alinear
  los tres bloques de diamante. `↑` `↓` `←` `→` mover · `Espacio` empujar/romper.
- **Puntuación:** +400 por enemigo aplastado (escalado si son varios de un empujón), +5000
  por alinear diamantes, bonus de tiempo. `BloquePolarState = { score, lives, level, gameOver }`.
- **Assets / fuente:** sin fuente; sin assets — bloques y enemigos como rects con degradado,
  laberinto generado por semilla. Fila nueva en `games` (color `green`) + cover.
- **Riesgos:** deslizamiento del bloque resuelto por celdas en un tick lógico mientras se anima
  en varios frames (riesgo de aplastar enemigos a mitad de recorrido); grilla mutada por dos
  actores (jugador y enemigos rompiendo bloques) exige ordenar fases del tick; generación de
  laberinto debe validarse para no encerrar enemigos sin solución.
- **Historial:** 2026-08-15 propuesto y despriorizado en el mismo pase (nº 16): pierde sentido
  si `saltarin` o `excavador` salen adelante.

### FUSIÓN 2048 (`fusion-2048`) — Sugerido

- **Sugerido:** 2026-08-15
- **Por qué encaja:** el port más barato y seguro de los 20 candidatos. Cero assets, puntuación
  canónica ya entera y acumulativa, primer juego por turnos del Vault.
- **Mecánica / controles:** tablero 4×4; cada pulsación desliza todas las fichas, dos fichas
  iguales que colisionan se fusionan en su doble, aparece ficha nueva tras cada movimiento
  válido. `↑` `↓` `←` `→`, un movimiento por pulsación (ignorar auto-repeat del SO).
- **Puntuación:** `score += valor de cada ficha resultante de una fusión` — nativa, sin
  conversión. `Fusion2048State = { score, lives, level, gameOver }`, `lives` binario (1/0,
  precedente Snake), `level = log2(ficha máxima)`.
- **Assets / fuente:** sin fuente; cero assets — celdas redondeadas + números con fuentes ya
  cargadas. Fila nueva en `games` (color `cyan`) + cover.
- **Riesgos:** es turn-based, no continuo — el rAF solo anima, la lógica avanza en `keydown`;
  hay que decidir si `paused` congela la animación y bloquea input (único juego donde `paused`
  no es trivial). `preventDefault` en flechas obligatorio; sin auto-reinicio por tecla; tablero
  y score en un único `useRef`.
- **Historial:** 2026-08-15 propuesto en el pase de 20 candidatos, priorizado nº 2 — mejor
  coste/beneficio del eje puzzle.

### BURBUJAS (`burbujas`) — Sugerido

- **Sugerido:** 2026-08-15
- **Por qué encaja:** clon genérico de Puzzle Bobble/Bust-a-Move. El mejor juego del eje
  puzzle: único que aporta apuntado y timing en vez de otra grilla con gravedad.
- **Mecánica / controles:** cañón fijo dispara burbujas de color contra un racimo colgado en
  grilla hexagonal; grupo de 3+ del mismo color revienta, las desconectadas del techo caen
  (bonus). El techo desciende cada N disparos. `←` `→` apuntar · `Espacio` disparar.
- **Puntuación:** +10 por burbuja reventada, +20 por burbuja caída por desconexión, ×
  multiplicador de nivel. `BurbujasState = { score, lives, level, gameOver }`, `level` = fila
  de techo actual.
- **Assets / fuente:** sin fuente; sin assets bitmap — círculos con gradiente radial. Fila
  nueva en `games` (color `yellow`) + cover.
- **Riesgos:** grilla hexagonal con offset alterno por fila y conversión posición-libre→celda
  de anclaje es el riesgo principal; dos flood-fills por disparo (grupo de color + conectividad
  al techo) deben resolverse en el mismo tick de rAF; rebote en paredes con sub-steps para
  evitar tunneling.
- **Historial:** 2026-08-15 propuesto en el pase de 20 candidatos, priorizado nº 6 — el mejor
  juego del eje puzzle, coste medio-alto.

### COLUMNAS (`columnas`) — Sugerido

- **Sugerido:** 2026-08-15
- **Por qué encaja:** clon genérico de Columns. Reutiliza el esqueleto de `references/started-games/03-tetris/`
  casi entero; barato pero redundante con Tetris ya portado.
- **Mecánica / controles:** columna de 3 gemas cae; se puede ciclar el orden de colores
  mientras cae. Alineación de 3+ en horizontal/vertical/diagonal desaparece, con cascadas.
  `←` `→` mover · `↓` soft drop · `↑` ciclar colores · `Espacio` hard drop.
- **Puntuación:** +50 por gema × nivel, multiplicador creciente por cascada.
  `ColumnasState = { score, gems, level, gameOver }` — mismo molde que `TetrisState`, sin vidas.
- **Assets / fuente:** `references/started-games/03-tetris/` reutilizable como esqueleto
  (grilla, gravedad, lock delay, colisión). Sin assets bitmap. Fila nueva en `games`
  (color `green`) + cover.
- **Riesgos:** detección de matches en 4 direcciones (incluida diagonal) debe ser barrido
  completo del tablero, no incremental; cascadas exigen un mini-estado `resolving` que bloquee
  movimiento y reinicie el multiplicador por pieza; riesgo de copiar-pegar `Tetris.tsx` sin
  adaptar `lines`/`level`.
- **Historial:** 2026-08-15 propuesto en el pase de 20 candidatos, priorizado nº 12 — barato
  por reutilizar Tetris, pero el usuario lo percibirá como "Tetris de colores".

### GEMAS (`gemas`) — Sugerido

- **Sugerido:** 2026-08-15
- **Por qué encaja:** clon genérico de Bejeweled. Primer puzzle de intercambio en vez de
  caída, pero arrastra decisiones de diseño sin resolver.
- **Mecánica / controles:** tablero 8×8; intercambiar dos gemas adyacentes es válido solo si
  forma línea de 3+; las eliminadas caen y rellenan, con cascadas. `↑` `↓` `←` `→` mueve
  cursor · `Espacio` selecciona/confirma swap.
- **Puntuación:** +30 por gema × multiplicador de cascada.
  `GemasState = { score, lives, level, gameOver }`, `lives` = movimientos restantes,
  `level` = objetivo de puntos alcanzado.
- **Assets / fuente:** sin fuente; sin assets si las gemas son polígonos de color (distinguir
  también por forma, no solo color, por accesibilidad). Fila nueva en `games`
  (color `magenta`, compartido con Tetris) + cover.
- **Riesgos:** el juego no tiene derrota natural — hay que imponer límite de movimientos (
  recomendado) o cronómetro para que `gameOver` exista; generación inicial debe garantizar
  cero matches preexistentes y al menos un movimiento válido, con rebarajado si no lo hay;
  `lives` = "movimientos restantes" es un uso torcido del campo (HUD confuso: "VIDAS: 27").
- **Historial:** 2026-08-15 propuesto en el pase de 20 candidatos, priorizado nº 15 — si se
  aprueba, debe fijarse ya la variante de límite de movimientos.

### FUGA CROMO (`fuga-cromo`) — Sugerido

- **Sugerido:** 2026-08-15
- **Por qué encaja:** endless runner lateral. Primer juego del Vault con esencialmente un
  botón, mejor encaje puntuación↔`scores` del eje ritmo/carrera, port barato.
- **Mecánica / controles:** corredor avanza a velocidad creciente por un skyline neón,
  obstáculos generados proceduralmente (vallas bajas = saltar, drones altos = deslizarse).
  Un solo golpe termina la partida, sin vidas. `Espacio`/`↑` saltar · `↓` deslizarse.
- **Puntuación:** `score` = metros recorridos (+1 por unidad de distancia) + 50 por fragmento
  de datos recogido. `FugaCromoState = { score, lives, level, gameOver }`, `lives` binario
  (1/0, precedente Snake), `level` = tramo de velocidad.
- **Assets / fuente:** sin fuente; cero assets obligatorios — parallax de rects y corredor
  como cápsula animada. Fila nueva en `games` (color `cyan`) + cover.
- **Riesgos:** velocidad creciente exige integrar con delta de tiempo dentro del rAF (los
  ports actuales de tick fijo esquivan esto, aquí no se puede); generador de obstáculos debe
  garantizar separación mínima jugable o produce muertes imposibles; reciclar obstáculos
  fuera de pantalla en el array del `useRef` para no crecer sin límite.
- **Historial:** 2026-08-15 propuesto en el pase de 20 candidatos, priorizado nº 9.

### CIRCUITO CERO (`circuito-cero`) — Sugerido

- **Sugerido:** 2026-08-15
- **Por qué encaja:** carrera top-down con scroll vertical. Aporta el eje «carrera» ausente,
  pero solapa con `ranaria` (ambos esquivar por carriles con scroll).
- **Mecánica / controles:** pista que se estrecha y curva; rivales de IA simple cambian de
  carril; rozar rival o muro pierde velocidad y una vida. Cronómetro por sector.
  `←` `→` dirigir · `↑` acelerar · `↓` frenar.
- **Puntuación:** +100 por rival adelantado, +1 por unidad de distancia, +500 por checkpoint.
  `CircuitoCeroState = { score, lives, level, gameOver }`, `level` = sector. El tiempo de
  vuelta (menor-es-mejor) queda deliberadamente fuera del `score`.
- **Assets / fuente:** sin fuente; coches como rects con luces, asfalto dibujado. Sin assets
  obligatorios. Fila nueva en `games` (color `yellow`) + cover.
- **Riesgos:** hay que restringirse a movimiento lateral por carriles + velocidad escalar —
  física de deriva real lo volvería el port más caro del catálogo; scroll de pista curva exige
  generar el trazado por procedimiento; `↑`/`↓` sostenidas necesitan `keydown`/`keyup` y
  `preventDefault` limpiados al desmontar.
- **Historial:** 2026-08-15 propuesto en el pase de 20 candidatos, priorizado nº 13 — pierde
  buena parte de su razón de ser si `ranaria` entra primero.

### PULSO NEÓN (`pulso-neon`) — Sugerido

- **Sugerido:** 2026-08-15
- **Por qué encaja:** juego de ritmo de 4 carriles. El más diferenciador de los 20, pero
  introduce audio y un reloj alterno al rAF — fuera del patrón validado.
- **Mecánica / controles:** notas caen por 4 carriles verticales hacia una línea de impacto;
  acertar el instante da PERFECTO/BIEN/FALLO, combo multiplicador que se rompe al fallar,
  barra de energía que baja con fallos. `D` `F` `J` `K` (o flechas), un carril por tecla.
- **Puntuación:** 300 PERFECTO / 100 BIEN × multiplicador de combo.
  `PulsoNeonState = { score, lives, level, gameOver }`, `lives` = energía discretizada,
  `level` = pista. No existe categoría RITMO en `lib/app-data.ts` — entraría como ARCADE.
- **Assets / fuente:** **único candidato con requisito de audio nuevo**: pista musical libre
  de derechos + chart (JSON de timestamps) autorado a mano; nada así existe en `references/`.
  Fila nueva en `games` (color `magenta`) + cover.
- **Riesgos:** el timing no puede depender de rAF — requiere `AudioContext.currentTime` como
  reloj maestro, desviación real del patrón validado; autoplay de audio bloqueado hasta
  interacción del usuario; `paused` debe suspender/reanudar el `AudioContext` sin
  desincronizar; cerrarlo en cleanup o quedan instancias vivas al navegar; latencia de audio
  distinta por dispositivo hace discutible un leaderboard global comparable sin calibración.
- **Historial:** 2026-08-15 propuesto y despriorizado en el mismo pase (nº 20): retomar cuando
  el patrón esté validado en más juegos y exista una pista con licencia clara.

### CAZA PÍXEL (`caza-pixel`) — Sugerido

- **Sugerido:** 2026-08-15
- **Por qué encaja:** clon genérico de Duck Hunt. Mejor encaje puntuación↔`scores` del eje
  deportes/versus, pero solapa con `escudo-orbital` (ambos pointer + olas).
- **Mecánica / controles:** siluetas voladoras entran por los bordes en zigzag y salen tras
  unos segundos; cargador de 3 tiros por tanda, olas con más velocidad y blancos simultáneos.
  Puntero: `pointermove` mira, `pointerdown` dispara. Sin teclado.
- **Puntuación:** +100 por blanco × multiplicador de ola, +50 por bala no gastada al cerrar
  tanda, +1000 por tanda perfecta. `CazaPixelState = { score, lives, level, gameOver }`,
  `lives` = fallos permitidos restantes, `level` = ola.
- **Assets / fuente:** sin fuente; primitivas de canvas posibles pero pobres — realista un
  spritesheet nuevo en `public/games/caza-pixel/`. Fila nueva en `games` (color `cyan`) + cover.
- **Riesgos:** conversión de coordenadas con `getBoundingClientRect()` (canvas escalado por
  CSS), mismo riesgo que `escudo-orbital`; ocultar/restaurar cursor nativo; `pointerdown` con
  `preventDefault` removido en cleanup; el disparo se evalúa contra el frame actual, no el
  siguiente tick.
- **Historial:** 2026-08-15 propuesto en el pase de 20 candidatos, priorizado nº 10 — sube a
  nº 1 del eje deportes si se descarta `escudo-orbital`.

### DECATLÓN VOLTIO (`decatlon-voltio`) — Sugerido

- **Sugerido:** 2026-08-15
- **Por qué encaja:** clon genérico de Track & Field. El que más variedad de input real aporta
  (cadencia alternada + ángulo), pero el mayor coste de arte del lote.
- **Mecánica / controles:** 3–4 pruebas encadenadas (sprint, salto de longitud, jabalina) con
  marca mínima por prueba. `Z`/`X` alternadas para velocidad · `Espacio` ángulo/salto.
- **Puntuación:** puntos por marca al estilo tabla de decatlón, acumulados entre pruebas +
  bono por récord de prueba. `DecatlonState = { score, lives, level, gameOver }`,
  `lives` = intentos restantes, `level` = prueba actual.
- **Assets / fuente:** sin fuente; necesita spritesheet con animación de atleta corriendo —
  ningún juego del Vault tiene animación de personaje hoy. Fila nueva en `games`
  (color `yellow`) + cover; posible cambio de taxonomía si se crea categoría DEPORTES.
- **Riesgos:** el mash de teclas genera `keydown` con auto-repeat del SO — hay que ignorar
  repeticiones (`event.repeat`) o el juego se puede "hacer trampa" manteniendo la tecla;
  máquina de estados por prueba entera en `useRef`; cambio de categoría arrastra
  `lib/app-data.ts` + valores de `category` en Supabase + filtro de `/biblioteca`.
- **Historial:** 2026-08-15 propuesto en el pase de 20 candidatos, priorizado nº 18 —
  candidato de "cuando haya presupuesto de assets", no de ahora.

### TOPOS VOLTIO (`topos-voltio`) — Sugerido

- **Sugerido:** 2026-08-15
- **Por qué encaja:** whack-a-mole genérico. Port muy barato, pero honestamente mediocre como
  juego — plan B de sesión corta sin arte, no recomendado por encima de otros candidatos.
- **Mecánica / controles:** grilla 3×3/4×3 de agujeros; objetivos emergen con ventana de
  tiempo decreciente, objetivos-trampa restan si se golpean. Partida a 60s con bonus de racha.
  Puntero (clic) o teclas `1`–`9` como alternativa sin ratón.
- **Puntuación:** +50 por acierto × multiplicador de racha, −100 por trampa, +25 por segundo
  sobrante (suelo en 0). `ToposState = { score, lives, level, gameOver }`, `lives` = trampas
  permitidas, `level` = tramo de dificultad.
- **Assets / fuente:** sin fuente; cero assets obligatorios — círculos, sombras y temporizador
  con primitivas. Fila nueva en `games` (color `magenta`) + cover.
- **Riesgos:** bajos — los de siempre (`pointerdown` con cleanup, `getBoundingClientRect()`,
  grilla en `useRef`). Riesgo propio: partida a contrarreloj, `paused` debe congelar el
  temporizador de verdad o el juego es injusto y rompe la expectativa del botón PAUSA.
- **Historial:** 2026-08-15 propuesto en el pase de 20 candidatos, priorizado nº 19 — plan B
  barato, no recomendado por encima de ningún otro candidato activo.

### SOKOBAN (`sokoban`) — Descartado

- **Sugerido:** 2026-08-15
- **Por qué se descarta:** su métrica natural es "menos movimientos = mejor", exactamente lo
  opuesto al contrato de `scores` (`score` entero, mayor-es-mejor). Convertirlo (`puntos = par
− movimientos` o "niveles resueltos") es posible pero deshonesto: el leaderboard dejaría de
  medir lo que el juego mide.
- **Historial:** 2026-08-15 evaluado y descartado en el pase de 20 candidatos, eje puzzle.
  Mismo motivo que despriorizó a `duelo-pixel` antes de su re-propuesta con formato torneo.

### MINIGOLF ORBITAL (`minigolf-orbital`) — Descartado

- **Sugerido:** 2026-08-15
- **Por qué se descarta:** arrastre con puntero para fijar dirección y fuerza es un input
  atractivo y nuevo, pero su métrica natural son golpes — menos es mejor. Invertir el marcador
  o puntuar "par menos golpes" produce enteros artificiales que ningún jugador de minigolf
  reconoce, y exige número fijo de hoyos para que las filas sean comparables.
- **Historial:** 2026-08-15 evaluado y descartado en el pase de 20 candidatos, eje
  ritmo/carrera/varios. No pasa el filtro de puntuación honesta.
