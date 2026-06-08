import { NextResponse } from "next/server";
import type { Content } from "../../../types/content";
import { requireAdmin } from "../../../lib/apiAuth";
import {
  buildContentsPublishedByMonth,
  buildSubscribersByMonth,
  mergeTypeBuckets,
  type DashboardAnalytics,
} from "../../../lib/dashboardAnalytics";
import { mapContentRow, type ContentRow } from "../../../lib/dbMappers";
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
    contentsPublished: number;
    contentsDraft: number;
    videos: number;
    articles: number;
    audios: number;
    subscribersActive: number;
    upcomingEvents: number;
  };
  analytics: DashboardAnalytics;
  featured: Content | null;
  recentContents: Content[];
  recentSubscribers: DashboardSubscriberDto[];
};

/**
 * GET /api/dashboard — indicateurs, statistiques et listes récentes (admin).
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const now = new Date();

    const [
      contents,
      typeTotals,
      typePublished,
      categoryPublished,
      categories,
      upcomingCount,
      subscribersActive,
      subscribersInactive,
      recentSubscribers,
      allSubscribers,
      publishedDates,
      campaigns,
      eventTotals,
    ] = await Promise.all([
      prisma.content.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.content.groupBy({ by: ["type"], _count: { _all: true } }),
      prisma.content.groupBy({
        by: ["type"],
        where: { status: "published" },
        _count: { _all: true },
      }),
      prisma.content.groupBy({
        by: ["categoryId"],
        where: { status: "published" },
        _count: { _all: true },
      }),
      prisma.category.findMany({
        select: { id: true, name: true },
        orderBy: { position: "asc" },
      }),
      prisma.event.count({
        where: { status: "published", date: { gte: now } },
      }),
      prisma.subscriber.count({ where: { isActive: true } }),
      prisma.subscriber.count({ where: { isActive: false } }),
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
      prisma.subscriber.findMany({
        select: { subscribedAt: true },
        orderBy: { subscribedAt: "asc" },
      }),
      prisma.content.findMany({
        where: { status: "published" },
        select: { createdAt: true },
      }),
      prisma.newsletterCampaign.findMany({
        select: { sentCount: true },
      }),
      Promise.all([
        prisma.event.count(),
        prisma.event.count({ where: { status: "published" } }),
        prisma.event.count({ where: { status: "draft" } }),
        prisma.event.count({ where: { status: "published", date: { gte: now } } }),
        prisma.event.count({ where: { status: "published", date: { lt: now } } }),
        prisma.event.count({ where: { isFeatured: true, status: "published" } }),
      ]),
    ]);

    const rows = contents as ContentRow[];
    const videos = rows.filter((c) => c.type === "video").length;
    const articles = rows.filter((c) => c.type === "article").length;
    const audios = rows.filter((c) => c.type === "audio").length;
    const published = rows.filter((c) => c.status === "published");
    const featuredRow = published.find((c) => c.isFeatured) ?? null;
    const recentContents = published.slice(0, 5).map(mapContentRow) as Content[];

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const analytics: DashboardAnalytics = {
      contentsByType: mergeTypeBuckets(
        typeTotals.map((r) => ({ type: r.type, count: r._count._all })),
        typePublished.map((r) => ({ type: r.type, count: r._count._all }))
      ),
      contentsByCategory: categoryPublished
        .map((row) => ({
          categoryId: row.categoryId,
          label: row.categoryId ? (categoryMap.get(row.categoryId) ?? "Rubrique") : "Sans rubrique",
          count: row._count._all,
        }))
        .sort((a, b) => b.count - a.count),
      subscribersByMonth: buildSubscribersByMonth(
        allSubscribers.map((s) => s.subscribedAt),
        now
      ),
      contentsPublishedByMonth: buildContentsPublishedByMonth(
        publishedDates.map((c) => c.createdAt),
        now
      ),
      newsletter: {
        active: subscribersActive,
        inactive: subscribersInactive,
        campaignsSent: campaigns.length,
        totalRecipientsReached: campaigns.reduce((sum, c) => sum + c.sentCount, 0),
      },
      agenda: {
        total: eventTotals[0],
        published: eventTotals[1],
        draft: eventTotals[2],
        upcoming: eventTotals[3],
        past: eventTotals[4],
        featured: eventTotals[5],
      },
    };

    const payload: DashboardResponse = {
      stats: {
        contentsTotal: rows.length,
        contentsPublished: published.length,
        contentsDraft: rows.length - published.length,
        videos,
        articles,
        audios,
        subscribersActive,
        upcomingEvents: upcomingCount,
      },
      analytics,
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
