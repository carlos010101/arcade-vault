# SPEC 03 — Pantalla "Acerca de" y envío de correo de contacto con Resend

> **Status:** Aprobado
> **Depends on:** SPEC 02
> **Date:** 2026-08-11
> **Objective:** Portar a Next.js la pantalla `about.jsx` de `references/templates/home-about/` como nueva ruta `/about`, conectando su formulario de contacto a un envío de correo real vía Resend a través de una API route.

## Scope

**In:**

- Nueva pantalla "Acerca de" en la ruta `/about`, migrada de `references/templates/home-about/about.jsx`: hero (`about-hero`) con kicker, título, misión y `highlight-row` de 3 iconos (HEART, BROWSER, PLANT); divisor animado (`about-divider`); y sección de contacto (`about-contact`) con intro + formulario (nombre, correo, mensaje).
- Migración de las clases CSS asociadas desde `references/templates/home-about/styles.css` a `app/globals.css` (`.about`, `.about-hero`, `.about-title`, `.about-mission`, `.highlight-row`, `.highlight`, `.about-divider`, `.div-bar`, `.div-pixels`, `.about-contact`, `.contact-grid`, `.contact-intro`, `.contact-tips`, `.contact-form`, `.terminal-success`, etc.), evitando duplicar reglas ya presentes.
- Efecto de aparición al hacer scroll (`useReveal` / `IntersectionObserver` sobre `.reveal`) migrado igual que en SPEC 02.
- Envío real del formulario de contacto: API route `app/api/contact/route.ts` que recibe `{ name, email, msg }` por POST, valida los datos en el servidor y llama a la API de Resend (paquete `resend`) para enviar el correo.
- El correo se envía `to: "chedezv@gmail.com"`, `from: "onboarding@resend.dev"`, con el nombre/email/mensaje del formulario en el cuerpo.
- La API key de Resend se lee de `process.env.RESEND_API_KEY` (variable de entorno, no hardcodeada). Se crea `.env.example` documentando la variable; `.env.local` (real, con la key) queda gitignoreado (ya cubierto por el patrón `.env*` existente en `.gitignore`).
- Estados de UI del formulario: `idle` (campos editables) → `sending` (botón deshabilitado mientras se espera la respuesta) → `success` (misma animación de terminal falsa del template, con el nombre del usuario) **o** `error` (mensaje de error visible, formulario permanece editable para reintentar).
- Validación en cliente: campos no vacíos (igual que el template, con el `shake` existente). Validación en servidor (API route): `name`, `email`, `msg` no vacíos + `email` con formato válido (regex simple); si falla, responde 400 con un mensaje de error.
- Actualización de `components/Nav.tsx`: nuevo link "Acerca de" (`/about`) en el menú de escritorio y en el panel móvil, con su `isActive`.
- Instalación de la dependencia `resend` (`npm install resend`).

**Out of scope (para futuros specs):**

- Rate limiting o protección anti-spam/anti-bot (captcha, honeypot) en el formulario de contacto.
- Envío de correo de confirmación al usuario que llena el formulario (solo se notifica al destinatario fijo).
- Persistencia de los mensajes de contacto en base de datos o archivo.
- Verificación de dominio propio en Resend (se usa `onboarding@resend.dev`).
- Internacionalización o textos en otro idioma.
- Tests automatizados.

## Data model

No se introduce ningún tipo persistente ni base de datos. Se define:

- Un tipo `ContactPayload` (o inline) en `app/api/contact/route.ts`: `{ name: string; email: string; msg: string }`, usado tanto para validar el body del request como para construir el correo.
- Los 3 highlights del hero (`{ i, t, c }` — icono, texto, color) quedan hardcodeados dentro del componente, igual que en `about.jsx`.

No hay `app-data.ts` involucrado ni cambios a estructuras existentes.

## Implementation plan

