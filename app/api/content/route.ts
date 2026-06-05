import { NextResponse } from "next/server";
import type { Content, ContentType } from "../../../types/content";
import { isAdminSession } from "../../../lib/apiAuth";
import { prisma } from "../../../lib/prisma";
import { mapContentRow } from "../../../lib/dbMappers";

const allowedTypes: ContentType[] = ["video", "article", "audio"];
const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;

/**
 * GET /api/content
 * GET /api/content?type=video|article|audio
 * GET /api/content?limit=24&offset=0
 * GET /api/content?limit=24&offset=0&stats=1
 *
 * Retourne les contenus tries par `created_at` (desc).
 * Avec `stats=1`, ajoute `countsByType` (totaux reels en base) pour badges / nav
 * coherentes avec la pagination.
 *
 * Mode paginer : si `limit` est fourni, on renvoie une tranche + metadonnees
 * (`total`, `hasMore`) pour piloter l'infinite scroll cote client.
 *
 * Mode complet (retrocompat) : sans `limit`, on renvoie tous les contenus.
 * `hasMore` est alors `false` et `total = data.length`.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    if (typeParam && !allowedTypes.includes(typeParam as ContentType)) {
      return NextResponse.json(
        { error: "Le parametre 'type' doit etre video, article ou audio." },
        { status: 400 }
      );
    }

    const hasLimit = limitParam !== null;
    const limit = hasLimit
      ? Math.min(Math.max(parseInt(limitParam ?? "", 10) || DEFAULT_LIMIT, 1), MAX_LIMIT)
      : null;
    const offset = Math.max(parseInt(offsetParam ?? "0", 10) || 0, 0);

    const wantStats = searchParams.get("stats") === "1";
    const includeDrafts =
      searchParams.get("include_drafts") === "1" && (await isAdminSession());

    // Comptes globaux par type (pour badges / nav coherente avec pagination).
    let countsByType:
      | { all: number; video: number; article: number; audio: number }
      | undefined;
    const publishedOnly = includeDrafts ? undefined : ({ status: "published" as const } satisfies { status: "published" });

    if (wantStats) {
      const [all, video, article, audio] = await Promise.all([
        prisma.content.count({ where: publishedOnly }),
        prisma.content.count({ where: { ...publishedOnly, type: "video" } }),
        prisma.content.count({ where: { ...publishedOnly, type: "article" } }),
        prisma.content.count({ where: { ...publishedOnly, type: "audio" } }),
      ]);
      countsByType = {
        all,
        video,
        article,
        audio,
      };
    }

    const categoryIdParam = searchParams.get("category_id")?.trim() || undefined;
    const subcategoryIdParam = searchParams.get("subcategory_id")?.trim() || undefined;

    const where: {
      type?: ContentType;
      categoryId?: string;
      subcategoryId?: string;
      status?: "published";
    } = {};
    if (!includeDrafts) where.status = "published";
    if (typeParam) where.type = typeParam as ContentType;
    if (categoryIdParam) where.categoryId = categoryIdParam;
    if (subcategoryIdParam) where.subcategoryId = subcategoryIdParam;

    const hasWhere = Object.keys(where).length > 0;
    const [rows, totalCount] = await Promise.all([
      prisma.content.findMany({
        where: hasWhere ? where : undefined,
        orderBy: { createdAt: "desc" },
        ...(hasLimit && limit !== null ? { skip: offset, take: limit } : {}),
      }),
      hasLimit ? prisma.content.count({ where: hasWhere ? where : undefined }) : Promise.resolve(0),
    ]);
    const items = rows.map(mapContentRow) as Content[];
    const total = hasLimit ? totalCount : items.length;
    const hasMore = hasLimit ? offset + items.length < total : false;

    return NextResponse.json(
      {
        data: items,
        total,
        limit: hasLimit ? limit : items.length,
        offset,
        hasMore,
        ...(countsByType ? { countsByType } : {}),
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Erreur serveur inattendue." }, { status: 500 });
  }
}
