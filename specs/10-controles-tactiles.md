# SPEC 10 — Controles táctiles para móvil

> **Status:** Implementado
> **Depends on:** SPEC 05, SPEC 07, SPEC 08, SPEC 09
> **Date:** 2026-08-16
> **Objective:** Agregar un D-pad + botones de acción en pantalla, visibles solo en dispositivos táctiles, que permitan jugar Asteroids, Tetris, Arkanoid y Snake sin teclado físico, reutilizando el listener `keydown`/`keyup` que cada juego ya tiene en `window`.

## Scope

**In:**

- Nuevo componente genérico `components/TouchControls.tsx` que recibe una configuración de botones por juego y despacha `KeyboardEvent` sintéticos (`keydown`/`keyup`) sobre `window` al presionar/soltar cada botón — mismo evento y `code`/`key` que ya escuchan `Asteroids.tsx`, `Tetris.tsx`, `Arkanoid.tsx` y `Snake.tsx`. Ningún componente de juego se modifica.
- Detección de dispositivo táctil vía feature detection (`navigator.maxTouchPoints > 0 || 'ontouchstart' in window`) en un hook `useIsTouchDevice()` (`lib/use-touch-device.ts`), evaluado en un `useEffect` al montar `GamePlayerClient.tsx` (evita mismatch de hidratación SSR/cliente).
- `TouchControls` se monta condicionalmente dentro de `GamePlayerClient.tsx` (debajo de `.crt`, dentro de `.av-player`) solo cuando `useIsTouchDevice()` es `true`, con el mapeo correspondiente al juego activo (`isAsteroids`/`isTetris`/`isArkanoid`/`isSnake`).
- Mapeo de botones por juego (D-pad de flechas + hasta 2 botones de acción etiquetados):
  - **Asteroids**: D-pad `←`/`→` (rotar), `↑` (empuje) · botón "DISPARAR" (`Espacio`).
  - **Tetris**: D-pad `←`/`→` (mover), `↓` (soft drop) · botón "ROTAR" (`↑`), botón "CAER" (`Espacio`, hard drop).
  - **Arkanoid**: solo D-pad `←`/`→` (mover paleta), sin botones de acción.
  - **Snake**: D-pad de 4 direcciones (`←→↑↓`), sin botones de acción.
- Cada botón del D-pad soporta press-and-hold: `keydown` sintético en `pointerdown`/`touchstart`, `keyup` sintético en `pointerup`/`touchend`/`pointerleave` (para no dejar una tecla "trabada" si el dedo se desliza fuera del botón).
- `touch-action: none` y `preventDefault()` en los handlers de `TouchControls` para evitar scroll/zoom accidental de la página al tocar los botones.
- Estilo visual único (no varía por skin `clasico`/`retro`/`neon`): overlay semitransparente sobre fondo oscuro, estética CRT/neón general del sitio (reutiliza clases `.btn` existentes o variante propia con opacidad reducida), fijo en la parte inferior de `.av-player`.
- Verificación manual en un dispositivo/emulador táctil real (DevTools "Toggle device toolbar" no es suficiente para `maxTouchPoints`; usar un teléfono real o `mcp__playwright` con `hasTouch: true`) para los 4 juegos.

**Out of scope (para futuros specs):**

- Layout responsive general de `/juego/[id]/jugar` (tamaño de canvas, HUD, botones PAUSA/FIN/SALIR en pantallas chicas) — se asume aceptable; si falla, es otro spec.
- Gestos swipe/drag directo sobre el canvas.
- Vibración/haptic feedback al tocar los botones.
- Cambiar el mapeo de teclado físico existente o el contrato `XProps`/`XState`/`XHandle` de los 4 juegos.
- Soporte táctil para pantallas fuera de `/juego/[id]/jugar` (home, biblioteca, salón, about).
- Controles táctiles para juegos aún no implementados (`duelo-pixel`, `gloton`, `invasores`, `ranaria`).
- Ajustar el sistema de skins (`lib/skins.ts`) para que `TouchControls` varíe de paleta.

## Data model

```ts
// lib/use-touch-device.ts
function useIsTouchDevice(): boolean; // false en SSR y en el primer render cliente, true tras el efecto de montaje si aplica

// components/TouchControls.tsx
type TouchButton = {
  key: string; // KeyboardEvent.key, ej. 'ArrowLeft', ' ' (Espacio), 'ArrowUp'
  code: string; // KeyboardEvent.code, ej. 'ArrowLeft', 'Space'
  label: string; // texto del botón de acción, ej. 'DISPARAR' — solo aplica a botones de acción, no al D-pad
};

type TouchControlsConfig = {
  dpad: {
    left?: TouchButton;
    right?: TouchButton;
    up?: TouchButton;
    down?: TouchButton;
  };
  actions: TouchButton[]; // 0 a 2 botones de acción, ej. DISPARAR, ROTAR, CAER
};

type TouchControlsProps = {
  config: TouchControlsConfig;
};
```

