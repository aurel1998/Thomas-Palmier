import { NextResponse } from "next/server";
import type { Content, ContentType } from "../../../../types/content";
import { getServerSupabaseOrResponse } from "../../../../lib/supabaseServer";
import { requireAdmin } from "../../../../lib/apiAuth";

const allowedTypes: ContentType[] = ["video", "article", "audio"];

type CreateContentBody = {
  title?: unknown;
  type?: unknown;
  content?: unknown;
  image_url?: unknown;
  tags?: unknown;
  category_id?: unknown;
  is_featured?: unknown;
};

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/**
 * POST /api/content/create
 * Body JSON : { title, type, content?, image_url?, tags? }
 * Validations : title obligatoire, type in (video|article|audio).
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as CreateContentBody;

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const type = typeof body.type === "string" ? body.type.trim() : "";

    if (!title) {
      return NextResponse.json({ error: "Le champ 'title' est obligatoire." }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ error: "Le champ 'type' est obligatoire." }, { status: 400 });
    }
    if (!allowedTypes.includes(type as ContentType)) {
      return NextResponse.json(
        { error: "Le champ 'type' doit etre video, article ou audio." },
        { status: 400 }
      );
    }

    const srv = getServerSupabaseOrResponse();
    if (!srv.ok) return srv.response;

    const payload = {
      title,
      type: type as ContentType,
      content: typeof body.content === "string" ? body.content : "",
      image_url: typeof body.image_url === "string" ? body.image_url : "",
      tags: normalizeTags(body.tags),
      category_id: typeof body.category_id === "string" ? body.category_id : null,
      is_featured: typeof body.is_featured === "boolean" ? body.is_featured : false,
    };

    if (payload.is_featured) {
      const { error: resetFeaturedError } = await srv.supabase
        .from("contents")
        .update({ is_featured: false })
        .eq("is_featured", true);
      if (resetFeaturedError) {
        return NextResponse.json(
          { error: "Impossible de preparer la mise a la une.", details: resetFeaturedError.message },
          { status: 500 }
        );
      }
    }

    const { data, error } = await srv.supabase
      .from("contents")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Impossible de creer le contenu.", details: error.message },
        { status: 500 }
      );
    }

    const created: Content = {
      id: data.id,
      title: data.title,
      type: data.type,
      content: data.content,
      image_url: data.image_url,
      tags: Array.isArray(data.tags) ? data.tags : [],
      category_id: data.category_id ?? null,
      is_featured: Boolean(data.is_featured),
      created_at: data.created_at,
    };

    return NextResponse.json({ data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
  }
}
