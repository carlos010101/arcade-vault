# Seguridad en Arcade Vault — auditorías

> Memoria del subagente `@security-auditor` (`.claude/agents/security-auditor.md`).
> Última actualización: **2026-08-18** · Veredicto: **BD: Con reservas · App: Con reservas**

Primera auditoría real completada el 2026-08-18 sobre la rama
`spec-12-checklist-seguridad-basico`. Confirma el contexto de SPEC 11/SPEC 12 y añade
2 hallazgos nuevos no cubiertos por esos specs (inyección HTML en `/api/contact` y
fuga de mensaje de error interno en `/api/health-db`), más una nota menor sobre
`proxy.ts`.

## Contexto que no hay que reabrir

- **RLS de `scores` abierta a escritura pública** (`WITH CHECK (true)` en la policy
  `scores are publicly insertable`): decisión explícita del usuario, documentada en
  `CLAUDE.md` y en SPEC 12 — "el anti-spam queda fuera de alcance por ahora". El lint
  `rls_policy_always_true` de Supabase advisors sobre esta policy es **riesgo
  aceptado**, no un bug a corregir.
- **Sin CAPTCHA (hCaptcha/Turnstile)** en signup: decisión explícita del usuario en
  SPEC 12 — Supabase Auth no ofrece rate limit por IP real sin CAPTCHA, y no se integró.
- **Sin CSP / HSTS / Permissions-Policy**: decisión explícita del usuario en SPEC 12 de
  no ampliar el alcance más allá de los 3 headers del checklist
  (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, ya en
  `next.config.ts`). Una CSP real requeriría auditar todos los orígenes externos
  (Supabase, Resend, OAuth, fuentes) y merece su propio spec.