No hay cambios a las tablas de Supabase ni a los contratos `XState`/`XProps`/`XHandle` de los juegos existentes.

## Implementation plan

1. Crear `lib/use-touch-device.ts`: hook `useIsTouchDevice()` con `useState(false)` + `useEffect` que evalúa `navigator.maxTouchPoints > 0 || 'ontouchstart' in window` una sola vez al montar.
2. Crear `components/TouchControls.tsx`: recibe `config: TouchControlsConfig`; renderiza el D-pad (grid de hasta 4 botones direccionales, solo los presentes en `config.dpad`) a la izquierda y los botones de `config.actions` a la derecha, estilo overlay fijo semitransparente.
3. Implementar el despachador de eventos: función `dispatchKey(type: 'keydown' | 'keyup', btn: TouchButton)` que hace `window.dispatchEvent(new KeyboardEvent(type, { key: btn.key, code: btn.code, bubbles: true }))`.
4. Cablear cada botón con `onPointerDown` → `dispatchKey('keydown', btn)` + `e.preventDefault()`, y `onPointerUp`/`onPointerLeave`/`onPointerCancel` → `dispatchKey('keyup', btn)`. Usar Pointer Events (no Touch Events) para cubrir mouse y touch con la misma API.
5. Definir las 4 configuraciones (`ASTEROIDS_TOUCH_CONFIG`, `TETRIS_TOUCH_CONFIG`, `ARKANOID_TOUCH_CONFIG`, `SNAKE_TOUCH_CONFIG`) como constantes exportadas desde `components/TouchControls.tsx` o un archivo hermano `lib/touch-configs.ts`, con los mapeos de la sección Scope.
6. En `GamePlayerClient.tsx`: importar `useIsTouchDevice` y `TouchControls` + las 4 configs; agregar `const isTouch = useIsTouchDevice();`; renderizar `{isTouch && <TouchControls config={isAsteroids ? ASTEROIDS_TOUCH_CONFIG : isTetris ? TETRIS_TOUCH_CONFIG : isArkanoid ? ARKANOID_TOUCH_CONFIG : isSnake ? SNAKE_TOUCH_CONFIG : SNAKE_TOUCH_CONFIG}/>}` debajo de `.crt`, antes del modal de fin de partida. Si el juego no es ninguno de los 4 (placeholder), no se renderiza `TouchControls`.
7. Añadir estilos en `app/globals.css` (o módulo CSS si el proyecto prefiere) para `.touch-controls`, `.touch-dpad`, `.touch-action-btn`: overlay semitransparente, `touch-action: none`, tamaño de botón ≥44px (mínimo táctil accesible), posición fija/sticky en la parte inferior de `.av-player` sin tapar el HUD.
8. Verificación con `mcp__playwright` (`browser_navigate` con contexto `hasTouch: true` o emulación de dispositivo) o dispositivo físico: confirmar que `TouchControls` aparece en los 4 juegos con el mapeo correcto, que cada botón mueve/dispara igual que su tecla física equivalente, que press-and-hold funciona (mover mientras se mantiene presionado) y que soltar el dedo fuera del botón no deja la tecla "trabada".
9. Confirmar en un navegador de escritorio sin touch (`maxTouchPoints === 0`) que `TouchControls` NO se renderiza y que nada cambió respecto al comportamiento actual.
10. `npm run lint` y `npm run build` limpios.

## Acceptance criteria

