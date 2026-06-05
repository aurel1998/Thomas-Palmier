import { NextResponse } from "next/server";
import type { Content } from "../../../types/content";
import { requireAdmin } from "../../../lib/apiAuth";
import { mapContentRow } from "../../../lib/dbMappers";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

export type DashboardSubscriberDto = {
  id: string;
  email: string;
  fullName: string | null;
  isActive: boolean;
  subscribedAt: string;
};

export type DashboardResponse = {
  stats: {
    contentsTotal: number;
    videos: number;
    articles: number;
    audios: number;
    subscribersActive: number;
    upcomingEvents: number;
  };
  featured: Content | null;
  recentContents: Content[];
  recentSubscribers: DashboardSubscriberDto[];
};

/**
 * GET /api/dashboard — indicateurs et listes récentes (admin).
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const now = new Date();

    const [contents, upcomingCount, subscribersActive, recentSubscribers] = await Promise.all([
      prisma.content.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.event.count({
        where: { status: "published", date: { gte: now } },
      }),
      prisma.subscriber.count({ where: { isActive: true } }),
      prisma.subscriber.findMany({
        orderBy: { subscribedAt: "desc" },
        take: 5,
        select: {
          id: true,
          email: true,
          fullName: true,
          isActive: true,
          subscribedAt: true,
        },
      }),
    ]);

    const videos = contents.filter((c) => c.type === "video").length;
    const articles = contents.filter((c) => c.type === "article").length;
    const audios = contents.filter((c) => c.type === "audio").length;

    const published = contents.filter((c) => c.status === "published");
    const featuredRow = published.find((c) => c.isFeatured) ?? null;
    const recentContents = published.slice(0, 5).map(mapContentRow) as Content[];

    const payload: DashboardResponse = {
      stats: {
        contentsTotal: contents.length,
        videos,
        articles,
        audios,
        subscribersActive,
        upcomingEvents: upcomingCount,
      },
      featured: featuredRow ? (mapContentRow(featuredRow) as Content) : null,
      recentContents,
      recentSubscribers: recentSubscribers.map((s) => ({
        id: s.id,
        email: s.email,
        fullName: s.fullName,
        isActive: s.isActive,
        subscribedAt: s.subscribedAt.toISOString(),
      })),
    };

    return NextResponse.json(
      { data: payload },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "Impossible de charger le tableau de bord." },
      { status: 500 }
    );
  }
}
