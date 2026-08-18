# SPEC 11 — Autenticación real con Supabase (registro, login, OAuth)

> **Status:** Aprobado
> **Depends on:** SPEC 04, SPEC 06
> **Date:** 2026-08-18
> **Objective:** Reemplazar la sesión simulada en memoria (`lib/session-context.tsx`) por autenticación real de Supabase Auth — email/contraseña con confirmación de correo, más Google y GitHub como OAuth — manteniendo el modo invitado para navegar y jugar, pero exigiendo sesión real para guardar una puntuación.

## Scope

**In:**

- Registro con email + contraseña + username, usando `supabase.auth.signUp()` con `options.data.username` (queda en `user_metadata`, sin tabla `profiles` nueva) y `options.emailRedirectTo` apuntando al callback.
- Confirmación de email obligatoria: se asume "Confirm email" activo en el proyecto Supabase (configuración del dashboard, no vía migración). Tras registrarse, se muestra una pantalla "revisa tu correo" en vez de loguear inmediatamente.
- Login con email + contraseña vía `supabase.auth.signInWithPassword()`. El campo del formulario de login cambia de "Usuario" a "Correo electrónico" para que login y registro pidan lo mismo.
- Login con Google y GitHub vía `supabase.auth.signInWithOAuth({ provider })`, con `options.redirectTo` apuntando al callback. Los botones "◆ GOOGLE" / "▣ GITHUB" ya existentes en `app/auth/page.tsx` se cablean a esta llamada.
- **Prerrequisito manual fuera de este repo** (bloqueante para que Google/GitHub funcionen en runtime, no para escribir el código): el usuario debe crear las apps OAuth en Google Cloud Console y GitHub Developer Settings y cargar client ID/secret en el dashboard de Supabase (Authentication → Providers) — la URL de callback que deben registrar en ambos proveedores es `<SUPABASE_URL>/auth/v1/callback`. Sin esto, los botones ejecutan el flujo real pero Supabase responde con error "provider not enabled"; el código no se bloquea por su ausencia.
- Ruta `app/auth/callback/route.ts`: `GET` que recibe `?code=...`, llama a `supabase.auth.exchangeCodeForSession(code)` (cliente de servidor) y redirige a `/biblioteca` en éxito, o a `/auth?error=...` si falla. Cubre tanto el retorno de OAuth como el clic en el enlace de confirmación de email.
- Recuperación de contraseña: enlace "¿Olvidaste tu contraseña?" en la pestaña de login que llama a `supabase.auth.resetPasswordForEmail(email, { redirectTo: '.../auth/reset-password' })`, más una nueva ruta `/auth/reset-password` con formulario de nueva contraseña que llama a `supabase.auth.updateUser({ password })` usando la sesión temporal que Supabase deja tras seguir el enlace del correo.
- `lib/session-context.tsx` se reescribe para leer sesión real: `SessionProvider` obtiene el usuario inicial con `supabase.auth.getUser()` y se suscribe a `supabase.auth.onAuthStateChange` para mantenerlo sincronizado; `SessionUser` pasa a incluir el id de Supabase (`{ id: string; name: string } | null`), donde `name` sale de `user.user_metadata.username`. `login`/`logout` del contrato actual se retiran de la API pública del hook (ya no tiene sentido setear sesión a mano); `logout()` se sustituye por una función que llama a `supabase.auth.signOut()`.
- El botón "JUGAR COMO INVITADO" se mantiene tal cual: navega a `/biblioteca` sin crear sesión, `user` sigue pudiendo ser `null`.
- `GamePlayerClient.tsx`: si no hay sesión (`user === null`) al terminar la partida, en vez del botón "GUARDAR PUNTUACIÓN" se muestra un aviso ("Inicia sesión para guardar tu puntuación") con link a `/auth`; la puntuación de esa partida no se persiste si el jugador no inicia sesión antes de salir. Si hay sesión, `player_name` al insertar en `scores` sale de `user.user_metadata.username` en vez del campo de texto libre actual.
- `Nav.tsx`: `onSignOut` pasa a invocar la nueva función de cierre de sesión de `useSession()` (que llama a `supabase.auth.signOut()`) en vez de la función `logout()` en memoria; el resto del componente (menú, links) no cambia.
- Estados de error visibles en `app/auth/page.tsx`: credenciales inválidas, email ya registrado, contraseña muy corta (mínimo 6, validación por defecto de Supabase), error genérico de red — mensaje corto bajo el formulario, sin bloquear el resto de la UI.

**Out of scope (para futuros specs):**