- [x] En un dispositivo/emulador con soporte táctil, al entrar a `/juego/asteroids/jugar`, `/juego/tetris/jugar`, `/juego/arkanoid/jugar` y `/juego/snake/jugar` aparece un D-pad + botones de acción en pantalla.
- [x] En un navegador de escritorio sin soporte táctil, `TouchControls` no se renderiza y el layout es idéntico al actual.
- [x] Cada botón del D-pad reproduce el mismo efecto que su tecla física equivalente (Asteroids: rotar/empuje; Tetris: mover/soft drop; Arkanoid: mover paleta; Snake: cambiar dirección).
- [x] Los botones de acción (DISPARAR en Asteroids; ROTAR y CAER en Tetris) reproducen el mismo efecto que `Espacio`/`↑` físicos.
- [x] Mantener presionado un botón del D-pad produce movimiento continuo (press-and-hold), igual que mantener presionada la tecla física.
- [x] Deslizar el dedo fuera de un botón sin soltar (`pointerleave`) no deja la tecla "trabada" (se dispara `keyup`).
- [x] Tocar los botones no hace scroll ni zoom de la página.
- [x] Los botones de `TouchControls` no tapan visualmente el HUD (Puntuación/Vidas/Nivel) ni los botones PAUSA/FIN/SALIR.
- [x] Ningún componente de juego (`Asteroids.tsx`, `Tetris.tsx`, `Arkanoid.tsx`, `Snake.tsx`) fue modificado.
- [x] `npm run lint` y `npm run build` pasan sin errores nuevos.

## Decisions taken and discarded

- **Simular `KeyboardEvent` en `window` en vez de extender el contrato `XProps`**: los 4 componentes de juego ya escuchan `keydown`/`keyup` en `window` (confirmado en `Asteroids.tsx:663-664`, `Snake.tsx:353`); reutilizar ese canal evita tocar `Asteroids.tsx`, `Tetris.tsx`, `Arkanoid.tsx` y `Snake.tsx`, manteniendo el cambio aislado a dos archivos nuevos + `GamePlayerClient.tsx`. Decisión explícita del usuario tras comparar con la alternativa de una prop `onTouchInput`.
- **D-pad + botones fijos en vez de gestos swipe**: decisión explícita del usuario; más predecible para juegos de reacción rápida (Arkanoid, Asteroids) y mapea 1:1 a las teclas ya definidas por cada juego.
- **Detección por feature detection (`maxTouchPoints`/`ontouchstart`), no por media query de ancho**: decisión explícita del usuario; cubre tablets y laptops híbridas táctiles que una media query de breakpoint no distinguiría de una laptop sin touch en pantalla ancha.
- **Un solo estilo visual neutro para `TouchControls`, sin variar por skin**: decisión explícita del usuario; evita acoplar este spec al sistema de skins (`lib/skins.ts`, `@skin-designer`), que es una pieza separada del proyecto.
- **Los 4 juegos implementados en un solo spec**: decisión explícita del usuario; comparten el mismo punto de integración (`GamePlayerClient.tsx`) y el mismo componente genérico `TouchControls`, por lo que separarlos en 4 specs no aportaría aislamiento real.
- **Layout responsive general fuera de alcance**: decisión explícita del usuario; este spec solo agrega el input táctil, asumiendo que el layout actual de `/juego/[id]/jugar` ya es usable en pantallas chicas. Si no lo es, corresponde a un spec aparte.
- **Pointer Events en vez de Touch Events**: `onPointerDown`/`onPointerUp`/`onPointerLeave` cubren mouse y touch con la misma API sin duplicar handlers, y son el estándar recomendado por Next.js/React para este caso desde hace varias versiones.

## Identified risks

- **Tecla "trabada" si se pierde el evento de soltar**: si el dedo se desliza fuera del botón y solo se escucha `onPointerUp` (no `onPointerLeave`/`onPointerCancel`), el juego podría seguir recibiendo el input indefinidamente. Mitigación: el paso 4 del plan cablea los tres eventos de salida al mismo `dispatchKey('keyup', ...)`.
- **`navigator.maxTouchPoints` disponible en SSR**: acceder a `navigator`/`window` fuera de un `useEffect` rompe el render en servidor. Mitigación: el hook `useIsTouchDevice()` inicializa en `false` y solo evalúa el valor real dentro de `useEffect` (paso 1), igual que el patrón ya usado para sincronizar `skin` desde `localStorage` en `GamePlayerClient.tsx`.
- **Falsos negativos en laptops táctiles con mouse conectado**: un dispositivo con `maxTouchPoints > 0` pero uso principal de mouse/teclado seguiría viendo el overlay táctil. Aceptado como fuera de alcance — no se pidió un toggle manual para ocultar `TouchControls`.
- **Botones demasiado pequeños para dedos**: un tamaño de botón menor a ~44px es difícil de presionar con precisión. Mitigación: el paso 7 del plan fija un mínimo de 44px por botón.
- **Overlay tapando el HUD o el canvas en pantallas muy pequeñas**: sin probar en un viewport angosto real, el D-pad podría solaparse con `.crt-screen` o el HUD. Mitigación: verificación manual explícita en el paso 8/9 y criterio de aceptación dedicado.
