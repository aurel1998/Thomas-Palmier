import { NextResponse } from "next/server";
import { isRateLimited } from "../../../../lib/rateLimit";
import { prisma } from "../../../../lib/prisma";
import { isMailerConfigured, sendMail } from "../../../../lib/mailer";
import { buildWelcomeEmail } from "../../../../lib/newsletter";

export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubscribeBody = { email?: unknown; fullName?: unknown };

/**
 * POST /api/newsletter/subscribe — inscription publique a la newsletter.
 * Body JSON : { email, fullName? }
 * Reactive un abonne precedemment desinscrit (idempotent).
 */
export async function POST(request: Request) {
  let body: SubscribeBody;
  try {
    body = (await request.json()) as SubscribeBody;
  } catch {
    return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : null;

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
  }

  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";

  if (isRateLimited(`newsletter:${clientIp}`, 8, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  try {
    const subscriber = await prisma.subscriber.upsert({
      where: { email },
      update: { isActive: true, unsubscribedAt: null, fullName: fullName ?? undefined },
      create: { email, fullName },
    });

    if (isMailerConfigured()) {
      const welcome = buildWelcomeEmail(subscriber.id);
      void sendMail({ to: email, subject: welcome.subject, html: welcome.html });
    }

    return NextResponse.json(
      { ok: true, message: "Inscription confirmée." },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Inscription impossible pour le moment." }, { status: 500 });
  }
}
