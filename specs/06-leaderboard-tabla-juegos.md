# SPEC 06 — Leaderboard real y tabla de juegos en Supabase

> **Status:** Aprobado
> **Depends on:** SPEC 04, SPEC 05
> **Date:** 2026-08-13
> **Objective:** Migrar el catálogo de juegos (hoy el array estático `GAMES` de `lib/app-data.ts`) a una tabla `games` en Supabase y agregar una tabla `scores` que persista puntuaciones reales de ASTEROIDS, conectando biblioteca, home, salón de la fama y detalle de juego a esos datos reales.

## Scope

**In:**

- Tabla `games` en Supabase, seedeada con los 8 juegos actuales de `lib/app-data.ts` (mismos `id`/`title`/`short`/`long`/`cat`/`cover`/`color`/`best`/`plays`).
- Tabla `scores` en Supabase, vacía al crearse, que recibe una fila por cada partida guardada de ASTEROIDS (`game_id`, `player_name`, `score`, `created_at`).
- RLS habilitada en ambas tablas con políticas públicas: lectura pública en `games` y `scores`; escritura (insert) pública en `scores`. `games` no tiene insert público (se llena solo por la migración de seed).
- `lib/games.ts` nuevo: tipo `Game`, y funciones `getGames()`, `getGame(id)`, `getTopScores(gameId, limit)` que consultan Supabase con el cliente de servidor (`lib/supabase/server.ts`).
- `lib/app-data.ts` pierde el tipo `Game` y el export `GAMES`; conserva `CATEGORIES`, `PLAYER_NAMES`, `ScoreRow` y `getSeededScores` (se siguen usando para todo juego que no sea ASTEROIDS).
- Conversión a patrón Server Component (fetch) + Client Component (interacción, recibe datos por props) en las cuatro pantallas que hoy importan `GAMES` o `getSeededScores` directamente: `app/page.tsx`, `app/biblioteca/page.tsx`, `app/salon/page.tsx`, `app/juego/[id]/jugar/page.tsx`. `app/juego/[id]/page.tsx` ya es Server Component: solo cambia su fuente de datos.
- El botón "GUARDAR PUNTUACIÓN" del modal de fin de partida, únicamente cuando `game.id === "asteroids"`, inserta una fila real en `scores` vía el cliente de navegador de Supabase (`lib/supabase/client.ts`). Para cualquier otro juego, el botón sigue siendo puramente visual (`setSaved(true)`), sin insert.
- El Salón de la Fama y el panel de detalle muestran las puntuaciones reales de `scores` solo para la pestaña/juego ASTEROIDS; para el resto de juegos siguen usando `getSeededScores` exactamente como hoy.

**Out of scope (para futuros specs):**

- Supabase Auth real: el nombre del jugador al guardar sigue siendo el input de texto libre del modal (`INVITADO` o `user.name` si hay sesión falsa como valor inicial), no un usuario autenticado. `app/auth/page.tsx` y `lib/session-context.tsx` no se tocan.
- Guardar puntuaciones reales de cualquier juego que no sea ASTEROIDS (siguen siendo simulación, sin tabla `scores` real para ellos).
- Recalcular `best`/`plays` de `games` a partir de `scores` (quedan como columnas estáticas, igual que el seed).
- Cualquier control anti-spam o rate limiting sobre el insert público de `scores` (la política RLS es intencionalmente abierta, igual de expuesta que el botón falso actual).
- Edición o borrado de juegos/puntuaciones (no hay UI de administración).
- Paginación del leaderboard (se sigue usando un límite fijo, como hoy con `getSeededScores(..., 12)` / `getSeededScores(..., 10)`).

## Data model

```sql
create table public.games (
  id text primary key,
  title text not null,
  short text not null,
  long text not null,
  cat text not null check (cat in ('ARCADE','PUZZLE','SHOOTER','VERSUS')),
  cover text not null,
  color text not null check (color in ('cyan','magenta','yellow','green')),
  best integer not null,
  plays text not null
);

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references public.games(id),
  player_name text not null,
  score integer not null,
  created_at timestamptz not null default now()
);

alter table public.games enable row level security;
alter table public.scores enable row level security;

create policy "games are publicly readable" on public.games
  for select using (true);

create policy "scores are publicly readable" on public.scores
  for select using (true);

create policy "scores are publicly insertable" on public.scores
  for insert with check (true);
```

```ts
// lib/games.ts
export type Game = {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: 'ARCADE' | 'PUZZLE' | 'SHOOTER' | 'VERSUS';
  cover: string;
  color: 'cyan' | 'magenta' | 'yellow' | 'green';
  best: number;
  plays: string;
};

export async function getGames(): Promise<Game[]>;
export async function getGame(id: string): Promise<Game | null>;
// mapea filas de `scores` (ordenadas por score desc, limitadas) al shape ScoreRow
// existente ({ rank, name, score, date }), formateando created_at como dd/mm/yyyy.
export async function getTopScores(
  gameId: string,
  limit?: number,
): Promise<import('@/lib/app-data').ScoreRow[]>;
```

