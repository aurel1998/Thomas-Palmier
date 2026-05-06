import { NextResponse } from "next/server";
import { getServerSupabaseOrResponse } from "../../../lib/supabaseServer";
import { requireAdmin } from "../../../lib/apiAuth";

type CategoryBody = {
  name?: unknown;
  description?: unknown;
  position?: unknown;
};

/**
 * GET /api/categories
 * Liste simple des categories triees par ordre editorial.
 */
export async function GET() {
  const srv = getServerSupabaseOrResponse();
  if (!srv.ok) return srv.response;

  const { data, error } = await srv.supabase
    .from("categories")
    .select("*")
    .order("position", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Impossible de recuperer les categories.", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: data ?? [] }, { status: 200 });
}

/**
 * POST /api/categories
 * Body JSON : { name, description? }
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as CategoryBody;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const position =
      typeof body.position === "number" && Number.isFinite(body.position)
        ? Math.max(0, Math.floor(body.position))
        : 100;

    if (!name) {
      return NextResponse.json({ error: "Le champ 'name' est obligatoire." }, { status: 400 });
    }

    const srv = getServerSupabaseOrResponse();
    if (!srv.ok) return srv.response;

    const { data, error } = await srv.supabase
      .from("categories")
      .insert({ name, description, position })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Impossible de creer la categorie.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
  }
}