1. `npm install resend`; agregar `RESEND_API_KEY=` a un nuevo archivo `.env.example` en la raíz del repo (sin valor real).
2. Crear `app/api/contact/route.ts`: handler `POST` que parsea el JSON del body, valida `name`/`email`/`msg` (no vacíos + formato de email), instancia `new Resend(process.env.RESEND_API_KEY)`, llama a `resend.emails.send({ from: "onboarding@resend.dev", to: "chedezv@gmail.com", subject, html/text con name/email/msg })`, y responde `200` en éxito o `400`/`500` con `{ error: string }` en fallo (validación o error de Resend).
3. Crear `app/about/page.tsx` como componente cliente, migrando `about.jsx`: hero, highlights (`HighlightIcon` como componente interno o archivo separado), divisor con `.reveal`, sección de contacto con el formulario.
4. El `onSubmit` del formulario: valida campos no vacíos en cliente (igual que el template, con `shake`); si pasan, hace `fetch("/api/contact", { method: "POST", body: JSON.stringify({ name, email, msg }) })`; mientras espera la respuesta el botón muestra estado `sending` (deshabilitado); en éxito muestra la animación de terminal (`sent = form.name`); en error muestra un bloque de error con el mensaje y deja el formulario editable para reintentar.
5. Migrar las clases CSS necesarias de `references/templates/home-about/styles.css` (líneas `.about*`, `.highlight*`, `.contact*`, `.terminal-success`, `.div-bar`, `.div-pixels`) a `app/globals.css`, sin duplicar las que ya existan; agregar un bloque de estilo mínimo para el nuevo estado de error (reutilizando variables de color existentes, ej. `var(--magenta)` o similar tono de error ya presente en la paleta).
6. Actualizar `components/Nav.tsx`: agregar `Link href="/about"` con label "Acerca de" en el menú de escritorio y en el panel móvil; extender `isActive` para incluir `"about"` (`pathname.startsWith("/about")`).
7. Revisar responsive de `/about` (`contact-grid`, `highlight-row`) en mobile, reutilizando media queries del template si existen en `styles.css`.

## Acceptance criteria

- [ ] `npm run dev` levanta la app sin errores en consola.
- [ ] `/about` muestra: hero "ACERCA DE ARCADE VAULT" con misión y los 3 highlights (HEART, BROWSER, PLANT); divisor animado; sección de contacto con intro y formulario (nombre, correo, mensaje).
- [ ] Las secciones marcadas con `.reveal` aparecen con animación de fade/slide al hacer scroll hasta ellas.
- [ ] Enviar el formulario con algún campo vacío dispara el `shake` y no hace ningún request.
- [ ] Enviar el formulario completo con `RESEND_API_KEY` válida en `.env.local` envía un correo real a `chedezv@gmail.com` vía Resend y la UI muestra la animación de terminal de éxito con el nombre ingresado.
- [ ] Si `RESEND_API_KEY` falta o Resend devuelve error, la UI muestra un estado de error visible (no la animación de éxito) y el formulario sigue editable para reintentar.
- [ ] El API route `/api/contact` rechaza con `400` un body con `email` de formato inválido o campos vacíos, sin llamar a Resend.
- [ ] El botón de envío se deshabilita mientras la petición está en curso.
- [ ] El Nav muestra "Acerca de" como link, en escritorio y en el panel móvil, resaltado solo cuando la ruta es `/about`.
- [ ] `.env.example` documenta `RESEND_API_KEY`; `.env.local` no está trackeado por git.
- [ ] `npm run lint` no reporta errores.
- [ ] El diseño visual de `/about` coincide con `references/templates/home-about/arcade-vault-standalone.html` renderizado en el navegador.

## Decisions

- **Sí:** el envío de correo pasa por una API route (`app/api/contact/route.ts`) en vez de una Server Action, para mantener una separación clara cliente/servidor explícita y facilitar probar el endpoint de forma aislada (ej. `curl`).
- **Sí:** la API key de Resend vive en `RESEND_API_KEY` (variable de entorno), nunca hardcodeada ni expuesta al cliente. Es la única forma segura de manejar credenciales de un servicio externo.
- **Sí:** se usa `onboarding@resend.dev` como remitente por no haber dominio propio verificado en Resend. Cuando exista un dominio verificado, cambiar el `from` es un cambio de una línea.
- **Sí:** el destinatario fijo es `chedezv@gmail.com` (dueño del proyecto); no es configurable desde la UI.
- **Sí:** a diferencia del mock original (que siempre mostraba éxito), ahora que hay backend real se agrega un estado de error explícito en la UI. Ocultar errores reales de una integración externa generaría una falsa sensación de que el mensaje llegó cuando pudo no ser así.
- **Sí:** validación duplicada (cliente + servidor). El cliente da feedback inmediato (`shake`); el servidor es la garantía real, ya que el cliente puede ser bypassed.
- **No:** rate limiting, captcha o protección anti-spam. Se documenta como riesgo pero queda fuera de este spec por alcance.
- **No:** ruta en español (`/acerca-de`). Se usa `/about`, igual que el nombre del archivo del template y la clave `about` ya usada en `nav.jsx` de referencia, aunque el resto de rutas del proyecto (`/biblioteca`, `/salon`) esté en español.

## Identified risks

- Sin rate limiting, el endpoint `/api/contact` puede ser usado para enviar spam o agotar la cuota gratuita de Resend. Mitigación futura: captcha o límite por IP, fuera de este spec.
- Si `RESEND_API_KEY` no está configurada en el entorno de despliegue, todo envío fallará con el estado de error — debe documentarse como paso manual de configuración post-deploy.