## Implementation plan

1. Vía `mcp__supabase__apply_migration` sobre el proyecto `crkexepgfehipluoeyqc`: crear `games` y `scores`, habilitar RLS con las tres políticas de arriba, e insertar (`insert into public.games ...`) los 8 juegos actuales de `lib/app-data.ts` con sus valores exactos.
2. Crear `lib/games.ts` con el tipo `Game` y `getGames()`/`getGame(id)`/`getTopScores(gameId, limit)`, usando `createClient()` de `lib/supabase/server.ts`.
3. En `lib/app-data.ts`, eliminar el tipo `Game` y el export `GAMES`; dejar intactos `CATEGORIES`, `PLAYER_NAMES`, `ScoreRow`, `getSeededScores`.
4. En `components/GameCard.tsx`, cambiar el import de `Game` de `@/lib/app-data` a `@/lib/games`.
5. Convertir `app/biblioteca/page.tsx` en Server Component `async`: llama a `getGames()` y renderiza `app/biblioteca/BibliotecaClient.tsx` (nuevo archivo, `'use client'`) pasándole `games` como prop; mover ahí intacta la lógica actual de búsqueda/filtro por categoría.
6. Convertir `app/page.tsx` en Server Component `async`: llama a `getGames()` y renderiza `app/HomeClient.tsx` (nuevo archivo, `'use client'`) pasándole `games` como prop; mover ahí intacto el resto del contenido/interactividad de la home, y la preview usa `games.slice(0, 6)` desde la prop en vez de importar `GAMES`.
7. En `app/juego/[id]/page.tsx`, cambiar `GAMES.find((g) => g.id === id)` por `await getGame(id)`, y las puntuaciones: si `id === "asteroids"`, `await getTopScores("asteroids", 10)`; para cualquier otro `id`, se mantiene `getSeededScores(id.length * 17 + 3, 10)` como hoy.
8. Convertir `app/salon/page.tsx` en Server Component `async`: llama a `getGames()` y `getTopScores("asteroids", 12)`, y renderiza `app/salon/SalonClient.tsx` (nuevo archivo, `'use client'`) pasándole `games` y `asteroidsScores` como props. Dentro, la lógica de tabs se mantiene: `rows` es `asteroidsScores` cuando `tab === "asteroids"`, o `getSeededScores(tab.length * 23 + 7, 12)` para cualquier otro tab, igual que hoy. Si `asteroidsScores` tiene menos de 3 filas (leaderboard real aún vacío o con pocas partidas), el podio oculta los slots sin datos en vez de acceder a `rows[1]`/`rows[2]` `undefined`.
9. Convertir `app/juego/[id]/jugar/page.tsx` en Server Component `async`: llama a `await getGame(id)` (`notFound()` si no existe) y renderiza `app/juego/[id]/jugar/GamePlayerClient.tsx` (nuevo archivo, `'use client'`) pasándole `game` como prop; mover ahí intacta toda la lógica actual (HUD, montaje de `Asteroids`, modal de fin de partida) tal cual está hoy en el archivo actual.
10. Dentro de `GamePlayerClient`, en el handler de "GUARDAR PUNTUACIÓN": si `isAsteroids`, llamar a `createClient()` de `lib/supabase/client.ts` y ejecutar `supabase.from('scores').insert({ game_id: 'asteroids', player_name: name, score })`; en éxito, `setSaved(true)`; en error, mostrar el mensaje de error en el propio input row (sin marcar `saved`) para permitir reintentar. Para cualquier otro juego, el handler no cambia: sigue siendo solo `setSaved(true)`.
11. Verificación manual con `npm run dev`: la home, biblioteca, salón y detalle de cada juego cargan datos desde Supabase (`mcp__supabase__list_tables` muestra `games` con 8 filas). Jugar una partida de ASTEROIDS, terminarla, guardar la puntuación, y confirmar que aparece en la pestaña "ASTEROIDS" del Salón de la Fama y en el panel de detalle de `/juego/asteroids` tras recargar. Confirmar que el resto de juegos siguen mostrando datos seedeados sin cambios de comportamiento.

## Acceptance criteria

