# Móvil en Arcade Vault — auditorías

> Memoria del subagente `@mobile-porter` (`.claude/agents/mobile-porter.md`).
> Última actualización: **2026-08-17** · Estado: **sembrada desde exploración estática · ningún juego auditado con Playwright todavía**

Esta memoria arranca sembrada con hallazgos detectados por **inspección estática** de
`app/globals.css`, `app/layout.tsx` y `components/games/*.tsx` (sin recorrer el sitio
en un navegador todavía). La primera ejecución real de `@mobile-porter` debe **verificar
cada fila con Playwright** (medir, no dar por bueno) y actualizar estado/evidencia.

## Contexto que no hay que reabrir

- `specs/10-controles-tactiles.md` (Implementado) ya resolvió el input táctil de los 4
  juegos (D-pad + botones de acción, press-and-hold, `keyup` en `pointerleave`, botones
  ≥44px, `touch-action: none`) y **dejó fuera de alcance explícitamente** el layout
  responsive general de `/juego/[id]/jugar`. Esta memoria cubre justo ese vacío.
- `app/globals.css` tiene `body { overflow-x: hidden }` — enmascara desbordes:
  `document.documentElement.scrollWidth` puede salir limpio con elementos claramente
  cortados. Medir por elemento (`getBoundingClientRect().right > innerWidth`), no por
  `scrollWidth`.
- `useIsTouchDevice()` (`lib/use-touch-device.ts`) evalúa `maxTouchPoints`/
  `ontouchstart`, no el ancho de ventana. Un escritorio redimensionado a 375px nunca
  muestra `TouchControls`; auditar esa pieza exige contexto `hasTouch: true`.
- `app/layout.tsx` no declara `export const viewport` (solo `export const metadata`).

## Estado por juego

| Juego       | 360×640     | 390×844     | Landscape   | Tablet      | Veredicto   | Última auditoría |
| ----------- | ----------- | ----------- | ----------- | ----------- | ----------- | ---------------- |
| asteroids   | Sin auditar | Sin auditar | Sin auditar | Sin auditar | Sin auditar | —                |
| tetris      | Sin auditar | Sin auditar | Sin auditar | Sin auditar | Sin auditar | —                |
| arkanoid    | Sin auditar | Sin auditar | Sin auditar | Sin auditar | Sin auditar | —                |
| snake       | Sin auditar | Sin auditar | Sin auditar | Sin auditar | Sin auditar | —                |
| duelo-pixel | N/A         | N/A         | N/A         | N/A         | N/A         | sin componente   |
| gloton      | N/A         | N/A         | N/A         | N/A         | N/A         | sin componente   |
| invasores   | N/A         | N/A         | N/A         | N/A         | N/A         | sin componente   |
| ranaria     | N/A         | N/A         | N/A         | N/A         | N/A         | sin componente   |

## Breakpoints canónicos del proyecto

Estado de partida: **8 breakpoints ad-hoc**, todos `max-width`, sin variables CSS que
los centralicen. Candidatos a consolidar en 2–3 breakpoints reales una vez auditado.

| `max-width` | `app/globals.css:línea` | Qué afecta                                                                            |
| ----------- | ----------------------- | ------------------------------------------------------------------------------------- |
| 520px       | 1974                    | `.feature-grid` → 1 columna                                                           |
| 520px       | 2304                    | `.tick-row` → `1fr auto`                                                              |
| 600px       | 2040                    | `.mini-rail` → 2 columnas                                                             |
| 720px       | 1538                    | `.podium` → 1 columna                                                                 |
| 720px       | 1678                    | `.hall-table`, padding de `.av-grid`/`.av-hero`/`.av-filters`/`.av-hall`/`.av-detail` |
| 720px       | 2105                    | `.stats-inner` → 1 columna                                                            |
| 720px       | 2118                    | `.stat-block` borde izq. → borde sup.                                                 |
| 820px       | 2579                    | `.highlight-row` → 1 columna                                                          |
| 840px       | 302                     | `.av-nav`: oculta `.links`/`.coin-counter`, muestra `.hamburger`                      |
| 900px       | 859                     | `.av-detail` → 1 columna                                                              |
| 900px       | 2211                    | `.activity-grid` → 1 columna                                                          |
| 900px       | 2399                    | `.pricing-grid` → 1 columna                                                           |
| 900px       | 2675                    | `.contact-grid` → 1 columna                                                           |
| 980px       | 1969                    | `.feature-grid` 4→2 columnas                                                          |
| 1100px      | 2035                    | `.mini-rail` 6→3 columnas                                                             |

