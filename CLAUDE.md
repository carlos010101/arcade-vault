# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — plataforma para jugar online y competir por puntuación (ver README.md).

Estado actual: 5 pantallas implementadas (home, biblioteca, salón de la fama, detalle de juego, about/contacto), catálogo y puntuaciones reales en Supabase. El catálogo tiene 9 filas en la tabla `games`, pero solo 5 son jugables (asteroids, tetris, arkanoid, snake, frogger); el resto (`duelo-pixel`, `gloton`, `invasores`, `ranaria`) son entradas ficticias sin implementación.

El inventario de juegos implementados (id, categoría, controles, puntuación, assets, spec asociado) vive en **`references/implemented-games/README.md`** — consúltalo ahí en vez de listarlos aquí, y actualízalo al portar un juego nuevo.

La cola de juegos **candidatos** (sugeridos, aprobados, descartados) vive en **`references/game-suggestions-todo.md`**, mantenida por el subagente `@game-planner`.

## Workflow: Spec Driven Design

Todo cambio funcional nace de un spec en `specs/NN-slug.md` (basado en https://github.com/Klerith/fernando-skills): se redacta en `Draft`, el usuario lo aprueba, y solo entonces se implementa.

**Skills**

| Skill                                      | Qué hace                                                                                                                                                                                      | Definición                               |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `/spec`                                    | Redacta un spec nuevo (queda en `Draft`)                                                                                                                                                      | `.agents/skills/spec/` (global)          |
| `/spec-impl NN-slug`                       | Implementa un spec aprobado                                                                                                                                                                   | `.agents/skills/spec-impl/`              |
| `/spec-impl-game <NN-slug \| game-jam-id>` | Igual, especializada en specs de **juego**; al terminar con lint/build limpios encadena `@skin-designer` → `@mobile-porter` → `@game-performance-booster` **en secuencia, nunca en paralelo** | `.claude/skills/spec-impl-game/SKILL.md` |
| `/port-game [juego]`                       | Genera el spec para portar un juego al catálogo, siempre con leaderboard real                                                                                                                 | `.claude/skills/port-game/SKILL.md`      |

**Agentes**

| Agente                      | Qué hace                                                                                                                                | Definición / memoria                                                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `@game-planner`             | Decide **qué** juego portar a continuación; no escribe código ni specs                                                                  | `.claude/agents/game-planner.md` · memoria: `references/game-suggestions-todo.md`                                               |
| `@game-jam`                 | Recibe un tema y diseña un juego original desde cero, escribiendo su(s) spec(s) en `specs/game-jam/<game-id>/`                          | `.claude/agents/game-jam.md`                                                                                                    |
| `@skin-designer`            | Garantiza los 3 skins (`clasico`/`retro`/`neon`) de cada juego, con selector en el HUD; **sí escribe código**                           | `.claude/agents/skin-designer.md` · memoria: `references/skins/README.md`                                                       |
| `@mobile-porter`            | Audita el layout móvil en viewports reales con Playwright y reporta fallos; no escribe código                                           | `.claude/agents/mobile-porter.md` · memoria: `references/mobile/README.md` (ref. obligatoria: `specs/10-controles-tactiles.md`) |
| `@game-performance-booster` | Audita/optimiza el rendimiento runtime de un juego (jank, allocaciones en el loop RAF, re-renders, `shadowBlur`); **sí escribe código** | `.claude/agents/game-performance-booster.md` · memoria: `references/performance/README.md`                                      |

`@skin-designer`, `@mobile-porter` y `@game-performance-booster` editan los mismos archivos
(`components/games/*.tsx`, `GamePlayerClient.tsx`), así que siempre corren en secuencia y en
ese orden, nunca en paralelo.

Instalar los skills globales:

```bash
npx skills@latest add Klerith/fernando-skills
```

Specs existentes: 01 pantallas MVP · 02 home/landing · 03 about + contacto (Resend) · 04 setup Supabase · 05 Asteroids · 06 leaderboard + tabla `games` · 07 Tetris · 08 Arkanoid · 09 Snake · 10 controles táctiles · `game-jam/frogger/01` Frogger.

## Commands

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # serve production build
npm run lint     # eslint (flat config, eslint-config-next)
```

No test runner is configured yet. La verificación de cada spec es manual end-to-end + `npm run lint` y `npm run build` limpios.

## Skills y automatizaciones

- Usa siempre `/frontend-design` para diseñar la interfaz de usuario.
- Hook `PostToolUse` (`.claude/hooks/format-and-lint.sh`): tras cada Write/Edit corre Prettier `--write` y, en JS/TS, `eslint --fix`; si quedan errores de ESLint sale con código 2 para que se corrijan. No hace falta formatear a mano.
- MCP **supabase** (`.mcp.json`, proyecto `crkexepgfehipluoeyqc`): usa `mcp__supabase__apply_migration` para cambios de esquema y seeds, `list_tables` antes de tocar el esquema, `get_advisors`/`query_logs` para depurar.
- MCP **playwright**: disponible para verificar pantallas en el navegador.

## Architecture

- Next.js 16.3.0 con **App Router** (`app/`), React 19, TypeScript (strict), Tailwind CSS v4 (`@tailwindcss/postcss`) + CSS custom properties en `app/globals.css` (estética neón/CRT, fuentes `Press_Start_2P` / `JetBrains_Mono` / `Courier_Prime`).
- Path alias `@/*` mapea a la raíz del repo (`tsconfig.json`).
- **Next.js 16 tiene breaking changes vs. training data.** Antes de escribir routing/data-fetching/config, lee la guía correspondiente en `node_modules/next/dist/docs/` (`01-app`, `02-pages`, `03-architecture`). En particular: `proxy.ts` en la raíz (no `middleware.ts`) y tipos generados como `LayoutProps<"/">`.

### Rutas

| Ruta                | Notas                                               |
| ------------------- | --------------------------------------------------- |
| `/`                 | Landing (`HomeClient.tsx`)                          |
| `/biblioteca`       | Catálogo desde Supabase (`BibliotecaClient.tsx`)    |
| `/salon`            | Salón de la fama, tab por juego (`SalonClient.tsx`) |
| `/juego/[id]`       | Detalle + top 10                                    |
| `/juego/[id]/jugar` | Pantalla de juego (`GamePlayerClient.tsx`)          |
| `/about`, `/auth`   | Contacto y login simulado                           |
| `/api/contact`      | Envío de correo vía Resend                          |
| `/api/health-db`    | Chequeo de conexión a Supabase                      |

### Datos

- Supabase: tabla `games` (catálogo) y `scores` (`game_id`, `player_name`, `score`, `created_at`), RLS abierta a lectura y escritura pública — el anti-spam queda fuera de alcance por ahora.
- `lib/games.ts`: `getGames`, `getGame`, `getTopScores(gameId, limit)` (Server Components).
- `lib/supabase/server.ts` y `client.ts` (`@supabase/ssr`); `proxy.ts` refresca la sesión en cada request.
- `lib/app-data.ts`: solo datos ficticios residuales (categorías, nombres, scores sembrados para juegos sin leaderboard real).
- `lib/session-context.tsx`: sesión **simulada** en memoria (`useSession`). Aún no hay auth real de Supabase.
- Patrón de persistencia: Server Component hace fetch → Client Component recibe por props e inserta directo con el cliente browser. Sin Route Handlers intermedios para scores.

### Patrón de juegos (`components/games/*.tsx`)

Contrato estándar de todo juego portado:

```ts
type XState = {
  score: number;
  lives: number;
  level: number;
  gameOver: boolean;
}; // varía por juego
type XProps = {
  paused: boolean;
  skin: SkinId;
  onStateChange: (state: XState) => void;
};
type XHandle = { forceGameOver: () => void; restart: () => void };
```

Reglas que aplican a todos:

- Estado mutable del juego en `useRef`, nunca `useState`; loop con `requestAnimationFrame` y `cancelAnimationFrame` en el cleanup.
- El canvas comunica su estado a React por callback (`onStateChange`), no polling.
- Listeners `keydown`/`keyup` con `preventDefault` al montar, removidos al desmontar (evitar fugas entre pantallas).
- Se deshabilita cualquier auto-reinicio por tecla del juego original: reiniciar es exclusivo del botón del HUD.
- `GamePlayerClient.tsx` monta el juego según gates `game.id === '<id>'` (uno por juego implementado, ver `references/implemented-games/README.md`) y conecta HUD y botones PAUSA / FIN / JUGAR DE NUEVO / SALIR al handle.
- Podios y listas deben tolerar menos de 3 filas reales (guard `rows[N] &&`).
- `best`/`plays` de `games` son estáticos, no se recalculan desde `scores`.
- **Skins**: todo color de render sale de `lib/skins.ts` (`getSkin('<id>', skin)`), nunca de literales hex en el `.tsx`. Los 3 skins son `clasico` (default, idéntico al aspecto actual), `retro` y `neon`; cambiar de skin no reinicia la partida. Ver `references/skins/README.md` y el subagente `@skin-designer`.

Fuentes para portar: `references/started-games/` (asteroids, tetris, arkanoid), `references/templates/` (maquetas originales), `references/souce-assets/`. Los assets servidos viven en `public/games/` y `public/snake-assets/`.

## Environment

Variables en `.env.local` (plantilla en `.env.example`): `RESEND_API_KEY`, `SUPABASE_DB_PASSWORD`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
