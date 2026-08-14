# SPEC 05 — Integración del juego real de Asteroids

> **Status:** Implementado
> **Depends on:** SPEC 01
> **Date:** 2026-08-13
> **Objective:** Renombrar la entrada del catálogo `rocas`/`ROCAS` a `asteroids`/`ASTEROIDS` y portar el juego standalone de `references/started-games/02-asteroids/game.js` a un componente React (`components/games/Asteroids.tsx`) conectado a `/juego/asteroids/jugar`, reemplazando la simulación falsa solo para ese juego, sin tocar el resto del catálogo.

## Scope

**In:**

- Renombrar en `lib/app-data.ts` la entrada del catálogo de `id: "rocas"` / `title: "ROCAS"` a `id: "asteroids"` / `title: "ASTEROIDS"`. El campo `cover: "cover-rocas"` se mantiene sin cambios (es solo una clase CSS decorativa ya definida en `app/globals.css`, no un identificador funcional). Esto cambia la ruta pública de `/juego/rocas` y `/juego/rocas/jugar` a `/juego/asteroids` y `/juego/asteroids/jugar`.
- Nuevo componente `components/games/Asteroids.tsx`: canvas 800×600 con la lógica completa portada de `game.js` (clases `Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle`; utilidades `wrap`, `dist`, `rand`, `randInt`; manejo de input; loop `requestAnimationFrame`; colisiones; niveles; power-up de disparo triple).
- El componente expone:
  - Prop `paused: boolean` — congela el avance de `update(dt)` sin cancelar el loop de dibujo.
  - Prop `onStateChange(state: { score: number; lives: number; level: number; gameOver: boolean }) => void` — se invoca cuando cambia alguno de esos valores.
  - Un handle vía `forwardRef` + `useImperativeHandle`: `{ forceGameOver(): void; restart(): void }`.
- Modificación de `app/juego/[id]/jugar/page.tsx`: cuando `game.id === "asteroids"`, se monta `Asteroids` dentro de `.crt-screen` en lugar del bloque falso (`.game-arena`, `.enemy`, `.player-ship`), y los botones existentes ("PAUSA", "FIN", "JUGAR DE NUEVO", "SALIR") controlan el juego real en vez del `setInterval` simulado. El `level` mostrado en el HUD pasa a venir del juego real (no de `Math.floor(score / 2500)`) solo para este juego.
- Listeners de teclado (`ArrowLeft/Right/Up`, `Space`) agregados al montar el componente y removidos al desmontar, con `preventDefault()` para que no hagan scroll de la página.
- Se deshabilita el reinicio automático por tecla Espacio que el juego original dispara en `state === 'gameover'`: el reinicio pasa a estar controlado exclusivamente por el botón "JUGAR DE NUEVO" del HUD vía `restart()`.

**Out of scope (para futuros specs):**

- Cualquier otro juego del catálogo (`bloque-buster`, `caida`, `serpentina`, `gloton`, `invasores`, `ranaria`, `duelo-pixel`): siguen usando exactamente la pantalla simulada actual, sin cambios.
- Un framework/convención genérica para portar futuros juegos reales — se decide caso por caso cuando exista un segundo juego real.
- Persistencia real de puntuaciones (Supabase o localStorage): "GUARDAR PUNTUACIÓN" sigue siendo puramente visual (`setSaved(true)`), igual que hoy. Depende de las tablas de `scores` que SPEC 04 dejó explícitamente fuera de alcance.
- Controles táctiles / soporte mobile: el juego sigue siendo solo de teclado, como el original.
- Sonido, balance de dificultad, o cualquier cambio a las constantes de juego (`SPEEDS`, `POINTS`, `RADII`, etc.) respecto al original.
- Cualquier otro cambio a `lib/app-data.ts` más allá del renombre de `id`/`title` (no se toca `short`, `long`, `cat`, `cover`, `color`, `best`, `plays`).

## Data model

No se introduce persistencia ni tablas nuevas. Se introduce un contrato de props/ref interno entre el componente de juego y la pantalla que lo aloja:

```ts
type AsteroidsState = {
  score: number;
  lives: number;
  level: number;
  gameOver: boolean;
};

type AsteroidsProps = {
  paused: boolean;
  onStateChange: (state: AsteroidsState) => void;
};

type AsteroidsHandle = {
  forceGameOver: () => void;
  restart: () => void;
};
```

## Implementation plan

1. En `lib/app-data.ts`, cambiar la entrada actual `{ id: "rocas", title: "ROCAS", ... }` a `{ id: "asteroids", title: "ASTEROIDS", ... }` (resto de campos sin cambios).
2. Crear `components/games/Asteroids.tsx`: portar constantes (`RADII`, `SPEEDS`, `POINTS`, `POWERUP_*`, `TRIPLE_SPREAD`) y clases (`Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle`) desde `references/started-games/02-asteroids/game.js`, junto con `wrap`, `dist`, `rand`, `randInt`. El estado mutable del juego (`ship`, `bullets`, `asteroids`, `particles`, `powerUps`, `score`, `lives`, `level`, `state`, `deadTimer`, `keys`, `justPressed`) vive en `useRef`, no en `useState`, para no re-renderizar React en cada frame.
3. Canvas con atributos `width={800} height={600}` y estilos `width: 100%; height: 100%; display: block;` para escalar dentro de `.crt-screen` (su `aspect-ratio: 4/3` ya coincide con 800:600).
4. Implementar la prop `paused`: cuando es `true`, el loop sigue llamando a `requestAnimationFrame` y a `draw()`, pero no llama a `update(dt)`.
5. Implementar `onStateChange`: en cada frame, comparar `{score, lives, level, gameOver: state === 'gameover'}` contra el último valor emitido (guardado en un `ref`) y llamar al callback solo si cambió algo.
6. Exponer `forwardRef` + `useImperativeHandle` con `forceGameOver()` (fuerza `state = 'gameover'` internamente, dispara `explode`/lógica de muerte si corresponde) y `restart()` (reinicializa todo el estado interno igual que `initGame()` del original).
7. Quitar/neutralizar el bloque del original que escucha `pressed('Space')` durante `state === 'gameover'` para reiniciar solo — el reinicio ahora solo ocurre vía `restart()` desde React.
8. `useEffect` de montaje: agrega listeners `keydown`/`keyup` en `window` con `preventDefault()` para `ArrowLeft`, `ArrowRight`, `ArrowUp`, `Space`; arranca el loop con `requestAnimationFrame`. Cleanup: remueve los listeners y hace `cancelAnimationFrame`.
9. Modificar `app/juego/[id]/jugar/page.tsx`: agregar un `gameRef = useRef<AsteroidsHandle>(null)`; cuando `game.id === "asteroids"`, renderizar `<Asteroids ref={gameRef} paused={paused} onStateChange={(s) => { setScore(s.score); setLives(s.lives); if (s.gameOver) setOver(true); }} />` dentro de `.crt-screen`, en lugar de `.game-arena`. Para cualquier otro `id`, el JSX y el `setInterval` simulados actuales quedan intactos.
10. Conectar botones existentes para `asteroids`: "FIN" llama a `gameRef.current?.forceGameOver()` (en vez de `setOver(true)` directo); "JUGAR DE NUEVO" llama a `gameRef.current?.restart()` además de resetear `saved`/`name`/`paused` en React. "PAUSA" y "SALIR" no cambian (ya controlan `paused` y navegan fuera, respectivamente).
11. El HUD de `level` usa el valor recibido por `onStateChange` cuando `game.id === "asteroids"`; para el resto de juegos se mantiene `1 + Math.floor(score / 2500)`.
12. Verificar manualmente en `npm run dev`: entrar a `/juego/asteroids/jugar`, mover la nave y disparar, destruir asteroides y ver el score/HUD actualizarse, perder una vida y ver el respawn con parpadeo, pausar y reanudar, terminar la partida por vidas agotadas y también con el botón "FIN", reiniciar con "JUGAR DE NUEVO", salir con "SALIR" y confirmar que las flechas ya no interactúan con el juego ni con el scroll en otra pantalla (ej. `/biblioteca`) después de salir.

