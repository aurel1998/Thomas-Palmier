import { NextResponse } from "next/server";
import { mapSubcategoryRow } from "../../../../lib/dbMappers";
import { requireAdmin } from "../../../../lib/apiAuth";
import { prisma } from "../../../../lib/prisma";

type SubcategoryBody = {
  name?: unknown;
  description?: unknown;
  position?: unknown;
};

/**
 * PUT /api/subcategories/:id
 */
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  try {
    const body = (await request.json()) as SubcategoryBody;
    const updates: Record<string, string | number> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return NextResponse.json(
          { error: "Le champ 'name' doit être un texte non vide." },
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
          { error: "Le champ 'position' doit être un nombre." },
          { status: 400 }
        );
      }
      updates.position = Math.max(0, Math.floor(body.position));
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour." }, { status: 400 });
    }

    const data = await prisma.subcategory.update({ where: { id }, data: updates });
    return NextResponse.json({ data: mapSubcategoryRow(data) }, { status: 200 });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "P2025") {
      return NextResponse.json({ error: "Rubrique introuvable." }, { status: 404 });
    }
    if (code === "P2002") {
      return NextResponse.json(
        { error: "Cette rubrique existe déjà dans cette catégorie." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Corps de requête invalide (JSON attendu)." }, { status: 400 });
  }
}

/**
 * DELETE /api/subcategories/:id
 */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  try {
    await prisma.subcategory.delete({ where: { id } });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Rubrique introuvable." }, { status: 404 });
    }
    return NextResponse.json({ error: "Impossible de supprimer la rubrique." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
