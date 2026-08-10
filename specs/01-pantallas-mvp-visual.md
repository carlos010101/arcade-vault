# SPEC 01 — Pantallas MVP visuales de Arcade Vault

> **Status:** Aprobado
> **Depends on:** —
> **Date:** 2026-08-10
> **Objective:** Portar a Next.js (App Router) las 5 pantallas y el Nav de `references/templates/` como interfaz puramente visual, sin lógica de juego real ni persistencia.

## Scope

**In:**

- Rutas reales (App Router) para cada pantalla del template: biblioteca (home), detalle de juego, reproductor (placeholder), salón de la fama y autenticación.
- Componente `Nav` con estado de sesión (logueado/invitado) compartido vía Context de React en memoria.
- Archivo de datos ficticios (`app-data`) con el catálogo de juegos y utilidades de puntuaciones simuladas, como placeholder de lo que en el futuro vendrá de una base de datos.
- Reutilización de las clases ya migradas en `app/globals.css` (`.btn`, `.card`, `.av-hero`, `.crt`, `.modal`, etc.) para fidelidad visual con el template.
- Uso de Tailwind v4 para cualquier maquetación/ajuste que no esté ya cubierto por esas clases (layout de página, espaciados nuevos, responsive puntual).
- Pantalla de reproductor con la misma simulación visual que el template: puntuación autoincremental falsa, vidas, nivel, pausa, botón "FIN" y modal de fin de juego con input de iniciales y "guardado" simulado (sin escribir en ningún lado).
- Formulario de autenticación (login/crear cuenta/invitado) que solo actualiza el Context en memoria y navega a la biblioteca; ningún dato se envía a un backend.
- Navegación entre las 5 pantallas fiel a los enlaces del template (Nav, tarjetas de juego, botones "JUGAR", "VOLVER AL VAULT", etc.).

**Out of scope (para futuros specs):**

- Lógica real de cualquier juego (Bloque Buster, Caída, Serpentina, etc.).
- Persistencia real de usuario o puntuaciones (localStorage, base de datos, backend).
- Autenticación real (OAuth con Google/GitHub, validación de credenciales).
- Sistema de créditos funcional (el contador "CRÉDITOS · 03" queda como valor fijo visual).
- Datos de juegos provenientes de una base de datos real (por ahora viven en `app-data`).
- Tests automatizados (no hay test runner configurado en el proyecto).

## Data model

Archivo `lib/app-data.ts` (placeholder client-side, reemplazable por una fuente real más adelante):

```ts
export type Game = {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
  cover: string; // clase CSS de portada, p.ej. "cover-bricks"
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string;
};

export const GAMES: Game[];
export const CATEGORIES: string[]; // ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]
export const PLAYER_NAMES: string[]; // nombres ficticios para el ranking

export type ScoreRow = { rank: number; name: string; score: number; date: string };
export function getSeededScores(seed: number, count?: number): ScoreRow[];
```

Es la migración directa de `references/templates/data.jsx` a TypeScript, sin cambios de forma.

Contexto de sesión en `lib/session-context.tsx`:

```ts
type SessionUser = { name: string } | null;

type SessionContextValue = {
  user: SessionUser;
  login: (user: SessionUser) => void;
  logout: () => void;
};
```

Vive solo en memoria (React state), se pierde al recargar la página. No se persiste en `localStorage` ni se envía a ningún servidor.

## Implementation plan

1. Crear `lib/app-data.ts` con el catálogo de juegos, categorías, nombres de jugadores y `getSeededScores`, migrado de `data.jsx`.
2. Crear `lib/session-context.tsx` con `SessionProvider` y hook `useSession()`, envolver `app/layout.tsx` con el provider.
3. Crear `components/Nav.tsx` (migración de `nav.jsx`) usando `useSession()` para mostrar "Iniciar Sesión" o el nombre de usuario, con el menú móvil. Montarlo en `app/layout.tsx` sobre `{children}`.
4. Crear `app/page.tsx` (biblioteca): buscador, chips de categoría, grid de `GameCard` (nuevo componente `components/GameCard.tsx` con el efecto tilt), enlazando cada tarjeta a `/juego/[id]`.
5. Crear `app/juego/[id]/page.tsx` (detalle): portada, tags, descripción, stat-strip, leaderboard con `getSeededScores`, botones "JUGAR AHORA" (→ `/juego/[id]/jugar`) y "VOLVER AL VAULT" (→ `/`). Si el `id` no existe en `GAMES`, `notFound()`.
6. Crear `app/juego/[id]/jugar/page.tsx` (reproductor): HUD, `crt` con la escena falsa (nave, enemigos, grid), controles de pausa/fin, y modal de fin de juego con input de iniciales y "guardado" simulado vía estado local (`saved: true`), sin `onSaveScore` real.
7. Crear `app/salon/page.tsx` (salón de la fama): tabs por juego, podio (top 3), tabla completa con `getSeededScores`, fila "tu mejor marca" visible solo si `useSession().user` no es null.
8. Crear `app/auth/page.tsx` (autenticación): tabs "Iniciar sesión"/"Crear cuenta", campos usuario/correo/contraseña, botón "Jugar como invitado". Al enviar, llama a `login()` del Context y navega a `/`.
9. Revisar `app/globals.css` contra los estilos usados por las páginas nuevas (clases `.av-detail`, `.av-player`, `.av-hall`, `.av-auth-wrap`, etc. ya existen migradas) y completar solo lo que falte; el resto de ajustes de maquetación se hacen con utilidades Tailwind directamente en los componentes.
10. Actualizar el footer y limpiar `app/page.tsx` del scaffold por defecto de `create-next-app` (logo de Next/Vercel, textos de bienvenida).

