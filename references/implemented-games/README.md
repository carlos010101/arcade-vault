# Juegos implementados — Arcade Vault

Inventario de los juegos **jugables** (portados a canvas + leaderboard real en Supabase).
Última actualización: 2026-08-14.

El catálogo de la tabla `games` tiene 8 filas, pero solo 4 tienen implementación real.
Las otras 4 (`duelo-pixel`, `gloton`, `invasores`, `ranaria`) son entradas de catálogo con
datos ficticios: aparecen en `/biblioteca` y `/juego/[id]` pero no se pueden jugar.

## Resumen

| Juego     | id          | Categoría | Color   | Spec | Componente                       | Scores reales |
| --------- | ----------- | --------- | ------- | ---- | -------------------------------- | ------------- |
| ASTEROIDS | `asteroids` | SHOOTER   | yellow  | 05   | `components/games/Asteroids.tsx` | 1             |
| TETRIS    | `tetris`    | PUZZLE    | magenta | 07   | `components/games/Tetris.tsx`    | 2             |
| ARKANOID  | `arkanoid`  | ARCADE    | cyan    | 08   | `components/games/Arkanoid.tsx`  | 1             |
| SNAKE     | `snake`     | ARCADE    | green   | 09   | `components/games/Snake.tsx`     | 3             |

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

---

## Contrato común (aplicado a los 4)

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
  (`isAsteroids`, `isTetris`, `isArkanoid`, `isSnake`) y conecta HUD y botones
  PAUSA / FIN / JUGAR DE NUEVO / SALIR al handle.
- Persistencia de score: Server Component hace fetch → Client Component inserta directo en
  `scores` con el cliente browser. Sin Route Handlers intermedios.

## Juegos del catálogo aún NO implementados

| Juego       | id            | Categoría | Nota                |
| ----------- | ------------- | --------- | ------------------- |
| DUELO PIXEL | `duelo-pixel` | VERSUS    | Pong local / vs CPU |
| GLOTÓN      | `gloton`      | ARCADE    | Pac-Man             |
| INVASORES   | `invasores`   | SHOOTER   | Space Invaders      |
| RANARIA     | `ranaria`     | ARCADE    | Frogger             |

Para portar uno nuevo: `/port-game [juego]` genera el spec siguiendo el patrón validado.
