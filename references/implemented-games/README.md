# Juegos implementados — Arcade Vault

Inventario de los juegos **jugables** (portados a canvas + leaderboard real en Supabase).
Última actualización: 2026-08-17.

El catálogo de la tabla `games` tiene 9 filas, pero solo 5 tienen implementación real.
Las otras 4 (`duelo-pixel`, `gloton`, `invasores`, `ranaria`) son entradas de catálogo con
datos ficticios: aparecen en `/biblioteca` y `/juego/[id]` pero no se pueden jugar.

## Resumen

| Juego     | id          | Categoría | Color   | Spec                | Componente                       | Scores reales |
| --------- | ----------- | --------- | ------- | ------------------- | -------------------------------- | ------------- |
| ASTEROIDS | `asteroids` | SHOOTER   | yellow  | 05                  | `components/games/Asteroids.tsx` | 1             |
| TETRIS    | `tetris`    | PUZZLE    | magenta | 07                  | `components/games/Tetris.tsx`    | 2             |
| ARKANOID  | `arkanoid`  | ARCADE    | cyan    | 08                  | `components/games/Arkanoid.tsx`  | 1             |
| SNAKE     | `snake`     | ARCADE    | green   | 09                  | `components/games/Snake.tsx`     | 3             |
| FROGGER   | `frogger`   | ARCADE    | green   | game-jam/frogger/01 | `components/games/Frogger.tsx`   | 0             |

`best` y `plays` de la tabla `games` son valores estáticos de escaparate; no se recalculan
desde `scores`.

---

## ASTEROIDS

- **id**: `asteroids` · **categoría**: SHOOTER · **cover**: `cover-rocas` · **color**: yellow
- **Spec**: `specs/05-integracion-asteroids.md` (primer port; define el patrón)
- **Componente**: `components/games/Asteroids.tsx` (661 líneas)
- **Descripción**: Nave triangular en vacío absoluto. Dispara y rota para dividir rocas en
  fragmentos cada vez más pequeños. OVNIs en el horizonte.
- **Controles**: `←` `→` rotar · `↑` propulsión · `Espacio` disparar
- **Estado expuesto**: `{ score, lives, level, gameOver }` — 3 vidas iniciales
- **Puntuación**: 100 / 50 / 20 puntos según tamaño del asteroide (grande → pequeño)
- **Vitrina DB**: best 41 200 · plays 15.6K
- **Skins**: `clasico` / `retro` / `neon` completos, `AsteroidsProps.skin: SkinId`
  cableado desde `GamePlayerClient.tsx`. Ver `references/skins/README.md`.

## TETRIS

- **id**: `tetris` · **categoría**: PUZZLE · **cover**: `cover-tetro` · **color**: magenta
- **Spec**: `specs/07-integracion-tetris.md`
- **Componente**: `components/games/Tetris.tsx` (463 líneas)
- **Descripción**: Piezas geométricas que descienden; rota, encaja y limpia líneas.
  La velocidad sube cada 10 líneas.
- **Tablero**: 10 × 20 celdas
- **Controles**: `←` `→` mover · `↓` bajar (soft drop) · `↑` / `X` rotar · `Espacio` hard drop
- **Estado expuesto**: `{ score, lines, level, gameOver }` — sin sistema de vidas
- **Puntuación**: líneas 100 / 300 / 500 / 800 × nivel · +1 por soft drop · +2 por celda de hard drop
- **Nivel**: `floor(lines / 10) + 1`
- **Vitrina DB**: best 184 220 · plays 31.8K

## ARKANOID

- **id**: `arkanoid` · **categoría**: ARCADE · **cover**: `cover-bricks` · **color**: cyan
- **Spec**: `specs/08-integracion-arkanoid.md`
- **Componente**: `components/games/Arkanoid.tsx` (582 líneas)
- **Assets**: spritesheet en `public/games/arkanoid/`
- **Descripción**: Paleta que rebota un núcleo de plasma contra muros de bloques cromáticos.
  Cada nivel reorganiza la grilla.
- **Grilla de bloques**: 10 columnas × 6 filas, niveles definidos en `LEVELS`
- **Controles**: `←` `→` mover la paleta
- **Estado expuesto**: `{ score, lives, level, gameOver }` — 3 vidas iniciales
- **Puntuación**: +10 por bloque destruido
- **Estados internos**: `playing` / `gameover` / `win` (con explosiones animadas)
- **Vitrina DB**: best 28 450 · plays 12.4K
- **Skins**: `clasico` / `retro` / `neon` completos, `ArkanoidProps.skin: SkinId`
  cableado desde `GamePlayerClient.tsx`. Ver `references/skins/README.md`.

## SNAKE

- **id**: `snake` · **categoría**: ARCADE · **cover**: `cover-snake` · **color**: green
- **Spec**: `specs/09-integracion-snake.md`
- **Componente**: `components/games/Snake.tsx` (352 líneas)
- **Assets**: `public/snake-assets/fruits.png`
- **Descripción**: Serpiente de luz sobre una grilla buscando frutas. Cada bocado la alarga
  y la acelera; chocar con el borde o consigo misma es game over.
