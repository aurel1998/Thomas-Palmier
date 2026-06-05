import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/apiAuth";
import { mapOfferRow } from "../../../../lib/editorialMappers";
import { prisma } from "../../../../lib/prisma";

type OfferBody = {
  title?: unknown;
  tag?: unknown;
  position?: unknown;
};

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  try {
    const body = (await request.json()) as OfferBody;
    const updates: Record<string, string | number> = {};

    if (body.title !== undefined) {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title) return NextResponse.json({ error: "title invalide." }, { status: 400 });
      updates.title = title;
    }
    if (body.tag !== undefined) updates.tag = typeof body.tag === "string" ? body.tag.trim() : "";
    if (body.position !== undefined) {
      if (typeof body.position !== "number" || !Number.isFinite(body.position)) {
        return NextResponse.json({ error: "position invalide." }, { status: 400 });
      }
      updates.position = Math.max(0, Math.floor(body.position));
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "Aucune donnee a mettre a jour." }, { status: 400 });
    }

    const data = await prisma.collaborationOffer.update({ where: { id }, data: updates });
    return NextResponse.json({ data: mapOfferRow(data) }, { status: 200 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Offre introuvable." }, { status: 404 });
    }
    return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  try {
    await prisma.collaborationOffer.delete({ where: { id } });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Offre introuvable." }, { status: 404 });
    }
    return NextResponse.json({ error: "Impossible de supprimer." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