- **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` es pública por diseño**: no es un secreto
  filtrado; su seguridad depende enteramente de las policies RLS, no de ocultar la
  clave.
- **Longitud mínima de contraseña, leaked password protection y rate limit de signup
  viven en el dashboard de Supabase, no en el repo**: no hay forma de leerlos por código
  ni por MCP directamente; solo se infieren de `get_advisors`.
- **WARN `auth_leaked_password_protection` — historial conocido (SPEC 12)**: el usuario
  confirmó dos veces (2026-08-18) haber activado "Leaked password protection" en el
  dashboard de Supabase, pero el advisor seguía reportando el WARN en ambas
  verificaciones. SPEC 12 lo cerró como **riesgo aceptado / pendiente de resolución
  fuera de ese spec** (posible retraso de propagación de Supabase, o el toggle no
  persistió). La primera auditoría de este agente debe re-chequear si sigue apareciendo
  y, si ya no aparece, marcarlo `Arreglado` con la fecha real.
- **Username en `user_metadata`, no en tabla `profiles`** (SPEC 11): no hay tabla nueva
  que auditar por unicidad de username; es display-only.
- **Guardar score exige sesión real; navegar/jugar sigue siendo público** (SPEC 11): no
  reportar como hallazgo que `/biblioteca`, `/salon`, `/juego/[id]/jugar` sean públicas.

## Estado por superficie

| Superficie    | Controles verificados                                                                                                                                                | Veredicto    | Última auditoría |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------- |
| BD (Supabase) | `get_advisors` (security/performance), `list_tables` (rls_enabled), `pg_policies` reales de `games`/`scores`, extensiones en `public`, migraciones                   | Con reservas | 2026-08-18       |
| App (Next.js) | secretos en árbol versionado, headers en caliente (`curl`), `/api/contact`, `/api/health-db`, `proxy.ts`, `session-context.tsx`, `app/auth/*`, escritura de `scores` | Con reservas | 2026-08-18       |

## Checklist base (SPEC 12) — estado vigente

| Ítem                                 | Estado                       | Evidencia                                                                                                                 | Verificado el        |
| ------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| RLS habilitado en `games` y `scores` | OK (confirmado en SPEC 12)   | `list_tables`, ambas `rls_enabled: true`                                                                                  | 2026-08-18 (SPEC 12) |
| Minimum password length = 8          | No verificable desde el repo | Ajuste de dashboard, sin advisor asociado                                                                                 | —                    |
| Leaked password protection           | Pendiente (sigue igual)      | Advisor `auth_leaked_password_protection` reverificado con `get_advisors(type: "security")` — sigue apareciendo como WARN | 2026-08-18           |
| Max signup rate / anti-bot por IP    | Limitación conocida          | Sin control por IP real en el plan de Supabase usado; solo el rate limit nativo de "Sign ups and sign ins"                | 2026-08-18 (SPEC 12) |
| Headers de seguridad en Next.js      | OK                           | `next.config.ts` — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`                                         | 2026-08-18 (SPEC 12) |

## Advisors de Supabase — estado

| Lint                                                               | Nivel | Estado    | Nota                                                                                                                                                                                                                      |
| ------------------------------------------------------------------ | ----- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rls_policy_always_true` (policy `scores are publicly insertable`) | WARN  | Aceptado  | Ya no aparece en `get_advisors(type: "security")` actual (solo la vio SPEC 12), pero la policy sigue existiendo tal cual en `pg_policies` (`WITH CHECK` = `true`) — riesgo vigente, ver "Contexto que no hay que reabrir" |
| `auth_leaked_password_protection`                                  | WARN  | Abierto   | Reverificado 2026-08-18: sigue apareciendo pese a los 2 ajustes previos del usuario en el dashboard (ver historial SPEC 12)                                                                                               |
| `unindexed_foreign_keys` (`scores.scores_game_id_fkey`)            | INFO  | No aplica | Advisor de **performance**, no de seguridad — fuera del alcance de este agente; se anota solo para no perder el contexto de qué devolvió `get_advisors`                                                                   |

## Hallazgos abiertos

| #   | Superficie | Severidad | Síntoma                                                                                                                                                                                                                                                                                                                                                                                                                                  | Arreglo propuesto                                                                                                                         | Estado  |
| --- | ---------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | App        | Grave     | `app/api/contact/route.ts:52` interpola `name`/`msg` sin escapar en el bloque `html:` del envío de Resend. Cualquiera sin credenciales que llame a `POST /api/contact` puede inyectar HTML/enlaces arbitrarios en el correo que recibe `chedezv@gmail.com` (phishing/spoofing dentro del propio correo del operador).                                                                                                                    | Escapar `name`/`msg` (entities HTML) antes de interpolar en el string `html`, o usar un template/`React Email` que escape por defecto.    | Abierto |
| 2   | App        | Menor     | `app/api/health-db/route.ts:9-13` devuelve `error.message` de Supabase tal cual al cliente si `getSession()` falla — filtra detalle interno (mensaje de error de Postgres/Auth) a cualquier caller anónimo de `GET /api/health-db`.                                                                                                                                                                                                      | Responder un mensaje genérico al cliente y loguear el detalle solo en servidor.                                                           | Abierto |
| 3   | App        | Menor     | `proxy.ts:28` usa `supabase.auth.getSession()` en el middleware en vez de `supabase.auth.getUser()`. `getSession()` solo lee el JWT de la cookie sin revalidarlo contra el servidor de Auth (guía oficial de `@supabase/ssr`), así que un token expirado/revocado podría no detectarse ahí. Hoy el impacto es bajo porque `proxy.ts` no toma decisiones de autorización (no hay rutas protegidas por middleware), solo refresca cookies. | Cambiar a `supabase.auth.getUser()` en `proxy.ts` como defensa en profundidad, siguiendo el patrón recomendado por Supabase para Next.js. | Abierto |

## Hallazgos cerrados

## No verificable desde el repo (dashboard de Supabase)

- Minimum password length (valor exacto).
- Leaked password protection (estado exacto del toggle).
- Rate limit de "Sign ups and sign ins" (valores exactos).
- Confirm email (estado exacto del toggle).

## Historial

- **2026-08-18** — Memoria creada junto con el subagente `@security-auditor`, sembrada
  con el contexto ya decidido en SPEC 11 y SPEC 12. Sin auditoría real todavía.
- **2026-08-18** — Primera auditoría real (rama `spec-12-checklist-seguridad-basico`).
  BD: RLS confirmado (`games`/`scores` ambas `rls_enabled: true`), policies reales
  vía `pg_policies` coinciden con lo documentado (`games`: solo SELECT público;
  `scores`: SELECT e INSERT públicos, sin UPDATE/DELETE), sin tablas nuevas sin RLS,
  sin extensiones instaladas en el esquema `public`, 6 migraciones revisadas sin
  cambios sospechosos. `auth_leaked_password_protection` reverificado — sigue WARN
  (sin cambio respecto a SPEC 12). App: sin secretos en el árbol versionado
  (`.env.local` gitignored, `.env.example` vacío), 3 headers del checklist
  confirmados en caliente con `curl -sI` contra el dev server (sí estaba corriendo),
  `redirectTo`/`emailRedirectTo` fijos a `window.location.origin` (sin open redirect),
  `player_name` en el insert de `scores` sale de `user.name` de sesión real (única
  escritura directa desde el navegador, confirmado por grep de `.insert(`), validación
  de contraseña de `lib/validation.ts` aplicada en ambos formularios. 2 hallazgos
  nuevos abiertos: inyección HTML en `/api/contact` (Grave) y fuga de mensaje de error
  interno en `/api/health-db` (Menor); 1 nota menor sobre `proxy.ts` usando
  `getSession()` en vez de `getUser()`. Dependencias (`package.json`) no auditadas por
  falta de acceso a bases de CVE. Veredictos: BD Con reservas (riesgos aceptados
  vigentes, sin hallazgos nuevos), App Con reservas (2 hallazgos nuevos, ninguno
  crítico).
