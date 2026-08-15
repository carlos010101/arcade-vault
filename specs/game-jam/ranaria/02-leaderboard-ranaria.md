# RANARIA — Leaderboard real

> **Status:** Draft
> **Depends on:** SPEC 06, `01-motor-ranaria.md`
> **Date:** 2026-08-15
> **Objective:** Conectar RANARIA al leaderboard real de Supabase: insert real en `scores` desde el modal "FIN DEL JUEGO", top 10 en `/juego/ranaria`, pestaña RANARIA en `/salon` con top 12 y podio tolerante a menos de 3 filas.

## Scope

**In:**

- `handleSaveScore` en `GamePlayerClient.tsx` inserta en `scores` con `game_id: 'ranaria'`, `player_name: name`, `score` cuando `isRanaria` (ya cableado en `01-motor-ranaria.md`, paso 13 de su plan) — este spec verifica el resultado end-to-end, no repite el wiring.
- `app/juego/[id]/page.tsx`: con `'ranaria'` ya agregado al array `['asteroids', 'tetris', 'arkanoid', 'snake', 'ranaria']`, el detalle de `/juego/ranaria` usa `getTopScores('ranaria', 10)` en vez de `getSeededScores`.
- `app/salon/page.tsx`: `getTopScores('ranaria', 12)` pasado como prop `ranariaScores` a `SalonClient`.
- `SalonClient.tsx`: prop `ranariaScores: ScoreRow[]`; rama `if (tab === 'ranaria') return ranariaScores;` en el `useMemo` de `rows`; la pestaña "RANARIA" aparece automáticamente en `hall-tabs` porque itera `games` (ya incluye la fila `ranaria` del catálogo).
- Verificación de que el podio (`rows[0]`/`rows[1]`/`rows[2]` con guard `&&`) y la tabla completa no rompen con 0, 1 o 2 puntuaciones reales de RANARIA.

**Out of scope (para futuros specs):**

- Controles táctiles/mobile.
- Sonido y cualquier balance de dificultad adicional al ya fijado en `01-motor-ranaria.md`.
- Cualquier otro juego del catálogo (`gloton`, `invasores`, `duelo-pixel`).
- Auth real / atar `player_name` a un usuario autenticado.
- Recalcular `best`/`plays` desde `scores`.
- Anti-spam/rate-limiting sobre el insert público en `scores`.

## Data model

No se introducen tablas nuevas: se reutilizan `games` y `scores` tal como quedaron definidas en SPEC 06 (`game_id text references games(id)`, `player_name text`, `score integer`, `created_at timestamptz default now()`, RLS abierta a lectura y escritura pública).

Constantes propias de este juego relevantes para el leaderboard (ya definidas en `01-motor-ranaria.md`, repetidas aquí por completitud):

```ts
// game_id insertado en scores para este juego
const RANARIA_GAME_ID = 'ranaria';

// límites de listado usados por este spec
const DETAIL_TOP_N = 10; // app/juego/ranaria (detalle)
const SALON_TOP_N = 12; // app/salon (pestaña RANARIA)
```

`scores.score` es el entero acumulativo mayor-es-mejor de `RanariaState.score` (avance de filas + nenúfares llenos + bonus de nivel), definido en `01-motor-ranaria.md` — no requiere ninguna conversión adicional para el leaderboard.

## Implementation plan

1. Confirmar que `01-motor-ranaria.md` ya dejó cableado en `GamePlayerClient.tsx`: el gate `isRanaria`, la rama `game_id: 'ranaria'` en `handleSaveScore`, y que el modal "FIN DEL JUEGO" usa el `score` real emitido por `onStateChange` (no un valor simulado).
2. Confirmar en `app/juego/[id]/page.tsx` que `'ranaria'` está en el array que gatea `getTopScores(id, 10)` en vez de `getSeededScores(id.length * 17 + 3, 10)`.
3. Confirmar en `app/salon/page.tsx` que `getTopScores('ranaria', 12)` se resuelve en el `Promise.all` junto a los otros cuatro juegos y se pasa como prop `ranariaScores` a `<SalonClient />`.
4. Confirmar en `SalonClient.tsx` que la firma de props incluye `ranariaScores: ScoreRow[]` y que el `useMemo` de `rows` tiene la rama `if (tab === 'ranaria') return ranariaScores;` antes del fallback `getSeededScores`.
5. Verificación manual con `npm run dev`: jugar una partida completa en `/juego/ranaria/jugar` hasta game over, guardar la puntuación con un nombre de jugador, confirmar el toast "▸ PUNTUACIÓN GUARDADA_"; recargar `/juego/ranaria` y confirmar que la puntuación aparece en el top 10 del detalle; ir a `/salon`, seleccionar la pestaña "RANARIA" y confirmar que la misma puntuación aparece en la tabla, ordenada descendente junto a las demás; repetir con una segunda cuenta/nombre para confirmar el orden correcto entre dos filas; con 0, 1 o 2 filas reales de RANARIA confirmar que el podio de `/salon` no rompe (usa el guard `rows[N] &&`) y que la tabla completa se renderiza sin errores; confirmar que las pestañas de los otros cuatro juegos (ASTEROIDS, TETRIS, ARKANOID, SNAKE) siguen mostrando sus propios datos sin mezclarse con RANARIA.

