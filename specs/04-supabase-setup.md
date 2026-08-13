# SPEC 04 — Integración base de Supabase

> **Status:** Implementado
> **Depends on:** SPEC 01
> **Date:** 2026-08-13
> **Objective:** Cablear el proyecto a Supabase (SDK, clientes browser/server, variables de entorno, migración inicial vacía) y verificar la conexión con una ruta de salud, sin conectar todavía auth ni datos reales a ninguna pantalla.

## Scope

**In:**

- Instalación de `@supabase/supabase-js` y `@supabase/ssr`.
- Cliente de navegador `lib/supabase/client.ts` (`createBrowserClient` de `@supabase/ssr`).
- Cliente de servidor `lib/supabase/server.ts` (`createServerClient` de `@supabase/ssr`, usando `cookies()` de `next/headers` con `await` — API asíncrona en esta versión de Next.js).
- `proxy.ts` (convención vigente en Next.js 16; reemplaza a `middleware.ts`) en la raíz para refrescar la sesión de Supabase en cada request (patrón estándar de `@supabase/ssr` para App Router), aunque todavía no exista ningún flujo de auth conectado.
- Variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, obtenidas del proyecto Supabase ya enlazado (`crkexepgfehipluoeyqc`, ver `.mcp.json`) vía las tools de Supabase MCP (`get_project_url`, `get_publishable_keys`). Se agregan con valores reales a `.env.local` (gitignoreado) y como claves sin valor a `.env.example`.
- Ruta de prueba `app/api/health-db/route.ts`: `GET` que instancia el cliente de servidor y ejecuta una llamada trivial (ej. `supabase.auth.getSession()` o una query mínima) para confirmar que la conexión funciona; responde `200 { ok: true }` si todo va bien o `500 { ok: false, error }` si falla.
- Una migración inicial vacía o de solo verificación (sin tablas de negocio) aplicada al proyecto vía `mcp__supabase__apply_migration`, dejando el flujo de migraciones establecido para specs futuras.

**Out of scope (para futuros specs):**

- Reemplazar el login/registro falso de `app/auth/page.tsx` y `lib/session-context.tsx` por Supabase Auth real.
- Definir o crear tablas de negocio (`profiles`, `scores`, `games`, etc.).
- Migrar los datos mock de `lib/app-data.ts` (juegos, puntuaciones seedeadas) a la base de datos.
- Modo invitado: se mantiene exactamente como está hoy (`login(null)`), sin ningún cambio.
- Row Level Security, políticas, o cualquier regla de acceso (no hay tablas todavía).

## Data model

No se introduce ningún tipo de dato de aplicación ni tabla de negocio. Únicamente:

- Estructura de clientes Supabase (`lib/supabase/client.ts`, `lib/supabase/server.ts`) sin modelos propios — reexportan el `SupabaseClient` tipado del SDK.
- Migración inicial vacía en el proyecto Supabase (o limitada a verificar extensiones/config), sin `CREATE TABLE`.

## Implementation plan

1. `npm install @supabase/supabase-js @supabase/ssr`.
2. Obtener `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` vía `mcp__supabase__get_project_url` y `mcp__supabase__get_publishable_keys` sobre el proyecto `crkexepgfehipluoeyqc`; agregarlas a `.env.local` con sus valores reales y a `.env.example` sin valor (junto a `RESEND_API_KEY` y `SUPABASE_DB_PASSWORD` ya existentes).
3. Crear `lib/supabase/client.ts`: exporta una función `createClient()` que llama a `createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!)`.
4. Crear `lib/supabase/server.ts`: exporta una función async `createClient()` que hace `await cookies()` de `next/headers` y llama a `createServerClient(...)` con los handlers `get`/`set`/`remove` de cookies requeridos por `@supabase/ssr`.
5. Crear `proxy.ts` (Next.js 16 renombró Middleware a Proxy) en la raíz del proyecto: usa un cliente Supabase de proxy (`createServerClient` con `NextRequest`/`NextResponse`) para refrescar el token de sesión en cada request, siguiendo el patrón oficial de `@supabase/ssr`; `matcher` que excluye assets estáticos.
6. Crear `app/api/health-db/route.ts`: `GET` handler que instancia el cliente de servidor (`lib/supabase/server.ts`) y ejecuta `supabase.auth.getSession()`; responde `200 { ok: true }` en éxito, `500 { ok: false, error: string }` si lanza una excepción.
7. Aplicar una migración inicial vacía o de verificación al proyecto Supabase vía `mcp__supabase__apply_migration`, dejando registrado el punto de partida de `mcp__supabase__list_migrations` para specs futuras.
8. Verificar manualmente: `npm run dev`, `curl http://localhost:3000/api/health-db` debe devolver `200 { ok: true }`.

