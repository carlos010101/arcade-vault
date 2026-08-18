# Skins de Arcade Vault — inventario

> Memoria del subagente `@skin-designer` (`.claude/agents/skin-designer.md`).
> Última actualización: **2026-08-17** · Estado: **infraestructura creada · `asteroids`, `arkanoid`, `snake` y `frogger` completos**

Todo juego implementado debe ofrecer **tres skins**: `clasico` (default), `retro` y
`neon`, elegibles desde el HUD de `/juego/[id]/jugar` y legibles sobre el fondo oscuro
de la app (Arcade Vault es **dark-only**: no hay tema claro y no se va a introducir).

## Estado actual

| Juego         | Componente                       | clasico | retro | neon | Fuente de color                         |
| ------------- | -------------------------------- | ------- | ----- | ---- | --------------------------------------- |
| `asteroids`   | `components/games/Asteroids.tsx` | ✅      | ✅    | ✅   | `lib/skins.ts` → `GAME_SKINS.asteroids` |
| `tetris`      | `components/games/Tetris.tsx`    | ❌      | ❌    | ❌   | literales hex en el `.tsx`              |
| `snake`       | `components/games/Snake.tsx`     | ✅      | ✅    | ✅   | `lib/skins.ts` → `GAME_SKINS.snake`     |
| `arkanoid`    | `components/games/Arkanoid.tsx`  | ✅      | ✅    | ✅   | `lib/skins.ts` → `GAME_SKINS.arkanoid`  |
| `frogger`     | `components/games/Frogger.tsx`   | ✅      | ✅    | ✅   | `lib/skins.ts` → `GAME_SKINS.frogger`   |
| `duelo-pixel` | —                                | N/A     | N/A   | N/A  | sin componente                          |
| `gloton`      | —                                | N/A     | N/A   | N/A  | sin componente                          |
| `invasores`   | —                                | N/A     | N/A   | N/A  | sin componente                          |
| `ranaria`     | —                                | N/A     | N/A   | N/A  | sin componente                          |

`lib/skins.ts` **ya existe**. Define `SkinId`, `SKINS`, `DEFAULT_SKIN`, el tipo base
`GameSkin`, el helper `withAlpha(hex, alpha)` para partículas con alpha dinámico, y
`GAME_SKINS`/`getSkin()` tipados por `GameKey`. `GameKey` incluye hoy
`'asteroids' | 'snake' | 'arkanoid' | 'frogger'`; falta sumar `'tetris'` cuando le
toque turno, de forma que a TypeScript le falte una skin es un error de compilación,
no un fallo silencioso.

`asteroids` fue el primero en portarse (`AsteroidsProps.skin: SkinId`, cableado desde
`GamePlayerClient.tsx`). `arkanoid` es el segundo (`ArkanoidProps.skin: SkinId`,
cableado en `GamePlayerClient.tsx`). `snake` se completó el 2026-08-16:
`SnakeProps.skin: SkinId`, `drawGame` de `Snake.tsx` lee `getSkin('snake', skin)` para
fondo, grilla, cabeza/cuerpo de la serpiente, overlay y texto de game over, y el
sprite de fruta (`fruits.png`) se tinta por skin vía canvas offscreen cacheado.
`GamePlayerClient.tsx` le pasa `skin={skin}` en la rama `isSnake` del ternario.
`frogger` se completó en esta sesión (2026-08-17): `FroggerProps.skin: SkinId`, `draw`
de `Frogger.tsx` lee `getSkin('frogger', skin)` para fondo por zona (carretera, río,
zonas seguras, metas), autos/camiones, troncos/tortugas, borde y relleno de meta,
rana, HUD interno (score/nivel/vidas) y barra de tiempo; `GamePlayerClient.tsx` le pasa
`skin={skin}` en la rama `isFrogger` del ternario. `tetris` sigue con literales de
color en su `.tsx` (pendiente de turno futuro).

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

### `arkanoid`

Tokens comunes (`bg`, `grid`, `fg`, `accent`, `hud`, `overlay`, `glow`) + extra propio
(`tint`). `grid` y `fg` no se usan en el render de Arkanoid (todo el juego es
spritesheet + HUD de texto), se dejan por completitud del tipo (`fg` refleja el mismo
tono que `hud`/`accent` según el skin).

