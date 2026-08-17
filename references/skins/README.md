# Skins de Arcade Vault — inventario

> Memoria del subagente `@skin-designer` (`.claude/agents/skin-designer.md`).
> Última actualización: **2026-08-15** · Estado: **infraestructura sin implementar**

Todo juego implementado debe ofrecer **tres skins**: `clasico` (default), `retro` y
`neon`, elegibles desde el HUD de `/juego/[id]/jugar` y legibles sobre el fondo oscuro
de la app (Arcade Vault es **dark-only**: no hay tema claro y no se va a introducir).

## Estado actual

| Juego         | Componente                       | clasico | retro | neon | Fuente de color                        |
| ------------- | -------------------------------- | ------- | ----- | ---- | -------------------------------------- |
| `tetris`      | `components/games/Tetris.tsx`    | ❌      | ❌    | ❌   | literales hex en el `.tsx`             |
| `asteroids`   | `components/games/Asteroids.tsx` | ❌      | ❌    | ❌   | literales hex en el `.tsx`             |
| `snake`       | `components/games/Snake.tsx`     | ❌      | ❌    | ❌   | literales + sprite `fruits.png`        |
| `arkanoid`    | `components/games/Arkanoid.tsx`  | ❌      | ❌    | ❌   | spritesheet `spritesheet-breakout.png` |
| `duelo-pixel` | —                                | N/A     | N/A   | N/A  | sin componente                         |
| `gloton`      | —                                | N/A     | N/A   | N/A  | sin componente                         |
| `invasores`   | —                                | N/A     | N/A   | N/A  | sin componente                         |
| `ranaria`     | —                                | N/A     | N/A   | N/A  | sin componente                         |

`lib/skins.ts` **todavía no existe**. Ninguna de las paletas está extraída; los colores
siguen como literales hex/rgba dentro de las funciones de dibujo de cada componente.

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

_(vacío — se rellena juego a juego con los hex exactos y su ratio de contraste)_

## Notas de sprites

- **Arkanoid**: casi todo el render sale de `public/games/arkanoid/spritesheet-breakout.png`,
  ya cargado en un canvas offscreen a nivel de módulo. Un skin no-clásico requiere
  **tintar ese offscreen** (`globalCompositeOperation: 'source-atop'`) y cachear el
  resultado en un `Map<SkinId, HTMLCanvasElement>` — el loader es un singleton, así que
  hay que cachear por skin en vez de invalidarlo.
- **Snake**: todo es canvas salvo la fruta (`public/snake-assets/fruits.png`), mismo
  tratamiento de tintado.
- **Asteroids** y **Tetris**: canvas vectorial puro, skin de solo color.
