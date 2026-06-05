import { NextResponse } from "next/server";
import { mapSubcategoryRow } from "../../../lib/dbMappers";
import { requireAdmin } from "../../../lib/apiAuth";
import { prisma } from "../../../lib/prisma";

type SubcategoryBody = {
  category_id?: unknown;
  name?: unknown;
  description?: unknown;
  position?: unknown;
};

/**
 * GET /api/subcategories
 * GET /api/subcategories?category_id=<uuid>
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category_id")?.trim() || undefined;

    const data = await prisma.subcategory.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: [{ position: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ data: data.map(mapSubcategoryRow) }, { status: 200 });
  } catch {
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}

/**
 * POST /api/subcategories
 * Body JSON : { category_id, name, description?, position? }
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as SubcategoryBody;
    const categoryId = typeof body.category_id === "string" ? body.category_id.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const position =
      typeof body.position === "number" && Number.isFinite(body.position)
        ? Math.max(0, Math.floor(body.position))
        : 100;

    if (!categoryId) {
      return NextResponse.json({ error: "Le champ 'category_id' est obligatoire." }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "Le champ 'name' est obligatoire." }, { status: 400 });
    }

    const parent = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
    if (!parent) {
      return NextResponse.json({ error: "Catégorie parente introuvable." }, { status: 404 });
    }

    const data = await prisma.subcategory.create({
      data: {
        categoryId,
        name,
        description,
        position,
        createdById: auth.session.user.id,
      },
    });

    return NextResponse.json({ data: mapSubcategoryRow(data) }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Cette rubrique existe déjà dans cette catégorie." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Corps de requête invalide (JSON attendu)." }, { status: 400 });
  }
}