| Token     | clasico                  | retro                 | neon                     |
| --------- | ------------------------ | --------------------- | ------------------------ |
| `bg`      | `#000000`                | `#060400`             | `#05030f`                |
| `fg`      | `#ffffff`                | `#ffb000`             | `#00f5ff`                |
| `accent`  | `#00ffff`                | `#ffb000`             | `#ff006e`                |
| `hud`     | `#ffffff`                | `#ffb000`             | `#f5ff00`                |
| `overlay` | `rgba(0,0,0,0.6)`        | `rgba(0,0,0,0.72)`    | `rgba(5,3,15,0.7)`       |
| `tint`    | `null` (sprite original) | `#ffb000` (monocromo) | `null` (sprite original) |
| `glow`    | `0`                      | `0`                   | `10`                     |

Ratios de contraste (WCAG, luminancia relativa, elemento contra su propio `bg`); las
paletas retro y neon reutilizan los mismos hex que `asteroids`, así que los ratios son
idénticos a los ya verificados ahí:

| Par                                     | Ratio     | Umbral aplicado    |
| --------------------------------------- | --------- | ------------------ |
| clasico `hud` (`#fff`) vs `bg` (`#000`) | 21.0 : 1  | ≥ 4.5:1 (texto) ✅ |
| retro `hud`/`accent`/`tint` vs `bg`     | 11.19 : 1 | ≥ 4.5:1 (texto) ✅ |
| neon `hud` vs `bg`                      | 18.69 : 1 | ≥ 4.5:1 (texto) ✅ |
| neon `fg` (halo paleta/núcleo) vs `bg`  | 15.11 : 1 | ≥ 3:1 ✅           |
| neon `accent` (halo paleta) vs `bg`     | 5.34 : 1  | ≥ 3:1 ✅           |

Implementación: `ArkanoidProps.skin: SkinId`. El componente guarda el id de skin
(`skinIdRef`) y la paleta resuelta (`skinRef`) en `useRef`, sincronizados por un
`useEffect` sobre la prop `skin` — el loop `requestAnimationFrame` los lee sin
recrearse y sin reiniciar la partida. El spritesheet
(`public/games/arkanoid/spritesheet-breakout.png`, cargado una sola vez en un canvas
offscreen `ssImg` a nivel de módulo) se sirve **sin tocar** cuando `tint` es `null`
(`clasico` y `neon`: conservan la paleta multicolor original del asset, que ya es
"neón" de por sí — rojo/amarillo/cian/magenta/verde). Para `retro` (`tint: '#ffb000'`)
se genera una copia offscreen tintada con
`globalCompositeOperation: 'source-atop'` + `fillRect` del color de tinte, cacheada en
`ssTintCache: Map<SkinId, HTMLCanvasElement>` (el loader `ssImg`/`ssLoaded` sigue
siendo singleton, nunca se recarga el PNG). `neon` añade halo (`ctx.shadowBlur`) a la
paleta/núcleo (`skin.accent`) y al texto de HUD/overlay (`skin.hud`) vía el helper
`applyGlow()`; `clasico` y `retro` van con `glow: 0`. El fill de fondo, el velo de
`GAME OVER`/`WIN` y el color de los textos de HUD salen de `skin.bg`/`skin.overlay`/
`skin.hud` respectivamente — cero literales de color quedan en `Arkanoid.tsx`.

### `snake`

Tokens comunes (`bg`, `grid`, `fg`, `accent`, `hud`, `overlay`, `glow`) + extra propio
(`head`, `body`, `fruitTint`). `fg`/`accent` quedan alineados con `head`/`body`
respectivamente por completitud del tipo (el render usa los tokens específicos).
`fruitTint` es `string | null`: `null` en `clasico` (sprite original, sin tocar).

