import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/apiAuth";
import { mapOfferRow } from "../../../lib/editorialMappers";
import { getCollaborationOffersServer } from "../../../lib/editorialServer";
import { prisma } from "../../../lib/prisma";

type OfferBody = {
  title?: unknown;
  tag?: unknown;
  position?: unknown;
};

/** GET /api/collaboration-offers */
export async function GET() {
  try {
    const data = await getCollaborationOffersServer();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Impossible de charger les offres.", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/** POST /api/collaboration-offers */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as OfferBody;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return NextResponse.json({ error: "Le champ 'title' est obligatoire." }, { status: 400 });

    const position =
      typeof body.position === "number" && Number.isFinite(body.position)
        ? Math.max(0, Math.floor(body.position))
        : 100;

    const data = await prisma.collaborationOffer.create({
      data: {
        title,
        tag: typeof body.tag === "string" ? body.tag.trim() : "",
        position,
      },
    });

    return NextResponse.json({ data: mapOfferRow(data) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
  }
}
