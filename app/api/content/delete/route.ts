import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/apiAuth";
import { revalidateContentCaches } from "../../../../lib/contentCache";
import { prisma } from "../../../../lib/prisma";

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

    const data = await prisma.content.delete({
      where: { id },
      select: { id: true },
    });
    revalidateContentCaches();
    return NextResponse.json({ data: { id: data.id, deleted: true } }, { status: 200 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Contenu introuvable." }, { status: 404 });
    }
    return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
  }
}
