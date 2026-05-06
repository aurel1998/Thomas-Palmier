import { NextResponse } from "next/server";
import { getServerSupabaseOrResponse } from "../../../../lib/supabaseServer";
import { requireAdmin } from "../../../../lib/apiAuth";

type DeleteContentBody = {
  id?: unknown;
};

/**
 * DELETE /api/content/delete
 * Body JSON : { id }
 */
export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as DeleteContentBody;
    const id = typeof body.id === "string" ? body.id.trim() : "";

    if (!id) {
      return NextResponse.json({ error: "Le champ 'id' est obligatoire." }, { status: 400 });
    }

    const srv = getServerSupabaseOrResponse();
    if (!srv.ok) return srv.response;

    const { data, error } = await srv.supabase
      .from("contents")
      .delete()
      .eq("id", id)
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Impossible de supprimer le contenu.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { id: data.id, deleted: true } }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
  }
}
