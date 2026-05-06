import { NextResponse } from "next/server";
import { getServerSupabaseOrResponse } from "../../../../lib/supabaseServer";
import { requireAdmin } from "../../../../lib/apiAuth";

type CategoryBody = {
  name?: unknown;
  description?: unknown;
  position?: unknown;
};

/**
 * PUT /api/categories/:id
 * Body JSON : { name?, description? }
 */
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  try {
    const body = (await request.json()) as CategoryBody;
    const updates: Record<string, string | number> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return NextResponse.json(
          { error: "Le champ 'name' doit etre un texte non vide." },
          { status: 400 }
        );
      }
      updates.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updates.description = typeof body.description === "string" ? body.description.trim() : "";
    }

    if (body.position !== undefined) {
      if (typeof body.position !== "number" || !Number.isFinite(body.position)) {
        return NextResponse.json(
          { error: "Le champ 'position' doit etre un nombre." },
          { status: 400 }
        );
      }
      updates.position = Math.max(0, Math.floor(body.position));
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "Aucune donnee a mettre a jour." }, { status: 400 });
    }

    const srv = getServerSupabaseOrResponse();
    if (!srv.ok) return srv.response;

    const { data, error } = await srv.supabase
      .from("categories")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Impossible de modifier la categorie.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
  }
}

/**
 * DELETE /api/categories/:id
 */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  const srv = getServerSupabaseOrResponse();
  if (!srv.ok) return srv.response;

  const { error } = await srv.supabase.from("categories").delete().eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: "Impossible de supprimer la categorie.", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
