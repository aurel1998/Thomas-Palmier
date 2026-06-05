import { NextResponse } from "next/server";
import type { Content } from "../../../../types/content";
import { requireAdmin } from "../../../../lib/apiAuth";
import { prisma } from "../../../../lib/prisma";
import { mapContentRow } from "../../../../lib/dbMappers";
import { isMailerConfigured } from "../../../../lib/mailer";
import { notifyNewContent, sendNewsletter } from "../../../../lib/newsletter";
import { sanitizeNewsletterHtml } from "../../../../lib/sanitizeHtml";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type SendBody = {
  contentId?: unknown;
  subject?: unknown;
  html?: unknown;
};

/**
 * POST /api/newsletter/send — diffusion manuelle (admin).
 *
 * Deux modes :
 *   - { contentId }       : notifie les abonnes d'un contenu existant
 *   - { subject, html }   : newsletter libre
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  if (!isMailerConfigured()) {
    return NextResponse.json(
      { error: "SMTP non configure. Renseigne les variables SMTP_* dans .env." },
      { status: 503 }
    );
  }

  let body: SendBody;
  try {
    body = (await request.json()) as SendBody;
  } catch {
    return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
  }

  const contentId = typeof body.contentId === "string" ? body.contentId.trim() : "";

  try {
    if (contentId) {
      const row = await prisma.content.findUnique({ where: { id: contentId } });
      if (!row) {
        return NextResponse.json({ error: "Contenu introuvable." }, { status: 404 });
      }
      if (row.status !== "published") {
        return NextResponse.json(
          { error: "Seuls les contenus publiés peuvent être annoncés." },
          { status: 400 }
        );
      }
      const content = mapContentRow(row) as Content;
      const result = await notifyNewContent(content);
      return NextResponse.json({ data: result }, { status: 200 });
    }

    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const html = sanitizeNewsletterHtml(typeof body.html === "string" ? body.html : "");
    if (!subject || !html) {
      return NextResponse.json(
        { error: "Fournis 'contentId' ou bien 'subject' et 'html'." },
        { status: 400 }
      );
    }

    const result = await sendNewsletter({ subject, html });
    return NextResponse.json({ data: result }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Envoi de la newsletter impossible." }, { status: 500 });
  }
}