| Token       | clasico                  | retro                  | neon                   |
| ----------- | ------------------------ | ---------------------- | ---------------------- |
| `bg`        | `#000000`                | `#001a00`              | `#05030f`              |
| `grid`      | `rgba(255,255,255,0.05)` | `rgba(57,255,20,0.08)` | `rgba(0,245,255,0.06)` |
| `head`      | `#22c55e`                | `#39ff14`              | `#00f5ff`              |
| `body`      | `#16a34a`                | `#1fae1f`              | `#ff006e`              |
| `hud`       | `#ffffff`                | `#39ff14`              | `#f5ff00`              |
| `overlay`   | `rgba(0,0,0,0.6)`        | `rgba(0,0,0,0.6)`      | `rgba(0,0,0,0.6)`      |
| `fruitTint` | `null` (sprite original) | `#39ff14`              | `#00f5ff`              |
| `glow`      | `0`                      | `0`                    | `12`                   |

Ratios de contraste (WCAG, luminancia relativa, elemento contra su propio `bg`):

| Par                        | Ratio     | Umbral aplicado    |
| -------------------------- | --------- | ------------------ |
| clasico `head` vs `bg`     | 9.22 : 1  | ≥ 3:1 ✅           |
| clasico `body` vs `bg`     | 6.37 : 1  | ≥ 3:1 ✅           |
| clasico `hud` vs `bg`      | 21.0 : 1  | ≥ 4.5:1 (texto) ✅ |
| retro `head`/`hud` vs `bg` | 13.49 : 1 | ≥ 4.5:1 (texto) ✅ |
| retro `body` vs `bg`       | 6.21 : 1  | ≥ 3:1 ✅           |
| neon `head` vs `bg`        | 15.11 : 1 | ≥ 3:1 ✅           |
| neon `body` vs `bg`        | 5.34 : 1  | ≥ 3:1 ✅           |
| neon `hud` vs `bg`         | 18.69 : 1 | ≥ 4.5:1 (texto) ✅ |

Implementación: `SnakeProps.skin: SkinId`; el componente guarda el id de skin
(`skinIdRef`) y la paleta resuelta (`skinRef`) en `useRef`, sincronizados por un
`useEffect` sobre la prop `skin` — el loop `requestAnimationFrame` los lee sin
recrearse y sin reiniciar la partida. `drawGame` toma todos los colores de
`getSkin('snake', skin)`: fondo, grilla, cabeza (`head`, primer segmento) y cuerpo
(`body`, resto), overlay de game over y texto `hud`. El helper `applyGlow()` (mismo
patrón que Asteroids/Arkanoid) aplica `shadowBlur`/`shadowColor` en `neon` sobre
cabeza, cuerpo, fruta y texto de game over; `clasico`/`retro` van con `glow: 0`.

### `frogger`

Tokens comunes (`bg`, `grid`, `fg`, `accent`, `hud`, `overlay`, `glow`) + extra propio
(`roadBg`, `riverBg`, `safeBg`, `goalBg`, `car`, `carWheel`, `truck`, `truckCab`, `log`,
`logVein`, `turtle`, `goalBorder`, `goalFilled`, `frogBody`, `frogEyeWhite`,
`frogEyePupil`, `livesDot`, `timeGood`, `timeWarn`, `timeLow`, `timeTrack`). `bg`/`grid`
se fijan igual a `roadBg` por completitud del tipo (Frogger no tiene un único color de
fondo: cada fila pinta su zona); `fg` se alinea con `frogBody` y `accent` con `car`
(el render usa los tokens específicos, no estos genéricos).

