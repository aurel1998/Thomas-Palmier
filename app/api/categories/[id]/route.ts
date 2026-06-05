import { NextResponse } from "next/server";
import { mapCategoryRow } from "../../../../lib/dbMappers";
import { requireAdmin } from "../../../../lib/apiAuth";
import { prisma } from "../../../../lib/prisma";

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

    const data = await prisma.category.update({
      where: { id },
      data: updates,
    });
    return NextResponse.json({ data: mapCategoryRow(data) }, { status: 200 });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "P2025") {
      return NextResponse.json({ error: "Categorie introuvable." }, { status: 404 });
    }
    if (code === "P2002") {
      return NextResponse.json({ error: "Cette categorie existe deja." }, { status: 409 });
    }
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

  try {
    await prisma.category.delete({ where: { id } });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Categorie introuvable." }, { status: 404 });
    }
    return NextResponse.json({ error: "Impossible de supprimer la categorie." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
