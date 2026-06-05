import { NextResponse } from "next/server";
import { mapCategoryRow } from "../../../lib/dbMappers";
import { requireAdmin } from "../../../lib/apiAuth";
import { prisma } from "../../../lib/prisma";
import { resolveCatalogCategories } from "../../../lib/resolveCategories";

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
  try {
    const data = await prisma.category.findMany({
      orderBy: [{ position: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(
      { data: resolveCatalogCategories(data.map(mapCategoryRow)) },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ data: resolveCatalogCategories([]) }, { status: 200 });
  }
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

    const data = await prisma.category.create({
      data: { name, description, position },
    });
    return NextResponse.json({ data: mapCategoryRow(data) }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Cette categorie existe deja." },
        { status: 409 }
      );
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
    }
    return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
  }
}
