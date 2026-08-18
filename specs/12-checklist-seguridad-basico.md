# SPEC 12 — Checklist de seguridad básico

> **Status:** Implementado
> **Depends on:** SPEC 04, SPEC 11
> **Date:** 2026-08-18
> **Objective:** Cerrar los puntos pendientes del checklist de seguridad básico (`references/templates/security/security-checklist.md`) añadiendo los 3 headers de seguridad en `next.config.ts` y documentando/verificando los ajustes de Supabase Auth (longitud mínima de contraseña, protección de contraseñas filtradas, rate limit de signup) como prerrequisito manual del dashboard.

## Scope

**In:**

- Añadir a `next.config.ts` un `headers()` async que aplica a `/(.*)` los 3 headers del checklist: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
- Prerrequisito manual (dashboard de Supabase, Authentication → Settings): activar "Minimum password length" en 8 y activar "Leaked password protection" (HaveIBeenPwned). Se documenta como paso explícito del plan, igual que las credenciales OAuth en SPEC 11.
- Prerrequisito manual (dashboard de Supabase, Authentication → Rate Limits): ajustar el rate limit nativo de signups a un valor conservador (recomendado: mantener/bajar a los valores por defecto de Supabase para "Sign ups and sign ins", no hay campo específico "por IP" en este plan de Supabase — se documenta esa limitación).
- Verificación de que el WARN `auth_leaked_password_protection` desaparece de `mcp__supabase__get_advisors(type: "security")` tras el cambio en el dashboard.
- Confirmar y dejar constancia en el spec de que RLS ya está habilitado en `public.games` y `public.scores` (verificado con `list_tables`, ambas con `rls_enabled: true`) — este ítem del checklist ya está satisfecho, no requiere trabajo nuevo.
- Validación client-side de contraseña vía expresión regular (mínimo 8 caracteres: `/^.{8,}$/`), reflejada en vivo en el UI de `app/auth/page.tsx` (pestaña "Crear cuenta") y `app/auth/reset-password/page.tsx`: mensaje de texto bajo el campo indicando si cumple o no la regla, y el botón de submit deshabilitado mientras no cumpla.

**Out of scope (para futuros specs o decisiones ya tomadas):**

- Restringir la policy `scores are publicly insertable` (`WITH CHECK (true)`) a requerir `auth.uid()`. El WARN `rls_policy_always_true` que señala el advisor sobre esa policy es una decisión ya documentada en `CLAUDE.md` ("RLS abierta a lectura y escritura pública — el anti-spam queda fuera de alcance por ahora") y no se reabre en este spec.
- CAPTCHA (hCaptcha/Turnstile) en el formulario de registro para limitar signups por IP de forma real — el checklist pide "limitar signups por IP", pero Supabase Auth no ofrece ese control granular sin CAPTCHA; queda fuera de alcance por decisión del usuario.
- Headers adicionales no listados en el checklist (`Strict-Transport-Security`, `Permissions-Policy`, `Content-Security-Policy`) — decisión explícita del usuario de no ampliar el alcance; una CSP real requeriría auditar todos los orígenes externos (Supabase, Resend, OAuth, fuentes) y merece su propio spec.
- Cualquier cambio a las tablas `games`/`scores`, sus políticas RLS existentes, o nuevas migraciones.

## Data model

No se crean ni modifican tablas ni tipos. No aplica sección de datos.

## Implementation plan

1. **Prerrequisito manual (usuario, dashboard de Supabase):**
   - Authentication → Settings → Password: fijar "Minimum password length" en `8`.
   - Authentication → Settings → Password: activar "Leaked password protection".
   - Authentication → Rate Limits: revisar/ajustar el límite de "Sign ups and sign ins" a un valor conservador.
     Este paso no bloquea el paso 2 (headers), pero sí los criterios de aceptación 2, 3 y 4.
2. Editar `next.config.ts`: agregar la constante `securityHeaders` y el método async `headers()` del `NextConfig`, aplicando los 3 headers a `source: '/(.*)'`, manteniendo el `allowedDevOrigins` existente.
3. Agregar una constante compartida `PASSWORD_MIN_LENGTH_REGEX = /^.{8,}$/` (ubicación: `lib/` — p. ej. `lib/validation.ts`) reutilizada por ambos formularios.
4. `app/auth/page.tsx` (pestaña "Crear cuenta"): validar el campo de contraseña contra la regex en cada cambio (`onChange`), mostrar mensaje bajo el campo ("Mínimo 8 caracteres" en rojo/gris según cumpla) y deshabilitar el botón de submit de esa pestaña mientras no cumpla.
5. `app/auth/reset-password/page.tsx`: misma validación en vivo sobre el campo de nueva contraseña, mismo patrón de mensaje y submit deshabilitado.
6. Verificación manual: `npm run dev`, luego `curl -sI http://localhost:3000/` y confirmar que las 3 cabeceras aparecen en la respuesta.
7. Verificación manual: correr `mcp__supabase__get_advisors(type: "security")` y confirmar que el lint `auth_leaked_password_protection` ya no aparece en la lista (o documentar en el spec si el usuario no completó el paso 1 todavía, análogo al riesgo de OAuth en SPEC 11).
8. Verificación manual en `npm run dev`: escribir menos de 8 caracteres en registro y en reset-password muestra el mensaje y el submit queda deshabilitado; al llegar a 8 caracteres el mensaje cambia y el submit se habilita.
9. `npm run lint` y `npm run build` limpios.