## Acceptance criteria

- [ ] `npm run dev` levanta la app sin errores en consola.
- [ ] `/` muestra la biblioteca con buscador, chips de categoría y el grid de los 8 juegos de `app-data`.
- [ ] Buscar un texto que no coincide con ningún juego muestra el mensaje "NO HAY RESULTADOS".
- [ ] Click en una tarjeta o en "JUGAR" navega a `/juego/[id]` con la información del juego correspondiente.
- [ ] `/juego/[id]` muestra portada, descripción, stats y un leaderboard de 10 filas.
- [ ] Botón "JUGAR AHORA" navega a `/juego/[id]/jugar`.
- [ ] En `/juego/[id]/jugar`, la puntuación sube sola cada ~220ms mientras no está en pausa ni terminado.
- [ ] Botón "PAUSA" detiene el incremento de puntuación y muestra el overlay "EN PAUSA"; el botón cambia a "REANUDAR".
- [ ] Botón "FIN" abre el modal de fin de juego con la puntuación final.
- [ ] Enviar el input de iniciales en el modal reemplaza el formulario por el mensaje "▸ PUNTUACIÓN GUARDADA_" (sin escribir en localStorage).
- [ ] "JUGAR DE NUEVO" reinicia puntuación, vidas, nivel y cierra el modal.
- [ ] `/salon` muestra tabs por juego, podio top-3 y tabla de 12 filas; cambiar de tab cambia las filas mostradas.
- [ ] Si no hay usuario logueado, `/salon` no muestra la fila "TU MEJOR MARCA".
- [ ] En `/auth`, enviar el formulario de "Iniciar sesión" actualiza el Nav para mostrar el nombre de usuario y navega a `/`.
- [ ] "JUGAR COMO INVITADO" navega a `/` sin loguear ningún usuario.
- [ ] El nombre de usuario logueado se mantiene visible en el Nav al navegar entre `/`, `/juego/[id]`, `/salon` (sin recargar la página).
- [ ] Recargar la página (F5) vuelve siempre al estado invitado (sin persistencia).
- [ ] `npm run lint` no reporta errores.
- [ ] El diseño visual (colores, tipografías pixel/mono, efectos neón, scanlines) coincide con `references/templates/Arcade Vault.html` renderizado en el navegador.

## Decisions

- **Sí:** rutas reales del App Router (`/`, `/juego/[id]`, `/juego/[id]/jugar`, `/salon`, `/auth`) en vez de replicar el routing por hash del template. Aprovecha el App Router y da URLs compartibles.
- **No:** mantener el patrón de una sola página con estado de "pantalla actual". Iría contra las convenciones de Next.js 16 ya establecidas en el proyecto.
- **Sí:** reutilizar `app/globals.css` (ya migrado con variables y clases del template) y usar Tailwind solo para lo que ese CSS no cubra. Evita reescribir ~950 líneas de CSS retro en utilidades y mantiene fidelidad visual.
- **Sí:** Context de React en memoria para el usuario logueado, sin persistencia. Permite que el Nav refleje el login mientras se navega, sin implementar un backend ni localStorage que no se pidieron.
- **No:** localStorage para usuario o puntuaciones. El usuario decidió explícitamente que todo sea estático y sin persistencia en esta etapa.
- **Sí:** simulación visual completa del reproductor (puntuación autoincremental, pausa, modal de fin de juego) igual que el template, usando `app-data` como placeholder. El usuario indicó que se puede copiar tal cual mientras no exista un juego real.
- **No:** lógica de juego real para ninguno de los 8 títulos. Explícitamente fuera de scope ("no hay que implementar ningún juego").

## What is **not** in this spec

- Cualquier mecánica de juego jugable (Bloque Buster, Caída, Serpentina, Glotón, Invasores, Rocas, Ranaria, Duelo Pixel).
- Persistencia de usuario o puntuaciones (localStorage, base de datos, backend).
- Autenticación real u OAuth.
- Sistema de créditos funcional.
- Tests automatizados.

Cada uno de estos, si se implementa, va en su propio spec.