**Sin ninguna regla móvil** (confirmado por inspección estática, verificar con Playwright):
`.av-player`, `.crt`, `.crt-bottom`, `.hud-actions`, `.touch-controls`/`.touch-dpad`,
`.modal`, `.home-hero`, `.av-filters`/`.av-search`, footer de `app/layout.tsx`,
`.stat-strip`, `.lb-row`.

## Hallazgos abiertos

| #   | Ruta                                       | Severidad | Síntoma                                                                                                                                                                      | Arreglo propuesto                                                                    | Estado  |
| --- | ------------------------------------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------- |
| 1   | `/juego/[id]/jugar`                        | Grave     | `.hud-actions` (`globals.css:1029`) es `display:flex` sin `flex-wrap`, con hasta 6 controles (3 skins + PAUSA + FIN + SALIR); en 360–390px de ancho no caben en una fila     | Añadir `flex-wrap: wrap` + media query que reordene/apile en ≤640px                  | Abierto |
| 2   | `/juego/tetris/jugar`                      | Grave     | `.touch-controls`/`.touch-dpad` (`globals.css:1126-1201`): D-pad de 3×48px + 2 botones de acción (ROTAR, CAER) suman ~398px de ancho mínimo, mayor que 360–375px de viewport | Reducir tamaño de celda del D-pad en móvil chico o usar barra fija de ancho completo | Abierto |
| 3   | `/juego/[id]/jugar`                        | Grave     | `.av-player` (`globals.css:989`) y `.crt` (`:1035`) tienen padding fijo (24px+24px) sin media query; reduce aún más el área jugable en pantallas chicas                      | Media query ≤640px que reduzca `.av-player`/`.crt` padding                           | Abierto |
| 4   | `/juego/[id]`                              | Grave     | `.stat-strip` (`globals.css:902`, grid de 3 columnas) sin ninguna regla móvil; texto Press Start 2P a 16px en columnas ~104px de ancho a 375px                               | Media query que apile o reduzca columnas                                             | Abierto |
| 5   | `/juego/[id]`                              | Menor     | `.lb-row` (`globals.css:949`, `36px 1fr 110px`) sin regla móvil; verificar legibilidad de nombre/score en 360px                                                              | Confirmar con Playwright antes de tocar                                              | Abierto |
| 6   | `/salon`                                   | Menor     | `.hall-table` (regla en `globals.css:1681` a ≤720px) deja poco ancho a la columna de nombre tras fijar el resto de columnas                                                  | Confirmar con Playwright cuánto se corta el nombre en 360px                          | Abierto |
| 7   | `/juego/[id]/jugar` (modal fin de partida) | Menor     | `.modal .input-row` (`globals.css:1324`) es fila no envolvente de input + botón «GUARDAR PUNTUACIÓN»                                                                         | Media query que la ponga en columna en ≤400px                                        | Abierto |
| 8   | `/`                                        | Menor     | `.home-hero` (`globals.css:1774`) usa `100vh`; en iOS Safari la barra de URL causa salto/recorte                                                                             | Cambiar a `100svh`/`100dvh`                                                          | Abierto |
| 9   | Global                                     | Menor     | `app/layout.tsx` no declara `export const viewport`; footer inline con padding fijo `20px 32px`                                                                              | Añadir `export const viewport` (`width: 'device-width'`, `initialScale: 1`)          | Abierto |
| 10  | `/juego/[id]/jugar`                        | Menor     | Canvas de los 4 juegos con backing store fijo (800×600, Tetris `COLS*BLOCK`) sin `devicePixelRatio`; preview de «siguiente pieza» de Tetris en CSS fijo (no escala)          | Confirmar nitidez/recorte real con Playwright antes de proponer fix                  | Abierto |
| 11  | Todas                                      | Menor     | `components/Nav.tsx`: panel móvil sin `Escape`, sin focus trap, sin `aria-expanded`, sin bloqueo de scroll; links tabulables con el panel cerrado                            | Añadir manejo de teclado/a11y al panel                                               | Abierto |

## Hallazgos cerrados

_(ninguno todavía)_

## Historial

- 2026-08-17 — Memoria creada y sembrada por inspección estática (sin Playwright) al
  crear el subagente `@mobile-porter`. Pendiente: primera auditoría real con
  Playwright sobre los 4 juegos implementados.
