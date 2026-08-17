# Skins de Arcade Vault — inventario

> Memoria del subagente `@skin-designer` (`.claude/agents/skin-designer.md`).
> Última actualización: **2026-08-16** · Estado: **infraestructura creada · `asteroids` completo**

Todo juego implementado debe ofrecer **tres skins**: `clasico` (default), `retro` y
`neon`, elegibles desde el HUD de `/juego/[id]/jugar` y legibles sobre el fondo oscuro
de la app (Arcade Vault es **dark-only**: no hay tema claro y no se va a introducir).

## Estado actual

| Juego         | Componente                       | clasico | retro | neon | Fuente de color                         |
| ------------- | -------------------------------- | ------- | ----- | ---- | --------------------------------------- |
| `asteroids`   | `components/games/Asteroids.tsx` | ✅      | ✅    | ✅   | `lib/skins.ts` → `GAME_SKINS.asteroids` |
| `tetris`      | `components/games/Tetris.tsx`    | ❌      | ❌    | ❌   | literales hex en el `.tsx`              |
| `snake`       | `components/games/Snake.tsx`     | ❌      | ❌    | ❌   | literales + sprite `fruits.png`         |
| `arkanoid`    | `components/games/Arkanoid.tsx`  | ❌      | ❌    | ❌   | spritesheet `spritesheet-breakout.png`  |
| `duelo-pixel` | —                                | N/A     | N/A   | N/A  | sin componente                          |
| `gloton`      | —                                | N/A     | N/A   | N/A  | sin componente                          |
| `invasores`   | —                                | N/A     | N/A   | N/A  | sin componente                          |
| `ranaria`     | —                                | N/A     | N/A   | N/A  | sin componente                          |

`lib/skins.ts` **ya existe**. Define `SkinId`, `SKINS`, `DEFAULT_SKIN`, el tipo base
`GameSkin`, el helper `withAlpha(hex, alpha)` para partículas con alpha dinámico, y
`GAME_SKINS`/`getSkin()` tipados por `GameKey`. Por ahora `GameKey` solo incluye
`'asteroids'`; se irá ampliando (`'tetris' | 'snake' | 'arkanoid' | ...`) a medida que
cada juego se skinnee, de forma que a TypeScript le falte una skin es un error de
compilación, no un fallo silencioso.

`asteroids` fue el primero en portarse. Su `AsteroidsProps` ahora exige `skin: SkinId`
y `GamePlayerClient.tsx` lo cablea; los otros tres siguen con literales de color en su
`.tsx` (pendiente de turnos futuros del subagente).

## Identidad de cada skin

| Skin      | Intención                                                               | Rasgo técnico              |
| --------- | ----------------------------------------------------------------------- | -------------------------- |
| `clasico` | Los colores actuales de cada juego, tal cual se ven hoy. Es el default. | `glow: 0`                  |
| `retro`   | Fósforo monocromo (ámbar o verde CRT), fondo casi negro, sin brillos.   | `glow: 0`, gama corta      |
| `neon`    | Paleta cyan/magenta/amarillo de la app, con halo por `ctx.shadowBlur`.  | `glow: 8–14` + shadowColor |

## Umbrales de contraste (WCAG, sobre el propio `bg` del skin)

- Texto dibujado en el canvas (`hud`): **≥ 4.5:1**
- Elementos de juego no textuales (nave, pieza, ladrillo, fruta): **≥ 3:1**

Los ratios calculados de cada paleta se anotan aquí conforme se implementan.

## Paletas

### `asteroids`

Tokens comunes (`bg`, `grid`, `fg`, `accent`, `hud`, `overlay`, `glow`) + extra propio
(`thrust`, `particle`). `grid` no se usa en el render de Asteroids (el juego no dibuja
grilla), se deja igual a `bg` por completitud del tipo.