- Tabla `profiles` y cualquier dato de perfil más allá del username (avatar, bio, estadísticas agregadas).
- Proteger `/biblioteca`, `/salon` o `/juego/[id]/jugar` detrás de login — siguen siendo públicas; solo guardar el score requiere sesión.
- Unicidad de username validada por la app (Supabase no la garantiza vía `user_metadata`; dos cuentas podrían compartir el mismo username, igual que hoy dos "invitados" podían escribir el mismo nombre).
- Registrar las apps OAuth en Google/GitHub y cargar las credenciales en el dashboard de Supabase — es un prerrequisito manual del usuario, no una tarea de código (ver Scope → In).
- Migrar `scores` para referenciar `auth.uid()` en vez de (o además de) `player_name` de texto, o cambiar las políticas RLS de `scores`/`games`.
- Rate limiting o protección anti-abuso adicional en signup/login más allá de lo que Supabase Auth trae por defecto.
- Eliminar o rediseñar visualmente `app/auth/page.tsx` — solo se ajustan los campos y el cableado descritos arriba.

## Data model

No se crean tablas nuevas. Cambios de tipos en código:

```ts
// lib/session-context.tsx
export type SessionUser = { id: string; name: string } | null;

type SessionContextValue = {
  user: SessionUser;
  loading: boolean; // true hasta que se resuelve el primer getUser()
  signOut: () => Promise<void>;
};
```

`user_metadata` en `auth.users` (Supabase, no migración SQL): `{ username: string }`, seteado en `signUp({ options: { data: { username } } })`. Los usuarios que entren vía OAuth (Google/GitHub) no tendrán `username` propio en `user_metadata` — se usa como _fallback_ el nombre/email que exponga el provider (`user.user_metadata.full_name` o el prefijo del email) para mostrar en HUD y `player_name`.

## Implementation plan

