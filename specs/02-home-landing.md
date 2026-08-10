# SPEC 02 — Pantalla Home (landing) y reubicación de la biblioteca

> **Status:** Implementado
> **Depends on:** SPEC 01
> **Date:** 2026-08-10
> **Objective:** Portar a Next.js la landing `home.jsx` de `references/templates/home-about/` como nueva raíz (`/`), moviendo la biblioteca actual de SPEC 01 a `/biblioteca` y actualizando el Nav en consecuencia.

## Scope

**In:**

- Nueva pantalla Home (landing) en la ruta `/`, migrada de `references/templates/home-about/home.jsx`: hero con siluetas flotantes animadas, sección "¿Por qué Arcade Vault?" (4 feature cards), preview de 6 juegos (`mini-rail`), sección de stats, sección de actividad en vivo (últimas puntuaciones + top jugadores), sección de precios (plan único gratis + FAQ), y CTA final.
- Migración de las clases CSS asociadas desde `references/templates/home-about/styles.css` a `app/globals.css` (`.home`, `.home-hero`, `.home-silos`, `.home-section`, `.feature-grid`, `.feature-card`, `.mini-rail`, `.mini-card`, `.home-stats`, `.stats-inner`, `.activity-grid`, `.pricing-grid`, `.price-card`, `.pricing-faq`, `.home-final`, `.reveal`/`.in`, etc.).
- Efecto de aparición al hacer scroll (`useReveal` / `IntersectionObserver` sobre `.reveal`) migrado tal cual.
- La biblioteca actual (buscador + chips + grid, contenido actual de `app/page.tsx`) se mueve a la ruta `/biblioteca` sin cambios funcionales.
- Actualización de `components/Nav.tsx`: nuevo link "Inicio" (`/`, antes del logo... no, junto a los demás links) y "Biblioteca" (`/biblioteca`), tanto en el menú de escritorio como en el panel móvil. El logo sigue enlazando a `/`.
- Actualización de todos los enlaces internos que hoy apuntan a `/` esperando la biblioteca, para que apunten a `/biblioteca`: botón "VOLVER AL VAULT" en `app/juego/[id]/page.tsx`, botón "VOLVER AL VAULT" en `app/salon/page.tsx`, botón de la pantalla de fin de juego en `app/juego/[id]/jugar/page.tsx`, y el redirect tras login/registro/invitado en `app/auth/page.tsx`.
- Los botones de la propia Home ("EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →", "INSERTAR MONEDA →") navegan a `/biblioteca`; "CREAR CUENTA" y "EMPEZAR GRATIS →" navegan a `/auth`; las mini-cards de la sección de preview navegan a `/juego/[id]`; "VER SALÓN →" navega a `/salon`.

**Out of scope (para futuros specs):**

- Pantalla "Acerca de" (`about.jsx`) y su formulario de contacto. Queda para un spec propio.
- Datos reales para las secciones de stats/actividad/top jugadores (siguen siendo arrays hardcodeados como en el template, no derivados de `app-data.ts`).
- Cualquier lógica de créditos, pagos o planes reales (la sección de precios es puramente visual, "EMPEZAR GRATIS" solo navega a `/auth`).
- Tests automatizados.

## Data model

No se introduce ningún tipo o estructura persistente nueva. La Home reutiliza `GAMES` de `lib/app-data.ts` (`GAMES.slice(0, 6)` para el preview) y define, igual que el template, arrays locales hardcodeados dentro del componente para:

- Features (`{ i, t, d, c }` — icono, título, descripción, color) — 4 elementos fijos.
- Stats (`{ n, u, s }` — número, unidad, subtítulo) — 3 elementos fijos.
- Actividad reciente (`{ p, g, s, t, c }` — jugador, juego, puntuación, tiempo, color) — 7 elementos fijos.
- Top jugadores del día (`{ r, p, s }` — rank, jugador, puntuación) — 5 elementos fijos.
- FAQ de precios (`{ q, a }` — pregunta, respuesta) — 3 elementos fijos.

Estos arrays viven directamente en `app/page.tsx` (o en un componente auxiliar si el archivo crece demasiado), tal como en `home.jsx`. No se persisten ni vienen de `app-data.ts`.

## Implementation plan