- **Grilla**: celda de 20 px (COLS × ROWS derivados del canvas)
- **Controles**: `↑` `↓` `←` `→`
- **Estado expuesto**: `{ score, lives, level, gameOver }` — `lives` es 1 mientras vive y 0 en
  game over; no hay vidas múltiples
- **Puntuación**: +10 por fruta
- **Velocidad**: tick base 150 ms, −12 ms por nivel (con suelo mínimo)
- **Vitrina DB**: best 7 820 · plays 9.1K
- **Skins**: `clasico` / `retro` / `neon` completos, `SnakeProps.skin: SkinId`
  cableado desde `GamePlayerClient.tsx`; el sprite de fruta se tinta por skin. Ver
  `references/skins/README.md`.

## FROGGER

- **id**: `frogger` · **categoría**: ARCADE · **cover**: `cover-frogger` (nueva, añadida en
  `app/globals.css` junto con el port) · **color**: green
- **Spec**: `specs/game-jam/frogger/01-frogger-core.md` — spec de `@game-jam`, no numerado
- **Componente**: `components/games/Frogger.tsx`
- **Descripción**: Rana que cruza una carretera con tráfico y un río con troncos y tortugas
  para llenar 5 metas antes de que se agote el tiempo de la ronda.
- **Grilla**: 16 columnas × 14 filas de 40px (canvas 640×560). Filas 1-6 río, 8-12 carretera,
  0 metas, 7/13 zonas seguras.
- **Controles**: `↑` `↓` `←` `→` — salto discreto de 1 celda, animación 120ms
- **Estado expuesto**: `{ score, lives, level, gameOver }` — 3 vidas reales (no bandera binaria)
- **Puntuación**: +10 por celda de avance nuevo · +50 + bonus de tiempo por meta ocupada ·
  +200 por ronda completa (5 metas llenas)
- **Dificultad**: velocidades de carriles ×1.15 por nivel; temporizador de ronda decrece
  1s/nivel con suelo de 6s
- **Vitrina DB**: best 15 600 · plays 5.2K
- **Skins**: pendiente — sin `skin` prop todavía (mismo estado que `tetris` antes de su
  turno), colores literales fieles a la paleta del spec. Ver `references/skins/README.md`.
- **Desviaciones del `.md` original** (adaptado al contrato del proyecto, ver historial de
  la rama `gamejam-frogger`): un solo callback `onStateChange` en vez de 4 callbacks
  separados; ruta `/juego/frogger/jugar` vía `GamePlayerClient.tsx` en vez de página propia;
  insert vía `mcp__supabase__apply_migration` en vez de SQL Editor manual; sin columna
  `user_id` en `scores` (no existe en el esquema real); `color: 'green'` en vez de `'lime'`
  (no es un valor válido del CHECK constraint, duplica con Snake — mismo criterio ya
  aceptado para `ranaria` en el catálogo ficticio).

---

## Contrato común (aplicado a los 5)

```ts
type XState = {
  score: number;
  lives: number;
  level: number;
  gameOver: boolean;
}; // varía por juego
type XProps = { paused: boolean; onStateChange: (state: XState) => void };
type XHandle = { forceGameOver: () => void; restart: () => void };
```

- Estado mutable en `useRef`, nunca `useState`; loop con `requestAnimationFrame` y
  `cancelAnimationFrame` en el cleanup.
- El canvas comunica su estado a React por callback (`onStateChange`), no polling.
- Listeners `keydown`/`keyup` con `preventDefault` al montar, removidos al desmontar.
- Auto-reinicio por tecla del juego original deshabilitado: reiniciar es exclusivo del
  botón del HUD.
- `GamePlayerClient.tsx` monta cada juego con un gate `game.id === '<id>'`
  (`isAsteroids`, `isTetris`, `isArkanoid`, `isSnake`, `isFrogger`) y conecta HUD y botones
  PAUSA / FIN / JUGAR DE NUEVO / SALIR al handle.
- Persistencia de score: Server Component hace fetch → Client Component inserta directo en
  `scores` con el cliente browser. Sin Route Handlers intermedios.

## Juegos del catálogo aún NO implementados

| Juego       | id            | Categoría | Nota                                                                        |
| ----------- | ------------- | --------- | --------------------------------------------------------------------------- |
| DUELO PIXEL | `duelo-pixel` | VERSUS    | Pong local / vs CPU                                                         |
| GLOTÓN      | `gloton`      | ARCADE    | Pac-Man                                                                     |
| INVASORES   | `invasores`   | SHOOTER   | Space Invaders                                                              |
| RANARIA     | `ranaria`     | ARCADE    | Frogger — entrada ficticia sin implementar; distinta de `frogger` (ya real) |

Para portar uno nuevo: `/port-game [juego]` genera el spec siguiendo el patrón validado.
