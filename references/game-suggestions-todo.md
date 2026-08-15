# TODO — Sugerencias de juegos para Arcade Vault

Memoria del agente `game-planner` (`.claude/agents/game-planner.md`). No edites las
filas de estado a mano sin actualizar también la ficha correspondiente.

Estados: `Sugerido` · `Aprobado` · `Portado` · `Descartado`

Siembra inicial: 2026-08-15, desde `references/implemented-games/README.md`.

| Juego       | id            | Categoría | Estado   | Fecha      | Spec |
| ----------- | ------------- | --------- | -------- | ---------- | ---- |
| ASTEROIDS   | `asteroids`   | SHOOTER   | Portado  | 2026-08-15 | 05   |
| TETRIS      | `tetris`      | PUZZLE    | Portado  | 2026-08-15 | 07   |
| ARKANOID    | `arkanoid`    | ARCADE    | Portado  | 2026-08-15 | 08   |
| SNAKE       | `snake`       | ARCADE    | Portado  | 2026-08-15 | 09   |
| DUELO PIXEL | `duelo-pixel` | VERSUS    | Sugerido | 2026-08-15 | —    |
| GLOTÓN      | `gloton`      | ARCADE    | Sugerido | 2026-08-15 | —    |
| INVASORES   | `invasores`   | SHOOTER   | Sugerido | 2026-08-15 | —    |
| RANARIA     | `ranaria`     | ARCADE    | Sugerido | 2026-08-15 | —    |

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
- **Mecánica / controles:** Pong local o contra CPU; paletas verticales, rebote con ángulo
  según punto de impacto.
- **Puntuación:** requiere decisión — el marcador natural de Pong es «primero a N», no un
  entero acumulativo. Opción: puntuar rallies sobrevividos o puntos anotados a la CPU antes
  de perder.
- **Assets / fuente:** sin fuente en `references/started-games/`; canvas puro, sin assets.
- **Riesgos:** el modelo de puntuación no encaja de forma directa con `scores`
  (`score` entero, mayor-es-mejor); el modo 2 jugadores locales no produce un leaderboard
  individual coherente.
- **Historial:** 2026-08-15 sembrado desde el catálogo existente (aún sin implementar).

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
- **Historial:** 2026-08-15 sembrado desde el catálogo existente (aún sin implementar).

### INVASORES (`invasores`) — Sugerido

- **Sugerido:** 2026-08-15
- **Por qué encaja:** ya en catálogo; puntuación acumulativa nativa y loop de dificultad
  media, muy cercano al patrón ya validado en Asteroids.
- **Mecánica / controles:** `←` `→` mover · `Espacio` disparar; formación que desciende.
- **Puntuación:** entero acumulativo por invasor destruido. Estado
  `{ score, lives, level, gameOver }` idéntico al contrato existente.
- **Assets / fuente:** sin fuente en `references/started-games/`; sprites sencillos.
- **Riesgos:** bajos; el nombre original es marca registrada — el catálogo usa `INVASORES`.
- **Historial:** 2026-08-15 sembrado desde el catálogo existente (aún sin implementar).

### RANARIA (`ranaria`) — Sugerido

- **Sugerido:** 2026-08-15
- **Por qué encaja:** ya en catálogo; Frogger genérico, aporta mecánica de timing y carriles
  en vez de disparo o grilla.
- **Mecánica / controles:** `↑` `↓` `←` `→` cruzando carriles de tráfico y troncos.
- **Puntuación:** entero acumulativo por avance y ranas salvadas.
- **Assets / fuente:** sin fuente en `references/started-games/`; sprites de vehículos y agua.
- **Riesgos:** colisiones por carril y plataformas móviles (la rana viaja con el tronco)
  añaden complejidad de física ligera.
- **Historial:** 2026-08-15 sembrado desde el catálogo existente (aún sin implementar).