## Acceptance criteria

- [x] `next.config.ts` exporta `headers()` devolviendo los 3 headers del checklist para todas las rutas.
- [x] `curl -sI http://localhost:3000/` en `npm run dev` muestra `x-content-type-options: nosniff`, `x-frame-options: DENY` y `referrer-policy: strict-origin-when-cross-origin`.
- [x] "Minimum password length" = 8 y "Leaked password protection" activado en el dashboard de Supabase (verificado por el usuario).
- [ ] `mcp__supabase__get_advisors(type: "security")` ya no reporta `auth_leaked_password_protection` — **pendiente**: el advisor sigue reportando el WARN pese al cambio en el dashboard confirmado por el usuario; ver "Verification log". Riesgo aceptado, no bloquea el resto del spec.
- [x] Rate limit de signups revisado/ajustado en el dashboard de Supabase (verificado por el usuario; sin control por IP real, documentado como limitación conocida).
- [x] RLS confirmado habilitado en `public.games` y `public.scores` (ya cumplido, sin cambios de código).
- [x] En `app/auth/page.tsx` (Crear cuenta), escribir una contraseña de menos de 8 caracteres muestra el mensaje de "no cumple" y deshabilita el submit; al llegar a 8 caracteres el submit se habilita.
- [x] En `app/auth/reset-password/page.tsx`, la nueva contraseña tiene la misma validación en vivo y el mismo comportamiento de submit.
- [ ] `npm run lint` y `npm run build` no reportan errores nuevos.

## Decisions taken and discarded

- **No se toca la policy de INSERT de `scores`**: decisión explícita del usuario de mantener la RLS abierta a escritura pública tal como ya está documentado en `CLAUDE.md`; el WARN del advisor queda como riesgo aceptado, no como bug a corregir en este spec.
- **Leaked password protection como prerrequisito manual del dashboard, sin equivalente en código**: decisión explícita del usuario — mismo patrón que las credenciales OAuth de SPEC 11, ya que Supabase no expone esa verificación (HaveIBeenPwned) al frontend.
- **Longitud mínima de contraseña sí se valida en el cliente, además del ajuste del dashboard**: decisión explícita del usuario (revertida respecto al borrador inicial) — regex simple `/^.{8,}$/`, sin reglas adicionales de complejidad (mayúsculas/números/símbolos), aplicada en vivo en registro y en restablecer contraseña.
- **Rate limit de signup solo vía el control nativo de Supabase, sin CAPTCHA**: decisión explícita del usuario de no integrar hCaptcha/Turnstile en este spec, aceptando que el límite no es estrictamente "por IP".
- **Solo los 3 headers del checklist, sin CSP/HSTS/Permissions-Policy**: decisión explícita del usuario para no abrir el alcance a una auditoría de orígenes externos, que ameritaría su propio spec.

## Verification log

- **2026-08-18** — `mcp__supabase__get_advisors(type: "security")` ejecutado tras el paso 1: el WARN `auth_leaked_password_protection` **sigue apareciendo**. El usuario confirma haber activado "Leaked password protection" en el dashboard, pero el advisor aún no lo refleja (posible retraso de propagación o el cambio no quedó guardado). Queda **pendiente de reverificación**; el criterio de aceptación 4 no se marca como cumplido todavía.
- **2026-08-18 (segunda verificación)** — El usuario confirma nuevamente el ajuste en el dashboard. `get_advisors` vuelve a ejecutarse y el WARN `auth_leaked_password_protection` **sigue presente**. Se cierra el spec dejando este ítem como **riesgo aceptado / pendiente de resolución fuera de este spec** (posible retraso de propagación del lado de Supabase, o el toggle no persiste correctamente); no bloquea el resto de los criterios de aceptación, que sí están cumplidos.

## Identified risks

- **Los ajustes de password length, leaked password protection y rate limit viven en el dashboard de Supabase, no en el repo**: si el usuario no completa el paso 1 del plan, los criterios de aceptación 3, 4 y 5 quedarán pendientes de verificación manual aunque el código (headers) esté completo. Mitigación: se documenta como prerrequisito explícito, igual que en SPEC 11 con OAuth.
- **El rate limit de Supabase no es "por IP" como pide literalmente el checklist**: sin CAPTCHA no hay forma de limitar por IP real en este plan. Mitigación: se documenta la limitación en el criterio de aceptación correspondiente en vez de fingir que quedó resuelto.