1. **Prerrequisito manual (usuario):** crear apps OAuth en Google Cloud Console y GitHub Developer Settings; cargar client ID/secret en el dashboard de Supabase (Authentication → Providers) y activar "Confirm email" en Authentication → Settings. Este paso no bloquea el resto de la implementación, pero sin él Google/GitHub y la confirmación de correo no funcionarán en runtime hasta completarlo.
2. Reescribir `lib/session-context.tsx`: `SessionProvider` usa `createClient()` de `lib/supabase/client.ts`, hace `supabase.auth.getUser()` al montar (`useEffect`) y se suscribe con `supabase.auth.onAuthStateChange((_, session) => ...)` para mantener `user` sincronizado; expone `{ user, loading, signOut }`.
3. Actualizar `components/Nav.tsx`: `onSignOut` llama a `await signOut()` (de `useSession()`) y luego `router.push('/')`; quitar el uso de `logout()`.
4. Actualizar `app/juego/[id]/jugar/GamePlayerClient.tsx`: sustituir el input de nombre libre por `user?.user_metadata` → usar `useSession().user`; si `user` es `null` al mostrar el resumen de fin de partida, renderizar el aviso + link a `/auth` en vez del botón "GUARDAR PUNTUACIÓN"; si hay `user`, `player_name: user.name` en el insert a `scores`.
5. Reescribir `app/auth/page.tsx`: cambiar el campo "Usuario" de la pestaña login por "Correo electrónico"; conectar `submit` a `supabase.auth.signInWithPassword({ email, password })` (login) o `supabase.auth.signUp({ email, password, options: { data: { username }, emailRedirectTo: `${origin}/auth/callback` } })` (registro); tras un `signUp` exitoso mostrar pantalla "revisa tu correo" en vez de redirigir; manejar y mostrar errores de ambas llamadas.
6. Cablear los botones "◆ GOOGLE" / "▣ GITHUB" a `supabase.auth.signInWithOAuth({ provider: 'google' | 'github', options: { redirectTo: `${origin}/auth/callback` } })`.
7. Añadir el enlace "¿Olvidaste tu contraseña?" bajo el formulario de login; al click, pide el email ya tipeado (o lo solicita si está vacío) y llama a `supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/reset-password` })`; mostrar confirmación "te enviamos un enlace".
8. Crear `app/auth/callback/route.ts`: `GET` handler, usa `lib/supabase/server.ts`, intercambia `code` por sesión con `exchangeCodeForSession`, redirige a `/biblioteca` (éxito) o `/auth?error=...` (fallo).
9. Crear `app/auth/reset-password/page.tsx`: formulario de nueva contraseña; en submit llama a `supabase.auth.updateUser({ password })` sobre el cliente browser (la sesión temporal ya está activa por haber seguido el enlace del correo, capturada por `proxy.ts`); tras éxito, redirige a `/biblioteca`.
10. Verificación manual end-to-end en `npm run dev`: registro con email real → confirmar correo → login; login con credenciales incorrectas muestra error; logout desde `Nav.tsx`; "olvidé mi contraseña" → definir nueva contraseña → login con la nueva; jugar como invitado sigue funcionando; terminar una partida sin sesión muestra el aviso en vez del botón guardar; terminar una partida con sesión guarda el score con el username real en `salon`. Google/GitHub se verifican solo si el prerrequisito manual (paso 1) ya está completo; si no, se documenta como pendiente.
11. `npm run lint` y `npm run build` limpios.

## Acceptance criteria

- [ ] `app/auth/page.tsx`: la pestaña "INICIAR SESIÓN" pide correo electrónico + contraseña (ya no "Usuario").
- [ ] Registrar una cuenta nueva con email + contraseña + username muestra una pantalla "revisa tu correo" y no inicia sesión hasta confirmar el enlace recibido.
- [ ] Tras confirmar el correo (clic en el enlace), `app/auth/callback/route.ts` establece la sesión y redirige a `/biblioteca`.
- [ ] Iniciar sesión con email/contraseña correctos redirige a `/biblioteca` y `Nav.tsx` muestra el username (`user_metadata.username`).
- [ ] Iniciar sesión con credenciales incorrectas muestra un mensaje de error sin recargar la página.
- [ ] Los botones "◆ GOOGLE" / "▣ GITHUB" invocan `signInWithOAuth` con el provider correspondiente (verificable en Network aunque el provider no esté aún habilitado en el dashboard).
- [ ] "¿Olvidaste tu contraseña?" envía el correo de recuperación; seguir el enlace lleva a `/auth/reset-password`, donde definir una nueva contraseña permite loguear con ella después.
- [ ] Cerrar sesión desde `Nav.tsx` limpia la sesión de Supabase (`supabase.auth.getUser()` vuelve a devolver `null`) y redirige a `/`.
- [ ] "JUGAR COMO INVITADO" sigue llevando a `/biblioteca` sin crear sesión, y navegar biblioteca/salón/detalle/jugar sin sesión funciona igual que hoy.
- [ ] Al terminar una partida sin sesión activa, en vez de "GUARDAR PUNTUACIÓN" se ve el aviso con link a `/auth`.
- [ ] Al terminar una partida con sesión activa, "GUARDAR PUNTUACIÓN" inserta en `scores` con `player_name` igual al username de la cuenta, y el score aparece en `/salon`.
- [ ] `npm run lint` y `npm run build` no reportan errores nuevos.

## Decisions taken and discarded

- **Username en `user_metadata` en vez de tabla `profiles`**: evita una migración y RLS nuevas para un dato que hoy es solo texto de display; se puede migrar a `profiles` en un spec futuro si se necesita más que un nombre (avatar, stats). Decisión del usuario, confirmada en la fase de preguntas.
- **Login con email en vez de username**: `signInWithPassword` de Supabase requiere email por defecto; resolver username→email añadiría una consulta/tabla extra solo para mantener el campo "Usuario" del mock actual. Se prioriza el flujo estándar de Supabase.
- **Guardar score exige sesión, pero navegar/jugar no**: decisión explícita del usuario ("menos fricción") — jugar sigue siendo público, pero la puntuación queda ligada a una cuenta real en vez de un nombre libre sin verificar.
- **Credenciales OAuth quedan como prerrequisito manual, no bloquean la implementación**: crear apps en Google/GitHub y cargarlas en Supabase es una tarea fuera del repo que solo el usuario puede hacer (requiere sus propias cuentas de desarrollador); el código se escribe completo y funcional en cuanto esas credenciales existan.
- **Confirmación de email obligatoria**: decisión explícita del usuario, pese a que añade un paso a modificar en el dashboard de Supabase (no vía migración) y una pantalla intermedia "revisa tu correo".
- **Se incluye recuperación de contraseña en esta misma spec**: decisión explícita del usuario al cerrar la fase de preguntas, en vez de dejarlo para un spec separado.

## Identified risks

- **"Confirm email" y las credenciales OAuth se configuran en el dashboard de Supabase, no en el repo**: si no están activas/cargadas al momento de implementar, el flujo de registro por email quedará probado solo hasta "revisa tu correo", y Google/GitHub fallarán con "provider not enabled". Mitigación: paso 1 del plan de implementación lo deja como prerrequisito explícito y el criterio de aceptación de OAuth se puede verificar solo a nivel de llamada (Network), no de login exitoso, si el prerrequisito no está listo.
- **Emails de confirmación/recuperación dependen del SMTP por defecto de Supabase**: el proyecto libre de Supabase tiene límites de envío y puede ir a spam. Mitigación: fuera de alcance configurar un SMTP propio en esta spec; si los correos no llegan en pruebas, es un problema de configuración de Supabase, no del código.
- **Cambiar `SessionUser` de `{ name }` a `{ id, name }` es un cambio de contrato que toca 4 archivos (`Nav.tsx`, `GamePlayerClient.tsx`, `SalonClient.tsx`, `app/auth/page.tsx`)**: mitigación, el plan de implementación los enumera explícitamente para no dejar ninguno con el tipo viejo.