| Token          | clasico           | retro                  | neon                   |
| -------------- | ----------------- | ---------------------- | ---------------------- |
| `roadBg`/`bg`  | `#141414`         | `#0a0700`              | `#0a0620`              |
| `riverBg`      | `#0a2e4a`         | `#050503`              | `#05030f`              |
| `safeBg`       | `#0f2a12`         | `#0d0900`              | `#0c0620`              |
| `goalBg`       | `#123b1f`         | `#120c00`              | `#100826`              |
| `car`          | `#e5484d`         | `#ffb000`              | `#ff006e`              |
| `carWheel`     | `#222222`         | `#4d3300`              | `#3a0018`              |
| `truck`        | `#9ca3af`         | `#cc8c00`              | `#f5ff00`              |
| `truckCab`     | `#4b5563`         | `#805800`              | `#8a8b00`              |
| `log`          | `#8a5a2b`         | `#996600`              | `#00f5ff`              |
| `logVein`      | `#5c3a1a`         | `#5c3d00`              | `#007a80`              |
| `turtle`       | `#16a34a`         | `#e6a300`              | `#ff006e`              |
| `goalBorder`   | `#d4af37`         | `#ffb000`              | `#f5ff00`              |
| `goalFilled`   | `#22c55e`         | `#ffcf66`              | `#00f5ff`              |
| `frogBody`     | `#22c55e`         | `#ffcf66`              | `#00f5ff`              |
| `frogEyeWhite` | `#ffffff`         | `#fff8e6`              | `#ffffff`              |
| `frogEyePupil` | `#000000`         | `#1a1200`              | `#05030f`              |
| `hud`          | `#ffffff`         | `#ffcf66`              | `#f5ff00`              |
| `livesDot`     | `#22c55e`         | `#ffb000`              | `#ff006e`              |
| `timeGood`     | `#22c55e`         | `#ffb000`              | `#00f5ff`              |
| `timeWarn`     | `#eab308`         | `#cc8c00`              | `#f5ff00`              |
| `timeLow`      | `#ef4444`         | `#805800`              | `#ff006e`              |
| `timeTrack`    | `rgba(0,0,0,0.5)` | `rgba(255,176,0,0.15)` | `rgba(0,245,255,0.12)` |
| `overlay`      | `rgba(0,0,0,0.6)` | `rgba(0,0,0,0.65)`     | `rgba(5,3,15,0.7)`     |
| `glow`         | `0`               | `0`                    | `12`                   |

Ratios de contraste (WCAG, luminancia relativa). Cada elemento se calcula contra el
`bg` de la zona donde realmente se dibuja (carretera para autos/HUD/barra de tiempo,
río para troncos/tortugas, meta para el borde/relleno de meta) — no contra un `bg`
único, porque Frogger no tiene uno (cada fila pinta su propia zona):

| Par                                        | Ratio                 | Umbral aplicado        |
| ------------------------------------------ | --------------------- | ---------------------- |
| clasico `hud` vs `roadBg`                  | 18.42 : 1             | ≥ 4.5:1 (texto) ✅     |
| clasico `car` vs `roadBg`                  | 4.71 : 1              | ≥ 3:1 ✅               |
| clasico `truck` vs `roadBg`                | 7.26 : 1              | ≥ 3:1 ✅               |
| clasico `frogBody` vs `roadBg`             | 8.08 : 1              | ≥ 3:1 ✅               |
| clasico `goalBorder` vs `goalBg`           | 5.98 : 1              | ≥ 3:1 ✅               |
| clasico `log` vs `riverBg`                 | 2.38 : 1              | ⚠️ bajo 3:1 (ver nota) |
| clasico `turtle` vs `riverBg`              | 4.24 : 1              | ≥ 3:1 ✅               |
| retro `hud`/`frogBody` vs `roadBg`         | 13.77 : 1             | ≥ 4.5:1 (texto) ✅     |
| retro `car` vs `roadBg`                    | 10.99 : 1             | ≥ 3:1 ✅               |
| retro `truck` vs `roadBg`                  | 7.01 : 1              | ≥ 3:1 ✅               |
| retro `log` vs `riverBg`                   | 4.13 : 1              | ≥ 3:1 ✅               |
| retro `turtle` vs `riverBg`                | 9.33 : 1              | ≥ 3:1 ✅               |
| retro `goalBorder` vs `goalBg`             | 10.63 : 1             | ≥ 3:1 ✅               |
| retro `timeLow` vs `roadBg`                | 3.18 : 1              | ≥ 3:1 ✅               |
| neon `hud` vs `roadBg`                     | 18.10 : 1             | ≥ 4.5:1 (texto) ✅     |
| neon `frogBody` vs `roadBg`                | 14.63 : 1             | ≥ 3:1 ✅               |
| neon `car` vs `roadBg`                     | 5.17 : 1              | ≥ 3:1 ✅               |
| neon `truck` vs `roadBg`                   | 18.10 : 1             | ≥ 3:1 ✅               |
| neon `log` vs `riverBg`                    | 15.11 : 1             | ≥ 3:1 ✅               |
| neon `turtle` vs `riverBg`                 | 5.34 : 1              | ≥ 3:1 ✅               |
| neon `goalBorder`/`goalFilled` vs `goalBg` | 17.69 : 1 / 14.29 : 1 | ≥ 3:1 ✅               |

