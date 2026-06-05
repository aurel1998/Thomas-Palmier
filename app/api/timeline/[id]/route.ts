import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/apiAuth";
import { revalidateEditorialCaches } from "../../../../lib/editorialCache";
import { mapTimelineRow } from "../../../../lib/editorialMappers";
import { prisma } from "../../../../lib/prisma";

type TimelineBody = {
  period?: unknown;
  title?: unknown;
  text?: unknown;
  position?: unknown;
};

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  try {
    const body = (await request.json()) as TimelineBody;
    const updates: Record<string, string | number> = {};

    if (body.period !== undefined) {
      const period = typeof body.period === "string" ? body.period.trim() : "";
      if (!period) return NextResponse.json({ error: "Le champ 'period' ne peut pas etre vide." }, { status: 400 });
      updates.period = period;
    }
    if (body.title !== undefined) {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title) return NextResponse.json({ error: "Le champ 'title' ne peut pas etre vide." }, { status: 400 });
      updates.title = title;
    }
    if (body.text !== undefined) {
      updates.text = typeof body.text === "string" ? body.text.trim() : "";
    }
    if (body.position !== undefined) {
      if (typeof body.position !== "number" || !Number.isFinite(body.position)) {
        return NextResponse.json({ error: "Le champ 'position' doit etre un nombre." }, { status: 400 });
      }
      updates.position = Math.max(0, Math.floor(body.position));
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "Aucune donnee a mettre a jour." }, { status: 400 });
    }

    const data = await prisma.timelineStep.update({ where: { id }, data: updates });
    revalidateEditorialCaches();
    return NextResponse.json({ data: mapTimelineRow(data) }, { status: 200 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Etape introuvable." }, { status: 404 });
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
    await prisma.timelineStep.delete({ where: { id } });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Etape introuvable." }, { status: 404 });
    }
    return NextResponse.json({ error: "Impossible de supprimer." }, { status: 500 });
  }

  revalidateEditorialCaches();
  return NextResponse.json({ ok: true }, { status: 200 });
}
