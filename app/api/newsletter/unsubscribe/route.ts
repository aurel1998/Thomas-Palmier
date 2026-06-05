import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getSiteName } from "../../../../lib/siteConfig";

export const dynamic = "force-dynamic";

function htmlPage(title: string, message: string): NextResponse {
  const body = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f0f12;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:440px;padding:40px;background:#fff;border-radius:16px;text-align:center">
    <h1 style="margin:0 0 12px;font-size:22px;color:#111114">${title}</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#444">${message}</p>
    <a href="/" style="display:inline-block;background:#111114;color:#fff;text-decoration:none;padding:11px 22px;border-radius:999px;font-size:14px;font-weight:600">Retour au site</a>
  </div>
</body></html>`;
  return new NextResponse(body, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/**
 * GET /api/newsletter/unsubscribe?id=<uuid> — desinscription en un clic.
 * L'UUID de l'abonne sert de jeton (non devinable).
 */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id) {
    return htmlPage("Lien invalide", "Le lien de désinscription est incomplet.");
  }

  try {
    await prisma.subscriber.update({
      where: { id },
      data: { isActive: false, unsubscribedAt: new Date() },
    });
  } catch {
    // Lien inconnu/expire : on reste neutre (pas de fuite d'information).
    return htmlPage("Désinscription", `Vous ne recevrez plus d'emails de ${getSiteName()}.`);
  }

  return htmlPage("Désinscription confirmée", `Vous ne recevrez plus d'emails de ${getSiteName()}.`);
}