| Token      | clasico                  | retro                  | neon                   |
| ---------- | ------------------------ | ---------------------- | ---------------------- |
| `bg`       | `#000000`                | `#060400`              | `#05030f`              |
| `fg`       | `#ffffff`                | `#ffb000`              | `#00f5ff`              |
| `accent`   | `#00ffff`                | `#ffcf66`              | `#ff006e`              |
| `hud`      | `#ffffff`                | `#ffb000`              | `#f5ff00`              |
| `overlay`  | `rgba(255,255,255,0.65)` | `rgba(255,176,0,0.65)` | `rgba(0,245,255,0.65)` |
| `thrust`   | `rgba(255,130,0,0.85)`   | `rgba(255,122,0,0.85)` | `rgba(255,207,58,0.9)` |
| `particle` | `#ffffff`                | `#ffb000`              | `#00f5ff`              |
| `glow`     | `0`                      | `0`                    | `10`                   |

Ratios de contraste (WCAG, fórmula de luminancia relativa, elemento contra su propio
`bg`):

| Par                                 | Ratio     | Umbral aplicado       |
| ----------------------------------- | --------- | --------------------- |
| clasico `fg` (nave/roca) vs `bg`    | 21.0 : 1  | ≥ 3:1 (no textual) ✅ |
| clasico `accent` (power-up) vs `bg` | 16.75 : 1 | ≥ 3:1 ✅              |
| clasico `thrust` vs `bg`            | 8.45 : 1  | ≥ 3:1 ✅              |
| retro `fg`/`hud` vs `bg`            | 11.18 : 1 | ≥ 4.5:1 (texto) ✅    |
| retro `accent` vs `bg`              | 14.02 : 1 | ≥ 3:1 ✅              |
| retro `thrust` vs `bg`              | 7.84 : 1  | ≥ 3:1 ✅              |
| neon `fg` vs `bg`                   | 15.11 : 1 | ≥ 3:1 ✅              |
| neon `hud` vs `bg`                  | 18.69 : 1 | ≥ 4.5:1 (texto) ✅    |
| neon `accent` vs `bg`               | 5.34 : 1  | ≥ 3:1 ✅              |
| neon `thrust` vs `bg`               | 13.87 : 1 | ≥ 3:1 ✅              |

Implementación: `AsteroidsProps.skin: SkinId`; el componente guarda la paleta activa
en `skinRef` (`useRef`), sincronizado por un `useEffect` sobre la prop `skin` — el loop
`requestAnimationFrame` la lee sin recrearse y sin reiniciar la partida. `neon` aplica
`ctx.shadowBlur`/`shadowColor` vía el helper `applyGlow()` antes de cada trazo/relleno;
`clasico` y `retro` van con `glow: 0` (sin halo). El fill de `#000` para limpiar el
canvas en cada frame ahora sale de `skin.bg`.

## Selector en el HUD

`GamePlayerClient.tsx` mantiene `skin: SkinId` en `useState(DEFAULT_SKIN)`. Se
persiste por juego en `localStorage['av-skin:' + game.id]`: un `useEffect` al montar
lee el valor guardado (evita mismatch de hidratación al no leer `localStorage` en el
render inicial) y otro lo escribe en cada cambio. Tres botones compactos en
`.hud-actions` (reutilizan la clase `.btn` existente — `yellow` cuando el skin está
activo, `ghost` cuando no) permiten alternar; hoy el selector se muestra para los 4
juegos, pero solo `asteroids` reacciona (los otros tres ignoran la prop hasta que se
les añada `skin: SkinId`). Cambiar de skin no reinicia la partida en curso.

## Notas de sprites

- **Arkanoid**: casi todo el render sale de `public/games/arkanoid/spritesheet-breakout.png`,
  ya cargado en un canvas offscreen a nivel de módulo. Un skin no-clásico requiere
  **tintar ese offscreen** (`globalCompositeOperation: 'source-atop'`) y cachear el
  resultado en un `Map<SkinId, HTMLCanvasElement>` — el loader es un singleton, así que
  hay que cachear por skin en vez de invalidarlo.
- **Snake**: todo es canvas salvo la fruta (`public/snake-assets/fruits.png`), mismo
  tratamiento de tintado.
- **Asteroids** y **Tetris**: canvas vectorial puro, skin de solo color.
