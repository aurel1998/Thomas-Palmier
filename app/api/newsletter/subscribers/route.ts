import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/apiAuth";
import { isMailerConfigured, getMailFrom } from "../../../../lib/mailer";
import {
  getNewsletterCampaignStats,
  getRecentNewsletterCampaigns,
} from "../../../../lib/newsletterCampaigns";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

export type SubscriberDto = {
  id: string;
  email: string;
  fullName: string | null;
  isActive: boolean;
  subscribedAt: string;
  unsubscribedAt: string | null;
};

function mapSubscriber(row: {
  id: string;
  email: string;
  fullName: string | null;
  isActive: boolean;
  subscribedAt: Date;
  unsubscribedAt: Date | null;
}): SubscriberDto {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    isActive: row.isActive,
    subscribedAt: row.subscribedAt.toISOString(),
    unsubscribedAt: row.unsubscribedAt?.toISOString() ?? null,
  };
}

/**
 * GET /api/newsletter/subscribers — liste et stats (admin).
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const [rows, campaigns, recentCampaigns] = await Promise.all([
      prisma.subscriber.findMany({ orderBy: { subscribedAt: "desc" } }),
      getNewsletterCampaignStats(),
      getRecentNewsletterCampaigns(12),
    ]);
    const subscribers = rows.map(mapSubscriber);
    const active = subscribers.filter((s) => s.isActive).length;
    const inactive = subscribers.length - active;

    return NextResponse.json(
      {
        data: subscribers,
        stats: {
          total: subscribers.length,
          active,
          inactive,
          unsubscribed: inactive,
        },
        campaigns,
        recentCampaigns,
        mailer: {
          configured: isMailerConfigured(),
          from: getMailFrom(),
        },
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "Impossible de charger les abonnés." },
      { status: 500 }
    );
  }
}

type PatchBody = { id?: unknown; isActive?: unknown };

/**
 * PATCH /api/newsletter/subscribers — activer/désactiver un abonné (admin).
 * Body : { id, isActive }
 */
export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) {
    return NextResponse.json({ error: "Champ 'id' requis." }, { status: 400 });
  }
  if (typeof body.isActive !== "boolean") {
    return NextResponse.json({ error: "Champ 'isActive' (booléen) requis." }, { status: 400 });
  }

  try {
    const updated = await prisma.subscriber.update({
      where: { id },
      data: {
        isActive: body.isActive,
        unsubscribedAt: body.isActive ? null : new Date(),
      },
    });
    return NextResponse.json({ data: mapSubscriber(updated) }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Abonné introuvable ou mise à jour impossible." }, { status: 404 });
  }
}
