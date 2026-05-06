import { NextResponse } from "next/server";
import type { Content } from "../../../../types/content";
import { getServerSupabaseOrResponse } from "../../../../lib/supabaseServer";

/** GET /api/content/:id - détail d'un contenu. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });
  }

  const srv = getServerSupabaseOrResponse();
  if (!srv.ok) return srv.response;

  const { data, error } = await srv.supabase.from("contents").select("*").eq("id", id).maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Impossible de récupérer ce contenu.", details: error.message },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json({ error: "Contenu introuvable." }, { status: 404 });
  }

  return NextResponse.json({ data: data as Content }, { status: 200 });
}
