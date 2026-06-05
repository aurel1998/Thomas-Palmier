import { NextResponse } from "next/server";
import type { Content } from "../../../../types/content";
import { isAdminSession } from "../../../../lib/apiAuth";
import { mapContentRow } from "../../../../lib/dbMappers";
import { prisma } from "../../../../lib/prisma";

/** GET /api/content/:id - détail d'un contenu. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });
  }

  try {
    const data = await prisma.content.findUnique({ where: { id } });
    if (!data) {
      return NextResponse.json({ error: "Contenu introuvable." }, { status: 404 });
    }
    if (data.status === "draft" && !(await isAdminSession())) {
      return NextResponse.json({ error: "Contenu introuvable." }, { status: 404 });
    }
    return NextResponse.json({ data: mapContentRow(data) as Content }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Impossible de récupérer ce contenu.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