## Acceptance criteria

- [ ] "GUARDAR PUNTUACIÓN" inserta una fila real en `scores` con `game_id: 'ranaria'`, `player_name` y `score` correctos.
- [ ] `/juego/ranaria` (detalle) refleja la puntuación guardada tras recargar, en el top 10 ordenado descendente por `score`.
- [ ] `/salon` (pestaña RANARIA) refleja la puntuación guardada tras recargar, en el top 12 ordenado descendente por `score`.
- [ ] Con menos de 3 puntuaciones reales de RANARIA, el podio de `/salon` no rompe (usa el guard `rows[N] &&` ya existente).
- [ ] Con 0 puntuaciones reales de RANARIA, la tabla completa de `/salon` (pestaña RANARIA) se renderiza vacía sin errores de runtime.
- [ ] Cambiar de pestaña entre RANARIA y cualquiera de los otros cuatro juegos en `/salon` muestra siempre los datos correctos de cada uno, sin mezclarlos.
- [ ] Ningún otro juego del catálogo cambió de comportamiento en `/salon` ni en su página de detalle.
- [ ] `npm run lint` y `npm run build` pasan sin errores nuevos.

## Decisions taken and discarded

- **No se introducen tablas nuevas**: se reutilizan `games` y `scores` de SPEC 06 tal cual; RANARIA es una fila más de un esquema ya validado por Asteroids/Tetris/Arkanoid/Snake.
- **Persistencia Server Component (fetch) → Client Component (insert directo), sin Route Handlers intermedios**: mismo patrón que el resto del catálogo (SPEC 05/06/09); no se agrega ningún endpoint nuevo para RANARIA.
- **RLS abierta en `scores`**: mismo nivel de exposición que el resto del catálogo; anti-spam/rate-limiting queda fuera de alcance, decisión ya tomada a nivel de proyecto.
- **Leaderboard real siempre, no se reabre por juego**: RANARIA no tiene una variante "solo canvas sin guardar"; se conecta al mismo `scores` desde el primer momento, igual que los cuatro juegos ya portados.
- **Top 10 en detalle / top 12 en salón**: mismos límites que Asteroids/Tetris/Arkanoid/Snake, no hay justificación para que RANARIA use un límite distinto.
- **La pestaña "RANARIA" en `/salon` no requiere cambios en `hall-tabs`**: ya itera sobre `games` (que incluye la fila `ranaria` desde antes de esta jam), solo hace falta que `rows` sepa resolverla a datos reales en vez del fallback `getSeededScores`.

## Identified risks

- **Podio con menos de 3 filas reales**: mitigado por el guard `rows[N] &&` ya existente en `SalonClient.tsx` desde SPEC 06 — se re-verifica explícitamente en el paso 5 del plan para RANARIA en particular, ya que es un juego recién conectado sin historial de puntuaciones.
- **Typo entre el `id` sembrado en `games` y el `id` hardcodeado en el código**: si `game_id: 'ranaria'` en `handleSaveScore` o el filtro `tab === 'ranaria'` en `SalonClient.tsx` no coincidieran exactamente con la fila real, el guardado o la lectura fallarían en silencio (insert a un `game_id` sin fila padre, o pestaña sin datos). Mitigación: pasos 1–4 del plan verifican cada punto de wiring contra el `id` real antes del paso 5 de verificación end-to-end.
- **Mezcla de datos entre pestañas del salón**: si el `useMemo` de `rows` no incluye la rama de RANARIA antes del fallback `getSeededScores`, la pestaña mostraría datos ficticios en vez de reales. Mitigación: paso 4 del plan confirma la rama explícita `tab === 'ranaria'`.
- **Datos ficticios (`getSeededScores`) camuflados como reales**: si `app/juego/[id]/page.tsx` no incluye `'ranaria'` en el array de juegos con leaderboard real, el detalle mostraría puntuaciones inventadas indistinguibles visualmente de las reales. Mitigación: paso 2 del plan verifica explícitamente la inclusión en el array.
- **Desincronía entre el motor (`01-motor-ranaria.md`) y este spec**: si el motor no emite el `score` real vía `onStateChange` antes de abrir el modal "FIN DEL JUEGO", este spec insertaría un valor incorrecto sin que el leaderboard lo detecte. Mitigación: paso 1 del plan confirma la dependencia contra `01-motor-ranaria.md` antes de dar por buena la integración.