## Acceptance criteria

- [x] `@supabase/supabase-js` y `@supabase/ssr` están en `dependencies` de `package.json`.
- [x] `lib/supabase/client.ts` y `lib/supabase/server.ts` existen y exportan clientes tipados sin errores de TypeScript (`npm run build` compila).
- [x] `proxy.ts` existe y refresca la sesión sin lanzar errores al navegar cualquier ruta existente (`/`, `/biblioteca`, `/auth`, `/salon`, `/juego/[id]`).
- [x] `.env.local` contiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` con valores reales; `.env.example` las documenta sin valor.
- [x] `GET /api/health-db` devuelve `200 { ok: true }` en local.
- [x] `mcp__supabase__list_tables` sigue devolviendo `[]` (no se crearon tablas de negocio).
- [x] Ninguna pantalla existente (`app/auth/page.tsx`, `lib/session-context.tsx`, `lib/app-data.ts`) fue modificada.
- [x] `npm run lint` pasa sin nuevos errores.

## Decisions taken and discarded

- **Se eligió `@supabase/ssr` sobre usar solo `@supabase/supabase-js`**: es el paquete oficial recomendado por Supabase para Next.js App Router; maneja correctamente cookies de sesión en Server Components, Route Handlers y Middleware. Usar solo el cliente base habría bloqueado la integración de auth real en la siguiente spec.
- **Se separó esta spec de la implementación de Auth real y de las tablas de scores/games**: el usuario pidió explícitamente "solo la integración, aún no implementaciones concretas" — evita mezclar el cableado de infraestructura con decisiones de UX (formulario de auth, modelo de `profiles`) que aún no están cerradas.
- **El modo invitado no se toca**: se mantiene `login(null)` tal cual; no hay razón para tocarlo en una spec que no conecta auth real todavía.
- **Se usa una ruta `/api/health-db` como smoke test en vez de solo verificación manual vía MCP**: deja un mecanismo reutilizable en el código para futuras specs y para debugging, no solo una comprobación puntual durante esta implementación.
- **No se crean tablas de negocio (`profiles`, `scores`, `games`)**: quedan explícitamente fuera de alcance para una spec futura, una vez se decidan los detalles de auth (método, dónde vive el username) y de persistencia de puntuaciones.

## Identified risks

- **Variables de entorno mal alcanzadas (`NEXT_PUBLIC_` vs. server-only):** usar por error `NEXT_PUBLIC_` en una clave que no debería exponerse al cliente filtraría secretos al bundle. Mitigación: solo `URL` y `PUBLISHABLE_KEY` (públicas por diseño en Supabase) llevan el prefijo `NEXT_PUBLIC_`; cualquier clave `service_role` queda fuera de alcance de esta spec.
- **Middleware mal configurado puede bloquear rutas existentes:** un `matcher` incorrecto en `proxy.ts` podría interceptar rutas estáticas o romper el Nav. Mitigación: seguir el patrón oficial de `@supabase/ssr` con `matcher` que excluye `_next/static`, `_next/image`, `favicon.ico` y assets.
