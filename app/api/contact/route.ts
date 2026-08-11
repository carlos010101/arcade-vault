import { Resend } from "resend";

type ContactPayload = {
  name: string;
  email: string;
  msg: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidPayload(body: unknown): body is ContactPayload {
  if (typeof body !== "object" || body === null) return false;
  const { name, email, msg } = body as Record<string, unknown>;
  return (
    typeof name === "string" &&
    name.trim().length > 0 &&
    typeof email === "string" &&
    EMAIL_REGEX.test(email.trim()) &&
    typeof msg === "string" &&
    msg.trim().length > 0
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Cuerpo de la petición inválido." }, { status: 400 });
  }

  if (!isValidPayload(body)) {
    return Response.json(
      { error: "Nombre, correo y mensaje son obligatorios, y el correo debe tener un formato válido." },
      { status: 400 }
    );
  }

  const { name, email, msg } = body;

  if (!process.env.RESEND_API_KEY) {
    return Response.json({ error: "El servicio de correo no está configurado." }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: "chedezv@gmail.com",
    subject: `Nuevo mensaje de contacto de ${name}`,
    text: `Nombre: ${name}\nCorreo: ${email}\n\nMensaje:\n${msg}`,
    html: `<p><strong>Nombre:</strong> ${name}</p><p><strong>Correo:</strong> ${email}</p><p><strong>Mensaje:</strong></p><p>${msg}</p>`,
  });

  if (error) {
    return Response.json({ error: "No se pudo enviar el correo. Intenta de nuevo." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
