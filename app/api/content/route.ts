import { NextResponse } from "next/server";
import type { Content, ContentType } from "../../../types/content";
import { getServerSupabaseOrResponse } from "../../../lib/supabaseServer";

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

    const srv = getServerSupabaseOrResponse();
    if (!srv.ok) return srv.response;

    const wantStats = searchParams.get("stats") === "1";

    // Comptes globaux par type (pour badges / nav coherente avec pagination).
    let countsByType:
      | { all: number; video: number; article: number; audio: number }
      | undefined;
    if (wantStats) {
      const [rAll, rVideo, rArticle, rAudio] = await Promise.all([
        srv.supabase.from("contents").select("id", { count: "exact", head: true }),
        srv.supabase
          .from("contents")
          .select("id", { count: "exact", head: true })
          .eq("type", "video"),
        srv.supabase
          .from("contents")
          .select("id", { count: "exact", head: true })
          .eq("type", "article"),
        srv.supabase
          .from("contents")
          .select("id", { count: "exact", head: true })
          .eq("type", "audio"),
      ]);
      countsByType = {
        all: rAll.count ?? 0,
        video: rVideo.count ?? 0,
        article: rArticle.count ?? 0,
        audio: rAudio.count ?? 0,
      };
    }

    // On demande `count: "exact"` uniquement en mode paginer (evite un cout
    // inutile en mode complet).
    const countMode = hasLimit ? { count: "exact" as const } : undefined;

    let query = srv.supabase
      .from("contents")
      .select("*", countMode)
      .order("created_at", { ascending: false });

    if (typeParam) query = query.eq("type", typeParam);
    if (hasLimit && limit !== null) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Impossible de recuperer les contenus.", details: error.message },
        { status: 500 }
      );
    }

    const items = (data ?? []) as Content[];
    const total = hasLimit ? count ?? items.length : items.length;
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
