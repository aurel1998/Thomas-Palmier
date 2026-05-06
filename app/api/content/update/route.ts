import { NextResponse } from "next/server";
import type { Content, ContentType } from "../../../../types/content";
import { getServerSupabaseOrResponse } from "../../../../lib/supabaseServer";
import { requireAdmin } from "../../../../lib/apiAuth";

const allowedTypes: ContentType[] = ["video", "article", "audio"];

type UpdateContentBody = {
  id?: unknown;
  title?: unknown;
  type?: unknown;
  content?: unknown;
  image_url?: unknown;
  tags?: unknown;
  category_id?: unknown;
  is_featured?: unknown;
};

function normalizeTags(tags: unknown): string[] | undefined {
  if (tags === undefined) return undefined;
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/**
 * PUT /api/content/update
 * Body JSON : { id, title?, type?, content?, image_url?, tags? }
 * Met a jour uniquement les champs fournis.
 */
export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as UpdateContentBody;
    const id = typeof body.id === "string" ? body.id.trim() : "";

    if (!id) {
      return NextResponse.json({ error: "Le champ 'id' est obligatoire." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return NextResponse.json(
          { error: "Le champ 'title' doit etre un texte non vide." },
          { status: 400 }
        );
      }
      updates.title = body.title.trim();
    }

    if (body.type !== undefined) {
      if (typeof body.type !== "string" || !allowedTypes.includes(body.type as ContentType)) {
        return NextResponse.json(
          { error: "Le champ 'type' doit etre video, article ou audio." },
          { status: 400 }
        );
      }
      updates.type = body.type;
    }

    if (body.content !== undefined) {
      updates.content = typeof body.content === "string" ? body.content : "";
    }

    if (body.image_url !== undefined) {
      updates.image_url = typeof body.image_url === "string" ? body.image_url : "";
    }

    const tags = normalizeTags(body.tags);
    if (tags !== undefined) updates.tags = tags;

    if (body.category_id !== undefined) {
      updates.category_id = typeof body.category_id === "string" ? body.category_id : null;
    }

    if (body.is_featured !== undefined) {
      if (typeof body.is_featured !== "boolean") {
        return NextResponse.json(
          { error: "Le champ 'is_featured' doit etre un booleen." },
          { status: 400 }
        );
      }
      updates.is_featured = body.is_featured;
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "Aucune donnee a mettre a jour." }, { status: 400 });
    }

    const srv = getServerSupabaseOrResponse();
    if (!srv.ok) return srv.response;

    if (updates.is_featured === true) {
      const { error: resetFeaturedError } = await srv.supabase
        .from("contents")
        .update({ is_featured: false })
        .eq("is_featured", true)
        .neq("id", id);
      if (resetFeaturedError) {
        return NextResponse.json(
          { error: "Impossible de preparer la mise a la une.", details: resetFeaturedError.message },
          { status: 500 }
        );
      }
    }

    const { data, error } = await srv.supabase
      .from("contents")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Impossible de mettre a jour le contenu.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data as Content }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
  }
}
