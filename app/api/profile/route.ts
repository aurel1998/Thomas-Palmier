import { NextResponse } from "next/server";
import { getServerSupabaseOrResponse } from "../../../lib/supabaseServer";
import { requireAdmin } from "../../../lib/apiAuth";

type ProfileBody = {
  image_url?: unknown;
};

/**
 * GET /api/profile
 * Lecture publique du profil journaliste (photo dynamique).
 */
export async function GET() {
  const srv = getServerSupabaseOrResponse();
  if (!srv.ok) return srv.response;

  const { data, error } = await srv.supabase
    .from("journalist_profile")
    .select("image_url, updated_at")
    .eq("id", true)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Impossible de recuperer le profil.", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      data: {
        image_url: data?.image_url ?? "",
        updated_at: data?.updated_at ?? null,
      },
    },
    { status: 200 }
  );
}

/**
 * PUT /api/profile
 * Body JSON : { image_url }
 */
export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as ProfileBody;
    const imageUrl = typeof body.image_url === "string" ? body.image_url.trim() : "";

    const srv = getServerSupabaseOrResponse();
    if (!srv.ok) return srv.response;

    const { data, error } = await srv.supabase
      .from("journalist_profile")
      .upsert(
        {
          id: true,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select("image_url, updated_at")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Impossible de mettre a jour le profil.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
  }
}
