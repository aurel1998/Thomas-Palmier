import { NextResponse } from "next/server";
import { isMailerConfigured, sendMail } from "../../../lib/mailer";
import { isRateLimited } from "../../../lib/rateLimit";

export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactBody = {
  requestType?: unknown;
  name?: unknown;
  email?: unknown;
  message?: unknown;
};

function getContactRecipient(): string {
  return (
    process.env.CONTACT_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ||
    "contact@thomaspalmier.fr"
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * POST /api/contact — envoi d'une demande de contact / partenariat par email (SMTP).
 */
export async function POST(request: Request) {
  let body: ContactBody;
  try {
    body = (await request.json()) as ContactBody;
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide (JSON attendu)." }, { status: 400 });
  }

  const requestType = body.requestType === "sujet" ? "sujet" : "partenariat";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (name.length < 2) {
    return NextResponse.json({ error: "Indiquez votre nom." }, { status: 400 });
  }
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
  }
  if (message.length < 9) {
    return NextResponse.json({ error: "Message trop court." }, { status: 400 });
  }

  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";

  if (isRateLimited(`contact:${clientIp}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  if (!isMailerConfigured()) {
    return NextResponse.json(
      { error: "L'envoi par formulaire n'est pas disponible pour le moment. Écrivez directement à contact@thomaspalmier.fr." },
      { status: 503 }
    );
  }

  const typeLabel = requestType === "partenariat" ? "Partenariat" : "Sujet";
  const subject =
    requestType === "partenariat" ? "Demande de partenariat — site web" : "Proposition de sujet — site web";

  const text = [
    `Type de demande : ${typeLabel}`,
    `Nom : ${name}`,
    `Email : ${email}`,
    "",
    "Message :",
    message,
  ].join("\n");

  const html = `
    <p><strong>Type de demande :</strong> ${escapeHtml(typeLabel)}</p>
    <p><strong>Nom :</strong> ${escapeHtml(name)}</p>
    <p><strong>Email :</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
    <hr />
    <p><strong>Message :</strong></p>
    <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
  `;

  const sent = await sendMail({
    to: getContactRecipient(),
    replyTo: email,
    subject,
    html,
    text,
  });

  if (!sent) {
    return NextResponse.json(
      { error: "Impossible d'envoyer le message pour le moment. Réessayez plus tard." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { ok: true, message: "Message envoyé. Thomas vous répondra sous 48 h ouvrées." },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}