1. Crear `app/biblioteca/page.tsx` con el contenido actual de `app/page.tsx` (biblioteca: buscador, chips, grid) sin cambios funcionales.
2. Reescribir `app/page.tsx` como la nueva Home: migrar `home.jsx` a un componente cliente de Next.js (hero, siluetas SVG, secciones "por qué", preview de juegos con `GAMES.slice(0, 6)`, stats, actividad en vivo, precios/FAQ, CTA final), usando `next/link`/`useRouter` en vez de la prop `navigate` del template.
3. Migrar los sub-componentes del template (`FloatingSilhouettes`, `MiniCard`, `FeatureIcon`) a componentes internos de `app/page.tsx`, adaptando `onClick`/`navigate` a `Link`/`router.push` de Next.js.
4. Migrar las clases CSS necesarias de `references/templates/home-about/styles.css` a `app/globals.css` (solo las que no existan ya), incluyendo la animación `.reveal`/`.in` y el `IntersectionObserver` (`useEffect` con `useReveal` dentro del componente Home).
5. Actualizar `components/Nav.tsx`: agregar el link "Inicio" (`/`) junto a "Biblioteca" (`/biblioteca`) y "Salón de la Fama" (`/salon`) en el menú de escritorio y en el panel móvil; ajustar `isActive` para que "Inicio" solo esté activo en `/` y "Biblioteca" en `/biblioteca` + `/juego/*`.
6. Actualizar los enlaces/redirects que hoy apuntan a `/` esperando la biblioteca: `app/juego/[id]/page.tsx` ("VOLVER AL VAULT"), `app/salon/page.tsx` ("VOLVER AL VAULT"), `app/juego/[id]/jugar/page.tsx` (botón tras fin de partida), `app/auth/page.tsx` (redirect tras login/registro/invitado) — todos pasan a `/biblioteca`.
7. Revisar responsive del nuevo `app/page.tsx` (grid de features, mini-rail, stats, activity-grid, pricing-grid) en mobile, reutilizando media queries del template si existen en `styles.css`.

## Acceptance criteria

- [x] `npm run dev` levanta la app sin errores en consola.
- [x] `/` muestra la nueva Home: hero con título "EL ARCADE CLÁSICO ESTÁ DE VUELTA", siluetas flotantes, secciones "¿POR QUÉ ARCADE VAULT?", "JUEGOS DISPONIBLES AHORA", stats, "ACTIVIDAD EN VIVO", "PRECIOS" y CTA final "¿LISTO PARA JUGAR?".
- [x] `/biblioteca` muestra exactamente la pantalla que antes vivía en `/` (buscador, chips de categoría, grid de 8 juegos), sin cambios de comportamiento respecto a SPEC 01.
- [x] En la Home, "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" navegan a `/biblioteca`.
- [x] En la Home, "CREAR CUENTA" y "EMPEZAR GRATIS →" navegan a `/auth`.
- [x] En la Home, hacer click en una de las 6 mini-cards de preview navega a `/juego/[id]` del juego correspondiente.
- [x] En la Home, "VER SALÓN →" navega a `/salon`.
- [x] Las secciones marcadas con `.reveal` aparecen con la animación de fade/slide al hacer scroll hasta ellas (se les agrega la clase `in` vía `IntersectionObserver`).
- [x] El Nav muestra "Inicio" y "Biblioteca" como links separados, en escritorio y en el panel móvil; "Inicio" está resaltado solo en `/`, "Biblioteca" está resaltado en `/biblioteca` y en `/juego/[id]`.
- [x] El logo del Nav navega a `/`.
- [x] Desde `/juego/[id]`, el botón "VOLVER AL VAULT" navega a `/biblioteca`.
- [x] Desde `/salon`, el botón "VOLVER AL VAULT" navega a `/biblioteca`.
- [x] Al terminar una partida en `/juego/[id]/jugar` y volver, el botón correspondiente navega a `/biblioteca`.
- [x] Tras iniciar sesión, crear cuenta o entrar como invitado en `/auth`, la app navega a `/biblioteca` (no a `/`).
- [x] `npm run lint` no reporta errores.
- [x] El diseño visual de la Home coincide con `references/templates/home-about/arcade-vault-standalone.html` renderizado en el navegador.

## Decisions

- **Sí:** la Home (landing) pasa a ser la raíz `/`, y la biblioteca de SPEC 01 se mueve a `/biblioteca`. Refleja la estructura del template (`nav.jsx` distingue "Inicio" de "Biblioteca" como rutas separadas) y le da a la app una puerta de entrada de marketing separada del catálogo jugable.
- **No:** incluir la pantalla "Acerca de" (`about.jsx`) en este spec, aunque vino en la misma carpeta de referencia. Se documenta como spec futuro para no mezclar dos pantallas con alcances distintos.
- **Sí:** los datos de las secciones "actividad en vivo", "top jugadores" y "stats" quedan hardcodeados igual que en el template, sin derivarlos de `getSeededScores` ni de `app-data.ts`. Son puramente decorativos en esta etapa y el template ya los definía como arrays fijos.
- **Sí:** todos los enlaces/redirects que antes apuntaban a `/` esperando la biblioteca (detalle de juego, salón, fin de partida, login) se actualizan a `/biblioteca`. Evita que el usuario termine en la landing de marketing después de una acción dentro de la app.
- **No:** sistema de créditos o pagos reales en la sección de precios. "EMPEZAR GRATIS" solo navega a `/auth`, igual de simulado que el resto de la app (SPEC 01).
