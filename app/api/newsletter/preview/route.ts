import { NextResponse } from "next/server";
import type { Content } from "../../../../types/content";
import { requireAdmin } from "../../../../lib/apiAuth";
import { prisma } from "../../../../lib/prisma";
import { mapContentRow } from "../../../../lib/dbMappers";
import { getMailFrom } from "../../../../lib/mailer";
import { previewCampaignEmail, previewContentEmail } from "../../../../lib/newsletter";

export const dynamic = "force-dynamic";

type PreviewBody = {
  contentId?: unknown;
  subject?: unknown;
  html?: unknown;
};

/**
 * POST /api/newsletter/preview — aperçu HTML exact avant envoi (admin).
 *
 * Modes :
 *   - { contentId }     : annonce d'un contenu publié
 *   - { subject, html } : campagne libre
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: PreviewBody;
  try {
    body = (await request.json()) as PreviewBody;
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide (JSON attendu)." }, { status: 400 });
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
          { error: "Seuls les contenus publiés peuvent être prévisualisés." },
          { status: 400 }
        );
      }
      const content = mapContentRow(row) as Content;
      const preview = previewContentEmail(content);
      return NextResponse.json(
        {
          data: {
            ...preview,
            from: getMailFrom(),
            kind: "content" as const,
          },
        },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const html = typeof body.html === "string" ? body.html.trim() : "";
    if (!subject || !html) {
      return NextResponse.json(
        { error: "Fournis 'contentId' ou bien 'subject' et 'html'." },
        { status: 400 }
      );
    }

    const preview = previewCampaignEmail({ subject, html });
    return NextResponse.json(
      {
        data: {
          ...preview,
          from: getMailFrom(),
          kind: "campaign" as const,
        },
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Impossible de générer l'aperçu." }, { status: 500 });
  }
}