Nota `clasico log vs riverBg` (2.38:1, bajo el umbral de 3:1 para elementos no
textuales): es la paleta literal del spec de Frogger (`#8a5a2b` sobre `#0a2e4a`), y
`clasico` **debe verse idéntico al aspecto actual del juego** por regla dura del
proyecto (red de seguridad ante regresiones). Se preserva intacta pese a quedar bajo
el umbral; `retro` y `neon` sí cumplen el umbral en el mismo par. Todos los demás
pares de `clasico` cumplen su umbral.

Implementación: `FroggerProps.skin: SkinId`; el componente guarda la paleta activa en
`skinRef` (`useRef`), sincronizada por un `useEffect` sobre la prop `skin` — el loop
`requestAnimationFrame` la lee sin recrearse y sin reiniciar la partida. `zoneColor`,
`drawEntity`, `drawFrog` y `draw` (fondo por fila, bocas de meta, HUD interno y barra
de tiempo, overlay de game over) toman todos sus colores de
`getSkin('frogger', skin)`. El helper `applyGlow()` (mismo patrón que
Asteroids/Snake/Arkanoid) aplica `shadowBlur`/`shadowColor` en `neon` sobre autos,
camiones, troncos, tortugas, metas, rana, HUD y barra de tiempo; `clasico`/`retro` van
con `glow: 0`. Cero literales de color quedan en `Frogger.tsx`.

## Selector en el HUD

`GamePlayerClient.tsx` mantiene `skin: SkinId` en `useState(DEFAULT_SKIN)`. Se
persiste por juego en `localStorage['av-skin:' + game.id]`: un `useEffect` al montar
lee el valor guardado (evita mismatch de hidratación al no leer `localStorage` en el
render inicial) y otro lo escribe en cada cambio. Tres botones compactos en
`.hud-actions` (reutilizan la clase `.btn` existente — `yellow` cuando el skin está
activo, `ghost` cuando no) permiten alternar; hoy el selector se muestra para los 5
juegos. `asteroids`, `arkanoid`, `snake` y `frogger` reaccionan al cambio; `tetris` lo
ignora (sin `skin: SkinId` en su prop). Cambiar de skin no reinicia la partida en
curso.

## Notas de sprites

- **Arkanoid**: casi todo el render sale de `public/games/arkanoid/spritesheet-breakout.png`,
  cargado en un canvas offscreen a nivel de módulo (`ssImg`/`ssLoaded`, singleton).
  `clasico` y `neon` sirven ese offscreen tal cual (`tint: null`); `retro` genera una
  copia tintada monocroma vía `globalCompositeOperation: 'source-atop'` y la cachea en
  `ssTintCache: Map<SkinId, HTMLCanvasElement>` — nunca se recarga el PNG ni se invalida
  el singleton. `neon` se distingue del `clasico` por fondo/HUD/halo (`shadowBlur`), no
  por tintar el sprite: el spritesheet ya trae una paleta multicolor tipo neón
  (rojo/amarillo/cian/magenta/verde/rosa) que se decidió conservar intacta.
- **Snake**: todo es canvas salvo la fruta (`public/snake-assets/fruits.png`), cargada
  una sola vez en `fruitsImg` (singleton de módulo). `getFruitsSource(skinId, palette)`
  devuelve el `fruitsImg` original cuando `palette.fruitTint` es `null` (`clasico`) o,
  si no, una copia offscreen tintada con `globalCompositeOperation: 'source-atop'` +
  `fillRect` del color de tinte, cacheada en `fruitsTintCache: Map<SkinId,
HTMLCanvasElement>` — nunca se recarga el PNG ni se invalida el singleton.
- **Asteroids**, **Frogger** y **Tetris**: canvas vectorial puro, skin de solo color
  (Frogger no usa sprites: autos, camiones, troncos, tortugas, metas y rana son formas
  dibujadas a mano en el canvas).