## Acceptance criteria

- [x] `components/games/Asteroids.tsx` existe y renderiza un canvas jugable con teclado (`←`/`→` rotar, `↑` propulsar, `Espacio` disparar).
- [x] En `/juego/asteroids/jugar`, el HUD ("Puntuación", "Vidas", "Nivel") refleja en tiempo real el estado interno del juego real, no valores aleatorios.
- [x] Destruir un asteroide grande lo divide en dos medianos, y un mediano en dos pequeños, igual que el original; los pequeños no se dividen.
- [x] Perder las 3 vidas dispara el modal "FIN DEL JUEGO" existente con la puntuación final real.
- [x] El botón "FIN" del HUD termina la partida inmediatamente y abre el mismo modal.
- [x] El botón "PAUSA"/"REANUDAR" congela y reanuda el movimiento del juego real (la nave y los asteroides dejan de moverse en pausa).
- [x] El botón "JUGAR DE NUEVO" del modal reinicia completamente el juego real (score en 0, 3 vidas, nivel 1, nuevos asteroides) y cierra el modal.
- [x] El botón "SALIR" navega a `/juego/asteroids` y no deja listeners de teclado activos (verificar que las flechas no afecten otras pantallas después de salir).
- [x] Ningún otro juego del catálogo (`/juego/<otro-id>/jugar`) cambió de comportamiento respecto al estado actual (simulación falsa intacta).
- [x] `npm run lint` y `npm run build` pasan sin errores nuevos.

## Decisions taken and discarded

- **Se renombra el catálogo de "ROCAS" a "ASTEROIDS"**: aclaración del usuario — el juego que se porta es Asteroids, y "ROCAS" era un nombre placeholder del mock. Solo se toca `id`/`title`; el resto de `lib/app-data.ts` no cambia.
- **Alcance limitado a "ASTEROIDS", no un framework para todo el catálogo**: decisión explícita del usuario — es "el primer juego real"; generalizar la integración ahora sería diseñar para juegos que todavía no existen en código real.
- **El canvas comunica su estado a React vía callback (`onStateChange`), no vía polling por ref**: más simple y evita que `page.tsx` tenga que leer estado del juego en un intervalo separado; React solo reacciona a cambios reales.
- **Se deshabilita el auto-reinicio por Espacio del juego original en `state === 'gameover'`**: en el original, Espacio reinicia la partida sola. Aquí el reinicio ahora lo dispara el botón "JUGAR DE NUEVO" del modal de React (que también captura nombre/guardado de puntuación); dejar el atajo de teclado activo reiniciaría el canvas por debajo del modal y desincronizaría el estado de React del estado interno del juego.
- **Persistencia de puntuación sigue simulada**: consistente con SPEC 04, que dejó las tablas de `scores` explícitamente fuera de alcance hasta que existan decisiones de auth/datos reales.
- **El canvas se monta dentro del `.crt-screen` existente, sin nuevo marco visual**: reutiliza el chrome ya construido (bisel, scanlines, `.crt-bottom`) en vez de duplicar estilos.

## Identified risks

- **Fuga de listeners de teclado entre pantallas:** si el `useEffect` de cleanup no remueve `keydown`/`keyup` al desmontar, las flechas/Espacio podrían seguir interceptadas (con `preventDefault`) en otras rutas tras salir del juego. Mitigación: cleanup explícito verificado en el paso 11 del plan.
- **Loop de canvas fantasma tras desmontar:** sin `cancelAnimationFrame` en el cleanup, el loop seguiría corriendo en memoria (consumo de CPU, posibles errores si intenta dibujar en un canvas ya desmontado) al navegar fuera de `/juego/asteroids/jugar`. Mitigación: cancelar el `requestAnimationFrame` en el cleanup del `useEffect` de montaje.
- **Desincronía entre el modal de React y el reinicio interno del canvas:** si se deja el atajo de Espacio original activo en `state === 'gameover'`, el usuario podría reiniciar el canvas mientras el modal de "GUARDAR PUNTUACIÓN" sigue abierto con datos viejos. Mitigación: decisión ya tomada arriba de deshabilitar ese atajo.
