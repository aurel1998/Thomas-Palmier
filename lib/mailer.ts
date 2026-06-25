import nodemailer, { type Transporter } from "nodemailer";

/**
 * Transport SMTP local/VPS configurable via variables d'environnement.
 *
 * Variables attendues (.env) :
 *   SMTP_HOST       hote SMTP (ex. smtp.ionos.fr)
 *   SMTP_PORT       port (587 STARTTLS, 465 SSL)
 *   SMTP_SECURE     "true" pour SSL (port 465), sinon STARTTLS
 *   EMAIL_USER      identifiant SMTP (alias accepte : SMTP_USER)
 *   EMAIL_PASS      mot de passe SMTP (alias accepte : SMTP_PASS)
 *   MAIL_FROM       expediteur (ex. "Sport Journal <contact@domaine.fr>")
 *
 * Si la config est absente, l'envoi est ignore proprement (no-op) afin de ne
 * jamais casser le reste de l'application (inscription, creation de contenu...).
 */

export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

let cachedTransporter: Transporter | null = null;

/** Identifiants SMTP : EMAIL_USER/EMAIL_PASS canoniques, SMTP_USER/SMTP_PASS acceptes. */
function getSmtpUser(): string | undefined {
  return process.env.EMAIL_USER ?? process.env.SMTP_USER;
}
function getSmtpPass(): string | undefined {
  return process.env.EMAIL_PASS ?? process.env.SMTP_PASS;
}

export function isMailerConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      getSmtpUser() &&
      getSmtpPass()
  );
}

export function getMailFrom(): string {
  return (
    process.env.MAIL_FROM ??
    getSmtpUser() ??
    "no-reply@localhost"
  );
}

function getTransporter(): Transporter | null {
  if (!isMailerConfigured()) return null;
  if (cachedTransporter) return cachedTransporter;

  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: getSmtpUser(),
      pass: getSmtpPass(),
    },
  });

  return cachedTransporter;
}

/**
 * Envoie un email. Retourne true si envoye, false si le mailer n'est pas
 * configure ou en cas d'erreur (l'erreur est loguee, jamais propagee).
 */
export async function sendMail(message: MailMessage): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[mailer] SMTP non configure — email ignore:", message.subject);
    return false;
  }

  try {
    await transporter.sendMail({
      from: getMailFrom(),
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text ?? stripHtml(message.html),
    });
    return true;
  } catch (error) {
    console.error("[mailer] Echec envoi email:", (error as Error).message);
    return false;
  }
}

/** Version texte de secours a partir du HTML. */
export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