- [ ] `mcp__supabase__list_tables` muestra `games` (8 filas) y `scores` (0 filas antes de jugar).
- [ ] `lib/app-data.ts` ya no exporta `Game` ni `GAMES`; `npm run build` compila sin errores de tipos en ningún archivo que antes los importaba.
- [ ] `app/page.tsx`, `app/biblioteca/page.tsx`, `app/salon/page.tsx`, `app/juego/[id]/page.tsx` y `app/juego/[id]/jugar/page.tsx` obtienen los juegos desde `lib/games.ts` (Supabase), no desde un array estático.
- [ ] La biblioteca (`/biblioteca`) sigue filtrando por búsqueda y categoría igual que hoy, ahora sobre los 8 juegos leídos de Supabase.
- [ ] La home (`/`) muestra la preview de 6 juegos leída de Supabase.
- [ ] Jugar una partida de ASTEROIDS y presionar "GUARDAR PUNTUACIÓN" inserta una fila nueva en `scores` con el `player_name` y `score` correctos.
- [ ] Tras guardar una puntuación de ASTEROIDS, el Salón de la Fama (`/salon`, pestaña "ASTEROIDS") y el detalle (`/juego/asteroids`) la reflejan al recargar la página, ordenada por puntuación descendente.
- [ ] Con menos de 3 puntuaciones reales guardadas para ASTEROIDS, el podio del Salón de la Fama no rompe (no muestra `undefined`) — oculta los slots sin datos.
- [ ] Para cualquier juego que no sea ASTEROIDS, el Salón de la Fama y el detalle siguen mostrando exactamente los mismos datos seedeados (`getSeededScores`) que antes de esta spec, y "GUARDAR PUNTUACIÓN" no inserta nada en `scores`.
- [ ] `npm run lint` y `npm run build` pasan sin errores nuevos.

## Decisions taken and discarded

- **`games` pasa a vivir en Supabase (no queda como array estático)**: es lo que el usuario pidió explícitamente como "tabla de juegos" — decisión confirmada en la fase de preguntas.
- **El leaderboard no requiere Auth real**: SPEC 04 dejó Auth explícitamente fuera de alcance; forzarlo aquí habría inflado este spec con login/registro real y políticas RLS por usuario. El nombre del jugador sigue siendo texto libre del input existente.
- **Solo ASTEROIDS guarda puntuaciones reales**: es el único juego con lógica real (SPEC 05); el resto sigue siendo simulación visual, así que un `scores` real para ellos no tendría datos de juego genuinos detrás.
- **Salón de la Fama y detalle leen real solo para ASTEROIDS; el resto conserva `getSeededScores`**: evita reescribir el resto del catálogo mock antes de que exista un segundo juego real.
- **Se guarda cada partida sin deduplicar por nombre**: consistente con cómo `getSeededScores` ya presenta filas independientes; deduplicar habría requerido lógica adicional de upsert sin que el usuario la haya pedido.
- **RLS abierta (lectura y escritura pública en `scores`)**: no hay Auth real todavía para atar el insert a un usuario; es el equivalente directo del botón falso actual, con el mismo nivel de exposición que ya tiene la app hoy. Un control anti-spam queda fuera de alcance explícitamente.
- **Lecturas vía Server Components con el cliente de servidor de Supabase, sin Route Handlers intermedios**: ya es el patrón usado en `/api/health-db` para el cliente de servidor; añadir `/api/games` y `/api/scores` solo para leer habría sido indirección sin beneficio en este spec.
- **Patrón Server Component (fetch) + Client Component (interacción vía props) para las pantallas que hoy son 100% `'use client'`**: evita mezclar `async`/await de datos con hooks de React en el mismo archivo; sigue el mismo patrón que `app/juego/[id]/page.tsx` ya usa hoy.
- **`best` y `plays` de `games` quedan estáticos, no se recalculan desde `scores`**: evita una query de agregación adicional; el usuario confirmó que no es necesario en este spec.
- **La home (`app/page.tsx`) entra en el alcance de la migración**: si `GAMES` desaparece de `lib/app-data.ts`, la home se rompe; el usuario confirmó actualizarla también en vez de dejar un array duplicado solo para ella.

## Identified risks

- **Podio del Salón de la Fama con menos de 3 puntuaciones reales**: a diferencia de `getSeededScores` (que siempre devuelve el `count` pedido), `scores` puede tener 0, 1 o 2 filas para ASTEROIDS recién lanzado el feature, y el JSX actual accede a `rows[0]`, `rows[1]`, `rows[2]` sin chequeo. Mitigación: paso 8 del plan agrega el chequeo antes de renderizar cada slot del podio.
- **Insert público sin control de abuso**: cualquiera con la URL/clave pública de Supabase puede insertar filas arbitrarias en `scores` directamente contra la API REST, sin pasar por la UI. Mitigación: aceptada como riesgo conocido en esta spec (igual de expuesta que el botón falso actual); anti-spam real queda para cuando exista Auth.
- **Desincronía entre `games.id` sembrado y el `id` hardcodeado `"asteroids"` usado en el código**: si la migración de seed tuviera un typo en el `id` de ASTEROIDS, el filtro `game.id === "asteroids"` en `GamePlayerClient` dejaría de activar el guardado real silenciosamente. Mitigación: el paso 1 del plan sembra los `id` exactos del array actual (`lib/app-data.ts` ya tiene `id: "asteroids"` desde SPEC 05), y el paso 11 de verificación manual confirma el guardado end-to-end.
